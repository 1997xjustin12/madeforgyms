export default function GymLogo({ size = 120, className = '' }) {
  return (
    <img
      src="/gym-logo.png"
      alt="Power Fitness Gym Logo"
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
      className={className}
    />
  );
}
