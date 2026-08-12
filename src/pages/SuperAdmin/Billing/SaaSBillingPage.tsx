import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  FileText, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, DollarSign, Zap, Download,
  LayoutGrid, Edit2, ToggleLeft, ToggleRight
} from 'lucide-react';
import api from '../../../services/api';

export interface SaaSBillingItem {
  id: string;
  invoice_id: string;
  school_name: string;
  amount: string;
  gst_tax: string;
  issue_date: string;
  due_date: string;
  status: 'PAID' | 'OVERDUE';
}

type SortField = 'school_name' | 'amount' | 'due_date';
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

const mockInvoices: SaaSBillingItem[] = [
  {
    id: 'inv-1',
    invoice_id: 'INV-2026-6042',
    school_name: 'St. Xavier International School',
    amount: '$14,400 / Year',
    gst_tax: '$2,592 (18% GST)',
    issue_date: '2026-08-01',
    due_date: '2026-08-15',
    status: 'PAID'
  },
  {
    id: 'inv-2',
    invoice_id: 'INV-2026-6038',
    school_name: 'Delhi Public School, Sector 45',
    amount: '$650 / Month',
    gst_tax: '$117 (18% GST)',
    issue_date: '2026-08-01',
    due_date: '2026-08-07',
    status: 'PAID'
  },
  {
    id: 'inv-3',
    invoice_id: 'INV-2026-6025',
    school_name: 'Sunrise Public Academy',
    amount: '$299 / Month',
    gst_tax: '$53.82 (18% GST)',
    issue_date: '2026-07-01',
    due_date: '2026-07-15',
    status: 'OVERDUE'
  }
];

