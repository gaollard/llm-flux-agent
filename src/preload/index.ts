import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannel } from '../shared/ipc'
import type { AgentEvent } from '../shared/events'
import type {
  AgentAbortPayload,
  AgentSubmitPayload,
  PublicSettings,
  SettingsUpdatePayload,
  SkillsListPayload,
  SkillsListResult,
  Thread,
  ThreadCreatePayload,
  ThreadIdPayload,
  ThreadListPayload,
  Workspace,
  WorkspaceAddPayload,
  WorkspaceIdPayload,
  Message
} from '../shared/models'

export type WorkspaceListResult = {
  workspaces: Workspace[]
  activeWorkspaceId: string | null
}

const api = {
  workspace: {
    list: (): Promise<WorkspaceListResult> => ipcRenderer.invoke(IpcChannel.workspaceList),
    pickDirectory: (): Promise<string | null> =>
      ipcRenderer.invoke(IpcChannel.workspacePickDirectory),
    add: (payload: WorkspaceAddPayload): Promise<Workspace> =>
      ipcRenderer.invoke(IpcChannel.workspaceAdd, payload),
    remove: (payload: WorkspaceIdPayload): Promise<{ ok: true }> =>
      ipcRenderer.invoke(IpcChannel.workspaceRemove, payload),
    setActive: (payload: WorkspaceIdPayload): Promise<Workspace> =>
      ipcRenderer.invoke(IpcChannel.workspaceSetActive, payload)
  },
  thread: {
    list: (payload: ThreadListPayload): Promise<Thread[]> =>
      ipcRenderer.invoke(IpcChannel.threadList, payload),
    create: (payload: ThreadCreatePayload): Promise<Thread> =>
      ipcRenderer.invoke(IpcChannel.threadCreate, payload),
    getMessages: (payload: ThreadIdPayload): Promise<Message[]> =>
      ipcRenderer.invoke(IpcChannel.threadGetMessages, payload),
    delete: (payload: ThreadIdPayload): Promise<{ ok: true }> =>
      ipcRenderer.invoke(IpcChannel.threadDelete, payload)
  },
  agent: {
    submit: (payload: AgentSubmitPayload): Promise<{ turnId: string }> =>
      ipcRenderer.invoke(IpcChannel.agentSubmit, payload),
    abort: (payload: AgentAbortPayload): Promise<{ ok: true }> =>
      ipcRenderer.invoke(IpcChannel.agentAbort, payload),
    onEvent: (callback: (event: AgentEvent) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: AgentEvent): void => {
        callback(data)
      }
      ipcRenderer.on(IpcChannel.agentEvent, listener)
      return () => {
        ipcRenderer.removeListener(IpcChannel.agentEvent, listener)
      }
    }
  },
  settings: {
    get: (): Promise<PublicSettings> => ipcRenderer.invoke(IpcChannel.settingsGet),
    update: (payload: SettingsUpdatePayload): Promise<PublicSettings> =>
      ipcRenderer.invoke(IpcChannel.settingsUpdate, payload)
  },
  skills: {
    list: (payload?: SkillsListPayload): Promise<SkillsListResult> =>
      ipcRenderer.invoke(IpcChannel.skillsList, payload)
  }
}

contextBridge.exposeInMainWorld('flux', api)
