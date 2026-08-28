import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { PROVIDER_PRESETS } from '@shared/providers'
import { useAppStore } from '../../stores/app-store'

export function SettingsPanel() {
  const open = useAppStore((s) => s.settingsOpen)
  const settings = useAppStore((s) => s.settings)
  const toggleSettings = useAppStore((s) => s.toggleSettings)
  const saveSettings = useAppStore((s) => s.saveSettings)
  const [apiBaseUrl, setApiBaseUrl] = useState(settings?.apiBaseUrl ?? '')
  const [model, setModel] = useState(settings?.model ?? '')
  const [apiKey, setApiKey] = useState('')
  const [maxContextChars, setMaxContextChars] = useState(String(settings?.maxContextChars ?? 120000))
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!open || !settings) return
    setApiBaseUrl(settings.apiBaseUrl)
    setModel(settings.model)
    setMaxContextChars(String(settings.maxContextChars))
    setApiKey('')
  }, [open, settings])

  if (!open) return null

  return (
    <div className="absolute inset-0 z-20 flex justify-end bg-zinc-900/20">
      <div className="flex h-full w-[380px] flex-col border-l border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-zinc-900">模型设置</div>
            <div className="text-xs text-zinc-500">支持 OpenAI 兼容接口，含 DeepSeek 官方 API</div>
          </div>
          <button className="rounded p-1 text-zinc-500 hover:bg-zinc-100" onClick={() => toggleSettings(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div className="space-y-2">
            <div className="text-sm text-zinc-400">快捷配置</div>
            <div className="flex flex-wrap gap-2">
              {PROVIDER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 hover:border-sky-500 hover:text-sky-700"
                  onClick={() => {
                    setApiBaseUrl(preset.apiBaseUrl)
                    setModel(preset.model)
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] leading-5 text-zinc-500">
              {PROVIDER_PRESETS.find(
                (item) => item.apiBaseUrl === apiBaseUrl || item.model === model
              )?.hint ?? '填写任意 OpenAI 兼容 Base URL 即可。'}
            </p>
          </div>
          <label className="block space-y-1.5 text-sm">
            <span className="text-zinc-400">Base URL</span>
            <input
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-sky-500"
              placeholder="https://api.deepseek.com"
              value={apiBaseUrl}
              onChange={(event) => setApiBaseUrl(event.target.value)}
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-zinc-400">Model</span>
            <input
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-sky-500"
              placeholder="deepseek-chat"
              value={model}
              onChange={(event) => setModel(event.target.value)}
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-zinc-400">
              API Key {settings?.hasApiKey ? <span className="text-emerald-400">已保存</span> : null}
            </span>
            <input
              type="password"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-sky-500"
              placeholder={settings?.hasApiKey ? '••••••••（留空则保持原值）' : 'sk-...'}
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-zinc-400">maxContextChars</span>
            <input
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-sky-500"
              value={maxContextChars}
              onChange={(event) => setMaxContextChars(event.target.value)}
            />
          </label>
        </div>
        <div className="border-t border-zinc-200 p-4">
          <button
            className="w-full rounded-lg bg-sky-500 py-2 text-sm font-medium text-white hover:bg-sky-400"
            onClick={async () => {
              await saveSettings({
                apiBaseUrl,
                model,
                maxContextChars: Number(maxContextChars) || 120000,
                ...(apiKey ? { apiKey } : {})
              })
              setApiKey('')
              setSaved(true)
              setTimeout(() => setSaved(false), 1500)
            }}
          >
            {saved ? '已保存' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
