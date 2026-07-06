-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Adds a trigger that notifies the main_admin when a new pending user signs up.
-- Required because a new participant (role=participant) cannot insert notifications
-- for other users via RLS, so the notification must be created server-side.

create or replace function public.notify_admin_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_id uuid;
begin
  select id into admin_id
  from public.users
  where role = 'main_admin'
  limit 1;

  if admin_id is not null then
    insert into public.notifications (user_id, type, message, is_read, created_at)
    values (
      admin_id,
      'new_signup',
      'New ' || NEW.role || ' account request from ' || NEW.name ||
        case when NEW.username is not null then ' (@' || NEW.username || ')' else '' end || '.',
      false,
      now()
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists on_new_pending_signup on public.users;
create trigger on_new_pending_signup
  after insert on public.users
  for each row
  when (NEW.account_status = 'pending')
  execute procedure public.notify_admin_on_signup();
