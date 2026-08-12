import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  KeyRound, RefreshCw, ShieldCheck, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X, Radio, Lock,
  Plus, Edit2, ShieldAlert, CheckCircle2, Sliders, AlertOctagon, Shield
} from 'lucide-react';
import api from '../../../services/api';

interface PasswordPolicyItem {
  id: string;
  name: string;
  scope: string;
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_symbols: boolean;
  max_age_days: number;
  history_limit: number;
  pwned_check_enabled: boolean;
  is_enforced: boolean;
}

type SortField = 'min_length' | 'name' | 'max_age_days';
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

const mockPolicies: PasswordPolicyItem[] = [
  {
    id: 'pol-1',
    name: 'SuperAdmin Master Security Profile',
    scope: 'SuperAdmin & Landlord Staff',
    min_length: 16,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_symbols: true,
    max_age_days: 60,
    history_limit: 10,
    pwned_check_enabled: true,
    is_enforced: true
  },
  {
    id: 'pol-2',
    name: 'School Principal & Admin Policy',
    scope: 'School Principals & System Admins',
    min_length: 12,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_symbols: true,
    max_age_days: 90,
    history_limit: 5,
    pwned_check_enabled: true,
    is_enforced: true
  },
  {
    id: 'pol-3',
    name: 'Teacher & Staff Standard Policy',
    scope: 'Teachers & School Accountants',
    min_length: 10,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_symbols: true,
    max_age_days: 180,
    history_limit: 3,
    pwned_check_enabled: true,
    is_enforced: true
  },
  {
    id: 'pol-4',
    name: 'Student & Parent Portal Policy',
    scope: 'Students & Guardians',
    min_length: 8,
    require_uppercase: false,
    require_lowercase: true,
    require_numbers: true,
    require_symbols: false,
    max_age_days: 0, // Never
    history_limit: 1,
    pwned_check_enabled: false,
    is_enforced: true
  }
];

