import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [gymSlug, setGymSlug] = useState(null);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    const error = params.get('error');
    const errorCode = params.get('error_code');

    if (error) {
      if (errorCode === 'otp_expired') {
        setMessage('This confirmation link has expired. Please request a new one from your admin settings.');
      } else {
        setMessage(params.get('error_description')?.replace(/\+/g, ' ') || 'Something went wrong.');
      }
      setStatus('error');
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setStatus('success');
        setMessage('Your email has been confirmed successfully!');
        // Try to find the gym slug to redirect back to admin settings
        supabase.from('gym_admins')
          .select('gyms(slug)')
          .eq('user_id', data.session.user.id)
          .maybeSingle()
          .then(({ data: row }) => {
            if (row?.gyms?.slug) setGymSlug(row.gyms.slug);
          });
      } else {
        setStatus('error');
        setMessage('Could not verify your session. Please try again.');
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        {status === 'loading' && (
          <>
            <Loader2 size={40} className="text-green-400 animate-spin mx-auto mb-4" />
            <p className="text-white font-semibold">Verifying...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}>
              <CheckCircle size={36} className="text-green-400" />
            </div>
            <h1 className="text-white font-black text-2xl mb-2">Email Confirmed!</h1>
            <p className="text-slate-400 text-sm mb-6">{message}</p>
            <a
              href={gymSlug ? `/${gymSlug}/admin/settings` : '/'}
              className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)' }}
            >
              {gymSlug ? 'Go to Admin Settings' : 'Go to Home'}
            </a>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)' }}>
              <XCircle size={36} className="text-red-400" />
            </div>
            <h1 className="text-white font-black text-2xl mb-2">Link Expired</h1>
            <p className="text-slate-400 text-sm mb-6">{message}</p>
            <a
              href="/"
              className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)' }}
            >
              Go to Home
            </a>
          </>
        )}
      </div>
    </div>
  );
}
