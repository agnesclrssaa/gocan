import { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Building,
  Check
} from 'lucide-react';

export default function RunnerJobs() {
  const { isOnline } = useOutletContext();
  const [takenJobId, setTakenJobId] = useState(null);

  const availableJobs = [
    {
      id: 'JOB-101',
      canteen: 'Stan 02 - Soto Ayam Lamongan',
      pickupPoint: 'Kantin Dinoyo Stan 02',
      dropoffPoint: 'Gedung A Lantai 4 (Ruang A401)',
      fee: 'Rp 3.500',
      distance: '180 meter',
      orderSummary: '1x Soto Ayam + Nasi, 1x Es Jeruk',
      prepTime: 'Siap saji dalam 5 mnt'
    },
    {
      id: 'JOB-102',
      canteen: 'Stan 08 - Geprek Bensu Kampus',
      pickupPoint: 'Kantin Dinoyo Stan 08',
      dropoffPoint: 'Perpustakaan Lt. 2 (Area Belajar)',
      fee: 'Rp 3.500',
      distance: '240 meter',
      orderSummary: '2x Paket Geprek Leleh',
      prepTime: 'Makanan Sudah Siap'
    },
    {
      id: 'JOB-103',
      canteen: 'Stan 05 - Kopi & Toast Mahasiswa',
      pickupPoint: 'Kantin Dinoyo Stan 05',
      dropoffPoint: 'Gedung B Lantai 1 (Lobi Dosen)',
      fee: 'Rp 4.000',
      distance: '310 meter',
      orderSummary: '3x Iced Caramel Macchiato',
      prepTime: 'Siap saji dalam 3 mnt'
    }
  ];

  const handleTakeJob = (jobId) => {
    setTakenJobId(jobId);
    setTimeout(() => {
      alert(`Selamat! Anda berhasil mengambil orderan ${jobId}. Silakan menuju stan kantin.`);
    }, 200);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Job Board Kampus</h1>
          <p className="text-xs text-slate-500">Antar pesanan ke kelas & dapatkan ongkir Rp 3.500+</p>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
          {availableJobs.length} Tersedia
        </span>
      </div>

      {!isOnline && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Status Anda saat ini sedang Offline. Aktifkan status di atas untuk mengambil pesanan.</span>
        </div>
      )}

      {/* List of Available Jobs */}
      <div className="space-y-3">
        {availableJobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-orange-300 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                {job.id}
              </span>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                +{job.fee}
              </span>
            </div>

            <h3 className="font-bold text-slate-900 text-sm mb-2">{job.canteen}</h3>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-xs mb-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-500 text-[11px]">Ambil:</span>
                <span className="font-semibold text-slate-800 truncate">{job.pickupPoint}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span className="text-slate-500 text-[11px]">Antar:</span>
                <span className="font-semibold text-slate-900 truncate">{job.dropoffPoint}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3 font-medium">
              <span>{job.prepTime}</span>
              <span>Jarak: {job.distance}</span>
            </div>

            <button
              onClick={() => handleTakeJob(job.id)}
              disabled={!isOnline || takenJobId === job.id}
              className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 ${
                takenJobId === job.id
                  ? 'bg-emerald-600 text-white'
                  : isOnline
                  ? 'bg-orange-600 hover:bg-orange-700 text-white active:scale-98'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {takenJobId === job.id ? (
                <>
                  <Check className="w-4 h-4" /> Order Berhasil Diambil!
                </>
              ) : (
                <>Ambil Order ({job.fee})</>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
