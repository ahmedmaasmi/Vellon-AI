'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Heart,
  Archive,
  Trash2,
  Plus,
  PanelLeftClose,
  PanelRightOpen,
  LogOut,
  Settings,
  Pencil,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAppTheme } from '@/components/providers/AppProviders';
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

function getUserInitials(displayName: string | null | undefined, email: string | undefined): string {
  const name = (displayName ?? '').trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    const local = email.split('@')[0] ?? '';
    return local.slice(0, 2).toUpperCase() || '?';
  }
  return '?';
}

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function Sidebar() {
  const { logout, user } = useAuthStore();
  const { resolved, toggleLightDark } = useAppTheme();
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
  const [renamingTagId, setRenamingTagId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const initials = useMemo(
    () => getUserInitials(user?.display_name, user?.email),
    [user?.display_name, user?.email]
  );
  const firstName = useMemo(() => {
    const n = (user?.display_name ?? '').trim();
    if (n) return n.split(/\s+/)[0] ?? n;
    const email = user?.email ?? '';
    return email.split('@')[0] || 'there';
  }, [user?.display_name, user?.email]);

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
      ? 'flex items-center justify-between pl-2.5 pr-3 py-2.5 rounded-xl border-l-[3px] border-secondary bg-primary/[0.06] text-foreground font-medium shadow-card'
      : 'flex items-center justify-between pl-2.5 pr-3 py-2.5 rounded-xl border-l-[3px] border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-200';

  const iconNavClass = (active: boolean) =>
    active
      ? 'flex items-center justify-center w-10 h-10 mx-auto rounded-xl border-l-[3px] border-secondary bg-primary/[0.06] text-foreground shadow-card'
      : 'flex items-center justify-center w-10 h-10 mx-auto rounded-xl border-l-[3px] border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-200';

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

  const startRenameTag = (t: TagItem) => {
    setRenamingTagId(t.id);
    setRenameValue(t.name);
  };

  const cancelRenameTag = () => {
    setRenamingTagId(null);
    setRenameValue('');
  };

  const submitRenameTag = async (tagId: string) => {
    const name = renameValue.trim();
    if (!name) {
      toast.error('Tag name cannot be empty');
      return;
    }
    try {
      await api.patch(`/api/v1/tags/${tagId}`, { name });
      cancelRenameTag();
      fetchTags();
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
      toast.success('Tag renamed');
    } catch (err: unknown) {
      const detail =
        err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'detail' in err.response.data
          ? String((err.response.data as { detail: unknown }).detail)
          : 'Failed to rename tag';
      toast.error(detail);
    }
  };

  const deleteTagById = async (t: TagItem) => {
    if (!confirm(`Delete tag “${t.name}”? It will be removed from all notes.`)) return;
    try {
      await api.delete(`/api/v1/tags/${t.id}`);
      fetchTags();
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
      toast.success('Tag deleted');
    } catch {
      toast.error('Could not delete tag');
    }
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
      className={`h-full border-r border-border/80 bg-card/95 backdrop-blur-sm flex flex-col z-20 transition-[width] duration-200 shadow-panel-depth ${
        collapsed ? 'w-14' : 'w-64'
      }`}
    >
      <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
        <div className="p-3 flex flex-col gap-3 sticky top-0 bg-card/95 backdrop-blur-sm z-10 border-b border-transparent">
          <div className="flex items-center justify-between gap-2">
            {!collapsed && (
              <Link
                href="/dashboard"
                className="font-bold text-lg tracking-tight text-foreground hover:text-primary transition-colors truncate"
              >
                Vellon AI
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground shrink-0 h-9 w-9"
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
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 shadow-card">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/90 to-secondary text-sm font-semibold text-primary-foreground shadow-sm"
                aria-hidden
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {timeGreeting()}
                </p>
                <p className="truncate text-sm font-semibold text-foreground">{firstName}</p>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="flex justify-center pt-1">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/90 to-secondary text-[10px] font-bold text-primary-foreground shadow-card"
                title={firstName}
              >
                {initials}
              </div>
            </div>
          )}
        </div>

        {collapsed && (
          <nav className="flex flex-col items-center gap-1 px-1 py-3">
            <Link href="/dashboard" className={iconNavClass(isActive('all'))} title="All Notes">
              <FileText className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard?filter=favorites"
              className={iconNavClass(isActive('favorites'))}
              title="Favorites"
            >
              <Heart className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard?filter=archived"
              className={iconNavClass(isActive('archived'))}
              title="Archived"
            >
              <Archive className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard?filter=deleted"
              className={iconNavClass(isActive('deleted'))}
              title="Recently Deleted"
            >
              <Trash2 className="h-4 w-4" />
            </Link>
          </nav>
        )}

        {!collapsed && (
          <div className="flex-1 px-4 py-4 space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                Quick Links
              </h3>
              <nav className="space-y-1">
                <Link href="/dashboard" className={linkClass(isActive('all'))}>
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate">All Notes</span>
                  </div>
                  <span className="text-xs bg-card/80 border border-border/50 px-2 py-0.5 rounded-full shrink-0">
                    {counts.all}
                  </span>
                </Link>
                <Link href="/dashboard?filter=favorites" className={linkClass(isActive('favorites'))}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Heart className="h-4 w-4 shrink-0" />
                    <span className="truncate">Favorites</span>
                  </div>
                  <span className="text-xs bg-muted/80 px-2 py-0.5 rounded-full shrink-0">
                    {counts.favorite}
                  </span>
                </Link>
                <Link href="/dashboard?filter=archived" className={linkClass(isActive('archived'))}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Archive className="h-4 w-4 shrink-0" />
                    <span className="truncate">Archived</span>
                  </div>
                  <span className="text-xs bg-muted/80 px-2 py-0.5 rounded-full shrink-0">
                    {counts.archived}
                  </span>
                </Link>
                <Link href="/dashboard?filter=deleted" className={linkClass(isActive('deleted'))}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Trash2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">Recently Deleted</span>
                  </div>
                  <span className="text-xs bg-muted/80 px-2 py-0.5 rounded-full shrink-0">
                    {counts.deleted}
                  </span>
                </Link>
              </nav>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-divider to-transparent" aria-hidden />

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
                <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg border border-border bg-card shadow-elevated p-2.5 space-y-2.5">
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
                  <div key={t.id} className="group/tag flex items-stretch gap-0.5 rounded-xl">
                    {renamingTagId === t.id ? (
                      <form
                        className="flex flex-1 min-w-0 items-center gap-1 px-2 py-1.5"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void submitRenameTag(t.id);
                        }}
                      >
                        <input
                          className="flex-1 min-w-0 rounded-md border border-border bg-background px-2 py-1 text-sm"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          autoFocus
                          aria-label="Rename tag"
                        />
                        <Button type="submit" size="sm" className="h-7 shrink-0 px-2 text-xs">
                          Save
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-7 shrink-0 px-2 text-xs" onClick={cancelRenameTag}>
                          Cancel
                        </Button>
                      </form>
                    ) : (
                      <>
                        <Link href={`/dashboard?tag_id=${t.id}`} className={`${linkClass(isActive('all', t.id))} flex-1 min-w-0`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`h-3 w-3 rounded-full flex-shrink-0 ring-offset-2 ring-offset-card transition-shadow hover:ring-2 hover:ring-secondary/40 ${getTagDotClass(t.id)}`}
                              style={getTagDotStyle(t.id)}
                              aria-hidden
                            />
                            <span className="truncate">{t.name}</span>
                          </div>
                        </Link>
                        <div className="flex shrink-0 items-center gap-0.5 pr-1 opacity-0 transition-opacity group-hover/tag:opacity-100 focus-within:opacity-100">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            title="Rename tag"
                            onClick={() => startRenameTag(t)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Delete tag"
                            onClick={() => void deleteTagById(t)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        )}

        <div className="mt-auto shrink-0">
          <div className="h-px mx-3 bg-gradient-to-r from-transparent via-divider to-transparent" aria-hidden />
          <div className="p-3 space-y-1">
            {collapsed ? (
              <>
                <Button variant="ghost" size="icon" className="w-full h-10 text-muted-foreground/80 hover:text-foreground" asChild title="Settings">
                  <Link href="/dashboard/settings">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-10 text-muted-foreground/80 hover:text-foreground"
                  type="button"
                  title={resolved === 'dark' ? 'Light mode' : 'Dark mode'}
                  onClick={() => toggleLightDark()}
                >
                  {resolved === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-10 text-muted-foreground/70 opacity-80 hover:opacity-100 hover:text-foreground"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground/80 hover:text-foreground" asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground/80 hover:text-foreground"
                  type="button"
                  onClick={() => toggleLightDark()}
                >
                  {resolved === 'dark' ? <Sun className="h-4 w-4 mr-3" /> : <Moon className="h-4 w-4 mr-3" />}
                  {resolved === 'dark' ? 'Light mode' : 'Dark mode'}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground/75 hover:text-foreground opacity-90 hover:opacity-100 transition-opacity"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
