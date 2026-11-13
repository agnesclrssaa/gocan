import { Outlet } from 'react-router-dom';
import './CustomerLayout.css';

const decorations = [
  { shape: 'blob', color: 'red', top: 4, left: 12, size: 'clamp(190px, 25vw, 340px)', radius: '62% 38% 53% 47% / 43% 46% 54% 57%' },
  { shape: 'ring', color: 'yellow', top: 11, left: 83, size: 'clamp(76px, 10vw, 130px)' },
  { shape: 'star', color: 'blue', top: 18, left: 38, size: '32px', animated: true, delay: '0.4s', duration: '4.2s' },
  { shape: 'dot', color: 'red', top: 23, left: 64, size: '9px' },
  { shape: 'arc', color: 'blue', top: 29, left: 26, size: 'clamp(130px, 18vw, 230px)', animated: true, delay: '1.8s', duration: '9s', direction: 'reverse' },
  { shape: 'blob', color: 'blue', top: 35, left: 89, size: 'clamp(165px, 22vw, 300px)', radius: '42% 58% 39% 61% / 56% 43% 57% 44%' },
  { shape: 'ring', color: 'red', top: 40, left: 61, size: 'clamp(78px, 10vw, 132px)' },
  { shape: 'star', color: 'yellow', top: 43, left: 17, size: '22px' },
  { shape: 'sparkle', color: 'yellow', top: 48, left: 74, size: '25px', animated: true, delay: '1.1s', duration: '3.4s', direction: 'reverse' },
  { shape: 'ring', color: 'red', top: 53, left: 36, size: 'clamp(96px, 13vw, 170px)' },
  { shape: 'star', color: 'blue', top: 58, left: 91, size: '25px', animated: true, delay: '2.1s', duration: '4.8s', direction: 'reverse' },
  { shape: 'dot', color: 'blue', top: 61, left: 49, size: '8px', animated: true, delay: '0.8s', duration: '3.2s' },
  { shape: 'blob', color: 'yellow', top: 65, left: 58, size: 'clamp(175px, 23vw, 310px)', radius: '47% 53% 64% 36% / 57% 39% 61% 43%' },
  { shape: 'arc', color: 'red', top: 70, left: 13, size: 'clamp(125px, 17vw, 220px)' },
  { shape: 'star', color: 'red', top: 75, left: 78, size: '29px', animated: true, delay: '1.5s', duration: '4.5s' },
  { shape: 'ring', color: 'blue', top: 79, left: 29, size: 'clamp(82px, 11vw, 145px)' },
  { shape: 'sparkle', color: 'blue', top: 83, left: 60, size: '22px' },
  { shape: 'sparkle', color: 'red', top: 87, left: 9, size: '18px' },
  { shape: 'ring', color: 'yellow', top: 90, left: 73, size: 'clamp(72px, 9vw, 122px)' },
  { shape: 'blob', color: 'cream', top: 93, left: 45, size: 'clamp(150px, 20vw, 260px)', radius: '55% 45% 36% 64% / 42% 58% 39% 61%' },
  { shape: 'star', color: 'yellow', top: 95, left: 93, size: '20px' },
  { shape: 'dot', color: 'yellow', top: 97, left: 22, size: '10px' },
  { shape: 'arc', color: 'yellow', top: 98, left: 87, size: 'clamp(120px, 16vw, 210px)', animated: true, delay: '2.6s', duration: '9.5s', direction: 'reverse' },
];

function CustomerBackgroundDecoration() {
  return (
    <div className="customer-background-decoration" aria-hidden="true">
      {decorations.map(({ shape, color, top, left, size, radius, delay, duration, direction }, index) => (
        <span
          key={`${shape}-${color}-${top}-${index}`}
          className={`customer-background-shape customer-background-${shape} customer-background-${color} customer-background-animated`}
          style={{
            top: `${top}%`,
            left: `${left}%`,
            width: size,
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
