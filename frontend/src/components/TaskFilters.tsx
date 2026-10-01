'use client';

import React from 'react';
import { Search, Filter, LayoutGrid, List, BarChart2, X } from 'lucide-react';

interface TaskFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  scopeFilter: string;
  onScopeFilterChange: (scope: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (priority: string) => void;
  viewMode: 'kanban' | 'list' | 'analytics';
  onViewModeChange: (mode: 'kanban' | 'list' | 'analytics') => void;
}

export function TaskFilters({
  searchQuery,
  onSearchChange,
  scopeFilter,
  onScopeFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  viewMode,
  onViewModeChange,
}: TaskFiltersProps) {
  const scopes = [
    { id: 'all', label: 'All Tasks' },
    { id: 'assigned_to_me', label: 'Assigned to Me' },
    { id: 'created_by_me', label: 'Created by Me' },
  ];

  const priorities: { id: string; label: string }[] = [
    { id: 'all', label: 'All Priorities' },
    { id: 'urgent', label: 'Urgent' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
  ];

  return (
    <div 
      className="glass-panel"
      style={{
        padding: '14px 18px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      {/* Left: Search input + Scope Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', flex: 1 }}>
        {/* Search Input */}
        <div style={{
          position: 'relative',
          minWidth: '240px',
          maxWidth: '320px',
          flex: 1,
        }}>
          <Search 
            size={16} 
            color="#818cf8" 
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks, descriptions..."
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '8px 32px 8px 36px',
              color: '#ffffff',
              fontSize: '13px',
              outline: 'none',
              transition: 'all 0.2s',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#cbd5e1',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Scope Filter Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '8px',
          padding: '3px',
          border: '1px solid var(--border-subtle)',
        }}>
          {scopes.map((s) => (
            <button
              key={s.id}
              onClick={() => onScopeFilterChange(s.id)}
              style={{
                background: scopeFilter === s.id ? 'var(--primary)' : 'transparent',
                color: scopeFilter === s.id ? '#ffffff' : '#cbd5e1',
                fontWeight: 600,
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Priority Dropdown & View Mode Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Priority Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={14} color="#818cf8" />
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '7px 12px',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer',
              colorScheme: 'dark',
            }}
          >
            {priorities.map((p) => (
              <option key={p.id} value={p.id} style={{ background: '#0f172a', color: '#ffffff' }}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Switcher: Kanban vs List vs Analytics */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '8px',
          padding: '3px',
          border: '1px solid var(--border-subtle)',
          gap: '2px',
        }}>
          <button
            onClick={() => onViewModeChange('kanban')}
            style={{
              background: viewMode === 'kanban' ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
              color: viewMode === 'kanban' ? '#ffffff' : '#cbd5e1',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
            }}
            title="Kanban Board View"
          >
            <LayoutGrid size={14} color={viewMode === 'kanban' ? '#818cf8' : undefined} />
            <span>Board</span>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            style={{
              background: viewMode === 'list' ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
              color: viewMode === 'list' ? '#ffffff' : '#cbd5e1',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
            }}
            title="Table List View"
          >
            <List size={14} color={viewMode === 'list' ? '#818cf8' : undefined} />
            <span>List</span>
          </button>
          <button
            onClick={() => onViewModeChange('analytics')}
            style={{
              background: viewMode === 'analytics' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
              color: viewMode === 'analytics' ? '#ffffff' : '#cbd5e1',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
            }}
            title="Visual Analytics & Charts"
          >
            <BarChart2 size={14} color={viewMode === 'analytics' ? '#818cf8' : undefined} />
            <span>Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
}
