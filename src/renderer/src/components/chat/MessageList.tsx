import { useEffect, useRef } from 'react'
import type { Message } from '@shared/models'
import { useAppStore } from '../../stores/app-store'

function ToolCard({
  name,
  args,
  preview
}: {
  name: string
  args?: unknown
  preview?: string
}) {
  const argText =
    args && typeof args === 'object'
      ? Object.entries(args as Record<string, unknown>)
          .map(([key, value]) => `${key}: ${String(value)}`)
          .join('  ')
      : String(args ?? '')
  return (
    <details className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600">
      <summary className="cursor-pointer select-none font-medium text-sky-700">
        {name}
        {argText ? <span className="ml-2 font-normal text-zinc-500">{argText}</span> : null}
      </summary>
      {preview ? (
        <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap text-[11px] text-zinc-500">
          {preview}
        </pre>
      ) : (
        <div className="mt-2 text-zinc-500">运行中…</div>
      )}
    </details>
  )
}

function Bubble({ message }: { message: Message }) {
  if (message.role === 'tool') {
    return (
      <ToolCard
        name={message.toolName || 'tool'}
        args={message.toolCallId ? { id: message.toolCallId } : undefined}
        preview={message.content.split(/\r?\n/).slice(0, 20).join('\n')}
      />
    )
  }
  if (message.role === 'assistant' && message.toolCalls?.length && !message.content) {
    return (
      <div className="space-y-2">
        {message.toolCalls.map((call) => (
          <ToolCard key={call.id} name={call.name} args={safeParse(call.arguments)} />
        ))}
      </div>
    )
  }
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
          isUser ? 'bg-sky-100 text-sky-950' : 'bg-white text-zinc-800 shadow-sm ring-1 ring-zinc-200'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

export function MessageList() {
  const messages = useAppStore((s) => s.messages)
  const streamingText = useAppStore((s) => s.streamingText)
  const draftTools = useAppStore((s) => s.draftTools)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, streamingText, draftTools])

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
      {messages.length === 0 && !streamingText && draftTools.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-zinc-500">
          在当前工作空间提问。模型可调用 ~/.agents/skills，并用 read_file / grep / run_command 执行。
        </div>
      ) : null}
      {messages
        .filter((item) => !(item.role === 'assistant' && item.toolCalls?.length && !item.content))
        .map((message) => (
          <Bubble key={message.id} message={message} />
        ))}
      {draftTools.map((tool, index) => (
        <ToolCard key={`${tool.toolName}-${index}`} name={tool.toolName} args={tool.args} preview={tool.preview} />
      ))}
      {streamingText ? (
        <div className="flex justify-start">
          <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-zinc-800 shadow-sm ring-1 ring-zinc-200">
            {streamingText}
          </div>
        </div>
      ) : null}
      <div ref={bottomRef} />
    </div>
  )
}
