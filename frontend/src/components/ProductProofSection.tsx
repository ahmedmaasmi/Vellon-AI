'use client';

import React from 'react';
import { SectionReveal } from '@/components/SectionReveal';
import { FileText, Sparkles } from 'lucide-react';

/**
 * In-context product visual: mock dashboard with note + AI summary.
 * Reusable for A/B or future updates. Uses design tokens only.
 */
export default function ProductProofSection() {
  return (
    <section
      id="product"
      className="relative z-10 py-24 px-6 max-w-6xl mx-auto"
      aria-label="See Vellon AI in action"
    >
      <SectionReveal className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4 font-handwriting">
          Your notes, <span className="text-primary">smarter</span>
        </h2>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-handwriting">
          Write once. Get summaries and keywords instantly. Find anything in seconds.
        </p>
      </SectionReveal>

      <SectionReveal>
        <div className="relative max-w-4xl mx-auto">
          {/* Mock app frame */}
          <div className="bg-card rounded-2xl shadow-xl border-2 border-border overflow-hidden">
            {/* Window chrome */}
            <div className="h-10 bg-muted border-b border-border flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="flex min-h-[320px] md:min-h-[380px]">
              {/* Sidebar: note list */}
              <div className="w-1/3 min-w-[140px] border-r border-border bg-muted/30 p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-muted-foreground mb-2 px-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium font-handwriting">Notes</span>
                </div>
                <div className="flex-1 space-y-2">
                  {[
                    { title: 'Meeting takeaways', active: true },
                    { title: 'Project ideas', active: false },
                    { title: 'Reading list', active: false },
                  ].map((note, i) => (
                    <div
                      key={i}
                      className={`rounded-lg px-3 py-2 text-sm font-handwriting truncate border ${
                        note.active ? 'bg-accent border-primary/30 text-accent-foreground' : 'bg-card border-border text-foreground'
                      }`}
                    >
                      {note.title}
                    </div>
                  ))}
                </div>
              </div>
              {/* Main: note content + AI summary */}
              <div className="flex-1 p-6 flex flex-col">
                <div className="border-b border-border pb-3 mb-4">
                  <div className="h-6 w-3/4 bg-primary/20 rounded mb-2 max-w-[240px]" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-full bg-muted rounded" />
                    <div className="h-3 w-4/5 bg-muted rounded" />
                    <div className="h-3 w-2/3 bg-muted rounded" />
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-semibold font-handwriting">AI Summary</span>
                  </div>
                  <div className="bg-accent/50 rounded-lg p-3 border border-border">
                    <div className="h-3 w-full bg-muted-foreground/20 rounded mb-2" />
                    <div className="h-3 w-5/6 bg-muted-foreground/20 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionReveal>
    </section>
  );
}
