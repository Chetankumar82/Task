'use client';

import React from 'react';
import { 
  Calendar, 
  CheckCircle, 
  ArrowRight, 
  RotateCcw, 
  Trash2, 
  Edit3,
  Clock,
  Flame,
  Zap
} from 'lucide-react';
import { Task, TaskStatus } from '@/lib/types';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  currentUserId?: string;
}

export function TaskCard({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  currentUserId,
}: TaskCardProps) {
  const isCreator = currentUserId === task.created_by;

  // Format Due Date
  const formattedDueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }) : null;

  // Check if task is overdue
  const isOverdue = task.due_date && task.status !== 'completed' && new Date(task.due_date) < new Date(new Date().setHours(0,0,0,0));

  const priorityConfig = {
    urgent: { color: 'var(--priority-urgent)', bg: 'rgba(220, 38, 38, 0.09)', border: 'rgba(220, 38, 38, 0.25)', icon: Flame },
    high: { color: 'var(--priority-high)', bg: 'rgba(234, 88, 12, 0.09)', border: 'rgba(234, 88, 12, 0.25)', icon: Zap },
    medium: { color: 'var(--priority-medium)', bg: 'rgba(2, 132, 199, 0.09)', border: 'rgba(2, 132, 199, 0.25)', icon: Clock },
    low: { color: 'var(--priority-low)', bg: 'rgba(100, 116, 139, 0.09)', border: 'rgba(100, 116, 139, 0.25)', icon: CheckCircle },
  }[task.priority] || { color: 'var(--priority-low)', bg: 'rgba(100, 116, 139, 0.09)', border: 'rgba(100, 116, 139, 0.25)', icon: Clock };

  const PriorityIcon = priorityConfig.icon;

  return (
    <div
      className="glass-panel interactive-card"
      style={{
        padding: '16px 18px',
        marginBottom: '12px',
        position: 'relative',
        cursor: 'default',
        borderTop: '1px solid var(--border-subtle)',
        borderRight: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        borderLeft: `3.5px solid ${priorityConfig.color}`,
        borderRadius: '12px',
        background: 'var(--surface-card)',
      }}
    >
      {/* Top Header: Priority Badge + Edit/Delete Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span 
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            padding: '3px 8px',
            borderRadius: '6px',
            background: priorityConfig.bg,
            color: priorityConfig.color,
            border: `1px solid ${priorityConfig.border}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <PriorityIcon size={12} color={priorityConfig.color} />
          <span>{task.priority}</span>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => onEdit(task)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
            }}
            title="Edit Task"
          >
            <Edit3 size={13} />
          </button>
          {isCreator && (
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
                  onDelete(task.id);
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#f87171',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
              }}
              title="Delete Task"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h3 
        onClick={() => onEdit(task)}
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '6px',
          lineHeight: 1.4,
          cursor: 'pointer',
        }}
      >
        {task.title}
      </h3>

      {/* Description Snippet */}
      {task.description && (
        <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          marginBottom: '14px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {task.description}
        </p>
      )}

      {/* Due Date & Overdue Indicator */}
      {formattedDueDate && (
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '6px', 
          fontSize: '11px', 
          color: isOverdue ? 'var(--priority-urgent)' : 'var(--text-secondary)',
          background: isOverdue ? 'rgba(220, 38, 38, 0.09)' : 'var(--tag-bg)',
          border: isOverdue ? '1px solid rgba(220, 38, 38, 0.25)' : '1px solid var(--border-subtle)',
          padding: '3px 8px',
          borderRadius: '6px',
          marginBottom: '12px',
          fontWeight: isOverdue ? 600 : 500
        }}>
          <Calendar size={12} color={isOverdue ? 'var(--priority-urgent)' : 'var(--primary)'} />
          <span>Due {formattedDueDate}</span>
          {isOverdue && <span style={{ textTransform: 'uppercase', fontSize: '10px', color: 'var(--priority-urgent)', fontWeight: 700 }}>• Overdue</span>}
        </div>
      )}

      {/* Bottom Row: Assignee Avatar + Status Transition Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '10px',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        {/* Assignee Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {task.assignee ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} title={`Assigned to: ${task.assignee.email}`}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#475569',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 600,
                color: '#ffffff',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
              }}>
                {task.assignee.avatar_url ? (
                  <img src={task.assignee.avatar_url} alt="" style={{ width: '100%', height: '100%' }} />
                ) : (
                  task.assignee.full_name?.charAt(0) || 'U'
                )}
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.assignee.full_name?.split(' ')[0]}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 500 }}>
              Unassigned
            </span>
          )}
        </div>

        {/* Quick Progression Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {task.status === 'pending' && (
            <button
              onClick={() => onStatusChange(task.id, 'in_progress')}
              className="btn-secondary"
              style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px' }}
              title="Start Task"
            >
              <span>Start</span>
              <ArrowRight size={11} />
            </button>
          )}

          {task.status === 'in_progress' && (
            <button
              onClick={() => onStatusChange(task.id, 'completed')}
              className="btn-primary"
              style={{ 
                fontSize: '11px', 
                padding: '4px 8px', 
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
              title="Mark as completed"
            >
              <CheckCircle size={12} />
              <span>Complete</span>
            </button>
          )}

          {task.status === 'completed' && (
            <button
              onClick={() => onStatusChange(task.id, 'in_progress')}
              className="btn-secondary"
              style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', color: 'var(--text-muted)' }}
              title="Reopen Task"
            >
              <RotateCcw size={11} />
              <span>Reopen</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
