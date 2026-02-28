import React from 'react';
import { Menu, Search, RotateCw, LayoutGrid, Settings } from 'lucide-react';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center px-4 z-50">
      <div className="flex items-center gap-4 w-64">
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg flex items-center justify-center">
            <svg 
              className="w-5 h-5 text-white" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-gray-700">NoteWise</span>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto hidden md:block">
        <div className="relative group w-full">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-focus-within:text-black transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-gray-100 h-12 rounded-lg pl-12 pr-4 outline-none focus:bg-white focus:shadow-[0_1px_1px_0_rgba(65,69,73,0.3),0_1px_3px_1px_rgba(65,69,73,0.15)] transition-all placeholder:text-gray-500 text-gray-700"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title="Refresh">
          <RotateCw className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title="List view">
          <LayoutGrid className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title="Settings">
          <Settings className="w-5 h-5" />
        </button>
        <div className="ml-2 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm cursor-pointer hover:opacity-90">
          NW
        </div>
      </div>
    </header>
  );
}
