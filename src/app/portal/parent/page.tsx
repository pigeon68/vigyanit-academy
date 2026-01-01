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
  MoreVertical, ChevronRight, Download, Plus, Users, User, Bell
} from "lucide-react";

interface Child {
  id: string;
  student_number: string;
  grade_level: number;
  profile: { full_name: string; email: string };
    results: Array<{ id: string; test_name: string; score: number; max_score: number; date: string; course: { name: string } }>;
    enrolments: Array<{ course: { name: string; code: string } }>;
  }

export default function ParentPortal() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
    const [parentId, setParentId] = useState("");
    const [children, setChildren] = useState<Child[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"individual" | "compare">("individual");
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role, email, id")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "parent") { router.push("/login"); return; }
      setParentName(profile.full_name);
      setParentEmail(profile.email || "");
      setParentId(profile.id);

      const { data: parent } = await supabase
        .from("parents")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (!parent) { setLoading(false); return; }

      const { data: childrenData } = await supabase
        .from("parent_student")
        .select(`student:students (id, student_number, grade_level, profile:profiles(full_name, email))`)
        .eq("parent_id", parent.id);

        if (childrenData && childrenData.length > 0) {
          const childIds = childrenData.map((c: any) => c.student.id);
          const { data: resultsData } = await supabase
            .from("test_scores")
            .select(`id, test_name, score, max_score, date, student_id, course:courses (name)`)
            .in("student_id", childIds)
            .order("date", { ascending: false });
          
              const { data: enrolmentsData } = await supabase
                .from("enrolments")
                .select(`student_id, course:courses (name, code)`)
              .in("student_id", childIds)
              .eq("status", "active");
  
            const childrenWithData = childrenData.map((c: any) => ({
              ...c.student,
              results: resultsData?.filter((r: any) => r.student_id === c.student.id) || [],
              enrolments: enrolmentsData?.filter((e: any) => e.student_id === c.student.id) || []
            }));

          setChildren(childrenWithData);
          if (childrenWithData.length > 0) setSelectedChild(childrenWithData[0].id);
        }

        const { data: announcementsData } = await supabase
          .from("announcements")
          .select("*")
          .in("target_role", ["parent", "all", "all_students_parents"])
          .order("created_at", { ascending: false });
        
        setAnnouncements(announcementsData || []);
        setLoading(false);
      }
      loadData();
    }, [router, supabase]);

  const currentChild = children.find((c) => c.id === selectedChild);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="text-[#c9a962] font-serif text-2xl italic tracking-widest">Accessing Guardian Console...</div>
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
                  <p className="text-sm font-bold text-gray-900 leading-none mb-1">{parentName}</p>
                  <p className="text-[10px] text-[#c9a962] uppercase tracking-widest font-bold">Guardian</p>
                </div>
                <div 
                  className="w-10 h-10 rounded-full bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] font-bold border border-[#c9a962]/20 cursor-pointer"
                  onClick={() => {
                    setShowProfile(true);
                  }}
                  title="View Profile"
                >
                  {parentName[0]}
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
                <h2 className="text-2xl font-bold text-gray-800">Guardian Profile</h2>
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
                    {parentName[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{parentName}</h3>
                    <p className="text-[#c9a962] font-bold uppercase tracking-widest text-xs">Verified Guardian</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Full Name</label>
                    <p className="text-gray-900 font-medium">{parentName}</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Email Address</label>
                    <p className="text-gray-900 font-medium">{parentEmail}</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Role</label>
                    <p className="text-gray-900 font-medium">Parent/Guardian</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Reference ID</label>
                    <p className="text-gray-900 font-medium">{parentId.slice(0, 8).toUpperCase()}</p>
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
                      <h2 className="text-2xl font-bold text-gray-800">Guardian Command Centre</h2>
                      <p className="text-gray-500 text-sm mt-1">Monitoring scholastic progress for your registered scholars.</p>
                    </div>
                  <div className="flex gap-4 p-1 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    {["individual", "compare"].map(mode => (
                      <button 
                        key={mode} 
                        onClick={() => setViewMode(mode as any)} 
                        className={`px-6 py-2 text-[10px] tracking-widest uppercase font-bold transition-all rounded-xl ${viewMode === mode ? 'bg-[#1a1a1a] text-[#c9a962]' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {mode === "individual" ? "Focused View" : "Comparative Analysis"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notice Board */}
                {announcements.length > 0 && (
                  <div className="bg-[#1a1a1a] rounded-3xl p-8 border border-[#c9a962]/20 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Bell size={120} className="text-[#c9a962]" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-[#c9a962] font-bold mb-4 text-xs uppercase tracking-[0.2em]">
                            <Bell size={14} />
                            <span>Recent Announcements</span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            {announcements.slice(0, 2).map(a => (
                                <div key={a.id} className="space-y-2">
                                    <h4 className="font-serif text-lg text-white">{a.title}</h4>
                                    <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">{a.content}</p>
                                    <span className="text-[10px] text-[#c9a962] font-bold uppercase tracking-widest">{new Date(a.created_at).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4">
                {children.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => { setSelectedChild(c.id); setViewMode("individual"); }} 
                    className={`flex-shrink-0 w-80 p-8 text-left rounded-3xl border transition-all duration-500 group relative overflow-hidden ${selectedChild === c.id && viewMode === "individual" ? 'bg-white border-[#c9a962] shadow-xl' : 'bg-white border-gray-100 hover:border-[#c9a962]/30 shadow-sm'}`}
                  >
                    <div className="relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] mb-4 font-bold">
                        {c.profile.full_name[0]}
                      </div>
                      <h3 className="font-serif text-2xl text-gray-900 mb-2">{c.profile.full_name}</h3>
                      <div className="flex items-center gap-3 text-[10px] tracking-widest uppercase text-[#c9a962] font-bold">
                        <span>Grade {c.grade_level}</span>
                        <div className="w-1 h-1 rounded-full bg-gray-200" />
                        <span className="text-gray-400">#{c.student_number}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {viewMode === "individual" && currentChild && (
                  <motion.div 
                    key="individual" 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-10"
                  >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { label: "Active Modules", value: currentChild.enrolments.length, icon: BookOpen },
                          { label: "Assessments", value: currentChild.results.length, icon: Award },
                            { 
                              label: "Efficiency Index", 
                              value: currentChild.results.length > 0 
                                ? `${Math.round(currentChild.results.reduce((acc, r) => acc + (r.score / r.max_score * 100), 0) / currentChild.results.length)}%` 
                                : "N/A",
                              icon: BarChart3
                            }
                        ].map((stat, i) => (
                        <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962]">
                              <stat.icon size={20} />
                            </div>
                            <span className="text-[10px] tracking-widest uppercase text-gray-400 font-bold">{stat.label}</span>
                          </div>
                          <div className="text-4xl font-serif text-gray-900">{stat.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        <section>
                          <h2 className="text-xl font-bold text-gray-800 mb-6">Current Curriculum</h2>
                          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="divide-y divide-gray-50">
                              {currentChild.enrolments.map((e, i) => (
                                <div key={i} className="p-6 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                  <div>
                                    <h4 className="font-bold text-gray-900">{e.course.name}</h4>
                                    <p className="text-[10px] tracking-widest text-gray-400 uppercase mt-1">{e.course.code}</p>
                                  </div>
                                  <div className="text-[#c9a962]"><ChevronRight size={18} /></div>
                                </div>
                              ))}
                              {currentChild.enrolments.length === 0 && (
                                <div className="p-12 text-center text-gray-400 italic">No active modules.</div>
                              )}
                            </div>
                          </div>
                        </section>

                        <section>
                          <h2 className="text-xl font-bold text-gray-800 mb-6">Performance Analysis</h2>
                          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="divide-y divide-gray-50">
                              {currentChild.results.slice(0, 5).map((r, i) => (
                                <div key={i} className="p-6 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                  <div>
                                    <div className="text-sm font-bold text-gray-900">{r.test_name}</div>
                                    <div className="text-[10px] tracking-widest text-gray-400 uppercase mt-1">{r.course.name}</div>
                                  </div>
                                  <div className="text-2xl font-serif text-[#c9a962]">{Math.round((r.score / r.max_score) * 100)}%</div>
                                </div>
                              ))}
                              {currentChild.results.length === 0 && (
                                <div className="p-12 text-center text-gray-400 italic">No assessments recorded.</div>
                              )}
                            </div>
                          </div>
                        </section>
                    </div>
                  </motion.div>
                )}

                {viewMode === "compare" && (
                  <motion.div 
                    key="compare" 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                      <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-xl font-bold text-gray-800">Comparative Scholastic Matrix</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-gray-50">
                              <th className="px-8 py-6 text-[10px] tracking-widest font-bold uppercase text-gray-400">Scholar Profile</th>
                              <th className="px-8 py-6 text-center text-[10px] tracking-widest font-bold uppercase text-gray-400">Level</th>
                              <th className="px-8 py-6 text-center text-[10px] tracking-widest font-bold uppercase text-gray-400">Total Records</th>
                              <th className="px-8 py-6 text-right text-[10px] tracking-widest font-bold uppercase text-gray-400">Avg Efficiency</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                              {children.map(c => {
                                const avg = c.results.length > 0 ? Math.round(c.results.reduce((acc, r) => acc + (r.score / r.max_score * 100), 0) / c.results.length) : 0;
                                return (
                                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-8 py-8">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] text-xs font-bold">
                                          {c.profile.full_name[0]}
                                        </div>
                                        <span className="font-bold text-gray-900">{c.profile.full_name}</span>
                                      </div>
                                    </td>
                                    <td className="px-8 py-8 text-center">
                                      <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-600">Grade {c.grade_level}</span>
                                    </td>
                                    <td className="px-8 py-8 text-center text-xl font-serif text-gray-900">{c.results.length}</td>
                                    <td className="px-8 py-8 text-right text-3xl font-serif text-[#c9a962]">{avg}%</td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
