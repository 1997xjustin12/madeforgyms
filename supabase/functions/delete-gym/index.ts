import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { gym_id } = await req.json();
    if (!gym_id) {
      return new Response(JSON.stringify({ error: 'gym_id is required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get the user_ids linked to this gym before deleting
    const { data: admins } = await supabase
      .from('gym_admins')
      .select('user_id')
      .eq('gym_id', gym_id);

    // Delete DB records in dependency order
    await supabase.from('renewal_requests').delete().eq('gym_id', gym_id);
    await supabase.from('members').delete().eq('gym_id', gym_id);
    await supabase.from('gym_admins').delete().eq('gym_id', gym_id);
    await supabase.from('gym_settings').delete().eq('gym_id', gym_id);
    await supabase.from('gyms').delete().eq('id', gym_id);

    // Delete auth users
    if (admins && admins.length > 0) {
      for (const admin of admins) {
        if (admin.user_id) {
          await supabase.auth.admin.deleteUser(admin.user_id);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
