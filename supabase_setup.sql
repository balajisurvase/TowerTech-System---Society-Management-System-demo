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
    owner_id TEXT,
    status VARCHAR(20) DEFAULT 'Active' NOT NULL,
    society_id TEXT DEFAULT 'GV2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration for existing resident records:
ALTER TABLE resident ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'Owner';
ALTER TABLE resident ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE resident ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';
UPDATE resident SET role = 'Owner' WHERE role IS NULL OR role = '';
UPDATE resident SET status = 'Active' WHERE status IS NULL OR status = '';

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Complaint Table
CREATE TABLE IF NOT EXISTS complaint (
    complaint_id TEXT PRIMARY KEY,
    resident_id TEXT,
    flat_no TEXT,
    tower TEXT,
    complaint_date DATE,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Security Table
CREATE TABLE IF NOT EXISTS security (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    security_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    society_id TEXT DEFAULT 'GV2026',
    role TEXT DEFAULT 'security',
    shift TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Resident Documents Table
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

-- Index for fast lookup by resident and document_type
CREATE INDEX IF NOT EXISTS idx_resident_docs_resident_type ON resident_documents (resident_id, document_type);

-- Enable RLS
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenity ENABLE ROW LEVEL SECURITY;
ALTER TABLE security ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_documents ENABLE ROW LEVEL SECURITY;

-- Basic Policies (allowing seamless application flow)
CREATE POLICY "Allow all on admin" ON admin FOR ALL USING (true);
CREATE POLICY "Allow all on resident" ON resident FOR ALL USING (true);
CREATE POLICY "Allow all on maintenance" ON maintenance FOR ALL USING (true);
CREATE POLICY "Allow all on complaint" ON complaint FOR ALL USING (true);
CREATE POLICY "Allow all on booking" ON booking FOR ALL USING (true);
CREATE POLICY "Allow all on amenity" ON amenity FOR ALL USING (true);
CREATE POLICY "Allow all on security" ON security FOR ALL USING (true);
CREATE POLICY "Allow all on resident_documents" ON resident_documents FOR ALL USING (true);

-- ====================================================================
-- Production RBAC Policies for resident_documents & Storage
-- ====================================================================
-- Note: In production with Supabase Auth, you can replace the open policy with:
-- 1. Residents can view and upload their own documents:
--    CREATE POLICY "Residents access own documents" ON resident_documents
--    FOR ALL USING (resident_id = (SELECT resident_id FROM resident WHERE id = auth.uid()));
--
-- 2. Secretary & Admins can view and review all society documents:
--    CREATE POLICY "Secretary and admin review documents" ON resident_documents
--    FOR ALL USING (EXISTS (SELECT 1 FROM admin WHERE id = auth.uid() AND role IN ('Secretary', 'Admin', 'SuperAdmin')));
--
-- 3. Security guards cannot access private ownership documents (sale deed, registry, etc.)
-- ====================================================================

-- 9. Supabase Storage Bucket Setup for 'resident-documents'
-- Run these commands in Supabase SQL Editor if creating bucket via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('resident-documents', 'resident-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'resident-documents' bucket
CREATE POLICY "Allow public select on resident-documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'resident-documents');

CREATE POLICY "Allow public insert on resident-documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resident-documents');

CREATE POLICY "Allow public update on resident-documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'resident-documents');

CREATE POLICY "Allow public delete on resident-documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'resident-documents');

