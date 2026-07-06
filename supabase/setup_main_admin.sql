-- ============================================================
-- Star Progress — Bootstrap Main Admin (Sara.admin)
-- Run in: Supabase Dashboard → SQL Editor → New Query
--
-- Safe to run multiple times. Handles both old and new Supabase
-- schema versions automatically.
-- ============================================================

DO $$
DECLARE
  v_id    uuid;
  v_email text := 'admin@starprogress.demo';
BEGIN

  -- ── Step 1: find or create auth user ──────────────────────────────────────
  SELECT id INTO v_id FROM auth.users WHERE email = v_email LIMIT 1;

  IF v_id IS NULL THEN
    v_id := gen_random_uuid();

    -- Try inserting with instance_id (older Supabase versions require it)
    BEGIN
      INSERT INTO auth.users (
        id, instance_id, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        is_super_admin, role, aud
      ) VALUES (
        v_id,
        '00000000-0000-0000-0000-000000000000'::uuid,
        v_email,
        crypt('MainAdmin@2026', gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}',
        '{"username":"Sara.admin","name":"Sara","role":"main_admin"}',
        false, 'authenticated', 'authenticated'
      );
    EXCEPTION WHEN undefined_column THEN
      -- Newer Supabase: instance_id column no longer exists
      INSERT INTO auth.users (
        id, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        is_super_admin, role, aud
      ) VALUES (
        v_id,
        v_email,
        crypt('MainAdmin@2026', gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}',
        '{"username":"Sara.admin","name":"Sara","role":"main_admin"}',
        false, 'authenticated', 'authenticated'
      );
    END;

    RAISE NOTICE 'Auth user created: % (id=%)', v_email, v_id;

    -- ── Step 2: create identity row (required for email+password login) ──────
    -- Try newer Supabase schema first (has provider_id text column)
    BEGIN
      INSERT INTO auth.identities (
        provider_id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) VALUES (
        v_id::text, v_id,
        jsonb_build_object(
          'sub',            v_id::text,
          'email',          v_email,
          'email_verified', true
        ),
        'email', now(), now(), now()
      )
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN undefined_column THEN
      -- Older Supabase schema: id column (uuid) instead of provider_id
      BEGIN
        INSERT INTO auth.identities (
          id, user_id, identity_data, provider,
          last_sign_in_at, created_at, updated_at
        ) VALUES (
          v_id, v_id,
          jsonb_build_object(
            'sub',            v_id::text,
            'email',          v_email,
            'email_verified', true
          ),
          'email', now(), now(), now()
        )
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Identity insert skipped (will not affect login): %', SQLERRM;
      END;
    END;

  ELSE
    RAISE NOTICE 'Auth user already exists (id=%)', v_id;
  END IF;

  -- ── Step 3: upsert public profile ─────────────────────────────────────────
  INSERT INTO public.users (
    id, name, email, username,
    role, account_status, avatar_color, created_at
  ) VALUES (
    v_id, 'Sara', v_email, 'Sara.admin',
    'main_admin', 'active', 'bg-blue-500', now()
  )
  ON CONFLICT (id) DO UPDATE
    SET username       = 'Sara.admin',
        name           = 'Sara',
        role           = 'main_admin',
        account_status = 'active';

  RAISE NOTICE 'Profile ready: Sara.admin / main_admin / active';
  RAISE NOTICE '----------------------------------------------';
  RAISE NOTICE 'Login: username=Sara.admin  password=MainAdmin@2026';
  RAISE NOTICE '----------------------------------------------';

END $$;


-- ============================================================
-- Install the bootstrap RPC so the app self-heals on startup
-- ============================================================

CREATE OR REPLACE FUNCTION public.bootstrap_main_admin()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_id    uuid;
  v_email text := 'admin@starprogress.demo';
  v_exist uuid;
BEGIN
  SELECT id INTO v_exist FROM public.users WHERE role = 'main_admin' LIMIT 1;
  IF v_exist IS NOT NULL THEN RETURN 'exists'; END IF;

  SELECT id INTO v_id FROM auth.users WHERE email = v_email LIMIT 1;

  IF v_id IS NULL THEN
    v_id := gen_random_uuid();

    BEGIN
      INSERT INTO auth.users (
        id, instance_id, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        is_super_admin, role, aud
      ) VALUES (
        v_id, '00000000-0000-0000-0000-000000000000'::uuid, v_email,
        crypt('MainAdmin@2026', gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}',
        '{"username":"Sara.admin","name":"Sara","role":"main_admin"}',
        false, 'authenticated', 'authenticated'
      );
    EXCEPTION WHEN undefined_column THEN
      INSERT INTO auth.users (
        id, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        is_super_admin, role, aud
      ) VALUES (
        v_id, v_email, crypt('MainAdmin@2026', gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}',
        '{"username":"Sara.admin","name":"Sara","role":"main_admin"}',
        false, 'authenticated', 'authenticated'
      );
    END;

    BEGIN
      INSERT INTO auth.identities (
        provider_id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) VALUES (
        v_id::text, v_id,
        jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
        'email', now(), now(), now()
      ) ON CONFLICT DO NOTHING;
    EXCEPTION WHEN undefined_column THEN
      BEGIN
        INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
        VALUES (v_id, v_id, jsonb_build_object('sub', v_id::text, 'email', v_email), 'email', now(), now(), now())
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END;
  END IF;

  INSERT INTO public.users (id, name, email, username, role, account_status, avatar_color, created_at)
  VALUES (v_id, 'Sara', v_email, 'Sara.admin', 'main_admin', 'active', 'bg-blue-500', now())
  ON CONFLICT (id) DO UPDATE
    SET role = 'main_admin', account_status = 'active',
        username = 'Sara.admin', name = 'Sara';

  RETURN 'created';
END;
$$;

GRANT EXECUTE ON FUNCTION public.bootstrap_main_admin() TO anon, authenticated;
