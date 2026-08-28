import { BrowserWindow, dialog, ipcMain } from 'electron'
import { IpcChannel } from '@shared/ipc'
import type {
  AgentAbortPayload,
  AgentSubmitPayload,
  SettingsUpdatePayload,
  ThreadCreatePayload,
  ThreadIdPayload,
  ThreadListPayload,
  WorkspaceAddPayload,
  WorkspaceIdPayload
} from '@shared/models'
import { abortTurn, submitTurn } from '../agent/loop'
import { getPublicSettings, updateSettings } from '../store/settings-store'
import {
  createThread,
  deleteThread,
  deleteThreadsForWorkspace,
  getMessages,
  listThreads
} from '../store/thread-store'
import {
  addWorkspace,
  getActiveWorkspaceId,
  listWorkspaces,
  removeWorkspace,
  setActiveWorkspace
} from '../store/workspace-store'

export function registerIpc(): void {
  ipcMain.handle(IpcChannel.workspaceList, () => {
    const workspaces = listWorkspaces()
    return {
      workspaces,
      activeWorkspaceId: getActiveWorkspaceId()
    }
  })

  ipcMain.handle(IpcChannel.workspacePickDirectory, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = win
      ? await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
      : await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (result.canceled || !result.filePaths[0]) return null
    return result.filePaths[0]
  })

  ipcMain.handle(IpcChannel.workspaceAdd, (_event, payload: WorkspaceAddPayload) => {
    return addWorkspace(payload.path)
  })

  ipcMain.handle(IpcChannel.workspaceRemove, (_event, payload: WorkspaceIdPayload) => {
    deleteThreadsForWorkspace(payload.id)
    removeWorkspace(payload.id)
    return { ok: true as const }
  })

  ipcMain.handle(IpcChannel.workspaceSetActive, (_event, payload: WorkspaceIdPayload) => {
    return setActiveWorkspace(payload.id)
  })

  ipcMain.handle(IpcChannel.threadList, (_event, payload: ThreadListPayload) => {
    return listThreads(payload.workspaceId)
  })

  ipcMain.handle(IpcChannel.threadCreate, (_event, payload: ThreadCreatePayload) => {
    return createThread(payload.workspaceId)
  })

  ipcMain.handle(IpcChannel.threadGetMessages, (_event, payload: ThreadIdPayload) => {
    return getMessages(payload.threadId)
  })

  ipcMain.handle(IpcChannel.threadDelete, (_event, payload: ThreadIdPayload) => {
    deleteThread(payload.threadId)
    return { ok: true as const }
  })

  ipcMain.handle(IpcChannel.agentSubmit, (event, payload: AgentSubmitPayload) => {
    return submitTurn(event.sender, payload.threadId, payload.text)
  })

  ipcMain.handle(IpcChannel.agentAbort, (_event, payload: AgentAbortPayload) => {
    abortTurn(payload.turnId)
    return { ok: true as const }
  })

  ipcMain.handle(IpcChannel.settingsGet, () => getPublicSettings())

  ipcMain.handle(IpcChannel.settingsUpdate, (_event, payload: SettingsUpdatePayload) => {
    return updateSettings(payload)
  })
}
