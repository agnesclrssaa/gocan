import { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRunnerCampusInfo } from '../lib/runnerCampus';
import { api } from '../lib/api';
import RunnerBackgroundDecoration from '../components/common/RunnerBackgroundDecoration';
import {
  Wallet,
  Compass,
  Bike,
  MessageCircle,
  ExternalLink,
  User,
  LogOut
} from 'lucide-react';
import './RunnerTheme.css';

export default function RunnerLayout({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { signOut, profile } = useAuth();
  const campusInfo = getRunnerCampusInfo(profile, profile);
  const campusLabel = campusInfo.name
    ? `${campusInfo.name}${campusInfo.city ? ` · ${campusInfo.city}` : ''}`
    : 'Kampus belum ditetapkan';
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const refreshUnreadCount = async () => {
      try {
        const conversations = await api.get('/chats');
        if (active) {
          setUnreadCount(
            Array.isArray(conversations)
              ? conversations.reduce((total, conversation) => total + (Number(conversation.unreadCount) || 0), 0)
              : 0
          );
        }
      } catch (error) {
        if (active) console.error('Gagal memuat jumlah pesan Runner yang belum dibaca:', error);
      }
    };

    refreshUnreadCount();
    const intervalId = window.setInterval(refreshUnreadCount, 15000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="runner-theme min-h-screen overflow-x-hidden bg-white font-sans text-slate-800 selection:bg-[#2152B7] selection:text-white">
      <RunnerBackgroundDecoration />
      <header className="sticky top-0 z-40 border-b border-[#193F91] bg-[#2152B7] text-white shadow-md shadow-blue-950/15">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-1.5 sm:px-6 lg:min-h-[76px] lg:px-8 lg:py-3">
          {/* Runner Identity & Online Toggle */}
          <div className="runner-header-identity grid w-full min-w-0 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-2 lg:flex lg:w-auto lg:gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-white/25 p-0.5 shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                  alt={profile?.name || 'Campus Runner'}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${isOnline ? 'bg-[#2152B7]' : 'bg-slate-400'
                  }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-nowrap items-baseline gap-x-1.5">
                <h2 className="runner-header-name min-w-0 max-w-[calc(100%-5rem)] flex-initial break-words text-[13px] font-black leading-[1.15] text-white sm:text-base lg:min-w-0 lg:max-w-none lg:flex-1">
                  {profile?.name || 'Campus Runner'}
                </h2>
                <span className="shrink-0 rounded bg-white/15 px-1.5 py-0 text-[9px] font-semibold leading-3 text-white">
                  {profile?.nrp || 'Runner'}
                </span>
              </div>
              <p
                className="flex min-w-0 items-center gap-1 text-[10px] font-medium leading-3 text-blue-100 sm:text-[11px] sm:leading-tight"
              >
                <span className="min-w-0 truncate" title={campusLabel}>{campusLabel}</span>
                <span className="shrink-0">• Runner</span>
              </p>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-1.5 lg:gap-2 lg:justify-start">
              {/* Toggle Status Online / Offline */}
              <button
                type="button"
                onClick={() => setIsOnline(!isOnline)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-black tracking-wide shadow-xs transition sm:px-2.5 lg:px-3 lg:text-xs ${isOnline
                    ? 'border-white bg-white text-[#2152B7] hover:bg-blue-50'
                    : 'border-blue-300 bg-blue-800 text-white hover:bg-blue-900'
                  }`}
              >
                <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-[#2152B7]' : 'bg-slate-400'}`} />
                <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Keluar dari akun Runner"
                title="Keluar dari akun Runner"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/25 text-white transition hover:bg-white/15 lg:hidden"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          <nav aria-label="Navigasi Runner" className="hidden items-center gap-1 rounded-full border border-white/25 bg-blue-950/15 p-1 lg:flex">
            <NavLink
              to="/runner-portal"
              end
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${isActive
                  ? 'bg-white text-[#2152B7] shadow-sm'
                  : 'text-white hover:bg-white/15'
                }`
              }
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Dompet & Saldo</span>
            </NavLink>
            <NavLink
              to="/runner-portal/orders"
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${isActive
                  ? 'bg-white text-[#2152B7] shadow-sm'
                  : 'text-white hover:bg-white/15'
                }`
              }
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Job Board Antar Gedung</span>
            </NavLink>
            <NavLink
              to="/runner-portal/detail"
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${isActive
                  ? 'bg-white text-[#2152B7] shadow-sm'
                  : 'text-white hover:bg-white/15'
                }`
              }
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Proses Antar Aktif</span>
            </NavLink>
            <NavLink
              to="/chat"
              aria-label={`Live Chat${unreadCount ? `, ${unreadCount} pesan belum dibaca` : ''}`}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${isActive
                  ? 'bg-white text-[#2152B7] shadow-sm'
                  : 'text-white hover:bg-white/15'
                }`
              }
            >
              <span className="relative">
                <MessageCircle className="w-3.5 h-3.5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-[#ED2028] px-1 text-center text-[9px] leading-4 text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </span>
              <span>Live Chat</span>
            </NavLink>
          </nav>

          {/* Back to Customer Web & Logout */}
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              to="/runner-portal/profile"
              className="flex items-center gap-1.5 rounded-xl border border-white/25 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/15"
            >
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Profil</span>
            </Link>
            <Link
              to="/"
              className="hidden items-center gap-1.5 rounded-xl border border-transparent px-3 py-1.5 text-xs font-bold text-white transition hover:border-white/25 hover:bg-white/15 sm:flex"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Web Pemesan</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#ED2028] bg-[#ED2028] px-3 py-1.5 text-xs font-bold text-white transition hover:border-red-700 hover:bg-red-700"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Outlet Container */}
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 p-4 pb-28 sm:p-6 lg:p-8 lg:pb-12">
        {children || <Outlet context={{ isOnline, setIsOnline }} />}
      </main>

      <div className="pointer-events-none fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex justify-center lg:hidden">
        <nav aria-label="Navigasi Runner" className="pointer-events-auto flex w-full max-w-xl items-center justify-around gap-1 rounded-2xl border border-[#D6E2F0] bg-white/95 px-2 py-2 shadow-lg backdrop-blur-xl">
          <NavLink
            to="/runner-portal"
            end
            className={({ isActive }) =>
              `flex min-w-0 flex-col items-center gap-1 px-1 py-1 transition ${isActive ? 'font-black text-[#2152B7]' : 'text-slate-500 hover:text-[#2152B7]'
              }`
            }
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[9px] sm:text-[10px]">Dompet</span>
          </NavLink>

          <NavLink
            to="/runner-portal/orders"
            className={({ isActive }) =>
              `relative flex min-w-0 flex-col items-center gap-1 px-1 py-1 transition ${isActive ? 'font-black text-[#2152B7]' : 'text-slate-500 hover:text-[#2152B7]'
              }`
            }
          >
            <Compass className="h-5 w-5" />
            <span className="text-[9px] sm:text-[10px]">Job Board</span>
          </NavLink>

          <NavLink
            to="/runner-portal/detail"
            className={({ isActive }) =>
              `flex min-w-0 flex-col items-center gap-1 px-1 py-1 transition ${isActive ? 'font-black text-[#2152B7]' : 'text-slate-500 hover:text-[#2152B7]'
              }`
            }
          >
            <Bike className="w-5 h-5" />
            <span className="text-[9px] sm:text-[10px]">Antar</span>
          </NavLink>

          <NavLink
            to="/chat"
            aria-label={`Chat${unreadCount ? `, ${unreadCount} pesan belum dibaca` : ''}`}
            className={({ isActive }) =>
              `flex min-w-0 flex-col items-center gap-1 px-1 py-1 transition ${isActive ? 'font-black text-[#2152B7]' : 'text-slate-500 hover:text-[#2152B7]'
              }`
            }
          >
            <span className="relative">
              <MessageCircle className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-1 min-w-4 rounded-full bg-[#ED2028] px-1 text-center text-[9px] leading-4 text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </span>
            <span className="text-[9px] sm:text-[10px]">Chat</span>
          </NavLink>

          <NavLink
            to="/runner-portal/profile"
            className={({ isActive }) =>
              `flex min-w-0 flex-col items-center gap-1 px-1 py-1 transition ${isActive ? 'font-black text-[#2152B7]' : 'text-slate-500 hover:text-[#2152B7]'}`
            }
          >
            <User className="h-5 w-5" />
            <span className="text-[9px] sm:text-[10px]">Profil</span>
          </NavLink>

        </nav>
      </div>
    </div>
  );
}
