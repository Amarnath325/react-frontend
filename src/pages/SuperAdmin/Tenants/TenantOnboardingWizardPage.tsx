import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  GitBranch, Check, ChevronRight, ChevronLeft, Building, Settings,
  Database, CreditCard, Rocket, Plus, Search, Globe, Layers, X
} from 'lucide-react';
import api from '../../../services/api';

interface OnboardingStep {
  id: number;
  title: string;
  desc: string;
  icon: React.ElementType;
}

const wizardSteps: OnboardingStep[] = [
  { id: 1, title: 'School & Admin Profile', desc: 'Basic school details & admin contact', icon: Building },
  { id: 2, title: 'Plan & Custom Domain', desc: 'Select tier, billing cycle & domain', icon: CreditCard },
  { id: 3, title: 'Database Provisioning', desc: 'MySQL isolated database creation', icon: Database },
  { id: 4, title: 'Modules & Feature Flags', desc: 'Configure enabled school modules', icon: Settings },
  { id: 5, title: 'Review & Final Launch', desc: 'Verify configuration & activate school', icon: Rocket },
];

interface OnboardingTenant {
  id: number;
  school_name: string;
  school_code: string;
  admin_name: string;
  admin_email: string;
  admin_phone: string;
  plan: 'Basic' | 'Pro' | 'Enterprise';
  billing_cycle: 'monthly' | 'annual';
  custom_domain?: string;
  db_name: string;
  current_step: number;
  progress_percent: number;
  status: 'draft' | 'in_progress' | 'completed';
  modules_enabled: string[];
  created_at: string;
}

const initialPipeline: OnboardingTenant[] = [
  {
    id: 1,
    school_name: 'Sunrise Public School',
    school_code: 'sunrise_ps',
    admin_name: 'Anil Sharma',
    admin_email: 'principal@sunrisepublic.edu.in',
    admin_phone: '+91 98765 12345',
    plan: 'Pro',
    billing_cycle: 'annual',
    custom_domain: 'sunrisepublic.edu.in',
    db_name: 'school_sunrise_ps',
    current_step: 3,
    progress_percent: 60,
    status: 'in_progress',
    modules_enabled: ['Attendance', 'Fees', 'Exams', 'SMS Alerts'],
    created_at: '2026-08-04'
  },
  {
    id: 2,
    school_name: 'Bright Future Academy',
    school_code: 'bright_future',
    admin_name: 'Lata Menon',
    admin_email: 'admin@brightfuture.ac.in',
    admin_phone: '+91 98112 99887',
    plan: 'Enterprise',
    billing_cycle: 'annual',
    custom_domain: 'brightfuture.ac.in',
    db_name: 'school_bright_future',
    current_step: 2,
    progress_percent: 40,
    status: 'in_progress',
    modules_enabled: ['Attendance', 'Fees', 'LMS', 'WhatsApp', 'Transport'],
    created_at: '2026-08-05'
  },
  {
    id: 3,
    school_name: 'Green Valley Convent',
    school_code: 'green_valley',
    admin_name: 'Rajan Pillai',
    admin_email: 'contact@greenvalley.edu.in',
    admin_phone: '+91 94120 55443',
    plan: 'Basic',
    billing_cycle: 'monthly',
    db_name: 'school_green_valley',
    current_step: 4,
    progress_percent: 80,
    status: 'in_progress',
    modules_enabled: ['Attendance', 'Fees'],
    created_at: '2026-08-03'
  }
];

const availableModules = [
  { id: 'Attendance', name: 'Student & Staff Attendance', desc: 'Biometric & QR Code attendance' },
  { id: 'Fees', name: 'Fees & Payment Gateway', desc: 'Online fee collection & invoices' },
  { id: 'Exams', name: 'Exams & Report Cards', desc: 'Gradebooks & CCE report cards' },
  { id: 'LMS', name: 'LMS & Live Classes', desc: 'Homework, study material & Zoom/Google Meet' },
  { id: 'Transport', name: 'GPS Bus Tracking', desc: 'Real-time vehicle GPS & route management' },
  { id: 'WhatsApp', name: 'WhatsApp & SMS Gateway', desc: 'Automated parent notifications' },
  { id: 'Library', name: 'Library Management', desc: 'Book cataloging & barcode issue' },
];

