import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  Bike,
  Navigation,
  XCircle,
  MapPin,
  Store,
  User,
  Phone,
  MessageCircle,
  ArrowLeft,
  AlertCircle,
  Receipt,
  RefreshCw,
  Building2,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../../components/common/Navbar';

export const OrderTracking = () => {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [delivery, setDelivery] = useState(null);
  const [canteen, setCanteen] = useState(null);
  const [runner, setRunner] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchRunnerProfile = useCallback(async (runnerId) => {
    if (!runnerId) {
      setRunner(null);
      return;
    }
    try {
      const { data: runnerData, error: runnerErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', runnerId)
        .maybeSingle();

      if (!runnerErr && runnerData) {
        setRunner(runnerData);
      }
    } catch (err) {
      console.error('Gagal mengambil data runner:', err);
    }
  }, []);

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError(null);

      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderErr) throw orderErr;
      setOrder(orderData);

      const { data: itemsData, error: itemsErr } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (!itemsErr) {
        setOrderItems(itemsData || []);
      }

      let activeRunnerId = orderData.runner_id || null;
      try {
        const { data: deliveryData, error: deliveryErr } = await supabase
          .from('deliveries')
          .select('*')
          .eq('order_id', orderId)
          .maybeSingle();

        if (!deliveryErr && deliveryData) {
          setDelivery(deliveryData);
          if (deliveryData.runner_id) {
            activeRunnerId = deliveryData.runner_id;
          }
        }
      } catch (delErr) {
        console.warn('Tabel deliveries belum tersedia:', delErr);
      }

      if (activeRunnerId) {
        await fetchRunnerProfile(activeRunnerId);
      } else {
        setRunner(null);
      }

      if (orderData.canteen_id) {
        const { data: canteenData } = await supabase
          .from('canteens')
          .select('*')
          .eq('id', orderData.canteen_id)
          .maybeSingle();

        if (canteenData) {
          setCanteen(canteenData);
        }
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Pesanan tidak ditemukan atau terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  }, [orderId, fetchRunnerProfile]);

  useEffect(() => {
    fetchOrderDetails();

    if (!orderId) return;

    const channel = supabase
      .channel(`public:orders:${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder((prev) => ({ ...prev, ...payload.new }));
          if (payload.new.runner_id) {
            fetchRunnerProfile(payload.new.runner_id);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deliveries', filter: `order_id=eq.${orderId}` },
        (payload) => {
          if (payload.new) {
            setDelivery(payload.new);
            if (payload.new.runner_id) {
              fetchRunnerProfile(payload.new.runner_id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, fetchOrderDetails, fetchRunnerProfile]);

  const handleCancelOrder = async () => {
    if (!orderId || !window.confirm('Yakin ingin membatalkan pesanan ini?')) return;

    try {
      setCancelling(true);
      const { error: cancelErr } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (cancelErr) throw cancelErr;

      setOrder((prev) => ({ ...prev, status: 'cancelled' }));
      alert('Pesanan berhasil dibatalkan.');
    } catch (err) {
      console.error('Gagal membatalkan pesanan:', err);
      alert('Gagal membatalkan pesanan: ' + err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F4F9]">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-32">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0A2E6E] border-t-transparent" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Memuat status pesanan...</p>
        </div>
      </div>
    );
  }

  const orderType = order?.order_type || 'delivery';
  const status = order?.status || 'cooking';
  const isDelivery = orderType === 'delivery';

  // Format ID
  const displayId = orderId ? `#Gocan-${orderId.substring(0, 5).toUpperCase()}` : '#Gocan-82419';
  const canteenName = canteen?.name || 'Kantin Brazil';

  return (
    <div className="min-h-screen bg-[#F0F4F9] text-slate-800 pb-20">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Top Hero Banner matching mockup: Deep Navy #0A2E6E */}
        <div className="bg-[#0A2E6E] text-white rounded-3xl p-6 sm:p-8 relative shadow-lg overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-blue-200 tracking-wider uppercase mb-1">
                ID PESANAN {displayId}
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {status === 'completed'
                  ? 'Pesanan Telah Tiba & Selesai'
                  : status === 'cancelled'
                  ? 'Pesanan Dibatalkan'
                  : 'Pesanan sedang menuju titik temu'}
              </h1>
              <p className="text-sm text-blue-100 mt-1">
                Estimasi Tiba: 12:15 WIB (15 Menit Lagi)
              </p>
            </div>

            <div className="self-start sm:self-center">
              <span className="bg-[#F59E0B] text-slate-900 font-bold px-4 py-1.5 rounded-full text-xs tracking-wider uppercase shadow-sm">
                {status === 'completed' ? 'SELESAI' : status === 'cancelled' ? 'BATAL' : 'PROSES'}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Grid matching mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Stepper Lacak Perjalanan */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-400 tracking-wider uppercase">
                LACAK PERJALANAN PESANAN
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau progres pesanan secara real-time dari konfirmasi kantin sampai tiba di titik temu.
              </p>
            </div>

            {/* Stepper Timeline matching mockup */}
            <div className="relative pl-6 border-l-2 border-emerald-500 space-y-8 ml-3">
              {/* Step 1: Pesanan Dikonfirmasi Kantin (Green Check) */}
              <div className="relative">
                <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-white shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pesanan Dikonfirmasi Kantin
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    12.01 WIB • {canteenName} menyiapkan makanan Anda
                  </p>
                </div>
              </div>

              {/* Step 2: Kurir Menuju Gedungmu (Amber Dot active) */}
              <div className="relative">
                <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-[#F59E0B] text-white flex items-center justify-center ring-4 ring-white shadow-sm">
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0A2E6E]">
                    Kurir Mahasiswa Menuju Gedungmu
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    12.08 WIB • Kurir sedang naik tangga Benedictus
                  </p>
                </div>
              </div>

              {/* Step 3: Pesanan Sampai di Titik Temu (Gray) */}
              <div className="relative">
                <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center ring-4 ring-white">
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-500">
                    Pesanan Sampai di Titik Temu
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Estimasi 12.15 WIB
                  </p>
                </div>
              </div>
            </div>

            {/* Rincian Menu Pesanan */}
            {orderItems.length > 0 && (
              <div className="pt-6 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">
                  RINCIAN MENU
                </p>
                <div className="space-y-2 text-sm text-slate-700">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-1">
                      <span className="font-medium">
                        {item.quantity}x {item.menu_name || 'Menu'}
                      </span>
                      <span className="font-bold text-slate-800">
                        Rp {((Number(item.price) || 0) * (item.quantity || 1)).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Info Kurir, Alamat, E-ticket */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. INFO KURIR MAHASISWA */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                INFO KURIR MAHASISWA
              </h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                    alt="Kurir"
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      {runner?.full_name || 'Budi Santoso'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Fakultas Teknik • Kurir Gocan Resmi
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="tel:08123456789"
                    className="w-10 h-10 rounded-full bg-blue-50 text-[#0A2E6E] flex items-center justify-center hover:bg-blue-100 transition"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <a
                    href="https://wa.me/628123456789"
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* 2. ALAMAT TUJUAN */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                ALAMAT TUJUAN
              </h2>
              <h3 className="text-base font-bold text-slate-900">
                {delivery?.building_name || 'Gedung Benedictus, Lt. 3'}
              </h3>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">
                  Titik Temu: {delivery?.meeting_point || 'Lobby Depan Lift Lt. 3'}
                </p>
                <p className="text-slate-500">
                  Catatan: {delivery?.runner_notes || 'Tolong taruh di meja lobby jika belum sampai kelas'}
                </p>
              </div>
            </div>

            {/* 3. E-TICKET PENGAMBILAN */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  E-TICKET PENGAMBILAN
                </h2>
                <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  SIAP DIAMBIL
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">NO. PESANAN</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{displayId}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">KANTIN</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{canteenName}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-2">
                <div className="w-28 h-28 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center shrink-0">
                  <QrCode className="w-20 h-20 text-slate-800" />
                </div>
                <div className="text-xs text-slate-500 space-y-1.5">
                  <p className="font-bold text-slate-800">Scan QR untuk verifikasi pickup</p>
                  <p>Jadwal Pickup: <strong className="text-slate-700">Hari ini • 12:15 WIB</strong></p>
                  <p>Lokasi Pickup: <strong className="text-slate-700">{canteenName}</strong></p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-[11px] text-slate-500">
                <span className="font-bold text-[#0A2E6E] block mb-0.5">INSTRUKSI VERIFIKASI</span>
                Tunjukkan QR ini ke petugas kantin saat pickup. Pastikan nomor pesanan dan nama pemesan cocok sebelum pesanan diserahkan.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderTracking;
