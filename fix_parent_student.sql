-- Drop and recreate parent_student table with proper foreign keys
DROP TABLE IF EXISTS parent_student CASCADE;

CREATE TABLE parent_student (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL,
  student_id UUID NOT NULL,
  relationship_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT parent_student_parent_fkey FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT parent_student_student_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE(parent_id, student_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_parent_student_parent ON parent_student(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_student ON parent_student(student_id);
