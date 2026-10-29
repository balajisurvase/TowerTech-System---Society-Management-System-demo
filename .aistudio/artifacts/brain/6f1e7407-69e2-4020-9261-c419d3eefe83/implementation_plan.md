# TowerTech Society Management System Update

This plan outlines the required architectural and functional updates to the TowerTech Society Management System, focusing on role-based permission refinements, automated workflows, and modernized dashboard/module UI layouts.

## User Review & Critical Decisions

> [!IMPORTANT] Please review these key architectural decisions before proceeding to code implementation.

- **Confirmed Role Hierarchy**: Replacement of "Society Admin" with specific roles: "Chairman", "Secretary", and "Treasurer". Global removal of the word "admin" from all interfaces.
- **Workflow Changes**: 
    - Resident documents now require Admin approval before becoming "Verified".
    - Monthly maintenance billing will be shifted to an automated process for all flats.
    - Visitor management will be rebuilt to support real-time requests with resident/admin approval flow.
- **UI/UX Modernization**: Dashboards and modules will be optimized for viewport fit (no-scroll) where possible.
- **Data Model**: Significant schema updates to support visitor approvals, notice metadata, and resident-specific document statuses.

## 1. Overview & Core Concept

TowerTech is being refined into a more robust society management platform by:
- Improving **Access Control**: Strict role-based management without generic "Admin" labels.
- Enhancing **Transparency & Accountability**: Document approval workflows and visitor management approvals.
- Improving **Usability**: Removing UI clutter (total flats, manual bill generation), adding filtering to complaints and notices.

## 2. User Experience & Visual Design

- **Dashboard**:
    - Removed: "Refresh Data", "Pay", "MaintenanceLog", "Complaint" shortcuts, "Total Flats / Occupied".
    - Added: "Notice Count" stat.
- **Module Layouts**:
    - **Complaints**: Single-frame fit, category filter added.
    - **Amenities**: Single-frame fit.
    - **Notices**: Calendar filter, notice counter, and profile logo per notice.
- **Role Display**: "Welcome back, Arya Sonawane (Chairman)" instead of "...(Society Admin)".
- **Visitor Module**: Rebuilt with real-time UI, photo upload, and resident/admin approval/rejection toggle.

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Automated Billing**:
    - *Approach*: Move maintenance billing to a server-side triggered job (or batch processor).
    - *Why*: Reduces manual Society Admin load, ensures consistency.
- **Decision 2: Visitor Module**:
    - *Approach*: Rebuild as a real-time reactive module using Supabase subscriptions for instant notification updates.
    - *Why*: Ensures security requests are handled in real-time.
- **Decision 3: Document Workflow**:
    - *Approach*: Update `ResidentDocument` schema with `status` (Not Uploaded, Uploaded, Under Review, Verified, Rejected).
    - *Why*: Gives management direct control over resident compliance.

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Frontend                       │
│ (React + Tailwind CSS, Real-time Hooks, Role-Based Access)  │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐    ┌──────────▼───────────────┐
│       Supabase Auth         │    │      Supabase DB         │
│  (Auth, Role Claims, RLS)   │    │  (Resident, Visitor,     │
│                             │    │   Maintenance, Notices)  │
└─────────────────────────────┘    └──────────────────────────┘
```

### Key Data Model Changes:
- **`visitor`**: Added fields for `security_user_id`, `approval_status`, `resident_id`, `approval_time`, `visitor_photo`.
- **`resident_document`**: Updated `status` enum to include `Under Review` and `Rejected`.
- **`notice`**: Added metadata for `profile_logo` and timestamp-based filtering.
- **`resident`**: Role enforcement logic update (all "Admin" roles map to Chairman/Secretary/Treasurer).
