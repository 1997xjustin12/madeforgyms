import { useState } from 'react';
import {
  Dumbbell, Users, CreditCard, Bell, ClipboardList,
  Smartphone, UserCheck, ChevronRight, Check, Star,
  Menu, X, Zap, Shield, BarChart3, MessageCircle,
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
];

const FEATURES = [
  {
    icon: Users,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    title: 'Member Management',
    desc: 'Register members, track membership status, handle renewals, and keep complete member history — all in one place.',
  },
  {
    icon: CreditCard,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    title: 'GCash Payments',
    desc: 'Members submit GCash payment proofs directly from their phone. You approve or reject with one tap.',
  },
  {
    icon: Bell,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    title: 'Telegram Alerts',
    desc: 'Get instant Telegram notifications when a member submits a payment. Review and approve without opening the app.',
  },
  {
    icon: Dumbbell,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    title: 'Coach Portal',
    desc: 'Assign personal trainers to members. Coaches get their own portal to add workout programs, meal plans, and notes.',
  },
  {
    icon: Smartphone,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    title: 'Member Self-Service',
    desc: 'Members check their own membership status, view coach programs, and submit renewal payments — no app download needed.',
  },
  {
    icon: ClipboardList,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    title: 'Attendance Tracking',
    desc: 'Log member check-ins with a simple kiosk-style interface. View attendance history and spot your regulars.',
  },
  {
    icon: BarChart3,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    title: 'Activity Logs',
    desc: 'Full audit trail of every action — who approved payments, who registered members, and when.',
  },
  {
    icon: Shield,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    title: 'Secure Admin Panel',
    desc: 'Password-protected admin dashboard with role separation — admins manage everything, coaches see only their members.',
  },
];

const STEPS = [
  {
    num: '01',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    title: 'Set Up Your Gym',
    desc: 'Add your GCash details, set membership prices, configure Telegram alerts, and invite your coaching staff in minutes.',
  },
  {
    num: '02',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    title: 'Register Members',
    desc: 'Register members with a photo, assign a coach, and track their plan. Members get instant access to their personal portal.',
  },
  {
    num: '03',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    title: 'Automate Renewals',
    desc: 'Members renew via GCash from their phone. You get a Telegram notification and approve with one tap — no back-and-forth.',
  },
  {
    num: '04',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    title: 'Grow Your Business',
    desc: 'Less admin work, happier members, and coaches who can focus on training. Let the system run your operations.',
  },
];

