
// import { storageService } from './async-storage.service.js'
import { httpService } from './http.service.js'
import { utilService } from './util.service.js'
import { userService } from './user.service.js'


const STORAGE_KEY = 'wap'

export const wapService = {
    query,
    getById,
    save,
    remove,
    getEmptyWap,
    addWapMsg
}
window.cs = wapService


async function query(filterBy = { txt: '', price: 0 }) {
    return httpService.get(STORAGE_KEY, filterBy)

    // var waps = await storageService.query(STORAGE_KEY)
    // if (filterBy.txt) {
    //     const regex = new RegExp(filterBy.txt, 'i')
    //     waps = waps.filter(wap => regex.test(wap.vendor) || regex.test(wap.description))
    // }
    // if (filterBy.price) {
    //     waps = waps.filter(wap => wap.price <= filterBy.price)
    // }
    // return waps

}
function getById(wapId) {
    // return storageService.get(STORAGE_KEY, wapId)
    return httpService.get(`wap/${wapId}`)
}

async function remove(wapId) {
    // await storageService.remove(STORAGE_KEY, wapId)
    return httpService.delete(`wap/${wapId}`)
}
async function save(wap) {
    var savedWap
    if (wap._id) {
        // savedWap = await storageService.put(STORAGE_KEY, wap)
        savedWap = await httpService.put(`wap/${wap._id}`, wap)

    } else {
        // Later, owner is set by the backend
        // wap.owner = userService.getLoggedinUser()
        // savedWap = await storageService.post(STORAGE_KEY, wap)
        savedWap = await httpService.post('wap', wap)
    }
    return savedWap
}

async function addWapMsg(wapId, txt) {
    // const wap = await getById(wapId)
    // if (!wap.msgs) wap.msgs = []

    // const msg = {
    //     id: utilService.makeId(),
    //     by: userService.getLoggedinUser(),
    //     txt
    // }
    // wap.msgs.push(msg)
    // await storageService.put(STORAGE_KEY, wap)    
    const savedMsg = await httpService.post(`wap/${wapId}/msg`, {txt})
    return savedMsg
}


function getEmptyWap() {
    return {
        // vendor: 'Susita-' + (Date.now() % 1000),
        // price: utilService.getRandomIntInclusive(1000, 9000),
    }
}





