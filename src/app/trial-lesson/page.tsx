"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default function TrialLessonPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    studentName: "",
    courseId: "",
    classId: "",
  });

  const [dbCourses, setDbCourses] = useState<any[]>([]);
  const [dbClasses, setDbClasses] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");

  const subjectsList = [
    "Mathematics",
    "Science (Year 7 - 10)",
    "Physics",
    "Chemistry",
    "Biology"
  ];

  useEffect(() => {
    async function loadData() {
      const { data: courses } = await supabase.from("courses").select("*");
      const { data: classes } = await supabase.from("classes").select("*").order("day_of_week").order("start_time");
      
      console.log("Trial Lesson - Loaded courses:", courses);
      console.log("Trial Lesson - Loaded classes:", classes);
      
      const coursesMap = new Map(courses?.map(c => [c.id, c]) || []);
      const enrichedClasses = classes?.map(cls => ({
        ...cls,
        course: coursesMap.get(cls.course_id) || { name: "Unknown" }
      })) || [];
      
      setDbCourses(courses || []);
      setDbClasses(enrichedClasses);
    }
    loadData();
  }, [supabase]);

  const filteredClasses = dbClasses.filter(cls => {
    // Handle Year-bucket synthetic course values "courseId|yearX" for Math and Science
    if (formData.courseId && formData.courseId.includes('|year')) {
      const [courseId, yearTag] = formData.courseId.split('|');
      const matchesCourse = cls.course_id === courseId;
      const yearNum = yearTag.replace('year', '');
      const matchesYear = cls.name.toLowerCase().includes(`year ${yearNum}`);
      return matchesCourse && matchesYear;
    }
    return cls.course_id === formData.courseId;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId || !formData.classId) {
      setError("Please select a course and class time");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/trial-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Submission failed");

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full bg-transparent border-b border-[#e5e5e5] py-4 text-[#1a1a1a] focus:outline-none focus:border-[#c9a962] transition-colors";
  const labelClasses = "text-[10px] tracking-[0.2em] uppercase text-[#a1a1aa] mb-1 block";

  if (submitted) {
    return (
      <main className="bg-[#fafaf9] min-h-screen">
        <Navigation />
        <section className="pt-40 pb-32 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-white border border-[#e5e5e5] p-12 lg:p-20 shadow-2xl max-w-2xl mx-6"
          >
            <div className="w-24 h-24 mx-auto mb-10 border border-[#c9a962] rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#c9a962]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-serif text-5xl text-[#1a1a1a] mb-6">Request Received</h3>
            <p className="text-[#71717a] mb-12 text-lg font-light leading-relaxed">
              We've received your trial lesson request for <span className="text-[#1a1a1a] font-medium">{formData.studentName}</span>. 
              Our team will contact you shortly to confirm the session.
            </p>
            <Link
              href="/"
              className="px-12 py-5 text-[10px] tracking-[0.4em] uppercase bg-[#1a1a1a] text-[#fafaf9] hover:bg-[#c9a962] transition-colors inline-block"
            >
              Return Home
            </Link>
          </motion.div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="bg-[#fafaf9] min-h-screen">
      <Navigation />
      
      <section className="relative pt-40 lg:pt-56 pb-32 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mb-24"
          >
            <span className="text-[10px] tracking-[0.4em] uppercase text-[#c9a962] font-bold block mb-8">
              Experience the Excellence
            </span>
            <h1 className="font-serif text-6xl lg:text-8xl text-[#1a1a1a] leading-[0.9] mb-10">
              Book a <br />
              <span className="italic font-light text-[#c9a962]">Trial Lesson</span>
            </h1>
            <p className="text-[#71717a] text-xl lg:text-2xl leading-relaxed max-w-2xl font-light">
              Experience our boutique learning environment firsthand. 
              Join a class and discover how we help students achieve their maximum potential.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-12 gap-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-8"
            >
              <form onSubmit={handleSubmit} className="bg-white p-10 lg:p-16 border border-[#e5e5e5] shadow-2xl space-y-12">
                {error && (
                  <div className="p-4 bg-red-50 border-l-2 border-red-500 text-red-600 text-xs font-medium uppercase tracking-wider">
                    {error}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-10">
                  <div>
                    <label className={labelClasses}>Parent Name</label>
                    <input 
                      type="text" 
                      required 
                      className={inputClasses}
                      value={formData.parentName}
                      onChange={e => setFormData({...formData, parentName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Parent Email</label>
                    <input 
                      type="email" 
                      required 
                      className={inputClasses}
                      value={formData.parentEmail}
                      onChange={e => setFormData({...formData, parentEmail: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Parent Phone</label>
                    <input 
                      type="tel" 
                      required 
                      className={inputClasses}
                      value={formData.parentPhone}
                      onChange={e => setFormData({...formData, parentPhone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Student Name</label>
                    <input 
                      type="text" 
                      required 
                      className={inputClasses}
                      value={formData.studentName}
                      onChange={e => setFormData({...formData, studentName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-16 pt-12 border-t border-[#e5e5e5]">
                  <h3 className="text-[10px] tracking-[0.3em] uppercase text-[#c9a962] font-bold mb-8">Subject Selection</h3>
                  
                  {/* Subject Toggle Buttons */}
                  <div className="grid md:grid-cols-2 gap-4 mb-12">
                    {subjectsList.map((subject) => (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => {
                          setSelectedSubject(subject);
                          setFormData({...formData, courseId: "", classId: ""});
                        }}
                        className={`p-6 text-left border transition-all duration-300 flex justify-between items-center ${
                          selectedSubject === subject
                            ? 'border-[#c9a962] bg-[#c9a962]/5'
                            : 'border-[#e5e5e5] hover:border-[#c9a962]/30 bg-white'
                        }`}
                      >
                        <span className={`text-sm tracking-widest uppercase ${
                          selectedSubject === subject ? 'text-[#1a1a1a] font-bold' : 'text-[#71717a]'
                        }`}>
                          {subject}
                        </span>
                        {selectedSubject === subject && (
                          <div className="w-2 h-2 rounded-full bg-[#c9a962]" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Course & Class Selection */}
                  {selectedSubject && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-8 border border-[#e5e5e5] bg-white relative"
                    >
                      <div className="absolute -top-3 left-6 bg-white px-4 text-[10px] tracking-widest uppercase font-bold text-[#c9a962]">
                        {selectedSubject} Selection
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-10">
                        <div>
                          <label className={labelClasses}>Select Course</label>
                          <select 
                            value={formData.courseId} 
                            onChange={e => setFormData({...formData, courseId: e.target.value, classId: ""})} 
                            className={inputClasses}
                          >
                            <option value="">Select a Course</option>
                            {/* Special handling for Mathematics: show Year 7-12 buckets */}
                            {selectedSubject.toLowerCase().includes('mathematics')
                              ? (() => {
                                  const mathCourse = dbCourses.find(c => c.name.toLowerCase() === 'mathematics');
                                  if (!mathCourse) return null;
                                  return [7, 8, 9, 10, 11, 12].map(year => (
                                    <option key={`${mathCourse.id}-m-${year}`} value={`${mathCourse.id}|year${year}`}>
                                      {`Year ${year} Mathematics`}
                                    </option>
                                  ));
                                })()

                              /* Special handling for Science (Year 7 - 10): show Year 7-10 course buckets */
                              : selectedSubject.toLowerCase().includes('science') && selectedSubject.toLowerCase().includes('year')
                                ? (() => {
                                    const scienceCourse = dbCourses.find(c => c.name.toLowerCase() === 'science');
                                    if (!scienceCourse) return null;
                                    return [7, 8, 9, 10].map(year => (
                                      <option key={`${scienceCourse.id}-${year}`} value={`${scienceCourse.id}|year${year}`}>
                                        {`Year ${year} Science`}
                                      </option>
                                    ));
                                  })()

                                : dbCourses
                                    .filter(c => {
                                      const name = c.name.toLowerCase();
                                      const subject = selectedSubject.toLowerCase();
                                      
                                      // For specific sciences, only show that subject's course
                                      if (subject === 'physics' || subject === 'chemistry' || subject === 'biology') {
                                        return name === subject;
                                      }
                                      
                                      // For mathematics and general cases
                                      return name.includes(subject);
                                    })
                                    .map(course => (
                                      <option key={course.id} value={course.id}>{course.name}</option>
                                    ))
                            }
                          </select>
                        </div>
                        
                        <div>
                          <label className={labelClasses}>Select Class</label>
                          <select 
                            value={formData.classId} 
                            onChange={e => setFormData({...formData, classId: e.target.value})} 
                            className={inputClasses}
                            disabled={!formData.courseId}
                          >
                            <option value="">Select a Class</option>
                            {filteredClasses.map(cls => {
                              // For Physics/Chemistry/Biology, strip subject name and show only year level
                              let displayName = cls.name;
                              if (cls.name.includes('Physics') || cls.name.includes('Chemistry') || cls.name.includes('Biology')) {
                                displayName = cls.name.replace(/Physics|Chemistry|Biology/gi, '').trim();
                              }
                              return (
                                <option key={cls.id} value={cls.id}>{displayName} ({cls.day_of_week} {cls.start_time})</option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full lg:w-auto px-16 py-6 text-[10px] tracking-[0.4em] uppercase bg-[#1a1a1a] text-[#fafaf9] hover:bg-[#c9a962] transition-colors duration-500 disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-4 space-y-12"
            >
              <div>
                <h3 className="text-[10px] tracking-[0.3em] uppercase text-[#c9a962] font-bold mb-6">Why a Trial?</h3>
                <p className="text-[#71717a] font-light leading-relaxed">
                  Our trial lessons allow both the student and the parent to understand our unique teaching methodology and boutique atmosphere.
                </p>
              </div>
              <div className="p-8 border border-[#e5e5e5] bg-white">
                <h4 className="font-serif text-xl mb-4">What to expect</h4>
                <ul className="space-y-4 text-xs tracking-wider text-[#71717a] uppercase">
                  <li className="flex gap-3">
                    <span className="text-[#c9a962]">01</span>
                    <span>Class Participation</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#c9a962]">02</span>
                    <span>Materials Provided</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#c9a962]">03</span>
                    <span>Brief Consultation</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
