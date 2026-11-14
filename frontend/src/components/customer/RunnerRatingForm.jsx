import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';

export default function RunnerRatingForm({
  order,
  onSubmitRating,
}) {
  const [stars, setStars] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [savedReview, setSavedReview] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const submitting = useRef(false);

  const isCompleted =
    String(order?.status).toUpperCase() === 'COMPLETED';

  const isDelivery =
    String(order?.fulfillmentType).toLowerCase() === 'delivery';

  const runnerId =
    order?.courierId || order?.courier?.id || order?.runner?.id;

  const runnerName =
    order?.courier?.name || order?.runner?.name || 'Campus Runner';

  const available = typeof onSubmitRating === 'function';
  const orderId = order?.id;

  useEffect(() => {
    if (!isCompleted || !isDelivery || !runnerId || !orderId) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadReview() {
      setChecking(true);
      setLoadError('');

      try {
        const response = await api.get(
          `/orders/${encodeURIComponent(orderId)}/runner-rating`,
          { signal: controller.signal }
        );

        if (controller.signal.aborted) return;

        if (!response.success || response.data === undefined) {
          throw new Error('Data rating belum dapat diperiksa.');
        }

        setSavedReview(response.data);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setLoadError(
            requestError.message ||
              'Rating sebelumnya belum dapat dimuat.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setChecking(false);
        }
      }
    }

    loadReview();

    return () => controller.abort();
  }, [orderId, isCompleted, isDelivery, runnerId, attempt]);

  if (!isCompleted || !isDelivery || !runnerId) return null;

  const submitReview = async (event) => {
    event.preventDefault();

    if (
      !available ||
      checking ||
      loadError ||
      submitting.current ||
      savedReview
    ) return;

    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      setError('Pilih nilai 1 sampai 5 bintang.');
      return;
    }

    const text = reviewText.trim();

    if (text.length > 2000) {
      setError('Ulasan maksimal 2.000 karakter.');
      return;
    }

    submitting.current = true;
    setSaving(true);
    setError('');

    try {
      const response = await onSubmitRating({
        orderId: Number(orderId),
        stars,
        reviewText: text || null,
      });

      if (!response?.success || !response.data?.id) {
        throw new Error(
          'Penyimpanan rating belum dikonfirmasi server. Periksa ulang rating sebelum mencoba lagi.'
        );
      }

      setSavedReview(response.data);
    } catch (requestError) {
      if (requestError.data?.code === 'ALREADY_RATED') {
        setChecking(true);
        setAttempt((value) => value + 1);
      } else {
        setError(
          requestError.message || 'Rating runner gagal dikirim.'
        );
      }
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return (
    <section className="customer-card rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="text-base font-extrabold text-[#2152B7]">
        Nilai Campus Runner
      </h2>

      <p className="mt-2 text-sm text-slate-600">
        Pengantar pesanan: <strong>{runnerName}</strong>
      </p>

      {checking ? (
        <p role="status" className="mt-4 text-sm text-slate-500">
          Memeriksa rating sebelumnya...
        </p>
      ) : loadError ? (
        <div className="mt-4">
          <p role="alert" className="text-sm text-red-700">
            {loadError}
          </p>

          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="mt-3 rounded-full border border-blue-200 px-4 py-2 text-sm font-bold text-[#2152B7]"
          >
            Coba muat rating lagi
          </button>
        </div>
      ) : savedReview ? (
        <div
          role="status"
          className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
        >
          <p className="text-sm font-bold text-emerald-800">
            Rating Anda sudah tersimpan
          </p>

          <p className="mt-2 font-bold text-amber-800">
            ★ {savedReview.stars} / 5
          </p>

          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">
            {savedReview.reviewText || 'Tanpa komentar tambahan.'}
          </p>
        </div>
      ) : (
        <form onSubmit={submitReview} className="mt-5 space-y-4">
          {!available && (
            <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
              Pengiriman rating runner belum tersedia.
            </p>
          )}

          <fieldset
            disabled={saving || !available}
            className="space-y-4"
          >
            <legend className="text-sm font-bold text-slate-700">
              Bagaimana pelayanan runner?
            </legend>

            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <label
                  key={value}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${
                    stars === value
                      ? 'border-amber-400 bg-amber-50 text-amber-900'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name={`runner-rating-${orderId}`}
                    value={value}
                    checked={stars === value}
                    onChange={() => {
                      setStars(value);
                      setError('');
                    }}
                    required
                    className="h-4 w-4 accent-amber-500"
                  />

                  <span aria-label={`${value} bintang`}>
                    {value} ★
                  </span>
                </label>
              ))}
            </div>

            <div>
              <label
                htmlFor={`runner-review-${orderId}`}
                className="block text-sm font-bold text-slate-700"
              >
                Review pelayanan (opsional)
              </label>

              <textarea
                id={`runner-review-${orderId}`}
                value={reviewText}
                onChange={(event) => {
                  setReviewText(event.target.value);
                  setError('');
                }}
                rows={4}
                maxLength={2000}
                placeholder="Contoh: Runner ramah dan mudah dihubungi."
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#2152B7] disabled:bg-slate-50"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {reviewText.length}/2.000
              </p>
            </div>
          </fieldset>

          {error && (
            <div role="alert" className="rounded-xl bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setError('');
                  setAttempt((value) => value + 1);
                }}
                className="mt-2 text-xs font-bold text-[#2152B7] underline"
              >
                Periksa ulang rating tersimpan
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={!available || saving || stars === 0}
            className="rounded-full bg-[#2152B7] px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Mengirim...' : 'Kirim rating runner'}
          </button>
        </form>
      )}
    </section>
  );
}