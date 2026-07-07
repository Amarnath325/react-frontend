import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, User, ChevronLeft, ChevronRight, RefreshCw, Calendar,
  Plus, X, Trash2, Edit2, Heart, Activity,
  Stethoscope, AlertTriangle, FileText,
  Hospital, Syringe, Eye, Pill, Scissors,
  ArrowLeft, Save, Bell, Upload, Download, RotateCcw,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

// ─── Types ────────────────────────────────────────────────────────────────────
type RecordType = 'checkup' | 'illness' | 'accident' | 'vaccination' | 'medication' | 'surgery' | 'dental' | 'eye' | 'other';
type Severity = 'mild' | 'moderate' | 'severe';
type ActiveView = 'list' | 'profile';

interface MedicalRecord {
  id: number;
  student_id: number;
  std_id?: number;
  student_name?: string;
  admission_number?: string;
  class_name?: string;
  section?: string;
  photo_url?: string | null;
  blood_group?: string | null;
  visit_date: string;
  record_type: RecordType;
  complaint: string | null;
  diagnosis: string | null;
  treatment: string | null;
  prescription: string | null;
  doctor_name: string | null;
  doctor_contact: string | null;
  hospital_clinic: string | null;
  height: string | null;
  weight: string | null;
  bmi: string | null;
  temperature: string | null;
  blood_pressure: string | null;
  pulse: string | null;
  severity: Severity;
  referred_to_hospital: boolean;
  parent_notified: boolean;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
}

interface StudentProfile {
  id: number; full_name: string; admission_number: string;
  class_name: string; section: string; blood_group: string | null;
  medical_conditions: string | null; allergies: string | null;
  doctor_name: string | null; doctor_contact: string | null;
  medical_info: string | null; photo_url: string | null;
}

interface Stats {
  total: number; this_month: number; referred: number; follow_up_due: number;
  by_type: Record<string, number>; by_severity: Record<string, number>;
}
interface MasterOption { value: string | number; label: string; }

