"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { 
  ChevronLeft, Save, Plus, Target, Info, 
  TrendingUp, Award, Calculator
} from "lucide-react";

interface Student {
  id: string; 
  student_number: string;
  profile: {
    full_name: string;
  };
}

interface TestScore {
  student_id: string;
  test_name: string;
  score: number;
  max_score: number;
  date: string;
}

export default function MarkbookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [className, setClassName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [testNames, setTestNames] = useState<string[]>([]);
  const [scoresData, setScoresData] = useState<Record<string, Record<string, TestScore>>>({});
  const [testMetadata, setTestMetadata] = useState<Record<string, { max_score: number, date: string }>>({});

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

      // Load all scores for this course/class
      const { data: existingScores } = await supabase
        .from("test_scores")
        .select("*")
        .eq("course_id", classData.course_id)
        .order("date", { ascending: true });

      const dataMap: Record<string, Record<string, TestScore>> = {};
      const metadataMap: Record<string, { max_score: number, date: string }> = {};
      const uniqueTests = new Set<string>();

      existingScores?.forEach(record => {
        uniqueTests.add(record.test_name);
        if (!dataMap[record.test_name]) dataMap[record.test_name] = {};
        dataMap[record.test_name][record.student_id] = {
          student_id: record.student_id,
          test_name: record.test_name,
          score: Number(record.score),
          max_score: Number(record.max_score),
          date: record.date
        };
        metadataMap[record.test_name] = {
          max_score: Number(record.max_score),
          date: record.date
        };
      });

      const sortedTests = Array.from(uniqueTests);
      if (sortedTests.length === 0) {
        const defaultTest = "Initial Assessment";
        sortedTests.push(defaultTest);
        metadataMap[defaultTest] = { max_score: 100, date: new Date().toISOString().split('T')[0] };
        dataMap[defaultTest] = {};
      }

      setTestNames(sortedTests);
      setScoresData(dataMap);
      setTestMetadata(metadataMap);
      setLoading(false);
    }
    loadData();
  }, [classId, router, supabase]);

  const handleScoreChange = (testName: string, studentId: string, score: string) => {
    const numScore = parseFloat(score) || 0;
    setScoresData(prev => ({
      ...prev,
      [testName]: {
        ...prev[testName],
        [studentId]: {
          ...(prev[testName]?.[studentId] || { student_id: studentId, test_name: testName, date: testMetadata[testName].date, max_score: testMetadata[testName].max_score }),
          score: numScore
        }
      }
    }));
  };

  const handleMaxScoreChange = (testName: string, maxScore: string) => {
    const numMax = parseFloat(maxScore) || 100;
    setTestMetadata(prev => ({
      ...prev,
      [testName]: { ...prev[testName], max_score: numMax }
    }));
  };

  const addNewTest = () => {
    const newTestName = prompt("Enter Assessment Name:", `Test ${testNames.length + 1}`);
    if (newTestName && !testNames.includes(newTestName)) {
      setTestNames(prev => [...prev, newTestName]);
      setTestMetadata(prev => ({
        ...prev,
        [newTestName]: { max_score: 100, date: new Date().toISOString().split('T')[0] }
      }));
      setScoresData(prev => ({
        ...prev,
        [newTestName]: {}
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const recordsToUpsert: any[] = [];
      
      testNames.forEach(testName => {
        const meta = testMetadata[testName];
        students.forEach(student => {
          const record = scoresData[testName]?.[student.id];
          recordsToUpsert.push({
            course_id: courseId,
            student_id: student.id,
            test_name: testName,
            score: record?.score || 0,
            max_score: meta.max_score,
            date: meta.date,
            teacher_id: user?.id
          });
        });
      });

      const { error } = await supabase
        .from("test_scores")
        .upsert(recordsToUpsert, { onConflict: 'course_id, student_id, test_name, date' });

      if (error) throw error;
      alert("Markbook updated successfully.");
    } catch (error: any) {
      alert(`Error saving marks: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="text-[#c9a962] font-serif text-2xl italic animate-pulse">Opening Digital Markbook...</div>
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
              <h1 className="text-lg font-serif italic text-[#1a1a1a] leading-none">Class Markbook</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{className}</p>
            </div>
          </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={addNewTest}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 hover:text-[#1a1a1a] transition-colors"
          >
            <Plus size={18} />
            Add Column
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1a1a1a] text-[#c9a962] px-6 py-2 rounded-xl font-bold text-sm hover:bg-[#c9a962] hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? "Processing..." : "Save Markbook"}
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
                  <th className="sticky left-0 z-20 bg-gray-50 px-6 py-6 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-r border-gray-100 min-w-[250px]">
                    Student Performance
                  </th>
                  {testNames.map(testName => (
                    <th key={testName} className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 min-w-[160px] border-r border-gray-100 last:border-r-0">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 font-bold truncate pr-2" title={testName}>{testName}</span>
                          <TrendingUp size={12} className="text-[#c9a962]" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-gray-400">MAX:</span>
                          <input 
                            type="number"
                            value={testMetadata[testName].max_score}
                            onChange={(e) => handleMaxScoreChange(testName, e.target.value)}
                            className="w-12 bg-white border border-gray-200 rounded px-1 py-0.5 text-[10px] font-bold text-[#c9a962]"
                          />
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#c9a962] bg-[#c9a962]/5 min-w-[100px] text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Award size={14} />
                      <span>AVG %</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student) => {
                  let totalPercentage = 0;
                  let testCount = 0;

                  return (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="sticky left-0 z-10 bg-white px-6 py-4 border-r border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#c9a962] text-[10px] font-bold border border-[#c9a962]/20 shrink-0">
                            {student.profile.full_name[0]}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-900 truncate">{student.profile.full_name}</p>
                            <p className="text-[10px] text-gray-400 font-mono truncate">{student.student_number}</p>
                          </div>
                        </div>
                      </td>
                      {testNames.map(testName => {
                        const record = scoresData[testName]?.[student.id];
                        const score = record?.score || 0;
                        const max = testMetadata[testName].max_score;
                        const percentage = max > 0 ? (score / max) * 100 : 0;
                        
                        totalPercentage += percentage;
                        testCount++;

                        return (
                          <td key={`${student.id}-${testName}`} className="px-6 py-4 border-r border-gray-100 last:border-r-0">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <input 
                                  type="number"
                                  value={score}
                                  onChange={(e) => handleScoreChange(testName, student.id, e.target.value)}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-bold focus:outline-none focus:border-[#c9a962] text-center"
                                />
                                <span className="text-[10px] text-gray-300 font-bold">/</span>
                                <span className="text-[10px] text-gray-400 font-bold">{max}</span>
                              </div>
                              <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${percentage >= 85 ? 'bg-green-500' : percentage >= 50 ? 'bg-blue-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 bg-[#c9a962]/5 text-center">
                        <span className={`text-sm font-bold ${testCount > 0 && (totalPercentage/testCount) >= 50 ? 'text-[#c9a962]' : 'text-red-500'}`}>
                          {testCount > 0 ? (totalPercentage / testCount).toFixed(1) : '0.0'}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
        
        <div className="mt-6 flex items-start gap-4 p-4 bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 max-w-fit">
          <div className="w-8 h-8 rounded-lg bg-[#c9a962]/10 flex items-center justify-center text-[#c9a962] shrink-0">
            <Calculator size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-white mb-1">Markbook Insights</p>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Enter raw scores in the grid. The system automatically calculates percentages and term averages. <br/>
              You can adjust 'MAX' scores directly in the column headers.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
