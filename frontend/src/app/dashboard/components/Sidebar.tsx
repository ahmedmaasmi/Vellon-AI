'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  Heart, 
  Archive, 
  Trash2, 
  Tag, 
  Folder, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/signin');
  };

  return (
    <aside className="w-64 h-full border-r border-border bg-card flex flex-col overflow-y-auto">
      {/* App Logo */}
      <div className="p-4 flex items-center justify-between sticky top-0 bg-card z-10">
        <Link href="/dashboard" className="font-bold text-xl text-foreground flex items-center gap-2 hover:text-primary transition-colors">
          <div className="bg-[#e4b5ab] text-white p-1 rounded-md">
            <FileText className="h-5 w-5" />
          </div>
          NoteMind
        </Link>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* User Profile */}
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
            <span className="text-xs text-muted-foreground truncate">
              {user?.email}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-4 space-y-6">
        {/* Quick Links */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Quick Links</h3>
          <nav className="space-y-1">
            <Link href="/dashboard" className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#f8ebe8] text-[#935b52] font-medium">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4" />
                <span>All Notes</span>
              </div>
              <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full">24</span>
            </Link>
            <Link href="#" className="flex items-center justify-between px-3 py-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Heart className="h-4 w-4" />
                <span>Favorites</span>
              </div>
            </Link>
            <Link href="#" className="flex items-center justify-between px-3 py-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Archive className="h-4 w-4" />
                <span>Archived</span>
              </div>
            </Link>
            <Link href="#" className="flex items-center justify-between px-3 py-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Trash2 className="h-4 w-4" />
                <span>Recently Deleted</span>
              </div>
            </Link>
          </nav>
        </div>

        {/* Tags */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Tags</h3>
          <nav className="space-y-1">
            {['School Related', 'Work Projects', 'Ideas', 'Personal', 'To-Do'].map((tag) => (
              <Link key={tag} href="#" className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors">
                <Tag className="h-4 w-4" />
                <span>{tag}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Folders */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Folders</h3>
          <nav className="space-y-1">
            {['2024', '2023', '2022', 'Archive'].map((folder) => (
              <Link key={folder} href="#" className="flex items-center justify-between px-3 py-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Folder className="h-4 w-4" />
                  <span>{folder}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Logout button at the bottom */}
      <div className="p-4 mt-auto border-t border-border">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-3" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
