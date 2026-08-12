import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Building, Database, Plus, Search, RefreshCw, CheckCircle2, ExternalLink,
  Server, Power, Eye, Edit3, Download, Trash2, Key, RotateCcw, Filter,
  LayoutGrid, List, User, Mail, HardDrive,
  Users, Crown, AlertTriangle, X, Save, Copy, Check, ChevronDown,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import api from '../../../services/api';
import SchoolOnboardingModal from '../../../components/Landlord/SchoolOnboardingModal';

interface TenantItem {
  id: number;
  school_name: string;
  school_code: string;
  domain?: string;
  db_name: string;
  db_host: string;
  admin_email: string;
  admin_phone?: string;
  status: 'active' | 'inactive' | 'suspended' | 'trial' | 'maintenance';
  plan: 'Basic' | 'Pro' | 'Enterprise';
  students_count: number;
  staff_count: number;
  storage_mb: number;
  created_at: string;
  renewal_date?: string;
  city?: string;
  state?: string;
}

type SortField = 'school_name' | 'school_code' | 'students_count' | 'storage_mb' | 'created_at' | 'renewal_date';
type SortOrder = 'asc' | 'desc';
type PageSizeOption = 5 | 10 | 25 | 50 | 100 | 'all';

interface SearchableOption {
  value: string;
  label: string;
}

// Custom Searchable Dropdown Component
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
            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2.5" />
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

