// 从插件目录同步资源到 exe 版，并做两处运行时适配
// 用法：node tools/sync.mjs
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const 这里 = dirname(fileURLToPath(import.meta.url))
const app根 = dirname(这里)
const 资源 = join(app根, 'assets')

// 两种布局都要能找：
//   开发布局  <ws>/pet-whale-app/tools  → <ws>/pet-whale/assets
//   仓库布局  <ws>/pet-whale/app/tools  → <ws>/pet-whale/assets（= app 的上一级）
const 插件 = [join(app根, '..'), join(app根, '..', 'pet-whale')]
  .find((p) => existsSync(join(p, 'assets', 'pet.js')))

if (!插件) {
  console.log('没找到插件源目录；这个 app/ 是仓库内快照，assets 已经内置好了，不用同步。')
  process.exit(0)
}

mkdirSync(join(资源, 'sounds'), { recursive: true })

for (const f of ['char.webp', 'tail.webp']) {
  copyFileSync(join(插件, 'assets', f), join(资源, f))
  console.log('copied ' + f)
}
for (const f of ['press.mp3', 'release.mp3', 'ask.wav', 'approve.wav', 'end.wav']) {
  copyFileSync(join(插件, 'assets', 'sounds', f), join(资源, 'sounds', f))
  console.log('copied sounds/' + f)
}

let js = readFileSync(join(插件, 'assets', 'pet.js'), 'utf8')

// 1) 前缀改成可注入（插件里没有 __PET_BASE__，等于空串，行为不变）
const 旧前缀 = "var 前缀 = '/dsh-pet-whale'"
const 新前缀 = "var 前缀 = (window.__PET_BASE__ || '') + '/dsh-pet-whale'"
if (!js.includes(旧前缀)) throw new Error('pet.js 里没找到前缀定义，插件改过结构了？')
js = js.replace(旧前缀, 新前缀)

// 2) 挂载时把设置面板和「回原位」暴露给主进程（托盘菜单要用）
const 锚 = '  function 挂载() {\n'
if (!js.includes(锚)) throw new Error('pet.js 里没找到 挂载()')
js = js.replace(
  锚,
  锚 + "    try { window.__dpwOpenSettings = 开设置; window.__dpwHome = function () { 默认位(); 保存位() } } catch (e) {}\n",
)

writeFileSync(join(资源, 'pet.js'), js, 'utf8')
console.log('pet.js patched ' + js.length + ' chars')
console.log('SYNC_OK')
