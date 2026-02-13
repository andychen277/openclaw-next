'use client';

import { useState, useEffect } from 'react';
import type { SocialAuthStatus } from '@/lib/types';

export function useSocialAuth() {
  const [authStatus, setAuthStatus] = useState<SocialAuthStatus>({
    facebook: false,
    instagram: false,
    threads: false,
    twitter: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/social/status');
        if (res.ok) {
          const data = await res.json();
          setAuthStatus(data);
        }
      } catch (error) {
        console.error('Failed to check auth status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  const authenticate = (platform: string) => {
    window.location.href = `/api/auth/${platform}`;
  };

  const logout = async (platform: string) => {
    // TODO: 實作 logout endpoint
    document.cookie = `${platform}_token=; Max-Age=0; path=/;`;
    setAuthStatus(prev => ({ ...prev, [platform]: false }));
  };

  return { authStatus, loading, authenticate, logout };
}
