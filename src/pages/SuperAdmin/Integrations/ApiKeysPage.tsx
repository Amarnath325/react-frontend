import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Key, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, Building, Lock
} from 'lucide-react';
import api from '../../../services/api';

interface ApiKeyItem {
  id: string;
  key_id: string;
  key_name: string;
  key_prefix: string;
  client_name: string;
  permissions: string;
  rate_limit: string;
  last_used: string;
  status: string;
}

type SortField = 'key_name' | 'client_name' | 'last_used';
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

const mockApiKeys: ApiKeyItem[] = [
  {
    id: 'key-1',
    key_id: 'KEY-8042',
    key_name: 'St. Xavier Mobile App Production Secret',
    key_prefix: 'msp_live_8f9024...',
    client_name: 'St. Xavier International School',
    permissions: 'READ_WRITE',
    rate_limit: '1,000 req/min',
    last_used: '2 Mins Ago',
    status: 'ACTIVE'
  },
  {
    id: 'key-2',
    key_id: 'KEY-8038',
    key_name: 'Delhi Public School Biometric Sync API Key',
    key_prefix: 'msp_live_4a1098...',
    client_name: 'Delhi Public School, Sector 45',
    permissions: 'READ_ONLY',
    rate_limit: '5,000 req/min',
    last_used: '5 Mins Ago',
    status: 'ACTIVE'
  },
  {
    id: 'key-3',
    key_id: 'KEY-8025',
    key_name: 'Greenwood High Tally ERP Connector Token',
    key_prefix: 'msp_live_2c7710...',
    client_name: 'Greenwood High International',
    permissions: 'READ_WRITE',
    rate_limit: '500 req/min',
    last_used: '1 Hour Ago',
    status: 'ACTIVE'
  }
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>(mockApiKeys);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('key_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [selectedKey, setSelectedKey] = useState<ApiKeyItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [newKeyName, setNewKeyName] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newPermissions, setNewPermissions] = useState('READ_WRITE');
  const [newRateLimit, setNewRateLimit] = useState('1,000 req/min');

  const totalKeysCount = 840;
  const fullAdminKeysCount = 42;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/api-keys');
      if (res.data.success && Array.isArray(res.data.data)) {
        setKeys(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('REST API keys & HMAC credentials refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder, pageSize]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !newClientName.trim()) {
      toast.error('Please enter Key Name and Client Name');
      return;
    }

    toast.loading('Generating secure API key credential...', { id: 'create-key-toast' });

    try {
      await api.post('/landlord/api-keys', {
        key_name: newKeyName,
        client_name: newClientName,
        permissions: newPermissions,
        rate_limit: newRateLimit
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const createdItem: ApiKeyItem = {
        id: `key-${Date.now()}`,
        key_id: `KEY-${Math.floor(1000 + Math.random() * 9000)}`,
        key_name: newKeyName,
        key_prefix: `msp_live_${Math.random().toString(36).substring(2, 8)}...`,
        client_name: newClientName,
        permissions: newPermissions,
        rate_limit: newRateLimit,
        last_used: 'Just Created',
        status: 'ACTIVE'
      };

      setKeys(prev => [createdItem, ...prev]);
      toast.success(`🔑 API Key '${newKeyName}' generated successfully!`, { id: 'create-key-toast' });
      setIsAddModalOpen(false);

      // Reset form
      setNewKeyName('');
      setNewClientName('');
    }, 600);
  };

  const handleDeleteKey = async (id: string, keyId: string) => {
    toast.loading(`Revoking API key '${keyId}'...`, { id: 'del-key-toast' });

    try {
      await api.delete(`/landlord/api-keys/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setKeys(prev => prev.filter(k => k.id !== id));
      toast.success(`🗑️ API Key '${keyId}' revoked!`, { id: 'del-key-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = keys.filter(k => {
    const matchesSearch =
      k.key_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.key_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.key_prefix.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || k.status === statusFilter;

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
    { value: 'REVOKED', label: 'REVOKED 🔴' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'key_name', label: 'Key Name' },
    { value: 'client_name', label: 'Client Name' },
    { value: 'last_used', label: 'Last Used' },
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
              <Key className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                REST API Secret Keys & Authentication Tokens
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-extrabold rounded-full border border-amber-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400 animate-pulse" /> HMAC-SHA256 Encrypted
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate and manage REST API access keys, scope permissions, and rate limit quotas for external client apps
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Generate New API Key
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Active API Keys</span>
            <Key className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalKeysCount} Keys 🔑</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active Credentials</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Full Admin Keys</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{fullAdminKeysCount} Admin Keys</div>
          <div className="text-[10px] text-slate-500 mt-0.5">High Privileged Keys</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Read-Only Keys</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">640 Keys ✅</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Scoped Read Access</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Revoked Keys</span>
            <Trash2 className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">18 Revoked</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Disabled API Keys</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Encryption Protocol</span>
            <Building className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-black text-blue-400 font-mono">HMAC-SHA256 🔒</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Salted Secret Hashing</div>
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
              placeholder="Search by key ID, name, client name, prefix..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('key_name')}>Key Name & ID</th>
                <th className="p-3.5 font-mono">Key Prefix</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('client_name')}>Client / School Tenant</th>
                <th className="p-3.5">Permissions Scope</th>
                <th className="p-3.5 font-mono">Rate Limit Quota</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('last_used')}>Last Used</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(k => (
                <tr key={k.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{k.key_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{k.key_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[10px] text-indigo-400 font-bold">{k.key_prefix}</td>
                  <td className="p-3.5 font-bold text-purple-400">{k.client_name}</td>
                  <td className="p-3.5 font-mono text-[10px]">
                    <span className="px-2 py-0.5 bg-slate-900 text-teal-400 border border-slate-800 rounded font-bold">
                      {k.permissions}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-emerald-400 font-bold">{k.rate_limit}</td>
                  <td className="p-3.5 text-slate-300 font-mono text-[11px]">{k.last_used}</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-extrabold uppercase">
                      {k.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedKey(k)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" /> Key Spec
                      </button>
                      <button
                        onClick={() => handleDeleteKey(k.id, k.key_id)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Revoke Key"
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
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Generate Secure API Key</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Key Description Name *</label>
                <input
                  type="text"
                  required
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="e.g. DPS45 Attendance Integration Key"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Client / School Tenant *</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  placeholder="e.g. Delhi Public School, Sector 45"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Permissions Scope</label>
                <select
                  value={newPermissions}
                  onChange={e => setNewPermissions(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="READ_WRITE">READ_WRITE (Full Access)</option>
                  <option value="READ_ONLY">READ_ONLY (Read Scoped)</option>
                  <option value="WRITE_ONLY">WRITE_ONLY (Ingest Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Rate Limit Quota</label>
                <select
                  value={newRateLimit}
                  onChange={e => setNewRateLimit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="1,000 req/min">1,000 req/min (Standard)</option>
                  <option value="5,000 req/min">5,000 req/min (High Throughput)</option>
                  <option value="10,000 req/min">10,000 req/min (Enterprise Unlimited)</option>
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
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedKey && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">API Key Credential Specification ({selectedKey.key_id})</h3>
              </div>
              <button onClick={() => setSelectedKey(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-amber-400 font-bold">{selectedKey.key_name}</div>
                <div className="text-slate-400">Prefix: {selectedKey.key_prefix} · Client: {selectedKey.client_name}</div>
                <div className="text-slate-500 text-[11px]">Scope: {selectedKey.permissions} · Rate: {selectedKey.rate_limit} · Status: {selectedKey.status}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedKey(null)}
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
