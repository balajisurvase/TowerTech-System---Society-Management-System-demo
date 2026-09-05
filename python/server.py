"""
Society Management System - Python Backend HTTP REST API Server
Built with Python's Standard Library (Zero external dependencies).
Provides complete REST API endpoints for all society management operations.
"""

import sys
import os
import json
import mimetypes
import urllib.parse
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from typing import Dict, Any, Tuple
from society_service import service

PORT = 3000
env_port = os.environ.get('PORT')
if env_port:
    try:
        PORT = int(env_port)
    except ValueError:
        pass
elif len(sys.argv) > 1:
    try:
        PORT = int(sys.argv[1])
    except ValueError:
        pass

class SocietyAPIHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Access-Control-Max-Age', '86400')

    def _send_json(self, status_code: int, data: Any):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self._send_cors_headers()
        self.end_headers()
        
        response_bytes = json.dumps(data, default=str).encode('utf-8')
        self.wfile.write(response_bytes)

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def _parse_url(self) -> Tuple[str, Dict[str, str]]:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip('/')
        query = urllib.parse.parse_qs(parsed.query)
        params = {k: v[0] for k, v in query.items()}
        return path, params

    def _read_json_body(self) -> Dict[str, Any]:
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length <= 0:
            return {}
        raw = self.rfile.read(content_length).decode('utf-8')
        try:
            return json.loads(raw)
        except Exception:
            return {}

    # -------------------------------------------------------------------------
    # GET Endpoints
    # -------------------------------------------------------------------------
    def do_GET(self):
        path, params = self._parse_url()

        if path == '/api/health':
            self._send_json(200, {"status": "ok", "service": "TowerTech Python 100% Server", "version": "2.0.0"})
            return

        # Serve static frontend files from dist/ if not an API route
        if not path.startswith('/api'):
            dist_dir = os.path.join(os.getcwd(), 'dist')
            file_path = os.path.join(dist_dir, path.lstrip('/'))
            if path == '/' or path == '' or not os.path.splitext(path)[1]:
                file_path = os.path.join(dist_dir, 'index.html')

            if os.path.exists(file_path) and os.path.isfile(file_path):
                mime_type, _ = mimetypes.guess_type(file_path)
                mime_type = mime_type or 'application/octet-stream'
                self.send_response(200)
                self.send_header('Content-Type', mime_type)
                self._send_cors_headers()
                self.end_headers()
                with open(file_path, 'rb') as f:
                    self.wfile.write(f.read())
                return
            else:
                # SPA fallback to index.html
                index_path = os.path.join(dist_dir, 'index.html')
                if os.path.exists(index_path):
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html; charset=utf-8')
                    self._send_cors_headers()
                    self.end_headers()
                    with open(index_path, 'rb') as f:
                        self.wfile.write(f.read())
                    return
                else:
                    self._send_json(404, {"error": "Frontend build (dist/) not found. Run npm run build."})
                    return

        # /api/residents
        if path == '/api/residents':
            residents = service.get_residents(params.get('society_id'))
            self._send_json(200, residents)
            return

        # /api/maintenance
        if path == '/api/maintenance':
            resident_id = params.get('resident_id')
            society_id = params.get('society_id')
            if resident_id:
                records = service.get_resident_maintenance(resident_id, society_id)
            else:
                records = service.get_maintenance(society_id)
            self._send_json(200, records)
            return

        # /api/complaints
        if path == '/api/complaints':
            resident_id = params.get('resident_id')
            society_id = params.get('society_id')
            if resident_id:
                comps = service.get_resident_complaints(resident_id, society_id)
            else:
                comps = service.get_complaints(society_id)
            self._send_json(200, comps)
            return

        # /api/bookings
        if path == '/api/bookings':
            resident_id = params.get('resident_id')
            society_id = params.get('society_id')
            if resident_id:
                books = service.get_resident_bookings(resident_id, society_id)
            else:
                books = service.get_bookings(society_id)
            self._send_json(200, books)
            return

        # /api/amenities
        if path == '/api/amenities':
            society_id = params.get('society_id')
            amenities = service.get_amenities(society_id)
            self._send_json(200, amenities)
            return

        self._send_json(404, {"error": "Route not found", "path": path})

    # -------------------------------------------------------------------------
    # POST Endpoints
    # -------------------------------------------------------------------------
    def do_POST(self):
        path, _ = self._parse_url()
        body = self._read_json_body()

        try:
            # Authentication
            if path == '/api/auth/login':
                res = service.login(
                    body.get('loginId') or body.get('login_id', ''),
                    body.get('password', ''),
                    body.get('societyId') or body.get('society_id', ''),
                    body.get('role', 'resident')
                )
                status_code = 200 if res.get('success') else 401
                self._send_json(status_code, res)
                return

            if path == '/api/auth/register':
                society_data = body.get('society', body)
                password = body.get('admin_password', 'Admin@123')
                res = service.create_society_account(society_data, password)
                self._send_json(201, res)
                return

            # Residents
            if path == '/api/residents':
                res = service.add_resident(body)
                self._send_json(201, res)
                return

            # Maintenance
            if path == '/api/maintenance':
                res = service.create_maintenance_bill(body)
                self._send_json(201, res)
                return

            if path == '/api/maintenance/bulk':
                bills = body.get('bills', body if isinstance(body, list) else [])
                res = service.create_bulk_maintenance_bills(bills)
                self._send_json(201, res)
                return

            # Complaints
            if path == '/api/complaints':
                res = service.add_complaint(body)
                self._send_json(201, res)
                return

            # Bookings
            if path == '/api/bookings':
                res = service.add_booking(body)
                self._send_json(201, res)
                return

            # Amenities
            if path == '/api/amenities':
                res = service.add_amenity(body)
                self._send_json(201, res)
                return

            # Password reset
            if path == '/api/auth/reset-password':
                res = service.reset_password(body.get('email', ''))
                self._send_json(200, res)
                return

            # Media upload
            if path == '/api/media/upload':
                res = service.upload_media(body.get('filename', 'file.jpg'), body.get('file', ''))
                self._send_json(200, {"url": res})
                return

            # Seed database
            if path == '/api/seed':
                res = service.seed_database()
                self._send_json(200, res)
                return

            self._send_json(404, {"error": "Route not found", "path": path})

        except Exception as e:
            self._send_json(500, {"error": str(e)})

    # -------------------------------------------------------------------------
    # PUT / PATCH Endpoints
    # -------------------------------------------------------------------------
    def do_PUT(self):
        self._handle_update()

    def do_PATCH(self):
        self._handle_update()

    def _handle_update(self):
        path, _ = self._parse_url()
        body = self._read_json_body()

        try:
            # /api/residents/<id>
            if path.startswith('/api/residents/'):
                resident_id = path.replace('/api/residents/', '')
                res = service.update_resident(resident_id, body)
                self._send_json(200, res)
                return

            # /api/maintenance/<id>
            if path.startswith('/api/maintenance/'):
                maintenance_id = path.replace('/api/maintenance/', '')
                status = body.get('status', 'Paid')
                res = service.update_maintenance_status(maintenance_id, status)
                self._send_json(200, res)
                return

            # /api/complaints/<id>
            if path.startswith('/api/complaints/'):
                complaint_id = path.replace('/api/complaints/', '')
                res = service.update_complaint_status(
                    complaint_id,
                    body.get('status', 'Resolved'),
                    body.get('comment')
                )
                self._send_json(200, res)
                return

            # /api/bookings/<id>
            if path.startswith('/api/bookings/'):
                booking_id = path.replace('/api/bookings/', '')
                if 'status' in body:
                    res = service.update_booking_status(
                        booking_id,
                        body.get('status'),
                        body.get('comment') or body.get('admin_notes')
                    )
                else:
                    res = service.update_booking(booking_id, body)
                self._send_json(200, res)
                return

            # /api/amenities/<id>
            if path.startswith('/api/amenities/'):
                amenity_id = path.replace('/api/amenities/', '')
                res = service.update_amenity(amenity_id, body)
                self._send_json(200, res)
                return

            # /api/admin/profile
            if path == '/api/admin/profile':
                res = service.update_admin_profile(
                    body.get('society_id', ''),
                    body.get('admin_id', ''),
                    body.get('updates', body)
                )
                self._send_json(200, res)
                return

            self._send_json(404, {"error": "Route not found", "path": path})

        except Exception as e:
            self._send_json(500, {"error": str(e)})

    # -------------------------------------------------------------------------
    # DELETE Endpoints
    # -------------------------------------------------------------------------
    def do_DELETE(self):
        path, params = self._parse_url()

        try:
            if path == '/api/residents/all':
                society_id = params.get('society_id', '')
                success = service.delete_all_residents(society_id)
                self._send_json(200, {"success": success})
                return

            if path == '/api/complaints/all':
                society_id = params.get('society_id', '')
                success = service.delete_all_complaints(society_id)
                self._send_json(200, {"success": success})
                return

            if path == '/api/bookings/all':
                society_id = params.get('society_id', '')
                success = service.delete_all_bookings(society_id)
                self._send_json(200, {"success": success})
                return

            if path.startswith('/api/residents/'):
                resident_id = path.replace('/api/residents/', '')
                success = service.delete_resident(resident_id)
                self._send_json(200, {"success": success})
                return

            if path.startswith('/api/maintenance/'):
                maintenance_id = path.replace('/api/maintenance/', '')
                success = service.delete_maintenance_record(maintenance_id)
                self._send_json(200, {"success": success})
                return

            if path.startswith('/api/complaints/'):
                complaint_id = path.replace('/api/complaints/', '')
                success = service.delete_complaint(complaint_id)
                self._send_json(200, {"success": success})
                return

            if path.startswith('/api/bookings/'):
                booking_id = path.replace('/api/bookings/', '')
                success = service.delete_booking(booking_id)
                self._send_json(200, {"success": success})
                return

            if path.startswith('/api/amenities/'):
                amenity_id = path.replace('/api/amenities/', '')
                success = service.delete_amenity(amenity_id)
                self._send_json(200, {"success": success})
                return

            self._send_json(404, {"error": "Route not found", "path": path})

        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def log_message(self, format, *args):
        # Clean custom logging format
        print(f"[Python Backend API] {self.command} {self.path} - {args[1] if len(args) > 1 else ''}")

def run_server():
    server_address = ('0.0.0.0', PORT)
    httpd = ThreadingHTTPServer(server_address, SocietyAPIHandler)
    print(f"🚀 TowerTech Python Backend Server running on http://0.0.0.0:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
