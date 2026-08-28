import type { AgentEvent } from '../shared/events'
import type {
  AgentAbortPayload,
  AgentSubmitPayload,
  Message,
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
  WorkspaceIdPayload
} from '../shared/models'

export type WorkspaceListResult = {
  workspaces: Workspace[]
  activeWorkspaceId: string | null
}

export type FluxApi = {
  workspace: {
    list: () => Promise<WorkspaceListResult>
    pickDirectory: () => Promise<string | null>
    add: (payload: WorkspaceAddPayload) => Promise<Workspace>
    remove: (payload: WorkspaceIdPayload) => Promise<{ ok: true }>
    setActive: (payload: WorkspaceIdPayload) => Promise<Workspace>
  }
  thread: {
    list: (payload: ThreadListPayload) => Promise<Thread[]>
    create: (payload: ThreadCreatePayload) => Promise<Thread>
    getMessages: (payload: ThreadIdPayload) => Promise<Message[]>
    delete: (payload: ThreadIdPayload) => Promise<{ ok: true }>
  }
  agent: {
    submit: (payload: AgentSubmitPayload) => Promise<{ turnId: string }>
    abort: (payload: AgentAbortPayload) => Promise<{ ok: true }>
    onEvent: (callback: (event: AgentEvent) => void) => () => void
  }
  settings: {
    get: () => Promise<PublicSettings>
    update: (payload: SettingsUpdatePayload) => Promise<PublicSettings>
  }
  skills: {
    list: (payload?: SkillsListPayload) => Promise<SkillsListResult>
  }
}

declare global {
  interface Window {
    flux: FluxApi
  }
}

export {}
