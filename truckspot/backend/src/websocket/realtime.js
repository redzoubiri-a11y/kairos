// Holds the Socket.IO instance so services can emit without importing the
// websocket bootstrap (which itself imports services).
let io = null;

function setIo(instance) {
  io = instance;
}

function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

function emitToMission(missionId, event, payload) {
  if (!io) return;
  io.to(`mission:${missionId}`).emit(event, payload);
}

function broadcast(event, payload) {
  if (!io) return;
  io.emit(event, payload);
}

module.exports = { setIo, emitToUser, emitToMission, broadcast };
