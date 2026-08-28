import path from 'node:path'
import fs from 'node:fs'
import ignore, { type Ignore } from 'ignore'

const DEFAULT_IGNORES = [
  '.git',
  'node_modules',
  'dist',
  'out',
  'release',
  '.DS_Store',
  '*.min.js',
  '*.lock'
]

export function normalizeWorkspacePath(input: string): string {
  return path.resolve(input)
}

export function pathsEqual(a: string, b: string): boolean {
  const left = path.resolve(a)
  const right = path.resolve(b)
  if (process.platform === 'win32') {
    return left.toLowerCase() === right.toLowerCase()
  }
  return left === right
}

export function isPathInsideWorkspace(workspacePath: string, targetPath: string): boolean {
  const root = path.resolve(workspacePath)
  const target = path.resolve(targetPath)
  const rel = path.relative(root, target)
  if (!rel) return true
  if (path.isAbsolute(rel)) return false
  const parts = rel.split(path.sep)
  return !parts.includes('..')
}

export function toPosixRel(workspacePath: string, targetPath: string): string {
  const rel = path.relative(path.resolve(workspacePath), path.resolve(targetPath))
  return rel.split(path.sep).join('/')
}

export function isSecretPath(relPosix: string): boolean {
  const base = relPosix.split('/').pop() || ''
  if (base === '.env' || base.startsWith('.env.')) return true
  if (base.endsWith('.pem')) return true
  if (base === 'id_rsa' || base === 'id_ed25519' || base.endsWith('_rsa')) return true
  return false
}

function readIgnoreFile(workspacePath: string, name: string): string {
  const file = path.join(workspacePath, name)
  try {
    return fs.readFileSync(file, 'utf8')
  } catch {
    return ''
  }
}

export function loadIgnore(workspacePath: string): Ignore {
  const ig = ignore()
  ig.add(DEFAULT_IGNORES)
  const gitignore = readIgnoreFile(workspacePath, '.gitignore')
  if (gitignore) ig.add(gitignore)
  const fluxignore = readIgnoreFile(workspacePath, '.fluxignore')
  if (fluxignore) ig.add(fluxignore)
  return ig
}

export function isIgnored(workspacePath: string, targetPath: string, ig?: Ignore): boolean {
  const rel = toPosixRel(workspacePath, targetPath)
  if (!rel || rel.startsWith('..')) return true
  if (isSecretPath(rel)) return true
  const engine = ig ?? loadIgnore(workspacePath)
  return engine.ignores(rel)
}
