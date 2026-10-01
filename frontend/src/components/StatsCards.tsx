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
      color: '#818cf8',
      bgGlow: 'rgba(99, 102, 241, 0.15)',
      subtext: 'Across all active projects',
      filterType: 'status' as const,
      filterValue: 'all',
      isActive: activeStatusFilter === 'all' && activeScopeFilter === 'all',
    },
    {
      title: 'Pending',
      value: stats.pending_tasks,
      icon: Clock,
      color: '#38bdf8',
      bgGlow: 'rgba(56, 189, 248, 0.15)',
      subtext: 'Awaiting team kickoff',
      filterType: 'status' as const,
      filterValue: 'pending',
      isActive: activeStatusFilter === 'pending',
    },
    {
      title: 'In Progress',
      value: stats.in_progress_tasks,
      icon: AlertCircle,
      color: '#fbbf24',
      bgGlow: 'rgba(251, 191, 36, 0.15)',
      subtext: 'Actively in motion',
      filterType: 'status' as const,
      filterValue: 'in_progress',
      isActive: activeStatusFilter === 'in_progress',
    },
    {
      title: 'Completed',
      value: stats.completed_tasks,
      icon: CheckCircle2,
      color: '#34d399',
      bgGlow: 'rgba(52, 211, 153, 0.15)',
      subtext: `${completionRate}% team completion rate`,
      filterType: 'status' as const,
      filterValue: 'completed',
      isActive: activeStatusFilter === 'completed',
    },
    {
      title: 'Assigned to Me',
      value: stats.assigned_to_me,
      icon: UserCheck,
      color: '#f472b6',
      bgGlow: 'rgba(236, 72, 153, 0.15)',
      subtext: 'My direct responsibilities',
      filterType: 'scope' as const,
      filterValue: 'assigned_to_me',
      isActive: activeScopeFilter === 'assigned_to_me',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
      gap: '16px',
      marginBottom: '28px',
    }}>
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
              border: card.isActive 
                ? `2px solid ${card.color}` 
                : '1px solid rgba(255, 255, 255, 0.08)',
              borderTop: `3px solid ${card.color}`,
              boxShadow: card.isActive 
                ? `0 0 24px ${card.bgGlow}, 0 12px 30px -10px rgba(0, 0, 0, 0.7)` 
                : '0 10px 25px -10px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Top Row: Title + Icon */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: card.isActive ? '#ffffff' : '#cbd5e1' }}>
                {card.title}
              </span>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: card.bgGlow,
                border: `1px solid ${card.color}30`,
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
                color: '#ffffff' 
              }}>
                {card.value}
              </span>
            </div>

            {/* Subtext with High Contrast */}
            <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>
              {card.subtext}
            </div>

            {/* Mini Progress meter */}
            {stats.total_tasks > 0 && card.filterValue !== 'all' && (
              <div style={{
                width: '100%',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.08)',
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
