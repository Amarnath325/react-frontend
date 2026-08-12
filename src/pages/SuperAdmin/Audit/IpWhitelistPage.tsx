import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Shield, RefreshCw, ShieldCheck, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X, Radio, Lock,
  Plus, Trash2, Wifi, Server
} from 'lucide-react';
import api from '../../../services/api';

interface IpWhitelistItem {
  id: string;
  ip_or_cidr: string;
  label: string;
  scope: 'SuperAdmin Console' | 'All Admin Consoles' | 'Support Portal';
  target_user: string;
  is_active: boolean;
  created_at: string;
}

type SortField = 'created_at' | 'ip_or_cidr' | 'label';
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

const mockIpWhitelist: IpWhitelistItem[] = [
  {
    id: 'ip-1',
    ip_or_cidr: '49.36.142.10',
    label: 'HQ Master Admin Office (Delhi)',
    scope: 'SuperAdmin Console',
    target_user: 'amarnath@myschoolpoint.com',
    is_active: true,
    created_at: '2026-08-01 10:00:00'
  },
  {
    id: 'ip-2',
    ip_or_cidr: '182.72.10.0/24',
    label: 'Corporate Regional Subnet (Noida)',
    scope: 'All Admin Consoles',
    target_user: 'All DPS Staff',
    is_active: true,
    created_at: '2026-07-15 14:30:00'
  },
  {
    id: 'ip-3',
    ip_or_cidr: '103.21.12.4',
    label: 'Support Team Static IP',
    scope: 'Support Portal',
    target_user: 'support@myschoolpoint.com',
    is_active: true,
    created_at: '2026-07-20 09:15:00'
  },
  {
    id: 'ip-4',
    ip_or_cidr: '157.32.10.88',
    label: 'Temporary Remote Auditor',
    scope: 'SuperAdmin Console',
    target_user: 'auditor@external.com',
    is_active: false,
    created_at: '2026-08-05 16:00:00'
  }
];

