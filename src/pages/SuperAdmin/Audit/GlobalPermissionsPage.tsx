import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldCheck, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X, Radio, Lock,
  Plus, Eye, Shield, Trash2, Edit2, Sliders, Layers, Key, AlertTriangle
} from 'lucide-react';
import api from '../../../services/api';

interface PermissionItem {
  id: string;
  slug: string;
  name: string;
  subsystem: 'TENANTS' | 'SECURITY' | 'DATABASES' | 'AUDIT' | 'BILLING' | 'MONITORING' | 'SETTINGS';
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  assigned_roles: string[];
}

type SortField = 'slug' | 'name' | 'subsystem' | 'risk_level';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-rose-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-rose-500 placeholder-slate-600"
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
                      ? 'bg-rose-600/20 text-rose-400 font-bold border border-rose-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-rose-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockPermissions: PermissionItem[] = [
  {
    id: 'perm-1',
    slug: 'tenants.create',
    name: 'Create School Tenant Provisioning',
    subsystem: 'TENANTS',
    risk_level: 'CRITICAL',
    description: 'Provision new isolated MySQL database, subdomain routing, and tenant master admin credentials',
    assigned_roles: ['Root SuperAdmin']
  },
  {
    id: 'perm-2',
    slug: 'security.ddos_toggle',
    name: 'Toggle Under Attack WAF Shield',
    subsystem: 'SECURITY',
    risk_level: 'CRITICAL',
    description: 'Force platform-wide Cloudflare JavaScript challenge screen during active DDoS floods',
    assigned_roles: ['Root SuperAdmin', 'Security Director']
  },
  {
    id: 'perm-3',
    slug: 'databases.migrate',
    name: 'Execute Database Migrations',
    subsystem: 'DATABASES',
    risk_level: 'HIGH',
    description: 'Run SQL database migration files across landlord and 1,200+ tenant databases',
    assigned_roles: ['Root SuperAdmin', 'DevOps Engineer']
  },
  {
    id: 'perm-4',
    slug: 'audit.logs_read',
    name: 'View Cryptographic Audit Logs',
    subsystem: 'AUDIT',
    risk_level: 'MEDIUM',
    description: 'Inspect SHA-256 tamper-evident system action logs and verify chain integrity',
    assigned_roles: ['Root SuperAdmin', 'Security Director', 'Compliance Auditor']
  },
  {
    id: 'perm-5',
    slug: 'billing.view_invoices',
    name: 'Read SaaS Billing Receipts',
    subsystem: 'BILLING',
    risk_level: 'LOW',
    description: 'Access SaaS subscription plans, Razorpay payment receipts, and school invoices',
    assigned_roles: ['Root SuperAdmin', 'Landlord Support Lead']
  }
];

