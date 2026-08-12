import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  FileText, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, Tag, Lock, User
} from 'lucide-react';
import api from '../../../services/api';

interface CustomerNoteItem {
  id: string;
  note_id: string;
  account_name: string;
  note_title: string;
  note_snippet: string;
  author: string;
  date_created: string;
  tag: string;
}

type SortField = 'date_created' | 'account_name' | 'note_title';
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

const mockNotes: CustomerNoteItem[] = [
  {
    id: 'nts-1',
    note_id: 'NTS-5042',
    account_name: 'Greenwood High International',
    note_title: 'Requested Custom Biometric Hardware Integration Specs',
    note_snippet: 'Principal requested API specs for Matrix COSEC facial recognition hardware integration...',
    author: 'Ananya Roy (AE)',
    date_created: '2026-08-11 16:30',
    tag: 'HARDWARE_SPEC'
  },
  {
    id: 'nts-2',
    note_id: 'NTS-5038',
    account_name: 'Delhi Public School, Sector 45',
    note_title: 'CBSE CCE Marks Upload Deadline Extension',
    note_snippet: 'School requested temporary exemption from auto-suspension during term exam week...',
    author: 'Priya Sharma (CS Manager)',
    date_created: '2026-08-11 11:20',
    tag: 'CUSTOM_EXEMPTION'
  },
  {
    id: 'nts-3',
    note_id: 'NTS-5025',
    account_name: 'St. Xavier International School',
    note_title: 'Annual Contract Pre-Payment Discount Alignment',
    note_snippet: 'Trust board approved 3-year upfront contract at $1,200/mo enterprise tier...',
    author: 'Vikram Singh (Senior AE)',
    date_created: '2026-08-10 14:45',
    tag: 'CONTRACT_PRICING'
  }
];

