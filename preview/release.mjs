// 建 GitHub Release 并把 zip 传成 asset
// token 由 preview\token.ps1 取出来放 preview\token.b64，用完这里自己删
import { readFileSync, unlinkSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const 这里 = dirname(fileURLToPath(import.meta.url))
const 包根 = dirname(这里)
const 上级 = dirname(包根)
const 仓库 = 'Ethan1999991231/dsh-pet-whale'
const 标签 = 'v1.0.0'
const zip = join(上级, 'dsh-pet-whale-1.0.0.zip')
const 安装包 = join(上级, 'pet-whale-app', 'release', '大肥鱼桌宠-1.0.0-安装包.exe')

let token
try {
  token = Buffer.from(readFileSync(join(这里, 'token.b64'), 'ascii').trim(), 'base64').toString('utf8').trim()
} catch {
  console.log('NO_TOKEN'); process.exit(1)
}
if (!token || token.length < 20) { console.log('NO_TOKEN'); process.exit(1) }

const 头 = {
  authorization: 'Bearer ' + token,
  accept: 'application/vnd.github+json',
  'x-github-api-version': '2022-11-28',
  'user-agent': 'dsh-pet-whale-release',
}

const 说明 = [
  '**大肥鱼桌宠 for DeepSeek Harness**',
  '',
  '挂在 DSH 页面右下角的那条蓝发大肥鱼：尾巴会摆、左键点她碎碎念、右键弹人民币余额、有会话在跑时左上角显示思考窗。',
  '',
  '### 两个版本，按需选',
  '',
  '**① 插件版 `dsh-pet-whale-1.0.0.zip`** —— 挂进 DSH 页面里',
  '1. 下载后解压得到 `dsh-pet-whale` 目录',
  '2. DSH → 插件 → 从本地目录安装（或在应用设置里导入这个 zip）',
  '3. **重启一次 DSH**，再刷新页面',
  '',
  '**② 桌面版 `大肥鱼桌宠-1.0.0-安装包.exe`** —— 不用装 DSH 也能玩',
  '1. 双击安装，装完开始菜单搜「大肥鱼」就能打开',
  '2. 第一次用：托盘图标右键 → 设置 API Key（只存在你自己机器的 `%APPDATA%` 下）',
  '3. 它是透明置顶窗口，鼠标不在她身上时整层穿透，不挡你点别的东西',
  '',
  '### 这一版',
  '- 余额无条件优先显示人民币（不再被美元抢先）',
  '- 设置面板（鼠标悬停按 `S`）宽度与字号放大，按钮文字不再被裁',
  '- 自定义音效 / 自定义身体与尾巴（上传后即时生效，可一键还原）',
  '- 按下与松开音效不再叠音，同一时刻只响一声',
  '- 上传体积上限放宽到 8MB（5MB 的音频 base64 后也不会被截）',
  '- 桌面版：修掉填 API Key 之后弹出的 EPIPE 崩溃，并且不再把 Key 回给本地端口',
  '',
  '### 操作',
  '- 拖动：拖她 · 缩放：滚轮 · 设置：悬停按 `S`',
  '- 左键：碎碎念 · 右键：报余额',
].join('\n')

async function json(url, init) {
  const r = await fetch(url, { ...init, headers: { ...头, ...(init && init.headers) } })
  const t = await r.text()
  let j = null
  try { j = JSON.parse(t) } catch { j = null }
  return { status: r.status, body: j, text: t }
}

const 基础 = 'https://api.github.com/repos/' + 仓库

// 已有同名 release 就复用，避免二次运行报 422
let rel = null
const 查 = await json(基础 + '/releases/tags/' + 标签, { method: 'GET' })
if (查.status === 200 && 查.body && 查.body.id) {
  rel = 查.body
  console.log('RELEASE_EXISTS id=' + rel.id)
  const 改 = await json(基础 + '/releases/' + rel.id, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: '大肥鱼桌宠 ' + 标签, body: 说明, prerelease: false }),
  })
  console.log('RELEASE_PATCH=' + 改.status)
} else {
  const 建 = await json(基础 + '/releases', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      tag_name: 标签,
      target_commitish: 'main',
      name: '大肥鱼桌宠 ' + 标签,
      body: 说明,
      draft: false,
      prerelease: false,
    }),
  })
  if (建.status !== 201) { console.log('RELEASE_FAIL=' + 建.status + ' ' + 建.text.slice(0, 300)); process.exit(1) }
  rel = 建.body
  console.log('RELEASE_CREATED id=' + rel.id)
}

const 资产表 = [
  { 名: 'dsh-pet-whale-1.0.0.zip', 路径: zip, 类型: 'application/zip' },
  // GitHub 上传接口会把非 ASCII 的文件名剥掉（中文会变成 '-1.0.0-.exe'），资产名只能用英文
  { 名: 'dsh-pet-whale-app-1.0.0-setup.exe', 路径: 安装包, 类型: 'application/octet-stream' },
]

// 同名 asset 先删掉，否则上传会 422
const 已有 = await json(基础 + '/releases/' + rel.id + '/assets', { method: 'GET' })
const 旧表 = 已有.status === 200 && Array.isArray(已有.body) ? 已有.body : []

// 早先中文名上传留下的残骸，顺手清掉
for (const a of 旧表) {
  if (/^-[0-9.]+-\.exe$/.test(a.name)) {
    const d = await json(基础 + '/releases/assets/' + a.id, { method: 'DELETE' })
    console.log('JUNK_DELETED=' + a.name + ' ' + d.status)
  }
}

for (const 项 of 资产表) {
  if (!existsSync(项.路径)) {
    console.log('MISSING=' + 项.名 + ' @ ' + 项.路径)
    continue
  }
  for (const a of 旧表) {
    if (a.name === 项.名) {
      const d = await json(基础 + '/releases/assets/' + a.id, { method: 'DELETE' })
      console.log('OLD_ASSET_DELETED=' + 项.名 + ' ' + d.status)
    }
  }
  const 字节 = readFileSync(项.路径)
  const 传 = await fetch(
    'https://uploads.github.com/repos/' + 仓库 + '/releases/' + rel.id + '/assets?name=' + encodeURIComponent(项.名),
    {
      method: 'POST',
      headers: { ...头, 'content-type': 项.类型, 'content-length': String(字节.length) },
      body: 字节,
    },
  )
  const 传文 = await 传.text()
  console.log('ASSET_UPLOAD=' + 项.名 + ' status=' + 传.status + ' local=' + 字节.length)
  if (传.status !== 201) {
    console.log(传文.slice(0, 400))
    continue
  }
  try {
    const j = JSON.parse(传文)
    console.log('ASSET_URL=' + j.browser_download_url + ' size=' + j.size)
  } catch { /* 忽略 */ }
}

console.log('RELEASE_PAGE=https://github.com/' + 仓库 + '/releases/tag/' + 标签)

try { unlinkSync(join(这里, 'token.b64')) } catch { /* 已删 */ }
