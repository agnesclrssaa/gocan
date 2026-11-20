import DemoPaymentPanel from '../../components/common/DemoPaymentPanel';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  CheckCircle2,
  Clock3,
  Download,
  MapPin,
  QrCode,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import { api } from '../../lib/api';
import {
  formatOrderDate,
  formatRupiah,
  getOrderPresentation,
  getOrderTotal,
  ORDER_TONES,
} from '../../lib/orderStatus';

function PickupQRCode({ value, orderId }) {
  const [image, setImage] = useState(null);
  const [failure, setFailure] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    QRCode.toDataURL(value, {
      width: 400,
      margin: 4,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0F172AFF',
        light: '#FFFFFFFF',
      },
    })
      .then((url) => {
        if (active) {
          setImage({ value, url });
          setFailure(null);
        }
      })
      .catch(() => {
        if (active) {
          setFailure({
            value,
            message: 'Gambar QR belum dapat dibuat. Coba lagi.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [value, attempt]);

  if (failure?.value === value) {
    return (
      <div
        role="alert"
        className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
      >
        <p>{failure.message}</p>

        <button
          type="button"
          onClick={() => {
            setFailure(null);
            setAttempt((count) => count + 1);
          }}
          className="mt-3 rounded-full border border-red-200 px-4 py-2 font-bold"
        >
          Coba buat QR lagi
        </button>
      </div>
    );
  }

  if (image?.value !== value) {
    return (
      <p role="status" className="py-12 text-sm text-slate-500">
        Menyiapkan gambar QR...
      </p>
    );
  }

  return (
    <div className="text-center">
      <img
        src={image.url}
        alt={`QR pengambilan pesanan ${orderId}`}
        width={400}
        height={400}
        className="mx-auto h-auto w-72 max-w-full rounded-xl border border-slate-200 bg-white"
      />

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Tunjukkan QR ini kepada petugas kantin saat mengambil pesanan.
      </p>

      <a
        href={image.url}
        download={`QR-Pickup-GoCan-${orderId}.png`}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 px-4 py-2.5 text-sm font-bold text-[#2152B7] hover:bg-blue-50"
      >
        <Download className="h-4 w-4" />
        Unduh QR
      </a>
    </div>
  );
}

export default function OrderSuccess() {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loadedId, setLoadedId] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const versionRef = useRef(0);

  const loadOrder = useCallback(
    async (signal) => {
      const version = ++versionRef.current;

      if (!/^\d+$/.test(orderId || '')) {
        setError(
          'ID pesanan tidak valid. Buka pesanan melalui halaman Pesanan Saya.'
        );
        setLoadedId(orderId);
        setRefreshing(false);
        return;
      }

      try {
        const result = await api.get(
          `/orders/${encodeURIComponent(orderId)}`,
          { signal }
        );

        if (signal?.aborted || version !== versionRef.current) return;

        if (!result.order || String(result.order.id) !== orderId) {
          throw new Error(
            'Data pesanan belum tersedia. Silakan coba lagi.'
          );
        }

        setOrder(result.order);
        setError('');
      } catch (requestError) {
        if (signal?.aborted || version !== versionRef.current) return;

        setError(
          requestError.message ||
            'Tiket belum dapat dimuat. Silakan coba lagi.'
        );
      } finally {
        if (!signal?.aborted && version === versionRef.current) {
          setLoadedId(orderId);
          setRefreshing(false);
        }
      }
    },
    [orderId]
  );

  useEffect(() => {
    const controller = new AbortController();

    loadOrder(controller.signal);

    const interval = window.setInterval(() => {
      loadOrder(controller.signal);
    }, 10000);

    return () => {
      controller.abort();
      versionRef.current += 1;
      window.clearInterval(interval);
    };
  }, [loadOrder]);

  const refresh = () => {
    setRefreshing(true);
    loadOrder();
  };

  const currentOrder = String(order?.id) === orderId ? order : null;

  if (loadedId !== orderId || !currentOrder) {
    return (
      <div className="min-h-screen bg-[#F0F4F9] text-slate-800">
        <Navbar />

        <main className="mx-auto max-w-xl space-y-4 px-4 py-16 text-center">
          {loadedId !== orderId ? (
            <p role="status">Memuat E-ticket pesanan...</p>
          ) : (
            <>
              <p
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error || 'Pesanan tidak ditemukan.'}
              </p>

              <button
                type="button"
                onClick={refresh}
                disabled={refreshing}
                className="rounded-full bg-[#2152B7] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {refreshing ? 'Memuat...' : 'Coba lagi'}
              </button>
            </>
          )}

          <Link
            to="/history"
            className="block text-sm font-bold text-[#2152B7]"
          >
            Kembali ke Pesanan Saya
          </Link>
        </main>
      </div>
    );
  }

  const view = getOrderPresentation(currentOrder);
  const items = Array.isArray(currentOrder.items)
    ? currentOrder.items
    : [];

  const isCash =
    String(currentOrder.paymentMethod).toUpperCase() === 'CASH';

  const verified = currentOrder.isPickupVerified === true;

  const token =
    typeof currentOrder.pickupQrCode === 'string'
      ? currentOrder.pickupQrCode
      : '';

  const hasToken = token.length >= 20 && token.length <= 512;

  const canShowQR =
    view.isPickup &&
    !view.isTerminal &&
    !verified &&
    view.status !== 'unknown' &&
    (isCash || view.isPaid) &&
    hasToken &&
    !error;

  const HeaderIcon =
    view.status === 'cancelled'
      ? XCircle
      : view.awaitingPayment
        ? Clock3
        : CheckCircle2;

  const heading =
    view.status === 'cancelled'
      ? 'Pesanan dibatalkan'
      : view.awaitingPayment
        ? 'Pesanan menunggu pembayaran'
        : view.status === 'completed'
          ? 'Pesanan selesai'
          : verified && view.isPickup
            ? 'Pengambilan terverifikasi'
            : 'Pesanan berhasil dibuat';

  let qrMessage =
    'QR pengambilan belum tersedia. Tekan Perbarui untuk memeriksa kembali.';

  if (view.status === 'cancelled') {
    qrMessage =
      'Pesanan dibatalkan. Tiket ini tidak dapat digunakan untuk mengambil pesanan.';
  } else if (view.status === 'completed') {
    qrMessage =
      'Pesanan sudah selesai. QR pengambilan tidak ditampilkan lagi.';
  } else if (verified) {
    qrMessage =
      'Pengambilan telah diverifikasi petugas. QR ini tidak dapat digunakan ulang.';
  } else if (error) {
    qrMessage =
      'Status tiket belum dapat diperbarui. Sambungkan kembali ke server sebelum menampilkan QR.';
  } else if (!isCash && !view.isPaid) {
    qrMessage =
      'Pembayaran belum dikonfirmasi. QR pengambilan ditampilkan setelah pembayaran dikonfirmasi.';
  }

  const destination = [
    currentOrder.destinationBuilding || currentOrder.buildingName,
    currentOrder.destinationRoom || currentOrder.classInfo,
    currentOrder.meetingPoint,
  ]
    .filter(Boolean)
    .join(' / ');

  return (
    <div className="min-h-screen bg-[#F0F4F9] pb-20 text-slate-800">
      <Navbar />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <header className="customer-card rounded-3xl bg-[#2152B7] p-6 text-white sm:p-8">
          <HeaderIcon className="h-10 w-10" aria-hidden="true" />

          <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">
            {heading}
          </h1>

          <p className="mt-2 text-sm text-white/90">
            Detail pesanan dan informasi pengambilan Anda tersedia di
            bawah ini.
          </p>
        </header>

        {error && (
          <p
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

{['QRIS', 'DEBIT'].includes(
  String(currentOrder.paymentMethod).toUpperCase()
) &&
  String(currentOrder.paymentReference || '').startsWith('DEMO-') && (
    <DemoPaymentPanel
      key={`payment-${currentOrder.id}`}
      orderId={currentOrder.id}
    />
  )}

        <div className="grid items-start gap-6 lg:grid-cols-5">
          <section className="customer-card rounded-3xl border border-slate-200 bg-white p-6 lg:col-span-3">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-slate-200 pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  E-ticket GoCan
                </p>

                <h2 className="mt-1 text-2xl font-extrabold text-[#2152B7]">
                  Pesanan #{currentOrder.id}
                </h2>

                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {view.fulfillmentLabel}
                </p>
              </div>

              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${ORDER_TONES[view.tone]}`}
              >
                {view.label}
              </span>
            </div>

            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Kantin</dt>
                <dd className="mt-1 font-bold">
                  {currentOrder.canteen?.name || 'Kantin sesuai pesanan'}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">Waktu pemesanan</dt>
                <dd className="mt-1 font-semibold">
                  {formatOrderDate(currentOrder.createdAt)}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">Metode pembayaran</dt>
                <dd className="mt-1 font-semibold">
                  {view.methodLabel}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">Status pembayaran</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${ORDER_TONES[view.paymentTone]}`}
                  >
                    {view.paymentLabel}
                  </span>
                </dd>
              </div>
            </dl>

            {view.isScheduled && currentOrder.scheduledTime && (
              <div className="mt-5 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-sm text-[#2152B7]">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />

                <div>
                  <p className="font-bold">Pesanan terjadwal</p>
                  <p>{formatOrderDate(currentOrder.scheduledTime)}</p>
                </div>
              </div>
            )}

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm">
              <p className="flex items-center gap-2 font-bold">
                <MapPin className="h-4 w-4 text-[#2152B7]" />

                {view.isPickup
                  ? 'Lokasi pengambilan'
                  : 'Lokasi pengantaran'}
              </p>

              <p className="mt-2 break-words text-slate-600">
                {view.isPickup
                  ? currentOrder.canteen?.location ||
                    currentOrder.canteen?.name ||
                    'Lihat kantin pada pesanan'
                  : destination ||
                    'Lihat rincian lokasi pada tracking pesanan'}
              </p>
            </div>

            <h3 className="mt-6 text-xs font-bold uppercase tracking-wider text-slate-400">
              Rincian menu
            </h3>

            <div className="mt-3 space-y-3">
              {items.map((item, index) => (
                <div
                  key={`${item.id || 'item'}-${index}`}
                  className="flex justify-between gap-4 text-sm"
                >
                  <div className="min-w-0">
                    <p>
                      {item.quantity || 1}x{' '}
                      {item.name || item.menu_name || 'Menu'}
                    </p>

                    {item.notes && (
                      <p className="mt-1 break-words text-xs text-slate-500">
                        Catatan: {item.notes}
                      </p>
                    )}
                  </div>

                  <p className="gocan-price shrink-0 font-semibold">
                    {formatRupiah(
                      (Number(item.price) || 0) *
                        (Number(item.quantity) || 1)
                    )}
                  </p>
                </div>
              ))}

              {items.length === 0 && (
                <p className="text-sm text-slate-500">
                  Rincian menu belum tersedia.
                </p>
              )}

              <div className="flex justify-between gap-4 border-t border-dashed border-slate-200 pt-4 font-bold">
                <span>Total pesanan</span>

                <span className="gocan-price">
                  {formatRupiah(getOrderTotal(currentOrder))}
                </span>
              </div>
            </div>
          </section>

          <aside className="space-y-5 lg:col-span-2">
            <section className="customer-card rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-[#2152B7]">
                <QrCode className="h-5 w-5" />

                {view.isPickup
                  ? 'QR pengambilan'
                  : 'Pengantaran Campus Runner'}
              </h2>

              {view.isPickup ? (
                <div className="mt-4">
                  {canShowQR ? (
                    <>
                      <PickupQRCode
                        value={token}
                        orderId={currentOrder.id}
                      />

                      <p className="mt-4 rounded-xl bg-blue-50 p-3 text-xs leading-relaxed text-blue-800">
                        {view.status === 'ready'
                          ? 'Pesanan siap diambil. Tunjukkan QR ke petugas kantin untuk diverifikasi.'
                          : 'QR dapat diverifikasi saat kantin menandai pesanan siap diambil. Pantau status pesanan sebelum datang.'}
                      </p>

                      {isCash && !view.isPaid && (
                        <p className="mt-3 text-xs leading-relaxed text-amber-800">
                          Metode tunai: lakukan pembayaran di kasir
                          saat mengambil pesanan.
                        </p>
                      )}
                    </>
                  ) : (
                    <p
                      role="status"
                      className="rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600"
                    >
                      {qrMessage}
                    </p>
                  )}

                  <p className="mt-4 text-xs text-slate-500">
                    QR ini digunakan untuk pengambilan pesanan, bukan
                    untuk pembayaran QRIS.
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {view.description} Pesanan delivery tidak memerlukan
                  QR pengambilan oleh pelanggan. Pantau perkembangannya
                  melalui tombol Lacak pesanan.
                </p>
              )}
            </section>

            <div className="flex flex-col gap-3">
              <Link
                to={`/orders/${currentOrder.id}`}
                className="rounded-full bg-[#2152B7] px-5 py-3 text-center text-sm font-bold text-white hover:bg-blue-800"
              >
                Lacak pesanan
              </Link>

              <button
                type="button"
                onClick={refresh}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-[#2152B7] hover:bg-blue-50 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? 'animate-spin motion-reduce:animate-none'
                      : ''
                  }`}
                />

                {refreshing ? 'Memuat...' : 'Perbarui tiket'}
              </button>

              <Link
                to="/history"
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Pesanan saya
              </Link>
            </div>

            <p className="text-center text-xs text-slate-500">
              Status tiket diperbarui otomatis setiap 10 detik.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}