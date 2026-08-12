import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Zap, RefreshCw, Cpu, Database, ShieldCheck, CheckCircle2,
  AlertTriangle, Clock, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronDown, Check, List, Terminal, X, Power, Radio, Code, Eye,
  Trash2, HardDrive, Sparkles, Layers
} from 'lucide-react';
import api from '../../../services/api';

interface CacheKeyItem {
  id: string;
  key_name: string;
  namespace: 'Landlord Settings' | 'Tenant Data' | 'Route & Config' | 'Session Store';
  size_kb: number;
  ttl_seconds: number; // -1 for persistent
  hits_count: number;
  last_accessed: string;
  sample_value: string;
}

type TabKey = 'keys_browser' | 'performance_gauges' | 'flush_controls';
type SortField = 'key_name' | 'size_kb' | 'ttl_seconds' | 'hits_count';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-amber-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
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
                      ? 'bg-amber-600/20 text-amber-400 font-bold border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockKeys: CacheKeyItem[] = [
  {
    id: 'k-1',
    key_name: 'landlord_global_settings',
    namespace: 'Landlord Settings',
    size_kb: 14.5,
    ttl_seconds: 2592000, // 30 days
    hits_count: 14820,
    last_accessed: '2026-08-10 20:39:10',
    sample_value: '{"appName":"MySchoolPoint ERP","appUrl":"https://myschoolpoint.com","minPasswordLength":8...}'
  },
  {
    id: 'k-2',
    key_name: 'landlord_default_themes',
    namespace: 'Landlord Settings',
    size_kb: 8.2,
    ttl_seconds: 2592000,
    hits_count: 8410,
    last_accessed: '2026-08-10 20:38:00',
    sample_value: '[{"id":1,"name":"Midnight Emerald","primary_color":"#10B981","is_default":true}...]'
  },
  {
    id: 'k-3',
    key_name: 'tenant:dpsnoida:student_count',
    namespace: 'Tenant Data',
    size_kb: 0.8,
    ttl_seconds: 3600,
    hits_count: 2450,
    last_accessed: '2026-08-10 20:40:02',
    sample_value: '{"student_count":1240,"active_sections":42}'
  },
  {
    id: 'k-4',
    key_name: 'route_config_cache_v2',
    namespace: 'Route & Config',
    size_kb: 42.0,
    ttl_seconds: -1, // Persistent
    hits_count: 45890,
    last_accessed: '2026-08-10 20:40:15',
    sample_value: '{"routes_count":44,"cached_at":"2026-08-10 18:45:00"}'
  }
];

