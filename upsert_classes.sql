-- Ensure courses exist
INSERT INTO courses (name, code, description) VALUES
  ('Mathematics', 'MATH', 'Mathematics courses'),
  ('Science', 'SCI', 'Science courses'),
  ('Physics', 'PHYS', 'Physics courses'),
  ('Chemistry', 'CHEM', 'Chemistry courses'),
  ('Biology', 'BIO', 'Biology courses')
ON CONFLICT (code) DO NOTHING;

-- Delete ALL existing classes (simpler approach without triggers)
DELETE FROM classes;

-- Insert only the new correct classes
INSERT INTO classes (course_id, name, code, day_of_week, start_time, end_time, room)
VALUES
  -- MONDAY
  ((SELECT id FROM courses WHERE code = 'MATH'), 'Year 10 Mathematics', 'MON-MATH-Y10', 'Monday', '16:30', '17:30', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'MATH'), 'Year 9 Mathematics', 'MON-MATH-Y09', 'Monday', '17:30', '18:30', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'SCI'), 'Year 7 Science', 'MON-SCI-Y07', 'Monday', '16:30', '17:30', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'PHYS'), 'Year 11 Physics', 'MON-PHYS-Y11', 'Monday', '17:30', '19:30', 'Main Hall'),
  
  -- TUESDAY
  ((SELECT id FROM courses WHERE code = 'MATH'), 'Year 7 Mathematics', 'TUE-MATH-Y07', 'Tuesday', '16:30', '17:30', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'MATH'), 'Year 12 Advanced Mathematics', 'TUE-MATH-Y12-ADV', 'Tuesday', '17:30', '19:30', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'SCI'), 'Year 9 Science', 'TUE-SCI-Y09', 'Tuesday', '16:30', '17:30', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'BIO'), 'Year 11 Biology', 'TUE-BIO-Y11', 'Tuesday', '17:30', '19:30', 'Main Hall'),
  
  -- WEDNESDAY
  ((SELECT id FROM courses WHERE code = 'MATH'), 'Year 8 Mathematics', 'WED-MATH-Y08', 'Wednesday', '16:30', '17:30', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'PHYS'), 'Year 12 Physics', 'WED-PHYS-Y12', 'Wednesday', '17:30', '19:30', 'Main Hall'),
  
  -- THURSDAY
  ((SELECT id FROM courses WHERE code = 'MATH'), 'Year 7 Mathematics', 'THU-MATH-Y07', 'Thursday', '16:30', '17:30', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'SCI'), 'Year 8 Science', 'THU-SCI-Y08', 'Thursday', '16:30', '17:30', 'Main Hall'),
  
  -- FRIDAY
  ((SELECT id FROM courses WHERE code = 'MATH'), 'Year 9 Mathematics', 'FRI-MATH-Y09', 'Friday', '16:30', '17:30', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'MATH'), 'Year 11 Advanced Mathematics', 'FRI-MATH-Y11-ADV', 'Friday', '17:30', '19:30', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'SCI'), 'Year 10 Science', 'FRI-SCI-Y10', 'Friday', '16:30', '17:30', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'BIO'), 'Year 12 Biology', 'FRI-BIO-Y12', 'Friday', '17:30', '19:30', 'Main Hall'),
  
  -- SATURDAY
  ((SELECT id FROM courses WHERE code = 'MATH'), 'Year 12 Standard 2 Mathematics', 'SAT-MATH-Y12-STD2', 'Saturday', '13:00', '15:00', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'MATH'), 'Year 8 Mathematics', 'SAT-MATH-Y08', 'Saturday', '15:00', '16:00', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'MATH'), 'Year 11 Standard Mathematics', 'SAT-MATH-Y11-STD', 'Saturday', '16:30', '17:30', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'MATH'), 'Year 12 Standard 1 Mathematics', 'SAT-MATH-Y12-STD1', 'Saturday', '17:30', '18:30', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'CHEM'), 'Year 11 Chemistry', 'SAT-CHEM-Y11', 'Saturday', '13:00', '15:00', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'SCI'), 'Year 9 Science', 'SAT-SCI-Y09', 'Saturday', '15:00', '16:00', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'CHEM'), 'Year 12 Chemistry', 'SAT-CHEM-Y12', 'Saturday', '16:30', '18:30', 'Main Hall'),
  
  -- SUNDAY
  ((SELECT id FROM courses WHERE code = 'MATH'), 'Year 11 Extension Mathematics', 'SUN-MATH-Y11-EXT', 'Sunday', '13:00', '15:00', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'MATH'), 'Year 10 Mathematics', 'SUN-MATH-Y10', 'Sunday', '15:00', '16:00', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'MATH'), 'Year 12 Extension 1 Mathematics', 'SUN-MATH-Y12-EXT1', 'Sunday', '16:30', '18:30', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'SCI'), 'Year 8 Science', 'SUN-SCI-Y08', 'Sunday', '13:00', '14:00', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'SCI'), 'Year 10 Science', 'SUN-SCI-Y10', 'Sunday', '14:00', '15:00', 'Main Hall'),
  ((SELECT id FROM courses WHERE code = 'SCI'), 'Year 7 Science', 'SUN-SCI-Y07', 'Sunday', '15:00', '16:00', 'Main Hall');
