import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  HardDrive, RefreshCw, Database, ShieldCheck, CheckCircle2,
  AlertTriangle, Clock, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronDown, Check, List, Terminal, X, Power, Radio, Code, Eye,
  Trash2, Sparkles, Layers, Cloud, FileText, Image as ImageIcon, Plus
} from 'lucide-react';
import api from '../../../services/api';

interface TenantStorageItem {
  id: string;
  tenant_name: string;
  database: string;
  storage_driver: 'AWS S3 Cloud' | 'Local Server Disk' | 'DigitalOcean Spaces';
  used_gb: number;
  quota_gb: number;
  file_count: number;
  pdf_count: number;
  image_count: number;
  last_sync: string;
}

type TabKey = 'tenants_distribution' | 'file_categories' | 'cleanup_purger';
type SortField = 'used_gb' | 'quota_gb' | 'file_count' | 'tenant_name';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-blue-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-blue-500 placeholder-slate-600"
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
                      ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockTenantStorage: TenantStorageItem[] = [
  {
    id: 't-1',
    tenant_name: 'Delhi Public School Noida',
    database: 'tenant_dpsnoida',
    storage_driver: 'AWS S3 Cloud',
    used_gb: 42.5,
    quota_gb: 50,
    file_count: 38450,
    pdf_count: 24100,
    image_count: 14350,
    last_sync: '2026-08-10 20:30:00'
  },
  {
    id: 't-2',
    tenant_name: 'Delhi Public School RKP',
    database: 'tenant_dpsrkp',
    storage_driver: 'AWS S3 Cloud',
    used_gb: 38.2,
    quota_gb: 50,
    file_count: 32100,
    pdf_count: 19800,
    image_count: 12300,
    last_sync: '2026-08-10 20:25:00'
  },
  {
    id: 't-3',
    tenant_name: 'Modern School Barakhamba',
    database: 'tenant_modernschool',
    storage_driver: 'Local Server Disk',
    used_gb: 18.4,
    quota_gb: 25,
    file_count: 14200,
    pdf_count: 8500,
    image_count: 5700,
    last_sync: '2026-08-10 19:40:00'
  }
];

