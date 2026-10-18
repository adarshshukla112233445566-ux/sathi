/*
# Storage policies for complaints bucket

1. Purpose
   Allow authenticated users to upload complaint photos and everyone to read
   them (public bucket for demo).

2. Policies
   - SELECT: public read (anon + authenticated)
   - INSERT: authenticated users can upload
*/

DROP POLICY IF EXISTS "complaints_bucket_read" ON storage.objects;
CREATE POLICY "complaints_bucket_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'complaints');

DROP POLICY IF EXISTS "complaints_bucket_upload" ON storage.objects;
CREATE POLICY "complaints_bucket_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'complaints');
