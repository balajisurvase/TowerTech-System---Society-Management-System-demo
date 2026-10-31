-- SQL Schema for TowerTech-Society Supabase Project

-- 1. Admin Table
CREATE TABLE IF NOT EXISTS admin (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    password TEXT NOT NULL,
    society_id TEXT DEFAULT 'GV2026',
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Resident Table
CREATE TABLE IF NOT EXISTS resident (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resident_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    tower TEXT NOT NULL,
    floor INTEGER,
    flat TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    password TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'Owner' NOT NULL,
    occupancy_type VARCHAR(20) DEFAULT 'Owner',
    owner_id TEXT,
    tenant_id TEXT,
    status VARCHAR(20) DEFAULT 'Active' NOT NULL,
    society_id TEXT DEFAULT 'GV2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration for existing resident records:
ALTER TABLE resident ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'Owner';
ALTER TABLE resident ADD COLUMN IF NOT EXISTS occupancy_type VARCHAR(20) DEFAULT 'Owner';
ALTER TABLE resident ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE resident ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE resident ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';

-- 3. Maintenance Table
CREATE TABLE IF NOT EXISTS maintenance (
    maintenance_id TEXT PRIMARY KEY,
    bill_no TEXT,
    flat_no TEXT,
    tower TEXT,
    month TEXT,
    amount BIGINT,
    status TEXT,
    due_date DATE,
    admin_id TEXT,
    society_id TEXT DEFAULT 'GV2026',
    resident_id TEXT,
    payment_date TIMESTAMP WITH TIME ZONE,
    payment_method TEXT,
    transaction_id TEXT,
    late_fee NUMERIC DEFAULT 0,
    total_paid NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Complaint Table
CREATE TABLE IF NOT EXISTS complaint (
    complaint_id TEXT PRIMARY KEY,
    resident_id TEXT,
    flat_no TEXT,
    tower TEXT,
    complaint_date DATE,
    category TEXT,
    description TEXT,
    status TEXT,
    society_id TEXT DEFAULT 'GV2026',
    admin_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Booking Table
CREATE TABLE IF NOT EXISTS booking (
    booking_id TEXT PRIMARY KEY,
    resident_id TEXT,
    name TEXT,
    tower TEXT,
    flat TEXT,
    amenity_name TEXT,
    amenity_type TEXT,
    event_name TEXT,
    booking_date DATE,
    start_time TIME,
    end_time TIME,
    charges BIGINT,
    status TEXT,
    society_id TEXT DEFAULT 'GV2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Amenity Table
CREATE TABLE IF NOT EXISTS amenity (
    amenity_id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT,
    charges BIGINT,
    society_id TEXT DEFAULT 'GV2026',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Security Table
CREATE TABLE IF NOT EXISTS security (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    security_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    mobile_number TEXT,
    password TEXT NOT NULL,
    society_id TEXT DEFAULT 'GV2026',
    role TEXT DEFAULT 'security',
    shift TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Visitor Table (Visitors Management Module)
CREATE TABLE IF NOT EXISTS visitor (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id TEXT UNIQUE,
    visitor_name TEXT NOT NULL,
    visitor_mobile TEXT NOT NULL,
    visitor_type TEXT DEFAULT 'Guest',
    vehicle_number TEXT,
    profile_photo TEXT,
    resident_id TEXT NOT NULL,
    resident_name TEXT,
    tower TEXT,
    floor INTEGER,
    flat TEXT,
    purpose TEXT NOT NULL,
    entry_time TEXT,
    exit_time TEXT,
    status TEXT DEFAULT 'Pending', -- Pending, Approved, Inside, Exited, Rejected
    approval_status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
    approval_time TIMESTAMP WITH TIME ZONE,
    security_id TEXT,
    security_user_name TEXT,
    security_user_shift TEXT,
    gate TEXT DEFAULT 'Main Gate',
    visitor_count INTEGER DEFAULT 1,
    rejection_reason TEXT,
    society_id TEXT DEFAULT 'GV2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Resident Documents Table
CREATE TABLE IF NOT EXISTS resident_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resident_id TEXT NOT NULL,
    society_id TEXT NOT NULL DEFAULT 'GV2026',
    document_type TEXT NOT NULL,
    document_name TEXT NOT NULL,
    purpose TEXT,
    file_path TEXT NOT NULL,
    file_url TEXT,
    file_name TEXT NOT NULL,
    file_size BIGINT DEFAULT 0,
    mime_type TEXT,
    status TEXT NOT NULL DEFAULT 'Under Review',
    deposit_amount NUMERIC,
    deposit_date DATE,
    deposit_ref TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resident_docs_resident_type ON resident_documents (resident_id, document_type);
CREATE INDEX IF NOT EXISTS idx_visitor_society ON visitor (society_id);
CREATE INDEX IF NOT EXISTS idx_visitor_resident ON visitor (resident_id);
CREATE INDEX IF NOT EXISTS idx_visitor_status ON visitor (status);

-- Enable RLS
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenity ENABLE ROW LEVEL SECURITY;
ALTER TABLE security ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_documents ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Allow all on admin" ON admin FOR ALL USING (true);
CREATE POLICY "Allow all on resident" ON resident FOR ALL USING (true);
CREATE POLICY "Allow all on maintenance" ON maintenance FOR ALL USING (true);
CREATE POLICY "Allow all on complaint" ON complaint FOR ALL USING (true);
CREATE POLICY "Allow all on booking" ON booking FOR ALL USING (true);
CREATE POLICY "Allow all on amenity" ON amenity FOR ALL USING (true);
CREATE POLICY "Allow all on security" ON security FOR ALL USING (true);
CREATE POLICY "Allow all on visitor" ON visitor FOR ALL USING (true);
CREATE POLICY "Allow all on resident_documents" ON resident_documents FOR ALL USING (true);
