import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Star } from 'lucide-react';

const bestSellers = [
  {
    name: 'Kulit Ayam Geprek Pak Brazil',
    price: 'Rp 15.000',
    rating: '4.9',
    orders: '120+ order',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Kulit ayam geprek',
  },
  {
    name: 'Es Thai Tea Anak Kampung',
    price: 'Rp 8.000',
    rating: '4.8',
    orders: '300+ order',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Es Thai tea',
  },
];

export default function MenuPreview() {
  return (
    <main className="min-h-screen bg-[#F0F4F9] px-4 py-8 text-slate-800 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/landing"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0A2E6E] hover:text-[#DC2626]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke halaman awal
        </Link>

        <section className="mt-8 rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:p-10">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">
                PILIHAN FAVORIT
              </span>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-[#0A2E6E] sm:text-4xl">
                Best Seller Kampus 🔥
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
                Intip beberapa menu favorit mahasiswa. Masuk atau daftar untuk melihat menu lengkap dan mulai memesan.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition hover:-translate-y-0.5 hover:bg-[#B91C1C]"
            >
              Masuk untuk pesan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {bestSellers.map((item) => (
              <article
                key={item.name}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
              >
                <div className="h-52 overflow-hidden bg-slate-100">
                  <img
                    src={item.image}
                    alt={item.imageAlt}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <h2 className="font-extrabold text-slate-900">{item.name}</h2>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="font-extrabold text-[#DC2626]">{item.price}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                      {item.rating} ({item.orders})
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-5 text-center text-xs font-medium text-slate-400">
            Ini hanya pratinjau beberapa menu best seller.
          </p>
        </section>
      </div>
    </main>
  );
}
