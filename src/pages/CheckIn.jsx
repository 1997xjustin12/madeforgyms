import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft, CheckCircle, Clock, Dumbbell, AlertTriangle, X, UserX } from 'lucide-react';
import { useGym } from '../context/GymContext';
import { supabase } from '../lib/supabase';
import { formatPhoneDisplay } from '../utils/helpers';

function fmtTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function fmtDate() {
  return new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function CheckIn() {
  const { findMembers, getMemberStatus, gymSlug, gymId, settings } = useGym();
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState(null);
  const [checking, setChecking]   = useState(null);
  const [checkedIn, setCheckedIn] = useState({});
  const [flash, setFlash]         = useState(null); // memberId that just checked in
  const inputRef = useRef(null);

  /* Live search as user types */
  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults(null); return; }
    setResults(findMembers(q));
  }, [query, findMembers]);

  /* Pre-check today's attendance when results change */
  useEffect(() => {
    if (!results || results.length === 0) return;
    const today = new Date().toISOString().split('T')[0];
    const ids = results.map((m) => m.id);
    supabase
      .from('attendance')
      .select('member_id, checked_in_at')
      .eq('gym_id', gymId)
      .in('member_id', ids)
      .gte('checked_in_at', `${today}T00:00:00`)
      .lte('checked_in_at', `${today}T23:59:59`)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        setCheckedIn((prev) => {
          const updated = { ...prev };
          data.forEach((rec) => {
            if (!updated[rec.member_id]) {
              updated[rec.member_id] = { time: rec.checked_in_at, duplicate: true };
            }
          });
          return updated;
        });
      });
  }, [results, gymId]);

  const handleCheckIn = async (member) => {
    setChecking(member.id);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('attendance')
        .select('id, checked_in_at')
        .eq('gym_id', gymId)
        .eq('member_id', member.id)
        .gte('checked_in_at', `${today}T00:00:00`)
        .lte('checked_in_at', `${today}T23:59:59`)
        .maybeSingle();

      if (existing) {
        setCheckedIn((prev) => ({ ...prev, [member.id]: { time: existing.checked_in_at, duplicate: true } }));
        return;
      }

      const { data, error } = await supabase.from('attendance').insert([{
        gym_id:      gymId,
        member_id:   member.id,
        member_name: member.name,
      }]).select().single();
      if (error) throw error;

      setCheckedIn((prev) => ({ ...prev, [member.id]: { time: data.checked_in_at, duplicate: false } }));
      setFlash(member.id);
      setTimeout(() => setFlash(null), 2000);
    } catch (err) {
      alert('Check-in failed: ' + err.message);
    } finally {
      setChecking(null);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    inputRef.current?.focus();
  };

  const gymName = settings.gymName || 'Gym Check-In';
  const gymLogo = settings.gymLogoUrl || null;

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex flex-col">

      {/* Subtle grid background */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-40"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Top glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] -z-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(34,197,94,0.06) 0%, transparent 70%)' }} />

      {/* ── Header ───────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/5" style={{ background: 'rgba(10,15,26,0.92)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center gap-3">
          <Link to={`/${gymSlug}`} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors shrink-0">
            <ArrowLeft size={20} />
          </Link>

          {/* Gym logo / icon */}
          {gymLogo ? (
            <img src={gymLogo} alt={gymName} className="w-9 h-9 rounded-xl object-contain shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)', padding: '4px' }} />
          ) : (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)' }}>
              <Dumbbell size={18} className="text-white" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">{gymName}</p>
            <p className="text-slate-500 text-xs leading-tight">Check-In</p>
          </div>

          <span className="text-slate-600 text-xs shrink-0">{fmtDate()}</span>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 pb-10 flex flex-col gap-6">

        {/* ── Search input ─────────────────────────────── */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <Search size={18} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or phone number…"
            className="w-full text-white rounded-2xl pl-12 pr-12 py-4 outline-none text-base border transition-all placeholder:text-slate-600"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderColor: query ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)',
              boxShadow: query ? '0 0 0 3px rgba(34,197,94,0.06)' : 'none',
            }}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Idle state ───────────────────────────────── */}
        {!query && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-16">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <CheckCircle size={38} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl mb-1">Ready to check in</h2>
              <p className="text-slate-500 text-sm">Type your name or phone number above</p>
            </div>
          </div>
        )}

        {/* ── No results ───────────────────────────────── */}
        {query && results !== null && results.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center gap-3 py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <UserX size={28} className="text-slate-500" />
            </div>
            <div>
              <p className="text-white font-semibold">No member found</p>
              <p className="text-slate-500 text-sm mt-1">Try a different name or number</p>
            </div>
          </div>
        )}

        {/* ── Results ──────────────────────────────────── */}
        {results && results.length > 0 && (
          <div className="space-y-3">
            {results.map((member) => {
              const { status } = getMemberStatus(member);
              const record     = checkedIn[member.id];
              const isExpired  = status === 'expired';
              const justDone   = flash === member.id;
              const isChecking = checking === member.id;

              return (
                <div
                  key={member.id}
                  className="rounded-3xl border overflow-hidden transition-all"
                  style={{
                    background: justDone
                      ? 'rgba(34,197,94,0.07)'
                      : 'rgba(255,255,255,0.03)',
                    borderColor: record && !record.duplicate
                      ? 'rgba(34,197,94,0.35)'
                      : isExpired
                      ? 'rgba(248,113,113,0.25)'
                      : 'rgba(255,255,255,0.07)',
                  }}
                >
                  {/* Member row */}
                  <div className="flex items-center gap-4 p-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0"
                      style={{ background: 'rgba(255,255,255,0.06)' }}>
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center font-black text-2xl ${
                          isExpired ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-base truncate">{member.name}</p>
                      <p className="text-slate-500 text-sm mt-0.5">{formatPhoneDisplay(member.contactNumber)}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isExpired
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : status === 'expiring'
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            : 'bg-green-500/10 text-green-400 border border-green-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isExpired ? 'bg-red-400' : status === 'expiring' ? 'bg-orange-400' : 'bg-green-400'
                          }`} />
                          {isExpired ? 'Expired' : status === 'expiring' ? 'Expiring soon' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Status banners ── */}

                  {/* Expired warning */}
                  {isExpired && !record && (
                    <div className="mx-4 mb-4 flex items-center gap-2.5 rounded-2xl px-4 py-3"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <AlertTriangle size={15} className="text-red-400 shrink-0" />
                      <p className="text-red-300 text-sm">Membership expired — please renew before checking in.</p>
                    </div>
                  )}

                  {/* Already checked in */}
                  {record?.duplicate && (
                    <div className="mx-4 mb-4 flex items-center gap-2.5 rounded-2xl px-4 py-3"
                      style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)' }}>
                      <Clock size={15} className="text-sky-400 shrink-0" />
                      <p className="text-sky-300 text-sm">Already checked in today at <span className="font-semibold">{fmtTime(record.time)}</span></p>
                    </div>
                  )}

                  {/* Just checked in — success */}
                  {record && !record.duplicate && (
                    <div className="mx-4 mb-4 flex items-center gap-2.5 rounded-2xl px-4 py-3"
                      style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
                      <CheckCircle size={15} className="text-green-400 shrink-0" />
                      <p className="text-green-300 text-sm font-semibold">
                        Checked in at {fmtTime(record.time)} — Welcome!
                      </p>
                    </div>
                  )}

                  {/* ── Check-in button ── */}
                  {!record && (
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => handleCheckIn(member)}
                        disabled={!!checking || isExpired}
                        className="w-full flex items-center justify-center gap-2.5 font-bold py-3.5 rounded-2xl transition-all text-white disabled:opacity-40 hover:-translate-y-0.5 active:translate-y-0"
                        style={{
                          background: isExpired
                            ? 'rgba(255,255,255,0.06)'
                            : 'linear-gradient(135deg, #16a34a, #4ade80)',
                          boxShadow: isExpired ? 'none' : '0 4px 24px rgba(34,197,94,0.25)',
                          color: isExpired ? '#64748b' : '#fff',
                        }}
                      >
                        {isChecking ? (
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle size={18} />
                            Check In
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
