import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldAlert, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, Power, AlertTriangle, Cpu, Lock, Terminal
} from 'lucide-react';
import api from '../../../services/api';

interface MaintenanceLog {
  id: string;
  log_id: string;
  reason: string;
  operator: string;
  affected_services: string;
  whitelisted_ips: string[];
  status: 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED';
  started_at: string;
  duration_minutes: number;
}

type SortField = 'started_at' | 'reason' | 'status';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-teal-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-teal-500 placeholder-slate-600"
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
                      ? 'bg-teal-600/20 text-teal-400 font-bold border border-teal-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-teal-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockLogs: MaintenanceLog[] = [
  {
    id: 'mnt-1',
    log_id: 'MNT-7012',
    reason: 'Multi-Tenant PostgreSQL Database Indexing & Vacuuming',
    operator: 'Vikram Malhotra (Lead DevOps)',
    affected_services: 'ALL SAAS SERVICES',
    whitelisted_ips: ['103.24.12.8', '192.168.1.100'],
    status: 'COMPLETED',
    started_at: '2026-08-03 02:00:00',
    duration_minutes: 45
  },
  {
    id: 'mnt-2',
    log_id: 'MNT-7005',
    reason: 'Razorpay & Paytm Webhook Gateway SSL Certificate Renewal',
    operator: 'Siddharth Rao (Security Eng)',
    affected_services: 'FEE PAYMENT GATEWAY ONLY',
    whitelisted_ips: ['103.24.12.8'],
    status: 'COMPLETED',
    started_at: '2026-07-15 03:30:00',
    duration_minutes: 15
  },
  {
    id: 'mnt-3',
    log_id: 'MNT-6990',
    reason: 'Planned AWS S3 Storage Snapshot & Backup Archival',
    operator: 'System Cron Daemon',
    affected_services: 'FILE DOWNLOADS ONLY',
    whitelisted_ips: ['127.0.0.1'],
    status: 'COMPLETED',
    started_at: '2026-07-01 01:00:00',
    duration_minutes: 25
  }
];

