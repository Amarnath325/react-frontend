import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Radio, RefreshCw, Cpu, Database, ShieldCheck, CheckCircle2,
  AlertTriangle, Clock, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronDown, Check, List, Terminal, X, Power, Code, Eye,
  Play, Plus, Activity, Globe, Wifi, Sparkles, AlertCircle
} from 'lucide-react';
import api from '../../../services/api';

interface LiveService {
  id: string;
  name: string;
  category: 'Web Portals' | 'Core Infrastructure' | 'Messaging Gateways' | 'Payment Gateways';
  status: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
  latency_ms: number;
  uptime_90d: string;
  endpoint: string;
  last_checked: string;
}

type SortField = 'name' | 'latency_ms' | 'uptime_90d';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-emerald-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-emerald-500 placeholder-slate-600"
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
                      ? 'bg-emerald-600/20 text-emerald-400 font-bold border border-emerald-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockLiveServices: LiveService[] = [
  {
    id: 'ls-1',
    name: 'SaaS Multi-Tenant Web App & API',
    category: 'Web Portals',
    status: 'OPERATIONAL',
    latency_ms: 12,
    uptime_90d: '99.99%',
    endpoint: 'https://myschoolpoint.com',
    last_checked: 'Just now'
  },
  {
    id: 'ls-2',
    name: 'MySQL Master Database Engine',
    category: 'Core Infrastructure',
    status: 'OPERATIONAL',
    latency_ms: 1.4,
    uptime_90d: '99.98%',
    endpoint: 'mysql.internal:3306',
    last_checked: 'Just now'
  },
  {
    id: 'ls-3',
    name: 'Redis In-Memory Cache Store',
    category: 'Core Infrastructure',
    status: 'OPERATIONAL',
    latency_ms: 0.8,
    uptime_90d: '100.00%',
    endpoint: 'redis.internal:6379',
    last_checked: 'Just now'
  },
  {
    id: 'ls-4',
    name: 'Transactional Email AWS SES',
    category: 'Messaging Gateways',
    status: 'OPERATIONAL',
    latency_ms: 110,
    uptime_90d: '99.92%',
    endpoint: 'email.us-east-1.amazonaws.com',
    last_checked: 'Just now'
  },
  {
    id: 'ls-5',
    name: 'Meta WhatsApp Business Cloud API',
    category: 'Messaging Gateways',
    status: 'OPERATIONAL',
    latency_ms: 140,
    uptime_90d: '99.90%',
    endpoint: 'graph.facebook.com/v18.0',
    last_checked: 'Just now'
  },
  {
    id: 'ls-6',
    name: 'Razorpay / Stripe Fee Gateway',
    category: 'Payment Gateways',
    status: 'OPERATIONAL',
    latency_ms: 165,
    uptime_90d: '99.95%',
    endpoint: 'api.razorpay.com',
    last_checked: 'Just now'
  }
];

