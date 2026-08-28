import { safeStorage } from 'electron'
import Store from 'electron-store'
import type { PublicSettings } from '@shared/models'

type SettingsState = {
  apiBaseUrl: string
  model: string
  maxContextChars: number
  apiKeyEnc: string
}

let cache: Store<SettingsState> | undefined

function db(): Store<SettingsState> {
  if (!cache) {
    cache = new Store<SettingsState>({
      name: 'settings',
      defaults: {
        apiBaseUrl: '',
        model: '',
        maxContextChars: 120_000,
        apiKeyEnc: ''
      }
    })
  }
  return cache
}

function encryptSecret(value: string): string {
  if (!value) return ''
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(value).toString('base64')
  }
  return Buffer.from(value, 'utf8').toString('base64')
}

function decryptSecret(value: string): string {
  if (!value) return ''
  const buf = Buffer.from(value, 'base64')
  if (safeStorage.isEncryptionAvailable()) {
    try {
      return safeStorage.decryptString(buf)
    } catch {
      return ''
    }
  }
  return buf.toString('utf8')
}

export function getPublicSettings(): PublicSettings {
  return {
    apiBaseUrl: db().get('apiBaseUrl'),
    model: db().get('model'),
    hasApiKey: Boolean(db().get('apiKeyEnc')),
    maxContextChars: db().get('maxContextChars') || 120_000
  }
}

export function getApiKey(): string {
  return decryptSecret(db().get('apiKeyEnc'))
}

export function updateSettings(patch: {
  apiBaseUrl?: string
  apiKey?: string
  model?: string
  maxContextChars?: number
}): PublicSettings {
  if (patch.apiBaseUrl !== undefined) db().set('apiBaseUrl', patch.apiBaseUrl.trim())
  if (patch.model !== undefined) db().set('model', patch.model.trim())
  if (patch.maxContextChars !== undefined) {
    db().set('maxContextChars', Math.max(8_000, Math.min(patch.maxContextChars, 500_000)))
  }
  if (patch.apiKey !== undefined && patch.apiKey !== '') {
    db().set('apiKeyEnc', encryptSecret(patch.apiKey.trim()))
  }
  return getPublicSettings()
}
