const express = require('express')
const {requireAuth, requireAdmin} = require('../../middlewares/requireAuth.middleware')
const {log} = require('../../middlewares/logger.middleware')
const {addUserWap, getUserWaps, deleteUserWap} = require('./userWap.controller')
const router = express.Router()

// middleware that is specific to this router
// router.use(requireAuth)

router.get('/', log, getUserWaps)
router.post('/',  log, requireAuth, addUserWap)
router.delete('/:id',  requireAuth, deleteUserWap)

module.exports = router