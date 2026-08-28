# Graph Report - flux  (2026-08-28)

## Corpus Check
- 36 files · ~9,320 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 219 nodes · 376 edges · 14 communities (13 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]

## God Nodes (most connected - your core abstractions)
1. `Flux Technical Design` - 16 edges
2. `useAppStore` - 15 edges
3. `runLoop()` - 12 edges
4. `12. 实现任务（依赖序）` - 10 edges
5. `submitTurn()` - 9 edges
6. `db()` - 9 edges
7. `readWorkspaceFile()` - 7 edges
8. `loadIgnore()` - 7 edges
9. `isIgnored()` - 7 edges
10. `streamChat()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `streamChat()` --calls--> `modelSupportsTools()`  [INFERRED]
  src/main/agent/llm-client.ts → src/shared/providers.ts
- `App()` --calls--> `useAppStore`  [EXTRACTED]
  src/renderer/src/App.tsx → src/renderer/src/stores/app-store.ts
- `runLoop()` --calls--> `executeTool()`  [EXTRACTED]
  src/main/agent/loop.ts → src/main/tools/router.ts
- `submitTurn()` --calls--> `getWorkspace()`  [EXTRACTED]
  src/main/agent/loop.ts → src/main/store/workspace-store.ts
- `runLoop()` --calls--> `buildMessages()`  [EXTRACTED]
  src/main/agent/loop.ts → src/main/agent/context-builder.ts

## Communities (14 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (38): 10. 安全, 11. 非功能, 13. 风险与默认决策, 14. 演进（不在本期实现）, 1.1 产品目标, 1.2 In Scope（v1）, 1.3 Out of Scope（v1 明确不做）, 1. 目标与范围 (+30 more)

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (27): abortTurn(), emit(), InFlight, inflightByThread, inflightByTurn, isAbortError(), runLoop(), submitTurn() (+19 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (33): 12. 实现任务（依赖序）, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Target Modules, Target Modules, Target Modules, Target Modules (+25 more)

### Community 3 - "Community 3"
Cohesion: 0.17
Nodes (11): Composer(), MessageList(), ThreadList(), cn(), WorkspaceChatPage(), SettingsPanel(), App(), AppState (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.16
Nodes (21): api, FluxApi, Window, WorkspaceListResult, WorkspaceListResult, AgentEvent, IpcChannel, IpcChannelName (+13 more)

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (19): clip(), grepWithRg(), grepWorkspace(), nodeGrep(), resolveRgBin(), runCommand(), readWorkspaceFile(), asRecord() (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (15): buildMessages(), flatten(), measure(), readAgentsMd(), ChatMessage, flattenToolMessages(), mergeAbort(), normalizeCompletionsUrl() (+7 more)

### Community 7 - "Community 7"
Cohesion: 0.32
Nodes (11): addWorkspace(), db(), getActiveWorkspaceId(), getWorkspace(), listWorkspaces(), PersistedWorkspace, removeWorkspace(), setActiveWorkspace() (+3 more)

## Knowledge Gaps
- **73 isolated node(s):** `DraftTool`, `AppState`, `ProviderPreset`, `PROVIDER_PRESETS`, `IpcChannelName` (+68 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Flux Technical Design` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `12. 实现任务（依赖序）` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `streamChat()` connect `Community 6` to `Community 1`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `DraftTool`, `AppState`, `ProviderPreset` to the rest of the system?**
  _73 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._