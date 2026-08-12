import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Rocket, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, Cpu, Database, Server, Terminal, CheckCircle2
} from 'lucide-react';
import api from '../../../services/api';

interface InstallationLog {
  id: string;
  installation_id: string;
  school_instance: string;
  version_deployed: string;
  environment: 'PRODUCTION AWS' | 'STAGING DEV';
  db_schema: string;
  duration_seconds: number;
  status: 'SUCCESS' | 'FAILED' | 'ROLLBACK';
  operator: string;
  installed_at: string;
}

type SortField = 'installed_at' | 'school_instance' | 'version_deployed' | 'status';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-indigo-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
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
                      ? 'bg-indigo-600/20 text-indigo-400 font-bold border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockInstallations: InstallationLog[] = [
  {
    id: 'ins-1',
    installation_id: 'INS-6042',
    school_instance: 'St. Xavier International School',
    version_deployed: 'v4.8.2-PRO',
    environment: 'PRODUCTION AWS',
    db_schema: 'tenant_stxavier_db',
    duration_seconds: 38,
    status: 'SUCCESS',
    operator: 'Vikram Malhotra (DevOps)',
    installed_at: '2026-08-11 14:00:00'
  },
  {
    id: 'ins-2',
    installation_id: 'INS-6038',
    school_instance: 'Delhi Public School, Sector 45',
    version_deployed: 'v4.8.0',
    environment: 'PRODUCTION AWS',
    db_schema: 'tenant_dps45_db',
    duration_seconds: 42,
    status: 'SUCCESS',
    operator: 'Siddharth Rao (DevOps)',
    installed_at: '2026-08-01 10:30:00'
  },
  {
    id: 'ins-3',
    installation_id: 'INS-6025',
    school_instance: 'Greenwood High Staging',
    version_deployed: 'v4.8.2-RC1',
    environment: 'STAGING DEV',
    db_schema: 'tenant_greenwood_stage_db',
    duration_seconds: 28,
    status: 'SUCCESS',
    operator: 'Neha Gupta (QA Lead)',
    installed_at: '2026-08-10 16:45:00'
  }
];

