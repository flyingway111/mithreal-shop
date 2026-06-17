create table products (
  id bigint primary key generated always as identity,
  name text not null,
  price integer not null,
  category text not null,
  sizes text[] not null default '{}',
  images text[] not null default '{}',
  is_new boolean default false,
  stock integer default 1,
  description text,
  created_at timestamptz default now()
);

-- Allow public read
alter table products enable row level security;
create policy "Public can read products" on products for select using (true);
create policy "Anyone can insert" on products for insert with check (true);
create policy "Anyone can update" on products for update using (true);
create policy "Anyone can delete" on products for delete using (true);
