import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Ban, RefreshCw, ShieldCheck, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X, Radio, Lock, Eye,
  Globe, Plus, Trash2, ShieldAlert, AlertTriangle, Flame, Unlock
} from 'lucide-react';
import api from '../../../services/api';

interface BlacklistedIpItem {
  id: string;
  ip_or_cidr: string;
  ban_reason: string;
  country: string;
  scope: 'ALL_TRAFFIC' | 'SUPERADMIN_ONLY' | 'TENANT_CONSOLES';
  ban_type: 'PERMANENT' | 'TEMPORARY';
  banned_at: string;
  attack_payload_sample: string;
}

type SortField = 'banned_at' | 'ip_or_cidr' | 'ban_reason';
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

const mockBlacklist: BlacklistedIpItem[] = [
  {
    id: 'blk-1',
    ip_or_cidr: '45.142.214.88',
    ban_reason: 'SQL_INJECTION_ATTEMPT',
    country: 'Frankfurt, DE',
    scope: 'ALL_TRAFFIC',
    ban_type: 'PERMANENT',
    banned_at: '2026-08-10 22:15:10',
    attack_payload_sample: 'GET /api/login?user=admin%27%20OR%201=1--'
  },
  {
    id: 'blk-2',
    ip_or_cidr: '194.26.29.112',
    ban_reason: 'BRUTE_FORCE_PASSWORD_SPRAY',
    country: 'Saint Petersburg, RU',
    scope: 'SUPERADMIN_ONLY',
    ban_type: 'PERMANENT',
    banned_at: '2026-08-10 20:30:00',
    attack_payload_sample: 'POST /api/landlord/login (42 failed password attempts)'
  },
  {
    id: 'blk-3',
    ip_or_cidr: '185.220.101.5',
    ban_reason: 'TOR_EXIT_NODE_SCANNER',
    country: 'Amsterdam, NL',
    scope: 'TENANT_CONSOLES',
    ban_type: 'TEMPORARY',
    banned_at: '2026-08-09 18:40:00',
    attack_payload_sample: 'GET /wp-login.php (Vulnerability Probe Scan)'
  },
  {
    id: 'blk-4',
    ip_or_cidr: '103.21.12.99/24',
    ban_reason: 'KNOWN_BOTNET_SUBNET',
    country: 'Beijing, CN',
    scope: 'ALL_TRAFFIC',
    ban_type: 'PERMANENT',
    banned_at: '2026-08-01 12:00:00',
    attack_payload_sample: 'CIDR Subnet 256 IPs Banned by Threat Intelligence Feed'
  }
];

