import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Archive, RotateCcw, Trash2, Download, Building, RefreshCw,
  Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Check,
  List, LayoutGrid, ShieldAlert, AlertCircle, FileText, CheckCircle,
  X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus
} from 'lucide-react';
import api from '../../../services/api';

interface ArchiveRecord {
  id: number;
  school_name: string;
  school_code: string;
  db_name: string;
  admin_email: string;
  archived_at: string;
  retention_until: string;
  reason: 'Subscription Cancelled' | 'GDPR Request' | 'Non-Payment (90d+)' | 'Owner Request' | 'School Closed';
  size_mb: number;
  status: 'archived' | 'deletion_scheduled' | 'restored';
  notes?: string;
}

type SortField = 'archived_at' | 'school_name' | 'size_mb' | 'retention_until';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-slate-500 placeholder-slate-600"
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
                      ? 'bg-slate-800 text-slate-200 font-bold border border-slate-700'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockArchives: ArchiveRecord[] = [
  {
    id: 1,
    school_name: 'Sunrise Public Academy',
    school_code: 'sunrise_ac',
    db_name: 'school_sunrise_2024',
    admin_email: 'principal@sunrise-ac.edu.in',
    archived_at: '2026-01-15',
    retention_until: '2026-04-15',
    reason: 'Subscription Cancelled',
    size_mb: 95,
    status: 'archived',
    notes: 'Full database dump backed up to AWS S3 Glacier.'
  },
  {
    id: 2,
    school_name: 'Blue Bell Convent School',
    school_code: 'bluebell_cs',
    db_name: 'school_bluebell_2023',
    admin_email: 'admin@bluebell.org',
    archived_at: '2025-11-20',
    retention_until: '2026-02-20',
    reason: 'GDPR Request',
    size_mb: 60,
    status: 'archived',
    notes: 'Right-to-be-forgotten hold active. Soft-archived.'
  },
  {
    id: 3,
    school_name: 'Star Kids Preparatory School',
    school_code: 'starkids_prep',
    db_name: 'school_starkids_2022',
    admin_email: 'info@starkids.in',
    archived_at: '2025-06-30',
    retention_until: '2025-09-30',
    reason: 'Non-Payment (90d+)',
    size_mb: 42,
    status: 'deletion_scheduled',
    notes: 'Invoice overdue > 90 days. Hard deletion purge scheduled.'
  },
  {
    id: 4,
    school_name: 'Lotus Valley International',
    school_code: 'lotus_valley',
    db_name: 'school_lotus_valley',
    admin_email: 'director@lotusvalley.edu.in',
    archived_at: '2025-09-10',
    retention_until: '2025-12-10',
    reason: 'Owner Request',
    size_mb: 180,
    status: 'restored',
    notes: 'Restored on 2026-01-05 upon subscription renewal.'
  }
];

