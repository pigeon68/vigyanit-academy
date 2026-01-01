import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { title, content, target_role, type, priority } = await req.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 1. Insert into DB
    const { error: insertError } = await supabase.from("announcements").insert({
      title,
      content,
      author_id: user.id,
      target_role,
      type: type || 'announcement',
      priority: priority || 'normal'
    });

    if (insertError) throw insertError;

    // 2. Fetch target emails
    let query = supabase.from("profiles").select("email");
    
    if (target_role === "all_students_parents") {
        query = query.in("role", ["student", "parent"]);
    } else if (target_role !== "all") {
        query = query.eq("role", target_role);
    }
    
    const { data: profiles } = await query;
    const emails = (profiles?.map(p => p.email).filter(Boolean) as string[]) || [];

    // 3. Send emails via Resend
    if (emails.length > 0 && process.env.RESEND_API_KEY) {
      try {
          await resend.emails.send({
            from: "ViGyanIT <onboarding@resend.dev>", 
            to: emails.length > 50 ? [emails[0]] : emails, 
            subject: `[${type?.toUpperCase() || 'ANNOUNCEMENT'}] ${title}`,
            text: content,
          });
      } catch (emailError) {
          console.error("Failed to send emails:", emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
