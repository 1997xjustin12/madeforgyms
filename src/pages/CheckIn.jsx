import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft, CheckCircle, Clock, XCircle, Dumbbell, AlertTriangle } from 'lucide-react';
import { useGym } from '../context/GymContext';
import { supabase } from '../lib/supabase';
import { formatPhoneDisplay } from '../utils/helpers';

function fmtTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function CheckIn() {
  const { findMembers, getMemberStatus } = useGym();
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState(null);
  const [searched, setSearched] = useState(false);
  const [checking, setChecking] = useState(null); // member id being processed
  const [checkedIn, setCheckedIn] = useState({}); // { memberId: checkedInAt }

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const found = findMembers(query);
    setResults(found);
    setSearched(true);
  };

  // Pre-check today's attendance for all results so already-checked-in members
  // never show the Check In button
  useEffect(() => {
    if (!results || results.length === 0) return;
    const today = new Date().toISOString().split('T')[0];
    const ids = results.map((m) => m.id);
    supabase
      .from('attendance')
      .select('member_id, checked_in_at')
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
  }, [results]);

  const handleCheckIn = async (member) => {
    setChecking(member.id);
    try {
      // Check if already checked in today
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('attendance')
        .select('id, checked_in_at')
        .eq('member_id', member.id)
        .gte('checked_in_at', `${today}T00:00:00`)
        .lte('checked_in_at', `${today}T23:59:59`)
        .maybeSingle();

      if (existing) {
        setCheckedIn((prev) => ({ ...prev, [member.id]: { time: existing.checked_in_at, duplicate: true } }));
        return;
      }

      const { data, error } = await supabase.from('attendance').insert([{
        member_id:   member.id,
        member_name: member.name,
      }]).select().single();
      if (error) throw error;

      setCheckedIn((prev) => ({ ...prev, [member.id]: { time: data.checked_in_at, duplicate: false } }));
    } catch (err) {
      alert('Check-in failed: ' + err.message);
    } finally {
      setChecking(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col">
      {/* Background grid */}
      <div className="fixed inset-0 -z-10 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5" style={{ background: 'rgba(0,0,0,0.7)' }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="text-slate-400 hover:text-white p-1">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)' }}>
              <Dumbbell size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">Gym Check-In</span>
          </div>
          <span className="ml-auto text-slate-500 text-xs">
            {new Date().toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto w-full px-4 py-8 space-y-6">
        {/* Hero */}
        {!searched && (
          <div className="text-center pt-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome!</h1>
            <p className="text-slate-400 text-sm">Search your name or contact number to check in</p>
          </div>
        )}

        {/* Search */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name or phone number..."
              className="w-full text-white rounded-2xl pl-12 pr-4 py-4 outline-none transition-colors placeholder:text-slate-600 text-base border"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(74,222,128,0.5)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
          <button
            type="submit"
            className="w-full text-white font-bold py-4 rounded-2xl transition-all text-base hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)', boxShadow: '0 0 20px rgba(34,197,94,0.25)' }}
          >
            Search
          </button>
        </form>

        {/* Results */}
        {searched && results !== null && (
          <div className="space-y-3">
            {results.length === 0 ? (
              <div className="text-center py-10">
                <Search size={28} className="mx-auto text-slate-600 mb-3" />
                <p className="text-white font-semibold">No member found</p>
                <p className="text-slate-400 text-sm mt-1">Try a different name or phone number</p>
              </div>
            ) : (
              results.map((member) => {
                const { status } = getMemberStatus(member);
                const record = checkedIn[member.id];
                const isExpired = status === 'expired';

                return (
                  <div
                    key={member.id}
                    className={`rounded-2xl border p-4 space-y-3`}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderColor: record && !record.duplicate ? 'rgba(74,222,128,0.4)' : isExpired ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    {/* Member info */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-700 shrink-0">
                        {member.photo ? (
                          <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center font-bold text-lg ${
                            isExpired ? 'text-red-400' : 'text-orange-400'
                          }`}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold">{member.name}</p>
                        <p className="text-slate-400 text-xs">{formatPhoneDisplay(member.contactNumber)}</p>
                      </div>
                      {/* Status pill */}
                      <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        isExpired ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                        status === 'expiring' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' :
                        'bg-green-500/10 text-green-400 border border-green-500/30'
                      }`}>
                        {isExpired ? 'Expired' : 'Active'}
                      </span>
                    </div>

                    {/* Expired warning */}
                    {isExpired && !record && (
                      <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                        <AlertTriangle size={14} className="text-red-400 shrink-0" />
                        <p className="text-red-300 text-xs">Membership expired. Please renew before checking in.</p>
                      </div>
                    )}

                    {/* Check-in result */}
                    {record && !record.duplicate && (
                      <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2">
                        <CheckCircle size={16} className="text-green-400 shrink-0" />
                        <p className="text-green-300 text-sm font-semibold">
                          Checked in at {fmtTime(record.time)}
                        </p>
                      </div>
                    )}
                    {record?.duplicate && (
                      <div className="flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 rounded-xl px-3 py-2">
                        <Clock size={16} className="text-sky-400 shrink-0" />
                        <p className="text-sky-300 text-sm">
                          Already checked in today at {fmtTime(record.time)}
                        </p>
                      </div>
                    )}

                    {/* Check-in button */}
                    {!record && (
                      <button
                        onClick={() => handleCheckIn(member)}
                        disabled={!!checking || isExpired}
                        className="w-full flex items-center justify-center gap-2 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5"
                        style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)', boxShadow: '0 0 16px rgba(34,197,94,0.2)' }}
                      >
                        {checking === member.id
                          ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <><CheckCircle size={16} /> Check In</>
                        }
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
