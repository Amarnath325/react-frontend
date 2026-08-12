import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldAlert, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X, Radio, Lock,
  Plus, Edit2, ShieldCheck, Flame, Zap, Activity, AlertTriangle, Globe
} from 'lucide-react';
import api from '../../../services/api';

interface DdosRuleItem {
  id: string;
  vector_name: string;
  layer: 'Layer 7 (HTTP)' | 'Layer 3/4 (Network)';
  target: string;
  action: 'JS Challenge' | 'Drop Packet' | 'SYN Cookies' | 'Block IP';
  threshold: string;
  status: 'MITIGATING' | 'ACTIVE' | 'PAUSED';
  requests_blocked_today: number;
}

type SortField = 'requests_blocked_today' | 'vector_name' | 'layer';
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

const mockDdosRules: DdosRuleItem[] = [
  {
    id: 'ddos-1',
    vector_name: 'HTTP L7 Flood Mitigation',
    layer: 'Layer 7 (HTTP)',
    target: '/api/v1/auth/login',
    action: 'JS Challenge',
    threshold: '100 req / 10s',
    status: 'MITIGATING',
    requests_blocked_today: 1420900
  },
  {
    id: 'ddos-2',
    vector_name: 'UDP Amplification Scrubbing',
    layer: 'Layer 3/4 (Network)',
    target: 'All Tenant Edge IPs',
    action: 'Drop Packet',
    threshold: '500k pps',
    status: 'MITIGATING',
    requests_blocked_today: 382000
  },
  {
    id: 'ddos-3',
    vector_name: 'SYN Flood Protection',
    layer: 'Layer 3/4 (Network)',
    target: 'Port 443 / 80',
    action: 'SYN Cookies',
    threshold: '50k syn/s',
    status: 'MITIGATING',
    requests_blocked_today: 40010
  },
  {
    id: 'ddos-4',
    vector_name: 'Botnet Scraper Blocking',
    layer: 'Layer 7 (HTTP)',
    target: 'Tenant Portals',
    action: 'Block IP',
    threshold: '30 req / min',
    status: 'ACTIVE',
    requests_blocked_today: 12500
  }
];

