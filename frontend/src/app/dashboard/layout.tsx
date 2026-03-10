'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Sidebar } from './components/Sidebar';
import { NotesList } from './components/NotesList';
import { Spinner } from '@/components/ui/spinner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, hasHydrated, setTokens, setUser } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const refreshAttemptedRef = useRef(false);
  const isNoteSelected = !!params.id;

  useEffect(() => {
    if (!hasHydrated) return;
    if (isAuthenticated) return;
    if (refreshAttemptedRef.current) return;

    refreshAttemptedRef.current = true;
    const trySilentRefresh = async () => {
      try {
        const response = await axios.post(
          `${API_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { access_token } = response.data;
        setTokens(access_token);
        const meRes = await axios.get(`${API_URL}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${access_token}` },
          withCredentials: true,
        });
        setUser(meRes.data);
      } catch {
        router.replace('/signin');
      }
    };

    trySilentRefresh();
  }, [hasHydrated, isAuthenticated, router, setTokens, setUser]);

  if (!hasHydrated) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background flex overflow-hidden">
      {/* Sidebar - fixed on the left */}
      <Sidebar />

      {/* Notes List - Middle Column (only shown when a note is selected) */}
      {isNoteSelected && <NotesList />}

      {/* Main Content Area */}
      <div className={`flex-1 overflow-hidden flex justify-center bg-background relative ${isNoteSelected ? 'py-8 pr-16 pl-8' : 'p-0'}`}>
        <main className={`w-full h-full overflow-hidden flex relative ${
          isNoteSelected 
            ? 'max-w-5xl bg-card shadow-xl border border-border rounded-sm' 
            : 'max-w-none bg-background'
        }`}>
          {children}
        </main>
      </div>
    </div>
  );
}
