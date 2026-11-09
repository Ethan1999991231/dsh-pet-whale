// 把 assets/pet.js 原样裹进 DSH 的 client bundle 外壳里，产出 lib/client.js。
//
// 为什么要有这一层：`webserver/index-inject` 那条路要抢在宿主启动、收集注入表之前把行塞进去，
// 而且桌面壳到底读不读那张表并不保证。client bundle 是页面自己加载的通道（sidebar-dock、
// fish-buddy 都走这条），页面执行 `window.__ModuleLoader__.load({...})` 的回调，apply() 就跑一次。
import { readFileSync, writeFileSync } from 'node:fs'

const 宠 = readFileSync('assets/pet.js', 'utf8')

const 头 = `// 大肥鱼桌宠 · 网页半边（DSH client bundle 通道）
//
// 这个文件由 preview/build_client.mjs 生成：把 assets/pet.js 原样裹进
// window.__ModuleLoader__.load 的外壳。要改行为请改 assets/pet.js 再重新生成，
// 不要直接改这里（下次生成会被覆盖）。
window.__ModuleLoader__.load({
  id: 'dsh-pet-whale',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports

    function apply(ctx) {
      try {
        // —— 以下是 assets/pet.js 原文 ——
`

const 尾 = `
        // —— assets/pet.js 原文结束 ——
      } catch (e) {
        try {
          window.__dshPetWhaleErr = String((e && (e.stack || e.message)) || e).slice(0, 600)
        } catch (_) {}
        try { console.error('[pet-whale] 挂载失败', e) } catch (_) {}
      }
    }

    exports.apply = apply
    exports.inject = []
    return module.exports
  },
})
`

const 全文 = 头 + 宠 + 尾
writeFileSync('lib/client.js', 全文)
console.log('ok client.js ' + 全文.length + ' chars')
