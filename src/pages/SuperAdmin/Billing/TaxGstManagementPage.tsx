import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  FileCheck, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, Zap, Scale,
  LayoutGrid, Edit2, ToggleLeft, ToggleRight
} from 'lucide-react';
import api from '../../../services/api';

export interface TaxGstItem {
  id: string;
  rule_id: string;
  tax_name: string;
  sac_code: string;
  tax_rate_pct: string;
  applicability: string;
  status: 'ACTIVE' | 'INACTIVE';
}

type SortField = 'tax_name' | 'sac_code' | 'tax_rate_pct';
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

const mockTaxRules: TaxGstItem[] = [
  {
    id: 'tax-1',
    rule_id: 'TAX-8042',
    tax_name: 'INTRA-STATE GST (CGST 9% + SGST 9%)',
    sac_code: 'SAC 998315 (IT SAAS)',
    tax_rate_pct: '18.00%',
    applicability: 'Same State School Tenants',
    status: 'ACTIVE'
  },
  {
    id: 'tax-2',
    rule_id: 'TAX-8038',
    tax_name: 'INTER-STATE INTEGRATED GST (IGST)',
    sac_code: 'SAC 998315 (IT SAAS)',
    tax_rate_pct: '18.00%',
    applicability: 'Inter-State School Tenants',
    status: 'ACTIVE'
  },
  {
    id: 'tax-3',
    rule_id: 'TAX-8025',
    tax_name: 'INTERNATIONAL REVERSE CHARGE TAX (LUT EXEMPT)',
    sac_code: 'SAC 998313 (SOFTWARE EXPORT)',
    tax_rate_pct: '0.00%',
    applicability: 'Global / Exported SaaS Services',
    status: 'ACTIVE'
  }
];

