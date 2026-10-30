import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Wallet,
  Compass,
  Bike,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Power,
  Bell,
  MapPin,
  User,
  Zap,
  Sparkles,
  LogOut
} from 'lucide-react';

export default function RunnerLayout() {
  const [isOnline, setIsOnline] = useState(true);
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      {/* Ambient Deep Blue & Neon Emerald Glow Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-teal-500/15 rounded-full blur-[120px]" />
      </div>

      {/* Top Header with Glassmorphism */}
      <header className="sticky top-0 z-40 bg-slate-900/75 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Runner Identity & Online Toggle */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                  alt="Budi Santoso"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950 ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-base font-black text-white leading-tight">Budi Santoso</h2>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  NRP 51022
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">UKWMS Dinoyo • Runner</p>
            </div>

            {/* Toggle Status Online / Offline */}
            <button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              className={`ml-1 sm:ml-3 px-3 py-1 rounded-full text-xs font-black tracking-wide border transition flex items-center gap-1.5 shadow-xs ${isOnline
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </button>
          </div>

          {/* Desktop Navigation Pills */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-full border border-white/10 backdrop-blur-md">
            <NavLink
              to="/runner-portal"
              end
              className={({ isActive }) =>
                `px-5 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Dompet & Saldo</span>
            </NavLink>
            <NavLink
              to="/runner-portal/orders"
              className={({ isActive }) =>
                `px-5 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Job Board Antar Gedung</span>
            </NavLink>
            <NavLink
              to="/runner-portal/detail"
              className={({ isActive }) =>
                `px-5 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Proses Antar Aktif</span>
            </NavLink>
          </div>

          {/* Back to Customer Web & Logout */}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-300 transition px-3 py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Web Pemesan</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-950/40 border border-white/10 hover:border-rose-800/50 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Outlet Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-28 md:pb-12 relative z-10">
        <Outlet context={{ isOnline, setIsOnline }} />
      </main>

      {/* Mobile Floating Bottom Dock (Antigravity Floating Navigation Bar) */}
      <div className="md:hidden fixed bottom-4 inset-x-4 z-40 flex justify-center pointer-events-none">
        <nav className="pointer-events-auto glass-card-dark rounded-full px-5 py-2.5 flex items-center justify-between gap-6 border border-white/20 shadow-2xl shadow-emerald-950/60 backdrop-blur-2xl">
          <NavLink
            to="/runner-portal"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition ${isActive ? 'text-emerald-400 font-black scale-110' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px]">Dompet</span>
          </NavLink>

          <NavLink
            to="/runner-portal/orders"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition relative ${isActive ? 'text-emerald-400 font-black scale-110' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <div className="relative">
              <Compass className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <span className="text-[10px]">Job Board</span>
          </NavLink>

          <NavLink
            to="/runner-portal/detail"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition ${isActive ? 'text-emerald-400 font-black scale-110' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Bike className="w-5 h-5" />
            <span className="text-[10px]">Antar</span>
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 text-rose-400 hover:text-rose-300 transition cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px]">Keluar</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
