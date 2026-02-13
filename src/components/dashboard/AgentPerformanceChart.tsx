'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Agent } from '@/lib/types';

interface AgentPerformanceChartProps {
  agents: Agent[];
}

export default function AgentPerformanceChart({ agents }: AgentPerformanceChartProps) {
  // 生成模擬的歷史數據
  const generateHistoricalData = () => {
    const data = [];
    const now = Date.now();

    for (let i = 6; i >= 0; i--) {
      const timestamp = new Date(now - i * 24 * 60 * 60 * 1000);
      const dataPoint: any = {
        date: timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };

      agents.forEach(agent => {
        // 模擬歷史數據（實際應從 API 獲取）
        const baseValue = agent.stats.completedTasks / 7;
        const randomVariation = Math.random() * baseValue * 0.3;
        dataPoint[agent.label] = Math.floor(baseValue + randomVariation);
      });

      data.push(dataPoint);
    }

    return data;
  };

  const data = generateHistoricalData();

  const COLORS = [
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ];

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="mb-4 text-lg font-semibold text-text">Agent Performance Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="date" stroke="#888" style={{ fontSize: '12px' }} />
          <YAxis stroke="#888" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          {agents.map((agent, index) => (
            <Line
              key={agent.id}
              type="monotone"
              dataKey={agent.label}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
