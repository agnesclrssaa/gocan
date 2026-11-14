import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { formatOrderDate } from '../../lib/orderStatus';

export default function CanteenReviews({ canteenId }) {
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadReviews() {
      setLoading(true);
      setError('');
      setData(null);

      try {
        const response = await api.get(
          `/canteens/${encodeURIComponent(canteenId)}/ratings`,
          {
            params: { page, limit: 5 },
            signal: controller.signal,
          }
        );

        if (controller.signal.aborted) return;

        if (
          !Array.isArray(response.ratings) ||
          !response.pagination
        ) {
          throw new Error('Format data ulasan belum sesuai.');
        }

        setData(response);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(
            requestError.message || 'Ulasan belum dapat dimuat.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadReviews();

    return () => controller.abort();
  }, [canteenId, page, attempt]);

  const total = Number(data?.pagination?.total) || 0;
  const totalPages = Number(data?.pagination?.totalPages) || 0;
  const average = Number(data?.avgRating);
  const averageLabel =
    Number.isFinite(average) && total > 0
      ? average.toLocaleString('id-ID', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      : 'Belum ada rating';

  return (
    <section
      id="ulasan-kantin"
      aria-labelledby="canteen-reviews-title"
      className="customer-card scroll-mt-28 space-y-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <header>
        <h2
          id="canteen-reviews-title"
          className="text-lg font-extrabold text-[#2152B7]"
        >
          Rating dan Review Kantin
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Penilaian dari pelanggan setelah pesanan selesai.
        </p>
      </header>

      {loading ? (
        <p role="status" className="text-sm text-slate-500">
          Memuat ulasan...
        </p>
      ) : error ? (
        <div role="alert">
          <p className="text-sm text-red-700">{error}</p>

          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="mt-3 rounded-full border border-blue-200 px-4 py-2 text-sm font-bold text-[#2152B7]"
          >
            Coba lagi
          </button>
        </div>
      ) : data ? (
        <>
          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="text-xl font-extrabold text-amber-800">
              {averageLabel}
              {total > 0 && (
                <span className="text-sm font-semibold">
                  {' '}/ 5
                </span>
              )}
            </p>

            <p className="mt-1 text-xs text-amber-800">
              {total} penilaian
            </p>
          </div>

          {data.ratings.length === 0 ? (
            <p className="text-sm text-slate-500">
              {total === 0
                ? 'Belum ada ulasan untuk kantin ini.'
                : 'Tidak ada ulasan pada halaman ini.'}
            </p>
          ) : (
            <div className="space-y-4">
              {data.ratings.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        {review.user?.name || 'Pelanggan'}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatOrderDate(review.createdAt)}
                      </p>
                    </div>

                    <span
                      aria-label={`Nilai ${review.stars} dari 5 bintang`}
                      className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800"
                    >
                      ★ {review.stars} / 5
                    </span>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">
                    {review.reviewText || 'Pelanggan memberikan penilaian tanpa komentar.'}
                  </p>
                </article>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav
              aria-label="Halaman ulasan kantin"
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-[#2152B7] disabled:opacity-40"
              >
                Sebelumnya
              </button>

              <span className="text-xs text-slate-500">
                Halaman {page} dari {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-[#2152B7] disabled:opacity-40"
              >
                Berikutnya
              </button>
            </nav>
          )}
        </>
      ) : null}
    </section>
  );
}