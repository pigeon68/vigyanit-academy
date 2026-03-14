import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIdentifier, rateLimit } from "@/lib/rate-limit";

function mapAuthError(error: { message?: string; name?: string; status?: number }) {
  const message = (error.message || "").toLowerCase();
  const status = error.status;

  const isConflict =
    status === 409 ||
    message.includes("already been registered") ||
    message.includes("already registered") ||
    message.includes("user already") ||
    message.includes("duplicate");

  if (isConflict) {
    return {
      status: 409,
      message: "This email is already registered. Please log in or use a different email.",
    };
  }

  if (message.includes("password")) {
    return {
      status: 400,
      message: "Password does not meet security requirements. Please use at least 12 characters.",
    };
  }

  return {
    status: 500,
    message: "Unable to create account right now. Please try again.",
  };
}

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
  paymentMethod: z.enum(["stripe", "cash", "bank_transfer"]).optional(),
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
    const normalizedPaymentMethod = paymentMethod === "bank_transfer" ? "cash" : paymentMethod;

    const supabase = createAdminClient();

    // Create Parent Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: parent.email,
      password: parent.password,
      email_confirm: true,
      user_metadata: { role: 'parent' }
    });

    if (authError) {
      const mapped = mapAuthError({
        message: authError.message,
        name: authError.name,
        status: (authError as any)?.status,
      });
      return NextResponse.json(
        {
          error: mapped.message,
          detail: {
            name: authError.name,
            message: authError.message,
            status: (authError as any)?.status,
          },
        },
        { status: mapped.status }
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

      if (studentAuthError) {
        const mapped = mapAuthError({
          message: studentAuthError.message,
          name: studentAuthError.name,
          status: (studentAuthError as any)?.status,
        });
        return NextResponse.json(
          {
            error: mapped.message,
            detail: {
              name: studentAuthError.name,
              message: studentAuthError.message,
              status: (studentAuthError as any)?.status,
            },
          },
          { status: mapped.status }
        );
      }

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
              payment_method: normalizedPaymentMethod || 'stripe'
            })
            .select()
            .single();

          if (studentError) throw studentError;

              // parent_student.parent_id references profiles.id and student_id references students.id.
              const parentRecordId = authData.user.id;
              const studentRecordId = (studentData as any)?.id;

              if (!parentRecordId || !studentRecordId) {
                throw new Error("Failed to resolve parent/student record ids for relationship link");
              }

              const { error: relationshipError } = await supabase
                .from("parent_student")
                .insert({
                  parent_id: parentRecordId,
                  student_id: studentRecordId,
                  relationship_type: parent.relationship || "parent",
                });

              if (relationshipError) throw relationshipError;

              return NextResponse.json({ 
                success: true, 
                studentId: studentAuthData.user.id,
                studentNumber,
                studentPassword
              });
            }
        }
  
      return NextResponse.json({ error: "Failed to create user" }, { status: 400 });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null && "message" in error
            ? String((error as { message?: unknown }).message || "Unknown error")
            : String(error || "Unknown error");
      const detail =
        typeof error === "object" && error !== null
          ? {
              code: (error as { code?: unknown }).code,
              details: (error as { details?: unknown }).details,
              hint: (error as { hint?: unknown }).hint,
            }
          : undefined;
      if (message.toLowerCase().includes("already been registered")) {
        return NextResponse.json(
          {
            error: "This email is already registered. Please log in or use a different email.",
          },
          { status: 409 }
        );
      }

      console.error("Enrolment error", { message, detail, error });
      return NextResponse.json(
        {
          error: "An error occurred while processing enrolment.",
          detail: message,
          meta: detail,
        },
        { status: 500 }
      );
    }
}
