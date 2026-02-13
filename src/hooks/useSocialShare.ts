'use client';

import { useState } from 'react';

interface ShareOptions {
  platforms: string[];
  content: string;
  media?: string[];
}

export function useSocialShare() {
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareToSocial = async (options: ShareOptions) => {
    setIsPosting(true);
    setError(null);

    try {
      const response = await fetch('/api/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error('Failed to post to social media');
      }

      const data = await response.json();
      return data.results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsPosting(false);
    }
  };

  return { shareToSocial, isPosting, error };
}
