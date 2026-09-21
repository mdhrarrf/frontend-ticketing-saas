'use client';

import { Suspense, useEffect } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { apiService } from '../../../lib/api';
import { Loader2 } from 'lucide-react';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      router.push('/login?error=oauth_failed');
      return;
    }

    // Set token temporarily in Zustand so apiService interceptor can use it
    useAuthStore.setState({ token });

    const fetchProfile = async () => {
      try {
        const res = await apiService.auth.me();
        const user = (res as any)?.data ?? res;
        setAuth(user, token);
        
        // Redirect to profile completion if required fields are missing
        if (!user.phone || !user.id_number) {
          router.push('/complete-profile');
        } else {
          router.push('/dashboard');
        }
      } catch (e) {
        localStorage.removeItem('auth_token');
        router.push('/login?error=oauth_failed');
      }
    };

    fetchProfile();
  }, [searchParams, router, setAuth]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <Loader2 size={40} style={{ animation: 'spin-slow 0.8s linear infinite', color: 'var(--color-primary)' }} />
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Menghubungkan akun...</h2>
      <p style={{ color: 'var(--text-muted)' }}>Mohon tunggu sebentar.</p>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={40} style={{ animation: 'spin-slow 0.8s linear infinite', color: 'var(--color-primary)' }} />
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
