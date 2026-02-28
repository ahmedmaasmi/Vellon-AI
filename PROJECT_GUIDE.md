# NoteWise (Fake Google Keep) — Project Guide

A complete walkthrough of the project: structure, files, HTML, code, and Tailwind styles.

---

## 1. Project Overview

**NoteWise** is a Google Keep–style note-taking UI built with **Next.js 16**, **React 18**, and **Tailwind CSS**. It shows a fixed header, sidebar, a “take a note” bar, and a masonry-style grid of note cards. Data is static (no backend or persistence).

---

## 2. Tech Stack

| Technology | Purpose |
|------------|--------|
| **Next.js 16** | App Router, SSR, routing |
| **React 18** | UI components |
| **TypeScript** | Typing |
| **Tailwind CSS** | Styling |
| **lucide-react** | Icons |
| **clsx** / **tailwind-merge** | Conditional / merged class names (available; not heavily used yet) |

---

## 3. Project Structure

```
fake_google_keep/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout (html, body, font, metadata)
│   │   ├── page.tsx        # Home page (header, sidebar, create note, note grid)
│   │   └── globals.css    # Tailwind directives + CSS variables
│   ├── components/
│   │   ├── Header.tsx      # Top bar (logo, search, actions)
│   │   ├── Sidebar.tsx     # Left nav (Notes, Reminders, Labels, etc.)
│   │   ├── CreateNote.tsx  # “Take a note…” input bar
│   │   └── NoteCard.tsx    # Single note card (types: text, list, image, link)
│   └── data/
│       └── notes.ts        # Static note data + Note type re-export
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

---

## 4. File-by-File Breakdown

### 4.1 `src/app/layout.tsx`

**Role:** Root layout for the whole app. Wraps every page in the same HTML shell and applies global font and metadata.

**HTML structure:**
- `<html lang="en">`
  - `<body className={inter.className}>` → `{children}` (the page content)

**Code:**
- Imports **Inter** from `next/font/google` and applies it via `inter.className` on `<body>`.
- **metadata**: `title: "NoteWise - Fake Google Keep"`, `description: "A replica of Google Keep made with Next.js"`.
- **children**: Rendered by Next.js (e.g. the content of `page.tsx`).
**Tailwind:** Only via `inter.className` (font family). No utility classes in this file.

---

### 4.2 `src/app/page.tsx` (Home Page)

**Role:** Renders the main UI: header, sidebar, “create note” bar, and a responsive masonry grid of note cards.

**HTML structure:**
```
div (min-h-screen, flex column)
├── Header
├── div (flex-1, contains sidebar + main)
│   ├── Sidebar
│   └── main
│       ├── CreateNote
│       └── div (columns grid)
│           └── for each note → div (break-inside-avoid) → NoteCard
```

**Code:**
- Imports: `Header`, `Sidebar`, `CreateNote`, `NoteCard`, and `notes` from `@/data/notes`.
- Maps `notes` and renders one `NoteCard` per note inside a wrapper `div` with `key={note.id}`.
- Layout: full-height column; header fixed; below it a row with sidebar + main; main has create-note then the grid.

**Tailwind classes used:**

| Class | Purpose |
|-------|--------|
| `min-h-screen` | Page at least full viewport height |
| `bg-gray-50` | Light gray background |
| `flex flex-col` | Vertical flex for page |
| `flex-1` | Main content area grows to fill space |
| `pt-16` | Top padding so content isn’t under fixed header (h-16) |
| `ml-0 md:ml-72` | No left margin on mobile; 72 (288px) on md+ for sidebar |
| `p-4 md:p-8` | Padding: 16px mobile, 32px desktop |
| `w-full max-w-[1600px] mx-auto` | Full width, max 1600px, centered |
| `columns-1 sm:columns-2 lg:columns-3 xl:columns-4` | Responsive masonry: 1→2→3→4 columns |
| `gap-4 space-y-4` | Gap between columns and vertical spacing |
| `break-inside-avoid mb-4` | Avoid breaking a card across columns; margin below card |

---

### 4.3 `src/app/globals.css`

**Role:** Global styles and Tailwind setup.

**Content:**
- `@tailwind base;` `@tailwind components;` `@tailwind utilities;` — Tailwind layers.
- **:root** CSS variables:
  - `--foreground-rgb: 0, 0, 0`
  - `--background-start-rgb`, `--background-end-rgb: 255, 255, 255`
- **body**: `color: rgb(var(--foreground-rgb));` `background: rgb(var(--background-start-rgb));`

The app mostly uses Tailwind utilities; these variables could be used for theming later.

---

### 4.4 `src/components/Header.tsx`

**Role:** Fixed top bar with logo, search (desktop), and action buttons (refresh, grid, settings, profile).

**HTML structure:**
```
header (fixed, full width, h-16)
├── div (logo area, w-64)
│   ├── button (menu icon)
│   └── div (logo + “NoteWise”)
│       ├── div (blue icon wrapper) → SVG (document icon)
│       └── span “NoteWise”
├── div (flex-1, search, hidden on small screens)
│   └── div (relative, group)
│       ├── Search icon (absolute left)
│       └── input (search)
└── div (actions + avatar)
    ├── RotateCw, LayoutGrid, Settings buttons
    └── div “NW” (avatar)
