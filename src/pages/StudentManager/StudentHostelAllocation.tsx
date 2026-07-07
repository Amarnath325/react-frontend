import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, RefreshCw, Plus, Check, X,
  Trash2, CheckSquare, Square, Download, RotateCcw, ArrowLeft,
  Home, Edit2, Upload, Clock, CheckCircle, XCircle,
  ShieldCheck, Heart,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import Select from "react-select";

// ─── Types ───────────────────────────────────────────────────────────────────
interface HostelRecord {
  id: number;
  hostel_admission_no: string;
  student_id: number;
  academic_year_id: number | null;
  admission_date: string | null;
  room_type_preference: string;
  medical_history: string | null;
  allergies: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  guardian_relationship: string;
  aadhaar_verified: boolean;
  report_card_verified: boolean;
  medical_clearance_verified: boolean;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  remarks: string | null;
  created_at: string;
  deleted_at?: string | null;
  student?: {
    id: number; admission_number: string; roll_number?: string;
    first_name?: string; last_name?: string; section?: string;
    email?: string; mobile_number?: string;
    user?: { full_name: string };
    class?: { m_alias_name?: string; m_name?: string };
  };
  academicYear?: { year_name: string };
}
interface Stats {
  total: number; pending: number; approved: number; rejected: number;
  cancelled: number; aadhaar_ok: number; medical_ok: number; trashed: number;
}
interface StudentOpt { value: number; label: string; sub: string; data: any; }
interface ClassOpt   { value: number; label: string; }

