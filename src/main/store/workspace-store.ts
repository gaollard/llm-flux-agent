import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import Store from 'electron-store'
import type { Workspace } from '@shared/models'
import { normalizeWorkspacePath, pathsEqual } from '../workspace/ignore'

type PersistedWorkspace = Omit<Workspace, 'available'>

type WorkspaceState = {
  workspaces: PersistedWorkspace[]
  activeWorkspaceId: string | null
}

let store: Store<WorkspaceState> | undefined

function db(): Store<WorkspaceState> {
  if (!store) {
    store = new Store<WorkspaceState>({
      name: 'workspaces',
      defaults: {
        workspaces: [],
        activeWorkspaceId: null
      }
    })
  }
  return store
}

function withAvailability(item: PersistedWorkspace): Workspace {
  let available = false
  try {
    available = fs.statSync(item.path).isDirectory()
  } catch {
    available = false
  }
  return { ...item, available }
}

export function listWorkspaces(): Workspace[] {
  return db().get('workspaces').map(withAvailability)
}

export function getActiveWorkspaceId(): string | null {
  return db().get('activeWorkspaceId')
}

export function getWorkspace(id: string): Workspace | undefined {
  const found = db().get('workspaces').find((item) => item.id === id)
  return found ? withAvailability(found) : undefined
}

export function addWorkspace(inputPath: string): Workspace {
  const normalized = normalizeWorkspacePath(inputPath)
  if (!fs.existsSync(normalized) || !fs.statSync(normalized).isDirectory()) {
    throw new Error('路径无效：请选择已存在的本地目录')
  }

  const existing = db().get('workspaces')
  const duplicate = existing.find((item) => pathsEqual(item.path, normalized))
  const now = Date.now()

  if (duplicate) {
    const updated = existing.map((item) =>
      item.id === duplicate.id ? { ...item, lastOpenedAt: now } : item
    )
    db().set('workspaces', updated)
    db().set('activeWorkspaceId', duplicate.id)
    return withAvailability({ ...duplicate, lastOpenedAt: now })
  }

  const workspace: PersistedWorkspace = {
    id: randomUUID(),
    name: path.basename(normalized) || normalized,
    path: normalized,
    createdAt: now,
    lastOpenedAt: now
  }
  db().set('workspaces', [...existing, workspace])
  db().set('activeWorkspaceId', workspace.id)
  return withAvailability(workspace)
}

export function removeWorkspace(id: string): void {
  const remaining = db().get('workspaces').filter((item) => item.id !== id)
  db().set('workspaces', remaining)
  if (db().get('activeWorkspaceId') === id) {
    const next = remaining.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)[0]
    db().set('activeWorkspaceId', next?.id ?? null)
  }
}

export function setActiveWorkspace(id: string): Workspace {
  const current = getWorkspace(id)
  if (!current) {
    throw new Error('工作空间不存在')
  }
  const now = Date.now()
  const updated = db().get('workspaces').map((item) =>
    item.id === id ? { ...item, lastOpenedAt: now } : item
  )
  db().set('workspaces', updated)
  db().set('activeWorkspaceId', id)
  return { ...current, lastOpenedAt: now }
}
