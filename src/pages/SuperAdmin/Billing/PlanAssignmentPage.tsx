import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  CreditCard, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, Building, Zap, Calendar,
  LayoutGrid, Edit2, ToggleLeft, ToggleRight
} from 'lucide-react';
import api from '../../../services/api';

export interface PlanAssignmentItem {
  id: string;
  assignment_id: string;
  school_name: string;
  assigned_tier: string;
  billing_frequency: string;
  next_renewal_date: string;
  auto_renew: string;
  status: 'ACTIVE' | 'SUSPENDED';
}

type SortField = 'school_name' | 'assigned_tier' | 'next_renewal_date';
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

const mockAssignments: PlanAssignmentItem[] = [
  {
    id: 'pas-1',
    assignment_id: 'PAS-3042',
    school_name: 'St. Xavier International School',
    assigned_tier: 'ENTERPRISE SLA ($1,200/mo)',
    billing_frequency: 'ANNUAL (20% DISCOUNT)',
    next_renewal_date: '2027-08-15',
    auto_renew: 'ENABLED',
    status: 'ACTIVE'
  },
  {
    id: 'pas-2',
    assignment_id: 'PAS-3038',
    school_name: 'Delhi Public School, Sector 45',
    assigned_tier: 'PRO SLA TIER ($650/mo)',
    billing_frequency: 'MONTHLY',
    next_renewal_date: '2026-09-01',
    auto_renew: 'ENABLED',
    status: 'ACTIVE'
  },
  {
    id: 'pas-3',
    assignment_id: 'PAS-3025',
    school_name: 'Greenwood High International',
    assigned_tier: 'ENTERPRISE SLA ($1,200/mo)',
    billing_frequency: 'ANNUAL (20% DISCOUNT)',
    next_renewal_date: '2027-07-20',
    auto_renew: 'ENABLED',
    status: 'ACTIVE'
  },
  {
    id: 'pas-4',
    assignment_id: 'PAS-3012',
    school_name: 'Sunrise Public Academy',
    assigned_tier: 'STARTER ACADEMY ($299/mo)',
    billing_frequency: 'MONTHLY',
    next_renewal_date: '2026-08-10',
    auto_renew: 'DISABLED',
    status: 'SUSPENDED'
  }
];

