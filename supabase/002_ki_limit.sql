-- Tageslimit für den KI-Import: pro Konto und insgesamt.
create table if not exists public.prepd_ki_nutzung (
  konto  uuid not null references public.prepd_konten(id) on delete cascade,
  tag    date not null default current_date,
  anzahl integer not null default 0,
  primary key (konto, tag)
);
alter table public.prepd_ki_nutzung enable row level security;
revoke all on public.prepd_ki_nutzung from anon, authenticated, public;

-- Prüft die Sitzung, zählt eine Nutzung hoch und meldet, ob das Limit erreicht ist.
create or replace function public.prepd_ki_zaehlen(p_token text, p_max_konto integer default 30, p_max_gesamt integer default 150)
returns jsonb language plpgsql security definer set search_path = public as $$
declare id_ uuid := prepd_konto_von_token(p_token); n integer; g integer;
begin
  if id_ is null then return jsonb_build_object('fehler','sitzung'); end if;
  select coalesce(sum(anzahl),0) into g from prepd_ki_nutzung where tag = current_date;
  select coalesce(anzahl,0) into n from prepd_ki_nutzung where konto = id_ and tag = current_date;
  if coalesce(n,0) >= p_max_konto or g >= p_max_gesamt then
    return jsonb_build_object('fehler','limit');
  end if;
  insert into prepd_ki_nutzung(konto, tag, anzahl) values (id_, current_date, 1)
    on conflict (konto, tag) do update set anzahl = prepd_ki_nutzung.anzahl + 1;
  return jsonb_build_object('ok', true, 'heute', coalesce(n,0) + 1, 'max', p_max_konto);
end $$;
revoke all on function public.prepd_ki_zaehlen(text,integer,integer) from public, anon, authenticated;
grant execute on function public.prepd_ki_zaehlen(text,integer,integer) to anon;
