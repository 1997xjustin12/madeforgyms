import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  UserPlus, RefreshCw, CheckCircle, XCircle, Pencil, Trash2,
  Clock, History, ArrowLeft, Calendar, Tag,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGym } from '../context/GymContext';
import Navbar from '../components/Navbar';
import { formatDate } from '../utils/helpers';

const ACTION_CONFIG = {
  MEMBER_ADDED:       { icon: UserPlus,     color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30',  label: 'Enrolled'          },
  MEMBERSHIP_RENEWED: { icon: RefreshCw,    color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', label: 'Membership Renewed' },
  PAYMENT_APPROVED:   { icon: CheckCircle,  color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30',  label: 'Payment Approved'   },
  PAYMENT_REJECTED:   { icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/30',    label: 'Payment Rejected'   },
  MEMBER_UPDATED:     { icon: Pencil,       color: 'text-sky-400',    bg: 'bg-sky-500/15',    border: 'border-sky-500/30',    label: 'Info Updated'       },
  MEMBER_DELETED:     { icon: Trash2,       color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/30',    label: 'Deleted'            },
};

const DEFAULT_CONFIG = { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-700', border: 'border-slate-600', label: 'Activity' };

function fmtDateTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export default function MemberHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMemberById, getMemberStatus, MEMBERSHIP_OPTIONS, settings, gymSlug, gymId } = useGym();

  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);

  const member = getMemberById(id);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('gym_id', gymId)
        .eq('member_id', id)
        .order('created_at', { ascending: false });
      if (!error) setLogs(data || []);
      setLoading(false);
    };
    load();
  }, [id]);

  if (!member) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar showBack />
        <div className="flex items-center justify-center pt-24">
          <p className="text-slate-400">Member not found.</p>
        </div>
      </div>
    );
  }

  const { status, daysLeft } = getMemberStatus(member);

  const getMembershipLabel = (type) => {
    if (type === 'student') return 'Student';
    const standard = MEMBERSHIP_OPTIONS.find((o) => o.value === type);
    if (standard) return standard.label;
    const promo = settings.promos?.find((p) => p.name === type);
    return promo ? promo.name : type;
  };

  const statusColor = status === 'active' ? 'text-green-400' : status === 'expiring' ? 'text-orange-400' : 'text-red-400';
  const statusLabel = status === 'expired' ? 'Expired' : status === 'expiring' ? 'Expiring Soon' : 'Active';

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar showBack />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24 sm:pb-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
            <History size={20} className="text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Membership History</h1>
            <p className="text-slate-400 text-sm">{member.name}</p>
          </div>
          <button
            onClick={() => navigate(`/${gymSlug}/admin/members/${id}/edit`)}
            className="ml-auto flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <Pencil size={14} /> Edit
          </button>
        </div>

        {/* Current membership card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-3">Current Membership</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoBox label="Plan" value={getMembershipLabel(member.membershipType)} icon={<Tag size={13} />} />
            <InfoBox label="Status" value={statusLabel} valueClass={statusColor} icon={<Clock size={13} />} />
            <InfoBox label="Start Date" value={formatDate(member.membershipStartDate)} icon={<Calendar size={13} />} />
            <InfoBox
              label={status === 'expired' ? 'Ended' : 'Ends'}
              value={formatDate(member.membershipEndDate)}
              valueClass={status !== 'active' ? 'text-red-400' : ''}
              icon={<Calendar size={13} />}
            />
          </div>
          {status !== 'expired' && (
            <p className={`text-xs mt-3 font-medium ${statusColor}`}>
              {daysLeft >= 0 ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining` : 'Membership has expired'}
            </p>
          )}
        </div>

        {/* Timeline */}
        <div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-4">
            Timeline · {logs.length} event{logs.length !== 1 ? 's' : ''}
          </p>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <History size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">No history recorded yet</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-700/60" />

              <div className="space-y-4">
                {logs.map((log, i) => {
                  const cfg = ACTION_CONFIG[log.action] || DEFAULT_CONFIG;
                  const Icon = cfg.icon;
                  return (
                    <div key={log.id} className="relative flex gap-4">
                      {/* Icon bubble */}
                      <div className={`relative z-10 w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center ${cfg.bg} ${cfg.border}`}>
                        <Icon size={16} className={cfg.color} />
                      </div>

                      {/* Content */}
                      <div className={`flex-1 bg-slate-800 border rounded-2xl px-4 py-3 ${i === 0 ? 'border-slate-600' : 'border-slate-700/50'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-semibold text-sm ${cfg.color}`}>{cfg.label}</p>
                          <p className="text-slate-500 text-xs shrink-0">{fmtDateTime(log.created_at)}</p>
                        </div>
                        {log.description && (
                          <p className="text-slate-400 text-xs mt-1 leading-relaxed">{log.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value, valueClass = 'text-white', icon }) {
  return (
    <div className="bg-slate-700/40 rounded-xl p-3">
      <p className="flex items-center gap-1 text-slate-500 text-xs mb-1">{icon} {label}</p>
      <p className={`font-semibold text-sm ${valueClass}`}>{value}</p>
    </div>
  );
}
