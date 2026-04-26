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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { gymId, recipient, message } = await req.json();
    if (!gymId || !recipient || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: gym } = await supabase
      .from('gym_settings')
      .select('philsms_token, philsms_sender_id')
      .eq('gym_id', gymId)
      .single();

    const token = gym?.philsms_token;
    const senderId = gym?.philsms_sender_id || 'PhilSMS';

    if (!token) {
      return new Response(JSON.stringify({ error: 'PhilSMS not configured for this gym' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const phone = formatPHPhone(recipient);

    const res = await fetch('https://dashboard.philsms.com/api/v3/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ recipient: phone, sender_id: senderId, type: 'plain', message }),
    });

    const data = await res.json();
    console.log('PhilSMS response:', JSON.stringify(data));

    if (!res.ok || data.status === 'error' || data.success === false) {
      const errMsg = data.message || data.error || `PhilSMS error ${res.status}`;
      return new Response(JSON.stringify({ error: errMsg, raw: data }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, raw: data }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
