import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { SkillMeta, SkillSource } from '@shared/models'

export type { SkillMeta, SkillSource }

const SKILL_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/
const DESCRIPTION_LIMIT = 240
const MAX_LISTED = 80

export function userSkillsRoot(): string {
  return path.join(os.homedir(), '.agents', 'skills')
}

export function workspaceSkillsRoot(workspacePath: string): string {
  return path.join(workspacePath, '.agents', 'skills')
}

export function isValidSkillName(name: string): boolean {
  return SKILL_NAME_RE.test(name)
}

function unquote(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function parseFrontmatter(text: string): Record<string, string> {
  if (!text.startsWith('---')) return {}
  const end = text.indexOf('\n---', 3)
  if (end < 0) return {}
  const raw = text.slice(3, end).replace(/^\r?\n/, '')
  const fields: Record<string, string> = {}
  const lines = raw.split(/\r?\n/)
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/)
    if (!kv) {
      i += 1
      continue
    }
    const key = kv[1]
    let value = kv[2]
    if (value === '>' || value === '>-' || value === '|' || value === '|-') {
      const folded = value.startsWith('>')
      const chunks: string[] = []
      i += 1
      while (i < lines.length && (/^[ \t]/.test(lines[i]) || lines[i] === '')) {
        chunks.push(lines[i].replace(/^[ \t]+/, ''))
        i += 1
      }
      value = folded ? chunks.join(' ').replace(/\s+/g, ' ').trim() : chunks.join('\n').trim()
      fields[key] = unquote(value)
      continue
    }
    fields[key] = unquote(value)
    i += 1
  }
  return fields
}

function isTruthy(value: string | undefined): boolean {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized === 'true' || normalized === 'yes' || normalized === '1'
}

function readSkillMd(dir: string): string | null {
  for (const name of ['SKILL.md', 'skill.md']) {
    const file = path.join(dir, name)
    try {
      return fs.readFileSync(file, 'utf8')
    } catch {
      // try next
    }
  }
  return null
}

function isSkillDirectory(full: string, dirent: fs.Dirent): boolean {
  if (dirent.isDirectory()) return true
  if (!dirent.isSymbolicLink()) return false
  try {
    return fs.statSync(full).isDirectory()
  } catch {
    return false
  }
}

function scanSkillsDir(root: string, source: SkillSource): SkillMeta[] {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(root, { withFileTypes: true })
  } catch {
    return []
  }

  const skills: SkillMeta[] = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    if (!isValidSkillName(entry.name)) continue
    const dir = path.resolve(root, entry.name)
    if (!isSkillDirectory(dir, entry)) continue
    const text = readSkillMd(dir)
    if (text == null) continue
    const fields = parseFrontmatter(text)
    if (isTruthy(fields['disable-model-invocation'])) continue
    const description = (fields.description || 'No description').slice(0, DESCRIPTION_LIMIT)
    skills.push({
      name: entry.name,
      description,
      dir,
      source
    })
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name))
}

export function listSkills(workspacePath?: string): SkillMeta[] {
  const byName = new Map<string, SkillMeta>()
  for (const skill of scanSkillsDir(userSkillsRoot(), 'user')) {
    byName.set(skill.name.toLowerCase(), skill)
  }
  if (workspacePath) {
    for (const skill of scanSkillsDir(workspaceSkillsRoot(workspacePath), 'workspace')) {
      byName.set(skill.name.toLowerCase(), skill)
    }
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name)).slice(0, MAX_LISTED)
}

export function findSkill(name: string, workspacePath?: string): SkillMeta | undefined {
  if (!isValidSkillName(name)) return undefined
  const needle = name.toLowerCase()
  return listSkills(workspacePath).find((item) => item.name.toLowerCase() === needle)
}

const GENERIC_TOKENS = new Set([
  'skill',
  'skills',
  'generator',
  'diagnose',
  'analyzer',
  'guide',
  'fast',
  'code',
  'file',
  'test',
  'agent'
])

export function matchSkills(userText: string, skills: SkillMeta[]): SkillMeta[] {
  const text = userText.toLowerCase()
  if (!text.trim()) return []
  return skills.filter((skill) => {
    const name = skill.name.toLowerCase()
    if (text.includes(name)) return true
    const tokens = name.split(/[-_./]+/).filter((tok) => tok.length >= 5 && !GENERIC_TOKENS.has(tok))
    return tokens.some((tok) => text.includes(tok))
  })
}

export function formatSkillsPrompt(skills: SkillMeta[], matched: SkillMeta[] = []): string {
  if (skills.length === 0) {
    return 'No user skills are installed. Skills are loaded from ~/.agents/skills/{name}/SKILL.md.'
  }
  const lines = skills.map((skill) => `- ${skill.name} [${skill.source}]: ${skill.description}`)
  const hint =
    matched.length > 0
      ? `The latest user message matches: ${matched.map((item) => item.name).join(', ')}. You MUST call the skill tool with one of these names before read_file, grep, or run_command.`
      : 'If the user request matches a skill below, you MUST call the skill tool with that name before answering or searching the workspace.'
  return [
    'You have a skill tool. Never claim you only have read_file and grep.',
    hint,
    'After loading a skill, follow its instructions. CLI steps use run_command. Extra files in the skill folder use skill with file=...',
    ...lines
  ].join('\n')
}
