import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getCards: () => ipcRenderer.invoke('cards'),
  getCardsRel: () => ipcRenderer.invoke('cards:relations'),

  insertCard: (content:string,x:number,y:number,color:number) => ipcRenderer.invoke('cards:insert',content,x,y,color),
  insertCardRel: (first:number,second:number) => ipcRenderer.invoke('cards:insert:relations',first,second),

  updateCard: (vars:string[], values:string[], whereClause: string) => ipcRenderer.invoke('cards:update',vars,values,whereClause),
  updateCardRel: (first:number,second:number, whereClause:string) => ipcRenderer.invoke('cards:update:relations',first,second,whereClause),

  deleteCard: (id:number) => ipcRenderer.invoke('cards:delete',id),
  deleteCardRel: (id:number) => ipcRenderer.invoke('cards:delete:relations',id),

  getFilesHistory: () => ipcRenderer.invoke('files:history'),
  openFile: (path: string) => ipcRenderer.invoke('files:open', path),
};
ipcRenderer.on('log', (_,message)=>{console.log(message)});

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
