import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, RefreshCw, Plus, Check, X,
  Trash2, CheckSquare, Square, Download, RotateCcw, ArrowLeft,
  Bus, MapPin, Clock, CheckCircle, XCircle,
  Edit2, Upload, AlertCircle, TrendingUp,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import Select from "react-select";

// ─── Types ───────────────────────────────────────────────────────────────────
interface AllocRecord {
  id: number;
  student_id: number;
  route_id: number;
  stop_id: number;
  academic_year_id: number | null;
  pickup_time: string | null;
  drop_time: string | null;
  monthly_fee: string;
  fee_status_id: number | null;
  allocation_status_id: number | null;
  special_notes: string | null;
  is_active: boolean;
  created_at: string;
  deleted_at?: string | null;
  student?: {
    id: number; admission_number: string; roll_number?: string;
    first_name?: string; last_name?: string; section?: string;
    user?: { full_name: string; };
    class?: { m_alias_name?: string; m_name?: string; };
  };
  route?: { id: number; route_name: string; route_code: string; amount?: string; };
  stop?: { id: number; stop_name: string; };
  fee_status?: { m_id: number; m_name: string; m_alias_name?: string; };
  allocation_status?: { m_id: number; m_name: string; m_alias_name?: string; };
}
interface Stats {
  total: number; active: number; pending: number; inactive: number;
  fee_paid: number; fee_overdue: number; total_revenue: number; trashed: number;
}
interface RouteOpt { value: number; label: string; code: string; amount?: string; }
interface StopOpt  { value: number; label: string; routeId: number; }
interface MasterOpt{ value: number; label: string; }

