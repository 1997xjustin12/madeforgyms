import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatPHPhone(num: string): string {
  const digits = num.replace(/\D/g, '');
  if (digits.startsWith('63') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 11) return '63' + digits.slice(1);
  if (digits.startsWith('9') && digits.length === 10) return '63' + digits;
  return digits;
}

function getPHDate(offsetDays = 0): string {
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000 + offsetDays * 86400000);
  return now.toISOString().split('T')[0];
}

function addMonthsToDate(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function formatPHPhoneLocal(num: string): string {
  const digits = num.replace(/\D/g, '');
  if (digits.startsWith('63') && digits.length === 12) return '0' + digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) return digits;
  if (digits.startsWith('9') && digits.length === 10) return '0' + digits;
  return digits;
}

async function sendSMS(apiKey: string, senderName: string, phone: string, message: string): Promise<boolean> {
  try {
    const number = formatPHPhoneLocal(phone);
    const res = await fetch('https://api.semaphore.co/api/v4/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(senderName ? { apikey: apiKey, number, message, sendername: senderName } : { apikey: apiKey, number, message }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    const msg = Array.isArray(data) ? data[0] : data;
    return msg?.status !== 'Failed';
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const today = getPHDate(0);
  const in3Days = getPHDate(3);
  const todayStart = `${today}T00:00:00+08:00`;

  const { data: gyms } = await supabase
    .from('gym_settings')
    .select('gym_id, semaphore_api_key, semaphore_sender_name, gym_name, price_monthly');

  let totalSent = 0;
  let totalAutoApplied = 0;

  for (const gym of (gyms || [])) {
    const gymName = gym.gym_name || 'Your Gym';
    const monthlyPrice = Number(gym.price_monthly) || 0;
    const hasSMS = !!gym.semaphore_api_key;
    const apiKey = gym.semaphore_api_key;
    const senderName = gym.semaphore_sender_name || 'SEMAPHORE';

    const { data: members } = await supabase
      .from('members')
      .select('id, name, contact_number, membership_end_date')
      .eq('gym_id', gym.gym_id)
      .in('membership_end_date', [today, in3Days]);

    if (!members?.length) continue;

    for (const member of members) {
      const isExpiredToday = member.membership_end_date === today;

      // ── AUTO-APPLY advance payments on expiry day ──────────────
      if (isExpiredToday) {
        const { data: queuedPayments } = await supabase
          .from('advance_payments')
          .select('id, amount')
          .eq('gym_id', gym.gym_id)
          .eq('member_id', member.id)
          .eq('status', 'queued');

        if (queuedPayments?.length) {
          // Guard: don't apply twice on the same day
          const { data: alreadyApplied } = await supabase
            .from('activity_logs')
            .select('id')
            .eq('gym_id', gym.gym_id)
            .eq('member_id', member.id)
            .eq('action', 'AUTO_ADVANCE_APPLIED')
            .gte('created_at', todayStart)
            .maybeSingle();

          if (!alreadyApplied) {
            const totalAmount = queuedPayments.reduce((s: number, p: { amount: number }) => s + Number(p.amount || 0), 0);

            // Calculate months to extend
            let monthsToAdd = 1;
            let excess = 0;
            if (monthlyPrice > 0) {
              const affordable = Math.floor(totalAmount / monthlyPrice);
              monthsToAdd = affordable >= 1 ? affordable : 1;
              excess = totalAmount - monthsToAdd * monthlyPrice;
              if (excess < 0) excess = 0;
            }

            const newEnd = addMonthsToDate(member.membership_end_date, monthsToAdd);

            // Update membership
            await supabase.from('members')
              .update({ membership_end_date: newEnd, updated_at: new Date().toISOString() })
              .eq('id', member.id);

            // Mark all queued payments as applied
            const ids = queuedPayments.map((p: { id: string }) => p.id);
            await supabase.from('advance_payments')
              .update({ status: 'applied', applied_at: new Date().toISOString(), updated_at: new Date().toISOString() })
              .in('id', ids);

            // Carry excess forward
            if (excess > 0) {
              await supabase.from('advance_payments').insert([{
                gym_id: gym.gym_id,
                member_id: member.id,
                member_name: member.name,
                amount: excess,
                notes: `Excess carry-forward from ₱${totalAmount.toLocaleString()} auto-applied payment`,
                status: 'queued',
              }]);
            }

            await supabase.from('activity_logs').insert([{
              gym_id: gym.gym_id,
              member_id: member.id,
              member_name: member.name,
              action: 'AUTO_ADVANCE_APPLIED',
              description: `Auto-applied ₱${totalAmount.toLocaleString()} advance → ${monthsToAdd} month(s). New expiry: ${newEnd}${excess > 0 ? `. ₱${excess.toLocaleString()} carried forward.` : ''}`,
              performed_by: 'System',
            }]);

            totalAutoApplied++;

            // Send renewal SMS if SMS is configured and member has a number
            if (hasSMS && member.contact_number) {
              const phone = formatPHPhone(member.contact_number);
              const msg = `Hi ${member.name}! Your ${gymName} membership has been auto-renewed using your advance payment. New expiry: ${newEnd}. Thank you!`;
              const sent = await sendSMS(apiKey, senderName, phone, msg);
              if (sent) totalSent++;
            }
          }

          continue; // skip expired SMS
        }
      } else {
        // Expiring in 3 days — skip reminder if advance payment is queued
        const { data: advPayment } = await supabase
          .from('advance_payments')
          .select('id')
          .eq('gym_id', gym.gym_id)
          .eq('member_id', member.id)
          .eq('status', 'queued')
          .limit(1)
          .maybeSingle();

        if (advPayment) continue;
      }

      // ── Regular expiry / reminder SMS ──────────────────────────
      if (!hasSMS || !member.contact_number) continue;

      const action = isExpiredToday ? 'AUTO_SMS_EXPIRED' : 'AUTO_SMS_EXPIRING';

      const { data: already } = await supabase
        .from('activity_logs')
        .select('id')
        .eq('gym_id', gym.gym_id)
        .eq('member_id', member.id)
        .eq('action', action)
        .gte('created_at', todayStart)
        .maybeSingle();

      if (already) continue;

      const message = isExpiredToday
        ? `Hi ${member.name}! Your ${gymName} membership has EXPIRED today. Please renew to continue. Visit us or contact the gym. Thank you!`
        : `Hi ${member.name}! Your ${gymName} membership expires in 3 days. Please renew soon to avoid interruption. Thank you!`;

      const phone = formatPHPhone(member.contact_number);
      const sent = await sendSMS(apiKey, senderName, phone, message);

      if (sent) {
        await supabase.from('activity_logs').insert([{
          gym_id: gym.gym_id,
          member_id: member.id,
          member_name: member.name,
          action,
          description: isExpiredToday
            ? `Auto SMS sent: membership expired today`
            : `Auto SMS sent: membership expiring in 3 days`,
          performed_by: 'System',
        }]);
        totalSent++;
      } else {
        console.error(`SMS failed for ${member.name}`);
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, smsSent: totalSent, autoApplied: totalAutoApplied, date: today }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