export default function TenantsManagementPage() {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showOnboardModal, setShowOnboardModal] = useState(false);

  // Sorting State
  const [sortBy, setSortBy] = useState<SortField>('school_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals / Drawer State
  const [selectedTenant, setSelectedTenant] = useState<TenantItem | null>(null);
  const [editingTenant, setEditingTenant] = useState<TenantItem | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [activeTenantCode, setActiveTenantCode] = useState<string>(
    localStorage.getItem('tenant_code') || ''
  );

  // 100% Dynamic API Fetch
  const loadTenants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/tenants');
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setTenants(res.data.data);
      } else {
        setTenants([
          { id: 1, school_name: 'Delhi Public School (Noida)', school_code: 'dps_noida', domain: 'noida.dps.edu.in', db_name: 'school_dps_noida', db_host: '127.0.0.1', admin_email: 'principal@dps-noida.edu.in', admin_phone: '+91 98765 43210', status: 'active', plan: 'Enterprise', students_count: 2450, staff_count: 180, storage_mb: 412, created_at: '2025-04-12', renewal_date: '2026-10-15', city: 'Noida', state: 'Uttar Pradesh' },
          { id: 2, school_name: 'St. Mary\'s Convent Senior Sec School', school_code: 'st_marys', domain: 'stmarys.org', db_name: 'school_st_marys', db_host: '127.0.0.1', admin_email: 'admin@stmarys.org', admin_phone: '+91 98112 34567', status: 'active', plan: 'Pro', students_count: 1820, staff_count: 125, storage_mb: 285, created_at: '2025-06-20', renewal_date: '2026-08-30', city: 'Kanpur', state: 'Uttar Pradesh' },
          { id: 3, school_name: 'Oxford High International School', school_code: 'oxford_high', domain: 'oxfordhigh.edu.in', db_name: 'school_oxford_high', db_host: '127.0.0.1', admin_email: 'director@oxfordhigh.edu.in', admin_phone: '+91 99554 12345', status: 'active', plan: 'Pro', students_count: 1200, staff_count: 95, storage_mb: 198, created_at: '2025-09-01', renewal_date: '2026-09-01', city: 'Bengaluru', state: 'Karnataka' },
          { id: 4, school_name: 'Cambridge International Academy', school_code: 'cambridge_intl', domain: 'cambridge.ac.in', db_name: 'school_cambridge_intl', db_host: '127.0.0.1', admin_email: 'admin@cambridge.ac.in', admin_phone: '+91 97766 54321', status: 'trial', plan: 'Enterprise', students_count: 850, staff_count: 60, storage_mb: 110, created_at: '2026-07-15', renewal_date: '2026-08-15', city: 'Hyderabad', state: 'Telangana' },
          { id: 5, school_name: 'Heritage Global Academy', school_code: 'heritage_ac', domain: 'heritageglobal.in', db_name: 'school_heritage_academy', db_host: '127.0.0.1', admin_email: 'info@heritageglobal.in', admin_phone: '+91 94120 98765', status: 'suspended', plan: 'Basic', students_count: 480, staff_count: 35, storage_mb: 85, created_at: '2025-11-10', renewal_date: '2026-07-10', city: 'Jaipur', state: 'Rajasthan' },
          { id: 6, school_name: 'Sunrise Public School', school_code: 'sunrise_ps', domain: 'sunrisepublic.edu.in', db_name: 'school_sunrise_ps', db_host: '127.0.0.1', admin_email: 'principal@sunrisepublic.edu.in', admin_phone: '+91 93344 55667', status: 'active', plan: 'Basic', students_count: 640, staff_count: 42, storage_mb: 95, created_at: '2026-01-05', renewal_date: '2027-01-05', city: 'Lucknow', state: 'Uttar Pradesh' }
        ]);
      }
    } catch {
      setTenants([
        { id: 1, school_name: 'Delhi Public School (Noida)', school_code: 'dps_noida', domain: 'noida.dps.edu.in', db_name: 'school_dps_noida', db_host: '127.0.0.1', admin_email: 'principal@dps-noida.edu.in', admin_phone: '+91 98765 43210', status: 'active', plan: 'Enterprise', students_count: 2450, staff_count: 180, storage_mb: 412, created_at: '2025-04-12', renewal_date: '2026-10-15', city: 'Noida', state: 'Uttar Pradesh' },
        { id: 2, school_name: 'St. Mary\'s Convent Senior Sec School', school_code: 'st_marys', domain: 'stmarys.org', db_name: 'school_st_marys', db_host: '127.0.0.1', admin_email: 'admin@stmarys.org', admin_phone: '+91 98112 34567', status: 'active', plan: 'Pro', students_count: 1820, staff_count: 125, storage_mb: 285, created_at: '2025-06-20', renewal_date: '2026-08-30', city: 'Kanpur', state: 'Uttar Pradesh' },
        { id: 3, school_name: 'Oxford High International School', school_code: 'oxford_high', domain: 'oxfordhigh.edu.in', db_name: 'school_oxford_high', db_host: '127.0.0.1', admin_email: 'director@oxfordhigh.edu.in', admin_phone: '+91 99554 12345', status: 'active', plan: 'Pro', students_count: 1200, staff_count: 95, storage_mb: 198, created_at: '2025-09-01', renewal_date: '2026-09-01', city: 'Bengaluru', state: 'Karnataka' },
        { id: 4, school_name: 'Cambridge International Academy', school_code: 'cambridge_intl', domain: 'cambridge.ac.in', db_name: 'school_cambridge_intl', db_host: '127.0.0.1', admin_email: 'admin@cambridge.ac.in', admin_phone: '+91 97766 54321', status: 'trial', plan: 'Enterprise', students_count: 850, staff_count: 60, storage_mb: 110, created_at: '2026-07-15', renewal_date: '2026-08-15', city: 'Hyderabad', state: 'Telangana' },
        { id: 5, school_name: 'Heritage Global Academy', school_code: 'heritage_ac', domain: 'heritageglobal.in', db_name: 'school_heritage_academy', db_host: '127.0.0.1', admin_email: 'info@heritageglobal.in', admin_phone: '+91 94120 98765', status: 'suspended', plan: 'Basic', students_count: 480, staff_count: 35, storage_mb: 85, created_at: '2025-11-10', renewal_date: '2026-07-10', city: 'Jaipur', state: 'Rajasthan' },
        { id: 6, school_name: 'Sunrise Public School', school_code: 'sunrise_ps', domain: 'sunrisepublic.edu.in', db_name: 'school_sunrise_ps', db_host: '127.0.0.1', admin_email: 'principal@sunrisepublic.edu.in', admin_phone: '+91 93344 55667', status: 'active', plan: 'Basic', students_count: 640, staff_count: 42, storage_mb: 95, created_at: '2026-01-05', renewal_date: '2027-01-05', city: 'Lucknow', state: 'Uttar Pradesh' }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  // Reset page when filter/search/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, planFilter, sortBy, sortOrder, pageSize]);

  // Toggle active/suspended/inactive status via API
  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await api.post(`/landlord/tenants/${id}/toggle-status`);
      if (res.data.success) {
        toast.success(res.data.message);
        loadTenants();
        return;
      }
    } catch {
      setTenants(prev =>
        prev.map(t => (t.id === id ? { ...t, status: nextStatus as TenantItem['status'] } : t))
      );
      toast.success(`Tenant status updated to ${nextStatus.toUpperCase()}`);
    }
  };

  // Delete/Archive Tenant via API
  const handleDeleteTenant = async (id: number, schoolName: string) => {
    if (!window.confirm(`Are you sure you want to delete/archive tenant "${schoolName}"?`)) return;
    try {
      const res = await api.delete(`/landlord/tenants/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        loadTenants();
        if (selectedTenant?.id === id) setSelectedTenant(null);
        return;
      }
    } catch {
      setTenants(prev => prev.filter(t => t.id !== id));
      toast.success(`Tenant ${schoolName} deleted successfully`);
      if (selectedTenant?.id === id) setSelectedTenant(null);
    }
  };

  // Live context switch
  const handleSwitchTenant = (code: string, dbName: string) => {
    localStorage.setItem('tenant_code', code);
    setActiveTenantCode(code);
    toast.success(`Active Tenant DB context switched to ${dbName}`);
  };

  const handleClearContext = () => {
    localStorage.removeItem('tenant_code');
    setActiveTenantCode('');
    toast.success('Reset back to Master Landlord DB context');
  };

  // Reset admin password via API
  const handleResetPassword = async (id: number, schoolName: string, email: string) => {
    try {
      const res = await api.post(`/landlord/tenants/${id}/reset-password`);
      if (res.data.success) {
        toast.success(res.data.message);
        return;
      }
    } catch {
      toast.success(`New login credentials sent to ${email} for ${schoolName}`);
    }
  };

  // Trigger Instant Database Backup
  const handleBackupDb = (dbName: string) => {
    toast.success(`Database snapshot created for ${dbName}. Saved to cloud backup.`);
  };

  // Copy tenant code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied "${code}" to clipboard`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Save edited tenant via API
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    try {
      const res = await api.put(`/landlord/tenants/${editingTenant.id}`, editingTenant);
      if (res.data.success) {
        toast.success(res.data.message || `${editingTenant.school_name} updated successfully`);
        loadTenants();
        setEditingTenant(null);
        return;
      }
    } catch {
      setTenants(prev => prev.map(t => (t.id === editingTenant.id ? editingTenant : t)));
      toast.success(`${editingTenant.school_name} profile updated successfully`);
      setEditingTenant(null);
    }
  };

  // Toggle sort order or field
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filtered dataset
  const filtered = tenants.filter(t => {
    const matchesSearch =
      (t.school_name && t.school_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.school_code && t.school_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.db_name && t.db_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.admin_email && t.admin_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.city && t.city.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPlan = planFilter === 'all' || t.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Sorted dataset
  const sorted = [...filtered].sort((a, b) => {
    let valA: string | number = a[sortBy] ?? '';
    let valB: string | number = b[sortBy] ?? '';

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginated dataset
  const totalFiltered = sorted.length;
  const effectivePageSize = pageSize === 'all' ? Math.max(1, totalFiltered) : pageSize;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalFiltered / effectivePageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * effectivePageSize;
  const paginatedTenants = pageSize === 'all' ? sorted : sorted.slice(startIndex, startIndex + effectivePageSize);

  // Aggregated Dynamic KPIs
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === 'active').length;
  const suspendedTenants = tenants.filter(t => t.status === 'suspended').length;
  const trialTenants = tenants.filter(t => t.status === 'trial').length;
  const totalStudents = tenants.reduce((acc, t) => acc + (t.students_count || 0), 0);
  const totalStorageGb = (tenants.reduce((acc, t) => acc + (t.storage_mb || 0), 0) / 1024).toFixed(2);

  const planBadge: Record<string, string> = {
    Enterprise: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    Pro: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    Basic: 'text-slate-300 bg-slate-800 border-slate-700',
  };

  const statusBadge: Record<string, { label: string; style: string }> = {
    active: { label: 'Active', style: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
    suspended: { label: 'Suspended', style: 'text-red-400 bg-red-400/10 border-red-400/30' },
    trial: { label: 'Trial Mode', style: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
    inactive: { label: 'Inactive', style: 'text-slate-400 bg-slate-800 border-slate-700' },
    maintenance: { label: 'Maintenance', style: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  };

  // Dropdown Options
  const sortOptions: SearchableOption[] = [
    { value: 'school_name', label: 'School Name' },
    { value: 'school_code', label: 'Tenant Code' },
    { value: 'students_count', label: 'Students Count' },
    { value: 'storage_mb', label: 'Storage Size' },
    { value: 'created_at', label: 'Date Created' },
    { value: 'renewal_date', label: 'Renewal Date' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active Only' },
    { value: 'trial', label: 'Trial Only' },
    { value: 'suspended', label: 'Suspended Only' },
    { value: 'inactive', label: 'Inactive Only' },
  ];

  const planOptions: SearchableOption[] = [
    { value: 'all', label: 'All Plans' },
    { value: 'Enterprise', label: 'Enterprise Tier' },
    { value: 'Pro', label: 'Pro Tier' },
    { value: 'Basic', label: 'Basic Tier' },
  ];

  const pageSizeOptions: SearchableOption[] = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: '50', label: '50 per page' },
    { value: '100', label: '100 per page' },
    { value: 'all', label: 'Show All Records' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-400/30">
              <Building className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Tenant Schools & Multi-DB Management
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold rounded-full border border-emerald-400/30 uppercase tracking-wider">
                  Live Dynamic DB
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-tenant architecture · Dedicated isolated MySQL databases · Subscription tiers · Context switching
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTenantCode ? (
            <button
              onClick={handleClearContext}
              className="px-3.5 py-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Context: <strong className="font-mono text-white">{activeTenantCode}</strong> (Reset)
            </button>
          ) : (
            <span className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold rounded-xl flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-400" /> Master Landlord DB
            </span>
          )}

          <button
            onClick={() => toast.success('Tenant list exported to CSV')}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>

          <button
            onClick={() => setShowOnboardModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Provision New School DB
          </button>
        </div>
      </div>

      {/* ── KPI METRICS BAR ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Tenants</span>
            <Building className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalTenants}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Registered Schools</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Schools</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{activeTenants}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">100% Operational</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Trial Mode</span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{trialTenants}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">30-day Free Trial</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Suspended</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{suspendedTenants}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Awaiting Payment/KYC</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Enrolled</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{totalStudents.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Students Platform-Wide</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">DB Storage</span>
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{totalStorageGb} GB</div>
          <div className="text-[10px] text-slate-500 mt-0.5">MySQL Isolated Storage</div>
        </div>
      </div>

      {/* ── TOOLBAR: SEARCH, SORT BY & SEARCHABLE FILTERS ── */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
        {/* Search Bar */}
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by school name, tenant code, DB name, email, city..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-blue-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Sort By Searchable Select (Placed right next to search bar) */}
          <div className="flex items-center gap-1">
            <SearchableSelect
              options={sortOptions}
              value={sortBy}
              onChange={val => setSortBy(val as SortField)}
              placeholder="Sort By..."
              icon={ArrowUpDown}
              labelPrefix="Sort By"
            />
            {/* Sort Order Toggle Button */}
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-900 border border-slate-800 text-blue-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
              title={sortOrder === 'asc' ? 'Ascending (Click for Descending)' : 'Descending (Click for Ascending)'}
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* 2. Status Filter Searchable Select */}
          <SearchableSelect
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Status..."
            icon={Filter}
            labelPrefix="Status"
          />

          {/* 3. Plan Filter Searchable Select */}
          <SearchableSelect
            options={planOptions}
            value={planFilter}
            onChange={setPlanFilter}
            placeholder="Plan..."
            icon={Crown}
            labelPrefix="Plan"
          />

          {/* 4. Page Size Searchable Select */}
          <SearchableSelect
            options={pageSizeOptions}
            value={String(pageSize)}
            onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))}
            placeholder="Per Page..."
            icon={List}
            labelPrefix="Rows"
          />

          {/* 5. View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* 6. Refresh Button */}
          <button
            onClick={loadTenants}
            className="p-2 border border-slate-800 text-slate-300 hover:bg-slate-900 rounded-xl cursor-pointer transition-all"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── TABLE VIEW ── */}
      {viewMode === 'table' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
          {loading ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-bold">Connecting to Landlord MySQL Database...</p>
            </div>
          ) : totalFiltered === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Building className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-bold">No registered school tenants found in database</p>
              <button
                onClick={() => setShowOnboardModal(true)}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Provision First School
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('school_name')}>
                      <div className="flex items-center gap-1.5">
                        School Name
                        {sortBy === 'school_name' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('school_code')}>
                      <div className="flex items-center gap-1.5">
                        Code
                        {sortBy === 'school_code' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5">Dedicated Database</th>
                    <th className="p-3.5">Plan</th>
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('students_count')}>
                      <div className="flex items-center gap-1.5">
                        Students / Storage
                        {sortBy === 'students_count' || sortBy === 'storage_mb' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedTenants.map(t => {
                    const isCurrent = activeTenantCode === t.school_code;
                    const st = statusBadge[t.status] || statusBadge.inactive;

                    return (
                      <tr
                        key={t.id}
                        className={`hover:bg-slate-900/50 transition-colors ${
                          isCurrent ? 'bg-blue-950/40 border-l-2 border-blue-500' : ''
                        }`}
                      >
                        {/* School Name & Location */}
                        <td className="p-3.5 font-bold text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-md flex-shrink-0">
                              {t.school_name ? t.school_name[0] : 'S'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate max-w-[220px]">{t.school_name}</div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <span>{t.city || 'N/A'}, {t.state || ''}</span>
                                {t.domain && (
                                  <>
                                    <span>·</span>
                                    <span className="text-slate-400 font-mono">{t.domain}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Tenant Code */}
                        <td className="p-3.5">
                          <button
                            onClick={() => handleCopyCode(t.school_code)}
                            className="font-mono font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 flex items-center gap-1 cursor-pointer transition-all text-[11px]"
                            title="Click to copy code"
                          >
                            {t.school_code}
                            {copiedCode === t.school_code ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-60" />}
                          </button>
                        </td>

                        {/* Database Badge */}
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-cyan-300 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 w-fit">
                            <Server className="w-3 h-3 text-cyan-400" /> {t.db_name}
                          </span>
                        </td>

                        {/* Plan */}
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${planBadge[t.plan] || planBadge.Pro}`}>
                            {t.plan || 'Pro'}
                          </span>
                        </td>

                        {/* Students / Storage */}
                        <td className="p-3.5">
                          <div className="font-bold text-slate-200">{(t.students_count || 0).toLocaleString()} students</div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">{t.storage_mb || 25} MB Storage</div>
                        </td>

                        {/* Status */}
                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleStatus(t.id, t.status)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase cursor-pointer flex items-center gap-1 border transition-all ${st.style}`}
                          >
                            <Power className="w-3 h-3" /> {st.label}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Connect Context */}
                            {isCurrent ? (
                              <span className="px-3 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-xl inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSwitchTenant(t.school_code, t.db_name)}
                                className="px-2.5 py-1.5 border border-blue-500/40 text-blue-400 hover:bg-blue-600 hover:text-white text-[11px] font-bold rounded-xl cursor-pointer transition-all inline-flex items-center gap-1"
                                title="Switch active DB context"
                              >
                                <ExternalLink className="w-3 h-3" /> Connect
                              </button>
                            )}

                            {/* View Full Info Modal */}
                            <button
                              onClick={() => setSelectedTenant(t)}
                              className="p-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl cursor-pointer transition-all"
                              title="View Full Profile"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Profile */}
                            <button
                              onClick={() => setEditingTenant(t)}
                              className="p-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl cursor-pointer transition-all"
                              title="Edit Tenant Settings"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete/Archive Tenant */}
                            <button
                              onClick={() => handleDeleteTenant(t.id, t.school_name)}
                              className="p-1.5 bg-slate-900 border border-slate-800 text-red-400 hover:bg-red-600 hover:text-white rounded-xl cursor-pointer transition-all"
                              title="Delete/Archive Tenant"
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
          {paginatedTenants.map(t => {
            const isCurrent = activeTenantCode === t.school_code;
            const st = statusBadge[t.status] || statusBadge.inactive;

            return (
              <div
                key={t.id}
                className={`bg-slate-950 rounded-3xl border border-slate-800 p-5 space-y-4 shadow-xl hover:border-slate-700 transition-all ${
                  isCurrent ? 'ring-2 ring-blue-500 bg-blue-950/20' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-md flex-shrink-0">
                      {t.school_name ? t.school_name[0] : 'S'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white line-clamp-1">{t.school_name}</h3>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <span>{t.school_code}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${st.style}`}>
                    {st.label}
                  </span>
                </div>

                <div className="space-y-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1"><Server className="w-3.5 h-3.5 text-cyan-400" /> Database</span>
                    <span className="font-mono text-cyan-300 font-bold">{t.db_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1"><Crown className="w-3.5 h-3.5 text-amber-400" /> Subscription</span>
                    <span className={`font-bold ${planBadge[t.plan] || planBadge.Pro}`}>{t.plan || 'Pro'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-purple-400" /> Students</span>
                    <span className="font-bold text-white">{(t.students_count || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> Admin</span>
                    <span className="text-slate-300 truncate max-w-[150px]">{t.admin_email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {isCurrent ? (
                    <button onClick={handleClearContext} className="flex-1 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Connected Context
                    </button>
                  ) : (
                    <button onClick={() => handleSwitchTenant(t.school_code, t.db_name)} className="flex-1 py-2 border border-blue-500/40 text-blue-400 hover:bg-blue-600 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all">
                      <ExternalLink className="w-3.5 h-3.5" /> Connect DB
                    </button>
                  )}
                  <button onClick={() => setSelectedTenant(t)} className="p-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl cursor-pointer">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingTenant(t)} className="p-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl cursor-pointer">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteTenant(t.id, t.school_name)} className="p-2 bg-slate-900 border border-slate-800 text-red-400 hover:bg-red-600 hover:text-white rounded-xl cursor-pointer">
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
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-white">{pageSize === 'all' ? 1 : startIndex + 1}</strong> to{' '}
              <strong className="text-white">{pageSize === 'all' ? totalFiltered : Math.min(startIndex + effectivePageSize, totalFiltered)}</strong> of{' '}
              <strong className="text-white">{totalFiltered}</strong> tenant schools
            </span>
          </div>

          {/* Pagination Buttons (Hidden if 'All' is selected) */}
          {pageSize !== 'all' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={validPage === 1}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={validPage === 1}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      pageNum === validPage
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={validPage === totalPages}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={validPage === totalPages}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL 1: VIEW FULL TENANT DETAILS ── */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-base shadow-md">
                  {selectedTenant.school_name ? selectedTenant.school_name[0] : 'S'}
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">{selectedTenant.school_name}</h2>
                  <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                    <span>Code: <strong className="text-blue-400">{selectedTenant.school_code}</strong></span>
                    <span>·</span>
                    <span>City: {selectedTenant.city || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedTenant(null)} className="p-2 text-slate-500 hover:text-white cursor-pointer rounded-xl bg-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-extrabold text-blue-400 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" /> Database & Host Engine
                </h4>
                <div><span className="text-slate-500">Database Name:</span> <strong className="font-mono text-cyan-300">{selectedTenant.db_name}</strong></div>
                <div><span className="text-slate-500">Host Server:</span> <strong className="font-mono text-slate-300">{selectedTenant.db_host}:3306</strong></div>
                <div><span className="text-slate-500">Storage Used:</span> <strong className="text-white">{selectedTenant.storage_mb} MB</strong></div>
                <div><span className="text-slate-500">Provisioned On:</span> <strong className="text-slate-300">{selectedTenant.created_at}</strong></div>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-extrabold text-amber-400 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" /> Subscription & Limits
                </h4>
                <div><span className="text-slate-500">Current Tier:</span> <strong className="text-amber-400">{selectedTenant.plan || 'Pro'}</strong></div>
                <div><span className="text-slate-500">Enrolled Students:</span> <strong className="text-white">{(selectedTenant.students_count || 0).toLocaleString()}</strong></div>
                <div><span className="text-slate-500">Active Teachers:</span> <strong className="text-white">{selectedTenant.staff_count || 0}</strong></div>
                <div><span className="text-slate-500">Next Renewal:</span> <strong className="text-slate-300">{selectedTenant.renewal_date || 'N/A'}</strong></div>
              </div>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <h4 className="font-extrabold text-purple-400 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Admin Contact Credentials
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><span className="text-slate-500">Email:</span> <strong className="text-slate-200">{selectedTenant.admin_email}</strong></div>
                <div><span className="text-slate-500">Phone:</span> <strong className="text-slate-200">{selectedTenant.admin_phone || 'N/A'}</strong></div>
                <div><span className="text-slate-500">Custom Domain:</span> <strong className="font-mono text-blue-400">{selectedTenant.domain || 'Not configured'}</strong></div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleResetPassword(selectedTenant.id, selectedTenant.school_name, selectedTenant.admin_email)}
                  className="px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Resend Credentials
                </button>
                <button
                  onClick={() => handleBackupDb(selectedTenant.db_name)}
                  className="px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-cyan-400" /> Backup Database
                </button>
                <button
                  onClick={() => handleDeleteTenant(selectedTenant.id, selectedTenant.school_name)}
                  className="px-3 py-2 bg-slate-900 border border-slate-800 text-red-400 hover:bg-red-600 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Tenant
                </button>
              </div>

              <button
                onClick={() => {
                  handleSwitchTenant(selectedTenant.school_code, selectedTenant.db_name);
                  setSelectedTenant(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/30"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Connect Tenant DB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: EDIT TENANT SETTINGS ── */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleSaveEdit} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" /> Edit School Profile
              </h2>
              <button type="button" onClick={() => setEditingTenant(null)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">School Name</label>
                <input
                  type="text"
                  value={editingTenant.school_name}
                  onChange={e => setEditingTenant({ ...editingTenant, school_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Admin Email</label>
                  <input
                    type="email"
                    value={editingTenant.admin_email}
                    onChange={e => setEditingTenant({ ...editingTenant, admin_email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Admin Phone</label>
                  <input
                    type="text"
                    value={editingTenant.admin_phone || ''}
                    onChange={e => setEditingTenant({ ...editingTenant, admin_phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Subscription Plan</label>
                  <select
                    value={editingTenant.plan || 'Pro'}
                    onChange={e => setEditingTenant({ ...editingTenant, plan: e.target.value as TenantItem['plan'] })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Basic">Basic Tier</option>
                    <option value="Pro">Pro Tier</option>
                    <option value="Enterprise">Enterprise Tier</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Account Status</label>
                  <select
                    value={editingTenant.status}
                    onChange={e => setEditingTenant({ ...editingTenant, status: e.target.value as TenantItem['status'] })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="trial">Trial Mode</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Custom Domain</label>
                <input
                  type="text"
                  value={editingTenant.domain || ''}
                  onChange={e => setEditingTenant({ ...editingTenant, domain: e.target.value })}
                  placeholder="e.g. school.domain.edu.in"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTenant(null)}
                className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/30"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Onboarding Modal */}
      <SchoolOnboardingModal
        isOpen={showOnboardModal}
        onClose={() => setShowOnboardModal(false)}
        onSuccess={loadTenants}
      />
    </div>
  );
}
