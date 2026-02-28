import React from 'react';
import { Pin, Link as LinkIcon, Clock, CheckSquare, MoreVertical } from 'lucide-react';

export type NoteType = 'text' | 'list' | 'image' | 'link';

export interface NoteItem {
  text: string;
  checked?: boolean;
}

export interface Note {
  id: string;
  title?: string;
  content?: string;
  type: NoteType;
  items?: NoteItem[];
  imageUrl?: string;
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  labels?: string[];
  color: string;
  reminder?: string;
  isPinned?: boolean;
}

const colorClasses: Record<string, string> = {
  white: 'bg-white border border-gray-200',
  orange: 'bg-orange-100 border border-orange-200',
  blue: 'bg-blue-100 border border-blue-200',
  yellow: 'bg-yellow-100 border border-yellow-200',
  teal: 'bg-teal-100 border border-teal-200',
  green: 'bg-green-100 border border-green-200',
};

export default function NoteCard({ note }: { note: Note }) {
  const bgClass = colorClasses[note.color] || colorClasses.white;

  return (
    <div className={`rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 mb-4 break-inside-avoid relative group ${bgClass}`}>
      {note.isPinned && (
        <div className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-black/5 cursor-pointer z-10">
          <Pin className="w-5 h-5 text-gray-700 fill-current" />
        </div>
      )}

      {note.imageUrl && note.type !== 'link' && (
        <div className="w-full h-40 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={note.imageUrl} alt={note.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-4">
        {note.type === 'link' && note.linkUrl && (
           <div className="mb-2 rounded-lg overflow-hidden border border-gray-200 bg-white">
             {note.imageUrl && (
                <div className="h-32 overflow-hidden">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src={note.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
             )}
             <div className="p-2 bg-gray-50">
                <div className="font-medium text-gray-800 truncate">{note.linkTitle}</div>
                <div className="text-xs text-gray-500 truncate">{note.linkUrl}</div>
             </div>
           </div>
        )}

        {note.title && <h3 className="font-semibold text-lg text-gray-800 mb-2 leading-tight">{note.title}</h3>}
        
        {note.type !== 'list' && note.content && (
          <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{note.content}</p>
        )}

        {note.type === 'list' && note.items && (
          <div className="flex flex-col gap-2">
            {note.items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className={`w-4 h-4 mt-0.5 border rounded flex-shrink-0 flex items-center justify-center ${item.checked ? 'bg-gray-400 border-gray-400' : 'border-gray-400'}`}>
                   {item.checked && <CheckSquare className="w-3 h-3 text-white" />}
                </div>
                <span className={`text-sm ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.text}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm cursor-pointer hover:text-gray-700">
               <span className="text-xl leading-none">+</span>
               <span>List item</span>
            </div>
          </div>
        )}

        {/* Labels & Reminders */}
        <div className="flex flex-wrap gap-2 mt-4">
          {note.reminder && (
            <div className="flex items-center gap-1 bg-black/5 px-2 py-1 rounded-full text-xs font-medium text-gray-700">
              <Clock className="w-3 h-3" />
              {note.reminder}
            </div>
          )}
          {note.labels?.map((label, idx) => (
            <div key={idx} className="bg-black/5 px-2 py-1 rounded-full text-xs font-medium text-gray-700 cursor-pointer hover:bg-black/10">
              {label}
            </div>
          ))}
        </div>
      </div>
      
      {/* Hover Actions (Invisible by default, visible on hover) */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 pb-2 flex justify-between items-center">
         <div className="flex gap-1">
            {/* Mock actions */}
            <div className="p-2 hover:bg-black/10 rounded-full cursor-pointer text-gray-600"><span className="text-xs">Remind</span></div>
            <div className="p-2 hover:bg-black/10 rounded-full cursor-pointer text-gray-600"><span className="text-xs">Color</span></div>
         </div>
         <div className="p-2 hover:bg-black/10 rounded-full cursor-pointer text-gray-600">
            <MoreVertical className="w-4 h-4" />
         </div>
      </div>
    </div>
  );
}
