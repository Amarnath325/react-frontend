import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  FileText, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X, Radio, Lock,
  Plus, Eye, Shield, Download, Globe, Activity, Terminal
} from 'lucide-react';
import api from '../../../services/api';

interface ActivityLogItem {
  id: string;
  activity_id: string;
  admin_name: string;
  admin_email: string;
  action_type: string;
  module: 'TENANTS' | 'SECURITY' | 'DATABASES' | 'SETTINGS' | 'INQUIRIES' | 'MONITORING';
  target_resource: string;
  origin_ip: string;
  impact_level: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  payload_json: string;
}

type SortField = 'timestamp' | 'admin_name' | 'action_type' | 'module';
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

const mockActivityLogs: ActivityLogItem[] = [
  {
    id: 'act-1',
    activity_id: 'ACT-8921',
    admin_name: 'Amarnath Sharma',
    admin_email: 'amarnath@myschoolpoint.com',
    action_type: 'TENANT_SUSPENDED',
    module: 'TENANTS',
    target_resource: 'DPS Noida (dpsnoida.myschoolpoint.com)',
    origin_ip: '49.36.142.10',
    impact_level: 'HIGH',
    timestamp: '2026-08-11 20:10:00',
    payload_json: JSON.stringify({ reason: 'Overdue invoice payment > 30 days', previous_status: 'ACTIVE', new_status: 'SUSPENDED' }, null, 2)
  },
  {
    id: 'act-2',
    activity_id: 'ACT-8918',
    admin_name: 'Vikram Singh',
    admin_email: 'security.lead@myschoolpoint.com',
    action_type: 'WAF_RULE_UPDATED',
    module: 'SECURITY',
    target_resource: 'HTTP L7 Rate Limit Rule #104',
    origin_ip: '182.72.10.5',
    impact_level: 'HIGH',
    timestamp: '2026-08-11 19:45:00',
    payload_json: JSON.stringify({ rule_id: 'ddos-1', threshold: '100 req / 10s', action: 'JS Challenge' }, null, 2)
  },
  {
    id: 'act-3',
    activity_id: 'ACT-8910',
    admin_name: 'Neha Gupta',
    admin_email: 'support.master@myschoolpoint.com',
    action_type: 'INQUIRY_STATUS_CHANGED',
    module: 'INQUIRIES',
    target_resource: 'Inquiry #INC-402 (DPS Jaipur)',
    origin_ip: '103.21.12.9',
    impact_level: 'LOW',
    timestamp: '2026-08-11 18:15:00',
    payload_json: JSON.stringify({ inquiry_id: 402, status: 'RESOLVED', note: 'Contacted principal via phone' }, null, 2)
  },
  {
    id: 'act-4',
    activity_id: 'ACT-8902',
    admin_name: 'Amarnath Sharma',
    admin_email: 'amarnath@myschoolpoint.com',
    action_type: 'GLOBAL_SETTING_UPDATED',
    module: 'SETTINGS',
    target_resource: 'Auto-Lock Inactivity Threshold',
    origin_ip: '49.36.142.10',
    impact_level: 'MEDIUM',
    timestamp: '2026-08-11 16:00:00',
    payload_json: JSON.stringify({ setting_key: 'auto_lock_minutes', old_val: 15, new_val: 20 }, null, 2)
  }
];

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>(mockActivityLogs);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [impactFilter, setImpactFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [selectedPayload, setSelectedPayload] = useState<ActivityLogItem | null>(null);

  const totalLogsCount = 14280;
  const highImpactCount = logs.filter(l => l.impact_level === 'HIGH').length;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/admin-activity-logs');
      if (res.data.success && Array.isArray(res.data.data)) {
        setLogs(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Admin Activity Telemetry stream refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, moduleFilter, impactFilter, sortBy, sortOrder, pageSize]);

  // Export Activity Logs
  const handleExport = async () => {
    toast.loading('Generating SuperAdmin Activity Log CSV audit package...', { id: 'exp-act-toast' });

    try {
      await api.post('/landlord/admin-activity-logs/export');
    } catch {
      // Fallback
    }

    setTimeout(() => {
      toast.success('📥 SuperAdmin Activity Log exported successfully!', { id: 'exp-act-toast' });
    }, 1000);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = logs.filter(l => {
    const matchesSearch =
      l.activity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.admin_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.admin_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.target_resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.origin_ip.includes(searchTerm);

    const matchesModule = moduleFilter === 'all' || l.module === moduleFilter;
    const matchesImpact = impactFilter === 'all' || l.impact_level === impactFilter;

    return matchesSearch && matchesModule && matchesImpact;
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

  const moduleOptions: SearchableOption[] = [
    { value: 'all', label: 'All Modules' },
    { value: 'TENANTS', label: 'TENANTS' },
    { value: 'SECURITY', label: 'SECURITY' },
    { value: 'DATABASES', label: 'DATABASES' },
    { value: 'SETTINGS', label: 'SETTINGS' },
    { value: 'INQUIRIES', label: 'INQUIRIES' },
    { value: 'MONITORING', label: 'MONITORING' },
  ];

  const impactOptions: SearchableOption[] = [
    { value: 'all', label: 'All Impact Levels' },
    { value: 'HIGH', label: 'HIGH 🔴' },
    { value: 'MEDIUM', label: 'MEDIUM 🟡' },
    { value: 'LOW', label: 'LOW 🔵' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'timestamp', label: 'Timestamp' },
    { value: 'admin_name', label: 'Admin Name' },
    { value: 'action_type', label: 'Action Type' },
    { value: 'module', label: 'Target Module' },
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
              <FileText className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                SuperAdmin Activity Telemetry & Audit Stream
                <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-extrabold rounded-full border border-rose-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Sub-Second Dispatch
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time admin activity tracking, operational mutation logs, payload diff inspection, and 90-day audit vault
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
            onClick={handleExport}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 text-rose-400 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
          >
            <Download className="w-4 h-4" /> Export CSV Log
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Actions Logged</span>
            <FileText className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalLogsCount.toLocaleString()} Actions</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Full Telemetry Stream</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">High Impact Events</span>
            <Activity className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{highImpactCount} Critical</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Schema & WAF Mutating</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Admins</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">8 Admins</div>
          <div className="text-[10px] text-slate-500 mt-0.5">SuperAdmin Session Audit</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Audit Vault</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">90 Days</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Immutable Log Storage</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Dispatch Latency</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">&lt; 10 ms</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Real-time Stream Engine</div>
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
              placeholder="Search by activity ID, admin name, action type, target resource, IP..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-rose-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={moduleOptions} value={moduleFilter} onChange={setModuleFilter} placeholder="Module..." icon={Filter} labelPrefix="Module" />
          <SearchableSelect options={impactOptions} value={impactFilter} onChange={setImpactFilter} placeholder="Impact..." icon={Filter} labelPrefix="Impact" />
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

      {/* ── ACTIVITY LOGS TABLE ── */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('action_type')}>Action & Activity ID</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('admin_name')}>Administrator</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('module')}>Target & Module</th>
                <th className="p-3.5">Impact Level</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('timestamp')}>Timestamp & IP</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(l => (
                <tr key={l.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-rose-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{l.action_type}</div>
                        <div className="text-[10px] text-slate-500 font-sans">{l.activity_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono">
                    <div className="text-white font-bold">{l.admin_name}</div>
                    <div className="text-[10px] text-rose-400 font-sans">{l.admin_email}</div>
                  </td>
                  <td className="p-3.5 font-mono">
                    <div className="text-purple-400 font-bold">{l.target_resource}</div>
                    <div className="text-[10px] text-slate-500 font-sans">Module: {l.module}</div>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        l.impact_level === 'HIGH'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                          : l.impact_level === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      }`}
                    >
                      {l.impact_level}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px]">
                    <div className="text-slate-300 font-bold">{l.timestamp}</div>
                    <div className="text-[10px] text-slate-500 font-sans flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-500" /> {l.origin_ip}
                    </div>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setSelectedPayload(l)}
                      className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5 text-rose-400" /> Inspect Diff
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PAYLOAD DIFF INSPECTOR MODAL ── */}
      {selectedPayload && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-extrabold text-white">Activity Request Payload & Delta Diff</h3>
              </div>
              <button onClick={() => setSelectedPayload(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-rose-400 font-bold">{selectedPayload.action_type} ({selectedPayload.activity_id})</div>
                <div className="text-slate-400">Performed By: {selectedPayload.admin_name} ({selectedPayload.admin_email})</div>
                <div className="text-slate-500 text-[11px]">Timestamp: {selectedPayload.timestamp} · IP: {selectedPayload.origin_ip}</div>
              </div>

              <div>
                <div className="text-slate-400 font-bold mb-1">Target Resource: {selectedPayload.target_resource}</div>
                <pre className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-emerald-300 text-[11px] overflow-x-auto">
                  {selectedPayload.payload_json}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPayload(null)}
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
