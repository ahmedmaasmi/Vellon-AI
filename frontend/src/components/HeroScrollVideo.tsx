'use client';

import React, { useEffect, useRef, useCallback } from 'react';

export default function HeroScrollVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  
  // Use a stable, re-encoded path for faster seeking
  const videoPath = '/hero/Hands_holding_paper_planets_optimized.mp4';

  const scrollProgress = useRef(0);
  const targetProgress = useRef(0);
  const dimensions = useRef({ offsetTop: 0, totalHeight: 0, windowHeight: 0 });
  const isAnimating = useRef(false);
  const lastSeekTime = useRef(0);

  const measure = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      dimensions.current = {
        offsetTop: rect.top + scrollTop,
        totalHeight: rect.height,
        windowHeight: window.innerHeight
      };
    }
  }, []);

  const updateLoop = useCallback(() => {
    const ease = 0.5; 
    const diff = targetProgress.current - scrollProgress.current;
    
    // Stop updating if we're close enough to the target
    if (Math.abs(diff) < 0.0001) {
      scrollProgress.current = targetProgress.current;
      isAnimating.current = false;
    } else {
      scrollProgress.current += diff * ease;
      isAnimating.current = true;
    }
    
    const p = scrollProgress.current;
    const videoPhaseEnd = 1.0;
    
    // 1. Update video time
    if (videoRef.current && videoRef.current.readyState >= 1) {
      const duration = videoRef.current.duration;
      if (Number.isFinite(duration)) {
        const videoProgress = Math.min(1, p / videoPhaseEnd);
        const targetTime = videoProgress * duration;
        
        // Gate scrubbing on seek state and throttle (max ~30fps -> 33ms)
        const now = performance.now();
        const timeSinceLastSeek = now - lastSeekTime.current;
        
        // Prevent new seek if video is currently seeking, or if we sought too recently
        if (!videoRef.current.seeking && timeSinceLastSeek > 33) {
          if (Math.abs(videoRef.current.currentTime - targetTime) > 0.03) {
            videoRef.current.currentTime = targetTime;
            lastSeekTime.current = now;
          }
        }
      }
    }

    // 2. Animate Text Overlay
    if (textRef.current) {
      const textStart = 0.8;
      const textDuration = 1 - textStart; 
      
      let opacity = 0;
      let translateY = 40;
      let scale = 0.95;
      
      if (p > textStart) {
        const localProgress = (p - textStart) / textDuration;
        const clampedProgress = Math.min(1, localProgress);
        
        opacity = clampedProgress;
        translateY = 40 * (1 - clampedProgress);
        scale = 0.95 + (0.05 * clampedProgress);
      }
      
      textRef.current.style.opacity = opacity.toFixed(3);
      textRef.current.style.transform = `translateY(${translateY}px) scale(${scale})`;
      textRef.current.style.pointerEvents = opacity > 0.8 ? 'auto' : 'none';
    }

    if (isAnimating.current) {
      requestAnimationFrame(updateLoop);
    }
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    
    const handleScroll = () => {
      const { offsetTop, totalHeight, windowHeight } = dimensions.current;
      const scrollY = window.scrollY;
      
      const scrollDistance = totalHeight - windowHeight;
      if (scrollDistance <= 0) return;

      const currentScroll = scrollY - offsetTop;
      const progress = Math.max(0, Math.min(1, currentScroll / scrollDistance));
      
      targetProgress.current = progress;

      // Start the animation loop if it's not currently running
      if (!isAnimating.current) {
        isAnimating.current = true;
        requestAnimationFrame(updateLoop);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial call to set correct frame if loaded mid-scroll
    handleScroll();
    
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [measure, updateLoop]);

  return (
    <div ref={containerRef} className="relative w-full h-[350vh] bg-black">
      <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center bg-black">
        {/* Video Background */}
        <video
          ref={videoRef}
          src={videoPath}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={() => {
            // Re-trigger loop once metadata is loaded to ensure initial frame is correct
            if (!isAnimating.current) {
              isAnimating.current = true;
              requestAnimationFrame(updateLoop);
            }
          }}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.8 }}
        />

        {/* Text Overlay */}
        <div 
          ref={textRef}
          className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white will-change-[opacity,transform]"
          style={{ opacity: 0, transform: 'translateY(40px) scale(0.95)' }}
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-none">
            Thoughts, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
              Unbound.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            Capture ideas as they flow. AI that organizes, refines, and connects your world.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="px-8 py-4 bg-white text-black rounded-full text-lg font-medium hover:scale-105 transition-transform duration-300">
              Get Started
            </button>
            <button className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full text-lg font-medium hover:bg-white/20 transition-colors duration-300">
              Watch Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
