'use client';

import React from 'react';
import { Star, Leaf, Pencil, CheckSquare } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export default function CalendarBackground() {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const reducedMotion = useReducedMotion();
  const now = new Date();
  const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-muted/50 text-foreground flex flex-col font-handwriting opacity-30">
      
      {/* Background decorations — warm brown theme */}
      <motion.div 
        animate={reducedMotion ? { rotate: -5 } : { rotate: [-5, 5, -5] }}
        transition={reducedMotion ? { duration: 0 } : { repeat: Infinity, duration: 8, ease: "easeInOut" }}
        className="absolute top-10 left-10 opacity-20"
      >
         <Leaf className="w-24 h-24 text-primary" strokeWidth={1} />
      </motion.div>
      <motion.div 
        animate={reducedMotion ? { rotate: 5 } : { rotate: [5, -5, 5] }}
        transition={reducedMotion ? { duration: 0 } : { repeat: Infinity, duration: 9, ease: "easeInOut" }}
        className="absolute bottom-20 right-10 opacity-20"
      >
         <Leaf className="w-32 h-32 text-primary/80 rotate-45" strokeWidth={1} />
      </motion.div>

    {/* Header */}
    <div className="flex justify-between items-end px-8 pt-8 pb-4">
      <h2 className="text-5xl sm:text-7xl font-bold tracking-wider text-primary opacity-60">
        {monthYear}
      </h2>
    </div>

      {/* Mobile Fallback: Subtle scattered elements instead of a rigid grid to prevent collapse */}
      <div className="md:hidden flex-1 relative flex items-center justify-center w-full h-full">
        <div className="absolute top-1/4 left-1/4 transform -rotate-12 opacity-40">
           <Leaf className="w-16 h-16 text-primary" />
        </div>
        <div className="absolute top-1/2 right-1/4 transform rotate-12 opacity-40">
           <span className="text-3xl font-bold text-primary">PLAN</span>
        </div>
        <div className="absolute bottom-1/3 left-1/3 transform -rotate-6 opacity-40">
           <Star className="w-8 h-8 text-primary" />
        </div>
        <div className="absolute top-3/4 right-1/3 transform rotate-6 opacity-40">
           <CheckSquare className="w-10 h-10 text-primary" />
        </div>
      </div>

      {/* Desktop Calendar Grid — brownish palette */}
      <div className="hidden md:grid flex-1 grid-cols-7 grid-rows-[auto_1fr_1fr_1fr_1fr_1fr] border-t border-l border-border mx-8 mb-8 bg-card/20">
        
        {/* Days of Week Header */}
        {days.map((day, i) => (
          <div key={day} className={`text-center py-2 text-xl sm:text-2xl font-bold border-r border-b border-border bg-muted/40 ${i === 0 || i === 6 ? 'text-muted-foreground' : 'text-foreground/70'}`}>
            {day}
          </div>
        ))}

        {/* --- ROW 1 --- */}
        <div className="border-r border-b border-border relative p-2 bg-muted/30">
          <span className="text-xl"></span>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl"></span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center rotate-[-3deg]">
            <Leaf className="w-8 h-8 text-primary/50 mb-1" strokeWidth={1.5} />
            <Star className="w-5 h-5 text-primary/60 absolute -right-6 bottom-0" fill="currentColor" />
          </div>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">1</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center rotate-[2deg]">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-center leading-none mt-4">PROJECT<br/>DUE</span>
            <div className="w-16 h-1 bg-primary rounded-full mt-1 opacity-40"></div>
            <div className="w-12 h-1 bg-primary rounded-full mt-1 opacity-40"></div>
          </div>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">2</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <Leaf className="w-10 h-10 text-primary/50" strokeWidth={1.5} />
          </div>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">3</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center rotate-[-4deg]">
            <span className="text-2xl sm:text-3xl font-bold text-center leading-none mt-4">PROJECT<br/>DUE</span>
            <CheckSquare className="w-6 h-6 text-primary/50 mt-2 absolute -right-6 bottom-0" />
          </div>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">4</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center rotate-[3deg]">
            <span className="text-2xl sm:text-3xl text-center leading-none mt-4">WEEKEND<br/>PLAN \ /</span>
            <CheckSquare className="w-6 h-6 text-primary/50 mt-1" />
          </div>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">5</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center rotate-[-2deg]">
             <span className="text-2xl sm:text-3xl text-center leading-none mt-4">WEEKEND<br/>PLAN</span>
          </div>
        </div>

        {/* --- ROW 2 --- */}
        <div className="border-r border-b border-border relative p-2 bg-muted/40">
          <span className="text-xl">5</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center rotate-[-5deg]">
            <span className="text-2xl sm:text-3xl font-bold text-center leading-none mt-4">PROJECT<br/>DUE</span>
            <CheckSquare className="w-6 h-6 text-primary/50 mt-2 absolute -right-6 bottom-0" />
          </div>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">6</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center rotate-[4deg]">
            <span className="text-xl sm:text-2xl text-center leading-none mt-2">forest<br/>walk ⤵</span>
            <Leaf className="w-8 h-8 text-primary/50 mt-1" strokeWidth={1.5} />
          </div>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">7</span>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">8</span>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">9</span>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">10</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center rotate-[3deg]">
             <span className="text-2xl sm:text-3xl text-center leading-none mt-2">PLAN<br/>&<br/>EXPLORE</span>
             <CheckSquare className="w-5 h-5 text-primary/50 absolute -right-5 bottom-0" />
             <Star className="w-5 h-5 text-primary/60 absolute -right-3 -top-2" fill="currentColor" />
          </div>
        </div>
        <div className="border-r border-b border-border relative p-2 bg-muted/35">
          <span className="text-xl">11</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
             <Leaf className="w-10 h-10 text-primary/50 ml-8" strokeWidth={1.5} />
             <div className="w-8 h-4 bg-primary/30 rounded-b-lg ml-8 -mt-2 border border-primary/30"></div>
          </div>
        </div>

        {/* --- ROW 3 --- */}
        <div className="border-r border-b border-border relative p-2 bg-muted/35">
          <span className="text-xl">12</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center rotate-[-3deg]">
             <span className="text-2xl sm:text-3xl text-center leading-none mt-2">BRAINEND<br/>PLAN</span>
             <Leaf className="w-6 h-6 text-primary/50 mt-2 absolute -right-6 -bottom-2" strokeWidth={1.5} />
          </div>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">13</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center mt-2">
             <Leaf className="w-12 h-12 sm:w-16 sm:h-16 text-primary/50" strokeWidth={1.5} />
             <div className="w-10 sm:w-14 h-6 bg-primary/30 rounded-b-xl -mt-4 border border-primary/30"></div>
             <CheckSquare className="w-6 h-6 text-primary/50 absolute -right-6 -top-2" />
          </div>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">14</span>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">15</span>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">16</span>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">17</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center rotate-[-3deg]">
             <span className="text-2xl sm:text-3xl text-center leading-none mt-4">WEEKEND<br/>PLAN</span>
          </div>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">18</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center rotate-[4deg]">
             <span className="text-2xl sm:text-3xl font-bold text-center leading-none mt-4">NEW<br/>GOAL</span>
             <Star className="w-5 h-5 text-primary/60 absolute -right-4 -bottom-6" fill="currentColor" />
             <Star className="w-4 h-4 text-primary/60 absolute -right-8 -bottom-2" fill="currentColor" />
          </div>
        </div>

        {/* --- ROW 4 --- */}
        <div className="border-r border-b border-border relative p-2 bg-muted/40">
          <span className="text-xl">19</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center rotate-[2deg]">
             <span className="text-2xl sm:text-3xl font-bold text-center leading-none mt-4">NATURE<br/>TIME</span>
             <CheckSquare className="w-6 h-6 text-primary/50 absolute right-0 -top-6" />
          </div>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">20</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center rotate-[-4deg]">
             <span className="text-2xl sm:text-3xl font-bold text-center leading-none mt-4">PROJECT<br/>DUE</span>
             <CheckSquare className="w-6 h-6 text-primary/50 absolute -right-2 -bottom-4" />
          </div>
        </div>
        <div className="border-r border-b border-border relative p-2 bg-muted/50">
          <span className="text-xl">21</span>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">22</span>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">23</span>
        </div>
        <div className="border-r border-b border-border relative p-2 bg-muted/40">
          <span className="text-xl">24</span>
        </div>
        <div className="border-r border-b border-border relative p-2 bg-muted/50">
          <span className="text-xl">25</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center rotate-[-3deg]">
             <span className="text-2xl sm:text-3xl font-bold text-center leading-none mt-4">PROJECT<br/>TIME</span>
             <Pencil className="w-8 h-8 text-primary/50 absolute -right-8 -bottom-4 rotate-45" strokeWidth={1.5} />
             <CheckSquare className="w-6 h-6 text-primary/50 absolute right-0 -top-8" />
          </div>
        </div>

        {/* --- ROW 5 --- */}
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">25</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center mt-4">
             <Star className="w-5 h-5 text-primary/60 absolute right-0 top-0" fill="currentColor" />
          </div>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">26</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center rotate-[2deg]">
             <span className="text-2xl sm:text-3xl text-center leading-none mt-4">BRAINSTORM</span>
             <CheckSquare className="w-5 h-5 text-primary/50 absolute right-0 -top-6" />
          </div>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">27</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center rotate-[-4deg]">
             <span className="text-2xl sm:text-3xl text-center leading-none mt-4">SKETCH<br/>SESSION</span>
             <CheckSquare className="w-5 h-5 text-primary/50 absolute right-0 -top-6" />
          </div>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">28</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center rotate-[3deg]">
             <span className="text-2xl sm:text-3xl text-center leading-none mt-4">WEEKLY<br/>TIME</span>
             <Star className="w-5 h-5 text-primary/60 absolute -left-6 -bottom-2" fill="currentColor" />
             <Star className="w-6 h-6 text-primary/60 absolute right-0 -top-6" fill="currentColor" />
          </div>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">29</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center rotate-[-2deg]">
             <Leaf className="w-10 h-10 sm:w-14 sm:h-14 text-primary/50" strokeWidth={1.5} />
             <div className="w-8 sm:w-12 h-5 bg-primary/30 rounded-b-xl -mt-3 border border-primary/30"></div>
          </div>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">30</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center rotate-[1deg]">
             <span className="text-2xl sm:text-3xl text-center leading-none mt-4">WEEKEND<br/>PLAN</span>
          </div>
        </div>
        <div className="border-r border-b border-border relative p-2">
          <span className="text-xl">31</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center rotate-[-3deg]">
             <span className="text-2xl sm:text-3xl text-center leading-none mt-4">NEW<br/>GOAL</span>
             <Star className="w-6 h-6 text-primary/60 absolute right-2 -top-6" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Connection Arrows SVG Overlay (Desktop only) */}
      <svg className="hidden md:block absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.05))' }}>
        <g className="stroke-primary" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
          {/* Row 1 arrows */}
          <path d="M 28% 28% Q 33% 30% 38% 28%" />
          <path d="M 37% 27.5% L 38% 28% L 37% 29%" />

          <path d="M 43% 27% Q 48% 25% 52% 28%" />
          <path d="M 51% 27% L 52% 28% L 50.5% 28.5%" />

          {/* Row 2 arrows */}
          <path d="M 60% 45% Q 65% 42% 67% 44%" />
          <path d="M 66% 43% L 67% 44% L 65.5% 45%" />

          {/* Row 3 arrows */}
          <path d="M 24% 63% Q 28% 66% 32% 62%" />
          <path d="M 31% 63% L 32% 62% L 30.5% 61%" />

          {/* Row 4 arrows */}
          <path d="M 23% 82% Q 28% 85% 32% 82%" />
          <path d="M 31% 83% L 32% 82% L 30.5% 81%" />

          {/* Row 5 arrow from 28 to 29 */}
          <path d="M 58% 92% L 64% 90%" strokeWidth="3" className="stroke-primary" />
          <path d="M 63% 89% L 64% 90% L 62.5% 91%" strokeWidth="3" className="stroke-primary" />
        </g>
      </svg>
    </div>
  );
}
