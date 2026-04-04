'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import HeroSection from '@/components/HeroSection';

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
import {
  FileText,
  Sparkles,
  Zap,
  Lock,
  PenLine,
  Tags,
  Archive,
  Quote,
} from 'lucide-react';

export default function Home() {
  const reducedMotion = useReducedMotion();
  const pathVariants = pathDrawVariants(!!reducedMotion);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <HeroSection />

      {/* Dotted background for sections */}
      <div
        className="absolute inset-0 pointer-events-none mt-[100vh] min-h-[200vh]"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgb(var(--border)) 2px, transparent 2px)',
          backgroundSize: '48px 48px',
          backgroundPosition: '0 0, 24px 24px'
        }}
        aria-hidden
      />

      <ProductProofSection />

      {/* Why Vellon AI */}
      <section
        id="why"
        className="relative z-10 py-32 px-6 max-w-6xl mx-auto overflow-hidden"
      >
        <SectionReveal className="text-center mb-24 relative z-20">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 font-handwriting">
            Built for <span className="text-primary">how you think</span>
          </h2>
          <p className="text-muted-foreground text-xl md:text-2xl max-w-xl mx-auto font-handwriting">
            Outcomes that matter: find faster, recall without re-reading, and keep your data yours.
          </p>
        </SectionReveal>

        <div className="relative max-w-5xl mx-auto">
          {/* Background Dotted Lines */}
          <div className="absolute inset-0 pointer-events-none hidden md:block" style={{ zIndex: 0 }}>
            <svg className="w-full h-full absolute top-0 left-0" style={{ minHeight: '600px' }} viewBox="0 0 1000 600" preserveAspectRatio="none">
              <motion.path
                d="M 300 150 L 700 200"
                stroke="rgb(var(--border))"
                strokeWidth="2"
                strokeDasharray="6 6"
                fill="none"
                variants={pathVariants}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
              />
              <motion.path
                d="M 300 150 L 300 450"
                stroke="rgb(var(--border))"
                strokeWidth="2"
                strokeDasharray="6 6"
                fill="none"
                variants={pathVariants}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
              />
              <motion.path
                d="M 700 200 L 300 450"
                stroke="rgb(var(--border))"
                strokeWidth="2"
                strokeDasharray="6 6"
                fill="none"
                variants={pathVariants}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
              />
              <motion.path
                d="M 300 450 L 700 500"
                stroke="rgb(var(--border))"
                strokeWidth="2"
                strokeDasharray="6 6"
                fill="none"
                variants={pathVariants}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
              />
            </svg>
          </div>

          <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-x-8 md:gap-y-20 relative z-10">
            {/* Card 1 - Organize (Yellow) */}
            <StaggerRevealItem className="flex justify-center md:justify-end md:-mt-8 md:pr-12">
              <motion.div
                whileHover={{ scale: 1.02, rotate: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-[320px]"
              >
              <div className="bg-card p-3 rounded-[32px] shadow-xl shadow-primary/10 w-full relative rotate-[-2deg] transition-transform hover:rotate-0 duration-300 border-2 border-border">
                <div 
                  className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-4 bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm rotate-[-3deg]"
                />
                <div className="rounded-[24px] bg-muted p-8 h-full min-h-[220px] border border-border">
                  <div className="text-primary mb-5">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="3" y="3" width="7" height="7" rx="2" />
                      <rect x="14" y="3" width="7" height="7" rx="2" />
                      <rect x="14" y="14" width="7" height="7" rx="2" />
                      <rect x="3" y="14" width="7" height="7" rx="2" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-primary mb-3 font-handwriting">Find anything in seconds</h3>
                  <p className="text-xl text-foreground leading-relaxed font-handwriting">
                    One place for every thought. Labels and search that match how you think.
                  </p>
                </div>
              </div>
              </motion.div>
            </StaggerRevealItem>

            {/* Card 2 - AI Summaries (Purple) */}
            <StaggerRevealItem className="flex justify-center md:justify-start md:mt-24 md:pl-12">
              <motion.div
                whileHover={{ scale: 1.02, rotate: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-[320px]"
              >
              <div className="bg-card p-3 rounded-[32px] shadow-xl shadow-primary/10 w-full relative rotate-[2deg] transition-transform hover:rotate-0 duration-300 border-2 border-border">
                <div 
                  className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-4 bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm rotate-[4deg]"
                />
                <div className="rounded-[24px] bg-card p-8 h-full min-h-[220px] border border-border">
                  <div className="text-primary mb-5">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C12 2 12 10 20 10C20 10 12 10 12 18C12 18 12 10 4 10C4 10 12 10 12 2Z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-primary mb-3 font-handwriting">Recall without re-reading</h3>
                  <p className="text-xl text-foreground leading-relaxed font-handwriting">
                    AI summaries and keywords so you skim less and find more.
                  </p>
                </div>
              </div>
              </motion.div>
            </StaggerRevealItem>

            {/* Card 3 - Secure (Pink) */}
            <StaggerRevealItem className="flex justify-center md:justify-end md:pr-12">
              <motion.div
                whileHover={{ scale: 1.02, rotate: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-[320px]"
              >
              <div className="bg-card p-3 rounded-[32px] shadow-xl shadow-primary/10 w-full relative rotate-[-1deg] transition-transform hover:rotate-0 duration-300 border-2 border-border">
                <div 
                  className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-4 bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm rotate-[-2deg]"
                />
                <div className="rounded-[24px] bg-accent p-8 h-full min-h-[220px] border border-border">
                  <div className="text-primary mb-5">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11 2v10h10a10 10 0 1 1-10-10z" />
                      <path d="M13 2a10 10 0 0 1 10 10H13V2z" fillOpacity="0.5" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-primary mb-3 font-handwriting">Your data stays yours</h3>
                  <p className="text-xl text-foreground leading-relaxed font-handwriting">
                    Private by default. We never train AI on your content.
                  </p>
                </div>
              </div>
              </motion.div>
            </StaggerRevealItem>

            {/* Card 4 - Fast (Blue) */}
            <StaggerRevealItem className="flex justify-center md:justify-start md:mt-16 md:pl-12">
              <motion.div
                whileHover={{ scale: 1.02, rotate: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-[320px]"
              >
              <div className="bg-card p-3 rounded-[32px] shadow-xl shadow-primary/10 w-full relative rotate-[1deg] transition-transform hover:rotate-0 duration-300 border-2 border-border">
                <div 
                  className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-4 bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm rotate-[2deg]"
                />
                <div className="rounded-[24px] bg-muted p-8 h-full min-h-[220px] border border-border">
                  <div className="text-primary mb-5">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="8" cy="8" r="4" />
                      <circle cx="16" cy="16" r="4" fillOpacity="0.5" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-primary mb-3 font-handwriting">Capture ideas before they slip away</h3>
                  <p className="text-xl text-foreground leading-relaxed font-handwriting">
                    Minimal friction. Create and edit in seconds, not minutes.
                  </p>
                </div>
              </div>
              </motion.div>
            </StaggerRevealItem>
          </StaggerReveal>
        </div>

      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="relative z-10 py-32 px-6 max-w-7xl mx-auto bg-background/50 rounded-3xl"
      >
        <SectionReveal>
          <div className="flex justify-center mb-6">
            <div className="w-10 h-1 bg-primary rounded-full"></div>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-center text-foreground mb-6 font-handwriting">
            How it works
          </h2>
          <p className="text-muted-foreground text-xl md:text-2xl text-center max-w-2xl mx-auto mb-20 font-handwriting">
            Capture, organize, and recall—your digital mind in four simple steps.
          </p>
        </SectionReveal>

        <div className="relative">
          <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-8 relative z-10">
            
            {/* Step 1: Write notes */}
            <StaggerRevealItem className="flex flex-col items-center text-center relative">
              <svg className="hidden lg:block absolute top-[-10%] left-[-15%] w-[130%] h-[120%] pointer-events-none text-primary z-0 opacity-60" viewBox="0 0 200 200" fill="none">
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
                <div className="relative w-56 h-36 bg-white rounded-lg shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col">
                  <div className="h-4 bg-slate-800 w-full flex items-center px-2 gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <div className="w-16 h-2.5 bg-green-500 rounded-sm" />
                    <div className="flex gap-2 items-center mt-1">
                       <div className="w-4 h-4 bg-blue-100 rounded-sm flex-shrink-0" />
                       <div className="w-24 h-2 bg-slate-200 rounded-full" />
                    </div>
                    <div className="flex gap-2 items-center">
                       <div className="w-4 h-4 bg-blue-400 rounded-sm flex-shrink-0" />
                       <div className="w-20 h-2 bg-slate-200 rounded-full" />
                    </div>
                    <div className="flex gap-2 items-center">
                       <div className="w-4 h-4 bg-blue-100 rounded-sm flex-shrink-0" />
                       <div className="w-28 h-2 bg-slate-200 rounded-full" />
                    </div>
                    <div className="mt-auto w-full h-6 bg-slate-50 rounded-sm border border-slate-100" />
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Write notes</h3>
              <p className="text-sm text-muted-foreground max-w-[200px]">
                Jot ideas, tasks, and thoughts seamlessly.
              </p>
            </StaggerRevealItem>

            {/* Step 2: Labels & archive */}
            <StaggerRevealItem className="flex flex-col items-center text-center relative mt-8 lg:mt-0">
              <svg className="hidden lg:block absolute top-[20%] left-[80%] w-[80%] h-[60%] pointer-events-none text-primary z-0 opacity-60" viewBox="0 0 100 100" fill="none">
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
                  <div className="absolute top-2 left-4 w-32 h-10 bg-white rounded shadow-md border border-slate-100 flex items-center px-3 gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-sm" />
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                  </div>
                  <div className="absolute top-10 right-2 w-32 h-10 bg-white rounded shadow-lg border border-slate-100 flex items-center px-3 gap-2 z-10">
                    <div className="w-4 h-4 bg-blue-500 rounded-sm" />
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full" />
                  </div>
                  <div className="absolute top-18 left-2 w-32 h-10 bg-white rounded shadow-md border border-slate-100 flex items-center px-3 gap-2 z-20">
                    <div className="w-4 h-4 bg-green-500 rounded-sm" />
                    <div className="w-10 h-1.5 bg-slate-200 rounded-full" />
                  </div>
                  <div className="absolute top-24 right-4 w-32 h-10 bg-white rounded shadow-xl border border-slate-100 flex items-center px-3 gap-2 z-30">
                    <div className="w-4 h-4 bg-blue-500 rounded-sm" />
                    <div className="w-14 h-1.5 bg-slate-200 rounded-full" />
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Labels & archive</h3>
              <p className="text-sm text-muted-foreground max-w-[200px]">
                Organize visually and keep everything tidy.
              </p>
            </StaggerRevealItem>

            {/* Step 3: AI helps you recall */}
            <StaggerRevealItem className="flex flex-col items-center text-center relative mt-8 lg:mt-0">
              <svg className="hidden lg:block absolute top-[60%] left-[80%] w-[80%] h-[60%] pointer-events-none text-primary z-0 opacity-60" viewBox="0 0 100 100" fill="none">
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
                  <div className="absolute top-0 left-2 w-48 h-32 bg-white rounded-lg shadow-lg border border-slate-100 overflow-hidden flex flex-col">
                    <div className="h-4 bg-slate-800 w-full flex items-center px-2 gap-1">
                      <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                    </div>
                    <div className="p-3 flex flex-col gap-2">
                      <div className="w-10 h-10 bg-green-500 rounded-sm mb-1" />
                      <div className="w-28 h-1.5 bg-slate-200 rounded-full" />
                      <div className="w-24 h-1.5 bg-slate-200 rounded-full" />
                      <div className="mt-3 w-full flex gap-2">
                        <div className="w-1/2 h-8 bg-slate-50 rounded-sm border border-slate-100" />
                        <div className="w-1/2 h-8 bg-slate-50 rounded-sm border border-slate-100" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-[-10px] right-2 w-20 h-28 bg-white rounded-lg shadow-2xl border border-slate-100 flex flex-col items-center py-2 px-1 z-10">
                    <div className="w-6 h-1 bg-slate-200 rounded-full mb-3" />
                    <div className="w-14 h-2 bg-blue-500 rounded-sm mb-2" />
                    <div className="w-14 h-1.5 bg-slate-200 rounded-full mb-1" />
                    <div className="w-10 h-1.5 bg-slate-200 rounded-full mb-4" />
                    <div className="w-14 h-8 bg-blue-50 rounded-sm border border-blue-100 mt-auto" />
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">AI helps you recall</h3>
              <p className="text-sm text-muted-foreground max-w-[200px]">
                Summaries and search find what matters.
              </p>
            </StaggerRevealItem>

            {/* Step 4: Access anywhere */}
            <StaggerRevealItem className="flex flex-col items-center text-center relative mt-8 lg:mt-0">
              <svg className="hidden lg:block absolute top-[10%] left-[50%] w-[40%] h-[80%] pointer-events-none text-primary z-0 opacity-60" viewBox="0 0 100 100" fill="none">
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
                  <div className="absolute top-4 left-4 w-24 h-28 bg-white rounded shadow-md border border-slate-100 p-2 flex flex-col gap-2">
                    <div className="w-full h-10 bg-slate-50 rounded-sm flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-slate-300" />
                    </div>
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full mx-auto mt-2" />
                    <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto" />
                  </div>
                  
                  <div className="absolute top-4 right-4 w-24 h-28 bg-white rounded shadow-md border border-slate-100 p-2 flex flex-col gap-2">
                    <div className="w-full h-10 bg-slate-50 rounded-sm flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-slate-300" />
                    </div>
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full mx-auto mt-2" />
                    <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto" />
                  </div>

                  <div className="absolute top-0 left-16 w-24 h-32 bg-white rounded shadow-xl border border-slate-100 p-2 flex flex-col gap-2 z-10">
                    <div className="w-full h-12 bg-slate-50 rounded-sm flex flex-col items-center justify-center gap-1.5">
                       <div className="flex gap-1">
                         <div className="w-3 h-3 bg-green-500 rounded-sm" />
                         <div className="w-3 h-3 bg-green-500 rounded-sm" />
                       </div>
                       <div className="flex gap-1">
                         <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                         <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                       </div>
                    </div>
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full mx-auto mt-3" />
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />
                  </div>
                  
                  <div className="absolute -top-3 right-10 w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center z-20 shadow-sm">
                    <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-md shadow-blue-500/40">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Access anywhere</h3>
              <p className="text-sm text-muted-foreground max-w-[200px]">
                Secure sync across all your devices.
              </p>
            </StaggerRevealItem>

          </StaggerReveal>
        </div>
        <SectionReveal className="text-center mt-12">
          <Button asChild variant="outline" className="rounded-xl border-2 border-border font-handwriting">
            <Link href="/register">Get Started Free</Link>
          </Button>
        </SectionReveal>
      </section>

      {/* Social proof / Testimonials */}
      <section
        id="testimonials"
        className="relative z-10 py-24 px-6 max-w-6xl mx-auto"
      >
        <SectionReveal>
          <h2 className="text-4xl font-bold tracking-tight text-center text-foreground mb-4 font-handwriting">
            Loved by thinkers
          </h2>
          <p className="text-muted-foreground text-xl text-center max-w-xl mx-auto mb-4 font-handwriting">
            Join thousands who use Vellon AI to capture and organize their ideas.
          </p>
          <p className="text-muted-foreground text-center text-sm mb-16 font-handwriting">
            10,000+ note-takers · No credit card required
          </p>
        </SectionReveal>
        <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <StaggerRevealItem>
          <motion.div
            whileHover={{ scale: 1.02, rotate: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
          <div className="bg-card p-6 rounded-2xl shadow-xl shadow-primary/10 border-2 border-border relative rotate-[-1deg] h-full">
            <Quote className="w-8 h-8 text-border mb-4" />
            <p className="text-muted-foreground text-xl mb-6 font-handwriting">
              &ldquo;Finally a notes app that stays out of the way until I need it. The AI summaries save me hours.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary font-semibold text-sm border border-border">
                JK
              </div>
              <div>
                <p className="font-bold text-foreground text-lg font-handwriting">Jamie K.</p>
                <p className="text-sm text-muted-foreground font-handwriting">Product lead</p>
              </div>
            </div>
          </div>
          </motion.div>
          </StaggerRevealItem>
          <StaggerRevealItem>
          <motion.div
            whileHover={{ scale: 1.02, rotate: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
          <div className="bg-card p-6 rounded-2xl shadow-xl shadow-primary/10 border-2 border-border relative rotate-[1deg] h-full">
            <Quote className="w-8 h-8 text-border mb-4" />
            <p className="text-muted-foreground text-xl mb-6 font-handwriting">
              &ldquo;Labels and archive work exactly how I think. I never lose a note anymore.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm border border-border">
                SM
              </div>
              <div>
                <p className="font-bold text-foreground text-lg font-handwriting">Sam M.</p>
                <p className="text-sm text-muted-foreground font-handwriting">Designer</p>
              </div>
            </div>
          </div>
          </motion.div>
          </StaggerRevealItem>
        </StaggerReveal>
      </section>

      {/* Pricing teaser */}
      <section
        id="pricing"
        className="relative z-10 py-24 px-6 max-w-4xl mx-auto"
      >
        <SectionReveal>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-center text-foreground mb-4 font-handwriting">
            Start free, upgrade when you need more
          </h2>
          <p className="text-muted-foreground text-lg text-center max-w-xl mx-auto mb-12 font-handwriting">
            Free tier includes notes, labels, archive, and AI summaries. No credit card required.
          </p>
          <div className="bg-card rounded-2xl border-2 border-border p-8 md:p-10 shadow-xl shadow-primary/10 text-center">
            <p className="text-4xl md:text-5xl font-bold text-primary mb-2 font-handwriting">$0</p>
            <p className="text-muted-foreground mb-6 font-handwriting">to get started</p>
            <ul className="text-foreground text-left max-w-sm mx-auto space-y-2 mb-8 font-handwriting">
              <li className="flex items-center gap-2"><span className="text-primary">✓</span> Unlimited notes</li>
              <li className="flex items-center gap-2"><span className="text-primary">✓</span> Labels & archive</li>
              <li className="flex items-center gap-2"><span className="text-primary">✓</span> AI summaries & keywords</li>
              <li className="flex items-center gap-2"><span className="text-primary">✓</span> Secure sync</li>
              <li className="flex items-center gap-2"><span className="text-primary">✓</span> Cancel anytime</li>
            </ul>
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 py-6 text-xl font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 font-handwriting"
            >
              <Link href="/register">Get Started Free</Link>
            </Button>
          </div>
        </SectionReveal>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="relative z-10 py-24 px-6 max-w-3xl mx-auto"
      >
        <SectionReveal>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-center text-foreground mb-12 font-handwriting">
            Frequently asked questions
          </h2>
          <dl className="space-y-8">
            <div>
              <dt className="text-lg font-semibold text-foreground mb-2 font-handwriting">How fast is setup?</dt>
              <dd className="text-muted-foreground font-handwriting">Under a minute. Sign up, verify your email, and start creating notes. No install required.</dd>
            </div>
            <div>
              <dt className="text-lg font-semibold text-foreground mb-2 font-handwriting">Is my data private?</dt>
              <dd className="text-muted-foreground font-handwriting">Yes. Your notes are yours. We don’t train AI on your content and we don’t sell your data.</dd>
            </div>
            <div>
              <dt className="text-lg font-semibold text-foreground mb-2 font-handwriting">Can I cancel anytime?</dt>
              <dd className="text-muted-foreground font-handwriting">Yes. Free forever for core features. If you upgrade later, you can cancel anytime with no long-term commitment.</dd>
            </div>
            <div>
              <dt className="text-lg font-semibold text-foreground mb-2 font-handwriting">What’s included in the free tier?</dt>
              <dd className="text-muted-foreground font-handwriting">Unlimited notes, labels, archive, AI summaries and keywords, and secure sync across devices.</dd>
            </div>
          </dl>
        </SectionReveal>
      </section>

      {/* Security note */}
      <section className="relative z-10 py-16 px-6 max-w-4xl mx-auto text-center">
        <SectionReveal>
          <div className="inline-flex items-center gap-2 text-muted-foreground text-lg mb-6 font-handwriting">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <span>Your notes are private and secure. We don’t train AI on your content.</span>
        </div>
        </SectionReveal>
      </section>

      {/* Final CTA */}
      <section
        id="cta"
        className="relative z-10 py-24 px-6 max-w-3xl mx-auto"
      >
        <SectionReveal>
        <div className="bg-muted p-10 md:p-14 rounded-3xl shadow-xl shadow-primary/10 border-2 border-border text-center relative rotate-[-1deg]">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm rotate-[2deg]" />
          <h2 className="text-3xl md:text-5xl font-bold text-primary mb-4 font-handwriting">
            Ready to build your second brain?
          </h2>
          <p className="text-muted-foreground text-xl mb-8 max-w-md mx-auto font-handwriting">
            Create a free account and start capturing ideas in seconds.
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

      <footer className="relative z-10 py-12 border-t border-border text-center bg-background font-handwriting">
        <nav className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground mb-4">
          <Link href="#how-it-works" className="hover:text-primary transition-colors">How it works</Link>
          <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          <Link href="#faq" className="hover:text-primary transition-colors">FAQ</Link>
          <Link href="/register" className="font-semibold text-primary hover:underline">Get Started Free</Link>
        </nav>
        <p className="text-lg text-muted-foreground">© {new Date().getFullYear()} Vellon AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
