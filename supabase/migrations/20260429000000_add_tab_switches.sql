-- Add tab_switches to quiz_attempts
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS tab_switches INTEGER DEFAULT 0;
