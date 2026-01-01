import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { parentName, parentEmail, parentPhone, studentName, courseId, classId } = body;

    const { error } = await supabase
      .from("trial_lessons")
      .insert({
        parent_name: parentName,
        parent_email: parentEmail,
        parent_phone: parentPhone,
        student_name: studentName,
        course_id: courseId,
        class_id: classId,
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Trial lesson submission error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
