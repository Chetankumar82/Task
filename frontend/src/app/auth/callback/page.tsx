'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { Sparkles, Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState('Completing Google authentication...');

  useEffect(() => {
    async function handleAuth() {
      try {
        if (!supabase) {
          router.push('/');
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          router.push('/?authError=' + encodeURIComponent(error.message));
          return;
        }

        if (session?.user) {
          setStatusMessage('Synchronizing user profile with backend database...');
          const user = session.user;
          const userMeta = user.user_metadata || {};

          // Sync profile with backend
          try {
            await api.syncUserProfile({
              id: user.id,
              email: user.email || '',
              full_name: userMeta.full_name || userMeta.name || user.email?.split('@')[0] || 'User',
              avatar_url: userMeta.avatar_url || userMeta.picture || '',
            });
          } catch (syncErr) {
            console.warn('Profile sync fallback:', syncErr);
          }
        }

        router.push('/');
      } catch (err) {
        console.error('Unexpected auth callback error:', err);
        router.push('/');
      }
    }

    handleAuth();
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '24px',
    }}>
      <div 
        className="glass-panel animate-fade-in"
        style={{
          maxWidth: '420px',
          width: '100%',
          padding: '36px',
          textAlign: 'center',
        }}
      >
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '18px',
          boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)',
        }}>
          <Sparkles size={26} color="#ffffff" />
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
          Signing you into Hairdrama Tech
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          {statusMessage}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Loader2 size={24} color="#818cf8" className="animate-spin" />
        </div>
      </div>
    </div>
  );
}
