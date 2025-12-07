# ADHDNotes

A local-first Electron desktop application for ADHD users that combines **markdown** note-taking with calendar integration, **offline bookmarking with content preservation**, and implements forced daily task prioritization through intentional friction.

### **Calendar (Daily) Notes: Task and Time Blocks**

* Notes associated with the calendar 

![image-20251207151514246](images/image-20251207151514246.png)

### **General Notes** 

* Create non-calendar dependent notes (like any note taking tool)
* All your notes are locally stored 
* Full Markdown support 
* Switch Themes and apply your own CSS theme

![image-20251207151552239](images/image-20251207151552239.png)

### **Bookmarks & Offline Content**

Save web articles, documentation, and resources directly into ADHDNotes with full offline access:

- **Browser Extension Integration** - Save bookmarks from any website with a single click via the Chrome/Firefox extension
- **Content Preservation** - Full article content extracted and stored locally using Mozilla Readability
- **Offline Access** - Read saved content even without internet connection
- **AI-Powered Tags** - Automatic tag generation to organize your bookmarks
- **Local Asset Storage** - Images and favicons stored locally for complete offline experience
- **Rich Metadata** - Automatically extracts title, description, and Open Graph data
- **SQLite Database** - Fast, reliable local storage with full-text search capabilities

The bookmarks feature runs a local Fastify API server (port 3666) that communicates with the browser extension, ensuring your data never leaves your machine.

![image-20251207164637488](images/image-20251207164637488.png)

### **Snippets**

Capture and save highlighted text from any webpage as editable markdown snippets:

- **Quick Capture** - Highlight text on any website, right-click, and select "Add as Snippet"
- **Markdown Storage** - All snippets saved as editable markdown for easy formatting and organization
- **Source Tracking** - Automatically captures page URL, title, and timestamp for reference
- **Edit Anytime** - Full markdown editor for modifying and enhancing your saved snippets
- **Multiple Snippets** - Save multiple snippets from the same page with individual timestamps
- **Bulk Management** - Refresh list and delete all snippets with one click
- **Offline Access** - All snippets stored locally in SQLite database

Perfect for saving quotes, code examples, research notes, or any text you want to reference later!

![image-20251207164652262](images/image-20251207164652262.png)

You edit your snippets in markdown:

![image-20251207164712594](images/image-20251207164712594.png)

### **Daily Task Migration**

Tomorrow when you open the app, if you have incomplete tasks from today, you'll see a modal:

**"Review Yesterday's Tasks"**

You MUST review each task:

- **Move to Today** - Task gets copied to today's note
- **Not Important** - Task is dismissed

This is **intentional**! It forces you to:

- Reflect on what actually matters
- Avoid endless task accumulation
- Make conscious prioritization decisions

You cannot skip this - every task requires a decision.

![image-20251207151754132](images/image-20251207151754132.png)

## Features

- **Local-First Architecture**: All notes stored as plain `.md` files on your filesystem for transparency and data ownership
- **Markdown Editor**: Powered by CodeMirror 6 with custom extensions for task and time block detection
- **Preview Mode**: ⭐ Toggle between markdown editor and beautiful rendered preview with `Cmd+/` (macOS) or `Ctrl+/` (Windows/Linux)
- **Daily Notes**: Automatic daily note creation with date-based organization
- **Project Notes**: Organize notes in folders and sub-folders
- **Task Management**: Inline task checkboxes (`* [ ]` and `* [x]`) with real-time parsing
- **Time Blocks**: Schedule time blocks (`+ [ ]` and `+ [x]`) with duration tracking
- **Calendar Navigation**: Visual calendar for quick date jumping with indicators showing dates that have notes
- **Timeline View**: Hour-based schedule (8 AM - 10 PM) with drag-and-drop task scheduling
- **Forced Daily Migration**: ⭐ Core feature - manually review incomplete tasks from previous days (no automation, intentional friction for reflection)
- **Offline Bookmarks**: ⭐ Save web content for offline access via browser extension with full content preservation
- **Snippets**: ⭐ Capture highlighted text from any webpage as editable markdown with source tracking
- **AI-Powered Tagging**: Automatic tag generation for bookmarks using AI
- **Local API Server**: Fastify server (port 3666) for browser extension communication
- **Auto-Save**: Debounced auto-save with 3-second interval
- **File Watcher**: Automatic detection of external file changes
- **Branding**: New app icon and soft pastel UI color palette applied across the app UI to match the ADHDNotes aesthetic (Slate Ink, Calm Teal, Soft Lavender, Pastel Peach)

