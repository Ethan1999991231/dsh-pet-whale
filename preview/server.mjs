// 本地预览用的假后端：把 assets 当真资源喂，state 喂一份假数据。
// 只是给自己看效果，不进包。PORT 可选，默认 7788。
//
// 用无头浏览器截图时，CSS transition 在虚拟时钟下会卡在中间态，
// 所以页面里把过渡关掉——这只影响预览，插件本身该有过渡还是有。
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const 这里 = dirname(fileURLToPath(import.meta.url))
const 根 = dirname(这里)
const 端口 = Number(process.env.PORT || 7788)

const 状态 = {
  ok: true,
  余额: { ok: true, remaining: 42.87, currency: 'CNY', granted: 5, topped: 37.87,
    wallets: [
      { currency: 'CNY', total: 42.87, granted: 5, topped: 37.87 },
      { currency: 'USD', total: 6.02, granted: 0, topped: 6.02 },
    ], available: true, at: Date.now() },
  运行: [{ id: 's1', title: '做个桌宠插件：尾巴会摆、点一下弹余额', since: Date.now() - 74000, action: 'run_code' }],
  配置: { enabled: true, size: 300, x: null, y: null, think: true },
  now: Date.now(),
}

const 页 = `<!doctype html><meta charset="utf-8"><meta name="color-scheme" content="light"><title>pet</title>
<style>
html,body{margin:0;height:100%;background:#eef3fb}
#dpw,#dpw *,#dpw *::before,#dpw *::after{transition:none!important}
</style>
<script src="/dsh-pet-whale/pet.js"></script>
<script>
var q = new URLSearchParams(location.search);
window.onerror = function(m){ window.__err = String(m); };
var deg = q.get('tail');
if (deg !== null) {
  setTimeout(function(){
    var t = document.getElementById('dpw-tail');
    if (t) { t.style.animation = 'none'; t.style.transform = 'rotate(' + deg + 'deg)'; }
  }, 400);
}
if (q.get('pop') !== 'off' || q.get('cyc') || q.get('mix') || q.get('rclk') || q.get('dbl')) setTimeout(function(){
  var r = document.getElementById('dpw');
  if (!r) return;
  function evi(t, x, y){ return new PointerEvent(t, {bubbles:true, clientX:x, clientY:y, button:0, pointerId:1}); }
  function 点(){
    var box = r.getBoundingClientRect();
    r.dispatchEvent(evi('pointerdown', box.left+50, box.top+60));
    r.dispatchEvent(evi('pointerup', box.left+50, box.top+60));
  }
  if (q.get('pop') !== 'off') 点();
  // ?dbl=1：隔 260ms 再点一下，验证"连点两下说碎碎念"
  if (q.get('dbl') === '1') setTimeout(function(){
    window.__err = window.__err || '';
    点();
    setTimeout(function(){
      var b = document.getElementById('dpw-bubble');
      document.title = (window.__err ? 'ERR:' + window.__err + ' | ' : '') + 'BUBBLE:' + (b ? b.textContent : 'none');
    }, 60);
  }, 260);
  // ?rclk=N：右键 N 次，验证第一下出金额、再一下换币种
  if (q.get('rclk')) setTimeout(function(){
    var r = document.getElementById('dpw');
    if (!r) return;
    var n = Math.max(1, Number(q.get('rclk')) || 1);
    var i = 0;
    function 右(){
      r.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 700, clientY: 520 }));
      if (++i < n) setTimeout(右, 320);
      else setTimeout(function(){
        var b = document.getElementById('dpw-bubble');
        document.title = (window.__err ? 'ERR:' + window.__err + ' | ' : '') + 'RCLK:' + (b ? b.textContent : 'none');
      }, 900);
    }
    右();
  }, 500);
  // ?mix=1：复现"气泡永不消失"的老 bug —— 开气泡 → 连点两下出碎碎念 → 再点一下换单位
  // 之后等到 20 秒，看气泡有没有自己收（修复后应为 hidden）
  if (q.get('mix') === '1') {
    点();
    setTimeout(点, 300);
    setTimeout(点, 560);
    setTimeout(点, 1100);
    setTimeout(function(){
      var b = document.getElementById('dpw-bubble');
      var showing = !!(b && b.classList.contains('dpw-show'));
      document.title = 'LATE:' + (showing ? 'SHOWING' : 'hidden');
    }, 20000);
  }
  // ?cyc=N：隔 700ms 连点 N 下，验证「每次点击换单位」（700ms > 420ms 连点窗口）
  if (q.get('cyc')) {
    var 次 = Number(q.get('cyc')) || 2;
    var n = 0;
    var tick = setInterval(function(){
      n++;
      点();
      if (n >= 次) {
        clearInterval(tick);
        setTimeout(function(){
          var b = document.getElementById('dpw-bubble');
          document.title = (window.__err ? 'ERR:' + window.__err + ' | ' : '') + 'BUBBLE:' + (b ? b.textContent : 'none');
        }, 80);
      }
    }, 700);
  }
}, 600);
// ?set=1：验证"鼠标停她身上按 S 开设置"，顺带数一下面板里控件个数
if (q.get('set') === '1') setTimeout(function(){
  var r = document.getElementById('dpw');
  if (!r) { document.title = 'NO_ROOT'; return; }
  r.dispatchEvent(new PointerEvent('pointerenter'));
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', bubbles: true }));
  setTimeout(function(){
    var p = document.getElementById('dpw-set');
    var open = !!(p && p.classList.contains('dpw-show'));
    document.title = (window.__err ? 'ERR:' + window.__err + ' | ' : '') + 'SET:' + (open ? 'open' : 'closed')
      + ' | ranges=' + (p ? p.querySelectorAll('input[type=range]').length : 0)
      + ' | cks=' + (p ? p.querySelectorAll('input[type=checkbox]').length : 0)
      + ' | ta=' + (p && p.querySelector('textarea') ? 'y' : 'n');
  }, 300);
}, 900);
// ?set=2：开面板后真去拖「气泡停留」滑块，验证"改了就生效 + 记住"
if (q.get('set') === '2') setTimeout(function(){
  var r = document.getElementById('dpw');
  if (!r) { document.title = 'NO_ROOT'; return; }
  r.dispatchEvent(new PointerEvent('pointerenter'));
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', bubbles: true }));
  setTimeout(function(){
    var p = document.getElementById('dpw-set');
    var sl = p && p.querySelector('input[data-k="dwell"]');
    if (!sl) { document.title = 'NO_SLIDER'; return; }
    sl.value = '9';
    sl.dispatchEvent(new Event('input', { bubbles: true }));
    setTimeout(function(){
      var o = window.__dpwOpt || {};
      var ls = localStorage.getItem('dsh-pet-whale.opts') || '{}';
      document.title = 'DWELL=' + o.dwell + ' | SHOW=' + (p.querySelector('.dpw-s-r .v') ? '' : '')
        + ' | LS=' + ls;
    }, 200);
  }, 300);
}, 900);
</script>`

