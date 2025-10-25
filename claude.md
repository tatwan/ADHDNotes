# ADHDNotes - Complete AI Agent Build Prompt

## Project Mission Statement

Build **ADHDNotes**: a local-first Electron desktop application for ADHD users that combines markdown note-taking with calendar integration and implements forced daily task prioritization through intentional friction. The app stores all notes as plain .md files on the user's filesystem for transparency and data ownership.

## Technology Stack RequirementsCore Platform

**Electron**: Desktop application framework for cross-platform (macOS, Windows, Linux) deployment
**React**: UI framework with TypeScript for type safety
**Vite**: Build tool and development server
**Node.js**: Backend functionality within Electron's main process

### Essential Libraries

* CodeMirror 6: Advanced text editor with custom extension support
* Chakra UI: Component library for rapid UI development
* Zustand: Lightweight state management
* date-fns: Date manipulation and formatting
* chokidar: File system watcher for external file changes
* electron-store: Secure local settings persistence
* @dnd-kit: Modern drag-and-drop functionality
* react-calendar: Calendar component for date navigation
* react-icons: Icon library

### Future Phase Libraries

* googleapis: Google Calendar API integration (Phase 5)
* electron-builder: Application packaging and distribution

### Project Structure and File Organization

**Root Level Files**

* `package.json`: Project configuration with electron-specific scripts
* `tsconfig.json`: TypeScript configuration
* `vite.config.ts`: Vite build configuration with electron compatibility
* `.gitignore`: Exclude node_modules, dist, and build artifacts

### Electron Process Files (electron/ directory)

* `main.js`: Main Electron process handling window creation, IPC handlers, and file system operations
* `preload.js`: Security bridge exposing controlled APIs to renderer process
* `menu.js`: Application menu configuration

### React Application (src/ directory)Component Organization:

* `components/layout/`: AppLayout (main container), Sidebar (project/folder navigator)
* `components/editor/`: MarkdownEditor (main editor), EditorToolbar (formatting tools), TaskLineWidget (inline task helpers)
* `components/calendar/`: CalendarView (date picker), DayIndicator (visual markers for notes)
* `components/timeline/`: Timeline (hour-based schedule), TimeSlot (individual time blocks), TimelineEvent (calendar event display)
* `components/modals/`: MigrationModal (daily task review), SettingsModal (app preferences)

### State Management (stores/ directory):

* `noteStore.ts`: Current note state, note loading/saving, daily and project note management
* `taskStore.ts:` Parsed task data, task completion tracking, migration queue
* `appStore.ts`: UI state, settings, user preferences

### Utilities (utils/ directory):

* `fileSystem.ts`: Abstraction layer for Electron file operations
* `markdownParser.ts`: Parse markdown to extract tasks and time blocks
* `taskExtractor.ts`: Identify task syntax patterns in real-time
* `dateUtils.ts`: Date formatting, file path generation, date calculations
* `migrationChecker.ts`: Logic for detecting incomplete tasks from previous days

### Type Definitions (types/ directory):

* index.ts: Complete TypeScript interfaces for DailyNote, Task, TimeBlock, ProjectNote, FileTreeItem, CalendarEvent, AppSettings

### Custom Hooks (hooks/ directory):

* useFileWatcher.ts: React hook for responding to external file changes
* useDailyMigration.ts: Hook for daily task migration logic
* useAutoSave.ts: Debounced auto-save functionality

### Data Models and File Structure

**Notes Directory Structure on User's Computer**

```
~/Documents/ADHDNotes/
├── daily/
│   ├── 2025-10-25.md
│   ├── 2025-10-26.md
│   └── 2025-10-27.md
└── projects/
    ├── Work/
    │   ├── Project Alpha.md
    │   └── Sprint Planning.md
    └── Personal/
        └── Goals 2025.md
```

### File Naming Conventions

* Daily notes: `YYYY-MM-DD.md` (ISO 8601 date format)
* Project notes: Any user-chosen name ending in `.md`
* Folders: Any user-chosen name, nested folders supported

### Markdown Syntax Rules

* Tasks: Lines starting with `* [ ] `for incomplete,` * [x]` for complete
* Time Blocks: Lines starting with `+ [ ] `for incomplete, `+ [x`] for complete
* Subtasks: Indented tasks (2 spaces or 1 tab per level)
* Headings: Standard markdown `##` syntax
* Time annotations: Optional `HH:MM` format in time blocks (e.g., `+ [ ] 09:00 Team meeting`)

### In-Memory Data Structures

