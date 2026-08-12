import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  CreditCard, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, DollarSign, Zap, Star,
  LayoutGrid, Edit2, ToggleLeft, ToggleRight, CheckCircle2
} from 'lucide-react';
import api from '../../../services/api';

export interface SaaSPlanItem {
  id: string;
  plan_id: string;
  plan_title: string;
  monthly_price: string;
  max_students: string;
  storage_quota: string;
  included_features: string;
  status: 'ACTIVE' | 'INACTIVE';
}

type SortField = 'plan_title' | 'monthly_price' | 'max_students';
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

const mockSaaSPlans: SaaSPlanItem[] = [
  {
    id: 'pln-1',
    plan_id: 'PLN-1042',
    plan_title: 'ENTERPRISE SLA PLAN',
    monthly_price: '$1,200 / Month',
    max_students: '10,000 Students',
    storage_quota: '500 GB Storage',
    included_features: 'Biometric Face Recognition, WhatsApp Gateway, Custom Domain, AI Timetable Generator, 24/7 Dedicated Manager',
    status: 'ACTIVE'
  },
  {
    id: 'pln-2',
    plan_id: 'PLN-1038',
    plan_title: 'PRO SLA TIER PLAN',
    monthly_price: '$650 / Month',
    max_students: '5,000 Students',
    storage_quota: '250 GB Storage',
    included_features: 'Biometric Attendance, SMS Broadcast, Custom Subdomain, Online Fees Gateway, Standard Priority Support',
    status: 'ACTIVE'
  },
  {
    id: 'pln-3',
    plan_id: 'PLN-1025',
    plan_title: 'STARTER ACADEMY PLAN',
    monthly_price: '$299 / Month',
    max_students: '1,500 Students',
    storage_quota: '100 GB Storage',
    included_features: 'Core ERP Modules, Daily Attendance, Online Marks & Report Cards, Email Support',
    status: 'ACTIVE'
  },
  {
    id: 'pln-4',
    plan_id: 'PLN-1012',
    plan_title: 'MICRO SCHOOL BASIC PLAN',
    monthly_price: '$149 / Month',
    max_students: '500 Students',
    storage_quota: '50 GB Storage',
    included_features: 'Student Information System, Basic Fee Collection, Notice Board, Community Support',
    status: 'INACTIVE'
  }
];

