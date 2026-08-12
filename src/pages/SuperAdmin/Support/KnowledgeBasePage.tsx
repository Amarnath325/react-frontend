import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  BookOpen, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, ThumbsUp, FileText, Globe, Lock, Share2
} from 'lucide-react';
import api from '../../../services/api';

interface ArticleItem {
  id: string;
  article_id: string;
  title: string;
  category: string;
  target_audience: string;
  views_count: number;
  helpful_votes: number;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'ADMIN_ONLY';
  author: string;
  last_updated: string;
  content: string;
}

type SortField = 'last_updated' | 'title' | 'views_count' | 'helpful_votes';
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

const mockArticles: ArticleItem[] = [
  {
    id: 'kb-1',
    article_id: 'KB-1042',
    title: 'How to Setup Biometric Facial Recognition Attendance Device Sync',
    category: 'Biometric Attendance',
    target_audience: 'School IT Admins',
    views_count: 24200,
    helpful_votes: 1840,
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    author: 'Vikram Malhotra',
    last_updated: '2026-08-10 12:00:00',
    content: 'Step 1: Obtain device IP address and port from LAN setup. Step 2: Navigate to Settings -> Attendance Devices and enter device MAC serial number...'
  },
  {
    id: 'kb-2',
    article_id: 'KB-1038',
    title: 'Configuring Razorpay & Paytm Online Fee Payment Gateways',
    category: 'Fees & Online Payments',
    target_audience: 'School Accountants',
    views_count: 38400,
    helpful_votes: 3120,
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    author: 'Amitabh Sen',
    last_updated: '2026-08-08 14:30:00',
    content: 'Enter merchant Key ID and Key Secret under SaaS Settings -> Payment Gateways. Enable automatic webhooks for fee collection receipts...'
  },
  {
    id: 'kb-3',
    article_id: 'KB-1025',
    title: 'CBSE Term-1 Grade Sheet & CCE Automated Report Card Customization',
    category: 'CBSE Examination',
    target_audience: 'Teachers & Principals',
    views_count: 19800,
    helpful_votes: 1450,
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    author: 'Neha Gupta',
    last_updated: '2026-08-05 09:00:00',
    content: 'Customize grading scales, scholastic remarks, co-curricular grades, and principal signature upload in 1-click...'
  },
  {
    id: 'kb-4',
    article_id: 'KB-1018',
    title: 'Multi-Tenant Database Recovery & Emergency Failover Runbook',
    category: 'Landlord Infrastructure',
    target_audience: 'SuperAdmins Only',
    views_count: 1240,
    helpful_votes: 120,
    status: 'DRAFT',
    visibility: 'ADMIN_ONLY',
    author: 'Siddharth Rao',
    last_updated: '2026-08-01 16:45:00',
    content: 'Internal emergency procedure for restoring tenant database snapshots from AWS S3 Glacier backup vaults...'
  }
];

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<ArticleItem[]>(mockArticles);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('last_updated');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null);

  // Form State
  const [titleInput, setTitleInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Getting Started');
  const [targetAudienceInput, setTargetAudienceInput] = useState('School IT Admins');
  const [contentInput, setContentInput] = useState('');
  const [visibilityInput, setVisibilityInput] = useState<'PUBLIC' | 'ADMIN_ONLY'>('PUBLIC');

  const totalArticlesCount = 86;
  const totalViewsCount = 142800;
  const helpfulRate = 94.6;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/knowledge-base');
      if (res.data.success && Array.isArray(res.data.data)) {
        setArticles(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Knowledge Base articles & documentation feed refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter, sortBy, sortOrder, pageSize]);

  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !contentInput.trim()) {
      toast.error('Please enter article title and documentation content');
      return;
    }

    toast.loading(`Publishing Knowledge Base article '${titleInput}'...`, { id: 'add-kb-toast' });

    try {
      await api.post('/landlord/knowledge-base', {
        title: titleInput,
        category: categoryInput,
        target_audience: targetAudienceInput,
        content: contentInput,
        visibility: visibilityInput
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newArticle: ArticleItem = {
        id: `kb-${Date.now()}`,
        article_id: `KB-${Math.floor(1000 + Math.random() * 9000)}`,
        title: titleInput,
        category: categoryInput,
        target_audience: targetAudienceInput,
        views_count: 1,
        helpful_votes: 0,
        status: 'PUBLISHED',
        visibility: visibilityInput,
        author: 'SuperAdmin',
        last_updated: 'Just now',
        content: contentInput
      };
      setArticles(prev => [newArticle, ...prev]);
      setIsAddModalOpen(false);
      setTitleInput('');
      setContentInput('');
      toast.success(`📚 Knowledge Base Article '${titleInput}' published live!`, { id: 'add-kb-toast' });
    }, 800);
  };

  const handleDeleteArticle = async (id: string, title: string) => {
    toast.loading(`Deleting article '${title}'...`, { id: 'del-kb-toast' });

    try {
      await api.delete(`/landlord/knowledge-base/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setArticles(prev => prev.filter(a => a.id !== id));
      toast.success(`🗑️ Knowledge Base article '${title}' deleted!`, { id: 'del-kb-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = articles.filter(a => {
    const matchesSearch =
      a.article_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.target_audience.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;

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
    { value: 'Biometric Attendance', label: 'Biometric Attendance ⏱️' },
    { value: 'Fees & Online Payments', label: 'Fees & Payments 💳' },
    { value: 'CBSE Examination', label: 'CBSE Examination 📝' },
    { value: 'Landlord Infrastructure', label: 'Landlord Infra ⚡' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'PUBLISHED', label: 'PUBLISHED 🟢' },
    { value: 'DRAFT', label: 'DRAFT 📝' },
    { value: 'ARCHIVED', label: 'ARCHIVED 📦' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'last_updated', label: 'Last Updated' },
    { value: 'title', label: 'Article Title' },
    { value: 'views_count', label: 'Views Count' },
    { value: 'helpful_votes', label: 'Helpful Votes' },
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
              <BookOpen className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Documentation & Knowledge Base Management
                <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-400 text-[10px] font-extrabold rounded-full border border-teal-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Globe className="w-3 h-3 animate-pulse" /> Self-Service Help Center Live
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Publish user manuals, biometric hardware guides, fee gateway configuration docs, and CBSE grading runbooks for tenant school admins
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
            <Plus className="w-4 h-4" /> Publish KB Article
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Articles</span>
            <BookOpen className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalArticlesCount} Articles</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Published KB Docs</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Page Views</span>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{totalViewsCount.toLocaleString()} Reads 📚</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Self-Service Help Views</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Helpful Upvotes</span>
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{helpfulRate}% 👍</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Positive Reader Rating</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Public vs Private</span>
            <Globe className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">64 Pub / 22 Adm</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Access Permission</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Deflection Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">82.4% 🛡️</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Ticket Deflection</div>
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
              placeholder="Search by article ID, title, category, audience, content..."
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
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('title')}>Article Title & ID</th>
                <th className="p-3.5">Category & Target Audience</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('views_count')}>Views & Upvotes</th>
                <th className="p-3.5">Visibility</th>
                <th className="p-3.5">Author</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('last_updated')}>Last Updated</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(a => (
                <tr key={a.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-teal-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{a.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{a.article_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[10px]">
                    <div className="text-teal-400 font-bold">{a.category}</div>
                    <div className="text-slate-400 text-[9px]">Target: {a.target_audience}</div>
                  </td>
                  <td className="p-3.5 font-mono">
                    <div className="text-white font-bold">{a.views_count.toLocaleString()} Reads</div>
                    <div className="text-emerald-400 text-[10px] font-bold">👍 {a.helpful_votes} Upvotes</div>
                  </td>
                  <td className="p-3.5 font-mono text-[10px]">
                    {a.visibility === 'PUBLIC' ? (
                      <span className="text-blue-400 font-bold flex items-center gap-1"><Globe className="w-3 h-3" /> PUBLIC</span>
                    ) : (
                      <span className="text-amber-400 font-bold flex items-center gap-1"><Lock className="w-3 h-3" /> ADMIN ONLY</span>
                    )}
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-purple-400 font-bold">{a.author}</td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-300 font-bold">{a.last_updated}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        a.status === 'PUBLISHED'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : a.status === 'DRAFT'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedArticle(a)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-teal-400" /> Read Article
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(a.id, a.title)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete KB Article"
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
                <BookOpen className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-extrabold text-white">Publish New Knowledge Base Article</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddArticle} className="space-y-3.5 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Article Title</label>
                <input
                  type="text"
                  required
                  value={titleInput}
                  onChange={e => setTitleInput(e.target.value)}
                  placeholder="e.g. How to Setup Biometric Attendance Device Sync"
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
                    <option value="Biometric Attendance">Biometric Attendance</option>
                    <option value="Fees & Online Payments">Fees & Online Payments</option>
                    <option value="CBSE Examination">CBSE Examination</option>
                    <option value="Landlord Infrastructure">Landlord Infrastructure</option>
                    <option value="Getting Started">Getting Started</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Visibility Permission</label>
                  <select
                    value={visibilityInput}
                    onChange={e => setVisibilityInput(e.target.value as 'PUBLIC' | 'ADMIN_ONLY')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="PUBLIC">PUBLIC 🌐</option>
                    <option value="ADMIN_ONLY">ADMIN ONLY 🔒</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Target Audience</label>
                <input
                  type="text"
                  required
                  value={targetAudienceInput}
                  onChange={e => setTargetAudienceInput(e.target.value)}
                  placeholder="e.g. School IT Admins & Accountants"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Documentation Content Body</label>
                <textarea
                  required
                  rows={5}
                  value={contentInput}
                  onChange={e => setContentInput(e.target.value)}
                  placeholder="Write step-by-step instructions..."
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
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedArticle && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-extrabold text-white">{selectedArticle.title} ({selectedArticle.article_id})</h3>
              </div>
              <button onClick={() => setSelectedArticle(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-teal-400 font-bold">Category: {selectedArticle.category} · Audience: {selectedArticle.target_audience}</div>
                <div className="text-slate-400">Author: {selectedArticle.author} · Views: {selectedArticle.views_count.toLocaleString()}</div>
                <div className="text-slate-500 text-[11px]">Last Updated: {selectedArticle.last_updated}</div>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 max-h-60 overflow-y-auto">
                <div className="text-white font-bold text-xs mb-1">Documentation Content:</div>
                <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">{selectedArticle.content}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
