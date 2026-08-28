import { Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '../../stores/app-store'
import { cn } from '../../lib/utils'

export function ThreadList() {
  const threads = useAppStore((s) => s.threads)
  const activeThreadId = useAppStore((s) => s.activeThreadId)
  const createThread = useAppStore((s) => s.createThread)
  const selectThread = useAppStore((s) => s.selectThread)
  const deleteThread = useAppStore((s) => s.deleteThread)
  const workspace = useAppStore((s) =>
    s.workspaces.find((item) => item.id === s.activeWorkspaceId)
  )

  return (
    <div className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-surface-0">
      <div className="flex items-center justify-between px-3 py-3">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">会话</div>
        <button
          className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40"
          disabled={!workspace?.available}
          onClick={() => void createThread()}
          title="新会话"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {threads.length === 0 ? (
          <div className="px-2 py-4 text-xs text-zinc-500">暂无会话</div>
        ) : (
          threads.map((thread) => (
            <div
              key={thread.id}
              className={cn(
                'group flex items-center gap-1 rounded-md px-2 py-2 text-sm',
                thread.id === activeThreadId
                  ? 'bg-sky-50 text-sky-950'
                  : 'text-zinc-600 hover:bg-zinc-100'
              )}
            >
              <button
                className="min-w-0 flex-1 truncate text-left"
                onClick={() => void selectThread(thread.id)}
              >
                {thread.title || '新会话'}
              </button>
              <button
                className="hidden rounded p-1 text-zinc-400 hover:text-red-500 group-hover:block"
                onClick={() => void deleteThread(thread.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
