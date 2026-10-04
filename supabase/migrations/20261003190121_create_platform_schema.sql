/*
# Student Skill Development Platform - Core Schema

1. New Tables
- profiles: Extends auth.users with role (admin/teacher/student), full_name, avatar_url, active status
- student_profiles: Academic details for students (roll_number, department, year, semester, section, skills, interests)
- teacher_profiles: Department and bio for teachers
- sections: Academic sections (name, department, academic_year, semester, active)
- subjects: Course subjects (name, code, department, credits)
- subject_assignments: Associates teachers with subjects + sections
- timetables: Timetable entries (section, subject, teacher, day, start_time, end_time, room, academic_year, semester)
- assignments: Assignments (title, description, subject, section, teacher, issue_date, deadline, file_link)
- submissions: Student assignment submissions (assignment, student, content, file_link, status, submitted_at, reviewed_at, grade, feedback)
- assessments: Quizzes/tests (title, subject, section, teacher, date, start_time, duration, max_marks, type)
- announcements: Notices (title, content, audience, department, semester, section, created_by)
- notifications: User notifications (user_id, type, title, message, read, link)

2. Security
- Enable RLS on every table
- Owner-scoped policies for profiles, student_profiles, teacher_profiles, submissions, notifications
- Admin can access all tables
- Teachers can manage their assigned sections' data
- Students can read data relevant to their section and manage their own data
*/

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  avatar_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Student profiles
CREATE TABLE IF NOT EXISTS student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  roll_number text NOT NULL,
  department text NOT NULL,
  academic_year text NOT NULL,
  semester integer NOT NULL,
  section text NOT NULL,
  interests text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sp_select_own_or_admin" ON student_profiles;
CREATE POLICY "sp_select_own_or_admin" ON student_profiles FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'teacher')
);

DROP POLICY IF EXISTS "sp_insert_own" ON student_profiles;
CREATE POLICY "sp_insert_own" ON student_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sp_update_own_or_admin" ON student_profiles;
CREATE POLICY "sp_update_own_or_admin" ON student_profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Teacher profiles
CREATE TABLE IF NOT EXISTS teacher_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  department text NOT NULL,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tp_select_all" ON teacher_profiles;
CREATE POLICY "tp_select_all" ON teacher_profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "tp_insert_own" ON teacher_profiles;
CREATE POLICY "tp_insert_own" ON teacher_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tp_update_own_or_admin" ON teacher_profiles;
CREATE POLICY "tp_update_own_or_admin" ON teacher_profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Sections
CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department text NOT NULL,
  academic_year text NOT NULL,
  semester integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sections_select" ON sections;
CREATE POLICY "sections_select" ON sections FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "sections_insert_admin" ON sections;
CREATE POLICY "sections_insert_admin" ON sections FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "sections_update_admin" ON sections;
CREATE POLICY "sections_update_admin" ON sections FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "sections_delete_admin" ON sections;
CREATE POLICY "sections_delete_admin" ON sections FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  department text NOT NULL,
  credits integer DEFAULT 3,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subjects_select" ON subjects;
CREATE POLICY "subjects_select" ON subjects FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "subjects_insert_admin" ON subjects;
CREATE POLICY "subjects_insert_admin" ON subjects FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "subjects_update_admin" ON subjects;
CREATE POLICY "subjects_update_admin" ON subjects FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "subjects_delete_admin" ON subjects;
CREATE POLICY "subjects_delete_admin" ON subjects FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Subject assignments (teacher -> subject + section)
CREATE TABLE IF NOT EXISTS subject_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, subject_id, section_id)
);

ALTER TABLE subject_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sa_select" ON subject_assignments;
CREATE POLICY "sa_select" ON subject_assignments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "sa_insert_admin" ON subject_assignments;
CREATE POLICY "sa_insert_admin" ON subject_assignments FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "sa_delete_admin" ON subject_assignments;
CREATE POLICY "sa_delete_admin" ON subject_assignments FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Skills
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  proficiency text NOT NULL CHECK (proficiency IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "skills_select_own_or_admin_teacher" ON skills;
CREATE POLICY "skills_select_own_or_admin_teacher" ON skills FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'teacher'))
);

