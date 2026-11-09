-- ============================================================================
-- TOWERTECH VISITORS MODULE — MASTER SUPABASE SQL MIGRATION & RLS POLICIES
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Ensure Visitor Gate Table Exists
CREATE TABLE IF NOT EXISTS visitor_gates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id TEXT NOT NULL DEFAULT 'GV2026',
    gate_name TEXT NOT NULL,
    gate_code TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Default Security Gates
INSERT INTO visitor_gates (gate_name, gate_code, society_id)
VALUES 
    ('Main Gate', 'GATE-01', 'GV2026'),
    ('North Gate', 'GATE-02', 'GV2026')
ON CONFLICT DO NOTHING;

-- 2. Master Visitors Table (Covers Walk-ins, Passes, Photo URLs, Timestamps & Gate Details)
CREATE TABLE IF NOT EXISTS visitors (
    visitor_id BIGSERIAL PRIMARY KEY,
    visitor_name TEXT NOT NULL,
    visitor_mobile TEXT NOT NULL,
    visitor_type TEXT DEFAULT 'Guest', -- Guest, Delivery, Cab, Maintenance, Vendor, Domestic Help, Other
    vehicle_number TEXT,
    profile_photo TEXT,
    resident_id TEXT NOT NULL,
    resident_name TEXT,
    tower TEXT DEFAULT 'A',
    flat_number TEXT DEFAULT '101',
    purpose TEXT NOT NULL,
    gate_name TEXT DEFAULT 'Main Gate',
    visitor_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'Pending', -- Pending, Approved, Inside, Exited, Rejected, Cancelled, Expired
    approval_status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
    rejection_reason TEXT,
    approval_time TIMESTAMP WITH TIME ZONE,
    entry_time TIMESTAMP WITH TIME ZONE,
    exit_time TIMESTAMP WITH TIME ZONE,
    security_user_name TEXT DEFAULT 'Amit Jadhav',
    security_user_mobile TEXT DEFAULT '9876543210',
    security_user_shift TEXT DEFAULT 'Morning',
    society_id TEXT DEFAULT 'GV2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Visitor Invitations Table (Pre-Approved Fast Passes)
CREATE TABLE IF NOT EXISTS visitor_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_code TEXT UNIQUE NOT NULL,
    visitor_name TEXT NOT NULL,
    visitor_mobile TEXT NOT NULL,
    category TEXT DEFAULT 'guest',
    resident_id TEXT NOT NULL,
    resident_name TEXT,
    flat_number TEXT NOT NULL,
    tower TEXT NOT NULL,
    expected_date DATE NOT NULL,
    expected_time TIME,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    visitor_count INTEGER DEFAULT 1,
    purpose TEXT DEFAULT 'Personal Guest',
    vehicle_number TEXT,
    status TEXT DEFAULT 'active', -- active, used, cancelled, expired
    qr_token TEXT UNIQUE NOT NULL,
    society_id TEXT DEFAULT 'GV2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Visitor Audit Events Log
CREATE TABLE IF NOT EXISTS visitor_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id BIGINT,
    visitor_name TEXT,
    event_type TEXT NOT NULL, -- request_created, approved, rejected, check_in, check_out, cancelled
    performed_by TEXT NOT NULL,
    performer_role TEXT DEFAULT 'security', -- security, resident, admin
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    society_id TEXT DEFAULT 'GV2026',
    event_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Visitor In-App Realtime Notifications
CREATE TABLE IF NOT EXISTS visitor_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id TEXT NOT NULL,
    visitor_id BIGINT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT DEFAULT 'visitor',
    delivery_status TEXT DEFAULT 'delivered', -- pending, delivered, read
    society_id TEXT DEFAULT 'GV2026',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Speed & Performance
CREATE INDEX IF NOT EXISTS idx_visitors_resident ON visitors(resident_id);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);
CREATE INDEX IF NOT EXISTS idx_visitors_society ON visitors(society_id);
CREATE INDEX IF NOT EXISTS idx_invitations_resident ON visitor_invitations(resident_id);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON visitor_invitations(invitation_code);

-- Enable Supabase Realtime for Visitors Table
ALTER PUBLICATION supabase_realtime ADD TABLE visitors;

-- Enable Row Level Security (RLS)
ALTER TABLE visitor_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_notifications ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for Anon / Authenticated App Users
CREATE POLICY "Public Read Gates" ON visitor_gates FOR SELECT USING (true);
CREATE POLICY "Public Read Visitors" ON visitors FOR SELECT USING (true);
CREATE POLICY "Public Insert Visitors" ON visitors FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Visitors" ON visitors FOR UPDATE USING (true);
CREATE POLICY "Public Delete Visitors" ON visitors FOR DELETE USING (true);

CREATE POLICY "Public Read Invitations" ON visitor_invitations FOR SELECT USING (true);
CREATE POLICY "Public Insert Invitations" ON visitor_invitations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Invitations" ON visitor_invitations FOR UPDATE USING (true);

CREATE POLICY "Public Read Events" ON visitor_events FOR SELECT USING (true);
CREATE POLICY "Public Insert Events" ON visitor_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Notifications" ON visitor_notifications FOR SELECT USING (true);
CREATE POLICY "Public Insert Notifications" ON visitor_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Notifications" ON visitor_notifications FOR UPDATE USING (true);

-- ============================================================================
-- 6. SUPABASE STORAGE BUCKET SETUP ('visitor-photos')
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'visitor-photos', 
    'visitor-photos', 
    true, 
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'visitor-photos'
CREATE POLICY "Public Storage Access" ON storage.objects 
    FOR SELECT USING (bucket_id = 'visitor-photos');

CREATE POLICY "Public Storage Upload" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'visitor-photos');

CREATE POLICY "Public Storage Update" ON storage.objects 
    FOR UPDATE USING (bucket_id = 'visitor-photos');
