import fs from 'node:fs'
import path from 'node:path'
import {
  isIgnored,
  isPathInsideWorkspace,
  loadIgnore,
  toPosixRel
} from '../workspace/ignore'

const MAX_BYTES = 200 * 1024
const MAX_LINES = 4000

export function readWorkspaceFile(workspacePath: string, inputPath: string): string {
  const target = path.isAbsolute(inputPath)
    ? path.resolve(inputPath)
    : path.resolve(workspacePath, inputPath)

  if (!isPathInsideWorkspace(workspacePath, target)) {
    throw new Error('路径越界：只能读取当前工作空间内的文件')
  }

  const ig = loadIgnore(workspacePath)
  if (isIgnored(workspacePath, target, ig)) {
    throw new Error(`拒绝读取被忽略或敏感文件: ${toPosixRel(workspacePath, target)}`)
  }

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

  const rel = toPosixRel(workspacePath, target)
  if (truncatedByBytes || truncatedByLines) {
    return `${text}\n\n[truncated: ${rel} exceeds 200KB or 4000 lines]`
  }
  return text
}
