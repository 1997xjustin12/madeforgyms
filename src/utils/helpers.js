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

export const calcBMI = (heightCm, weightKg) => {
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (!h || !w || h <= 0 || w <= 0) return null;
  return w / ((h / 100) ** 2);
};

export const getBMICategory = (bmi) => {
  if (bmi === null || bmi === undefined) return null;
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-sky-400',    bg: 'bg-sky-500/15',    border: 'border-sky-500/30',    key: 'underweight' };
  if (bmi < 25)   return { label: 'Normal',      color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30',  key: 'normal'       };
  if (bmi < 30)   return { label: 'Overweight',  color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', key: 'overweight'   };
  return            { label: 'Obese',        color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/30',    key: 'obese'        };
};

export const calcAge = (birthdateStr) => {
  if (!birthdateStr) return null;
  const today = new Date();
  const bd = new Date(birthdateStr);
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
};

export const openSmsApp = (contactNumber, message) => {
  const num = contactNumber.replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  // Works on iOS and Android
  window.open(`sms:${num}?body=${encoded}`, '_blank');
};
