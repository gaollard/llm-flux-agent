export type AgentEvent =
  | { type: 'turn.started'; turnId: string; threadId: string }
  | { type: 'text.delta'; turnId: string; delta: string }
  | { type: 'tool.started'; turnId: string; toolName: string; args: unknown }
  | { type: 'tool.finished'; turnId: string; toolName: string; preview: string }
  | { type: 'turn.completed'; turnId: string; threadId: string }
  | { type: 'turn.failed'; turnId: string; error: string }
  | { type: 'turn.aborted'; turnId: string }
