import React from 'react';
import { Lightbulb, Bell, Tag, Archive, Trash2, Pencil } from 'lucide-react';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

const SidebarItem = ({ icon: Icon, label, active = false }: SidebarItemProps) => (
  <div 
    className={`
      flex items-center gap-4 px-6 py-3 rounded-r-full cursor-pointer transition-colors duration-200
      ${active ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100 text-gray-700'}
    `}
  >
    <Icon className={`w-5 h-5 ${active ? 'fill-current' : ''}`} />
    <span className={`font-medium text-sm ${active ? 'font-semibold' : ''}`}>{label}</span>
  </div>
);

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-16 bottom-0 w-72 bg-white flex flex-col py-2 pr-2 overflow-y-auto z-40 hidden md:flex">
      <div className="flex flex-col gap-1 w-full">
        <SidebarItem icon={Lightbulb} label="Notes" active />
        <SidebarItem icon={Bell} label="Reminders" />
        
        <div className="mt-4 mb-2 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Labels</div>
        <SidebarItem icon={Tag} label="Personal" />
        <SidebarItem icon={Tag} label="Work" />
        <SidebarItem icon={Pencil} label="Edit labels" />
        
        <div className="mt-4 border-t border-gray-200 pt-4"></div>
        <SidebarItem icon={Archive} label="Archive" />
        <SidebarItem icon={Trash2} label="Trash" />
      </div>
    </aside>
  );
}
