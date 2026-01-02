import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const courseSchema = z.object({
  name: z.string().min(2).max(120),
  code: z.string().min(2).max(20),
  description: z.string().min(4).max(2000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, description } = courseSchema.parse(body);

    // Require admin session
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { data: profile } = await supabaseServer.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const { success, resetTime } = rateLimit(`create-course:${user.id}`, 10, 10 * 60 * 1000);
    if (!success) {
      return NextResponse.json({ success: false, error: `Too many requests. Try again in ${Math.ceil(resetTime / 1000)}s.` }, { status: 429 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("courses")
      .insert({
        name,
        code,
        description,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      course: data
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    console.error("Course creation error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to create course." },
      { status: 500 }
    );
  }
}
