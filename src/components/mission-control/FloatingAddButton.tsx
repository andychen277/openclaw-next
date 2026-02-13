'use client';

import { useState } from 'react';
import TaskCreateModal from '@/components/dashboard/TaskCreateModal';

interface FloatingAddButtonProps {
  onSubmit: (task: string, agentId?: string, priority?: 'high' | 'medium' | 'low') => Promise<void>;
}

export default function FloatingAddButton({ onSubmit }: FloatingAddButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async (data: {
    task: string;
    agentId: string;
    priority: 'high' | 'medium' | 'low';
  }) => {
    await onSubmit(data.task, data.agentId, data.priority);
    setShowModal(false);
  };

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setShowModal(true)}
        className="lg:hidden fixed bottom-20 right-4 z-20 w-14 h-14 rounded-full bg-primary text-background shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-2xl"
        aria-label="新增任務"
      >
        ➕
      </button>

      {/* Task Create Modal */}
      {showModal && (
        <TaskCreateModal
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
