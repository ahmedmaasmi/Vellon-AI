'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SectionReveal } from '@/components/SectionReveal';
import { cn } from '@/lib/utils';

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'How fast is setup?',
    a: 'Under a minute. Sign up, verify your email, and start creating notes. No install required.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. Your notes are yours. We don’t train AI on your content and we don’t sell your data.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Free forever for core features. If you upgrade later, you can cancel anytime with no long-term commitment.',
  },
  {
    q: 'What’s included in the free tier?',
    a: 'Unlimited notes, labels, archive, AI summaries and keywords, and secure sync across devices.',
  },
  {
    q: 'Can I export my data?',
    a: 'You can copy and manage your notes in the app. Full bulk export is on our roadmap—contact support if you need help moving data.',
  },
  {
    q: 'Does it work offline?',
    a: 'Vellon AI is a web app that needs a connection for sync and AI features. Offline-first editing may come in a future release.',
  },
  {
    q: 'What AI model do you use?',
    a: 'We route requests through our backend to trusted providers (e.g. OpenRouter) so your API keys stay server-side. Exact models may change as we optimize quality and cost.',
  },
];

export default function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative z-10 py-24 px-6 max-w-3xl mx-auto">
      <SectionReveal>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-center text-foreground mb-12 font-handwriting">
          Frequently asked questions
        </h2>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, index) => {
            const open = openIndex === index;
            const id = `faq-panel-${index}`;
            const btnId = `faq-trigger-${index}`;
            return (
              <div key={item.q} className="border border-border rounded-xl bg-card/50 overflow-hidden">
                <button
                  type="button"
                  id={btnId}
                  className="flex w-full items-center justify-between gap-4 text-left px-4 py-4 hover:bg-muted/50 transition-colors"
                  aria-expanded={open}
                  aria-controls={id}
                  onClick={() => setOpenIndex(open ? null : index)}
                >
                  <span className="text-lg font-semibold text-foreground font-handwriting pr-2">{item.q}</span>
                  <ChevronDown
                    className={cn('w-5 h-5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
                    aria-hidden
                  />
                </button>
                <div
                  id={id}
                  role="region"
                  aria-labelledby={btnId}
                  className={cn(
                    'grid transition-[grid-template-rows] duration-200 ease-out',
                    open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-4 pb-4 text-muted-foreground leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionReveal>
    </section>
  );
}
