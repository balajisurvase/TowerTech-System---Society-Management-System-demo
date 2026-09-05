"""
TowerTech Society Management System - Python Backend Entry Point
Exposes REST API endpoints for all frontend operations.
Runs seamlessly with Flask or standard library HTTP server.
"""

import sys
import os

try:
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    from society_service import service

    app = Flask(__name__)
    CORS(app)

    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({"status": "ok", "service": "TowerTech Python Backend (Flask)", "version": "2.0.0"})

    # Residents
    @app.route('/api/residents', methods=['GET', 'POST'])
    def residents():
        if request.method == 'GET':
            society_id = request.args.get('society_id')
            return jsonify(service.get_residents(society_id))
        data = request.get_json(force=True) or {}
        return jsonify(service.add_resident(data)), 201

    @app.route('/api/residents/<resident_id>', methods=['PUT', 'PATCH', 'DELETE'])
    def resident_detail(resident_id):
        if request.method == 'DELETE':
            return jsonify({"success": service.delete_resident(resident_id)})
        data = request.get_json(force=True) or {}
        return jsonify(service.update_resident(resident_id, data))

    # Maintenance
    @app.route('/api/maintenance', methods=['GET', 'POST'])
    def maintenance():
        if request.method == 'GET':
            resident_id = request.args.get('resident_id')
            society_id = request.args.get('society_id')
            if resident_id:
                return jsonify(service.get_resident_maintenance(resident_id, society_id))
            return jsonify(service.get_maintenance(society_id))
        data = request.get_json(force=True) or {}
        return jsonify(service.create_maintenance_bill(data)), 201

    @app.route('/api/maintenance/bulk', methods=['POST'])
    def maintenance_bulk():
        data = request.get_json(force=True) or {}
        bills = data.get('bills', data if isinstance(data, list) else [])
        return jsonify(service.create_bulk_maintenance_bills(bills)), 201

    @app.route('/api/maintenance/<maintenance_id>', methods=['PUT', 'PATCH', 'DELETE'])
    def maintenance_detail(maintenance_id):
        if request.method == 'DELETE':
            return jsonify({"success": service.delete_maintenance_record(maintenance_id)})
        data = request.get_json(force=True) or {}
        status = data.get('status', 'Paid')
        return jsonify(service.update_maintenance_status(maintenance_id, status))

    # Complaints
    @app.route('/api/complaints', methods=['GET', 'POST'])
    def complaints():
        if request.method == 'GET':
            resident_id = request.args.get('resident_id')
            society_id = request.args.get('society_id')
            if resident_id:
                return jsonify(service.get_resident_complaints(resident_id, society_id))
            return jsonify(service.get_complaints(society_id))
        data = request.get_json(force=True) or {}
        return jsonify(service.add_complaint(data)), 201

    @app.route('/api/complaints/<complaint_id>', methods=['PUT', 'PATCH', 'DELETE'])
    def complaint_detail(complaint_id):
        if request.method == 'DELETE':
            return jsonify({"success": service.delete_complaint(complaint_id)})
        data = request.get_json(force=True) or {}
        return jsonify(service.update_complaint_status(complaint_id, data.get('status', 'Resolved'), data.get('comment')))

    # Bookings
    @app.route('/api/bookings', methods=['GET', 'POST'])
    def bookings():
        if request.method == 'GET':
            resident_id = request.args.get('resident_id')
            society_id = request.args.get('society_id')
            if resident_id:
                return jsonify(service.get_resident_bookings(resident_id, society_id))
            return jsonify(service.get_bookings(society_id))
        data = request.get_json(force=True) or {}
        return jsonify(service.add_booking(data)), 201

    @app.route('/api/bookings/<booking_id>', methods=['PUT', 'PATCH', 'DELETE'])
    def booking_detail(booking_id):
        if request.method == 'DELETE':
            return jsonify({"success": service.delete_booking(booking_id)})
        data = request.get_json(force=True) or {}
        if 'status' in data:
            return jsonify(service.update_booking_status(booking_id, data.get('status'), data.get('comment') or data.get('admin_notes')))
        return jsonify(service.update_booking(booking_id, data))

    # Amenities
    @app.route('/api/amenities', methods=['GET', 'POST'])
    def amenities():
        if request.method == 'GET':
            return jsonify(service.get_amenities(request.args.get('society_id')))
        data = request.get_json(force=True) or {}
        return jsonify(service.add_amenity(data)), 201

    @app.route('/api/amenities/<amenity_id>', methods=['PUT', 'PATCH', 'DELETE'])
    def amenity_detail(amenity_id):
        if request.method == 'DELETE':
            return jsonify({"success": service.delete_amenity(amenity_id)})
        data = request.get_json(force=True) or {}
        return jsonify(service.update_amenity(amenity_id, data))

    # Auth
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        data = request.get_json(force=True) or {}
        res = service.login(
            data.get('loginId') or data.get('login_id', ''),
            data.get('password', ''),
            data.get('societyId') or data.get('society_id', ''),
            data.get('role', 'resident')
        )
        status = 200 if res.get('success') else 401
        return jsonify(res), status

    @app.route('/api/auth/register', methods=['POST'])
    def register():
        data = request.get_json(force=True) or {}
        society_data = data.get('society', data)
        password = data.get('admin_password', 'Admin@123')
        return jsonify(service.create_society_account(society_data, password)), 201

    @app.route('/api/admin/profile', methods=['PUT', 'PATCH'])
    def admin_profile():
        data = request.get_json(force=True) or {}
        return jsonify(service.update_admin_profile(
            data.get('society_id', ''),
            data.get('admin_id', ''),
            data.get('updates', data)
        ))

    if __name__ == '__main__':
        port = int(sys.argv[1]) if len(sys.argv) > 1 else 5001
        print(f"🚀 TowerTech Python Flask API running on http://0.0.0.0:{port}")
        app.run(host='0.0.0.0', port=port, debug=False)

except ImportError:
    # If Flask is not installed in the environment, fallback to server.py (Standard Library)
    from server import run_server
    if __name__ == '__main__':
        run_server()
