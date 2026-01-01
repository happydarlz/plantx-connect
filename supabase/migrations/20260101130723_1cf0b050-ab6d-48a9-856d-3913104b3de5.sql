-- Add caption column to stories table
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS caption text;