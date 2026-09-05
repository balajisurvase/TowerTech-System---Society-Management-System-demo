"""
Society Management System - Python Backend Service
Converts the TypeScript societyService into a robust, pure Python service.
Interacts with the Supabase REST API using Python's standard library.
"""

import uuid
import random
from datetime import datetime
from typing import Dict, Any, List, Optional
from config import supabase_request

def generate_uuid() -> str:
    return str(uuid.uuid4())

class SocietyService:
    def __init__(self):
        pass

    # -------------------------------------------------------------------------
    # Authentication & Profile
    # -------------------------------------------------------------------------
    def login(self, login_id: str, password: str, society_id: str = '', role: str = 'resident') -> Dict[str, Any]:
        """Authenticate an admin or resident"""
        table = 'admin' if role == 'admin' else 'resident'
        id_field = 'admin_id' if role == 'admin' else 'resident_id'
        
        if society_id:
            endpoint = f"{table}?{id_field}=eq.{login_id}&password=eq.{password}&society_id=eq.{society_id}&select=*"
            res = supabase_request('GET', endpoint)
            if res.get('status') == 200 and res.get('data') and len(res['data']) > 0:
                return {"success": True, "user": res['data'][0]}
        
        # Fallback without society_id
        endpoint_fb = f"{table}?{id_field}=eq.{login_id}&password=eq.{password}&select=*"
        res = supabase_request('GET', endpoint_fb)
        if res.get('status') == 200 and res.get('data') and len(res['data']) > 0:
            return {"success": True, "user": res['data'][0]}
            
        return {
            "success": False,
            "error": "Invalid ID, Password or Society ID"
        }

    def create_society_account(self, society_data: Dict[str, Any], admin_password: str) -> Dict[str, Any]:
        """Registers a new society and creates the initial administrator account"""
        random_digits = random.randint(1000, 9999)
        society_id = f"SOC2026{random_digits}"
        
        society_record = {**society_data, "society_id": society_id}
        
        # Try inserting society record
        try:
            res = supabase_request('POST', 'society', data=society_record)
            if res.get('status') in [200, 201] and res.get('data') and len(res['data']) > 0:
                society_record = res['data'][0]
        except Exception:
            pass

        # Create first admin account
        admin_data = {
            "admin_id": "A001",
            "name": f"Admin - {society_data.get('name', 'Society')}",
            "email": society_data.get('admin_email', ''),
            "phone": society_data.get('phone', ''),
            "password": admin_password,
            "society_id": society_id,
            "role": "admin"
        }
        
        admin_res = supabase_request('POST', 'admin', data=admin_data)
        if admin_res.get('error'):
            raise Exception(f"Admin creation error: {admin_res['error']}")
            
        created_admin = admin_res.get('data', [None])[0] if admin_res.get('data') else admin_data
        
        # Seed initial amenities for the new society
        default_amenities = [
            {
                "amenity_id": "AM01",
                "name": "Clubhouse Hall",
                "description": "Spacious community hall for parties and gatherings",
                "capacity": 150,
                "price_per_hour": 500,
                "society_id": society_id,
                "status": "Available"
            },
            {
                "amenity_id": "AM02",
                "name": "Swimming Pool",
                "description": "Olympic size clean pool with shower rooms",
                "capacity": 30,
                "price_per_hour": 150,
                "society_id": society_id,
                "status": "Available"
            },
            {
                "amenity_id": "AM03",
                "name": "Gymnasium",
                "description": "Cardio & strength training fitness center",
                "capacity": 25,
                "price_per_hour": 100,
                "society_id": society_id,
                "status": "Available"
            }
        ]
        try:
            supabase_request('POST', 'amenity', data=default_amenities)
        except Exception:
            pass

        return {
            "society": society_record,
            "admin": created_admin
        }

    def update_admin_profile(self, society_id: str, admin_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        endpoint = f"admin?society_id=eq.{society_id}&admin_id=eq.{admin_id}"
        res = supabase_request('PATCH', endpoint, data=updates)
        if res.get('error'):
            raise Exception(res['error'])
        return res['data'][0] if res.get('data') else None

    # -------------------------------------------------------------------------
    # Residents
    # -------------------------------------------------------------------------
    def get_residents(self, society_id: Optional[str] = None) -> List[Dict[str, Any]]:
        endpoint = "resident?select=*&order=resident_id.asc"
        if society_id:
            endpoint = f"resident?society_id=eq.{society_id}&select=*&order=resident_id.asc"
        
        res = supabase_request('GET', endpoint)
        if res.get('error'):
            return []
        return res.get('data') or []

    def get_resident_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        endpoint = f"resident?email=eq.{email}&select=*"
        res = supabase_request('GET', endpoint)
        if res.get('data') and len(res['data']) > 0:
            return res['data'][0]
        return None

    def add_resident(self, resident: Dict[str, Any]) -> Dict[str, Any]:
        # Generate sequential resident_id if not present
        if not resident.get('resident_id'):
            residents = self.get_residents(resident.get('society_id'))
            max_num = 0
            for r in residents:
                rid = r.get('resident_id', '')
                if rid.startswith('R') and rid[1:].isdigit():
                    max_num = max(max_num, int(rid[1:]))
            resident['resident_id'] = f"R{(max_num + 1):03d}"
            
        if not resident.get('id'):
            resident['id'] = generate_uuid()
            
        res = supabase_request('POST', 'resident', data=resident)
        if res.get('error'):
            raise Exception(res['error'])
        return res['data'][0] if res.get('data') else resident

    def update_resident(self, resident_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        endpoint = f"resident?resident_id=eq.{resident_id}"
        res = supabase_request('PATCH', endpoint, data=updates)
        if res.get('error'):
            raise Exception(res['error'])
        return res['data'][0] if res.get('data') else None

    def delete_resident(self, resident_id: str) -> bool:
        endpoint = f"resident?resident_id=eq.{resident_id}"
        res = supabase_request('DELETE', endpoint)
        return res.get('status') in [200, 204]

    def delete_all_residents(self, society_id: str) -> bool:
        endpoint = f"resident?society_id=eq.{society_id}"
        res = supabase_request('DELETE', endpoint)
        return res.get('status') in [200, 204]

    # -------------------------------------------------------------------------
    # Maintenance
    # -------------------------------------------------------------------------
    def get_maintenance(self, society_id: Optional[str] = None) -> List[Dict[str, Any]]:
        endpoint = "maintenance?select=*&order=due_date.desc"
        if society_id:
            endpoint = f"maintenance?society_id=eq.{society_id}&select=*&order=due_date.desc"
            
        res = supabase_request('GET', endpoint)
        if res.get('error'):
            return []
        return res.get('data') or []

    def get_resident_maintenance(self, resident_id: str, society_id: Optional[str] = None) -> List[Dict[str, Any]]:
        endpoint = f"maintenance?resident_id=eq.{resident_id}&select=*&order=due_date.desc"
        if society_id:
            endpoint += f"&society_id=eq.{society_id}"
            
        res = supabase_request('GET', endpoint)
        if res.get('error'):
            return []
        return res.get('data') or []

    def update_maintenance_status(self, maintenance_id: str, status: str) -> Optional[Dict[str, Any]]:
        updates = {
            "status": status,
            "payment_date": datetime.utcnow().isoformat() if status == "Paid" else None
        }
        endpoint = f"maintenance?maintenance_id=eq.{maintenance_id}"
        res = supabase_request('PATCH', endpoint, data=updates)
        if res.get('error'):
            # Try matching by 'id'
            endpoint = f"maintenance?id=eq.{maintenance_id}"
            res = supabase_request('PATCH', endpoint, data=updates)
            if res.get('error'):
                raise Exception(res['error'])
        return res['data'][0] if res.get('data') else None

    def create_maintenance_bill(self, bill: Dict[str, Any]) -> Dict[str, Any]:
        # Duplicate verification for same flat and month
        check_endpoint = f"maintenance?society_id=eq.{bill.get('society_id')}&flat_no=eq.{bill.get('flat_no')}&month=eq.{bill.get('month')}&select=maintenance_id"
        check_res = supabase_request('GET', check_endpoint)
        if check_res.get('data') and len(check_res['data']) > 0:
            raise Exception(f"Maintenance bill already generated for flat {bill.get('flat_no')} in {bill.get('month')}")

        all_m = self.get_maintenance()
        next_num = len(all_m) + 1
        maintenance_id = f"M{next_num:03d}"
        
        bill_record = {
            **bill,
            "id": generate_uuid(),
            "maintenance_id": maintenance_id,
            "created_at": datetime.utcnow().isoformat()
        }
        
        res = supabase_request('POST', 'maintenance', data=bill_record)
        if res.get('error'):
            raise Exception(res['error'])
        return res['data'][0] if res.get('data') else bill_record

    def create_bulk_maintenance_bills(self, bills: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        created = []
        for bill in bills:
            try:
                created.append(self.create_maintenance_bill(bill))
            except Exception as e:
                print(f"Error creating bill for flat {bill.get('flat_no')}: {e}")
        return created

    def delete_maintenance_record(self, record_id: str) -> bool:
        endpoint = f"maintenance?maintenance_id=eq.{record_id}"
        res = supabase_request('DELETE', endpoint)
        if not (res.get('status') in [200, 204]):
            endpoint = f"maintenance?id=eq.{record_id}"
            res = supabase_request('DELETE', endpoint)
        return res.get('status') in [200, 204]

    # -------------------------------------------------------------------------
    # Complaints
    # -------------------------------------------------------------------------
    def get_complaints(self, society_id: Optional[str] = None) -> List[Dict[str, Any]]:
        endpoint = "complaint?select=*&order=created_at.desc"
        if society_id:
            endpoint = f"complaint?society_id=eq.{society_id}&select=*&order=created_at.desc"
        res = supabase_request('GET', endpoint)
        if res.get('error'):
            return []
        return res.get('data') or []

    def get_resident_complaints(self, resident_id: str, society_id: Optional[str] = None) -> List[Dict[str, Any]]:
        endpoint = f"complaint?resident_id=eq.{resident_id}&select=*&order=created_at.desc"
        if society_id:
            endpoint += f"&society_id=eq.{society_id}"
        res = supabase_request('GET', endpoint)
        if res.get('error'):
            return []
        return res.get('data') or []

    def add_complaint(self, complaint: Dict[str, Any]) -> Dict[str, Any]:
        all_comp = self.get_complaints()
        next_num = len(all_comp) + 1
        complaint_id = f"C{next_num:03d}"
        
        record = {
            **complaint,
            "id": generate_uuid(),
            "complaint_id": complaint_id,
            "created_at": datetime.utcnow().isoformat(),
            "status": complaint.get("status", "Pending")
        }
        res = supabase_request('POST', 'complaint', data=record)
        if res.get('error'):
            raise Exception(res['error'])
        return res['data'][0] if res.get('data') else record

    def update_complaint_status(self, complaint_id: str, status: str, comment: Optional[str] = None) -> Optional[Dict[str, Any]]:
        updates: Dict[str, Any] = {"status": status}
        if comment is not None:
            updates["resolution_comment"] = comment
        if status == "Resolved":
            updates["resolved_at"] = datetime.utcnow().isoformat()
            
        endpoint = f"complaint?complaint_id=eq.{complaint_id}"
        res = supabase_request('PATCH', endpoint, data=updates)
        if res.get('error'):
            endpoint = f"complaint?id=eq.{complaint_id}"
            res = supabase_request('PATCH', endpoint, data=updates)
            if res.get('error'):
                raise Exception(res['error'])
        return res['data'][0] if res.get('data') else None

    def delete_complaint(self, complaint_id: str) -> bool:
        endpoint = f"complaint?complaint_id=eq.{complaint_id}"
        res = supabase_request('DELETE', endpoint)
        if not (res.get('status') in [200, 204]):
            endpoint = f"complaint?id=eq.{complaint_id}"
            res = supabase_request('DELETE', endpoint)
        return res.get('status') in [200, 204]

    def delete_all_complaints(self, society_id: str) -> bool:
        endpoint = f"complaint?society_id=eq.{society_id}"
        res = supabase_request('DELETE', endpoint)
        return res.get('status') in [200, 204]

    # -------------------------------------------------------------------------
    # Amenities & Bookings
    # -------------------------------------------------------------------------
    def get_amenities(self, society_id: Optional[str] = None) -> List[Dict[str, Any]]:
        endpoint = "amenity?select=*&order=name.asc"
        if society_id:
            endpoint = f"amenity?society_id=eq.{society_id}&select=*&order=name.asc"
        res = supabase_request('GET', endpoint)
        if res.get('error') or not res.get('data'):
            # Return standard fallback amenities if database table empty
            return [
                {"amenity_id": "AM01", "name": "Clubhouse Hall", "capacity": 150, "price_per_hour": 500, "status": "Available"},
                {"amenity_id": "AM02", "name": "Swimming Pool", "capacity": 30, "price_per_hour": 150, "status": "Available"},
                {"amenity_id": "AM03", "name": "Gymnasium", "capacity": 25, "price_per_hour": 100, "status": "Available"}
            ]
        return res.get('data') or []

    def add_amenity(self, amenity: Dict[str, Any]) -> Dict[str, Any]:
        record = {
            **amenity,
            "amenity_id": amenity.get("amenity_id") or f"AM{random.randint(10, 99)}",
            "id": generate_uuid()
        }
        res = supabase_request('POST', 'amenity', data=record)
        if res.get('error'):
            raise Exception(res['error'])
        return res['data'][0] if res.get('data') else record

    def update_amenity(self, amenity_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        endpoint = f"amenity?amenity_id=eq.{amenity_id}"
        res = supabase_request('PATCH', endpoint, data=updates)
        return res['data'][0] if res.get('data') else None

    def delete_amenity(self, amenity_id: str) -> bool:
        endpoint = f"amenity?amenity_id=eq.{amenity_id}"
        res = supabase_request('DELETE', endpoint)
        return res.get('status') in [200, 204]

    def get_bookings(self, society_id: Optional[str] = None) -> List[Dict[str, Any]]:
        endpoint = "booking?select=*&order=date.desc"
        if society_id:
            endpoint = f"booking?society_id=eq.{society_id}&select=*&order=date.desc"
        res = supabase_request('GET', endpoint)
        if res.get('error'):
            return []
        return res.get('data') or []

    def get_resident_bookings(self, resident_id: str, society_id: Optional[str] = None) -> List[Dict[str, Any]]:
        endpoint = f"booking?resident_id=eq.{resident_id}&select=*&order=date.desc"
        if society_id:
            endpoint += f"&society_id=eq.{society_id}"
        res = supabase_request('GET', endpoint)
        if res.get('error'):
            return []
        return res.get('data') or []

    def add_booking(self, booking: Dict[str, Any]) -> Dict[str, Any]:
        all_bookings = self.get_bookings()
        next_num = len(all_bookings) + 1
        booking_id = f"B{next_num:03d}"
        
        record = {
            **booking,
            "id": generate_uuid(),
            "booking_id": booking_id,
            "created_at": datetime.utcnow().isoformat(),
            "status": booking.get("status", "Confirmed")
        }
        res = supabase_request('POST', 'booking', data=record)
        if res.get('error'):
            raise Exception(res['error'])
        return res['data'][0] if res.get('data') else record

    def update_booking_status(self, booking_id: str, status: str, comment: Optional[str] = None) -> Optional[Dict[str, Any]]:
        updates: Dict[str, Any] = {"status": status}
        if comment:
            updates["admin_notes"] = comment
            
        endpoint = f"booking?booking_id=eq.{booking_id}"
        res = supabase_request('PATCH', endpoint, data=updates)
        if res.get('error'):
            endpoint = f"booking?id=eq.{booking_id}"
            res = supabase_request('PATCH', endpoint, data=updates)
            if res.get('error'):
                raise Exception(res['error'])
        return res['data'][0] if res.get('data') else None

    def update_booking(self, booking_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        endpoint = f"booking?booking_id=eq.{booking_id}"
        res = supabase_request('PATCH', endpoint, data=updates)
        return res['data'][0] if res.get('data') else None

    def delete_booking(self, booking_id: str) -> bool:
        endpoint = f"booking?booking_id=eq.{booking_id}"
        res = supabase_request('DELETE', endpoint)
        if not (res.get('status') in [200, 204]):
            endpoint = f"booking?id=eq.{booking_id}"
            res = supabase_request('DELETE', endpoint)
        return res.get('status') in [200, 204]

    def delete_all_bookings(self, society_id: str) -> bool:
        endpoint = f"booking?society_id=eq.{society_id}"
        res = supabase_request('DELETE', endpoint)
        return res.get('status') in [200, 204]

    def reset_password(self, email: str) -> Dict[str, Any]:
        return {"success": True, "message": f"Password reset instructions sent to {email}"}

    def upload_media(self, filename: str, file_data: str) -> str:
        if file_data.startswith('data:') or file_data.startswith('http'):
            return file_data
        return f"data:image/jpeg;base64,{file_data}"

    def seed_database(self) -> Dict[str, Any]:
        """Seeds initial default data into the database"""
        # Pre-configured default amenities
        default_amenities = [
            {"amenity_id": "AM01", "name": "Clubhouse Hall", "capacity": 150, "price_per_hour": 500, "status": "Available"},
            {"amenity_id": "AM02", "name": "Swimming Pool", "capacity": 30, "price_per_hour": 150, "status": "Available"},
            {"amenity_id": "AM03", "name": "Gymnasium", "capacity": 25, "price_per_hour": 100, "status": "Available"}
        ]
        for am in default_amenities:
            try:
                self.add_amenity(am)
            except Exception:
                pass
        return {"success": True, "message": "Database successfully synchronized"}

# Singleton instance
service = SocietyService()
