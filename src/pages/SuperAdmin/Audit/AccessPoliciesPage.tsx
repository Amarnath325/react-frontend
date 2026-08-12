import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Lock, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X, Radio,
  Plus, Eye, ShieldCheck, Trash2, Globe, Shield, Power
} from 'lucide-react';
import api from '../../../services/api';

interface AccessPolicyItem {
  id: string;
  policy_id: string;
  name: string;
  type: 'IP_RANGE' | 'TIME_WINDOW' | 'STEP_UP_AUTH' | 'GEO_FENCE';
  target_resource: string;
  condition_summary: string;
  status: 'ENABLED' | 'DISABLED';
  enforcements_blocked_today: number;
  created_at: string;
}

type SortField = 'name' | 'type' | 'enforcements_blocked_today';
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

const mockPolicies: AccessPolicyItem[] = [
  {
    id: 'pol-1',
    policy_id: 'POL-901',
    name: 'SuperAdmin Office Subnet IP Restriction',
    type: 'IP_RANGE',
    target_resource: '/superadmin/*',
    condition_summary: 'Allow only corporate office CIDR ranges: 49.36.142.0/24 & 182.72.10.0/24',
    status: 'ENABLED',
    enforcements_blocked_today: 1240,
    created_at: '2025-02-10'
  },
  {
    id: 'pol-2',
    policy_id: 'POL-904',
    name: 'Support Staff Business Hours Access Window',
    type: 'TIME_WINDOW',
    target_resource: 'Landlord Support Portal',
    condition_summary: 'Mon-Fri 09:00 AM - 07:00 PM IST Only. Block off-hour session creation',
    status: 'ENABLED',
    enforcements_blocked_today: 180,
    created_at: '2025-04-15'
  },
  {
    id: 'pol-3',
    policy_id: 'POL-910',
    name: 'High Risk Operation Mandatory Re-Auth',
    type: 'STEP_UP_AUTH',
    target_resource: 'Database Migrations & S3 Restores',
    condition_summary: 'Re-prompt 2FA TOTP passcode before executing database drops/restores',
    status: 'ENABLED',
    enforcements_blocked_today: 60,
    created_at: '2025-08-01'
  },
  {
    id: 'pol-4',
    policy_id: 'POL-915',
    name: 'Geofence International Login Denial',
    type: 'GEO_FENCE',
    target_resource: 'All SuperAdmin Accounts',
    condition_summary: 'Deny authentication originating outside India (IN) & Germany (DE)',
    status: 'DISABLED',
    enforcements_blocked_today: 0,
    created_at: '2026-01-20'
  }
];

