'use client';

import { useState } from 'react';
import type { Agent } from '@/lib/types';
import AgentCard from './AgentCard';

interface AgentSearchProps {
  agents: Agent[];
}

export default function AgentSearch({ agents }: AgentSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'idle' | 'working' | 'thinking' | 'error'>('all');

  const filteredAgents = agents.filter(agent => {
    const matchesSearch =
      agent.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* 搜尋和篩選 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* 搜尋框 */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2 pl-10 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* 狀態篩選 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Status:</span>
          <div className="flex gap-2">
            {['all', 'idle', 'working', 'thinking'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-primary text-background'
                    : 'bg-surface text-muted hover:bg-surface-darker hover:text-text'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 結果顯示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAgents.map(agent => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted">No agents found</p>
        </div>
      )}
    </div>
  );
}
