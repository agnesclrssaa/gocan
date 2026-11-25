import { useEffect, useState } from 'react';
import { Tag, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { api } from '../../lib/api';

const formatRupiah = (amount) => `Rp ${Number(amount || 0).toLocaleString('id-ID')}`;

const PromoCodeForm = ({ subtotal, campusId }) => {
  const {
    promoCode,
    setPromoCode,
    appliedPromo,
    setAppliedPromo,
  } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (
      !appliedPromo?.code ||
      (appliedPromo.validatedSubtotal === subtotal && appliedPromo.validatedCampusId === campusId)
    ) {
      return undefined;
    }

    let active = true;
    setLoading(true);
    setError('');
    api.post('/promos/validate', {
      code: appliedPromo.code,
      subtotal,
      campusId,
    }).then((result) => {
      if (active) {
        setAppliedPromo({
          ...result,
          validatedSubtotal: subtotal,
          validatedCampusId: campusId,
        });
      }
    }).catch((requestError) => {
      if (active) {
        setAppliedPromo(null);
        setError(requestError.message || 'Promo tidak lagi memenuhi syarat.');
      }
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [appliedPromo, campusId, setAppliedPromo, subtotal]);

  const handleApply = async (event) => {
    event.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setError('Masukkan kode promo terlebih dahulu.');
      setAppliedPromo(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await api.post('/promos/validate', { code, subtotal, campusId });
      setPromoCode(result.code);
      setAppliedPromo({
        ...result,
        validatedSubtotal: subtotal,
        validatedCampusId: campusId,
      });
    } catch (requestError) {
      setAppliedPromo(null);
      setError(requestError.message || 'Kode promo tidak dapat diterapkan.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setPromoCode('');
    setAppliedPromo(null);
    setError('');
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4" aria-label="Kode promo">
      <form onSubmit={handleApply}>
        <label htmlFor="promo-code" className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
          <Tag className="h-4 w-4 text-[#2152B7]" />
          Kode Promo
        </label>
        <div className="flex gap-2">
          <input
            id="promo-code"
            type="text"
            value={promoCode}
            onChange={(event) => {
              setPromoCode(event.target.value.toUpperCase());
              setAppliedPromo(null);
              setError('');
            }}
            maxLength={50}
            disabled={loading}
            autoComplete="off"
            placeholder="Masukkan kode promo"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#2152B7]"
          />
          <button
            type="submit"
            disabled={loading || !promoCode.trim()}
            className="rounded-xl bg-[#2152B7] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#193F91] disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? 'Memeriksa...' : appliedPromo ? 'Terapkan Ulang' : 'Terapkan'}
          </button>
        </div>
      </form>

      {appliedPromo && (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
          <p>
            <span className="font-bold">{appliedPromo.code}</span>
            {appliedPromo.title ? ` · ${appliedPromo.title}` : ''}
            <span className="mt-1 block text-xs">
              Potongan {formatRupiah(appliedPromo.discountAmount)} berhasil diterapkan.
            </span>
          </p>
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Hapus kode promo"
            className="shrink-0 rounded-lg p-1 text-emerald-800 hover:bg-emerald-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && <p role="alert" className="mt-2 text-xs font-medium text-red-700">{error}</p>}
    </section>
  );
};

export default PromoCodeForm;