* **DailyNote**: id (date string), date object, filePath, raw content string, parsed tasks array, parsed time blocks array
* **Task**: id, content, completed boolean, lineNumber, createdDate, scheduledTime (optional), indentLevel for subtasks
* **TimeBlock**: id, content, startTime, duration in minutes, lineNumber
* **ProjectNote**: id, title, filePath, content, tasks array
* **CalendarEvent**: id, title, startTime, endTime, source (google/microsoft)

### Core Feature Specifications

#### Feature 1: File System IntegrationRequirements:

* On app launch, ensure ~/Documents/ADHDNotes/daily/ and ~/Documents/ADHDNotes/projects/ exist
* Create directories if missing
* Expose IPC handlers for: readFile, writeFile, listFiles, deleteFile, createFolder, getNotesDir
* Implement chokidar watcher to detect external file additions, modifications, and deletions
* Send events to renderer process when files change externally
* Handle file system errors gracefully with user-friendly messages

##### Security Considerations:

* Use contextIsolation in Electron
* Never expose raw Node.js modules to renderer
* Validate all file paths to prevent directory traversal
* Ensure all file operations stay within ADHDNotes directory

#### Feature 2: Sidebar NavigationLayout:

* Fixed width left panel (250px)
* Two main sections: "Daily Notes" (optional quick access) and "Projects"
* Collapsible folder tree structure
* Visual indication of currently open note

##### Functionality:

* List all project notes and folders from projects/ directory
* Click note to load in editor
* Right-click context menu: Rename, Delete, Move to Folder
* New Note button creates blank markdown file in projects/
* New Folder button creates subdirectory
* Drag-and-drop to reorganize (optional for MVP)
* Search/filter functionality (optional for MVP)

##### Real-time Updates:

* Listen to file watcher events
* Automatically refresh sidebar when files added/removed externally
* Highlight notes modified outside the app

#### Feature 3: Markdown Editor with Task Detection

##### Editor Requirements:

* Implement CodeMirror 6 as the base editor
* Configure for markdown language mode
* Enable syntax highlighting for markdown elements
* Line numbers display (optional)
* Word wrap enabled by default

##### Custom Task Syntax Extension:

* Create CodeMirror extension to detect lines starting with `* [ ]` or `* [x]`
* Render visual checkboxes inline (not just text)
* Make checkboxes clickable to toggle completion
* Update underlying markdown text when checkbox clicked
* Apply distinct styling to tasks vs. regular text

##### Custom Time Block Extension:

* Detect lines starting with `+ [ ] `or `+ [x]`
* Render checkboxes with different visual style than tasks
* Parse and display time annotations if present
* Apply distinct styling to differentiate from tasks

###### Inline Helpers:

* On empty lines, show subtle "+" button on hover
* Clicking button reveals quick insert menu: Task, Time Block, Heading
* Selecting option inserts appropriate syntax at cursor position
* Keyboard shortcuts: Ctrl/Cmd + T for task, Ctrl/Cmd + B for time block

###### Real-time Parsing:

* As user types, continuously parse document
* Extract all tasks into structured array
* Extract all time blocks into structured array
* Update task store with parsed data
* Handle multi-line content gracefully

##### Auto-save:

* Debounce save trigger (3 seconds after last keystroke)
* Visual indicator for unsaved changes (dot or text)
* Manual save button for immediate save
* Save on editor blur
* Prevent data loss on app close with unsaved changes warning

#### Feature 4: Calendar NavigationCalendar Display:

* Use react-calendar component in right panel
* Month view by default
* Highlight current day prominently
* Visual indicators for days with notes (dot or badge)
* Different indicator for days with incomplete tasks (colored badge)

##### Date Selection Behavior:

Clicking a date loads corresponding daily note
If daily note doesn't exist, create new file with date heading
Smoothly transition between notes without jarring reloads
Maintain scroll position when switching dates (optional)

##### Navigation Controls:

Previous/next month arrows
Today button to jump to current date
Month/year dropdown for quick jumps (optional)
Keyboard shortcuts: Ctrl/Cmd + Left/Right for previous/next day

##### Data Synchronization:

When switching dates, trigger auto-save for current note
Load new note content into editor
Update task store with new note's tasks
Update timeline with new date's events

#### Feature 5: Timeline ComponentLayout:

Vertical timeline showing hours of the day
Default range: 8 AM to 10 PM (configurable in settings)
Hour markers on left side
Event/task lanes on right side
Scrollable if content exceeds viewport

##### Visual Design:

Hour lines with time labels
Color-coded blocks for different types: calendar events (blue), scheduled tasks (green), time blocks (yellow)
Block height represents duration
Overlapping events displayed side-by-side
Empty slots accept drag-and-drop

