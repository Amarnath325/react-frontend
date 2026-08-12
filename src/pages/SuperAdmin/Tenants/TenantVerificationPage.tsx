import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  UserCheck, CheckCircle, XCircle, Clock, FileText, Eye, RefreshCw,
  Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Check,
  List, LayoutGrid, Download, ShieldCheck, AlertTriangle, X, Send,
  FileCheck, Building, ShieldAlert, Award,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';

interface VerificationDocument {
  id: string;
  name: string;
  type: 'society_reg' | 'tax_pan' | 'affiliation_letter' | 'principal_id' | 'address_proof';
  file_url: string;
  size: string;
  uploaded_at: string;
  status: 'approved' | 'pending' | 'rejected' | 'reupload_required';
  notes?: string;
}

interface VerificationRecord {
  id: number;
  school_name: string;
  school_code: string;
  contact_person: string;
  designation: string;
  email: string;
  phone: string;
  affiliation_board: 'CBSE' | 'ICSE' | 'State Board' | 'IB' | 'Cambridge' | 'IGCSE';
  registration_no: string;
  city: string;
  state: string;
  submitted_at: string;
  trust_score: number; // 0 to 100
  risk_level: 'low' | 'medium' | 'high';
  status: 'pending' | 'under_review' | 'verified' | 'rejected' | 'reupload_required';
  documents: VerificationDocument[];
  reviewer_notes?: string;
  verified_at?: string;
  verified_by?: string;
}

type SortField = 'school_name' | 'trust_score' | 'submitted_at' | 'status';
type SortOrder = 'asc' | 'desc';
type PageSizeOption = 5 | 10 | 25 | 50 | 100 | 'all';

interface SearchableOption {
  value: string;
  label: string;
}

