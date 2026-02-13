'use client';

import { useState } from 'react';
import { useSocialAuth } from '@/hooks/useSocialAuth';
import { useSocialShare } from '@/hooks/useSocialShare';
import PlatformButton from './PlatformButton';

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', icon: '📘' },
  { id: 'instagram', label: 'Instagram', icon: '📷' },
  { id: 'threads', label: 'Threads', icon: '🧵' },
  { id: 'twitter', label: 'X', icon: '𝕏' },
];

interface SocialSharePanelProps {
  content: string;
  onSuccess?: () => void;
}

export default function SocialSharePanel({ content, onSuccess }: SocialSharePanelProps) {
  const { authStatus, loading: authLoading, authenticate } = useSocialAuth();
  const { shareToSocial, isPosting, error: shareError } = useSocialShare();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const handleShare = async () => {
    if (selectedPlatforms.length === 0 || !content) return;

    try {
      const results = await shareToSocial({
        platforms: selectedPlatforms,
        content,
      });

      const successCount = results.filter((r: any) => r.success).length;
      if (successCount > 0) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  if (authLoading) {
    return (
      <div className="card">
        <p className="text-muted text-sm">載入中...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 text-text">分享到社群媒體</h3>

      {/* 平台選擇 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {PLATFORMS.map(platform => (
          <PlatformButton
            key={platform.id}
            platform={platform}
            isAuthenticated={authStatus[platform.id]}
            isSelected={selectedPlatforms.includes(platform.id)}
            onToggle={() => togglePlatform(platform.id)}
            onAuth={() => authenticate(platform.id)}
          />
        ))}
      </div>

      {/* 發文按鈕 */}
      <button
        onClick={handleShare}
        disabled={selectedPlatforms.length === 0 || isPosting || !content}
        className={`btn-primary w-full ${
          selectedPlatforms.length === 0 || isPosting || !content
            ? 'opacity-50 cursor-not-allowed'
            : ''
        }`}
      >
        {isPosting ? '發送中...' : `發布到 ${selectedPlatforms.length} 個平台`}
      </button>

      {/* 狀態訊息 */}
      {shareError && (
        <p className="mt-3 text-sm text-danger">❌ {shareError}</p>
      )}
      {success && (
        <p className="mt-3 text-sm text-success">✅ 發布成功！</p>
      )}

      {!content && (
        <p className="mt-3 text-sm text-muted">請先生成內容再分享</p>
      )}
    </div>
  );
}
