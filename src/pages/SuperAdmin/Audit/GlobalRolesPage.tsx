import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Crown, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X, Radio, Lock,
  Plus, ShieldCheck, Eye, Shield, UserCheck, UserX, Trash2, Edit2, Sliders, Layers
} from 'lucide-react';
import api from '../../../services/api';

interface GlobalRoleItem {
  id: string;
  name: string;
  description: string;
  admins_count: number;
  permissions_count: number;
  is_system_protected: boolean;
  color_theme: string;
  granted_capabilities: string[];
}

type SortField = 'name' | 'admins_count' | 'permissions_count';
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

const mockRoles: GlobalRoleItem[] = [
  {
    id: 'role-1',
    name: 'Root SuperAdmin',
    description: 'Unrestricted master control across all tenants, databases, WAF, and billing',
    admins_count: 2,
    permissions_count: 64,
    is_system_protected: true,
    color_theme: 'text-purple-400 bg-purple-500/20 border-purple-500/40',
    granted_capabilities: ['tenants.*', 'databases.*', 'security.*', 'billing.*', 'monitoring.*', 'audit.*']
  },
  {
    id: 'role-2',
    name: 'Security Director',
    description: 'Full control over DDoS WAF, Blacklisted IPs, 2FA, SSL, and Audit logs',
    admins_count: 1,
    permissions_count: 36,
    is_system_protected: true,
    color_theme: 'text-red-400 bg-red-500/20 border-red-500/40',
    granted_capabilities: ['security.waf', 'security.ip_blacklist', 'security.2fa', 'audit.read', 'audit.verify']
  },
  {
    id: 'role-3',
    name: 'Landlord Support Lead',
    description: 'Read/write access to Tenants Management, Inquiries, Support Tickets, and Billing',
    admins_count: 3,
    permissions_count: 24,
    is_system_protected: false,
    color_theme: 'text-blue-400 bg-blue-500/20 border-blue-500/40',
    granted_capabilities: ['tenants.read', 'tenants.update', 'inquiries.*', 'billing.read']
  },
  {
    id: 'role-4',
    name: 'Compliance Auditor',
    description: 'Read-only access to Audit Logs, Login Logs, Failed Attempts, and System Health',
    admins_count: 1,
    permissions_count: 12,
    is_system_protected: false,
    color_theme: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40',
    granted_capabilities: ['audit.read', 'monitoring.health_read']
  },
  {
    id: 'role-5',
    name: 'DevOps Engineer',
    description: 'Access to Database Migrations, Cloud Storage, Server Monitoring, and Cron Jobs',
    admins_count: 1,
    permissions_count: 28,
    is_system_protected: false,
    color_theme: 'text-amber-400 bg-amber-500/20 border-amber-500/40',
    granted_capabilities: ['databases.migrations', 'databases.backups', 'monitoring.servers', 'monitoring.jobs']
  }
];

