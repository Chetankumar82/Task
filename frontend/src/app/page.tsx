'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { StatsCards } from '@/components/StatsCards';
import { TaskFilters } from '@/components/TaskFilters';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TaskListView } from '@/components/TaskListView';
import { AnalyticsCharts } from '@/components/AnalyticsCharts';
import { TaskModal } from '@/components/TaskModal';
import { LoginModal } from '@/components/LoginModal';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { 
  Task, 
  TaskStatus, 
  UserProfile, 
  DashboardStats, 
  TaskFormData, 
  SystemHealth 
} from '@/lib/types';
import { 
  Plus, 
  Sparkles, 
  RefreshCw, 
  Mail, 
  CheckCircle2, 
  BarChart3, 
  ChevronDown, 
  PieChart as PieIcon,
  Layers,
  Activity
} from 'lucide-react';

export default function DashboardPage() {
  const { showToast } = useToast();

  // App State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_tasks: 0,
    pending_tasks: 0,
    in_progress_tasks: 0,
    completed_tasks: 0,
    assigned_to_me: 0,
    created_by_me: 0,
  });
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & View State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'analytics'>('kanban');
  const [showInsights, setShowInsights] = useState(true);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 1. Initial Authentication & User Detection
  useEffect(() => {
    async function initAuth() {
      try {
        const isLoggedOut = localStorage.getItem('user_logged_out') === 'true';
        if (isLoggedOut) {
          setCurrentUser(null);
          return;
        }

        // Check live Supabase session
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const u = session.user;
            const meta = u.user_metadata || {};
            const profile: UserProfile = {
              id: u.id,
              email: u.email || '',
              full_name: meta.full_name || meta.name || u.email?.split('@')[0] || 'User',
              avatar_url: meta.avatar_url || meta.picture || '',
            };
            setCurrentUser(profile);
            return;
          }
        }

        // Check localStorage demo user
        const storedUser = localStorage.getItem('active_demo_user');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        } else {
          // Default to first demo reviewer account for instant initial preview
          const defaultUser: UserProfile = {
            id: 'usr_demo_1',
            email: 'sarah.developer@gmail.com',
            full_name: 'Sarah Connor',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
          };
          setCurrentUser(defaultUser);
          localStorage.setItem('active_demo_user', JSON.stringify(defaultUser));
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      }
    }

    initAuth();
  }, []);

  // 2. Fetch Users and System Health
  const loadInitialData = useCallback(async () => {
    try {
      const [usersData, healthData] = await Promise.all([
        api.getUsers().catch(() => []),
        api.getHealth().catch(() => null),
      ]);
      setAllUsers(usersData);
      setSystemHealth(healthData);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 3. Fetch Tasks & Statistics
  const loadTasksAndStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasksData, statsData] = await Promise.all([
        api.getTasks({
          status: viewMode === 'analytics' ? 'all' : statusFilter,
          priority: priorityFilter,
          filter: scopeFilter,
          search: searchQuery,
        }),
        api.getStats(),
      ]);

      setTasks(tasksData);
      setStats(statsData);
    } catch (err: unknown) {
      console.error('Failed to fetch tasks/stats:', err);
      showToast('error', 'Failed to load tasks', err instanceof Error ? err.message : 'Please check API connection.');
    } finally {
      setIsLoading(false);
    }
  }, [viewMode, statusFilter, priorityFilter, scopeFilter, searchQuery, showToast]);

  useEffect(() => {
    if (currentUser) {
      loadTasksAndStats();
    }
  }, [currentUser, loadTasksAndStats]);

  // 4. Handle Task Status Change
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const updated = await api.updateTask(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));

      // Refresh stats
      const newStats = await api.getStats();
      setStats(newStats);

      if (newStatus === 'completed') {
        showToast(
          'success',
          'Task Marked as Completed! 🎉',
          'Automated completion notification dispatched to team via Gmail.'
        );
      } else {
        showToast('info', `Task status updated to ${newStatus.replace('_', ' ')}`);
      }
    } catch (err: unknown) {
      showToast('error', 'Status update failed', err instanceof Error ? err.message : 'An error occurred.');
    }
  };

  // 5. Handle Task Creation or Update
  const handleTaskSubmit = async (formData: TaskFormData) => {
    try {
      if (editingTask) {
        const updated = await api.updateTask(editingTask.id, formData);
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updated : t)));
        showToast('success', 'Task Updated', 'Changes saved successfully.');
      } else {
        const created = await api.createTask(formData);
        setTasks((prev) => [created, ...prev]);

        // Find assignee name
        const assignee = allUsers.find((u) => u.id === formData.assigned_to);
        const assigneeText = assignee ? `Assigned to ${assignee.full_name} (${assignee.email})` : 'New task registered';
        
        showToast(
          'success',
          'Task Created! 🚀',
          `${assigneeText}. Automated assignment email dispatched via Gmail.`
        );
      }

      const newStats = await api.getStats();
      setStats(newStats);
      setEditingTask(null);
    } catch (err: unknown) {
      throw err;
    }
  };

  // 6. Handle Task Deletion
  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      const newStats = await api.getStats();
      setStats(newStats);
      showToast('success', 'Task Deleted', 'Task removed successfully.');
    } catch (err: unknown) {
      showToast('error', 'Delete failed', err instanceof Error ? err.message : 'You may only delete tasks you created.');
    }
  };

  // 7. Handle User Switching & Sign In
  const handleSelectUser = (user: UserProfile) => {
    localStorage.removeItem('user_logged_out');
    localStorage.setItem('active_demo_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsLoginModalOpen(false);
    showToast('success', 'Signed In', `Logged in as ${user.full_name} (${user.email})`);
  };

  // 8. Handle Sign Out
  const handleSignOut = () => {
    setCurrentUser(null);
    showToast('info', 'Signed Out', 'You have been signed out.');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onOpenCreateModal={() => {
          setEditingTask(null);
          setIsTaskModalOpen(true);
        }}
        onSwitchUser={handleSelectUser}
        allUsers={allUsers}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onSignOut={handleSignOut}
        systemHealth={systemHealth}
      />

      {/* Main Content Container */}
      <main style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '32px 28px' }}>
        {/* Welcome Hero Banner */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '28px',
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', color: '#c7d2fe', fontWeight: 600, marginBottom: '10px' }}>
              <span className="pulse-indicator" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <span>Hairdrama Tech Workspace &bull; Supabase PostgreSQL &bull; Gmail SMTP</span>
            </div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.8px',
              color: '#ffffff',
              lineHeight: 1.2,
            }}>
              {currentUser ? (
                <>Welcome back, <span className="gradient-text">{currentUser.full_name?.split(' ')[0]}</span> 👋</>
              ) : (
                <>Collaborative Task Management for <span className="gradient-text">Product Teams</span></>
              )}
            </h1>
            <p style={{ fontSize: '14px', color: '#cbd5e1', marginTop: '6px', maxWidth: '680px', lineHeight: 1.6 }}>
              {currentUser 
                ? 'Manage projects, assign teammates, and track status with real-time automated Gmail notifications on creation and completion.'
                : 'Sign in to assign tasks to teammates and receive automated email dispatches via Gmail SMTP.'
              }
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => loadTasksAndStats()}
              className="btn-secondary"
              style={{ fontSize: '13px', padding: '9px 14px' }}
              title="Refresh Data"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            {currentUser ? (
              <button
                onClick={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
                className="btn-primary"
                style={{ fontSize: '13px', padding: '10px 20px' }}
              >
                <Plus size={16} />
                <span>Create Task</span>
              </button>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="btn-primary"
                style={{ fontSize: '13px', padding: '10px 20px' }}
              >
                <Sparkles size={16} />
                <span>Sign In to Get Started</span>
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Metric Overview Cards with interactive filter selection */}
        <StatsCards 
          stats={stats}
          activeStatusFilter={statusFilter}
          activeScopeFilter={scopeFilter}
          onSelectFilter={(type, value) => {
            if (type === 'status') {
              setStatusFilter((prev) => prev === value ? 'all' : value);
            } else if (type === 'scope') {
              setScopeFilter((prev) => prev === value ? 'all' : value);
            }
          }}
        />

        {/* Executive Visual Intelligence Panel (Donut Chart, Priority Heatmap, Workload Bars) */}
        {viewMode !== 'analytics' && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
              padding: '0 4px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <BarChart3 size={15} color="#818cf8" />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.3px' }}>
                  Visual Analytics &amp; Project Health
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}>
                  Interactive Insights
                </span>
              </div>

              <button
                onClick={() => setShowInsights(!showInsights)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  color: '#cbd5e1',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = '#cbd5e1'; }}
              >
                <span>{showInsights ? 'Hide Insights' : 'Show Insights'}</span>
                <ChevronDown size={14} style={{ transform: showInsights ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
              </button>
            </div>

            {showInsights && (
              <AnalyticsCharts
                tasks={tasks}
                stats={stats}
                allUsers={allUsers}
                onFilterByStatus={(st) => setStatusFilter(st)}
                onFilterByPriority={(pr) => setPriorityFilter(pr)}
              />
            )}
          </div>
        )}

        {/* Active Filters Pill Bar (when filters applied) */}
        {(statusFilter !== 'all' || priorityFilter !== 'all' || scopeFilter !== 'all' || searchQuery.trim() !== '') && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '16px',
            padding: '8px 14px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '10px',
            fontSize: '12px',
          }}>
            <span style={{ color: '#c7d2fe', fontWeight: 600 }}>Active Filters:</span>
            {statusFilter !== 'all' && (
              <span style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                Status: <strong>{statusFilter.replace('_', ' ')}</strong>
                <button 
                  onClick={() => setStatusFilter('all')}
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 0 }}
                >&times;</button>
              </span>
            )}
            {priorityFilter !== 'all' && (
              <span style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                Priority: <strong>{priorityFilter}</strong>
                <button 
                  onClick={() => setPriorityFilter('all')}
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 0 }}
                >&times;</button>
              </span>
            )}
            {scopeFilter !== 'all' && (
              <span style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                Scope: <strong>{scopeFilter.replace('_', ' ')}</strong>
                <button 
                  onClick={() => setScopeFilter('all')}
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 0 }}
                >&times;</button>
              </span>
            )}
            {searchQuery.trim() !== '' && (
              <span style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                Search: &ldquo;{searchQuery}&rdquo;
                <button 
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 0 }}
                >&times;</button>
              </span>
            )}
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setScopeFilter('all');
                setSearchQuery('');
              }}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#818cf8',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '11px',
                textDecoration: 'underline',
              }}
            >
              Reset all filters
            </button>
          </div>
        )}

        {/* Filters & Search Toolbar */}
        <TaskFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          scopeFilter={scopeFilter}
          onScopeFilterChange={setScopeFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Task Board / List / Analytics Display */}
        {isLoading && tasks.length === 0 ? (
          <div style={{
            padding: '60px',
            textAlign: 'center',
            color: '#cbd5e1',
            fontSize: '14px',
          }}>
            <RefreshCw size={24} color="#818cf8" className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <div>Loading tasks and team assignments...</div>
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanBoard
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onEdit={(task) => {
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
            onDelete={handleDeleteTask}
            onOpenCreateModal={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            currentUserId={currentUser?.id}
          />
        ) : viewMode === 'list' ? (
          <TaskListView
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onEdit={(task) => {
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
            onDelete={handleDeleteTask}
            currentUserId={currentUser?.id}
          />
        ) : (
          <AnalyticsCharts
            tasks={tasks}
            stats={stats}
            allUsers={allUsers}
            onFilterByStatus={(st) => {
              setStatusFilter(st);
              setViewMode('kanban');
            }}
            onFilterByPriority={(pr) => {
              setPriorityFilter(pr);
              setViewMode('kanban');
            }}
          />
        )}
      </main>

      {/* Task Create / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleTaskSubmit}
        initialData={editingTask}
        users={allUsers}
      />

      {/* Google OAuth Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSelectUser={handleSelectUser}
        allUsers={allUsers}
      />

      {/* Footer */}
      <footer style={{
        marginTop: '60px',
        padding: '24px 28px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(8, 12, 20, 0.95)',
        textAlign: 'center',
        fontSize: '12px',
        color: 'var(--text-muted)',
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            &copy; 2026 <strong>Hairdrama Tech</strong> &bull; Assignment for Tech Internship
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Supabase PostgreSQL</span>
            <span>&bull;</span>
            <span>Flask REST API</span>
            <span>&bull;</span>
            <span>Next.js + TypeScript</span>
            <span>&bull;</span>
            <span>Gmail SMTP Integration</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
