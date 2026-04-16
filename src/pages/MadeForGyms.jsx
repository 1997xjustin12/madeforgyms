import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useGym } from '../context/GymContext';
import {
  Dumbbell, Users, CreditCard, Bell, ClipboardList,
  Smartphone, ChevronRight, Check, Star, Menu, X,
  Zap, Shield, BarChart3, MessageCircle, ArrowRight,
  TrendingUp, Clock, Globe, UserCheck, Layers,
} from 'lucide-react';

/* ── MadeForGyms logo (cropped from canvas) ─────────────────── */
// Logo content sits at x=284-1210, y=207-515 in the 1536×1024 source PNG
function MFGLogo({ height = 36 }) {
  const scale = height / 308;
  const bgW = Math.round(1536 * scale);
  const bgH = Math.round(1024 * scale);
  const bgX = -Math.round(284 * scale);
  const bgY = -Math.round(207 * scale);
  const w = Math.round(926 * scale);
  return (
    <div
      role="img"
      aria-label="MadeForGyms"
      style={{
        width: w,
        height,
        backgroundImage: 'url(/madeforgyms.png)',
        backgroundSize: `${bgW}px ${bgH}px`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundRepeat: 'no-repeat',
        flexShrink: 0,
      }}
    />
  );
}

/* ── Scroll-reveal hook ─────────────────────────────────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ── Animated counter ───────────────────────────────────────── */
function Counter({ to, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useReveal(0.5);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(to / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [visible, to]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ── Reveal wrapper ─────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
      }}
    >
      {children}
    </div>
  );
}