const 类型 = { '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.html': 'text/html; charset=utf-8' }
const 表 = {
  '/dsh-pet-whale/pet.js': join(根, 'assets', 'pet.js'),
  '/dsh-pet-whale/char.webp': join(根, 'assets', 'char.webp'),
  '/dsh-pet-whale/tail.webp': join(根, 'assets', 'tail.webp'),
}

createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost')
  if (u.pathname === '/dsh-pet-whale/state') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
    res.end(JSON.stringify({ ...状态, now: Date.now() }))
    return
  }
  if (u.pathname === '/' || u.pathname === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(页)
    return
  }
  if (u.pathname.startsWith('/dsh-pet-whale/sounds/')) {
    try {
      const b = readFileSync(join(根, 'assets', u.pathname.replace('/dsh-pet-whale/', '')))
      res.writeHead(200, {
        'content-type': u.pathname.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav',
        'cache-control': 'no-cache',
      })
      res.end(b)
      return
    } catch { res.writeHead(404); res.end(); return }
  }
  const f = 表[u.pathname]
  if (!f) { res.writeHead(404); res.end(); return }
  const ext = u.pathname.slice(u.pathname.lastIndexOf('.'))
  res.writeHead(200, { 'content-type': 类型[ext] || 'application/octet-stream', 'cache-control': 'no-cache' })
  res.end(readFileSync(f))
}).listen(端口, '127.0.0.1', () => console.log('preview on http://127.0.0.1:' + 端口))
