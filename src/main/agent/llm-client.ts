import { modelSupportsTools } from '@shared/providers'

export const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'read_file',
      description: 'Read a UTF-8 text file inside the active workspace.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Absolute or workspace-relative path'
          }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'grep',
      description: 'Search file contents in the workspace with ripgrep syntax.',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string' },
          glob: { type: 'string', description: 'Optional glob, e.g. *.ts' }
        },
        required: ['pattern']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'skill',
      description:
        'REQUIRED when the user request matches a listed skill (Confluence, Jira, Google Doc/Sheet, SeaTalk, Figma, GitNexus, Skynet workflows, etc.). Load SKILL.md from ~/.agents/skills or the workspace .agents/skills directory, then follow it. Do not skip this tool and do not answer that you lack skills.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Skill directory name'
          },
          file: {
            type: 'string',
            description: 'Optional relative path inside the skill directory. Defaults to SKILL.md'
          }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'run_command',
      description:
        'Run a local shell command with cwd in the active workspace. Use this to follow skill CLI instructions (e.g. skynet-base confluence read).',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'Shell command to run'
          },
          cwd: {
            type: 'string',
            description: 'Optional working directory, absolute or workspace-relative. Must stay inside the workspace.'
          }
        },
        required: ['command']
      }
    }
  }
]

export type ChatMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | {
      role: 'assistant'
      content: string | null
      tool_calls?: Array<{
        id: string
        type: 'function'
        function: { name: string; arguments: string }
      }>
    }
  | { role: 'tool'; tool_call_id: string; content: string }

export type StreamToolCall = {
  id: string
  name: string
  arguments: string
}

export type StreamResult = {
  text: string
  toolCalls: StreamToolCall[]
}

function normalizeCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '')
  if (!trimmed) throw new Error('请先配置 API Base URL')
  if (trimmed.endsWith('/chat/completions')) return trimmed
  if (trimmed.endsWith('/v1')) return `${trimmed}/chat/completions`
  return `${trimmed}/v1/chat/completions`
}

function flattenToolMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((message) => {
    if (message.role === 'tool') {
      return {
        role: 'user' as const,
        content: `Tool result:\n${message.content}`
      }
    }
    if (message.role === 'assistant' && message.tool_calls?.length) {
      return {
        role: 'assistant' as const,
        content: message.content || '(used workspace tools)'
      }
    }
    return message
  })
}

function mergeAbort(user: AbortSignal, timeoutMs: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController()
  const onAbort = (): void => controller.abort()
  user.addEventListener('abort', onAbort)
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return {
    signal: controller.signal,
    clear: () => {
      clearTimeout(timer)
      user.removeEventListener('abort', onAbort)
    }
  }
}

export async function streamChat(options: {
  apiBaseUrl: string
  apiKey: string
  model: string
  messages: ChatMessage[]
  abortSignal: AbortSignal
  onDelta: (text: string) => void
}): Promise<StreamResult> {
  if (!options.apiKey) throw new Error('请先配置模型 API Key')
  if (!options.model) throw new Error('请先配置模型名称')

  const url = normalizeCompletionsUrl(options.apiBaseUrl)
  const useTools = modelSupportsTools(options.model)
  const messages = useTools ? options.messages : flattenToolMessages(options.messages)
  const connect = mergeAbort(options.abortSignal, 30_000)

  const payload: Record<string, unknown> = {
    model: options.model,
    stream: true,
    messages
  }
  if (useTools) {
    payload.tools = TOOLS
    payload.tool_choice = 'auto'
  }

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: connect.signal
    })
  } finally {
    connect.clear()
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    const summary = body.replace(options.apiKey, '[redacted]').slice(0, 500)
    throw new Error(`LLM 请求失败 (${response.status}): ${summary || response.statusText}`)
  }
  if (!response.body) {
    throw new Error('LLM 响应缺少 body')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let text = ''
  const toolAcc = new Map<number, StreamToolCall>()
  let idleTimer: ReturnType<typeof setTimeout> | undefined

  const resetIdle = (): void => {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      void reader.cancel()
    }, 60_000)
  }
  resetIdle()

  const abortReader = (): void => {
    void reader.cancel()
  }
  options.abortSignal.addEventListener('abort', abortReader)

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      resetIdle()
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const rawLine of lines) {
        const line = rawLine.trim()
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (!data || data === '[DONE]') continue
        let json: {
          choices?: Array<{
            delta?: {
              content?: string | null
              reasoning_content?: string | null
              tool_calls?: Array<{
                index: number
                id?: string
                function?: { name?: string; arguments?: string }
              }>
            }
          }>
        }
        try {
          json = JSON.parse(data) as typeof json
        } catch {
          continue
        }
        const delta = json.choices?.[0]?.delta
        if (!delta) continue
        if (delta.reasoning_content) {
          options.onDelta(delta.reasoning_content)
        }
        if (delta.content) {
          text += delta.content
          options.onDelta(delta.content)
        }
        for (const part of delta.tool_calls ?? []) {
          const current = toolAcc.get(part.index) ?? { id: '', name: '', arguments: '' }
          if (part.id) current.id = part.id
          if (part.function?.name) current.name += part.function.name
          if (part.function?.arguments) current.arguments += part.function.arguments
          toolAcc.set(part.index, current)
        }
      }
    }
  } finally {
    if (idleTimer) clearTimeout(idleTimer)
    options.abortSignal.removeEventListener('abort', abortReader)
  }

  if (options.abortSignal.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  return {
    text,
    toolCalls: [...toolAcc.values()].filter((item) => item.name)
  }
}
