const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const ObjectId = require('mongodb').ObjectId
const asyncLocalStorage = require('../../services/als.service')

async function query(filterBy = {}) {
    try {
        const criteria = _buildCriteria(filterBy)
        const collection = await dbService.getCollection('userWap')
        // const userWaps = await collection.find(criteria).toArray()
        var userWaps = await collection.aggregate([
            {
                $match: criteria
            },
            {
                $lookup:
                {
                    localField: 'byUserId',
                    from: 'user',
                    foreignField: '_id',
                    as: 'byUser'
                }
            },
            {
                $unwind: '$byUser'
            },
            {
                $lookup:
                {
                    localField: 'aboutUserId',
                    from: 'user',
                    foreignField: '_id',
                    as: 'aboutUser'
                }
            },
            {
                $unwind: '$aboutUser'
            }
        ]).toArray()
        userWaps = userWaps.map(userWap => {
            userWap.byUser = { _id: userWap.byUser._id, fullname: userWap.byUser.fullname }
            userWap.aboutUser = { _id: userWap.aboutUser._id, fullname: userWap.aboutUser.fullname }
            delete userWap.byUserId
            delete userWap.aboutUserId
            return userWap
        })

        return userWaps
    } catch (err) {
        logger.error('cannot find userWaps', err)
        throw err
    }

}

async function remove(userWapId) {
    try {
        const store = asyncLocalStorage.getStore()
        const { loggedinUser } = store
        const collection = await dbService.getCollection('userWap')
        // remove only if user is owner/admin
        const criteria = { _id: ObjectId(userWapId) }
        if (!loggedinUser.isAdmin) criteria.byUserId = ObjectId(loggedinUser._id)
        const {deletedCount} = await collection.deleteOne(criteria)
        return deletedCount
    } catch (err) {
        logger.error(`cannot remove userWap ${userWapId}`, err)
        throw err
    }
}


async function add(userWap) {
    try {
        const userWapToAdd = {
            byUserId: ObjectId(userWap.byUserId),
            aboutUserId: ObjectId(userWap.aboutUserId),
            txt: userWap.txt
        }
        const collection = await dbService.getCollection('userWap')
        await collection.insertOne(userWapToAdd)
        return userWapToAdd
    } catch (err) {
        logger.error('cannot insert userWap', err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {}
    if (filterBy.byUserId) criteria.byUserId = filterBy.byUserId
    return criteria
}

module.exports = {
    query,
    remove,
    add
}


