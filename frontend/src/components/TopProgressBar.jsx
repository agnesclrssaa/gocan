import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './LoadingScreen.css';

export default function TopProgressBar() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const finishRef = useRef(null);
  const previousKeyRef = useRef(location.key);

  const clearTimers = useCallback(() => {
    window.clearInterval(intervalRef.current);
    window.clearTimeout(finishRef.current);
  }, []);

  const start = useCallback(() => {
    clearTimers();
    setVisible(true);
    setProgress(8);
    intervalRef.current = window.setInterval(() => {
      setProgress((current) => Math.min(current + Math.max(1, (90 - current) / 12), 90));
    }, 140);
    finishRef.current = window.setTimeout(() => {
      clearTimers();
      setProgress(100);
      finishRef.current = window.setTimeout(() => setVisible(false), 250);
    }, 7000);
  }, [clearTimers]);

  useEffect(() => {
    const handleClick = (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!link || link.target && link.target !== '_self' || link.hasAttribute('download')) return;

      const destination = new URL(link.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        (destination.pathname === location.pathname &&
          destination.search === location.search &&
          destination.hash === location.hash)
      ) return;

      start();
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [location.hash, location.pathname, location.search, start]);

  useEffect(() => {
    if (previousKeyRef.current === location.key) return;
    previousKeyRef.current = location.key;
    clearTimers();
    setVisible(true);
    setProgress(100);
    finishRef.current = window.setTimeout(() => setVisible(false), 250);
  }, [clearTimers, location.key]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return (
    <div
      className={`gocan-top-progress${visible ? ' is-visible' : ''}`}
      role="progressbar"
      aria-label="Memuat halaman"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      aria-hidden={!visible}
    >
      <span className="gocan-top-progress-track" style={{ transform: `scaleX(${progress / 100})` }} />
      <span className="gocan-top-progress-accent" />
    </div>
  );
}
