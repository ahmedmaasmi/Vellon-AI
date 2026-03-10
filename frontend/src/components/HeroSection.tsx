'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Search, Moon } from 'lucide-react';
import CalendarBackground from './CalendarBackground';

export default function HeroSection() {
  const { isAuthenticated, user } = useAuthStore();
  
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden font-sans">
      <CalendarBackground />

      {/* Floating notes layer (behind content, full width) */}
      <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center">
        <div className="relative w-full max-w-7xl mx-auto h-full min-h-[calc(100vh-80px)] pt-24 pb-32">
          
          {/* 1. Yellow Sticky Note (Top Left) - pastel */}
          <motion.div
            animate={{ rotate: [-4, -6, -4] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="absolute top-24 left-4 md:left-12 lg:left-20 hidden md:block"
          >
            <div className="bg-yellow-100 p-6 shadow-md shadow-primary/10 w-[240px] border border-yellow-200 relative font-handwriting text-2xl text-yellow-900">
              {/* Tape */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/70 backdrop-blur-sm border border-white/40 rotate-[-2deg] shadow-sm" />
              <p className="leading-relaxed">
                Grocery list:<br />
                - Milk<br />
                - Eggs<br />
                - Coffee<br />
                - MORE COFFEE!!
              </p>
            </div>
          </motion.div>

          {/* 2. Pink Sticky Note (Top Right) - pastel */}
          <motion.div
            animate={{ rotate: [6, 4, 6] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
            className="absolute top-36 right-4 md:right-12 lg:right-24 hidden lg:block"
          >
            <div className="bg-pink-100 p-6 shadow-md shadow-primary/10 w-[260px] border border-pink-200 relative font-handwriting text-2xl text-pink-900">
              {/* Tape */}
              <div className="absolute -top-3 left-1/3 w-14 h-5 bg-white/70 backdrop-blur-sm border border-white/40 rotate-[3deg] shadow-sm" />
              <p className="leading-relaxed">
                Idea: An app that reminds you where you left your sticky notes 🤔
              </p>
            </div>
          </motion.div>

          {/* 3. Blue Sticky Note (Bottom Left) - pastel */}
          <motion.div
            animate={{ rotate: [-2, -4, -2] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="absolute bottom-32 left-4 md:left-16 lg:left-32 hidden lg:block"
          >
            <div className="bg-blue-100 p-6 shadow-md shadow-blue-900/10 w-[220px] border border-blue-200 relative font-handwriting text-2xl text-blue-900">
              {/* Tape */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-5 bg-white/70 backdrop-blur-sm border border-white/40 rotate-[-4deg] shadow-sm" />
              <p className="leading-relaxed text-center font-bold text-blue-800 text-3xl mt-2">
                Call mom!!
              </p>
            </div>
          </motion.div>

          {/* 4. Green Sticky Note (Bottom Right) - pastel */}
          <motion.div
            animate={{ rotate: [12, 10, 12] }}
            transition={{ repeat: Infinity, duration: 6.5, ease: "easeInOut" }}
            className="absolute bottom-40 right-4 md:right-16 lg:right-32 hidden md:block"
          >
            <div className="bg-green-100 p-6 shadow-md shadow-green-900/10 w-[200px] border border-green-200 relative font-handwriting text-2xl text-green-900">
              {/* Tape */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/70 backdrop-blur-sm border border-white/40 rotate-[5deg] shadow-sm" />
              <p className="leading-relaxed text-center">
                password123<br />
                <span className="text-sm text-green-700 font-sans">(don't lose this!)</span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link href="/" className="font-bold text-2xl tracking-tight text-foreground hover:text-primary transition-colors font-handwriting">
          Vellon AI
        </Link>

        <div className="hidden md:flex items-center gap-8 text-xl font-medium text-muted-foreground font-handwriting">
          <Link href="#why" className="hover:text-primary transition-colors">Why</Link>
          <Link href="#how-it-works" className="hover:text-primary transition-colors">How it works</Link>
          <Link href="#testimonials" className="hover:text-primary transition-colors">Testimonials</Link>
          <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          <Link href="#faq" className="hover:text-primary transition-colors">FAQ</Link>
        </div>

        <div className="flex items-center gap-4 text-muted-foreground">
          <button className="p-2 hover:bg-muted rounded-full transition-colors hidden sm:block" type="button" aria-label="Theme">
            <Moon className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-muted rounded-full transition-colors" type="button" aria-label="Search">
            <Search className="w-5 h-5" />
          </button>
          {isAuthenticated && user?.avatar_url && (
            <Link href="/dashboard" className="flex items-center gap-2 ml-2 p-1 pr-3 hover:bg-muted rounded-full transition-colors border border-border">
              <span className="relative w-8 h-8 rounded-full overflow-hidden bg-muted shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.avatar_url} alt="" width={32} height={32} className="w-8 h-8 object-cover" />
              </span>
              <span className="text-sm font-medium hidden sm:block">{user.display_name || user.email}</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Main Hero Content */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center pt-24 pb-32 px-6 max-w-5xl mx-auto min-h-[calc(100vh-80px)]">
        
        {/* Content stack (above floating notes) */}
        <div className="relative z-10 bg-white/50 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none p-6 rounded-3xl">
          {/* Heading: what it is */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-4xl"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.1] font-handwriting">
              Notes that <span className="text-primary inline-block rotate-[-2deg] bg-muted px-3 rounded-md border border-border shadow-sm">remember for you</span>
            </h1>
          </motion.div>

          {/* Subtitle: who it's for + key outcome */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-2xl text-muted-foreground max-w-2xl mb-10 leading-relaxed font-medium mx-auto font-handwriting"
          >
            For thinkers and doers. Capture ideas, get AI summaries, and find anything in seconds—without leaving your notes.
          </motion.p>

          {/* CTA Buttons: primary + secondary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 w-full"
          >
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 py-6 text-2xl font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 hover:-rotate-1 font-handwriting">
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl px-6 py-6 text-xl font-semibold border-2 border-border hover:bg-muted font-handwriting">
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </motion.div>

          {/* Trust line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-sm sm:text-base text-muted-foreground mb-12 font-handwriting"
          >
            No credit card required · Privacy-first · Set up in under a minute
          </motion.p>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-xl font-bold text-muted-foreground mt-auto tracking-wider font-handwriting"
          >
            Trusted by 10,000+ note-takers
          </motion.div>
        </div>

      </main>
    </div>
  );
}
