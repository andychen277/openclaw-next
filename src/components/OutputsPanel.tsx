'use client';

import type { Output } from '@/lib/types';

interface OutputsPanelProps {
  outputs: Output[];
  selectedOutputs: string[];
  processing: string;
  toggleOutput: (f: string) => void;
  mergeOutputs: () => void;
}

export default function OutputsPanel({ outputs, selectedOutputs, processing, toggleOutput, mergeOutputs }: OutputsPanelProps) {
  const disabled = !!processing || selectedOutputs.length < 1;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-muted">已選 {selectedOutputs.length} 個</span>
        <button
          onClick={mergeOutputs}
          disabled={disabled}
          className="btn-primary text-sm"
          aria-label="合併素材並找觀點"
        >
          💡 找觀點 → 創作
        </button>
      </div>

      {outputs.length === 0 ? (
        <div className="py-10 text-center text-muted">
          <p className="mb-2 text-4xl">📁</p>
          <p className="text-sm">還沒有素材，先新增任務讓 AI 產出</p>
        </div>
      ) : (
        outputs.map(o => {
          const selected = selectedOutputs.includes(o.filename);
          return (
            <button
              key={o.filename}
              onClick={() => toggleOutput(o.filename)}
              aria-pressed={selected}
              className={`mb-1.5 flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors ${
                selected
                  ? 'border-primary/50 bg-primary/10'
                  : 'border-border bg-surface/50 hover:border-primary/30'
              }`}
            >
              <span
                className={`flex h-4.5 w-4.5 items-center justify-center rounded text-xs ${
                  selected
                    ? 'border-2 border-primary bg-primary text-white'
                    : 'border-2 border-light bg-transparent'
                }`}
                aria-hidden="true"
              >
                {selected && '✓'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-text">
                  {o.filename.replace(/^\d{4}-\d{2}-\d{2}_/, '').replace(/\.txt$/, '')}
                </p>
                <p className="text-xs text-light">
                  {new Date(o.modified).toLocaleDateString('zh-TW')}
                </p>
              </div>
            </button>
          );
        })
      )}
    </>
  );
}
