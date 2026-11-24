import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Star } from 'lucide-react';
import AssetImage from '../../components/common/AssetImage';

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
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2152B7] hover:text-[#DC2626]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke halaman awal
        </Link>

        <section className="customer-card mt-8 rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:p-10">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">
                PILIHAN FAVORIT
              </span>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-[#2152B7] sm:text-4xl">
                Best Seller Kampus 🔥
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
                Intip beberapa menu favorit Customer. Masuk atau daftar untuk melihat menu lengkap dan mulai memesan.
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

          <div
            className="customer-best-seller-track mt-8"
            role="region"
            aria-label="Menu Best Seller, geser ke samping untuk melihat menu lainnya"
            tabIndex={0}
          >
            {bestSellers.map((item) => (
              <article
                key={item.name}
                className="customer-card customer-menu-card menu-card-hover group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="aspect-[5/4] w-full overflow-hidden bg-slate-100">
                  <AssetImage
                    src={item.image}
                    alt={item.imageAlt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="customer-menu-content flex min-w-0 flex-1 flex-col p-3 sm:p-4">
                  <h2 className="customer-menu-title min-h-[2.5rem] line-clamp-2 text-sm font-extrabold leading-snug text-slate-900 sm:text-base">
                    {item.name}
                  </h2>
                  <div className="mt-auto flex flex-col items-start gap-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="customer-menu-price gocan-price whitespace-nowrap text-xs font-extrabold sm:text-sm">
                      {item.price}
                    </span>
                    <span className="inline-flex max-w-full items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-slate-500 sm:text-xs">
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