const ROOM_TYPES = ["Single", "2-Seater", "3-Seater", "Dormitory (4+)"];
const RELATIONSHIPS = ["Father", "Mother", "Guardian", "Brother", "Sister", "Uncle", "Aunt", "Grandfather", "Grandmother"];

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  "Pending":   { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   icon: <Clock size={9}/> },
  "Approved":  { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: <CheckCircle size={9}/> },
  "Rejected":  { color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200",    icon: <XCircle size={9}/> },
  "Cancelled": { color: "text-slate-500",   bg: "bg-slate-100",  border: "border-slate-300",   icon: <X size={9}/> },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const selSm = {
  control:   (b: any) => ({ ...b, minHeight: 28, fontSize: 11, borderColor: "#e5e7eb", boxShadow: "none", "&:hover": { borderColor: "#7c3aed" } }),
  menu:      (b: any) => ({ ...b, fontSize: 11, zIndex: 50 }),
  option:    (b: any, s: any) => ({ ...b, fontSize: 11, padding: "4px 10px", background: s.isSelected ? "#7c3aed" : s.isFocused ? "#f5f3ff" : "white", color: s.isSelected ? "white" : "#1e293b" }),
  singleValue:(b: any) => ({ ...b, color: "#334155", fontSize: 11 }),
  dropdownIndicator: (b: any) => ({ ...b, padding: "0 4px" }),
  valueContainer: (b: any) => ({ ...b, padding: "0 8px" }),
  indicatorSeparator: () => ({ display: "none" }),
  menuPortal: (b: any) => ({ ...b, zIndex: 9999 }),
};

// ─── Badge ────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG["Pending"];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.icon} {status}
    </span>
  );
}
function VerifyDot({ ok }: { ok: boolean }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${ok ? "bg-emerald-500" : "bg-slate-300"}`}/>;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
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

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean; onClose: () => void; onSaved: () => void;
  record: HostelRecord | null;
  students: StudentOpt[];
  loadingStudents: boolean;
}
const INIT_FORM = {
  student_id: null as number | null,
  room_type_preference: "2-Seater",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  guardian_relationship: "Father",
  medical_history: "",
  allergies: "",
  aadhaar_verified: false,
  report_card_verified: false,
  medical_clearance_verified: false,
  status: "Pending" as string,
  remarks: "",
};

function HostelModal({ open, onClose, onSaved, record, students, loadingStudents }: ModalProps) {
  const [form, setForm] = useState({ ...INIT_FORM });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (record) {
      setForm({
        student_id: record.student_id,
        room_type_preference: record.room_type_preference || "2-Seater",
        emergency_contact_name: record.emergency_contact_name || "",
        emergency_contact_phone: record.emergency_contact_phone || "",
        guardian_relationship: record.guardian_relationship || "Father",
        medical_history: record.medical_history || "",
        allergies: record.allergies || "",
        aadhaar_verified: record.aadhaar_verified,
        report_card_verified: record.report_card_verified,
        medical_clearance_verified: record.medical_clearance_verified,
        status: record.status,
        remarks: record.remarks || "",
      });
    } else {
      setForm({ ...INIT_FORM });
    }
  }, [open, record]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  // Auto-fill from selected student
  const handleStudentChange = (opt: StudentOpt | null) => {
    set("student_id", opt?.value ?? null);
    if (opt?.data && !record) {
      setForm(f => ({
        ...f,
        student_id: opt.value,
        medical_history: opt.data.medical_conditions || "",
        allergies: opt.data.allergies || "",
        emergency_contact_name: opt.data.father_name || "",
        emergency_contact_phone: opt.data.father_mobile || "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record && !form.student_id) { toast.error("Select a student"); return; }
    if (!form.emergency_contact_name || !form.emergency_contact_phone) { toast.error("Emergency contact required"); return; }
    setSaving(true);
    try {
      const payload = {
        student_id: form.student_id,
        room_type_preference: form.room_type_preference,
        emergency_contact_name: form.emergency_contact_name,
        emergency_contact_phone: form.emergency_contact_phone,
        guardian_relationship: form.guardian_relationship,
        medical_history: form.medical_history || null,
        allergies: form.allergies || null,
        aadhaar_verified: form.aadhaar_verified,
        report_card_verified: form.report_card_verified,
        medical_clearance_verified: form.medical_clearance_verified,
        status: form.status,
        remarks: form.remarks || null,
      };
      if (record) {
        await api.put(`/student-hostel-allocations/${record.id}`, payload);
        toast.success("Hostel admission updated");
      } else {
        await api.post("/student-hostel-allocations/", payload);
        toast.success("Hostel admission filed!");
      }
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Save failed");
    } finally { setSaving(false); }
  };

  if (!open) return null;

  const allStudentOpts = students;
  const selectedStudent = allStudentOpts.find(s => s.value === form.student_id) ?? null;
  const roomOpts  = ROOM_TYPES.map(r => ({ value: r, label: r }));
  const relOpts   = RELATIONSHIPS.map(r => ({ value: r, label: r }));
  const statusOpts = ["Pending", "Approved", "Rejected", "Cancelled"].map(s => ({ value: s, label: s }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <Home size={14} className="text-white"/>
            </div>
            <div>
              <h2 className="text-[13px] font-extrabold text-white">{record ? "Edit Hostel Admission" : "New Hostel Allocation"}</h2>
              <p className="text-[10px] text-violet-200">{record ? record.hostel_admission_no : "File a new admission request"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
            <X size={13} className="text-white"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3.5 space-y-2.5">
          {/* Student */}
          {!record && (
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Student <span className="text-rose-500">*</span></label>
              <Select
                options={allStudentOpts}
                isLoading={loadingStudents}
                value={selectedStudent}
                onChange={o => handleStudentChange(o as StudentOpt | null)}
                placeholder="Search student by name or admission no..."
                styles={selSm}
                menuPortalTarget={document.body}
                formatOptionLabel={(o: any) => (
                  <div>
                    <div className="text-[11px] font-semibold text-slate-700">{o.label}</div>
                    <div className="text-[9px] text-slate-400">{o.sub}</div>
                  </div>
                )}
              />
            </div>
          )}
          {record && (
            <div className="bg-violet-50 rounded-lg px-3 py-1.5 border border-violet-100">
              <p className="text-[9px] text-violet-500 font-bold uppercase leading-none mb-0.5">Student</p>
              <p className="text-[11px] font-bold text-slate-700 leading-none">
                {(record.student?.user?.full_name ?? `${record.student?.first_name ?? ""} ${record.student?.last_name ?? ""}`.trim()) || "—"}
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5">{record.student?.admission_number} · {record.student?.class?.m_alias_name ?? record.student?.class?.m_name}</p>
            </div>
          )}

          {/* Preferences and Status */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Room Type Preference <span className="text-rose-500">*</span></label>
              <Select options={roomOpts} value={{ value: form.room_type_preference, label: form.room_type_preference }}
                onChange={o => set("room_type_preference", o?.value ?? "2-Seater")}
                styles={selSm} menuPortalTarget={document.body}/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Status</label>
              <Select options={statusOpts} value={{ value: form.status, label: form.status }}
                onChange={o => set("status", o?.value ?? "Pending")}
                styles={selSm} menuPortalTarget={document.body}/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Guardian Relationship</label>
              <Select options={relOpts} value={{ value: form.guardian_relationship, label: form.guardian_relationship }}
                onChange={o => set("guardian_relationship", o?.value ?? "Father")}
                styles={selSm} menuPortalTarget={document.body}/>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Emergency Contact Name <span className="text-rose-500">*</span></label>
              <input value={form.emergency_contact_name} onChange={e => set("emergency_contact_name", e.target.value)}
                placeholder="Parent / Guardian name"
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-violet-400"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Emergency Phone <span className="text-rose-500">*</span></label>
              <input value={form.emergency_contact_phone} onChange={e => set("emergency_contact_phone", e.target.value)}
                placeholder="10-digit mobile"
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-violet-400"/>
            </div>
          </div>

          {/* Medical */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Medical History</label>
              <input value={form.medical_history} onChange={e => set("medical_history", e.target.value)}
                placeholder="Any chronic conditions..."
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-violet-400"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Allergies</label>
              <input value={form.allergies} onChange={e => set("allergies", e.target.value)}
                placeholder="Food, dust, pollen..."
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-violet-400"/>
            </div>
          </div>

          {/* Verification & Remarks */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <p className="text-[10px] font-bold text-slate-600 mb-1">Document Verification</p>
              <div className="flex flex-col gap-1.5 mt-1">
                {[
                  { key: "aadhaar_verified", label: "Aadhaar Card" },
                  { key: "report_card_verified", label: "Previous Report Card" },
                  { key: "medical_clearance_verified", label: "Medical Clearance" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={(form as any)[key]} onChange={e => set(key, e.target.checked)}
                      className="w-3.5 h-3.5 accent-violet-600 rounded"/>
                    <span className="text-[11px] text-slate-600 font-semibold">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Remarks</label>
              <textarea rows={2} value={form.remarks} onChange={e => set("remarks", e.target.value)}
                placeholder="Any additional notes..."
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-violet-400 resize-none h-[64px]"/>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <RefreshCw size={11} className="animate-spin"/> : <Check size={11}/>}
              {record ? "Update" : "File Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentHostelAllocation() {
  const [records, setRecords]   = useState<HostelRecord[]>([]);
  const [stats, setStats]       = useState<Stats>({ total:0, pending:0, approved:0, rejected:0, cancelled:0, aadhaar_ok:0, medical_ok:0, trashed:0 });
  const [students, setStudents] = useState<StudentOpt[]>([]);
  const [classes, setClasses]   = useState<ClassOpt[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState("");
  const [filterStatus, setFilterStatus] = useState<{ value: string; label: string } | null>(null);
  const [filterClass, setFilterClass]   = useState<ClassOpt | null>(null);
  const [page, setPage]         = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal]       = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [showModal, setShowModal]     = useState(false);
  const [editRecord, setEditRecord]   = useState<HostelRecord | null>(null);
  const [showTrash, setShowTrash]     = useState(false);
  const [trashRecs, setTrashRecs]     = useState<HostelRecord[]>([]);
  const [trashSel, setTrashSel]       = useState<number[]>([]);

  const importRef = useRef<HTMLInputElement>(null);

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  const refreshStats = useCallback(() => {
    api.get("/student-hostel-allocations/stats").then(res => {
      if (res.data?.success) setStats(res.data.data);
    });
  }, []);

  const fetchRecords = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params: any = { page: pg };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus.value;
      if (filterClass) params.class_id = filterClass.value;
      const res = await api.get("/student-hostel-allocations/", { params });
      if (res.data?.success) {
        setRecords(res.data.data);
        setPage(res.data.pagination?.current_page ?? 1);
        setLastPage(res.data.pagination?.last_page ?? 1);
        setTotal(res.data.pagination?.total ?? 0);
      }
      setSelected([]);
    } catch { toast.error("Failed to load hostel admissions"); }
    setLoading(false);
  }, [search, filterStatus, filterClass]);

  const fetchMasters = useCallback(() => {
    setLoadingStudents(true);
    api.get("/student-hostel-allocations/masters").then(res => {
      if (res.data?.success) {
        const d = res.data.data;
        setStudents((d.students ?? []).map((s: any) => ({
          value: s.id,
          label: `${s.name} (${s.admission_number})`,
          sub: `${s.class_name} | ${s.section ?? "A"}`,
          data: s,
        })));
        setClasses((d.classes ?? []).map((c: any) => ({ value: c.m_id, label: c.m_alias_name || c.m_name })));
      }
    }).finally(() => setLoadingStudents(false));
  }, []);

  const fetchTrash = async () => {
    try {
      const r = await api.get("/student-hostel-allocations/", { params: { only_trashed: true } });
      setTrashRecs(r.data.data ?? []); setTrashSel([]);
    } catch { toast.error("Failed to load trash"); }
  };

  useEffect(() => { fetchMasters(); refreshStats(); }, []);
  useEffect(() => { fetchRecords(1); }, [search, filterStatus, filterClass]);

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm("Move to trash?")) return;
    try { await api.delete(`/student-hostel-allocations/${id}`); toast.success("Moved to trash"); fetchRecords(page); refreshStats(); }
    catch { toast.error("Delete failed"); }
  };
  const handleRestore = async (id: number) => {
    try { await api.post(`/student-hostel-allocations/restore/${id}`); toast.success("Restored"); fetchTrash(); refreshStats(); }
    catch { toast.error("Restore failed"); }
  };
  const handleForceDelete = async (id: number) => {
    if (!confirm("Permanently delete? This cannot be undone.")) return;
    try { await api.delete(`/student-hostel-allocations/${id}/force`); toast.success("Permanently deleted"); fetchTrash(); }
    catch { toast.error("Failed"); }
  };
  const handleBulkDelete = async () => {
    if (!selected.length || !confirm(`Move ${selected.length} record(s) to trash?`)) return;
    try { await api.post("/student-hostel-allocations/bulk-delete", { ids: selected }); toast.success(`${selected.length} moved to trash`); fetchRecords(page); refreshStats(); }
    catch { toast.error("Bulk delete failed"); }
  };
  const handleBulkStatus = async (status: string) => {
    if (!selected.length) return;
    try { await api.post("/student-hostel-allocations/bulk-status", { ids: selected, status }); toast.success(`Status updated to ${status}`); fetchRecords(page); refreshStats(); setSelected([]); }
    catch { toast.error("Status update failed"); }
  };
  const handleBulkRestore = async () => {
    if (!trashSel.length) return;
    try { await api.post("/student-hostel-allocations/bulk-restore", { ids: trashSel }); toast.success("Restored"); fetchTrash(); refreshStats(); }
    catch { toast.error("Failed"); }
  };
  const handleBulkForceDelete = async () => {
    if (!trashSel.length || !confirm(`Permanently delete ${trashSel.length} record(s)?`)) return;
    try { await api.post("/student-hostel-allocations/bulk-force-delete", { ids: trashSel }); toast.success("Permanently deleted"); fetchTrash(); }
    catch { toast.error("Failed"); }
  };

  const handleExport = async () => {
    try {
      const res = await api.get("/student-hostel-allocations/export", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url;
      a.download = `hostel_admissions_${new Date().toISOString().split("T")[0]}.csv`; a.click();
      toast.success("Export ready");
    } catch { toast.error("Export failed"); }
  };
  const downloadSample = async () => {
    try {
      const res = await api.get("/student-hostel-allocations/sample", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url; a.download = "hostel_admission_sample.csv"; a.click();
      toast.success("Sample downloaded");
    } catch { toast.error("Download failed"); }
  };
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    const tid = toast.loading("Importing CSV...");
    try {
      const res = await api.post("/student-hostel-allocations/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.dismiss(tid);
      if (res.data?.success) { toast.success(res.data.message || "Import completed!"); fetchRecords(1); refreshStats(); fetchMasters(); }
      else toast.error(res.data?.message ?? "Import failed");
    } catch (err: any) { toast.dismiss(tid); toast.error(err.response?.data?.message ?? "Import failed"); }
    if (importRef.current) importRef.current.value = "";
  };

  const toggleSelect   = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll      = () => setSelected(selected.length === records.length ? [] : records.map(r => r.id));
  const toggleTrash    = (id: number) => setTrashSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAllTrash = () => setTrashSel(trashSel.length === trashRecs.length ? [] : trashRecs.map(r => r.id));

  const statusOpts = ["Pending", "Approved", "Rejected", "Cancelled"].map(s => ({ value: s, label: s }));

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <HostelModal open={showModal} onClose={() => { setShowModal(false); setEditRecord(null); }}
        onSaved={() => { fetchRecords(page); refreshStats(); fetchMasters(); }}
        record={editRecord} students={students} loadingStudents={loadingStudents}/>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {showTrash && <button onClick={() => setShowTrash(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft size={14}/></button>}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
            <Home size={16} className="text-white"/>
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-800">{showTrash ? "Hostel — Trash Bin" : "Student Hostel Allocation"}</h1>
            <p className="text-[10px] text-slate-400 font-medium">{showTrash ? "Restore or permanently delete trashed applications" : "Manage hostel admission applications & room assignments"}</p>
          </div>
        </div>
        {!showTrash && (
          <div className="flex items-center gap-2">
            <button onClick={downloadSample} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold">Sample</button>
            <button onClick={() => importRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold"><Upload size={12}/> Import</button>
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 text-[11px] font-semibold"><Download size={12}/> Export</button>
            <button onClick={() => { setShowTrash(true); fetchTrash(); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold">
              <Trash2 size={12}/> Trash {stats.trashed > 0 && <span className="bg-rose-500 text-white text-[9px] rounded-full px-1.5 py-0.5 font-bold ml-1">{stats.trashed}</span>}
            </button>
            <button onClick={() => { setEditRecord(null); setShowModal(true); }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold shadow-sm"><Plus size={12}/> New Admission</button>
            <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImport}/>
          </div>
        )}
        {showTrash && trashRecs.length > 0 && (
          <div className="flex items-center gap-2">
            {trashSel.length > 0 && <>
              <button onClick={handleBulkRestore} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100"><RotateCcw size={11}/> Restore ({trashSel.length})</button>
              <button onClick={handleBulkForceDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-semibold hover:bg-rose-100"><Trash2 size={11}/> Delete ({trashSel.length})</button>
            </>}
          </div>
        )}
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      {!showTrash && (
        <div className="flex-shrink-0 px-4 py-2 grid grid-cols-4 lg:grid-cols-8 gap-2">
          <StatCard label="Total Applications" value={stats.total}       icon={<Home size={12} className="text-violet-600"/>}   subtext="All submissions"      color="bg-violet-50"  border="border-violet-500"/>
          <StatCard label="Pending"            value={stats.pending}     icon={<Clock size={12} className="text-amber-600"/>}   subtext="Awaiting decision"   color="bg-amber-50"   border="border-amber-400"/>
          <StatCard label="Approved"           value={stats.approved}    icon={<CheckCircle size={12} className="text-emerald-600"/>} subtext="Currently residing" color="bg-emerald-50" border="border-emerald-400"/>
          <StatCard label="Rejected"           value={stats.rejected}    icon={<XCircle size={12} className="text-rose-600"/>}  subtext="Not admitted"        color="bg-rose-50"    border="border-rose-400"/>
          <StatCard label="Cancelled"          value={stats.cancelled}   icon={<X size={12} className="text-slate-500"/>}       subtext="Withdrawn"           color="bg-slate-100"  border="border-slate-400"/>
          <StatCard label="Aadhaar Verified"   value={stats.aadhaar_ok}  icon={<ShieldCheck size={12} className="text-blue-600"/>}  subtext="ID confirmed"    color="bg-blue-50"    border="border-blue-400"/>
          <StatCard label="Medical Cleared"    value={stats.medical_ok}  icon={<Heart size={12} className="text-pink-600"/>}    subtext="Health verified"     color="bg-pink-50"    border="border-pink-400"/>
          <StatCard label="In Trash"           value={stats.trashed}     icon={<Trash2 size={12} className="text-slate-400"/>}  subtext="Soft deleted"        color="bg-slate-100"  border="border-slate-300"/>
        </div>
      )}

      {/* ── Filter Bar ──────────────────────────────────────────────────────── */}
      {!showTrash && (
        <div className="flex-shrink-0 px-4 pb-2 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search student, admission no..."
              className="w-full pl-7 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg outline-none focus:border-violet-400 bg-white"/>
          </div>
          <div className="w-36">
            <Select options={statusOpts} value={filterStatus} onChange={o => setFilterStatus(o)}
              placeholder="All Status" isClearable styles={selSm}/>
          </div>
          <div className="w-36">
            <Select options={classes} value={filterClass} onChange={o => setFilterClass(o)}
              placeholder="All Classes" isClearable styles={selSm}/>
          </div>
          {selected.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => handleBulkStatus("Approved")} className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100">✓ Approve ({selected.length})</button>
              <button onClick={() => handleBulkStatus("Rejected")} className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-semibold hover:bg-rose-100">✗ Reject ({selected.length})</button>
              <button onClick={handleBulkDelete} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-50"><Trash2 size={11} className="inline mr-1"/>Trash</button>
            </div>
          )}
          <button onClick={() => fetchRecords(page)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""}/>
          </button>
        </div>
      )}

      {/* ── Main Table ──────────────────────────────────────────────────────── */}
      {!showTrash && (
        <div className="flex-1 overflow-auto px-4 pb-2">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full min-w-[950px]">
              <thead className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <button onClick={toggleAll} className="text-slate-400 hover:text-violet-600">
                      {selected.length === records.length && records.length > 0
                        ? <CheckSquare size={13} className="text-violet-600"/> : <Square size={13}/>}
                    </button>
                  </th>
                  {["Admission No", "Student", "Class", "Room Pref.", "Emergency Contact", "Documents", "Status", "Applied On", "Actions"].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="text-center py-12 text-slate-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2"/>
                    <p className="text-[11px]">Loading hostel admissions…</p>
                  </td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12">
                    <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-3">
                      <Home size={22} className="text-violet-300"/>
                    </div>
                    <p className="text-[12px] font-bold text-slate-400">No hostel applications found</p>
                    <p className="text-[10px] text-slate-300 mt-1">Click "New Admission" to file a hostel allocation request</p>
                  </td></tr>
                ) : records.map(rec => {
                  const studentName = (rec.student?.user?.full_name ?? `${rec.student?.first_name ?? ""} ${rec.student?.last_name ?? ""}`.trim()) || "—";
                  const className = rec.student?.class?.m_alias_name ?? rec.student?.class?.m_name ?? "—";
                  return (
                    <tr key={rec.id} className={`border-b border-slate-50 hover:bg-violet-50/30 transition-colors ${selected.includes(rec.id) ? "bg-violet-50/60" : ""}`}>
                      <td className="px-3 py-2">
                        <button onClick={() => toggleSelect(rec.id)} className="text-slate-400 hover:text-violet-600">
                          {selected.includes(rec.id) ? <CheckSquare size={13} className="text-violet-600"/> : <Square size={13}/>}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] font-mono font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">
                          {rec.hostel_admission_no}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-[8px] font-black text-white">{studentName.charAt(0)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-700 truncate max-w-[110px]">{studentName}</p>
                            <p className="text-[9px] text-slate-400">{rec.student?.admission_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-600">{className}</td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{rec.room_type_preference}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div>
                          <p className="text-[11px] font-semibold text-slate-700">{rec.emergency_contact_name}</p>
                          <p className="text-[9px] text-slate-400">{rec.emergency_contact_phone} · {rec.guardian_relationship}</p>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5" title="Aadhaar · Report Card · Medical">
                          <VerifyDot ok={rec.aadhaar_verified}/>
                          <VerifyDot ok={rec.report_card_verified}/>
                          <VerifyDot ok={rec.medical_clearance_verified}/>
                          <span className="text-[9px] text-slate-400 ml-0.5">
                            {[rec.aadhaar_verified, rec.report_card_verified, rec.medical_clearance_verified].filter(Boolean).length}/3
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2"><StatusBadge status={rec.status}/></td>
                      <td className="px-3 py-2 text-[10px] text-slate-400">{fmtDate(rec.created_at)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditRecord(rec); setShowModal(true); }} className="p-1 rounded hover:bg-slate-100 text-slate-500" title="Edit"><Edit2 size={11}/></button>
                          <button onClick={() => handleDelete(rec.id)} className="p-1 rounded hover:bg-rose-100 text-rose-500" title="Trash"><Trash2 size={11}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-slate-400">Showing {records.length} of {total} · Page {page}/{lastPage}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => fetchRecords(page - 1)} disabled={page <= 1}
                  className="px-2 py-1 text-[10px] border rounded disabled:opacity-40 hover:bg-slate-50">Prev</button>
                <button onClick={() => fetchRecords(page + 1)} disabled={page >= lastPage}
                  className="px-2 py-1 text-[10px] border rounded disabled:opacity-40 hover:bg-slate-50">Next</button>
              </div>
            </div>
          )}
          {lastPage <= 1 && (
            <p className="mt-2 text-[10px] text-slate-400">{records.length} record{records.length !== 1 ? "s" : ""}{selected.length > 0 && ` · ${selected.length} selected`}</p>
          )}
        </div>
      )}

      {/* ── Trash Bin ───────────────────────────────────────────────────────── */}
      {showTrash && (
        <div className="flex-1 overflow-auto px-4 pb-4">
          <div className="bg-white rounded-xl border border-rose-100 shadow-sm overflow-hidden">
            <div className="bg-rose-50 px-4 py-2 border-b border-rose-100 flex items-center justify-between">
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                <Trash2 size={11}/> {trashRecs.length} Trashed Application{trashRecs.length !== 1 ? "s" : ""}
              </p>
              {trashRecs.length > 0 && (
                <button onClick={toggleAllTrash} className="text-[10px] text-rose-500 font-semibold">
                  {trashSel.length === trashRecs.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>
            <table className="w-full min-w-[700px]">
              <thead className="border-b border-rose-50">
                <tr>
                  {["", "Admission No", "Student", "Class", "Room Pref.", "Status", "Trashed On", "Actions"].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trashRecs.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-slate-300 text-[11px]">Trash is empty</td></tr>
                ) : trashRecs.map(rec => {
                  const studentName = (rec.student?.user?.full_name ?? `${rec.student?.first_name ?? ""} ${rec.student?.last_name ?? ""}`.trim()) || "—";
                  const className = rec.student?.class?.m_alias_name ?? rec.student?.class?.m_name ?? "—";
                  return (
                    <tr key={rec.id} className={`border-b border-slate-50 hover:bg-rose-50/30 ${trashSel.includes(rec.id) ? "bg-rose-50/50" : ""}`}>
                      <td className="px-3 py-2">
                        <button onClick={() => toggleTrash(rec.id)} className="text-slate-400 hover:text-rose-500">
                          {trashSel.includes(rec.id) ? <CheckSquare size={12} className="text-rose-500"/> : <Square size={12}/>}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] font-mono text-slate-500">{rec.hostel_admission_no}</span>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-[11px] font-bold text-slate-600">{studentName}</p>
                        <p className="text-[9px] text-slate-400">{rec.student?.admission_number}</p>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-500">{className}</td>
                      <td className="px-3 py-2 text-[11px] text-slate-500">{rec.room_type_preference}</td>
                      <td className="px-3 py-2"><StatusBadge status={rec.status}/></td>
                      <td className="px-3 py-2 text-[10px] text-slate-400">{fmtDate(rec.deleted_at ?? null)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleRestore(rec.id)} className="p-1 rounded hover:bg-emerald-100 text-emerald-600" title="Restore"><RotateCcw size={11}/></button>
                          <button onClick={() => handleForceDelete(rec.id)} className="p-1 rounded hover:bg-rose-100 text-rose-500" title="Delete Forever"><Trash2 size={11}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
