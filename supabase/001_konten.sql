-- Prepd: Konten + Sync ohne Supabase Auth (keine E-Mail, keine Bestätigung).
-- Tabellen sind für anon/authenticated komplett gesperrt; Zugriff nur über die RPC-Funktionen unten.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.prepd_konten (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  pw        text not null,
  zustand   jsonb not null default '{}'::jsonb,
  rev       integer not null default 1,
  erstellt  timestamptz not null default now(),
  geaendert timestamptz not null default now(),
  constraint prepd_name_form check (name ~ '^[a-z0-9_.-]{3,24}$')
);
create unique index if not exists prepd_konten_name_idx on public.prepd_konten (name);

create table if not exists public.prepd_sitzungen (
  token_hash text primary key,
  konto      uuid not null references public.prepd_konten(id) on delete cascade,
  erstellt   timestamptz not null default now(),
  zuletzt    timestamptz not null default now()
);
create index if not exists prepd_sitzungen_konto_idx on public.prepd_sitzungen (konto);

create table if not exists public.prepd_versuche (
  id   bigint generated always as identity primary key,
  name text not null,
  zeit timestamptz not null default now()
);
create index if not exists prepd_versuche_idx on public.prepd_versuche (name, zeit);

alter table public.prepd_konten    enable row level security;
alter table public.prepd_sitzungen enable row level security;
alter table public.prepd_versuche  enable row level security;
revoke all on public.prepd_konten, public.prepd_sitzungen, public.prepd_versuche from anon, authenticated, public;

-- Hilfsfunktion: Token -> Konto-ID (und Sitzung auffrischen)
create or replace function public.prepd_konto_von_token(p_token text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare k uuid;
begin
  if p_token is null or length(p_token) < 32 then return null; end if;
  update prepd_sitzungen set zuletzt = now()
   where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
     and zuletzt > now() - interval '90 days'
  returning konto into k;
  return k;
end $$;

create or replace function public.prepd_neue_sitzung(p_konto uuid)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare t text := encode(gen_random_bytes(32), 'hex');
begin
  insert into prepd_sitzungen (token_hash, konto) values (encode(sha256(convert_to(t, 'UTF8')), 'hex'), p_konto);
  -- pro Konto höchstens 10 Geräte/Sitzungen behalten
  delete from prepd_sitzungen where konto = p_konto and token_hash not in
    (select token_hash from prepd_sitzungen where konto = p_konto order by zuletzt desc limit 10);
  return t;
end $$;

create or replace function public.prepd_registrieren(p_name text, p_pw text, p_zustand jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare n text := lower(trim(p_name)); k prepd_konten; t text;
begin
  if n !~ '^[a-z0-9_.-]{3,24}$' then return jsonb_build_object('fehler','name'); end if;
  if p_pw is null or length(p_pw) < 6 or length(p_pw) > 100 then return jsonb_build_object('fehler','pw'); end if;
  if (select count(*) from prepd_konten) >= 10 then return jsonb_build_object('fehler','voll'); end if;
  if pg_column_size(p_zustand) > 200000 then return jsonb_build_object('fehler','gross'); end if;
  if exists (select 1 from prepd_konten where name = n) then return jsonb_build_object('fehler','vergeben'); end if;
  insert into prepd_konten (name, pw, zustand)
    values (n, crypt(p_pw, gen_salt('bf', 10)), coalesce(p_zustand, '{}'::jsonb)) returning * into k;
  t := prepd_neue_sitzung(k.id);
  return jsonb_build_object('ok', true, 'token', t, 'name', k.name, 'rev', k.rev, 'zustand', k.zustand);
end $$;

create or replace function public.prepd_anmelden(p_name text, p_pw text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare n text := lower(trim(p_name)); k prepd_konten; t text;
begin
  delete from prepd_versuche where zeit < now() - interval '1 day';
  if (select count(*) from prepd_versuche where name = n and zeit > now() - interval '15 minutes') >= 8 then
    return jsonb_build_object('fehler','gesperrt');
  end if;
  select * into k from prepd_konten where name = n;
  if k.id is null or k.pw <> crypt(coalesce(p_pw,''), k.pw) then
    insert into prepd_versuche (name) values (n);
    return jsonb_build_object('fehler','falsch');
  end if;
  delete from prepd_versuche where name = n;
  t := prepd_neue_sitzung(k.id);
  return jsonb_build_object('ok', true, 'token', t, 'name', k.name, 'rev', k.rev, 'zustand', k.zustand);
end $$;

create or replace function public.prepd_laden(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare id_ uuid := prepd_konto_von_token(p_token); k prepd_konten;
begin
  if id_ is null then return jsonb_build_object('fehler','sitzung'); end if;
  select * into k from prepd_konten where id = id_;
  return jsonb_build_object('ok', true, 'name', k.name, 'rev', k.rev, 'zustand', k.zustand);
end $$;

-- Optimistisches Sperren: nur speichern, wenn p_rev dem Stand auf dem Server entspricht.
-- Sonst kommt der Serverstand zurück und der Client führt beides zusammen.
create or replace function public.prepd_speichern(p_token text, p_rev integer, p_zustand jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare id_ uuid := prepd_konto_von_token(p_token); k prepd_konten;
begin
  if id_ is null then return jsonb_build_object('fehler','sitzung'); end if;
  if p_zustand is null or jsonb_typeof(p_zustand) <> 'object' or pg_column_size(p_zustand) > 200000 then
    return jsonb_build_object('fehler','gross');
  end if;
  update prepd_konten set zustand = p_zustand, rev = rev + 1, geaendert = now()
   where id = id_ and rev = p_rev returning * into k;
  if k.id is not null then
    return jsonb_build_object('ok', true, 'rev', k.rev);
  end if;
  select * into k from prepd_konten where id = id_;
  return jsonb_build_object('konflikt', true, 'rev', k.rev, 'zustand', k.zustand);
end $$;

create or replace function public.prepd_abmelden(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  delete from prepd_sitzungen where token_hash = encode(sha256(convert_to(coalesce(p_token,''), 'UTF8')), 'hex');
  return jsonb_build_object('ok', true);
end $$;

-- Nur die fünf öffentlichen Funktionen sind aufrufbar; Hilfsfunktionen bleiben intern.
revoke all on function public.prepd_konto_von_token(text), public.prepd_neue_sitzung(uuid) from public, anon, authenticated;
revoke all on function public.prepd_registrieren(text,text,jsonb), public.prepd_anmelden(text,text),
  public.prepd_laden(text), public.prepd_speichern(text,integer,jsonb), public.prepd_abmelden(text) from public;
grant execute on function public.prepd_registrieren(text,text,jsonb), public.prepd_anmelden(text,text),
  public.prepd_laden(text), public.prepd_speichern(text,integer,jsonb), public.prepd_abmelden(text) to anon, authenticated;
