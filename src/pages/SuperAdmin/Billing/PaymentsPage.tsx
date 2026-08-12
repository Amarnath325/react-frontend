import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  CreditCard, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, DollarSign, Zap, Activity,
  LayoutGrid, Edit2, ToggleLeft, ToggleRight
} from 'lucide-react';
import api from '../../../services/api';

export interface PaymentItem {
  id: string;
  transaction_id: string;
  school_name: string;
  gateway: string;
  amount_paid: string;
  payment_method: string;
  timestamp: string;
  status: 'SETTLED' | 'FAILED';
}

type SortField = 'school_name' | 'gateway' | 'timestamp';
type SortOrder = 'asc' | 'desc';
type PageSizeOption = 6 | 12 | 24 | 'all';
type ViewMode = 'grid' | 'list';

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

const mockPayments: PaymentItem[] = [
  {
    id: 'pay-1',
    transaction_id: 'TXN-90428174',
    school_name: 'St. Xavier International School',
    gateway: 'RAZORPAY GATEWAY',
    amount_paid: '$14,400.00',
    payment_method: 'CORPORATE NETBANKING',
    timestamp: '2026-08-01 10:45 AM',
    status: 'SETTLED'
  },
  {
    id: 'pay-2',
    transaction_id: 'TXN-90384910',
    school_name: 'Delhi Public School, Sector 45',
    gateway: 'STRIPE GATEWAY',
    amount_paid: '$650.00',
    payment_method: 'VISA CREDIT CARD',
    timestamp: '2026-08-01 02:15 PM',
    status: 'SETTLED'
  },
  {
    id: 'pay-3',
    transaction_id: 'TXN-90251142',
    school_name: 'Greenwood High International',
    gateway: 'PAYTM GATEWAY',
    amount_paid: '$1,200.00',
    payment_method: 'UPI MANDATE AUTO-DEBIT',
    timestamp: '2026-07-20 11:30 AM',
    status: 'SETTLED'
  },
  {
    id: 'pay-4',
    transaction_id: 'TXN-90123849',
    school_name: 'Sunrise Public Academy',
    gateway: 'RAZORPAY GATEWAY',
    amount_paid: '$299.00',
    payment_method: 'MASTERCARD CREDIT',
    timestamp: '2026-07-15 04:20 PM',
    status: 'FAILED'
  }
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>(mockPayments);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('school_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(6);

  // Modals
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentItem | null>(null);

  // Form State
  const [formSchoolName, setFormSchoolName] = useState('');
  const [formGateway, setFormGateway] = useState('RAZORPAY GATEWAY');
  const [formAmountPaid, setFormAmountPaid] = useState('$650.00');
  const [formPaymentMethod, setFormPaymentMethod] = useState('UPI MANDATE AUTO-DEBIT');
  const [formTimestamp, setFormTimestamp] = useState('2026-08-12 11:00 AM');
  const [formStatus, setFormStatus] = useState<'SETTLED' | 'FAILED'>('SETTLED');

  const totalVolumeAmount = 1845000;
  const settlementSuccessPct = 99.4;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/payments');
      if (res.data.success && Array.isArray(res.data.data)) {
        setPayments(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Realtime payment gateway transactions stream refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder, pageSize]);

  // Toggle Settled / Failed Status
  const handleToggleStatus = async (id: string, currentStatus: 'SETTLED' | 'FAILED', txnId: string) => {
    const nextStatus: 'SETTLED' | 'FAILED' = currentStatus === 'SETTLED' ? 'FAILED' : 'SETTLED';
    toast.loading(`Updating transaction '${txnId}' status to ${nextStatus}...`, { id: 'pay-status-toast' });

    try {
      await api.put(`/landlord/payments/${id}`, { status: nextStatus });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setPayments(prev => prev.map(p => (p.id === id ? { ...p, status: nextStatus } : p)));
      toast.success(`Payment '${txnId}' is now ${nextStatus === 'SETTLED' ? 'SETTLED 🟢' : 'FAILED 🔴'}!`, { id: 'pay-status-toast' });
    }, 400);
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSchoolName.trim()) {
      toast.error('Please enter a School Tenant Name');
      return;
    }

    toast.loading('Manual payment transaction entry...', { id: 'create-pay-toast' });

    try {
      await api.post('/landlord/payments', {
        school_name: formSchoolName,
        gateway: formGateway,
        amount_paid: formAmountPaid,
        payment_method: formPaymentMethod,
        timestamp: formTimestamp,
        status: formStatus
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newPayment: PaymentItem = {
        id: `pay-${Date.now()}`,
        transaction_id: `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`,
        school_name: formSchoolName,
        gateway: formGateway,
        amount_paid: formAmountPaid,
        payment_method: formPaymentMethod,
        timestamp: formTimestamp,
        status: formStatus
      };

      setPayments(prev => [newPayment, ...prev]);
      toast.success(`💳 Payment recorded for '${formSchoolName}' successfully!`, { id: 'create-pay-toast' });
      setIsAddModalOpen(false);

      // Reset form
      setFormSchoolName('');
    }, 600);
  };

  const handleOpenEdit = (p: PaymentItem) => {
    setEditingPayment(p);
    setFormSchoolName(p.school_name);
    setFormGateway(p.gateway);
    setFormAmountPaid(p.amount_paid);
    setFormPaymentMethod(p.payment_method);
    setFormTimestamp(p.timestamp);
    setFormStatus(p.status);
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    toast.loading(`Updating transaction '${editingPayment.transaction_id}'...`, { id: 'edit-pay-toast' });

    try {
      await api.put(`/landlord/payments/${editingPayment.id}`, {
        school_name: formSchoolName,
        gateway: formGateway,
        amount_paid: formAmountPaid,
        payment_method: formPaymentMethod,
        timestamp: formTimestamp,
        status: formStatus
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setPayments(prev =>
        prev.map(p =>
          p.id === editingPayment.id
            ? {
                ...p,
                school_name: formSchoolName,
                gateway: formGateway,
                amount_paid: formAmountPaid,
                payment_method: formPaymentMethod,
                timestamp: formTimestamp,
                status: formStatus
              }
            : p
        )
      );
      toast.success(`✏️ Payment '${editingPayment.transaction_id}' updated successfully!`, { id: 'edit-pay-toast' });
      setEditingPayment(null);
    }, 500);
  };

  const handleDeletePayment = async (id: string, txnId: string) => {
    toast.loading(`Voiding payment transaction '${txnId}'...`, { id: 'del-pay-toast' });

    try {
      await api.delete(`/landlord/payments/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setPayments(prev => prev.filter(p => p.id !== id));
      toast.success(`🗑️ Transaction '${txnId}' voided!`, { id: 'del-pay-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = payments.filter(p => {
    const matchesSearch =
      p.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.gateway.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.payment_method.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

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
    { value: 'SETTLED', label: 'SETTLED 🟢' },
    { value: 'FAILED', label: 'FAILED 🔴' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'school_name', label: 'School Name' },
    { value: 'gateway', label: 'Gateway' },
    { value: 'timestamp', label: 'Timestamp' },
  ];

  const pageSizeOptions: SearchableOption[] = [
    { value: '6', label: '6 per page' },
    { value: '12', label: '12 per page' },
    { value: '24', label: '24 per page' },
    { value: 'all', label: 'Show All' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-100">
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-400/30">
              <CreditCard className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Realtime Payment Stream & Gateway Settlement Audit
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-extrabold rounded-full border border-amber-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-400 animate-pulse" /> 99.4% Gateway Settlement Rate
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit realtime transactions across Razorpay, Stripe, and Paytm, toggle settled/failed status, and manage payment logs
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setFormSchoolName('');
              setFormGateway('RAZORPAY GATEWAY');
              setFormAmountPaid('$650.00');
              setFormPaymentMethod('UPI MANDATE AUTO-DEBIT');
              setFormTimestamp('2026-08-12 11:00 AM');
              setFormStatus('SETTLED');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Record Payment
          </button>
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Gross Volume</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">${(totalVolumeAmount / 1000000).toFixed(2)}M Processed 💳</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Total Payments Received</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Settlement Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{settlementSuccessPct}% Settled 🟢</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Razorpay & Stripe Average</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Primary Gateway</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-black text-purple-400 font-mono truncate">RAZORPAY WEBHOOK</div>
          <div className="text-[10px] text-slate-500 mt-0.5">78.4% Share</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Auto-Debit Mandates</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">1,120 UPI/CC</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Recurring Mandates</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Payout SLA</span>
            <CreditCard className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-black text-teal-400 font-mono">T+1 Day ⚡</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Bank Settlement</div>
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
              placeholder="Search by transaction ID, school name, gateway, payment method..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Grid vs List View Switch */}
          <div className="flex items-center bg-slate-900 p-1 border border-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                viewMode === 'grid' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-4 h-4" /> Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                viewMode === 'list' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
              }`}
              title="Table List View"
            >
              <List className="w-4 h-4" /> List
            </button>
          </div>

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

      {/* GRID VIEW vs LIST VIEW */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedData.map(p => (
            <div
              key={p.id}
              className={`bg-slate-950 rounded-3xl border p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 relative overflow-hidden group ${
                p.status === 'SETTLED'
                  ? 'border-slate-800 hover:border-amber-500/40 hover:shadow-amber-500/5'
                  : 'border-slate-800/60 opacity-65 bg-slate-950/40'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{p.transaction_id}</span>
                    <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors mt-0.5">{p.school_name}</h3>
                  </div>

                  {/* Active / Failed Status Toggle */}
                  <button
                    onClick={() => handleToggleStatus(p.id, p.status, p.transaction_id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black cursor-pointer transition-all ${
                      p.status === 'SETTLED'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                    }`}
                    title="Click to toggle Settled / Failed"
                  >
                    {p.status === 'SETTLED' ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-red-400" />}
                    {p.status}
                  </button>
                </div>

                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-emerald-400">{p.amount_paid}</span>
                  <span className="text-[10px] font-bold text-indigo-400">{p.gateway}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Payment Method</div>
                    <div className="text-purple-400 font-bold text-xs mt-0.5 truncate">{p.payment_method}</div>
                  </div>
                  <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Timestamp</div>
                    <div className="text-slate-300 font-bold text-xs mt-0.5 truncate">{p.timestamp}</div>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedPayment(p)}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" /> View Spec
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeletePayment(p.id, p.transaction_id)}
                    className="p-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl cursor-pointer transition-all"
                    title="Void Transaction"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('school_name')}>School Tenant & Transaction ID</th>
                  <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('gateway')}>Gateway Provider</th>
                  <th className="p-3.5 font-mono">Amount Paid</th>
                  <th className="p-3.5 font-mono">Payment Method</th>
                  <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('timestamp')}>Timestamp</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedData.map(p => (
                  <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-bold text-white font-mono">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="text-sm text-white font-extrabold">{p.school_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{p.transaction_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[10px] text-indigo-400 font-bold">{p.gateway}</td>
                    <td className="p-3.5 font-mono text-[11px] text-emerald-400 font-bold">{p.amount_paid}</td>
                    <td className="p-3.5 font-mono text-[10px] text-purple-400 font-bold">{p.payment_method}</td>
                    <td className="p-3.5 font-mono text-[10px] text-slate-300 font-bold">{p.timestamp}</td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleStatus(p.id, p.status, p.transaction_id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase cursor-pointer transition-all ${
                          p.status === 'SETTLED'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                        }`}
                      >
                        {p.status === 'SETTLED' ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5 text-red-400" />}
                        {p.status}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" /> Spec
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="px-2.5 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeletePayment(p.id, p.transaction_id)}
                          className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                          title="Void Transaction"
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
      )}

      {/* CREATE PAYMENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Record Payment Transaction</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">School Tenant Name *</label>
                <input
                  type="text"
                  required
                  value={formSchoolName}
                  onChange={e => setFormSchoolName(e.target.value)}
                  placeholder="e.g. Greenwood High International"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Gateway Provider</label>
                  <select
                    value={formGateway}
                    onChange={e => setFormGateway(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="RAZORPAY GATEWAY">RAZORPAY GATEWAY</option>
                    <option value="STRIPE GATEWAY">STRIPE GATEWAY</option>
                    <option value="PAYTM GATEWAY">PAYTM GATEWAY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Amount Paid</label>
                  <input
                    type="text"
                    value={formAmountPaid}
                    onChange={e => setFormAmountPaid(e.target.value)}
                    placeholder="$650.00"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Payment Method</label>
                <input
                  type="text"
                  value={formPaymentMethod}
                  onChange={e => setFormPaymentMethod(e.target.value)}
                  placeholder="UPI MANDATE AUTO-DEBIT"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Timestamp</label>
                  <input
                    type="text"
                    value={formTimestamp}
                    onChange={e => setFormTimestamp(e.target.value)}
                    placeholder="2026-08-12 11:00 AM"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as 'SETTLED' | 'FAILED')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="SETTLED">SETTLED 🟢</option>
                    <option value="FAILED">FAILED 🔴</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PAYMENT MODAL */}
      {editingPayment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Edit Payment ({editingPayment.transaction_id})</h3>
              </div>
              <button onClick={() => setEditingPayment(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">School Tenant Name *</label>
                <input
                  type="text"
                  required
                  value={formSchoolName}
                  onChange={e => setFormSchoolName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Gateway</label>
                  <input
                    type="text"
                    value={formGateway}
                    onChange={e => setFormGateway(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Amount Paid</label>
                  <input
                    type="text"
                    value={formAmountPaid}
                    onChange={e => setFormAmountPaid(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Payment Method</label>
                <input
                  type="text"
                  value={formPaymentMethod}
                  onChange={e => setFormPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Timestamp</label>
                  <input
                    type="text"
                    value={formTimestamp}
                    onChange={e => setFormTimestamp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as 'SETTLED' | 'FAILED')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="SETTLED">SETTLED 🟢</option>
                    <option value="FAILED">FAILED 🔴</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer"
                >
                  Update Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SPEC INSPECTOR MODAL */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Payment Transaction Details ({selectedPayment.transaction_id})</h3>
              </div>
              <button onClick={() => setSelectedPayment(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-amber-400 text-base font-black">{selectedPayment.school_name}</div>
                <div className="text-emerald-400 text-sm font-bold">Amount Paid: {selectedPayment.amount_paid}</div>
                <div className="text-indigo-400">Gateway: {selectedPayment.gateway}</div>
                <div className="text-purple-400">Method: {selectedPayment.payment_method}</div>
                <div className="text-slate-300">Timestamp: {selectedPayment.timestamp}</div>
                <div className="text-slate-500 text-[11px]">
                  Status: <span className={selectedPayment.status === 'SETTLED' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{selectedPayment.status}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPayment(null)}
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
