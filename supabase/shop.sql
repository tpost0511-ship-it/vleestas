create table if not exists public.shop_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 80),
  description text not null default '' check (char_length(description) <= 600),
  price integer not null check (price between 1 and 100000),
  stock integer not null check (stock between 0 and 10000),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists shop_items_group_created_idx
  on public.shop_items (group_id, created_at desc);

create table if not exists public.shop_purchases (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  item_id uuid not null references public.shop_items(id) on delete restrict,
  buyer_id uuid not null references auth.users(id) on delete restrict,
  seller_id uuid not null references auth.users(id) on delete restrict,
  price integer not null check (price between 1 and 100000),
  created_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);

create index if not exists shop_purchases_group_created_idx
  on public.shop_purchases (group_id, created_at desc);
create index if not exists shop_purchases_buyer_idx
  on public.shop_purchases (group_id, buyer_id);
create index if not exists shop_purchases_seller_idx
  on public.shop_purchases (group_id, seller_id);

alter table public.challenges
  add column if not exists reward_slots integer not null default 1,
  add column if not exists cancelled_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'challenges_reward_slots_check'
      and conrelid = 'public.challenges'::regclass
  ) then
    alter table public.challenges
      add constraint challenges_reward_slots_check check (reward_slots between 1 and 100);
  end if;
end;
$$;

create table if not exists public.challenge_funds (
  challenge_id uuid primary key references public.challenges(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete restrict,
  points_per_slot integer not null check (points_per_slot between 1 and 1000),
  slots_total integer not null check (slots_total between 1 and 100),
  slots_reserved integer not null default 0 check (slots_reserved >= 0),
  slots_paid integer not null default 0 check (slots_paid >= 0),
  refunded_slots integer not null default 0 check (refunded_slots >= 0),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  check (slots_reserved + slots_paid + refunded_slots <= slots_total)
);

create index if not exists challenge_funds_group_idx
  on public.challenge_funds (group_id);

create table if not exists public.challenge_reservations (
  participation_id uuid primary key references public.participations(id) on delete cascade,
  challenge_id uuid not null references public.challenge_funds(challenge_id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  status text not null check (status in ('reserved', 'paid', 'released')),
  created_at timestamptz not null default now()
);

create index if not exists challenge_reservations_challenge_idx
  on public.challenge_reservations (challenge_id, status);

create table if not exists public.challenge_awards (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  challenge_id uuid not null references public.challenge_funds(challenge_id) on delete restrict,
  participation_id uuid not null unique references public.participations(id) on delete restrict,
  recipient_id uuid not null references auth.users(id) on delete restrict,
  points integer not null check (points between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists challenge_awards_group_idx
  on public.challenge_awards (group_id, recipient_id);

create table if not exists public.daily_challenge_bonuses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  award_date date not null,
  points integer not null default 25 check (points = 25),
  created_at timestamptz not null default now(),
  unique (user_id, award_date)
);

create index if not exists daily_challenge_bonuses_group_idx
  on public.daily_challenge_bonuses (group_id, award_date desc);

create table if not exists public.roulette_spins (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  bets jsonb not null check (jsonb_typeof(bets) = 'array'),
  winning_number integer not null check (winning_number between 0 and 36),
  stake bigint not null check (stake > 0),
  payout bigint not null check (payout >= 0),
  created_at timestamptz not null default now()
);

create index if not exists roulette_spins_group_created_idx
  on public.roulette_spins (group_id, created_at desc);
create index if not exists roulette_spins_user_group_idx
  on public.roulette_spins (group_id, user_id);

create table if not exists public.group_starting_points (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  points integer not null default 100 check (points = 100),
  granted_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.shop_items enable row level security;
alter table public.shop_purchases enable row level security;
alter table public.challenge_funds enable row level security;
alter table public.challenge_reservations enable row level security;
alter table public.challenge_awards enable row level security;
alter table public.daily_challenge_bonuses enable row level security;
alter table public.roulette_spins enable row level security;
alter table public.group_starting_points enable row level security;

drop policy if exists "Group members can read shop items" on public.shop_items;
create policy "Group members can read shop items"
  on public.shop_items for select to authenticated
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = shop_items.group_id and gm.user_id = auth.uid()
    )
  );

drop policy if exists "Group members can post shop items" on public.shop_items;
create policy "Group members can post shop items"
  on public.shop_items for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = shop_items.group_id and gm.user_id = auth.uid()
    )
  );

