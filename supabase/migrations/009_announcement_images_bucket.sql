-- Create a public storage bucket for announcement images.
-- Images are uploaded by admins and must be viewable by all authenticated users.
-- Run this once in your Supabase project via the SQL editor or Supabase CLI.

-- 1. Create the bucket (public so participants can load images without a signed URL)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'announcement-images',
  'announcement-images',
  true,
  1048576,                                    -- 1 MB per file
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 2. Allow admins / main_admins to upload and delete images
create policy "Admins can upload announcement images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'announcement-images'
    and (
      select role from public.users where id = auth.uid()
    ) in ('admin', 'main_admin')
  );

create policy "Admins can delete announcement images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'announcement-images'
    and (
      select role from public.users where id = auth.uid()
    ) in ('admin', 'main_admin')
  );

-- 3. Allow any authenticated user (participants, parents) to read images
create policy "Authenticated users can view announcement images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'announcement-images');
