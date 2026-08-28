import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { rgPath } from '@vscode/ripgrep'
import { isIgnored, loadIgnore, toPosixRel } from '../workspace/ignore'

const MAX_MATCHES = 50
const MAX_OUTPUT = 32 * 1024
const CONTEXT_LINES = 2

function resolveRgBin(): string | null {
  try {
    if (rgPath && fs.existsSync(rgPath)) return rgPath
  } catch {
    // optional at runtime; Node walker is the fallback
  }
  return null
}

function runCommand(bin: string, args: string[], cwd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8')
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8')
    })
    child.on('error', reject)
    child.on('close', (code) => {
      resolve({ stdout, stderr, code: code ?? 1 })
    })
  })
}

function clip(text: string): string {
  if (text.length <= MAX_OUTPUT) return text
  return `${text.slice(0, MAX_OUTPUT)}\n\n[truncated: grep output exceeds 32KB]`
}

async function grepWithRg(
  workspacePath: string,
  pattern: string,
  glob?: string
): Promise<string | null> {
  const bins = [resolveRgBin(), 'rg'].filter(Boolean) as string[]
  const args = [
    '-n',
    '-C',
    String(CONTEXT_LINES),
    '--max-count',
    String(MAX_MATCHES),
    '--max-filesize',
    '200K',
    '--hidden',
    '--glob',
    '!.git/**',
    '--glob',
    '!node_modules/**'
  ]
  if (glob) args.push('--glob', glob)
  args.push('--', pattern, '.')

  for (const bin of bins) {
    try {
      const result = await runCommand(bin, args, workspacePath)
      if (result.code === 0 || result.code === 1) {
        const text = result.stdout.trim()
        return text ? clip(text) : 'No matches.'
      }
    } catch {
      // try next binary
    }
  }
  return null
}

function matchGlob(relPosix: string, glob?: string): boolean {
  if (!glob) return true
  if (glob.startsWith('*.')) {
    return relPosix.endsWith(glob.slice(1))
  }
  return relPosix.includes(glob.replace(/^\*\//, ''))
}

function nodeGrep(workspacePath: string, pattern: string, glob?: string): string {
  let regex: RegExp
  try {
    regex = new RegExp(pattern)
  } catch {
    regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  }

  const ig = loadIgnore(workspacePath)
  const hits: string[] = []

  const walk = (dir: string): void => {
    if (hits.length >= MAX_MATCHES) return
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (hits.length >= MAX_MATCHES) return
      const full = path.join(dir, entry.name)
      if (isIgnored(workspacePath, full, ig)) continue
      if (entry.isDirectory()) {
        walk(full)
        continue
      }
      if (!entry.isFile()) continue
      const rel = toPosixRel(workspacePath, full)
      if (!matchGlob(rel, glob)) continue
      let content: string
      try {
        const buf = fs.readFileSync(full)
        if (buf.includes(0) || buf.length > 200 * 1024) continue
        content = buf.toString('utf8')
      } catch {
        continue
      }
      const lines = content.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        if (hits.length >= MAX_MATCHES) break
        if (!regex.test(lines[i])) continue
        const start = Math.max(0, i - CONTEXT_LINES)
        const end = Math.min(lines.length, i + CONTEXT_LINES + 1)
        const block = lines
          .slice(start, end)
          .map((line, offset) => `${rel}:${start + offset + 1}:${line}`)
          .join('\n')
        hits.push(block)
      }
    }
  }

  walk(workspacePath)
  return hits.length ? clip(hits.join('\n--\n')) : 'No matches.'
}

export async function grepWorkspace(
  workspacePath: string,
  pattern: string,
  glob?: string
): Promise<string> {
  if (!pattern) throw new Error('pattern 不能为空')
  const fromRg = await grepWithRg(workspacePath, pattern, glob)
  if (fromRg !== null) return fromRg
  return nodeGrep(workspacePath, pattern, glob)
}
