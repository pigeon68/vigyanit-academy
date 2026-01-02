import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parent, student, selection, paymentMethod } = body;

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

      // Create Student Auth User (Hidden from parent login, for future use)
      const studentPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2).toUpperCase() + "!";
      const { data: studentAuthData, error: studentAuthError } = await supabase.auth.admin.createUser({
        email: `${studentNumber}@student.vigyanit.com`,
        password: studentPassword,
        email_confirm: true,
        user_metadata: { role: 'student' }
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

          const selectedSubjects = selection.subjects.map((s: any) => s.subject);
          const selectedCoursesNames = selection.subjects.map((s: any) => s.courseName).join(", ");
          const preferredClassesNames = selection.subjects.map((s: any) => s.className).join(", ");

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

              return NextResponse.json({ success: true, studentId: studentRowId });
            }
        }
  
      return NextResponse.json({ error: "Failed to create user" }, { status: 400 });
    } catch (error) {
      // Handle duplicate email (Supabase Auth conflict) explicitly even if thrown
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes("already been registered")) {
        const detail = error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : error;
        console.error("Enrolment conflict:", detail);
        return NextResponse.json(
          {
            error: "This email is already registered. Please log in or use a different email.",
            detail,
          },
          { status: 409 }
        );
      }

      // Provide a serializable, informative error response
      const detail = (() => {
        if (!error) return "Unknown error";
        if (error instanceof Error) {
          return {
            name: error.name,
            message: error.message,
            stack: error.stack,
          };
        }
        if (typeof error === "object") return error;
        return String(error);
      })();

      console.error("Enrolment error:", detail);
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "An error occurred",
          detail,
        },
        { status: 500 }
      );
    }
}