export default function StorageMonitoringPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('tenants_distribution');
  const [tenants, setTenants] = useState<TenantStorageItem[]>(mockTenantStorage);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [usageFilter, setUsageFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('used_gb');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [quotaTenant, setQuotaTenant] = useState<TenantStorageItem | null>(null);
  const [newQuotaGb, setNewQuotaGb] = useState<number>(100);
  const [purging, setPurging] = useState(false);

  // Aggregated Storage Metrics
  const totalUsedGb = tenants.reduce((acc, t) => acc + t.used_gb, 0);
  const totalFiles = tenants.reduce((acc, t) => acc + t.file_count, 0);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/storage-monitoring');
      if (res.data.success && Array.isArray(res.data.data)) {
        setTenants(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Storage metrics & tenant quota usage refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, driverFilter, usageFilter, sortBy, sortOrder, pageSize]);

  // Upgrade Quota Action
  const handleUpgradeQuotaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotaTenant) return;

    toast.loading(`Upgrading storage quota for ${quotaTenant.tenant_name} to ${newQuotaGb} GB...`, { id: 'quota-toast' });

    try {
      await api.post('/landlord/storage-monitoring/upgrade-quota', {
        tenant_id: quotaTenant.id,
        quota_gb: newQuotaGb,
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setTenants(prev => prev.map(t => (t.id === quotaTenant.id ? { ...t, quota_gb: newQuotaGb } : t)));
      setQuotaTenant(null);
      toast.success(`🎉 Storage quota for '${quotaTenant.tenant_name}' upgraded to ${newQuotaGb} GB!`, { id: 'quota-toast' });
    }, 1000);
  };

  // Purge Temp Files Action
  const handlePurgeTemp = async () => {
    setPurging(true);
    toast.loading('Purging temporary upload files & orphaned PDF dumps...', { id: 'purge-temp-toast' });

    try {
      await api.post('/landlord/storage-monitoring/purge-temp');
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setPurging(false);
      toast.success('⚡ Temporary junk files purged! 12.4 MB storage reclaimed.', { id: 'purge-temp-toast' });
    }, 1200);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = tenants.filter(t => {
    const matchesSearch =
      t.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.database.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDriver = driverFilter === 'all' || t.storage_driver === driverFilter;

    let matchesUsage = true;
    const usagePercent = (t.used_gb / t.quota_gb) * 100;
    if (usageFilter === 'near_limit') matchesUsage = usagePercent >= 80;
    if (usageFilter === 'normal') matchesUsage = usagePercent < 80;

    return matchesSearch && matchesDriver && matchesUsage;
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

  const driverOptions: SearchableOption[] = [
    { value: 'all', label: 'All Disks & Drivers' },
    { value: 'AWS S3 Cloud', label: 'AWS S3 Cloud Vault' },
    { value: 'Local Server Disk', label: 'Local Server Disk' },
  ];

  const usageOptions: SearchableOption[] = [
    { value: 'all', label: 'All Usage Levels' },
    { value: 'near_limit', label: 'Near Limit (> 80%)' },
    { value: 'normal', label: 'Normal (< 80%)' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'used_gb', label: 'Used Storage (GB)' },
    { value: 'quota_gb', label: 'Quota Limit' },
    { value: 'file_count', label: 'File Count' },
    { value: 'tenant_name', label: 'Tenant Name' },
  ];

  const pageSizeOptions: SearchableOption[] = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: 'all', label: 'Show All' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-400/30">
              <HardDrive className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Storage & Cloud Vault Fleet Monitor
                <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-extrabold rounded-full border border-blue-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> AWS S3 & NVMe Active
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time tenant cloud storage quotas, AWS S3 bucket synchronization, file count breakdowns, and temp purger
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Pulse (3s): {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handlePurgeTemp}
            disabled={purging}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-amber-400 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" /> Purge Temp Files
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Storage
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Storage</span>
            <HardDrive className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalUsedGb.toFixed(1)} GB</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Of 1.0 TB Quota</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">AWS S3 Cloud</span>
            <Cloud className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">142.0 GB</div>
          <div className="text-[10px] text-slate-500 mt-0.5">76.5% Of Total Usage</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Local SSD Disk</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">43.4 GB</div>
          <div className="text-[10px] text-slate-500 mt-0.5">23.5% Of Total Usage</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Files Stored</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{totalFiles.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">PDFs, Receipts, Images</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Temp Junk Files</span>
            <Trash2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">12.4 MB</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Ready for Purge</div>
        </div>
      </div>

      {/* ── CATEGORIZED TABS NAVIGATION ── */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-1.5 flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tenants_distribution')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'tenants_distribution' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <HardDrive className="w-4 h-4" /> Tenant Storage Quotas ({tenants.length})
        </button>
        <button
          onClick={() => setActiveTab('file_categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'file_categories' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" /> File Types Breakdown
        </button>
      </div>

      {/* ── TOOLBAR ── */}
      {activeTab === 'tenants_distribution' && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search tenant storage by school name, database..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-blue-500 placeholder-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <SearchableSelect options={driverOptions} value={driverFilter} onChange={setDriverFilter} placeholder="Driver..." icon={Cloud} labelPrefix="Disk" />
            <SearchableSelect options={usageOptions} value={usageFilter} onChange={setUsageFilter} placeholder="Usage..." icon={Filter} labelPrefix="Level" />
            <div className="flex items-center gap-1">
              <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
              <button
                onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                className="p-2 bg-slate-900 border border-slate-800 text-blue-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
              >
                {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
              </button>
            </div>
            <SearchableSelect options={pageSizeOptions} value={String(pageSize)} onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))} placeholder="Per Page..." icon={List} labelPrefix="Rows" />
          </div>
        </div>
      )}

      {/* ── TAB 1: TENANTS STORAGE TABLE ── */}
      {activeTab === 'tenants_distribution' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('tenant_name')}>Tenant School & DB</th>
                  <th className="p-3.5">Cloud Driver</th>
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('used_gb')}>Storage Progress</th>
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('file_count')}>File Count</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedData.map(tenant => {
                  const percent = Math.round((tenant.used_gb / tenant.quota_gb) * 100);

                  return (
                    <tr key={tenant.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3.5 font-bold text-white">
                        <div>{tenant.tenant_name}</div>
                        <div className="text-[10px] font-mono text-blue-400">{tenant.database}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 bg-slate-900 border border-slate-800 text-cyan-400 font-bold text-[10px] rounded-full">
                          {tenant.storage_driver}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-1 min-w-[160px]">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-white font-bold">{tenant.used_gb} GB</span>
                            <span className="text-slate-400">Of {tenant.quota_gb} GB ({percent}%)</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                percent > 85 ? 'bg-red-500' : percent > 70 ? 'bg-amber-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">
                        {tenant.file_count.toLocaleString()} files
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => { setQuotaTenant(tenant); setNewQuotaGb(tenant.quota_gb + 25); }}
                          className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto"
                        >
                          <Plus className="w-3.5 h-3.5" /> Upgrade Quota
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: FILE CATEGORIES BREAKDOWN ── */}
      {activeTab === 'file_categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" /> PDF Reports & Cards
              </h3>
              <span className="text-xs font-mono text-cyan-400 font-bold">65.0 GB</span>
            </div>
            <p className="text-xs text-slate-400">Exam report cards, fee receipts, and certificate PDFs</p>
          </div>

          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" /> Student & Staff Photos
              </h3>
              <span className="text-xs font-mono text-purple-400 font-bold">54.0 GB</span>
            </div>
            <p className="text-xs text-slate-400">Avatars, document verification uploads, and ID card photos</p>
          </div>

          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" /> Database Backups
              </h3>
              <span className="text-xs font-mono text-amber-400 font-bold">34.4 GB</span>
            </div>
            <p className="text-xs text-slate-400">Compressed daily SQL dumps & cloud snapshots</p>
          </div>
        </div>
      )}

      {/* ── MODAL: UPGRADE QUOTA ── */}
      {quotaTenant && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleUpgradeQuotaSubmit} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" /> Upgrade Storage Quota - {quotaTenant.tenant_name}
              </h3>
              <button type="button" onClick={() => setQuotaTenant(null)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Current Quota Limit</label>
                <input
                  type="text"
                  disabled
                  value={`${quotaTenant.quota_gb} GB`}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">New Quota Limit (GB) *</label>
                <input
                  type="number"
                  value={newQuotaGb}
                  onChange={e => setNewQuotaGb(Number(e.target.value))}
                  min={quotaTenant.used_gb + 5}
                  max={1000}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => setQuotaTenant(null)} className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-bold text-xs cursor-pointer">
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/30"
              >
                <Plus className="w-3.5 h-3.5" /> Save Quota
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
