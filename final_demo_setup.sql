-- ==========================================================
-- GyaanHub Final Demo Setup Script
-- Adds YouTube Videos, PPT Slides, and Quizzes
-- ==========================================================

BEGIN;

-- 1. Restore/Upsert Modules
INSERT INTO public.modules (id, title, description, content, category, difficulty, icon, created_by, created_at) VALUES 
(E'b0754b49-593a-40da-ba4c-9a463a33efff', E'Introduction to DBMS', E'Learn the fundamentals of Database Management Systems.', E'# Introduction to DBMS\n\n## What is a DBMS?\nA **Database Management System** is software designed to manage and organize data.\n\n## ACID Properties\n- **Atomicity**: All or nothing\n- **Consistency**: Valid state to valid state\n- **Isolation**: No interference\n- **Durability**: Changes persist', E'Fundamentals', E'beginner', E'🗄️', E'8420d143-cf7f-4421-a083-2620864cbe2c', E'2026-04-14T06:38:20.422Z'),
(E'82910a96-074d-4059-b2f9-596dd466b99d', E'ER Diagrams', E'Master Entity-Relationship diagrams and data modeling.', E'# ER Diagrams\n\n## Components\n- **Rectangle**: Entity\n- **Ellipse**: Attribute\n- **Diamond**: Relationship\n- **Double Line**: Total Participation', E'Data Modeling', E'beginner', E'📊', E'8420d143-cf7f-4421-a083-2620864cbe2c', E'2026-04-14T06:38:20.422Z'),
(E'bc0bc089-25a5-4c9c-9aec-05078b2cb778', E'SQL Fundamentals', E'Learn SQL from basics to advanced joins.', E'# SQL Basics\n\n## Command Types\n- **DDL**: CREATE, ALTER, DROP\n- **DML**: SELECT, INSERT, UPDATE, DELETE\n- **DCL**: GRANT, REVOKE', E'SQL', E'beginner', E'💻', E'8420d143-cf7f-4421-a083-2620864cbe2c', E'2026-04-14T06:38:20.422Z')
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    content = EXCLUDED.content;

-- 2. Add Video Lectures (YouTube Embeds)
INSERT INTO public.materials (id, title, description, type, url, thumbnail, module_id, created_by, created_at) VALUES 
(E'vid-dbms-intro', E'DBMS Complete Course — Introduction', E'Full introduction to DBMS covering architecture and data models.', E'video', E'https://www.youtube.com/embed/kBdlM6hNDAE', E'https://img.youtube.com/vi/kBdlM6hNDAE/maxresdefault.jpg', E'b0754b49-593a-40da-ba4c-9a463a33efff', E'8420d143-cf7f-4421-a083-2620864cbe2c', now()),
(E'vid-er-tutorial', E'ER Diagram Tutorial — Step by Step', E'Complete guide to creating ER diagrams with real examples.', E'video', E'https://www.youtube.com/embed/QpdhBUYk7Kk', E'https://img.youtube.com/vi/QpdhBUYk7Kk/maxresdefault.jpg', E'82910a96-074d-4059-b2f9-596dd466b99d', E'8420d143-cf7f-4421-a083-2620864cbe2c', now()),
(E'vid-sql-joins', E'SQL Joins Visualized', E'Interactive visual guide to Inner, Left, Right, and Full joins.', E'video', E'https://www.youtube.com/embed/9yeOJ0ZMUYw', E'https://img.youtube.com/vi/9yeOJ0ZMUYw/maxresdefault.jpg', E'bc0bc089-25a5-4c9c-9aec-05078b2cb778', E'8420d143-cf7f-4421-a083-2620864cbe2c', now())
ON CONFLICT (id) DO NOTHING;

-- 3. Add PPT Slides (Interactive Viewer)
INSERT INTO public.materials (id, title, description, type, url, module_id, created_by, created_at) VALUES 
(E'ppt-dbms-slides', E'Introduction to DBMS — Lecture Slides', E'Comprehensive slides covering architecture and data independence.', E'ppt', E'#', E'b0754b49-593a-40da-ba4c-9a463a33efff', E'8420d143-cf7f-4421-a083-2620864cbe2c', now()),
(E'ppt-er-slides', E'ER Model & Diagrams — Masterclass', E'Detailed slides on entity sets, attributes, and participation.', E'ppt', E'#', E'82910a96-074d-4059-b2f9-596dd466b99d', E'8420d143-cf7f-4421-a083-2620864cbe2c', now())
ON CONFLICT (id) DO NOTHING;

-- 4. Restore Quizzes
INSERT INTO public.quizzes (id, title, description, module_id, time_limit_minutes, total_points, is_active, created_by, created_at) VALUES 
(E'c032f310-b0da-4f63-a404-39d6042a6f7b', E'DBMS Fundamentals Quiz', E'Test your knowledge of basic DBMS concepts.', E'b0754b49-593a-40da-ba4c-9a463a33efff', 10, 10, true, E'8420d143-cf7f-4421-a083-2620864cbe2c', now()),
(E'ec7061a8-509d-4dde-adbc-cbbd11740a91', E'SQL Basics Quiz', E'Test your SQL knowledge — DDL and DML.', E'bc0bc089-25a5-4c9c-9aec-05078b2cb778', 15, 10, true, E'8420d143-cf7f-4421-a083-2620864cbe2c', now())
ON CONFLICT (id) DO NOTHING;

-- 5. Add Sample Questions
INSERT INTO public.questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, points, sort_order) VALUES 
(E'q1-dbms', E'c032f310-b0da-4f63-a404-39d6042a6f7b', E'What does DBMS stand for?', E'Database Management System', E'Data Basic Management System', E'Database Machine System', E'None', E'A', E'DBMS = Database Management System.', 1, 1),
(E'q2-sql', E'ec7061a8-509d-4dde-adbc-cbbd11740a91', E'Which SQL command creates a table?', E'NEW TABLE', E'CREATE TABLE', E'ADD TABLE', E'MAKE TABLE', E'B', E'CREATE TABLE is the DDL command.', 1, 1)
ON CONFLICT (id) DO NOTHING;

COMMIT;
