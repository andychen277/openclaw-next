import { NextResponse } from 'next/server';
import type { Task } from '@/lib/types';

// Server-side task store (in-memory)
// Persists within warm Lambda instances. For production, use Vercel KV or database.
declare global {
  var __openclawServerTasks: Task[] | undefined;
}

function getStore(): Task[] {
  if (!global.__openclawServerTasks) global.__openclawServerTasks = [];
  return global.__openclawServerTasks;
}

// GET: Read all server-side tasks (from Telegram, etc.)
export async function GET() {
  return NextResponse.json({ tasks: getStore() });
}

// POST: Add a new task
export async function POST(req: Request) {
  try {
    const task = await req.json() as Task;
    if (!task.id || !task.task) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    getStore().push(task);
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
      global.__openclawServerTasks = getStore().filter(t => !ids.includes(t.id));
    } else {
      global.__openclawServerTasks = [];
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