## Technology Stack

- **Electron**: Cross-platform desktop framework
- **React + TypeScript**: UI framework with type safety
- **Vite**: Build tool and development server
- **CodeMirror 6**: Advanced markdown editor
- **react-markdown**: Beautiful markdown preview rendering
- **Chakra UI**: Component library
- **Zustand**: Lightweight state management
- **date-fns**: Date manipulation
- **@dnd-kit**: Drag-and-drop functionality
- **react-calendar**: Calendar component with date indicators
- **chokidar**: File system watcher
- **electron-store**: Local settings persistence
- **Fastify**: Fast web framework for local API server
- **better-sqlite3**: Native SQLite database for bookmarks
- **Drizzle ORM**: Type-safe database ORM
- **jsdom + @mozilla/readability**: Web content extraction and parsing

## Project Structure

```
app/
├── electron/               # Electron main process
│   ├── main.ts            # Main process entry point
│   ├── entry.ts           # Entry point with polyfills
│   ├── preload.ts         # Security bridge (IPC)
│   ├── polyfills.ts       # Node.js polyfills for Electron
│   ├── db/                # Database layer
│   │   ├── index.ts       # Database initialization
│   │   └── schema.ts      # Drizzle ORM schemas (bookmarks, tags, highlights, snippets)
│   ├── server/            # Local API server
│   │   └── api.ts         # Fastify routes for browser extension
│   └── services/          # Business logic services
│       ├── scraper.ts     # Web content extraction
│       ├── ai.ts          # AI tag generation
│       └── assets.ts      # Image/favicon downloads
├── src/                   # React application
│   ├── components/        # React components
│   │   ├── layout/       # AppLayout, Sidebar, RightPanel
│   │   ├── editor/       # MarkdownEditor
│   │   ├── calendar/     # CalendarView
│   │   ├── timeline/     # Timeline, TimeSlot
│   │   ├── bookmarks/    # BookmarksList, BookmarkReader
│   │   ├── snippets/     # SnippetList, SnippetViewer
│   │   └── modals/       # MigrationModal
│   ├── stores/           # Zustand state management
│   │   ├── noteStore.ts  # Note loading/saving
│   │   ├── taskStore.ts  # Task operations
│   │   ├── bookmarkStore.ts # Bookmark management
│   │   ├── snippetStore.ts  # Snippet management
│   │   └── appStore.ts   # App settings & migration
│   ├── utils/            # Utility functions
│   │   ├── fileSystem.ts       # File operations
│   │   ├── markdownParser.ts   # Markdown parsing
│   │   ├── dateUtils.ts        # Date utilities
│   │   └── migrationChecker.ts # Migration logic
│   ├── hooks/            # Custom React hooks
│   │   ├── useFileWatcher.ts   # External file changes
│   │   └── useAutoSave.ts      # Auto-save debouncing
│   ├── types/            # TypeScript definitions
│   │   └── index.ts
│   ├── App.tsx           # Main app component
│   └── main.tsx          # React entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd app
```

2. Install dependencies:
```bash
npm install
```

## Development

Run the app in development mode:

```bash
npm run dev
```

This will:
- Start Vite dev server on http://localhost:5173
- Launch Electron with hot reload enabled
- Start local API server on http://localhost:3666 (for browser extension)
- Open DevTools automatically (optional)

## Building

Build the application for distribution:

```bash
npm run electron:build
```

