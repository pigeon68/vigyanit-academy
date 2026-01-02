import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function deleteTeacherByEmail(email: string) {
  console.log(`Deleting teacher: ${email}...`);
  
  // Get user from auth
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const user = usersData.users.find(u => u.email === email);
  
  if (!user) {
    console.log(`No auth user found with email: ${email}`);
    return;
  }
  
  console.log(`Found user ID: ${user.id}`);
  
  // Delete from auth.users (this should cascade)
  const { error } = await supabase.auth.admin.deleteUser(user.id);
  
  if (error) {
    console.error(`Error deleting user:`, error);
  } else {
    console.log(`Successfully deleted teacher: ${email}`);
  }
}

async function main() {
  await deleteTeacherByEmail("vikas.mittal@vigyanitacademy.com");
}

main();
