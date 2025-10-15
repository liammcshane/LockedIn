# LockedIn 

This Chrome extension prevents the user from skipping or clicking off of the currently playing YouTube video until it has finished. It also provides seperate controls to hide the suggestions bar, the comments section and the video description - if desired.

## Progress Log

- **2025-10-08:** Initial project setup. Created `manifest.json`, `content.js`, `README.md`, and `tests/` directory.
- **2025-10-08:** Implemented the basic "no skipping" logic to prevent navigation away from the video.
- **2025-10-08:** Added scrubbing confirmation to prompt the user before changing video time.
- **2025-10-08:** Added a popup to deactivate the extension for one hour.
- **2025-10-15:** Amended the deactivation popup to allow users to re-enable the plugin.
- **2025-10-15:** Added options to hide comments, suggested videos and video description
- **2025-10-15:** Added lock image on click for visual feedback when active
- **2025-10-15:** Fixes for edge cases that allowed user to navigate to a different page

## How to Use

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable "Developer mode".
3.  Click "Load unpacked" and select the directory containing this extension's files.

## Files

- `manifest.json`: The extension's manifest file.
- `content.js`: The core logic that interacts with YouTube pages.
- `popup.js`: The extension widget menu.
- `popup.html`: Markdown for extension widget. 
- `background.js`: Logs extension behaviour to console
- `lock.png`: Lock favicon
- `unlocked.png`: Unlocked favicon
