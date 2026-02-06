// AI Semantic Priority Detection
export function detectPriority(text: string): 'high' | 'medium' | 'low' {
  const lower = text.toLowerCase();

  // High priority keywords (Chinese + English)
  const highKeywords = [
    '緊急', '急', 'urgent', 'asap', '馬上', '立刻', '今天', '現在',
    '重要', '趕快', '盡快', '立即', '火速', '必須', 'deadline',
    '急件', '優先', '最優先', 'critical', 'important', '馬上要'
  ];

  // Low priority keywords
  const lowKeywords = [
    '有空', '之後', '以後', '隨便', '慢慢', '不急', '有時間',
    '可以等', '閒暇', 'later', 'whenever', 'no rush', '有機會',
    '改天', '下次', '不趕', 'someday'
  ];

  for (const kw of highKeywords) {
    if (lower.includes(kw)) return 'high';
  }

  for (const kw of lowKeywords) {
    if (lower.includes(kw)) return 'low';
  }

  return 'medium';
}

// Priority label for display
export function getPriorityLabel(priority: string): string {
  switch (priority) {
    case 'high': return '高優先';
    case 'low': return '低優先';
    default: return '中等';
  }
}

// Status label for display
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'todo': return '待辦';
    case 'in_progress': return '進行中';
    case 'done': return '完成';
    default: return status;
  }
}
