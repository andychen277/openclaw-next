import { NextResponse } from 'next/server';
import { AGENTS } from '@/lib/constants';
import type { Agent, AgentMetrics } from '@/lib/types';

// Agent 狀態 API
// 返回靜態 Agent 配置，真實指標由前端從 task 資料計算

export async function GET() {
  const agents: Agent[] = Object.entries(AGENTS).map(([id, config]) => ({
    id,
    name: id,
    emoji: config.emoji,
    label: config.label,
    status: 'idle' as const,
    workspace: id === 'general' ? '~/.openclaw/workspace' : `~/.openclaw/workspace_${id}`,
    model: id === 'imagegen' ? 'openrouter/google/gemini-3-pro-preview' : 'openrouter/google/gemini-3-flash-preview',
    currentTask: undefined,
    stats: {
      completedTasks: 0,
      failedTasks: 0,
      averageResponseTime: 0,
      uptime: 0,
    },
  }));

  // Metrics are computed from real task data on the frontend
  const metrics: AgentMetrics = {
    totalTasks: 0,
    activeTasks: 0,
    systemLoad: 0,
    avgResponseTime: 0,
  };

  return NextResponse.json({ agents, metrics });
}
