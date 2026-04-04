'use client';

import { useEffect, useState } from 'react';
import { Settings, ArrowLeft, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { useAppTheme } from '@/components/providers/AppProviders';

export default function DashboardSettingsPage() {
  const { user, setUser } = useAuthStore();
  const { resolved, toggleLightDark } = useAppTheme();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(user?.display_name ?? '');
    setAvatarUrl(user?.avatar_url ?? '');
  }, [user?.display_name, user?.avatar_url]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch('/api/v1/auth/me', {
        display_name: displayName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      });
      setUser(res.data);
      toast.success('Profile updated');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-y-auto bg-transparent p-6 md:p-10">
      <div className="max-w-lg mx-auto w-full space-y-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/dashboard" aria-label="Back to dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-accent p-4 rounded-full shadow-sm border border-border">
              <Settings className="h-8 w-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground">Profile and appearance</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-card space-y-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Appearance</h2>
          <p className="text-sm text-muted-foreground">Toggle light or dark mode. Your choice is saved on this device.</p>
          <Button type="button" variant="outline" className="gap-2" onClick={() => toggleLightDark()}>
            {resolved === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          </Button>
        </div>

        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-card space-y-5"
        >
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Profile</h2>
          <div className="space-y-2">
            <label htmlFor="settings-display-name" className="text-sm font-medium text-foreground">
              Display name
            </label>
            <Input
              id="settings-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-avatar" className="text-sm font-medium text-foreground">
              Avatar URL
            </label>
            <Input
              id="settings-avatar"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…"
              type="url"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">Optional image URL shown in the app shell.</p>
          </div>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Spinner size="sm" /> : null}
            Save profile
          </Button>
        </form>
      </div>
    </div>
  );
}
