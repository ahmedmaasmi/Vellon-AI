'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { api, type QuotaResponse } from '@/lib/api';
import { LogOut, LayoutDashboard, Sparkles } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, logout, user } = useAuthStore();
  const router = useRouter();
  const [quota, setQuota] = useState<QuotaResponse | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const fetchQuota = async () => {
      try {
        const res = await api.get<QuotaResponse>('/api/v1/usage/quota');
        setQuota(res.data);
      } catch {
        setQuota(null);
      }
    };
    fetchQuota();
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated) {
    return null; // Or a loading spinner
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl text-foreground">NoteMind AI</span>
          </div>

          <div className="flex items-center gap-4">
            {quota != null && (
              <span className="text-sm text-muted-foreground hidden sm:flex items-center gap-1.5" title={`Plan: ${quota.plan}. Resets ${new Date(quota.reset_period_end).toLocaleDateString()}`}>
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="capitalize">{quota.plan}</span>
                <span className="text-muted-foreground/80">·</span>
                <span className={quota.remaining === 0 ? 'text-amber-500 font-medium' : ''}>
                  AI {quota.remaining}/{quota.limit}
                </span>
              </span>
            )}
            <span className="text-sm text-muted-foreground hidden sm:inline-block" title={`Role: ${user?.role ?? '—'}`}>
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
