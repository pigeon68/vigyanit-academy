import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const classSchema = z.object({
  course_id: z.string().uuid(),
  name: z.string().min(2).max(120),
  day_of_week: z.string().min(3).max(20),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  room: z.string().min(1).max(50).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { course_id, name, day_of_week, start_time, end_time, room } = classSchema.parse(body);

    // Require admin session
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { data: profile } = await supabaseServer.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const { success, resetAt: resetTime } = rateLimit({ key: `create-class:${user.id}`, limit: 10, windowMs: 10 * 60 * 1000 });
    if (!success) {
      return NextResponse.json({ success: false, error: `Too many requests. Try again in ${Math.ceil(resetTime / 1000)}s.` }, { status: 429 });
    }

    const supabase = createAdminClient();

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("code")
      .eq("id", course_id)
      .single();

    if (courseError || !course?.code) {
      return NextResponse.json(
        { success: false, error: "Course not found for class generation" },
        { status: 400 }
      );
    }

    const normalizeDay = (value: string) => {
      const map: Record<string, string> = {
        monday: "MON",
        tuesday: "TUE",
        wednesday: "WED",
        thursday: "THU",
        friday: "FRI",
        saturday: "SAT",
        sunday: "SUN",
      };
      const key = value.toLowerCase();
      return map[key] || value.slice(0, 3).toUpperCase();
    };

    const startCode = String(start_time).replace(":", "");
    const baseCode = [course.code, normalizeDay(day_of_week), startCode].filter(Boolean).join("-");

    const { data: existingCodes } = await supabase
      .from("classes")
      .select("code")
      .ilike("code", `${baseCode}%`);

    const taken = new Set((existingCodes || []).map((c) => c.code));
    let finalCode = baseCode;
    let suffix = 1;
    while (taken.has(finalCode)) {
      finalCode = `${baseCode}-${suffix}`;
      suffix += 1;
    }

    const { data, error } = await supabase
      .from("classes")
      .insert({
        course_id,
        name,
        code: finalCode,
        day_of_week,
        start_time,
        end_time,
        room: room || "Main Hall"
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      class: data
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues?.[0]?.message || "Invalid input";
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
    console.error("Class creation error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to create class." },
      { status: 500 }
    );
  }
}
