import { NextResponse } from 'next/server';

// Setup Telegram Webhook
// Visit /api/telegram/setup to register the webhook URL with Telegram
export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({
      error: 'TELEGRAM_BOT_TOKEN not set',
      instructions: [
        '1. Talk to @BotFather on Telegram',
        '2. Create a new bot with /newbot',
        '3. Copy the token',
        '4. Set TELEGRAM_BOT_TOKEN in Vercel environment variables',
        '5. Set TELEGRAM_CHAT_ID (your chat ID)',
        '6. Visit this URL again to setup webhook',
      ],
    }, { status: 400 });
  }

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const webhookUrl = `${baseUrl}/api/telegram/webhook`;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  const params: Record<string, string> = { url: webhookUrl };
  if (secret) params.secret_token = secret;

  const response = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }
  );

  const result = await response.json();

  return NextResponse.json({
    webhookUrl,
    result,
    commands: 'To set bot commands, send this to @BotFather:\n/setcommands\ntask - 新增任務到待辦清單\nbacklog - 新增想法到暫存區\nstatus - 查看任務狀態\nhelp - 顯示說明',
  });
}
