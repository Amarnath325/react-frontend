import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Printer, RefreshCw, Eye, User, Users,
  ChevronRight, ChevronLeft, Check, X, CreditCard,
  CheckSquare, Square, Layout, ZapIcon, Grid, XCircle,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

// ─── Types ──────────────────────────────────────────────────────────────────
interface StudentCard {
  id: number;
  full_name: string;
  admission_number: string;
  roll_number: string;
  class_name: string;
  section: string;
  photo_url: string | null;
  gender: string | null;
  blood_group: string | null;
  category: string | null;
  father_name: string | null;
  father_mobile: string | null;
  user: { email: string; mobile: string; date_of_birth: string | null; is_active: boolean } | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  nationality: string | null;
}

interface SchoolInfo {
  business_name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  logo: string | null;
  affiliation_board: string;
}

type TemplateId = 'classic' | 'modern' | 'minimal';
interface MasterOption { value: string | number; label: string; }

// ─── react-select compact styles ─────────────────────────────────────────────
const selStyles = {
  control: (b: any, s: any) => ({
    ...b, borderRadius: '8px', borderColor: s.isFocused ? '#a855f7' : '#e5e7eb',
    boxShadow: s.isFocused ? '0 0 0 2px rgba(168,85,247,.15)' : 'none',
    minHeight: '30px', height: '30px',
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

// ─── ID Card Templates ────────────────────────────────────────────────────────
function IDCardClassic({ student, school }: { student: StudentCard; school: SchoolInfo }) {
  return (
    <div
      style={{
        width: '85.6mm', minHeight: '54mm', background: 'white',
        border: '2px solid #7c3aed', borderRadius: '8px', overflow: 'hidden',
        fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(124,58,237,0.15)',
      }}
    >
      {/* Header strip */}
      <div style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {school.logo && (
          <img src={`${import.meta.env.VITE_API_URL ?? ''}storage/${school.logo}`} alt="Logo"
            style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '4px', background: 'white', padding: '2px' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '9px', lineHeight: 1.2 }}>{school.business_name || 'School Name'}</div>
          {school.affiliation_board && <div style={{ color: '#c4b5fd', fontSize: '7px', lineHeight: 1.2 }}>{school.affiliation_board}</div>}
        </div>
        <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', padding: '2px 6px' }}>
          <div style={{ color: 'white', fontSize: '6px', fontWeight: 700 }}>STUDENT ID</div>
        </div>
      </div>
      {/* Body */}
      <div style={{ display: 'flex', gap: '8px', padding: '8px', flex: 1 }}>
        {/* Photo */}
        <div style={{ flexShrink: 0 }}>
          {student.photo_url ? (
            <img src={student.photo_url} alt="Photo"
              style={{ width: '44px', height: '52px', objectFit: 'cover', border: '2px solid #7c3aed', borderRadius: '6px' }}
            />
          ) : (
            <div style={{ width: '44px', height: '52px', background: '#f5f3ff', border: '2px solid #7c3aed', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', fontSize: '18px' }}>👤</div>
          )}
        </div>
        {/* Info */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: 800, fontSize: '10px', color: '#1e1b4b', marginBottom: '3px', lineHeight: 1.2 }}>{student.full_name}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2px' }}>
            {[
              ['Adm. No', student.admission_number],
              ['Class', `${student.class_name || ''}${student.section ? ` - ${student.section}` : ''}`],
              ['Blood Grp', student.blood_group],
              ['Father', student.father_name],
              ['Mobile', student.user?.mobile || student.father_mobile],
            ].map(([label, val]) => val && (
              <div key={label} style={{ display: 'flex', gap: '4px', fontSize: '7px' }}>
                <span style={{ color: '#7c3aed', fontWeight: 700, minWidth: '36px' }}>{label}:</span>
                <span style={{ color: '#374151', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Footer */}
      <div style={{ background: '#f5f3ff', borderTop: '1px solid #e9d5ff', padding: '3px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '6.5px', color: '#6b7280' }}>{school.phone} | {school.email}</div>
        <div style={{ fontSize: '6px', color: '#7c3aed', fontWeight: 700 }}>Valid 2024-25</div>
      </div>
    </div>
  );
}

function IDCardModern({ student, school }: { student: StudentCard; school: SchoolInfo }) {
  return (
    <div
      style={{
        width: '85.6mm', minHeight: '54mm', overflow: 'hidden',
        fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column',
        borderRadius: '10px', boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
        background: 'linear-gradient(160deg, #0f172a 60%, #1e1b4b 100%)',
      }}
    >
      {/* Top accent */}
      <div style={{ height: '4px', background: 'linear-gradient(90deg, #a855f7, #06b6d4, #a855f7)', backgroundSize: '200% 100%' }} />
      <div style={{ display: 'flex', gap: '10px', padding: '8px', flex: 1, alignItems: 'flex-start' }}>
        {/* Left: Photo */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          {student.photo_url ? (
            <img src={student.photo_url} alt="Photo"
              style={{ width: '46px', height: '54px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #a855f7' }}
            />
          ) : (
            <div style={{ width: '46px', height: '54px', background: '#1e1b4b', border: '2px solid #a855f7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', fontSize: '22px' }}>👤</div>
          )}
          {student.blood_group && (
            <div style={{ background: '#a855f7', color: 'white', fontWeight: 800, fontSize: '7px', borderRadius: '4px', padding: '1px 4px' }}>{student.blood_group}</div>
          )}
        </div>
        {/* Right: Info */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ color: '#e9d5ff', fontSize: '6.5px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '1px' }}>STUDENT IDENTITY CARD</div>
          <div style={{ color: 'white', fontWeight: 900, fontSize: '10px', lineHeight: 1.2, marginBottom: '4px' }}>{student.full_name}</div>
          <div style={{ display: 'grid', gap: '2px' }}>
            {[
              ['ID', student.admission_number],
              ['Class', `${student.class_name || ''}${student.section ? ` § ${student.section}` : ''}`],
              ['Father', student.father_name],
              ['Contact', student.user?.mobile || student.father_mobile],
            ].map(([label, val]) => val && (
              <div key={label} style={{ display: 'flex', gap: '4px', fontSize: '7px', alignItems: 'center' }}>
                <span style={{ color: '#a855f7', fontWeight: 700, minWidth: '32px', fontSize: '6.5px', textTransform: 'uppercase' }}>{label}</span>
                <span style={{ color: '#d1d5db', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* School footer */}
      <div style={{ borderTop: '1px solid #334155', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {school.logo && (
          <img src={`${import.meta.env.VITE_API_URL ?? ''}storage/${school.logo}`} alt="Logo"
            style={{ width: '18px', height: '18px', objectFit: 'contain', borderRadius: '3px', background: 'white', padding: '1px' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '7px' }}>{school.business_name}</div>
          <div style={{ color: '#64748b', fontSize: '6px' }}>{school.city} | {school.phone}</div>
        </div>
        <div style={{ color: '#a855f7', fontSize: '6px', fontWeight: 700, textAlign: 'right' }}>
          <div>VALID</div><div>2024-25</div>
        </div>
      </div>
    </div>
  );
}

function IDCardMinimal({ student, school }: { student: StudentCard; school: SchoolInfo }) {
  return (
    <div
      style={{
        width: '85.6mm', minHeight: '54mm', background: 'white',
        border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden',
        fontFamily: '"Segoe UI", Arial, sans-serif', display: 'flex', flexDirection: 'column',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}
    >
      {/* Top bar */}
      <div style={{ height: '5px', background: 'linear-gradient(90deg, #10b981, #059669)' }} />
      {/* School header */}
      <div style={{ padding: '5px 8px', borderBottom: '1px solid #f0fdf4', display: 'flex', alignItems: 'center', gap: '5px' }}>
        {school.logo && (
          <img src={`${import.meta.env.VITE_API_URL ?? ''}storage/${school.logo}`} alt="Logo"
            style={{ width: '22px', height: '22px', objectFit: 'contain' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '8px', color: '#065f46' }}>{school.business_name}</div>
          <div style={{ fontSize: '6.5px', color: '#6b7280' }}>{school.address ? `${school.address}, ${school.city}` : school.city}</div>
        </div>
        <div style={{ fontSize: '6px', color: '#10b981', fontWeight: 700, border: '1px solid #10b981', borderRadius: '3px', padding: '1px 4px' }}>
          ID CARD
        </div>
      </div>
      {/* Body */}
      <div style={{ display: 'flex', gap: '8px', padding: '7px 8px', flex: 1, alignItems: 'center' }}>
        {student.photo_url ? (
          <img src={student.photo_url} alt="Photo"
            style={{ width: '42px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #d1fae5', flexShrink: 0 }}
          />
        ) : (
          <div style={{ width: '42px', height: '50px', background: '#f0fdf4', border: '1px solid #d1fae5', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '18px', flexShrink: 0 }}>👤</div>
        )}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: 800, fontSize: '10px', color: '#111827', marginBottom: '4px' }}>{student.full_name}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
            {[
              ['Adm. No', student.admission_number],
              ['Class', `${student.class_name || ''}`],
              ['Section', student.section],
              ['Blood', student.blood_group],
              ['DOB', student.user?.date_of_birth ? new Date(student.user.date_of_birth).toLocaleDateString('en-IN') : null],
              ['Category', student.category],
            ].map(([label, val]) => val && (
              <div key={label} style={{ fontSize: '7px' }}>
                <span style={{ color: '#6b7280' }}>{label}: </span>
                <span style={{ fontWeight: 700, color: '#111827' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Footer */}
      <div style={{ background: '#f0fdf4', borderTop: '1px solid #d1fae5', padding: '3px 8px', display: 'flex', justifyContent: 'space-between', fontSize: '6.5px', color: '#6b7280' }}>
        <span>Father: {student.father_name || '—'} | {student.user?.mobile || student.father_mobile || '—'}</span>
        <span style={{ color: '#10b981', fontWeight: 700 }}>2024-25</span>
      </div>
    </div>
  );
}

const TEMPLATES: { id: TemplateId; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'classic', label: 'Classic Purple',  icon: <CreditCard size={14} />, desc: 'Traditional layout with purple branding' },
  { id: 'modern',  label: 'Modern Dark',     icon: <ZapIcon size={14} />,    desc: 'Sleek dark gradient for premium feel' },
  { id: 'minimal', label: 'Minimal Green',   icon: <Layout size={14} />,     desc: 'Clean and lightweight design' },
];

function IDCardRenderer({ student, school, template }: { student: StudentCard; school: SchoolInfo; template: TemplateId }) {
  if (template === 'modern')  return <IDCardModern  student={student} school={school} />;
  if (template === 'minimal') return <IDCardMinimal student={student} school={school} />;
  return <IDCardClassic student={student} school={school} />;
}

// ─── Print Modal ──────────────────────────────────────────────────────────────
function PrintModal({
  students,
  school,
  template,
  onClose,
}: { students: StudentCard[]; school: SchoolInfo; template: TemplateId; onClose: () => void }) {

  const handlePrint = () => {
    const printContent = document.getElementById('id-card-print-area');
    if (!printContent) return;
    const win = window.open('', '_blank');
    if (!win) { toast.error('Popup blocked — allow popups and try again'); return; }
    win.document.write(`
      <html>
      <head>
        <title>Student ID Cards — ${school.business_name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: white; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { size: A4; margin: 10mm; }
          }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; padding: 5mm; }
        </style>
      </head>
      <body>
        <div class="grid">${printContent.innerHTML}</div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 1200 }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Print Preview — {students.length} ID Card{students.length !== 1 ? 's' : ''}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Verify cards before printing. Cards are arranged 2-per-row on A4.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition cursor-pointer border-none outline-none"
            >
              <Printer size={13} /> Print Now
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition cursor-pointer bg-transparent border-none outline-none">
              <XCircle size={20} />
            </button>
          </div>
        </div>
        {/* Cards Preview */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
          <div id="id-card-print-area" className="grid grid-cols-2 gap-4">
            {students.map(s => (
              <div key={s.id} className="flex justify-center">
                <IDCardRenderer student={s} school={school} template={template} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentIDCardManagement() {
  const [students, setStudents] = useState<StudentCard[]>([]);
  const [school, setSchool]     = useState<SchoolInfo>({
    business_name: '', address: '', city: '', phone: '', email: '', website: '', logo: null, affiliation_board: '',
  });
  const [classes, setClasses]   = useState<MasterOption[]>([]);
  const [loading, setLoading]   = useState(true);

  const [selected, setSelected]   = useState<Set<number>>(new Set());
  const [template, setTemplate]   = useState<TemplateId>('classic');
  const [previewStudent, setPreviewStudent] = useState<StudentCard | null>(null);
  const [showPrint, setShowPrint] = useState(false);

  const [page, setPage]         = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal]       = useState(0);
  const [perPage]               = useState(20);

  const [search, setSearch]           = useState('');
  const [filterClass, setFilterClass] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load school info ──────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/school/settings').then(res => {
      if (res.data?.success) setSchool(res.data.data ?? {});
    }).catch(() => {});
    api.get('/master/classes').then(res => {
      if (res.data?.success && res.data.data)
        setClasses(Object.entries(res.data.data).map(([id, name]) => ({ value: Number(id), label: name as string })));
    }).catch(() => {});
  }, []);

  // ── Load students ─────────────────────────────────────────────────────────
  const loadStudents = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, per_page: perPage };
      if (search)      params.search   = search;
      if (filterClass) params.class_id = filterClass;

      const res = await api.get('/students', { params });
      if (res.data?.success) {
        setStudents(res.data.data ?? []);
        setPage(res.data.current_page ?? 1);
        setLastPage(res.data.last_page ?? 1);
        setTotal(res.data.total ?? 0);
      }
    } catch (e: any) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [search, filterClass, perPage]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadStudents(1), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [loadStudents]);

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === students.length && students.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(students.map(s => s.id)));
    }
  };

  const selectedStudents = students.filter(s => selected.has(s.id));

  const handlePrintSelected = () => {
    if (selectedStudents.length === 0) { toast('No students selected', { icon: 'ℹ️' }); return; }
    setShowPrint(true);
  };

  const pageRange = () => {
    const start = Math.max(1, page - 2);
    const end   = Math.min(lastPage, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      {/* Print Modal */}
      {showPrint && (
        <PrintModal
          students={selectedStudents}
          school={school}
          template={template}
          onClose={() => setShowPrint(false)}
        />
      )}

      <div className="flex flex-col h-full gap-3 px-4 py-3 overflow-hidden">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 leading-tight">Student ID Card Management</h2>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                Generate, preview and print professional ID cards for your students
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selected.size > 0 && (
                <button
                  onClick={handlePrintSelected}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition cursor-pointer border-none outline-none"
                >
                  <Printer size={13} /> Print {selected.size} Card{selected.size !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>

          {/* Summary + Template Selector in same row */}
          <div className="flex gap-3 items-stretch">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 flex-1">
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-xl p-2.5 flex items-center justify-between">
                <div><p className="text-[9px] font-bold opacity-80 uppercase">Total Students</p><p className="text-lg font-extrabold">{total}</p></div>
                <Users size={16} className="opacity-40" />
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-2.5 flex items-center justify-between">
                <div><p className="text-[9px] font-bold opacity-80 uppercase">Selected</p><p className="text-lg font-extrabold">{selected.size}</p></div>
                <CheckSquare size={16} className="opacity-40" />
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl p-2.5 flex items-center justify-between">
                <div><p className="text-[9px] font-bold opacity-80 uppercase">This Page</p><p className="text-lg font-extrabold">{students.length}</p></div>
                <Grid size={16} className="opacity-40" />
              </div>
            </div>

            {/* Template Selector */}
            <div className="bg-white rounded-xl border border-gray-200 p-2.5 flex items-center gap-2 flex-shrink-0">
              <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">Template:</div>
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  title={t.desc}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer border transition outline-none ${
                    template === t.id
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300 hover:text-purple-600'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main two-column layout */}
        <div className="flex gap-3 flex-1 overflow-hidden">

          {/* ── Left: Student List ──────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden flex-1 min-w-0">
            {/* Filter bar */}
            <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
              <div className="relative flex-1 min-w-0">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, adm. no..."
                  className="pl-7 pr-3 py-1.5 text-[11px] border border-gray-200 rounded-lg w-full outline-none focus:border-purple-400 bg-slate-50"
                />
              </div>
              <div className="w-32 flex-shrink-0">
                <Select
                  options={[{ value: '', label: 'All Classes' }, ...classes]}
                  value={[{ value: '', label: 'All Classes' }, ...classes].find(c => String(c.value) === filterClass) ?? null}
                  onChange={opt => setFilterClass(opt?.value !== undefined && opt.value !== '' ? String(opt.value) : '')}
                  styles={selStyles}
                  placeholder="All Classes"
                  isClearable={false}
                />
              </div>
              <button
                onClick={selectAll}
                title={selected.size === students.length ? 'Deselect all' : 'Select all on page'}
                className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold text-gray-600 bg-slate-50 border border-gray-200 rounded-lg hover:bg-purple-50 hover:text-purple-700 cursor-pointer transition outline-none"
              >
                {selected.size === students.length && students.length > 0 ? <CheckSquare size={11} /> : <Square size={11} />}
                All
              </button>
              <button
                onClick={() => { setSearch(''); setFilterClass(''); setSelected(new Set()); }}
                className="text-[10px] font-bold text-gray-400 hover:text-purple-600 bg-transparent border-none cursor-pointer transition outline-none"
              >
                <RefreshCw size={12} />
              </button>
            </div>

            {/* Student table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-[11px] border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-gray-200 text-[10px] text-gray-500 font-extrabold uppercase">
                  <tr>
                    <th className="px-3 py-2 w-8" />
                    <th className="px-3 py-2 w-8">Photo</th>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Class</th>
                    <th className="px-3 py-2">Blood</th>
                    <th className="px-3 py-2 text-right">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-7 h-7 border-b-2 border-purple-500 rounded-full animate-spin" />
                        <p className="text-gray-400 font-semibold">Loading students…</p>
                      </div>
                    </td></tr>
                  ) : students.length === 0 ? (
                    <tr><td colSpan={6} className="py-16 text-center">
                      <CreditCard size={36} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-extrabold">No students found</p>
                    </td></tr>
                  ) : students.map(std => {
                    const isSelected = selected.has(std.id);
                    return (
                      <tr
                        key={std.id}
                        onClick={() => toggleSelect(std.id)}
                        className={`border-b border-gray-50 cursor-pointer transition ${isSelected ? 'bg-purple-50/60' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-3 py-2">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                            {isSelected && <Check size={10} className="text-white" />}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {std.photo_url ? (
                            <img src={std.photo_url} alt="" className="w-8 h-8 rounded-lg object-cover border border-purple-100" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-400">
                              <User size={14} />
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-bold text-slate-800 leading-tight">{std.full_name}</p>
                          <p className="text-[10px] font-mono text-purple-600 font-bold">{std.admission_number}</p>
                        </td>
                        <td className="px-3 py-2">
                          <span className="bg-purple-50 border border-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded text-[10px]">
                            {std.class_name || '—'}{std.section ? ` - ${std.section}` : ''}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {std.blood_group ? (
                            <span className="text-[10px] font-extrabold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">{std.blood_group}</span>
                          ) : <span className="text-gray-300 text-[10px]">—</span>}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={e => { e.stopPropagation(); setPreviewStudent(std); }}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-purple-600 transition cursor-pointer bg-transparent border-none outline-none"
                          >
                            <Eye size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && students.length > 0 && (
              <div className="px-3 py-2 border-t border-gray-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
                <span className="text-[10px] text-gray-400">
                  {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} of {total}
                </span>
                <div className="flex items-center gap-1">
                  <button disabled={page <= 1} onClick={() => loadStudents(page - 1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none">
                    <ChevronLeft size={13} />
                  </button>
                  {pageRange().map(p => (
                    <button key={p} onClick={() => loadStudents(p)} className={`w-5 h-5 rounded text-[10px] font-bold cursor-pointer border-none outline-none transition ${p === page ? 'bg-purple-600 text-white' : 'hover:bg-gray-100 text-gray-600 bg-transparent'}`}>
                      {p}
                    </button>
                  ))}
                  <button disabled={page >= lastPage} onClick={() => loadStudents(page + 1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none">
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Preview Panel ──────────────────────────────────── */}
          <div className="w-64 flex-shrink-0 flex flex-col gap-3">
            {/* Live Preview */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex flex-col gap-2 flex-shrink-0">
              <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">Live Card Preview</p>
              {previewStudent ? (
                <div className="flex justify-center scale-75 origin-top">
                  <IDCardRenderer student={previewStudent} school={school} template={template} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <CreditCard size={28} className="text-gray-200" />
                  <p className="text-[10px] text-gray-400 font-semibold text-center">Click the 👁 icon next to a student to preview their ID card here</p>
                </div>
              )}
            </div>

            {/* Quick actions */}
            {selected.size > 0 && (
              <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-3 space-y-2">
                <p className="text-[10px] font-extrabold text-purple-600 uppercase">{selected.size} card{selected.size !== 1 ? 's' : ''} selected</p>
                <button
                  onClick={handlePrintSelected}
                  className="w-full flex items-center justify-center gap-2 py-2 text-[11px] font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition cursor-pointer border-none outline-none"
                >
                  <Printer size={13} /> Print Selected Cards
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="w-full flex items-center justify-center gap-2 py-1.5 text-[11px] font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition cursor-pointer outline-none"
                >
                  <X size={12} /> Clear Selection
                </button>
              </div>
            )}

            {/* Template info */}
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide mb-2">Active Template</p>
              <div className="space-y-1.5">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[10px] font-bold cursor-pointer border transition outline-none text-left ${
                      template === t.id
                        ? 'bg-purple-50 border-purple-300 text-purple-700'
                        : 'bg-white border-gray-100 text-gray-500 hover:border-purple-200'
                    }`}
                  >
                    <span className={template === t.id ? 'text-purple-600' : 'text-gray-400'}>{t.icon}</span>
                    <div>
                      <div className="font-extrabold">{t.label}</div>
                      <div className="text-[9px] font-medium opacity-70">{t.desc}</div>
                    </div>
                    {template === t.id && <Check size={12} className="ml-auto text-purple-600" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
