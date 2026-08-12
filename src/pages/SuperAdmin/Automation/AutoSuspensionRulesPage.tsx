import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldAlert, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, Lock, AlertTriangle, Play, Pause, Zap
} from 'lucide-react';
import api from '../../../services/api';

interface SuspensionRule {
  id: string;
  rule_id: string;
  rule_title: string;
  trigger_condition: string;
  action_enforced: string;
  grace_period_days: number;
  status: 'ACTIVE' | 'PAUSED';
  affected_tenants_count: number;
  created_at: string;
}

type SortField = 'created_at' | 'rule_title' | 'grace_period_days';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-fuchsia-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-fuchsia-500 placeholder-slate-600"
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
                      ? 'bg-fuchsia-600/20 text-fuchsia-400 font-bold border border-fuchsia-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-fuchsia-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockRules: SuspensionRule[] = [
  {
    id: 'sus-1',
    rule_id: 'SUS-2042',
    rule_title: 'Overdue Subscription Payment > 15 Days',
    trigger_condition: 'INVOICE_OVERDUE_15D',
    action_enforced: 'LOCK_TENANT_LOGIN',
    grace_period_days: 15,
    status: 'ACTIVE',
    affected_tenants_count: 4,
    created_at: '2026-08-01'
  },
  {
    id: 'sus-2',
    rule_id: 'SUS-2038',
    rule_title: 'License Key Hardware MAC Spoofing Attempt',
    trigger_condition: 'HARDWARE_MISMATCH_ATTACK',
    action_enforced: 'IMMEDIATE_ACCOUNT_SUSPENSION',
    grace_period_days: 0,
    status: 'ACTIVE',
    affected_tenants_count: 2,
    created_at: '2026-07-20'
  },
  {
    id: 'sus-3',
    rule_id: 'SUS-2025',
    rule_title: 'Trial Expiry Without SaaS Upgrade > 7 Days',
    trigger_condition: 'TRIAL_EXPIRED_7D',
    action_enforced: 'READ_ONLY_ARCHIVE_MODE',
    grace_period_days: 7,
    status: 'ACTIVE',
    affected_tenants_count: 8,
    created_at: '2026-07-15'
  }
];

