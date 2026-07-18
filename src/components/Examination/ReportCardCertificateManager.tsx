import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FileText, Printer, Search, RefreshCw, X,
  Loader2, BookOpen
} from 'lucide-react';

interface StudentDocRow {
  id: number;
  studentName: string;
  rollNo: string;
  className: string;
  reportCardStatus: 'Generated' | 'Pending';
  tcStatus: 'Eligible' | 'Issued' | 'None';
}

interface StudentDetailMark {
  id: number;
  exam_name: string;
  subject_name: string;
  subject_code: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  status: string;
  remarks: string | null;
}

interface StudentDetailData {
  student: {
    id: number;
    name: string;
    admission_no: string;
    roll_no: string;
    class: string;
  };
  marks: StudentDetailMark[];
}

interface DropdownOption {
  value: string;
  label: string;
}

import { useLocation } from 'react-router-dom';

export default function ReportCardCertificateManager() {
  const location = useLocation();
  const isCertificates = location.pathname.includes('certificates');

  const [students, setStudents] = useState<StudentDocRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Dropdown options
  const [academicYears, setAcademicYears] = useState<DropdownOption[]>([]);
  const [classes, setClasses] = useState<DropdownOption[]>([]);
  const [examinations, setExaminations] = useState<DropdownOption[]>([]);

  // Selected filters
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Bulk compilation state
  const [compiling, setCompiling] = useState(false);

  // Preview Modals
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<StudentDocRow | null>(null);
  const [previewDocType, setPreviewDocType] = useState<'report' | 'tc'>('report');

  // Loaded details for report cards
  const [studentDetail, setStudentDetail] = useState<StudentDetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Issue TC state
  const [remarks, setRemarks] = useState('');
  const [issuing, setIssuing] = useState(false);

  // Fetch dropdowns
  const fetchMasters = useCallback(async () => {
    try {
      const [mastRes, examRes] = await Promise.all([
        api.get('/student-exams/masters'),
        api.get('/student-exams/exams', { params: { is_active: '1' } }),
      ]);
      if (mastRes.data.success) {
        const { academicYears: ay, classes: cl } = mastRes.data.data;
        setAcademicYears((ay || []).map((y: any) => ({ value: String(y.value), label: y.label })));
        setClasses((cl || []).map((c: any) => ({ value: String(c.value), label: c.label })));
        if (ay && ay.length > 0) setSelectedYear(String(ay[0].value));
        if (cl && cl.length > 0) setSelectedClass(String(cl[0].value));
      }
      if (examRes.data.success) {
        const examOpts = (examRes.data.data || []).map((e: any) => ({
          value: String(e.id),
          label: `${e.class_name} — ${e.name}`,
        }));
        setExaminations(examOpts);
        if (examOpts.length > 0) setSelectedExam(examOpts[0].value);
      }
    } catch {
      toast.error('Failed to load filter dropdowns');
    }
  }, []);

  // Fetch students list with statuses
  const fetchStudents = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const res = await api.get('/student-exams/documents', {
        params: {
          class_id: selectedClass,
          exam_id: selectedExam || undefined
        }
      });
      if (res.data.success) {
        setStudents(res.data.data);
      }
    } catch {
      toast.error('Failed to retrieve student document logs');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedExam]);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Bulk compilation trigger
  const handleBulkCompile = async () => {
    if (!selectedExam || !selectedClass) {
      toast.error('Please select examination and class target parameters');
      return;
    }
    setCompiling(true);
    try {
      const res = await api.post('/student-exams/results/process', {
        exam_id: selectedExam,
        class_id: selectedClass
      });
      if (res.data.success) {
        toast.success('All reports compiled and generated successfully');
        fetchStudents();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Report compilation failed');
    } finally {
      setCompiling(false);
    }
  };

  // Preview report card
  const handleOpenReportPreview = async (student: StudentDocRow) => {
    setActiveStudent(student);
    setPreviewDocType('report');
    setIsPreviewOpen(true);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/student-exams/students/${student.id}/result`);
      if (res.data.success) {
        setStudentDetail(res.data.data);
      }
    } catch {
      toast.error('Failed to load report card details');
      setIsPreviewOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Issue Transfer Certificate
  const handleIssueTC = async () => {
    if (!activeStudent) return;
    setIssuing(true);
    try {
      const res = await api.post('/student-exams/documents/issue-certificate', {
        student_id: activeStudent.id,
        certificate_type: 'transfer',
        remarks: remarks || 'Academic Completion and Transfer'
      });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchStudents();
        setIsPreviewOpen(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to issue TC');
    } finally {
      setIssuing(false);
    }
  };

  // Search filter
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const q = searchTerm.toLowerCase();
    return students.filter(s =>
      s.studentName.toLowerCase().includes(q) ||
      s.rollNo.toLowerCase().includes(q)
    );
  }, [students, searchTerm]);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            {isCertificates ? 'Certificate Management Desk' : 'Report Card Generation'}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {isCertificates
              ? 'Issue and print student leaving and Transfer Certificates (TC).'
              : 'Generate, preview, and print formal student academic report cards.'}
          </p>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-250 bg-white font-semibold text-slate-700"
            >
              {academicYears.map(ay => <option key={ay.value} value={ay.value}>{ay.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Class / Grade Room</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-250 bg-white font-semibold text-slate-700"
            >
              <option value="">Select Class</option>
              {classes.map(cls => <option key={cls.value} value={cls.value}>{cls.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Examination Target</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-250 bg-white font-semibold text-slate-700"
            >
              <option value="">Select Exam</option>
              {examinations.map(ex => <option key={ex.value} value={ex.value}>{ex.label}</option>)}
            </select>
          </div>

          <div>
            {!isCertificates ? (
              <button
                onClick={handleBulkCompile}
                disabled={compiling}
                className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded-lg text-xs shadow-sm transition disabled:opacity-55"
              >
                {compiling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Bulk Compile Reports</span>
              </button>
            ) : (
              <div className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 py-1.5 rounded-lg text-center font-black uppercase tracking-wider">
                📄 Certificate Desk Active
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Student Docs log list */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-white border border-slate-250 rounded-lg px-2.5 py-0.5 h-7">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search student name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-[10px] outline-none border-none bg-transparent w-44 placeholder-slate-400"
            />
          </div>
          <span className="text-[10px] text-slate-400 font-bold">{filteredStudents.length} student records</span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-450">Loading student documents log...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-400">No student logs found.</p>
            <p className="text-[10px] text-slate-300 mt-1">Select class parameters to load details.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9.5px]">
                  <th className="py-2.5 px-4 w-28">Roll No</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4">Class Room</th>
                  {!isCertificates && <th className="py-2.5 px-4 text-center">Report Card Status</th>}
                  {isCertificates && <th className="py-2.5 px-4 text-center">TC Status</th>}
                  <th className="py-2.5 px-4 text-center w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-650">
                {filteredStudents.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/20 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-slate-500">{item.rollNo}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-800">{item.studentName}</td>
                    <td className="py-2.5 px-4 text-slate-500">{item.className}</td>

                    {!isCertificates && (
                      <td className="py-2.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.reportCardStatus === 'Generated'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {item.reportCardStatus}
                        </span>
                      </td>
                    )}

                    {isCertificates && (
                      <td className="py-2.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.tcStatus === 'Issued' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          item.tcStatus === 'Eligible' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {item.tcStatus}
                        </span>
                      </td>
                    )}

                    <td className="py-2.5 px-4 text-center">
                      <div className="flex justify-center gap-1.5">
                        {!isCertificates ? (
                          <button
                            onClick={() => handleOpenReportPreview(item)}
                            disabled={item.reportCardStatus === 'Pending'}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-250 transition-all disabled:opacity-40"
                          >
                            Report Card
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveStudent(item);
                              setPreviewDocType('tc');
                              setIsPreviewOpen(true);
                            }}
                            disabled={item.tcStatus === 'None'}
                            className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-250 transition-all disabled:opacity-40"
                          >
                            TC Document
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {isPreviewOpen && activeStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">
                {previewDocType === 'report' ? 'Academic Report Card' : 'Official Transfer Certificate'}
              </h3>
              <button onClick={() => { setIsPreviewOpen(false); setStudentDetail(null); }} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Document Template Container */}
              <div className="border-4 double border-slate-400 p-6 bg-white font-serif text-slate-800 space-y-4 shadow-inner text-sm relative">
                {previewDocType === 'report' ? (
                  <>
                    {/* Report Card */}
                    <div className="text-center space-y-1 pb-4 border-b-2 border-slate-800">
                      <h2 className="text-lg font-bold font-sans tracking-wide">SPRINGDALE CENTRAL SCHOOL</h2>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-sans font-bold">Annual Academic Performance Sheet</p>
                      <p className="text-xs font-sans font-semibold">Session: 2026-2027</p>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 text-xs font-sans border-b pb-4">
                      <div>Name: <strong className="text-slate-900 font-bold">{activeStudent.studentName}</strong></div>
                      <div>Roll No: <span className="font-bold">{activeStudent.rollNo}</span></div>
                      <div>Class: <span className="font-bold">{activeStudent.className}</span></div>
                      <div>Exam Term: <span className="font-bold">{selectedExam}</span></div>
                    </div>

                    {loadingDetail ? (
                      <div className="py-8 text-center">
                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                        <p className="text-[10px] text-slate-400 mt-2">Loading details...</p>
                      </div>
                    ) : studentDetail ? (
                      <table className="w-full text-left font-sans text-xs border border-slate-350">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-350 font-bold text-slate-800">
                            <th className="p-2">Subject Name</th>
                            <th className="p-2 text-right">Obtained Marks</th>
                            <th className="p-2 text-right">Total Marks</th>
                            <th className="p-2 text-center">Percentage</th>
                            <th className="p-2 text-center">Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-medium">
                          {studentDetail.marks.map((m) => (
                            <tr key={m.id}>
                              <td className="p-2 font-semibold text-slate-700">{m.subject_name}</td>
                              <td className="p-2 text-right font-black text-slate-850">{m.marks_obtained}</td>
                              <td className="p-2 text-right text-slate-500">{m.total_marks}</td>
                              <td className="p-2 text-center font-bold">{m.percentage.toFixed(1)}%</td>
                              <td className="p-2 text-center font-bold text-indigo-650 font-mono">{m.grade}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400">Failed to load detailed marks sheet.</div>
                    )}

                    <div className="flex justify-between items-end pt-6 font-sans font-bold text-[10px]">
                      <div className="text-center w-36 border-t border-slate-300 pt-1 text-slate-400">Class Teacher</div>
                      <div className="text-center w-36 border-t border-slate-300 pt-1 text-slate-400">Controller of Exams</div>
                      <div className="text-center w-36 border-t border-slate-300 pt-1 text-slate-650 font-black">Principal Seal</div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Transfer Certificate */}
                    <div className="text-center space-y-1 pb-4 border-b-2 border-slate-800">
                      <h2 className="text-lg font-bold font-sans tracking-wide">SPRINGDALE CENTRAL SCHOOL</h2>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-sans font-bold">School Leaving Certificate</p>
                    </div>

                    <div className="space-y-4 text-xs font-serif leading-relaxed text-justify py-4">
                      <p>
                        This is to certify that <strong className="text-slate-900 border-b border-slate-300 px-1">{activeStudent.studentName}</strong>,
                        registered under Roll Number <span className="font-bold">{activeStudent.rollNo}</span>,
                        successfully completed academic curriculums in class <span className="border-b border-slate-300 px-2">{activeStudent.className}</span>.
                      </p>
                      <p>
                        All school dues have been cleared. His/Her conduct and character log in our registers is certified as
                        <strong className="border-b border-slate-300 px-2">Outstanding</strong>. He/She is hereby permitted to seek admission elsewhere.
                      </p>
                    </div>

                    <div className="flex justify-between items-end pt-10 font-sans font-bold text-[10px]">
                      <div className="text-center w-36 border-t border-slate-300 pt-1 text-slate-400">Office Clerk</div>
                      <div className="text-center w-36 border-t border-slate-300 pt-1 text-slate-650 font-black">Principal Signature</div>
                    </div>
                  </>
                )}
              </div>

              {/* Remarks Form for issuing TC */}
              {previewDocType === 'tc' && activeStudent.tcStatus === 'Eligible' && (
                <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">Issuance Remarks / Notes</label>
                  <input
                    type="text"
                    placeholder="Enter TC comments (e.g. Conduct satisfactory)..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  onClick={() => { setIsPreviewOpen(false); setStudentDetail(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all font-bold text-xs"
                >
                  Close
                </button>
                {previewDocType === 'tc' && activeStudent.tcStatus === 'Eligible' && (
                  <button
                    onClick={handleIssueTC}
                    disabled={issuing}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-60"
                  >
                    {issuing ? 'Issuing...' : 'Issue TC Document'}
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