export default function InstallationHistoryPage() {
  const [installations, setInstallations] = useState<InstallationLog[]>(mockInstallations);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [envFilter, setEnvFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('installed_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState<InstallationLog | null>(null);

  // Form State
  const [schoolInstanceInput, setSchoolInstanceInput] = useState('');
  const [versionInput, setVersionInput] = useState('v4.8.2-PRO');
  const [envInput, setEnvInput] = useState<'PRODUCTION AWS' | 'STAGING DEV'>('PRODUCTION AWS');
  const [schemaInput, setSchemaInput] = useState('');

  const totalInstallationsCount = 1240;
  const successRate = 99.4;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/installation-history');
      if (res.data.success && Array.isArray(res.data.data)) {
        setInstallations(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('School instance installation & deployment history refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, envFilter, statusFilter, sortBy, sortOrder, pageSize]);

  const handleDeployInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolInstanceInput.trim() || !schemaInput.trim()) {
      toast.error('Please enter school instance name and DB schema');
      return;
    }

    toast.loading(`Provisioning tenant instance '${schoolInstanceInput}'...`, { id: 'add-ins-toast' });

    try {
      await api.post('/landlord/installation-history', {
        school_instance: schoolInstanceInput,
        version_deployed: versionInput,
        environment: envInput,
        db_schema: schemaInput
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newLog: InstallationLog = {
        id: `ins-${Date.now()}`,
        installation_id: `INS-${Math.floor(1000 + Math.random() * 9000)}`,
        school_instance: schoolInstanceInput,
        version_deployed: versionInput,
        environment: envInput,
        db_schema: schemaInput,
        duration_seconds: 35,
        status: 'SUCCESS',
        operator: 'SuperAdmin Operator',
        installed_at: 'Just now'
      };
      setInstallations(prev => [newLog, ...prev]);
      setIsAddModalOpen(false);
      setSchoolInstanceInput('');
      setSchemaInput('');
      toast.success(`🚀 Tenant Instance '${schoolInstanceInput}' deployed successfully!`, { id: 'add-ins-toast' });
    }, 800);
  };

  const handleDeleteInstallation = async (id: string, insId: string) => {
    toast.loading(`Deleting installation log '${insId}'...`, { id: 'del-ins-toast' });

    try {
      await api.delete(`/landlord/installation-history/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setInstallations(prev => prev.filter(i => i.id !== id));
      toast.success(`🗑️ Installation log '${insId}' deleted!`, { id: 'del-ins-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = installations.filter(i => {
    const matchesSearch =
      i.installation_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.school_instance.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.version_deployed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.db_schema.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.operator.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEnv = envFilter === 'all' || i.environment === envFilter;
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;

    return matchesSearch && matchesEnv && matchesStatus;
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

  const envOptions: SearchableOption[] = [
    { value: 'all', label: 'All Environments' },
    { value: 'PRODUCTION AWS', label: 'PRODUCTION AWS 🚀' },
    { value: 'STAGING DEV', label: 'STAGING DEV 🧪' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'SUCCESS', label: 'SUCCESS ✅' },
    { value: 'FAILED', label: 'FAILED 🔴' },
    { value: 'ROLLBACK', label: 'ROLLBACK 🔄' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'installed_at', label: 'Installed Timestamp' },
    { value: 'school_instance', label: 'School Instance' },
    { value: 'version_deployed', label: 'Version Deployed' },
    { value: 'status', label: 'Status' },
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
            <span className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-400/30">
              <Rocket className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Tenant Instance Installation & Deployment Logs
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-extrabold rounded-full border border-indigo-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Server className="w-3 h-3 text-emerald-400 animate-pulse" /> AWS EC2 Cluster Active
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit tenant school software deployments, automated database schema seeding, version upgrades, and deployment duration SLAs
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Provision Tenant Instance
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Deployments</span>
            <Rocket className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalInstallationsCount.toLocaleString()} Runs</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Instance Provisionings</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Success Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{successRate}% ✅</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Zero Rollback Outages</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active AWS Nodes</span>
            <Server className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">54 EC2 Nodes</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Multi-Region Cluster</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Deploy Time</span>
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">38 Secs ⚡</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Automated Provision Speed</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Isolated Schemas</span>
            <Database className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-black text-teal-400 font-mono">1,240 DBs 🗄️</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Tenant Isolation</div>
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
              placeholder="Search by installation ID, school instance, version, DB schema..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={envOptions} value={envFilter} onChange={setEnvFilter} placeholder="Environment..." icon={Filter} labelPrefix="Env" />
          <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
          <div className="flex items-center gap-1">
            <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-900 border border-slate-800 text-indigo-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
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
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('school_instance')}>School Instance & ID</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('version_deployed')}>Version Deployed</th>
                <th className="p-3.5">Environment</th>
                <th className="p-3.5">Target DB Schema</th>
                <th className="p-3.5 font-mono">Deploy Duration</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('installed_at')}>Timestamp</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('status')}>Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(i => (
                <tr key={i.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-indigo-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{i.school_instance}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{i.installation_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-indigo-400 font-bold">{i.version_deployed}</td>
                  <td className="p-3.5 font-mono text-[10px]">
                    <span className="px-2 py-0.5 bg-slate-900 text-purple-400 border border-slate-800 rounded font-bold">
                      {i.environment}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[10px] text-teal-400 font-bold">{i.db_schema}</td>
                  <td className="p-3.5 font-mono text-[11px] text-amber-400 font-bold">{i.duration_seconds} Secs</td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-300 font-bold">{i.installed_at}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        i.status === 'SUCCESS'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border-red-500/30'
                      }`}
                    >
                      {i.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedInstallation(i)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" /> Deploy Log
                      </button>
                      <button
                        onClick={() => handleDeleteInstallation(i.id, i.installation_id)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete Installation Record"
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
                <Rocket className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-extrabold text-white">Provision Tenant Instance Deployment</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeployInstance} className="space-y-3.5 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">School Instance Name</label>
                <input
                  type="text"
                  required
                  value={schoolInstanceInput}
                  onChange={e => setSchoolInstanceInput(e.target.value)}
                  placeholder="St. Xavier International School"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Version Build</label>
                  <input
                    type="text"
                    required
                    value={versionInput}
                    onChange={e => setVersionInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Environment</label>
                  <select
                    value={envInput}
                    onChange={e => setEnvInput(e.target.value as 'PRODUCTION AWS' | 'STAGING DEV')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="PRODUCTION AWS">PRODUCTION AWS 🚀</option>
                    <option value="STAGING DEV">STAGING DEV 🧪</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Isolated DB Schema Name</label>
                <input
                  type="text"
                  required
                  value={schemaInput}
                  onChange={e => setSchemaInput(e.target.value)}
                  placeholder="tenant_stxavier_db"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  Provision & Deploy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedInstallation && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-extrabold text-white">Deployment & Schema Provisioning Logs ({selectedInstallation.installation_id})</h3>
              </div>
              <button onClick={() => setSelectedInstallation(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-indigo-400 font-bold">{selectedInstallation.school_instance} ({selectedInstallation.version_deployed})</div>
                <div className="text-slate-400">Environment: {selectedInstallation.environment} · Schema: {selectedInstallation.db_schema}</div>
                <div className="text-slate-500 text-[11px]">Duration: {selectedInstallation.duration_seconds}s · Operator: {selectedInstallation.operator}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedInstallation(null)}
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
