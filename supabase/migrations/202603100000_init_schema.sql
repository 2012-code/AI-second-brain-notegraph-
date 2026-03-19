-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create profiles table
create table public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  use_cases text[],
  summary_time text default '08:00',
  summary_enabled boolean default true,
  chat_personality text default 'friendly',
  onboarding_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.profiles enable row level security;

-- Create notes table
create table public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  content text default '' not null,
  summary text,
  category text,
  tags text[],
  key_topics text[],
  is_favorite boolean default false,
  is_archived boolean default false,
  embedding vector(768),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.notes enable row level security;

-- Create note_connections table
create table public.note_connections (
  id uuid default gen_random_uuid() primary key,
  note_id_1 uuid references public.notes(id) on delete cascade,
  note_id_2 uuid references public.notes(id) on delete cascade,
  connection_reason text,
  strength float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.note_connections enable row level security;

-- Create chat_messages table
create table public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  referenced_note_ids uuid[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.chat_messages enable row level security;

-- Create subscriptions table
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  paypal_subscription_id text unique,
  paypal_plan_id text,
  status text check (status in ('trialing', 'active', 'cancelled', 'suspended', 'expired')) default 'trialing',
  trial_ends_at timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.subscriptions enable row level security;

-- Create policies for profiles
create policy "Users can view own profile." on profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create policies for notes
create policy "Users can view own notes." on notes
  for select using (auth.uid() = user_id);
create policy "Users can create notes." on notes
  for insert with check (auth.uid() = user_id);
create policy "Users can update own notes." on notes
  for update using (auth.uid() = user_id);
create policy "Users can delete own notes." on notes
  for delete using (auth.uid() = user_id);

-- Create policies for note_connections
create policy "Users can view own note connections." on note_connections
  for select using (
    exists (
      select 1 from notes n
      where n.id = note_connections.note_id_1 and n.user_id = auth.uid()
    )
  );
create policy "System can create and manage note connections." on note_connections
  for all using (true);

-- Create policies for chat_messages
create policy "Users can view own messages." on chat_messages
  for select using (auth.uid() = user_id);
create policy "Users can create messages." on chat_messages
  for insert with check (auth.uid() = user_id);

-- Create policies for subscriptions
create policy "Users can view own subscription." on subscriptions
  for select using (auth.uid() = user_id);
create policy "System can manage subscriptions." on subscriptions
  for all using (true);
