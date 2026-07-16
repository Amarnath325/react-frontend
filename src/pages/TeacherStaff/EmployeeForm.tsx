import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../services/api';

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */
interface Employee {
  id: number;
  employee_id: string;
  qualification: string;
  specialization: string;
  experience_years: number;
  joining_date: string;
  department: string;
  salary: number;
  is_class_teacher: boolean;
  assigned_class_id: number | null;
  assigned_class_name: string | null;
  is_active: boolean;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
    gender: string;
    date_of_birth: string;
    address: string;
    is_active: boolean;
  };
}

interface FormState {
  // 1. Personal
  employee_code: string; employee_type: string; staff_category: string;
  first_name: string; middle_name: string; last_name: string;
  gender: string; date_of_birth: string; blood_group: string;
  marital_status: string; religion: string; nationality: string;
  aadhaar_no: string; pan_no: string; passport_no: string;
  father_name: string; mother_name: string; spouse_name: string;
  mobile: string; alternate_mobile: string; email: string;
  username: string; status: string;
  // 2. Contact
  whatsapp: string; alternate_email: string; office_phone: string; emergency_phone: string;
  // 3. Address
  current_address: string; permanent_address: string; state: string;
  district: string; city: string; taluka: string; village: string; pincode: string;
  // 4. Employment
  branch: string; department: string; designation: string;
  employee_role: string; reporting_manager: string; joining_date: string;
  confirmation_date: string; probation: string; employment_type: string;
  shift: string; work_location: string; experience: string;
  employee_status: string; is_class_teacher: boolean;
  // 5. Qualification
  degree: string; university: string; board: string;
  passing_year: string; percentage: string; specialization: string;
  // 6. Experience
  prev_school: string; prev_company: string; prev_designation: string;
  exp_from: string; exp_to: string; exp_years: string; exp_salary: string;
  // 7. Bank
  account_holder: string; bank_name: string; bank_branch: string;
  account_number: string; ifsc: string; upi_id: string;
  // 8. Govt Docs
  aadhaar: string; pan: string; passport: string;
  driving_licence: string; voter_id: string; esic: string; pf_number: string;
  // 9. Salary
  salary_employee_id: string; salary_structure: string; basic_salary: string;
  gross_salary: string; allowances: string; deductions: string;
  pf: string; esi: string; tds: string;
  // 10. Emergency Contact
  contact_person: string; relation: string; emg_mobile: string;
  emg_alt_mobile: string; emg_address: string;
  // 11. Login Access
  login_username: string; password: string; user_role: string;
  login_permission: boolean; is_active: boolean;
  // 12. Other Info
  remarks: string; skills: string; languages_known: string; hobbies: string;
  // 13. Documents - file names stored
  doc_resume: string; doc_appointment: string; doc_degree: string;
  doc_experience: string; doc_aadhaar: string; doc_pan: string;
  doc_passport: string; doc_police: string; doc_medical: string; doc_other: string;
}

const EMPTY: FormState = {
  employee_code:'', employee_type:'', staff_category:'', first_name:'', middle_name:'',
  last_name:'', gender:'', date_of_birth:'', blood_group:'', marital_status:'',
  religion:'', nationality:'Indian', aadhaar_no:'', pan_no:'', passport_no:'',
  father_name:'', mother_name:'', spouse_name:'', mobile:'', alternate_mobile:'',
  email:'', username:'', status:'Active',
  whatsapp:'', alternate_email:'', office_phone:'', emergency_phone:'',
  current_address:'', permanent_address:'', state:'', district:'', city:'',
  taluka:'', village:'', pincode:'',
  branch:'', department:'', designation:'', employee_role:'', reporting_manager:'',
  joining_date:'', confirmation_date:'', probation:'', employment_type:'', shift:'',
  work_location:'', experience:'', employee_status:'Active', is_class_teacher: false,
  degree:'', university:'', board:'', passing_year:'', percentage:'', specialization:'',
  prev_school:'', prev_company:'', prev_designation:'', exp_from:'', exp_to:'',
  exp_years:'', exp_salary:'',
  account_holder:'', bank_name:'', bank_branch:'', account_number:'', ifsc:'', upi_id:'',
  aadhaar:'', pan:'', passport:'', driving_licence:'', voter_id:'', esic:'', pf_number:'',
  salary_employee_id:'', salary_structure:'', basic_salary:'', gross_salary:'', allowances:'', deductions:'',
  pf:'', esi:'', tds:'',
  contact_person:'', relation:'', emg_mobile:'', emg_alt_mobile:'', emg_address:'',
  login_username:'', password:'', user_role:'', login_permission:false, is_active:true,
  remarks:'', skills:'', languages_known:'', hobbies:'',
  doc_resume:'', doc_appointment:'', doc_degree:'', doc_experience:'', doc_aadhaar:'',
  doc_pan:'', doc_passport:'', doc_police:'', doc_medical:'', doc_other:''
};

