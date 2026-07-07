import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  XCircle, ChevronRight, ChevronLeft,
  FileUp, ArrowLeft, Sparkles, CheckCircle2
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

// ─── Interfaces ────────────────────────────────────────────────────────────
interface MasterOption { value: number | string; label: string; }
interface FormErrors { [key: string]: string; }

// ─── Constants ────────────────────────────────────────────────────────────────
const BLANK_FORM = {
  // Personal
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  mobile_number: '',
  gender: '' as string | number,
  dob: '',
  age: '',
  blood_group: '' as string | number,
  aadhaar_number: '',
  nationality: 'Indian',
  mother_tongue: '',
  religion: '' as string | number,
  category: '' as string | number,
  photo: null as File | null,

  // Academic
  applied_class_id: '' as string | number,
  academic_year_id: '' as string | number,
  registration_date: new Date().toISOString().slice(0, 10),
  status: 0 as number,
  rejection_reason: '',

  // Parents
  father_name: '',
  father_mobile: '',
  father_occupation: '',
  mother_name: '',
  mother_mobile: '',
  mother_occupation: '',
  guardian_name: '',
  guardian_relation: '',
  guardian_mobile: '',
  alternate_mobile: '',
  parent_email: '',

  // Address
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  pincode: '',
  permanent_address_line1: '',
  permanent_address_line2: '',
  permanent_city: '',
  permanent_state: '',
  permanent_pincode: '',
  same_as_temporary: false,

  // Previous School
  previous_school: '',
  previous_class: '',
  previous_board: '',
  previous_passing_year: '',
  previous_grade: '',
  previous_tc_number: '',
  previous_tc_date: '',
  previous_school_address: '',
  previous_school_city: '',
  previous_school_state: '',
  previous_udise_code: '',
  previous_reason_leaving: '' as string | number,
  previous_reason_leaving_custom: '',
  previous_admission_number: '',

  // Medical
  medical_conditions: '',
  allergies: '',
  doctor_name: '',
  doctor_contact: '',

  // Documents
  aadhaar_card: null as File | null,
  birth_certificate: null as File | null,
  migration_card: null as File | null,
  migration_number: '',
  transfer_card: null as File | null,
  transfer_number: '',
};

// Wizard tabs
const wizardTabs = [
  { id: 'personal',  name: 'Personal Info' },
  { id: 'parents',   name: 'Parent/Guardian' },
  { id: 'address',   name: 'Address' },
  { id: 'previous',  name: 'Previous School' },
  { id: 'medical',   name: 'Medical' },
  { id: 'documents', name: 'Documents' },
];

const tabFields: Record<string, string[]> = {
  personal:  ['first_name', 'mobile_number', 'gender', 'applied_class_id'],
  parents:   ['father_name', 'father_mobile', 'mother_name', 'mother_mobile'],
  address:   ['city', 'state', 'pincode'],
  previous:  [],
  medical:   [],
  documents: [],
};

function getTabForField(field: string): string {
  for (const [tab, fields] of Object.entries(tabFields)) {
    if (fields.includes(field)) return tab;
  }
  return 'personal';
}

function validateForm(form: typeof BLANK_FORM): FormErrors {
  const e: FormErrors = {};
  if (!form.first_name || form.first_name.trim().length < 2) e.first_name = 'First name is required (min 2 chars)';
  if (!form.mobile_number || String(form.mobile_number).replace(/\D/g, '').length !== 10) e.mobile_number = 'Valid 10-digit mobile is required';
  if (!form.gender) e.gender = 'Gender is required';
  if (!form.applied_class_id) e.applied_class_id = 'Applied class is required';
  if (!form.father_name || form.father_name.trim().length < 2) e.father_name = 'Father name is required';
  if (!form.father_mobile || String(form.father_mobile).replace(/\D/g, '').length !== 10) e.father_mobile = 'Valid 10-digit mobile is required';
  if (!form.city || form.city.trim().length < 2) e.city = 'City is required';
  if (!form.state || form.state.trim().length < 2) e.state = 'State is required';
  if (!form.pincode || String(form.pincode).replace(/\D/g, '').length !== 6) e.pincode = 'Valid 6-digit PIN is required';
  return e;
}

// Compact react-select styles
const compactSelectStyles = {
  control: (base: any, state: any) => ({
    ...base, borderRadius: '0.375rem',
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59,130,246,0.15)' : 'none',
    minHeight: '28px', height: '28px', backgroundColor: '#fff',
    '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#d1d5db' },
    transition: 'all 0.15s ease',
  }),
  valueContainer: (base: any) => ({ ...base, padding: '0 8px', height: '28px', display: 'flex', alignItems: 'center' }),
  input: (base: any) => ({ ...base, margin: '0', padding: '0', fontSize: '11px', color: '#111827' }),
  placeholder: (base: any) => ({ ...base, fontSize: '11px', color: '#9ca3af' }),
  singleValue: (base: any) => ({ ...base, fontSize: '11px', color: '#111827' }),
  indicatorsContainer: (base: any) => ({ ...base, height: '26px' }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#f3f4f6' : 'transparent',
    color: state.isSelected ? '#fff' : '#374151',
    fontSize: '11px', padding: '6px 8px', cursor: 'pointer',
  }),
  menu: (base: any) => ({ ...base, borderRadius: '0.375rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', marginTop: '2px', zIndex: 9999 }),
};

