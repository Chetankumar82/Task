'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from '@/components/Sidebar';
import { StatsCards } from '@/components/StatsCards';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TaskListView } from '@/components/TaskListView';
import { AnalyticsCharts } from '@/components/AnalyticsCharts';
import { TeamView } from '@/components/TeamView';
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
  Search, 
  Filter, 
  X,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  Kanban,
  ListTodo,
  BarChart3,
  Users,
  Clock,
  ArrowRight,
  Menu
} from 'lucide-react';

export default function DashboardPage() {
  const { showToast } = useToast();

  // Dual Theme State (Light vs Dark)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Navigation State (default to rich overview with charts & metrics)
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Modals State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 1. Initialize Theme from localStorage
  useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem('app_theme') as 'dark' | 'light') || 'dark';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } catch {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('app_theme', nextTheme);
    } catch {}
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // 2. Initial Authentication & User Detection
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
          // Default to first demo reviewer account for instant preview
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

  // 3. Fetch Users and System Health
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

  // 4. Fetch Tasks & Statistics
  const loadTasksAndStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const isTaskView = currentTab === 'kanban' || currentTab === 'list';
      const [tasksData, statsData] = await Promise.all([
        api.getTasks({
          status: isTaskView ? statusFilter : 'all',
          priority: isTaskView ? priorityFilter : 'all',
          filter: isTaskView ? scopeFilter : 'all',
          search: isTaskView ? searchQuery : '',
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
  }, [currentTab, statusFilter, priorityFilter, scopeFilter, searchQuery, showToast]);

  useEffect(() => {
    if (currentUser) {
      loadTasksAndStats();
    }
  }, [currentUser, loadTasksAndStats]);

  // 5. Handle Task Status Change
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const updated = await api.updateTask(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));

      const newStats = await api.getStats();
      setStats(newStats);

      if (newStatus === 'completed') {
        showToast(
          'success',
          'Task Completed',
          'Task marked as completed.'
        );
      } else {
        showToast('info', `Status updated to ${newStatus.replace('_', ' ')}`);
      }
    } catch (err: unknown) {
      showToast('error', 'Status update failed', err instanceof Error ? err.message : 'An error occurred.');
    }
  };

  // 6. Handle Task Creation or Update
  const handleTaskSubmit = async (formData: TaskFormData) => {
    try {
      if (editingTask) {
        const updated = await api.updateTask(editingTask.id, formData);
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updated : t)));
        showToast('success', 'Task Updated', 'Changes saved successfully.');
      } else {
        const created = await api.createTask(formData);
        setTasks((prev) => [created, ...prev]);

        const assignee = allUsers.find((u) => u.id === formData.assigned_to);
        const assigneeText = assignee ? `Assigned to ${assignee.full_name} (${assignee.email})` : 'New task registered';
        
        showToast(
          'success',
          'Task Created',
          assigneeText
        );
      }

      const newStats = await api.getStats();
      setStats(newStats);
      setEditingTask(null);
    } catch (err: unknown) {
      throw err;
    }
  };

  // 7. Handle Task Deletion
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

  // 8. Handle User Switching & Sign In
  const handleSelectUser = (user: UserProfile) => {
    localStorage.removeItem('user_logged_out');
    localStorage.setItem('active_demo_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsLoginModalOpen(false);
    showToast('success', 'Signed In', `Logged in as ${user.full_name} (${user.email})`);
  };

  // 9. Handle Sign Out
  const handleSignOut = () => {
    localStorage.setItem('user_logged_out', 'true');
    localStorage.removeItem('active_demo_user');
    setCurrentUser(null);
    showToast('info', 'Signed Out', 'You have been signed out.');
  };

  const tabTitles: { [key in NavTab]: { title: string; subtitle: string; icon: typeof Kanban } } = {
    overview: { title: 'Overview', subtitle: 'Workspace metrics & activity', icon: LayoutDashboard },
    kanban: { title: 'Board', subtitle: 'Task workflow & progression', icon: Kanban },
    list: { title: 'List', subtitle: 'Task directory & table', icon: ListTodo },
    analytics: { title: 'Analytics', subtitle: 'Performance & distribution', icon: BarChart3 },
    team: { title: 'Team', subtitle: 'Workspace collaborators', icon: Users },
  };

  const CurrentIcon = tabTitles[currentTab].icon;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Left Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        scopeFilter={scopeFilter}
        onSelectScope={setScopeFilter}
        currentUser={currentUser}
        onOpenCreateModal={() => {
          setEditingTask(null);
          setIsTaskModalOpen(true);
        }}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onSignOut={handleSignOut}
        theme={theme}
        onToggleTheme={toggleTheme}
        stats={stats}
        systemHealth={systemHealth}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Workspace Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Top Header Bar */}
        <header className="header-bar" style={{
          height: '64px',
          padding: '0 28px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-glass)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          gap: '16px',
        }}>
          {/* Left: Hamburger Button (Mobile) + View Breadcrumb & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="mobile-menu-btn"
              title="Open Navigation Menu"
            >
              <Menu size={18} />
            </button>

            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <CurrentIcon size={16} color="var(--primary)" />
            </div>
            <div>
              <div className="header-title-text" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                {tabTitles[currentTab].title}
              </div>
              <div className="header-subtitle-text" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {tabTitles[currentTab].subtitle} &bull; {currentTab === 'overview' ? `${stats.total_tasks} total tasks` : `${tasks.length} tasks`}
              </div>
            </div>
          </div>

          {/* Right: Search, Priority Filter, Refresh, Create Task */}
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Search and Priority Filter are shown ONLY on Board and List View */}
            {(currentTab === 'kanban' || currentTab === 'list') && (
              <>
                {/* Search Input */}
                <div className="header-search" style={{ position: 'relative', width: '200px' }}>
                  <Search 
                    size={14} 
                    color="var(--primary)" 
                    style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} 
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    style={{
                      width: '100%',
                      background: 'var(--surface-card-hover)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '7px 28px 7px 32px',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Priority Filter Dropdown */}
                <div className="header-priority-filter" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Filter size={13} color="var(--primary)" />
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    style={{
                      background: 'var(--surface-card-hover)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </>
            )}

            {/* Refresh Button */}
            <button
              onClick={() => loadTasksAndStats()}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '7px 12px', borderRadius: '8px' }}
              title="Refresh Tasks"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            </button>

            {/* Create Task Button */}
            {currentUser ? (
              <button
                onClick={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
                className="btn-primary"
                style={{ fontSize: '12px', padding: '7px 14px', borderRadius: '8px' }}
              >
                <Plus size={14} />
                <span className="btn-create-text">Create Task</span>
              </button>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="btn-primary"
                style={{ fontSize: '12px', padding: '7px 14px', borderRadius: '8px' }}
              >
                <Sparkles size={14} />
                <span className="btn-create-text">Sign In</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="main-canvas" style={{ flex: 1, padding: '28px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          {/* Active Filters Pill Bar (shown only on Board and List View when filters applied) */}
          {(currentTab === 'kanban' || currentTab === 'list') && (statusFilter !== 'all' || priorityFilter !== 'all' || scopeFilter !== 'all' || searchQuery.trim() !== '') && (
            <div style={{
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
            }}>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Active Filters:</span>
              {statusFilter !== 'all' && (
                <span style={{
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  Status: <strong>{statusFilter.replace('_', ' ')}</strong>
                  <button 
                    onClick={() => setStatusFilter('all')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >&times;</button>
                </span>
              )}
              {priorityFilter !== 'all' && (
                <span style={{
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  Priority: <strong>{priorityFilter}</strong>
                  <button 
                    onClick={() => setPriorityFilter('all')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >&times;</button>
                </span>
              )}
              {scopeFilter !== 'all' && (
                <span style={{
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  Scope: <strong>{scopeFilter.replace('_', ' ')}</strong>
                  <button 
                    onClick={() => setScopeFilter('all')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >&times;</button>
                </span>
              )}
              {searchQuery.trim() !== '' && (
                <span style={{
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  Search: &ldquo;{searchQuery}&rdquo;
                  <button 
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
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
                  color: 'var(--primary)',
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

          {/* TAB 1: OVERVIEW */}
          {currentTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* Executive Stat Cards */}
              <StatsCards 
                stats={stats}
                activeStatusFilter={statusFilter}
                activeScopeFilter={scopeFilter}
                onSelectFilter={(type, value) => {
                  if (type === 'status') {
                    setStatusFilter(value);
                    setCurrentTab('kanban');
                  } else if (type === 'scope') {
                    setScopeFilter(value);
                    setCurrentTab('kanban');
                  }
                }}
              />

              {/* Visual Analytics Donut Chart & Priority Heatmap */}
              <AnalyticsCharts
                tasks={tasks}
                stats={stats}
                allUsers={allUsers}
                onFilterByStatus={(st) => {
                  setStatusFilter(st);
                  setCurrentTab('kanban');
                }}
                onFilterByPriority={(pr) => {
                  setPriorityFilter(pr);
                  setCurrentTab('kanban');
                }}
              />

              {/* Recent Tasks Preview */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Recent Tasks
                  </h3>
                  <button
                    onClick={() => setCurrentTab('kanban')}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    <span>View Board</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tasks.length > 0 ? (
                    tasks.slice(0, 5).map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setEditingTask(t);
                          setIsTaskModalOpen(true);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'var(--surface-card-hover)',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-medium)';
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          <span 
                            className={`badge-status-${t.status.replace('_', '')}`} 
                            style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', textTransform: 'capitalize', flexShrink: 0 }}
                          >
                            {t.status.replace('_', ' ')}
                          </span>
                          <span 
                            className={`badge-priority-${t.priority}`}
                            style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', flexShrink: 0 }}
                          >
                            {t.priority}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.title}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                          {t.assignee ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: '#475569',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '9px',
                                fontWeight: 600,
                                color: '#ffffff',
                              }}>
                                {t.assignee.avatar_url ? (
                                  <img src={t.assignee.avatar_url} alt="" style={{ width: '100%', height: '100%' }} />
                                ) : (
                                  t.assignee.full_name?.charAt(0) || 'U'
                                )}
                              </div>
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {t.assignee.full_name?.split(' ')[0]}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Unassigned</span>
                          )}
                          <ChevronRight size={14} color="var(--text-muted)" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                      No tasks created yet. Click "+ Create Task" to get started.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KANBAN BOARD */}
          {currentTab === 'kanban' && (
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
          )}

          {/* TAB 3: TABLE LIST VIEW */}
          {currentTab === 'list' && (
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
          )}

          {/* TAB 4: DEEP ANALYTICS */}
          {currentTab === 'analytics' && (
            <AnalyticsCharts
              tasks={tasks}
              stats={stats}
              allUsers={allUsers}
              onFilterByStatus={(st) => {
                setStatusFilter(st);
                setCurrentTab('kanban');
              }}
              onFilterByPriority={(pr) => {
                setPriorityFilter(pr);
                setCurrentTab('kanban');
              }}
            />
          )}

          {/* TAB 5: TEAM COLLABORATORS */}
          {currentTab === 'team' && (
            <TeamView
              users={allUsers}
              tasks={tasks}
              onSelectUserFilter={(userId) => {
                setScopeFilter('all');
                setSearchQuery('');
                setCurrentTab('list');
              }}
            />
          )}
        </main>
      </div>

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
    </div>
  );
}
