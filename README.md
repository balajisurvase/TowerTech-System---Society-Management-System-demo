# TowerTech – Smart Society Management System

## 📌 Project Overview

**TowerTech** is a Smart Society Management System designed to simplify and digitize day-to-day residential society operations for Green Park Residency.

The platform provides a centralized system for **Maintenance Billing, Visitor Live Verification, Complaints, Amenity Bookings, Notices, Real-time Communication, Financial Accounting, Documents, and Security Management**.

---

## 🏗️ System Architecture

```text
                 ┌──────────────────────────┐
                 │      React Frontend      │
                 │   React 19 / TypeScript  │
                 │      Vite + Tailwind     │
                 └────────────┬─────────────┘
                              │
                    Realtime / HTTPS
                              │
                              ▼
                 ┌──────────────────────────┐
                 │      Express Server      │
                 │   Node.js Proxy & API    │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │    Supabase PostgreSQL   │
                 │   Database & Realtime    │
                 └──────────────────────────┘
```

---

## 💻 Technologies Used

### Frontend
* React 19
* TypeScript
* Vite 6
* Tailwind CSS v4
* Lucide React Icons
* Recharts

### Backend / Server
* Express.js (Node.js)
* Supabase JS Client (`@supabase/supabase-js`)
* Supabase Realtime Engine

### Database
* Supabase PostgreSQL
* Row Level Security (RLS)

---

## 📦 Main Modules

1. **🔧 Maintenance Billing & Payments:** Automated bill calculation (Per BHK, Per Sq.Ft., Hybrid, Fixed) and online payment verification.
2. **📝 Complaints:** Resident complaint filing, photo attachments, SLA tracking, and status transitions.
3. **📅 Amenity Bookings:** Double-booking collision prevention and time-slot reservations.
4. **🛡️ Visitors Management:** Security gate check-in with live photo capture (`navigator.mediaDevices.getUserMedia`) and real-time resident alert popups.
5. **💰 Financial Management:** Income vs expense ledgers, staff salary calculations, vendor contracts, earmarked society funds, and audit logging.
6. **📢 Notices & Communication:** Real-time messaging, announcements, and audience targeting.
7. **📂 Resident Documents:** Document verification and deposit tracking.

---

## 🚀 How to Run the Project

### Step 1 – Install Dependencies

```bash
npm install
```

### Step 2 – Environment Configuration

Create a `.env` file or export environment variables:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Step 3 – Database Setup

Execute `supabase_setup.sql` in your Supabase SQL Editor to provision required tables and RLS policies.

### Step 4 – Start Server & App

```bash
npm run dev
```

Or for production build and server launch:

```bash
npm run build
npm start
```

---

## 📜 License

This project is developed for TowerTech Society Management System.
