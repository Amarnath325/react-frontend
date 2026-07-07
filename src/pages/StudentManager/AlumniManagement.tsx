import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, RefreshCw, Plus, Check, X, Trash2, Edit2,
  CheckSquare, Square, Download, Upload, ArrowLeft,
  Users, TrendingUp, Award, CheckCircle,
  RotateCcw, Globe, Link2, ExternalLink,
  Briefcase, BookOpen, MapPin, Phone, Mail, Shield,
  Star, BarChart2, Rss,
  UserPlus,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import Select from "react-select";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AlumniRecord {
  id: number; student_id?: number; full_name: string;
  first_name: string; middle_name?: string; last_name?: string;
  admission_number?: string; roll_number?: string;
  passing_year?: string; last_class?: string; stream?: string; board?: string;
  final_percentage?: number; final_grade?: string; achievements?: string;
  gender?: string; dob?: string; blood_group?: string;
  email?: string; mobile?: string; alternate_mobile?: string;
  current_address?: string; city?: string; state?: string; pincode?: string; country?: string;
  current_status?: string; current_institution?: string; current_course?: string;
  current_employer?: string; current_designation?: string; industry?: string;
  linkedin_url?: string; twitter_url?: string; facebook_url?: string; website_url?: string;
  photo?: string; is_active: boolean; is_verified: boolean;
  wants_newsletter: boolean; notes?: string; deleted_at?: string | null;
}
interface Stats {
  total: number; active: number; verified: number; trashed: number;
  newsletter: number; employed: number; studying: number;
  by_status: Record<string, number>; by_year: Record<string, number>;
}
interface MasterData {
  statuses: Option[]; streams: string[]; boards: string[];
  genders: string[]; industries: string[]; bloodGroups: string[]; passingYears: Option[];
}
interface Option { value: string | number; label: string; [k: string]: any; }

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const today = () => new Date().toISOString().split("T")[0];

