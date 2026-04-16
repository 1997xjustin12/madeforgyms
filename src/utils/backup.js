const BACKUP_DATE_KEY = 'gym_last_backup';

export const setLastBackupDate = () => {
  localStorage.setItem(BACKUP_DATE_KEY, new Date().toISOString());
};

export const getLastBackupDate = () => {
  const raw = localStorage.getItem(BACKUP_DATE_KEY);
  return raw ? new Date(raw) : null;
};

export const getDaysSinceBackup = () => {
  const last = getLastBackupDate();
  if (!last) return null;
  const diff = Date.now() - last.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// Export members as a JSON backup file
export const exportJSON = (members) => {
  const backup = {
    exportedAt: new Date().toISOString(),
    gym: 'Power Fitness Gym',
    version: '1.0',
    totalMembers: members.length,
    members: members.map((m) => ({
      name: m.name,
      contactNumber: m.contactNumber,
      photo: m.photo || null,
      membershipType: m.membershipType,
      membershipStartDate: m.membershipStartDate,
      membershipEndDate: m.membershipEndDate,
      notes: m.notes || '',
    })),
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PowerFitnessGym_Backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  setLastBackupDate();
};

// Parse and validate a backup JSON file
export const parseBackupFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.members || !Array.isArray(data.members)) {
          reject(new Error('Invalid backup file format.'));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error('Could not read file. Make sure it is a valid backup JSON file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
};
