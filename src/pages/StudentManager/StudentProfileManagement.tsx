import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Edit3, Eye, User, XCircle, ArrowLeft, RefreshCw,
  ChevronRight, ChevronLeft, ClipboardList, UserCheck, UserX,
  FileText, MapPin, HeartPulse, Phone, ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

// ─── Interfaces ────────────────────────────────────────────────────────────
interface StudentProfile {
  id: number;
  student_id: string;
  admission_number: string;
  roll_number: string;
  admission_date: string;
  section: string;
  full_name: string;
  class_name: string;
  gender: string | null;
  blood_group: string | null;
  nationality: string | null;
  mother_tongue: string | null;
  religion: string | null;
  category: string | null;
  medium: string | null;
  student_status_label: string | null;
  admission_type_label: string | null;
  admission_category_label: string | null;
  aadhaar_number: string | null;
  pen_number: string | null;
  apaar_id: string | null;
  age: number | null;
  // Parents
  father_name: string | null;
  father_mobile: string | null;
  father_occupation: string | null;
  mother_name: string | null;
  mother_mobile: string | null;
  mother_occupation: string | null;
  guardian_name: string | null;
  guardian_relation: string | null;
  guardian_mobile: string | null;
  parent_email: string | null;
  alternate_mobile: string | null;
  parent_phone: string | null;
  emergency_name: string | null;
  emergency_number: string | null;
  emergency_relation: string | null;
  // Address
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  permanent_address_line1: string | null;
  permanent_address_line2: string | null;
  permanent_city: string | null;
  permanent_state: string | null;
  permanent_pincode: string | null;
  same_as_temporary: boolean;
  // Previous School
  previous_school: string | null;
  previous_class: string | null;
  previous_board: string | null;
  previous_passing_year: string | null;
  previous_grade: string | null;
  previous_tc_number: string | null;
  previous_tc_date: string | null;
  previous_school_address: string | null;
  previous_school_city: string | null;
  previous_school_state: string | null;
  previous_admission_number: string | null;
  previous_reason_leaving_label: string | null;
  // Medical
  medical_conditions: string | null;
  allergies: string | null;
  doctor_name: string | null;
  doctor_contact: string | null;
  // Transport / Hostel
  transport_required: boolean;
  transport_route: string | null;
  pickup_point: string | null;
  hostel_required: boolean;
  room_number: string | null;
  // Doc URLs
  photo_url: string | null;
  aadhaar_card_url: string | null;
  migration_card_url: string | null;
  transfer_card_url: string | null;
  bonafide_card_url: string | null;
  character_card_url: string | null;
  marksheet_card_url: string | null;
  migration_number: string | null;
  transfer_number: string | null;
  // User
  user: {
    email: string;
    mobile: string;
    first_name: string;
    last_name: string;
    gender: string;
    date_of_birth: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    is_active: boolean;
  } | null;
}

interface Stats { total: number; active: number; inactive: number; }
interface MasterOption { value: string | number; label: string; }

