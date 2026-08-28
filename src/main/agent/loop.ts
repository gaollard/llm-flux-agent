import { randomUUID } from 'node:crypto'
import type { WebContents } from 'electron'
import type { AgentEvent } from '@shared/events'
import { IpcChannel } from '@shared/ipc'
import { appendMessage, getMessages, getThread } from '../store/thread-store'
import { getApiKey, getPublicSettings } from '../store/settings-store'
import { getWorkspace } from '../store/workspace-store'
import { buildMessages } from './context-builder'
import { streamChat } from './llm-client'
import { executeTool, previewToolOutput } from '../tools/router'

const MAX_TOOL_CALLS = 12

type InFlight = {
  turnId: string
  abort: AbortController
}

const inflightByThread = new Map<string, InFlight>()
const inflightByTurn = new Map<string, InFlight>()

function emit(sender: WebContents, event: AgentEvent): void {
  if (sender.isDestroyed()) return
  sender.send(IpcChannel.agentEvent, event)
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && (error.name === 'AbortError' || error.message.includes('abort'))
}

export async function submitTurn(
  sender: WebContents,
  threadId: string,
  text: string
): Promise<{ turnId: string }> {
  if (!text.trim()) {
    throw new Error('消息不能为空')
  }
  if (inflightByThread.has(threadId)) {
    throw new Error('当前会话仍在生成，请先停止或等待结束')
  }

  const thread = getThread(threadId)
  if (!thread) throw new Error('会话不存在')
  const workspace = getWorkspace(thread.workspaceId)
  if (!workspace) throw new Error('工作空间不存在')
  if (!workspace.available) throw new Error('工作空间不可用')

  const settings = getPublicSettings()
  const apiKey = getApiKey()
  if (!settings.apiBaseUrl || !apiKey || !settings.model) {
    throw new Error('请先配置模型')
  }

  const turnId = randomUUID()
  const abort = new AbortController()
  const inflight = { turnId, abort }
  inflightByThread.set(threadId, inflight)
  inflightByTurn.set(turnId, inflight)

  appendMessage({
    threadId,
    role: 'user',
    content: text.trim()
  })

  emit(sender, { type: 'turn.started', turnId, threadId })

  void runLoop({ sender, threadId, turnId, workspacePath: workspace.path, abort, maxContextChars: settings.maxContextChars })

  return { turnId }
}

export function abortTurn(turnId: string): void {
  inflightByTurn.get(turnId)?.abort.abort()
}

async function runLoop(options: {
  sender: WebContents
  threadId: string
  turnId: string
  workspacePath: string
  abort: AbortController
  maxContextChars: number
}): Promise<void> {
  const { sender, threadId, turnId, workspacePath, abort, maxContextChars } = options
  const settings = getPublicSettings()
  const apiKey = getApiKey()
  let toolCallsUsed = 0
  let forcedStop = false

  try {
    while (true) {
      if (abort.signal.aborted) throw new DOMException('Aborted', 'AbortError')

      const extraSystem =
        forcedStop || toolCallsUsed >= MAX_TOOL_CALLS
          ? 'Stop calling tools. Answer with the information you already have.'
          : undefined

      const messages = buildMessages({
        workspacePath,
        history: getMessages(threadId),
        maxContextChars,
        extraSystem
      })

      const result = await streamChat({
        apiBaseUrl: settings.apiBaseUrl,
        apiKey,
        model: settings.model,
        messages,
        abortSignal: abort.signal,
        onDelta: (delta) => emit(sender, { type: 'text.delta', turnId, delta })
      })

      if (result.toolCalls.length && !forcedStop) {
        if (toolCallsUsed >= MAX_TOOL_CALLS) {
          forcedStop = true
          continue
        }

        appendMessage({
          threadId,
          role: 'assistant',
          content: result.text,
          toolCalls: result.toolCalls.map((item) => ({
            id: item.id || randomUUID(),
            name: item.name,
            arguments: item.arguments
          }))
        })

        for (const call of result.toolCalls) {
          if (abort.signal.aborted) throw new DOMException('Aborted', 'AbortError')
          toolCallsUsed += 1
          let parsedArgs: unknown = call.arguments
          try {
            parsedArgs = JSON.parse(call.arguments)
          } catch {
            parsedArgs = { raw: call.arguments }
          }
          emit(sender, { type: 'tool.started', turnId, toolName: call.name, args: parsedArgs })
          let output: string
          try {
            const executed = await executeTool(workspacePath, call.name, call.arguments)
            output = executed.output
          } catch (error) {
            output = error instanceof Error ? error.message : String(error)
          }
          emit(sender, {
            type: 'tool.finished',
            turnId,
            toolName: call.name,
            preview: previewToolOutput(output)
          })
          appendMessage({
            threadId,
            role: 'tool',
            content: output,
            toolName: call.name,
            toolCallId: call.id || randomUUID()
          })
        }

        if (toolCallsUsed >= MAX_TOOL_CALLS) {
          forcedStop = true
        }
        continue
      }

      if (result.toolCalls.length && forcedStop) {
        throw new Error('工具调用次数超过上限')
      }

      appendMessage({
        threadId,
        role: 'assistant',
        content: result.text
      })
      emit(sender, { type: 'turn.completed', turnId, threadId })
      return
    }
  } catch (error) {
    if (abort.signal.aborted || isAbortError(error)) {
      emit(sender, { type: 'turn.aborted', turnId })
      return
    }
    const message = error instanceof Error ? error.message : String(error)
    emit(sender, { type: 'turn.failed', turnId, error: message })
  } finally {
    inflightByThread.delete(threadId)
    inflightByTurn.delete(turnId)
  }
}