##### Interaction:

Hovering over block shows full details tooltip
Clicking block opens edit modal or jumps to line in editor
Drag-to-resize for duration adjustment (optional for MVP)
Right-click to remove from timeline

#### Feature 6: Drag-and-Drop Task SchedulingDraggable Elements:

Each parsed task in the editor becomes draggable
Visual drag handle icon appears on hover
Cursor changes to indicate draggability
Drag preview shows task content

##### Drop Targets:

Timeline hour slots accept task drops
Visual feedback when hovering over valid drop zone
Snap to 15-minute or 30-minute increments

##### Drop Behavior:

When task dropped on timeline, update task object with scheduledTime
Option 1: Add time annotation to task in markdown (e.g., * [x] 10:00 AM Task content)
Option 2: Store scheduling metadata separately without modifying markdown
Recommended: Update markdown to maintain single source of truth
Automatically save note after drop
Display task in timeline at scheduled time

##### Unscheduling:

Right-click task in timeline to unschedule
Remove time annotation from markdown
Task remains in document but not in timeline

#### Feature 7: Forced Daily Task Migration (Core Differentiator)Migration Detection Logic:

On app launch or when user navigates to new day, run migration check
Compare current date with last reviewed date (stored in electron-store)
If dates differ, load previous day's note file
Parse previous day's note for incomplete tasks (lines with * [ ])
If incomplete tasks found, block normal app flow

##### Migration Modal UI:

Full-screen or large centered modal that must be addressed
Title: "Review Yesterday's Tasks"
Subtitle: Date of previous day
List all incomplete tasks from yesterday
Each task row displays: checkbox (non-functional), task content, action buttons
Action buttons per task: "Move to Today" and "Not Important"
Cannot dismiss modal until all tasks processed
Progress counter: "3 of 7 tasks reviewed"

##### Migration Actions:

"Move to Today": Copy task line to today's daily note at cursor position or end of file
"Not Important": Mark task as dismissed (do not copy to today)
Neither action completes the task in yesterday's note (it remains [ ])
This is intentional: user can see history of what was planned vs. completed

##### Post-Migration:

Once all tasks processed, update "last reviewed date" in settings store
Close migration modal
Display today's daily note in editor
User can now proceed with normal workflow

##### Migration History Tracking (Optional Enhancement):

Store migration decisions in electron-store
Track: task content, original date, moved/dismissed decision, target date if moved
Use for analytics: completion rate, procrastination patterns, task lifespan

##### Intentional Friction:

No automatic rollover of tasks
No "move all" button
No "skip review" option
User must manually decide on each task
This forces reflection and prioritization

#### Feature 8: External Calendar Integration (Phase 5)

#####  OAuth Authentication:

Support Google Calendar API
Implement OAuth 2.0 flow in Electron
Open system browser for authentication (more secure than embedded)
Capture redirect with deep link or local server
Store access and refresh tokens in electron-store (encrypted)
Handle token expiration and refresh automatically

##### Calendar Event Fetching:

When daily note loaded, fetch events for that specific date
API call: list events with timeMin = start of day, timeMax = end of day
Parse response into CalendarEvent objects
Display events in timeline as read-only blocks

##### Event Display:

Different visual style than tasks (distinct color, icon)
Show event title, start time, duration
Tooltip shows full details: description, location, attendees
Click event to open in default calendar app (optional)

##### Sync Frequency:

Fetch events when date changes
Refresh button to manually re-fetch
Background refresh every 15 minutes (optional)

##### Error Handling:

Gracefully handle API failures
Show "Unable to load calendar" message in timeline
Provide "Retry" button
Don't block app usage if calendar unavailable

##### Settings:

Calendar sync toggle (enable/disable)
Select which calendars to display (if user has multiple)
Disconnect/reconnect account option

## User Interface Design Specifications

### Color Scheme

