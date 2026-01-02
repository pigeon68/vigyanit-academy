import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIdentifier, rateLimit } from "@/lib/rate-limit";

const enrolSchema = z.object({
  parent: z.object({
    email: z.string().email().max(254),
    password: z.string().min(12).max(128),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    phone: z.string().trim().min(6).max(32),
    address: z.string().trim().min(1).max(200),
    suburb: z.string().trim().min(1).max(80),
    postcode: z.string().trim().min(3).max(10),
    state: z.string().trim().min(2).max(20),
    occupation: z.string().trim().max(120).optional(),
    referralSource: z.string().trim().max(120).optional(),
    relationship: z.string().trim().max(60).optional(),
  }),
  student: z.object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    gradeLevel: z.string().trim().regex(/^\d{1,2}$/),
    gender: z.string().trim().max(30).optional(),
    dateOfBirth: z.string().trim().max(30).optional(),
    schoolName: z.string().trim().max(150).optional(),
  }),
  selection: z.object({
    subjects: z
      .array(
        z.object({
          subject: z.string().trim().min(1).max(100),
          courseName: z.string().trim().min(1).max(150),
          className: z.string().trim().max(150).optional(),
        })
      )
      .nonempty(),
  }),
  paymentMethod: z.enum(["stripe", "cash"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const limiter = rateLimit({
      key: `${getClientIdentifier(request)}:enrol`,
      limit: 5,
      windowMs: 60_000,
    });

    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(Math.ceil((limiter.resetAt - Date.now()) / 1000), 1)),
          },
        }
      );
    }

    const body = await request.json();
    const parsed = enrolSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid enrolment data",
          detail: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { parent, student, selection, paymentMethod } = parsed.data;

    const supabase = createAdminClient();

    // Create Parent Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: parent.email,
      password: parent.password,
      email_confirm: true,
      user_metadata: { role: 'parent' }
    });

    if (authError) {
      const message = authError.message || "Auth creation failed";
      const isConflict = message.toLowerCase().includes("already been registered");
      return NextResponse.json(
        {
          error: isConflict
            ? "This email is already registered. Please log in or use a different email."
            : message,
          detail: {
            name: authError.name,
            message: authError.message,
            status: (authError as any)?.status,
          },
        },
        { status: isConflict ? 409 : 500 }
      );
    }

      if (authData.user) {
        // Create Parent Profile
          const { error: parentProfileError } = await supabase.from("profiles").insert({
            id: authData.user.id,
            email: parent.email,
            full_name: `${parent.firstName} ${parent.lastName}`,
            role: "parent",
          });

      if (parentProfileError) throw parentProfileError;

      // Create Parent Record
      const { data: parentData, error: parentError } = await supabase
        .from("parents")
        .insert({
          profile_id: authData.user.id,
          phone: parent.phone,
          address: parent.address,
          suburb: parent.suburb,
          postcode: parent.postcode,
          state: parent.state,
          occupation: parent.occupation,
          referral_source: parent.referralSource
        })
        .select()
        .single();

      if (parentError) throw parentError;

      const studentNumber = `STU${Date.now().toString().slice(-6)}`;

      // Create Student Auth User with forced password reset on first login
      const studentPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2).toUpperCase() + "!";
      const { data: studentAuthData, error: studentAuthError } = await supabase.auth.admin.createUser({
        email: `${studentNumber}@student.vigyanit.com`,
        password: studentPassword,
        email_confirm: true,
        user_metadata: { role: 'student', require_password_reset: true }
      });

      if (studentAuthError) throw studentAuthError;

        if (studentAuthData.user) {
          // Create Student Profile
          const { error: studentProfileError } = await supabase.from("profiles").insert({
            id: studentAuthData.user.id,
            email: `${studentNumber}@student.vigyanit.com`,
            full_name: `${student.firstName} ${student.lastName}`,
            role: "student",
          });

        if (studentProfileError) throw studentProfileError;

          const selectedSubjects = selection.subjects.map((s) => s.subject);
          const selectedCoursesNames = selection.subjects.map((s) => s.courseName).join(", ");
          const preferredClassesNames = selection.subjects
            .map((s) => s.className)
            .filter(Boolean)
            .join(", ");

          // Create Student Record
          const { data: studentData, error: studentError } = await supabase
            .from("students")
            .insert({
              profile_id: studentAuthData.user.id,
              student_number: studentNumber,
              grade_level: parseInt(student.gradeLevel) || null,
              gender: student.gender,
              date_of_birth: student.dateOfBirth,
              school_name: student.schoolName,
              selected_subject: selectedSubjects[0] || null,
              selected_course: selectedCoursesNames || null,
              preferred_class: preferredClassesNames || null,
              payment_method: paymentMethod || 'stripe'
            })
            .select()
            .single();

          if (studentError) throw studentError;

              // Link Parent and Student
              const studentRowId = (studentData as any)?.id || (studentData as any)?.profile_id || studentAuthData.user.id;
              const parentRowId = parentData?.profile_id || authData.user.id;
              const { error: relationshipError } = await supabase
                .from("parent_student")
                .insert({
                  parent_id: parentRowId,
                  student_id: studentRowId,
                  relationship_type: parent.relationship || "parent",
                });

              if (relationshipError) throw relationshipError;

              return NextResponse.json({ 
                success: true, 
                studentId: studentRowId,
                studentNumber,
                studentPassword
              });
            }
        }
  
      return NextResponse.json({ error: "Failed to create user" }, { status: 400 });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error || "Unknown error");
      if (message.toLowerCase().includes("already been registered")) {
        return NextResponse.json(
          {
            error: "This email is already registered. Please log in or use a different email.",
          },
          { status: 409 }
        );
      }

      console.error("Enrolment error", { message });
      return NextResponse.json(
        {
          error: "An error occurred while processing enrolment.",
        },
        { status: 500 }
      );
    }
}
