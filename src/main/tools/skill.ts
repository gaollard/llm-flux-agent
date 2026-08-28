import fs from 'node:fs'
import path from 'node:path'
import { isPathInsideWorkspace, isSecretPath, toPosixRel } from '../workspace/ignore'
import { findSkill, isValidSkillName, listSkills } from '../skills/loader'

const MAX_BYTES = 64 * 1024
const MAX_LINES = 4000

function readUtf8File(root: string, target: string): string {
  const stat = fs.statSync(target)
  if (!stat.isFile()) {
    throw new Error('目标不是文件')
  }

  const buf = fs.readFileSync(target)
  if (buf.includes(0)) {
    throw new Error('二进制文件不可读取')
  }

  let text = buf.toString('utf8')
  const truncatedByBytes = buf.length > MAX_BYTES
  if (truncatedByBytes) {
    text = buf.subarray(0, MAX_BYTES).toString('utf8')
  }
  const lines = text.split(/\r?\n/)
  const truncatedByLines = lines.length > MAX_LINES
  if (truncatedByLines) {
    text = lines.slice(0, MAX_LINES).join('\n')
  }

  const rel = toPosixRel(root, target)
  if (truncatedByBytes || truncatedByLines) {
    return `${text}\n\n[truncated: ${rel} exceeds 64KB or 4000 lines]`
  }
  return text
}

export function loadSkillFile(workspacePath: string, name: string, file?: string): string {
  if (!name.trim()) {
    throw new Error('skill 名称不能为空')
  }
  if (!isValidSkillName(name)) {
    throw new Error('非法 skill 名称')
  }

  const skill = findSkill(name, workspacePath)
  if (!skill) {
    const available = listSkills(workspacePath)
      .map((item) => item.name)
      .join(', ')
    throw new Error(`未找到 skill: ${name}${available ? `。可用: ${available}` : ''}`)
  }

  const relative = (file?.trim() || 'SKILL.md').replace(/^[/\\]+/, '')
  const target = path.resolve(skill.dir, relative)
  if (!isPathInsideWorkspace(skill.dir, target)) {
    throw new Error('路径越界：只能读取该 skill 目录内的文件')
  }

  const rel = toPosixRel(skill.dir, target)
  if (isSecretPath(rel)) {
    throw new Error(`拒绝读取敏感文件: ${rel}`)
  }

  const content = readUtf8File(skill.dir, target)
  return [
    `# Skill: ${skill.name} (${skill.source})`,
    `Path: ${skill.dir}`,
    `File: ${rel}`,
    '',
    content,
    '',
    'Follow the instructions above. To read another file in this skill, call skill again with the same name and file set to a relative path. If the skill requires a CLI (for example skynet-base), run it with the run_command tool. Workspace files still use read_file / grep.'
  ].join('\n')
}
