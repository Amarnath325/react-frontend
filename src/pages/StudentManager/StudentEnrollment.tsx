import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Download, RefreshCw, User, Users, ChevronRight,
  ChevronLeft, TrendingUp, BookOpen, CalendarDays, BarChart3,
  ClipboardList, CheckCircle, XCircle, Layers, School,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

// ─── Types ────────────────────────────────────────────────────────────────────
interface EnrollmentRecord {
  id: number;
  full_name: string;
  admission_number: string;
  roll_number: string;
  class_name: string;
  section: string;
  gender: string | null;
  category: string | null;
  blood_group: string | null;
  admission_date: string | null;
  nationality: string | null;
  medium: string | null;
  photo_url: string | null;
  father_name: string | null;
  father_mobile: string | null;
  user: { email: string; mobile: string; is_active: boolean; date_of_birth: string | null } | null;
}

interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: number;
  status: number;
}

interface ClassBreakdown {
  class_name: string;
  total: number;
  active: number;
  inactive: number;
  male: number;
  female: number;
}

interface MasterOption { value: string | number; label: string; }

// ─── react-select styles ────────────────────────────────────────────────────
const selStyles = {
  control: (b: any, s: any) => ({
    ...b, borderRadius: '8px', borderColor: s.isFocused ? '#a855f7' : '#e5e7eb',
    boxShadow: s.isFocused ? '0 0 0 2px rgba(168,85,247,.15)' : 'none',
    minHeight: '30px', height: '30px',
    '&:hover': { borderColor: '#a855f7' },
  }),
  valueContainer: (b: any) => ({ ...b, padding: '0 8px', height: '30px', display: 'flex', alignItems: 'center' }),
  input:        (b: any) => ({ ...b, margin: 0, padding: 0, fontSize: '11px' }),
  placeholder:  (b: any) => ({ ...b, fontSize: '11px', color: '#9ca3af' }),
  singleValue:  (b: any) => ({ ...b, fontSize: '11px', color: '#111827' }),
  indicatorsContainer: (b: any) => ({ ...b, height: '28px' }),
  option: (b: any, s: any) => ({
    ...b, fontSize: '11px', padding: '6px 10px', cursor: 'pointer',
    backgroundColor: s.isSelected ? '#a855f7' : s.isFocused ? '#f5f3ff' : 'transparent',
    color: s.isSelected ? '#fff' : '#374151',
  }),
  menu: (b: any) => ({ ...b, borderRadius: '8px', border: '1px solid #e5e7eb', zIndex: 9999 }),
};

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-extrabold text-slate-700 w-7 text-right">{value}</span>
    </div>
  );
}

