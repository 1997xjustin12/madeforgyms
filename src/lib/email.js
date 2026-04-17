import { supabase } from './supabase';

const PLATFORM_EMAIL  = import.meta.env.VITE_PLATFORM_EMAIL;
const SUPABASE_URL    = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON   = import.meta.env.VITE_SUPABASE_ANON_KEY;
const EDGE_FN_URL     = `${SUPABASE_URL}/functions/v1/send-email`;

async function sendEmail({ to, subject, html, type }) {
  let status = 'sent';
  let error  = null;
  try {
    const res = await fetch(EDGE_FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
      },
      body: JSON.stringify({ to, subject, html }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  } catch (err) {
    status = 'failed';
    error  = err.message;
    console.error('Email failed:', err);
  } finally {
    await supabase.from('email_logs').insert([{ to_email: to, subject, type, status, error }]);
  }
}

/* ── Sent to gym owner on registration ─────────────────────── */
export async function sendRegistrationConfirmation({ ownerName, ownerEmail, gymName, slug }) {
  await sendEmail({
    to: ownerEmail,
    type: 'registration',
    subject: `We received your application — ${gymName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0f1a;color:#f1f5f9;border-radius:16px;">
        <div style="margin-bottom:24px;">
          <span style="background:linear-gradient(135deg,#16a34a,#4ade80);padding:8px 16px;border-radius:8px;font-weight:900;font-size:18px;color:#fff;">MadeForGyms</span>
        </div>
        <h1 style="font-size:22px;font-weight:900;margin-bottom:8px;color:#fff;">Application received! ⏳</h1>
        <p style="color:#94a3b8;margin-bottom:24px;">
          Hi ${ownerName}, thanks for applying to join MadeForGyms! We've received your registration for <strong style="color:#fff;">${gymName}</strong> and will review it shortly.
        </p>

        <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;margin-bottom:24px;">
          <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;">Your portal URL (available after approval):</p>
          <p style="color:#4ade80;font-weight:700;font-size:15px;margin:0;">madeforgyms.com/${slug}</p>
        </div>

        <p style="color:#94a3b8;font-size:13px;">You'll receive another email once your application is approved. If you have any questions, reply to this email.</p>

        <p style="color:#475569;font-size:11px;margin-top:32px;">MadeForGyms · madeforgyms.com</p>
      </div>
    `,
  });
}

/* ── Sent to platform owner on new registration ─────────────── */
export async function sendNewApplicationAlert({ ownerName, ownerEmail, ownerContact, gymName, slug }) {
  if (!PLATFORM_EMAIL) return;
  await sendEmail({
    to: PLATFORM_EMAIL,
    type: 'alert',
    subject: `New gym application — ${gymName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0f1a;color:#f1f5f9;border-radius:16px;">
        <div style="margin-bottom:24px;">
          <span style="background:linear-gradient(135deg,#16a34a,#4ade80);padding:8px 16px;border-radius:8px;font-weight:900;font-size:18px;color:#fff;">MadeForGyms</span>
        </div>
        <h1 style="font-size:22px;font-weight:900;margin-bottom:8px;color:#fff;">New gym application 🏋️</h1>
        <p style="color:#94a3b8;margin-bottom:20px;">A new gym has applied to join the platform.</p>

        <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;margin-bottom:24px;space-y:8px;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr><td style="color:#64748b;padding:4px 0;width:120px;">Gym Name</td><td style="color:#fff;font-weight:700;">${gymName}</td></tr>
            <tr><td style="color:#64748b;padding:4px 0;">Portal URL</td><td style="color:#4ade80;">madeforgyms.com/${slug}</td></tr>
            <tr><td style="color:#64748b;padding:4px 0;">Owner</td><td style="color:#fff;">${ownerName}</td></tr>
            <tr><td style="color:#64748b;padding:4px 0;">Email</td><td style="color:#fff;">${ownerEmail}</td></tr>
            <tr><td style="color:#64748b;padding:4px 0;">Contact</td><td style="color:#fff;">${ownerContact || '—'}</td></tr>
          </table>
        </div>

        <a href="https://madeforgyms.com/mfg/admin"
          style="display:inline-block;background:linear-gradient(135deg,#16a34a,#4ade80);color:#fff;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;">
          Review in Platform Admin →
        </a>

        <p style="color:#475569;font-size:11px;margin-top:32px;">MadeForGyms · madeforgyms.com</p>
      </div>
    `,
  });
}

/* ── Sent to gym owner on approval (used in PlatformAdmin) ──── */
export async function sendApprovalEmail({ ownerName, ownerEmail, gymName, slug }) {
  await sendEmail({
    to: ownerEmail,
    type: 'approval',
    subject: `✅ Your gym "${gymName}" is now live on MadeForGyms!`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0f1a;color:#f1f5f9;border-radius:16px;">
        <div style="margin-bottom:24px;">
          <span style="background:linear-gradient(135deg,#16a34a,#4ade80);padding:8px 16px;border-radius:8px;font-weight:900;font-size:18px;color:#fff;">MadeForGyms</span>
        </div>
        <h1 style="font-size:22px;font-weight:900;margin-bottom:8px;color:#fff;">Your gym is approved! 🎉</h1>
        <p style="color:#94a3b8;margin-bottom:24px;">Hi ${ownerName || 'there'}, your gym <strong style="color:#fff;">${gymName}</strong> has been approved and is now live.</p>

        <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;margin-bottom:24px;">
          <p style="color:#94a3b8;font-size:13px;margin:0 0 6px;">Your portal URL:</p>
          <a href="https://madeforgyms.com/${slug}" style="color:#4ade80;font-weight:700;font-size:16px;text-decoration:none;">madeforgyms.com/${slug}</a>
        </div>

        <p style="color:#94a3b8;font-size:13px;margin-bottom:24px;">Log in to your admin portal to complete your setup — add your GCash details, membership prices, and start onboarding members.</p>

        <a href="https://madeforgyms.com/${slug}/admin/login"
          style="display:inline-block;background:linear-gradient(135deg,#16a34a,#4ade80);color:#fff;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;">
          Go to Admin Portal →
        </a>

        <p style="color:#475569;font-size:11px;margin-top:32px;">MadeForGyms · madeforgyms.com</p>
      </div>
    `,
  });
}
