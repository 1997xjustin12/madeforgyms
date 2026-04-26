import { useState } from 'react';
import { X, MessageSquare, Copy, ExternalLink, CheckCircle, Users, Wifi, Send } from 'lucide-react';
import { buildSmsMessage, openSmsApp, formatPhoneDisplay } from '../utils/helpers';
import { useGym } from '../context/GymContext';
import { sendPhilSMS } from '../lib/sms';
import toast from 'react-hot-toast';

export default function BulkSMSModal({ onClose }) {
  const { getExpiringMembers, getMemberStatus, logAction, settings, gymId } = useGym();
  const expiring = getExpiringMembers();
  const [sent, setSent] = useState({});
  const [sending, setSending] = useState(null);

  const hasPhilSMS = !!settings.philsmsToken;
  const markSent = (id) => setSent((prev) => ({ ...prev, [id]: true }));
  const allSent = expiring.length > 0 && expiring.every((m) => sent[m.id]);
  const sentCount = Object.keys(sent).length;

  const handleSend = async (member) => {
    if (sent[member.id] || sending === member.id) return;
    const { daysLeft } = getMemberStatus(member);
    const message = buildSmsMessage(member, daysLeft, settings.gymName);

    if (hasPhilSMS) {
      setSending(member.id);
      try {
        await sendPhilSMS({ recipient: member.contactNumber, message, token: settings.philsmsToken, senderId: settings.philsmsSenderId });
        await logAction('SMS_SENT', `Sent SMS via PhilSMS to: ${member.name}`, member.name, member.id);
        markSent(member.id);
      } catch (err) {
        toast.error(`Failed to send to ${member.name}: ${err.message}`);
      } finally {
        setSending(null);
      }
    } else {
      openSmsApp(member.contactNumber, message);
      markSent(member.id);
      await logAction('SMS_SENT', `Sent SMS notification to: ${member.name}`, member.name, member.id);
    }
  };

  const handleSendAll = async () => {
    if (!hasPhilSMS) {
      const next = expiring.find((m) => !sent[m.id]);
      if (next) handleSend(next);
      return;
    }
    for (const member of expiring) {
      if (sent[member.id]) continue;
      await handleSend(member);
    }
  };

  const handleCopyAll = () => {
    const text = expiring
      .map((m) => {
        const { daysLeft } = getMemberStatus(m);
        return `To: ${formatPhoneDisplay(m.contactNumber)}\n${buildSmsMessage(m, daysLeft, settings.gymName)}`;
      })
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(text).then(() => toast.success('All messages copied!'));
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Users size={16} className="text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold">Send SMS to All</h3>
                {hasPhilSMS && (
                  <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                    <Wifi size={10} /> PhilSMS
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs">{expiring.length} members expiring soon</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* Progress bar */}
        {expiring.length > 0 && (
          <div className="px-5 pt-4 shrink-0">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>Progress</span>
              <span className={sentCount === expiring.length ? 'text-green-400 font-semibold' : ''}>
                {sentCount} / {expiring.length} sent
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${(sentCount / expiring.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Members list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {expiring.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
              <p className="text-white font-semibold">No expiring members</p>
              <p className="text-slate-400 text-sm mt-1">All memberships are up to date</p>
            </div>
          ) : (
            expiring.map((member) => {
              const { daysLeft } = getMemberStatus(member);
              const isSent = sent[member.id];
              const isSending = sending === member.id;
              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                    isSent ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-700/50 border-slate-600/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-700 shrink-0">
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-orange-400 font-bold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{member.name}</p>
                    <p className="text-slate-400 text-xs font-mono">{formatPhoneDisplay(member.contactNumber)}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-orange-400 bg-orange-500/10 px-2 py-1 rounded-lg">
                    {daysLeft}d left
                  </span>
                  {isSent ? (
                    <div className="shrink-0 w-9 h-9 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <CheckCircle size={18} className="text-green-400" />
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSend(member)}
                      disabled={isSending}
                      className="shrink-0 w-9 h-9 bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-60"
                    >
                      {isSending
                        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : hasPhilSMS ? <Send size={15} /> : <ExternalLink size={15} />}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {expiring.length > 0 && (
          <div className="px-5 pb-5 pt-3 border-t border-slate-700/50 shrink-0 space-y-3">
            {allSent ? (
              <div className="flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl py-3">
                <CheckCircle size={18} className="text-green-400" />
                <p className="text-green-400 font-semibold text-sm">All messages sent!</p>
              </div>
            ) : (
              <button
                onClick={handleSendAll}
                disabled={!!sending}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-60"
              >
                {sending ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><MessageSquare size={18} />
                  {hasPhilSMS ? `Send All via PhilSMS` : `Send Next (${expiring.length - sentCount} remaining)`}</>
                )}
              </button>
            )}
            <button
              onClick={handleCopyAll}
              className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition-colors"
            >
              <Copy size={16} /> Copy All Messages
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
