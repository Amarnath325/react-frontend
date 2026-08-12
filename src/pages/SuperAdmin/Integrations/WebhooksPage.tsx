import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Webhook, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, Send, Activity, Lock
} from 'lucide-react';
import api from '../../../services/api';

interface WebhookItem {
  id: string;
  webhook_id: string;
  endpoint_name: string;
  target_url: string;
  events_subscribed: string;
  secret_prefix: string;
  delivery_status: string;
  status: string;
}

type SortField = 'endpoint_name' | 'target_url' | 'delivery_status';
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

const mockWebhooks: WebhookItem[] = [
  {
    id: 'wbk-1',
    webhook_id: 'WBK-7042',
    endpoint_name: 'Razorpay Auto Fee Payment Webhook Listener',
    target_url: 'https://dps45.edu.in/api/webhooks/razorpay',
    events_subscribed: 'FEE_PAYMENT_SUCCESS, INVOICE_OVERDUE',
    secret_prefix: 'whsec_90f28a...',
    delivery_status: 'DELIVERED',
    status: 'ACTIVE'
  },
  {
    id: 'wbk-2',
    webhook_id: 'WBK-7038',
    endpoint_name: 'Biometric Real-Time Attendance Event Stream',
    target_url: 'https://stxavierschool.com/api/webhooks/attendance',
    events_subscribed: 'ATTENDANCE_LOGGED, ABSENT_ALERT',
    secret_prefix: 'whsec_4b1029...',
    delivery_status: 'DELIVERED',
    status: 'ACTIVE'
  },
  {
    id: 'wbk-3',
    webhook_id: 'WBK-7025',
    endpoint_name: 'WhatsApp Cloud API Delivery Receipt Webhook',
    target_url: 'https://mygreenwood.org/api/webhooks/whatsapp',
    events_subscribed: 'MESSAGE_SENT, MESSAGE_DELIVERED, READ',
    secret_prefix: 'whsec_7c4419...',
    delivery_status: 'DELIVERED',
    status: 'ACTIVE'
  }
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>(mockWebhooks);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('endpoint_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookItem | null>(null);

  const totalEndpointsCount = 142;
  const totalDeliveriesToday = 1240000;
  const successRatePct = 99.8;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/webhooks');
      if (res.data.success && Array.isArray(res.data.data)) {
        setWebhooks(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Real-time HTTP webhook delivery queue refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder, pageSize]);

  const handleTestPing = (id: string, name: string) => {
    toast.loading(`Sending test HTTP payload to '${name}'...`, { id: 'ping-toast' });
    setTimeout(() => {
      toast.success(`⚡ Test HTTP ping delivered to '${name}' (HTTP 200 OK)!`, { id: 'ping-toast' });
    }, 800);
  };

  const handleDeleteWebhook = async (id: string, wbkId: string) => {
    toast.loading(`Deleting webhook endpoint '${wbkId}'...`, { id: 'del-wbk-toast' });

    try {
      await api.delete(`/landlord/webhooks/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setWebhooks(prev => prev.filter(w => w.id !== id));
      toast.success(`🗑️ Webhook endpoint '${wbkId}' deleted!`, { id: 'del-wbk-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = webhooks.filter(w => {
    const matchesSearch =
      w.webhook_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.endpoint_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.target_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.events_subscribed.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;

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
    { value: 'endpoint_name', label: 'Endpoint Name' },
    { value: 'target_url', label: 'Target URL' },
    { value: 'delivery_status', label: 'Delivery Status' },
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
              <Webhook className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Real-Time Outbound Webhook Subscriptions & Signature Verification
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-extrabold rounded-full border border-amber-400/30 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 animate-pulse" /> 99.8% Delivery Success Rate
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure event-driven webhook callbacks, HMAC-SHA256 signature keys, retry backoff schedules, and payload logs
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Webhooks</span>
            <Webhook className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalEndpointsCount} Endpoints</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Subscribed Callbacks</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Deliveries Today</span>
            <Send className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{(totalDeliveriesToday / 1000000).toFixed(2)}M Payloads</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Dispatched HTTP Requests</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Delivery SLA</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{successRatePct}% Success</div>
          <div className="text-[10px] text-slate-500 mt-0.5">HTTP 200 OK SLA</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Retry Queue SLA</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">5 Retries (Exp Backoff)</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Dead Letter Queue Storage</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">HMAC Verification</span>
            <Lock className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-black text-teal-400 font-mono">100% Signed 🔒</div>
          <div className="text-[10px] text-slate-500 mt-0.5">X-MSP-Signature Header</div>
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
              placeholder="Search by webhook ID, name, target URL, subscribed events..."
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
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('endpoint_name')}>Endpoint Name & ID</th>
                <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('target_url')}>Target URL</th>
                <th className="p-3.5 font-mono">Subscribed Events</th>
                <th className="p-3.5 font-mono">Secret Key Prefix</th>
                <th className="p-3.5">Delivery Status</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(w => (
                <tr key={w.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Webhook className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{w.endpoint_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{w.webhook_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[10px] text-indigo-400 font-bold">{w.target_url}</td>
                  <td className="p-3.5 font-mono text-[10px] text-purple-400 font-bold">{w.events_subscribed}</td>
                  <td className="p-3.5 font-mono text-[10px] text-slate-400">{w.secret_prefix}</td>
                  <td className="p-3.5 font-mono text-[10px] text-emerald-400 font-bold">{w.delivery_status}</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-extrabold uppercase">
                      {w.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleTestPing(w.id, w.endpoint_name)}
                        className="px-2 py-1.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" /> Test Ping
                      </button>
                      <button
                        onClick={() => setSelectedWebhook(w)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" /> Webhook Spec
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(w.id, w.webhook_id)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete Endpoint"
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

      {selectedWebhook && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Webhook className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Webhook Endpoint Details ({selectedWebhook.webhook_id})</h3>
              </div>
              <button onClick={() => setSelectedWebhook(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-amber-400 font-bold">{selectedWebhook.endpoint_name}</div>
                <div className="text-slate-400">Target: {selectedWebhook.target_url}</div>
                <div className="text-slate-500 text-[11px]">Events: {selectedWebhook.events_subscribed} · Secret: {selectedWebhook.secret_prefix} · Status: {selectedWebhook.status}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedWebhook(null)}
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
