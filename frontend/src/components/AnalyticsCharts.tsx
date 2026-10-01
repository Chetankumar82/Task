'use client';

import React, { useState } from 'react';
import { 
  PieChart as PieIcon, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Flame,
  Award
} from 'lucide-react';
import { Task, DashboardStats, UserProfile } from '@/lib/types';

interface AnalyticsChartsProps {
  tasks: Task[];
  stats: DashboardStats;
  allUsers: UserProfile[];
  onFilterByStatus?: (status: string) => void;
  onFilterByPriority?: (priority: string) => void;
}

export function AnalyticsCharts({
  tasks,
  stats,
  allUsers,
  onFilterByStatus,
  onFilterByPriority,
}: AnalyticsChartsProps) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  const total = stats.total_tasks || tasks.length || 0;
  const pending = stats.pending_tasks;
  const inProgress = stats.in_progress_tasks;
  const completed = stats.completed_tasks;

  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const inProgressPct = total > 0 ? Math.round((inProgress / total) * 100) : 0;
  const pendingPct = total > 0 ? Math.max(0, 100 - completionPct - inProgressPct) : 0;

  // Donut circumference (radius = 65)
  const radius = 65;
  const circumference = 2 * Math.PI * radius; // ~408.4

  const completedStroke = (completed / (total || 1)) * circumference;
  const inProgressStroke = (inProgress / (total || 1)) * circumference;
  const pendingStroke = (pending / (total || 1)) * circumference;

  // Priority counts
  const urgentCount = tasks.filter((t) => t.priority === 'urgent').length;
  const highCount = tasks.filter((t) => t.priority === 'high').length;
  const mediumCount = tasks.filter((t) => t.priority === 'medium').length;
  const lowCount = tasks.filter((t) => t.priority === 'low').length;

  const urgentPct = total > 0 && urgentCount > 0 ? Math.round((urgentCount / total) * 100) : 0;
  const highPct = total > 0 && highCount > 0 ? Math.round((highCount / total) * 100) : 0;
  const mediumPct = total > 0 && mediumCount > 0 ? Math.round((mediumCount / total) * 100) : 0;
  const lowPct = total > 0 && lowCount > 0 ? Math.round((lowCount / total) * 100) : 0;

  // Assignee workload aggregation
  const workloadByUser: { [userId: string]: { user: UserProfile; total: number; completed: number } } = {};
  
  // Seed with all users
  allUsers.forEach((u) => {
    workloadByUser[u.id] = { user: u, total: 0, completed: 0 };
  });

  tasks.forEach((t) => {
    if (t.assigned_to && workloadByUser[t.assigned_to]) {
      workloadByUser[t.assigned_to].total += 1;
      if (t.status === 'completed') {
        workloadByUser[t.assigned_to].completed += 1;
      }
    }
  });

  const activeWorkloadList = Object.values(workloadByUser).filter((w) => w.total > 0 || allUsers.length <= 4);

  return (
    <div 
      className="charts-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        marginBottom: '28px',
      }}
    >
      {/* Chart Card 1: Interactive Status Donut & Efficiency */}
      <div 
        className="glass-panel interactive-card"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(52, 211, 153, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <PieIcon size={17} color="#34d399" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Task Status</h3>
            </div>
          </div>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '9999px',
            background: 'rgba(52, 211, 153, 0.15)',
            color: '#34d399',
            border: '1px solid rgba(52, 211, 153, 0.3)',
          }}>
            {completionPct}% Complete
          </span>
        </div>

        {/* SVG Donut Chart */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0', position: 'relative' }}>
          <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background Circle */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="transparent"
              stroke="var(--border-subtle)"
              strokeWidth="18"
            />

            {/* Pending Arc (Blue) */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="transparent"
              stroke="#38bdf8"
              strokeWidth={hoveredSlice === 'pending' ? '22' : '18'}
              strokeDasharray={`${pendingStroke} ${circumference}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredSlice('pending')}
              onMouseLeave={() => setHoveredSlice(null)}
              onClick={() => onFilterByStatus && onFilterByStatus('pending')}
            />

            {/* In Progress Arc (Amber) */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="transparent"
              stroke="#fbbf24"
              strokeWidth={hoveredSlice === 'in_progress' ? '22' : '18'}
              strokeDasharray={`${inProgressStroke} ${circumference}`}
              strokeDashoffset={-pendingStroke}
              strokeLinecap="round"
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredSlice('in_progress')}
              onMouseLeave={() => setHoveredSlice(null)}
              onClick={() => onFilterByStatus && onFilterByStatus('in_progress')}
            />

            {/* Completed Arc (Green) */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="transparent"
              stroke="#34d399"
              strokeWidth={hoveredSlice === 'completed' ? '22' : '18'}
              strokeDasharray={`${completedStroke} ${circumference}`}
              strokeDashoffset={-(pendingStroke + inProgressStroke)}
              strokeLinecap="round"
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredSlice('completed')}
              onMouseLeave={() => setHoveredSlice(null)}
              onClick={() => onFilterByStatus && onFilterByStatus('completed')}
            />
          </svg>

          {/* Center Text inside Donut */}
          <div style={{
            position: 'absolute',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
              {total}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>
              {hoveredSlice ? hoveredSlice.replace('_', ' ').toUpperCase() : 'TOTAL TASKS'}
            </span>
          </div>
        </div>

        {/* Interactive Legend with Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '16px' }}>
          <div 
            onClick={() => onFilterByStatus && onFilterByStatus('completed')}
            style={{
              background: 'rgba(52, 211, 153, 0.08)',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              borderRadius: '10px',
              padding: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
              Completed
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{completed}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{completionPct}%</div>
          </div>

          <div 
            onClick={() => onFilterByStatus && onFilterByStatus('in_progress')}
            style={{
              background: 'rgba(251, 191, 36, 0.08)',
              border: '1px solid rgba(251, 191, 36, 0.25)',
              borderRadius: '10px',
              padding: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24' }} />
              In Progress
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{inProgress}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{inProgressPct}%</div>
          </div>

          <div 
            onClick={() => onFilterByStatus && onFilterByStatus('pending')}
            style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '10px',
              padding: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />
              Pending
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{pending}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{pendingPct}%</div>
          </div>
        </div>
      </div>

      {/* Chart Card 2: Priority Breakdown Bar & Urgency Meter */}
      <div 
        className="glass-panel interactive-card"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Flame size={17} color="#f87171" />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Priority Urgency</h3>
              </div>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '9999px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}>
              {urgentCount} Urgent
            </span>
          </div>

          {/* Segmented Stacked Progress Bar */}
          <div style={{ marginTop: '14px', marginBottom: '20px' }}>
            <div style={{
              height: '14px',
              borderRadius: '9999px',
              overflow: 'hidden',
              display: 'flex',
              background: 'var(--border-subtle)',
              border: '1px solid var(--border-subtle)',
            }}>
              {urgentCount > 0 && (
                <div 
                  style={{ width: `${urgentPct}%`, background: 'linear-gradient(90deg, #ef4444, #f87171)', transition: 'width 0.4s ease' }} 
                  title={`Urgent: ${urgentCount} (${urgentPct}%)`} 
                />
              )}
              {highCount > 0 && (
                <div 
                  style={{ width: `${highPct}%`, background: 'linear-gradient(90deg, #f97316, #fb923c)', transition: 'width 0.4s ease' }} 
                  title={`High: ${highCount} (${highPct}%)`} 
                />
              )}
              {mediumCount > 0 && (
                <div 
                  style={{ width: `${mediumPct}%`, background: 'linear-gradient(90deg, #0284c7, #38bdf8)', transition: 'width 0.4s ease' }} 
                  title={`Medium: ${mediumCount} (${mediumPct}%)`} 
                />
              )}
              {lowCount > 0 && (
                <div 
                  style={{ width: `${lowPct}%`, background: 'linear-gradient(90deg, #64748b, #94a3b8)', transition: 'width 0.4s ease' }} 
                  title={`Low: ${lowCount} (${lowPct}%)`} 
                />
              )}
            </div>
          </div>

          {/* Priority Levels List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { id: 'urgent', label: 'Urgent', count: urgentCount, pct: urgentPct, color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)' },
              { id: 'high', label: 'High', count: highCount, pct: highPct, color: '#fb923c', bg: 'rgba(249, 115, 22, 0.15)' },
              { id: 'medium', label: 'Medium', count: mediumCount, pct: mediumPct, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
              { id: 'low', label: 'Low', count: lowCount, pct: lowPct, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' },
            ].map((p) => (
              <div
                key={p.id}
                onClick={() => onFilterByPriority && onFilterByPriority(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'var(--tag-bg)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-card-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--tag-bg)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: p.color }}>{p.count}</span>
                  {p.count > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({p.pct}%)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Card 3: Team Workload & Leaderboard */}
      <div 
        className="glass-panel interactive-card"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Users size={17} color="#818cf8" />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Team Workload</h3>
              </div>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '9999px',
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }}>
              {activeWorkloadList.length} Members
            </span>
          </div>

          {/* Members List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
            {activeWorkloadList.slice(0, 4).map(({ user, total: userTotal, completed: userCompleted }) => {
              const userPct = userTotal > 0 ? Math.round((userCompleted / userTotal) * 100) : 0;
              return (
                <div 
                  key={user.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'var(--tag-bg)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#334155',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#ffffff',
                      }}>
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%' }} />
                        ) : (
                          user.full_name?.charAt(0) || 'U'
                        )}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {user.full_name}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: userTotal > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                      {userTotal > 0 ? `${userCompleted}/${userTotal} completed (${userPct}%)` : '0 tasks'}
                    </span>
                  </div>

                  {/* Progress bar per member */}
                  <div style={{
                    width: '100%',
                    height: '5px',
                    borderRadius: '9999px',
                    background: 'var(--border-subtle)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${userPct}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #6366f1, #34d399)',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
