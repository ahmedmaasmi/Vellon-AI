import React from 'react';
import HeroScrollVideo from '@/components/HeroScrollVideo';

export default function Home() {
  return (
    <div className="bg-black min-h-screen text-white">
      {/* 
        Fixed video hero component.
        Plays automatically, text appears on end.
        Gets overlapped by subsequent content.
      */}
      <HeroScrollVideo />

      {/* 
        More content below the hero section.
        Added mt-[100vh] to push content below the fixed hero.
        Added relative, z-10, and bg-black to ensure it overlaps the fixed hero on scroll.
      */}
      <div className="relative z-10 bg-black mt-[100vh]">
        <section className="py-32 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
                A workspace that thinks with you.
              </h2>
              <p className="text-lg text-gray-400 font-light mb-8">
                Experience the next generation of note-taking. AI seamlessly categorizes, summarizes, and connects your ideas, freeing you to focus on what matters most.
              </p>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-white rounded-full mr-3"></span>
                  Intelligent organization
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-white rounded-full mr-3"></span>
                  Auto-generated summaries
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-white rounded-full mr-3"></span>
                  Voice to text transcription
                </li>
              </ul>
            </div>
            <div className="bg-gray-900 rounded-3xl aspect-square flex flex-col items-center justify-center p-8 border border-gray-800 relative overflow-hidden group">
               {/* A placeholder for an app feature */}
               <div className="relative z-10 text-center text-gray-500 transition-transform duration-500 group-hover:scale-105">
                 <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 08l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                 </svg>
                 <p className="text-xl font-medium">AI Knowledge Graph</p>
               </div>
               {/* Subtle gradient effect */}
               <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-gray-800 opacity-50" />
            </div>
          </div>
        </section>

        <footer className="py-12 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>© 2026 Keep. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
