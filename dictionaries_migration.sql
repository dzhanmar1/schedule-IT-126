-- Create dictionaries tables: teachers, subjects, auditoriums

CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.auditoriums (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    building TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoriums ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view teachers" ON public.teachers;
    DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;
    
    DROP POLICY IF EXISTS "Anyone can view subjects" ON public.subjects;
    DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;
    
    DROP POLICY IF EXISTS "Anyone can view auditoriums" ON public.auditoriums;
    DROP POLICY IF EXISTS "Admins can manage auditoriums" ON public.auditoriums;
END $$;

-- Select policies (viewable by everyone)
CREATE POLICY "Anyone can view teachers" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Anyone can view auditoriums" ON public.auditoriums FOR SELECT USING (true);

-- Admin management policies
CREATE POLICY "Admins can manage teachers" ON public.teachers 
    FOR ALL 
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can manage subjects" ON public.subjects 
    FOR ALL 
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can manage auditoriums" ON public.auditoriums 
    FOR ALL 
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');