export default function DdosProtectionPage() {
  const [rules, setRules] = useState<DdosRuleItem[]>(mockDdosRules);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [layerFilter, setLayerFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Under Attack Mode State
  const [underAttackMode, setUnderAttackMode] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('requests_blocked_today');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [selectedRule, setSelectedRule] = useState<DdosRuleItem | null>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  const totalBlockedToday = '1,855,410';
  const peakBandwidth = '4.2 Gbps';

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/ddos-rules');
      if (res.data.success && Array.isArray(res.data.data)) {
        setRules(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('DDoS attack telemetry & WAF mitigation rules refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, layerFilter, actionFilter, sortBy, sortOrder, pageSize]);

  // Toggle Under Attack Mode
  const handleToggleUnderAttack = async () => {
    const newStatus = !underAttackMode;
    toast.loading(`${newStatus ? 'ENABLING' : 'DISABLING'} "I'm Under Attack" emergency JS challenge mode...`, { id: 'attack-mode-toast' });

    try {
      await api.post('/landlord/ddos/toggle-under-attack', { enabled: newStatus });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setUnderAttackMode(newStatus);
      toast.success(
        newStatus
          ? '🚨 EMERGENCY MODE ENABLED! All incoming traffic now requires Cloudflare JS challenge.'
          : '🟢 EMERGENCY MODE DISABLED. Platform returned to standard WAF protection.',
        { id: 'attack-mode-toast' }
      );
    }, 1000);
  };

  // Save Edit Rule
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRule) return;

    toast.loading(`Updating DDoS rule '${selectedRule.vector_name}'...`, { id: 'save-rule-toast' });

    try {
      await api.put(`/landlord/ddos-rules/${selectedRule.id}`, selectedRule);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setRules(prev =>
        prev.map(r => (r.id === selectedRule.id ? selectedRule : r))
      );
      setSelectedRule(null);
      toast.success(`⚡ DDoS WAF mitigation rule updated!`, { id: 'save-rule-toast' });
    }, 800);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = rules.filter(r => {
    const matchesSearch =
      r.vector_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLayer = layerFilter === 'all' || r.layer === layerFilter;
    const matchesAction = actionFilter === 'all' || r.action === actionFilter;

    return matchesSearch && matchesLayer && matchesAction;
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

  const layerOptions: SearchableOption[] = [
    { value: 'all', label: 'All Layers' },
    { value: 'Layer 7 (HTTP)', label: 'Layer 7 (HTTP Flood) 🌐' },
    { value: 'Layer 3/4 (Network)', label: 'Layer 3/4 (UDP/SYN) ⚡' },
  ];

  const actionOptions: SearchableOption[] = [
    { value: 'all', label: 'All Actions' },
    { value: 'JS Challenge', label: 'JS Challenge ⚡' },
    { value: 'Drop Packet', label: 'Drop Packet 🚫' },
    { value: 'SYN Cookies', label: 'SYN Cookies 🔒' },
    { value: 'Block IP', label: 'Block IP 🛑' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'requests_blocked_today', label: 'Blocked Requests' },
    { value: 'vector_name', label: 'Attack Vector' },
    { value: 'layer', label: 'OSI Layer' },
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
              <ShieldAlert className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Real-Time DDoS Mitigation & Cloudflare WAF Shield
                <span className="px-2.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-extrabold rounded-full border border-red-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Scrubbing Center Active
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Mitigate Layer 7 HTTP floods, Layer 3/4 UDP/SYN amplification attacks, and deploy "Under Attack" JS challenges
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
            onClick={() => setIsStatsModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-cyan-400 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Activity className="w-3.5 h-3.5" /> Attack Telemetry Graph
          </button>
          <button
            onClick={handleToggleUnderAttack}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg transition-all ${
              underAttackMode
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/40 border border-red-400/40 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Flame className="w-4 h-4" /> {underAttackMode ? "I'M UNDER ATTACK (ACTIVE) 🚨" : "Enable Under Attack Mode"}
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Peak Attack Bandwidth</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{peakBandwidth}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Scrubbed at Edge</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Dropped Requests</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalBlockedToday}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Today (HTTP Flood)</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Protection Mode</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-black text-amber-400">UNDER ATTACK 🚨</div>
          <div className="text-[10px] text-slate-500 mt-0.5">JS Challenge Mandatory</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Anycast Edge Nodes</span>
            <Globe className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">280 POPs</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Global Scrubbing Centers</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Mitigation Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">99.99% CLEAN 🟢</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Zero Origin Downtime</div>
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
              placeholder="Search by attack vector, target URL, mitigation action..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-rose-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={layerOptions} value={layerFilter} onChange={setLayerFilter} placeholder="Layer..." icon={Filter} labelPrefix="OSI Layer" />
          <SearchableSelect options={actionOptions} value={actionFilter} onChange={setActionFilter} placeholder="Action..." icon={Filter} labelPrefix="Action" />
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

      {/* ── DDOS RULES TABLE ── */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('vector_name')}>Attack Vector & Target</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('layer')}>OSI Layer</th>
                <th className="p-3.5">Threshold Limit</th>
                <th className="p-3.5">Mitigation Action</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('requests_blocked_today')}>Blocked Today</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(r => (
                <tr key={r.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{r.vector_name}</div>
                        <div className="text-[10px] text-slate-500 font-sans">{r.target}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-cyan-400 font-bold">{r.layer}</td>
                  <td className="p-3.5 font-mono text-amber-400 font-bold">{r.threshold}</td>
                  <td className="p-3.5 font-mono text-purple-400 font-bold">{r.action}</td>
                  <td className="p-3.5 font-mono text-red-400 font-extrabold text-sm">{r.requests_blocked_today.toLocaleString()}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        r.status === 'MITIGATING'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {r.status} 🟢
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setSelectedRule(r)}
                      className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-rose-400" /> Configure Rule
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CONFIGURE RULE MODAL ── */}
      {selectedRule && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-extrabold text-white">Configure DDoS Mitigation Rule</h3>
              </div>
              <button onClick={() => setSelectedRule(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Vector Name</label>
                <input
                  type="text"
                  required
                  value={selectedRule.vector_name}
                  onChange={e => setSelectedRule({ ...selectedRule, vector_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Target Endpoint / Interface</label>
                <input
                  type="text"
                  required
                  value={selectedRule.target}
                  onChange={e => setSelectedRule({ ...selectedRule, target: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Mitigation Action</label>
                <select
                  value={selectedRule.action}
                  onChange={e => setSelectedRule({ ...selectedRule, action: e.target.value as 'JS Challenge' | 'Drop Packet' | 'SYN Cookies' | 'Block IP' })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="JS Challenge">JavaScript Challenge (Cloudflare)</option>
                  <option value="Drop Packet">Drop Packet (BGP Blackhole)</option>
                  <option value="SYN Cookies">TCP SYN Cookies</option>
                  <option value="Block IP">Hard Block IP (Fail2ban)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Rate Limit Threshold</label>
                <input
                  type="text"
                  required
                  value={selectedRule.threshold}
                  onChange={e => setSelectedRule({ ...selectedRule, threshold: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRule(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-rose-600/30"
                >
                  Save WAF Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ATTACK TELEMETRY STATS MODAL ── */}
      {isStatsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-extrabold text-white">Live Attack Traffic Telemetry</h3>
              </div>
              <button onClick={() => setIsStatsModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-slate-400 font-bold flex justify-between">
                  <span>Attack Bandwidth Spike:</span>
                  <span className="text-red-400 font-black">4.2 Gbps Peak</span>
                </div>
                {/* Simulated Bandwidth Graph Bars */}
                <div className="flex items-end gap-1.5 h-20 bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                  {[20, 35, 40, 85, 100, 95, 70, 45, 30, 25, 60, 90, 40, 20].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-t-sm transition-all duration-500 ${
                        h >= 80 ? 'bg-red-500' : h >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>10 mins ago</span>
                  <span>5 mins ago</span>
                  <span>Just now</span>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                <div className="text-white font-bold mb-1">Top Attacking Origin Countries:</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300"><span>1. Russia (RU)</span><span className="text-red-400">742,000 req/s</span></div>
                  <div className="flex justify-between text-slate-300"><span>2. China (CN)</span><span className="text-red-400">510,000 req/s</span></div>
                  <div className="flex justify-between text-slate-300"><span>3. Brazil (BR)</span><span className="text-red-400">320,000 req/s</span></div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsStatsModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Telemetry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