export default function SaaSPlansPage() {
  const [plans, setPlans] = useState<SaaSPlanItem[]>(mockSaaSPlans);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('plan_title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(6);

  // CRUD Modals
  const [selectedPlan, setSelectedPlan] = useState<SaaSPlanItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SaaSPlanItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formPrice, setFormPrice] = useState('$499 / Month');
  const [formMaxStudents, setFormMaxStudents] = useState('3,000 Students');
  const [formStorage, setFormStorage] = useState('150 GB Storage');
  const [formFeatures, setFormFeatures] = useState('Core ERP Modules, Attendance, SMS Alerts, Fee Collection');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const mrrAmount = 124500;
  const upgradeRatePct = 14.8;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/saas-plans');
      if (res.data.success && Array.isArray(res.data.data)) {
        setPlans(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('SaaS subscription tiers & pricing packages refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder, pageSize]);

  // Toggle Active / Inactive
  const handleToggleStatus = async (id: string, currentStatus: 'ACTIVE' | 'INACTIVE', planTitle: string) => {
    const newStatus: 'ACTIVE' | 'INACTIVE' = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    toast.loading(`Updating '${planTitle}' status to ${newStatus}...`, { id: 'status-toast' });

    try {
      await api.put(`/landlord/saas-plans/${id}`, { status: newStatus });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setPlans(prev => prev.map(p => (p.id === id ? { ...p, status: newStatus } : p)));
      toast.success(`Plan '${planTitle}' is now ${newStatus === 'ACTIVE' ? 'ACTIVE 🟢' : 'INACTIVE 🔴'}!`, { id: 'status-toast' });
    }, 400);
  };

  // Create Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Please enter a Plan Title');
      return;
    }

    toast.loading('Creating new SaaS subscription tier...', { id: 'create-pln-toast' });

    try {
      await api.post('/landlord/saas-plans', {
        plan_title: formTitle,
        monthly_price: formPrice,
        max_students: formMaxStudents,
        storage_quota: formStorage,
        included_features: formFeatures,
        status: formStatus
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newPlan: SaaSPlanItem = {
        id: `pln-${Date.now()}`,
        plan_id: `PLN-${Math.floor(1000 + Math.random() * 9000)}`,
        plan_title: formTitle.toUpperCase(),
        monthly_price: formPrice,
        max_students: formMaxStudents,
        storage_quota: formStorage,
        included_features: formFeatures,
        status: formStatus
      };

      setPlans(prev => [newPlan, ...prev]);
      toast.success(`💎 SaaS Plan '${formTitle.toUpperCase()}' created successfully!`, { id: 'create-pln-toast' });
      setIsAddModalOpen(false);

      // Reset form
      setFormTitle('');
    }, 600);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: SaaSPlanItem) => {
    setEditingPlan(p);
    setFormTitle(p.plan_title);
    setFormPrice(p.monthly_price);
    setFormMaxStudents(p.max_students);
    setFormStorage(p.storage_quota);
    setFormFeatures(p.included_features);
    setFormStatus(p.status);
  };

  // Update Plan
  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    toast.loading(`Updating plan '${editingPlan.plan_title}'...`, { id: 'edit-pln-toast' });

    try {
      await api.put(`/landlord/saas-plans/${editingPlan.id}`, {
        plan_title: formTitle,
        monthly_price: formPrice,
        max_students: formMaxStudents,
        storage_quota: formStorage,
        included_features: formFeatures,
        status: formStatus
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setPlans(prev =>
        prev.map(p =>
          p.id === editingPlan.id
            ? {
                ...p,
                plan_title: formTitle.toUpperCase(),
                monthly_price: formPrice,
                max_students: formMaxStudents,
                storage_quota: formStorage,
                included_features: formFeatures,
                status: formStatus
              }
            : p
        )
      );
      toast.success(`✏️ Plan '${formTitle.toUpperCase()}' updated successfully!`, { id: 'edit-pln-toast' });
      setEditingPlan(null);
    }, 500);
  };

  // Delete / Archive Plan
  const handleDeletePlan = async (id: string, plnId: string) => {
    toast.loading(`Archiving SaaS plan '${plnId}'...`, { id: 'del-pln-toast' });

    try {
      await api.delete(`/landlord/saas-plans/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setPlans(prev => prev.filter(p => p.id !== id));
      toast.success(`🗑️ SaaS plan '${plnId}' archived!`, { id: 'del-pln-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = plans.filter(p => {
    const matchesSearch =
      p.plan_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.plan_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.monthly_price.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.included_features.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

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
    { value: 'ACTIVE', label: 'ACTIVE 🟢' },
    { value: 'INACTIVE', label: 'INACTIVE 🔴' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'plan_title', label: 'Plan Title' },
    { value: 'monthly_price', label: 'Monthly Price' },
    { value: 'max_students', label: 'Student Limit' },
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
              <CreditCard className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                SaaS Subscription Plans, Pricing Tiers & Package Features
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-extrabold rounded-full border border-amber-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 animate-pulse" /> Enterprise Tier Most Popular
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure multi-tenant SaaS subscription plans, active/inactive toggles, student limits, storage quotas, and feature flags
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setFormTitle('');
              setFormPrice('$499 / Month');
              setFormMaxStudents('3,000 Students');
              setFormStorage('150 GB Storage');
              setFormFeatures('Core ERP Modules, Attendance, SMS Alerts, Fee Collection');
              setFormStatus('ACTIVE');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Create Subscription Plan
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Tiers</span>
            <CreditCard className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{plans.filter(p => p.status === 'ACTIVE').length} Active Tiers 💎</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Starter to Enterprise</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Monthly MRR</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">${(mrrAmount / 1000).toFixed(1)}K MRR 📈</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Recurring SaaS Revenue</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Most Popular</span>
            <Star className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-black text-purple-400 truncate">ENTERPRISE SLA</div>
          <div className="text-[10px] text-slate-500 mt-0.5">$1,200 / Mo (64% Adopted)</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Plan Upgrade Rate</span>
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{upgradeRatePct}% Rate 🚀</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Starter to Pro Tiers</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Tenants</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-black text-teal-400 font-mono">1,420 Schools 🏫</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Subscribed Accounts</div>
        </div>
      </div>

      {/* Filter Bar & View Toggle */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by plan ID, title, monthly price, included features..."
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

      {/* Main Content: GRID VIEW vs LIST VIEW */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedData.map(p => (
            <div
              key={p.id}
              className={`bg-slate-950 rounded-3xl border p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 relative overflow-hidden group ${
                p.status === 'ACTIVE'
                  ? 'border-slate-800 hover:border-amber-500/40 hover:shadow-amber-500/5'
                  : 'border-slate-800/60 opacity-65 bg-slate-950/40'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{p.plan_id}</span>
                    <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors mt-0.5">{p.plan_title}</h3>
                  </div>

                  {/* Active / Inactive Toggle Switch Button */}
                  <button
                    onClick={() => handleToggleStatus(p.id, p.status, p.plan_title)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black cursor-pointer transition-all ${
                      p.status === 'ACTIVE'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                    }`}
                    title="Click to toggle Active / Inactive"
                  >
                    {p.status === 'ACTIVE' ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-red-400" />}
                    {p.status}
                  </button>
                </div>

                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-amber-400">{p.monthly_price}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Billed Monthly / Annual</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Students Limit</div>
                    <div className="text-white font-bold text-sm mt-0.5">{p.max_students}</div>
                  </div>
                  <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Storage Quota</div>
                    <div className="text-purple-400 font-bold text-sm mt-0.5">{p.storage_quota}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Included Features:</div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-1">
                    {p.included_features.split(',').map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="truncate">{feat.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedPlan(p)}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" /> View Spec
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeletePlan(p.id, p.plan_id)}
                    className="p-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl cursor-pointer transition-all"
                    title="Archive Plan"
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
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('plan_title')}>Plan Title & ID</th>
                  <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('monthly_price')}>Monthly Pricing</th>
                  <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('max_students')}>Student Limit</th>
                  <th className="p-3.5 font-mono">Storage Quota</th>
                  <th className="p-3.5 font-mono">Included Features</th>
                  <th className="p-3.5">Active Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedData.map(p => (
                  <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-bold text-white font-mono">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="text-sm text-white font-extrabold">{p.plan_title}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{p.plan_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-amber-400 font-bold">{p.monthly_price}</td>
                    <td className="p-3.5 font-mono text-[10px] text-indigo-400 font-bold">{p.max_students}</td>
                    <td className="p-3.5 font-mono text-[10px] text-purple-400 font-bold">{p.storage_quota}</td>
                    <td className="p-3.5 font-mono text-[10px] text-slate-400 max-w-[200px] truncate">{p.included_features}</td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleStatus(p.id, p.status, p.plan_title)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase cursor-pointer transition-all ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                        }`}
                      >
                        {p.status === 'ACTIVE' ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5 text-red-400" />}
                        {p.status}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPlan(p)}
                          className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" /> Spec
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="px-2.5 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeletePlan(p.id, p.plan_id)}
                          className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                          title="Archive Plan"
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

      {/* CREATE PLAN MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Create SaaS Subscription Tier Plan</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Plan Title / Name *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. ULTIMATE ACADEMY TIER"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Monthly Pricing</label>
                  <input
                    type="text"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    placeholder="$499 / Month"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Max Student Limit</label>
                  <input
                    type="text"
                    value={formMaxStudents}
                    onChange={e => setFormMaxStudents(e.target.value)}
                    placeholder="3,000 Students"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Storage Quota</label>
                  <input
                    type="text"
                    value={formStorage}
                    onChange={e => setFormStorage(e.target.value)}
                    placeholder="150 GB Storage"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Initial Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="ACTIVE">ACTIVE 🟢</option>
                    <option value="INACTIVE">INACTIVE 🔴</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Included Features (Comma Separated)</label>
                <textarea
                  rows={3}
                  value={formFeatures}
                  onChange={e => setFormFeatures(e.target.value)}
                  placeholder="Biometric, SMS, Custom Subdomain, Online Fees Gateway"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 text-xs"
                />
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
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PLAN MODAL */}
      {editingPlan && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Edit SaaS Subscription Plan ({editingPlan.plan_id})</h3>
              </div>
              <button onClick={() => setEditingPlan(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePlan} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Plan Title / Name *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Monthly Pricing</label>
                  <input
                    type="text"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Max Student Limit</label>
                  <input
                    type="text"
                    value={formMaxStudents}
                    onChange={e => setFormMaxStudents(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Storage Quota</label>
                  <input
                    type="text"
                    value={formStorage}
                    onChange={e => setFormStorage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Active Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="ACTIVE">ACTIVE 🟢</option>
                    <option value="INACTIVE">INACTIVE 🔴</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Included Features (Comma Separated)</label>
                <textarea
                  rows={3}
                  value={formFeatures}
                  onChange={e => setFormFeatures(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer"
                >
                  Update Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLAN INSPECTOR MODAL */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">SaaS Plan Specification ({selectedPlan.plan_id})</h3>
              </div>
              <button onClick={() => setSelectedPlan(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-amber-400 text-base font-black">{selectedPlan.plan_title}</div>
                <div className="text-slate-300 text-sm font-bold">Pricing: {selectedPlan.monthly_price}</div>
                <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px] pt-1">
                  <div>Students Limit: <span className="text-white font-bold">{selectedPlan.max_students}</span></div>
                  <div>Storage Quota: <span className="text-purple-400 font-bold">{selectedPlan.storage_quota}</span></div>
                </div>
                <div className="pt-2 text-slate-300 text-[11px]">
                  <span className="text-slate-500 font-bold uppercase block mb-1">Features Package:</span>
                  {selectedPlan.included_features}
                </div>
                <div className="pt-1 text-[11px]">
                  Status: <span className={selectedPlan.status === 'ACTIVE' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{selectedPlan.status}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPlan(null)}
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
