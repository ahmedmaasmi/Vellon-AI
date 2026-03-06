import React from 'react';
import Link from 'next/link';
import HeroSection from '@/components/HeroSection';
import { Button } from '@/components/ui/button';
import { FileText, Sparkles, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection />

      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold tracking-tight text-center mb-12">
          Why NoteMind AI
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="font-medium mb-2">Organize</h3>
            <p className="text-sm text-muted-foreground">
              Keep all your notes in one place with a clean, fast interface.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-medium mb-2">AI summaries</h3>
            <p className="text-sm text-muted-foreground">
              Get summaries, keywords, and embeddings without leaving the app.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="font-medium mb-2">Fast</h3>
            <p className="text-sm text-muted-foreground">
              Built for speed. Create and edit notes with minimal friction.
            </p>
          </div>
        </div>
        <div className="text-center mt-12">
          <Button asChild variant="outline" size="lg">
            <Link href="/register">Create free account</Link>
          </Button>
        </div>
      </section>

      <footer className="py-8 border-t border-border text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} NoteMind AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