drop policy if exists "Group members can read shop purchases" on public.shop_purchases;
create policy "Group members can read shop purchases"
  on public.shop_purchases for select to authenticated
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = shop_purchases.group_id and gm.user_id = auth.uid()
    )
  );

drop policy if exists "Group members can read challenge funds" on public.challenge_funds;
create policy "Group members can read challenge funds"
  on public.challenge_funds for select to authenticated
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = challenge_funds.group_id and gm.user_id = auth.uid()
    )
  );

drop policy if exists "Group members can read challenge awards" on public.challenge_awards;
create policy "Group members can read challenge awards"
  on public.challenge_awards for select to authenticated
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = challenge_awards.group_id and gm.user_id = auth.uid()
    )
  );

drop policy if exists "Group members can read daily challenge bonuses" on public.daily_challenge_bonuses;
create policy "Group members can read daily challenge bonuses"
  on public.daily_challenge_bonuses for select to authenticated
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = daily_challenge_bonuses.group_id and gm.user_id = auth.uid()
    )
  );

drop policy if exists "Group members can read roulette spins" on public.roulette_spins;
create policy "Group members can read roulette spins"
  on public.roulette_spins for select to authenticated
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = roulette_spins.group_id and gm.user_id = auth.uid()
    )
  );

drop policy if exists "Group members can read group starting points" on public.group_starting_points;
create policy "Group members can read group starting points"
  on public.group_starting_points for select to authenticated
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_starting_points.group_id and gm.user_id = auth.uid()
    )
  );

revoke all on public.shop_items from anon, authenticated;
grant select, insert on public.shop_items to authenticated;
revoke all on public.shop_purchases from anon, authenticated;
grant select on public.shop_purchases to authenticated;
revoke all on public.challenge_funds from anon, authenticated;
grant select on public.challenge_funds to authenticated;
revoke all on public.challenge_reservations from anon, authenticated;
revoke all on public.challenge_awards from anon, authenticated;
grant select on public.challenge_awards to authenticated;
revoke all on public.daily_challenge_bonuses from anon, authenticated;
grant select on public.daily_challenge_bonuses to authenticated;
revoke all on public.roulette_spins from anon, authenticated;
grant select on public.roulette_spins to authenticated;
revoke all on public.group_starting_points from anon, authenticated;
grant select on public.group_starting_points to authenticated;

