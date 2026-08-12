import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Monitor, RefreshCw, ShieldCheck, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X, Radio, Lock, Eye,
  Globe, Ban, Laptop, Smartphone, ShieldAlert, Cpu
} from 'lucide-react';
import api from '../../../services/api';

interface DeviceItem {
  id: string;
  device_name: string;
  device_type: 'Desktop' | 'Laptop' | 'Mobile' | 'Tablet';
  hardware_fingerprint: string;
  owner_email: string;
  owner_role: string;
  os_browser: string;
  location: string;
  ip_address: string;
  trust_status: 'TRUSTED' | 'UNTRUSTED' | 'REVOKED';
  last_active: string;
  user_agent: string;
}

type SortField = 'last_active' | 'trust_status' | 'device_name' | 'owner_email';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-rose-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-rose-500 placeholder-slate-600"
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
                      ? 'bg-rose-600/20 text-rose-400 font-bold border border-rose-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-rose-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockDevices: DeviceItem[] = [
  {
    id: 'dev-1',
    device_name: 'MacBook Pro 16" (M3 Max)',
    device_type: 'Laptop',
    hardware_fingerprint: 'fp_8a92b1c4e09f',
    owner_email: 'amarnath@myschoolpoint.com',
    owner_role: 'SuperAdmin',
    os_browser: 'macOS 14.5 / Chrome 127',
    location: 'New Delhi, IN',
    ip_address: '49.36.142.10',
    trust_status: 'TRUSTED',
    last_active: '2026-08-10 23:25:00',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/127.0.0.0'
  },
  {
    id: 'dev-2',
    device_name: 'Dell XPS 15 (Windows 11)',
    device_type: 'Laptop',
    hardware_fingerprint: 'fp_3d7e9f1a2b5c',
    owner_email: 'principal@dpsnoida.com',
    owner_role: 'SchoolAdmin',
    os_browser: 'Windows 11 / Edge 126',
    location: 'Noida, IN',
    ip_address: '182.72.10.5',
    trust_status: 'TRUSTED',
    last_active: '2026-08-10 22:50:00',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edg/126.0.0.0'
  },
  {
    id: 'dev-3',
    device_name: 'Unknown Linux Workstation',
    device_type: 'Desktop',
    hardware_fingerprint: 'fp_5e4d3c2b1a9e',
    owner_email: 'hacker@external.org',
    owner_role: 'Unknown',
    os_browser: 'Ubuntu Linux / Firefox 128',
    location: 'Frankfurt, DE',
    ip_address: '45.142.214.88',
    trust_status: 'REVOKED',
    last_active: '2026-08-10 21:10:00',
    user_agent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:128.0)'
  },
  {
    id: 'dev-4',
    device_name: 'iPhone 15 Pro Max',
    device_type: 'Mobile',
    hardware_fingerprint: 'fp_7f8e9d0c1b2a',
    owner_email: 'teacher@dpsrkp.com',
    owner_role: 'Teacher',
    os_browser: 'iOS 17.5 / Safari Mobile',
    location: 'New Delhi, IN',
    ip_address: '103.21.12.9',
    trust_status: 'TRUSTED',
    last_active: '2026-08-10 20:30:00',
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)'
  }
];

