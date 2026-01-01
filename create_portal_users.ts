import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createUser(email: string, role: string, fullName: string, extraData: any = {}) {
  console.log(`Creating ${role}: ${email}...`);

  // 1. Create Auth User
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: "Orchids2025!",
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes("already registered")) {
        console.log(`${email} already exists in Auth. Fetching ID...`);
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const existingUser = usersData.users.find(u => u.email === email);
        if (existingUser) {
            await insertProfile(existingUser.id, email, role, fullName, extraData);
            return;
        }
    }
    console.error(`Error creating auth user ${email}:`, authError.message);
    return;
  }

  if (authData.user) {
    await insertProfile(authData.user.id, email, role, fullName, extraData);
  }
}

async function insertProfile(id: string, email: string, role: string, fullName: string, extraData: any) {
    // 2. Insert Profile
    const { error: profileError } = await supabase.from("profiles").upsert({
      id,
      email,
      full_name: fullName,
      role,
    });

    if (profileError) {
      console.error(`Error creating profile for ${email}:`, profileError.message);
      return;
    }

    // 3. Insert into specific tables
    if (role === "teacher") {
      await supabase.from("teachers").upsert({
        profile_id: id,
        department: extraData.department || "General",
      });
    } else if (role === "parent") {
      await supabase.from("parents").upsert({
        profile_id: id,
        phone: extraData.phone || "0400000000",
        address: "123 Test St",
        suburb: "Sydney",
        postcode: "2000",
        state: "NSW",
      });
    } else if (role === "student") {
      await supabase.from("students").upsert({
        profile_id: id,
        student_number: `STU${Math.floor(Math.random() * 1000000)}`,
        grade_level: 10,
        gender: "Male",
      });
    }

    console.log(`Successfully set up ${role}: ${email}`);
}

async function main() {
  await createUser("admin@orchids.com", "admin", "Admin User");
  await createUser("teacher_test@orchids.com", "teacher", "Teacher Test", { department: "Mathematics" });
  await createUser("parent_test@orchids.com", "parent", "Parent Test");
  await createUser("student_test@orchids.com", "student", "Student Test");
}

main();
