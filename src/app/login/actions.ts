"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  let email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  // Handle Student ID login
  // If it doesn't contain @ and starts with STU (or just doesn't have @), treat as Student ID
  if (email && !email.includes("@")) {
    email = `${email.trim().toUpperCase()}@student.vigyanit.com`;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profile) {
    switch (profile.role) {
      case "student": redirect("/portal/student"); break;
      case "parent": redirect("/portal/parent"); break;
      case "teacher": redirect("/portal/teacher"); break;
      case "admin": redirect("/portal/admin"); break;
      default: redirect("/");
    }
  }

  redirect("/");
}
