import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { differenceInDays, addDays, addMonths } from 'date-fns';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const GymContext = createContext();

const toTitleCase = (str) =>
  str.trim().replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

export const MEMBERSHIP_OPTIONS = [
  { value: 'monthly',     label: '1 Month',  months: 1  },
  { value: 'quarterly',   label: '3 Months', months: 3  },
  { value: 'semi-annual', label: '6 Months', months: 6  },
  { value: 'annual',      label: '1 Year',   months: 12 },
];

const MEMBERSHIP_MONTHS = {
  monthly:       1,
  quarterly:     3,
  'semi-annual': 6,
  annual:        12,
  student:       1,
};

const toMember = (row) => ({
  id: row.id,
  name: row.name,
  contactNumber: row.contact_number,
  photo: row.photo_url || null,
  membershipType: row.membership_type,
  membershipStartDate: row.membership_start_date,
  membershipEndDate: row.membership_end_date,
  notes: row.notes || '',
  instructorId: row.instructor_id || null,
  coachingPlan: row.coaching_plan || null,
  coachingStartDate: row.coaching_start_date || null,
  coachingEndDate: row.coaching_end_date || null,
  qrToken: row.qr_token || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toSettings = (row) => ({
  gymName: row.gym_name || 'MadeForGyms',
  gymLogoUrl: row.gym_logo_url || null,
  gymAddress: row.gym_address || '',
  gymContactNumber: row.gym_contact_number || '',
  gcashNumber: row.gcash_number || '',
  gcashName: row.gcash_name || '',
  gcashQrUrl: row.gcash_qr_url || null,
  priceMonthly: Number(row.price_monthly) || 0,
  priceQuarterly: Number(row.price_quarterly) || 0,
  priceSemiAnnual: Number(row.price_semi_annual) || 0,
  priceAnnual: Number(row.price_annual) || 0,
  priceStudent: Number(row.price_student) || 0,
  priceCoaching: Number(row.price_coaching) || 0,
  coachingPlans: Array.isArray(row.coaching_plans) ? row.coaching_plans : [],
  telegramChatId: row.telegram_chat_id || '',
  telegramBotToken: row.telegram_bot_token || '',
  siteUrl: row.site_url || '',
  lastBackupAt: row.last_backup_at || null,
  promos: Array.isArray(row.promos) ? row.promos : [],
  philsmsToken: row.philsms_token || '',
  philsmsSenderId: row.philsms_sender_id || 'PhilSMS',
});

const isBase64 = (str) => typeof str === 'string' && str.startsWith('data:');

const uploadPhoto = async (base64DataUrl, memberId) => {
  const res = await fetch(base64DataUrl);
  const blob = await res.blob();
  const path = `${memberId}/photo.jpg`;
  const { error } = await supabase.storage
    .from('member-photos')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('member-photos').getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
};

const removePhoto = async (memberId) => {
  await supabase.storage.from('member-photos').remove([`${memberId}/photo.jpg`]);
};

export function GymProvider({ children }) {
  const [members, setMembers]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [authLoading, setAuthLoading]   = useState(true);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail]     = useState(null);
  const [adminRole, setAdminRole]       = useState(null); // 'admin' | 'staff' | null
  const [adminName, setAdminName]       = useState(null);
  const [renewalRequests, setRenewalRequests] = useState([]);
  const [instructors, setInstructors]   = useState([]);
  const [pendingMemberships, setPendingMemberships] = useState([]);

  // ── Current gym (set when a gym slug is resolved) ────────────
  const [currentGym, setCurrentGym]     = useState(null);
  const [gymLoading, setGymLoading]     = useState(false);
  const [gymNotFound, setGymNotFound]   = useState(false);
  const [gymSuspended, setGymSuspended] = useState(false);

  const gymId   = currentGym?.id   || null;
  const gymSlug = currentGym?.slug || null;

  const [settings, setSettings] = useState({
    gymName: 'MadeForGyms',
    gymLogoUrl: null, gymAddress: '', gymContactNumber: '',
    gcashNumber: '', gcashName: '', coachingPlans: [], gcashQrUrl: null,
    priceMonthly: 0, priceQuarterly: 0, priceSemiAnnual: 0,
    priceAnnual: 0, priceStudent: 0, priceCoaching: 0,
    telegramChatId: '', telegramBotToken: '', siteUrl: '',
    lastBackupAt: null, promos: [],
    philsmsToken: '', philsmsSenderId: 'PhilSMS',
  });

  // ── Resolve gym by slug ──────────────────────────────────────
  const loadGymBySlug = useCallback(async (slug) => {
    if (!slug) return;
    setGymLoading(true);
    setGymNotFound(false);
    setGymSuspended(false);
    try {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .eq('slug', slug)
        .in('status', ['active', 'suspended'])
        .single();
      if (error || !data) {
        setGymNotFound(true);
        setCurrentGym(null);
      } else {
        setCurrentGym(data);
        setGymSuspended(data.status === 'suspended');
      }
    } catch {
      setGymNotFound(true);
    } finally {
      setGymLoading(false);
    }
  }, []);

  // ── Auth ─────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdminLoggedIn(!!session);
      setAdminEmail(session?.user?.email || null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdminLoggedIn(!!session);
      setAdminEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Fetch admin role whenever gym + session are both ready ────
  useEffect(() => {
    if (!gymId || !isAdminLoggedIn) {
      setAdminRole(null);
      setAdminName(null);
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('gym_admins')
        .select('role, username, email')
        .eq('gym_id', gymId)
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          setAdminRole(data?.role || 'admin');
          setAdminName(data?.username || data?.email || user.email || '');
        });
    });
  }, [gymId, isAdminLoggedIn]);

  // ── Load members (only when gym is known) ────────────────────
  const loadMembers = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMembers((data || []).map(toMember));
    } catch (err) {
      console.error('Failed to load members:', err);
      toast.error('Could not load members.');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  // ── Real-time: members ───────────────────────────────────────
  useEffect(() => {
    if (!gymId) return;
    const channel = supabase
      .channel(`members_realtime_${gymId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'members',
        filter: `gym_id=eq.${gymId}`,
      }, () => loadMembers())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [gymId, loadMembers]);

  // ── Load settings ────────────────────────────────────────────
  const loadSettings = useCallback(async () => {
    if (!gymId) return;
    try {
      const { data, error } = await supabase
        .from('gym_settings')
        .select('*')
        .eq('gym_id', gymId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) setSettings(toSettings(data));
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }, [gymId]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const saveSettings = async (formData) => {
    if (!gymId) throw new Error('No gym loaded');
    let gcashQrUrl = formData.gcashQrUrl;
    let gymLogoUrl = formData.gymLogoUrl;

    if (formData.gcashQrFile) {
      const file = formData.gcashQrFile;
      const path = `${gymId}/settings/gcash-qr.png`;
      const { error: upErr } = await supabase.storage
        .from('member-photos')
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('member-photos').getPublicUrl(path);
      gcashQrUrl = `${data.publicUrl}?v=${Date.now()}`;
    }

    if (formData.gymLogoFile) {
      const file = formData.gymLogoFile;
      const path = `${gymId}/settings/gym-logo.png`;
      const { error: upErr } = await supabase.storage
        .from('member-photos')
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('member-photos').getPublicUrl(path);
      gymLogoUrl = `${data.publicUrl}?v=${Date.now()}`;
    }

    const payload = {
      gym_id: gymId,
      gym_name: formData.gymName || '',
      gym_logo_url: gymLogoUrl || null,
      gym_address: formData.gymAddress || '',
      gym_contact_number: formData.gymContactNumber || '',
      gcash_number: formData.gcashNumber,
      gcash_name: formData.gcashName,
      gcash_qr_url: gcashQrUrl,
      price_monthly: Number(formData.priceMonthly) || 0,
      price_quarterly: Number(formData.priceQuarterly) || 0,
      price_semi_annual: Number(formData.priceSemiAnnual) || 0,
      price_annual: Number(formData.priceAnnual) || 0,
      price_student: Number(formData.priceStudent) || 0,
      price_coaching: Number(formData.priceCoaching) || 0,
      coaching_plans: formData.coachingPlans || [],
      telegram_chat_id: formData.telegramChatId || '',
      telegram_bot_token: formData.telegramBotToken || '',
      site_url: formData.siteUrl || '',
      promos: formData.promos || [],
      philsms_token: formData.philsmsToken || '',
      philsms_sender_id: formData.philsmsSenderId || 'PhilSMS',
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from('gym_settings')
      .select('id')
      .eq('gym_id', gymId)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase.from('gym_settings').update(payload).eq('gym_id', gymId));
    } else {
      ({ error } = await supabase.from('gym_settings').insert([{ ...payload, gym_id: gymId }]));
    }
    if (error) throw error;
    await loadSettings();
  };

  const recordBackup = async () => {
    if (!gymId) return;
    const now = new Date().toISOString();
    await supabase.from('gym_settings').update({ last_backup_at: now }).eq('gym_id', gymId);
    setSettings((prev) => ({ ...prev, lastBackupAt: now }));
  };

  // ── Renewal requests ─────────────────────────────────────────
  const loadRenewalRequests = useCallback(async () => {
    if (!gymId) return;
    try {
      const { data, error } = await supabase
        .from('renewal_requests')
        .select('*')
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRenewalRequests(data || []);
    } catch (err) {
      console.error('Failed to load renewal requests:', err);
    }
  }, [gymId]);

  useEffect(() => { loadRenewalRequests(); }, [loadRenewalRequests]);

  useEffect(() => {
    if (!gymId) return;
    const channel = supabase
      .channel(`renewals_realtime_${gymId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'renewal_requests',
        filter: `gym_id=eq.${gymId}`,
      }, () => loadRenewalRequests())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [gymId, loadRenewalRequests]);

  // ── Instructors ──────────────────────────────────────────────
  const loadInstructors = useCallback(async () => {
    if (!gymId) return;
    try {
      const { data, error } = await supabase
        .from('instructors')
        .select('*')
        .eq('gym_id', gymId)
        .order('name', { ascending: true });
      if (error) throw error;
      setInstructors(data || []);
    } catch (err) {
      console.error('Failed to load instructors:', err);
    }
  }, [gymId]);

  useEffect(() => { loadInstructors(); }, [loadInstructors]);

  const addInstructor = async ({ name, specialty, contactNumber, email, bio, photo, accessCode }) => {
    if (!gymId) throw new Error('No gym loaded');
    const code = accessCode?.trim().toUpperCase() || null;
    if (code && instructors.some((i) => (i.access_code || '').toUpperCase() === code)) {
      throw new Error(`Access code "${code}" is already used by another coach.`);
    }
    const { data, error } = await supabase
      .from('instructors')
      .insert([{
        gym_id: gymId,
        name: name.trim(),
        specialty: specialty?.trim() || '',
        contact_number: contactNumber?.trim() || '',
        email: email?.trim() || null,
        bio: bio?.trim() || '',
        access_code: code,
      }])
      .select()
      .single();
    if (error) {
      if (error.message?.includes('unique')) throw new Error(`Access code "${code}" is already used by another coach.`);
      throw error;
    }
    if (photo && isBase64(photo)) {
      const photoUrl = await uploadPhoto(photo, `instructors/${data.id}`);
      await supabase.from('instructors').update({ photo_url: photoUrl }).eq('id', data.id);
      data.photo_url = photoUrl;
    }
    setInstructors((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    return data;
  };

  const updateInstructor = async (id, { name, specialty, contactNumber, email, bio, photo, accessCode }) => {
    const code = accessCode?.trim().toUpperCase() || null;
    if (code && instructors.some((i) => i.id !== id && (i.access_code || '').toUpperCase() === code)) {
      throw new Error(`Access code "${code}" is already used by another coach.`);
    }
    const existing = instructors.find((i) => i.id === id);
    let photoUrl = existing?.photo_url || null;
    if (photo && isBase64(photo)) {
      photoUrl = await uploadPhoto(photo, `instructors/${id}`);
    } else if (!photo && existing?.photo_url) {
      await supabase.storage.from('member-photos').remove([`instructors/${id}/photo.jpg`]);
      photoUrl = null;
    }
    const { data, error } = await supabase
      .from('instructors')
      .update({ name: name.trim(), specialty: specialty?.trim() || '', contact_number: contactNumber?.trim() || '', email: email?.trim() || null, bio: bio?.trim() || '', photo_url: photoUrl, access_code: code })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      if (error.message?.includes('unique')) throw new Error(`Access code "${code}" is already used by another coach.`);
      throw error;
    }
    setInstructors((prev) => prev.map((i) => i.id === id ? data : i));
    return data;
  };

  const deleteInstructor = async (id) => {
    const { error } = await supabase.from('instructors').delete().eq('id', id);
    if (error) throw error;
    setInstructors((prev) => prev.filter((i) => i.id !== id));
  };

  const toggleInstructor = async (id, isActive) => {
    const { error } = await supabase.from('instructors').update({ is_active: !isActive }).eq('id', id);
    if (error) throw error;
    setInstructors((prev) => prev.map((i) => i.id === id ? { ...i, is_active: !isActive } : i));
  };

  // ── Renewal request submission ───────────────────────────────
  const submitRenewalRequest = async (payload) => {
    if (!gymId) throw new Error('No gym loaded');
    let receiptUrl = null;
    if (payload.receiptFile) {
      const file = payload.receiptFile;
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `receipts/${gymId}/${Date.now()}-${payload.memberId}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('member-photos')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('member-photos').getPublicUrl(path);
      receiptUrl = data.publicUrl;
    }

    const viewToken = crypto.randomUUID();
    const viewTokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error } = await supabase.from('renewal_requests').insert([{
      gym_id: gymId,
      member_id: payload.memberId,
      member_name: payload.memberName,
      contact_number: payload.contactNumber,
      membership_type: payload.membershipType,
      amount: payload.amount,
      gcash_reference: payload.gcashReference || '',
      receipt_url: receiptUrl,
      duration_days: payload.durationDays || null,
      status: 'pending',
      view_token: viewToken,
      view_token_expires_at: viewTokenExpiresAt,
      coaching_requested: payload.coachingRequested || false,
      coaching_price: payload.coachingPrice || 0,
    }]);
    if (error) throw error;

    const { telegramBotToken, telegramChatId, siteUrl } = settings;
    if (telegramBotToken && telegramChatId && siteUrl) {
      const reviewLink = `${siteUrl.replace(/\/$/, '')}/review/${viewToken}`;
      const planLabel = payload.membershipType.charAt(0).toUpperCase() + payload.membershipType.slice(1);
      const message = [
        '💳 <b>New Payment Request</b>',
        '',
        `👤 <b>Member:</b> ${payload.memberName}`,
        `📋 <b>Plan:</b> ${planLabel}`,
        `💰 <b>Amount:</b> ₱${Number(payload.amount).toLocaleString()}`,
        payload.coachingRequested ? `🏋️ <b>+ Coaching:</b> ₱${Number(payload.coachingPrice).toLocaleString()}` : '',
        payload.gcashReference ? `🔖 <b>GCash Ref:</b> ${payload.gcashReference}` : '',
        '',
        `🔗 <a href="${reviewLink}">Review &amp; Approve / Reject</a>`,
      ].filter(Boolean).join('\n');

      await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramChatId, text: message, parse_mode: 'HTML', disable_web_page_preview: true }),
      }).catch(() => {});
    }
  };

  const approveRenewalRequest = async (request) => {
    const today = new Date().toISOString().split('T')[0];
    const endDate = calculateEndDate(today, request.membership_type, request.duration_days);
    const { data, error: memberErr } = await supabase
      .from('members')
      .update({ membership_type: request.membership_type, membership_start_date: today, membership_end_date: endDate, updated_at: new Date().toISOString() })
      .eq('id', request.member_id)
      .select()
      .single();
    if (memberErr) throw memberErr;
    setMembers((prev) => prev.map((m) => (m.id === request.member_id ? toMember(data) : m)));
    const { error: reqErr } = await supabase
      .from('renewal_requests')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', request.id);
    if (reqErr) throw reqErr;
    await logAction('PAYMENT_APPROVED', `Approved GCash payment ₱${request.amount} — renewed ${request.membership_type} for: ${request.member_name}`, request.member_name, request.member_id);
    await loadRenewalRequests();
  };

  const rejectRenewalRequest = async (id, notes = '') => {
    const request = renewalRequests.find((r) => r.id === id);
    const { error } = await supabase
      .from('renewal_requests')
      .update({ status: 'rejected', admin_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    await logAction('PAYMENT_REJECTED', `Rejected GCash payment for: ${request?.member_name}`, request?.member_name, request?.member_id);
    await loadRenewalRequests();
  };

  // ── Helpers ──────────────────────────────────────────────────
  const calculateEndDate = (startDate, membershipType, durationDays = null) => {
    const start = new Date(startDate);
    const months = MEMBERSHIP_MONTHS[membershipType];
    if (months) return addMonths(start, months).toISOString().split('T')[0];
    const days = durationDays || settings.promos.find((p) => p.name === membershipType)?.duration_days || 30;
    return addDays(start, days).toISOString().split('T')[0];
  };

  const logAction = async (action, description, memberName = null, memberId = null) => {
    if (!gymId) { console.warn('logAction: no gymId'); return; }
    console.log('logAction', { action, gymId, memberId, memberName });
    try {
      const { error } = await supabase.from('activity_logs').insert([{
        gym_id: gymId,
        action, description,
        member_name: memberName,
        member_id: memberId,
        performed_by: adminName || adminEmail || 'Admin',
      }]);
      if (error) console.error('logAction insert failed:', error.message, error);
      else console.log('logAction insert OK');
    } catch (err) {
      console.error('logAction exception:', err);
    }
  };

  const isNameTaken = (name, excludeId = null) => {
    const normalized = name.trim().toLowerCase();
    return members.some((m) => m.name.trim().toLowerCase() === normalized && m.id !== excludeId);
  };

  // ── CRUD ─────────────────────────────────────────────────────
  const addMember = async (formData) => {
    if (!gymId) throw new Error('No gym loaded');
    const normalizedName = toTitleCase(formData.name);
    if (isNameTaken(normalizedName)) throw new Error(`A member named "${normalizedName}" already exists.`);
    const endDate = calculateEndDate(formData.membershipStartDate, formData.membershipType);
    const { data: inserted, error: insertError } = await supabase
      .from('members')
      .insert([{
        gym_id: gymId,
        name: normalizedName,
        contact_number: formData.contactNumber,
        photo_url: null,
        membership_type: formData.membershipType,
        membership_start_date: formData.membershipStartDate,
        membership_end_date: endDate,
        notes: formData.notes || '',
        instructor_id: formData.instructorId || null,
        coaching_plan: formData.coachingPlan || null,
        coaching_start_date: formData.coachingStartDate || null,
        coaching_end_date: formData.coachingEndDate || null,
      }])
      .select()
      .single();
    if (insertError) throw insertError;

    let photoUrl = null;
    if (isBase64(formData.photo)) {
      photoUrl = await uploadPhoto(formData.photo, inserted.id);
      await supabase.from('members').update({ photo_url: photoUrl, updated_at: new Date().toISOString() }).eq('id', inserted.id);
      inserted.photo_url = photoUrl;
    }

    if (formData.instructorId && formData.coachingStartDate) {
      const inst = instructors.find((i) => i.id === formData.instructorId);
      await supabase.from('coaching_subscriptions').upsert([{
        gym_id: gymId,
        member_id: inserted.id,
        instructor_id: formData.instructorId,
        instructor_name: inst?.name || null,
        coaching_plan: formData.coachingPlan || null,
        start_date: formData.coachingStartDate,
        end_date: formData.coachingEndDate || null,
      }], { onConflict: 'member_id,instructor_id,start_date' });
    }

    const member = toMember(inserted);
    setMembers((prev) => [member, ...prev]);
    await logAction('MEMBER_ADDED', `Registered new member: ${member.name}`, member.name, member.id);
    return member;
  };

  const updateMember = async (id, formData) => {
    const normalizedName = toTitleCase(formData.name);
    if (isNameTaken(normalizedName, id)) throw new Error(`A member named "${normalizedName}" already exists.`);
    const existing = members.find((m) => m.id === id);
    const startDate = formData.membershipStartDate ?? existing?.membershipStartDate;
    const membershipType = formData.membershipType ?? existing?.membershipType;
    const endDate = calculateEndDate(startDate, membershipType);

    let photoUrl;
    if (isBase64(formData.photo)) {
      photoUrl = await uploadPhoto(formData.photo, id);
    } else if (!formData.photo && existing?.photo) {
      await removePhoto(id);
      photoUrl = null;
    } else {
      photoUrl = formData.photo ?? null;
    }

    const { data, error } = await supabase
      .from('members')
      .update({ name: normalizedName, contact_number: formData.contactNumber, photo_url: photoUrl, membership_type: membershipType, membership_start_date: startDate, membership_end_date: endDate, notes: formData.notes || '', instructor_id: formData.instructorId || null, coaching_plan: formData.coachingPlan || null, coaching_start_date: formData.coachingStartDate || null, coaching_end_date: formData.coachingEndDate || null, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    const updated = toMember(data);
    setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));

    const coachChanged = (formData.instructorId || null) !== (existing?.instructorId || null);
    if (coachChanged && existing?.instructorId && existing?.coachingStartDate) {
      const todayStr = new Date().toISOString().split('T')[0];
      await supabase.from('coaching_subscriptions').update({ end_date: todayStr }).eq('member_id', id).eq('instructor_id', existing.instructorId).eq('start_date', existing.coachingStartDate);
    }
    if (formData.instructorId && formData.coachingStartDate) {
      const inst = instructors.find((i) => i.id === formData.instructorId);
      await supabase.from('coaching_subscriptions').upsert([{
        gym_id: gymId,
        member_id: id,
        instructor_id: formData.instructorId,
        instructor_name: inst?.name || null,
        coaching_plan: formData.coachingPlan || null,
        start_date: formData.coachingStartDate,
        end_date: formData.coachingEndDate || null,
      }], { onConflict: 'member_id,instructor_id,start_date' });
    }

    if (coachChanged) {
      const newCoach = instructors.find((i) => i.id === formData.instructorId);
      const oldCoach = instructors.find((i) => i.id === existing?.instructorId);
      const desc = newCoach
        ? `Assigned coach ${newCoach.name}${oldCoach ? ` (was ${oldCoach.name})` : ''} for: ${updated.name}`
        : `Removed coach ${oldCoach?.name || ''} from: ${updated.name}`;
      await logAction('COACHING_UPDATED', desc, updated.name, id);
    }

    const isRenewal = existing?.membershipStartDate !== startDate;
    if (isRenewal) {
      await logAction('MEMBERSHIP_RENEWED', `Renewed membership for: ${updated.name}`, updated.name, id);
    } else {
      await logAction('MEMBER_UPDATED', `Updated member info: ${updated.name}`, updated.name, id);
    }
    return updated;
  };

  const renewMember = async (id, membershipType, paymentMethod, durationDays) => {
    const today = new Date().toISOString().split('T')[0];
    const endDate = calculateEndDate(today, membershipType, durationDays);
    const { data, error } = await supabase
      .from('members')
      .update({ membership_type: membershipType, membership_start_date: today, membership_end_date: endDate, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const updated = toMember(data);
    setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
    await logAction('MEMBERSHIP_RENEWED', `Admin accepted ${paymentMethod} payment — renewed ${membershipType} for: ${updated.name}`, updated.name, id);
    return updated;
  };

  const deleteMember = async (id) => {
    const member = members.find((m) => m.id === id);
    await removePhoto(id);
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) throw error;
    setMembers((prev) => prev.filter((m) => m.id !== id));
    await logAction('MEMBER_DELETED', `Removed member: ${member?.name}`, member?.name, id);
  };

  const getMemberById  = (id) => members.find((m) => m.id === id);
  const findMembers    = (query) => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return members.filter((m) => m.contactNumber.includes(q) || m.name.toLowerCase().includes(q));
  };

  const getMemberStatus = (member) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end   = new Date(member.membershipEndDate); end.setHours(0, 0, 0, 0);
    const daysLeft = differenceInDays(end, today);
    if (daysLeft < 0)  return { status: 'expired',  daysLeft, label: 'Expired', color: 'red' };
    if (daysLeft <= 5) return { status: 'expiring', daysLeft, label: 'Active',  color: 'orange' };
    return { status: 'active', daysLeft, label: 'Active', color: 'green' };
  };

  const getExpiringMembers = () => members.filter((m) => getMemberStatus(m).status === 'expiring');

  // ── Pending memberships (staff approval queue) ───────────────
  const loadPendingMemberships = async () => {
    if (!gymId) return;
    let query = supabase
      .from('pending_memberships')
      .select('*')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });
    if (adminRole === 'staff' && adminEmail) {
      query = query.eq('submitted_by_email', adminEmail);
    }
    const { data } = await query;
    setPendingMemberships(data || []);
  };

  useEffect(() => {
    if (gymId && isAdminLoggedIn && (adminRole === 'admin' || (adminRole === 'staff' && adminEmail))) loadPendingMemberships();
  }, [gymId, isAdminLoggedIn, adminRole, adminEmail]); // eslint-disable-line

  const submitPendingMembership = async (type, formData, memberName, memberId = null) => {
    if (!gymId) throw new Error('No gym loaded');
    const { data, error } = await supabase
      .from('pending_memberships')
      .insert([{
        gym_id: gymId,
        type,
        member_id: memberId,
        member_name: memberName,
        form_data: formData,
        submitted_by_name: adminName,
        submitted_by_email: adminEmail,
        status: 'pending',
      }])
      .select()
      .single();
    if (error) throw error;

    // Telegram notification to admin
    if (settings.telegramBotToken && settings.telegramChatId) {
      const label = type === 'new_member' ? 'New Member Registration' : 'Membership Renewal';
      const msg = `📋 <b>Staff Approval Required</b>\n\n<b>${label}</b>\nMember: <b>${memberName}</b>\nSubmitted by: ${adminName}\nGym: ${settings.gymName}\n\n⏳ Awaiting your approval in the admin portal.`;
      fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: settings.telegramChatId, text: msg, parse_mode: 'HTML' }),
      }).catch(() => {});
    }

    // Email notification to admin
    if (currentGym?.owner_email) {
      const { sendStaffSubmissionAlert } = await import('../lib/email');
      sendStaffSubmissionAlert({
        adminEmail: currentGym.owner_email,
        gymName: settings.gymName,
        gymLogoUrl: settings.gymLogoUrl || null,
        staffName: adminName,
        type,
        memberName,
      }).catch(() => {});
    }

    await logAction(
      type === 'new_member' ? 'PENDING_NEW_MEMBER' : 'PENDING_RENEWAL',
      `${adminName} submitted ${type === 'new_member' ? 'new member' : 'renewal'} for approval: ${memberName}`,
      memberName,
      memberId,
    );
    return data;
  };

  const approvePendingMembership = async (pendingId) => {
    const pending = pendingMemberships.find((p) => p.id === pendingId);
    if (!pending) throw new Error('Pending record not found');

    let resolvedMemberId = pending.member_id;
    if (pending.type === 'new_member') {
      const newMember = await addMember(pending.form_data);
      resolvedMemberId = newMember?.id || null;
    } else {
      const { membershipType, paymentMethod, durationDays } = pending.form_data;
      await renewMember(pending.member_id, membershipType, paymentMethod || 'cash', durationDays);
    }

    await supabase.from('pending_memberships').update({
      status: 'approved',
      reviewed_by: adminName,
      reviewed_at: new Date().toISOString(),
    }).eq('id', pendingId);

    setPendingMemberships((prev) => prev.map((p) => p.id === pendingId ? { ...p, status: 'approved' } : p));

    await logAction('PENDING_APPROVED', `Approved ${pending.type === 'new_member' ? 'new member' : 'renewal'}: ${pending.member_name}`, pending.member_name, resolvedMemberId);
  };

  const rejectPendingMembership = async (pendingId, notes) => {
    const pending = pendingMemberships.find((p) => p.id === pendingId);
    if (!pending) throw new Error('Pending record not found');

    await supabase.from('pending_memberships').update({
      status: 'rejected',
      admin_notes: notes || '',
      reviewed_by: adminName,
      reviewed_at: new Date().toISOString(),
    }).eq('id', pendingId);

    setPendingMemberships((prev) => prev.map((p) => p.id === pendingId ? { ...p, status: 'rejected', admin_notes: notes } : p));

    await logAction('PENDING_REJECTED', `Rejected ${pending.type === 'new_member' ? 'new member' : 'renewal'}: ${pending.member_name}`, pending.member_name, pending.member_id);
  };

  // ── Admin login — verifies access to this gym ────────────────
  const adminLogin = async (identifier, password) => {
    if (!gymId) throw new Error('No gym loaded');

    let email = identifier.trim().toLowerCase();

    // If no @, treat as username — look up the email from gym_admins
    if (!email.includes('@')) {
      const { data: adminRow, error: uErr } = await supabase
        .from('gym_admins')
        .select('email, user_id')
        .eq('gym_id', gymId)
        .eq('username', email)
        .maybeSingle();
      if (uErr || !adminRow) throw new Error('Username not found for this gym.');
      // Use the stored email; if missing fall back to a clear error
      if (!adminRow.email) throw new Error('No email linked to this username. Please contact your admin.');
      email = adminRow.email.trim().toLowerCase();
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Incorrect password for this account.');

    // Verify this user has access to this specific gym
    const { data: gymAdmin, error: gaErr } = await supabase
      .from('gym_admins')
      .select('id')
      .eq('gym_id', gymId)
      .eq('user_id', authData.user.id)
      .single();

    if (gaErr || !gymAdmin) {
      await supabase.auth.signOut();
      throw new Error('You do not have access to this gym.');
    }
  };

  const adminLogout = async () => { await supabase.auth.signOut(); };

  const pendingRenewals = renewalRequests.filter((r) => r.status === 'pending');

  return (
    <GymContext.Provider value={{
      // Gym resolution
      currentGym, gymId, gymSlug, gymLoading, gymNotFound, gymSuspended, loadGymBySlug,
      // Members
      members, loading,
      addMember, updateMember, deleteMember, getMemberById, findMembers,
      getMemberStatus, getExpiringMembers,
      refreshMembers: loadMembers,
      // Auth
      authLoading, isAdminLoggedIn, adminLogin, adminLogout, logAction,
      adminRole, adminName, adminEmail,
      isAdmin: isAdminLoggedIn && adminRole === 'admin',
      isStaff: isAdminLoggedIn && adminRole === 'staff',
      // Staff approval queue
      pendingMemberships, loadPendingMemberships,
      submitPendingMembership, approvePendingMembership, rejectPendingMembership,
      // Settings
      settings, saveSettings, recordBackup,
      // Renewal requests
      renewalRequests, pendingRenewals, loadRenewalRequests,
      submitRenewalRequest, approveRenewalRequest, rejectRenewalRequest,
      // Instructors
      instructors, addInstructor, updateInstructor, deleteInstructor, toggleInstructor,
      // Constants
      MEMBERSHIP_OPTIONS, renewMember,
    }}>
      {children}
    </GymContext.Provider>
  );
}

export const useGym = () => useContext(GymContext);
