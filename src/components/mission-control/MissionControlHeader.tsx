'use client';

import type { AgentMetrics, BackendStatus } from '@/lib/types';

interface MissionControlHeaderProps {
  metrics: AgentMetrics;
  status: BackendStatus;
  gatewayConnected?: boolean | null;
}

export default function MissionControlHeader({ metrics, status, gatewayConnected }: MissionControlHeaderProps) {
  const getStatusConfig = () => {
    if (gatewayConnected === false) {
      return { color: 'bg-orange-500', label: '離線模式', pulse: false };
    }
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
    <div className="px-4 lg:px-6 py-3">
      {/* Title & Status - single compact row */}
      <div className="flex items-center justify-between">
        <h1 className="text-base md:text-xl font-bold text-text">
          OpenClaw
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${statusConfig.color} ${statusConfig.pulse ? 'animate-pulse' : ''}`} />
            <span className="text-xs text-muted">{statusConfig.label}</span>
          </div>
        </div>
      </div>

      {/* Compact metrics row */}
      <div className="flex gap-3 mt-2 text-xs text-muted">
        <span><span className="font-semibold text-primary">{metrics.totalTasks}</span> tasks</span>
        <span><span className="font-semibold text-amber-400">{metrics.activeTasks}</span> active</span>
        <span><span className="font-semibold text-emerald-400">{(metrics.systemLoad * 100).toFixed(0)}%</span> load</span>
      </div>
    </div>
  );
}