const STATUS_CFG: Record<string, { bg: string; text: string; icon: React.ReactNode; border: string }> = {
  studying:       { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",   icon: <BookOpen size={10}/> },
  employed:       { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200",icon: <Briefcase size={10}/> },
  self_employed:  { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200",   icon: <TrendingUp size={10}/> },
  freelancer:     { bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-200",   icon: <Globe size={10}/> },
  entrepreneur:   { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200", icon: <Star size={10}/> },
  government_job: { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200", icon: <Shield size={10}/> },
  other:          { bg: "bg-slate-50",   text: "text-slate-500",   border: "border-slate-200",  icon: <Users size={10}/> },
};

function StatusBadge({ status }: { status?: string | null }) {
  const cfg = STATUS_CFG[status ?? ""] ?? { bg: "bg-slate-50", text: "text-slate-400", border: "border-slate-200", icon: null };
  const label = status?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) ?? "Unknown";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.icon} {label}
    </span>
  );
}

function StatCard({ label, value, icon, sub, color, border }: { label: string; value: string | number; icon: React.ReactNode; sub: string; color: string; border: string }) {
  return (
    <div className={`bg-white rounded-lg p-2 border-l-2 ${border} border-y border-r border-slate-100 shadow-sm flex items-center justify-between flex-1 min-w-0`}>
      <div className="space-y-0.5 min-w-0 pr-1">
        <p className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-sm font-black text-slate-800 leading-none">{value}</p>
        <p className="text-[7.5px] text-slate-500 font-semibold truncate">{sub}</p>
      </div>
      <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
    </div>
  );
}

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

// ─── Alumni Avatar ────────────────────────────────────────────────────────────
function AlumniAvatar({ name, size = 8 }: { name: string; size?: number }) {
  const initials = name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  const colors = ["from-indigo-500 to-violet-600", "from-teal-500 to-emerald-600", "from-amber-500 to-orange-600", "from-rose-500 to-pink-600", "from-blue-500 to-cyan-600"];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br ${colors[idx]} flex items-center justify-center flex-shrink-0`}>
      <span className={`text-white font-black ${size <= 8 ? "text-[10px]" : "text-sm"}`}>{initials || "?"}</span>
    </div>
  );
}

// ─── Alumni Form Modal ────────────────────────────────────────────────────────
const EMPTY_FORM = {
  first_name: "", middle_name: "", last_name: "",
  admission_number: "", roll_number: "",
  passing_year: "" as any, last_class: "", stream: "" as any, board: "" as any,
  final_percentage: "", final_grade: "", achievements: "",
  gender: "" as any, dob: "", blood_group: "" as any,
  email: "", mobile: "", alternate_mobile: "",
  current_address: "", city: "", state: "", pincode: "", country: "India",
  current_status: "" as any, current_institution: "", current_course: "",
  current_employer: "", current_designation: "", industry: "" as any,
  linkedin_url: "", twitter_url: "", facebook_url: "", website_url: "",
  is_active: true, is_verified: false, wants_newsletter: true,
  notes: "",
};

function AlumniFormModal({ open, onClose, onSaved, record, masters }: {
  open: boolean; onClose: () => void; onSaved: () => void;
  record: AlumniRecord | null; masters: MasterData;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");

  useEffect(() => {
    if (!open) return;
    if (record) {
      setForm({
        first_name: record.first_name ?? "", middle_name: record.middle_name ?? "",
        last_name: record.last_name ?? "", admission_number: record.admission_number ?? "",
        roll_number: record.roll_number ?? "", passing_year: record.passing_year ?? "",
        last_class: record.last_class ?? "", stream: record.stream ?? "",
        board: record.board ?? "", final_percentage: String(record.final_percentage ?? ""),
        final_grade: record.final_grade ?? "", achievements: record.achievements ?? "",
        gender: record.gender ?? "", dob: record.dob ?? "", blood_group: record.blood_group ?? "",
        email: record.email ?? "", mobile: record.mobile ?? "",
        alternate_mobile: record.alternate_mobile ?? "",
        current_address: record.current_address ?? "", city: record.city ?? "",
        state: record.state ?? "", pincode: record.pincode ?? "", country: record.country ?? "India",
        current_status: record.current_status ?? "", current_institution: record.current_institution ?? "",
        current_course: record.current_course ?? "", current_employer: record.current_employer ?? "",
        current_designation: record.current_designation ?? "", industry: record.industry ?? "",
        linkedin_url: record.linkedin_url ?? "", twitter_url: record.twitter_url ?? "",
        facebook_url: record.facebook_url ?? "", website_url: record.website_url ?? "",
        is_active: record.is_active, is_verified: record.is_verified,
        wants_newsletter: record.wants_newsletter, notes: record.notes ?? "",
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }
    setActiveSection("personal");
  }, [open, record]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim()) { toast.error("First name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        passing_year: form.passing_year || null,
        stream: form.stream || null,
        board: form.board || null,
        gender: form.gender || null,
        blood_group: form.blood_group || null,
        current_status: form.current_status || null,
        industry: form.industry || null,
        final_percentage: form.final_percentage !== "" ? Number(form.final_percentage) : null,
        dob: form.dob || null,
      };
      if (record) {
        await api.put(`/alumni/${record.id}`, payload);
        toast.success("Alumni updated!");
      } else {
        await api.post("/alumni", payload);
        toast.success("Alumni added!");
      }
      onSaved(); onClose();
    } catch (err: any) { toast.error(err.response?.data?.message ?? "Save failed"); }
    finally { setSaving(false); }
  };

  if (!open) return null;

  const sections = [
    { id: "personal", label: "Personal" },
    { id: "academic", label: "Academic" },
    { id: "current", label: "Current Life" },
    { id: "social", label: "Social & Notes" },
  ];

  const strOpts = (arr: string[]) => arr.map(v => ({ value: v, label: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center"><Users size={15} className="text-white"/></div>
            <div>
              <h2 className="text-[14px] font-extrabold text-white">{record ? "Edit Alumni Profile" : "Add Alumni"}</h2>
              <p className="text-[10px] text-indigo-200">{record ? `Editing: ${record.full_name}` : "Register a graduate in the alumni network"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"><X size={13} className="text-white"/></button>
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 flex-shrink-0">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`flex-1 py-2 text-[11px] font-bold transition-colors ${activeSection === s.id ? "bg-white border-b-2 border-indigo-600 text-indigo-700" : "text-slate-400 hover:text-slate-600"}`}>
              {s.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {/* ── Personal ── */}
            {activeSection === "personal" && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {[["first_name", "First Name *"], ["middle_name", "Middle Name"], ["last_name", "Last Name"]].map(([k, label]) => (
                    <div key={k}>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">{label}</label>
                      <input value={(form as any)[k]} onChange={e => set(k, e.target.value)} placeholder={label}
                        className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-400"/>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Gender</label>
                    <Select options={strOpts(masters.genders)} value={form.gender ? { value: form.gender, label: form.gender } : null}
                      onChange={o => set("gender", o?.value ?? "")} placeholder="Gender" isClearable styles={selSm} menuPortalTarget={document.body}/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Date of Birth</label>
                    <input type="date" value={form.dob} onChange={e => set("dob", e.target.value)}
                      className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-400"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Blood Group</label>
                    <Select options={strOpts(masters.bloodGroups)} value={form.blood_group ? { value: form.blood_group, label: form.blood_group } : null}
                      onChange={o => set("blood_group", o?.value ?? "")} placeholder="Blood Group" isClearable styles={selSm} menuPortalTarget={document.body}/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Mobile</label>
                    <input value={form.mobile} onChange={e => set("mobile", e.target.value)} placeholder="Mobile number"
                      className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-400"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Email</label>
                    <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com"
                      className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-400"/>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Current Address</label>
                  <textarea value={form.current_address} onChange={e => set("current_address", e.target.value)} rows={2} placeholder="Street address…"
                    className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-400 resize-none"/>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[["city","City"], ["state","State"], ["pincode","Pincode"]].map(([k, l]) => (
                    <div key={k}>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">{l}</label>
                      <input value={(form as any)[k]} onChange={e => set(k, e.target.value)} placeholder={l}
                        className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-400"/>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Academic ── */}
            {activeSection === "academic" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Admission Number</label>
                    <input value={form.admission_number} onChange={e => set("admission_number", e.target.value)} placeholder="ADM/2020/001"
                      className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-400"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Passing Year</label>
                    <Select options={masters.passingYears as any} value={form.passing_year ? { value: form.passing_year, label: form.passing_year } : null}
                      onChange={o => set("passing_year", o?.value ?? "")} placeholder="Year" isClearable styles={selSm} menuPortalTarget={document.body}/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Last Class</label>
                    <input value={form.last_class} onChange={e => set("last_class", e.target.value)} placeholder="e.g. Class 12"
                      className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-400"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Stream</label>
                    <Select options={strOpts(masters.streams)} value={form.stream ? { value: form.stream, label: form.stream } : null}
                      onChange={o => set("stream", o?.value ?? "")} placeholder="Stream" isClearable styles={selSm} menuPortalTarget={document.body}/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Board</label>
                    <Select options={strOpts(masters.boards)} value={form.board ? { value: form.board, label: form.board } : null}
                      onChange={o => set("board", o?.value ?? "")} placeholder="Board" isClearable styles={selSm} menuPortalTarget={document.body}/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Final Grade</label>
                    <input value={form.final_grade} onChange={e => set("final_grade", e.target.value)} placeholder="A+, A, B…"
                      className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-400"/>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Final Percentage (%)</label>
                  <input type="number" min={0} max={100} step="0.01" value={form.final_percentage} onChange={e => set("final_percentage", e.target.value)} placeholder="e.g. 87.50"
                    className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-400"/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Achievements / Honours</label>
                  <textarea value={form.achievements} onChange={e => set("achievements", e.target.value)} rows={2} placeholder="Academic achievements, awards, scholarships…"
                    className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-400 resize-none"/>
                </div>
              </>
            )}

            {/* ── Current Life ── */}
            {activeSection === "current" && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Current Status</label>
                  <Select options={masters.statuses as any} value={form.current_status ? masters.statuses.find(o => o.value === form.current_status) ?? null : null}
                    onChange={o => set("current_status", o?.value ?? "")} placeholder="What are they doing now?" isClearable styles={selSm} menuPortalTarget={document.body}/>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Current Institution / Company</label>
                    <input value={form.current_institution || form.current_employer} onChange={e => {
                      const val = e.target.value;
                      const isEmployed = ["employed","self_employed","entrepreneur","government_job","freelancer"].includes(form.current_status ?? "");
                      if (isEmployed) set("current_employer", val); else set("current_institution", val);
                    }} placeholder="University / Company name…"
                      className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-400"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Designation / Course</label>
                    <input value={form.current_designation || form.current_course} onChange={e => {
                      const val = e.target.value;
                      const isEmployed = ["employed","self_employed","entrepreneur","government_job","freelancer"].includes(form.current_status ?? "");
                      if (isEmployed) set("current_designation", val); else set("current_course", val);
                    }} placeholder="Software Engineer / B.Tech…"
                      className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-400"/>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Industry</label>
                  <Select options={strOpts(masters.industries)} value={form.industry ? { value: form.industry, label: form.industry } : null}
                    onChange={o => set("industry", o?.value ?? "")} placeholder="Technology, Healthcare…" isClearable styles={selSm} menuPortalTarget={document.body}/>
                </div>
                <div className="flex gap-4 pt-1">
                  {[["is_active","Active Profile"],["is_verified","Verified Alumni"],["wants_newsletter","Newsletter Subscriber"]].map(([k, label]) => (
                    <label key={k} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 cursor-pointer">
                      <input type="checkbox" checked={(form as any)[k]} onChange={e => set(k, e.target.checked)} className="accent-indigo-600"/>
                      {label}
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* ── Social & Notes ── */}
            {activeSection === "social" && (
              <>
                <div className="space-y-2">
                  {[
                    { k: "linkedin_url", label: "LinkedIn URL",        icon: <Link2 size={11} className="text-blue-600"/> },
                    { k: "twitter_url",  label: "Twitter / X URL",     icon: <ExternalLink size={11} className="text-sky-500"/> },
                    { k: "facebook_url", label: "Facebook URL",        icon: <Globe size={11} className="text-indigo-600"/> },
                    { k: "website_url",  label: "Website / Portfolio", icon: <Globe size={11} className="text-violet-600"/> },
                  ].map(({ k, label, icon }) => (
                    <div key={k}>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5 flex items-center gap-1">{icon} {label}</label>
                      <input type="url" value={(form as any)[k]} onChange={e => set(k, e.target.value)} placeholder="https://…"
                        className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-400"/>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Admin Notes</label>
                  <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Internal notes about this alumni…"
                    className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-400 resize-none"/>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex justify-between items-center px-4 py-3 border-t border-slate-100 bg-slate-50">
            <div className="flex gap-1">
              {sections.map((s, i) => (
                <button key={s.id} type="button" onClick={() => setActiveSection(s.id)}
                  className={`w-2 h-2 rounded-full transition-colors ${activeSection === s.id ? "bg-indigo-600" : "bg-slate-300 hover:bg-slate-400"}`}/>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5">
                {saving ? <RefreshCw size={11} className="animate-spin"/> : <Check size={11}/>}
                {record ? "Save Changes" : "Add Alumni"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Promote from Student Modal ───────────────────────────────────────────────
function PromoteModal({ open, onClose, onSaved, masters }: {
  open: boolean; onClose: () => void; onSaved: () => void; masters: MasterData;
}) {
  const [student, setStudent] = useState<any | null>(null);
  const [studentOpts, setStudentOpts] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({ passing_year: "" as any, last_class: "", stream: "" as any, board: "" as any, final_percentage: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!open) { setStudent(null); setStudentOpts([]); setForm({ passing_year: "", last_class: "", stream: "", board: "", final_percentage: "", notes: "" }); } }, [open]);

  const searchStudents = async (q: string) => {
    if (!q || q.length < 2) return;
    setSearching(true);
    try {
      const r = await api.get("/alumni/students/search", { params: { search: q } });
      setStudentOpts(r.data.data ?? []);
    } catch {}
    setSearching(false);
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const strOpts = (arr: string[]) => arr.map(v => ({ value: v, label: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) { toast.error("Select a student"); return; }
    if (!form.passing_year) { toast.error("Passing year is required"); return; }
    setSaving(true);
    try {
      await api.post("/alumni/promote-from-student", {
        student_id: student.value,
        passing_year: form.passing_year,
        last_class: form.last_class || null,
        stream: form.stream || null,
        board: form.board || null,
        final_percentage: form.final_percentage !== "" ? Number(form.final_percentage) : null,
        notes: form.notes || null,
      });
      toast.success("Alumni profile created from student record!");
      onSaved(); onClose();
    } catch (err: any) { toast.error(err.response?.data?.message ?? "Failed"); }
    setSaving(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center"><UserPlus size={14} className="text-white"/></div>
            <div>
              <h2 className="text-[13px] font-extrabold text-white">Promote Student to Alumni</h2>
              <p className="text-[10px] text-teal-200">Convert a student record into an alumni profile</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"><X size={13} className="text-white"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Search Student <span className="text-rose-500">*</span></label>
            <Select options={studentOpts} value={student} onInputChange={searchStudents} onChange={v => setStudent(v)}
              isLoading={searching} placeholder="Type student name or admission no…" styles={selSm} menuPortalTarget={document.body}/>
          </div>
          {student && (
            <div className="bg-teal-50 rounded-lg p-2 border border-teal-100 text-[11px]">
              <p className="font-bold text-teal-700">{student.name}</p>
              <p className="text-slate-500">{student.admission_number}{student.class ? ` — ${student.class}` : ""}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Passing Year <span className="text-rose-500">*</span></label>
              <Select options={masters.passingYears as any} value={form.passing_year ? { value: form.passing_year, label: form.passing_year } : null}
                onChange={o => set("passing_year", o?.value ?? "")} placeholder="Year" styles={selSm} menuPortalTarget={document.body}/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Last Class</label>
              <input value={form.last_class} onChange={e => set("last_class", e.target.value)} placeholder="Class 12"
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-teal-400"/>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Stream</label>
              <Select options={strOpts(masters.streams)} value={form.stream ? { value: form.stream, label: form.stream } : null}
                onChange={o => set("stream", o?.value ?? "")} placeholder="Stream" isClearable styles={selSm} menuPortalTarget={document.body}/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Board</label>
              <Select options={strOpts(masters.boards)} value={form.board ? { value: form.board, label: form.board } : null}
                onChange={o => set("board", o?.value ?? "")} placeholder="Board" isClearable styles={selSm} menuPortalTarget={document.body}/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Final %</label>
              <input type="number" min={0} max={100} step="0.01" value={form.final_percentage} onChange={e => set("final_percentage", e.target.value)} placeholder="87.5"
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-teal-400"/>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <RefreshCw size={11} className="animate-spin"/> : <UserPlus size={11}/>}
              Promote to Alumni
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Alumni Detail Slide-Over ─────────────────────────────────────────────────
function AlumniDetail({ alumni, onClose, onEdit, onToggleActive, onToggleVerified }: {
  alumni: AlumniRecord; onClose: () => void;
  onEdit: () => void; onToggleActive: () => void; onToggleVerified: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white w-full max-w-sm h-full overflow-y-auto shadow-2xl border-l border-slate-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-5 flex-shrink-0">
          <div className="flex justify-between items-start mb-4">
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"><ArrowLeft size={13} className="text-white"/></button>
            <div className="flex gap-1.5">
              <button onClick={onEdit} className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-[11px] text-white font-bold flex items-center gap-1"><Edit2 size={10}/> Edit</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AlumniAvatar name={alumni.full_name} size={12}/>
            <div>
              <h2 className="text-base font-extrabold text-white">{alumni.full_name}</h2>
              <p className="text-[11px] text-indigo-200">{alumni.passing_year && `Batch of ${alumni.passing_year}`} {alumni.last_class && `· ${alumni.last_class}`}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                {alumni.is_verified && <span className="flex items-center gap-0.5 text-[9px] bg-emerald-500/80 text-white px-2 py-0.5 rounded-full font-bold"><Shield size={8}/> Verified</span>}
                {!alumni.is_active && <span className="text-[9px] bg-slate-500/60 text-white px-2 py-0.5 rounded-full font-bold">Inactive</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 p-4 space-y-4 text-[11px]">
          {/* Status */}
          {alumni.current_status && (
            <div>
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Current Life</p>
              <StatusBadge status={alumni.current_status}/>
              {(alumni.current_employer || alumni.current_institution) && (
                <p className="mt-1.5 font-bold text-slate-700">{alumni.current_employer ?? alumni.current_institution}</p>
              )}
              {(alumni.current_designation || alumni.current_course) && (
                <p className="text-slate-500">{alumni.current_designation ?? alumni.current_course}</p>
              )}
              {alumni.industry && <p className="text-slate-400 mt-0.5">{alumni.industry}</p>}
            </div>
          )}

          {/* Academic */}
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Academic Details</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                ["Stream", alumni.stream], ["Board", alumni.board],
                ["Percentage", alumni.final_percentage ? `${alumni.final_percentage}%` : null],
                ["Grade", alumni.final_grade], ["Admission No.", alumni.admission_number],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={String(k)} className="bg-slate-50 rounded-lg p-1.5 border border-slate-100">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{k}</p>
                  <p className="font-bold text-slate-700 truncate">{v}</p>
                </div>
              ))}
            </div>
            {alumni.achievements && (
              <div className="mt-2 bg-amber-50 rounded-lg p-2 border border-amber-100">
                <p className="text-[9px] text-amber-600 font-bold uppercase tracking-wider mb-0.5">Achievements</p>
                <p className="text-slate-600">{alumni.achievements}</p>
              </div>
            )}
          </div>

          {/* Contact */}
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Contact</p>
            <div className="space-y-1.5">
              {alumni.mobile && <a href={`tel:${alumni.mobile}`} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600"><Phone size={10}/> {alumni.mobile}</a>}
              {alumni.email && <a href={`mailto:${alumni.email}`} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 truncate"><Mail size={10}/> {alumni.email}</a>}
              {alumni.city && <p className="flex items-center gap-2 text-slate-500"><MapPin size={10}/> {[alumni.city, alumni.state].filter(Boolean).join(", ")}</p>}
            </div>
          </div>

          {/* Social */}
          {(alumni.linkedin_url || alumni.twitter_url || alumni.facebook_url || alumni.website_url) && (
            <div>
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Social Links</p>
              <div className="flex gap-2">
                {alumni.linkedin_url && <a href={alumni.linkedin_url} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center hover:bg-blue-200"><Link2 size={12} className="text-blue-700"/></a>}
                {alumni.twitter_url  && <a href={alumni.twitter_url}  target="_blank" rel="noreferrer" className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center hover:bg-sky-200"><ExternalLink size={12} className="text-sky-600"/></a>}
                {alumni.facebook_url && <a href={alumni.facebook_url} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center hover:bg-indigo-200"><Globe size={12} className="text-indigo-700"/></a>}
                {alumni.website_url  && <a href={alumni.website_url}  target="_blank" rel="noreferrer" className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center hover:bg-violet-200"><Globe size={12} className="text-violet-700"/></a>}
              </div>
            </div>
          )}

          {/* Admin actions */}
          <div className="border-t border-slate-100 pt-3">
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Admin Actions</p>
            <div className="flex gap-2">
              <button onClick={onToggleVerified}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${alumni.is_verified ? "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200" : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"}`}>
                <Shield size={11}/> {alumni.is_verified ? "Unverify" : "Verify"}
              </button>
              <button onClick={onToggleActive}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${alumni.is_active ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100" : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"}`}>
                <CheckCircle size={11}/> {alumni.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>
            {alumni.notes && <div className="mt-2 bg-slate-50 rounded-lg p-2 border border-slate-100"><p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Notes</p><p className="text-slate-500">{alumni.notes}</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
type Tab = "list" | "trash";

export default function AlumniManagement() {
  const [tab, setTab] = useState<Tab>("list");
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, verified: 0, trashed: 0, newsletter: 0, employed: 0, studying: 0, by_status: {}, by_year: {} });
  const [masters, setMasters] = useState<MasterData>({ statuses: [], streams: [], boards: [], genders: [], industries: [], bloodGroups: [], passingYears: [] });
  const [loading, setLoading] = useState(false);
  const [alumni, setAlumni] = useState<AlumniRecord[]>([]);
  const [selected, setSelected] = useState<number[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState<Option | null>(null);
  const [filterStatus, setFilterStatus] = useState<Option | null>(null);
  const [filterStream, setFilterStream] = useState<Option | null>(null);
  const [filterVerified, setFilterVerified] = useState<Option | null>(null);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<AlumniRecord | null>(null);
  const [showPromote, setShowPromote] = useState(false);
  const [detailRecord, setDetailRecord] = useState<AlumniRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get("/alumni/masters").then(r => { if (r.data.success) setMasters(r.data.data); });
    fetchStats();
  }, []);

  const fetchStats = () => { api.get("/alumni/stats").then(r => { if (r.data.success) setStats(r.data.data); }); };

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (tab === "trash") params.only_trashed = true;
      if (search) params.search = search;
      if (filterYear) params.passing_year = filterYear.value;
      if (filterStatus) params.current_status = filterStatus.value;
      if (filterStream) params.stream = filterStream.value;
      if (filterVerified) params.is_verified = filterVerified.value;
      const r = await api.get("/alumni", { params });
      if (r.data.success) { setAlumni(r.data.data); setSelected([]); }
    } catch { toast.error("Failed to load alumni"); }
    setLoading(false);
  }, [tab, search, filterYear, filterStatus, filterStream, filterVerified]);

  useEffect(() => { fetchAlumni(); }, [fetchAlumni]);

  // Actions
  const deleteAlumni = async (id: number) => {
    if (!confirm("Move this alumni to trash?")) return;
    try { await api.delete(`/alumni/${id}`); toast.success("Moved to trash"); fetchAlumni(); fetchStats(); }
    catch { toast.error("Failed"); }
  };
  const restoreAlumni = async (id: number) => {
    try { await api.post(`/alumni/restore/${id}`); toast.success("Restored"); fetchAlumni(); fetchStats(); }
    catch { toast.error("Restore failed"); }
  };
  const forceDelete = async (id: number) => {
    if (!confirm("Permanently delete? Cannot be undone!")) return;
    try { await api.delete(`/alumni/${id}/force`); toast.success("Permanently deleted"); fetchAlumni(); fetchStats(); }
    catch { toast.error("Failed"); }
  };
  const toggleActive = async (id: number) => {
    try { await api.patch(`/alumni/${id}/toggle-active`); fetchAlumni(); fetchStats(); if (detailRecord?.id === id) { const r = await api.get(`/alumni/${id}`); if (r.data.success) setDetailRecord(r.data.data); } }
    catch { toast.error("Failed"); }
  };
  const toggleVerified = async (id: number) => {
    try { await api.patch(`/alumni/${id}/toggle-verified`); fetchAlumni(); fetchStats(); if (detailRecord?.id === id) { const r = await api.get(`/alumni/${id}`); if (r.data.success) setDetailRecord(r.data.data); } }
    catch { toast.error("Failed"); }
  };
  const bulkDelete = async (force = false) => {
    if (!selected.length) return;
    const msg = force ? `Permanently delete ${selected.length} alumni?` : `Move ${selected.length} alumni to trash?`;
    if (!confirm(msg)) return;
    try { await api.post("/alumni/bulk-delete", { ids: selected, force }); toast.success("Done"); fetchAlumni(); fetchStats(); }
    catch { toast.error("Bulk action failed"); }
  };
  const bulkRestore = async () => {
    if (!selected.length) return;
    try { await api.post("/alumni/bulk-restore", { ids: selected }); toast.success("Restored"); fetchAlumni(); fetchStats(); }
    catch { toast.error("Failed"); }
  };
  const bulkVerify = async (v: boolean) => {
    if (!selected.length) return;
    try { await api.post("/alumni/bulk-verify", { ids: selected, is_verified: v }); toast.success(`${selected.length} alumni ${v ? "verified" : "unverified"}`); fetchAlumni(); }
    catch { toast.error("Failed"); }
  };
  const handleExport = async () => {
    try {
      const r = await api.get("/alumni/export", { responseType: "blob" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([r.data])); a.download = `alumni_${today()}.csv`; a.click();
      toast.success("Exported!");
    } catch { toast.error("Export failed"); }
  };
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
      const r = await api.post("/alumni/bulk-import", { data: rows });
      toast.dismiss(tid); toast.success(r.data.message); fetchAlumni(); fetchStats();
    } catch (err: any) { toast.dismiss(tid); toast.error(err.response?.data?.message ?? "Import failed"); }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const downloadSample = () => {
    const csv = "first_name,last_name,admission_number,passing_year,last_class,stream,board,percentage,gender,dob,mobile,email,city,state,current_status,current_employer,current_designation,industry,is_active,is_verified,wants_newsletter\nRohan,Sharma,ADM/2018/001,2024,Class 12,Science,CBSE,87.5,Male,2006-03-15,9876543210,rohan@example.com,Mumbai,Maharashtra,employed,TCS Ltd,Software Engineer,Technology,yes,yes,yes\n";
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = "alumni_sample.csv"; a.click();
    toast.success("Sample downloaded");
  };

  // Select
  const toggleSel = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(selected.length === alumni.length ? [] : alumni.map(a => a.id));

  const inTrash = tab === "trash";
  const strOpts = (arr: string[]) => arr.map(v => ({ value: v, label: v }));

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      {/* Modals */}
      <AlumniFormModal open={showForm} onClose={() => { setShowForm(false); setEditRecord(null); }}
        onSaved={() => { fetchAlumni(); fetchStats(); }} record={editRecord} masters={masters}/>
      <PromoteModal open={showPromote} onClose={() => setShowPromote(false)}
        onSaved={() => { fetchAlumni(); fetchStats(); }} masters={masters}/>
      {detailRecord && (
        <AlumniDetail alumni={detailRecord} onClose={() => setDetailRecord(null)}
          onEdit={() => { setEditRecord(detailRecord); setShowForm(true); setDetailRecord(null); }}
          onToggleActive={() => toggleActive(detailRecord.id)}
          onToggleVerified={() => toggleVerified(detailRecord.id)}/>
      )}

      {/* ── Header ── */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {inTrash && <button onClick={() => setTab("list")} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft size={14}/></button>}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <Users size={16} className="text-white"/>
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-800">{inTrash ? "Trash — Alumni" : "Alumni Management Hub"}</h1>
            <p className="text-[10px] text-slate-400">{inTrash ? "Restore or permanently remove alumni records" : "Manage graduate network, track achievements & career paths"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!inTrash && (
            <>
              <button onClick={downloadSample} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold">Sample</button>
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold"><Upload size={12}/> Import</button>
              <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-semibold"><Download size={12}/> Export</button>
              <button onClick={() => setTab("trash")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold relative">
                <Trash2 size={12}/> Trash
                {stats.trashed > 0 && <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">{stats.trashed}</span>}
              </button>
              <button onClick={() => setShowPromote(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 text-[11px] font-semibold">
                <UserPlus size={12}/> Promote Student
              </button>
              <button onClick={() => { setEditRecord(null); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-sm">
                <Plus size={12}/> Add Alumni
              </button>
            </>
          )}
          {inTrash && selected.length > 0 && (
            <>
              <button onClick={bulkRestore} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100"><RotateCcw size={11}/> Restore ({selected.length})</button>
              <button onClick={() => bulkDelete(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-semibold hover:bg-rose-100"><Trash2 size={11}/> Delete ({selected.length})</button>
            </>
          )}
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport}/>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      {!inTrash && (
        <div className="flex-shrink-0 px-4 py-2 grid grid-cols-4 lg:grid-cols-8 gap-2">
          <StatCard label="Total Alumni"  value={stats.total}      icon={<Users size={12} className="text-indigo-600"/>}    sub="Registered"           color="bg-indigo-50"  border="border-indigo-500"/>
          <StatCard label="Active"        value={stats.active}     icon={<CheckCircle size={12} className="text-emerald-600"/>} sub="Active profiles"    color="bg-emerald-50" border="border-emerald-400"/>
          <StatCard label="Verified"      value={stats.verified}   icon={<Shield size={12} className="text-blue-600"/>}     sub="Admin-verified"       color="bg-blue-50"    border="border-blue-400"/>
          <StatCard label="Employed"      value={stats.employed}   icon={<Briefcase size={12} className="text-teal-600"/>}   sub="Working"             color="bg-teal-50"    border="border-teal-400"/>
          <StatCard label="Studying"      value={stats.studying}   icon={<BookOpen size={12} className="text-amber-600"/>}   sub="Higher education"   color="bg-amber-50"   border="border-amber-400"/>
          <StatCard label="Newsletter"    value={stats.newsletter} icon={<Rss size={12} className="text-violet-600"/>}      sub="Subscribed"          color="bg-violet-50"  border="border-violet-400"/>
          <StatCard label="In Trash"      value={stats.trashed}    icon={<Trash2 size={12} className="text-rose-500"/>}     sub="To restore/delete"   color="bg-rose-50"    border="border-rose-400"/>
          <StatCard label="Top Batch"     value={Object.entries(stats.by_year)[0]?.[0] ?? "—"} icon={<Award size={12} className="text-slate-500"/>} sub={`${Object.entries(stats.by_year)[0]?.[1] ?? 0} alumni`} color="bg-slate-100" border="border-slate-300"/>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex-shrink-0 px-4 py-2 flex items-center gap-2 flex-wrap bg-white border-b border-slate-50">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, employer, mobile…"
            className="w-full pl-7 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg outline-none focus:border-indigo-400 bg-white"/>
        </div>
        <div className="w-28">
          <Select options={masters.passingYears as any} value={filterYear} onChange={o => setFilterYear(o as any)} placeholder="All Years" isClearable styles={selSm}/>
        </div>
        <div className="w-36">
          <Select options={masters.statuses as any} value={filterStatus} onChange={o => setFilterStatus(o as any)} placeholder="All Status" isClearable styles={selSm}/>
        </div>
        <div className="w-28">
          <Select options={strOpts(masters.streams) as any} value={filterStream} onChange={o => setFilterStream(o as any)} placeholder="Stream" isClearable styles={selSm}/>
        </div>
        <div className="w-28">
          <Select options={[{ value: "1", label: "Verified" }, { value: "0", label: "Unverified" }]} value={filterVerified}
            onChange={o => setFilterVerified(o as any)} placeholder="Verification" isClearable styles={selSm}/>
        </div>
        {!inTrash && selected.length > 0 && (
          <div className="flex gap-1">
            <button onClick={() => bulkDelete(false)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] hover:bg-slate-50 font-semibold"><Trash2 size={11} className="inline mr-1"/>Trash ({selected.length})</button>
            <button onClick={() => bulkVerify(true)} className="px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 text-[11px] hover:bg-emerald-50 font-semibold"><Shield size={11} className="inline mr-1"/>Verify ({selected.length})</button>
          </div>
        )}
        <button onClick={fetchAlumni} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""}/>
        </button>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto px-4 pb-2">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full min-w-[900px]">
            <thead className={`border-b ${inTrash ? "bg-rose-50 border-rose-100" : "bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-100"}`}>
              <tr>
                <th className="px-3 py-2">
                  <button onClick={toggleAll} className="text-slate-400 hover:text-indigo-600">
                    {selected.length === alumni.length && alumni.length > 0 ? <CheckSquare size={13} className="text-indigo-600"/> : <Square size={13}/>}
                  </button>
                </th>
                {["Alumni", "Batch Year", "Academic", "Current Status", "Contact", "Tags", inTrash ? "Deleted" : "Actions"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-indigo-400"/>
                  <p className="text-[11px] text-slate-400">Loading alumni…</p>
                </td></tr>
              ) : alumni.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3"><Users size={26} className="text-indigo-300"/></div>
                  <p className="text-[13px] font-bold text-slate-400">{inTrash ? "Trash is empty" : "No alumni found"}</p>
                  {!inTrash && <p className="text-[11px] text-slate-400 mt-1">Add an alumni or promote a student above</p>}
                </td></tr>
              ) : alumni.map(a => (
                <tr key={a.id} className={`border-b border-slate-50 hover:bg-indigo-50/10 transition-colors cursor-pointer ${selected.includes(a.id) ? "bg-indigo-50/30" : ""}`}
                  onClick={() => !inTrash && setDetailRecord(a)}>
                  <td className="px-3 py-2" onClick={e => { e.stopPropagation(); toggleSel(a.id); }}>
                    <button className="text-slate-400 hover:text-indigo-600">
                      {selected.includes(a.id) ? <CheckSquare size={13} className="text-indigo-600"/> : <Square size={13}/>}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <AlumniAvatar name={a.full_name}/>
                      <div>
                        <p className="text-[11px] font-bold text-slate-800">{a.full_name}</p>
                        <p className="text-[9px] text-slate-400">{a.admission_number ?? "No Adm. #"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      {a.passing_year ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <p className="text-[10px] text-slate-500">{[a.last_class, a.stream].filter(Boolean).join(" · ") || "—"}</p>
                    {a.final_percentage ? <p className="text-[9px] text-emerald-600 font-bold">{a.final_percentage}%</p> : null}
                  </td>
                  <td className="px-3 py-2">
                    {a.current_status ? <StatusBadge status={a.current_status}/> : <span className="text-[10px] text-slate-400">—</span>}
                    {(a.current_employer || a.current_institution) && (
                      <p className="text-[9px] text-slate-400 mt-0.5 max-w-[120px] truncate">{a.current_employer ?? a.current_institution}</p>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {a.mobile && <p className="text-[10px] text-slate-500 flex items-center gap-1"><Phone size={9}/> {a.mobile}</p>}
                    {a.email && <p className="text-[10px] text-slate-400 truncate max-w-[120px] flex items-center gap-1"><Mail size={9}/> {a.email}</p>}
                    {!a.mobile && !a.email && <span className="text-[10px] text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 flex-wrap">
                      {a.is_verified && <span className="flex items-center gap-0.5 text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold border border-emerald-200"><Shield size={8}/> Verified</span>}
                      {!a.is_active && <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold border border-slate-200">Inactive</span>}
                      {a.wants_newsletter && <span className="text-[9px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded-full font-bold border border-violet-100"><Rss size={8} className="inline"/></span>}
                    </div>
                  </td>
                  <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {!inTrash ? (
                        <>
                          <button onClick={() => { setEditRecord(a); setShowForm(true); }} className="p-1 rounded hover:bg-slate-100 text-slate-500" title="Edit"><Edit2 size={11}/></button>
                          <button onClick={() => toggleVerified(a.id)} className={`p-1 rounded ${a.is_verified ? "hover:bg-slate-100 text-slate-400" : "hover:bg-emerald-100 text-emerald-600"}`} title={a.is_verified ? "Unverify" : "Verify"}><Shield size={11}/></button>
                          <button onClick={() => deleteAlumni(a.id)} className="p-1 rounded hover:bg-rose-100 text-rose-500" title="Trash"><Trash2 size={11}/></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => restoreAlumni(a.id)} className="p-1 rounded hover:bg-emerald-100 text-emerald-600" title="Restore"><RotateCcw size={11}/></button>
                          <button onClick={() => forceDelete(a.id)} className="p-1 rounded hover:bg-rose-100 text-rose-500" title="Delete Forever"><Trash2 size={11}/></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] text-slate-400">{alumni.length} alumni{selected.length > 0 && ` · ${selected.length} selected`}</p>
          {!inTrash && (
            <div className="flex gap-2">
              {Object.entries(stats.by_year).slice(0, 4).map(([year, count]) => (
                <button key={year} onClick={() => setFilterYear({ value: year, label: year })}
                  className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold hover:bg-indigo-100 transition-colors">
                  {year} ({count})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
