import { readWorkspaceFile } from './read-file'
import { grepWorkspace } from './grep'
import { loadSkillFile } from './skill'
import { runWorkspaceCommand } from './shell'

export type ToolName = 'read_file' | 'grep' | 'skill' | 'run_command'

export type ToolResult = {
  name: ToolName
  args: Record<string, unknown>
  output: string
}

function asRecord(raw: string): Record<string, unknown> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    // fall through
  }
  return { raw }
}

export async function executeTool(
  workspacePath: string,
  name: string,
  rawArgs: string
): Promise<ToolResult> {
  const args = asRecord(rawArgs)
  if (name === 'read_file') {
    const filePath = String(args.path ?? '')
    const output = readWorkspaceFile(workspacePath, filePath)
    return { name, args, output }
  }
  if (name === 'grep') {
    const pattern = String(args.pattern ?? '')
    const glob = args.glob ? String(args.glob) : undefined
    const output = await grepWorkspace(workspacePath, pattern, glob)
    return { name, args, output }
  }
  if (name === 'skill') {
    const skillName = String(args.name ?? '')
    const file = args.file ? String(args.file) : undefined
    const output = loadSkillFile(workspacePath, skillName, file)
    return { name, args, output }
  }
  if (name === 'run_command') {
    const command = String(args.command ?? '')
    const cwd = args.cwd ? String(args.cwd) : undefined
    const output = await runWorkspaceCommand(workspacePath, command, cwd)
    return { name, args, output }
  }
  return {
    name: name as ToolName,
    args,
    output: `未知工具: ${name}`
  }
}

export function previewToolOutput(output: string): string {
  return output.split(/\r?\n/).slice(0, 20).join('\n')
}
