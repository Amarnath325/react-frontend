import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, ChevronLeft, ChevronRight, RefreshCw, Plus, Check, X,
  Trash2, CheckSquare, Square, Download, RotateCcw, ArrowLeft,
  MessageCircle, Send, Clock, CheckCircle, XCircle, AlertTriangle,
  Calendar, Users, Zap, BookOpen, Mail, Smartphone, Bell,
  Edit2, Eye, Pin, User, Radio, Upload,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import Select from "react-select";

// ─── Types ───────────────────────────────────────────────────────────────────
interface CommRecord {
  id: number; comm_no: string; title: string; body: string;
  category: number; category_name?: string;
  channel: number; channel_name?: string;
  priority: number; priority_name?: string;
  status: number; status_name?: string;
  sender_name?: string;
  scheduled_at: string | null; sent_at: string | null; expires_at: string | null;
  total_recipients: number; delivered_count: number; read_count: number; failed_count: number;
  is_pinned: boolean; created_at: string; deleted_at?: string | null;
}
interface Recipient {
  id: number; student_id: number; student_name: string;
  admission_number: string; class_name: string; section: string; photo_url: string | null;
  delivery_status: string; is_read: boolean; delivered_at: string | null; read_at: string | null;
}
interface Stats {
  total: number; sent_today: number; draft: number; scheduled: number;
  delivered: number; urgent: number; read_rate: number; total_recipients: number;
}
interface MasterOption { value: number; label: string; }
interface ClassOption  { value: number; label: string; }
interface StudentOpt   { value: number; label: string; sub: string; }

// ─── Config ───────────────────────────────────────────────────────────────────
let STATUS_CFG: Record<string, BadgeMeta> = {};
let PRIORITY_CFG: Record<string, BadgeMeta> = {};
let CHANNEL_CFG: Record<string, BadgeMeta> = {};
let CATEGORY_CFG: Record<string, BadgeMeta> = {};

interface BadgeMeta {
  color: string;
  bg: string;
  border?: string;
  icon?: string;
}

const getIcon = (iconName: string, size = 9) => {
  switch (iconName) {
    case "Bell": return <Bell size={size}/>;
    case "Smartphone": return <Smartphone size={size}/>;
    case "Mail": return <Mail size={size}/>;
    case "Edit2": return <Edit2 size={size}/>;
    case "Clock": return <Clock size={size}/>;
    case "Send": return <Send size={size}/>;
    case "CheckCircle": return <CheckCircle size={size}/>;
    case "XCircle": return <XCircle size={size}/>;
    case "X": return <X size={size}/>;
    case "AlertTriangle": return <AlertTriangle size={size}/>;
    case "Calendar": return <Calendar size={size}/>;
    case "Users": return <Users size={size}/>;
    case "BookOpen": return <BookOpen size={size}/>;
    case "Zap": return <Zap size={size}/>;
    case "MessageCircle": return <MessageCircle size={size}/>;
    default: return <Radio size={size}/>;
  }
};

function CategoryBadge({ category, meta }: { category: string; meta?: BadgeMeta | null }) {
  const cfg = meta || CATEGORY_CFG[category] || { color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", icon: "MessageCircle" };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border ?? "border-slate-200"}`}>
      {getIcon(cfg.icon ?? "")} {category}
    </span>
  );
}


// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (d: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const selSm = {
  control:   (b: any) => ({ ...b, minHeight: 28, fontSize: 11, borderColor: "#e5e7eb", boxShadow: "none", "&:hover": { borderColor: "#0d9488" } }),
  menu:      (b: any) => ({ ...b, fontSize: 11, zIndex: 50 }),
  option:    (b: any, s: any) => ({ ...b, fontSize: 11, padding: "4px 10px", background: s.isSelected ? "#0d9488" : s.isFocused ? "#ccfbf1" : "white", color: s.isSelected ? "white" : "#1e293b" }),
  singleValue:(b: any) => ({ ...b, color: "#334155", fontSize: 11 }),
  multiValue: (b: any) => ({ ...b, background: "#ccfbf1", borderRadius: 4 }),
  multiValueLabel: (b: any) => ({ ...b, color: "#0f766e", fontSize: 10, fontWeight: 700 }),
  multiValueRemove: (b: any) => ({ ...b, color: "#0f766e", ":hover": { background: "#99f6e4", color: "#0f766e" } }),
  dropdownIndicator: (b: any) => ({ ...b, padding: "0 4px" }),
  valueContainer: (b: any) => ({ ...b, padding: "0 8px" }),
  indicatorSeparator: () => ({ display: "none" }),
  menuPortal: (b: any) => ({ ...b, zIndex: 9999 }),
};

