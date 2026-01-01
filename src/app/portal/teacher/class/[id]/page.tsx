"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  ChevronLeft, BookOpen, FileText, Plus, FolderOpen, ChevronRight,
  Mail, Clock, MapPin
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
    code: string;
  };
  students: Array<{
    profile: {
      id: string;
      full_name: string;
      email: string;
      student: Array<{
        id: string;
        student_number: string;
      }>;
    };
  }>;
}

export default function ClassManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState("");
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [courseContent, setCourseContent] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "teacher") { router.push("/login"); return; }
      setTeacherName(profile.full_name);

      const { data: clsData } = await supabase
        .from("classes")
        .select(`
          id, name, code, day_of_week, start_time, end_time,
          course:courses(id, name, code),
          students:class_students(
            profile:profiles!student_id(
              id, 
              full_name, 
              email, 
              student:students(id, student_number)
            )
          )
        `)
        .eq("id", id)
        .single();

      if (!clsData) {
        router.push("/portal/teacher");
        return;
      }

      setClassData(clsData as any);

      const { data: content } = await supabase
        .from("class_content")
        .select("*")
        .eq("class_id", id)
        .order("uploaded_at", { ascending: false });
      
      setCourseContent(content || []);
      setLoading(false);
    }
    loadData();
  }, [id, router, supabase]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !classData) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${classData.id}/${fileName}`;

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
          class_id: classData.id,
          course_id: classData.course.id,
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
        .eq("class_id", classData.id)
        .order("uploaded_at", { ascending: false });
      setCourseContent(data || []);
      
      alert("Material uploaded successfully.");
    } catch (error: any) {
      alert(`Error uploading: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }

  if (!classData) return null;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <ChevronLeft size={24} />
          </button>
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
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900 leading-none mb-1">{teacherName}</p>
            <p className="text-[10px] text-[#c9a962] uppercase tracking-widest font-bold">Faculty</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] font-bold border border-[#c9a962]/20">
            {teacherName[0]}
          </div>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{classData.name}</h2>
              <p className="text-sm text-gray-500">{classData.code} • {classData.course.name} ({classData.course.code})</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-2">
                <Clock size={16} className="text-[#c9a962]" />
                <span className="text-sm font-bold text-gray-700">{classData.day_of_week} {classData.start_time} - {classData.end_time}</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Students Table */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Enrolled Students</h3>
                  <span className="text-xs font-bold text-[#c9a962] bg-[#c9a962]/10 px-3 py-1 rounded-full">
                    {classData.students.length} Active
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
                        {classData.students.map((enrolment, idx) => {
                          const student = enrolment.profile.student?.[0];
                          return (
                            <tr key={enrolment.profile.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 text-sm text-gray-400">{idx + 1}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] text-xs font-bold">
                                    {enrolment.profile.full_name?.[0] || '?'}
                                  </div>
                                  <span className="text-sm font-bold text-gray-900">{enrolment.profile.full_name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">{student?.student_number || 'N/A'}</td>
                              <td className="px-6 py-4 text-right">
                                <button className="text-[#c9a962] hover:underline text-sm font-bold">Results</button>
                              </td>
                            </tr>
                          );
                        })}
                      {classData.students.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">No students in this class yet.</td>
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

                {/* Quick Actions */}
                <section className="bg-[#1a1a1a] rounded-3xl p-6 border border-[#c9a962]/20">
                  <h3 className="text-lg font-bold text-white mb-4 italic">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full py-3 px-4 bg-[#c9a962]/10 hover:bg-[#c9a962]/20 border border-[#c9a962]/30 text-[#c9a962] rounded-xl font-bold text-sm transition-all flex items-center justify-between">
                      <span>Send Announcement</span>
                      <Mail size={16} />
                    </button>
                    <button 
                      onClick={() => router.push(`/portal/teacher/class/${id}/attendance`)}
                      className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 rounded-xl font-bold text-sm transition-all text-left"
                    >
                      Record Attendance
                    </button>
                    <button 
                      onClick={() => router.push(`/portal/teacher/class/${id}/markbook`)}
                      className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 rounded-xl font-bold text-sm transition-all text-left"
                    >
                      Markbook
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
