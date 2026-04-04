'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SectionReveal } from '@/components/SectionReveal';
import { FileText, Sparkles } from 'lucide-react';

/**
 * In-context product visual: mock dashboard with note + AI summary.
 * Reusable for A/B or future updates. Uses design tokens only.
 */
export default function ProductProofSection() {
  const reducedMotion = useReducedMotion();
  const summaryText =
    'Key decisions: move launch to Q2, approve design budget. Action items: send recap by Friday, book usability tests.';

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
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
          Write once. Get summaries and keywords instantly. Find anything in seconds.
        </p>
      </SectionReveal>

      <SectionReveal>
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl shadow-xl border-2 border-border overflow-hidden">
            <div className="h-10 bg-muted border-b border-border flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="flex min-h-[320px] md:min-h-[380px]">
              <div className="w-1/3 min-w-[140px] border-r border-border bg-muted/30 p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-muted-foreground mb-2 px-2">
                  <FileText className="w-4 h-4" aria-hidden />
                  <span className="text-sm font-medium font-handwriting">Notes</span>
                </div>
                <div className="flex-1 space-y-2">
                  {[
                    { title: 'Meeting with design team', active: true },
                    { title: 'Q2 roadmap ideas', active: false },
                    { title: 'Reading list — product', active: false },
                  ].map((note, i) => (
                    <div
                      key={i}
                      className={`rounded-lg px-3 py-2 text-sm font-handwriting truncate border ${
                        note.active
                          ? 'bg-accent border-primary/30 text-accent-foreground'
                          : 'bg-card border-border text-foreground'
                      }`}
                    >
                      {note.title}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 p-6 flex flex-col text-left">
                <div className="border-b border-border pb-3 mb-4">
                  <h3 className="text-lg font-semibold text-foreground font-handwriting mb-2">
                    Meeting with design team
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We reviewed the onboarding flow. Feedback: shorten the first screen, add a skip for returning
                    users. Next step is a quick prototype before Friday.
                  </p>
                </div>
                <div className="mt-auto pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <Sparkles className="w-4 h-4 shrink-0" aria-hidden />
                    <span className="text-sm font-semibold font-handwriting">AI Summary</span>
                  </div>
                  <motion.div
                    className="bg-accent/50 rounded-lg p-3 border border-border"
                    initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                    whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: reducedMotion ? 0 : 0.5, ease: 'easeOut', delay: reducedMotion ? 0 : 0.15 }}
                  >
                    <p className="text-sm text-foreground/90 leading-relaxed">{summaryText}</p>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionReveal>
    </section>
  );
}
