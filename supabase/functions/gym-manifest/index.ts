import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');

  if (!slug) {
    return new Response(JSON.stringify({ error: 'slug is required' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data: gym } = await supabase
    .from('gyms')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (!gym) {
    return new Response(JSON.stringify({ error: 'Gym not found' }), {
      status: 404,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const { data: settings } = await supabase
    .from('gym_settings')
    .select('gym_name, gym_logo_url')
    .eq('gym_id', gym.id)
    .maybeSingle();

  const gymName = settings?.gym_name || gym.name || 'Gym';
  const logoUrl = settings?.gym_logo_url || null;
  const siteUrl = Deno.env.get('SITE_URL') || 'https://www.madeforgyms.com';

  const icons = logoUrl
    ? [
        { src: logoUrl, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: logoUrl, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ]
    : [
        { src: `${siteUrl}/favicon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      ];

  const manifest = {
    name: gymName,
    short_name: gymName.length > 12 ? gymName.split(' ')[0] : gymName,
    description: `Check your membership at ${gymName}`,
    start_url: `/${slug}/member`,
    scope: `/${slug}/`,
    display: 'standalone',
    background_color: '#030712',
    theme_color: '#16a34a',
    orientation: 'portrait-primary',
    icons,
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      ...CORS,
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});