// ─── Config ───────────────────────────────────────────────────────────────────
const TYPE_CFG: Record<RecordType, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  checkup: { label: 'Check-up', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200', icon: <Stethoscope size={10} /> },
  illness: { label: 'Illness', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: <Activity size={10} /> },
  accident: { label: 'Accident', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: <AlertTriangle size={10} /> },
  vaccination: { label: 'Vaccination', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: <Syringe size={10} /> },
  medication: { label: 'Medication', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', icon: <Pill size={10} /> },
  surgery: { label: 'Surgery', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', icon: <Scissors size={10} /> },
  dental: { label: 'Dental', color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200', icon: <Heart size={10} /> },
  eye: { label: 'Eye', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: <Eye size={10} /> },
  other: { label: 'Other', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', icon: <FileText size={10} /> },
};

const SEV_CFG: Record<Severity, { label: string; color: string; bg: string; border: string; dot: string }> = {
  mild: { label: 'Mild', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-400' },
  moderate: { label: 'Moderate', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400' },
  severe: { label: 'Severe', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-400' },
};

const selSm = {
  control: (b: any, s: any) => ({
    ...b, borderRadius: '8px', borderColor: s.isFocused ? '#a855f7' : '#e5e7eb',
    boxShadow: s.isFocused ? '0 0 0 2px rgba(168,85,247,.15)' : 'none',
    minHeight: '30px', height: '30px', '&:hover': { borderColor: '#a855f7' },
  }),
  valueContainer: (b: any) => ({ ...b, padding: '0 8px', height: '30px', display: 'flex', alignItems: 'center' }),
  input: (b: any) => ({ ...b, margin: 0, padding: 0, fontSize: '11px' }),
  placeholder: (b: any) => ({ ...b, fontSize: '11px', color: '#9ca3af' }),
  singleValue: (b: any) => ({ ...b, fontSize: '11px', color: '#111827' }),
  indicatorsContainer: (b: any) => ({ ...b, height: '28px' }),
  option: (b: any, s: any) => ({
    ...b, fontSize: '11px', padding: '6px 10px', cursor: 'pointer',
    backgroundColor: s.isSelected ? '#a855f7' : s.isFocused ? '#f5f3ff' : 'transparent',
    color: s.isSelected ? '#fff' : '#374151',
  }),
  menu: (b: any) => ({ ...b, borderRadius: '8px', border: '1px solid #e5e7eb', zIndex: 9999 }),
};

function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: RecordType }) {
  const c = TYPE_CFG[type];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${c.color} ${c.bg} ${c.border}`}>
      {c.icon} {c.label}
    </span>
  );
}
function SevBadge({ sev }: { sev: Severity }) {
  const c = SEV_CFG[sev];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${c.color} ${c.bg} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} /> {c.label}
    </span>
  );
}

// ─── Form blank ───────────────────────────────────────────────────────────────
const blankForm = (): any => ({
  student_id: '',
  visit_date: new Date().toISOString().split('T')[0],
  record_type: 'checkup',
  complaint: '', diagnosis: '', treatment: '', prescription: '',
  doctor_name: '', doctor_contact: '', hospital_clinic: '',
  height: '', weight: '', temperature: '', blood_pressure: '', pulse: '',
  severity: 'mild',
  referred_to_hospital: false, parent_notified: false,
  follow_up_date: '', notes: '',
});

// ─── Add/Edit Record Modal ────────────────────────────────────────────────────
function RecordModal({
  classes, recordTypes = [], severities = [], editRecord, fixedStudentId, onClose, onSuccess,
}: {
  classes: MasterOption[];
  recordTypes?: MasterOption[];
  severities?: MasterOption[];
  editRecord: MedicalRecord | null;
  fixedStudentId?: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!editRecord;
  const [form, setForm] = useState<any>(editRecord ? { ...editRecord } : { ...blankForm(), student_id: fixedStudentId ?? '' });
  const [students, setStudents] = useState<{ value: number; label: string; sub: string }[]>([]);
  const [selClass, setSelClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadStudents = async (classId: string) => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await api.get('/students', { params: { class_id: classId, per_page: 999 } });
      if (res.data?.success)
        setStudents((res.data.data ?? []).map((s: any) => ({ value: s.id, label: s.full_name, sub: s.admission_number })));
    } finally { setLoading(false); }
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleVitalChange = (key: string, value: string) => {
    if (value === '') {
      set(key, '');
      return;
    }
    // Match only digits, max 3 integer digits, and at most 2 decimal digits after a dot.
    const regex = /^\d{0,3}(\.\d{0,2})?$/;
    if (regex.test(value)) {
      set(key, value);
    }
  };

  // Auto BMI
  useEffect(() => {
    const h = parseFloat(form.height ?? '');
    const w = parseFloat(form.weight ?? '');
    if (h > 0 && w > 0) {
      const hm = h / 100;
      set('bmi', (w / (hm * hm)).toFixed(1));
    }
  }, [form.height, form.weight]);

  const handleSave = async () => {
    // 1. Mandatory Checks
    if (!form.student_id) { toast.error('Please select a student'); return; }
    if (!form.visit_date) { toast.error('Please select a visit date'); return; }

    // Helper: is valid number check
    const isNum = (val: any) => val !== '' && val !== null && val !== undefined && !isNaN(Number(val));

    // 2. Vitals Validations
    if (form.height !== '' && form.height !== null && form.height !== undefined) {
      if (!isNum(form.height)) { toast.error('Height must be a valid number'); return; }
      const ht = Number(form.height);
      if (ht < 30 || ht > 250) { toast.error('Height must be between 30 and 250 cm'); return; }
    }

    if (form.weight !== '' && form.weight !== null && form.weight !== undefined) {
      if (!isNum(form.weight)) { toast.error('Weight must be a valid number'); return; }
      const wt = Number(form.weight);
      if (wt < 1 || wt > 250) { toast.error('Weight must be between 1 and 250 kg'); return; }
    }

    if (form.temperature !== '' && form.temperature !== null && form.temperature !== undefined) {
      if (!isNum(form.temperature)) { toast.error('Temperature must be a valid number'); return; }
      const temp = Number(form.temperature);
      if (temp < 90 || temp > 115) { toast.error('Temperature must be between 90°F and 115°F'); return; }
    }

    if (form.pulse !== '' && form.pulse !== null && form.pulse !== undefined) {
      if (!isNum(form.pulse) || !Number.isInteger(Number(form.pulse))) { toast.error('Pulse must be a valid integer'); return; }
      const pulse = Number(form.pulse);
      if (pulse < 30 || pulse > 220) { toast.error('Pulse must be between 30 and 220 bpm'); return; }
    }

    if (form.blood_pressure && form.blood_pressure.trim() !== '') {
      const bpRegex = /^\d{2,3}\/\d{2,3}$/;
      if (!bpRegex.test(form.blood_pressure.trim())) {
        toast.error('Blood Pressure must be in "Systolic/Diastolic" format (e.g., 120/80)');
        return;
      }
    }

    // 3. Contact Validations
    if (form.doctor_contact && form.doctor_contact.trim() !== '') {
      const contactTrim = form.doctor_contact.trim();
      const phoneRegex = /^\+?[0-9\s-]{7,15}$/;
      if (!phoneRegex.test(contactTrim)) {
        toast.error('Doctor Contact must be a valid phone number (7 to 15 digits)');
        return;
      }
    }

    // 4. Length Constraints
    if (form.doctor_name && form.doctor_name.length > 150) { toast.error('Doctor name cannot exceed 150 characters'); return; }
    if (form.hospital_clinic && form.hospital_clinic.length > 255) { toast.error('Hospital/Clinic name cannot exceed 255 characters'); return; }
    if (form.complaint && form.complaint.length > 500) { toast.error('Complaint description cannot exceed 500 characters'); return; }
    if (form.diagnosis && form.diagnosis.length > 1000) { toast.error('Diagnosis description cannot exceed 1000 characters'); return; }
    if (form.treatment && form.treatment.length > 1000) { toast.error('Treatment description cannot exceed 1000 characters'); return; }
    if (form.prescription && form.prescription.length > 1000) { toast.error('Prescription cannot exceed 1000 characters'); return; }
    if (form.notes && form.notes.length > 1000) { toast.error('Notes cannot exceed 1000 characters'); return; }

    setSaving(true);
    try {
      let res;
      if (isEdit) {
        res = await api.put(`/student-medical/${editRecord!.id}`, form);
      } else {
        res = await api.post('/student-medical/', form);
      }
      if (res.data?.success) { toast.success(res.data.message); onSuccess(); }
      else toast.error(res.data?.message ?? 'Failed');
    } catch (e: any) { toast.error(e.response?.data?.message ?? 'Error'); }
    finally { setSaving(false); }
  };

  const typeOpts = recordTypes.length > 0 ? recordTypes : Object.entries(TYPE_CFG).map(([v, c]) => ({ value: v, label: c.label }));
  const sevOpts = severities.length > 0 ? severities : Object.entries(SEV_CFG).map(([v, c]) => ({ value: v, label: c.label }));
  const stdOpts = students.map(s => ({ value: s.value, label: s.label, sub: s.sub }));

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center lg:pl-64 p-4 overflow-y-auto" style={{ zIndex: 1200 }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl my-4">
        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600"><Heart size={14} /></div>
            <p className="text-[12px] font-extrabold text-slate-800">{isEdit ? 'Edit Medical Record' : 'Add Medical Record'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer outline-none"><X size={15} /></button>
        </div>

        {/* Modal Body: Two-column grid */}
        <div className="px-5 py-3.5 grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[85vh] overflow-y-auto">

          {/* COLUMN 1: Student, Visit & Diagnostics */}
          <div className="space-y-3">
            {/* Header info */}
            <p className="text-[9px] font-extrabold text-purple-600 uppercase tracking-wider flex items-center gap-1">
              <FileText size={10} /> Visit & Patient Info
            </p>

            <div className="grid grid-cols-3 gap-2">
              {!fixedStudentId && !isEdit ? (
                <>
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 block">Class</label>
                    <Select options={[{ value: '', label: 'Select class…' }, ...classes]}
                      value={[{ value: '', label: 'Select class…' }, ...classes].find(c => String(c.value) === selClass) ?? null}
                      onChange={o => { setSelClass(o?.value ? String(o.value) : ''); loadStudents(o?.value ? String(o.value) : ''); set('student_id', ''); }}
                      styles={selSm} isClearable={false} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 block">Student <span className="text-red-500">*</span></label>
                    <Select options={stdOpts} isLoading={loading}
                      value={stdOpts.find(s => s.value === form.student_id) ?? null}
                      onChange={o => set('student_id', o?.value ?? '')}
                      formatOptionLabel={(o: any) => <div><p className="text-[10px] font-bold">{o.label}</p><p className="text-[8px] text-gray-400">{o.sub}</p></div>}
                      styles={selSm} isClearable={false} />
                  </div>
                </>
              ) : (
                <div className="col-span-2 bg-purple-50/50 border border-purple-100 rounded-lg px-2.5 py-1 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] text-purple-400 uppercase font-bold">Patient ID</p>
                    <p className="text-[10px] font-bold text-purple-700">Fixed Student #{form.student_id}</p>
                  </div>
                </div>
              )}
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 block">Visit Date <span className="text-red-500">*</span></label>
                <input type="date" value={form.visit_date ?? ''} onChange={e => set('visit_date', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-[11px] outline-none focus:border-purple-400 h-[30px]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 block">Record Type</label>
                <Select options={typeOpts} value={typeOpts.find(o => o.value === form.record_type) ?? null}
                  onChange={o => set('record_type', o?.value)} styles={selSm} isClearable={false} />
              </div>
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 block">Severity</label>
                <Select options={sevOpts} value={sevOpts.find(o => o.value === form.severity) ?? null}
                  onChange={o => set('severity', o?.value)} styles={selSm} isClearable={false} />
              </div>
            </div>

            {/* Diagnostics details */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 block">Complaint / Symptoms</label>
                <textarea value={form.complaint ?? ''} onChange={e => set('complaint', e.target.value)} rows={1}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-[10px] outline-none focus:border-purple-400 resize-none h-[42px]" placeholder="Symptoms…" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 block">Diagnosis</label>
                <textarea value={form.diagnosis ?? ''} onChange={e => set('diagnosis', e.target.value)} rows={1}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-[10px] outline-none focus:border-purple-400 resize-none h-[42px]" placeholder="Diagnosis…" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 block">Treatment</label>
                <textarea value={form.treatment ?? ''} onChange={e => set('treatment', e.target.value)} rows={1}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-[10px] outline-none focus:border-purple-400 resize-none h-[42px]" placeholder="Treatment given…" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 block">Prescription / Medicines</label>
                <textarea value={form.prescription ?? ''} onChange={e => set('prescription', e.target.value)} rows={1}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-[10px] outline-none focus:border-purple-400 resize-none h-[42px]" placeholder="Medicines prescribed…" />
              </div>
            </div>
          </div>

          {/* COLUMN 2: Vitals, Referrals, Doctor & Follow-up */}
          <div className="space-y-3">
            {/* Vitals header */}
            <p className="text-[9px] font-extrabold text-purple-600 uppercase tracking-wider flex items-center gap-1">
              <Activity size={10} /> Vitals & Health Metrics
            </p>

            <div className="grid grid-cols-6 gap-1.5">
              {[
                { label: 'Ht (cm)', key: 'height', placeholder: '150' },
                { label: 'Wt (kg)', key: 'weight', placeholder: '55' },
                { label: 'BMI', key: 'bmi', placeholder: '—', readOnly: true },
                { label: 'Temp (°F)', key: 'temperature', placeholder: '98.6' },
                { label: 'BP', key: 'blood_pressure', placeholder: '120/80' },
                { label: 'Pulse', key: 'pulse', placeholder: '72' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[8px] font-bold text-gray-400 uppercase mb-0.5 block">{f.label}</label>
                  <input value={form[f.key] ?? ''}
                    onChange={e => {
                      if (f.readOnly) return;
                      if (['height', 'weight', 'temperature', 'pulse'].includes(f.key)) {
                        handleVitalChange(f.key, e.target.value);
                      } else {
                        set(f.key, e.target.value);
                      }
                    }}
                    readOnly={f.readOnly} placeholder={f.placeholder}
                    maxLength={f.key === 'blood_pressure' ? 7 : undefined}
                    className={`w-full border border-gray-200 rounded-lg px-1.5 py-1 text-[10px] outline-none focus:border-purple-400 h-[28px] ${f.readOnly ? 'bg-purple-50 text-purple-700 font-extrabold text-center' : ''}`} />
                </div>
              ))}
            </div>

            {/* Doctor Info */}
            <p className="text-[9px] font-extrabold text-purple-600 uppercase tracking-wider flex items-center gap-1 pt-1.5">
              <Stethoscope size={10} /> Attending Doctor / Facility
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 block">Doctor Name</label>
                <input value={form.doctor_name ?? ''} onChange={e => set('doctor_name', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-[10px] outline-none focus:border-purple-400 h-[30px]" placeholder="Dr. …" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 block">Doctor Contact</label>
                <input value={form.doctor_contact ?? ''} onChange={e => set('doctor_contact', e.target.value)}
                  maxLength={15}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-[10px] outline-none focus:border-purple-400 h-[30px]" placeholder="Phone…" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 block">Hospital / Clinic</label>
                <input value={form.hospital_clinic ?? ''} onChange={e => set('hospital_clinic', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-[10px] outline-none focus:border-purple-400 h-[30px]" placeholder="Clinic name…" />
              </div>
            </div>

            {/* Checkboxes & Notes */}
            <div className="grid grid-cols-3 gap-2 items-end pt-1">
              <div className="space-y-1.5 py-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={form.referred_to_hospital ?? false} onChange={e => set('referred_to_hospital', e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-rose-500" />
                  <span className="text-[10px] font-bold text-slate-700">Referred</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={form.parent_notified ?? false} onChange={e => set('parent_notified', e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-blue-500" />
                  <span className="text-[10px] font-bold text-slate-700">Parent Notified</span>
                </label>
              </div>
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 block">Follow-up Date</label>
                <input type="date" value={form.follow_up_date ?? ''} onChange={e => set('follow_up_date', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-[10px] outline-none focus:border-purple-400 h-[30px]" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 block">Notes</label>
                <input value={form.notes ?? ''} onChange={e => set('notes', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-[10px] outline-none focus:border-purple-400 h-[30px]" placeholder="Notes…" />
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 flex justify-end gap-2 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-1.5 text-[11px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer outline-none">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-extrabold bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-60 cursor-pointer border-none outline-none transition">
            {saving ? <><div className="w-3 h-3 border-b border-white rounded-full animate-spin" />Saving…</> : <><Save size={11} />{isEdit ? 'Update' : 'Save Record'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Student Profile View ────────────────────────────────────────────────────
function StudentProfileView({
  studentId, classes, recordTypes = [], severities = [], onBack,
}: { studentId: number; classes: MasterOption[]; recordTypes?: MasterOption[]; severities?: MasterOption[]; onBack: () => void }) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<any>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [editRecord, setEditRecord] = useState<MedicalRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/student-medical/student/${studentId}`);
      if (res.data?.success) {
        setProfile(res.data.data.student);
        setRecords(res.data.data.records);
        setProfileForm({ ...res.data.data.student });
      }
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await api.put(`/student-medical/student/${studentId}/profile`, profileForm);
      if (res.data?.success) { toast.success('Medical profile updated'); setEditProfile(false); load(); }
    } catch { toast.error('Failed to update profile'); }
    finally { setSavingProfile(false); }
  };

  const deleteRecord = async (id: number) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      const res = await api.delete(`/student-medical/${id}`);
      if (res.data?.success) { toast.success('Deleted'); load(); }
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-8 h-8 border-b-2 border-rose-500 rounded-full animate-spin mb-3" />
      <p className="text-gray-400 font-semibold text-[11px]">Loading profile…</p>
    </div>
  );
  if (!profile) return null;

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      {(showAddRecord || editRecord) && (
        <RecordModal
          classes={classes}
          recordTypes={recordTypes}
          severities={severities}
          fixedStudentId={studentId}
          editRecord={editRecord}
          onClose={() => { setShowAddRecord(false); setEditRecord(null); }}
          onSuccess={() => { setShowAddRecord(false); setEditRecord(null); load(); }}
        />
      )}

      {/* Profile header */}
      <div className="flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm p-3">
        <div className="flex items-start gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer bg-transparent border-none outline-none text-gray-500 flex-shrink-0 mt-0.5">
            <ArrowLeft size={14} />
          </button>
          {profile.photo_url
            ? <img src={profile.photo_url} alt="" className="w-14 h-14 rounded-xl object-cover border border-rose-100 flex-shrink-0" />
            : <div className="w-14 h-14 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-400 flex-shrink-0"><User size={22} /></div>
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-slate-800">{profile.full_name}</h3>
              {profile.blood_group && (
                <span className="text-[10px] font-extrabold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                  🩸 {profile.blood_group}
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">{profile.class_name}{profile.section ? ` - ${profile.section}` : ''} · {profile.admission_number}</p>
            <div className="flex flex-wrap gap-3 mt-2">
              {profile.allergies && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                  ⚠️ Allergies: {profile.allergies}
                </span>
              )}
              {profile.medical_conditions && (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
                  🏥 Condition: {profile.medical_conditions}
                </span>
              )}
              {profile.doctor_name && (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                  👨‍⚕️ {profile.doctor_name} · {profile.doctor_contact}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setEditProfile(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 rounded-lg hover:bg-blue-100 cursor-pointer outline-none transition">
              <Edit2 size={10} /> Edit Profile
            </button>
            <button onClick={() => setShowAddRecord(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer border-none outline-none transition">
              <Plus size={10} /> Add Record
            </button>
          </div>
        </div>

        {/* Edit profile inline */}
        {editProfile && (
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-3">
            {[
              { label: 'Blood Group', key: 'blood_group' },
              { label: 'Medical Conditions', key: 'medical_conditions' },
              { label: 'Allergies', key: 'allergies' },
              { label: 'Doctor Name', key: 'doctor_name' },
              { label: 'Doctor Contact', key: 'doctor_contact' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">{f.label}</label>
                <input value={profileForm[f.key] ?? ''} onChange={e => setProfileForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-[11px] outline-none focus:border-purple-400" />
              </div>
            ))}
            <div className="col-span-3">
              <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Medical Info / Notes</label>
              <textarea value={profileForm.medical_info ?? ''} onChange={e => setProfileForm((p: any) => ({ ...p, medical_info: e.target.value }))} rows={2}
                className="w-full border border-gray-200 rounded-lg px-2 py-1 text-[11px] outline-none focus:border-purple-400 resize-none" />
            </div>
            <div className="col-span-3 flex justify-end gap-2">
              <button onClick={() => setEditProfile(false)} className="px-3 py-1 text-[10px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer outline-none">Cancel</button>
              <button onClick={saveProfile} disabled={savingProfile} className="flex items-center gap-1 px-3 py-1 text-[10px] font-extrabold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 cursor-pointer border-none outline-none">
                {savingProfile ? 'Saving…' : <><Save size={10} /> Save Profile</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Records list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <p className="text-[11px] font-extrabold text-slate-700">Visit History <span className="text-gray-400 font-normal">({records.length} records)</span></p>
        </div>
        <div className="flex-1 overflow-auto">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FileText size={36} className="text-gray-200 mb-3" />
              <p className="font-extrabold text-gray-500 text-[11px]">No medical records yet</p>
              <button onClick={() => setShowAddRecord(true)} className="mt-2 flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:underline bg-transparent border-none cursor-pointer outline-none">
                <Plus size={11} /> Add first record
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {records.map(r => (
                <div key={r.id} className="px-4 py-3 hover:bg-rose-50/20 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${TYPE_CFG[r.record_type].bg} ${TYPE_CFG[r.record_type].color} border ${TYPE_CFG[r.record_type].border}`}>
                        {TYPE_CFG[r.record_type].icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <TypeBadge type={r.record_type} />
                          <SevBadge sev={r.severity} />
                          {r.referred_to_hospital && <span className="text-[9px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">🏥 Referred</span>}
                          {r.parent_notified && <span className="text-[9px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">📱 Parent Notified</span>}
                        </div>
                        <p className="text-[11px] font-extrabold text-slate-800 mt-1">{r.complaint || '(No complaint recorded)'}</p>
                        {r.diagnosis && <p className="text-[10px] text-slate-600 mt-0.5"><span className="font-bold">Dx:</span> {r.diagnosis}</p>}
                        {r.treatment && <p className="text-[10px] text-slate-600"><span className="font-bold">Rx:</span> {r.treatment}</p>}
                        {r.prescription && <p className="text-[10px] text-slate-600"><span className="font-bold">💊</span> {r.prescription}</p>}
                        {/* Vitals */}
                        {(r.height || r.weight || r.temperature || r.blood_pressure || r.pulse) && (
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {r.height && <span className="text-[9px] text-gray-500 font-bold">📏 {r.height}cm</span>}
                            {r.weight && <span className="text-[9px] text-gray-500 font-bold">⚖️ {r.weight}kg</span>}
                            {r.bmi && <span className="text-[9px] font-extrabold text-purple-600">BMI {r.bmi}</span>}
                            {r.temperature && <span className="text-[9px] text-gray-500 font-bold">🌡️ {r.temperature}°F</span>}
                            {r.blood_pressure && <span className="text-[9px] text-gray-500 font-bold">💓 BP {r.blood_pressure}</span>}
                            {r.pulse && <span className="text-[9px] text-gray-500 font-bold">💗 {r.pulse} bpm</span>}
                          </div>
                        )}
                        {r.doctor_name && (
                          <p className="text-[9px] text-gray-400 mt-1 flex items-center gap-1">
                            <Stethoscope size={9} /> {r.doctor_name}{r.hospital_clinic ? ` · ${r.hospital_clinic}` : ''}
                          </p>
                        )}
                        {r.follow_up_date && (
                          <p className="text-[9px] font-bold text-amber-600 mt-0.5 flex items-center gap-1">
                            <Bell size={9} /> Follow-up: {fmtDate(r.follow_up_date)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right space-y-1">
                      <p className="text-[10px] font-extrabold text-slate-700">{fmtDate(r.visit_date)}</p>
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setEditRecord(r)} className="p-1 text-blue-400 hover:bg-blue-50 hover:text-blue-600 rounded cursor-pointer bg-transparent border-none outline-none transition"><Edit2 size={11} /></button>
                        <button onClick={() => deleteRecord(r.id)} className="p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded cursor-pointer bg-transparent border-none outline-none transition"><Trash2 size={11} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentMedicalRecord() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats>({ total: 0, this_month: 0, referred: 0, follow_up_due: 0, by_type: {}, by_severity: {} });
  const [classes, setClasses] = useState<MasterOption[]>([]);
  const [recordTypes, setRecordTypes] = useState<MasterOption[]>([]);
  const [severities, setSeverities] = useState<MasterOption[]>([]);

  // Selection & Trash states
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showTrash, setShowTrash] = useState(false);
  const [trashRecords, setTrashRecords] = useState<MedicalRecord[]>([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [selectedTrashIds, setSelectedTrashIds] = useState<number[]>([]);
  const [importing, setImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSev, setFilterSev] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage] = useState(15);

  // Views
  const [view, setView] = useState<ActiveView>('list');
  const [profileStudentId, setProfileStudentId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Trash & Bulk Handlers ──────────────────────────────────────────────────
  const loadTrashRecords = async () => {
    setLoadingTrash(true);
    try {
      const res = await api.get('/student-medical/trashed');
      if (res.data?.success) {
        setTrashRecords(res.data.data ?? []);
        setSelectedTrashIds([]);
      }
    } catch {
      toast.error('Failed to load trash bin');
    } finally {
      setLoadingTrash(false);
    }
  };

  useEffect(() => {
    if (showTrash) {
      loadTrashRecords();
    }
  }, [showTrash]);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Move ${selectedIds.length} record(s) to trash?`)) return;
    try {
      const res = await api.post('/student-medical/bulk-delete', { ids: selectedIds });
      if (res.data?.success) {
        toast.success(res.data.message);
        setSelectedIds([]);
        loadRecords(page);
        loadStats();
      }
    } catch {
      toast.error('Bulk delete failed');
    }
  };

  const handleRestore = async (id: number) => {
    try {
      const res = await api.post(`/student-medical/restore/${id}`);
      if (res.data?.success) {
        toast.success(res.data.message);
        loadTrashRecords();
        loadStats();
      }
    } catch {
      toast.error('Restore failed');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedTrashIds.length === 0) return;
    try {
      const res = await api.post('/student-medical/bulk-restore', { ids: selectedTrashIds });
      if (res.data?.success) {
        toast.success(res.data.message);
        setSelectedTrashIds([]);
        loadTrashRecords();
        loadStats();
      }
    } catch {
      toast.error('Bulk restore failed');
    }
  };

  const handleBulkForceDelete = async () => {
    if (selectedTrashIds.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedTrashIds.length} record(s)? This action is irreversible.`)) return;
    try {
      const res = await api.post('/student-medical/bulk-force-delete', { ids: selectedTrashIds });
      if (res.data?.success) {
        toast.success(res.data.message);
        setSelectedTrashIds([]);
        loadTrashRecords();
        loadStats();
      }
    } catch {
      toast.error('Permanent delete failed');
    }
  };

  // ── CSV Import / Export Handlers ──────────────────────────────────────────
  const handleExport = async () => {
    try {
      const res = await api.get('/student-medical/export', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student_medical_records_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch {
      toast.error('Export failed');
    }
  };

  const handleDownloadSample = async () => {
    try {
      const res = await api.get('/student-medical/sample', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student_medical_records_sample.csv';
      a.click();
    } catch {
      toast.error('Failed to download sample');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/student-medical/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        if (res.data.errors && res.data.errors.length > 0) {
          toast(res.data.errors.join('\n'), { icon: '⚠️', duration: 6000 });
        }
        loadRecords(1);
        loadStats();
      } else {
        toast.error(res.data?.message ?? 'Import failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Import failed');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/master/classes').then(res => {
      if (res.data?.success && res.data.data)
        setClasses(Object.entries(res.data.data).map(([id, name]) => ({ value: Number(id), label: name as string })));
    }).catch(() => { });

    api.get('/master/options/MEDICAL_RECORD_TYPE').then(res => {
      if (res.data?.success && res.data.data)
        setRecordTypes(Object.entries(res.data.data).map(([name, alias]) => ({ value: name, label: alias as string })));
    }).catch(() => { });

    api.get('/master/options/MEDICAL_SEVERITY').then(res => {
      if (res.data?.success && res.data.data)
        setSeverities(Object.entries(res.data.data).map(([name, alias]) => ({ value: name, label: alias as string })));
    }).catch(() => { });

    loadStats();
  }, []);

  const loadStats = () => {
    api.get('/student-medical/stats').then(res => { if (res.data?.success) setStats(res.data.data); }).catch(() => { });
  };

  const loadRecords = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: p, per_page: perPage };
      if (search) params.search = search;
      if (filterType) params.record_type = filterType;
      if (filterSev) params.severity = filterSev;
      if (filterClass) params.class_id = filterClass;
      if (filterFrom) params.from_date = filterFrom;
      if (filterTo) params.to_date = filterTo;
      const res = await api.get('/student-medical/', { params });
      if (res.data?.success) {
        setRecords(res.data.data ?? []);
        setPage(res.data.current_page ?? 1);
        setLastPage(res.data.last_page ?? 1);
        setTotal(res.data.total ?? 0);
      }
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  }, [search, filterType, filterSev, filterClass, filterFrom, filterTo, perPage]);

  useEffect(() => {
    if (view !== 'list') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadRecords(1), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [view, loadRecords]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      const res = await api.delete(`/student-medical/${id}`);
      if (res.data?.success) { toast.success('Deleted'); loadRecords(page); loadStats(); }
    } catch { toast.error('Failed to delete'); }
  };

  const openProfile = (studentId: number) => {
    setProfileStudentId(studentId);
    setView('profile');
  };

  const pageRange = () => {
    const s = Math.max(1, page - 2); const e = Math.min(lastPage, s + 4);
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  };

  const typeOptions = recordTypes.length > 0 ? recordTypes : Object.entries(TYPE_CFG).map(([v, c]) => ({ value: v, label: c.label }));
  const sevOptions = severities.length > 0 ? severities : Object.entries(SEV_CFG).map(([v, c]) => ({ value: v, label: c.label }));

  const typeOpts = [{ value: '', label: 'Types' }, ...typeOptions];
  const sevOpts = [{ value: '', label: 'Severity' }, ...sevOptions];

  // ─── Profile View ────────────────────────────────────────────────────────
  if (view === 'profile' && profileStudentId) {
    return (
      <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col px-4 py-3">
        <StudentProfileView
          studentId={profileStudentId}
          classes={classes}
          recordTypes={recordTypes}
          severities={severities}
          onBack={() => { setView('list'); setProfileStudentId(null); loadRecords(page); loadStats(); }}
        />
      </div>
    );
  }

  // ─── List View ───────────────────────────────────────────────────────────
  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      {showModal && (
        <RecordModal
          classes={classes}
          recordTypes={recordTypes}
          severities={severities}
          editRecord={null}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); loadRecords(1); loadStats(); }}
        />
      )}

      <div className="flex flex-col h-full gap-3 px-4 py-3 overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 leading-tight">
                {showTrash ? 'Student Medical Records — Trash Bin' : 'Student Medical Records'}
              </h2>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                {showTrash ? 'Manage, restore, or permanently delete deleted medical records' : 'Track health visits, vitals, treatments and follow-ups'}
              </p>
            </div>

            {showTrash ? (
              <button
                onClick={() => setShowTrash(false)}
                className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-extrabold bg-slate-600 text-white rounded-xl hover:bg-slate-700 cursor-pointer border-none outline-none shadow-md transition">
                <ArrowLeft size={13} /> Back to Records
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv" className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="flex items-center gap-1 px-3 py-2 text-[10px] font-bold bg-white text-slate-700 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                  <Upload size={12} /> {importing ? 'Importing…' : 'Import CSV'}
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1 px-3 py-2 text-[10px] font-bold bg-white text-slate-700 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                  <Download size={12} /> Export CSV
                </button>
                <button
                  onClick={handleDownloadSample}
                  className="flex items-center gap-1 px-3 py-2 text-[10px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer transition bg-transparent border-none">
                  Sample
                </button>
                <button
                  onClick={() => setShowTrash(true)}
                  className="flex items-center gap-1 px-3 py-2 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 cursor-pointer transition">
                  <Trash2 size={12} /> Trash Bin
                </button>
                <button onClick={() => setShowModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-extrabold bg-rose-600 text-white rounded-xl hover:bg-rose-700 cursor-pointer border-none outline-none shadow-md transition">
                  <Plus size={13} /> Add Record
                </button>
              </div>
            )}
          </div>

          {/* KPI Cards (Only on active list view) */}
          {!showTrash && (
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: 'Total Records', value: stats.total, g: 'from-rose-500 to-pink-600', icon: <FileText size={13} /> },
                { label: 'This Month', value: stats.this_month, g: 'from-violet-500 to-purple-600', icon: <Calendar size={13} /> },
                { label: 'Referred', value: stats.referred, g: 'from-red-500 to-rose-600', icon: <Hospital size={13} /> },
                { label: 'Follow-ups Due', value: stats.follow_up_due, g: 'from-amber-500 to-orange-500', icon: <Bell size={13} /> },
                { label: 'Severe Cases', value: stats.by_severity?.severe ?? 0, g: 'from-slate-600 to-slate-800', icon: <AlertTriangle size={13} /> },
              ].map(s => (
                <div key={s.label} className={`bg-gradient-to-br ${s.g} text-white rounded-xl p-2.5 flex items-center justify-between shadow-sm`}>
                  <div>
                    <p className="text-[9px] font-bold opacity-80 uppercase tracking-wide">{s.label}</p>
                    <p className="text-xl font-extrabold">{s.value}</p>
                  </div>
                  <div className="opacity-30">{s.icon}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Trash Bin View ────────────────────────────────────────── */}
        {showTrash ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">

            {/* Trash Actions Bar */}
            <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <p className="text-[11px] font-extrabold text-slate-700">Trashed Medical Records</p>

              {selectedTrashIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded">{selectedTrashIds.length} Selected</span>
                  <button
                    onClick={handleBulkRestore}
                    className="flex items-center gap-1 px-3 py-1 text-[10px] font-extrabold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer border-none outline-none transition">
                    <RotateCcw size={11} /> Restore Selected
                  </button>
                  <button
                    onClick={handleBulkForceDelete}
                    className="flex items-center gap-1 px-3 py-1 text-[10px] font-extrabold bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer border-none outline-none transition">
                    <Trash2 size={11} /> Delete Permanently
                  </button>
                </div>
              )}
            </div>

            {/* Trash Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-[11px] border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-gray-200 text-[10px] text-gray-500 font-extrabold uppercase">
                  <tr>
                    <th className="px-3 py-2 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={trashRecords.length > 0 && selectedTrashIds.length === trashRecords.length}
                        onChange={() => {
                          if (selectedTrashIds.length === trashRecords.length) setSelectedTrashIds([]);
                          else setSelectedTrashIds(trashRecords.map(r => r.id));
                        }}
                        className="rounded accent-purple-600 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-2 w-8 text-center">#</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Complaint / Diagnosis</th>
                    <th className="px-3 py-2">Deleted At</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTrash ? (
                    <tr><td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-7 h-7 border-b-2 border-rose-500 rounded-full animate-spin" />
                        <p className="text-gray-400 font-semibold">Loading trash bin…</p>
                      </div>
                    </td></tr>
                  ) : trashRecords.length === 0 ? (
                    <tr><td colSpan={8} className="py-16 text-center text-gray-400">
                      <Trash2 size={36} className="text-gray-200 mx-auto mb-2" />
                      <p className="font-extrabold text-[11px]">Trash bin is empty</p>
                    </td></tr>
                  ) : trashRecords.map((r, idx) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-slate-50 transition">
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedTrashIds.includes(r.id)}
                          onChange={() => setSelectedTrashIds(prev => prev.includes(r.id) ? prev.filter(x => x !== r.id) : [...prev, r.id])}
                          className="rounded accent-purple-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2 text-center text-[10px] font-bold text-gray-400">{idx + 1}</td>
                      <td className="px-3 py-2 font-bold text-slate-700">{fmtDate(r.visit_date)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {r.photo_url
                            ? <img src={r.photo_url} alt="" className="w-6 h-6 rounded-lg object-cover flex-shrink-0" />
                            : <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0"><User size={10} /></div>
                          }
                          <div>
                            <p className="font-extrabold text-slate-800 text-[11px]">{r.student_name}</p>
                            <p className="text-[9px] text-gray-400">{r.class_name}{r.section ? ` - ${r.section}` : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2"><TypeBadge type={r.record_type} /></td>
                      <td className="px-3 py-2">
                        <p className="font-bold text-slate-700">{r.complaint}</p>
                        <p className="text-[9px] text-gray-400">{r.diagnosis}</p>
                      </td>
                      <td className="px-3 py-2 text-gray-400">{r.created_at ? fmtDate(r.created_at) : '—'}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRestore(r.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer bg-transparent border-none outline-none transition"
                            title="Restore">
                            <RotateCcw size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTrashIds([r.id]);
                              handleBulkForceDelete();
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer bg-transparent border-none outline-none transition"
                            title="Delete Permanently">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ── Active Records View ─────────────────────────────────── */
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">

            {/* Filters */}
            <div className="px-3 py-2 border-b border-gray-100 flex flex-wrap items-center gap-2 flex-shrink-0">
              <div className="relative min-w-[190px]">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Student, complaint, diagnosis…"
                  className="pl-7 pr-3 py-1.5 text-[11px] border border-gray-200 rounded-lg w-full outline-none focus:border-rose-400 bg-slate-50" />
              </div>
              <div className="w-32">
                <Select options={typeOpts} value={typeOpts.find(o => o.value === filterType) ?? null}
                  onChange={opt => setFilterType(String(opt?.value ?? ''))} styles={selSm} isClearable={false} />
              </div>
              <div className="w-28">
                <Select options={sevOpts} value={sevOpts.find(o => o.value === filterSev) ?? null}
                  onChange={opt => setFilterSev(String(opt?.value ?? ''))} styles={selSm} isClearable={false} />
              </div>
              <div className="w-28">
                <Select options={[{ value: '', label: 'Classes' }, ...classes]}
                  value={[{ value: '', label: 'Classes' }, ...classes].find(c => String(c.value) === filterClass) ?? null}
                  onChange={opt => setFilterClass(opt?.value ? String(opt.value) : '')}
                  styles={selSm} placeholder="Class" isClearable={false} />
              </div>
              <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
                className="py-1 px-2 text-[11px] border border-gray-200 rounded-lg outline-none focus:border-rose-400 bg-slate-50" />
              <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
                className="py-1 px-2 text-[11px] border border-gray-200 rounded-lg outline-none focus:border-rose-400 bg-slate-50" />
              <span className="text-[10px] text-gray-400 font-semibold ml-auto">{total} records</span>
              <button onClick={() => { setSearch(''); setFilterType(''); setFilterSev(''); setFilterClass(''); setFilterFrom(''); setFilterTo(''); }}
                className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-rose-600 bg-transparent border-none cursor-pointer outline-none transition">
                <RefreshCw size={11} /> Clear
              </button>
            </div>

            {/* Active Bulk Action Bar */}
            {selectedIds.length > 0 && (
              <div className="px-3 py-1.5 bg-rose-50 border-b border-rose-100 flex items-center gap-3 flex-shrink-0 animate-fade-in">
                <span className="text-[10px] font-bold text-rose-700">{selectedIds.length} Selected</span>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 px-3 py-1 text-[10px] font-extrabold bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer border-none outline-none transition">
                  <Trash2 size={11} /> Move Selected to Trash
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer outline-none ml-auto">
                  Deselect All
                </button>
              </div>
            )}

            {/* Active Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-[11px] border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-gray-200 text-[10px] text-gray-500 font-extrabold uppercase">
                  <tr>
                    <th className="px-3 py-2 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={records.length > 0 && selectedIds.length === records.length}
                        onChange={() => {
                          if (selectedIds.length === records.length) setSelectedIds([]);
                          else setSelectedIds(records.map(r => r.id));
                        }}
                        className="rounded accent-purple-600 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-2 w-8 text-center">#</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Complaint / Diagnosis</th>
                    <th className="px-3 py-2">Vitals</th>
                    <th className="px-3 py-2">Severity</th>
                    <th className="px-3 py-2">Follow-up</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={10} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-7 h-7 border-b-2 border-rose-500 rounded-full animate-spin" />
                        <p className="text-gray-400 font-semibold">Loading records…</p>
                      </div>
                    </td></tr>
                  ) : records.length === 0 ? (
                    <tr><td colSpan={10} className="py-16 text-center">
                      <Heart size={36} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-extrabold">No medical records found</p>
                    </td></tr>
                  ) : records.map((r, idx) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-rose-50/20 transition">
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(r.id)}
                          onChange={() => setSelectedIds(prev => prev.includes(r.id) ? prev.filter(x => x !== r.id) : [...prev, r.id])}
                          className="rounded accent-purple-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2 text-center text-[10px] font-bold text-gray-400">{(page - 1) * perPage + idx + 1}</td>
                      <td className="px-3 py-2">
                        <p className="font-bold text-slate-700">{fmtDate(r.visit_date)}</p>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {r.photo_url
                            ? <img src={r.photo_url} alt="" className="w-6 h-6 rounded-lg object-cover flex-shrink-0 border border-rose-100" />
                            : <div className="w-6 h-6 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-400 flex-shrink-0"><User size={10} /></div>
                          }
                          <div className="min-w-0">
                            <button onClick={() => openProfile(r.std_id ?? r.student_id)}
                              className="text-[11px] font-extrabold text-purple-700 hover:underline bg-transparent border-none cursor-pointer outline-none p-0 text-left truncate">
                              {r.student_name}
                            </button>
                            <p className="text-[9px] text-gray-400">{r.class_name}{r.section ? ` - ${r.section}` : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2"><TypeBadge type={r.record_type} /></td>
                      <td className="px-3 py-2 max-w-[160px]">
                        {r.complaint && <p className="text-[10px] font-bold text-slate-700 truncate">{r.complaint}</p>}
                        {r.diagnosis && <p className="text-[9px] text-gray-500 truncate">{r.diagnosis}</p>}
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-[9px] text-gray-500 space-y-0.5">
                          {r.height && <p>📏 {r.height}cm {r.weight ? `· ⚖️ ${r.weight}kg` : ''} {r.bmi ? `· BMI ${r.bmi}` : ''}</p>}
                          {r.temperature && <p>🌡️ {r.temperature}°F {r.blood_pressure ? `· 💓 ${r.blood_pressure}` : ''}</p>}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <SevBadge sev={r.severity} />
                        {r.referred_to_hospital && <p className="text-[9px] font-bold text-rose-600 mt-0.5">🏥 Referred</p>}
                      </td>
                      <td className="px-3 py-2">
                        {r.follow_up_date
                          ? <span className="text-[9px] font-bold text-amber-600 flex items-center gap-1"><Bell size={9} />{fmtDate(r.follow_up_date)}</span>
                          : <span className="text-[9px] text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openProfile(r.std_id ?? r.student_id)}
                            className="p-1 text-purple-400 hover:bg-purple-50 hover:text-purple-600 rounded cursor-pointer bg-transparent border-none outline-none transition" title="View Profile">
                            <User size={12} />
                          </button>
                          <button onClick={() => {
                            setSelectedIds([r.id]);
                            handleBulkDelete();
                          }}
                            className="p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded cursor-pointer bg-transparent border-none outline-none transition" title="Move to Trash">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && records.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
                <span className="text-[10px] text-gray-400">{((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} of {total}</span>
                <div className="flex items-center gap-1">
                  <button disabled={page <= 1} onClick={() => loadRecords(page - 1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none"><ChevronLeft size={13} /></button>
                  {pageRange().map(p => <button key={p} onClick={() => loadRecords(p)} className={`w-5 h-5 rounded text-[10px] font-bold cursor-pointer border-none outline-none ${p === page ? 'bg-rose-600 text-white' : 'hover:bg-gray-100 text-gray-600 bg-transparent'}`}>{p}</button>)}
                  <button disabled={page >= lastPage} onClick={() => loadRecords(page + 1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none"><ChevronRight size={13} /></button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
