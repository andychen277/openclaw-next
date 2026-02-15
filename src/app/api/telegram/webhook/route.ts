import { NextResponse } from 'next/server';
import { sendTelegramMessage, formatNewTaskNotification } from '@/lib/telegram';
import { detectPriority } from '@/lib/priority';
import { kvGet, kvSet } from '@/lib/kv';
import type { Task } from '@/lib/types';

const TASKS_KEY = 'openclaw:tasks';

async function saveTask(task: Task) {
  const tasks = (await kvGet<Task[]>(TASKS_KEY)) ?? [];
  if (!tasks.some(t => t.id === task.id)) {
    tasks.push(task);
    await kvSet(TASKS_KEY, tasks);
  }
}

async function getAllTasks(): Promise<Task[]> {
  return (await kvGet<Task[]>(TASKS_KEY)) ?? [];
}

export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const header = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (header !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const update = await req.json();
    const message = update.message;

    if (!message?.text) {
      return NextResponse.json({ ok: true });
    }

    const text = message.text.trim();
    const chatId = message.chat.id.toString();

    // /task <description> - Create task in todo
    if (text.startsWith('/task ')) {
      const taskText = text.slice(6).trim();
      if (!taskText) {
        await sendTelegramMessage('Please provide task description\nUsage: /task <description>', chatId);
        return NextResponse.json({ ok: true });
      }

      const priority = detectPriority(taskText);
      const task: Task = {
        id: `tg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        task: taskText,
        task_type: 'auto',
        priority,
        status: 'todo',
        frontendStatus: 'todo',
        timestamp: new Date().toISOString(),
      };

      await saveTask(task);
      await sendTelegramMessage(
        formatNewTaskNotification(taskText, priority, 'Auto', 'todo'),
        chatId
      );
      return NextResponse.json({ ok: true });
    }

    // /backlog <description> - Create task in backlog
    if (text.startsWith('/backlog ')) {
      const taskText = text.slice(9).trim();
      if (!taskText) {
        await sendTelegramMessage('Please provide task description\nUsage: /backlog <description>', chatId);
        return NextResponse.json({ ok: true });
      }

      const priority = detectPriority(taskText);
      const task: Task = {
        id: `tg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        task: taskText,
        task_type: 'auto',
        priority,
        status: 'todo',
        frontendStatus: 'backlog',
        timestamp: new Date().toISOString(),
      };

      await saveTask(task);
      await sendTelegramMessage(`Added to backlog: ${taskText}`, chatId);
      return NextResponse.json({ ok: true });
    }

    // /status - Get task counts
    if (text === '/status') {
      const tasks = await getAllTasks();

      const backlog = tasks.filter(t => t.frontendStatus === 'backlog').length;
      const todo = tasks.filter(t => t.frontendStatus === 'todo').length;
      const ongoing = tasks.filter(t => t.frontendStatus === 'ongoing').length;
      const review = tasks.filter(t => t.frontendStatus === 'review').length;
      const done = tasks.filter(t => t.frontendStatus === 'done').length;

      let msg = '<b>OpenClaw Status</b>\n\n';
      msg += `Backlog: ${backlog}\n`;
      msg += `Todo: ${todo}\n`;
      msg += `Ongoing: ${ongoing}\n`;
      msg += `Review: ${review}\n`;
      msg += `Done: ${done}\n`;
      msg += `\nTotal: ${tasks.length}`;

      await sendTelegramMessage(msg, chatId);
      return NextResponse.json({ ok: true });
    }

    // /help or /start
    if (text === '/help' || text === '/start') {
      let msg = '<b>OpenClaw Bot</b>\n\n';
      msg += 'Commands:\n';
      msg += '/task &lt;desc&gt; - Add task to todo\n';
      msg += '/backlog &lt;desc&gt; - Add idea to backlog\n';
      msg += '/status - View task status\n';
      msg += '/help - Show this help\n';
      msg += '\nPlain text also creates a task';

      await sendTelegramMessage(msg, chatId);
      return NextResponse.json({ ok: true });
    }

    // Unknown command
    if (text.startsWith('/')) {
      await sendTelegramMessage('Unknown command. Use /help to see available commands.', chatId);
    } else {
      // Non-command text - create as task
      const priority = detectPriority(text);
      const task: Task = {
        id: `tg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        task: text,
        task_type: 'auto',
        priority,
        status: 'todo',
        frontendStatus: 'todo',
        timestamp: new Date().toISOString(),
      };

      await saveTask(task);
      // Removed: await sendTelegramMessage(`Task created: ${text}`, chatId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
