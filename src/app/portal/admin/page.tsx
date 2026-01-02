"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  Mail, Calendar as CalendarIcon, 
  CheckSquare, BookOpen, 
  LogOut, ChevronLeft,
  FileText, Award, BarChart3, Clock,
  MoreVertical, ChevronRight, Download, Plus, Users, User, Shield, Briefcase, GraduationCap,
  Bell, Send, Megaphone, Trash2, X, Search, Eye, EyeOff
} from "lucide-react";

interface Teacher {
  id: string;
  profile_id: string;
  department: string;
  created_at: string;
  profile: {
    full_name: string;
    email: string;
    plain_password?: string;
  };
}

interface Student {
  id: string;
  profile_id: string;
  student_number: string;
  grade_level: number;
  gender: string;
  date_of_birth: string;
  school_name: string;
  selected_subject: string;
  selected_course: string;
  preferred_class: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  profile: {
    full_name: string;
    email: string;
    plain_password?: string;
  };
  parents: {
    relationship_type: string;
    profile: {
      full_name: string;
      email: string;
      plain_password?: string;
      parent_details: {
        phone: string;
        address: string;
        suburb: string;
        postcode: string;
        state: string;
        occupation: string;
        referral_source: string;
      } | null;
    };
  }[];
}

interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
}

  interface Class {
    id: string;
    course_id: string;
    teacher_id: string | null;
    name: string;
    code: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room: string;
    course: {
      name: string;
      code: string;
    };
    teacher?: {
      profile: {
        full_name: string;
      };
    };
  }

    interface TrialLesson {
      id: string;
      parent_name: string;
      parent_email: string;
      parent_phone: string;
      student_name: string;
      course_id: string;
      class_id: string;
      status: string;
      created_at: string;
      course: {
        name: string;
      };
      class: {
        day_of_week: string;
        start_time: string;
        end_time: string;
      };
    }

    interface ContactMessage {
      id: string;
      name: string;
      email: string;
      phone: string;
      message: string;
      created_at: string;
    }

    export default function AdminPortal() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [adminName, setAdminName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [trialLessons, setTrialLessons] = useState<TrialLesson[]>([]);
    const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
    const [showProfile, setShowProfile] = useState(false);
    const [activeTab, setActiveTab] = useState<"onboarding" | "curriculum" | "faculty" | "comms" | "lookup" | "trials" | "messages">("onboarding");
  
  const [newTeacher, setNewTeacher] = useState({ email: "", password: "", fullName: "", department: "" });
  const [creating, setCreating] = useState(false);
  
  const [newCourse, setNewCourse] = useState({ name: "", code: "", description: "" });
  const [creatingCourse, setCreatingCourse] = useState(false);

  const [newClass, setNewClass] = useState({ 
    course_id: "", 
    name: "", 
    day_of_week: "Monday", 
    start_time: "16:30", 
    end_time: "17:30",
    room: "Main Hall"
  });
  const [creatingClass, setCreatingClass] = useState(false);
  
  const [assignForm, setAssignForm] = useState({ classId: "", teacherId: "" });
  const [assigning, setAssigning] = useState(false);

  const [newAnnouncement, setNewAnnouncement] = useState({ 
    title: "", 
    content: "", 
    target_role: "teacher", 
    type: "notification", 
    priority: "normal" 
  });
  const [sendingComms, setSendingComms] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [removing, setRemoving] = useState(false);

  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [revealPassword, setRevealPassword] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const normalizeStudentRecord = (student: any): Student => ({
    ...student,
    profile: Array.isArray(student.profile) ? student.profile[0] : student.profile,
    parents: (student.parents || []).map((parent: any) => ({
      ...parent,
      profile: Array.isArray(parent.profile) ? parent.profile[0] : parent.profile,
    })),
  });

  const normalizeClassRecord = (cls: any): Class => ({
    ...cls,
    course: Array.isArray(cls.course) ? cls.course[0] : cls.course,
  });

  const normalizeTrialLessonRecord = (trial: any): TrialLesson => ({
    ...trial,
    course: Array.isArray(trial.course) ? trial.course[0] : trial.course,
    class: Array.isArray(trial.class) ? trial.class[0] : trial.class,
  });

  async function loadTeachers() {
    const { data } = await supabase
      .from("teachers")
      .select(`id, profile_id, department, created_at, profile:profiles(full_name, email, plain_password)`) 
      .order("created_at", { ascending: false });

    const normalized: Teacher[] = (data || []).map((teacher: any) => ({
      ...teacher,
      // Supabase can return the aliased relation as an array; take the first entry when present.
      profile: Array.isArray(teacher.profile) ? teacher.profile[0] : teacher.profile,
    }));

    setTeachers(normalized);
  }

  async function loadStudents() {
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select(`
          id, profile_id, student_number, grade_level, gender, created_at,
          date_of_birth, school_name, selected_subject, selected_course, preferred_class, payment_method, payment_status,
          profile:profiles!inner(
            full_name, email, plain_password
          ),
          parents:parent_student!student_id(
            relationship_type,
            profile:profiles!parent_id(
              full_name, email, plain_password,
              parent_details:parents!profile_id(
                phone, address, suburb, postcode, state, occupation, referral_source
              )
            )
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;

      const normalized = (data || []).map(normalizeStudentRecord);
      setSearchResults(normalized);
    } catch (err) {
      console.error("Load students failed:", err);
    } finally {
      setSearching(false);
    }
  }

  async function handleSearchStudents(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      await loadStudents();
      return;
    }
    setSearching(true);
    try {
        const { data, error } = await supabase
          .from("students")
          .select(`
            id, profile_id, student_number, grade_level, gender, created_at,
            date_of_birth, school_name, selected_subject, selected_course, preferred_class, payment_method, payment_status,
            profile:profiles!inner(
              full_name, email, plain_password
            ),
            parents:parent_student!student_id(
              relationship_type,
              profile:profiles!parent_id(
                full_name, email, plain_password,
                parent_details:parents!profile_id(
                  phone, address, suburb, postcode, state, occupation, referral_source
                )
              )
            )
          `);
        
        if (error) throw error;

        const normalized = (data || []).map(normalizeStudentRecord);
        const query = searchQuery.toLowerCase();
        const filtered = normalized.filter((s: Student) =>
          s.student_number?.toLowerCase().includes(query) ||
          s.profile?.full_name?.toLowerCase().includes(query)
        );
        
        setSearchResults(filtered);
    } catch (err: any) {
      console.error("Search failed:", err);
      alert(`Search failed: ${err.message || "Unknown error"}`);
    } finally {
      setSearching(false);
    }
  }

  async function loadAnnouncements() {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    setAnnouncements(data || []);
  }

  async function loadCourses() {
    const { data } = await supabase.from("courses").select(`id, name, code, description`).order("code", { ascending: true });
    setCourses(data || []);
  }

  async function loadClasses() {
    try {
      // Fetch classes without join to avoid filtering
      const { data: classData, error } = await supabase
        .from("classes")
        .select("*")
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });
      
      if (error) {
        console.error("loadClasses error:", error);
        setClasses([]);
        return;
      }

      // Fetch all courses
      const { data: courseData } = await supabase
        .from("courses")
        .select("id, name, code");
      
      const coursesMap = new Map(courseData?.map(c => [c.id, c]) || []);
      
      // Manually join course data
      const enriched = (classData || []).map(cls => ({
        ...cls,
        course: coursesMap.get(cls.course_id) || { name: "Unknown", code: "N/A" }
      }));
      
      console.log("Loaded classes count:", enriched.length);
      const normalized = enriched.map(normalizeClassRecord);
      setClasses(normalized);
    } catch (err) {
      console.error("Exception in loadClasses:", err);
    }
  }

      async function loadTrialLessons() {
        const { data, error } = await supabase
          .from("trial_lessons")
          .select(`
            *,
            course:courses(name),
            class:classes(day_of_week, start_time, end_time)
          `)
          .order("created_at", { ascending: false });
        
        if (error) console.error("Load trials failed:", error);
        else {
          const normalized = (data || []).map(normalizeTrialLessonRecord);
          setTrialLessons(normalized);
        }
      }

      async function loadContacts() {
        const { data, error } = await supabase
          .from("contacts")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) console.error("Load contacts failed:", error);
        else setContactMessages(data || []);
      }

    useEffect(() => {
      async function loadData() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role, email")
          .eq("id", user.id)
          .single();

        if (!profile || profile.role !== "admin") { router.push("/login"); return; }
        setAdminName(profile.full_name);
        setAdminEmail(profile.email || "");
        setLoading(false);

          // Load other data in background
          Promise.all([
            loadTeachers(),
            loadCourses(),
            loadClasses(),
            loadAnnouncements(),
            loadStudents(),
            loadTrialLessons(),
            loadContacts()
          ]).catch(err => console.error("Background data load error:", err));
      }
      loadData();
    }, [router, supabase]);

  async function handleCreateTeacher(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/create-teacher", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newTeacher) });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setNewTeacher({ email: "", password: "", fullName: "", department: "" });
      await loadTeachers();
      alert("Faculty registered successfully.");
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); } finally { setCreating(false); }
  }

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    setCreatingCourse(true);
    try {
      const res = await fetch("/api/create-course", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newCourse) });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setNewCourse({ name: "", code: "", description: "" });
      await loadCourses();
      alert("Subject established successfully.");
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); } finally { setCreatingCourse(false); }
  }

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    setCreatingClass(true);
    try {
      const res = await fetch("/api/create-class", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(newClass) 
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setNewClass({ 
        course_id: "", name: "", 
        day_of_week: "Monday", start_time: "16:30", 
        end_time: "17:30", room: "Main Hall" 
      });
      await loadClasses();
      alert("Class established successfully.");
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); } finally { setCreatingClass(false); }
  }

  async function handleAssignClass(e: React.FormEvent) {
    e.preventDefault();
    setAssigning(true);
    try {
      const { error } = await supabase.from("classes").update({ teacher_id: assignForm.teacherId || null }).eq("id", assignForm.classId);
      if (error) throw error;
      setAssignForm({ classId: "", teacherId: "" });
      await loadClasses();
      alert("Assignment deployed.");
    } catch (err: any) {
      alert(`Assignment failed: ${err.message}`);
    } finally { setAssigning(false); }
  }

  async function handleSendAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    setSendingComms(true);
    try {
      const res = await fetch("/api/send-announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAnnouncement)
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setNewAnnouncement({ title: "", content: "", target_role: "teacher", type: "notification", priority: "normal" });
      await loadAnnouncements();
      alert("Communication dispatched successfully.");
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); } finally { setSendingComms(false); }
  }

  async function handleRemoveTeacher() {
    if (!deletingTeacher) return;
    if (confirmName !== deletingTeacher.profile.full_name) {
      alert("Name verification failed. Please type the full name exactly as shown.");
      return;
    }

    setRemoving(true);
    try {
      const res = await fetch("/api/remove-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: deletingTeacher.profile_id })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      
      await loadTeachers();
      await loadClasses(); 
      setDeletingTeacher(null);
      setConfirmName("");
      alert("Faculty member terminated successfully.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Termination failed.");
    } finally {
      setRemoving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="text-[#c9a962] font-serif text-2xl italic tracking-widest">Synchronizing Command Console...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      <main className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-50">
          <Link href="/" className="flex items-center gap-4">
            <div className="w-64 h-24 relative">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
          </Link>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-gray-500">
              <div className="flex items-center gap-3 border-l pl-6">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 leading-none mb-1">{adminName}</p>
                  <p className="text-[10px] text-[#c9a962] uppercase tracking-widest font-bold">Administrator</p>
                </div>
                <div 
                  className="w-10 h-10 rounded-full bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] font-bold border border-[#c9a962]/20 cursor-pointer"
                  onClick={() => setShowProfile(true)}
                  title="View Profile"
                >
                  {adminName[0]}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Area */}
        <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
          {showProfile ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Administrator Profile</h2>
                <button 
                  onClick={() => setShowProfile(false)}
                  className="text-sm text-[#c9a962] font-bold hover:underline"
                >
                  Return to Dashboard
                </button>
              </div>
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 max-w-2xl">
                <div className="flex items-center gap-8 mb-10">
                  <div className="w-24 h-24 rounded-full bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] text-3xl font-bold border-2 border-[#c9a962]/20">
                    {adminName[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{adminName}</h3>
                    <p className="text-[#c9a962] font-bold uppercase tracking-widest text-xs">Master Admin</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Full Name</label>
                    <p className="text-gray-900 font-medium">{adminName}</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Email Address</label>
                    <p className="text-gray-900 font-medium">{adminEmail}</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Security Clear</label>
                    <p className="text-gray-900 font-medium">Level 5 (Admin)</p>
                  </div>
                </div>

                <button 
                  onClick={() => supabase.auth.signOut().then(() => router.push("/"))}
                  className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
                >
                  <LogOut size={18} />
                  Terminate Session
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Strategic Operations Centre</h2>
                      <p className="text-gray-500 text-sm mt-1">Managing personnel, curriculum, and faculty allocations.</p>
                    </div>
                      <div className="flex gap-4 p-1 bg-white border border-gray-100 rounded-2xl shadow-sm">
                        {[
                          { id: "onboarding", label: "Onboarding", icon: User },
                          { id: "lookup", label: "Lookup", icon: Search },
                          { id: "trials", label: "Trials", icon: CalendarIcon },
                          { id: "messages", label: "Messages", icon: Mail },
                          { id: "curriculum", label: "Curriculum", icon: BookOpen },
                          { id: "faculty", label: "Faculty", icon: Briefcase },
                          { id: "comms", label: "Comms", icon: Bell }
                        ].map(tab => (
                        <button 
                          key={tab.id} 
                          onClick={() => setActiveTab(tab.id as any)} 
                          className={`px-6 py-2 text-[10px] tracking-widest uppercase font-bold transition-all rounded-xl flex items-center gap-2 ${activeTab === tab.id ? 'bg-[#1a1a1a] text-[#c9a962]' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          <tab.icon size={14} />
                          {tab.label}
                        </button>
                      ))}
                    </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Active Faculty", value: teachers.length, icon: Users },
                  { label: "Course Catalog", value: courses.length, icon: GraduationCap },
                  { label: "Active Classes", value: classes.length, icon: CalendarIcon }
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962]">
                        <stat.icon size={20} />
                      </div>
                      <span className="text-[10px] tracking-widest uppercase text-gray-400 font-bold">{stat.label}</span>
                    </div>
                    <div className="text-3xl font-serif text-gray-900">{stat.value}</div>
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === "onboarding" && (
                  <motion.div 
                    key="onboarding" 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="grid lg:grid-cols-2 gap-8"
                  >
                    <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm">
                      <h3 className="font-serif text-2xl text-gray-900 mb-8">Personnel <span className="italic font-light">Onboarding</span></h3>
                      <form onSubmit={handleCreateTeacher} className="space-y-6">
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Legal Full Name</label>
                          <input 
                            type="text" 
                            value={newTeacher.fullName} 
                            onChange={(e) => setNewTeacher({...newTeacher, fullName: e.target.value})} 
                            className="w-full bg-[#f8f9fa] border-none p-4 rounded-xl focus:ring-2 focus:ring-[#c9a962]/20 outline-none transition-all" 
                            placeholder="e.g. Dr. Julian Thorne"
                            required 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Email</label>
                            <input 
                              type="email" 
                              value={newTeacher.email} 
                              onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})} 
                              className="w-full bg-[#f8f9fa] border-none p-4 rounded-xl focus:ring-2 focus:ring-[#c9a962]/20 outline-none transition-all" 
                              required 
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Security Key</label>
                            <input 
                              type="password" 
                              value={newTeacher.password} 
                              onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})} 
                              className="w-full bg-[#f8f9fa] border-none p-4 rounded-xl focus:ring-2 focus:ring-[#c9a962]/20 outline-none transition-all" 
                              required 
                              minLength={6} 
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Department</label>
                          <input 
                            type="text" 
                            value={newTeacher.department} 
                            onChange={(e) => setNewTeacher({...newTeacher, department: e.target.value})} 
                            className="w-full bg-[#f8f9fa] border-none p-4 rounded-xl focus:ring-2 focus:ring-[#c9a962]/20 outline-none transition-all" 
                            placeholder="e.g. Theoretical Physics"
                            required 
                          />
                        </div>
                        <button 
                          type="submit" 
                          disabled={creating} 
                          className="w-full py-5 bg-[#1a1a1a] text-[#c9a962] text-[10px] tracking-[0.4em] uppercase font-bold rounded-xl hover:bg-[#c9a962] hover:text-white transition-all duration-500 shadow-xl shadow-[#1a1a1a]/10"
                        >
                          {creating ? "INITIALIZING..." : "EXECUTE ONBOARDING"}
                        </button>
                      </form>
                    </div>

                    <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
                      <div className="w-20 h-20 rounded-full bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962]">
                        <Shield size={40} />
                      </div>
                      <div>
                        <h4 className="font-serif text-xl text-gray-900 mb-2">Security Protocol</h4>
                        <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                          Registering new faculty generates a secure profile and triggers credentials verification. Ensure data accuracy before execution.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "curriculum" && (
                  <motion.div 
                    key="curriculum" 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-10"
                  >
                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Course Establishment */}
                      <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="font-serif text-2xl text-gray-900 mb-8">Subject <span className="italic font-light">Architecture</span></h3>
                        <form onSubmit={handleCreateCourse} className="space-y-6">
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Subject Name</label>
                            <input 
                              type="text" 
                              value={newCourse.name} 
                              onChange={(e) => setNewCourse({...newCourse, name: e.target.value})} 
                              className="w-full bg-[#f8f9fa] border-none p-4 rounded-xl focus:ring-2 focus:ring-[#c9a962]/20 outline-none transition-all" 
                              placeholder="e.g. Advanced Mathematics"
                              required 
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Subject Code</label>
                            <input 
                              type="text" 
                              value={newCourse.code} 
                              onChange={(e) => setNewCourse({...newCourse, code: e.target.value})} 
                              className="w-full bg-[#f8f9fa] border-none p-4 rounded-xl focus:ring-2 focus:ring-[#c9a962]/20 outline-none transition-all" 
                              placeholder="e.g. MATH-101"
                              required 
                            />
                          </div>
                          <button 
                            type="submit" 
                            disabled={creatingCourse} 
                            className="w-full py-5 bg-[#1a1a1a] text-[#c9a962] text-[10px] tracking-[0.4em] uppercase font-bold rounded-xl hover:bg-[#c9a962] hover:text-white transition-all duration-500"
                          >
                            {creatingCourse ? "ESTABLISHING..." : "ESTABLISH SUBJECT"}
                          </button>
                        </form>
                      </div>

                      {/* Class Establishment */}
                      <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="font-serif text-2xl text-gray-900 mb-8">Class <span className="italic font-light">Generation</span></h3>
                        <form onSubmit={handleCreateClass} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Parent Subject</label>
                              <select 
                                value={newClass.course_id} 
                                onChange={(e) => setNewClass({...newClass, course_id: e.target.value})} 
                                className="w-full bg-[#f8f9fa] border-none p-4 rounded-xl outline-none" 
                                required
                              >
                                <option value="">Select Subject</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Class Name</label>
                              <input 
                                type="text" 
                                value={newClass.name} 
                                onChange={(e) => setNewClass({...newClass, name: e.target.value})} 
                                className="w-full bg-[#f8f9fa] border-none p-4 rounded-xl outline-none" 
                                placeholder="e.g. Year 10 Math"
                                required 
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Day</label>
                              <select 
                                value={newClass.day_of_week} 
                                onChange={(e) => setNewClass({...newClass, day_of_week: e.target.value})} 
                                className="w-full bg-[#f8f9fa] border-none p-4 rounded-xl outline-none" 
                                required
                              >
                                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => (
                                  <option key={d} value={d}>{d}</option>
                                ))}
                              </select>
                              <p className="mt-2 text-xs text-gray-500">Class code auto-generates from subject, day, and start time.</p>
                            </div>
                            <div>
                              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Start Time</label>
                              <input 
                                type="time" 
                                value={newClass.start_time} 
                                onChange={(e) => setNewClass({...newClass, start_time: e.target.value})} 
                                className="w-full bg-[#f8f9fa] border-none p-4 rounded-xl outline-none" 
                                required 
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">End Time</label>
                              <input 
                                type="time" 
                                value={newClass.end_time} 
                                onChange={(e) => setNewClass({...newClass, end_time: e.target.value})} 
                                className="w-full bg-[#f8f9fa] border-none p-4 rounded-xl outline-none" 
                                required 
                              />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Room (optional)</label>
                              <input 
                                type="text" 
                                value={newClass.room} 
                                onChange={(e) => setNewClass({...newClass, room: e.target.value})} 
                                className="w-full bg-[#f8f9fa] border-none p-4 rounded-xl outline-none" 
                                placeholder="Main Hall"
                              />
                            </div>
                          </div>
                          <button 
                            type="submit" 
                            disabled={creatingClass} 
                            className="w-full py-5 bg-[#1a1a1a] text-[#c9a962] text-[10px] tracking-[0.4em] uppercase font-bold rounded-xl hover:bg-[#c9a962] hover:text-white transition-all duration-500"
                          >
                            {creatingClass ? "GENERATING..." : "GENERATE CLASS"}
                          </button>
                        </form>
                      </div>
                    </div>

                    <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm">
                      <h3 className="font-serif text-2xl text-gray-900 mb-8">Class <span className="italic font-light">Assignment</span></h3>
                      <form onSubmit={handleAssignClass} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Target Class ({classes.length})</label>
                            <select 
                              value={assignForm.classId} 
                              onChange={(e) => setAssignForm({...assignForm, classId: e.target.value})} 
                              className="w-full bg-[#f8f9fa] border-none p-4 rounded-xl outline-none" 
                              required
                            >
                              <option value="">Select Class</option>
                              {classes.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name} ({c.day_of_week})</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Faculty Lead</label>
                            <select 
                              value={assignForm.teacherId} 
                              onChange={(e) => setAssignForm({...assignForm, teacherId: e.target.value})} 
                              className="w-full bg-[#f8f9fa] border-none p-4 rounded-xl outline-none" 
                              required
                            >
                              <option value="">Select Faculty</option>
                              {teachers.map(t => <option key={t.id} value={t.id}>{t.profile.full_name}</option>)}
                            </select>
                          </div>
                        </div>
                        <button 
                          type="submit" 
                          disabled={assigning} 
                          className="w-full py-5 border-2 border-[#1a1a1a] text-[#1a1a1a] text-[10px] tracking-[0.4em] uppercase font-bold rounded-xl hover:bg-[#1a1a1a] hover:text-white transition-all duration-500"
                        >
                          DEPLOY FACULTY ASSIGNMENT
                        </button>
                      </form>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-8 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-serif text-xl text-gray-900">Current Class Registry</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-50/30">
                              <th className="px-8 py-4 text-[10px] tracking-widest font-bold uppercase text-gray-400">Class Code</th>
                              <th className="px-8 py-4 text-[10px] tracking-widest font-bold uppercase text-gray-400">Name</th>
                              <th className="px-8 py-4 text-[10px] tracking-widest font-bold uppercase text-gray-400">Schedule</th>
                              <th className="px-8 py-4 text-[10px] tracking-widest font-bold uppercase text-gray-400">Teacher</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {classes.map(c => (
                              <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-8 py-6 font-bold text-[#c9a962]">{c.code}</td>
                                <td className="px-8 py-6 text-gray-900 font-medium">{c.name}</td>
                                <td className="px-8 py-6 text-sm text-gray-500">
                                  {c.day_of_week} {c.start_time} - {c.end_time}
                                </td>
                                <td className="px-8 py-6">
                                  {c.teacher_id ? (
                                    <span className="text-xs text-amber-600 italic font-medium tracking-wide">Assigned (ID: {c.teacher_id})</span>
                                  ) : (
                                    <span className="text-xs text-red-400 italic font-medium tracking-wide">Unassigned</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "faculty" && (
                  <motion.div 
                    key="faculty" 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-50 bg-gray-50/50">
                            <th className="px-8 py-6 text-[10px] tracking-widest font-bold uppercase text-gray-400">Faculty Lead</th>
                            <th className="px-8 py-6 text-[10px] tracking-widest font-bold uppercase text-gray-400">Department</th>
                            <th className="px-8 py-6 text-[10px] tracking-widest font-bold uppercase text-gray-400">Email</th>
                            <th className="px-8 py-6 text-[10px] tracking-widest font-bold uppercase text-gray-400">Joined</th>
                            <th className="px-8 py-6 text-right text-[10px] tracking-widest font-bold uppercase text-gray-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {teachers.map(t => (
                            <tr 
                              key={t.id} 
                              className="hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => setSelectedTeacher(t)}
                            >
                              <td className="px-8 py-8">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] text-xs font-bold">
                                    {t.profile.full_name[0]}
                                  </div>
                                  <span className="font-bold text-gray-900">{t.profile.full_name}</span>
                                </div>
                              </td>
                              <td className="px-8 py-8">
                                <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-600 tracking-wider uppercase">{t.department}</span>
                              </td>
                              <td className="px-8 py-8 text-sm text-gray-500">{t.profile.email}</td>
                              <td className="px-8 py-8 text-sm text-gray-400">
                                {new Date(t.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-8 py-8 text-right" onClick={(e) => e.stopPropagation()}>
                                <button 
                                  onClick={() => setDeletingTeacher(t)}
                                  className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                  title="Remove Teacher"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {activeTab === "lookup" && (
                  <motion.div 
                    key="lookup" 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-10"
                  >
                    <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm">
                      <h3 className="font-serif text-2xl text-gray-900 mb-8">Student <span className="italic font-light">Intelligence</span></h3>
                      <form onSubmit={handleSearchStudents} className="relative mb-10">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input 
                          type="text" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-[#f8f9fa] border-none py-6 pl-16 pr-32 rounded-2xl focus:ring-2 focus:ring-[#c9a962]/20 outline-none transition-all text-lg font-medium" 
                          placeholder="Enter student name or ID..."
                        />
                        <button 
                          type="submit"
                          disabled={searching}
                          className="absolute right-4 top-1/2 -translate-y-1/2 px-8 py-3 bg-[#1a1a1a] text-[#c9a962] text-[10px] tracking-widest uppercase font-bold rounded-xl hover:bg-[#c9a962] hover:text-white transition-all"
                        >
                          {searching ? "SEARCHING..." : "SEARCH"}
                        </button>
                      </form>

                      {searchResults.length > 0 ? (
                        <div className="space-y-3">
                          {searchResults.map(s => (
                            <div 
                              key={s.id}
                              onClick={() => setSelectedStudent(s)}
                              className="group bg-white p-5 rounded-2xl border border-gray-100 hover:border-[#c9a962]/30 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                            >
                              <div className="flex items-center gap-5">
                                <div>
                                  <h4 className="font-bold text-gray-900 group-hover:text-[#c9a962] transition-colors">{s.profile?.full_name || "Unknown Student"}</h4>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] bg-[#c9a962]/10 text-[#c9a962] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">{s.student_number}</span>
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Year {s.grade_level}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-8">
                                <div className="hidden md:flex flex-col items-end">
                                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Gender</span>
                                  <span className="text-xs font-medium text-gray-600">{s.gender}</span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#c9a962] group-hover:bg-[#c9a962]/10 transition-all">
                                  <ChevronRight size={16} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : !searching ? (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                          <Users className="mx-auto text-gray-300 mb-4" size={48} />
                          <h4 className="text-lg font-serif text-gray-900 mb-1">No Students Found</h4>
                          <p className="text-sm text-gray-500">The registry appears to be empty or no matches were found.</p>
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                )}

                  {activeTab === "trials" && (
                  <motion.div 
                    key="trials" 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-8 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-serif text-xl text-gray-900">Trial Lesson Requests</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="w-2 h-2 rounded-full bg-[#c9a962]" />
                          {trialLessons.length} Total Requests
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-50/30">
                              <th className="px-8 py-4 text-[10px] tracking-widest font-bold uppercase text-gray-400">Date</th>
                              <th className="px-8 py-4 text-[10px] tracking-widest font-bold uppercase text-gray-400">Student</th>
                              <th className="px-8 py-4 text-[10px] tracking-widest font-bold uppercase text-gray-400">Parent Info</th>
                              <th className="px-8 py-4 text-[10px] tracking-widest font-bold uppercase text-gray-400">Course & Class</th>
                              <th className="px-8 py-4 text-[10px] tracking-widest font-bold uppercase text-gray-400">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {trialLessons.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic">No trial lesson requests found.</td>
                              </tr>
                            ) : (
                              trialLessons.map(trial => (
                                <tr key={trial.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-8 py-6 text-sm text-gray-500 whitespace-nowrap">
                                    {new Date(trial.created_at).toLocaleDateString()}
                                  </td>
                                  <td className="px-8 py-6">
                                    <div className="font-bold text-gray-900">{trial.student_name}</div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <div className="text-sm font-medium text-gray-900">{trial.parent_name}</div>
                                    <div className="text-xs text-gray-500">{trial.parent_email}</div>
                                    <div className="text-xs text-gray-500">{trial.parent_phone}</div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <div className="text-sm font-bold text-[#c9a962]">{trial.course?.name || 'Manual Selection'}</div>
                                    <div className="text-xs text-gray-500">
                                      {trial.class ? `${trial.class.day_of_week} ${trial.class.start_time}` : 'Unscheduled'}
                                    </div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                      trial.status === 'confirmed' ? 'bg-green-100 text-green-600' : 
                                      trial.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                                    }`}>
                                      {trial.status || 'Pending'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}

                  {activeTab === "messages" && (
                    <motion.div 
                      key="messages" 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                          <h3 className="font-serif text-xl text-gray-900">Contact Form Messages</h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="w-2 h-2 rounded-full bg-[#c9a962]" />
                            {contactMessages.length} Messages
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-gray-50/30">
                                <th className="px-8 py-4 text-[10px] tracking-widest font-bold uppercase text-gray-400">Date</th>
                                <th className="px-8 py-4 text-[10px] tracking-widest font-bold uppercase text-gray-400">Sender</th>
                                <th className="px-8 py-4 text-[10px] tracking-widest font-bold uppercase text-gray-400">Contact Info</th>
                                <th className="px-8 py-4 text-[10px] tracking-widest font-bold uppercase text-gray-400">Message</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {contactMessages.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="px-8 py-20 text-center text-gray-400 italic">No messages found.</td>
                                </tr>
                              ) : (
                                contactMessages.map(msg => (
                                  <tr key={msg.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-6 text-sm text-gray-500 whitespace-nowrap">
                                      {new Date(msg.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-6">
                                      <div className="font-bold text-gray-900">{msg.name}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                      <div className="text-sm font-medium text-gray-900">{msg.email}</div>
                                      <div className="text-xs text-gray-500">{msg.phone}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                      <div className="text-sm text-gray-600 line-clamp-3 max-w-md whitespace-pre-wrap">{msg.message}</div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "comms" && (
                    <motion.div 
                      key="comms" 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-10"
                    >
                      <div className="grid lg:grid-cols-2 gap-8">
                        {/* Dispatch Centre */}
                        <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm">
                          <h3 className="font-serif text-2xl text-gray-900 mb-8">Dispatch <span className="italic font-light">Centre</span></h3>
                          <form onSubmit={handleSendAnnouncement} className="space-y-6">
                            <div>
                              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Target Audience</label>
                              <select 
                                value={newAnnouncement.target_role} 
                                onChange={(e) => setNewAnnouncement({...newAnnouncement, target_role: e.target.value})} 
                                className="w-full bg-[#f8f9fa] border-none p-4 rounded-xl outline-none" 
                                required
                              >
                                <option value="teacher">Faculty (Teachers)</option>
                                <option value="all_students_parents">All Students & Parents</option>
                                <option value="student">Students Only</option>
                                <option value="parent">Parents Only</option>
                                <option value="all">All Registered Users</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Subject / Title</label>
                              <input 
                                type="text" 
                                value={newAnnouncement.title} 
                                onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} 
                                className="w-full bg-[#f8f9fa] border-none p-4 rounded-xl outline-none" 
                                placeholder="e.g. End of Term Briefing"
                                required 
                              />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Message Content</label>
                              <textarea 
                                value={newAnnouncement.content} 
                                onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})} 
                                className="w-full bg-[#f8f9fa] border-none p-4 rounded-xl outline-none h-32 resize-none" 
                                placeholder="Draft your message here..."
                                required 
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Type</label>
                                <select 
                                  value={newAnnouncement.type} 
                                  onChange={(e) => setNewAnnouncement({...newAnnouncement, type: e.target.value})} 
                                  className="w-full bg-[#f8f9fa] border-none p-2 rounded-lg outline-none text-xs"
                                >
                                  <option value="notification">Notification</option>
                                  <option value="announcement">Announcement</option>
                                  <option value="alert">Alert (Urgent)</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Priority</label>
                                <select 
                                  value={newAnnouncement.priority} 
                                  onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value})} 
                                  className="w-full bg-[#f8f9fa] border-none p-2 rounded-lg outline-none text-xs"
                                >
                                  <option value="normal">Normal</option>
                                  <option value="high">High</option>
                                  <option value="urgent">Urgent</option>
                                </select>
                              </div>
                            </div>
                            <button 
                              type="submit" 
                              disabled={sendingComms} 
                              className="w-full py-5 bg-[#1a1a1a] text-[#c9a962] text-[10px] tracking-[0.4em] uppercase font-bold rounded-xl hover:bg-[#c9a962] hover:text-white transition-all duration-500 shadow-xl shadow-[#1a1a1a]/10 flex items-center justify-center gap-3"
                            >
                              <Send size={16} />
                              {sendingComms ? "DISPATCHING..." : "EXECUTE DISPATCH"}
                            </button>
                          </form>
                        </div>

                        <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
                          <div className="w-20 h-20 rounded-full bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962]">
                            <Megaphone size={40} />
                          </div>
                          <div>
                            <h4 className="font-serif text-xl text-gray-900 mb-2">Global Broadcast</h4>
                            <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                              Messages sent here are stored in the user portals and dispatched via email. Use "Alert" type for critical operational updates.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                          <h3 className="font-serif text-xl text-gray-900">Communication History</h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {announcements.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 italic">No communications logged in history.</div>
                          ) : (
                            announcements.map(a => (
                              <div key={a.id} className="p-8 hover:bg-gray-50/50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                      a.priority === 'urgent' ? 'bg-red-100 text-red-600' : 
                                      a.priority === 'high' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                      {a.priority}
                                    </span>
                                    <h4 className="font-bold text-gray-900">{a.title}</h4>
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                    {new Date(a.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{a.content}</p>
                                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                  <span>Target: {a.target_role}</span>
                                  <span>Type: {a.type}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Teacher Info Modal */}
      <AnimatePresence>
        {selectedTeacher && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-10 max-w-lg w-full shadow-2xl border border-gray-100 relative"
            >
              <button 
                onClick={() => { setSelectedTeacher(null); setRevealPassword(false); }}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-6 mb-10">
                <div className="w-20 h-20 rounded-full bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] text-3xl font-bold border-2 border-[#c9a962]/20">
                  {selectedTeacher.profile.full_name[0]}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedTeacher.profile.full_name}</h3>
                  <p className="text-[#c9a962] font-bold uppercase tracking-widest text-[10px]">{selectedTeacher.department} Faculty</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Email Address</label>
                  <div className="flex items-center gap-2 text-gray-900 font-medium bg-gray-50 p-4 rounded-xl">
                    <Mail size={16} className="text-[#c9a962]" />
                    {selectedTeacher.profile.email}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Security Key</label>
                  <div className="flex items-center justify-between gap-2 text-gray-900 font-medium bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-[#c9a962]" />
                      <span className="font-mono">
                        {revealPassword ? (selectedTeacher.profile.plain_password || "No password stored") : "••••••••••••"}
                      </span>
                    </div>
                    <button 
                      onClick={() => setRevealPassword(!revealPassword)}
                      className="p-2 hover:bg-[#c9a962]/10 rounded-lg text-[#c9a962] transition-colors"
                    >
                      {revealPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Join Date</label>
                    <p className="text-gray-900 font-medium">{new Date(selectedTeacher.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Role</label>
                    <p className="text-gray-900 font-medium uppercase text-xs tracking-wider">Teacher</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => { setSelectedTeacher(null); setRevealPassword(false); }}
                className="w-full mt-10 py-4 border-2 border-gray-100 text-gray-400 text-[10px] tracking-[0.4em] uppercase font-bold rounded-xl hover:bg-gray-50 hover:text-gray-600 transition-all"
              >
                CLOSE DOSSIER
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Student Info Modal */}
        <AnimatePresence>
          {selectedStudent && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-3xl p-10 max-w-4xl w-full shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto custom-scrollbar"
              >
                <button 
                  onClick={() => { setSelectedStudent(null); setRevealPassword(false); }}
                  className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                >
                  <X size={20} />
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-10 border-b border-gray-100">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] text-3xl font-bold border-2 border-[#c9a962]/20">
                      {selectedStudent.profile?.full_name?.[0] || "S"}
                    </div>
                    <div>
                      <h3 className="text-3xl font-serif text-gray-900 mb-1">{selectedStudent.profile?.full_name}</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-[#c9a962]/10 text-[#c9a962] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{selectedStudent.student_number}</span>
                        <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest font-mono">ID: {selectedStudent.id.slice(0,8)}</span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${selectedStudent.payment_status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                          {selectedStudent.payment_status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Enrolled On</p>
                    <p className="text-sm font-medium text-gray-900">{new Date(selectedStudent.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-12">
                  <div className="md:col-span-2 space-y-12">
                    {/* Student Details Section */}
                    <section>
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#c9a962] font-bold mb-6 flex items-center gap-2">
                        <User size={14} /> Student Profile
                      </h4>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Gender</label>
                          <p className="text-gray-900 font-medium">{selectedStudent.gender || "Not specified"}</p>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Date of Birth</label>
                          <p className="text-gray-900 font-medium">
                            {selectedStudent.date_of_birth ? new Date(selectedStudent.date_of_birth).toLocaleDateString('en-AU') : "Not specified"}
                          </p>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Year Level</label>
                          <p className="text-gray-900 font-medium">Year {selectedStudent.grade_level}</p>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">School</label>
                          <p className="text-gray-900 font-medium">{selectedStudent.school_name || "Not specified"}</p>
                        </div>
                      </div>
                    </section>

                    {/* Enrollment Details Section */}
                    <section>
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#c9a962] font-bold mb-6 flex items-center gap-2">
                        <BookOpen size={14} /> Academic Selection
                      </h4>
                      <div className="bg-[#f8f9fa] p-8 rounded-2xl border border-gray-100 space-y-6">
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Subject</label>
                            <p className="text-gray-900 font-bold">{selectedStudent.selected_subject}</p>
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Course</label>
                            <p className="text-gray-900 font-bold">{selectedStudent.selected_course}</p>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-gray-200/50 flex justify-between items-center">
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Preferred Class Time</label>
                            <p className="text-sm font-medium text-gray-700">
                              {classes.find(c => c.id === selectedStudent.preferred_class)?.day_of_week || "Manual"} 
                              {" "}
                              {classes.find(c => c.id === selectedStudent.preferred_class)?.start_time || ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Payment Method</label>
                            <p className="text-xs font-bold uppercase tracking-widest text-[#c9a962]">{selectedStudent.payment_method?.replace('_', ' ') || 'Stripe'}</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Security & Access Section */}
                    <section>
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#c9a962] font-bold mb-6 flex items-center gap-2">
                        <Shield size={14} /> Security & Portal Access
                      </h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Student Portal Login</label>
                          <p className="text-xs font-medium text-gray-900 mb-2 truncate">{selectedStudent.profile?.email}</p>
                          <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-gray-200">
                            <span className="font-mono text-xs text-gray-600">
                              {revealPassword ? (selectedStudent.profile?.plain_password || "N/A") : "••••••••••••"}
                            </span>
                            <button 
                              onClick={() => setRevealPassword(!revealPassword)}
                              className="p-1 hover:bg-[#c9a962]/10 rounded text-[#c9a962]"
                            >
                              {revealPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Guardian Side Panel */}
                  <div className="space-y-12">
                    <section>
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#c9a962] font-bold mb-6 flex items-center gap-2">
                        <Users size={14} /> Guardian Nexus
                      </h4>
                      <div className="space-y-6">
                        {selectedStudent.parents?.map((p, i) => (
                          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] font-bold">
                                {p.profile?.full_name?.[0] || "G"}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{p.profile?.full_name}</p>
                                <p className="text-[9px] text-[#c9a962] font-bold uppercase tracking-widest">{p.relationship_type || "Primary Guardian"}</p>
                              </div>
                            </div>

                            <div className="space-y-3 pt-2">
                              <div className="flex items-center gap-3 text-xs text-gray-600">
                                <Mail size={14} className="text-gray-400 shrink-0" />
                                <span className="truncate">{p.profile?.email}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-600">
                                <Clock size={14} className="text-gray-400 shrink-0" />
                                <span>{p.profile?.parent_details?.phone || "No phone listed"}</span>
                              </div>
                              {p.profile?.parent_details?.occupation && (
                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                  <Briefcase size={14} className="text-gray-400 shrink-0" />
                                  <span>{p.profile.parent_details.occupation}</span>
                                </div>
                              )}
                              <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <label className="text-[8px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Residential Address</label>
                                <p className="text-[11px] text-gray-700 leading-relaxed">
                                  {p.profile?.parent_details?.address}<br />
                                  {p.profile?.parent_details?.suburb} {p.profile?.parent_details?.state} {p.profile?.parent_details?.postcode}
                                </p>
                              </div>
                              <div className="pt-2">
                                <label className="text-[8px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Referral Source</label>
                                <p className="text-[10px] font-medium text-gray-600 italic">"{p.profile?.parent_details?.referral_source || "Direct"}"</p>
                              </div>
                              <div className="pt-2 border-t border-gray-100">
                                <label className="text-[8px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Portal Password</label>
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] text-gray-400">
                                    {revealPassword ? p.profile?.plain_password : "••••••••"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>

                <div className="mt-16 pt-10 border-t border-gray-100 flex justify-center">
                  <button 
                    onClick={() => { setSelectedStudent(null); setRevealPassword(false); }}
                    className="px-20 py-5 bg-[#1a1a1a] text-[#c9a962] text-[10px] tracking-[0.4em] uppercase font-bold rounded-xl hover:bg-[#c9a962] hover:text-white transition-all shadow-xl shadow-[#1a1a1a]/10"
                  >
                    DISMISS DOSSIER
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Removal Confirmation Modal */}
      <AnimatePresence>
        {deletingTeacher && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-red-100"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                  <Trash2 size={24} />
                </div>
                <button 
                  onClick={() => { setDeletingTeacher(null); setConfirmName(""); }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Faculty Removal</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                You are about to terminate the faculty profile for <span className="font-bold text-gray-900">{deletingTeacher.profile.full_name}</span>. This action is permanent and will revoke all access.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">
                    Type <span className="text-gray-900">"{deletingTeacher.profile.full_name}"</span> to confirm
                  </label>
                  <input 
                    type="text"
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-medium"
                    placeholder="Exact name required"
                  />
                </div>

                <button 
                  onClick={handleRemoveTeacher}
                  disabled={removing || confirmName !== deletingTeacher.profile.full_name}
                  className="w-full py-4 bg-red-600 text-white text-[10px] tracking-[0.4em] uppercase font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:shadow-none"
                >
                  {removing ? "TERMINATING..." : "EXECUTE TERMINATION"}
                </button>
                <button 
                  onClick={() => { setDeletingTeacher(null); setConfirmName(""); }}
                  className="w-full py-4 text-gray-400 text-[10px] tracking-[0.4em] uppercase font-bold hover:text-gray-600 transition-colors"
                >
                  ABORT OPERATION
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
