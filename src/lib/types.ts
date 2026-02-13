export interface Task {
  id: string;
  task: string;
  task_type: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  timestamp?: string;
}

export interface Output {
  filename: string;
  size: number;
  modified: string;
  type?: string;
}

export interface TasksData {
  todo: Task[];
  in_progress: Task[];
  done: Task[];
}

export interface BackendStatus {
  status: string;
}

export type TabType = 'tasks' | 'outputs' | 'genius' | 'create' | 'dashboard';
export type ResultType = 'merge' | 'social' | 'image' | 'podcast' | 'video' | '';

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  label: string;
  status: 'idle' | 'working' | 'thinking' | 'error';
  workspace: string;
  model: string;
  currentTask?: string;
  stats: {
    completedTasks: number;
    failedTasks: number;
    averageResponseTime: number;
    uptime: number;
  };
}

export interface AgentMetrics {
  totalTasks: number;
  activeTasks: number;
  systemLoad: number;
  avgResponseTime: number;
}

export type SocialPlatform = 'facebook' | 'instagram' | 'threads' | 'twitter';

export interface SocialAuthStatus {
  [platform: string]: boolean;
}
