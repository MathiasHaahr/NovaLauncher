console.log("[NOVA PRELOAD] STARTING");

const { contextBridge, ipcRenderer } = require("electron");

console.log("[NOVA PRELOAD] Electron APIs loaded");

contextBridge.exposeInMainWorld("novaAPI", {
  runtimeStatus: () =>
    ipcRenderer.invoke("nova.runtime.status"),

  accounts: {
    list: () =>
      ipcRenderer.invoke("nova.account.list"),

    active: () =>
      ipcRenderer.invoke("nova.account.active"),

    login: () =>
      ipcRenderer.invoke("nova.account.login"),

    logout: (id) =>
      ipcRenderer.invoke("nova.account.logout", id),

    setActive: (id) =>
      ipcRenderer.invoke("nova.account.setActive", id)
  }
});

console.log("[NOVA PRELOAD] API exposed");