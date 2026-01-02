import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";

const trialLessonSchema = z.object({
  parentName: z.string().min(2).max(120),
  parentEmail: z.string().email(),
  parentPhone: z.string().min(6).max(50),
  studentName: z.string().min(2).max(120),
  courseId: z.string().uuid(),
  classId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    // Rate limit per client
    const clientId = getClientIdentifier(req);
    const { success, resetAt: resetTime } = rateLimit({ key: `trial-lesson:${clientId}`, limit: 5, windowMs: 5 * 60 * 1000 });
    if (!success) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${Math.ceil(resetTime / 1000)}s.` },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const body = await req.json();
    const { parentName, parentEmail, parentPhone, studentName, courseId, classId } = trialLessonSchema.parse(body);

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
    if (error instanceof z.ZodError) {
      const message = error.issues?.[0]?.message || "Invalid request";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Trial lesson submission error:", error);
    return NextResponse.json({ error: "Unable to submit. Please try again." }, { status: 500 });
  }
}
