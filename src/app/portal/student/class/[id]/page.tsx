"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  ChevronLeft, BookOpen, FileText, Download, 
  BarChart3, Clock, Calendar as CalendarIcon,
  Award, User, ExternalLink
} from "lucide-react";

interface ClassData {
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
    profile: {
      full_name: string;
    };
  };
}

interface Material {
  id: string;
  title: string;
  content_type: string;
  file_url: string;
  file_size: number;
  description: string;
  uploaded_at: string;
}

interface Score {
  id: string;
  test_name: string;
  score: number;
  max_score: number;
  date: string;
}

export default function StudentClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Fetch Class and Course Details
      const { data: clsData } = await supabase
        .from("classes")
        .select(`
          id, name, code, day_of_week, start_time, end_time,
          course:courses (id, name, description),
          teacher:teachers (profile:profiles (full_name))
        `)
        .eq("id", classId)
        .single();

      if (!clsData) {
        router.push("/portal/student");
        return;
      }

      // Normalize course relation (Supabase returns array)
      const normalized = {
        ...clsData,
        course: Array.isArray(clsData.course) ? clsData.course[0] : clsData.course,
        teacher: clsData.teacher && Array.isArray(clsData.teacher) ? clsData.teacher[0] : clsData.teacher,
      };
      setClassData(normalized as any);

      // Fetch Student Record for scores
      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (student) {
        // Fetch Materials (Class specific or Course specific)
        const { data: materialsData } = await supabase
          .from("class_content")
          .select("*")
          .or(`class_id.eq.${classId},course_id.eq.${normalized.course.id}`)
          .order("uploaded_at", { ascending: false });
        setMaterials(materialsData || []);

        // Fetch Scores for this course
        const { data: scoresData } = await supabase
          .from("test_scores")
          .select("id, test_name, score, max_score, date")
          .eq("course_id", normalized.course.id)
          .eq("student_id", student.id)
          .order("date", { ascending: false });
        setScores(scoresData || []);
      }

      setLoading(false);
    }
    loadData();
  }, [classId, router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="text-[#c9a962] font-serif text-2xl italic">Retrieving Academic Data...</div>
      </div>
    );
  }

  if (!classData) return null;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
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
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/portal/student")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            <ChevronLeft size={18} />
            Back to Portal
          </button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          {/* Hero Section */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a962]/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c9a962]/10 text-[#c9a962] text-[10px] font-bold uppercase tracking-widest mb-4">
                    <BookOpen size={12} />
                    {classData.course.name}
                  </div>
                  <h2 className="text-4xl font-serif text-gray-900 mb-2">{classData.name}</h2>
                  <p className="text-gray-500 font-medium mb-6">{classData.code || "MATH-CLS"} • {classData.course.description}</p>
                  
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#c9a962] border border-gray-100">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Instructor</p>
                        <p className="text-sm font-bold text-gray-900">{classData.teacher?.profile?.full_name || "Unassigned"}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="bg-[#1a1a1a] px-6 py-4 rounded-2xl border border-[#c9a962]/20">
                    <div className="flex items-center gap-2 text-[#c9a962] mb-1">
                      <Clock size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{classData.day_of_week}</span>
                    </div>
                    <p className="text-white font-bold text-sm">{classData.start_time} - {classData.end_time}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Left Column: Materials */}
            <div className="lg:col-span-2 space-y-8">
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Class Materials</h3>
                  <span className="text-xs font-bold text-gray-400">{materials.length} Resources Available</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {materials.map((item) => (
                    <div key={item.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-[#c9a962]/30 transition-all group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#c9a962] border border-gray-100 group-hover:bg-[#c9a962]/10 transition-colors">
                          <FileText size={20} />
                        </div>
                        <a 
                          href={item.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-[#c9a962] transition-colors"
                        >
                          <Download size={20} />
                        </a>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-4">{item.description}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          {new Date(item.uploaded_at).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-[#c9a962] font-bold uppercase tracking-widest">
                          {(item.file_size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                    </div>
                  ))}
                  {materials.length === 0 && (
                    <div className="col-span-2 py-20 bg-white rounded-[2rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 italic">
                      No materials uploaded yet.
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Right Column: Performance & Info */}
            <div className="space-y-8">
              <section>
                <div className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-6">
                  <BarChart3 size={24} className="text-[#c9a962]" />
                  <h3>Performance</h3>
                </div>
                
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 space-y-6">
                  {scores.length > 0 ? (
                    <>
                      <div className="text-center p-6 bg-gray-50 rounded-3xl border border-gray-100">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Average Score</p>
                        <div className="text-4xl font-serif text-[#c9a962]">
                          {Math.round(scores.reduce((acc, s) => acc + (s.score / s.max_score * 100), 0) / scores.length)}%
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {scores.slice(0, 5).map((score) => (
                          <div key={score.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#fafaf9] border border-transparent hover:border-[#c9a962]/20 transition-all">
                            <div>
                              <p className="text-xs font-bold text-gray-900">{score.test_name}</p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date(score.date).toLocaleDateString()}</p>
                            </div>
                            <div className="text-sm font-serif font-bold text-[#c9a962]">
                              {score.score}/{score.max_score}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <Award size={32} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-400 italic">No assessments recorded.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Quick Actions / Useful Links */}
              <section className="bg-[#1a1a1a] rounded-[2rem] p-8 border border-[#c9a962]/20">
                <h3 className="text-lg font-bold text-white mb-6 italic">Academic Resources</h3>
                <div className="space-y-3">
                  <button className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 rounded-2xl font-bold text-xs transition-all flex items-center justify-between group">
                    <span>Library Catalog</span>
                    <ExternalLink size={14} className="group-hover:text-[#c9a962] transition-colors" />
                  </button>
                  <button className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 rounded-2xl font-bold text-xs transition-all flex items-center justify-between group">
                    <span>Submit Query</span>
                    <ExternalLink size={14} className="group-hover:text-[#c9a962] transition-colors" />
                  </button>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