// ─── Config ──────────────────────────────────────────────────────────────────
const ALLOC_STATUS_CFG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  "Active":   { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: <CheckCircle size={9}/> },
  "Pending":  { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   icon: <Clock size={9}/> },
  "Inactive": { color: "text-slate-500",   bg: "bg-slate-100",  border: "border-slate-300",   icon: <XCircle size={9}/> },
};
const FEE_STATUS_CFG: Record<string, { color: string; bg: string; border: string }> = {
  "Paid":    { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  "Pending": { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  "Overdue": { color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200" },
};

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtCurrency = (v: number | string) => {
  const n = Number(v);
  return isNaN(n) ? "₹0" : `₹${n.toLocaleString("en-IN")}`;
};
const selSm = {
  control:   (b: any) => ({ ...b, minHeight: 28, fontSize: 11, borderColor: "#e5e7eb", boxShadow: "none", "&:hover": { borderColor: "#f97316" } }),
  menu:      (b: any) => ({ ...b, fontSize: 11, zIndex: 50 }),
  option:    (b: any, s: any) => ({ ...b, fontSize: 11, padding: "4px 10px", background: s.isSelected ? "#f97316" : s.isFocused ? "#fff7ed" : "white", color: s.isSelected ? "white" : "#1e293b" }),
  singleValue:(b: any) => ({ ...b, color: "#334155", fontSize: 11 }),
  dropdownIndicator: (b: any) => ({ ...b, padding: "0 4px" }),
  valueContainer: (b: any) => ({ ...b, padding: "0 8px" }),
  indicatorSeparator: () => ({ display: "none" }),
  menuPortal: (b: any) => ({ ...b, zIndex: 9999 }),
};

// ─── Badge Components ────────────────────────────────────────────────────────
function AllocStatusBadge({ status }: { status: string }) {
  const cfg = ALLOC_STATUS_CFG[status] ?? ALLOC_STATUS_CFG["Pending"];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.icon} {status}
    </span>
  );
}
function FeeStatusBadge({ status }: { status: string }) {
  const cfg = FEE_STATUS_CFG[status] ?? FEE_STATUS_CFG["Pending"];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {status}
    </span>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, subtext, color, border }: {
  label: string; value: string | number; icon: React.ReactNode; subtext: string; color: string; border: string;
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

// ─── Allocation Modal ─────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean; onClose: () => void; onSaved: () => void;
  record: AllocRecord | null;
  masters: { routes: RouteOpt[]; stops: StopOpt[]; allocStatuses: MasterOpt[]; feeStatuses: MasterOpt[]; };
}
const INIT_FORM = {
  student_id: null as number | null,
  route_id: null as number | null,
  stop_id: null as number | null,
  pickup_time: "",
  drop_time: "",
  monthly_fee: "",
  fee_status_id: null as number | null,
  allocation_status_id: null as number | null,
  special_notes: "",
};

function AllocationModal({ open, onClose, onSaved, record, masters }: ModalProps) {
  const [form, setForm] = useState({ ...INIT_FORM });
  const [students, setStudents] = useState<{ value: number; label: string; sub: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const filteredStops = masters.stops.filter(s => s.routeId === form.route_id);

  useEffect(() => {
    if (!open) return;
    if (record) {
      const allocStatusName = record.allocation_status?.m_alias_name || record.allocation_status?.m_name || "";
      const feeStatusName   = record.fee_status?.m_alias_name || record.fee_status?.m_name || "";
      const allocStatusOpt  = masters.allocStatuses.find(s => s.label === allocStatusName);
      const feeStatusOpt    = masters.feeStatuses.find(s => s.label === feeStatusName);
      setForm({
        student_id: record.student_id,
        route_id: record.route_id,
        stop_id: record.stop_id,
        pickup_time: record.pickup_time ?? "",
        drop_time: record.drop_time ?? "",
        monthly_fee: record.monthly_fee ?? "",
        fee_status_id: feeStatusOpt?.value ?? record.fee_status_id,
        allocation_status_id: allocStatusOpt?.value ?? record.allocation_status_id,
        special_notes: record.special_notes ?? "",
      });
    } else {
      setForm({ ...INIT_FORM });
    }
  }, [open, record]);

  useEffect(() => {
    if (!open) return;
    setLoadingStudents(true);
    api.get("/student-transport-allocations/eligible-students")
      .then(res => {
        if (res.data?.success) {
          setStudents(res.data.data.map((s: any) => ({
            value: s.id,
            label: `${s.full_name} (${s.admission_number})`,
            sub: `${s.class_name} | ${s.section ?? "A"}`,
          })));
        }
      })
      .catch(() => toast.error("Failed to load students"))
      .finally(() => setLoadingStudents(false));
  }, [open]);

  // Auto-fill monthly_fee from route
  useEffect(() => {
    if (!form.route_id) return;
    const route = masters.routes.find(r => r.value === form.route_id);
    if (route?.amount && !record) {
      setForm(f => ({ ...f, monthly_fee: route.amount! }));
    }
  }, [form.route_id]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.route_id || !form.stop_id || !form.fee_status_id || !form.allocation_status_id) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        student_id: form.student_id,
        route_id: form.route_id,
        stop_id: form.stop_id,
        pickup_time: form.pickup_time || null,
        drop_time: form.drop_time || null,
        monthly_fee: Number(form.monthly_fee) || 0,
        fee_status_id: form.fee_status_id,
        allocation_status_id: form.allocation_status_id,
        special_notes: form.special_notes || null,
      };
      if (record) {
        await api.put(`/student-transport-allocations/${record.id}`, payload);
        toast.success("Allocation updated successfully");
      } else {
        await api.post("/student-transport-allocations/", payload);
        toast.success("Student allocated to transport!");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const routeOpts   = masters.routes.map(r => ({ value: r.value, label: `${r.label} (${r.code})` }));
  const stopOpts    = filteredStops.map(s => ({ value: s.value, label: s.label }));
  const studentOpts = students;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <Bus size={14} className="text-white"/>
            </div>
            <div>
              <h2 className="text-[13px] font-extrabold text-white">{record ? "Edit Allocation" : "New Transport Allocation"}</h2>
              <p className="text-[10px] text-orange-100">Assign student to route & stop</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <X size={13} className="text-white"/>
          </button>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
          {/* Student */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1">Student <span className="text-rose-500">*</span></label>
            <Select
              options={studentOpts}
              isLoading={loadingStudents}
              value={studentOpts.find(o => o.value === form.student_id) ?? null}
              onChange={o => set("student_id", o?.value ?? null)}
              placeholder="Search student..."
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

          {/* Route & Stop */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Route <span className="text-rose-500">*</span></label>
              <Select
                options={routeOpts}
                value={routeOpts.find(o => o.value === form.route_id) ?? null}
                onChange={o => { set("route_id", o?.value ?? null); set("stop_id", null); }}
                placeholder="Select route..."
                styles={selSm}
                menuPortalTarget={document.body}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Stop <span className="text-rose-500">*</span></label>
              <Select
                options={stopOpts}
                value={stopOpts.find(o => o.value === form.stop_id) ?? null}
                onChange={o => set("stop_id", o?.value ?? null)}
                placeholder={form.route_id ? "Select stop..." : "Select route first"}
                isDisabled={!form.route_id}
                styles={selSm}
                menuPortalTarget={document.body}
              />
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Pickup Time</label>
              <input type="text" placeholder="e.g. 07:30 AM" value={form.pickup_time}
                onChange={e => set("pickup_time", e.target.value)}
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-orange-400"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Drop Time</label>
              <input type="text" placeholder="e.g. 02:30 PM" value={form.drop_time}
                onChange={e => set("drop_time", e.target.value)}
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-orange-400"/>
            </div>
          </div>

          {/* Fee & Status */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Monthly Fee (₹) <span className="text-rose-500">*</span></label>
              <input type="number" min="0" placeholder="1500" value={form.monthly_fee}
                onChange={e => set("monthly_fee", e.target.value)}
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-orange-400"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Fee Status <span className="text-rose-500">*</span></label>
              <Select
                options={masters.feeStatuses}
                value={masters.feeStatuses.find(o => o.value === form.fee_status_id) ?? null}
                onChange={o => set("fee_status_id", o?.value ?? null)}
                placeholder="Status..."
                styles={selSm}
                menuPortalTarget={document.body}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Alloc. Status <span className="text-rose-500">*</span></label>
              <Select
                options={masters.allocStatuses}
                value={masters.allocStatuses.find(o => o.value === form.allocation_status_id) ?? null}
                onChange={o => set("allocation_status_id", o?.value ?? null)}
                placeholder="Status..."
                styles={selSm}
                menuPortalTarget={document.body}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1">Special Notes</label>
            <textarea rows={2} placeholder="Any special requirements or notes..." value={form.special_notes}
              onChange={e => set("special_notes", e.target.value)}
              className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-orange-400 resize-none"/>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <RefreshCw size={11} className="animate-spin"/> : <Check size={11}/>}
              {record ? "Update" : "Allocate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Row Component ────────────────────────────────────────────────────────────
function AllocRow({ rec, selected, onToggle, onEdit, onDelete }: {
  rec: AllocRecord; selected: boolean;
  onToggle: () => void; onEdit: (r: AllocRecord) => void; onDelete: (id: number) => void;
}) {
  const studentName = (rec.student?.user?.full_name ?? `${rec.student?.first_name ?? ""} ${rec.student?.last_name ?? ""}`.trim()) || "—";
  const className   = rec.student?.class?.m_alias_name ?? rec.student?.class?.m_name ?? "—";
  const allocStatus = rec.allocation_status?.m_alias_name ?? rec.allocation_status?.m_name ?? "—";
  const feeStatus   = rec.fee_status?.m_alias_name ?? rec.fee_status?.m_name ?? "—";

  return (
    <tr className={`border-b border-slate-50 hover:bg-orange-50/30 transition-colors ${selected ? "bg-orange-50/60" : ""}`}>
      <td className="px-3 py-2">
        <button onClick={onToggle} className="text-slate-400 hover:text-orange-500">
          {selected ? <CheckSquare size={13} className="text-orange-500"/> : <Square size={13}/>}
        </button>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0">
            <span className="text-[8px] font-black text-white">{studentName.charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-700 truncate max-w-[110px]">{studentName}</p>
            <p className="text-[9px] text-slate-400">{rec.student?.admission_number ?? "—"}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2">
        <p className="text-[11px] font-semibold text-slate-600">{className}</p>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <Bus size={10} className="text-orange-400 flex-shrink-0"/>
          <div>
            <p className="text-[11px] font-bold text-slate-700">{rec.route?.route_name ?? "—"}</p>
            <p className="text-[9px] text-slate-400">{rec.route?.route_code}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-600">
          <MapPin size={9} className="text-rose-400"/>
          {rec.stop?.stop_name ?? "—"}
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="text-[10px] text-slate-500 space-y-0.5">
          {rec.pickup_time && <div className="flex items-center gap-1"><Clock size={8} className="text-emerald-400"/> {rec.pickup_time}</div>}
          {rec.drop_time && <div className="flex items-center gap-1"><Clock size={8} className="text-rose-400"/> {rec.drop_time}</div>}
          {!rec.pickup_time && !rec.drop_time && "—"}
        </div>
      </td>
      <td className="px-3 py-2">
        <span className="text-[11px] font-bold text-slate-700">{fmtCurrency(rec.monthly_fee)}</span>
      </td>
      <td className="px-3 py-2"><FeeStatusBadge status={feeStatus}/></td>
      <td className="px-3 py-2"><AllocStatusBadge status={allocStatus}/></td>
      <td className="px-3 py-2">
        <p className="text-[10px] text-slate-400">{fmtDate(rec.created_at)}</p>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(rec)} className="p-1 rounded hover:bg-slate-100 text-slate-500" title="Edit"><Edit2 size={11}/></button>
          <button onClick={() => onDelete(rec.id)} className="p-1 rounded hover:bg-rose-100 text-rose-500" title="Trash"><Trash2 size={11}/></button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentTransportAllocation() {
  const [records, setRecords] = useState<AllocRecord[]>([]);
  const [stats, setStats]     = useState<Stats>({ total:0, active:0, pending:0, inactive:0, fee_paid:0, fee_overdue:0, total_revenue:0, trashed:0 });
  const [masters, setMasters] = useState<{
    routes: RouteOpt[]; stops: StopOpt[]; allocStatuses: MasterOpt[]; feeStatuses: MasterOpt[];
  }>({ routes: [], stops: [], allocStatuses: [], feeStatuses: [] });

  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState("");
  const [filterRoute, setFilterRoute] = useState<MasterOpt | null>(null);
  const [filterAllocStatus, setFilterAllocStatus] = useState<MasterOpt | null>(null);
  const [selected, setSelected]   = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState<AllocRecord | null>(null);
  const [showTrash, setShowTrash]   = useState(false);
  const [trashRecs, setTrashRecs]   = useState<AllocRecord[]>([]);
  const [trashSel, setTrashSel]     = useState<number[]>([]);

  const importRef = useRef<HTMLInputElement>(null);

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  const refreshStats = useCallback(() => {
    api.get("/student-transport-allocations/stats").then(res => {
      if (res.data?.success) setStats(res.data.data);
    });
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (filterRoute) params.route_id = filterRoute.value;
      if (filterAllocStatus) params.allocation_status_id = filterAllocStatus.value;
      const res = await api.get("/student-transport-allocations/", { params });
      if (res.data?.data) setRecords(res.data.data);
      setSelected([]);
    } catch { toast.error("Failed to load allocations"); }
    setLoading(false);
  }, [search, filterRoute, filterAllocStatus]);

  const fetchTrash = async () => {
    try {
      const r = await api.get("/student-transport-allocations/", { params: { only_trashed: true } });
      setTrashRecs(r.data.data ?? []);
      setTrashSel([]);
    } catch { toast.error("Failed to load trash"); }
  };

  useEffect(() => {
    api.get("/student-transport-allocations/masters").then(res => {
      if (res.data?.success) {
        const d = res.data.data;
        setMasters({
          routes:       (d.routes ?? []).map((r: any) => ({ value: r.id, label: r.route_name, code: r.route_code, amount: r.amount })),
          stops:        (d.stops ?? []).map((s: any) => ({ value: s.id, label: s.stop_name, routeId: s.route_id })),
          allocStatuses:(d.allocation_statuses ?? []).map((m: any) => ({ value: m.id, label: m.alias || m.name })),
          feeStatuses:  (d.fee_statuses ?? []).map((m: any) => ({ value: m.id, label: m.alias || m.name })),
        });
      }
    });
    refreshStats();
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm("Move this allocation to trash?")) return;
    try { await api.delete(`/student-transport-allocations/${id}`); toast.success("Moved to trash"); fetchRecords(); refreshStats(); }
    catch { toast.error("Delete failed"); }
  };
  const handleRestore = async (id: number) => {
    try { await api.post(`/student-transport-allocations/restore/${id}`); toast.success("Restored"); fetchTrash(); refreshStats(); }
    catch { toast.error("Restore failed"); }
  };
  const handleForceDelete = async (id: number) => {
    if (!confirm("Permanently delete this allocation? This cannot be undone.")) return;
    try { await api.delete(`/student-transport-allocations/${id}/force`); toast.success("Permanently deleted"); fetchTrash(); }
    catch { toast.error("Delete failed"); }
  };
  const handleBulkDelete = async () => {
    if (!selected.length || !confirm(`Move ${selected.length} allocation(s) to trash?`)) return;
    try { await api.post("/student-transport-allocations/bulk-delete", { ids: selected }); toast.success(`${selected.length} moved to trash`); fetchRecords(); refreshStats(); }
    catch { toast.error("Bulk delete failed"); }
  };
  const handleBulkRestore = async () => {
    if (!trashSel.length) return;
    try { await api.post("/student-transport-allocations/bulk-restore", { ids: trashSel }); toast.success("Restored successfully"); fetchTrash(); refreshStats(); }
    catch { toast.error("Bulk restore failed"); }
  };
  const handleBulkForceDelete = async () => {
    if (!trashSel.length || !confirm(`Permanently delete ${trashSel.length} allocation(s)?`)) return;
    try { await api.post("/student-transport-allocations/bulk-delete", { ids: trashSel, force: true }); toast.success("Permanently deleted"); fetchTrash(); }
    catch { toast.error("Bulk delete failed"); }
  };

  const handleExport = async () => {
    try {
      const res = await api.get("/student-transport-allocations/export", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url;
      a.download = `transport_allocations_${new Date().toISOString().split("T")[0]}.csv`; a.click();
      toast.success("Export ready");
    } catch { toast.error("Export failed"); }
  };
  const downloadSample = async () => {
    try {
      const res = await api.get("/student-transport-allocations/sample", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url; a.download = "transport_allocation_sample.csv"; a.click();
      toast.success("Sample template downloaded");
    } catch { toast.error("Download failed"); }
  };
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    const tid = toast.loading("Importing CSV...");
    try {
      const res = await api.post("/student-transport-allocations/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.dismiss(tid);
      if (res.data?.success) { toast.success(res.data.message || "Import completed!"); fetchRecords(); refreshStats(); }
      else toast.error(res.data?.message ?? "Import failed");
    } catch (err: any) { toast.dismiss(tid); toast.error(err.response?.data?.message ?? "Import failed"); }
    if (importRef.current) importRef.current.value = "";
  };

  const toggleSelect   = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll      = () => setSelected(selected.length === records.length ? [] : records.map(r => r.id));
  const toggleTrash    = (id: number) => setTrashSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAllTrash = () => setTrashSel(trashSel.length === trashRecs.length ? [] : trashRecs.map(r => r.id));

  const routeFilterOpts = masters.routes.map(r => ({ value: r.value, label: `${r.label} (${r.code})` }));

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <AllocationModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditRecord(null); }}
        onSaved={() => { fetchRecords(); refreshStats(); }}
        record={editRecord}
        masters={masters}
      />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {showTrash && <button onClick={() => setShowTrash(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft size={14}/></button>}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <Bus size={16} className="text-white"/>
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-800">{showTrash ? "Transport — Trash Bin" : "Student Transport Allocation"}</h1>
            <p className="text-[10px] text-slate-400 font-medium">{showTrash ? "Restore or permanently delete trashed allocations" : "Manage route & stop assignments for students"}</p>
          </div>
        </div>
        {!showTrash && (
          <div className="flex items-center gap-2">
            <button onClick={downloadSample} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold">Sample</button>
            <button onClick={() => importRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold"><Upload size={12}/> Import</button>
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 text-[11px] font-semibold"><Download size={12}/> Export</button>
            <button onClick={() => { setShowTrash(true); fetchTrash(); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold">
              <Trash2 size={12}/> Trash {stats.trashed > 0 && <span className="bg-rose-500 text-white text-[9px] rounded-full px-1.5 py-0.5 font-bold ml-1">{stats.trashed}</span>}
            </button>
            <button onClick={() => { setEditRecord(null); setShowModal(true); }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold shadow-sm"><Plus size={12}/> Allocate</button>
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
          <StatCard label="Total Allocated" value={stats.total} icon={<Bus size={12} className="text-orange-600"/>} subtext="All transport" color="bg-orange-50" border="border-orange-400"/>
          <StatCard label="Active" value={stats.active} icon={<CheckCircle size={12} className="text-emerald-600"/>} subtext="Currently active" color="bg-emerald-50" border="border-emerald-400"/>
          <StatCard label="Pending" value={stats.pending} icon={<Clock size={12} className="text-amber-600"/>} subtext="Awaiting activation" color="bg-amber-50" border="border-amber-400"/>
          <StatCard label="Inactive" value={stats.inactive} icon={<XCircle size={12} className="text-slate-500"/>} subtext="Suspended" color="bg-slate-100" border="border-slate-400"/>
          <StatCard label="Fee Paid" value={stats.fee_paid} icon={<CheckCircle size={12} className="text-teal-600"/>} subtext="Payments cleared" color="bg-teal-50" border="border-teal-400"/>
          <StatCard label="Fee Overdue" value={stats.fee_overdue} icon={<AlertCircle size={12} className="text-rose-600"/>} subtext="Payment pending" color="bg-rose-50" border="border-rose-400"/>
          <StatCard label="Monthly Revenue" value={fmtCurrency(stats.total_revenue)} icon={<TrendingUp size={12} className="text-indigo-600"/>} subtext="Total collection" color="bg-indigo-50" border="border-indigo-400"/>
          <StatCard label="In Trash" value={stats.trashed} icon={<Trash2 size={12} className="text-slate-500"/>} subtext="Soft deleted" color="bg-slate-100" border="border-slate-300"/>
        </div>
      )}

      {/* ── Filter Bar ──────────────────────────────────────────────────────── */}
      {!showTrash && (
        <div className="flex-shrink-0 px-4 pb-2 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search student, route, stop..."
              className="w-full pl-7 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg outline-none focus:border-orange-400 bg-white"
            />
          </div>
          <div className="w-44">
            <Select options={routeFilterOpts} value={filterRoute} onChange={o => setFilterRoute(o)}
              placeholder="All Routes" isClearable styles={selSm}/>
          </div>
          <div className="w-36">
            <Select options={masters.allocStatuses} value={filterAllocStatus} onChange={o => setFilterAllocStatus(o)}
              placeholder="All Status" isClearable styles={selSm}/>
          </div>
          {selected.length > 0 && (
            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-semibold hover:bg-rose-100">
              <Trash2 size={11}/> Delete ({selected.length})
            </button>
          )}
          <button onClick={() => fetchRecords()} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""}/>
          </button>
        </div>
      )}

      {/* ── Main Table ──────────────────────────────────────────────────────── */}
      {!showTrash && (
        <div className="flex-1 overflow-auto px-4 pb-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <button onClick={toggleAll} className="text-slate-400 hover:text-orange-500">
                      {selected.length === records.length && records.length > 0
                        ? <CheckSquare size={13} className="text-orange-500"/>
                        : <Square size={13}/>}
                    </button>
                  </th>
                  {["Student", "Class", "Route", "Stop", "Timings", "Fee/Month", "Fee Status", "Alloc. Status", "Date", "Actions"].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} className="text-center py-12 text-slate-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2"/>
                    <p className="text-[11px]">Loading allocations…</p>
                  </td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={11} className="text-center py-12">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-3">
                      <Bus size={22} className="text-orange-300"/>
                    </div>
                    <p className="text-[12px] font-bold text-slate-400">No allocations found</p>
                    <p className="text-[10px] text-slate-300 mt-1">Click "Allocate" to assign a student to a transport route</p>
                  </td></tr>
                ) : (
                  records.map(rec => (
                    <AllocRow
                      key={rec.id}
                      rec={rec}
                      selected={selected.includes(rec.id)}
                      onToggle={() => toggleSelect(rec.id)}
                      onEdit={r => { setEditRecord(r); setShowModal(true); }}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-medium">
            Showing {records.length} allocation{records.length !== 1 ? "s" : ""}{selected.length > 0 && ` · ${selected.length} selected`}
          </div>
        </div>
      )}

      {/* ── Trash Bin ───────────────────────────────────────────────────────── */}
      {showTrash && (
        <div className="flex-1 overflow-auto px-4 pb-4">
          <div className="bg-white rounded-xl border border-rose-100 shadow-sm overflow-hidden">
            <div className="bg-rose-50 px-4 py-2 border-b border-rose-100 flex items-center justify-between">
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                <Trash2 size={11}/> {trashRecs.length} Trashed Allocation{trashRecs.length !== 1 ? "s" : ""}
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
                  {["", "Student", "Route", "Stop", "Fee/Month", "Alloc. Status", "Trashed On", "Actions"].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trashRecs.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-slate-300 text-[11px]">Trash is empty</td></tr>
                ) : trashRecs.map(rec => {
                  const studentName = (rec.student?.user?.full_name ?? `${rec.student?.first_name ?? ""} ${rec.student?.last_name ?? ""}`.trim()) || "—";
                  const allocStatus = rec.allocation_status?.m_alias_name ?? rec.allocation_status?.m_name ?? "—";
                  return (
                    <tr key={rec.id} className={`border-b border-slate-50 hover:bg-rose-50/30 ${trashSel.includes(rec.id) ? "bg-rose-50/50" : ""}`}>
                      <td className="px-3 py-2">
                        <button onClick={() => toggleTrash(rec.id)} className="text-slate-400 hover:text-rose-500">
                          {trashSel.includes(rec.id) ? <CheckSquare size={12} className="text-rose-500"/> : <Square size={12}/>}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-[11px] font-bold text-slate-600">{studentName}</p>
                        <p className="text-[9px] text-slate-400">{rec.student?.admission_number}</p>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-500">{rec.route?.route_name ?? "—"}</td>
                      <td className="px-3 py-2 text-[11px] text-slate-500">{rec.stop?.stop_name ?? "—"}</td>
                      <td className="px-3 py-2 text-[11px] font-bold text-slate-600">{fmtCurrency(rec.monthly_fee)}</td>
                      <td className="px-3 py-2"><AllocStatusBadge status={allocStatus}/></td>
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
