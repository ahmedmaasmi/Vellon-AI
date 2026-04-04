'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import HeroSection from '@/components/HeroSection';
import LandingFaq from '@/components/LandingFaq';

const ProductProofSection = dynamic(() => import('@/components/ProductProofSection'), {
  loading: () => (
    <div
      className="relative z-10 min-h-[20rem] max-w-6xl mx-auto my-12 rounded-3xl bg-muted/30 animate-pulse border border-border/40"
      aria-hidden
    />
  ),
});
import { SectionReveal, StaggerReveal, StaggerRevealItem } from '@/components/SectionReveal';
import { pathDrawVariants, viewportOnce } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, Shield, Zap, Quote, Star } from 'lucide-react';

function StarRow() {
  return (
    <div className="flex gap-0.5 text-primary mb-3">
      <span className="sr-only">5 out of 5 stars</span>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-primary/80 text-primary" aria-hidden />
      ))}
    </div>
  );
}

export default function Home() {
  const reducedMotion = useReducedMotion();
  const pathVariants = pathDrawVariants(!!reducedMotion);

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans">
      <HeroSection />

      {/* Dotted background: anchored below hero, fills rest of page without forcing extra scroll */}
      <div
        className="absolute left-0 right-0 top-[100vh] bottom-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgb(var(--border)) 2px, transparent 2px)',
          backgroundSize: '48px 48px',
          backgroundPosition: '0 0, 24px 24px',
        }}
        aria-hidden
      />

      <div className="relative z-10">
        <ProductProofSection />

        {/* Why Vellon AI */}
        <section id="why" className="py-32 px-6 max-w-6xl mx-auto overflow-hidden">
          <SectionReveal className="text-center mb-24 relative z-20">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 font-handwriting">
              Built for <span className="text-primary">how you think</span>
            </h2>
            <p className="text-muted-foreground text-xl md:text-2xl max-w-xl mx-auto">
              Outcomes that matter: find faster, recall without re-reading, and keep your data yours.
            </p>
          </SectionReveal>

          <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-x-8 md:gap-y-20 relative z-10 max-w-5xl mx-auto">
            <StaggerRevealItem className="flex justify-center md:justify-end md:-mt-8 md:pr-12">
              <motion.div
                whileHover={{ scale: 1.02, rotate: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-[320px]"
              >
                <div className="bg-card p-3 rounded-[32px] shadow-xl shadow-primary/10 w-full relative rotate-[-2deg] transition-transform hover:rotate-0 duration-300 border-2 border-border">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-4 bg-card/80 backdrop-blur-sm border border-border shadow-sm rotate-[-3deg]" />
                  <div className="rounded-[24px] bg-sky-100/80 dark:bg-sky-950/40 p-8 h-full min-h-[220px] border border-sky-200/60 dark:border-sky-800/50">
                    <div className="text-sky-700 dark:text-sky-300 mb-5" aria-hidden>
                      <Search className="w-8 h-8" strokeWidth={2} />
                    </div>
                    <h3 className="text-2xl font-bold text-sky-900 dark:text-sky-100 mb-3 font-handwriting">
                      Find anything in seconds
                    </h3>
                    <p className="text-lg text-foreground leading-relaxed">
                      One place for every thought. Labels and search that match how you think.
                    </p>
                  </div>
                </div>
              </motion.div>
            </StaggerRevealItem>

            <StaggerRevealItem className="flex justify-center md:justify-start md:mt-24 md:pl-12">
              <motion.div
                whileHover={{ scale: 1.02, rotate: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-[320px]"
              >
                <div className="bg-card p-3 rounded-[32px] shadow-xl shadow-primary/10 w-full relative rotate-[2deg] transition-transform hover:rotate-0 duration-300 border-2 border-border">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-4 bg-card/80 backdrop-blur-sm border border-border shadow-sm rotate-[4deg]" />
                  <div className="rounded-[24px] bg-violet-100/80 dark:bg-violet-950/40 p-8 h-full min-h-[220px] border border-violet-200/60 dark:border-violet-800/50">
                    <div className="text-violet-700 dark:text-violet-300 mb-5" aria-hidden>
                      <Sparkles className="w-8 h-8" strokeWidth={2} />
                    </div>
                    <h3 className="text-2xl font-bold text-violet-900 dark:text-violet-100 mb-3 font-handwriting">
                      Recall without re-reading
                    </h3>
                    <p className="text-lg text-foreground leading-relaxed">
                      AI summaries and keywords so you skim less and find more.
                    </p>
                  </div>
                </div>
              </motion.div>
            </StaggerRevealItem>

            <StaggerRevealItem className="flex justify-center md:justify-end md:pr-12">
              <motion.div
                whileHover={{ scale: 1.02, rotate: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-[320px]"
              >
                <div className="bg-card p-3 rounded-[32px] shadow-xl shadow-primary/10 w-full relative rotate-[-1deg] transition-transform hover:rotate-0 duration-300 border-2 border-border">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-4 bg-card/80 backdrop-blur-sm border border-border shadow-sm rotate-[-2deg]" />
                  <div className="rounded-[24px] bg-emerald-100/80 dark:bg-emerald-950/40 p-8 h-full min-h-[220px] border border-emerald-200/60 dark:border-emerald-800/50">
                    <div className="text-emerald-700 dark:text-emerald-300 mb-5" aria-hidden>
                      <Shield className="w-8 h-8" strokeWidth={2} />
                    </div>
                    <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-3 font-handwriting">
                      Your data stays yours
                    </h3>
                    <p className="text-lg text-foreground leading-relaxed">
                      Private by default. We never train AI on your content.
                    </p>
                  </div>
                </div>
              </motion.div>
            </StaggerRevealItem>

            <StaggerRevealItem className="flex justify-center md:justify-start md:mt-16 md:pl-12">
              <motion.div
                whileHover={{ scale: 1.02, rotate: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-[320px]"
              >
                <div className="bg-card p-3 rounded-[32px] shadow-xl shadow-primary/10 w-full relative rotate-[1deg] transition-transform hover:rotate-0 duration-300 border-2 border-border">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-4 bg-card/80 backdrop-blur-sm border border-border shadow-sm rotate-[2deg]" />
                  <div className="rounded-[24px] bg-amber-100/80 dark:bg-amber-950/40 p-8 h-full min-h-[220px] border border-amber-200/60 dark:border-amber-800/50">
                    <div className="text-amber-700 dark:text-amber-300 mb-5" aria-hidden>
                      <Zap className="w-8 h-8" strokeWidth={2} />
                    </div>
                    <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-3 font-handwriting">
                      Capture ideas before they slip away
                    </h3>
                    <p className="text-lg text-foreground leading-relaxed">
                      Minimal friction. Create and edit in seconds, not minutes.
                    </p>
                  </div>
                </div>
              </motion.div>
            </StaggerRevealItem>
          </StaggerReveal>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-32 px-6 max-w-7xl mx-auto bg-background/50 rounded-3xl">
          <SectionReveal>
            <div className="flex justify-center mb-6">
              <div className="w-10 h-1 bg-primary rounded-full" />
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-center text-foreground mb-6 font-handwriting">
              How it works
            </h2>
            <p className="text-muted-foreground text-xl md:text-2xl text-center max-w-2xl mx-auto mb-20">
              Capture, organize, and recall—your digital mind in four simple steps.
            </p>
          </SectionReveal>

          <div className="relative">
            <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-8 relative z-10">
              <StaggerRevealItem className="flex flex-col items-center text-center relative">
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold font-handwriting z-10">
                  1
                </span>
                <svg
                  className="hidden lg:block absolute top-[-10%] left-[-15%] w-[130%] h-[120%] pointer-events-none text-primary z-0 opacity-60"
                  viewBox="0 0 200 200"
                  fill="none"
                  aria-hidden
                >
                  <motion.path
                    d="M 100 20 C 20 20, 20 180, 100 180 C 150 180, 180 140, 210 110"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 6"
                    strokeLinecap="round"
                    fill="none"
                    variants={pathVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewportOnce}
                  />
                  <motion.path
                    d="M 200 105 L 210 110 L 205 120"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    variants={pathVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewportOnce}
                  />
                </svg>
                <div className="h-40 flex items-center justify-center mb-8 w-full relative z-10">
                  <div className="relative w-56 h-36 bg-card rounded-lg shadow-xl shadow-primary/10 border border-border overflow-hidden flex flex-col">
                    <div className="h-4 bg-muted w-full flex items-center px-2 gap-1">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/35" />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/35" />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/35" />
                    </div>
                    <div className="p-4 flex-1 flex flex-col gap-3">
                      <div className="w-16 h-2.5 bg-secondary rounded-sm" />
                      <div className="flex gap-2 items-center mt-1">
                        <div className="w-4 h-4 bg-accent rounded-sm flex-shrink-0 border border-border" />
                        <div className="w-24 h-2 bg-muted rounded-full" />
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="w-4 h-4 bg-primary/40 rounded-sm flex-shrink-0" />
                        <div className="w-20 h-2 bg-muted rounded-full" />
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="w-4 h-4 bg-accent rounded-sm flex-shrink-0 border border-border" />
                        <div className="w-28 h-2 bg-muted rounded-full" />
                      </div>
                      <div className="mt-auto w-full h-6 bg-muted/50 rounded-sm border border-border" />
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2 font-handwriting">Write notes</h3>
                <p className="text-sm text-muted-foreground max-w-[200px]">Jot ideas, tasks, and thoughts seamlessly.</p>
              </StaggerRevealItem>

              <StaggerRevealItem className="flex flex-col items-center text-center relative mt-8 lg:mt-0">
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold font-handwriting z-10">
                  2
                </span>
                <svg
                  className="hidden lg:block absolute top-[20%] left-[80%] w-[80%] h-[60%] pointer-events-none text-primary z-0 opacity-60"
                  viewBox="0 0 100 100"
                  fill="none"
                  aria-hidden
                >
                  <motion.path
                    d="M 0 80 C 40 80, 60 20, 100 20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 6"
                    strokeLinecap="round"
                    fill="none"
                    variants={pathVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewportOnce}
                  />
                  <motion.path
                    d="M 90 15 L 100 20 L 95 30"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    variants={pathVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewportOnce}
                  />
                </svg>
                <div className="h-40 flex items-center justify-center mb-8 w-full relative z-10">
                  <div className="relative w-56 h-36 flex flex-col justify-center">
                    <div className="absolute top-2 left-4 w-32 h-10 bg-card rounded shadow-md border border-border flex items-center px-3 gap-2">
                      <div className="w-4 h-4 bg-secondary rounded-sm" />
                      <div className="w-12 h-1.5 bg-muted rounded-full" />
                    </div>
                    <div className="absolute top-10 right-2 w-32 h-10 bg-card rounded shadow-lg border border-border flex items-center px-3 gap-2 z-10">
                      <div className="w-4 h-4 bg-primary/50 rounded-sm" />
                      <div className="w-16 h-1.5 bg-muted rounded-full" />
                    </div>
                    <div className="absolute top-[4.5rem] left-2 w-32 h-10 bg-card rounded shadow-md border border-border flex items-center px-3 gap-2 z-20">
                      <div className="w-4 h-4 bg-secondary rounded-sm" />
                      <div className="w-10 h-1.5 bg-muted rounded-full" />
                    </div>
                    <div className="absolute top-24 right-4 w-32 h-10 bg-card rounded shadow-xl border border-border flex items-center px-3 gap-2 z-30">
                      <div className="w-4 h-4 bg-primary/50 rounded-sm" />
                      <div className="w-14 h-1.5 bg-muted rounded-full" />
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2 font-handwriting">Labels & archive</h3>
                <p className="text-sm text-muted-foreground max-w-[200px]">Organize visually and keep everything tidy.</p>
              </StaggerRevealItem>

              <StaggerRevealItem className="flex flex-col items-center text-center relative mt-8 lg:mt-0">
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold font-handwriting z-10">
                  3
                </span>
                <svg
                  className="hidden lg:block absolute top-[60%] left-[80%] w-[80%] h-[60%] pointer-events-none text-primary z-0 opacity-60"
                  viewBox="0 0 100 100"
                  fill="none"
                  aria-hidden
                >
                  <motion.path
                    d="M 0 20 C 40 20, 60 80, 100 80"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 6"
                    strokeLinecap="round"
                    fill="none"
                    variants={pathVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewportOnce}
                  />
                  <motion.path
                    d="M 90 75 L 100 80 L 95 90"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    variants={pathVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewportOnce}
                  />
                </svg>
                <div className="h-40 flex items-center justify-center mb-8 w-full relative z-10">
                  <div className="relative w-56 h-36 flex items-center justify-center">
                    <div className="absolute top-0 left-2 w-48 h-32 bg-card rounded-lg shadow-lg border border-border overflow-hidden flex flex-col">
                      <div className="h-4 bg-muted w-full flex items-center px-2 gap-1">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/35" />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/35" />
                      </div>
                      <div className="p-3 flex flex-col gap-2">
                        <div className="w-10 h-10 bg-secondary rounded-sm mb-1" />
                        <div className="w-28 h-1.5 bg-muted rounded-full" />
                        <div className="w-24 h-1.5 bg-muted rounded-full" />
                        <div className="mt-3 w-full flex gap-2">
                          <div className="w-1/2 h-8 bg-muted/40 rounded-sm border border-border" />
                          <div className="w-1/2 h-8 bg-muted/40 rounded-sm border border-border" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-[-10px] right-2 w-20 h-28 bg-card rounded-lg shadow-2xl border border-border flex flex-col items-center py-2 px-1 z-10">
                      <div className="w-6 h-1 bg-muted rounded-full mb-3" />
                      <div className="w-14 h-2 bg-primary/60 rounded-sm mb-2" />
                      <div className="w-14 h-1.5 bg-muted rounded-full mb-1" />
                      <div className="w-10 h-1.5 bg-muted rounded-full mb-4" />
                      <div className="w-14 h-8 bg-accent/60 rounded-sm border border-border mt-auto" />
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2 font-handwriting">AI helps you recall</h3>
                <p className="text-sm text-muted-foreground max-w-[200px]">Summaries and search find what matters.</p>
              </StaggerRevealItem>

              <StaggerRevealItem className="flex flex-col items-center text-center relative mt-8 lg:mt-0">
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold font-handwriting z-10">
                  4
                </span>
                <svg
                  className="hidden lg:block absolute top-[10%] left-[50%] w-[40%] h-[80%] pointer-events-none text-primary z-0 opacity-60"
                  viewBox="0 0 100 100"
                  fill="none"
                  aria-hidden
                >
                  <motion.path
                    d="M 0 100 C 20 100, 80 80, 80 0"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 6"
                    strokeLinecap="round"
                    fill="none"
                    variants={pathVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewportOnce}
                  />
                  <motion.path
                    d="M 70 10 L 80 0 L 90 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    variants={pathVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewportOnce}
                  />
                </svg>
                <div className="h-40 flex items-center justify-center mb-8 w-full relative z-10">
                  <div className="relative w-56 h-36 flex items-center justify-center">
                    <div className="absolute top-4 left-4 w-24 h-28 bg-card rounded shadow-md border border-border p-2 flex flex-col gap-2">
                      <div className="w-full h-10 bg-muted/50 rounded-sm flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-muted-foreground/40" />
                      </div>
                      <div className="w-16 h-1.5 bg-muted rounded-full mx-auto mt-2" />
                      <div className="w-10 h-1.5 bg-muted rounded-full mx-auto" />
                    </div>
                    <div className="absolute top-4 right-4 w-24 h-28 bg-card rounded shadow-md border border-border p-2 flex flex-col gap-2">
                      <div className="w-full h-10 bg-muted/50 rounded-sm flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-muted-foreground/40" />
                      </div>
                      <div className="w-16 h-1.5 bg-muted rounded-full mx-auto mt-2" />
                      <div className="w-10 h-1.5 bg-muted rounded-full mx-auto" />
                    </div>
                    <div className="absolute top-0 left-16 w-24 h-32 bg-card rounded shadow-xl border border-border p-2 flex flex-col gap-2 z-10">
                      <div className="w-full h-12 bg-muted/50 rounded-sm flex flex-col items-center justify-center gap-1.5">
                        <div className="flex gap-1">
                          <div className="w-3 h-3 bg-secondary rounded-sm" />
                          <div className="w-3 h-3 bg-secondary rounded-sm" />
                        </div>
                        <div className="flex gap-1">
                          <div className="w-3 h-3 bg-primary/50 rounded-sm" />
                          <div className="w-3 h-3 bg-primary/50 rounded-sm" />
                        </div>
                      </div>
                      <div className="w-16 h-1.5 bg-muted rounded-full mx-auto mt-3" />
                      <div className="w-12 h-1.5 bg-muted rounded-full mx-auto" />
                    </div>
                    <div className="absolute -top-3 right-10 w-10 h-10 bg-accent/80 rounded-full flex items-center justify-center z-20 shadow-sm border border-border">
                      <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-md">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2 font-handwriting">Access anywhere</h3>
                <p className="text-sm text-muted-foreground max-w-[200px]">Secure sync across all your devices.</p>
              </StaggerRevealItem>
            </StaggerReveal>
          </div>
          <SectionReveal className="text-center mt-12">
            <Button asChild variant="outline" className="rounded-xl border-2 border-border font-handwriting">
              <Link href="/register">Get Started Free</Link>
            </Button>
          </SectionReveal>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24 px-6 max-w-6xl mx-auto">
          <SectionReveal>
            <h2 className="text-4xl font-bold tracking-tight text-center text-foreground mb-4 font-handwriting">
              Loved by thinkers
            </h2>
            <p className="text-muted-foreground text-xl text-center max-w-2xl mx-auto mb-4">
              From product teams to solo founders—people use Vellon AI to capture and organize what matters.
            </p>
            <p className="text-muted-foreground text-center text-sm mb-6">
              Growing community · No credit card required · Privacy-first
            </p>
            <p className="text-center text-xs text-muted-foreground/80 uppercase tracking-wider mb-12">
              Trusted by teams shipping real work
            </p>
          </SectionReveal>
          <StaggerReveal className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <StaggerRevealItem>
              <motion.div whileHover={{ scale: 1.02, rotate: 0 }} transition={{ duration: 0.2 }} className="h-full">
                <div className="bg-card p-6 rounded-2xl shadow-xl shadow-primary/10 border-2 border-border relative rotate-[-1deg] h-full flex flex-col">
                  <Quote className="w-8 h-8 text-border mb-2 shrink-0" aria-hidden />
                  <StarRow />
                  <p className="text-muted-foreground text-lg mb-6 flex-1">
                    &ldquo;Finally a notes app that stays out of the way until I need it. The AI summaries save me hours
                    every week.&rdquo;
                  </p>
                  <div className="flex items-center gap-3 mt-auto">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary font-semibold text-sm border border-border">
                      JK
                    </div>
                    <div>
                      <p className="font-bold text-foreground font-handwriting">Jamie Kowalski</p>
                      <p className="text-sm text-muted-foreground">Product Lead, Northline Analytics</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </StaggerRevealItem>
            <StaggerRevealItem>
              <motion.div whileHover={{ scale: 1.02, rotate: 0 }} transition={{ duration: 0.2 }} className="h-full">
                <div className="bg-card p-6 rounded-2xl shadow-xl shadow-primary/10 border-2 border-border relative rotate-[1deg] h-full flex flex-col">
                  <Quote className="w-8 h-8 text-border mb-2 shrink-0" aria-hidden />
                  <StarRow />
                  <p className="text-muted-foreground text-lg mb-6 flex-1">
                    &ldquo;Labels and archive work exactly how I think. I stopped losing half-finished ideas in random
                    docs.&rdquo;
                  </p>
                  <div className="flex items-center gap-3 mt-auto">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm border border-border">
                      SM
                    </div>
                    <div>
                      <p className="font-bold text-foreground font-handwriting">Samira Mensah</p>
                      <p className="text-sm text-muted-foreground">UX Designer, Studio Meridian</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </StaggerRevealItem>
            <StaggerRevealItem>
              <motion.div whileHover={{ scale: 1.02, rotate: 0 }} transition={{ duration: 0.2 }} className="h-full">
                <div className="bg-card p-6 rounded-2xl shadow-xl shadow-primary/10 border-2 border-border relative rotate-[-0.5deg] h-full flex flex-col">
                  <Quote className="w-8 h-8 text-border mb-2 shrink-0" aria-hidden />
                  <StarRow />
                  <p className="text-muted-foreground text-lg mb-6 flex-1">
                    &ldquo;We onboarded the team in a day. Search plus summaries means fewer &apos;where was that
                    decision?&apos; threads.&rdquo;
                  </p>
                  <div className="flex items-center gap-3 mt-auto">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm border border-border">
                      ER
                    </div>
                    <div>
                      <p className="font-bold text-foreground font-handwriting">Elena Ruiz</p>
                      <p className="text-sm text-muted-foreground">Engineering Manager, Harbor Labs</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </StaggerRevealItem>
          </StaggerReveal>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 px-6 max-w-5xl mx-auto">
          <SectionReveal>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-center text-foreground mb-4 font-handwriting">
              Start free, upgrade when you need more
            </h2>
            <p className="text-muted-foreground text-lg text-center max-w-xl mx-auto mb-12">
              Core features are free forever. A paid tier with higher limits is on the way.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              <div className="bg-card rounded-2xl border-2 border-primary shadow-xl shadow-primary/10 p-8 md:p-10 text-center relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Current
                </span>
                <p className="text-sm font-semibold text-primary mb-2 font-handwriting">Free</p>
                <p className="text-4xl md:text-5xl font-bold text-primary mb-2 font-handwriting">$0</p>
                <p className="text-muted-foreground mb-6">Everything you need to get started</p>
                <ul className="text-foreground text-left max-w-sm mx-auto space-y-2 mb-8">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Unlimited notes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Labels & archive
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> AI summaries & keywords
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Secure sync
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> No credit card required
                  </li>
                </ul>
                <Button
                  asChild
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 py-6 text-xl font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 font-handwriting w-full sm:w-auto"
                >
                  <Link href="/register">Get Started Free</Link>
                </Button>
              </div>
              <div className="bg-muted/40 rounded-2xl border-2 border-dashed border-border p-8 md:p-10 text-center relative flex flex-col">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground border border-border">
                  Coming soon
                </span>
                <p className="text-sm font-semibold text-muted-foreground mb-2 font-handwriting">Pro</p>
                <p className="text-3xl md:text-4xl font-bold text-foreground mb-2 font-handwriting">More power</p>
                <p className="text-muted-foreground mb-6 flex-1">
                  Higher AI limits, priority support, and team features. We&apos;ll email you when it launches.
                </p>
                <ul className="text-muted-foreground text-left max-w-sm mx-auto space-y-2 mb-8 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">○</span> Expanded monthly AI usage
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">○</span> Shared workspaces (planned)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">○</span> Priority support
                  </li>
                </ul>
                <Button asChild variant="outline" className="rounded-xl border-2 border-border font-handwriting">
                  <Link href="/register">Join the waitlist</Link>
                </Button>
              </div>
            </div>
          </SectionReveal>
        </section>

        <LandingFaq />

        {/* Final CTA */}
        <section id="cta" className="py-24 px-6 max-w-3xl mx-auto">
          <SectionReveal>
            <div className="bg-muted p-10 md:p-14 rounded-3xl shadow-xl shadow-primary/10 border-2 border-border text-center relative rotate-[-1deg]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-6 bg-card/80 backdrop-blur-sm border border-border shadow-sm rotate-[2deg]" />
              <h2 className="text-3xl md:text-5xl font-bold text-primary mb-4 font-handwriting">
                Ready to build your second brain?
              </h2>
              <p className="text-muted-foreground text-xl mb-8 max-w-md mx-auto">
                Create a free account and start capturing ideas in seconds. Your notes stay private—we don&apos;t train
                AI on your content.
              </p>
              <Button
                asChild
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 py-6 text-2xl font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 hover:-rotate-1 font-handwriting"
              >
                <Link href="/register">Get Started Free</Link>
              </Button>
            </div>
          </SectionReveal>
        </section>

        <footer className="py-14 px-6 border-t border-border bg-background">
          <div className="max-w-4xl mx-auto text-center">
            <p className="font-handwriting text-2xl font-bold text-foreground mb-1">Vellon AI</p>
            <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
              Smart notes with AI summaries—private by default.
            </p>
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-muted-foreground text-sm mb-6">
              <Link href="#how-it-works" className="hover:text-primary transition-colors">
                How it works
              </Link>
              <Link href="#pricing" className="hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link href="#faq" className="hover:text-primary transition-colors">
                FAQ
              </Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-primary transition-colors">
                Terms
              </Link>
              <a href="mailto:support@vellon.ai" className="hover:text-primary transition-colors">
                Contact
              </a>
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Get started free
              </Link>
            </nav>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                X / Twitter
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                GitHub
              </a>
            </div>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Vellon AI. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
