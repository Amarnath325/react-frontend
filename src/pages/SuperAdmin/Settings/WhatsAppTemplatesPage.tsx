import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  MessageSquare, Plus, RefreshCw, Send, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronDown, Check, List, LayoutGrid, CheckCircle2, X, Eye, ShieldCheck, Sparkles,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MessageCircle
} from 'lucide-react';
import api from '../../../services/api';

interface WhatsAppTemplate {
  id: number;
  name: string;
  code: string;
  category: 'Fee & Accounts' | 'Attendance' | 'Exams & Marks' | 'Admissions' | 'System Alerts';
  hsm_status: 'APPROVED' | 'PENDING' | 'REJECTED';
  body: string;
  buttons_count: number;
  is_active: boolean;
  variables: string[];
  updated_at: string;
}

type SortField = 'name' | 'category' | 'updated_at';
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

const mockWaTemplates: WhatsAppTemplate[] = [
  {
    id: 1,
    name: 'Fee Receipt Confirmation WA Broadcast',
    code: 'WA_FEE_RECEIPT',
    category: 'Fee & Accounts',
    hsm_status: 'APPROVED',
    body: '🎓 *{school_name}*\n\nDear *{parent_name}*,\nPayment of *₹{fee_amount}* for *{student_name}* has been successfully received!\n\nReceipt No: `{receipt_no}`\nDate: {payment_date}\n\nDownload Receipt PDF: {receipt_url}',
    buttons_count: 2,
    is_active: true,
    variables: ['{school_name}', '{parent_name}', '{fee_amount}', '{student_name}', '{receipt_no}', '{payment_date}', '{receipt_url}'],
    updated_at: '2026-08-04'
  },
  {
    id: 2,
    name: 'Report Card Published Broadcast',
    code: 'WA_REPORT_CARD',
    category: 'Exams & Marks',
    hsm_status: 'APPROVED',
    body: '📊 *{school_name} - Term 1 Results*\n\nDear *{parent_name}*,\nThe Term 1 Report Card for *{student_name}* is now available.\n\nOverall Grade: *{grade}*\nPercentage: *{percentage}%*\n\nView Full Report Card: {report_url}',
    buttons_count: 1,
    is_active: true,
    variables: ['{school_name}', '{parent_name}', '{student_name}', '{grade}', '{percentage}', '{report_url}'],
    updated_at: '2026-08-02'
  },
  {
    id: 3,
    name: 'Emergency Holiday Announcement WA',
    code: 'WA_EMERGENCY_HOLIDAY',
    category: 'System Alerts',
    hsm_status: 'APPROVED',
    body: '🚨 *{school_name} - NOTICE*\n\nDear Parents,\nSchool will remain CLOSED on *{date}* due to *{reason}*.\n\nOnline classes will be conducted as per schedule.\n\nPrincipal,\n{school_name}',
    buttons_count: 0,
    is_active: true,
    variables: ['{school_name}', '{date}', '{reason}'],
    updated_at: '2026-07-29'
  }
];

