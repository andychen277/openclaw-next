'use client';

import { useState } from 'react';
import type { Agent } from '@/lib/types';
import AgentCard from '../dashboard/AgentCard';

interface AgentsPanelProps {
  agents: Agent[];
  addTask: (task: string) => Promise<void>;
  loading: boolean;
  input: string;
  setInput: (value: string) => void;
}

export default function AgentsPanel({ agents, addTask, loading, input, setInput }: AgentsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAgents = agents.filter(agent =>
    agent.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addTask(input);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <input
          type="text"
          placeholder="搜尋 Agent..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Agent Cards - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredAgents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted">No agents found</p>
          </div>
        ) : (
          filteredAgents.map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))
        )}
      </div>

      {/* Quick Add Task - Sticky at bottom */}
      <div className="p-4 border-t border-border bg-surface-darker">
        <p className="text-xs text-muted mb-2">➕ Quick Add Task</p>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            placeholder="輸入新任務..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-full btn-primary text-sm py-2"
          >
            {loading ? '送出中...' : '送出任務'}
          </button>
        </form>
      </div>
    </div>
  );
}
