'use client';

import { FileText } from 'lucide-react';

export default function DashboardEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
      <div className="bg-[#f8ebe8] p-6 rounded-full">
        <FileText className="h-12 w-12 text-[#c58a80]" />
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-xl font-medium text-foreground">Select a note</h2>
        <p className="text-sm">Choose a note from the list or create a new one to get started.</p>
      </div>
    </div>
  );
}
