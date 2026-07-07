import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, User, ArrowRightLeft, FileText, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, RefreshCw, Eye, Printer, Calendar,
  AlertTriangle, School, Stamp, Check, X, Clock, DownloadCloud,
  Building2, Hash, BookOpen, Phone, ClipboardCheck,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface StudentRecord {
  id: number;
  full_name: string;
  admission_number: string;
  roll_number: string;
  class_name: string;
  section: string;
  photo_url: string | null;
  gender: string | null;
  admission_date: string | null;
  category: string | null;
  blood_group: string | null;
  nationality: string | null;
  religion: string | null;
  father_name: string | null;
  father_mobile: string | null;
  mother_name: string | null;
  previous_school: string | null;
  previous_tc_number: string | null;
  previous_tc_date: string | null;
  user: { email: string; mobile: string; is_active: boolean; date_of_birth: string | null } | null;
}

interface MasterOption { value: string | number; label: string; }
type ActiveTab = 'transfer' | 'tc';

// ─── react-select styles ────────────────────────────────────────────────────
const selSm = {
  control: (b: any, s: any) => ({
    ...b, borderRadius: '8px', borderColor: s.isFocused ? '#a855f7' : '#e5e7eb',
    boxShadow: s.isFocused ? '0 0 0 2px rgba(168,85,247,.15)' : 'none',
    minHeight: '32px', height: '32px', '&:hover': { borderColor: '#a855f7' },
  }),
  valueContainer: (b: any) => ({ ...b, padding: '0 10px', height: '32px', display: 'flex', alignItems: 'center' }),
  input: (b: any) => ({ ...b, margin: 0, padding: 0, fontSize: '11px' }),
  placeholder: (b: any) => ({ ...b, fontSize: '11px', color: '#9ca3af' }),
  singleValue: (b: any) => ({ ...b, fontSize: '11px', color: '#111827' }),
  indicatorsContainer: (b: any) => ({ ...b, height: '30px' }),
  option: (b: any, s: any) => ({
    ...b, fontSize: '11px', padding: '6px 10px', cursor: 'pointer',
    backgroundColor: s.isSelected ? '#a855f7' : s.isFocused ? '#f5f3ff' : 'transparent',
    color: s.isSelected ? '#fff' : '#374151',
  }),
  menu: (b: any) => ({ ...b, borderRadius: '8px', border: '1px solid #e5e7eb', zIndex: 9999 }),
};

