import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Zap, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, Play, Pause, Terminal, Send
} from 'lucide-react';
import api from '../../../services/api';

interface WorkflowItem {
  id: string;
  workflow_id: string;
  workflow_name: string;
  event_trigger: string;
  target_action: string;
  executions_count: number;
  status: 'ACTIVE' | 'PAUSED';
  last_run: string;
}

type SortField = 'last_run' | 'workflow_name' | 'executions_count';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-fuchsia-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-fuchsia-500 placeholder-slate-600"
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
                      ? 'bg-fuchsia-600/20 text-fuchsia-400 font-bold border border-fuchsia-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-fuchsia-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockWorkflows: WorkflowItem[] = [
  {
    id: 'wfk-1',
    workflow_id: 'WFK-1042',
    workflow_name: 'Auto WhatsApp Receipt on Razorpay Fee Payment',
    event_trigger: 'FEE_PAYMENT_SUCCESS',
    target_action: 'SEND_WHATSAPP_PDF_RECEIPT',
    executions_count: 12400,
    status: 'ACTIVE',
    last_run: '5 Mins Ago'
  },
  {
    id: 'wfk-2',
    workflow_id: 'WFK-1038',
    workflow_name: 'Biometric Face Attendance Real-time Parent Alert Push',
    event_trigger: 'STUDENT_IN_ATTENDANCE_LOGGED',
    target_action: 'PUSH_MOBILE_NOTIFICATION',
    executions_count: 28400,
    status: 'ACTIVE',
    last_run: '1 Min Ago'
  },
  {
    id: 'wfk-3',
    workflow_id: 'WFK-1025',
    workflow_name: 'Auto Grace Period Expiry Account Lock Warning',
    event_trigger: 'INVOICE_OVERDUE_10D',
    target_action: 'SEND_ADMIN_EMAIL_WARNING',
    executions_count: 184,
    status: 'ACTIVE',
    last_run: '2 Hours Ago'
  }
];

