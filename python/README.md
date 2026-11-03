# TowerTech Society Management System - Python Backend

This is the dedicated **Python backend** for the TowerTech Society Management System, converting the TypeScript service layer into pure Python while leaving 100% of the React frontend layout, styling, components, and user experience identical.

## Features
- **Pure Python Standard Library Architecture**: Zero-dependency REST API and Supabase communication using Python's standard `http.server`, `urllib.request`, and `json` modules. Runs immediately on any machine with Python 3 without requiring external package installations.
- **Flask Compatibility**: `python/app.py` supports Flask with automatic fallback to standard library server if Flask is not installed.
- **Supabase Cloud Integration**: Full REST API bridge communicating securely with Supabase database tables (`resident`, `admin`, `society`, `maintenance`, `complaint`, `booking`, `amenity`).
- **Complete Feature Set**:
  - Authentication (Admin & Resident credential verification)
  - Society self-registration with automatic ID generation (`SOC2026xxxx`)
  - Resident management (List, Add, Update, Delete)
  - Maintenance billing (Single and bulk bill generation, payment marking, deletion)
  - Complaints ticketing (Create, status transitions to *Pending*, *In Progress*, *Resolved*, admin comments)
  - Amenity booking (Catalog, pricing, booking creation, status approval workflow)
  - Admin and Resident profile management

## Project Structure
```
python/
├── app.py              # Unified entry point (supports Flask and Standard Library server)
├── server.py           # Zero-dependency HTTP REST API Server (threading HTTP server with CORS)
├── society_service.py  # Pure Python business logic layer (ported from TypeScript societyService)
├── config.py           # Supabase REST client using urllib.request
├── requirements.txt    # Optional dependencies (Flask, Flask-CORS)
└── README.md           # Documentation and API reference
```

## REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status |
| `POST` | `/api/auth/login` | Authenticate user (Admin or Resident) |
| `POST` | `/api/auth/register` | Register new society and admin account |
| `PUT` | `/api/admin/profile` | Update society admin details |
| `GET` | `/api/residents` | Retrieve residents list (optional `?society_id=`) |
| `POST` | `/api/residents` | Register new resident |
| `PUT` | `/api/residents/<id>` | Update resident details |
| `DELETE` | `/api/residents/<id>` | Delete resident record |
| `GET` | `/api/maintenance` | Retrieve maintenance bills (`?resident_id=`, `?society_id=`) |
| `POST` | `/api/maintenance` | Generate new maintenance invoice |
| `POST` | `/api/maintenance/bulk` | Generate batch invoices for entire society |
| `PUT` | `/api/maintenance/<id>` | Mark bill as Paid or Unpaid |
| `DELETE` | `/api/maintenance/<id>` | Delete maintenance invoice |
| `GET` | `/api/complaints` | Retrieve complaints (`?resident_id=`, `?society_id=`) |
| `POST` | `/api/complaints` | Submit a new complaint |
| `PUT` | `/api/complaints/<id>` | Update complaint status and admin notes |
| `DELETE` | `/api/complaints/<id>` | Delete complaint |
| `GET` | `/api/bookings` | Retrieve facility bookings (`?resident_id=`, `?society_id=`) |
| `POST` | `/api/bookings` | Book a society amenity |
| `PUT` | `/api/bookings/<id>` | Approve or decline booking |
| `DELETE` | `/api/bookings/<id>` | Delete booking |
| `GET` | `/api/amenities` | Retrieve society facilities list |
| `POST` | `/api/amenities` | Add a new amenity |
| `PUT` | `/api/amenities/<id>` | Update amenity details |
| `DELETE` | `/api/amenities/<id>` | Remove amenity |

## Running the Python Backend

### Standalone (Zero dependencies):
```bash
python3 python/server.py 8000
```
or
```bash
python3 python/app.py 8000
```

The server binds to `0.0.0.0:8000` and is ready to accept incoming API requests from the frontend or direct clients.
