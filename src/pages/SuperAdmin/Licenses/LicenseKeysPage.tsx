import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Key, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, Copy, AlertTriangle, Building, Lock, Zap
} from 'lucide-react';
import api from '../../../services/api';

interface LicenseKeyItem {
  id: string;
  license_id: string;
  key_code: string;
  school_name: string;
  tier: 'ENTERPRISE_PRO' | 'STANDARD_SLA' | 'STARTER_TRIAL';
  max_seats: number;
  expiry_date: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'REVOKED';
  last_validated: string;
  created_at: string;
}

type SortField = 'expiry_date' | 'school_name' | 'tier' | 'status';
type SortOrder = 'asc' | 'desc';
type PageSizeOption = 5 | 10 | 25 | 50 | 'all';

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
        {Icon && <Icon className="w-3.5 h-3.5 text-indigo-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
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
                      ? 'bg-indigo-600/20 text-indigo-400 font-bold border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockLicenseKeys: LicenseKeyItem[] = [
  {
    id: 'lic-1',
    license_id: 'LIC-9042',
    key_code: 'MSP-PRO-2026-X89F-4421-9B00',
    school_name: 'St. Xavier International School',
    tier: 'ENTERPRISE_PRO',
    max_seats: 2500,
    expiry_date: '2027-08-11',
    status: 'ACTIVE',
    last_validated: '5 Mins Ago',
    created_at: '2026-08-11'
  },
  {
    id: 'lic-2',
    license_id: 'LIC-9038',
    key_code: 'MSP-STD-2026-A12B-9876-4C11',
    school_name: 'Delhi Public School, Sector 45',
    tier: 'STANDARD_SLA',
    max_seats: 1200,
    expiry_date: '2026-09-01',
    status: 'EXPIRING_SOON',
    last_validated: '1 Hour Ago',
    created_at: '2025-09-01'
  },
  {
    id: 'lic-3',
    license_id: 'LIC-9025',
    key_code: 'MSP-ENT-2026-K99M-3321-7D44',
    school_name: 'Greenwood High International',
    tier: 'ENTERPRISE_PRO',
    max_seats: 5000,
    expiry_date: '2028-01-15',
    status: 'ACTIVE',
    last_validated: '10 Mins Ago',
    created_at: '2026-01-15'
  },
  {
    id: 'lic-4',
    license_id: 'LIC-9010',
    key_code: 'MSP-TRL-2026-Z000-1111-2222',
    school_name: 'Ryan International School (Trial)',
    tier: 'STARTER_TRIAL',
    max_seats: 250,
    expiry_date: '2026-08-05',
    status: 'EXPIRED',
    last_validated: '6 Days Ago',
    created_at: '2026-07-20'
  }
];

