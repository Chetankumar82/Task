'use client';

import React from 'react';
import { 
  Users, 
  Mail, 
  CheckCircle2, 
  Clock, 
  Plus, 
  ShieldCheck, 
  Award,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { UserProfile, Task } from '@/lib/types';

interface TeamViewProps {
  users: UserProfile[];
  tasks: Task[];
  onSelectUserFilter: (userId: string) => void;
  onOpenCreateTaskForUser?: (userId: string) => void;
}

export function TeamView({
  users,
  tasks,
  onSelectUserFilter,
  onOpenCreateTaskForUser,
}: TeamViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
            <Users size={14} />
            <span>Workspace Collaborators</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
            Team Directory &amp; Capacity
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage team assignments, view capacity, and track automated email notifications.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--surface-glass)',
          border: '1px solid var(--border-subtle)',
          padding: '6px 14px',
          borderRadius: '10px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
        }}>
          <ShieldCheck size={16} color="#10b981" />
          <span>Real-time Gmail SMTP notifications active</span>
        </div>
      </div>

      {/* Team Member Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px',
      }}>
        {users.map((user) => {
          const userTasks = tasks.filter((t) => t.assigned_to === user.id);
          const completedCount = userTasks.filter((t) => t.status === 'completed').length;
          const inProgressCount = userTasks.filter((t) => t.status === 'in_progress').length;
          const pendingCount = userTasks.filter((t) => t.status === 'pending').length;
          const completionPct = userTasks.length > 0 ? Math.round((completedCount / userTasks.length) * 100) : 0;

          return (
            <div
              key={user.id}
              className="glass-panel interactive-card"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <div>
                {/* Member Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#ffffff',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                    flexShrink: 0,
                  }}>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      user.full_name?.charAt(0) || 'U'
                    )}
                  </div>

                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.full_name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                      <Mail size={12} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</span>
                    </div>
                  </div>
                </div>

                {/* Task Breakdown Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  background: 'var(--surface-glass)',
                  padding: '12px',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  textAlign: 'center',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--status-pending)' }}>{pendingCount}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Pending</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--status-inprogress)' }}>{inProgressCount}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Active</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--status-completed)' }}>{completedCount}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Done</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Completion Rate</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{completionPct}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '9999px',
                    background: 'var(--border-subtle)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${completionPct}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--primary), var(--status-completed))',
                      transition: 'width 0.4s ease',
                      borderRadius: '9999px',
                    }} />
                  </div>
                </div>
              </div>

              {/* Action: Filter Tasks by this user */}
              <button
                onClick={() => onSelectUserFilter(user.id)}
                className="btn-secondary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  fontSize: '12px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                }}
              >
                <span>View {user.full_name?.split(' ')[0]}&apos;s Tasks ({userTasks.length})</span>
                <ArrowRight size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
