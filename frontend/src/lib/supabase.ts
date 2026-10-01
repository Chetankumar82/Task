import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-ref')
);

// Initialize client only if valid configuration exists
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Initiates Google OAuth Login Flow via Supabase.
 */
export async function signInWithGoogle(): Promise<{ error?: string; code?: string }> {
  if (!supabase) {
    return {
      error: 'Supabase credentials not configured in frontend/.env.local. Please provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    };
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data?.url) {
    try {
      // Pre-flight check: test if Supabase has Google provider enabled
      const res = await fetch(data.url, { method: 'GET' });
      if (res.status === 400) {
        const text = await res.text();
        if (text.includes('Unsupported provider') || text.includes('not enabled')) {
          return {
            code: 'PROVIDER_DISABLED',
            error: 'Google OAuth is not enabled in your Supabase project yet.'
          };
        }
      }
    } catch {
      // If CORS blocks or redirects, proceed with navigation
    }

    // Provider is enabled - redirect to Google
    if (typeof window !== 'undefined') {
      window.location.href = data.url;
    }
    return {};
  }

  return { error: 'Failed to generate Google authentication URL.' };
}

/**
 * Signs the user out of Supabase session.
 */
export async function signOutUser(): Promise<void> {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem('active_demo_user');
    localStorage.setItem('user_logged_out', 'true');
  }
}

/**
 * Retrieves the current active auth token (Supabase JWT or demo token).
 */
export async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // 1. Check live Supabase session
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        return session.access_token;
      }
    } catch {
      // fallback to stored demo user
    }
  }

  // 2. Check demo user stored in localStorage
  const demoUserJson = localStorage.getItem('active_demo_user');
  if (demoUserJson) {
    try {
      const demoUser = JSON.parse(demoUserJson) as UserProfile;
      return `mock-user-${demoUser.id}`;
    } catch {
      return null;
    }
  }

  return null;
}
