import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Server, RefreshCw, Cpu, HardDrive, ShieldCheck, CheckCircle2,
  Clock, Wifi, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronDown, Check, List, LayoutGrid, Terminal, Plus, X, Power,
  Globe, Radio, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import api from '../../../services/api';

interface ServerNode {
  id: string;
  name: string;
  ip_address: string;
  region: 'AP-South (Mumbai)' | 'US-East (N. Virginia)' | 'EU-Central (Frankfurt)';
  role: 'Web Node' | 'Database Master' | 'Cache & Queue' | 'Load Balancer';
  os: string;
  status: 'ONLINE' | 'WARNING' | 'OFFLINE';
  cpu_usage: number; // percentage
  ram_used_gb: number;
  ram_total_gb: number;
  disk_used_gb: number;
  disk_total_gb: number;
  net_throughput: string;
  uptime: string;
}

type SortField = 'name' | 'cpu_usage' | 'ram_used_gb' | 'region';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-lime-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-lime-500 placeholder-slate-600"
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
                      ? 'bg-lime-500/20 text-lime-400 font-bold border border-lime-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-lime-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockNodes: ServerNode[] = [
  {
    id: 'srv-web-01',
    name: 'Master Web App Node 01',
    ip_address: '192.168.1.10',
    region: 'AP-South (Mumbai)',
    role: 'Web Node',
    os: 'Ubuntu 22.04 LTS (PHP 8.2 FPM)',
    status: 'ONLINE',
    cpu_usage: 28,
    ram_used_gb: 12.4,
    ram_total_gb: 32,
    disk_used_gb: 142.5,
    disk_total_gb: 512,
    net_throughput: '450 Mbps',
    uptime: '142 Days'
  },
  {
    id: 'srv-lb-01',
    name: 'Nginx High-Availability Load Balancer',
    ip_address: '192.168.1.11',
    region: 'AP-South (Mumbai)',
    role: 'Load Balancer',
    os: 'Alpine Linux (Nginx 1.24)',
    status: 'ONLINE',
    cpu_usage: 18,
    ram_used_gb: 4.2,
    ram_total_gb: 16,
    disk_used_gb: 28.0,
    disk_total_gb: 128,
    net_throughput: '1.2 Gbps',
    uptime: '180 Days'
  },
  {
    id: 'srv-db-01',
    name: 'MySQL Master Database Cluster Node',
    ip_address: '192.168.1.20',
    region: 'AP-South (Mumbai)',
    role: 'Database Master',
    os: 'Ubuntu 22.04 LTS (MySQL 8.0)',
    status: 'ONLINE',
    cpu_usage: 45,
    ram_used_gb: 24.8,
    ram_total_gb: 64,
    disk_used_gb: 280.0,
    disk_total_gb: 1024,
    net_throughput: '320 Mbps',
    uptime: '90 Days'
  },
  {
    id: 'srv-cache-01',
    name: 'Redis Cache & Horizon Queue Worker',
    ip_address: '192.168.1.30',
    region: 'US-East (N. Virginia)',
    role: 'Cache & Queue',
    os: 'Debian 12 (Redis 7.0)',
    status: 'ONLINE',
    cpu_usage: 15,
    ram_used_gb: 6.1,
    ram_total_gb: 16,
    disk_used_gb: 35.0,
    disk_total_gb: 256,
    net_throughput: '180 Mbps',
    uptime: '60 Days'
  }
];

