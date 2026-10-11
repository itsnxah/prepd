-- Neue Konten müssen vom Admin freigegeben werden.
alter table public.prepd_konten
  add column if not exists freigegeben boolean not null default false,
  add column if not exists admin boolean not null default false;
update public.prepd_konten set freigegeben = true;          -- bestehende Konten bleiben nutzbar
update public.prepd_konten set admin = true where name = 'noah';

-- Sitzungen gelten nur für freigegebene Konten (Sperren wirkt sofort)
create or replace function public.prepd_konto_von_token(p_token text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare k uuid;
begin
  if p_token is null or length(p_token) < 32 then return null; end if;
  update prepd_sitzungen s set zuletzt = now()
    from prepd_konten c
   where c.id = s.konto and c.freigegeben
     and s.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
     and s.zuletzt > now() - interval '90 days'
  returning s.konto into k;
  return k;
end $$;

create or replace function public.prepd_registrieren(p_name text, p_pw text, p_zustand jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare n text := lower(trim(p_name)); k prepd_konten;
begin
  if n !~ '^[a-z0-9_.-]{3,24}$' then return jsonb_build_object('fehler','name'); end if;
  if p_pw is null or length(p_pw) < 6 or length(p_pw) > 100 then return jsonb_build_object('fehler','pw'); end if;
  if (select count(*) from prepd_konten) >= 10 then return jsonb_build_object('fehler','voll'); end if;
  if pg_column_size(p_zustand) > 200000 then return jsonb_build_object('fehler','gross'); end if;
  if exists (select 1 from prepd_konten where name = n) then return jsonb_build_object('fehler','vergeben'); end if;
  insert into prepd_konten (name, pw, zustand, freigegeben)
    values (n, crypt(p_pw, gen_salt('bf', 10)), coalesce(p_zustand, '{}'::jsonb), false) returning * into k;
  return jsonb_build_object('fehler','wartet');
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
  if not k.freigegeben then return jsonb_build_object('fehler','wartet'); end if;
  t := prepd_neue_sitzung(k.id);
  return jsonb_build_object('ok', true, 'token', t, 'name', k.name, 'rev', k.rev, 'zustand', k.zustand, 'admin', k.admin);
end $$;

create or replace function public.prepd_laden(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare id_ uuid := prepd_konto_von_token(p_token); k prepd_konten;
begin
  if id_ is null then return jsonb_build_object('fehler','sitzung'); end if;
  select * into k from prepd_konten where id = id_;
  return jsonb_build_object('ok', true, 'name', k.name, 'rev', k.rev, 'zustand', k.zustand, 'admin', k.admin);
end $$;

-- Nur Admin: alle Konten auflisten
create or replace function public.prepd_verwaltung(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare id_ uuid := prepd_konto_von_token(p_token);
begin
  if id_ is null then return jsonb_build_object('fehler','sitzung'); end if;
  if not (select admin from prepd_konten where id = id_) then return jsonb_build_object('fehler','recht'); end if;
  return jsonb_build_object('ok', true, 'konten', coalesce((
    select jsonb_agg(jsonb_build_object('name', name, 'freigegeben', freigegeben, 'admin', admin, 'erstellt', erstellt) order by freigegeben, erstellt)
      from prepd_konten), '[]'::jsonb));
end $$;

-- Nur Admin: Konto freigeben oder sperren
create or replace function public.prepd_freigabe(p_token text, p_name text, p_ja boolean)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare id_ uuid := prepd_konto_von_token(p_token); z uuid;
begin
  if id_ is null then return jsonb_build_object('fehler','sitzung'); end if;
  if not (select admin from prepd_konten where id = id_) then return jsonb_build_object('fehler','recht'); end if;
  select id into z from prepd_konten where name = lower(trim(p_name));
  if z is null then return jsonb_build_object('fehler','unbekannt'); end if;
  if z = id_ then return jsonb_build_object('fehler','selbst'); end if;
  update prepd_konten set freigegeben = coalesce(p_ja, false) where id = z;
  if not coalesce(p_ja, false) then delete from prepd_sitzungen where konto = z; end if;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.prepd_verwaltung(text), public.prepd_freigabe(text,text,boolean) from public, anon, authenticated;
grant execute on function public.prepd_verwaltung(text), public.prepd_freigabe(text,text,boolean) to anon;
grant execute on function public.prepd_registrieren(text,text,jsonb), public.prepd_anmelden(text,text), public.prepd_laden(text) to anon;
