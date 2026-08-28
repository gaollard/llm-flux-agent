export const IpcChannel = {
  workspaceList: 'workspace.list',
  workspaceAdd: 'workspace.add',
  workspaceRemove: 'workspace.remove',
  workspaceSetActive: 'workspace.setActive',
  workspacePickDirectory: 'workspace.pickDirectory',
  threadList: 'thread.list',
  threadCreate: 'thread.create',
  threadGetMessages: 'thread.getMessages',
  threadDelete: 'thread.delete',
  agentSubmit: 'agent.submit',
  agentAbort: 'agent.abort',
  settingsGet: 'settings.get',
  settingsUpdate: 'settings.update',
  skillsList: 'skills.list',
  agentEvent: 'agent.event'
} as const

export type IpcChannelName = (typeof IpcChannel)[keyof typeof IpcChannel]
