# Supabase Setup Guide

## 1. Tạo project tại https://supabase.com (free)

## 2. Lấy credentials → Settings → API
Điền vào `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## 3. Chạy SQL sau trong Supabase SQL Editor

```sql
-- Bảng lưu quần áo
create table clothing_items (
  id text primary key,
  image_url text not null,
  type text,
  color text,
  material text,
  style text,
  condition text,
  tags text[],
  try_on_count integer default 0,
  added_at timestamptz default now(),
  last_tried_at timestamptz
);

-- Bảng lưu outfit combos + feedback
create table outfit_records (
  id text primary key,
  item_ids text[],
  occasion text,
  weather text,
  ai_reasoning text,
  ai_tips text,
  ai_score integer,
  user_rating integer,
  user_feedback text,
  worn boolean default false,
  created_at timestamptz default now()
);

-- Bảng AI style profile (học từ feedback)
create table ai_style_profiles (
  user_id text primary key,
  total_outfits integer default 0,
  avg_rating float default 0,
  top_colors text[],
  top_styles text[],
  top_occasions text[],
  liked_combos text[],
  disliked_combos text[],
  personality_tags text[],
  style_summary text,
  color_preferences jsonb,
  outfit_rules text[],
  last_updated timestamptz default now()
);

-- Function tăng try_on_count
create or replace function increment_try_on_count(item_id text)
returns void as $$
  update clothing_items set try_on_count = try_on_count + 1 where id = item_id;
$$ language sql;

-- Ý tưởng tái chế cộng đồng (mọi người xem & đăng qua app)
create table community_recycle_ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) >= 1 and char_length(title) <= 200),
  description text not null check (char_length(description) <= 8000),
  category text not null check (category in ('Tái chế', 'Upcycle')),
  difficulty text not null,
  time_estimate text not null default '30 phút',
  materials_needed text[] not null default '{}',
  clothing_types text[] not null default '{}',
  tags text[] not null default '{}',
  search_query text not null,
  tutorial_url text,
  tutorial_label text,
  likes integer not null default 0,
  created_at timestamptz not null default now()
);

alter table community_recycle_ideas enable row level security;

create policy "read community recycle ideas"
  on community_recycle_ideas for select
  using (true);

create policy "insert community recycle ideas"
  on community_recycle_ideas for insert
  with check (true);
```

## 4. Tạo Storage bucket
- Vào Storage → New bucket → tên: `fitai` → Public: ON

## 5. Storage policy (cho phép upload)
```sql
create policy "Public read" on storage.objects
  for select using (bucket_id = 'fitai');

create policy "Public upload" on storage.objects
  for insert with check (bucket_id = 'fitai');

create policy "Public delete" on storage.objects
  for delete using (bucket_id = 'fitai');
```
