import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowRight, Users, Search, Check, CheckSquare, Square,
  ChevronRight, ChevronLeft, TrendingUp, RefreshCw, User,
  AlertTriangle, CheckCircle, XCircle, Zap, BookOpen, GraduationCap,
  Filter, ChevronDown, Info,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StudentRow {
  id: number;
  full_name: string;
  admission_number: string;
  roll_number: string;
  class_name: string;
  section: string;
  photo_url: string | null;
  gender: string | null;
  user: { is_active: boolean } | null;
  selected: boolean;
}

interface AcademicYear { id: number; name: string; is_current: number; }
interface MasterOption  { value: string | number; label: string; }

type PromotionType = 'automatic' | 'manual';
type Step = 1 | 2 | 3;

// ─── react-select styles ──────────────────────────────────────────────────────
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

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepBadge({ step, current, label }: { step: number; current: Step; label: string }) {
  const done    = current > step;
  const active  = current === step;
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold transition ${
        done ? 'bg-emerald-500 text-white' : active ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'
      }`}>
        {done ? <Check size={13} /> : step}
      </div>
      <span className={`text-[11px] font-bold hidden sm:block ${active ? 'text-purple-700' : done ? 'text-emerald-600' : 'text-gray-400'}`}>{label}</span>
      {step < 3 && <ChevronRight size={14} className="text-gray-300" />}
    </div>
  );
}

// ─── Promotion Success Modal ──────────────────────────────────────────────────
function SuccessModal({
  promoted, failed, toClass, onClose,
}: { promoted: number; failed: number; toClass: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 1200 }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 mx-auto">
          <GraduationCap size={32} />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-slate-800">Promotion Successful!</h3>
          <p className="text-[11px] text-gray-500 mt-1">Students have been promoted to <strong>{toClass}</strong></p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <p className="text-2xl font-extrabold text-emerald-600">{promoted}</p>
            <p className="text-[10px] text-emerald-500 font-bold uppercase">Promoted</p>
          </div>
          <div className={`border rounded-xl p-3 ${failed > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
            <p className={`text-2xl font-extrabold ${failed > 0 ? 'text-red-500' : 'text-gray-400'}`}>{failed}</p>
            <p className={`text-[10px] font-bold uppercase ${failed > 0 ? 'text-red-400' : 'text-gray-400'}`}>Failed</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2 text-[11px] font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition cursor-pointer border-none outline-none"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentPromotion() {
  const [step, setStep] = useState<Step>(1);

  // Masters
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses]             = useState<MasterOption[]>([]);

  // Step 1 config
  const [fromClassId, setFromClassId]     = useState('');
  const [fromSection, setFromSection]     = useState('');
  const [toClassId, setToClassId]         = useState('');
  const [toSection, setToSection]         = useState('');
  const [toAcYearId, setToAcYearId]       = useState('');
  const [promotionType, setPromotionType] = useState<PromotionType>('automatic');
  const [promotionDate, setPromotionDate] = useState(new Date().toISOString().split('T')[0]);

  // Step 2 students
  const [students, setStudents]     = useState<StudentRow[]>([]);
  const [loadingStd, setLoadingStd] = useState(false);
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [lastPage, setLastPage]     = useState(1);
  const [total, setTotal]           = useState(0);
  const [perPage]                   = useState(20);

  // Step 3
  const [promoting, setPromoting] = useState(false);
  const [result, setResult]       = useState<{ promoted: number; failed: number } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load masters ──────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/school/academic-years').then(res => {
      if (res.data?.success) setAcademicYears(res.data.data ?? []);
    }).catch(() => {});
    api.get('/master/classes').then(res => {
      if (res.data?.success && res.data.data)
        setClasses(Object.entries(res.data.data).map(([id, name]) => ({ value: Number(id), label: name as string })));
    }).catch(() => {});
  }, []);

  // ── Set default to_academic_year = current ────────────────────────────────
  useEffect(() => {
    const current = academicYears.find(y => y.is_current === 1);
    if (current && !toAcYearId) setToAcYearId(String(current.id));
  }, [academicYears]);

  // ── Load students (step 2) ────────────────────────────────────────────────
  const loadStudents = useCallback(async (p = 1) => {
    if (!fromClassId) return;
    setLoadingStd(true);
    try {
      const params: Record<string, string | number> = {
        page: p, per_page: perPage,
        class_id: fromClassId,
      };
      if (fromSection) params.section = fromSection;
      if (search)      params.search  = search;

      const res = await api.get('/students', { params });
      if (res.data?.success) {
        const rows: StudentRow[] = (res.data.data ?? []).map((s: any) => ({
          ...s,
          selected: promotionType === 'automatic', // auto select all
        }));
        setStudents(rows);
        setPage(res.data.current_page ?? 1);
        setLastPage(res.data.last_page ?? 1);
        setTotal(res.data.total ?? 0);
      }
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoadingStd(false);
    }
  }, [fromClassId, fromSection, search, perPage, promotionType]);

  useEffect(() => {
    if (step !== 2) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadStudents(1), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [step, loadStudents]);

  // ── Toggle selection ──────────────────────────────────────────────────────
  const toggleOne = (id: number) =>
    setStudents(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));

  const toggleAll = () => {
    const anyUnsel = students.some(s => !s.selected);
    setStudents(prev => prev.map(s => ({ ...s, selected: anyUnsel })));
  };

  const allSelected = students.length > 0 && students.every(s => s.selected);
  const selectedIds = students.filter(s => s.selected).map(s => s.id);

  // ── Step 1 → 2: validate and load ────────────────────────────────────────
  const goStep2 = async () => {
    if (!fromClassId) { toast.error('Please select the class to promote from'); return; }
    if (!toClassId)   { toast.error('Please select the target class'); return; }
    setStep(2);
  };

  // ── Step 2 → 3: confirm ───────────────────────────────────────────────────
  const goStep3 = () => {
    if (selectedIds.length === 0) { toast.error('Please select at least one student'); return; }
    setStep(3);
  };

  // ── Execute promotion ─────────────────────────────────────────────────────
  const handlePromote = async () => {
    setPromoting(true);
    try {
      const payload: Record<string, any> = {
        student_ids:    selectedIds,
        to_class_id:    Number(toClassId),
        promotion_type: promotionType,
        promotion_date: promotionDate,
      };
      if (toSection)  payload.to_section          = toSection;
      if (toAcYearId) payload.to_academic_year_id = Number(toAcYearId);

      const res = await api.post('/students/promote-bulk', payload);
      if (res.data?.success) {
        setResult({ promoted: res.data.promoted, failed: res.data.failed });
      } else {
        toast.error(res.data?.message ?? 'Promotion failed');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Promotion failed');
    } finally {
      setPromoting(false);
    }
  };

  // ── Reset all ─────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStep(1); setStudents([]); setSearch(''); setResult(null);
    setFromClassId(''); setFromSection(''); setToClassId(''); setToSection('');
    setPromotionType('automatic');
  };

  const fromClassName  = classes.find(c => String(c.value) === fromClassId)?.label ?? fromClassId;
  const toClassName    = classes.find(c => String(c.value) === toClassId)?.label   ?? toClassId;
  const toAcYearLabel  = academicYears.find(y => String(y.id) === toAcYearId)?.name ?? '';
  const ayOptions      = academicYears.map(y => ({ value: String(y.id), label: y.name + (y.is_current ? ' (Current)' : '') }));
  const pageRange = () => {
    const start = Math.max(1, page - 2); const end = Math.min(lastPage, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">

      {result && (
        <SuccessModal
          promoted={result.promoted}
          failed={result.failed}
          toClass={toClassName}
          onClose={handleReset}
        />
      )}

      <div className="flex flex-col h-full gap-3 px-4 py-3 overflow-hidden">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 leading-tight">Student Promotion</h2>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
              Promote students to the next class or academic year in bulk
            </p>
          </div>
          {step > 1 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-purple-600 bg-transparent border-none cursor-pointer transition outline-none"
            >
              <RefreshCw size={12} /> Start Over
            </button>
          )}
        </div>

        {/* ── Step Indicator ───────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-2 flex-shrink-0 shadow-sm">
          <StepBadge step={1} current={step} label="Configure Promotion" />
          <StepBadge step={2} current={step} label="Select Students" />
          <StepBadge step={3} current={step} label="Confirm & Promote" />
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* STEP 1 — Configure                                            */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="flex-1 overflow-auto space-y-3">

            {/* From ─────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><BookOpen size={13} /></div>
                <p className="text-[11px] font-extrabold text-slate-700">Current Class (Promote From)</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Class <span className="text-red-500">*</span></label>
                  <Select
                    options={[{ value: '', label: 'Select class…' }, ...classes]}
                    value={[{ value: '', label: 'Select class…' }, ...classes].find(c => String(c.value) === fromClassId) ?? null}
                    onChange={opt => setFromClassId(opt?.value ? String(opt.value) : '')}
                    styles={selSm} placeholder="Select class…" isClearable={false}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Section (optional)</label>
                  <input
                    value={fromSection}
                    onChange={e => setFromSection(e.target.value.toUpperCase())}
                    placeholder="e.g. A, B"
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-purple-400 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* To ───────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><GraduationCap size={13} /></div>
                <p className="text-[11px] font-extrabold text-slate-700">Target Class (Promote To)</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Class <span className="text-red-500">*</span></label>
                  <Select
                    options={[{ value: '', label: 'Select class…' }, ...classes]}
                    value={[{ value: '', label: 'Select class…' }, ...classes].find(c => String(c.value) === toClassId) ?? null}
                    onChange={opt => setToClassId(opt?.value ? String(opt.value) : '')}
                    styles={selSm} placeholder="Select class…" isClearable={false}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Section (optional)</label>
                  <input
                    value={toSection}
                    onChange={e => setToSection(e.target.value.toUpperCase())}
                    placeholder="e.g. A"
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-purple-400 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Academic Year</label>
                  <Select
                    options={ayOptions}
                    value={ayOptions.find(a => a.value === toAcYearId) ?? null}
                    onChange={opt => setToAcYearId(opt?.value ?? '')}
                    styles={selSm} placeholder="Select year…" isClearable={false}
                  />
                </div>
              </div>
            </div>

            {/* Options ──────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center"><Filter size={13} /></div>
                <p className="text-[11px] font-extrabold text-slate-700">Promotion Options</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Promotion Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'automatic', label: 'Automatic', desc: 'All students selected', icon: <Zap size={12} /> },
                      { id: 'manual',    label: 'Manual',    desc: 'You pick each one',     icon: <CheckSquare size={12} /> },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setPromotionType(t.id as PromotionType)}
                        className={`flex flex-col gap-1 p-2.5 rounded-lg border text-left cursor-pointer transition outline-none ${
                          promotionType === t.id
                            ? 'bg-purple-50 border-purple-300 text-purple-700'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-purple-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-extrabold text-[11px]">{t.icon} {t.label}</div>
                        <p className="text-[9px] opacity-70">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Promotion Date</label>
                  <input
                    type="date"
                    value={promotionDate}
                    onChange={e => setPromotionDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-purple-400 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Summary card */}
            {fromClassId && toClassId && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-3 flex items-center gap-3">
                <Info size={14} className="text-purple-500 flex-shrink-0" />
                <p className="text-[11px] text-purple-700 font-semibold">
                  Students from <strong>{fromClassName}{fromSection ? ` - ${fromSection}` : ''}</strong> will be promoted to{' '}
                  <strong>{toClassName}{toSection ? ` - ${toSection}` : ''}</strong>
                  {toAcYearLabel ? ` for academic year ${toAcYearLabel}` : ''}.
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={goStep2}
                disabled={!fromClassId || !toClassId}
                className="flex items-center gap-2 px-6 py-2 text-[11px] font-extrabold bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition disabled:opacity-50 cursor-pointer border-none outline-none shadow-md"
              >
                Next: Select Students <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* STEP 2 — Select Students                                      */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">
            {/* Summary bar */}
            <div className="px-4 py-2.5 bg-purple-50 border-b border-purple-100 flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-bold text-purple-700">{fromClassName}{fromSection ? ` - ${fromSection}` : ''}</span>
                <ArrowRight size={12} className="text-purple-400" />
                <span className="font-bold text-emerald-700">{toClassName}{toSection ? ` - ${toSection}` : ''}</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[10px] text-purple-600 font-bold bg-purple-100 px-2 py-0.5 rounded-full">
                  {selectedIds.length} of {total} selected
                </span>
              </div>
            </div>

            {/* Filter bar */}
            <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
              <div className="relative flex-1 max-w-xs">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search student name, adm. no..."
                  className="pl-7 pr-3 py-1.5 text-[11px] border border-gray-200 rounded-lg w-full outline-none focus:border-purple-400 bg-slate-50"
                />
              </div>
              {promotionType === 'manual' && (
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold text-gray-600 bg-slate-50 border border-gray-200 rounded-lg hover:bg-purple-50 hover:text-purple-700 cursor-pointer transition outline-none"
                >
                  {allSelected ? <CheckSquare size={11} /> : <Square size={11} />}
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
              )}
              {promotionType === 'automatic' && (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2 py-1.5 rounded-lg">
                  <Zap size={11} /> Auto-selecting all
                </div>
              )}
            </div>

            {/* Student table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-[11px] border-collapse text-left">
                <thead className="sticky top-0 bg-slate-50 border-b border-gray-200 text-[10px] text-gray-500 font-extrabold uppercase z-10">
                  <tr>
                    <th className="px-3 py-2 w-9">
                      {promotionType === 'manual' && (
                        <button onClick={toggleAll} className="text-gray-400 hover:text-purple-600 cursor-pointer bg-transparent border-none outline-none">
                          {allSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                        </button>
                      )}
                    </th>
                    <th className="px-3 py-2">Photo</th>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Adm. No / Roll</th>
                    <th className="px-3 py-2">Current Class</th>
                    <th className="px-3 py-2">Gender</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-center">Will Promote To</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStd ? (
                    <tr><td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-7 h-7 border-b-2 border-purple-500 rounded-full animate-spin" />
                        <p className="text-gray-400 font-semibold">Loading students…</p>
                      </div>
                    </td></tr>
                  ) : students.length === 0 ? (
                    <tr><td colSpan={8} className="py-16 text-center">
                      <Users size={36} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-extrabold">No students in this class</p>
                    </td></tr>
                  ) : students.map(std => (
                    <tr
                      key={std.id}
                      onClick={() => promotionType === 'manual' && toggleOne(std.id)}
                      className={`border-b border-gray-50 transition ${
                        promotionType === 'manual' ? 'cursor-pointer' : ''
                      } ${std.selected ? 'bg-purple-50/40' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-3 py-2">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${
                          std.selected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                        }`}>
                          {std.selected && <Check size={10} className="text-white" />}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {std.photo_url ? (
                          <img src={std.photo_url} alt="" className="w-7 h-7 rounded-lg object-cover border border-purple-100" />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-400">
                            <User size={12} />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-bold text-slate-800">{std.full_name}</p>
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-mono font-extrabold text-[10px] text-purple-600">{std.admission_number}</p>
                        {std.roll_number && <p className="text-[9px] text-gray-400">Roll: {std.roll_number}</p>}
                      </td>
                      <td className="px-3 py-2">
                        <span className="bg-blue-50 border border-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px]">
                          {std.class_name}{std.section ? ` - ${std.section}` : ''}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          std.gender?.toUpperCase() === 'MALE' ? 'bg-blue-50 border-blue-100 text-blue-600'
                            : std.gender ? 'bg-pink-50 border-pink-100 text-pink-600'
                            : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`}>{std.gender ?? '—'}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          std.user?.is_active ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${std.user?.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                          {std.user?.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {std.selected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <ArrowRight size={9} /> {toClassName}{toSection ? ` - ${toSection}` : ''}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-300 italic">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loadingStd && students.length > 0 && (
              <div className="px-3 py-2 border-t border-gray-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
                <span className="text-[10px] text-gray-400">{((page-1)*perPage)+1}–{Math.min(page*perPage, total)} of {total}</span>
                <div className="flex items-center gap-1">
                  <button disabled={page<=1} onClick={() => loadStudents(page-1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none"><ChevronLeft size={13} /></button>
                  {pageRange().map(p => <button key={p} onClick={() => loadStudents(p)} className={`w-5 h-5 rounded text-[10px] font-bold cursor-pointer border-none outline-none ${p===page?'bg-purple-600 text-white':'hover:bg-gray-100 text-gray-600 bg-transparent'}`}>{p}</button>)}
                  <button disabled={page>=lastPage} onClick={() => loadStudents(page+1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none"><ChevronRight size={13} /></button>
                </div>
                <button
                  onClick={goStep3}
                  disabled={selectedIds.length === 0}
                  className="flex items-center gap-2 px-4 py-1.5 text-[11px] font-extrabold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 cursor-pointer border-none outline-none"
                >
                  Proceed ({selectedIds.length}) <ArrowRight size={13} />
                </button>
              </div>
            )}
            {!loadingStd && students.length > 0 && selectedIds.length > 0 && (
              <div className="flex justify-end px-3 pb-2">
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* STEP 3 — Confirm & Promote                                    */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="flex-1 overflow-auto space-y-3">

            {/* Promotion Summary */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-[12px] font-extrabold text-slate-800 mb-3">Promotion Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  {[
                    ['From Class', `${fromClassName}${fromSection ? ` - ${fromSection}` : ''}`],
                    ['To Class',   `${toClassName}${toSection ? ` - ${toSection}` : ''}`],
                    ['Academic Year', toAcYearLabel || 'Not changed'],
                    ['Promotion Mode', promotionType === 'automatic' ? 'Automatic (All)' : 'Manual Selection'],
                    ['Promotion Date', new Date(promotionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-bold w-28">{k}:</span>
                      <span className="text-[11px] font-extrabold text-slate-700">{v}</span>
                    </div>
                  ))}
                </div>
                {/* Visual arrow card */}
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 border-2 border-blue-300 rounded-xl px-4 py-3 text-center">
                      <p className="text-[9px] text-blue-500 font-bold uppercase">From</p>
                      <p className="text-sm font-extrabold text-blue-700">{fromClassName}</p>
                      {fromSection && <p className="text-[10px] text-blue-400">Sec: {fromSection}</p>}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <TrendingUp size={20} className="text-purple-500" />
                      <p className="text-[9px] text-purple-500 font-bold">{selectedIds.length} Students</p>
                    </div>
                    <div className="bg-emerald-100 border-2 border-emerald-300 rounded-xl px-4 py-3 text-center">
                      <p className="text-[9px] text-emerald-500 font-bold uppercase">To</p>
                      <p className="text-sm font-extrabold text-emerald-700">{toClassName}</p>
                      {toSection && <p className="text-[10px] text-emerald-400">Sec: {toSection}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Student list preview */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                <p className="text-[11px] font-extrabold text-slate-700">Students to be Promoted ({selectedIds.length})</p>
              </div>
              <div className="max-h-52 overflow-auto">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0 bg-slate-50 border-b border-gray-100 text-[10px] text-gray-500 font-extrabold uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Adm. No</th>
                      <th className="px-3 py-2 text-left">Current Class</th>
                      <th className="px-3 py-2 text-center">→ Promote To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.filter(s => s.selected).map((s, idx) => (
                      <tr key={s.id} className="border-b border-gray-50">
                        <td className="px-3 py-1.5 text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-1.5 font-bold text-slate-700">{s.full_name}</td>
                        <td className="px-3 py-1.5 font-mono text-purple-600">{s.admission_number}</td>
                        <td className="px-3 py-1.5 text-gray-500">{s.class_name}{s.section ? ` - ${s.section}` : ''}</td>
                        <td className="px-3 py-1.5 text-center">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            {toClassName}{toSection ? ` - ${toSection}` : ''}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-extrabold text-amber-700">Confirm before proceeding</p>
                <p className="text-[10px] text-amber-600 mt-0.5">
                  This action will update the class of <strong>{selectedIds.length} student(s)</strong> and save their academic history. This cannot be undone automatically.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition outline-none"
              >
                <ChevronLeft size={13} /> Back
              </button>
              <button
                onClick={handlePromote}
                disabled={promoting}
                className="flex items-center gap-2 px-6 py-2 text-[11px] font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-60 cursor-pointer border-none outline-none shadow-md"
              >
                {promoting ? (
                  <><div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin" /> Promoting…</>
                ) : (
                  <><GraduationCap size={14} /> Promote {selectedIds.length} Student{selectedIds.length !== 1 ? 's' : ''}</>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