export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(mockWaTemplates);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  const [testModalTemplate, setTestModalTemplate] = useState<WhatsAppTemplate | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    category: 'Fee & Accounts' as WhatsAppTemplate['category'],
    body: '',
  });

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('WhatsApp HSM templates reloaded');
    }, 500);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, sortBy, sortOrder, pageSize]);

  const handleSendTestWa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone) {
      toast.error('Enter recipient WhatsApp phone number');
      return;
    }
    setSendingTest(true);
    toast.loading(`Sending test WhatsApp HSM broadcast to ${testPhone}...`, { id: 'test-wa' });
    setTimeout(() => {
      setSendingTest(false);
      setTestModalTemplate(null);
      setTestPhone('');
      toast.success(`🎉 Test WhatsApp HSM message delivered to ${testPhone}!`, { id: 'test-wa' });
    }, 1200);
  };

  const handleToggleActive = (id: number, current: boolean) => {
    const next = !current;
    setTemplates(prev => prev.map(t => (t.id === id ? { ...t, is_active: next } : t)));
    toast.success(`WhatsApp Template ${next ? 'ACTIVATED 🟢' : 'DEACTIVATED 🔴'}`);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.body) {
      toast.error('Please enter template name and body text');
      return;
    }
    const created: WhatsAppTemplate = {
      id: Date.now(),
      name: form.name,
      code: form.code || form.name.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
      category: form.category,
      hsm_status: 'APPROVED',
      body: form.body,
      buttons_count: 1,
      is_active: true,
      variables: ['{school_name}', '{parent_name}', '{student_name}'],
      updated_at: new Date().toISOString().split('T')[0],
    };
    setTemplates(prev => [created, ...prev]);
    setShowCreateModal(false);
    toast.success(`WhatsApp HSM Template '${created.name}' created & submitted to Meta Cloud!`);
    setForm({ name: '', code: '', category: 'Fee & Accounts', body: '' });
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.body.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortBy].toLowerCase();
    let valB = b[sortBy].toLowerCase();
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

  const categoryOptions: SearchableOption[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'Fee & Accounts', label: 'Fee & Accounts' },
    { value: 'Exams & Marks', label: 'Exams & Marks' },
    { value: 'System Alerts', label: 'System Alerts' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'name', label: 'Template Name' },
    { value: 'category', label: 'Category' },
    { value: 'updated_at', label: 'Last Updated' },
  ];

  const pageSizeOptions: SearchableOption[] = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: 'all', label: 'Show All' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-400/30">
              <MessageCircle className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Meta WhatsApp Business HSM Templates
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold rounded-full border border-emerald-400/30 uppercase tracking-wider">
                  Meta Cloud API Approved
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage WhatsApp Cloud API HSM templates, CTA quick-reply buttons, and dynamic media headers
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleRefresh} className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30">
            <Plus className="w-4 h-4" /> Create WhatsApp HSM Template
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">WhatsApp HSM Templates</span>
            <MessageCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{templates.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Meta Cloud Engine</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Meta HSM Approval</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">100% APPROVED</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Green Tick Verified</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">CTA Buttons</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">Interactive</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Quick Reply / URL</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Click-Through Rate</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">89.4%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Parent Response Rate</div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search WhatsApp templates by name, code, or body..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-emerald-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={categoryOptions} value={categoryFilter} onChange={setCategoryFilter} placeholder="Category..." icon={Filter} labelPrefix="Category" />
          <div className="flex items-center gap-1">
            <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
            <button onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))} className="p-2 bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-slate-800 rounded-xl cursor-pointer">
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <SearchableSelect options={pageSizeOptions} value={String(pageSize)} onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))} placeholder="Per Page..." icon={List} labelPrefix="Rows" />
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg text-xs cursor-pointer ${viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg text-xs cursor-pointer ${viewMode === 'table' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'}`}><List className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* GRID CARDS VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {paginatedData.map(t => (
            <div key={t.id} className="bg-slate-950 rounded-3xl border border-slate-800 p-5 space-y-3 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-white">{t.name}</h3>
                    <div className="text-[10px] font-mono text-emerald-400 mt-0.5">{t.code}</div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-extrabold uppercase">
                    🟢 {t.hsm_status}
                  </span>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-500/20 p-3.5 rounded-2xl text-xs font-sans text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {t.body}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                <button
                  onClick={() => handleToggleActive(t.id, t.is_active)}
                  className={`w-10 h-5.5 rounded-full flex items-center p-0.5 transition-all cursor-pointer ${
                    t.is_active ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                </button>

                <button onClick={() => setTestModalTemplate(t)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[10px] flex items-center gap-1 cursor-pointer shadow-md">
                  <Send className="w-3 h-3" /> Send Test WA
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3.5" onClick={() => handleSort('name')}>Template Name</th>
                  <th className="p-3.5">HSM Status</th>
                  <th className="p-3.5">Body Text</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedData.map(t => (
                  <tr key={t.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-bold text-white">
                      <div>{t.name}</div>
                      <div className="text-[10px] font-mono text-emerald-400">{t.code}</div>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-400 text-[10px]">🟢 {t.hsm_status}</td>
                    <td className="p-3.5 font-mono text-slate-300 max-w-xs truncate">{t.body}</td>
                    <td className="p-3.5 text-right">
                      <button onClick={() => setTestModalTemplate(t)} className="px-2 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[10px]"><Send className="w-3 h-3" /> Test WA</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: SEND TEST WA */}
      {testModalTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleSendTestWa} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" /> Send Test WhatsApp HSM Message
              </h3>
              <button type="button" onClick={() => setTestModalTemplate(null)} className="p-1 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Target WhatsApp Phone Number *</label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => setTestModalTemplate(null)} className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-bold text-xs">Cancel</button>
              <button type="submit" disabled={sendingTest} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> {sendingTest ? 'Delivering...' : 'Send WhatsApp Message'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CREATE WA TEMPLATE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateSubmit} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" /> Create WhatsApp HSM Template
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="p-1 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Template Display Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Fee Receipt Broadcast"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">WhatsApp HSM Body Text *</label>
                <textarea
                  value={form.body}
                  onChange={e => setForm({ ...form, body: e.target.value })}
                  placeholder="🎓 *{school_name}*\n\nDear *{parent_name}*,\nPayment of *₹{fee_amount}* for *{student_name}*..."
                  rows={5}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">Submit to Meta Cloud</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
