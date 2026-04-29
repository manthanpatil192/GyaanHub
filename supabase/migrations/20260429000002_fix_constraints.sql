-- Fix answers table to allow NULL selected_option (for skipped questions)
ALTER TABLE public.answers ALTER COLUMN selected_option DROP NOT NULL;

-- Fix materials table type constraint
ALTER TABLE public.materials DROP CONSTRAINT IF EXISTS materials_type_check;
ALTER TABLE public.materials ADD CONSTRAINT materials_type_check CHECK (type IN ('pdf', 'video', 'ppt', 'pptx', 'doc', 'docx', 'link'));

-- Ensure er_diagrams uses user_id instead of student_id if it exists with student_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'er_diagrams' AND column_name = 'student_id') THEN
        ALTER TABLE public.er_diagrams RENAME COLUMN student_id TO user_id;
    END IF;
END $$;
