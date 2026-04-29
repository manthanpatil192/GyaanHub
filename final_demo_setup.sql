-- ==========================================================
-- GyaanHub Final Demo Setup Script (PRECISE FIX)
-- Adds YouTube Videos, PPT Slides, and Quizzes
-- ==========================================================

BEGIN;

-- 1. Restore/Upsert Modules
INSERT INTO public.modules (id, title, description, content, category, difficulty, icon, created_by, created_at) VALUES 
('b0754b49-593a-40da-ba4c-9a463a33efff', 'Introduction to DBMS', 'Learn the fundamentals of Database Management Systems.', '# Introduction to DBMS\n\n## What is a DBMS?\nA **Database Management System** is software designed to manage and organize data.\n\n## ACID Properties\n- **Atomicity**: All or nothing\n- **Consistency**: Valid state to valid state\n- **Isolation**: No interference\n- **Durability**: Changes persist', 'Fundamentals', 'beginner', '🗄️', '8420d143-cf7f-4421-a083-2620864cbe2c', '2026-04-14T06:38:20.422Z'),
('82910a96-074d-4059-b2f9-596dd466b99d', 'ER Diagrams', 'Master Entity-Relationship diagrams and data modeling.', '# ER Diagrams\n\n## Components\n- **Rectangle**: Entity\n- **Ellipse**: Attribute\n- **Diamond**: Relationship\n- **Double Line**: Total Participation', 'Data Modeling', 'beginner', '📊', '8420d143-cf7f-4421-a083-2620864cbe2c', '2026-04-14T06:38:20.422Z'),
('bc0bc089-25a5-4c9c-9aec-05078b2cb778', 'SQL Fundamentals', 'Learn SQL from basics to advanced joins.', '# SQL Basics\n\n## Command Types\n- **DDL**: CREATE, ALTER, DROP\n- **DML**: SELECT, INSERT, UPDATE, DELETE\n- **DCL**: GRANT, REVOKE', 'SQL', 'beginner', '💻', '8420d143-cf7f-4421-a083-2620864cbe2c', '2026-04-14T06:38:20.422Z')
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    content = EXCLUDED.content;

-- 2. Add Video Lectures (YouTube Embeds)
INSERT INTO public.materials (id, title, description, type, url, thumbnail, price, module_id, slides, created_by, created_at) VALUES 
('d1f6b8e2-2ff2-48d3-8024-36ba7f9a7b50', 'DBMS Complete Course — Introduction', 'Full introduction to DBMS covering architecture and data models.', 'video', 'https://www.youtube.com/embed/kBdlM6hNDAE', 'https://img.youtube.com/vi/kBdlM6hNDAE/maxresdefault.jpg', 0, 'b0754b49-593a-40da-ba4c-9a463a33efff', NULL, '8420d143-cf7f-4421-a083-2620864cbe2c', now()),
('a2c1fc30-b172-4718-82e1-c2373fe3006c', 'ER Diagram Tutorial — Step by Step', 'Complete guide to creating ER diagrams with real examples.', 'video', 'https://www.youtube.com/embed/QpdhBUYk7Kk', 'https://img.youtube.com/vi/QpdhBUYk7Kk/maxresdefault.jpg', 0, '82910a96-074d-4059-b2f9-596dd466b99d', NULL, '8420d143-cf7f-4421-a083-2620864cbe2c', now()),
('b4eda038-8bcd-4d3c-943f-7e6e5d521b01', 'SQL Joins Visualized', 'Interactive visual guide to Inner, Left, Right, and Full joins.', 'video', 'https://www.youtube.com/embed/9yeOJ0ZMUYw', 'https://img.youtube.com/vi/9yeOJ0ZMUYw/maxresdefault.jpg', 0, 'bc0bc089-25a5-4c9c-9aec-05078b2cb778', NULL, '8420d143-cf7f-4421-a083-2620864cbe2c', now())
ON CONFLICT (id) DO NOTHING;

-- 3. Add PPT Slides (Interactive Viewer)
INSERT INTO public.materials (id, title, description, type, url, thumbnail, price, module_id, slides, created_by, created_at) VALUES 
('c10e4225-fa84-4074-b495-1ef029f43714', 'Introduction to DBMS — Lecture Slides', 'Comprehensive slides covering architecture and data independence.', 'ppt', '#', NULL, 0, 'b0754b49-593a-40da-ba4c-9a463a33efff', '[{"title": "Introduction to DBMS", "bullets": ["What is a Database?", "What is a DBMS?", "Types of DBMS"]}, {"title": "ACID Properties", "bullets": ["Atomicity", "Consistency", "Isolation", "Durability"]}]'::JSONB, '8420d143-cf7f-4421-a083-2620864cbe2c', now()),
('d18af18f-a2c5-48b6-bace-ea6772df850b', 'ER Model & Diagrams — Masterclass', 'Detailed slides on entity sets, attributes, and participation.', 'ppt', '#', NULL, 0, '82910a96-074d-4059-b2f9-596dd466b99d', '[{"title": "ER Model Basics", "bullets": ["Entity Sets", "Attributes", "Relationships"]}, {"title": "Cardinality", "bullets": ["One-to-One", "One-to-Many", "Many-to-Many"]}]'::JSONB, '8420d143-cf7f-4421-a083-2620864cbe2c', now()),
('f3b9e4a1-7c2d-4b9a-8e5f-d1234567890a', 'DBMS Quick Cheat Sheet (Local)', 'Essential ACID properties and SQL commands for quick revision.', 'pdf', '/uploads/dbms_cheat_sheet.txt', NULL, 0, 'b0754b49-593a-40da-ba4c-9a463a33efff', NULL, '8420d143-cf7f-4421-a083-2620864cbe2c', now())
ON CONFLICT (id) DO NOTHING;

-- 4. Restore Quizzes
INSERT INTO public.quizzes (id, title, description, module_id, time_limit_minutes, total_points, is_active, created_by, created_at) VALUES 
('c032f310-b0da-4f63-a404-39d6042a6f7b', 'DBMS Fundamentals Quiz', 'Test your knowledge of basic DBMS concepts.', 'b0754b49-593a-40da-ba4c-9a463a33efff', 10, 10, true, '8420d143-cf7f-4421-a083-2620864cbe2c', now()),
('ec7061a8-509d-4dde-adbc-cbbd11740a91', 'SQL Basics Quiz', 'Test your SQL knowledge — DDL and DML.', 'bc0bc089-25a5-4c9c-9aec-05078b2cb778', 15, 10, true, '8420d143-cf7f-4421-a083-2620864cbe2c', now())
ON CONFLICT (id) DO NOTHING;

-- 5. Add Sample Questions
INSERT INTO public.questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, points, sort_order) VALUES 
('e6a660b4-c338-422c-a23e-5b7d5cb4845c', 'c032f310-b0da-4f63-a404-39d6042a6f7b', 'What does DBMS stand for?', 'Database Management System', 'Data Basic Management System', 'Database Machine System', 'None', 'A', 'DBMS = Database Management System.', 1, 1),
('d50903b4-a3b1-43ba-ba17-4f952b6d3a25', 'ec7061a8-509d-4dde-adbc-cbbd11740a91', 'Which SQL command creates a table?', 'NEW TABLE', 'CREATE TABLE', 'ADD TABLE', 'MAKE TABLE', 'B', 'CREATE TABLE is the DDL command.', 1, 1)
ON CONFLICT (id) DO NOTHING;

COMMIT;
