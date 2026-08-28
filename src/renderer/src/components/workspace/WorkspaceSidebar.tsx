import { FolderPlus, Settings, Trash2 } from 'lucide-react'
import { useAppStore } from '../../stores/app-store'
import { cn } from '../../lib/utils'

export function WorkspaceSidebar() {
  const workspaces = useAppStore((s) => s.workspaces)
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId)
  const addWorkspace = useAppStore((s) => s.addWorkspace)
  const setActiveWorkspace = useAppStore((s) => s.setActiveWorkspace)
  const removeWorkspace = useAppStore((s) => s.removeWorkspace)
  const toggleSettings = useAppStore((s) => s.toggleSettings)

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-surface-1">
      <div className="flex items-center justify-between px-4 py-4">
        <div>
          <div className="text-sm font-semibold tracking-wide text-zinc-900">Flux</div>
          <div className="text-xs text-zinc-500">工作空间</div>
        </div>
        <button
          className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          onClick={() => void addWorkspace()}
          title="添加工作空间"
        >
          <FolderPlus className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {workspaces.length === 0 ? (
          <div className="px-2 py-6 text-center text-xs text-zinc-500">
            还没有工作空间。点击右上角添加一个本地目录。
          </div>
        ) : (
          workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className={cn(
                'group flex items-start gap-2 rounded-lg px-2 py-2 text-left text-sm',
                workspace.id === activeWorkspaceId
                  ? 'bg-sky-50 text-sky-950'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              )}
            >
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => void setActiveWorkspace(workspace.id)}
              >
                <div className="truncate font-medium">{workspace.name}</div>
                <div className="truncate text-[11px] text-zinc-500">{workspace.path}</div>
                {!workspace.available ? (
                  <div className="mt-1 text-[11px] text-amber-600">不可用</div>
                ) : null}
              </button>
              <button
                className="mt-0.5 hidden rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-red-500 group-hover:block"
                onClick={() => void removeWorkspace(workspace.id)}
                title="移除工作空间"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
      <button
        className="flex items-center gap-2 border-t border-zinc-200 px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        onClick={() => toggleSettings(true)}
      >
        <Settings className="h-4 w-4" />
        设置
      </button>
    </aside>
  )
}
