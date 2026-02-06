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

export type TabType = 'tasks' | 'outputs' | 'genius' | 'create';
export type ResultType = 'merge' | 'social' | 'image' | 'podcast' | 'video' | '';
