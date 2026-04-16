export default function StatusBadge({ status, label, size = 'sm' }) {
  const styles = {
    active: 'bg-green-500/20 text-green-400 border border-green-500/30',
    expiring: 'bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse',
    expired: 'bg-red-500/20 text-red-400 border border-red-500/30',
  };
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  };
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${styles[status] || styles.active} ${sizes[size]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'active' ? 'bg-green-400' : status === 'expiring' ? 'bg-orange-400' : 'bg-red-400'
      }`} />
      {label}
    </span>
  );
}
