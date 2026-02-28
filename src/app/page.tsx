import React from 'react';
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import CreateNote from "@/components/CreateNote";
import NoteCard from "@/components/NoteCard";
import { notes } from "@/data/notes";
import QuranText from "@/components/QuranText";


export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-1 pt-16">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-72 p-4 md:p-8 w-full max-w-[1600px] mx-auto">
          <CreateNote />
          
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
             {notes.map((note) => (
               <div key={note.id} className="break-inside-avoid mb-4">
                  <NoteCard note={note} />
               </div>
             ))}
          </div>
        </main>
      </div>
    </div>
  );
}