create or replace function public.grant_group_starting_points()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.group_starting_points (group_id, user_id)
  values (new.group_id, new.user_id)
  on conflict (group_id, user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.grant_group_starting_points() from public, anon, authenticated;
drop trigger if exists group_members_grant_starting_points on public.group_members;
create trigger group_members_grant_starting_points
  after insert on public.group_members
  for each row
  execute function public.grant_group_starting_points();

insert into public.group_starting_points (group_id, user_id)
select gm.group_id, gm.user_id
from public.group_members gm
on conflict (group_id, user_id) do nothing;

create or replace function public.award_daily_challenge_bonus()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_award_date date;
begin
  if new.status <> 'approved' or old.status = 'approved' then
    return new;
  end if;

  select c.group_id into v_group_id
  from public.challenges c
  where c.id = new.challenge_id;

  if not found then
    raise exception 'Challenge niet gevonden.';
  end if;

  v_award_date := (now() at time zone 'Europe/Amsterdam')::date;
  insert into public.daily_challenge_bonuses (group_id, user_id, award_date)
  values (v_group_id, new.user_id, v_award_date)
  on conflict (user_id, award_date) do nothing;

  return new;
end;
$$;

revoke all on function public.award_daily_challenge_bonus() from public, anon, authenticated;
drop trigger if exists participations_award_daily_challenge_bonus on public.participations;
create trigger participations_award_daily_challenge_bonus
  after update of status on public.participations
  for each row
  execute function public.award_daily_challenge_bonus();

create or replace function public.wallet_balance(p_user_id uuid, p_group_id uuid)
returns bigint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    coalesce((
      select sum(c.points)::bigint
      from public.participations p
      join public.challenges c on c.id = p.challenge_id
      where p.user_id = p_user_id
        and p.status = 'approved'
        and c.group_id = p_group_id
        and not exists (
          select 1 from public.challenge_funds cf
          where cf.challenge_id = c.id
        )
    ), 0)
    + coalesce((
      select sum(a.points)::bigint
      from public.challenge_awards a
      where a.recipient_id = p_user_id and a.group_id = p_group_id
    ), 0)
    + coalesce((
      select sum(b.points)::bigint
      from public.daily_challenge_bonuses b
      where b.user_id = p_user_id and b.group_id = p_group_id
    ), 0)
    + coalesce((
      select sum(s.payout - s.stake)::bigint
      from public.roulette_spins s
      where s.user_id = p_user_id and s.group_id = p_group_id
    ), 0)
    + coalesce((
      select sum(gsp.points)::bigint
      from public.group_starting_points gsp
      where gsp.user_id = p_user_id and gsp.group_id = p_group_id
    ), 0)
    + coalesce((
      select sum(
        case
          when sp.seller_id = p_user_id then sp.price
          when sp.buyer_id = p_user_id then -sp.price
          else 0
        end
      )::bigint
      from public.shop_purchases sp
      where sp.group_id = p_group_id
        and (sp.buyer_id = p_user_id or sp.seller_id = p_user_id)
    ), 0)
    - coalesce((
      select sum(cf.points_per_slot::bigint * (cf.slots_total - cf.refunded_slots))
      from public.challenge_funds cf
      where cf.creator_id = p_user_id and cf.group_id = p_group_id
    ), 0);
$$;

revoke all on function public.wallet_balance(uuid, uuid) from public, anon, authenticated;

create or replace function public.fund_new_challenge()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cost bigint;
  v_balance bigint;
begin
  perform 1
  from public.group_members gm
  where gm.group_id = new.group_id and gm.user_id = new.created_by
  for update;

  if not found then
    raise exception 'Je moet lid zijn van de groep om een challenge te plaatsen.';
  end if;

  v_cost := new.points::bigint * new.reward_slots;
  v_balance := public.wallet_balance(new.created_by, new.group_id);
  if v_balance < v_cost then
    raise exception 'Je hebt niet genoeg punten om deze challenge en alle betaalde plekken te financieren.';
  end if;

  insert into public.challenge_funds (
    challenge_id, group_id, creator_id, points_per_slot, slots_total
  ) values (
    new.id, new.group_id, new.created_by, new.points, new.reward_slots
  );

  return new;
end;
$$;

drop trigger if exists challenges_fund_after_insert on public.challenges;
create trigger challenges_fund_after_insert
  after insert on public.challenges
  for each row execute function public.fund_new_challenge();

create or replace function public.reserve_challenge_slot()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_fund public.challenge_funds%rowtype;
begin
  if new.status in ('accepted', 'pending') and exists (
    select 1
    from public.challenges c
    where c.id = new.challenge_id and c.created_by = new.user_id
  ) then
    raise exception 'Je kunt je eigen challenge niet uitvoeren.';
  end if;

  if tg_op = 'INSERT' then
    if exists (
      select 1 from public.challenges c
      where c.id = new.challenge_id and c.cancelled_at is not null
    ) then
      raise exception 'Deze challenge is ingetrokken.';
    end if;

    select * into v_fund
    from public.challenge_funds
    where challenge_id = new.challenge_id
    for update;

    if not found then
      return new;
    end if;

    if new.status in ('accepted', 'pending') then
      update public.challenge_funds
      set slots_reserved = slots_reserved + 1
      where challenge_id = new.challenge_id
        and cancelled_at is null
        and slots_total - slots_paid - slots_reserved - refunded_slots > 0;
      if not found then
        raise exception 'Er zijn geen betaalde plekken meer beschikbaar.';
      end if;
    end if;
    return new;
  end if;

  if old.status = 'rejected' and new.status = 'pending' then
    if exists (
      select 1 from public.challenges c
      where c.id = new.challenge_id and c.cancelled_at is not null
    ) then
      raise exception 'Deze challenge is ingetrokken.';
    end if;

    select * into v_fund
    from public.challenge_funds
    where challenge_id = new.challenge_id
    for update;

    if not found then
      return new;
    end if;

    update public.challenge_funds
    set slots_reserved = slots_reserved + 1
    where challenge_id = new.challenge_id
      and cancelled_at is null
      and slots_total - slots_paid - slots_reserved - refunded_slots > 0;
    if not found then
      raise exception 'Er zijn geen betaalde plekken meer beschikbaar om opnieuw in te sturen.';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.sync_challenge_reservation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_fund public.challenge_funds%rowtype;
  v_reservation public.challenge_reservations%rowtype;
begin
  if tg_op = 'INSERT' then
    select * into v_fund
    from public.challenge_funds
    where challenge_id = new.challenge_id;

    if found and new.status in ('accepted', 'pending') then
      insert into public.challenge_reservations (
        participation_id, challenge_id, group_id, status
      ) values (
        new.id, new.challenge_id, v_fund.group_id, 'reserved'
      );
    end if;
    return new;
  end if;

  if old.status = 'rejected' and new.status = 'pending' then
    update public.challenge_reservations
    set status = 'reserved'
    where participation_id = new.id and status = 'released';
    if not found and exists (
      select 1 from public.challenge_funds where challenge_id = new.challenge_id
    ) then
      raise exception 'De betaalde plek voor deze inzending kon niet worden gereserveerd.';
    end if;
    return new;
  end if;

  if old.status = 'pending' and new.status in ('approved', 'rejected') then
    select * into v_reservation
    from public.challenge_reservations
    where participation_id = new.id
    for update;

    if not found then
      if exists (
        select 1 from public.challenge_funds where challenge_id = new.challenge_id
      ) then
        raise exception 'Voor deze inzending is geen betaalde plek gereserveerd.';
      end if;
      return new;
    end if;

    if v_reservation.status <> 'reserved' then
      raise exception 'Deze betaalde plek is al verwerkt.';
    end if;

    select * into v_fund
    from public.challenge_funds
    where challenge_id = new.challenge_id
    for update;

    if new.status = 'approved' then
      update public.challenge_funds
      set slots_reserved = slots_reserved - 1,
          slots_paid = slots_paid + 1
      where challenge_id = new.challenge_id and slots_reserved > 0;
      if not found then
        raise exception 'De betaalde plek kon niet worden uitbetaald.';
      end if;

      update public.challenge_reservations
      set status = 'paid'
      where participation_id = new.id;

      insert into public.challenge_awards (
        group_id, challenge_id, participation_id, recipient_id, points
      ) values (
        v_fund.group_id, new.challenge_id, new.id, new.user_id, v_fund.points_per_slot
      );
    else
      update public.challenge_funds
      set slots_reserved = slots_reserved - 1,
          refunded_slots = refunded_slots + case when cancelled_at is null then 0 else 1 end
      where challenge_id = new.challenge_id and slots_reserved > 0;
      if not found then
        raise exception 'De betaalde plek kon niet worden vrijgegeven.';
      end if;

      update public.challenge_reservations
      set status = 'released'
      where participation_id = new.id;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.release_challenge_slot_on_delete()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reservation public.challenge_reservations%rowtype;
begin
  select * into v_reservation
  from public.challenge_reservations
  where participation_id = old.id
  for update;

  if found and v_reservation.status = 'reserved' then
    update public.challenge_funds
    set slots_reserved = slots_reserved - 1,
        refunded_slots = refunded_slots + case when cancelled_at is null then 0 else 1 end
    where challenge_id = v_reservation.challenge_id and slots_reserved > 0;
  end if;

  return old;
end;
$$;

drop trigger if exists participations_reserve_challenge_slot on public.participations;
create trigger participations_reserve_challenge_slot
  before insert on public.participations
  for each row execute function public.reserve_challenge_slot();

drop trigger if exists participations_reserve_resubmission_slot on public.participations;
create trigger participations_reserve_resubmission_slot
  before update of status on public.participations
  for each row execute function public.reserve_challenge_slot();

drop trigger if exists participations_create_challenge_reservation on public.participations;
create trigger participations_create_challenge_reservation
  after insert on public.participations
  for each row execute function public.sync_challenge_reservation();

drop trigger if exists participations_sync_challenge_reservation on public.participations;
create trigger participations_sync_challenge_reservation
  after update of status on public.participations
  for each row execute function public.sync_challenge_reservation();

drop trigger if exists participations_release_challenge_slot on public.participations;
create trigger participations_release_challenge_slot
  before delete on public.participations
  for each row execute function public.release_challenge_slot_on_delete();

create or replace function public.cancel_challenge(p_challenge_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_fund public.challenge_funds%rowtype;
  v_challenge public.challenges%rowtype;
  v_refund integer;
begin
  select * into v_fund
  from public.challenge_funds
  where challenge_id = p_challenge_id
  for update;

  if not found then
    select * into v_challenge
    from public.challenges
    where id = p_challenge_id
    for update;

    if not found then
      raise exception 'Deze challenge is niet gevonden.';
    end if;
    if v_challenge.created_by <> auth.uid() then
      raise exception 'Deze challenge is niet gevonden.';
    end if;
    if v_challenge.cancelled_at is not null then
      raise exception 'Deze challenge is al ingetrokken.';
    end if;

    update public.challenges
    set cancelled_at = now()
    where id = p_challenge_id;
    return;
  end if;
  if v_fund.creator_id <> auth.uid() then
    raise exception 'Alleen de maker kan deze challenge intrekken.';
  end if;
  if v_fund.cancelled_at is not null then
    raise exception 'Deze challenge is al ingetrokken.';
  end if;

  v_refund := v_fund.slots_total - v_fund.slots_paid - v_fund.slots_reserved - v_fund.refunded_slots;
  update public.challenge_funds
  set refunded_slots = refunded_slots + v_refund,
      cancelled_at = now()
  where challenge_id = p_challenge_id;

  update public.challenges
  set cancelled_at = now()
  where id = p_challenge_id;
end;
$$;

create or replace function public.withdraw_challenge(p_participation_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_participation public.participations%rowtype;
begin
  select * into v_participation
  from public.participations
  where id = p_participation_id
  for update;

  if not found or v_participation.user_id <> auth.uid() then
    raise exception 'Deze deelname is niet gevonden.';
  end if;
  if v_participation.status <> 'accepted' then
    raise exception 'Alleen een challenge zonder ingezonden bewijs kan worden gestopt.';
  end if;

  delete from public.participations where id = p_participation_id;
end;
$$;

revoke all on function public.cancel_challenge(uuid) from public, anon;
revoke all on function public.withdraw_challenge(uuid) from public, anon;
grant execute on function public.cancel_challenge(uuid) to authenticated;
grant execute on function public.withdraw_challenge(uuid) to authenticated;

create or replace function public.purchase_shop_item(p_item_id uuid)
returns public.shop_purchases
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_item public.shop_items%rowtype;
  v_balance bigint;
  v_purchase public.shop_purchases%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Je moet ingelogd zijn om een beloning te kopen.';
  end if;

  select * into v_item
  from public.shop_items
  where id = p_item_id
  for update;

  if not found then
    raise exception 'Deze beloning is niet meer beschikbaar.';
  end if;

  if v_item.created_by = auth.uid() then
    raise exception 'Je kunt je eigen beloning niet kopen.';
  end if;

  perform 1
  from public.group_members gm
  where gm.group_id = v_item.group_id and gm.user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Je bent geen lid van deze groep.';
  end if;

  if v_item.stock < 1 then
    raise exception 'Deze beloning is uitverkocht.';
  end if;

  v_balance := public.wallet_balance(auth.uid(), v_item.group_id);
  if v_balance < v_item.price then
    raise exception 'Je hebt niet genoeg punten voor deze beloning.';
  end if;

  update public.shop_items
  set stock = stock - 1
  where id = v_item.id;

  insert into public.shop_purchases (group_id, item_id, buyer_id, seller_id, price)
  values (v_item.group_id, v_item.id, auth.uid(), v_item.created_by, v_item.price)
  returning * into v_purchase;

  return v_purchase;
end;
$$;

revoke all on function public.purchase_shop_item(uuid) from public, anon;
grant execute on function public.purchase_shop_item(uuid) to authenticated;

create or replace function public.spin_roulette(p_group_id uuid, p_bets jsonb)
returns public.roulette_spins
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_bet jsonb;
  v_type text;
  v_value integer;
  v_stake bigint;
  v_total_stake bigint := 0;
  v_payout bigint := 0;
  v_multiplier integer;
  v_winning_number integer;
  v_wins boolean;
  v_balance bigint;
  v_clean_bets jsonb := '[]'::jsonb;
  v_spin public.roulette_spins%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Je moet ingelogd zijn om roulette te spelen.';
  end if;

  if jsonb_typeof(p_bets) is distinct from 'array' then
    raise exception 'Plaats minimaal één geldige roulette-inzet.';
  end if;
  if jsonb_array_length(p_bets) < 1 or jsonb_array_length(p_bets) > 100 then
    raise exception 'Plaats minimaal één en maximaal 100 inzetten.';
  end if;

  perform 1
  from public.group_members gm
  where gm.group_id = p_group_id and gm.user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Je bent geen lid van deze groep.';
  end if;

  v_balance := public.wallet_balance(auth.uid(), p_group_id);
  v_winning_number := floor(random() * 37)::integer;

  for v_bet in select value from jsonb_array_elements(p_bets)
  loop
    if jsonb_typeof(v_bet) is distinct from 'object' then
      raise exception 'Deze roulette-inzet is ongeldig.';
    end if;

    v_type := v_bet ->> 'type';
    if v_type is null or v_type not in (
      'number', 'red', 'black', 'even', 'odd', 'low', 'high',
      'dozen1', 'dozen2', 'dozen3', 'column1', 'column2', 'column3'
    ) then
      raise exception 'Deze roulette-inzet is ongeldig.';
    end if;

    if coalesce(v_bet ->> 'stake', '') !~ '^[0-9]+$' then
      raise exception 'Elke inzet moet een heel aantal punten zijn.';
    end if;
    v_stake := (v_bet ->> 'stake')::bigint;
    if v_stake < 1 then
      raise exception 'Elke inzet moet minimaal 1 punt zijn.';
    end if;

    if v_type = 'number' then
      if coalesce(v_bet ->> 'value', '') !~ '^(0|[1-9]|[12][0-9]|3[0-6])$' then
        raise exception 'Kies voor een nummerinzet een getal van 0 tot en met 36.';
      end if;
      v_value := (v_bet ->> 'value')::integer;
    else
      v_value := null;
    end if;

    v_total_stake := v_total_stake + v_stake;
    v_clean_bets := v_clean_bets || jsonb_build_array(
      jsonb_build_object('type', v_type, 'stake', v_stake)
      || case when v_type = 'number' then jsonb_build_object('value', v_value) else '{}'::jsonb end
    );

    v_multiplier := case
      when v_type = 'number' then 36
      when v_type in ('dozen1', 'dozen2', 'dozen3', 'column1', 'column2', 'column3') then 3
      else 2
    end;

    v_wins := case
      when v_type = 'number' then v_winning_number = v_value
      when v_type = 'red' then v_winning_number = any(array[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36])
      when v_type = 'black' then v_winning_number between 1 and 36
        and not (v_winning_number = any(array[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]))
      when v_type = 'even' then v_winning_number > 0 and mod(v_winning_number, 2) = 0
      when v_type = 'odd' then mod(v_winning_number, 2) = 1
      when v_type = 'low' then v_winning_number between 1 and 18
      when v_type = 'high' then v_winning_number between 19 and 36
      when v_type = 'dozen1' then v_winning_number between 1 and 12
      when v_type = 'dozen2' then v_winning_number between 13 and 24
      when v_type = 'dozen3' then v_winning_number between 25 and 36
      when v_type = 'column1' then v_winning_number > 0 and mod(v_winning_number, 3) = 1
      when v_type = 'column2' then v_winning_number > 0 and mod(v_winning_number, 3) = 2
      when v_type = 'column3' then v_winning_number > 0 and mod(v_winning_number, 3) = 0
      else false
    end;

    if v_wins then
      v_payout := v_payout + v_stake * v_multiplier;
    end if;
  end loop;

  if v_total_stake > v_balance then
    raise exception 'Je hebt niet genoeg punten voor deze totale inzet.';
  end if;

  insert into public.roulette_spins (group_id, user_id, bets, winning_number, stake, payout)
  values (p_group_id, auth.uid(), v_clean_bets, v_winning_number, v_total_stake, v_payout)
  returning * into v_spin;

  return v_spin;
end;
$$;

revoke all on function public.spin_roulette(uuid, jsonb) from public, anon;
grant execute on function public.spin_roulette(uuid, jsonb) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shop_items'
    ) then
      alter publication supabase_realtime add table public.shop_items;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shop_purchases'
    ) then
      alter publication supabase_realtime add table public.shop_purchases;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'challenge_funds'
    ) then
      alter publication supabase_realtime add table public.challenge_funds;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'challenge_awards'
    ) then
      alter publication supabase_realtime add table public.challenge_awards;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'daily_challenge_bonuses'
    ) then
      alter publication supabase_realtime add table public.daily_challenge_bonuses;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'roulette_spins'
    ) then
      alter publication supabase_realtime add table public.roulette_spins;
    end if;
  end if;
end;
$$;
