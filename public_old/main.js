import { wapService } from './services/wap.service.local.js'
import { userService } from './services/user.service.js'
import { utilService } from './services/util.service.js'

console.log('Simple driver to test some API calls')

window.onLoadWaps = onLoadWaps
window.onLoadUsers = onLoadUsers
window.onAddWap = onAddWap
window.onGetWapById = onGetWapById
window.onRemoveWap = onRemoveWap
window.onAddWapMsg = onAddWapMsg

async function onLoadWaps() {
  const waps = await wapService.query()
  render('Waps', waps)
}
async function onLoadUsers() {
  const users = await userService.query()
  render('Users', users)
}

async function onGetWapById() {
  const id = prompt('Wap id?')
  if (!id) return
  const wap = await wapService.getById(id)
  render('Wap', wap)
}

async function onRemoveWap() {
  const id = prompt('Wap id?')
  if (!id) return
  await wapService.remove(id)
  render('Removed Wap')
}

async function onAddWap() {
  await userService.login({ username: 'muki', password: '123' })
  const savedWap = await wapService.save(wapService.getEmptyWap())
  render('Saved Wap', savedWap)
}

async function onAddWapMsg() {
  await userService.login({ username: 'muki', password: '123' })
  const id = prompt('Wap id?')
  if (!id) return

  const savedMsg = await wapService.addWapMsg(id, 'some msg')
  render('Saved Msg', savedMsg)
}

function render(title, mix = '') {
  console.log(title, mix)
  const output = utilService.prettyJSON(mix)
  document.querySelector('h2').innerText = title
  document.querySelector('pre').innerHTML = output
}
