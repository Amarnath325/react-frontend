import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, ChevronLeft, ChevronRight, RefreshCw, Plus, Check, X,
  Trash2, CheckSquare, Square, Download, RotateCcw, ArrowLeft,
  MessageSquare, Star, Edit2, Clock, CheckCircle, XCircle,
  AlertTriangle, Calendar, Users, Send, Eye, EyeOff, Filter,
  ThumbsUp, AlertCircle, BookOpen, Zap,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import Select from "react-select";

// ─── Types ───────────────────────────────────────────────────────────────────
interface FeedbackRecord {
  id: number; student_id: number; student_name: string;
  admission_number: string; class_name: string; section: string; photo_url: string | null;
  feedback_no: string; category: number; category_name?: string;
  subject: string; description: string; rating: number;
  is_anonymous: boolean; priority: number; priority_name?: string;
  status: number; status_name?: string;
  admin_response: string | null; responded_by: number | null; responded_at: string | null;
  is_public: boolean; created_at: string; deleted_at?: string | null;
}
interface Stats {
  total: number; this_month: number; pending: number; under_review: number;
  resolved: number; high_priority: number; avg_rating: number; responded: number;
}
interface MasterOption { value: number; label: string; }
interface ClassOption  { value: number; label: string; }
interface StudentOpt   { value: number; label: string; sub: string; }

// ─── Configs ─────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  "Pending":      { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   icon: <Clock size={10}/> },
  "Under Review": { color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    icon: <Eye size={10}/> },
  "Resolved":     { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: <CheckCircle size={10}/> },
  "Closed":       { color: "text-slate-600",   bg: "bg-slate-100",  border: "border-slate-300",   icon: <XCircle size={10}/> },
};
const PRIORITY_CFG: Record<string, { color: string; bg: string; border: string }> = {
  "Low":      { color: "text-slate-600",  bg: "bg-slate-100", border: "border-slate-300" },
  "Medium":   { color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200" },
  "High":     { color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  "Critical": { color: "text-rose-700",   bg: "bg-rose-50",   border: "border-rose-200" },
};
const CATEGORY_ICON: Record<string, React.ReactNode> = {
  "Teacher":      <Users size={10}/>,
  "Facility":     <Zap size={10}/>,
  "Curriculum":   <BookOpen size={10}/>,
  "Exam & Results": <AlertCircle size={10}/>,
  "Library":      <BookOpen size={10}/>,
  "Canteen":      <ThumbsUp size={10}/>,
  "Sports":       <Star size={10}/>,
  "Transport":    <Zap size={10}/>,
  "General":      <MessageSquare size={10}/>,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (d: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const selSm = {
  control:   (b: any) => ({ ...b, minHeight: 28, fontSize: 11, borderColor: "#e5e7eb", boxShadow: "none", "&:hover": { borderColor: "#7c3aed" } }),
  menu:      (b: any) => ({ ...b, fontSize: 11, zIndex: 50 }),
  option:    (b: any, s: any) => ({ ...b, fontSize: 11, padding: "4px 10px", background: s.isSelected ? "#7c3aed" : s.isFocused ? "#ede9fe" : "white", color: s.isSelected ? "white" : "#1e293b" }),
  singleValue:(b: any) => ({ ...b, color: "#334155", fontSize: 11 }),
  dropdownIndicator: (b: any) => ({ ...b, padding: "0 4px" }),
  valueContainer: (b: any) => ({ ...b, padding: "0 8px" }),
  indicatorSeparator: () => ({ display: "none" }),
  menuPortal: (b: any) => ({ ...b, zIndex: 9999 }),
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG["Pending"];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.icon} {status}
    </span>
  );
}
function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CFG[priority] ?? PRIORITY_CFG["Low"];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {priority}
    </span>
  );
}
function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange?.(i)}
          className={`transition-colors ${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"}`}>
          <Star size={13} className={i <= value ? "text-amber-400 fill-amber-400" : "text-slate-300 fill-slate-100"}/>
        </button>
      ))}
      {value > 0 && <span className="text-[10px] font-bold text-slate-500 ml-1">{value}.0</span>}
    </div>
  );
}
function StatCard({ label, value, icon, subtext, color, border }: {
  label: string; value: number | string; icon: React.ReactNode; subtext: string; color: string; border: string;
}) {
  return (
    <div className={`bg-white rounded-lg p-1.5 border-l-2 ${border} border-y border-r border-slate-100 shadow-sm flex items-center justify-between flex-1 min-w-0`}>
      <div className="space-y-0.5 min-w-0 pr-1">
        <p className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider truncate" title={label}>{label}</p>
        <p className="text-sm font-black text-slate-800 leading-none">{value}</p>
        <p className="text-[7.5px] text-slate-500 font-semibold truncate">{subtext}</p>
      </div>
      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
    </div>
  );
}
// ─── Add/Edit Modal ───────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean; onClose: () => void; onSaved: () => void; record: FeedbackRecord | null;
  masters: { categories: MasterOption[]; statuses: MasterOption[]; priorities: MasterOption[] };
  classes: ClassOption[];
}
const INIT_FORM = {
  student_id: null as number | null, class_id: null as number | null,
  category: "" as any, subject: "", description: "",
  rating: 0, is_anonymous: false,
  priority: "" as any, status: "" as any, is_public: false,
};

