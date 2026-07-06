-- ============================================================
-- Star Progress — Bootstrap Main Admin
-- Run this ONCE in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
-- Creates Sara.admin as the Main Admin in both Supabase Auth and the
-- public.users profile table.  Safe to run multiple times:
--   • If the auth user exists  → skips auth insert, only fixes the profile.
--   • If the profile exists    → upserts role=main_admin, status=active.
-- ============================================================

DO $$
DECLARE
  v_user_id  uuid;
  v_email    text := 'admin@starprogress.demo';
  v_username text := 'Sara.admin';
  v_name     text := 'Sara';
  v_password text := 'MainAdmin@2026';
BEGIN

  -- ── Step 1: auth user ─────────────────────────────────────────────────────
  SELECT id INTO v_user_id
  FROM   auth.users
  WHERE  email = v_email
  LIMIT  1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('username', v_username, 'name', v_name, 'role', 'main_admin'),
      false, 'authenticated', 'authenticated'
    );

    -- Identity row (required for email+password sign-in)
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id,
      v_user_id,
      jsonb_build_object(
        'sub',            v_user_id::text,
        'email',          v_email,
        'email_verified', true
      ),
      'email',
      now(), now(), now()
    )
    ON CONFLICT (user_id, provider) DO NOTHING;

    RAISE NOTICE 'Auth user CREATED: % (%)', v_email, v_user_id;
  ELSE
    RAISE NOTICE 'Auth user already exists: % (%)', v_email, v_user_id;
  END IF;

  -- ── Step 2: public profile ────────────────────────────────────────────────
  INSERT INTO public.users (
    id, name, email, username,
    role, account_status, avatar_color, created_at
  ) VALUES (
    v_user_id, v_name, v_email, v_username,
    'main_admin', 'active', 'bg-blue-500', now()
  )
  ON CONFLICT (id) DO UPDATE
    SET username       = EXCLUDED.username,
        name           = EXCLUDED.name,
        role           = 'main_admin',
        account_status = 'active';

  RAISE NOTICE 'Profile upserted → username=%, role=main_admin, status=active', v_username;

END $$;


-- ============================================================
-- Also install the bootstrap_main_admin() RPC so the app can
-- call it automatically on startup (supabase.rpc('bootstrap_main_admin'))
-- ============================================================

CREATE OR REPLACE FUNCTION public.bootstrap_main_admin()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id  uuid;
  v_email    text := 'admin@starprogress.demo';
  v_username text := 'Sara.admin';
  v_name     text := 'Sara';
  v_password text := 'MainAdmin@2026';
  v_existing uuid;
BEGIN
  -- Bail out immediately if a main_admin already exists
  SELECT id INTO v_existing FROM public.users WHERE role = 'main_admin' LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN 'exists';
  END IF;

  -- Check / create auth user
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('username', v_username, 'name', v_name, 'role', 'main_admin'),
      false, 'authenticated', 'authenticated'
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
      'email',
      now(), now(), now()
    )
    ON CONFLICT (user_id, provider) DO NOTHING;
  END IF;

  -- Create profile
  INSERT INTO public.users (
    id, name, email, username,
    role, account_status, avatar_color, created_at
  ) VALUES (
    v_user_id, v_name, v_email, v_username,
    'main_admin', 'active', 'bg-blue-500', now()
  )
  ON CONFLICT (id) DO UPDATE
    SET role = 'main_admin', account_status = 'active',
        username = EXCLUDED.username, name = EXCLUDED.name;

  RETURN 'created';
END;
$$;

-- Allow the app (anon key) to call this function.
-- It is safe: creates main_admin ONLY when none exists.
GRANT EXECUTE ON FUNCTION public.bootstrap_main_admin() TO anon, authenticated;
