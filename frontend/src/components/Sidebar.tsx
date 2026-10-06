'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Kanban, 
  ListTodo, 
  BarChart3, 
  Users, 
  Plus, 
  Sun, 
  Moon, 
  LogOut, 
  Sparkles, 
  X
} from 'lucide-react';
import { UserProfile, DashboardStats, SystemHealth } from '@/lib/types';

export type NavTab = 'overview' | 'kanban' | 'list' | 'analytics' | 'team';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  scopeFilter: string;
  onSelectScope: (scope: string) => void;
  currentUser: UserProfile | null;
  onOpenCreateModal: () => void;
  onOpenLoginModal: () => void;
  onSignOut: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  stats: DashboardStats;
  systemHealth?: SystemHealth | null;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  scopeFilter,
  onSelectScope,
  currentUser,
  onOpenCreateModal,
  onOpenLoginModal,
  onSignOut,
  theme,
  onToggleTheme,
  stats,
  systemHealth,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const navItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutDashboard, badge: stats.total_tasks },
    { id: 'kanban' as NavTab, label: 'Board', icon: Kanban, badge: stats.in_progress_tasks },
    { id: 'list' as NavTab, label: 'List View', icon: ListTodo, badge: stats.total_tasks },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
    { id: 'team' as NavTab, label: 'Team', icon: Users },
  ];

  const scopes = [
    { id: 'all', label: 'All Workspace Tasks' },
    { id: 'assigned_to_me', label: 'Assigned to Me', count: stats.assigned_to_me },
    { id: 'created_by_me', label: 'Created by Me', count: stats.created_by_me },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile} 
          className="mobile-drawer-backdrop" 
        />
      )}

      <aside 
        className={`sidebar-container ${isMobileOpen ? 'open' : 'closed'}`}
        style={{
          width: '260px',
          minWidth: '260px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--sidebar-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '20px 16px',
          zIndex: 100,
          overflowY: 'auto',
          transition: 'background-color 0.25s ease, border-color 0.25s ease',
        }}
      >
        {/* Top Section: Brand + Action + Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Workspace Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
                flexShrink: 0,
              }}>
                <Sparkles size={18} color="#ffffff" />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.3px',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                }}>
                  Hairdrama <span className="gradient-text">Tech</span>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                }}>
                  Workspace
                </div>
              </div>
            </div>

            {/* Mobile Drawer Close Button */}
            <button
              onClick={onCloseMobile}
              className="sidebar-close-btn"
              style={{
                background: 'var(--surface-card-hover)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close Menu"
            >
              <X size={16} />
            </button>
          </div>

        {/* Quick Create Task CTA */}
        <button
          onClick={() => {
            onOpenCreateModal();
            onCloseMobile?.();
          }}
          className="btn-primary"
          style={{
            width: '100%',
            justifyContent: 'center',
            fontSize: '13px',
            padding: '9px 14px',
            borderRadius: '10px',
          }}
        >
          <Plus size={16} />
          <span>New Task</span>
        </button>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            color: 'var(--text-muted)',
            padding: '4px 10px',
            marginBottom: '2px',
          }}>
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile?.();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  boxShadow: isActive ? '0 4px 14px var(--primary-glow)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--surface-card-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={16} color={isActive ? '#ffffff' : undefined} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--border-subtle)',
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Scope Filter Section (Quick Filters) - Visible only on Board and List View */}
        {(currentTab === 'kanban' || currentTab === 'list') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              color: 'var(--text-muted)',
              padding: '4px 10px',
            }}>
              Quick Scopes
            </div>
            {scopes.map((s) => {
              const isSelected = scopeFilter === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    onSelectScope(s.id);
                    onCloseMobile?.();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span>{s.label}</span>
                  {s.count !== undefined && s.count > 0 && (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{s.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Section: Theme Toggle + User Profile */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '16px', borderTop: '1px solid var(--sidebar-border)' }}>
        {/* Modern Segmented Theme Control */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              Appearance
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {theme === 'light' ? 'Light' : 'Dark'}
            </span>
          </div>

          <div className="theme-segmented-control">
            <button
              onClick={() => theme !== 'light' && onToggleTheme()}
              className={`theme-segmented-btn ${theme === 'light' ? 'active' : ''}`}
              title="Switch to Light Theme"
            >
              <Sun size={13} color={theme === 'light' ? '#d97706' : 'currentColor'} />
              <span>Light</span>
            </button>
            <button
              onClick={() => theme !== 'dark' && onToggleTheme()}
              className={`theme-segmented-btn ${theme === 'dark' ? 'active' : ''}`}
              title="Switch to Dark Theme"
            >
              <Moon size={13} color={theme === 'dark' ? '#818cf8' : 'currentColor'} />
              <span>Dark</span>
            </button>
          </div>
        </div>

        {/* System Health Badge */}
        {systemHealth && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            borderRadius: '8px',
            background: 'var(--surface-sunken)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: systemHealth?.database?.connected ? 'var(--status-completed)' : '#f59e0b',
              boxShadow: systemHealth?.database?.connected ? '0 0 6px rgba(16, 185, 129, 0.4)' : 'none',
              display: 'inline-block',
            }} />
            <span style={{ fontWeight: 600 }}>
              {systemHealth?.database?.connected ? 'API & Database Connected' : 'Syncing...'}
            </span>
          </div>
        )}

        {/* User Profile Card */}
        {currentUser ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            borderRadius: '10px',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div 
              onClick={onOpenLoginModal}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', overflow: 'hidden', flex: 1 }}
              title="Click to switch account"
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#475569',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                color: '#ffffff',
                border: '1.5px solid var(--primary)',
                flexShrink: 0,
              }}>
                {currentUser.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  currentUser.full_name?.charAt(0) || 'U'
                )}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.full_name}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.email}
                </div>
              </div>
            </div>

            <button
              onClick={onSignOut}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
              }}
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLoginModal}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '12px', padding: '8px 12px' }}
          >
            <span>Sign In</span>
          </button>
        )}
      </div>
    </aside>
  </>
  );
}
