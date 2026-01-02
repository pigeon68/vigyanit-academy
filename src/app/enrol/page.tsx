"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TermsModal } from "@/components/TermsModal";

type Step = "parent" | "student" | "course" | "summary" | "payment";

interface SubjectSelection {
  subject: string;
  courseId: string;
  courseName: string;
  classId: string;
  className: string;
  price: number;
}

interface EnrolmentData {
  parent: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    address: string;
    suburb: string;
    postcode: string;
    state: string;
    occupation: string;
    referralSource: string;
    relationship: string;
  };
  student: {
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    schoolName: string;
    gradeLevel: string;
    studentEmail: string;
  };
  selection: {
    subjects: SubjectSelection[];
  };
  termsAccepted: boolean;
  paymentMethod: 'stripe' | 'bank_transfer';
}

const subjectsList = [
  "Mathematics",
  "Science (Year 7 - 10)",
  "Physics",
  "Chemistry",
  "Biology"
];

export default function EnrolPage() {
  const router = useRouter();
    const [currentStep, setCurrentStep] = useState<Step>("parent");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  
  const [enrolmentData, setEnrolmentData] = useState<EnrolmentData>({
    parent: {
      firstName: "", lastName: "", email: "", phone: "", password: "",
      confirmPassword: "", address: "", suburb: "", postcode: "", state: "",
      occupation: "", referralSource: "", relationship: "",
    },
    student: {
      firstName: "", lastName: "", gender: "", dateOfBirth: "",
      schoolName: "", gradeLevel: "", studentEmail: "",
    },
    selection: {
      subjects: [],
    },
      termsAccepted: false,
      paymentMethod: 'stripe',
    });

  const [dbClasses, setDbClasses] = useState<any[]>([]);
  const [dbCourses, setDbCourses] = useState<any[]>([]);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isSelectingAddress, setIsSelectingAddress] = useState(false);
  const addressContainerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // No client-side persistence for sensitive data (passwords/PII)

  // Handle click outside for address suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addressContainerRef.current && !addressContainerRef.current.contains(event.target as Node)) {
        setAddressSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    setIsSearchingAddress(true);
    try {
      const res = await fetch(`/api/address-search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setAddressSuggestions(data || []);
    } catch (err) {
      console.error("Address search failed", err);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const mapState = (state: string) => {
    if (!state) return "";
    const s = state.toUpperCase();
    if (s.includes("NEW SOUTH WALES") || s === "NSW") return "NSW";
    if (s.includes("VICTORIA") || s === "VIC") return "VIC";
    if (s.includes("QUEENSLAND") || s === "QLD") return "QLD";
    if (s.includes("WESTERN AUSTRALIA") || s === "WA") return "WA";
    if (s.includes("SOUTH AUSTRALIA") || s === "SA") return "SA";
    if (s.includes("TASMANIA") || s === "TAS") return "TAS";
    if (s.includes("AUSTRALIAN CAPITAL TERRITORY") || s === "ACT") return "ACT";
    if (s.includes("NORTHERN TERRITORY") || s === "NT") return "NT";
    return s;
  };

  const selectAddress = (result: any) => {
    setIsSelectingAddress(true);
    const { address, display_name } = result;
    const parts = display_name.split(', ');
    
    const query = enrolmentData.parent.address.trim();
    const queryMatch = query.match(/^(\d+[a-zA-Z0-9\-\/]*)/);
    const queryNumber = queryMatch ? queryMatch[1] : "";

    let houseNumber = address.house_number || "";
    let street = address.road || address.pedestrian || address.cycleway || "";

    if (!houseNumber && queryNumber && !/^\d/.test(parts[0])) {
      houseNumber = queryNumber;
    }

    let fullAddress = "";
    if (houseNumber) {
      const streetPart = street || (!/^\d/.test(parts[0]) ? parts[0] : parts[1]);
      fullAddress = `${houseNumber} ${streetPart}`;
    } else {
      if (/^\d/.test(parts[0])) {
        fullAddress = parts[0];
      } else {
        fullAddress = parts[0];
      }
    }
    
    setEnrolmentData(prev => ({
      ...prev,
      parent: {
        ...prev.parent,
        address: fullAddress,
        suburb: address.suburb || address.city_district || address.town || address.village || address.city || "",
        postcode: address.postcode || "",
        state: mapState(address.state || ""),
      }
    }));
    setAddressSuggestions([]);
  };

  useEffect(() => {
    if (isSelectingAddress) {
      setIsSelectingAddress(false);
      return;
    }
    const timer = setTimeout(() => {
      if (currentStep === 'parent' && enrolmentData.parent.address.length >= 3) {
        searchAddress(enrolmentData.parent.address);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [enrolmentData.parent.address, currentStep]);

  useEffect(() => {
    async function loadAcademicData() {
      const { data: courses } = await supabase.from("courses").select("*");
      const { data: classData } = await supabase.from("classes").select("*").order("day_of_week").order("start_time");
      
      // Manually enrich classes with course data
      const coursesMap = new Map(courses?.map(c => [c.id, c]) || []);
      const enrichedClasses = classData?.map(cls => ({
        ...cls,
        course: coursesMap.get(cls.course_id) || { name: "Unknown" }
      })) || [];
      
      console.log("Loaded classes count on enrol page:", enrichedClasses.length);
      setDbCourses(courses || []);
      setDbClasses(enrichedClasses);
    }
    loadAcademicData();
  }, [supabase]);

  const steps: Step[] = ["parent", "student", "course", "summary", "payment"];
  const currentStepIndex = steps.indexOf(currentStep);

  const calculateTotalPrice = () => {
    return enrolmentData.selection.subjects.reduce((sum, s) => sum + s.price, 0);
  };

  const validateStep = (step: Step): boolean => {
    setError("");
    const { parent, student, selection } = enrolmentData;

    if (step === "parent") {
      if (!parent.firstName || !parent.lastName) {
        setError("Please enter parent's full name");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parent.email)) {
        setError("Please enter a valid email address");
        return false;
      }
      const phoneClean = parent.phone.replace(/\D/g, "");
      if (phoneClean.length < 10) {
        setError("Please enter a valid 10-digit mobile number");
        return false;
      }
      if (!parent.relationship) {
        setError("Please select your relationship to the student");
        return false;
      }
      if (!parent.password || parent.password.length < 8) {
        setError("Password must be at least 8 characters");
        return false;
      }
      if (parent.password !== parent.confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
      if (!parent.referralSource) {
        setError("Please tell us how you heard about us");
        return false;
      }
      if (!parent.address || !parent.suburb || !parent.state) {
        setError("Please complete your residential address");
        return false;
      }
      if (!/^\d{4}$/.test(parent.postcode)) {
        setError("Please enter a valid 4-digit postcode");
        return false;
      }
    }

    if (step === "student") {
      if (!student.firstName || !student.lastName) {
        setError("Please enter student's full name");
        return false;
      }
      if (!student.gender || !student.dateOfBirth) {
        setError("Please complete student's profile details");
        return false;
      }
      if (!student.schoolName || !student.gradeLevel) {
        setError("Please enter student's school and year level");
        return false;
      }
    }

    if (step === "course") {
      if (selection.subjects.length === 0) {
        setError("Please select at least one subject");
        return false;
      }
      for (const s of selection.subjects) {
        if (!s.courseId || !s.classId) {
          setError(`Please select a course and class for ${s.subject}`);
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        setCurrentStep(steps[nextIndex]);
      }
    }
  };

  const handleBack = () => {
    setError("");
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleSubmit = async () => {
    if (!enrolmentData.termsAccepted) {
      setError("Please accept the terms and conditions");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/enrol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enrolmentData),
      });
      const result = await res.json();
      if (!res.ok) {
        const message = result.error || result.detail || "Enrolment failed";
        console.error("Enrolment failed", result);
        throw new Error(message);
      }

      if (enrolmentData.paymentMethod === 'stripe') {
        const checkoutRes = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentName: `${enrolmentData.student.firstName} ${enrolmentData.student.lastName}`,
              yearLevel: enrolmentData.student.gradeLevel,
              courseName: enrolmentData.selection.subjects.map(s => s.courseName).join(", "),
              parentEmail: enrolmentData.parent.email,
              studentId: result.studentId,
              subjectCount: enrolmentData.selection.subjects.length,
              selections: enrolmentData.selection.subjects // Pass full selections for granular pricing
            }),
          });
        const checkoutResult = await checkoutRes.json();
        if (!checkoutRes.ok) throw new Error(checkoutResult.error || "Checkout failed");
        
        localStorage.removeItem("enrolmentData");
        localStorage.removeItem("enrolmentStep");
        
        window.location.href = checkoutResult.url + `&studentNumber=${encodeURIComponent(result.studentNumber)}&studentPassword=${encodeURIComponent(result.studentPassword)}`;
        } else {
          localStorage.removeItem("enrolmentData");
          localStorage.removeItem("enrolmentStep");
          
          router.push(`/enrol/success?method=bank_transfer&studentId=${result.studentId}&amount=${calculateTotalPrice()}&studentNumber=${encodeURIComponent(result.studentNumber)}&studentPassword=${encodeURIComponent(result.studentPassword)}`);
        }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Account creation failed.");
    } finally {
      setLoading(false);
    }
  };

    const updateData = (section: keyof EnrolmentData, field: string, value: any) => {
      if (section === 'termsAccepted' || section === 'paymentMethod') {
        setEnrolmentData(prev => ({ ...prev, [section]: value }));
        return;
      }
      
      setEnrolmentData((prev) => {
        const newData = {
          ...prev,
          [section]: { ...(prev[section as keyof EnrolmentData] as any), [field]: value }
        };
        return newData;
      });
    };

    const toggleSubject = (subject: string) => {
      setEnrolmentData(prev => {
        const exists = prev.selection.subjects.find(s => s.subject === subject);
        const subjects = exists
          ? prev.selection.subjects.filter(s => s.subject !== subject)
          : [...prev.selection.subjects, { subject, courseId: "", courseName: "", classId: "", className: "", price: 0 }];
        return {
          ...prev,
          selection: { ...prev.selection, subjects }
        };
      });
    };

    const updateSubjectSelection = (subject: string, field: keyof SubjectSelection, value: any) => {
      setEnrolmentData(prev => ({
        ...prev,
        selection: {
          ...prev.selection,
          subjects: prev.selection.subjects.map(s => {
            if (s.subject === subject) {
              const updated = { ...s, [field]: value };
              
              // If course changed, reset class and update price
              if (field === 'courseId') {
                // Handle synthetic course values with year suffix (courseId|yearX)
                const courseId = typeof value === 'string' && value.includes('|year') ? value.split('|')[0] : value;
                const course = dbCourses.find(c => c.id === courseId);
                updated.courseName = course?.name || "";
                updated.classId = "";
                updated.className = "";
                
                // Pricing logic
                // Rule: Year 7-10 classes AND Year 11 Standard AND Year 12 Standard 1 => $450; everything else $750
                const isSyntheticYear = typeof value === 'string' && value.includes('|year');
                const yearNumber = isSyntheticYear ? parseInt(value.split('|')[1].replace('year', ''), 10) : undefined;
                if (yearNumber && yearNumber >= 7 && yearNumber <= 10) {
                  updated.price = 450;
                } else if (course) {
                  const name = course.name.toLowerCase();
                  // Default for course-level pricing when not synthetic
                  if (name.includes('standard') && (name.includes('year 11') || name.includes('year 12 standard 1'))) {
                    updated.price = 450;
                  } else {
                    updated.price = 750;
                  }
                } else {
                  updated.price = 0;
                }
              }
              
              if (field === 'classId') {
                const cls = dbClasses.find(c => c.id === value);
                updated.className = cls?.name || "";
                // Always set pricing based on class name rules
                if (cls) {
                  const n = cls.name.toLowerCase();
                  if (
                    n.includes('year 7') ||
                    n.includes('year 8') ||
                    n.includes('year 9') ||
                    n.includes('year 10') ||
                    n.includes('year 11 standard') ||
                    n.includes('year 12 standard 1')
                  ) {
                    updated.price = 450;
                  } else {
                    updated.price = 750;
                  }
                }
              }
              
              return updated;
            }
            return s;
          })
        }
      }));
    };

  const inputClasses = "w-full bg-transparent border-b border-[#e5e5e5] py-4 text-[#1a1a1a] focus:outline-none focus:border-[#c9a962] transition-colors";
  const labelClasses = "text-[10px] tracking-[0.2em] uppercase text-[#a1a1aa] mb-1 block";

  return (
    <main className="bg-[#fafaf9] min-h-screen flex items-center justify-center py-20 noise-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2 }}
        className="relative z-10 w-full max-w-4xl px-6"
      >
        <div className="bg-white border border-[#e5e5e5] p-10 lg:p-20 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)]">
          <div className="mb-16 text-center">
              <Link href="/" className="inline-block mb-10 group">
                <span className="text-[10px] tracking-[0.4em] uppercase text-[#a1a1aa] group-hover:text-[#c9a962] transition-colors">← Back to Home</span>
              </Link>
              <h1 className="font-serif text-5xl lg:text-7xl text-[#1a1a1a] mb-4">
                Student <span className="italic font-light text-[#c9a962]">Enrolment</span>
              </h1>
            <div className="flex justify-center gap-2 mt-8">
              {steps.map((_, i) => (
                <div key={i} className={`h-1 w-12 transition-all duration-500 ${i <= currentStepIndex ? 'bg-[#c9a962]' : 'bg-[#f4f4f5]'}`} />
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border-l-2 border-red-500 text-red-600 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
                  {currentStep === 'parent' && (
                    <motion.div key="p" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                      <h2 className="text-[10px] tracking-[0.3em] uppercase text-[#c9a962] font-bold">Primary Guardian Details</h2>
                  <div className="grid md:grid-cols-2 gap-10">
                    <div>
                      <label className={labelClasses}>First Name</label>
                      <input type="text" value={enrolmentData.parent.firstName} onChange={e => updateData('parent', 'firstName', e.target.value)} className={inputClasses} required />
                    </div>
                    <div>
                      <label className={labelClasses}>Last Name</label>
                      <input type="text" value={enrolmentData.parent.lastName} onChange={e => updateData('parent', 'lastName', e.target.value)} className={inputClasses} required />
                    </div>
                    <div>
                      <label className={labelClasses}>Active Email</label>
                      <input type="email" value={enrolmentData.parent.email} onChange={e => updateData('parent', 'email', e.target.value)} className={inputClasses} required />
                    </div>
                    <div>
                      <label className={labelClasses}>Mobile Number</label>
                      <input type="tel" value={enrolmentData.parent.phone} onChange={e => updateData('parent', 'phone', e.target.value)} className={inputClasses} required />
                    </div>
                    <div>
                      <label className={labelClasses}>Relationship to Student</label>
                      <select value={enrolmentData.parent.relationship} onChange={e => updateData('parent', 'relationship', e.target.value)} className={inputClasses} required>
                        <option value="">Select Relationship</option>
                        <option value="Mother">Mother</option>
                        <option value="Father">Father</option>
                        <option value="Guardian">Guardian</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClasses}>Occupation</label>
                      <input type="text" value={enrolmentData.parent.occupation} onChange={e => updateData('parent', 'occupation', e.target.value)} className={inputClasses} />
                    </div>
                    <div>
                      <label className={labelClasses}>Security Key (Password)</label>
                      <input type="password" value={enrolmentData.parent.password} onChange={e => updateData('parent', 'password', e.target.value)} className={inputClasses} required />
                    </div>
                    <div>
                      <label className={labelClasses}>Confirm Security Key</label>
                      <input type="password" value={enrolmentData.parent.confirmPassword} onChange={e => updateData('parent', 'confirmPassword', e.target.value)} className={inputClasses} required />
                    </div>
                    <div>
                      <label className={labelClasses}>How did you hear about us?</label>
                      <select value={enrolmentData.parent.referralSource} onChange={e => updateData('parent', 'referralSource', e.target.value)} className={inputClasses} required>
                        <option value="">Select Source</option>
                        <option value="Friends/Family">Friends / Family</option>
                        <option value="Social Media">Social Media</option>
                        <option value="Google Search">Google Search</option>
                        <option value="Newspaper/Magazine">Newspaper / Magazine</option>
                        <option value="School Recommendation">School Recommendation</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-10 pt-4">
                    <h3 className="text-[8px] tracking-[0.3em] uppercase text-[#1a1a1a] font-bold">Residential Address</h3>
                    <div className="grid md:grid-cols-2 gap-10">
                        <div className="md:col-span-2 relative" ref={addressContainerRef}>
                          <label className={labelClasses}>Address</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              value={enrolmentData.parent.address} 
                              onChange={e => {
                                updateData('parent', 'address', e.target.value);
                              }} 
                              className={inputClasses} 
                              placeholder="Start typing your address..."
                              required 
                            />
                            {isSearchingAddress && (
                              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-[#c9a962]/30 border-t-[#c9a962] rounded-full animate-spin" />
                              </div>
                            )}
                          </div>
                          
                              {addressSuggestions.length > 0 && (
                                <div 
                                  className="absolute z-[100] w-full bg-white border border-[#e5e5e5] shadow-2xl mt-1 max-h-72 overflow-y-auto custom-scrollbar"
                                  style={{ overscrollBehavior: 'contain' }}
                                >
                                    {addressSuggestions.map((suggestion, i) => {
                                      const { address, display_name } = suggestion;
                                      const parts: string[] = display_name.split(', ');
                                      const queryInput = enrolmentData.parent.address.trim();
                                      const queryMatch = queryInput.match(/^(\d+[a-zA-Z0-9\-\/]*)/);
                                      const queryNumber = queryMatch ? queryMatch[1] : "";

                                      let houseNumber = address.house_number || "";
                                      let street = address.road || address.pedestrian || address.cycleway || "";

                                      if (!houseNumber && queryNumber && !/^\d/.test(parts[0])) {
                                        houseNumber = queryNumber;
                                      }

                                      let mainAddress = "";
                                      let subAddress = "";

                                      if (houseNumber) {
                                        const streetPart = street || (!/^\d/.test(parts[0]) ? parts[0] : parts[1]);
                                        mainAddress = `${houseNumber} ${streetPart}`;
                                        subAddress = parts
                                          .filter((part: string) => part !== houseNumber && part !== streetPart && part !== address.house_number)
                                          .join(', ');
                                      } else {
                                        mainAddress = parts[0];
                                        subAddress = parts.slice(1).join(', ');
                                      }

                                      return (
                                        <button
                                          key={i}
                                          type="button"
                                          onClick={() => selectAddress(suggestion)}
                                          className="w-full text-left p-4 hover:bg-[#c9a962]/10 border-b border-[#f4f4f5] last:border-0 transition-colors cursor-pointer block"
                                        >
                                          <p className="text-sm font-bold text-[#1a1a1a]">
                                            {mainAddress}
                                          </p>
                                          <p className="text-[10px] text-[#a1a1aa] uppercase tracking-wider line-clamp-1">
                                            {subAddress}
                                          </p>
                                        </button>
                                      );
                                    })}
                                </div>
                              )}

                          {addressSuggestions.length === 0 && enrolmentData.parent.address.length >= 3 && !isSearchingAddress && !isSelectingAddress && (
                            <div className="absolute z-[100] w-full bg-white border border-[#e5e5e5] shadow-2xl mt-1 p-4 text-xs text-[#a1a1aa] uppercase tracking-widest">
                              No addresses found in Australia
                            </div>
                          )}
                        </div>
                      <div>
                        <label className={labelClasses}>Suburb</label>
                        <input type="text" value={enrolmentData.parent.suburb} onChange={e => updateData('parent', 'suburb', e.target.value)} className={inputClasses} required />
                      </div>
                      <div>
                        <label className={labelClasses}>Postcode</label>
                        <input type="text" value={enrolmentData.parent.postcode} onChange={e => updateData('parent', 'postcode', e.target.value)} className={inputClasses} required />
                      </div>
                      <div>
                        <label className={labelClasses}>State</label>
                        <select value={enrolmentData.parent.state} onChange={e => updateData('parent', 'state', e.target.value)} className={inputClasses} required>
                          <option value="">Select State</option>
                          <option value="NSW">NSW</option>
                          <option value="VIC">VIC</option>
                          <option value="QLD">QLD</option>
                          <option value="WA">WA</option>
                          <option value="SA">SA</option>
                          <option value="TAS">TAS</option>
                          <option value="ACT">ACT</option>
                          <option value="NT">NT</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

                  {currentStep === 'student' && (
                    <motion.div key="s" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                      <h2 className="text-[10px] tracking-[0.3em] uppercase text-[#c9a962] font-bold">Scholar Profile</h2>
                  <div className="grid md:grid-cols-2 gap-10">
                    <div>
                      <label className={labelClasses}>First Name</label>
                      <input type="text" value={enrolmentData.student.firstName} onChange={e => updateData('student', 'firstName', e.target.value)} className={inputClasses} required />
                    </div>
                    <div>
                      <label className={labelClasses}>Last Name</label>
                      <input type="text" value={enrolmentData.student.lastName} onChange={e => updateData('student', 'lastName', e.target.value)} className={inputClasses} required />
                    </div>
                    <div>
                      <label className={labelClasses}>Gender</label>
                      <select value={enrolmentData.student.gender} onChange={e => updateData('student', 'gender', e.target.value)} className={inputClasses} required>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClasses}>Date of Birth</label>
                      <input type="date" value={enrolmentData.student.dateOfBirth} onChange={e => updateData('student', 'dateOfBirth', e.target.value)} className={inputClasses} required />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClasses}>School Name</label>
                      <input type="text" value={enrolmentData.student.schoolName} onChange={e => updateData('student', 'schoolName', e.target.value)} className={inputClasses} required />
                    </div>
                    <div>
                      <label className={labelClasses}>Year Level</label>
                      <select value={enrolmentData.student.gradeLevel} onChange={e => updateData('student', 'gradeLevel', e.target.value)} className={inputClasses} required>
                        <option value="">Select Academic Level</option>
                        {[7,8,9,10,11,12].map(g => <option key={g} value={g.toString()}>Year {g}</option>)}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

                  {currentStep === 'course' && (
                    <motion.div key="c" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                      <h2 className="text-[10px] tracking-[0.3em] uppercase text-[#c9a962] font-bold">Subject Selection</h2>
                      <p className="text-xs text-[#71717a] uppercase tracking-widest">Please select the subjects you wish to enrol in.</p>
                  
                  {/* Subject Toggle Buttons */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {subjectsList.map((subject) => (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => toggleSubject(subject)}
                        className={`p-6 text-left border transition-all duration-300 flex justify-between items-center ${
                          enrolmentData.selection.subjects.some(s => s.subject === subject)
                            ? 'border-[#c9a962] bg-[#c9a962]/5'
                            : 'border-[#e5e5e5] hover:border-[#c9a962]/30 bg-white'
                        }`}
                      >
                        <span className={`text-sm tracking-widest uppercase ${
                          enrolmentData.selection.subjects.some(s => s.subject === subject) ? 'text-[#1a1a1a] font-bold' : 'text-[#71717a]'
                        }`}>
                          {subject}
                        </span>
                        {enrolmentData.selection.subjects.some(s => s.subject === subject) && (
                          <div className="w-2 h-2 rounded-full bg-[#c9a962]" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Course & Class Selection for each selected subject */}
                  <div className="space-y-12 mt-12">
                    {enrolmentData.selection.subjects.map((selection, idx) => (
                      <motion.div 
                        key={selection.subject}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-8 border border-[#e5e5e5] bg-white relative"
                      >
                        <div className="absolute -top-3 left-6 bg-white px-4 text-[10px] tracking-widest uppercase font-bold text-[#c9a962]">
                          {selection.subject} Configuration
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-10">
                          <div>
                            <label className={labelClasses}>Select Course</label>
                            <select 
                              value={selection.courseId} 
                              onChange={e => updateSubjectSelection(selection.subject, 'courseId', e.target.value)} 
                              className={inputClasses}
                            >
                              <option value="">Select a Course</option>

                              {/* Special handling for Mathematics: show Year 7-12 buckets */}
                              {selection.subject.toLowerCase().includes('mathematics')
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
                                : selection.subject.toLowerCase().includes('science') && selection.subject.toLowerCase().includes('year')
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
                                        const subject = selection.subject.toLowerCase();
                                        
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
                              value={selection.classId} 
                              onChange={e => updateSubjectSelection(selection.subject, 'classId', e.target.value)} 
                              className={inputClasses}
                              disabled={!selection.courseId}
                            >
                              <option value="">Select a Class</option>
                              {dbClasses
                                .filter(cls => {
                                  // Handle Year-bucket synthetic course values "courseId|yearX" for Math and Science
                                  if (selection.courseId && selection.courseId.includes('|year')) {
                                    const [courseId, yearTag] = selection.courseId.split('|');
                                    const matchesCourse = cls.course_id === courseId;
                                    const yearNum = yearTag.replace('year', '');
                                    const matchesYear = cls.name.toLowerCase().includes(`year ${yearNum}`);
                                    return matchesCourse && matchesYear;
                                  }
                                  return cls.course_id === selection.courseId;
                                })
                                .map(cls => {
                                  // For Physics/Chemistry/Biology, strip subject name and show only year level
                                  let displayName = cls.name;
                                  if (cls.name.includes('Physics') || cls.name.includes('Chemistry') || cls.name.includes('Biology')) {
                                    displayName = cls.name.replace(/Physics|Chemistry|Biology/gi, '').trim();
                                  }
                                  return (
                                    <option key={cls.id} value={cls.id}>{displayName} ({cls.day_of_week} {cls.start_time})</option>
                                  );
                                })
                              }
                            </select>
                          </div>
                        </div>

                        {selection.price > 0 && (
                          <div className="mt-6 flex justify-end">
                            <span className="text-[10px] tracking-widest uppercase text-[#a1a1aa]">
                              Fee: <span className="text-[#1a1a1a] font-bold">${selection.price}</span>
                            </span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

                {currentStep === 'summary' && (
                  <motion.div key="sum" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                    <h2 className="text-[10px] tracking-[0.3em] uppercase text-[#c9a962] font-bold mb-10 text-center">Manifest Review</h2>
                    <div className="space-y-px bg-[#e5e5e5] border border-[#e5e5e5]">
                      <div className="bg-[#fafaf9] p-8">
                        <span className="text-[8px] uppercase tracking-widest text-[#a1a1aa] block mb-2">Primary Guardian</span>
                        <p className="font-bold text-[#1a1a1a]">{enrolmentData.parent.firstName} {enrolmentData.parent.lastName}</p>
                        <p className="text-xs text-[#71717a]">{enrolmentData.parent.email} | {enrolmentData.parent.phone}</p>
                      </div>
                      <div className="bg-[#fafaf9] p-8">
                        <span className="text-[8px] uppercase tracking-widest text-[#a1a1aa] block mb-2">Student</span>
                        <p className="font-bold text-[#1a1a1a]">{enrolmentData.student.firstName} {enrolmentData.student.lastName}</p>
                        <p className="text-xs text-[#71717a]">Year {enrolmentData.student.gradeLevel} | {enrolmentData.student.schoolName}</p>
                      </div>
                      <div className="bg-[#fafaf9] p-8">
                        <span className="text-[8px] uppercase tracking-widest text-[#a1a1aa] block mb-2">Selected Enrolments</span>
                        <div className="space-y-4 mt-2">
                          {enrolmentData.selection.subjects.map(s => (
                            <div key={s.subject} className="flex justify-between items-center border-b border-[#e5e5e5] pb-2 last:border-0">
                              <div>
                                <span className="px-2 py-0.5 bg-[#c9a962]/10 text-[#c9a962] text-[8px] uppercase font-bold tracking-widest rounded-full mr-2">
                                  {s.subject}
                                </span>
                                <span className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">{s.courseName}</span>
                                <p className="text-[10px] text-[#a1a1aa] uppercase tracking-widest mt-0.5">{s.className}</p>
                              </div>
                              <span className="text-xs font-bold text-[#c9a962]">${s.price}</span>
                            </div>
                          ))}
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#1a1a1a]">Total</span>
                            <span className="text-lg font-serif italic text-[#c9a962]">${calculateTotalPrice()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                        <div 
                          className="pt-8 flex items-start gap-4 cursor-pointer group p-4 border border-transparent hover:border-[#c9a962]/20 hover:bg-[#c9a962]/5 transition-all duration-300 rounded-lg"
                          onClick={() => setIsTermsModalOpen(true)}
                        >
                          <div className="mt-1 relative flex items-center">
                            <input 
                              type="checkbox" 
                              id="terms" 
                              readOnly
                              checked={enrolmentData.termsAccepted}
                              className="accent-[#c9a962] w-5 h-5 cursor-pointer"
                            />
                          </div>
                          <label htmlFor="terms" className="text-xs uppercase tracking-[0.15em] leading-relaxed text-[#71717a] cursor-pointer group-hover:text-[#1a1a1a] transition-colors">
                            I agree to the <span className="text-[#c9a962] font-bold border-b border-[#c9a962]/30 group-hover:border-[#c9a962]">Terms of Service</span> and <span className="text-[#c9a962] font-bold border-b border-[#c9a962]/30 group-hover:border-[#c9a962]">Privacy Policy</span>.
                          </label>
                        </div>

                  </motion.div>
                )}

                  {currentStep === 'payment' && (
                    <motion.div key="pay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-10 text-center">
                      <h3 className="font-serif text-3xl text-[#1a1a1a] mb-4 uppercase italic">Choose Payment Method</h3>
                      <p className="text-[#a1a1aa] text-xs uppercase tracking-widest mb-10">Select your preferred way to complete enrolment.</p>
                      
                      <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl mb-12">
                        <button
                          onClick={() => updateData('paymentMethod', '', 'stripe')}
                          className={`p-8 border text-left transition-all ${
                            enrolmentData.paymentMethod === 'stripe'
                              ? 'border-[#c9a962] bg-[#c9a962]/5 ring-1 ring-[#c9a962]'
                              : 'border-[#e5e5e5] hover:border-[#c9a962]/50'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${enrolmentData.paymentMethod === 'stripe' ? 'border-[#c9a962]' : 'border-[#e5e5e5]'}`}>
                              {enrolmentData.paymentMethod === 'stripe' && <div className="w-2.5 h-2.5 rounded-full bg-[#c9a962]" />}
                            </div>
                            <span className="text-[10px] tracking-widest uppercase text-[#c9a962] font-bold">Secure</span>
                          </div>
                          <h4 className="font-serif text-2xl text-[#1a1a1a] mb-2">Stripe Checkout</h4>
                          <p className="text-xs text-[#71717a] leading-relaxed">Pay instantly with Credit Card or Apple/Google Pay. Immediate enrolment confirmation.</p>
                        </button>

                        <button
                          onClick={() => updateData('paymentMethod', '', 'bank_transfer')}
                          className={`p-8 border text-left transition-all ${
                            enrolmentData.paymentMethod === 'bank_transfer'
                              ? 'border-[#c9a962] bg-[#c9a962]/5 ring-1 ring-[#c9a962]'
                              : 'border-[#e5e5e5] hover:border-[#c9a962]/50'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${enrolmentData.paymentMethod === 'bank_transfer' ? 'border-[#c9a962]' : 'border-[#e5e5e5]'}`}>
                              {enrolmentData.paymentMethod === 'bank_transfer' && <div className="w-2.5 h-2.5 rounded-full bg-[#c9a962]" />}
                            </div>
                          </div>
                          <h4 className="font-serif text-2xl text-[#1a1a1a] mb-2">Bank Transfer</h4>
                          <p className="text-xs text-[#71717a] leading-relaxed">Direct transfer to our account. Enrolment confirmed once funds are received (1-2 days).</p>
                        </button>
                      </div>

                      <div className="bg-[#fafaf9] border border-[#e5e5e5] p-6 mb-8 w-full max-w-sm">
                        <p className="text-[10px] tracking-[0.2em] uppercase text-[#a1a1aa] mb-2">Total Amount Due</p>
                        <p className="font-serif text-4xl text-[#c9a962]">
                          ${calculateTotalPrice().toFixed(2)}
                        </p>
                        <p className="text-xs text-[#71717a] mt-2">
                          {enrolmentData.selection.subjects.length} Subject(s) Enrolled
                        </p>
                      </div>

                      {enrolmentData.paymentMethod === 'bank_transfer' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-8 p-6 bg-white border border-[#c9a962]/30 text-left max-w-sm"
                        >
                          <h5 className="text-[10px] tracking-widest uppercase font-bold text-[#c9a962] mb-4">Bank Details</h5>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-[#a1a1aa]">Account Name:</span>
                                <span className="font-medium text-[#1a1a1a]">VIGYANIT ACADEMY PTY LTD</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#a1a1aa]">BSB:</span>
                                <span className="font-medium text-[#1a1a1a]">062703</span>
                              </div>
                                <div className="flex justify-between">
                                  <span className="text-[#a1a1aa]">Account Number:</span>
                                  <span className="font-medium text-[#1a1a1a]">10862095</span>
                                </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#a1a1aa]">Amount:</span>
                                    <span className="font-bold text-[#c9a962]">
                                      ${calculateTotalPrice().toFixed(2)}
                                    </span>
                                  </div>

                              <div className="flex justify-between">
                              <span className="text-[#a1a1aa]">Reference:</span>
                              <span className="font-medium text-[#c9a962] italic uppercase">
                                {enrolmentData.student.lastName || "STUDENT"}-{enrolmentData.student.firstName?.slice(0,1) || ""}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <p className="text-[10px] text-[#71717a] max-w-md">
                        {enrolmentData.paymentMethod === 'stripe' 
                          ? "You will be redirected to Stripe to complete payment securely."
                          : "Your account will be created, and you will receive instructions to complete your transfer."}
                      </p>
                    </motion.div>
                  )}
              </AnimatePresence>
            </div>

            <div className="mt-20 flex justify-between">
              {currentStepIndex > 0 ? (
                <button onClick={handleBack} className="text-[10px] tracking-[0.3em] font-bold uppercase text-[#a1a1aa] hover:text-[#1a1a1a] transition-colors">Back</button>
              ) : <div />}
              
              {currentStepIndex < steps.length - 1 ? (
                <button onClick={handleNext} className="px-12 py-5 text-[10px] tracking-[0.4em] uppercase bg-[#1a1a1a] text-[#fafaf9] hover:bg-[#c9a962] transition-colors">Next →</button>
              ) : (
                <button onClick={handleSubmit} disabled={loading} className="px-12 py-5 text-[10px] tracking-[0.4em] uppercase bg-[#c9a962] text-white hover:bg-[#1a1a1a] transition-colors">{loading ? "Processing..." : "Proceed to Payment"}</button>
              )}
          </div>
        </div>
      </motion.div>

      <TermsModal 
        isOpen={isTermsModalOpen} 
        onClose={() => setIsTermsModalOpen(false)} 
        onAccept={() => {
          updateData('termsAccepted', '', true);
          setIsTermsModalOpen(false);
        }} 
      />
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f4f4f5;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c9a962;
          border-radius: 10px;
          border: 2px solid #f4f4f5;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #b69858;
        }
      `}</style>
    </main>
  );
}
