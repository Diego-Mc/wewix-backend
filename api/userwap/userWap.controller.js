const logger = require('../../services/logger.service')
const userService = require('../user/user.service')
const authService = require('../auth/auth.service')
const socketService = require('../../services/socket.service')
const userWapService = require('./userWap.service')

async function getUserWaps(req, res) {
    try {
        const userWaps = await userWapService.query(req.query)
        res.send(userWaps)
    } catch (err) {
        logger.error('Cannot get userWaps', err)
        res.status(500).send({ err: 'Failed to get userWaps' })
    }
}

async function deleteUserWap(req, res) {
    try {
        const deletedCount = await userWapService.remove(req.params.id)
        if (deletedCount === 1) {
            res.send({ msg: 'Deleted successfully' })
        } else {
            res.status(400).send({ err: 'Cannot remove userWap' })
        }
    } catch (err) {
        logger.error('Failed to delete userWap', err)
        res.status(500).send({ err: 'Failed to delete userWap' })
    }
}


async function addUserWap(req, res) {
    
    var {loggedinUser} = req
 
    try {
        var userWap = req.body
        userWap.byUserId = loggedinUser._id
        userWap = await userWapService.add(userWap)
        
        // prepare the updated userWap for sending out
        userWap.aboutUser = await userService.getById(userWap.aboutUserId)
        
        // Give the user credit for adding a userWap
        // var user = await userService.getById(userWap.byUserId)

        loggedinUser = await userService.update(loggedinUser)
        userWap.byUser = loggedinUser

        // User info is saved also in the login-token, update it
        const loginToken = authService.getLoginToken(loggedinUser)
        res.cookie('loginToken', loginToken)

        delete userWap.aboutUserId
        delete userWap.byUserId

        socketService.broadcast({type: 'userWap-added', data: userWap, userId: loggedinUser._id})
        socketService.emitToUser({type: 'userWap-about-you', data: userWap, userId: userWap.aboutUser._id})
        
        const fullUser = await userService.getById(loggedinUser._id)
        socketService.emitTo({type: 'user-updated', data: fullUser, label: fullUser._id})

        res.send(userWap)

    } catch (err) {
        logger.error('Failed to add userWap', err)
        res.status(500).send({ err: 'Failed to add userWap' })
    }
}

module.exports = {
    getUserWaps,
    deleteUserWap,
    addUserWap
}