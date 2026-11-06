const { createHash, createHmac, randomBytes, timingSafeEqual } = require('crypto');

const getQrSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET harus diatur untuk menandatangani E-Ticket.');
  }
  return secret;
};

const createPickupQrCode = ({ orderId, userId, issuedAt = Date.now() }) => {
  const payload = Buffer.from(JSON.stringify({
    orderId,
    userId,
    issuedAt,
    nonce: randomBytes(16).toString('hex'),
  })).toString('base64url');
  const signature = createHmac('sha256', getQrSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
};

const verifyMidtransNotification = (notification, serverKey) => {
  const {
    order_id: orderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    signature_key: signature,
  } = notification || {};
  if (
    typeof orderId !== 'string' ||
    typeof statusCode !== 'string' ||
    typeof grossAmount !== 'string' ||
    typeof signature !== 'string'
  ) {
    return false;
  }

  const expected = createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest('hex');
  const suppliedBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer);
};

module.exports = { createPickupQrCode, verifyMidtransNotification };