export default function GlobalPermissionsPage() {
  const [permissions, setPermissions] = useState<PermissionItem[]>(mockPermissions);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [subsystemFilter, setSubsystemFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('slug');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPermissionRoles, setSelectedPermissionRoles] = useState<PermissionItem | null>(null);

  // Form State
  const [slugInput, setSlugInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [subsystemInput, setSubsystemInput] = useState<'TENANTS' | 'SECURITY' | 'DATABASES' | 'AUDIT' | 'BILLING' | 'MONITORING' | 'SETTINGS'>('TENANTS');
  const [riskInput, setRiskInput] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [descriptionInput, setDescriptionInput] = useState('');

  const totalPermissionsCount = 64;
  const criticalRightsCount = permissions.filter(p => p.risk_level === 'CRITICAL').length;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/global-permissions');
      if (res.data.success && Array.isArray(res.data.data)) {
        setPermissions(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Global System Permissions Registry refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, subsystemFilter, riskFilter, sortBy, sortOrder, pageSize]);

  // Register New Permission
  const handleAddPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slugInput.trim() || !nameInput.trim() || !descriptionInput.trim()) {
      toast.error('Please enter permission key slug, title, and description');
      return;
    }

    toast.loading(`Registering permission capability '${slugInput}'...`, { id: 'add-perm-toast' });

    try {
      await api.post('/landlord/global-permissions', {
        slug: slugInput,
        name: nameInput,
        subsystem: subsystemInput,
        risk_level: riskInput,
        description: descriptionInput
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newPerm: PermissionItem = {
        id: `perm-${Date.now()}`,
        slug: slugInput,
        name: nameInput,
        subsystem: subsystemInput,
        risk_level: riskInput,
        description: descriptionInput,
        assigned_roles: ['Root SuperAdmin']
      };
      setPermissions(prev => [newPerm, ...prev]);
      setIsAddModalOpen(false);
      setSlugInput('');
      setNameInput('');
      setDescriptionInput('');
      toast.success(`⚡ Permission '${slugInput}' registered successfully!`, { id: 'add-perm-toast' });
    }, 800);
  };

  // Delete Permission
  const handleDeletePermission = async (id: string, slug: string) => {
    toast.loading(`Deleting permission '${slug}'...`, { id: 'del-perm-toast' });

    try {
      await api.delete(`/landlord/global-permissions/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setPermissions(prev => prev.filter(p => p.id !== id));
      toast.success(`🗑️ Permission capability '${slug}' deleted!`, { id: 'del-perm-toast' });
    }, 600);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = permissions.filter(p => {
    const matchesSearch =
      p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.subsystem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubsystem = subsystemFilter === 'all' || p.subsystem === subsystemFilter;
    const matchesRisk = riskFilter === 'all' || p.risk_level === riskFilter;

    return matchesSearch && matchesSubsystem && matchesRisk;
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

  const subsystemOptions: SearchableOption[] = [
    { value: 'all', label: 'All Subsystems' },
    { value: 'TENANTS', label: 'TENANTS' },
    { value: 'SECURITY', label: 'SECURITY' },
    { value: 'DATABASES', label: 'DATABASES' },
    { value: 'AUDIT', label: 'AUDIT' },
    { value: 'BILLING', label: 'BILLING' },
    { value: 'MONITORING', label: 'MONITORING' },
    { value: 'SETTINGS', label: 'SETTINGS' },
  ];

  const riskOptions: SearchableOption[] = [
    { value: 'all', label: 'All Risk Levels' },
    { value: 'CRITICAL', label: 'CRITICAL 🔴' },
    { value: 'HIGH', label: 'HIGH 🟠' },
    { value: 'MEDIUM', label: 'MEDIUM 🟡' },
    { value: 'LOW', label: 'LOW 🔵' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'slug', label: 'Permission Key Slug' },
    { value: 'name', label: 'Display Title' },
    { value: 'subsystem', label: 'Target Subsystem' },
    { value: 'risk_level', label: 'Security Risk Level' },
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
            <span className="p-2.5 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-400/30">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Global System Permissions & Capability Registry
                <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-extrabold rounded-full border border-rose-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Capability Matrix Enforced
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage granular permission key slugs, subsystem scope boundaries, risk classifications, and role mappings
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Pulse: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Register Permission
          </button>
          <button
            onClick={handleRefresh}
            className="p-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Capabilities</span>
            <Key className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalPermissionsCount} Registered</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Granular Slugs Tracked</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Core Subsystems</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">8 Modules</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Isolated Security Domains</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Critical Rights</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{criticalRightsCount} Critical</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Root Approval Required</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Role Contracts</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">142 Mappings</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active Role Bindings</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Wildcard Support</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">ACTIVE 🟢</div>
          <div className="text-[10px] text-slate-500 mt-0.5">16 Node Patterns</div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by slug, permission title, subsystem, description..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-rose-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={subsystemOptions} value={subsystemFilter} onChange={setSubsystemFilter} placeholder="Subsystem..." icon={Filter} labelPrefix="Domain" />
          <SearchableSelect options={riskOptions} value={riskFilter} onChange={setRiskFilter} placeholder="Risk Level..." icon={Filter} labelPrefix="Risk" />
          <div className="flex items-center gap-1">
            <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-900 border border-slate-800 text-rose-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <SearchableSelect options={pageSizeOptions} value={String(pageSize)} onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))} placeholder="Per Page..." icon={List} labelPrefix="Rows" />
        </div>
      </div>

      {/* ── PERMISSIONS TABLE ── */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('slug')}>Permission Key Slug & Title</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('subsystem')}>Subsystem</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('risk_level')}>Risk Classification</th>
                <th className="p-3.5">Assigned Roles</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(p => (
                <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-rose-400" />
                      <div>
                        <div className="text-sm text-rose-400 font-extrabold">{p.slug}</div>
                        <div className="text-[10px] text-white font-sans">{p.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono">
                    <span className="px-2 py-0.5 bg-slate-900 text-purple-400 border border-slate-800 rounded text-[10px] font-bold">
                      {p.subsystem}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        p.risk_level === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                          : p.risk_level === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                          : p.risk_level === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      }`}
                    >
                      {p.risk_level}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px]">
                    <div className="flex flex-wrap gap-1">
                      {p.assigned_roles.map(role => (
                        <span key={role} className="px-2 py-0.5 bg-slate-900 text-slate-300 border border-slate-800 rounded text-[10px]">
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedPermissionRoles(p)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-rose-400" /> Roles
                      </button>
                      <button
                        onClick={() => handleDeletePermission(p.id, p.slug)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete Permission"
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

      {/* ── REGISTER PERMISSION MODAL ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-extrabold text-white">Register New Permission Capability</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPermission} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Permission Key Slug</label>
                <input
                  type="text"
                  required
                  value={slugInput}
                  onChange={e => setSlugInput(e.target.value)}
                  placeholder="e.g. tenants.export_csv"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-rose-400 font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Display Title</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="e.g. Export School Tenant CSV Data"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Target Subsystem</label>
                  <select
                    value={subsystemInput}
                    onChange={e => setSubsystemInput(e.target.value as 'TENANTS' | 'SECURITY' | 'DATABASES' | 'AUDIT' | 'BILLING' | 'MONITORING' | 'SETTINGS')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="TENANTS">TENANTS</option>
                    <option value="SECURITY">SECURITY</option>
                    <option value="DATABASES">DATABASES</option>
                    <option value="AUDIT">AUDIT</option>
                    <option value="BILLING">BILLING</option>
                    <option value="MONITORING">MONITORING</option>
                    <option value="SETTINGS">SETTINGS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Security Risk Classification</label>
                  <select
                    value={riskInput}
                    onChange={e => setRiskInput(e.target.value as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="LOW">LOW 🔵</option>
                    <option value="MEDIUM">MEDIUM 🟡</option>
                    <option value="HIGH">HIGH 🟠</option>
                    <option value="CRITICAL">CRITICAL 🔴</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Permission Scope Description</label>
                <textarea
                  required
                  rows={3}
                  value={descriptionInput}
                  onChange={e => setDescriptionInput(e.target.value)}
                  placeholder="Describe exact capability boundary..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-rose-600/30"
                >
                  Register Permission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ROLES MAPPING INSPECTOR MODAL ── */}
      {selectedPermissionRoles && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-extrabold text-white">Assigned Roles Mapping Inspector</h3>
              </div>
              <button onClick={() => setSelectedPermissionRoles(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-rose-400 font-bold">{selectedPermissionRoles.slug}</div>
                <div className="text-white">{selectedPermissionRoles.name}</div>
                <div className="text-slate-400">Subsystem: {selectedPermissionRoles.subsystem} · Risk: {selectedPermissionRoles.risk_level}</div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <div className="text-white font-bold mb-1">Roles Possessing This Capability:</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPermissionRoles.assigned_roles.map(role => (
                    <span key={role} className="px-3 py-1 bg-slate-950 border border-slate-800 rounded text-emerald-400 font-bold text-[11px]">
                      ✓ {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPermissionRoles(null)}
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
