import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, ChevronLeft, ChevronRight, RefreshCw, Plus, Check, X,
  Trash2, CheckSquare, Square, Upload, Download, RotateCcw, ArrowLeft,
  Award, FileText, Edit2, Clock, CheckCircle, XCircle,
  Calendar, Users, AlertCircle, Truck,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import Select from "react-select";

interface CertRecord {
  id: number; student_id: number; student_name: string; admission_number: string;
  roll_number?: string; class_name: string; section: string; photo_url: string | null;
  certificate_no: string; certificate_type: number; certificate_type_name?: string;
  issue_date: string; valid_upto: string | null; issued_for: string;
  issued_by: string; designation: string | null; status: number; status_name?: string;
  delivery_mode: number | null; delivery_mode_name?: string | null;
  delivered_at: string | null; parent_notified: boolean; parent_notified_at: string | null;
  remarks: string | null; created_at: string; deleted_at?: string | null;
}
interface Stats {
  total: number; this_month: number; issued: number; delivered: number;
  draft: number; revoked: number; pending_delivery: number; parent_notified: number;
}
interface MasterOption { value: number; label: string; }
interface ClassOption  { value: number; label: string; }
interface StudentOpt   { value: number; label: string; sub: string; }

const STATUS_CFG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  "Draft":     { color: "text-slate-600",   bg: "bg-slate-100",  border: "border-slate-300",   icon: <FileText size={10}/> },
  "Issued":    { color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    icon: <CheckCircle size={10}/> },
  "Delivered": { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: <Truck size={10}/> },
  "Revoked":   { color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200",    icon: <XCircle size={10}/> },
};
const fmtDate = (d: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const selSm = {
  control:   (b: any) => ({ ...b, minHeight: 28, fontSize: 11, borderColor: "#e5e7eb", boxShadow: "none", "&:hover": { borderColor: "#3b82f6" } }),
  menu:      (b: any) => ({ ...b, fontSize: 11, zIndex: 50 }),
  option:    (b: any, s: any) => ({ ...b, fontSize: 11, padding: "4px 10px", background: s.isSelected ? "#2563eb" : s.isFocused ? "#dbeafe" : "white", color: s.isSelected ? "white" : "#1e293b" }),
  singleValue:(b: any) => ({ ...b, color: "#334155", fontSize: 11 }),
  dropdownIndicator: (b: any) => ({ ...b, padding: "0 4px" }),
  valueContainer: (b: any) => ({ ...b, padding: "0 8px" }),
  indicatorSeparator: () => ({ display: "none" }),
  menuPortal: (b: any) => ({ ...b, zIndex: 9999 }),
};
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG["Draft"];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.icon} {status}
    </span>
  );
}
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

interface ModalProps {
  open: boolean; onClose: () => void; onSaved: () => void; record: CertRecord | null;
  masters: { cert_types: MasterOption[]; cert_statuses: MasterOption[]; delivery_modes: MasterOption[] };
  classes: ClassOption[];
}
const INIT_FORM = {
  student_id: null as number | null, class_id: null as number | null,
  certificate_type: "" as any, issue_date: "", valid_upto: "",
  issued_for: "", issued_by: "", designation: "",
  status: "" as any, delivery_mode: "" as any,
  parent_notified: false, remarks: "",
};

