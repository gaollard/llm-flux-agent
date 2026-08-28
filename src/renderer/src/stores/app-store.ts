import { create } from 'zustand'
import type { AgentEvent } from '@shared/events'
import type { Message, PublicSettings, Thread, Workspace } from '@shared/models'
import { flux } from '../lib/ipc'

export type DraftTool = {
  toolName: string
  args: unknown
  preview?: string
}

type AppState = {
  ready: boolean
  error: string | null
  workspaces: Workspace[]
  activeWorkspaceId: string | null
  threads: Thread[]
  activeThreadId: string | null
  messages: Message[]
  settings: PublicSettings | null
  settingsOpen: boolean
  turnId: string | null
  streamingText: string
  draftTools: DraftTool[]
  load: () => Promise<void>
  addWorkspace: () => Promise<void>
  removeWorkspace: (id: string) => Promise<void>
  setActiveWorkspace: (id: string) => Promise<void>
  createThread: () => Promise<void>
  selectThread: (id: string) => Promise<void>
  deleteThread: (id: string) => Promise<void>
  toggleSettings: (open?: boolean) => void
  saveSettings: (payload: {
    apiBaseUrl?: string
    apiKey?: string
    model?: string
    maxContextChars?: number
  }) => Promise<void>
  submit: (text: string) => Promise<void>
  abort: () => Promise<void>
  handleEvent: (event: AgentEvent) => Promise<void>
}

async function refreshMessages(threadId: string | null): Promise<Message[]> {
  if (!threadId) return []
  return flux.thread.getMessages({ threadId })
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  error: null,
  workspaces: [],
  activeWorkspaceId: null,
  threads: [],
  activeThreadId: null,
  messages: [],
  settings: null,
  settingsOpen: false,
  turnId: null,
  streamingText: '',
  draftTools: [],

  load: async () => {
    const [{ workspaces, activeWorkspaceId }, settings] = await Promise.all([
      flux.workspace.list(),
      flux.settings.get()
    ])
    const activeId = activeWorkspaceId ?? workspaces[0]?.id ?? null
    const threads = activeId ? await flux.thread.list({ workspaceId: activeId }) : []
    const activeThreadId = threads[0]?.id ?? null
    const messages = await refreshMessages(activeThreadId)
    set({
      ready: true,
      workspaces,
      activeWorkspaceId: activeId,
      threads,
      activeThreadId,
      messages,
      settings,
      error: null
    })
  },

  addWorkspace: async () => {
    try {
      const dir = await flux.workspace.pickDirectory()
      if (!dir) return
      const workspace = await flux.workspace.add({ path: dir })
      const threads = await flux.thread.list({ workspaceId: workspace.id })
      set({
        workspaces: (await flux.workspace.list()).workspaces,
        activeWorkspaceId: workspace.id,
        threads,
        activeThreadId: threads[0]?.id ?? null,
        messages: threads[0] ? await flux.thread.getMessages({ threadId: threads[0].id }) : [],
        error: null
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) })
    }
  },

  removeWorkspace: async (id) => {
    await flux.workspace.remove({ id })
    await get().load()
  },

  setActiveWorkspace: async (id) => {
    await flux.workspace.setActive({ id })
    const threads = await flux.thread.list({ workspaceId: id })
    const activeThreadId = threads[0]?.id ?? null
    set({
      workspaces: (await flux.workspace.list()).workspaces,
      activeWorkspaceId: id,
      threads,
      activeThreadId,
      messages: await refreshMessages(activeThreadId),
      turnId: null,
      streamingText: '',
      draftTools: [],
      error: null
    })
  },

  createThread: async () => {
    const workspaceId = get().activeWorkspaceId
    if (!workspaceId) return
    const thread = await flux.thread.create({ workspaceId })
    const threads = await flux.thread.list({ workspaceId })
    set({
      threads,
      activeThreadId: thread.id,
      messages: [],
      turnId: null,
      streamingText: '',
      draftTools: [],
      error: null
    })
  },

  selectThread: async (id) => {
    set({
      activeThreadId: id,
      messages: await flux.thread.getMessages({ threadId: id }),
      turnId: null,
      streamingText: '',
      draftTools: [],
      error: null
    })
  },

  deleteThread: async (id) => {
    await flux.thread.delete({ threadId: id })
    const workspaceId = get().activeWorkspaceId
    const threads = workspaceId ? await flux.thread.list({ workspaceId }) : []
    const activeThreadId = threads[0]?.id ?? null
    set({
      threads,
      activeThreadId,
      messages: await refreshMessages(activeThreadId)
    })
  },

  toggleSettings: (open) => {
    set({ settingsOpen: open ?? !get().settingsOpen })
  },

  saveSettings: async (payload) => {
    const settings = await flux.settings.update(payload)
    set({ settings })
  },

  submit: async (text) => {
    let threadId = get().activeThreadId
    const workspaceId = get().activeWorkspaceId
    const workspace = get().workspaces.find((item) => item.id === workspaceId)
    if (!workspaceId || !workspace) {
      set({ error: '请先添加工作空间' })
      return
    }
    if (!workspace.available) {
      set({ error: '工作空间不可用' })
      return
    }
    if (!get().settings?.hasApiKey || !get().settings?.apiBaseUrl || !get().settings?.model) {
      set({ error: '请先配置模型', settingsOpen: true })
      return
    }
    if (!threadId) {
      const thread = await flux.thread.create({ workspaceId })
      threadId = thread.id
      set({ threads: await flux.thread.list({ workspaceId }), activeThreadId: threadId })
    }

    const optimistic: Message = {
      id: `local-${Date.now()}`,
      threadId,
      role: 'user',
      content: text,
      createdAt: Date.now()
    }
    set({
      messages: [...get().messages, optimistic],
      streamingText: '',
      draftTools: [],
      error: null
    })

    try {
      const { turnId } = await flux.agent.submit({ threadId, text })
      set({ turnId })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : String(error),
        messages: await refreshMessages(threadId)
      })
    }
  },

  abort: async () => {
    const turnId = get().turnId
    if (!turnId) return
    await flux.agent.abort({ turnId })
  },

  handleEvent: async (event) => {
    if (event.type === 'turn.started') {
      set({ turnId: event.turnId, streamingText: '', draftTools: [], error: null })
      return
    }
    if (event.type === 'text.delta') {
      if (get().turnId && event.turnId !== get().turnId) return
      set({ streamingText: get().streamingText + event.delta })
      return
    }
    if (event.type === 'tool.started') {
      set({
        draftTools: [...get().draftTools, { toolName: event.toolName, args: event.args }]
      })
      return
    }
    if (event.type === 'tool.finished') {
      const draftTools = [...get().draftTools]
      for (let i = draftTools.length - 1; i >= 0; i--) {
        if (draftTools[i].toolName === event.toolName && draftTools[i].preview === undefined) {
          draftTools[i] = { ...draftTools[i], preview: event.preview }
          break
        }
      }
      set({ draftTools, streamingText: '' })
      return
    }
    if (event.type === 'turn.completed' || event.type === 'turn.aborted' || event.type === 'turn.failed') {
      const threadId = get().activeThreadId
      const workspaceId = get().activeWorkspaceId
      set({
        turnId: null,
        streamingText: '',
        draftTools: [],
        messages: await refreshMessages(threadId),
        threads: workspaceId ? await flux.thread.list({ workspaceId }) : get().threads,
        error: event.type === 'turn.failed' ? event.error : null
      })
    }
  }
}))
