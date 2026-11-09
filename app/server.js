// 本地小服务：给页面提供 /dsh-pet-whale/* 这些路径
// 逻辑照 DSH 插件那份 host.js 搬过来（state / config / custom / upload / reset / 静态资源）
const { createServer } = require('node:http')
const { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } = require('node:fs')
const { join } = require('node:path')

const 前缀 = '/dsh-pet-whale'
const 余额地址 = 'https://api.deepseek.com/user/balance'

const 资源名 = /^[a-z0-9][a-z0-9._-]{0,40}\.(mp3|wav|webp|png|jpg|jpeg|gif)$/i

// 文件名固定、内容可能是 png/jpg —— 按魔术字节认 MIME
function 嗅(b) {
  const a4 = (o, n) => b.toString('ascii', o, o + n)
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50) return 'image/png'
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg'
  if (b.length > 12 && a4(0, 4) === 'RIFF' && a4(8, 4) === 'WEBP') return 'image/webp'
  if (b.length > 12 && a4(0, 4) === 'RIFF' && a4(8, 4) === 'WAVE') return 'audio/wav'
  if (b.length > 6 && a4(0, 3) === 'GIF') return 'image/gif'
  if (b.length > 4 && a4(0, 4) === 'OggS') return 'audio/ogg'
  if (b.length > 3 && a4(0, 3) === 'ID3') return 'audio/mpeg'
  if (b.length > 2 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0) return 'audio/mpeg'
  return 'application/octet-stream'
}

function 读体(req, 上限 = 8192) {
  return new Promise((resolve, reject) => {
    let 长 = 0
    const 块 = []
    req.on('data', (c) => {
      长 += c.length
      if (长 > 上限) { reject(new Error('body too large')); req.destroy(); return }
      块.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(块).toString('utf8')))
    req.on('error', reject)
  })
}

function json(res, code, obj) {
  const s = JSON.stringify(obj)
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(s),
    'access-control-allow-origin': '*',
  })
  res.end(s)
}

/**
 * @param {object} o
 * @param {string} o.资源目录   内置资源（pet.js / char.webp / tail.webp / sounds）
 * @param {string} o.自定义目录 用户上传的东西
 * @param {() => string} o.取Key
 * @param {() => string} o.取配置
 */
