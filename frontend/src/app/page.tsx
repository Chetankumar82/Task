'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { StatsCards } from '@/components/StatsCards';
import { TaskFilters } from '@/components/TaskFilters';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TaskListView } from '@/components/TaskListView';
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
import { Plus, Sparkles, RefreshCw, Mail, CheckCircle2 } from 'lucide-react';

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
  const [scopeFilter, setScopeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

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
          status: 'all',
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
  }, [priorityFilter, scopeFilter, searchQuery, showToast]);

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: '#818cf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Hairdrama Tech Workspace
              </span>
              <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Collaborative Task Management
              </span>
            </div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.5px',
              color: '#ffffff',
            }}>
              {currentUser ? (
                <>Welcome back, <span className="gradient-text">{currentUser.full_name?.split(' ')[0]}</span> 👋</>
              ) : (
                <>Task Management for <span className="gradient-text">Product Teams</span></>
              )}
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '640px' }}>
              {currentUser 
                ? 'Create, organize, and assign tasks across team members with real-time Gmail email dispatch on task creation and completion.'
                : 'Sign in with your Google or Gmail account to assign tasks to teammates and receive automated email dispatches.'
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

        {/* Dashboard Metric Overview Cards */}
        <StatsCards stats={stats} />

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

        {/* Task Board / List Display */}
        {isLoading && tasks.length === 0 ? (
          <div style={{
            padding: '60px',
            textAlign: 'center',
            color: 'var(--text-muted)',
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
        ) : (
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
