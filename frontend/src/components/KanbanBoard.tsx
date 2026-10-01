'use client';

import React from 'react';
import { Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Task, TaskStatus } from '@/lib/types';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onOpenCreateModal: () => void;
  currentUserId?: string;
}

export function KanbanBoard({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
  onOpenCreateModal,
  currentUserId,
}: KanbanBoardProps) {
  const columns: {
    status: TaskStatus;
    title: string;
    icon: typeof Clock;
    color: string;
    bgColor: string;
  }[] = [
    {
      status: 'pending',
      title: 'Pending',
      icon: Clock,
      color: '#60a5fa',
      bgColor: 'rgba(59, 130, 246, 0.12)',
    },
    {
      status: 'in_progress',
      title: 'In Progress',
      icon: AlertCircle,
      color: '#fbbf24',
      bgColor: 'rgba(245, 158, 11, 0.12)',
    },
    {
      status: 'completed',
      title: 'Completed',
      icon: CheckCircle2,
      color: '#34d399',
      bgColor: 'rgba(16, 185, 129, 0.12)',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '20px',
      alignItems: 'start',
    }}>
      {columns.map((col) => {
        const Icon = col.icon;
        const columnTasks = tasks.filter((t) => t.status === col.status);

        return (
          <div
            key={col.status}
            style={{
              background: 'linear-gradient(180deg, rgba(20, 29, 47, 0.7) 0%, rgba(11, 17, 30, 0.8) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '16px',
              borderTop: `3px solid ${col.color}`,
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '18px 16px',
              minHeight: '500px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Column Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
                  background: col.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${col.color}40`,
                }}>
                  <Icon size={14} color={col.color} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.2px' }}>
                  {col.title}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: col.bgColor,
                  color: col.color,
                  border: `1px solid ${col.color}40`,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}>
                  {columnTasks.length}
                </span>
              </div>

              {col.status === 'pending' && (
                <button
                  onClick={onOpenCreateModal}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '7px',
                    padding: '5px',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; e.currentTarget.style.color = '#ffffff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.color = '#cbd5e1'; }}
                  title="Add Task to Pending"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>

            {/* Column Task Cards */}
            <div style={{ flex: 1 }}>
              {columnTasks.length > 0 ? (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={onStatusChange}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    currentUserId={currentUserId}
                  />
                ))
              ) : (
                <div style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: '12px',
                  color: '#cbd5e1',
                  fontSize: '12px',
                }}>
                  No tasks in {col.title.toLowerCase()}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
