import { CheckCircle2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';

export default function OrderSuccess() {
  const { orderId } = useParams();

  return (
    <div className="min-h-screen bg-[#F0F4F9] text-slate-800">
      <Navbar />
      <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-600" aria-hidden="true" />
        <h1 className="mt-5 text-3xl font-extrabold text-[#0A2E6E]">Pesanan Berhasil</h1>
        <p className="mt-3 text-sm text-slate-600">
          Pesanan Anda sudah tersimpan. Terima kasih telah menggunakan GoCan.
        </p>
        {orderId && (
          <p className="mt-2 text-sm font-bold text-slate-700">ID Pesanan: #{orderId}</p>
        )}
        <div className="mt-7">
          <Link
            to="/"
            className="rounded-xl bg-[#0A2E6E] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#082252]"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    </div>
  );
}
