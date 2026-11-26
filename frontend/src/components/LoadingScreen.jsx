import BrandLogo from './common/BrandLogo';
import './LoadingScreen.css';

export default function LoadingScreen({
  fullScreen = false,
  message = 'Menyiapkan sajian kampus...',
  className = '',
}) {
  return (
    <div
      className={`gocan-loading-screen ${fullScreen ? 'gocan-loading-screen-full' : 'gocan-loading-screen-section'} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="gocan-loading-mark" aria-hidden="true">
        <span className="gocan-loading-ring gocan-loading-ring-red" />
        <span className="gocan-loading-ring gocan-loading-ring-yellow" />
        <BrandLogo className="gocan-loading-logo" />
      </div>
      <p className="gocan-loading-message">{message}</p>
    </div>
  );
}
