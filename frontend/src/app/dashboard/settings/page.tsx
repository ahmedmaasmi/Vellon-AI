'use client';

import { Settings } from 'lucide-react';
import Link from 'next/link';

export default function DashboardSettingsPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full text-muted-foreground p-8 w-full bg-background">
      <div className="bg-accent p-6 rounded-full shadow-sm border border-border">
        <Settings className="h-12 w-12 text-accent-foreground" />
      </div>
      <h2 className="text-xl font-bold text-foreground mt-4">Settings</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center">
        Settings and preferences will appear here.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 text-sm text-accent-foreground hover:underline font-medium"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
