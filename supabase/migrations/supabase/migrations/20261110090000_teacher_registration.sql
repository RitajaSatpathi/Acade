-- Link each self-registered teacher to their selected sections.
CREATE TABLE IF NOT EXISTS public.teacher_section_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (teacher_id, section_id)
);

ALTER TABLE public.teacher_section_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teacher_sections_select_own_or_admin"
  ON public.teacher_section_assignments;

CREATE POLICY "teacher_sections_select_own_or_admin"
  ON public.teacher_section_assignments
  FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_teacher_section_assignments_teacher
  ON public.teacher_section_assignments(teacher_id);

CREATE INDEX IF NOT EXISTS idx_teacher_section_assignments_section
  ON public.teacher_section_assignments(section_id);

-- Signup must not permit a user to create an admin profile directly.
-- The signup trigger below runs as its function owner.
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND role IN ('student', 'teacher')
  );

-- Prevent an account from changing its own role after signup.
CREATE OR REPLACE FUNCTION public.prevent_self_role_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = OLD.id AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'You cannot change your own account role.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_self_role_change
  ON public.profiles;

CREATE TRIGGER profiles_prevent_self_role_change
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_change();

-- Create the public profile and role-specific profile when Supabase Auth
-- creates a user. Admin registration is intentionally excluded.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  signup_role text;
  selected_section_ids jsonb;
  expected_section_count integer;
  assigned_section_count integer;
BEGIN
  signup_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');

  IF signup_role NOT IN ('student', 'teacher') THEN
    RAISE EXCEPTION 'Only student and teacher signup is permitted.';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
      'New User'
    ),
    signup_role
  )
  ON CONFLICT (id) DO NOTHING;

  IF signup_role = 'student' THEN
    INSERT INTO public.student_profiles (
      user_id,
      roll_number,
      department,
      academic_year,
      semester,
      section,
      interests
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'roll_number',
      NEW.raw_user_meta_data->>'department',
      NEW.raw_user_meta_data->>'academic_year',
      (NEW.raw_user_meta_data->>'semester')::integer,
      NEW.raw_user_meta_data->>'section',
      NULLIF(NEW.raw_user_meta_data->>'interests', '')
    )
    ON CONFLICT (user_id) DO NOTHING;

  ELSE
    IF NULLIF(trim(NEW.raw_user_meta_data->>'department'), '') IS NULL
       OR NULLIF(trim(NEW.raw_user_meta_data->>'academic_year'), '') IS NULL THEN
      RAISE EXCEPTION 'Teacher department and academic year are required.';
    END IF;

    INSERT INTO public.teacher_profiles (user_id, department, bio)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'department',
      NULLIF(NEW.raw_user_meta_data->>'bio', '')
    )
    ON CONFLICT (user_id) DO NOTHING;

    selected_section_ids := NEW.raw_user_meta_data->'section_ids';

    IF selected_section_ids IS NULL
       OR jsonb_typeof(selected_section_ids) <> 'array' THEN
      RAISE EXCEPTION 'Teacher signup must include selected sections.';
    END IF;

    SELECT COUNT(DISTINCT value::uuid)
    INTO expected_section_count
    FROM jsonb_array_elements_text(selected_section_ids) AS selected(value);

    IF expected_section_count = 0 THEN
      RAISE EXCEPTION 'Select at least one section.';
    END IF;

    INSERT INTO public.teacher_section_assignments (teacher_id, section_id)
    SELECT NEW.id, s.id
    FROM public.sections s
    WHERE s.active = true
      AND s.department = NEW.raw_user_meta_data->>'department'
      AND s.academic_year = NEW.raw_user_meta_data->>'academic_year'
      AND s.id IN (
        SELECT value::uuid
        FROM jsonb_array_elements_text(selected_section_ids) AS selected(value)
      )
    ON CONFLICT (teacher_id, section_id) DO NOTHING;

    SELECT COUNT(DISTINCT s.id)
    INTO assigned_section_count
    FROM public.sections s
    WHERE s.active = true
      AND s.department = NEW.raw_user_meta_data->>'department'
      AND s.academic_year = NEW.raw_user_meta_data->>'academic_year'
      AND s.id IN (
        SELECT value::uuid
        FROM jsonb_array_elements_text(selected_section_ids) AS selected(value)
      );

    IF assigned_section_count <> expected_section_count THEN
      RAISE EXCEPTION
        'One or more selected sections are unavailable for this department and academic year.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
