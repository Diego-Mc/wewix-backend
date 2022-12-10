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
        _sendGuestData(socket.adminId)
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

    socket.on('startConversation', ({ chatId, userId, adminId }) => {
      console.log('chatId, userId, adminId:', chatId, userId, adminId)
      if (adminId) {
        socket.userId = chatId
        // socket.userId = '123'
        _sendGuestData(socket.userId)
        return
      }

      socket.guestData = { userId, unread: 0 }
      socket.adminId = chatId
      // socket.adminId = '123'
      socket.userId = userId

      _sendGuestData(socket.adminId)
    })

    socket.on('activateChat', (guestId) => {
      socket.activeConversation = guestId
      _resetUnreadCount(guestId)
      _sendGuestData(socket.userId)
    })

    socket.on('leaveConversation', (chatId) => {
      socket.guestData = null
      _sendGuestData(chatId)
    })

    socket.on('addMsg', ({ msg, activeConversation }) => {
      console.log('msg:', msg)
      logger.info(
        `New chat msg from socket [id: ${socket.id}], emitting to topic ${socket.userId}`
      )

      msg.id = socket.userId

      if (!socket.adminId) {
        addMsgFromAdmin(msg, activeConversation, socket)
        return
      }

      _addMsgFromUser(msg, socket, socket.adminId)
      _sendGuestData(socket.adminId)
    }),
      socket.on('typing', (userId) => {
        if (socket.adminId)
          emitToUser({
            type: 'typing',
            data: userId,
            userId: socket.adminId,
          })
        //gIo.to(socket.adminId).emit('typing', userId);
        else gIo.to(socket.activeConversation).emit('typing', 'Admin')
      })

    // socket.on('manual-disconnect', () => {
    //   socket.close()
    // })
  })
}

async function addMsgFromAdmin(msg, guestId, adminSocket) {
  const guestSocket = await _getUserSocket(guestId)
  if (!guestSocket) return //ADD user MSg

  msg.isFromAdmin = true
  //   console.log('guestSocket:', guestSocket.guestData)
  if (guestSocket.guestData?.msgs) guestSocket.guestData.msgs.push(msg)
  else {
    guestSocket.guestData.msgs = [msg]
  }

  _sendGuestData(adminSocket.userId)
  guestSocket.emit('addAdminMsg', msg)
}

async function _addMsgFromUser(msg, guestSocket, adminId) {
  const adminSocket = await _getUserSocket(adminId)

  if (guestSocket.guestData?.msgs) guestSocket.guestData.msgs.push(msg)
  else guestSocket.guestData.msgs = [msg]

  if (adminSocket && adminSocket.activeConversation === guestSocket.userId)
    guestSocket.guestData.unread = 0
  else {
    guestSocket.guestData.unread++
  }

  msg.id = adminId
  //   msg.isFromAdmin = true
  guestSocket.emit('addOwnMsg', msg)
}

async function _sendGuestData(adminId) {
  const adminSocket = await _getUserSocket(adminId)

  if (!adminSocket) return

  let guests = await _getAllGuestsData()
  guests = guests.filter(
    (guest) => guest && guest.userId !== adminSocket.userId
  )
  adminSocket.emit('updateGuests', guests)
}

async function _resetUnreadCount(guestId) {
  const guest = await _getUserSocket(guestId)
  guest.guestData.unread = 0
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
async function _getAllSockets() {
  // return all Socket instances
  const sockets = await gIo.fetchSockets()
  return sockets
}

async function _getAllGuestsData() {
  // return all Socket instances
  const sockets = await gIo.fetchSockets()
  const data = sockets.map((s) => s.guestData)
  return data
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
