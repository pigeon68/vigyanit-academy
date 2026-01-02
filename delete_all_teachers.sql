-- Delete all teachers from the database
-- First, remove teacher references from courses and classes
UPDATE courses SET teacher_id = NULL WHERE teacher_id IN (SELECT id FROM teachers WHERE profile_id IN (SELECT id FROM profiles WHERE role = 'teacher'));
UPDATE classes SET teacher_id = NULL WHERE teacher_id IN (SELECT id FROM profiles WHERE role = 'teacher');

-- Now delete teachers from profiles (will cascade to teachers table)
DELETE FROM profiles WHERE role = 'teacher';
