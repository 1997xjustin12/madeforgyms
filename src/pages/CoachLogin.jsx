import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Dumbbell, LogIn } from 'lucide-react';
import GymLogo from '../components/GymLogo';

export default function CoachLogin() {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mb-10">
        <GymLogo size={64} />
        <div className="text-center">
          <p className="text-white font-bold text-xl">Coach Portal</p>
          <p className="text-slate-400 text-sm">Power Fitness Gym</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center shrink-0">
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
              className="w-full bg-slate-700 border border-slate-600 focus:border-yellow-500 text-white rounded-xl px-4 py-3.5 outline-none text-sm font-mono tracking-widest placeholder:text-slate-500 placeholder:font-sans placeholder:tracking-normal transition-colors text-center text-lg"
            />
            {error && (
              <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            {loading
              ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><LogIn size={18} /> Enter Portal</>}
          </button>
        </form>
      </div>

      <p className="text-slate-600 text-xs mt-6">Access code provided by your gym admin</p>
    </div>
  );
}
