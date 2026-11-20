const nodemailer = require('nodemailer');

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character]);

const getSmtpConfig = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  const port = Number(SMTP_PORT);
  if (
    !SMTP_HOST ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !SMTP_USER ||
    !SMTP_PASSWORD ||
    !SMTP_FROM
  ) {
    return null;
  }

  return {
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    from: SMTP_FROM,
  };
};

const logEmailError = (error) => {
  console.error('Email error:', error instanceof Error ? error.message : String(error));
};

const sendRunnerApprovalEmail = async ({ name, email, status, reason }) => {
  const smtpConfig = getSmtpConfig();
  if (!smtpConfig) {
    console.log('Email sending skipped because SMTP configuration is incomplete.');
    return {
      sent: false,
      message: 'Notifikasi email belum dikirim karena konfigurasi SMTP belum lengkap.',
    };
  }

  try {
    const transport = nodemailer.createTransport(smtpConfig);
    const safeName = escapeHtml(name);
    const approved = status === 'approved';
    const subject = approved
      ? 'Pendaftaran Campus Runner GoCan disetujui'
      : 'Pembaruan verifikasi pendaftaran Campus Runner GoCan';
    const content = approved
      ? `<p>Halo ${safeName},</p><p>Pendaftaran Campus Runner Anda telah disetujui. Anda kini dapat masuk ke portal Runner untuk menerima pesanan.</p><p>Panduan singkat: aktifkan status online, ambil pesanan yang tersedia, ambil makanan di kantin, lalu antar ke lokasi pemesan dan perbarui status pesanan setelah selesai.</p>`
      : `<p>Halo ${safeName},</p><p>Mohon maaf, pendaftaran Campus Runner Anda belum dapat disetujui.</p><p>Alasan: ${escapeHtml(reason)}</p><p>Silakan perbarui data dan berkas pada profil Runner untuk mengajukan verifikasi ulang.</p>`;

    await transport.sendMail({
      from: smtpConfig.from,
      to: email,
      subject,
      text: approved
        ? `Halo ${name}, pendaftaran Campus Runner Anda telah disetujui. Masuk ke portal Runner, aktifkan status online, ambil pesanan, ambil makanan di kantin, antar ke pemesan, lalu perbarui status pesanan.`
        : `Halo ${name}, pendaftaran Campus Runner Anda belum dapat disetujui. Alasan: ${reason}. Perbarui data dan berkas profil untuk mengajukan verifikasi ulang.`,
      html: content,
    });
    return { sent: true, message: 'Email notifikasi berhasil dikirim.' };
  } catch (error) {
    logEmailError(error);
    return { sent: false, message: 'Email notifikasi gagal dikirim.' };
  }
};

const sendPasswordResetEmail = async ({ name, email, otp }) => {
  const smtpConfig = getSmtpConfig();
  if (!smtpConfig) {
    console.log('Email sending skipped because SMTP configuration is incomplete.');
    return { sent: false, message: 'Konfigurasi email belum tersedia.' };
  }

  try {
    const transport = nodemailer.createTransport(smtpConfig);
    const safeName = escapeHtml(name);
    await transport.sendMail({
      from: smtpConfig.from,
      to: email,
      subject: 'Kode OTP reset password GoCan',
      text: `Halo ${name}, kode OTP untuk reset password GoCan Anda adalah ${otp}. Kode ini berlaku selama 15 menit. Jika Anda tidak meminta reset password, abaikan email ini.`,
      html: `<p>Halo ${safeName},</p><p>Kode OTP untuk reset password GoCan Anda:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${otp}</p><p>Kode ini berlaku selama 15 menit. Jika Anda tidak meminta reset password, abaikan email ini.</p>`,
    });
    return { sent: true, message: 'Email OTP berhasil dikirim.' };
  } catch (error) {
    logEmailError(error);
    return { sent: false, message: 'Email OTP gagal dikirim.' };
  }
};

module.exports = { sendPasswordResetEmail, sendRunnerApprovalEmail };
