function formatPHPhone(num) {
  const digits = num.replace(/\D/g, '');
  if (digits.startsWith('63') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 11) return '63' + digits.slice(1);
  if (digits.startsWith('9') && digits.length === 10) return '63' + digits;
  return digits;
}

export async function sendPhilSMS({ recipient, message, token, senderId = 'PhilSMS' }) {
  if (!token) throw new Error('PhilSMS token not configured in Settings');
  const phone = formatPHPhone(recipient);
  console.log('sendPhilSMS →', phone, 'token prefix:', token.slice(0, 8));
  const res = await fetch('https://dashboard.philsms.com/api/v3/sms/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ recipient: phone, sender_id: senderId, type: 'plain', message }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status === 'error' || data.success === false) {
    throw new Error(data.message || data.error || `SMS failed (${res.status})`);
  }
  return data;
}