// Searchable Dropdown Select Component
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
        {Icon && <Icon className="w-3.5 h-3.5 text-blue-400" />}
        {labelPrefix && <span className="text-[11px] text-slate-400 font-bold">{labelPrefix}:</span>}
        <span className="truncate max-w-[130px]">{selectedOption?.label || placeholder}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-52 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 space-y-1">
          <div className="relative mb-1">
            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search option..."
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-blue-500 placeholder-slate-600"
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
                      ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockVerifications: VerificationRecord[] = [
  {
    id: 1,
    school_name: 'Delhi Public School (Noida)',
    school_code: 'dps_noida',
    contact_person: 'Dr. Rajesh Sharma',
    designation: 'Principal',
    email: 'principal@dps-noida.edu.in',
    phone: '+91 98765 43210',
    affiliation_board: 'CBSE',
    registration_no: 'REG-DPS-2024-88',
    city: 'Noida',
    state: 'Uttar Pradesh',
    submitted_at: '2026-07-28 10:30 AM',
    trust_score: 96,
    risk_level: 'low',
    status: 'pending',
    documents: [
      { id: 'doc-1', name: 'Society Registration Certificate.pdf', type: 'society_reg', file_url: '#', size: '2.4 MB', uploaded_at: '2026-07-28', status: 'approved' },
      { id: 'doc-2', name: 'CBSE Affiliation Grant Letter.pdf', type: 'affiliation_letter', file_url: '#', size: '3.1 MB', uploaded_at: '2026-07-28', status: 'approved' },
      { id: 'doc-3', name: 'School PAN Card & 80G Tax Exemption.pdf', type: 'tax_pan', file_url: '#', size: '1.8 MB', uploaded_at: '2026-07-28', status: 'approved' },
      { id: 'doc-4', name: 'Principal Aadhaar & ID Proof.pdf', type: 'principal_id', file_url: '#', size: '1.2 MB', uploaded_at: '2026-07-28', status: 'approved' },
    ]
  },
  {
    id: 2,
    school_name: 'St. Mary\'s Convent Senior Sec School',
    school_code: 'st_marys',
    contact_person: 'Sister Mary Joseph',
    designation: 'Administrator',
    email: 'admin@stmarys.org',
    phone: '+91 98112 34567',
    affiliation_board: 'ICSE',
    registration_no: 'REG-SMC-2023-14',
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    submitted_at: '2026-07-30 02:15 PM',
    trust_score: 92,
    risk_level: 'low',
    status: 'under_review',
    reviewer_notes: 'Document verification under process by Senior Compliance Officer.',
    documents: [
      { id: 'doc-5', name: 'Educational Society Trust Deed.pdf', type: 'society_reg', file_url: '#', size: '4.1 MB', uploaded_at: '2026-07-30', status: 'approved' },
      { id: 'doc-6', name: 'CISCE Board Approval Certificate.pdf', type: 'affiliation_letter', file_url: '#', size: '2.8 MB', uploaded_at: '2026-07-30', status: 'approved' },
      { id: 'doc-7', name: 'Trust TAN & GST Document.pdf', type: 'tax_pan', file_url: '#', size: '1.5 MB', uploaded_at: '2026-07-30', status: 'pending' },
      { id: 'doc-8', name: 'Administrator ID & Authorization.pdf', type: 'principal_id', file_url: '#', size: '1.1 MB', uploaded_at: '2026-07-30', status: 'approved' },
    ]
  },
  {
    id: 3,
    school_name: 'Oxford High International School',
    school_code: 'oxford_high',
    contact_person: 'Amitabh Sen',
    designation: 'Managing Director',
    email: 'director@oxfordhigh.edu.in',
    phone: '+91 99554 12345',
    affiliation_board: 'IGCSE',
    registration_no: 'REG-OXF-2022-99',
    city: 'Bengaluru',
    state: 'Karnataka',
    submitted_at: '2026-07-25 11:00 AM',
    trust_score: 98,
    risk_level: 'low',
    status: 'verified',
    verified_at: '2026-07-26 04:30 PM',
    verified_by: 'SuperAdmin (Platform Owner)',
    documents: [
      { id: 'doc-9', name: 'International School Charter.pdf', type: 'society_reg', file_url: '#', size: '5.2 MB', uploaded_at: '2026-07-25', status: 'approved' },
      { id: 'doc-10', name: 'Cambridge Assessment International.pdf', type: 'affiliation_letter', file_url: '#', size: '3.4 MB', uploaded_at: '2026-07-25', status: 'approved' },
      { id: 'doc-11', name: 'Tax Clearance Certificate 2025.pdf', type: 'tax_pan', file_url: '#', size: '2.0 MB', uploaded_at: '2026-07-25', status: 'approved' },
    ]
  },
  {
    id: 4,
    school_name: 'Cambridge International Academy',
    school_code: 'cambridge_intl',
    contact_person: 'Mrs. Priya Kapoor',
    designation: 'CEO & Founder',
    email: 'ceo@cambridge.ac.in',
    phone: '+91 97766 54321',
    affiliation_board: 'CBSE',
    registration_no: 'REG-CAM-2025-02',
    city: 'Hyderabad',
    state: 'Telangana',
    submitted_at: '2026-07-31 09:45 AM',
    trust_score: 45,
    risk_level: 'high',
    status: 'reupload_required',
    reviewer_notes: 'CBSE Affiliation certificate copy was blurry and unreadable.',
    documents: [
      { id: 'doc-12', name: 'Society Registration Draft.pdf', type: 'society_reg', file_url: '#', size: '1.9 MB', uploaded_at: '2026-07-31', status: 'approved' },
      { id: 'doc-13', name: 'CBSE Letter (Illegible Scan).pdf', type: 'affiliation_letter', file_url: '#', size: '0.8 MB', uploaded_at: '2026-07-31', status: 'reupload_required', notes: 'Scan is blurry, please upload original color PDF.' },
    ]
  },
  {
    id: 5,
    school_name: 'Heritage Global Academy',
    school_code: 'heritage_ac',
    contact_person: 'Suresh Kumar',
    designation: 'Trustee',
    email: 'info@heritageglobal.in',
    phone: '+91 94120 98765',
    affiliation_board: 'State Board',
    registration_no: 'REG-HGA-2021-05',
    city: 'Jaipur',
    state: 'Rajasthan',
    submitted_at: '2026-08-01 04:00 PM',
    trust_score: 35,
    risk_level: 'high',
    status: 'rejected',
    reviewer_notes: 'Duplicate registration attempt with expired state affiliation document.',
    documents: [
      { id: 'doc-14', name: 'Expired State Board Permission (2018).pdf', type: 'affiliation_letter', file_url: '#', size: '1.4 MB', uploaded_at: '2026-08-01', status: 'rejected' },
    ]
  }
];

