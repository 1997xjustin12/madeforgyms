import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Dumbbell, LogIn, ArrowLeft } from 'lucide-react';
import { useGym } from '../context/GymContext';

export default function CoachLogin() {
  const navigate = useNavigate();
  const { settings } = useGym();
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError('');

    try {
      const { data, error: dbErr } = await supabase
        .from('instructors')
        .select('id, is_active')
        .eq('access_code', trimmed)
        .single();

      if (dbErr || !data) {
        setError('Invalid access code. Please try again.');
        return;
      }
      if (!data.is_active) {
        setError('Your account is currently inactive. Contact the admin.');
        return;
      }

      navigate(`/coach/${trimmed}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Glow orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(250,204,21,0.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-sm">

        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        {/* Branding */}
        <div className="flex flex-col items-center gap-3 mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.25)' }}>
            <Dumbbell size={28} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-white font-bold text-xl">Coach Portal</p>
            <p className="text-slate-400 text-sm">{settings.gymName || 'MadeForGyms'}</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 p-6 shadow-2xl space-y-5"
          style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.2)' }}>
              <Dumbbell size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-white font-bold">Sign In</p>
              <p className="text-slate-400 text-sm">Enter your coach access code</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
                placeholder="Access Code (e.g. JOHN01)"
                autoComplete="off"
                autoCapitalize="characters"
                className="w-full border text-white rounded-xl px-4 py-3.5 outline-none text-sm font-mono tracking-widest placeholder:text-slate-500 placeholder:font-sans placeholder:tracking-normal transition-colors text-center text-lg"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(250,204,21,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              {error && (
                <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #ca8a04, #facc15)', boxShadow: '0 0 20px rgba(250,204,21,0.2)', color: '#1a1a00' }}
            >
              {loading
                ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                : <><LogIn size={18} /> Enter Portal</>}
            </button>
          </form>
        </div>

        <p className="text-slate-600 text-xs mt-6 text-center">Access code provided by your gym admin</p>
      </div>
    </div>
  );
}