```

**Code:**
- Uses **lucide-react**: `Menu`, `Search`, `RotateCw`, `LayoutGrid`, `Settings`.
- Custom SVG for the “document” logo in the blue square.
- Search input has a left-positioned icon; focus styles change background and shadow.
- Buttons are presentational (no `onClick` logic yet).
- “NW” is a blue circle with initials.

**Tailwind classes (summary):**

| Area | Classes | Purpose |
|------|--------|---------|
| header | `fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center px-4 z-50` | Fixed bar, height, border, flex, above other content |
| menu button | `p-2 hover:bg-gray-100 rounded-full` | Touch target, hover state |
| logo block | `flex items-center gap-4 w-64` | Logo + text spacing and width |
| blue icon | `bg-blue-600 p-1.5 rounded-lg` | Logo background |
| search container | `flex-1 max-w-2xl mx-auto hidden md:block` | Centered, hidden on small screens |
| search input | `w-full bg-gray-100 h-12 rounded-lg pl-12 pr-4 outline-none focus:bg-white focus:shadow-[...] transition-all placeholder:text-gray-500 text-gray-700` | Full width, height, padding for icon, focus style |
| icon focus | `group-focus-within:text-black` | Icon darkens when input focused |
| actions | `flex items-center gap-2 ml-auto` | Right-aligned group |
| avatar | `w-8 h-8 rounded-full bg-blue-500 ... text-white font-medium text-sm` | Circle, blue, “NW” text |

---

### 4.5 `src/components/Sidebar.tsx`

**Role:** Left navigation: Notes (active), Reminders, Labels section, Archive, Trash. Hidden on small screens.

**HTML structure:**
```
aside (fixed, left, below header, w-72)
└── div (flex column, gap)
    ├── SidebarItem “Notes” (active)
    ├── SidebarItem “Reminders”
    ├── div “LABELS” (section title)
    ├── SidebarItem “Personal”, “Work”, “Edit labels”
    ├── div (border separator)
    ├── SidebarItem “Archive”
    └── SidebarItem “Trash”
```

**Code:**
- **SidebarItem** (internal component): takes `icon`, `label`, `active`. Renders icon + label; applies different styles when `active`.
- **Sidebar** uses: `Lightbulb`, `Bell`, `Tag`, `Archive`, `Trash2`, `Pencil` from lucide-react.
- “Notes” is the only item with `active={true}`.

**Tailwind classes (summary):**

| Element | Classes | Purpose |
|---------|--------|--------|
| aside | `fixed left-0 top-16 bottom-0 w-72 bg-white flex flex-col py-2 pr-2 overflow-y-auto z-40 hidden md:flex` | Fixed left strip under header, 288px wide, scrollable, hidden on small screens |
| SidebarItem (base) | `flex items-center gap-4 px-6 py-3 rounded-r-full cursor-pointer transition-colors duration-200` | Row, padding, pill shape on right, hover transition |
| SidebarItem (active) | `bg-blue-100 text-blue-800` | Highlight |
| SidebarItem (inactive) | `hover:bg-gray-100 text-gray-700` | Hover state |
| Section title | `mt-4 mb-2 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider` | “LABELS” style |
| Separator | `mt-4 border-t border-gray-200 pt-4` | Divider above Archive |

---

### 4.6 `src/components/CreateNote.tsx`

**Role:** The “Take a note…” bar at the top of the main content (like Google Keep’s quick add).

**HTML structure:**
```
div (max-w-[600px], centered, mb-8)
└── div (white card, shadow, hover shadow)
    └── div (flex row)
        ├── input “Take a note…”
        └── div (icon buttons)
            ├── CheckSquare (list)
            ├── PenTool (drawing)
            └── ImageIcon (image)