// ─── Enrollment Row ───────────────────────────────────────────────────────────
function EnrollRow({ std, serial }: { std: EnrollmentRecord; serial: number }) {
  const isActive = std.user?.is_active ?? false;
  const dob = std.user?.date_of_birth
    ? new Date(std.user.date_of_birth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const admDate = std.admission_date
    ? new Date(std.admission_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <tr className="border-b border-gray-50 hover:bg-purple-50/20 transition">
      <td className="px-3 py-2 text-center">
        <span className="text-[10px] font-bold text-gray-400">{serial}</span>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          {std.photo_url ? (
            <img src={std.photo_url} alt="" className="w-7 h-7 rounded-lg object-cover border border-purple-100 flex-shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-400 flex-shrink-0">
              <User size={12} />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-slate-800 leading-tight text-[11px] truncate">{std.full_name}</p>
            <p className="text-[9px] text-gray-400">{std.user?.email ?? '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2">
        <p className="font-mono font-extrabold text-[10px] text-purple-600">{std.admission_number || '—'}</p>
        {std.roll_number && <p className="text-[9px] text-gray-400">Roll: {std.roll_number}</p>}
      </td>
      <td className="px-3 py-2">
        <span className="bg-purple-50 border border-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded text-[10px]">
          {std.class_name || '—'}
        </span>
        {std.section && <p className="text-[9px] text-gray-400 mt-0.5">§ {std.section}</p>}
      </td>
      <td className="px-3 py-2">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
          std.gender === 'MALE' || std.gender === 'Male'
            ? 'bg-blue-50 border-blue-100 text-blue-700'
            : std.gender
              ? 'bg-pink-50 border-pink-100 text-pink-700'
              : 'bg-gray-50 border-gray-200 text-gray-400'
        }`}>{std.gender ?? '—'}</span>
      </td>
      <td className="px-3 py-2">
        <p className="text-[10px] text-slate-600 font-semibold">{admDate}</p>
      </td>
      <td className="px-3 py-2">
        <p className="text-[10px] text-slate-600 font-semibold">{dob}</p>
      </td>
      <td className="px-3 py-2">
        {std.blood_group ? (
          <span className="text-[10px] font-extrabold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">{std.blood_group}</span>
        ) : <span className="text-[9px] text-gray-300">—</span>}
      </td>
      <td className="px-3 py-2">
        {std.category ? (
          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded">{std.category}</span>
        ) : <span className="text-[9px] text-gray-300">—</span>}
      </td>
      <td className="px-3 py-2">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          isActive ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-3 py-2">
        <p className="text-[10px] text-slate-600">{std.father_name ?? '—'}</p>
        <p className="text-[9px] text-gray-400">{std.user?.mobile || std.father_mobile || '—'}</p>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentEnrollment() {
  type ActiveTab = 'overview' | 'registry';
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const [students, setStudents]         = useState<EnrollmentRecord[]>([]);
  const [allStudents, setAllStudents]   = useState<EnrollmentRecord[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [currentAY, setCurrentAY]       = useState<AcademicYear | null>(null);
  const [classes, setClasses]           = useState<MasterOption[]>([]);
  const [loading, setLoading]           = useState(true);

  const [page, setPage]         = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal]       = useState(0);
  const [perPage]               = useState(20);

  const [search, setSearch]             = useState('');
  const [filterClass, setFilterClass]   = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [classBreakdown, setClassBreakdown] = useState<ClassBreakdown[]>([]);
  const [stats, setStats] = useState({
    total: 0, active: 0, inactive: 0,
    male: 0, female: 0, other: 0,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load masters ──────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/master/classes').then(res => {
      if (res.data?.success && res.data.data)
        setClasses(Object.entries(res.data.data).map(([id, name]) => ({ value: Number(id), label: name as string })));
    }).catch(() => {});

    api.get('/school/academic-years').then(res => {
      if (res.data?.success) {
        const years: AcademicYear[] = res.data.data ?? [];
        setAcademicYears(years);
        setCurrentAY(years.find(y => y.is_current === 1) ?? years[0] ?? null);
      }
    }).catch(() => {});

    // Load ALL students for overview stats (no pagination)
    api.get('/students', { params: { per_page: 9999 } }).then(res => {
      if (res.data?.success) {
        const list: EnrollmentRecord[] = res.data.data ?? [];
        setAllStudents(list);
        computeStats(list);
        computeClassBreakdown(list);
      }
    }).catch(() => {});
  }, []);

  const computeStats = (list: EnrollmentRecord[]) => {
    const active   = list.filter(s => s.user?.is_active).length;
    const inactive = list.length - active;
    const male     = list.filter(s => s.gender?.toUpperCase() === 'MALE').length;
    const female   = list.filter(s => s.gender?.toUpperCase() === 'FEMALE').length;
    const other    = list.length - male - female;
    setStats({ total: list.length, active, inactive, male, female, other });
  };

  const computeClassBreakdown = (list: EnrollmentRecord[]) => {
    const map: Record<string, ClassBreakdown> = {};
    list.forEach(s => {
      const key = s.class_name || 'Unknown';
      if (!map[key]) map[key] = { class_name: key, total: 0, active: 0, inactive: 0, male: 0, female: 0 };
      map[key].total++;
      if (s.user?.is_active) map[key].active++; else map[key].inactive++;
      if (s.gender?.toUpperCase() === 'MALE')   map[key].male++;
      if (s.gender?.toUpperCase() === 'FEMALE') map[key].female++;
    });
    const sorted = Object.values(map).sort((a, b) => {
      const numA = parseInt(a.class_name.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.class_name.replace(/\D/g, '')) || 0;
      return numA - numB || a.class_name.localeCompare(b.class_name);
    });
    setClassBreakdown(sorted);
  };

  // ── Load paginated students (registry tab) ────────────────────────────────
  const loadStudents = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, per_page: perPage };
      if (search)       params.search   = search;
      if (filterClass)  params.class_id = filterClass;
      if (filterGender) params.gender   = filterGender;
      if (filterStatus) params.status   = filterStatus;

      const res = await api.get('/students', { params });
      if (res.data?.success) {
        setStudents(res.data.data ?? []);
        setPage(res.data.current_page ?? 1);
        setLastPage(res.data.last_page ?? 1);
        setTotal(res.data.total ?? 0);
      }
    } catch {
      toast.error('Failed to load enrollment registry');
    } finally {
      setLoading(false);
    }
  }, [search, filterClass, filterGender, filterStatus, perPage]);

  useEffect(() => {
    if (activeTab !== 'registry') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadStudents(1), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [activeTab, loadStudents]);

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const params: Record<string, string | number> = {};
      if (search)       params.search   = search;
      if (filterClass)  params.class_id = filterClass;
      if (filterGender) params.gender   = filterGender;
      if (filterStatus) params.status   = filterStatus;

      const res = await api.get('/students/export', { params, responseType: 'blob' });
      const url  = URL.createObjectURL(new Blob([res.data]));
      const a    = document.createElement('a');
      a.href = url;
      a.download = `enrollment-registry-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Enrollment registry exported!');
    } catch {
      toast.error('Export failed');
    }
  };

  const pageRange = () => {
    const start = Math.max(1, page - 2);
    const end   = Math.min(lastPage, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const maxClass = classBreakdown.reduce((m, c) => Math.max(m, c.total), 0);

  // Gender pie data (approximate visual)
  const genderPct = stats.total > 0
    ? { male: Math.round((stats.male / stats.total) * 100), female: Math.round((stats.female / stats.total) * 100) }
    : { male: 0, female: 0 };

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <div className="flex flex-col h-full gap-3 px-4 py-3 overflow-hidden">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 leading-tight">Student Enrollment Registry</h2>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                {currentAY
                  ? `Academic Year: ${currentAY.name} (${new Date(currentAY.start_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})} – ${new Date(currentAY.end_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})})`
                  : 'Complete enrollment records across all classes and sections'}
              </p>
            </div>
            {activeTab === 'registry' && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition cursor-pointer border-none outline-none"
              >
                <Download size={13} /> Export CSV
              </button>
            )}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-6 gap-2">
            {[
              { label: 'Total Enrolled',  value: stats.total,    gradient: 'from-violet-500 to-purple-600',  icon: <Users size={14} /> },
              { label: 'Active',          value: stats.active,   gradient: 'from-emerald-500 to-teal-600',   icon: <CheckCircle size={14} /> },
              { label: 'Inactive',        value: stats.inactive, gradient: 'from-rose-500 to-red-600',       icon: <XCircle size={14} /> },
              { label: 'Male',            value: stats.male,     gradient: 'from-blue-500 to-indigo-600',    icon: <User size={14} /> },
              { label: 'Female',          value: stats.female,   gradient: 'from-pink-500 to-fuchsia-600',   icon: <User size={14} /> },
              { label: 'Total Classes',   value: classBreakdown.length, gradient: 'from-amber-500 to-orange-600', icon: <School size={14} /> },
            ].map(s => (
              <div key={s.label} className={`bg-gradient-to-br ${s.gradient} text-white rounded-xl p-2.5 flex items-center justify-between shadow-sm`}>
                <div>
                  <p className="text-[9px] font-bold opacity-80 uppercase tracking-wide leading-tight">{s.label}</p>
                  <p className="text-lg font-extrabold mt-0.5">{s.value}</p>
                </div>
                <div className="opacity-40">{s.icon}</div>
              </div>
            ))}
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2">
            {[
              { id: 'overview', label: 'Enrollment Overview', icon: <BarChart3 size={12} /> },
              { id: 'registry', label: 'Full Registry',       icon: <ClipboardList size={12} /> },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as ActiveTab)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer border-none outline-none transition ${
                  activeTab === t.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB 1 — Enrollment Overview                                   */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="flex-1 overflow-auto grid grid-cols-3 gap-3">

            {/* Class-wise Breakdown (wide) */}
            <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-purple-500" />
                  <p className="text-[11px] font-extrabold text-slate-700">Class-wise Enrollment Breakdown</p>
                </div>
                <span className="text-[10px] text-gray-400 font-semibold">{classBreakdown.length} classes</span>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-[11px] border-collapse">
                  <thead className="sticky top-0 bg-slate-50 border-b border-gray-100 text-[10px] text-gray-500 font-extrabold uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">Class</th>
                      <th className="px-4 py-2 text-left">Total Students</th>
                      <th className="px-4 py-2 text-left">Active</th>
                      <th className="px-4 py-2 text-left">Male / Female</th>
                      <th className="px-4 py-2 text-right">Fill Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classBreakdown.length === 0 ? (
                      <tr><td colSpan={5} className="py-12 text-center text-gray-400 text-[11px]">Loading breakdown…</td></tr>
                    ) : classBreakdown.map((cls, idx) => {
                      const activePct = cls.total > 0 ? Math.round((cls.active / cls.total) * 100) : 0;
                      const colors = ['from-violet-500 to-purple-600', 'from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-500', 'from-pink-500 to-fuchsia-600', 'from-cyan-500 to-sky-600'];
                      const c = colors[idx % colors.length];
                      return (
                        <tr key={cls.class_name} className="border-b border-gray-50 hover:bg-purple-50/20 transition">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${c} flex items-center justify-center text-white text-[9px] font-extrabold`}>
                                {cls.class_name.slice(0, 2)}
                              </div>
                              <span className="font-extrabold text-slate-700">{cls.class_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <MiniBar value={cls.total} max={maxClass} color={`bg-gradient-to-r ${c}`} />
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${activePct}%` }} />
                              </div>
                              <span className="text-[10px] font-bold text-emerald-600 w-8 text-right">{cls.active}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-400" />
                                <span className="text-[10px] font-bold text-blue-600">{cls.male}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-pink-400" />
                                <span className="text-[10px] font-bold text-pink-600">{cls.female}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={`text-[10px] font-extrabold ${activePct === 100 ? 'text-green-600' : 'text-gray-500'}`}>{activePct}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {classBreakdown.length > 0 && (
                    <tfoot>
                      <tr className="bg-purple-50 border-t border-purple-100">
                        <td className="px-4 py-2 font-extrabold text-purple-700 text-[11px]">TOTAL</td>
                        <td className="px-4 py-2 font-extrabold text-purple-700 text-[11px]">{stats.total} students</td>
                        <td className="px-4 py-2 font-extrabold text-emerald-600 text-[11px]">{stats.active}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-blue-600">{stats.male} M</span>
                            <span className="text-[10px] font-bold text-pink-600">{stats.female} F</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right font-extrabold text-purple-700 text-[11px]">
                          {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-3">

              {/* Gender Distribution */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={13} className="text-purple-500" />
                  <p className="text-[11px] font-extrabold text-slate-700">Gender Distribution</p>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Male',   count: stats.male,   pct: genderPct.male,   color: 'bg-blue-400',  text: 'text-blue-600',  badge: 'bg-blue-50 border-blue-200' },
                    { label: 'Female', count: stats.female, pct: genderPct.female, color: 'bg-pink-400',  text: 'text-pink-600',  badge: 'bg-pink-50 border-pink-200' },
                    { label: 'Other',  count: stats.other,  pct: stats.total > 0 ? 100 - genderPct.male - genderPct.female : 0, color: 'bg-gray-300', text: 'text-gray-500', badge: 'bg-gray-50 border-gray-200' },
                  ].map(g => (
                    <div key={g.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${g.badge} ${g.text}`}>{g.label}</span>
                        <span className={`text-[10px] font-extrabold ${g.text}`}>{g.count} <span className="text-gray-400 font-semibold">({g.pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${g.color} rounded-full transition-all`} style={{ width: `${g.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Visual stacked bar */}
                <div className="flex mt-3 h-4 rounded-full overflow-hidden gap-px">
                  <div className="bg-blue-400 transition-all" style={{ flex: stats.male || 1 }} title={`Male: ${stats.male}`} />
                  <div className="bg-pink-400 transition-all" style={{ flex: stats.female || 0 }} title={`Female: ${stats.female}`} />
                  {stats.other > 0 && <div className="bg-gray-300" style={{ flex: stats.other }} />}
                </div>
              </div>

              {/* Academic Years */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays size={13} className="text-purple-500" />
                  <p className="text-[11px] font-extrabold text-slate-700">Academic Years</p>
                </div>
                <div className="space-y-2 overflow-auto max-h-48">
                  {academicYears.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic">No academic years found</p>
                  ) : academicYears.map(ay => (
                    <div
                      key={ay.id}
                      className={`flex items-center justify-between p-2 rounded-lg border ${
                        ay.is_current ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-gray-100'
                      }`}
                    >
                      <div>
                        <p className={`text-[11px] font-extrabold ${ay.is_current ? 'text-purple-700' : 'text-slate-700'}`}>{ay.name}</p>
                        <p className="text-[9px] text-gray-400">{new Date(ay.start_date).toLocaleDateString('en-IN',{month:'short',year:'numeric'})} – {new Date(ay.end_date).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}</p>
                      </div>
                      {ay.is_current ? (
                        <span className="text-[9px] font-extrabold text-purple-600 bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded-full">Current</span>
                      ) : (
                        <span className="text-[9px] text-gray-400 font-semibold bg-gray-100 px-1.5 py-0.5 rounded-full">Past</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Active vs Inactive */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={13} className="text-purple-500" />
                  <p className="text-[11px] font-extrabold text-slate-700">Enrollment Status</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center">
                    <p className="text-xl font-extrabold text-emerald-600">{stats.active}</p>
                    <p className="text-[9px] font-bold text-emerald-500 uppercase">Active</p>
                  </div>
                  <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-2.5 text-center">
                    <p className="text-xl font-extrabold text-red-500">{stats.inactive}</p>
                    <p className="text-[9px] font-bold text-red-400 uppercase">Inactive</p>
                  </div>
                </div>
                <div className="flex mt-2 h-3 rounded-full overflow-hidden">
                  <div className="bg-emerald-400" style={{ flex: stats.active || 1 }} />
                  {stats.inactive > 0 && <div className="bg-red-400" style={{ flex: stats.inactive }} />}
                </div>
                {stats.total > 0 && (
                  <p className="text-[9px] text-gray-400 text-center mt-1 font-semibold">
                    {Math.round((stats.active / stats.total) * 100)}% active enrollment rate
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB 2 — Full Registry Table                                   */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'registry' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">
            {/* Filter bar */}
            <div className="px-3 py-2.5 border-b border-gray-100 flex flex-wrap items-center gap-2 flex-shrink-0">
              <div className="relative min-w-[200px]">
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
                  styles={selStyles} placeholder="All Classes" isClearable={false}
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
                  styles={selStyles} isClearable={false}
                />
              </div>
              <div className="w-28">
                <Select
                  options={[
                    { value: '', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                  value={{ value: filterStatus, label: filterStatus ? (filterStatus === 'active' ? 'Active' : 'Inactive') : 'All Status' }}
                  onChange={opt => setFilterStatus(opt?.value ?? '')}
                  styles={selStyles} isClearable={false}
                />
              </div>
              <span className="text-[10px] text-gray-400 font-semibold ml-auto">{total} records</span>
              <button
                onClick={() => { setSearch(''); setFilterClass(''); setFilterGender(''); setFilterStatus(''); }}
                className="flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-purple-600 bg-transparent border-none cursor-pointer transition outline-none"
              >
                <RefreshCw size={12} /> Clear
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
                    <th className="px-3 py-2">Gender</th>
                    <th className="px-3 py-2">Adm. Date</th>
                    <th className="px-3 py-2">DOB</th>
                    <th className="px-3 py-2">Blood</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Parent</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={11} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-7 h-7 border-b-2 border-purple-500 rounded-full animate-spin" />
                        <p className="text-gray-400 font-semibold">Loading enrollment registry…</p>
                      </div>
                    </td></tr>
                  ) : students.length === 0 ? (
                    <tr><td colSpan={11} className="py-16 text-center">
                      <BookOpen size={36} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-extrabold">No enrollment records found</p>
                    </td></tr>
                  ) : students.map((std, idx) => (
                    <EnrollRow key={std.id} std={std} serial={(page - 1) * perPage + idx + 1} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && students.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
                <span className="text-[10px] text-gray-400">
                  Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} of {total} enrolled students
                </span>
                <div className="flex items-center gap-1">
                  <button disabled={page <= 1} onClick={() => loadStudents(page - 1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none">
                    <ChevronLeft size={14} />
                  </button>
                  {pageRange().map(p => (
                    <button key={p} onClick={() => loadStudents(p)} className={`w-6 h-6 rounded text-[10px] font-bold cursor-pointer border-none outline-none transition ${p === page ? 'bg-purple-600 text-white' : 'hover:bg-gray-100 text-gray-600 bg-transparent'}`}>{p}</button>
                  ))}
                  <button disabled={page >= lastPage} onClick={() => loadStudents(page + 1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
