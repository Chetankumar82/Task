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
      color: 'var(--status-pending)',
      bgColor: 'var(--status-pending-bg)',
    },
    {
      status: 'in_progress',
      title: 'In Progress',
      icon: AlertCircle,
      color: 'var(--status-inprogress)',
      bgColor: 'var(--status-inprogress-bg)',
    },
    {
      status: 'completed',
      title: 'Completed',
      icon: CheckCircle2,
      color: 'var(--status-completed)',
      bgColor: 'var(--status-completed-bg)',
    },
  ];

  return (
    <div 
      className="kanban-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        alignItems: 'start',
      }}
    >
      {columns.map((col) => {
        const Icon = col.icon;
        const columnTasks = tasks.filter((t) => t.status === col.status);

        return (
          <div
            key={col.status}
            className="kanban-column"
            style={{
              background: 'var(--surface-column)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '16px',
              borderTop: `3px solid ${col.color}`,
              borderRight: '1px solid var(--border-subtle)',
              borderBottom: '1px solid var(--border-subtle)',
              borderLeft: '1px solid var(--border-subtle)',
              padding: '18px 16px',
              minHeight: '520px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--card-shadow)',
              transition: 'background-color 0.2s ease, border-color 0.2s ease',
            }}
          >
            {/* Column Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-subtle)',
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
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
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
                    background: 'var(--tag-bg)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '7px',
                    padding: '5px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-card-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--tag-bg)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
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
                  color: 'var(--text-muted)',
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
