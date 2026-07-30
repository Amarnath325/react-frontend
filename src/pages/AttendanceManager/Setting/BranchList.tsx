import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import {
  Edit2,
  Trash2,
  X,
  RotateCcw,
  MapPin,
  Wifi,
  Building2,
  Eye,
  Globe,
  Mail,
  Navigation,
  ShieldCheck,
  Map
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import * as XLSX from 'xlsx';

export interface BranchPolicyItem {
  br_b_id: number | string;
  br_code: string;
  br_name: string;
  br_email: string;
  br_is_active: boolean;
  br_address: string;
  br_longitude: number;
  br_latitude: number;
  br_range_limit: number;
  br_is_wifi_restricted: boolean;
  br_wifi_address: string;
  br_c_id: number | string;
  br_s_id: number | string;
  deleted_at?: string | null;
}

// Searchable Select Component
const SearchableSelect: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isClearable?: boolean;
  className?: string;
}> = ({ options, value, onChange, placeholder, isClearable = true, className = 'w-44' }) => {
  const selectedOption = options.find((opt) => opt.value === value) || null;

  return (
    <Select
      options={options}
      value={selectedOption}
      onChange={(selected) => onChange(selected ? (selected as any).value : '')}
      placeholder={placeholder}
      isClearable={isClearable}
      className={`${className} text-xs`}
      classNamePrefix="react-select"
      styles={{
        control: (base: any) => ({
          ...base,
          borderRadius: '0.375rem',
          borderColor: '#d1d5db',
          minHeight: '28px',
          height: '28px',
          fontSize: '12px',
          boxShadow: 'none',
          backgroundColor: 'white',
          '&:hover': { borderColor: '#9ca3af' },
        }),
        valueContainer: (base: any) => ({
          ...base,
          padding: '0 6px',
        }),
        input: (base: any) => ({
          ...base,
          margin: '0',
          padding: '0',
        }),
        option: (base: any, state: any) => ({
          ...base,
          backgroundColor: state.isFocused ? '#eff6ff' : 'white',
          color: '#1f2937',
          cursor: 'pointer',
          fontSize: '12px',
          padding: '4px 8px',
        }),
        placeholder: (base: any) => ({
          ...base,
          fontSize: '12px',
          color: '#6b7280',
        }),
        singleValue: (base: any) => ({
          ...base,
          fontSize: '12px',
          color: '#1f2937',
        }),
      }}
    />
  );
};

