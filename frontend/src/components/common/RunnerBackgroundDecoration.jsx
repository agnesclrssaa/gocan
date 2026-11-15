import './RunnerBackgroundDecoration.css';

const decorations = [
  { shape: 'blob', color: 'red', top: 4, left: 14, size: 'clamp(165px, 22vw, 300px)', delay: '0s', duration: '8.4s' },
  { shape: 'ring', color: 'yellow', top: 8, left: 81, size: 'clamp(76px, 10vw, 132px)', delay: '1.2s', duration: '7.3s' },
  { shape: 'sparkle', color: 'blue', top: 14, left: 43, size: '22px', delay: '0.5s', duration: '3.2s' },
  { shape: 'circle', color: 'red', top: 20, left: 68, size: '13px', delay: '1.8s', duration: '4.4s' },
  { shape: 'arc', color: 'blue', top: 26, left: 25, size: 'clamp(125px, 17vw, 225px)', delay: '2.1s', duration: '9.2s' },
  { shape: 'blob', color: 'blue', top: 31, left: 88, size: 'clamp(160px, 21vw, 285px)', delay: '0.8s', duration: '8.8s' },
  { shape: 'geometric', color: 'yellow', top: 36, left: 58, size: '35px', delay: '2.7s', duration: '6.3s' },
  { shape: 'ring', color: 'red', top: 42, left: 15, size: 'clamp(82px, 11vw, 145px)', delay: '1.6s', duration: '7.8s' },
  { shape: 'sparkle', color: 'yellow', top: 47, left: 75, size: '27px', delay: '0.3s', duration: '3.8s' },
  { shape: 'blob', color: 'yellow', top: 52, left: 42, size: 'clamp(135px, 18vw, 245px)', delay: '2.4s', duration: '9.4s' },
  { shape: 'star', color: 'red', top: 57, left: 91, size: '25px', delay: '1.1s', duration: '4.6s' },
  { shape: 'circle', color: 'blue', top: 61, left: 23, size: '10px', delay: '2.9s', duration: '4.1s' },
  { shape: 'blob', color: 'red', top: 66, left: 68, size: 'clamp(145px, 19vw, 260px)', delay: '0.7s', duration: '8.1s' },
  { shape: 'arc', color: 'yellow', top: 70, left: 14, size: 'clamp(120px, 16vw, 215px)', delay: '1.9s', duration: '9.6s' },
  { shape: 'geometric', color: 'blue', top: 75, left: 83, size: '27px', delay: '0.4s', duration: '5.8s' },
  { shape: 'ring', color: 'blue', top: 80, left: 32, size: 'clamp(78px, 11vw, 142px)', delay: '2.6s', duration: '8.5s' },
  { shape: 'sparkle', color: 'red', top: 84, left: 61, size: '19px', delay: '1.4s', duration: '3.5s' },
  { shape: 'circle', color: 'yellow', top: 88, left: 10, size: '12px', delay: '2.2s', duration: '4.8s' },
  { shape: 'ring', color: 'yellow', top: 92, left: 76, size: 'clamp(74px, 9vw, 118px)', delay: '0.9s', duration: '7.6s' },
  { shape: 'blob', color: 'red', top: 96, left: 46, size: 'clamp(150px, 20vw, 270px)', delay: '1.7s', duration: '8.9s' },
];

export default function RunnerBackgroundDecoration() {
  return (
    <div className="runner-background-decoration" aria-hidden="true">
      {decorations.map(({ shape, color, top, left, size, delay, duration }, index) => (
        <span
          key={`${shape}-${color}-${index}`}
          className={`runner-background-shape runner-background-${shape} runner-background-${color}`}
          style={{
            top: `${top}%`,
            left: `${left}%`,
            width: size,
            '--runner-animation-delay': delay,
            '--runner-animation-duration': duration,
          }}
        />
      ))}
    </div>
  );
}
