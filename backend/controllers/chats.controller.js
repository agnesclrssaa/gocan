const prisma = require('../src/lib/prisma');

const participantRoles = ['customer', 'canteen', 'canteen_staff', 'runner', 'courier'];
const conversationInclude = {
  participantOne: { select: { id: true, name: true, role: true } },
  participantTwo: { select: { id: true, name: true, role: true } },
  order: {
    select: {
      id: true,
      status: true,
      canteen: { select: { name: true } },
    },
  },
  messages: { take: 1, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] },
};

const roleLabel = (role) => {
  if (role === 'customer') return 'Customer';
  if (role === 'canteen' || role === 'canteen_staff') return 'Kantin';
  if (role === 'runner' || role === 'courier') return 'Kurir';
  return role;
};

const getConversationForUser = async (conversationId, userId) =>
  prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ participantOneId: userId }, { participantTwoId: userId }],
    },
    select: { id: true },
  });

const serializeConversation = (conversation, userId, unreadCount) => {
  const partner =
    conversation.participantOne.id === userId
      ? conversation.participantTwo
      : conversation.participantOne;
  const lastMessage = conversation.messages[0] || null;

  return {
    id: conversation.id,
    orderId: conversation.orderId,
    partner: {
      id: partner.id,
      name: partner.name,
      role: roleLabel(partner.role),
      accountRole: partner.role,
    },
    canteenName: conversation.order?.canteen?.name || null,
    status: conversation.order?.status || null,
    lastMessage: lastMessage?.content || '',
    lastMessageAt: lastMessage?.createdAt || conversation.updatedAt,
    unreadCount,
    updatedAt: conversation.updatedAt,
  };
};

const listChats = async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participantOneId: req.auth.userId },
          { participantTwoId: req.auth.userId },
        ],
      },
      include: {
        participantOne: { select: { id: true, name: true, role: true } },
        participantTwo: { select: { id: true, name: true, role: true } },
        order: {
          select: {
            id: true,
            status: true,
            canteen: { select: { name: true } },
          },
        },
        messages: {
          take: 1,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          select: { content: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const result = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: req.auth.userId },
            isRead: false,
          },
        });
        return serializeConversation(conversation, req.auth.userId, unreadCount);
      }),
    );

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const createChat = async (req, res, next) => {
  try {
    const targetUserId = Number(req.body?.targetUserId);
    const orderId =
      req.body?.orderId === undefined || req.body?.orderId === null || req.body?.orderId === ''
        ? null
        : Number(req.body.orderId);

    if (
      !Number.isSafeInteger(targetUserId) ||
      targetUserId <= 0 ||
      targetUserId === req.auth.userId ||
      (orderId !== null && (!Number.isSafeInteger(orderId) || orderId <= 0))
    ) {
      return res.status(400).json({ error: 'Peserta atau pesanan chat tidak valid.' });
    }

    const [currentUser, targetUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.auth.userId },
        select: { id: true, role: true, canteenId: true },
      }),
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true, role: true, canteenId: true },
      }),
    ]);

    if (
      !currentUser ||
      !targetUser ||
      !participantRoles.includes(currentUser.role) ||
      !participantRoles.includes(targetUser.role)
    ) {
      return res.status(404).json({ error: 'Pengguna chat tidak ditemukan.' });
    }

    const roles = [currentUser.role, targetUser.role];
    const isCustomerPartnerPair =
      roles.includes('customer') &&
      roles.some((role) => ['canteen', 'canteen_staff', 'runner', 'courier'].includes(role));
    if (!isCustomerPartnerPair) {
      return res.status(403).json({ error: 'Chat hanya tersedia antara Customer dan mitra pesanan.' });
    }

    if (orderId !== null) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          userId: true,
          customerId: true,
          canteenId: true,
          runnerId: true,
          courierId: true,
        },
      });
      if (!order) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
      }

      const customerId = order.customerId || order.userId;
      const pairIsOrderRelated =
        (currentUser.id === customerId &&
          targetUser.canteenId === order.canteenId) ||
        (targetUser.id === customerId &&
          currentUser.canteenId === order.canteenId) ||
        (currentUser.id === customerId &&
          [order.runnerId, order.courierId].includes(targetUser.id)) ||
        (targetUser.id === customerId &&
          [order.runnerId, order.courierId].includes(currentUser.id));
      if (!pairIsOrderRelated) {
        return res.status(403).json({ error: 'Pesanan ini tidak terkait dengan peserta chat.' });
      }
    }

    const participantOneId = Math.min(currentUser.id, targetUser.id);
    const participantTwoId = Math.max(currentUser.id, targetUser.id);
    const key = `${participantOneId}:${participantTwoId}:${orderId ?? 'direct'}`;
    const where = {
      participantOneId,
      participantTwoId,
      orderId,
    };

    let conversation = await prisma.conversation.findFirst({
      where,
      include: conversationInclude,
    });
    let created = false;

    if (!conversation) {
      try {
        conversation = await prisma.conversation.create({
          data: { key, participantOneId, participantTwoId, orderId },
          include: conversationInclude,
        });
        created = true;
      } catch (error) {
        if (error.code !== 'P2002') throw error;
        conversation = await prisma.conversation.findFirst({
          where,
          include: conversationInclude,
        });
        if (!conversation) throw error;
      }
    }

    return res.status(created ? 201 : 200).json({
      conversation: serializeConversation(conversation, req.auth.userId, 0),
    });
  } catch (error) {
    return next(error);
  }
};

const listMessages = async (req, res, next) => {
  try {
    const conversationId = Number(req.params.id);
    if (!Number.isSafeInteger(conversationId) || conversationId <= 0) {
      return res.status(400).json({ error: 'ID percakapan tidak valid.' });
    }

    const conversation = await getConversationForUser(conversationId, req.auth.userId);
    if (!conversation) {
      return res.status(404).json({ error: 'Percakapan tidak ditemukan.' });
    }

    const messages = await prisma.$transaction(async (transaction) => {
      await transaction.message.updateMany({
        where: {
          conversationId,
          senderId: { not: req.auth.userId },
          isRead: false,
        },
        data: { isRead: true },
      });
      return transaction.message.findMany({
        where: { conversationId },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          conversationId: true,
          senderId: true,
          content: true,
          isRead: true,
          createdAt: true,
        },
      });
    });

    return res.json(messages);
  } catch (error) {
    return next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const conversationId = Number(req.params.id);
    const content = req.body?.content;
    if (!Number.isSafeInteger(conversationId) || conversationId <= 0) {
      return res.status(400).json({ error: 'ID percakapan tidak valid.' });
    }
    if (typeof content !== 'string' || !content.trim() || content.trim().length > 4000) {
      return res.status(400).json({ error: 'Pesan wajib diisi dan maksimal 4000 karakter.' });
    }

    const conversation = await getConversationForUser(conversationId, req.auth.userId);
    if (!conversation) {
      return res.status(404).json({ error: 'Percakapan tidak ditemukan.' });
    }

    const message = await prisma.$transaction(async (transaction) => {
      const createdMessage = await transaction.message.create({
        data: {
          conversationId,
          senderId: req.auth.userId,
          content: content.trim(),
        },
        select: {
          id: true,
          conversationId: true,
          senderId: true,
          content: true,
          isRead: true,
          createdAt: true,
        },
      });
      await transaction.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: createdMessage.createdAt },
      });
      return createdMessage;
    });

    return res.status(201).json({ message });
  } catch (error) {
    return next(error);
  }
};

module.exports = { listChats, createChat, listMessages, sendMessage };
