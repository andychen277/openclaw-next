'use client';

import { useState } from 'react';
import type { Output, ResultType } from '@/lib/types';
import { SOCIAL_PLATFORMS, PODCAST_DURATIONS, VIDEO_OPTIONS } from '@/lib/constants';
import SocialSharePanel from '../social/SocialSharePanel';

interface ContentPanelProps {
  outputs: Output[];
  geniusItems: Output[];
  selectedOutputs: string[];
  toggleOutput: (filename: string) => void;
  mergeOutputs: () => Promise<void>;

  result: string;
  resultType: ResultType;
  processing: string;
  error: string;

  generateSocial: (platform: string) => Promise<void>;
  generateImage: () => Promise<void>;
  generatePodcast: (duration: string) => Promise<void>;
  generateVideo: (platform: string, duration: string) => Promise<void>;
  copyResult: () => void;
}

type Tab = 'outputs' | 'create';

export default function ContentPanel({
  outputs,
  geniusItems,
  selectedOutputs,
  toggleOutput,
  mergeOutputs,
  result,
  resultType,
  processing,
  error,
  generateSocial,
  generateImage,
  generatePodcast,
  generateVideo,
  copyResult,
}: ContentPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('outputs');

  const hasContent = result && result.trim().length > 0;
  const busy = processing.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex gap-2 p-4 border-b border-border">
        <button
          onClick={() => setActiveTab('outputs')}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            activeTab === 'outputs'
              ? 'bg-primary text-background'
              : 'bg-background text-muted hover:text-text'
          }`}
        >
          📁 素材庫
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            activeTab === 'create'
              ? 'bg-primary text-background'
              : 'bg-background text-muted hover:text-text'
          }`}
        >
          🎨 創作
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'outputs' ? (
          <div className="space-y-4">
            {/* Outputs Section */}
            <div>
              <h3 className="text-sm font-semibold text-text mb-2">Outputs</h3>
              {outputs.length === 0 ? (
                <p className="text-xs text-muted">沒有素材</p>
              ) : (
                <div className="space-y-2">
                  {outputs.slice(0, 10).map(o => (
                    <label
                      key={o.filename}
                      className="flex items-center gap-2 p-2 rounded-lg bg-background hover:bg-surface-darker cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedOutputs.includes(o.filename)}
                        onChange={() => toggleOutput(o.filename)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text truncate">{o.filename}</p>
                        <p className="text-xs text-muted">{o.size} bytes</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Genius Items Section */}
            {geniusItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text mb-2">Genius Library</h3>
                <div className="space-y-2">
                  {geniusItems.slice(0, 5).map(item => {
                    const emoji = item.type === 'social' ? '📱' :
                                  item.type === 'image' ? '🎨' :
                                  item.type === 'podcast' ? '🎙️' :
                                  item.type === 'video' ? '📹' : '✨';
                    return (
                      <div
                        key={item.filename}
                        className="p-2 rounded-lg bg-background hover:bg-surface-darker cursor-pointer transition-colors"
                      >
                        <p className="text-xs text-text truncate">
                          {emoji} {item.filename}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Merge Button */}
            <button
              onClick={mergeOutputs}
              disabled={selectedOutputs.length === 0 || busy}
              className="w-full btn-primary text-sm py-2"
            >
              💡 找觀點 → 創作
            </button>

            {error && (
              <div className="p-2 rounded-lg bg-danger/10 border border-danger/30">
                <p className="text-xs text-danger">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Result Display */}
            {hasContent && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-text">結果</h3>
                  <button
                    onClick={copyResult}
                    className="btn-secondary px-2 py-1 text-xs"
                  >
                    📋 複製
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-background border border-border max-h-48 overflow-y-auto">
                  <pre className="text-xs text-text whitespace-pre-wrap font-mono">{result}</pre>
                </div>
              </div>
            )}

            {/* Social Share Panel */}
            {result && resultType === 'social' && (
              <SocialSharePanel content={result} />
            )}

            {/* Processing Status */}
            {processing && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-xs text-primary">{processing}</p>
              </div>
            )}

            {/* Creation Tools */}
            <div className="space-y-3">
              <p className="text-xs text-muted">從觀點生成...</p>

              {/* Social */}
              <div>
                <p className="text-xs font-medium text-text mb-2">📱 社群文案</p>
                <div className="flex flex-wrap gap-2">
                  {SOCIAL_PLATFORMS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => generateSocial(p.id)}
                      disabled={busy || !hasContent}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image */}
              <div>
                <p className="text-xs font-medium text-text mb-2">🎨 圖片 Prompt</p>
                <button
                  onClick={generateImage}
                  disabled={busy || !hasContent}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  Midjourney / DALL-E
                </button>
              </div>

              {/* Podcast */}
              <div>
                <p className="text-xs font-medium text-text mb-2">🎙️ 播客腳本</p>
                <div className="flex flex-wrap gap-2">
                  {PODCAST_DURATIONS.map(duration => (
                    <button
                      key={duration}
                      onClick={() => generatePodcast(duration)}
                      disabled={busy || !hasContent}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      {duration} 分鐘
                    </button>
                  ))}
                </div>
              </div>

              {/* Video */}
              <div>
                <p className="text-xs font-medium text-text mb-2">📹 短影音腳本</p>
                <div className="flex flex-wrap gap-2">
                  {VIDEO_OPTIONS.map(v => (
                    <button
                      key={`${v.platform}-${v.duration}`}
                      onClick={() => generateVideo(v.platform, v.duration)}
                      disabled={busy || !hasContent}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