const O = {
  employeeType: ['Regular', 'Contractual', 'Part-time', 'Guest Faculty'],
  staffCategory: ['Teaching', 'Non-Teaching', 'Administrative', 'Support Staff'],
  gender: ['Male', 'Female', 'Other'],
  bloodGroup: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
  maritalStatus: ['Single', 'Married', 'Divorced', 'Widowed'],
  branch: ['Main Campus', 'Primary Wing', 'Secondary Wing'],
  department: ['Science', 'English', 'Mathematics', 'Administration', 'Social Studies', 'Hindi', 'Sanskrit', 'Physical Education', 'Computer Science', 'Art & Craft', 'Music & Dance', 'Other'],
  designation: ['HOD', 'Senior Teacher', 'Teacher', 'Lab Assistant', 'Librarian', 'Clerk', 'Accountant', 'Registrar', 'Principal', 'Vice Principal', 'Coordinator'],
  employeeRole: ['Admin', 'Teacher', 'Staff', 'Superadmin'],
  employmentType: ['Full-Time', 'Part-Time', 'On Contract'],
  shift: ['Morning Shift', 'Afternoon Shift', 'General Shift'],
  salaryStruct: ['Monthly Consolidated', 'Hourly Rate', 'Contractual', 'Daily Wages'],
  relation: ['Father', 'Mother', 'Spouse', 'Brother', 'Sister', 'Guardian', 'Other'],
  userRole: ['teacher', 'staff', 'admin']
};

