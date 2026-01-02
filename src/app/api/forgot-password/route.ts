import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

const resend = new Resend(process.env.RESEND_API_KEY);

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Please enter an email or student ID"),
});

export async function POST(request: Request) {
  try {
    // Rate limiting: 3 requests per 10 minutes per IP
    const headersList = await headers();
    const clientIp =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "unknown";

    const rateLimitKey = `forgot-password:${clientIp}`;
    const { success, resetTime } = rateLimit(rateLimitKey, 3, 10 * 60 * 1000);

    if (!success) {
      return Response.json(
        { error: `Too many requests. Please try again in ${Math.ceil(resetTime / 1000)} seconds.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { identifier } = forgotPasswordSchema.parse(body);

    const admin = createAdminClient();

    // Find user by email or student ID
    let userEmail: string | null = null;
    let studentNumber: string | null = null;
    let userFound = false;

    if (identifier.includes("@")) {
      // It's an email
      userEmail = identifier;
      userFound = true;
    } else {
      // It's a student ID
      studentNumber = identifier;
      // Query database to find user by student_number
      const { data: student } = await admin
        .from("students")
        .select("student_email")
        .eq("student_number", identifier)
        .single();

      if (student) {
        userEmail = student.student_email;
        userFound = true;
      }
    }

    // Always send email to office, whether user is found or not
    const emailContent = `
Password Reset Request

A user has requested a password reset for their academy account.

Account Identifier: ${identifier}
Email: ${userEmail || "Not found in database"}
User Found: ${userFound ? "Yes" : "No"}
Timestamp: ${new Date().toISOString()}

Please contact the user to verify their identity and assist with password reset.
${!userFound ? "\nNote: This identifier was not found in the system. Please verify the user's identity before proceeding." : ""}

This is an automated message from the Vigyanit Academy portal.
    `.trim();

    try {
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "no-reply@vigyanitacademy.com",
        to: "office@vigyanitacademy.com",
        subject: `[Vigyanit Academy] Password Reset Request - ${identifier}`,
        text: emailContent,
      });

      console.log(`[Forgot Password] Resend response:`, JSON.stringify(result, null, 2));
      
      if (result.error) {
        console.error("[Forgot Password] Resend API Error:", result.error);
      } else {
        console.log(`[Forgot Password] Email sent successfully. ID: ${result.data?.id}`);
      }
    } catch (emailError: any) {
      console.error("[Forgot Password Email Error]", {
        error: emailError,
        message: emailError?.message,
        name: emailError?.name,
        statusCode: emailError?.statusCode,
        stack: emailError?.stack,
      });
      // Still return success to prevent information disclosure
    }

    return Response.json({
      success: true,
      message: "If an account exists, a password reset request has been sent to office@vigyanitacademy.com",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error("[Forgot Password Error]", error);
    return Response.json(
      { error: "Unable to process request. Please try again later." },
      { status: 500 }
    );
  }
}
