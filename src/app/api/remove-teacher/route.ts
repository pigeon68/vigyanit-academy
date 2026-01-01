import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profileId } = body;

    if (!profileId) {
      return NextResponse.json(
        { success: false, error: "Missing profile ID" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Deleting from auth.users will cascade to profiles and teachers due to ON DELETE CASCADE
    const { error: deleteError } = await supabase.auth.admin.deleteUser(profileId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Teacher removal error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 }
    );
  }
}
