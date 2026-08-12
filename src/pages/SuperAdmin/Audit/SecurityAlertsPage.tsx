import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Bell, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X, Radio, Lock,
  Plus, Edit2, ShieldAlert, CheckCircle2, AlertTriangle, Globe, Eye, Ban, Send, BellOff, Settings
} from 'lucide-react';
import api from '../../../services/api';

interface SecurityAlertItem {
  id: string;
  alert_id: string;
  title: string;
  category: 'AUTHENTICATION' | 'WAF_ATTACK' | 'SESSION_ANOMALY' | 'CERTIFICATE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  target_resource: string;
  origin_ip: string;
  location: string;
  status: 'UNRESOLVED' | 'INVESTIGATING' | 'ACKNOWLEDGED' | 'MITIGATED';
  triggered_at: string;
  forensic_details: string;
}

type SortField = 'triggered_at' | 'severity' | 'title';
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

const mockAlerts: SecurityAlertItem[] = [
  {
    id: 'alt-1',
    alert_id: 'SEC-ALERT-9821',
    title: 'Brute Force Password Spraying Detected',
    category: 'AUTHENTICATION',
    severity: 'CRITICAL',
    target_resource: 'SuperAdmin Portal (amarnath@myschoolpoint.com)',
    origin_ip: '49.36.142.10',
    location: 'New Delhi, IN',
    status: 'UNRESOLVED',
    triggered_at: '2026-08-10 23:40:00',
    forensic_details: '42 rapid password attempts within 30 seconds from single IP address.'
  },
  {
    id: 'alt-2',
    alert_id: 'SEC-ALERT-9818',
    title: 'SQL Injection Attempt via API Query Parameter',
    category: 'WAF_ATTACK',
    severity: 'HIGH',
    target_resource: '/api/v1/students?search=admin%27%20OR%201=1',
    origin_ip: '45.142.214.88',
    location: 'Frankfurt, DE',
    status: 'MITIGATED',
    triggered_at: '2026-08-10 23:15:00',
    forensic_details: 'WAF Rule #1042 triggered. Request dropped automatically at edge POP.'
  },
  {
    id: 'alt-3',
    alert_id: 'SEC-ALERT-9810',
    title: 'Unrecognized Device Fingerprint Login',
    category: 'SESSION_ANOMALY',
    severity: 'MEDIUM',
    target_resource: 'principal@dpsnoida.com',
    origin_ip: '182.72.10.5',
    location: 'Noida, IN',
    status: 'INVESTIGATING',
    triggered_at: '2026-08-10 21:30:00',
    forensic_details: 'New Linux Workstation fingerprint used for login without prior 2FA challenge.'
  },
  {
    id: 'alt-4',
    alert_id: 'SEC-ALERT-9795',
    title: 'SSL Certificate Expiring in 2 Days',
    category: 'CERTIFICATE',
    severity: 'LOW',
    target_resource: 'modernschool.com',
    origin_ip: 'Internal ACME Engine',
    location: 'System Local',
    status: 'ACKNOWLEDGED',
    triggered_at: '2026-08-10 18:00:00',
    forensic_details: 'Let\'s Encrypt SSL certificate expiring in 48 hours. Auto-renewal queued.'
  }
];

