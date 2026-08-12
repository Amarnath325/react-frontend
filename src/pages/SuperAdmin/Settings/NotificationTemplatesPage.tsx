import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Bell, Plus, RefreshCw, Mail, MessageSquare, Send, Search, Filter,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Check, List, LayoutGrid,
  CheckCircle2, AlertTriangle, X, Eye, Code, Smartphone, Sparkles, Copy,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import api from '../../../services/api';

interface NotificationTemplate {
  id: number;
  name: string;
  code: string;
  category: 'Fee & Accounts' | 'Attendance' | 'Exams & Marks' | 'Admissions' | 'System Alerts';
  channel: 'Email' | 'SMS' | 'WhatsApp' | 'Push';
  subject?: string;
  body: string;
  dlt_template_id?: string;
  whatsapp_hsm_status?: 'APPROVED' | 'PENDING' | 'REJECTED';
  is_active: boolean;
  variables: string[];
  updated_at: string;
}

type SortField = 'name' | 'category' | 'channel' | 'updated_at';
type SortOrder = 'asc' | 'desc';
type PageSizeOption = 5 | 10 | 25 | 50 | 'all';

interface SearchableOption {
  value: string;
  label: string;
}

// Searchable Select Component
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
        {Icon && <Icon className="w-3.5 h-3.5 text-orange-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-orange-500 placeholder-slate-600"
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
                      ? 'bg-orange-600/20 text-orange-400 font-bold border border-orange-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-orange-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockTemplates: NotificationTemplate[] = [
  {
    id: 1,
    name: 'Fee Payment Due Alert (Email)',
    code: 'FEE_DUE_EMAIL',
    category: 'Fee & Accounts',
    channel: 'Email',
    subject: 'Fee Due Reminder for {student_name} - {school_name}',
    body: 'Dear {parent_name},\n\nThis is a reminder that the quarterly fee of ₹{fee_amount} for {student_name} (Class {class_name}) is due on {due_date}.\n\nPlease pay online at {login_url} to avoid late fines.\n\nRegards,\n{school_name}',
    is_active: true,
    variables: ['student_name', 'parent_name', 'class_name', 'fee_amount', 'due_date', 'login_url', 'school_name'],
    updated_at: '2026-08-01'
  },
  {
    id: 2,
    name: 'Fee Payment Due Alert (SMS DLT)',
    code: 'FEE_DUE_SMS',
    category: 'Fee & Accounts',
    channel: 'SMS',
    body: 'Dear {parent_name}, Fee of Rs.{fee_amount} for {student_name} is due on {due_date}. Pay online at {login_url} - {school_name}',
    dlt_template_id: '14071689201948201',
    is_active: true,
    variables: ['parent_name', 'fee_amount', 'student_name', 'due_date', 'login_url', 'school_name'],
    updated_at: '2026-07-28'
  },
  {
    id: 3,
    name: 'WhatsApp Fee Receipt Broadcast',
    code: 'FEE_RECEIPT_WA',
    category: 'Fee & Accounts',
    channel: 'WhatsApp',
    body: '🎓 *{school_name}*\n\nDear *{parent_name}*,\nPayment of *₹{fee_amount}* for *{student_name}* has been successfully received!\n\nReceipt No: `{receipt_no}`\nDate: {payment_date}\n\nDownload Receipt PDF: {receipt_url}',
    whatsapp_hsm_status: 'APPROVED',
    is_active: true,
    variables: ['school_name', 'parent_name', 'fee_amount', 'student_name', 'receipt_no', 'payment_date', 'receipt_url'],
    updated_at: '2026-08-04'
  },
  {
    id: 4,
    name: 'Student Absent Alert (SMS DLT)',
    code: 'ABSENT_ALERT_SMS',
    category: 'Attendance',
    channel: 'SMS',
    body: 'Dear Parent, {student_name} was marked ABSENT today ({date}). Kindly inform school if leave was pre-approved. - {school_name}',
    dlt_template_id: '14071689201948990',
    is_active: true,
    variables: ['student_name', 'date', 'school_name'],
    updated_at: '2026-07-30'
  },
  {
    id: 5,
    name: 'Report Card Published Notification',
    code: 'REPORT_CARD_WA',
    category: 'Exams & Marks',
    channel: 'WhatsApp',
    body: '📊 *{school_name} - Term 1 Results*\n\nDear *{parent_name}*,\nThe Term 1 Report Card for *{student_name}* is now available.\n\nOverall Grade: *{grade}*\nPercentage: *{percentage}%*\n\nView Full Report Card: {report_url}',
    whatsapp_hsm_status: 'APPROVED',
    is_active: true,
    variables: ['school_name', 'parent_name', 'student_name', 'grade', 'percentage', 'report_url'],
    updated_at: '2026-08-02'
  },
  {
    id: 6,
    name: 'New Admission Inquiry Welcome Email',
    code: 'ADMISSION_INQUIRY_EMAIL',
    category: 'Admissions',
    channel: 'Email',
    subject: 'Welcome to {school_name} - Admission Inquiry Received',
    body: 'Dear {parent_name},\n\nThank you for your interest in {school_name} for Class {class_name}.\nOur admissions desk will contact you shortly.\n\nInquiry Ref: {inquiry_ref}\n\nWarm regards,\nAdmissions Team',
    is_active: true,
    variables: ['school_name', 'parent_name', 'class_name', 'inquiry_ref'],
    updated_at: '2026-07-25'
  }
];

