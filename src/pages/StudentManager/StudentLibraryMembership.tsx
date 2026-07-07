import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, RefreshCw, Plus, Check, X, Trash2,
  CheckSquare, Square, Download, RotateCcw, ArrowLeft,
  BookOpen, Edit2, Upload, Clock, CheckCircle, XCircle,
  Users, GraduationCap, UserCheck, Briefcase,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import Select from "react-select";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Member {
  id: number;
  user_id: number;
  member_code: string;
  member_type: "student" | "teacher" | "staff";
  join_date: string | null;
  expiry_date: string | null;
  status: "active" | "inactive" | "suspended" | "expired";
  max_books_allowed: number;
  notes: string | null;
  name: string;
  email: string;
  mobile: string;
  class_id: number | null;
  section: string;
  department: string;
  details: string;
  extra_code: string;
  deleted_at: string | null;
}
interface Stats {
  total: number; active: number; inactive: number; suspended: number;
  expired: number; students: number; teachers: number; staff: number; trashed: number;
}
interface EligibleUser { value: number; label: string; name: string; email: string; mobile: string; date_of_birth: string; gender: string; address: string; class_id: number | null; section: string; department: string; }

// ─── Configs ──────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  "active":    { color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200", icon: <CheckCircle size={9}/> },
  "inactive":  { color: "text-slate-500",   bg: "bg-slate-100",   border: "border-slate-300",   icon: <X size={9}/> },
  "suspended": { color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200",   icon: <Clock size={9}/> },
  "expired":   { color: "text-rose-700",    bg: "bg-rose-50",     border: "border-rose-200",    icon: <XCircle size={9}/> },
};
const TYPE_CFG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  "student": { label: "Student",  icon: <GraduationCap size={11}/>, color: "text-teal-700 bg-teal-50 border-teal-200" },
  "teacher": { label: "Teacher",  icon: <UserCheck size={11}/>,     color: "text-violet-700 bg-violet-50 border-violet-200" },
  "staff":   { label: "Staff",    icon: <Briefcase size={11}/>,     color: "text-blue-700 bg-blue-50 border-blue-200" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const today = () => new Date().toISOString().split("T")[0];
const addYear = () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split("T")[0]; };

const selSm = {
  control:   (b: any) => ({ ...b, minHeight: 28, fontSize: 11, borderColor: "#e5e7eb", boxShadow: "none", "&:hover": { borderColor: "#0d9488" } }),
  menu:      (b: any) => ({ ...b, fontSize: 11, zIndex: 50 }),
  option:    (b: any, s: any) => ({ ...b, fontSize: 11, padding: "4px 10px", background: s.isSelected ? "#0d9488" : s.isFocused ? "#f0fdfa" : "white", color: s.isSelected ? "white" : "#1e293b" }),
  singleValue:(b: any) => ({ ...b, color: "#334155", fontSize: 11 }),
  dropdownIndicator: (b: any) => ({ ...b, padding: "0 4px" }),
  valueContainer: (b: any) => ({ ...b, padding: "0 8px" }),
  indicatorSeparator: () => ({ display: "none" }),
  menuPortal: (b: any) => ({ ...b, zIndex: 9999 }),
};

// ─── Badges ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.inactive;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.icon} {status}
    </span>
  );
}
function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CFG[type] ?? TYPE_CFG.student;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, subtext, color, border }: {
  label: string; value: number; icon: React.ReactNode; subtext: string; color: string; border: string;
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
  record: Member | null;
}
const INIT_FORM = {
  member_type: "student" as string,
  user_id: null as number | null,
  member_code: "",
  full_name: "", email: "", mobile: "", date_of_birth: "", gender: "", address: "",
  class_id: null as number | null, section: "", department: "",
  join_date: today(), expiry_date: addYear(),
  status: "active" as string,
  max_books_allowed: 3,
  notes: "",
};

