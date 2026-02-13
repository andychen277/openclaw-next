import { NextResponse } from 'next/server';
import { kvGet, kvSet } from '@/lib/kv';
import type { TasksData } from '@/lib/types';

const GATEWAY_KEY = 'openclaw:gateway_state';

interface GatewayState {
  tasks: TasksData;
  updatedAt: number;
}

// GET: Return Gateway task state + whether bridge is active
export async function GET() {
  const state = await kvGet<GatewayState>(GATEWAY_KEY);
  if (!state) {
    return NextResponse.json({ tasks: null, active: false });
  }

  // Bridge is considered active if data was updated within last 60 seconds
  const active = (Date.now() - state.updatedAt) < 60000;

  return NextResponse.json({
    tasks: state.tasks,
    active,
    updatedAt: state.updatedAt,
  });
}

// POST: Receive full task state from Gateway (via bridge script)
export async function POST(req: Request) {
  const token = process.env.GATEWAY_SYNC_TOKEN;
  if (token) {
    const auth = req.headers.get('Authorization');
    if (auth !== `Bearer ${token}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const data = await req.json() as TasksData;

    if (!data.todo && !data.in_progress && !data.done) {
      return NextResponse.json({ error: 'Invalid task data' }, { status: 400 });
    }

    await kvSet<GatewayState>(GATEWAY_KEY, {
      tasks: {
        todo: data.todo || [],
        in_progress: data.in_progress || [],
        done: data.done || [],
      },
      updatedAt: Date.now(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
