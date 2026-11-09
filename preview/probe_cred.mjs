// 只探一下能不能拿到 token —— 绝不打印 token 本身，只打印长度
import { spawnSync } from 'node:child_process'

const r = spawnSync('git', ['-c', 'credential.helper=manager', 'credential', 'fill'], {
  input: 'protocol=https\nhost=github.com\n\n',
  encoding: 'utf8',
  timeout: 20000,
  env: { ...process.env, GCM_INTERACTIVE: 'Never', GIT_TERMINAL_PROMPT: '0' },
})
const out = r.stdout || ''
const user = (out.split(/\r?\n/).find((l) => l.startsWith('username=')) || '').slice(9)
const pass = (out.split(/\r?\n/).find((l) => l.startsWith('password=')) || '').slice(9)
console.log('status=' + r.status + ' signal=' + (r.signal || '-'))
console.log('user=' + (user || '(empty)'))
console.log('passlen=' + pass.length)
console.log('err=' + String(r.stderr || '').replace(/\s+/g, ' ').slice(0, 160))
