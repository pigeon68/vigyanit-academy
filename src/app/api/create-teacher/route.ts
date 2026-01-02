import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function generateOneTimePassword() {
  // 16-char random password with upper, lower, number, and symbol.
  const base = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
  const symbols = "!@#$%^&*";
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  return base + symbol + "7"; // ensure a digit and symbol
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, fullName, department } = body;

    if (!email || !fullName || !department) {
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

    const oneTimePassword = generateOneTimePassword();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: oneTimePassword,
      email_confirm: true,
      user_metadata: { role: "teacher", require_password_reset: true },
    });

    if (authError) throw authError;

    if (authData.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role: "teacher",
      });

      if (profileError) throw profileError;

      const { error: teacherError } = await supabase.from("teachers").insert({
        profile_id: authData.user.id,
        department,
      });

      if (teacherError) throw teacherError;

      return NextResponse.json({ success: true, email, oneTimePassword });
    }

    return NextResponse.json({ success: false, error: "Failed to create teacher" }, { status: 400 });
  } catch (error) {
    console.error("Teacher creation error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 }
    );
  }
}