import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getPHDate(offsetDays = 0): string {
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000 + offsetDays * 86400000);
  return now.toISOString().split('T')[0];
}

function addMonthsToDate(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const today = getPHDate(0);
  const todayStart = `${today}T00:00:00+08:00`;

  const { data: gyms } = await supabase
    .from('gym_settings')
    .select('gym_id, gym_name, price_monthly');

  let totalAutoApplied = 0;

  for (const gym of (gyms || [])) {
    const monthlyPrice = Number(gym.price_monthly) || 0;

    const { data: members } = await supabase
      .from('members')
      .select('id, name, membership_end_date')
      .eq('gym_id', gym.gym_id)
      .eq('membership_end_date', today);

    if (!members?.length) continue;

    for (const member of members) {
      const { data: queuedPayments } = await supabase
        .from('advance_payments')
        .select('id, amount')
        .eq('gym_id', gym.gym_id)
        .eq('member_id', member.id)
        .eq('status', 'queued');

      if (!queuedPayments?.length) continue;

      const { data: alreadyApplied } = await supabase
        .from('activity_logs')
        .select('id')
        .eq('gym_id', gym.gym_id)
        .eq('member_id', member.id)
        .eq('action', 'AUTO_ADVANCE_APPLIED')
        .gte('created_at', todayStart)
        .maybeSingle();

      if (alreadyApplied) continue;

      const totalAmount = queuedPayments.reduce((s: number, p: { amount: number }) => s + Number(p.amount || 0), 0);

      let monthsToAdd = 1;
      let excess = 0;
      if (monthlyPrice > 0) {
        const affordable = Math.floor(totalAmount / monthlyPrice);
        monthsToAdd = affordable >= 1 ? affordable : 1;
        excess = totalAmount - monthsToAdd * monthlyPrice;
        if (excess < 0) excess = 0;
      }

      const newEnd = addMonthsToDate(member.membership_end_date, monthsToAdd);

      await supabase.from('members')
        .update({ membership_end_date: newEnd, updated_at: new Date().toISOString() })
        .eq('id', member.id);

      const ids = queuedPayments.map((p: { id: string }) => p.id);
      await supabase.from('advance_payments')
        .update({ status: 'applied', applied_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .in('id', ids);

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
    }
  }

  return new Response(JSON.stringify({ ok: true, autoApplied: totalAutoApplied, date: today }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
