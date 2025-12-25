-- 03_media.sql: Consolidated Storage & Media Policies

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('story-images', 'story-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('colored-masterpieces', 'colored-masterpieces', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdfs', 'pdfs', false) -- Private bucket for distribution security
ON CONFLICT (id) DO NOTHING;

-- Cleanup existing policies on storage.objects
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "User Folder Access" ON storage.objects;
DROP POLICY IF EXISTS "PDF Selective Access" ON storage.objects;
DROP POLICY IF EXISTS "User View Own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "User Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "User Update Access" ON storage.objects;
DROP POLICY IF EXISTS "User Delete Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own PDFs" ON storage.objects;

-- 2. General Object Policies (Images)
-- Anyone can read images (for sharing)
CREATE POLICY "Public Read Access" ON storage.objects 
    FOR SELECT USING (bucket_id IN ('story-images', 'colored-masterpieces'));

-- 3. Authenticated User Policies (Images & PDFs)
-- Users can only manage files in their own folder: [bucket]/[user_id]/...
CREATE POLICY "User Folder Access" ON storage.objects 
    FOR ALL
    TO authenticated
    USING ((storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK ((storage.foldername(name))[1] = auth.uid()::text);

-- Specifically ensure PDFs are hidden from public select
-- (Redundant due to bucket public=false, but good for defense-in-depth)
CREATE POLICY "PDF Selective Access" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);