```

**Code:**
- Icons: `CheckSquare`, `Image as ImageIcon`, `PenTool` from lucide-react.
- Single text input; no state or submit logic yet.
- Buttons are presentational.

**Tailwind classes (summary):**

| Element | Classes | Purpose |
|---------|--------|--------|
| wrapper | `w-full max-w-[600px] mx-auto mb-8 relative group z-10` | Width, center, spacing, stacking |
| card | `bg-white rounded-lg shadow-[...] overflow-hidden flex flex-col transition-shadow duration-200 ease-in-out hover:shadow-[...]` | Card look, hover shadow change |
| row | `flex items-center p-3` | Input + icons in one row |
| input | `w-full h-10 px-2 outline-none text-gray-700 placeholder:text-gray-600 font-medium bg-transparent` | No border, transparent bg |
| icon buttons | `p-2 hover:bg-gray-100 rounded-full transition-colors` | Icon hit area, hover |

---

### 4.7 `src/components/NoteCard.tsx`

**Role:** Renders one note. Supports types: **text**, **list**, **image**, **link**. Handles color, pin, labels, reminder, and hover actions.

**Data types (exported):**
- **NoteType**: `'text' | 'list' | 'image' | 'link'`
- **NoteItem**: `{ text: string; checked?: boolean }` (list item)
- **Note**: `id`, `title?`, `content?`, `type`, `items?`, `imageUrl?`, `linkUrl?`, `linkTitle?`, `linkDescription?`, `labels?`, `color`, `reminder?`, `isPinned?`

**HTML structure (conceptual):**
```
div (card container, color bg, group for hover)
├── [if isPinned] Pin icon (top-right)
├── [if imageUrl and not link] img (banner)
├── div (content, p-4)
│   ├── [if link] link block (image + linkTitle + linkUrl)
│   ├── [if title] h3
│   ├── [if not list and content] p (content)
│   ├── [if list] list of items (checkbox + text) + “+ List item”
│   └── div (labels + reminder chips)
└── div (hover actions: Remind, Color, MoreVertical)
```

**Code:**
- **colorClasses**: map from `white` / `orange` / `blue` / `yellow` / `teal` / `green` to Tailwind background + border classes.
- Default color: `white` if key missing.
- Conditional blocks: pin icon, banner image (except for link type), link preview, title, body text, list items, labels/reminder, hover bar.
- List items: small checkbox box; checked items get `line-through` and gray text.
- Hover bar: `opacity-0 group-hover:opacity-100` so it only shows on card hover.

**Tailwind classes (summary):**

| Element | Classes | Purpose |
|---------|--------|--------|
| card root | `rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 mb-4 break-inside-avoid relative group` + `bgClass` | Card shape, shadow, no column break, hover, color |
| pin | `absolute top-2 right-2 p-1.5 rounded-full hover:bg-black/5 cursor-pointer z-10` | Position, hover |
| banner img | `w-full h-40 overflow-hidden` + `w-full h-full object-cover` | Fixed height, cover |
| content | `p-4` | Padding |
| link block | `mb-2 rounded-lg overflow-hidden border border-gray-200 bg-white` | Link preview card |
| title | `font-semibold text-lg text-gray-800 mb-2 leading-tight` | Heading |
| body | `text-gray-600 text-sm whitespace-pre-wrap leading-relaxed` | Preserve newlines |
| list item | `flex items-start gap-2` | Row for checkbox + text |
| checkbox box | `w-4 h-4 mt-0.5 border rounded flex-shrink-0 ...` + checked state | Small square |
| checked text | `text-gray-400 line-through` | Strikethrough |
| chips (reminder/labels) | `bg-black/5 px-2 py-1 rounded-full text-xs font-medium text-gray-700` | Pill style |
| hover bar | `opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 pb-2 flex justify-between items-center` | Show on hover |

---

### 4.8 `src/data/notes.ts`

**Role:** Static list of notes and re-export of the `Note` type from `NoteCard`.

**Code:**
- `import { Note } from "@/components/NoteCard"`.
- Array **notes**: 7 sample notes covering:
  - **image**: title + content + image + orange color
  - **list**: grocery list with checked/unchecked items, white
  - **link**: title, content, link URL/title, image, white
  - **text**: meeting notes, blue, labels, pinned
  - **text**: dentist, reminder, white
  - **text**: book list, labels, white
  - **text**: short note, yellow

No API or state; this is the single source of data for the grid.

---

## 5. Tailwind Configuration

### 5.1 `tailwind.config.ts`

- **content**: Scans `src/pages/**/*`, `src/components/**/*`, `src/app/**/*` (js, ts, jsx, tsx, mdx) for class names.
- **theme.extend**: Optional gradients (`gradient-radial`, `gradient-conic`); not used in current UI.
- **plugins**: None.

### 5.2 `postcss.config.mjs`

- **plugins**: `tailwindcss`, `autoprefixer`. Standard for Next.js + Tailwind.

---

## 6. Tailwind Style Summary by Purpose

- **Layout:** `flex`, `flex-col`, `flex-1`, `grid`, `columns-*`, `gap-*`, `space-y-*`, `max-w-*`, `mx-auto`, `w-full`, `min-h-screen`.
- **Spacing:** `p-*`, `px-*`, `py-*`, `m-*`, `mb-*`, `ml-*`, `gap-*`.
- **Typography:** `text-*`, `font-*`, `leading-*`, `whitespace-pre-wrap`, `truncate`, `uppercase`, `tracking-wider`.
- **Colors:** `bg-*`, `text-*`, `border-*`, `placeholder:text-*`, including gray scale and semantic (blue, orange, yellow, etc.).
- **Borders & shape:** `border`, `border-*`, `rounded-*`, `rounded-full`, `overflow-hidden`.
- **Shadows:** `shadow-sm`, `shadow-md`, custom `shadow-[...]` for Google-like shadows.
- **Interactivity:** `hover:*`, `focus:*`, `focus-within:*`, `transition-*`, `duration-200`, `cursor-pointer`.
- **Visibility:** `hidden md:flex`, `md:block`, `opacity-0`, `group-hover:opacity-100`.
- **Position:** `fixed`, `absolute`, `relative`, `top-*`, `right-*`, `left-*`, `z-*`, `translate-y-*`.
- **Responsive:** `md:*`, `sm:*`, `lg:*`, `xl:*` for breakpoints.

---

## 7. Component Data Flow

```
layout.tsx (html, body, font)
  └── page.tsx
        ├── Header (no props)
        ├── Sidebar (no props)
        ├── CreateNote (no props)
        └── notes.map → NoteCard({ note })
```

- **notes** come from `@/data/notes`.
- **Note** and **NoteType** are defined in `NoteCard.tsx` and re-exported/used from `notes.ts`.

---

## 8. Responsive Behavior

- **Header:** Search hidden on small screens (`hidden md:block`).
- **Sidebar:** Hidden on small screens (`hidden md:flex`); main content uses `ml-0 md:ml-72` so it’s full-width on mobile.
- **Main:** Padding `p-4 md:p-8`.
- **Note grid:** `columns-1 sm:columns-2 lg:columns-3 xl:columns-4` for 1–4 columns by breakpoint.
- **Create note:** Same max-width on all screens; centered with `mx-auto`.

---

## 9. Quick Reference: Path Aliases

- `@/*` → `./src/*` (from `tsconfig.json`).
- So `@/components/Header` is `src/components/Header.tsx`, etc.

---

This guide covers every source file, the HTML structure, how they use Tailwind, and how data flows so you can understand and extend the project easily.
