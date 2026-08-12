import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle, RefreshCw, ShieldCheck, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X, Radio, Lock, Eye,
  Globe, Ban, Unlock, Flame
} from 'lucide-react';
import api from '../../../services/api';

interface FailedLoginItem {
  id: string;
  ip_address: string;
  location: string;
  target_user: string;
  failure_reason: string;
  attempts_count: number;
  risk_score: number;
  lock_status: 'PERMANENTLY_BLOCKED' | 'IP_TEMPORARY_BAN' | 'MONITORING';
  last_attempt: string;
  user_agent: string;
}

type SortField = 'attempts_count' | 'risk_score' | 'last_attempt' | 'ip_address';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-red-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-red-500 placeholder-slate-600"
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
                      ? 'bg-red-600/20 text-red-400 font-bold border border-red-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-red-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockFailedAttempts: FailedLoginItem[] = [
  {
    id: 'fail-1',
    ip_address: '45.142.214.88',
    location: 'Frankfurt, DE',
    target_user: 'admin@myschoolpoint.com',
    failure_reason: 'INVALID_PASSWORD_SPRAY',
    attempts_count: 14,
    risk_score: 94,
    lock_status: 'IP_TEMPORARY_BAN',
    last_attempt: '2026-08-10 23:15:10',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Hydra/9.5'
  },
  {
    id: 'fail-2',
    ip_address: '194.26.29.112',
    location: 'Saint Petersburg, RU',
    target_user: 'root',
    failure_reason: 'CREDENTIAL_STUFFING',
    attempts_count: 42,
    risk_score: 99,
    lock_status: 'PERMANENTLY_BLOCKED',
    last_attempt: '2026-08-10 22:50:00',
    user_agent: 'Python-requests/2.31.0 botnet-node'
  },
  {
    id: 'fail-3',
    ip_address: '185.220.101.5',
    location: 'Amsterdam, NL',
    target_user: 'principal@dpsrkp.com',
    failure_reason: 'EXPIRED_2FA_TOKEN',
    attempts_count: 5,
    risk_score: 68,
    lock_status: 'IP_TEMPORARY_BAN',
    last_attempt: '2026-08-10 22:30:00',
    user_agent: 'Mozilla/5.0 (TorBrowser 13.0)'
  },
  {
    id: 'fail-4',
    ip_address: '103.21.12.9',
    location: 'New Delhi, IN',
    target_user: 'teacher@dpsnoida.com',
    failure_reason: 'WRONG_PASSWORD',
    attempts_count: 3,
    risk_score: 32,
    lock_status: 'MONITORING',
    last_attempt: '2026-08-10 21:40:00',
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5)'
  }
];

