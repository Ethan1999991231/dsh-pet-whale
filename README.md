# dsh-pet-whale · 鲸鱼娘桌宠

挂在 DSH 页面角落的一条蓝发鲸鱼娘。尾巴会自己摆，点一下会 Q 弹一下，顺手把 DeepSeek 还剩多少钱顶出来；只要有会话在跑，她左上角就冒一个「思考中」的小窗。

## 她做什么

| 动作 | 反应 |
| --- | --- |
| 什么都不做 | 尾巴一直轻轻摆；有会话在跑时摆得更快 |
| 左键点一下 | Q 弹一下（压扁 → 弹起 → 回正），冒一句碎碎念（随机，1.8 秒自己收） |
| 右键点一下 | 报余额，气泡 4 秒没人点自己收 |
| 右键再点一下 | 换单位（¥ ↔ $） |
| 按住拖 | 挪到任意位置，松手即记住 |
| 滚轮 | 放大缩小（120–560 px） |
| 有会话在跑 | 左上角出现思考窗：转圈的三个点、跑了多久、会话标题、正在调哪个工具 |
| 多个会话同时跑 | 思考窗显示第一个，右上角 `+N` 标出还有几个 |
| 按下 / 松开 | 各一声（`press.mp3` / `release.mp3`） |
| 她需要你回答 / 授权 | 思考窗换成「等你回答」「等你授权」，并响 `ask.wav` / `approve.wav` |
| 一轮跑完 | 收尾音 `end.wav` |
| 鼠标停她身上按 `S` | 打开设置面板（再按一次 / 点「关闭」收起） |

思考窗里的秒数每 0.5 秒自己跳，不用刷新页面。

## 设置面板（鼠标停在她身上，按 S）

| 项 | 说明 |
| --- | --- |
| 总音量 | 0–100%，按每支音各自的基准等比缩放 |
| 按下 / 松开 / 提问 / 授权 / 跑完 | 五个试听按钮，点一下当场听 |
| 静音 | 一声都不响（右键她不再管这事，只在这里关） |
| 气泡停留 | 1–15 秒，余额气泡没人点就自己收 |
| 尾巴快慢 | 30%–250%，尾巴摆动的速度倍率 |
| 她的大小 | 120–560 px（和滚轮改的是同一个值） |
| 探测对话 | 关掉就不再问宿主：没有思考窗，也不刷新余额，页面更轻 |
| 提示字 | 左键点她时随机说的台词，一行一句；清空 = 用回默认那五句 |
| 恢复默认 | 全部拨回出厂值 |

改一项**当场生效**，不用刷新。设置存两处：浏览器 `localStorage`（立刻）+ `~/.dsh/pet-whale-config.json`（600ms 防抖后回写宿主）。
控制台里 `__dpwOpt` 能看到当前值。

## 余额从哪来

宿主用 DSH 自己的凭据 `DEEPSEEK_API_KEY` 去调 `https://api.deepseek.com/user/balance`，60 秒缓存一次，点她的时候强制刷新一次。**这个插件不存任何明文 key**，也不把 key 交给浏览器。

读不到就直说：「还没配置 DEEPSEEK_API_KEY」「余额接口没通」——不假装有数。

## 位置和大小存在哪

`~/.dsh/pet-whale-config.json`（随 `DSH_HOME`）。浏览器那边另存一份 localStorage 做兜底，重开页面不会跳位。

## 安装

```bash
dsh plugin add <这个目录>
```

或者在设置里指向本地目录安装。装完刷新页面（Ctrl+Shift+R）。

## 卸载

```bash
dsh plugin remove dsh-pet-whale
```

配置文件 `~/.dsh/pet-whale-config.json` 会留下，想干净就一起删。

## 结构

```
lib/host.js        宿主侧：注入行 + /state + /config + 静态资源 + 音效
lib/client.js      build_client.mjs 的生成物（把 pet.js 包成 client bundle），别手改
assets/pet.js      浏览器侧：桌宠本体（纯 DOM，不依赖 React）
assets/char.webp   身体
assets/tail.webp   尾巴（同画布，单独一层，绕尾柄转）
assets/sounds/     press / release / ask / approve / end
preview/           只给开发看：假后端 + 本地截图 + 合成脚本
```

改完 `assets/pet.js` 要重建一次：

```
node preview\build_client.mjs && node --check lib\client.js
```

## 关于素材

`char.webp` 和 `tail.webp` 是同一张画布切出来的两层，尾巴那层绕尾柄与身体相接的位置旋转（`transform-origin: 68% 42%`），所以摆起来根不会裂。

换素材时改 `preview/build_assets.py` 里的两个路径重跑一遍，它会自动算包围盒、裁到内容、输出同尺寸的两层。
