import { useState, useEffect } from 'react';
import { X, User, Phone, ShieldCheck, CalendarCheck, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = [
  {
    icon: User,
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.12)',
    title: 'Tap "Member Portal"',
    desc: 'To check your membership status or request a renewal, tap Member Portal.',
    animation: 'tapMember',
    section: 'member',
  },
  {
    icon: Phone,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
    title: 'Enter Your Phone Number',
    desc: 'Type the phone number you registered with. Your membership details will appear.',
    animation: 'type',
    section: 'member',
  },
  {
    icon: ShieldCheck,
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.12)',
    title: 'View Your Membership',
    desc: 'See your status, expiry date, and request a renewal — all in one place.',
    animation: 'check',
    section: 'member',
  },
  {
    icon: CalendarCheck,
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.12)',
    title: 'Tap "Gym Check-In"',
    desc: 'To log your visit for today, go back and tap Gym Check-In instead.',
    animation: 'tapCheckin',
    section: 'checkin',
  },
  {
    icon: CheckCircle,
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.12)',
    title: 'Your Visit is Logged!',
    desc: 'Enter your phone number and your check-in is recorded. That\'s it!',
    animation: 'checkinDone',
    section: 'checkin',
  },
];

function ScanAnimation() {
  return (
    <div className="relative w-24 h-24 mx-auto">
      <div className="w-24 h-24 rounded-2xl border-2 border-green-400/40 flex items-center justify-center"
        style={{ background: 'rgba(34,197,94,0.08)' }}>
        <QrCode size={44} className="text-green-400" />
      </div>
      <div className="absolute left-2 right-2 h-0.5 rounded-full"
        style={{ background: 'linear-gradient(90deg, transparent, #22c55e, transparent)', animation: 'scanLine 2.4s ease-in-out infinite', top: '20%' }} />
      {[['top-0 left-0','border-t-2 border-l-2'],['top-0 right-0','border-t-2 border-r-2'],
        ['bottom-0 left-0','border-b-2 border-l-2'],['bottom-0 right-0','border-b-2 border-r-2']
      ].map(([pos, border], i) => (
        <div key={i} className={`absolute w-4 h-4 ${pos} ${border} border-green-400`} />
      ))}
    </div>
  );
}

function TapMemberAnimation() {
  return (
    <div className="w-full space-y-2 mx-auto">
      <div className="relative rounded-2xl border border-sky-400/40 px-3 py-2.5 flex items-center gap-2"
        style={{ background: 'rgba(56,189,248,0.1)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.2)' }}>
          <User size={14} className="text-green-400" />
        </div>
        <span className="text-sky-300 text-xs font-semibold">Member Portal</span>
        <div className="absolute bottom-1 right-2 w-5 h-5 flex items-center justify-center">
          <div className="absolute w-4 h-4 rounded-full border border-sky-400" style={{ animation: 'ripple 2s ease-out infinite' }} />
          <div className="w-2 h-2 rounded-full bg-sky-400" style={{ animation: 'tapDot 2s ease-out infinite' }} />
        </div>
      </div>
      <div className="rounded-2xl border border-white/5 px-3 py-2.5 flex items-center gap-2 opacity-30"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.1)' }}>
          <CalendarCheck size={14} className="text-green-400/50" />
        </div>
        <span className="text-slate-500 text-xs">Gym Check-In</span>
      </div>
    </div>
  );
}

