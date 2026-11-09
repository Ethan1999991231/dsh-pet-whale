# 大肥鱼桌宠 · 桌面版（Electron）

不依赖 DeepSeek Harness，双击就能跑的一条桌宠。

## 跑起来

- 开发/调试：`run.bat`（会清掉 `ELECTRON_RUN_AS_NODE`，否则 electron 会以纯 node 模式启动）
- 已打包版：`dist\大肥鱼桌宠-win32-x64\大肥鱼桌宠.exe`

## 会什么

| 操作 | 结果 |
| --- | --- |
| 左键点她 | Q 弹一下 + 随机碎碎念（台词可在设置里改） |
| 右键点她 | 报 DeepSeek 余额（人民币优先），4 秒后自己收 |
| 拖动 | 按住她拖到任意位置，位置会记住 |
| 滚轮 | 在她身上滚，改大小 |
| 鼠标移到她身上按 `S` | 打开设置面板（音量 / 试听 / 静音 / 气泡停留 / 尾巴快慢 / 大小 / 探测对话 / 提示字 / 换音效 / 换形象 / 恢复默认） |
| 托盘图标单击 | 打开设置 |
| 托盘图标右键 | 设置 API Key、回原位、开机自启、GitHub、退出 |

鼠标不在她身上时，整个窗口是穿透的 —— 不挡下面的任何东西。

## 先填 API Key

右键托盘图标 → **设置 API Key**。填了才能报余额。

- 存在 `%APPDATA%\大肥鱼桌宠\config.json`，只在本机，不会外传。
- 没填时右键她，气泡会提示"还没填 API Key"。

## 目录

```
main.js            主进程：全屏透明置顶窗口 + 托盘 + IPC
server.js          本地 http（127.0.0.1:随机端口）：/state /config /custom /upload /reset + 静态资源
preload.js         contextBridge（穿透 / 设置 / Key）
ui/index.html      透明页：加载 pet.js，负责「鼠标在她身上才可点」
ui/key.html        填 Key 的小窗
assets/            char.webp / tail.webp / pet.js / sounds/*（由 tools\sync.mjs 从插件目录同步）
tools/sync.mjs     从 ../pet-whale/assets 同步素材，并给 pet.js 打两处补丁（前缀、暴露 __dpwOpenSettings）
tools/icon.py      从立绘裁托盘图标与 exe 图标（build/tray*.png、build/whale.ico）
```

`pet.js` 是从 DSH 插件那边同步来的**生成物**，别在这里手改 —— 改 `../pet-whale/assets/pet.js` 后重跑 `node tools\sync.mjs`。

## 重新打包

```
npm i -D electron-packager
npx electron-packager . "大肥鱼桌宠" --platform=win32 --arch=x64 --out=dist --overwrite --asar --icon=build/whale.ico --ignore="^/preview" --ignore="^/dist" --ignore="^/probe" --ignore="^/run\.bat"
```

## 已知

- 起窗口前必须清 `ELECTRON_RUN_AS_NODE`（在 DSH 里跑子进程会继承它）。
- 调试截图：设 `PET_WHALE_SHOT=1` 启动，4.5 秒后把窗口内容存成 `preview/shot.png` 再退出。
