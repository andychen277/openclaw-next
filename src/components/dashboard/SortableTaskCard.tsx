'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/lib/types';
import TaskCard from './TaskCard';

interface SortableTaskCardProps {
  task: Task;
  assignedAgent?: string;
  onAssign?: () => void;
}

export default function SortableTaskCard({ task, assignedAgent, onAssign }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div onClick={(e) => {
        e.stopPropagation();
        onAssign?.();
      }}>
        <TaskCard task={task} assignedAgent={assignedAgent} />
      </div>
    </div>
  );
}