This will create distributable packages in the `release/` directory for:
- **macOS**: DMG installer and .app bundle
- **Windows**: NSIS installer and portable .exe
- **Linux**: AppImage, .deb, and .rpm

## Notes Directory Structure

On first launch, the app creates this structure in your Documents folder:

```
~/Documents/ADHDNotes/
├── daily/
│   ├── 2025-10-25.md
│   ├── 2025-10-26.md
│   └── 2025-10-27.md
├── Notes/
│   ├── Work/
│   │   ├── Project Alpha.md
│   │   └── Sprint Planning.md
│   └── Personal/
│       └── Goals 2025.md
├── themes/
│   ├── default-light.css
│   └── default-dark.css
├── bookmarks.db          # SQLite database for bookmarks
└── assets/              # Downloaded images and favicons
    ├── favicon-1.png
    └── image-2.jpg
```

## Markdown Syntax

### Tasks
```markdown
* [ ] Incomplete task
* [x] Completed task
  * [ ] Subtask (indented with 2 spaces)
```

### Time Blocks
```markdown
+ [ ] Time block without time
+ [ ] 09:00 Team meeting (with scheduled time)
+ [x] 14:00 Code review (completed time block)
```

### Scheduling Tasks
You can drag tasks from the editor to specific time slots in the timeline. The task will be updated with the scheduled time:
```markdown
* [ ] 10:00 Task scheduled for 10 AM
```

### Preview Mode
Toggle between editing and preview mode using the eye icon button or keyboard shortcut `Cmd+/` (macOS) or `Ctrl+/` (Windows/Linux):
- **Edit Mode**: Raw markdown with syntax highlighting
- **Preview Mode**: Beautiful rendered view with styled headings, lists, checkboxes, code blocks, and more

Preview mode shows:
- Formatted headings with borders
- Clickable checkboxes for tasks (read-only in preview)
- Syntax-highlighted code blocks
- Styled blockquotes, tables, and lists
- Links, images, and horizontal rules

### Calendar Date Indicators
The calendar shows blue dots on dates that have notes, making it easy to see which days you've been productive!

## Core Feature: Forced Daily Migration

When you navigate to a new day, if there are incomplete tasks from the previous day, you'll see a modal that blocks the app until you process each task. This is **intentional friction** designed to help ADHD users:

- **No "skip" button** - You must review every task
- **No "move all" button** - Each decision is manual
- **Two choices per task**:
  - **Move to Today** - Copy task to today's note
  - **Not Important** - Dismiss the task

This forces reflection and prioritization, preventing endless task accumulation.

## Settings

Settings are stored in `electron-store` and include:
- Theme (light/dark/system)
- Editor font size
- Timeline start/end hours
- Auto-save interval
- Window dimensions
- Last reviewed date (for migration tracking)

## Development Tips

1. **Hot Reload**: Changes to React code will hot reload. Electron main process changes require app restart.

2. **Debugging**:
   - Renderer process: Use DevTools (opens automatically in dev mode)
   - Main process: Use `console.log()` - output appears in terminal

3. **File System**: All file operations go through IPC for security. See `electron/main.ts` for available IPC handlers.

4. **State Management**: Use Zustand stores instead of prop drilling. Stores are reactive and automatically update components.

## Security

- Context isolation enabled
- No Node.js integration in renderer
- All file operations validated to stay within notes directory
- Local API server (port 3666) only accepts connections from localhost
- No external network access - all data stays on your machine
- Bookmarks database encrypted at rest (optional)

## Future Features

- Google Calendar integration
- Microsoft Calendar integration
- Full-text search across notes and bookmarks
- Browser extension for Chrome and Firefox (in beta)
- Bookmark collections and advanced filtering
- Markdown export for bookmarks
- PDF export for notes
- Mobile companion app
- Cloud sync (optional, encrypted)

## Contributing

This is a personal project built to specification. However, feedback and bug reports are welcome!

## License

MIT

## Credits

Built with love for ADHD users who need structure without judgment.
