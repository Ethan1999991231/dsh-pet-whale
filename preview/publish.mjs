// 提交 + 推送 + 更新仓库简介（token 只在内存里，不落盘、不打印）
import { execFileSync, spawnSync } from 'node:child_process'

const REPO = 'dsh-pet-whale'
const DESC = '大肥鱼桌宠 for DeepSeek Harness：尾巴会摆、点一下 Q 弹、右键弹人民币余额、会话在跑时左上角显示思考窗。可拖动 / 滚轮缩放 / 按 S 开设置。'

const out = execFileSync('git', ['credential', 'fill'], {
  input: 'protocol=https\nhost=github.com\n\n',
  encoding: 'utf8',
})
const lines = out.split(/\r?\n/)
const user = lines.find((l) => l.startsWith('username='))?.slice(9) || ''
const pass = lines.find((l) => l.startsWith('password='))?.slice(9) || ''
if (!pass) { console.log('NO_CREDENTIAL'); process.exit(2) }

try {
  execFileSync('git', ['add', '-A'])
  execFileSync('git', ['-c', 'user.name=Ethan', '-c', 'user.email=syk201256@qq.com', 'commit', '-m', 'feat: 余额只报人民币；角色名改为大肥鱼'])
  console.log('COMMIT ok')
} catch {
  console.log('COMMIT nothing-to-do')
}

const url = `https://x-access-token:${pass}@github.com/${user}/${REPO}.git`
const r = spawnSync('git', ['push', url, 'main'], {
  encoding: 'utf8',
  env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
})
const scrub = (s) => (s || '').split(/\r?\n/).filter(Boolean).map((l) => l.replace(pass, '<token>')).slice(-4).join('\n')
console.log('PUSH_EXIT=' + r.status)
console.log(scrub(r.stdout))
console.log(scrub(r.stderr))

const res = await fetch(`https://api.github.com/repos/${user}/${REPO}`, {
  method: 'PATCH',
  headers: {
    Authorization: 'Bearer ' + pass,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'dsh-pet-whale',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ description: DESC }),
})
const j = await res.json().catch(() => ({}))
console.log('DESC_STATUS=' + res.status)
console.log('DESC_NOW=' + (j.description || j.message || ''))

const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
console.log('HEAD=' + head)
console.log('URL=' + `https://github.com/${user}/${REPO}`)
console.log('DONE')
