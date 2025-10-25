# Quick Start Guide

## Getting Started in 5 Minutes

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the App

```bash
npm run electron:dev
```

The app will:
- Create `~/Documents/ADHDNotes/` directory
- Create `daily/` and `projects/` subdirectories
- Load today's daily note automatically
- Open with DevTools for debugging

### 3. Your First Note

The app automatically creates today's daily note with this template:

```markdown
# Monday, October 25, 2025

## Today's Focus


## Tasks

* [ ]


## Time Blocks


## Notes

```

### 4. Add Tasks

Just type tasks using markdown syntax:

```markdown
* [ ] Review project proposal
* [ ] Call dentist
* [ ] Update documentation
  * [ ] Add screenshots
  * [ ] Fix typos
```

Tasks automatically get checkboxes that you can click!

### 5. Add Time Blocks

Time blocks help you schedule specific activities:

```markdown
+ [ ] 09:00 Team standup
+ [ ] 14:00 Deep work session
+ [ ] 16:00 Review pull requests
```

### 6. Create Project Notes

Click the "+" button in the sidebar to create a new project note. Name it anything you like!

Project notes are great for:
- Long-term projects
- Reference documentation
- Meeting notes
- Ideas and brainstorming

### 7. Preview Mode

Press `Cmd+/` (macOS) or `Ctrl+/` (Windows/Linux) to toggle between:
- **Edit Mode**: Raw markdown with syntax highlighting
- **Preview Mode**: Beautiful rendered view

Or click the eye icon button in the header!

Preview mode is great for:
- Reading your notes without markdown syntax
- Reviewing formatted content
- Taking screenshots
- Presenting notes to others

### 8. Navigate Dates

Use the calendar in the right panel to:
- Jump to any date
- See blue dots on dates that have notes
- Navigate to previous/next day
- Return to today

### 9. Timeline & Scheduling

The timeline shows your day from 8 AM to 10 PM. You can:
- See time blocks at their scheduled times
- Drag tasks from the editor to specific time slots
- View your daily schedule at a glance

### 10. Daily Task Migration (The Core Feature!)

Tomorrow when you open the app, if you have incomplete tasks from today, you'll see a modal:

**"Review Yesterday's Tasks"**

You MUST review each task:
- **Move to Today** - Task gets copied to today's note
- **Not Important** - Task is dismissed

This is intentional! It forces you to:
- Reflect on what actually matters
- Avoid endless task accumulation
- Make conscious prioritization decisions

You cannot skip this - every task requires a decision.

## Keyboard Shortcuts

- `Cmd+/` or `Ctrl+/` - Toggle preview mode ⭐
- More shortcuts coming soon:
  - `Ctrl/Cmd + S` - Save note
  - `Ctrl/Cmd + N` - New note
  - `Ctrl/Cmd + T` - Insert task
  - `Ctrl/Cmd + B` - Insert time block
  - `Ctrl/Cmd + Left/Right` - Previous/next day

## Tips for ADHD Users

1. **Start Small**: Don't overload your task list. 3-5 important tasks per day is plenty.

2. **Use Time Blocks**: Schedule specific times for tasks that need focus.

3. **Be Honest in Migration**: If a task has been migrated 3+ days, it might not be important.

4. **Break Down Big Tasks**: Use subtasks (indented tasks) to break down overwhelming projects.

5. **Daily Review**: The migration modal is your friend - embrace the friction!

6. **Notes Section**: Use this for thoughts, ideas, and context that don't fit in tasks.

7. **Project Notes**: Keep reference material in project notes, not daily notes.

## File System

Your notes are just markdown files! You can:
- Edit them in any text editor
- Commit them to git
- Sync them with Dropbox/iCloud
- Grep/search them from terminal
- Back them up easily

Location: `~/Documents/ADHDNotes/`

## Troubleshooting

**App won't start?**
- Make sure you ran `npm install`
- Check that Node.js is installed (`node --version`)

**Notes not saving?**
- Check file permissions on `~/Documents/ADHDNotes/`
- Look for errors in the terminal

**Migration modal won't close?**
- This is intentional! You must process all tasks.
- Click "Move to Today" or "Not Important" for each task.

**Tasks not showing checkboxes?**
- Make sure you're using the correct syntax: `* [ ]` (star, space, bracket, space, bracket)
- Check for proper spacing

## Need Help?

Check the README.md for full documentation or open an issue on GitHub.

---

**Remember**: This app is designed to work WITH your ADHD, not against it. The intentional friction in task migration is there to help you reflect and prioritize. Trust the process! 🧠✨
