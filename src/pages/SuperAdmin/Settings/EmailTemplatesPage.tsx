import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Mail, Plus, RefreshCw, Send, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronDown, Check, List, LayoutGrid, CheckCircle2, X, Eye, Code, Sparkles,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText
} from 'lucide-react';
import api from '../../../services/api';

interface EmailTemplate {
  id: number;
  name: string;
  code: string;
  category: 'Fee & Accounts' | 'Attendance' | 'Exams & Marks' | 'Admissions' | 'System Alerts';
  subject: string;
  html_body: string;
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
        {Icon && <Icon className="w-3.5 h-3.5 text-blue-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-blue-500 placeholder-slate-600"
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
                      ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockEmailTemplates: EmailTemplate[] = [
  {
    id: 1,
    name: 'Fee Due Reminder Email',
    code: 'EMAIL_FEE_DUE',
    category: 'Fee & Accounts',
    subject: 'Quarterly Fee Due Notice for {student_name} - {school_name}',
    html_body: '<h2>Dear {parent_name},</h2><p>This is an automated reminder that quarterly school fee of <strong>₹{fee_amount}</strong> for <strong>{student_name}</strong> is due on <strong>{due_date}</strong>.</p><p><a href="{login_url}">Click here to pay online</a></p><p>Regards,<br>{school_name}</p>',
    is_active: true,
    variables: ['{student_name}', '{parent_name}', '{fee_amount}', '{due_date}', '{login_url}', '{school_name}'],
    updated_at: '2026-08-01'
  },
  {
    id: 2,
    name: 'Fee Receipt Confirmation Email',
    code: 'EMAIL_FEE_RECEIPT',
    category: 'Fee & Accounts',
    subject: 'Payment Receipt #{receipt_no} - {school_name}',
    html_body: '<h2>Payment Confirmation</h2><p>Dear {parent_name},</p><p>We have successfully received payment of <strong>₹{fee_amount}</strong> for {student_name}.</p><p>Receipt No: {receipt_no}<br>Date: {payment_date}</p><p>Thank you,<br>{school_name}</p>',
    is_active: true,
    variables: ['{parent_name}', '{fee_amount}', '{student_name}', '{receipt_no}', '{payment_date}', '{school_name}'],
    updated_at: '2026-07-28'
  },
  {
    id: 3,
    name: 'Term Exam Report Card Email',
    code: 'EMAIL_REPORT_CARD',
    category: 'Exams & Marks',
    subject: 'Term 1 Exam Results Published for {student_name}',
    html_body: '<h2>Academic Report Card</h2><p>Dear {parent_name},</p><p>The Term 1 exam report card for <strong>{student_name}</strong> (Class {class_name}) has been published.</p><p>Overall Grade: {grade} | Percentage: {percentage}%</p><p>Download report card PDF: <a href="{report_url}">View Report</a></p>',
    is_active: true,
    variables: ['{parent_name}', '{student_name}', '{class_name}', '{grade}', '{percentage}', '{report_url}'],
    updated_at: '2026-08-03'
  },
  {
    id: 4,
    name: 'Admissions Welcome Email',
    code: 'EMAIL_ADMISSION_WELCOME',
    category: 'Admissions',
    subject: 'Welcome to {school_name} - Admission Inquiry Acknowledgment',
    html_body: '<h2>Welcome to {school_name}!</h2><p>Dear {parent_name},</p><p>Thank you for submitting an admission inquiry for Class {class_name}. Reference No: <strong>{inquiry_ref}</strong>.</p><p>Our counselor will contact you shortly.</p>',
    is_active: true,
    variables: ['{school_name}', '{parent_name}', '{class_name}', '{inquiry_ref}'],
    updated_at: '2026-07-20'
  }
];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(mockEmailTemplates);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [testModalTemplate, setTestModalTemplate] = useState<EmailTemplate | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    category: 'Fee & Accounts' as EmailTemplate['category'],
    subject: '',
    html_body: '',
  });

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Email templates reloaded');
    }, 500);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, sortBy, sortOrder, pageSize]);

  const handleSendTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) {
      toast.error('Enter recipient email address');
      return;
    }
    setSendingTest(true);
    toast.loading(`Sending test HTML email to ${testEmail}...`, { id: 'test-email' });
    setTimeout(() => {
      setSendingTest(false);
      setTestModalTemplate(null);
      setTestEmail('');
      toast.success(`🎉 Test email sent successfully to ${testEmail}!`, { id: 'test-email' });
    }, 1200);
  };

  const handleToggleActive = (id: number, current: boolean) => {
    const next = !current;
    setTemplates(prev => prev.map(t => (t.id === id ? { ...t, is_active: next } : t)));
    toast.success(`Email Template ${next ? 'ACTIVATED 🟢' : 'DEACTIVATED 🔴'}`);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.subject || !form.html_body) {
      toast.error('Please enter name, subject, and HTML body');
      return;
    }
    const created: EmailTemplate = {
      id: Date.now(),
      name: form.name,
      code: form.code || form.name.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
      category: form.category,
      subject: form.subject,
      html_body: form.html_body,
      is_active: true,
      variables: ['{student_name}', '{parent_name}', '{school_name}'],
      updated_at: new Date().toISOString().split('T')[0],
    };
    setTemplates(prev => [created, ...prev]);
    setShowCreateModal(false);
    toast.success(`Email Template '${created.name}' created!`);
    setForm({ name: '', code: '', category: 'Fee & Accounts', subject: '', html_body: '' });
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase());
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
    { value: 'Attendance', label: 'Attendance & Leave' },
    { value: 'Exams & Marks', label: 'Exams & Marks' },
    { value: 'Admissions', label: 'Admissions Desk' },
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
            <span className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-400/30">
              <Mail className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Transactional Email HTML Templates
                <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-extrabold rounded-full border border-blue-400/30 uppercase tracking-wider">
                  SMTP & AWS SES Engine
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage rich HTML email templates with dynamic placeholders for automated school notifications
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleRefresh} className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30">
            <Plus className="w-4 h-4" /> Create Email Template
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Email Templates</span>
            <Mail className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{templates.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">HTML & Plain Text</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Templates</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{templates.filter(t => t.is_active).length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Live Dispatches</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Deliverability Rate</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">99.6%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">High Reputation Score</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Open Rate</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">78.2%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Parent Engagement</div>
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
              placeholder="Search email templates by name, code, subject..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-blue-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={categoryOptions} value={categoryFilter} onChange={setCategoryFilter} placeholder="Category..." icon={Filter} labelPrefix="Category" />
          <div className="flex items-center gap-1">
            <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
            <button onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))} className="p-2 bg-slate-900 border border-slate-800 text-blue-400 hover:bg-slate-800 rounded-xl cursor-pointer">
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <SearchableSelect options={pageSizeOptions} value={String(pageSize)} onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))} placeholder="Per Page..." icon={List} labelPrefix="Rows" />
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg text-xs cursor-pointer ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg text-xs cursor-pointer ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'}`}><List className="w-4 h-4" /></button>
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
                    <div className="text-[10px] font-mono text-blue-400 mt-0.5">{t.code}</div>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-[9px] font-bold uppercase">
                    {t.category}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-200 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Subject Line:</span>
                  {t.subject}
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 line-clamp-3">
                  {t.html_body}
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

                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPreviewTemplate(t)} className="p-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl cursor-pointer" title="Preview HTML Email">
                    <Eye className="w-4 h-4 text-cyan-400" />
                  </button>
                  <button onClick={() => setTestModalTemplate(t)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-[10px] flex items-center gap-1 cursor-pointer shadow-md">
                    <Send className="w-3 h-3" /> Send Test Email
                  </button>
                </div>
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
                  <th className="p-3.5" onClick={() => handleSort('category')}>Category</th>
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedData.map(t => (
                  <tr key={t.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-bold text-white">
                      <div>{t.name}</div>
                      <div className="text-[10px] font-mono text-blue-400">{t.code}</div>
                    </td>
                    <td className="p-3.5 text-slate-400">{t.category}</td>
                    <td className="p-3.5 text-slate-300 max-w-xs truncate">{t.subject}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${
                        t.is_active ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' : 'text-slate-500 bg-slate-800'
                      }`}>{t.is_active ? 'ACTIVE' : 'DISABLED'}</span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setPreviewTemplate(t)} className="px-2 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-[10px] font-bold"><Eye className="w-3 h-3 text-cyan-400" /> Preview</button>
                        <button onClick={() => setTestModalTemplate(t)} className="px-2 py-1 bg-blue-600 text-white font-bold rounded-lg text-[10px]"><Send className="w-3 h-3" /> Test Email</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: LIVE HTML PREVIEW */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" /> Live HTML Email Preview
              </h3>
              <button onClick={() => setPreviewTemplate(null)} className="p-1 text-slate-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-bold">
                Subject: {previewTemplate.subject}
              </div>

              <div className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-300 shadow-inner max-h-72 overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: previewTemplate.html_body }} />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button onClick={() => setPreviewTemplate(null)} className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-bold text-xs">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SEND TEST EMAIL */}
      {testModalTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleSendTestEmail} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-400" /> Send Test HTML Email
              </h3>
              <button type="button" onClick={() => setTestModalTemplate(null)} className="p-1 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Target Email Address *</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="admin@myschoolpoint.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => setTestModalTemplate(null)} className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-bold text-xs">Cancel</button>
              <button type="submit" disabled={sendingTest} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> {sendingTest ? 'Sending...' : 'Dispatch Test Email'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CREATE EMAIL TEMPLATE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateSubmit} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" /> Create HTML Email Template
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
                  placeholder="e.g. Quarterly Fee Due Notice"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Email Subject Line *</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  placeholder="Quarterly Fee Due Notice for {student_name}"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">HTML Template Body Code *</label>
                <textarea
                  value={form.html_body}
                  onChange={e => setForm({ ...form, html_body: e.target.value })}
                  placeholder="<h2>Dear {parent_name},</h2><p>Your fee of ₹{fee_amount} is due...</p>"
                  rows={6}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">Save Email Template</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
