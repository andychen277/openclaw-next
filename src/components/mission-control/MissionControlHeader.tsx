'use client';

import type { AgentMetrics, BackendStatus } from '@/lib/types';
import Link from 'next/link';

interface MissionControlHeaderProps {
  metrics: AgentMetrics;
  status: BackendStatus;
}

export default function MissionControlHeader({ metrics, status }: MissionControlHeaderProps) {
  const getStatusConfig = () => {
    switch (status.status) {
      case 'Working':
        return { color: 'bg-success', label: '運作中', pulse: true };
      case 'Thinking':
        return { color: 'bg-warning', label: '思考中', pulse: true };
      default:
        return { color: 'bg-slate-500', label: '待命', pulse: false };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="px-4 lg:px-6 py-4">
      {/* Title & Status */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            🌊 OpenClaw Mission Control
          </h1>
          <p className="text-sm text-muted mt-1">Agent Teams & Task Management</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusConfig.color} ${statusConfig.pulse ? 'animate-pulse' : ''}`} />
            <span className="text-sm text-muted">{statusConfig.label}</span>
          </div>

          {/* Settings Link */}
          <Link
            href="/analytics"
            className="text-sm text-muted hover:text-text transition-colors"
            title="詳細分析"
          >
            📊
          </Link>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-3">
          <p className="text-xs text-muted/70 mb-1">Total Tasks</p>
          <p className="text-2xl font-bold text-primary">{metrics.totalTasks}</p>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 p-3">
          <p className="text-xs text-muted/70 mb-1">Active</p>
          <p className="text-2xl font-bold text-amber-400">{metrics.activeTasks}</p>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 p-3">
          <p className="text-xs text-muted/70 mb-1">System Load</p>
          <p className="text-2xl font-bold text-emerald-400">{(metrics.systemLoad * 100).toFixed(0)}%</p>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 p-3">
          <p className="text-xs text-muted/70 mb-1">Avg Response</p>
          <p className="text-2xl font-bold text-blue-400">{metrics.avgResponseTime}ms</p>
        </div>
      </div>
    </div>
  );
}