function CertModal({ open, onClose, onSaved, record, masters, classes }: ModalProps) {
  const [form, setForm] = useState({ ...INIT_FORM });
  const [students, setStudents] = useState<StudentOpt[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (record) {
      setForm({
        student_id: record.student_id, class_id: null,
        certificate_type: record.certificate_type,
        issue_date: record.issue_date?.split("T")[0] ?? "",
        valid_upto: record.valid_upto?.split("T")[0] ?? "",
        issued_for: record.issued_for, issued_by: record.issued_by,
        designation: record.designation ?? "", status: record.status,
        delivery_mode: record.delivery_mode ?? "",
        parent_notified: record.parent_notified, remarks: record.remarks ?? "",
      });
    } else {
      setForm({ ...INIT_FORM, status: masters.cert_statuses.find(s => s.label === "Draft")?.value ?? "" });
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
    if (!form.certificate_type)      { toast.error("Certificate type is required"); return; }
    if (!form.issue_date)            { toast.error("Issue date is required"); return; }
    if (!form.issued_for.trim())     { toast.error("Issued For is required"); return; }
    if (!form.issued_by.trim())      { toast.error("Issued By is required"); return; }
    if (!form.status)                { toast.error("Status is required"); return; }
    setSaving(true);
    try {
      const payload = {
        student_id: form.student_id, certificate_type: form.certificate_type,
        issue_date: form.issue_date, valid_upto: form.valid_upto || null,
        issued_for: form.issued_for, issued_by: form.issued_by,
        designation: form.designation || null, status: form.status,
        delivery_mode: form.delivery_mode || null,
        parent_notified: form.parent_notified, remarks: form.remarks || null,
      };
      if (record) {
        await api.put(`/student-certificates/${record.id}`, payload);
        toast.success("Certificate updated");
      } else {
        await api.post("/student-certificates/", payload);
        toast.success("Certificate issued");
      }
      onSaved(); onClose();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? "Error saving"); }
    setSaving(false);
  };

  if (!open) return null;
  const typeOpts = masters.cert_types.map(o => ({ value: o.value, label: o.label }));
  const statOpts = masters.cert_statuses.map(o => ({ value: o.value, label: o.label }));
  const delOpts  = masters.delivery_modes.map(o => ({ value: o.value, label: o.label }));
  const clsOpts  = classes.map(c => ({ value: c.value, label: c.label }));
  const stuOpts  = students.map(s => ({ value: s.value, label: `${s.label} (${s.sub})` }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] transform lg:translate-x-16">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <Award size={16} className="text-white"/>
            <div>
              <p className="text-white text-sm font-bold">{record ? "Edit Certificate" : "Issue New Certificate"}</p>
              <p className="text-blue-100 text-[10px]">Manage student academic & achievement certificates</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={16}/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 text-xs">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-3.5">
              {!record ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Class</label>
                    <Select options={clsOpts} placeholder="Select class…" styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body}
                      onChange={o => { setField("class_id", o?.value ?? null); loadStudents(o?.value ?? null); setField("student_id", null); }} isClearable/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Student *</label>
                    <Select options={stuOpts} isLoading={loadingStudents} placeholder="Select student…" styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body}
                      onChange={o => setField("student_id", o?.value ?? null)} value={stuOpts.find(o => o.value === form.student_id) ?? null}/>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Student</label>
                  <input type="text" readOnly value={record.student_name} className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 focus:outline-none"/>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Certificate Type *</label>
                <Select options={typeOpts} placeholder="Select type…" styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body}
                  value={typeOpts.find(o => o.value === form.certificate_type) ?? null} onChange={o => setField("certificate_type", o?.value ?? "")}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Issue Date *</label>
                  <input type="date" value={form.issue_date} onChange={e => setField("issue_date", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Valid Upto</label>
                  <input type="date" value={form.valid_upto} onChange={e => setField("valid_upto", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Issued For *</label>
                <textarea value={form.issued_for} onChange={e => setField("issued_for", e.target.value)} rows={3}
                  placeholder="Purpose / reason for issuing this certificate…"
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"/>
              </div>
            </div>
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Issued By *</label>
                  <input value={form.issued_by} onChange={e => setField("issued_by", e.target.value)} placeholder="Principal / HOD name"
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Designation</label>
                  <input value={form.designation} onChange={e => setField("designation", e.target.value)} placeholder="e.g. Principal"
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Status *</label>
                  <Select options={statOpts} placeholder="Status…" styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body}
                    value={statOpts.find(o => o.value === form.status) ?? null} onChange={o => setField("status", o?.value ?? "")}/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Delivery Mode</label>
                  <Select options={delOpts} placeholder="Delivery…" isClearable styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body}
                    value={delOpts.find(o => o.value === form.delivery_mode) ?? null} onChange={o => setField("delivery_mode", o?.value ?? "")}/>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Remarks</label>
                <textarea value={form.remarks} onChange={e => setField("remarks", e.target.value)} rows={3}
                  placeholder="Additional notes…"
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"/>
              </div>
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.parent_notified} onChange={e => setField("parent_notified", e.target.checked)} className="w-3.5 h-3.5 accent-blue-600"/>
                  <span className="text-[11px] font-semibold text-slate-700">Parent / Guardian Notified</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button onClick={submit} disabled={saving} className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60">
            {saving ? <RefreshCw size={12} className="animate-spin"/> : <Check size={12}/>}
            {saving ? "Saving…" : (record ? "Update" : "Issue Certificate")}
          </button>
        </div>
      </div>
    </div>
  );
}

