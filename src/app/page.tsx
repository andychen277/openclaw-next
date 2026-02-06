'use client';

import { useState, useEffect, useRef } from 'react';
import { Task } from '@/lib/types';
import { detectPriority } from '@/lib/priority';
import TaskCard from '@/components/TaskCard';
import ActionBar from '@/components/ActionBar';

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isListening, setIsListening] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Load tasks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('openclaw-tasks');
    if (saved) {
      const parsed = JSON.parse(saved);
      setTasks(parsed.map((t: Task) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt)
      })));
    }
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('openclaw-tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      const hasAPI = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

      if (isSecure && hasAPI) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'zh-TW';

        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join('');
          setInputText(transcript);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        setVoiceAvailable(true);
      }
    }
  }, []);

  const handleAddTask = () => {
    if (!inputText.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      content: inputText.trim(),
      priority: detectPriority(inputText),
      status: 'todo',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setTasks([newTask, ...tasks]);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTask();
    }
  };

  const handleStatusChange = (id: string, status: Task['status']) => {
    setTasks(tasks.map(t =>
      t.id === id ? { ...t, status, updatedAt: new Date() } : t
    ));
  };

  const handleDelete = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    setSelectedTasks(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedTasks(new Set());
  };

  const handleMerge = () => {
    const selectedItems = tasks.filter(t => selectedTasks.has(t.id));
    const mergedContent = selectedItems.map(t => `• ${t.content}`).join('\n');
    alert(`合併內容:\n\n${mergedContent}`);
  };

  const handlePublish = (platform: string) => {
    const selectedItems = tasks.filter(t => selectedTasks.has(t.id));
    const content = selectedItems.map(t => t.content).join('\n\n');

    const platformNames: Record<string, string> = {
      instagram: 'Instagram',
      threads: 'Threads',
      x: 'X (Twitter)'
    };

    alert(`即將發布到 ${platformNames[platform]}:\n\n${content}`);
  };

  const toggleVoice = () => {
    // Check if not on localhost/HTTPS
    const isSecure = typeof window !== 'undefined' &&
      (window.location.protocol === 'https:' || window.location.hostname === 'localhost');

    if (!isSecure) {
      alert('語音輸入需要 HTTPS 或 localhost 環境\n\n請使用 localhost:4000 訪問，或部署到 HTTPS 環境');
      return;
    }

    if (!recognitionRef.current) {
      alert('您的瀏覽器不支援語音輸入');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        setIsListening(false);
        alert('無法啟動語音輸入，請確認已授權麥克風權限');
      }
    }
  };

  // Sort tasks: todo first, then in_progress, then done
  const sortedTasks = [...tasks].sort((a, b) => {
    const order = { todo: 0, in_progress: 1, done: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="relative min-h-screen pb-32" style={{ zIndex: 1 }}>
      {/* Header */}
      <header className="header-glass fixed top-0 left-0 right-0 z-50 px-4 py-4" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-3">
          <span className="text-3xl">🦞</span>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            OpenClaw
          </h1>
        </div>
      </header>

      {/* Input Bar */}
      <div className="fixed left-0 right-0 z-40 px-4" style={{ top: 'calc(72px + env(safe-area-inset-top))' }}>
        <div className="glass-card-strong p-5 max-w-2xl mx-auto">
          <div className="flex gap-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="✨ 輸入任務，AI 自動判斷優先級..."
              className="input-glow flex-1 bg-white/5 text-white placeholder-gray-500 px-5 py-4 rounded-2xl border border-white/10 outline-none resize-none text-base"
              style={{ minHeight: '80px' }}
              rows={2}
            />
            <div className="flex flex-col gap-3">
              <button
                onClick={toggleVoice}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all border relative ${
                  isListening
                    ? 'bg-red-500/80 border-red-400 mic-listening'
                    : voiceAvailable
                      ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      : 'bg-white/5 border-white/10 opacity-40 cursor-not-allowed'
                }`}
                title={voiceAvailable ? '語音輸入' : '語音需要 localhost 或 HTTPS'}
              >
                🎤
                {!voiceAvailable && (
                  <span className="absolute -top-1 -right-1 text-xs">🔒</span>
                )}
              </button>
              <button
                onClick={handleAddTask}
                className="btn-gradient w-14 h-14 rounded-2xl flex items-center justify-center text-xl border-0"
              >
                <span className="text-white font-bold text-2xl">+</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <main className="px-4 max-w-2xl mx-auto" style={{ paddingTop: 'calc(220px + env(safe-area-inset-top))' }}>
        {sortedTasks.length === 0 ? (
          <div className="empty-state text-center mt-16 px-4">
            <div className="glass-card p-10 inline-block">
              <p className="text-6xl mb-6">📋</p>
              <p className="text-xl text-gray-300 font-medium mb-2">還沒有任務</p>
              <p className="text-gray-500">在上方輸入框新增第一個任務吧！</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedTasks.map((task, index) => (
              <div key={task.id} className="task-enter" style={{ animationDelay: `${index * 50}ms` }}>
                <TaskCard
                  task={task}
                  isSelected={selectedTasks.has(task.id)}
                  onToggleSelect={toggleSelection}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Action Bar */}
      <ActionBar
        selectedCount={selectedTasks.size}
        onClearSelection={clearSelection}
        onMerge={handleMerge}
        onPublish={handlePublish}
      />
    </div>
  );
}
