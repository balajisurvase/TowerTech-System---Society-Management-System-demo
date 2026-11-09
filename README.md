# TowerTech – Smart Society Management System

## 📌 Project Overview

**TowerTech** is a Smart Society Management System designed to simplify and digitize day-to-day apartment and society management activities.

The system provides a centralized platform for managing **Maintenance, Complaints, and Bookings**, reducing manual paperwork and making society management faster, easier, and more transparent.

The project uses a **React + TypeScript frontend** and a **Python backend**, while keeping the existing frontend UI/UX unchanged.

---

## 🎯 Objectives

* Reduce manual society management work.
* Digitize maintenance management.
* Make complaint registration and tracking easier.
* Simplify facility and amenity booking.
* Provide centralized data management.
* Reduce paperwork and human errors.
* Improve communication between residents and society management.
* Provide a simple and user-friendly interface.

---

## 🏗️ System Architecture

```text
                 ┌──────────────────────────┐
                 │      React Frontend      │
                 │      TypeScript / TSX    │
                 │          + Vite          │
                 └────────────┬─────────────┘
                              │
                         REST API / HTTP
                              │
                              ▼
                 ┌──────────────────────────┐
                 │      Python Backend      │
                 │   API + Business Logic   │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │     Supabase Database    │
                 └──────────────────────────┘
```

---

# 💻 Technologies Used

## Frontend

* React
* TypeScript
* TSX
* Vite
* CSS / Tailwind CSS

## Backend

* Python
* REST API
* Python service layer
* Python data models
* Python business logic

## Database

* Supabase
* SQL

---

# 📦 Main Modules

## 1. 🔧 Maintenance Management

The Maintenance module helps society management handle maintenance-related activities digitally.

### Features

* Maintenance record management
* Maintenance information
* Payment/status tracking
* Resident-wise maintenance data
* Maintenance history
* Maintenance status management

---

## 2. 📝 Complaint Management

The Complaint module allows residents to register and track complaints digitally.

### Features

* Complaint registration
* Complaint details
* Complaint status
* Complaint tracking
* Complaint history
* Management-side complaint handling
* Complaint resolution status

---

## 3. 📅 Booking Management

The Booking module helps residents book available society facilities.

### Features

* Facility availability
* Booking creation
* Booking details
* Booking status
* Booking history
* Prevention of conflicting bookings

---

# 🔐 Login Credentials

The system provides two types of users:

## 👨‍💼 Admin

Admin users can access society management features and manage system data.

### Admin IDs

```text
A001
A002
A003
```

### Admin Password

```text
admin123
```

---

## 👤 Resident

Resident users can access resident-specific features such as maintenance, complaints, and facility bookings.

### Resident IDs

```text
R001 to R080
```

### Resident Password

```text
resident123
```

---

## 📋 Login Summary

| User Type | User ID     | Password    |
| --------- | ----------- | ----------- |
| Admin     | A001        | admin123    |
| Admin     | A002        | admin123    |
| Admin     | A003        | admin123    |
| Resident  | R001 – R080 | resident123 |

> **Note:** These credentials are intended for project/demo purposes. In a production environment, passwords should be securely hashed and should not be stored or documented as plain text.

---

# 🐍 Backend

The backend of TowerTech is developed using **Python**.

Python handles:

* API endpoints
* Business logic
* Data processing
* Data validation
* Database operations
* Backend models
* Service layer
* Error handling
* Maintenance operations
* Complaint operations
* Booking operations
* Authentication and authorization

The frontend remains based on React + TypeScript/TSX and communicates with the Python backend through REST APIs.

---

# 🗄️ Database

The system uses **Supabase** as the database platform.

The database stores and manages:

* User information
* Resident information
* Admin information
* Maintenance records
* Complaint records
* Booking records
* Facility information
* Application data

---

# 🚀 How to Run the Project

## Step 1 – Install Frontend Dependencies

Open the project folder in a terminal and run:

```bash
npm install
```

Make sure Python is installed on your system.

---

## Step 2 – Start the Python Backend

Run:

```bash
python python/server.py
```

If your system uses `python3`, run:

```bash
python3 python/server.py
```

---

## Step 3 – Start the Frontend

Open another terminal and run:

```bash
npm run dev
```

Vite will display the frontend development URL in the terminal.

---

# 🔌 Frontend and Backend Communication

The frontend communicates with the Python backend through HTTP/REST API requests.

```text
React / TypeScript
        │
        │ REST API
        ▼
Python Backend
        │
        │ Database Queries
        ▼
Supabase Database
```

The frontend does not directly handle database operations.

---

# 📁 Project Structure

```text
TowerTech/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── ...
│
├── python/
│   ├── server.py
│   ├── society_service.py
│   ├── config.py
│   └── app.py
│
├── public/
│
├── package.json
├── vite.config.ts
├── supabase_setup.sql
├── index.html
└── README.md
```

---

# 🔄 Development Architecture

During development, the application works as follows:

```text
          Vite Development Server
                    │
                    │ HTTP / REST API
                    ▼
             Python Backend
                    │
                    │ Database Operations
                    ▼
             Supabase Database
```

Vite is responsible for running the React frontend, while Python is responsible for backend processing and database communication.

---

# 🛠️ Error Handling

The Python backend provides error handling for API and database operations.

The system handles:

* Invalid requests
* Missing data
* Database errors
* Invalid booking requests
* Invalid maintenance operations
* Invalid complaint operations
* Authentication errors
* Authorization errors

---

# 📊 Programming Languages

The project is designed to maximize Python usage on the backend while keeping the existing React frontend unchanged.

| Language         | Usage                                           |
| ---------------- | ----------------------------------------------- |
| Python           | Backend, APIs, business logic, services, models |
| TypeScript / TSX | React frontend                                  |
| SQL              | Database setup and queries                      |
| CSS              | Frontend styling                                |
| JSON             | Configuration                                   |
| HTML             | Application entry point                         |
| Markdown         | Documentation                                   |

---

# 🌟 Key Benefits

* Digital society management
* Reduced manual work
* Faster complaint handling
* Easier maintenance management
* Simplified facility booking
* Centralized database
* Better data organization
* Reduced paperwork
* Improved transparency
* User-friendly interface
* Python-based backend architecture

---

# 🔮 Future Scope

The system can be extended in the future with:

* Online payment integration
* Push notifications
* Email/SMS notifications
* Visitor management
* Security management
* Emergency notifications
* Advanced analytics
* AI-based complaint classification
* Automated maintenance reminders
* Mobile application

---

# 👥 Project Information

| Details          | Information                     |
| ---------------- | ------------------------------- |
| Project Name     | TowerTech                       |
| Project Type     | Smart Society Management System |
| Frontend         | React + TypeScript              |
| Backend          | Python                          |
| Database         | Supabase                        |
| Development Tool | Vite                            |
| Main Modules     | Maintenance, Complaint, Booking |

---

# 📜 License

This project is developed for educational and project demonstration purposes.
