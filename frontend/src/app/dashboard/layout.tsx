'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Sidebar } from './components/Sidebar';
import { NotesList } from './components/NotesList';
import { Spinner } from '@/components/ui/spinner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const DEBUG_AUTH = process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, hasHydrated, setTokens, setUser } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const refreshAttemptedRef = useRef(false);
  const [isResolvingAuth, setIsResolvingAuth] = useState(false);
  const isNoteSelected = !!params.id;

  // Safety: if persist never fires (e.g. no storage), stop blocking after 2.5s
  useEffect(() => {
    if (hasHydrated) return;
    const t = setTimeout(() => {
      useAuthStore.getState().setHasHydrated(true);
      if (DEBUG_AUTH) console.log('[auth-debug] dashboard: hydration fallback (timeout)');
    }, 2500);
    return () => clearTimeout(t);
  }, [hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) {
      if (DEBUG_AUTH) console.log('[auth-debug] dashboard: waiting for hydration');
      return;
    }
    if (isAuthenticated) {
      if (DEBUG_AUTH) console.log('[auth-debug] dashboard: already authenticated, rendering');
      return;
    }
    if (refreshAttemptedRef.current) {
      if (DEBUG_AUTH) console.log('[auth-debug] dashboard: refresh already attempted, skipping');
      return;
    }

    refreshAttemptedRef.current = true;
    setIsResolvingAuth(true);
    if (DEBUG_AUTH) console.log('[auth-debug] dashboard: refresh-start');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000);

    const trySilentRefresh = async () => {
      try {
        const response = await axios.post(
          `${API_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true, signal: controller.signal }
        );
        const { access_token } = response.data;
        setTokens(access_token);
        const meRes = await axios.get(`${API_URL}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${access_token}` },
          withCredentials: true,
        });
        setUser(meRes.data);
        if (DEBUG_AUTH) console.log('[auth-debug] dashboard: refresh-success');
      } catch (err) {
        if (DEBUG_AUTH) console.log('[auth-debug] dashboard: refresh-fail', err instanceof Error ? err.message : err);
        router.replace('/signin');
      } finally {
        clearTimeout(timeoutId);
        setIsResolvingAuth(false);
      }
    };

    trySilentRefresh();
  }, [hasHydrated, isAuthenticated, router, setTokens, setUser]);

  // Redirect when we've finished resolving and we're still not authenticated (refresh failed)
  useEffect(() => {
    if (hasHydrated && !isAuthenticated && !isResolvingAuth && refreshAttemptedRef.current) {
      if (DEBUG_AUTH) console.log('[auth-debug] dashboard: redirect-trigger (post-refresh)');
      router.replace('/signin');
    }
  }, [hasHydrated, isAuthenticated, isResolvingAuth, router]);

  if (!hasHydrated) {
    if (DEBUG_AUTH) console.log('[auth-debug] dashboard: spinner-render (waiting hydration)');
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="dashboard-shell h-screen w-full bg-background flex overflow-hidden">
        <Sidebar />
        {isNoteSelected && <NotesList />}
        <div
          className={`flex-1 overflow-hidden flex justify-center bg-background relative shadow-panel-depth ${isNoteSelected ? 'py-8 pr-16 pl-8' : 'p-0'}`}
        >
          <main
            className={`w-full h-full overflow-hidden flex relative ${
              isNoteSelected
                ? 'max-w-5xl bg-card/98 backdrop-blur-sm shadow-elevated border border-border/80 rounded-2xl'
                : 'max-w-none bg-transparent'
            }`}
          >
            {children}
          </main>
        </div>
      </div>
    );
  }

  if (DEBUG_AUTH) console.log('[auth-debug] dashboard: spinner-render (resolving auth)');
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <Spinner size="lg" />
    </div>
  );
}
