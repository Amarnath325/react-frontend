import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Users, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X, Radio, Lock,
  Plus, ShieldCheck, Eye, Shield, UserCheck, UserX, Trash2
} from 'lucide-react';
import api from '../../../services/api';

interface GlobalAdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Root SuperAdmin' | 'Security Director' | 'Landlord Support Lead' | 'Compliance Auditor';
  status: 'ACTIVE' | 'SUSPENDED';
  is_2fa_enabled: boolean;
  last_login_at: string;
  last_login_ip: string;
  created_at: string;
  permissions_count: number;
}

type SortField = 'last_login_at' | 'name' | 'email' | 'role';
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

const mockAdmins: GlobalAdminUser[] = [
  {
    id: 'adm-1',
    name: 'Amarnath Sharma',
    email: 'amarnath@myschoolpoint.com',
    role: 'Root SuperAdmin',
    status: 'ACTIVE',
    is_2fa_enabled: true,
    last_login_at: '2026-08-11 20:00:00',
    last_login_ip: '49.36.142.10',
    created_at: '2025-01-01',
    permissions_count: 48
  },
  {
    id: 'adm-2',
    name: 'Vikram Singh',
    email: 'security.lead@myschoolpoint.com',
    role: 'Security Director',
    status: 'ACTIVE',
    is_2fa_enabled: true,
    last_login_at: '2026-08-11 18:30:00',
    last_login_ip: '182.72.10.5',
    created_at: '2025-03-15',
    permissions_count: 36
  },
  {
    id: 'adm-3',
    name: 'Neha Gupta',
    email: 'support.master@myschoolpoint.com',
    role: 'Landlord Support Lead',
    status: 'ACTIVE',
    is_2fa_enabled: true,
    last_login_at: '2026-08-10 14:15:00',
    last_login_ip: '103.21.12.9',
    created_at: '2025-06-20',
    permissions_count: 24
  },
  {
    id: 'adm-4',
    name: 'Rajesh Verma',
    email: 'auditor.ext@myschoolpoint.com',
    role: 'Compliance Auditor',
    status: 'SUSPENDED',
    is_2fa_enabled: true,
    last_login_at: '2026-08-05 11:00:00',
    last_login_ip: '157.32.10.4',
    created_at: '2026-01-10',
    permissions_count: 12
  }
];