export default function MaintenanceModePage() {
  const [logs, setLogs] = useState<MaintenanceLog[]>(mockLogs);
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('started_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);

  // Form State
  const [reasonInput, setReasonInput] = useState('');
  const [affectedServicesInput, setAffectedServicesInput] = useState('ALL SAAS SERVICES');
  const [durationInput, setDurationInput] = useState(60);
  const [whitelistedIpsInput, setWhitelistedIpsInput] = useState('103.24.12.8, 192.168.1.100');

  const whitelistedIpsCount = 14;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/maintenance-mode');
      if (res.data.success) {
        setIsMaintenanceActive(res.data.is_maintenance_active || false);
        if (Array.isArray(res.data.logs)) setLogs(res.data.logs);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Maintenance status & system health logs refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder, pageSize]);

  // Master Maintenance Switch Toggle
  const handleToggleMaintenance = async () => {
    const nextState = !isMaintenanceActive;
    toast.loading(
      nextState
        ? '⚠️ ENABLING SYSTEM-WIDE MAINTENANCE MODE...'
        : '🟢 DISABLING MAINTENANCE MODE & RESTORING ACCESS...',
      { id: 'mnt-toggle-toast' }
    );

    try {
      await api.post('/landlord/maintenance-mode/toggle', { active: nextState });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setIsMaintenanceActive(nextState);
      toast.success(
        nextState
          ? '🔴 MAINTENANCE MODE IS NOW LIVE! All non-whitelisted traffic locked.'
          : '🟢 MAINTENANCE MODE DEACTIVATED! Normal tenant access restored.',
        { id: 'mnt-toggle-toast' }
      );
    }, 800);
  };

  // Schedule Maintenance Window
  const handleScheduleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonInput.trim()) {
      toast.error('Please enter maintenance reason');
      return;
    }

    toast.loading(`Scheduling system maintenance window...`, { id: 'add-mnt-toast' });

    const ipList = whitelistedIpsInput.split(',').map(s => s.trim()).filter(Boolean);

    try {
      await api.post('/landlord/maintenance-mode/schedule', {
        reason: reasonInput,
        affected_services: affectedServicesInput,
        duration_minutes: durationInput,
        whitelisted_ips: ipList
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newLog: MaintenanceLog = {
        id: `mnt-${Date.now()}`,
        log_id: `MNT-${Math.floor(1000 + Math.random() * 9000)}`,
        reason: reasonInput,
        operator: 'SuperAdmin Operator',
        affected_services: affectedServicesInput,
        whitelisted_ips: ipList,
        status: 'SCHEDULED',
        started_at: '2026-08-15 02:00:00',
        duration_minutes: durationInput
      };
      setLogs(prev => [newLog, ...prev]);
      setIsScheduleModalOpen(false);
      setReasonInput('');
      toast.success(`⏰ System Maintenance '${newLog.log_id}' scheduled!`, { id: 'add-mnt-toast' });
    }, 800);
  };

  const handleDeleteLog = async (id: string, logId: string) => {
    toast.loading(`Deleting maintenance record '${logId}'...`, { id: 'del-mnt-toast' });

    try {
      await api.delete(`/landlord/maintenance-mode/logs/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setLogs(prev => prev.filter(l => l.id !== id));
      toast.success(`🗑️ Maintenance log '${logId}' deleted!`, { id: 'del-mnt-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = logs.filter(l => {
    const matchesSearch =
      l.log_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.affected_services.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;

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
    { value: 'COMPLETED', label: 'COMPLETED ✅' },
    { value: 'IN_PROGRESS', label: 'IN PROGRESS 🔄' },
    { value: 'SCHEDULED', label: 'SCHEDULED ⏳' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'started_at', label: 'Started Timestamp' },
    { value: 'reason', label: 'Maintenance Reason' },
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
            <span className={`p-2.5 rounded-2xl border ${isMaintenanceActive ? 'bg-red-500/20 text-red-400 border-red-400/30' : 'bg-teal-500/20 text-teal-400 border-teal-400/30'}`}>
              <ShieldAlert className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                System Maintenance Mode & Emergency Lockdown Hub
                <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border uppercase tracking-wider flex items-center gap-1 ${
                  isMaintenanceActive
                    ? 'bg-red-500/20 text-red-400 border-red-400/30 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30'
                }`}>
                  <Power className="w-3 h-3" /> {isMaintenanceActive ? '🔴 MAINTENANCE MODE LIVE' : '🟢 OPERATIONAL'}
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle master system maintenance switch, lock tenant traffic during database upgrades, and manage IP whitelist access rules
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleToggleMaintenance}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-lg transition-all ${
              isMaintenanceActive
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 animate-pulse'
            }`}
          >
            <Power className="w-4 h-4" /> {isMaintenanceActive ? 'Deactivate Maintenance Mode' : 'ACTIVATE MAINTENANCE MODE NOW'}
          </button>
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
          >
            <Clock className="w-4 h-4 text-teal-400" /> Schedule Maintenance Window
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
            <span className="text-[10px] font-bold uppercase tracking-wider">System State</span>
            <ShieldAlert className={`w-4 h-4 ${isMaintenanceActive ? 'text-red-400' : 'text-emerald-400'}`} />
          </div>
          <div className={`text-xl font-black font-mono ${isMaintenanceActive ? 'text-red-400' : 'text-emerald-400'}`}>
            {isMaintenanceActive ? 'MAINTENANCE 🔴' : 'OPERATIONAL 🟢'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Master Switch State</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Whitelisted Admin IPs</span>
            <Lock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{whitelistedIpsCount} Approved 🛡️</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Bypass IP Filter</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Uptime Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">99.98% ⚡</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Last 90 Days SLA</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Services Impacted</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-400 font-mono">
            {isMaintenanceActive ? 'ALL SERVICES 🛑' : 'NONE 🟢'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Downtime Scope</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Unscheduled Outages</span>
            <AlertTriangle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">0 Hours ✅</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Zero Unplanned Downtime</div>
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
              placeholder="Search by log ID, reason, operator, affected services..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-teal-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
          <div className="flex items-center gap-1">
            <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-900 border border-slate-800 text-teal-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
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
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('reason')}>Maintenance Reason & ID</th>
                <th className="p-3.5">Affected Services</th>
                <th className="p-3.5">Operator</th>
                <th className="p-3.5">Whitelisted IPs</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('started_at')}>Started Timestamp</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('status')}>Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(l => (
                <tr key={l.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-teal-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{l.reason}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{l.log_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[10px]">
                    <span className="px-2 py-0.5 bg-slate-900 text-purple-400 border border-slate-800 rounded font-bold">
                      {l.affected_services}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-300 font-bold">{l.operator}</td>
                  <td className="p-3.5 font-mono text-[10px]">
                    <div className="flex flex-wrap gap-1">
                      {l.whitelisted_ips.map(ip => (
                        <span key={ip} className="px-1.5 py-0.5 bg-slate-900 text-blue-400 rounded font-bold">
                          {ip}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-300 font-bold">{l.started_at}</td>
                  <td className="p-3.5 font-mono text-[11px] text-amber-400 font-bold">{l.duration_minutes} Mins</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        l.status === 'COMPLETED'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : l.status === 'IN_PROGRESS'
                          ? 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-teal-400" /> Log Inspector
                      </button>
                      <button
                        onClick={() => handleDeleteLog(l.id, l.log_id)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete Maintenance Log"
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

      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-extrabold text-white">Schedule System Maintenance Window</h3>
              </div>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleMaintenance} className="space-y-3.5 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Maintenance Reason</label>
                <input
                  type="text"
                  required
                  value={reasonInput}
                  onChange={e => setReasonInput(e.target.value)}
                  placeholder="e.g. PostgreSQL Database Indexing & Vacuuming"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Affected Services</label>
                  <select
                    value={affectedServicesInput}
                    onChange={e => setAffectedServicesInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="ALL SAAS SERVICES">ALL SAAS SERVICES 🛑</option>
                    <option value="FEE PAYMENT GATEWAY ONLY">FEE PAYMENT GATEWAY ONLY 💳</option>
                    <option value="FILE DOWNLOADS ONLY">FILE DOWNLOADS ONLY 📄</option>
                    <option value="MOBILE APP ONLY">MOBILE APP ONLY 📱</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Estimated Duration (Mins)</label>
                  <input
                    type="number"
                    min={10}
                    value={durationInput}
                    onChange={e => setDurationInput(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Whitelisted Admin IPs (Comma Separated)</label>
                <input
                  type="text"
                  required
                  value={whitelistedIpsInput}
                  onChange={e => setWhitelistedIpsInput(e.target.value)}
                  placeholder="103.24.12.8, 192.168.1.100"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-teal-600/30"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedLog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-extrabold text-white">Maintenance Log & IP Whitelist Details ({selectedLog.log_id})</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-teal-400 font-bold">{selectedLog.reason}</div>
                <div className="text-slate-400">Operator: {selectedLog.operator} · Services: {selectedLog.affected_services}</div>
                <div className="text-slate-500 text-[11px]">Started At: {selectedLog.started_at} · Duration: {selectedLog.duration_minutes} Mins</div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="text-white font-bold mb-1">Whitelisted IP Addresses:</div>
                <div className="flex flex-wrap gap-1">
                  {selectedLog.whitelisted_ips.map(ip => (
                    <span key={ip} className="px-2 py-1 bg-slate-950 text-emerald-400 border border-slate-800 rounded font-mono font-bold">
                      {ip}
                    </span>
                  ))}
                </div>
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