function 起服务(o) {
  const 静态表 = {
    '/pet.js': ['pet.js', 'text/javascript; charset=utf-8'],
    '/char.webp': ['char.webp', 'image/webp'],
    '/tail.webp': ['tail.webp', 'image/webp'],
    '/sounds/press.mp3': [join('sounds', 'press.mp3'), 'audio/mpeg'],
    '/sounds/release.mp3': [join('sounds', 'release.mp3'), 'audio/mpeg'],
    '/sounds/ask.wav': [join('sounds', 'ask.wav'), 'audio/wav'],
    '/sounds/approve.wav': [join('sounds', 'approve.wav'), 'audio/wav'],
    '/sounds/end.wav': [join('sounds', 'end.wav'), 'audio/wav'],
  }

  let 缓存 = null
  let 缓存时 = 0
  let 缓存读 = 0

  async function 取余额(force) {
    if (!force && 缓存 && Date.now() - 缓存读 < 1500) return 缓存
    if (缓存 && Date.now() - 缓存时 < 60000) return 缓存
    const key = String(o.取Key() || '').trim()
    if (!key) return { ok: false, error: '还没填 API Key（托盘图标右键 → 设置 API Key）' }
    try {
      const r = await fetch(余额地址, {
        headers: { authorization: 'Bearer ' + key, accept: 'application/json' },
        signal: AbortSignal.timeout(9000),
      })
      if (!r.ok) throw new Error('HTTP ' + r.status)
      const j = await r.json()
      const list = Array.isArray(j && j.balance_infos) ? j.balance_infos : []
      const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null)
      const 全 = list
        .filter((x) => x && Number.isFinite(Number(x.total_balance)))
        .map((x) => ({
          currency: String(x.currency || 'CNY').toUpperCase(),
          total: Number(x.total_balance),
          granted: num(x.granted_balance),
          topped: num(x.topped_up_balance),
        }))
      // 人民币永远排第一
      const 主 = 全.find((x) => x.currency === 'CNY')
        || 全.find((x) => x.total > 0) || 全[0] || null
      const out = 主
        ? {
            ok: true,
            remaining: 主.total,
            currency: 主.currency,
            granted: 主.granted,
            topped: 主.topped,
            isAvailable: j.is_available !== false,
            wallets: 全.length ? 全 : [主],
            at: Date.now(),
          }
        : { ok: true, remaining: null, currency: 'CNY', granted: null, topped: null, wallets: [], at: Date.now() }
      缓存 = out
      缓存时 = Date.now()
      缓存读 = Date.now()
      return out
    } catch (err) {
      // 读失败也缓存 20 秒，别把上游打爆
      const out = { ok: false, error: String((err && err.message) || err) }
      缓存 = out
      缓存时 = Date.now() - 40000
      缓存读 = Date.now()
      return out
    }
  }

  async function 处理(req, res) {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    const p = url.pathname
    const m = req.method || 'GET'

    if (m === 'OPTIONS') {
      res.writeHead(204, {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,POST,OPTIONS',
        'access-control-allow-headers': 'content-type',
      })
      res.end()
      return
    }

    // 给前端的配置里绝不能带 apiKey（本地端口谁都能访问）
    const 干净配置 = () => {
      try {
        const j = JSON.parse(o.取配置() || '{}')
        delete j.apiKey
        return j
      } catch {
        return {}
      }
    }

    if (p === 前缀 + '/state') {
      const 余额 = await 取余额(url.searchParams.get('refresh') === '1')
      return json(res, 200, {
        ok: true,
        余额,
        运行: [],
        等待: null,
        结束数: 0,
        配置: 干净配置(),
        now: Date.now(),
      })
    }

    if (p === 前缀 + '/config') {
      if (m === 'GET') return json(res, 200, { ok: true, 配置: 干净配置() })
      try {
        await 读体(req, 64 * 1024)
        return json(res, 200, { ok: true })
      } catch {
        return json(res, 400, { ok: false, error: '参数不对' })
      }
    }

    if (p === 前缀 + '/custom') {
      const f = String(url.searchParams.get('f') || '')
      if (!资源名.test(f)) { res.writeHead(400); res.end(); return }
      const file = join(o.自定义目录, f)
      if (!existsSync(file)) { res.writeHead(404); res.end(); return }
      const buf = readFileSync(file)
      res.writeHead(200, {
        'content-type': 嗅(buf),
        'content-length': buf.length,
        'cache-control': 'no-store',
        'access-control-allow-origin': '*',
      })
      res.end(buf)
      return
    }

    if (p === 前缀 + '/upload') {
      try {
        // dataURL 比原文件大 1/3
        const body = JSON.parse(await 读体(req, 8 * 1024 * 1024))
        const f = String((body && body.f) || '')
        const data = String((body && body.data) || '')
        if (!资源名.test(f)) throw new Error('文件名不合法')
        const mm = /^data:[^;,]*;base64,(.+)$/.exec(data)
        if (!mm) throw new Error('不是 dataURL')
        const buf = Buffer.from(mm[1], 'base64')
        if (!buf.length) throw new Error('文件是空的')
        if (buf.length > 5 * 1024 * 1024) throw new Error('文件太大（限 5MB）')
        mkdirSync(o.自定义目录, { recursive: true })
        writeFileSync(join(o.自定义目录, f), buf)
        return json(res, 200, { ok: true, url: 前缀 + '/custom?f=' + encodeURIComponent(f) + '&t=' + Date.now() })
      } catch (err) {
        return json(res, 400, { ok: false, error: String((err && err.message) || err) })
      }
    }

    if (p === 前缀 + '/reset') {
      try {
        const raw = await 读体(req)
        const body = raw ? JSON.parse(raw) : {}
        const f = String((body && body.f) || '')
        if (f === 'all') rmSync(o.自定义目录, { recursive: true, force: true })
        else if (资源名.test(f)) rmSync(join(o.自定义目录, f), { force: true })
        else throw new Error('参数不对')
        return json(res, 200, { ok: true })
      } catch (err) {
        return json(res, 400, { ok: false, error: String((err && err.message) || err) })
      }
    }

    // 静态表的键是「去掉前缀」后的路径（/pet.js、/sounds/press.mp3 …）
    const 相对 = p.startsWith(前缀) ? p.slice(前缀.length) : p
    if (静态表[相对]) {
      const [rel, type] = 静态表[相对]
      const file = join(o.资源目录, rel)
      if (!existsSync(file)) { res.writeHead(404); res.end(); return }
      const buf = readFileSync(file)
      res.writeHead(200, {
        'content-type': type,
        'content-length': buf.length,
        'cache-control': 'no-cache',
        'access-control-allow-origin': '*',
      })
      res.end(buf)
      return
    }

    res.writeHead(404)
    res.end()
  }

  const server = createServer((req, res) => {
    处理(req, res).catch((err) => {
      try { json(res, 500, { ok: false, error: String((err && err.message) || err) }) } catch { /* 已结束 */ }
    })
  })

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      resolve({ port, close: () => server.close() })
    })
  })
}

module.exports = { 起服务, 前缀 }
