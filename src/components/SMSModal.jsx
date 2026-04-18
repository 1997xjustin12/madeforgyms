import { useState } from 'react';
import { X, MessageSquare, Copy, CheckCircle, Send, ArrowLeft } from 'lucide-react';
import { buildSmsMessage, formatPhoneDisplay } from '../utils/helpers';
import { useGym } from '../context/GymContext';

export default function SMSModal({ member, daysLeft, onClose }) {
  const { logAction, settings } = useGym();
  const message = buildSmsMessage(member, daysLeft, settings.gymName);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const num = member.contactNumber.replace(/\D/g, '');
  const smsHref = `sms:${num}?body=${encodeURIComponent(message)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSmsClick = async () => {
    if (sent) return;
    await logAction('SMS_SENT', `Sent SMS notification to: ${member.name}`, member.name, member.id);
    setSent(true);
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
        <div className="px-5 pb-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition-colors"
          >
            {copied
              ? <><CheckCircle size={16} className="text-green-400" /> Copied!</>
              : <><Copy size={16} /> Copy</>}
          </button>
          <a
            href={smsHref}
            onClick={handleSmsClick}
            className="flex-1 flex items-center justify-center gap-2 text-white py-3 rounded-xl font-semibold transition-colors"
            style={{ background: sent ? 'rgba(249,115,22,0.5)' : 'rgb(249,115,22)' }}
          >
            {sent
              ? <><CheckCircle size={16} /> Sent</>
              : <><Send size={16} /> Send SMS</>}
          </a>
        </div>

        {/* Return hint */}
        <p className="flex items-center justify-center gap-1.5 text-slate-500 text-xs pb-4">
          <ArrowLeft size={11} /> Tap back in your browser to return here
        </p>

      </div>
    </div>
  );
}