const PLANS = [
  {
    name: 'Basic',
    price: '₱499',
    period: '/month',
    desc: 'Perfect for small gyms getting started.',
    highlight: false,
    features: [
      'Up to 100 members',
      'Member portal',
      'GCash payment requests',
      'Attendance tracking',
      'Activity logs',
    ],
    cta: 'Get Started',
  },
  {
    name: 'Pro',
    price: '₱999',
    period: '/month',
    desc: 'Everything you need to run a professional gym.',
    highlight: true,
    features: [
      'Unlimited members',
      'Telegram notifications',
      'Coach / trainer portal',
      'Workout & meal plan builder',
      'Coaching add-on pricing',
      'Custom promos & pricing',
      'Priority support',
    ],
    cta: 'Get Started',
  },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Dumbbell size={20} className="text-white" />
            </div>
            <span className="font-black text-lg tracking-tight">GymOS</span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <a key={href} href={href} className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                {label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a href="/admin/login" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
              Log in
            </a>
            <a
              href="/member"
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
            >
              Member Portal
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden text-slate-400 hover:text-white p-1 transition-colors"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-800 px-4 py-4 space-y-3 bg-slate-950">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="block text-slate-300 hover:text-white font-medium py-1 transition-colors"
              >
                {label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <a href="/admin/login" className="text-center text-slate-400 py-2 text-sm font-medium">Log in</a>
              <a href="/member" className="text-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                Member Portal
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-28 px-4 sm:px-6">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-orange-500/8 rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-sky-500/6 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Zap size={12} />
            Built for Philippine Gyms
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight mb-6">
            Run Your Gym{' '}
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              Without the Paperwork
            </span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Members, payments, coaches, and attendance — all managed from one simple dashboard.
            Built for small gyms that want to operate like a big one.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/admin/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all hover:shadow-lg hover:shadow-orange-500/25 hover:-translate-y-0.5"
            >
              Get Started <ChevronRight size={18} />
            </a>
            <a
              href="/member"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors"
            >
              <UserCheck size={18} className="text-slate-400" /> View Member Portal
            </a>
          </div>

          <p className="text-slate-600 text-xs mt-5">Works on any device · No app install needed · GCash ready</p>
        </div>

        {/* Stats row */}
        <div className="max-w-2xl mx-auto mt-16 grid grid-cols-3 gap-4">
          {[
            { value: '100%', label: 'Web-based', sub: 'No app install' },
            { value: 'GCash', label: 'Payments', sub: 'Philippine-ready' },
            { value: '24/7', label: 'Member portal', sub: 'Self-service' },
          ].map(({ value, label, sub }) => (
            <div key={label} className="text-center bg-slate-800/50 border border-slate-700/50 rounded-2xl py-5 px-3">
              <p className="text-2xl font-black text-white">{value}</p>
              <p className="text-slate-300 text-sm font-semibold mt-0.5">{label}</p>
              <p className="text-slate-600 text-xs mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 sm:px-6 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Everything Your Gym Needs</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              From member check-in to coach programs — one platform handles it all.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, color, bg, border, title, desc }) => (
              <div
                key={title}
                className={`bg-slate-800/60 border ${border} rounded-2xl p-5 hover:bg-slate-800 transition-colors`}
              >
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={20} className={color} />
                </div>
                <h3 className="text-white font-bold mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sky-400 text-sm font-bold uppercase tracking-widest mb-3">How it Works</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Up and Running in Minutes</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              No complicated setup. No IT team required. Just log in and start managing.
            </p>
          </div>

          <div className="space-y-4">
            {STEPS.map(({ num, color, bg, border, title, desc }) => (
              <div
                key={num}
                className={`flex items-start gap-5 bg-slate-800/40 border ${border} rounded-2xl p-6 hover:bg-slate-800/60 transition-colors`}
              >
                <div className={`${bg} rounded-xl px-3 py-2 shrink-0`}>
                  <span className={`font-black text-lg ${color}`}>{num}</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Telegram highlight ───────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/60 border border-slate-700/50 rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-8">
            <div className="w-20 h-20 bg-sky-500/15 rounded-3xl flex items-center justify-center shrink-0">
              <MessageCircle size={40} className="text-sky-400" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-2xl font-black mb-3">Approve Payments from Telegram</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                When a member submits a GCash payment, you get an instant Telegram message with all the details
                and a direct link to approve or reject — without ever opening the dashboard.
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                {['Instant alerts', 'One-tap approve', 'View receipts', 'No login needed'].map((tag) => (
                  <span key={tag} className="bg-sky-500/10 border border-sky-500/25 text-sky-400 text-xs font-semibold px-3 py-1.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-green-400 text-sm font-bold uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Choose the plan that fits your gym's size and needs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {PLANS.map(({ name, price, period, desc, highlight, features, cta }) => (
              <div
                key={name}
                className={`rounded-2xl border p-7 flex flex-col ${
                  highlight
                    ? 'bg-orange-500/5 border-orange-500/40 ring-1 ring-orange-500/20'
                    : 'bg-slate-800/50 border-slate-700/50'
                }`}
              >
                {highlight && (
                  <div className="inline-flex items-center gap-1.5 bg-orange-500/15 text-orange-400 text-xs font-bold px-3 py-1 rounded-full mb-4 self-start">
                    <Star size={11} /> Most Popular
                  </div>
                )}
                <h3 className="text-white font-black text-xl mb-1">{name}</h3>
                <p className="text-slate-400 text-sm mb-4">{desc}</p>
                <div className="flex items-end gap-1 mb-6">
                  <span className={`text-4xl font-black ${highlight ? 'text-orange-400' : 'text-white'}`}>{price}</span>
                  {period && <span className="text-slate-500 text-sm mb-1">{period}</span>}
                </div>
                <ul className="space-y-2.5 flex-1 mb-7">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <Check size={15} className={`shrink-0 mt-0.5 ${highlight ? 'text-orange-400' : 'text-green-400'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="/admin/login"
                  className={`text-center font-bold py-3.5 rounded-xl transition-colors text-sm ${
                    highlight
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  {cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20 rounded-3xl py-16 px-8">
            <div className="w-16 h-16 bg-orange-500/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Dumbbell size={32} className="text-orange-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Ready to Modernize Your Gym?
            </h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
              Join gym owners who've stopped chasing members for payments and start focusing on what matters — their members' fitness.
            </p>
            <a
              href="/admin/login"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-4 rounded-2xl transition-all hover:shadow-xl hover:shadow-orange-500/25 hover:-translate-y-0.5 text-base"
            >
              Get Started <ChevronRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Dumbbell size={16} className="text-white" />
            </div>
            <span className="font-black text-base">GymOS</span>
            <span className="text-slate-600 text-sm">— Gym Management System</span>
          </div>
          <div className="flex items-center gap-6 text-slate-500 text-sm">
            <a href="/admin/login" className="hover:text-white transition-colors">Admin Login</a>
            <a href="/member" className="hover:text-white transition-colors">Member Portal</a>
            <a href="/coach" className="hover:text-white transition-colors">Coach Portal</a>
          </div>
          <p className="text-slate-600 text-xs">© {new Date().getFullYear()} GymOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
