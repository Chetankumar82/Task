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
}

export function StatsCards({ stats }: StatsCardsProps) {
  const completionRate = stats.total_tasks > 0 
    ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) 
    : 0;

  const cards = [
    {
      title: 'Total Tasks',
      value: stats.total_tasks,
      icon: Layers,
      color: '#818cf8',
      bgGlow: 'rgba(99, 102, 241, 0.12)',
      subtext: 'Across all workspaces',
    },
    {
      title: 'Pending',
      value: stats.pending_tasks,
      icon: Clock,
      color: '#60a5fa',
      bgGlow: 'rgba(59, 130, 246, 0.12)',
      subtext: 'Awaiting execution',
    },
    {
      title: 'In Progress',
      value: stats.in_progress_tasks,
      icon: AlertCircle,
      color: '#fbbf24',
      bgGlow: 'rgba(245, 158, 11, 0.12)',
      subtext: 'Actively in motion',
    },
    {
      title: 'Completed',
      value: stats.completed_tasks,
      icon: CheckCircle2,
      color: '#34d399',
      bgGlow: 'rgba(16, 185, 129, 0.12)',
      subtext: `${completionRate}% team completion rate`,
    },
    {
      title: 'Assigned to Me',
      value: stats.assigned_to_me,
      icon: UserCheck,
      color: '#f472b6',
      bgGlow: 'rgba(236, 72, 153, 0.12)',
      subtext: 'My direct responsibilities',
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
        return (
          <div
            key={idx}
            className="glass-panel"
            style={{
              padding: '20px',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Row: Title + Icon */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {card.title}
              </span>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: card.bgGlow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon size={18} color={card.color} />
              </div>
            </div>

            {/* Metric Value */}
            <div style={{ marginTop: '14px', marginBottom: '8px' }}>
              <span style={{ 
                fontSize: '28px', 
                fontWeight: 700, 
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.5px',
                color: '#ffffff' 
              }}>
                {card.value}
              </span>
            </div>

            {/* Subtext or Mini Progress Bar */}
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {card.subtext}
            </div>

            {/* Progress bar on Completed card */}
            {card.title === 'Completed' && stats.total_tasks > 0 && (
              <div style={{
                width: '100%',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '9999px',
                overflow: 'hidden',
                marginTop: '10px',
              }}>
                <div style={{
                  width: `${completionRate}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981, #34d399)',
                  transition: 'width 0.4s ease',
                }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
