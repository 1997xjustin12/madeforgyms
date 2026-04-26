import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Dumbbell, ArrowLeft, User, Phone, Calendar,
  CheckCircle, AlertTriangle, XCircle, Clock, MapPin,
  CreditCard, Copy, ChevronRight, X, Upload, ImageIcon, Camera,
  FileText, UtensilsCrossed, ChevronDown, UserCheck,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useGym } from '../context/GymContext';
import { supabase } from '../lib/supabase';
import { formatDate, formatPhoneDisplay } from '../utils/helpers';

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
  const { members, getMemberStatus, MEMBERSHIP_OPTIONS, settings, submitRenewalRequest, renewalRequests, gymSlug, gymId } = useGym();

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
      <div className="min-h-screen bg-[#030712] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
            <Link to={`/${gymSlug}`} className="text-slate-400 hover:text-white p-1 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)' }}>
                <Dumbbell size={16} className="text-white" />
              </div>
              <span className="font-bold text-white">Member Portal</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <Phone size={26} className="text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Enter Your Number</h2>
              <p className="text-slate-400 text-sm">Enter the phone number registered to your gym account</p>
            </div>

            <form onSubmit={handleLookup} className="space-y-3">
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setNotFound(false); }}
                placeholder="e.g. 09123456789"
                className="w-full text-white rounded-2xl px-5 py-4 outline-none transition-colors placeholder:text-slate-600 text-xl text-center font-mono tracking-widest border"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(74,222,128,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />

              {notFound && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <XCircle size={16} className="text-red-400 shrink-0" />
                  <p className="text-red-300 text-sm">No member found with that number. Please try again.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!phone.trim()}
                className="w-full disabled:opacity-40 text-white font-bold py-4 rounded-2xl text-base transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)', boxShadow: '0 0 20px rgba(34,197,94,0.25)' }}
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

    // Progress bar: how far through the membership period
    const startMs  = new Date(member.membershipStartDate).setHours(0,0,0,0);
    const endMs    = new Date(member.membershipEndDate).setHours(0,0,0,0);
    const todayMs  = new Date().setHours(0,0,0,0);
    const totalD   = Math.max(1, Math.round((endMs - startMs) / 86400000));
    const elapsed  = Math.round((todayMs - startMs) / 86400000);
    const progress = Math.min(100, Math.max(0, (elapsed / totalD) * 100));

    // Status theme
    const theme = {
      active:   { gradient: 'from-green-500/25',  bar: 'bg-green-500',  badge: 'bg-green-500/15 text-green-400 border-green-500/30',  icon: <CheckCircle  size={13} />, label: 'Active'        },
      expiring: { gradient: 'from-orange-500/25', bar: 'bg-orange-400', badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: <AlertTriangle size={13} />, label: 'Expiring Soon' },
      expired:  { gradient: 'from-red-500/25',    bar: 'bg-red-500',    badge: 'bg-red-500/15 text-red-400 border-red-500/30',          icon: <XCircle      size={13} />, label: 'Expired'       },
    }[status];

    // Coaching subscription check
    const today = new Date(); today.setHours(0,0,0,0);
    const coachEnd = member.coachingEndDate ? (() => { const d = new Date(member.coachingEndDate); d.setHours(0,0,0,0); return d; })() : null;
    const coachDays    = coachEnd ? Math.ceil((coachEnd - today) / 86400000) : null;
    const coachActive  = coachDays !== null && coachDays >= 0;
    const coachIsToday = coachDays === 0;
    const coachWarn    = coachDays !== null && coachDays > 0 && coachDays <= 5;

    // Past coaching: any record whose end_date is today or earlier
    // (includes records closed today when coach was changed)
    const pastCoaching = coachingHistory.filter((s) => {
      if (!s.end_date) return false;
      const e = new Date(s.end_date); e.setHours(0,0,0,0);
      // Exclude the current active subscription (same instructor + start date)
      if (
        s.instructor_id === member.instructorId &&
        s.start_date === member.coachingStartDate &&
        e >= today
      ) return false;
      return e <= today;
    });

    return (
      <div className="min-h-screen bg-[#030712] flex flex-col">
        {/* Sticky header */}
        <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
            <button onClick={goHome} className="text-slate-400 hover:text-white p-1 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
              <Dumbbell size={16} className="text-white" />
            </div>
            <span className="font-bold text-white flex-1 truncate">{member.name}</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${theme.badge}`}>
              {theme.icon} {theme.label}
            </span>
          </div>
        </div>

        <div className="max-w-lg mx-auto w-full px-4 py-5 space-y-3 pb-8">

          {/* ── Hero card ── */}
          <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {/* Gradient banner */}
            <div className={`h-16 bg-gradient-to-b ${theme.gradient} to-transparent`} />
            {/* Avatar + info + QR row */}
            <div className="flex items-start gap-3 px-4 -mt-8 pb-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-700 border-4 border-slate-800 shrink-0 shadow-xl">
                {member.photo ? (
                  <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-green-400 font-black text-2xl">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {/* Name + details */}
              <div className="pt-9 flex-1 min-w-0">
                <h2 className="text-white font-bold text-lg leading-tight truncate">{member.name}</h2>
                <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                  <Phone size={11} />
                  {formatPhoneDisplay(member.contactNumber)}
                </p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${theme.badge}`}>
                    {theme.icon} {theme.label}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/70 text-slate-300 font-medium">
                    {getMembershipLabel(member.membershipType)}
                  </span>
                </div>
              </div>
              {/* QR Code — always visible if token exists */}
              {member.qrToken && (
                <div className="pt-1 shrink-0 flex flex-col items-center gap-1">
                  <div className="bg-white p-1.5 rounded-xl shadow-lg">
                    <QRCodeSVG
                      value={`${window.location.origin}/${gymSlug}/m/${member.qrToken}`}
                      size={80}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-slate-600 text-[10px] font-medium">Scan to clock in</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Clock In ── */}
          {checkInRecord ? (
            <div className="rounded-2xl border border-green-500/25 p-4 flex items-center gap-3" style={{ background: 'rgba(34,197,94,0.06)' }}>
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle size={20} className="text-green-400" />
              </div>
              <div>
                <p className="text-green-400 font-semibold text-sm">Checked in today</p>
                <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                  <Clock size={11} />
                  {new Date(checkInRecord.checked_in_at).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={handleClockIn}
              disabled={clockingIn || status === 'expired'}
              className="w-full flex items-center justify-center gap-2 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50"
              style={{ background: status === 'expired' ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg, #0ea5e9, #38bdf8)', boxShadow: status !== 'expired' ? '0 0 20px rgba(14,165,233,0.25)' : 'none' }}
            >
              {clockingIn
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <UserCheck size={20} />}
              {status === 'expired' ? 'Membership Expired — Cannot Clock In' : 'Clock In'}
            </button>
          )}

          {/* ── Membership timeline card ── */}
          <div className="rounded-2xl border border-white/8 p-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-3">Membership</p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`text-4xl font-black tabular-nums leading-none ${
                status === 'expired' ? 'text-red-400' : status === 'expiring' ? 'text-orange-400' : 'text-white'
              }`}>
                {Math.abs(daysLeft)}
              </span>
              <span className="text-slate-400 text-sm">
                {status === 'expired' ? 'days overdue' : 'days remaining'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2 mt-3">
              <span>{formatDate(member.membershipStartDate)}</span>
              <span className={status !== 'active' ? 'text-red-400/80' : ''}>{formatDate(member.membershipEndDate)}</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${theme.bar}`} style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* ── Payment status & renew ── */}
          {showPaymentStatus && <PaymentStatus request={latestRequest} />}
          {needsRenewal && settings.gcashNumber && latestRequest?.status !== 'pending' && (
            <button
              onClick={() => setRenewTarget(member)}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-green-500/20"
            >
              <CreditCard size={18} />
              {latestRequest?.status === 'rejected' ? 'Resubmit Payment' : 'Renew via GCash'}
            </button>
          )}

          {/* ── Coaching card (unified: status + coach profile + program tabs) ── */}
          {coachInfo && (() => {
            const coachExpired = coachDays !== null && coachDays < 0;
            const borderColor  = coachExpired ? 'border-white/5' : 'border-yellow-500/20';
            const labelColor   = coachExpired ? 'text-slate-500/80'   : 'text-yellow-500/80';
            const nameColor    = coachExpired ? 'text-slate-400'      : 'text-white';
            return (
              <div className={`rounded-2xl border overflow-hidden ${borderColor}`} style={{ background: 'rgba(255,255,255,0.03)' }}>
                {/* Coach profile row */}
                <div className="flex items-center gap-3 p-4">
                  <div className={`w-12 h-12 rounded-xl overflow-hidden bg-slate-700 shrink-0 ${coachExpired ? 'opacity-50' : ''}`}>
                    {coachInfo.photo_url ? (
                      <img src={coachInfo.photo_url} alt={coachInfo.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center font-bold text-lg ${coachExpired ? 'text-slate-500' : 'text-yellow-400'}`}>
                        {coachInfo.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] uppercase tracking-widest font-bold mb-0.5 ${labelColor}`}>
                      {coachExpired ? 'Previous Coach' : 'Your Coach'}
                    </p>
                    <p className={`font-bold leading-tight truncate ${nameColor}`}>{coachInfo.name}</p>
                    {coachInfo.specialty && <p className="text-slate-500 text-xs mt-0.5 truncate">{coachInfo.specialty}</p>}
                  </div>
                  {/* Coaching status pill */}
                  {coachExpired ? (
                    <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-500">
                      Ended
                    </span>
                  ) : coachActive ? (
                    <div className={`shrink-0 text-right ${coachIsToday ? 'text-yellow-400' : coachWarn ? 'text-orange-400' : 'text-yellow-400'}`}>
                      <p className="text-xs font-bold whitespace-nowrap">
                        {coachDays === 0 ? 'Expires today' : `${coachDays}d left`}
                      </p>
                      {member.coachingPlan && <p className="text-[10px] opacity-60 mt-0.5 truncate max-w-[80px]">{member.coachingPlan}</p>}
                    </div>
                  ) : null}
                </div>

                {/* Program quick-access tabs */}
                <div className={`border-t border-white/8 px-4 py-3 grid grid-cols-3 gap-2 ${coachExpired ? 'opacity-60' : ''}`}>
                  {COACH_TABS.map(({ key, label, Icon, color, bg, border }) => {
                    const count = coachEntries.filter((e) => e.type === key).length;
                    return (
                      <button
                        key={key}
                        onClick={() => { setCoachTab(key); setExpandedEntryId(null); setView('coach'); }}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all active:scale-95 ${
                          count > 0
                            ? `${bg} ${color} ${border}`
                            : 'bg-white/5 text-slate-600 border-white/8'
                        }`}
                      >
                        <Icon size={16} />
                        <span className="text-[10px] font-semibold leading-none">{label.split(' ')[0]}</span>
                        <span className={`text-[10px] leading-none ${count > 0 ? 'opacity-70' : 'opacity-40'}`}>
                          {count > 0 ? `${count} item${count !== 1 ? 's' : ''}` : 'empty'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ── Coaching history (collapsible) ── */}
          {pastCoaching.length > 0 && (
            <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <button
                onClick={() => setHistoryOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left"
              >
                <div className="flex items-center gap-2">
                  <Dumbbell size={13} className="text-slate-500" />
                  <span className="text-slate-400 text-sm font-semibold">Coaching History</span>
                  <span className="text-[11px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-medium">{pastCoaching.length}</span>
                </div>
                <ChevronDown size={15} className={`text-slate-500 transition-transform duration-200 ${historyOpen ? 'rotate-180' : ''}`} />
              </button>

              {historyOpen && (
                <div className="border-t border-white/8 divide-y divide-white/5">
                  {pastCoaching.map((sub) => (
                    <div key={sub.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
                        <Dumbbell size={13} className="text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 text-sm font-semibold truncate">{sub.instructor_name || 'Coach'}</p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {sub.coaching_plan && <span className="mr-1.5">{sub.coaching_plan} ·</span>}
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

          {/* ── Back button ── */}
          <button
            onClick={goHome}
            className="w-full border border-white/10 text-slate-400 hover:text-slate-200 font-medium py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 mt-2 hover:border-white/20"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <ArrowLeft size={15} /> Back to Home
          </button>
        </div>

        {/* GCash Renewal Modal */}
        {renewTarget && (
          <RenewalModal
            member={renewTarget}
            settings={settings}
            MEMBERSHIP_OPTIONS={MEMBERSHIP_OPTIONS}
            submitRenewalRequest={submitRenewalRequest}
            onClose={() => setRenewTarget(null)}
          />
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
                {MEMBERSHIP_OPTIONS.map((opt) => {
                  const optPrice = settings[PLAN_PRICE_KEY[opt.value]] || 0;
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
                        {optPrice > 0 ? `₱${optPrice.toLocaleString()}` : '—'}
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
