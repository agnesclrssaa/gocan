const nodemailer = require('nodemailer');

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character]);

const sendRunnerApprovalEmail = async ({ name, email, status, reason }) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM) {
    return {
      sent: false,
      message: 'Notifikasi email belum dikirim karena konfigurasi SMTP belum lengkap.',
    };
  }

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
  const safeName = escapeHtml(name);
  const approved = status === 'approved';
  const subject = approved
    ? 'Pendaftaran Campus Runner GoCan disetujui'
    : 'Pembaruan verifikasi pendaftaran Campus Runner GoCan';
  const content = approved
    ? `<p>Halo ${safeName},</p><p>Pendaftaran Campus Runner Anda telah disetujui. Anda kini dapat masuk ke portal Runner untuk menerima pesanan.</p><p>Panduan singkat: aktifkan status online, ambil pesanan yang tersedia, ambil makanan di kantin, lalu antar ke lokasi pemesan dan perbarui status pesanan setelah selesai.</p>`
    : `<p>Halo ${safeName},</p><p>Mohon maaf, pendaftaran Campus Runner Anda belum dapat disetujui.</p><p>Alasan: ${escapeHtml(reason)}</p><p>Silakan perbarui data dan berkas pada profil Runner untuk mengajukan verifikasi ulang.</p>`;

  await transport.sendMail({
    from: SMTP_FROM,
    to: email,
    subject,
    text: approved
      ? `Halo ${name}, pendaftaran Campus Runner Anda telah disetujui. Masuk ke portal Runner, aktifkan status online, ambil pesanan, ambil makanan di kantin, antar ke pemesan, lalu perbarui status pesanan.`
      : `Halo ${name}, pendaftaran Campus Runner Anda belum dapat disetujui. Alasan: ${reason}. Perbarui data dan berkas profil untuk mengajukan verifikasi ulang.`,
    html: content,
  });
  return { sent: true, message: 'Email notifikasi berhasil dikirim.' };
};

module.exports = { sendRunnerApprovalEmail };