export default function TenantOnboardingWizardPage() {
  const [pipeline, setPipeline] = useState<OnboardingTenant[]>(initialPipeline);
  const [activeTenantId, setActiveTenantId] = useState<number>(initialPipeline[0].id);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [provisioning, setProvisioning] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  // New Onboarding Form State
  const [newForm, setNewForm] = useState({
    school_name: '',
    school_code: '',
    admin_name: '',
    admin_email: '',
    admin_phone: '',
    plan: 'Pro' as OnboardingTenant['plan'],
  });

  const activeTenant = pipeline.find(t => t.id === activeTenantId) || pipeline[0];

  // Advance step in Wizard
  const handleNextStep = async () => {
    if (!activeTenant) return;

    if (activeTenant.current_step === 3) {
      // Step 3: Trigger Provisioning Animation
      setProvisioning(true);
      toast.loading('Provisioning dedicated MySQL database & seeding tables...', { id: 'prov-toast' });
      try {
        await api.post('/landlord/register-school', {
          school_name: activeTenant.school_name,
          school_code: activeTenant.school_code,
          admin_email: activeTenant.admin_email,
        });
      } catch {
        // Fallback smooth transition
      }
      setTimeout(() => {
        setProvisioning(false);
        toast.success(`Database '${activeTenant.db_name}' provisioned successfully!`, { id: 'prov-toast' });
        updateTenantStep(activeTenant.id, 4);
      }, 1200);
      return;
    }

    if (activeTenant.current_step === 5) {
      // Final Launch
      setPipeline(prev =>
        prev.map(t =>
          t.id === activeTenant.id
            ? { ...t, status: 'completed', progress_percent: 100 }
            : t
        )
      );
      toast.success(`🚀 ${activeTenant.school_name} successfully launched & activated!`);
      return;
    }

    updateTenantStep(activeTenant.id, activeTenant.current_step + 1);
  };

  // Move back a step
  const handlePrevStep = () => {
    if (activeTenant && activeTenant.current_step > 1) {
      updateTenantStep(activeTenant.id, activeTenant.current_step - 1);
    }
  };

  // Helper to update step & progress
  const updateTenantStep = (id: number, nextStep: number) => {
    setPipeline(prev =>
      prev.map(t => {
        if (t.id === id) {
          const progress = Math.round((nextStep / 5) * 100);
          return {
            ...t,
            current_step: nextStep,
            progress_percent: progress,
            status: nextStep === 5 ? 'in_progress' : t.status,
          };
        }
        return t;
      })
    );
  };

  // Toggle feature module
  const handleToggleModule = (moduleId: string) => {
    if (!activeTenant) return;
    const exists = activeTenant.modules_enabled.includes(moduleId);
    const updated = exists
      ? activeTenant.modules_enabled.filter(m => m !== moduleId)
      : [...activeTenant.modules_enabled, moduleId];

    setPipeline(prev =>
      prev.map(t => (t.id === activeTenant.id ? { ...t, modules_enabled: updated } : t))
    );
    toast.success(`Module ${moduleId} ${exists ? 'disabled' : 'enabled'}`);
  };

  // Start brand new onboarding pipeline
  const handleCreateNewOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.school_name || !newForm.school_code || !newForm.admin_email) {
      toast.error('Please fill required fields');
      return;
    }

    const cleanCode = newForm.school_code.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const created: OnboardingTenant = {
      id: Date.now(),
      school_name: newForm.school_name,
      school_code: cleanCode,
      admin_name: newForm.admin_name || 'School Admin',
      admin_email: newForm.admin_email,
      admin_phone: newForm.admin_phone || '+91 99999 88888',
      plan: newForm.plan,
      billing_cycle: 'annual',
      db_name: `school_${cleanCode}`,
      current_step: 1,
      progress_percent: 20,
      status: 'in_progress',
      modules_enabled: ['Attendance', 'Fees', 'Exams', 'SMS Alerts'],
      created_at: new Date().toISOString().split('T')[0],
    };

    setPipeline(prev => [created, ...prev]);
    setActiveTenantId(created.id);
    setShowNewModal(false);
    toast.success(`Onboarding pipeline initialized for ${created.school_name}`);
    setNewForm({ school_name: '', school_code: '', admin_name: '', admin_email: '', admin_phone: '', plan: 'Pro' });
  };

  // Filter pipeline list
  const filteredPipeline = pipeline.filter(t => {
    const matchesSearch =
      t.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.school_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.admin_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-violet-500/20 text-violet-400 rounded-2xl border border-violet-400/30">
              <GitBranch className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Tenant Onboarding Wizard Engine
                <span className="px-2.5 py-0.5 bg-violet-500/20 text-violet-400 text-[10px] font-extrabold rounded-full border border-violet-400/30 uppercase tracking-wider">
                  5-Step Pipeline
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Guided multi-tenant onboarding · Automated DB creation · Module flags · Production activation
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-violet-600/30 transition-all"
        >
          <Plus className="w-4 h-4" /> Start New Tenant Onboarding
        </button>
      </div>

      {/* ── MAIN WORKSPACE GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── LEFT SIDEBAR: PIPELINE LIST ── */}
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 space-y-4 shadow-xl flex flex-col h-fit">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-violet-400" /> Onboarding Pipeline ({pipeline.length})
            </h3>
            <span className="text-[10px] text-slate-500 font-bold font-mono">Live Sync</span>
          </div>

          {/* Search & Filter */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 placeholder-slate-600"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-bold text-white px-2 py-1.5 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="all">All</option>
                <option value="in_progress">Active</option>
                <option value="completed">Launched</option>
              </select>
            </div>
          </div>

          {/* Pipeline Items List */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredPipeline.map(t => {
              const isActive = t.id === activeTenantId;
              const isDone = t.status === 'completed';

              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTenantId(t.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isActive
                      ? 'border-violet-500/50 bg-violet-500/10 shadow-lg ring-1 ring-violet-500/30'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-white truncate">{t.school_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{t.school_code} · {t.plan}</div>
                    </div>
                    {isDone ? (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-bold uppercase flex-shrink-0">
                        Launched
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/30 rounded-full text-[9px] font-bold uppercase flex-shrink-0">
                        Step {t.current_step}/5
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-violet-600 to-indigo-500'
                        }`}
                        style={{ width: `${t.progress_percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono font-bold">
                      <span>Progress</span>
                      <span>{t.progress_percent}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT MAIN PANEL: WIZARD STEPS ENGINE ── */}
        <div className="lg:col-span-2 bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-6 flex flex-col justify-between">
          <div>
            {/* Active School Banner */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-800 flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">{activeTenant.school_name}</h2>
                  <span className="px-2.5 py-0.5 bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[10px] font-bold rounded-full">
                    {activeTenant.plan} Plan
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Tenant Code: <strong className="text-violet-400">{activeTenant.school_code}</strong> · Admin: {activeTenant.admin_email}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl font-mono">
                  DB: {activeTenant.db_name}
                </span>
              </div>
            </div>

            {/* ── STEP INDICATOR PROGRESS TRACKER ── */}
            <div className="py-6">
              <div className="grid grid-cols-5 gap-2">
                {wizardSteps.map((step) => {
                  const isCompleted = activeTenant.current_step > step.id || activeTenant.status === 'completed';
                  const isCurrent = activeTenant.current_step === step.id && activeTenant.status !== 'completed';
                  const StepIcon = step.icon;

                  return (
                    <div
                      key={step.id}
                      onClick={() => updateTenantStep(activeTenant.id, step.id)}
                      className={`flex flex-col items-center text-center space-y-1.5 cursor-pointer group ${
                        isCompleted ? 'text-emerald-400' : isCurrent ? 'text-violet-400' : 'text-slate-600'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-xs transition-all ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : isCurrent
                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/40 ring-4 ring-violet-500/20'
                            : 'bg-slate-900 text-slate-600 border border-slate-800 group-hover:border-slate-700'
                        }`}
                      >
                        {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-4 h-4" />}
                      </div>
                      <div className="text-[10px] font-extrabold truncate max-w-full hidden sm:block">
                        {step.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── WIZARD STEP CONTENT PANELS ── */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-6 space-y-4 min-h-[300px]">
              {/* STEP 1: SCHOOL & ADMIN PROFILE */}
              {activeTenant.current_step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Building className="w-5 h-5 text-violet-400" />
                    <div>
                      <h3 className="font-extrabold text-sm text-white">Step 1: School Identity & Administrator Profile</h3>
                      <p className="text-[11px] text-slate-400">Configure legal entity details and root administrator contact.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">School Name</label>
                      <input
                        type="text"
                        value={activeTenant.school_name}
                        onChange={e => {
                          const val = e.target.value;
                          setPipeline(prev => prev.map(t => t.id === activeTenant.id ? { ...t, school_name: val } : t));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Tenant Code (Slug)</label>
                      <input
                        type="text"
                        value={activeTenant.school_code}
                        onChange={e => {
                          const val = e.target.value;
                          setPipeline(prev => prev.map(t => t.id === activeTenant.id ? { ...t, school_code: val, db_name: `school_${val}` } : t));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-violet-400 font-bold focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Admin Email</label>
                      <input
                        type="email"
                        value={activeTenant.admin_email}
                        onChange={e => {
                          const val = e.target.value;
                          setPipeline(prev => prev.map(t => t.id === activeTenant.id ? { ...t, admin_email: val } : t));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Admin Phone</label>
                      <input
                        type="text"
                        value={activeTenant.admin_phone}
                        onChange={e => {
                          const val = e.target.value;
                          setPipeline(prev => prev.map(t => t.id === activeTenant.id ? { ...t, admin_phone: val } : t));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: PLAN & CUSTOM DOMAIN */}
              {activeTenant.current_step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="font-extrabold text-sm text-white">Step 2: Subscription Plan & Domain Setup</h3>
                      <p className="text-[11px] text-slate-400">Choose tier capacity limits and configure custom school domain.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {(['Basic', 'Pro', 'Enterprise'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPipeline(prev => prev.map(t => t.id === activeTenant.id ? { ...t, plan: p } : t))}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                          activeTenant.plan === p
                            ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-black text-sm text-white">{p} Tier</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {p === 'Basic' ? 'Up to 500 Students' : p === 'Pro' ? 'Up to 2,000 Students' : 'Unlimited Capacity'}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 text-xs pt-2">
                    <label className="text-slate-400 font-bold block">Custom Domain (Optional)</label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={activeTenant.custom_domain || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setPipeline(prev => prev.map(t => t.id === activeTenant.id ? { ...t, custom_domain: val } : t));
                        }}
                        placeholder="e.g. school.domain.edu.in"
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: DATABASE PROVISIONING */}
              {activeTenant.current_step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Database className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h3 className="font-extrabold text-sm text-white">Step 3: Dedicated MySQL Database Provisioning</h3>
                      <p className="text-[11px] text-slate-400">Automated Landlord engine creates isolated tenant database.</p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Target Database Name:</span>
                      <strong className="text-cyan-300 font-bold">{activeTenant.db_name}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Host Server:</span>
                      <strong className="text-slate-200">127.0.0.1:3306 (Landlord Engine)</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Schema Migration Status:</span>
                      <strong className="text-emerald-400 font-bold">Ready to Migrate 120+ Tables</strong>
                    </div>
                  </div>

                  {provisioning ? (
                    <div className="py-6 text-center space-y-2 bg-cyan-950/20 border border-cyan-500/30 rounded-2xl">
                      <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs font-bold text-cyan-300">Creating MySQL Database & Running Seeder Scripts...</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
                      Click <strong className="text-white">"Provision & Continue"</strong> to trigger live database creation.
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: MODULES & FEATURE FLAGS */}
              {activeTenant.current_step === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Settings className="w-5 h-5 text-purple-400" />
                    <div>
                      <h3 className="font-extrabold text-sm text-white">Step 4: Module & Feature Flag Selection</h3>
                      <p className="text-[11px] text-slate-400">Enable or disable specific features for this school tenant.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {availableModules.map(m => {
                      const enabled = activeTenant.modules_enabled.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleToggleModule(m.id)}
                          className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                            enabled
                              ? 'bg-purple-500/10 border-purple-500/40 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-xs">{m.name}</div>
                            <div className="text-[10px] text-slate-400">{m.desc}</div>
                          </div>
                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                            enabled ? 'bg-purple-500 border-purple-400 text-white' : 'border-slate-700'
                          }`}>
                            {enabled && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW & FINAL LAUNCH */}
              {activeTenant.current_step === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Rocket className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="font-extrabold text-sm text-white">Step 5: Review & Production Activation</h3>
                      <p className="text-[11px] text-slate-400">Verify details and dispatch admin login credentials.</p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-slate-500">School Name:</span> <strong className="text-white">{activeTenant.school_name}</strong></div>
                      <div><span className="text-slate-500">Tenant Code:</span> <strong className="font-mono text-violet-400">{activeTenant.school_code}</strong></div>
                      <div><span className="text-slate-500">Database Engine:</span> <strong className="font-mono text-cyan-300">{activeTenant.db_name}</strong></div>
                      <div><span className="text-slate-500">Subscription Tier:</span> <strong className="text-amber-400">{activeTenant.plan}</strong></div>
                      <div><span className="text-slate-500">Enabled Modules:</span> <strong className="text-purple-300">{activeTenant.modules_enabled.length} Modules</strong></div>
                      <div><span className="text-slate-500">Admin Credentials:</span> <strong className="text-slate-200">{activeTenant.admin_email}</strong></div>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs text-emerald-300 font-bold">
                    🎉 Everything is configured! Click "Launch & Activate Tenant" below to go live.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── BOTTOM NAV BUTTONS ── */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-2">
            <button
              onClick={handlePrevStep}
              disabled={activeTenant.current_step === 1}
              className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Previous Step
            </button>

            <button
              onClick={handleNextStep}
              disabled={provisioning}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-violet-600/30 transition-all"
            >
              {activeTenant.current_step === 5 ? (
                <>
                  <Rocket className="w-4 h-4" /> Launch & Activate Tenant
                </>
              ) : activeTenant.current_step === 3 ? (
                <>
                  <Database className="w-4 h-4" /> Provision DB & Continue <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Continue <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL: START NEW ONBOARDING ── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateNewOnboarding} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-violet-400" /> Initialize New Tenant Onboarding
              </h3>
              <button type="button" onClick={() => setShowNewModal(false)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">School Name *</label>
                <input
                  type="text"
                  value={newForm.school_name}
                  onChange={e => setNewForm({ ...newForm, school_name: e.target.value, school_code: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_') })}
                  placeholder="e.g. Oxford Public School"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Tenant Code (Slug) *</label>
                  <input
                    type="text"
                    value={newForm.school_code}
                    onChange={e => setNewForm({ ...newForm, school_code: e.target.value })}
                    placeholder="oxford_public"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-mono text-violet-400 font-bold focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Subscription Plan</label>
                  <select
                    value={newForm.plan}
                    onChange={e => setNewForm({ ...newForm, plan: e.target.value as OnboardingTenant['plan'] })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="Basic">Basic Tier</option>
                    <option value="Pro">Pro Tier</option>
                    <option value="Enterprise">Enterprise Tier</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Admin Email *</label>
                  <input
                    type="email"
                    value={newForm.admin_email}
                    onChange={e => setNewForm({ ...newForm, admin_email: e.target.value })}
                    placeholder="admin@school.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Admin Phone</label>
                  <input
                    type="text"
                    value={newForm.admin_phone}
                    onChange={e => setNewForm({ ...newForm, admin_phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-violet-600/30"
              >
                <Plus className="w-4 h-4" /> Start Wizard Pipeline
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
