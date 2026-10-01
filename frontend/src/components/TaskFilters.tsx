'use client';

import React from 'react';
import { Search, Filter, LayoutGrid, List, X } from 'lucide-react';
import { TaskPriority } from '@/lib/types';

interface TaskFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  scopeFilter: string;
  onScopeFilterChange: (scope: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (priority: string) => void;
  viewMode: 'kanban' | 'list';
  onViewModeChange: (mode: 'kanban' | 'list') => void;
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
            color="var(--text-muted)" 
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks, descriptions..."
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.04)',
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
                color: 'var(--text-muted)',
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
                color: scopeFilter === s.id ? '#ffffff' : 'var(--text-secondary)',
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
          <Filter size={14} color="var(--text-muted)" />
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
            }}
          >
            {priorities.map((p) => (
              <option key={p.id} value={p.id} style={{ background: '#0f172a', color: '#ffffff' }}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Switcher: Kanban vs List */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '8px',
          padding: '3px',
          border: '1px solid var(--border-subtle)',
        }}>
          <button
            onClick={() => onViewModeChange('kanban')}
            style={{
              background: viewMode === 'kanban' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: viewMode === 'kanban' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
            }}
            title="Kanban Board View"
          >
            <LayoutGrid size={15} />
            <span>Board</span>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            style={{
              background: viewMode === 'list' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: viewMode === 'list' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
            }}
            title="Table List View"
          >
            <List size={15} />
            <span>List</span>
          </button>
        </div>
      </div>
    </div>
  );
}
