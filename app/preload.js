const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('petApp', {
  穿透: (v) => ipcRenderer.send('pet:penetrate', !!v),
  打开设置: () => ipcRenderer.send('pet:openSet'),
  取Key: () => ipcRenderer.invoke('pet:getKey'),
  设Key: (k) => ipcRenderer.invoke('pet:setKey', k),
  有Key: () => ipcRenderer.invoke('pet:hasKey'),
  关Key窗: () => ipcRenderer.invoke('pet:closeKeyWin'),
})