export default function AutoSuspensionRulesPage() {
  const [rules, setRules] = useState<SuspensionRule[]>(mockRules);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<SuspensionRule | null>(null);

  // Form State
  const [ruleTitleInput, setRuleTitleInput] = useState('');
  const [conditionInput, setConditionInput] = useState('INVOICE_OVERDUE_15D');
  const [actionInput, setActionInput] = useState('LOCK_TENANT_LOGIN');
  const [gracePeriodInput, setGracePeriodInput] = useState(15);

  const totalRulesCount = 4;
  const suspendedTenantsCount = 6;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/auto-suspension-rules');
      if (res.data.success && Array.isArray(res.data.data)) {
        setRules(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Automated tenant suspension rules & enforcement engine refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder, pageSize]);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleTitleInput.trim()) {
      toast.error('Please enter suspension rule title');
      return;
    }

    toast.loading(`Creating suspension rule '${ruleTitleInput}'...`, { id: 'add-sus-toast' });

    try {
      await api.post('/landlord/auto-suspension-rules', {
        rule_title: ruleTitleInput,
        trigger_condition: conditionInput,
        action_enforced: actionInput,
        grace_period_days: gracePeriodInput
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newRule: SuspensionRule = {
        id: `sus-${Date.now()}`,
        rule_id: `SUS-${Math.floor(1000 + Math.random() * 9000)}`,
        rule_title: ruleTitleInput,
        trigger_condition: conditionInput,
        action_enforced: actionInput,
        grace_period_days: gracePeriodInput,
        status: 'ACTIVE',
        affected_tenants_count: 0,
        created_at: 'Just now'
      };
      setRules(prev => [newRule, ...prev]);
      setIsAddModalOpen(false);
      setRuleTitleInput('');
      toast.success(`🛡️ Suspension rule '${ruleTitleInput}' activated!`, { id: 'add-sus-toast' });
    }, 800);
  };

  const handleToggleRuleStatus = async (id: string, currentStatus: 'ACTIVE' | 'PAUSED', ruleTitle: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    toast.loading(`Toggling status for '${ruleTitle}' to ${nextStatus}...`, { id: 'tog-sus-toast' });

    try {
      await api.post(`/landlord/auto-suspension-rules/${id}/toggle-status`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setRules(prev =>
        prev.map(r => (r.id === id ? { ...r, status: nextStatus } : r))
      );
      toast.success(` Rule '${ruleTitle}' is now ${nextStatus}!`, { id: 'tog-sus-toast' });
    }, 600);
  };

  const handleDeleteRule = async (id: string, ruleId: string) => {
    toast.loading(`Deleting rule '${ruleId}'...`, { id: 'del-rule-toast' });

    try {
      await api.delete(`/landlord/auto-suspension-rules/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setRules(prev => prev.filter(r => r.id !== id));
      toast.success(`🗑️ Suspension rule '${ruleId}' deleted!`, { id: 'del-rule-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = rules.filter(r => {
    const matchesSearch =
      r.rule_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.rule_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.trigger_condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.action_enforced.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
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

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'ACTIVE 🟢' },
    { value: 'PAUSED', label: 'PAUSED ⏸️' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'rule_title', label: 'Rule Title' },
    { value: 'grace_period_days', label: 'Grace Period (Days)' },
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
            <span className="p-2.5 bg-fuchsia-500/20 text-fuchsia-400 rounded-2xl border border-fuchsia-400/30">
              <ShieldAlert className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Automated Tenant Account Suspension & Enforcement Rules
                <span className="px-2.5 py-0.5 bg-fuchsia-500/20 text-fuchsia-400 text-[10px] font-extrabold rounded-full border border-fuchsia-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3 h-3 text-red-400 animate-pulse" /> Auto Enforcement Active
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Define automated triggers for non-payment, license tampering, and trial expiration with custom grace periods
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-fuchsia-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Suspension Rule
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Rules</span>
            <ShieldAlert className="w-4 h-4 text-fuchsia-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalRulesCount} Rules</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Enforcement Triggers</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Suspended Tenants</span>
            <Lock className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{suspendedTenantsCount} Locked 🔒</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Access Restricted</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Grace Period SLA</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">15 Days ⏳</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Standard Payment Grace</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Auto-Unlock</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono">1-Click Payment ✅</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Instant Access Restore</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Fraud Protection</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">Active 🛡️</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Hardware MAC Lock</div>
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
              placeholder="Search by rule ID, title, trigger condition, action..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-fuchsia-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
          <div className="flex items-center gap-1">
            <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-900 border border-slate-800 text-fuchsia-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
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
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('rule_title')}>Rule Title & ID</th>
                <th className="p-3.5">Trigger Condition</th>
                <th className="p-3.5">Action Enforced</th>
                <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('grace_period_days')}>Grace Period</th>
                <th className="p-3.5 font-mono">Affected Tenants</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(r => (
                <tr key={r.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-fuchsia-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{r.rule_title}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{r.rule_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[10px] text-amber-400 font-bold">{r.trigger_condition}</td>
                  <td className="p-3.5 font-mono text-[10px] text-red-400 font-bold">{r.action_enforced}</td>
                  <td className="p-3.5 font-mono text-[11px] text-purple-400 font-bold">{r.grace_period_days} Days</td>
                  <td className="p-3.5 font-mono text-[11px] text-white font-bold">{r.affected_tenants_count} Tenants</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        r.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleToggleRuleStatus(r.id, r.status, r.rule_title)}
                        className={`p-1.5 border rounded-xl cursor-pointer ${
                          r.status === 'ACTIVE'
                            ? 'bg-amber-600/20 text-amber-400 border-amber-500/30 hover:bg-amber-600/30'
                            : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30'
                        }`}
                        title={r.status === 'ACTIVE' ? 'Pause Rule' : 'Activate Rule'}
                      >
                        {r.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setSelectedRule(r)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-fuchsia-400" /> Rule Spec
                      </button>
                      <button
                        onClick={() => handleDeleteRule(r.id, r.rule_id)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete Suspension Rule"
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
                <ShieldAlert className="w-5 h-5 text-fuchsia-400" />
                <h3 className="text-base font-extrabold text-white">Create Automated Suspension Rule</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRule} className="space-y-3.5 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Rule Title</label>
                <input
                  type="text"
                  required
                  value={ruleTitleInput}
                  onChange={e => setRuleTitleInput(e.target.value)}
                  placeholder="e.g. Overdue Payment > 15 Days"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Trigger Condition</label>
                  <select
                    value={conditionInput}
                    onChange={e => setConditionInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-fuchsia-500 cursor-pointer"
                  >
                    <option value="INVOICE_OVERDUE_15D">INVOICE OVERDUE 15D</option>
                    <option value="HARDWARE_MISMATCH_ATTACK">HARDWARE SPOOF ATTACK</option>
                    <option value="TRIAL_EXPIRED_7D">TRIAL EXPIRED 7D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Grace Period (Days)</label>
                  <input
                    type="number"
                    min={0}
                    value={gracePeriodInput}
                    onChange={e => setGracePeriodInput(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-fuchsia-500 font-mono"
                  />
                </div>
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
                  className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-fuchsia-600/30"
                >
                  Save & Activate Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedRule && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-fuchsia-400" />
                <h3 className="text-base font-extrabold text-white">Suspension Rule Details ({selectedRule.rule_id})</h3>
              </div>
              <button onClick={() => setSelectedRule(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-fuchsia-400 font-bold">{selectedRule.rule_title}</div>
                <div className="text-slate-400">Trigger: {selectedRule.trigger_condition} · Action: {selectedRule.action_enforced}</div>
                <div className="text-slate-500 text-[11px]">Grace: {selectedRule.grace_period_days} Days · Affected: {selectedRule.affected_tenants_count} Tenants</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRule(null)}
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
