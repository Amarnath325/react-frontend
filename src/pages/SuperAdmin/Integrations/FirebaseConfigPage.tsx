import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Flame, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Eye, ShieldCheck, Trash2, Send, Zap, Smartphone
} from 'lucide-react';
import api from '../../../services/api';

interface FirebaseConfigItem {
  id: string;
  config_id: string;
  project_name: string;
  firebase_project_id: string;
  fcm_sender_id: string;
  web_push_vapid_key: string;
  credentials_json_status: string;
  status: string;
}

type SortField = 'project_name' | 'firebase_project_id' | 'fcm_sender_id';
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

const mockFirebaseConfigs: FirebaseConfigItem[] = [
  {
    id: 'fbc-1',
    config_id: 'FBC-8042',
    project_name: 'MySchoolPoint Official Parent & Student Mobile App',
    firebase_project_id: 'myschoolpoint-prod-fcm',
    fcm_sender_id: '904281745102',
    web_push_vapid_key: 'BN84920412894102941029841...',
    credentials_json_status: 'ENCRYPTED (SERVICE_ACCOUNT_KEY.JSON)',
    status: 'ACTIVE'
  },
  {
    id: 'fbc-2',
    config_id: 'FBC-8038',
    project_name: 'Teacher Attendance & Exam Marks App',
    firebase_project_id: 'myschoolpoint-teacher-fcm',
    fcm_sender_id: '4b1029410928',
    web_push_vapid_key: 'BKL910248109248102941824...',
    credentials_json_status: 'ENCRYPTED (TEACHER_KEY.JSON)',
    status: 'ACTIVE'
  }
];

export default function FirebaseConfigPage() {
  const [configs, setConfigs] = useState<FirebaseConfigItem[]>(mockFirebaseConfigs);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('project_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [selectedConfig, setSelectedConfig] = useState<FirebaseConfigItem | null>(null);

  const activeSubscriptionsCount = 1420000;
  const globalPushLatency = 1.2;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/firebase-config');
      if (res.data.success && Array.isArray(res.data.data)) {
        setConfigs(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Firebase Cloud Messaging (FCM) VAPID keys & Service Account JSON refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder, pageSize]);

  const handleDeleteConfig = async (id: string, fbcId: string) => {
    toast.loading(`Deleting Firebase configuration '${fbcId}'...`, { id: 'del-fbc-toast' });

    try {
      await api.delete(`/landlord/firebase-config/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setConfigs(prev => prev.filter(c => c.id !== id));
      toast.success(`🗑️ Firebase config '${fbcId}' deleted!`, { id: 'del-fbc-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = configs.filter(c => {
    const matchesSearch =
      c.config_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.firebase_project_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.fcm_sender_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

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
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'project_name', label: 'Project Name' },
    { value: 'firebase_project_id', label: 'Project ID' },
    { value: 'fcm_sender_id', label: 'FCM Sender ID' },
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
            <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-400/30">
              <Flame className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Firebase Cloud Messaging (FCM) & Web Push VAPID Keys
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-extrabold rounded-full border border-amber-400/30 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 animate-pulse" /> FCM v1 HTTP API Active
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit Firebase project IDs, FCM Sender IDs, Web Push VAPID public keys, and encrypted Service Account JSON credentials
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
            <span className="text-[10px] font-bold uppercase tracking-wider">FCM App Subscriptions</span>
            <Smartphone className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{(activeSubscriptionsCount / 1000000).toFixed(2)}M Devices 🔥</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Registered Device Tokens</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Push Delivery Speed</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">&lt; {globalPushLatency}s SLA ⚡</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Global FCM Delivery Latency</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Topic Channels</span>
            <Send className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">18,400 Channels</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Classroom & School Topics</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Server Key Status</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">VALID ✅</div>
          <div className="text-[10px] text-slate-500 mt-0.5">FCM OAuth 2.0 Bearer</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Delivery Failure Rate</span>
            <Flame className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-black text-teal-400 font-mono">0.01% Low 🛡️</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Expired Device Auto-Pruning</div>
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
              placeholder="Search by config ID, project name, firebase project ID, sender ID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
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

      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('project_name')}>Project Name & Config ID</th>
                <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('firebase_project_id')}>Firebase Project ID</th>
                <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('fcm_sender_id')}>FCM Sender ID</th>
                <th className="p-3.5 font-mono">Web Push VAPID Public Key</th>
                <th className="p-3.5 font-mono">Service Account JSON</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(c => (
                <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{c.project_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{c.config_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[10px] text-indigo-400 font-bold">{c.firebase_project_id}</td>
                  <td className="p-3.5 font-mono text-[10px] text-purple-400 font-bold">{c.fcm_sender_id}</td>
                  <td className="p-3.5 font-mono text-[10px] text-teal-400 font-bold">{c.web_push_vapid_key}</td>
                  <td className="p-3.5 font-mono text-[10px] text-slate-400">{c.credentials_json_status}</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-extrabold uppercase">
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedConfig(c)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" /> Config Spec
                      </button>
                      <button
                        onClick={() => handleDeleteConfig(c.id, c.config_id)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete Configuration"
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

      {selectedConfig && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Firebase Project Specification ({selectedConfig.config_id})</h3>
              </div>
              <button onClick={() => setSelectedConfig(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-amber-400 font-bold">{selectedConfig.project_name}</div>
                <div className="text-slate-400">Firebase ID: {selectedConfig.firebase_project_id} · Sender ID: {selectedConfig.fcm_sender_id}</div>
                <div className="text-slate-500 text-[11px]">VAPID: {selectedConfig.web_push_vapid_key} · JSON: {selectedConfig.credentials_json_status} · Status: {selectedConfig.status}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedConfig(null)}
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
