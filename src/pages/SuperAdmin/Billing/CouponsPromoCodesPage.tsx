import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Tag, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, DollarSign, Zap, Gift,
  LayoutGrid, Edit2, ToggleLeft, ToggleRight
} from 'lucide-react';
import api from '../../../services/api';

export interface CouponItem {
  id: string;
  coupon_id: string;
  promo_code: string;
  discount_type: string;
  usage_limit: string;
  redeemed_count: string;
  expiry_date: string;
  status: 'ACTIVE' | 'EXPIRED';
}

type SortField = 'promo_code' | 'discount_type' | 'expiry_date';
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

const mockCoupons: CouponItem[] = [
  {
    id: 'cpn-1',
    coupon_id: 'CPN-4042',
    promo_code: 'BACK2SCHOOL30',
    discount_type: '30% PERCENTAGE OFF',
    usage_limit: '100 Redemptions',
    redeemed_count: '68 / 100 Redeemed',
    expiry_date: '2026-09-30',
    status: 'ACTIVE'
  },
  {
    id: 'cpn-2',
    coupon_id: 'CPN-4038',
    promo_code: 'ANNUALLAUNCH20',
    discount_type: '20% OFF ANNUAL BILLING',
    usage_limit: '500 Redemptions',
    redeemed_count: '342 / 500 Redeemed',
    expiry_date: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    id: 'cpn-3',
    coupon_id: 'CPN-4025',
    promo_code: 'CBSECOMPLIANT100',
    discount_type: '$100 FLAT DISCOUNT',
    usage_limit: '50 Redemptions',
    redeemed_count: '18 / 50 Redeemed',
    expiry_date: '2026-10-15',
    status: 'ACTIVE'
  },
  {
    id: 'cpn-4',
    coupon_id: 'CPN-4012',
    promo_code: 'SUMMERDISCOUNT50',
    discount_type: '50% SPECIAL PROMO',
    usage_limit: '20 Redemptions',
    redeemed_count: '20 / 20 Redeemed',
    expiry_date: '2026-06-30',
    status: 'EXPIRED'
  }
];

