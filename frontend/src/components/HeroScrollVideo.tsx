'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function HeroScrollVideo() {
  const [showText, setShowText] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Use a stable, re-encoded path
  const videoPath = '/hero/Hands_holding_paper_planets_optimized.mp4';

  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.playbackRate = 1.0; 
    }
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-screen z-0 bg-black overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        src={videoPath}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.8 }}
        onEnded={() => setShowText(true)}
      />

      {/* Text Overlay */}
      <div 
        className={`relative z-10 flex flex-col items-center justify-center h-full max-w-4xl mx-auto px-6 text-center text-white transition-all duration-1000 ease-out transform ${
            showText ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'
        }`}
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
  );
}
