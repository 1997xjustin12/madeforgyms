import { useState } from 'react';
import { X, MessageSquare, Copy, CheckCircle, Send, Smartphone, Wifi } from 'lucide-react';
import { buildSmsMessage, formatPhoneDisplay } from '../utils/helpers';
import { useGym } from '../context/GymContext';
import { sendPhilSMS } from '../lib/sms';
import toast from 'react-hot-toast';

function buildSmsHref(contactNumber, message) {
  const num = contactNumber.replace(/\D/g, '');
  const body = encodeURIComponent(message);
  // iOS uses &body=, Android uses ?body= — sms:number?body= works on both modern browsers
  return `sms:${num}?body=${body}`;
}

export default function SMSModal({ member, daysLeft, onClose }) {
  const { logAction, settings } = useGym();
  const message = buildSmsMessage(member, daysLeft, settings.gymName);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  const hasPhilSMS = !!settings.philsmsToken;
  const smsHref = buildSmsHref(member.contactNumber, message);

  const handleCopy = () => {
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePhilSMS = async () => {
    if (sent || sending) return;
    setSending(true);
    try {
      await sendPhilSMS({ recipient: member.contactNumber, message, token: settings.philsmsToken, senderId: settings.philsmsSenderId });
      await logAction('SMS_SENT', `Sent SMS via PhilSMS to: ${member.name}`, member.name, member.id);
      setSent(true);
      toast.success('SMS sent!');
    } catch (err) {
      toast.error(err.message || 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  const handleNativeSms = async () => {
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
            {hasPhilSMS && (
              <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                <Wifi size={10} /> PhilSMS
              </span>
            )}
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

          {hasPhilSMS ? (
            <button
              onClick={handlePhilSMS}
              disabled={sent || sending}
              className="flex-1 flex items-center justify-center gap-2 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-60"
              style={{ background: sent ? 'rgba(249,115,22,0.5)' : 'rgb(249,115,22)' }}
            >
              {sending
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : sent
                ? <><CheckCircle size={16} /> Sent</>
                : <><Send size={16} /> Send via PhilSMS</>}
            </button>
          ) : (
            <a
              href={smsHref}
              onClick={handleNativeSms}
              className="flex-1 flex items-center justify-center gap-2 text-white py-3 rounded-xl font-semibold transition-colors"
              style={{ background: sent ? 'rgba(249,115,22,0.5)' : 'rgb(249,115,22)' }}
            >
              {sent
                ? <><CheckCircle size={16} /> Sent</>
                : <><Smartphone size={16} /> Open SMS App</>}
            </a>
          )}
        </div>

        {!hasPhilSMS && (
          <p className="text-center text-slate-500 text-xs pb-4">
            Opens your phone's messaging app with the message pre-filled
          </p>
        )}
      </div>
    </div>
  );
}
