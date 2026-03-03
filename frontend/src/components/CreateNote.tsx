import React from 'react';
import { CheckSquare, Image as ImageIcon, PenTool } from 'lucide-react';

export default function CreateNote() {
  return (
    <div className="w-full max-w-[600px] mx-auto mb-8 relative group z-10">
      <div className="bg-white rounded-lg shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] overflow-hidden flex flex-col transition-shadow duration-200 ease-in-out hover:shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_2px_6px_2px_rgba(60,64,67,0.15)]">
        <div className="flex items-center p-3">
          <input
            type="text"
            placeholder="Take a note..."
            className="w-full h-10 px-2 outline-none text-gray-700 placeholder:text-gray-600 font-medium bg-transparent"
          />
          <div className="flex items-center gap-1 text-gray-500">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="New List">
              <CheckSquare className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="New Note with Drawing">
              <PenTool className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="New Note with Image">
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