function CertRow({ rec, serial, selected, onSelect, onEdit, onDelete }: {
  rec: CertRecord; serial: number; selected: boolean;
  onSelect: (id: number) => void; onEdit: (r: CertRecord) => void; onDelete: (id: number) => void;
}) {
  return (
    <tr className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${selected ? "bg-blue-50/50" : ""}`}>
      <td className="px-2 py-2 text-center">
        <button onClick={() => onSelect(rec.id)} className="text-slate-400 hover:text-blue-600">
          {selected ? <CheckSquare size={13} className="text-blue-600"/> : <Square size={13}/>}
        </button>
      </td>
      <td className="px-2 py-2 text-center text-[10px] font-bold text-slate-400">{serial}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold">
            {rec.photo_url ? <img src={rec.photo_url} className="w-full h-full rounded-full object-cover" alt=""/> : rec.student_name[0]}
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-800 leading-tight">{rec.student_name}</p>
            <p className="text-[9px] text-slate-400 font-medium">{rec.admission_number} · {rec.class_name}{rec.section ? `-${rec.section}` : ""}</p>
          </div>
        </div>
      </td>
      <td className="px-2 py-2">
        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">{rec.certificate_no}</span>
      </td>
      <td className="px-2 py-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
          <Award size={9}/> {rec.certificate_type_name ?? "—"}
        </span>
      </td>
      <td className="px-2 py-2 max-w-[160px]">
        <p className="text-[10px] text-slate-600 line-clamp-2 leading-snug">{rec.issued_for}</p>
      </td>
      <td className="px-2 py-2 text-center">
        <span className="text-[10px] text-slate-600 font-medium">{fmtDate(rec.issue_date)}</span>
      </td>
      <td className="px-2 py-2 text-center">
        <span className="text-[10px] text-slate-500">{fmtDate(rec.valid_upto)}</span>
      </td>
      <td className="px-2 py-2 text-center"><StatusBadge status={rec.status_name ?? "Draft"}/></td>
      <td className="px-2 py-2 text-center">
        {rec.delivery_mode_name
          ? <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">{rec.delivery_mode_name}</span>
          : <span className="text-[10px] text-slate-300">—</span>}
      </td>
      <td className="px-2 py-2 text-center">
        <div className="flex items-center justify-center gap-1.5">
          {rec.parent_notified && <Users size={11} className="text-blue-400" title="Parent Notified"/>}
          {rec.delivered_at    && <CheckCircle size={11} className="text-emerald-500" title="Delivered"/>}
        </div>
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => onEdit(rec)} className="p-1 rounded hover:bg-blue-100 text-blue-600" title="Edit"><Edit2 size={12}/></button>
          <button onClick={() => onDelete(rec.id)} className="p-1 rounded hover:bg-rose-100 text-rose-500" title="Trash"><Trash2 size={12}/></button>
        </div>
      </td>
    </tr>
  );
}

export default function StudentCertificateManagement() {
  const [records, setRecords]         = useState<CertRecord[]>([]);
  const [stats, setStats]             = useState<Stats>({ total:0, this_month:0, issued:0, delivered:0, draft:0, revoked:0, pending_delivery:0, parent_notified:0 });
  const [masters, setMasters]         = useState({ cert_types: [] as MasterOption[], cert_statuses: [] as MasterOption[], delivery_modes: [] as MasterOption[] });
  const [classes, setClasses]         = useState<ClassOption[]>([]);
  const [loading, setLoading]         = useState(false);
  const [page, setPage]               = useState(1);
  const [lastPage, setLastPage]       = useState(1);
  const [total, setTotal]             = useState(0);
  const [search, setSearch]           = useState("");
  const [filterClass, setFilterClass] = useState<ClassOption | null>(null);
  const [filterType, setFilterType]   = useState<MasterOption | null>(null);
  const [filterStatus, setFilterStatus]   = useState<MasterOption | null>(null);
  const [filterDelivery, setFilterDelivery] = useState<MasterOption | null>(null);
  const [fromDate, setFromDate]       = useState("");
  const [toDate, setToDate]           = useState("");
  const [selected, setSelected]       = useState<number[]>([]);
  const [showModal, setShowModal]     = useState(false);
  const [editRecord, setEditRecord]   = useState<CertRecord | null>(null);
  const [showTrash, setShowTrash]     = useState(false);
  const [trashRecords, setTrashRecords] = useState<CertRecord[]>([]);
  const [selectedTrashIds, setSelectedTrashIds] = useState<number[]>([]);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get("/student-certificates/masters").then(res => { if (res.data.success) setMasters(res.data.data); });
    api.get("/student-certificates/stats").then(res => { if (res.data.success) setStats(res.data.data); });
    api.get("/master/classes").then(res => {
      if (res.data?.success && res.data.data) {
        setClasses(Object.entries(res.data.data).map(([id, name]) => ({ value: Number(id), label: name as string })));
      }
    }).catch(() => {});
  }, []);

  const fetchRecords = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params: any = { page: pg, per_page: 15 };
      if (search)         params.search           = search;
      if (filterClass)    params.class_id         = filterClass.value;
      if (filterType)     params.certificate_type = filterType.value;
      if (filterStatus)   params.status           = filterStatus.value;
      if (filterDelivery) params.delivery_mode    = filterDelivery.value;
      if (fromDate)       params.from_date        = fromDate;
      if (toDate)         params.to_date          = toDate;
      const res = await api.get("/student-certificates/", { params });
      if (res.data?.data) {
        setRecords(res.data.data);
        setPage(res.data.meta?.current_page ?? 1);
        setLastPage(res.data.meta?.last_page ?? 1);
        setTotal(res.data.meta?.total ?? 0);
      }
      setSelected([]);
    } catch { toast.error("Failed to load certificates"); }
    setLoading(false);
  }, [search, filterClass, filterType, filterStatus, filterDelivery, fromDate, toDate]);

  useEffect(() => { fetchRecords(1); }, [search, filterClass, filterType, filterStatus, filterDelivery, fromDate, toDate]);
  const refreshStats = () => { api.get("/student-certificates/stats").then(res => { if (res.data.success) setStats(res.data.data); }); };
  const fetchTrash   = async () => { try { const res = await api.get("/student-certificates/trashed"); setTrashRecords(res.data.data ?? []); setSelectedTrashIds([]); } catch { toast.error("Failed to load trash"); } };
  const openTrash    = () => { setShowTrash(true); fetchTrash(); };
  const handleDelete = async (id: number) => {
    if (!confirm("Move this certificate to trash?")) return;
    try { await api.delete(`/student-certificates/${id}`); toast.success("Moved to trash"); fetchRecords(page); refreshStats(); } catch { toast.error("Error"); }
  };
  const handleBulkDelete = async () => {
    if (!selected.length) return;
    if (!confirm(`Move ${selected.length} certificate(s) to trash?`)) return;
    try { await api.post("/student-certificates/bulk-delete", { ids: selected }); toast.success(`${selected.length} moved to trash`); fetchRecords(page); refreshStats(); } catch { toast.error("Error"); }
  };
  const handleRestore = async (id: number) => {
    try { await api.post(`/student-certificates/restore/${id}`); toast.success("Restored"); fetchTrash(); refreshStats(); } catch { toast.error("Error"); }
  };
  const handleBulkRestore = async () => {
    if (!selectedTrashIds.length) return;
    try { await api.post("/student-certificates/bulk-restore", { ids: selectedTrashIds }); toast.success("Restored"); fetchTrash(); refreshStats(); } catch { toast.error("Error"); }
  };
  const handleBulkForceDelete = async () => {
    if (!selectedTrashIds.length) return;
    if (!confirm(`Permanently delete ${selectedTrashIds.length} certificate(s)? Cannot be undone.`)) return;
    try { await api.post("/student-certificates/bulk-force-delete", { ids: selectedTrashIds }); toast.success("Permanently deleted"); fetchTrash(); } catch { toast.error("Error"); }
  };
  const handleExport = async () => {
    try { const res = await api.get("/student-certificates/export", { responseType: "blob" }); const url = URL.createObjectURL(new Blob([res.data])); const a = document.createElement("a"); a.href = url; a.download = `student_certificates_${new Date().toISOString().split("T")[0]}.csv`; a.click(); toast.success("Export ready"); } catch { toast.error("Export failed"); }
  };
  const handleSample = async () => {
    try { const res = await api.get("/student-certificates/sample", { responseType: "blob" }); const url = URL.createObjectURL(new Blob([res.data])); const a = document.createElement("a"); a.href = url; a.download = "student_certificates_sample.csv"; a.click(); } catch { toast.error("Failed"); }
  };
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    try { const res = await api.post("/student-certificates/import", fd, { headers: { "Content-Type": "multipart/form-data" } }); if (res.data.success) { toast.success(res.data.message); fetchRecords(1); refreshStats(); } else { toast.error(res.data.message); } } catch { toast.error("Import failed"); }
    e.target.value = "";
  };
  const toggleSelect   = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll      = () => setSelected(selected.length === records.length ? [] : records.map(r => r.id));
  const toggleTrash    = (id: number) => setSelectedTrashIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAllTrash = () => setSelectedTrashIds(selectedTrashIds.length === trashRecords.length ? [] : trashRecords.map(r => r.id));
  const typeOpts    = masters.cert_types.map(o => ({ value: o.value, label: o.label }));
  const statOpts    = masters.cert_statuses.map(o => ({ value: o.value, label: o.label }));
  const delOpts     = masters.delivery_modes.map(o => ({ value: o.value, label: o.label }));
  const clsOpts     = classes.map(c => ({ value: c.value, label: c.label }));

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <CertModal open={showModal} onClose={() => { setShowModal(false); setEditRecord(null); }}
        onSaved={() => { fetchRecords(page); refreshStats(); }} record={editRecord} masters={masters} classes={classes}/>

      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {showTrash && (<button onClick={() => setShowTrash(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft size={14}/></button>)}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"><Award size={16} className="text-white"/></div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-800">{showTrash ? "Certificates — Trash Bin" : "Student Certificate Management"}</h1>
            <p className="text-[10px] text-slate-400 font-medium">{showTrash ? "Restore or permanently delete trashed certificates" : "Issue, track & manage student academic and achievement certificates"}</p>
          </div>
        </div>
        {!showTrash && (
          <div className="flex items-center gap-2">
            <button onClick={handleSample} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold"><Download size={12}/> Sample</button>
            <button onClick={() => importRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold"><Upload size={12}/> Import</button>
            <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImport}/>
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-semibold"><Download size={12}/> Export</button>
            <button onClick={openTrash} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold">
              <Trash2 size={12}/> Trash {trashRecords.length > 0 && <span className="bg-rose-500 text-white text-[9px] rounded-full px-1.5 py-0.5 font-bold">{trashRecords.length}</span>}
            </button>
            <button onClick={() => { setEditRecord(null); setShowModal(true); }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-sm"><Plus size={12}/> Issue Certificate</button>
          </div>
        )}
      </div>

      {!showTrash && (
        <div className="flex-shrink-0 px-4 py-2 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-1.5">
            <StatCard label="Total"            value={stats.total}            icon={<FileText size={11} className="text-slate-600"/>}     subtext="All certificates"       color="bg-slate-100"  border="border-slate-400"/>
            <StatCard label="This Month"       value={stats.this_month}       icon={<Calendar size={11} className="text-blue-600"/>}       subtext="Issued this month"      color="bg-blue-50"    border="border-blue-400"/>
            <StatCard label="Issued"           value={stats.issued}           icon={<CheckCircle size={11} className="text-indigo-600"/>}  subtext="Certificates issued"    color="bg-indigo-50"  border="border-indigo-400"/>
            <StatCard label="Delivered"        value={stats.delivered}        icon={<Truck size={11} className="text-emerald-600"/>}       subtext="Successfully delivered" color="bg-emerald-50" border="border-emerald-400"/>
            <StatCard label="Draft"            value={stats.draft}            icon={<AlertCircle size={11} className="text-amber-600"/>}  subtext="Pending review"          color="bg-amber-50"   border="border-amber-400"/>
            <StatCard label="Revoked"          value={stats.revoked}          icon={<XCircle size={11} className="text-rose-600"/>}       subtext="Revoked certificates"   color="bg-rose-50"    border="border-rose-400"/>
            <StatCard label="Pending Delivery" value={stats.pending_delivery} icon={<Clock size={11} className="text-orange-600"/>}       subtext="Not yet delivered"      color="bg-orange-50"  border="border-orange-400"/>
            <StatCard label="Parent Notified"  value={stats.parent_notified}  icon={<Users size={11} className="text-purple-600"/>}       subtext="Parents informed"       color="bg-purple-50"  border="border-purple-400"/>
          </div>
        </div>
      )}

      {showTrash ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-shrink-0 px-4 py-2 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
            <p className="text-[11px] font-extrabold text-slate-700">Trash: <span className="text-rose-600">{trashRecords.length}</span> certificate(s)</p>
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
                    <th className="px-2 py-2 text-center w-8"><button onClick={toggleAllTrash} className="text-slate-400">{selectedTrashIds.length === trashRecords.length ? <CheckSquare size={13} className="text-rose-600"/> : <Square size={13}/>}</button></th>
                    <th className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Student</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Cert No</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Type</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Status</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Deleted</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trashRecords.map(r => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-rose-50/30">
                      <td className="px-2 py-2 text-center"><button onClick={() => toggleTrash(r.id)} className="text-slate-400 hover:text-rose-600">{selectedTrashIds.includes(r.id) ? <CheckSquare size={13} className="text-rose-600"/> : <Square size={13}/>}</button></td>
                      <td className="px-3 py-2"><p className="text-[11px] font-bold text-slate-700">{r.student_name}</p><p className="text-[9px] text-slate-400">{r.admission_number} · {r.class_name}{r.section ? `-${r.section}` : ""}</p></td>
                      <td className="px-2 py-2"><span className="font-mono text-[10px] text-blue-700">{r.certificate_no}</span></td>
                      <td className="px-2 py-2"><span className="text-[10px] text-slate-600">{r.certificate_type_name ?? "—"}</span></td>
                      <td className="px-2 py-2"><StatusBadge status={r.status_name ?? "Draft"}/></td>
                      <td className="px-2 py-2"><span className="text-[10px] text-slate-500">{fmtDate(r.deleted_at ?? null)}</span></td>
                      <td className="px-2 py-2"><div className="flex items-center gap-1"><button onClick={() => handleRestore(r.id)} className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold"><RotateCcw size={10}/> Restore</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-shrink-0 px-4 py-2 bg-white border-b border-slate-100 flex flex-row flex-nowrap overflow-x-auto items-center gap-1.5">
            <div className="relative flex-shrink-0">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search student, cert no…" className="pl-7 pr-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs w-40 focus:outline-none focus:ring-1 focus:ring-blue-500"/>
            </div>
            <div className="w-28 flex-shrink-0"><Select options={clsOpts} placeholder="Class…" isClearable styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body} value={filterClass} onChange={o => { setFilterClass(o as ClassOption | null); setPage(1); }}/></div>
            <div className="w-36 flex-shrink-0"><Select options={typeOpts} placeholder="Type…" isClearable styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body} value={filterType} onChange={o => { setFilterType(o as MasterOption | null); setPage(1); }}/></div>
            <div className="w-28 flex-shrink-0"><Select options={statOpts} placeholder="Status…" isClearable styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body} value={filterStatus} onChange={o => { setFilterStatus(o as MasterOption | null); setPage(1); }}/></div>
            <div className="w-28 flex-shrink-0"><Select options={delOpts} placeholder="Delivery…" isClearable styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body} value={filterDelivery} onChange={o => { setFilterDelivery(o as MasterOption | null); setPage(1); }}/></div>
            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 w-28 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 flex-shrink-0"/>
            <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 w-28 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 flex-shrink-0"/>
            <button onClick={() => fetchRecords(page)} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex-shrink-0"><RefreshCw size={12}/></button>
            {selected.length > 0 && (
              <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-bold hover:bg-rose-100 flex-shrink-0 ml-auto"><Trash2 size={11}/> Trash {selected.length}</button>
            )}
          </div>
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full text-slate-400 gap-2"><RefreshCw size={16} className="animate-spin"/> Loading…</div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                <Award size={40} className="opacity-20"/>
                <p className="text-sm font-semibold">No certificates found</p>
                <button onClick={() => { setEditRecord(null); setShowModal(true); }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"><Plus size={12}/> Issue First Certificate</button>
              </div>
            ) : (
              <table className="w-full min-w-[1000px] text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="px-2 py-2 text-center w-8"><button onClick={toggleAll} className="text-slate-400">{selected.length === records.length && records.length > 0 ? <CheckSquare size={13} className="text-blue-600"/> : <Square size={13}/>}</button></th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase w-8">#</th>
                    <th className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Student</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Cert No</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Type</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Issued For</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Issue Date</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Valid Upto</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Status</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Delivery</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Flags</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <CertRow key={r.id} rec={r} serial={(page - 1) * 15 + i + 1}
                      selected={selected.includes(r.id)} onSelect={toggleSelect}
                      onEdit={rec => { setEditRecord(rec); setShowModal(true); }} onDelete={handleDelete}/>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {!loading && records.length > 0 && (
            <div className="flex-shrink-0 border-t border-slate-100 bg-white px-4 py-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Showing {(page-1)*15+1}–{Math.min(page*15, total)} of <span className="font-bold">{total}</span> certificates</span>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => { setPage(page-1); fetchRecords(page-1); }} className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 text-slate-500"><ChevronLeft size={13}/></button>
                {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => { const pg = Math.max(1, page-2)+i; if (pg > lastPage) return null; return (<button key={pg} onClick={() => { setPage(pg); fetchRecords(pg); }} className={`px-2 py-0.5 rounded text-[11px] font-bold ${pg === page ? "bg-blue-600 text-white" : "hover:bg-slate-100 text-slate-600"}`}>{pg}</button>); })}
                <button disabled={page >= lastPage} onClick={() => { setPage(page+1); fetchRecords(page+1); }} className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 text-slate-500"><ChevronRight size={13}/></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