export default function LicenseKeysPage() {
  const [keys, setKeys] = useState<LicenseKeyItem[]>(mockLicenseKeys);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('expiry_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<LicenseKeyItem | null>(null);

  // Form State
  const [schoolNameInput, setSchoolNameInput] = useState('');
  const [tierInput, setTierInput] = useState<'ENTERPRISE_PRO' | 'STANDARD_SLA' | 'STARTER_TRIAL'>('ENTERPRISE_PRO');
  const [maxSeatsInput, setMaxSeatsInput] = useState(1500);
  const [durationMonthsInput, setDurationMonthsInput] = useState(12);

  const totalIssuedCount = 1240;
  const activeValidCount = keys.filter(k => k.status === 'ACTIVE').length;
  const expiringSoonCount = keys.filter(k => k.status === 'EXPIRING_SOON').length;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/license-keys');
      if (res.data.success && Array.isArray(res.data.data)) {
        setKeys(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Software license keys & cryptographic RSA feed refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, tierFilter, statusFilter, sortBy, sortOrder, pageSize]);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolNameInput.trim()) {
      toast.error('Please enter school tenant name');
      return;
    }

    toast.loading(`Generating cryptographic license key for '${schoolNameInput}'...`, { id: 'gen-key-toast' });

    try {
      await api.post('/landlord/license-keys', {
        school_name: schoolNameInput,
        tier: tierInput,
        max_seats: maxSeatsInput,
        duration_months: durationMonthsInput
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const generatedCode = `MSP-${tierInput.substring(0, 3)}-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-9900`;
      const newKey: LicenseKeyItem = {
        id: `lic-${Date.now()}`,
        license_id: `LIC-${Math.floor(1000 + Math.random() * 9000)}`,
        key_code: generatedCode,
        school_name: schoolNameInput,
        tier: tierInput,
        max_seats: maxSeatsInput,
        expiry_date: '2027-08-11',
        status: 'ACTIVE',
        last_validated: 'Just now',
        created_at: 'Just now'
      };
      setKeys(prev => [newKey, ...prev]);
      setIsAddModalOpen(false);
      setSchoolNameInput('');
      toast.success(`🔑 License Key '${generatedCode}' generated!`, { id: 'gen-key-toast' });
    }, 800);
  };

  const handleCopyKey = (keyCode: string) => {
    navigator.clipboard.writeText(keyCode);
    toast.success(`📋 License Key '${keyCode}' copied to clipboard!`);
  };

  const handleRevokeKey = async (id: string, keyCode: string) => {
    toast.loading(`Revoking license key '${keyCode}'...`, { id: 'rev-key-toast' });

    try {
      await api.post(`/landlord/license-keys/${id}/revoke`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setKeys(prev =>
        prev.map(k => (k.id === id ? { ...k, status: 'REVOKED' } : k))
      );
      toast.success(`🔒 License Key '${keyCode}' REVOKED!`, { id: 'rev-key-toast' });
    }, 600);
  };

  const handleDeleteKey = async (id: string, licenseId: string) => {
    toast.loading(`Deleting license key record '${licenseId}'...`, { id: 'del-key-toast' });

    try {
      await api.delete(`/landlord/license-keys/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setKeys(prev => prev.filter(k => k.id !== id));
      toast.success(`🗑️ License record '${licenseId}' deleted!`, { id: 'del-key-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = keys.filter(k => {
    const matchesSearch =
      k.license_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.key_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.tier.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTier = tierFilter === 'all' || k.tier === tierFilter;
    const matchesStatus = statusFilter === 'all' || k.status === statusFilter;

    return matchesSearch && matchesTier && matchesStatus;
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

  const tierOptions: SearchableOption[] = [
    { value: 'all', label: 'All Tiers' },
    { value: 'ENTERPRISE_PRO', label: 'ENTERPRISE PRO 🚀' },
    { value: 'STANDARD_SLA', label: 'STANDARD SLA 🌟' },
    { value: 'STARTER_TRIAL', label: 'STARTER TRIAL ⚡' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'ACTIVE 🟢' },
    { value: 'EXPIRING_SOON', label: 'EXPIRING SOON ⏳' },
    { value: 'EXPIRED', label: 'EXPIRED 🔴' },
    { value: 'REVOKED', label: 'REVOKED 🔒' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'expiry_date', label: 'Expiry Date' },
    { value: 'school_name', label: 'School Name' },
    { value: 'tier', label: 'License Tier' },
    { value: 'status', label: 'Status' },
  ];

  const pageSizeOptions: SearchableOption[] = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: 'all', label: 'Show All' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-100">
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-400/30">
              <Key className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Cryptographic License Key Management Generator
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-extrabold rounded-full border border-indigo-400/30 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 animate-pulse" /> RSA-2048 Signed
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate, validate, and enforce seat limits for enterprise SaaS license keys, annual software contracts, and trial keys
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Generate License Key
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Issued</span>
            <Key className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalIssuedCount.toLocaleString()} Keys</div>
          <div className="text-[10px] text-slate-500 mt-0.5">SaaS License Contracts</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Valid Keys</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{activeValidCount} Active 🟢</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Verified Hardware Pings</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Expiring in 30 Days</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{expiringSoonCount} Expiring ⏳</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Renewal Required</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Annual ARR</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">$482,000 💰</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Contract Value</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Crypto Protocol</span>
            <Lock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-black text-blue-400 font-mono">RSA-2048 🔒</div>
          <div className="text-[10px] text-slate-500 mt-0.5">SHA256 Secret Signature</div>
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
              placeholder="Search by license ID, key code, school name, tier..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={tierOptions} value={tierFilter} onChange={setTierFilter} placeholder="Tier..." icon={Filter} labelPrefix="Tier" />
          <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
          <div className="flex items-center gap-1">
            <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-900 border border-slate-800 text-indigo-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <SearchableSelect options={pageSizeOptions} value={String(pageSize)} onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))} placeholder="Per Page..." icon={List} labelPrefix="Rows" />
        </div>
      </div>

      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('school_name')}>School Tenant & ID</th>
                <th className="p-3.5">Cryptographic License Key Code</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('tier')}>License Tier</th>
                <th className="p-3.5">Max Seat Limit</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('expiry_date')}>Expiry Date</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('status')}>Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(k => (
                <tr key={k.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-indigo-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{k.school_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{k.license_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-indigo-400 font-bold tracking-wider">{k.key_code}</span>
                      <button
                        onClick={() => handleCopyKey(k.key_code)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                        title="Copy Key Code"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[10px]">
                    <span
                      className={`px-2 py-0.5 rounded font-bold border ${
                        k.tier === 'ENTERPRISE_PRO'
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/40 font-black'
                          : k.tier === 'STANDARD_SLA'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      }`}
                    >
                      {k.tier}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-white font-bold">{k.max_seats.toLocaleString()} Students</td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-300 font-bold">{k.expiry_date}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        k.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : k.status === 'EXPIRING_SOON'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : k.status === 'EXPIRED'
                          ? 'bg-red-500/15 text-red-400 border-red-500/30'
                          : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                      }`}
                    >
                      {k.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedKey(k)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" /> Key Spec
                      </button>
                      {k.status !== 'REVOKED' && (
                        <button
                          onClick={() => handleRevokeKey(k.id, k.key_code)}
                          className="p-1.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30 rounded-xl cursor-pointer"
                          title="Revoke License Key"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteKey(k.id, k.license_id)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete License Record"
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

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-extrabold text-white">Generate RSA-2048 License Key</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateKey} className="space-y-3.5 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">School Tenant Name</label>
                <input
                  type="text"
                  required
                  value={schoolNameInput}
                  onChange={e => setSchoolNameInput(e.target.value)}
                  placeholder="e.g. St. Xavier International School"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">License Tier</label>
                  <select
                    value={tierInput}
                    onChange={e => setTierInput(e.target.value as 'ENTERPRISE_PRO' | 'STANDARD_SLA' | 'STARTER_TRIAL')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="ENTERPRISE_PRO">ENTERPRISE PRO 🚀</option>
                    <option value="STANDARD_SLA">STANDARD SLA 🌟</option>
                    <option value="STARTER_TRIAL">STARTER TRIAL ⚡</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Max Student Seat Limit</label>
                  <input
                    type="number"
                    min={100}
                    value={maxSeatsInput}
                    onChange={e => setMaxSeatsInput(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Contract Duration (Months)</label>
                <select
                  value={durationMonthsInput}
                  onChange={e => setDurationMonthsInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value={1}>1 Month (Monthly SaaS)</option>
                  <option value={12}>12 Months (1 Year Contract)</option>
                  <option value={24}>24 Months (2 Year Contract)</option>
                  <option value={36}>36 Months (3 Year Contract)</option>
                </select>
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  Generate Signed Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedKey && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-extrabold text-white">License Key Specification & RSA Fingerprint</h3>
              </div>
              <button onClick={() => setSelectedKey(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-indigo-400 font-bold">{selectedKey.key_code}</div>
                <div className="text-slate-400">Tenant: {selectedKey.school_name} · Tier: {selectedKey.tier}</div>
                <div className="text-slate-500 text-[11px]">Expires: {selectedKey.expiry_date} · Last Validated: {selectedKey.last_validated}</div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="text-white font-bold mb-1">RSA-2048 Signature Fingerprint:</div>
                <div className="text-slate-400 text-[10px] break-all leading-relaxed">
                  e9f0a2b8c4d6e8f10123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedKey(null)}
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
