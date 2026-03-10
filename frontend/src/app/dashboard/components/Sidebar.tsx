'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Heart,
  Archive,
  Trash2,
  Tag,
  Plus,
  Settings,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface NoteCounts {
  all: number;
  archived: number;
  pinned: number;
  favorite: number;
  deleted: number;
}

interface TagItem {
  id: string;
  name: string;
}

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') ?? 'all';
  const tagId = searchParams.get('tag_id') ?? null;
  const [counts, setCounts] = useState<NoteCounts>({
    all: 0,
    archived: 0,
    pinned: 0,
    favorite: 0,
    deleted: 0,
  });
  const [tags, setTags] = useState<TagItem[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await api.get<NoteCounts>('/api/v1/notes/counts');
      setCounts(res.data);
    } catch {
      // keep defaults
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const res = await api.get<TagItem[]>('/api/v1/tags');
      setTags(res.data);
    } catch {
      setTags([]);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    fetchTags();
  }, [fetchCounts, fetchTags]);

  useEffect(() => {
    const onRefresh = () => {
      fetchCounts();
      fetchTags();
    };
    window.addEventListener('dashboard:refresh-notes', onRefresh);
    return () => window.removeEventListener('dashboard:refresh-notes', onRefresh);
  }, [fetchCounts, fetchTags]);

  const handleLogout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } finally {
      logout();
      window.location.href = '/signin';
    }
  };

  const isActive = (f: string, tId: string | null = null) => {
    if (tId !== null) return filter === 'all' && tagId === tId;
    if (f === 'all') return filter === 'all' && !tagId;
    return filter === f;
  };

  const linkClass = (active: boolean) =>
    active
      ? 'flex items-center justify-between px-3 py-2 rounded-xl bg-[#f8ebe8] text-[#935b52] font-medium'
      : 'flex items-center justify-between px-3 py-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors';

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    try {
      await api.post('/api/v1/tags', { name });
      setNewTagName('');
      setShowAddTag(false);
      fetchTags();
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
    } catch {
      // show error or toast
    }
  };

  return (
    <aside className="w-64 h-full border-r border-border bg-card flex flex-col z-20">
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-4 flex items-center justify-between sticky top-0 bg-card z-10">
          <Link
            href="/dashboard"
            className="font-bold text-xl text-foreground flex items-center gap-2 hover:text-primary transition-colors"
          >
            <div className="bg-[#e4b5ab] text-white p-1 rounded-md">
              <FileText className="h-5 w-5" />
            </div>
            Vellon AI
          </Link>
          <Button variant="ghost" size="icon" className="text-muted-foreground" asChild>
            <Link href="/dashboard/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        <div className="px-4 py-2">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-muted/30">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#c58a80] flex items-center justify-center text-white font-medium">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold truncate">
                {user?.email?.split('@')[0] || 'User'}
              </span>
              <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-4 space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              Quick Links
            </h3>
            <nav className="space-y-1">
              <Link
                href="/dashboard"
                className={linkClass(isActive('all'))}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4" />
                  <span>All Notes</span>
                </div>
                <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full">{counts.all}</span>
              </Link>
              <Link
                href="/dashboard?filter=favorites"
                className={linkClass(isActive('favorites'))}
              >
                <div className="flex items-center gap-3">
                  <Heart className="h-4 w-4" />
                  <span>Favorites</span>
                </div>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{counts.favorite}</span>
              </Link>
              <Link
                href="/dashboard?filter=archived"
                className={linkClass(isActive('archived'))}
              >
                <div className="flex items-center gap-3">
                  <Archive className="h-4 w-4" />
                  <span>Archived</span>
                </div>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{counts.archived}</span>
              </Link>
              <Link
                href="/dashboard?filter=deleted"
                className={linkClass(isActive('deleted'))}
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="h-4 w-4" />
                  <span>Recently Deleted</span>
                </div>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{counts.deleted}</span>
              </Link>
            </nav>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tags
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => setShowAddTag((v) => !v)}
                title="Add tag"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {showAddTag && (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Tag name"
                  className="flex-1 px-2 py-1.5 text-sm border border-border rounded-lg bg-background"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                />
                <Button size="sm" onClick={handleCreateTag}>
                  Add
                </Button>
              </div>
            )}
            <nav className="space-y-1">
              {tags.map((t) => (
                <Link
                  key={t.id}
                  href={`/dashboard?tag_id=${t.id}`}
                  className={linkClass(isActive('all', t.id))}
                >
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4" />
                    <span>{t.name}</span>
                  </div>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-4 mt-auto border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}