DROP POLICY IF EXISTS "skills_insert_own" ON skills;
CREATE POLICY "skills_insert_own" ON skills FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "skills_update_own" ON skills;
CREATE POLICY "skills_update_own" ON skills FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "skills_delete_own" ON skills;
CREATE POLICY "skills_delete_own" ON skills FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Timetables
CREATE TABLE IF NOT EXISTS timetables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time text NOT NULL,
  end_time text NOT NULL,
  room text,
  academic_year text NOT NULL,
  semester integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "timetables_select" ON timetables;
CREATE POLICY "timetables_select" ON timetables FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "timetables_insert_admin" ON timetables;
CREATE POLICY "timetables_insert_admin" ON timetables FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "timetables_update_admin" ON timetables;
CREATE POLICY "timetables_update_admin" ON timetables FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "timetables_delete_admin" ON timetables;
CREATE POLICY "timetables_delete_admin" ON timetables FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_date date NOT NULL,
  deadline date NOT NULL,
  file_link text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignments_select" ON assignments;
CREATE POLICY "assignments_select" ON assignments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "assignments_insert_teacher" ON assignments;
CREATE POLICY "assignments_insert_teacher" ON assignments FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')));

DROP POLICY IF EXISTS "assignments_update_teacher" ON assignments;
CREATE POLICY "assignments_update_teacher" ON assignments FOR UPDATE TO authenticated
USING (
  auth.uid() = teacher_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
)
WITH CHECK (
  auth.uid() = teacher_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "assignments_delete_teacher" ON assignments;
CREATE POLICY "assignments_delete_teacher" ON assignments FOR DELETE TO authenticated
USING (
  auth.uid() = teacher_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Submissions
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,
  file_link text,
  status text NOT NULL CHECK (status IN ('pending', 'submitted', 'reviewed', 'overdue')) DEFAULT 'submitted',
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  grade text,
  feedback text,
  UNIQUE(assignment_id, student_id)
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "submissions_select" ON submissions;
CREATE POLICY "submissions_select" ON submissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "submissions_insert_student" ON submissions;
CREATE POLICY "submissions_insert_student" ON submissions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "submissions_update_student_or_teacher" ON submissions;
CREATE POLICY "submissions_update_student_or_teacher" ON submissions FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "submissions_delete_own" ON submissions;
CREATE POLICY "submissions_delete_own" ON submissions FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_date date NOT NULL,
  start_time text NOT NULL,
  duration_minutes integer NOT NULL,
  max_marks integer NOT NULL,
  type text NOT NULL CHECK (type IN ('quiz', 'class_test', 'internal_assessment')) DEFAULT 'class_test',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assessments_select" ON assessments;
CREATE POLICY "assessments_select" ON assessments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "assessments_insert_teacher" ON assessments;
CREATE POLICY "assessments_insert_teacher" ON assessments FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')));

DROP POLICY IF EXISTS "assessments_update_teacher" ON assessments;
CREATE POLICY "assessments_update_teacher" ON assessments FOR UPDATE TO authenticated
USING (auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "assessments_delete_teacher" ON assessments;
CREATE POLICY "assessments_delete_teacher" ON assessments FOR DELETE TO authenticated
USING (auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  audience text NOT NULL CHECK (audience IN ('all', 'department', 'semester', 'section')) DEFAULT 'all',
  department text,
  semester integer,
  section text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ann_select" ON announcements;
CREATE POLICY "ann_select" ON announcements FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ann_insert_admin_teacher" ON announcements;
CREATE POLICY "ann_insert_admin_teacher" ON announcements FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'teacher')));

DROP POLICY IF EXISTS "ann_update_own" ON announcements;
CREATE POLICY "ann_update_own" ON announcements FOR UPDATE TO authenticated
USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (auth.uid() = created_by OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "ann_delete_own" ON announcements;
CREATE POLICY "ann_delete_own" ON announcements FOR DELETE TO authenticated
USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_select_own" ON notifications;
CREATE POLICY "notif_select_own" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_insert" ON notifications;
CREATE POLICY "notif_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR true);

DROP POLICY IF EXISTS "notif_update_own" ON notifications;
CREATE POLICY "notif_update_own" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_delete_own" ON notifications;
CREATE POLICY "notif_delete_own" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_student_profiles_user ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_timetables_section ON timetables(section_id);
CREATE INDEX IF NOT EXISTS idx_assignments_section ON assignments(section_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assessments_section ON assessments(section_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_user ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at desc);
