const TELEGRAM_API = 'https://api.telegram.org/bot';

export async function sendTelegramMessage(text: string, chatId?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const targetChat = chatId || process.env.TELEGRAM_CHAT_ID;
  if (!token || !targetChat) return;

  await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: targetChat,
      text,
      parse_mode: 'HTML',
    }),
  });
}

export function formatTaskNotification(task: string, status: string, agent?: string): string {
  const statusEmoji = status === 'done' ? '✅' : status === 'ongoing' ? '⚡' : '📋';
  let msg = `${statusEmoji} <b>Task Update</b>\n\n`;
  msg += `📝 ${escapeHtml(task)}\n`;
  msg += `📊 Status: ${status}\n`;
  if (agent && agent !== 'auto') msg += `🤖 Agent: ${agent}\n`;
  msg += `\n🕐 ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`;
  return msg;
}

export function formatNewTaskNotification(task: string, priority: string, agent: string, destination: string): string {
  const priorityEmoji = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🔵';
  const destLabel = destination === 'backlog' ? '💡 想法暫存' : '📋 待辦清單';
  let msg = `📋 <b>New Task</b>\n\n`;
  msg += `📝 ${escapeHtml(task)}\n`;
  msg += `${priorityEmoji} Priority: ${priority}\n`;
  msg += `📂 ${destLabel}\n`;
  if (agent !== 'auto') msg += `🤖 Agent: ${agent}\n`;
  msg += `\n🕐 ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`;
  return msg;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