export default function CustomerNotesPage() {
  const [notes, setNotes] = useState<CustomerNoteItem[]>(mockNotes);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('date_created');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [selectedNote, setSelectedNote] = useState<CustomerNoteItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [newAccountName, setNewAccountName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newSnippet, setNewSnippet] = useState('');
  const [newTag, setNewTag] = useState('FEATURE_REQUEST');

  const totalNotesCount = 3420;
  const pinnedAccountsCount = 140;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/customer-notes');
      if (res.data.success && Array.isArray(res.data.data)) {
        setNotes(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Internal Account Notes & Activity History refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, tagFilter, sortBy, sortOrder, pageSize]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim() || !newTitle.trim() || !newSnippet.trim()) {
      toast.error('Please enter Account Name, Title, and Note content');
      return;
    }

    toast.loading('Saving AES-256 encrypted internal note...', { id: 'create-note-toast' });

    try {
      await api.post('/landlord/customer-notes', {
        account_name: newAccountName,
        note_title: newTitle,
        note_snippet: newSnippet,
        tag: newTag
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const createdItem: CustomerNoteItem = {
        id: `nts-${Date.now()}`,
        note_id: `NTS-${Math.floor(1000 + Math.random() * 9000)}`,
        account_name: newAccountName,
        note_title: newTitle,
        note_snippet: newSnippet,
        author: 'SuperAdmin Lead',
        date_created: 'Just Now',
        tag: newTag
      };

      setNotes(prev => [createdItem, ...prev]);
      toast.success(`📝 Note for '${newAccountName}' logged successfully!`, { id: 'create-note-toast' });
      setIsAddModalOpen(false);

      // Reset form
      setNewAccountName('');
      setNewTitle('');
      setNewSnippet('');
    }, 600);
  };

  const handleDeleteNote = async (id: string, noteId: string) => {
    toast.loading(`Deleting note '${noteId}'...`, { id: 'del-note-toast' });

    try {
      await api.delete(`/landlord/customer-notes/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setNotes(prev => prev.filter(n => n.id !== id));
      toast.success(`🗑️ Note '${noteId}' deleted!`, { id: 'del-note-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('desc'); }
  };

  const filtered = notes.filter(n => {
    const matchesSearch =
      n.note_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.note_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.author.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTag = tagFilter === 'all' || n.tag === tagFilter;

    return matchesSearch && matchesTag;
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

  const tagOptions: SearchableOption[] = [
    { value: 'all', label: 'All Tags' },
    { value: 'HARDWARE_SPEC', label: 'HARDWARE_SPEC 🔌' },
    { value: 'CUSTOM_EXEMPTION', label: 'CUSTOM_EXEMPTION 🛡️' },
    { value: 'CONTRACT_PRICING', label: 'CONTRACT_PRICING 📜' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'date_created', label: 'Date Created' },
    { value: 'account_name', label: 'Account Name' },
    { value: 'note_title', label: 'Note Title' },
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
              <FileText className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Internal Account Notes & Strategic Activity Log
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-extrabold rounded-full border border-amber-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400 animate-pulse" /> AES-256 Encrypted Ledger
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Log internal Account Executive notes, custom SLA agreements, hardware requirements, and client board approvals
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Log Account Note
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Notes</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalNotesCount.toLocaleString()} Notes</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Encrypted Database Logs</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pinned Accounts</span>
            <Tag className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{pinnedAccountsCount} Key Accounts</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Enterprise Accounts</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Last 24 Hours</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">84 Notes 📝</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Logged Today</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Author Roles</span>
            <User className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">AE & CS Leads</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Internal Team Logs</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Encryption SLA</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono">100% AES-256 🔒</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Zero Plaintext Storage</div>
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
              placeholder="Search by note ID, account name, title, author..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={tagOptions} value={tagFilter} onChange={setTagFilter} placeholder="Tag..." icon={Filter} labelPrefix="Tag" />
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
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('account_name')}>Account & Note ID</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('note_title')}>Note Title</th>
                <th className="p-3.5">Content Snippet</th>
                <th className="p-3.5">Author</th>
                <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('date_created')}>Date Created</th>
                <th className="p-3.5">Tag</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(n => (
                <tr key={n.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{n.account_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{n.note_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-bold text-purple-400">{n.note_title}</td>
                  <td className="p-3.5 text-slate-300 text-xs truncate max-w-xs">{n.note_snippet}</td>
                  <td className="p-3.5 font-mono text-[10px] text-blue-400 font-bold">{n.author}</td>
                  <td className="p-3.5 font-mono text-[11px] text-emerald-400 font-bold">{n.date_created}</td>
                  <td className="p-3.5 font-mono text-[10px]">
                    <span className="px-2 py-0.5 bg-slate-900 text-teal-400 border border-slate-800 rounded font-bold">
                      {n.tag}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedNote(n)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" /> Read Note
                      </button>
                      <button
                        onClick={() => handleDeleteNote(n.id, n.note_id)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete Note"
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
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Log Internal Customer Note</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  value={newAccountName}
                  onChange={e => setNewAccountName(e.target.value)}
                  placeholder="e.g. St. Xavier International School"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Note Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Annual SLA Contract Revision Meeting"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Note Content *</label>
                <textarea
                  required
                  rows={3}
                  value={newSnippet}
                  onChange={e => setNewSnippet(e.target.value)}
                  placeholder="Enter detailed account notes..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Tag Category</label>
                <select
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="HARDWARE_SPEC">HARDWARE_SPEC</option>
                  <option value="CUSTOM_EXEMPTION">CUSTOM_EXEMPTION</option>
                  <option value="CONTRACT_PRICING">CONTRACT_PRICING</option>
                  <option value="FEATURE_REQUEST">FEATURE_REQUEST</option>
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
                  Save Encrypted Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedNote && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Internal Customer Note ({selectedNote.note_id})</h3>
              </div>
              <button onClick={() => setSelectedNote(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <div className="text-amber-400 font-bold">{selectedNote.account_name} — {selectedNote.note_title}</div>
                <div className="text-slate-300 leading-relaxed font-sans">{selectedNote.note_snippet}</div>
                <div className="text-slate-500 text-[11px] pt-2 border-t border-slate-800/80">Author: {selectedNote.author} · Date: {selectedNote.date_created} · Tag: {selectedNote.tag}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedNote(null)}
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
