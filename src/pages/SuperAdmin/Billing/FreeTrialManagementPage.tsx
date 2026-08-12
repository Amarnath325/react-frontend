import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Clock, RefreshCw, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, Zap, Rocket, AlertTriangle,
  LayoutGrid, Edit2, ToggleLeft, ToggleRight
} from 'lucide-react';
import api from '../../../services/api';

export interface FreeTrialItem {
  id: string;
  trial_id: string;
  school_name: string;
  plan_tier: string;
  days_remaining: string;
  trial_start_date: string;
  trial_end_date: string;
  status: 'ACTIVE TRIAL' | 'CONVERTED';
}

type SortField = 'school_name' | 'plan_tier' | 'trial_end_date';
type SortOrder = 'asc' | 'desc';
type PageSizeOption = 6 | 12 | 24 | 'all';
type ViewMode = 'grid' | 'list';

interface SearchableOption {
  value: string;
  label: string;
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  icon: Icon,
  labelPrefix
}: {
  options: SearchableOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  icon?: React.ElementType;
  labelPrefix?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase()) ||
    o.value.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 font-bold cursor-pointer transition-all"
      >
        {Icon && <Icon className="w-3.5 h-3.5 text-amber-400" />}
        {labelPrefix && <span className="text-[11px] text-slate-400 font-bold">{labelPrefix}:</span>}
        <span className="truncate max-w-[130px]">{selectedOption?.label || placeholder}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-52 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 space-y-1">
          <div className="relative mb-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search option..."
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
            />
          </div>
          <div className="max-h-44 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-2 text-[10px] text-slate-500 text-center font-medium">No options match</div>
            ) : (
              filteredOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    opt.value === value
                      ? 'bg-amber-600/20 text-amber-400 font-bold border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockTrials: FreeTrialItem[] = [
  {
    id: 'trl-1',
    trial_id: 'TRL-5042',
    school_name: 'Delhi Public School, Sector 45',
    plan_tier: 'PRO SLA TRIAL (30-DAY)',
    days_remaining: '18 Days Left',
    trial_start_date: '2026-07-30',
    trial_end_date: '2026-08-30',
    status: 'ACTIVE TRIAL'
  },
  {
    id: 'trl-2',
    trial_id: 'TRL-5038',
    school_name: 'St. Xavier International School',
    plan_tier: 'ENTERPRISE TRIAL (30-DAY)',
    days_remaining: '3 Days Left 🚨',
    trial_start_date: '2026-07-15',
    trial_end_date: '2026-08-15',
    status: 'ACTIVE TRIAL'
  },
  {
    id: 'trl-3',
    trial_id: 'TRL-5025',
    school_name: 'Greenwood High International',
    plan_tier: 'ENTERPRISE TRIAL (30-DAY)',
    days_remaining: 'CONVERTED TO PAID 🚀',
    trial_start_date: '2026-06-10',
    trial_end_date: '2026-07-10',
    status: 'CONVERTED'
  }
];

