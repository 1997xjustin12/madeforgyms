import { X, MessageSquare, Copy, ExternalLink } from 'lucide-react';
import { buildSmsMessage, openSmsApp, formatPhoneDisplay } from '../utils/helpers';
import { useGym } from '../context/GymContext';
import toast from 'react-hot-toast';

export default function SMSModal({ member, daysLeft, onClose }) {
  const { logAction, settings } = useGym();
  const message = buildSmsMessage(member, daysLeft, settings.gymName);

  const handleCopy = () => {
    navigator.clipboard.writeText(message).then(() => {
      toast.success('Message copied!');
    });
  };

  const handleOpenSms = async () => {
    openSmsApp(member.contactNumber, message);
    toast.success(`Opening SMS for ${member.name}`);
    await logAction('SMS_SENT', `Sent SMS notification to: ${member.name}`, member.name, member.id);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-orange-400" />
            <h3 className="text-white font-semibold">Send SMS</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* Recipient */}
        <div className="px-5 py-4 border-b border-slate-700/50">
          <p className="text-slate-400 text-xs mb-1">Recipient</p>
          <p className="text-white font-semibold">{member.name}</p>
          <p className="text-orange-400 font-mono text-sm">{formatPhoneDisplay(member.contactNumber)}</p>
        </div>

        {/* Message preview */}
        <div className="px-5 py-4">
          <p className="text-slate-400 text-xs mb-2">Message Preview</p>
          <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
            <p className="text-slate-100 text-sm leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition-colors"
          >
            <Copy size={16} /> Copy Message
          </button>
          <button
            onClick={handleOpenSms}
            className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            <ExternalLink size={16} /> Open SMS App
          </button>
        </div>

        <p className="text-center text-slate-500 text-xs pb-4">
          "Open SMS App" works best on mobile devices
        </p>
      </div>
    </div>
  );
}
