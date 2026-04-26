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
  // Philippine time is UTC+8
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000 + offsetDays * 86400000);
  return now.toISOString().split('T')[0];
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
    .select('gym_id, philsms_token, philsms_sender_id, gym_name');

  const activeGyms = (gyms || []).filter((g) => g.philsms_token);

  let totalSent = 0;

  for (const gym of activeGyms) {
    const token = gym.philsms_token;
    const senderId = gym.philsms_sender_id || 'PhilSMS';
    const gymName = gym.gym_name || 'Your Gym';

    // Members expiring today or in exactly 3 days
    const { data: members } = await supabase
      .from('members')
      .select('id, name, contact_number, membership_end_date')
      .eq('gym_id', gym.gym_id)
      .in('membership_end_date', [today, in3Days]);

    if (!members?.length) continue;

    for (const member of members) {
      if (!member.contact_number) continue;

      const isExpiredToday = member.membership_end_date === today;
      const action = isExpiredToday ? 'AUTO_SMS_EXPIRED' : 'AUTO_SMS_EXPIRING';

      // Skip if already sent today for this member + action
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

      try {
        const res = await fetch('https://dashboard.philsms.com/api/v3/sms/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ recipient: phone, sender_id: senderId, type: 'plain', message }),
        });

        if (res.ok) {
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
          const err = await res.json().catch(() => ({}));
          console.error(`PhilSMS failed for ${member.name}:`, err);
        }
      } catch (err) {
        console.error(`SMS send exception for ${member.name}:`, err);
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, sent: totalSent, date: today }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
