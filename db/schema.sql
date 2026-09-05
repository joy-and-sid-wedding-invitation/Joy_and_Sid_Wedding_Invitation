-- Neon PostgreSQL schema for the digital invitation.
-- Run once against your Neon database (SQL editor or psql).

create table if not exists invitations (
  id           uuid primary key default gen_random_uuid(),
  token        text not null unique,
  guest_name   text not null,
  status       text not null default 'pending'
                 check (status in ('pending', 'accepted', 'declined')),
  responded_at timestamptz,
  -- Optional details captured from the RSVP form (filled on respond).
  response_name  text,
  response_email text,
  guest_count    integer,
  dietary        text,
  flight_details text,
  message        text,
  created_at   timestamptz not null default now()
);

create index if not exists invitations_token_idx on invitations (token);

-- Safe upgrades for databases created before RSVP detail columns existed.
alter table invitations add column if not exists response_name text;
alter table invitations add column if not exists response_email text;
alter table invitations add column if not exists guest_count integer;
alter table invitations add column if not exists dietary text;
alter table invitations add column if not exists flight_details text;
alter table invitations add column if not exists message text;
