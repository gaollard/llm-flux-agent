import { useEffect } from 'react'
import { WorkspaceChatPage } from './pages/WorkspaceChatPage'
import { useAppStore } from './stores/app-store'
import { flux } from './lib/ipc'

export default function App() {
  const load = useAppStore((s) => s.load)
  const ready = useAppStore((s) => s.ready)
  const abort = useAppStore((s) => s.abort)
  const handleEvent = useAppStore((s) => s.handleEvent)

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    return flux.agent.onEvent((event) => {
      void handleEvent(event)
    })
  }, [handleEvent])

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        void abort()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [abort])

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">加载中…</div>
    )
  }

  return <WorkspaceChatPage />
}
