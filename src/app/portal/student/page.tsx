"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { 
  Mail, Calendar as CalendarIcon, 
  CheckSquare, BookOpen, 
  LogOut, ChevronLeft,
  FileText, Award, BarChart3, Clock,
  MoreVertical, ChevronRight, Download, Bell
} from "lucide-react";

interface ClassEnrolment {
  class_id: string;
  enrolled_at: string;
  class: {
    id: string;
    name: string;
    code: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    course: {
      id: string;
      name: string;
      description: string;
    };
    teacher: {
      id: string;
      profile: {
        id: string;
        full_name: string;
      };
    };
  };
}

interface Result {
  id: string;
  test_name: string;
  score: number;
  max_score: number;
  date: string;
  course: {
    name: string;
  };
}

interface ClassContent {
  id: string;
  title: string;
  description: string;
  content_type: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
  course?: {
    name: string;
  };
  class?: {
    name: string;
  };
}

interface Teacher {
  id: string;
  full_name: string;
  profile_id: string;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender: {
    full_name: string;
  };
}

export default function StudentPortal() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
    const [studentName, setStudentName] = useState("");
    const [studentEmail, setStudentEmail] = useState("");
    const [studentNumber, setStudentNumber] = useState("");
    const [studentProfileId, setStudentProfileId] = useState("");
  const [classEnrolments, setClassEnrolments] = useState<ClassEnrolment[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [classContent, setClassContent] = useState<ClassContent[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showMessages, setShowMessages] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Calendar logic
  const [calendarData, setCalendarData] = useState<{
    today: Date;
    daysInMonth: number;
    firstDayOfMonth: number;
    currentMonth: number;
    currentYear: number;
  } | null>(null);

  useEffect(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    setCalendarData({
      today,
      currentMonth,
      currentYear,
      daysInMonth: new Date(currentYear, currentMonth + 1, 0).getDate(),
      firstDayOfMonth: new Date(currentYear, currentMonth, 1).getDay()
    });

    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setStudentProfileId(user.id);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, role, email")
          .eq("id", user.id)
          .maybeSingle();
  
        if (profileError || !profile || profile.role !== "student") { 
          console.error("Profile error:", profileError);
          router.push("/login"); 
          return; 
        }
        setStudentName(profile.full_name || "Student");
        setStudentEmail(profile.email || "");
  
        const { data: student, error: studentError } = await supabase
          .from("students")
          .select("id, student_number")
          .eq("profile_id", user.id)
          .maybeSingle();
  
        if (studentError) console.error("Student record error:", studentError);
        // If no student record exists, we can still show the profile, but most features will be empty
        setStudentNumber(student?.student_number || "Not Assigned");

        // Fetch Class Enrolments - class_students uses profile_id in this DB
        const { data: enrolmentsData, error: enrolError } = await supabase
          .from("class_students")
          .select(`
            class_id, 
            enrolled_at,
            class:classes (
              id, name, code, day_of_week, start_time, end_time,
              course:courses (id, name, description),
              teacher:teachers (id, profile:profiles (id, full_name))
            )
          `)
          .eq("student_id", user.id);

        if (enrolError) console.error("Enrolment error:", enrolError);

        if (enrolmentsData && enrolmentsData.length > 0) {
          setClassEnrolments(enrolmentsData as any);
          
          const uniqueTeachers = new Map();
          const courseIds = enrolmentsData.map((e: any) => e.class.course.id).filter(Boolean);
          const classIds = enrolmentsData.map((e: any) => e.class.id).filter(Boolean);
          
          enrolmentsData.forEach((e: any) => {
            if (e.class.teacher && e.class.teacher.profile) {
              uniqueTeachers.set(e.class.teacher.id, {
                id: e.class.teacher.id,
                full_name: e.class.teacher.profile.full_name,
                profile_id: e.class.teacher.profile.id
              });
            }
          });
          setTeachers(Array.from(uniqueTeachers.values()));

          // Fetch Content for enrolled classes or courses
          // Guard against empty IDs to avoid PostgREST syntax error
          if (courseIds.length > 0 || classIds.length > 0) {
            let query = supabase
              .from("class_content")
              .select(`
                id, title, description, content_type, file_url, file_size, uploaded_at, 
                course:courses (name),
                class:classes (name)
              `);
            
            const orFilters = [];
            if (courseIds.length > 0) orFilters.push(`course_id.in.(${courseIds.join(',')})`);
            if (classIds.length > 0) orFilters.push(`class_id.in.(${classIds.join(',')})`);
            
            if (orFilters.length > 0) {
              query = query.or(orFilters.join(','));
            }

            const { data: contentData } = await query.order("uploaded_at", { ascending: false });
            
            // Normalize course and class relations (Supabase returns arrays)
            const normalized = (contentData || []).map((item: any) => ({
              ...item,
              course: Array.isArray(item.course) ? item.course[0] : item.course,
              class: Array.isArray(item.class) ? item.class[0] : item.class,
            }));
            
            setClassContent(normalized);
          }
        }

        // Test scores might use student.id or profile_id. 
        // Given class_students uses profile_id, we check both or prioritize profile_id if that's the pattern
        const studentIdToUse = student?.id || user.id;
        const { data: resultsData } = await supabase
          .from("test_scores")
          .select(`id, test_name, score, max_score, date, course:courses (name)`)
          .or(`student_id.eq.${user.id},student_id.eq.${studentIdToUse}`)
          .order("date", { ascending: false });

        // Normalize results course relation
        const normalizedResults = (resultsData || []).map((result: any) => ({
          ...result,
          course: Array.isArray(result.course) ? result.course[0] : result.course,
        }));

        const { data: messagesData } = await supabase
          .from("messages")
          .select(`id, content, created_at, sender:profiles!messages_sender_id_fkey (full_name)`)
          .eq("receiver_id", user.id)
          .order("created_at", { ascending: false });

        // Normalize messages sender relation
        const normalizedMessages = (messagesData || []).map((msg: any) => ({
          ...msg,
          sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender,
        }));

        const { data: announcementsData } = await supabase
          .from("announcements")
          .select("*")
          .in("target_role", ["student", "all", "all_students_parents"])
          .order("created_at", { ascending: false });


      setResults(normalizedResults);
      setMessages(normalizedMessages);
      setAnnouncements(announcementsData || []);
      setLoading(false);
    }
    loadData();
  }, [router, supabase]);

  const sendMessage = async () => {
    if (!selectedTeacher || !message.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: studentProfileId,
      receiver_id: selectedTeacher.profile_id,
      content: message
    });

    if (!error) {
      setMessage("");
      setIsMessagingOpen(false);
      alert("Message sent successfully!");
    } else {
      alert("Failed to send message.");
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="text-[#c9a962] font-serif text-2xl italic">Syncing Scholastic Records...</div>
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
              <button 
                onClick={() => setShowMessages(!showMessages)}
                className={`transition-colors relative ${showMessages ? 'text-[#c9a962]' : 'hover:text-[#c9a962]'}`}
              >
                <Mail size={20} />
                {messages.length > 0 && !showMessages && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#c9a962] rounded-full" />
                )}
              </button>
              <div className="flex items-center gap-3 border-l pl-6">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 leading-none mb-1">{studentName}</p>
                  <p className="text-[10px] text-[#c9a962] uppercase tracking-widest font-bold">Scholar</p>
                </div>
                <div 
                  className="w-10 h-10 rounded-full bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] font-bold border border-[#c9a962]/20 cursor-pointer"
                  onClick={() => {
                    setShowProfile(true);
                    setShowMessages(false);
                  }}
                  title="View Profile"
                >
                  {studentName[0]}
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
                <h2 className="text-2xl font-bold text-gray-800">Scholar Profile</h2>
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
                    {studentName[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{studentName}</h3>
                    <p className="text-[#c9a962] font-bold uppercase tracking-widest text-xs">Active Scholar</p>
                  </div>
                </div>
                
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Full Name</label>
                      <p className="text-gray-900 font-medium">{studentName}</p>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Student ID</label>
                      <p className="text-gray-900 font-medium">{studentNumber}</p>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Role</label>
                      <p className="text-gray-900 font-medium">Student</p>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">System Identifier</label>
                      <p className="text-gray-900 font-medium">{studentProfileId.slice(0, 8).toUpperCase()}</p>
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
          ) : showMessages ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Academic Correspondence</h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsMessagingOpen(true)}
                    className="text-sm bg-[#1a1a1a] text-[#c9a962] px-6 py-2 rounded-full font-bold border border-[#c9a962]/30"
                  >
                    Compose Message
                  </button>
                  <button 
                    onClick={() => setShowMessages(false)}
                    className="text-sm text-[#c9a962] font-bold hover:underline"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {messages.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 italic">No messages received.</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {messages.map((msg) => (
                      <div key={msg.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-gray-900">{msg.sender.full_name}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-10">
                  {/* Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: "Enrolled Classes", value: classEnrolments.length, icon: BookOpen },
                      { label: "Assessments", value: results.length, icon: Award },
                        { 
                          label: "Performance", 
                          value: results.length > 0 
                            ? `${Math.round((results.reduce((acc, r) => acc + (r.score / r.max_score * 100), 0) / results.length))}%`
                            : "N/A",
                          icon: BarChart3
                        }
                    ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
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

                {/* Enrolled Classes */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">My Classes</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {classEnrolments.map((enrolment) => (
                      <motion.div
                        key={enrolment.class.id}
                        whileHover={{ y: -4 }}
                        onClick={() => router.push(`/portal/student/class/${enrolment.class.id}`)}
                        className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm cursor-pointer group hover:border-[#c9a962]/30 transition-all"
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-[#1a1a1a] flex items-center justify-center text-[#c9a962] font-serif italic text-xl">
                            {enrolment.class.code?.[0] || enrolment.class.name[0]}
                          </div>
                          <ChevronRight className="text-gray-300 group-hover:text-[#c9a962] transition-colors" size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{enrolment.class.name}</h3>
                        <p className="text-[10px] text-[#c9a962] uppercase tracking-widest font-bold mb-4">{enrolment.class.code || "MATH-CLS"}</p>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-6">{enrolment.class.course.description}</p>
                        
                        <div className="mb-6 flex items-center gap-4">
                          <div className="bg-[#fafaf9] px-3 py-1.5 rounded-lg border border-gray-100 flex items-center gap-2">
                            <Clock size={12} className="text-[#c9a962]" />
                            <span className="text-[10px] font-bold text-gray-600 uppercase">{enrolment.class.day_of_week} {enrolment.class.start_time}</span>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-gray-50 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-[#c9a962]">
                            {enrolment.class.teacher?.profile?.full_name?.[0] || "T"}
                          </div>
                          <span className="text-xs text-gray-600 font-medium">
                            {enrolment.class.teacher?.profile?.full_name || "Unassigned"}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                      {classEnrolments.length === 0 && (
                        <div className="col-span-2 p-12 text-center text-gray-400 italic bg-white rounded-3xl border border-gray-100 shadow-sm">
                          Not enrolled in any classes yet.
                        </div>
                      )}
                  </div>
                </section>

                {/* Resources */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Digital Resources</h2>
                  </div>
                  
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    {classContent.length === 0 ? (
                      <div className="p-12 text-center text-gray-400 italic">No module documents found.</div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {classContent.map((content) => (
                          <div key={content.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                                <FileText size={20} className="text-[#c9a962]" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{content.title}</p>
                                <p className="text-xs text-gray-400">
                                  {content.class?.name || content.course?.name} • {content.content_type}
                                </p>
                              </div>
                            </div>
                            <a 
                              href={content.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-[#c9a962]/10 rounded-full transition-colors text-[#c9a962]"
                            >
                              <Download size={20} />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                {/* Feedback */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Academic Feedback</h2>
                  </div>
                  
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {results.slice(0, 4).map((r) => (
                        <div key={r.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-sm font-bold text-gray-900">{r.test_name}</p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">{r.course.name}</p>
                            </div>
                            <div className="text-lg font-serif text-[#c9a962]">
                              {Math.round((r.score / r.max_score) * 100)}%
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 font-medium">
                            Date: {new Date(r.date).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                      {results.length === 0 && (
                        <div className="col-span-2 p-12 text-center text-gray-400 italic bg-white rounded-3xl border border-gray-100 shadow-sm">
                          No analysis performed yet.
                        </div>
                      )}
                    </div>
                </section>
              </div>

                <div className="w-full lg:w-80 space-y-6">
                  {/* Notifications */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-800 font-bold mb-4">
                      <Bell size={18} className="text-[#c9a962]" />
                      <span>Announcements</span>
                    </div>
                    <div className="space-y-4">
                      {announcements.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No new announcements.</p>
                      ) : (
                        announcements.slice(0, 3).map(a => (
                          <div key={a.id} className="p-3 bg-gray-50 rounded-xl border border-transparent hover:border-[#c9a962]/20 transition-all">
                            <h4 className="text-xs font-bold text-gray-900 mb-1">{a.title}</h4>
                            <p className="text-[10px] text-gray-500 line-clamp-2">{a.content}</p>
                            <span className="text-[8px] text-[#c9a962] font-bold uppercase tracking-widest mt-2 block">
                              {new Date(a.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2 text-gray-800 font-bold">
                        <CalendarIcon size={18} />
                        <span>{calendarData ? calendarData.today.toLocaleDateString('default', { month: 'long', year: 'numeric' }) : 'Academic Calendar'}</span>
                      </div>
                      <button 
                        onClick={() => router.push("/portal/student/calendar")}
                        className="text-xs text-[#c9a962] font-bold hover:underline"
                      >
                        View Full
                      </button>
                    </div>
                    <div className="text-center">
                      <div className="grid grid-cols-7 text-[10px] font-bold text-gray-400 mb-4 uppercase">
                        <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-xs">
                        {calendarData && (
                          <>
                            {/* Empty cells for the first week */}
                            {Array.from({ length: calendarData.firstDayOfMonth }).map((_, i) => (
                              <div key={`empty-${i}`} className="w-8 h-8" />
                            ))}
                            {/* Days of the month */}
                            {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
                              const day = i + 1;
                              const isToday = day === calendarData.today.getDate() && calendarData.currentMonth === calendarData.today.getMonth();
                              const date = new Date(calendarData.currentYear, calendarData.currentMonth, day);
                              const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
                              const hasClass = classEnrolments.some(e => e.class.day_of_week === dayOfWeek);

                              return (
                                <div 
                                  key={day} 
                                  className={`w-8 h-8 flex flex-col items-center justify-center rounded-lg transition-colors relative ${
                                    isToday 
                                      ? "bg-[#1a1a1a] text-[#c9a962] font-bold" 
                                      : "hover:bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  <span>{day}</span>
                                  {hasClass && (
                                    <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isToday ? 'bg-[#c9a962]' : 'bg-[#c9a962]'}`} />
                                  )}
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </main>

      {/* Messaging Modal */}
      <AnimatePresence>
        {isMessagingOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg p-10 lg:p-12 shadow-2xl relative rounded-3xl"
            >
              <button 
                onClick={() => setIsMessagingOpen(false)}
                className="absolute top-8 right-8 text-gray-400 hover:text-black transition-colors"
              >
                <ChevronLeft size={24} />
              </button>

              <h2 className="font-serif text-3xl mb-8 text-[#1a1a1a]">Compose <span className="italic font-light">Message</span></h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] tracking-widest uppercase text-[#71717a] font-bold block mb-3">Recipient</label>
                  <select 
                    className="w-full bg-[#fafaf9] border border-[#e5e5e5] p-4 text-sm focus:border-[#c9a962] outline-none transition-colors rounded-xl"
                    onChange={(e) => setSelectedTeacher(teachers.find(t => t.id === e.target.value) || null)}
                  >
                    <option value="">Select Faculty Member</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] tracking-widest uppercase text-[#71717a] font-bold block mb-3">Your Message</label>
                  <textarea 
                    rows={6}
                    className="w-full bg-[#fafaf9] border border-[#e5e5e5] p-4 text-sm focus:border-[#c9a962] outline-none transition-colors resize-none rounded-xl"
                    placeholder="Type your message to faculty..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <button
                  onClick={sendMessage}
                  disabled={sending || !selectedTeacher || !message.trim()}
                  className="w-full py-5 bg-[#1a1a1a] text-[#fafaf9] text-[10px] tracking-[0.4em] uppercase font-bold hover:bg-[#c9a962] transition-all duration-500 disabled:opacity-50 rounded-xl shadow-xl shadow-[#1a1a1a]/10"
                >
                  {sending ? "Transmitting..." : "Send Message"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
