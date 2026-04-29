-- ==========================================================
-- GyaanHub Production Setup Script
-- Mumbai Region (South Asia)
-- ==========================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Modules Table
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    difficulty TEXT,
    icon TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Quizzes Table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    time_limit_minutes INTEGER DEFAULT 10,
    total_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT,
    option_d TEXT,
    correct_option TEXT NOT NULL,
    explanation TEXT,
    points INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Quiz Attempts Table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    score INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    time_taken_seconds INTEGER DEFAULT 0,
    tab_switches INTEGER DEFAULT 0,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Answers Table
CREATE TABLE IF NOT EXISTS public.answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option TEXT,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create Materials Table
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('pdf', 'video', 'ppt', 'pptx', 'doc', 'docx', 'link', 'pqqs')),
    url TEXT NOT NULL,
    thumbnail TEXT,
    price DECIMAL DEFAULT 0,
    module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    slides JSONB,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create Purchases Table
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    amount DECIMAL DEFAULT 0,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, material_id)
);

-- 9. Create ER Diagrams Table
CREATE TABLE IF NOT EXISTS public.er_diagrams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Diagram',
    nodes JSONB DEFAULT '[]'::JSONB,
    edges JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.er_diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- 11. Create Open Policies (For presentation stability)
CREATE POLICY "Public Access" ON public.users FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.modules FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.quizzes FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.questions FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.quiz_attempts FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.answers FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.materials FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.er_diagrams FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.purchases FOR ALL USING (true);

-- 12. Insert Default Teacher Account (Password: password123)
INSERT INTO public.users (id, username, email, password_hash, full_name, role)
VALUES ('8420d143-cf7f-4421-a083-2620864cbe2c', 'teacher', 'teacher@gyaanhub.com', '$2a$10$g0M25GR.pVDsiOp1g.jdnOn1Y400jdpfcE7dllIeeFuf.kBe4CBdW', 'Prof. Anil Sharma', 'teacher')
ON CONFLICT DO NOTHING;

-- 13. Insert Default Student Account (Password: password123)
INSERT INTO public.users (id, username, email, password_hash, full_name, role)
VALUES ('fc0001ad-853e-4a4f-8b8c-b65e8ef10432', 'student', 'student@student.edu', '$2a$10$g0M25GR.pVDsiOp1g.jdnOn1Y400jdpfcE7dllIeeFuf.kBe4CBdW', 'Rahul Kumar', 'student')
ON CONFLICT DO NOTHING;

-- 14. Insert Modules
INSERT INTO public.modules (id, title, description, content, category, difficulty, icon, created_by)
VALUES 
('b0754b49-593a-40da-ba4c-9a463a33efff', 'Introduction to DBMS', 'Learn the fundamentals of Database Management Systems.', '# Intro...', 'Fundamentals', 'beginner', '🗄️', '8420d143-cf7f-4421-a083-2620864cbe2c'),
('82910a96-074d-4059-b2f9-596dd466b99d', 'ER Diagrams', 'Master Entity-Relationship diagrams.', '# ER...', 'Data Modeling', 'beginner', '📊', '8420d143-cf7f-4421-a083-2620864cbe2c')
ON CONFLICT DO NOTHING;
