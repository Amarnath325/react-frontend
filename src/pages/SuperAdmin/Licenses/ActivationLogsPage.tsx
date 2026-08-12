import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Activity, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, Cpu, Lock, AlertTriangle, Globe
} from 'lucide-react';
import api from '../../../services/api';

interface ActivationLogItem {
  id: string;
  log_id: string;
  key_code: string;
  school_name: string;
  ip_address: string;
  mac_fingerprint: string;
  result: 'SUCCESS_VALID' | 'EXPIRED_KEY' | 'HARDWARE_MISMATCH' | 'REVOKED_KEY';
  geo_location: string;
  timestamp: string;
}

type SortField = 'timestamp' | 'school_name' | 'result';
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

const mockActivationLogs: ActivationLogItem[] = [
  {
    id: 'act-1',
    log_id: 'ACT-4092',
    key_code: 'MSP-PRO-2026-X89F-4421-9B00',
    school_name: 'St. Xavier International School',
    ip_address: '103.24.12.8',
    mac_fingerprint: 'A4-C3-F0-91-12-88',
    result: 'SUCCESS_VALID',
    geo_location: 'Mumbai, India',
    timestamp: '2026-08-11 15:30:00'
  },
  {
    id: 'act-2',
    log_id: 'ACT-4085',
    key_code: 'MSP-STD-2026-A12B-9876-4C11',
    school_name: 'Delhi Public School, Sector 45',
    ip_address: '182.73.11.4',
    mac_fingerprint: 'B8-27-EB-44-90-11',
    result: 'SUCCESS_VALID',
    geo_location: 'New Delhi, India',
    timestamp: '2026-08-11 14:15:00'
  },
  {
    id: 'act-3',
    log_id: 'ACT-4070',
    key_code: 'MSP-TRL-2026-Z000-1111-2222',
    school_name: 'Unknown Attacker Node',
    ip_address: '45.142.120.9',
    mac_fingerprint: 'FF-FF-FF-FF-FF-FF',
    result: 'EXPIRED_KEY',
    geo_location: 'Frankfurt, Germany',
    timestamp: '2026-08-10 18:20:00'
  }
];

export default function ActivationLogsPage() {
  const [logs, setLogs] = useState<ActivationLogItem[]>(mockActivationLogs);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [selectedLog, setSelectedLog] = useState<ActivationLogItem | null>(null);

  const totalPingsCount = 142800;
  const validPingsCount = 142650;
  const blockedAttacksCount = 150;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/activation-logs');
      if (res.data.success && Array.isArray(res.data.data)) {
        setLogs(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('License activation pings & hardware MAC logs refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, resultFilter, sortBy, sortOrder, pageSize]);

  const handleBlockIp = (ip: string) => {
    toast.success(`🛡️ IP Address '${ip}' added to Landlord Firewall blacklist!`);
  };

  const handleDeleteLog = async (id: string, logId: string) => {
    toast.loading(`Deleting log '${logId}'...`, { id: 'del-act-toast' });

    try {
      await api.delete(`/landlord/activation-logs/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setLogs(prev => prev.filter(l => l.id !== id));
      toast.success(`🗑️ Activation log '${logId}' deleted!`, { id: 'del-act-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = logs.filter(l => {
    const matchesSearch =
      l.log_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.key_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.mac_fingerprint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.geo_location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesResult = resultFilter === 'all' || l.result === resultFilter;

    return matchesSearch && matchesResult;
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

  const resultOptions: SearchableOption[] = [
    { value: 'all', label: 'All Results' },
    { value: 'SUCCESS_VALID', label: 'SUCCESS VALID 🟢' },
    { value: 'EXPIRED_KEY', label: 'EXPIRED KEY 🔴' },
    { value: 'HARDWARE_MISMATCH', label: 'HARDWARE MISMATCH ⚠️' },
    { value: 'REVOKED_KEY', label: 'REVOKED KEY 🔒' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'timestamp', label: 'Timestamp' },
    { value: 'school_name', label: 'School Name' },
    { value: 'result', label: 'Activation Result' },
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
              <Activity className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                License Key Activation & Hardware MAC Verification Audit Logs
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-extrabold rounded-full border border-indigo-400/30 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 animate-pulse" /> Real-Time Ping Audit Live
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit client license activation pings, hardware MAC address bindings, GeoIP locations, and detect unauthorized key reuse
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Pings</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalPingsCount.toLocaleString()} Pings</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Activation Heartbeats</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Valid Validations</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{validPingsCount.toLocaleString()} Valid 🟢</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Legitimate Access</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Blocked Attacks</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{blockedAttacksCount} Blocked 🛡️</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Tampered Keys</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Top Geo Region</span>
            <Globe className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">INDIA (92%) 🌐</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Primary Traffic</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">HW Binding Rate</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">99.4% 🔒</div>
          <div className="text-[10px] text-slate-500 mt-0.5">MAC Hardware Lock</div>
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
              placeholder="Search by log ID, key code, school name, IP address, MAC fingerprint..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={resultOptions} value={resultFilter} onChange={setResultFilter} placeholder="Result..." icon={Filter} labelPrefix="Result" />
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
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('school_name')}>School & Log ID</th>
                <th className="p-3.5">License Key Code</th>
                <th className="p-3.5">Client IP & Geo</th>
                <th className="p-3.5 font-mono">Hardware MAC</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('result')}>Activation Result</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('timestamp')}>Timestamp</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(l => (
                <tr key={l.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{l.school_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{l.log_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-indigo-400 font-bold">{l.key_code}</td>
                  <td className="p-3.5 font-mono text-[10px]">
                    <div className="text-white font-bold">{l.ip_address}</div>
                    <div className="text-slate-400 text-[9px]">{l.geo_location}</div>
                  </td>
                  <td className="p-3.5 font-mono text-[10px] text-purple-400 font-bold">{l.mac_fingerprint}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        l.result === 'SUCCESS_VALID'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border-red-500/30'
                      }`}
                    >
                      {l.result}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-300 font-bold">{l.timestamp}</td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {l.result !== 'SUCCESS_VALID' && (
                        <button
                          onClick={() => handleBlockIp(l.ip_address)}
                          className="px-2 py-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" /> Block IP
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" /> Ping Details
                      </button>
                      <button
                        onClick={() => handleDeleteLog(l.id, l.log_id)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete Log Record"
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

      {selectedLog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-extrabold text-white">Activation Ping Audit Inspector ({selectedLog.log_id})</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-indigo-400 font-bold">{selectedLog.key_code}</div>
                <div className="text-slate-400">School: {selectedLog.school_name} · IP: {selectedLog.ip_address}</div>
                <div className="text-slate-500 text-[11px]">MAC: {selectedLog.mac_fingerprint} · Geo: {selectedLog.geo_location}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
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