// ──────────────────────────────────────────────────────
// BRANCH DETAIL VIEW MODAL
// ──────────────────────────────────────────────────────
const BranchDetailModal: React.FC<{
  branch: BranchPolicyItem;
  onClose: () => void;
  onEdit: () => void;
}> = ({ branch, onClose, onEdit }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HERO HEADER */}
        <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-cyan-800 px-6 pt-5 pb-9 relative overflow-hidden text-white">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/10" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white border border-white/30 font-mono">
                  {branch.br_code || 'NO-CODE'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${branch.br_is_active ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40' : 'bg-rose-500/20 text-rose-200 border-rose-400/40'}`}>
                  {branch.br_is_active ? '✓ Active Branch' : '✗ Inactive'}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-1 tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-300" />
                {branch.br_name}
              </h2>
              {branch.br_email && (
                <p className="text-cyan-100 text-xs font-medium flex items-center gap-1.5 pt-0.5">
                  <Mail className="w-3 h-3 text-cyan-300" />
                  {branch.br_email}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MAIN BODY CONTENT */}
        <div className="-mt-4 px-6 pb-5 space-y-4">

          {/* GEOFENCE & LOCATION HIGHLIGHT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Geofence Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  GPS Geofence Limit
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-100">
                  Radius
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">{branch.br_range_limit || 0}</span>
                <span className="text-xs font-bold text-slate-500">meters</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Attendance is permitted within {branch.br_range_limit || 0}m radius of branch coordinates.
              </p>
            </div>

            {/* Wi-Fi Restriction Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-purple-600" />
                  Wi-Fi Restriction
                </span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${branch.br_is_wifi_restricted ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {branch.br_is_wifi_restricted ? 'Enforced' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900">
                  {branch.br_is_wifi_restricted ? (branch.br_wifi_address || 'Wi-Fi Restricted') : 'No IP Lock'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                {branch.br_is_wifi_restricted
                  ? 'Attendance requires connection to designated campus Wi-Fi network IP.'
                  : 'Punching enabled from any network connection.'}
              </p>
            </div>
          </div>

          {/* LATITUDE & LONGITUDE STRIP */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Latitude</span>
                <span className="font-mono font-bold text-slate-800">{branch.br_latitude || '—'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-500 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Longitude</span>
                <span className="font-mono font-bold text-slate-800">{branch.br_longitude || '—'}</span>
              </div>
            </div>
          </div>

          {/* ADDRESS BOX */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-xs space-y-1">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block flex items-center gap-1">
              <Map className="w-3.5 h-3.5 text-blue-600" />
              Physical Address
            </span>
            <p className="text-slate-700 font-medium leading-relaxed">
              {branch.br_address || 'No physical address configured for this branch.'}
            </p>
          </div>

          {/* FOOTER METADATA STRIP */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span className="font-mono text-[11px]">Branch ID: #{branch.br_b_id}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                onClick={onEdit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Branch
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default function BranchList() {
  const navigate = useNavigate();

  // Master Data State
  const [branches, setBranches] = useState<BranchPolicyItem[]>([
    {
      br_b_id: 1,
      br_code: 'BR-MAIN',
      br_name: 'Main Campus Branch',
      br_email: 'main.branch@school.edu',
      br_is_active: true,
      br_address: '123 Education Boulevard, Central Sector',
      br_latitude: 28.613930,
      br_longitude: 77.209020,
      br_range_limit: 100,
      br_is_wifi_restricted: true,
      br_wifi_address: '192.168.1.1',
      br_c_id: '1',
      br_s_id: '1',
    },
    {
      br_b_id: 2,
      br_code: 'BR-CITY',
      br_name: 'City Center Branch',
      br_email: 'city.branch@school.edu',
      br_is_active: true,
      br_address: '45 Knowledge Park Road, Metro Area',
      br_latitude: 28.535517,
      br_longitude: 77.391029,
      br_range_limit: 150,
      br_is_wifi_restricted: false,
      br_wifi_address: '',
      br_c_id: '1',
      br_s_id: '2',
    },
    {
      br_b_id: 3,
      br_code: 'BR-WEST',
      br_name: 'West Wing International Branch',
      br_email: 'west.branch@school.edu',
      br_is_active: false,
      br_address: '88 Innovation Drive, Science City',
      br_latitude: 28.704059,
      br_longitude: 77.102490,
      br_range_limit: 200,
      br_is_wifi_restricted: true,
      br_wifi_address: '10.0.0.1',
      br_c_id: '2',
      br_s_id: '1',
    },
  ]);

  const [viewTrash, setViewTrash] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const [viewingBranch, setViewingBranch] = useState<BranchPolicyItem | null>(null);

  // Filter & Search Controls
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [filterCity, setFilterCity] = useState<string>('');
  const [filterState, setFilterState] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string>('br_b_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);

  // Searchable Select Options
  const cityOptions = [
    { value: '1', label: 'Central Delhi City' },
    { value: '2', label: 'Noida Metro Region' },
    { value: '3', label: 'Gurugram Cyber Hub' },
  ];

  const stateOptions = [
    { value: '1', label: 'Delhi NCR' },
    { value: '2', label: 'Uttar Pradesh' },
    { value: '3', label: 'Haryana' },
  ];

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
  ];

  useEffect(() => {
    fetchBranches();
  }, [viewTrash]);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/attendance/settings/branches', {
        params: { only_trashed: viewTrash }
      });
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setBranches(response.data.data);
      }
    } catch (error) {
      console.log('Using local branch datasets');
    }
  };

  const handleToggleStatus = async (id: number | string) => {
    setBranches((prev) =>
      prev.map((item) =>
        item.br_b_id === id
          ? { ...item, br_is_active: !item.br_is_active }
          : item
      )
    );
    try {
      await api.patch(`/attendance/settings/branches/${id}/toggle-active`);
    } catch (e) { }
    toast.success('Branch active status updated');
  };

  const handleDeleteBranch = async (id: number | string, name: string) => {
    if (window.confirm(`Are you sure you want to move "${name}" to trash?`)) {
      setBranches(branches.filter((b) => b.br_b_id !== id));
      try {
        await api.delete(`/attendance/settings/branches/${id}`);
      } catch (e) { }
      toast.success('Branch moved to trash');
    }
  };

  const handleRestoreBranch = async (id: number | string, name: string) => {
    setBranches(branches.filter((b) => b.br_b_id !== id));
    try {
      await api.post(`/attendance/settings/branches/restore/${id}`);
    } catch (e) { }
    toast.success(`Branch "${name}" restored successfully`);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    const isActive = sortColumn === column;
    return (
      <span className={`inline-flex items-center justify-center w-3.5 h-3.5 ml-1 rounded text-[8px] font-bold ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
        {isActive ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
      </span>
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(currentEntries.map((item) => item.br_b_id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: number | string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkAction = async (action: 'activate' | 'inactivate' | 'delete' | 'restore' | 'force_delete') => {
    if (selectedIds.size === 0) return;
    const arrayIds = Array.from(selectedIds);

    if (action === 'activate') {
      setBranches((prev) => prev.map((b) => (selectedIds.has(b.br_b_id) ? { ...b, br_is_active: true } : b)));
      toast.success(`${arrayIds.length} branch(es) activated`);
    } else if (action === 'inactivate') {
      setBranches((prev) => prev.map((b) => (selectedIds.has(b.br_b_id) ? { ...b, br_is_active: false } : b)));
      toast.success(`${arrayIds.length} branch(es) inactivated`);
    } else if (action === 'delete') {
      setBranches((prev) => prev.filter((b) => !selectedIds.has(b.br_b_id)));
      toast.success(`${arrayIds.length} branch(es) moved to trash`);
    } else if (action === 'restore') {
      setBranches((prev) => prev.filter((b) => !selectedIds.has(b.br_b_id)));
      toast.success(`${arrayIds.length} branch(es) restored`);
    } else if (action === 'force_delete') {
      setBranches((prev) => prev.filter((b) => !selectedIds.has(b.br_b_id)));
      toast.success(`${arrayIds.length} branch(es) permanently deleted`);
    }

    try {
      await api.post('/attendance/settings/branches/bulk-action', {
        action,
        ids: arrayIds,
      });
    } catch (e) { }

    setSelectedIds(new Set());
  };

  const handleExport = () => {
    const exportData = filteredData.map((b, idx) => ({
      'S. NO.': idx + 1,
      'BRANCH CODE': b.br_code,
      'BRANCH NAME': b.br_name,
      'EMAIL': b.br_email,
      'ADDRESS': b.br_address,
      'GEOFENCE RADIUS (M)': b.br_range_limit,
      'WIFI RESTRICTED': b.br_is_wifi_restricted ? 'Yes' : 'No',
      'WIFI ADDRESS': b.br_wifi_address,
      'STATUS': b.br_is_active ? 'Active' : 'Inactive',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'School Branches');
    XLSX.writeFile(workbook, `school_branches_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Export successful!');
  };

  const downloadSampleFile = () => {
    const sampleData = [
      {
        'Branch Code': 'BR-NORTH',
        'Branch Name': 'North Campus Branch',
        'Branch Email': 'north@school.edu',
        'Address': 'Sector 14, Main Highway',
        'Latitude': 28.6139,
        'Longitude': 77.2090,
        'Geofence Radius (m)': 100,
        'WiFi Restricted (1/0)': 1,
        'WiFi Address / IP': '192.168.1.100',
        'City ID': 1,
        'State ID': 1,
        'Status (1/0)': 1
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Branches');
    XLSX.writeFile(workbook, 'sample_school_branches.xlsx');
    toast.success('Sample file downloaded!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsed: any[] = XLSX.utils.sheet_to_json(sheet);
        setImportPreview(parsed);
        setIsImportModalOpen(true);
      } catch (err) {
        toast.error('Failed to parse Excel file');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = () => {
    if (importPreview.length === 0) return;
    const newItems: BranchPolicyItem[] = importPreview.map((item, idx) => ({
      br_b_id: Date.now() + idx,
      br_code: item['Branch Code'] || item['br_code'] || `BR-${idx + 10}`,
      br_name: item['Branch Name'] || item['br_name'] || `Imported Branch ${idx + 1}`,
      br_email: item['Branch Email'] || item['br_email'] || '',
      br_is_active: true,
      br_address: item['Address'] || '',
      br_latitude: Number(item['Latitude']) || 28.6,
      br_longitude: Number(item['Longitude']) || 77.2,
      br_range_limit: Number(item['Geofence Radius (m)']) || 100,
      br_is_wifi_restricted: Boolean(item['WiFi Restricted (1/0)']),
      br_wifi_address: item['WiFi Address / IP'] || '',
      br_c_id: item['City ID'] || '1',
      br_s_id: item['State ID'] || '1',
    }));

    setBranches([...newItems, ...branches]);
    toast.success(`Imported ${newItems.length} branches successfully`);
    setIsImportModalOpen(false);
    setImportPreview([]);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCity('');
    setFilterState('');
    setFilterStatus('');
  };

  // Filter & Sort Logic
  let filteredData = [...branches];

  if (searchTerm) {
    filteredData = filteredData.filter(
      (b) =>
        b.br_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.br_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.br_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.br_address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (filterCity) {
    filteredData = filteredData.filter((b) => String(b.br_c_id) === String(filterCity));
  }

  if (filterState) {
    filteredData = filteredData.filter((b) => String(b.br_s_id) === String(filterState));
  }

  if (filterStatus) {
    const isActiveBool = filterStatus === 'Active';
    filteredData = filteredData.filter((b) => b.br_is_active === isActiveBool);
  }

  // Sorting
  filteredData.sort((a, b) => {
    let valA = (a as any)[sortColumn] || '';
    let valB = (b as any)[sortColumn] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalEntries = filteredData.length;
  const indexOfLastEntry = itemsPerPage === -1 ? totalEntries : currentPage * itemsPerPage;
  const indexOfFirstEntry = itemsPerPage === -1 ? 0 : (currentPage - 1) * itemsPerPage;
  const currentEntries = itemsPerPage === -1 ? filteredData : filteredData.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(totalEntries / itemsPerPage) || 1;

  const isAllSelected = currentEntries.length > 0 && currentEntries.every((item) => selectedIds.has(item.br_b_id));

  // Summary statistics metrics
  const totalBranchesCount = branches.length;
  const activeBranchesCount = branches.filter((b) => b.br_is_active).length;
  const geofencedCount = branches.filter((b) => b.br_latitude && b.br_longitude && Number(b.br_range_limit) > 0).length;
  const wifiRestrictedCount = branches.filter((b) => b.br_is_wifi_restricted).length;

  return (
    <div className="bg-[#f4f7fc] p-2.5 sm:p-3 md:p-4 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-2">

        {/* HEADER TITLE & BREADCRUMB */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-0.5">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-[#2b6cb0] tracking-tight">
              School Branch Settings
            </h1>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
              <span onClick={() => navigate('/attendance/dashboard')} className="hover:text-blue-600 cursor-pointer">
                Dashboard
              </span>
              <span>/</span>
              <span onClick={() => navigate('/attendance/config')} className="hover:text-blue-600 cursor-pointer">
                Attendance Settings
              </span>
              <span>/</span>
              <span className="font-bold text-slate-700">School Branches</span>
            </div>
          </div>
        </div>

        {/* TOP METRIC CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Branches</span>
              <span className="text-lg font-black text-slate-900 leading-none">{totalBranchesCount}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GPS Geofenced</span>
              <span className="text-lg font-black text-emerald-700 leading-none">{geofencedCount}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Wi-Fi IP Restricted</span>
              <span className="text-lg font-black text-purple-700 leading-none">{wifiRestrictedCount}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Wifi className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Status</span>
              <span className="text-lg font-black text-slate-900 leading-none">{activeBranchesCount} / {totalBranchesCount}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* BULK ACTION BAR */}
        {selectedIds.size > 0 && (
          <div className="bg-slate-900 text-white px-3 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-md animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-blue-600 px-2 py-0.5 rounded-md">
                {selectedIds.size} Selected
              </span>
              <span className="text-xs text-slate-300">Choose a bulk action:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!viewTrash ? (
                <>
                  <button
                    onClick={() => handleBulkAction('activate')}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => handleBulkAction('inactivate')}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Inactivate
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Move to Trash
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleBulkAction('restore')}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Bulk Restore
                  </button>
                  <button
                    onClick={() => handleBulkAction('force_delete')}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Bulk Force Delete
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* CONTAINER CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-3 space-y-2.5">

          {/* CONTROL BAR TOP ROW */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 text-xs shadow-2xs">

            {/* LEFT SIDE: SEARCH + SHOW + SHOW TRASHED */}
            <div className="flex flex-wrap items-center gap-2">

              {/* SEARCH INPUT */}
              <input
                type="text"
                placeholder="Search branches..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none w-48 h-7 bg-white shadow-2xs"
              />

              {/* SHOW DROPDOWN */}
              <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-0.5 h-7">
                <span className="text-[10px] text-gray-500 font-bold uppercase">SHOW:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    const value = e.target.value === 'all' ? -1 : Number(e.target.value);
                    setItemsPerPage(value);
                    setCurrentPage(1);
                  }}
                  className="text-xs font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="all">All</option>
                </select>
              </div>

              {/* SHOW TRASHED SWITCH TOGGLE */}
              <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-2.5 py-0.5 h-7">
                <span className="text-xs text-gray-700 font-medium select-none">Show Trashed</span>
                <button
                  type="button"
                  onClick={() => setViewTrash((prev) => !prev)}
                  className={`flex-shrink-0 relative inline-flex h-[16px] w-[32px] items-center rounded-full transition-colors focus:outline-none ${viewTrash ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                >
                  <span
                    className={`inline-block h-[10px] w-[10px] transform rounded-full bg-white transition-transform ${viewTrash ? 'translate-x-[18px]' : 'translate-x-[4px]'
                      }`}
                  />
                </button>
              </div>

              {(searchTerm || filterCity || filterState || filterStatus) && (
                <button
                  onClick={clearFilters}
                  className="text-[10px] font-bold text-rose-600 hover:underline bg-rose-50 px-2 py-1 rounded"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* RIGHT SIDE: SAMPLE + IMPORT + EXPORT + ADD NEW */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={downloadSampleFile}
                className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 bg-white rounded hover:bg-gray-50 transition text-xs font-semibold h-7 shadow-2xs"
                title="Download Excel Sample Template"
              >
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Sample
              </button>

              <label className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 bg-white rounded hover:bg-gray-50 transition cursor-pointer text-xs font-semibold h-7 shadow-2xs">
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 bg-white rounded hover:bg-gray-50 transition text-xs font-semibold h-7 shadow-2xs"
              >
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>

              <button
                onClick={() => navigate('/attendance/settings/branch/create')}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition text-xs font-bold h-7 shadow-2xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Add New</span>
              </button>
            </div>
          </div>

          {/* FILTER ROW WITH SEARCHABLE DROPDOWNS */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <SearchableSelect
              options={cityOptions}
              value={filterCity}
              onChange={(val) => {
                setFilterCity(val);
                setCurrentPage(1);
              }}
              placeholder="Filter by City"
              className="w-44"
            />

            <SearchableSelect
              options={stateOptions}
              value={filterState}
              onChange={(val) => {
                setFilterState(val);
                setCurrentPage(1);
              }}
              placeholder="Filter by State"
              className="w-44"
            />

            <SearchableSelect
              options={statusOptions}
              value={filterStatus}
              onChange={(val) => {
                setFilterStatus(val);
                setCurrentPage(1);
              }}
              placeholder="Status"
              className="w-36"
            />
          </div>

          {/* TABLE CONTAINER */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-slate-700 font-extrabold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                  <th className="py-2 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th onClick={() => handleSort('br_b_id')} className="py-2 px-3 whitespace-nowrap cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <span className="whitespace-nowrap">S. NO.</span>
                      {getSortIcon('br_b_id')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('br_code')} className="py-2 px-3.5 whitespace-nowrap cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center whitespace-nowrap">
                      <span>BRANCH CODE</span>
                      {getSortIcon('br_code')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('br_name')} className="py-2 px-3.5 whitespace-nowrap cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center whitespace-nowrap">
                      <span>BRANCH NAME</span>
                      {getSortIcon('br_name')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('br_email')} className="py-2 px-3.5 whitespace-nowrap cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center whitespace-nowrap">
                      <span>EMAIL</span>
                      {getSortIcon('br_email')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('br_range_limit')} className="py-2 px-3.5 whitespace-nowrap cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center whitespace-nowrap">
                      <span>GEOFENCE RADIUS</span>
                      {getSortIcon('br_range_limit')}
                    </div>
                  </th>
                  <th className="py-2 px-3.5 whitespace-nowrap">
                    <span>WI-FI RESTRICTED</span>
                  </th>
                  <th onClick={() => handleSort('br_is_active')} className="py-2 px-3.5 text-center whitespace-nowrap cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center justify-center whitespace-nowrap">
                      <span>STATUS</span>
                      {getSortIcon('br_is_active')}
                    </div>
                  </th>
                  <th className="py-2 px-3.5 text-right w-28 whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-slate-700 font-medium">
                {currentEntries.length > 0 ? (
                  currentEntries.map((row, index) => (
                    <tr key={row.br_b_id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.br_b_id)}
                          onChange={() => handleSelectRow(row.br_b_id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                        {indexOfFirstEntry + index + 1}
                      </td>
                      <td className="py-2 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono">
                          {row.br_code}
                        </span>
                      </td>
                      <td className="py-2 px-3.5 font-bold text-blue-700 whitespace-nowrap">
                        {row.br_name}
                      </td>
                      <td className="py-2 px-3.5 text-slate-600 whitespace-nowrap">
                        {row.br_email || '—'}
                      </td>
                      <td className="py-2 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>{row.br_range_limit}m Radius</span>
                        </span>
                      </td>
                      <td className="py-2 px-3.5 whitespace-nowrap">
                        {row.br_is_wifi_restricted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                            <Wifi className="w-3 h-3 text-purple-600" />
                            <span>{row.br_wifi_address || 'Wi-Fi Locked'}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-normal">Off</span>
                        )}
                      </td>
                      <td className="py-2 px-3.5 text-center whitespace-nowrap">
                        {/* TOGGLE SWITCH FOR STATUS */}
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(row.br_b_id)}
                            className={`relative inline-flex h-[16px] w-[32px] items-center rounded-full transition-colors focus:outline-none ${row.br_is_active ? 'bg-emerald-500' : 'bg-gray-300'
                              }`}
                          >
                            <span
                              className={`inline-block h-[10px] w-[10px] transform rounded-full bg-white transition-transform ${row.br_is_active ? 'translate-x-[18px]' : 'translate-x-[4px]'
                                }`}
                            />
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-3.5 text-right whitespace-nowrap">
                        {!viewTrash ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingBranch(row)}
                              className="p-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => navigate(`/attendance/settings/branch/edit/${row.br_b_id}`)}
                              className="p-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                              title="Edit Branch"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBranch(row.br_b_id, row.br_name)}
                              className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                              title="Move to Trash"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRestoreBranch(row.br_b_id, row.br_name)}
                            className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-400 font-normal">
                      No school branches found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER PAGINATION */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 text-xs text-slate-500">
            <div>
              Showing {totalEntries > 0 ? indexOfFirstEntry + 1 : 0} to{' '}
              {Math.min(indexOfLastEntry, totalEntries)} of {totalEntries} entries
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2.5 py-1 rounded-lg font-semibold ${currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* BRANCH DETAIL MODAL */}
      {viewingBranch && (
        <BranchDetailModal
          branch={viewingBranch}
          onClose={() => setViewingBranch(null)}
          onEdit={() => {
            navigate(`/attendance/settings/branch/edit/${viewingBranch.br_b_id}`);
            setViewingBranch(null);
          }}
        />
      )}

      {/* IMPORT EXCEL / CSV MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-100 overflow-hidden space-y-4 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Import School Branches from Excel / CSV</h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {importPreview.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-700">Preview ({importPreview.length} rows found):</span>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 text-xs font-mono">
                    {importPreview.map((row, i) => (
                      <div key={i} className="py-1 border-b border-slate-200 last:border-0 text-[11px]">
                        {JSON.stringify(row)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={importPreview.length === 0}
                onClick={handleConfirmImport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                Import {importPreview.length} Records
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
