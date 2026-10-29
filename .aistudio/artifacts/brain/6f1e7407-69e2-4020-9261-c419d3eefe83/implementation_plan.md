# TowerTech Society Management System - Notices & Communication Theme Update

## 1. Overview & Refinement
This update accomplishes two core objectives requested by the user:
1. **Removal of "Go to Help Center"**: Cleanly eliminated the Help Center card and button from the application sidebar (`Sidebar.tsx`) to avoid clutter.
2. **Notices & Communication Official Colour Theme**: Replaced the previous Violet/Pink palette with the new official color theme:
   - **Warm Ivory (`#EAE6DE`)**: Applied for the module's soft background, subtle filter backgrounds, and calm surfaces while preserving high contrast and readability.
   - **Deep Editorial Blue (`#226192`)**: The primary brand color for headings, buttons (`+ Create Notice`, `Read Notice`, `Apply`, `Publish Notice`), active filters, icons, links, and selected calendar dates.
   - **Coral Orange (`#EF8557`)**: The priority alert color for urgent notices, urgent priority badges, emergency alerts, and calendar urgent notice indicator dots.

## 2. Component Design & Changes
- **Page Header**: Compact horizontal layout with back-to-dashboard navigation, title, Green Park Residency Warm Ivory tag, and Deep Editorial Blue `+ Create Notice` CTA for authorized publishers.
- **Notice Summary Cards**: 3 compact equal-height cards displaying verified metrics:
  - Total Published Notices (Deep Editorial Blue icon)
  - Urgent Notices (Coral Orange icon & text indicator)
  - Scheduled Events (Warm Ivory surface & Editorial Blue icon)
- **Filter Toolbar**:
  - Integrated search, category, priority, and status dropdowns with Deep Editorial Blue focus states.
  - Reset filters action.
- **Creative Small Calendar Popover**:
  - Compact button and anchored popover (~290px wide) directly below the filter button.
  - Published vs Event/Expiry date switcher.
  - Deep Editorial Blue selected date button and navigation arrows.
  - Warm Ivory today button and soft surface highlight.
  - Coral Orange dots on dates featuring urgent notices and Editorial Blue dots for regular notices.
  - Compact Clear and Apply actions.
- **Notice Cards**:
  - High-contrast white surfaces with subtle Warm Ivory borders and Deep Editorial Blue hover accents.
  - Category label and icon.
  - Coral Orange badge for Urgent circulars, Editorial Blue for Normal circulars.
  - Publisher DP avatar with Editorial Blue initials fallback, name, role, date, authenticated verified view count, and attachment badge.
  - Deep Editorial Blue `Read Notice` button.
- **Detail & Create Modals**:
  - Headers in Deep Editorial Blue with Warm Ivory subheadings.
  - Secure media attachment preview and download buttons.
  - Acknowledgment recording and full notice details.

## 3. Verification
- TypeScript verification passed with 0 errors (`tsc --noEmit`).
- Applet compiled cleanly with Vite.
- Old color codes (`#400849`, `#E7B0DE`, `#FF5A0A`) completely removed from `NoticeBoard.tsx`.
- Help center button and card completely removed from `Sidebar.tsx`.
