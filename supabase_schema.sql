
-- CodeNexus | Relational Database Schema
-- Optimized for Supabase with Auto-UUID generation

-- 1. ENUMS & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'STUDENT');
    CREATE TYPE block_type AS ENUM ('VIDEO', 'PDF');
    CREATE TYPE difficulty_level AS ENUM ('EASY', 'MEDIUM', 'HARD');
    CREATE TYPE platform_type AS ENUM ('LeetCode', 'GeeksforGeeks');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. CORE TABLES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT, 
    role user_role DEFAULT 'STUDENT',
    points INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'Terminal',
    is_visible BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_visible BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS content_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    type block_type NOT NULL,
    title TEXT NOT NULL,
    url TEXT,
    is_visible BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS coding_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    difficulty difficulty_level DEFAULT 'EASY',
    points INTEGER DEFAULT 10,
    platform platform_type DEFAULT 'LeetCode',
    external_link TEXT,
    order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS daily_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_challenge_questions (
    challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE,
    question_id UUID REFERENCES coding_questions(id) ON DELETE CASCADE,
    PRIMARY KEY (challenge_id, question_id)
);

CREATE TABLE IF NOT EXISTS user_progress (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    completed_block_ids UUID[] DEFAULT '{}',
    completed_question_ids UUID[] DEFAULT '{}',
    completed_module_ids UUID[] DEFAULT '{}',
    completed_dates DATE[] DEFAULT '{}',
    earned_badge_ids TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS POLICIES (OPEN FOR ANON ROLE)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Unrestricted Profiles" ON profiles FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);

ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Unrestricted Tracks" ON tracks FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Unrestricted Modules" ON modules FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);

ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Unrestricted Blocks" ON content_blocks FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);

ALTER TABLE coding_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Unrestricted Questions" ON coding_questions FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);

ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Unrestricted Daily Challenges" ON daily_challenges FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);

ALTER TABLE daily_challenge_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Unrestricted Daily Question Junction" ON daily_challenge_questions FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Unrestricted Progress" ON user_progress FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);

-- 4. THE MASTER SYNC FUNCTION
CREATE OR REPLACE FUNCTION upsert_full_track(p_track jsonb) 
RETURNS void AS $$
DECLARE
    v_track_id UUID;
    v_module jsonb;
    v_block jsonb;
    v_question jsonb;
    v_mod_id UUID;
    v_module_ids UUID[] := '{}';
BEGIN
    v_track_id := (p_track->>'id')::uuid;

    -- 1. Sync Track Info
    INSERT INTO tracks (id, title, description, icon, is_visible)
    VALUES (v_track_id, p_track->>'title', p_track->>'description', p_track->>'icon', (p_track->>'isVisible')::boolean)
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        is_visible = EXCLUDED.is_visible;

    -- Collect IDs to prevent accidental deletion during update
    FOR v_module IN SELECT * FROM jsonb_array_elements(p_track->'modules') LOOP
        v_module_ids := array_append(v_module_ids, (v_module->>'id')::uuid);
    END LOOP;

    -- 2. Remove Modules no longer present in UI
    DELETE FROM modules WHERE track_id = v_track_id AND NOT (id = ANY(v_module_ids));

    -- 3. Sync Modules and their nested children
    FOR v_module IN SELECT * FROM jsonb_array_elements(p_track->'modules') LOOP
        v_mod_id := (v_module->>'id')::uuid;
        
        INSERT INTO modules (id, track_id, title, description, is_visible)
        VALUES (v_mod_id, v_track_id, v_module->>'title', v_module->>'description', (v_module->>'isVisible')::boolean)
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            is_visible = EXCLUDED.is_visible;

        -- Clean sync for children (Blocks & Questions)
        DELETE FROM content_blocks WHERE module_id = v_mod_id;
        DELETE FROM coding_questions WHERE module_id = v_mod_id;

        -- Insert Blocks
        FOR v_block IN SELECT * FROM jsonb_array_elements(v_module->'contentBlocks') LOOP
            INSERT INTO content_blocks (id, module_id, type, title, url, is_visible)
            VALUES (COALESCE((v_block->>'id')::uuid, gen_random_uuid()), v_mod_id, (v_block->>'type')::block_type, v_block->>'title', v_block->>'url', (v_block->>'isVisible')::boolean);
        END LOOP;

        -- Insert Questions
        FOR v_question IN SELECT * FROM jsonb_array_elements(v_module->'problems') LOOP
            INSERT INTO coding_questions (id, module_id, title, description, difficulty, points, platform, external_link)
            VALUES (COALESCE((v_question->>'id')::uuid, gen_random_uuid()), v_mod_id, v_question->>'title', v_question->>'description', (v_question->>'difficulty')::difficulty_level, (v_question->>'points')::int, (v_question->>'platform')::platform_type, v_question->>'external_link');
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
