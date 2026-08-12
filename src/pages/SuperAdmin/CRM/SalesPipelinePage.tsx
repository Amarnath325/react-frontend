import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  TrendingUp, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, DollarSign, Award, Zap
} from 'lucide-react';
import api from '../../../services/api';

interface SalesDealItem {
  id: string;
  deal_id: string;
  account_name: string;
  deal_value: number;
  stage: string;
  probability_pct: number;
  expected_close_date: string;
  assigned_rep: string;
  status: string;
}

type SortField = 'deal_value' | 'probability_pct' | 'expected_close_date';
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

const mockDeals: SalesDealItem[] = [
  {
    id: 'dls-1',
    deal_id: 'DLS-3042',
    account_name: 'Greenwood High International',
    deal_value: 28000.00,
    stage: 'CONTRACT IN REVIEW',
    probability_pct: 85,
    expected_close_date: '2026-08-20',
    assigned_rep: 'Ananya Roy (Account Exec)',
    status: 'ACTIVE DEAL'
  },
  {
    id: 'dls-2',
    deal_id: 'DLS-3038',
    account_name: 'St. Xavier International School',
    deal_value: 45000.00,
    stage: 'PROCUREMENT APPROVAL',
    probability_pct: 90,
    expected_close_date: '2026-08-15',
    assigned_rep: 'Vikram Singh (Senior AE)',
    status: 'ACTIVE DEAL'
  },
  {
    id: 'dls-3',
    deal_id: 'DLS-3025',
    account_name: 'Delhi Public School, Sector 45',
    deal_value: 18500.00,
    stage: 'DEMO COMPLETED',
    probability_pct: 60,
    expected_close_date: '2026-08-28',
    assigned_rep: 'Vikram Singh (Senior AE)',
    status: 'ACTIVE DEAL'
  }
];

export default function SalesPipelinePage() {
  const [deals, setDeals] = useState<SalesDealItem[]>(mockDeals);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('deal_value');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [selectedDeal, setSelectedDeal] = useState<SalesDealItem | null>(null);

  const totalPipelineVal = 420000;
  const avgDealVal = 14500;
  const winRatePct = 42.8;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/sales-pipeline');
      if (res.data.success && Array.isArray(res.data.data)) {
        setDeals(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('B2B Enterprise Sales Pipeline deals refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, stageFilter, sortBy, sortOrder, pageSize]);

  const handleDeleteDeal = async (id: string, dealId: string) => {
    toast.loading(`Deleting deal '${dealId}'...`, { id: 'del-deal-toast' });

    try {
      await api.delete(`/landlord/sales-pipeline/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setDeals(prev => prev.filter(d => d.id !== id));
      toast.success(`🗑️ Deal '${dealId}' deleted!`, { id: 'del-deal-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('desc'); }
  };

  const filtered = deals.filter(d => {
    const matchesSearch =
      d.deal_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.stage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.assigned_rep.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage = stageFilter === 'all' || d.stage === stageFilter;

    return matchesSearch && matchesStage;
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

  const stageOptions: SearchableOption[] = [
    { value: 'all', label: 'All Stages' },
    { value: 'CONTRACT IN REVIEW', label: 'CONTRACT IN REVIEW 📜' },
    { value: 'PROCUREMENT APPROVAL', label: 'PROCUREMENT APPROVAL 🏛️' },
    { value: 'DEMO COMPLETED', label: 'DEMO COMPLETED 📹' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'deal_value', label: 'Deal Value' },
    { value: 'probability_pct', label: 'Probability %' },
    { value: 'expected_close_date', label: 'Close Date' },
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
              <TrendingUp className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                B2B Enterprise SaaS Sales Pipeline & Deal Stages
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-extrabold rounded-full border border-amber-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3 h-3 text-emerald-400 animate-pulse" /> $420.0K Pipeline Value
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Track active deal stages, win probabilities, expected close dates, and Account Executive performance
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Pipeline Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">${(totalPipelineVal / 1000).toFixed(0)}K ARR 💰</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active Qualified Deals</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Average Deal Size</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">${(avgDealVal / 1000).toFixed(1)}K ARR</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Per School Contract</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Sales Win Rate</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{winRatePct}% 🎯</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Demo to Close Ratio</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Sales Cycle Time</span>
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">14 Days ⚡</div>
          <div className="text-[10px] text-slate-500 mt-0.5">First Touch to Close</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Deals Near Close</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono">18 Deals 📜</div>
          <div className="text-[10px] text-slate-500 mt-0.5">High Probability (&gt;80%)</div>
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
              placeholder="Search by deal ID, account name, stage, assigned AE..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={stageOptions} value={stageFilter} onChange={setStageFilter} placeholder="Stage..." icon={Filter} labelPrefix="Stage" />
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
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('deal_value')}>Account Name & Deal ID</th>
                <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('deal_value')}>Deal Value (ARR)</th>
                <th className="p-3.5">Pipeline Stage</th>
                <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('probability_pct')}>Win Probability</th>
                <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('expected_close_date')}>Expected Close Date</th>
                <th className="p-3.5">Assigned AE</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(d => (
                <tr key={d.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{d.account_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{d.deal_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-emerald-400 font-bold">${d.deal_value.toLocaleString()} ARR</td>
                  <td className="p-3.5 font-mono text-[10px] text-purple-400 font-bold">{d.stage}</td>
                  <td className="p-3.5 font-mono text-[11px] text-blue-400 font-bold">{d.probability_pct}% Probability</td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-300 font-bold">{d.expected_close_date}</td>
                  <td className="p-3.5 font-mono text-[10px] text-amber-400 font-bold">{d.assigned_rep}</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-extrabold uppercase">
                      {d.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedDeal(d)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" /> Deal Spec
                      </button>
                      <button
                        onClick={() => handleDeleteDeal(d.id, d.deal_id)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete Deal"
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

      {selectedDeal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Sales Deal Specification ({selectedDeal.deal_id})</h3>
              </div>
              <button onClick={() => setSelectedDeal(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-amber-400 font-bold">{selectedDeal.account_name}</div>
                <div className="text-slate-400">Value: ${selectedDeal.deal_value} ARR · Stage: {selectedDeal.stage}</div>
                <div className="text-slate-500 text-[11px]">Prob: {selectedDeal.probability_pct}% · Close: {selectedDeal.expected_close_date} · AE: {selectedDeal.assigned_rep}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDeal(null)}
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