/* ── Data ───────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Users, color: '#38bdf8', glow: 'rgba(56,189,248,0.15)',
    title: 'Member Management',
    desc: 'Register, track, and manage every member — their plans, status, photos, and history in one clean dashboard.',
  },
  {
    icon: CreditCard, color: '#4ade80', glow: 'rgba(74,222,128,0.15)',
    title: 'GCash Payments',
    desc: 'Members pay directly from their phone. You get a notification and approve with one tap — zero friction.',
  },
  {
    icon: Bell, color: '#4ade80', glow: 'rgba(251,146,60,0.15)',
    title: 'Telegram Alerts',
    desc: 'Instant Telegram notifications for every new payment. Review receipts and approve without opening the app.',
  },
  {
    icon: Dumbbell, color: '#facc15', glow: 'rgba(250,204,21,0.15)',
    title: 'Coach Portal',
    desc: 'Assign coaches to members. Trainers log workout programs, meal plans, and session notes from their own portal.',
  },
  {
    icon: Smartphone, color: '#c084fc', glow: 'rgba(192,132,252,0.15)',
    title: 'Member Self-Service',
    desc: 'Members check membership status, view coach programs, and renew online — no app download, just a link.',
  },
  {
    icon: BarChart3, color: '#f472b6', glow: 'rgba(244,114,182,0.15)',
    title: 'Attendance & Logs',
    desc: 'Kiosk check-in, attendance history, and a full audit trail of every action taken in your gym.',
  },
];

const STEPS = [
  { num: '01', color: '#4ade80', title: 'Create Your Gym Account', desc: 'Set up your gym in minutes — add your GCash details, membership prices, and your Telegram bot.' },
  { num: '02', color: '#38bdf8', title: 'Onboard Your Team', desc: 'Add coaches with their own access codes and portals. They log in, you stay in control.' },
  { num: '03', color: '#4ade80', title: 'Members Go Digital', desc: 'Share the member portal link. Members check status, renew, and see their coach plans — all from their phone.' },
  { num: '04', color: '#c084fc', title: 'Run on Autopilot', desc: 'Payments, renewals, and reminders run automatically. You focus on growing, not admin work.' },
];

const TESTIMONIALS = [
  {
    name: 'Coach Renz',
    role: 'Owner, Iron Peak Gym — Davao City',
    avatar: 'R',
    color: '#4ade80',
    text: '"Before this, I was tracking renewals in a notebook. Now I just check Telegram. Game changer for our 120 members."',
    stars: 5,
  },
  {
    name: 'Ma\'am Liza',
    role: 'Owner, FitZone Fitness — Cebu',
    avatar: 'L',
    color: '#38bdf8',
    text: '"Our coaches love the portal. They add workout plans, members see it instantly. No more group chats for everything."',
    stars: 5,
  },
  {
    name: 'Sir Mark',
    role: 'Manager, PowerHouse Gym — Manila',
    avatar: 'M',
    color: '#4ade80',
    text: '"GCash collection used to be a nightmare. Now members submit their own receipts and I approve in one click."',
    stars: 5,
  },
];

const PLANS = [
  {
    name: 'Starter',
    price: '₱499',
    period: '/month',
    desc: 'For gyms just getting started.',
    highlight: false,
    color: '#38bdf8',
    features: [
      'Up to 100 members',
      'Member portal & check-in',
      'GCash payment requests',
      'Attendance tracking',
      'Activity logs',
    ],
  },
  {
    name: 'Pro',
    price: '₱999',
    period: '/month',
    desc: 'The full system for serious gyms.',
    highlight: true,
    color: '#4ade80',
    features: [
      'Unlimited members',
      'Telegram notifications',
      'Coach & trainer portal',
      'Workout & meal plan builder',
      'Coaching subscription pricing',
      'Custom promos & pricing',
      'Priority support',
    ],
  },
];

/* ── Main Component ─────────────────────────────────────────── */
export default function MadeForGyms() {
  const { isAdminLoggedIn } = useGym();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  if (isAdminLoggedIn) return <Navigate to="/admin" replace />;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-x-hidden">

      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/70 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <MFGLogo height={38} />
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How it Works', 'Pricing'].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`}
                className="text-sm text-slate-400 hover:text-white transition-colors font-medium">
                {l}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a href="/member" className="text-sm text-slate-400 hover:text-white transition-colors font-medium px-3 py-2">
              Member Portal
            </a>
            <a href="/checkin" className="text-sm text-slate-400 hover:text-white transition-colors font-medium px-3 py-2">
              Check-In
            </a>
            <a href="/admin/login" className="text-sm text-slate-400 hover:text-white transition-colors font-medium px-3 py-2">
              Login
            </a>
            <a href="/portal"
              className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)', boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}>
              Get Started
            </a>
          </div>

          <button onClick={() => setMenuOpen((o) => !o)} className="md:hidden text-slate-400 hover:text-white p-1">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/5 px-5 py-5 space-y-4">
            {['Features', 'How it Works', 'Pricing'].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`}
                onClick={() => setMenuOpen(false)}
                className="block text-slate-300 hover:text-white font-medium py-1 transition-colors">
                {l}
              </a>
            ))}
            <div className="border-t border-white/8 pt-4 space-y-2">
              <a href="/member" onClick={() => setMenuOpen(false)}
                className="block text-center font-semibold py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition-all">
                Member Portal
              </a>
              <a href="/checkin" onClick={() => setMenuOpen(false)}
                className="block text-center font-semibold py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition-all">
                Check-In
              </a>
              <a href="/admin/login" onClick={() => setMenuOpen(false)}
                className="block text-center font-bold py-3.5 rounded-xl"
                style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)' }}>
                Admin Login
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center px-5 sm:px-8 pt-24 pb-16 overflow-hidden">

        {/* Background orbs */}
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="hero-orb-1" />
          <div className="hero-orb-2" />
          <div className="hero-orb-3" />
          <div className="absolute inset-0"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* ── Left: copy ── */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black leading-[1.0] tracking-tighter mb-6 animate-fade-in-up">
              The System Built<br />for Gyms —<br />
              <span className="gradient-text">Not Adapted to Them</span>
            </h1>

            <p className="text-slate-400 text-base sm:text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed mb-8 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
              Stop managing your gym with group chats and notebooks.
              GCash payments, member tracking, coach portals — one platform, zero chaos.
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 animate-fade-in-up" style={{ animationDelay: '220ms' }}>
              <a href="/portal"
                className="group flex items-center justify-center gap-2 font-bold px-7 py-3.5 rounded-xl text-sm transition-all hover:-translate-y-1 hover:shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)', boxShadow: '0 0 28px rgba(34,197,94,0.35)' }}>
                Get Started
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#features"
                className="flex items-center justify-center gap-2 font-bold px-7 py-3.5 rounded-xl text-sm border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                See Features
              </a>
            </div>

            <p className="text-slate-600 text-xs mt-5 animate-fade-in-up" style={{ animationDelay: '320ms' }}>
              Works on any device · No app install · GCash ready
            </p>

            {/* Mini trust chips */}
            <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-2 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              {[
                { icon: CreditCard, label: 'GCash Payments' },
                { icon: Bell, label: 'Telegram Alerts' },
                { icon: Dumbbell, label: 'Coach Portal' },
                { icon: Clock, label: '24/7 Member Portal' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-white/8 bg-white/3 text-slate-300">
                  <Icon size={11} className="text-green-400" /> {label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right: Dashboard mockup ── */}
          <div className="flex-1 w-full max-w-2xl animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="dashboard-float">
              {/* Browser chrome */}
              <div className="rounded-2xl overflow-hidden shadow-2xl"
                style={{ border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 80px rgba(34,197,94,0.12), 0 40px 80px rgba(0,0,0,0.6)' }}>

                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-2.5"
                  style={{ background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  </div>
                  <div className="flex-1 mx-3 px-3 py-1 rounded-md text-[10px] text-slate-500 font-mono"
                    style={{ background: '#1e293b' }}>
                    madeforgyms.com/admin
                  </div>
                </div>

                {/* Dashboard UI */}
                <div className="flex" style={{ background: '#0f172a', height: '380px' }}>

                  {/* Sidebar */}
                  <div className="w-12 flex flex-col items-center py-4 gap-3 shrink-0"
                    style={{ background: '#0a1120', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
                      style={{ background: 'linear-gradient(135deg,#16a34a,#4ade80)' }}>
                      <Dumbbell size={13} className="text-white" />
                    </div>
                    {[Users, CreditCard, ClipboardList, BarChart3, Bell].map((Icon, i) => (
                      <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-green-500/20' : ''}`}>
                        <Icon size={13} className={i === 0 ? 'text-green-400' : 'text-slate-600'} />
                      </div>
                    ))}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 overflow-hidden p-4 space-y-3">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-xs font-bold">Dashboard</p>
                        <p className="text-slate-600 text-[9px]">Power Fitness Gym</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-green-500/20 flex items-center justify-center">
                          <Bell size={9} className="text-green-400" />
                        </div>
                        <div className="w-5 h-5 rounded-full bg-slate-700" />
                      </div>
                    </div>

                    {/* Stat cards */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Members', val: '248', color: '#38bdf8', delta: '+12' },
                        { label: 'Active',  val: '201', color: '#4ade80', delta: '+5'  },
                        { label: 'Expiring', val: '18', color: '#4ade80', delta: '3d'  },
                        { label: 'Revenue', val: '₱124k', color: '#c084fc', delta: '+8%' },
                      ].map(({ label, val, color, delta }) => (
                        <div key={label} className="rounded-xl p-2.5"
                          style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p className="text-[8px] text-slate-500 mb-1">{label}</p>
                          <p className="text-xs font-black" style={{ color }}>{val}</p>
                          <p className="text-[8px] text-slate-600 mt-0.5">{delta}</p>
                        </div>
                      ))}
                    </div>

                    {/* Chart + list */}
                    <div className="grid grid-cols-5 gap-2" style={{ height: '180px' }}>

                      {/* Bar chart */}
                      <div className="col-span-3 rounded-xl p-3 flex flex-col"
                        style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p className="text-[8px] text-slate-400 font-semibold mb-2">Monthly Renewals</p>
                        <div className="flex items-end gap-1 flex-1">
                          {[40, 65, 50, 80, 70, 90, 75, 95, 60, 85, 100, 78].map((h, i) => (
                            <div key={i} className="flex-1 rounded-sm transition-all"
                              style={{
                                height: `${h}%`,
                                background: i === 11
                                  ? 'linear-gradient(180deg,#16a34a,#4ade80)'
                                  : 'rgba(34,197,94,0.2)',
                              }} />
                          ))}
                        </div>
                        <div className="flex justify-between mt-1">
                          {['Jan','','','','','','','','','','','Dec'].map((m, i) => (
                            <p key={i} className="text-[6px] text-slate-700">{m}</p>
                          ))}
                        </div>
                      </div>

                      {/* Recent members */}
                      <div className="col-span-2 rounded-xl p-3 flex flex-col"
                        style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p className="text-[8px] text-slate-400 font-semibold mb-2">Recent Members</p>
                        <div className="space-y-1.5 flex-1 overflow-hidden">
                          {[
                            { name: 'Juan D.',   plan: 'Monthly', color: '#4ade80' },
                            { name: 'Maria S.',  plan: 'Quarterly', color: '#38bdf8' },
                            { name: 'Carlo R.',  plan: 'Annual',  color: '#c084fc' },
                            { name: 'Ana L.',    plan: 'Monthly', color: '#4ade80' },
                          ].map(({ name, plan, color }) => (
                            <div key={name} className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-md flex items-center justify-center text-[7px] font-black shrink-0"
                                style={{ background: `${color}20`, color }}>
                                {name[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[8px] text-white font-medium leading-tight truncate">{name}</p>
                                <p className="text-[7px] text-slate-600">{plan}</p>
                              </div>
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Pending payment row */}
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                      style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                      <p className="text-[9px] text-green-300 flex-1">3 GCash payments pending approval</p>
                      <p className="text-[8px] text-green-400 font-bold">Review →</p>
                    </div>

                  </div>
                </div>
              </div>

              {/* Floating notification card */}
              <div className="absolute -bottom-4 -left-4 rounded-xl px-3 py-2.5 flex items-center gap-2.5 shadow-xl notif-float"
                style={{ background: '#1e293b', border: '1px solid rgba(74,222,128,0.25)', minWidth: '180px' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(74,222,128,0.15)' }}>
                  <Check size={13} className="text-green-400" />
                </div>
                <div>
                  <p className="text-white text-[10px] font-bold leading-tight">Payment Approved</p>
                  <p className="text-slate-500 text-[9px]">Juan dela Cruz · ₱500</p>
                </div>
              </div>

              {/* Floating member chip */}
              <div className="absolute -top-3 -right-3 rounded-xl px-3 py-2 flex items-center gap-2 shadow-xl member-float"
                style={{ background: '#1e293b', border: '1px solid rgba(56,189,248,0.25)' }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black"
                  style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8' }}>M</div>
                <div>
                  <p className="text-white text-[10px] font-bold leading-tight">New Member</p>
                  <p className="text-slate-500 text-[9px]">Maria Santos registered</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────── */}
      <section className="py-16 px-5 border-y border-white/5" style={{ background: 'linear-gradient(180deg, rgba(34,197,94,0.03) 0%, transparent 100%)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: 500, suffix: '+', label: 'Members Managed' },
            { value: 98,  suffix: '%', label: 'Payment Success Rate' },
            { value: 10,  suffix: 'x', label: 'Faster Renewals' },
            { value: 24,  suffix: '/7', label: 'Member Self-Service' },
          ].map(({ value, suffix, label }) => (
            <Reveal key={label}>
              <div className="p-5">
                <p className="text-4xl sm:text-5xl font-black mb-1"
                  style={{ background: 'linear-gradient(135deg, #4ade80, #86efac)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  <Counter to={value} suffix={suffix} />
                </p>
                <p className="text-slate-400 text-sm font-medium">{label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section id="features" className="py-28 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: '#4ade80' }}>Features</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5">
              Built for how gyms<br />actually operate
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-lg">
              Not generic business software. Every feature was designed around the real daily problems gym owners face.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, color, glow, title, desc }, i) => (
              <Reveal key={title} delay={i * 80} className="h-full">
                <div
                  className="group relative h-full p-6 rounded-2xl border border-white/8 bg-white/2 hover:border-white/15 transition-all duration-300 hover:-translate-y-1 cursor-default overflow-hidden"
                  style={{ '--glow': glow }}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                    style={{ background: `radial-gradient(circle at 30% 30%, ${glow}, transparent 70%)` }} />

                  <div className="relative">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                      style={{ background: `${glow}`, border: `1px solid ${color}25` }}>
                      <Icon size={22} style={{ color }} />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Telegram Highlight ──────────────────────────────── */}
      <section className="py-20 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="relative rounded-3xl overflow-hidden p-8 sm:p-14 flex flex-col sm:flex-row items-center gap-10"
              style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.06) 0%, rgba(99,102,241,0.06) 100%)', border: '1px solid rgba(56,189,248,0.15)' }}>

              {/* BG glow */}
              <div className="absolute top-0 left-0 w-72 h-72 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)' }} />

              {/* Mock Telegram card */}
              <div className="shrink-0 w-full sm:w-72">
                <div className="rounded-2xl p-4 text-sm"
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
                  <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-white/5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg, #0088cc, #00c6ff)' }}>🤖</div>
                    <div>
                      <p className="text-white text-xs font-bold">GymOS Bot</p>
                      <p className="text-slate-500 text-[10px]">just now</p>
                    </div>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed mb-3">
                    💳 <span className="text-white font-bold">New Payment Request</span><br /><br />
                    👤 <span className="text-slate-400">Member:</span> Juan dela Cruz<br />
                    📋 <span className="text-slate-400">Plan:</span> 1 Month<br />
                    💰 <span className="text-slate-400">Amount:</span> <span className="text-green-400 font-bold">₱500</span><br />
                    🔖 <span className="text-slate-400">Ref:</span> 12345678901
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 text-center py-1.5 rounded-lg text-[11px] font-bold"
                      style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}>
                      ✓ Approve
                    </div>
                    <div className="flex-1 text-center py-1.5 rounded-lg text-[11px] font-bold"
                      style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                      ✗ Reject
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#38bdf8' }}>Telegram Integration</p>
                <h3 className="text-3xl sm:text-4xl font-black mb-4 leading-tight">
                  Approve payments<br />without opening the app
                </h3>
                <p className="text-slate-400 leading-relaxed mb-6">
                  Every GCash submission lands directly in your Telegram — with the member's name, amount, plan, and proof. Tap approve. Done.
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  {['Instant notification', 'One-tap approve', 'View receipt', 'No login needed'].map((t) => (
                    <span key={t} className="text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── How it Works ────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: '#4ade80' }}>How it Works</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5">
              Set up in an afternoon.<br />Run forever.
            </h2>
          </Reveal>

          <div className="relative space-y-4">
            {/* Vertical line */}
            <div className="absolute left-8 top-8 bottom-8 w-px hidden md:block" style={{ background: 'linear-gradient(180deg, rgba(34,197,94,0.5), rgba(192,132,252,0.1))' }} />

            {STEPS.map(({ num, color, title, desc }, i) => (
              <Reveal key={num} delay={i * 100}>
                <div className="flex items-start gap-6 p-6 rounded-2xl border border-white/5 bg-white/2 hover:bg-white/4 hover:border-white/10 transition-all group">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                    {num}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1.5">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────── */}
      <section className="py-20 px-5 sm:px-8" style={{ background: 'linear-gradient(180deg, transparent, rgba(34,197,94,0.03), transparent)' }}>
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: '#c084fc' }}>Testimonials</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
              Gym owners love it
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, role, avatar, color, text, stars }, i) => (
              <Reveal key={name} delay={i * 100} className="h-full">
                <div className="h-full p-6 rounded-2xl border border-white/8 bg-white/2 hover:bg-white/4 hover:border-white/12 transition-all flex flex-col">
                  <div className="flex mb-4">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} size={14} fill="#4ade80" className="text-green-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed flex-1 mb-5">{text}</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                      style={{ background: `${color}20`, color }}>
                      {avatar}
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">{name}</p>
                      <p className="text-slate-500 text-xs">{role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <section id="pricing" className="py-28 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: '#86efac' }}>Pricing</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5">
              Simple pricing,<br />serious results
            </h2>
            <p className="text-slate-400">One gym, one price. No hidden fees, no per-member charges.</p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {PLANS.map(({ name, price, period, desc, highlight, color, features }, i) => (
              <Reveal key={name} delay={i * 100} className="h-full">
                <div className="relative h-full rounded-2xl p-7 flex flex-col overflow-hidden"
                  style={{
                    background: highlight ? `linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.04))` : 'rgba(255,255,255,0.02)',
                    border: highlight ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: highlight ? '0 0 60px rgba(34,197,94,0.1)' : 'none',
                  }}>

                  {highlight && (
                    <div className="absolute top-4 right-4 text-[11px] font-bold px-3 py-1 rounded-full"
                      style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
                      Most Popular
                    </div>
                  )}

                  {/* BG glow for Pro */}
                  {highlight && <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)' }} />}

                  <div className="relative">
                    <p className="text-slate-400 text-sm font-medium mb-2">{name}</p>
                    <div className="flex items-end gap-1 mb-1">
                      <span className="text-5xl font-black" style={{ color: highlight ? '#4ade80' : 'white' }}>{price}</span>
                      <span className="text-slate-500 text-sm mb-2">{period}</span>
                    </div>
                    <p className="text-slate-500 text-xs mb-6">{desc}</p>

                    <ul className="space-y-3 mb-8 flex-1">
                      {features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                          <Check size={15} className="mt-0.5 shrink-0" style={{ color }} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <a href="/portal"
                      className="block text-center font-bold py-3.5 rounded-xl text-sm transition-all hover:-translate-y-0.5"
                      style={highlight
                        ? { background: 'linear-gradient(135deg, #16a34a, #4ade80)', boxShadow: '0 0 20px rgba(34,197,94,0.3)' }
                        : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }
                      }>
                      Get Started
                    </a>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-8 text-center">
            <p className="text-slate-600 text-sm">
              Need a custom setup for multiple branches?{' '}
              <a href="mailto:hello@madeforgyms.com" className="text-green-400 hover:text-green-300 transition-colors">
                Contact us →
              </a>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────── */}
      <section className="py-28 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <div className="relative rounded-3xl overflow-hidden py-20 px-8">
              {/* BG */}
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.05) 50%, rgba(192,132,252,0.08) 100%)', border: '1px solid rgba(34,197,94,0.2)' }} />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(34,197,94,0.12) 0%, transparent 70%)' }} />

              <div className="relative">
                <div className="flex items-center justify-center mx-auto mb-8">
                  <MFGLogo height={72} />
                </div>

                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
                  Your gym deserves<br />
                  <span className="gradient-text">better software</span>
                </h2>
                <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10">
                  Join gym owners who've left the group chats and notebooks behind.
                  Modern management starts today.
                </p>

                <a href="/portal"
                  className="group inline-flex items-center gap-2 font-bold px-10 py-5 rounded-2xl text-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
                  style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)', boxShadow: '0 0 40px rgba(34,197,94,0.35)' }}>
                  Start Managing Your Gym
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-2">
              <MFGLogo height={34} />
              <p className="text-slate-600 text-xs">madeforgyms.com</p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="/portal" className="hover:text-white transition-colors">Log in</a>
              <a href="/member" className="hover:text-white transition-colors">Member Portal</a>
              <a href="/coach" className="hover:text-white transition-colors">Coach Portal</a>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-slate-600 text-xs">© {new Date().getFullYear()} MadeForGyms. All rights reserved.</p>
            <p className="text-slate-700 text-xs">Built for Philippine gym owners 🇵🇭</p>
          </div>
        </div>
      </footer>

      {/* ── Global styles ────────────────────────────────────── */}
      <style>{`
        .gradient-text {
          background: linear-gradient(135deg, #4ade80 0%, #86efac 50%, #4ade80 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 4s linear infinite;
        }

        @keyframes gradient-shift {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }

        .hero-orb-1 {
          position: absolute;
          top: -10%;
          left: -5%;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%);
          animation: orb-float 10s ease-in-out infinite;
        }

        .hero-orb-2 {
          position: absolute;
          bottom: -10%;
          right: -5%;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(192,132,252,0.08) 0%, transparent 70%);
          animation: orb-float 13s ease-in-out infinite reverse;
        }

        .hero-orb-3 {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 700px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(56,189,248,0.04) 0%, transparent 70%);
          animation: orb-float 15s ease-in-out infinite;
        }

        @keyframes orb-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -20px) scale(1.03); }
          66% { transform: translate(-15px, 15px) scale(0.97); }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease forwards;
        }

        .animate-fade-in-up {
          opacity: 0;
          animation: fade-in-up 0.8s ease forwards;
        }

        .dashboard-float {
          position: relative;
          animation: dashboard-drift 8s ease-in-out infinite;
        }

        @keyframes dashboard-drift {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }

        .notif-float {
          animation: notif-drift 6s ease-in-out infinite;
        }

        @keyframes notif-drift {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(4px, -6px); }
        }

        .member-float {
          animation: member-drift 7s ease-in-out infinite reverse;
        }

        @keyframes member-drift {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(-4px, -8px); }
        }
      `}</style>
    </div>
  );
}
