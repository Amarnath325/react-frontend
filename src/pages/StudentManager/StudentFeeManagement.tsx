import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, RefreshCw, Plus, Check, X, Trash2,
  CheckSquare, Square, Download, Edit2, Upload,
  CreditCard, DollarSign, TrendingUp, Clock,
  ArrowLeft, Receipt, Wallet, AlertCircle, CheckCircle,
  BookOpen, Users, RotateCcw,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import Select from "react-select";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FeeStructure {
  id: number; academic_year_id: number | null; academic_year: string;
  class_id: number; class_name: string; fee_head: number; fee_head_label: string;
  amount: number; frequency: number; frequency_label: string;
  due_date: string | null; late_fee_amount: number; is_optional: boolean; is_active: boolean;
  deleted_at?: string | null;
}
interface Payment {
  id: number; receipt_number: string; student_id: number; student_name: string;
  admission_number: string; class_name: string; section: string;
  fee_structure_id: number | null; fee_head_label: string; frequency_label: string;
  academic_year_id: number | null; academic_year: string;
  amount: number; payment_date: string | null; payment_mode: string;
  payment_status: string; transaction_id: string | null;
  cheque_number: string | null; bank_name: string | null;
  payment_for_month: string | null; remarks: string | null;
  deleted_at?: string | null;
}
interface Stats {
  total_structures: number; active_structures: number; trashed_structures: number;
  total_collected: number; total_payments: number; paid_count: number;
  pending_count: number; overdue_count: number; partial_count: number;
  trashed_payments: number; this_month: number;
}
interface MasterData {
  classes: Option[]; feeTypes: Option[]; feeFrequencies: Option[];
  academicYears: Option[]; paymentModes: string[];
}
interface Option { value: number | string; label: string; [k: string]: any; }

