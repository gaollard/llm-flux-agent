export type ProviderPreset = {
  id: string
  label: string
  apiBaseUrl: string
  model: string
  hint: string
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'deepseek',
    label: 'DeepSeek',
    apiBaseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    hint: '官方接口。deepseek-chat 支持读仓库；deepseek-reasoner 不支持工具调用。'
  },
  {
    id: 'openai',
    label: 'OpenAI',
    apiBaseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4.1',
    hint: 'OpenAI 兼容 Chat Completions。'
  }
]

export function modelSupportsTools(model: string): boolean {
  const id = model.trim().toLowerCase()
  if (!id) return true
  return !id.includes('reasoner') && !id.includes('deepseek-r1') && id !== 'r1'
}
