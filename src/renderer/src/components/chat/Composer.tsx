import { useState } from 'react'
import { Square, ArrowUp } from 'lucide-react'
import { useAppStore } from '../../stores/app-store'

export function Composer() {
  const [text, setText] = useState('')
  const submit = useAppStore((s) => s.submit)
  const abort = useAppStore((s) => s.abort)
  const turnId = useAppStore((s) => s.turnId)
  const workspace = useAppStore((s) =>
    s.workspaces.find((item) => item.id === s.activeWorkspaceId)
  )
  const busy = Boolean(turnId)
  const disabled = !workspace?.available

  const onSend = async (): Promise<void> => {
    const value = text.trim()
    if (!value || busy || disabled) return
    setText('')
    await submit(value)
  }

  return (
    <div className="border-t border-zinc-200 bg-white p-4">
      <div className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
        <textarea
          className="max-h-40 min-h-12 flex-1 resize-none bg-transparent py-2 text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
          placeholder={disabled ? '当前工作空间不可用' : '询问这个工作空间…'}
          disabled={disabled}
          value={text}
          rows={2}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void onSend()
            }
          }}
        />
        {busy ? (
          <button
            className="mb-1 rounded-full bg-zinc-200 p-2 text-zinc-700 hover:bg-zinc-300"
            onClick={() => void abort()}
            title="停止"
          >
            <Square className="h-4 w-4" />
          </button>
        ) : (
          <button
            className="mb-1 rounded-full bg-sky-500 p-2 text-white hover:bg-sky-400 disabled:bg-zinc-300"
            disabled={!text.trim() || disabled}
            onClick={() => void onSend()}
            title="发送"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
