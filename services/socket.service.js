const logger = require('./logger.service')

var gIo = null

function setupSocketAPI(http) {
  var users = []

  gIo = require('socket.io')(http, {
    cors: {
      origin: '*',
    },
  })

  gIo.on('connection', (socket) => {
    logger.info(`New connected socket [id: ${socket.id}]`)
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected [id: ${socket.id}]`)
      if (socket.wapId) {
        socket.broadcast.to(socket.wapId)
      }
      if (socket.guestData) {
        _sendGuestDataTo(socket.guestData.to)
        return
      }
    })

    socket.on('formSubmited', (setMsg) => {
      socket.broadcast.emit('formSent', setMsg)

      // socket.broadcast.to(socket.wapId).emit('mouseEvent', sendedCursor)
    })

    socket.on('joinWorkSpace', ({ wapId, cursorId }) => {
      if (!socket.cursorId) socket.cursorId = cursorId
      if (socket.wapId === wapId) return
      if (socket.wapId) {
        socket.leave(socket.wapId)
        logger.info(
          `Socket is leaving topic ${socket.wapId} [id: ${socket.id}]`
        )
      }

      socket.join(wapId)
      socket.wapId = wapId
    })

    socket.on('mouseEvent', (sendedCursor) => {
      socket.broadcast.to(socket.wapId).emit('mouseEvent', sendedCursor)
    })

    socket.on('cmpChange', (wap) => {
      socket.broadcast.to(socket.wapId).emit('cmpChange', wap)
    })

    socket.on('doDisconnect', () => {
      if (socket.wapId) {
        socket.broadcast
          .to(socket.wapId)
          .emit('userDisconnected', socket.cursorId)
      }
    })

    socket.on('joinChat', ({ fromWap, guestId, adminRoom, isOwner }) => {
      if (isOwner) {
        socket.adminRoom = adminRoom
        socket.adminChatWith = ''
        _sendGuestDataTo(adminRoom)
        return
      }

      socket.guestData = {}
      socket.guestData.msgs = []
      socket.guestData.to = adminRoom
      socket.guestData.fromWap = fromWap
      socket.guestData.guestId = guestId
      socket.guestData.createdAt = Date.now()


      socket.guestData.unread = 0
    })

    socket.on('addMsg', (msg) => {
      if (socket.adminRoom) {
        _sendMsgToGuest(socket.adminChatWith, msg)
        _sendGuestDataTo(socket.adminRoom)
        return
      }

      socket.guestData.unread++
      socket.guestData.msgs.push(msg)

      _sendGuestDataTo(socket.guestData.to)
      socket.emit('updateGuestMsgs', socket.guestData.msgs)
    })

    socket.on('adminChatWith', (guestId) => {
      socket.adminChatWith = guestId
    })

    socket.on('typing', () => {
      if (socket.adminRoom) {
        _sendAdminTyping(socket.adminChatWith)
        return
      }

      _sendGuestTyping(socket.guestData.to, socket.guestData.guestId)
    })
  })
}

async function _sendGuestDataTo(adminRoom) {
  const adminSocket = await _getSocketByAdminRoom(adminRoom)
  if (!adminSocket) return

  const guestsData = await _getAllGuestsData()

  //Clearing unread from 'adminChatWith' Guest
  if (adminSocket.adminChatWith) {
    chatWithGuestData = guestsData.find(({ guestId }) => guestId === adminSocket.adminChatWith)
    if (chatWithGuestData) chatWithGuestData.unread = 0
  }

  adminSocket.emit('updateAdminGuestData', guestsData)
}

async function _sendMsgToGuest(guestId, msg) {
  const guestSocket = await _getGuestSocket(guestId)
  if (!guestSocket) return

  guestSocket.guestData.msgs.push(msg)
  guestSocket.emit('updateGuestMsgs', guestSocket.guestData.msgs)
}

async function _sendAdminTyping(guestId) {
  const guestSocket = await _getGuestSocket(guestId)
  if (!guestSocket) return

  guestSocket.emit('initTyping')
}

async function _sendGuestTyping(adminRoom, guestId) {
  const adminSocket = await _getSocketByAdminRoom(adminRoom)
  if (!adminSocket) return

  adminSocket.emit('initTyping', guestId)
}

function emitTo({ type, data, label }) {
  if (label) gIo.to('watching:' + label.toString()).emit(type, data)
  else gIo.emit(type, data)
}

async function emitToUser({ type, data, userId }) {
  userId = userId.toString()
  const socket = await _getUserSocket(userId)

  if (socket) {
    logger.info(
      `Emiting event: ${type} to user: ${userId} socket [id: ${socket.id}]`
    )
    socket.emit(type, data)
  } else {
    logger.info(`No active socket for user: ${userId}`)
    // _printSockets()
  }
}

// If possible, send to all sockets BUT not the current socket
// Optionally, broadcast to a room / to all
async function broadcast({ type, data, room = null, userId }) {
  userId = userId.toString()

  logger.info(`Broadcasting event: ${type}`)
  const excludedSocket = await _getUserSocket(userId)
  if (room && excludedSocket) {
    logger.info(`Broadcast to room ${room} excluding user: ${userId}`)
    excludedSocket.broadcast.to(room).emit(type, data)
  } else if (excludedSocket) {
    logger.info(`Broadcast to all excluding user: ${userId}`)
    excludedSocket.broadcast.emit(type, data)
  } else if (room) {
    logger.info(`Emit to room: ${room}`)
    gIo.to(room).emit(type, data)
  } else {
    logger.info(`Emit to all`)
    gIo.emit(type, data)
  }
}

async function _getUserSocket(userId) {
  const sockets = await _getAllSockets()
  const socket = sockets.find((s) => s.userId === userId)
  return socket
}

async function _getSocketByAdminRoom(adminRoom) {
  const sockets = await _getAllSockets()
  const socket = sockets.find((s) => s.adminRoom === adminRoom)
  return socket
}

async function _getGuestSocket(guestId) {
  const sockets = await _getAllSockets()
  const socket = sockets.find((s) => s.guestData?.guestId === guestId)
  return socket
}

async function _getAllSockets() {
  // return all Socket instances
  const sockets = await gIo.fetchSockets()
  return sockets
}

async function _getAllGuestsData() {
  const sockets = await gIo.fetchSockets()
  const guestsData = sockets
    .map((s) => {
      return s.guestData
    })
    .filter((data) => data)
  return guestsData
}

async function _printSockets() {
  const sockets = await _getAllSockets()
  console.log(`Sockets: (count: ${sockets.length}):`)
  sockets.forEach(_printSocket)
}
function _printSocket(socket) {
  console.log(`Socket - socketId: ${socket.id} userId: ${socket.userId}`)
}

module.exports = {
  // set up the sockets service and define the API
  setupSocketAPI,
  // emit to everyone / everyone in a specific room (label)
  emitTo,
  // emit to a specific user (if currently active in system)
  emitToUser,
  // Send to all sockets BUT not the current socket - if found
  // (otherwise broadcast to a room / to all)
  broadcast,
}
