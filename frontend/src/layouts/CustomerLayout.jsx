import { Outlet } from 'react-router-dom';
import './CustomerLayout.css';

const decorations = [
  { shape: 'blob', color: 'red', top: 21, left: 15, size: 'clamp(110px, 14vw, 190px)', radius: '62% 38% 53% 47% / 43% 46% 54% 57%' },
  { shape: 'ring', color: 'yellow', top: 20, left: 85, size: 'clamp(90px, 11vw, 150px)' },
  { shape: 'star', color: 'blue', top: 34, left: 31, size: '26px', animated: true, delay: '0.4s', duration: '4.2s' },
  { shape: 'dot', color: 'red', top: 45, left: 7, size: '9px' },
  { shape: 'arc', color: 'blue', top: 51, left: 88, size: 'clamp(95px, 11vw, 145px)', animated: true, delay: '1.8s', duration: '9s', direction: 'reverse' },
  { shape: 'blob', color: 'blue', top: 83, left: 85, size: 'clamp(130px, 17vw, 230px)', radius: '42% 58% 39% 61% / 56% 43% 57% 44%' },
  { shape: 'ring', color: 'blue', top: 51, left: 12, size: 'clamp(120px, 16vw, 210px)' },
  { shape: 'star', color: 'yellow', top: 42, left: 40, size: '22px' },
  { shape: 'sparkle', color: 'yellow', top: 36, left: 68, size: '22px', animated: true, delay: '1.1s', duration: '3.4s', direction: 'reverse' },
  { shape: 'ring', color: 'red', top: 84, left: 22, size: 'clamp(100px, 13vw, 170px)' },
  { shape: 'star', color: 'blue', top: 61, left: 35, size: '22px', animated: true, delay: '2.1s', duration: '4.8s', direction: 'reverse' },
  { shape: 'dot', color: 'blue', top: 30, left: 94, size: '8px', animated: true, delay: '0.8s', duration: '3.2s' },
  { shape: 'star', color: 'yellow', top: 63, left: 68, size: '24px', animated: true, delay: '1.5s', duration: '4.5s' },
  { shape: 'arc', color: 'red', top: 69, left: 7, size: 'clamp(65px, 7vw, 85px)' },
  { shape: 'star', color: 'red', top: 76, left: 38, size: '20px', animated: true, delay: '1.5s', duration: '4.5s' },
  { shape: 'sparkle', color: 'blue', top: 95, left: 45, size: '18px' },
  { shape: 'sparkle', color: 'blue', top: 44, left: 70, size: '18px' },
  { shape: 'sparkle', color: 'red', top: 55, left: 45, size: '16px' },
  { shape: 'star', color: 'yellow', top: 35, left: 30, size: '18px' },
  { shape: 'blob', color: 'cream', top: 28, left: 68, size: 'clamp(54px, 6vw, 75px)', radius: '55% 45% 36% 64% / 42% 58% 39% 61%' },
  { shape: 'star', color: 'yellow', top: 75, left: 31, size: '20px' },
  { shape: 'dot', color: 'yellow', top: 76, left: 7, size: '9px' },
  { shape: 'sparkle', color: 'yellow', top: 66, left: 92, size: '18px', animated: true, delay: '2.6s', duration: '3.5s', direction: 'reverse' },
];

function CustomerBackgroundDecoration() {
  return (
    <div className="customer-background-decoration" aria-hidden="true">
      {decorations.map(({ shape, color, top, left, size, radius, delay, duration, direction }, index) => (
        <span
          key={`${shape}-${color}-${top}-${index}`}
          className={`customer-background-shape customer-background-${shape} customer-background-${color} customer-background-animated`}
          style={{
            '--customer-background-top': `${top}%`,
            '--customer-background-left': `${left}%`,
            '--customer-background-size': size,
            borderRadius: radius,
            '--customer-animation-delay': delay || `${(index * 0.43) % 4.7}s`,
            '--customer-animation-duration': duration || `${6.5 + ((index * 1.37) % 4.8)}s`,
            '--customer-animation-direction': direction || (index % 2 ? 'reverse' : 'normal'),
          }}
        />
      ))}
    </div>
  );
}

export default function CustomerLayout({ children }) {
  return (
    <div className="customer-layout">
      <CustomerBackgroundDecoration />
      <div className="customer-layout-content">
        {children || <Outlet />}
      </div>
    </div>
  );
}
