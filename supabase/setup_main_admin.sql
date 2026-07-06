-- ============================================================
-- Star Progress — Bootstrap Main Admin
-- Run in: Supabase Dashboard → SQL Editor → New Query
--
-- The real main admin (Mainadmin / sara.alkhalifa288@gmail.com)
-- was created through the app's normal signup flow and promoted
-- via SQL. This script installs the bootstrap_main_admin() RPC
-- which the app calls on startup to ensure a main_admin exists.
--
-- The RPC is a no-op when a main_admin already exists (returns 'exists').
-- It only creates a fallback demo admin if the table is completely empty.
-- ============================================================


-- ============================================================
-- Install the bootstrap RPC (called from App.tsx on startup)
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
  -- If any main_admin exists, do nothing
  SELECT id INTO v_exist FROM public.users WHERE role = 'main_admin' LIMIT 1;
  IF v_exist IS NOT NULL THEN RETURN 'exists'; END IF;

  -- Fallback: create a demo admin only if no main_admin exists at all
  SELECT id INTO v_id FROM auth.users WHERE email = v_email LIMIT 1;

  IF v_id IS NULL THEN
    v_id := gen_random_uuid();

    BEGIN
      INSERT INTO auth.users (
        id, instance_id, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        is_super_admin, role, aud,
        confirmation_token, recovery_token,
        email_change_token_new, email_change, is_sso_user
      ) VALUES (
        v_id, '00000000-0000-0000-0000-000000000000'::uuid, v_email,
        crypt('MainAdmin@2026', gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}',
        '{"username":"Sara.admin","name":"Sara","role":"main_admin"}',
        false, 'authenticated', 'authenticated',
        '', '', '', '', false
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
