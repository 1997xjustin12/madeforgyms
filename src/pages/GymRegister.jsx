import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { sendRegistrationConfirmation, sendNewApplicationAlert } from '../lib/email';
import { Dumbbell, Eye, EyeOff, Clock, Check, ArrowLeft, Loader2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

function nameToSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '')
    .slice(0, 40);
}

function pwStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLOR = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-400', 'bg-green-500'];

const STEPS = [
  { label: 'About You' },
  { label: 'Your Gym' },
  { label: 'Your Account' },
];

export default function GymRegister() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    ownerName: '',
    ownerContact: '',
    gymName: '',
    slug: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPw, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [slugEdited, setSlugEdited]   = useState(false);
  const [slugAvail, setSlugAvail]     = useState(null);
  const [checking, setChecking]       = useState(false);
  const [emailAvail, setEmailAvail]   = useState(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [usernameAvail, setUsernameAvail]   = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [done, setDone]               = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleGymName = (val) => {
    set('gymName', val);
    if (!slugEdited) {
      const auto = nameToSlug(val);
      set('slug', auto);
      setSlugAvail(null);
    }
  };

  const handleSlug = (val) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
    set('slug', cleaned);
    setSlugEdited(true);
    setSlugAvail(null);
  };

  const checkSlug = async (slug) => {
    const s = (slug ?? form.slug).trim();
    if (s.length < 3) return;
    setChecking(true);
    const { data } = await supabase.from('gyms').select('id').eq('slug', s).maybeSingle();
    setSlugAvail(!data);
    setChecking(false);
  };

  useEffect(() => {
    const s = form.slug.trim();
    if (s.length < 3) { setSlugAvail(null); return; }
    const timer = setTimeout(() => checkSlug(s), 600);
    return () => clearTimeout(timer);
  }, [form.slug]);

  useEffect(() => {
    const email = form.email.trim().toLowerCase();
    if (!email.includes('@') || email.length < 5) { setEmailAvail(null); return; }
    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      const { data } = await supabase.from('gyms').select('id').eq('owner_email', email).maybeSingle();
      setEmailAvail(!data);
      setCheckingEmail(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [form.email]);

  useEffect(() => {
    const username = form.username.trim().toLowerCase();
    if (username.length < 3) { setUsernameAvail(null); return; }
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      const { data } = await supabase.from('gym_admins').select('id').eq('username', username).maybeSingle();
      setUsernameAvail(!data);
      setCheckingUsername(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [form.username]);

  const strength = pwStrength(form.password);

  const step1Valid =
    form.ownerName.trim().length >= 2 &&
    form.ownerContact.trim().length >= 7;

  const step2Valid =
    form.gymName.trim().length >= 2 &&
    form.slug.length >= 3 &&
    slugAvail === true;

  const step3Valid =
    form.username.trim().length >= 3 &&
    usernameAvail === true &&
    form.email.includes('@') &&
    emailAvail === true &&
    form.password.length >= 8 &&
    form.password === form.confirmPassword;

  const canSubmit = step1Valid && step2Valid && step3Valid && !submitting;

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 0 && step1Valid) setStep(1);
    else if (step === 1 && step2Valid) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const slug    = form.slug.trim();
      const gymName = form.gymName.trim();

      const { data: existing } = await supabase.from('gyms').select('id').eq('slug', slug).maybeSingle();
      if (existing) {
        toast.error('That URL is already taken. Choose another.');
        setSlugAvail(false);
        setStep(1);
        return;
      }

      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      if (authErr) throw authErr;
      if (!authData.user) throw new Error('Account creation failed.');

      const { data: gymRow, error: gymErr } = await supabase
        .from('gyms')
        .insert([{
          name:          gymName,
          slug,
          status:        'pending',
          owner_name:    form.ownerName.trim().replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()),
          owner_contact: form.ownerContact.trim(),
          owner_email:   form.email.trim().toLowerCase(),
        }])
        .select()
        .single();
      if (gymErr) throw gymErr;

      const { error: gaErr } = await supabase
        .from('gym_admins')
        .insert([{ gym_id: gymRow.id, user_id: authData.user.id, email: form.email.trim().toLowerCase(), username: form.username.trim().toLowerCase() }]);
      if (gaErr) throw gaErr;

      await supabase.from('gym_settings').insert([{ gym_id: gymRow.id, gym_name: gymName }]);

      await Promise.all([
        sendRegistrationConfirmation({ ownerName: form.ownerName, ownerEmail: form.email.trim().toLowerCase(), gymName, slug }),
        sendNewApplicationAlert({ ownerName: form.ownerName, ownerEmail: form.email.trim().toLowerCase(), ownerContact: form.ownerContact, gymName, slug }),
      ]);

      await supabase.auth.signOut();
      setDone(true);
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success screen ─────────────────────────────────────────── */
  if (done) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(250,204,21,0.1)', border: '2px solid rgba(250,204,21,0.3)' }}>
            <Clock size={36} className="text-yellow-400" />
          </div>
          <h1 className="text-white font-black text-2xl mb-2">Application submitted!</h1>
          <p className="text-slate-400 text-sm mb-4">
            Your gym registration is under review. You'll receive access once the platform admin approves your application.
          </p>
          <div className="rounded-2xl border border-white/8 px-4 py-3 mb-6"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-slate-500 text-xs mb-1">Your portal URL (available after approval)</p>
            <p className="text-white font-mono text-sm font-bold">madeforgyms.com/{form.slug}</p>
          </div>
          <a href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft size={14} /> Back to MadeForGyms
          </a>
        </div>
      </div>
    );
  }

  const isLastStep = step === 2;

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center px-4 relative overflow-hidden">

      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-md py-12">

        <Link to="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to MadeForGyms
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)', boxShadow: '0 0 24px rgba(34,197,94,0.3)' }}>
            <Dumbbell size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-black text-xl tracking-tight">Register Your Gym</h1>
            <p className="text-slate-400 text-xs mt-0.5">Get your gym portal live in minutes</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-6">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: i < step ? 'linear-gradient(135deg,#16a34a,#4ade80)' : i === step ? 'linear-gradient(135deg,#16a34a,#4ade80)' : 'rgba(255,255,255,0.06)',
                    color: i <= step ? '#fff' : '#475569',
                    boxShadow: i === step ? '0 0 12px rgba(34,197,94,0.35)' : 'none',
                  }}
                >
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-xs whitespace-nowrap ${i === step ? 'text-green-400 font-medium' : i < step ? 'text-slate-400' : 'text-slate-600'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-2 mb-4"
                  style={{ background: i < step ? 'linear-gradient(90deg,#16a34a,#4ade80)' : 'rgba(255,255,255,0.08)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <form
          onSubmit={isLastStep ? handleSubmit : handleNext}
          className="rounded-3xl border border-white/10 p-6 shadow-2xl space-y-5"
          style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}
        >

          {/* ── Step 1: About You ── */}
          {step === 0 && (
            <>
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-4">Step 1 — About You</p>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Your Full Name</label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => set('ownerName', e.target.value)}
                  placeholder="e.g. Juan dela Cruz"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-green-500 text-white rounded-xl px-4 py-3 outline-none transition-colors placeholder:text-slate-600 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Contact Number</label>
                <input
                  type="text"
                  value={form.ownerContact}
                  onChange={(e) => set('ownerContact', e.target.value)}
                  placeholder="09XX XXX XXXX"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-green-500 text-white rounded-xl px-4 py-3 outline-none transition-colors placeholder:text-slate-600 text-sm"
                />
              </div>
            </>
          )}

          {/* ── Step 2: Your Gym ── */}
          {step === 1 && (
            <>
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-4">Step 2 — Your Gym</p>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Gym Name</label>
                <input
                  type="text"
                  value={form.gymName}
                  onChange={(e) => handleGymName(e.target.value)}
                  placeholder="e.g. Power Fitness Gym"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-green-500 text-white rounded-xl px-4 py-3 outline-none transition-colors placeholder:text-slate-600 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Your Portal URL</label>
                <div className="flex items-center rounded-xl overflow-hidden border border-slate-700 focus-within:border-green-500 transition-colors bg-slate-800">
                  <span className="px-3 text-slate-500 text-sm select-none whitespace-nowrap border-r border-slate-700 py-3">
                    madeforgyms.com/
                  </span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => handleSlug(e.target.value)}
                    placeholder="yourgymname"
                    className="flex-1 bg-transparent text-white px-3 py-3 outline-none text-sm placeholder:text-slate-600"
                    minLength={3}
                  />
                  <div className="px-3">
                    {checking && <Loader2 size={16} className="text-slate-500 animate-spin" />}
                    {!checking && slugAvail === true  && <Check size={16} className="text-green-400" />}
                    {!checking && slugAvail === false && <span className="text-red-400 text-xs font-medium">Taken</span>}
                  </div>
                </div>
                {form.slug.length > 0 && form.slug.length < 3 && (
                  <p className="text-slate-500 text-xs mt-1">Minimum 3 characters</p>
                )}
                {slugAvail === false && <p className="text-red-400 text-xs mt-1">This URL is already taken. Try another.</p>}
                {slugAvail === true  && <p className="text-green-400 text-xs mt-1">Available!</p>}
              </div>
            </>
          )}

          {/* ── Step 3: Your Account ── */}
          {step === 2 && (
            <>
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-4">Step 3 — Your Account</p>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Username</label>
                <div className="flex items-center rounded-xl overflow-hidden border border-slate-700 focus-within:border-green-500 transition-colors bg-slate-800">
                  <span className="px-3 text-slate-500 text-sm select-none border-r border-slate-700 py-3">@</span>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => { set('username', e.target.value.replace(/[^a-z0-9_]/g, '').toLowerCase()); setUsernameAvail(null); }}
                    placeholder="yourgymusername"
                    className="flex-1 bg-transparent text-white px-3 py-3 outline-none text-sm placeholder:text-slate-600"
                    autoFocus
                    minLength={3}
                  />
                  <div className="px-3">
                    {checkingUsername && <Loader2 size={16} className="text-slate-500 animate-spin" />}
                    {!checkingUsername && usernameAvail === true  && <Check size={16} className="text-green-400" />}
                    {!checkingUsername && usernameAvail === false && <span className="text-red-400 text-xs font-medium">Taken</span>}
                  </div>
                </div>
                {form.username.length > 0 && form.username.length < 3 && (
                  <p className="text-slate-500 text-xs mt-1">Minimum 3 characters</p>
                )}
                {usernameAvail === false && <p className="text-red-400 text-xs mt-1">This username is already taken.</p>}
                {usernameAvail === true  && <p className="text-green-400 text-xs mt-1">Available!</p>}
                <p className="text-slate-600 text-xs mt-1">Used to log in. Letters, numbers, underscores only.</p>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Admin Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => { set('email', e.target.value); setEmailAvail(null); }}
                    placeholder="you@yourgym.com"
                    className="w-full bg-slate-800 border border-slate-700 focus:border-green-500 text-white rounded-xl px-4 py-3 pr-10 outline-none transition-colors placeholder:text-slate-600 text-sm"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingEmail && <Loader2 size={16} className="text-slate-500 animate-spin" />}
                    {!checkingEmail && emailAvail === true  && <Check size={16} className="text-green-400" />}
                    {!checkingEmail && emailAvail === false && <span className="text-red-400 text-xs font-medium">Taken</span>}
                  </div>
                </div>
                {emailAvail === false && <p className="text-red-400 text-xs mt-1">An account with this email already exists.</p>}
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-slate-800 border border-slate-700 focus:border-green-500 text-white rounded-xl px-4 py-3 pr-11 outline-none transition-colors placeholder:text-slate-600 text-sm"
                    minLength={8}
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {form.password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? STRENGTH_COLOR[strength] : 'bg-slate-700'}`} />
                      ))}
                    </div>
                    <p className={`text-xs ${strength <= 1 ? 'text-red-400' : strength === 2 ? 'text-yellow-400' : strength === 3 ? 'text-blue-400' : 'text-green-400'}`}>
                      {STRENGTH_LABEL[strength]}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => set('confirmPassword', e.target.value)}
                    placeholder="Re-enter password"
                    className={`w-full bg-slate-800 border text-white rounded-xl px-4 py-3 pr-11 outline-none transition-colors placeholder:text-slate-600 text-sm ${
                      form.confirmPassword && form.password !== form.confirmPassword
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-slate-700 focus:border-green-500'
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">Passwords do not match.</p>
                )}
              </div>
            </>
          )}

          {/* Navigation buttons */}
          <div className={`flex gap-3 pt-1 ${step > 0 ? 'flex-row' : ''}`}>
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={isLastStep ? !canSubmit : (step === 0 ? !step1Valid : !step2Valid)}
              className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              style={{
                background: (isLastStep ? canSubmit : (step === 0 ? step1Valid : step2Valid))
                  ? 'linear-gradient(135deg, #16a34a, #4ade80)'
                  : 'rgba(255,255,255,0.05)',
                color: (isLastStep ? canSubmit : (step === 0 ? step1Valid : step2Valid)) ? '#fff' : '#475569',
                cursor: (isLastStep ? canSubmit : (step === 0 ? step1Valid : step2Valid)) ? 'pointer' : 'not-allowed',
                boxShadow: (isLastStep ? canSubmit : (step === 0 ? step1Valid : step2Valid)) ? '0 0 20px rgba(34,197,94,0.25)' : 'none',
              }}
            >
              {isLastStep
                ? submitting
                  ? <><Loader2 size={17} className="animate-spin" /> Creating your gym…</>
                  : 'Create Gym Portal'
                : <> Next <ChevronRight size={16} /></>
              }
            </button>
          </div>

          <p className="text-slate-600 text-xs text-center">
            Already registered?{' '}
            <Link to="/portal" className="text-slate-400 hover:text-white transition-colors">
              Find your gym
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