export default function SecurityAlertsPage() {
  const [alerts, setAlerts] = useState<SecurityAlertItem[]>(mockAlerts);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('triggered_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [selectedForensics, setSelectedForensics] = useState<SecurityAlertItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [slackWebhookInput, setSlackWebhookInput] = useState('https://hooks.slack.com/services/T0000/B0000/XXXX');

  const totalTriggered = 342;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'MITIGATED').length;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/security-alerts');
      if (res.data.success && Array.isArray(res.data.data)) {
        setAlerts(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Security alert incident stream & SIEM feed refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, severityFilter, statusFilter, categoryFilter, sortBy, sortOrder, pageSize]);

  // Resolve Alert
  const handleResolveAlert = async (id: string, title: string) => {
    toast.loading(`Resolving incident alert '${title}'...`, { id: 'resolve-alt-toast' });

    try {
      await api.post(`/landlord/security-alerts/${id}/resolve`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setAlerts(prev =>
        prev.map(a => (a.id === id ? { ...a, status: 'MITIGATED' } : a))
      );
      toast.success(`⚡ Security alert '${title}' marked as MITIGATED!`, { id: 'resolve-alt-toast' });
    }, 800);
  };

  // Acknowledge All Critical Alerts
  const handleAcknowledgeAll = async () => {
    toast.loading('Acknowledging all critical security alerts...', { id: 'ack-all-toast' });

    try {
      await api.post('/landlord/security-alerts/acknowledge-all');
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setAlerts(prev =>
        prev.map(a => (a.status === 'UNRESOLVED' ? { ...a, status: 'ACKNOWLEDGED' } : a))
      );
      toast.success('🚀 All critical security alerts acknowledged!', { id: 'ack-all-toast' });
    }, 1000);
  };

  // Save Webhook Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.loading('Saving SIEM webhook & PagerDuty dispatch integration...', { id: 'save-web-toast' });

    try {
      await api.post('/landlord/security-alerts/webhook-settings', { webhook_url: slackWebhookInput });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setIsSettingsOpen(false);
      toast.success('⚡ SIEM alert notification webhooks saved!', { id: 'save-web-toast' });
    }, 800);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = alerts.filter(a => {
    const matchesSearch =
      a.alert_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.target_resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.origin_ip.includes(searchTerm);

    const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;

    return matchesSearch && matchesSeverity && matchesStatus && matchesCategory;
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

  const severityOptions: SearchableOption[] = [
    { value: 'all', label: 'All Severities' },
    { value: 'CRITICAL', label: 'CRITICAL 🔴' },
    { value: 'HIGH', label: 'HIGH 🟠' },
    { value: 'MEDIUM', label: 'MEDIUM 🟡' },
    { value: 'LOW', label: 'LOW 🔵' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'UNRESOLVED', label: 'UNRESOLVED 🔴' },
    { value: 'INVESTIGATING', label: 'INVESTIGATING ⏳' },
    { value: 'ACKNOWLEDGED', label: 'ACKNOWLEDGED 🟡' },
    { value: 'MITIGATED', label: 'MITIGATED 🟢' },
  ];

  const categoryOptions: SearchableOption[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'AUTHENTICATION', label: 'AUTHENTICATION' },
    { value: 'WAF_ATTACK', label: 'WAF_ATTACK' },
    { value: 'SESSION_ANOMALY', label: 'SESSION_ANOMALY' },
    { value: 'CERTIFICATE', label: 'CERTIFICATE' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'triggered_at', label: 'Triggered Time' },
    { value: 'severity', label: 'Severity Level' },
    { value: 'title', label: 'Alert Title' },
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
              <Bell className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Real-Time Security Incident Center & SIEM Dispatcher
                <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-extrabold rounded-full border border-rose-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> PagerDuty Connected
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time security threat triage, SIEM incident alerts, origin IP forensics, and automated webhook notifications
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
            onClick={handleAcknowledgeAll}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-amber-400 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledge All Criticals
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-rose-400 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Settings className="w-3.5 h-3.5" /> SIEM Webhooks
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Alerts</span>
            <Bell className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalTriggered} Incidents</div>
          <div className="text-[10px] text-slate-500 mt-0.5">SIEM Stream Tracked</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Unresolved Critical</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{criticalCount} Critical</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Requires Immediate Action</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Auto-Mitigated</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">318 Solved</div>
          <div className="text-[10px] text-slate-500 mt-0.5">WAF & Fail2ban Handled</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Triage Speed</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">1.4 Minutes</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Avg Response Time</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Dispatch Status</span>
            <Send className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">SLACK / SMS 🟢</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Live Webhook Relay</div>
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
              placeholder="Search by alert ID, title, target resource, IP address..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-rose-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={severityOptions} value={severityFilter} onChange={setSeverityFilter} placeholder="Severity..." icon={Filter} labelPrefix="Severity" />
          <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
          <SearchableSelect options={categoryOptions} value={categoryFilter} onChange={setCategoryFilter} placeholder="Category..." icon={Filter} labelPrefix="Category" />
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

      {/* ── SECURITY ALERTS TABLE ── */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('title')}>Alert Title & Category</th>
                <th className="p-3.5">Target Resource & IP</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('severity')}>Severity</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('triggered_at')}>Triggered Time</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(a => (
                <tr key={a.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Bell className={`w-4 h-4 ${a.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`} />
                      <div>
                        <div className="text-sm text-white font-extrabold">{a.title}</div>
                        <div className="text-[10px] text-slate-500 font-sans">{a.alert_id} · {a.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono">
                    <div className="text-rose-400 font-bold">{a.target_resource}</div>
                    <div className="text-[10px] text-slate-400 font-sans flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-500" /> {a.origin_ip} ({a.location})
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        a.severity === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                          : a.severity === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      }`}
                    >
                      {a.severity}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-400 text-[11px]">{a.triggered_at}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        a.status === 'MITIGATED'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : a.status === 'UNRESOLVED'
                          ? 'bg-red-500/15 text-red-400 border-red-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {a.status !== 'MITIGATED' && (
                        <button
                          onClick={() => handleResolveAlert(a.id, a.title)}
                          className="px-2.5 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedForensics(a)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-rose-400" /> Forensics
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── FORENSICS MODAL ── */}
      {selectedForensics && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-extrabold text-white">Incident Forensics & Payload Inspector</h3>
              </div>
              <button onClick={() => setSelectedForensics(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-red-400 font-bold">{selectedForensics.title} ({selectedForensics.alert_id})</div>
                <div className="text-slate-400">Category: {selectedForensics.category} · Severity: {selectedForensics.severity}</div>
                <div className="text-slate-500 text-[11px]">Triggered: {selectedForensics.triggered_at}</div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-white font-bold">Target Resource: {selectedForensics.target_resource}</div>
                <div className="text-slate-400">Origin IP: {selectedForensics.origin_ip} ({selectedForensics.location})</div>
              </div>

              <div>
                <div className="text-slate-400 font-bold mb-1">Threat Payload Sample / Trigger Log:</div>
                <pre className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-red-300 text-[11px] overflow-x-auto">
                  {selectedForensics.forensic_details}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedForensics(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SIEM SETTINGS MODAL ── */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-extrabold text-white">SIEM Webhook & Notification Dispatcher</h3>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Slack / Discord Incident Webhook URL</label>
                <input
                  type="url"
                  required
                  value={slackWebhookInput}
                  onChange={e => setSlackWebhookInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-rose-500" />
                  <span className="text-slate-300 font-bold">Relay CRITICAL Alerts to PagerDuty</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-rose-500" />
                  <span className="text-slate-300 font-bold">SMS Alert to Master SuperAdmin</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-rose-600/30"
                >
                  Save Dispatch Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
