import { format, parseISO } from 'date-fns';

export const formatDate = (dateStr) => {
  try {
    return format(parseISO(dateStr), 'MMM dd, yyyy');
  } catch {
    return dateStr;
  }
};

export const formatPhoneDisplay = (num) => {
  if (!num) return '';
  const d = num.replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 4)}-${d.slice(4, 7)}-${d.slice(7)}`;
  return num;
};

export const buildSmsMessage = (member, daysLeft, gymName = 'MadeForGyms') => {
  if (daysLeft === 0) {
    return `Hi ${member.name}! Your ${gymName} membership expires TODAY. Renew now to continue enjoying our facilities. Call us or visit the gym. Thank you!`;
  }
  return `Hi ${member.name}! Your ${gymName} membership expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''} on ${formatDate(member.membershipEndDate)}. Please renew soon to avoid interruption. Thank you!`;
};

export const openSmsApp = (contactNumber, message) => {
  const num = contactNumber.replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  // Works on iOS and Android
  window.open(`sms:${num}?body=${encoded}`, '_blank');
};
