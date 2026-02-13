'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

// Unified API helper with timeout
async function api(path: string, options?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
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

  // Task state
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

  // Bridge active flag - when Gateway Bridge is running, skip direct Gateway polling
  const bridgeActive = useRef(false);

  // --- Data Fetching Functions ---

  const fetchAgents = useCallback(async () => {
    try {
      const data = await fetch('/api/agents/status').then(r => r.json());
      setAgents(data.agents || []);
    } catch { /* silent */ }
  }, []);

  // Poll Gateway via Bridge (Vercel ← Bridge ← Gateway)
  const fetchGatewaySync = useCallback(async () => {
    try {
      const data = await fetch('/api/gateway/sync').then(r => r.json());
      if (data.active) {
        if (data.tasks) {
          setTasks(data.tasks);
          saveLocalTasks(data.tasks);
        }
        if (data.outputs) {
          setOutputs(data.outputs);
        }
        setGatewayConnected(true);
        bridgeActive.current = true;
        return;
      }
    } catch { /* silent */ }
    bridgeActive.current = false;
  }, []);

  // Direct Gateway polling (only when bridge is NOT active)
  const fetchTasks = useCallback(async () => {
    if (bridgeActive.current) return;
    try {
      const data = await api(`/data/tasks.json?t=${Date.now()}`);
      setTasks(data);
      saveLocalTasks(data);
      setGatewayConnected(true);
    } catch {
      setGatewayConnected(false);
    }
  }, []);

  // Fetch server-side tasks from Telegram (only when bridge is NOT active)
  const fetchServerTasks = useCallback(async () => {
    if (bridgeActive.current) return;
    try {
      const data = await fetch('/api/tasks').then(r => r.json());
      if (data.tasks?.length > 0) {
        setTasks(prev => {
          const serverTasks = data.tasks as Task[];
          const updated = {
            todo: [...prev.todo],
            in_progress: [...prev.in_progress],
            done: [...prev.done],
          };

          let changed = false;

          for (const sTask of serverTasks) {
            // Find if task already exists in ANY column
            let found = false;
            for (const col of ['todo', 'in_progress', 'done'] as const) {
              const idx = updated[col].findIndex(t => t.id === sTask.id);
              if (idx !== -1) {
                found = true;
                // If status or frontendStatus changed, move it
                const currentTask = updated[col][idx];
                const newStatus = sTask.status || 'todo';
                const newFrontendStatus = sTask.frontendStatus || (newStatus === 'done' ? 'done' : newStatus === 'in_progress' ? 'ongoing' : 'todo');

                if (currentTask.status !== newStatus || currentTask.frontendStatus !== newFrontendStatus) {
                  // Remove from current col
                  updated[col].splice(idx, 1);
                  // Add to new col
                  const targetCol = newStatus === 'done' ? 'done' : (newStatus === 'in_progress' ? 'in_progress' : 'todo');
                  updated[targetCol as keyof typeof updated].push({
                    ...currentTask,
                    ...sTask,
                    frontendStatus: newFrontendStatus
                  });
                  changed = true;
                }
                break;
              }
            }

            if (!found) {
              // Add as new task
              const backendStatus = sTask.status || 'todo';
              if (backendStatus === 'in_progress') {
                updated.in_progress.push(sTask);
              } else if (backendStatus === 'done') {
                updated.done.push(sTask);
              } else {
                updated.todo.push(sTask);
              }
              changed = true;
            }
          }

          if (!changed) return prev;
          saveLocalTasks(updated);
          return updated;
        });
      }
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

  // Unified polling
  useEffect(() => {
    fetchAgents();
    fetchGatewaySync();
    fetchTasks();
    fetchServerTasks();
    fetchOutputs();
    fetchGenius();
    fetchStatus();

    const poll = () => {
      if (document.hidden) return;
      fetchAgents();
      fetchGatewaySync();
      fetchTasks();
      fetchServerTasks();
      fetchOutputs();
      fetchGenius();
      fetchStatus();
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [fetchAgents, fetchGatewaySync, fetchTasks, fetchServerTasks, fetchOutputs, fetchGenius, fetchStatus]);

  // --- Task Actions ---

  const addTask = useCallback(async (
    taskText?: string,
    agentId?: string,
    priority?: 'high' | 'medium' | 'low',
    frontendStatus?: 'backlog' | 'todo'
  ) => {
    const text = (taskText || input).trim();
    if (!text) return;
    setLoading(true);
    setError('');

    const taskPriority = priority || detectPriority(text);
    const taskType = agentId || 'auto';
    const destStatus = frontendStatus || 'todo';

    try {
      // Try Gateway first
      await api('/add_task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: text,
          task_type: taskType,
          priority: taskPriority,
          frontendStatus: destStatus,
        }),
      });
      setInput('');
      setGatewayConnected(true);
      await fetchTasks();
    } catch {
      // Gateway unavailable - save locally + to server
      const newTask: Task = {
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        task: text,
        task_type: taskType,
        priority: taskPriority,
        status: 'todo',
        frontendStatus: destStatus,
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

      // Also save to server so other devices and Telegram can see it
      fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      }).catch(() => { });

      setInput('');
      setGatewayConnected(false);
    } finally {
      setLoading(false);
    }
  }, [input, fetchTasks]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    // Notify Telegram when task moves to done
    if (updates.frontendStatus === 'done') {
      const allTasks = [...tasks.todo, ...tasks.in_progress, ...tasks.done];
      const task = allTasks.find(t => t.id === taskId);
      if (task) {
        fetch('/api/telegram/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: task.task, status: 'done', agent: task.task_type }),
        }).catch(() => { });
      }
    }

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
  }, [fetchTasks, tasks]);

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
      fetchAgents(), fetchGatewaySync(), fetchTasks(), fetchServerTasks(), fetchOutputs(), fetchGenius(), fetchStatus(),
    ]);
  }, [fetchAgents, fetchGatewaySync, fetchTasks, fetchServerTasks, fetchOutputs, fetchGenius, fetchStatus]);

  // Computed metrics from real task data
  const metrics: AgentMetrics = {
    totalTasks: tasks.todo.length + tasks.in_progress.length + tasks.done.length,
    activeTasks: tasks.in_progress.length,
    systemLoad: 0,
    avgResponseTime: 0,
  };

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
