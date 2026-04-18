import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const hash = window.location.hash;

    // Parse hash params
    const params = new URLSearchParams(hash.replace('#', ''));
    const error = params.get('error');
    const errorDesc = params.get('error_description');

    if (error) {
      const msg = errorDesc?.replace(/\+/g, ' ') || error;
      if (error === 'access_denied' && params.get('error_code') === 'otp_expired') {
        setMessage('This confirmation link has expired. Please request a new one from your admin settings.');
      } else {
        setMessage(msg);
      }
      setStatus('error');
      return;
    }

    // Let Supabase process the token from the hash
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setStatus('success');
        setMessage('Your email has been confirmed successfully!');
        setTimeout(() => navigate(-1), 2500);
      } else {
        setStatus('error');
        setMessage('Could not verify your session. Please try again.');
      }
    });
  }, [navigate]);

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
            <p className="text-slate-400 text-sm">{message}</p>
            <p className="text-slate-600 text-xs mt-3">Redirecting you back...</p>
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
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)' }}
            >
              Go Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
