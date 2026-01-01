"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { 
  ChevronLeft, Save, CheckCircle2, XCircle, Clock, AlertCircle, 
  Plus, Calendar as CalendarIcon, Info
} from "lucide-react";

interface Student {
  id: string; 
  student_number: string;
  profile: {
    full_name: string;
  };
}

interface AttendanceRecord {
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export default function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [className, setClassName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, Record<string, AttendanceRecord>>>({});

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: classData } = await supabase
        .from("classes")
        .select(`
          name, 
          course_id,
          students:class_students(
            profile:profiles!student_id(
              full_name,
              student:students(id, student_number)
            )
          )
        `)
        .eq("id", classId)
        .single();

      if (!classData) {
        router.push("/portal/teacher");
        return;
      }

      setClassName(classData.name);
      setCourseId(classData.course_id);

      const enrolledStudents: Student[] = (classData.students as any[])
        .filter(s => s.profile.student?.[0])
        .map(s => ({
          id: s.profile.student[0].id,
          student_number: s.profile.student[0].student_number,
          profile: {
            full_name: s.profile.full_name
          }
        }));
      setStudents(enrolledStudents);

      // Load all attendance records for this class
      const { data: existingAttendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("class_id", classId)
        .order("date", { ascending: true });

      const dataMap: Record<string, Record<string, AttendanceRecord>> = {};
      const uniqueDates = new Set<string>();

      existingAttendance?.forEach(record => {
        uniqueDates.add(record.date);
        if (!dataMap[record.date]) dataMap[record.date] = {};
        dataMap[record.date][record.student_id] = {
          student_id: record.student_id,
          date: record.date,
          status: record.status,
          notes: record.notes
        };
      });

      // If no dates exist, add today's date
      const sortedDates = Array.from(uniqueDates).sort();
      if (sortedDates.length === 0) {
        const today = new Date().toISOString().split('T')[0];
        sortedDates.push(today);
        dataMap[today] = {};
      }

      setDates(sortedDates);
      setAttendanceData(dataMap);
      setLoading(false);
    }
    loadData();
  }, [classId, router, supabase]);

  const handleStatusChange = (date: string, studentId: string, status: AttendanceRecord['status']) => {
    setAttendanceData(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [studentId]: {
          ...(prev[date]?.[studentId] || { student_id: studentId, date }),
          status
        }
      }
    }));
  };

  const addNewDate = () => {
    const lastDate = dates.length > 0 ? new Date(dates[dates.length - 1]) : new Date();
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 7); // Default to next week
    const dateStr = nextDate.toISOString().split('T')[0];
    
    if (!dates.includes(dateStr)) {
      setDates(prev => [...prev, dateStr].sort());
      setAttendanceData(prev => ({
        ...prev,
        [dateStr]: {}
      }));
    } else {
      alert("This date already exists in the sheet.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const recordsToUpsert: any[] = [];
      
      dates.forEach(date => {
        students.forEach(student => {
          const record = attendanceData[date]?.[student.id];
          if (record) {
            recordsToUpsert.push({
              class_id: classId,
              course_id: courseId,
              student_id: student.id,
              date: date,
              status: record.status || 'present',
              notes: record.notes || ''
            });
          } else {
            // Default to present if no record exists yet
            recordsToUpsert.push({
              class_id: classId,
              course_id: courseId,
              student_id: student.id,
              date: date,
              status: 'present',
              notes: ''
            });
          }
        });
      });

      const { error } = await supabase
        .from("attendance")
        .upsert(recordsToUpsert, { onConflict: 'class_id, student_id, date' });

      if (error) throw error;
      alert("Attendance records updated successfully.");
    } catch (error: any) {
      alert(`Error saving attendance: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="text-[#c9a962] font-serif text-2xl italic animate-pulse">Initializing Spreadsheet...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="w-10 h-10 border-2 border-[#c9a962]/50 flex items-center justify-center rounded-lg bg-[#1a1a1a]">
              <span className="text-2xl font-serif italic text-[#c9a962]">V</span>
            </div>
            <div>
              <h1 className="text-lg font-serif italic text-[#1a1a1a] leading-none">Attendance Sheet</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{className}</p>
            </div>
          </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={addNewDate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 hover:text-[#1a1a1a] transition-colors"
          >
            <Plus size={18} />
            Add Date
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1a1a1a] text-[#c9a962] px-6 py-2 rounded-xl font-bold text-sm hover:bg-[#c9a962] hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-w-max"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="sticky left-0 z-20 bg-gray-50 px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-r border-gray-100 min-w-[250px]">
                    Student Name
                  </th>
                  {dates.map(date => (
                    <th key={date} className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 min-w-[140px] text-center border-r border-gray-100 last:border-r-0">
                      <div className="flex flex-col items-center gap-1">
                        <CalendarIcon size={14} className="text-[#c9a962]" />
                        <span>{new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="sticky left-0 z-10 bg-white px-6 py-4 border-r border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] text-[10px] font-bold border border-[#c9a962]/20 shrink-0">
                          {student.profile.full_name[0]}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-gray-900 truncate">{student.profile.full_name}</p>
                          <p className="text-[10px] text-gray-400 font-mono truncate">{student.student_number}</p>
                        </div>
                      </div>
                    </td>
                    {dates.map(date => {
                      const record = attendanceData[date]?.[student.id];
                      const status = record?.status || 'present';
                      
                      return (
                        <td key={`${student.id}-${date}`} className="px-4 py-4 border-r border-gray-100 last:border-r-0">
                          <div className="flex items-center justify-center gap-1">
                            {[
                              { val: 'present', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
                              { val: 'absent', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
                              { val: 'late', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' },
                              { val: 'excused', icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50' }
                            ].map((s) => (
                              <button
                                key={s.val}
                                onClick={() => handleStatusChange(date, student.id, s.val as any)}
                                className={`p-1.5 rounded-md transition-all border ${
                                  status === s.val 
                                    ? `${s.bg} ${s.color} border-current ring-2 ring-current ring-opacity-10` 
                                    : 'bg-transparent text-gray-200 border-transparent hover:text-gray-400'
                                }`}
                                title={s.val.charAt(0).toUpperCase() + s.val.slice(1)}
                              >
                                <s.icon size={16} />
                              </button>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
        
        <div className="mt-6 flex items-start gap-4 p-4 bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 max-w-fit">
          <div className="w-8 h-8 rounded-lg bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] shrink-0">
            <Info size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-white mb-1">Spreadsheet Guide</p>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Toggle statuses by clicking icons. Columns represent lesson dates. <br/>
              Horizontal scroll for more dates. Remember to save your changes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
