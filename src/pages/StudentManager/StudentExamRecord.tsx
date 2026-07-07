import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, RefreshCw, Plus, Check, X, Trash2,
  CheckSquare, Square, Download, Edit2, Upload,
  BookOpen, TrendingUp, Award, AlertCircle,
  ChevronRight, ArrowLeft, Users, BarChart2,
  CheckCircle, Clock, RotateCcw, ClipboardList,
  FileText, Target,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import Select from "react-select";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Exam {
  id: number; academic_year_id: number; academic_year: string;
  class_id: number; class_name: string; name: string;
  exam_type: number; exam_type_label: string;
  term: number; term_label: string;
  start_date: string; end_date: string;
  max_marks: number; passing_marks: number;
  is_active: boolean; deleted_at?: string | null;
}
interface MarkRow {
  id: number; exam_id: number; exam_name: string;
  student_id: number; student_name: string; admission_no: string; class_name: string;
  subject_id: number; subject_name: string; subject_code: string;
  marks_obtained: number; total_marks: number; percentage: number; grade: string; remarks?: string | null;
}
interface Stats {
  total_exams: number; active_exams: number; upcoming_exams: number;
  total_marks: number; passed_marks: number; failed_marks: number;
  avg_percentage: number; pass_rate: number;
}
interface MasterData {
  classes: Option[]; examTypes: Option[]; academicYears: Option[];
  terms: Option[]; grades: string[];
}
interface Option { value: number | string; label: string; [k: string]: any; }
interface ResultSheet {
  exam: Exam; students: any[]; subjects: any[];
  marks: Record<number, Record<number, { id: number; marks_obtained: number; grade: string; percentage: number; remarks: string | null }>>;
}

