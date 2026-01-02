import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { course_id, name, day_of_week, start_time, end_time, room } = body;

    if (!course_id || !name || !day_of_week || !start_time || !end_time) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Require admin session
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { data: profile } = await supabaseServer.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

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
    console.error("Class creation error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 }
    );
  }
}
