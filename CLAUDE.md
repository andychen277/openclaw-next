# OpenClaw (OpenCloud) 極致效能與協作配置規範

## 1. 專案概述

**openclaw-next** 是 OpenClaw AI Agent 系統的 Web 前端介面，基於 Next.js 構建。

- **框架**: Next.js 16.1.6, React 19, TypeScript
- **樣式**: Tailwind CSS v4
- **部署**: Vercel (https://openclaw-next.vercel.app)
- **OpenClaw Gateway**: localhost:18789 (local mode)
- **認證**: OpenRouter API (統一模型路由)

## 2. 核心架構原則

### 2.1 物理隔離 (Workspace Isolation)

所有子 Agent 擁有獨立的 workspace 路徑，嚴禁與主 Agent 共用根目錄。

| Agent | Workspace | 隔離狀態 |
|-------|-----------|---------|
| Main (Ocean) | `~/.openclaw/workspace` | 根 workspace |
| Dev (Forge) | `~/.openclaw/workspace_dev` | 獨立隔離 — 277 業務開發 |
| DevCC (ForgeCC) | `~/.openclaw/workspace_forgecc` | 獨立隔離 — OpenClaw 平台開發 |
| ImageGen (Pixel) | `~/.openclaw/workspace_imagegen` | 獨立隔離 |
| Writer (Quill) | `~/.openclaw/workspace_writer` | 獨立隔離 |
| Forum (Echo) | `~/.openclaw/workspace_forum` | 獨立隔離 |
| Brainstorm (Spark) | `~/.openclaw/workspace_brainstorm` | 獨立隔離 |

**效益**: 子 Agent 啟動時僅加載該任務相關的少量上下文，不讀取主 Agent 累積的龐大歷史記憶，大幅降低 Token 輸入量。

### 2.2 零輪詢機制 (Zero-Polling with Hooks)

針對 Dev Agent 的編程與長耗時任務，利用 Claude Code 的 `stop` Hook 和 `session_end` Hook 取代傳統輪詢。

**工作流程**:
1. OpenClaw 將開發需求寫入任務文件
2. 啟動 Claude Code Agent Teams 模式 (`claude-code-wingman` skill)
3. Claude Code 執行完畢後透過 Hook 主動回調通知
4. OpenClaw 讀取結果並推送到 Dev 群組

> **注意**: OpenClaw Hook 系統目前僅支援 `gateway:startup` 和 `agent:message` 事件。
> 社群正在提案 `tool:call` / `tool:result` 擴展 (GitHub Issue #10502)。
> 目前透過 `claude-code-wingman` skill 的檔案監控機制實現類似效果。

## 3. 環境與認證

### 3.1 Google Antigravity

Google 的 AI-first IDE，搭配 Gemini 3 模型系列。用於 ImageGen Agent 調用 Nano Banana Pro 圖像生成。

- **認證**: 需安裝 Google Antigravity 插件並完成 Google 帳號登入
- **Auth 插件**: `opencode-google-antigravity-auth` (若使用 OpenCode 編輯器)

### 3.2 模型權限

| 模型 | 用途 | OpenRouter ID |
|------|------|---------------|
| Gemini 3 Flash | 低成本文字任務 | `openrouter/google/gemini-3-flash-preview` |
| Gemini 3 Pro | 圖像生成 (Nano Banana Pro) | `openrouter/google/gemini-3-pro-preview` |
| Claude Opus 4.5 | 主腦推理/調度 | `openrouter/anthropic/claude-opus-4.5` |
| Claude Sonnet 4.5 | 開發工程 | `openrouter/anthropic/claude-sonnet-4.5` |

## 4. Agent 團隊角色定義

### 當前配置 (Active Configuration)

| Agent 角色 | 群組 | 模型 | 關鍵職責 |
|-----------|------|------|---------|
| 主控大腦 (Ocean) | Main | Gemini 3 Flash | 系統調度、任務分派 (`dispatch-task`)、模型容災管理 |
| 開發工程師 (Forge) | Dev | Gemini 3 Flash | 277 業務開發 (LINE Bot, ERP, SaaS) |
| 平台工程師 (ForgeCC) | DevCC | Gemini 3 Flash | openclaw-next 前端開發、Claude Code 整合 |
| 視覺設計師 (Pixel) | ImageGen | Gemini 3 Pro | 調用 Nano Banana Pro 生成高清圖 |
| 文案寫手 (Quill) | Writer | Gemini 3 Flash | 行銷文案、社群貼文 (成本優化) |
| 社群專員 (Echo) | Forum | Gemini 3 Flash | Moltbook 發帖/跟帖、安全掃描 (成本優化) |
| 創意顧問 (Spark) | Brainstorm | Gemini 3 Flash | 腦力激盪、策略發想 (成本優化) |

### 未來升級規劃 (Future Upgrade Path)

待評估成本與效能後，可考慮以下模型升級：

| Agent | 現行模型 | 候選升級 | 備註 |
|-------|---------|---------|------|
| Main (Ocean) | Gemini 3 Flash | Claude Opus 4.5 | 高階推理/調度 |
| Dev (Forge) | Gemini 3 Flash | Claude Sonnet 4.5 | 編程專用 |
| 模型容災 | 無 | Opus → Sonnet → Flash | 額度耗盡自動切換 |

## 5. 自動化配置計劃

### 階段一：模型升級 (Model Upgrade) — 暫緩

維持現有模型配置，未來視需求再升級。

### 階段二：Hooks 回調工作流

透過 `claude-code-wingman` skill 實現:
1. OpenClaw 寫入任務文件至 `workspace_dev/projects/`
2. 啟動 Claude Code session
3. Claude Code 完成後寫入結果檔案
4. 檔案監控觸發通知回 Dev 群組

### 階段三：安全與容災

**模型容災 (Failover)**:
```
優先級: Claude Opus 4.5 → Claude Sonnet 4.5 → Gemini 3 Flash
```
在 `openclaw.json` 中設定 `agents.defaults.model.fallback` 鏈。

**安全掃描**:
Forum Agent (Echo) 的 SOUL.md 已包含完整的:
- Prompt Injection 防禦
- 身份固定約束
- 操作限制
- 任務後安全檢查
- 威脅通報機制

## 6. 專案結構 (openclaw-next)

```
openclaw-next/
├── src/
│   ├── app/
│   │   ├── page.tsx          # 主頁面 (Tasks/Outputs/Genius/Create tabs)
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Tailwind + 自訂主題色
│   ├── components/
│   │   ├── Header.tsx        # 頂部狀態列
│   │   ├── TabNav.tsx        # 頁籤導航
│   │   ├── TasksPanel.tsx    # 任務面板
│   │   ├── OutputsPanel.tsx  # 輸出面板
│   │   ├── GeniusPanel.tsx   # 創意面板
│   │   └── CreatePanel.tsx   # 創建面板
│   ├── hooks/
│   │   └── useOpenClaw.ts    # OpenClaw Gateway API hook
│   └── lib/
│       ├── api.ts            # API 封裝
│       └── types.ts          # TypeScript 類型定義
├── CLAUDE.md                 # 本文件
├── package.json
├── tsconfig.json
└── next.config.ts
```

## 7. 開發規範

### 7.1 指令

```bash
/opt/homebrew/bin/npm run dev    # 本地開發 (port 3000)
/opt/homebrew/bin/npm run build  # 生產構建
/opt/homebrew/bin/npm run start  # 生產啟動
```

> npm 不在預設 PATH 中，必須使用完整路徑 `/opt/homebrew/bin/npm`

### 7.2 編碼慣例

- 使用 TypeScript strict mode
- 元件使用 `'use client'` directive (React 19 Server Components 為預設)
- 樣式使用 Tailwind CSS v4 utility classes
- API 呼叫統一透過 `src/lib/api.ts`
- 類型定義統一在 `src/lib/types.ts`
- 狀態管理使用 React hooks (`useOpenClaw`)

### 7.3 OpenClaw Gateway API

- **Endpoint**: `http://localhost:18789`
- **Auth**: Bearer token (存於 `~/.openclaw/openclaw.json` gateway.auth.token)
- **主要 API**: 任務提交、輸出查詢、Agent 狀態

## 8. 驗收標準

配置完成後應滿足:

1. 所有子 Agent 的 workspace 路徑皆與 Main Agent 不同 — 已達成 (7 個獨立 workspace)
2. 各 Agent 模型配置正確（Flash/Pro 分工） — 已達成
3. Forge (277) 與 ForgeCC (OpenClaw) 完全隔離 — 已達成
4. Dev Agent 整合 `claude-code-wingman` skill — 已達成
5. 低成本任務 Agent (Writer/Forum/Brainstorm) 綁定 Gemini 3 Flash — 已達成
6. ImageGen Agent 綁定 Gemini 3 Pro — 已達成
7. Forum Agent 具備完整安全掃描能力 — 已達成 (SOUL.md)
