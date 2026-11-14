import { useEffect, useId, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { api } from '../../lib/api';

async function readQRImage(file) {
  if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) {
    throw new Error('Pilih gambar PNG, JPG, atau WebP.');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Ukuran gambar maksimal 10 MB.');
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = imageUrl;

    try {
      await image.decode();
    } catch {
      throw new Error('File gambar tidak dapat dibuka.');
    }

    const width = image.naturalWidth;
    const height = image.naturalHeight;

    if (
      !width ||
      !height ||
      width > 4096 ||
      height > 4096 ||
      width * height > 12000000
    ) {
      throw new Error(
        'Gambar terlalu besar. Gunakan PNG asli dari tombol Unduh QR.'
      );
    }

    const scales = Math.max(width, height) <= 1600
      ? [1, 2]
      : [1];

    for (const scale of scales) {
      const padding = 32;
      const canvas = document.createElement('canvas');

      canvas.width = width * scale + padding * 2;
      canvas.height = height * scale + padding * 2;

      const context = canvas.getContext('2d', {
        willReadFrequently: true,
      });

      if (!context) {
        throw new Error('Browser tidak dapat memproses gambar.');
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = false;

      context.drawImage(
        image,
        padding,
        padding,
        width * scale,
        height * scale
      );

      const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      const decoded = jsQR(
        pixels.data,
        pixels.width,
        pixels.height,
        { inversionAttempts: 'attemptBoth' }
      );

      if (decoded?.data) return decoded.data;
    }

    throw new Error(
      'QR belum terbaca. Unduh ulang PNG dari E-ticket pelanggan, lalu pilih file unduhan tersebut.'
    );
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export default function PickupScanner({ onVerified }) {
  const uniqueId = useId();
  const readerId =
    `pickup-camera-${uniqueId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const [useCamera, setUseCamera] = useState(false);
  const [token, setToken] = useState('');
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [cameraAttempt, setCameraAttempt] = useState(0);

  const submitting = useRef(false);

  useEffect(() => {
    if (!useCamera || token || result) return undefined;

    let cancelled = false;
    let captured = false;
    let scanner;

    async function startCamera() {
      try {
        const {
          Html5QrcodeScanner,
          Html5QrcodeSupportedFormats,
          Html5QrcodeScanType,
        } = await import('html5-qrcode');

        if (cancelled) return;

        scanner = new Html5QrcodeScanner(
          readerId,
          {
            fps: 10,
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
            ],
            supportedScanTypes: [
              Html5QrcodeScanType.SCAN_TYPE_CAMERA,
            ],
            rememberLastUsedCamera: false,
          },
          false
        );

        scanner.render(
          (decodedText) => {
            if (cancelled || captured) return;

            const value = decodedText.trim();

            if (value.length < 20 || value.length > 512) {
              captured = true;
              setError('QR tersebut bukan format tiket GoCan yang sesuai.');
              setUseCamera(false);
              return;
            }

            captured = true;
            setToken(value);
            setError('');
            setUseCamera(false);
          },
          () => {
            // Kamera boleh terus mencari sampai QR terbaca.
          }
        );
      } catch {
        if (!cancelled) {
          setError(
            'Kamera belum dapat dibuka. Coba file PNG atau periksa izin kamera browser.'
          );
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;

      if (scanner) {
        scanner.clear().catch(() => {
          // Scanner mungkin sudah ditutup.
        });
      }
    };
  }, [useCamera, token, result, readerId, cameraAttempt]);

  const readFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || reading || submitting.current) return;

    setReading(true);
    setError('');
    setToken('');
    setResult(null);

    try {
      const decodedText = await readQRImage(file);
      const value = decodedText.trim();

      if (value.length < 20 || value.length > 512) {
        throw new Error(
          'Gambar terbaca, tetapi isinya bukan format tiket GoCan yang sesuai.'
        );
      }

      setToken(value);
    } catch (readError) {
      setError(readError.message || 'Gambar QR gagal dibaca.');
    } finally {
      setReading(false);
    }
  };

  const resetScanner = () => {
    if (reading || submitting.current) return;

    setUseCamera(false);
    setToken('');
    setResult(null);
    setError('');
  };

  const verifyPickup = async () => {
    if (!token || submitting.current) return;

    submitting.current = true;
    setBusy(true);
    setError('');

    try {
      const response = await api.post('/orders/verify-pickup', {
        pickupQrCode: token,
      });

      if (!response.success || !response.data?.orderId) {
        throw new Error(
          'Respons verifikasi belum lengkap. Periksa status pesanan sebelum mencoba lagi.'
        );
      }

      setResult(response.data);
      setToken('');

      if (onVerified) {
        try {
          await onVerified(response.data);
        } catch {
          setError(
            'Verifikasi berhasil, tetapi daftar pesanan belum diperbarui. Segarkan daftar pesanan.'
          );
        }
      }
    } catch (requestError) {
      setError(
        requestError.message ||
          'Verifikasi gagal. Periksa status pesanan dan koneksi server.'
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-[#2152B7]">
        Verifikasi QR pengambilan
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Pilih PNG asli dari E-ticket pelanggan atau gunakan kamera.
        Pembacaan gambar dilakukan di browser.
      </p>

      <p className="mt-2 text-xs leading-relaxed text-amber-800">
        Pesanan harus siap diambil. Untuk pickup tunai, terima
        pembayaran sebelum mengonfirmasi pengambilan.
      </p>

      {!token && !result && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={reading}
              onClick={() => {
                setUseCamera(false);
                setError('');
              }}
              className="rounded-full border border-blue-200 px-4 py-2 text-sm font-bold text-[#2152B7] disabled:opacity-50"
            >
              Pilih gambar QR
            </button>

            <button
              type="button"
              disabled={reading}
              onClick={() => {
                setError('');
                setCameraAttempt((value) => value + 1);
                setUseCamera(true);
              }}
              className="rounded-full border border-blue-200 px-4 py-2 text-sm font-bold text-[#2152B7] disabled:opacity-50"
            >
              Gunakan kamera
            </button>
          </div>

          {useCamera ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 p-2">
              <div id={readerId} />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50 p-4">
              <label
                htmlFor={`${readerId}-file`}
                className="block text-sm font-bold text-slate-700"
              >
                File gambar QR
              </label>

              <input
                id={`${readerId}-file`}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={readFile}
                disabled={reading}
                className="mt-3 block w-full text-sm text-slate-600"
              />

              <p className="mt-2 text-xs text-slate-500">
                PNG, JPG, atau WebP; maksimal 10 MB.
              </p>
            </div>
          )}

          {reading && (
            <p role="status" className="text-sm text-slate-500">
              Membaca gambar QR...
            </p>
          )}
        </div>
      )}

      {token && !result && (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p role="status" className="text-sm font-bold text-blue-800">
            QR berhasil dibaca
          </p>

          <p className="mt-2 text-sm text-slate-600">
            Pastikan tiket sesuai dengan pesanan yang akan
            diserahkan. Konfirmasi akan memeriksa tiket dan
            mencatat pengambilan ke server.
          </p>

          <button
            type="button"
            onClick={verifyPickup}
            disabled={busy}
            className="mt-4 rounded-full bg-[#2152B7] px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {busy ? 'Memverifikasi...' : 'Konfirmasi pengambilan'}
          </button>
        </div>
      )}

      {result && (
        <div
          role="status"
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          <p className="font-bold">
            Pengambilan pesanan #{result.orderId} berhasil diverifikasi
          </p>

          <p className="mt-2">
            Pelanggan: {result.customerName || 'Pelanggan'}
          </p>

          {Array.isArray(result.itemsSummary) && (
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {result.itemsSummary.map((item, index) => (
                <li key={index}>
                  {item.quantity}x {item.name}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3">
            Cocokkan rincian menu sebelum menyerahkan pesanan.
          </p>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={resetScanner}
        disabled={busy || reading}
        className="mt-4 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-50"
      >
        {result ? 'Scan tiket berikutnya' : 'Scan ulang'}
      </button>
    </section>
  );
}