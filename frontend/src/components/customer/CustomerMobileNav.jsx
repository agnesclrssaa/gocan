import { ClipboardList, Home, MessageCircle, Store, UserRound } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './CustomerMobileNav.css';

const baseLinkClass =
  'customer-mobile-nav-link flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[9px] text-slate-500 transition-colors sm:text-[10px]';

export default function CustomerMobileNav() {
  const { profile } = useAuth();
  const location = useLocation();

  if (profile?.role !== 'customer') return null;

  const isOrdersActive = ['/history', '/orders/', '/order/', '/order-success/'].some(
    (route) =>
      location.pathname === route || location.pathname.startsWith(route)
  );
  const isCanteensActive =
    location.pathname === '/canteens' || location.pathname.startsWith('/canteen/');

  const getLinkClass = (isActive) =>
    `${baseLinkClass} ${isActive ? 'is-active' : ''}`;

  return (
    <nav aria-label="Navigasi Customer" className="customer-mobile-nav">
      <Link
        to="/"
        aria-current={location.pathname === '/' ? 'page' : undefined}
        className={getLinkClass(location.pathname === '/')}
      >
        <Home aria-hidden="true" className="h-5 w-5" />
        <span>Beranda</span>
      </Link>
      <Link
        to="/history"
        aria-current={isOrdersActive ? 'page' : undefined}
        className={getLinkClass(isOrdersActive)}
      >
        <ClipboardList aria-hidden="true" className="h-5 w-5" />
        <span>Pesanan</span>
      </Link>
      <Link
        to="/chat"
        aria-current={location.pathname.startsWith('/chat') ? 'page' : undefined}
        className={getLinkClass(location.pathname.startsWith('/chat'))}
      >
        <MessageCircle aria-hidden="true" className="h-5 w-5" />
        <span>Chat</span>
      </Link>
      <Link
        to="/canteens"
        aria-current={isCanteensActive ? 'page' : undefined}
        className={getLinkClass(isCanteensActive)}
      >
        <Store aria-hidden="true" className="h-5 w-5" />
        <span>Kantin</span>
      </Link>
      <Link
        to="/profile"
        aria-current={location.pathname === '/profile' ? 'page' : undefined}
        className={getLinkClass(location.pathname === '/profile')}
      >
        <UserRound aria-hidden="true" className="h-5 w-5" />
        <span>Profil</span>
      </Link>
    </nav>
  );
}
