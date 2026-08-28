import { WorkspaceSidebar } from '../components/workspace/WorkspaceSidebar'
import { ThreadList } from '../components/chat/ThreadList'
import { MessageList } from '../components/chat/MessageList'
import { Composer } from '../components/chat/Composer'
import { SettingsPanel } from '../components/settings/SettingsPanel'
import { useAppStore } from '../stores/app-store'

export function WorkspaceChatPage() {
  const workspace = useAppStore((s) =>
    s.workspaces.find((item) => item.id === s.activeWorkspaceId)
  )
  const settings = useAppStore((s) => s.settings)
  const error = useAppStore((s) => s.error)
  const turnId = useAppStore((s) => s.turnId)

  return (
    <div className="relative flex h-full min-h-0">
      <WorkspaceSidebar />
      <ThreadList />
      <section className="flex min-w-0 flex-1 flex-col bg-surface-0">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
          <div>
            <div className="text-sm font-medium text-zinc-900">
              {workspace?.name ?? '未选择工作空间'}
            </div>
            <div className="text-xs text-zinc-500">
              {workspace?.path ?? '添加一个本地目录后开始对话'}
            </div>
          </div>
          <div className="text-xs text-zinc-500">
            {settings?.model || '未配置模型'}
            {turnId ? ' · 生成中' : ''}
          </div>
        </header>
        {error ? (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-xs text-amber-800">
            {error}
          </div>
        ) : null}
        <MessageList />
        <Composer />
      </section>
      <SettingsPanel />
    </div>
  )
}
