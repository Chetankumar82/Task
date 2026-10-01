'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ActiveFiltersBarProps {
  status: string;
  priority: string;
  scope: string;
  search: string;
  onClearStatus: () => void;
  onClearPriority: () => void;
  onClearScope: () => void;
  onClearSearch: () => void;
  onClearAll: () => void;
}

export function ActiveFiltersBar({
  status,
  priority,
  scope,
  search,
  onClearStatus,
  onClearPriority,
  onClearScope,
  onClearSearch,
  onClearAll,
}: ActiveFiltersBarProps) {
  const hasActiveFilters =
    status !== 'all' ||
    priority !== 'all' ||
    scope !== 'all' ||
    search.trim() !== '';

  if (!hasActiveFilters) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '20px',
        padding: '8px 14px',
        background: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '10px',
        fontSize: '12px',
      }}
    >
      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Active Filters:</span>

      {status !== 'all' && (
        <span
          style={{
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            padding: '2px 8px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          Status: <strong>{status.replace('_', ' ')}</strong>
          <button
            onClick={onClearStatus}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
          >
            <X size={12} />
          </button>
        </span>
      )}

      {priority !== 'all' && (
        <span
          style={{
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            padding: '2px 8px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          Priority: <strong>{priority}</strong>
          <button
            onClick={onClearPriority}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
          >
            <X size={12} />
          </button>
        </span>
      )}

      {scope !== 'all' && (
        <span
          style={{
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            padding: '2px 8px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          Scope: <strong>{scope.replace('_', ' ')}</strong>
          <button
            onClick={onClearScope}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
          >
            <X size={12} />
          </button>
        </span>
      )}

      {search.trim() !== '' && (
        <span
          style={{
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            padding: '2px 8px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          Search: &ldquo;{search}&rdquo;
          <button
            onClick={onClearSearch}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
          >
            <X size={12} />
          </button>
        </span>
      )}

      <button
        onClick={onClearAll}
        style={{
          marginLeft: 'auto',
          background: 'none',
          border: 'none',
          color: 'var(--primary)',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '11px',
        }}
      >
        Reset filters
      </button>
    </div>
  );
}
