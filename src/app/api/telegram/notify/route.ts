import { NextResponse } from 'next/server';
import { sendTelegramMessage, formatTaskNotification } from '@/lib/telegram';

// Internal API: Send task notification to Telegram
export async function POST(req: Request) {
  try {
    const { task, status, agent } = await req.json();

    if (!task || !status) {
      return NextResponse.json({ error: 'Missing task or status' }, { status: 400 });
    }

    let message;
    if (agent === 'direct-agent') {
      message = task; // Special case: send raw text for direct agent
    } else {
      message = formatTaskNotification(task, status, agent);
    }

    await sendTelegramMessage(message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram notify error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
