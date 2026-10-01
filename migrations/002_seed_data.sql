-- ====================================================================
-- Hairdrama Tech Task Management - Optional Seed Data Migration
-- Migration: 002_seed_data.sql
-- Description: Provides sample tasks and helpful query views.
-- ====================================================================

-- Create a view for joined task details with creator and assignee information
CREATE OR REPLACE VIEW public.tasks_detailed_view AS
SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.due_date,
    t.created_at,
    t.updated_at,
    -- Creator profile
    t.created_by,
    creator.email AS creator_email,
    creator.full_name AS creator_name,
    creator.avatar_url AS creator_avatar,
    -- Assignee profile
    t.assigned_to,
    assignee.email AS assignee_email,
    assignee.full_name AS assignee_name,
    assignee.avatar_url AS assignee_avatar
FROM public.tasks t
LEFT JOIN public.profiles creator ON t.created_by = creator.id
LEFT JOIN public.profiles assignee ON t.assigned_to = assignee.id;

-- Seed documentation:
-- To insert demo tasks after logging in with your Google account in Supabase:
-- 1. Grab your profile ID: SELECT id FROM public.profiles WHERE email = 'your.email@gmail.com';
-- 2. INSERT INTO public.tasks (title, description, status, priority, due_date, created_by, assigned_to)
--    VALUES ('Review Hairdrama Brand Guidelines', 'Review brand identity and styling documentation', 'pending', 'high', CURRENT_DATE + INTERVAL '3 days', '<YOUR_PROFILE_ID>', '<YOUR_PROFILE_ID>');
