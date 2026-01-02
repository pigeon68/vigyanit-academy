import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const removeSchema = z.object({
  profileId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profileId } = removeSchema.parse(body);

    // Require admin session
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { data: profile } = await supabaseServer.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    // Rate limit by admin user
    const { success, resetTime } = rateLimit(`remove-teacher:${user.id}`, 10, 5 * 60 * 1000);
    if (!success) {
      return NextResponse.json(
        { success: false, error: `Too many requests. Try again in ${Math.ceil(resetTime / 1000)}s.` },
        { status: 429 }
      );
    }

    const supabase = createAdminClient();

    // Deleting from auth.users will cascade to profiles and teachers due to ON DELETE CASCADE
    const { error: deleteError } = await supabase.auth.admin.deleteUser(profileId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    console.error("Teacher removal error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to process request." },
      { status: 500 }
    );
  }
}
