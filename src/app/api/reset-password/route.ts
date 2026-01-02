import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function generateOneTimePassword() {
  const base = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
  const symbols = "!@#$%^&*";
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  return base + symbol + "7";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing user ID" },
        { status: 400 }
      );
    }

    // Verify admin session
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { data: profile } = await supabaseServer.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const supabase = createAdminClient();
    const oneTimePassword = generateOneTimePassword();

    // Update the user with new password and require reset flag
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: oneTimePassword,
      user_metadata: { require_password_reset: true },
    });

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, oneTimePassword });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || "Unknown error");
    console.error("Password reset error", { message });
    return NextResponse.json(
      { success: false, error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
