import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';

export default function IntroLoadingScreen() {
  return (
    <div className="relative flex min-h-screen min-h-[100svh] flex-col overflow-hidden bg-[#F8F7F2] font-sans text-slate-900">
      <div className="absolute inset-0">
        <img
          src="/background_landing_page - GoCan.jpeg"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#fffdf8]/95 via-[#fffdf8]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#fffdf8]/85 via-[#fffdf8]/35 to-transparent md:hidden" />
      </div>

      <header className="relative z-10 px-5 pt-5 sm:px-8 sm:pt-7">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/80 bg-white/90 px-5 py-3 shadow-sm sm:rounded-full sm:px-7">
          <Link to="/" aria-label="GoCan - Beranda">
            <BrandLogo className="h-9 w-[4.5rem]" />
          </Link>

          <nav className="flex items-center gap-1.5 sm:gap-3">
            <Link
              to="/menu-preview"
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-[#0A2E6E] sm:inline-flex"
            >
              Menu
            </Link>
            <Link
              to="/login"
              className="rounded-full px-3 py-2 text-sm font-semibold text-[#0A2E6E] transition hover:bg-blue-50 sm:px-4"
            >
              Masuk
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-[#0A2E6E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#082252] sm:px-5"
            >
              Daftar
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-6 py-12 sm:px-10 lg:px-12">
        <section className="max-w-[28rem] pb-8 md:pb-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#DC2626] sm:text-sm">
            GoCan · Kantin UKWMS
          </p>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl">
            <span className="block">Pesan makanan</span>
            <span className="block">di kampus,</span>
            <span className="block">lebih mudah.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-600 sm:text-lg">
            Pilih menu kantin favorit, pesan dari ponsel, lalu nikmati tanpa perlu antre.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-[#DC2626] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#B91C1C]"
            >
              Pesan sekarang
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/menu-preview"
              className="rounded-xl border border-slate-300 bg-white/75 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-white"
            >
              Lihat menu favorit
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
