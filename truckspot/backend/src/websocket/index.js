const { Server } = require('socket.io');
const env = require('../config/env');
const prisma = require('../config/prisma');
const { verifyToken } = require('../middleware/auth');
const realtime = require('./realtime');
const chatService = require('../services/chat.service');
const missionService = require('../services/mission.service');
const truckService = require('../services/truck.service');

function initWebSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.corsOrigins.includes('*') ? true : env.corsOrigins, credentials: true },
    pingTimeout: 30000,
  });

  // Handshake auth: socket.handshake.auth.token = "<jwt>"
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Token manquant'));

      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        include: { transporter: { select: { id: true, verificationStatus: true } } },
      });
      if (!user || !user.isActive) return next(new Error('Compte introuvable ou desactive'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Token invalide ou expire'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket;
    socket.join(`user:${user.id}`);
    socket.emit('connected', { userId: user.id, role: user.role });

    // Join a mission room to receive its chat stream.
    socket.on('mission:join', async (missionId, ack) => {
      try {
        await missionService.getAccessible(user, missionId);
        socket.join(`mission:${missionId}`);
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on('mission:leave', (missionId) => {
      socket.leave(`mission:${missionId}`);
    });

    socket.on('chat:send', async (payload, ack) => {
      try {
        const message = await chatService.send(user, {
          missionId: payload?.missionId,
          content: String(payload?.content ?? '').trim(),
        });
        ack?.({ ok: true, message });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on('chat:typing', ({ missionId }) => {
      socket.to(`mission:${missionId}`).emit('chat:typing', { missionId, userId: user.id });
    });

    // Live truck tracking pushed by the transporter app.
    socket.on('truck:position', async (payload, ack) => {
      try {
        if (user.role !== 'TRANSPORTER') throw new Error('Reserve aux transporteurs');
        const truck = await truckService.updatePosition(user.id, payload.truckId, {
          latitude: Number(payload.latitude),
          longitude: Number(payload.longitude),
          isAvailable: payload.isAvailable,
        });
        ack?.({ ok: true, truck });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on('disconnect', () => {
      // Rooms are cleaned up by Socket.IO automatically.
    });
  });

  realtime.setIo(io);
  return io;
}

module.exports = { initWebSocket };