function LibraryMemberModal({ open, onClose, onSaved, record }: ModalProps) {
  const [form, setForm] = useState({ ...INIT_FORM });
  const [saving, setSaving] = useState(false);
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (record) {
      setForm({
        member_type: record.member_type, user_id: record.user_id,
        member_code: record.member_code, full_name: record.name,
        email: record.email, mobile: record.mobile,
        date_of_birth: "", gender: "", address: "",
        class_id: record.class_id, section: record.section, department: record.department,
        join_date: record.join_date ?? today(), expiry_date: record.expiry_date ?? addYear(),
        status: record.status, max_books_allowed: record.max_books_allowed, notes: record.notes ?? "",
      });
    } else {
      setForm({ ...INIT_FORM });
    }
  }, [open, record]);

  useEffect(() => {
    if (!open || record) return;
    fetchEligible(form.member_type);
  }, [open, form.member_type, record]);

  const fetchEligible = (type: string) => {
    setLoadingUsers(true);
    api.get("/school/library-members/search-eligible-users", { params: { member_type: type } })
      .then(r => setEligibleUsers(r.data.data ?? []))
      .catch(() => setEligibleUsers([]))
      .finally(() => setLoadingUsers(false));
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleUserSelect = (opt: EligibleUser | null) => {
    set("user_id", opt?.value ?? null);
    if (opt && !record) {
      setForm(f => ({
        ...f, user_id: opt.value, full_name: opt.name, email: opt.email,
        mobile: opt.mobile, date_of_birth: opt.date_of_birth ?? "",
        gender: opt.gender ?? "", address: opt.address ?? "",
        class_id: opt.class_id, section: opt.section, department: opt.department,
      }));
      // Auto-generate member code prefix
      const prefix = form.member_type === "student" ? "STU" : form.member_type === "teacher" ? "TCH" : "STF";
      const ts = Date.now().toString().slice(-4);
      set("member_code", `LIB-${prefix}-${ts}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record && !form.user_id) { toast.error("Select a user"); return; }
    if (!form.member_code) { toast.error("Member code is required"); return; }
    setSaving(true);
    try {
      const payload = {
        user_id: form.user_id, member_code: form.member_code,
        member_type: form.member_type, full_name: form.full_name,
        email: form.email || null, mobile: form.mobile || null,
        date_of_birth: form.date_of_birth || null, gender: form.gender || null,
        address: form.address || null,
        class_id: form.class_id || null, section: form.section || null, department: form.department || null,
        join_date: form.join_date, expiry_date: form.expiry_date || null,
        status: form.status, max_books_allowed: Number(form.max_books_allowed),
        notes: form.notes || null,
      };
      if (record) {
        await api.put(`/school/library-members/${record.id}`, payload);
        toast.success("Member updated");
      } else {
        await api.post("/school/library-members", payload);
        toast.success("Member enrolled!");
      }
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Save failed");
    } finally { setSaving(false); }
  };

  if (!open) return null;

  const typeOpts = ["student", "teacher", "staff"].map(t => ({ value: t, label: TYPE_CFG[t].label }));
  const statusOpts = ["active", "inactive", "suspended", "expired"].map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }));
  const genderOpts = ["Male", "Female", "Other"].map(g => ({ value: g, label: g }));
  const userOpts = eligibleUsers.map(u => ({ ...u, value: u.value, label: u.label }));
  const selectedUser = userOpts.find(u => u.value === form.user_id) ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <BookOpen size={14} className="text-white"/>
            </div>
            <div>
              <h2 className="text-[13px] font-extrabold text-white">{record ? "Edit Membership" : "New Library Membership"}</h2>
              <p className="text-[10px] text-teal-200">{record ? record.member_code : "Enroll a student / teacher / staff"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
            <X size={13} className="text-white"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3.5 space-y-2.5">
          {/* Type + Status + Books in one row */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Member Type <span className="text-rose-500">*</span></label>
              <Select options={typeOpts} value={typeOpts.find(t => t.value === form.member_type)}
                onChange={o => { set("member_type", o?.value ?? "student"); set("user_id", null); }}
                styles={selSm} menuPortalTarget={document.body} isDisabled={!!record}/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Status</label>
              <Select options={statusOpts} value={statusOpts.find(s => s.value === form.status)}
                onChange={o => set("status", o?.value ?? "active")}
                styles={selSm} menuPortalTarget={document.body}/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Max Books Allowed</label>
              <input type="number" min={0} max={20} value={form.max_books_allowed}
                onChange={e => set("max_books_allowed", parseInt(e.target.value) || 0)}
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-teal-400"/>
            </div>
          </div>

          {/* User selector (new only) */}
          {!record && (
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Select {TYPE_CFG[form.member_type]?.label ?? "User"} <span className="text-rose-500">*</span></label>
              <Select
                options={userOpts} isLoading={loadingUsers}
                value={selectedUser} onChange={o => handleUserSelect(o as EligibleUser | null)}
                placeholder={`Search ${form.member_type} by name...`}
                styles={selSm} menuPortalTarget={document.body}
              />
            </div>
          )}
          {record && (
            <div className="bg-teal-50 rounded-lg px-3 py-1.5 border border-teal-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-black text-white">{record.name.charAt(0)}</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-700 leading-none">{record.name}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{record.email} · {record.details}</p>
              </div>
              <TypeBadge type={record.member_type}/>
            </div>
          )}

          {/* Member code + Join + Expiry */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Member Code <span className="text-rose-500">*</span></label>
              <input value={form.member_code} onChange={e => set("member_code", e.target.value)}
                placeholder="e.g. LIB-STU-0001"
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-teal-400"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Join Date <span className="text-rose-500">*</span></label>
              <input type="date" value={form.join_date} onChange={e => set("join_date", e.target.value)}
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-teal-400"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Expiry Date</label>
              <input type="date" value={form.expiry_date} onChange={e => set("expiry_date", e.target.value)}
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-teal-400"/>
            </div>
          </div>

          {/* Name + Email + Mobile */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Full Name <span className="text-rose-500">*</span></label>
              <input value={form.full_name} onChange={e => set("full_name", e.target.value)}
                placeholder="Full name"
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-teal-400"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Email</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="Email address"
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-teal-400"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Mobile</label>
              <input value={form.mobile} onChange={e => set("mobile", e.target.value)}
                placeholder="10-digit mobile"
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-teal-400"/>
            </div>
          </div>

          {/* Gender + DOB + Class/Dept */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Gender</label>
              <Select options={genderOpts} value={genderOpts.find(g => g.value === form.gender) ?? null}
                onChange={o => set("gender", o?.value ?? "")} isClearable
                styles={selSm} menuPortalTarget={document.body}/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Date of Birth</label>
              <input type="date" value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)}
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-teal-400"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                {form.member_type === "student" ? "Section" : "Department"}
              </label>
              <input
                value={form.member_type === "student" ? form.section : form.department}
                onChange={e => set(form.member_type === "student" ? "section" : "department", e.target.value)}
                placeholder={form.member_type === "student" ? "e.g. A" : "e.g. Science"}
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-teal-400"/>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Notes</label>
            <input value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Any additional notes..."
              className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-teal-400"/>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <RefreshCw size={11} className="animate-spin"/> : <Check size={11}/>}
              {record ? "Update Member" : "Enroll Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentLibraryMembership() {
  const [records, setRecords] = useState<Member[]>([]);
  const [stats, setStats]     = useState<Stats>({ total:0, active:0, inactive:0, suspended:0, expired:0, students:0, teachers:0, staff:0, trashed:0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState("");
  const [filterStatus, setFilterStatus] = useState<{ value: string; label: string } | null>(null);
  const [filterType, setFilterType]     = useState<{ value: string; label: string } | null>(null);
  const [selected, setSelected]   = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState<Member | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [trashRecs, setTrashRecs] = useState<Member[]>([]);
  const [trashSel, setTrashSel]   = useState<number[]>([]);

  const importRef = useRef<HTMLInputElement>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const refreshStats = useCallback(() => {
    api.get("/school/library-members/stats").then(r => { if (r.data?.success) setStats(r.data.data); });
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus.value;
      if (filterType)   params.member_type = filterType.value;
      const r = await api.get("/school/library-members", { params });
      if (r.data?.success) { setRecords(r.data.data); }
      setSelected([]);
    } catch { toast.error("Failed to load members"); }
    setLoading(false);
  }, [search, filterStatus, filterType]);

  const fetchTrash = async () => {
    try {
      const r = await api.get("/school/library-members", { params: { only_trashed: true } });
      setTrashRecs(r.data.data ?? []); setTrashSel([]);
    } catch { toast.error("Failed to load trash"); }
  };

  useEffect(() => { refreshStats(); }, []);
  useEffect(() => { fetchRecords(); }, [search, filterStatus, filterType]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm("Move to trash?")) return;
    try { await api.delete(`/school/library-members/${id}`); toast.success("Moved to trash"); fetchRecords(); refreshStats(); }
    catch { toast.error("Delete failed"); }
  };
  const handleRestore = async (id: number) => {
    try { await api.post(`/school/library-members/${id}/restore`); toast.success("Restored"); fetchTrash(); refreshStats(); }
    catch { toast.error("Restore failed"); }
  };
  const handleForceDelete = async (id: number) => {
    if (!confirm("Permanently delete?")) return;
    try { await api.delete(`/school/library-members/${id}/force`); toast.success("Permanently deleted"); fetchTrash(); }
    catch { toast.error("Failed"); }
  };
  const handleToggleStatus = async (id: number) => {
    try { await api.patch(`/school/library-members/${id}/toggle-status`); fetchRecords(); refreshStats(); }
    catch { toast.error("Failed"); }
  };
  const handleBulkStatus = async (status: string) => {
    if (!selected.length) return;
    try { await api.post("/school/library-members/bulk-status", { ids: selected, status }); toast.success(`Status → ${status}`); fetchRecords(); refreshStats(); setSelected([]); }
    catch { toast.error("Failed"); }
  };
  const handleBulkDelete = async () => {
    if (!selected.length || !confirm(`Move ${selected.length} member(s) to trash?`)) return;
    try { await api.post("/school/library-members/bulk-delete", { ids: selected }); toast.success(`${selected.length} moved to trash`); fetchRecords(); refreshStats(); }
    catch { toast.error("Failed"); }
  };
  const handleBulkRestore = async () => {
    if (!trashSel.length) return;
    try { await api.post("/school/library-members/bulk-restore", { ids: trashSel }); toast.success("Restored"); fetchTrash(); refreshStats(); }
    catch { toast.error("Failed"); }
  };
  const handleBulkForceDelete = async () => {
    if (!trashSel.length || !confirm(`Permanently delete ${trashSel.length} member(s)?`)) return;
    try { await api.post("/school/library-members/bulk-delete", { ids: trashSel, force: true }); toast.success("Permanently deleted"); fetchTrash(); }
    catch { toast.error("Failed"); }
  };

  const handleExport = async () => {
    try {
      const r = await api.get("/school/library-members/export", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement("a"); a.href = url;
      a.download = `library_members_${new Date().toISOString().split("T")[0]}.csv`; a.click();
      toast.success("Export ready");
    } catch { toast.error("Export failed"); }
  };

  // CSV import — uses bulk JSON import format
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    if (lines.length < 2) { toast.error("CSV has no data rows"); return; }
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1).map(line => {
      const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      return Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? ""]));
    }).filter(r => r.member_code && r.reference_code);

    if (!rows.length) { toast.error("No valid rows found"); return; }
    const tid = toast.loading("Importing…");
    try {
      const r = await api.post("/school/library-members/bulk-import", { data: rows });
      toast.dismiss(tid);
      if (r.data?.success) { toast.success(r.data.message); fetchRecords(); refreshStats(); }
      else toast.error(r.data?.message ?? "Import failed");
    } catch (err: any) { toast.dismiss(tid); toast.error(err.response?.data?.message ?? "Import failed"); }
    if (importRef.current) importRef.current.value = "";
  };

  const downloadSample = () => {
    const csv = "member_code,member_type,reference_code,join_date,expiry_date,status,max_books_allowed,notes\nLIB-STU-0001,student,ADM001,2024-06-01,2025-05-31,active,3,\nLIB-TCH-0001,teacher,EMP001,2024-06-01,2025-05-31,active,5,Senior Teacher\n";
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "library_member_sample.csv"; a.click(); toast.success("Sample downloaded");
  };

  const toggleSelect   = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll      = () => setSelected(selected.length === records.length ? [] : records.map(r => r.id));
  const toggleTrash    = (id: number) => setTrashSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAllTrash = () => setTrashSel(trashSel.length === trashRecs.length ? [] : trashRecs.map(r => r.id));

  const statusOpts = ["active","inactive","suspended","expired"].map(s => ({ value: s, label: s.charAt(0).toUpperCase()+s.slice(1) }));
  const typeOpts   = ["student","teacher","staff"].map(t => ({ value: t, label: TYPE_CFG[t].label }));

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <LibraryMemberModal open={showModal} onClose={() => { setShowModal(false); setEditRecord(null); }}
        onSaved={() => { fetchRecords(); refreshStats(); }} record={editRecord}/>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {showTrash && <button onClick={() => setShowTrash(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft size={14}/></button>}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center">
            <BookOpen size={16} className="text-white"/>
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-800">{showTrash ? "Library — Trash Bin" : "Student Library Membership"}</h1>
            <p className="text-[10px] text-slate-400 font-medium">{showTrash ? "Restore or permanently delete trashed memberships" : "Manage library member enrollments & membership cards"}</p>
          </div>
        </div>
        {!showTrash && (
          <div className="flex items-center gap-2">
            <button onClick={downloadSample} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold">Sample</button>
            <button onClick={() => importRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold"><Upload size={12}/> Import</button>
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 text-[11px] font-semibold"><Download size={12}/> Export</button>
            <button onClick={() => { setShowTrash(true); fetchTrash(); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold">
              <Trash2 size={12}/> Trash {stats.trashed > 0 && <span className="bg-rose-500 text-white text-[9px] rounded-full px-1.5 py-0.5 font-bold ml-1">{stats.trashed}</span>}
            </button>
            <button onClick={() => { setEditRecord(null); setShowModal(true); }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold shadow-sm">
              <Plus size={12}/> Enroll Member
            </button>
            <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImport}/>
          </div>
        )}
        {showTrash && trashRecs.length > 0 && trashSel.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={handleBulkRestore} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100"><RotateCcw size={11}/> Restore ({trashSel.length})</button>
            <button onClick={handleBulkForceDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-semibold hover:bg-rose-100"><Trash2 size={11}/> Delete ({trashSel.length})</button>
          </div>
        )}
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      {!showTrash && (
        <div className="flex-shrink-0 px-4 py-2 grid grid-cols-4 lg:grid-cols-9 gap-2">
          <StatCard label="Total Members"  value={stats.total}     icon={<Users size={12} className="text-teal-600"/>}      subtext="All enrolled"       color="bg-teal-50"     border="border-teal-500"/>
          <StatCard label="Active"         value={stats.active}    icon={<CheckCircle size={12} className="text-emerald-600"/>} subtext="Current"        color="bg-emerald-50"  border="border-emerald-400"/>
          <StatCard label="Inactive"       value={stats.inactive}  icon={<X size={12} className="text-slate-500"/>}         subtext="Not borrowing"      color="bg-slate-100"   border="border-slate-400"/>
          <StatCard label="Suspended"      value={stats.suspended} icon={<Clock size={12} className="text-amber-600"/>}    subtext="On hold"            color="bg-amber-50"    border="border-amber-400"/>
          <StatCard label="Expired"        value={stats.expired}   icon={<XCircle size={12} className="text-rose-600"/>}   subtext="Renewal needed"     color="bg-rose-50"     border="border-rose-400"/>
          <StatCard label="Students"       value={stats.students}  icon={<GraduationCap size={12} className="text-teal-600"/>} subtext="Enrolled"        color="bg-teal-50"     border="border-teal-400"/>
          <StatCard label="Teachers"       value={stats.teachers}  icon={<UserCheck size={12} className="text-violet-600"/>} subtext="Enrolled"          color="bg-violet-50"   border="border-violet-400"/>
          <StatCard label="Staff"          value={stats.staff}     icon={<Briefcase size={12} className="text-blue-600"/>} subtext="Enrolled"           color="bg-blue-50"     border="border-blue-400"/>
          <StatCard label="In Trash"       value={stats.trashed}   icon={<Trash2 size={12} className="text-slate-400"/>}   subtext="Soft deleted"       color="bg-slate-100"   border="border-slate-300"/>
        </div>
      )}

      {/* ── Filter Bar ──────────────────────────────────────────────────────── */}
      {!showTrash && (
        <div className="flex-shrink-0 px-4 pb-2 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, code, email..."
              className="w-full pl-7 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg outline-none focus:border-teal-400 bg-white"/>
          </div>
          <div className="w-36">
            <Select options={statusOpts} value={filterStatus} onChange={o => setFilterStatus(o)}
              placeholder="All Status" isClearable styles={selSm}/>
          </div>
          <div className="w-32">
            <Select options={typeOpts} value={filterType} onChange={o => setFilterType(o)}
              placeholder="All Types" isClearable styles={selSm}/>
          </div>
          {selected.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => handleBulkStatus("active")} className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100">✓ Activate</button>
              <button onClick={() => handleBulkStatus("suspended")} className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-[11px] font-semibold hover:bg-amber-100">⏸ Suspend</button>
              <button onClick={handleBulkDelete} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-50"><Trash2 size={11} className="inline mr-1"/>Trash ({selected.length})</button>
            </div>
          )}
          <button onClick={fetchRecords} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""}/>
          </button>
        </div>
      )}

      {/* ── Main Table ──────────────────────────────────────────────────────── */}
      {!showTrash && (
        <div className="flex-1 overflow-auto px-4 pb-2">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full min-w-[880px]">
              <thead className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <button onClick={toggleAll} className="text-slate-400 hover:text-teal-600">
                      {selected.length === records.length && records.length > 0
                        ? <CheckSquare size={13} className="text-teal-600"/> : <Square size={13}/>}
                    </button>
                  </th>
                  {["Card No.", "Name", "Type", "Class / Dept", "Email / Mobile", "Books", "Status", "Join Date", "Expires", "Actions"].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} className="text-center py-12 text-slate-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2"/>
                    <p className="text-[11px]">Loading library members…</p>
                  </td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={11} className="text-center py-12">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-3">
                      <BookOpen size={22} className="text-teal-300"/>
                    </div>
                    <p className="text-[12px] font-bold text-slate-400">No library members found</p>
                    <p className="text-[10px] text-slate-300 mt-1">Click "Enroll Member" to add a new library membership</p>
                  </td></tr>
                ) : records.map(rec => (
                  <tr key={rec.id} className={`border-b border-slate-50 hover:bg-teal-50/30 transition-colors ${selected.includes(rec.id) ? "bg-teal-50/60" : ""}`}>
                    <td className="px-3 py-2">
                      <button onClick={() => toggleSelect(rec.id)} className="text-slate-400 hover:text-teal-600">
                        {selected.includes(rec.id) ? <CheckSquare size={13} className="text-teal-600"/> : <Square size={13}/>}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                        {rec.member_code}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-[8px] font-black text-white">{(rec.name || "?").charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-700 truncate max-w-[110px]">{rec.name || "—"}</p>
                          <p className="text-[9px] text-slate-400">{rec.extra_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2"><TypeBadge type={rec.member_type}/></td>
                    <td className="px-3 py-2 text-[11px] text-slate-600">{rec.details || "—"}</td>
                    <td className="px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-600 truncate max-w-[130px]">{rec.email || "—"}</p>
                        <p className="text-[9px] text-slate-400">{rec.mobile || ""}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-[11px] font-bold text-teal-700 bg-teal-50 rounded-full px-2 py-0.5">{rec.max_books_allowed}</span>
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => handleToggleStatus(rec.id)} title="Click to toggle">
                        <StatusBadge status={rec.status}/>
                      </button>
                    </td>
                    <td className="px-3 py-2 text-[10px] text-slate-400">{fmtDate(rec.join_date)}</td>
                    <td className="px-3 py-2">
                      {rec.expiry_date ? (
                        <span className={`text-[10px] font-semibold ${new Date(rec.expiry_date) < new Date() ? "text-rose-600" : "text-slate-500"}`}>
                          {fmtDate(rec.expiry_date)}
                        </span>
                      ) : <span className="text-[10px] text-slate-300">No expiry</span>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditRecord(rec); setShowModal(true); }} className="p-1 rounded hover:bg-slate-100 text-slate-500" title="Edit"><Edit2 size={11}/></button>
                        <button onClick={() => handleDelete(rec.id)} className="p-1 rounded hover:bg-rose-100 text-rose-500" title="Trash"><Trash2 size={11}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">{records.length} member{records.length !== 1 ? "s" : ""}{selected.length > 0 && ` · ${selected.length} selected`}</p>
        </div>
      )}

      {/* ── Trash Bin ───────────────────────────────────────────────────────── */}
      {showTrash && (
        <div className="flex-1 overflow-auto px-4 pb-4">
          <div className="bg-white rounded-xl border border-rose-100 shadow-sm overflow-hidden">
            <div className="bg-rose-50 px-4 py-2 border-b border-rose-100 flex items-center justify-between">
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                <Trash2 size={11}/> {trashRecs.length} Trashed Member{trashRecs.length !== 1 ? "s" : ""}
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
                  {["", "Card No.", "Name", "Type", "Class / Dept", "Status", "Trashed On", "Actions"].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trashRecs.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-slate-300 text-[11px]">Trash is empty</td></tr>
                ) : trashRecs.map(rec => (
                  <tr key={rec.id} className={`border-b border-slate-50 hover:bg-rose-50/30 ${trashSel.includes(rec.id) ? "bg-rose-50/50" : ""}`}>
                    <td className="px-3 py-2">
                      <button onClick={() => toggleTrash(rec.id)} className="text-slate-400 hover:text-rose-500">
                        {trashSel.includes(rec.id) ? <CheckSquare size={12} className="text-rose-500"/> : <Square size={12}/>}
                      </button>
                    </td>
                    <td className="px-3 py-2"><span className="text-[10px] font-mono text-slate-500">{rec.member_code}</span></td>
                    <td className="px-3 py-2">
                      <p className="text-[11px] font-bold text-slate-600">{rec.name}</p>
                      <p className="text-[9px] text-slate-400">{rec.extra_code}</p>
                    </td>
                    <td className="px-3 py-2"><TypeBadge type={rec.member_type}/></td>
                    <td className="px-3 py-2 text-[11px] text-slate-500">{rec.details || "—"}</td>
                    <td className="px-3 py-2"><StatusBadge status={rec.status}/></td>
                    <td className="px-3 py-2 text-[10px] text-slate-400">{fmtDate(rec.deleted_at)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleRestore(rec.id)} className="p-1 rounded hover:bg-emerald-100 text-emerald-600" title="Restore"><RotateCcw size={11}/></button>
                        <button onClick={() => handleForceDelete(rec.id)} className="p-1 rounded hover:bg-rose-100 text-rose-500" title="Delete Forever"><Trash2 size={11}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
