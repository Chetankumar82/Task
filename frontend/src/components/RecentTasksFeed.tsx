'use client';

import React from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Task } from '@/lib/types';

interface RecentTasksFeedProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onViewBoard: () => void;
}

export function RecentTasksFeed({
  tasks,
  onSelectTask,
  onViewBoard,
}: RecentTasksFeedProps) {
  const recentTasks = tasks.slice(0, 5);

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Recent Tasks
        </h3>
        <button
          onClick={onViewBoard}
          className="btn-secondary"
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          <span>View Board</span>
          <ArrowRight size={13} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {recentTasks.length > 0 ? (
          recentTasks.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelectTask(t)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-medium)';
                e.currentTarget.style.background = 'var(--surface-card-hover)';
                e.currentTarget.style.transform = 'translateX(2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.background = 'var(--surface-card)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                <span
                  className={`badge-status-${t.status.replace('_', '')}`}
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    textTransform: 'capitalize',
                    flexShrink: 0,
                  }}
                >
                  {t.status.replace('_', ' ')}
                </span>
                <span
                  className={`badge-priority-${t.priority}`}
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                  }}
                >
                  {t.priority}
                </span>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.title}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                {t.assignee ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#475569',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: 600,
                        color: '#ffffff',
                      }}
                    >
                      {t.assignee.avatar_url ? (
                        <img src={t.assignee.avatar_url} alt="" style={{ width: '100%', height: '100%' }} />
                      ) : (
                        t.assignee.full_name?.charAt(0) || 'U'
                      )}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {t.assignee.full_name?.split(' ')[0]}
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Unassigned</span>
                )}
                <ChevronRight size={14} color="var(--text-muted)" />
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            No tasks created yet. Click &quot;+ Create Task&quot; to get started.
          </div>
        )}
      </div>
    </div>
  );
}
