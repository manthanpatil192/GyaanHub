-- Add price column to materials and update type constraint
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS price DECIMAL DEFAULT 0;

-- Update the type check constraint
-- First drop existing if name is known, or just use a workaround
-- In Supabase/Postgres, we can drop and recreate the constraint
ALTER TABLE public.materials DROP CONSTRAINT IF EXISTS materials_type_check;
ALTER TABLE public.materials ADD CONSTRAINT materials_type_check CHECK (type IN ('pdf', 'video', 'ppt', 'pqqs'));

-- Create purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    amount DECIMAL DEFAULT 0,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, material_id)
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Allow students to see their own purchases
CREATE POLICY "Users can view their own purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);

-- Allow students to insert their own purchases (simplified for simulated payment)
CREATE POLICY "Users can insert their own purchases" ON public.purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add policy for materials to be visible if purchased or price is 0
-- This is complex to do with pure RLS without modifying the materials policy
-- We will handle visibility logic in the application layer for now to keep it simple