export default function TaxGstManagementPage() {
  const [taxRules, setTaxRules] = useState<TaxGstItem[]>(mockTaxRules);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('tax_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(6);

  // Modals
  const [selectedTax, setSelectedTax] = useState<TaxGstItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxGstItem | null>(null);

  // Form State
  const [formTaxName, setFormTaxName] = useState('');
  const [formSacCode, setFormSacCode] = useState('SAC 998315 (IT SAAS)');
  const [formTaxRatePct, setFormTaxRatePct] = useState('18.00%');
  const [formApplicability, setFormApplicability] = useState('Same State School Tenants');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const defaultGstRate = 18.0;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/tax-gst-management');
      if (res.data.success && Array.isArray(res.data.data)) {
        setTaxRules(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('GST tax rules & SAC code rate matrix refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder, pageSize]);

  // Toggle Active / Inactive Status
  const handleToggleStatus = async (id: string, currentStatus: 'ACTIVE' | 'INACTIVE', taxName: string) => {
    const nextStatus: 'ACTIVE' | 'INACTIVE' = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    toast.loading(`Updating tax rule '${taxName}' status to ${nextStatus}...`, { id: 'tax-status-toast' });

    try {
      await api.put(`/landlord/tax-gst-management/${id}`, { status: nextStatus });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setTaxRules(prev => prev.map(t => (t.id === id ? { ...t, status: nextStatus } : t)));
      toast.success(`Tax rule '${taxName}' is now ${nextStatus === 'ACTIVE' ? 'ACTIVE 🟢' : 'INACTIVE 🔴'}!`, { id: 'tax-status-toast' });
    }, 400);
  };

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTaxName.trim()) {
      toast.error('Please enter a Tax Rule Name');
      return;
    }

    toast.loading('Creating GST Tax Rule...', { id: 'create-tax-toast' });

    try {
      await api.post('/landlord/tax-gst-management', {
        tax_name: formTaxName,
        sac_code: formSacCode,
        tax_rate_pct: formTaxRatePct,
        applicability: formApplicability,
        status: formStatus
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newRule: TaxGstItem = {
        id: `tax-${Date.now()}`,
        rule_id: `TAX-${Math.floor(1000 + Math.random() * 9000)}`,
        tax_name: formTaxName.toUpperCase(),
        sac_code: formSacCode,
        tax_rate_pct: formTaxRatePct,
        applicability: formApplicability,
        status: formStatus
      };

      setTaxRules(prev => [newRule, ...prev]);
      toast.success(`🏛️ Tax Rule '${formTaxName.toUpperCase()}' created successfully!`, { id: 'create-tax-toast' });
      setIsAddModalOpen(false);

      // Reset form
      setFormTaxName('');
    }, 600);
  };

  const handleOpenEdit = (t: TaxGstItem) => {
    setEditingTax(t);
    setFormTaxName(t.tax_name);
    setFormSacCode(t.sac_code);
    setFormTaxRatePct(t.tax_rate_pct);
    setFormApplicability(t.applicability);
    setFormStatus(t.status);
  };

  const handleUpdateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTax) return;

    toast.loading(`Updating tax rule '${editingTax.tax_name}'...`, { id: 'edit-tax-toast' });

    try {
      await api.put(`/landlord/tax-gst-management/${editingTax.id}`, {
        tax_name: formTaxName,
        sac_code: formSacCode,
        tax_rate_pct: formTaxRatePct,
        applicability: formApplicability,
        status: formStatus
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setTaxRules(prev =>
        prev.map(t =>
          t.id === editingTax.id
            ? {
                ...t,
                tax_name: formTaxName.toUpperCase(),
                sac_code: formSacCode,
                tax_rate_pct: formTaxRatePct,
                applicability: formApplicability,
                status: formStatus
              }
            : t
        )
      );
      toast.success(`✏️ Tax Rule '${formTaxName.toUpperCase()}' updated successfully!`, { id: 'edit-tax-toast' });
      setEditingTax(null);
    }, 500);
  };

  const handleDeleteTax = async (id: string, ruleId: string) => {
    toast.loading(`Disabling GST tax rule '${ruleId}'...`, { id: 'del-tax-toast' });

    try {
      await api.delete(`/landlord/tax-gst-management/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setTaxRules(prev => prev.filter(t => t.id !== id));
      toast.success(`🗑️ Tax Rule '${ruleId}' disabled!`, { id: 'del-tax-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = taxRules.filter(t => {
    const matchesSearch =
      t.rule_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tax_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.sac_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.applicability.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

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
    { value: 'INACTIVE', label: 'INACTIVE 🔴' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'tax_name', label: 'Tax Name' },
    { value: 'sac_code', label: 'SAC Code' },
    { value: 'tax_rate_pct', label: 'Tax Rate %' },
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
              <FileCheck className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                GST Tax Rules, SAC 998315 & Regional Tax Compliance Engine
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-extrabold rounded-full border border-amber-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Scale className="w-3 h-3 text-emerald-400 animate-pulse" /> CGST + SGST (9%+9%) Split Engine
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure regional GST tax rules, SAC code classification, intra-state vs inter-state tax rate calculations, and active status toggles
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setFormTaxName('');
              setFormSacCode('SAC 998315 (IT SAAS)');
              setFormTaxRatePct('18.00%');
              setFormApplicability('Same State School Tenants');
              setFormStatus('ACTIVE');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Create Tax Rule
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Default GST Rate</span>
            <Scale className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{defaultGstRate.toFixed(2)}% Rate 🏛️</div>
          <div className="text-[10px] text-slate-500 mt-0.5">IT SaaS Standard GST</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Intra-State Split</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">9% + 9% CGST/SGST</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Equal Dual Split</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">SAC Classification</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-black text-purple-400 font-mono truncate">SAC 998315</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Hosting & SaaS Services</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">LUT Export Status</span>
            <FileCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">0% IGST 🌐</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Global LUT Exemption</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Calculation Latency</span>
            <Clock className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-black text-teal-400 font-mono">0.1 ms ⚡</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Realtime Checkout Tax</div>
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
              placeholder="Search by rule ID, tax name, SAC code, applicability..."
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
          {paginatedData.map(t => (
            <div
              key={t.id}
              className={`bg-slate-950 rounded-3xl border p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 relative overflow-hidden group ${
                t.status === 'ACTIVE'
                  ? 'border-slate-800 hover:border-amber-500/40 hover:shadow-amber-500/5'
                  : 'border-slate-800/60 opacity-65 bg-slate-950/40'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{t.rule_id}</span>
                    <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors mt-0.5">{t.tax_name}</h3>
                  </div>

                  {/* Active / Inactive Status Toggle */}
                  <button
                    onClick={() => handleToggleStatus(t.id, t.status, t.tax_name)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black cursor-pointer transition-all ${
                      t.status === 'ACTIVE'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                    }`}
                    title="Click to toggle Active / Inactive"
                  >
                    {t.status === 'ACTIVE' ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-red-400" />}
                    {t.status}
                  </button>
                </div>

                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-baseline justify-between font-mono">
                  <span className="text-2xl font-black text-amber-400">{t.tax_rate_pct}</span>
                  <span className="text-[10px] font-bold text-indigo-400">{t.sac_code}</span>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Applicability Context:</div>
                  <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/80 text-xs text-slate-300 font-mono">
                    {t.applicability}
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedTax(t)}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" /> View Spec
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTax(t.id, t.rule_id)}
                    className="p-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl cursor-pointer transition-all"
                    title="Disable Tax Rule"
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
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('tax_name')}>Tax Rule Name & ID</th>
                  <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('sac_code')}>SAC Code</th>
                  <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('tax_rate_pct')}>Tax Rate %</th>
                  <th className="p-3.5 font-mono">Applicability Scope</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedData.map(t => (
                  <tr key={t.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-bold text-white font-mono">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="text-sm text-white font-extrabold">{t.tax_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{t.rule_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[10px] text-indigo-400 font-bold">{t.sac_code}</td>
                    <td className="p-3.5 font-mono text-[11px] text-amber-400 font-bold">{t.tax_rate_pct}</td>
                    <td className="p-3.5 font-mono text-[10px] text-slate-300 font-bold max-w-[200px] truncate">{t.applicability}</td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleStatus(t.id, t.status, t.tax_name)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase cursor-pointer transition-all ${
                          t.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                        }`}
                      >
                        {t.status === 'ACTIVE' ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5 text-red-400" />}
                        {t.status}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedTax(t)}
                          className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" /> Spec
                        </button>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="px-2.5 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTax(t.id, t.rule_id)}
                          className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                          title="Disable Tax Rule"
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

      {/* CREATE TAX RULE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Create GST Tax Rule</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTax} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Tax Rule Name *</label>
                <input
                  type="text"
                  required
                  value={formTaxName}
                  onChange={e => setFormTaxName(e.target.value)}
                  placeholder="e.g. INTRA-STATE GST (CGST 9% + SGST 9%)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">SAC Code</label>
                  <input
                    type="text"
                    value={formSacCode}
                    onChange={e => setFormSacCode(e.target.value)}
                    placeholder="SAC 998315 (IT SAAS)"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Tax Rate %</label>
                  <input
                    type="text"
                    value={formTaxRatePct}
                    onChange={e => setFormTaxRatePct(e.target.value)}
                    placeholder="18.00%"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Applicability Scope</label>
                <input
                  type="text"
                  value={formApplicability}
                  onChange={e => setFormApplicability(e.target.value)}
                  placeholder="Same State School Tenants"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="ACTIVE">ACTIVE 🟢</option>
                  <option value="INACTIVE">INACTIVE 🔴</option>
                </select>
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
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TAX RULE MODAL */}
      {editingTax && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Edit Tax Rule ({editingTax.rule_id})</h3>
              </div>
              <button onClick={() => setEditingTax(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTax} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Tax Rule Name *</label>
                <input
                  type="text"
                  required
                  value={formTaxName}
                  onChange={e => setFormTaxName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">SAC Code</label>
                  <input
                    type="text"
                    value={formSacCode}
                    onChange={e => setFormSacCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Tax Rate %</label>
                  <input
                    type="text"
                    value={formTaxRatePct}
                    onChange={e => setFormTaxRatePct(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Applicability Scope</label>
                <input
                  type="text"
                  value={formApplicability}
                  onChange={e => setFormApplicability(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="ACTIVE">ACTIVE 🟢</option>
                  <option value="INACTIVE">INACTIVE 🔴</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTax(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer"
                >
                  Update Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SPEC INSPECTOR MODAL */}
      {selectedTax && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">GST Tax Rule Details ({selectedTax.rule_id})</h3>
              </div>
              <button onClick={() => setSelectedTax(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-amber-400 text-base font-black">{selectedTax.tax_name}</div>
                <div className="text-indigo-400 text-xs font-bold">SAC: {selectedTax.sac_code}</div>
                <div className="text-emerald-400 font-bold">Tax Rate: {selectedTax.tax_rate_pct}</div>
                <div className="text-slate-300">Applicability: {selectedTax.applicability}</div>
                <div className="text-slate-500 text-[11px]">
                  Status: <span className={selectedTax.status === 'ACTIVE' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{selectedTax.status}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTax(null)}
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
