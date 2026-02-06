'use client';

import { SOCIAL_PLATFORMS, PODCAST_DURATIONS, VIDEO_OPTIONS } from '@/lib/constants';
import type { ResultType } from '@/lib/types';

interface CreatePanelProps {
  result: string;
  resultType: ResultType;
  processing: string;
  generateSocial: (platform: string) => void;
  generateImage: () => void;
  generatePodcast: (duration: string) => void;
  generateVideo: (platform: string, duration: string) => void;
  copyResult: () => void;
}

const RESULT_LABELS: Record<string, string> = {
  merge: '💡 觀點分析',
  social: '📱 社群文案',
  image: '🖼️ 圖片 Prompt',
  podcast: '🎙️ 播客腳本',
  video: '🎬 短影音腳本',
};

export default function CreatePanel({
  result, resultType, processing,
  generateSocial, generateImage, generatePodcast, generateVideo,
  copyResult,
}: CreatePanelProps) {
  const busy = !!processing;
  const noContent = !result;

  if (noContent && !busy) {
    return (
      <div className="py-10 text-center text-muted">
        <p className="mb-2 text-4xl">🎨</p>
        <p className="text-sm">先去「素材庫」選擇素材，點「找觀點」開始創作</p>
      </div>
    );
  }

  return (
    <>
      {/* Result display */}
      {result && (
        <div className="mb-5">
          <p className="mb-2 text-xs text-muted">{RESULT_LABELS[resultType] || ''}</p>
          <div className="card max-h-72 overflow-auto whitespace-pre-wrap text-sm leading-relaxed">
            {result}
          </div>
          <button
            onClick={copyResult}
            className="btn-secondary mt-2 px-3 py-1.5 text-xs"
            aria-label="複製結果到剪貼簿"
          >
            📋 複製
          </button>
        </div>
      )}

      {/* Generation options */}
      <p className="mb-3 text-xs text-light">從觀點生成...</p>

      {/* Social */}
      <Section label="📱 社群文案">
        {SOCIAL_PLATFORMS.map(p => (
          <OptionButton key={p.id} label={p.label} disabled={busy || noContent} onClick={() => generateSocial(p.id)} />
        ))}
      </Section>

      {/* Image */}
      <Section label="🖼️ 圖片 Prompt（Midjourney / DALL-E）">
        <OptionButton label="生成圖片 Prompt" disabled={busy || noContent} onClick={generateImage} />
      </Section>

      {/* Podcast */}
      <Section label="🎙️ 播客腳本">
        {PODCAST_DURATIONS.map(d => (
          <OptionButton key={d} label={`${d} 分鐘`} disabled={busy || noContent} onClick={() => generatePodcast(d)} />
        ))}
      </Section>

      {/* Short video */}
      <Section label="🎬 短影音腳本">
        {VIDEO_OPTIONS.map(v => (
          <OptionButton key={v.label} label={v.label} disabled={busy || noContent} onClick={() => generateVideo(v.platform, v.duration)} />
        ))}
      </Section>
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-xs text-light">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function OptionButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled} className="btn-secondary px-3 py-1.5 text-xs">
      {label}
    </button>
  );
}
