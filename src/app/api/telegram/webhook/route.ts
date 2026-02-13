import { NextResponse } from 'next/server';
import { sendTelegramMessage, formatNewTaskNotification } from '@/lib/telegram';
import { detectPriority } from '@/lib/priority';
import type { Task } from '@/lib/types';

// Telegram Bot Webhook Handler
// Commands: /task, /backlog, /status, /help

export async function POST(req: Request) {
  // Verify webhook secret
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
        await sendTelegramMessage('⚠️ 請提供任務描述\n用法: /task <任務描述>', chatId);
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

      // Save to server-side store
      const baseUrl = getBaseUrl();
      await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      }).catch(() => {});

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
        await sendTelegramMessage('⚠️ 請提供任務描述\n用法: /backlog <任務描述>', chatId);
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

      const baseUrl = getBaseUrl();
      await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      }).catch(() => {});

      await sendTelegramMessage(`💡 已加入想法暫存: ${taskText}`, chatId);
      return NextResponse.json({ ok: true });
    }

    // /status - Get task counts
    if (text === '/status') {
      const baseUrl = getBaseUrl();
      let tasks: Task[] = [];
      try {
        const res = await fetch(`${baseUrl}/api/tasks`);
        const data = await res.json();
        tasks = data.tasks || [];
      } catch { /* empty */ }

      const backlog = tasks.filter(t => t.frontendStatus === 'backlog').length;
      const todo = tasks.filter(t => t.frontendStatus === 'todo').length;
      const ongoing = tasks.filter(t => t.frontendStatus === 'ongoing').length;
      const review = tasks.filter(t => t.frontendStatus === 'review').length;
      const done = tasks.filter(t => t.frontendStatus === 'done').length;

      let msg = '📊 <b>OpenClaw Status</b>\n\n';
      msg += `💡 想法暫存: ${backlog}\n`;
      msg += `📋 待辦清單: ${todo}\n`;
      msg += `⚡ 執行中: ${ongoing}\n`;
      msg += `🔍 審核中: ${review}\n`;
      msg += `✅ 完成: ${done}\n`;
      msg += `\n📈 Total: ${tasks.length}`;

      await sendTelegramMessage(msg, chatId);
      return NextResponse.json({ ok: true });
    }

    // /help or /start
    if (text === '/help' || text === '/start') {
      let msg = '🤖 <b>OpenClaw Bot</b>\n\n';
      msg += '可用指令:\n';
      msg += '/task &lt;描述&gt; - 新增任務到待辦清單\n';
      msg += '/backlog &lt;描述&gt; - 新增想法到暫存區\n';
      msg += '/status - 查看任務狀態\n';
      msg += '/help - 顯示此說明\n';
      msg += '\n直接輸入文字也會自動建立任務 📝';

      await sendTelegramMessage(msg, chatId);
      return NextResponse.json({ ok: true });
    }

    // Unknown command
    if (text.startsWith('/')) {
      await sendTelegramMessage('⚠️ 未知指令，輸入 /help 查看可用指令', chatId);
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

      const baseUrl = getBaseUrl();
      await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      }).catch(() => {});

      await sendTelegramMessage(`📋 任務已建立: ${text}`, chatId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  return 'http://localhost:3000';
}