function TypeAnimation() {
  const [count, setCount] = useState(0);
  const digits = '09291234567';
  useEffect(() => {
    const t = setInterval(() => setCount(c => c < digits.length ? c + 1 : 0), 280);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="w-full mx-auto">
      <div className="rounded-xl border border-purple-400/30 px-3 py-2.5 flex items-center gap-2"
        style={{ background: 'rgba(167,139,250,0.08)' }}>
        <Phone size={14} className="text-purple-400 shrink-0" />
        <span className="text-white text-sm font-mono tracking-widest">
          {digits.slice(0, count)}
          <span className="inline-block w-0.5 h-4 bg-purple-400 ml-0.5 align-middle"
            style={{ animation: 'blink 0.8s step-end infinite' }} />
        </span>
      </div>
    </div>
  );
}

function CheckAnimation() {
  return (
    <div className="w-full mx-auto space-y-2">
      {[
        { label: 'Status', value: 'Active', color: '#4ade80', delay: '0s' },
        { label: 'Plan', value: 'Monthly', color: '#38bdf8', delay: '0.15s' },
        { label: 'Expires', value: 'May 30, 2025', color: '#94a3b8', delay: '0.3s' },
      ].map(({ label, value, color, delay }) => (
        <div key={label}
          className="flex items-center justify-between rounded-xl px-3 py-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', animation: 'slideUp 0.7s ease both', animationDelay: delay }}>
          <span className="text-slate-400 text-xs">{label}</span>
          <span className="text-xs font-semibold" style={{ color }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function TapCheckinAnimation() {
  return (
    <div className="w-full space-y-2 mx-auto">
      <div className="rounded-2xl border border-white/5 px-3 py-2.5 flex items-center gap-2 opacity-30"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.1)' }}>
          <User size={14} className="text-green-400/50" />
        </div>
        <span className="text-slate-500 text-xs">Member Portal</span>
      </div>
      <div className="relative rounded-2xl border border-orange-400/40 px-3 py-2.5 flex items-center gap-2"
        style={{ background: 'rgba(251,146,60,0.1)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(251,146,60,0.2)' }}>
          <CalendarCheck size={14} className="text-orange-400" />
        </div>
        <span className="text-orange-300 text-xs font-semibold">Gym Check-In</span>
        <div className="absolute bottom-1 right-2 w-5 h-5 flex items-center justify-center">
          <div className="absolute w-4 h-4 rounded-full border border-orange-400" style={{ animation: 'ripple 2s ease-out infinite' }} />
          <div className="w-2 h-2 rounded-full bg-orange-400" style={{ animation: 'tapDot 2s ease-out infinite' }} />
        </div>
      </div>
    </div>
  );
}

function CheckinDoneAnimation() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(251,146,60,0.15)', border: '2px solid rgba(251,146,60,0.3)', animation: 'popIn 0.4s ease both' }}>
        <CheckCircle size={32} className="text-orange-400" />
      </div>
      <div className="text-center">
        <p className="text-white font-bold text-sm">Check-In Recorded!</p>
        <p className="text-orange-300/70 text-xs mt-0.5">Today · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
      </div>
    </div>
  );
}

const ANIM_MAP = {
  tapMember: TapMemberAnimation,
  type: TypeAnimation,
  check: CheckAnimation,
  tapCheckin: TapCheckinAnimation,
  checkinDone: CheckinDoneAnimation,
};

const SECTION_LABELS = { member: 'Member Portal', checkin: 'Gym Check-In' };
const SECTION_COLORS = { member: '#38bdf8', checkin: '#fb923c' };

export default function HowToModal({ onClose, onDismiss }) {
  const [step, setStep] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [dontShow, setDontShow] = useState(false);

  const handleClose = () => {
    if (dontShow && onDismiss) onDismiss();
    else onClose();
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (step < STEPS.length - 1) { setStep(s => s + 1); setAnimKey(k => k + 1); }
    }, 5000);
    return () => clearTimeout(t);
  }, [step]);

  const go = (idx) => { setStep(idx); setAnimKey(k => k + 1); };

  const { icon: Icon, color, bg, title, desc, animation, section } = STEPS[step];
  const AnimComp = ANIM_MAP[animation];

  return (
    <>
      <style>{`
        @keyframes scanLine { 0%,100%{top:15%} 50%{top:75%} }
        @keyframes ripple { 0%{transform:scale(0);opacity:0.8} 100%{transform:scale(2.5);opacity:0} }
        @keyframes tapDot { 0%,70%{opacity:1} 100%{opacity:0.3} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlide { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes popIn { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        .step-enter { animation: fadeSlide 0.5s ease both; }
      `}</style>

      <div className="fixed inset-0 bg-black/75 z-50 flex items-end sm:items-center justify-center p-4"
        onClick={handleClose}>
        <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <p className="text-white font-bold text-base">How to Use</p>
              <p className="text-slate-500 text-xs">Step {step + 1} of {STEPS.length}</p>
            </div>
            <button onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <X size={16} />
            </button>
          </div>

          {/* Progress bar with section grouping */}
          <div className="px-5 mb-1">
            <div className="flex gap-1.5">
              {STEPS.map((s, i) => (
                <button key={i} onClick={() => go(i)}
                  className="h-1 rounded-full flex-1 transition-all duration-500"
                  style={{ background: i <= step ? STEPS[i].color : 'rgba(255,255,255,0.1)' }} />
              ))}
            </div>
          </div>

          {/* Section label */}
          <div className="px-5 mb-4 h-5 flex items-center">
            {section && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${SECTION_COLORS[section]}18`, color: SECTION_COLORS[section] }}>
                {SECTION_LABELS[section]}
              </span>
            )}
          </div>

          {/* Step content */}
          <div className="px-5 pb-2 step-enter" key={animKey}>
            <div className="rounded-2xl p-5 mb-5 flex flex-col items-center justify-center min-h-[130px]"
              style={{ background: bg, border: `1px solid ${color}25` }}>
              <AnimComp key={animKey} />
            </div>

            <div className="flex items-start gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <p className="text-white font-bold text-sm mb-1">{title}</p>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          </div>

          {/* Don't show again */}
          <label className="flex items-center gap-2.5 px-5 pb-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={e => setDontShow(e.target.checked)}
              className="w-4 h-4 rounded accent-green-500 cursor-pointer"
            />
            <span className="text-slate-500 group-hover:text-slate-400 text-xs transition-colors">Don't show this again</span>
          </label>

          {/* Navigation */}
          <div className="flex items-center gap-3 px-5 pb-5">
            <button
              onClick={() => go(Math.max(0, step - 1))}
              disabled={step === 0}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <ChevronLeft size={18} />
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => go(step + 1)}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-white text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: `linear-gradient(135deg, ${color}cc, ${color})` }}>
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="flex-1 flex items-center justify-center h-10 rounded-xl text-white text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)' }}>
                Got it!
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
