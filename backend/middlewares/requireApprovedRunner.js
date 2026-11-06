const prisma = require('../src/lib/prisma');

const requireApprovedRunner = async (req, res, next) => {
  if (!['runner', 'courier'].includes(req.auth?.role)) return next();

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { approvalStatus: true },
    });
    if (user?.approvalStatus?.toUpperCase() !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        code: 'RUNNER_NOT_APPROVED',
        message: 'Akun Runner Anda belum disetujui oleh Admin.',
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = requireApprovedRunner;