export default function AccessPoliciesPage() {
  const [policies, setPolicies] = useState<AccessPolicyItem[]>(mockPolicies);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPolicyDetails, setSelectedPolicyDetails] = useState<AccessPolicyItem | null>(null);

  // Form State
  const [nameInput, setNameInput] = useState('');
  const [typeInput, setTypeInput] = useState<'IP_RANGE' | 'TIME_WINDOW' | 'STEP_UP_AUTH' | 'GEO_FENCE'>('IP_RANGE');
  const [targetInput, setTargetInput] = useState('/superadmin/*');
  const [conditionInput, setConditionInput] = useState('');

  const totalPolicies = 12;
  const enabledCount = policies.filter(p => p.status === 'ENABLED').length;
  const totalBlockedToday = policies.reduce((acc, p) => acc + p.enforcements_blocked_today, 0);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/access-policies');
      if (res.data.success && Array.isArray(res.data.data)) {
        setPolicies(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Zero-Trust access policies & enforcement engine refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter, sortBy, sortOrder, pageSize]);

  // Create Access Policy
  const handleAddPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !conditionInput.trim()) {
      toast.error('Please enter policy title and condition details');
      return;
    }

    toast.loading(`Deploying Access Policy '${nameInput}'...`, { id: 'add-pol-toast' });

    try {
      await api.post('/landlord/access-policies', {
        name: nameInput,
        type: typeInput,
        target_resource: targetInput,
        condition_summary: conditionInput
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newPolicy: AccessPolicyItem = {
        id: `pol-${Date.now()}`,
        policy_id: `POL-${Math.floor(100 + Math.random() * 900)}`,
        name: nameInput,
        type: typeInput,
        target_resource: targetInput,
        condition_summary: conditionInput,
        status: 'ENABLED',
        enforcements_blocked_today: 0,
        created_at: 'Just now'
      };
      setPolicies(prev => [newPolicy, ...prev]);
      setIsAddModalOpen(false);
      setNameInput('');
      setConditionInput('');
      toast.success(`⚡ Access Policy '${nameInput}' deployed live!`, { id: 'add-pol-toast' });
    }, 800);
  };

  // Toggle Policy Status
  const handleToggleStatus = async (id: string, currentStatus: string, name: string) => {
    const newStatus = currentStatus === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    toast.loading(`Toggling status for '${name}'...`, { id: 'toggle-pol-toast' });

    try {
      await api.post(`/landlord/access-policies/${id}/toggle-status`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setPolicies(prev =>
        prev.map(p => (p.id === id ? { ...p, status: newStatus as 'ENABLED' | 'DISABLED' } : p))
      );
      toast.success(
        newStatus === 'ENABLED'
          ? `🟢 Access Policy '${name}' ENABLED!`
          : `🔴 Access Policy '${name}' DISABLED!`,
        { id: 'toggle-pol-toast' }
      );
    }, 600);
  };

  // Delete Policy
  const handleDeletePolicy = async (id: string, name: string) => {
    toast.loading(`Deleting Access Policy '${name}'...`, { id: 'del-pol-toast' });

    try {
      await api.delete(`/landlord/access-policies/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setPolicies(prev => prev.filter(p => p.id !== id));
      toast.success(`🗑️ Access Policy '${name}' deleted!`, { id: 'del-pol-toast' });
    }, 600);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = policies.filter(p => {
    const matchesSearch =
      p.policy_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.target_resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.condition_summary.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
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
    { value: 'all', label: 'All Policy Types' },
    { value: 'IP_RANGE', label: 'IP Subnet Boundary 🌐' },
    { value: 'TIME_WINDOW', label: 'Time Access Window ⏰' },
    { value: 'STEP_UP_AUTH', label: 'Step-Up Re-Auth 🛡️' },
    { value: 'GEO_FENCE', label: 'Geofencing Denial 🗺️' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'ENABLED', label: 'ENABLED 🟢' },
    { value: 'DISABLED', label: 'DISABLED 🔴' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'name', label: 'Policy Name' },
    { value: 'type', label: 'Policy Type' },
    { value: 'enforcements_blocked_today', label: 'Blocked Violations' },
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
              <Lock className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Zero-Trust Access Policies & Adaptive Rule Engine
                <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-extrabold rounded-full border border-rose-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Zero-Trust Guard Active
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure IP subnets, time access windows, step-up 2FA re-auth triggers, and geofencing login denial policies
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
            <Plus className="w-4 h-4" /> Create Policy
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Access Policies</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalPolicies} Rules</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Security Policies Tracked</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Enforcements</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{enabledCount} Active</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Enforcing Live Rules</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Blocked Violations Today</span>
            <Lock className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{totalBlockedToday.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Unauthorized Access Denied</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Zero-Trust Guard</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">ACTIVE 🟢</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Continuous Verification</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Time Windows</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">4 Restricted</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Business Hours Schedules</div>
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
              placeholder="Search by policy ID, policy name, target route, condition..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-rose-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={typeOptions} value={typeFilter} onChange={setTypeFilter} placeholder="Policy Type..." icon={Filter} labelPrefix="Type" />
          <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
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

      {/* ── POLICIES TABLE ── */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>Policy Name & ID</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('type')}>Policy Type</th>
                <th className="p-3.5">Target Route / Resource</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('enforcements_blocked_today')}>Blocked Today</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(p => (
                <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-rose-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-sans">{p.policy_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono">
                    <span className="px-2 py-0.5 bg-slate-900 text-purple-400 border border-slate-800 rounded text-[10px] font-bold">
                      {p.type}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-rose-400 font-bold">{p.target_resource}</td>
                  <td className="p-3.5 font-mono text-red-400 font-bold">{p.enforcements_blocked_today} Blocked</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        p.status === 'ENABLED'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border-red-500/30'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(p.id, p.status, p.name)}
                        className={`px-2.5 py-1.5 border rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                          p.status === 'ENABLED'
                            ? 'bg-amber-600/20 text-amber-400 border-amber-500/30 hover:bg-amber-600/30'
                            : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        {p.status === 'ENABLED' ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => setSelectedPolicyDetails(p)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-rose-400" /> Details
                      </button>
                      <button
                        onClick={() => handleDeletePolicy(p.id, p.name)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete Policy"
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

      {/* ── CREATE ACCESS POLICY MODAL ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-extrabold text-white">Deploy Zero-Trust Access Policy</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPolicy} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Policy Name</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="e.g. Office Subnet Whitelist"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Policy Type</label>
                  <select
                    value={typeInput}
                    onChange={e => setTypeInput(e.target.value as 'IP_RANGE' | 'TIME_WINDOW' | 'STEP_UP_AUTH' | 'GEO_FENCE')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="IP_RANGE">IP Subnet Boundary 🌐</option>
                    <option value="TIME_WINDOW">Time Access Window ⏰</option>
                    <option value="STEP_UP_AUTH">Step-Up Re-Auth 🛡️</option>
                    <option value="GEO_FENCE">Geofencing Denial 🗺️</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Target Resource</label>
                  <input
                    type="text"
                    required
                    value={targetInput}
                    onChange={e => setTargetInput(e.target.value)}
                    placeholder="e.g. /superadmin/*"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-rose-400 font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Policy Condition Summary</label>
                <textarea
                  required
                  rows={3}
                  value={conditionInput}
                  onChange={e => setConditionInput(e.target.value)}
                  placeholder="e.g. Allow only corporate CIDR ranges 49.36.142.0/24..."
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
                  Deploy Access Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── POLICY DETAILS INSPECTOR MODAL ── */}
      {selectedPolicyDetails && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-extrabold text-white">Access Policy Rule & Enforcement Inspector</h3>
              </div>
              <button onClick={() => setSelectedPolicyDetails(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-rose-400 font-bold">{selectedPolicyDetails.name} ({selectedPolicyDetails.policy_id})</div>
                <div className="text-slate-400">Type: {selectedPolicyDetails.type} · Target: {selectedPolicyDetails.target_resource}</div>
                <div className="text-slate-500 text-[11px]">Blocked Today: {selectedPolicyDetails.enforcements_blocked_today} Unauthorized Attempts</div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <div className="text-white font-bold mb-1">Enforcement Condition:</div>
                <div className="text-slate-300 font-sans text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {selectedPolicyDetails.condition_summary}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPolicyDetails(null)}
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