// ─── Style helpers ────────────────────────────────────────────────────────────
const PAY_STATUS: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  "paid":    { color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200", icon: <CheckCircle size={9}/> },
  "partial": { color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200",   icon: <Clock size={9}/> },
  "pending": { color: "text-slate-500",   bg: "bg-slate-100",   border: "border-slate-300",   icon: <Clock size={9}/> },
  "overdue": { color: "text-rose-700",    bg: "bg-rose-50",     border: "border-rose-200",    icon: <AlertCircle size={9}/> },
  "waived":  { color: "text-violet-700",  bg: "bg-violet-50",   border: "border-violet-200",  icon: <Check size={9}/> },
};

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtAmt = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
const today  = () => new Date().toISOString().split("T")[0];

const selSm = {
  control: (b: any) => ({ ...b, minHeight: 28, fontSize: 11, borderColor: "#e5e7eb", boxShadow: "none", "&:hover": { borderColor: "#7c3aed" } }),
  menu:    (b: any) => ({ ...b, fontSize: 11, zIndex: 50 }),
  option:  (b: any, s: any) => ({ ...b, fontSize: 11, padding: "4px 10px", background: s.isSelected ? "#7c3aed" : s.isFocused ? "#f5f3ff" : "white", color: s.isSelected ? "white" : "#1e293b" }),
  singleValue: (b: any) => ({ ...b, color: "#334155", fontSize: 11 }),
  dropdownIndicator: (b: any) => ({ ...b, padding: "0 4px" }),
  valueContainer: (b: any) => ({ ...b, padding: "0 8px" }),
  indicatorSeparator: () => ({ display: "none" }),
  menuPortal: (b: any) => ({ ...b, zIndex: 9999 }),
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = PAY_STATUS[status] ?? PAY_STATUS.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.icon}{status}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
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

// ─── Fee Structure Modal ──────────────────────────────────────────────────────
function StructureModal({ open, onClose, onSaved, record, masters }: {
  open: boolean; onClose: () => void; onSaved: () => void; record: FeeStructure | null; masters: MasterData;
}) {
  const [form, setForm] = useState({ academic_year_id: "" as any, class_id: "" as any, fee_head: "" as any, amount: "", frequency: "" as any, due_date: "", late_fee_amount: "0", is_optional: false, is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (record) {
      setForm({
        academic_year_id: record.academic_year_id ?? "",
        class_id: record.class_id, fee_head: record.fee_head,
        amount: String(record.amount), frequency: record.frequency,
        due_date: record.due_date ?? "", late_fee_amount: String(record.late_fee_amount),
        is_optional: record.is_optional, is_active: record.is_active,
      });
    } else {
      setForm({ academic_year_id: "", class_id: "", fee_head: "", amount: "", frequency: "", due_date: "", late_fee_amount: "0", is_optional: false, is_active: true });
    }
  }, [open, record]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.class_id || !form.fee_head || !form.amount || !form.frequency) { toast.error("Fill all required fields"); return; }
    setSaving(true);
    try {
      const payload = {
        academic_year_id: form.academic_year_id || null,
        class_id: Number(form.class_id), fee_head: Number(form.fee_head),
        amount: Number(form.amount), frequency: Number(form.frequency),
        due_date: form.due_date || null, late_fee_amount: Number(form.late_fee_amount) || 0,
        is_optional: form.is_optional, is_active: form.is_active,
      };
      if (record) {
        await api.put(`/student-fees/structures/${record.id}`, payload);
        toast.success("Structure updated");
      } else {
        await api.post("/student-fees/structures", payload);
        toast.success("Structure created");
      }
      onSaved(); onClose();
    } catch (err: any) { toast.error(err.response?.data?.message ?? "Save failed"); }
    finally { setSaving(false); }
  };

  if (!open) return null;

  const classOpts = masters.classes;
  const feeOpts   = masters.feeTypes;
  const freqOpts  = masters.feeFrequencies;
  const yearOpts  = masters.academicYears;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center"><BookOpen size={14} className="text-white"/></div>
            <div>
              <h2 className="text-[13px] font-extrabold text-white">{record ? "Edit Fee Structure" : "New Fee Structure"}</h2>
              <p className="text-[10px] text-violet-200">Define applicable fee for a class</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"><X size={13} className="text-white"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Academic Year</label>
              <Select options={yearOpts as any} value={yearOpts.find(o => o.value === form.academic_year_id) ?? null}
                onChange={o => set("academic_year_id", o?.value ?? "")} isClearable placeholder="Any year"
                styles={selSm} menuPortalTarget={document.body}/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Class <span className="text-rose-500">*</span></label>
              <Select options={classOpts as any} value={classOpts.find(o => o.value === form.class_id) ?? null}
                onChange={o => set("class_id", o?.value ?? "")} placeholder="Select class"
                styles={selSm} menuPortalTarget={document.body}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Fee Type <span className="text-rose-500">*</span></label>
              <Select options={feeOpts as any} value={feeOpts.find(o => o.value === form.fee_head) ?? null}
                onChange={o => set("fee_head", o?.value ?? "")} placeholder="Select fee type"
                styles={selSm} menuPortalTarget={document.body}/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Frequency <span className="text-rose-500">*</span></label>
              <Select options={freqOpts as any} value={freqOpts.find(o => o.value === form.frequency) ?? null}
                onChange={o => set("frequency", o?.value ?? "")} placeholder="Select frequency"
                styles={selSm} menuPortalTarget={document.body}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Amount (₹) <span className="text-rose-500">*</span></label>
              <input type="number" min={1} value={form.amount} onChange={e => set("amount", e.target.value)}
                placeholder="e.g. 5000" className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-violet-400"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Late Fee (₹)</label>
              <input type="number" min={0} value={form.late_fee_amount} onChange={e => set("late_fee_amount", e.target.value)}
                placeholder="0" className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-violet-400"/>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Due Date</label>
            <input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)}
              className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-violet-400"/>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 cursor-pointer">
              <input type="checkbox" checked={form.is_optional} onChange={e => set("is_optional", e.target.checked)} className="accent-violet-600"/>
              Optional Fee
            </label>
            <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} className="accent-violet-600"/>
              Active
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <RefreshCw size={11} className="animate-spin"/> : <Check size={11}/>}
              {record ? "Update" : "Create Structure"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({ open, onClose, onSaved, record, masters }: {
  open: boolean; onClose: () => void; onSaved: () => void; record: Payment | null; masters: MasterData;
}) {
  const [form, setForm] = useState({
    student_id: null as number | null, fee_structure_id: null as number | null,
    academic_year_id: null as number | null,
    amount: "", payment_date: today(), payment_mode: "Cash",
    payment_status: "paid", transaction_id: "", cheque_number: "", bank_name: "",
    payment_for_month: "", remarks: "",
  });
  const [saving, setSaving] = useState(false);
  const [studentOpts, setStudentOpts] = useState<Option[]>([]);
  const [structureOpts, setStructureOpts] = useState<Option[]>([]);
  const [searchingStudents, setSearchingStudents] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (record) {
      setForm({
        student_id: record.student_id, fee_structure_id: record.fee_structure_id,
        academic_year_id: record.academic_year_id,
        amount: String(record.amount), payment_date: record.payment_date ?? today(),
        payment_mode: record.payment_mode, payment_status: record.payment_status,
        transaction_id: record.transaction_id ?? "", cheque_number: record.cheque_number ?? "",
        bank_name: record.bank_name ?? "", payment_for_month: record.payment_for_month ?? "",
        remarks: record.remarks ?? "",
      });
      if (record.student_name) {
        setStudentOpts([{ value: record.student_id, label: `${record.student_name} (${record.admission_number})` }]);
      }
    } else {
      setForm({ student_id: null, fee_structure_id: null, academic_year_id: null, amount: "", payment_date: today(), payment_mode: "Cash", payment_status: "paid", transaction_id: "", cheque_number: "", bank_name: "", payment_for_month: "", remarks: "" });
      setStudentOpts([]);
      setStructureOpts([]);
    }
  }, [open, record]);

  const searchStudents = async (query: string) => {
    if (!query || query.length < 1) return;
    setSearchingStudents(true);
    try {
      const r = await api.get("/student-fees/students/search", { params: { search: query } });
      setStudentOpts(r.data.data ?? []);
    } catch {}
    setSearchingStudents(false);
  };

  const handleStudentChange = async (opt: any) => {
    setForm(f => ({ ...f, student_id: opt?.value ?? null, fee_structure_id: null }));
    setStructureOpts([]);
    if (opt?.value && opt.class_id) {
      try {
        const r = await api.get(`/school/fee-structures/by-class/${opt.class_id}`);
        setStructureOpts((r.data.data ?? []).map((s: any) => ({ value: s.id, label: `${s.feeHead?.m_name ?? s.fee_head_label} — ₹${s.amount} (${s.frequencyMaster?.m_name ?? s.frequency_label})`, amount: s.amount })));
      } catch {}
    }
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id) { toast.error("Select a student"); return; }
    if (!form.amount)     { toast.error("Enter amount"); return; }
    setSaving(true);
    try {
      const payload = {
        student_id: form.student_id, fee_structure_id: form.fee_structure_id || null,
        academic_year_id: form.academic_year_id || null,
        amount: Number(form.amount), payment_date: form.payment_date,
        payment_mode: form.payment_mode, payment_status: form.payment_status,
        transaction_id: form.transaction_id || null, cheque_number: form.cheque_number || null,
        bank_name: form.bank_name || null, payment_for_month: form.payment_for_month || null,
        remarks: form.remarks || null,
      };
      if (record) {
        await api.put(`/student-fees/payments/${record.id}`, payload);
        toast.success("Payment updated");
      } else {
        await api.post("/student-fees/payments", payload);
        toast.success("Payment recorded!");
      }
      onSaved(); onClose();
    } catch (err: any) { toast.error(err.response?.data?.message ?? "Save failed"); }
    finally { setSaving(false); }
  };

  if (!open) return null;

  const statusOpts = ["paid","pending","partial","overdue","waived"].map(s => ({ value: s, label: s.charAt(0).toUpperCase()+s.slice(1) }));
  const modeOpts   = masters.paymentModes.map(m => ({ value: m, label: m }));
  const yearOpts   = masters.academicYears;
  const selStudent = studentOpts.find(o => o.value === form.student_id) ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center"><Receipt size={14} className="text-white"/></div>
            <div>
              <h2 className="text-[13px] font-extrabold text-white">{record ? "Edit Payment" : "Record Fee Payment"}</h2>
              <p className="text-[10px] text-violet-200">{record ? `Receipt: ${record.receipt_number}` : "Collect and record student fee payment"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"><X size={13} className="text-white"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-3.5 space-y-2.5">
          {/* Student */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Student <span className="text-rose-500">*</span></label>
            <Select options={studentOpts as any} value={selStudent} onInputChange={searchStudents}
              onChange={handleStudentChange} isLoading={searchingStudents}
              placeholder="Search student by name or admission no…" isDisabled={!!record}
              styles={selSm} menuPortalTarget={document.body}/>
          </div>
          {/* Fee Structure + Academic Year */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Fee Type (optional)</label>
              <Select options={structureOpts as any} value={structureOpts.find(o => o.value === form.fee_structure_id) ?? null}
                onChange={o => { set("fee_structure_id", o?.value ?? null); if (o?.amount) set("amount", String(o.amount)); }} isClearable
                placeholder="Select fee type…" styles={selSm} menuPortalTarget={document.body}/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Academic Year</label>
              <Select options={yearOpts as any} value={yearOpts.find(o => o.value === form.academic_year_id) ?? null}
                onChange={o => set("academic_year_id", o?.value ?? null)} isClearable
                styles={selSm} menuPortalTarget={document.body}/>
            </div>
          </div>
          {/* Amount + Date + Mode */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Amount (₹) <span className="text-rose-500">*</span></label>
              <input type="number" min={1} value={form.amount} onChange={e => set("amount", e.target.value)}
                placeholder="e.g. 5000" className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-violet-400"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Payment Date <span className="text-rose-500">*</span></label>
              <input type="date" value={form.payment_date} onChange={e => set("payment_date", e.target.value)}
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-violet-400"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Payment Mode <span className="text-rose-500">*</span></label>
              <Select options={modeOpts as any} value={modeOpts.find(o => o.value === form.payment_mode) ?? null}
                onChange={o => set("payment_mode", o?.value ?? "Cash")}
                styles={selSm} menuPortalTarget={document.body}/>
            </div>
          </div>
          {/* Status + Month + Transaction */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Status</label>
              <Select options={statusOpts} value={statusOpts.find(o => o.value === form.payment_status) ?? null}
                onChange={o => set("payment_status", o?.value ?? "paid")}
                styles={selSm} menuPortalTarget={document.body}/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Payment For Month</label>
              <input value={form.payment_for_month} onChange={e => set("payment_for_month", e.target.value)}
                placeholder="e.g. April 2024"
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-violet-400"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Transaction ID / UTR</label>
              <input value={form.transaction_id} onChange={e => set("transaction_id", e.target.value)}
                placeholder="UTR / Ref No."
                className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-violet-400"/>
            </div>
          </div>
          {/* Cheque fields (show if mode is Cheque/DD) */}
          {(form.payment_mode === "Cheque" || form.payment_mode === "DD") && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Cheque Number</label>
                <input value={form.cheque_number} onChange={e => set("cheque_number", e.target.value)}
                  className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-violet-400"/>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Bank Name</label>
                <input value={form.bank_name} onChange={e => set("bank_name", e.target.value)}
                  className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-violet-400"/>
              </div>
            </div>
          )}
          {/* Remarks */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Remarks</label>
            <input value={form.remarks} onChange={e => set("remarks", e.target.value)} placeholder="Any notes…"
              className="w-full text-[11px] border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-violet-400"/>
          </div>
          <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <RefreshCw size={11} className="animate-spin"/> : <Check size={11}/>}
              {record ? "Update Payment" : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentFeeManagement() {
  const [tab, setTab] = useState<"payments" | "structures" | "trash_payments" | "trash_structures">("payments");
  const [stats, setStats] = useState<Stats>({ total_structures: 0, active_structures: 0, trashed_structures: 0, total_collected: 0, total_payments: 0, paid_count: 0, pending_count: 0, overdue_count: 0, partial_count: 0, trashed_payments: 0, this_month: 0 });
  const [masters, setMasters] = useState<MasterData>({ classes: [], feeTypes: [], feeFrequencies: [], academicYears: [], paymentModes: [] });
  const [loading, setLoading] = useState(false);

  // Payments tab state
  const [payments, setPayments]   = useState<Payment[]>([]);
  const [filterPayStatus, setFilterPayStatus] = useState<Option | null>(null);
  const [filterPayMode, setFilterPayMode]     = useState<Option | null>(null);
  const [paySearch, setPaySearch] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [editPayment, setEditPayment]   = useState<Payment | null>(null);
  const [selPay, setSelPay] = useState<number[]>([]);

  // Structures tab state
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [filterClass, setFilterClass] = useState<Option | null>(null);
  const [filterActive, setFilterActive] = useState<Option | null>(null);
  const [showStructModal, setShowStructModal] = useState(false);
  const [editStruct, setEditStruct] = useState<FeeStructure | null>(null);
  const [selStruct, setSelStruct] = useState<number[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get("/student-fees/masters").then(r => { if (r.data.success) setMasters(r.data.data); });
    refreshStats();
  }, []);

  const refreshStats = () => {
    api.get("/student-fees/stats").then(r => { if (r.data.success) setStats(r.data.data); });
  };

  // Payments
  const fetchPayments = useCallback(async (isTrashed = false) => {
    setLoading(true);
    try {
      const params: any = {};
      if (paySearch) params.search = paySearch;
      if (filterPayStatus) params.payment_status = filterPayStatus.value;
      if (filterPayMode)   params.payment_mode   = filterPayMode.value;
      if (isTrashed)       params.only_trashed   = true;
      const r = await api.get("/student-fees/payments", { params });
      if (r.data.success) { setPayments(r.data.data); setSelPay([]); }
    } catch { toast.error("Failed to load payments"); }
    setLoading(false);
  }, [paySearch, filterPayStatus, filterPayMode]);

  useEffect(() => {
    if (tab === "payments") fetchPayments(false);
    else if (tab === "trash_payments") fetchPayments(true);
  }, [paySearch, filterPayStatus, filterPayMode, tab, fetchPayments]);

  // Structures
  const fetchStructures = useCallback(async (isTrashed = false) => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterClass)  params.class_id  = filterClass.value;
      if (filterActive) params.is_active  = filterActive.value;
      if (isTrashed)    params.only_trashed = true;
      const r = await api.get("/student-fees/structures", { params });
      if (r.data.success) { setStructures(r.data.data); setSelStruct([]); }
    } catch { toast.error("Failed to load structures"); }
    setLoading(false);
  }, [filterClass, filterActive]);

  useEffect(() => {
    if (tab === "structures") fetchStructures(false);
    else if (tab === "trash_structures") fetchStructures(true);
  }, [filterClass, filterActive, tab, fetchStructures]);

  // Actions — Payments
  const deletePayment = async (id: number) => {
    if (!confirm("Move this payment record to trash?")) return;
    try { await api.delete(`/student-fees/payments/${id}`); toast.success("Moved to trash"); refreshTab(); refreshStats(); }
    catch { toast.error("Action failed"); }
  };

  const restorePayment = async (id: number) => {
    try { await api.post(`/student-fees/payments/restore/${id}`); toast.success("Restored payment"); refreshTab(); refreshStats(); }
    catch { toast.error("Restore failed"); }
  };

  const forceDeletePayment = async (id: number) => {
    if (!confirm("Permanently delete this payment record? This cannot be undone!")) return;
    try { await api.delete(`/student-fees/payments/${id}/force`); toast.success("Permanently deleted"); refreshTab(); refreshStats(); }
    catch { toast.error("Action failed"); }
  };

  const exportPayments = async () => {
    try {
      const r = await api.get("/student-fees/payments/export", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement("a"); a.href = url; a.download = `fee_payments_${today()}.csv`; a.click();
      toast.success("Export ready");
    } catch { toast.error("Export failed"); }
  };

  // Actions — Structures
  const deleteStructure = async (id: number) => {
    if (!confirm("Move this structure to trash?")) return;
    try { await api.delete(`/student-fees/structures/${id}`); toast.success("Moved to trash"); refreshTab(); refreshStats(); }
    catch (err: any) { toast.error(err.response?.data?.message ?? "Action failed"); }
  };

  const restoreStructure = async (id: number) => {
    try { await api.post(`/student-fees/structures/restore/${id}`); toast.success("Restored structure"); refreshTab(); refreshStats(); }
    catch { toast.error("Restore failed"); }
  };

  const forceDeleteStructure = async (id: number) => {
    if (!confirm("Permanently delete this structure? This cannot be undone!")) return;
    try { await api.delete(`/student-fees/structures/${id}/force`); toast.success("Permanently deleted"); refreshTab(); refreshStats(); }
    catch { toast.error("Action failed"); }
  };

  const toggleStructure = async (id: number) => {
    try { await api.patch(`/student-fees/structures/${id}/toggle`); refreshTab(); refreshStats(); }
    catch { toast.error("Toggle failed"); }
  };

  const exportStructures = async () => {
    try {
      const r = await api.get("/student-fees/structures/export", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement("a"); a.href = url; a.download = `fee_structures_${today()}.csv`; a.click();
      toast.success("Export ready");
    } catch { toast.error("Export failed"); }
  };

  // Bulk Actions
  const handleBulkDelete = async () => {
    const isPay = tab === "payments" || tab === "trash_payments";
    const selectedList = isPay ? selPay : selStruct;
    if (!selectedList.length) return;
    const isTrash = tab === "trash_payments" || tab === "trash_structures";
    const msg = isTrash ? `Permanently delete ${selectedList.length} item(s)?` : `Move ${selectedList.length} item(s) to trash?`;
    if (!confirm(msg)) return;

    try {
      const endpoint = isPay ? "/student-fees/payments/bulk-delete" : "/student-fees/structures/bulk-delete";
      await api.post(endpoint, { ids: selectedList, force: isTrash });
      toast.success("Processed successfully");
      refreshTab();
      refreshStats();
    } catch { toast.error("Bulk action failed"); }
  };

  const handleBulkRestore = async () => {
    const isPay = tab === "trash_payments";
    const selectedList = isPay ? selPay : selStruct;
    if (!selectedList.length) return;

    try {
      const endpoint = isPay ? "/student-fees/payments/bulk-restore" : "/student-fees/structures/bulk-restore";
      await api.post(endpoint, { ids: selectedList });
      toast.success("Restored successfully");
      refreshTab();
      refreshStats();
    } catch { toast.error("Restore failed"); }
  };

  const refreshTab = () => {
    if (tab === "payments") fetchPayments(false);
    else if (tab === "trash_payments") fetchPayments(true);
    else if (tab === "structures") fetchStructures(false);
    else if (tab === "trash_structures") fetchStructures(true);
  };

  // File Import Handlers
  const triggerImport = () => fileInputRef.current?.click();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPay = tab === "payments" || tab === "trash_payments";
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    if (lines.length < 2) { toast.error("CSV has no data rows"); return; }

    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1).map(line => {
      const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      return Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? ""]));
    });

    const tid = toast.loading("Uploading CSV data…");
    try {
      const endpoint = isPay ? "/student-fees/payments/bulk-import" : "/student-fees/structures/bulk-import";
      const r = await api.post(endpoint, { data: rows });
      toast.dismiss(tid);
      if (r.data.success) {
        toast.success(r.data.message);
        refreshTab();
        refreshStats();
      } else {
        toast.error("Import failed");
      }
    } catch (err: any) {
      toast.dismiss(tid);
      toast.error(err.response?.data?.message ?? "Bulk import failed");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadSample = () => {
    const isPay = tab === "payments" || tab === "trash_payments";
    let csv = "";
    let name = "";
    if (isPay) {
      csv = "reference_code,fee_head,amount,payment_date,payment_mode,payment_status,transaction_id,remarks\nADM001,Admission Fee,5000,2024-06-01,Cash,paid,,Enrolled fee\n";
      name = "fee_payments_sample.csv";
    } else {
      csv = "academic_year,class_name,fee_head,amount,frequency,due_date,late_fee_amount,is_optional,is_active\n2024-2025,Class 1,Tuition Fee,3000,monthly,2024-06-10,100,no,yes\n";
      name = "fee_structures_sample.csv";
    }
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = name;
    a.click();
    toast.success("Sample template downloaded");
  };

  // Select helpers
  const togglePaySel   = (id: number) => setSelPay(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAllPay   = () => setSelPay(selPay.length === payments.length ? [] : payments.map(p => p.id));
  const toggleStructSel= (id: number) => setSelStruct(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAllStruct= () => setSelStruct(selStruct.length === structures.length ? [] : structures.map(s => s.id));

  const statusOpts = ["paid","pending","partial","overdue","waived"].map(s => ({ value: s, label: s.charAt(0).toUpperCase()+s.slice(1) }));
  const modeOpts   = masters.paymentModes.map(m => ({ value: m, label: m }));
  const activeOpts = [{ value: "1", label: "Active" }, { value: "0", label: "Inactive" }];

  const currentSelCount = (tab === "payments" || tab === "trash_payments") ? selPay.length : selStruct.length;
  const inTrashMode = tab === "trash_payments" || tab === "trash_structures";

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <StructureModal open={showStructModal} onClose={() => { setShowStructModal(false); setEditStruct(null); }}
        onSaved={() => { refreshTab(); refreshStats(); }} record={editStruct} masters={masters}/>
      <PaymentModal open={showPayModal} onClose={() => { setShowPayModal(false); setEditPayment(null); }}
        onSaved={() => { refreshTab(); refreshStats(); }} record={editPayment} masters={masters}/>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {inTrashMode && (
            <button onClick={() => setTab(t => t === "trash_payments" ? "payments" : "structures")} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <ArrowLeft size={14}/>
            </button>
          )}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <CreditCard size={16} className="text-white"/>
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-800">
              {inTrashMode ? `Trash Bin — ${tab === "trash_payments" ? "Payments" : "Structures"}` : "Student Fee Management"}
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">
              {inTrashMode ? "Restore or permanently delete removed items" : "Fee structures, payment collection & receipts"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!inTrashMode ? (
            <>
              <button onClick={downloadSample} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold">Sample</button>
              <button onClick={triggerImport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold"><Upload size={12}/> Import</button>
              <button onClick={tab === "structures" ? exportStructures : exportPayments} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 text-[11px] font-semibold"><Download size={12}/> Export</button>
              
              <button onClick={() => setTab(tab === "payments" ? "trash_payments" : "trash_structures")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold">
                <Trash2 size={12}/> Trash {((tab === "payments" ? stats.trashed_payments : stats.trashed_structures) > 0) && (
                  <span className="bg-rose-500 text-white text-[9px] rounded-full px-1.5 py-0.5 font-bold ml-1">
                    {tab === "payments" ? stats.trashed_payments : stats.trashed_structures}
                  </span>
                )}
              </button>
              {tab === "structures" ? (
                <button onClick={() => { setEditStruct(null); setShowStructModal(true); }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold shadow-sm">
                  <Plus size={12}/> Add Structure
                </button>
              ) : (
                <button onClick={() => { setEditPayment(null); setShowPayModal(true); }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold shadow-sm">
                  <Plus size={12}/> Collect Payment
                </button>
              )}
            </>
          ) : (
            currentSelCount > 0 && (
              <>
                <button onClick={handleBulkRestore} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100">
                  <RotateCcw size={11}/> Restore ({currentSelCount})
                </button>
                <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-semibold hover:bg-rose-100">
                  <Trash2 size={11}/> Delete ({currentSelCount})
                </button>
              </>
            )
          )}
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport}/>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      {!inTrashMode && (
        <div className="flex-shrink-0 px-4 py-2 grid grid-cols-3 lg:grid-cols-9 gap-2">
          <StatCard label="Fee Structures"  value={stats.total_structures}  icon={<BookOpen size={12} className="text-violet-600"/>} subtext={`${stats.active_structures} active`} color="bg-violet-50" border="border-violet-500"/>
          <StatCard label="Total Collected" value={fmtAmt(stats.total_collected)} icon={<Wallet size={12} className="text-emerald-600"/>} subtext="All time" color="bg-emerald-50" border="border-emerald-400"/>
          <StatCard label="This Month"      value={fmtAmt(stats.this_month)} icon={<TrendingUp size={12} className="text-teal-600"/>} subtext={new Date().toLocaleDateString("en-IN",{month:"short",year:"numeric"})} color="bg-teal-50" border="border-teal-400"/>
          <StatCard label="Total Payments"  value={stats.total_payments}    icon={<Receipt size={12} className="text-blue-600"/>}    subtext="All records" color="bg-blue-50" border="border-blue-400"/>
          <StatCard label="Paid"            value={stats.paid_count}        icon={<CheckCircle size={12} className="text-emerald-600"/>} subtext="Cleared"  color="bg-emerald-50" border="border-emerald-300"/>
          <StatCard label="Pending"         value={stats.pending_count}     icon={<Clock size={12} className="text-slate-400"/>}      subtext="Not paid"  color="bg-slate-100" border="border-slate-400"/>
          <StatCard label="Partial"         value={stats.partial_count}     icon={<DollarSign size={12} className="text-amber-600"/>} subtext="Part paid" color="bg-amber-50" border="border-amber-400"/>
          <StatCard label="Overdue"         value={stats.overdue_count}     icon={<AlertCircle size={12} className="text-rose-600"/>} subtext="Late"      color="bg-rose-50" border="border-rose-400"/>
          <StatCard label="In Trash"        value={tab === "structures" ? stats.trashed_structures : stats.trashed_payments} icon={<Trash2 size={12} className="text-slate-400"/>} subtext="Soft deleted" color="bg-slate-100" border="border-slate-300"/>
        </div>
      )}

      {/* ── Tab Bar ────────────────────────────────────────────────────────── */}
      {!inTrashMode && (
        <div className="flex-shrink-0 px-4 flex items-center gap-1 border-b border-slate-100 bg-white">
          {(["payments", "structures"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-[11px] font-bold border-b-2 transition-colors ${tab === t ? "border-violet-600 text-violet-700" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
              {t === "payments" ? "💳 Fee Payments" : "📋 Fee Structures"}
            </button>
          ))}
        </div>
      )}

      {/* ── Fee Payments / Trash Payments ──────────────────────────────────── */}
      {(tab === "payments" || tab === "trash_payments") && (
        <>
          <div className="flex-shrink-0 px-4 py-2 flex items-center gap-2 flex-wrap bg-white border-b border-slate-50">
            <div className="relative flex-1 min-w-[160px]">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={paySearch} onChange={e => setPaySearch(e.target.value)} placeholder="Search by name, receipt, transaction…"
                className="w-full pl-7 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg outline-none focus:border-violet-400 bg-white"/>
            </div>
            <div className="w-32">
              <Select options={statusOpts as any} value={filterPayStatus} onChange={o => setFilterPayStatus(o as any)} placeholder="All Status" isClearable styles={selSm}/>
            </div>
            <div className="w-32">
              <Select options={modeOpts as any} value={filterPayMode} onChange={o => setFilterPayMode(o as any)} placeholder="All Modes" isClearable styles={selSm}/>
            </div>
            {selPay.length > 0 && (
              <div className="flex items-center gap-1">
                {inTrashMode ? (
                  <>
                    <button onClick={handleBulkRestore} className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100"><RotateCcw size={11} className="inline mr-1"/>Restore ({selPay.length})</button>
                    <button onClick={handleBulkDelete} className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-semibold hover:bg-rose-100"><Trash2 size={11} className="inline mr-1"/>Delete ({selPay.length})</button>
                  </>
                ) : (
                  <button onClick={handleBulkDelete} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-50"><Trash2 size={11} className="inline mr-1"/>Trash ({selPay.length})</button>
                )}
              </div>
            )}
            <button onClick={refreshTab} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500">
              <RefreshCw size={12} className={loading ? "animate-spin" : ""}/>
            </button>
          </div>
          <div className="flex-1 overflow-auto px-4 pb-2">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full min-w-[900px]">
                <thead className={inTrashMode ? "bg-rose-50/50 border-b border-rose-100" : "bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-violet-100"}>
                  <tr>
                    <th className="px-3 py-2">
                      <button onClick={toggleAllPay} className="text-slate-400 hover:text-violet-600">
                        {selPay.length === payments.length && payments.length > 0 ? <CheckSquare size={13} className="text-violet-600"/> : <Square size={13}/>}
                      </button>
                    </th>
                    {["Receipt No.", "Student", "Class", "Fee Type", "Amount", "Date", "Mode", "Status", inTrashMode ? "Deleted On" : "Month", "Actions"].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={11} className="text-center py-12 text-slate-400">
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2"/>
                      <p className="text-[11px]">Loading payments…</p>
                    </td></tr>
                  ) : payments.length === 0 ? (
                    <tr><td colSpan={11} className="text-center py-12">
                      <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-3">
                        <CreditCard size={22} className="text-violet-300"/>
                      </div>
                      <p className="text-[12px] font-bold text-slate-400">{inTrashMode ? "Trash is empty" : "No payments found"}</p>
                    </td></tr>
                  ) : payments.map(p => (
                    <tr key={p.id} className={`border-b border-slate-50 hover:bg-violet-50/20 transition-colors ${selPay.includes(p.id) ? "bg-violet-50/40" : ""}`}>
                      <td className="px-3 py-2">
                        <button onClick={() => togglePaySel(p.id)} className="text-slate-400 hover:text-violet-600">
                          {selPay.includes(p.id) ? <CheckSquare size={13} className="text-violet-600"/> : <Square size={13}/>}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] font-mono font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">{p.receipt_number}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-[8px] font-black text-white">{(p.student_name || "?").charAt(0)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-700 truncate max-w-[100px]">{p.student_name}</p>
                            <p className="text-[9px] text-slate-400">{p.admission_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[10px] text-slate-500">{p.class_name}{p.section ? ` - ${p.section}` : ""}</td>
                      <td className="px-3 py-2 text-[10px] text-slate-500">{p.fee_head_label}</td>
                      <td className="px-3 py-2">
                        <span className="text-[11px] font-black text-emerald-700">{fmtAmt(p.amount)}</span>
                      </td>
                      <td className="px-3 py-2 text-[10px] text-slate-400">{fmtDate(p.payment_date)}</td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{p.payment_mode}</span>
                      </td>
                      <td className="px-3 py-2"><StatusBadge status={p.payment_status}/></td>
                      <td className="px-3 py-2 text-[10px] text-slate-400">
                        {inTrashMode ? fmtDate(p.deleted_at ?? null) : (p.payment_for_month || "—")}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          {!inTrashMode ? (
                            <>
                              <button onClick={() => { setEditPayment(p); setShowPayModal(true); }} className="p-1 rounded hover:bg-slate-100 text-slate-500" title="Edit"><Edit2 size={11}/></button>
                              <button onClick={() => deletePayment(p.id)} className="p-1 rounded hover:bg-rose-100 text-rose-500" title="Trash"><Trash2 size={11}/></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => restorePayment(p.id)} className="p-1 rounded hover:bg-emerald-100 text-emerald-600" title="Restore"><RotateCcw size={11}/></button>
                              <button onClick={() => forceDeletePayment(p.id)} className="p-1 rounded hover:bg-rose-100 text-rose-500" title="Delete Forever"><Trash2 size={11}/></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[10px] text-slate-400">{payments.length} record{payments.length !== 1 ? "s" : ""}{selPay.length > 0 && ` · ${selPay.length} selected`}</p>
          </div>
        </>
      )}

      {/* ── Fee Structures / Trash Structures ──────────────────────────────── */}
      {(tab === "structures" || tab === "trash_structures") && (
        <>
          <div className="flex-shrink-0 px-4 py-2 flex items-center gap-2 flex-wrap bg-white border-b border-slate-50">
            <div className="w-40">
              <Select options={masters.classes as any} value={filterClass} onChange={o => setFilterClass(o as any)} placeholder="All Classes" isClearable styles={selSm}/>
            </div>
            <div className="w-32">
              <Select options={activeOpts as any} value={filterActive} onChange={o => setFilterActive(o as any)} placeholder="All Status" isClearable styles={selSm}/>
            </div>
            {selStruct.length > 0 && (
              <div className="flex items-center gap-1">
                {inTrashMode ? (
                  <>
                    <button onClick={handleBulkRestore} className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100"><RotateCcw size={11} className="inline mr-1"/>Restore ({selStruct.length})</button>
                    <button onClick={handleBulkDelete} className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-semibold hover:bg-rose-100"><Trash2 size={11} className="inline mr-1"/>Delete ({selStruct.length})</button>
                  </>
                ) : (
                  <button onClick={handleBulkDelete} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-50"><Trash2 size={11} className="inline mr-1"/>Trash ({selStruct.length})</button>
                )}
              </div>
            )}
            <button onClick={refreshTab} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500">
              <RefreshCw size={12} className={loading ? "animate-spin" : ""}/>
            </button>
          </div>
          <div className="flex-1 overflow-auto px-4 pb-2">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full min-w-[820px]">
                <thead className={inTrashMode ? "bg-rose-50/50 border-b border-rose-100" : "bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100"}>
                  <tr>
                    <th className="px-3 py-2">
                      <button onClick={toggleAllStruct} className="text-slate-400 hover:text-violet-600">
                        {selStruct.length === structures.length && structures.length > 0 ? <CheckSquare size={13} className="text-violet-600"/> : <Square size={13}/>}
                      </button>
                    </th>
                    {["Academic Year", "Class", "Fee Type", "Amount", "Frequency", "Late Fee", "Due Date", "Optional", inTrashMode ? "Deleted On" : "Active", "Actions"].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={11} className="text-center py-12 text-slate-400">
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2"/>
                      <p className="text-[11px]">Loading structures…</p>
                    </td></tr>
                  ) : structures.length === 0 ? (
                    <tr><td colSpan={11} className="text-center py-12">
                      <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-3">
                        <BookOpen size={22} className="text-violet-300"/>
                      </div>
                      <p className="text-[12px] font-bold text-slate-400">{inTrashMode ? "Trash is empty" : "No structures found"}</p>
                    </td></tr>
                  ) : structures.map(s => (
                    <tr key={s.id} className={`border-b border-slate-50 hover:bg-violet-50/20 transition-colors ${selStruct.includes(s.id) ? "bg-violet-50/40" : ""}`}>
                      <td className="px-3 py-2">
                        <button onClick={() => toggleStructSel(s.id)} className="text-slate-400 hover:text-violet-600">
                          {selStruct.includes(s.id) ? <CheckSquare size={13} className="text-violet-600"/> : <Square size={13}/>}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-[10px] text-slate-500">{s.academic_year || "Any"}</td>
                      <td className="px-3 py-2">
                        <span className="text-[11px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">{s.class_name}</span>
                      </td>
                      <td className="px-3 py-2 text-[11px] font-semibold text-slate-700">{s.fee_head_label}</td>
                      <td className="px-3 py-2">
                        <span className="text-[11px] font-black text-emerald-700">{fmtAmt(s.amount)}</span>
                      </td>
                      <td className="px-3 py-2 text-[10px] text-slate-500">{s.frequency_label}</td>
                      <td className="px-3 py-2">
                        {s.late_fee_amount > 0 ? <span className="text-[10px] font-semibold text-rose-600">{fmtAmt(s.late_fee_amount)}</span> : <span className="text-[10px] text-slate-300">—</span>}
                      </td>
                      <td className="px-3 py-2 text-[10px] text-slate-400">{fmtDate(s.due_date)}</td>
                      <td className="px-3 py-2">
                        {s.is_optional
                          ? <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">Optional</span>
                          : <span className="text-[10px] text-slate-300">—</span>}
                      </td>
                      <td className="px-3 py-2">
                        {inTrashMode ? (
                          <span className="text-[10px] text-slate-400">{fmtDate(s.deleted_at ?? null)}</span>
                        ) : (
                          <button onClick={() => toggleStructure(s.id)} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${s.is_active ? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100" : "text-slate-400 bg-slate-100 border-slate-200 hover:bg-slate-200"}`}>
                            {s.is_active ? "Active" : "Inactive"}
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          {!inTrashMode ? (
                            <>
                              <button onClick={() => { setEditStruct(s); setShowStructModal(true); }} className="p-1 rounded hover:bg-slate-100 text-slate-500" title="Edit"><Edit2 size={11}/></button>
                              <button onClick={() => deleteStructure(s.id)} className="p-1 rounded hover:bg-rose-100 text-rose-500" title="Trash"><Trash2 size={11}/></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => restoreStructure(s.id)} className="p-1 rounded hover:bg-emerald-100 text-emerald-600" title="Restore"><RotateCcw size={11}/></button>
                              <button onClick={() => forceDeleteStructure(s.id)} className="p-1 rounded hover:bg-rose-100 text-rose-500" title="Delete Forever"><Trash2 size={11}/></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[10px] text-slate-400">{structures.length} structure{structures.length !== 1 ? "s" : ""}{selStruct.length > 0 && ` · ${selStruct.length} selected`}</p>
          </div>
        </>
      )}
    </div>
  );
}
