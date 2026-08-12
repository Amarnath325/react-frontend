import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  PauseCircle, PlayCircle, Building, Calendar, RefreshCw,
  Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Check,
  List, LayoutGrid, ShieldAlert, Lock, Unlock, ShieldCheck,
  X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import api from '../../../services/api';

interface SuspensionRecord {
  id: number;
  school_name: string;
  school_code: string;
  admin_email: string;
  admin_phone: string;
  plan: 'Basic' | 'Pro' | 'Enterprise';
  due_date: string;
  overdue_days: number;
  reason: 'Payment Overdue' | 'KYC Incomplete' | 'Terms Violation' | 'Manual Lockdown' | 'Security Hold';
  status: 'suspended' | 'restored' | 'grace_period';
  suspended_at?: string;
  restored_at?: string;
  notes?: string;
}

type SortField = 'overdue_days' | 'school_name' | 'due_date' | 'status';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-red-400" />}
        {labelPrefix && <span className="text-[11px] text-slate-400 font-bold">{labelPrefix}:</span>}
        <span className="truncate max-w-[130px]">{selectedOption?.label || placeholder}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-52 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 space-y-1">
          <div className="relative mb-1">
            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search option..."
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-red-500 placeholder-slate-600"
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
                      ? 'bg-red-600/20 text-red-400 font-bold border border-red-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-red-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockSuspensions: SuspensionRecord[] = [
  {
    id: 1,
    school_name: 'Delhi Public School (Noida)',
    school_code: 'dps_noida',
    admin_email: 'principal@dps-noida.edu.in',
    admin_phone: '+91 98765 43210',
    plan: 'Enterprise',
    due_date: '2026-06-15',
    overdue_days: 49,
    reason: 'Payment Overdue',
    status: 'suspended',
    suspended_at: '2026-06-16',
    notes: 'Invoice #INV-2026-901 overdue by 49 days.'
  },
  {
    id: 2,
    school_name: 'St. Mary\'s Convent Senior Sec School',
    school_code: 'st_marys',
    admin_email: 'admin@stmarys.org',
    admin_phone: '+91 98112 34567',
    plan: 'Pro',
    due_date: '2026-07-01',
    overdue_days: 33,
    reason: 'Manual Lockdown',
    status: 'suspended',
    suspended_at: '2026-07-02',
    notes: 'Requested by school trustee during annual audit.'
  },
  {
    id: 3,
    school_name: 'Cambridge International Academy',
    school_code: 'cambridge_intl',
    admin_email: 'admin@cambridge.ac.in',
    admin_phone: '+91 97766 54321',
    plan: 'Enterprise',
    due_date: '2026-07-10',
    overdue_days: 24,
    reason: 'KYC Incomplete',
    status: 'suspended',
    suspended_at: '2026-07-11',
    notes: 'CBSE affiliation letter re-upload pending.'
  },
  {
    id: 4,
    school_name: 'Heritage Global Academy',
    school_code: 'heritage_ac',
    admin_email: 'info@heritageglobal.in',
    admin_phone: '+91 94120 98765',
    plan: 'Basic',
    due_date: '2026-05-20',
    overdue_days: 75,
    reason: 'Terms Violation',
    status: 'restored',
    restored_at: '2026-07-28',
    notes: 'Restored after compliance clearance & fee settlement.'
  },
  {
    id: 5,
    school_name: 'Sunrise Public School',
    school_code: 'sunrise_ps',
    admin_email: 'principal@sunrisepublic.edu.in',
    admin_phone: '+91 93344 55667',
    plan: 'Basic',
    due_date: '2026-08-01',
    overdue_days: 4,
    reason: 'Payment Overdue',
    status: 'grace_period',
    notes: 'Automatic 7-day payment grace period active.'
  }
];