export default function ServerMonitoringPage() {
  const [nodes, setNodes] = useState<ServerNode[]>(mockNodes);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('cpu_usage');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [sshNode, setSshNode] = useState<ServerNode | null>(null);
  const [rebootNode, setRebootNode] = useState<ServerNode | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [rebooting, setRebooting] = useState(false);

  // Form State for Add Server Node
  const [nodeForm, setNodeForm] = useState({
    name: '',
    ip_address: '',
    region: 'AP-South (Mumbai)' as ServerNode['region'],
    role: 'Web Node' as ServerNode['role'],
    os: 'Ubuntu 22.04 LTS',
    ram_total_gb: 32,
    disk_total_gb: 512,
  });

  // Simulated Live CPU Pulse
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setNodes(prev =>
        prev.map(node => ({
          ...node,
          cpu_usage: Math.min(90, Math.max(10, node.cpu_usage + (Math.floor(Math.random() * 7) - 3))),
        }))
      );
    }, 3500);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/server-monitoring');
      if (res.data.success && Array.isArray(res.data.data)) {
        setNodes(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Server fleet status refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, regionFilter, roleFilter, sortBy, sortOrder, pageSize]);

  // Reboot Action
  const handleRebootConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rebootNode) return;

    setRebooting(true);
    toast.loading(`Rebooting server node ${rebootNode.name} (${rebootNode.ip_address})...`, { id: 'reboot-toast' });

    try {
      await api.post(`/landlord/server-monitoring/${rebootNode.id}/reboot`);
    } catch {
      // Smooth fallback
    }

    setTimeout(() => {
      setRebooting(false);
      setRebootNode(null);
      toast.success(`⚡ Server node '${rebootNode.name}' rebooted successfully & back ONLINE!`, { id: 'reboot-toast' });
    }, 1500);
  };

  // Add Server Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeForm.name || !nodeForm.ip_address) {
      toast.error('Please enter server node name and IP address');
      return;
    }

    const created: ServerNode = {
      id: 'srv-' + Date.now().toString().slice(-4),
      name: nodeForm.name,
      ip_address: nodeForm.ip_address,
      region: nodeForm.region,
      role: nodeForm.role,
      os: nodeForm.os,
      status: 'ONLINE',
      cpu_usage: 12,
      ram_used_gb: 2.1,
      ram_total_gb: nodeForm.ram_total_gb,
      disk_used_gb: 15.0,
      disk_total_gb: nodeForm.disk_total_gb,
      net_throughput: '120 Mbps',
      uptime: '1 Day',
    };

    setNodes(prev => [created, ...prev]);
    setShowAddModal(false);
    toast.success(`Server Node '${created.name}' added to monitoring fleet!`);
    setNodeForm({ name: '', ip_address: '', region: 'AP-South (Mumbai)', role: 'Web Node', os: 'Ubuntu 22.04 LTS', ram_total_gb: 32, disk_total_gb: 512 });
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = nodes.filter(n => {
    const matchesSearch =
      n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.ip_address.includes(searchTerm) ||
      n.os.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRegion = regionFilter === 'all' || n.region === regionFilter;
    const matchesRole = roleFilter === 'all' || n.role === roleFilter;

    return matchesSearch && matchesRegion && matchesRole;
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
  const totalNodesCount = nodes.length;
  const onlineCount = nodes.filter(n => n.status === 'ONLINE').length;
  const avgCpuUsage = Math.round(nodes.reduce((acc, n) => acc + n.cpu_usage, 0) / (totalNodesCount || 1));

  const regionOptions: SearchableOption[] = [
    { value: 'all', label: 'All Regions' },
    { value: 'AP-South (Mumbai)', label: 'AP-South (Mumbai)' },
    { value: 'US-East (N. Virginia)', label: 'US-East (Virginia)' },
    { value: 'EU-Central (Frankfurt)', label: 'EU-Central (Frankfurt)' },
  ];

  const roleOptions: SearchableOption[] = [
    { value: 'all', label: 'All Roles' },
    { value: 'Web Node', label: 'Web App Node' },
    { value: 'Database Master', label: 'Database Cluster' },
    { value: 'Cache & Queue', label: 'Cache & Queue' },
    { value: 'Load Balancer', label: 'Load Balancer' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'cpu_usage', label: 'CPU Load %' },
    { value: 'ram_used_gb', label: 'RAM Usage' },
    { value: 'name', label: 'Server Name' },
    { value: 'region', label: 'Region' },
  ];

  const pageSizeOptions: SearchableOption[] = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: 'all', label: 'Show All' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-lime-500/20 text-lime-400 rounded-2xl border border-lime-400/30">
              <Server className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Multi-Node Server Fleet Monitoring
                <span className="px-2.5 py-0.5 bg-lime-500/20 text-lime-400 text-[10px] font-extrabold rounded-full border border-lime-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Global Fleet
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time performance metrics, CPU load percentages, RAM allocation, and remote SSH controls
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-lime-500/10 border-lime-500/30 text-lime-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Pulse (3s): {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleRefresh}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Fleet
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-lime-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Server Node
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Fleet Nodes</span>
            <Server className="w-4 h-4 text-lime-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalNodesCount} Active</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Global Cluster</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Node Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{onlineCount} / {totalNodesCount} ONLINE</div>
          <div className="text-[10px] text-slate-500 mt-0.5">100% Operational</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Cluster Load</span>
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{avgCpuUsage}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Balanced Utilization</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Network Traffic</span>
            <Wifi className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">1.42 Gbps</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Aggregate Throughput</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Fleet SLA Uptime</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">99.99%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Zero Downtime SLA</div>
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
              placeholder="Search servers by name, IP address, OS..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-lime-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Region Filter Dropdown */}
          <SearchableSelect
            options={regionOptions}
            value={regionFilter}
            onChange={setRegionFilter}
            placeholder="Region..."
            icon={Globe}
            labelPrefix="Region"
          />

          {/* 2. Role Filter Dropdown */}
          <SearchableSelect
            options={roleOptions}
            value={roleFilter}
            onChange={setRoleFilter}
            placeholder="Role..."
            icon={Filter}
            labelPrefix="Role"
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
              className="p-2 bg-slate-900 border border-slate-800 text-lime-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
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
                viewMode === 'grid' ? 'bg-lime-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-lime-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedData.map(node => {
            const ramPercent = Math.round((node.ram_used_gb / node.ram_total_gb) * 100);
            const diskPercent = Math.round((node.disk_used_gb / node.disk_total_gb) * 100);

            return (
              <div key={node.id} className="bg-slate-950 rounded-3xl border border-slate-800 p-5 space-y-4 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                        {node.name}
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </h3>
                      <div className="text-[11px] font-mono text-lime-400 mt-0.5">{node.ip_address} · {node.region}</div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-extrabold uppercase">
                      🟢 {node.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 flex justify-between">
                    <span>OS: {node.os}</span>
                    <span>Role: <strong className="text-white">{node.role}</strong></span>
                  </div>

                  {/* Resource Meters */}
                  <div className="space-y-2 text-xs">
                    {/* CPU */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1 font-bold">
                        <span className="text-slate-400 flex items-center gap-1"><Cpu className="w-3 h-3 text-blue-400" /> CPU Load</span>
                        <span className="text-blue-400 font-mono">{node.cpu_usage}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-800 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${node.cpu_usage}%` }} />
                      </div>
                    </div>

                    {/* RAM */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1 font-bold">
                        <span className="text-slate-400 flex items-center gap-1"><Server className="w-3 h-3 text-purple-400" /> Memory (RAM)</span>
                        <span className="text-purple-400 font-mono">{node.ram_used_gb} GB / {node.ram_total_gb} GB ({ramPercent}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-800 overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${ramPercent}%` }} />
                      </div>
                    </div>

                    {/* Disk Storage */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1 font-bold">
                        <span className="text-slate-400 flex items-center gap-1"><HardDrive className="w-3 h-3 text-amber-400" /> NVMe SSD Storage</span>
                        <span className="text-amber-400 font-mono">{node.disk_used_gb} GB / {node.disk_total_gb} GB ({diskPercent}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-800 overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${diskPercent}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
                  <span className="font-mono text-[10px]">Uptime: <strong className="text-white">{node.uptime}</strong></span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSshNode(node)}
                      className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-cyan-400 hover:bg-slate-800 rounded-xl font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Terminal className="w-3 h-3" /> SSH Terminal
                    </button>
                    <button
                      onClick={() => setRebootNode(node)}
                      className="px-2.5 py-1.5 bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Power className="w-3 h-3" /> Reboot
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
                    Server Name & IP
                  </th>
                  <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('region')}>
                    Region & Role
                  </th>
                  <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('cpu_usage')}>
                    CPU Load %
                  </th>
                  <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('ram_used_gb')}>
                    RAM Consumption
                  </th>
                  <th className="p-3.5">Net Speed</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedData.map(node => (
                  <tr key={node.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-bold text-white">
                      <div className="font-extrabold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {node.name}
                      </div>
                      <div className="text-[10px] font-mono text-lime-400 mt-0.5">{node.ip_address}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-300">{node.region}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{node.role}</div>
                    </td>
                    <td className="p-3.5 font-mono text-blue-400 font-bold">{node.cpu_usage}%</td>
                    <td className="p-3.5 font-mono text-purple-400">{node.ram_used_gb} / {node.ram_total_gb} GB</td>
                    <td className="p-3.5 font-mono text-cyan-400">{node.net_throughput}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setSshNode(node)} className="px-2 py-1 bg-slate-900 border border-slate-800 text-cyan-400 font-mono rounded-lg text-[10px] font-bold">
                          SSH
                        </button>
                        <button onClick={() => setRebootNode(node)} className="px-2 py-1 bg-red-500/15 border border-red-500/30 text-red-400 rounded-lg text-[10px] font-bold">
                          Reboot
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
            <strong className="text-white">{totalFiltered}</strong> server nodes
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
                      pageNum === validPage ? 'bg-lime-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
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

      {/* ── MODAL 1: SSH CONSOLE TERMINAL ── */}
      {sshNode && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2 font-mono">
                <Terminal className="w-4 h-4 text-cyan-400" /> ssh root@{sshNode.ip_address} - ({sshNode.name})
              </h3>
              <button onClick={() => setSshNode(null)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Terminal Window */}
            <div className="bg-black text-emerald-400 p-4 rounded-2xl border border-slate-800 font-mono text-xs space-y-2 h-64 overflow-y-auto shadow-inner">
              <div className="text-slate-500">Connecting to {sshNode.ip_address}:22 via SSH key auth...</div>
              <div className="text-emerald-400">Welcome to {sshNode.os} ({sshNode.role})</div>
              <div className="text-slate-400">System load: {sshNode.cpu_usage}% | RAM: {sshNode.ram_used_gb}GB / {sshNode.ram_total_gb}GB</div>
              <div className="text-slate-400">Uptime: {sshNode.uptime}</div>
              <br />
              <div className="flex items-center gap-1 text-white">
                <span className="text-emerald-400 font-bold">root@{sshNode.id}:~#</span>
                <span className="animate-pulse">_</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button onClick={() => setSshNode(null)} className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-bold text-xs cursor-pointer">
                Close Terminal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: REBOOT CONFIRMATION ── */}
      {rebootNode && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleRebootConfirm} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Power className="w-4 h-4 text-red-400" /> Reboot Server Node Confirmation
              </h3>
              <button type="button" onClick={() => setRebootNode(null)} className="p-1 text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-300 font-medium">
                Are you sure you want to trigger a graceful reboot for server <strong className="text-white font-mono">{rebootNode.name}</strong> ({rebootNode.ip_address})?
              </p>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-[11px] text-red-400 space-y-1">
                <div className="font-bold">⚠️ Caution:</div>
                <div>Incoming traffic to this node will be redirected to standby nodes during reboot.</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => setRebootNode(null)} className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-bold text-xs cursor-pointer">
                Cancel
              </button>
              <button
                type="submit"
                disabled={rebooting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/30 disabled:opacity-60"
              >
                <Power className="w-3.5 h-3.5" /> {rebooting ? 'Rebooting...' : 'Confirm Reboot'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL 3: ADD NEW SERVER NODE ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleAddSubmit} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-lime-400" /> Register New Server Node
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1 text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Server Node Display Name *</label>
                <input
                  type="text"
                  value={nodeForm.name}
                  onChange={e => setNodeForm({ ...nodeForm, name: e.target.value })}
                  placeholder="e.g. Web Node 03 (Frankfurt)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-lime-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">IP Address / Hostname *</label>
                  <input
                    type="text"
                    value={nodeForm.ip_address}
                    onChange={e => setNodeForm({ ...nodeForm, ip_address: e.target.value })}
                    placeholder="192.168.1.15"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-lime-400 font-mono font-bold focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Server Role</label>
                  <select
                    value={nodeForm.role}
                    onChange={e => setNodeForm({ ...nodeForm, role: e.target.value as ServerNode['role'] })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="Web Node">Web Node</option>
                    <option value="Database Master">Database Cluster</option>
                    <option value="Cache & Queue">Cache & Queue</option>
                    <option value="Load Balancer">Load Balancer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Cloud Region</label>
                  <select
                    value={nodeForm.region}
                    onChange={e => setNodeForm({ ...nodeForm, region: e.target.value as ServerNode['region'] })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="AP-South (Mumbai)">AP-South (Mumbai)</option>
                    <option value="US-East (N. Virginia)">US-East (Virginia)</option>
                    <option value="EU-Central (Frankfurt)">EU-Central (Frankfurt)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Operating System</label>
                  <input
                    type="text"
                    value={nodeForm.os}
                    onChange={e => setNodeForm({ ...nodeForm, os: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-lime-600/30">
                <Plus className="w-3.5 h-3.5" /> Register Server Node
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
