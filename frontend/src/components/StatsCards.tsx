'use client';

import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Layers, 
  UserCheck 
} from 'lucide-react';
import { DashboardStats } from '@/lib/types';

interface StatsCardsProps {
  stats: DashboardStats;
  onSelectFilter?: (type: 'status' | 'scope', value: string) => void;
  activeStatusFilter?: string;
  activeScopeFilter?: string;
}

export function StatsCards({ 
  stats,
  onSelectFilter,
  activeStatusFilter,
  activeScopeFilter,
}: StatsCardsProps) {
  const completionRate = stats.total_tasks > 0 
    ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) 
    : 0;

  const cards = [
    {
      title: 'Total Tasks',
      value: stats.total_tasks,
      icon: Layers,
      color: 'var(--primary)',
      bgGlow: 'var(--primary-glow)',
      subtext: `${stats.total_tasks} across all projects`,
      filterType: 'status' as const,
      filterValue: 'all',
      isActive: activeStatusFilter === 'all' && activeScopeFilter === 'all',
    },
    {
      title: 'Pending',
      value: stats.pending_tasks,
      icon: Clock,
      color: 'var(--status-pending)',
      bgGlow: 'var(--status-pending-bg)',
      subtext: stats.total_tasks > 0 ? `${Math.round((stats.pending_tasks / stats.total_tasks) * 100)}% of total` : 'None pending',
      filterType: 'status' as const,
      filterValue: 'pending',
      isActive: activeStatusFilter === 'pending',
    },
    {
      title: 'In Progress',
      value: stats.in_progress_tasks,
      icon: AlertCircle,
      color: 'var(--status-inprogress)',
      bgGlow: 'var(--status-inprogress-bg)',
      subtext: stats.total_tasks > 0 ? `${Math.round((stats.in_progress_tasks / stats.total_tasks) * 100)}% active` : 'None active',
      filterType: 'status' as const,
      filterValue: 'in_progress',
      isActive: activeStatusFilter === 'in_progress',
    },
    {
      title: 'Completed',
      value: stats.completed_tasks,
      icon: CheckCircle2,
      color: 'var(--status-completed)',
      bgGlow: 'var(--status-completed-bg)',
      subtext: `${completionRate}% completion rate`,
      filterType: 'status' as const,
      filterValue: 'completed',
      isActive: activeStatusFilter === 'completed',
    },
    {
      title: 'Assigned to Me',
      value: stats.assigned_to_me,
      icon: UserCheck,
      color: 'var(--accent-pink)',
      bgGlow: 'rgba(219, 39, 119, 0.12)',
      subtext: `${stats.assigned_to_me} direct tasks`,
      filterType: 'scope' as const,
      filterValue: 'assigned_to_me',
      isActive: activeScopeFilter === 'assigned_to_me',
    },
  ];

  return (
    <div 
      className="stats-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}
    >
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const cardPct = stats.total_tasks > 0 
          ? Math.round((Number(card.value) / stats.total_tasks) * 100) 
          : 0;

        return (
          <div
            key={idx}
            className="glass-panel interactive-card"
            onClick={() => onSelectFilter && onSelectFilter(card.filterType, card.filterValue)}
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              borderTop: `3px solid ${card.color}`,
              borderRight: card.isActive ? `2px solid ${card.color}` : '1px solid var(--border-subtle)',
              borderBottom: card.isActive ? `2px solid ${card.color}` : '1px solid var(--border-subtle)',
              borderLeft: card.isActive ? `2px solid ${card.color}` : '1px solid var(--border-subtle)',
              boxShadow: card.isActive 
                ? `0 0 24px ${card.bgGlow}, var(--card-shadow)` 
                : 'var(--card-shadow)',
            }}
          >
            {/* Top Row: Title + Icon */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ 
                fontSize: '13px', 
                fontWeight: 600, 
                color: card.isActive ? 'var(--text-primary)' : 'var(--text-secondary)' 
              }}>
                {card.title}
              </span>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: card.bgGlow,
                border: `1px solid ${card.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon size={18} color={card.color} />
              </div>
            </div>

            {/* Metric Value */}
            <div style={{ marginTop: '14px', marginBottom: '6px' }}>
              <span style={{ 
                fontSize: '32px', 
                fontWeight: 800, 
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.5px',
                color: 'var(--text-primary)' 
              }}>
                {card.value}
              </span>
            </div>

            {/* Subtext with High Contrast */}
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {card.subtext}
            </div>

            {/* Mini Progress meter */}
            {stats.total_tasks > 0 && card.filterValue !== 'all' && (
              <div style={{
                width: '100%',
                height: '4px',
                background: 'var(--border-subtle)',
                borderRadius: '9999px',
                overflow: 'hidden',
                marginTop: '12px',
              }}>
                <div style={{
                  width: `${cardPct}%`,
                  height: '100%',
                  background: card.color,
                  transition: 'width 0.4s ease',
                  borderRadius: '9999px',
                }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
