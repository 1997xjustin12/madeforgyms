import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Dumbbell, ArrowLeft, User, Phone, Calendar,
  CheckCircle, AlertTriangle, XCircle, Clock, MapPin,
  CreditCard, Copy, ChevronRight, X, Upload, ImageIcon, Camera,
  FileText, UtensilsCrossed, ChevronDown, UserCheck, ChevronLeft,
  BarChart2, TrendingUp,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getTemplateForBMI } from '../utils/workoutTemplates';
import { getExerciseGif } from '../utils/exerciseAnimations';
import { QRCodeSVG } from 'qrcode.react';
import { useGym } from '../context/GymContext';
import { supabase } from '../lib/supabase';
import { formatDate, formatPhoneDisplay, calcBMI, getBMICategory, calcAge } from '../utils/helpers';

const COACH_TABS = [
  { key: 'note',      label: 'Notes',           Icon: FileText,        color: 'text-sky-400',    bg: 'bg-sky-500/15',    border: 'border-sky-500/30'    },
  { key: 'workout',   label: 'Workout Program',  Icon: Dumbbell,        color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  { key: 'meal_plan', label: 'Meal Plan',        Icon: UtensilsCrossed, color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30'  },
];

const PLAN_PRICE_KEY = {
  monthly:       'priceMonthly',
  quarterly:     'priceQuarterly',
  'semi-annual': 'priceSemiAnnual',
  annual:        'priceAnnual',
};

export default function MemberPortal() {
  const { members, getMemberStatus, MEMBERSHIP_OPTIONS, settings, submitRenewalRequest, submitAdvancePayment, renewalRequests, advancePayments, gymSlug, gymId } = useGym();

  // view: 'lookup' | 'pick' | 'result' | 'coach'
  const [view, setView]         = useState('lookup');
  const [phone, setPhone]       = useState('');
  const [matches, setMatches]   = useState([]);
  const [member, setMember]     = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [renewTarget, setRenewTarget] = useState(null);
  const [coachEntries, setCoachEntries]       = useState([]);
  const [coachInfo, setCoachInfo]             = useState(null);
  const [coachTab, setCoachTab]               = useState('note');
  const [expandedEntryId, setExpandedEntryId] = useState(null);
  const [coachingHistory, setCoachingHistory] = useState([]);
  const [historyOpen, setHistoryOpen]         = useState(false);
  const [checkInRecord, setCheckInRecord]     = useState(null); // null=unknown, false=not yet, {time}=done
  const [clockingIn, setClockingIn]           = useState(false);
  const [showAdvance, setShowAdvance]         = useState(false);
  const [advanceRenewTarget, setAdvanceRenewTarget] = useState(null);
  // Self-reported fitness data (stored in workout_plans)
  const [selfData, setSelfData] = useState(null); // { self_height, self_weight, self_birthdate }
  const [editingMetrics, setEditingMetrics] = useState(false);
  const [dashTab, setDashTab] = useState('overview');

  // Restore session on refresh — once members are loaded, check sessionStorage
  useEffect(() => {
    if (!members.length) return;
    const savedId = sessionStorage.getItem('memberPortal_id');
    if (!savedId) return;
    const found = members.find((m) => m.id === savedId);
    if (found) {
      setMember(found);
      setView('result');
    } else {
      sessionStorage.removeItem('memberPortal_id');
    }
  }, [members]);

  useEffect(() => {
    if (!member?.instructorId) {
      setCoachEntries([]);
      setCoachInfo(null);
      return;
    }
    const fetch = async () => {
      const [{ data: entries }, { data: inst }] = await Promise.all([
        supabase
          .from('coach_entries')
          .select('*')
          .eq('gym_id', gymId)
          .eq('member_id', member.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('instructors')
          .select('id, name, specialty, photo_url')
          .eq('gym_id', gymId)
          .eq('id', member.instructorId)
          .single(),
      ]);
      setCoachEntries(entries || []);
      setCoachInfo(inst || null);
    };
    fetch();
  }, [member]);

  // Check today's attendance for the member
  useEffect(() => {
    if (!member?.id) { setCheckInRecord(null); return; }
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('attendance')
      .select('id, checked_in_at')
      .eq('gym_id', gymId)
      .eq('member_id', member.id)
      .gte('checked_in_at', `${today}T00:00:00`)
      .lte('checked_in_at', `${today}T23:59:59`)
      .maybeSingle()
      .then(({ data }) => setCheckInRecord(data || false));
  }, [member?.id, gymId]);

  const handleClockIn = async () => {
    if (clockingIn || checkInRecord) return;
    setClockingIn(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from('attendance').insert([{
        gym_id: gymId,
        member_id: member.id,
        member_name: member.name,
        checked_in_at: now,
      }]);
      if (error) throw error;
      setCheckInRecord({ checked_in_at: now });
    } catch (err) {
      alert('Clock-in failed: ' + err.message);
    } finally {
      setClockingIn(false);
    }
  };

  // Fetch coaching subscription history
  useEffect(() => {
    if (!member?.id) { setCoachingHistory([]); return; }
    supabase
      .from('coaching_subscriptions')
      .select('*')
      .eq('gym_id', gymId)
      .eq('member_id', member.id)
      .order('start_date', { ascending: false })
      .then(({ data }) => setCoachingHistory(data || []));
  }, [member?.id]);

  // Load self-reported metrics from workout_plans when member changes
  useEffect(() => {
    if (!member?.id || !gymId) { setSelfData(null); return; }
    supabase.from('workout_plans')
      .select('self_height, self_weight, self_birthdate, fitness_level')
      .eq('gym_id', gymId).eq('member_id', member.id)
      .maybeSingle()
      .then(({ data }) => setSelfData(data || null));
  }, [member?.id, gymId]);

  // Reset dashboard tab when member changes
  useEffect(() => { setDashTab('overview'); }, [member?.id]);

  const handleLookup = (e) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (!digits) return;

    const found = members.filter((m) =>
      m.contactNumber.replace(/\D/g, '').endsWith(digits) ||
      digits.endsWith(m.contactNumber.replace(/\D/g, ''))
    );

    if (found.length === 0) {
      setNotFound(true);
    } else if (found.length === 1) {
      setMember(found[0]);
      sessionStorage.setItem('memberPortal_id', found[0].id);
      setNotFound(false);
      setView('result');
    } else {
      // Multiple members share this number — let them pick
      setMatches(found);
      setNotFound(false);
      setView('pick');
    }
  };

  const goHome = () => {
    sessionStorage.removeItem('memberPortal_id');
    setView('lookup');
    setPhone('');
    setMember(null);
    setMatches([]);
    setNotFound(false);
    setCoachingHistory([]);
    setHistoryOpen(false);
    setCheckInRecord(null);
    setSelfData(null);
    setEditingMetrics(false);
  };

  const getMembershipLabel = (type) => {
    if (type === 'student') return 'Student';
    const standard = MEMBERSHIP_OPTIONS.find((o) => o.value === type);
    if (standard) return standard.label;
    return type;
  };

  // ── Lookup View ────────────────────────────────────────────────
  if (view === 'lookup') {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-2/5 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.10) 0%, transparent 65%)' }} />

        {/* Subtle back link */}
        <div className="relative z-10 px-6 pt-6">
          <Link to={`/${gymSlug}`} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-400 text-sm transition-colors">
            <ArrowLeft size={14} /> Home
          </Link>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 -mt-6">
          <div className="w-full max-w-sm space-y-8">
            <div className="text-center">
              {/* Icon with ambient glow */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-2 rounded-3xl opacity-40 blur-xl animate-pulse pointer-events-none"
                  style={{ background: 'rgba(34,197,94,0.6)' }} />
                <div className="relative w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.22), rgba(74,222,128,0.08))', border: '1px solid rgba(74,222,128,0.18)' }}>
                  <Dumbbell size={32} className="text-green-400" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Member Portal</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Enter your registered phone number<br />to access your membership</p>
            </div>

            <form onSubmit={handleLookup} className="space-y-3">
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setNotFound(false); }}
                placeholder="09123456789"
                className="w-full text-white rounded-2xl px-5 py-4 outline-none placeholder:text-slate-700 text-xl text-center font-mono tracking-widest border transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: notFound ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)' }}
                onFocus={(e) => { if (!notFound) e.target.style.borderColor = 'rgba(74,222,128,0.45)'; }}
                onBlur={(e) => { e.target.style.borderColor = notFound ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'; }}
              />

              {notFound && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <XCircle size={16} className="text-red-400 shrink-0" />
                  <p className="text-red-300 text-sm">No member found. Please try again.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!phone.trim()}
                className="w-full disabled:opacity-40 text-white font-bold py-4 rounded-2xl text-base transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)', boxShadow: phone.trim() ? '0 8px 32px rgba(34,197,94,0.25)' : 'none' }}
              >
                View My Membership
              </button>
            </form>

          </div>
        </div>
      </div>
    );
  }

  // ── Pick View (multiple members, same number) ──────────────────
  if (view === 'pick') {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
            <button onClick={() => setView('lookup')} className="text-slate-400 hover:text-white p-1 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)' }}>
                <Dumbbell size={16} className="text-white" />
              </div>
              <span className="font-bold text-white">Member Portal</span>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto w-full px-4 py-8 space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <User size={28} className="text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Who are you?</h2>
            <p className="text-slate-400 text-sm">Multiple members are registered under this number.<br />Please select your name.</p>
          </div>

          <div className="space-y-2">
            {matches.map((m) => {
              const { status } = getMemberStatus(m);
              return (
                <button
                  key={m.id}
                  onClick={() => { setMember(m); sessionStorage.setItem('memberPortal_id', m.id); setView('result'); }}
                  className="w-full flex items-center gap-4 rounded-2xl p-4 text-left transition-all border hover:border-green-500/40"
                  style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-700 shrink-0">
                    {m.photo ? (
                      <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-green-400 font-black text-xl">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold truncate">{m.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5 capitalize">{getMembershipLabel(m.membershipType)}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    status === 'expired'  ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                    status === 'expiring' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' :
                                            'bg-green-500/10 text-green-400 border border-green-500/30'
                  }`}>
                    {status === 'expired' ? 'Expired' : status === 'expiring' ? 'Expiring' : 'Active'}
                  </span>
                  <ChevronRight size={16} className="text-slate-500 shrink-0" />
                </button>
              );
            })}
          </div>

          <button
            onClick={goHome}
            className="w-full text-slate-500 hover:text-slate-300 text-sm font-medium py-2 transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ── Coach View ─────────────────────────────────────────────────
  if (view === 'coach' && coachInfo) {
    const tab = COACH_TABS.find((t) => t.key === coachTab);
    const tabEntries = coachEntries.filter((e) => e.type === coachTab);

    return (
      <div className="min-h-screen bg-[#030712] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
            <button onClick={() => setView('result')} className="text-slate-400 hover:text-white p-1 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-700 shrink-0">
              {coachInfo.photo_url ? (
                <img src={coachInfo.photo_url} alt={coachInfo.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-yellow-400 font-bold text-sm">
                  {coachInfo.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">{coachInfo.name}</p>
              {coachInfo.specialty && <p className="text-yellow-400 text-xs truncate">{coachInfo.specialty}</p>}
            </div>
          </div>

          {/* Tab bar */}
          <div className="max-w-lg mx-auto px-4 pb-3 flex gap-2">
            {COACH_TABS.map(({ key, label, Icon, color, bg, border }) => {
              const count = coachEntries.filter((e) => e.type === key).length;
              const isActive = coachTab === key;
              return (
                <button
                  key={key}
                  onClick={() => { setCoachTab(key); setExpandedEntryId(null); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors border ${
                    isActive ? `${bg} ${color} ${border}` : 'text-slate-500 border-white/8'
                  }`}
                >
                  <Icon size={13} />
                  <span>{label.split(' ')[0]}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none ${isActive ? 'bg-white/10' : 'bg-slate-700 text-slate-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Entries */}
        <div className="max-w-lg mx-auto w-full px-4 py-4 flex-1">
          {tabEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${tab.bg}`}>
                <tab.Icon size={28} className={tab.color} />
              </div>
              <p className="text-slate-400 font-semibold">No {tab.label.toLowerCase()} yet</p>
              <p className="text-slate-600 text-sm mt-1">Your coach hasn't added anything here yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tabEntries.map((entry, idx) => {
                const isExpanded = expandedEntryId === entry.id;
                const isFirst = idx === 0;
                return (
                  <button
                    key={entry.id}
                    onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                    className={`w-full text-left rounded-2xl border transition-all overflow-hidden ${
                      isExpanded
                        ? `${tab.bg} ${tab.border}`
                        : 'border-white/8 hover:border-white/20'
                    }`}
                  >
                    {/* Row header */}
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isExpanded ? 'bg-white/10' : 'bg-slate-700'
                      }`}>
                        <tab.Icon size={15} className={isExpanded ? tab.color : 'text-slate-400'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {entry.title ? (
                          <p className={`font-semibold text-sm truncate ${isExpanded ? 'text-white' : 'text-slate-200'}`}>
                            {entry.title}
                          </p>
                        ) : (
                          <p className={`text-sm truncate ${isExpanded ? 'text-slate-200' : 'text-slate-400'}`}>
                            {entry.content.split('\n')[0].slice(0, 60)}{entry.content.length > 60 ? '…' : ''}
                          </p>
                        )}
                        <p className="text-slate-600 text-xs mt-0.5">
                          {new Date(entry.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {isFirst && <span className="ml-1.5 text-yellow-500/80 font-semibold">· Latest</span>}
                        </p>
                      </div>
                      <ChevronDown
                        size={15}
                        className={`text-slate-500 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-white/10">
                        <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                          {entry.content}
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Result View ────────────────────────────────────────────────
  if (view === 'result' && member) {
    const { status, daysLeft } = getMemberStatus(member);
    const needsRenewal = status === 'expiring' || status === 'expired';
    const latestRequest = renewalRequests
      .filter((r) => r.member_id === member.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    const showPaymentStatus = latestRequest && latestRequest.status !== 'approved';

    const startMs  = new Date(member.membershipStartDate).setHours(0,0,0,0);
    const endMs    = new Date(member.membershipEndDate).setHours(0,0,0,0);
    const todayMs  = new Date().setHours(0,0,0,0);
    const totalD   = Math.max(1, Math.round((endMs - startMs) / 86400000));
    const elapsed  = Math.round((todayMs - startMs) / 86400000);
    const progress = Math.min(100, Math.max(0, (elapsed / totalD) * 100));

    const theme = {
      active:   { gradient: 'from-green-500/20',  bar: 'bg-green-500',  badge: 'bg-green-500/15 text-green-400 border-green-500/30',  icon: <CheckCircle  size={13} />, label: 'Active'        },
      expiring: { gradient: 'from-orange-500/20', bar: 'bg-orange-400', badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: <AlertTriangle size={13} />, label: 'Expiring Soon' },
      expired:  { gradient: 'from-red-500/20',    bar: 'bg-red-500',    badge: 'bg-red-500/15 text-red-400 border-red-500/30',          icon: <XCircle      size={13} />, label: 'Expired'       },
    }[status];

    const today = new Date(); today.setHours(0,0,0,0);
    const coachEnd = member.coachingEndDate ? (() => { const d = new Date(member.coachingEndDate); d.setHours(0,0,0,0); return d; })() : null;
    const coachDays   = coachEnd ? Math.ceil((coachEnd - today) / 86400000) : null;
    const coachActive = coachDays !== null && coachDays >= 0;
    const coachWarn   = coachDays !== null && coachDays > 0 && coachDays <= 5;

    const pastCoaching = coachingHistory.filter((s) => {
      if (!s.end_date) return false;
      const e = new Date(s.end_date); e.setHours(0,0,0,0);
      if (s.instructor_id === member.instructorId && s.start_date === member.coachingStartDate && e >= today) return false;
      return e <= today;
    });

    // BMI from effective metrics
    const effH  = member.height    || selfData?.self_height;
    const effW  = member.weight    || selfData?.self_weight;
    const effBd = member.birthdate || selfData?.self_birthdate;
    const bmi    = calcBMI(effH, effW);
    const bmiCat = getBMICategory(bmi);
    const age    = calcAge(effBd);

    const DASH_TABS = [
      { key: 'overview', label: 'Overview', Icon: BarChart2 },
      { key: 'workout',  label: 'Workout',  Icon: Dumbbell  },
      ...(coachInfo ? [{ key: 'coach', label: 'Coach', Icon: UserCheck }] : []),
    ];

    return (
      <div className="min-h-screen bg-[#030712] flex flex-col">

        {/* ── Top bar ── */}
        <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5" style={{ background: 'rgba(3,7,18,0.85)' }}>
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
            <button onClick={goHome} className="text-slate-400 hover:text-white p-1 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#16a34a,#4ade80)' }}>
              <Dumbbell size={14} className="text-white" />
            </div>
            <span className="font-bold text-white flex-1 truncate text-sm">{member.name}</span>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${theme.badge}`}>
              {theme.icon}{theme.label}
            </span>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto pb-28">
          <div className="max-w-lg mx-auto">

            {/* ── Hero Banner ── */}
            <div className={`relative px-4 pt-6 pb-5 bg-gradient-to-b ${theme.gradient} to-transparent`}>
              <div className="flex items-end gap-4">
                {/* Avatar with status ring */}
                <div className={`w-20 h-20 rounded-3xl overflow-hidden bg-slate-700 shrink-0 ring-2 ring-offset-2 ring-offset-[#030712] ${
                  status === 'expired' ? 'ring-red-500/50' : status === 'expiring' ? 'ring-orange-400/50' : 'ring-green-500/50'
                }`}>
                  {member.photo
                    ? <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center font-black text-3xl text-green-400">{member.name.charAt(0).toUpperCase()}</div>
                  }
                </div>
                {/* Name / meta */}
                <div className="flex-1 min-w-0 pb-1">
                  <h2 className="text-white font-black text-xl leading-tight truncate">{member.name}</h2>
                  <p className="text-slate-400 text-xs mt-1 font-semibold uppercase tracking-wider">{getMembershipLabel(member.membershipType)}</p>
                  <p className="text-slate-600 text-xs flex items-center gap-1 mt-1.5">
                    <Phone size={10} />{formatPhoneDisplay(member.contactNumber)}
                  </p>
                </div>
                {/* QR */}
                {member.qrToken && (
                  <div className="shrink-0 self-start flex flex-col items-center gap-1">
                    <div className="bg-white p-1.5 rounded-xl shadow-xl">
                      <QRCodeSVG value={`${window.location.origin}/${gymSlug}/m/${member.qrToken}`} size={56} level="M" includeMargin={false} />
                    </div>
                    <p className="text-[9px] text-slate-600 font-medium tracking-wide">SCAN IN</p>
                  </div>
                )}
              </div>

              {/* Quick-stat chips */}
              <div className="grid grid-cols-3 gap-2 mt-5">
                {/* Days */}
                <div className={`rounded-2xl p-3.5 border ${status === 'expired' ? 'border-red-500/20' : status === 'expiring' ? 'border-orange-400/20' : 'border-white/8'}`}
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <Calendar size={11} className={`mb-1.5 ${status === 'expired' ? 'text-red-500/50' : status === 'expiring' ? 'text-orange-500/50' : 'text-slate-600'}`} />
                  <p className={`text-2xl font-black leading-none tabular-nums ${status === 'expired' ? 'text-red-400' : status === 'expiring' ? 'text-orange-400' : 'text-white'}`}>
                    {Math.abs(daysLeft)}
                  </p>
                  <p className="text-slate-500 text-[10px] mt-1 leading-tight font-medium">
                    {status === 'expired' ? 'overdue' : 'days left'}
                  </p>
                </div>
                {/* BMI */}
                {bmi && bmiCat ? (
                  <div className="rounded-2xl p-3.5 border border-white/8" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <TrendingUp size={11} className={`mb-1.5 opacity-50 ${bmiCat.color}`} />
                    <p className={`text-2xl font-black leading-none tabular-nums ${bmiCat.color}`}>{bmi.toFixed(1)}</p>
                    <p className="text-slate-500 text-[10px] mt-1 leading-tight font-medium">{bmiCat.label}</p>
                  </div>
                ) : (
                  <button onClick={() => setDashTab('workout')}
                    className="rounded-2xl p-3.5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 hover:border-green-500/30 transition-colors">
                    <Dumbbell size={16} className="text-slate-600" />
                    <p className="text-slate-600 text-[10px] leading-tight font-medium text-center">Set BMI</p>
                  </button>
                )}
                {/* Check-in */}
                <div className={`rounded-2xl p-3.5 border ${checkInRecord ? 'border-green-500/30' : 'border-white/8'}`}
                  style={{ background: checkInRecord ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.06)' }}>
                  <Clock size={11} className={`mb-1.5 ${checkInRecord ? 'text-green-500/50' : 'text-slate-600'}`} />
                  <p className={`text-2xl font-black leading-none ${checkInRecord ? 'text-green-400' : 'text-slate-600'}`}>
                    {checkInRecord ? '✓' : '–'}
                  </p>
                  <p className="text-slate-500 text-[10px] mt-1 leading-tight font-medium">
                    {checkInRecord
                      ? new Date(checkInRecord.checked_in_at).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })
                      : 'Not in yet'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Tab switcher ── */}
            <div className="px-4 pt-1 pb-3">
              <div className="flex gap-1 p-1 rounded-2xl bg-slate-800/70">
                {DASH_TABS.map(({ key, label, Icon }) => (
                  <button key={key} onClick={() => setDashTab(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      dashTab === key ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:text-white'
                    }`}>
                    <Icon size={13} />{label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Tab content ── */}
            <div className="px-4 space-y-3 pb-4">

              {/* Overview */}
              {dashTab === 'overview' && (
                <>
                  {/* Clock-in CTA */}
                  {checkInRecord ? (
                    <div className="rounded-2xl border border-green-500/20 p-4 flex items-center gap-3" style={{ background: 'rgba(34,197,94,0.06)' }}>
                      <div className="w-11 h-11 bg-green-500/20 rounded-xl flex items-center justify-center shrink-0">
                        <CheckCircle size={22} className="text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-green-400 font-bold text-sm">You're in — great work!</p>
                        <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          Checked in at {new Date(checkInRecord.checked_in_at).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      {status !== 'expired' && !clockingIn && (
                        <div className="absolute inset-0 rounded-2xl animate-pulse opacity-25 pointer-events-none"
                          style={{ background: 'linear-gradient(135deg,#0ea5e9,#38bdf8)', filter: 'blur(12px)', transform: 'scale(1.04)' }} />
                      )}
                      <button onClick={handleClockIn} disabled={clockingIn || status === 'expired'}
                        className="relative w-full flex items-center justify-center gap-2.5 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 text-base active:scale-[0.98]"
                        style={{ background: status === 'expired' ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg,#0ea5e9,#38bdf8)', boxShadow: status !== 'expired' ? '0 4px 24px rgba(14,165,233,0.3)' : 'none' }}>
                        {clockingIn ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserCheck size={20} />}
                        {status === 'expired' ? 'Membership Expired' : 'Clock In Now'}
                      </button>
                    </div>
                  )}

                  {/* Membership card */}
                  <div className="rounded-2xl border border-white/8 overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {/* Left accent bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${theme.bar}`} />
                    <div className="flex items-center justify-between px-5 pt-4 pb-2 pl-6">
                      <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Membership</p>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${theme.badge}`}>{theme.label}</span>
                    </div>
                    <div className="px-5 pb-2 pl-6">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-5xl font-black tabular-nums leading-none ${status === 'expired' ? 'text-red-400' : status === 'expiring' ? 'text-orange-400' : 'text-white'}`}>
                          {Math.abs(daysLeft)}
                        </span>
                        <span className="text-slate-400 text-sm">{status === 'expired' ? 'days overdue' : 'days remaining'}</span>
                      </div>
                    </div>
                    <div className="px-5 pb-2 pl-6">
                      <div className="h-1.5 bg-slate-700/80 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{
                          width: `${progress}%`,
                          background: status === 'expired' ? '#ef4444'
                            : status === 'expiring' ? 'linear-gradient(to right, #f97316, #fb923c)'
                            : 'linear-gradient(to right, #16a34a, #4ade80)',
                        }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-5 pb-4 pl-6">
                      <span className="text-slate-600 text-xs">{formatDate(member.membershipStartDate)}</span>
                      <span className={`text-xs ${status !== 'active' ? 'text-red-400/70' : 'text-slate-600'}`}>{formatDate(member.membershipEndDate)}</span>
                    </div>
                  </div>

                  {/* BMI card */}
                  {bmi && bmiCat && (() => {
                    const pct = Math.min(100, Math.max(0, ((bmi - 10) / (40 - 10)) * 100));
                    return (
                      <div className="rounded-2xl border border-white/8 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-semibold text-sm">Body Mass Index</p>
                            {age !== null && <span className="text-slate-500 text-xs">· {age} yrs old</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${bmiCat.color} ${bmiCat.border} ${bmiCat.bg}`}>{bmiCat.label}</span>
                            {!member.height && <button onClick={() => setEditingMetrics(true)} className="text-slate-500 hover:text-slate-300 text-xs underline">Edit</button>}
                          </div>
                        </div>
                        {/* BMI number + body figure */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-end gap-3">
                              <p className={`text-4xl font-black tabular-nums ${bmiCat.color}`}>{bmi.toFixed(1)}</p>
                              <div className="pb-1 text-slate-500 text-xs space-y-0.5">
                                {effH && <p>{effH} cm</p>}
                                {effW && <p>{effW} kg</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className="absolute inset-0 flex">
                            <div className="flex-1 bg-sky-500/40" /><div className="flex-1 bg-green-500/40" />
                            <div className="flex-1 bg-orange-400/40" /><div className="flex-1 bg-red-500/40" />
                          </div>
                          <div className={`absolute top-0 w-3 h-3 -mt-0.5 rounded-full border-2 border-white shadow ${bmiCat.color.replace('text-','bg-')}`}
                            style={{ left: `calc(${pct}% - 6px)` }} />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-600 mt-1.5">
                          <span>Underweight</span><span>Normal</span><span>Overweight</span><span>Obese</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Payment status */}
                  {showPaymentStatus && <PaymentStatus request={latestRequest} />}

                  {/* Renew */}
                  {needsRenewal && settings.gcashNumber && latestRequest?.status !== 'pending' && (
                    <button onClick={() => setRenewTarget(member)}
                      className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-green-500/20 text-base">
                      <CreditCard size={18} />
                      {latestRequest?.status === 'rejected' ? 'Resubmit Payment' : 'Renew via GCash'}
                    </button>
                  )}

                  {/* Advance payments */}
                  {(() => {
                    const memberAdvPayments = advancePayments.filter((p) => p.member_id === member.id && (p.status === 'queued' || p.status === 'pending'));
                    if (!memberAdvPayments.length) return null;
                    const queued  = memberAdvPayments.filter((p) => p.status === 'queued');
                    const pending = memberAdvPayments.filter((p) => p.status === 'pending');
                    return (
                      <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <button onClick={() => setShowAdvance((v) => !v)}
                          className="w-full flex items-center justify-between px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <CreditCard size={14} className="text-violet-400" />
                            <span className="text-white font-semibold text-sm">Advance Payments</span>
                            {queued.length  > 0 && <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full font-semibold">{queued.length} queued</span>}
                            {pending.length > 0 && <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-semibold">{pending.length} pending</span>}
                          </div>
                          <ChevronDown size={14} className={`text-slate-500 transition-transform ${showAdvance ? 'rotate-180' : ''}`} />
                        </button>
                        {showAdvance && (
                          <div className="border-t border-white/8 px-4 pb-4 pt-3 space-y-2">
                            {memberAdvPayments.map((p) => (
                              <div key={p.id} className={`flex items-center justify-between rounded-xl px-3 py-2.5 border ${p.status === 'queued' ? 'bg-violet-500/10 border-violet-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
                                <div>
                                  <p className={`text-sm font-semibold capitalize ${p.status === 'queued' ? 'text-violet-300' : 'text-orange-300'}`}>{p.membership_type} membership</p>
                                  <p className="text-slate-400 text-xs mt-0.5">{p.status === 'queued' ? '✓ Approved — auto-applies on expiry' : '⏳ Awaiting admin approval'}</p>
                                </div>
                                {p.amount > 0 && <span className="text-slate-400 text-xs shrink-0">₱{Number(p.amount).toLocaleString()}</span>}
                              </div>
                            ))}
                            {settings.gcashNumber && (
                              <button onClick={() => setAdvanceRenewTarget(member)}
                                className="w-full mt-1 flex items-center justify-center gap-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 font-semibold py-3 rounded-xl transition-colors text-sm">
                                <CreditCard size={14} /> Pay Advance via GCash
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}

              {/* Workout */}
              {dashTab === 'workout' && (
                <WorkoutSection
                  member={member}
                  selfData={selfData}
                  gymId={gymId}
                  onSelfDataSaved={(d) => { setSelfData(d); setEditingMetrics(false); }}
                  forceSetup={editingMetrics}
                  onSetupCancel={() => setEditingMetrics(false)}
                />
              )}

              {/* Coach */}
              {dashTab === 'coach' && coachInfo && (() => {
                const coachExpired = coachDays !== null && coachDays < 0;
                return (
                  <div className="space-y-3">
                    {/* Coach profile card */}
                    <div className={`rounded-2xl border overflow-hidden ${coachExpired ? 'border-white/5' : 'border-yellow-500/20'}`}
                      style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="flex items-center gap-4 p-5">
                        <div className={`w-16 h-16 rounded-2xl overflow-hidden bg-slate-700 shrink-0 ${coachExpired ? 'opacity-40' : ''}`}>
                          {coachInfo.photo_url
                            ? <img src={coachInfo.photo_url} alt={coachInfo.name} className="w-full h-full object-cover" />
                            : <div className={`w-full h-full flex items-center justify-center font-black text-2xl ${coachExpired ? 'text-slate-500' : 'text-yellow-400'}`}>{coachInfo.name.charAt(0).toUpperCase()}</div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${coachExpired ? 'text-slate-600' : 'text-yellow-500/80'}`}>
                            {coachExpired ? 'Previous Coach' : 'Your Coach'}
                          </p>
                          <p className={`font-black text-lg leading-tight truncate ${coachExpired ? 'text-slate-400' : 'text-white'}`}>{coachInfo.name}</p>
                          {coachInfo.specialty && <p className="text-slate-500 text-xs mt-0.5 truncate">{coachInfo.specialty}</p>}
                        </div>
                        {coachExpired
                          ? <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-500">Ended</span>
                          : coachActive && (
                            <div className={`shrink-0 text-right ${coachWarn ? 'text-orange-400' : 'text-yellow-400'}`}>
                              <p className="text-sm font-bold">{coachDays === 0 ? 'Today' : `${coachDays}d`}</p>
                              <p className="text-[10px] opacity-60">left</p>
                            </div>
                          )
                        }
                      </div>
                      <div className={`border-t border-white/8 px-4 py-3 grid grid-cols-3 gap-2 ${coachExpired ? 'opacity-50' : ''}`}>
                        {COACH_TABS.map(({ key, label, Icon, color, bg, border }) => {
                          const count = coachEntries.filter((e) => e.type === key).length;
                          return (
                            <button key={key}
                              onClick={() => { setCoachTab(key); setExpandedEntryId(null); setView('coach'); }}
                              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${count > 0 ? `${bg} ${color} ${border}` : 'bg-white/5 text-slate-600 border-white/8'}`}>
                              <Icon size={18} />
                              <span className="text-[10px] font-bold leading-none">{label.split(' ')[0]}</span>
                              <span className={`text-[10px] ${count > 0 ? 'opacity-70' : 'opacity-40'}`}>{count > 0 ? `${count} item${count !== 1 ? 's' : ''}` : 'empty'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Coaching history */}
                    {pastCoaching.length > 0 && (
                      <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <button onClick={() => setHistoryOpen((o) => !o)}
                          className="w-full flex items-center justify-between px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Clock size={13} className="text-slate-500" />
                            <span className="text-slate-300 text-sm font-semibold">Coaching History</span>
                            <span className="text-[11px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{pastCoaching.length}</span>
                          </div>
                          <ChevronDown size={14} className={`text-slate-500 transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {historyOpen && (
                          <div className="border-t border-white/8 divide-y divide-white/5">
                            {pastCoaching.map((sub) => (
                              <div key={sub.id} className="px-4 py-3 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
                                  <UserCheck size={13} className="text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-slate-300 text-sm font-semibold truncate">{sub.instructor_name || 'Coach'}</p>
                                  <p className="text-slate-500 text-xs mt-0.5">
                                    {sub.coaching_plan && <span className="mr-1">{sub.coaching_plan} ·</span>}
                                    {sub.start_date ? formatDate(sub.start_date) : '—'} → {sub.end_date ? formatDate(sub.end_date) : '—'}
                                  </p>
                                </div>
                                <span className="text-[11px] text-slate-500 bg-slate-700/60 px-2 py-0.5 rounded-full shrink-0">Ended</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          </div>
        </div>

        {/* ── Fixed bottom tab bar ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/8"
          style={{ background: 'rgba(3,7,18,0.95)', backdropFilter: 'blur(20px)' }}>
          <div className="max-w-lg mx-auto flex safe-bottom">
            {DASH_TABS.map(({ key, label, Icon }) => (
              <button key={key} onClick={() => setDashTab(key)}
                className={`relative flex-1 flex flex-col items-center gap-1 pt-3 pb-4 transition-all ${dashTab === key ? 'text-green-400' : 'text-slate-500 hover:text-slate-300'}`}>
                {dashTab === key && (
                  <span className="absolute top-0 left-[28%] right-[28%] h-0.5 rounded-full bg-green-400" />
                )}
                <Icon size={20} />
                <span className="text-[10px] font-bold">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {renewTarget && (
          <RenewalModal member={renewTarget} settings={settings} MEMBERSHIP_OPTIONS={MEMBERSHIP_OPTIONS}
            submitRenewalRequest={submitRenewalRequest} onClose={() => setRenewTarget(null)} />
        )}
        {advanceRenewTarget && (
          <AdvanceGCashModal member={advanceRenewTarget} settings={settings}
            submitAdvancePayment={submitAdvancePayment} onClose={() => setAdvanceRenewTarget(null)} />
        )}
      </div>
    );
  }

  return null;
}

/* ── Renewal Modal ──────────────────────────────────────────────── */
function RenewalModal({ member, settings, MEMBERSHIP_OPTIONS, submitRenewalRequest, onClose }) {
  const activePromos = settings.promos?.filter((p) => p.active) || [];

  const [step, setStep]               = useState('plan');
  const [plan, setPlan]               = useState(MEMBERSHIP_OPTIONS[0].value);
  const [coachingAddOn, setCoachingAddOn] = useState(false);
  const [reference, setReference]     = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [copied, setCopied]           = useState(false);
  const receiptInputRef               = useRef(null);
  const cameraInputRef                = useRef(null);

  const selectedPromo = activePromos.find((p) => p.name === plan);
  const isStudent = plan === 'student';
  const price = isStudent
    ? settings.priceStudent
    : selectedPromo
    ? selectedPromo.price
    : (settings[PLAN_PRICE_KEY[plan]] || 0);
  const planLabel = isStudent
    ? 'Student'
    : selectedPromo
    ? plan
    : (MEMBERSHIP_OPTIONS.find((o) => o.value === plan)?.label || plan);
  const selectedDurationDays = isStudent
    ? 30
    : selectedPromo?.duration_days || null;

  const coachingFee  = coachingAddOn ? (Number(settings.priceCoaching) || 0) : 0;
  const totalAmount  = price + coachingFee;

  const canSubmit = reference.trim() || receiptFile;

  const handleReceiptFile = (file) => {
    if (!file) return;
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (receiptInputRef.current) receiptInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(settings.gcashNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await submitRenewalRequest({
        memberId:          member.id,
        memberName:        member.name,
        contactNumber:     member.contactNumber,
        membershipType:    plan,
        amount:            totalAmount,
        gcashReference:    reference.trim(),
        receiptFile,
        durationDays:      selectedDurationDays,
        coachingRequested: coachingAddOn,
        coachingPrice:     coachingFee,
      });
      setStep('done');
    } catch (err) {
      alert('Failed to submit: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl w-full max-w-md shadow-2xl border border-white/10 flex flex-col max-h-[85vh]" style={{ background: '#0f172a' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-green-400" />
            <h3 className="text-white font-semibold">Pay via GCash</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">

          {/* Step 1: Select Plan */}
          {step === 'plan' && (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm">Select a renewal plan for <span className="text-white font-semibold">{member.name}</span>:</p>

              <div className="space-y-2">
                {MEMBERSHIP_OPTIONS.filter((opt) => (settings[PLAN_PRICE_KEY[opt.value]] || 0) > 0).map((opt) => {
                  const optPrice = settings[PLAN_PRICE_KEY[opt.value]];
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                        plan === opt.value
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-slate-600 bg-slate-700/40 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input type="radio" name="plan" value={opt.value} checked={plan === opt.value}
                          onChange={() => setPlan(opt.value)} className="accent-green-500" />
                        <span className={`font-medium ${plan === opt.value ? 'text-green-400' : 'text-white'}`}>{opt.label}</span>
                      </div>
                      <span className={`font-bold ${plan === opt.value ? 'text-green-400' : 'text-slate-300'}`}>
                        ₱{optPrice.toLocaleString()}
                      </span>
                    </label>
                  );
                })}

                {settings.priceStudent > 0 && (
                  <>
                    <p className="text-sky-400 text-xs font-medium uppercase tracking-wider pt-1">Student</p>
                    <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      plan === 'student' ? 'border-sky-500 bg-sky-500/10' : 'border-slate-600 bg-slate-700/40 hover:border-slate-500'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="plan" value="student" checked={plan === 'student'}
                          onChange={() => setPlan('student')} className="accent-sky-500" />
                        <div>
                          <span className={`font-medium ${plan === 'student' ? 'text-sky-300' : 'text-white'}`}>Student</span>
                          <span className="text-slate-500 text-xs ml-2">30 days</span>
                        </div>
                      </div>
                      <span className={`font-bold ${plan === 'student' ? 'text-sky-300' : 'text-slate-300'}`}>
                        ₱{Number(settings.priceStudent).toLocaleString()}
                      </span>
                    </label>
                  </>
                )}

                {activePromos.length > 0 && (
                  <>
                    <p className="text-purple-400 text-xs font-medium uppercase tracking-wider pt-1">Special Promos</p>
                    {activePromos.map((promo) => (
                      <label key={promo.id} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                        plan === promo.name ? 'border-purple-500 bg-purple-500/10' : 'border-slate-600 bg-slate-700/40 hover:border-slate-500'
                      }`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="plan" value={promo.name} checked={plan === promo.name}
                            onChange={() => setPlan(promo.name)} className="accent-purple-500" />
                          <div>
                            <span className={`font-medium ${plan === promo.name ? 'text-purple-300' : 'text-white'}`}>{promo.name}</span>
                            <span className="text-slate-500 text-xs ml-2">{promo.duration_days} days</span>
                          </div>
                        </div>
                        <span className={`font-bold ${plan === promo.name ? 'text-purple-300' : 'text-slate-300'}`}>
                          ₱{Number(promo.price).toLocaleString()}
                        </span>
                      </label>
                    ))}
                  </>
                )}
              </div>

              {/* Coaching add-on */}
              {Number(settings.priceCoaching) > 0 && (
                <div>
                  <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wider pt-1">Add-on</p>
                  <label className={`mt-2 flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                    coachingAddOn
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-slate-600 bg-slate-700/40 hover:border-slate-500'
                  }`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={coachingAddOn}
                        onChange={(e) => setCoachingAddOn(e.target.checked)}
                        className="accent-yellow-500 w-4 h-4 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Dumbbell size={13} className="text-yellow-400" />
                          <span className={`font-medium text-sm ${coachingAddOn ? 'text-yellow-300' : 'text-white'}`}>
                            Personal Coaching
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">Monthly coaching fee</p>
                      </div>
                    </div>
                    <span className={`font-bold text-sm ${coachingAddOn ? 'text-yellow-300' : 'text-slate-300'}`}>
                      +₱{Number(settings.priceCoaching).toLocaleString()}
                    </span>
                  </label>
                </div>
              )}

              {plan === 'student' && (
                <div className="flex items-start gap-2.5 bg-sky-500/10 border border-sky-500/30 rounded-xl px-4 py-3">
                  <span className="text-sky-400 text-base shrink-0">🎓</span>
                  <p className="text-sky-300 text-xs leading-relaxed">
                    Student membership requires a valid school ID. Please present it upon your visit.
                  </p>
                </div>
              )}

              {price === 0 && (
                <p className="text-orange-400 text-xs text-center">Price not set for this plan. Please visit the gym.</p>
              )}

              {/* Total summary */}
              {coachingAddOn && price > 0 && (
                <div className="bg-slate-700/50 rounded-xl px-4 py-3 space-y-1.5">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>{planLabel}</span>
                    <span>₱{price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-yellow-400">
                    <span>Personal Coaching</span>
                    <span>+₱{coachingFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold border-t border-slate-600 pt-1.5">
                    <span>Total</span>
                    <span>₱{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep('pay')}
                disabled={price === 0}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Continue <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 'pay' && (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                <p className="text-slate-400 text-sm">Amount to send</p>
                <p className="text-green-400 font-black text-3xl mt-1">₱{totalAmount.toLocaleString()}</p>
                {coachingAddOn ? (
                  <div className="mt-2 space-y-0.5 text-xs text-slate-500">
                    <p>{planLabel}: ₱{price.toLocaleString()}</p>
                    <p className="text-yellow-400/80">+ Coaching: ₱{coachingFee.toLocaleString()}</p>
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs mt-0.5">{planLabel} renewal</p>
                )}
              </div>

              <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Send to</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-black text-xl tracking-widest">{settings.gcashNumber}</p>
                    <p className="text-slate-400 text-sm mt-0.5">{settings.gcashName}</p>
                  </div>
                  <button
                    onClick={copyNumber}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${
                      copied ? 'bg-green-500 text-white' : 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                    }`}
                  >
                    <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {settings.gcashQrUrl && (
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <img src={settings.gcashQrUrl} alt="GCash QR" className="w-40 h-40 object-contain bg-white rounded-xl p-2" />
                    <a
                      href={settings.gcashQrUrl}
                      download="GCash-QR.png"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-600 hover:bg-slate-500 text-slate-300 hover:text-white transition-colors"
                    >
                      <Upload size={12} className="rotate-180" /> Save QR Code
                    </a>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">GCash Reference / Transaction ID</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. 1234567890"
                  className="w-full bg-slate-700 border border-slate-600 focus:border-green-500 text-white rounded-xl px-4 py-3 outline-none transition-colors placeholder:text-slate-500 font-mono text-sm"
                />
                <p className="text-slate-500 text-xs mt-1">Found in GCash app → Transaction History</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-slate-500 text-xs font-medium">OR</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Payment Proof</label>
                {receiptPreview ? (
                  <div className="relative">
                    <img src={receiptPreview} alt="Receipt" className="w-full max-h-48 object-contain bg-slate-700 rounded-xl" />
                    <button type="button" onClick={removeReceipt}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors">
                      <X size={14} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => cameraInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-600 hover:border-green-500 rounded-xl p-4 cursor-pointer transition-colors group">
                      <Camera size={24} className="text-slate-500 group-hover:text-green-400 transition-colors" />
                      <p className="text-slate-400 text-xs font-medium">Take Photo</p>
                    </button>
                    <button type="button" onClick={() => receiptInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-600 hover:border-green-500 rounded-xl p-4 cursor-pointer transition-colors group">
                      <Upload size={24} className="text-slate-500 group-hover:text-green-400 transition-colors" />
                      <p className="text-slate-400 text-xs font-medium">Upload from Gallery</p>
                    </button>
                  </div>
                )}
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={(e) => handleReceiptFile(e.target.files[0])} />
                <input ref={receiptInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => handleReceiptFile(e.target.files[0])} />
              </div>

              {!canSubmit && (
                <p className="text-orange-400 text-xs text-center">Please enter a reference number or upload a receipt screenshot</p>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep('plan')}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium text-sm transition-colors">
                  Back
                </button>
                <button onClick={handleSubmit} disabled={!canSubmit || submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                  {submitting
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : 'Submit Payment'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 'done' && (
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Payment Submitted!</p>
                <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                  Your payment request has been sent to the admin.<br />
                  Your membership will be renewed once verified.
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-3 text-left space-y-1">
                <p className="text-slate-400 text-xs">Summary</p>
                <p className="text-white text-sm font-medium">{member.name} · {planLabel}</p>
                <p className="text-green-400 font-bold">₱{price.toLocaleString()}</p>
              </div>
              <button onClick={onClose}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentStatus({ request }) {
  const isPending  = request.status === 'pending';
  const isRejected = request.status === 'rejected';

  const cfg = isPending
    ? { bg: 'bg-orange-500/10', border: 'border-orange-500/30', iconBg: 'bg-orange-500/20', icon: <Clock size={20} className="text-orange-400" />, title: 'Payment Under Review', titleColor: 'text-orange-300', dot: 'bg-orange-400 animate-pulse' }
    : { bg: 'bg-red-500/10', border: 'border-red-500/30', iconBg: 'bg-red-500/20', icon: <XCircle size={20} className="text-red-400" />, title: 'Payment Rejected', titleColor: 'text-red-300', dot: 'bg-red-400' };

  return (
    <div className={`rounded-2xl border ${cfg.bg} ${cfg.border} p-4`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${cfg.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
            <p className={`font-bold text-sm ${cfg.titleColor}`}>{cfg.title}</p>
          </div>
          {isPending && <p className="text-slate-400 text-xs mt-0.5">Your GCash payment is being verified by the admin.</p>}
          {isRejected && (
            <p className="text-slate-400 text-xs mt-0.5">
              {request.admin_notes
                ? <>Reason: <span className="text-red-400">{request.admin_notes}</span></>
                : 'Please contact the gym for details.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailCard({ icon, label, value, valueClass = 'text-white' }) {
  return (
    <div className="bg-slate-700/40 rounded-xl p-3">
      <p className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">{icon} {label}</p>
      <p className={`font-semibold text-sm ${valueClass}`}>{value}</p>
    </div>
  );
}

function TagIcon({ size, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CHART_RANGES = [
  { key: 'week',  label: 'Week',  days: 7  },
  { key: 'month', label: 'Month', days: 30 },
  { key: 'year',  label: 'Year',  days: 365 },
];

const FITNESS_LEVELS = [
  {
    key: 'beginner',
    label: 'Beginner',
    icon: '🌱',
    desc: 'New to exercise or returning after a long break. Fewer sets, more rest, simpler movements.',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/40',
  },
  {
    key: 'intermediate',
    label: 'Intermediate',
    icon: '💪',
    desc: 'Training consistently for 3–12 months. Standard sets, normal rest, compound lifts.',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/40',
  },
  {
    key: 'advanced',
    label: 'Advanced',
    icon: '🔥',
    desc: 'Training 1+ year with solid form. Higher volume, shorter rest, heavier weights.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/40',
  },
];

function toYouTubeEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0` : null;
}

function ExerciseModal({ exercise, onClose }) {
  const [imgError, setImgError] = useState(false);
  const embedUrl = toYouTubeEmbed(exercise.video_url);
  const imageUrl = exercise.image_url || (!imgError ? (exercise.animation_url || getExerciseGif(exercise.name)) : null);
  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-white/10"
        style={{ background: '#0f172a' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Media area */}
        <div className="relative bg-slate-900 flex items-center justify-center" style={{ minHeight: 200 }}>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={exercise.name}
              className="w-full"
              style={{ height: 220 }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={exercise.name}
              className="w-full max-h-56 object-contain"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
                <Dumbbell size={28} className="text-green-400" />
              </div>
              <p className="text-slate-500 text-sm">{exercise.description || 'No demo available'}</p>
            </div>
          )}
          <button onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70">
            <X size={16} />
          </button>
        </div>

        {/* Details */}
        <div className="p-4">
          <h3 className="text-white font-bold text-base mb-1">{exercise.name}</h3>
          <p className="text-slate-400 text-xs mb-3">{exercise.muscle}</p>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-slate-800 rounded-xl p-2.5 text-center">
              <p className="text-white font-bold text-base">{exercise.sets}</p>
              <p className="text-slate-500 text-[10px]">Sets</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-2.5 text-center">
              <p className="text-green-400 font-bold text-base">{exercise.reps}</p>
              <p className="text-slate-500 text-[10px]">Reps</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-2.5 text-center">
              <p className="text-sky-400 font-bold text-base">{exercise.rest}</p>
              <p className="text-slate-500 text-[10px]">Rest</p>
            </div>
          </div>

          {exercise.description && (
            <p className="text-slate-400 text-xs leading-relaxed bg-slate-800 rounded-xl p-3">
              {exercise.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkoutSection({ member, selfData, gymId, onSelfDataSaved, forceSetup, onSetupCancel }) {
  const { loadWorkoutPlan, saveWorkoutPlan, logWorkout, getWorkoutLogs } = useGym();

  // Effective metrics: admin-set takes priority, self-reported as fallback
  const effHeight    = member.height    || selfData?.self_height;
  const effWeight    = member.weight    || selfData?.self_weight;
  const effBirthdate = member.birthdate || selfData?.self_birthdate;
  const bmi    = calcBMI(effHeight, effWeight);
  const bmiCat = getBMICategory(bmi);

  const todayDowIndex  = new Date().getDay();
  const todayPlanIndex = todayDowIndex === 0 ? 6 : todayDowIndex - 1;

  const [plan, setPlan]               = useState(null);
  const [dayIdx, setDayIdx]           = useState(todayPlanIndex);
  const [done, setDone]               = useState({});
  const [tab, setTab]                 = useState('workout');
  const [chartRange, setChartRange]   = useState('week');
  const [chartData, setChartData]     = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);

  // Self-setup form state (shown when no BMI data or forceSetup)
  const needsSetup = !effHeight || !effWeight;
  const [showSetup, setShowSetup]     = useState(false);
  const [setupHeight, setSetupHeight] = useState('');
  const [setupWeight, setSetupWeight] = useState('');
  const [setupBirthdate, setSetupBirthdate] = useState('');
  const [setupLevel, setSetupLevel]   = useState('intermediate');
  const [savingSetup, setSavingSetup] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  useEffect(() => { if (forceSetup) setShowSetup(true); }, [forceSetup]);

  // Pre-fill form from existing data
  useEffect(() => {
    setSetupHeight(String(effHeight || ''));
    setSetupWeight(String(effWeight || ''));
    setSetupBirthdate(effBirthdate || '');
    setSetupLevel(selfData?.fitness_level || plan?.fitness_level || 'intermediate');
  }, [selfData, plan, effHeight, effWeight, effBirthdate]); // eslint-disable-line

  useEffect(() => {
    if (!member.id || !gymId) return;
    setLoadingPlan(true);
    loadWorkoutPlan(member.id, null, null).then((p) => {
      setPlan(p);
      setLoadingPlan(false);
    });
  }, [member.id]); // eslint-disable-line

  useEffect(() => {
    if (!member.id || !gymId) return;
    const today = new Date().toISOString().split('T')[0];
    supabase.from('workout_logs').select('exercise_id')
      .eq('gym_id', gymId).eq('member_id', member.id)
      .eq('day_index', todayPlanIndex)
      .gte('logged_at', `${today}T00:00:00`).lte('logged_at', `${today}T23:59:59`)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach((r) => { map[r.exercise_id] = true; });
        setDone(map);
      });
  }, [member.id, gymId]); // eslint-disable-line

  useEffect(() => {
    if (tab !== 'progress' || !member.id) return;
    const range = CHART_RANGES.find((r) => r.key === chartRange);
    getWorkoutLogs(member.id, range.days).then((logs) => {
      if (chartRange !== 'year') {
        const map = {};
        const now = new Date();
        for (let i = range.days - 1; i >= 0; i--) {
          const d = new Date(now); d.setDate(d.getDate() - i);
          const key = d.toISOString().split('T')[0];
          map[key] = { date: chartRange === 'week' ? DAY_NAMES[d.getDay()].slice(0, 3) : `${d.getMonth()+1}/${d.getDate()}`, exercises: 0 };
        }
        logs.forEach((l) => { const k = l.logged_at.split('T')[0]; if (map[k]) map[k].exercises += 1; });
        setChartData(Object.values(map));
      } else {
        const map = {};
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
          map[key] = { date: d.toLocaleString('default', { month: 'short' }), exercises: 0 };
        }
        logs.forEach((l) => { const k = l.logged_at.slice(0, 7); if (map[k]) map[k].exercises += 1; });
        setChartData(Object.values(map));
      }
    });
  }, [open, tab, chartRange, member.id]); // eslint-disable-line

  const handleSaveSetup = async () => {
    if (!setupHeight || !setupWeight) return;
    setSavingSetup(true);
    try {
      const h = Number(setupHeight), w = Number(setupWeight);
      const bmiKey = getBMICategory(calcBMI(h, w))?.key || 'normal';

      // Save self-reported metrics to workout_plans (upsert)
      const selfPayload = {
        gym_id: gymId, member_id: member.id,
        bmi_key: bmiKey, fitness_level: setupLevel,
        self_height: h, self_weight: w,
        self_birthdate: setupBirthdate || null,
        days: [], is_custom: false,
        updated_at: new Date().toISOString(),
      };
      const { error: uErr } = await supabase.from('workout_plans')
        .upsert([selfPayload], { onConflict: 'gym_id,member_id' });
      if (uErr) throw uErr;

      onSelfDataSaved({ self_height: h, self_weight: w, self_birthdate: setupBirthdate || null, fitness_level: setupLevel });

      // Now generate the workout days
      setGeneratingPlan(true);
      const template = getTemplateForBMI(bmiKey, setupLevel);
      if (template) {
        const { data: updated } = await supabase.from('workout_plans')
          .update({ days: template.days, updated_at: new Date().toISOString() })
          .eq('gym_id', gymId).eq('member_id', member.id)
          .select().single();
        setPlan(updated);
      }
      setShowSetup(false);
      if (onSetupCancel) onSetupCancel();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSetup(false);
      setGeneratingPlan(false);
    }
  };

  const handleToggle = async (exercise, currentDayIdx) => {
    if (currentDayIdx !== todayPlanIndex) return;
    const id = exercise.id;
    if (done[id]) return;
    setDone((prev) => ({ ...prev, [id]: true }));
    const currentDay = plan?.days?.[currentDayIdx];
    await logWorkout(member.id, { exerciseId: id, exerciseName: exercise.name, dayIndex: currentDayIdx, dayName: currentDay?.dayName || '', setsCompleted: exercise.sets || 1 });
  };

  const handleChangeLevel = async (newLevel) => {
    const key = bmiCat?.key || 'normal';
    const template = getTemplateForBMI(key, newLevel);
    if (!template) return;
    await saveWorkoutPlan(member.id, key, template.days, newLevel);
    // Also update self-reported level
    await supabase.from('workout_plans').update({ fitness_level: newLevel }).eq('gym_id', gymId).eq('member_id', member.id);
    setPlan((prev) => ({ ...prev, days: template.days, fitness_level: newLevel }));
    onSelfDataSaved({ ...(selfData || {}), fitness_level: newLevel });
  };

  const currentDay   = plan?.days?.[dayIdx];
  const isToday      = dayIdx === todayPlanIndex;
  const completedCount = currentDay?.exercises?.filter((e) => done[e.id]).length || 0;
  const totalCount     = currentDay?.exercises?.length || 0;
  const currentLevel   = FITNESS_LEVELS.find((l) => l.key === (plan?.fitness_level || 'intermediate'));

  // ── Setup form (inline, shown when no metrics or forced edit) ──
  const setupForm = (
    <div className="p-4">
      <div className="text-center mb-4">
        <p className="text-white font-bold">Set Up Your Fitness Profile</p>
        <p className="text-slate-400 text-xs mt-1">We'll build a personalised workout plan for you</p>
      </div>

      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Height (cm) *</label>
            <input type="number" value={setupHeight} onChange={(e) => setSetupHeight(e.target.value)}
              placeholder="e.g. 165" min={100} max={250}
              className="w-full bg-slate-800 border border-slate-700 focus:border-green-500 text-white rounded-xl px-3 py-2.5 text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Weight (kg) *</label>
            <input type="number" value={setupWeight} onChange={(e) => setSetupWeight(e.target.value)}
              placeholder="e.g. 65" min={20} max={300}
              className="w-full bg-slate-800 border border-slate-700 focus:border-green-500 text-white rounded-xl px-3 py-2.5 text-sm outline-none" />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Birthdate <span className="text-slate-600">(optional)</span></label>
          <input type="date" value={setupBirthdate} onChange={(e) => setSetupBirthdate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 focus:border-green-500 text-white rounded-xl px-3 py-2.5 text-sm outline-none" />
        </div>

        {/* BMI preview */}
        {setupHeight && setupWeight && (() => {
          const previewBmi = calcBMI(Number(setupHeight), Number(setupWeight));
          const previewCat = getBMICategory(previewBmi);
          if (!previewBmi || !previewCat) return null;
          return (
            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${previewCat.border} ${previewCat.bg}`}>
              <span className={`text-xs font-bold ${previewCat.color}`}>BMI {previewBmi.toFixed(1)}</span>
              <span className={`text-xs ${previewCat.color}`}>·</span>
              <span className={`text-xs font-semibold ${previewCat.color}`}>{previewCat.label}</span>
            </div>
          );
        })()}
      </div>

      <p className="text-xs text-slate-400 font-semibold mb-2">Fitness Level</p>
      <div className="space-y-2 mb-4">
        {FITNESS_LEVELS.map((lvl) => (
          <button key={lvl.key} onClick={() => setSetupLevel(lvl.key)}
            className={`w-full text-left rounded-xl border p-3 transition-all ${setupLevel === lvl.key ? `${lvl.bg} ${lvl.border}` : 'bg-slate-800 border-slate-700'}`}>
            <div className="flex items-center gap-3">
              <span className="text-lg">{lvl.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${setupLevel === lvl.key ? lvl.color : 'text-white'}`}>{lvl.label}</p>
                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{lvl.desc}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${setupLevel === lvl.key ? `border-current ${lvl.color}` : 'border-slate-600'}`}>
                {setupLevel === lvl.key && <div className="w-2 h-2 rounded-full bg-current" />}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {!needsSetup && (
          <button onClick={() => { setShowSetup(false); if (onSetupCancel) onSetupCancel(); }}
            className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium text-sm transition-colors">
            Cancel
          </button>
        )}
        <button onClick={handleSaveSetup} disabled={!setupHeight || !setupWeight || savingSetup || generatingPlan}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm">
          {(savingSetup || generatingPlan)
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Dumbbell size={14} />}
          {generatingPlan ? 'Generating...' : savingSetup ? 'Saving...' : 'Generate My Plan'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
        {/* Header row */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/8">
          <Dumbbell size={15} className="text-green-400" />
          <span className="text-white font-semibold text-sm flex-1">Workout Plan</span>
          {bmiCat && !needsSetup && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: bmiCat.bg, color: bmiCat.color }}>
              {bmiCat.label}
            </span>
          )}
        </div>

        {showSetup || needsSetup ? (
          <div>{setupForm}</div>
        ) : (
          <div>
            {loadingPlan ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !plan?.days?.length ? (
              setupForm
            ) : (
              <>
                <div className="flex border-b border-white/8">
                  <button onClick={() => setTab('workout')}
                    className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${tab === 'workout' ? 'text-green-400 border-b-2 border-green-500' : 'text-slate-500'}`}>
                    <Dumbbell size={12} /> Workout
                  </button>
                  <button onClick={() => setTab('progress')}
                    className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${tab === 'progress' ? 'text-green-400 border-b-2 border-green-500' : 'text-slate-500'}`}>
                    <TrendingUp size={12} /> Progress
                  </button>
                </div>

                {tab === 'workout' ? (
                  <div className="p-4">
                    {/* Level + edit metrics row */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex gap-1">
                        {FITNESS_LEVELS.map((lvl) => (
                          <button key={lvl.key} onClick={() => handleChangeLevel(lvl.key)} title={lvl.label}
                            className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${lvl.key === (plan?.fitness_level || 'intermediate') ? `${lvl.bg} ${lvl.color} border ${lvl.border}` : 'bg-slate-800 text-slate-500'}`}>
                            {lvl.icon} {lvl.label}
                          </button>
                        ))}
                      </div>
                      {!member.height && (
                        <button onClick={() => setShowSetup(true)} className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1">
                          <span>Edit metrics</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <button onClick={() => setDayIdx((i) => Math.max(0, i - 1))} disabled={dayIdx === 0}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-slate-300">
                        <ChevronLeft size={14} />
                      </button>
                      <div className="text-center">
                        <p className="text-white font-semibold text-sm">{currentDay?.dayName}</p>
                        <p className="text-slate-400 text-xs">{isToday ? '• Today · ' : ''}{currentDay?.isRest ? 'Rest Day' : currentDay?.label}</p>
                      </div>
                      <button onClick={() => setDayIdx((i) => Math.min((plan.days.length - 1), i + 1))} disabled={dayIdx === plan.days.length - 1}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-slate-300">
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    <div className="flex justify-center gap-1.5 mb-4">
                      {plan.days.map((d, i) => (
                        <button key={i} onClick={() => setDayIdx(i)}
                          className={`w-2 h-2 rounded-full transition-all ${i === dayIdx ? 'bg-green-400 scale-125' : i === todayPlanIndex ? 'bg-green-700' : 'bg-slate-600'}`} />
                      ))}
                    </div>

                    {currentDay?.isRest ? (
                      <div className="text-center py-6">
                        <p className="text-3xl mb-2">😴</p>
                        <p className="text-slate-300 font-medium">Rest Day</p>
                        <p className="text-slate-500 text-xs mt-1">Recovery is part of the program</p>
                      </div>
                    ) : (
                      <>
                        {isToday && totalCount > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>Today's progress</span>
                              <span className="text-green-400 font-semibold">{completedCount}/{totalCount} done</span>
                            </div>
                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(completedCount / totalCount) * 100}%` }} />
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          {currentDay?.exercises?.map((exercise) => {
                            const isDone = done[exercise.id];
                            return (
                              <div key={exercise.id} className={`rounded-xl border transition-all ${isDone ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800 border-slate-700'}`}>
                                <div className="flex items-center gap-3 p-3">
                                  <button onClick={() => !isDone && isToday && handleToggle(exercise, dayIdx)}
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isDone ? 'bg-green-500 border-green-500' : isToday ? 'border-slate-500 hover:border-green-500' : 'border-slate-700'}`}>
                                    {isDone && <CheckCircle size={12} className="text-white" />}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${isDone ? 'text-green-300 line-through opacity-70' : 'text-white'}`}>{exercise.name}</p>
                                    <p className="text-slate-500 text-xs mt-0.5">{exercise.sets} sets · {exercise.reps} · {exercise.rest} rest</p>
                                  </div>
                                  <button onClick={() => setSelectedExercise(exercise)}
                                    className="shrink-0 w-8 h-8 rounded-lg bg-slate-700 hover:bg-green-500/20 flex items-center justify-center transition-colors text-base">
                                    ▶
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {!isToday && <p className="text-center text-slate-600 text-xs mt-3">Navigate to today to log exercises</p>}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex gap-1.5 mb-4">
                      {CHART_RANGES.map((r) => (
                        <button key={r.key} onClick={() => setChartRange(r.key)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${chartRange === r.key ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} interval={chartRange === 'year' ? 0 : chartRange === 'month' ? 6 : 0} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#4ade80' }} formatter={(v) => [`${v} exercises`, '']} />
                          <Bar dataKey="exercises" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <BarChart2 size={32} className="text-slate-600 mb-2" />
                        <p className="text-slate-500 text-sm">No workout data yet</p>
                        <p className="text-slate-600 text-xs mt-1">Complete exercises to track your progress</p>
                      </div>
                    )}
                    {chartData.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="bg-slate-800 rounded-xl p-3 text-center">
                          <p className="text-2xl font-black text-green-400">{chartData.reduce((s, d) => s + d.exercises, 0)}</p>
                          <p className="text-slate-500 text-xs mt-0.5">Total exercises</p>
                        </div>
                        <div className="bg-slate-800 rounded-xl p-3 text-center">
                          <p className="text-2xl font-black text-sky-400">
                            {Math.round(chartData.reduce((s, d) => s + d.exercises, 0) / Math.max(1, chartData.filter((d) => d.exercises > 0).length)) || 0}
                          </p>
                          <p className="text-slate-500 text-xs mt-0.5">Avg per active day</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {selectedExercise && (
        <ExerciseModal exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />
      )}
    </>
  );
}

/* ── Advance GCash Payment Modal ──────────────────────────────── */
function AdvanceGCashModal({ member, settings, submitAdvancePayment, onClose }) {
  const [amount, setAmount]           = useState('');
  const [notes, setNotes]             = useState('');
  const [reference, setReference]     = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [copied, setCopied]           = useState(false);
  const [done, setDone]               = useState(false);
  const receiptInputRef = useRef(null);
  const cameraInputRef  = useRef(null);

  const canSubmit = Number(amount) > 0 && (reference.trim() || receiptFile);

  const handleReceiptFile = (file) => {
    if (!file) return;
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(settings.gcashNumber).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await submitAdvancePayment({
        memberId: member.id, memberName: member.name,
        amount: Number(amount), notes: notes.trim(),
        gcashReference: reference.trim(), receiptFile,
      });
      setDone(true);
    } catch (err) {
      alert('Failed to submit: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl w-full max-w-md shadow-2xl border border-white/10 flex flex-col max-h-[85vh]" style={{ background: '#0f172a' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-violet-400" />
            <h3 className="text-white font-semibold">Pay Advance via GCash</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">
          {!done ? (
            <>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Amount (₱)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 400" min="1"
                  className="w-full bg-slate-700 border border-slate-600 focus:border-violet-500 text-white rounded-xl px-4 py-3 outline-none placeholder:text-slate-500 text-sm" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Notes <span className="text-slate-500 font-normal">(optional)</span></label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Half payment, will follow up remaining"
                  className="w-full bg-slate-700 border border-slate-600 focus:border-violet-500 text-white rounded-xl px-4 py-3 outline-none placeholder:text-slate-500 text-sm" />
              </div>
              <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Send to</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-black text-xl tracking-widest">{settings.gcashNumber}</p>
                    <p className="text-slate-400 text-sm mt-0.5">{settings.gcashName}</p>
                  </div>
                  <button onClick={copyNumber} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-slate-600 hover:bg-slate-500 text-slate-300'}`}>
                    <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {settings.gcashQrUrl && <img src={settings.gcashQrUrl} alt="GCash QR" className="w-36 h-36 object-contain bg-white rounded-xl p-2 mx-auto" />}
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">GCash Reference / Transaction ID</label>
                <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. 1234567890" className="w-full bg-slate-700 border border-slate-600 focus:border-violet-500 text-white rounded-xl px-4 py-3 outline-none placeholder:text-slate-500 font-mono text-sm" />
              </div>
              <div className="flex items-center gap-3"><div className="flex-1 h-px bg-slate-700" /><span className="text-slate-500 text-xs">OR</span><div className="flex-1 h-px bg-slate-700" /></div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Payment Screenshot</label>
                {receiptPreview ? (
                  <div className="relative">
                    <img src={receiptPreview} alt="Receipt" className="w-full max-h-48 object-contain bg-slate-700 rounded-xl" />
                    <button onClick={() => { setReceiptFile(null); setReceiptPreview(null); }} className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center"><X size={14} className="text-white" /></button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-600 hover:border-violet-500 rounded-xl p-4 cursor-pointer transition-colors group">
                      <Camera size={22} className="text-slate-500 group-hover:text-violet-400" /><p className="text-slate-400 text-xs">Take Photo</p>
                    </button>
                    <button onClick={() => receiptInputRef.current?.click()} className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-600 hover:border-violet-500 rounded-xl p-4 cursor-pointer transition-colors group">
                      <Upload size={22} className="text-slate-500 group-hover:text-violet-400" /><p className="text-slate-400 text-xs">Upload</p>
                    </button>
                  </div>
                )}
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleReceiptFile(e.target.files[0])} />
                <input ref={receiptInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleReceiptFile(e.target.files[0])} />
              </div>
              <button onClick={handleSubmit} disabled={!canSubmit || submitting} className="w-full flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm">
                {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit Payment'}
              </button>
            </>
          ) : (
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 bg-violet-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-violet-400" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Advance Payment Submitted!</p>
                <p className="text-slate-400 text-sm mt-1 leading-relaxed">Once approved, it will be held and applied when your membership expires.</p>
              </div>
              <button onClick={onClose} className="w-full bg-violet-500 hover:bg-violet-600 text-white font-bold py-3 rounded-xl">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
