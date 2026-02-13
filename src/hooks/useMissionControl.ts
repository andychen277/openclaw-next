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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `請求失敗 (${res.status})`);
    }
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// --- localStorage helpers ---
const LOCAL_TASKS_KEY = 'openclaw_tasks';

function saveLocalTasks(tasks: TasksData) {
  try {
    localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
  } catch { /* quota exceeded */ }
}

function loadLocalTasks(): TasksData {
  try {
    const data = localStorage.getItem(LOCAL_TASKS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.todo && parsed.in_progress && parsed.done) return parsed;
    }
  } catch { /* parse error */ }
  return { todo: [], in_progress: [], done: [] };
}

export type PanelType = 'agents' | 'tasks' | 'content' | 'create';

export function useMissionControl() {
  // Agent state
  const [agents, setAgents] = useState<Agent[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics>({
    totalTasks: 0,
    activeTasks: 0,
    systemLoad: 0,
    avgResponseTime: 0,
  });

  // Task state - initialize from localStorage
  const [tasks, setTasks] = useState<TasksData>({ todo: [], in_progress: [], done: [] });
  const [gatewayConnected, setGatewayConnected] = useState<boolean | null>(null);

  // Content state
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [geniusItems, setGeniusItems] = useState<Output[]>([]);
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>([]);
  const [selectedGenius, setSelectedGenius] = useState<string[]>([]);

  // Creation state
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [resultType, setResultType] = useState<ResultType>('');

  // UI state
  const [activePanel, setActivePanel] = useState<PanelType>('tasks');

  // Meta state
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<BackendStatus>({ status: 'Idle' });

  // Load localStorage tasks on mount
  useEffect(() => {
    setTasks(loadLocalTasks());
  }, []);

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
      const data = await api(`/data/tasks.json?t=${Date.now()}`);
      setTasks(data);
      saveLocalTasks(data);
      setGatewayConnected(true);
    } catch {
      setGatewayConnected(false);
      // Keep current tasks (from localStorage or previous state)
    }
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

  // Unified polling
  useEffect(() => {
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

    const taskPriority = priority || detectPriority(text);
    const taskType = agentId || 'auto';

    try {
      // Try Gateway first
      await api('/add_task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: text,
          task_type: taskType,
          priority: taskPriority,
          frontendStatus: 'todo',
        }),
      });
      setInput('');
      setGatewayConnected(true);
      await fetchTasks();
    } catch {
      // Gateway unavailable - save locally
      const newTask: Task = {
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        task: text,
        task_type: taskType,
        priority: taskPriority,
        status: 'todo',
        frontendStatus: 'todo',
        timestamp: new Date().toISOString(),
      };

      setTasks(prev => {
        const updated = {
          ...prev,
          todo: [...prev.todo, newTask],
        };
        saveLocalTasks(updated);
        return updated;
      });

      setInput('');
      setGatewayConnected(false);
      // Don't throw - task was saved locally
    } finally {
      setLoading(false);
    }
  }, [input, fetchTasks]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    // Update local state immediately
    setTasks(prev => {
      const updateTaskInList = (taskList: Task[]) =>
        taskList.map(t => t.id === taskId ? { ...t, ...updates } : t);

      const updated = {
        todo: updateTaskInList(prev.todo),
        in_progress: updateTaskInList(prev.in_progress),
        done: updateTaskInList(prev.done),
      };
      saveLocalTasks(updated);
      return updated;
    });

    // Try to sync with Gateway
    try {
      await fetchTasks();
    } catch { /* keep local state */ }
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
      await fetchGenius();
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
      await fetchGenius();
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
      await fetchGenius();
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
      await fetchGenius();
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成短影音腳本失敗');
    } finally {
      setProcessing('');
    }
  }, [result, fetchGenius]);

  const copyResult = useCallback(() => {
    if (result) navigator.clipboard.writeText(result);
  }, [result]);

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchAgents(), fetchTasks(), fetchOutputs(), fetchGenius(), fetchStatus(),
    ]);
  }, [fetchAgents, fetchTasks, fetchOutputs, fetchGenius, fetchStatus]);

  return {
    agents, metrics,
    tasks,
    gatewayConnected,
    outputs, geniusItems, selectedOutputs, selectedGenius,
    input, setInput, result, resultType,
    activePanel, setActivePanel,
    loading, processing, error, status,
    addTask, updateTask,
    toggleOutput, toggleGenius, mergeOutputs,
    generateSocial, generateImage, generatePodcast, generateVideo,
    copyResult, refresh,
  };
}