function FeedbackModal({ open, onClose, onSaved, record, masters, classes }: ModalProps) {
  const [form, setForm]               = useState({ ...INIT_FORM });
  const [students, setStudents]       = useState<StudentOpt[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [respondMode, setRespondMode] = useState(false);
  const [response, setResponse]       = useState("");
  const [respondStatus, setRespondStatus] = useState<any>("");
  const [respondSaving, setRespondSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRespondMode(false); setResponse(""); setRespondStatus("");
    if (record) {
      setForm({
        student_id: record.student_id, class_id: null,
        category: record.category, subject: record.subject,
        description: record.description, rating: record.rating,
        is_anonymous: record.is_anonymous, priority: record.priority,
        status: record.status, is_public: record.is_public,
      });
      setResponse(record.admin_response ?? "");
    } else {
      setForm({
        ...INIT_FORM,
        status:   masters.statuses.find(s => s.label === "Pending")?.value ?? "",
        priority: masters.priorities.find(p => p.label === "Medium")?.value ?? "",
      });
      loadStudents(null);
    }
  }, [open, record, masters]);

  const loadStudents = async (classId?: number | null) => {
    setLoadingStudents(true);
    try {
      const params: any = { per_page: 999 };
      if (classId) params.class_id = classId;
      const res = await api.get("/students", { params });
      if (res.data?.success) {
        setStudents((res.data.data ?? []).map((s: any) => ({
          value: s.id, label: s.full_name ?? `Student #${s.id}`,
          sub: `${s.admission_number}${s.roll_number ? " · Roll: " + s.roll_number : ""}`,
        })));
      }
    } catch { setStudents([]); }
    setLoadingStudents(false);
  };

  const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!record && !form.student_id) { toast.error("Please select a student"); return; }
    if (!form.category)              { toast.error("Category is required"); return; }
    if (!form.subject.trim())        { toast.error("Subject is required"); return; }
    if (!form.description.trim())    { toast.error("Description is required"); return; }
    if (!form.priority)              { toast.error("Priority is required"); return; }
    if (!form.status)                { toast.error("Status is required"); return; }
    setSaving(true);
    try {
      const payload = {
        student_id: form.student_id, category: form.category,
        subject: form.subject, description: form.description,
        rating: form.rating || 0, is_anonymous: form.is_anonymous,
        priority: form.priority, status: form.status, is_public: form.is_public,
      };
      if (record) {
        await api.put(`/student-feedbacks/${record.id}`, payload);
        toast.success("Feedback updated");
      } else {
        await api.post("/student-feedbacks/", payload);
        toast.success("Feedback submitted");
      }
      onSaved(); onClose();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? "Error saving"); }
    setSaving(false);
  };

  const submitResponse = async () => {
    if (!response.trim())    { toast.error("Response is required"); return; }
    if (!respondStatus)      { toast.error("Please set a status"); return; }
    setRespondSaving(true);
    try {
      await api.post(`/student-feedbacks/respond/${record!.id}`, { admin_response: response, status: respondStatus });
      toast.success("Response submitted");
      onSaved(); onClose();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? "Error"); }
    setRespondSaving(false);
  };

  if (!open) return null;
  const catOpts  = masters.categories.map(o => ({ value: o.value, label: o.label }));
  const statOpts = masters.statuses.map(o => ({ value: o.value, label: o.label }));
  const prioOpts = masters.priorities.map(o => ({ value: o.value, label: o.label }));
  const clsOpts  = classes.map(c => ({ value: c.value, label: c.label }));
  const stuOpts  = students.map(s => ({ value: s.value, label: `${s.label} (${s.sub})` }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] transform lg:translate-x-16">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-purple-600 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <MessageSquare size={16} className="text-white"/>
            <div>
              <p className="text-white text-sm font-bold">
                {record ? (respondMode ? "Respond to Feedback" : "Edit Feedback") : "Submit New Feedback"}
              </p>
              <p className="text-violet-100 text-[10px]">Student Feedback Portal — manage & track student voices</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {record && !respondMode && (
              <button onClick={() => setRespondMode(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold">
                <Send size={10}/> Respond
              </button>
            )}
            <button onClick={onClose} className="text-white/80 hover:text-white"><X size={16}/></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5 text-xs">
          {respondMode ? (
            /* ── Respond Panel ── */
            <div className="space-y-4">
              <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                <p className="text-[10px] font-bold text-violet-700 uppercase tracking-wide mb-1">Original Feedback</p>
                <p className="text-[11px] font-bold text-slate-800">{record?.subject}</p>
                <p className="text-[10px] text-slate-600 mt-1 line-clamp-3">{record?.description}</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Admin Response *</label>
                <textarea value={response} onChange={e => setResponse(e.target.value)} rows={5}
                  placeholder="Write your official response to this feedback…"
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"/>
              </div>
              <div className="w-48">
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Update Status *</label>
                <Select options={statOpts} placeholder="Set status…" styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body}
                  value={statOpts.find(o => o.value === respondStatus) ?? null}
                  onChange={o => setRespondStatus(o?.value ?? "")}/>
              </div>
            </div>
          ) : (
            /* ── Form ── */
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-3.5">
                {!record ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Class</label>
                      <Select options={clsOpts} placeholder="Class…" styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body}
                        onChange={o => { setField("class_id", o?.value ?? null); loadStudents(o?.value ?? null); setField("student_id", null); }} isClearable/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Student *</label>
                      <Select options={stuOpts} isLoading={loadingStudents} placeholder="Student…" styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body}
                        onChange={o => setField("student_id", o?.value ?? null)} value={stuOpts.find(o => o.value === form.student_id) ?? null}/>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Student</label>
                    <input type="text" readOnly value={record.is_anonymous ? "Anonymous" : record.student_name}
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 focus:outline-none"/>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Category *</label>
                  <Select options={catOpts} placeholder="Select category…" styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body}
                    value={catOpts.find(o => o.value === form.category) ?? null} onChange={o => setField("category", o?.value ?? "")}/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Subject *</label>
                  <input value={form.subject} onChange={e => setField("subject", e.target.value)} placeholder="Brief title of your feedback"
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Description *</label>
                  <textarea value={form.description} onChange={e => setField("description", e.target.value)} rows={4}
                    placeholder="Describe your feedback in detail…"
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"/>
                </div>
              </div>
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Rating</label>
                  <StarRating value={form.rating} onChange={v => setField("rating", v)}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Priority *</label>
                    <Select options={prioOpts} placeholder="Priority…" styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body}
                      value={prioOpts.find(o => o.value === form.priority) ?? null} onChange={o => setField("priority", o?.value ?? "")}/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Status *</label>
                    <Select options={statOpts} placeholder="Status…" styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body}
                      value={statOpts.find(o => o.value === form.status) ?? null} onChange={o => setField("status", o?.value ?? "")}/>
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_anonymous} onChange={e => setField("is_anonymous", e.target.checked)} className="w-3.5 h-3.5 accent-violet-600"/>
                    <span className="text-[11px] font-semibold text-slate-700">Submit Anonymously</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_public} onChange={e => setField("is_public", e.target.checked)} className="w-3.5 h-3.5 accent-violet-600"/>
                    <span className="text-[11px] font-semibold text-slate-700">Make Public (Notice Board)</span>
                  </label>
                </div>
                {record?.admin_response && (
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mb-1">Admin Response</p>
                    <p className="text-[10px] text-slate-600">{record.admin_response}</p>
                    <p className="text-[9px] text-slate-400 mt-1">{fmtDate(record.responded_at)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          {respondMode && <button onClick={() => setRespondMode(false)} className="px-4 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100">Back</button>}
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          {respondMode ? (
            <button onClick={submitResponse} disabled={respondSaving}
              className="px-5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60">
              {respondSaving ? <RefreshCw size={12} className="animate-spin"/> : <Send size={12}/>}
              {respondSaving ? "Sending…" : "Send Response"}
            </button>
          ) : (
            <button onClick={submit} disabled={saving}
              className="px-5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60">
              {saving ? <RefreshCw size={12} className="animate-spin"/> : <Check size={12}/>}
              {saving ? "Saving…" : (record ? "Update" : "Submit Feedback")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
// ─── Feedback Row ─────────────────────────────────────────────────────────────
function FeedbackRow({ rec, serial, selected, onSelect, onEdit, onDelete }: {
  rec: FeedbackRecord; serial: number; selected: boolean;
  onSelect: (id: number) => void; onEdit: (r: FeedbackRecord) => void; onDelete: (id: number) => void;
}) {
  const catIcon = CATEGORY_ICON[rec.category_name ?? "General"] ?? <MessageSquare size={10}/>;
  const displayName = rec.is_anonymous ? "Anonymous" : rec.student_name;
  const displayAdm  = rec.is_anonymous ? "—" : rec.admission_number;
  return (
    <tr className={`border-b border-slate-100 hover:bg-violet-50/30 transition-colors ${selected ? "bg-violet-50/50" : ""}`}>
      <td className="px-2 py-2 text-center">
        <button onClick={() => onSelect(rec.id)} className="text-slate-400 hover:text-violet-600">
          {selected ? <CheckSquare size={13} className="text-violet-600"/> : <Square size={13}/>}
        </button>
      </td>
      <td className="px-2 py-2 text-center text-[10px] font-bold text-slate-400">{serial}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold">
            {rec.is_anonymous ? <EyeOff size={10}/> : (rec.photo_url ? <img src={rec.photo_url} className="w-full h-full rounded-full object-cover" alt=""/> : displayName[0])}
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-800 leading-tight">{displayName}</p>
            <p className="text-[9px] text-slate-400 font-medium">{displayAdm}{!rec.is_anonymous ? ` · ${rec.class_name}${rec.section ? `-${rec.section}` : ""}` : ""}</p>
          </div>
        </div>
      </td>
      <td className="px-2 py-2">
        <span className="text-[10px] font-mono font-bold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-md">{rec.feedback_no}</span>
      </td>
      <td className="px-2 py-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
          {catIcon} {rec.category_name ?? "—"}
        </span>
      </td>
      <td className="px-2 py-2 max-w-[180px]">
        <p className="text-[11px] font-bold text-slate-700 leading-tight truncate">{rec.subject}</p>
        <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">{rec.description}</p>
      </td>
      <td className="px-2 py-2 text-center">
        <StarRating value={rec.rating}/>
      </td>
      <td className="px-2 py-2 text-center"><PriorityBadge priority={rec.priority_name ?? "Low"}/></td>
      <td className="px-2 py-2 text-center"><StatusBadge status={rec.status_name ?? "Pending"}/></td>
      <td className="px-2 py-2 text-center">
        {rec.responded_at
          ? <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full"><CheckCircle size={9}/> Yes</span>
          : <span className="text-[10px] text-slate-300">—</span>}
      </td>
      <td className="px-2 py-2 text-center">
        <span className="text-[10px] text-slate-500">{fmtDate(rec.created_at)}</span>
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => onEdit(rec)} className="p-1 rounded hover:bg-violet-100 text-violet-600" title="Edit / Respond"><Edit2 size={12}/></button>
          <button onClick={() => onDelete(rec.id)} className="p-1 rounded hover:bg-rose-100 text-rose-500" title="Trash"><Trash2 size={12}/></button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentFeedback() {
  const [records, setRecords]         = useState<FeedbackRecord[]>([]);
  const [stats, setStats]             = useState<Stats>({ total:0, this_month:0, pending:0, under_review:0, resolved:0, high_priority:0, avg_rating:0, responded:0 });
  const [masters, setMasters]         = useState({ categories: [] as MasterOption[], statuses: [] as MasterOption[], priorities: [] as MasterOption[] });
  const [classes, setClasses]         = useState<ClassOption[]>([]);
  const [loading, setLoading]         = useState(false);
  const [page, setPage]               = useState(1);
  const [lastPage, setLastPage]       = useState(1);
  const [total, setTotal]             = useState(0);
  const [search, setSearch]           = useState("");
  const [filterClass, setFilterClass]       = useState<ClassOption | null>(null);
  const [filterCategory, setFilterCategory] = useState<MasterOption | null>(null);
  const [filterStatus, setFilterStatus]     = useState<MasterOption | null>(null);
  const [filterPriority, setFilterPriority] = useState<MasterOption | null>(null);
  const [fromDate, setFromDate]       = useState("");
  const [toDate, setToDate]           = useState("");
  const [selected, setSelected]       = useState<number[]>([]);
  const [showModal, setShowModal]     = useState(false);
  const [editRecord, setEditRecord]   = useState<FeedbackRecord | null>(null);
  const [showTrash, setShowTrash]     = useState(false);
  const [trashRecords, setTrashRecords]     = useState<FeedbackRecord[]>([]);
  const [selectedTrashIds, setSelectedTrashIds] = useState<number[]>([]);

  useEffect(() => {
    api.get("/student-feedbacks/masters").then(res => { if (res.data.success) setMasters(res.data.data); });
    api.get("/student-feedbacks/stats").then(res => { if (res.data.success) setStats(res.data.data); });
    api.get("/master/classes").then(res => {
      if (res.data?.success && res.data.data)
        setClasses(Object.entries(res.data.data).map(([id, name]) => ({ value: Number(id), label: name as string })));
    }).catch(() => {});
  }, []);

  const fetchRecords = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params: any = { page: pg, per_page: 15 };
      if (search)          params.search   = search;
      if (filterClass)     params.class_id = filterClass.value;
      if (filterCategory)  params.category = filterCategory.value;
      if (filterStatus)    params.status   = filterStatus.value;
      if (filterPriority)  params.priority = filterPriority.value;
      if (fromDate)        params.from_date = fromDate;
      if (toDate)          params.to_date   = toDate;
      const res = await api.get("/student-feedbacks/", { params });
      if (res.data?.data) {
        setRecords(res.data.data);
        setPage(res.data.meta?.current_page ?? 1);
        setLastPage(res.data.meta?.last_page ?? 1);
        setTotal(res.data.meta?.total ?? 0);
      }
      setSelected([]);
    } catch { toast.error("Failed to load feedback"); }
    setLoading(false);
  }, [search, filterClass, filterCategory, filterStatus, filterPriority, fromDate, toDate]);

  useEffect(() => { fetchRecords(1); }, [search, filterClass, filterCategory, filterStatus, filterPriority, fromDate, toDate]);
  const refreshStats = () => { api.get("/student-feedbacks/stats").then(res => { if (res.data.success) setStats(res.data.data); }); };
  const fetchTrash   = async () => { try { const res = await api.get("/student-feedbacks/trashed"); setTrashRecords(res.data.data ?? []); setSelectedTrashIds([]); } catch { toast.error("Failed to load trash"); } };
  const openTrash    = () => { setShowTrash(true); fetchTrash(); };
  const handleDelete = async (id: number) => {
    if (!confirm("Move to trash?")) return;
    try { await api.delete(`/student-feedbacks/${id}`); toast.success("Moved to trash"); fetchRecords(page); refreshStats(); } catch { toast.error("Error"); }
  };
  const handleBulkDelete = async () => {
    if (!selected.length) return;
    if (!confirm(`Move ${selected.length} to trash?`)) return;
    try { await api.post("/student-feedbacks/bulk-delete", { ids: selected }); toast.success(`${selected.length} moved to trash`); fetchRecords(page); refreshStats(); } catch { toast.error("Error"); }
  };
  const handleRestore = async (id: number) => {
    try { await api.post(`/student-feedbacks/restore/${id}`); toast.success("Restored"); fetchTrash(); refreshStats(); } catch { toast.error("Error"); }
  };
  const handleBulkRestore = async () => {
    if (!selectedTrashIds.length) return;
    try { await api.post("/student-feedbacks/bulk-restore", { ids: selectedTrashIds }); toast.success("Restored"); fetchTrash(); refreshStats(); } catch { toast.error("Error"); }
  };
  const handleBulkForceDelete = async () => {
    if (!selectedTrashIds.length) return;
    if (!confirm(`Permanently delete ${selectedTrashIds.length}? Cannot be undone.`)) return;
    try { await api.post("/student-feedbacks/bulk-force-delete", { ids: selectedTrashIds }); toast.success("Permanently deleted"); fetchTrash(); } catch { toast.error("Error"); }
  };
  const handleExport = async () => {
    try { const res = await api.get("/student-feedbacks/export", { responseType: "blob" }); const url = URL.createObjectURL(new Blob([res.data])); const a = document.createElement("a"); a.href = url; a.download = `student_feedback_${new Date().toISOString().split("T")[0]}.csv`; a.click(); toast.success("Export ready"); } catch { toast.error("Export failed"); }
  };
  const toggleSelect   = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll      = () => setSelected(selected.length === records.length ? [] : records.map(r => r.id));
  const toggleTrash    = (id: number) => setSelectedTrashIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAllTrash = () => setSelectedTrashIds(selectedTrashIds.length === trashRecords.length ? [] : trashRecords.map(r => r.id));
  const catOpts  = masters.categories.map(o => ({ value: o.value, label: o.label }));
  const statOpts = masters.statuses.map(o => ({ value: o.value, label: o.label }));
  const prioOpts = masters.priorities.map(o => ({ value: o.value, label: o.label }));
  const clsOpts  = classes.map(c => ({ value: c.value, label: c.label }));
  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <FeedbackModal open={showModal} onClose={() => { setShowModal(false); setEditRecord(null); }}
        onSaved={() => { fetchRecords(page); refreshStats(); }} record={editRecord} masters={masters} classes={classes}/>

      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {showTrash && <button onClick={() => setShowTrash(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft size={14}/></button>}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"><MessageSquare size={16} className="text-white"/></div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-800">{showTrash ? "Feedback — Trash Bin" : "Student Feedback Portal"}</h1>
            <p className="text-[10px] text-slate-400 font-medium">{showTrash ? "Restore or permanently delete trashed feedback" : "Collect, manage & respond to student feedback across all categories"}</p>
          </div>
        </div>
        {!showTrash && (
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 text-[11px] font-semibold"><Download size={12}/> Export</button>
            <button onClick={openTrash} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold">
              <Trash2 size={12}/> Trash {trashRecords.length > 0 && <span className="bg-rose-500 text-white text-[9px] rounded-full px-1.5 py-0.5 font-bold">{trashRecords.length}</span>}
            </button>
            <button onClick={() => { setEditRecord(null); setShowModal(true); }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold shadow-sm"><Plus size={12}/> Add Feedback</button>
          </div>
        )}
      </div>

      {/* Stats */}
      {!showTrash && (
        <div className="flex-shrink-0 px-4 py-2 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-1.5">
            <StatCard label="Total"         value={stats.total}         icon={<MessageSquare size={11} className="text-slate-600"/>} subtext="All feedbacks"       color="bg-slate-100"  border="border-slate-400"/>
            <StatCard label="This Month"    value={stats.this_month}    icon={<Calendar size={11} className="text-violet-600"/>}     subtext="Received this month"  color="bg-violet-50"  border="border-violet-400"/>
            <StatCard label="Pending"       value={stats.pending}       icon={<Clock size={11} className="text-amber-600"/>}         subtext="Awaiting action"      color="bg-amber-50"   border="border-amber-400"/>
            <StatCard label="Under Review"  value={stats.under_review}  icon={<Eye size={11} className="text-blue-600"/>}            subtext="Being reviewed"       color="bg-blue-50"    border="border-blue-400"/>
            <StatCard label="Resolved"      value={stats.resolved}      icon={<CheckCircle size={11} className="text-emerald-600"/>} subtext="Closed positively"    color="bg-emerald-50" border="border-emerald-400"/>
            <StatCard label="High Priority" value={stats.high_priority} icon={<AlertTriangle size={11} className="text-rose-600"/>}  subtext="High + Critical"      color="bg-rose-50"    border="border-rose-400"/>
            <StatCard label="Avg Rating"    value={`${stats.avg_rating}★`} icon={<Star size={11} className="text-amber-500"/>}      subtext="Average star rating"  color="bg-amber-50"   border="border-amber-300"/>
            <StatCard label="Responded"     value={stats.responded}     icon={<Send size={11} className="text-purple-600"/>}         subtext="Admin replied"        color="bg-purple-50"  border="border-purple-400"/>
          </div>
        </div>
      )}

      {/* Trash View */}
      {showTrash ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-shrink-0 px-4 py-2 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
            <p className="text-[11px] font-extrabold text-slate-700">Trash: <span className="text-rose-600">{trashRecords.length}</span> feedback(s)</p>
            {selectedTrashIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button onClick={handleBulkRestore} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold"><RotateCcw size={11}/> Restore {selectedTrashIds.length}</button>
                <button onClick={handleBulkForceDelete} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-[11px] font-bold"><Trash2 size={11}/> Delete {selectedTrashIds.length}</button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto">
            {trashRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3"><Trash2 size={40} className="opacity-20"/><p className="text-sm font-semibold">Trash is empty</p></div>
            ) : (
              <table className="w-full min-w-[640px] text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="px-2 py-2 w-8 text-center"><button onClick={toggleAllTrash}>{selectedTrashIds.length === trashRecords.length ? <CheckSquare size={13} className="text-rose-600"/> : <Square size={13} className="text-slate-400"/>}</button></th>
                    <th className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Student</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Feedback No</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Category</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Subject</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Status</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Deleted</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trashRecords.map(r => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-rose-50/30">
                      <td className="px-2 py-2 text-center"><button onClick={() => toggleTrash(r.id)}>{selectedTrashIds.includes(r.id) ? <CheckSquare size={13} className="text-rose-600"/> : <Square size={13} className="text-slate-400"/>}</button></td>
                      <td className="px-3 py-2"><p className="text-[11px] font-bold text-slate-700">{r.is_anonymous ? "Anonymous" : r.student_name}</p><p className="text-[9px] text-slate-400">{r.is_anonymous ? "—" : r.admission_number}</p></td>
                      <td className="px-2 py-2"><span className="font-mono text-[10px] text-violet-700">{r.feedback_no}</span></td>
                      <td className="px-2 py-2"><span className="text-[10px] text-slate-600">{r.category_name ?? "—"}</span></td>
                      <td className="px-2 py-2"><p className="text-[10px] text-slate-600 truncate max-w-[160px]">{r.subject}</p></td>
                      <td className="px-2 py-2"><StatusBadge status={r.status_name ?? "Pending"}/></td>
                      <td className="px-2 py-2"><span className="text-[10px] text-slate-500">{fmtDate(r.deleted_at ?? null)}</span></td>
                      <td className="px-2 py-2 text-center"><button onClick={() => handleRestore(r.id)} className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold"><RotateCcw size={10}/> Restore</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* Main Table */
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Filter bar */}
          <div className="flex-shrink-0 px-4 py-2 bg-white border-b border-slate-100 flex flex-row flex-nowrap overflow-x-auto items-center gap-1.5">
            <div className="relative flex-shrink-0">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search student, subject…"
                className="pl-7 pr-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs w-40 focus:outline-none focus:ring-1 focus:ring-violet-500"/>
            </div>
            <div className="w-28 flex-shrink-0"><Select options={clsOpts} placeholder="Class…" isClearable styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body} value={filterClass} onChange={o => { setFilterClass(o as ClassOption | null); setPage(1); }}/></div>
            <div className="w-32 flex-shrink-0"><Select options={catOpts} placeholder="Category…" isClearable styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body} value={filterCategory} onChange={o => { setFilterCategory(o as MasterOption | null); setPage(1); }}/></div>
            <div className="w-28 flex-shrink-0"><Select options={statOpts} placeholder="Status…" isClearable styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body} value={filterStatus} onChange={o => { setFilterStatus(o as MasterOption | null); setPage(1); }}/></div>
            <div className="w-28 flex-shrink-0"><Select options={prioOpts} placeholder="Priority…" isClearable styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body} value={filterPriority} onChange={o => { setFilterPriority(o as MasterOption | null); setPage(1); }}/></div>
            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 w-28 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 flex-shrink-0"/>
            <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 w-28 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 flex-shrink-0"/>
            <button onClick={() => fetchRecords(page)} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex-shrink-0"><RefreshCw size={12}/></button>
            {selected.length > 0 && (
              <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-bold hover:bg-rose-100 flex-shrink-0 ml-auto"><Trash2 size={11}/> Trash {selected.length}</button>
            )}
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full text-slate-400 gap-2"><RefreshCw size={16} className="animate-spin"/> Loading…</div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                <MessageSquare size={40} className="opacity-20"/>
                <p className="text-sm font-semibold">No feedback found</p>
                <button onClick={() => { setEditRecord(null); setShowModal(true); }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700"><Plus size={12}/> Add First Feedback</button>
              </div>
            ) : (
              <table className="w-full min-w-[1100px] text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="px-2 py-2 text-center w-8"><button onClick={toggleAll}>{selected.length === records.length && records.length > 0 ? <CheckSquare size={13} className="text-violet-600"/> : <Square size={13} className="text-slate-400"/>}</button></th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase w-8">#</th>
                    <th className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Student</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Feedback No</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Category</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Subject</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Rating</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Priority</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Status</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Responded</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Date</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <FeedbackRow key={r.id} rec={r} serial={(page - 1) * 15 + i + 1}
                      selected={selected.includes(r.id)} onSelect={toggleSelect}
                      onEdit={rec => { setEditRecord(rec); setShowModal(true); }} onDelete={handleDelete}/>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && records.length > 0 && (
            <div className="flex-shrink-0 border-t border-slate-100 bg-white px-4 py-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Showing {(page-1)*15+1}–{Math.min(page*15, total)} of <span className="font-bold">{total}</span> feedbacks</span>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => { setPage(page-1); fetchRecords(page-1); }} className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 text-slate-500"><ChevronLeft size={13}/></button>
                {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => { const pg = Math.max(1, page-2)+i; if (pg > lastPage) return null; return (<button key={pg} onClick={() => { setPage(pg); fetchRecords(pg); }} className={`px-2 py-0.5 rounded text-[11px] font-bold ${pg === page ? "bg-violet-600 text-white" : "hover:bg-slate-100 text-slate-600"}`}>{pg}</button>); })}
                <button disabled={page >= lastPage} onClick={() => { setPage(page+1); fetchRecords(page+1); }} className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 text-slate-500"><ChevronRight size={13}/></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}