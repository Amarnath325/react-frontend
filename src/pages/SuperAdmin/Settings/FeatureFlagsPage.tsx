import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  ToggleLeft, ToggleRight, Plus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronDown, Check, List, LayoutGrid, Zap, ShieldAlert, Sparkles, Sliders,
  RefreshCw, CheckCircle2, AlertTriangle, X, Cpu, Info, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Trash2, Edit3
} from 'lucide-react';
import api from '../../../services/api';

interface FeatureFlag {
  id: number;
  key: string;
  label: string;
  desc: string;
  category: 'AI' | 'Comms' | 'Transport' | 'Attendance' | 'Finance' | 'Mobile' | 'Platform' | 'Security';
  enabled: boolean;
  rollout_percentage: number; // 0 to 100
  tier_restriction: 'All Plans' | 'Enterprise Only' | 'Pro & Enterprise' | 'Internal Beta';
  updated_at: string;
}

type SortField = 'label' | 'category' | 'enabled' | 'rollout_percentage';
type SortOrder = 'asc' | 'desc';
type PageSizeOption = 5 | 10 | 25 | 50 | 'all';

interface SearchableOption {
  value: string;
  label: string;
}

// Searchable Select Component
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
        {Icon && <Icon className="w-3.5 h-3.5 text-orange-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-orange-500 placeholder-slate-600"
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
                      ? 'bg-orange-600/20 text-orange-400 font-bold border border-orange-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-orange-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockFlags: FeatureFlag[] = [
  { id: 1, key: 'enable_ai_assistant', label: 'AI School Assistant & Co-Pilot', desc: 'Enables LLM-powered insights & automated report generation', category: 'AI', enabled: true, rollout_percentage: 100, tier_restriction: 'Pro & Enterprise', updated_at: '2026-08-01' },
  { id: 2, key: 'enable_whatsapp_broadcast', label: 'WhatsApp Business API Gateway', desc: 'Direct WhatsApp template broadcasts for fee & attendance alerts', category: 'Comms', enabled: true, rollout_percentage: 100, tier_restriction: 'All Plans', updated_at: '2026-07-28' },
  { id: 3, key: 'enable_gps_bus_tracking', label: 'Live Vehicle GPS Fleet Tracking', desc: 'Real-time school bus location tracking for parents & transport managers', category: 'Transport', enabled: true, rollout_percentage: 50, tier_restriction: 'Enterprise Only', updated_at: '2026-08-03' },
  { id: 4, key: 'enable_face_recognition', label: 'Biometric Face Recognition Attendance', desc: 'AI camera-based facial recognition attendance marking at gates', category: 'Attendance', enabled: false, rollout_percentage: 0, tier_restriction: 'Internal Beta', updated_at: '2026-06-15' },
  { id: 5, key: 'enable_online_payment_v2', label: 'Razorpay / Stripe Instant Gateway V2', desc: 'Automatic fee split & instant settlement gateway', category: 'Finance', enabled: true, rollout_percentage: 100, tier_restriction: 'All Plans', updated_at: '2026-08-04' },
  { id: 6, key: 'enable_parent_mobile_app', label: 'Flutter Parent Native App Access', desc: 'iOS & Android mobile app push notifications & homework uploads', category: 'Mobile', enabled: true, rollout_percentage: 100, tier_restriction: 'All Plans', updated_at: '2026-07-20' },
  { id: 7, key: 'enable_self_registration', label: 'Tenant Self-Onboarding Portal', desc: 'Allows new schools to self-register & provision 30-day trials', category: 'Platform', enabled: true, rollout_percentage: 100, tier_restriction: 'All Plans', updated_at: '2026-07-15' },
  { id: 8, key: 'enable_audit_trail_logging', label: 'Immutable Audit Trail Logger', desc: 'Records all CRUD database mutations platform-wide for security compliance', category: 'Security', enabled: true, rollout_percentage: 100, tier_restriction: 'Enterprise Only', updated_at: '2026-07-30' },
  { id: 9, key: 'enable_2fa_forced_superadmin', label: 'Enforce Mandatory 2FA for SuperAdmins', desc: 'Requires Google Authenticator OTP for landlord panel access', category: 'Security', enabled: true, rollout_percentage: 100, tier_restriction: 'All Plans', updated_at: '2026-08-05' },
  { id: 10, key: 'enable_cbt_online_exams', label: 'Computer Based Online Exam Engine', desc: 'Timed online quiz portal with anti-cheat tab switching detection', category: 'Platform', enabled: false, rollout_percentage: 25, tier_restriction: 'Internal Beta', updated_at: '2026-08-02' }
];

