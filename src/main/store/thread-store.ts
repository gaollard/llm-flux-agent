import { randomUUID } from 'node:crypto'
import Store from 'electron-store'
import type { Message, Thread } from '@shared/models'

type ThreadState = {
  threads: Thread[]
  messages: Message[]
}

let cache: Store<ThreadState> | undefined

function db(): Store<ThreadState> {
  if (!cache) {
    cache = new Store<ThreadState>({
      name: 'threads',
      defaults: {
        threads: [],
        messages: []
      }
    })
  }
  return cache
}

export function listThreads(workspaceId: string): Thread[] {
  return db()
    .get('threads')
    .filter((item) => item.workspaceId === workspaceId)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getThread(threadId: string): Thread | undefined {
  return db()
    .get('threads')
    .find((item) => item.id === threadId)
}

export function createThread(workspaceId: string): Thread {
  const now = Date.now()
  const thread: Thread = {
    id: randomUUID(),
    workspaceId,
    title: '新会话',
    createdAt: now,
    updatedAt: now
  }
  db().set('threads', [thread, ...db().get('threads')])
  return thread
}

export function deleteThread(threadId: string): void {
  db().set(
    'threads',
    db()
      .get('threads')
      .filter((item) => item.id !== threadId)
  )
  db().set(
    'messages',
    db()
      .get('messages')
      .filter((item) => item.threadId !== threadId)
  )
}

export function deleteThreadsForWorkspace(workspaceId: string): void {
  const removedIds = new Set(
    db()
      .get('threads')
      .filter((item) => item.workspaceId === workspaceId)
      .map((item) => item.id)
  )
  db().set(
    'threads',
    db()
      .get('threads')
      .filter((item) => item.workspaceId !== workspaceId)
  )
  db().set(
    'messages',
    db()
      .get('messages')
      .filter((item) => !removedIds.has(item.threadId))
  )
}

export function getMessages(threadId: string): Message[] {
  return db()
    .get('messages')
    .filter((item) => item.threadId === threadId)
    .sort((a, b) => a.createdAt - b.createdAt)
}

export function appendMessage(
  message: Omit<Message, 'id' | 'createdAt'> & Partial<Pick<Message, 'id' | 'createdAt'>>
): Message {
  const saved: Message = {
    id: message.id ?? randomUUID(),
    threadId: message.threadId,
    role: message.role,
    content: message.content,
    toolName: message.toolName,
    toolCallId: message.toolCallId,
    toolCalls: message.toolCalls,
    createdAt: message.createdAt ?? Date.now()
  }
  db().set('messages', [...db().get('messages'), saved])
  touchThread(message.threadId, saved.role === 'user' ? saved.content : undefined)
  return saved
}

export function touchThread(threadId: string, firstUserText?: string): void {
  const threads = db()
    .get('threads')
    .map((item) => {
      if (item.id !== threadId) return item
      const title =
        item.title === '新会话' && firstUserText
          ? firstUserText.replace(/\s+/g, ' ').slice(0, 40)
          : item.title
      return { ...item, title, updatedAt: Date.now() }
    })
  db().set('threads', threads)
}
