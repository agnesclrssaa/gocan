import { Link } from 'react-router-dom';
import { MapPin, Star, ArrowRight } from 'lucide-react';

export const CanteenCard = ({ canteen }) => {
  const fallbackImage =
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80';

  return (
    <Link
      to={`/canteen/${canteen.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-500/40"
    >
      {/* Canteen Image */}
      <div className="relative h-44 w-full overflow-hidden bg-gray-100">
        <img
          src={canteen.image_url || fallbackImage}
          alt={canteen.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = fallbackImage;
          }}
        />
        {/* Rating Badge: Warm Gold UKWMS */}
        <div className="absolute top-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-amber-700 shadow-sm backdrop-blur-sm flex items-center gap-1 border border-amber-200">
          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          <span>4.8</span>
        </div>

        {/* Functional Badges: Hijau #10B981 (Buka) & Merah #EF4444 (Toko Tutup) */}
        <div className="absolute bottom-3 left-3">
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-extrabold text-white shadow-sm tracking-wide ${
              canteen.is_open ? 'bg-[#10B981]' : 'bg-[#EF4444]'
            }`}
          >
            {canteen.is_open ? 'Buka Sekarang' : 'Tutup'}
          </span>
        </div>
      </div>

      {/* Canteen Info */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition">
            {canteen.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs sm:text-sm text-gray-500 leading-relaxed">
            {canteen.description || 'Pilihan menu lezat dan higienis untuk santapan kampus UKWMS.'}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5 truncate max-w-[70%]">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-orange-500" />
            <span className="truncate">{canteen.location || 'Area Kantin UKWMS'}</span>
          </div>
          <span className="inline-flex items-center gap-1 font-bold text-orange-600 group-hover:text-orange-700 group-hover:translate-x-0.5 transition">
            Lihat Menu <ArrowRight className="h-3 w-3 text-orange-500" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CanteenCard;
