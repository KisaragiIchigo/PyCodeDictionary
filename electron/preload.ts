import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  openFileDialog: (options?: any) => ipcRenderer.invoke('dialog:open-file', options),
  openFolderDialog: () => ipcRenderer.invoke('dialog:open-folder'),
  openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
  isElectron: true,
});