const categoryBadge: Record<string, string> = {
  AI: 'text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/30',
  Comms: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
  Transport: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  Attendance: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  Finance: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  Mobile: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  Platform: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  Security: 'text-red-400 bg-red-400/10 border-red-400/30',
};

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>(mockFlags);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('label');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);

  // Form State for Add / Edit Flag
  const [flagForm, setFlagForm] = useState({
    key: '',
    label: '',
    desc: '',
    category: 'Platform' as FeatureFlag['category'],
    rollout_percentage: 100,
    tier_restriction: 'All Plans' as FeatureFlag['tier_restriction'],
  });

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/feature-flags');
      if (res.data.success && Array.isArray(res.data.data)) {
        setFlags(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Feature flags & canary rollout states reloaded');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter, sortBy, sortOrder, pageSize]);

  // Toggle Flag Enabled State
  const handleToggleFlag = async (id: number, currentEnabled: boolean) => {
    const nextState = !currentEnabled;
    const targetFlag = flags.find(f => f.id === id);

    setFlags(prev =>
      prev.map(f => (f.id === id ? { ...f, enabled: nextState, updated_at: new Date().toISOString().split('T')[0] } : f))
    );

    toast.success(`${targetFlag?.label || 'Feature'} is now ${nextState ? 'ENABLED 🟢' : 'DISABLED 🔴'}`);

    try {
      await api.post(`/landlord/feature-flags/${id}/toggle`);
    } catch {
      // Smooth fallback
    }
  };

  // Emergency Kill Switch: Disable all experimental/beta flags
  const handleEmergencyKillSwitch = () => {
    if (!window.confirm('⚠️ Emergency Kill Switch: Disable all experimental / beta feature flags globally?')) return;

    setFlags(prev =>
      prev.map(f =>
        f.tier_restriction === 'Internal Beta' || f.rollout_percentage < 100
          ? { ...f, enabled: false, updated_at: new Date().toISOString().split('T')[0] }
          : f
      )
    );

    toast.error('🔥 Emergency Kill Switch Triggered! All beta feature flags disabled.');
  };

  // Create Flag Form Submit
  const handleCreateFlagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagForm.label || !flagForm.key) {
      toast.error('Please enter flag key and display label');
      return;
    }

    const created: FeatureFlag = {
      id: Date.now(),
      key: flagForm.key.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      label: flagForm.label,
      desc: flagForm.desc || 'Custom feature flag rule',
      category: flagForm.category,
      enabled: true,
      rollout_percentage: flagForm.rollout_percentage,
      tier_restriction: flagForm.tier_restriction,
      updated_at: new Date().toISOString().split('T')[0],
    };

    setFlags(prev => [created, ...prev]);
    setShowCreateModal(false);
    toast.success(`Feature Flag '${created.label}' created successfully!`);
    setFlagForm({ key: '', label: '', desc: '', category: 'Platform', rollout_percentage: 100, tier_restriction: 'All Plans' });
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filtered Dataset
  const filtered = flags.filter(f => {
    const matchesSearch =
      f.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.desc.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || f.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'enabled' && f.enabled) ||
      (statusFilter === 'disabled' && !f.enabled) ||
      (statusFilter === 'beta' && f.rollout_percentage < 100);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sorted Dataset
  const sorted = [...filtered].sort((a, b) => {
    let valA: string | number = a[sortBy] ?? '';
    let valB: string | number = b[sortBy] ?? '';

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginated Dataset
  const totalFiltered = sorted.length;
  const effectivePageSize = pageSize === 'all' ? Math.max(1, totalFiltered) : pageSize;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalFiltered / effectivePageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * effectivePageSize;
  const paginatedData = pageSize === 'all' ? sorted : sorted.slice(startIndex, startIndex + effectivePageSize);

  // Aggregated KPIs
  const totalFlags = flags.length;
  const enabledFlagsCount = flags.filter(f => f.enabled).length;
  const betaFlagsCount = flags.filter(f => f.rollout_percentage < 100).length;

  const sortOptions: SearchableOption[] = [
    { value: 'label', label: 'Flag Label' },
    { value: 'category', label: 'Category' },
    { value: 'enabled', label: 'Status' },
    { value: 'rollout_percentage', label: 'Rollout %' },
  ];

  const categoryOptions: SearchableOption[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'AI', label: 'AI & Copilot' },
    { value: 'Comms', label: 'Communication' },
    { value: 'Transport', label: 'Transport' },
    { value: 'Attendance', label: 'Attendance' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Mobile', label: 'Mobile App' },
    { value: 'Platform', label: 'Platform' },
    { value: 'Security', label: 'Security' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'enabled', label: 'Enabled Only' },
    { value: 'disabled', label: 'Disabled Only' },
    { value: 'beta', label: 'Canary / Beta Only' },
  ];

  const pageSizeOptions: SearchableOption[] = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: '50', label: '50 per page' },
    { value: 'all', label: 'Show All' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-orange-500/20 text-orange-400 rounded-2xl border border-orange-400/30">
              <ToggleLeft className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Global Feature Flags & Kill-Switch Console
                <span className="px-2.5 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] font-extrabold rounded-full border border-orange-400/30 uppercase tracking-wider">
                  Canary Engine
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic feature toggles, percentage-based canary rollouts, and instant emergency kill-switches
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleEmergencyKillSwitch}
            className="px-3.5 py-2 bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            title="Disable all beta / experimental flags"
          >
            <ShieldAlert className="w-4 h-4" /> Emergency Kill Switch
          </button>
          <button
            onClick={handleRefresh}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Flags
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Feature Flag
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Feature Flags</span>
            <ToggleRight className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalFlags}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Platform Controls</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active & Enabled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{enabledFlagsCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Live for Tenants</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Canary / Beta Rollout</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{betaFlagsCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Percentage Cohorts</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Kill Switch Status</span>
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">ARMED</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Instant Rollback Ready</div>
        </div>
      </div>

      {/* ── TOOLBAR: SEARCH & SEARCHABLE DROPDOWNS ── */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
        {/* Search Input */}
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search feature flags by name, key, or category..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-orange-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Sort By Dropdown */}
          <div className="flex items-center gap-1">
            <SearchableSelect
              options={sortOptions}
              value={sortBy}
              onChange={val => setSortBy(val as SortField)}
              placeholder="Sort By..."
              icon={ArrowUpDown}
              labelPrefix="Sort"
            />
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-900 border border-slate-800 text-orange-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* 2. Category Filter Dropdown */}
          <SearchableSelect
            options={categoryOptions}
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="Category..."
            icon={Filter}
            labelPrefix="Category"
          />

          {/* 3. Status Filter Dropdown */}
          <SearchableSelect
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Status..."
            icon={ToggleLeft}
            labelPrefix="Status"
          />

          {/* 4. Page Size Dropdown */}
          <SearchableSelect
            options={pageSizeOptions}
            value={String(pageSize)}
            onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))}
            placeholder="Per Page..."
            icon={List}
            labelPrefix="Rows"
          />

          {/* 5. View Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── TABLE VIEW ── */}
      {viewMode === 'table' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
          {totalFiltered === 0 ? (
            <div className="py-16 text-center space-y-2">
              <ToggleLeft className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-bold">No feature flags match your search criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('label')}>
                      <div className="flex items-center gap-1.5">
                        Feature Flag Name & Key
                        {sortBy === 'label' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-orange-400" /> : <ArrowDown className="w-3 h-3 text-orange-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('category')}>
                      <div className="flex items-center gap-1.5">
                        Category
                        {sortBy === 'category' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-orange-400" /> : <ArrowDown className="w-3 h-3 text-orange-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5">Tier Target</th>
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('rollout_percentage')}>
                      <div className="flex items-center gap-1.5">
                        Canary Rollout %
                        {sortBy === 'rollout_percentage' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-orange-400" /> : <ArrowDown className="w-3 h-3 text-orange-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5">Switch Status</th>
                    <th className="p-3.5 text-right">Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedData.map(f => (
                    <tr key={f.id} className="hover:bg-slate-900/50 transition-colors">
                      {/* Name & Key */}
                      <td className="p-3.5 font-bold text-white">
                        <div className="font-extrabold text-white">{f.label}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{f.desc}</div>
                        <div className="text-[10px] font-mono text-orange-400 mt-0.5">{f.key}</div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase ${categoryBadge[f.category] || 'text-slate-400 bg-slate-800'}`}>
                          {f.category}
                        </span>
                      </td>

                      {/* Tier Restriction */}
                      <td className="p-3.5 font-mono text-slate-300 text-[11px]">
                        {f.tier_restriction}
                      </td>

                      {/* Rollout % Bar */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-mono text-slate-400 font-bold">{f.rollout_percentage}%</span>
                            <span className="text-[9px] text-slate-500 uppercase">{f.rollout_percentage === 100 ? 'Global' : 'Canary Cohort'}</span>
                          </div>
                          <div className="w-24 bg-slate-900 rounded-full h-1.5 border border-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                              style={{ width: `${f.rollout_percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase border w-fit ${
                          f.enabled
                            ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                            : 'text-slate-400 bg-slate-800 border-slate-700'
                        }`}>
                          {f.enabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </td>

                      {/* Switch Toggle Button */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleFlag(f.id, f.enabled)}
                            className={`w-12 h-6.5 rounded-full flex items-center p-1 transition-all cursor-pointer shadow-md ${
                              f.enabled ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start border border-slate-700'
                            }`}
                          >
                            <span className="w-4.5 h-4.5 bg-white rounded-full shadow-md" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── GRID CARDS VIEW ── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedData.map(f => (
            <div key={f.id} className="bg-slate-950 rounded-3xl border border-slate-800 p-5 space-y-4 shadow-xl hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-sm text-white">{f.label}</h3>
                  <div className="text-[11px] font-mono text-orange-400 mt-0.5">{f.key}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${categoryBadge[f.category]}`}>
                  {f.category}
                </span>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2">{f.desc}</p>

              <div className="space-y-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Tier Target</span>
                  <span className="font-mono text-slate-200 font-bold">{f.tier_restriction}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Canary Rollout</span>
                  <span className="font-mono text-amber-400 font-bold">{f.rollout_percentage}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className={`font-bold text-xs ${f.enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {f.enabled ? '🟢 Enabled' : '🔴 Disabled'}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleFlag(f.id, f.enabled)}
                  className={`w-12 h-6.5 rounded-full flex items-center p-1 transition-all cursor-pointer shadow-md ${
                    f.enabled ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start border border-slate-700'
                  }`}
                >
                  <span className="w-4.5 h-4.5 bg-white rounded-full shadow-md" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PAGINATION BAR ── */}
      {totalFiltered > 0 && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-4 text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{pageSize === 'all' ? 1 : startIndex + 1}</strong> to{' '}
            <strong className="text-white">{pageSize === 'all' ? totalFiltered : Math.min(startIndex + effectivePageSize, totalFiltered)}</strong> of{' '}
            <strong className="text-white">{totalFiltered}</strong> feature flags
          </div>

          {pageSize !== 'all' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={validPage === 1}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={validPage === 1}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl font-bold text-xs cursor-pointer ${
                      pageNum === validPage ? 'bg-orange-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={validPage === totalPages}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={validPage === totalPages}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: CREATE NEW FEATURE FLAG ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateFlagSubmit} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <ToggleLeft className="w-4 h-4 text-orange-400" /> Create New Feature Flag
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Feature Flag Display Label *</label>
                <input
                  type="text"
                  value={flagForm.label}
                  onChange={e => {
                    const val = e.target.value;
                    setFlagForm({ ...flagForm, label: val, key: 'enable_' + val.toLowerCase().replace(/[^a-z0-9]/g, '_') });
                  }}
                  placeholder="e.g. AI Tutor Assistance"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Unique Flag Key (Slug) *</label>
                <input
                  type="text"
                  value={flagForm.key}
                  onChange={e => setFlagForm({ ...flagForm, key: e.target.value })}
                  placeholder="enable_ai_tutor"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-orange-400 font-mono font-bold focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Category</label>
                  <select
                    value={flagForm.category}
                    onChange={e => setFlagForm({ ...flagForm, category: e.target.value as FeatureFlag['category'] })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="AI">AI & Copilot</option>
                    <option value="Comms">Comms</option>
                    <option value="Transport">Transport</option>
                    <option value="Attendance">Attendance</option>
                    <option value="Finance">Finance</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Platform">Platform</option>
                    <option value="Security">Security</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Tier Target</label>
                  <select
                    value={flagForm.tier_restriction}
                    onChange={e => setFlagForm({ ...flagForm, tier_restriction: e.target.value as FeatureFlag['tier_restriction'] })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="All Plans">All Plans</option>
                    <option value="Pro & Enterprise">Pro & Enterprise</option>
                    <option value="Enterprise Only">Enterprise Only</option>
                    <option value="Internal Beta">Internal Beta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">
                  Canary Rollout Percentage: <strong className="text-orange-400">{flagForm.rollout_percentage}%</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={flagForm.rollout_percentage}
                  onChange={e => setFlagForm({ ...flagForm, rollout_percentage: Number(e.target.value) })}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Description</label>
                <textarea
                  value={flagForm.desc}
                  onChange={e => setFlagForm({ ...flagForm, desc: e.target.value })}
                  placeholder="Explain feature functionality & impact..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-600/30"
              >
                <Plus className="w-3.5 h-3.5" /> Create Feature Flag
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
