import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RunnerBackgroundDecoration from '../components/common/RunnerBackgroundDecoration';
import {
  Wallet,
  Compass,
  Bike,
  ExternalLink,
  User,
  LogOut
} from 'lucide-react';
import './RunnerTheme.css';

export default function RunnerLayout() {
  const [isOnline, setIsOnline] = useState(true);
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="runner-theme min-h-screen overflow-x-hidden bg-white font-sans text-slate-800 selection:bg-[#2152B7] selection:text-white">
      <RunnerBackgroundDecoration />
      <header className="sticky top-0 z-40 border-b border-[#193F91] bg-[#2152B7] text-white shadow-md shadow-blue-950/15">
        <div className="mx-auto flex min-h-[76px] max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {/* Runner Identity & Online Toggle */}
          <div className="flex items-center gap-3">
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

            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black leading-tight text-white sm:text-base">{profile?.name || 'Campus Runner'}</h2>
                <span className="rounded-md border border-white/30 bg-white/15 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                  NRP {profile?.nrp || 'Runner'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-blue-100">UKWMS Dinoyo • Runner</p>
            </div>

            {/* Toggle Status Online / Offline */}
            <button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              className={`ml-1 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black tracking-wide shadow-xs transition sm:ml-3 ${isOnline
                  ? 'border-white bg-white text-[#2152B7] hover:bg-blue-50'
                  : 'border-blue-300 bg-blue-800 text-white hover:bg-blue-900'
                }`}
            >
              <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-[#2152B7]' : 'bg-slate-400'}`} />
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </button>
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
          </nav>

          {/* Back to Customer Web & Logout */}
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
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
        <Outlet context={{ isOnline, setIsOnline }} />
      </main>

      <div className="pointer-events-none fixed inset-x-3 bottom-3 z-40 flex justify-center lg:hidden">
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

          <Link
            to="/profile"
            className="flex min-w-0 flex-col items-center gap-1 px-1 py-1 text-slate-500 transition hover:text-[#2152B7]"
          >
            <User className="h-5 w-5" />
            <span className="text-[9px] sm:text-[10px]">Profil</span>
          </Link>

          <Link
            to="/"
            className="flex min-w-0 flex-col items-center gap-1 px-1 py-1 text-slate-500 transition hover:text-[#2152B7]"
          >
            <ExternalLink className="h-5 w-5" />
            <span className="text-[9px] sm:text-[10px]">Pemesan</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex min-w-0 flex-col items-center gap-1 px-1 py-1 text-[#C51D24] transition hover:text-red-700"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-[9px] sm:text-[10px]">Keluar</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
