import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, AlertTriangle, UserX, UserPlus, MessageSquare, ChevronRight, Send, Download, RefreshCw, ShieldAlert, TrendingUp, ClipboardCheck } from 'lucide-react';
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
  const { members, getMemberStatus, getExpiringMembers, refreshMembers, settings, recordBackup, gymSlug, pendingMemberships, isAdmin, adminRole } = useGym();
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
    ...(isAdmin ? [{
      label: 'Pending Approvals',
      value: (pendingMemberships || []).filter(p => p.status === 'pending').length,
      sub: 'Staff submissions',
      icon: <ClipboardCheck size={20} />,
      color: 'text-blue-400',
      bg: 'bg-blue-500/15',
      accent: 'bg-blue-500',
      alert: (pendingMemberships || []).filter(p => p.status === 'pending').length > 0,
      link: `/${gymSlug}/admin/approvals`,
    }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 pb-24 sm:pb-8">

        {/* Greeting */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-slate-400 text-xs flex items-center gap-1">{greetEmoji} {greeting}</p>
            <h1 className="text-3xl font-black text-white tracking-tight">Dashboard</h1>
          </div>
          <div className="text-right pb-0.5">
            <p className="text-slate-300 text-xs font-semibold">
              {new Date().toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            <p className="text-slate-500 text-[10px] mt-0.5">{settings.gymName || 'MadeForGyms'}</p>
          </div>
        </div>

        {/* Backup Reminder */}
        {backupWarning && (
          <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-4 py-3">
            <ShieldAlert size={16} className="text-yellow-400 shrink-0" />
            <p className="text-yellow-300 font-medium text-xs flex-1 min-w-0">
              {daysSinceBackup === null ? 'No backup found!' : `Last backup ${daysSinceBackup}d ago`} — back up your data regularly.
            </p>
            <button
              onClick={() => { exportJSON(members, settings.gymName); recordBackup(); toast.success('Backup downloaded!'); }}
              className="shrink-0 flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold text-xs px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Download size={11} /> Backup
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {stats.map((s, i) => (
            <div
              key={s.label}
              onClick={s.link ? () => navigate(s.link) : undefined}
              className={`bg-slate-800/80 rounded-2xl border overflow-hidden relative ${
                stats.length % 2 !== 0 && i === stats.length - 1 ? 'col-span-2 lg:col-span-1' : ''
              } ${s.link ? 'cursor-pointer active:scale-95 transition-transform' : ''} ${
                s.alert ? 'border-orange-500/40 shadow-md shadow-orange-500/10' : 'border-slate-700/40'
              }`}
            >
              <div className={`h-0.5 ${s.accent} ${s.alert ? 'opacity-100' : 'opacity-60'}`} />
              <div className="p-3.5">
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-8 h-8 ${s.bg} rounded-xl flex items-center justify-center ${s.color}`}>
                    {s.icon}
                  </div>
                  {s.alert && (
                    <span className={`w-2 h-2 rounded-full ${s.accent} animate-pulse`} />
                  )}
                </div>
                <p className={`text-3xl font-black leading-none tabular-nums ${s.alert ? s.color : 'text-white'}`}>
                  {s.value}
                </p>
                <p className="text-slate-300 text-xs mt-1.5 font-semibold">{s.label}</p>
                <p className="text-slate-500 text-[10px] mt-0.5 leading-tight">{s.sub}</p>
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
          <h2 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
            <TrendingUp size={14} className="text-orange-400" /> Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">

            <button
              onClick={() => navigate(`/${gymSlug}/admin/register`)}
              className="group flex flex-col gap-3 bg-slate-800/80 border border-slate-700/40 hover:border-orange-500/50 rounded-2xl p-4 text-left transition-all active:scale-95"
            >
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <UserPlus size={20} className="text-orange-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Register</p>
                <p className="text-slate-500 text-xs">Add new member</p>
              </div>
            </button>

            <button
              onClick={() => navigate(`/${gymSlug}/admin/members`)}
              className="group flex flex-col gap-3 bg-slate-800/80 border border-slate-700/40 hover:border-sky-500/50 rounded-2xl p-4 text-left transition-all active:scale-95"
            >
              <div className="w-10 h-10 bg-sky-500/20 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-sky-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Members</p>
                <p className="text-slate-500 text-xs">{members.length} total</p>
              </div>
            </button>

            <button
              onClick={() => { exportMembersToExcel(members, settings.gymName); toast.success('Excel downloaded!'); }}
              className="group flex flex-col gap-3 bg-slate-800/80 border border-slate-700/40 hover:border-green-500/50 rounded-2xl p-4 text-left transition-all active:scale-95"
            >
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Download size={20} className="text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Export</p>
                <p className="text-slate-500 text-xs">Download Excel</p>
              </div>
            </button>

            <button
              onClick={() => setShowRestore(true)}
              className="group flex flex-col gap-3 bg-slate-800/80 border border-slate-700/40 hover:border-violet-500/50 rounded-2xl p-4 text-left transition-all active:scale-95"
            >
              <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
                <RefreshCw size={20} className="text-violet-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Restore</p>
                <p className="text-slate-500 text-xs">Import backup</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Members */}
        {members.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-bold">Recent Members</h2>
              <button onClick={() => navigate(`/${gymSlug}/admin/members`)} className="text-orange-400 hover:text-orange-300 text-sm font-medium flex items-center gap-1">
                See all <ChevronRight size={14} />
              </button>
            </div>
            <div className="bg-slate-800 rounded-2xl border border-slate-700/50 divide-y divide-slate-700/50 overflow-hidden">
              {members.slice(0, 5).map((member) => {
                const statusInfo = getMemberStatus(member);
                return (
                  <button
                    key={member.id}
                    onClick={() => navigate(`/${gymSlug}/admin/members/${member.id}/edit`)}
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
          gymId={gymId}
          onClose={() => setShowRestore(false)}
          onRestored={() => { refreshMembers(); setShowRestore(false); }}
        />
      )}
    </div>
  );
}
