// 鲸鱼娘桌宠 · 宿主侧（DSH 这半边）
//
// 她只做三件事：
//   ① 往页面里塞一行注入，让浏览器去加载 /dsh-pet-whale/pet.js —— 桌宠本体是那个脚本画出来的
//   ② 喂 /dsh-pet-whale/state：DeepSeek 还剩多少钱 + 现在哪几间会话在跑
//   ③ 收 /dsh-pet-whale/config：桌宠停在哪、多大，重开之后还在原地
//
// 余额走 DSH 官方凭据（ctx.credentials.resolve('DEEPSEEK_API_KEY')），本文件不存任何明文。

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 'pet-whale'

const 包根 = dirname(dirname(fileURLToPath(import.meta.url)))
const 资源目录 = join(包根, 'assets')
const DSH目录 = process.env.DSH_HOME || join(homedir(), '.dsh')
const 配置文件 = join(DSH目录, 'pet-whale-config.json')
const 前缀 = '/dsh-pet-whale'
const 余额地址 = 'https://api.deepseek.com/user/balance'

const 默认配置 = {
  enabled: true, size: 240, x: null, y: null, think: true,
  // 设置面板改的这些也一起落盘，换浏览器/清缓存后能捡回来
  volume: 100, muted: false, dwell: 4, detect: true, sway: 1, lines: [],
}

// 只放行这张表里的文件 —— 不接受任何来自 URL 的路径片段
const 静态表 = {
  '/pet.js': ['pet.js', 'text/javascript; charset=utf-8'],
  '/char.webp': ['char.webp', 'image/webp'],
  '/tail.webp': ['tail.webp', 'image/webp'],
  // 音效：按下 / 松开（点击）/ 等你回答 / 等你授权 / 一轮跑完
  '/sounds/press.mp3': [join('sounds', 'press.mp3'), 'audio/mpeg'],
  '/sounds/release.mp3': [join('sounds', 'release.mp3'), 'audio/mpeg'],
  '/sounds/ask.wav': [join('sounds', 'ask.wav'), 'audio/wav'],
  '/sounds/approve.wav': [join('sounds', 'approve.wav'), 'audio/wav'],
  '/sounds/end.wav': [join('sounds', 'end.wav'), 'audio/wav'],
}

