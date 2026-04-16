import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';
import { setLastBackupDate } from './backup';

const formatDate = (dateStr) => {
  try { return format(parseISO(dateStr), 'MMM dd, yyyy'); } catch { return dateStr; }
};

const membershipLabel = {
  monthly: '1 Month',
  quarterly: '3 Months',
  'semi-annual': '6 Months',
  annual: '1 Year',
};

const getStatus = (member) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(member.membershipEndDate);
  end.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: 'Expired', days: diff };
  if (diff <= 5) return { label: 'Expiring Soon', days: diff };
  return { label: 'Active', days: diff };
};

export const exportMembersToExcel = (members, filenamePrefix = 'PowerFitnessGym_Members') => {
  const rows = members.map((m, i) => {
    const { label, days } = getStatus(m);
    return {
      '#': i + 1,
      'Full Name': m.name,
      'Contact Number': m.contactNumber,
      'Membership Plan': membershipLabel[m.membershipType] || m.membershipType,
      'Start Date': formatDate(m.membershipStartDate),
      'End Date': formatDate(m.membershipEndDate),
      'Status': label,
      'Days Remaining': days >= 0 ? days : 0,
      'Notes': m.notes || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Column widths
  worksheet['!cols'] = [
    { wch: 5 },   // #
    { wch: 25 },  // Name
    { wch: 18 },  // Contact
    { wch: 18 },  // Plan
    { wch: 15 },  // Start
    { wch: 15 },  // End
    { wch: 16 },  // Status
    { wch: 16 },  // Days Remaining
    { wch: 25 },  // Notes
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');

  // Summary sheet
  const total = members.length;
  const active = members.filter((m) => getStatus(m).label === 'Active').length;
  const expiring = members.filter((m) => getStatus(m).label === 'Expiring Soon').length;
  const expired = members.filter((m) => getStatus(m).label === 'Expired').length;

  const summary = XLSX.utils.aoa_to_sheet([
    ['Power Fitness Gym — Membership Report'],
    ['Generated on', format(new Date(), 'MMM dd, yyyy hh:mm a')],
    [],
    ['Summary'],
    ['Total Members', total],
    ['Active', active],
    ['Expiring Soon (≤5 days)', expiring],
    ['Expired', expired],
  ]);
  summary['!cols'] = [{ wch: 28 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, summary, 'Summary');

  const filename = `${filenamePrefix}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(workbook, filename);
  setLastBackupDate();
};
