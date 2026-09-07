import pg from 'pg';

const connectionString = 'postgres://postgres:pLl0sZRSpmB7vHYL@db.qqjfiasxblsdgvaspjed.supabase.co:5432/postgres';

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false } // Required for Supabase
});

const sql = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users (Extending Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('student', 'starosta', 'admin', 'teacher')) DEFAULT 'student',
    group_id UUID, 
    subgroup INTEGER DEFAULT null,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Faculties
CREATE TABLE IF NOT EXISTS public.faculties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Groups
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    faculty_id UUID REFERENCES public.faculties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL DEFAULT uuid_generate_v4()::text,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add foreign key back to profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_group' AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT fk_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Lesson Templates
CREATE TABLE IF NOT EXISTS public.lesson_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7) NOT NULL,
    week_parity INTEGER CHECK (week_parity IN (1, 2)), 
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject TEXT NOT NULL,
    teacher TEXT,
    auditorium TEXT,
    type_tag TEXT,
    subgroup INTEGER, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Lesson Exceptions
CREATE TABLE IF NOT EXISTS public.lesson_exceptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    template_id UUID REFERENCES public.lesson_templates(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_cancelled BOOLEAN DEFAULT false,
    new_start_time TIME,
    new_end_time TIME,
    new_auditorium TEXT,
    new_teacher TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Group Homeworks
CREATE TABLE IF NOT EXISTS public.group_homeworks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    due_date DATE NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Personal Notes
CREATE TABLE IF NOT EXISTS public.personal_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, subject) 
);

-- RLS (Row Level Security) - Basic Setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_homeworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_notes ENABLE ROW LEVEL SECURITY;

-- Enable Realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_exceptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_homeworks;

-- Setup Policies (Drop if exists then create)

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    
    DROP POLICY IF EXISTS "Anyone can view faculties" ON public.faculties;
    DROP POLICY IF EXISTS "Anyone can view groups" ON public.groups;
    
    DROP POLICY IF EXISTS "Students view schedule" ON public.lesson_templates;
    DROP POLICY IF EXISTS "Starosta manage schedule" ON public.lesson_templates;
    
    DROP POLICY IF EXISTS "Students view exceptions" ON public.lesson_exceptions;
    DROP POLICY IF EXISTS "Starosta manage exceptions" ON public.lesson_exceptions;
    
    DROP POLICY IF EXISTS "Students view homeworks" ON public.group_homeworks;
    DROP POLICY IF EXISTS "Starosta manage homeworks" ON public.group_homeworks;
    
    DROP POLICY IF EXISTS "Users manage own notes" ON public.personal_notes;
END $$;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view faculties" ON public.faculties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view groups" ON public.groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Students view schedule" ON public.lesson_templates FOR SELECT TO authenticated USING (
    group_id IN (SELECT group_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Starosta manage schedule" ON public.lesson_templates FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('starosta', 'admin') AND group_id = lesson_templates.group_id)
);

CREATE POLICY "Students view exceptions" ON public.lesson_exceptions FOR SELECT TO authenticated USING (
    group_id IN (SELECT group_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Starosta manage exceptions" ON public.lesson_exceptions FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('starosta', 'admin') AND group_id = lesson_exceptions.group_id)
);

CREATE POLICY "Students view homeworks" ON public.group_homeworks FOR SELECT TO authenticated USING (
    group_id IN (SELECT group_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Starosta manage homeworks" ON public.group_homeworks FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('starosta', 'admin') AND group_id = group_homeworks.group_id)
);

CREATE POLICY "Users manage own notes" ON public.personal_notes FOR ALL TO authenticated USING (auth.uid() = user_id);

`;

async function run() {
  try {
    console.log("Running migrations...");
    await pool.query(sql);
    console.log("Migrations successfully applied!");
  } catch (e) {
    console.error("Migration failed:", e);
  } finally {
    await pool.end();
  }
}

run();
