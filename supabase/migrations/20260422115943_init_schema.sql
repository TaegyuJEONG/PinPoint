-- Create users table extending auth.users
create table public.users (
  id uuid references auth.users(id) primary key,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  github_repo_url text,
  product_urls jsonb,
  initial_geo_draft jsonb,
  keywords jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.geo_files (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  llms_txt text,
  llms_full_txt text,
  onboarding_answers jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.github_tokens (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  access_token text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.reddit_accounts (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  reddit_username text not null,
  access_token text not null,
  refresh_token text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.reddit_posts (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  keyword text not null,
  post_id text not null,
  subreddit text not null,
  title text not null,
  body text,
  author_username text not null,
  post_url text not null,
  post_created_at timestamp with time zone not null,
  fetched_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (project_id, post_id)
);

create table public.comments (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  reddit_post_id uuid references public.reddit_posts(id) on delete cascade not null,
  author_username text not null,
  draft_text text,
  edited_text text,
  status text check (status in ('pending', 'confirmed', 'rejected', 'posted')) default 'pending',
  posted_at timestamp with time zone,
  reddit_comment_id text,
  utm_tag text,
  confirmed_at timestamp with time zone,
  rejected_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.conversions (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  comment_id uuid references public.comments(id) on delete cascade not null,
  source text check (source in ('stripe', 'js_snippet')) not null,
  converted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  stripe_payment_intent_id text
);

-- Enable RLS (Row Level Security) - basic configuration
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.geo_files enable row level security;
alter table public.github_tokens enable row level security;
alter table public.reddit_accounts enable row level security;
alter table public.reddit_posts enable row level security;
alter table public.comments enable row level security;
alter table public.conversions enable row level security;

-- Basic Policies (can be refined later, assuming authenticated user can only access their own data via projects table)
-- We will add those later or handle authorization via the API route in v1.
