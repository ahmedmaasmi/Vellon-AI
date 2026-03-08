'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { NotesList } from './components/NotesList';
import { QuickAccessTabs } from './components/QuickAccessTabs';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin');
      return;
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // Or a loading spinner
  }

  return (
    <div className="h-screen w-full bg-[#faf5f3] flex overflow-hidden">
      {/* Sidebar - fixed on the left */}
      <Sidebar />

      {/* Notes List - Middle Column */}
      <NotesList />

      {/* Main Content Area - flex-1 takes remaining space */}
      <main className="flex-1 overflow-hidden flex relative bg-white rounded-tl-3xl shadow-sm border-l border-t border-border mt-2 mr-2">
        {children}
      </main>

      {/* Quick Access Agenda Tabs */}
      <QuickAccessTabs />
    </div>
  );
}
