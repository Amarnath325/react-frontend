import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus, XCircle, ChevronRight, ChevronLeft,
  FileUp, ArrowLeft, Sparkles, ShieldCheck
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

// ─── Interfaces ────────────────────────────────────────────────────────────
interface MasterOption { value: number | string; label: string; }
interface FormErrors { [key: string]: string; }

// ─── Constants ────────────────────────────────────────────────────────────────
const BLANK_FORM = {
  // Student Info
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  mobile_number: '',
  gender: 'Male',
  date_of_birth: '',
  blood_group: '',
  aadhaar_number: '',
  photo: null as File | null,
  student_id: '',
  nationality: 'Indian',
  mother_tongue: '',
  religion: '',
  category: 'General',
  student_status: '' as string | number,

  // Academic
  class_id: '',
  section: 'A',
  roll_number: '',
  admission_number: '',
  admission_date: '',
  medium: 'English Medium',
  academic_year: '',
  admission_type: '' as string | number,
  pen_number: '',
  apaar_id: '',
  admission_category: '' as string | number,

  // Parents
  father_name: '',
  father_mobile: '',
  father_occupation: '',
  mother_name: '',
  mother_mobile: '',
  mother_occupation: '',
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
  migration_card: null as File | null,
  migration_number: '',
  transfer_card: null as File | null,
  transfer_number: '',
  bonafide_card: null as File | null,
  character_card: null as File | null,
  marksheet_card: null as File | null,

  // Other
  guardian_name: '',
  guardian_relation: '',
  guardian_mobile: '',
  transport_required: false,
  transport_route: '',
  pickup_point: '',
  hostel_required: false,
  room_number: '',
};

const REQUIRED_FIELDS: Record<string, string> = {
  first_name: 'First name',
  email: 'Email address',
  mobile_number: 'Mobile number',
  class_id: 'Class standard',
  admission_number: 'Admission number',
  father_name: "Father's name",
  father_mobile: "Father's mobile",
  father_occupation: "Father's occupation",
  mother_name: "Mother's name",
  mother_mobile: "Mother's mobile",
  mother_occupation: "Mother's occupation",
  city: 'City',
  state: 'State',
  pincode: 'PIN code',
};

// ─── Indian States for Dropdown ───
const INDIAN_STATES = [
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
  { value: 'Arunachal Pradesh', label: 'Arunachal Pradesh' },
  { value: 'Assam', label: 'Assam' },
  { value: 'Bihar', label: 'Bihar' },
  { value: 'Chhattisgarh', label: 'Chhattisgarh' },
  { value: 'Goa', label: 'Goa' },
  { value: 'Gujarat', label: 'Gujarat' },
  { value: 'Haryana', label: 'Haryana' },
  { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
  { value: 'Jharkhand', label: 'Jharkhand' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Kerala', label: 'Kerala' },
  { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Manipur', label: 'Manipur' },
  { value: 'Meghalaya', label: 'Meghalaya' },
  { value: 'Mizoram', label: 'Mizoram' },
  { value: 'Nagaland', label: 'Nagaland' },
  { value: 'Odisha', label: 'Odisha' },
  { value: 'Punjab', label: 'Punjab' },
  { value: 'Rajasthan', label: 'Rajasthan' },
  { value: 'Sikkim', label: 'Sikkim' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Telangana', label: 'Telangana' },
  { value: 'Tripura', label: 'Tripura' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  { value: 'Uttarakhand', label: 'Uttarakhand' },
  { value: 'West Bengal', label: 'West Bengal' },
  { value: 'Delhi', label: 'Delhi' }
];

// Premium theme styling for react-select matching our system's Tailwind design
const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.375rem',
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.15)' : 'none',
    minHeight: '34px',
    backgroundColor: '#ffffff',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    },
    transition: 'all 0.15s ease',
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 8px',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0',
    padding: '0',
    fontSize: '12px',
    color: '#111827',
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: '12px',
    color: '#9ca3af',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '12px',
    color: '#111827',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#2563eb'
      : state.isFocused
        ? '#f3f4f6'
        : 'transparent',
    color: state.isSelected ? '#ffffff' : '#374151',
    fontSize: '12px',
    padding: '6px 10px',
    cursor: 'pointer',
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '0.375rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #e5e7eb',
    marginTop: '2px',
    zIndex: 9999,
  }),
};

// ─── Validation Helpers ──────────────────────────────────────────────────────
function validateForm(f: typeof BLANK_FORM, reasonsLeaving: MasterOption[] = []): FormErrors {
  const e: FormErrors = {};
  for (const [field, label] of Object.entries(REQUIRED_FIELDS)) {
    if (!f[field as keyof typeof BLANK_FORM]?.toString().trim()) {
      e[field] = `${label} is required`;
    }
  }

  // Reason for leaving details
  const selectedReasonLabel = reasonsLeaving.find(r => r.value === Number(f.previous_reason_leaving))?.label;
  if (selectedReasonLabel === 'Other' && !f.previous_reason_leaving_custom?.trim()) {
    e.previous_reason_leaving_custom = 'Please specify reason for leaving';
  }

  // Address line 1 is also required
  if (!f.address_line1?.trim()) {
    e.address_line1 = 'Street Address is required';
  }

  if (!f.same_as_temporary) {
    if (!f.permanent_address_line1?.trim()) {
      e.permanent_address_line1 = 'Permanent Street Address is required';
    }
    if (!f.permanent_city?.trim()) {
      e.permanent_city = 'Permanent City is required';
    }
    if (!f.permanent_state?.trim()) {
      e.permanent_state = 'Permanent State is required';
    }
    if (!f.permanent_pincode?.trim()) {
      e.permanent_pincode = 'Permanent PIN code is required';
    } else if (!/^\d{6}$/.test(f.permanent_pincode)) {
      e.permanent_pincode = 'Must be 6 digits';
    }
  }

  // Name length validations
  if (f.first_name) {
    if (f.first_name.trim().length < 2) {
      e.first_name = 'First name must be at least 2 characters';
    }
  }
  if (f.middle_name) {
    if (f.middle_name.trim().length < 2) {
      e.middle_name = 'Middle name must be at least 2 characters';
    }
  }
  if (f.last_name) {
    if (f.last_name.trim().length < 2) {
      e.last_name = 'Last name must be at least 2 characters';
    }
  }

  if (f.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
      e.email = 'Invalid email address';
    } else if (f.email.length > 30) {
      e.email = 'Email address must not exceed 30 characters';
    }
  }
  if (f.mobile_number && !/^\d{10}$/.test(f.mobile_number)) e.mobile_number = 'Must be 10 digits';
  if (f.father_mobile && !/^\d{10}$/.test(f.father_mobile)) e.father_mobile = 'Must be 10 digits';
  if (f.mother_mobile && !/^\d{10}$/.test(f.mother_mobile)) e.mother_mobile = 'Must be 10 digits';
  if (f.pincode && !/^\d{6}$/.test(f.pincode)) e.pincode = 'Must be 6 digits';
  if (f.doctor_contact && !/^\d{10}$/.test(f.doctor_contact)) e.doctor_contact = 'Must be 10 digits';
  if (f.guardian_mobile && !/^\d{10}$/.test(f.guardian_mobile)) e.guardian_mobile = 'Must be 10 digits';
  if (f.father_name && f.father_name.length > 25) e.father_name = "Father's name must not exceed 25 characters";
  if (f.mother_name && f.mother_name.length > 25) e.mother_name = "Mother's name must not exceed 25 characters";
  if (f.parent_email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.parent_email)) {
      e.parent_email = 'Invalid email address';
    } else if (f.parent_email.length > 30) {
      e.parent_email = 'Parent email must not exceed 30 characters';
    }
  }
  if (f.aadhaar_number) {
    const raw = f.aadhaar_number.replace(/\s/g, '');
    if (raw.length > 0 && raw.length !== 12) {
      e.aadhaar_number = 'Must be 12 digits';
    }
  }
  if (f.previous_udise_code) {
    if (f.previous_udise_code.length > 0 && f.previous_udise_code.length !== 11) {
      e.previous_udise_code = 'UDISE Code must be exactly 11 digits';
    }
  }
  return e;
}

