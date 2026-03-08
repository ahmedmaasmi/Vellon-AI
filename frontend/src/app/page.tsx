import React from 'react';
import Link from 'next/link';
import HeroSection from '@/components/HeroSection';
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
  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#2c1810] font-sans">
      <HeroSection />

      {/* Dotted background for sections */}
      <div
        className="absolute inset-0 pointer-events-none mt-[100vh] min-h-[200vh]"
        style={{
          backgroundImage: 'radial-gradient(circle at center, #d6caba 2px, transparent 2px)',
          backgroundSize: '48px 48px',
          backgroundPosition: '0 0, 24px 24px'
        }}
        aria-hidden
      />

      {/* Why NoteMind AI */}
      <section
        id="why"
        className="relative z-10 py-32 px-6 max-w-6xl mx-auto overflow-hidden"
      >
        <div className="text-center mb-24 relative z-20">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#2c1810] mb-6 font-handwriting">
            Why <span className="text-[#1e3a8a]">Choose</span> NoteMind AI?
          </h2>
          <p className="text-[#6b5548] text-xl md:text-2xl max-w-xl mx-auto font-handwriting">
            Here&apos;s why users choose us to organize their digital minds:
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Background Dotted Lines */}
          <div className="absolute inset-0 pointer-events-none hidden md:block" style={{ zIndex: 0 }}>
            <svg className="w-full h-full absolute top-0 left-0" style={{ minHeight: '600px' }} viewBox="0 0 1000 600" preserveAspectRatio="none">
              <path d="M 300 150 L 700 200" stroke="#d6caba" strokeWidth="2" strokeDasharray="6 6" fill="none" />
              <path d="M 300 150 L 300 450" stroke="#d6caba" strokeWidth="2" strokeDasharray="6 6" fill="none" />
              <path d="M 700 200 L 300 450" stroke="#d6caba" strokeWidth="2" strokeDasharray="6 6" fill="none" />
              <path d="M 300 450 L 700 500" stroke="#d6caba" strokeWidth="2" strokeDasharray="6 6" fill="none" />
            </svg>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-x-8 md:gap-y-20 relative z-10">
            {/* Card 1 - Organize (Yellow) */}
            <div className="flex justify-center md:justify-end md:-mt-8 md:pr-12">
              <div className="bg-[#fcfbf9] p-3 rounded-[32px] shadow-xl shadow-[#4a362a]/10 w-full max-w-[320px] relative rotate-[-2deg] transition-transform hover:rotate-0 duration-300 border-2 border-[#d6caba]">
                <div 
                  className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-4 bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm rotate-[-3deg]"
                />
                <div className="rounded-[24px] bg-[#e2d4bc] p-8 h-full min-h-[220px] border border-[#cbb593]">
                  <div className="text-yellow-600 mb-5">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="3" y="3" width="7" height="7" rx="2" />
                      <rect x="14" y="3" width="7" height="7" rx="2" />
                      <rect x="14" y="14" width="7" height="7" rx="2" />
                      <rect x="3" y="14" width="7" height="7" rx="2" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-[#1e3a8a] mb-3 font-handwriting">Organize</h3>
                  <p className="text-xl text-[#2c1810] leading-relaxed font-handwriting">
                    Keep all your notes in one place with a clean, fast interface.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 - AI Summaries (Purple) */}
            <div className="flex justify-center md:justify-start md:mt-24 md:pl-12">
              <div className="bg-[#fcfbf9] p-3 rounded-[32px] shadow-xl shadow-[#4a362a]/10 w-full max-w-[320px] relative rotate-[2deg] transition-transform hover:rotate-0 duration-300 border-2 border-[#d6caba]">
                <div 
                  className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-4 bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm rotate-[4deg]"
                />
                <div className="rounded-[24px] bg-[#fcfbf9] p-8 h-full min-h-[220px] border border-[#d6caba]">
                  <div className="text-[#1e3a8a] mb-5">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C12 2 12 10 20 10C20 10 12 10 12 18C12 18 12 10 4 10C4 10 12 10 12 2Z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-[#1e3a8a] mb-3 font-handwriting">AI Summaries</h3>
                  <p className="text-xl text-[#2c1810] leading-relaxed font-handwriting">
                    Get summaries, keywords, and embeddings without leaving the app.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 - Secure (Pink) */}
            <div className="flex justify-center md:justify-end md:pr-12">
              <div className="bg-[#fcfbf9] p-3 rounded-[32px] shadow-xl shadow-[#4a362a]/10 w-full max-w-[320px] relative rotate-[-1deg] transition-transform hover:rotate-0 duration-300 border-2 border-[#d6caba]">
                <div 
                  className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-4 bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm rotate-[-2deg]"
                />
                <div className="rounded-[24px] bg-[#dbeafe] p-8 h-full min-h-[220px] border border-[#bfdbfe]">
                  <div className="text-[#1e3a8a] mb-5">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11 2v10h10a10 10 0 1 1-10-10z" />
                      <path d="M13 2a10 10 0 0 1 10 10H13V2z" fillOpacity="0.5" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-[#1e3a8a] mb-3 font-handwriting">Secure</h3>
                  <p className="text-xl text-[#2c1810] leading-relaxed font-handwriting">
                    Your notes are private. We don&apos;t train AI on your content.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 4 - Fast (Blue) */}
            <div className="flex justify-center md:justify-start md:mt-16 md:pl-12">
              <div className="bg-[#fcfbf9] p-3 rounded-[32px] shadow-xl shadow-[#4a362a]/10 w-full max-w-[320px] relative rotate-[1deg] transition-transform hover:rotate-0 duration-300 border-2 border-[#d6caba]">
                <div 
                  className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-4 bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm rotate-[2deg]"
                />
                <div className="rounded-[24px] bg-[#f0e6d2] p-8 h-full min-h-[220px] border border-[#d6caba]">
                  <div className="text-[#1e3a8a] mb-5">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="8" cy="8" r="4" />
                      <circle cx="16" cy="16" r="4" fillOpacity="0.5" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-[#1e3a8a] mb-3 font-handwriting">Fast</h3>
                  <p className="text-xl text-[#2c1810] leading-relaxed font-handwriting">
                    Built for speed. Create and edit notes with minimal friction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="relative z-10 py-32 px-6 max-w-7xl mx-auto bg-[#fdfbf7]/50 rounded-3xl"
      >
        <div className="flex justify-center mb-6">
          <div className="w-10 h-1 bg-[#1e3a8a] rounded-full"></div>
        </div>
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-center text-[#2c1810] mb-6 font-handwriting">
          How it works
        </h2>
        <p className="text-[#6b5548] text-xl md:text-2xl text-center max-w-2xl mx-auto mb-20 font-handwriting">
          Capture, organize, and recall—your digital mind in four simple steps.
        </p>
        
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-8 relative z-10">
            
            {/* Step 1: Write notes */}
            <div className="flex flex-col items-center text-center relative">
              <svg className="hidden lg:block absolute top-[-10%] left-[-15%] w-[130%] h-[120%] pointer-events-none text-blue-400 z-0" viewBox="0 0 200 200" fill="none">
                <path d="M 100 20 C 20 20, 20 180, 100 180 C 150 180, 180 140, 210 110" stroke="currentColor" strokeWidth="2" strokeDasharray="4 6" strokeLinecap="round"/>
                <polyline points="200,105 210,110 205,120" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
              <h3 className="font-semibold text-slate-800 mb-2">Write notes</h3>
              <p className="text-sm text-slate-500 max-w-[200px]">
                Jot ideas, tasks, and thoughts seamlessly.
              </p>
            </div>

            {/* Step 2: Labels & archive */}
            <div className="flex flex-col items-center text-center relative mt-8 lg:mt-0">
              <svg className="hidden lg:block absolute top-[20%] left-[80%] w-[80%] h-[60%] pointer-events-none text-blue-400 z-0" viewBox="0 0 100 100" fill="none">
                <path d="M 0 80 C 40 80, 60 20, 100 20" stroke="currentColor" strokeWidth="2" strokeDasharray="4 6" strokeLinecap="round"/>
                <polyline points="90,15 100,20 95,30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
              <h3 className="font-semibold text-slate-800 mb-2">Labels & archive</h3>
              <p className="text-sm text-slate-500 max-w-[200px]">
                Organize visually and keep everything tidy.
              </p>
            </div>

            {/* Step 3: AI helps you recall */}
            <div className="flex flex-col items-center text-center relative mt-8 lg:mt-0">
              <svg className="hidden lg:block absolute top-[60%] left-[80%] w-[80%] h-[60%] pointer-events-none text-blue-400 z-0" viewBox="0 0 100 100" fill="none">
                <path d="M 0 20 C 40 20, 60 80, 100 80" stroke="currentColor" strokeWidth="2" strokeDasharray="4 6" strokeLinecap="round"/>
                <polyline points="90,75 100,80 95,90" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
              <h3 className="font-semibold text-slate-800 mb-2">AI helps you recall</h3>
              <p className="text-sm text-slate-500 max-w-[200px]">
                Summaries and search find what matters.
              </p>
            </div>

            {/* Step 4: Access anywhere */}
            <div className="flex flex-col items-center text-center relative mt-8 lg:mt-0">
              <svg className="hidden lg:block absolute top-[10%] left-[50%] w-[40%] h-[80%] pointer-events-none text-blue-400 z-0" viewBox="0 0 100 100" fill="none">
                <path d="M 0 100 C 20 100, 80 80, 80 0" stroke="currentColor" strokeWidth="2" strokeDasharray="4 6" strokeLinecap="round"/>
                <polyline points="70,10 80,0 90,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
              <h3 className="font-semibold text-slate-800 mb-2">Access anywhere</h3>
              <p className="text-sm text-slate-500 max-w-[200px]">
                Secure sync across all your devices.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Social proof / Testimonials */}
      <section
        id="testimonials"
        className="relative z-10 py-24 px-6 max-w-6xl mx-auto"
      >
        <h2 className="text-4xl font-bold tracking-tight text-center text-[#2c1810] mb-4 font-handwriting">
          Loved by thinkers
        </h2>
        <p className="text-[#6b5548] text-xl text-center max-w-xl mx-auto mb-16 font-handwriting">
          Join thousands who use NoteMind AI to capture and organize their ideas.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#fcfbf9] p-6 rounded-2xl shadow-xl shadow-[#4a362a]/10 border-2 border-[#d6caba] relative rotate-[-1deg]">
            <Quote className="w-8 h-8 text-[#d6caba] mb-4" />
            <p className="text-[#4a362a] text-xl mb-6 font-handwriting">
              &ldquo;Finally a notes app that stays out of the way until I need it. The AI summaries save me hours.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#dbeafe] flex items-center justify-center text-[#1e3a8a] font-semibold text-sm border border-[#bfdbfe]">
                JK
              </div>
              <div>
                <p className="font-bold text-[#2c1810] text-lg font-handwriting">Jamie K.</p>
                <p className="text-sm text-[#6b5548] font-handwriting">Product lead</p>
              </div>
            </div>
          </div>
          <div className="bg-[#fcfbf9] p-6 rounded-2xl shadow-xl shadow-[#4a362a]/10 border-2 border-[#d6caba] relative rotate-[1deg]">
            <Quote className="w-8 h-8 text-[#d6caba] mb-4" />
            <p className="text-[#4a362a] text-xl mb-6 font-handwriting">
              &ldquo;Labels and archive work exactly how I think. I never lose a note anymore.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f0e6d2] flex items-center justify-center text-[#4a362a] font-semibold text-sm border border-[#d6caba]">
                SM
              </div>
              <div>
                <p className="font-bold text-[#2c1810] text-lg font-handwriting">Sam M.</p>
                <p className="text-sm text-[#6b5548] font-handwriting">Designer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security note */}
      <section className="relative z-10 py-16 px-6 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 text-[#6b5548] text-lg mb-6 font-handwriting">
          <Lock className="w-5 h-5 text-[#8a7364]" />
          <span>Your notes are private and secure. We don’t train AI on your content.</span>
        </div>
      </section>

      {/* Final CTA */}
      <section
        id="cta"
        className="relative z-10 py-24 px-6 max-w-3xl mx-auto"
      >
        <div className="bg-[#e2d4bc] p-10 md:p-14 rounded-3xl shadow-xl shadow-[#4a362a]/10 border-2 border-[#cbb593] text-center relative rotate-[-1deg]">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm rotate-[2deg]" />
          <h2 className="text-3xl md:text-5xl font-bold text-[#1e3a8a] mb-4 font-handwriting">
            Ready to build your second brain?
          </h2>
          <p className="text-[#4a362a] text-xl mb-8 max-w-md mx-auto font-handwriting">
            Create a free account and start capturing ideas in seconds.
          </p>
          <Button
            asChild
            className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl px-8 py-6 text-2xl font-bold shadow-xl shadow-[#1e3a8a]/20 transition-all hover:scale-105 hover:-rotate-1 font-handwriting"
          >
            <Link href="/register">Get Started Free</Link>
          </Button>
        </div>
      </section>

      <footer className="relative z-10 py-12 border-t border-[#d6caba] text-center text-lg text-[#8a7364] bg-[#fdfbf7] font-handwriting">
        <p>© {new Date().getFullYear()} NoteMind AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