// ─── Main Component ────────────────────────────────────────────────────────
export default function StudentRegistrationForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState({ ...BLANK_FORM });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeWizardTab, setActiveWizardTab] = useState('personal');

  // Existing file URLs for edit mode
  const [existingFiles, setExistingFiles] = useState<Record<string, string>>({});

  // Master data
  const [classes, setClasses]               = useState<MasterOption[]>([]);
  const [genders, setGenders]               = useState<string[]>(['Male', 'Female', 'Other']);
  const [bloodGroups, setBloodGroups]       = useState<MasterOption[]>([]);
  const [religions, setReligions]           = useState<MasterOption[]>([]);
  const [categories, setCategories]         = useState<MasterOption[]>([]);
  const [reasonsLeaving, setReasonsLeaving] = useState<MasterOption[]>([]);
  const [academicYears, setAcademicYears]   = useState<MasterOption[]>([]);
  const [affiliationBoards, setAffiliationBoards] = useState<MasterOption[]>([]);

  const setField = useCallback((key: string, val: any) => {
    setForm(prev => {
      const next = { ...prev, [key]: val };
      if (key === 'same_as_temporary' && val === true) {
        next.permanent_address_line1 = prev.address_line1;
        next.permanent_address_line2 = prev.address_line2;
        next.permanent_city          = prev.city;
        next.permanent_state         = prev.state;
        next.permanent_pincode       = prev.pincode;
      }
      if (prev.same_as_temporary && ['address_line1','address_line2','city','state','pincode'].includes(key)) {
        if (key === 'address_line1')  next.permanent_address_line1 = val;
        if (key === 'address_line2')  next.permanent_address_line2 = val;
        if (key === 'city')           next.permanent_city  = val;
        if (key === 'state')          next.permanent_state = val;
        if (key === 'pincode')        next.permanent_pincode = val;
      }
      return next;
    });
    setTouched(prev => ({ ...prev, [key]: true }));
  }, []);

  const inp = (field: string) => `border border-gray-200 rounded px-2 py-1 text-xs outline-none bg-white text-gray-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 w-full ${errors[field] && touched[field] ? 'border-red-400 bg-red-50' : ''}`;

  // ─── Load Masters ─────────────────────────────────────────────────────────
  const loadMasters = useCallback(async () => {
    try {
      const [cls, gen, bg, rel, cat, rl, ay, ab] = await Promise.all([
        api.get('/master/classes'),
        api.get('/master/genders'),
        api.get('/master/blood-groups'),
        api.get('/master/religions'),
        api.get('/master/categories'),
        api.get('/master/reasons-leaving'),
        api.get('/school/academic-years'),
        api.get('/master/affiliation-boards'),
      ]);
      if (cls.data?.success && cls.data.data) {
        setClasses(Object.entries(cls.data.data).map(([id, name]) => ({
          value: Number(id),
          label: name as string
        })));
      }
      if (gen.data?.success && gen.data.data) {
        setGenders(Object.values(gen.data.data) as string[]);
      }
      if (bg.data?.success && bg.data.data) {
        setBloodGroups(Object.entries(bg.data.data).map(([id, name]) => ({
          value: Number(id),
          label: name as string
        })));
      }
      if (rel.data?.success && rel.data.data) {
        setReligions(Object.entries(rel.data.data).map(([_, name]) => ({
          value: name as string,
          label: name as string
        })));
      }
      if (cat.data?.success && cat.data.data) {
        setCategories(Object.entries(cat.data.data).map(([_, name]) => ({
          value: name as string,
          label: name as string
        })));
      }
      if (rl.data?.success && rl.data.data) {
        setReasonsLeaving(Object.entries(rl.data.data).map(([id, name]) => ({
          value: Number(id),
          label: name as string
        })));
      }
      const years = ay.data.data ?? [];
      setAcademicYears(years.map((y: any) => ({ value: y.id, label: y.name ?? y.year_name })));
      const currentYear = years.find((y: any) => y.is_current);
      if (currentYear) setField('academic_year_id', currentYear.id);
      if (ab.data?.success && ab.data.data) {
        setAffiliationBoards(Object.entries(ab.data.data).map(([_, name]) => ({
          value: name as string,
          label: name as string
        })));
      }
    } catch {
      // Silently ignore master loading errors
    }
  }, [setField]);

  // ─── Load existing registration (edit mode) ───────────────────────────────
  const loadRegistration = useCallback(async (regId: string) => {
    try {
      const res = await api.get(`/student-registrations/${regId}`);
      const r = res.data.data;
      if (!r) { toast.error('Registration not found'); navigate('/students/registration'); return; }

      setExistingFiles({
        photo_url:             r.photo_url ?? '',
        aadhaar_card_url:      r.aadhaar_card_url ?? '',
        birth_certificate_url: r.birth_certificate_url ?? '',
        migration_card_url:    r.migration_card_url ?? '',
        transfer_card_url:     r.transfer_card_url ?? '',
      });

      setForm({
        first_name: r.first_name ?? '',
        middle_name: r.middle_name ?? '',
        last_name: r.last_name ?? '',
        email: r.email ?? '',
        mobile_number: r.mobile_number ?? '',
        gender: r.gender ?? '',
        dob: r.dob ?? '',
        age: r.age ?? '',
        blood_group: r.blood_group ?? '',
        aadhaar_number: r.aadhaar_number ?? '',
        nationality: r.nationality ?? 'Indian',
        mother_tongue: r.mother_tongue ?? '',
        religion: r.religion ?? '',
        category: r.category ?? '',
        photo: null,
        applied_class_id: r.applied_class_id ?? '',
        academic_year_id: r.academic_year_id ?? '',
        registration_date: r.registration_date ?? new Date().toISOString().slice(0, 10),
        status: r.status ?? 0,
        rejection_reason: r.rejection_reason ?? '',
        father_name: r.father_name ?? '',
        father_mobile: r.father_mobile ?? '',
        father_occupation: r.father_occupation ?? '',
        mother_name: r.mother_name ?? '',
        mother_mobile: r.mother_mobile ?? '',
        mother_occupation: r.mother_occupation ?? '',
        guardian_name: r.guardian_name ?? '',
        guardian_relation: r.guardian_relation ?? '',
        guardian_mobile: r.guardian_mobile ?? '',
        alternate_mobile: r.alternate_mobile ?? '',
        parent_email: r.parent_email ?? '',
        address_line1: r.address_line1 ?? '',
        address_line2: r.address_line2 ?? '',
        city: r.city ?? '',
        state: r.state ?? '',
        pincode: r.pincode ?? '',
        permanent_address_line1: r.permanent_address_line1 ?? '',
        permanent_address_line2: r.permanent_address_line2 ?? '',
        permanent_city: r.permanent_city ?? '',
        permanent_state: r.permanent_state ?? '',
        permanent_pincode: r.permanent_pincode ?? '',
        same_as_temporary: !!r.same_as_temporary,
        previous_school: r.previous_school ?? '',
        previous_class: r.previous_class ?? '',
        previous_board: r.previous_board ?? '',
        previous_passing_year: r.previous_passing_year ?? '',
        previous_grade: r.previous_grade ?? '',
        previous_tc_number: r.previous_tc_number ?? '',
        previous_tc_date: r.previous_tc_date ?? '',
        previous_school_address: r.previous_school_address ?? '',
        previous_school_city: r.previous_school_city ?? '',
        previous_school_state: r.previous_school_state ?? '',
        previous_udise_code: r.previous_udise_code ?? '',
        previous_reason_leaving: r.previous_reason_leaving ?? '',
        previous_reason_leaving_custom: r.previous_reason_leaving_custom ?? '',
        previous_admission_number: r.previous_admission_number ?? '',
        medical_conditions: r.medical_conditions ?? '',
        allergies: r.allergies ?? '',
        doctor_name: r.doctor_name ?? '',
        doctor_contact: r.doctor_contact ?? '',
        aadhaar_card: null,
        birth_certificate: null,
        migration_card: null,
        migration_number: r.migration_number ?? '',
        transfer_card: null,
        transfer_number: r.transfer_number ?? '',
      });
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to load registration');
      navigate('/students/registration');
    }
  }, [navigate]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadMasters();
      if (isEditMode && id) await loadRegistration(id);
      setLoading(false);
    };
    init();
  }, [id, isEditMode, loadMasters, loadRegistration]);

  // ─── Tab error badge ───────────────────────────────────────────────────────
  const getTabErrorCount = (tabId: string) => {
    const fields = tabFields[tabId] ?? [];
    return fields.filter(f => errors[f] && touched[f]).length;
  };

  // ─── Other reason shown? ───────────────────────────────────────────────────
  const isOtherReason = useMemo(() => {
    if (!form.previous_reason_leaving) return false;
    const opt = reasonsLeaving.find(r => Number(r.value) === Number(form.previous_reason_leaving));
    return opt?.label?.toLowerCase() === 'other';
  }, [form.previous_reason_leaving, reasonsLeaving]);

  // ─── Submit ───────────────────────────────────────────────────────────────
  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.values(errs).some(Boolean)) {
      setErrors(errs);
      const t: Record<string, boolean> = {};
      Object.keys(BLANK_FORM).forEach(k => (t[k] = true));
      setTouched(t);
      toast.error('Please fill in all required fields.');
      const firstErr = Object.keys(errs).find(k => errs[k]);
      if (firstErr) setActiveWizardTab(getTabForField(firstErr));
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val !== null && val !== undefined) {
          if (val instanceof File) {
            formData.append(key, val);
          } else if (key === 'aadhaar_number') {
            formData.append(key, typeof val === 'string' ? val.replace(/\s/g, '') : String(val));
          } else if (typeof val === 'boolean') {
            formData.append(key, val ? '1' : '0');
          } else {
            formData.append(key, String(val));
          }
        }
      });

      if (isEditMode) {
        await api.post(`/student-registrations/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Registration updated successfully!');
      } else {
        await api.post('/student-registrations', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Registration submitted successfully!');
      }
      navigate('/students/registration');
    } catch (err: any) {
      const sv = err.response?.data?.errors;
      if (sv) {
        const m: FormErrors = {};
        Object.entries(sv).forEach(([k, v]) => { m[k] = Array.isArray(v) ? v[0] as string : String(v); });
        setErrors(m);
        const first = Object.keys(m).find(k => m[k]);
        if (first) setActiveWizardTab(getTabForField(first));
      }
      toast.error(err.response?.data?.message ?? 'Failed to submit form');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="text-gray-500 text-xs mt-3">Loading form...</p>
      </div>
    );
  }

  const currentTabIndex = wizardTabs.findIndex(t => t.id === activeWizardTab);

  // ─── Status Badge ─────────────────────────────────────────────────────────
  const StatusBadge = () => {
    if (!isEditMode) return null;
    const configs: Record<number, { label: string; cls: string }> = {
      0: { label: 'Pending Review', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
      1: { label: 'Approved', cls: 'bg-green-100 text-green-700 border-green-200' },
      2: { label: 'Rejected', cls: 'bg-red-100 text-red-700 border-red-200' },
    };
    const cfg = configs[form.status] ?? configs[0];
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden animate-fade">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-tr from-slate-50 to-white flex justify-between items-center flex-shrink-0">
          <div>
            <button
              type="button"
              onClick={() => navigate('/students/registration')}
              className="flex items-center gap-1 text-gray-500 hover:text-blue-600 font-bold mb-1 transition text-[11px] cursor-pointer bg-transparent border-none outline-none"
            >
              <ArrowLeft size={13} /> Back to Registrations
            </button>
            <h3 className="text-[15px] font-extrabold text-gray-800 flex items-center gap-2">
              <Sparkles size={16} className="text-violet-500 animate-pulse" />
              {isEditMode ? 'Edit Registration' : 'New Student Registration'}
              <StatusBadge />
            </h3>
          </div>
          <button
            className="text-gray-400 hover:text-red-500 transition cursor-pointer bg-transparent border-none outline-none"
            onClick={() => navigate('/students/registration')}
          >
            <XCircle size={22} />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="px-6 bg-slate-50 border-b border-gray-150 flex items-center gap-1 overflow-x-auto py-2 flex-shrink-0">
          {wizardTabs.map(t => {
            const errCount = getTabErrorCount(t.id);
            const isActive = activeWizardTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveWizardTab(t.id)}
                className={`px-3 py-1.5 text-[11.5px] font-bold rounded-lg transition relative cursor-pointer border-none outline-none whitespace-nowrap ${isActive ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200/50 bg-transparent'}`}
              >
                {t.name}
                {errCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-extrabold animate-bounce">
                    {errCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Wizard Body */}
        <form onSubmit={submitForm} className="flex-1 flex flex-col overflow-hidden" noValidate>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">

            {/* ── PERSONAL TAB ─────────────────────────────────────────────── */}
            {activeWizardTab === 'personal' && (
              <div className="space-y-3">
                {/* Name Row */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Full Name & Identity</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">First Name *</label>
                      <input maxLength={100} value={form.first_name} onChange={e => setField('first_name', e.target.value)} className={inp('first_name')} placeholder="First Name" />
                      {errors.first_name && touched.first_name && <p className="text-[10px] text-red-500 mt-0.5">{errors.first_name}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Middle Name</label>
                      <input maxLength={100} value={form.middle_name} onChange={e => setField('middle_name', e.target.value)} className={inp('middle_name')} placeholder="Middle Name" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Last Name</label>
                      <input maxLength={100} value={form.last_name} onChange={e => setField('last_name', e.target.value)} className={inp('last_name')} placeholder="Last Name" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Gender *</label>
                      <div className="flex gap-1">
                        {genders.map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setField('gender', g)}
                            className={`flex-1 py-1 border rounded text-[10px] font-bold transition cursor-pointer ${form.gender === g ? 'bg-violet-600 border-violet-600 text-white shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'}`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                      {errors.gender && touched.gender && <p className="text-[10px] text-red-500 mt-0.5">{errors.gender}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Date of Birth</label>
                      <input type="date" value={form.dob} onChange={e => setField('dob', e.target.value)} className={inp('dob')} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Blood Group</label>
                      <Select
                        options={bloodGroups}
                        value={bloodGroups.find(bg => bg.label === form.blood_group) || null}
                        onChange={val => setField('blood_group', val ? val.label : '')}
                        styles={compactSelectStyles}
                        placeholder="Select"
                        isClearable
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Nationality</label>
                      <input maxLength={50} value={form.nationality} onChange={e => setField('nationality', e.target.value)} className={inp('nationality')} placeholder="Indian" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Religion</label>
                      <Select
                        options={religions}
                        value={religions.find(r => r.value === form.religion) ?? null}
                        onChange={opt => setField('religion', opt?.value ?? '')}
                        styles={compactSelectStyles}
                        placeholder="Select"
                        isClearable
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Category</label>
                      <Select
                        options={categories}
                        value={categories.find(c => c.value === form.category) ?? null}
                        onChange={opt => setField('category', opt?.value ?? '')}
                        styles={compactSelectStyles}
                        placeholder="Select"
                        isClearable
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Mother Tongue</label>
                      <input maxLength={50} value={form.mother_tongue} onChange={e => setField('mother_tongue', e.target.value)} className={inp('mother_tongue')} placeholder="Hindi, English..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Aadhaar Number</label>
                      <input
                        maxLength={14}
                        value={form.aadhaar_number}
                        onChange={e => {
                          const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
                          setField('aadhaar_number', raw.replace(/(\d{4})(?=\d)/g, '$1 ').trim());
                        }}
                        className={inp('aadhaar_number')}
                        placeholder="1234 5678 9012"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact & Class */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Contact & Admission Preference</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Mobile Number *</label>
                      <input maxLength={10} value={form.mobile_number} onChange={e => setField('mobile_number', e.target.value.replace(/\D/g, ''))} className={inp('mobile_number')} placeholder="10-digit mobile" />
                      {errors.mobile_number && touched.mobile_number && <p className="text-[10px] text-red-500 mt-0.5">{errors.mobile_number}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Email</label>
                      <input type="email" maxLength={100} value={form.email} onChange={e => setField('email', e.target.value)} className={inp('email')} placeholder="student@example.com" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Applied For Class *</label>
                      <Select
                        options={classes}
                        value={classes.find(c => c.value === form.applied_class_id) ?? null}
                        onChange={opt => setField('applied_class_id', opt?.value ?? '')}
                        styles={compactSelectStyles}
                        placeholder="Select class"
                        isClearable
                      />
                      {errors.applied_class_id && touched.applied_class_id && <p className="text-[10px] text-red-500 mt-0.5">{errors.applied_class_id}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Academic Year</label>
                      <Select
                        options={academicYears}
                        value={academicYears.find(y => y.value === form.academic_year_id) ?? null}
                        onChange={opt => setField('academic_year_id', opt?.value ?? '')}
                        styles={compactSelectStyles}
                        placeholder="Select year"
                        isClearable
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Registration Date</label>
                      <input type="date" value={form.registration_date} onChange={e => setField('registration_date', e.target.value)} className={inp('registration_date')} />
                    </div>
                    {isEditMode && (
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Status</label>
                        <select value={form.status} onChange={e => setField('status', parseInt(e.target.value))} className={inp('status')}>
                          <option value={0}>Pending</option>
                          <option value={1}>Approved</option>
                          <option value={2}>Rejected</option>
                        </select>
                      </div>
                    )}
                  </div>
                  {form.status === 2 && isEditMode && (
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Rejection Reason</label>
                      <textarea maxLength={1000} value={form.rejection_reason} onChange={e => setField('rejection_reason', e.target.value)} className={`${inp('rejection_reason')} resize-none h-14`} placeholder="Enter reason for rejection..." />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── PARENTS TAB ───────────────────────────────────────────────── */}
            {activeWizardTab === 'parents' && (
              <div className="space-y-3">
                <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Father's Information</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Father's Name *</label>
                      <input maxLength={100} value={form.father_name} onChange={e => setField('father_name', e.target.value)} className={inp('father_name')} placeholder="Father's full name" />
                      {errors.father_name && touched.father_name && <p className="text-[10px] text-red-500 mt-0.5">{errors.father_name}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Father's Mobile *</label>
                      <input maxLength={10} value={form.father_mobile} onChange={e => setField('father_mobile', e.target.value.replace(/\D/g, ''))} className={inp('father_mobile')} placeholder="10-digit mobile" />
                      {errors.father_mobile && touched.father_mobile && <p className="text-[10px] text-red-500 mt-0.5">{errors.father_mobile}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Father's Occupation</label>
                      <input maxLength={255} value={form.father_occupation} onChange={e => setField('father_occupation', e.target.value)} className={inp('father_occupation')} placeholder="Occupation" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Mother's Information</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Mother's Name</label>
                      <input maxLength={100} value={form.mother_name} onChange={e => setField('mother_name', e.target.value)} className={inp('mother_name')} placeholder="Mother's full name" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Mother's Mobile</label>
                      <input maxLength={10} value={form.mother_mobile} onChange={e => setField('mother_mobile', e.target.value.replace(/\D/g, ''))} className={inp('mother_mobile')} placeholder="10-digit mobile" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Mother's Occupation</label>
                      <input maxLength={255} value={form.mother_occupation} onChange={e => setField('mother_occupation', e.target.value)} className={inp('mother_occupation')} placeholder="Occupation" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Guardian / Contact</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Guardian Name</label>
                      <input maxLength={255} value={form.guardian_name} onChange={e => setField('guardian_name', e.target.value)} className={inp('guardian_name')} placeholder="Guardian name" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Guardian Relation</label>
                      <input maxLength={100} value={form.guardian_relation} onChange={e => setField('guardian_relation', e.target.value)} className={inp('guardian_relation')} placeholder="Uncle, Aunt..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Guardian Mobile</label>
                      <input maxLength={10} value={form.guardian_mobile} onChange={e => setField('guardian_mobile', e.target.value.replace(/\D/g, ''))} className={inp('guardian_mobile')} placeholder="10-digit mobile" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Alternate Mobile</label>
                      <input maxLength={10} value={form.alternate_mobile} onChange={e => setField('alternate_mobile', e.target.value.replace(/\D/g, ''))} className={inp('alternate_mobile')} placeholder="Alternate number" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Parent Email</label>
                      <input type="email" maxLength={255} value={form.parent_email} onChange={e => setField('parent_email', e.target.value)} className={inp('parent_email')} placeholder="parent@example.com" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ADDRESS TAB ───────────────────────────────────────────────── */}
            {activeWizardTab === 'address' && (
              <div className="space-y-3">
                {/* Temporary Address */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Temporary / Current Address</p>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Street Address / Colony</label>
                    <textarea maxLength={255} rows={1} value={form.address_line1} onChange={e => setField('address_line1', e.target.value)} className={`${inp('address_line1')} resize-none h-[42px] py-1.5`} placeholder="Street, Colony, Locality..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Address Line 2</label>
                    <textarea maxLength={255} rows={1} value={form.address_line2} onChange={e => setField('address_line2', e.target.value)} className={`${inp('address_line2')} resize-none h-[42px] py-1.5`} placeholder="Landmark, Area..." />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">City *</label>
                      <input maxLength={100} value={form.city} onChange={e => setField('city', e.target.value)} className={inp('city')} placeholder="City" />
                      {errors.city && touched.city && <p className="text-[10px] text-red-500 mt-0.5">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">State *</label>
                      <input maxLength={100} value={form.state} onChange={e => setField('state', e.target.value)} className={inp('state')} placeholder="State" />
                      {errors.state && touched.state && <p className="text-[10px] text-red-500 mt-0.5">{errors.state}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">PIN Code *</label>
                      <input maxLength={6} value={form.pincode} onChange={e => setField('pincode', e.target.value.replace(/\D/g, ''))} className={inp('pincode')} placeholder="6-digit PIN" />
                      {errors.pincode && touched.pincode && <p className="text-[10px] text-red-500 mt-0.5">{errors.pincode}</p>}
                    </div>
                  </div>
                </div>

                {/* Permanent Address */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Permanent Address</p>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.same_as_temporary}
                        onChange={e => setField('same_as_temporary', e.target.checked)}
                        className="w-3.5 h-3.5 accent-violet-600"
                      />
                      <span className="text-[10px] font-semibold text-gray-600">Same as Temporary</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Street Address / Colony</label>
                    <textarea maxLength={255} rows={1} value={form.permanent_address_line1} onChange={e => setField('permanent_address_line1', e.target.value)} disabled={form.same_as_temporary} className={`${inp('permanent_address_line1')} resize-none h-[42px] py-1.5 ${form.same_as_temporary ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`} placeholder="Street, Colony, Locality..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Address Line 2</label>
                    <textarea maxLength={255} rows={1} value={form.permanent_address_line2} onChange={e => setField('permanent_address_line2', e.target.value)} disabled={form.same_as_temporary} className={`${inp('permanent_address_line2')} resize-none h-[42px] py-1.5 ${form.same_as_temporary ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`} placeholder="Landmark, Area..." />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { f: 'permanent_city', ph: 'City', label: 'City' },
                      { f: 'permanent_state', ph: 'State', label: 'State' },
                      { f: 'permanent_pincode', ph: '6-digit PIN', label: 'PIN Code' },
                    ].map(({ f, ph, label }) => (
                      <div key={f}>
                        <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">{label}</label>
                        <input
                          maxLength={f === 'permanent_pincode' ? 6 : 100}
                          value={(form as any)[f]}
                          onChange={e => setField(f, f === 'permanent_pincode' ? e.target.value.replace(/\D/g, '') : e.target.value)}
                          disabled={form.same_as_temporary}
                          className={`${inp(f)} ${form.same_as_temporary ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                          placeholder={ph}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── PREVIOUS SCHOOL TAB ───────────────────────────────────────── */}
            {activeWizardTab === 'previous' && (
              <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Previous School History</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Previous School</label>
                    <input maxLength={255} value={form.previous_school} onChange={e => setField('previous_school', e.target.value)} className={inp('previous_school')} placeholder="School name" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Previous Class Standard</label>
                    <Select
                      options={classes}
                      value={classes.find(c => c.label === form.previous_class || c.value === form.previous_class) ?? null}
                      onChange={opt => setField('previous_class', opt?.label ?? '')}
                      styles={compactSelectStyles}
                      placeholder="Select class"
                      isClearable
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Board / University</label>
                    <Select
                      options={affiliationBoards}
                      value={affiliationBoards.find(b => b.label === form.previous_board) ?? null}
                      onChange={opt => setField('previous_board', opt?.label ?? '')}
                      styles={compactSelectStyles}
                      placeholder="Select board"
                      isClearable
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Passing Year</label>
                    <input maxLength={4} value={form.previous_passing_year} onChange={e => setField('previous_passing_year', e.target.value.replace(/\D/g, ''))} className={inp('previous_passing_year')} placeholder="YYYY" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Grade / %</label>
                    <input maxLength={50} value={form.previous_grade} onChange={e => setField('previous_grade', e.target.value)} className={inp('previous_grade')} placeholder="Grade or %age" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">TC Number</label>
                    <input maxLength={100} value={form.previous_tc_number} onChange={e => setField('previous_tc_number', e.target.value)} className={inp('previous_tc_number')} placeholder="Transfer Certificate No" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">TC Issue Date</label>
                    <input type="date" value={form.previous_tc_date} onChange={e => setField('previous_tc_date', e.target.value)} className={inp('previous_tc_date')} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">School City</label>
                    <input maxLength={100} value={form.previous_school_city} onChange={e => setField('previous_school_city', e.target.value)} className={inp('previous_school_city')} placeholder="City" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">School State</label>
                    <input maxLength={100} value={form.previous_school_state} onChange={e => setField('previous_school_state', e.target.value)} className={inp('previous_school_state')} placeholder="State" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">UDISE Code</label>
                    <input maxLength={11} value={form.previous_udise_code} onChange={e => setField('previous_udise_code', e.target.value.replace(/\D/g, ''))} className={inp('previous_udise_code')} placeholder="11-digit code" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Reason for Leaving</label>
                    <Select
                      options={reasonsLeaving}
                      value={reasonsLeaving.find(r => Number(r.value) === Number(form.previous_reason_leaving)) ?? null}
                      onChange={opt => { setField('previous_reason_leaving', opt?.value ?? ''); setField('previous_reason_leaving_custom', ''); }}
                      styles={compactSelectStyles}
                      placeholder="Select reason"
                      isClearable
                    />
                  </div>
                  {isOtherReason && (
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Specify Reason</label>
                      <input maxLength={255} value={form.previous_reason_leaving_custom} onChange={e => setField('previous_reason_leaving_custom', e.target.value)} className={inp('previous_reason_leaving_custom')} placeholder="Specify the reason..." />
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Prev Admission No</label>
                    <input maxLength={100} value={form.previous_admission_number} onChange={e => setField('previous_admission_number', e.target.value)} className={inp('previous_admission_number')} placeholder="Previous admission no" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Previous School Address</label>
                  <textarea maxLength={255} rows={1} value={form.previous_school_address} onChange={e => setField('previous_school_address', e.target.value)} className={`${inp('previous_school_address')} resize-none h-[42px] py-1.5`} placeholder="Previous school full address" />
                </div>
              </div>
            )}

            {/* ── MEDICAL TAB ───────────────────────────────────────────────── */}
            {activeWizardTab === 'medical' && (
              <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Medical Information</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Doctor Name</label>
                    <input maxLength={255} value={form.doctor_name} onChange={e => setField('doctor_name', e.target.value)} className={inp('doctor_name')} placeholder="Family doctor" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Doctor Contact</label>
                    <input maxLength={10} value={form.doctor_contact} onChange={e => setField('doctor_contact', e.target.value.replace(/\D/g, ''))} className={inp('doctor_contact')} placeholder="10-digit mobile" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Medical Conditions / Disabilities</label>
                  <textarea maxLength={500} rows={3} value={form.medical_conditions} onChange={e => setField('medical_conditions', e.target.value)} className={`${inp('medical_conditions')} resize-none`} placeholder="Describe any known medical conditions..." />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Allergies</label>
                  <textarea maxLength={500} rows={3} value={form.allergies} onChange={e => setField('allergies', e.target.value)} className={`${inp('allergies')} resize-none`} placeholder="List any allergies (food, medication, etc.)..." />
                </div>
              </div>
            )}

            {/* ── DOCUMENTS TAB ─────────────────────────────────────────────── */}
            {activeWizardTab === 'documents' && (
              <div className="space-y-3">
                {/* Photo */}
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Photo</p>
                  <div className="flex items-center gap-3">
                    {existingFiles.photo_url && !form.photo && (
                      <a href={existingFiles.photo_url} target="_blank" rel="noreferrer" className="text-[10px] text-green-600 underline font-semibold flex items-center gap-1">
                        <CheckCircle2 size={11} /> View Current Photo
                      </a>
                    )}
                    <label className="flex items-center gap-1.5 cursor-pointer bg-violet-50 border border-violet-200 rounded px-2 py-1 text-[10px] font-semibold text-violet-700 hover:bg-violet-100 transition">
                      <FileUp size={12} /> {form.photo ? form.photo.name : 'Upload Photo (JPG/PNG, max 2MB)'}
                      <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setField('photo', f); }} />
                    </label>
                  </div>
                </div>

                {/* Document grid */}
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Required Documents (PDF/JPG, max 5MB)</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { field: 'aadhaar_card', label: 'Aadhaar Card', urlKey: 'aadhaar_card_url' },
                      { field: 'birth_certificate', label: 'Birth Certificate', urlKey: 'birth_certificate_url' },
                      { field: 'migration_card', label: 'Migration Certificate', urlKey: 'migration_card_url' },
                      { field: 'transfer_card', label: 'Transfer Certificate', urlKey: 'transfer_card_url' },
                    ].map(({ field, label, urlKey }) => (
                      <div key={field} className="border border-slate-100 rounded-lg p-2 bg-slate-50/50 space-y-1.5">
                        <p className="text-[10px] font-bold text-gray-600">{label}</p>
                        {existingFiles[urlKey] && !(form as any)[field] && (
                          <a href={existingFiles[urlKey]} target="_blank" rel="noreferrer" className="block text-[10px] text-green-600 underline font-semibold">
                            <CheckCircle2 size={10} className="inline mr-0.5" /> View Uploaded File
                          </a>
                        )}
                        {(form as any)[field] && (
                          <p className="text-[10px] text-blue-600 truncate">{((form as any)[field] as File).name}</p>
                        )}
                        <label className="flex items-center gap-1 cursor-pointer text-[10px] text-violet-700 font-semibold hover:text-violet-900 transition">
                          <FileUp size={11} /> Upload File
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setField(field, f); }} />
                        </label>
                      </div>
                    ))}

                    {/* Number inputs */}
                    <div className="border border-slate-100 rounded-lg p-2 bg-slate-50/50 space-y-1.5">
                      <p className="text-[10px] font-bold text-gray-600">Migration Number</p>
                      <input maxLength={100} value={form.migration_number} onChange={e => setField('migration_number', e.target.value)} className={inp('migration_number')} placeholder="Migration Certificate No" />
                    </div>
                    <div className="border border-slate-100 rounded-lg p-2 bg-slate-50/50 space-y-1.5">
                      <p className="text-[10px] font-bold text-gray-600">Transfer Number</p>
                      <input maxLength={100} value={form.transfer_number} onChange={e => setField('transfer_number', e.target.value)} className={inp('transfer_number')} placeholder="Transfer Certificate No" />
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer with Prev / Next / Submit */}
          <div className="px-6 py-4 border-t border-gray-200 bg-slate-50 flex justify-between items-center flex-shrink-0">
            <div>
              {currentTabIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveWizardTab(wizardTabs[currentTabIndex - 1].id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition bg-white cursor-pointer"
                >
                  <ChevronLeft size={13} /> Previous
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/students/registration')}
                className="px-3 py-1.5 text-[11px] font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition bg-white cursor-pointer"
              >
                Cancel
              </button>
              {currentTabIndex < wizardTabs.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveWizardTab(wizardTabs[currentTabIndex + 1].id)}
                  className="flex items-center gap-1 px-4 py-1.5 text-[11px] font-bold bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition cursor-pointer"
                >
                  Next <ChevronRight size={13} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-1.5 text-[11px] font-bold bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition disabled:opacity-60 cursor-pointer"
                >
                  {saving ? (
                    <><span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" /> Saving...</>
                  ) : (
                    <>{isEditMode ? 'Update Registration' : 'Submit Registration'}</>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