// ─── Style helpers ────────────────────────────────────────────────────────────
const GRADE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  "A+": { color: "text-emerald-800", bg: "bg-emerald-100", border: "border-emerald-300" },
  "A":  { color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200" },
  "B+": { color: "text-teal-700",    bg: "bg-teal-50",     border: "border-teal-200" },
  "B":  { color: "text-blue-700",    bg: "bg-blue-50",     border: "border-blue-200" },
  "C+": { color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200" },
  "C":  { color: "text-amber-600",   bg: "bg-amber-50",    border: "border-amber-200" },
  "D":  { color: "text-orange-700",  bg: "bg-orange-50",   border: "border-orange-200" },
  "F":  { color: "text-rose-700",    bg: "bg-rose-50",     border: "border-rose-200" },
  "—":  { color: "text-slate-400",   bg: "bg-slate-50",    border: "border-slate-200" },
};

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const today = () => new Date().toISOString().split("T")[0];

const selSm = {
  control: (b: any) => ({ ...b, minHeight: 28, fontSize: 11, borderColor: "#e5e7eb", boxShadow: "none", "&:hover": { borderColor: "#4f46e5" } }),
  menu: (b: any) => ({ ...b, fontSize: 11, zIndex: 50 }),
  option: (b: any, s: any) => ({ ...b, fontSize: 11, padding: "4px 10px", background: s.isSelected ? "#4f46e5" : s.isFocused ? "#eef2ff" : "white", color: s.isSelected ? "white" : "#1e293b" }),
  singleValue: (b: any) => ({ ...b, color: "#334155", fontSize: 11 }),
  dropdownIndicator: (b: any) => ({ ...b, padding: "0 4px" }),
  valueContainer: (b: any) => ({ ...b, padding: "0 8px" }),
  indicatorSeparator: () => ({ display: "none" }),
  menuPortal: (b: any) => ({ ...b, zIndex: 9999 }),
};

function GradeBadge({ grade }: { grade: string }) {
  const cfg = GRADE_COLORS[grade] ?? GRADE_COLORS["—"];
  return (
    <span className={`inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {grade}
    </span>
  );
}

function StatCard({ label, value, icon, subtext, color, border }: {
  label: string; value: string | number; icon: React.ReactNode; subtext: string; color: string; border: string;
}) {
  return (
    <div className={`bg-white rounded-lg p-2 border-l-2 ${border} border-y border-r border-slate-100 shadow-sm flex items-center justify-between flex-1 min-w-0`}>
      <div className="space-y-0.5 min-w-0 pr-1">
        <p className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-sm font-black text-slate-800 leading-none truncate">{value}</p>
        <p className="text-[7.5px] text-slate-500 font-semibold truncate">{subtext}</p>
      </div>
      <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
    </div>
  );
}

// ─── Exam Modal ───────────────────────────────────────────────────────────────
function ExamModal({ open, onClose, onSaved, record, masters }: {
  open: boolean; onClose: () => void; onSaved: () => void; record: Exam | null; masters: MasterData;
}) {
  const [form, setForm] = useState({
    academic_year_id: "" as any, class_id: "" as any, name: "",
    exam_type: "" as any, term: "" as any,
    start_date: today(), end_date: today(),
    max_marks: "100", passing_marks: "33", is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (record) {
      setForm({
        academic_year_id: record.academic_year_id, class_id: record.class_id,
        name: record.name, exam_type: record.exam_type, term: record.term,
        start_date: record.start_date, end_date: record.end_date,
        max_marks: String(record.max_marks), passing_marks: String(record.passing_marks),
        is_active: record.is_active,
      });
    } else {
      setForm({ academic_year_id: "", class_id: "", name: "", exam_type: "", term: "", start_date: today(), end_date: today(), max_marks: "100", passing_marks: "33", is_active: true });
    }
  }, [open, record]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.academic_year_id || !form.class_id || !form.name || !form.exam_type || !form.term) {
      toast.error("Fill all required fields"); return;
    }
    setSaving(true);
    try {
      const payload = {
        academic_year_id: Number(form.academic_year_id),
        class_id: Number(form.class_id), name: form.name,
        exam_type: Number(form.exam_type), term: Number(form.term),
        start_date: form.start_date, end_date: form.end_date,
        max_marks: Number(form.max_marks), passing_marks: Number(form.passing_marks),
        is_active: form.is_active,
      };
      if (record) {
        await api.put(`/student-exams/exams/${record.id}`, payload);
        toast.success("Exam updated");
      } else {
        await api.post("/student-exams/exams", payload);
        toast.success("Exam created!");
      }
      onSaved(); onClose();
    } catch (err: any) { toast.error(err.response?.data?.message ?? "Save failed"); }
    finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center"><ClipboardList size={14} className="text-white"/></div>
            <div>
              <h2 className="text-[13px] font-extrabold text-white">{record ? "Edit Examination" : "New Examination"}</h2>
              <p className="text-[10px] text-indigo-200">Schedule a class exam</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"><X size={13} className="text-white"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Academic Year <span className="text-rose-500">*</span></label>
              <Select options={masters.academicYears as any} value={masters.academicYears.find(o => o.value === form.academic_year_id) ?? null}
                onChange={o => set("academic_year_id", o?.value ?? "")} styles={selSm} menuPortalTarget={document.body}/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Class <span className="text-rose-500">*</span></label>
              <Select options={masters.classes as any} value={masters.classes.find(o => o.value === form.class_id) ?? null}
                onChange={o => set("class_id", o?.value ?? "")} styles={selSm} menuPortalTarget={document.body}/>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Exam Name <span className="text-rose-500">*</span></label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Mid-Term Examination 2024"
              className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-400"/>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Exam Type <span className="text-rose-500">*</span></label>
              <Select options={masters.examTypes as any} value={masters.examTypes.find(o => o.value === form.exam_type) ?? null}
                onChange={o => set("exam_type", o?.value ?? "")} styles={selSm} menuPortalTarget={document.body}/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Term <span className="text-rose-500">*</span></label>
              <Select options={masters.terms as any} value={masters.terms.find(o => o.value === form.term) ?? null}
                onChange={o => set("term", o?.value ?? "")} styles={selSm} menuPortalTarget={document.body}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Start Date <span className="text-rose-500">*</span></label>
              <input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)}
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-400"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">End Date <span className="text-rose-500">*</span></label>
              <input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)}
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-400"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Max Marks <span className="text-rose-500">*</span></label>
              <input type="number" min={1} value={form.max_marks} onChange={e => set("max_marks", e.target.value)}
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-400"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Passing Marks <span className="text-rose-500">*</span></label>
              <input type="number" min={0} value={form.passing_marks} onChange={e => set("passing_marks", e.target.value)}
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-400"/>
            </div>
          </div>
          <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} className="accent-indigo-600"/>
            Active Examination
          </label>
          <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <RefreshCw size={11} className="animate-spin"/> : <Check size={11}/>}
              {record ? "Update" : "Create Exam"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Mark Entry Modal (single mark) ──────────────────────────────────────────
function MarkModal({ open, onClose, onSaved, record, exams, masters }: {
  open: boolean; onClose: () => void; onSaved: () => void; record: MarkRow | null;
  exams: Exam[]; masters: MasterData;
}) {
  const [form, setForm] = useState({ exam_id: "" as any, student_id: null as number | null, subject_id: "" as any, marks_obtained: "", remarks: "" });
  const [saving, setSaving] = useState(false);
  const [studentOpts, setStudentOpts] = useState<Option[]>([]);
  const [subjectOpts, setSubjectOpts] = useState<Option[]>([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  useEffect(() => {
    if (!open) return;
    if (record) {
      setForm({ exam_id: record.exam_id, student_id: record.student_id, subject_id: record.subject_id, marks_obtained: String(record.marks_obtained), remarks: record.remarks ?? "" });
      setStudentOpts([{ value: record.student_id, label: `${record.student_name} (${record.admission_no})` }]);
    } else {
      setForm({ exam_id: "", student_id: null, subject_id: "", marks_obtained: "", remarks: "" });
      setStudentOpts([]); setSubjectOpts([]); setSelectedExam(null);
    }
  }, [open, record]);

  const handleExamChange = async (opt: any) => {
    const exam = exams.find(e => e.id === opt?.value) ?? null;
    setSelectedExam(exam);
    setForm(f => ({ ...f, exam_id: opt?.value ?? "", subject_id: "", student_id: null }));
    setStudentOpts([]); setSubjectOpts([]);
    if (exam?.class_id) {
      const r = await api.get(`/student-exams/subjects/by-class/${exam.class_id}`);
      setSubjectOpts(r.data.data ?? []);
    }
  };

  const searchStudents = async (q: string) => {
    if (!q) return;
    setSearchingStudents(true);
    try {
      const params: any = { search: q };
      if (selectedExam?.class_id) params.class_id = selectedExam.class_id;
      const r = await api.get("/student-exams/students/search", { params });
      setStudentOpts(r.data.data ?? []);
    } catch {}
    setSearchingStudents(false);
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.exam_id || !form.student_id || !form.subject_id || form.marks_obtained === "") {
      toast.error("Fill all required fields"); return;
    }
    setSaving(true);
    try {
      const payload = {
        exam_id: Number(form.exam_id), student_id: form.student_id,
        subject_id: Number(form.subject_id), marks_obtained: Number(form.marks_obtained),
        remarks: form.remarks || null,
      };
      if (record) {
        await api.put(`/student-exams/marks/${record.id}`, { marks_obtained: payload.marks_obtained, remarks: payload.remarks });
        toast.success("Marks updated");
      } else {
        await api.post("/student-exams/marks", payload);
        toast.success("Marks entered!");
      }
      onSaved(); onClose();
    } catch (err: any) { toast.error(err.response?.data?.message ?? "Save failed"); }
    finally { setSaving(false); }
  };

  if (!open) return null;
  const examOpts = exams.filter(e => e.is_active).map(e => ({ value: e.id, label: `${e.name} — ${e.class_name}` }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center"><Award size={14} className="text-white"/></div>
            <div>
              <h2 className="text-[13px] font-extrabold text-white">{record ? "Edit Marks" : "Enter Marks"}</h2>
              <p className="text-[10px] text-teal-200">Record student subject marks</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"><X size={13} className="text-white"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-2.5">
          {!record && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Examination <span className="text-rose-500">*</span></label>
                <Select options={examOpts as any} value={examOpts.find(o => o.value === form.exam_id) ?? null}
                  onChange={handleExamChange} placeholder="Select exam…" styles={selSm} menuPortalTarget={document.body}/>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Student <span className="text-rose-500">*</span></label>
                <Select options={studentOpts as any} value={studentOpts.find(o => o.value === form.student_id) ?? null}
                  onInputChange={searchStudents} onChange={o => set("student_id", o?.value ?? null)}
                  isLoading={searchingStudents} placeholder="Search student…" styles={selSm} menuPortalTarget={document.body}/>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Subject <span className="text-rose-500">*</span></label>
                <Select options={subjectOpts as any} value={subjectOpts.find(o => o.value === form.subject_id) ?? null}
                  onChange={o => set("subject_id", o?.value ?? "")} placeholder="Select subject…" styles={selSm} menuPortalTarget={document.body}/>
              </div>
            </>
          )}
          {record && (
            <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-100 text-[11px]">
              <p className="font-bold text-indigo-700">{record.student_name} — {record.subject_name}</p>
              <p className="text-slate-500">{record.exam_name} · Total: {record.total_marks}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Marks Obtained <span className="text-rose-500">*</span></label>
              <input type="number" min={0} step="0.01" value={form.marks_obtained} onChange={e => set("marks_obtained", e.target.value)}
                placeholder={selectedExam ? `Max: ${selectedExam.max_marks}` : "0"}
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-teal-400"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Remarks</label>
              <input value={form.remarks} onChange={e => set("remarks", e.target.value)} placeholder="Optional note…"
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-teal-400"/>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <RefreshCw size={11} className="animate-spin"/> : <Check size={11}/>}
              {record ? "Update Marks" : "Save Marks"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Result Sheet (matrix grid) ───────────────────────────────────────────────
function ResultSheet({ examId, exam, onBack, onSaved }: {
  examId: number; exam: Exam; onBack: () => void; onSaved: () => void;
}) {
  const [sheet, setSheet] = useState<ResultSheet | null>(null);
  const [loading, setLoading] = useState(true);
  // Inline editing: [studentId][subjectId] => value string
  const [editValues, setEditValues] = useState<Record<number, Record<number, string>>>({});
  const [saving, setSaving] = useState(false);

  const fetchSheet = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/student-exams/exams/${examId}/result-sheet`);
      if (r.data.success) {
        setSheet(r.data.data);
        // Pre-fill editValues with existing marks
        const vals: Record<number, Record<number, string>> = {};
        const m = r.data.data.marks;
        for (const sId of Object.keys(m)) {
          vals[Number(sId)] = {};
          for (const subId of Object.keys(m[sId])) {
            vals[Number(sId)][Number(subId)] = String(m[sId][subId].marks_obtained ?? "");
          }
        }
        setEditValues(vals);
      }
    } catch { toast.error("Failed to load result sheet"); }
    setLoading(false);
  }, [examId]);

  useEffect(() => { fetchSheet(); }, [fetchSheet]);

  const setVal = (studentId: number, subjectId: number, v: string) => {
    setEditValues(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] ?? {}), [subjectId]: v }
    }));
  };

  const handleBulkSave = async () => {
    if (!sheet) return;
    setSaving(true);
    const marks: any[] = [];
    for (const student of sheet.students) {
      for (const subject of sheet.subjects) {
        const val = editValues[student.id]?.[subject.id];
        if (val !== undefined && val !== "") {
          marks.push({
            student_id: student.id,
            subject_id: subject.id,
            marks_obtained: Number(val),
          });
        }
      }
    }
    if (!marks.length) { toast.error("No marks entered"); setSaving(false); return; }
    try {
      const r = await api.post("/student-exams/marks/bulk-save", { exam_id: examId, marks });
      toast.success(r.data.message ?? "Marks saved!");
      fetchSheet();
      onSaved();
    } catch (err: any) { toast.error(err.response?.data?.message ?? "Save failed"); }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center"><RefreshCw size={20} className="animate-spin mx-auto mb-2 text-indigo-400"/><p className="text-[11px] text-slate-400">Loading result sheet…</p></div>
    </div>
  );

  if (!sheet) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sub header */}
      <div className="flex-shrink-0 px-4 py-2 flex items-center justify-between bg-white border-b border-slate-100">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft size={14}/></button>
          <div>
            <p className="text-[12px] font-extrabold text-slate-800">{exam.name}</p>
            <p className="text-[10px] text-slate-400">{exam.class_name} · {exam.term_label} · Max Marks: {exam.max_marks}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">{sheet.students.length} students · {sheet.subjects.length} subjects</span>
          <button onClick={handleBulkSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold shadow-sm disabled:opacity-50">
            {saving ? <RefreshCw size={11} className="animate-spin"/> : <Check size={11}/>}
            Save All Marks
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden min-w-max">
          <table className="border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-50 to-violet-50">
                <th className="sticky left-0 z-10 bg-indigo-50 px-3 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-r border-slate-200 min-w-[180px]">
                  Student
                </th>
                <th className="sticky left-[180px] z-10 bg-indigo-50 px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-r border-slate-200 min-w-[90px]">
                  Roll No.
                </th>
                {sheet.subjects.map(sub => (
                  <th key={sub.id} className="px-2 py-2 text-center text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider border-b border-r border-slate-100 min-w-[90px] max-w-[110px]">
                    <div className="truncate">{sub.name}</div>
                    <div className="text-[8px] text-slate-400 font-normal">/{exam.max_marks}</div>
                  </th>
                ))}
                <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200 min-w-[80px]">Total</th>
                <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200 min-w-[60px]">%</th>
                <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200 min-w-[50px]">Grade</th>
              </tr>
            </thead>
            <tbody>
              {sheet.students.map((student, si) => {
                const totalMax = sheet.subjects.length * exam.max_marks;
                let totalObtained = 0; let hasAllMarks = true;
                sheet.subjects.forEach(sub => {
                  const val = editValues[student.id]?.[sub.id];
                  if (val !== undefined && val !== "") totalObtained += Number(val);
                  else hasAllMarks = false;
                });
                const pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
                const grade = !hasAllMarks ? "—" : pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C+" : pct >= 40 ? "C" : pct >= 33 ? "D" : "F";

                return (
                  <tr key={student.id} className={`border-b border-slate-50 ${si % 2 === 0 ? "bg-white" : "bg-slate-50/30"} hover:bg-indigo-50/20 transition-colors`}>
                    <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 border-r border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-[7px] font-black text-white">{(student.name || "?").charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">{student.name}</p>
                          <p className="text-[9px] text-slate-400">{student.admission_no}</p>
                        </div>
                      </div>
                    </td>
                    <td className="sticky left-[180px] z-10 bg-inherit px-2 py-1.5 text-[10px] text-slate-500 border-r border-slate-100">
                      {student.roll_no || "—"}
                    </td>
                    {sheet.subjects.map(sub => {
                      const existingMark = sheet.marks[student.id]?.[sub.id];
                      const val = editValues[student.id]?.[sub.id] ?? "";
                      const markNum = val !== "" ? Number(val) : null;
                      const isPassing = markNum !== null && markNum >= exam.passing_marks;
                      return (
                        <td key={sub.id} className="px-1 py-1 border-r border-slate-50 text-center">
                          <input
                            type="number" min={0} max={exam.max_marks} step="0.5"
                            value={val}
                            onChange={e => setVal(student.id, sub.id, e.target.value)}
                            className={`w-full text-center text-[11px] font-bold rounded border px-1 py-0.5 outline-none transition-colors ${
                              val === "" ? "border-slate-200 bg-white text-slate-400"
                              : isPassing ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-rose-200 bg-rose-50 text-rose-700"
                            } ${existingMark ? "ring-1 ring-inset ring-indigo-200" : ""}`}
                            placeholder="—"
                          />
                        </td>
                      );
                    })}
                    <td className="px-2 py-1.5 text-center">
                      <span className="text-[11px] font-black text-slate-700">{hasAllMarks ? totalObtained : "—"}</span>
                      {hasAllMarks && <span className="text-[9px] text-slate-400">/{totalMax}</span>}
                    </td>
                    <td className="px-2 py-1.5 text-center text-[11px] font-bold text-indigo-700">
                      {hasAllMarks ? pct.toFixed(1) + "%" : "—"}
                    </td>
                    <td className="px-2 py-1.5 text-center"><GradeBadge grade={grade}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10px] text-slate-400 italic">📝 Green = Passing, Red = Failing. Ring = Already saved. Click "Save All Marks" to persist.</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
type Tab = "exams" | "marks" | "trash_exams";

export default function StudentExamRecord() {
  const [tab, setTab] = useState<Tab>("exams");
  const [stats, setStats] = useState<Stats>({ total_exams: 0, active_exams: 0, upcoming_exams: 0, total_marks: 0, passed_marks: 0, failed_marks: 0, avg_percentage: 0, pass_rate: 0 });
  const [masters, setMasters] = useState<MasterData>({ classes: [], examTypes: [], academicYears: [], terms: [], grades: [] });
  const [loading, setLoading] = useState(false);

  // Exams tab
  const [exams, setExams] = useState<Exam[]>([]);
  const [filterClass, setFilterClass] = useState<Option | null>(null);
  const [filterTerm, setFilterTerm] = useState<Option | null>(null);
  const [examSearch, setExamSearch] = useState("");
  const [showExamModal, setShowExamModal] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [selExams, setSelExams] = useState<number[]>([]);
  // Result sheet
  const [viewingResultSheet, setViewingResultSheet] = useState<{ examId: number; exam: Exam } | null>(null);

  // Marks tab
  const [marks, setMarks] = useState<MarkRow[]>([]);
  const [filterExam, setFilterExam] = useState<Option | null>(null);
  const [filterGrade, setFilterGrade] = useState<Option | null>(null);
  const [markSearch, setMarkSearch] = useState("");
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [editMark, setEditMark] = useState<MarkRow | null>(null);
  const [selMarks, setSelMarks] = useState<number[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get("/student-exams/masters").then(r => { if (r.data.success) setMasters(r.data.data); });
    refreshStats();
  }, []);

  const refreshStats = () => {
    api.get("/student-exams/stats").then(r => { if (r.data.success) setStats(r.data.data); });
  };

  // Fetch Exams
  const fetchExams = useCallback(async (isTrashed = false) => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterClass)  params.class_id = filterClass.value;
      if (filterTerm)   params.term = filterTerm.value;
      if (examSearch)   params.search = examSearch;
      if (isTrashed)    params.only_trashed = true;
      const r = await api.get("/student-exams/exams", { params });
      if (r.data.success) { setExams(r.data.data); setSelExams([]); }
    } catch { toast.error("Failed to load exams"); }
    setLoading(false);
  }, [filterClass, filterTerm, examSearch]);

  useEffect(() => {
    if (tab === "exams") fetchExams(false);
    else if (tab === "trash_exams") fetchExams(true);
  }, [tab, fetchExams]);

  // Fetch Marks
  const fetchMarks = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterExam)  params.exam_id = filterExam.value;
      if (filterGrade) params.grade = filterGrade.value;
      if (markSearch)  params.search = markSearch;
      const r = await api.get("/student-exams/marks", { params });
      if (r.data.success) { setMarks(r.data.data); setSelMarks([]); }
    } catch { toast.error("Failed to load marks"); }
    setLoading(false);
  }, [filterExam, filterGrade, markSearch]);

  useEffect(() => { if (tab === "marks") fetchMarks(); }, [tab, fetchMarks]);

  // Actions — Exams
  const deleteExam = async (id: number) => {
    if (!confirm("Move this exam to trash?")) return;
    try { await api.delete(`/student-exams/exams/${id}`); toast.success("Moved to trash"); fetchExams(false); refreshStats(); }
    catch { toast.error("Action failed"); }
  };
  const restoreExam = async (id: number) => {
    try { await api.post(`/student-exams/exams/restore/${id}`); toast.success("Restored"); fetchExams(true); refreshStats(); }
    catch { toast.error("Restore failed"); }
  };
  const forceDeleteExam = async (id: number) => {
    if (!confirm("Permanently delete? This cannot be undone!")) return;
    try { await api.delete(`/student-exams/exams/${id}/force`); toast.success("Deleted"); fetchExams(true); refreshStats(); }
    catch { toast.error("Action failed"); }
  };
  const toggleExam = async (id: number) => {
    try { await api.patch(`/student-exams/exams/${id}/toggle`); fetchExams(tab === "trash_exams"); refreshStats(); }
    catch { toast.error("Toggle failed"); }
  };
  const exportExams = async () => {
    try {
      const r = await api.get("/student-exams/exams/export", { responseType: "blob" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([r.data])); a.download = `exams_${today()}.csv`; a.click();
      toast.success("Exported!");
    } catch { toast.error("Export failed"); }
  };
  const exportMarks = async () => {
    try {
      const params: any = {};
      if (filterExam) params.exam_id = filterExam.value;
      const r = await api.get("/student-exams/marks/export", { params, responseType: "blob" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([r.data])); a.download = `marks_${today()}.csv`; a.click();
      toast.success("Exported!");
    } catch { toast.error("Export failed"); }
  };

  // Actions — Marks
  const deleteMark = async (id: number) => {
    if (!confirm("Delete this mark record?")) return;
    try { await api.delete(`/student-exams/marks/${id}`); toast.success("Deleted"); fetchMarks(); refreshStats(); }
    catch { toast.error("Action failed"); }
  };
  const bulkDeleteExams = async (force = false) => {
    if (!selExams.length) return;
    const msg = force ? `Permanently delete ${selExams.length} exam(s)?` : `Move ${selExams.length} exam(s) to trash?`;
    if (!confirm(msg)) return;
    try { await api.post("/student-exams/exams/bulk-delete", { ids: selExams, force }); toast.success("Done"); fetchExams(tab === "trash_exams"); refreshStats(); }
    catch { toast.error("Bulk action failed"); }
  };
  const bulkRestoreExams = async () => {
    if (!selExams.length) return;
    try { await api.post("/student-exams/exams/bulk-restore", { ids: selExams }); toast.success("Restored"); fetchExams(true); refreshStats(); }
    catch { toast.error("Restore failed"); }
  };
  const bulkDeleteMarks = async () => {
    if (!selMarks.length) return;
    if (!confirm(`Delete ${selMarks.length} mark records?`)) return;
    try { await Promise.all(selMarks.map(id => api.delete(`/student-exams/marks/${id}`))); toast.success("Deleted"); fetchMarks(); refreshStats(); }
    catch { toast.error("Bulk delete failed"); }
  };

  // Import
  const triggerImport = () => fileInputRef.current?.click();
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    if (lines.length < 2) { toast.error("CSV has no data rows"); return; }
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1).map(line => {
      const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      return Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? ""]));
    });
    const tid = toast.loading("Importing…");
    try {
      const r = await api.post("/student-exams/exams/bulk-import", { data: rows });
      toast.dismiss(tid); toast.success(r.data.message);
      fetchExams(false); refreshStats();
    } catch (err: any) { toast.dismiss(tid); toast.error(err.response?.data?.message ?? "Import failed"); }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const downloadSample = () => {
    const csv = "name,academic_year,class_name,exam_type,term,start_date,end_date,max_marks,passing_marks,is_active\nMid Term Exam 2024,2024-2025,Class 5,Unit Test,First Term,2024-06-01,2024-06-10,100,33,yes\n";
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = "exams_sample.csv"; a.click();
    toast.success("Sample downloaded");
  };

  // Selections
  const toggleSelExam = (id: number) => setSelExams(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAllExams = () => setSelExams(selExams.length === exams.length ? [] : exams.map(e => e.id));
  const toggleSelMark = (id: number) => setSelMarks(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAllMarks = () => setSelMarks(selMarks.length === marks.length ? [] : marks.map(m => m.id));

  const inTrashMode = tab === "trash_exams";
  const gradeOpts = masters.grades.map(g => ({ value: g, label: g }));
  const examFilterOpts = exams.filter(e => e.is_active).map(e => ({ value: e.id, label: `${e.name} — ${e.class_name}` }));

  // If viewing a result sheet overlay
  if (viewingResultSheet) {
    return (
      <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <BarChart2 size={16} className="text-white"/>
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-800">Result Sheet Entry</h1>
            <p className="text-[10px] text-slate-400">Enter marks for all students and subjects</p>
          </div>
        </div>
        <ResultSheet
          examId={viewingResultSheet.examId}
          exam={viewingResultSheet.exam}
          onBack={() => setViewingResultSheet(null)}
          onSaved={refreshStats}
        />
      </div>
    );
  }

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <ExamModal open={showExamModal} onClose={() => { setShowExamModal(false); setEditExam(null); }}
        onSaved={() => { fetchExams(false); refreshStats(); }} record={editExam} masters={masters}/>
      <MarkModal open={showMarkModal} onClose={() => { setShowMarkModal(false); setEditMark(null); }}
        onSaved={() => { fetchMarks(); refreshStats(); }} record={editMark} exams={exams} masters={masters}/>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {inTrashMode && (
            <button onClick={() => setTab("exams")} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft size={14}/></button>
          )}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <ClipboardList size={16} className="text-white"/>
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-800">
              {inTrashMode ? "Trash Bin — Examinations" : "Student Exam Records"}
            </h1>
            <p className="text-[10px] text-slate-400">
              {inTrashMode ? "Restore or permanently delete exams" : "Manage examinations, marks entry & result analysis"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!inTrashMode && tab === "exams" && (
            <>
              <button onClick={downloadSample} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold">Sample</button>
              <button onClick={triggerImport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold"><Upload size={12}/> Import</button>
              <button onClick={exportExams} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-semibold"><Download size={12}/> Export</button>
              <button onClick={() => setTab("trash_exams")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold">
                <Trash2 size={12}/> Trash {stats.total_exams > stats.active_exams && (
                  <span className="bg-rose-500 text-white text-[9px] rounded-full px-1.5 py-0.5 font-bold ml-1">{stats.total_exams - stats.active_exams}</span>
                )}
              </button>
              <button onClick={() => { setEditExam(null); setShowExamModal(true); }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-sm">
                <Plus size={12}/> Add Exam
              </button>
            </>
          )}
          {!inTrashMode && tab === "marks" && (
            <>
              <button onClick={exportMarks} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 text-[11px] font-semibold"><Download size={12}/> Export</button>
              <button onClick={() => { setEditMark(null); setShowMarkModal(true); }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold shadow-sm">
                <Plus size={12}/> Enter Marks
              </button>
            </>
          )}
          {inTrashMode && selExams.length > 0 && (
            <>
              <button onClick={bulkRestoreExams} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100">
                <RotateCcw size={11}/> Restore ({selExams.length})
              </button>
              <button onClick={() => bulkDeleteExams(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-semibold hover:bg-rose-100">
                <Trash2 size={11}/> Delete ({selExams.length})
              </button>
            </>
          )}
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport}/>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      {!inTrashMode && (
        <div className="flex-shrink-0 px-4 py-2 grid grid-cols-4 lg:grid-cols-8 gap-2">
          <StatCard label="Total Exams"    value={stats.total_exams}    icon={<ClipboardList size={12} className="text-indigo-600"/>} subtext={`${stats.active_exams} active`} color="bg-indigo-50" border="border-indigo-500"/>
          <StatCard label="Upcoming"       value={stats.upcoming_exams}  icon={<Clock size={12} className="text-amber-600"/>}         subtext="Scheduled" color="bg-amber-50" border="border-amber-400"/>
          <StatCard label="Total Records"  value={stats.total_marks}     icon={<FileText size={12} className="text-blue-600"/>}       subtext="Mark entries" color="bg-blue-50" border="border-blue-400"/>
          <StatCard label="Passed"         value={stats.passed_marks}    icon={<CheckCircle size={12} className="text-emerald-600"/>} subtext="Cleared" color="bg-emerald-50" border="border-emerald-400"/>
          <StatCard label="Failed"         value={stats.failed_marks}    icon={<AlertCircle size={12} className="text-rose-600"/>}    subtext="Below cutoff" color="bg-rose-50" border="border-rose-400"/>
          <StatCard label="Pass Rate"      value={stats.pass_rate + "%"} icon={<TrendingUp size={12} className="text-teal-600"/>}     subtext="Overall" color="bg-teal-50" border="border-teal-400"/>
          <StatCard label="Avg Percentage" value={stats.avg_percentage + "%"} icon={<BarChart2 size={12} className="text-violet-600"/>} subtext="All students" color="bg-violet-50" border="border-violet-400"/>
          <StatCard label="Subjects Covered" value={stats.total_marks > 0 ? "Active" : "None"} icon={<BookOpen size={12} className="text-slate-500"/>} subtext="Marks entered" color="bg-slate-100" border="border-slate-300"/>
        </div>
      )}

      {/* ── Tab Bar ────────────────────────────────────────────────────────── */}
      {!inTrashMode && (
        <div className="flex-shrink-0 px-4 flex items-center gap-1 border-b border-slate-100 bg-white">
          {([["exams", "📋 Examinations"], ["marks", "🏅 Marks Records"]] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-[11px] font-bold border-b-2 transition-colors ${tab === t ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Exams Tab ──────────────────────────────────────────────────────── */}
      {(tab === "exams" || tab === "trash_exams") && (
        <>
          <div className="flex-shrink-0 px-4 py-2 flex items-center gap-2 flex-wrap bg-white border-b border-slate-50">
            <div className="relative flex-1 min-w-[140px]">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={examSearch} onChange={e => setExamSearch(e.target.value)} placeholder="Search exam name…"
                className="w-full pl-7 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg outline-none focus:border-indigo-400 bg-white"/>
            </div>
            <div className="w-36">
              <Select options={masters.classes as any} value={filterClass} onChange={o => setFilterClass(o as any)} placeholder="All Classes" isClearable styles={selSm}/>
            </div>
            <div className="w-32">
              <Select options={masters.terms as any} value={filterTerm} onChange={o => setFilterTerm(o as any)} placeholder="All Terms" isClearable styles={selSm}/>
            </div>
            {selExams.length > 0 && (
              inTrashMode ? (
                <div className="flex gap-1">
                  <button onClick={bulkRestoreExams} className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100"><RotateCcw size={11} className="inline mr-1"/>Restore ({selExams.length})</button>
                  <button onClick={() => bulkDeleteExams(true)} className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-semibold hover:bg-rose-100"><Trash2 size={11} className="inline mr-1"/>Delete ({selExams.length})</button>
                </div>
              ) : (
                <button onClick={() => bulkDeleteExams(false)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-50"><Trash2 size={11} className="inline mr-1"/>Trash ({selExams.length})</button>
              )
            )}
            <button onClick={() => fetchExams(inTrashMode)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500">
              <RefreshCw size={12} className={loading ? "animate-spin" : ""}/>
            </button>
          </div>
          <div className="flex-1 overflow-auto px-4 pb-2">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full min-w-[900px]">
                <thead className={inTrashMode ? "bg-rose-50/50 border-b border-rose-100" : "bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100"}>
                  <tr>
                    <th className="px-3 py-2">
                      <button onClick={toggleAllExams} className="text-slate-400 hover:text-indigo-600">
                        {selExams.length === exams.length && exams.length > 0 ? <CheckSquare size={13} className="text-indigo-600"/> : <Square size={13}/>}
                      </button>
                    </th>
                    {["Exam Name", "Class", "Type", "Term", "Dates", "Max Marks", "Pass Marks", inTrashMode ? "Deleted On" : "Status", "Actions"].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={10} className="text-center py-12">
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-indigo-400"/>
                      <p className="text-[11px] text-slate-400">Loading exams…</p>
                    </td></tr>
                  ) : exams.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-12">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3"><ClipboardList size={22} className="text-indigo-300"/></div>
                      <p className="text-[12px] font-bold text-slate-400">{inTrashMode ? "Trash is empty" : "No examinations found"}</p>
                    </td></tr>
                  ) : exams.map(e => (
                    <tr key={e.id} className={`border-b border-slate-50 hover:bg-indigo-50/10 transition-colors ${selExams.includes(e.id) ? "bg-indigo-50/30" : ""}`}>
                      <td className="px-3 py-2">
                        <button onClick={() => toggleSelExam(e.id)} className="text-slate-400 hover:text-indigo-600">
                          {selExams.includes(e.id) ? <CheckSquare size={13} className="text-indigo-600"/> : <Square size={13}/>}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-[11px] font-bold text-slate-700">{e.name}</p>
                        <p className="text-[9px] text-slate-400">{e.academic_year}</p>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">{e.class_name}</span>
                      </td>
                      <td className="px-3 py-2 text-[10px] text-slate-500">{e.exam_type_label}</td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">{e.term_label}</span>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-[10px] text-slate-500">{fmtDate(e.start_date)}</p>
                        <p className="text-[10px] text-slate-400">→ {fmtDate(e.end_date)}</p>
                      </td>
                      <td className="px-3 py-2 text-[11px] font-bold text-slate-700">{e.max_marks}</td>
                      <td className="px-3 py-2 text-[11px] font-bold text-amber-600">{e.passing_marks}</td>
                      <td className="px-3 py-2">
                        {inTrashMode ? (
                          <span className="text-[10px] text-slate-400">{fmtDate(e.deleted_at)}</span>
                        ) : (
                          <button onClick={() => toggleExam(e.id)} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${e.is_active ? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100" : "text-slate-400 bg-slate-100 border-slate-200 hover:bg-slate-200"}`}>
                            {e.is_active ? "Active" : "Inactive"}
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          {!inTrashMode ? (
                            <>
                              <button onClick={() => setViewingResultSheet({ examId: e.id, exam: e })} className="p-1 rounded hover:bg-teal-100 text-teal-600" title="Result Sheet">
                                <BarChart2 size={11}/>
                              </button>
                              <button onClick={() => { setEditExam(e); setShowExamModal(true); }} className="p-1 rounded hover:bg-slate-100 text-slate-500" title="Edit"><Edit2 size={11}/></button>
                              <button onClick={() => deleteExam(e.id)} className="p-1 rounded hover:bg-rose-100 text-rose-500" title="Trash"><Trash2 size={11}/></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => restoreExam(e.id)} className="p-1 rounded hover:bg-emerald-100 text-emerald-600" title="Restore"><RotateCcw size={11}/></button>
                              <button onClick={() => forceDeleteExam(e.id)} className="p-1 rounded hover:bg-rose-100 text-rose-500" title="Delete Forever"><Trash2 size={11}/></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[10px] text-slate-400">{exams.length} exam{exams.length !== 1 ? "s" : ""}{selExams.length > 0 && ` · ${selExams.length} selected`}</p>
          </div>
        </>
      )}

      {/* ── Marks Tab ──────────────────────────────────────────────────────── */}
      {tab === "marks" && (
        <>
          <div className="flex-shrink-0 px-4 py-2 flex items-center gap-2 flex-wrap bg-white border-b border-slate-50">
            <div className="relative flex-1 min-w-[140px]">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={markSearch} onChange={e => setMarkSearch(e.target.value)} placeholder="Search by student name or admission no…"
                className="w-full pl-7 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg outline-none focus:border-teal-400 bg-white"/>
            </div>
            <div className="w-52">
              <Select options={examFilterOpts as any} value={filterExam} onChange={o => setFilterExam(o as any)} placeholder="All Exams" isClearable styles={selSm}/>
            </div>
            <div className="w-24">
              <Select options={gradeOpts as any} value={filterGrade} onChange={o => setFilterGrade(o as any)} placeholder="Grade" isClearable styles={selSm}/>
            </div>
            {selMarks.length > 0 && (
              <button onClick={bulkDeleteMarks} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-50"><Trash2 size={11} className="inline mr-1"/>Delete ({selMarks.length})</button>
            )}
            <button onClick={fetchMarks} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500">
              <RefreshCw size={12} className={loading ? "animate-spin" : ""}/>
            </button>
          </div>
          <div className="flex-1 overflow-auto px-4 pb-2">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full min-w-[860px]">
                <thead className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100">
                  <tr>
                    <th className="px-3 py-2">
                      <button onClick={toggleAllMarks} className="text-slate-400 hover:text-teal-600">
                        {selMarks.length === marks.length && marks.length > 0 ? <CheckSquare size={13} className="text-teal-600"/> : <Square size={13}/>}
                      </button>
                    </th>
                    {["Student", "Class", "Exam", "Subject", "Marks Obtained", "Max Marks", "%", "Grade", "Remarks", "Actions"].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={11} className="text-center py-12">
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-teal-400"/>
                      <p className="text-[11px] text-slate-400">Loading marks…</p>
                    </td></tr>
                  ) : marks.length === 0 ? (
                    <tr><td colSpan={11} className="text-center py-12">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-3"><Award size={22} className="text-teal-300"/></div>
                      <p className="text-[12px] font-bold text-slate-400">No marks records found</p>
                    </td></tr>
                  ) : marks.map(m => (
                    <tr key={m.id} className={`border-b border-slate-50 hover:bg-teal-50/10 transition-colors ${selMarks.includes(m.id) ? "bg-teal-50/30" : ""}`}>
                      <td className="px-3 py-2">
                        <button onClick={() => toggleSelMark(m.id)} className="text-slate-400 hover:text-teal-600">
                          {selMarks.includes(m.id) ? <CheckSquare size={13} className="text-teal-600"/> : <Square size={13}/>}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-[8px] font-black text-white">{(m.student_name || "?").charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-slate-700">{m.student_name}</p>
                            <p className="text-[9px] text-slate-400">{m.admission_no}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[10px] text-slate-500">{m.class_name}</td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">{m.exam_name}</span>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-[11px] font-bold text-slate-700">{m.subject_name}</p>
                        {m.subject_code && <p className="text-[9px] text-slate-400">{m.subject_code}</p>}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-[12px] font-black ${m.marks_obtained >= (m.total_marks * 0.33) ? "text-emerald-700" : "text-rose-700"}`}>
                          {m.marks_obtained}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px] font-semibold text-slate-500">{m.total_marks}</td>
                      <td className="px-3 py-2 text-[11px] font-bold text-indigo-700">{m.percentage?.toFixed(1)}%</td>
                      <td className="px-3 py-2"><GradeBadge grade={m.grade}/></td>
                      <td className="px-3 py-2 text-[10px] text-slate-400 max-w-[120px] truncate">{m.remarks || "—"}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditMark(m); setShowMarkModal(true); }} className="p-1 rounded hover:bg-slate-100 text-slate-500" title="Edit"><Edit2 size={11}/></button>
                          <button onClick={() => deleteMark(m.id)} className="p-1 rounded hover:bg-rose-100 text-rose-500" title="Delete"><Trash2 size={11}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[10px] text-slate-400">{marks.length} record{marks.length !== 1 ? "s" : ""}{selMarks.length > 0 && ` · ${selMarks.length} selected`}</p>
          </div>
        </>
      )}
    </div>
  );
}
