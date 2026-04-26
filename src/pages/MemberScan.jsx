import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, AlertTriangle, XCircle, Dumbbell, Clock, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGym } from '../context/GymContext';
import { formatDate } from '../utils/helpers';

export default function MemberScan() {
  const { slug, token } = useParams();
  const { gymId, getMemberStatus, settings } = useGym();

  const [state, setState]   = useState('loading'); // loading | checkedin | duplicate | expired | notfound | error
  const [member, setMember] = useState(null);
  const [checkInTime, setCheckInTime] = useState(null);

  useEffect(() => {
    if (!gymId || !token) return;
    doScan();
  }, [gymId, token]);

  const doScan = async () => {
    try {
      // Look up member by qr_token
      const { data: memberRow, error } = await supabase
        .from('members')
        .select('*')
        .eq('gym_id', gymId)
        .eq('qr_token', token)
        .maybeSingle();

      if (error) throw error;
      if (!memberRow) { setState('notfound'); return; }

      const m = {
        id: memberRow.id,
        name: memberRow.name,
        contactNumber: memberRow.contact_number,
        photo: memberRow.photo_url || null,
        membershipType: memberRow.membership_type,
        membershipStartDate: memberRow.membership_start_date,
        membershipEndDate: memberRow.membership_end_date,
      };
      setMember(m);
      // Pre-load session so /member route goes straight to their profile
      sessionStorage.setItem('memberPortal_id', m.id);

      // Check existing attendance today
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('attendance')
        .select('id, checked_in_at')
        .eq('gym_id', gymId)
        .eq('member_id', m.id)
        .gte('checked_in_at', `${today}T00:00:00`)
        .lte('checked_in_at', `${today}T23:59:59`)
        .maybeSingle();

      if (existing) {
        setCheckInTime(existing.checked_in_at);
        setState('duplicate');
        return;
      }

      // Clock in
      const now = new Date().toISOString();
      const { error: insertError } = await supabase.from('attendance').insert([{
        gym_id:      gymId,
        member_id:   m.id,
        member_name: m.name,
        checked_in_at: now,
      }]);

      if (insertError) throw insertError;

      setCheckInTime(now);
      setState('checkedin');
    } catch (err) {
      console.error(err);
      setState('error');
    }
  };

  const fmtTime = (str) =>
    str ? new Date(str).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';

  const statusInfo = member ? getMemberStatus(member) : null;
  const membershipExpired = statusInfo?.status === 'expired';

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5" style={{ background: 'rgba(0,0,0,0.7)' }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link to={`/${slug}`} className="text-slate-400 hover:text-white p-1 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)' }}>
            <Dumbbell size={16} className="text-white" />
          </div>
          <span className="font-bold text-white">{settings.gymName || 'Gym'}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm space-y-6">

          {/* Loading */}
          {state === 'loading' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-400">Checking in...</p>
            </div>
          )}

          {/* Checked in */}
          {state === 'checkedin' && member && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ boxShadow: '0 0 40px rgba(34,197,94,0.2)' }}>
                  <CheckCircle size={40} className="text-green-400" />
                </div>
                <h1 className="text-2xl font-black text-white">Checked In!</h1>
                <p className="text-green-400 font-medium mt-1 flex items-center justify-center gap-1.5">
                  <Clock size={14} /> {fmtTime(checkInTime)}
                </p>
              </div>
              <MemberCard member={member} statusInfo={statusInfo} />
            </div>
          )}

          {/* Already checked in today */}
          {state === 'duplicate' && member && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-20 h-20 bg-orange-500/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={40} className="text-orange-400" />
                </div>
                <h1 className="text-2xl font-black text-white">Already Checked In</h1>
                <p className="text-slate-400 mt-1 flex items-center justify-center gap-1.5">
                  <Clock size={14} /> First check-in at {fmtTime(checkInTime)}
                </p>
              </div>
              <MemberCard member={member} statusInfo={statusInfo} />
            </div>
          )}

          {/* Not found */}
          {state === 'notfound' && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto">
                <XCircle size={40} className="text-red-400" />
              </div>
              <h1 className="text-2xl font-black text-white">QR Not Found</h1>
              <p className="text-slate-400 text-sm">This QR code is not linked to any member.</p>
            </div>
          )}

          {/* Error */}
          {state === 'error' && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto">
                <XCircle size={40} className="text-red-400" />
              </div>
              <h1 className="text-2xl font-black text-white">Something Went Wrong</h1>
              <p className="text-slate-400 text-sm">Please try again or contact the gym staff.</p>
              <button onClick={doScan} className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors">
                Retry
              </button>
            </div>
          )}

          {/* View membership */}
          {(state === 'checkedin' || state === 'duplicate') && (
            <Link
              to={`/${slug}/member`}
              className="block w-full text-center border border-white/10 text-slate-400 hover:text-slate-200 font-medium py-3 rounded-2xl transition-all hover:border-white/20"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              View My Membership
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function MemberCard({ member, statusInfo }) {
  if (!member || !statusInfo) return null;
  const { status, daysLeft } = statusInfo;

  const theme = {
    active:   { badge: 'bg-green-500/15 text-green-400 border-green-500/30',   label: 'Active'        },
    expiring: { badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30', label: 'Expiring Soon' },
    expired:  { badge: 'bg-red-500/15 text-red-400 border-red-500/30',          label: 'Expired'       },
  }[status];

  return (
    <div className="rounded-2xl border border-white/8 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-700 shrink-0">
          {member.photo ? (
            <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-green-400 font-black text-2xl">
              {member.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold truncate">{member.name}</p>
          <p className="text-slate-400 text-xs mt-0.5 capitalize">{member.membershipType} membership</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${theme.badge}`}>
              {theme.label}
            </span>
            <span className="text-xs text-slate-500">
              {status === 'expired' ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-xs text-slate-500">
        <span>Until {formatDate(member.membershipEndDate)}</span>
        {status === 'expired' && <span className="text-red-400/80">Membership expired</span>}
      </div>
    </div>
  );
}