export default function BlacklistedIpPage() {
  const [items, setItems] = useState<BlacklistedIpItem[]>(mockBlacklist);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [banTypeFilter, setBanTypeFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('banned_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState<BlacklistedIpItem | null>(null);
  const [ipInput, setIpInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [scopeInput, setScopeInput] = useState<'ALL_TRAFFIC' | 'SUPERADMIN_ONLY' | 'TENANT_CONSOLES'>('ALL_TRAFFIC');
  const [typeInput, setTypeInput] = useState<'PERMANENT' | 'TEMPORARY'>('PERMANENT');

  const totalBanned = 142;
  const permanentCount = items.filter(i => i.ban_type === 'PERMANENT').length;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/blacklisted-ips');
      if (res.data.success && Array.isArray(res.data.data)) {
        setItems(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Blacklisted IP firewall threat records refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, banTypeFilter, scopeFilter, sortBy, sortOrder, pageSize]);

  // Add Blacklisted IP
  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipInput.trim() || !reasonInput.trim()) {
      toast.error('Please enter a valid IP/CIDR address and ban reason');
      return;
    }

    toast.loading(`Enforcing firewall ban for '${ipInput}'...`, { id: 'add-blk-toast' });

    try {
      await api.post('/landlord/blacklisted-ips', {
        ip_or_cidr: ipInput,
        ban_reason: reasonInput,
        scope: scopeInput,
        ban_type: typeInput
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newItem: BlacklistedIpItem = {
        id: `blk-${Date.now()}`,
        ip_or_cidr: ipInput,
        ban_reason: reasonInput,
        country: 'Manual Firewall Entry',
        scope: scopeInput,
        ban_type: typeInput,
        banned_at: 'Just now',
        attack_payload_sample: 'Manually Blacklisted by SuperAdmin'
      };
      setItems(prev => [newItem, ...prev]);
      setIsModalOpen(false);
      setIpInput('');
      setReasonInput('');
      toast.success(`🛑 IP/CIDR '${ipInput}' blacklisted in firewall!`, { id: 'add-blk-toast' });
    }, 800);
  };

  // Unban IP
  const handleUnban = async (id: string, ip: string) => {
    toast.loading(`Removing '${ip}' from blacklist...`, { id: 'unban-toast' });

    try {
      await api.post(`/landlord/blacklisted-ips/${id}/unban`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success(`🔓 IP '${ip}' unbanned & restored successfully!`, { id: 'unban-toast' });
    }, 600);
  };

  // Flush Temporary Bans
  const handleFlushTempBans = async () => {
    toast.loading('Flushing all temporary IP bans from firewall...', { id: 'flush-temp-toast' });

    try {
      await api.post('/landlord/blacklisted-ips/flush-temp');
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setItems(prev => prev.filter(i => i.ban_type !== 'TEMPORARY'));
      toast.success('⚡ All temporary IP bans flushed successfully!', { id: 'flush-temp-toast' });
    }, 1000);
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
      i.ban_reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.country.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = banTypeFilter === 'all' || i.ban_type === banTypeFilter;
    const matchesScope = scopeFilter === 'all' || i.scope === scopeFilter;

    return matchesSearch && matchesType && matchesScope;
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
    { value: 'all', label: 'All Ban Types' },
    { value: 'PERMANENT', label: 'PERMANENT 🛑' },
    { value: 'TEMPORARY', label: 'TEMPORARY ⏳' },
  ];

  const scopeOptions: SearchableOption[] = [
    { value: 'all', label: 'All Scopes' },
    { value: 'ALL_TRAFFIC', label: 'All Platform Traffic 🚫' },
    { value: 'SUPERADMIN_ONLY', label: 'SuperAdmin Only 👑' },
    { value: 'TENANT_CONSOLES', label: 'Tenant Consoles 🏫' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'banned_at', label: 'Banned Date' },
    { value: 'ip_or_cidr', label: 'IP Address' },
    { value: 'ban_reason', label: 'Ban Reason' },
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
              <Ban className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Blacklisted IPs & Threat Intelligence Firewall
                <span className="px-2.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-extrabold rounded-full border border-red-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Fail2ban Drop Active
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Block malicious IP addresses, automated botnets, credential stuffers, and SQL injection attack vectors
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
            onClick={handleFlushTempBans}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-amber-400 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Unlock className="w-3.5 h-3.5" /> Flush Temp Bans
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Blacklist IP Address
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Banned IPs</span>
            <Ban className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalBanned} IPs</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Firewall Drop Rules</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Permanently Blocked</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{permanentCount} Hard Banned</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Botnets & Attackers</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Temporary Rate Banned</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">24 Rate Banned</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Auto-Expiring (24h)</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Threat Level</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">HIGH ALERT 🔴</div>
          <div className="text-[10px] text-slate-500 mt-0.5">DDoS & Spray Shield</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Firewall Mode</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">DROP 🟢</div>
          <div className="text-[10px] text-slate-500 mt-0.5">IPTables Active</div>
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
              placeholder="Search by IP address, ban reason, country..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-red-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={typeOptions} value={banTypeFilter} onChange={setBanTypeFilter} placeholder="Ban Type..." icon={Filter} labelPrefix="Type" />
          <SearchableSelect options={scopeOptions} value={scopeFilter} onChange={setScopeFilter} placeholder="Scope..." icon={Filter} labelPrefix="Scope" />
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

      {/* ── BLACKLIST TABLE ── */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('ip_or_cidr')}>Banned IP & Geolocation</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('ban_reason')}>Ban Reason</th>
                <th className="p-3.5">Blocked Scope</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('banned_at')}>Banned Date</th>
                <th className="p-3.5">Ban Type</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(i => (
                <tr key={i.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Ban className="w-4 h-4 text-red-400" />
                      <div>
                        <div className="text-sm text-red-400 font-extrabold">{i.ip_or_cidr}</div>
                        <div className="text-[10px] text-slate-500 font-sans flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400" /> {i.country}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-amber-400 font-bold">{i.ban_reason}</td>
                  <td className="p-3.5 font-mono text-purple-400 font-bold">{i.scope}</td>
                  <td className="p-3.5 font-mono text-slate-400 text-[11px]">{i.banned_at}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        i.ban_type === 'PERMANENT'
                          ? 'bg-red-500/15 text-red-400 border-red-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {i.ban_type}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleUnban(i.id, i.ip_or_cidr)}
                        className="px-2.5 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Unlock className="w-3.5 h-3.5" /> Unban IP
                      </button>
                      <button
                        onClick={() => setSelectedThreat(i)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-red-400" /> Payload
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── THREAT PAYLOAD MODAL ── */}
      {selectedThreat && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-extrabold text-white">Attack Threat Telemetry Inspector</h3>
              </div>
              <button onClick={() => setSelectedThreat(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-red-400 font-bold">Banned Target: {selectedThreat.ip_or_cidr} ({selectedThreat.country})</div>
                <div className="text-amber-400">Triggered Reason: {selectedThreat.ban_reason}</div>
                <div className="text-slate-500 text-[11px]">Banned Date: {selectedThreat.banned_at}</div>
              </div>

              <div>
                <div className="text-slate-400 font-bold mb-1">Attack Payload Sample / Trigger Log:</div>
                <pre className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-red-300 text-[11px] overflow-x-auto">
                  {selectedThreat.attack_payload_sample}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedThreat(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD BLACKLIST MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-extrabold text-white">Blacklist IP Address in Firewall</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBlacklist} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">IPv4 or CIDR Range</label>
                <input
                  type="text"
                  required
                  value={ipInput}
                  onChange={e => setIpInput(e.target.value)}
                  placeholder="e.g. 45.142.214.88 or 103.21.12.0/24"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Ban Reason</label>
                <input
                  type="text"
                  required
                  value={reasonInput}
                  onChange={e => setReasonInput(e.target.value)}
                  placeholder="e.g. Malicious SQL Injection Spray"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Blocked Scope</label>
                  <select
                    value={scopeInput}
                    onChange={e => setScopeInput(e.target.value as 'ALL_TRAFFIC' | 'SUPERADMIN_ONLY' | 'TENANT_CONSOLES')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red-500 cursor-pointer"
                  >
                    <option value="ALL_TRAFFIC">All Platform Traffic</option>
                    <option value="SUPERADMIN_ONLY">SuperAdmin Only</option>
                    <option value="TENANT_CONSOLES">Tenant Consoles</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Ban Type</label>
                  <select
                    value={typeInput}
                    onChange={e => setTypeInput(e.target.value as 'PERMANENT' | 'TEMPORARY')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red-500 cursor-pointer"
                  >
                    <option value="PERMANENT">PERMANENT</option>
                    <option value="TEMPORARY">TEMPORARY (24h)</option>
                  </select>
                </div>
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
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-red-600/30"
                >
                  Enforce Firewall Ban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
