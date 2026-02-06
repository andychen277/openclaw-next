'use client';

import type { BackendStatus } from '@/lib/types';

export default function Header({ status }: { status: BackendStatus }) {
  const isWorking = status.status === 'Working';
  const isThinking = status.status === 'Thinking';

  return (
    <header className="border-b border-border bg-surface/50 px-4 py-4">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl" role="img" aria-label="OpenClaw">🦞</span>
          <div>
            <h1 className="text-lg font-semibold text-text">OpenClaw</h1>
            <p className="text-xs text-light">社群內容流水線</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              isWorking ? 'bg-success animate-pulse' : isThinking ? 'bg-warning animate-pulse' : 'bg-light'
            }`}
            aria-hidden="true"
          />
          <span className="text-xs text-muted">
            {isWorking ? '處理中' : isThinking ? '思考中' : '待命'}
          </span>
        </div>
      </div>
    </header>
  );
}
