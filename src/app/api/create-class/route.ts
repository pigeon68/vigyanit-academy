import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { course_id, name, code, day_of_week, start_time, end_time, room } = body;

    if (!course_id || !name || !code || !day_of_week || !start_time || !end_time) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("classes")
      .insert({
        course_id,
        name,
        code,
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