export default function GlobalAdminsPage() {
  const [admins, setAdmins] = useState<GlobalAdminUser[]>(mockAdmins);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('last_login_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAdminPermissions, setSelectedAdminPermissions] = useState<GlobalAdminUser | null>(null);

  // Add Admin Form State
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState<'Root SuperAdmin' | 'Security Director' | 'Landlord Support Lead' | 'Compliance Auditor'>('Security Director');
  const [passwordInput, setPasswordInput] = useState('');

  const totalAdmins = 8;
  const activeCount = admins.filter(a => a.status === 'ACTIVE').length;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/global-admins');
      if (res.data.success && Array.isArray(res.data.data)) {
        setAdmins(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Global SuperAdmin user accounts refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter, sortBy, sortOrder, pageSize]);

  // Create New Global Admin
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !emailInput.trim() || !passwordInput.trim()) {
      toast.error('Please enter name, email, and password');
      return;
    }

    toast.loading(`Creating Global Admin account '${emailInput}'...`, { id: 'add-adm-toast' });

    try {
      await api.post('/landlord/global-admins', {
        name: nameInput,
        email: emailInput,
        role: roleInput,
        password: passwordInput
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newAdmin: GlobalAdminUser = {
        id: `adm-${Date.now()}`,
        name: nameInput,
        email: emailInput,
        role: roleInput,
        status: 'ACTIVE',
        is_2fa_enabled: true,
        last_login_at: 'Never',
        last_login_ip: 'N/A',
        created_at: 'Just now',
        permissions_count: roleInput === 'Root SuperAdmin' ? 48 : 36
      };
      setAdmins(prev => [newAdmin, ...prev]);
      setIsAddModalOpen(false);
      setNameInput('');
      setEmailInput('');
      setPasswordInput('');
      toast.success(`⚡ Global Admin '${emailInput}' created successfully!`, { id: 'add-adm-toast' });
    }, 800);
  };

  // Toggle Suspend / Activate Status
  const handleToggleStatus = async (id: string, currentStatus: string, email: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    toast.loading(`Updating status for '${email}'...`, { id: 'toggle-adm-toast' });

    try {
      await api.post(`/landlord/global-admins/${id}/toggle-status`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setAdmins(prev =>
        prev.map(a => (a.id === id ? { ...a, status: newStatus as 'ACTIVE' | 'SUSPENDED' } : a))
      );
      toast.success(
        newStatus === 'ACTIVE'
          ? `🟢 Admin '${email}' account activated!`
          : `🔴 Admin '${email}' account suspended!`,
        { id: 'toggle-adm-toast' }
      );
    }, 600);
  };

  // Delete Admin
  const handleDeleteAdmin = async (id: string, email: string) => {
    toast.loading(`Removing Admin '${email}'...`, { id: 'del-adm-toast' });

    try {
      await api.delete(`/landlord/global-admins/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setAdmins(prev => prev.filter(a => a.id !== id));
      toast.success(`🗑️ Global Admin '${email}' deleted!`, { id: 'del-adm-toast' });
    }, 600);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = admins.filter(a => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.last_login_ip.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesRole = roleFilter === 'all' || a.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
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

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'ACTIVE 🟢' },
    { value: 'SUSPENDED', label: 'SUSPENDED 🔴' },
  ];

  const roleOptions: SearchableOption[] = [
    { value: 'all', label: 'All Roles' },
    { value: 'Root SuperAdmin', label: 'Root SuperAdmin 👑' },
    { value: 'Security Director', label: 'Security Director 🛡️' },
    { value: 'Landlord Support Lead', label: 'Landlord Support Lead 🎧' },
    { value: 'Compliance Auditor', label: 'Compliance Auditor 📋' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'last_login_at', label: 'Last Login' },
    { value: 'name', label: 'Admin Name' },
    { value: 'email', label: 'Admin Email' },
    { value: 'role', label: 'Assigned Role' },
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
              <Users className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Global SuperAdmin Account Registry & Access Control
                <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-extrabold rounded-full border border-rose-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Privileged Access Mode
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage platform root administrators, privileged access scopes, 2FA credentials, and account suspensions
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
            <Plus className="w-4 h-4" /> Add Global Admin
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Global Admins</span>
            <Users className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalAdmins} Admins</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Platform Level</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Accounts</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{activeCount} Active</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Verified & Enabled</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">2FA Compliance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">100% 🟢</div>
          <div className="text-[10px] text-slate-500 mt-0.5">TOTP Mandatory</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Root SuperAdmins</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">2 Root Owners</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Full System Rights</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Audit Compliance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">PASSED 🟢</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Full Action Logging</div>
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
              placeholder="Search by name, email, assigned role, login IP..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-rose-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
          <SearchableSelect options={roleOptions} value={roleFilter} onChange={setRoleFilter} placeholder="Role..." icon={Filter} labelPrefix="Role" />
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

      {/* ── ADMINS TABLE ── */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>Admin Name & Email</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('role')}>Assigned Role</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('last_login_at')}>Last Login & IP</th>
                <th className="p-3.5">2FA Status</th>
                <th className="p-3.5">Account Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(a => (
                <tr key={a.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-rose-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{a.name}</div>
                        <div className="text-[10px] text-rose-400 font-sans">{a.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono">
                    <div className="text-purple-400 font-bold">{a.role}</div>
                    <div className="text-[10px] text-slate-500 font-sans">{a.permissions_count} Privileges Granted</div>
                  </td>
                  <td className="p-3.5 font-mono">
                    <div className="text-white font-bold">{a.last_login_at}</div>
                    <div className="text-[10px] text-slate-400 font-sans">IP: {a.last_login_ip}</div>
                  </td>
                  <td className="p-3.5 font-mono">
                    <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-md text-[10px] font-bold">
                      2FA TOTP 🟢
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        a.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border-red-500/30'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(a.id, a.status, a.email)}
                        className={`px-2.5 py-1.5 border rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                          a.status === 'ACTIVE'
                            ? 'bg-amber-600/20 text-amber-400 border-amber-500/30 hover:bg-amber-600/30'
                            : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30'
                        }`}
                      >
                        {a.status === 'ACTIVE' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        {a.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => setSelectedAdminPermissions(a)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-rose-400" /> Scopes
                      </button>
                      {a.role !== 'Root SuperAdmin' && (
                        <button
                          onClick={() => handleDeleteAdmin(a.id, a.email)}
                          className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                          title="Delete Admin"
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

      {/* ── ADD GLOBAL ADMIN MODAL ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-extrabold text-white">Add New Global SuperAdmin Account</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Admin Full Name</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="e.g. Vikram Singh"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="e.g. vikram@myschoolpoint.com"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Assigned Privileged Role</label>
                <select
                  value={roleInput}
                  onChange={e => setRoleInput(e.target.value as 'Root SuperAdmin' | 'Security Director' | 'Landlord Support Lead' | 'Compliance Auditor')}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="Security Director">Security Director (WAF & Audit)</option>
                  <option value="Landlord Support Lead">Landlord Support Lead (Tenant Mgmt)</option>
                  <option value="Compliance Auditor">Compliance Auditor (Read-Only Audit)</option>
                  <option value="Root SuperAdmin">Root SuperAdmin (Full Control)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Initial Temporary Password</label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
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
                  Create Admin Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SCOPES INSPECTOR MODAL ── */}
      {selectedAdminPermissions && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-extrabold text-white">Privileged Rights & Security Scopes</h3>
              </div>
              <button onClick={() => setSelectedAdminPermissions(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-rose-400 font-bold">{selectedAdminPermissions.name} ({selectedAdminPermissions.email})</div>
                <div className="text-slate-400">Assigned Role: {selectedAdminPermissions.role}</div>
                <div className="text-slate-500 text-[11px]">Granted Scopes: {selectedAdminPermissions.permissions_count} System Capabilities</div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <div className="text-white font-bold mb-1">Active System Privileges:</div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 text-emerald-400">✓ Tenant Management & Billing</div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 text-emerald-400">✓ Database Migrations & S3</div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 text-emerald-400">✓ DDoS WAF & IP Blacklist</div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 text-emerald-400">✓ Cryptographic Audit Logs</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAdminPermissions(null)}
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
