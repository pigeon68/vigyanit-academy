"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  Mail, Calendar as CalendarIcon, 
  CheckSquare, Megaphone, Home, BookOpen, 
  FileText, Settings, 
  HelpCircle, LogOut, ChevronRight, MoreVertical,
  Plus, ChevronLeft, FolderOpen, Bell
} from "lucide-react";

interface Class {
  id: string;
  name: string;
  code: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
    course: {
      name: string;
      code: string;
      id: string;
    };
  }

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender: {
    full_name: string;
  };
}

export default function TeacherPortal() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showMessages, setShowMessages] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseContent, setCourseContent] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

    useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role, email")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "teacher") { router.push("/login"); return; }
      setTeacherName(profile.full_name);
      setTeacherEmail(profile.email || "");

      const { data: teacher } = await supabase
        .from("teachers")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (!teacher) { setLoading(false); return; }
      setTeacherId(teacher.id);

        const { data: classesData } = await supabase
          .from("classes")
          .select(`
            id, name, code, day_of_week, start_time, end_time,
            course:courses(id, name, code)
          `)
          .eq("teacher_id", teacher.id);

        // Normalize course relations
        const normalizedClasses = (classesData || []).map((cls: any) => ({
          ...cls,
          course: Array.isArray(cls.course) ? cls.course[0] : cls.course,
        }));

        const { data: messagesData } = await supabase
          .from("messages")
          .select(`id, content, created_at, sender:profiles!messages_sender_id_fkey (full_name)`)
          .eq("receiver_id", user.id)
          .order("created_at", { ascending: false });

        // Normalize message sender relations
        const normalizedMessages = (messagesData || []).map((msg: any) => ({
          ...msg,
          sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender,
        }));

        const { data: announcementsData } = await supabase
          .from("announcements")
          .select("*")
          .in("target_role", ["teacher", "all"])
          .order("created_at", { ascending: false });

        setClasses(normalizedClasses);
        setMessages(normalizedMessages);
        setAnnouncements(announcementsData || []);
        setLoading(false);
      }
      loadData();
    }, [router, supabase]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedCourse) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${selectedCourse.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('class-content')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('class-content')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('class_content')
        .insert({
          course_id: selectedCourse.id,
          title: file.name,
          content_type: file.type,
          file_url: publicUrl,
          file_size: file.size,
          description: `Uploaded on ${new Date().toLocaleDateString()}`
        });

      if (dbError) throw dbError;

      // Refresh content
      const { data } = await supabase
        .from("class_content")
        .select("*")
        .eq("course_id", selectedCourse.id)
        .order("uploaded_at", { ascending: false });
      setCourseContent(data || []);
      
      alert("Material uploaded successfully.");
    } catch (error: any) {
      alert(`Error uploading: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="text-[#c9a962] font-serif text-2xl italic">Syncing Faculty Records...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      {/* Main Content */}
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
                  <p className="text-sm font-bold text-gray-900 leading-none mb-1">{teacherName}</p>
                  <p className="text-[10px] text-[#c9a962] uppercase tracking-widest font-bold">Faculty</p>
                </div>
                <div 
                  className="w-10 h-10 rounded-full bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] font-bold border border-[#c9a962]/20 cursor-pointer"
                  onClick={() => {
                    setShowProfile(true);
                    setShowMessages(false);
                    setSelectedCourse(null);
                  }}
                  title="View Profile"
                >
                  {teacherName[0]}
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
                <h2 className="text-2xl font-bold text-gray-800">Faculty Profile</h2>
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
                    {teacherName[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{teacherName}</h3>
                    <p className="text-[#c9a962] font-bold uppercase tracking-widest text-xs">Faculty Member</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Full Name</label>
                    <p className="text-gray-900 font-medium">{teacherName}</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Email Address</label>
                    <p className="text-gray-900 font-medium">{teacherEmail}</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Role</label>
                    <p className="text-gray-900 font-medium">Teacher</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Employee ID</label>
                    <p className="text-gray-900 font-medium">{teacherId.slice(0, 8).toUpperCase()}</p>
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
                <h2 className="text-2xl font-bold text-gray-800">Faculty Correspondence</h2>
                <button 
                  onClick={() => setShowMessages(false)}
                  className="text-sm text-[#c9a962] font-bold hover:underline"
                >
                  Return to Dashboard
                </button>
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
          ) : !selectedCourse ? (
            <div className="flex gap-8">
              <div className="flex-1 space-y-10">
                {/* Classes */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Assigned Classes</h2>
                    <button className="text-gray-400 hover:text-[#c9a962] transition-colors"><MoreVertical size={20} /></button>
                  </div>
                  
                    <div className="flex gap-2 mb-6">
                      <button className="px-6 py-2 bg-[#1a1a1a] text-[#c9a962] rounded-full text-sm font-bold flex items-center gap-2 border border-[#c9a962]/30">
                        Teaching <span className="bg-[#c9a962] text-white px-2 rounded-full">{classes.length}</span>
                      </button>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 w-16">#</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Name</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Class Code</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Schedule</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-center">Subject</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {classes.map((cls, idx) => (
                              <tr 
                                key={cls.id} 
                                className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                onClick={() => router.push(`/portal/teacher/class/${cls.id}`)}
                              >

                              <td className="px-6 py-4 text-sm text-gray-400">{idx + 1}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
                                    <BookOpen size={20} className="text-[#c9a962]" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-900">{cls.name}</p>
                                    <p className="text-xs text-gray-400">{cls.course.name}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-bold text-gray-900">{cls.code}</p>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {cls.day_of_week} {cls.start_time} - {cls.end_time}
                              </td>
                              <td className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                                {cls.course.code}
                              </td>
                            </tr>
                          ))}
                          {classes.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No classes assigned to you yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                </section>
              </div>

                {/* Right Sidebar - Stats */}
                <div className="w-80 space-y-6">
                  {/* Notifications */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-800 font-bold mb-4">
                      <Bell size={18} className="text-[#c9a962]" />
                      <span>Notifications</span>
                    </div>
                    <div className="space-y-4">
                      {announcements.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No new notifications.</p>
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

                  {/* Calendar */}
                  <div 
                    className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm cursor-pointer hover:border-[#c9a962]/50 transition-all"
                    onClick={() => router.push("/portal/teacher/calendar")}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2 text-gray-800 font-bold">
                        <CalendarIcon size={18} />
                        <span>Calendar</span>
                      </div>
                      <span className="text-[10px] text-[#c9a962] font-bold uppercase tracking-widest">View Full</span>
                    </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-between text-sm font-bold text-gray-800 mb-4">
                      <button className="text-gray-400 hover:text-gray-800"><ChevronLeft size={20} /></button>
                      <span>Dec 2025</span>
                      <button className="text-gray-400 hover:text-gray-800"><ChevronRight size={20} /></button>
                    </div>
                    <div className="grid grid-cols-7 text-[10px] font-bold text-gray-400 mb-4 uppercase">
                      <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-xs">
                      {Array.from({ length: 31 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                            i + 1 === 24 ? "bg-[#c9a962] text-white font-bold" : "hover:bg-gray-100"
                          }`}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedCourse(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                >
                  <ChevronLeft size={24} />
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedCourse.name}</h2>
                  <p className="text-sm text-gray-500">{selectedCourse.code} • Management Console</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Students Table */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">Enrolled Students</h3>
                      <span className="text-xs font-bold text-[#c9a962] bg-[#c9a962]/10 px-3 py-1 rounded-full">
                        {selectedCourse.enrolments.length} Active
                      </span>
                    </div>
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 w-16">#</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Student Name</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Student ID</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-right">Results</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {selectedCourse.enrolments.map((enrolment: any, idx: number) => (
                            <tr key={enrolment.student.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 text-sm text-gray-400">{idx + 1}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] text-xs font-bold">
                                    {enrolment.student.profile.full_name[0]}
                                  </div>
                                  <span className="text-sm font-bold text-gray-900">{enrolment.student.profile.full_name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">{enrolment.student.student_number}</td>
                              <td className="px-6 py-4 text-right">
                                <button className="text-[#c9a962] hover:underline text-sm font-bold">Results</button>
                              </td>
                            </tr>
                          ))}
                          {selectedCourse.enrolments.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">No students enrolled yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  {/* Content Management */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">Class Materials</h3>
                      <label className={`cursor-pointer flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full transition-all ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-[#1a1a1a] text-[#c9a962] hover:bg-[#c9a962] hover:text-white'}`}>
                        <Plus size={14} />
                        {uploading ? "Transmitting..." : "Upload"}
                        <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                      </label>
                    </div>
                    
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                      {courseContent.length === 0 ? (
                        <div className="text-center py-8 space-y-3">
                          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                            <FolderOpen size={24} />
                          </div>
                          <p className="text-xs text-gray-400 italic">No resources distributed yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {courseContent.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-[#f8f9fa] rounded-2xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#c9a962] border border-gray-100">
                                  <FileText size={18} />
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-sm font-bold text-gray-900 truncate">{item.title}</p>
                                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date(item.uploaded_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <a 
                                href={item.file_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 text-gray-400 hover:text-[#c9a962] transition-colors"
                              >
                                <ChevronRight size={18} />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
