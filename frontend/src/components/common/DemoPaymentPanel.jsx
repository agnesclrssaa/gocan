import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { formatRupiah } from '../../lib/orderStatus';

export default function DemoPaymentPanel({
  orderId,
  onConfirmed,
}) {
  const { profile } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrImage, setQrImage] = useState(null);
  const [qrError, setQrError] = useState('');
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const submitting = useRef(false);

  const canConfirm = ['admin', 'canteen'].includes(profile?.role);
  const paid = data?.paymentStatus === 'PAID';

  const cancelled = ['CANCELLED', 'CANCELED'].includes(
    String(data?.status).toUpperCase()
  );

  const payable =
    data?.paymentStatus === 'PENDING' &&
    ['PENDING', 'PENDING_PAYMENT'].includes(
      String(data?.status).toUpperCase()
    );

  const qrPayload =
    payable && !error && data?.paymentMethod === 'QRIS'
      ? data.qrPayload
      : null;

  useEffect(() => {
    const controller = new AbortController();
    let version = 0;

    setLoading(true);
    setData(null);
    setError('');

    async function loadPayment() {
      const currentVersion = ++version;

      try {
        const response = await api.get(
          `/payment/demo/${encodeURIComponent(orderId)}`,
          { signal: controller.signal }
        );

        if (
          controller.signal.aborted ||
          currentVersion !== version
        ) return;

        if (
          !response.success ||
          !response.data?.isSimulation ||
          String(response.data.orderId) !== String(orderId)
        ) {
          throw new Error('Data pembayaran simulasi belum tersedia.');
        }

        setData(response.data);
        setError('');
      } catch (requestError) {
        if (
          !controller.signal.aborted &&
          currentVersion === version
        ) {
          setError(
            requestError.message ||
              'Pembayaran simulasi gagal dimuat.'
          );
        }
      } finally {
        if (
          !controller.signal.aborted &&
          currentVersion === version
        ) {
          setLoading(false);
        }
      }
    }

    loadPayment();

    const interval = window.setInterval(loadPayment, 10000);

    return () => {
      controller.abort();
      version += 1;
      window.clearInterval(interval);
    };
  }, [orderId, attempt]);

  useEffect(() => {
    let active = true;

    setQrImage(null);
    setQrError('');

    if (qrPayload) {
      QRCode.toDataURL(qrPayload, {
        width: 500,
        margin: 4,
        errorCorrectionLevel: 'M',
      })
        .then((url) => {
          if (active) {
            setQrImage({ payload: qrPayload, url });
          }
        })
        .catch(() => {
          if (active) {
            setQrError('Gambar QR demo belum dapat dibuat.');
          }
        });
    }

    return () => {
      active = false;
    };
  }, [qrPayload]);

  const confirmPayment = async () => {
    if (
      !canConfirm ||
      !payable ||
      error ||
      submitting.current
    ) return;

    submitting.current = true;
    setSaving(true);
    setError('');

    try {
      const response = await api.post(
        `/payment/demo/${encodeURIComponent(orderId)}/confirm`,
        {}
      );

      if (
        !response.success ||
        !response.data?.isSimulation ||
        response.data.paymentStatus !== 'PAID'
      ) {
        throw new Error(
          'Hasil konfirmasi belum jelas. Perbarui status sebelum mencoba lagi.'
        );
      }

      // Muat ulang agar permintaan lama tidak menimpa hasil konfirmasi.
      setAttempt((value) => value + 1);

      if (onConfirmed) {
        try {
          await onConfirmed(response.data);
        } catch {
          setError(
            'Simulasi berhasil dikonfirmasi, tetapi daftar pesanan belum diperbarui.'
          );
        }
      }
    } catch (requestError) {
      setError(
        requestError.message ||
          'Konfirmasi pembayaran simulasi gagal.'
      );
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-amber-200 bg-white p-5">
      <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900">
        SIMULASI — BUKAN PEMBAYARAN ASLI
      </span>

      <h2 className="mt-3 text-base font-bold text-[#2152B7]">
        Pembayaran pesanan #{orderId}
      </h2>

      <p className="mt-2 text-xs leading-relaxed text-slate-600">
        Tidak ada uang yang ditransaksikan. Jangan membayar
        melalui aplikasi bank atau memasukkan data kartu.
      </p>

      {loading ? (
        <p role="status" className="mt-4 text-sm text-slate-500">
          Memuat pembayaran simulasi...
        </p>
      ) : data ? (
        <div className="mt-4 space-y-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Metode</dt>
              <dd className="font-bold">
                {data.paymentMethod === 'QRIS'
                  ? 'QRIS — Simulasi'
                  : 'Debit — Simulasi'}
              </dd>
            </div>

            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Total demo</dt>
              <dd className="font-bold">
                {formatRupiah(data.totalAmount)}
              </dd>
            </div>
          </dl>

          <p
            role="status"
            className={`rounded-xl p-3 text-sm font-bold ${
              cancelled
                ? 'bg-red-50 text-red-700'
                : paid
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-amber-50 text-amber-900'
            }`}
          >
            {cancelled
              ? 'Pesanan dibatalkan'
              : paid
                ? 'Lunas dalam simulasi — tanpa pembayaran asli'
                : 'Menunggu konfirmasi simulasi dari admin'}
          </p>

          {qrPayload && (
            <div className="text-center">
              {qrImage?.payload === qrPayload ? (
                <img
                  src={qrImage.url}
                  alt="QR demo GoCan, bukan QRIS pembayaran asli"
                  width={500}
                  height={500}
                  className="mx-auto h-auto w-64 max-w-full rounded-xl border border-slate-200"
                />
              ) : (
                <p className="text-sm text-slate-500">
                  {qrError || 'Menyiapkan QR demo...'}
                </p>
              )}

              <p className="mt-2 text-xs font-bold text-amber-900">
                QR DEMO — TIDAK UNTUK MEMBAYAR
              </p>

              <p className="mt-2 text-xs text-slate-500">
                QR ini juga bukan QR pengambilan pesanan.
              </p>
            </div>
          )}

          {data.paymentMethod === 'DEBIT' && !paid && !cancelled && (
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Demo metode kartu debit. Tidak diperlukan nomor
              kartu, PIN, CVV, atau OTP.
            </div>
          )}

          {canConfirm && payable && (
            <button
              type="button"
              onClick={confirmPayment}
              disabled={saving || Boolean(error)}
              className="rounded-full bg-[#2152B7] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving
                ? 'Mengonfirmasi...'
                : 'Konfirmasi lunas — simulasi'}
            </button>
          )}

          {!canConfirm && payable && (
            <p className="text-xs text-slate-500">
              Kantin atau admin mengonfirmasi melalui dashboard.
              Status diperiksa otomatis setiap 10 detik.
            </p>
          )}
        </div>
      ) : null}

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={loading || saving}
        onClick={() => setAttempt((value) => value + 1)}
        className="mt-4 rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-[#2152B7] disabled:opacity-50"
      >
        Perbarui status simulasi
      </button>
    </section>
  );
}