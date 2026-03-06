'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Search,
  ShoppingCart,
  Moon,
  Play,
  CheckCircle2,
  BookOpen,
  MonitorPlay,
  Award,
  Users,
  MessageSquare,
  Sparkles,
  Zap,
  Lock
} from 'lucide-react';

export default function HeroSection() {
  return (
    <div className="relative min-h-screen bg-[#FDFDFD] text-slate-900 overflow-hidden font-sans">
      {/* Dotted Background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at center, #E2E8F0 2px, transparent 2px)',
          backgroundSize: '48px 48px',
          backgroundPosition: '0 0, 24px 24px'
        }}
      />

      {/* Floating notes layer (behind content, full width) */}
      <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center">
        <div className="relative w-full max-w-7xl mx-auto h-full min-h-[calc(100vh-80px)] pt-24 pb-32">
          {/* 1. Yellow Sticky Note (Top Left) */}
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="absolute top-32 left-4 md:left-8 lg:left-16 hidden md:block"
          >
            <div className="bg-[#FFF8C5] p-5 rounded-md shadow-lg shadow-yellow-900/5 rotate-[-6deg] w-[260px] border border-yellow-200">
              <div className="w-3 h-3 rounded-full bg-red-400 absolute -top-1.5 left-1/2 -translate-x-1/2 shadow-sm" />
              <div className="flex items-center gap-2 mb-2 font-semibold text-slate-800 text-sm">
                <BookOpen className="w-4 h-4" />
                New Feature
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                "AI Summaries are now live! Auto-tagging is out."
              </p>
              <div className="inline-block bg-yellow-300 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded">
                NEW
              </div>
            </div>
          </motion.div>

          {/* 2. Success Speech Bubble (Top Right) */}
          <motion.div
            animate={{ y: [10, -10, 10] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="absolute top-44 right-4 md:right-8 lg:right-16 hidden lg:block"
          >
            <div className="bg-white p-4 rounded-2xl rounded-tr-sm shadow-xl shadow-slate-200/50 w-[240px] border border-slate-100 relative">
              <div className="absolute -bottom-3 right-6 w-6 h-6 bg-white border-b border-r border-slate-100 rotate-45 rounded-sm" />
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="font-semibold text-slate-800 text-sm">Idea Captured!</div>
              </div>
              <p className="text-xs text-slate-500 italic mb-2">
                "Thanks to NoteMind AI, I never lose my random 3AM startup ideas."
              </p>
              <div className="flex items-center justify-between">
                <div className="flex text-yellow-400 text-xs">
                  ★★★★★
                </div>
                <span className="text-[10px] text-slate-400">- Sarah J.</span>
              </div>
            </div>
          </motion.div>

          {/* 3. Progress Card (Bottom Left) */}
          <motion.div
            animate={{ y: [-8, 8, -8] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
            className="absolute bottom-40 left-4 md:left-8 lg:left-16 hidden lg:block"
          >
            <div className="bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/50 w-[280px] border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <div className="font-semibold text-slate-800 text-sm">Your Productivity</div>
                <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Play className="w-3 h-3 ml-0.5" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-700">Daily Journaling</span>
                    <span className="text-slate-500">75%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '75%' }} />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Consistency Streak</div>
                </div>
                
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-medium text-slate-700">Weekly Review Completed</span>
                  </div>
                  <div className="text-[10px] text-slate-400 ml-6">All notes organized</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 4. Features Card (Bottom Right) */}
          <motion.div
            animate={{ y: [8, -8, 8] }}
            transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }}
            className="absolute bottom-48 right-4 md:right-8 lg:right-16 hidden md:block"
          >
            <div className="bg-white p-4 rounded-2xl shadow-xl shadow-slate-200/50 w-[220px] border border-slate-100 rotate-3">
              <div className="font-semibold text-slate-800 text-sm mb-3 text-center">Why NoteMind AI?</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-medium text-slate-500">Fast</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-medium text-slate-500">AI Powered</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-medium text-slate-500">Secure</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xl">
            N
          </div>
          <span className="font-semibold text-lg tracking-tight">NoteMind AI</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link href="#notes" className="hover:text-blue-600 transition-colors">Notes</Link>
          <Link href="#labels" className="hover:text-blue-600 transition-colors">Labels</Link>
          <Link href="#archive" className="hover:text-blue-600 transition-colors">Archive</Link>
          <Link href="#settings" className="hover:text-blue-600 transition-colors">Settings</Link>
        </div>

        <div className="flex items-center gap-4 text-slate-600">
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors hidden sm:block">
            <Moon className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 ml-2 cursor-pointer p-1 pr-3 hover:bg-slate-100 rounded-full transition-colors border border-slate-200">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
              MA
            </div>
            <span className="text-sm font-medium hidden sm:block">Admin</span>
          </div>
        </div>
      </nav>

      {/* Main Hero Content */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center pt-24 pb-32 px-6 max-w-5xl mx-auto min-h-[calc(100vh-80px)]">
        
        {/* Content stack (above floating notes) */}
        <div className="relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-4xl"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
            Master Your Notes with <br className="hidden sm:block" />
            <span className="text-blue-600">NoteMind AI</span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg sm:text-xl text-slate-500 max-w-2xl mb-10 leading-relaxed"
        >
          The ultimate platform for capturing ideas, organizing tasks, and AI-powered summaries. Build your second brain today.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 w-full"
        >
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 text-base font-semibold shadow-lg shadow-blue-600/25 transition-all hover:scale-105">
            Get Started Free
          </Button>
          <Button variant="ghost" className="rounded-full px-8 py-6 text-base font-semibold text-slate-700 hover:bg-slate-100 transition-all hover:scale-105 group">
            <Play className="w-4 h-4 mr-2 fill-slate-700 group-hover:fill-slate-900" />
            Watch Demo
          </Button>
        </motion.div>

        {/* Trusted By */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-sm font-medium text-slate-400 mt-auto"
        >
          Trusted by 10,000+ Thinkers
        </motion.div>
        </div>

      </main>
    </div>
  );
}
