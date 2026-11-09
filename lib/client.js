// 大肥鱼桌宠 · 网页半边（DSH client bundle 通道）
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
// 大肥鱼桌宠 · 浏览器侧
//
// 她是从两张透明素材拼出来的：身体一张、尾巴一张（尾巴是从身体上挖掉后单独转的），
// 所以尾巴能自己摆。点一下会 Q 弹一下，顺手把 DeepSeek 还剩多少钱顶出来。
// 只要有会话在跑，左上角就冒一个「思考中」的小窗。
//
// 不用 React、不挂 slot：直接往 document.body 里插一棵 position:fixed 的树，
// 和桌面挂件同一个路子（页面重渲染也不会把她冲掉）。

(function () {
  var 前缀 = '/dsh-pet-whale'
  // 判重只看"页面上真的有没有她"，**不看任何全局标志**。
  // 踩过的坑：注入脚本会先设 window.__dshPetWhale=1 再去加载本文件，
  // 本文件看到标志就 return，结果两个通道互相把对方废掉——通道通了，页面上什么都没有。
  if (document.getElementById('dpw')) return
  try { window.__dshPetWhaleStage = 'start' } catch (e) {}

  var 比例 = 997 / 1520 // 素材宽高比（裁到内容后的）
  var 本地键 = 'dsh-pet-whale.v1'

  function el(tag, cls, text) {
    var n = document.createElement(tag)
    if (cls) n.className = cls
    if (text != null) n.textContent = text
    return n
  }

  // ---------- 选项（设置面板改的就是这些，改完立刻生效并记住）----------
  var 选项键 = 'dsh-pet-whale.opts'
  var 预设台词 = ['痒~ 不要碰qwq', '干嘛owo', '再点就咬你了', '唔…手拿开啦', '你点够没啊']
  var 预设选项 = { volume: 100, muted: false, dwell: 4, detect: true, sway: 1, lines: 预设台词.slice() }
  var 选项 = { volume: 100, muted: false, dwell: 4, detect: true, sway: 1, lines: 预设台词.slice() }
  function 夹(n, a, b) { return Math.min(b, Math.max(a, n)) }

  function 读选项() {
    var o = null
    try { o = JSON.parse(localStorage.getItem(选项键) || 'null') } catch (e) {}
    if (!o || typeof o !== 'object') return
    if (Number.isFinite(o.volume)) 选项.volume = 夹(Math.round(o.volume), 0, 100)
    if (typeof o.muted === 'boolean') 选项.muted = o.muted
    if (Number.isFinite(o.dwell)) 选项.dwell = 夹(o.dwell, 1, 15)
    if (typeof o.detect === 'boolean') 选项.detect = o.detect
    if (Number.isFinite(o.sway)) 选项.sway = 夹(o.sway, 0.3, 2.5)
    if (Array.isArray(o.lines)) {
      var ls = []
      for (var i = 0; i < o.lines.length && ls.length < 30; i++) {
        var s = String(o.lines[i] == null ? '' : o.lines[i]).trim()
        if (s) ls.push(s.slice(0, 60))
      }
      if (ls.length) 选项.lines = ls
    }
  }
  读选项()
  // 调试用：控制台里 __dpwOpt 就能看到当前设置
  try { window.__dpwOpt = 选项 } catch (e) {}

  var 存选定时 = null
  // 每次都存本地（刷新就还在）；回写宿主是防换浏览器丢设置，慢一点没关系
  function 保存选项(回写) {
    try { localStorage.setItem(选项键, JSON.stringify(选项)) } catch (e) {}
    if (!回写) return
    if (存选定时) clearTimeout(存选定时)
    存选定时 = setTimeout(function () {
      存选定时 = null
      try {
        fetch(前缀 + '/config', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            volume: 选项.volume, muted: 选项.muted, dwell: 选项.dwell,
            detect: 选项.detect, sway: 选项.sway, lines: 选项.lines,
          }),
        }).catch(function () {})
      } catch (e) {}
    }, 600)
  }

  // ---------- 音效 ----------
  // 声音跟小鲸鱼记账同一套：按下 Ya1、松开 Ya2、提问/授权各一支、跑完一支。
  // 浏览器不许没交互就出声，所以第一次点她之后才真的有声音（点之前静默，不算 bug）。
  var 音 = {}
  var 音基 = {}
  var 音源 = {}   // 名 -> 内置文件名（"换回来"的时候用）
  function 备音(名, 文件, 音量) {
    try {
      var a = new Audio()
      a.preload = 'auto'
      音基[名] = 音量
      音源[名] = 文件
      a.volume = 音量 * (选项.volume / 100)
      // 先问自定义那份；没有（404）就退回内置那份 —— 不用在前端另存一份状态
      a.addEventListener('error', function () {
        var 内 = 前缀 + '/sounds/' + 文件
        if (a.src.indexOf('/custom?') >= 0) a.src = 内
      })
      a.src = 自定义源(文件)
      音[名] = a
    } catch (e) {}
  }
  function 自定义源(文件) {
    return 前缀 + '/custom?f=' + encodeURIComponent(文件) + '&t=' + (自定戳 || 0)
  }
  var 自定戳 = Date.now()
  // 总音量变了：把每支音按各自基准重算一遍（基准不同，不能一律拉满）
  function 调音量() {
    for (var k in 音) {
      if (音基[k] == null) continue
      try { 音[k].volume = 夹(音基[k] * (选项.volume / 100), 0, 1) } catch (e) {}
    }
  }
  备音('press', 'press.mp3', 0.32)
  备音('release', 'release.mp3', 0.38)
  备音('ask', 'ask.wav', 0.5)
  备音('approve', 'approve.wav', 0.5)
  备音('end', 'end.wav', 0.42)
  function 放音(名) {
    if (选项.muted) return
    var a = 音[名]
    if (!a) return
    // 同一时刻只许响一声：按下还没播完就松开，两支叠在一起就是"重音"
    for (var k in 音) {
      var o = 音[k]
      if (o === a) continue
      try { if (!o.paused) { o.pause(); o.currentTime = 0 } } catch (e) {}
    }
    try {
      a.currentTime = 0
      var p = a.play()
      if (p && p.catch) p.catch(function () {})
    } catch (e) {}
  }

  // ---------- 样式 ----------
  var css = [
    '#dpw{position:fixed;z-index:9998;user-select:none;-webkit-user-select:none;touch-action:none;',
    'cursor:grab;opacity:0;transition:opacity .35s ease;',
    'filter:drop-shadow(0 8px 16px rgba(28,52,96,.16));}',
    '#dpw.dpw-on{opacity:1}',
    '#dpw.dpw-drag{cursor:grabbing}',
    '#dpw-stage{position:relative;pointer-events:none}',

    '#dpw-pop{position:relative;transform-origin:50% 100%;will-change:transform;}',
    '#dpw-pop.dpw-pop{animation:dpw-pop .55s cubic-bezier(.3,.9,.32,1)}',
    '@keyframes dpw-pop{',
    '0%{transform:scale(1,1)}',
    '16%{transform:scale(1.13,.85) translateY(3px)}',
    '40%{transform:scale(.93,1.10) translateY(-5px)}',
    '62%{transform:scale(1.05,.96)}',
    '80%{transform:scale(.985,1.02)}',
    '100%{transform:scale(1,1)}}',

    '#dpw img{display:block;width:100%;height:auto;pointer-events:none;-webkit-user-drag:none;}',
    '#dpw-body{position:relative;z-index:2}',
    // 尾巴垫在身体**后面**（z-index 更小），并且整体往左贴一点，别从身体右缘伸出去穿帮
    // 枢轴压在尾巴**左下的根部**上 —— 这样摆的是右边那片尾鳍，根部钉死不动
    '#dpw-tail{position:absolute;left:-1.8%;top:0;z-index:1;transform-origin:56% 72%;',
    'animation:dpw-sway calc(3.6s / var(--dpw-sway,1)) ease-in-out infinite;}',
    '@keyframes dpw-sway{',
    '0%,100%{transform:rotate(-2.6deg)}',
    '50%{transform:rotate(3.6deg)}}',
    '#dpw.dpw-live #dpw-tail{animation-duration:calc(1.1s / var(--dpw-sway,1))}',
    '#dpw.dpw-kick #dpw-tail{animation-duration:.42s}',

    // 思考窗（贴在桌宠左上角）
    '#dpw-think{position:absolute;left:-8px;bottom:calc(100% - 4px);min-width:138px;max-width:214px;',
    'padding:7px 10px 8px;border-radius:12px;background:rgba(255,255,255,.95);',
    'border:1px solid rgba(58,92,148,.16);box-shadow:0 10px 24px rgba(28,52,96,.16);',
    'font:12px/1.45 -apple-system,"Segoe UI",system-ui,"Microsoft YaHei",sans-serif;color:#1e2a3d;',
    'opacity:0;transform:translateY(6px) scale(.96);transform-origin:0 100%;',
    'transition:opacity .22s ease,transform .22s ease;pointer-events:none;}',
    '#dpw-think.dpw-show{opacity:1;transform:none}',
    // 她贴右边站的时候，思考窗得往左长，不然会伸出窗口外
    '#dpw.dpw-flip #dpw-think{left:auto;right:-6px;transform-origin:100% 100%}',
    '#dpw.dpw-low #dpw-think{bottom:auto;top:calc(100% - 6px);transform-origin:0 0}',
    '#dpw.dpw-flip.dpw-low #dpw-think{transform-origin:100% 0}',
    '.dpw-head{display:flex;align-items:center;gap:5px;font-weight:600;font-size:11.5px;letter-spacing:.2px}',
    '.dpw-dots{display:inline-flex;gap:2px;margin-right:1px}',
    '.dpw-dots i{display:block;width:4px;height:4px;border-radius:50%;background:#3b7bd4;',
    'animation:dpw-blink 1.15s infinite}',
    '.dpw-dots i:nth-child(2){animation-delay:.18s}',
    '.dpw-dots i:nth-child(3){animation-delay:.36s}',
    '@keyframes dpw-blink{0%,80%,100%{opacity:.22;transform:translateY(0)}42%{opacity:1;transform:translateY(-2px)}}',
    '.dpw-sec{margin-left:auto;font-weight:500;opacity:.55;font-variant-numeric:tabular-nums}',
    '.dpw-title{margin-top:3px;font-size:11.5px;opacity:.9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.dpw-act{margin-top:2px;font-size:10.5px;opacity:.55;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.dpw-more{position:absolute;right:-7px;top:-7px;min-width:16px;height:16px;padding:0 4px;',
    'border-radius:8px;background:#3b7bd4;color:#fff;font-size:10px;line-height:16px;text-align:center}',
    // 深浅跟着宿主页面走（不是跟着系统走），DSH 换主题她也会换
    '#dpw.dpw-dark #dpw-think{background:rgba(26,32,44,.95);border-color:rgba(140,172,224,.22);color:#e7eefb}',
    '#dpw.dpw-dark .dpw-dots i{background:#7aa8ea}',

    // 余额气泡（挂在右侧，不跟思考窗抢位置）
    '#dpw-bubble{position:absolute;left:calc(100% - 10px);top:26%;padding:9px 13px 10px;',
    'border-radius:13px;background:rgba(255,255,255,.96);border:1px solid rgba(58,92,148,.16);',
    'box-shadow:0 12px 28px rgba(28,52,96,.18);white-space:nowrap;',
    'font:12px/1.5 -apple-system,"Segoe UI",system-ui,"Microsoft YaHei",sans-serif;color:#1e2a3d;',
    'opacity:0;transform:translateX(-6px) scale(.95);transform-origin:0 20%;',
    'transition:opacity .2s ease,transform .2s ease;pointer-events:none;}',
    '#dpw-bubble.dpw-show{opacity:1;transform:none}',
    '#dpw.dpw-flip #dpw-bubble{left:auto;right:calc(100% - 6px);transform-origin:100% 20%;',
    'transform:translateX(6px) scale(.95)}',
    '#dpw.dpw-flip #dpw-bubble.dpw-show{transform:none}',
    '.dpw-b-lab{font-size:10.5px;letter-spacing:.3px;opacity:.5}',
    '.dpw-b-val{font-size:19px;font-weight:650;letter-spacing:-.2px;margin-top:1px;',
    'font-variant-numeric:tabular-nums}',
    '.dpw-b-val small{font-size:12px;font-weight:500;opacity:.6;margin-right:2px}',
    // 第二个币种开始收小一号，别把气泡撑成两行大字
    '.dpw-b-val + .dpw-b-val{font-size:13.5px;font-weight:600;opacity:.72;margin-top:0}',
    '.dpw-b-val + .dpw-b-val small{font-size:10px}',
    '.dpw-b-sub{margin-top:3px;font-size:10.5px;opacity:.55}',
    // 碎碎念：左键点她时冒出来的那句话
    '.dpw-b-say{font-size:14px;font-weight:600;letter-spacing:.2px;white-space:nowrap}',
    '.dpw-b-err{max-width:190px;white-space:normal;font-size:11px;opacity:.7;margin-top:2px}',

    // 设置面板：鼠标放她身上按 S 打开，面板贴在她左边（贴右边缘自动翻到右边）
    '#dpw-set{position:absolute;z-index:6;right:calc(100% + 12px);bottom:0;width:254px;',
    'max-height:min(620px,calc(100vh - 36px));',
    'overflow:auto;overscroll-behavior:contain;padding:11px 11px 9px;border-radius:14px;',
    'background:rgba(255,255,255,.985);border:1px solid rgba(58,92,148,.18);',
    'box-shadow:0 18px 40px rgba(28,52,96,.22);',
    'font:12px/1.5 -apple-system,"Segoe UI",system-ui,"Microsoft YaHei",sans-serif;color:#1e2a3d;',
    'opacity:0;transform:translateX(8px) scale(.97);transform-origin:100% 100%;pointer-events:none;',
    'transition:opacity .18s ease,transform .18s ease;}',
    '#dpw-set.dpw-show{opacity:1;transform:none;pointer-events:auto}',
    // 她贴左边时面板才翻到右侧（其余情况一律开在左边，别开出去）
    '#dpw.dpw-set-r #dpw-set{right:auto;left:calc(100% + 12px);transform:translateX(-8px) scale(.97);',
    'transform-origin:0 100%}',
    '#dpw.dpw-set-r #dpw-set.dpw-show{transform:none}',
    '#dpw.dpw-dark #dpw-set{background:rgba(26,32,44,.985);border-color:rgba(140,172,224,.24);color:#e7eefb}',
    '.dpw-s-t{display:flex;align-items:center;gap:6px;font-weight:650;font-size:12px;margin-bottom:8px}',
    '.dpw-s-t i{margin-left:auto;font-style:normal;font-weight:500;opacity:.45;font-size:10.5px}',
    '.dpw-s-g{margin:8px 0 0;padding-top:8px;border-top:1px solid rgba(58,92,148,.12)}',
    '.dpw-s-g:first-of-type{margin-top:0;padding-top:0;border-top:0}',
    '.dpw-s-l{font-size:10.5px;letter-spacing:.3px;opacity:.5;margin-bottom:4px}',
    '.dpw-s-r{display:flex;align-items:center;gap:7px;margin:5px 0}',
    '.dpw-s-r>label{flex:0 0 58px;font-size:11.5px;opacity:.72}',
    '.dpw-s-r>input[type=range]{flex:1;min-width:0;height:16px;accent-color:#3b7bd4;cursor:pointer}',
    '.dpw-s-r>.v{flex:0 0 36px;text-align:right;font-size:11px;opacity:.55;',
    'font-variant-numeric:tabular-nums}',
    '.dpw-s-snd{display:flex;gap:4px;margin:3px 0 5px}',
    '.dpw-s-file{display:flex;gap:4px;align-items:center;margin:4px 0}',
    '.dpw-s-file button{flex:0 0 auto;padding:3px 8px;border-radius:8px;cursor:pointer;',
    'border:1px solid rgba(58,92,148,.2);background:transparent;color:inherit;font:inherit;font-size:11px}',
    '.dpw-s-file select{flex:1 1 auto;min-width:0;padding:3px 4px;border-radius:8px;',
    'border:1px solid rgba(58,92,148,.2);background:transparent;color:inherit;font:inherit;font-size:11px}',
    '.dpw-s-k{flex:0 0 30px;font-size:11px;opacity:.7}',
    '.dpw-s-snd button{flex:1 1 0;min-width:0;padding:3px 1px;border-radius:8px;cursor:pointer;',
    'border:1px solid rgba(58,92,148,.2);background:transparent;color:inherit;font:inherit;',
    'font-size:10.5px;white-space:nowrap;overflow:hidden}',
    '.dpw-s-snd button:hover{background:rgba(59,123,212,.13);border-color:rgba(59,123,212,.45)}',
    '.dpw-s-snd button:active{transform:scale(.96)}',
    '.dpw-s-sw{display:flex;align-items:center;gap:7px;margin:6px 0;font-size:11.5px;cursor:pointer}',
    '.dpw-s-sw input{accent-color:#3b7bd4;margin:0;cursor:pointer}',
    '.dpw-s-ta{width:100%;box-sizing:border-box;min-height:66px;resize:vertical;padding:6px 8px;',
    'border-radius:9px;border:1px solid rgba(58,92,148,.22);background:rgba(120,150,200,.07);',
    'color:inherit;font:11.5px/1.5 inherit;outline:none}',
    '.dpw-s-ta:focus{border-color:rgba(59,123,212,.6)}',
    '.dpw-s-h{margin-top:5px;font-size:10.5px;opacity:.45;line-height:1.45}',
    '.dpw-s-f{display:flex;gap:6px;margin-top:10px;padding-top:8px;border-top:1px solid rgba(58,92,148,.12)}',
    '.dpw-s-f button{flex:1;padding:5px 0;border-radius:9px;cursor:pointer;',
    'border:1px solid rgba(58,92,148,.2);background:transparent;color:inherit;font:inherit;font-size:11.5px}',
    '.dpw-s-f button:hover{background:rgba(59,123,212,.13)}',
    '#dpw.dpw-dark #dpw-bubble{background:rgba(26,32,44,.96);border-color:rgba(140,172,224,.22);color:#e7eefb}',
  ].join('')

  // ---------- DOM ----------
  var root = el('div')
  root.id = 'dpw'

  var think = el('div')
  think.id = 'dpw-think'

  var stage = el('div')
  stage.id = 'dpw-stage'

  var pop = el('div')
  pop.id = 'dpw-pop'

  // 图先问自定义那份，没有（404 → error）就退回内置那份；重开页面还记得换过什么
  function 挂图(img, 文件, 内置) {
    img.addEventListener('error', function () {
      if (img.src.indexOf('/custom?') >= 0) img.src = 前缀 + '/' + 内置
    })
    img.src = 前缀 + '/custom?f=' + encodeURIComponent(文件) + '&t=' + Date.now()
  }

  var tail = el('img')
  tail.id = 'dpw-tail'
  tail.alt = ''
  挂图(tail, 'tail.webp', 'tail.webp')

  var body = el('img')
  body.id = 'dpw-body'
  body.alt = '桌宠'
  挂图(body, 'char.webp', 'char.webp')

  var bubble = el('div')
  bubble.id = 'dpw-bubble'

  pop.appendChild(tail)
  pop.appendChild(body)
  stage.appendChild(pop)
  root.appendChild(think)
  root.appendChild(stage)
  root.appendChild(bubble)

  var 样式 = el('style')
  样式.textContent = css

  // ---------- 状态 ----------
  var 本地 = { x: null, y: null, size: 240 }
  try {
    var raw = JSON.parse(localStorage.getItem(本地键) || 'null')
    if (raw && typeof raw === 'object') {
      if (typeof raw.x === 'number') 本地.x = raw.x
      if (typeof raw.y === 'number') 本地.y = raw.y
      if (typeof raw.size === 'number') 本地.size = raw.size
    }
  } catch (e) {}
  var 大小 = Math.min(560, Math.max(120, 本地.size || 240))

  var 状态 = null
  var 拉着 = false
  var 气泡开 = false
  var 上次刷新 = 0

  function 宽() { return Math.round(大小 * 比例) }

  function 摆位(x, y) {
    var w = 宽()
    var h = 大小
    var maxX = Math.max(0, window.innerWidth - w)
    var maxY = Math.max(0, window.innerHeight - h)
    x = Math.min(maxX, Math.max(0, Math.round(x)))
    y = Math.min(maxY, Math.max(0, Math.round(y)))
    root.style.left = x + 'px'
    root.style.top = y + 'px'
    root.style.width = w + 'px'
    root.style.height = h + 'px'
    本地.x = x
    本地.y = y
    root.classList.toggle('dpw-flip', x + w + 210 > window.innerWidth)
    root.classList.toggle('dpw-low', y < 120)
    // 贴左边缘时设置面板翻到右边，否则一律开在左边
    root.classList.toggle('dpw-set-r', x < 268)
  }

  function 默认位() {
    var w = 宽()
    var h = 大小
    // 别压着底部输入框，往上一截
    摆位(window.innerWidth - w - 36, window.innerHeight - h - 96)
    // 下一次打开时她能落在同一个坑里
    if (本地.x == null) 保存位()
  }

  摆位(本地.x == null ? window.innerWidth - 宽() - 36 : 本地.x,
    本地.y == null ? window.innerHeight - 大小 - 96 : 本地.y)

  // ---------- 存位置 ----------
  var 存定时 = null
  function 保存位() {
    try {
      localStorage.setItem(本地键, JSON.stringify({ x: 本地.x, y: 本地.y, size: 大小 }))
    } catch (e) {}
    if (存定时) clearTimeout(存定时)
    存定时 = setTimeout(function () {
      存定时 = null
      try {
        fetch(前缀 + '/config', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ x: 本地.x, y: 本地.y, size: 大小 }),
        }).catch(function () {})
      } catch (e) {}
    }, 700)
  }

  // ---------- 交互 ----------
  var 按下 = null
  var 拖了 = false

  function 下(e) {
    if (e.button !== undefined && e.button !== 0) return
    按下 = { x: e.clientX, y: e.clientY, ox: 本地.x == null ? 0 : 本地.x, oy: 本地.y == null ? 0 : 本地.y }
    拖了 = false
    放音('press')
    root.classList.add('dpw-drag')
    try { root.setPointerCapture(e.pointerId) } catch (err) {}
    e.preventDefault()
  }

  function 动(e) {
    if (!按下) return
    var dx = e.clientX - 按下.x
    var dy = e.clientY - 按下.y
    if (!拖了 && Math.abs(dx) + Math.abs(dy) > 4) { 拖了 = true; 收气泡() }
    if (!拖了) return
    摆位(按下.ox + dx, 按下.oy + dy)
  }

  function 起(e) {
    if (!按下) return
    var 是点击 = !拖了
    按下 = null
    root.classList.remove('dpw-drag')
    try { root.releasePointerCapture(e.pointerId) } catch (err) {}
    if (拖了) { 保存位(); return }
    if (是点击) { 放音('release'); 点她() }
  }

  // 左键 = 碎碎念，右键 = 报余额（两个键都先弹一下，尾巴跟着抽）
  var 上次点 = 0
  var 上句 = ''
  var 正在说 = false
  // 台词池跟着设置面板的「提示字」走；面板清空了就退回默认那五句
  function 台词() { return 选项.lines.length ? 选项.lines : 预设台词 }

  function 说一句() {
    var 池 = 台词()
    var i = 0
    var 试 = 0
    do {
      i = Math.floor(Math.random() * 池.length)
      试++
    } while (试 <= 8 && 池.length > 1 && 池[i] === 上句)
    上句 = 池[i]
    正在说 = true
    bubble.innerHTML = ''
    bubble.appendChild(el('div', 'dpw-b-say', 上句))
    开气泡()
    // 碎碎念用自己的定时器，别和"自动收"抢同一个变量（抢了会互相清掉，气泡就永远挂着了）
    if (念定时) clearTimeout(念定时)
    念定时 = setTimeout(function () {
      正在说 = false
      收气泡()
    }, 1800)
  }

  // 弹一下（左右键共用）
  function 弹一下() {
    pop.classList.remove('dpw-pop')
    void pop.offsetWidth // 重新触发动画
    pop.classList.add('dpw-pop')
    root.classList.add('dpw-kick')
    setTimeout(function () { root.classList.remove('dpw-kick') }, 500)
  }

  // 左键：碎碎念
  function 点她() {
    弹一下()
    说一句()
  }

  // 右键：金额（气泡开着就刷一下数值）
  function 点她钱() {
    弹一下()
    if (气泡开 && !正在说) {
      画气泡()
      挂自动收()
      拉状态(Date.now() - 上次刷新 > 5000)
      return
    }
    开气泡()
    挂自动收()
    拉状态(Date.now() - 上次刷新 > 30000)
  }

  // 没人再点了就自己收，省得气泡一直挂在那
  function 挂自动收() {
    if (气泡定时) clearTimeout(气泡定时)
    气泡定时 = setTimeout(function () {
      // 到点就收，不看"正在说"——那一会儿碎碎念早过去了，卡住就再也不收
      收气泡()
    }, Math.round(选项.dwell * 1000))
  }

  function 开气泡() {
    气泡开 = true
    bubble.classList.add('dpw-show')
  }
  function 收气泡() {
    气泡开 = false
    正在说 = false
    if (气泡定时) { clearTimeout(气泡定时); 气泡定时 = null }
    if (念定时) { clearTimeout(念定时); 念定时 = null }
    bubble.classList.remove('dpw-show')
  }

  root.addEventListener('pointerdown', 下)
  root.addEventListener('pointermove', 动)
  root.addEventListener('pointerup', 起)
  root.addEventListener('pointercancel', function () { 按下 = null; root.classList.remove('dpw-drag') })

  // 右键她：报余额（再右键换币种）。静音不在这干，去设置面板关
  root.addEventListener('contextmenu', function (e) {
    e.preventDefault()
    放音('release')
    点她钱()
  })
  var 气泡定时 = null
  var 念定时 = null

  // 滚轮改大小（桌宠不大不小刚刚好，自己调）
  root.addEventListener('wheel', function (e) {
    e.preventDefault()
    大小 = Math.min(560, Math.max(120, 大小 + (e.deltaY > 0 ? -16 : 16)))
    摆位(本地.x == null ? window.innerWidth - 宽() - 36 : 本地.x,
      本地.y == null ? window.innerHeight - 大小 - 96 : 本地.y)
    保存位()
  }, { passive: false })

  // ---------- 数据 ----------
  function 秒数(ms) {
    var s = Math.max(0, Math.round(ms / 1000))
    if (s < 60) return s + 's'
    var m = Math.floor(s / 60)
    return m + 'm' + (s % 60 ? String(s % 60).padStart(2, '0') + 's' : '')
  }

  function 钱(n, cur) {
    if (n == null || !isFinite(n)) return '—'
    var 符号 = cur === 'USD' ? '$' : '¥'
    return 符号 + n.toFixed(2)
  }

  function 画思考() {
    // 面板开着的时候别画思考窗（1.5 秒的轮询会把它又顶回来）
    if (设开) {
      think.classList.remove('dpw-show')
      root.classList.remove('dpw-live')
      return
    }
    // 设置里关了「探测对话」：思考窗就不该再冒头
    if (!选项.detect) {
      think.classList.remove('dpw-show')
      root.classList.remove('dpw-live')
      return
    }
    var 等 = (状态 && 状态.等待) || null
    var 跑 = (状态 && 状态.运行) || []
    if (!等 && !跑.length) { think.classList.remove('dpw-show'); root.classList.remove('dpw-live'); return }
    root.classList.add('dpw-live')
    var 主 = 跑[0] || {}
    var 剩 = 跑.length - 1

    think.innerHTML = ''
    var head = el('div', 'dpw-head')
    var dots = el('span', 'dpw-dots')
    dots.appendChild(el('i')); dots.appendChild(el('i')); dots.appendChild(el('i'))
    head.appendChild(dots)
    // 在等你的时候，标题换掉——这比"思考中"有用得多
    var 文案 = 等 ? (等.kind === 'approval' ? '等你授权' : '等你回答')
      : (跑.length > 1 ? '思考中 ×' + 跑.length : '思考中')
    head.appendChild(el('span', null, 文案))
    var 起点 = 等 ? 等.since : 主.since
    var 秒 = el('span', 'dpw-sec', 秒数((状态.now || Date.now()) - 起点))
    秒.setAttribute('data-since', String(起点))
    head.appendChild(秒)
    think.appendChild(head)

    var 名 = (等 && 等.title) || 主.title || '新对话'
    var 标题 = el('div', 'dpw-title', 名)
    标题.title = 名
    think.appendChild(标题)

    if (等) {
      think.appendChild(el('div', 'dpw-act', 等.kind === 'approval' ? '在等你点授权' : '在等你回一句'))
    } else if (主.action) {
      think.appendChild(el('div', 'dpw-act', '正在 ' + 主.action))
    }

    if (剩 > 0) think.appendChild(el('div', 'dpw-more', '+' + 剩))
    think.classList.add('dpw-show')
  }

  function 画气泡() {
    // 碎碎念有自己的 1.8 秒，别让 1.5 秒的轮询当场把它擦掉
    if (正在说) return
    if (!状态 || !状态.余额) {
      bubble.innerHTML = ''
      bubble.appendChild(el('div', 'dpw-b-lab', 'DeepSeek 余额'))
      bubble.appendChild(el('div', 'dpw-b-err', '还没读到'))
      return
    }
    var b = 状态.余额
    bubble.innerHTML = ''
    bubble.appendChild(el('div', 'dpw-b-lab', 'DeepSeek 余额'))
    if (!b.ok) {
      bubble.appendChild(el('div', 'dpw-b-err', b.error || '读不到余额'))
      return
    }
    // 只报一条：优先有钱的那条（CNY 优先），全零才退回第一条
    // 之前死认 CNY，钱全在美元上时会一直显示 0.00
    var 钱包 = (b.wallets && b.wallets.length) ? b.wallets : []
    var w = null
    for (var i = 0; i < 钱包.length; i++) {
      if (Number(钱包[i].total) > 0) { w = 钱包[i]; break }
    }
    if (!w) {
      for (var j = 0; j < 钱包.length; j++) {
        if (String(钱包[j].currency).toUpperCase() === 'CNY') { w = 钱包[j]; break }
      }
    }
    if (!w) w = 钱包[0] || { currency: b.currency || 'CNY', total: b.remaining, granted: b.granted, topped: b.topped }
    var 币 = String(w.currency || 'CNY').toUpperCase()
    var 符号 = 币 === 'USD' ? '$' : '¥'
    var 总值 = w.total != null ? w.total : b.remaining
    var val = el('div', 'dpw-b-val')
    val.appendChild(el('small', null, 符号))
    val.appendChild(document.createTextNode(总值 == null ? '—' : Number(总值).toFixed(2)))
    bubble.appendChild(val)
    var 细 = []
    if (w.granted != null) 细.push('赠金 ' + 钱(w.granted, 币))
    if (w.topped != null) 细.push('充值 ' + 钱(w.topped, 币))
    if (细.length) bubble.appendChild(el('div', 'dpw-b-sub', 细.join(' · ')))
    if (b.available === false) bubble.appendChild(el('div', 'dpw-b-sub', '余额已用尽'))
  }

  function 计时() {
    var s = think.querySelector('.dpw-sec')
    if (!s) return
    var since = Number(s.getAttribute('data-since') || 0)
    if (since) s.textContent = 秒数(Date.now() - since)
  }

  // 宿主是深色还是浅色：读 body 底色算亮度，透明就用 html 的
  function 深色() {
    try {
      var bg = ''
      var b = document.body
      while (b) {
        bg = getComputedStyle(b).backgroundColor
        if (bg && bg !== 'transparent' && !/rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(bg)) break
        b = b.parentElement
      }
      var m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(bg || '')
      if (!m) return false
      var a = /rgba\([^)]*,\s*([\d.]+)\s*\)/.exec(bg)
      if (a && Number(a[1]) < 0.2) return false
      var 亮 = (Number(m[1]) * 299 + Number(m[2]) * 587 + Number(m[3]) * 114) / 1000
      return 亮 < 128
    } catch (e) { return false }
  }

  // 事件音：只在"状态真的变了"时响，别每 1.5 秒刷一次就响一次
  var 等标 = null
  var 结束标 = null

  function 拉状态(refresh) {
    // 设置里关掉「探测对话」：一个请求都不发，聊天记录/余额也不再刷新
    if (!选项.detect) { 画思考(); return }
    if (拉着) return
    拉着 = true
    var url = 前缀 + '/state' + (refresh ? '?refresh=1' : '')
    fetch(url, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null })
      .then(function (d) {
        if (!d || !d.ok) return
        上次刷新 = Date.now()

        // —— 先响音，再重画（响的是"刚发生的这件事"）——
        var 新等标 = d.等待 ? d.等待.stamp : 0
        if (等标 === null) 等标 = 新等标
        else if (新等标 !== 等标) {
          等标 = 新等标
          if (d.等待) 放音(d.等待.kind === 'approval' ? 'approve' : 'ask')
        }
        var 新结束 = typeof d.结束数 === 'number' ? d.结束数 : 0
        if (结束标 === null) 结束标 = 新结束
        else if (新结束 > 结束标) { 结束标 = 新结束; 放音('end') }

        状态 = d
        root.classList.toggle('dpw-dark', 深色())
        // 第一次拿到配置：把她挪到上次的位置
        var c = d.配置
        if (c && !root.getAttribute('data-placed')) {
          root.setAttribute('data-placed', '1')
          if (typeof c.size === 'number' && !本地有大小) { 大小 = c.size }
          if (typeof c.x === 'number' && typeof c.y === 'number') 摆位(c.x, c.y)
          else 默认位()
        }
        画思考()
        画气泡()
      })
      .catch(function () {})
      .finally(function () { 拉着 = false })
  }

  // ---------- 设置面板 ----------
  // 鼠标停在她身上时按 S 开/关。改一项当场生效，同时记进 localStorage 和宿主配置。
  var 设 = el('div')
  设.id = 'dpw-set'
  var 设开 = false
  root.style.setProperty('--dpw-sway', String(选项.sway))

  // 用气泡说一句短话（上传成功/失败之类），2 秒自己收
  var 提定时 = null
  function 提一句(文本) {
    if (设开) return
    bubble.innerHTML = ''
    bubble.appendChild(el('div', 'dpw-b-say', 文本))
    开气泡()
    if (提定时) clearTimeout(提定时)
    提定时 = setTimeout(function () { 提定时 = null; if (!正在说) 收气泡() }, 2200)
  }

  // 选完文件 → dataURL → POST /upload → 宿主写进 ~/.dsh/pet-whale-custom/
  function 传文件(文件名, file, 回) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { 提一句('这个文件太大了（限 5MB）'); return }
    var fr = new FileReader()
    fr.onload = function () {
      fetch(前缀 + '/upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ f: 文件名, data: String(fr.result) }),
      }).then(function (r) { return r.json() })
        .then(function (d) {
          if (d && d.ok) { 自定戳 = Date.now(); 回(true) }
          else 回(false, (d && d.error) || '没传上')
        })
        .catch(function () { 回(false, '宿主没应答') })
    }
    fr.onerror = function () { 回(false, '这个文件读不了') }
    fr.readAsDataURL(file)
  }

  // 造一个隐藏的 file input，点按钮就打开选择框
  function 选文件(accept, cb) {
    var inp = document.createElement('input')
    inp.type = 'file'
    inp.accept = accept
    inp.style.display = 'none'
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0]
      cb(f)
      inp.remove()
    })
    document.body.appendChild(inp)
    inp.click()
  }

  function 小按钮(文本, on) {
    var b = document.createElement('button')
    b.type = 'button'
    b.textContent = 文本
    b.addEventListener('click', on)
    return b
  }

  function 行(标签, 键, min, max, step, 值, 单位, on) {
    var r = el('div', 'dpw-s-r')
    r.appendChild(el('label', null, 标签))
    var inp = document.createElement('input')
    inp.type = 'range'
    inp.min = String(min)
    inp.max = String(max)
    inp.step = String(step)
    inp.value = String(值)
    inp.setAttribute('data-k', 键)
    inp.setAttribute('data-unit', 单位 || '')
    var v = el('span', 'v', 值 + (单位 || ''))
    inp.addEventListener('input', function () {
      v.textContent = inp.value + (单位 || '')
      on(Number(inp.value), false)
    })
    inp.addEventListener('change', function () { on(Number(inp.value), true) })
    r.appendChild(inp)
    r.appendChild(v)
    return r
  }

  function 开关(标签, 键, 值, on) {
    var l = el('label', 'dpw-s-sw')
    var inp = document.createElement('input')
    inp.type = 'checkbox'
    inp.checked = !!值
    inp.setAttribute('data-k', 键)
    inp.addEventListener('change', function () { on(inp.checked, true) })
    l.appendChild(inp)
    l.appendChild(el('span', null, 标签))
    return l
  }

  // 恢复默认后要把控件也拨回去（滑块和勾选都按 data-k 对上）
  function 重画设置() {
    var rs = 设.querySelectorAll('input[type=range]')
    for (var i = 0; i < rs.length; i++) {
      var k = rs[i].getAttribute('data-k')
      if (!k) continue
      var 值 = k === 'size' ? 大小 : (k === 'sway' ? Math.round(选项.sway * 100) : 选项[k])
      if (!Number.isFinite(值)) continue
      rs[i].value = String(值)
      var v = rs[i].parentNode.querySelector('.v')
      if (v) v.textContent = 值 + (rs[i].getAttribute('data-unit') || '')
    }
    var cs = 设.querySelectorAll('input[type=checkbox]')
    for (var j = 0; j < cs.length; j++) {
      var k2 = cs[j].getAttribute('data-k')
      if (k2) cs[j].checked = !!选项[k2]
    }
  }

  function 开设置(开) {
    设开 = !!开
    设.classList.toggle('dpw-show', 设开)
    if (设开) {
      重画设置()
      // 思考窗会压到面板右上角，先收起来；关面板时再画回来
      think.classList.remove('dpw-show')
    } else {
      画思考()
    }
  }

  var 设头 = el('div', 'dpw-s-t')
  设头.appendChild(el('b', null, '桌宠设置'))
  设头.appendChild(el('i', null, 'S 关闭'))
  设.appendChild(设头)

  // —— 声音 ——
  var 声组 = el('div', 'dpw-s-g')
  声组.appendChild(el('div', 'dpw-s-l', '声音'))
  声组.appendChild(行('总音量', 'volume', 0, 100, 5, 选项.volume, '%', function (n, 落盘) {
    选项.volume = 夹(Math.round(n), 0, 100)
    调音量()
    保存选项(落盘)
  }))
  var 试听 = el('div', 'dpw-s-snd')
  var 音名 = [['press', '按下'], ['release', '松开'], ['ask', '提问'], ['approve', '授权'], ['end', '跑完']]
  for (var si = 0; si < 音名.length; si++) {
    ;(function (对) {
      var b = document.createElement('button')
      b.type = 'button'
      b.textContent = 对[1]
      b.title = '点一下试听；换音效在下面「音效文件」'
      b.addEventListener('click', function () { 放音(对[0]) })
      试听.appendChild(b)
    })(音名[si])
  }
  声组.appendChild(试听)
  // 换自己的音效：一个下拉选哪一支 + 一个「换」按钮，省地方
  var 音选 = document.createElement('select')
  音选.className = 'dpw-s-sel'
  for (var sj = 0; sj < 音名.length; sj++) {
    var o = document.createElement('option')
    o.value = 音名[sj][0]
    o.textContent = 音名[sj][1]
    音选.appendChild(o)
  }
  var 音行 = el('div', 'dpw-s-file')
  音行.appendChild(音选)
  音行.appendChild(小按钮('换…', function () {
    var 名 = 音选.value
    选文件('audio/*', function (f) {
      传文件(名 + '.' + (/\.wav$/i.test(f.name) ? 'wav' : 'mp3'), f, function (ok, 错) {
        if (!ok) { 提一句('没换成：' + 错); return }
        var a = 音[名]
        if (a) {
          a.src = 自定义源(名 + '.' + (/\.wav$/i.test(f.name) ? 'wav' : 'mp3'))
          a.load()
        }
        放音(名)
        提一句('这一声换成你的了')
      })
    })
  }))
  音行.appendChild(小按钮('还原', function () {
    var 名 = 音选.value
    fetch(前缀 + '/reset', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ f: 名 + '.mp3' }),
    }).catch(function () {})
    fetch(前缀 + '/reset', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ f: 名 + '.wav' }),
    }).catch(function () {})
    var a = 音[名]
    if (a) { a.src = 前缀 + '/sounds/' + (音源[名] || ''); a.load() }
    提一句('换回内置的了')
  }))
  声组.appendChild(音行)
  声组.appendChild(el('div', 'dpw-s-h', '选一支、点「换…」挑你自己的音频（mp3/wav，5MB 以内）。'))
  声组.appendChild(开关('静音（一声都不响）', 'muted', 选项.muted, function (v, 落盘) {
    选项.muted = v
    保存选项(落盘)
    if (!v) 放音('release')
  }))
  设.appendChild(声组)

  // —— 表现 ——
  var 貌组 = el('div', 'dpw-s-g')
  貌组.appendChild(el('div', 'dpw-s-l', '表现'))
  貌组.appendChild(行('气泡停留', 'dwell', 1, 15, 1, 选项.dwell, 's', function (n, 落盘) {
    选项.dwell = 夹(n, 1, 15)
    保存选项(落盘)
  }))
  貌组.appendChild(行('尾巴快慢', 'sway', 30, 250, 10, Math.round(选项.sway * 100), '%', function (n, 落盘) {
    选项.sway = 夹(n / 100, 0.3, 2.5)
    root.style.setProperty('--dpw-sway', String(选项.sway))
    保存选项(落盘)
  }))
  貌组.appendChild(行('她的大小', 'size', 120, 560, 10, 大小, '', function (n, 落盘) {
    大小 = 夹(Math.round(n), 120, 560)
    摆位(本地.x == null ? window.innerWidth - 宽() - 36 : 本地.x,
      本地.y == null ? window.innerHeight - 大小 - 96 : 本地.y)
    保存位()
    保存选项(落盘)
  }))
  设.appendChild(貌组)

  // —— 形象（换成自己的兽）——
  var 形组 = el('div', 'dpw-s-g')
  形组.appendChild(el('div', 'dpw-s-l', '形象'))
  var 身图 = root.querySelector('#dpw-body')
  var 尾图 = root.querySelector('#dpw-tail')
  function 换形象(文件, 图, 提示) {
    选文件('image/*', function (f) {
      传文件(文件, f, function (ok, 错) {
        if (!ok) { 提一句('没换成：' + 错); return }
        if (图) 图.src = 自定义源(文件)
        提一句(提示)
      })
    })
  }
  function 还形象(文件, 图, 内置) {
    fetch(前缀 + '/reset', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ f: 文件 }),
    }).catch(function () {})
    if (图) 图.src = 前缀 + '/' + 内置
    提一句('换回原来那只了')
  }
  var 身行 = el('div', 'dpw-s-file')
  身行.appendChild(el('span', 'dpw-s-k', '身体'))
  身行.appendChild(小按钮('换…', function () { 换形象('char.webp', 身图, '身体换了') }))
  身行.appendChild(小按钮('还原', function () { 还形象('char.webp', 身图, 'char.webp') }))
  形组.appendChild(身行)

  var 尾行 = el('div', 'dpw-s-file')
  尾行.appendChild(el('span', 'dpw-s-k', '尾巴'))
  尾行.appendChild(小按钮('换…', function () { 换形象('tail.webp', 尾图, '尾巴换了') }))
  尾行.appendChild(小按钮('还原', function () { 还形象('tail.webp', 尾图, 'tail.webp') }))
  形组.appendChild(尾行)

  形组.appendChild(小按钮('两只都还原', function () {
    fetch(前缀 + '/reset', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ f: 'all' }),
    }).catch(function () {})
    if (身图) 身图.src = 前缀 + '/char.webp'
    if (尾图) 尾图.src = 前缀 + '/tail.webp'
    提一句('换回原来那只了')
  }))
  形组.appendChild(el('div', 'dpw-s-h', '身体和尾巴都换成自己的图（png / webp / jpg，5MB 以内）。'))
  设.appendChild(形组)

  // —— 对话 ——
  var 话组 = el('div', 'dpw-s-g')
  话组.appendChild(el('div', 'dpw-s-l', '对话'))
  话组.appendChild(开关('探测对话（思考窗 / 余额）', 'detect', 选项.detect, function (v, 落盘) {
    选项.detect = v
    保存选项(落盘)
    if (v) 拉状态(true)
    else 画思考()
  }))
  话组.appendChild(el('div', 'dpw-s-h', '关掉就不问宿主了：没有思考窗，也不刷新余额，页面更轻。'))
  设.appendChild(话组)

  // —— 提示字 ——
  var 字组 = el('div', 'dpw-s-g')
  字组.appendChild(el('div', 'dpw-s-l', '提示字 · 一行一句'))
  var 台词框 = document.createElement('textarea')
  台词框.className = 'dpw-s-ta'
  台词框.value = 选项.lines.join('\n')
  台词框.placeholder = 预设台词.join('\n')
  台词框.addEventListener('input', function () {
    选项.lines = 台词框.value.split('\n').map(function (s) { return s.trim() }).filter(Boolean).slice(0, 30)
    保存选项(false)
  })
  台词框.addEventListener('change', function () { 保存选项(true) })
  // 在框里敲 s 不该被当成"开设置"
  台词框.addEventListener('keydown', function (e) { e.stopPropagation() })
  字组.appendChild(台词框)
  字组.appendChild(el('div', 'dpw-s-h', '左键点她时随机抽一句。清空 = 用回默认那五句。'))
  设.appendChild(字组)

  // —— 底部 ——
  var 设脚 = el('div', 'dpw-s-f')
  var 重设 = document.createElement('button')
  重设.type = 'button'
  重设.textContent = '恢复默认'
  重设.addEventListener('click', function () {
    选项.volume = 预设选项.volume
    选项.muted = 预设选项.muted
    选项.dwell = 预设选项.dwell
    选项.detect = 预设选项.detect
    选项.sway = 预设选项.sway
    选项.lines = 预设台词.slice()
    调音量()
    root.style.setProperty('--dpw-sway', String(选项.sway))
    台词框.value = 选项.lines.join('\n')
    保存选项(true)
    重画设置()
    画思考()
  })
  var 关钮 = document.createElement('button')
  关钮.type = 'button'
  关钮.textContent = '关闭'
  关钮.addEventListener('click', function () { 开设置(false) })
  设脚.appendChild(重设)
  设脚.appendChild(关钮)
  设.appendChild(设脚)

  // 面板里点一下 / 滚一下都别传给桌宠（传下去就成了"拖动她"和"改大小"）
  设.addEventListener('pointerdown', function (e) { e.stopPropagation() })
  设.addEventListener('wheel', function (e) { e.stopPropagation() }, { passive: true })

  var 悬停 = false
  root.addEventListener('pointerenter', function () { 悬停 = true })
  root.addEventListener('pointerleave', function () { 悬停 = false })

  // 捕获阶段拦下 S，别让它漏给宿主自己的快捷键
  window.addEventListener('keydown', function (e) {
    var t = e.target
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
    if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return
    if (e.key !== 's' && e.key !== 'S') return
    if (!悬停 && !设开) return
    e.preventDefault()
    e.stopPropagation()
    开设置(!设开)
  }, true)

  root.appendChild(设)

  var 本地有大小 = false
  try {
    var raw2 = JSON.parse(localStorage.getItem(本地键) || 'null')
    本地有大小 = !!(raw2 && typeof raw2.size === 'number')
  } catch (e) {}
  if (本地有大小) root.setAttribute('data-placed', '1')

  // ---------- 挂上去 ----------
  function 挂载() {
    if (document.getElementById('dpw')) return
    try { window.__dshPetWhaleStage = 'append' } catch (e) {}
    ;(document.body || document.documentElement).appendChild(样式)
    ;(document.body || document.documentElement).appendChild(root)
    try { window.__dshPetWhale = 1; window.__dshPetWhaleStage = 'mounted' } catch (e) {}
    requestAnimationFrame(function () { root.classList.add('dpw-on') })
    拉状态(false)
    // 1.5 秒一问：要抓「等你回答 / 等你授权」这种瞬时状态，3 秒太钝了
    setInterval(function () { 拉状态(false) }, 1500)
    setInterval(计时, 500)
    window.addEventListener('resize', function () {
      if (本地.x == null || 本地.y == null) return
      摆位(本地.x, 本地.y)
    })
  }

  if (document.body) 挂载()
  else document.addEventListener('DOMContentLoaded', 挂载)
})()

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
