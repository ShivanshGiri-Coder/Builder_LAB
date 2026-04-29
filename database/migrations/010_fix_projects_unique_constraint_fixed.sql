-- Fix projects table unique constraint
-- Users should be able to have multiple projects, not just one

-- Drop the incorrect unique constraint on user_id
DO $$
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'projects_user_id_unique' 
        AND table_schema = 'public'
        AND table_name = 'projects'
    ) THEN
        ALTER TABLE projects DROP CONSTRAINT projects_user_id_unique;
        RAISE NOTICE 'Dropped projects_user_id_unique constraint';
    END IF;
END $$;

-- Add proper indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- RLS policies for projects table (if not already enabled)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own projects" ON projects;
    DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
    DROP POLICY IF EXISTS "Users can update own projects" ON projects;
    DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
EXCEPTION WHEN undefined_object THEN
    -- Policies don't exist, which is fine
    NULL;
END $$;

-- Create RLS policies for projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

RAISE NOTICE 'Fixed projects table constraints and policies';
