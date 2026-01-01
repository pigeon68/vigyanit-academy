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

    if (authError) throw authError;

      if (authData.user) {
        // Create Parent Profile
        const { error: parentProfileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          email: parent.email,
          full_name: `${parent.firstName} ${parent.lastName}`,
          first_name: parent.firstName,
          last_name: parent.lastName,
          role: "parent",
          plain_password: parent.password,
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
            first_name: student.firstName,
            last_name: student.lastName,
            role: "student",
            plain_password: studentPassword,
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
              selected_subjects: selectedSubjects,
              selected_course: selectedCoursesNames || null,
              preferred_class: preferredClassesNames || null,
              payment_method: paymentMethod || 'stripe'
            })
          .select()
          .single();

          if (studentError) throw studentError;

          // Add to class_students for each selected class
          if (selection.subjects && selection.subjects.length > 0) {
            const enrolments = selection.subjects
              .filter((s: any) => s.classId)
              .map((s: any) => ({
                class_id: s.classId,
                student_id: studentAuthData.user.id,
              }));
            
            if (enrolments.length > 0) {
              const { error: classEnrollError } = await supabase
                .from("class_students")
                .insert(enrolments);
              if (classEnrollError) console.error("Class enrolment error:", classEnrollError);
            }
          }
  
              // Link Parent and Student
              const { error: relationshipError } = await supabase
                .from("parent_student")
                .insert({
                  parent_id: authData.user.id,
                  student_id: studentAuthData.user.id,
                  relationship_type: parent.relationship || "parent",
                });
  
  
  
            if (relationshipError) throw relationshipError;
          }
  
          return NextResponse.json({ success: true, studentId: studentAuthData.user.id });
        }
  
      return NextResponse.json({ error: "Failed to create user" }, { status: 400 });
    } catch (error) {
      console.error("Enrolment error:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "An error occurred" },
        { status: 500 }
      );
    }
}
