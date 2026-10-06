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
import { ActiveFiltersBar } from '@/components/ActiveFiltersBar';
import { RecentTasksFeed } from '@/components/RecentTasksFeed';
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
  LayoutDashboard,
  Kanban,
  ListTodo,
  BarChart3,
  Users,
  Menu
} from 'lucide-react';

export default function DashboardPage() {
  const { showToast } = useToast();

  // Dual Theme State (Light by default vs Dark)
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

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

  // Theme preference
  useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem('app_theme') as 'dark' | 'light') || 'light';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } catch {
      document.documentElement.setAttribute('data-theme', 'light');
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

  // Session restore & initial auth check
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
          // Default to Chetan Kumar for instant preview with real Gmail integration
          const defaultUser: UserProfile = {
            id: '00adccb5-0e58-48f0-9c14-ece2794398b9',
            email: 'chetankumar8203@gmail.com',
            full_name: 'Chetan Kumar',
            avatar_url: 'https://lh3.googleusercontent.com/a/ACg8ocKZNSZHvP2ooPFqHusDm1UF4x88OboiydcF7Y6nKNFS0DY2AQ=s96-c',
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

  // Team directory and health checks
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

  // Fetch tasks and workspace metrics
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

  // Handle drag/click status updates
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

  // Create or update task
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

  // Delete task
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

  // Profile selection
  const handleSelectUser = (user: UserProfile) => {
    localStorage.removeItem('user_logged_out');
    localStorage.setItem('active_demo_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsLoginModalOpen(false);
    showToast('success', 'Signed In', `Logged in as ${user.full_name} (${user.email})`);
  };

  // Sign out
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
                      background: 'var(--surface-card)',
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
                      background: 'var(--surface-card)',
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
          {/* Active Filters Bar */}
          {(currentTab === 'kanban' || currentTab === 'list') && (
            <ActiveFiltersBar
              status={statusFilter}
              priority={priorityFilter}
              scope={scopeFilter}
              search={searchQuery}
              onClearStatus={() => setStatusFilter('all')}
              onClearPriority={() => setPriorityFilter('all')}
              onClearScope={() => setScopeFilter('all')}
              onClearSearch={() => setSearchQuery('')}
              onClearAll={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setScopeFilter('all');
                setSearchQuery('');
              }}
            />
          )}

          {/* Overview View */}
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

              {/* Recent Tasks */}
              <RecentTasksFeed
                tasks={tasks}
                onSelectTask={(t) => {
                  setEditingTask(t);
                  setIsTaskModalOpen(true);
                }}
                onViewBoard={() => setCurrentTab('kanban')}
              />
            </div>
          )}

          {/* Board View */}
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

          {/* List View */}
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

          {/* Analytics View */}
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

          {/* Team View */}
          {currentTab === 'team' && (
            <TeamView
              users={allUsers}
              tasks={tasks}
              onSelectUserFilter={() => {
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
        currentUserId={currentUser?.id}
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