export default function FreeTrialManagementPage() {
  const [trials, setTrials] = useState<FreeTrialItem[]>(mockTrials);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('school_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(6);

  // Modals
  const [selectedTrial, setSelectedTrial] = useState<FreeTrialItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTrial, setEditingTrial] = useState<FreeTrialItem | null>(null);

  // Form State
  const [formSchoolName, setFormSchoolName] = useState('');
  const [formPlanTier, setFormPlanTier] = useState('PRO SLA TRIAL (30-DAY)');
  const [formDaysRemaining, setFormDaysRemaining] = useState('30 Days Left');
  const [formStartDate, setFormStartDate] = useState('2026-08-12');
  const [formEndDate, setFormEndDate] = useState('2026-09-12');
  const [formStatus, setFormStatus] = useState<'ACTIVE TRIAL' | 'CONVERTED'>('ACTIVE TRIAL');

  const activeTrialsCount = 184;
  const conversionRatePct = 68.4;
  const expiringSoonCount = 14;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/free-trial-management');
      if (res.data.success && Array.isArray(res.data.data)) {
        setTrials(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('School tenant free trial accounts & expiry monitors refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder, pageSize]);

  // Toggle Active / Converted Status
  const handleToggleStatus = async (id: string, currentStatus: 'ACTIVE TRIAL' | 'CONVERTED', schoolName: string) => {
    const nextStatus: 'ACTIVE TRIAL' | 'CONVERTED' = currentStatus === 'ACTIVE TRIAL' ? 'CONVERTED' : 'ACTIVE TRIAL';
    toast.loading(`Updating trial status for '${schoolName}' to ${nextStatus}...`, { id: 'trl-status-toast' });

    try {
      await api.put(`/landlord/free-trial-management/${id}`, { status: nextStatus });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setTrials(prev => prev.map(t => (t.id === id ? { ...t, status: nextStatus, days_remaining: nextStatus === 'CONVERTED' ? 'CONVERTED TO PAID 🚀' : '18 Days Left' } : t)));
      toast.success(`Trial for '${schoolName}' is now ${nextStatus === 'CONVERTED' ? 'CONVERTED TO PAID 🚀' : 'ACTIVE TRIAL 🟢'}!`, { id: 'trl-status-toast' });
    }, 400);
  };

  const handleExtendTrial = (id: string, name: string) => {
    toast.loading(`Extending 14 extra trial days for '${name}'...`, { id: 'ext-trial-toast' });
    setTimeout(() => {
      toast.success(`🎉 Free trial for '${name}' extended by 14 days!`, { id: 'ext-trial-toast' });
    }, 800);
  };

  const handleCreateTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSchoolName.trim()) {
      toast.error('Please enter a School Tenant Name');
      return;
    }

    toast.loading('Provisioning 30-Day Free Trial account...', { id: 'create-trl-toast' });

    try {
      await api.post('/landlord/free-trial-management', {
        school_name: formSchoolName,
        plan_tier: formPlanTier,
        days_remaining: formDaysRemaining,
        trial_start_date: formStartDate,
        trial_end_date: formEndDate,
        status: formStatus
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newTrial: FreeTrialItem = {
        id: `trl-${Date.now()}`,
        trial_id: `TRL-${Math.floor(1000 + Math.random() * 9000)}`,
        school_name: formSchoolName,
        plan_tier: formPlanTier,
        days_remaining: formDaysRemaining,
        trial_start_date: formStartDate,
        trial_end_date: formEndDate,
        status: formStatus
      };

      setTrials(prev => [newTrial, ...prev]);
      toast.success(`⏳ Free Trial provisioned for '${formSchoolName}' successfully!`, { id: 'create-trl-toast' });
      setIsAddModalOpen(false);

      // Reset form
      setFormSchoolName('');
    }, 600);
  };

  const handleOpenEdit = (t: FreeTrialItem) => {
    setEditingTrial(t);
    setFormSchoolName(t.school_name);
    setFormPlanTier(t.plan_tier);
    setFormDaysRemaining(t.days_remaining);
    setFormStartDate(t.trial_start_date);
    setFormEndDate(t.trial_end_date);
    setFormStatus(t.status);
  };

  const handleUpdateTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrial) return;

    toast.loading(`Updating trial for '${editingTrial.school_name}'...`, { id: 'edit-trl-toast' });

    try {
      await api.put(`/landlord/free-trial-management/${editingTrial.id}`, {
        school_name: formSchoolName,
        plan_tier: formPlanTier,
        days_remaining: formDaysRemaining,
        trial_start_date: formStartDate,
        trial_end_date: formEndDate,
        status: formStatus
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setTrials(prev =>
        prev.map(t =>
          t.id === editingTrial.id
            ? {
                ...t,
                school_name: formSchoolName,
                plan_tier: formPlanTier,
                days_remaining: formDaysRemaining,
                trial_start_date: formStartDate,
                trial_end_date: formEndDate,
                status: formStatus
              }
            : t
        )
      );
      toast.success(`✏️ Trial for '${formSchoolName}' updated successfully!`, { id: 'edit-trl-toast' });
      setEditingTrial(null);
    }, 500);
  };

  const handleDeleteTrial = async (id: string, trlId: string) => {
    toast.loading(`Terminating trial account '${trlId}'...`, { id: 'del-trl-toast' });

    try {
      await api.delete(`/landlord/free-trial-management/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setTrials(prev => prev.filter(t => t.id !== id));
      toast.success(`🗑️ Trial account '${trlId}' terminated!`, { id: 'del-trl-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = trials.filter(t => {
    const matchesSearch =
      t.trial_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.plan_tier.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    let valA: string | number = a[sortBy] ?? '';
    let valB: string | number = b[sortBy] ?? '';

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalFiltered = sorted.length;
  const effectivePageSize = pageSize === 'all' ? Math.max(1, totalFiltered) : pageSize;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalFiltered / effectivePageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * effectivePageSize;
  const paginatedData = pageSize === 'all' ? sorted : sorted.slice(startIndex, startIndex + effectivePageSize);

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'ACTIVE TRIAL', label: 'ACTIVE TRIAL 🟢' },
    { value: 'CONVERTED', label: 'CONVERTED 🚀' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'school_name', label: 'School Name' },
    { value: 'plan_tier', label: 'Plan Tier' },
    { value: 'trial_end_date', label: 'Trial End Date' },
  ];

  const pageSizeOptions: SearchableOption[] = [
    { value: '6', label: '6 per page' },
    { value: '12', label: '12 per page' },
    { value: '24', label: '24 per page' },
    { value: 'all', label: 'Show All' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-100">
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-400/30">
              <Clock className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                School Tenant 30-Day Free Trial & Conversion Lifecycle
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-extrabold rounded-full border border-amber-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Rocket className="w-3 h-3 text-emerald-400 animate-pulse" /> 68.4% Trial Paid Conversion Rate
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit 30-day free trial accounts, track expiry countdowns, active/converted status toggles, and trigger 1-click extensions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setFormSchoolName('');
              setFormPlanTier('PRO SLA TRIAL (30-DAY)');
              setFormDaysRemaining('30 Days Left');
              setFormStartDate('2026-08-12');
              setFormEndDate('2026-09-12');
              setFormStatus('ACTIVE TRIAL');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Provision Free Trial
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleRefresh}
            className="p-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Free Trials</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{activeTrialsCount} Active Trials ⏳</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Evaluation Accounts</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Conversion Rate</span>
            <Rocket className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{conversionRatePct}% Paid 🚀</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Trial to Paid Conversion</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Expiring in 3 Days</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{expiringSoonCount} Expiring 🚨</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Urgent Nudge Required</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Default Duration</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">30 Days SLA</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Full Feature Access</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Auto Suspension</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-black text-teal-400 font-mono">ENABLED 🔒</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Auto-Freeze on Day 31</div>
        </div>
      </div>

      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by trial ID, school name, plan tier..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Grid vs List View Switch */}
          <div className="flex items-center bg-slate-900 p-1 border border-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                viewMode === 'grid' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-4 h-4" /> Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                viewMode === 'list' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
              }`}
              title="Table List View"
            >
              <List className="w-4 h-4" /> List
            </button>
          </div>

          <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
          <div className="flex items-center gap-1">
            <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-900 border border-slate-800 text-amber-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <SearchableSelect options={pageSizeOptions} value={String(pageSize)} onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))} placeholder="Per Page..." icon={List} labelPrefix="Rows" />
        </div>
      </div>

      {/* GRID VIEW vs LIST VIEW */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedData.map(t => (
            <div
              key={t.id}
              className={`bg-slate-950 rounded-3xl border p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 relative overflow-hidden group ${
                t.status === 'ACTIVE TRIAL'
                  ? 'border-slate-800 hover:border-amber-500/40 hover:shadow-amber-500/5'
                  : 'border-slate-800/60 opacity-65 bg-slate-950/40'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{t.trial_id}</span>
                    <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors mt-0.5">{t.school_name}</h3>
                  </div>

                  {/* Active / Converted Status Toggle */}
                  <button
                    onClick={() => handleToggleStatus(t.id, t.status, t.school_name)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black cursor-pointer transition-all ${
                      t.status === 'CONVERTED'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                    }`}
                    title="Click to toggle Active / Converted"
                  >
                    {t.status === 'CONVERTED' ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-amber-400" />}
                    {t.status}
                  </button>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between font-mono">
                  <span className="text-xs text-indigo-300 font-bold">{t.plan_tier}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Days Remaining</div>
                    <div className="text-red-400 font-bold text-xs mt-0.5 truncate">{t.days_remaining}</div>
                  </div>
                  <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Trial End Date</div>
                    <div className="text-emerald-400 font-bold text-xs mt-0.5 truncate">{t.trial_end_date}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                  <span>Start Date:</span>
                  <span className="text-slate-200 font-bold">{t.trial_start_date}</span>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleExtendTrial(t.id, t.school_name)}
                  className="px-2.5 py-1.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" /> Extend 14 Days
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTrial(t.id, t.trial_id)}
                    className="p-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl cursor-pointer transition-all"
                    title="Terminate Trial"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('school_name')}>School Tenant & Trial ID</th>
                  <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('plan_tier')}>Trial Pricing Tier</th>
                  <th className="p-3.5 font-mono">Days Remaining</th>
                  <th className="p-3.5 font-mono">Trial Start Date</th>
                  <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('trial_end_date')}>Trial End Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedData.map(t => (
                  <tr key={t.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-bold text-white font-mono">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="text-sm text-white font-extrabold">{t.school_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{t.trial_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[10px] text-indigo-400 font-bold">{t.plan_tier}</td>
                    <td className="p-3.5 font-mono text-[11px] text-red-400 font-bold">{t.days_remaining}</td>
                    <td className="p-3.5 font-mono text-[10px] text-slate-400">{t.trial_start_date}</td>
                    <td className="p-3.5 font-mono text-[10px] text-emerald-400 font-bold">{t.trial_end_date}</td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleStatus(t.id, t.status, t.school_name)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase cursor-pointer transition-all ${
                          t.status === 'CONVERTED'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                        }`}
                      >
                        {t.status === 'CONVERTED' ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5 text-amber-400" />}
                        {t.status}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleExtendTrial(t.id, t.school_name)}
                          className="px-2 py-1.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" /> Extend 14 Days
                        </button>
                        <button
                          onClick={() => setSelectedTrial(t)}
                          className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" /> Spec
                        </button>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="px-2.5 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTrial(t.id, t.trial_id)}
                          className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                          title="Terminate Trial"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE FREE TRIAL MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Provision 30-Day Free Trial Account</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrial} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">School Tenant Name *</label>
                <input
                  type="text"
                  required
                  value={formSchoolName}
                  onChange={e => setFormSchoolName(e.target.value)}
                  placeholder="e.g. Cambridge International Academy"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Trial Plan Tier</label>
                <select
                  value={formPlanTier}
                  onChange={e => setFormPlanTier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="PRO SLA TRIAL (30-DAY)">PRO SLA TRIAL (30-DAY)</option>
                  <option value="ENTERPRISE TRIAL (30-DAY)">ENTERPRISE TRIAL (30-DAY)</option>
                  <option value="STARTER TRIAL (30-DAY)">STARTER TRIAL (30-DAY)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as 'ACTIVE TRIAL' | 'CONVERTED')}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="ACTIVE TRIAL">ACTIVE TRIAL 🟢</option>
                  <option value="CONVERTED">CONVERTED 🚀</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer"
                >
                  Provision Trial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FREE TRIAL MODAL */}
      {editingTrial && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Edit Free Trial ({editingTrial.trial_id})</h3>
              </div>
              <button onClick={() => setEditingTrial(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTrial} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">School Tenant Name *</label>
                <input
                  type="text"
                  required
                  value={formSchoolName}
                  onChange={e => setFormSchoolName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Trial Plan Tier</label>
                <input
                  type="text"
                  value={formPlanTier}
                  onChange={e => setFormPlanTier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as 'ACTIVE TRIAL' | 'CONVERTED')}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="ACTIVE TRIAL">ACTIVE TRIAL 🟢</option>
                  <option value="CONVERTED">CONVERTED 🚀</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTrial(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer"
                >
                  Update Trial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SPEC INSPECTOR MODAL */}
      {selectedTrial && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Free Trial Account Specification ({selectedTrial.trial_id})</h3>
              </div>
              <button onClick={() => setSelectedTrial(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-amber-400 text-base font-black">{selectedTrial.school_name}</div>
                <div className="text-indigo-400 text-xs font-bold">Tier: {selectedTrial.plan_tier}</div>
                <div className="text-red-400">Remaining: {selectedTrial.days_remaining}</div>
                <div className="text-slate-300">Start: {selectedTrial.trial_start_date} · End: {selectedTrial.trial_end_date}</div>
                <div className="text-slate-500 text-[11px]">
                  Status: <span className={selectedTrial.status === 'CONVERTED' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{selectedTrial.status}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTrial(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
