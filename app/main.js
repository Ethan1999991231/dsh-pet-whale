// 大肥鱼桌宠 · 独立桌面版（Electron）
// 一个铺满屏幕的透明置顶窗口，里面只放她；鼠标不在她身上时整窗穿透。

// ---------------------------------------------------------------------------
// 打包后的 exe 没有控制台，stdout 是断的：任何 console 写入都会抛
// EPIPE: broken pipe —— Electron 自己转发渲染进程报错时也会 console.warn，
// 于是整条鱼就弹一个 "A JavaScript error occurred in the main process"。
// 这里先把 stdout 的错误接住，再把 console 换成不会炸的版本（顺带落一份日志）。
// ---------------------------------------------------------------------------
try { process.stdout.on('error', () => {}) } catch { /* 没有 stdout 就算了 */ }
try { process.stderr.on('error', () => {}) } catch { /* 同上 */ }

;(function 安控制台() {
  const nodeFs = require('node:fs')
  const nodePath = require('node:path')
  const nodeOs = require('node:os')
  let 流 = null

  function 拿流() {
    if (流) return 流
    try {
      const 目录 = nodePath.join(process.env.APPDATA || nodePath.join(nodeOs.homedir(), 'AppData', 'Roaming'), '大肥鱼桌宠')
      nodeFs.mkdirSync(目录, { recursive: true })
      流 = nodeFs.createWriteStream(nodePath.join(目录, 'pet.log'), { flags: 'a' })
      流.on('error', () => { 流 = null })
    } catch {
      流 = null
    }
    return 流
  }

  const 串 = (x) => {
    if (typeof x === 'string') return x
    if (x instanceof Error) return x.stack || x.message || String(x)
    try { return JSON.stringify(x) } catch { return String(x) }
  }

  for (const 名 of ['log', 'info', 'warn', 'error', 'debug', 'trace']) {
    const 原 = typeof console[名] === 'function' ? console[名].bind(console) : null
    console[名] = function (...a) {
      // 有控制台就照常打印，但绝不让它把进程带崩
      if (原) { try { 原(...a) } catch { /* 管道断了 */ } }
      try {
        const s = 拿流()
        if (s) s.write('[' + new Date().toISOString() + '] ' + 名 + ' ' + a.map(串).join(' ') + '\n')
      } catch { /* 日志写不进去也不影响她 */ }
    }
  }
})()

// 有没有都别弹框：托盘还在，她能继续待着
process.on('uncaughtException', (err) => {
  try { console.error('[uncaught]', err) } catch { /* 忽略 */ }
})
process.on('unhandledRejection', (err) => {
  try { console.error('[unhandled]', err) } catch { /* 忽略 */ }
})

const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, shell } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { 起服务 } = require('./server.js')

const 资源目录 = path.join(__dirname, 'assets')
const 配置文件 = () => path.join(app.getPath('userData'), 'config.json')
const 自定义目录 = () => path.join(app.getPath('userData'), 'custom')

let 配置 = { apiKey: '', autoStart: false }
let win = null
let tray = null
let 服务 = null
let keyWin = null
let 已退出 = false

function 读配置() {
  try {
    const j = JSON.parse(fs.readFileSync(配置文件(), 'utf8'))
    配置 = { apiKey: '', autoStart: false, ...j }
  } catch {
    配置 = { apiKey: '', autoStart: false }
  }
}

function 存配置() {
  try {
    fs.mkdirSync(path.dirname(配置文件()), { recursive: true })
    fs.writeFileSync(配置文件(), JSON.stringify(配置, null, 2), 'utf8')
  } catch (err) {
    console.error('[pet] 存配置失败', err)
  }
}

function 建窗口() {
  const 屏 = screen.getPrimaryDisplay().bounds
  win = new BrowserWindow({
    x: 屏.x,
    y: 屏.y,
    width: 屏.width,
    height: 屏.height,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    alwaysOnTop: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false,
      spellcheck: false,
    },
  })

  win.setAlwaysOnTop(true, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  // 先全穿透；页面里鼠标一碰到她就切回可点
  win.setIgnoreMouseEvents(true, { forward: true })

  const base = 'http://127.0.0.1:' + 服务.port
  win.loadFile(path.join(__dirname, 'ui', 'index.html'), { search: 'base=' + encodeURIComponent(base) })

  win.once('ready-to-show', () => {
    win.showInactive()
    win.setIgnoreMouseEvents(true, { forward: true })
  })

  // 她被打断焦点（比如 Alt+Tab）后一律回到穿透，免得整屏吃掉点击
  win.on('blur', () => {
    if (win && !win.isDestroyed()) win.setIgnoreMouseEvents(true, { forward: true })
  })

  win.on('closed', () => { win = null })

  // 调试用：PET_WHALE_SHOT=1 时启动几秒后把窗口内容存成 png 再退出
  if (process.env.PET_WHALE_SHOT) {
    setTimeout(async () => {
      try {
        const img = await win.capturePage()
        const 目录 = path.join(__dirname, 'preview')
        fs.mkdirSync(目录, { recursive: true })
        fs.writeFileSync(path.join(目录, 'shot.png'), img.toPNG())
      } catch (e) {
        try {
          const 目录 = path.join(__dirname, 'preview')
          fs.mkdirSync(目录, { recursive: true })
          fs.writeFileSync(path.join(目录, 'shot.err.txt'), String(e && e.stack), 'utf8')
        } catch { /* 忽略 */ }
      } finally {
        setTimeout(() => app.exit(0), 300)
      }
    }, 4500)
  }
}

