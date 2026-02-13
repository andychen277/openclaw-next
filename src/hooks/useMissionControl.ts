'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '@/lib/constants';
import { detectPriority } from '@/lib/priority';
import type {
  Output,
  TasksData,
  BackendStatus,
  ResultType,
  Agent,
  AgentMetrics,
  Task
} from '@/lib/types';

// Unified API helper
async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `請求失敗 (${res.status})`);
  }
  return res.json();
}

export type PanelType = 'agents' | 'tasks' | 'content' | 'create';

export function useMissionControl() {
  // Agent state (from useAgentStatus)
  const [agents, setAgents] = useState<Agent[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics>({
    totalTasks: 0,
    activeTasks: 0,
    systemLoad: 0,
    avgResponseTime: 0,
  });

  // Task state (from useOpenClaw)
  const [tasks, setTasks] = useState<TasksData>({ todo: [], in_progress: [], done: [] });

  // Content state (from useOpenClaw)
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [geniusItems, setGeniusItems] = useState<Output[]>([]);
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>([]);
  const [selectedGenius, setSelectedGenius] = useState<string[]>([]);

  // Creation state (from useOpenClaw)
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [resultType, setResultType] = useState<ResultType>('');

  // UI state (new for Mission Control)
  const [activePanel, setActivePanel] = useState<PanelType>('tasks');

  // Meta state
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<BackendStatus>({ status: 'Idle' });

  // --- Data Fetching Functions ---

  const fetchAgents = useCallback(async () => {
    try {
      const data = await fetch('/api/agents/status').then(r => r.json());
      setAgents(data.agents || []);
      setMetrics(data.metrics || {
        totalTasks: 0,
        activeTasks: 0,
        systemLoad: 0,
        avgResponseTime: 0,
      });
    } catch { /* silent */ }
  }, []);

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

  // Unified polling - all data sources
  useEffect(() => {
    // Initial fetch
    fetchAgents();
    fetchTasks();
    fetchOutputs();
    fetchGenius();
    fetchStatus();

    const poll = () => {
      if (document.hidden) return;
      fetchAgents();
      fetchTasks();
      fetchOutputs();
      fetchGenius();
      fetchStatus();
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [fetchAgents, fetchTasks, fetchOutputs, fetchGenius, fetchStatus]);

  // --- Task Actions ---

  const addTask = useCallback(async (
    taskText?: string,
    agentId?: string,
    priority?: 'high' | 'medium' | 'low'
  ) => {
    const text = (taskText || input).trim();
    if (!text) return;
    setLoading(true);
    setError('');
    try {
      await api('/add_task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: text,
          task_type: agentId || 'auto',
          priority: priority || detectPriority(text),
          frontendStatus: 'todo',  // 新任務預設進 Todo
        }),
      });
      setInput('');
      await fetchTasks();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '無法連接伺服器';
      setError(msg);
      throw new Error(msg);  // 重新拋出讓 Modal 知道失敗
    } finally {
      setLoading(false);
    }
  }, [input, fetchTasks]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      // Update local state immediately for better UX
      setTasks(prev => {
        const updateTaskInList = (taskList: Task[]) =>
          taskList.map(t => t.id === taskId ? { ...t, ...updates } : t);

        return {
          todo: updateTaskInList(prev.todo),
          in_progress: updateTaskInList(prev.in_progress),
          done: updateTaskInList(prev.done),
        };
      });

      // In a real implementation, you would call an API endpoint here
      // await api(`/tasks/${taskId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updates),
      // });

      // For now, just refresh to get server state
      await fetchTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新任務失敗');
      await fetchTasks(); // Revert on error
    }
  }, [fetchTasks]);

  // --- Content Actions ---

  const toggleOutput = useCallback((f: string) => {
    setSelectedOutputs(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }, []);

  const toggleGenius = useCallback((f: string) => {
    setSelectedGenius(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }, []);

  const mergeOutputs = useCallback(async () => {
    if (selectedOutputs.length < 1) {
      setError('請選擇至少一個素材');
      return;
    }
    setProcessing('Spark 正在找觀點...');
    setError('');
    setResult('');
    try {
      const data = await api('/merge_outputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filenames: selectedOutputs,
          prompt: '請分析這些素材，找出有趣的觀點或故事角度'
        }),
      });
      setResult(data.content);
      setResultType('merge');
      setActivePanel('create');
      await Promise.all([fetchOutputs(), fetchGenius()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '合併失敗');
    } finally {
      setProcessing('');
    }
  }, [selectedOutputs, fetchOutputs, fetchGenius]);

  // --- Creation Actions ---

  const generateSocial = useCallback(async (platform: string) => {
    if (!result) {
      setError('請先產生觀點內容');
      return;
    }
    setProcessing('Quill 正在寫文案...');
    setError('');
    try {
      const data = await api('/generate_social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: result,
          platform,
          tone: '專業但有個人觀點'
        }),
      });
      setResult(data.content);
      setResultType('social');
      await fetchGenius();
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成文案失敗');
    } finally {
      setProcessing('');
    }
  }, [result, fetchGenius]);

  const generateImage = useCallback(async () => {
    if (!result) {
      setError('請先產生觀點內容');
      return;
    }
    setProcessing('Pixel 正在構思畫面...');
    setError('');
    try {
      const data = await api('/generate_image_prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: result,
          style: '現代簡約',
          aspect: '1:1'
        }),
      });
      setResult(data.content);
      setResultType('image');
      await fetchGenius();
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成圖片 Prompt 失敗');
    } finally {
      setProcessing('');
    }
  }, [result, fetchGenius]);

  const generatePodcast = useCallback(async (duration: string) => {
    if (!result) {
      setError('請先產生觀點內容');
      return;
    }
    setProcessing('正在寫播客腳本...');
    setError('');
    try {
      const data = await api('/generate_podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: result,
          duration,
          style: '輕鬆對談'
        }),
      });
      setResult(data.content);
      setResultType('podcast');
      await fetchGenius();
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成播客腳本失敗');
    } finally {
      setProcessing('');
    }
  }, [result, fetchGenius]);

  const generateVideo = useCallback(async (platform: string, duration: string) => {
    if (!result) {
      setError('請先產生觀點內容');
      return;
    }
    setProcessing('正在寫短影音腳本...');
    setError('');
    try {
      const data = await api('/generate_short_video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: result,
          platform,
          duration
        }),
      });
      setResult(data.content);
      setResultType('video');
      await fetchGenius();
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成短影音腳本失敗');
    } finally {
      setProcessing('');
    }
  }, [result, fetchGenius]);

  // --- Utility Actions ---

  const copyResult = useCallback(() => {
    if (result) navigator.clipboard.writeText(result);
  }, [result]);

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchAgents(),
      fetchTasks(),
      fetchOutputs(),
      fetchGenius(),
      fetchStatus(),
    ]);
  }, [fetchAgents, fetchTasks, fetchOutputs, fetchGenius, fetchStatus]);

  return {
    // Agent data
    agents,
    metrics,

    // Task data
    tasks,

    // Content data
    outputs,
    geniusItems,
    selectedOutputs,
    selectedGenius,

    // Creation data
    input,
    setInput,
    result,
    resultType,

    // UI state
    activePanel,
    setActivePanel,

    // Meta state
    loading,
    processing,
    error,
    status,

    // Task actions
    addTask,
    updateTask,

    // Content actions
    toggleOutput,
    toggleGenius,
    mergeOutputs,

    // Creation actions
    generateSocial,
    generateImage,
    generatePodcast,
    generateVideo,

    // Utility actions
    copyResult,
    refresh,
  };
}
