import { NextResponse } from 'next/server';
import { AGENTS } from '@/lib/constants';
import type { Agent, AgentMetrics } from '@/lib/types';

// Mock Agent 狀態 API
// 後續可替換為真實的 OpenClaw Gateway 呼叫

export async function GET() {
  try {
    // 模擬從 OpenClaw Gateway 獲取 Agent 狀態
    const agents: Agent[] = Object.entries(AGENTS).map(([id, config]) => ({
      id,
      name: id,
      emoji: config.emoji,
      label: config.label,
      status: Math.random() > 0.7 ? 'working' : 'idle' as const,
      workspace: `~/.openclaw/workspace_${id === 'general' ? '' : id}`.replace('workspace_', 'workspace'),
      model: id === 'imagegen' ? 'openrouter/google/gemini-3-pro-preview' : 'openrouter/google/gemini-3-flash-preview',
      currentTask: Math.random() > 0.7 ? '處理中的任務...' : undefined,
      stats: {
        completedTasks: Math.floor(Math.random() * 100),
        failedTasks: Math.floor(Math.random() * 5),
        averageResponseTime: Math.floor(Math.random() * 2000) + 500,
        uptime: Date.now() - Math.floor(Math.random() * 86400000),
      },
    }));

    const metrics: AgentMetrics = {
      totalTasks: agents.reduce((sum, a) => sum + a.stats.completedTasks, 0),
      activeTasks: agents.filter(a => a.status === 'working').length,
      systemLoad: Math.random() * 0.8,
      avgResponseTime: Math.floor(agents.reduce((sum, a) => sum + a.stats.averageResponseTime, 0) / agents.length),
    };

    return NextResponse.json({ agents, metrics });
  } catch (error) {
    console.error('Failed to fetch agent status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent status' },
      { status: 500 }
    );
  }
}
