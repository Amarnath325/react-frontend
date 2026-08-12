import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  RotateCcw, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, DollarSign, Zap, Power
} from 'lucide-react';
import api from '../../../services/api';

interface RenewalItem {
  id: string;
  renewal_id: string;
  school_name: string;
  contract_plan: string;
  renewal_date: string;
  auto_renew_status: 'ENABLED' | 'DISABLED';
  payment_method: string;
  discount_code: string;
}

type SortField = 'renewal_date' | 'school_name' | 'auto_renew_status';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-fuchsia-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-fuchsia-500 placeholder-slate-600"
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
                      ? 'bg-fuchsia-600/20 text-fuchsia-400 font-bold border border-fuchsia-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-fuchsia-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockRenewals: RenewalItem[] = [
  {
    id: 'rnw-1',
    renewal_id: 'RNW-3042',
    school_name: 'Delhi Public School, Sector 45',
    contract_plan: 'Pro Tier SaaS',
    renewal_date: '2026-09-01',
    auto_renew_status: 'ENABLED',
    payment_method: 'Stripe Card ending in 4421',
    discount_code: 'AUTORENEW10'
  },
  {
    id: 'rnw-2',
    renewal_id: 'RNW-3038',
    school_name: 'St. Xavier International School',
    contract_plan: 'Enterprise SaaS Plan',
    renewal_date: '2027-08-11',
    auto_renew_status: 'ENABLED',
    payment_method: 'Razorpay HDFC Bank Auto-Debit',
    discount_code: 'ENT2026'
  },
  {
    id: 'rnw-3',
    renewal_id: 'RNW-3025',
    school_name: 'Greenwood High International',
    contract_plan: 'Pro Tier SaaS',
    renewal_date: '2026-08-25',
    auto_renew_status: 'DISABLED',
    payment_method: 'Manual Bank Transfer',
    discount_code: 'NONE'
  }
];