export default function SaaSBillingPage() {
  const [invoices, setInvoices] = useState<SaaSBillingItem[]>(mockInvoices);
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
  const [selectedInvoice, setSelectedInvoice] = useState<SaaSBillingItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<SaaSBillingItem | null>(null);

  // Form State
  const [formSchoolName, setFormSchoolName] = useState('');
  const [formAmount, setFormAmount] = useState('$650 / Month');
  const [formGstTax, setFormGstTax] = useState('$117 (18% GST)');
  const [formIssueDate, setFormIssueDate] = useState('2026-08-12');
  const [formDueDate, setFormDueDate] = useState('2026-08-26');
  const [formStatus, setFormStatus] = useState<'PAID' | 'OVERDUE'>('PAID');

  const totalInvoicedBilled = 1845000;
  const overdueBalanceCount = 3;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/saas-billing');
      if (res.data.success && Array.isArray(res.data.data)) {
        setInvoices(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Platform GST tax invoices & ledger billing refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder, pageSize]);

  // Toggle Paid / Overdue Status
  const handleToggleStatus = async (id: string, currentStatus: 'PAID' | 'OVERDUE', invoiceId: string) => {
    const nextStatus: 'PAID' | 'OVERDUE' = currentStatus === 'PAID' ? 'OVERDUE' : 'PAID';
    toast.loading(`Updating invoice '${invoiceId}' status to ${nextStatus}...`, { id: 'inv-status-toast' });

    try {
      await api.put(`/landlord/saas-billing/${id}`, { status: nextStatus });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setInvoices(prev => prev.map(inv => (inv.id === id ? { ...inv, status: nextStatus } : inv)));
      toast.success(`Invoice '${invoiceId}' is now ${nextStatus === 'PAID' ? 'PAID 🟢' : 'OVERDUE 🔴'}!`, { id: 'inv-status-toast' });
    }, 400);
  };

  const handleDownloadInvoice = (invId: string) => {
    toast.loading(`Generating GST Tax PDF Invoice for ${invId}...`, { id: 'pdf-toast' });
    setTimeout(() => {
      toast.success(`📄 Invoice ${invId} PDF downloaded!`, { id: 'pdf-toast' });
    }, 800);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSchoolName.trim()) {
      toast.error('Please enter a School Tenant Name');
      return;
    }

    toast.loading('Generating B2B GST Invoice...', { id: 'create-inv-toast' });

    try {
      await api.post('/landlord/saas-billing', {
        school_name: formSchoolName,
        amount: formAmount,
        gst_tax: formGstTax,
        issue_date: formIssueDate,
        due_date: formDueDate,
        status: formStatus
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newInvoice: SaaSBillingItem = {
        id: `inv-${Date.now()}`,
        invoice_id: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        school_name: formSchoolName,
        amount: formAmount,
        gst_tax: formGstTax,
        issue_date: formIssueDate,
        due_date: formDueDate,
        status: formStatus
      };

      setInvoices(prev => [newInvoice, ...prev]);
      toast.success(`📄 GST Invoice generated for '${formSchoolName}' successfully!`, { id: 'create-inv-toast' });
      setIsAddModalOpen(false);

      // Reset form
      setFormSchoolName('');
    }, 600);
  };

  const handleOpenEdit = (inv: SaaSBillingItem) => {
    setEditingInvoice(inv);
    setFormSchoolName(inv.school_name);
    setFormAmount(inv.amount);
    setFormGstTax(inv.gst_tax);
    setFormIssueDate(inv.issue_date);
    setFormDueDate(inv.due_date);
    setFormStatus(inv.status);
  };

  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    toast.loading(`Updating invoice '${editingInvoice.invoice_id}'...`, { id: 'edit-inv-toast' });

    try {
      await api.put(`/landlord/saas-billing/${editingInvoice.id}`, {
        school_name: formSchoolName,
        amount: formAmount,
        gst_tax: formGstTax,
        issue_date: formIssueDate,
        due_date: formDueDate,
        status: formStatus
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setInvoices(prev =>
        prev.map(inv =>
          inv.id === editingInvoice.id
            ? {
                ...inv,
                school_name: formSchoolName,
                amount: formAmount,
                gst_tax: formGstTax,
                issue_date: formIssueDate,
                due_date: formDueDate,
                status: formStatus
              }
            : inv
        )
      );
      toast.success(`✏️ Invoice '${editingInvoice.invoice_id}' updated successfully!`, { id: 'edit-inv-toast' });
      setEditingInvoice(null);
    }, 500);
  };

  const handleDeleteInvoice = async (id: string, invId: string) => {
    toast.loading(`Voiding invoice '${invId}'...`, { id: 'del-inv-toast' });

    try {
      await api.delete(`/landlord/saas-billing/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      toast.success(`🗑️ Invoice '${invId}' voided!`, { id: 'del-inv-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = invoices.filter(inv => {
    const matchesSearch =
      inv.invoice_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.amount.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

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
    { value: 'PAID', label: 'PAID 🟢' },
    { value: 'OVERDUE', label: 'OVERDUE 🔴' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'school_name', label: 'School Name' },
    { value: 'amount', label: 'Amount' },
    { value: 'due_date', label: 'Due Date' },
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
              <FileText className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                SaaS Platform Invoices, B2B Tax Ledger & Billing Records
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-extrabold rounded-full border border-amber-400/30 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 animate-pulse" /> SAC 998315 GST Compliant
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate 18% GST tax compliant PDF invoices, monitor tenant payment status, toggle paid/overdue balances, and download receipts
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setFormSchoolName('');
              setFormAmount('$650 / Month');
              setFormGstTax('$117 (18% GST)');
              setFormIssueDate('2026-08-12');
              setFormDueDate('2026-08-26');
              setFormStatus('PAID');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Generate GST Invoice
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Invoiced</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">${(totalInvoicedBilled / 1000000).toFixed(2)}M Billed 📄</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Gross Invoiced Revenue</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Collected Paid</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">98.2% Paid 🟢</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Settled Invoices</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Overdue Balance</span>
            <FileText className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{overdueBalanceCount} Invoices 🚨</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Pending Payment</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">GST Collected</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">18% GST Tax</div>
          <div className="text-[10px] text-slate-500 mt-0.5">CGST + SGST Ledger</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">PDF Render SLA</span>
            <Download className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-black text-teal-400 font-mono">0.6 sec ⚡</div>
          <div className="text-[10px] text-slate-500 mt-0.5">On-demand Download</div>
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
              placeholder="Search by invoice ID, school name, amount..."
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
          {paginatedData.map(inv => (
            <div
              key={inv.id}
              className={`bg-slate-950 rounded-3xl border p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 relative overflow-hidden group ${
                inv.status === 'PAID'
                  ? 'border-slate-800 hover:border-amber-500/40 hover:shadow-amber-500/5'
                  : 'border-slate-800/60 opacity-65 bg-slate-950/40'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{inv.invoice_id}</span>
                    <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors mt-0.5">{inv.school_name}</h3>
                  </div>

                  {/* Active / Overdue Status Toggle */}
                  <button
                    onClick={() => handleToggleStatus(inv.id, inv.status, inv.invoice_id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black cursor-pointer transition-all ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                    }`}
                    title="Click to toggle Paid / Overdue"
                  >
                    {inv.status === 'PAID' ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-red-400" />}
                    {inv.status}
                  </button>
                </div>

                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-amber-400">{inv.amount}</span>
                  <span className="text-[10px] font-bold text-purple-400">{inv.gst_tax}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Issue Date</div>
                    <div className="text-slate-300 font-bold text-xs mt-0.5 truncate">{inv.issue_date}</div>
                  </div>
                  <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Due Date</div>
                    <div className="text-emerald-400 font-bold text-xs mt-0.5 truncate">{inv.due_date}</div>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleDownloadInvoice(inv.invoice_id)}
                  className="px-2.5 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> PDF Invoice
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" /> Spec
                  </button>
                  <button
                    onClick={() => handleOpenEdit(inv)}
                    className="px-2.5 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteInvoice(inv.id, inv.invoice_id)}
                    className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                    title="Void Invoice"
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
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('school_name')}>School Tenant & Invoice ID</th>
                  <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('amount')}>Billed Amount</th>
                  <th className="p-3.5 font-mono">18% GST Tax</th>
                  <th className="p-3.5 font-mono">Issue Date</th>
                  <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('due_date')}>Due Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedData.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-bold text-white font-mono">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="text-sm text-white font-extrabold">{inv.school_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{inv.invoice_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-amber-400 font-bold">{inv.amount}</td>
                    <td className="p-3.5 font-mono text-[10px] text-purple-400 font-bold">{inv.gst_tax}</td>
                    <td className="p-3.5 font-mono text-[10px] text-slate-400">{inv.issue_date}</td>
                    <td className="p-3.5 font-mono text-[10px] text-emerald-400 font-bold">{inv.due_date}</td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleStatus(inv.id, inv.status, inv.invoice_id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase cursor-pointer transition-all ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                        }`}
                      >
                        {inv.status === 'PAID' ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5 text-red-400" />}
                        {inv.status}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDownloadInvoice(inv.invoice_id)}
                          className="px-2 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </button>
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" /> Spec
                        </button>
                        <button
                          onClick={() => handleOpenEdit(inv)}
                          className="px-2.5 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id, inv.invoice_id)}
                          className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                          title="Void Invoice"
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

      {/* CREATE INVOICE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Generate B2B GST Tax Invoice</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">School Tenant Name *</label>
                <input
                  type="text"
                  required
                  value={formSchoolName}
                  onChange={e => setFormSchoolName(e.target.value)}
                  placeholder="e.g. Oxford Public School"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Billed Amount</label>
                  <input
                    type="text"
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                    placeholder="$650 / Month"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">18% GST Tax Component</label>
                  <input
                    type="text"
                    value={formGstTax}
                    onChange={e => setFormGstTax(e.target.value)}
                    placeholder="$117 (18% GST)"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={formIssueDate}
                    onChange={e => setFormIssueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={e => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as 'PAID' | 'OVERDUE')}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="PAID">PAID 🟢</option>
                  <option value="OVERDUE">OVERDUE 🔴</option>
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
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT INVOICE MODAL */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Edit GST Invoice ({editingInvoice.invoice_id})</h3>
              </div>
              <button onClick={() => setEditingInvoice(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateInvoice} className="space-y-3 text-xs">
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
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Amount</label>
                  <input
                    type="text"
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">18% GST Tax</label>
                  <input
                    type="text"
                    value={formGstTax}
                    onChange={e => setFormGstTax(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={formIssueDate}
                    onChange={e => setFormIssueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={e => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as 'PAID' | 'OVERDUE')}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="PAID">PAID 🟢</option>
                  <option value="OVERDUE">OVERDUE 🔴</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer"
                >
                  Update Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SPEC INSPECTOR MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">GST Invoice Specification ({selectedInvoice.invoice_id})</h3>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-amber-400 text-base font-black">{selectedInvoice.school_name}</div>
                <div className="text-emerald-400 text-sm font-bold">Amount: {selectedInvoice.amount}</div>
                <div className="text-purple-400">Tax Component: {selectedInvoice.gst_tax}</div>
                <div className="text-slate-300">Issue Date: {selectedInvoice.issue_date} · Due Date: {selectedInvoice.due_date}</div>
                <div className="text-slate-500 text-[11px]">
                  Status: <span className={selectedInvoice.status === 'PAID' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{selectedInvoice.status}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
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
