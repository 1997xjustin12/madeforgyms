import { useGym } from '../context/GymContext';

export default function GymLogo({ size = 120, className = '' }) {
  const { settings } = useGym();
  const src = settings?.gymLogoUrl || '/gym-logo.png';

  return (
    <img
      src={src}
      alt="Gym Logo"
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
      className={className}
    />
  );
}