function StatusBadge({ status, meta }: { status: string; meta?: BadgeMeta | null }) {
  const cfg = meta || STATUS_CFG[status] || { color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-300", icon: "Edit2" };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border ?? "border-slate-200"}`}>
      {getIcon(cfg.icon ?? "")} {status}
    </span>
  );
}
function PriorityBadge({ priority, meta }: { priority: string; meta?: BadgeMeta | null }) {
  const cfg = meta || PRIORITY_CFG[priority] || { color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" };
  return (
    <span className={`inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border ?? "border-slate-200"}`}>{priority}</span>
  );
}
function ChannelBadge({ channel, meta }: { channel: string; meta?: BadgeMeta | null }) {
  const cfg = meta || CHANNEL_CFG[channel] || { color: "text-slate-600", bg: "bg-slate-100", icon: "Radio" };
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cfg.color} ${cfg.bg}`}>
      {getIcon(cfg.icon ?? "", 9)}{channel}
    </span>
  );
}
function ReadRateBar({ total, read }: { total: number; read: number }) {
  const pct = total > 0 ? Math.round((read / total) * 100) : 0;
  return (
    <div className="flex items-center gap-1 min-w-[60px]">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${pct}%` }}/>
      </div>
      <span className="text-[9px] font-bold text-slate-500">{pct}%</span>
    </div>
  );
}
function StatCard({ label, value, icon, subtext, color, border }: {
  label: string; value: number | string; icon: React.ReactNode; subtext: string; color: string; border: string;
}) {
  return (
    <div className={`bg-white rounded-lg p-1.5 border-l-2 ${border} border-y border-r border-slate-100 shadow-sm flex items-center justify-between flex-1 min-w-0`}>
      <div className="space-y-0.5 min-w-0 pr-1">
        <p className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-sm font-black text-slate-800 leading-none">{value}</p>
        <p className="text-[7.5px] text-slate-500 font-semibold truncate">{subtext}</p>
      </div>
      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
    </div>
  );
}
// ─── Recipients Modal ─────────────────────────────────────────────────────────
function RecipientsModal({ commId, open, onClose }: { commId: number | null; open: boolean; onClose: () => void }) {
  const [data, setData]     = useState<Recipient[]>([]);
  const [comm, setComm]     = useState<CommRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open || !commId) return;
    setLoading(true);
    api.get(`/student-communications/recipients/${commId}`)
      .then(res => { if (res.data.success) { setData(res.data.data); setComm(res.data.comm); } })
      .catch(() => toast.error("Failed to load recipients"))
      .finally(() => setLoading(false));
  }, [open, commId]);

  if (!open) return null;
  const filtered = data.filter(r =>
    r.student_name.toLowerCase().includes(search.toLowerCase()) ||
    r.admission_number.toLowerCase().includes(search.toLowerCase())
  );
  const readCount = data.filter(r => r.is_read).length;
  const delivCount = data.filter(r => r.delivery_status === "delivered").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] lg:translate-x-16">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-t-2xl">
          <div>
            <p className="text-white text-sm font-bold">Recipients — {comm?.title ?? "..."}</p>
            <p className="text-teal-100 text-[10px]">{data.length} recipients · {delivCount} delivered · {readCount} read</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={16}/></button>
        </div>
        <div className="px-4 py-2 border-b border-slate-100">
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student…"
              className="pl-7 pr-2 py-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"/>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 gap-2 text-slate-400"><RefreshCw size={16} className="animate-spin"/> Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-400">No recipients found</div>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Student</th>
                  <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Delivery</th>
                  <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Read</th>
                  <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Read At</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-teal-50/20">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                          {r.photo_url ? <img src={r.photo_url} className="w-full h-full rounded-full object-cover" alt=""/> : r.student_name[0]}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-800 leading-tight">{r.student_name}</p>
                          <p className="text-[9px] text-slate-400">{r.admission_number} · {r.class_name}{r.section ? `-${r.section}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      {r.delivery_status === "delivered"
                        ? <span className="text-[9px] font-bold text-teal-600 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full">✓ Delivered</span>
                        : r.delivery_status === "failed"
                        ? <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">✗ Failed</span>
                        : <span className="text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full">Pending</span>}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {r.is_read
                        ? <CheckCircle size={13} className="text-teal-500 mx-auto"/>
                        : <div className="w-3 h-3 rounded-full border-2 border-slate-300 mx-auto"/>}
                    </td>
                    <td className="px-2 py-2 text-center text-[10px] text-slate-500">{fmtDate(r.read_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100">Close</button>
        </div>
      </div>
    </div>
  );
}
// ─── Compose Modal ────────────────────────────────────────────────────────────
interface ComposeProps {
  open: boolean; onClose: () => void; onSaved: () => void; record: CommRecord | null;
  masters: { channels: MasterOption[]; categories: MasterOption[]; priorities: MasterOption[]; statuses: MasterOption[] };
  classes: ClassOption[];
}
const INIT_FORM = {
  title: "", body: "", category: "" as any, channel: "" as any,
  priority: "" as any, status: "" as any,
  scheduled_at: "", expires_at: "", is_pinned: false,
  recipient_type: "all" as "all" | "class" | "individual",
  class_ids: [] as number[], student_ids: [] as number[],
};

function ComposeModal({ open, onClose, onSaved, record, masters, classes }: ComposeProps) {
  const [form, setForm]           = useState({ ...INIT_FORM });
  const [students, setStudents]   = useState<StudentOpt[]>([]);
  const [loadingStu, setLoadingStu] = useState(false);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    if (!open) return;
    if (record) {
      setForm({
        title: record.title, body: record.body,
        category: record.category, channel: record.channel,
        priority: record.priority, status: record.status,
        scheduled_at: record.scheduled_at?.split("T")[0] ?? "",
        expires_at: record.expires_at?.split("T")[0] ?? "",
        is_pinned: record.is_pinned,
        recipient_type: "all", class_ids: [], student_ids: [],
      });
    } else {
      setForm({
        ...INIT_FORM,
        channel:  masters.channels.find(c => c.label === "In-App")?.value ?? "",
        priority: masters.priorities.find(p => p.label === "Normal")?.value ?? "",
        status:   masters.statuses.find(s => s.label === "Draft")?.value ?? "",
        category: masters.categories.find(c => c.label === "General")?.value ?? "",
      });
    }
  }, [open, record, masters]);

  const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const loadStudents = async (classIds?: number[]) => {
    setLoadingStu(true);
    try {
      const params: any = { per_page: 999 };
      if (classIds?.length) params.class_id = classIds[0];
      const res = await api.get("/students", { params });
      if (res.data?.success) {
        setStudents((res.data.data ?? []).map((s: any) => ({
          value: s.id, label: s.full_name ?? `Student #${s.id}`,
          sub: s.admission_number ?? "",
        })));
      }
    } catch { setStudents([]); }
    setLoadingStu(false);
  };

  const submit = async () => {
    if (!form.title.trim())  { toast.error("Title required"); return; }
    if (!form.body.trim())   { toast.error("Message body required"); return; }
    if (!form.category)      { toast.error("Category required"); return; }
    if (!form.channel)       { toast.error("Channel required"); return; }
    if (!form.priority)      { toast.error("Priority required"); return; }
    if (!form.status)        { toast.error("Status required"); return; }
    setSaving(true);
    try {
      const payload: any = {
        title: form.title, body: form.body, category: form.category,
        channel: form.channel, priority: form.priority, status: form.status,
        scheduled_at: form.scheduled_at || null, expires_at: form.expires_at || null,
        is_pinned: form.is_pinned,
      };
      if (record) {
        await api.put(`/student-communications/${record.id}`, payload);
        toast.success("Communication updated");
      } else {
        payload.recipient_type = form.recipient_type;
        payload.class_ids      = form.class_ids;
        payload.student_ids    = form.student_ids;
        await api.post("/student-communications/", payload);
        toast.success("Communication created");
      }
      onSaved(); onClose();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? "Error"); }
    setSaving(false);
  };

  if (!open) return null;
  const catOpts  = masters.categories.map(o => ({ value: o.value, label: o.label }));
  const chanOpts = masters.channels.map(o => ({ value: o.value, label: o.label }));
  const prioOpts = masters.priorities.map(o => ({ value: o.value, label: o.label }));
  const statOpts = masters.statuses.map(o => ({ value: o.value, label: o.label }));
  const clsOpts  = classes.map(c => ({ value: c.value, label: c.label }));
  const stuOpts  = students.map(s => ({ value: s.value, label: `${s.label} (${s.sub})` }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] lg:translate-x-16">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <MessageCircle size={16} className="text-white"/>
            <div>
              <p className="text-white text-sm font-bold">{record ? "Edit Communication" : "Compose New Message"}</p>
              <p className="text-teal-100 text-[10px]">Student Communication Gateway — reach students & parents</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={16}/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 text-xs">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
            {/* Left Column */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Title *</label>
                <input value={form.title} onChange={e => setField("title", e.target.value)} placeholder="Message subject or title"
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"/>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Message Body *</label>
                <textarea value={form.body} onChange={e => setField("body", e.target.value)} rows={6}
                  placeholder="Write your message content here…"
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"/>
              </div>
              {!record && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Recipients *</label>
                  <div className="flex gap-2 mb-2">
                    {(["all", "class", "individual"] as const).map(t => (
                      <button key={t} type="button" onClick={() => { setField("recipient_type", t); if (t === "individual") loadStudents(); }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border capitalize transition-all ${form.recipient_type === t ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-200 hover:border-teal-400"}`}>
                        {t === "all" ? "All Students" : t === "class" ? "By Class" : "Individual"}
                      </button>
                    ))}
                  </div>
                  {form.recipient_type === "class" && (
                    <Select isMulti options={clsOpts} placeholder="Select classes…" styles={selSm} maxMenuHeight={150} menuPortalTarget={document.body}
                      onChange={opts => setField("class_ids", (opts as any[]).map(o => o.value))}/>
                  )}
                  {form.recipient_type === "individual" && (
                    <Select isMulti options={stuOpts} isLoading={loadingStu} placeholder="Select students…" styles={selSm} maxMenuHeight={150} menuPortalTarget={document.body}
                      onChange={opts => setField("student_ids", (opts as any[]).map(o => o.value))}/>
                  )}
                </div>
              )}
            </div>
            {/* Right Column */}
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Category *</label>
                  <Select options={catOpts} placeholder="Category…" styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body}
                    value={catOpts.find(o => o.value === form.category) ?? null} onChange={o => setField("category", o?.value ?? "")}/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Channel *</label>
                  <Select options={chanOpts} placeholder="Channel…" styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body}
                    value={chanOpts.find(o => o.value === form.channel) ?? null} onChange={o => setField("channel", o?.value ?? "")}/>
                </div>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Schedule At</label>
                  <input type="datetime-local" value={form.scheduled_at} onChange={e => setField("scheduled_at", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Expires At</label>
                  <input type="date" value={form.expires_at} onChange={e => setField("expires_at", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"/>
                </div>
              </div>
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_pinned} onChange={e => setField("is_pinned", e.target.checked)} className="w-3.5 h-3.5 accent-teal-600"/>
                  <span className="text-[11px] font-semibold text-slate-700">📌 Pin to Notice Board</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button onClick={submit} disabled={saving} className="px-5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60">
            {saving ? <RefreshCw size={12} className="animate-spin"/> : <Check size={12}/>}
            {saving ? "Saving…" : (record ? "Update" : "Create Message")}
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── Table Row ────────────────────────────────────────────────────────────────
function CommRow({ rec, serial, selected, onSelect, onEdit, onDelete, onSend, onViewRecipients }: {
  rec: CommRecord; serial: number; selected: boolean;
  onSelect: (id: number) => void; onEdit: (r: CommRecord) => void;
  onDelete: (id: number) => void; onSend: (id: number) => void;
  onViewRecipients: (id: number) => void;
}) {
  const isDraft = rec.status_name === "Draft" || rec.status_name === "Scheduled";
  return (
    <tr className={`border-b border-slate-100 hover:bg-teal-50/20 transition-colors ${selected ? "bg-teal-50/30" : ""} ${rec.is_pinned ? "bg-amber-50/30" : ""}`}>
      <td className="px-2 py-2 text-center">
        <button onClick={() => onSelect(rec.id)} className="text-slate-400 hover:text-teal-600">
          {selected ? <CheckSquare size={13} className="text-teal-600"/> : <Square size={13}/>}
        </button>
      </td>
      <td className="px-2 py-2 text-center text-[10px] font-bold text-slate-400">
        {rec.is_pinned ? <Pin size={11} className="text-amber-500 mx-auto"/> : serial}
      </td>
      <td className="px-2 py-2">
        <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-md">{rec.comm_no}</span>
      </td>
      <td className="px-2 py-2 max-w-[200px]">
        <div className="flex items-start gap-1">
          {rec.is_pinned && <span className="text-[9px] mt-0.5">📌</span>}
          <div>
            <p className="text-[11px] font-bold text-slate-800 leading-tight truncate">{rec.title}</p>
            <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">{rec.body}</p>
          </div>
        </div>
      </td>
      <td className="px-2 py-2">
        <CategoryBadge category={rec.category_name ?? "—"} meta={rec.category_meta}/>
      </td>
      <td className="px-2 py-2"><ChannelBadge channel={rec.channel_name ?? "—"} meta={rec.channel_meta}/></td>
      <td className="px-2 py-2 text-center"><PriorityBadge priority={rec.priority_name ?? "Normal"} meta={rec.priority_meta}/></td>
      <td className="px-2 py-2 text-center"><StatusBadge status={rec.status_name ?? "Draft"} meta={rec.status_meta}/></td>
      <td className="px-2 py-2 text-center">
        <button onClick={() => onViewRecipients(rec.id)} className="text-[10px] font-bold text-teal-600 hover:text-teal-800 underline underline-offset-2">
          {rec.total_recipients}
        </button>
      </td>
      <td className="px-2 py-2 text-center text-[10px] font-bold text-teal-600">{rec.delivered_count}</td>
      <td className="px-2 py-2"><ReadRateBar total={rec.total_recipients} read={rec.read_count}/></td>
      <td className="px-2 py-2 text-center text-[10px] text-slate-500">{fmtDate(rec.sent_at)}</td>
      <td className="px-2 py-2">
        <div className="flex items-center justify-center gap-1">
          {isDraft && (
            <button onClick={() => onSend(rec.id)} className="p-1 rounded hover:bg-teal-100 text-teal-600" title="Send Now"><Send size={11}/></button>
          )}
          <button onClick={() => onViewRecipients(rec.id)} className="p-1 rounded hover:bg-blue-100 text-blue-500" title="View Recipients"><Users size={11}/></button>
          <button onClick={() => onEdit(rec)} className="p-1 rounded hover:bg-slate-100 text-slate-500" title="Edit"><Edit2 size={11}/></button>
          <button onClick={() => onDelete(rec.id)} className="p-1 rounded hover:bg-rose-100 text-rose-500" title="Trash"><Trash2 size={11}/></button>
        </div>
      </td>
    </tr>
  );
}
// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentCommunication() {
  const [records, setRecords]   = useState<CommRecord[]>([]);
  const [stats, setStats]       = useState<Stats>({ total:0, sent_today:0, draft:0, scheduled:0, delivered:0, urgent:0, read_rate:0, total_recipients:0 });
  const [masters, setMasters]   = useState({ channels: [] as MasterOption[], categories: [] as MasterOption[], priorities: [] as MasterOption[], statuses: [] as MasterOption[] });
  const [classes, setClasses]   = useState<ClassOption[]>([]);
  const [loading, setLoading]   = useState(false);
  const [page, setPage]         = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal]       = useState(0);
  const [search, setSearch]     = useState("");
  const [filterCat, setFilterCat]   = useState<MasterOption | null>(null);
  const [filterChan, setFilterChan] = useState<MasterOption | null>(null);
  const [filterStat, setFilterStat] = useState<MasterOption | null>(null);
  const [filterPrio, setFilterPrio] = useState<MasterOption | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate]     = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [showModal, setShowModal]       = useState(false);
  const [editRecord, setEditRecord]     = useState<CommRecord | null>(null);
  const [showTrash, setShowTrash]       = useState(false);
  const [trashRecs, setTrashRecs]       = useState<CommRecord[]>([]);
  const [trashSel, setTrashSel]         = useState<number[]>([]);
  const [recipCommId, setRecipCommId]   = useState<number | null>(null);
  const [showRecipients, setShowRecipients] = useState(false);

  const importRef = useRef<HTMLInputElement>(null);

  const downloadSample = async () => {
    try {
      const res = await api.get("/student-communications/sample", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "communication_import_sample.csv";
      a.click();
      toast.success("Sample template downloaded");
    } catch {
      toast.error("Download failed");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    
    const tid = toast.loading("Importing communications CSV...");
    try {
      const res = await api.post("/student-communications/import", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.dismiss(tid);
      if (res.data?.success) {
        toast.success(res.data.message || "Import completed successfully!");
        fetchRecords(1);
        refreshStats();
      } else {
        toast.error(res.data?.message ?? "Import failed");
      }
    } catch (err: any) {
      toast.dismiss(tid);
      toast.error(err.response?.data?.message ?? "Import failed");
    }
    if (importRef.current) importRef.current.value = "";
  };

  useEffect(() => {
    api.get("/student-communications/masters").then(res => {
      if (res.data.success) {
        setMasters(res.data.data);
        res.data.data.statuses.forEach((x: any) => { if (x.meta) STATUS_CFG[x.label] = x.meta; });
        res.data.data.priorities.forEach((x: any) => { if (x.meta) PRIORITY_CFG[x.label] = x.meta; });
        res.data.data.channels.forEach((x: any) => { if (x.meta) CHANNEL_CFG[x.label] = x.meta; });
        res.data.data.categories.forEach((x: any) => { if (x.meta) CATEGORY_CFG[x.label] = x.meta; });
      }
    });
    api.get("/student-communications/stats").then(res => { if (res.data.success) setStats(res.data.data); });
    api.get("/master/classes").then(res => {
      if (res.data?.success && res.data.data)
        setClasses(Object.entries(res.data.data).map(([id, name]) => ({ value: Number(id), label: name as string })));
    }).catch(() => {});
  }, []);

  const fetchRecords = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params: any = { page: pg, per_page: 15 };
      if (search)     params.search   = search;
      if (filterCat)  params.category = filterCat.value;
      if (filterChan) params.channel  = filterChan.value;
      if (filterStat) params.status   = filterStat.value;
      if (filterPrio) params.priority = filterPrio.value;
      if (fromDate)   params.from_date = fromDate;
      if (toDate)     params.to_date   = toDate;
      const res = await api.get("/student-communications/", { params });
      if (res.data?.data) {
        setRecords(res.data.data);
        setPage(res.data.meta?.current_page ?? 1);
        setLastPage(res.data.meta?.last_page ?? 1);
        setTotal(res.data.meta?.total ?? 0);
      }
      setSelected([]);
    } catch { toast.error("Failed to load communications"); }
    setLoading(false);
  }, [search, filterCat, filterChan, filterStat, filterPrio, fromDate, toDate]);

  useEffect(() => { fetchRecords(1); }, [search, filterCat, filterChan, filterStat, filterPrio, fromDate, toDate]);
  const refreshStats = () => { api.get("/student-communications/stats").then(res => { if (res.data.success) setStats(res.data.data); }); };
  const fetchTrash   = async () => { try { const r = await api.get("/student-communications/trashed"); setTrashRecs(r.data.data ?? []); setTrashSel([]); } catch { toast.error("Failed to load trash"); } };
  const openTrash    = () => { setShowTrash(true); fetchTrash(); };

  const handleSend = async (id: number) => {
    if (!confirm("Send this message to all recipients now?")) return;
    try { await api.post(`/student-communications/send/${id}`); toast.success("Message sent!"); fetchRecords(page); refreshStats(); } catch { toast.error("Send failed"); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Move to trash?")) return;
    try { await api.delete(`/student-communications/${id}`); toast.success("Moved to trash"); fetchRecords(page); refreshStats(); } catch { toast.error("Error"); }
  };
  const handleBulkDelete = async () => {
    if (!selected.length || !confirm(`Move ${selected.length} to trash?`)) return;
    try { await api.post("/student-communications/bulk-delete", { ids: selected }); toast.success(`${selected.length} moved to trash`); fetchRecords(page); refreshStats(); } catch { toast.error("Error"); }
  };
  const handleRestore = async (id: number) => {
    try { await api.post(`/student-communications/restore/${id}`); toast.success("Restored"); fetchTrash(); refreshStats(); } catch { toast.error("Error"); }
  };
  const handleBulkRestore = async () => {
    if (!trashSel.length) return;
    try { await api.post("/student-communications/bulk-restore", { ids: trashSel }); toast.success("Restored"); fetchTrash(); refreshStats(); } catch { toast.error("Error"); }
  };
  const handleBulkForceDelete = async () => {
    if (!trashSel.length || !confirm(`Permanently delete ${trashSel.length}? This cannot be undone.`)) return;
    try { await api.post("/student-communications/bulk-force-delete", { ids: trashSel }); toast.success("Permanently deleted"); fetchTrash(); } catch { toast.error("Error"); }
  };
  const handleExport = async () => {
    try { const res = await api.get("/student-communications/export", { responseType: "blob" }); const url = URL.createObjectURL(new Blob([res.data])); const a = document.createElement("a"); a.href = url; a.download = `communications_${new Date().toISOString().split("T")[0]}.csv`; a.click(); toast.success("Export ready"); } catch { toast.error("Export failed"); }
  };
  const toggleSelect   = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll      = () => setSelected(selected.length === records.length ? [] : records.map(r => r.id));
  const toggleTrash    = (id: number) => setTrashSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAllTrash = () => setTrashSel(trashSel.length === trashRecs.length ? [] : trashRecs.map(r => r.id));
  const catOpts  = masters.categories.map(o => ({ value: o.value, label: o.label }));
  const chanOpts = masters.channels.map(o => ({ value: o.value, label: o.label }));
  const statOpts = masters.statuses.map(o => ({ value: o.value, label: o.label }));
  const prioOpts = masters.priorities.map(o => ({ value: o.value, label: o.label }));

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <ComposeModal open={showModal} onClose={() => { setShowModal(false); setEditRecord(null); }}
        onSaved={() => { fetchRecords(page); refreshStats(); }} record={editRecord} masters={masters} classes={classes}/>
      <RecipientsModal commId={recipCommId} open={showRecipients} onClose={() => setShowRecipients(false)}/>

      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {showTrash && <button onClick={() => setShowTrash(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft size={14}/></button>}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center"><MessageCircle size={16} className="text-white"/></div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-800">{showTrash ? "Communications — Trash Bin" : "Student Communication Gateway"}</h1>
            <p className="text-[10px] text-slate-400 font-medium">{showTrash ? "Restore or permanently delete trashed messages" : "Compose, send & track messages to students and parents"}</p>
          </div>
        </div>
        {!showTrash && (
          <div className="flex items-center gap-2">
            <button onClick={downloadSample} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold">Sample Template</button>
            <button onClick={() => importRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold"><Upload size={12}/> Import</button>
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 text-[11px] font-semibold"><Download size={12}/> Export</button>
            <button onClick={openTrash} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold">
              <Trash2 size={12}/> Trash {trashRecs.length > 0 && <span className="bg-rose-500 text-white text-[9px] rounded-full px-1.5 py-0.5 font-bold">{trashRecs.length}</span>}
            </button>
            <button onClick={() => { setEditRecord(null); setShowModal(true); }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold shadow-sm"><Plus size={12}/> Compose</button>
            <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImport}/>
          </div>
        )}
      </div>

      {/* Stats */}
      {!showTrash && (
        <div className="flex-shrink-0 px-4 py-2 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-1.5">
            <StatCard label="Total"        value={stats.total}            icon={<MessageCircle size={11} className="text-slate-600"/>} subtext="All messages"       color="bg-slate-100"  border="border-slate-400"/>
            <StatCard label="Sent Today"   value={stats.sent_today}       icon={<Send size={11} className="text-teal-600"/>}           subtext="Sent today"         color="bg-teal-50"    border="border-teal-400"/>
            <StatCard label="Draft"        value={stats.draft}            icon={<Edit2 size={11} className="text-slate-500"/>}         subtext="Not sent yet"       color="bg-slate-100"  border="border-slate-300"/>
            <StatCard label="Scheduled"    value={stats.scheduled}        icon={<Clock size={11} className="text-amber-600"/>}         subtext="Queued to send"     color="bg-amber-50"   border="border-amber-400"/>
            <StatCard label="Delivered"    value={stats.delivered}        icon={<CheckCircle size={11} className="text-teal-600"/>}    subtext="Sent + Delivered"   color="bg-teal-50"    border="border-teal-500"/>
            <StatCard label="Urgent"       value={stats.urgent}           icon={<AlertTriangle size={11} className="text-rose-600"/>}  subtext="Urgent priority"    color="bg-rose-50"    border="border-rose-400"/>
            <StatCard label="Avg Read Rate"value={`${stats.read_rate}%`}  icon={<Eye size={11} className="text-cyan-600"/>}            subtext="Read by recipients" color="bg-cyan-50"    border="border-cyan-400"/>
            <StatCard label="Reached"      value={stats.total_recipients} icon={<Users size={11} className="text-blue-600"/>}          subtext="Total recipients"   color="bg-blue-50"    border="border-blue-400"/>
          </div>
        </div>
      )}

      {/* Trash View */}
      {showTrash ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-shrink-0 px-4 py-2 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
            <p className="text-[11px] font-extrabold text-slate-700">Trash: <span className="text-rose-600">{trashRecs.length}</span> message(s)</p>
            {trashSel.length > 0 && (
              <div className="flex items-center gap-2">
                <button onClick={handleBulkRestore} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold"><RotateCcw size={11}/> Restore {trashSel.length}</button>
                <button onClick={handleBulkForceDelete} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-[11px] font-bold"><Trash2 size={11}/> Delete {trashSel.length}</button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto">
            {trashRecs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3"><Trash2 size={40} className="opacity-20"/><p className="text-sm font-semibold">Trash is empty</p></div>
            ) : (
              <table className="w-full min-w-[640px] text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="px-2 py-2 w-8 text-center"><button onClick={toggleAllTrash}>{trashSel.length === trashRecs.length ? <CheckSquare size={13} className="text-rose-600"/> : <Square size={13} className="text-slate-400"/>}</button></th>
                    <th className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Title</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Category</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Status</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Deleted</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trashRecs.map(r => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-rose-50/20">
                      <td className="px-2 py-2 text-center"><button onClick={() => toggleTrash(r.id)}>{trashSel.includes(r.id) ? <CheckSquare size={13} className="text-rose-600"/> : <Square size={13} className="text-slate-400"/>}</button></td>
                      <td className="px-3 py-2"><p className="text-[11px] font-bold text-slate-700 truncate max-w-[200px]">{r.title}</p><p className="text-[9px] font-mono text-teal-600">{r.comm_no}</p></td>
                      <td className="px-2 py-2"><CategoryBadge category={r.category_name ?? "—"} meta={r.category_meta}/></td>
                      <td className="px-2 py-2"><StatusBadge status={r.status_name ?? "Draft"} meta={r.status_meta}/></td>
                      <td className="px-2 py-2"><span className="text-[10px] text-slate-500">{fmtDate(r.deleted_at ?? null)}</span></td>
                      <td className="px-2 py-2 text-center"><button onClick={() => handleRestore(r.id)} className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold mx-auto"><RotateCcw size={10}/> Restore</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* Main List */
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Filter bar */}
          <div className="flex-shrink-0 px-4 py-2 bg-white border-b border-slate-100 flex flex-row flex-nowrap overflow-x-auto items-center gap-1.5">
            <div className="relative flex-shrink-0">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search title, body…"
                className="pl-7 pr-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs w-44 focus:outline-none focus:ring-1 focus:ring-teal-500"/>
            </div>
            <div className="w-32 flex-shrink-0"><Select options={catOpts} placeholder="Category…" isClearable styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body} value={filterCat} onChange={o => { setFilterCat(o as MasterOption | null); setPage(1); }}/></div>
            <div className="w-32 flex-shrink-0"><Select options={chanOpts} placeholder="Channel…" isClearable styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body} value={filterChan} onChange={o => { setFilterChan(o as MasterOption | null); setPage(1); }}/></div>
            <div className="w-28 flex-shrink-0"><Select options={statOpts} placeholder="Status…" isClearable styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body} value={filterStat} onChange={o => { setFilterStat(o as MasterOption | null); setPage(1); }}/></div>
            <div className="w-28 flex-shrink-0"><Select options={prioOpts} placeholder="Priority…" isClearable styles={selSm} maxMenuHeight={160} menuPortalTarget={document.body} value={filterPrio} onChange={o => { setFilterPrio(o as MasterOption | null); setPage(1); }}/></div>
            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 w-28 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 flex-shrink-0"/>
            <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 w-28 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 flex-shrink-0"/>
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
                <MessageCircle size={40} className="opacity-20"/>
                <p className="text-sm font-semibold">No communications found</p>
                <button onClick={() => { setEditRecord(null); setShowModal(true); }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700"><Plus size={12}/> Compose First Message</button>
              </div>
            ) : (
              <table className="w-full min-w-[1200px] text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="px-2 py-2 text-center w-8"><button onClick={toggleAll}>{selected.length === records.length && records.length > 0 ? <CheckSquare size={13} className="text-teal-600"/> : <Square size={13} className="text-slate-400"/>}</button></th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase w-8">#</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Comm No</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Title</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Category</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Channel</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Priority</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Status</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Recipients</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Delivered</th>
                    <th className="px-2 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase">Read Rate</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Sent At</th>
                    <th className="px-2 py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <CommRow key={r.id} rec={r} serial={(page - 1) * 15 + i + 1}
                      selected={selected.includes(r.id)} onSelect={toggleSelect}
                      onEdit={rec => { setEditRecord(rec); setShowModal(true); }}
                      onDelete={handleDelete} onSend={handleSend}
                      onViewRecipients={id => { setRecipCommId(id); setShowRecipients(true); }}/>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && records.length > 0 && (
            <div className="flex-shrink-0 border-t border-slate-100 bg-white px-4 py-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Showing {(page-1)*15+1}–{Math.min(page*15, total)} of <span className="font-bold">{total}</span> communications</span>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => { setPage(page-1); fetchRecords(page-1); }} className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 text-slate-500"><ChevronLeft size={13}/></button>
                {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => { const pg = Math.max(1, page-2)+i; if (pg > lastPage) return null; return (<button key={pg} onClick={() => { setPage(pg); fetchRecords(pg); }} className={`px-2 py-0.5 rounded text-[11px] font-bold ${pg === page ? "bg-teal-600 text-white" : "hover:bg-slate-100 text-slate-600"}`}>{pg}</button>); })}
                <button disabled={page >= lastPage} onClick={() => { setPage(page+1); fetchRecords(page+1); }} className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 text-slate-500"><ChevronRight size={13}/></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}