export default function CouponsPromoCodesPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>(mockCoupons);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('promo_code');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(6);

  // Modals
  const [selectedCoupon, setSelectedCoupon] = useState<CouponItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);

  // Form State
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newDiscountType, setNewDiscountType] = useState('20% PERCENTAGE OFF');
  const [newUsageLimit, setNewUsageLimit] = useState('100 Redemptions');
  const [newExpiryDate, setNewExpiryDate] = useState('2026-12-31');
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'EXPIRED'>('ACTIVE');

  const activeCouponsCount = 14;
  const totalDiscountSaved = 42500;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/coupons-promo-codes');
      if (res.data.success && Array.isArray(res.data.data)) {
        setCoupons(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Coupons, promo codes, and discount campaigns refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder, pageSize]);

  // Toggle Active / Expired
  const handleToggleStatus = async (id: string, currentStatus: 'ACTIVE' | 'EXPIRED', promoCode: string) => {
    const nextStatus: 'ACTIVE' | 'EXPIRED' = currentStatus === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE';
    toast.loading(`Updating '${promoCode}' status to ${nextStatus}...`, { id: 'cpn-status-toast' });

    try {
      await api.put(`/landlord/coupons-promo-codes/${id}`, { status: nextStatus });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setCoupons(prev => prev.map(c => (c.id === id ? { ...c, status: nextStatus } : c)));
      toast.success(`Coupon '${promoCode}' is now ${nextStatus === 'ACTIVE' ? 'ACTIVE 🟢' : 'EXPIRED 🔴'}!`, { id: 'cpn-status-toast' });
    }, 400);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim()) {
      toast.error('Please enter a Promo Code');
      return;
    }

    toast.loading('Creating promo code discount campaign...', { id: 'create-cpn-toast' });

    try {
      await api.post('/landlord/coupons-promo-codes', {
        promo_code: newPromoCode,
        discount_type: newDiscountType,
        usage_limit: newUsageLimit,
        expiry_date: newExpiryDate,
        status: newStatus
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const createdItem: CouponItem = {
        id: `cpn-${Date.now()}`,
        coupon_id: `CPN-${Math.floor(1000 + Math.random() * 9000)}`,
        promo_code: newPromoCode.toUpperCase(),
        discount_type: newDiscountType,
        usage_limit: newUsageLimit,
        redeemed_count: '0 Redeemed',
        expiry_date: newExpiryDate,
        status: newStatus
      };

      setCoupons(prev => [createdItem, ...prev]);
      toast.success(`🎟️ Promo Code '${newPromoCode.toUpperCase()}' created successfully!`, { id: 'create-cpn-toast' });
      setIsAddModalOpen(false);

      // Reset form
      setNewPromoCode('');
    }, 600);
  };

  const handleOpenEdit = (c: CouponItem) => {
    setEditingCoupon(c);
    setNewPromoCode(c.promo_code);
    setNewDiscountType(c.discount_type);
    setNewUsageLimit(c.usage_limit);
    setNewExpiryDate(c.expiry_date);
    setNewStatus(c.status);
  };

  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;

    toast.loading(`Updating promo code '${editingCoupon.promo_code}'...`, { id: 'edit-cpn-toast' });

    try {
      await api.put(`/landlord/coupons-promo-codes/${editingCoupon.id}`, {
        promo_code: newPromoCode,
        discount_type: newDiscountType,
        usage_limit: newUsageLimit,
        expiry_date: newExpiryDate,
        status: newStatus
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setCoupons(prev =>
        prev.map(c =>
          c.id === editingCoupon.id
            ? {
                ...c,
                promo_code: newPromoCode.toUpperCase(),
                discount_type: newDiscountType,
                usage_limit: newUsageLimit,
                expiry_date: newExpiryDate,
                status: newStatus
              }
            : c
        )
      );
      toast.success(`✏️ Promo code '${newPromoCode.toUpperCase()}' updated successfully!`, { id: 'edit-cpn-toast' });
      setEditingCoupon(null);
    }, 500);
  };

  const handleDeleteCoupon = async (id: string, cpnId: string) => {
    toast.loading(`Disabling promo code '${cpnId}'...`, { id: 'del-cpn-toast' });

    try {
      await api.delete(`/landlord/coupons-promo-codes/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast.success(`🗑️ Promo Code '${cpnId}' disabled!`, { id: 'del-cpn-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = coupons.filter(c => {
    const matchesSearch =
      c.coupon_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.promo_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.discount_type.toLowerCase().includes(searchTerm.toLowerCase());

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
    { value: 'EXPIRED', label: 'EXPIRED 🔴' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'promo_code', label: 'Promo Code' },
    { value: 'discount_type', label: 'Discount Type' },
    { value: 'expiry_date', label: 'Expiry Date' },
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
              <Tag className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Promotional Coupons, Discount Codes & Campaign Rules
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-extrabold rounded-full border border-amber-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Gift className="w-3 h-3 text-emerald-400 animate-pulse" /> 14 Active Campaigns
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate promotional discount vouchers, set percentage or flat dollar off rules, active/expired toggles, and track redemptions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setNewPromoCode('');
              setNewDiscountType('20% PERCENTAGE OFF');
              setNewUsageLimit('100 Redemptions');
              setNewExpiryDate('2026-12-31');
              setNewStatus('ACTIVE');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Create Promo Code
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Campaigns</span>
            <Tag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{activeCouponsCount} Coupons 🎟️</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active Promo Rules</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Saved</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">${(totalDiscountSaved / 1000).toFixed(1)}K Discount</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Value Given to Schools</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Max Discount</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">30% Off Max</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Back2School Promo</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Validation SLA</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">Instant Check ⚡</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Checkout Validation</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Top Coupon</span>
            <Gift className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-sm font-black text-teal-400 font-mono truncate">BACK2SCHOOL30</div>
          <div className="text-[10px] text-slate-500 mt-0.5">68 Redemptions</div>
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
              placeholder="Search by coupon ID, promo code, discount type..."
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
          {paginatedData.map(c => (
            <div
              key={c.id}
              className={`bg-slate-950 rounded-3xl border p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 relative overflow-hidden group ${
                c.status === 'ACTIVE'
                  ? 'border-slate-800 hover:border-amber-500/40 hover:shadow-amber-500/5'
                  : 'border-slate-800/60 opacity-65 bg-slate-950/40'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{c.coupon_id}</span>
                    <h3 className="text-lg font-black text-amber-400 font-mono tracking-wider group-hover:text-amber-300 transition-colors mt-0.5">{c.promo_code}</h3>
                  </div>

                  {/* Active / Expired Status Toggle */}
                  <button
                    onClick={() => handleToggleStatus(c.id, c.status, c.promo_code)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black cursor-pointer transition-all ${
                      c.status === 'ACTIVE'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                    }`}
                    title="Click to toggle Active / Expired"
                  >
                    {c.status === 'ACTIVE' ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-red-400" />}
                    {c.status}
                  </button>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between font-mono">
                  <span className="text-xs text-indigo-300 font-bold">{c.discount_type}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Usage Limit</div>
                    <div className="text-purple-400 font-bold text-xs mt-0.5 truncate">{c.usage_limit}</div>
                  </div>
                  <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Redeemed</div>
                    <div className="text-emerald-400 font-bold text-xs mt-0.5 truncate">{c.redeemed_count}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                  <span>Expiry Date:</span>
                  <span className="text-slate-200 font-bold">{c.expiry_date}</span>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedCoupon(c)}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" /> View Spec
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCoupon(c.id, c.coupon_id)}
                    className="p-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl cursor-pointer transition-all"
                    title="Disable Coupon"
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
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('promo_code')}>Promo Code & ID</th>
                  <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('discount_type')}>Discount Type</th>
                  <th className="p-3.5 font-mono">Usage Limit Quota</th>
                  <th className="p-3.5 font-mono">Redeemed Count</th>
                  <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('expiry_date')}>Expiry Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedData.map(c => (
                  <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-bold text-white font-mono">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="text-sm text-amber-400 font-extrabold">{c.promo_code}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{c.coupon_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[10px] text-indigo-400 font-bold">{c.discount_type}</td>
                    <td className="p-3.5 font-mono text-[10px] text-purple-400 font-bold">{c.usage_limit}</td>
                    <td className="p-3.5 font-mono text-[11px] text-emerald-400 font-bold">{c.redeemed_count}</td>
                    <td className="p-3.5 font-mono text-[10px] text-slate-300 font-bold">{c.expiry_date}</td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleStatus(c.id, c.status, c.promo_code)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase cursor-pointer transition-all ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                        }`}
                      >
                        {c.status === 'ACTIVE' ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5 text-red-400" />}
                        {c.status}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedCoupon(c)}
                          className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" /> Spec
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="px-2.5 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(c.id, c.coupon_id)}
                          className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                          title="Disable Coupon"
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

      {/* CREATE PROMO CODE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Create Promo Code Campaign</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Promo Code String *</label>
                <input
                  type="text"
                  required
                  value={newPromoCode}
                  onChange={e => setNewPromoCode(e.target.value.toUpperCase())}
                  placeholder="e.g. DIWALI2026"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Discount Type</label>
                <select
                  value={newDiscountType}
                  onChange={e => setNewDiscountType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="20% PERCENTAGE OFF">20% Percentage Off</option>
                  <option value="30% PERCENTAGE OFF">30% Percentage Off</option>
                  <option value="$100 FLAT DISCOUNT">$100 Flat Dollar Discount</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Redemption Usage Limit</label>
                <input
                  type="text"
                  value={newUsageLimit}
                  onChange={e => setNewUsageLimit(e.target.value)}
                  placeholder="e.g. 100 Redemptions"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newExpiryDate}
                    onChange={e => setNewExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Initial Status</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as 'ACTIVE' | 'EXPIRED')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="ACTIVE">ACTIVE 🟢</option>
                    <option value="EXPIRED">EXPIRED 🔴</option>
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
                  Create Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROMO CODE MODAL */}
      {editingCoupon && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Edit Promo Code ({editingCoupon.coupon_id})</h3>
              </div>
              <button onClick={() => setEditingCoupon(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Promo Code String *</label>
                <input
                  type="text"
                  required
                  value={newPromoCode}
                  onChange={e => setNewPromoCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Discount Type</label>
                <input
                  type="text"
                  value={newDiscountType}
                  onChange={e => setNewDiscountType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Redemption Usage Limit</label>
                <input
                  type="text"
                  value={newUsageLimit}
                  onChange={e => setNewUsageLimit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newExpiryDate}
                    onChange={e => setNewExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as 'ACTIVE' | 'EXPIRED')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="ACTIVE">ACTIVE 🟢</option>
                    <option value="EXPIRED">EXPIRED 🔴</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCoupon(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer"
                >
                  Update Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SPEC INSPECTOR MODAL */}
      {selectedCoupon && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Promo Code Details ({selectedCoupon.coupon_id})</h3>
              </div>
              <button onClick={() => setSelectedCoupon(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-amber-400 text-base font-black">{selectedCoupon.promo_code}</div>
                <div className="text-indigo-400 text-xs font-bold">Type: {selectedCoupon.discount_type}</div>
                <div className="text-slate-300">Usage Limit: {selectedCoupon.usage_limit}</div>
                <div className="text-emerald-400">Redeemed: {selectedCoupon.redeemed_count}</div>
                <div className="text-slate-500 text-[11px]">
                  Expiry: {selectedCoupon.expiry_date} · Status: <span className={selectedCoupon.status === 'ACTIVE' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{selectedCoupon.status}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCoupon(null)}
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