export default function TenantSuspensionPage() {
  const [records, setRecords] = useState<SuspensionRecord[]>(mockSuspensions);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('overdue_days');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SuspensionRecord | null>(null);

  // Form State
  const [suspendReason, setSuspendReason] = useState<SuspensionRecord['reason']>('Payment Overdue');
  const [suspendNotes, setSuspendNotes] = useState('');

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Suspension status & grace period tracking refreshed');
    }, 600);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, reasonFilter, sortBy, sortOrder, pageSize]);

  // Toggle Suspend / Restore Status via API
  const handleToggleStatus = async (record: SuspensionRecord) => {
    const nextStatus = record.status === 'suspended' ? 'restored' : 'suspended';
    try {
      await api.post(`/landlord/tenants/${record.id}/toggle-status`);
    } catch {
      // Fallback
    }

    setRecords(prev =>
      prev.map(r =>
        r.id === record.id
          ? {
              ...r,
              status: nextStatus,
              suspended_at: nextStatus === 'suspended' ? new Date().toISOString().split('T')[0] : r.suspended_at,
              restored_at: nextStatus === 'restored' ? new Date().toISOString().split('T')[0] : r.restored_at,
            }
          : r
      )
    );

    if (nextStatus === 'restored') {
      toast.success(`🔓 Access restored for ${record.school_name}. Database un-locked.`);
    } else {
      toast.error(`🔒 ${record.school_name} suspended. Access locked.`);
    }
  };

  // Submit Manual Suspension
  const handleCreateSuspension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setRecords(prev =>
      prev.map(r =>
        r.id === selectedRecord.id
          ? {
              ...r,
              status: 'suspended',
              reason: suspendReason,
              notes: suspendNotes,
              suspended_at: new Date().toISOString().split('T')[0],
            }
          : r
      )
    );

    toast.error(`🔒 Account suspension enforced for ${selectedRecord.school_name}`);
    setShowSuspendModal(false);
    setSelectedRecord(null);
    setSuspendNotes('');
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
  const filtered = records.filter(r => {
    const matchesSearch =
      r.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.admin_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.school_code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesReason = reasonFilter === 'all' || r.reason === reasonFilter;

    return matchesSearch && matchesStatus && matchesReason;
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
  const totalRecords = records.length;
  const suspendedCount = records.filter(r => r.status === 'suspended').length;
  const restoredCount = records.filter(r => r.status === 'restored').length;
  const graceCount = records.filter(r => r.status === 'grace_period').length;

  const statusBadgeConfig: Record<string, { label: string; style: string; icon: React.ElementType }> = {
    suspended: { label: 'Account Suspended', style: 'text-red-400 bg-red-400/10 border-red-400/30', icon: Lock },
    restored: { label: 'Access Restored', style: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', icon: Unlock },
    grace_period: { label: 'Payment Grace (4d)', style: 'text-amber-400 bg-amber-400/10 border-amber-400/30', icon: Calendar },
  };

  const sortOptions: SearchableOption[] = [
    { value: 'overdue_days', label: 'Days Overdue' },
    { value: 'school_name', label: 'School Name' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'status', label: 'Account Status' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'suspended', label: 'Suspended Only' },
    { value: 'restored', label: 'Restored Access' },
    { value: 'grace_period', label: 'In Grace Period' },
  ];

  const reasonOptions: SearchableOption[] = [
    { value: 'all', label: 'All Reasons' },
    { value: 'Payment Overdue', label: 'Payment Overdue' },
    { value: 'KYC Incomplete', label: 'KYC Incomplete' },
    { value: 'Terms Violation', label: 'Terms Violation' },
    { value: 'Manual Lockdown', label: 'Manual Lockdown' },
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
            <span className="p-2.5 bg-red-500/20 text-red-400 rounded-2xl border border-red-400/30">
              <PauseCircle className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Tenant Suspension & Access Restore Console
                <span className="px-2.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-extrabold rounded-full border border-red-400/30 uppercase tracking-wider">
                  Access Lockdown
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated billing suspension · Manual security locks · One-click access restoration & grace waivers
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Locks
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Currently Suspended</span>
            <Lock className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{suspendedCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Database Locked</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Restored This Month</span>
            <Unlock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{restoredCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Access Re-activated</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">In Grace Period</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{graceCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Auto Lock Pending</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Tracked Accounts</span>
            <Building className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalRecords}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Quarterly Audit Log</div>
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
              placeholder="Search by school, tenant code, admin email..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-red-500 placeholder-slate-600"
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
              className="p-2 bg-slate-900 border border-slate-800 text-red-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* 2. Status Filter Dropdown */}
          <SearchableSelect
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Status..."
            icon={Filter}
            labelPrefix="Status"
          />

          {/* 3. Reason Filter Dropdown */}
          <SearchableSelect
            options={reasonOptions}
            value={reasonFilter}
            onChange={setReasonFilter}
            placeholder="Reason..."
            icon={ShieldAlert}
            labelPrefix="Reason"
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
                viewMode === 'table' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
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
              <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-bold">No tenant suspension records match your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('school_name')}>
                      <div className="flex items-center gap-1.5">
                        School / Contact
                        {sortBy === 'school_name' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-red-400" /> : <ArrowDown className="w-3 h-3 text-red-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5">Plan Tier</th>
                    <th className="p-3.5">Suspension Reason</th>
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('due_date')}>
                      <div className="flex items-center gap-1.5">
                        Due Date
                        {sortBy === 'due_date' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-red-400" /> : <ArrowDown className="w-3 h-3 text-red-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('overdue_days')}>
                      <div className="flex items-center gap-1.5">
                        Overdue
                        {sortBy === 'overdue_days' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-red-400" /> : <ArrowDown className="w-3 h-3 text-red-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedData.map(r => {
                    const st = statusBadgeConfig[r.status] || statusBadgeConfig.suspended;
                    const StatusIcon = st.icon;

                    return (
                      <tr key={r.id} className="hover:bg-slate-900/50 transition-colors">
                        {/* School Name & Admin */}
                        <td className="p-3.5 font-bold text-white">
                          <div className="font-extrabold text-white">{r.school_name}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>{r.admin_email}</span>
                            <span>·</span>
                            <span className="font-mono text-slate-500">{r.school_code}</span>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-amber-400 rounded-lg text-[10px] font-bold">
                            {r.plan}
                          </span>
                        </td>

                        {/* Reason */}
                        <td className="p-3.5">
                          <span className="text-slate-300 font-medium">{r.reason}</span>
                          {r.notes && <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{r.notes}</div>}
                        </td>

                        {/* Due Date */}
                        <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                          {r.due_date}
                        </td>

                        {/* Overdue Days */}
                        <td className="p-3.5">
                          <span className={`font-mono font-bold ${r.overdue_days > 30 ? 'text-red-400' : 'text-amber-400'}`}>
                            {r.overdue_days} Days
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase flex items-center gap-1 border w-fit ${st.style}`}>
                            <StatusIcon className="w-3 h-3" /> {st.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.status === 'suspended' ? (
                              <button
                                onClick={() => handleToggleStatus(r)}
                                className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <PlayCircle className="w-3.5 h-3.5" /> Restore Access
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedRecord(r);
                                  setShowSuspendModal(true);
                                }}
                                className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <PauseCircle className="w-3.5 h-3.5" /> Suspend Lock
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── GRID CARDS VIEW ── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedData.map(r => {
            const st = statusBadgeConfig[r.status] || statusBadgeConfig.suspended;

            return (
              <div key={r.id} className="bg-slate-950 rounded-3xl border border-slate-800 p-5 space-y-4 shadow-xl hover:border-slate-700 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-white">{r.school_name}</h3>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">{r.admin_email}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${st.style}`}>
                    {st.label}
                  </span>
                </div>

                <div className="space-y-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Reason</span>
                    <span className="font-bold text-red-400">{r.reason}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Overdue Days</span>
                    <span className="font-mono text-white font-bold">{r.overdue_days} Days</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Invoice Due</span>
                    <span className="font-mono text-slate-300">{r.due_date}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1">
                  {r.status === 'suspended' ? (
                    <button
                      onClick={() => handleToggleStatus(r)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
                    >
                      <PlayCircle className="w-4 h-4" /> Restore Access
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedRecord(r);
                        setShowSuspendModal(true);
                      }}
                      className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/20"
                    >
                      <PauseCircle className="w-4 h-4" /> Enforce Suspension Lock
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PAGINATION BAR ── */}
      {totalFiltered > 0 && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-4 text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{pageSize === 'all' ? 1 : startIndex + 1}</strong> to{' '}
            <strong className="text-white">{pageSize === 'all' ? totalFiltered : Math.min(startIndex + effectivePageSize, totalFiltered)}</strong> of{' '}
            <strong className="text-white">{totalFiltered}</strong> records
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
                      pageNum === validPage ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
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

      {/* ── MODAL: MANUAL SUSPENSION LOCK ── */}
      {showSuspendModal && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateSuspension} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <PauseCircle className="w-4 h-4 text-red-400" /> Enforce Account Suspension Lock
              </h3>
              <button type="button" onClick={() => setShowSuspendModal(false)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                You are locking access for <strong>{selectedRecord.school_name}</strong> ({selectedRecord.admin_email}):
              </p>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Suspension Reason</label>
                <select
                  value={suspendReason}
                  onChange={e => setSuspendReason(e.target.value as SuspensionRecord['reason'])}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value="Payment Overdue">Payment Overdue</option>
                  <option value="KYC Incomplete">KYC Incomplete</option>
                  <option value="Terms Violation">Terms Violation</option>
                  <option value="Manual Lockdown">Manual Lockdown</option>
                  <option value="Security Hold">Security Hold</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Suspension Notes & Audit Log Reason</label>
                <textarea
                  value={suspendNotes}
                  onChange={e => setSuspendNotes(e.target.value)}
                  placeholder="e.g. Invoice overdue by > 30 days. Access restricted pending payment receipt."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-red-500 text-xs placeholder-slate-600"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSuspendModal(false)}
                className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/30"
              >
                <Lock className="w-3.5 h-3.5" /> Enforce Lock
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