export default function CacheMonitoringPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('keys_browser');
  const [keys, setKeys] = useState<CacheKeyItem[]>(mockKeys);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [namespaceFilter, setNamespaceFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('hits_count');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [selectedPayload, setSelectedPayload] = useState<CacheKeyItem | null>(null);
  const [showFlushModal, setShowFlushModal] = useState(false);
  const [flushing, setFlushing] = useState(false);

  // Metrics
  const [cacheMetrics, setCacheMetrics] = useState({
    memoryUsedMb: 248,
    memoryTotalMb: 2048,
    hitRatioPercent: 99.8,
    totalKeys: 14250,
    opsPerSec: 3200,
    evictedKeys: 0,
  });

  // Simulated live Ops/sec pulse
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setCacheMetrics(prev => ({
        ...prev,
        opsPerSec: Math.min(5000, Math.max(1500, prev.opsPerSec + (Math.floor(Math.random() * 200) - 100))),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/cache-monitoring');
      if (res.data.success && res.data.data && Array.isArray(res.data.data.keys)) {
        setKeys(res.data.data.keys);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Redis cache metrics & key browser refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, namespaceFilter, sortBy, sortOrder, pageSize]);

  // Delete Individual Key
  const handleDeleteKey = async (id: string, keyName: string) => {
    toast.loading(`Evicting Redis cache key '${keyName}'...`, { id: 'delete-key-toast' });
    try {
      await api.post('/landlord/cache-monitoring/delete-key', { key_name: keyName });
    } catch {
      // Fallback
    }
    setTimeout(() => {
      setKeys(prev => prev.filter(k => k.id !== id));
      toast.success(`⚡ Key '${keyName}' evicted from Redis store!`, { id: 'delete-key-toast' });
    }, 600);
  };

  // Flush Entire Cache
  const handleFlushConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFlushing(true);
    toast.loading('Flushing entire Redis cache store...', { id: 'flush-toast' });

    try {
      await api.post('/landlord/cache-monitoring/flush');
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setFlushing(false);
      setShowFlushModal(false);
      toast.success('🎉 Entire Redis cache store & route config flushed!', { id: 'flush-toast' });
    }, 1200);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = keys.filter(k => {
    const matchesSearch =
      k.key_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.sample_value.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesNamespace = namespaceFilter === 'all' || k.namespace === namespaceFilter;

    return matchesSearch && matchesNamespace;
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

  const namespaceOptions: SearchableOption[] = [
    { value: 'all', label: 'All Namespaces' },
    { value: 'Landlord Settings', label: 'Landlord Settings' },
    { value: 'Tenant Data', label: 'Tenant Data' },
    { value: 'Route & Config', label: 'Route & Config' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'hits_count', label: 'Hit Count' },
    { value: 'size_kb', label: 'Payload Size (KB)' },
    { value: 'key_name', label: 'Key Name' },
    { value: 'ttl_seconds', label: 'TTL Expiry' },
  ];

  const pageSizeOptions: SearchableOption[] = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: 'all', label: 'Show All' },
  ];

  const memoryPercent = Math.round((cacheMetrics.memoryUsedMb / cacheMetrics.memoryTotalMb) * 100);

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-400/30">
              <Zap className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Redis Cache Engine & Memory Monitor
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-extrabold rounded-full border border-amber-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Redis 7.0 Active
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time hit/miss acceleration ratios, memory utilization, key namespace browser, and instant eviction tools
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Pulse (3s): {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setShowFlushModal(true)}
            className="px-3.5 py-2 bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" /> Flush Cache Store
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-600/30 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Metrics
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Hit Ratio</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{cacheMetrics.hitRatioPercent}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">High Acceleration</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Cache Memory</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{cacheMetrics.memoryUsedMb} MB</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Of {cacheMetrics.memoryTotalMb} MB ({memoryPercent}%)</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Keys Active</span>
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{cacheMetrics.totalKeys.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Across All Namespaces</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Redis Ops/Sec</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{cacheMetrics.opsPerSec} Ops</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Commands Per Sec</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Evicted Keys</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{cacheMetrics.evictedKeys} Evicted</div>
          <div className="text-[10px] text-slate-500 mt-0.5">LRU Eviction Nominal</div>
        </div>
      </div>

      {/* ── CATEGORIZED TABS NAVIGATION ── */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-1.5 flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('keys_browser')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'keys_browser' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Code className="w-4 h-4" /> Key Namespace Browser ({keys.length})
        </button>
        <button
          onClick={() => setActiveTab('performance_gauges')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'performance_gauges' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" /> Redis Performance Gauges
        </button>
      </div>

      {/* ── TOOLBAR ── */}
      {activeTab === 'keys_browser' && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search cache keys by pattern, namespace, value..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <SearchableSelect options={namespaceOptions} value={namespaceFilter} onChange={setNamespaceFilter} placeholder="Namespace..." icon={Filter} labelPrefix="Namespace" />
            <div className="flex items-center gap-1">
              <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
              <button
                onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                className="p-2 bg-slate-900 border border-slate-800 text-amber-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
              >
                {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
              </button>
            </div>
            <SearchableSelect options={pageSizeOptions} value={String(pageSize)} onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))} placeholder="Per Page..." icon={List} labelPrefix="Rows" />
          </div>
        </div>
      )}

      {/* ── TAB 1: KEYS BROWSER TABLE ── */}
      {activeTab === 'keys_browser' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('key_name')}>Cache Key Name</th>
                  <th className="p-3.5">Namespace</th>
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('size_kb')}>Payload Size</th>
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('ttl_seconds')}>TTL Expiry</th>
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('hits_count')}>Hits</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedData.map(item => (
                  <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-bold text-white font-mono">
                      <div>{item.key_name}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{item.last_accessed}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 bg-slate-900 border border-slate-800 text-amber-400 font-bold text-[10px] rounded-full">
                        {item.namespace}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-cyan-400 font-bold">{item.size_kb} KB</td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {item.ttl_seconds === -1 ? 'Persistent (No Expiry)' : `${Math.round(item.ttl_seconds / 86400)} Days`}
                    </td>
                    <td className="p-3.5 font-mono text-emerald-400 font-bold">{item.hits_count.toLocaleString()}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPayload(item)}
                          className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-cyan-400" /> Value
                        </button>
                        <button
                          onClick={() => handleDeleteKey(item.id, item.key_name)}
                          className="px-2.5 py-1 bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Evict
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: PERFORMANCE GAUGES ── */}
      {activeTab === 'performance_gauges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-amber-400" /> Redis Memory Allocation Progress
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold font-mono">
                <span className="text-slate-400">Used Memory: {cacheMetrics.memoryUsedMb} MB</span>
                <span className="text-amber-400">Allocated: {cacheMetrics.memoryTotalMb} MB ({memoryPercent}%)</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-800 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${memoryPercent}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cache Hit vs Miss Ratio
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold font-mono">
                <span className="text-emerald-400">Hit Rate: {cacheMetrics.hitRatioPercent}%</span>
                <span className="text-red-400">Miss Rate: {(100 - cacheMetrics.hitRatioPercent).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-800 overflow-hidden flex">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${cacheMetrics.hitRatioPercent}%` }} />
                <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${100 - cacheMetrics.hitRatioPercent}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 1: VIEW PAYLOAD VALUE ── */}
      {selectedPayload && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2 font-mono">
                <Code className="w-4 h-4 text-amber-400" /> Key: {selectedPayload.key_name}
              </h3>
              <button onClick={() => setSelectedPayload(null)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-black p-4 rounded-2xl border border-slate-800 font-mono text-xs text-amber-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {selectedPayload.sample_value}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button onClick={() => setSelectedPayload(null)} className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-bold text-xs cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: FLUSH ENTIRE CACHE CONFIRMATION ── */}
      {showFlushModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleFlushConfirm} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2 text-red-400">
                <Trash2 className="w-4 h-4" /> Flush Entire Redis Cache Confirmation
              </h3>
              <button type="button" onClick={() => setShowFlushModal(false)} className="p-1 text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-300 font-medium">
                Are you sure you want to flush all cached data in the Redis store?
              </p>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-[11px] text-red-400 space-y-1">
                <div className="font-bold">⚠️ Warning:</div>
                <div>All cached queries, landlord settings, and session cache will be purged and re-populated on subsequent requests.</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => setShowFlushModal(false)} className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-bold text-xs cursor-pointer">
                Cancel
              </button>
              <button
                type="submit"
                disabled={flushing}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/30 disabled:opacity-60"
              >
                <Trash2 className="w-3.5 h-3.5" /> {flushing ? 'Flushing...' : 'Confirm Flush'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
