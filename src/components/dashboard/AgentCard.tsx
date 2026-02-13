'use client';

import type { Agent } from '@/lib/types';

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const statusConfig = {
    idle: {
      color: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      dot: 'bg-slate-400',
      label: 'Idle'
    },
    working: {
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      dot: 'bg-amber-400',
      label: 'Working'
    },
    thinking: {
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      dot: 'bg-blue-400',
      label: 'Thinking'
    },
    error: {
      color: 'bg-red-500/20 text-red-300 border-red-500/30',
      dot: 'bg-red-400',
      label: 'Error'
    },
  };

  const config = statusConfig[agent.status];

  const formatUptime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    if (hours < 1) return '<1h';
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-surface to-surface-darker p-4 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      {/* 背景裝飾 */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/10"></div>

      {/* Agent 頭部 */}
      <div className="relative mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-2xl shadow-inner">
            {agent.emoji}
          </div>
          <div>
            <h3 className="font-semibold text-text text-base">{agent.label}</h3>
            <p className="text-xs text-muted/70">{agent.name}</p>
          </div>
        </div>

        {/* 狀態徽章 */}
        <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${config.dot} animate-pulse`}></span>
          {config.label}
        </div>
      </div>

      {/* 當前任務 */}
      {agent.currentTask && (
        <div className="relative mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3 backdrop-blur-sm">
          <p className="mb-1 text-xs font-medium text-primary">Current Task</p>
          <p className="text-sm text-text/90 line-clamp-2">{agent.currentTask}</p>
        </div>
      )}

      {/* 統計數據網格 */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-background/50 p-2.5">
          <p className="mb-1 text-xs text-muted/70">Completed</p>
          <p className="text-lg font-bold text-emerald-400">{agent.stats.completedTasks}</p>
        </div>
        <div className="rounded-lg bg-background/50 p-2.5">
          <p className="mb-1 text-xs text-muted/70">Failed</p>
          <p className="text-lg font-bold text-red-400">{agent.stats.failedTasks}</p>
        </div>
        <div className="rounded-lg bg-background/50 p-2.5">
          <p className="mb-1 text-xs text-muted/70">Avg Response</p>
          <p className="text-sm font-semibold text-text">{agent.stats.averageResponseTime}ms</p>
        </div>
        <div className="rounded-lg bg-background/50 p-2.5">
          <p className="mb-1 text-xs text-muted/70">Uptime</p>
          <p className="text-sm font-semibold text-text">{formatUptime(agent.stats.uptime)}</p>
        </div>
      </div>

      {/* 模型資訊 */}
      <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/30 px-3 py-2">
        <span className="text-xs font-medium text-muted/70">Model</span>
        <span className="text-xs font-semibold text-text">
          {agent.model.includes('gemini-3-pro') ? '🚀 Pro' : '⚡ Flash'}
        </span>
      </div>

      {/* 進度條（基於完成率） */}
      <div className="mt-3">
        <div className="h-1 w-full overflow-hidden rounded-full bg-background">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
            style={{
              width: `${Math.min(100, (agent.stats.completedTasks / (agent.stats.completedTasks + agent.stats.failedTasks || 1)) * 100)}%`
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