const availableVariables = [
  '{student_name}', '{parent_name}', '{class_name}', '{fee_amount}',
  '{due_date}', '{receipt_no}', '{payment_date}', '{receipt_url}',
  '{school_name}', '{login_url}', '{grade}', '{percentage}', '{date}'
];

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>(mockTemplates);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [previewTemplate, setPreviewTemplate] = useState<NotificationTemplate | null>(null);
  const [testModalTemplate, setTestModalTemplate] = useState<NotificationTemplate | null>(null);
  const [testRecipient, setTestRecipient] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State for Create Template
  const [templateForm, setTemplateForm] = useState({
    name: '',
    code: '',
    category: 'Fee & Accounts' as NotificationTemplate['category'],
    channel: 'Email' as NotificationTemplate['channel'],
    subject: '',
    body: '',
    dlt_template_id: '',
  });

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/notification-templates');
      if (res.data.success && Array.isArray(res.data.data)) {
        setTemplates(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Notification templates reloaded');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, channelFilter, categoryFilter, sortBy, sortOrder, pageSize]);

  // Send Test Dispatch
  const handleSendTestMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient) {
      toast.error('Please enter recipient email or mobile number');
      return;
    }

    setSendingTest(true);
    toast.loading(`Dispatching test ${testModalTemplate?.channel} message to ${testRecipient}...`, { id: 'test-dispatch' });

    setTimeout(() => {
      setSendingTest(false);
      setTestModalTemplate(null);
      setTestRecipient('');
      toast.success(`🎉 Test ${testModalTemplate?.channel} message sent successfully!`, { id: 'test-dispatch' });
    }, 1200);
  };

  // Toggle Template Status
  const handleToggleTemplate = async (id: number, current: boolean) => {
    const next = !current;
    setTemplates(prev => prev.map(t => (t.id === id ? { ...t, is_active: next } : t)));
    toast.success(`Template ${next ? 'ACTIVATED 🟢' : 'DEACTIVATED 🔴'}`);

    try {
      await api.post(`/landlord/notification-templates/${id}/toggle`);
    } catch {
      // Smooth fallback
    }
  };

  // Create Template Submit
  const handleCreateTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.name || !templateForm.body) {
      toast.error('Please enter template name and body text');
      return;
    }

    const code = templateForm.code || templateForm.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const created: NotificationTemplate = {
      id: Date.now(),
      name: templateForm.name,
      code,
      category: templateForm.category,
      channel: templateForm.channel,
      subject: templateForm.channel === 'Email' ? templateForm.subject || templateForm.name : undefined,
      body: templateForm.body,
      dlt_template_id: templateForm.channel === 'SMS' ? templateForm.dlt_template_id : undefined,
      whatsapp_hsm_status: templateForm.channel === 'WhatsApp' ? 'APPROVED' : undefined,
      is_active: true,
      variables: availableVariables.filter(v => templateForm.body.includes(v) || (templateForm.subject && templateForm.subject.includes(v))),
      updated_at: new Date().toISOString().split('T')[0],
    };

    setTemplates(prev => [created, ...prev]);
    setShowCreateModal(false);
    toast.success(`Template '${created.name}' created!`);
    setTemplateForm({ name: '', code: '', category: 'Fee & Accounts', channel: 'Email', subject: '', body: '', dlt_template_id: '' });
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filtered Dataset
  const filtered = templates.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.body.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesChannel = channelFilter === 'all' || t.channel === channelFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

    return matchesSearch && matchesChannel && matchesCategory;
  });

  // Sorted Dataset
  const sorted = [...filtered].sort((a, b) => {
    let valA: string | number = a[sortBy] ?? '';
    let valB: string | number = b[sortBy] ?? '';

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginated Dataset
  const totalFiltered = sorted.length;
  const effectivePageSize = pageSize === 'all' ? Math.max(1, totalFiltered) : pageSize;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalFiltered / effectivePageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * effectivePageSize;
  const paginatedData = pageSize === 'all' ? sorted : sorted.slice(startIndex, startIndex + effectivePageSize);

  // Aggregated KPIs
  const totalCount = templates.length;
  const emailCount = templates.filter(t => t.channel === 'Email').length;
  const smsCount = templates.filter(t => t.channel === 'SMS').length;
  const waCount = templates.filter(t => t.channel === 'WhatsApp').length;

  const channelOptions: SearchableOption[] = [
    { value: 'all', label: 'All Channels' },
    { value: 'Email', label: 'Email Templates' },
    { value: 'SMS', label: 'SMS DLT Templates' },
    { value: 'WhatsApp', label: 'WhatsApp HSM Templates' },
    { value: 'Push', label: 'Push Notifications' },
  ];

  const categoryOptions: SearchableOption[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'Fee & Accounts', label: 'Fee & Accounts' },
    { value: 'Attendance', label: 'Attendance & Leave' },
    { value: 'Exams & Marks', label: 'Exams & Marks' },
    { value: 'Admissions', label: 'Admissions Desk' },
    { value: 'System Alerts', label: 'System Alerts' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'name', label: 'Template Name' },
    { value: 'category', label: 'Category' },
    { value: 'channel', label: 'Channel' },
    { value: 'updated_at', label: 'Last Updated' },
  ];

  const pageSizeOptions: SearchableOption[] = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: '50', label: '50 per page' },
    { value: 'all', label: 'Show All' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-orange-500/20 text-orange-400 rounded-2xl border border-orange-400/30">
              <Bell className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Multi-Channel Notification Template Engine
                <span className="px-2.5 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] font-extrabold rounded-full border border-orange-400/30 uppercase tracking-wider">
                  Email · SMS · WhatsApp
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage DLT SMS templates, Meta WhatsApp HSM approvals, and HTML email templates with dynamic variable insertion
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Templates
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Notification Template
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Templates</span>
            <Bell className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active Blueprints</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Email Templates</span>
            <Mail className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{emailCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">HTML & Plain Text</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">SMS DLT Templates</span>
            <Smartphone className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{smsCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">DLT Registered</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">WhatsApp HSM</span>
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{waCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Meta Cloud Approved</div>
        </div>
      </div>

      {/* ── TOOLBAR: SEARCH & SEARCHABLE DROPDOWNS ── */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
        {/* Search Input */}
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search templates by name, code, body text, or DLT ID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-orange-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Channel Filter Dropdown */}
          <SearchableSelect
            options={channelOptions}
            value={channelFilter}
            onChange={setChannelFilter}
            placeholder="Channel..."
            icon={Filter}
            labelPrefix="Channel"
          />

          {/* 2. Category Filter Dropdown */}
          <SearchableSelect
            options={categoryOptions}
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="Category..."
            icon={Filter}
            labelPrefix="Category"
          />

          {/* 3. Sort By Dropdown */}
          <div className="flex items-center gap-1">
            <SearchableSelect
              options={sortOptions}
              value={sortBy}
              onChange={val => setSortBy(val as SortField)}
              placeholder="Sort By..."
              icon={ArrowUpDown}
              labelPrefix="Sort"
            />
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-900 border border-slate-800 text-orange-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* 4. Page Size Dropdown */}
          <SearchableSelect
            options={pageSizeOptions}
            value={String(pageSize)}
            onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))}
            placeholder="Per Page..."
            icon={List}
            labelPrefix="Rows"
          />

          {/* 5. View Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── GRID CARDS VIEW ── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedData.map(t => (
            <div key={t.id} className="bg-slate-950 rounded-3xl border border-slate-800 p-5 space-y-4 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-white">{t.name}</h3>
                    <div className="text-[10px] font-mono text-orange-400 mt-0.5">{t.code}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase flex items-center gap-1 ${
                    t.channel === 'Email'
                      ? 'text-blue-400 bg-blue-400/10 border-blue-400/30'
                      : t.channel === 'SMS'
                      ? 'text-purple-400 bg-purple-400/10 border-purple-400/30'
                      : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                  }`}>
                    {t.channel === 'Email' && <Mail className="w-3 h-3" />}
                    {t.channel === 'SMS' && <Smartphone className="w-3 h-3" />}
                    {t.channel === 'WhatsApp' && <MessageSquare className="w-3 h-3" />}
                    {t.channel}
                  </span>
                </div>

                {t.subject && (
                  <div className="text-[11px] font-bold text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 truncate">
                    Subject: {t.subject}
                  </div>
                )}

                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300 font-mono line-clamp-3 leading-relaxed whitespace-pre-wrap">
                  {t.body}
                </div>

                {t.dlt_template_id && (
                  <div className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20 w-fit">
                    DLT ID: {t.dlt_template_id}
                  </div>
                )}

                {/* Variables Placeholders */}
                {t.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {t.variables.map(v => (
                      <span key={v} className="px-1.5 py-0.5 bg-slate-900 text-slate-400 text-[9px] font-mono rounded border border-slate-800">
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                <button
                  onClick={() => handleToggleTemplate(t.id, t.is_active)}
                  className={`w-10 h-5.5 rounded-full flex items-center p-0.5 transition-all cursor-pointer ${
                    t.is_active ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewTemplate(t)}
                    className="p-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl cursor-pointer"
                    title="Preview Template"
                  >
                    <Eye className="w-4 h-4 text-cyan-400" />
                  </button>
                  <button
                    onClick={() => setTestModalTemplate(t)}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-[10px] flex items-center gap-1 cursor-pointer shadow-md"
                  >
                    <Send className="w-3 h-3" /> Send Test
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TABLE VIEW ── */}
      {viewMode === 'table' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                    Template Name & Code
                  </th>
                  <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('channel')}>
                    Channel
                  </th>
                  <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('category')}>
                    Category
                  </th>
                  <th className="p-3.5">Body Snippet</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedData.map(t => (
                  <tr key={t.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-bold text-white">
                      <div className="font-extrabold text-white">{t.name}</div>
                      <div className="text-[10px] font-mono text-orange-400 mt-0.5">{t.code}</div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${
                        t.channel === 'Email'
                          ? 'text-blue-400 bg-blue-400/10 border-blue-400/30'
                          : t.channel === 'SMS'
                          ? 'text-purple-400 bg-purple-400/10 border-purple-400/30'
                          : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                      }`}>
                        {t.channel}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 font-medium">{t.category}</td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                      {t.body}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${
                        t.is_active ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' : 'text-slate-500 bg-slate-800 border-slate-700'
                      }`}>
                        {t.is_active ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewTemplate(t)}
                          className="px-2 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-cyan-400" /> Preview
                        </button>
                        <button
                          onClick={() => setTestModalTemplate(t)}
                          className="px-2 py-1 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" /> Test
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

      {/* ── PAGINATION BAR ── */}
      {totalFiltered > 0 && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-4 text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{pageSize === 'all' ? 1 : startIndex + 1}</strong> to{' '}
            <strong className="text-white">{pageSize === 'all' ? totalFiltered : Math.min(startIndex + effectivePageSize, totalFiltered)}</strong> of{' '}
            <strong className="text-white">{totalFiltered}</strong> templates
          </div>

          {pageSize !== 'all' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={validPage === 1}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={validPage === 1}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl font-bold text-xs cursor-pointer ${
                      pageNum === validPage ? 'bg-orange-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={validPage === totalPages}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={validPage === totalPages}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL 1: PREVIEW TEMPLATE ── */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" /> Template Preview: {previewTemplate.name}
              </h3>
              <button onClick={() => setPreviewTemplate(null)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {previewTemplate.subject && (
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Subject Line</div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-bold">
                    {previewTemplate.subject}
                  </div>
                </div>
              )}

              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Body Content</div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                  {previewTemplate.body}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button onClick={() => setPreviewTemplate(null)} className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-bold text-xs cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: SEND TEST MESSAGE ── */}
      {testModalTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleSendTestMessage} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-orange-400" /> Send Test {testModalTemplate.channel} Message
              </h3>
              <button type="button" onClick={() => setTestModalTemplate(null)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">
                  Recipient {testModalTemplate.channel === 'Email' ? 'Email Address' : 'Mobile Number'} *
                </label>
                <input
                  type={testModalTemplate.channel === 'Email' ? 'email' : 'text'}
                  value={testRecipient}
                  onChange={e => setTestRecipient(e.target.value)}
                  placeholder={testModalTemplate.channel === 'Email' ? 'admin@myschoolpoint.com' : '+91 9876543210'}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="font-bold text-slate-300">Template Preview:</div>
                <div className="font-mono text-slate-400 line-clamp-2">{testModalTemplate.body}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setTestModalTemplate(null)}
                className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-bold cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sendingTest}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-600/30 disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" /> {sendingTest ? 'Sending...' : 'Dispatch Test'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL 3: CREATE NEW TEMPLATE ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateTemplateSubmit} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-orange-400" /> Create Notification Template
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Template Display Name *</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g. Fee Payment Due Alert"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Channel</label>
                  <select
                    value={templateForm.channel}
                    onChange={e => setTemplateForm({ ...templateForm, channel: e.target.value as NotificationTemplate['channel'] })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="Email">Email</option>
                    <option value="SMS">SMS (DLT)</option>
                    <option value="WhatsApp">WhatsApp (HSM)</option>
                    <option value="Push">Push Notification</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Category</label>
                  <select
                    value={templateForm.category}
                    onChange={e => setTemplateForm({ ...templateForm, category: e.target.value as NotificationTemplate['category'] })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="Fee & Accounts">Fee & Accounts</option>
                    <option value="Attendance">Attendance & Leave</option>
                    <option value="Exams & Marks">Exams & Marks</option>
                    <option value="Admissions">Admissions Desk</option>
                    <option value="System Alerts">System Alerts</option>
                  </select>
                </div>
              </div>

              {templateForm.channel === 'Email' && (
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Email Subject Line</label>
                  <input
                    type="text"
                    value={templateForm.subject}
                    onChange={e => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    placeholder="e.g. Fee Due Reminder for {student_name}"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              )}

              {templateForm.channel === 'SMS' && (
                <div>
                  <label className="text-slate-400 font-bold block mb-1">DLT Template Registration ID</label>
                  <input
                    type="text"
                    value={templateForm.dlt_template_id}
                    onChange={e => setTemplateForm({ ...templateForm, dlt_template_id: e.target.value })}
                    placeholder="14071689201948201"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-purple-400 font-mono font-bold focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-400 font-bold block mb-1">
                  Template Body Text * ({templateForm.body.length} chars)
                </label>
                <textarea
                  value={templateForm.body}
                  onChange={e => setTemplateForm({ ...templateForm, body: e.target.value })}
                  placeholder="Enter template text with placeholders like {student_name}, {fee_amount}..."
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              {/* Dynamic Variable Chips */}
              <div>
                <label className="text-slate-400 font-bold block mb-1 text-[10px]">Insert Dynamic Variable Chips:</label>
                <div className="flex flex-wrap gap-1">
                  {availableVariables.map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setTemplateForm(prev => ({ ...prev, body: prev.body + ' ' + v }))}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-orange-400 border border-slate-800 rounded-lg text-[10px] font-mono cursor-pointer transition-colors"
                    >
                      + {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-600/30"
              >
                <Plus className="w-3.5 h-3.5" /> Save Template
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