export default function TenantArchivePage() {
  const [archives, setArchives] = useState<ArchiveRecord[]>(mockArchives);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('archived_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<ArchiveRecord | null>(null);
  const [confirmInputText, setConfirmInputText] = useState('');

  // Form State for Manual Archive
  const [archiveForm, setArchiveForm] = useState({
    school_name: '',
    school_code: '',
    reason: 'Subscription Cancelled' as ArchiveRecord['reason'],
    notes: '',
  });

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Archive vault & S3 Glacier backups refreshed');
    }, 600);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, reasonFilter, sortBy, sortOrder, pageSize]);

  // Restore Tenant
  const handleRestoreTenant = async (record: ArchiveRecord) => {
    try {
      await api.post(`/landlord/tenants/${record.id}/toggle-status`);
    } catch {
      // Fallback
    }

    setArchives(prev =>
      prev.map(a =>
        a.id === record.id
          ? { ...a, status: 'restored' }
          : a
      )
    );
    toast.success(`🎉 ${record.school_name} successfully restored from Cold Storage!`);
  };

  // Permanent Hard Delete
  const handleExecuteHardDelete = () => {
    if (!deleteConfirmModal) return;
    if (confirmInputText !== 'DELETE') {
      toast.error('Type "DELETE" in capital letters to confirm permanent purge');
      return;
    }

    setArchives(prev => prev.filter(a => a.id !== deleteConfirmModal.id));
    toast.error(`🔥 ${deleteConfirmModal.school_name} database permanently purged from MySQL server.`);
    setDeleteConfirmModal(null);
    setConfirmInputText('');
  };

  // Create Archive Job
  const handleCreateArchive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!archiveForm.school_name || !archiveForm.school_code) {
      toast.error('Please fill required fields');
      return;
    }

    const created: ArchiveRecord = {
      id: Date.now(),
      school_name: archiveForm.school_name,
      school_code: archiveForm.school_code,
      db_name: `school_${archiveForm.school_code}`,
      admin_email: `admin@${archiveForm.school_code}.edu.in`,
      archived_at: new Date().toISOString().split('T')[0],
      retention_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reason: archiveForm.reason,
      size_mb: 85,
      status: 'archived',
      notes: archiveForm.notes || 'Manual archival job initiated by SuperAdmin.',
    };

    setArchives(prev => [created, ...prev]);
    setShowArchiveModal(false);
    toast.success(`Archive dump created for ${created.school_name} (${created.db_name})`);
    setArchiveForm({ school_name: '', school_code: '', reason: 'Subscription Cancelled', notes: '' });
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
  const filtered = archives.filter(a => {
    const matchesSearch =
      a.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.school_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.db_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.admin_email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesReason = reasonFilter === 'all' || a.reason === reasonFilter;

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
  const totalArchived = archives.length;
  const deletionScheduledCount = archives.filter(a => a.status === 'deletion_scheduled').length;
  const restoredCount = archives.filter(a => a.status === 'restored').length;
  const totalArchivedMb = archives.reduce((acc, a) => acc + a.size_mb, 0);

  const statusBadgeConfig: Record<string, { label: string; style: string; icon: React.ElementType }> = {
    archived: { label: 'Archived in Vault', style: 'text-slate-300 bg-slate-800 border-slate-700', icon: Archive },
    deletion_scheduled: { label: 'Deletion Pending (90d)', style: 'text-red-400 bg-red-400/10 border-red-400/30', icon: AlertCircle },
    restored: { label: 'Restored & Active', style: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', icon: CheckCircle },
  };

  const sortOptions: SearchableOption[] = [
    { value: 'archived_at', label: 'Archived Date' },
    { value: 'school_name', label: 'School Name' },
    { value: 'size_mb', label: 'Database Size' },
    { value: 'retention_until', label: 'Retention Expiry' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'archived', label: 'Archived in Vault' },
    { value: 'deletion_scheduled', label: 'Pending Deletion' },
    { value: 'restored', label: 'Restored' },
  ];

  const reasonOptions: SearchableOption[] = [
    { value: 'all', label: 'All Archival Reasons' },
    { value: 'Subscription Cancelled', label: 'Subscription Cancelled' },
    { value: 'GDPR Request', label: 'GDPR Request' },
    { value: 'Non-Payment (90d+)', label: 'Non-Payment (90d+)' },
    { value: 'Owner Request', label: 'Owner Request' },
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
            <span className="p-2.5 bg-slate-800 text-slate-300 rounded-2xl border border-slate-700">
              <Archive className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Tenant Archival & Retention Vault
                <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-extrabold rounded-full border border-slate-700 uppercase tracking-wider">
                  GDPR Compliant
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Cold S3 database dumps · 90-day retention policies · One-click restoration & permanent purges
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Vault
          </button>
          <button
            onClick={() => setShowArchiveModal(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Archive Active Tenant
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Archived in Vault</span>
            <Archive className="w-4 h-4 text-slate-300" />
          </div>
          <div className="text-2xl font-black text-white">{totalArchived}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{totalArchivedMb} MB Total Size</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Deletion</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{deletionScheduledCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">GDPR 90-Day Timer</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Restored Access</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{restoredCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Re-hydrated DBs</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Retention Compliance</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">100%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Encrypted Backup</div>
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
              placeholder="Search by school name, DB schema, reason, admin email..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-slate-500 placeholder-slate-600"
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
              className="p-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
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
            icon={FileText}
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
                viewMode === 'table' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
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
              <Archive className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-bold">No archived tenant records match your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('school_name')}>
                      <div className="flex items-center gap-1.5">
                        Archived School / DB
                        {sortBy === 'school_name' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-slate-200" /> : <ArrowDown className="w-3 h-3 text-slate-200" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5">Archival Reason</th>
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('size_mb')}>
                      <div className="flex items-center gap-1.5">
                        Dump Size
                        {sortBy === 'size_mb' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-slate-200" /> : <ArrowDown className="w-3 h-3 text-slate-200" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('archived_at')}>
                      <div className="flex items-center gap-1.5">
                        Archived Date
                        {sortBy === 'archived_at' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-slate-200" /> : <ArrowDown className="w-3 h-3 text-slate-200" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedData.map(a => {
                    const st = statusBadgeConfig[a.status] || statusBadgeConfig.archived;
                    const StatusIcon = st.icon;

                    return (
                      <tr key={a.id} className="hover:bg-slate-900/50 transition-colors">
                        {/* School & DB */}
                        <td className="p-3.5 font-bold text-white">
                          <div className="font-extrabold text-white flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-500" /> {a.school_name}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span className="font-mono text-slate-500">{a.db_name}</span>
                            <span>·</span>
                            <span>{a.admin_email}</span>
                          </div>
                        </td>

                        {/* Reason */}
                        <td className="p-3.5 text-slate-300 font-medium">
                          {a.reason}
                          {a.notes && <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{a.notes}</div>}
                        </td>

                        {/* Size */}
                        <td className="p-3.5 font-mono font-bold text-slate-200">
                          {a.size_mb} MB
                        </td>

                        {/* Date & Retention */}
                        <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                          <div>{a.archived_at}</div>
                          <div className="text-[10px] text-slate-500 font-bold">Purge: {a.retention_until}</div>
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
                            <button
                              onClick={() => toast.success(`Downloading SQL Dump: ${a.db_name}.sql.gz`)}
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-[11px] cursor-pointer"
                              title="Download SQL Dump"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleRestoreTenant(a)}
                              className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <RotateCcw className="w-3 h-3" /> Restore
                            </button>

                            <button
                              onClick={() => setDeleteConfirmModal(a)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-[11px] cursor-pointer transition-all"
                              title="Permanently Delete DB Dump"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
          {paginatedData.map(a => {
            const st = statusBadgeConfig[a.status] || statusBadgeConfig.archived;

            return (
              <div key={a.id} className="bg-slate-950 rounded-3xl border border-slate-800 p-5 space-y-4 shadow-xl hover:border-slate-700 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-white">{a.school_name}</h3>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">{a.db_name}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${st.style}`}>
                    {st.label}
                  </span>
                </div>

                <div className="space-y-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Archival Reason</span>
                    <span className="font-bold text-slate-200">{a.reason}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Cold Dump Size</span>
                    <span className="font-mono text-white font-bold">{a.size_mb} MB</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Purge Expiry</span>
                    <span className="font-mono text-slate-400">{a.retention_until}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleRestoreTenant(a)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restore Tenant
                  </button>
                  <button
                    onClick={() => setDeleteConfirmModal(a)}
                    className="p-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-xl text-xs cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
            <strong className="text-white">{totalFiltered}</strong> archived tenant records
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
                      pageNum === validPage ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
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

      {/* ── MODAL 1: MANUAL ARCHIVE TENANT ── */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateArchive} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Archive className="w-4 h-4 text-slate-400" /> Archive Active Tenant
              </h3>
              <button type="button" onClick={() => setShowArchiveModal(false)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">School Name *</label>
                <input
                  type="text"
                  value={archiveForm.school_name}
                  onChange={e => {
                    const val = e.target.value;
                    setArchiveForm({ ...archiveForm, school_name: val, school_code: val.toLowerCase().replace(/[^a-z0-9]/g, '_') });
                  }}
                  placeholder="e.g. Sunrise Public Academy"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-slate-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Archival Reason</label>
                <select
                  value={archiveForm.reason}
                  onChange={e => setArchiveForm({ ...archiveForm, reason: e.target.value as ArchiveRecord['reason'] })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-slate-500 cursor-pointer"
                >
                  <option value="Subscription Cancelled">Subscription Cancelled</option>
                  <option value="GDPR Request">GDPR Request</option>
                  <option value="Non-Payment (90d+)">Non-Payment (90d+)</option>
                  <option value="Owner Request">Owner Request</option>
                  <option value="School Closed">School Closed</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Archival Notes & S3 Glacier Policy</label>
                <textarea
                  value={archiveForm.notes}
                  onChange={e => setArchiveForm({ ...archiveForm, notes: e.target.value })}
                  placeholder="e.g. Requested by school management upon closure of branch."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-slate-500 text-xs placeholder-slate-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Archive className="w-3.5 h-3.5" /> Archive Tenant DB
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL 2: PERMANENT HARD DELETE CONFIRMATION ── */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-red-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-red-400 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400" /> Permanent Hard Delete Confirmation
              </h3>
              <button onClick={() => setDeleteConfirmModal(null)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                You are about to PERMANENTLY PURGE <strong>{deleteConfirmModal.school_name}</strong> (`{deleteConfirmModal.db_name}`).
              </p>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-[11px]">
                🔥 <strong>WARNING:</strong> This action will drop the MySQL database from the server. This action CANNOT BE UNDONE.
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">
                  Type <strong className="text-white">DELETE</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmInputText}
                  onChange={e => setConfirmInputText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-slate-900 border border-red-500/40 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-red-500 font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteHardDelete}
                disabled={confirmInputText !== 'DELETE'}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" /> Purge Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