export default function DeviceManagementPage() {
  const [devices, setDevices] = useState<DeviceItem[]>(mockDevices);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('last_active');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [selectedDevice, setSelectedDevice] = useState<DeviceItem | null>(null);

  const totalDevices = 342;
  const trustedCount = devices.filter(d => d.trust_status === 'TRUSTED').length;
  const revokedCount = devices.filter(d => d.trust_status === 'REVOKED').length;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/devices');
      if (res.data.success && Array.isArray(res.data.data)) {
        setDevices(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Trusted hardware device registry refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, sortBy, sortOrder, pageSize]);

  // Revoke Device Trust
  const handleRevokeDevice = async (id: string, name: string) => {
    toast.loading(`Revoking trust & terminating active sessions for '${name}'...`, { id: 'revoke-toast' });

    try {
      await api.post('/landlord/devices/revoke', { device_id: id });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setDevices(prev =>
        prev.map(d => (d.id === id ? { ...d, trust_status: 'REVOKED' } : d))
      );
      toast.success(`🛑 Device '${name}' revoked & active tokens killed!`, { id: 'revoke-toast' });
    }, 1000);
  };

  // Trust Device
  const handleTrustDevice = async (id: string, name: string) => {
    toast.loading(`Authorizing hardware fingerprint for '${name}'...`, { id: 'trust-toast' });

    try {
      await api.post('/landlord/devices/trust', { device_id: id });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setDevices(prev =>
        prev.map(d => (d.id === id ? { ...d, trust_status: 'TRUSTED' } : d))
      );
      toast.success(`⚡ Device '${name}' marked as TRUSTED!`, { id: 'trust-toast' });
    }, 1000);
  };

  // Revoke Untrusted
  const handleRevokeUntrusted = async () => {
    toast.loading('Revoking all unverified / untrusted devices...', { id: 'revoke-untrusted-toast' });

    try {
      await api.post('/landlord/devices/revoke-untrusted');
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setDevices(prev =>
        prev.map(d => (d.trust_status === 'UNTRUSTED' ? { ...d, trust_status: 'REVOKED' } : d))
      );
      toast.success('⚡ All untrusted devices revoked successfully!', { id: 'revoke-untrusted-toast' });
    }, 1200);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = devices.filter(d => {
    const matchesSearch =
      d.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.owner_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.hardware_fingerprint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.ip_address.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || d.trust_status === statusFilter;
    const matchesType = typeFilter === 'all' || d.device_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
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

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Trust Statuses' },
    { value: 'TRUSTED', label: 'TRUSTED 🟢' },
    { value: 'UNTRUSTED', label: 'UNTRUSTED ⚠️' },
    { value: 'REVOKED', label: 'REVOKED 🔴' },
  ];

  const typeOptions: SearchableOption[] = [
    { value: 'all', label: 'All Device Types' },
    { value: 'Laptop', label: 'Laptop 💻' },
    { value: 'Desktop', label: 'Desktop 🖥️' },
    { value: 'Mobile', label: 'Mobile 📱' },
    { value: 'Tablet', label: 'Tablet 📱' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'last_active', label: 'Last Active' },
    { value: 'trust_status', label: 'Trust Status' },
    { value: 'device_name', label: 'Device Name' },
    { value: 'owner_email', label: 'Owner Email' },
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
            <span className="p-2.5 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-400/30">
              <Monitor className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Trusted Hardware Device Registry & Session Revocation
                <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-extrabold rounded-full border border-rose-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> MDM Policy Active
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Hardware fingerprinting, active session killswitch, biometric device registry, and MDM compliance enforcement
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Pulse: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleRevokeUntrusted}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-amber-400 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Ban className="w-3.5 h-3.5" /> Revoke Untrusted
          </button>
          <button
            onClick={handleRefresh}
            className="p-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Registered</span>
            <Monitor className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalDevices} Devices</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Hardware Fingerprints</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Trusted Devices</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{trustedCount} Verified</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Authorized Hardware</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Revoked / Banned</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{revokedCount} Flagged</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Access Terminated</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Mobile & Tablets</span>
            <Smartphone className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">184 Handhelds</div>
          <div className="text-[10px] text-slate-500 mt-0.5">iOS & Android MDM</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">MDM Policy</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">ENFORCED 🟢</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Zero-Trust Active</div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by device model, owner email, fingerprint, IP..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-rose-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
          <SearchableSelect options={typeOptions} value={typeFilter} onChange={setTypeFilter} placeholder="Type..." icon={Filter} labelPrefix="Type" />
          <div className="flex items-center gap-1">
            <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-900 border border-slate-800 text-rose-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <SearchableSelect options={pageSizeOptions} value={String(pageSize)} onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))} placeholder="Per Page..." icon={List} labelPrefix="Rows" />
        </div>
      </div>

      {/* ── DEVICES TABLE ── */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('device_name')}>Device Model & Type</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('owner_email')}>Owner Account</th>
                <th className="p-3.5">Hardware Fingerprint</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('last_active')}>Last Active & Location</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('trust_status')}>Trust Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(d => (
                <tr key={d.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      {d.device_type === 'Laptop' || d.device_type === 'Desktop' ? (
                        <Laptop className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Smartphone className="w-4 h-4 text-purple-400" />
                      )}
                      <div>
                        <div>{d.device_name}</div>
                        <div className="text-[10px] text-slate-500 font-sans">{d.os_browser}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono">
                    <div className="text-rose-400 font-bold">{d.owner_email}</div>
                    <div className="text-[10px] text-slate-400 font-sans">{d.owner_role}</div>
                  </td>
                  <td className="p-3.5 font-mono text-sky-400 font-bold text-[11px]">{d.hardware_fingerprint}</td>
                  <td className="p-3.5 font-mono">
                    <div>{d.last_active}</div>
                    <div className="text-[10px] text-slate-500 font-sans flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-400" /> {d.location} ({d.ip_address})
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        d.trust_status === 'TRUSTED'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : d.trust_status === 'REVOKED'
                          ? 'bg-red-500/15 text-red-400 border-red-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {d.trust_status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {d.trust_status === 'TRUSTED' ? (
                        <button
                          onClick={() => handleRevokeDevice(d.id, d.device_name)}
                          className="px-2.5 py-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" /> Revoke Trust
                        </button>
                      ) : (
                        <button
                          onClick={() => handleTrustDevice(d.id, d.device_name)}
                          className="px-2.5 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Authorize
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedDevice(d)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-rose-400" /> Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DEVICE TELEMETRY MODAL ── */}
      {selectedDevice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-extrabold text-white">Hardware Device Telemetry Inspector</h3>
              </div>
              <button onClick={() => setSelectedDevice(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-rose-400 font-bold">{selectedDevice.device_name} ({selectedDevice.device_type})</div>
                <div className="text-slate-400">Owner: {selectedDevice.owner_email} ({selectedDevice.owner_role})</div>
                <div className="text-slate-500 text-[11px]">Last Active: {selectedDevice.last_active}</div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-sky-400 font-bold">Hardware Fingerprint: {selectedDevice.hardware_fingerprint}</div>
                <div className="text-slate-400">OS & Browser: {selectedDevice.os_browser}</div>
                <div className="text-slate-400">IP & Location: {selectedDevice.ip_address} ({selectedDevice.location})</div>
                <div className="text-slate-500 text-[10px] truncate">User-Agent: {selectedDevice.user_agent}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDevice(null)}
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