const TABS = [
  { id:'personal',   icon:'👤', label:'Personal Details'  },
  { id:'contact',    icon:'📞', label:'Contact Info'      },
  { id:'address',    icon:'🏠', label:'Address Details'   },
  { id:'employment', icon:'💼', label:'Employment Info'   },
  { id:'qualification',icon:'🎓',label:'Qualifications'   },
  { id:'experience', icon:'⏳', label:'Work Experience'   },
  { id:'bank',       icon:'🏦', label:'Bank Account'      },
  { id:'govt',       icon:'🏢', label:'Govt Documents'    },
  { id:'salary',     icon:'💵', label:'Salary Structure'  },
  { id:'emergency',  icon:'🚨', label:'Emergency Contacts'},
  { id:'other',      icon:'📝', label:'Other Details'     },
  { id:'documents',  icon:'📁', label:'Document Upload'   },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.em-root{font-family:'Inter',sans-serif;background:#f8fafc;color:#1e293b;padding:8px 12px}

/* buttons */
.em-btn{padding:7px 14px;border-radius:6px;border:none;cursor:pointer;font-size:.8rem;font-weight:600;font-family:inherit;transition:all .2s;display:flex;align-items:center;gap:6px}
.em-btn-primary{background:#2563eb;color:#fff;box-shadow:0 1px 2px 0 rgba(0,0,0,.05)}
.em-btn-primary:hover{background:#1d4ed8;box-shadow:0 4px 12px rgba(37,99,235,.2)}
.em-btn-ghost{background:#fff;color:#334155;border:1px solid #cbd5e1}
.em-btn-ghost:hover{background:#f1f5f9;border-color:#94a3b8}
.em-btn-danger{background:#fef2f2;color:#dc2626;border:1px solid #fecaca}
.em-btn-danger:hover{background:#fee2e2}
.em-btn-success{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
.em-btn-sm{padding:5px 10px;font-size:.72rem;border-radius:5px}
.em-btn:disabled{opacity:.5;cursor:not-allowed;transform:none!important}

/* FORM LAYOUT - NO SCROLL COMPACT */
.em-page-content{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px;box-shadow:0 1px 3px rgba(0,0,0,.03)}
@media(max-width:600px){.em-page-content{padding:10px}}

.em-form-body{flex:1}
.em-page-footer{padding-top:8px;margin-top:8px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}

/* tabs grid for 2 rows */
.em-tabs-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;background:#f1f5f9;padding:6px;border-radius:10px;margin-bottom:12px;border:1px solid #cbd5e1;box-shadow:0 1px 2px rgba(0,0,0,.02)}
@media(max-width:980px){.em-tabs-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(max-width:640px){.em-tabs-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}

/* Beautiful tab buttons */
.em-htab{display:flex;align-items:center;justify-content:center;gap:6px;padding:7px 10px;border-radius:6px;border:1px solid transparent;background:transparent;color:#475569;font-size:.73rem;font-weight:600;font-family:inherit;cursor:pointer;transition:all .15s ease;min-width:0}
.em-htab:hover{background:#cbd5e1;color:#0f172a}
.em-htab.active{background:#fff;color:#2563eb;border-color:#cbd5e1;border-bottom:2.5px solid #2563eb;font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.em-htab-num{color:#94a3b8;font-size:.68rem;font-weight:700}
.em-htab.active .em-htab-num{color:#2563eb}
.em-htab-badge{margin-left:2px;background:#fee2e2;color:#dc2626;border-radius:9999px;font-size:.62rem;padding:0 5px;font-weight:700}
.em-htab-txt{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}

/* section heading */
.em-sec{font-size:.74rem;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:.05em;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:6px}

/* compact grid gaps */
.g1{display:grid;grid-template-columns:1fr;gap:6px 10px;margin-bottom:6px}
.g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 10px;margin-bottom:6px}
.g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px 10px;margin-bottom:6px}
.g4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px 10px;margin-bottom:6px}
@media(max-width:1100px){.g4{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:800px){.g3,.g4{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:550px){.g2,.g3,.g4{grid-template-columns:1fr}}

/* compact field */
.fld{display:flex;flex-direction:column;gap:2px;width:100%}
.flbl{font-size:.72rem;color:#334155;font-weight:600}
.flbl span{color:#dc2626;margin-left:2px}
.finp,.fsel,.ftxt{padding:4px 8px;background:#fff;border:1px solid #cbd5e1;border-radius:5px;color:#0f172a;font-size:.78rem;font-family:inherit;outline:none;transition:border-color .15s,box-shadow .15s;width:100%;height:30px}
.finp:focus,.fsel:focus,.ftxt:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.15)}
.ftxt{resize:vertical;height:auto;min-height:44px}
.finp::placeholder,.ftxt::placeholder{color:#94a3b8}
.ferr{font-size:.7rem;color:#dc2626;margin-top:1px;font-weight:500}
.fld-err .finp,.fld-err .fsel{border-color:#ef4444;background:#fef2f2}

/* toggle */
.tgl-row{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:10px}
.tgl-info{font-size:.8rem;color:#0f172a;font-weight:600}
.tgl-sub{font-size:.7rem;color:#64748b;margin-top:1px}
.tgl{position:relative;width:38px;height:20px;flex-shrink:0}
.tgl input{opacity:0;width:0;height:0}
.tgl-sl{position:absolute;inset:0;background:#cbd5e1;border-radius:20px;cursor:pointer;transition:.3s}
.tgl-sl::before{content:'';position:absolute;width:14px;height:14px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.3s;box-shadow:0 1px 2px rgba(0,0,0,.2)}
.tgl input:checked+.tgl-sl{background:#2563eb}
.tgl input:checked+.tgl-sl::before{transform:translateX(18px)}

/* doc upload row */
.doc-row{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:8px;gap:10px;flex-wrap:wrap}
.doc-name{font-size:.8rem;color:#1e293b;font-weight:600;flex:1;min-width:180px}
.doc-status{font-size:.72rem}
.doc-status.uploaded{color:#16a34a;font-weight:600}
.doc-status.pending{color:#64748b}
.doc-input{display:none}
.doc-btn{padding:6px 12px;border-radius:6px;border:1px dashed #3b82f6;background:#eff6ff;color:#2563eb;font-size:.74rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s;white-space:nowrap}
.doc-btn:hover{background:#dbeafe;border-color:#2563eb}

/* alert */
.em-alert{padding:10px 14px;border-radius:8px;margin-bottom:14px;font-size:.8rem;font-weight:600;display:flex;align-items:center;gap:8px}
.em-alert-err{background:#fef2f2;border:1px solid #fecaca;color:#991b1b}
.em-alert-ok{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534}

/* loader */
.em-loader{display:flex;align-items:center;justify-content:center;min-height:200px}
.em-spin{width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#2563eb;border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* view profile details */
.vw-hdr{display:flex;align-items:center;gap:16px;margin-bottom:18px;padding:16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;flex-wrap:wrap}
.vw-avatar{width:56px;height:56px;border-radius:50%;background:#eff6ff;color:#2563eb;display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:800;flex-shrink:0;border:2px solid #bfdbfe}
.vw-name{font-size:1.15rem;font-weight:800;color:#0f172a}
.vw-sub{font-size:.8rem;color:#64748b;margin-top:2px}
.vw-chips{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.vw-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
@media(max-width:650px){.vw-grid{grid-template-columns:1fr}}
.vw-item{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px}
.vw-lbl{font-size:.66rem;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:.04em;margin-bottom:3px}
.vw-val{font-size:.82rem;color:#0f172a;font-weight:600}
`;

function Fld({ label, req, err, children }: { label: string; req?: boolean; err?: string; children: React.ReactNode }) {
  return (
    <div className={`fld ${err ? 'fld-err' : ''}`}>
      <label className="flbl">{label}{req && <span>*</span>}</label>
      {children}
      {err && <div className="ferr">⚠ {err}</div>}
    </div>
  );
}

function Inp({ value, onChange, placeholder, type = 'text', disabled }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean;
}) {
  return <input className="finp" type={type} value={value} placeholder={placeholder}
    disabled={disabled} onChange={e => onChange(e.target.value)} />;
}

function Sel({ value, onChange, opts, placeholder = 'Select...' }: {
  value: string; onChange: (v: string) => void; opts: string[]; placeholder?: string;
}) {
  return (
    <select className="fsel" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Tgl({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="tgl-row">
      <div>
        <div className="tgl-info">{label}</div>
        {sub && <div className="tgl-sub">{sub}</div>}
      </div>
      <label className="tgl">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="tgl-sl" />
      </label>
    </div>
  );
}

export default function EmployeeForm({ mode: defaultMode }: { mode?: 'add' | 'edit' | 'view' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: paramId } = useParams();

  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [alert, setAlert]         = useState<{ type: 'err' | 'ok'; msg: string } | null>(null);

  const [viewMode, setViewMode]   = useState<'add' | 'edit' | 'view'>(defaultMode || 'add');
  const [selected, setSelected]   = useState<Employee | null>(null);
  const [form, setForm]           = useState<FormState>(EMPTY);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('personal');

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlert = useCallback((type: 'err' | 'ok', msg: string) => {
    setAlert({ type, msg }); clearTimeout(timer.current);
    timer.current = setTimeout(() => setAlert(null), 4500);
  }, []);

  const fetchEmployee = useCallback(async () => {
    if (!paramId) return;
    setLoading(true);
    try {
      const res = await api.get('/school/teachers');
      if (res.data.success) {
        const emp = (res.data.data || []).find((e: any) => String(e.id) === String(paramId));
        if (emp) {
          setSelected(emp);
          const u = emp.user || {};
          setForm({
            ...EMPTY,
            employee_code: emp.employee_id || '',
            first_name: u.first_name || '',
            last_name: u.last_name || '',
            email: u.email || '',
            mobile: u.mobile || '',
            gender: u.gender || '',
            date_of_birth: u.date_of_birth ? u.date_of_birth.slice(0, 10) : '',
            current_address: u.address || '',
            department: emp.department || '',
            degree: emp.qualification || '',
            specialization: emp.specialization || '',
            experience: emp.experience_years != null ? String(emp.experience_years) : '',
            joining_date: emp.joining_date ? emp.joining_date.slice(0, 10) : '',
            basic_salary: emp.salary != null ? String(emp.salary) : '',
            is_class_teacher: emp.is_class_teacher || false,
            is_active: emp.is_active != null ? emp.is_active : true,
          });
        } else {
          showAlert('err', 'Employee not found');
        }
      }
    } catch {
      showAlert('err', 'Failed to load employee details');
    } finally {
      setLoading(false);
    }
  }, [paramId, showAlert]);

  useEffect(() => {
    if (location.pathname.includes('/add')) {
      setViewMode('add'); setForm(EMPTY); setFormErrors({}); setActiveTab('personal'); setSelected(null);
    } else if (location.pathname.includes('/edit/') && paramId) {
      setViewMode('edit'); fetchEmployee();
    } else if (location.pathname.includes('/view/') && paramId) {
      setViewMode('view'); fetchEmployee();
    }
  }, [location.pathname, paramId, fetchEmployee]);

  const sf = (k: keyof FormState, v: any) => {
    setForm(p => ({ ...p, [k]: v }));
    if (formErrors[k]) setFormErrors(p => { const c = { ...p }; delete c[k]; return c; });
  };

  const closeToListView = () => {
    navigate('/teachers/employee-master');
  };

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!form.employee_code.trim()) errs.employee_code = 'Employee Code is required';
    if (!form.first_name.trim()) errs.first_name = 'First Name is required';
    if (!form.email.trim()) errs.email = 'Email Address is required';
    if (!form.mobile.trim()) errs.mobile = 'Mobile Number is required';

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs); showAlert('err', 'Please fill required fields'); return;
    }

    setSaving(true);
    try {
      const payload = {
        user_data: {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          mobile: form.mobile,
          gender: form.gender,
          date_of_birth: form.date_of_birth || null,
          address: form.current_address || form.permanent_address || '',
          is_active: form.is_active,
        },
        teacher_data: {
          employee_id: form.employee_code,
          qualification: form.degree,
          specialization: form.specialization,
          experience_years: parseInt(form.experience) || 0,
          joining_date: form.joining_date || null,
          department: form.department,
          salary: parseFloat(form.basic_salary) || 0,
          is_class_teacher: form.is_class_teacher,
          is_active: form.is_active,
        }
      };

      const res = viewMode === 'add'
        ? await api.post('/school/teachers', payload)
        : await api.put(`/school/teachers/${selected?.id}`, payload);

      if (res.data.success) {
        showAlert('ok', viewMode === 'add' ? 'Registered successfully' : 'Updated successfully');
        setTimeout(() => closeToListView(), 1000);
      }
    } catch (e: any) {
      showAlert('err', e.response?.data?.message || 'Failed to save details');
    } finally {
      setSaving(false);
    }
  };

  const tabIdx = TABS.findIndex(t => t.id === activeTab);

  // Compute validation errors per tab
  const tabsWithErrors: Record<string, boolean> = {};
  if (formErrors.employee_code || formErrors.first_name) tabsWithErrors.personal = true;
  if (formErrors.email || formErrors.mobile) tabsWithErrors.contact = true;

  // Calculation of percentage completed
  const filledFields = Object.keys(EMPTY).filter(k => {
    const val = form[k as keyof FormState];
    if (typeof val === 'boolean') return val;
    return val && String(val).trim() !== '';
  }).length;
  const pct = Math.min(100, Math.round((filledFields / Object.keys(EMPTY).length) * 100));

  const renderTab = () => {
    switch (activeTab) {
      case 'personal':
      return (
        <div>
          <div className="g3">
            <Fld label="Employee Code (ID)" req err={formErrors.employee_code}>
              <Inp value={form.employee_code} onChange={v => sf('employee_code', v)} placeholder="e.g. EMP001" />
            </Fld>
            <Fld label="Employee Type">
              <Sel value={form.employee_type} onChange={v => sf('employee_type', v)} opts={O.employeeType} />
            </Fld>
            <Fld label="Staff Category">
              <Sel value={form.staff_category} onChange={v => sf('staff_category', v)} opts={O.staffCategory} />
            </Fld>
          </div>
          <div className="g3">
            <Fld label="First Name" req err={formErrors.first_name}>
              <Inp value={form.first_name} onChange={v => sf('first_name', v)} placeholder="First Name" />
            </Fld>
            <Fld label="Middle Name">
              <Inp value={form.middle_name} onChange={v => sf('middle_name', v)} placeholder="Middle Name" />
            </Fld>
            <Fld label="Last Name">
              <Inp value={form.last_name} onChange={v => sf('last_name', v)} placeholder="Last Name" />
            </Fld>
          </div>
          <div className="g3">
            <Fld label="Gender">
              <Sel value={form.gender} onChange={v => sf('gender', v)} opts={O.gender} />
            </Fld>
            <Fld label="Date of Birth">
              <Inp type="date" value={form.date_of_birth} onChange={v => sf('date_of_birth', v)} />
            </Fld>
            <Fld label="Blood Group">
              <Sel value={form.blood_group} onChange={v => sf('blood_group', v)} opts={O.bloodGroup} />
            </Fld>
          </div>
          <div className="g3">
            <Fld label="Marital Status">
              <Sel value={form.marital_status} onChange={v => sf('marital_status', v)} opts={O.maritalStatus} />
            </Fld>
            <Fld label="Religion">
              <Inp value={form.religion} onChange={v => sf('religion', v)} placeholder="e.g. Hindu, Muslim, Christian" />
            </Fld>
            <Fld label="Nationality">
              <Inp value={form.nationality} onChange={v => sf('nationality', v)} placeholder="Indian" />
            </Fld>
          </div>
        </div>
      );

      case 'contact':
      return (
        <div>
          <div className="g3">
            <Fld label="Mobile Number" req err={formErrors.mobile}>
              <Inp value={form.mobile} onChange={v => sf('mobile', v)} placeholder="10-digit mobile" />
            </Fld>
            <Fld label="Alternate Mobile">
              <Inp value={form.alternate_mobile} onChange={v => sf('alternate_mobile', v)} placeholder="Secondary phone" />
            </Fld>
            <Fld label="Email Address" req err={formErrors.email}>
              <Inp type="email" value={form.email} onChange={v => sf('email', v)} placeholder="official@school.com" />
            </Fld>
          </div>
          <div className="g3">
            <Fld label="Alternate Email">
              <Inp type="email" value={form.alternate_email} onChange={v => sf('alternate_email', v)} placeholder="personal@email.com" />
            </Fld>
            <Fld label="WhatsApp Number">
              <Inp value={form.whatsapp} onChange={v => sf('whatsapp', v)} placeholder="WhatsApp number" />
            </Fld>
            <Fld label="Office Phone">
              <Inp value={form.office_phone} onChange={v => sf('office_phone', v)} placeholder="Extension or Landline" />
            </Fld>
          </div>
        </div>
      );

      case 'address':
      return (
        <div>
          <div className="g2">
            <Fld label="Current Residential Address">
              <textarea className="ftxt" value={form.current_address}
                onChange={e => sf('current_address', e.target.value)} placeholder="Full current address..." />
            </Fld>
            <Fld label="Permanent Address">
              <textarea className="ftxt" value={form.permanent_address}
                onChange={e => sf('permanent_address', e.target.value)} placeholder="Full permanent address..." />
            </Fld>
          </div>
          <div className="g4">
            <Fld label="State">
              <Inp value={form.state} onChange={v => sf('state', v)} placeholder="e.g. Maharashtra" />
            </Fld>
            <Fld label="District">
              <Inp value={form.district} onChange={v => sf('district', v)} placeholder="District" />
            </Fld>
            <Fld label="City">
              <Inp value={form.city} onChange={v => sf('city', v)} placeholder="City / Town" />
            </Fld>
            <Fld label="Pincode">
              <Inp value={form.pincode} onChange={v => sf('pincode', v)} placeholder="6-digit ZIP code" />
            </Fld>
          </div>
        </div>
      );

      case 'employment':
      return (
        <div>
          <div className="g3">
            <Fld label="Institution Branch">
              <Sel value={form.branch} onChange={v => sf('branch', v)} opts={O.branch} />
            </Fld>
            <Fld label="Department">
              <Sel value={form.department} onChange={v => sf('department', v)} opts={O.department} />
            </Fld>
            <Fld label="Designation">
              <Sel value={form.designation} onChange={v => sf('designation', v)} opts={O.designation} />
            </Fld>
          </div>
          <div className="g3">
            <Fld label="Employee Role">
              <Sel value={form.employee_role} onChange={v => sf('employee_role', v)} opts={O.employeeRole} />
            </Fld>
            <Fld label="Reporting Manager">
              <Inp value={form.reporting_manager} onChange={v => sf('reporting_manager', v)} placeholder="Manager's Name" />
            </Fld>
            <Fld label="Date of Joining">
              <Inp type="date" value={form.joining_date} onChange={v => sf('joining_date', v)} />
            </Fld>
          </div>
          <div className="g3">
            <Fld label="Employment Type">
              <Sel value={form.employment_type} onChange={v => sf('employment_type', v)} opts={O.employmentType} />
            </Fld>
            <Fld label="Work Shift">
              <Sel value={form.shift} onChange={v => sf('shift', v)} opts={O.shift} />
            </Fld>
            <Fld label="Work Location">
              <Inp value={form.work_location} onChange={v => sf('work_location', v)} placeholder="Main Building, Lab, etc." />
            </Fld>
          </div>
          <div className="g2">
            <Fld label="Total Past Experience (Years)">
              <Inp value={form.experience} onChange={v => sf('experience', v)} placeholder="e.g. 5" />
            </Fld>
            <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: 20 }}>
              <Tgl label="Class Teacher Responsibility" checked={form.is_class_teacher} onChange={v => sf('is_class_teacher', v)} />
            </div>
          </div>
        </div>
      );

      case 'qualification':
      return (
        <div>
          <div className="g3">
            <Fld label="Highest Degree / Qualification">
              <Inp value={form.degree} onChange={v => sf('degree', v)} placeholder="e.g. M.Sc Chemistry" />
            </Fld>
            <Fld label="University / College">
              <Inp value={form.university} onChange={v => sf('university', v)} placeholder="University Name" />
            </Fld>
            <Fld label="Board / Institution">
              <Inp value={form.board} onChange={v => sf('board', v)} placeholder="Board Name" />
            </Fld>
          </div>
          <div className="g3">
            <Fld label="Passing Year">
              <Inp value={form.passing_year} onChange={v => sf('passing_year', v)} placeholder="YYYY" />
            </Fld>
            <Fld label="Percentage / GPA">
              <Inp value={form.percentage} onChange={v => sf('percentage', v)} placeholder="e.g. 85%" />
            </Fld>
            <Fld label="Specialization Subject">
              <Inp value={form.specialization} onChange={v => sf('specialization', v)} placeholder="e.g. Physical Chemistry" />
            </Fld>
          </div>
        </div>
      );

      case 'experience':
      return (
        <div>
          <div className="g3">
            <Fld label="Previous Institution / School">
              <Inp value={form.prev_school} onChange={v => sf('prev_school', v)} placeholder="Name of School" />
            </Fld>
            <Fld label="Previous Designation">
              <Inp value={form.prev_designation} onChange={v => sf('prev_designation', v)} placeholder="Role title" />
            </Fld>
            <Fld label="Experience from Date">
              <Inp type="date" value={form.exp_from} onChange={v => sf('exp_from', v)} />
            </Fld>
          </div>
          <div className="g3">
            <Fld label="Experience to Date">
              <Inp type="date" value={form.exp_to} onChange={v => sf('exp_to', v)} />
            </Fld>
            <Fld label="Experience Years">
              <Inp value={form.exp_years} onChange={v => sf('exp_years', v)} placeholder="Years in decimals or round" />
            </Fld>
            <Fld label="Last Drawn Salary (₹)">
              <Inp value={form.exp_salary} onChange={v => sf('exp_salary', v)} placeholder="Monthly Salary" />
            </Fld>
          </div>
        </div>
      );

      case 'bank':
      return (
        <div>
          <div className="g3">
            <Fld label="Account Holder Name">
              <Inp value={form.account_holder} onChange={v => sf('account_holder', v)} placeholder="Name as per Passbook" />
            </Fld>
            <Fld label="Bank Name">
              <Inp value={form.bank_name} onChange={v => sf('bank_name', v)} placeholder="SBI, HDFC, ICICI, etc." />
            </Fld>
            <Fld label="Bank Branch Name">
              <Inp value={form.bank_branch} onChange={v => sf('bank_branch', v)} placeholder="Branch location" />
            </Fld>
          </div>
          <div className="g3">
            <Fld label="Bank Account Number">
              <Inp value={form.account_number} onChange={v => sf('account_number', v)} placeholder="Account No" />
            </Fld>
            <Fld label="IFSC Code">
              <Inp value={form.ifsc} onChange={v => sf('ifsc', v)} placeholder="11-digit IFSC" />
            </Fld>
            <Fld label="UPI ID / Address">
              <Inp value={form.upi_id} onChange={v => sf('upi_id', v)} placeholder="username@upi" />
            </Fld>
          </div>
        </div>
      );

      case 'govt':
      return (
        <div>
          <div className="g4">
            <Fld label="Aadhaar Card Number">
              <Inp value={form.aadhaar} onChange={v => sf('aadhaar', v)} placeholder="12-digit Aadhaar No" />
            </Fld>
            <Fld label="PAN Card Number">
              <Inp value={form.pan} onChange={v => sf('pan', v)} placeholder="10-digit PAN" />
            </Fld>
            <Fld label="Passport Number">
              <Inp value={form.passport} onChange={v => sf('passport', v)} placeholder="Passport No" />
            </Fld>
            <Fld label="Driving Licence Number">
              <Inp value={form.driving_licence} onChange={v => sf('driving_licence', v)} placeholder="DL Number" />
            </Fld>
          </div>
          <div className="g3">
            <Fld label="Voter ID Card Number">
              <Inp value={form.voter_id} onChange={v => sf('voter_id', v)} placeholder="EPIC / Voter ID No" />
            </Fld>
            <Fld label="ESIC Account Number">
              <Inp value={form.esic} onChange={v => sf('esic', v)} placeholder="Employee ESIC number" />
            </Fld>
            <Fld label="PF Account / UAN Number">
              <Inp value={form.pf_number} onChange={v => sf('pf_number', v)} placeholder="Provident Fund / UAN No" />
            </Fld>
          </div>
        </div>
      );

      case 'salary':
      return (
        <div>
          <div className="g4">
            <Fld label="Employee ID (Payroll Ref)">
              <Inp value={form.salary_employee_id} onChange={v => sf('salary_employee_id', v)} placeholder="EMP001" />
            </Fld>
            <Fld label="Salary Structure Type">
              <Sel value={form.salary_structure} onChange={v => sf('salary_structure', v)} opts={O.salaryStruct} />
            </Fld>
            <Fld label="Basic Salary (₹)">
              <Inp type="number" value={form.basic_salary} onChange={v => sf('basic_salary', v)} placeholder="30000" />
            </Fld>
            <Fld label="Gross Salary (₹)">
              <Inp type="number" value={form.gross_salary} onChange={v => sf('gross_salary', v)} placeholder="45000" />
            </Fld>
          </div>
          <div className="g4">
            <Fld label="Monthly Allowances (₹)">
              <Inp type="number" value={form.allowances} onChange={v => sf('allowances', v)} placeholder="8000" />
            </Fld>
            <Fld label="Total Deductions (₹)">
              <Inp type="number" value={form.deductions} onChange={v => sf('deductions', v)} placeholder="3000" />
            </Fld>
            <Fld label="PF Contribution (₹)">
              <Inp type="number" value={form.pf} onChange={v => sf('pf', v)} placeholder="1800" />
            </Fld>
            <Fld label="ESI Contribution (₹)">
              <Inp type="number" value={form.esi} onChange={v => sf('esi', v)} placeholder="750" />
            </Fld>
          </div>
          <div className="g2">
            <Fld label="Monthly TDS Deduction (₹)">
              <Inp type="number" value={form.tds} onChange={v => sf('tds', v)} placeholder="0" />
            </Fld>
          </div>
        </div>
      );

      case 'emergency':
      return (
        <div>
          <div className="g4">
            <Fld label="Contact Person Full Name">
              <Inp value={form.contact_person} onChange={v => sf('contact_person', v)} placeholder="Full name of contact" />
            </Fld>
            <Fld label="Relation with Employee">
              <Sel value={form.relation} onChange={v => sf('relation', v)} opts={O.relation} />
            </Fld>
            <Fld label="Emergency Mobile Number">
              <Inp value={form.emg_mobile} onChange={v => sf('emg_mobile', v)} placeholder="Primary emergency phone" />
            </Fld>
            <Fld label="Alternate Mobile Number">
              <Inp value={form.emg_alt_mobile} onChange={v => sf('emg_alt_mobile', v)} placeholder="Secondary contact number" />
            </Fld>
          </div>
          <div className="g1">
            <Fld label="Contact Person Residential Address">
              <textarea className="ftxt" value={form.emg_address}
                onChange={e => sf('emg_address', e.target.value)} placeholder="Full address of emergency contact person..." />
            </Fld>
          </div>
        </div>
      );

      case 'other':
      return (
        <div>
          <div className="g2">
            <Fld label="Remarks / Special Notes">
              <textarea className="ftxt" value={form.remarks}
                onChange={e => sf('remarks', e.target.value)} placeholder="Internal notes, health remarks, or administrative notes..." />
            </Fld>
            <Fld label="Special Skills & Proficiencies">
              <textarea className="ftxt" value={form.skills}
                onChange={e => sf('skills', e.target.value)} placeholder="e.g. Smartboard teaching, Counseling, Sports coaching..." />
            </Fld>
          </div>
          <div className="g2">
            <Fld label="Languages Known">
              <Inp value={form.languages_known} onChange={v => sf('languages_known', v)} placeholder="e.g. Hindi, English, Sanskrit, Marathi" />
            </Fld>
            <Fld label="Hobbies & Interests">
              <Inp value={form.hobbies} onChange={v => sf('hobbies', v)} placeholder="e.g. Classical Music, Table Tennis, Reading" />
            </Fld>
          </div>
        </div>
      );

      case 'documents':
      return (
        <div>
          <div style={{ marginBottom: 12, fontSize: '.76rem', color: '#64748b' }}>
            Upload digital copies of employee certificates and identity proofs. Supported formats: PDF, JPG, PNG (Max 5 MB each).
          </div>
          <div className="g2" style={{ gap: '10px 14px' }}>
            {[
              { key: 'doc_resume',      label: 'Resume / Curriculum Vitae (CV)',   accept: '.pdf,.doc,.docx' },
              { key: 'doc_appointment', label: 'Official Appointment Letter',      accept: '.pdf,.jpg,.png' },
              { key: 'doc_degree',      label: 'Highest Degree Certificate',       accept: '.pdf,.jpg,.png' },
              { key: 'doc_experience',  label: 'Work Experience Certificate',      accept: '.pdf,.jpg,.png' },
              { key: 'doc_aadhaar',     label: 'Aadhaar Card Copy',                accept: '.pdf,.jpg,.png' },
              { key: 'doc_pan',         label: 'PAN Card Copy',                    accept: '.pdf,.jpg,.png' },
              { key: 'doc_passport',    label: 'Passport Copy (if applicable)',    accept: '.pdf,.jpg,.png' },
              { key: 'doc_police',      label: 'Police Verification Certificate',  accept: '.pdf,.jpg,.png' },
              { key: 'doc_medical',     label: 'Medical Fitness Certificate',      accept: '.pdf,.jpg,.png' },
              { key: 'doc_other',       label: 'Other Supplementary Documents',    accept: '*' },
            ].map(({ key, label, accept }) => {
              const val = form[key as keyof FormState] as string;
              return (
                <div key={key} className="doc-row" style={{ margin: 0, padding: '10px 14px' }}>
                  <span className="doc-name">📄 {label}</span>
                  <span className={`doc-status ${val ? 'uploaded' : 'pending'}`} style={{ fontSize: '.72rem' }}>
                    {val ? `✅ ${val.slice(0, 18)}...` : '⭕ Pending'}
                  </span>
                  <label className="doc-btn" style={{ padding: '5px 10px', fontSize: '.72rem' }} htmlFor={`file-${key}`}>
                    {val ? '🔄 Replace' : '📤 Upload'}
                  </label>
                  <input id={`file-${key}`} className="doc-input" type="file" accept={accept}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) sf(key as keyof FormState, f.name);
                    }} />
                </div>
              );
            })}
          </div>
        </div>
      );

      default: return null;
    }
  };

  if (loading) {
    return (
      <>
        <style>{CSS}</style>
        <div className="em-root">
          <div className="em-loader"><div className="em-spin" /></div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="em-root">
        {alert && (
          <div className={`em-alert ${alert.type === 'err' ? 'em-alert-err' : 'em-alert-ok'}`}>
            {alert.type === 'err' ? '❌' : '✅'} {alert.msg}
          </div>
        )}

        {/* ════════════ VIEW MODE: ADD / EDIT (FULL PAGE EXPERIENCE) ════════════ */}
        {(viewMode === 'add' || viewMode === 'edit') && (
          <div className="em-fullpage-form">
            {/* Top row with Back button and Completed % in the same row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <button className="em-btn em-btn-ghost em-btn-sm" onClick={closeToListView}>
                ← Back to List
              </button>
              <span style={{ fontSize: '.76rem', color: '#475569', fontWeight: 700 }}>
                Completed: <strong style={{ color: '#2563eb' }}>{pct}%</strong>
              </span>
            </div>

            {/* 12-Tab Top Grid Navigation Bar (2 Rows) */}
            <div className="em-tabs-grid">
              {TABS.map((tab) => (
                <button key={tab.id}
                  className={`em-htab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}>
                  <span>{tab.icon}</span>
                  <span className="em-htab-txt" title={tab.label}>{tab.label}</span>
                  {tabsWithErrors[tab.id] && <span className="em-htab-badge" title="Validation error on this tab">!</span>}
                </button>
              ))}
            </div>

            {/* Form Container Card */}
            <div className="em-page-content">
              <div className="em-form-body">
                {renderTab()}
              </div>

              {/* Card Footer Navigation */}
              <div className="em-page-footer">
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="em-btn em-btn-ghost"
                    disabled={tabIdx === 0}
                    onClick={() => {
                      if (tabIdx > 0) setActiveTab(TABS[tabIdx - 1].id);
                    }}>
                    ← Previous
                  </button>
                  <button className="em-btn em-btn-ghost"
                    disabled={tabIdx === TABS.length - 1}
                    onClick={() => {
                      if (tabIdx < TABS.length - 1) setActiveTab(TABS[tabIdx + 1].id);
                    }}>
                    Next →
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="em-btn em-btn-ghost" onClick={closeToListView} disabled={saving}>Discard</button>
                  <button className="em-btn em-btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? '⏳ Saving...' : viewMode === 'add' ? '✅ Save & Register' : '💾 Update Profile'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ VIEW MODE: DETAIL PROFILE VIEW (FULL PAGE) ════════════ */}
        {viewMode === 'view' && selected && (
          <div className="em-fullpage-view">
            <div className="em-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button className="em-btn em-btn-ghost" onClick={closeToListView}>
                  ← Back to Employee List
                </button>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    👁 Comprehensive Profile — {selected.user?.first_name} {selected.user?.last_name}
                  </h2>
                  <div style={{ fontSize: '.76rem', color: '#64748b', marginTop: 2 }}>Employee ID: {selected.employee_id} · Complete staff record profile view</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="em-btn em-btn-primary" onClick={() => navigate(`/teachers/employee-master/edit/${selected.id}`)}>
                  ✏️ Edit Profile
                </button>
              </div>
            </div>

            <div className="em-page-content">
              {/* Profile Card Banner */}
              <div className="vw-hdr">
                <div className="vw-avatar">
                  {`${selected.user?.first_name?.[0]??''}${selected.user?.last_name?.[0]??''}`.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="vw-name">{selected.user?.first_name} {selected.user?.last_name}</div>
                  <div className="vw-sub">Official Email: {selected.user?.email} · Primary Mobile: {selected.user?.mobile}</div>
                  <div className="vw-chips">
                    <span className={`chip ${selected.is_active ? 'chip-active' : 'chip-inactive'}`}>
                      {selected.is_active ? '● Active Employee' : '● Inactive Employee'}
                    </span>
                    <span className={`chip ${selected.is_class_teacher ? 'chip-ct' : 'chip-st'}`}>
                      {selected.is_class_teacher ? '🏫 Class Teacher Role' : '📖 Subject / Staff Role'}
                    </span>
                    {selected.department && <span className="chip chip-dept">Dept: {selected.department}</span>}
                  </div>
                </div>
              </div>

              <div className="em-sec"><span>👤</span> Personal Information Details</div>
              <div className="vw-grid">
                {[
                  ['First Name',    selected.user?.first_name],
                  ['Last Name',     selected.user?.last_name],
                  ['Email Address', selected.user?.email],
                  ['Mobile Number', selected.user?.mobile],
                  ['Gender',        selected.user?.gender],
                  ['Date of Birth', selected.user?.date_of_birth ? new Date(selected.user.date_of_birth).toLocaleDateString('en-IN') : '—'],
                  ['Residential Address', selected.user?.address],
                ].map(([l, v]) => (
                  <div key={l} className="vw-item">
                    <div className="vw-lbl">{l}</div>
                    <div className="vw-val">{v || '—'}</div>
                  </div>
                ))}
              </div>

              <div className="em-sec" style={{ marginTop: 12 }}><span>💼</span> Employment & Placement Details</div>
              <div className="vw-grid">
                {[
                  ['Employee Code / ID', selected.employee_id],
                  ['Department',         selected.department],
                  ['Highest Qualification', selected.qualification],
                  ['Subject Specialization',selected.specialization],
                  ['Total Experience',   `${selected.experience_years ?? 0} Years`],
                  ['Date of Joining',    selected.joining_date ? new Date(selected.joining_date).toLocaleDateString('en-IN') : '—'],
                  ['Monthly Salary',     selected.salary ? `₹${Number(selected.salary).toLocaleString('en-IN')} / Month` : '—'],
                  ['Assigned Class',     selected.assigned_class_name ?? '—'],
                ].map(([l, v]) => (
                  <div key={l} className="vw-item">
                    <div className="vw-lbl">{l}</div>
                    <div className="vw-val">{v || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
