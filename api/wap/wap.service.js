const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const utilService = require('../../services/util.service')
const ObjectId = require('mongodb').ObjectId

async function query(filterBy = { txt: '' }) {
    try {
        const collection = await dbService.getCollection('wap')
        var waps = await collection.find(criteria).toArray()
        return waps
    } catch (err) {
        logger.error('cannot find waps', err)
        throw err
    }
}
async function getUserWaps(userWapIds) {
    try {
        userWapIds = userWapIds.map(_id => ObjectId(_id))
        const collection = await dbService.getCollection('wap')
        const waps = await collection.find({ "_id": { "$in": userWapIds } }).toArray()
        return waps.map((wap) => {
            return {
                _id: wap._id,
                name: wap.name,
                usersData: wap.usersData,
                createdAt: wap.createdAt,
                visits: wap.visits,
            }
        })
    } catch (err) {
        logger.error('cannot find waps', err)
        throw err
    }
}

async function getById(wapId) {
    try {
        const collection = await dbService.getCollection('wap')
        const wap = collection.findOne({ _id: ObjectId(wapId) })
        return wap
    } catch (err) {
        logger.error(`while finding wap ${wapId}`, err)
        throw err
    }
}
async function getByName(wapName) {
    try {
        const collection = await dbService.getCollection('wap')
        const wap = collection.findOne({ name: wapName })
        return wap
    } catch (err) {
        logger.error(`while finding wap ${wapId}`, err)
        throw err
    }
}

async function remove(wapId) {
    try {
        const collection = await dbService.getCollection('wap')
        await collection.deleteOne({ _id: ObjectId(wapId) })
        return wapId
    } catch (err) {
        logger.error(`cannot remove wap ${wapId}`, err)
        throw err
    }
}

async function add(wap) {
    try {
        const collection = await dbService.getCollection('wap')
        await collection.insertOne(wap)
        return wap
    } catch (err) {
        logger.error('cannot insert wap', err)
        throw err
    }
}

async function update(wap) {
    try {

        const wapToSave = {
            // vendor: wap.vendor,
            // price: wap.price
        }

        wap._id = ObjectId(wap._id)
        const collection = await dbService.getCollection('wap')
        await collection.updateOne({ _id: wap._id }, { $set: wap })
        return wap
    } catch (err) {
        logger.error(`cannot update wap ${wapId}`, err)
        throw err
    }
}

async function addWapMsg(wapId, msg) {
    try {
        msg.id = utilService.makeId()
        const collection = await dbService.getCollection('wap')
        await collection.updateOne({ _id: ObjectId(wapId) }, { $push: { msgs: msg } })
        return msg
    } catch (err) {
        logger.error(`cannot add wap msg ${wapId}`, err)
        throw err
    }
}

async function removeWapMsg(wapId, msgId) {
    try {
        const collection = await dbService.getCollection('wap')
        await collection.updateOne({ _id: ObjectId(wapId) }, { $pull: { msgs: { id: msgId } } })
        return msgId
    } catch (err) {
        logger.error(`cannot add wap msg ${wapId}`, err)
        throw err
    }
}

module.exports = {
    remove,
    query,
    getById,
    add,
    update,
    addWapMsg,
    removeWapMsg,
    getByName,
    getUserWaps
}