function getTabForField(field: string): string {
  if (['first_name', 'middle_name', 'last_name', 'email', 'mobile_number', 'gender', 'date_of_birth', 'blood_group', 'aadhaar_number', 'photo', 'student_id', 'nationality', 'mother_tongue', 'religion', 'category', 'status'].includes(field)) return 'info';
  if (['class_id', 'section', 'roll_number', 'admission_number', 'admission_date', 'medium', 'academic_year', 'admission_type', 'pen_number', 'apaar_id', 'admission_category'].includes(field)) return 'academic';
  if (['father_name', 'father_mobile', 'father_occupation', 'mother_name', 'mother_mobile', 'mother_occupation', 'alternate_mobile', 'parent_email'].includes(field)) return 'parent';
  if (['address_line1', 'address_line2', 'city', 'state', 'pincode', 'permanent_address_line1', 'permanent_address_line2', 'permanent_city', 'permanent_state', 'permanent_pincode', 'same_as_temporary'].includes(field)) return 'address';
  if (['previous_school', 'previous_class', 'previous_board', 'previous_passing_year', 'previous_grade', 'previous_tc_number', 'previous_tc_date', 'previous_school_address', 'previous_school_city', 'previous_school_state', 'previous_udise_code', 'previous_reason_leaving', 'previous_admission_number'].includes(field)) return 'previous';
  if (['medical_conditions', 'allergies', 'doctor_name', 'doctor_contact'].includes(field)) return 'medical';
  if (['aadhaar_card', 'migration_card', 'migration_number', 'transfer_card', 'transfer_number', 'bonafide_card', 'character_card', 'marksheet_card'].includes(field)) return 'docs';
  return 'other';
}

