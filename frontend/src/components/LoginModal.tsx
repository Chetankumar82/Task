'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle,
  Mail,
  UserPlus,
  ExternalLink,
  Users,
  ChevronRight
} from 'lucide-react';
import { signInWithGoogle } from '@/lib/supabase';
import { UserProfile } from '@/lib/types';
import { api } from '@/lib/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: UserProfile) => void;
  allUsers: UserProfile[];
}

export function LoginModal({
  isOpen,
  onClose,
  onSelectUser,
  allUsers,
}: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<'google' | 'demo'>('google');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showProviderSetupHelp, setShowProviderSetupHelp] = useState(false);
  
  // Custom Gmail Sign In Form state
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setErrorMessage('');
    setShowProviderSetupHelp(false);
    try {
      const res = await signInWithGoogle();
      if (res?.error) {
        if (res.code === 'PROVIDER_DISABLED' || res.error.toLowerCase().includes('not enabled') || res.error.toLowerCase().includes('unsupported provider')) {
          setShowProviderSetupHelp(true);
          setShowCustomForm(true); // Automatically open the direct Gmail form for convenience
          setErrorMessage('');
        } else {
          setErrorMessage(res.error);
        }
        setLoadingGoogle(false);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Google OAuth failed to initialize');
      setLoadingGoogle(false);
    }
  };

  const handleCustomGmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customName.trim()) {
      setErrorMessage('Please enter both your name and Gmail address.');
      return;
    }

    if (!customEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmittingCustom(true);
    setErrorMessage('');

    try {
      const newProfile: UserProfile = {
        id: `usr_${Date.now()}`,
        email: customEmail.trim().toLowerCase(),
        full_name: customName.trim(),
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customName.trim())}`,
      };

      // Sync with backend API
      try {
        await api.syncUserProfile(newProfile);
      } catch {
        // Continue
      }

      onSelectUser(newProfile);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to register account.');
    } finally {
      setIsSubmittingCustom(false);
    }
  };

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
          maxWidth: '460px',
          width: '100%',
          padding: '28px',
          position: 'relative',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--card-shadow)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
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

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
            marginBottom: '12px',
          }}>
            <Sparkles size={22} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Hairdrama Tech Workspace
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Sign in to manage and assign tasks with automated Gmail notifications
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          background: 'var(--tag-bg)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '20px',
          gap: '4px',
          border: '1px solid var(--border-subtle)',
        }}>
          <button
            onClick={() => setActiveTab('google')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'google' ? 'var(--surface-card)' : 'transparent',
              color: activeTab === 'google' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'google' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Mail size={14} />
            <span>Google / Gmail</span>
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'demo' ? 'var(--surface-card)' : 'transparent',
              color: activeTab === 'demo' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'demo' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Users size={14} />
            <span>Demo Reviewers</span>
          </button>
        </div>

        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            color: '#fca5a5',
            fontSize: '12px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}>
            <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Tab 1: Google Account & Custom Gmail */}
        {activeTab === 'google' && (
          <div>
            {/* Supabase Provider Setup Notice (only if provider disabled) */}
            {showProviderSetupHelp && (
              <div style={{
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '16px',
                textAlign: 'left',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c7d2fe', fontWeight: 600, fontSize: '12px', marginBottom: '6px' }}>
                  <AlertCircle size={15} color="#818cf8" />
                  <span>Google Provider Disabled in Supabase</span>
                </div>
                <p style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4', marginBottom: '8px' }}>
                  To use OAuth popups, enable Google in your Supabase project (<strong>nrdgqzkmcuoorpeukghm</strong>) with your Google Cloud Client ID.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <a
                    href="https://supabase.com/dashboard/project/nrdgqzkmcuoorpeukghm/auth/providers"
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary"
                    style={{ fontSize: '11px', padding: '5px 10px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <span>Supabase Dashboard</span>
                    <ExternalLink size={12} />
                  </a>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Or sign in with your Gmail below 👇
                  </span>
                </div>
              </div>
            )}

            {/* Single Primary Google OAuth Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loadingGoogle}
              style={{
                width: '100%',
                background: '#ffffff',
                color: '#1f2937',
                fontWeight: 600,
                fontSize: '13px',
                padding: '11px 16px',
                borderRadius: '10px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
                marginBottom: '16px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
            >
              {/* Google SVG Logo */}
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{loadingGoogle ? 'Connecting to Google...' : 'Continue with Google (OAuth 2.0)'}</span>
            </button>

            {/* Seamless Gmail Direct Sign In Form */}
            <div style={{
              background: 'var(--tag-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '16px',
            }}>
              <div 
                onClick={() => setShowCustomForm(!showCustomForm)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={15} color="var(--primary)" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Sign in with any Gmail address
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {showCustomForm ? 'Collapse' : 'Expand'}
                </span>
              </div>

              {showCustomForm && (
                <form 
                  onSubmit={handleCustomGmailSignIn}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    marginTop: '12px',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Full Name (e.g. Chetan Kumar)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="email"
                    placeholder="Gmail (e.g. chetankumar8203@gmail.com)"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingCustom}
                    className="btn-primary"
                    style={{ fontSize: '12px', padding: '8px 14px', justifyContent: 'center' }}
                  >
                    <UserPlus size={14} />
                    <span>{isSubmittingCustom ? 'Signing in...' : 'Sign In Now'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: 1-Click Demo Reviewer Profiles */}
        {activeTab === 'demo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Select a reviewer account to instantly explore task assignment and management:
            </p>
            {allUsers.slice(0, 3).map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  onSelectUser(u);
                  onClose();
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--tag-bg)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-card-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--tag-bg)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#334155',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: '#ffffff',
                    fontWeight: 700,
                  }}>
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%' }} />
                    ) : (
                      u.full_name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{u.full_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</div>
                  </div>
                </div>
                <ChevronRight size={15} color="var(--text-muted)" />
              </button>
            ))}
          </div>
        )}

        {/* Footer Architecture Note */}
        <div style={{
          background: 'var(--tag-bg)',
          borderRadius: '8px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-subtle)',
        }}>
          <ShieldCheck size={15} color="#34d399" />
          <span>Real-time email dispatches via Gmail SMTP on task create &amp; complete.</span>
        </div>
      </div>
    </div>
  );
}