// ─── react-select compact styles ──────────────────────────────────────────
const selStyles = {
  control: (b: any, s: any) => ({
    ...b, borderRadius: '8px', borderColor: s.isFocused ? '#a855f7' : '#e5e7eb',
    boxShadow: s.isFocused ? '0 0 0 2px rgba(168,85,247,.15)' : 'none',
    minHeight: '30px', height: '30px', backgroundColor: '#fff',
    '&:hover': { borderColor: '#a855f7' },
  }),
  valueContainer: (b: any) => ({ ...b, padding: '0 8px', height: '30px', alignItems: 'center', display: 'flex' }),
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

// ─── Profile Detail Drawer ─────────────────────────────────────────────────
function ProfileDrawer({ student, onClose }: { student: StudentProfile; onClose: () => void }) {
  type Tab = 'personal' | 'parents' | 'address' | 'medical' | 'documents';
  const [tab, setTab] = useState<Tab>('personal');

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'personal',  label: 'Personal',        icon: <User size={12} /> },
    { id: 'parents',   label: 'Parents',          icon: <Phone size={12} /> },
    { id: 'address',   label: 'Address',          icon: <MapPin size={12} /> },
    { id: 'medical',   label: 'Medical & School', icon: <HeartPulse size={12} /> },
    { id: 'documents', label: 'Files',            icon: <FileText size={12} /> },
  ];

  const Row = ({ label, value }: { label: string; value?: string | number | boolean | null }) => {
    const display = value === null || value === undefined || value === '' ? null
      : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
    if (!display) return null;
    return (
      <div className="border border-slate-100 bg-slate-50/60 rounded-lg p-2.5">
        <p className="text-[9px] font-bold uppercase text-gray-400 mb-0.5">{label}</p>
        <p className="text-[11px] font-bold text-slate-800">{display}</p>
      </div>
    );
  };

  const Section = ({ title }: { title: string }) => (
    <p className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wide pb-1 border-b border-purple-100 mt-1">
      {title}
    </p>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] flex justify-end" style={{ zIndex: 1200 }}>
      <div className="w-full max-w-lg bg-white h-full flex flex-col shadow-2xl border-l border-slate-200">

        {/* === Drawer Header === */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white flex items-start justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {student.photo_url ? (
              <img src={student.photo_url} alt="Photo" className="w-14 h-14 rounded-xl object-cover border-2 border-purple-100 shadow" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center text-purple-500 shadow">
                <User size={26} />
              </div>
            )}
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">{student.full_name}</h3>
              <p className="text-[10px] font-mono font-bold text-purple-600 mt-0.5">{student.admission_number || 'No Adm No'}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {student.roll_number && (
                  <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">Roll: {student.roll_number}</span>
                )}
                {student.class_name && (
                  <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded">{student.class_name}</span>
                )}
                {student.section && (
                  <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded">Section {student.section}</span>
                )}
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${student.user?.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {student.user?.is_active ? '● Active' : '● Inactive'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition cursor-pointer bg-transparent border-none p-1 rounded-lg hover:bg-slate-50 outline-none"
          >
            <XCircle size={20} />
          </button>
        </div>

        {/* === Tabs === */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 border-b border-gray-100 overflow-x-auto flex-shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[10px] whitespace-nowrap cursor-pointer transition border-none outline-none ${
                tab === t.id ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-500 bg-transparent hover:bg-purple-50 hover:text-purple-600'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* === Scrollable Content === */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* PERSONAL TAB */}
          {tab === 'personal' && (
            <div className="space-y-3">
              <Section title="Basic Identity" />
              <div className="grid grid-cols-2 gap-2">
                <Row label="First Name"     value={student.user?.first_name} />
                <Row label="Last Name"      value={student.user?.last_name} />
                <Row label="Gender"         value={student.gender ?? student.user?.gender} />
                <Row label="Date of Birth"  value={student.user?.date_of_birth} />
                <Row label="Age"            value={student.age} />
                <Row label="Blood Group"    value={student.blood_group} />
                <Row label="Aadhaar No."    value={student.aadhaar_number} />
                <Row label="Nationality"    value={student.nationality} />
                <Row label="Mother Tongue"  value={student.mother_tongue} />
                <Row label="Religion"       value={student.religion} />
                <Row label="Category"       value={student.category} />
              </div>
              <Section title="Academic Details" />
              <div className="grid grid-cols-2 gap-2">
                <Row label="Admission No."        value={student.admission_number} />
                <Row label="Roll Number"          value={student.roll_number} />
                <Row label="Admission Date"       value={student.admission_date} />
                <Row label="Section"              value={student.section} />
                <Row label="Medium"               value={student.medium} />
                <Row label="Admission Type"       value={student.admission_type_label} />
                <Row label="Admission Category"   value={student.admission_category_label} />
                <Row label="Student Status"       value={student.student_status_label} />
                <Row label="PEN Number"           value={student.pen_number} />
                <Row label="APAAR ID"             value={student.apaar_id} />
              </div>
            </div>
          )}

          {/* PARENTS TAB */}
          {tab === 'parents' && (
            <div className="space-y-3">
              <Section title="Father's Information" />
              <div className="grid grid-cols-2 gap-2">
                <Row label="Father's Name"       value={student.father_name} />
                <Row label="Father's Mobile"     value={student.father_mobile} />
                <Row label="Father's Occupation" value={student.father_occupation} />
              </div>
              <Section title="Mother's Information" />
              <div className="grid grid-cols-2 gap-2">
                <Row label="Mother's Name"       value={student.mother_name} />
                <Row label="Mother's Mobile"     value={student.mother_mobile} />
                <Row label="Mother's Occupation" value={student.mother_occupation} />
              </div>
              <Section title="Guardian / Emergency Contact" />
              <div className="grid grid-cols-2 gap-2">
                <Row label="Guardian Name"    value={student.guardian_name} />
                <Row label="Relation"         value={student.guardian_relation} />
                <Row label="Guardian Mobile"  value={student.guardian_mobile} />
                <Row label="Parent Email"     value={student.parent_email} />
                <Row label="Alternate Mobile" value={student.alternate_mobile} />
                <Row label="Emergency Name"   value={student.emergency_name} />
                <Row label="Emergency No."    value={student.emergency_number} />
                <Row label="Emergency Rel."   value={student.emergency_relation} />
              </div>
            </div>
          )}

          {/* ADDRESS TAB */}
          {tab === 'address' && (
            <div className="space-y-3">
              <Section title="Temporary / Current Address" />
              <div className="grid grid-cols-1 gap-2">
                <Row label="Street Address" value={student.address_line1} />
                <Row label="Address Line 2" value={student.address_line2} />
                <div className="grid grid-cols-3 gap-2">
                  <Row label="City"    value={student.city} />
                  <Row label="State"   value={student.state} />
                  <Row label="Pincode" value={student.pincode} />
                </div>
              </div>
              <Section title="Permanent Address" />
              <div className="grid grid-cols-1 gap-2">
                {student.same_as_temporary ? (
                  <div className="text-[11px] text-purple-600 font-bold bg-purple-50 p-3 rounded-xl border border-purple-100">
                    ✓ Same as temporary address
                  </div>
                ) : (
                  <>
                    <Row label="Street Address" value={student.permanent_address_line1} />
                    <Row label="Address Line 2" value={student.permanent_address_line2} />
                    <div className="grid grid-cols-3 gap-2">
                      <Row label="City"    value={student.permanent_city} />
                      <Row label="State"   value={student.permanent_state} />
                      <Row label="Pincode" value={student.permanent_pincode} />
                    </div>
                  </>
                )}
              </div>
              <Section title="Transport & Hostel" />
              <div className="grid grid-cols-2 gap-2">
                <Row label="Transport Required" value={student.transport_required} />
                <Row label="Transport Route"    value={student.transport_route} />
                <Row label="Pickup Point"       value={student.pickup_point} />
                <Row label="Hostel Required"    value={student.hostel_required} />
                <Row label="Room Number"        value={student.room_number} />
              </div>
            </div>
          )}

          {/* MEDICAL & PREV SCHOOL TAB */}
          {tab === 'medical' && (
            <div className="space-y-3">
              <Section title="Medical Information" />
              <div className="grid grid-cols-2 gap-2">
                <Row label="Doctor Name"        value={student.doctor_name} />
                <Row label="Doctor Contact"     value={student.doctor_contact} />
                <Row label="Medical Conditions" value={student.medical_conditions} />
                <Row label="Allergies"          value={student.allergies} />
              </div>
              <Section title="Previous School History" />
              <div className="grid grid-cols-2 gap-2">
                <Row label="School Name"          value={student.previous_school} />
                <Row label="Standard / Class"     value={student.previous_class} />
                <Row label="Board"                value={student.previous_board} />
                <Row label="Passing Year"         value={student.previous_passing_year} />
                <Row label="Grade Obtained"       value={student.previous_grade} />
                <Row label="TC Number"            value={student.previous_tc_number} />
                <Row label="TC Issue Date"        value={student.previous_tc_date} />
                <Row label="Admission No. (Prev)" value={student.previous_admission_number} />
                <Row label="Reason for Leaving"   value={student.previous_reason_leaving_label} />
                <Row label="School Address"       value={student.previous_school_address} />
                <Row label="School City"          value={student.previous_school_city} />
                <Row label="School State"         value={student.previous_school_state} />
              </div>
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {tab === 'documents' && (
            <div className="space-y-3">
              <Section title="Uploaded Documents & Certificates" />
              <div className="space-y-2">
                {([
                  { label: 'Student Photo',          url: student.photo_url },
                  { label: 'Aadhaar Card Copy',      url: student.aadhaar_card_url },
                  { label: 'Migration Certificate',  url: student.migration_card_url,  extra: student.migration_number ? `No: ${student.migration_number}` : null },
                  { label: 'Transfer Certificate',   url: student.transfer_card_url,   extra: student.transfer_number  ? `No: ${student.transfer_number}`  : null },
                  { label: 'Bonafide Certificate',   url: student.bonafide_card_url },
                  { label: 'Character Certificate',  url: student.character_card_url },
                  { label: 'Marksheet File',         url: student.marksheet_card_url },
                ] as { label: string; url: string | null; extra?: string | null }[]).map((doc, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
                    <div>
                      <p className="text-[11px] font-bold text-slate-700">{doc.label}</p>
                      {doc.extra && <p className="text-[9px] text-gray-400 font-semibold">{doc.extra}</p>}
                    </div>
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[10px] font-bold text-purple-600 hover:text-purple-800 bg-white border border-purple-100 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-purple-50 transition"
                      >
                        <Eye size={11} /> View File
                      </a>
                    ) : (
                      <span className="text-[9px] text-gray-400 bg-slate-100 px-2 py-0.5 rounded font-semibold italic">Not Uploaded</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function StudentProfileManagement() {
  const navigate = useNavigate();

  const [students, setStudents]   = useState<StudentProfile[]>([]);
  const [classes, setClasses]     = useState<MasterOption[]>([]);
  const [genders, setGenders]     = useState<MasterOption[]>([]);
  const [stats, setStats]         = useState<Stats | null>(null);
  const [loading, setLoading]     = useState(true);

  const [page, setPage]           = useState(1);
  const [lastPage, setLastPage]   = useState(1);
  const [total, setTotal]         = useState(0);
  const [perPage, setPerPage]     = useState(15);

  const [search, setSearch]           = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [activeProfile, setActiveProfile] = useState<StudentProfile | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Loaders ──────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/students/stats');
      if (res.data?.success) setStats(res.data.data);
    } catch {}
  }, []);

  const loadData = useCallback(async (p = 1) => {
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
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }, [search, filterClass, filterGender, filterStatus, perPage]);

  // ── Master dropdowns ──────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/master/classes').then(res => {
      if (res.data?.success && res.data.data)
        setClasses(Object.entries(res.data.data).map(([id, name]) => ({ value: Number(id), label: name as string })));
    }).catch(() => {});

    api.get('/master/genders').then(res => {
      if (res.data?.success && res.data.data)
        setGenders(Object.entries(res.data.data).map(([_, name]) => ({ value: name as string, label: name as string })));
    }).catch(() => {});

    loadStats();
  }, [loadStats]);

  // ── Debounced load on filter change ──────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadData(1), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [loadData]);

  const clearFilters = () => {
    setSearch(''); setFilterClass(''); setFilterGender(''); setFilterStatus('');
  };

  // ── Toggle student active status ──────────────────────────────────────────
  const handleToggleStatus = async (id: number) => {
    try {
      const res = await api.post(`/students/${id}/toggle-status`);
      if (res.data?.success) {
        toast.success(res.data.message ?? 'Status updated!');
        loadData(page);
        loadStats();
        if (activeProfile?.id === id)
          setActiveProfile(prev => prev ? { ...prev, user: prev.user ? { ...prev.user, is_active: !prev.user.is_active } : null } : null);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Status update failed');
    }
  };

  // ── Stats cards ───────────────────────────────────────────────────────────
  const statCards = [
    { label: 'Total Students',   value: stats?.total    ?? '—', color: 'from-violet-500 to-purple-600',   icon: <ClipboardList size={18} /> },
    { label: 'Active Profiles',  value: stats?.active   ?? '—', color: 'from-emerald-500 to-teal-600',    icon: <UserCheck size={18} /> },
    { label: 'Inactive Profiles',value: stats?.inactive ?? '—', color: 'from-rose-500 to-red-600',        icon: <UserX size={18} /> },
  ];

  // ── Pagination helper ─────────────────────────────────────────────────────
  const pageRange = () => {
    const start = Math.max(1, page - 2);
    const end   = Math.min(lastPage, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      {activeProfile && <ProfileDrawer student={activeProfile} onClose={() => setActiveProfile(null)} />}

      <div className="flex flex-col h-full gap-3 px-4 py-3 overflow-hidden">

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 leading-tight">Student Profile Management</h2>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                Inspect credentials, view unified records &amp; manage account status
              </p>
            </div>
            <button
              onClick={() => navigate('/students/admission')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition cursor-pointer outline-none"
            >
              <ArrowLeft size={13} /> Admission Gate
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            {statCards.map(s => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} text-white rounded-xl p-3 flex items-center justify-between shadow-sm`}>
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-80 tracking-wide">{s.label}</p>
                  <p className="text-xl font-extrabold mt-0.5">{s.value}</p>
                </div>
                <div className="opacity-50">{s.icon}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Filter Bar ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-shrink-0 px-3 py-2 flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, adm. no, roll..."
              className="pl-7 pr-3 py-1.5 text-[11px] border border-gray-200 rounded-lg w-full outline-none focus:border-purple-400 bg-slate-50"
            />
          </div>

          {/* Class filter */}
          <div className="w-36">
            <Select
              options={[{ value: '', label: 'All Classes' }, ...classes]}
              value={[{ value: '', label: 'All Classes' }, ...classes].find(c => String(c.value) === filterClass) ?? null}
              onChange={opt => setFilterClass(opt?.value !== undefined && opt.value !== '' ? String(opt.value) : '')}
              styles={selStyles}
              placeholder="All Classes"
              isClearable={false}
            />
          </div>

          {/* Gender filter */}
          <div className="w-32">
            <Select
              options={[{ value: '', label: 'All Genders' }, ...genders]}
              value={[{ value: '', label: 'All Genders' }, ...genders].find(g => String(g.value) === filterGender) ?? null}
              onChange={opt => setFilterGender(opt?.value !== undefined && opt.value !== '' ? String(opt.value) : '')}
              styles={selStyles}
              placeholder="Gender"
              isClearable={false}
            />
          </div>

          {/* Status filter */}
          <div className="w-32">
            <Select
              options={[
                { value: '',         label: 'All Statuses' },
                { value: 'active',   label: 'Active Only' },
                { value: 'inactive', label: 'Inactive Only' },
              ]}
              value={
                filterStatus === 'active'   ? { value: 'active',   label: 'Active Only' } :
                filterStatus === 'inactive' ? { value: 'inactive', label: 'Inactive Only' } :
                { value: '', label: 'All Statuses' }
              }
              onChange={opt => setFilterStatus(opt?.value ?? '')}
              styles={selStyles}
              isClearable={false}
            />
          </div>

          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-gray-400 hover:text-purple-600 bg-transparent border-none cursor-pointer transition ml-auto outline-none"
          >
            <RefreshCw size={12} /> Clear
          </button>
        </div>

        {/* ── Data Table ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-[11px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-gray-200 text-[10px] text-gray-500 font-extrabold uppercase">
                <tr>
                  <th className="px-4 py-2 w-12">Photo</th>
                  <th className="px-4 py-2">Adm. No</th>
                  <th className="px-4 py-2">Student Name</th>
                  <th className="px-4 py-2">Class</th>
                  <th className="px-4 py-2">Gender</th>
                  <th className="px-4 py-2">Contact</th>
                  <th className="px-4 py-2 text-center">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-7 h-7 border-b-2 border-purple-500 rounded-full animate-spin" />
                        <p className="text-gray-400 font-semibold">Loading student profiles…</p>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <User size={40} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-extrabold">No student profiles found</p>
                      <p className="text-[10px] text-gray-300 mt-1">Adjust filters or add students via the Admission Gate</p>
                    </td>
                  </tr>
                ) : students.map(std => (
                  <tr key={std.id} className="border-b border-gray-50 hover:bg-purple-50/20 transition">
                    {/* Photo */}
                    <td className="px-4 py-2">
                      {std.photo_url ? (
                        <img src={std.photo_url} alt="Photo" className="w-8 h-8 rounded-lg object-cover border border-purple-100" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-400 border border-purple-100">
                          <User size={14} />
                        </div>
                      )}
                    </td>
                    {/* Adm No */}
                    <td className="px-4 py-2">
                      <span className="font-mono font-extrabold text-[10px] text-purple-600">{std.admission_number || '—'}</span>
                    </td>
                    {/* Name */}
                    <td className="px-4 py-2">
                      <p className="font-bold text-slate-800 leading-tight">{std.full_name}</p>
                      <p className="text-[10px] text-gray-400">{std.user?.email ?? 'No email'}</p>
                    </td>
                    {/* Class */}
                    <td className="px-4 py-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="bg-purple-50 border border-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-lg text-[10px] w-fit">
                          {std.class_name ?? '—'}
                        </span>
                        {std.section && <span className="text-[9px] text-gray-400 font-semibold">Sec: {std.section}</span>}
                      </div>
                    </td>
                    {/* Gender */}
                    <td className="px-4 py-2 font-semibold text-slate-600">{std.gender ?? std.user?.gender ?? '—'}</td>
                    {/* Contact */}
                    <td className="px-4 py-2">
                      <p className="font-bold text-slate-700">{std.father_name ?? std.guardian_name ?? '—'}</p>
                      <p className="text-[10px] text-gray-400">{std.user?.mobile ?? std.father_mobile ?? '—'}</p>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        std.user?.is_active
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${std.user?.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                        {std.user?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => setActiveProfile(std)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-purple-600 transition cursor-pointer bg-transparent border-none outline-none"
                          title="View profile card"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => navigate(`/students/admission/edit/${std.id}`)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition cursor-pointer bg-transparent border-none outline-none"
                          title="Edit profile"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(std.id)}
                          className={`p-1.5 rounded-lg transition cursor-pointer bg-transparent border-none outline-none ${
                            std.user?.is_active
                              ? 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                              : 'hover:bg-green-50 text-slate-400 hover:text-green-600'
                          }`}
                          title={std.user?.is_active ? 'Deactivate account' : 'Activate account'}
                        >
                          {std.user?.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ────────────────────────────────────────────── */}
          {!loading && students.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">Per page:</span>
                <select
                  value={perPage}
                  onChange={e => { setPerPage(Number(e.target.value)); loadData(1); }}
                  className="border border-gray-200 rounded px-1.5 py-0.5 text-[10px] outline-none"
                >
                  {[10, 15, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-[10px] text-gray-400">
                  Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} of {total}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => loadData(page - 1)}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none"
                >
                  <ChevronLeft size={14} />
                </button>
                {pageRange().map(p => (
                  <button
                    key={p}
                    onClick={() => loadData(p)}
                    className={`w-6 h-6 rounded text-[10px] font-bold cursor-pointer border-none transition outline-none ${
                      p === page ? 'bg-purple-600 text-white' : 'hover:bg-gray-100 text-gray-600 bg-transparent'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={page >= lastPage}
                  onClick={() => loadData(page + 1)}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
