import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { PROVIDER_PRESETS } from '@shared/providers'
import type { SkillMeta, SkillsListResult } from '@shared/models'
import { useAppStore } from '../../stores/app-store'
import { flux } from '../../lib/ipc'
import { cn } from '../../lib/utils'

type SettingsTab = 'model' | 'skill'

const TABS: { id: SettingsTab; label: string; hint: string }[] = [
  { id: 'model', label: 'Model', hint: '模型接入' },
  { id: 'skill', label: 'Skill', hint: '当前可用 skill' }
]

export function SettingsPanel() {
  const open = useAppStore((s) => s.settingsOpen)
  const settings = useAppStore((s) => s.settings)
  const toggleSettings = useAppStore((s) => s.toggleSettings)
  const saveSettings = useAppStore((s) => s.saveSettings)
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId)
  const [tab, setTab] = useState<SettingsTab>('model')
  const [apiBaseUrl, setApiBaseUrl] = useState(settings?.apiBaseUrl ?? '')
  const [model, setModel] = useState(settings?.model ?? '')
  const [apiKey, setApiKey] = useState('')
  const [maxContextChars, setMaxContextChars] = useState(String(settings?.maxContextChars ?? 120000))
  const [saved, setSaved] = useState(false)
  const [skillList, setSkillList] = useState<SkillsListResult | null>(null)
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [skillsError, setSkillsError] = useState<string | null>(null)
  const activeTab = TABS.find((item) => item.id === tab) ?? TABS[0]

  useEffect(() => {
    if (!open || !settings) return
    setApiBaseUrl(settings.apiBaseUrl)
    setModel(settings.model)
    setMaxContextChars(String(settings.maxContextChars))
    setApiKey('')
  }, [open, settings])

  const loadSkills = useCallback(async () => {
    setSkillsLoading(true)
    setSkillsError(null)
    try {
      const result = await flux.skills.list({ workspaceId: activeWorkspaceId ?? undefined })
      setSkillList(result)
    } catch (error) {
      setSkillList(null)
      setSkillsError(error instanceof Error ? error.message : String(error))
    } finally {
      setSkillsLoading(false)
    }
  }, [activeWorkspaceId])

  useEffect(() => {
    if (!open) return
    void loadSkills()
  }, [open, loadSkills])

  if (!open) return null

  return (
    <div className="absolute inset-0 z-20 flex justify-end bg-zinc-900/20">
      <div className="flex h-full w-[400px] flex-col border-l border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-zinc-900">设置</div>
            <div className="text-xs text-zinc-500">{activeTab.hint}</div>
          </div>
          <button className="rounded p-1 text-zinc-500 hover:bg-zinc-100" onClick={() => toggleSettings(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex border-b border-zinc-200 px-5" role="tablist" aria-label="设置分类">
          {TABS.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              className={cn(
                '-mb-px border-b-2 px-3 py-2.5 text-sm font-medium',
                tab === item.id
                  ? 'border-sky-500 text-sky-700'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              )}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {tab === 'model' ? (
            <div className="space-y-4">
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
          ) : (
            <SkillListSection
              result={skillList}
              loading={skillsLoading}
              error={skillsError}
              onRefresh={() => void loadSkills()}
            />
          )}
        </div>
        {tab === 'model' ? (
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
        ) : null}
      </div>
    </div>
  )
}

function SkillListSection({
  result,
  loading,
  error,
  onRefresh
}: {
  result: SkillsListResult | null
  loading: boolean
  error: string | null
  onRefresh: () => void
}) {
  const skills = result?.skills ?? []
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-400">
          Skills{result ? ` · ${skills.length}` : ''}
        </div>
        <button
          className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
          onClick={onRefresh}
          disabled={loading}
          title="刷新 skill 列表"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <p className="text-[11px] leading-5 text-zinc-500">
        用户目录 {result?.userRoot ?? '~/.agents/skills'}
        {result?.workspaceRoot ? `；工作空间 ${result.workspaceRoot}` : '。选择工作空间后会合并其 .agents/skills。'}
        同名时工作空间 skill 会覆盖用户 skill。
      </p>
      {error ? <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{error}</div> : null}
      {loading && skills.length === 0 ? (
        <div className="text-xs text-zinc-500">正在读取 skill…</div>
      ) : null}
      {!error && !loading && skills.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 px-3 py-4 text-xs leading-5 text-zinc-500">
          未发现 skill。将 SKILL.md 放到 ~/.agents/skills/{'{name}'}/ 或当前工作空间 .agents/skills/{'{name}'}/。
        </div>
      ) : null}
      <div className="space-y-2">
        {skills.map((skill) => (
          <SkillCard key={`${skill.source}:${skill.dir}`} skill={skill} />
        ))}
      </div>
    </div>
  )
}

function SkillCard({ skill }: { skill: SkillMeta }) {
  const sourceLabel = skill.source === 'workspace' ? '工作空间' : '用户'
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 truncate text-sm font-medium text-zinc-900">{skill.name}</div>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${
            skill.source === 'workspace' ? 'bg-sky-100 text-sky-700' : 'bg-zinc-200 text-zinc-600'
          }`}
        >
          {sourceLabel}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-5 text-zinc-600">{skill.description}</p>
      <p className="mt-1 truncate text-[10px] text-zinc-400" title={skill.dir}>
        {skill.dir}
      </p>
    </div>
  )
}