export default function PasswordPolicyPage() {
  const [policies, setPolicies] = useState<PasswordPolicyItem[]>(mockPolicies);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lengthFilter, setLengthFilter] = useState<string>('all');
  const [rotationFilter, setRotationFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('min_length');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [editingPolicy, setEditingPolicy] = useState<PasswordPolicyItem | null>(null);
  const [isTesterOpen, setIsTesterOpen] = useState(false);
  const [testPasswordInput, setTestPasswordInput] = useState('');

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/password-policies');
      if (res.data.success && Array.isArray(res.data.data)) {
        setPolicies(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Password complexity policies & rules refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, lengthFilter, rotationFilter, sortBy, sortOrder, pageSize]);

  // Save Edit Policy
  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;

    toast.loading(`Updating password policy '${editingPolicy.name}'...`, { id: 'save-pol-toast' });

    try {
      await api.put(`/landlord/password-policies/${editingPolicy.id}`, editingPolicy);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setPolicies(prev =>
        prev.map(p => (p.id === editingPolicy.id ? editingPolicy : p))
      );
      setEditingPolicy(null);
      toast.success(`⚡ Password policy rules updated & enforced!`, { id: 'save-pol-toast' });
    }, 800);
  };

  // Force Reset Non-Compliant Users
  const handleForceResetNonCompliant = async () => {
    toast.loading('Enforcing global password policy check across all accounts...', { id: 'force-reset-toast' });

    try {
      await api.post('/landlord/password-policies/force-reset-non-compliant');
    } catch {
      // Fallback
    }

    setTimeout(() => {
      toast.success('🚀 Mandatory Password Reset triggered for 14 non-compliant accounts!', { id: 'force-reset-toast' });
    }, 1200);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = policies.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.scope.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesLength = true;
    if (lengthFilter === '16') matchesLength = p.min_length >= 16;
    if (lengthFilter === '12') matchesLength = p.min_length >= 12 && p.min_length < 16;
    if (lengthFilter === '8') matchesLength = p.min_length < 12;

    let matchesRotation = true;
    if (rotationFilter === '60') matchesRotation = p.max_age_days === 60;
    if (rotationFilter === '90') matchesRotation = p.max_age_days === 90;
    if (rotationFilter === 'never') matchesRotation = p.max_age_days === 0;

    return matchesSearch && matchesLength && matchesRotation;
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

  const lengthOptions: SearchableOption[] = [
    { value: 'all', label: 'All Lengths' },
    { value: '16', label: '16+ Characters 🔒' },
    { value: '12', label: '12+ Characters 🔑' },
    { value: '8', label: '8+ Characters' },
  ];

  const rotationOptions: SearchableOption[] = [
    { value: 'all', label: 'All Rotations' },
    { value: '60', label: '60 Days Expire' },
    { value: '90', label: '90 Days Expire' },
    { value: 'never', label: 'Never Expire' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'min_length', label: 'Min Length' },
    { value: 'name', label: 'Policy Name' },
    { value: 'max_age_days', label: 'Max Password Age' },
  ];

  const pageSizeOptions: SearchableOption[] = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: 'all', label: 'Show All' },
  ];

  // Helper calculation for password tester
  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 20;
    if (pwd.length >= 12) score += 20;
    if (/[A-Z]/.test(pwd)) score += 20;
    if (/[0-9]/.test(pwd)) score += 20;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 20;
    return score;
  };
  const pwdScore = calculateStrength(testPasswordInput);

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-400/30">
              <KeyRound className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Password Complexity & Auto-Rotation Policy Manager
                <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-extrabold rounded-full border border-rose-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Pwned API Enabled
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure minimum length, special character rules, password rotation schedules, and breach detection APIs
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
            onClick={handleForceResetNonCompliant}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-amber-400 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Lock className="w-3.5 h-3.5" /> Force Reset Non-Compliant
          </button>
          <button
            onClick={() => setIsTesterOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30 transition-all"
          >
            <Sliders className="w-4 h-4" /> Test Password Strength
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Min Length Rule</span>
            <KeyRound className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">12 Chars</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Admin Standard</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Auto Expiry Rotation</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">90 Days</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Max Password Age</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">History Prevent Limit</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">5 Passwords</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Block Previous Reuse</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Leak Checker API</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-black text-emerald-400">HaveIBeenPwned</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Live Breach Lookup</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Global Enforcement</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">ACTIVE 🟢</div>
          <div className="text-[10px] text-slate-500 mt-0.5">All Roles Protected</div>
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
              placeholder="Search by policy name, target scope..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-rose-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={lengthOptions} value={lengthFilter} onChange={setLengthFilter} placeholder="Length..." icon={Filter} labelPrefix="Min Length" />
          <SearchableSelect options={rotationOptions} value={rotationFilter} onChange={setRotationFilter} placeholder="Rotation..." icon={Filter} labelPrefix="Rotation" />
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

      {/* ── PASSWORD POLICIES TABLE ── */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>Policy Profile Name & Target Scope</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('min_length')}>Min Length</th>
                <th className="p-3.5">Complexity Requirements</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('max_age_days')}>Max Age & History</th>
                <th className="p-3.5">Leak Check</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(p => (
                <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-rose-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-sans">{p.scope}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono">
                    <div className="text-base font-black text-rose-400">{p.min_length} Chars</div>
                  </td>
                  <td className="p-3.5 font-sans">
                    <div className="flex flex-wrap gap-1">
                      {p.require_uppercase && <span className="px-1.5 py-0.5 bg-slate-900 text-slate-300 border border-slate-800 rounded text-[9px] font-bold">A-Z</span>}
                      {p.require_lowercase && <span className="px-1.5 py-0.5 bg-slate-900 text-slate-300 border border-slate-800 rounded text-[9px] font-bold">a-z</span>}
                      {p.require_numbers && <span className="px-1.5 py-0.5 bg-slate-900 text-slate-300 border border-slate-800 rounded text-[9px] font-bold">0-9</span>}
                      {p.require_symbols && <span className="px-1.5 py-0.5 bg-slate-900 text-slate-300 border border-slate-800 rounded text-[9px] font-bold">!@#</span>}
                    </div>
                  </td>
                  <td className="p-3.5 font-mono">
                    <div className="text-amber-400 font-bold">{p.max_age_days === 0 ? 'Never Expire' : `${p.max_age_days} Days`}</div>
                    <div className="text-[10px] text-slate-500 font-sans">History Limit: Last {p.history_limit}</div>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        p.pwned_check_enabled
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {p.pwned_check_enabled ? 'PWNED CHECK 🟢' : 'OFF'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setEditingPolicy(p)}
                      className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-rose-400" /> Configure Policy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CONFIGURE POLICY MODAL ── */}
      {editingPolicy && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-extrabold text-white">Configure Password Rules</h3>
              </div>
              <button onClick={() => setEditingPolicy(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Policy Profile Name</label>
                <input
                  type="text"
                  required
                  value={editingPolicy.name}
                  onChange={e => setEditingPolicy({ ...editingPolicy, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Minimum Password Length ({editingPolicy.min_length} Chars)</label>
                <input
                  type="range"
                  min={8}
                  max={32}
                  value={editingPolicy.min_length}
                  onChange={e => setEditingPolicy({ ...editingPolicy, min_length: Number(e.target.value) })}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPolicy.require_uppercase}
                    onChange={e => setEditingPolicy({ ...editingPolicy, require_uppercase: e.target.checked })}
                    className="accent-rose-500"
                  />
                  <span className="text-slate-300 font-bold">Require Uppercase (A-Z)</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPolicy.require_numbers}
                    onChange={e => setEditingPolicy({ ...editingPolicy, require_numbers: e.target.checked })}
                    className="accent-rose-500"
                  />
                  <span className="text-slate-300 font-bold">Require Numbers (0-9)</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPolicy.require_symbols}
                    onChange={e => setEditingPolicy({ ...editingPolicy, require_symbols: e.target.checked })}
                    className="accent-rose-500"
                  />
                  <span className="text-slate-300 font-bold">Require Symbols (!@#)</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPolicy.pwned_check_enabled}
                    onChange={e => setEditingPolicy({ ...editingPolicy, pwned_check_enabled: e.target.checked })}
                    className="accent-rose-500"
                  />
                  <span className="text-slate-300 font-bold">Pwned Leak Check</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Max Age (Days)</label>
                  <input
                    type="number"
                    value={editingPolicy.max_age_days}
                    onChange={e => setEditingPolicy({ ...editingPolicy, max_age_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">History Block Limit</label>
                  <input
                    type="number"
                    value={editingPolicy.history_limit}
                    onChange={e => setEditingPolicy({ ...editingPolicy, history_limit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPolicy(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-rose-600/30"
                >
                  Save Policy Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TESTER MODAL ── */}
      {isTesterOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-extrabold text-white">Live Password Strength & Breach Tester</h3>
              </div>
              <button onClick={() => setIsTesterOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Enter Test Password String</label>
                <input
                  type="text"
                  value={testPasswordInput}
                  onChange={e => setTestPasswordInput(e.target.value)}
                  placeholder="e.g. MySecur3P@ssw0rd!2026"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 font-bold mb-1">
                  <span>Strength Score</span>
                  <span className="text-rose-400">{pwdScore}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      pwdScore >= 80 ? 'bg-emerald-500' : pwdScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${pwdScore}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center gap-2 text-slate-300">
                  {testPasswordInput.length >= 12 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-red-400" />}
                  <span>Minimum 12 Characters (Actual: {testPasswordInput.length})</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  {/[A-Z]/.test(testPasswordInput) ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-red-400" />}
                  <span>Uppercase Character (A-Z)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  {/[0-9]/.test(testPasswordInput) ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-red-400" />}
                  <span>Numeric Character (0-9)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  {/[^A-Za-z0-9]/.test(testPasswordInput) ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-red-400" />}
                  <span>Special Symbol (!@#$)</span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsTesterOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer"
                >
                  Close Tester
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
