import React from 'react';
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import CreateNote from "@/components/CreateNote";
import NoteCard, { Note } from "@/components/NoteCard";

const notes: Note[] = [
  {
    id: "1",
    title: "Project Inspiration",
    content: "Color palettes for the new dashboard design. Focusing on calming blues and energetic oranges.",
    imageUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Y29sb3IlMjBwYWxldHRlfGVufDB8fDB8fHww",
    type: "image",
    color: "orange",
  },
  {
    id: "2",
    title: "Grocery List",
    type: "list",
    items: [
      { text: "Almond Milk", checked: false },
      { text: "Spinach", checked: false },
      { text: "Avocados", checked: true },
      { text: "Eggs (Free range)", checked: false },
      { text: "Sourdough Bread", checked: true },
    ],
    color: "white",
  },
  {
    id: "3",
    title: "Tailwind CSS Resources",
    content: "Don't forget to check out the new container queries plugin.",
    linkTitle: "Tailwind CSS Resources",
    linkUrl: "https://tailwindcss.com/docs/installation",
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y29kaW5nfGVufDB8fDB8fHww",
    type: "link",
    color: "white",
  },
  {
    id: "4",
    title: "Meeting Notes",
    content: "Discuss Q3 roadmap. Key priorities include mobile app refactor and dark mode implementation. Deadline for initial mockups is Friday.",
    type: "text",
    color: "blue",
    labels: ["Work", "Priority"],
    isPinned: true,
  },
  {
    id: "5",
    title: "Dentist Appointment",
    content: "Dr. Smiths Clinic. Bring insurance card.",
    type: "text",
    reminder: "Tomorrow, 10:00 AM",
    color: "white",
  },
  {
    id: "6",
    title: "Book Recommendations",
    type: "text",
    content: "1. \"Atomic Habits\" by James Clear\n2. \"Deep Work\" by Cal Newport\n3. \"The Pragmatic Programmer\"\n4. \"Clean Code\"\n\nNeed to check the local library for availability on these.",
    labels: ["Personal"],
    color: "white",
  },
  {
    id: "7",
    title: "Remember to water the plants!",
    type: "text",
    color: "yellow",
  }
];

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
