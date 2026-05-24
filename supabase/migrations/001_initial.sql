-- Items table
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  category text not null default 'Other' check (category in ('Appliance','Electronics','Furniture','Tool','Vehicle','Other')),
  purchase_date date,
  purchase_price numeric(10,2),
  store text,
  warranty_years numeric(4,1),
  warranty_expiry date,
  serial_number text,
  model_number text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists items_household_id_idx on items(household_id);
create index if not exists items_warranty_expiry_idx on items(warranty_expiry);

-- Item documents table
create table if not exists item_documents (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  document_type text not null default 'receipt' check (document_type in ('receipt','warranty','manual','service_record','photo')),
  storage_path text not null,
  file_name text not null,
  uploaded_at timestamptz not null default now(),
  notes text
);

create index if not exists item_documents_item_id_idx on item_documents(item_id);

-- RLS for items
alter table items enable row level security;

create policy "household members can read items"
  on items for select
  using (
    household_id in (
      select household_id from household_members where user_id = auth.uid()
    )
  );

create policy "household members can insert items"
  on items for insert
  with check (
    household_id in (
      select household_id from household_members where user_id = auth.uid()
    )
  );

create policy "household members can update items"
  on items for update
  using (
    household_id in (
      select household_id from household_members where user_id = auth.uid()
    )
  );

create policy "household members can delete items"
  on items for delete
  using (
    household_id in (
      select household_id from household_members where user_id = auth.uid()
    )
  );

-- RLS for item_documents
alter table item_documents enable row level security;

create policy "household members can read documents"
  on item_documents for select
  using (
    item_id in (
      select id from items where household_id in (
        select household_id from household_members where user_id = auth.uid()
      )
    )
  );

create policy "household members can insert documents"
  on item_documents for insert
  with check (
    item_id in (
      select id from items where household_id in (
        select household_id from household_members where user_id = auth.uid()
      )
    )
  );

create policy "household members can delete documents"
  on item_documents for delete
  using (
    item_id in (
      select id from items where household_id in (
        select household_id from household_members where user_id = auth.uid()
      )
    )
  );
