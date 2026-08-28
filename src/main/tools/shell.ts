import { spawn } from 'node:child_process'
import path from 'node:path'
import { isPathInsideWorkspace } from '../workspace/ignore'

const MAX_OUTPUT = 64 * 1024
const DEFAULT_TIMEOUT_MS = 120_000

function clip(text: string): string {
  if (text.length <= MAX_OUTPUT) return text
  return `${text.slice(0, MAX_OUTPUT)}\n\n[truncated: command output exceeds 64KB]`
}

export async function runWorkspaceCommand(
  workspacePath: string,
  command: string,
  cwd?: string
): Promise<string> {
  const trimmed = command.trim()
  if (!trimmed) throw new Error('command 不能为空')

  const workdir = cwd?.trim()
    ? path.isAbsolute(cwd)
      ? path.resolve(cwd)
      : path.resolve(workspacePath, cwd)
    : path.resolve(workspacePath)

  if (!isPathInsideWorkspace(workspacePath, workdir)) {
    throw new Error('cwd 越界：只能在当前工作空间内执行命令')
  }

  return new Promise((resolve, reject) => {
    const child = spawn(trimmed, {
      cwd: workdir,
      shell: true,
      env: process.env,
      windowsHide: true
    })

    let stdout = ''
    let stderr = ''
    let settled = false

    const finish = (text: string): void => {
      if (settled) return
      settled = true
      resolve(text)
    }

    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      setTimeout(() => {
        if (!settled) child.kill('SIGKILL')
      }, 2_000)
      finish(
        `exit_code: timeout\ncwd: ${workdir}\ncommand: ${trimmed}\n\n${clip(stdout)}\n${clip(stderr)}\n[killed after ${DEFAULT_TIMEOUT_MS / 1000}s]`
      )
    }, DEFAULT_TIMEOUT_MS)

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8')
      if (stdout.length > MAX_OUTPUT * 2) stdout = stdout.slice(0, MAX_OUTPUT)
    })
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8')
      if (stderr.length > MAX_OUTPUT * 2) stderr = stderr.slice(0, MAX_OUTPUT)
    })
    child.on('error', (error) => {
      clearTimeout(timer)
      if (settled) return
      settled = true
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      const parts = [
        `exit_code: ${code ?? 1}`,
        `cwd: ${workdir}`,
        `command: ${trimmed}`,
        '',
        stdout.trim() ? `stdout:\n${clip(stdout.trim())}` : 'stdout: (empty)',
        stderr.trim() ? `stderr:\n${clip(stderr.trim())}` : ''
      ]
      finish(parts.filter(Boolean).join('\n'))
    })
  })
}
