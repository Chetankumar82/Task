'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  LogOut, 
  ChevronDown, 
  User, 
  Mail, 
  Database, 
  Activity,
  CheckCircle2,
  LogIn
} from 'lucide-react';
import { UserProfile, SystemHealth } from '@/lib/types';
import { signOutUser } from '@/lib/supabase';

interface NavbarProps {
  currentUser: UserProfile | null;
  onOpenCreateModal: () => void;
  onSwitchUser: (user: UserProfile) => void;
  allUsers: UserProfile[];
  onOpenLoginModal: () => void;
  onSignOut: () => void;
  systemHealth?: SystemHealth | null;
}

export function Navbar({
  currentUser,
  onOpenCreateModal,
  onSwitchUser,
  allUsers,
  onOpenLoginModal,
  onSignOut,
  systemHealth,
}: NavbarProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [healthModalOpen, setHealthModalOpen] = useState(false);

  const handleSignOut = async () => {
    setUserDropdownOpen(false);
    await signOutUser();
    onSignOut();
  };

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(8, 12, 20, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '14px 28px',
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
      }}>
        {/* Brand Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
          }}>
            <Sparkles size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                fontFamily: 'var(--font-display)', 
                fontWeight: 700, 
                fontSize: '18px', 
                letterSpacing: '-0.3px',
                color: '#ffffff'
              }}>
                Hairdrama <span className="gradient-text">Tech</span>
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}>
                Task Manager
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Assignment &bull; Supabase + Flask + Next.js + Gmail OAuth
            </div>
          </div>
        </div>

        {/* System Health Status Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setHealthModalOpen(!healthModalOpen)}
            className="glass-panel-subtle"
            style={{
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              border: '1px solid var(--border-subtle)',
            }}
            title="Click to view infrastructure status"
          >
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: systemHealth?.status === 'healthy' ? '#10b981' : '#f59e0b',
              boxShadow: systemHealth?.status === 'healthy' ? '0 0 8px #10b981' : '0 0 8px #f59e0b',
            }} />
            <span>API: {systemHealth ? 'Online' : 'Connecting...'}</span>
            <Activity size={13} color="var(--text-muted)" />
          </button>

          {/* User Account / Profile Menu */}

          {/* User Account / Profile Menu */}
          {currentUser ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="glass-panel-subtle"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: '1px solid var(--border-medium)',
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#ffffff',
                }}>
                  {currentUser.avatar_url ? (
                    <img 
                      src={currentUser.avatar_url} 
                      alt={currentUser.full_name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    currentUser.full_name?.charAt(0) || 'U'
                  )}
                </div>
                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                    {currentUser.full_name}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {currentUser.email}
                  </span>
                </div>
                <ChevronDown size={14} color="var(--text-muted)" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div 
                  className="glass-panel animate-fade-in"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '260px',
                    padding: '8px',
                    zIndex: 100,
                  }}
                >
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '6px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Logged in as
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginTop: '2px' }}>
                      {currentUser.full_name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {currentUser.email}
                    </div>
                  </div>

                  {/* Switch User / Demo Accounts */}
                  <div style={{ padding: '4px 10px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Switch Account (Reviewer Demo)
                  </div>
                  {allUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        onSwitchUser(user);
                        setUserDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: user.id === currentUser.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        color: user.id === currentUser.id ? '#818cf8' : 'var(--text-primary)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#334155',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                        }}>
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%' }} />
                          ) : (
                            user.full_name.charAt(0)
                          )}
                        </div>
                        <span>{user.full_name}</span>
                      </div>
                      {user.id === currentUser.id && <CheckCircle2 size={13} color="#818cf8" />}
                    </button>
                  ))}

                  <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '6px 0' }} />

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenLoginModal();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'transparent',
                      color: '#a5b4fc',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <User size={14} />
                    <span>Sign In with Another Account</span>
                  </button>

                  <button
                    onClick={handleSignOut}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'transparent',
                      color: '#f87171',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="btn-primary"
              style={{ fontSize: '13px', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Infrastructure Diagnostics Modal */}
      {healthModalOpen && systemHealth && (
        <div 
          className="glass-panel animate-modal-pop"
          style={{
            position: 'absolute',
            top: 'calc(100% + 12px)',
            right: '28px',
            width: '320px',
            padding: '18px',
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#ffffff' }}>System Architecture Status</span>
            <button 
              onClick={() => setHealthModalOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}
            >
              &times;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Backend Engine:</span>
              <span style={{ color: '#ffffff', fontWeight: 500 }}>Flask 3.1 (Python)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Database:</span>
              <span style={{ color: '#34d399', fontWeight: 500 }}>
                {systemHealth.database.type === 'supabase_postgresql' ? 'Supabase PostgreSQL' : 'Local Data Layer (Dev)'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Email Service:</span>
              <span style={{ color: systemHealth.email_service.configured ? '#34d399' : '#fbbf24', fontWeight: 500 }}>
                {systemHealth.email_service.configured ? 'Gmail SMTP (Active)' : 'Simulated SMTP (Console)'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>Frontend:</span>
              <span style={{ color: '#ffffff', fontWeight: 500 }}>Next.js 15 (TypeScript)</span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