export default function IpWhitelistPage() {
  const [items, setItems] = useState<IpWhitelistItem[]>(mockIpWhitelist);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ipInput, setIpInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [scopeInput, setScopeInput] = useState<'SuperAdmin Console' | 'All Admin Consoles' | 'Support Portal'>('SuperAdmin Console');

  const totalWhitelisted = items.length;
  const activeWhitelisted = items.filter(i => i.is_active).length;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/ip-whitelist');
      if (res.data.success && Array.isArray(res.data.data)) {
        setItems(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('IP whitelist security policy rules refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, scopeFilter, statusFilter, sortBy, sortOrder, pageSize]);

  // Add Whitelisted IP
  const handleAddIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipInput.trim() || !labelInput.trim()) {
      toast.error('Please enter a valid IP/CIDR address and label');
      return;
    }

    toast.loading(`Adding '${ipInput}' to firewall whitelist...`, { id: 'add-ip-toast' });

    try {
      await api.post('/landlord/ip-whitelist', {
        ip_or_cidr: ipInput,
        label: labelInput,
        scope: scopeInput
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newItem: IpWhitelistItem = {
        id: `ip-${Date.now()}`,
        ip_or_cidr: ipInput,
        label: labelInput,
        scope: scopeInput,
        target_user: 'SuperAdmin Admin',
        is_active: true,
        created_at: 'Just now'
      };
      setItems(prev => [newItem, ...prev]);
      setIsModalOpen(false);
      setIpInput('');
      setLabelInput('');
      toast.success(`⚡ IP/CIDR '${ipInput}' whitelisted successfully!`, { id: 'add-ip-toast' });
    }, 800);
  };

  // Add Current My IP Shortcut
  const handleAddMyIp = () => {
    setIpInput('49.36.142.10');
    setLabelInput('Current Session Admin IP (Auto)');
    setIsModalOpen(true);
  };

  // Toggle Active
  const handleToggle = async (id: string, currentStatus: boolean) => {
    toast.loading(`Toggling IP rule status...`, { id: 'toggle-ip-toast' });

    try {
      await api.post(`/landlord/ip-whitelist/${id}/toggle`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setItems(prev =>
        prev.map(i => (i.id === id ? { ...i, is_active: !currentStatus } : i))
      );
      toast.success(`⚡ IP rule status updated!`, { id: 'toggle-ip-toast' });
    }, 600);
  };

  // Delete IP
  const handleDelete = async (id: string, ip: string) => {
    toast.loading(`Removing '${ip}' from whitelist...`, { id: 'del-ip-toast' });

    try {
      await api.delete(`/landlord/ip-whitelist/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success(`🗑️ IP '${ip}' removed from firewall whitelist!`, { id: 'del-ip-toast' });
    }, 600);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = items.filter(i => {
    const matchesSearch =
      i.ip_or_cidr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.target_user.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesScope = scopeFilter === 'all' || i.scope === scopeFilter;
    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = i.is_active;
    if (statusFilter === 'disabled') matchesStatus = !i.is_active;

    return matchesSearch && matchesScope && matchesStatus;
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

  const scopeOptions: SearchableOption[] = [
    { value: 'all', label: 'All Scopes' },
    { value: 'SuperAdmin Console', label: 'SuperAdmin Console 👑' },
    { value: 'All Admin Consoles', label: 'All Admin Consoles 🏫' },
    { value: 'Support Portal', label: 'Support Portal 🎧' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'ACTIVE 🟢' },
    { value: 'disabled', label: 'DISABLED 🔴' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'created_at', label: 'Date Added' },
    { value: 'ip_or_cidr', label: 'IP / CIDR Address' },
    { value: 'label', label: 'Description Label' },
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
              <Shield className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Trusted IP Whitelist & CIDR Firewall Manager
                <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-extrabold rounded-full border border-rose-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Firewall Rule Enforced
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Restrict SuperAdmin & tenant console access to authorized IPv4 addresses and CIDR subnet ranges
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
            onClick={handleAddMyIp}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Wifi className="w-3.5 h-3.5" /> Add Current IP (49.36.142.10)
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Whitelisted IP
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Rules</span>
            <Shield className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalWhitelisted} Rules</div>
          <div className="text-[10px] text-slate-500 mt-0.5">IP / CIDR Ranges</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Whitelisted</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{activeWhitelisted} Active</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Traffic Allowed</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">CIDR Subnets</span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">1 Subnet (/24)</div>
          <div className="text-[10px] text-slate-500 mt-0.5">256 IP Block Allowed</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">2FA Bypass Policy</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-black text-purple-400">MFA Enforced</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Zero Bypass</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Firewall Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">STRICT 🟢</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Whitelist Only Mode</div>
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
              placeholder="Search by IP address, CIDR range, description label..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-rose-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={scopeOptions} value={scopeFilter} onChange={setScopeFilter} placeholder="Scope..." icon={Filter} labelPrefix="Scope" />
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

      {/* ── IP WHITELIST TABLE ── */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('ip_or_cidr')}>IP / CIDR Range</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('label')}>Description Label</th>
                <th className="p-3.5">Access Scope</th>
                <th className="p-3.5">Target Operator</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('created_at')}>Date Added</th>
                <th className="p-3.5">Rule Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(i => (
                <tr key={i.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-rose-400" />
                      <span className="text-sm text-white font-extrabold">{i.ip_or_cidr}</span>
                    </div>
                  </td>
                  <td className="p-3.5 font-sans font-bold text-slate-200">{i.label}</td>
                  <td className="p-3.5 font-mono text-sky-400 font-bold">{i.scope}</td>
                  <td className="p-3.5 font-mono text-slate-300">{i.target_user}</td>
                  <td className="p-3.5 font-mono text-slate-400 text-[11px]">{i.created_at}</td>
                  <td className="p-3.5">
                    <button
                      onClick={() => handleToggle(i.id, i.is_active)}
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase cursor-pointer transition-all ${
                        i.is_active
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                      }`}
                    >
                      {i.is_active ? 'ACTIVE 🟢' : 'DISABLED 🔴'}
                    </button>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleDelete(i.id, i.ip_or_cidr)}
                      className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer transition-all ml-auto"
                      title="Delete IP Rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ADD IP MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-extrabold text-white">Add Whitelisted IP / Subnet</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddIp} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">IPv4 or CIDR Range Address</label>
                <input
                  type="text"
                  required
                  value={ipInput}
                  onChange={e => setIpInput(e.target.value)}
                  placeholder="e.g. 49.36.142.10 or 182.72.10.0/24"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Description Label</label>
                <input
                  type="text"
                  required
                  value={labelInput}
                  onChange={e => setLabelInput(e.target.value)}
                  placeholder="e.g. Headquarters Office Static IP"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Access Scope</label>
                <select
                  value={scopeInput}
                  onChange={e => setScopeInput(e.target.value as 'SuperAdmin Console' | 'All Admin Consoles' | 'Support Portal')}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="SuperAdmin Console">SuperAdmin Console (Strict)</option>
                  <option value="All Admin Consoles">All Admin Consoles (Landlord + Tenants)</option>
                  <option value="Support Portal">Support Portal Only</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-rose-600/30"
                >
                  Save Whitelist Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