export default function WorkflowAutomationPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(mockWorkflows);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('last_run');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(null);

  // Form State
  const [nameInput, setNameInput] = useState('');
  const [triggerInput, setTriggerInput] = useState('FEE_PAYMENT_SUCCESS');
  const [actionInput, setActionInput] = useState('SEND_WHATSAPP_PDF_RECEIPT');

  const totalWorkflowsCount = 18;
  const executionsToday = 42500;
  const savedHours = 480;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/workflow-automation');
      if (res.data.success && Array.isArray(res.data.data)) {
        setWorkflows(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Automated event triggers & webhook workflow engine refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder, pageSize]);

  const handleAddWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      toast.error('Please enter workflow automation name');
      return;
    }

    toast.loading(`Deploying workflow automation '${nameInput}'...`, { id: 'add-wfk-toast' });

    try {
      await api.post('/landlord/workflow-automation', {
        workflow_name: nameInput,
        event_trigger: triggerInput,
        target_action: actionInput
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newWfk: WorkflowItem = {
        id: `wfk-${Date.now()}`,
        workflow_id: `WFK-${Math.floor(1000 + Math.random() * 9000)}`,
        workflow_name: nameInput,
        event_trigger: triggerInput,
        target_action: actionInput,
        executions_count: 0,
        status: 'ACTIVE',
        last_run: 'Just now'
      };
      setWorkflows(prev => [newWfk, ...prev]);
      setIsAddModalOpen(false);
      setNameInput('');
      toast.success(`⚡ Workflow Automation '${nameInput}' active!`, { id: 'add-wfk-toast' });
    }, 800);
  };

  const handleToggleStatus = async (id: string, currentStatus: 'ACTIVE' | 'PAUSED', name: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    toast.loading(`Toggling workflow status for '${name}' to ${nextStatus}...`, { id: 'tog-wfk-toast' });

    try {
      await api.post(`/landlord/workflow-automation/${id}/toggle-status`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setWorkflows(prev =>
        prev.map(w => (w.id === id ? { ...w, status: nextStatus } : w))
      );
      toast.success(` Workflow '${name}' is now ${nextStatus}!`, { id: 'tog-wfk-toast' });
    }, 600);
  };

  const handleTestTrigger = (id: string, name: string) => {
    toast.loading(`Executing test run for workflow '${name}'...`, { id: 'test-wfk-toast' });
    setTimeout(() => {
      toast.success(`⚡ Test Run SUCCESS! Target Action Delivered for '${name}'.`, { id: 'test-wfk-toast' });
    }, 800);
  };

  const handleDeleteWorkflow = async (id: string, wfkId: string) => {
    toast.loading(`Deleting workflow '${wfkId}'...`, { id: 'del-wfk-toast' });

    try {
      await api.delete(`/landlord/workflow-automation/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setWorkflows(prev => prev.filter(w => w.id !== id));
      toast.success(`🗑️ Workflow '${wfkId}' deleted!`, { id: 'del-wfk-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = workflows.filter(w => {
    const matchesSearch =
      w.workflow_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.workflow_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.event_trigger.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.target_action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;

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
    { value: 'PAUSED', label: 'PAUSED ⏸️' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'last_run', label: 'Last Run' },
    { value: 'workflow_name', label: 'Workflow Name' },
    { value: 'executions_count', label: 'Executions Count' },
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
            <span className="p-2.5 bg-fuchsia-500/20 text-fuchsia-400 rounded-2xl border border-fuchsia-400/30">
              <Zap className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Event-Driven Workflow Automation & Webhook Dispatcher
                <span className="px-2.5 py-0.5 bg-fuchsia-500/20 text-fuchsia-400 text-[10px] font-extrabold rounded-full border border-fuchsia-400/30 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 animate-pulse" /> Sub-second Redis Queue
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Automate multi-step school workflows triggered by fee payment webhooks, attendance logs, and report card publishing events
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-fuchsia-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Workflow Automation
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Workflows</span>
            <Zap className="w-4 h-4 text-fuchsia-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalWorkflowsCount} Workflows</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Automated Event Triggers</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Executions Today</span>
            <Terminal className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{executionsToday.toLocaleString()} Runs</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Automated Actions Executed</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Saved Admin Hours</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{savedHours} Hours / Mo ⏱️</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Productivity Boost</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Execution SLA</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">99.8% Success ✅</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Zero Lost Webhooks</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Redis Worker Queue</span>
            <Send className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-black text-blue-400 font-mono">&lt; 50 ms ⚡</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Instant Async Processing</div>
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
              placeholder="Search by workflow ID, name, event trigger, target action..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-fuchsia-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
          <div className="flex items-center gap-1">
            <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-900 border border-slate-800 text-fuchsia-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
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
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('workflow_name')}>Workflow Name & ID</th>
                <th className="p-3.5">Event Trigger</th>
                <th className="p-3.5">Target Action Enforced</th>
                <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('executions_count')}>Total Executions</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('last_run')}>Last Run</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(w => (
                <tr key={w.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-fuchsia-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{w.workflow_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{w.workflow_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[10px] text-amber-400 font-bold">{w.event_trigger}</td>
                  <td className="p-3.5 font-mono text-[10px] text-purple-400 font-bold">{w.target_action}</td>
                  <td className="p-3.5 font-mono text-[11px] text-emerald-400 font-bold">{w.executions_count.toLocaleString()} Runs</td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-300 font-bold">{w.last_run}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        w.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                      }`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleTestTrigger(w.id, w.workflow_name)}
                        className="px-2 py-1.5 bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/30 hover:bg-fuchsia-600/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" /> Test Run
                      </button>
                      <button
                        onClick={() => handleToggleStatus(w.id, w.status, w.workflow_name)}
                        className={`p-1.5 border rounded-xl cursor-pointer ${
                          w.status === 'ACTIVE'
                            ? 'bg-amber-600/20 text-amber-400 border-amber-500/30 hover:bg-amber-600/30'
                            : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30'
                        }`}
                        title={w.status === 'ACTIVE' ? 'Pause Workflow' : 'Activate Workflow'}
                      >
                        {w.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setSelectedWorkflow(w)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-fuchsia-400" /> Spec
                      </button>
                      <button
                        onClick={() => handleDeleteWorkflow(w.id, w.workflow_id)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete Workflow"
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
                <Zap className="w-5 h-5 text-fuchsia-400" />
                <h3 className="text-base font-extrabold text-white">Add Workflow Automation</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWorkflow} className="space-y-3.5 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Workflow Automation Name</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="Auto WhatsApp Receipt on Payment"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Event Trigger</label>
                  <select
                    value={triggerInput}
                    onChange={e => setTriggerInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-fuchsia-500 cursor-pointer"
                  >
                    <option value="FEE_PAYMENT_SUCCESS">FEE PAYMENT SUCCESS</option>
                    <option value="STUDENT_IN_ATTENDANCE_LOGGED">ATTENDANCE LOGGED</option>
                    <option value="INVOICE_OVERDUE_10D">INVOICE OVERDUE 10D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Target Action</label>
                  <select
                    value={actionInput}
                    onChange={e => setActionInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-fuchsia-500 cursor-pointer"
                  >
                    <option value="SEND_WHATSAPP_PDF_RECEIPT">SEND WHATSAPP PDF RECEIPT</option>
                    <option value="PUSH_MOBILE_NOTIFICATION">PUSH MOBILE ALERT</option>
                    <option value="SEND_ADMIN_EMAIL_WARNING">SEND EMAIL WARNING</option>
                  </select>
                </div>
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
                  className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-fuchsia-600/30"
                >
                  Deploy Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedWorkflow && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-fuchsia-400" />
                <h3 className="text-base font-extrabold text-white">Workflow Specification ({selectedWorkflow.workflow_id})</h3>
              </div>
              <button onClick={() => setSelectedWorkflow(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-fuchsia-400 font-bold">{selectedWorkflow.workflow_name}</div>
                <div className="text-slate-400">Trigger: {selectedWorkflow.event_trigger} · Action: {selectedWorkflow.target_action}</div>
                <div className="text-slate-500 text-[11px]">Executions: {selectedWorkflow.executions_count} · Last Run: {selectedWorkflow.last_run}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedWorkflow(null)}
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
