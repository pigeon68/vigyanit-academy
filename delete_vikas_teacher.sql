-- Delete specific teacher: vikas.mittal@vigyanitacademy.com
-- First, get the profile ID
DO $$
DECLARE
  teacher_profile_id UUID;
BEGIN
  -- Get the profile ID
  SELECT id INTO teacher_profile_id FROM profiles WHERE email = 'vikas.mittal@vigyanitacademy.com' AND role = 'teacher';
  
  IF teacher_profile_id IS NOT NULL THEN
    -- Remove teacher references from classes
    UPDATE classes SET teacher_id = NULL WHERE teacher_id = teacher_profile_id;
    
    -- Delete from teachers table
    DELETE FROM teachers WHERE profile_id = teacher_profile_id;
    
    -- Delete from profiles table
    DELETE FROM profiles WHERE id = teacher_profile_id;
    
    -- Delete from auth.users (must be done via auth.admin API, so let's try direct delete)
    DELETE FROM auth.users WHERE id = teacher_profile_id;
  END IF;
END $$;
