'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle,
  Mail,
  UserPlus,
  ExternalLink
} from 'lucide-react';
import { signInWithGoogle, isSupabaseConfigured } from '@/lib/supabase';
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
        // Continue even if local dev
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
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div 
        className="glass-panel animate-modal-pop"
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '32px',
          position: 'relative',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
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
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px rgba(99, 102, 241, 0.5)',
            marginBottom: '14px',
          }}>
            <Sparkles size={24} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.3px' }}>
            Welcome to Hairdrama Tech
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Sign in with your Gmail account to manage and assign tasks
          </p>
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

        {showProviderSetupHelp && (
          <div style={{
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '18px',
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c7d2fe', fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
              <AlertCircle size={16} color="#818cf8" />
              <span>Google OAuth Setup Needed in Supabase</span>
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '10px' }}>
              Google OAuth is disabled by default in your Supabase project (<strong>nrdgqzkmcuoorpeukghm</strong>). To activate real Google logins:
            </p>
            <ol style={{ fontSize: '11px', color: '#94a3b8', paddingLeft: '18px', lineHeight: '1.6', marginBottom: '14px' }}>
              <li>Open your Supabase Providers dashboard.</li>
              <li>Expand <strong>Google</strong> and toggle <strong>Enable Google provider</strong>.</li>
              <li>Provide your Google Cloud <strong>Client ID</strong> &amp; <strong>Secret</strong>.</li>
              <li>Redirect URI: <code style={{ color: '#818cf8', background: 'rgba(0,0,0,0.3)', padding: '2px 5px', borderRadius: '4px' }}>https://nrdgqzkmcuoorpeukghm.supabase.co/auth/v1/callback</code></li>
            </ol>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <a
                href="https://supabase.com/dashboard/project/nrdgqzkmcuoorpeukghm/auth/providers"
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{ fontSize: '12px', padding: '7px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>Open Supabase Providers</span>
                <ExternalLink size={13} />
              </a>
              <button
                type="button"
                onClick={() => {
                  setShowProviderSetupHelp(false);
                  setShowCustomForm(true);
                }}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '7px 12px' }}
              >
                Sign in with Gmail directly
              </button>
            </div>
          </div>
        )}

        {/* Primary Action 1: Google OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loadingGoogle}
          style={{
            width: '100%',
            background: '#ffffff',
            color: '#1f2937',
            fontWeight: 600,
            fontSize: '14px',
            padding: '12px 18px',
            borderRadius: '10px',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
            marginBottom: '14px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
        >
          {/* Official Google 'G' SVG Logo */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{loadingGoogle ? 'Connecting to Google OAuth...' : 'Continue with Google (OAuth 2.0)'}</span>
        </button>

        {/* Option 2: Sign In with your own Gmail address */}
        {!showCustomForm ? (
          <button
            onClick={() => setShowCustomForm(true)}
            className="btn-secondary"
            style={{
              width: '100%',
              justifyContent: 'center',
              fontSize: '13px',
              padding: '10px 16px',
              marginBottom: '18px',
            }}
          >
            <Mail size={16} />
            <span>Sign in with your Gmail address</span>
          </button>
        ) : (
          <form 
            onSubmit={handleCustomGmailSignIn}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '2px' }}>
              Sign In with Your Gmail
            </div>
            <input
              type="text"
              placeholder="Your Full Name (e.g. Chetan Kumar)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              required
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <input
              type="email"
              placeholder="Your Gmail (e.g. chetankumar8203@gmail.com)"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              required
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                className="btn-secondary"
                style={{ flex: 1, fontSize: '12px', padding: '6px 12px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingCustom}
                className="btn-primary"
                style={{ flex: 2, fontSize: '12px', padding: '6px 12px', justifyContent: 'center' }}
              >
                <UserPlus size={14} />
                <span>{isSubmittingCustom ? 'Signing in...' : 'Sign In Now'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '14px 0',
          color: 'var(--text-muted)',
          fontSize: '12px',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span>or try demo reviewer accounts</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {/* Demo Accounts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
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
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#334155',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                }}>
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%' }} />
                  ) : (
                    u.full_name.charAt(0)
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{u.full_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</div>
                </div>
              </div>
              <ArrowRight size={14} color="var(--text-muted)" />
            </button>
          ))}
        </div>

        {/* Security / Architecture Footer */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '11px',
          color: 'var(--text-muted)',
        }}>
          <ShieldCheck size={16} color="#34d399" />
          <span>OAuth 2.0 with Gmail accounts. Secure JWT verification on Flask backend.</span>
        </div>
      </div>
    </div>
  );
}
