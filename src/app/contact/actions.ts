"use server";

import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function submitInquiry(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const message = formData.get("message") as string;

  try {
    const supabase = await createClient();
    
    // Save to Supabase
    const { error: dbError } = await supabase.from("contacts").insert({
      name,
      email,
      phone,
      message,
    });

    if (dbError) {
      console.error("Database error:", dbError);
      return { error: "Failed to save message. Please try again later." };
    }

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: "Vigyan Inquiry <onboarding@resend.dev>",
      to: ["office@vigyanitacademy.com"],
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      // We don't return error here because it's already saved in the DB
    }

    return { success: true };
  } catch (err) {
    console.error("Submission error:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
