// 用凭据管理器里的 token 直接推送（不设 upstream，不打印 token）
import { execFileSync, spawnSync } from 'node:child_process'

const REPO = 'dsh-pet-whale'

const out = execFileSync('git', ['credential', 'fill'], {
  input: 'protocol=https\nhost=github.com\n\n',
  encoding: 'utf8',
})
const lines = out.split(/\r?\n/)
const user = lines.find((l) => l.startsWith('username='))?.slice(9) || ''
const pass = lines.find((l) => l.startsWith('password='))?.slice(9) || ''
if (!pass) { console.log('NO_CREDENTIAL'); process.exit(2) }

const url = `https://x-access-token:${pass}@github.com/${user}/${REPO}.git`
const r = spawnSync('git', ['push', url, 'main'], {
  encoding: 'utf8',
  env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
})

const scrub = (s) => (s || '').split(/\r?\n/).filter(Boolean).map((l) => l.replace(pass, '<token>')).join('\n')
console.log('EXIT=' + r.status)
console.log(scrub(r.stdout).slice(-800))
console.log(scrub(r.stderr).slice(-800))

const after = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
console.log('LOCAL=' + after)
console.log('DONE')
