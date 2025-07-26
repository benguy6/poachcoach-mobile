-- Create Student_Feedback table
CREATE TABLE IF NOT EXISTS "Student_Feedback" (
  id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES "Users"(id) ON DELETE CASCADE,
  session_id UUID REFERENCES "Sessions"(session_id) ON DELETE CASCADE,
  coach_rating INTEGER CHECK (coach_rating >= 1 AND coach_rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE "Student_Feedback" ENABLE ROW LEVEL SECURITY;

-- Policy to allow students to insert their own feedback
CREATE POLICY "Students can insert their own feedback" ON "Student_Feedback"
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Policy to allow students to view their own feedback
CREATE POLICY "Students can view their own feedback" ON "Student_Feedback"
  FOR SELECT USING (auth.uid() = student_id);

-- Policy to allow coaches to view feedback for their sessions
CREATE POLICY "Coaches can view feedback for their sessions" ON "Student_Feedback"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Sessions" s 
      WHERE s.session_id = "Student_Feedback".session_id 
      AND s.coach_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_student_feedback_student_id ON "Student_Feedback"(student_id);
CREATE INDEX IF NOT EXISTS idx_student_feedback_session_id ON "Student_Feedback"(session_id);
CREATE INDEX IF NOT EXISTS idx_student_feedback_created_at ON "Student_Feedback"(created_at); 