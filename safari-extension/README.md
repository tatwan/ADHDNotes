# ADHDNotes Safari Extension

Safari Web Extension for saving pages and snippets to ADHDNotes.

## Features

- **Save to ADHDNotes** - Right-click on any page to save the entire page content
- **Add as Snippet** - Highlight text, right-click to save just the selected content
- **Status Popup** - Click extension icon to see connection status and save current page

## Setup Instructions

### Prerequisites

- **Xcode** (version 13.0 or later)
- **macOS** (Monterey 12.0 or later recommended)
- **Safari** (version 14 or later)

### Step 1: Create Xcode Project

1. Open **Xcode**
2. Go to **File → New → Project**
3. Select **macOS** tab, then choose **Safari Extension App**
4. Click **Next**
5. Configure the project:
   - **Product Name**: `ADHDNotes Clipper`
   - **Team**: Your Apple Developer account (or select "None")
   - **Organization Identifier**: `com.yourname` (or your preferred identifier)
   - **Language**: Swift
   - **Uncheck** "Include Tests"
6. Click **Next** and save in this `safari-extension` folder

### Step 2: Replace Extension Resources

After Xcode creates the project:

1. In Xcode, expand the project navigator to find:
   ```
   ADHDNotes Clipper Extension/Resources/
   ```

2. **Delete** the default generated files in Resources:
   - `manifest.json`
   - `background.js`
   - `content.js`
   - `popup.html`, `popup.css`, `popup.js`
   - `images/` folder

3. **Copy** the files from `safari-extension/Resources/` (this folder) into the Xcode project's Resources folder by dragging them into Xcode

### Step 3: Run & Test

1. In Xcode, select the **ADHDNotes Clipper** scheme (not the Extension)
2. Click **Run** (▶) or press **Cmd+R**
3. The host app will open - follow its instructions to enable the extension
4. Open **Safari → Settings → Extensions**
5. Enable **ADHDNotes Clipper Extension**

### Step 4: Enable Unsigned Extensions (Development Only)

If the extension doesn't appear:

1. In Safari menu bar, go to **Safari → Settings → Advanced**
2. Check **"Show features for web developers"**
3. Go to **Develop → Allow Unsigned Extensions**
4. Re-enable the extension in Safari Settings → Extensions

## Usage

### Bookmark a Page
1. Navigate to any webpage
2. Right-click anywhere on the page
3. Select **"Save to ADHDNotes"**
4. You'll see an alert confirming the save

### Save a Snippet
1. Highlight/select any text on a webpage
2. Right-click on the selection
3. Select **"Add as Snippet"**
4. You'll see an alert confirming the save

### Check Status
1. Click the extension icon in Safari's toolbar
2. Green = Connected to ADHDNotes
3. Red = ADHDNotes app is not running

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Extension not showing | Enable "Allow Unsigned Extensions" in Develop menu |
| "Disconnected" status | Make sure ADHDNotes desktop app is running |
| Context menu not appearing | Refresh the page or restart Safari |
| Errors saving | Check that `localhost:3666` API is accessible |

## File Structure

```
safari-extension/
├── Resources/              # Extension source files
│   ├── manifest.json       # Extension manifest
│   ├── background.js       # Context menu setup
│   ├── content.js          # Message handling & API calls
│   ├── popup.html          # Popup UI
│   ├── popup.css           # Popup styles
│   ├── popup.js            # Popup logic
│   └── images/             # Extension icons
└── README.md               # This file
```