Primary: Blue (#2196F3) for active elements and tasks
Secondary: Green for completed items
Neutral: Grays for backgrounds and borders
Warning: Orange for unsaved changes
Danger: Red for delete actions
###  Typography

Editor: Monospace font (Fira Code, JetBrains Mono, or system monospace)
UI: Sans-serif (system font stack for native feel)
Font sizes: 14px for editor, 12-16px for UI elements
### Layout Proportions

Sidebar: 250px fixed width
Editor: Flexible, takes remaining space
Right panel: 350px fixed width
All panels full viewport height
### Responsive Behavior

Minimum window size: 1200x700px
Sidebar collapsible to icon-only mode (optional)
Right panel collapsible (optional)
Remember panel states in settings
### Dark Mode Support (Optional for MVP)

Detect system preference
Manual toggle in settings
Adjust all colors appropriately
Save preference in electron-store
## Error Handling and Edge Cases

### File System Errors

File not found: Create new file automatically
Permission denied: Show error message with instructions
Disk full: Alert user, prevent saving until resolved
Corrupted file: Attempt recovery, backup original, show warning
### Concurrent File Modifications

External change while editing: Show "File changed externally" banner
Options: Reload (lose changes), Keep editing (overwrite external changes), Compare
Default: Keep editing for daily notes, prompt for project notes
### Empty States

No projects: Show welcome message with "Create First Note" button
Empty daily note: Show template or quick-start guide
No calendar events: Show "No events scheduled" message
### Network Errors (Calendar Sync)

API timeout: Retry with exponential backoff
Auth failure: Prompt re-authentication
Rate limiting: Show message, pause sync temporarily
### Invalid Markdown

Tolerate any markdown content
Parse what's recognizable, ignore rest
Never crash on parsing errors

## Performance Considerations

###  Editor Performance

Use CodeMirror's virtual scrolling for large documents
Debounce parsing for real-time task extraction
Limit re-renders to visible viewport
File System Operations

Batch file reads when loading project list
Cache file contents in memory
Use file watcher instead of polling
### Calendar API

Cache events for current day
Only fetch when date changes
Implement request throttling
### Application Startup

Load today's note immediately
Load project list in background
Defer calendar sync until UI ready

### Testing Requirements

### Critical User Flows

Create new note → write content → save → verify file created
Navigate to yesterday → add task → switch to today → verify migration modal
Process migration → verify tasks copied correctly
Drag task to timeline → verify markdown updated
Toggle task completion → verify markdown toggled
External file change → verify sidebar updates
### Edge Cases to Test

Empty notes
Very large notes (10,000+ lines)
Rapid date navigation
Concurrent external file modifications
Special characters in filenames
Deeply nested folder structures

Configuration and Settings
User Preferences (stored in electron-store)

Theme: light/dark
Editor font size
Timeline start/end hours
Auto-save interval
Calendar sync enabled/disabled
Last reviewed date for migration
Selected calendars to display
Window position and size

Application Defaults

Auto-save: 3 seconds after last keystroke
Timeline: 8 AM - 10 PM
Default font size: 14px
Create daily notes with date heading
Enable file watcher by default


Security and Privacy
Data Storage

All notes stored locally on user's computer
No cloud storage in MVP
No telemetry or analytics
OAuth tokens encrypted in electron-store

Permissions

Request file system access on first launch
Request calendar access when user enables sync
Clear permission dialogs explaining why needed

Updates

Implement auto-update checking (optional)
Use electron-builder's auto-update feature
Notify user of available updates


Distribution and Packaging
Build Targets

macOS: DMG installer and .app bundle
Windows: NSIS installer and portable .exe
Linux: AppImage, .deb, and .rpm

Code Signing

Sign macOS builds to avoid Gatekeeper warnings

Success Criteria
The MVP is complete when:

User can create and edit markdown notes stored as .md files
Sidebar displays all project notes and folders
Calendar allows navigation to any date's daily note
Tasks ( * [ ]) and time blocks (+ [ ]) are detected and rendered with checkboxes
Daily migration modal appears when incomplete tasks exist from previous day
User must manually review each task (move to today or dismiss)
Tasks can be dragged to timeline and markdown is updated with time
Timeline displays hour slots from 8 AM to 10 PM
App auto-saves changes after 3 seconds
External file changes detected and sidebar updated
All file operations use Electron IPC securely
Application packages and runs on macOS, Windows, and Linux

The application is ready for user testing when all above criteria are met and critical user flows work without errors.

Final Notes for AI Agent
This application's unique value is the forced daily task migration. Implement this feature carefully with intentional friction - do not add shortcuts or automation that defeats the purpose. The user MUST manually decide on each task every day.
Keep the MVP scope tight. Build Phase 1-8 first before considering calendar sync. The core value is local markdown notes with forced prioritization, not calendar integration.
Prioritize data integrity and user trust. Since notes are plain text files, users can inspect, backup, and modify them outside your app. Respect this transparency.
Use TypeScript throughout for type safety. Add proper error handling for all file operations. Test with large note collections (100+ notes) to ensure performance.
The application should feel fast, reliable, and trustworthy. ADHD users need tools that won't fight them or add cognitive load. Every feature should reduce friction except the migration feature, which adds intentional friction for reflection.