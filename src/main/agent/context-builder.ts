import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { Message } from '@shared/models'
import type { ChatMessage } from './llm-client'

const AGENTS_LIMIT = 32 * 1024

function readAgentsMd(workspacePath: string): string {
  const file = path.join(workspacePath, 'AGENTS.md')
  try {
    const text = fs.readFileSync(file, 'utf8')
    return text.slice(0, AGENTS_LIMIT)
  } catch {
    return ''
  }
}

function toChat(message: Message): ChatMessage | ChatMessage[] | null {
  if (message.role === 'user') {
    return { role: 'user', content: message.content }
  }
  if (message.role === 'assistant') {
    if (message.toolCalls?.length) {
      return {
        role: 'assistant',
        content: message.content || null,
        tool_calls: message.toolCalls.map((item) => ({
          id: item.id,
          type: 'function',
          function: { name: item.name, arguments: item.arguments }
        }))
      }
    }
    return { role: 'assistant', content: message.content }
  }
  if (message.role === 'tool' && message.toolCallId) {
    return {
      role: 'tool',
      tool_call_id: message.toolCallId,
      content: message.content
    }
  }
  return null
}

function flatten(items: Array<ChatMessage | ChatMessage[] | null>): ChatMessage[] {
  const out: ChatMessage[] = []
  for (const item of items) {
    if (!item) continue
    if (Array.isArray(item)) out.push(...item)
    else out.push(item)
  }
  return out
}

function measure(messages: ChatMessage[]): number {
  return JSON.stringify(messages).length
}

export function buildMessages(options: {
  workspacePath: string
  history: Message[]
  maxContextChars: number
  extraSystem?: string
}): ChatMessage[] {
  const agents = readAgentsMd(options.workspacePath)
  const prefix: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are Flux, a workspace-scoped coding assistant. You can inspect the active workspace only through the read_file and grep tools. Do not invent files you have not seen. Prefer searching then reading the exact files you need. Answer in the same language the user uses.'
    },
    {
      role: 'system',
      content: `Environment:\n- workspace: ${options.workspacePath}\n- os: ${os.platform()} ${os.release()}\n- date: ${new Date().toISOString().slice(0, 10)}`
    }
  ]
  if (agents) {
    prefix.push({
      role: 'system',
      content: `Project instructions from AGENTS.md:\n${agents}`
    })
  }
  if (options.extraSystem) {
    prefix.push({ role: 'system', content: options.extraSystem })
  }

  let history = flatten(options.history.map(toChat))
  const budget = options.maxContextChars

  const recentUserIdx: number[] = []
  history.forEach((item, index) => {
    if (item.role === 'user') recentUserIdx.push(index)
  })
  const keepFrom = recentUserIdx.length >= 2 ? recentUserIdx[recentUserIdx.length - 2] : 0

  while (measure([...prefix, ...history]) > budget && history.length > 0) {
    const dropIndex = history.findIndex((item, index) => item.role === 'tool' && index < keepFrom)
    if (dropIndex >= 0) {
      history.splice(dropIndex, 1)
      continue
    }
    if (history.length > 4) {
      history.shift()
      continue
    }
    break
  }

  return [...prefix, ...history]
}