export default function TenantVerificationPage() {
  const [verifications, setVerifications] = useState<VerificationRecord[]>(mockVerifications);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [boardFilter, setBoardFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Sorting & Pagination State
  const [sortBy, setSortBy] = useState<SortField>('submitted_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals & Action Drawer State
  const [selectedRecord, setSelectedRecord] = useState<VerificationRecord | null>(null);
  const [actionModalType, setActionModalType] = useState<'approve' | 'reject' | 'reupload' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reuploadNote, setReuploadNote] = useState('');
  const [viewDocModal, setViewDocModal] = useState<VerificationDocument | null>(null);

  // Refresh handler
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('KYC Verification applications updated');
    }, 600);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, boardFilter, sortBy, sortOrder, pageSize]);

  // Handle Approval Action
  const handleApproveSchool = (record: VerificationRecord) => {
    setVerifications(prev =>
      prev.map(v =>
        v.id === record.id
          ? {
              ...v,
              status: 'verified',
              verified_at: new Date().toLocaleString(),
              verified_by: 'SuperAdmin (Platform Owner)',
              trust_score: 98,
              risk_level: 'low',
            }
          : v
      )
    );
    toast.success(`🎉 ${record.school_name} verified! Dedicated DB engine provisioned.`);
    setActionModalType(null);
    setSelectedRecord(null);
  };

  // Handle Rejection Action
  const handleRejectSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !rejectionReason) {
      toast.error('Please enter a rejection reason');
      return;
    }
    setVerifications(prev =>
      prev.map(v =>
        v.id === selectedRecord.id
          ? {
              ...v,
              status: 'rejected',
              reviewer_notes: rejectionReason,
              risk_level: 'high',
            }
          : v
      )
    );
    toast.error(`Application for ${selectedRecord.school_name} rejected.`);
    setActionModalType(null);
    setSelectedRecord(null);
    setRejectionReason('');
  };

  // Handle Request Re-upload
  const handleRequestReupload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !reuploadNote) {
      toast.error('Please specify which documents need re-uploading');
      return;
    }
    setVerifications(prev =>
      prev.map(v =>
        v.id === selectedRecord.id
          ? {
              ...v,
              status: 'reupload_required',
              reviewer_notes: reuploadNote,
            }
          : v
      )
    );
    toast.success(`Re-upload request sent to ${selectedRecord.contact_person} (${selectedRecord.email})`);
    setActionModalType(null);
    setSelectedRecord(null);
    setReuploadNote('');
  };

  // Toggle sort field
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filtered Dataset
  const filtered = verifications.filter(v => {
    const matchesSearch =
      v.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.registration_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    const matchesBoard = boardFilter === 'all' || v.affiliation_board === boardFilter;

    return matchesSearch && matchesStatus && matchesBoard;
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

  // Aggregated Metric KPIs
  const totalApps = verifications.length;
  const pendingApps = verifications.filter(v => v.status === 'pending').length;
  const underReviewApps = verifications.filter(v => v.status === 'under_review').length;
  const verifiedApps = verifications.filter(v => v.status === 'verified').length;
  const rejectedApps = verifications.filter(v => v.status === 'rejected' || v.status === 'reupload_required').length;

  const statusBadgeConfig: Record<string, { label: string; style: string; icon: React.ElementType }> = {
    pending: { label: 'Pending Verification', style: 'text-amber-400 bg-amber-400/10 border-amber-400/30', icon: Clock },
    under_review: { label: 'Under Review', style: 'text-blue-400 bg-blue-400/10 border-blue-400/30', icon: FileText },
    verified: { label: 'KYC Verified', style: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', icon: CheckCircle },
    rejected: { label: 'Rejected', style: 'text-red-400 bg-red-400/10 border-red-400/30', icon: XCircle },
    reupload_required: { label: 'Re-upload Required', style: 'text-purple-400 bg-purple-400/10 border-purple-400/30', icon: AlertTriangle },
  };

  // Dropdown Options
  const sortOptions: SearchableOption[] = [
    { value: 'submitted_at', label: 'Submission Date' },
    { value: 'school_name', label: 'School Name' },
    { value: 'trust_score', label: 'Trust Score' },
    { value: 'status', label: 'Verification Status' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending Only' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'verified', label: 'Verified Only' },
    { value: 'reupload_required', label: 'Re-upload Needed' },
    { value: 'rejected', label: 'Rejected Only' },
  ];

  const boardOptions: SearchableOption[] = [
    { value: 'all', label: 'All Boards' },
    { value: 'CBSE', label: 'CBSE Affiliated' },
    { value: 'ICSE', label: 'ICSE / CISCE' },
    { value: 'State Board', label: 'State Board' },
    { value: 'IGCSE', label: 'Cambridge / IGCSE' },
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
            <span className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-400/30">
              <UserCheck className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                School KYC & Onboarding Verification Console
                <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-extrabold rounded-full border border-blue-400/30 uppercase tracking-wider">
                  KYC Control
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Review legal certificates · Verify board affiliations · Assign trust scores · Approve tenant DB engines
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => toast.success('Verification audit log exported')}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export Audit Log
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/30 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Queue
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Applications</span>
            <Building className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalApps}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">All Time Submissions</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{pendingApps}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Awaiting Initial Screening</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Under Review</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{underReviewApps}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">In Officer Pipeline</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">KYC Verified</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{verifiedApps}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">DB Provisioned</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Action Needed</span>
            <AlertTriangle className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{rejectedApps}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Re-upload / Rejected</div>
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
              placeholder="Search by school name, contact person, email, reg no, city..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-blue-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Sort By Dropdown */}
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
              className="p-2 bg-slate-900 border border-slate-800 text-blue-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* 2. Status Filter Dropdown */}
          <SearchableSelect
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Status..."
            icon={Filter}
            labelPrefix="Status"
          />

          {/* 3. Board Affiliation Dropdown */}
          <SearchableSelect
            options={boardOptions}
            value={boardFilter}
            onChange={setBoardFilter}
            placeholder="Board..."
            icon={Award}
            labelPrefix="Board"
          />

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
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── TABLE VIEW ── */}
      {viewMode === 'table' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
          {totalFiltered === 0 ? (
            <div className="py-16 text-center space-y-2">
              <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-bold">No school KYC applications match your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('school_name')}>
                      <div className="flex items-center gap-1.5">
                        School / Application
                        {sortBy === 'school_name' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5">Board & Reg No</th>
                    <th className="p-3.5">KYC Documents</th>
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('trust_score')}>
                      <div className="flex items-center gap-1.5">
                        Trust Score
                        {sortBy === 'trust_score' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedData.map(v => {
                    const st = statusBadgeConfig[v.status] || statusBadgeConfig.pending;
                    const StatusIcon = st.icon;

                    return (
                      <tr key={v.id} className="hover:bg-slate-900/50 transition-colors">
                        {/* School Name & Contact */}
                        <td className="p-3.5 font-bold text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-md flex-shrink-0">
                              {v.school_name[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate max-w-[220px]">{v.school_name}</div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <span>{v.contact_person} ({v.designation})</span>
                                <span>·</span>
                                <span className="text-slate-500">{v.city}, {v.state}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Board & Registration */}
                        <td className="p-3.5">
                          <div className="font-bold text-slate-200 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-amber-400" /> {v.affiliation_board}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">{v.registration_no}</div>
                        </td>

                        {/* Documents Count */}
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-cyan-300 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 w-fit">
                            <FileCheck className="w-3.5 h-3.5 text-cyan-400" /> {v.documents.length} File(s)
                          </span>
                        </td>

                        {/* Trust Score */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-slate-900 rounded-full h-1.5 border border-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  v.trust_score >= 90
                                    ? 'bg-emerald-500'
                                    : v.trust_score >= 60
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${v.trust_score}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-xs text-white">{v.trust_score}%</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase flex items-center gap-1 border w-fit ${st.style}`}>
                            <StatusIcon className="w-3 h-3" /> {st.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect KYC Modal */}
                            <button
                              onClick={() => setSelectedRecord(v)}
                              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-400" /> Review KYC
                            </button>

                            {/* Direct Approve */}
                            {v.status !== 'verified' && (
                              <button
                                onClick={() => handleApproveSchool(v)}
                                className="px-2.5 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── GRID CARDS VIEW ── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedData.map(v => {
            const st = statusBadgeConfig[v.status] || statusBadgeConfig.pending;

            return (
              <div key={v.id} className="bg-slate-950 rounded-3xl border border-slate-800 p-5 space-y-4 shadow-xl hover:border-slate-700 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-md flex-shrink-0">
                      {v.school_name[0]}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white line-clamp-1">{v.school_name}</h3>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <span>{v.contact_person}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${st.style}`}>
                    {st.label}
                  </span>
                </div>

                <div className="space-y-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Affiliation Board</span>
                    <span className="font-bold text-amber-400">{v.affiliation_board}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>KYC Files</span>
                    <span className="font-mono text-cyan-300 font-bold">{v.documents.length} Submitted</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Trust Rating</span>
                    <span className="font-bold text-emerald-400">{v.trust_score}% High Trust</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setSelectedRecord(v)}
                    className="flex-1 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-400" /> Review KYC Profile
                  </button>
                  {v.status !== 'verified' && (
                    <button
                      onClick={() => handleApproveSchool(v)}
                      className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PAGINATION BAR ── */}
      {totalFiltered > 0 && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-4 text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{pageSize === 'all' ? 1 : startIndex + 1}</strong> to{' '}
            <strong className="text-white">{pageSize === 'all' ? totalFiltered : Math.min(startIndex + effectivePageSize, totalFiltered)}</strong> of{' '}
            <strong className="text-white">{totalFiltered}</strong> KYC applications
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
                      pageNum === validPage ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
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

      {/* ── MODAL 1: VIEW & REVIEW FULL KYC PROFILE ── */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-base shadow-md">
                  {selectedRecord.school_name[0]}
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">{selectedRecord.school_name}</h2>
                  <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                    <span>Reg No: <strong className="text-amber-400">{selectedRecord.registration_no}</strong></span>
                    <span>·</span>
                    <span>Board: {selectedRecord.affiliation_board}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="p-2 text-slate-500 hover:text-white cursor-pointer rounded-xl bg-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* School Profile Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-extrabold text-blue-400 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Authorized Representative
                </h4>
                <div><span className="text-slate-500">Contact Person:</span> <strong className="text-white">{selectedRecord.contact_person}</strong></div>
                <div><span className="text-slate-500">Designation:</span> <strong className="text-slate-300">{selectedRecord.designation}</strong></div>
                <div><span className="text-slate-500">Email:</span> <strong className="text-slate-200">{selectedRecord.email}</strong></div>
                <div><span className="text-slate-500">Phone:</span> <strong className="text-slate-200">{selectedRecord.phone}</strong></div>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-extrabold text-amber-400 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verification Status
                </h4>
                <div><span className="text-slate-500">Trust Score:</span> <strong className="text-emerald-400">{selectedRecord.trust_score}% High Confidence</strong></div>
                <div><span className="text-slate-500">Risk Assessment:</span> <strong className="text-slate-200 uppercase">{selectedRecord.risk_level} RISK</strong></div>
                <div><span className="text-slate-500">Submitted On:</span> <strong className="text-slate-300">{selectedRecord.submitted_at}</strong></div>
                {selectedRecord.verified_at && (
                  <div><span className="text-slate-500">Verified On:</span> <strong className="text-emerald-400">{selectedRecord.verified_at}</strong></div>
                )}
              </div>
            </div>

            {/* Documents List */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center justify-between">
                <span>Submitted Verification Documents ({selectedRecord.documents.length})</span>
              </h4>

              <div className="space-y-2">
                {selectedRecord.documents.map(doc => (
                  <div key={doc.id} className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <div>
                        <div className="font-bold text-white">{doc.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{doc.size} · Uploaded {doc.uploaded_at}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase border ${
                        doc.status === 'approved'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : doc.status === 'reupload_required'
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}>
                        {doc.status}
                      </span>
                      <button
                        onClick={() => setViewDocModal(doc)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-blue-400" /> Preview
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Toolbar in Modal */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActionModalType('reupload')}
                  className="px-3.5 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Request Re-upload
                </button>
                <button
                  onClick={() => setActionModalType('reject')}
                  className="px-3.5 py-2 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject Application
                </button>
              </div>

              {selectedRecord.status !== 'verified' && (
                <button
                  onClick={() => handleApproveSchool(selectedRecord)}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/30"
                >
                  <CheckCircle className="w-4 h-4" /> Approve & Provision Tenant DB
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: DOCUMENT PREVIEW MODAL ── */}
      {viewDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-white text-xs">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>{viewDocModal.name}</span>
              </div>
              <button onClick={() => setViewDocModal(null)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[220px]">
              <FileCheck className="w-12 h-12 text-blue-400" />
              <div className="text-xs text-white font-bold">{viewDocModal.name}</div>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Official PDF Document Verified · Encrypted Cloud Storage S3
              </p>
              <button
                onClick={() => toast.success(`Downloading ${viewDocModal.name}`)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: RE-UPLOAD REQUEST MODAL ── */}
      {actionModalType === 'reupload' && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleRequestReupload} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-purple-400" /> Request Document Re-upload
              </h3>
              <button type="button" onClick={() => setActionModalType(null)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Specify missing or illegible documents for <strong>{selectedRecord.school_name}</strong>:
              </p>
              <textarea
                value={reuploadNote}
                onChange={e => setReuploadNote(e.target.value)}
                placeholder="e.g. CBSE Affiliation letter scan is blurry. Please re-upload clear color PDF copy."
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 text-xs placeholder-slate-600"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActionModalType(null)}
                className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/30"
              >
                <Send className="w-3.5 h-3.5" /> Send Request Email
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL 4: REJECTION REASON MODAL ── */}
      {actionModalType === 'reject' && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleRejectSchool} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" /> Reject KYC Application
              </h3>
              <button type="button" onClick={() => setActionModalType(null)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Please enter official reason for rejecting <strong>{selectedRecord.school_name}</strong>:
              </p>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. Expired Board Affiliation letter and invalid registration credentials."
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-red-500 text-xs placeholder-slate-600"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActionModalType(null)}
                className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/30"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject & Send Notification
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