function 建托盘() {
  const 图标路径 = path.join(__dirname, 'build', 'tray.png')
  let img = nativeImage.createFromPath(图标路径)
  if (img.isEmpty()) img = nativeImage.createEmpty()
  tray = new Tray(img.resize({ width: 16, height: 16 }))
  tray.setToolTip('大肥鱼桌宠')

  const 菜单 = () =>
    Menu.buildFromTemplate([
      { label: '打开设置（S）', click: 开设置面板 },
      { type: 'separator' },
      { label: 配置.apiKey ? '设置 API Key（已设置）…' : '设置 API Key…', click: 开Key窗 },
      { label: '清掉 API Key', click: () => { 配置.apiKey = ''; 存配置(); 刷新托盘() } },
      { type: 'separator' },
      {
        label: '开机自启',
        type: 'checkbox',
        checked: !!配置.autoStart,
        click: (it) => {
          配置.autoStart = !!it.checked
          存配置()
          app.setLoginItemSettings({ openAtLogin: 配置.autoStart, path: process.execPath })
        },
      },
      { label: '把她叫回来（居中）', click: 叫回来 },
      { type: 'separator' },
      { label: '大肥鱼 GitHub', click: () => shell.openExternal('https://github.com/Ethan1999991231/dsh-pet-whale') },
      { label: '退出', click: () => { 已退出 = true; app.quit() } },
    ])

  const 刷 = () => tray.setContextMenu(菜单())
  刷()
  tray.on('click', 开设置面板)
  刷新托盘 = 刷
}

let 刷新托盘 = () => {}

function 开设置面板() {
  if (!win || win.isDestroyed()) return
  win.webContents.executeJavaScript('window.__dpwOpenSettings && window.__dpwOpenSettings(true)').catch(() => {})
}

function 叫回来() {
  if (!win || win.isDestroyed()) return
  win.webContents.executeJavaScript('window.__dpwHome && window.__dpwHome()').catch(() => {})
}

function 开Key窗() {
  if (keyWin && !keyWin.isDestroyed()) { keyWin.focus(); return }
  keyWin = new BrowserWindow({
    width: 420,
    height: 200,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: '设置 DeepSeek API Key',
    parent: undefined,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  keyWin.setMenuBarVisibility(false)
  keyWin.loadFile(path.join(__dirname, 'ui', 'key.html'))
  keyWin.on('closed', () => { keyWin = null })
}

ipcMain.on('pet:penetrate', (_e, 穿透) => {
  if (!win || win.isDestroyed()) return
  win.setIgnoreMouseEvents(!!穿透, { forward: true })
})

ipcMain.on('pet:openSet', () => 开设置面板())

ipcMain.handle('pet:getKey', () => String(配置.apiKey || ''))

ipcMain.handle('pet:setKey', (_e, k) => {
  配置.apiKey = String(k || '').trim()
  存配置()
  刷新托盘()
  return { ok: true, has: !!配置.apiKey }
})

ipcMain.handle('pet:hasKey', () => !!配置.apiKey)

ipcMain.handle('pet:closeKeyWin', () => {
  if (keyWin && !keyWin.isDestroyed()) keyWin.close()
  return true
})

const 单例 = app.requestSingleInstanceLock()
if (!单例) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (win && !win.isDestroyed()) { win.showInactive() }
  })

  app.whenReady().then(async () => {
    app.setAppUserModelId('com.ethan.dshpetwhale')
    读配置()
    if (配置.autoStart) app.setLoginItemSettings({ openAtLogin: true, path: process.execPath })

    服务 = await 起服务({
      资源目录,
      自定义目录: 自定义目录(),
      取Key: () => 配置.apiKey,
      取配置: () => {
        try { return fs.readFileSync(配置文件(), 'utf8') } catch { return '{}' }
      },
    })

    // 把端口落一份，方便排查（也方便我远程看一眼她活着没）
    try {
      fs.mkdirSync(path.dirname(配置文件()), { recursive: true })
      fs.writeFileSync(path.join(app.getPath('userData'), 'port.txt'), String(服务.port), 'utf8')
    } catch { /* 忽略 */ }

    建窗口()
    刷新托盘 = 建托盘()
  })

  app.on('window-all-closed', (e) => {
    // 她是常驻的：没有窗口也不退出（托盘还在）
    e.preventDefault()
  })

  app.on('before-quit', () => {
    已退出 = true
    try { 服务 && 服务.close() } catch { /* 忽略 */ }
  })
}