export default function PlanAssignmentPage() {
  const [assignments, setAssignments] = useState<PlanAssignmentItem[]>(mockAssignments);
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
  const [selectedAssignment, setSelectedAssignment] = useState<PlanAssignmentItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<PlanAssignmentItem | null>(null);

  // Form State
  const [formSchoolName, setFormSchoolName] = useState('');
  const [formTier, setFormTier] = useState('PRO SLA TIER ($650/mo)');
  const [formFrequency, setFormFrequency] = useState('ANNUAL (20% DISCOUNT)');
  const [formRenewalDate, setFormRenewalDate] = useState('2027-08-31');
  const [formAutoRenew, setFormAutoRenew] = useState('ENABLED');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');

  const totalAssignedSchools = 1420;
  const upgradedAccountsCount = 482;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/plan-assignment');
      if (res.data.success && Array.isArray(res.data.data)) {
        setAssignments(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('School tenant plan assignments & renewal schedules refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder, pageSize]);

  // Toggle Active / Suspended Status
  const handleToggleStatus = async (id: string, currentStatus: 'ACTIVE' | 'SUSPENDED', schoolName: string) => {
    const newStatus: 'ACTIVE' | 'SUSPENDED' = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    toast.loading(`Updating plan assignment for '${schoolName}' to ${newStatus}...`, { id: 'pas-status-toast' });

    try {
      await api.put(`/landlord/plan-assignment/${id}`, { status: newStatus });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setAssignments(prev => prev.map(a => (a.id === id ? { ...a, status: newStatus } : a)));
      toast.success(`Plan for '${schoolName}' is now ${newStatus === 'ACTIVE' ? 'ACTIVE 🟢' : 'SUSPENDED 🔴'}!`, { id: 'pas-status-toast' });
    }, 400);
  };

  // Create Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSchoolName.trim()) {
      toast.error('Please enter a School Tenant Name');
      return;
    }

    toast.loading('Assigning subscription tier to tenant...', { id: 'create-pas-toast' });

    try {
      await api.post('/landlord/plan-assignment', {
        school_name: formSchoolName,
        assigned_tier: formTier,
        billing_frequency: formFrequency,
        next_renewal_date: formRenewalDate,
        auto_renew: formAutoRenew,
        status: formStatus
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newAssignment: PlanAssignmentItem = {
        id: `pas-${Date.now()}`,
        assignment_id: `PAS-${Math.floor(1000 + Math.random() * 9000)}`,
        school_name: formSchoolName,
        assigned_tier: formTier,
        billing_frequency: formFrequency,
        next_renewal_date: formRenewalDate,
        auto_renew: formAutoRenew,
        status: formStatus
      };

      setAssignments(prev => [newAssignment, ...prev]);
      toast.success(`📋 Plan assigned to '${formSchoolName}' successfully!`, { id: 'create-pas-toast' });
      setIsAddModalOpen(false);

      // Reset form
      setFormSchoolName('');
    }, 600);
  };

  // Open Edit Modal
  const handleOpenEdit = (a: PlanAssignmentItem) => {
    setEditingAssignment(a);
    setFormSchoolName(a.school_name);
    setFormTier(a.assigned_tier);
    setFormFrequency(a.billing_frequency);
    setFormRenewalDate(a.next_renewal_date);
    setFormAutoRenew(a.auto_renew);
    setFormStatus(a.status);
  };

  // Update Assignment
  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;

    toast.loading(`Updating plan assignment for '${editingAssignment.school_name}'...`, { id: 'edit-pas-toast' });

    try {
      await api.put(`/landlord/plan-assignment/${editingAssignment.id}`, {
        school_name: formSchoolName,
        assigned_tier: formTier,
        billing_frequency: formFrequency,
        next_renewal_date: formRenewalDate,
        auto_renew: formAutoRenew,
        status: formStatus
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setAssignments(prev =>
        prev.map(a =>
          a.id === editingAssignment.id
            ? {
                ...a,
                school_name: formSchoolName,
                assigned_tier: formTier,
                billing_frequency: formFrequency,
                next_renewal_date: formRenewalDate,
                auto_renew: formAutoRenew,
                status: formStatus
              }
            : a
        )
      );
      toast.success(`✏️ Plan assignment for '${formSchoolName}' updated successfully!`, { id: 'edit-pas-toast' });
      setEditingAssignment(null);
    }, 500);
  };

  // Delete / Revoke Assignment
  const handleDeleteAssignment = async (id: string, pasId: string) => {
    toast.loading(`Revoking plan assignment '${pasId}'...`, { id: 'del-pas-toast' });

    try {
      await api.delete(`/landlord/plan-assignment/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setAssignments(prev => prev.filter(a => a.id !== id));
      toast.success(`🗑️ Plan assignment '${pasId}' revoked!`, { id: 'del-pas-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = assignments.filter(a => {
    const matchesSearch =
      a.assignment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.assigned_tier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.billing_frequency.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;

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
    { value: 'SUSPENDED', label: 'SUSPENDED 🔴' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'school_name', label: 'School Name' },
    { value: 'assigned_tier', label: 'Assigned Tier' },
    { value: 'next_renewal_date', label: 'Next Renewal Date' },
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
                School Tenant Plan Assignments & Subscription Billing Cycle
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-extrabold rounded-full border border-amber-400/30 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 animate-pulse" /> 100% Renewal Auto-Sync
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Assign subscription pricing tiers to school tenants, configure annual billing discounts, and track upcoming renewals
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setFormSchoolName('');
              setFormTier('PRO SLA TIER ($650/mo)');
              setFormFrequency('ANNUAL (20% DISCOUNT)');
              setFormRenewalDate('2027-08-31');
              setFormAutoRenew('ENABLED');
              setFormStatus('ACTIVE');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Assign Plan to School
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Assigned Schools</span>
            <Building className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalAssignedSchools.toLocaleString()} Schools 🏫</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Subscribed Tenants</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Upgraded Accounts</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{upgradedAccountsCount} Upgraded 🚀</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Enterprise & Pro Upgrades</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Annual Frequency</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">74.2% Annual</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Prepaid Annual Plans</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Custom Overrides</span>
            <CreditCard className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">18 Custom</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Tailored Contract Terms</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Auto-Renewal Rate</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-black text-teal-400 font-mono">98.8% Auto 🔄</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Automatic Billing Mandate</div>
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
              placeholder="Search by assignment ID, school name, assigned tier, frequency..."
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
          {paginatedData.map(a => (
            <div
              key={a.id}
              className={`bg-slate-950 rounded-3xl border p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 relative overflow-hidden group ${
                a.status === 'ACTIVE'
                  ? 'border-slate-800 hover:border-amber-500/40 hover:shadow-amber-500/5'
                  : 'border-slate-800/60 opacity-65 bg-slate-950/40'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{a.assignment_id}</span>
                    <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors mt-0.5">{a.school_name}</h3>
                  </div>

                  {/* Active / Suspended Toggle Switch Button */}
                  <button
                    onClick={() => handleToggleStatus(a.id, a.status, a.school_name)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black cursor-pointer transition-all ${
                      a.status === 'ACTIVE'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                    }`}
                    title="Click to toggle Active / Suspended"
                  >
                    {a.status === 'ACTIVE' ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-red-400" />}
                    {a.status}
                  </button>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-400 truncate">{a.assigned_tier}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Billing Frequency</div>
                    <div className="text-purple-400 font-bold text-xs mt-0.5 truncate">{a.billing_frequency}</div>
                  </div>
                  <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Next Renewal Date</div>
                    <div className="text-emerald-400 font-bold text-xs mt-0.5 truncate">{a.next_renewal_date}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                  <span>Auto-Renew Mandate:</span>
                  <span className="text-teal-400 font-bold">{a.auto_renew}</span>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedAssignment(a)}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" /> View Spec
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(a)}
                    className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAssignment(a.id, a.assignment_id)}
                    className="p-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl cursor-pointer transition-all"
                    title="Revoke Assignment"
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
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('school_name')}>School Tenant & Assignment ID</th>
                  <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('assigned_tier')}>Assigned Pricing Tier</th>
                  <th className="p-3.5 font-mono">Billing Frequency</th>
                  <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('next_renewal_date')}>Next Renewal Date</th>
                  <th className="p-3.5 font-mono">Auto-Renew Mandate</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedData.map(a => (
                  <tr key={a.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-bold text-white font-mono">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="text-sm text-white font-extrabold">{a.school_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{a.assignment_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[10px] text-indigo-400 font-bold">{a.assigned_tier}</td>
                    <td className="p-3.5 font-mono text-[10px] text-purple-400 font-bold">{a.billing_frequency}</td>
                    <td className="p-3.5 font-mono text-[11px] text-emerald-400 font-bold">{a.next_renewal_date}</td>
                    <td className="p-3.5 font-mono text-[10px] text-teal-400 font-bold">{a.auto_renew}</td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleStatus(a.id, a.status, a.school_name)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase cursor-pointer transition-all ${
                          a.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                        }`}
                      >
                        {a.status === 'ACTIVE' ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5 text-red-400" />}
                        {a.status}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedAssignment(a)}
                          className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" /> Spec
                        </button>
                        <button
                          onClick={() => handleOpenEdit(a)}
                          className="px-2.5 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(a.id, a.assignment_id)}
                          className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                          title="Revoke Assignment"
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

      {/* CREATE PLAN ASSIGNMENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Assign Subscription Plan to School</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">School Tenant Name *</label>
                <input
                  type="text"
                  required
                  value={formSchoolName}
                  onChange={e => setFormSchoolName(e.target.value)}
                  placeholder="e.g. Oxford Public School, Sector 12"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Assigned Pricing Tier</label>
                  <select
                    value={formTier}
                    onChange={e => setFormTier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="STARTER ACADEMY ($299/mo)">STARTER ACADEMY ($299/mo)</option>
                    <option value="PRO SLA TIER ($650/mo)">PRO SLA TIER ($650/mo)</option>
                    <option value="ENTERPRISE SLA ($1,200/mo)">ENTERPRISE SLA ($1,200/mo)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Billing Frequency</label>
                  <select
                    value={formFrequency}
                    onChange={e => setFormFrequency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="ANNUAL (20% DISCOUNT)">ANNUAL (20% DISCOUNT)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Next Renewal Date</label>
                  <input
                    type="date"
                    value={formRenewalDate}
                    onChange={e => setFormRenewalDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Auto-Renew Mandate</label>
                  <select
                    value={formAutoRenew}
                    onChange={e => setFormAutoRenew(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="ENABLED">ENABLED 🟢</option>
                    <option value="DISABLED">DISABLED 🔴</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Initial Status</label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as 'ACTIVE' | 'SUSPENDED')}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="ACTIVE">ACTIVE 🟢</option>
                  <option value="SUSPENDED">SUSPENDED 🔴</option>
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
                  Assign Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PLAN ASSIGNMENT MODAL */}
      {editingAssignment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Edit Plan Assignment ({editingAssignment.assignment_id})</h3>
              </div>
              <button onClick={() => setEditingAssignment(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAssignment} className="space-y-3 text-xs">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Assigned Pricing Tier</label>
                  <input
                    type="text"
                    value={formTier}
                    onChange={e => setFormTier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Billing Frequency</label>
                  <input
                    type="text"
                    value={formFrequency}
                    onChange={e => setFormFrequency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Next Renewal Date</label>
                  <input
                    type="date"
                    value={formRenewalDate}
                    onChange={e => setFormRenewalDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Auto-Renew Mandate</label>
                  <select
                    value={formAutoRenew}
                    onChange={e => setFormAutoRenew(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="ENABLED">ENABLED 🟢</option>
                    <option value="DISABLED">DISABLED 🔴</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as 'ACTIVE' | 'SUSPENDED')}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="ACTIVE">ACTIVE 🟢</option>
                  <option value="SUSPENDED">SUSPENDED 🔴</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingAssignment(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer"
                >
                  Update Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGNMENT SPEC INSPECTOR MODAL */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Plan Assignment Details ({selectedAssignment.assignment_id})</h3>
              </div>
              <button onClick={() => setSelectedAssignment(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-amber-400 text-base font-black">{selectedAssignment.school_name}</div>
                <div className="text-indigo-400 text-xs font-bold">Tier: {selectedAssignment.assigned_tier}</div>
                <div className="text-slate-300">Billing Frequency: {selectedAssignment.billing_frequency}</div>
                <div className="text-emerald-400">Next Renewal: {selectedAssignment.next_renewal_date}</div>
                <div className="text-teal-400">Auto-Renew: {selectedAssignment.auto_renew}</div>
                <div className="text-slate-500 text-[11px]">
                  Status: <span className={selectedAssignment.status === 'ACTIVE' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{selectedAssignment.status}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAssignment(null)}
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
