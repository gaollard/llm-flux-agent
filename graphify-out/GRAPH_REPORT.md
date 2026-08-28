# Graph Report - flux  (2026-08-28)

## Corpus Check
- 39 files · ~11,399 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 324 nodes · 531 edges · 17 communities (15 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `58178826`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]

## God Nodes (most connected - your core abstractions)
1. `Flux Technical Design` - 16 edges
2. `Flux Technical Design` - 16 edges
3. `useAppStore` - 15 edges
4. `runLoop()` - 12 edges
5. `loadSkillFile()` - 10 edges
6. `listSkills()` - 10 edges
7. `12. 实现任务（依赖序）` - 10 edges
8. `12. 实现任务（依赖序）` - 10 edges
9. `submitTurn()` - 9 edges
10. `buildMessages()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `streamChat()` --calls--> `modelSupportsTools()`  [INFERRED]
  src/main/agent/llm-client.ts → src/shared/providers.ts
- `App()` --calls--> `useAppStore`  [EXTRACTED]
  src/renderer/src/App.tsx → src/renderer/src/stores/app-store.ts
- `runLoop()` --calls--> `executeTool()`  [EXTRACTED]
  src/main/agent/loop.ts → src/main/tools/router.ts
- `loadSkillFile()` --calls--> `listSkills()`  [EXTRACTED]
  src/main/tools/skill.ts → src/main/skills/loader.ts
- `runLoop()` --calls--> `buildMessages()`  [EXTRACTED]
  src/main/agent/loop.ts → src/main/agent/context-builder.ts

## Communities (17 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (38): abortTurn(), emit(), InFlight, inflightByThread, inflightByTurn, isAbortError(), runLoop(), submitTurn() (+30 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (38): 10. 安全, 11. 非功能, 13. 风险与默认决策, 14. 演进（不在本期实现）, 1.1 产品目标, 1.2 In Scope（v1）, 1.3 Out of Scope（v1 明确不做）, 1. 目标与范围 (+30 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (38): 10. 安全, 11. 非功能, 13. 风险与默认决策, 14. 演进（不在本期实现）, 1.1 产品目标, 1.2 In Scope（v1）, 1.3 Out of Scope（v1 明确不做）, 1. 目标与范围 (+30 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (33): 12. 实现任务（依赖序）, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Target Modules, Target Modules, Target Modules, Target Modules (+25 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (33): 12. 实现任务（依赖序）, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Target Modules, Target Modules, Target Modules, Target Modules (+25 more)

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (24): findSkill(), isValidSkillName(), clip(), grepWithRg(), grepWorkspace(), nodeGrep(), resolveRgBin(), runCommand() (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (13): Composer(), MessageList(), ThreadList(), cn(), WorkspaceChatPage(), SettingsPanel(), SettingsTab, TABS (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (25): api, FluxApi, Window, WorkspaceListResult, WorkspaceListResult, AgentEvent, IpcChannel, IpcChannelName (+17 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (18): buildMessages(), flatten(), measure(), readAgentsMd(), formatSkillsPrompt(), GENERIC_TOKENS, isSkillDirectory(), isTruthy() (+10 more)

### Community 9 - "Community 9"
Cohesion: 0.19
Nodes (11): ChatMessage, flattenToolMessages(), mergeAbort(), normalizeCompletionsUrl(), streamChat(), StreamResult, StreamToolCall, TOOLS (+3 more)

## Knowledge Gaps
- **129 isolated node(s):** `DraftTool`, `AppState`, `SettingsTab`, `TABS`, `ProviderPreset` (+124 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Flux Technical Design` connect `Community 1` to `Community 3`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `Flux Technical Design` connect `Community 2` to `Community 4`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `12. 实现任务（依赖序）` connect `Community 3` to `Community 1`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `DraftTool`, `AppState`, `SettingsTab` to the rest of the system?**
  _129 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._