'use client';

import React from 'react';
import { 
  CheckCircle, 
  ArrowRight, 
  RotateCcw, 
  Trash2, 
  Edit3, 
  Clock,
  User
} from 'lucide-react';
import { Task, TaskStatus } from '@/lib/types';

interface TaskListViewProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  currentUserId?: string;
}

export function TaskListView({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
  currentUserId,
}: TaskListViewProps) {
  if (tasks.length === 0) {
    return (
      <div 
        className="glass-panel"
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        No tasks match your current filter criteria.
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ overflowX: 'auto', borderRadius: '16px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
            <th style={{ padding: '14px 18px', color: '#cbd5e1', fontWeight: 600 }}>Task Title & Description</th>
            <th style={{ padding: '14px 18px', color: '#cbd5e1', fontWeight: 600 }}>Status</th>
            <th style={{ padding: '14px 18px', color: '#cbd5e1', fontWeight: 600 }}>Priority</th>
            <th style={{ padding: '14px 18px', color: '#cbd5e1', fontWeight: 600 }}>Assignee</th>
            <th style={{ padding: '14px 18px', color: '#cbd5e1', fontWeight: 600 }}>Due Date</th>
            <th style={{ padding: '14px 18px', color: '#cbd5e1', fontWeight: 600, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const isCreator = currentUserId === task.created_by;
            const formattedDate = task.due_date 
              ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : '—';

            return (
              <tr 
                key={task.id}
                style={{ 
                  borderBottom: '1px solid var(--border-subtle)',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Title & Description */}
                <td style={{ padding: '14px 18px', maxWidth: '320px' }}>
                  <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                    {task.title}
                  </div>
                  {task.description && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#cbd5e1', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}>
                      {task.description}
                    </div>
                  )}
                </td>

                {/* Status */}
                <td style={{ padding: '14px 18px' }}>
                  <span 
                    className={`badge-status-${task.status.replace('_', '')}`}
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      textTransform: 'capitalize',
                    }}
                  >
                    {task.status.replace('_', ' ')}
                  </span>
                </td>

                {/* Priority */}
                <td style={{ padding: '14px 18px' }}>
                  <span 
                    className={`badge-priority-${task.priority}`}
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {task.priority}
                  </span>
                </td>

                {/* Assignee */}
                <td style={{ padding: '14px 18px' }}>
                  {task.assignee ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 600,
                      }}>
                        {task.assignee.avatar_url ? (
                          <img src={task.assignee.avatar_url} alt="" style={{ width: '100%', height: '100%' }} />
                        ) : (
                          task.assignee.full_name?.charAt(0) || 'U'
                        )}
                      </div>
                      <span style={{ color: '#ffffff', fontWeight: 500 }}>{task.assignee.full_name}</span>
                    </div>
                  ) : (
                    <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 500 }}>Unassigned</span>
                  )}
                </td>

                {/* Due Date */}
                <td style={{ padding: '14px 18px', color: '#cbd5e1', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={12} color="#818cf8" />
                    <span>{formattedDate}</span>
                  </div>
                </td>

                {/* Actions */}
                <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {task.status === 'pending' && (
                      <button
                        onClick={() => onStatusChange(task.id, 'in_progress')}
                        className="btn-secondary"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                      >
                        Start
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => onStatusChange(task.id, 'completed')}
                        className="btn-primary"
                        style={{ fontSize: '11px', padding: '4px 8px', background: '#059669' }}
                      >
                        Complete
                      </button>
                    )}
                    {task.status === 'completed' && (
                      <button
                        onClick={() => onStatusChange(task.id, 'in_progress')}
                        className="btn-secondary"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                      >
                        Reopen
                      </button>
                    )}

                    <button
                      onClick={() => onEdit(task)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>

                    {isCreator && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${task.title}"?`)) onDelete(task.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f87171',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
