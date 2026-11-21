import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Eye,
  Image as ImageIcon,
  MapPin,
  MapPinned,
  Pencil,
  Plus,
  Power,
  Save,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { api } from '../../lib/api';

const EMPTY_FORM = {
  campusId: '',
  name: '',
  city: '',
  address: '',
  image: '',
  latitude: '',
  longitude: '',
  status: 'active',
};

function CampusPhoto({ campus, className = '' }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!campus.image || imageFailed) {
    return (
      <div className={`flex shrink-0 items-center justify-center rounded-xl bg-[#fbf7f1] text-[#116aa5] ${className}`}>
        <ImageIcon className="h-5 w-5" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={campus.image}
      alt={`Foto ${campus.name}`}
      onError={() => setImageFailed(true)}
      className={`shrink-0 rounded-xl object-cover ${className}`}
    />
  );
}

function Modal({ title, onClose, children, maxWidth = 'max-w-lg' }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="campus-modal-title"
        className={`max-h-[92vh] w-full ${maxWidth} overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl`}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <h2 id="campus-modal-title" className="text-base font-black text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

const inputClassName = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#116aa5] focus:ring-2 focus:ring-[#116aa5]/15';

export default function AdminCampusManagement() {
  const [campusData, setCampusData] = useState({ campuses: [], error: '' });
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  const campuses = campusData.campuses;

  const refreshCampuses = useCallback(async () => {
    setLoading(true);
    setCampusData((current) => ({ ...current, error: '' }));
    try {
      const response = await api.get('/campuses');
      if (!Array.isArray(response)) {
        throw new Error('Format daftar kampus dari server tidak valid.');
      }
      setCampusData({ campuses: response, error: '' });
      return response;
    } catch (requestError) {
      setCampusData((current) => ({
        ...current,
        error: requestError.message || 'Gagal memuat data kampus.',
      }));
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCampuses().catch((requestError) => {
      console.error('Gagal memuat manajemen kampus:', requestError);
    });
  }, [refreshCampuses]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeoutId = window.setTimeout(() => setNotice(''), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => {
    if (!modal) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal]);

  const stats = useMemo(() => ({
    total: campuses.length,
    active: campuses.filter((campus) => campus.status === 'active').length,
    inactive: campuses.filter((campus) => campus.status === 'inactive').length,
    cities: new Set(campuses.map((campus) => campus.city.trim().toLocaleLowerCase()).filter(Boolean)).size,
  }), [campuses]);

  const filteredCampuses = useMemo(() => {
    const nameQuery = searchName.trim().toLocaleLowerCase();
    const cityQuery = searchCity.trim().toLocaleLowerCase();
    return campuses.filter((campus) => {
      const matchesName = campus.name.toLocaleLowerCase().includes(nameQuery);
      const matchesCity = campus.city.toLocaleLowerCase().includes(cityQuery);
      const matchesStatus = statusFilter === 'all' || campus.status === statusFilter;
      return matchesName && matchesCity && matchesStatus;
    });
  }, [campuses, searchName, searchCity, statusFilter]);

  const openAddForm = () => {
    setForm({ ...EMPTY_FORM });
    setFormError('');
    setModal({ type: 'form', editing: false });
  };

  const openEditForm = (campus) => {
    setForm({
      ...EMPTY_FORM,
      ...campus,
      image: campus.image || '',
      latitude: campus.latitude || '',
      longitude: campus.longitude || '',
    });
    setFormError('');
    setModal({ type: 'form', editing: true });
  };

  const saveCampus = async (event) => {
    event.preventDefault();
    if (saving) return;
    const nextForm = {
      ...form,
      name: form.name.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      image: form.image.trim(),
      latitude: form.latitude.trim(),
      longitude: form.longitude.trim(),
    };

    if (!nextForm.name || !nextForm.city || !nextForm.address) {
      setFormError('Nama kampus, kota, dan alamat lengkap wajib diisi.');
      return;
    }

    const latitude = nextForm.latitude === '' ? null : Number(nextForm.latitude);
    const longitude = nextForm.longitude === '' ? null : Number(nextForm.longitude);
    if (
      (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
      (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))
    ) {
      setFormError('Latitude harus berada pada -90 sampai 90 dan longitude pada -180 sampai 180.');
      return;
    }

    const payload = {
      name: nextForm.name,
      city: nextForm.city,
      address: nextForm.address,
      image: nextForm.image,
      latitude: nextForm.latitude,
      longitude: nextForm.longitude,
      status: nextForm.status,
    };

    setSaving(true);
    setFormError('');
    try {
      if (modal.editing) {
        await api.put(`/campuses/${encodeURIComponent(form.campusId)}`, payload);
      } else {
        await api.post('/campuses', payload);
      }
      window.dispatchEvent(new Event('gocan_campuses_updated'));
      setNotice(modal.editing ? 'Informasi kampus berhasil diperbarui.' : 'Kampus baru berhasil ditambahkan.');
      setModal(null);
      try {
        await refreshCampuses();
      } catch (requestError) {
        console.error('Perubahan tersimpan, tetapi daftar kampus gagal diperbarui:', requestError);
      }
    } catch (requestError) {
      setFormError(requestError.message || 'Kampus gagal disimpan.');
    } finally {
      setSaving(false);
    }
  };

  const confirmCampusAction = async () => {
    if (!modal?.campus) return;
    const { campus, action } = modal;
    setSaving(true);
    setCampusData((current) => ({ ...current, error: '' }));
    try {
      if (action === 'delete') {
        await api.delete(`/campuses/${encodeURIComponent(campus.campusId)}`);
        setNotice('Kampus berhasil dihapus.');
      } else {
        const status = action === 'activate' ? 'active' : 'inactive';
        await api.put(`/campuses/${encodeURIComponent(campus.campusId)}`, { status });
        setNotice(status === 'active' ? 'Kampus berhasil diaktifkan kembali.' : 'Kampus berhasil dinonaktifkan.');
      }
      window.dispatchEvent(new Event('gocan_campuses_updated'));
      setModal(null);
      try {
        await refreshCampuses();
      } catch (requestError) {
        console.error('Tindakan kampus berhasil, tetapi daftar gagal diperbarui:', requestError);
      }
    } catch (requestError) {
      setCampusData((current) => ({
        ...current,
        error: requestError.message || 'Tindakan kampus gagal diproses.',
      }));
    } finally {
      setSaving(false);
    }
  };

  const statsCards = [
    { label: 'Total Kampus', value: stats.total, icon: Building2, iconClass: 'bg-[#116aa5]/10 text-[#116aa5]', borderClass: 'border-t-[#116aa5]' },
    { label: 'Kampus Aktif', value: stats.active, icon: CheckCircle2, iconClass: 'bg-emerald-50 text-emerald-700', borderClass: 'border-t-emerald-500' },
    { label: 'Kampus Nonaktif', value: stats.inactive, icon: XCircle, iconClass: 'bg-red-50 text-[#dc0413]', borderClass: 'border-t-[#dc0413]' },
    { label: 'Total Kota', value: stats.cities, icon: MapPinned, iconClass: 'bg-[#ffd612]/25 text-amber-800', borderClass: 'border-t-[#ffd612]' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#116aa5]">Direktori GoCan</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Manajemen Kampus</h1>
          <p className="mt-1.5 text-sm text-slate-500">Kelola informasi dan daftar kampus yang bergabung dengan GoCan.</p>
        </div>
        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#dc0413] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#b80310] focus:outline-none focus:ring-2 focus:ring-[#dc0413]/30 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Tambah Kampus
        </button>
      </header>

      {campusData.error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{campusData.error}</span>
        </div>
      )}
      {notice && (
        <div role="status" aria-live="polite" className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      <section aria-label="Statistik kampus" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statsCards.map(({ label, value, icon: Icon, iconClass, borderClass }) => (
          <article key={label} className={`rounded-2xl border border-slate-200 border-t-4 ${borderClass} bg-white p-4 shadow-sm sm:p-5`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-500">{label}</p>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{value.toLocaleString('id-ID')}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-[#fbf7f1]/65 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">Daftar Kampus</h2>
              <p className="mt-1 text-xs text-slate-500">
                Menampilkan {filteredCampuses.length} dari {campuses.length} kampus
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:w-[min(100%,44rem)] lg:grid-cols-[minmax(12rem,1fr)_minmax(10rem,0.8fr)_9rem]">
              <label className="relative">
                <span className="sr-only">Cari nama kampus</span>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={searchName}
                  onChange={(event) => setSearchName(event.target.value)}
                  placeholder="Cari nama kampus"
                  className={`${inputClassName} mt-0 pl-9`}
                />
              </label>
              <label>
                <span className="sr-only">Cari berdasarkan kota</span>
                <input
                  type="search"
                  value={searchCity}
                  onChange={(event) => setSearchCity(event.target.value)}
                  placeholder="Cari kota"
                  className={`${inputClassName} mt-0`}
                />
              </label>
              <label>
                <span className="sr-only">Filter status kampus</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className={`${inputClassName} mt-0`}
                >
                  <option value="all">Semua status</option>
                  <option value="active">Kampus aktif</option>
                  <option value="inactive">Kampus nonaktif</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {loading && campuses.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm font-semibold text-slate-500">
            Memuat daftar kampus...
          </div>
        ) : filteredCampuses.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <tr className="border-b border-slate-100">
                  <th scope="col" className="px-4 py-3.5">No.</th>
                  <th scope="col" className="px-3 py-3.5">Foto Kampus</th>
                  <th scope="col" className="px-3 py-3.5">Nama Kampus</th>
                  <th scope="col" className="px-3 py-3.5">Kota</th>
                  <th scope="col" className="px-3 py-3.5">Alamat</th>
                  <th scope="col" className="px-3 py-3.5">Status</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCampuses.map((campus, index) => (
                  <tr key={campus.campusId} className="transition hover:bg-[#fbf7f1]/55">
                    <td className="px-4 py-4 text-slate-500">{index + 1}</td>
                    <td className="px-3 py-4">
                      <CampusPhoto campus={campus} className="h-11 w-11" />
                    </td>
                    <td className="max-w-[17rem] px-3 py-4">
                      <p className="truncate font-bold text-slate-900" title={campus.name}>{campus.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{campus.campusId}</p>
                    </td>
                    <td className="px-3 py-4 font-medium text-slate-700">{campus.city}</td>
                    <td className="max-w-[15rem] px-3 py-4 text-slate-500">
                      <p className="truncate" title={campus.address}>{campus.address}</p>
                    </td>
                    <td className="px-3 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${campus.status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${campus.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {campus.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="Detail kampus"
                          aria-label={`Detail ${campus.name}`}
                          onClick={() => setModal({ type: 'detail', campus })}
                          className="rounded-lg p-2 text-[#116aa5] transition hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Edit kampus"
                          aria-label={`Edit ${campus.name}`}
                          onClick={() => openEditForm(campus)}
                          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title={campus.status === 'active' ? 'Nonaktifkan kampus' : 'Aktifkan kembali kampus'}
                          aria-label={`${campus.status === 'active' ? 'Nonaktifkan' : 'Aktifkan kembali'} ${campus.name}`}
                          onClick={() => setModal({ type: 'confirm', action: campus.status === 'active' ? 'deactivate' : 'activate', campus })}
                          className={`rounded-lg p-2 transition ${campus.status === 'active' ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'}`}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Hapus kampus"
                          aria-label={`Hapus ${campus.name}`}
                          onClick={() => setModal({ type: 'confirm', action: 'delete', campus })}
                          className="rounded-lg p-2 text-[#dc0413] transition hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fbf7f1] text-slate-400">
              <Search className="h-5 w-5" />
            </span>
            <h3 className="mt-3 font-bold text-slate-800">Kampus tidak ditemukan</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">Ubah kata pencarian atau filter, atau tambahkan data kampus baru.</p>
          </div>
        )}
      </section>

      {modal?.type === 'form' && (
        <Modal title={modal.editing ? 'Edit Kampus' : 'Tambah Kampus'} onClose={() => setModal(null)} maxWidth="max-w-2xl">
          <form onSubmit={saveCampus} className="space-y-4 px-5 py-5 sm:px-6">
            {modal.editing && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <p className="text-xs font-semibold text-slate-500">Campus ID (tidak dapat diubah)</p>
                <p className="mt-0.5 text-sm font-bold text-slate-800">{form.campusId}</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                Nama Kampus <span className="text-[#dc0413]">*</span>
                <input required autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nama resmi kampus" className={inputClassName} />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Kota <span className="text-[#dc0413]">*</span>
                <input required value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} placeholder="Contoh: Surabaya" className={inputClassName} />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Status Kampus
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className={inputClassName}>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                Alamat Lengkap <span className="text-[#dc0413]">*</span>
                <textarea required rows="2" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Alamat lengkap kampus" className={`${inputClassName} resize-y`} />
              </label>
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                Foto Kampus (URL gambar)
                <input type="url" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="https://contoh.com/foto-kampus.jpg" className={inputClassName} />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Latitude
                <input type="number" step="any" min="-90" max="90" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} placeholder="-7.2722" className={inputClassName} />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Longitude
                <input type="number" step="any" min="-180" max="180" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} placeholder="112.7368" className={inputClassName} />
              </label>
            </div>
            {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
                Batal
              </button>
              <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#dc0413] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#b80310] disabled:cursor-not-allowed disabled:opacity-60">
                <Save className="h-4 w-4" />
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.type === 'detail' && (
        <Modal title="Detail Kampus" onClose={() => setModal(null)}>
          <div className="space-y-5 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <CampusPhoto campus={modal.campus} className="h-20 w-20" />
              <div className="min-w-0">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${modal.campus.status === 'active' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                  {modal.campus.status === 'active' ? 'Aktif' : 'Nonaktif'}
                </span>
                <h3 className="mt-2 text-lg font-black leading-snug text-slate-900">{modal.campus.name}</h3>
                <p className="mt-1 text-sm font-semibold text-[#116aa5]">{modal.campus.campusId}</p>
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-3 rounded-xl bg-[#fbf7f1]/70 p-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Kota</dt>
                <dd className="mt-1 flex items-start gap-2 text-sm font-semibold text-slate-800"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#116aa5]" />{modal.campus.city}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Alamat</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-800">{modal.campus.address}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Latitude</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">{modal.campus.latitude || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Longitude</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">{modal.campus.longitude || '—'}</dd>
              </div>
            </dl>
            <div className="flex justify-end">
              <button type="button" onClick={() => setModal(null)} className="rounded-xl bg-[#116aa5] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0d5687]">Tutup</button>
            </div>
          </div>
        </Modal>
      )}

      {modal?.type === 'confirm' && (
        <Modal
          title={modal.action === 'delete' ? 'Hapus Kampus?' : modal.action === 'activate' ? 'Aktifkan Kampus?' : 'Nonaktifkan Kampus?'}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4 px-5 py-5 sm:px-6">
            <div className={`flex gap-3 rounded-xl border p-4 ${modal.action === 'delete' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
              <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${modal.action === 'delete' ? 'text-[#dc0413]' : 'text-amber-700'}`} />
              <p className="text-sm leading-relaxed text-slate-700">
                {modal.action === 'delete'
                  ? <>Data <strong>{modal.campus.name}</strong> akan dihapus permanen. Kampus dapat memiliki relasi data di masa mendatang; menonaktifkannya lebih disarankan.</>
                  : modal.action === 'activate'
                    ? <>Aktifkan kembali <strong>{modal.campus.name}</strong> agar berstatus aktif di daftar kampus?</>
                    : <>Nonaktifkan <strong>{modal.campus.name}</strong>? Data kampus tetap tersimpan dan dapat diaktifkan kembali.</>}
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">Batal</button>
              <button
                type="button"
                onClick={confirmCampusAction}
                disabled={saving}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${modal.action === 'delete' ? 'bg-[#dc0413] hover:bg-[#b80310]' : modal.action === 'activate' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-amber-700 hover:bg-amber-800'}`}
              >
                {saving ? 'Memproses...' : modal.action === 'delete' ? 'Hapus permanen' : modal.action === 'activate' ? 'Aktifkan' : 'Nonaktifkan'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
