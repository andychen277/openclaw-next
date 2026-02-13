'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Agent, AgentMetrics } from '@/lib/types';

async function fetchAgentStatus() {
  const res = await fetch('/api/agents/status');
  if (!res.ok) throw new Error('Failed to fetch agent status');
  return res.json();
}

export function useAgentStatus() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics>({
    totalTasks: 0,
    activeTasks: 0,
    systemLoad: 0,
    avgResponseTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchAgentStatus();
      setAgents(data.agents || []);
      setMetrics(data.metrics || {});
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加載和輪詢（5秒間隔，暗色模式下暫停）
  useEffect(() => {
    fetchData();

    const poll = () => {
      if (document.hidden) return;
      fetchData();
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { agents, metrics, loading, error, refresh: fetchData };
}
