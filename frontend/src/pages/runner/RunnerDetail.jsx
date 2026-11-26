import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  MapPin,
  ChevronLeft,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  getRunnerActiveOrderId,
  getRunnerCampusInfo,
  getRunnerCampusOrders,
  isRunnerOrderAssignedTo,
  setRunnerActiveOrderId,
} from '../../lib/runnerCampus';
import LoadingScreen from '../../components/LoadingScreen';

export default function RunnerDetail() {
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const runnerUserId = user?.id || profile?.id;
  const stateOrder = state?.order || null;
  const queryOrderId = new URLSearchParams(location.search).get('orderId') || '';
  const initialOrder = stateOrder && (
    !queryOrderId || queryOrderId === String(stateOrder.id)
  ) ? stateOrder : null;
  const [order, setOrder] = useState(initialOrder);
  const [loadingOrder, setLoadingOrder] = useState(!initialOrder);
  const [orderLoadError, setOrderLoadError] = useState('');
  const activeOrderItems = Array.isArray(order?.items) ? order.items : [];
  const campusInfo = getRunnerCampusInfo(profile, user);
  const orderMatchesCampus = Boolean(
    order && getRunnerCampusOrders([order], campusInfo.campusId).length
  );
  const canProcessOrder = campusInfo.isActive && orderMatchesCampus;
  const orderCampusId = String(order?.campusId || order?.campus?.campusId || '');
  const campusMismatch = Boolean(
    !authLoading &&
    !loadingOrder &&
    profile &&
    order &&
    orderCampusId &&
    campusInfo.campusId &&
    orderCampusId !== campusInfo.campusId
  );
  const campusInactive = Boolean(
    !authLoading &&
    !loadingOrder &&
    profile &&
    order &&
    campusInfo.campusId &&
    !campusInfo.isActive &&
    !campusMismatch
  );
  const canteenName = order?.canteen?.name || order?.canteenName || 'Kantin GoCan';
  const pickupLocation = order?.canteen?.location || order?.canteenLocation || order?.pickupLocation || 'Lokasi kantin belum tersedia';
  const customerName = order?.customer?.name || order?.user?.name || order?.customerName || 'Customer';
  const customerId = Number(
    order?.customer?.id ?? order?.customerId ?? order?.user?.id ?? order?.userId
  );
  const destination = [
    order?.buildingName || order?.destinationBuilding || order?.destination_building,
    order?.destinationRoom || order?.destination_room,
    order?.meetingPoint || order?.destinationNote || order?.destination_note,
  ].filter(Boolean).join(' · ') || 'Lokasi tujuan belum tersedia';
  // Step: 1 = Kurir Menerima, 2 = Sampai di Kantin, 3 = Serah Terima (Input PIN), 4 = Selesai
  const [currentStep, setCurrentStep] = useState(() => {
    const status = String(order?.status || '').toLowerCase();
    return status === 'completed' ? 4 : status === 'delivering' ? 3 : 1;
  });
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [pickupQrCode, setPickupQrCode] = useState('');
  const [orderStatus, setOrderStatus] = useState(order?.status || '');
  const [pinError, setPinError] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(
    () => String(order?.status || '').toLowerCase() === 'completed'
  );
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [completionError, setCompletionError] = useState('');
  const [openingCustomerChat, setOpeningCustomerChat] = useState(false);
  const [chatError, setChatError] = useState('');

  const correctPin = '4821';

  useEffect(() => {
    if (initialOrder) {
      setOrder(initialOrder);
      setLoadingOrder(false);
      setOrderLoadError('');
      setRunnerActiveOrderId(initialOrder.id);
      if (queryOrderId !== String(initialOrder.id)) {
        navigate(`/runner-portal/detail?orderId=${encodeURIComponent(initialOrder.id)}`, {
          replace: true,
          state: { order: initialOrder },
        });
      }
      return undefined;
    }

    if (authLoading || !profile || !runnerUserId) return undefined;

    let active = true;
    setLoadingOrder(true);
    setOrderLoadError('');
    const requestedOrderId = queryOrderId || getRunnerActiveOrderId();

    api.get('/orders/courier').then((orders) => {
      if (!Array.isArray(orders)) {
        throw new Error('Daftar pesanan aktif Runner dari server tidak valid.');
      }

      const activeOrders = orders.filter((candidate) => {
        const status = String(candidate.status || '').toLowerCase();
        return isRunnerOrderAssignedTo(candidate, { id: runnerUserId }) &&
          !['completed', 'cancelled'].includes(status);
      });
      const selectedOrder = activeOrders.find(
        (candidate) => String(candidate.id) === requestedOrderId
      ) || activeOrders[0] || null;
      if (!active) return;

      setOrder(selectedOrder);
      if (selectedOrder) {
        setRunnerActiveOrderId(selectedOrder.id);
        const nextPath = `/runner-portal/detail?orderId=${encodeURIComponent(selectedOrder.id)}`;
        if (location.search !== `?orderId=${encodeURIComponent(selectedOrder.id)}`) {
          navigate(nextPath, { replace: true, state: { order: selectedOrder } });
        }
      } else {
        setRunnerActiveOrderId('');
      }
    }).catch((requestError) => {
      if (active) {
        setOrder(null);
        setOrderLoadError(requestError.message || 'Pesanan aktif Runner gagal dimuat.');
      }
    }).finally(() => {
      if (active) setLoadingOrder(false);
    });

    return () => {
      active = false;
    };
  }, [
    authLoading,
    location.search,
    navigate,
    profile?.id,
    queryOrderId,
    runnerUserId,
    initialOrder,
  ]);

  useEffect(() => {
    const status = String(order?.status || '').toLowerCase();
    setCurrentStep(
      status === 'completed'
        ? 4
        : status === 'delivering'
          ? 3
          : ['ready', 'ready_for_pickup'].includes(status)
            ? 2
            : 1
    );
    setOrderStatus(order?.status || '');
    setOrderCompleted(status === 'completed');
  }, [order?.id, order?.status]);

  const handleChatCustomer = async () => {
    if (!Number.isSafeInteger(customerId) || customerId <= 0 || !order?.id) {
      setChatError('Data Customer atau pesanan tidak tersedia untuk membuka Live Chat.');
      return;
    }

    setOpeningCustomerChat(true);
    setChatError('');
    try {
      const result = await api.post('/chats', {
        targetUserId: customerId,
        orderId: order.id,
      });
      const conversationId = result?.conversation?.id;
      if (!Number.isSafeInteger(Number(conversationId)) || Number(conversationId) <= 0) {
        throw new Error('Server belum mengembalikan percakapan yang valid.');
      }
      navigate(`/chat/${encodeURIComponent(conversationId)}`, {
        state: { returnTo: `/runner-portal/detail?orderId=${encodeURIComponent(order.id)}` },
      });
    } catch (requestError) {
      console.error(`Gagal membuka Live Chat untuk pesanan ${order.id}:`, requestError);
      setChatError(requestError.message || 'Live Chat dengan Customer gagal dibuka.');
    } finally {
      setOpeningCustomerChat(false);
    }
  };

  const handleNextStep = async () => {
    if (!canProcessOrder) return;
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!pickupQrCode.trim()) {
        setCompletionError('Masukkan kode QR pengambilan dari Customer terlebih dahulu.');
        return;
      }

      setUpdatingStatus(true);
      setCompletionError('');
      try {
        await api.post('/orders/verify-pickup', {
          pickupQrCode: pickupQrCode.trim(),
        });
        setOrderStatus('DELIVERING');
        setCurrentStep(3);
      } catch (requestError) {
        console.error(`Gagal memverifikasi pengambilan pesanan ${order?.id}:`, requestError);
        setCompletionError(requestError.message || 'Kode QR pengambilan gagal diverifikasi.');
      } finally {
        setUpdatingStatus(false);
      }
    }
  };

  const handlePinChange = async (index, value) => {
    if (canProcessOrder && /^\d?$/.test(value)) {
      const nextPin = [...pinDigits];
      nextPin[index] = value;
      setPinDigits(nextPin);
      setPinError(false);

      if (value && index < 3) {
        const nextInput = document.getElementById(`pin-${index + 1}`);
        if (nextInput) nextInput.focus();
      }

      // Check PIN
      if (nextPin.every((d) => d !== '')) {
        const enteredPin = nextPin.join('');
        if (enteredPin === correctPin) {
          setUpdatingStatus(true);
          setCompletionError('');
          try {
            const result = await api.patch(`/orders/${order.id}/status`, {
              status: 'completed',
            });
            if (String(result?.order?.status || '').toLowerCase() !== 'completed') {
              throw new Error('Server belum mengonfirmasi pesanan selesai.');
            }
            setOrderStatus(result.order.status);
            setOrderCompleted(true);
            setCurrentStep(4);
          } catch (requestError) {
            console.error(`Gagal menyelesaikan pesanan ${order?.id}:`, requestError);
            setCompletionError(requestError.message || 'Pesanan gagal ditandai selesai.');
            setPinDigits(['', '', '', '']);
          } finally {
            setUpdatingStatus(false);
          }
        } else {
          setPinError(true);
        }
      }
    }
  };

  if (authLoading || loadingOrder) {
    return <LoadingScreen message="Memuat detail pengantaran aktif..." />;
  }

  if (!order) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-lg font-extrabold text-[#0A2E6E]">Pesanan aktif tidak ditemukan</h1>
        <p className="mt-2 text-sm text-slate-600">
          {orderLoadError || 'Saat ini tidak ada pesanan pengantaran aktif yang ditugaskan kepada Anda.'}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link to="/runner-portal" className="rounded-xl bg-[#2152B7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#193F91]">
            Kembali ke Portal
          </Link>
          <Link to="/runner-portal/orders" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Lihat Job Board
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. TOP BANNER (Matching gocan-delivery-detail-desktop.png) */}
      <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/runner-portal/orders"
              className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition"
              title="Kembali"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A2E6E] tracking-tight">
              PENGANTARAN SEDANG BERLANGSUNG
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Kampus: {order?.campusName || campusInfo.name || 'Belum ditetapkan'}
            {order?.campusCity || campusInfo.city ? ` · ${order?.campusCity || campusInfo.city}` : ''}.
            {' '}Pantau lokasi pengambilan, informasi Customer, dan status pengantaran.
          </p>
        </div>

        <div className="flex items-center gap-4 self-start md:self-auto">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200/80 tracking-wide">
            {currentStep === 1 && 'KURIR MENERIMA'}
            {currentStep === 2 && 'TIBA DI KANTIN'}
            {currentStep === 3 && 'MENUJU RUANG KELAS'}
            {currentStep === 4 && 'PENGANTARAN SELESAI'}
          </span>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-medium">Estimasi tiba</span>
            <strong className="text-base font-extrabold text-slate-900">{orderStatus || '—'}</strong>
          </div>
        </div>
      </div>

      {orderCompleted && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-bold flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Pengantaran #{order?.id || 'GoCan'} berhasil diselesaikan! Ongkir Rp 3.500 telah masuk ke saldo dompet Anda.</span>
          </div>
          <Link
            to="/runner-portal"
            className="px-4 py-1.5 rounded-full bg-[#0A2E6E] text-white text-xs font-bold shrink-0 hover:bg-[#082252] transition"
          >
            Kembali ke Dompet
          </Link>
        </div>
      )}
      {campusMismatch && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          <MapPin className="h-4 w-4 shrink-0" />
          Pesanan berasal dari kampus yang berbeda dengan kampus Runner. Hubungi Admin sebelum melanjutkan.
        </div>
      )}
      {campusInactive && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          <MapPin className="h-4 w-4 shrink-0" />
          Kampus Runner sedang nonaktif. Hubungi Admin sebelum melanjutkan.
        </div>
      )}
      {completionError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {completionError}
        </div>
      )}

      {/* 2. 3-COLUMN DESKTOP GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* KOLOM 1: DETAIL ORDER & STEPPER */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-[#0A2E6E]">Detail Order</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ringkasan pesanan dan status pengantaran saat ini.
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Nomor Order</span>
              <strong className="text-slate-900 font-bold">#GoCan-{order?.id || '—'}</strong>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Status</span>
              <strong className="text-[#0A2E6E] font-bold">
                {currentStep === 1 ? 'Kurir menerima' : currentStep === 2 ? 'Sampai di kantin' : currentStep === 3 ? 'Menuju pemesan' : 'Selesai'}
              </strong>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Kampus</span>
              <strong className="text-slate-900 font-bold">{order?.campusName || campusInfo.name || '—'}</strong>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">Tipe Pesanan</span>
              <strong className="text-slate-900 font-bold">
                {activeOrderItems.map((item) => item.name || item.menu_name || 'Menu').join(', ') || '—'}
              </strong>
            </div>
          </div>

          {activeOrderItems.length > 0 && (
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Rincian menu
              </h3>
              {activeOrderItems.map((item, index) => (
                <div key={`${item.id || item.name || 'menu'}-${index}`} className="text-xs text-slate-700">
                  <p>{item.quantity || 1}x {item.name || item.menu_name || 'Menu'}</p>
                  {item.notes && (
                    <p className="mt-0.5 break-words text-slate-500">Catatan: {item.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Stepper Proses Pengantaran */}
          <div className="pt-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-4">
              PROSES PENGANTARAN
            </span>

            <div className="space-y-5">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    currentStep >= 1
                      ? 'bg-[#0A2E6E] text-white shadow-xs'
                      : 'border border-slate-300 text-slate-400'
                  }`}
                >
                  1
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                    Kurir menerima pesanan
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Status aktif saat ini
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    currentStep >= 2
                      ? 'bg-[#0A2E6E] text-white shadow-xs'
                      : 'border border-slate-300 text-slate-400'
                  }`}
                >
                  2
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                    Sampai di kantin
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tandai setelah tiba di lokasi pengambilan
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    currentStep >= 3
                      ? 'bg-[#0A2E6E] text-white shadow-xs'
                      : 'border border-slate-300 text-slate-400'
                  }`}
                >
                  3
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                    Serahkan ke customer
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gunakan titik temu yang sudah ditentukan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM 2: LOKASI */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-[#0A2E6E]">Lokasi</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Titik pengambilan dan tujuan pengantaran.
            </p>
          </div>

          {/* Box Ambil Di Kantin */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              AMBIL DI KANTIN
            </span>
            <h3 className="text-sm font-extrabold text-[#0A2E6E] mt-1">
              {canteenName}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {pickupLocation}
            </p>
          </div>

          {/* Box Antar Ke Customer */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              ANTAR KE CUSTOMER
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 mt-1">
              {customerName}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {destination}
            </p>
            <p className="text-xs font-semibold text-[#DC2626] italic mt-1.5">
              {order?.meetingPoint || order?.destinationNote || order?.destination_note
                ? `Catatan Titik Temu: ${order.meetingPoint || order.destinationNote || order.destination_note}`
                : 'Catatan titik temu belum tersedia.'}
            </p>
          </div>

          {/* Box Catatan Lokasi */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              CATATAN LOKASI
            </span>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Kampus: {order?.campusName || campusInfo.name || 'Tidak diketahui'}
            </p>
          </div>
        </div>

        {/* KOLOM 3: CUSTOMER & AKSI STATUS */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-extrabold text-[#0A2E6E]">Customer & Aksi Status</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Informasi penerima dan tombol aksi kurir.
            </p>
          </div>

          {/* Customer info card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              CUSTOMER
            </span>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">
              {customerName}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {destination}
            </p>
            <p className="text-xs font-semibold text-[#DC2626] italic mt-1.5">
              {order?.meetingPoint || order?.destinationNote || order?.destination_note
                ? `Catatan Titik Temu: ${order.meetingPoint || order.destinationNote || order.destination_note}`
                : 'Catatan titik temu belum tersedia.'}
            </p>
          </div>

          {/* Aksi Status */}
          <div className="space-y-3 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              AKSI STATUS
            </span>

            <button
              type="button"
              onClick={handleChatCustomer}
              disabled={openingCustomerChat || !Number.isSafeInteger(customerId) || customerId <= 0}
              className="w-full py-2.5 px-4 rounded-xl border border-blue-200 bg-blue-50 text-[#2152B7] hover:bg-blue-100 text-xs font-bold flex items-center justify-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{openingCustomerChat ? 'Membuka Chat...' : 'Chat Customer'}</span>
            </button>

            {chatError && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {chatError}
              </p>
            )}

            {/* Action Box with Red Button */}
            <div className="pt-2">
              <p className="text-xs text-slate-500 text-center mb-3">
                {currentStep === 1 && 'Geser tombol jika Anda sudah sampai di kantin'}
                {currentStep === 2 && 'Klik setelah menerima makanan dari staf stan'}
                {currentStep === 3 && 'Minta 4-digit PIN dari Customer penerima'}
                {currentStep === 4 && 'Pesanan selesai diserahkan!'}
              </p>

              {currentStep < 3 && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!canProcessOrder || updatingStatus}
                  className="w-full py-3.5 px-6 rounded-full bg-[#DC2626] hover:bg-[#B91C1C] text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase transition shadow-md cursor-pointer text-center block disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updatingStatus
                    ? 'Memverifikasi...'
                    : currentStep === 1
                      ? 'SAYA SUDAH DI KANTIN'
                      : 'VERIFIKASI & AMBIL MAKANAN'}
                </button>
              )}

              {currentStep === 2 && (
                <label className="block text-xs font-semibold text-slate-700">
                  Kode QR pengambilan dari Customer
                  <input
                    type="text"
                    value={pickupQrCode}
                    onChange={(event) => setPickupQrCode(event.target.value)}
                    disabled={!canProcessOrder || updatingStatus}
                    autoComplete="off"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-xs outline-none focus:border-[#2152B7] focus:ring-2 focus:ring-[#2152B7]/20 disabled:bg-slate-100"
                  />
                </label>
              )}

              {/* Step 3: PIN Input */}
              {currentStep === 3 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="text-center">
                    <span className="text-xs font-bold text-slate-800">
                      Masukkan PIN Pemesan (Hint: 4821)
                    </span>
                  </div>

                  <div className="flex justify-center gap-2">
                    {pinDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`pin-${idx}`}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handlePinChange(idx, e.target.value)}
                        disabled={!canProcessOrder || updatingStatus}
                        className="w-11 h-12 text-center text-lg font-black bg-white border border-slate-300 rounded-xl focus:border-[#0A2E6E] focus:ring-1 focus:ring-[#0A2E6E] focus:outline-hidden"
                      />
                    ))}
                  </div>

                  {pinError && (
                    <p className="text-[11px] text-[#DC2626] font-bold text-center">
                      PIN salah! Mintalah 4-digit PIN kepada {customerName}.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
