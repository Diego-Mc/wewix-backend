const express = require('express')
const { requireAuth, requireAdmin } = require('../../middlewares/requireAuth.middleware')
const { log } = require('../../middlewares/logger.middleware')
const { getWaps, getWapById, addWap, updateWap, removeWap, addWapMsg, removeWapMsg } = require('./wap.controller')
const router = express.Router()

// middleware that is specific to this router
// router.use(requireAuth)

router.get('/', log, getWaps)
router.get('/:id', getWapById)
// router.post('/', requireAuth, addWap)
router.post('/', addWap)
router.put('/:id', updateWap)
router.delete('/:id', removeWap)
// router.delete('/:id', requireAuth, requireAdmin, removeWap)

router.post('/:id/msg', addWapMsg)
router.delete('/:id/msg/:msgId', removeWapMsg)

module.exports = router