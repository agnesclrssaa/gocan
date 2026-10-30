import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Store,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShoppingBag,
  RefreshCw,
  Star,
  MapPin,
  ChevronRight,
  Camera,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';

export const History = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');

  const fetchOrders = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('orders')
        .select('*, canteens(name, location), order_items(*)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setOrders(data || []);
    } catch (err) {
      console.error('Gagal mengambil riwayat pesanan:', err);
      setError(err.message || 'Gagal memuat riwayat pesanan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    if (!user) return;

    const channel = supabase
      .channel(`user_orders_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Active ongoing orders vs completed history
  const activeOrders = orders.filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled'
  );
  const pastOrders = orders.filter(
    (o) => o.status === 'completed' || o.status === 'cancelled'
  );

  return (
    <div className="min-h-screen bg-[#F0F4F9] text-slate-800 pb-20">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (4 cols): User Profile & Rating Card */}
          <div className="lg:col-span-4 space-y-5">
            {/* Profile info card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {user?.user_metadata?.full_name || 'Anastasya Widjaja'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    NRP: 5103021044 • Widya Mandala
                  </p>
                  <span className="inline-block mt-2 bg-[#0A2E6E] text-white text-[11px] font-bold px-3 py-0.5 rounded-full">
                    MEMBER EMERALD
                  </span>
                </div>
              </div>

              {/* Gedung Favorit */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100 transition">
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="text-[#DC2626]">❤️</span>
                  <span className="font-medium">Gedung Favorit:</span>
                  <strong className="text-slate-900">Gedung Benedictus</strong>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* Ulasan Customer */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Ulasan Customer</h3>
                    <p className="text-[11px] text-slate-400">Ringkasan dari 24 ulasan</p>
                  </div>
                  <button className="bg-[#0A2E6E] text-white text-xs font-bold px-3 py-1 rounded-full">
                    Lihat Semua
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-200">
                    <p className="text-[10px] text-slate-400">Makanan</p>
                    <p className="text-base font-bold text-slate-800">4.8</p>
                    <div className="flex justify-center text-amber-400 text-[10px]">★★★★★</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-200">
                    <p className="text-[10px] text-slate-400">Kantin</p>
                    <p className="text-base font-bold text-slate-800">4.6</p>
                    <div className="flex justify-center text-amber-400 text-[10px]">★★★★☆</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-200">
                    <p className="text-[10px] text-slate-400">Delivery</p>
                    <p className="text-base font-bold text-slate-800">4.9</p>
                    <div className="flex justify-center text-amber-400 text-[10px]">★★★★★</div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="font-bold text-slate-700">Ulasan terbaru</span>
                    <span className="text-amber-400">★★★★★</span>
                  </div>
                  <p className="text-slate-500 italic">
                    "Siomay campur-nya enak, kantin ramah, dan kurir sampai tepat waktu."
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (8 cols): Ongoing & Riwayat Orders */}
          <div className="lg:col-span-8 space-y-6">
            {/* PESANAN SEDANG BERJALAN */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                PESANAN SEDANG BERJALAN
              </h2>

              {activeOrders.length > 0 ? (
                activeOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-bold text-base text-slate-900">
                          {ord.canteens?.name || 'Kantin Pak Brazil'}
                        </h3>
                        <span className="bg-[#F59E0B] text-slate-900 font-bold px-2.5 py-0.5 rounded-md text-xs">
                          DIANTAR
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {ord.order_items?.length || 1} menu • Rp {(ord.total_payment || 18000).toLocaleString('id-ID')} • Online Pay
                      </p>
                      <p className="text-xs text-slate-600 mt-2 font-medium">
                        Kurir: Budi Santoso
                      </p>
                    </div>

                    <Link
                      to={`/order/${ord.id}`}
                      className="text-sm font-bold text-[#0A2E6E] hover:underline self-start sm:self-center"
                    >
                      Lacak Live Status →
                    </Link>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-base text-slate-900">
                        Kantin Pak Brazil
                      </h3>
                      <span className="bg-[#F59E0B] text-slate-900 font-bold px-2.5 py-0.5 rounded-md text-xs">
                        DIANTAR
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      1 menu • Rp 18.000 • Online Pay
                    </p>
                    <p className="text-xs text-slate-600 mt-2 font-medium">
                      Kurir: Budi Santoso
                    </p>
                  </div>

                  <Link
                    to="/order/demo"
                    className="text-sm font-bold text-[#0A2E6E] hover:underline self-start sm:self-center"
                  >
                    Lacak Live Status →
                  </Link>
                </div>
              )}
            </div>

            {/* RIWAYAT PESANAN */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                RIWAYAT PESANAN
              </h2>

              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Kantin Anak Kampung</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Es Thai Tea + Siomay Campur • 14 Okt 2026 • Selesai
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-[#DC2626]">Rp 20.000</span>
                    <Link
                      to="/"
                      className="bg-[#0A2E6E] hover:bg-[#071E4A] text-white text-xs font-bold px-4 py-2 rounded-full transition"
                    >
                      Pesan Lagi
                    </Link>
                  </div>
                </div>

                {/* Ulasanmu Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Ulasanmu</h4>
                      <p className="text-[11px] text-slate-400">Pesanan selesai • 14 Okt 2026</p>
                    </div>
                    <button className="bg-[#0A2E6E] text-white text-xs font-bold px-4 py-1.5 rounded-full">
                      Beri Ulasan
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                      <p className="text-[11px] text-slate-400">Makanan</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">5/5</p>
                      <div className="text-amber-400 text-xs">★★★★★</div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                      <p className="text-[11px] text-slate-400">Kantin</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">4/5</p>
                      <div className="text-amber-400 text-xs">★★★★☆</div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                      <p className="text-[11px] text-slate-400">Delivery</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">5/5</p>
                      <div className="text-amber-400 text-xs">★★★★★</div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Komentar</label>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Tulis komentar untuk makanan, kantin, dan delivery..."
                      className="w-full bg-slate-50 rounded-2xl p-3 text-xs text-slate-800 border border-slate-200 outline-none focus:border-[#0A2E6E] resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Unggah foto opsional</p>
                      <p className="text-[11px] text-slate-400">PNG atau JPG, maks. 10 MB</p>
                    </div>
                    <button className="bg-white border border-slate-200 text-xs font-bold text-slate-700 px-4 py-1.5 rounded-full hover:bg-slate-50">
                      Pilih Foto
                    </button>
                  </div>
                </div>

                {/* Ringkasan ulasan yang sudah dikirim */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Ringkasan ulasan yang sudah dikirim</span>
                    <span className="text-slate-400">2 ulasan</span>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">14 Okt 2026</span>
                      <span className="text-amber-400">★★★★★</span>
                    </div>
                    <p className="text-slate-500 italic">
                      "Makanannya sampai cepet banget sebelum jam kelas selesai. Makasih kurir!"
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">09 Okt 2026</span>
                      <span className="text-amber-400">★★★★☆</span>
                    </div>
                    <p className="text-slate-500 italic">
                      "Porsi pas, rasa enak, dan kurir ramah saat antar ke gedung."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default History;