// ⚠ 只有一个入口挂载前端：package.json 里 dsh.client 指向 lib/client.js（由
//   preview/build_client.mjs 从 assets/pet.js 生成）。
//   早期还走过 webserver/index-inject 和 webServer.tapIndex 两条注入，三条一起跑
//   会挂出两三只重叠的桌宠，点一下响好几声——已全部删掉，别再往回加。
export function apply(root) {
  // ② 运行中的会话：sessionId -> { id, title, since, action }
  const 在跑 = new Map()
  // 等用户的时刻（提问 / 授权）—— 这两件事不会以 turn/end 结束，得单独盯着。
  //   kind: '' | 'question' | 'approval'
  //   stamp 每次变化都换一个，前端拿它比对就知道"要不要响一下"
  const 等待 = { kind: '', id: '', since: 0, title: '', stamp: 0, session: '' }
  // 一轮跑完的次数：前端看它变大就响结束音
  let 结束数 = 0
  function 设等待(kind, sid, title) {
    等待.kind = kind
    等待.session = String(sid || '')
    等待.title = String(title || '').slice(0, 80)
    等待.since = Date.now()
    等待.id = ''
    等待.stamp = 等待.since + Math.random()
  }
  function 清等待() {
    if (!等待.kind) return
    等待.kind = ''
    等待.id = ''
    等待.since = 0
    等待.stamp = Date.now() + Math.random()
  }
  // callId 散落在几个地方（不同 DSH 版本位置不一样），全都兜一遍
  function 取callId(event) {
    try {
      const d = (event && event.data) || {}
      const msg = d.message || {}
      const list = Array.isArray(msg.content) ? msg.content : []
      for (const c of list) if (c && (c.toolCallId || c.tool_call_id)) return String(c.toolCallId || c.tool_call_id)
      if (msg && (msg.callId || msg.toolCallId || msg.tool_call_id)) return String(msg.callId || msg.toolCallId || msg.tool_call_id)
      return String(d.callId || d.call_id || d.toolCallId || d.id || '')
    } catch (err) { return '' }
  }
  const 取标题 = (session) => {
    try {
      const svc = root.get ? root.get('sessionTitle') : null
      if (svc && typeof svc.get === 'function' && session) {
        const snap = svc.get(session)
        const t = typeof snap === 'string' ? snap : (snap && (snap.title || snap.text))
        const s = String(t == null ? '' : t).trim()
        if (s) return s.slice(0, 80)
      }
    } catch (err) { /* 老宿主没有这个服务 */ }
    try {
      const s = session && (session.name || session.title || session.label)
      return String(s == null ? '' : s).trim().slice(0, 80)
    } catch (err) { return '' }
  }

  root.on('agent/status', (payload) => {
    try {
      const agent = payload && payload.agent
      const session = agent && agent.session
      const id = String((session && session.id) || (agent && agent.id) || '')
      if (!id) return
      if (payload.status === 'running') {
        if (!在跑.has(id)) 在跑.set(id, { id, title: 取标题(session) || '新对话', since: Date.now(), action: '' })
      } else {
        在跑.delete(id)
      }
    } catch (err) { /* 事件永远不该把插件弄挂 */ }
  })

  root.on('session/event', (session, event) => {
    try {
      const id = String((session && session.id) || '')
      const type = String((event && event.type) || '')
      const data = (event && event.data) || {}
      const rec = 在跑.get(id)
      const 名 = String(data.name || data.toolName || '')

      // —— 等用户：提问 / 授权 ——
      // 提问是一次挂起中的工具调用（ask_user_question），要等 tool/result 才算答完
      if (type === 'tool/call' && 名 === 'ask_user_question') {
        设等待('question', id, rec ? rec.title : '')
        等待.id = 取callId(event) || ('q' + Date.now())
      } else if (type === 'tool/result' && 等待.kind === 'question') {
        const cid = 取callId(event)
        if (!cid || !等待.id || cid === 等待.id) 清等待()
      } else if (type === 'approval/asked') {
        设等待('approval', id, rec ? rec.title : '')
        等待.id = String(data.id || ('a' + Date.now()))
      } else if (type.indexOf('approval/') === 0) {
        // approval/granted、approval/denied、approval/cancelled… 都算处理完了
        if (等待.kind === 'approval') {
          const aid = String(data.id || '')
          if (!aid || !等待.id || aid === 等待.id) 清等待()
        }
      } else if (type === 'turn/start') {
        清等待()
        if (rec) { rec.since = Date.now(); rec.action = '' }
      } else if (type === 'turn/end') {
        清等待()
        结束数++
      }

      if (!rec) return
      if (type === 'tool/call') rec.action = 名.slice(0, 40)
      else if (type === 'assistant/message') rec.action = ''
      else if (type === 'session/title') {
        const t = String(data.title == null ? '' : data.title).trim()
        if (t) rec.title = t.slice(0, 80)
      }
    } catch (err) {}
  })

  root.on('agent/disposed', (payload) => {
    try {
      const agent = payload && payload.agent
      const id = String((agent && agent.session && agent.session.id) || (agent && agent.id) || '')
      if (id) 在跑.delete(id)
    } catch (err) {}
  })

  // ③ 其余逻辑：等 webServer 就绪再挂路由
  root.inject(['webServer'], (ctx) => {
    // —— 信任栅栏 ——
    // 这里**故意不调 connection.requestRejection**：它要求带 DSH 的登录 cookie，
    // 而桌面壳里的页面是 dsh-app:// 起的，往 127.0.0.1 取的子资源不一定带得上 cookie，
    // 一带不上整只桌宠就 403、页面里什么都不出现（第一版"重启了也没有"就是这么来的）。
    // 改成只看真正能挡 DNS rebinding 的两样：Host 必须回环 + Origin 不能是外站。
    function 是回环名(host) {
      try {
        const name = String(host || '').toLowerCase().split(':')[0].replace(/^\[|\]$/g, '')
        if (name === 'localhost' || name === '::1' || name.endsWith('.localhost')) return true
        const m = /^127\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(name)
        return !!m && [m[1], m[2], m[3]].every((x) => Number(x) <= 255)
      } catch (err) { return false }
    }
    function 可信(req) {
      try {
        const headers = (req && req.headers) || {}
        const host = String(headers.host || '').toLowerCase()
        if (!是回环名(host)) return false
        const origin = typeof headers.origin === 'string' ? headers.origin : ''
        if (!origin || origin === 'null') return true
        if (origin.startsWith('dsh-app://') || origin.startsWith('file://')) return true
        try { return new URL(origin).host.toLowerCase() === host } catch (err) { return false }
      } catch (err) { return false }
    }

    const 注册 = (route) => {
      const inner = route.handler
      return ctx.webServer.register(Object.assign({}, route, {
        handler: async (req, res) => {
          if (!可信(req)) { try { res.statusCode = 403; res.end() } catch (e) {} return }
          return inner(req, res)
        },
      }))
    }

    function 读体(req, 上限 = 8192) {
      return new Promise((resolve, reject) => {
        const chunks = []
        let size = 0
        req.on('data', (c) => {
          size += c.length
          if (size > 上限) { reject(new Error('body too large')); req.destroy(); return }
          chunks.push(c)
        })
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
        req.on('error', reject)
      })
    }

    // —— 配置 ——
    function 读配置() {
      try {
        const raw = JSON.parse(readFileSync(配置文件, 'utf8'))
        return {
          enabled: typeof raw.enabled === 'boolean' ? raw.enabled : 默认配置.enabled,
          size: Number.isFinite(raw.size) ? Math.min(560, Math.max(120, raw.size)) : 默认配置.size,
          x: Number.isFinite(raw.x) ? raw.x : null,
          y: Number.isFinite(raw.y) ? raw.y : null,
          think: typeof raw.think === 'boolean' ? raw.think : 默认配置.think,
          volume: Number.isFinite(raw.volume) ? Math.min(100, Math.max(0, Math.round(raw.volume))) : 默认配置.volume,
          muted: typeof raw.muted === 'boolean' ? raw.muted : 默认配置.muted,
          dwell: Number.isFinite(raw.dwell) ? Math.min(15, Math.max(1, raw.dwell)) : 默认配置.dwell,
          detect: typeof raw.detect === 'boolean' ? raw.detect : 默认配置.detect,
          sway: Number.isFinite(raw.sway) ? Math.min(2.5, Math.max(0.3, raw.sway)) : 默认配置.sway,
          lines: Array.isArray(raw.lines) ? raw.lines.slice(0, 30).map((s) => String(s || '').slice(0, 60)).filter(Boolean) : [],
        }
      } catch (err) { return { ...默认配置 } }
    }
    function 写配置(patch) {
      const cur = 读配置()
      const next = { ...cur }
      if (typeof patch.enabled === 'boolean') next.enabled = patch.enabled
      if (typeof patch.think === 'boolean') next.think = patch.think
      if (Number.isFinite(patch.size)) next.size = Math.min(560, Math.max(120, Math.round(patch.size)))
      if (Number.isFinite(patch.x)) next.x = Math.round(patch.x)
      if (Number.isFinite(patch.y)) next.y = Math.round(patch.y)
      if (Number.isFinite(patch.volume)) next.volume = Math.min(100, Math.max(0, Math.round(patch.volume)))
      if (typeof patch.muted === 'boolean') next.muted = patch.muted
      if (Number.isFinite(patch.dwell)) next.dwell = Math.min(15, Math.max(1, patch.dwell))
      if (typeof patch.detect === 'boolean') next.detect = patch.detect
      if (Number.isFinite(patch.sway)) next.sway = Math.min(2.5, Math.max(0.3, patch.sway))
      if (Array.isArray(patch.lines)) {
        next.lines = patch.lines.slice(0, 30).map((s) => String(s || '').slice(0, 60)).filter(Boolean)
      }
      try {
        mkdirSync(DSH目录, { recursive: true })
        writeFileSync(配置文件, JSON.stringify(next, null, 2), 'utf8')
      } catch (err) { /* 存不下就算了，下次用默认位置 */ }
      return next
    }

    // —— 余额（60 秒缓存，失败不覆盖上一次的好数据）——
    let 余额缓存 = { at: 0, data: null }
    let 余额在取 = null
    async function 取余额(force) {
      const now = Date.now()
      if (!force && 余额缓存.data && now - 余额缓存.at < 60000) return 余额缓存.data
      if (余额在取) return 余额在取
      余额在取 = (async () => {
        let cred = null
        try {
          const svc = ctx.get('credentials')
          if (svc && typeof svc.resolve === 'function') cred = await svc.resolve('DEEPSEEK_API_KEY')
        } catch (err) { return { ok: false, error: '凭据服务读不到：' + String((err && err.message) || err).slice(0, 80) } }
        if (!cred || !cred.value) return { ok: false, error: '还没配置 DEEPSEEK_API_KEY' }
        let lastErr = null
        for (let i = 0; i < 2; i++) {
          let res
          try {
            res = await fetch(余额地址, {
              headers: { Authorization: 'Bearer ' + cred.value },
              signal: AbortSignal.timeout(8000),
            })
          } catch (err) {
            lastErr = err
            if (i === 0) await new Promise((r) => setTimeout(r, 500))
            continue
          }
          if (!res.ok) {
            lastErr = new Error('HTTP ' + res.status)
            if (res.status < 500) break
            if (i === 0) await new Promise((r) => setTimeout(r, 500))
            continue
          }
          let data
          try { data = await res.json() } catch (err) { return { ok: false, error: '余额接口返回的不是 JSON' } }
          const list = (data && Array.isArray(data.balance_infos)) ? data.balance_infos : []
          const info = list.find((x) => x && Number.isFinite(Number(x.total_balance))) || list[0]
          if (!info || !Number.isFinite(Number(info.total_balance))) return { ok: false, error: '余额接口结构异常' }
          const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null)
          // 把每个币种都留着，前端一起显示（官方一般返回 CNY + USD 两条）
          const 钱包 = list
            .filter((x) => x && Number.isFinite(Number(x.total_balance)))
            .map((x) => ({
              currency: String(x.currency || 'CNY').toUpperCase(),
              total: Number(x.total_balance),
              granted: num(x.granted_balance),
              topped: num(x.topped_up_balance),
            }))
          return {
            ok: true,
            remaining: Number(info.total_balance),
            currency: String(info.currency || 'CNY').toUpperCase(),
            granted: num(info.granted_balance),
            topped: num(info.topped_up_balance),
            wallets: 钱包.length ? 钱包 : [{ currency: String(info.currency || 'CNY').toUpperCase(), total: Number(info.total_balance), granted: num(info.granted_balance), topped: num(info.topped_up_balance) }],
            available: data && data.is_available !== false,
            at: Date.now(),
          }
        }
        return { ok: false, error: '余额接口没通：' + String((lastErr && lastErr.message) || lastErr).slice(0, 80) }
      })()
      try {
        const out = await 余额在取
        if (out && out.ok) 余额缓存 = { at: Date.now(), data: out }
        return out
      } finally {
        余额在取 = null
      }
    }

    // —— 路由 ——
    注册({
      kind: 'exact',
      path: 前缀 + '/state',
      handler: async (req, res) => {
        try {
          const url = new URL(req.url || '/', 'http://localhost')
          const 余额 = await 取余额(url.searchParams.get('refresh') === '1')
          const 运行 = [...在跑.values()].map((r) => ({
            id: r.id, title: r.title, since: r.since, action: r.action,
          }))
          const body = JSON.stringify({
            ok: true,
            余额,
            运行,
            等待: 等待.kind ? { kind: 等待.kind, since: 等待.since, title: 等待.title, stamp: 等待.stamp } : null,
            结束数,
            配置: 读配置(),
            now: Date.now(),
          })
          res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
          res.end(body)
        } catch (err) {
          res.writeHead(500, { 'content-type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ ok: false, error: String((err && err.message) || err) }))
        }
      },
    })

    注册({
      kind: 'exact',
      path: 前缀 + '/config',
      handler: async (req, res) => {
        if (String(req.method || 'GET').toUpperCase() === 'POST') {
          if (!可信(req)) { res.writeHead(403); res.end(); return }
          try {
            const patch = JSON.parse(await 读体(req))
            const next = 写配置(patch && typeof patch === 'object' ? patch : {})
            res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
            res.end(JSON.stringify({ ok: true, 配置: next }))
          } catch (err) {
            res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ ok: false, error: String((err && err.message) || err) }))
          }
          return
        }
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
        res.end(JSON.stringify({ ok: true, 配置: 读配置() }))
      },
    })

    // 静态资源逐个挂 exact 路由 —— 这里就三个文件，白名单比 prefix 稳
    const 缓存 = new Map()
    for (const [键, [文件, 类型]] of Object.entries(静态表)) {
      注册({
        kind: 'exact',
        path: 前缀 + 键,
        handler: (req, res) => {
          try {
            let bytes = 缓存.get(键)
            if (!bytes) { bytes = readFileSync(join(资源目录, 文件)); 缓存.set(键, bytes) }
            res.writeHead(200, { 'content-type': 类型, 'cache-control': 'no-cache' })
            res.end(bytes)
          } catch (err) {
            res.writeHead(500); res.end()
          }
        },
      })
    }
  })

  root.effect(() => () => {
    在跑.clear()
  })
}
