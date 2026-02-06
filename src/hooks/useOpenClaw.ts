'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '@/lib/constants';
import { detectPriority } from '@/lib/priority';
import type { Output, TasksData, BackendStatus, TabType, ResultType } from '@/lib/types';

async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `請求失敗 (${res.status})`);
  }
  return res.json();
}

export function useOpenClaw() {
  const [tab, setTab] = useState<TabType>('tasks');
  const [tasks, setTasks] = useState<TasksData>({ todo: [], in_progress: [], done: [] });
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [geniusItems, setGeniusItems] = useState<Output[]>([]);
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>([]);
  const [selectedGenius, setSelectedGenius] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState('');
  const [result, setResult] = useState('');
  const [resultType, setResultType] = useState<ResultType>('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<BackendStatus>({ status: 'Idle' });

  const fetchTasks = useCallback(async () => {
    try {
      setTasks(await api(`/data/tasks.json?t=${Date.now()}`));
    } catch { /* silent */ }
  }, []);

  const fetchOutputs = useCallback(async () => {
    try {
      const data = await api('/list_outputs');
      setOutputs(data.outputs || []);
    } catch { /* silent */ }
  }, []);

  const fetchGenius = useCallback(async () => {
    try {
      const data = await api('/list_genius');
      setGeniusItems(data.items || []);
    } catch { /* silent */ }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      setStatus(await api(`/data/status.json?t=${Date.now()}`));
    } catch { /* silent */ }
  }, []);

  // Polling — pauses when page is hidden
  useEffect(() => {
    fetchTasks();
    fetchOutputs();
    fetchGenius();
    fetchStatus();

    const poll = () => {
      if (document.hidden) return;
      fetchTasks();
      fetchStatus();
      if (tab === 'outputs') fetchOutputs();
      if (tab === 'genius') fetchGenius();
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [fetchTasks, fetchOutputs, fetchGenius, fetchStatus, tab]);

  // --- Actions ---

  const addTask = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setLoading(true);
    setError('');
    try {
      await api('/add_task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: text, task_type: 'auto', priority: detectPriority(text) }),
      });
      setInput('');
      await fetchTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : '無法連接伺服器');
    } finally {
      setLoading(false);
    }
  }, [input, fetchTasks]);

  const toggleOutput = useCallback((f: string) => {
    setSelectedOutputs(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }, []);

  const toggleGenius = useCallback((f: string) => {
    setSelectedGenius(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }, []);

  const mergeOutputs = useCallback(async () => {
    if (selectedOutputs.length < 1) { setError('請選擇至少一個素材'); return; }
    setProcessing('Spark 正在找觀點...');
    setError('');
    setResult('');
    try {
      const data = await api('/merge_outputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filenames: selectedOutputs, prompt: '請分析這些素材，找出有趣的觀點或故事角度' }),
      });
      setResult(data.content);
      setResultType('merge');
      setTab('create');
      fetchOutputs();
      fetchGenius();
    } catch (e) {
      setError(e instanceof Error ? e.message : '合併失敗');
    } finally {
      setProcessing('');
    }
  }, [selectedOutputs, fetchOutputs, fetchGenius]);

  const generateSocial = useCallback(async (platform: string) => {
    if (!result) { setError('請先產生觀點內容'); return; }
    setProcessing('Quill 正在寫文案...');
    setError('');
    try {
      const data = await api('/generate_social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: result, platform, tone: '專業但有個人觀點' }),
      });
      setResult(data.content);
      setResultType('social');
      fetchGenius();
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成文案失敗');
    } finally {
      setProcessing('');
    }
  }, [result, fetchGenius]);

  const generateImage = useCallback(async () => {
    if (!result) { setError('請先產生觀點內容'); return; }
    setProcessing('Pixel 正在構思畫面...');
    setError('');
    try {
      const data = await api('/generate_image_prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: result, style: '現代簡約', aspect: '1:1' }),
      });
      setResult(data.content);
      setResultType('image');
      fetchGenius();
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成圖片 Prompt 失敗');
    } finally {
      setProcessing('');
    }
  }, [result, fetchGenius]);

  const generatePodcast = useCallback(async (duration: string) => {
    if (!result) { setError('請先產生觀點內容'); return; }
    setProcessing('正在寫播客腳本...');
    setError('');
    try {
      const data = await api('/generate_podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: result, duration, style: '輕鬆對談' }),
      });
      setResult(data.content);
      setResultType('podcast');
      fetchGenius();
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成播客腳本失敗');
    } finally {
      setProcessing('');
    }
  }, [result, fetchGenius]);

  const generateVideo = useCallback(async (platform: string, duration: string) => {
    if (!result) { setError('請先產生觀點內容'); return; }
    setProcessing('正在寫短影音腳本...');
    setError('');
    try {
      const data = await api('/generate_short_video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: result, platform, duration }),
      });
      setResult(data.content);
      setResultType('video');
      fetchGenius();
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成短影音腳本失敗');
    } finally {
      setProcessing('');
    }
  }, [result, fetchGenius]);

  const copyResult = useCallback(() => {
    if (result) navigator.clipboard.writeText(result);
  }, [result]);

  return {
    tab, setTab,
    tasks, outputs, geniusItems,
    selectedOutputs, selectedGenius,
    input, setInput,
    loading, processing, result, resultType, error,
    status,
    addTask, toggleOutput, toggleGenius,
    mergeOutputs, generateSocial, generateImage, generatePodcast, generateVideo,
    copyResult,
  };
}
