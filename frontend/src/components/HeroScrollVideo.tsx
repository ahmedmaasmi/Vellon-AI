'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

type HeroPhase = 'playingIntro1' | 'awaitingScroll' | 'scrubbingIntro2' | 'introComplete';

export default function HeroScrollVideo() {
  const [phase, setPhase] = useState<HeroPhase>('playingIntro1');
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Refs for videos and scroll progress
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollProgressRef = useRef(0);
  const scrollActiveTimeRef = useRef(0);
  const lastScrollTimeRef = useRef(0);
  
  // Video Paths
  const video1Path = '/hero/Hands_holding_paper_planets_delpmaspu_.mp4';
  const video2Path = '/hero/Video_transition_letter_space_delpmaspu_.mp4';

  // Lock body scroll during intro phases
  useEffect(() => {
    if (phase !== 'introComplete') {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh'; // strict lock
      document.body.style.touchAction = 'none'; // prevent touch scroll
    } else {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.touchAction = '';
    };
  }, [phase]);

  // Handle first video ending
  const handleVideo1Ended = () => {
    setPhase('awaitingScroll');
  };

  // Handle scroll/wheel input for scrubbing
  const handleWheel = useCallback((e: WheelEvent) => {
    // Always prevent default during locked phases to ensure we control the experience
    if (phase !== 'introComplete') {
        // We rely on overflow: hidden, but preventDefault ensures no overscroll/bounce effects
        // and signals we are consuming the event.
    }

    if (phase === 'playingIntro1') {
      e.preventDefault();
      return;
    }

    if (phase === 'awaitingScroll') {
      // Start second video paused, ready for scrubbing
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.pause();
        setPhase('scrubbingIntro2');
      }
    }

    if (phase === 'scrubbingIntro2') {
        const delta = Math.abs(e.deltaY) > 0 ? e.deltaY : e.deltaX;
        // Normalize scroll speed (lower = slower video scrub)
        const SENSITIVITY = 0.0005; 
        
        // Calculate new progress
        let newProgress = scrollProgressRef.current + (delta * SENSITIVITY);
        newProgress = Math.max(0, Math.min(1, newProgress));
        
        scrollProgressRef.current = newProgress;
        
        // Update video time
        if (videoRef.current && !isNaN(videoRef.current.duration)) {
             videoRef.current.currentTime = newProgress * videoRef.current.duration;
        }

        // Track active scroll time for message reveal
        const now = Date.now();
        if (now - lastScrollTimeRef.current < 200) {
             scrollActiveTimeRef.current += (now - lastScrollTimeRef.current);
        }
        lastScrollTimeRef.current = now;

        // Show welcome message after 1s of active scrolling
        if (scrollActiveTimeRef.current > 1000 && !showWelcome) {
            setShowWelcome(true);
        }

        // Check for completion
        if (newProgress >= 0.99) {
            setPhase('introComplete');
        }
    }
  }, [phase, showWelcome]);

  // Touch support for mobile scrubbing
  const touchStartY = useRef(0);
  const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
  };
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
      if (phase === 'introComplete') return;
      e.preventDefault(); // Prevent native scroll

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY.current - touchY;
      touchStartY.current = touchY;

      if (phase === 'playingIntro1') return;

      if (phase === 'awaitingScroll') {
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.pause();
            setPhase('scrubbingIntro2');
          }
      }

      if (phase === 'scrubbingIntro2') {
        const SENSITIVITY = 0.002; // Slightly faster for touch
        let newProgress = scrollProgressRef.current + (deltaY * SENSITIVITY);
        newProgress = Math.max(0, Math.min(1, newProgress));
        scrollProgressRef.current = newProgress;

        if (videoRef.current && !isNaN(videoRef.current.duration)) {
             videoRef.current.currentTime = newProgress * videoRef.current.duration;
        }

        const now = Date.now();
        if (now - lastScrollTimeRef.current < 200) {
             scrollActiveTimeRef.current += (now - lastScrollTimeRef.current);
        }
        lastScrollTimeRef.current = now;

        if (scrollActiveTimeRef.current > 1000 && !showWelcome) {
            setShowWelcome(true);
        }

        if (newProgress >= 0.99) {
            setPhase('introComplete');
        }
      }

  }, [phase, showWelcome]);

  // Attach event listeners to window
  useEffect(() => {
    // Use passive: false to allow preventDefault
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleWheel, handleTouchMove]);


  return (
    <div className={`fixed top-0 left-0 w-full h-screen z-0 bg-black overflow-hidden transition-all duration-1000 ${phase === 'introComplete' ? '' : ''}`}>
      
      {/* Video 1: Intro Autoplay */}
      <video
        src={video1Path}
        autoPlay
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${phase === 'playingIntro1' ? 'opacity-100' : 'opacity-0'}`}
        onEnded={handleVideo1Ended}
        style={{ pointerEvents: 'none' }}
      />

      {/* Video 2: Scroll Scrub */}
      {/* We keep it mounted but control opacity */}
      <video
        ref={videoRef}
        src={video2Path}
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${phase !== 'playingIntro1' ? 'opacity-100' : 'opacity-0'}`}
        style={{ pointerEvents: 'none' }}
      />

      {/* Overlay: Scroll to Continue */}
      <div 
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${phase === 'awaitingScroll' ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="flex flex-col items-center">
             <p className="text-white/70 text-xl font-light animate-pulse mb-2">Scroll to continue</p>
             <svg className="w-6 h-6 text-white/50 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
             </svg>
        </div>
      </div>

      {/* Overlay: Welcome Message */}
      <div 
        className={`relative z-10 flex flex-col items-center justify-center h-full max-w-5xl mx-auto px-6 text-center text-white transition-all duration-1000 ease-out transform ${
            showWelcome ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'
        }`}
      >
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-none drop-shadow-2xl">
          Welcome to Notez AI
        </h1>
        <p className="text-xl md:text-3xl text-gray-200 max-w-3xl mx-auto mb-10 font-light leading-relaxed drop-shadow-lg">
          Where taking notes has never been easier and turn your notes into magic.
        </p>
      </div>
    </div>
  );
}
