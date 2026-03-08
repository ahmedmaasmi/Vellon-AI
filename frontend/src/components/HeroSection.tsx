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
    <div className="relative min-h-screen bg-[#fdfbf7] text-[#2c1810] overflow-hidden font-sans">
      <CalendarBackground />

      {/* Floating notes layer (behind content, full width) */}
      <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center">
        <div className="relative w-full max-w-7xl mx-auto h-full min-h-[calc(100vh-80px)] pt-24 pb-32">
          
          {/* 1. Yellow Sticky Note (Top Left) */}
          <motion.div
            animate={{ rotate: [-4, -6, -4] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="absolute top-24 left-4 md:left-12 lg:left-20 hidden md:block"
          >
            <div className="bg-yellow-300 p-6 shadow-md shadow-[#4a362a]/10 w-[240px] border border-yellow-400 relative font-handwriting text-2xl text-slate-800">
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

          {/* 2. Pink Sticky Note (Top Right) */}
          <motion.div
            animate={{ rotate: [6, 4, 6] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
            className="absolute top-36 right-4 md:right-12 lg:right-24 hidden lg:block"
          >
            <div className="bg-pink-400 p-6 shadow-md shadow-[#4a362a]/10 w-[260px] border border-pink-500 relative font-handwriting text-2xl text-white">
              {/* Tape */}
              <div className="absolute -top-3 left-1/3 w-14 h-5 bg-white/70 backdrop-blur-sm border border-white/40 rotate-[3deg] shadow-sm" />
              <p className="leading-relaxed">
                Idea: An app that reminds you where you left your sticky notes 🤔
              </p>
            </div>
          </motion.div>

          {/* 3. Blue Sticky Note (Bottom Left) */}
          <motion.div
            animate={{ rotate: [-2, -4, -2] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="absolute bottom-32 left-4 md:left-16 lg:left-32 hidden lg:block"
          >
            <div className="bg-blue-300 p-6 shadow-md shadow-blue-900/10 w-[220px] border border-blue-400 relative font-handwriting text-2xl text-slate-800">
              {/* Tape */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-5 bg-white/70 backdrop-blur-sm border border-white/40 rotate-[-4deg] shadow-sm" />
              <p className="leading-relaxed text-center font-bold text-blue-900 text-3xl mt-2">
                Call mom!!
              </p>
            </div>
          </motion.div>

          {/* 4. Green Sticky Note (Bottom Right) */}
          <motion.div
            animate={{ rotate: [12, 10, 12] }}
            transition={{ repeat: Infinity, duration: 6.5, ease: "easeInOut" }}
            className="absolute bottom-40 right-4 md:right-16 lg:right-32 hidden md:block"
          >
            <div className="bg-green-400 p-6 shadow-md shadow-green-900/10 w-[200px] border border-green-500 relative font-handwriting text-2xl text-white">
              {/* Tape */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/70 backdrop-blur-sm border border-white/40 rotate-[5deg] shadow-sm" />
              <p className="leading-relaxed text-center">
                password123<br />
                <span className="text-sm text-green-100 font-sans">(don't lose this!)</span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link href="/" className="font-bold text-2xl tracking-tight text-[#2c1810] hover:text-[#1e3a8a] transition-colors font-handwriting">
          NoteMind AI
        </Link>

        <div className="hidden md:flex items-center gap-8 text-xl font-medium text-[#4a362a] font-handwriting">
          <Link href="#notes" className="hover:text-[#1e3a8a] transition-colors">Notes</Link>
          <Link href="#labels" className="hover:text-[#1e3a8a] transition-colors">Labels</Link>
          <Link href="#archive" className="hover:text-[#1e3a8a] transition-colors">Archive</Link>
          <Link href="#settings" className="hover:text-[#1e3a8a] transition-colors">Settings</Link>
        </div>

        <div className="flex items-center gap-4 text-[#4a362a]">
          <button className="p-2 hover:bg-[#f0eadd] rounded-full transition-colors hidden sm:block" type="button" aria-label="Theme">
            <Moon className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-[#f0eadd] rounded-full transition-colors" type="button" aria-label="Search">
            <Search className="w-5 h-5" />
          </button>
          {isAuthenticated && user?.avatar_url && (
            <Link href="/dashboard" className="flex items-center gap-2 ml-2 p-1 pr-3 hover:bg-[#f0eadd] rounded-full transition-colors border border-[#d6caba]">
              <span className="relative w-8 h-8 rounded-full overflow-hidden bg-[#d6caba] shrink-0">
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
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-4xl"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-blue-950 mb-6 leading-[1.1] font-handwriting">
              Your brain, now in <br className="hidden sm:block" />
              <span className="text-blue-900 inline-block rotate-[-2deg] bg-[#e2d4bc] px-3 rounded-md border border-[#cbb593] shadow-sm">sticky note</span> form.
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-2xl text-slate-800 max-w-2xl mb-10 leading-relaxed font-medium mx-auto font-handwriting"
          >
            Because your best ideas shouldn't be written on a napkin you'll lose tomorrow. The messy, colorful, perfectly imperfect way to take notes.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 w-full"
          >
            <Button asChild className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl px-8 py-6 text-2xl font-bold shadow-xl shadow-[#1e3a8a]/20 transition-all hover:scale-105 hover:-rotate-1 font-handwriting">
              <Link href="/register">Start scribbling</Link>
            </Button>
          </motion.div>

          {/* Trusted By */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-xl font-bold text-[#8a7364] mt-auto tracking-wider font-handwriting"
          >
            Currently holding together 10,000+ chaotic minds
          </motion.div>
        </div>

      </main>
    </div>
  );
}
