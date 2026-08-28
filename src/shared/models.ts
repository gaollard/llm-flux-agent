export type Workspace = {
  id: string
  name: string
  path: string
  createdAt: number
  lastOpenedAt: number
  available: boolean
}

export type Thread = {
  id: string
  workspaceId: string
  title: string
  createdAt: number
  updatedAt: number
}

export type ToolCall = {
  id: string
  name: string
  arguments: string
}

export type Message = {
  id: string
  threadId: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  toolName?: string
  toolCallId?: string
  toolCalls?: ToolCall[]
  createdAt: number
}

export type PublicSettings = {
  apiBaseUrl: string
  model: string
  hasApiKey: boolean
  maxContextChars: number
}

export type SkillSource = 'user' | 'workspace'

export type SkillMeta = {
  name: string
  description: string
  dir: string
  source: SkillSource
}

export type SkillsListPayload = {
  workspaceId?: string
}

export type SkillsListResult = {
  skills: SkillMeta[]
  userRoot: string
  workspaceRoot: string | null
}

export type WorkspaceAddPayload = {
  path: string
}

export type WorkspaceIdPayload = {
  id: string
}

export type ThreadListPayload = {
  workspaceId: string
}

export type ThreadCreatePayload = {
  workspaceId: string
}

export type ThreadIdPayload = {
  threadId: string
}

export type AgentSubmitPayload = {
  threadId: string
  text: string
}

export type AgentAbortPayload = {
  turnId: string
}

export type SettingsUpdatePayload = {
  apiBaseUrl?: string
  apiKey?: string
  model?: string
  maxContextChars?: number
}
