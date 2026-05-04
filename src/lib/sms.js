import { supabase } from './supabase';

export async function sendSemaphoreSMS({ recipient, message, gymId }) {
  if (!gymId) throw new Error('gymId is required');
  const { data, error } = await supabase.functions.invoke('send-sms', {
    body: { gymId, recipient, message },
  });
  if (error) throw new Error(error.message || 'Failed to send SMS');
  if (data?.error) throw new Error(data.error);
  return data;
}