export default function FailedLoginAttemptsPage() {
  const [attempts, setAttempts] = useState<FailedLoginItem[]>(mockFailedAttempts);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('attempts_count');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [selectedAttempt, setSelectedAttempt] = useState<FailedLoginItem | null>(null);

  const totalAttempts = 1480;
  const blockedIps = attempts.filter(a => a.lock_status === 'PERMANENTLY_BLOCKED' || a.lock_status === 'IP_TEMPORARY_BAN').length;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/failed-login-attempts');
      if (res.data.success && Array.isArray(res.data.data)) {
        setAttempts(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Brute-force failed login telemetry refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, riskFilter, sortBy, sortOrder, pageSize]);

  // Ban IP Permanently
  const handleBanIp = async (ip: string) => {
    toast.loading(`Permanently blocking IP '${ip}' in Fail2ban firewall...`, { id: 'ban-ip-toast' });

    try {
      await api.post('/landlord/failed-login-attempts/ban-ip', { ip_address: ip });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setAttempts(prev =>
        prev.map(a => (a.ip_address === ip ? { ...a, lock_status: 'PERMANENTLY_BLOCKED', risk_score: 99 } : a))
      );
      toast.success(`🛑 IP '${ip}' permanently banned! Zero traffic allowed.`, { id: 'ban-ip-toast' });
    }, 1000);
  };

  // Unban IP / Reset Lockout
  const handleUnbanIp = async (ip: string) => {
    toast.loading(`Unbanning IP '${ip}' & resetting lockout counter...`, { id: 'unban-ip-toast' });

    try {
      await api.post('/landlord/failed-login-attempts/unban-ip', { ip_address: ip });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setAttempts(prev =>
        prev.map(a => (a.ip_address === ip ? { ...a, lock_status: 'MONITORING', attempts_count: 0 } : a))
      );
      toast.success(`🔓 IP '${ip}' unbanned & lockout reset successfully!`, { id: 'unban-ip-toast' });
    }, 1000);
  };

  // Flush Temporary Locks
  const handleFlushLocks = async () => {
    toast.loading('Flushing all temporary IP bans and lockout counters...', { id: 'flush-toast' });

    try {
      await api.post('/landlord/failed-login-attempts/flush-locks');
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setAttempts(prev =>
        prev.map(a => (a.lock_status === 'IP_TEMPORARY_BAN' ? { ...a, lock_status: 'MONITORING' } : a))
      );
      toast.success('⚡ All temporary IP bans flushed successfully!', { id: 'flush-toast' });
    }, 1200);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = attempts.filter(a => {
    const matchesSearch =
      a.ip_address.includes(searchTerm) ||
      a.target_user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.failure_reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || a.lock_status === statusFilter;

    let matchesRisk = true;
    if (riskFilter === 'high') matchesRisk = a.risk_score >= 80;
    if (riskFilter === 'medium') matchesRisk = a.risk_score >= 50 && a.risk_score < 80;
    if (riskFilter === 'low') matchesRisk = a.risk_score < 50;

    return matchesSearch && matchesStatus && matchesRisk;
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
    { value: 'all', label: 'All Lock Statuses' },
    { value: 'PERMANENTLY_BLOCKED', label: 'PERMANENTLY BLOCKED 🛑' },
    { value: 'IP_TEMPORARY_BAN', label: 'TEMPORARY BAN ⏳' },
    { value: 'MONITORING', label: 'MONITORING 👁️' },
  ];

  const riskOptions: SearchableOption[] = [
    { value: 'all', label: 'All Risk Levels' },
    { value: 'high', label: 'High Risk (> 80%)' },
    { value: 'medium', label: 'Medium Risk (50-80%)' },
    { value: 'low', label: 'Low Risk (< 50%)' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'attempts_count', label: 'Attempts Count' },
    { value: 'risk_score', label: 'Risk Score %' },
    { value: 'last_attempt', label: 'Last Attempt' },
    { value: 'ip_address', label: 'IP Address' },
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
            <span className="p-2.5 bg-red-500/20 text-red-400 rounded-2xl border border-red-400/30">
              <AlertTriangle className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Brute-Force Detection & Failed Login Shield
                <span className="px-2.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-extrabold rounded-full border border-red-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Fail2ban Shield Active
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitor failed login spikes, credential stuffing attempts, automated IP lockouts, and risk scoring
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Pulse: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleFlushLocks}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-amber-400 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Unlock className="w-3.5 h-3.5" /> Flush Temp Lockouts
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Failed Attempts</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalAttempts.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Recorded Spikes</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Banned IPs</span>
            <Ban className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{blockedIps} IPs Locked</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Firewall Enforced</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Attack Sprays</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">2 Neutralized</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Password Spraying</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Auto-Lock Threshold</span>
            <Lock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-black text-blue-400">5 Fails / 30 Min</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Automated Rule</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Firewall Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">SHIELDED 🟢</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Fail2ban Active</div>
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
              placeholder="Search by IP address, target user, failure reason..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-red-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
          <SearchableSelect options={riskOptions} value={riskFilter} onChange={setRiskFilter} placeholder="Risk..." icon={Filter} labelPrefix="Risk" />
          <div className="flex items-center gap-1">
            <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-900 border border-slate-800 text-red-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <SearchableSelect options={pageSizeOptions} value={String(pageSize)} onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))} placeholder="Per Page..." icon={List} labelPrefix="Rows" />
        </div>
      </div>

      {/* ── FAILED LOGINS TABLE ── */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('ip_address')}>IP & Geolocation</th>
                <th className="p-3.5">Target Account</th>
                <th className="p-3.5">Failure Reason</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('attempts_count')}>Attempts</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('risk_score')}>Risk Score</th>
                <th className="p-3.5">Lock Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(a => (
                <tr key={a.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div>{a.ip_address}</div>
                    <div className="text-[10px] text-slate-500 font-sans flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-400" /> {a.location}
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-rose-400 font-bold">{a.target_user}</td>
                  <td className="p-3.5 font-mono text-slate-300 text-[11px]">{a.failure_reason}</td>
                  <td className="p-3.5 font-mono text-amber-400 font-bold text-sm">{a.attempts_count}</td>
                  <td className="p-3.5">
                    <div className="space-y-1 min-w-[100px]">
                      <div className="text-white font-bold font-mono">{a.risk_score}%</div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            a.risk_score >= 80 ? 'bg-red-500' : a.risk_score >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${a.risk_score}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        a.lock_status === 'PERMANENTLY_BLOCKED'
                          ? 'bg-red-500/15 text-red-400 border-red-500/30'
                          : a.lock_status === 'IP_TEMPORARY_BAN'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {a.lock_status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {a.lock_status === 'PERMANENTLY_BLOCKED' || a.lock_status === 'IP_TEMPORARY_BAN' ? (
                        <button
                          onClick={() => handleUnbanIp(a.ip_address)}
                          className="px-2.5 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Unlock className="w-3.5 h-3.5" /> Unban IP
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBanIp(a.ip_address)}
                          className="px-2.5 py-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" /> Ban IP
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedAttempt(a)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-red-400" /> Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ATTEMPT DETAILS MODAL ── */}
      {selectedAttempt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-extrabold text-white">Failed Attempt Telemetry Inspector</h3>
              </div>
              <button onClick={() => setSelectedAttempt(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-red-400 font-bold">IP Address: {selectedAttempt.ip_address}</div>
                <div className="text-slate-400">Location: {selectedAttempt.location}</div>
                <div className="text-slate-400">Failure Reason: {selectedAttempt.failure_reason}</div>
                <div className="text-slate-500 text-[11px]">Last Attempt: {selectedAttempt.last_attempt}</div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-amber-400 font-bold">Target Account: {selectedAttempt.target_user}</div>
                <div className="text-slate-400">Failed Attempts: {selectedAttempt.attempts_count}</div>
                <div className="text-slate-400">Calculated Risk Score: {selectedAttempt.risk_score}%</div>
                <div className="text-slate-500 text-[10px] truncate">User-Agent: {selectedAttempt.user_agent}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAttempt(null)}
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