// ─── Transfer Confirm Modal ──────────────────────────────────────────────────
function TransferModal({
  student, onClose, onSuccess,
}: { student: StudentRecord; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    transfer_number: '',
    transfer_date: new Date().toISOString().split('T')[0],
    to_school: '',
    reason: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.transfer_date) { toast.error('Transfer date is required'); return; }
    setSaving(true);
    try {
      const res = await api.post(`/students/${student.id}/issue-transfer`, form);
      if (res.data?.success) {
        toast.success(res.data.message ?? 'Transfer issued!');
        onSuccess();
      } else {
        toast.error(res.data?.message ?? 'Failed to issue transfer');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Error issuing transfer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 1200 }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600"><ArrowRightLeft size={16} /></div>
            <div>
              <p className="text-[12px] font-extrabold text-slate-800">Issue Transfer</p>
              <p className="text-[10px] text-gray-400">{student.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer outline-none"><X size={16} /></button>
        </div>

        {/* Student mini-card */}
        <div className="mx-5 mt-4 p-3 bg-slate-50 border border-gray-200 rounded-xl flex items-center gap-3">
          {student.photo_url
            ? <img src={student.photo_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-purple-100" />
            : <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-400"><User size={16} /></div>
          }
          <div>
            <p className="text-[11px] font-extrabold text-slate-800">{student.full_name}</p>
            <p className="text-[10px] text-gray-400">{student.class_name}{student.section ? ` - ${student.section}` : ''} · Adm: {student.admission_number}</p>
            <p className="text-[10px] text-gray-400">Father: {student.father_name ?? '—'}</p>
          </div>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Transfer Number</label>
              <input value={form.transfer_number} onChange={e => setForm({...form, transfer_number: e.target.value})}
                placeholder="e.g. TRF-2025-001"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-purple-400 bg-white" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Transfer Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.transfer_date} onChange={e => setForm({...form, transfer_date: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-purple-400 bg-white" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Transferred To School</label>
            <input value={form.to_school} onChange={e => setForm({...form, to_school: e.target.value})}
              placeholder="Name of destination school"
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-purple-400 bg-white" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Reason for Transfer</label>
            <textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
              rows={2} placeholder="Optional reason..."
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-purple-400 bg-white resize-none" />
          </div>
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
            <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700 font-semibold">This will mark the student as <strong>Transferred</strong> and deactivate their account.</p>
          </div>
        </div>

        <div className="px-5 pb-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1.5 text-[11px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer outline-none">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-extrabold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 cursor-pointer border-none outline-none transition">
            {saving ? <><div className="w-3 h-3 border-b border-white rounded-full animate-spin" /> Issuing…</> : <><Check size={12} /> Issue Transfer</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TC Modal ─────────────────────────────────────────────────────────────────
function TCModal({
  student, schoolInfo, onClose, onSuccess,
}: { student: StudentRecord; schoolInfo: any; onClose: () => void; onSuccess: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    tc_number: '',
    tc_date: today,
    last_date: today,
    reason_leaving: '',
    remarks: '',
  });
  const [saving, setSaving]   = useState(false);
  const [preview, setPreview] = useState(false);

  const handleSubmit = async () => {
    if (!form.tc_date) { toast.error('TC Date is required'); return; }
    setSaving(true);
    try {
      const res = await api.post(`/students/${student.id}/issue-tc`, form);
      if (res.data?.success) {
        toast.success(res.data.message ?? 'TC issued!');
        onSuccess();
      } else {
        toast.error(res.data?.message ?? 'Failed to issue TC');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Error issuing TC');
    } finally {
      setSaving(false);
    }
  };

  const printTC = () => {
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) return;
    const dob = student.user?.date_of_birth
      ? new Date(student.user.date_of_birth).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—';
    const admDate = student.admission_date
      ? new Date(student.admission_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—';
    const tcDateFmt = new Date(form.tc_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const lastDateFmt = form.last_date ? new Date(form.last_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

    w.document.write(`<!DOCTYPE html><html><head><title>Transfer Certificate</title>
<style>
  body{font-family:'Times New Roman',serif;margin:0;padding:20px;background:#fff;color:#000}
  .tc{max-width:700px;margin:0 auto;border:3px double #333;padding:30px;position:relative}
  .school-header{text-align:center;border-bottom:2px solid #333;padding-bottom:12px;margin-bottom:16px}
  .school-name{font-size:22px;font-weight:bold;text-transform:uppercase;letter-spacing:1px}
  .school-sub{font-size:12px;color:#555}
  .tc-title{text-align:center;font-size:18px;font-weight:bold;text-decoration:underline;margin:14px 0;letter-spacing:2px}
  .tc-number{text-align:right;font-size:11px;margin-bottom:10px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  td{padding:5px 8px;border-bottom:1px solid #eee}
  td:first-child{font-weight:bold;width:240px;color:#333}
  .signature-row{display:flex;justify-content:space-between;margin-top:40px}
  .sig-box{text-align:center;font-size:11px}
  .sig-line{border-top:1px solid #333;width:140px;margin:0 auto 4px}
  .footer{text-align:center;margin-top:20px;font-size:10px;color:#888}
  @media print{body{padding:0}button{display:none!important}}
</style></head><body>
<div class="tc">
  <div class="school-header">
    ${schoolInfo?.logo_url ? `<img src="${schoolInfo.logo_url}" style="height:60px;margin-bottom:8px" />` : ''}
    <div class="school-name">${schoolInfo?.name ?? 'School Name'}</div>
    <div class="school-sub">${schoolInfo?.address ?? ''} ${schoolInfo?.city ? '| ' + schoolInfo.city : ''} ${schoolInfo?.phone ? '| ' + schoolInfo.phone : ''}</div>
    ${schoolInfo?.email ? `<div class="school-sub">${schoolInfo.email}</div>` : ''}
  </div>
  <div class="tc-number">TC No.: <strong>${form.tc_number || 'AUTO'}</strong> &nbsp;&nbsp; Date: <strong>${tcDateFmt}</strong></div>
  <div class="tc-title">TRANSFER CERTIFICATE</div>
  <table>
    <tr><td>Student Name</td><td>${student.full_name}</td></tr>
    <tr><td>Father's Name</td><td>${student.father_name ?? '—'}</td></tr>
    <tr><td>Mother's Name</td><td>${student.mother_name ?? '—'}</td></tr>
    <tr><td>Date of Birth</td><td>${dob}</td></tr>
    <tr><td>Gender</td><td>${student.gender ?? '—'}</td></tr>
    <tr><td>Nationality</td><td>${student.nationality ?? 'Indian'}</td></tr>
    <tr><td>Religion</td><td>${student.religion ?? '—'}</td></tr>
    <tr><td>Category</td><td>${student.category ?? '—'}</td></tr>
    <tr><td>Admission Number</td><td>${student.admission_number}</td></tr>
    <tr><td>Roll Number</td><td>${student.roll_number ?? '—'}</td></tr>
    <tr><td>Class at Time of Leaving</td><td>${student.class_name}${student.section ? ' - ' + student.section : ''}</td></tr>
    <tr><td>Date of Admission</td><td>${admDate}</td></tr>
    <tr><td>Last Date of Attendance</td><td>${lastDateFmt}</td></tr>
    <tr><td>Reason for Leaving</td><td>${form.reason_leaving || '—'}</td></tr>
    <tr><td>Remarks / Conduct</td><td>${form.remarks || 'Good'}</td></tr>
  </table>
  <div style="margin-top:20px;font-size:12px">
    <p>Certified that the above particulars are correct as per the school records.</p>
  </div>
  <div class="signature-row">
    <div class="sig-box"><div class="sig-line"></div>Class Teacher</div>
    <div class="sig-box"><div class="sig-line"></div>Parent/Guardian</div>
    <div class="sig-box"><div class="sig-line"></div>Principal / Head of School</div>
  </div>
  <div class="footer">This is a computer-generated TC. No signature required if sealed.</div>
</div>
<script>window.onload=()=>window.print();</script>
</body></html>`);
    w.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 1200 }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600"><Stamp size={16} /></div>
            <div>
              <p className="text-[12px] font-extrabold text-slate-800">Issue Transfer Certificate (TC)</p>
              <p className="text-[10px] text-gray-400">{student.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPreview(!preview)}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg border cursor-pointer outline-none transition ${preview ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-gray-200 text-gray-500 hover:border-blue-200'}`}>
              <Eye size={11} /> Preview
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer outline-none"><X size={16} /></button>
          </div>
        </div>

        {/* Student mini-card */}
        <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
          {student.photo_url
            ? <img src={student.photo_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-emerald-100" />
            : <div className="w-10 h-10 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-500"><User size={16} /></div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-extrabold text-slate-800">{student.full_name}</p>
            <p className="text-[10px] text-gray-500">{student.class_name}{student.section ? ` - ${student.section}` : ''} · {student.admission_number}</p>
            <p className="text-[10px] text-gray-400">Father: {student.father_name ?? '—'} | DOB: {student.user?.date_of_birth ? new Date(student.user.date_of_birth).toLocaleDateString('en-IN') : '—'}</p>
          </div>
        </div>

        {/* TC Form */}
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">TC Number</label>
              <input value={form.tc_number} onChange={e => setForm({...form, tc_number: e.target.value})}
                placeholder="e.g. TC-2025-001"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-purple-400 bg-white" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">TC Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.tc_date} onChange={e => setForm({...form, tc_date: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-purple-400 bg-white" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Last Date of Attendance</label>
            <input type="date" value={form.last_date} onChange={e => setForm({...form, last_date: e.target.value})}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-purple-400 bg-white" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Reason for Leaving</label>
            <input value={form.reason_leaving} onChange={e => setForm({...form, reason_leaving: e.target.value})}
              placeholder="e.g. Parent relocated, Admission elsewhere, etc."
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-purple-400 bg-white" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Conduct / Remarks</label>
            <textarea value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})}
              rows={2} placeholder="e.g. Good, Satisfactory..."
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-purple-400 bg-white resize-none" />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
            <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700 font-semibold">Issuing TC will mark the student as <strong>Left / TC Issued</strong> and deactivate their account.</p>
          </div>
        </div>

        <div className="px-5 pb-4 flex justify-between items-center">
          <button onClick={printTC}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-bold text-gray-600 bg-slate-50 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer outline-none transition">
            <Printer size={12} /> Print TC
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-1.5 text-[11px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer outline-none">Cancel</button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-extrabold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 cursor-pointer border-none outline-none transition">
              {saving ? <><div className="w-3 h-3 border-b border-white rounded-full animate-spin" /> Issuing…</> : <><Stamp size={12} /> Issue TC</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Student Row ──────────────────────────────────────────────────────────────
function StudentRow({
  std, serial, onTransfer, onTC, tab,
}: {
  std: StudentRecord; serial: number;
  onTransfer: (s: StudentRecord) => void;
  onTC: (s: StudentRecord) => void;
  tab: ActiveTab;
}) {
  const isActive = std.user?.is_active ?? false;
  const admDate = std.admission_date
    ? new Date(std.admission_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <tr className="border-b border-gray-50 hover:bg-slate-50/70 transition group">
      <td className="px-3 py-2 text-center text-[10px] font-bold text-gray-400">{serial}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          {std.photo_url
            ? <img src={std.photo_url} alt="" className="w-7 h-7 rounded-lg object-cover border border-purple-100 flex-shrink-0" />
            : <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-400 flex-shrink-0"><User size={12} /></div>
          }
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-[11px] truncate">{std.full_name}</p>
            <p className="text-[9px] text-gray-400 truncate">{std.user?.email ?? '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2">
        <p className="font-mono font-extrabold text-[10px] text-purple-600">{std.admission_number}</p>
        {std.roll_number && <p className="text-[9px] text-gray-400">Roll: {std.roll_number}</p>}
      </td>
      <td className="px-3 py-2">
        <span className="bg-purple-50 border border-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded text-[10px]">
          {std.class_name}{std.section ? ` - ${std.section}` : ''}
        </span>
      </td>
      <td className="px-3 py-2">
        <p className="text-[10px] font-semibold text-slate-600">{std.father_name ?? '—'}</p>
        <p className="text-[9px] text-gray-400">{std.user?.mobile || std.father_mobile || '—'}</p>
      </td>
      <td className="px-3 py-2">
        <p className="text-[10px] font-semibold text-slate-600">{admDate}</p>
      </td>
      <td className="px-3 py-2">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          isActive ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-3 py-2 text-right">
        {tab === 'transfer' ? (
          <button
            onClick={() => onTransfer(std)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer border-none outline-none transition"
          >
            <ArrowRightLeft size={11} /> Transfer
          </button>
        ) : (
          <button
            onClick={() => onTC(std)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer border-none outline-none transition"
          >
            <Stamp size={11} /> Issue TC
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentTransfer() {
  const [activeTab, setActiveTab]         = useState<ActiveTab>('transfer');
  const [students, setStudents]           = useState<StudentRecord[]>([]);
  const [loading, setLoading]             = useState(false);
  const [classes, setClasses]             = useState<MasterOption[]>([]);
  const [schoolInfo, setSchoolInfo]       = useState<any>(null);

  const [search, setSearch]               = useState('');
  const [filterClass, setFilterClass]     = useState('');
  const [filterGender, setFilterGender]   = useState('');
  const [page, setPage]                   = useState(1);
  const [lastPage, setLastPage]           = useState(1);
  const [total, setTotal]                 = useState(0);
  const [perPage]                         = useState(15);

  const [transferTarget, setTransferTarget] = useState<StudentRecord | null>(null);
  const [tcTarget, setTcTarget]             = useState<StudentRecord | null>(null);

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load masters ────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/master/classes').then(res => {
      if (res.data?.success && res.data.data)
        setClasses(Object.entries(res.data.data).map(([id, name]) => ({ value: Number(id), label: name as string })));
    }).catch(() => {});

    api.get('/school/settings').then(res => {
      if (res.data?.success) setSchoolInfo(res.data.data ?? res.data);
    }).catch(() => {});

    // Quick stats
    api.get('/students', { params: { per_page: 9999 } }).then(res => {
      if (res.data?.success) {
        const list = res.data.data ?? [];
        setStats({
          total: list.length,
          active: list.filter((s: any) => s.user?.is_active).length,
          inactive: list.filter((s: any) => !s.user?.is_active).length,
        });
      }
    }).catch(() => {});
  }, []);

  // ── Load students ────────────────────────────────────────────────────────────
  const loadStudents = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, per_page: perPage };
      if (search)       params.search   = search;
      if (filterClass)  params.class_id = filterClass;
      if (filterGender) params.gender   = filterGender;

      const res = await api.get('/students', { params });
      if (res.data?.success) {
        setStudents(res.data.data ?? []);
        setPage(res.data.current_page ?? 1);
        setLastPage(res.data.last_page ?? 1);
        setTotal(res.data.total ?? 0);
      }
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [search, filterClass, filterGender, perPage]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadStudents(1), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [loadStudents]);

  const pageRange = () => {
    const start = Math.max(1, page - 2); const end = Math.min(lastPage, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const handleSuccess = () => {
    setTransferTarget(null);
    setTcTarget(null);
    loadStudents(page);
  };

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      {transferTarget && (
        <TransferModal student={transferTarget} onClose={() => setTransferTarget(null)} onSuccess={handleSuccess} />
      )}
      {tcTarget && (
        <TCModal student={tcTarget} schoolInfo={schoolInfo} onClose={() => setTcTarget(null)} onSuccess={handleSuccess} />
      )}

      <div className="flex flex-col h-full gap-3 px-4 py-3 overflow-hidden">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 space-y-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 leading-tight">Student Transfer & TC Desk</h2>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
              Manage inter-school transfers and issue Transfer Certificates
            </p>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Total Students', value: stats.total,    g: 'from-violet-500 to-purple-600', icon: <BookOpen size={13} /> },
              { label: 'Active',         value: stats.active,   g: 'from-emerald-500 to-teal-600',  icon: <CheckCircle size={13} /> },
              { label: 'Inactive',       value: stats.inactive, g: 'from-rose-500 to-red-600',      icon: <XCircle size={13} /> },
              { label: 'Showing',        value: total,          g: 'from-amber-500 to-orange-500',  icon: <ClipboardCheck size={13} /> },
            ].map(s => (
              <div key={s.label} className={`bg-gradient-to-br ${s.g} text-white rounded-xl p-3 flex items-center justify-between shadow-sm`}>
                <div>
                  <p className="text-[9px] font-bold opacity-80 uppercase tracking-wide">{s.label}</p>
                  <p className="text-lg font-extrabold">{s.value}</p>
                </div>
                <div className="opacity-30">{s.icon}</div>
              </div>
            ))}
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2">
            {[
              { id: 'transfer', label: 'Transfer Desk',       icon: <ArrowRightLeft size={12} />, color: 'indigo' },
              { id: 'tc',       label: 'TC Desk',             icon: <Stamp size={12} />,          color: 'emerald' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as ActiveTab)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer border-none outline-none transition ${
                  activeTab === t.id
                    ? t.id === 'transfer'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-slate-50'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
            <div className="ml-auto">
              {activeTab === 'transfer' ? (
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg">
                  🏫 Issue transfers to another school
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                  📜 Issue & Print Transfer Certificates
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Table card ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">

          {/* Filter bar */}
          <div className="px-3 py-2.5 border-b border-gray-100 flex flex-wrap items-center gap-2 flex-shrink-0">
            <div className="relative min-w-[210px]">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Name, admission no, roll no..."
                className="pl-7 pr-3 py-1.5 text-[11px] border border-gray-200 rounded-lg w-full outline-none focus:border-purple-400 bg-slate-50"
              />
            </div>
            <div className="w-32">
              <Select
                options={[{ value: '', label: 'All Classes' }, ...classes]}
                value={[{ value: '', label: 'All Classes' }, ...classes].find(c => String(c.value) === filterClass) ?? null}
                onChange={opt => setFilterClass(opt?.value ? String(opt.value) : '')}
                styles={selSm} placeholder="All Classes" isClearable={false}
              />
            </div>
            <div className="w-28">
              <Select
                options={[
                  { value: '', label: 'All Genders' },
                  { value: 'MALE', label: 'Male' },
                  { value: 'FEMALE', label: 'Female' },
                ]}
                value={{ value: filterGender, label: filterGender || 'All Genders' }}
                onChange={opt => setFilterGender(opt?.value ?? '')}
                styles={selSm} isClearable={false}
              />
            </div>
            <span className="text-[10px] text-gray-400 font-semibold ml-auto">{total} students</span>
            <button
              onClick={() => { setSearch(''); setFilterClass(''); setFilterGender(''); }}
              className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-purple-600 bg-transparent border-none cursor-pointer transition outline-none"
            >
              <RefreshCw size={11} /> Clear
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-[11px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-gray-200 text-[10px] text-gray-500 font-extrabold uppercase">
                <tr>
                  <th className="px-3 py-2 w-8 text-center">#</th>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Adm. / Roll</th>
                  <th className="px-3 py-2">Class</th>
                  <th className="px-3 py-2">Parent / Phone</th>
                  <th className="px-3 py-2">Adm. Date</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-7 h-7 border-b-2 border-purple-500 rounded-full animate-spin" />
                      <p className="text-gray-400 font-semibold">Loading students…</p>
                    </div>
                  </td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center">
                    <FileText size={36} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-extrabold">No students found</p>
                    <p className="text-[10px] text-gray-400 mt-1">Try adjusting your filters</p>
                  </td></tr>
                ) : students.map((std, idx) => (
                  <StudentRow
                    key={std.id}
                    std={std}
                    serial={(page - 1) * perPage + idx + 1}
                    tab={activeTab}
                    onTransfer={setTransferTarget}
                    onTC={setTcTarget}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && students.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
              <span className="text-[10px] text-gray-400">
                Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} of {total}
              </span>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => loadStudents(page - 1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none">
                  <ChevronLeft size={13} />
                </button>
                {pageRange().map(p => (
                  <button key={p} onClick={() => loadStudents(p)} className={`w-5 h-5 rounded text-[10px] font-bold cursor-pointer border-none outline-none transition ${p === page ? 'bg-purple-600 text-white' : 'hover:bg-gray-100 text-gray-600 bg-transparent'}`}>{p}</button>
                ))}
                <button disabled={page >= lastPage} onClick={() => loadStudents(page + 1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none">
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
