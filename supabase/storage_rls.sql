-- Run this in the Supabase SQL editor after creating the "documents" storage bucket.
-- The bucket should be created as PRIVATE (not public) via the Supabase dashboard or API.

-- Allow household members to upload files under their household_id prefix
create policy "household members can upload documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select household_id::text from household_members where user_id = auth.uid()
    )
  );

-- Allow household members to read their files
create policy "household members can read documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select household_id::text from household_members where user_id = auth.uid()
    )
  );

-- Allow household members to delete their files
create policy "household members can delete documents"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select household_id::text from household_members where user_id = auth.uid()
    )
  );
