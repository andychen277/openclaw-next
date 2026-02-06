'use client';

interface ActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onMerge: () => void;
  onPublish: (platform: string) => void;
}

export default function ActionBar({
  selectedCount,
  onClearSelection,
  onMerge,
  onPublish
}: ActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="glass-card max-w-2xl mx-auto p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-white font-medium">
            已選取 <span className="text-purple-400">{selectedCount}</span> 項
          </span>
          <button
            onClick={onClearSelection}
            className="text-gray-400 hover:text-white text-sm"
          >
            取消選取
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onMerge}
            className="action-btn px-4 py-2 rounded-xl text-white font-medium"
          >
            合併
          </button>

          <div className="relative group">
            <button className="action-btn px-4 py-2 rounded-xl text-white font-medium">
              發布 ▼
            </button>
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
              <div className="glass-card p-2 rounded-xl min-w-[120px]">
                <button
                  onClick={() => onPublish('instagram')}
                  className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  📷 Instagram
                </button>
                <button
                  onClick={() => onPublish('threads')}
                  className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  🧵 Threads
                </button>
                <button
                  onClick={() => onPublish('x')}
                  className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  𝕏 X (Twitter)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
