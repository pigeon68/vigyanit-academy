"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";

interface ClassSchedule {
  id: string;
  day: string;
  time: string;
  course: string;
  code: string;
}

const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const getClassColor = (course: string) => {
  const colors = [
    "bg-blue-50 border-blue-100 text-blue-700",
    "bg-purple-50 border-purple-100 text-purple-700",
    "bg-emerald-50 border-emerald-100 text-emerald-700",
    "bg-amber-50 border-amber-100 text-amber-700",
    "bg-rose-50 border-rose-100 text-rose-700",
    "bg-indigo-50 border-indigo-100 text-indigo-700",
  ];
  const index = course.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

export default function TeacherCalendarPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState("");
  const [assignedClasses, setAssignedClasses] = useState<ClassSchedule[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "day">("week");

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

      const { data: teacher } = await supabase
        .from("teachers")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (!teacher) { setLoading(false); return; }

      const { data: classesData } = await supabase
        .from("classes")
        .select(`
          id, name, code, day_of_week, start_time, end_time,
          course:courses(name, code)
        `)
        .eq("teacher_id", teacher.id);

      if (classesData) {
        const formattedClasses: ClassSchedule[] = classesData.map(c => ({
          id: c.id,
          day: c.day_of_week,
          time: `${c.start_time}-${c.end_time}`,
          course: c.name,
          code: c.code
        }));
        setAssignedClasses(formattedClasses);
      }

      setLoading(false);
    }
    loadData();
  }, [router, supabase]);

  const getScheduleForDay = (day: string): ClassSchedule[] => {
    return assignedClasses.filter(s => s.day === day).sort((a, b) => {
      const timeA = a.time.split("-")[0];
      const timeB = b.time.split("-")[0];
      return timeA.localeCompare(timeB);
    });
  };

  const getCurrentWeekDates = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    
    return daysOrder.map((_, idx) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + idx);
      return date;
    });
  };

  const weekDates = getCurrentWeekDates();

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="text-[#c9a962] font-serif text-2xl italic">Loading Calendar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/portal/teacher")}
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

      <main className="p-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateWeek(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-xl font-bold text-gray-800">
                {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
              </h2>
              <button
                onClick={() => navigateWeek(1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 text-sm font-bold text-[#c9a962] hover:bg-[#c9a962]/10 rounded-lg transition-colors"
              >
                Today
              </button>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("week")}
                  className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${viewMode === "week" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode("day")}
                  className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${viewMode === "day" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
                >
                  Day
                </button>
              </div>
            </div>
          </div>

          {assignedClasses.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
              <p className="text-gray-500 italic">No classes assigned to you yet.</p>
              <p className="text-sm text-gray-400 mt-2">Classes will appear here once assigned by the administrator.</p>
            </div>
          ) : viewMode === "week" ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="grid grid-cols-7 border-b border-gray-100">
                {daysOrder.map((day, idx) => (
                  <div 
                    key={day} 
                    className={`p-4 text-center border-r border-gray-100 last:border-r-0 ${isToday(weekDates[idx]) ? 'bg-[#c9a962]/5' : ''}`}
                  >
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{day.slice(0, 3)}</p>
                    <p className={`text-lg font-bold mt-1 ${isToday(weekDates[idx]) ? 'text-[#c9a962]' : 'text-gray-900'}`}>
                      {weekDates[idx].getDate()}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 min-h-[500px]">
                {daysOrder.map((day, idx) => {
                  const daySchedule = getScheduleForDay(day);
                  return (
                    <div 
                      key={day} 
                      className={`p-3 border-r border-gray-100 last:border-r-0 ${isToday(weekDates[idx]) ? 'bg-[#c9a962]/5' : ''}`}
                    >
                      <div className="space-y-2">
                          {daySchedule.map((schedule, scheduleIdx) => {
                            return (
                              <div
                                key={scheduleIdx}
                                onClick={() => router.push(`/portal/teacher/class/${schedule.id}`)}
                                className={`p-3 rounded-xl border ${getClassColor(schedule.course)} cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] overflow-hidden`}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <p className="text-xs font-bold leading-tight flex-1 break-words">{schedule.course}</p>
                                  <span className="text-[8px] font-bold opacity-50 whitespace-nowrap shrink-0">{schedule.code}</span>
                                </div>
                                <div className="flex items-center gap-1 mt-2 text-[10px] opacity-80">
                                  <Clock size={10} />
                                  <span>{schedule.time}</span>
                                </div>
                                <div className="mt-2 text-[8px] font-bold uppercase tracking-tighter opacity-40 text-right">
                                  Click to Manage
                                </div>
                              </div>
                            );
                          })}
                        {daySchedule.length === 0 && (
                          <p className="text-xs text-gray-300 text-center py-4 italic">No classes</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                <h3 className="text-lg font-bold text-gray-800 mb-6">
                  {daysOfWeek[currentDate.getDay()]} - {formatDate(currentDate)}
                </h3>
                <div className="space-y-4">
                  {getScheduleForDay(daysOfWeek[currentDate.getDay()]).map((schedule, idx) => {
                    return (
                      <div
                        key={idx}
                        onClick={() => router.push(`/portal/teacher/class/${schedule.id}`)}
                        className={`p-6 rounded-2xl border ${getClassColor(schedule.course)} flex items-center justify-between cursor-pointer hover:shadow-md transition-all hover:scale-[1.01]`}
                      >
                        <div>
                          <p className="text-lg font-bold">{schedule.course}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm opacity-80">
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>{schedule.time}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin size={14} />
                              <span>Main Campus</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[#c9a962] font-bold text-sm">
                          Manage Class
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    );
                  })}
                  {getScheduleForDay(daysOfWeek[currentDate.getDay()]).length === 0 && (
                    <p className="text-center text-gray-400 italic py-8">No classes scheduled for this day.</p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Your Assigned Classes</h3>
              <div className="flex flex-wrap gap-2">
                {assignedClasses.map((cls, idx) => (
                  <span 
                    key={idx} 
                    onClick={() => router.push(`/portal/teacher/class/${cls.id}`)}
                    className="px-4 py-2 bg-[#c9a962]/10 text-[#c9a962] rounded-full text-sm font-bold cursor-pointer hover:bg-[#c9a962]/20 transition-colors"
                  >
                    {cls.course} ({cls.code})
                  </span>
                ))}

              {assignedClasses.length === 0 && (
                <p className="text-gray-400 italic">No classes assigned yet.</p>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
