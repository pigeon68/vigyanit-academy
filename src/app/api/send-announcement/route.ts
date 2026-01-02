import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const resend = new Resend(process.env.RESEND_API_KEY);

const announcementSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(5).max(8000),
  target_role: z.enum(["all", "all_students_parents", "student", "parent", "teacher", "admin"]),
  type: z.string().min(3).max(50).optional(),
  priority: z.enum(["normal", "high", "low"]).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, content, target_role, type, priority } = announcementSchema.parse(body);
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Rate limit admin announcements
    const { success, resetAt: resetTime } = rateLimit({ key: `send-announcement:${user.id}`, limit: 5, windowMs: 10 * 60 * 1000 });
    if (!success) {
      return NextResponse.json({ error: `Too many requests. Try again in ${Math.ceil(resetTime / 1000)}s.` }, { status: 429 });
    }

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
        const result = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "no-reply@mail.vigyanitacademy.com",
          // keep recipient count limited; if huge, send only first to avoid mass send from app server
          to: emails.length > 50 ? emails.slice(0, 50) : emails,
          subject: `[${(type || "announcement").toUpperCase()}] ${title}`,
          text: content,
        });
        if (result.error) {
          console.error("Failed to send emails via Resend", result.error);
        }
      } catch (emailError) {
        console.error("Failed to send emails:", emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Send announcement API Error:", error);
    return NextResponse.json({ error: "Unable to send announcement." }, { status: 500 });
  }
}
