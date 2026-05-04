import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { ...CORS, 'Content-Type': 'application/json' } });

function formatPHPhone(num: string): string {
  const digits = num.replace(/\D/g, '');
  if (digits.startsWith('63') && digits.length === 12) return '0' + digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) return digits;
  if (digits.startsWith('9') && digits.length === 10) return '0' + digits;
  return digits;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { gymId, recipient, message } = await req.json();
    if (!gymId || !recipient || !message) {
      return json({ ok: false, error: 'Missing required fields' });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: gym } = await supabase
      .from('gym_settings')
      .select('semaphore_api_key, semaphore_sender_name')
      .eq('gym_id', gymId)
      .single();

    const apiKey = gym?.semaphore_api_key;
    const senderName = gym?.semaphore_sender_name || '';

    if (!apiKey) {
      return json({ ok: false, error: 'Semaphore not configured for this gym' });
    }

    const number = formatPHPhone(recipient);
    const payload: Record<string, string> = { apikey: apiKey, number, message };
    if (senderName) payload.sendername = senderName;

    const res = await fetch('https://api.semaphore.co/api/v4/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log('Semaphore response:', JSON.stringify(data));

    const msg = Array.isArray(data) ? data[0] : data;
    if (!res.ok || msg?.status === 'Failed') {
      const errMsg =
        msg?.message ||
        msg?.senderName ||
        Object.values(msg || {}).find((v) => typeof v === 'string') ||
        `Semaphore error ${res.status}`;
      return json({ ok: false, error: errMsg });
    }

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: (err as Error).message ?? 'Unknown error' });
  }
});