export default function StudentAdmissionForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // Modal Sub-tab wizard state
  const [activeWizardTab, setActiveWizardTab] = useState<string>('info');

  // Master options
  const [classes, setClasses] = useState<MasterOption[]>([]);
  const [bloodGroups, setBloodGroups] = useState<MasterOption[]>([]);
  const [mediums, setMediums] = useState<MasterOption[]>([]);
  const [religions, setReligions] = useState<MasterOption[]>([]);
  const [categories, setCategories] = useState<MasterOption[]>([]);
  const [genders, setGenders] = useState<string[]>(['Male', 'Female', 'Other']);
  const [allSections, setAllSections] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<MasterOption[]>([]);
  const [admissionCategories, setAdmissionCategories] = useState<MasterOption[]>([]);
  const [admissionTypes, setAdmissionTypes] = useState<MasterOption[]>([]);
  const [studentStatuses, setStudentStatuses] = useState<MasterOption[]>([]);
  const [boards, setBoards] = useState<MasterOption[]>([]);
  const [reasonsLeaving, setReasonsLeaving] = useState<MasterOption[]>([]);

  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingDocs, setExistingDocs] = useState<Record<string, string>>({});

  const filteredSections = useMemo(() => {
    if (!form.class_id) return [];
    const selectedClass = classes.find(c => String(c.value) === String(form.class_id));
    if (!selectedClass) return [];

    return allSections
      .filter(sec => {
        if (sec.class_id && String(sec.class_id) === String(form.class_id)) return true;
        if (sec.class_name && sec.class_name.toLowerCase() === selectedClass.label.toLowerCase()) return true;
        return false;
      })
      .map(sec => ({
        value: sec.section_name || sec.section,
        label: sec.section_name || sec.section
      }));
  }, [form.class_id, classes, allSections]);

  const wizardTabs = [
    { id: 'info', name: 'Student Info' },
    { id: 'academic', name: 'Academic' },
    { id: 'parent', name: 'Parent Details' },
    { id: 'address', name: 'Address' },
    { id: 'previous', name: 'Previous School' },
    { id: 'medical', name: 'Medical' },
    { id: 'docs', name: 'Documents' },
    { id: 'other', name: 'Other' },
  ];

  // Count errors on each tab
  const getTabErrorCount = (tabId: string) => {
    return Object.keys(errors).filter(k => errors[k] && getTabForField(k) === tabId).length;
  };

  // ─── Fetchers ──────────────────────────────────────────────────────────────
  const loadClasses = useCallback(async () => {
    try {
      const r = await api.get('/master/classes');
      if (r.data?.success && r.data.data) {
        const mapped = Object.entries(r.data.data).map(([id, name]) => ({
          value: Number(id),
          label: name as string
        }));
        setClasses(mapped);
        return mapped;
      }
    } catch { }
    return [];
  }, []);

  const loadMasters = useCallback(async () => {
    try {
      const [bgRes, medRes, relRes, catRes, genRes, ayRes, secRes, acRes, atRes, ssRes, boardsRes, reasonsRes] = await Promise.all([
        api.get('/master/blood-groups'),
        api.get('/master/mediums'),
        api.get('/master/religions'),
        api.get('/master/categories'),
        api.get('/master/genders'),
        api.get('/school/academic-years'),
        api.get('/school/sections'),
        api.get('/master/admission-categories'),
        api.get('/master/admission-types'),
        api.get('/master/student-statuses'),
        api.get('/master/affiliation-boards'),
        api.get('/master/reasons-leaving')
      ]);
      if (bgRes.data?.success && bgRes.data.data) {
        setBloodGroups(Object.entries(bgRes.data.data).map(([id, name]) => ({
          value: Number(id),
          label: name as string
        })));
      }
      if (medRes.data?.success && medRes.data.data) {
        setMediums(Object.entries(medRes.data.data).map(([id, name]) => ({
          value: Number(id),
          label: name as string
        })));
      }
      if (relRes.data?.success && relRes.data.data) {
        setReligions(Object.entries(relRes.data.data).map(([_, name]) => ({
          value: name as string,
          label: name as string
        })));
      }
      if (catRes.data?.success && catRes.data.data) {
        setCategories(Object.entries(catRes.data.data).map(([_, name]) => ({
          value: name as string,
          label: name as string
        })));
      }
      if (genRes.data?.success && genRes.data.data) {
        setGenders(Object.values(genRes.data.data) as string[]);
      }
      if (ayRes.data?.success && ayRes.data.data) {
        setAcademicYears(ayRes.data.data.map((ay: any) => ({
          value: ay.name,
          label: ay.name
        })));
      }
      if (secRes.data?.success && secRes.data.data) {
        setAllSections(secRes.data.data);
      }
      if (acRes.data?.success && acRes.data.data) {
        setAdmissionCategories(Object.entries(acRes.data.data).map(([id, name]) => ({
          value: Number(id),
          label: name as string
        })));
      }
      if (atRes.data?.success && atRes.data.data) {
        setAdmissionTypes(Object.entries(atRes.data.data).map(([id, name]) => ({
          value: Number(id),
          label: name as string
        })));
      }
      if (ssRes.data?.success && ssRes.data.data) {
        setStudentStatuses(Object.entries(ssRes.data.data).map(([id, name]) => ({
          value: Number(id),
          label: name as string
        })));
      }
      if (boardsRes.data?.success && boardsRes.data.data) {
        setBoards(Object.entries(boardsRes.data.data).map(([id, name]) => ({
          value: Number(id),
          label: name as string
        })));
      }
      if (reasonsRes.data?.success && reasonsRes.data.data) {
        setReasonsLeaving(Object.entries(reasonsRes.data.data).map(([id, name]) => ({
          value: Number(id),
          label: name as string
        })));
      }
    } catch { }
  }, []);



  const loadStudentDetails = useCallback(async (studentId: string, currentClasses: MasterOption[]) => {
    setLoading(true);
    try {
      const r = await api.get(`/students/${studentId}`);
      if (r.data?.success) {
        const st = r.data.data;
        const matchedClass = currentClasses.find(c => c.label === st.class_name);

        setPhotoPreview(st.photo_url ?? null);
        setExistingDocs({
          aadhaar_card: st.aadhaar_card_url ?? '',
          migration_card: st.migration_card_url ?? '',
          transfer_card: st.transfer_card_url ?? '',
          bonafide_card: st.bonafide_card_url ?? '',
          character_card: st.character_card_url ?? '',
          marksheet_card: st.marksheet_card_url ?? '',
        });
        setForm({
          first_name: st.user?.first_name ?? '',
          middle_name: st.middle_name ?? st.user?.middle_name ?? '',
          last_name: st.user?.last_name ?? '',
          email: st.user?.email ?? '',
          mobile_number: st.user?.mobile ?? '',
          gender: st.gender ?? 'Male',
          date_of_birth: st.user?.date_of_birth ?? '',
          blood_group: st.blood_group ?? '',
          aadhaar_number: st.aadhaar_number ? (st.aadhaar_number.replace(/\D/g, '').match(/.{1,4}/g)?.join(' ') ?? st.aadhaar_number) : '',
          photo: null,
          student_id: st.student_id ?? '',
          nationality: st.nationality ?? 'Indian',
          mother_tongue: st.mother_tongue ?? '',
          religion: st.religion ?? '',
          category: st.category ?? 'General',
          student_status: st.student_status ? Number(st.student_status) : '',

          class_id: matchedClass ? matchedClass.value.toString() : (st.class_name ?? ''),
          section: st.section ?? 'A',
          roll_number: st.roll_number ?? '',
          admission_number: st.admission_number ?? '',
          admission_date: st.admission_date ?? '',
          medium: st.medium ?? 'English Medium',
          academic_year: st.academic_year ?? '',
          admission_type: st.admission_type ? Number(st.admission_type) : '',
          pen_number: st.pen_number ?? '',
          apaar_id: st.apaar_id ?? '',
          admission_category: st.admission_category ? Number(st.admission_category) : '',

          father_name: st.father_name ?? '',
          father_mobile: st.father_mobile ?? '',
          father_occupation: st.father_occupation ?? '',
          mother_name: st.mother_name ?? '',
          mother_mobile: st.mother_mobile ?? '',
          mother_occupation: st.mother_occupation ?? '',
          alternate_mobile: st.alternate_mobile ?? '',
          parent_email: st.parent_email ?? '',

          address_line1: st.user?.address ?? '',
          address_line2: '',
          city: st.user?.city ?? '',
          state: st.user?.state ?? '',
          pincode: st.user?.pincode ?? '',
          permanent_address_line1: st.permanent_address_line1 ?? '',
          permanent_address_line2: '',
          permanent_city: st.permanent_city ?? '',
          permanent_state: st.permanent_state ?? '',
          permanent_pincode: st.permanent_pincode ?? '',
          same_as_temporary: st.same_as_temporary ?? false,

          previous_school: st.previous_school ?? '',
          previous_class: st.previous_class ?? '',
          previous_board: st.previous_board ?? '',
          previous_passing_year: st.previous_passing_year ?? '',
          previous_grade: st.previous_grade ?? '',
          previous_tc_number: st.previous_tc_number ?? '',
          previous_tc_date: st.previous_tc_date ?? '',
          previous_school_address: st.previous_school_address ?? '',
          previous_school_city: st.previous_school_city ?? '',
          previous_school_state: st.previous_school_state ?? '',
          previous_udise_code: st.previous_udise_code ?? '',
          previous_reason_leaving: st.previous_reason_leaving ? Number(st.previous_reason_leaving) : '',
          previous_reason_leaving_custom: st.previous_reason_leaving_custom ?? '',
          previous_admission_number: st.previous_admission_number ?? '',

          medical_conditions: st.medical_conditions ?? '',
          allergies: st.allergies ?? '',
          doctor_name: st.doctor_name ?? '',
          doctor_contact: st.doctor_contact ?? '',

          aadhaar_card: null,
          migration_card: null,
          migration_number: st.migration_number ?? '',
          transfer_card: null,
          transfer_number: st.transfer_number ?? '',
          bonafide_card: null,
          character_card: null,
          marksheet_card: null,

          guardian_name: st.guardian_name ?? '',
          guardian_relation: st.guardian_relation ?? '',
          guardian_mobile: st.guardian_mobile ?? '',
          transport_required: !!st.transport_required,
          transport_route: st.transport_route ?? '',
          pickup_point: st.pickup_point ?? '',
          hostel_required: !!st.hostel_required,
          room_number: st.room_number ?? '',
        });
      } else {
        toast.error('Student details not found');
        navigate('/students/admission');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to load student details');
      navigate('/students/admission');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const loadedClasses = await loadClasses();
      await loadMasters();

      if (isEditMode && id) {
        await loadStudentDetails(id, loadedClasses);
      } else {
        // Pre-fill Add Mode
        setForm({
          ...BLANK_FORM,
          admission_number: 'ADM-' + Date.now().toString().slice(-6),
          admission_date: new Date().toISOString().split('T')[0],
          class_id: loadedClasses[0]?.value.toString() ?? '',
        });
        setLoading(false);
      }
    };
    init();
  }, [isEditMode, id, loadClasses, loadMasters, loadStudentDetails]);

  const setField = (k: string, v: any) => {
    const next = { ...form, [k]: v };
    if (next.same_as_temporary) {
      if (k === 'address_line1') next.permanent_address_line1 = v;
      if (k === 'address_line2') next.permanent_address_line2 = v;
      if (k === 'city') next.permanent_city = v;
      if (k === 'state') next.permanent_state = v;
      if (k === 'pincode') next.permanent_pincode = v;
    }
    if (k === 'class_id') {
      next.section = '';
    }
    setForm(next);
    if (touched[k]) {
      const e = validateForm(next, reasonsLeaving);
      setErrors(p => ({ ...p, [k]: e[k] ?? '' }));
    }
  };

  const handleSameAddressChange = (checked: boolean) => {
    const next = {
      ...form,
      same_as_temporary: checked,
      permanent_address_line1: checked ? form.address_line1 : form.permanent_address_line1,
      permanent_address_line2: checked ? form.address_line2 : form.permanent_address_line2,
      permanent_city: checked ? form.city : form.permanent_city,
      permanent_state: checked ? form.state : form.permanent_state,
      permanent_pincode: checked ? form.pincode : form.permanent_pincode,
    };
    setForm(next);

    // Validate if touched
    const e = validateForm(next, reasonsLeaving);
    setErrors(p => ({
      ...p,
      same_as_temporary: '',
      permanent_address_line1: e.permanent_address_line1 ?? '',
      permanent_city: e.permanent_city ?? '',
      permanent_state: e.permanent_state ?? '',
      permanent_pincode: e.permanent_pincode ?? '',
    }));
  };

  const blur = (k: string) => {
    setTouched(p => ({ ...p, [k]: true }));
    setErrors(p => ({ ...p, [k]: validateForm(form, reasonsLeaving)[k] ?? '' }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setField('photo', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAadhaarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setField('aadhaar_card', file);
      toast.success(`Aadhaar Card: ${file.name} selected`);
    }
  };

  const handleMigrationSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setField('migration_card', file);
      toast.success(`Migration Certificate: ${file.name} selected`);
    }
  };

  const handleTransferSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setField('transfer_card', file);
      toast.success(`Transfer Certificate: ${file.name} selected`);
    }
  };

  const handleBonafideSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setField('bonafide_card', file);
      toast.success(`Bonafide Certificate: ${file.name} selected`);
    }
  };

  const handleCharacterSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setField('character_card', file);
      toast.success(`Character Certificate: ${file.name} selected`);
    }
  };

  const handleMarksheetSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setField('marksheet_card', file);
      toast.success(`Last Marksheet: ${file.name} selected`);
    }
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm(form, reasonsLeaving);
    if (Object.values(errs).some(Boolean)) {
      setErrors(errs);
      const t: Record<string, boolean> = {};
      Object.keys(BLANK_FORM).forEach(k => (t[k] = true));
      setTouched(t);
      toast.error('Please fill in all required fields across all tabs.');

      // Auto switch to the first tab that has an error
      const firstErrField = Object.keys(errs).find(k => errs[k]);
      if (firstErrField) {
        setActiveWizardTab(getTabForField(firstErrField));
      }
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

      if (!isEditMode) {
        await api.post('/students', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Student admitted successfully!');
      } else {
        formData.append('_method', 'PUT');
        await api.post(`/students/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Student profile updated successfully!');
      }
      navigate('/students/admission');
    } catch (err: any) {
      const sv = err.response?.data?.errors;
      if (sv) {
        const m: FormErrors = {};
        Object.entries(sv).forEach(([k, v]) => {
          m[k] = Array.isArray(v) ? v[0] as string : String(v);
        });
        setErrors(m);
        const firstErrField = Object.keys(m).find(k => m[k]);
        if (firstErrField) {
          setActiveWizardTab(getTabForField(firstErrField));
        }
      }
      toast.error(err.response?.data?.message ?? 'Failed to submit form data');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="text-gray-500 text-xs mt-3">Loading admission form details...</p>
      </div>
    );
  }

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden animate-fade">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-tr from-slate-50 to-white flex justify-between items-center">
          <div>
            <button
              type="button"
              onClick={() => navigate('/students/admission')}
              className="flex items-center gap-1 text-gray-500 hover:text-blue-600 font-bold mb-1 transition text-[11px] cursor-pointer bg-transparent border-none outline-none"
            >
              <ArrowLeft size={13} /> Back to Student List
            </button>
            <h3 className="text-[15px] font-extrabold text-gray-800 flex items-center gap-1.5">
              <Sparkles size={16} className="text-blue-500 animate-pulse" />
              {!isEditMode ? 'Student Registration Form' : 'Modify Student Profile'}
            </h3>
          </div>
          <button className="text-gray-400 hover:text-red-500 transition cursor-pointer bg-transparent border-none outline-none" onClick={() => navigate('/students/admission')}><XCircle size={22} /></button>
        </div>

        {/* Horizontal Tabs Header */}
        <div className="px-6 bg-slate-50 border-b border-gray-150 flex items-center gap-1 overflow-x-auto py-2">
          {wizardTabs.map(t => {
            const errCount = getTabErrorCount(t.id);
            const isActive = activeWizardTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveWizardTab(t.id)}
                className={`px-3 py-1.5 text-[11.5px] font-bold rounded-lg transition relative cursor-pointer border-none outline-none ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200/50 bg-transparent'}`}
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

        {/* Wizard Body content */}
        <form onSubmit={submitForm} className="flex-1 flex flex-col overflow-hidden" noValidate>
          <div className="flex-1 overflow-y-auto p-4.5 space-y-4">

            {/* TAB 1: Student Info */}
            {activeWizardTab === 'info' && (
              <div className="space-y-4 animate-fade">
                {/* PHOTO & BASIC IDENTITY */}
                <div className="border border-gray-200 rounded-lg p-5 bg-white relative space-y-4 shadow-sm">


                  <div className="grid grid-cols-3 gap-5">
                    <div className="col-span-2 space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        <Field label="First Name *" err={errors.first_name}>
                          <input maxLength={25} value={form.first_name} onChange={e => setField('first_name', e.target.value)} onBlur={() => blur('first_name')} className={fCls(errors.first_name)} />
                        </Field>
                        <Field label="Middle Name" err={errors.middle_name}>
                          <input maxLength={25} value={form.middle_name || ''} onChange={e => setField('middle_name', e.target.value)} onBlur={() => blur('middle_name')} className={fCls(errors.middle_name)} />
                        </Field>
                        <Field label="Last Name" err={errors.last_name}>
                          <input maxLength={25} value={form.last_name} onChange={e => setField('last_name', e.target.value)} onBlur={() => blur('last_name')} className={fCls(errors.last_name)} />
                        </Field>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <Field label="Date of Birth *" err={errors.date_of_birth}>
                          <input type="date" value={form.date_of_birth} onChange={e => setField('date_of_birth', e.target.value)} className={fCls(errors.date_of_birth)} />
                        </Field>
                        <Field label="Blood Group">
                          <Select
                            options={bloodGroups}
                            value={bloodGroups.find(bg => bg.label === form.blood_group) || null}
                            onChange={val => setField('blood_group', val ? val.label : '')}
                            placeholder="Select Blood Group"
                            styles={customSelectStyles}
                            isClearable
                          />
                        </Field>
                        <Field label="Gender *">
                          <div className="flex gap-1.5">
                            {genders.map(g => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setField('gender', g)}
                                className={`flex-1 py-1.5 border rounded-lg text-[11px] font-bold transition cursor-pointer ${form.gender === g ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'}`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </Field>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <Field label="Student ID (Unique)" err={errors.student_id}>
                          <input maxLength={50} placeholder="e.g. STU-001" value={form.student_id} onChange={e => setField('student_id', e.target.value)} className={fCls(errors.student_id)} />
                        </Field>
                        <Field label="Nationality" err={errors.nationality}>
                          <input maxLength={50} placeholder="e.g. Indian" value={form.nationality} onChange={e => setField('nationality', e.target.value)} className={fCls(errors.nationality)} />
                        </Field>
                        <Field label="Mother Tongue" err={errors.mother_tongue}>
                          <input maxLength={50} placeholder="e.g. Hindi" value={form.mother_tongue} onChange={e => setField('mother_tongue', e.target.value)} className={fCls(errors.mother_tongue)} />
                        </Field>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <Field label="Religion" err={errors.religion}>
                          <Select
                            options={religions}
                            value={religions.find(r => r.value === form.religion) || (form.religion ? { value: form.religion, label: form.religion } : null)}
                            onChange={val => setField('religion', val ? val.value : '')}
                            placeholder="Select Religion"
                            styles={customSelectStyles}
                            isClearable
                          />
                        </Field>
                        <Field label="Category" err={errors.category}>
                          <Select
                            options={categories}
                            value={categories.find(c => c.value === form.category) || (form.category ? { value: form.category, label: form.category } : null)}
                            onChange={val => setField('category', val ? val.value : '')}
                            placeholder="Select Category"
                            styles={customSelectStyles}
                            isClearable
                          />
                        </Field>
                        <Field label="Student Status" err={errors.student_status}>
                          <Select
                            options={studentStatuses}
                            value={studentStatuses.find(s => s.value === Number(form.student_status)) || null}
                            onChange={val => setField('student_status', val ? val.value : '')}
                            placeholder="Select Status"
                            styles={customSelectStyles}
                            isClearable
                          />
                        </Field>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <Field label="Mobile Number *" err={errors.mobile_number}>
                          <input maxLength={10} placeholder="+91 10-digits" value={form.mobile_number} onChange={e => setField('mobile_number', e.target.value.replace(/\D/g, ''))} onBlur={() => blur('mobile_number')} className={fCls(errors.mobile_number)} />
                        </Field>
                        <Field label="Email Address *" err={errors.email} cls="col-span-2">
                          <input type="email" maxLength={30} placeholder="student@example.com" value={form.email} onChange={e => setField('email', e.target.value)} onBlur={() => blur('email')} className={fCls(errors.email)} />
                        </Field>
                      </div>
                    </div>

                    {/* Photo upload dashed box */}
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-4 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400 transition cursor-pointer relative" onClick={() => document.getElementById('photoInput')?.click()}>
                      {photoPreview ? (
                        <img src={photoPreview === 'has-preview' ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' : photoPreview} alt="Preview" className="w-18 h-18 rounded-full border border-gray-200 object-cover shadow-sm mb-2" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                          <Plus size={20} />
                        </div>
                      )}
                      <span className="text-[10px] text-gray-500 font-semibold text-center">Student photo upload</span>
                      <span className="text-[8px] text-gray-400 text-center mt-0.5">JPG, PNG • max 2 MB</span>
                      <input id="photoInput" type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Academic */}
            {activeWizardTab === 'academic' && (
              <div className="border border-gray-200 rounded-lg p-5 bg-white relative space-y-4 shadow-sm animate-fade">

                <div className="grid grid-cols-4 gap-4">
                  <Field label="Class Standard *" err={errors.class_id}>
                    <Select
                      options={classes}
                      value={classes.find(c => String(c.value) === form.class_id) || null}
                      onChange={val => setField('class_id', val ? String(val.value) : '')}
                      placeholder="Select Class"
                      styles={customSelectStyles}
                    />
                  </Field>
                  <Field label="Section / Division">
                    <Select
                      options={filteredSections}
                      value={filteredSections.find(s => s.value === form.section) || (form.section ? { value: form.section, label: form.section } : null)}
                      onChange={val => setField('section', val ? val.value : '')}
                      placeholder={form.class_id ? "Select Section" : "Select Class first"}
                      styles={customSelectStyles}
                      isClearable
                    />
                  </Field>
                  <Field label="Roll Number">
                    <input maxLength={20} placeholder="Auto generated if empty" value={form.roll_number} onChange={e => setField('roll_number', e.target.value)} className={fCls('')} />
                  </Field>
                  <Field label="Admission No. *" err={errors.admission_number}>
                    <input maxLength={50} value={form.admission_number} onChange={e => setField('admission_number', e.target.value)} onBlur={() => blur('admission_number')} className={fCls(errors.admission_number)} />
                  </Field>

                  <Field label="Admission Date *" err={errors.admission_date}>
                    <input type="date" value={form.admission_date} onChange={e => setField('admission_date', e.target.value)} onBlur={() => blur('admission_date')} className={fCls(errors.admission_date)} />
                  </Field>
                  <Field label="Medium of Instruction">
                    <Select
                      options={mediums}
                      value={mediums.find(m => m.label === form.medium) || null}
                      onChange={val => setField('medium', val ? val.label : '')}
                      placeholder="Select Medium"
                      styles={customSelectStyles}
                    />
                  </Field>
                  <Field label="Academic Year" err={errors.academic_year}>
                    <Select
                      options={academicYears}
                      value={academicYears.find(ay => ay.value === form.academic_year) || (form.academic_year ? { value: form.academic_year, label: form.academic_year } : null)}
                      onChange={val => setField('academic_year', val ? val.value : '')}
                      placeholder="Select Academic Year"
                      styles={customSelectStyles}
                      isClearable
                    />
                  </Field>
                  <Field label="Admission Type" err={errors.admission_type}>
                    <Select
                      options={admissionTypes}
                      value={admissionTypes.find(at => at.value === Number(form.admission_type)) || null}
                      onChange={val => setField('admission_type', val ? val.value : '')}
                      placeholder="Select Admission Type"
                      styles={customSelectStyles}
                      isClearable
                    />
                  </Field>

                  <Field label="PEN Number" err={errors.pen_number}>
                    <input maxLength={20} placeholder="Personal Education Number" value={form.pen_number} onChange={e => setField('pen_number', e.target.value)} className={fCls(errors.pen_number)} />
                  </Field>
                  <Field label="APAAR ID" err={errors.apaar_id}>
                    <input maxLength={20} placeholder="APAAR ID (12-digit)" value={form.apaar_id} onChange={e => setField('apaar_id', e.target.value)} className={fCls(errors.apaar_id)} />
                  </Field>
                  <Field label="Admission Category" err={errors.admission_category} cls="col-span-2">
                    <Select
                      options={admissionCategories}
                      value={admissionCategories.find(ac => ac.value === Number(form.admission_category)) || null}
                      onChange={val => setField('admission_category', val ? val.value : '')}
                      placeholder="Select Admission Category"
                      styles={customSelectStyles}
                      isClearable
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* TAB 3: Parent Details */}
            {activeWizardTab === 'parent' && (
              <div className="border border-gray-200 rounded-lg p-5 bg-white relative space-y-5 shadow-sm animate-fade">


                {/* Father Info */}
                <div className="space-y-3.5">
                  <h5 className="font-bold text-gray-700 text-[11px] uppercase tracking-wider text-blue-500 border-b border-gray-100 pb-1">Father's Info</h5>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Father's Name *" err={errors.father_name}>
                      <input maxLength={25} value={form.father_name} onChange={e => setField('father_name', e.target.value)} onBlur={() => blur('father_name')} className={fCls(errors.father_name)} />
                    </Field>
                    <Field label="Father's Mobile *" err={errors.father_mobile}>
                      <input maxLength={10} placeholder="10 digits" value={form.father_mobile} onChange={e => setField('father_mobile', e.target.value.replace(/\D/g, ''))} onBlur={() => blur('father_mobile')} className={fCls(errors.father_mobile)} />
                    </Field>
                    <Field label="Father's Occupation *" err={errors.father_occupation}>
                      <input maxLength={255} placeholder="Service / Business" value={form.father_occupation} onChange={e => setField('father_occupation', e.target.value)} onBlur={() => blur('father_occupation')} className={fCls(errors.father_occupation)} />
                    </Field>
                  </div>
                </div>

                {/* Mother Info */}
                <div className="space-y-3.5 pt-2">
                  <h5 className="font-bold text-gray-700 text-[11px] uppercase tracking-wider text-blue-500 border-b border-gray-100 pb-1">Mother's Info</h5>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Mother's Name *" err={errors.mother_name}>
                      <input maxLength={25} value={form.mother_name} onChange={e => setField('mother_name', e.target.value)} onBlur={() => blur('mother_name')} className={fCls(errors.mother_name)} />
                    </Field>
                    <Field label="Mother's Mobile *" err={errors.mother_mobile}>
                      <input maxLength={10} placeholder="10 digits" value={form.mother_mobile} onChange={e => setField('mother_mobile', e.target.value.replace(/\D/g, ''))} onBlur={() => blur('mother_mobile')} className={fCls(errors.mother_mobile)} />
                    </Field>
                    <Field label="Mother's Occupation *" err={errors.mother_occupation}>
                      <input maxLength={255} placeholder="Housewife / Service" value={form.mother_occupation} onChange={e => setField('mother_occupation', e.target.value)} onBlur={() => blur('mother_occupation')} className={fCls(errors.mother_occupation)} />
                    </Field>
                  </div>
                </div>

                {/* Additional */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <Field label="Alternate Mobile" err={errors.alternate_mobile}>
                    <input maxLength={10} placeholder="Emergency optional contact" value={form.alternate_mobile} onChange={e => setField('alternate_mobile', e.target.value.replace(/\D/g, ''))} className={fCls(errors.alternate_mobile)} />
                  </Field>
                  <Field label="Parent Email" err={errors.parent_email}>
                    <input type="email" maxLength={30} placeholder="parent@example.com" value={form.parent_email} onChange={e => setField('parent_email', e.target.value)} onBlur={() => blur('parent_email')} className={fCls(errors.parent_email)} />
                  </Field>
                </div>
              </div>
            )}

            {/* TAB 4: Address */}
            {activeWizardTab === 'address' && (
              <div className="border border-gray-200 rounded-lg p-3 bg-white relative space-y-2 shadow-sm animate-fade">


                {/* Temporary Address Section */}
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-gray-700 text-[11px] tracking-wider uppercase text-blue-500 border-b border-gray-100 pb-1">Temporary / Current Address</h4>
                  <div className="space-y-1.5">
                    {/* Row 1: Street Address */}
                    <Field label="Street Address / Colony *" err={errors.address_line1}>
                      <textarea
                        rows={1}
                        maxLength={255}
                        placeholder="Street / Colony"
                        value={form.address_line1}
                        onChange={e => setField('address_line1', e.target.value)}
                        onBlur={() => blur('address_line1')}
                        className={fCls(errors.address_line1) + " h-[34px] py-1.5 resize-none"}
                      />
                    </Field>
                    {/* Row 2: City, State, PIN Code */}
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="City *" err={errors.city}>
                        <input maxLength={100} value={form.city} onChange={e => setField('city', e.target.value)} onBlur={() => blur('city')} className={fCls(errors.city)} />
                      </Field>
                      <Field label="State *" err={errors.state}>
                        <Select
                          options={INDIAN_STATES}
                          value={INDIAN_STATES.find(s => s.value === form.state) || null}
                          onChange={val => setField('state', val ? val.value : '')}
                          placeholder="State"
                          styles={customSelectStyles}
                        />
                      </Field>
                      <Field label="PIN Code *" err={errors.pincode}>
                        <input maxLength={6} placeholder="6 digits" value={form.pincode} onChange={e => setField('pincode', e.target.value.replace(/\D/g, ''))} onBlur={() => blur('pincode')} className={fCls(errors.pincode)} />
                      </Field>
                    </div>
                  </div>
                </div>

                {/* Same Address Checkbox */}
                <div className="flex items-center gap-2 py-1 bg-slate-50/50 -mx-3 px-3 rounded-lg border border-slate-100/60">
                  <input
                    type="checkbox"
                    id="sameAsTemporary"
                    checked={form.same_as_temporary}
                    onChange={e => handleSameAddressChange(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="sameAsTemporary" className="text-[10px] font-bold text-gray-600 cursor-pointer select-none">
                    Permanent Address is same as Temporary Address
                  </label>
                </div>

                {/* Permanent Address Section */}
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-gray-700 text-[11px] tracking-wider uppercase text-blue-500 border-b border-gray-100 pb-1">Permanent Address</h4>
                  <div className="space-y-1.5">
                    {/* Row 1: Street Address */}
                    <Field label="Street Address / Colony *" err={errors.permanent_address_line1}>
                      <textarea
                        rows={1}
                        maxLength={255}
                        placeholder="Permanent Street / Colony"
                        value={form.same_as_temporary ? form.address_line1 : form.permanent_address_line1}
                        onChange={e => setField('permanent_address_line1', e.target.value)}
                        onBlur={() => blur('permanent_address_line1')}
                        disabled={form.same_as_temporary}
                        className={fCls(errors.permanent_address_line1) + " h-[34px] py-1.5 resize-none" + (form.same_as_temporary ? " bg-slate-100 cursor-not-allowed text-gray-400" : "")}
                      />
                    </Field>
                    {/* Row 2: City, State, PIN Code */}
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="City *" err={errors.permanent_city}>
                        <input
                          maxLength={100}
                          value={form.same_as_temporary ? form.city : form.permanent_city}
                          onChange={e => setField('permanent_city', e.target.value)}
                          onBlur={() => blur('permanent_city')}
                          disabled={form.same_as_temporary}
                          className={fCls(errors.permanent_city) + (form.same_as_temporary ? " bg-slate-100 cursor-not-allowed" : "")}
                        />
                      </Field>
                      <Field label="State *" err={errors.permanent_state}>
                        <Select
                          options={INDIAN_STATES}
                          value={INDIAN_STATES.find(s => s.value === (form.same_as_temporary ? form.state : form.permanent_state)) || null}
                          onChange={val => setField('permanent_state', val ? val.value : '')}
                          placeholder="State"
                          styles={customSelectStyles}
                          isDisabled={form.same_as_temporary}
                        />
                      </Field>
                      <Field label="PIN Code *" err={errors.permanent_pincode}>
                        <input
                          maxLength={6}
                          placeholder="6 digits"
                          value={form.same_as_temporary ? form.pincode : form.permanent_pincode}
                          onChange={e => setField('permanent_pincode', e.target.value.replace(/\D/g, ''))}
                          onBlur={() => blur('permanent_pincode')}
                          disabled={form.same_as_temporary}
                          className={fCls(errors.permanent_pincode) + (form.same_as_temporary ? " bg-slate-100 cursor-not-allowed" : "")}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Previous School */}
            {activeWizardTab === 'previous' && (
              <div className="border border-gray-200 rounded-lg p-5 bg-white relative space-y-4 shadow-sm animate-fade">

                <div className="grid grid-cols-4 gap-4">
                  <Field label="Previous School Name" err={errors.previous_school} cls="col-span-2">
                    <input maxLength={255} placeholder="Name of school last attended" value={form.previous_school} onChange={e => setField('previous_school', e.target.value)} className={fCls(errors.previous_school)} />
                  </Field>
                  <Field label="Previous Class Standard" err={errors.previous_class}>
                    <Select
                      options={classes}
                      value={classes.find(c => c.label === form.previous_class) || (form.previous_class ? { value: 0, label: form.previous_class } : null)}
                      onChange={val => setField('previous_class', val ? val.label : '')}
                      placeholder="Select Class"
                      styles={customSelectStyles}
                      isClearable
                    />
                  </Field>
                  <Field label="Previous Board / University" err={errors.previous_board}>
                    <Select
                      options={boards}
                      value={boards.find(b => b.label === form.previous_board) || (form.previous_board ? { value: 0, label: form.previous_board } : null)}
                      onChange={val => setField('previous_board', val ? val.label : '')}
                      placeholder="Select Board / University"
                      styles={customSelectStyles}
                      isClearable
                    />
                  </Field>

                  <Field label="Passing Year" err={errors.previous_passing_year}>
                    <input maxLength={4} placeholder="e.g. 2025" value={form.previous_passing_year} onChange={e => setField('previous_passing_year', e.target.value.replace(/\D/g, ''))} className={fCls(errors.previous_passing_year)} />
                  </Field>
                  <Field label="Marks / Grade" err={errors.previous_grade}>
                    <input maxLength={50} placeholder="e.g. 85% or A Grade" value={form.previous_grade} onChange={e => setField('previous_grade', e.target.value)} className={fCls(errors.previous_grade)} />
                  </Field>
                  <Field label="TC Issue Date" err={errors.previous_tc_date}>
                    <input type="date" value={form.previous_tc_date} onChange={e => setField('previous_tc_date', e.target.value)} className={fCls(errors.previous_tc_date)} />
                  </Field>
                  <Field label="Previous Admission Number" err={errors.previous_admission_number}>
                    <input maxLength={50} placeholder="Previous Admission No." value={form.previous_admission_number} onChange={e => setField('previous_admission_number', e.target.value)} className={fCls(errors.previous_admission_number)} />
                  </Field>

                  <Field label="Previous School Address" err={errors.previous_school_address} cls="col-span-2">
                    <input maxLength={255} placeholder="School address" value={form.previous_school_address} onChange={e => setField('previous_school_address', e.target.value)} className={fCls(errors.previous_school_address)} />
                  </Field>
                  <Field label="City" err={errors.previous_school_city}>
                    <input maxLength={100} placeholder="School city" value={form.previous_school_city} onChange={e => setField('previous_school_city', e.target.value)} className={fCls(errors.previous_school_city)} />
                  </Field>
                  <Field label="State" err={errors.previous_school_state}>
                    <Select
                      options={INDIAN_STATES}
                      value={INDIAN_STATES.find(s => s.value === form.previous_school_state) || null}
                      onChange={val => setField('previous_school_state', val ? val.value : '')}
                      placeholder="Select State"
                      styles={customSelectStyles}
                      isClearable
                    />
                  </Field>

                  <Field label="UDISE Code" err={errors.previous_udise_code}>
                    <input maxLength={11} placeholder="11 digit UDISE code" value={form.previous_udise_code} onChange={e => setField('previous_udise_code', e.target.value.replace(/\D/g, ''))} className={fCls(errors.previous_udise_code)} />
                  </Field>
                  <Field
                    label="Reason for Leaving"
                    err={errors.previous_reason_leaving}
                    cls={reasonsLeaving.find(r => r.value === Number(form.previous_reason_leaving))?.label === 'Other' ? "col-span-1" : "col-span-3"}
                  >
                    <Select
                      options={reasonsLeaving}
                      value={reasonsLeaving.find(r => r.value === Number(form.previous_reason_leaving)) || null}
                      onChange={val => {
                        const nextVal = val ? val.value : '';
                        setForm(prev => ({
                          ...prev,
                          previous_reason_leaving: nextVal,
                          previous_reason_leaving_custom: val?.label === 'Other' ? prev.previous_reason_leaving_custom : ''
                        }));
                        // Clear error for both fields when updated
                        setErrors(prev => ({
                          ...prev,
                          previous_reason_leaving: '',
                          previous_reason_leaving_custom: ''
                        }));
                      }}
                      placeholder="Select Reason"
                      styles={customSelectStyles}
                      isClearable
                    />
                  </Field>
                  {reasonsLeaving.find(r => r.value === Number(form.previous_reason_leaving))?.label === 'Other' && (
                    <Field label="Specify Other Reason *" err={errors.previous_reason_leaving_custom} cls="col-span-2 animate-fade">
                      <input
                        maxLength={255}
                        placeholder="Please specify"
                        value={form.previous_reason_leaving_custom}
                        onChange={e => setField('previous_reason_leaving_custom', e.target.value)}
                        className={fCls(errors.previous_reason_leaving_custom)}
                      />
                    </Field>
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: Medical */}
            {activeWizardTab === 'medical' && (
              <div className="border border-gray-200 rounded-lg p-5 bg-white relative space-y-4 shadow-sm animate-fade">

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Medical Conditions / Critical illness">
                    <input maxLength={255} placeholder="None if healthy" value={form.medical_conditions} onChange={e => setField('medical_conditions', e.target.value)} className={fCls('')} />
                  </Field>
                  <Field label="Food / Chemical Allergies">
                    <input maxLength={255} placeholder="List allergies if any" value={form.allergies} onChange={e => setField('allergies', e.target.value)} className={fCls('')} />
                  </Field>
                  <Field label="Family Doctor Name">
                    <input maxLength={255} value={form.doctor_name} onChange={e => setField('doctor_name', e.target.value)} className={fCls('')} />
                  </Field>
                  <Field label="Doctor Mobile No" err={errors.doctor_contact}>
                    <input maxLength={10} placeholder="10 digits" value={form.doctor_contact} onChange={e => setField('doctor_contact', e.target.value.replace(/\D/g, ''))} className={fCls(errors.doctor_contact)} />
                  </Field>
                </div>
              </div>
            )}

            {/* TAB 7: Documents */}
            {activeWizardTab === 'docs' && (
              <div className="border border-gray-200 rounded-lg p-5 bg-white relative space-y-6 shadow-sm animate-fade">


                <div className="grid grid-cols-3 gap-4">
                  {/* Aadhaar Card */}
                  <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 space-y-2">
                    <span className="font-bold text-gray-700 text-[11px] block">Aadhaar Card Document</span>
                    <div className="border border-dashed border-gray-200 hover:border-blue-400 p-2.5 rounded-lg text-center cursor-pointer bg-white transition" onClick={() => document.getElementById('aadhaarUpload')?.click()}>
                      <FileUp size={16} className="mx-auto text-gray-400 mb-0.5" />
                      <span className="block text-[9px] font-bold text-gray-600">Upload Aadhaar Card (PDF/JPG)</span>
                      {form.aadhaar_card ? (
                        <span className="text-[9px] text-blue-600 font-bold block mt-0.5 truncate max-w-[150px]">📄 {form.aadhaar_card.name}</span>
                      ) : existingDocs.aadhaar_card ? (
                        <a href={existingDocs.aadhaar_card} target="_blank" rel="noopener noreferrer" className="text-[9px] text-green-600 hover:underline font-bold block mt-0.5 truncate max-w-[150px]" onClick={e => e.stopPropagation()}>📄 View Uploaded Card</a>
                      ) : (
                        <span className="text-[8px] text-gray-400 block">No file selected</span>
                      )}
                      <input id="aadhaarUpload" type="file" accept=".pdf,image/*" className="hidden" onChange={handleAadhaarSelect} />
                    </div>
                    <Field label="Aadhaar No" err={errors.aadhaar_number}>
                      <input
                        maxLength={14}
                        placeholder="12-digit UID"
                        value={form.aadhaar_number}
                        onChange={e => {
                          const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
                          const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
                          setField('aadhaar_number', formatted);
                        }}
                        className={fCls(errors.aadhaar_number)}
                      />
                    </Field>
                  </div>

                  {/* Migration Certificate */}
                  <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 space-y-2">
                    <span className="font-bold text-gray-700 text-[11px] block">Migration Certificate</span>
                    <div className="border border-dashed border-gray-200 hover:border-blue-400 p-2.5 rounded-lg text-center cursor-pointer bg-white transition" onClick={() => document.getElementById('migrationUpload')?.click()}>
                      <FileUp size={16} className="mx-auto text-gray-400 mb-0.5" />
                      <span className="block text-[9px] font-bold text-gray-600">Upload Migration Cert (PDF/JPG)</span>
                      {form.migration_card ? (
                        <span className="text-[9px] text-blue-600 font-bold block mt-0.5 truncate max-w-[150px]">📄 {form.migration_card.name}</span>
                      ) : existingDocs.migration_card ? (
                        <a href={existingDocs.migration_card} target="_blank" rel="noopener noreferrer" className="text-[9px] text-green-600 hover:underline font-bold block mt-0.5 truncate max-w-[150px]" onClick={e => e.stopPropagation()}>📄 View Uploaded Cert</a>
                      ) : (
                        <span className="text-[8px] text-gray-400 block">No file selected</span>
                      )}
                      <input id="migrationUpload" type="file" accept=".pdf,image/*" className="hidden" onChange={handleMigrationSelect} />
                    </div>
                    <Field label="Migration No" err={errors.migration_number}>
                      <input
                        maxLength={50}
                        placeholder="Certificate number"
                        value={form.migration_number}
                        onChange={e => setField('migration_number', e.target.value)}
                        className={fCls(errors.migration_number)}
                      />
                    </Field>
                  </div>

                  {/* Transfer Certificate */}
                  <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 space-y-2">
                    <span className="font-bold text-gray-700 text-[11px] block">Transfer Certificate</span>
                    <div className="border border-dashed border-gray-200 hover:border-blue-400 p-2.5 rounded-lg text-center cursor-pointer bg-white transition" onClick={() => document.getElementById('transferUpload')?.click()}>
                      <FileUp size={16} className="mx-auto text-gray-400 mb-0.5" />
                      <span className="block text-[9px] font-bold text-gray-600">Upload Transfer Cert (PDF/JPG)</span>
                      {form.transfer_card ? (
                        <span className="text-[9px] text-blue-600 font-bold block mt-0.5 truncate max-w-[150px]">📄 {form.transfer_card.name}</span>
                      ) : existingDocs.transfer_card ? (
                        <a href={existingDocs.transfer_card} target="_blank" rel="noopener noreferrer" className="text-[9px] text-green-600 hover:underline font-bold block mt-0.5 truncate max-w-[150px]" onClick={e => e.stopPropagation()}>📄 View Uploaded Cert</a>
                      ) : (
                        <span className="text-[8px] text-gray-400 block">No file selected</span>
                      )}
                      <input id="transferUpload" type="file" accept=".pdf,image/*" className="hidden" onChange={handleTransferSelect} />
                    </div>
                    <Field label="Transfer NO" err={errors.transfer_number}>
                      <input
                        maxLength={50}
                        placeholder="Certificate number"
                        value={form.transfer_number}
                        onChange={e => setField('transfer_number', e.target.value)}
                        className={fCls(errors.transfer_number)}
                      />
                    </Field>
                  </div>

                  {/* Other Certificates */}
                  <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 space-y-3 col-span-3">
                    <span className="font-bold text-gray-700 text-[11px] block">Other Mandatory &amp; Bonafide Certificates</span>
                    <div className="grid grid-cols-3 gap-4">
                      {/* Bonafide */}
                      <div className="flex items-center justify-between bg-white border border-gray-150 p-2 rounded-lg">
                        <div className="truncate pr-2">
                          <span className="font-semibold text-gray-700 block text-[10px]">Bonafide Certificate</span>
                          {form.bonafide_card ? (
                            <span className="text-[8px] text-blue-600 font-bold block truncate max-w-[100px]">📄 {form.bonafide_card.name}</span>
                          ) : existingDocs.bonafide_card ? (
                            <a href={existingDocs.bonafide_card} target="_blank" rel="noopener noreferrer" className="text-[8px] text-green-600 hover:underline font-bold block truncate max-w-[100px]">📄 View Uploaded</a>
                          ) : null}
                        </div>
                        <button type="button" className="shrink-0 px-2 py-0.5 bg-white border border-gray-200 text-gray-600 rounded text-[9px] font-bold hover:bg-gray-50 transition" onClick={() => document.getElementById('bonafideUpload')?.click()}>Select File</button>
                        <input id="bonafideUpload" type="file" accept=".pdf,image/*" className="hidden" onChange={handleBonafideSelect} />
                      </div>

                      {/* Character */}
                      <div className="flex items-center justify-between bg-white border border-gray-150 p-2 rounded-lg">
                        <div className="truncate pr-2">
                          <span className="font-semibold text-gray-700 block text-[10px]">Character Certificate</span>
                          {form.character_card ? (
                            <span className="text-[8px] text-blue-600 font-bold block truncate max-w-[100px]">📄 {form.character_card.name}</span>
                          ) : existingDocs.character_card ? (
                            <a href={existingDocs.character_card} target="_blank" rel="noopener noreferrer" className="text-[8px] text-green-600 hover:underline font-bold block truncate max-w-[100px]">📄 View Uploaded</a>
                          ) : null}
                        </div>
                        <button type="button" className="shrink-0 px-2 py-0.5 bg-white border border-gray-200 text-gray-600 rounded text-[9px] font-bold hover:bg-gray-50 transition" onClick={() => document.getElementById('characterUpload')?.click()}>Select File</button>
                        <input id="characterUpload" type="file" accept=".pdf,image/*" className="hidden" onChange={handleCharacterSelect} />
                      </div>

                      {/* Last Marksheet */}
                      <div className="flex items-center justify-between bg-white border border-gray-150 p-2 rounded-lg">
                        <div className="truncate pr-2">
                          <span className="font-semibold text-gray-700 block text-[10px]">Last Academic Marksheet</span>
                          {form.marksheet_card ? (
                            <span className="text-[8px] text-blue-600 font-bold block truncate max-w-[100px]">📄 {form.marksheet_card.name}</span>
                          ) : existingDocs.marksheet_card ? (
                            <a href={existingDocs.marksheet_card} target="_blank" rel="noopener noreferrer" className="text-[8px] text-green-600 hover:underline font-bold block truncate max-w-[100px]">📄 View Uploaded</a>
                          ) : null}
                        </div>
                        <button type="button" className="shrink-0 px-2 py-0.5 bg-white border border-gray-200 text-gray-600 rounded text-[9px] font-bold hover:bg-gray-50 transition" onClick={() => document.getElementById('marksheetUpload')?.click()}>Select File</button>
                        <input id="marksheetUpload" type="file" accept=".pdf,image/*" className="hidden" onChange={handleMarksheetSelect} />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 8: Other */}
            {activeWizardTab === 'other' && (
              <div className="space-y-5 animate-fade">
                {/* Guardian Info */}
                <div className="border border-gray-200 rounded-lg p-5 bg-white relative space-y-4 shadow-sm">

                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Guardian Name">
                      <input maxLength={255} value={form.guardian_name} onChange={e => setField('guardian_name', e.target.value)} className={fCls('')} />
                    </Field>
                    <Field label="Relation with Student">
                      <input maxLength={255} placeholder="Uncle / Aunt / Brother" value={form.guardian_relation} onChange={e => setField('guardian_relation', e.target.value)} className={fCls('')} />
                    </Field>
                    <Field label="Guardian Mobile" err={errors.guardian_mobile}>
                      <input maxLength={10} placeholder="10 digits" value={form.guardian_mobile} onChange={e => setField('guardian_mobile', e.target.value.replace(/\D/g, ''))} className={fCls(errors.guardian_mobile)} />
                    </Field>
                  </div>
                </div>

                {/* School Facilities Enrolment */}
                <div className="border border-gray-200 rounded-lg p-5 bg-white relative space-y-4 shadow-sm">
                  <span className="absolute top-0 left-4 -translate-y-1/2 bg-white px-2 text-[10px] font-bold text-blue-600 uppercase tracking-wide">School Facilities Enrolment</span>
                  <div className="grid grid-cols-2 gap-6">

                    {/* Transport */}
                    <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">Enrol Transport / Bus Route</span>
                        <button
                          type="button"
                          onClick={() => setField('transport_required', !form.transport_required)}
                          className={`relative inline-flex h-5 w-10 items-center justify-start rounded-full transition-colors cursor-pointer border-none outline-none p-0.5 ${!!form.transport_required ? 'bg-blue-600' : 'bg-gray-200'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${!!form.transport_required ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                      {!!form.transport_required && (
                        <div className="grid grid-cols-2 gap-2 animate-fade">
                          <input maxLength={255} placeholder="Route Name" value={form.transport_route} onChange={e => setField('transport_route', e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-xs outline-none bg-white text-gray-700" />
                          <input maxLength={255} placeholder="Pickup point" value={form.pickup_point} onChange={e => setField('pickup_point', e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-xs outline-none bg-white text-gray-700" />
                        </div>
                      )}
                    </div>

                    {/* Hostel */}
                    <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">Enrol Hostel Lodging</span>
                        <button
                          type="button"
                          onClick={() => setField('hostel_required', !form.hostel_required)}
                          className={`relative inline-flex h-5 w-10 items-center justify-start rounded-full transition-colors cursor-pointer border-none outline-none p-0.5 ${!!form.hostel_required ? 'bg-blue-600' : 'bg-gray-200'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${!!form.hostel_required ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                      {!!form.hostel_required && (
                        <input maxLength={50} placeholder="Allocated Room No" value={form.room_number} onChange={e => setField('room_number', e.target.value)} className="border border-gray-200 w-full rounded px-2 py-1 text-xs outline-none bg-white text-gray-700 animate-fade" />
                      )}
                    </div>

                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Modal wizard footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-slate-50 flex justify-between items-center flex-shrink-0">
            {/* Prev Button */}
            <div>
              {activeWizardTab !== 'info' && (
                <button
                  type="button"
                  onClick={() => {
                    const idx = wizardTabs.findIndex(t => t.id === activeWizardTab);
                    if (idx > 0) setActiveWizardTab(wizardTabs[idx - 1].id);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white rounded text-gray-600 font-semibold hover:bg-gray-50 transition cursor-pointer"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
              )}
            </div>

            {/* Next / Save Buttons */}
            <div className="flex gap-2">
              <button type="button" className="px-4 py-1.5 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition cursor-pointer bg-white" onClick={() => navigate('/students/admission')}>Close</button>
              {activeWizardTab !== 'other' ? (
                <button
                  type="button"
                  onClick={() => {
                    const idx = wizardTabs.findIndex(t => t.id === activeWizardTab);
                    if (idx < wizardTabs.length - 1) setActiveWizardTab(wizardTabs[idx + 1].id);
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-sm cursor-pointer border-none outline-none"
                >
                  Next <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1 px-4 py-1.5 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition shadow cursor-pointer border-none outline-none disabled:opacity-50"
                >
                  <ShieldCheck size={14} /> {saving ? 'Submitting…' : 'Save Admission'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Field helper ──────────────────────────────────────────────────────────────
function Field({ label, err, children, cls = '' }: { label: string; err?: string; children: React.ReactNode; cls?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${cls}`}>
      <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">{label}</label>
      {children}
      {err && <span className="text-[9.5px] text-red-500 font-semibold">{err}</span>}
    </div>
  );
}

function fCls(err?: string) {
  return `w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white text-gray-700 ${err ? 'border-red-400 focus:ring-red-400' : 'border-gray-200'
    }`;
}