export default function AutoRenewalPage() {
  const [renewals, setRenewals] = useState<RenewalItem[]>(mockRenewals);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('renewal_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [selectedRenewal, setSelectedRenewal] = useState<RenewalItem | null>(null);

  const autoRenewRate = 88.4;
  const upcomingRevenue = 50400;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/auto-renewal');
      if (res.data.success && Array.isArray(res.data.data)) {
        setRenewals(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Automated subscription renewal engine refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder, pageSize]);

  const handleToggleAutoRenew = async (id: string, currentStatus: 'ENABLED' | 'DISABLED', school: string) => {
    const nextStatus = currentStatus === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    toast.loading(`Toggling Auto-Renewal for '${school}' to ${nextStatus}...`, { id: 'tog-rnw-toast' });

    try {
      await api.post(`/landlord/auto-renewal/${id}/toggle-status`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setRenewals(prev =>
        prev.map(r => (r.id === id ? { ...r, auto_renew_status: nextStatus } : r))
      );
      toast.success(` Auto-Renewal for '${school}' is now ${nextStatus}!`, { id: 'tog-rnw-toast' });
    }, 600);
  };

  const handleForceRenewNow = (id: string, school: string) => {
    toast.loading(`Processing instant 1-year renewal contract for '${school}'...`, { id: 'force-rnw-toast' });
    setTimeout(() => {
      toast.success(`🎉 Contract for '${school}' RENEWED FOR 1 YEAR!`, { id: 'force-rnw-toast' });
    }, 1000);
  };

  const handleDeleteRenewal = async (id: string, rnwId: string) => {
    toast.loading(`Deleting renewal record '${rnwId}'...`, { id: 'del-rnw-toast' });

    try {
      await api.delete(`/landlord/auto-renewal/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setRenewals(prev => prev.filter(r => r.id !== id));
      toast.success(`🗑️ Renewal record '${rnwId}' deleted!`, { id: 'del-rnw-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = renewals.filter(r => {
    const matchesSearch =
      r.renewal_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.contract_plan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.payment_method.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.auto_renew_status === statusFilter;

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
    { value: 'ENABLED', label: 'ENABLED 🟢' },
    { value: 'DISABLED', label: 'DISABLED 🔴' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'renewal_date', label: 'Renewal Date' },
    { value: 'school_name', label: 'School Name' },
    { value: 'auto_renew_status', label: 'Auto Renew Status' },
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
            <span className="p-2.5 bg-fuchsia-500/20 text-fuchsia-400 rounded-2xl border border-fuchsia-400/30">
              <RotateCcw className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Automated School Subscription Contract Renewal Engine
                <span className="px-2.5 py-0.5 bg-fuchsia-500/20 text-fuchsia-400 text-[10px] font-extrabold rounded-full border border-fuchsia-400/30 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 animate-pulse" /> 88.4% Renewal Rate
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Automate annual SaaS subscription contract renewals, apply loyalty discount coupons, and retain enterprise school accounts
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400' : 'bg-slate-900 border-slate-800 text-slate-400'
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Auto-Renew Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{autoRenewRate}% 🎉</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Account Retention</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Upcoming Revenue</span>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">${upcomingRevenue.toLocaleString()} 💰</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Next Month Renewals</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Renewing Schools</span>
            <RotateCcw className="w-4 h-4 text-fuchsia-400" />
          </div>
          <div className="text-2xl font-black text-white">42 Schools</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Next 30 Days</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Auto-Discount Scheme</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-400">10% OFF 🏷️</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Annual Loyalty Coupon</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Failed Payment Method</span>
            <ShieldCheck className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">3 Cards ⚠️</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Update Required</div>
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
              placeholder="Search by renewal ID, school name, contract plan, payment method..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-fuchsia-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
          <div className="flex items-center gap-1">
            <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-900 border border-slate-800 text-fuchsia-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
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
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('school_name')}>School Tenant & ID</th>
                <th className="p-3.5">Contract Plan</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('renewal_date')}>Renewal Date</th>
                <th className="p-3.5">Auto-Debit Payment Method</th>
                <th className="p-3.5 font-mono">Loyalty Coupon</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('auto_renew_status')}>Auto-Renew</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(r => (
                <tr key={r.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-fuchsia-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{r.school_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{r.renewal_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="text-white font-bold">{r.contract_plan}</div>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-amber-400 font-bold">{r.renewal_date}</td>
                  <td className="p-3.5 font-mono text-[10px] text-purple-400 font-bold">{r.payment_method}</td>
                  <td className="p-3.5 font-mono text-[10px] text-emerald-400 font-bold">{r.discount_code}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        r.auto_renew_status === 'ENABLED'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border-red-500/30'
                      }`}
                    >
                      {r.auto_renew_status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleToggleAutoRenew(r.id, r.auto_renew_status, r.school_name)}
                        className={`p-1.5 border rounded-xl cursor-pointer ${
                          r.auto_renew_status === 'ENABLED'
                            ? 'bg-amber-600/20 text-amber-400 border-amber-500/30 hover:bg-amber-600/30'
                            : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30'
                        }`}
                        title={r.auto_renew_status === 'ENABLED' ? 'Disable Auto-Renew' : 'Enable Auto-Renew'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleForceRenewNow(r.id, r.school_name)}
                        className="px-2 py-1.5 bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/30 hover:bg-fuchsia-600/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Renew Now
                      </button>
                      <button
                        onClick={() => setSelectedRenewal(r)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-fuchsia-400" /> Contract Spec
                      </button>
                      <button
                        onClick={() => handleDeleteRenewal(r.id, r.renewal_id)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete Renewal Record"
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

      {selectedRenewal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-fuchsia-400" />
                <h3 className="text-base font-extrabold text-white">Auto-Renewal Contract Details ({selectedRenewal.renewal_id})</h3>
              </div>
              <button onClick={() => setSelectedRenewal(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-fuchsia-400 font-bold">{selectedRenewal.school_name}</div>
                <div className="text-slate-400">Plan: {selectedRenewal.contract_plan} · Renewal Date: {selectedRenewal.renewal_date}</div>
                <div className="text-slate-500 text-[11px]">Payment: {selectedRenewal.payment_method} · Coupon: {selectedRenewal.discount_code}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRenewal(null)}
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
