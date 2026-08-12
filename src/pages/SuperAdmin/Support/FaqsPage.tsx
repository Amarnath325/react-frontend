import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  HelpCircle, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, ThumbsUp, Layers, Globe, Lock, Star
} from 'lucide-react';
import api from '../../../services/api';

interface FaqItem {
  id: string;
  faq_id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  visibility: 'ALL_TENANTS' | 'SUPERADMIN_ONLY';
  status: 'ACTIVE' | 'INACTIVE';
  helpful_likes: number;
  featured: boolean;
}

type SortField = 'display_order' | 'question' | 'helpful_likes';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-teal-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-teal-500 placeholder-slate-600"
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
                      ? 'bg-teal-600/20 text-teal-400 font-bold border border-teal-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-teal-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockFaqs: FaqItem[] = [
  {
    id: 'faq-1',
    faq_id: 'FAQ-3012',
    question: 'How do I upgrade my school SaaS subscription plan?',
    answer: 'Navigate to Landlord Subscription settings, select Pro or Enterprise tier, and choose online payment via UPI, Credit Card, or Netbanking.',
    category: 'SaaS Subscription & Plans',
    display_order: 1,
    visibility: 'ALL_TENANTS',
    status: 'ACTIVE',
    helpful_likes: 840,
    featured: true
  },
  {
    id: 'faq-2',
    faq_id: 'FAQ-3008',
    question: 'What happens when student fees are paid online via Razorpay?',
    answer: 'The system automatically generates a digitally signed PDF receipt, sends an instant WhatsApp/SMS notification to the parent, and updates school accounting ledgers.',
    category: 'Fee Receipts & Invoicing',
    display_order: 2,
    visibility: 'ALL_TENANTS',
    status: 'ACTIVE',
    helpful_likes: 1240,
    featured: true
  },
  {
    id: 'faq-3',
    faq_id: 'FAQ-2995',
    question: 'Can parents download mobile app on both Android Play Store & Apple App Store?',
    answer: 'Yes, MySchoolPoint app is available on both Android Play Store and Apple iOS App Store with real-time push notifications.',
    category: 'Mobile App Setup',
    display_order: 3,
    visibility: 'ALL_TENANTS',
    status: 'ACTIVE',
    helpful_likes: 920,
    featured: false
  },
  {
    id: 'faq-4',
    faq_id: 'FAQ-2980',
    question: 'How to trigger emergency database rollback for isolated tenant schema?',
    answer: 'SuperAdmin tools -> Database Inspector -> Select tenant -> Restore automated S3 snapshot.',
    category: 'SuperAdmin System',
    display_order: 4,
    visibility: 'SUPERADMIN_ONLY',
    status: 'ACTIVE',
    helpful_likes: 140,
    featured: false
  }
];

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>(mockFaqs);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('display_order');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FaqItem | null>(null);

  // Form State
  const [questionInput, setQuestionInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('SaaS Subscription & Plans');
  const [displayOrderInput, setDisplayOrderInput] = useState(1);
  const [visibilityInput, setVisibilityInput] = useState<'ALL_TENANTS' | 'SUPERADMIN_ONLY'>('ALL_TENANTS');
  const [featuredChecked, setFeaturedChecked] = useState(false);

  const totalFaqsCount = 48;
  const featuredFaqsCount = faqs.filter(f => f.featured).length;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/faqs');
      if (res.data.success && Array.isArray(res.data.data)) {
        setFaqs(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Frequently Asked Questions (FAQs) feed refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter, sortBy, sortOrder, pageSize]);

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim() || !answerInput.trim()) {
      toast.error('Please enter question and answer text');
      return;
    }

    toast.loading(`Adding new FAQ entry '${questionInput}'...`, { id: 'add-faq-toast' });

    try {
      await api.post('/landlord/faqs', {
        question: questionInput,
        answer: answerInput,
        category: categoryInput,
        display_order: displayOrderInput,
        visibility: visibilityInput,
        featured: featuredChecked
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newFaq: FaqItem = {
        id: `faq-${Date.now()}`,
        faq_id: `FAQ-${Math.floor(1000 + Math.random() * 9000)}`,
        question: questionInput,
        answer: answerInput,
        category: categoryInput,
        display_order: displayOrderInput,
        visibility: visibilityInput,
        status: 'ACTIVE',
        helpful_likes: 0,
        featured: featuredChecked
      };
      setFaqs(prev => [newFaq, ...prev]);
      setIsAddModalOpen(false);
      setQuestionInput('');
      setAnswerInput('');
      toast.success(`❓ FAQ Entry '${newFaq.faq_id}' published!`, { id: 'add-faq-toast' });
    }, 800);
  };

  const handleDeleteFaq = async (id: string, question: string) => {
    toast.loading(`Deleting FAQ '${question}'...`, { id: 'del-faq-toast' });

    try {
      await api.delete(`/landlord/faqs/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setFaqs(prev => prev.filter(f => f.id !== id));
      toast.success(`🗑️ FAQ entry '${question}' deleted!`, { id: 'del-faq-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = faqs.filter(f => {
    const matchesSearch =
      f.faq_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || f.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
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

  const categoryOptions: SearchableOption[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'SaaS Subscription & Plans', label: 'SaaS Subscription 💳' },
    { value: 'Fee Receipts & Invoicing', label: 'Fee Receipts 🧾' },
    { value: 'Mobile App Setup', label: 'Mobile App 📱' },
    { value: 'SuperAdmin System', label: 'SuperAdmin System 🔒' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'ACTIVE 🟢' },
    { value: 'INACTIVE', label: 'INACTIVE 🔴' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'display_order', label: 'Display Order' },
    { value: 'question', label: 'Question Title' },
    { value: 'helpful_likes', label: 'Helpful Likes' },
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
            <span className="p-2.5 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-400/30">
              <HelpCircle className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Frequently Asked Questions (FAQ) Manager
                <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-400 text-[10px] font-extrabold rounded-full border border-teal-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" /> Instant Search Engine Active
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage, order, and feature common tenant questions regarding SaaS subscriptions, fee gateway setup, and mobile app login
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Add FAQ Entry
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Total FAQs</span>
            <HelpCircle className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalFaqsCount} FAQs</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Published Questions</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Featured FAQs</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{featuredFaqsCount} Highlighted ⭐</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Top Display Priority</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Monthly Views</span>
            <Eye className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">38,400 Reads</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Help Desk Search</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Search Match Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">98.2% 🎯</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Query Resolution</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Categories</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">6 Active 📂</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Organized Clusters</div>
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
              placeholder="Search by question, answer, category..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-teal-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={categoryOptions} value={categoryFilter} onChange={setCategoryFilter} placeholder="Category..." icon={Filter} labelPrefix="Category" />
          <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
          <div className="flex items-center gap-1">
            <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-900 border border-slate-800 text-teal-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
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
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('question')}>Question Title & ID</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('display_order')}>Order</th>
                <th className="p-3.5">Visibility</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('helpful_likes')}>Likes</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(f => (
                <tr key={f.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-teal-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold flex items-center gap-1.5">
                          {f.question}
                          {f.featured && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{f.faq_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[10px]">
                    <span className="px-2 py-0.5 bg-slate-900 text-teal-400 border border-slate-800 rounded font-bold">
                      {f.category}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-amber-400 font-bold">#{f.display_order}</td>
                  <td className="p-3.5 font-mono text-[10px]">
                    {f.visibility === 'ALL_TENANTS' ? (
                      <span className="text-blue-400 font-bold flex items-center gap-1"><Globe className="w-3 h-3" /> ALL TENANTS</span>
                    ) : (
                      <span className="text-amber-400 font-bold flex items-center gap-1"><Lock className="w-3 h-3" /> SUPERADMIN ONLY</span>
                    )}
                  </td>
                  <td className="p-3.5 font-mono text-emerald-400 font-bold">👍 {f.helpful_likes}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        f.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border-red-500/30'
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedFaq(f)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-teal-400" /> View Answer
                      </button>
                      <button
                        onClick={() => handleDeleteFaq(f.id, f.question)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete FAQ"
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

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-extrabold text-white">Add New FAQ Entry</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFaq} className="space-y-3.5 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Question Title</label>
                <input
                  type="text"
                  required
                  value={questionInput}
                  onChange={e => setQuestionInput(e.target.value)}
                  placeholder="e.g. How do I upgrade my school SaaS subscription plan?"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Category</label>
                  <select
                    value={categoryInput}
                    onChange={e => setCategoryInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="SaaS Subscription & Plans">SaaS Subscription & Plans</option>
                    <option value="Fee Receipts & Invoicing">Fee Receipts & Invoicing</option>
                    <option value="Mobile App Setup">Mobile App Setup</option>
                    <option value="SuperAdmin System">SuperAdmin System</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Display Order #</label>
                  <input
                    type="number"
                    min={1}
                    value={displayOrderInput}
                    onChange={e => setDisplayOrderInput(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Visibility Scope</label>
                <select
                  value={visibilityInput}
                  onChange={e => setVisibilityInput(e.target.value as 'ALL_TENANTS' | 'SUPERADMIN_ONLY')}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="ALL_TENANTS">ALL TENANTS 🌐</option>
                  <option value="SUPERADMIN_ONLY">SUPERADMIN ONLY 🔒</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featuredChecked}
                    onChange={e => setFeaturedChecked(e.target.checked)}
                    className="accent-teal-500"
                  />
                  <span className="text-slate-300 font-bold">Feature on Top of FAQ Help Portal ⭐</span>
                </label>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Answer Body Text</label>
                <textarea
                  required
                  rows={4}
                  value={answerInput}
                  onChange={e => setAnswerInput(e.target.value)}
                  placeholder="Type complete detailed answer..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-teal-600/30"
                >
                  Save FAQ Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedFaq && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-extrabold text-white">{selectedFaq.question}</h3>
              </div>
              <button onClick={() => setSelectedFaq(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-teal-400 font-bold">Category: {selectedFaq.category} · Order: #{selectedFaq.display_order}</div>
                <div className="text-slate-400">Visibility: {selectedFaq.visibility} · Likes: 👍 {selectedFaq.helpful_likes}</div>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="text-white font-bold text-xs mb-1">Answer Details:</div>
                <p className="text-slate-300 text-xs leading-relaxed">{selectedFaq.answer}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedFaq(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Answer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
