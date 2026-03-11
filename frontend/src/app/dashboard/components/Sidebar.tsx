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
  PanelLeftClose,
  PanelRightOpen,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import {
  getTagDotClass,
  getTagDotStyle,
  TAG_DOT_CLASSES,
  setTagColor,
  TAG_COLOR_COUNT,
  getRecentColors,
  addRecentColor,
  addCustomColor,
  type TagColorValue,
} from '@/lib/tag-colors';

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
  const { logout } = useAuthStore();
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') ?? 'all';
  const tagId = searchParams.get('tag_id') ?? null;
  const [collapsed, setCollapsed] = useState(false);
  const [counts, setCounts] = useState<NoteCounts>({
    all: 0,
    archived: 0,
    pinned: 0,
    favorite: 0,
    deleted: 0,
  });
  const [tags, setTags] = useState<TagItem[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<TagColorValue>(0);
  const [showAddTag, setShowAddTag] = useState(false);
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
  const [pendingCustomHex, setPendingCustomHex] = useState('#6366f1');
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [createTagError, setCreateTagError] = useState('');

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
    setCreateTagError('');
    try {
      const res = await api.post<TagItem>('/api/v1/tags', { name });
      setTagColor(res.data.id, newTagColor);
      addRecentColor(typeof newTagColor === 'number' ? String(newTagColor) : newTagColor);
      setNewTagName('');
      setNewTagColor(0);
      setShowAddTag(false);
      fetchTags();
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'detail' in err.response.data
          ? String((err.response.data as { detail: unknown }).detail)
          : err instanceof Error
            ? err.message
            : 'Failed to create tag';
      setCreateTagError(message);
    }
  };

  const isColorSelected = (value: string | number) => {
    if (typeof value === 'number') return newTagColor === value;
    if (value.startsWith('#')) return newTagColor === value;
    return newTagColor === parseInt(value, 10);
  };

  const handleRecentOrPaletteClick = (value: string | number) => {
    const v = typeof value === 'string' && /^\d$/.test(value) ? parseInt(value, 10) : value;
    setNewTagColor(v);
  };

  const handleUseCustomColor = () => {
    const hex = pendingCustomHex.startsWith('#') ? pendingCustomHex : `#${pendingCustomHex}`;
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
    addCustomColor(hex);
    addRecentColor(hex);
    setNewTagColor(hex);
    setRecentColors(getRecentColors());
    setShowCustomColorPicker(false);
  };

  useEffect(() => {
    if (showAddTag) setRecentColors(getRecentColors());
  }, [showAddTag]);

  return (
    <aside
      className={`h-full border-r border-border bg-card flex flex-col z-20 transition-[width] duration-200 ${
        collapsed ? 'w-14' : 'w-64'
      }`}
    >
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-4 flex items-center justify-between sticky top-0 bg-card z-10">
          {!collapsed && (
            <Link
              href="/dashboard"
              className="font-bold text-xl text-foreground hover:text-primary transition-colors"
            >
              Vellon AI
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelRightOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>
        </div>

        {!collapsed && (
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

          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tags
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const next = !showAddTag;
                  if (next) setCreateTagError('');
                  setShowAddTag(next);
                }}
                title="Add tag"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {showAddTag && (
              <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg border border-border bg-card shadow-lg p-2.5 space-y-2.5">
                <input
                  type="text"
                  placeholder="Tag name"
                  className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newTagName}
                  onChange={(e) => {
                    setNewTagName(e.target.value);
                    setCreateTagError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                  autoFocus
                />
                <div className="space-y-2">
                  {recentColors.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground w-full">Recent</span>
                      {recentColors.map((v) => (
                        <button
                          key={v}
                          type="button"
                          title={v.startsWith('#') ? v : `Palette ${v}`}
                          onClick={() => handleRecentOrPaletteClick(v)}
                          className={`h-5 w-5 rounded-full flex-shrink-0 transition-transform hover:scale-110 ${
                            v.startsWith('#') ? '' : TAG_DOT_CLASSES[parseInt(v, 10)] ?? ''
                          } ${isColorSelected(v.startsWith('#') ? v : parseInt(v, 10)) ? 'ring-2 ring-offset-2 ring-offset-card ring-foreground/30' : ''}`}
                          style={v.startsWith('#') ? { backgroundColor: v } : undefined}
                          aria-label="Choose recent color"
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-muted-foreground mr-1">Color</span>
                    {Array.from({ length: TAG_COLOR_COUNT }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        title={`Color ${i + 1}`}
                        onClick={() => handleRecentOrPaletteClick(i)}
                        className={`h-5 w-5 rounded-full flex-shrink-0 transition-transform hover:scale-110 ${TAG_DOT_CLASSES[i]} ${
                          isColorSelected(i) ? 'ring-2 ring-offset-2 ring-offset-card ring-foreground/30' : ''
                        }`}
                        aria-label={`Choose color ${i + 1}`}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowCustomColorPicker((v) => !v)}
                      className="h-5 w-5 rounded-full flex-shrink-0 border-2 border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center"
                      title="Create custom color"
                      aria-label="Create custom color"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  {showCustomColorPicker && (
                    <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border">
                      <input
                        type="color"
                        value={pendingCustomHex}
                        onChange={(e) => setPendingCustomHex(e.target.value)}
                        className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent"
                        title="Pick a color"
                        aria-label="Pick a custom color"
                      />
                      <span className="text-xs text-muted-foreground font-mono">{pendingCustomHex}</span>
                      <Button type="button" size="sm" variant="secondary" onClick={handleUseCustomColor}>
                        Use color
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setShowCustomColorPicker(false)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
                {createTagError && (
                  <p className="text-xs text-destructive" role="alert">
                    {createTagError}
                  </p>
                )}
                <div className="flex justify-end gap-1.5 pt-0.5">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddTag(false)}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" onClick={handleCreateTag}>
                    Add
                  </Button>
                </div>
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
                    <span
                      className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${getTagDotClass(t.id)}`}
                      style={getTagDotStyle(t.id)}
                      aria-hidden
                    />
                    <span>{t.name}</span>
                  </div>
                </Link>
              ))}
            </nav>
          </div>
        </div>
        )}

        {!collapsed && (
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
        )}
      </div>
    </aside>
  );
}