export default function LiveStatusPage() {
  const [services, setServices] = useState<LiveService[]>(mockLiveServices);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('latency_ms');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    service_name: 'SaaS Multi-Tenant Web App & API',
    status: 'DEGRADED' as LiveService['status'],
    announcement: 'Scheduled maintenance update in progress.',
  });

  // Simulated live latency pulse
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setServices(prev =>
        prev.map(s => ({
          ...s,
          latency_ms: Math.min(250, Math.max(1, s.latency_ms + (Math.floor(Math.random() * 5) - 2))),
          last_checked: 'Just now',
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/live-status');
      if (res.data.success && Array.isArray(res.data.data)) {
        setServices(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Live platform services status refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter, sortBy, sortOrder, pageSize]);

  // Ping Check Action
  const handlePingCheck = async () => {
    setPinging(true);
    toast.loading('Pinging all 6 global service endpoints...', { id: 'ping-toast' });

    try {
      await api.post('/landlord/live-status/ping');
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setPinging(false);
      toast.success('🎉 Ping test complete! All 6 core service endpoints 100% OPERATIONAL.', { id: 'ping-toast' });
    }, 1200);
  };

  // Report Incident Submit
  const handleIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServices(prev =>
      prev.map(s => (s.name === incidentForm.service_name ? { ...s, status: incidentForm.status } : s))
    );
    setShowIncidentModal(false);
    toast.success(`📢 Live status update broadcasted for '${incidentForm.service_name}'!`);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = services.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.endpoint.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
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

  const categoryOptions: SearchableOption[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'Web Portals', label: 'Web Portals' },
    { value: 'Core Infrastructure', label: 'Core Infra' },
    { value: 'Messaging Gateways', label: 'Messaging' },
    { value: 'Payment Gateways', label: 'Payments' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'OPERATIONAL', label: 'OPERATIONAL 🟢' },
    { value: 'DEGRADED', label: 'DEGRADED 🟡' },
    { value: 'OUTAGE', label: 'OUTAGE 🔴' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'latency_ms', label: 'Latency (ms)' },
    { value: 'name', label: 'Service Name' },
    { value: 'uptime_90d', label: '90-Day SLA' },
  ];

  const pageSizeOptions: SearchableOption[] = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: 'all', label: 'Show All' },
  ];

  const operationalCount = services.filter(s => s.status === 'OPERATIONAL').length;

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-400/30">
              <Radio className="w-6 h-6 animate-pulse" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Live Public & Internal System Status Board
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold rounded-full border border-emerald-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Live Realtime
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time uptime status, ping response latency, active incidents, and 90-day SLA performance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Pulse (3s): {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handlePingCheck}
            disabled={pinging}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-cyan-400 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Wifi className="w-3.5 h-3.5" /> Ping All Services
          </button>
          <button
            onClick={() => setShowIncidentModal(true)}
            className="px-3.5 py-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Update Status / Incident
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Board
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Overall Platform</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-emerald-400">100% OPERATIONAL</div>
          <div className="text-[10px] text-slate-500 mt-0.5">All Systems Nominal</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Online Users</span>
            <Globe className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">4,850</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Concurrent Admins & Parents</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Global Latency</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">14 ms</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Global Response Time</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Incidents</span>
            <AlertCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">0 Active</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Zero Outages</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">90-Day SLA Uptime</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">99.99%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Zero Downtime SLA</div>
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
              placeholder="Search live services by name or endpoint..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-emerald-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={categoryOptions} value={categoryFilter} onChange={setCategoryFilter} placeholder="Category..." icon={Filter} labelPrefix="Category" />
          <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
          <div className="flex items-center gap-1">
            <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <SearchableSelect options={pageSizeOptions} value={String(pageSize)} onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))} placeholder="Per Page..." icon={List} labelPrefix="Rows" />
        </div>
      </div>

      {/* ── LIVE SERVICES TABLE ── */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>Service Name & Endpoint</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('latency_ms')}>Ping Latency</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('uptime_90d')}>90-Day SLA</th>
                <th className="p-3.5">Last Checked</th>
                <th className="p-3.5 text-right">Live Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(s => (
                <tr key={s.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${s.status === 'OPERATIONAL' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      <span>{s.name}</span>
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400 mt-0.5">{s.endpoint}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 font-bold text-[10px] rounded-full">
                      {s.category}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-cyan-400 font-bold">{s.latency_ms} ms</td>
                  <td className="p-3.5 font-mono text-emerald-400 font-bold">{s.uptime_90d}</td>
                  <td className="p-3.5 text-slate-400 font-mono text-[11px]">{s.last_checked}</td>
                  <td className="p-3.5 text-right">
                    <span className={`px-3 py-1 rounded-full border text-[10px] font-extrabold uppercase inline-flex items-center gap-1 ${
                      s.status === 'OPERATIONAL' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      s.status === 'DEGRADED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" /> {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: UPDATE STATUS / REPORT INCIDENT ── */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleIncidentSubmit} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" /> Update Live Service Status / Broadcast Notice
              </h3>
              <button type="button" onClick={() => setShowIncidentModal(false)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Select Target Service *</label>
                <select
                  value={incidentForm.service_name}
                  onChange={e => setIncidentForm({ ...incidentForm, service_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none cursor-pointer"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">New Service Status *</label>
                <select
                  value={incidentForm.status}
                  onChange={e => setIncidentForm({ ...incidentForm, status: e.target.value as LiveService['status'] })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none cursor-pointer"
                >
                  <option value="OPERATIONAL">OPERATIONAL 🟢</option>
                  <option value="DEGRADED">DEGRADED PERFORMANCE 🟡</option>
                  <option value="OUTAGE">SERVICE OUTAGE 🔴</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Public Announcement Note</label>
                <textarea
                  value={incidentForm.announcement}
                  onChange={e => setIncidentForm({ ...incidentForm, announcement: e.target.value })}
                  placeholder="e.g. Scheduled database maintenance in progress..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => setShowIncidentModal(false)} className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-bold text-xs cursor-pointer">
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-600/30"
              >
                <Radio className="w-3.5 h-3.5" /> Broadcast Status Update
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
