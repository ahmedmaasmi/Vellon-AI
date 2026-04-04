'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Search, Moon, Sun, Menu, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import CalendarBackground from './CalendarBackground';
import { useAppTheme } from '@/components/providers/AppProviders';

const NAV_LINKS = [
  { href: '#why', label: 'Why' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
] as const;

function FloatingNote({
  className,
  children,
  reducedMotion,
  initialRotate,
  duration = 6.5,
}: {
  className?: string;
  children: React.ReactNode;
  reducedMotion: boolean;
  initialRotate: number;
  duration?: number;
}) {
  return (
    <motion.div
      animate={
        reducedMotion
          ? { rotate: initialRotate }
          : { rotate: [initialRotate - 2, initialRotate + 2, initialRotate] }
      }
      transition={
        reducedMotion
          ? { duration: 0 }
          : { repeat: Infinity, duration, ease: 'easeInOut' }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function HeroSection() {
  const { isAuthenticated, user } = useAuthStore();
  const { resolved, toggleLightDark } = useAppTheme();
  const reducedMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden font-sans">
      <CalendarBackground />

      {/* Floating notes layer (behind content, full width) */}
      <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center">
        <div className="relative w-full max-w-7xl mx-auto h-full min-h-[calc(100vh-80px)] pt-24 pb-32">
          {/* 1. Yellow — aspirational list */}
          <FloatingNote
            reducedMotion={!!reducedMotion}
            initialRotate={-5}
            duration={6}
            className="absolute top-24 left-4 md:left-12 lg:left-20 hidden md:block"
          >
            <div className="bg-yellow-100 dark:bg-yellow-950/40 p-6 shadow-md shadow-primary/10 w-[240px] border border-yellow-200 dark:border-yellow-800/50 relative font-handwriting text-2xl text-yellow-900 dark:text-yellow-100">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/70 dark:bg-card/80 backdrop-blur-sm border border-white/40 rotate-[-2deg] shadow-sm" />
              <p className="leading-relaxed">
                Startup pitch ideas
                <br />
                <span className="text-lg opacity-90">— problem, wedge, first 10 users</span>
              </p>
            </div>
          </FloatingNote>

          {/* 2. Pink — reading / learning */}
          <FloatingNote
            reducedMotion={!!reducedMotion}
            initialRotate={5}
            duration={7}
            className="absolute top-36 right-4 md:right-12 lg:right-24 hidden lg:block"
          >
            <div className="bg-pink-100 dark:bg-pink-950/40 p-6 shadow-md shadow-primary/10 w-[260px] border border-pink-200 dark:border-pink-800/50 relative font-handwriting text-2xl text-pink-900 dark:text-pink-100">
              <div className="absolute -top-3 left-1/3 w-14 h-5 bg-white/70 dark:bg-card/80 backdrop-blur-sm border border-white/40 rotate-[3deg] shadow-sm" />
              <p className="leading-relaxed">
                Books to read
                <br />
                <span className="text-lg">+ quotes I don&apos;t want to lose</span>
              </p>
            </div>
          </FloatingNote>

          {/* 3. Blue — weekly reflection */}
          <FloatingNote
            reducedMotion={!!reducedMotion}
            initialRotate={-3}
            duration={8}
            className="absolute bottom-32 left-4 md:left-16 lg:left-32 hidden lg:block"
          >
            <div className="bg-blue-100 dark:bg-blue-950/40 p-6 shadow-md shadow-blue-900/10 w-[220px] border border-blue-200 dark:border-blue-800/50 relative font-handwriting text-2xl text-blue-900 dark:text-blue-100">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-5 bg-white/70 dark:bg-card/80 backdrop-blur-sm border border-white/40 rotate-[-4deg] shadow-sm" />
              <p className="leading-relaxed text-center font-bold text-blue-800 dark:text-blue-200 text-2xl mt-2">
                Weekly reflection
              </p>
              <p className="text-center text-lg font-normal mt-1 opacity-90">Wins · lessons · next week</p>
            </div>
          </FloatingNote>

          {/* 4. Green — capture habit */}
          <FloatingNote
            reducedMotion={!!reducedMotion}
            initialRotate={11}
            duration={6.5}
            className="absolute bottom-40 right-4 md:right-16 lg:right-32 hidden md:block"
          >
            <div className="bg-green-100 dark:bg-green-950/40 p-6 shadow-md shadow-green-900/10 w-[220px] border border-green-200 dark:border-green-800/50 relative font-handwriting text-2xl text-green-900 dark:text-green-100">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/70 dark:bg-card/80 backdrop-blur-sm border border-white/40 rotate-[5deg] shadow-sm" />
              <p className="leading-relaxed text-center">
                One inbox for ideas
                <br />
                <span className="text-base font-sans text-green-800 dark:text-green-200/90">Tag later. Find fast.</span>
              </p>
            </div>
          </FloatingNote>
        </div>
      </div>

      {/* Mobile: subtle product hint when notes are hidden */}
      <div
        className="md:hidden absolute bottom-28 left-1/2 -translate-x-1/2 z-[5] pointer-events-none w-[min(100%,280px)] opacity-40"
        aria-hidden
      >
        <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-3 shadow-sm">
          <div className="flex gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
            <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
            <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2 w-3/4 rounded bg-muted" />
            <div className="h-2 w-full rounded bg-muted/80" />
            <div className="h-2 w-5/6 rounded bg-muted/80" />
          </div>
        </div>
      </div>

      {/* Sticky Navbar */}
      <header className="sticky top-0 z-[60] w-full border-b border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
        <nav className="relative flex items-center justify-between px-4 sm:px-6 py-3 max-w-7xl mx-auto">
          <Link
            href="/"
            className="font-bold text-2xl tracking-tight text-foreground hover:text-primary transition-colors font-handwriting shrink-0"
          >
            Vellon AI
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xl font-medium text-muted-foreground font-handwriting">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-primary transition-colors">
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
            <button
              className="p-2 hover:bg-muted rounded-full transition-colors"
              type="button"
              aria-label={resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title="Toggle theme"
              onClick={() => toggleLightDark()}
            >
              {resolved === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {!isAuthenticated && (
              <button
                className="p-2 hover:bg-muted rounded-full transition-colors hidden sm:flex"
                type="button"
                aria-label="Site search"
                title="Coming soon"
                onClick={() =>
                  toast.message('Site search is coming soon', {
                    description: 'Use search inside the app after you sign in.',
                  })
                }
              >
                <Search className="w-5 h-5" />
              </button>
            )}
            {isAuthenticated && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 p-1 pr-3 hover:bg-muted rounded-full transition-colors border border-border max-w-[200px]"
                aria-label="Go to dashboard"
              >
                <span className="relative w-8 h-8 rounded-full overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                  {user?.avatar_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={user.avatar_url} alt="" width={32} height={32} className="w-8 h-8 object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center bg-primary/80 text-primary-foreground text-sm font-medium">
                      {(user?.display_name || user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="text-sm font-medium hidden sm:block truncate">
                  {user?.display_name || user?.email}
                </span>
              </Link>
            )}

            <button
              type="button"
              className="md:hidden p-2 hover:bg-muted rounded-full transition-colors"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-menu"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu panel */}
        {mobileOpen ? (
          <div
            id="mobile-nav-menu"
            className="md:hidden border-t border-border bg-background/95 backdrop-blur-md"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-lg font-medium text-foreground py-3 px-2 rounded-lg hover:bg-muted font-handwriting"
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              ))}
              {!isAuthenticated && (
                <Link
                  href="/register"
                  className="text-lg font-semibold text-primary py-3 px-2 rounded-lg hover:bg-muted font-handwriting"
                  onClick={() => setMobileOpen(false)}
                >
                  Get started free
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </header>

      {/* Main Hero Content */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center pt-16 sm:pt-24 pb-24 sm:pb-32 px-6 max-w-5xl mx-auto min-h-[calc(100vh-80px)]">
        <div className="relative z-10 bg-card/60 dark:bg-card/40 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none p-6 rounded-3xl border border-border/50 sm:border-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-4xl"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.1] font-handwriting">
              Notes that{' '}
              <span className="text-primary inline-block rotate-[-2deg] bg-muted px-3 rounded-md border border-border shadow-sm">
                remember for you
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-2xl text-muted-foreground max-w-2xl mb-10 leading-relaxed font-medium mx-auto"
          >
            For thinkers and doers. Capture ideas, get AI summaries, and find anything in seconds—without leaving your
            notes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 w-full"
          >
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 py-6 text-2xl font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 hover:-rotate-1 font-handwriting"
            >
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl px-6 py-6 text-xl font-semibold border-2 border-border hover:bg-muted font-handwriting"
            >
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-sm sm:text-base text-muted-foreground mb-8"
          >
            No credit card required · Privacy-first · Set up in under a minute
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.65 }}
            className="text-base sm:text-lg font-semibold text-muted-foreground"
          >
            Built for teams and solo thinkers
          </motion.p>
        </div>

        {/* Scroll indicator */}
        <motion.a
          href="#product"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors z-20"
          aria-label="Scroll to product preview"
          animate={reducedMotion ? undefined : { y: [0, 6, 0] }}
          transition={reducedMotion ? undefined : { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        >
          <span className="text-xs font-medium uppercase tracking-wider">Explore</span>
          <ChevronDown className="w-6 h-6" />
        </motion.a>
      </main>
    </div>
  );
}
