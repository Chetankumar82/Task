'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Calendar, 
  AlertCircle, 
  User, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { Task, TaskPriority, TaskFormData, UserProfile } from '@/lib/types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: TaskFormData) => Promise<void>;
  initialData?: Task | null;
  users: UserProfile[];
}

export function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  users,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setPriority(initialData.priority);
      setDueDate(initialData.due_date || '');
      setAssignedTo(initialData.assigned_to || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setAssignedTo('');
    }
    setValidationError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Please enter a task title.');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: dueDate || undefined,
        assigned_to: assignedTo || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorities: { id: TaskPriority; label: string; color: string }[] = [
    { id: 'low', label: 'Low', color: '#94a3b8' },
    { id: 'medium', label: 'Medium', color: '#60a5fa' },
    { id: 'high', label: 'High', color: '#fb923c' },
    { id: 'urgent', label: 'Urgent', color: '#f87171' },
  ];

  const selectedUser = users.find((u) => u.id === assignedTo);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      background: 'var(--modal-backdrop)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div 
        className="glass-panel animate-modal-pop modal-card-responsive"
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: '28px',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid var(--border-medium)',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {initialData ? 'Edit Task' : 'Create New Task'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {initialData ? 'Update task details and assignment' : 'Add task and assign team members'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--tag-bg)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {validationError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#fca5a5',
            fontSize: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertCircle size={15} />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title Input */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Task Title <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Integrate Supabase Auth with Google OAuth"
              required
              style={{
                width: '100%',
                background: 'var(--surface-card-hover)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Description Textarea */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe requirements, acceptance criteria, or links..."
              rows={3}
              style={{
                width: '100%',
                background: 'var(--surface-card-hover)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Priority Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Priority Level
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {priorities.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: priority === p.id ? `2px solid ${p.color}` : '1px solid var(--border-subtle)',
                    background: priority === p.id ? 'var(--primary-glow)' : 'var(--tag-bg)',
                    color: priority === p.id ? p.color : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date & Assignee Grid */}
          <div className="modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Due Date */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Due Date
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--surface-card-hover)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Assignee Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Assign To (Team Member)
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--surface-card-hover)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="" style={{ background: 'var(--surface-card)', color: 'var(--text-muted)' }}>
                  Unassigned
                </option>
                {users.map((u) => (
                  <option key={u.id} value={u.id} style={{ background: 'var(--surface-card)', color: 'var(--text-primary)' }}>
                    {u.full_name} ({u.email})
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Mail size={12} color="var(--primary)" />
                <span>{selectedUser ? `Email notification will be sent to ${selectedUser.email}` : 'Assignee will receive an email alert'}</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary"
              style={{ fontSize: '13px', padding: '9px 18px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ fontSize: '13px', padding: '9px 22px' }}
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>{initialData ? 'Save Changes' : 'Create Task'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
