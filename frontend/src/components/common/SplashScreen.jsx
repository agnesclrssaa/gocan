import { useEffect } from 'react';
import './SplashScreen.css';

export default function SplashScreen({ onComplete, onSkip }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3350);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <main className="splash-screen">

      {/* Corner Decorations */}
      <div className="splash-corner splash-red-corner" />
      <div className="splash-corner splash-blue-corner" />
      <div className="splash-yellow-shape" />
      <div className="splash-cream-circle" />

      {/* Decorative Arcs */}
      <div className="splash-arc splash-arc-top" />
      <div className="splash-arc splash-arc-bottom" />

      {/* Animated Stars */}
      <span className="splash-star star-yellow st1" />
      <span className="splash-star star-blue st2" />
      <span className="splash-star star-red st3" />
      <span className="splash-star star-yellow st4" />
      <span className="splash-star star-blue st5" />
      <span className="splash-star star-red st6" />
      <span className="splash-star star-yellow st7" />
      <span className="splash-star star-blue st8" />

      {/* Animated Dots */}
      <span className="splash-dot dot-yellow dt1" />
      <span className="splash-dot dot-blue dt2" />
      <span className="splash-dot dot-red dt3" />
      <span className="splash-dot dot-yellow dt4" />
      <span className="splash-dot dot-blue dt5" />

      {/* Logo and Loading */}
      <div className="splash-center">

        <div className="splash-logo-wrapper">
          <img
            src="/gocan-logo.png"
            alt="GoCan"
            className="splash-logo"
          />
        </div>

        <div className="splash-loader">
          <div className="splash-loader-track">
            <div className="splash-loader-fill" />
          </div>
        </div>

      </div>

      {/* Skip Button */}
      <button
        className="splash-skip"
        onClick={onSkip}
      >
        Skip
      </button>

    </main>
  );
}