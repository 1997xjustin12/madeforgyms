import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, AlertTriangle, UserX, UserPlus, MessageSquare, ChevronRight, Send, Download, RefreshCw, ShieldAlert, TrendingUp } from 'lucide-react';
import { useGym } from '../context/GymContext';
import { exportMembersToExcel } from '../utils/exportExcel';
import { exportJSON } from '../utils/backup';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import SMSModal from '../components/SMSModal';
import BulkSMSModal from '../components/BulkSMSModal';
import RestoreModal from '../components/RestoreModal';
import { formatDate, formatPhoneDisplay } from '../utils/helpers';

const hour = new Date().getHours();
const greeting   = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
const greetEmoji = hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙';

export default function AdminDashboard() {
  const { members, getMemberStatus, getExpiringMembers, refreshMembers, settings, recordBackup } = useGym();
  const navigate = useNavigate();
  const [smsTarget, setSmsTarget] = useState(null);
  const [showBulkSMS, setShowBulkSMS] = useState(false);
  const [showRestore, setShowRestore] = useState(false);

  const daysSinceBackup = settings.lastBackupAt
    ? Math.floor((Date.now() - new Date(settings.lastBackupAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const backupWarning = daysSinceBackup === null || daysSinceBackup >= 7;

  const expiring = getExpiringMembers();
  const active   = members.filter((m) => getMemberStatus(m).status === 'active');
  const expired  = members.filter((m) => getMemberStatus(m).status === 'expired');
  const activeRate = members.length > 0
    ? Math.round(((active.length + expiring.length) / members.length) * 100)
    : 0;

  const stats = [
    {
      label: 'Total Members',
      value: members.length,
      sub: members.length > 0 ? `${activeRate}% active rate` : 'No members yet',
      icon: <Users size={20} />,
      color: 'text-sky-400',
      bg: 'bg-sky-500/15',
      accent: 'bg-sky-500',
    },
    {
      label: 'Active',
      value: active.length + expiring.length,
      sub: members.length > 0 ? `${activeRate}% of total` : '—',
      icon: <UserCheck size={20} />,
      color: 'text-green-400',
      bg: 'bg-green-500/15',
      accent: 'bg-green-500',
    },
    {
      label: 'Expiring Soon',
      value: expiring.length,
      sub: expiring.length > 0 ? 'Needs renewal' : 'All good!',
      icon: <AlertTriangle size={20} />,
      color: 'text-orange-400',
      bg: 'bg-orange-500/15',
      accent: 'bg-orange-500',
      alert: expiring.length > 0,
    },
    {
      label: 'Expired',
      value: expired.length,
      sub: members.length > 0 ? `${Math.round((expired.length / members.length) * 100)}% of total` : '—',
      icon: <UserX size={20} />,
      color: 'text-red-400',
      bg: 'bg-red-500/15',
      accent: 'bg-red-500',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 pb-24 sm:pb-8">

        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">{greetEmoji} {greeting}</p>
            <h1 className="text-2xl font-black text-white mt-0.5">Dashboard</h1>
          </div>
          <div className="text-right">
            <p className="text-slate-300 text-sm font-medium">
              {new Date().toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            <p className="text-slate-500 text-xs mt-0.5">Power Fitness Gym</p>
          </div>
        </div>

        {/* Backup Reminder */}
        {backupWarning && (
          <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/40 rounded-2xl p-4">
            <div className="w-9 h-9 bg-yellow-500/20 rounded-xl flex items-center justify-center shrink-0">
              <ShieldAlert size={18} className="text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-yellow-300 font-semibold text-sm">
                {daysSinceBackup === null ? 'No backup found!' : `Last backup was ${daysSinceBackup} days ago`}
              </p>
              <p className="text-yellow-400/70 text-xs mt-0.5">
                Protect your data — download a backup regularly.
              </p>
            </div>
            <button
              onClick={() => { exportJSON(members); recordBackup(); toast.success('Backup downloaded!'); }}
              className="shrink-0 flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold text-xs px-3 py-2 rounded-xl transition-colors"
            >
              <Download size={13} /> Backup Now
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`bg-slate-800 rounded-2xl border overflow-hidden relative ${
                s.alert ? 'border-orange-500/50 shadow-lg shadow-orange-500/10' : 'border-slate-700/30'
              }`}
            >
              {/* Colored top accent bar */}
              <div className={`h-1 ${s.accent} ${s.alert ? 'animate-pulse' : ''}`} />
              <div className="p-4">
                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                  {s.icon}
                </div>
                <p className={`text-3xl font-black leading-none ${s.alert ? 'text-orange-400' : 'text-white'}`}>
                  {s.value}
                </p>
                <p className="text-slate-400 text-xs mt-1 font-medium">{s.label}</p>
                <p className={`text-xs mt-0.5 ${s.alert ? 'text-orange-400/70' : 'text-slate-600'}`}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Expiring Soon Alert */}
        {expiring.length > 0 && (
          <div className="bg-orange-500/10 border-2 border-orange-500/40 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 bg-orange-500/20 border-b border-orange-500/30">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center animate-pulse">
                <AlertTriangle size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-orange-300 font-bold">
                  {expiring.length} Membership{expiring.length > 1 ? 's' : ''} Expiring Soon!
                </p>
                <p className="text-orange-400/70 text-xs">Within 5 days — consider sending renewal reminders</p>
              </div>
              <button
                onClick={() => setShowBulkSMS(true)}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
              >
                <Send size={12} /> Notify All
              </button>
            </div>

            <div className="divide-y divide-orange-500/10">
              {expiring.map((member) => {
                const { daysLeft, label } = getMemberStatus(member);
                return (
                  <div key={member.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-700 shrink-0">
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-orange-400 font-bold text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{member.name}</p>
                      <p className="text-slate-400 text-xs">{formatPhoneDisplay(member.contactNumber)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge status="expiring" label={label} />
                      <p className="text-slate-500 text-xs mt-1">Ends {formatDate(member.membershipEndDate)}</p>
                    </div>
                    <button
                      onClick={() => setSmsTarget({ member, daysLeft })}
                      className="ml-1 w-9 h-9 bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 rounded-xl flex items-center justify-center transition-colors shrink-0"
                      title="Send SMS"
                    >
                      <MessageSquare size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-white font-bold mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-orange-400" /> Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

            <button
              onClick={() => navigate('/admin/register')}
              className="group flex items-center gap-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-orange-500/60 rounded-2xl p-4 text-left transition-all hover:shadow-lg hover:shadow-orange-500/5"
            >
              <div className="w-11 h-11 bg-orange-500/20 group-hover:bg-orange-500/30 rounded-xl flex items-center justify-center transition-colors">
                <UserPlus size={22} className="text-orange-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Register Member</p>
                <p className="text-slate-400 text-xs">Add a new gym member</p>
              </div>
              <ChevronRight size={18} className="ml-auto text-slate-600 group-hover:text-orange-400 transition-colors" />
            </button>

            <div className="bg-slate-800 border border-slate-700 hover:border-green-500/50 rounded-2xl p-4 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Download size={22} className="text-green-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Export / Backup</p>
                  <p className="text-slate-400 text-xs">Download your member data</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { exportMembersToExcel(members); toast.success('Excel downloaded!'); }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 rounded-xl transition-colors"
                >
                  <Download size={13} /> Excel
                </button>
                <button
                  onClick={() => { exportJSON(members); recordBackup(); toast.success('Backup downloaded!'); }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold py-2 rounded-xl transition-colors"
                >
                  <Download size={13} /> JSON
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowRestore(true)}
              className="group flex items-center gap-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-sky-500/60 rounded-2xl p-4 text-left transition-all hover:shadow-lg hover:shadow-sky-500/5"
            >
              <div className="w-11 h-11 bg-sky-500/20 group-hover:bg-sky-500/30 rounded-xl flex items-center justify-center transition-colors">
                <RefreshCw size={22} className="text-sky-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Restore Backup</p>
                <p className="text-slate-400 text-xs">Import from backup file</p>
              </div>
              <ChevronRight size={18} className="ml-auto text-slate-600 group-hover:text-sky-400 transition-colors" />
            </button>

            <button
              onClick={() => navigate('/admin/members')}
              className="group flex items-center gap-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-sky-500/60 rounded-2xl p-4 text-left transition-all"
            >
              <div className="w-11 h-11 bg-sky-500/20 group-hover:bg-sky-500/30 rounded-xl flex items-center justify-center transition-colors">
                <Users size={22} className="text-sky-400" />
              </div>
              <div>
                <p className="text-white font-semibold">View All Members</p>
                <p className="text-slate-400 text-xs">{members.length} total members</p>
              </div>
              <ChevronRight size={18} className="ml-auto text-slate-600 group-hover:text-sky-400 transition-colors" />
            </button>
          </div>
        </div>

        {/* Recent Members */}
        {members.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-bold">Recent Members</h2>
              <button onClick={() => navigate('/admin/members')} className="text-orange-400 hover:text-orange-300 text-sm font-medium flex items-center gap-1">
                See all <ChevronRight size={14} />
              </button>
            </div>
            <div className="bg-slate-800 rounded-2xl border border-slate-700/50 divide-y divide-slate-700/50 overflow-hidden">
              {members.slice(0, 5).map((member) => {
                const statusInfo = getMemberStatus(member);
                return (
                  <button
                    key={member.id}
                    onClick={() => navigate(`/admin/members/${member.id}/edit`)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-700/40 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-700 shrink-0">
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-orange-400 font-bold text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{member.name}</p>
                      <p className="text-slate-400 text-xs">{formatPhoneDisplay(member.contactNumber)}</p>
                    </div>
                    <StatusBadge status={statusInfo.status} label={statusInfo.label} />
                    <ChevronRight size={14} className="text-slate-600 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {smsTarget && (
        <SMSModal member={smsTarget.member} daysLeft={smsTarget.daysLeft} onClose={() => setSmsTarget(null)} />
      )}
      {showBulkSMS && <BulkSMSModal onClose={() => setShowBulkSMS(false)} />}
      {showRestore && (
        <RestoreModal
          onClose={() => setShowRestore(false)}
          onRestored={() => { refreshMembers(); setShowRestore(false); }}
        />
      )}
    </div>
  );
}