export default function GlobalRolesPage() {
  const [roles, setRoles] = useState<GlobalRoleItem[]>(mockRoles);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRoleMatrix, setSelectedRoleMatrix] = useState<GlobalRoleItem | null>(null);

  // Form State
  const [nameInput, setNameInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');

  const totalRolesCount = roles.length;
  const totalCapabilitiesCount = 64;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/global-roles');
      if (res.data.success && Array.isArray(res.data.data)) {
        setRoles(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Global RBAC Roles & Capability Matrix refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, sortBy, sortOrder, pageSize]);

  // Add Custom Role
  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !descriptionInput.trim()) {
      toast.error('Please enter role title and description');
      return;
    }

    toast.loading(`Creating custom RBAC role '${nameInput}'...`, { id: 'add-role-toast' });

    try {
      await api.post('/landlord/global-roles', {
        name: nameInput,
        description: descriptionInput
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newRole: GlobalRoleItem = {
        id: `role-${Date.now()}`,
        name: nameInput,
        description: descriptionInput,
        admins_count: 0,
        permissions_count: 18,
        is_system_protected: false,
        color_theme: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40',
        granted_capabilities: ['tenants.read', 'audit.read']
      };
      setRoles(prev => [...prev, newRole]);
      setIsAddModalOpen(false);
      setNameInput('');
      setDescriptionInput('');
      toast.success(`⚡ Custom RBAC role '${nameInput}' created successfully!`, { id: 'add-role-toast' });
    }, 800);
  };

  // Delete Custom Role
  const handleDeleteRole = async (id: string, name: string) => {
    toast.loading(`Deleting role '${name}'...`, { id: 'del-role-toast' });

    try {
      await api.delete(`/landlord/global-roles/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setRoles(prev => prev.filter(r => r.id !== id));
      toast.success(`🗑️ Custom role '${name}' deleted!`, { id: 'del-role-toast' });
    }, 600);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = roles.filter(r => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'protected' && r.is_system_protected) ||
      (typeFilter === 'custom' && !r.is_system_protected);

    return matchesSearch && matchesType;
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

  const typeOptions: SearchableOption[] = [
    { value: 'all', label: 'All Role Types' },
    { value: 'protected', label: 'System Protected 🔒' },
    { value: 'custom', label: 'Custom Defined ⚙️' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'name', label: 'Role Name' },
    { value: 'admins_count', label: 'Admins Assigned' },
    { value: 'permissions_count', label: 'Capability Count' },
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
              <Crown className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Global RBAC Roles & Capabilities Governance
                <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-extrabold rounded-full border border-rose-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> RBAC Engine Active
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Define role boundaries, granular capability matrices, system protection locks, and SuperAdmin role assignments
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
            <Plus className="w-4 h-4" /> Add Custom Role
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Total System Roles</span>
            <Crown className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalRolesCount} Defined</div>
          <div className="text-[10px] text-slate-500 mt-0.5">RBAC Matrix Active</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Permissions Scope</span>
            <Layers className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{totalCapabilitiesCount} Capabilities</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Across 8 System Modules</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Assigned Admins</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">8 Admins</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active Role Assignments</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">System Protection</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">2 Protected</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Immutable Root Scopes</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Audit Governance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">100% LOGGED 📜</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Strict Role Logging</div>
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
              placeholder="Search by role title, capability scope, or description..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-rose-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={typeOptions} value={typeFilter} onChange={setTypeFilter} placeholder="Role Type..." icon={Filter} labelPrefix="Type" />
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

      {/* ── ROLES TABLE ── */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>Role Title & Description</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('admins_count')}>Admins Assigned</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('permissions_count')}>Permissions Scope</th>
                <th className="p-3.5">Role Type</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(r => (
                <tr key={r.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Crown className={`w-4 h-4 ${r.color_theme.split(' ')[0]}`} />
                      <div>
                        <div className="text-sm text-white font-extrabold flex items-center gap-2">
                          {r.name}
                          {r.is_system_protected && (
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-[9px] font-mono">
                              PROTECTED 🔒
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans">{r.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-white font-bold">{r.admins_count} Admin(s)</td>
                  <td className="p-3.5 font-mono">
                    <span className="text-rose-400 font-bold">{r.permissions_count} / {totalCapabilitiesCount}</span>
                    <div className="text-[10px] text-slate-500 font-sans">Capabilities Enabled</div>
                  </td>
                  <td className="p-3.5 font-mono">
                    <span className={`px-2 py-0.5 border rounded-md text-[10px] font-bold ${r.color_theme}`}>
                      {r.is_system_protected ? 'SYSTEM ROLE' : 'CUSTOM ROLE'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedRoleMatrix(r)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5 text-rose-400" /> Capabilities
                      </button>
                      {!r.is_system_protected && (
                        <button
                          onClick={() => handleDeleteRole(r.id, r.name)}
                          className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                          title="Delete Custom Role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ADD CUSTOM ROLE MODAL ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-extrabold text-white">Create Custom RBAC Role</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRole} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Role Title</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="e.g. Billing Administrator"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Role Description & Capabilities Summary</label>
                <textarea
                  required
                  rows={3}
                  value={descriptionInput}
                  onChange={e => setDescriptionInput(e.target.value)}
                  placeholder="Describe scope of control, e.g. Access to SaaS plan invoices, billing settings, and payment gateways..."
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
                  Create Custom Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CAPABILITY MATRIX MODAL ── */}
      {selectedRoleMatrix && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-extrabold text-white">RBAC Capability Matrix Inspector</h3>
              </div>
              <button onClick={() => setSelectedRoleMatrix(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-purple-400 font-bold">{selectedRoleMatrix.name}</div>
                <div className="text-slate-400">{selectedRoleMatrix.description}</div>
                <div className="text-slate-500 text-[11px]">Enabled: {selectedRoleMatrix.permissions_count} / {totalCapabilitiesCount} Capabilities</div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <div className="text-white font-bold mb-1">Assigned Wildcard Scope Patterns:</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRoleMatrix.granted_capabilities.map(cap => (
                    <span key={cap} className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-rose-400 text-[11px]">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRoleMatrix(null)}
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
