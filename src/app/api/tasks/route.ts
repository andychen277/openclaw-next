import { NextResponse } from 'next/server';
import { kvGet, kvSet } from '@/lib/kv';
import type { Task } from '@/lib/types';

const TASKS_KEY = 'openclaw:tasks';

async function getTasks(): Promise<Task[]> {
  return (await kvGet<Task[]>(TASKS_KEY)) ?? [];
}

async function saveTasks(tasks: Task[]): Promise<void> {
  await kvSet(TASKS_KEY, tasks);
}

// GET: Read all server-side tasks
export async function GET() {
  const tasks = await getTasks();
  return NextResponse.json({ tasks });
}

// POST: Add a new task
export async function POST(req: Request) {
  try {
    const task = await req.json() as Task;
    if (!task.id || !task.task) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const tasks = await getTasks();
    // Avoid duplicates
    if (!tasks.some(t => t.id === task.id)) {
      tasks.push(task);
      await saveTasks(tasks);
    }
    return NextResponse.json({ ok: true, task });
  } catch {
    return NextResponse.json({ error: 'Failed to add task' }, { status: 500 });
  }
}

// DELETE: Remove synced tasks
export async function DELETE(req: Request) {
  try {
    const { ids } = await req.json();
    if (Array.isArray(ids)) {
      const tasks = await getTasks();
      await saveTasks(tasks.filter(t => !ids.includes(t.id)));
    } else {
      await saveTasks([]);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
