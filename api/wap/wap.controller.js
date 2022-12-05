const wapService = require('./wap.service.js')

const logger = require('../../services/logger.service')

async function getWaps(req, res) {
  try {
    logger.debug('Getting Waps')
    const filterBy = {
      txt: req.query.txt || '',
    }
    const waps = await wapService.query(filterBy)
    res.json(waps)
  } catch (err) {
    logger.error('Failed to get waps', err)
    res.status(500).send({ err: 'Failed to get waps' })
  }
}

async function getWapById(req, res) {
  try {
    const wapId = req.params.id
    const wap = await wapService.getById(wapId)
    res.json(wap)
  } catch (err) {
    logger.error('Failed to get wap', err)
    res.status(500).send({ err: 'Failed to get wap' })
  }
}

async function addWap(req, res) {
  const { loggedinUser } = req

  try {
    const wap = req.body
    wap.owner = loggedinUser
    const addedWap = await wapService.add(wap)
    res.json(addedWap)
  } catch (err) {
    logger.error('Failed to add wap', err)
    res.status(500).send({ err: 'Failed to add wap' })
  }
}

async function updateWap(req, res) {
  try {
    const wap = req.body
    const updatedWap = await wapService.update(wap)
    res.json(updatedWap)
  } catch (err) {
    logger.error('Failed to update wap', err)
    res.status(500).send({ err: 'Failed to update wap' })
  }
}

async function removeWap(req, res) {
  try {
    const wapId = req.params.id
    const removedId = await wapService.remove(wapId)
    res.send(removedId)
  } catch (err) {
    logger.error('Failed to remove wap', err)
    res.status(500).send({ err: 'Failed to remove wap' })
  }
}

async function addWapMsg(req, res) {
  const { loggedinUser } = req
  try {
    const wapId = req.params.id
    const msg = {
      txt: req.body.txt,
      by: loggedinUser,
    }
    const savedMsg = await wapService.addWapMsg(wapId, msg)
    res.json(savedMsg)
  } catch (err) {
    logger.error('Failed to update wap', err)
    res.status(500).send({ err: 'Failed to update wap' })
  }
}

async function removeWapMsg(req, res) {
  const { loggedinUser } = req
  try {
    const wapId = req.params.id
    const { msgId } = req.params

    const removedId = await wapService.removeWapMsg(wapId, msgId)
    res.send(removedId)
  } catch (err) {
    logger.error('Failed to remove wap msg', err)
    res.status(500).send({ err: 'Failed to remove wap msg' })
  }
}

module.exports = {
  getWaps,
  getWapById,
  addWap,
  updateWap,
  removeWap,
  addWapMsg,
  removeWapMsg,
}
