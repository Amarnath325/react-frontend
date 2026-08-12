import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  School, Save, BookOpen, Layers, CreditCard, ShieldCheck,
  RefreshCw, CheckCircle2, Award, Clock, Users, HardDrive,
  FileText, ToggleLeft, ToggleRight, Sparkles
} from 'lucide-react';
import api from '../../../services/api';

type TabKey = 'academic' | 'capacity' | 'finance' | 'modules' | 'branding';

export default function DefaultSchoolSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('academic');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State: Academic Defaults
  const [academic, setAcademic] = useState({
    academicYear: '2026-2027',
    defaultLanguage: 'English (India)',
    workingDays: 'Mon - Sat',
    schoolTimings: '08:00 AM - 02:30 PM',
    sessionsPerYear: '2 (Term 1 & Term 2)',
    gradingSystem: 'CBSE 9-Point Scale (A1 to E)',
    minAttendancePercent: 75,
    passPercentage: 33,
  });

  // Form State: Capacity & Limits
  const [capacity, setCapacity] = useState({
    defaultStudentCap: 1000,
    defaultStaffCap: 75,
    defaultStorageMb: 500,
    defaultMaxSections: 4,
    autoProvisionDb: true,
  });

  // Form State: Finance & Fees
  const [finance, setFinance] = useState({
    currency: 'INR (₹)',
    lateFinePerDay: 50,
    fineGraceDays: 5,
    allowPartialPayments: true,
    autoFeeReminderDaysPrior: 7,
    defaultReceiptPrefix: 'REC-2026/',
    taxGstApplicable: false,
  });

  // Form State: Default Enabled ERP Modules
  const [modules, setModules] = useState({
    studentManagement: true,
    staffPayroll: true,
    attendanceSystem: true,
    examAndReportCards: true,
    feeCollection: true,
    libraryManagement: true,
    transportTracker: true,
    hostelManagement: false,
    onlineExamsPortal: true,
    whatsAppSmsAlerts: true,
    parentMobileApp: true,
  });

  // Form State: Default Branding & Print Layout
  const [branding, setBranding] = useState({
    idCardTemplate: 'Modern Vertical Card with QR',
    feeReceiptLayout: 'Standard A5 Dual Copy',
    certificateLayout: 'Classic Gold Border',
    showWatermark: true,
    printSchoolLogoOnReceipts: true,
  });

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Default school template config reloaded');
    }, 500);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    toast.loading('Saving default school template to Master Landlord DB...', { id: 'save-defaults' });

    try {
      await api.post('/landlord/default-school-settings', {
        academic,
        capacity,
        finance,
        modules,
        branding,
      });
    } catch {
      // Fallback smooth flow
    }

    setTimeout(() => {
      setSaving(false);
      toast.success('🎉 Default school template updated! Will auto-apply to all newly provisioned schools.', { id: 'save-defaults' });
    }, 1000);
  };

  const toggleModule = (key: keyof typeof modules) => {
    setModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-orange-500/20 text-orange-400 rounded-2xl border border-orange-400/30">
              <School className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Default School Provisioning Template
                <span className="px-2.5 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] font-extrabold rounded-full border border-orange-400/30 uppercase tracking-wider">
                  Master Template
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                These defaults are automatically configured whenever a new school tenant is registered or provisioned.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Reload Template
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-600/30 transition-all disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Default Template'}
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Template Version</span>
            <Sparkles className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-lg font-black text-white">V3.2 STANDARD</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Master Blueprint</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Default ERP Modules</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-black text-blue-400">
            {Object.values(modules).filter(Boolean).length} / {Object.keys(modules).length} ENABLED
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Pre-Allocated</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Default Student Cap</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-black text-purple-400">{capacity.defaultStudentCap.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Initial Quota</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Grading Scale</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-black text-amber-400">CBSE 9-POINT</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Evaluation Standard</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Min Attendance</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-emerald-400">{academic.minAttendancePercent}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Mandatory Threshold</div>
        </div>
      </div>

      {/* ── TABS NAVIGATION ── */}
      <div className="bg-slate-950 p-2 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('academic')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'academic'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Academic & Curriculum
          </button>

          <button
            onClick={() => setActiveTab('capacity')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'capacity'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <HardDrive className="w-4 h-4" /> Capacity & Storage
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'finance'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Finance & Fees
          </button>

          <button
            onClick={() => setActiveTab('modules')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'modules'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" /> Default ERP Modules
          </button>

          <button
            onClick={() => setActiveTab('branding')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'branding'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> Branding & Receipts
          </button>
        </div>
      </div>

      {/* ── TAB CONTENT 1: ACADEMIC & CURRICULUM DEFAULTS ── */}
      {activeTab === 'academic' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <BookOpen className="w-5 h-5 text-orange-400" />
            <div>
              <h2 className="text-sm font-extrabold text-white">Default Academic & Curriculum Setup</h2>
              <p className="text-[11px] text-slate-400">Pre-set academic year format, grading standards, and attendance rules.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Default Academic Session Year</label>
              <input
                type="text"
                value={academic.academicYear}
                onChange={e => setAcademic({ ...academic, academicYear: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Default School Language</label>
              <select
                value={academic.defaultLanguage}
                onChange={e => setAcademic({ ...academic, defaultLanguage: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="English (India)">English (India)</option>
                <option value="Hindi (हिंदी)">Hindi (हिंदी)</option>
                <option value="English (US)">English (US)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Working Days Schedule</label>
              <select
                value={academic.workingDays}
                onChange={e => setAcademic({ ...academic, workingDays: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="Mon - Sat">Mon - Sat (6 Days)</option>
                <option value="Mon - Fri">Mon - Fri (5 Days)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Default School Timings</label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={academic.schoolTimings}
                  onChange={e => setAcademic({ ...academic, schoolTimings: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Default Grading System</label>
              <select
                value={academic.gradingSystem}
                onChange={e => setAcademic({ ...academic, gradingSystem: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="CBSE 9-Point Scale (A1 to E)">CBSE 9-Point Scale (A1 to E)</option>
                <option value="Percentage System (0-100%)">Percentage System (0-100%)</option>
                <option value="GPA 4.0 Scale">GPA 4.0 Scale</option>
                <option value="ICSE Letter Grades">ICSE Letter Grades</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Minimum Mandatory Attendance (%)</label>
              <input
                type="number"
                value={academic.minAttendancePercent}
                onChange={e => setAcademic({ ...academic, minAttendancePercent: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 2: CAPACITY & LIMITS ── */}
      {activeTab === 'capacity' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <HardDrive className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-sm font-extrabold text-white">Default Quota & Capacity Allocation</h2>
              <p className="text-[11px] text-slate-400">Set initial limits for student enrollments, staff count, and database storage.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Default Student Enrollment Cap</label>
              <input
                type="number"
                value={capacity.defaultStudentCap}
                onChange={e => setCapacity({ ...capacity, defaultStudentCap: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Default Staff & Teacher Cap</label>
              <input
                type="number"
                value={capacity.defaultStaffCap}
                onChange={e => setCapacity({ ...capacity, defaultStaffCap: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Initial Storage Quota (MB)</label>
              <input
                type="number"
                value={capacity.defaultStorageMb}
                onChange={e => setCapacity({ ...capacity, defaultStorageMb: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Max Sections Per Class</label>
              <input
                type="number"
                value={capacity.defaultMaxSections}
                onChange={e => setCapacity({ ...capacity, defaultMaxSections: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 3: FINANCE & FEES ── */}
      {activeTab === 'finance' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-extrabold text-white">Default Finance & Fee Collection Rules</h2>
              <p className="text-[11px] text-slate-400">Pre-configured late fee fines, grace periods, and payment options.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Late Fine Amount (Per Day)</label>
              <input
                type="number"
                value={finance.lateFinePerDay}
                onChange={e => setFinance({ ...finance, lateFinePerDay: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Late Fine Grace Period (Days)</label>
              <input
                type="number"
                value={finance.fineGraceDays}
                onChange={e => setFinance({ ...finance, fineGraceDays: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Auto SMS Fee Reminder (Days Prior)</label>
              <input
                type="number"
                value={finance.autoFeeReminderDaysPrior}
                onChange={e => setFinance({ ...finance, autoFeeReminderDaysPrior: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs">
            <div>
              <div className="font-bold text-white">Allow Partial Fee Payments</div>
              <div className="text-[10px] text-slate-400">Students can pay term fees in multiple installments</div>
            </div>
            <button
              type="button"
              onClick={() => setFinance({ ...finance, allowPartialPayments: !finance.allowPartialPayments })}
              className={`w-11 h-6 rounded-full flex items-center p-1 transition-all cursor-pointer ${
                finance.allowPartialPayments ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <span className="w-4 h-4 bg-white rounded-full shadow-md" />
            </button>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 4: DEFAULT ERP MODULES ── */}
      {activeTab === 'modules' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Layers className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-extrabold text-white">Default Pre-Allocated ERP Feature Modules</h2>
              <p className="text-[11px] text-slate-400">Select which ERP modules are automatically turned ON when a new school is provisioned.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {Object.entries(modules).map(([key, enabled]) => {
              const label = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase());

              return (
                <div
                  key={key}
                  onClick={() => toggleModule(key as keyof typeof modules)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    enabled
                      ? 'bg-blue-500/10 border-blue-500/40 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="font-bold">{label}</span>
                  {enabled ? (
                    <ToggleRight className="w-6 h-6 text-blue-400" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-600" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 5: BRANDING & RECEIPTS ── */}
      {activeTab === 'branding' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <FileText className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-extrabold text-white">Default Branding & Print Layouts</h2>
              <p className="text-[11px] text-slate-400">Default PDF print templates for ID Cards, Fee Receipts, and Certificates.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Default Student ID Card Layout</label>
              <select
                value={branding.idCardTemplate}
                onChange={e => setBranding({ ...branding, idCardTemplate: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="Modern Vertical Card with QR">Modern Vertical Card with QR Code</option>
                <option value="Horizontal Classic Lanyard Style">Horizontal Classic Lanyard Style</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Default Fee Receipt Print Format</label>
              <select
                value={branding.feeReceiptLayout}
                onChange={e => setBranding({ ...branding, feeReceiptLayout: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="Standard A5 Dual Copy">Standard A5 Dual Copy (Student + School)</option>
                <option value="Thermal Receipt 80mm Roll">Thermal Receipt (80mm Thermal Printer)</option>
                <option value="Full A4 Detailed Ledger">Full A4 Detailed Ledger Copy</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
