import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, Mail, ShieldAlert } from 'lucide-react';
import { useGym } from '../context/GymContext';
import toast from 'react-hot-toast';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;
const STORAGE_KEY = 'gym_login_meta';

const getLoginMeta = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { attempts: 0, lockedUntil: null };
  } catch {
    return { attempts: 0, lockedUntil: null };
  }
};

const saveLoginMeta = (meta) => localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
const clearLoginMeta = () => localStorage.removeItem(STORAGE_KEY);

export default function AdminLogin() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [attemptsLeft, setAttemptsLeft]   = useState(MAX_ATTEMPTS);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const { adminLogin, isAdminLoggedIn, settings } = useGym();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdminLoggedIn) navigate('/admin', { replace: true });
  }, [isAdminLoggedIn, navigate]);

  useEffect(() => {
    const tick = () => {
      const meta = getLoginMeta();
      if (meta.lockedUntil) {
        const remaining = Math.ceil((meta.lockedUntil - Date.now()) / 1000);
        if (remaining > 0) {
          setLockoutSeconds(remaining);
          setAttemptsLeft(0);
        } else {
          clearLoginMeta();
          setLockoutSeconds(0);
          setAttemptsLeft(MAX_ATTEMPTS);
        }
      } else {
        setAttemptsLeft(MAX_ATTEMPTS - (meta.attempts || 0));
        setLockoutSeconds(0);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const isLocked = lockoutSeconds > 0;

  const formatLockout = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    setLoading(true);
    try {
      await adminLogin(email, password);
      clearLoginMeta();
      toast.success('Welcome, Admin!');
      navigate('/admin');
    } catch {
      const meta = getLoginMeta();
      const newAttempts = (meta.attempts || 0) + 1;
      if (newAttempts >= MAX_ATTEMPTS) {
        const lockedUntil = Date.now() + LOCKOUT_MS;
        saveLoginMeta({ attempts: newAttempts, lockedUntil });
        setLockoutSeconds(Math.ceil(LOCKOUT_MS / 1000));
        setAttemptsLeft(0);
        toast.error('Too many failed attempts. Locked for 5 minutes.');
      } else {
        saveLoginMeta({ attempts: newAttempts, lockedUntil: null });
        setAttemptsLeft(MAX_ATTEMPTS - newAttempts);
        toast.error(`Incorrect credentials. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? 's' : ''} left.`);
      }
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-4 sm:px-6 relative overflow-hidden">

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Glow orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', boxShadow: '0 0 60px rgba(34,197,94,0.06)' }}>

          {/* Back */}
          <Link to="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>

          {/* Branding */}
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)', boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}>
              <Lock size={22} className="text-white" />
            </div>
            <h1 className="text-white font-black text-xl tracking-tight">
              {settings.gymName || 'MadeForGyms'}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Admin Portal</p>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-8">Sign in with your admin credentials</p>

          {/* Lockout banner */}
          {isLocked && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <ShieldAlert size={20} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold text-sm">Account Locked</p>
                <p className="text-red-400/70 text-xs mt-0.5">
                  Too many failed attempts. Try again in{' '}
                  <span className="font-mono font-bold">{formatLockout(lockoutSeconds)}</span>
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@yourgym.com"
                  required
                  disabled={isLocked}
                  className="w-full border disabled:opacity-40 text-white rounded-xl pl-10 pr-4 py-3.5 outline-none transition-colors placeholder:text-slate-600"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(74,222,128,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  disabled={isLocked}
                  className="w-full border disabled:opacity-40 text-white rounded-xl pl-10 pr-12 py-3.5 outline-none transition-colors placeholder:text-slate-600"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(74,222,128,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Attempts warning */}
            {!isLocked && attemptsLeft < MAX_ATTEMPTS && attemptsLeft > 0 && (
              <p className="text-yellow-400 text-xs text-center">
                {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining before lockout
              </p>
            )}

            <button
              type="submit"
              disabled={loading || isLocked || !email || !password}
              className="w-full font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-40 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)', boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isLocked ? (
                `Locked · ${formatLockout(lockoutSeconds)}`
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
