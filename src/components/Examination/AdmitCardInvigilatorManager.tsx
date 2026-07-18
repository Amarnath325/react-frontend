import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { useLocation } from 'react-router-dom';
import {
  FileText, Plus, Search, Trash2,
  X, RefreshCw, Printer, CheckSquare, ChevronLeft, ChevronRight,
  Archive, RotateCcw, AlertCircle, Info, Loader2, Award, ClipboardCheck,
  MapPin, Download, Upload, AlertTriangle
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface InvigilatorDuty {
  id: number;
  teacher_id: number;
  teacher_name: string;
  examination_id: number;
  examination_name: string;
  room_name: string;
  exam_date: string;
  exam_time: string;
  status: 'Assigned' | 'Released';
  deleted_at?: string | null;
  created_at?: string;
}

interface ExamScheduleItem {
  subject_name: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_no: string | null;
}

interface StudentAdmitCard {
  id: number;
  admit_card_no: string;
  examination_id: number;
  examination_name: string;
  academic_year_name: string;
  student_id: number;
  student_name: string;
  roll_number: string;
  admission_number: string;
  father_name: string;
  class_id: number | null;
  class_name: string;
  status: 'Pending' | 'Approved';
  room_name: string;
  seat_no: string;
  schedules: ExamScheduleItem[];
  is_active: boolean;
  deleted_at?: string | null;
  created_at?: string;
}

interface ExaminationOption {
  id: number;
  name: string;
  class_id: number;
  class_name: string;
}

interface MasterOption {
  value: string;
  label: string;
}

interface Stats {
  total: number;
  approved: number;
  pending: number;
  trashed: number;
}

interface DutyStats {
  total: number;
  assigned: number;
  released: number;
  trashed: number;
}

/* ─────────────────────────────────────────────────────────────
   TOGGLE SWITCH
───────────────────────────────────────────────────────────── */
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange()}
    disabled={disabled}
    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-1
      ${checked ? 'bg-green-500' : 'bg-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform
        ${checked ? 'translate-x-4.5' : 'translate-x-1'}`}
    />
  </button>
);

/* ─────────────────────────────────────────────────────────────
   REACT-SELECT STYLES
───────────────────────────────────────────────────────────── */
const selectStyles = {
  control: (b: any, s: any) => ({
    ...b,
    borderRadius: '0.375rem',
    borderColor: s.isFocused ? '#6366f1' : '#e5e7eb',
    boxShadow: s.isFocused ? '0 0 0 2px rgba(99,102,241,0.15)' : 'none',
    minHeight: '28px',
    height: '28px',
    backgroundColor: '#fff',
    '&:hover': { borderColor: s.isFocused ? '#6366f1' : '#d1d5db' },
  }),
  valueContainer: (b: any) => ({ ...b, padding: '0 8px', height: '28px', display: 'flex', alignItems: 'center' }),
  input: (b: any) => ({ ...b, margin: '0', padding: '0', fontSize: '11px' }),
  placeholder: (b: any) => ({ ...b, fontSize: '11px', color: '#9ca3af' }),
  singleValue: (b: any) => ({ ...b, fontSize: '11px', color: '#111827' }),
  indicatorsContainer: (b: any) => ({ ...b, height: '26px' }),
  option: (b: any, s: any) => ({
    ...b,
    backgroundColor: s.isSelected ? '#6366f1' : s.isFocused ? '#f3f4f6' : 'transparent',
    color: s.isSelected ? '#fff' : '#374151',
    fontSize: '11px',
    padding: '6px 8px',
    cursor: 'pointer',
  }),
  menu: (b: any) => ({ ...b, borderRadius: '0.375rem', border: '1px solid #e5e7eb', marginTop: '2px', zIndex: 99999 }),
  menuPortal: (b: any) => ({ ...b, zIndex: 99999 }),
  clearIndicator: (b: any) => ({ ...b, padding: '2px' }),
  dropdownIndicator: (b: any) => ({ ...b, padding: '2px' }),
};

const SSelect: React.FC<{
  options: MasterOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  isClearable?: boolean;
  className?: string;
}> = ({ options, value, onChange, placeholder = 'Select...', isClearable = true, className = 'w-40' }) => {
  const selected = options.find(o => o.value === value) || null;
  return (
    <div className={className}>
      <Select
        options={options}
        value={selected}
        onChange={opt => onChange((opt as MasterOption)?.value || '')}
        placeholder={placeholder}
        isClearable={isClearable}
        styles={selectStyles}
        menuPortalTarget={document.body}
        menuPosition="fixed"
      />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   STATS CARD
───────────────────────────────────────────────────────────── */
const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
}> = ({ label, value, icon, color, bg }) => (
  <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${bg} min-w-0`}>
    <div className={`p-1.5 rounded-md ${color} flex-shrink-0`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate">{label}</p>
      <p className="text-lg font-bold text-gray-800 leading-tight">
        {value}
      </p>
    </div>
  </div>
);

const statusFilterOptions = [
  { value: 'Approved', label: 'Approved' },
  { value: 'Pending', label: 'Pending' },
];

const dutyStatusFilterOptions = [
  { value: 'Assigned', label: 'Assigned' },
  { value: 'Released', label: 'Released' },
];

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export default function AdmitCardInvigilatorManager() {
  const location = useLocation();
  const isAdmitCards = location.pathname.includes('admit-cards');
  const activeTab = isAdmitCards ? 'admit' : 'invigilator';

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── State variables ── */
  const [admitCards, setAdmitCards] = useState<StudentAdmitCard[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── Stats state variables ── */
  const [admitStats, setAdmitStats] = useState<Stats>({ total: 0, approved: 0, pending: 0, trashed: 0 });
  const [dutyStats, setDutyStats] = useState<DutyStats>({ total: 0, assigned: 0, released: 0, trashed: 0 });

  /* ── Invigilator duty roster states ── */
  const [duties, setDuties] = useState<InvigilatorDuty[]>([]);
  const [teachers, setTeachers] = useState<MasterOption[]>([]);
  const [isDutyModalOpen, setIsDutyModalOpen] = useState(false);
  const [dutySaving, setDutySaving] = useState(false);
  const [dutyForm, setDutyForm] = useState({
    teacher_id: '',
    examination_id: '',
    room_name: '',
    exam_date: new Date().toISOString().split('T')[0],
    exam_time: '09:00 AM - 12:00 PM',
    status: 'Assigned' as 'Assigned' | 'Released'
  });

  /* ── Import errors modal state ── */
  const [importReport, setImportReport] = useState<{
    open: boolean;
    imported: number;
    failed: number;
    errors: Record<number, string[]>;
  } | null>(null);

  /* ── Masters metadata ── */
  const [examinations, setExaminations] = useState<ExaminationOption[]>([]);
  const [classes, setClasses] = useState<MasterOption[]>([]);

  /* ── Filters ── */
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterExam, setFilterExam] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showTrashed, setShowTrashed] = useState(false);

  /* ── Selection ── */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  /* ── Bulk Generator Modal ── */
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [genForm, setGenForm] = useState({ examination_id: '', class_id: '', status: 'Approved' });
  const [genSaving, setGenSaving] = useState(false);

  /* ── Admit Card Print Preview Modal ── */
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<StudentAdmitCard | null>(null);

  /* ── Pagination ── */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /* ════════════════ FETCH DATA ════════════════ */
  const fetchAdmitStats = useCallback(async () => {
    try {
      const res = await api.get('/school/exam-admit-cards/stats');
      if (res.data.success) setAdmitStats(res.data.data);
    } catch { /* silent */ }
  }, []);

  const fetchDutyStats = useCallback(async () => {
    try {
      const res = await api.get('/school/exam-invigilator-duties/stats');
      if (res.data.success) setDutyStats(res.data.data);
    } catch { /* silent */ }
  }, []);

  const fetchAdmitCards = useCallback(async () => {
    if (activeTab !== 'admit') return;
    setLoading(true);
    try {
      const res = await api.get('/school/exam-admit-cards', {
        params: {
          trashed: showTrashed ? '1' : '0',
          class_id: filterClass,
          examination_id: filterExam,
          status: filterStatus,
        }
      });
      if (res.data.success) setAdmitCards(res.data.data || []);
    } catch {
      toast.error('Failed to load admit cards');
    }
    setLoading(false);
  }, [activeTab, showTrashed, filterClass, filterExam, filterStatus]);

  const fetchDuties = useCallback(async () => {
    if (activeTab !== 'invigilator') return;
    setLoading(true);
    try {
      const res = await api.get('/school/exam-invigilator-duties', {
        params: {
          trashed: showTrashed ? '1' : '0',
          examination_id: filterExam,
          status: filterStatus,
        }
      });
      if (res.data.success) setDuties(res.data.data || []);
    } catch {
      toast.error('Failed to load invigilator duties');
    }
    setLoading(false);
  }, [activeTab, showTrashed, filterExam, filterStatus]);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await api.get('/school/teachers');
      if (res.data.success) {
        const arr = (res.data.data || []).map((t: any) => ({
          value: String(t.id),
          label: t.user ? `${t.user.first_name} ${t.user.last_name || ''}` : `Teacher #${t.id}`
        }));
        setTeachers(arr);
      }
    } catch { /* silent */ }
  }, []);

  const fetchMasters = useCallback(async () => {
    try {
      const [exRes, clRes] = await Promise.all([
        api.get('/school/examinations', { params: { trashed: '0' } }),
        api.get('/master/classes'),
      ]);

      if (exRes.data.success) setExaminations(exRes.data.data || []);

      if (clRes.data.success) {
        const data = clRes.data.data;
        const arr = Array.isArray(data)
          ? data.map((c: any) => ({ value: String(c.id || c.m_id), label: c.name || c.m_name }))
          : Object.entries(data).map(([id, name]) => ({ value: id, label: name as string }));
        setClasses(arr);
      }
    } catch {
      toast.error('Failed to load master filters');
    }
  }, []);

  useEffect(() => {
    fetchMasters();
    fetchTeachers();
  }, [fetchMasters, fetchTeachers]);

  useEffect(() => {
    if (activeTab === 'admit') {
      fetchAdmitCards();
      fetchAdmitStats();
    } else {
      fetchDuties();
      fetchDutyStats();
    }
    setSelectedIds([]);
  }, [activeTab, showTrashed, filterClass, filterExam, filterStatus, fetchAdmitCards, fetchDuties, fetchAdmitStats, fetchDutyStats]);

  /* ── Auto select class when examination is selected in bulk generator ── */
  useEffect(() => {
    if (genForm.examination_id) {
      const selectedExam = examinations.find(e => String(e.id) === genForm.examination_id);
      if (selectedExam) {
        setGenForm(prev => ({
          ...prev,
          class_id: String(selectedExam.class_id)
        }));
      }
    }
  }, [genForm.examination_id, examinations]);

  /* ════════════════ FILTERING & PAGINATION ════════════════ */
  const filteredAdmit = useMemo(() => {
    if (searchTerm === '') return admitCards;
    const q = searchTerm.toLowerCase();
    return admitCards.filter(card =>
      card.student_name.toLowerCase().includes(q) ||
      card.admit_card_no.toLowerCase().includes(q) ||
      card.roll_number.toLowerCase().includes(q) ||
      card.admission_number.toLowerCase().includes(q)
    );
  }, [admitCards, searchTerm]);

  const filteredDuties = useMemo(() => {
    if (searchTerm === '') return duties;
    const q = searchTerm.toLowerCase();
    return duties.filter(d =>
      d.teacher_name.toLowerCase().includes(q) ||
      d.room_name.toLowerCase().includes(q) ||
      d.examination_name.toLowerCase().includes(q)
    );
  }, [duties, searchTerm]);

  const recordList = activeTab === 'admit' ? filteredAdmit : filteredDuties;

  const totalPages = useMemo(() => itemsPerPage === -1 ? 1 : Math.ceil(recordList.length / itemsPerPage), [recordList, itemsPerPage]);

  const paginatedRecords = useMemo(() => {
    if (itemsPerPage === -1) return recordList;
    const s = (currentPage - 1) * itemsPerPage;
    return recordList.slice(s, s + itemsPerPage);
  }, [recordList, currentPage, itemsPerPage]);

  /* ── Selection checkers ── */
  const isAllSelected = paginatedRecords.length > 0 && paginatedRecords.every(r => selectedIds.includes(r.id));
  const handleSelectAll = () => isAllSelected ? setSelectedIds([]) : setSelectedIds(paginatedRecords.map(r => r.id));
  const handleSelectRow = (id: number) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const hasFilters = filterClass || filterExam || filterStatus || searchTerm;
  const clearFilters = () => {
    setFilterClass('');
    setFilterExam('');
    setFilterStatus('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  /* ════════════════ ADMIT CARDS CRUD OPERATIONS ════════════════ */
  const handleToggleAdmitStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'Approved' ? 'Pending' : 'Approved';
    try {
      const res = await api.put(`/school/exam-admit-cards/${id}`, { status: nextStatus });
      if (res.data.success) {
        toast.success('Admit card approval status toggled');
        setAdmitCards(prev => prev.map(c => c.id === id ? { ...c, status: nextStatus } : c));
        fetchAdmitStats();
      }
    } catch {
      toast.error('Failed to toggle status');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Move admit card for "${name}" to trash?`)) return;
    try {
      await api.delete(`/school/exam-admit-cards/${id}`);
      toast.success('Moved to trash');
      fetchAdmitCards();
      fetchAdmitStats();
    } catch { toast.error('Delete failed'); }
  };

  const handleRestore = async (id: number) => {
    try {
      await api.post(`/school/exam-admit-cards/${id}/restore`);
      toast.success('Admit card restored');
      fetchAdmitCards();
      fetchAdmitStats();
    } catch { toast.error('Restore failed'); }
  };

  const handleForceDelete = async (id: number, name: string) => {
    if (!window.confirm(`Permanently delete admit card for "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/school/exam-admit-cards/${id}/force`);
      toast.success('Permanently deleted');
      fetchAdmitCards();
      fetchAdmitStats();
    } catch { toast.error('Force delete failed'); }
  };

  /* ════════════════ ADMIT CARDS BULK ACTIONS ════════════════ */
  const handleBulkStatus = async (status: 'Approved' | 'Pending') => {
    if (!selectedIds.length) return;
    setBulkUpdating(true);
    try {
      await api.post('/school/exam-admit-cards/bulk-status', { ids: selectedIds, status });
      toast.success(`${selectedIds.length} admit card(s) status updated`);
      setSelectedIds([]);
      fetchAdmitCards();
      fetchAdmitStats();
    } catch { toast.error('Bulk update failed'); }
    setBulkUpdating(false);
  };

  const handleBulkDelete = async (force = false) => {
    if (!selectedIds.length) return;
    const msg = force
      ? `Permanently delete ${selectedIds.length} admit card(s)? This cannot be undone.`
      : `Move ${selectedIds.length} admit card(s) to trash?`;
    if (!window.confirm(msg)) return;
    setBulkUpdating(true);
    try {
      await api.post('/school/exam-admit-cards/bulk-delete', { ids: selectedIds, force });
      toast.success(force ? 'Permanently deleted' : 'Moved to trash');
      setSelectedIds([]);
      fetchAdmitCards();
      fetchAdmitStats();
    } catch { toast.error('Bulk delete failed'); }
    setBulkUpdating(false);
  };

  const handleBulkRestore = async () => {
    if (!selectedIds.length) return;
    setBulkUpdating(true);
    try {
      await api.post('/school/exam-admit-cards/bulk-restore', { ids: selectedIds });
      toast.success(`${selectedIds.length} admit card(s) restored`);
      setSelectedIds([]);
      fetchAdmitCards();
      fetchAdmitStats();
    } catch { toast.error('Bulk restore failed'); }
    setBulkUpdating(false);
  };

  const handleRunBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genForm.examination_id || !genForm.class_id) {
      toast.error('Please select both an examination and class');
      return;
    }
    setGenSaving(true);
    try {
      const res = await api.post('/school/exam-admit-cards/bulk-generate', {
        examination_id: Number(genForm.examination_id),
        class_id: Number(genForm.class_id),
        status: genForm.status,
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Admit cards generated');
        setIsGenModalOpen(false);
        fetchAdmitCards();
        fetchAdmitStats();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Bulk generation failed');
    }
    setGenSaving(false);
  };

  /* ════════════════ INVIGILATOR DUTIES CRUD & ACTIONS ════════════════ */
  const handleOpenDutyModal = () => {
    setDutyForm({
      teacher_id: teachers[0]?.value || '',
      examination_id: String(examinations[0]?.id || ''),
      room_name: '',
      exam_date: new Date().toISOString().split('T')[0],
      exam_time: '09:00 AM - 12:00 PM',
      status: 'Assigned',
    });
    setIsDutyModalOpen(true);
  };

  const handleCreateDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dutyForm.teacher_id || !dutyForm.examination_id || !dutyForm.room_name || !dutyForm.exam_date || !dutyForm.exam_time) {
      toast.error('Please fill all required fields');
      return;
    }
    setDutySaving(true);
    try {
      const payload = {
        teacher_id: Number(dutyForm.teacher_id),
        examination_id: Number(dutyForm.examination_id),
        room_name: dutyForm.room_name,
        exam_date: dutyForm.exam_date,
        exam_time: dutyForm.exam_time,
        status: dutyForm.status,
      };

      const res = await api.post('/school/exam-invigilator-duties', payload);
      if (res.data.success) {
        toast.success('Invigilator duty scheduled successfully');
        setIsDutyModalOpen(false);
        fetchDuties();
        fetchDutyStats();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Conflict detected: Invigilator is already assigned at this time.');
    }
    setDutySaving(false);
  };

  const handleToggleDutyStatus = async (id: number) => {
    try {
      const res = await api.patch(`/school/exam-invigilator-duties/${id}/toggle-status`);
      if (res.data.success) {
        toast.success('Duty status updated');
        setDuties(prev => prev.map(d => d.id === id ? { ...d, status: res.data.status } : d));
        fetchDutyStats();
      }
    } catch {
      toast.error('Failed to toggle duty status');
    }
  };

  const handleDeleteDuty = async (id: number) => {
    if (!window.confirm('Move this duty assignment to trash?')) return;
    try {
      await api.delete(`/school/exam-invigilator-duties/${id}`);
      toast.success('Duty moved to trash');
      fetchDuties();
      fetchDutyStats();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleRestoreDuty = async (id: number) => {
    try {
      await api.post(`/school/exam-invigilator-duties/${id}/restore`);
      toast.success('Duty assignment restored');
      fetchDuties();
      fetchDutyStats();
    } catch {
      toast.error('Restore failed');
    }
  };

  const handleForceDeleteDuty = async (id: number, name: string) => {
    if (!window.confirm(`Permanently delete duty assignment for "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/school/exam-invigilator-duties/${id}/force`);
      toast.success('Permanently deleted');
      fetchDuties();
      fetchDutyStats();
    } catch {
      toast.error('Force delete failed');
    }
  };

  /* ════════════════ INVIGILATOR BULK ACTIONS ════════════════ */
  const handleBulkDutyStatus = async (status: 'Assigned' | 'Released') => {
    if (!selectedIds.length) return;
    setBulkUpdating(true);
    try {
      await api.post('/school/exam-invigilator-duties/bulk-status', { ids: selectedIds, status });
      toast.success(`${selectedIds.length} assignment(s) status updated to ${status}`);
      setSelectedIds([]);
      fetchDuties();
      fetchDutyStats();
    } catch {
      toast.error('Bulk update failed');
    }
    setBulkUpdating(false);
  };

  const handleBulkDutyDelete = async (force = false) => {
    if (!selectedIds.length) return;
    const msg = force
      ? `Permanently delete ${selectedIds.length} duty assignment(s)? This cannot be undone.`
      : `Move ${selectedIds.length} duty assignment(s) to trash?`;
    if (!window.confirm(msg)) return;
    setBulkUpdating(true);
    try {
      await api.post('/school/exam-invigilator-duties/bulk-delete', { ids: selectedIds, force });
      toast.success(force ? 'Permanently deleted' : 'Moved to trash');
      setSelectedIds([]);
      fetchDuties();
      fetchDutyStats();
    } catch {
      toast.error('Bulk delete failed');
    }
    setBulkUpdating(false);
  };

  const handleBulkDutyRestore = async () => {
    if (!selectedIds.length) return;
    setBulkUpdating(true);
    try {
      await api.post('/school/exam-invigilator-duties/bulk-restore', { ids: selectedIds });
      toast.success(`${selectedIds.length} duty assignment(s) restored`);
      setSelectedIds([]);
      fetchDuties();
      fetchDutyStats();
    } catch {
      toast.error('Bulk restore failed');
    }
    setBulkUpdating(false);
  };

  /* ── ⧉ CSV EXPORT & TEMPLATES ── */
  const handleExportDuties = () => {
    // Triggers direct backend export route
    const token = localStorage.getItem('token') || '';
    const exportUrl = `${api.defaults.baseURL}/school/exam-invigilator-duties/export?token=${token}`;
    window.open(exportUrl, '_blank');
    toast.success('Exporting invigilator duties CSV');
  };

  const handleDownloadSample = () => {
    // Triggers direct sample CSV template download
    const sampleUrl = `${api.defaults.baseURL}/school/exam-invigilator-duties/sample`;
    window.open(sampleUrl, '_blank');
    toast.success('Downloading import sample template');
  };

  const handleExportAdmitCards = () => {
    const token = localStorage.getItem('token') || '';
    const exportUrl = `${api.defaults.baseURL}/school/exam-admit-cards/export?token=${token}`;
    window.open(exportUrl, '_blank');
    toast.success('Exporting admit cards CSV');
  };

  const handleDownloadAdmitSample = () => {
    const sampleUrl = `${api.defaults.baseURL}/school/exam-admit-cards/sample`;
    window.open(sampleUrl, '_blank');
    toast.success('Downloading admit cards sample template');
  };

  /* ════════════════ EXCEL CSV PARSING & BULK IMPORT ════════════════ */
  const parseCSV = (text: string) => {
    const result = [];
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];

    // Header line parsing
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const row: string[] = [];
      let insideQuote = false;
      let entries = '';

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          row.push(entries.trim().replace(/^["']|["']$/g, ''));
          entries = '';
        } else {
          entries += char;
        }
      }
      row.push(entries.trim().replace(/^["']|["']$/g, ''));

      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      result.push(obj);
    }
    return result;
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      try {
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          toast.error('The selected CSV file is empty or invalid.');
          return;
        }

        const endpoint = activeTab === 'admit'
          ? '/school/exam-admit-cards/bulk-import'
          : '/school/exam-invigilator-duties/bulk-import';

        // Post array to backend bulk import
        const res = await api.post(endpoint, { data: parsed });
        if (res.data.success) {
          toast.success(res.data.message || 'Bulk import complete');
          if (activeTab === 'admit') {
            fetchAdmitCards();
            fetchAdmitStats();
          } else {
            fetchDuties();
            fetchDutyStats();
          }

          if (res.data.error_count > 0) {
            setImportReport({
              open: true,
              imported: res.data.imported_count,
              failed: res.data.error_count,
              errors: res.data.errors,
            });
          }
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to import CSV dataset');
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Dropdown options ── */
  const examSelectOptions = useMemo(() => examinations.map(e => ({ value: String(e.id), label: `${e.class_name} - ${e.name}` })), [examinations]);
  const teacherSelectOptions = useMemo(() => teachers, [teachers]);

  const handlePrint = () => {
    window.print();
  };

  /* ════════════════ RENDER JSX ════════════════ */
  return (
    <div className="p-4 space-y-3 text-xs">

      {/* ── Hidden file input for Excel import ── */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
      />

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 rounded-lg">
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">
              {activeTab === 'admit' ? 'Admit Card Management' : 'Invigilator Duty Roster'}
            </h1>
            <p className="text-[10px] text-gray-500">
              {activeTab === 'admit'
                ? 'Generate candidate hall tickets, review exam approvals, and print official admit cards'
                : 'Schedule teacher invigilation rosters, assign exam classrooms, and manage invigilator duties'}
            </p>
          </div>
        </div>
        <button
          onClick={() => { if (activeTab === 'admit') { fetchAdmitCards(); fetchAdmitStats(); } else { fetchDuties(); fetchDutyStats(); } }}
          className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="text-[10px] font-medium">Refresh</span>
        </button>
      </div>

      {/* ── Dynamic KPI blocks for active tab ── */}
      {activeTab === 'admit' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard
            label="Total Hall Passes"
            value={admitStats.total}
            icon={<FileText className="w-3.5 h-3.5 text-white" />}
            color="bg-indigo-500"
            bg="bg-indigo-50 border-indigo-100"
          />
          <StatCard
            label="Approved Cards"
            value={admitStats.approved}
            icon={<ClipboardCheck className="w-3.5 h-3.5 text-white" />}
            color="bg-green-500"
            bg="bg-green-50 border-green-100"
          />
          <StatCard
            label="Pending Approvals"
            value={admitStats.pending}
            icon={<AlertCircle className="w-3.5 h-3.5 text-white" />}
            color="bg-amber-500"
            bg="bg-amber-50 border-amber-100"
          />
          <StatCard
            label="Trashed Cards"
            value={admitStats.trashed}
            icon={<Archive className="w-3.5 h-3.5 text-white" />}
            color="bg-red-500"
            bg="bg-red-50 border-red-100"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard
            label="Total Duty Slots"
            value={dutyStats.total}
            icon={<FileText className="w-3.5 h-3.5 text-white" />}
            color="bg-indigo-500"
            bg="bg-indigo-50 border-indigo-100"
          />
          <StatCard
            label="Assigned Duties"
            value={dutyStats.assigned}
            icon={<CheckSquare className="w-3.5 h-3.5 text-white" />}
            color="bg-green-500"
            bg="bg-green-50 border-green-100"
          />
          <StatCard
            label="Released Duties"
            value={dutyStats.released}
            icon={<Info className="w-3.5 h-3.5 text-white" />}
            color="bg-amber-500"
            bg="bg-amber-50 border-amber-100"
          />
          <StatCard
            label="Trashed Duties"
            value={dutyStats.trashed}
            icon={<Archive className="w-3.5 h-3.5 text-white" />}
            color="bg-red-500"
            bg="bg-red-50 border-red-100"
          />
        </div>
      )}

      {/* ── Primary Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 px-2.5 py-2 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={activeTab === 'admit' ? 'Search roll, name, pass...' : 'Search staff, room...'}
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-6 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white h-7 w-44"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Items per page select */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5 h-7">
            <select
              value={itemsPerPage}
              onChange={e => { setItemsPerPage(e.target.value === 'all' ? -1 : Number(e.target.value)); setCurrentPage(1); }}
              className="text-[11px] font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="all">All</option>
            </select>
          </div>

          {/* Trashed toggle */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-2 py-0.5 h-7">
            <Archive className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] text-gray-500 font-semibold">Trashed</span>
            <ToggleSwitch
              checked={showTrashed}
              onChange={() => { setShowTrashed(v => !v); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Import/Export buttons */}
          <button
            onClick={activeTab === 'admit' ? handleDownloadAdmitSample : handleDownloadSample}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded transition text-[11px] font-semibold h-7"
            title={activeTab === 'admit' ? 'Download Admit Card CSV Import Template' : 'Download CSV Import Template'}
          >
            <Download className="w-3.5 h-3.5" />
            Sample
          </button>
          <button
            onClick={handleUploadClick}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded transition text-[11px] font-semibold h-7"
            title={activeTab === 'admit' ? 'Import Admit Cards CSV' : 'Import Duties CSV'}
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>
          <button
            onClick={activeTab === 'admit' ? handleExportAdmitCards : handleExportDuties}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded transition text-[11px] font-semibold h-7"
            title={activeTab === 'admit' ? 'Export Admit Cards to CSV' : 'Export Duties to CSV'}
          >
            <Download className="w-3.5 h-3.5 text-green-600" />
            Export
          </button>

          {activeTab === 'admit' ? (
            <button
              onClick={() => { setGenForm({ examination_id: '', class_id: '', status: 'Approved' }); setIsGenModalOpen(true); }}
              className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition text-[11px] font-semibold h-7 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Bulk Generate Admit Cards
            </button>
          ) : (
            <button
              onClick={handleOpenDutyModal}
              className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition text-[11px] font-semibold h-7 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Assign Invigilator Duty
            </button>
          )}
        </div>
      </div>

      {/* ── Filters row ── */}
      <div className="flex flex-wrap items-center gap-2 bg-white px-2.5 py-2 rounded-lg border border-gray-200">
        <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 uppercase">
          Filters:
        </div>
        {activeTab === 'admit' && (
          <SSelect options={classes} value={filterClass} onChange={v => { setFilterClass(v); setCurrentPage(1); }} placeholder="Class" className="w-32" />
        )}
        <SSelect options={examSelectOptions} value={filterExam} onChange={v => { setFilterExam(v); setCurrentPage(1); }} placeholder="Examination" className="w-48" />
        <SSelect
          options={activeTab === 'admit' ? statusFilterOptions : dutyStatusFilterOptions}
          value={filterStatus}
          onChange={v => { setFilterStatus(v); setCurrentPage(1); }}
          placeholder="Status"
          className="w-28"
        />
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-0.5 text-[11px] text-red-500 hover:text-red-700 font-semibold px-2 py-0.5 rounded hover:bg-red-50 transition"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
        <span className="ml-auto text-[10px] text-gray-400 font-medium">
          {recordList.length} record{recordList.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* ── Bulk Actions Bar ── */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg text-[11px] text-indigo-800">
          <div className="flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-semibold">{selectedIds.length} selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            {activeTab === 'admit' ? (
              // Admit cards bulk actions
              !showTrashed ? (
                <>
                  <button
                    onClick={() => handleBulkStatus('Approved')}
                    disabled={bulkUpdating}
                    className="px-2.5 py-1 bg-white border border-indigo-300 rounded hover:bg-green-50 hover:border-green-400 transition disabled:opacity-50 text-green-700 font-medium"
                  >
                    Approve Selection
                  </button>
                  <button
                    onClick={() => handleBulkStatus('Pending')}
                    disabled={bulkUpdating}
                    className="px-2.5 py-1 bg-white border border-indigo-300 rounded hover:bg-amber-50 hover:border-amber-400 transition disabled:opacity-50 text-amber-700 font-medium"
                  >
                    Hold Selection
                  </button>
                  <button
                    onClick={() => handleBulkDelete(false)}
                    disabled={bulkUpdating}
                    className="px-2.5 py-1 bg-white border border-indigo-300 rounded hover:bg-red-50 hover:border-red-400 transition disabled:opacity-50 text-red-650 font-medium"
                  >
                    Move to Trash
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleBulkRestore}
                    disabled={bulkUpdating}
                    className="px-2.5 py-1 bg-white border border-indigo-300 rounded hover:bg-green-50 transition disabled:opacity-50 text-green-700 font-medium"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => handleBulkDelete(true)}
                    disabled={bulkUpdating}
                    className="px-2.5 py-1 bg-white border border-red-300 rounded hover:bg-red-50 transition disabled:opacity-50 text-red-700 font-medium"
                  >
                    Delete Permanently
                  </button>
                </>
              )
            ) : (
              // Invigilator duties bulk actions
              !showTrashed ? (
                <>
                  <button
                    onClick={() => handleBulkDutyStatus('Assigned')}
                    disabled={bulkUpdating}
                    className="px-2.5 py-1 bg-white border border-indigo-300 rounded hover:bg-green-50 hover:border-green-400 transition disabled:opacity-50 text-green-700 font-medium"
                  >
                    Mark Assigned
                  </button>
                  <button
                    onClick={() => handleBulkDutyStatus('Released')}
                    disabled={bulkUpdating}
                    className="px-2.5 py-1 bg-white border border-indigo-300 rounded hover:bg-amber-50 hover:border-amber-400 transition disabled:opacity-50 text-amber-700 font-medium"
                  >
                    Mark Released
                  </button>
                  <button
                    onClick={() => handleBulkDutyDelete(false)}
                    disabled={bulkUpdating}
                    className="px-2.5 py-1 bg-white border border-indigo-300 rounded hover:bg-red-50 hover:border-red-400 transition disabled:opacity-50 text-red-650 font-medium"
                  >
                    Move to Trash
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleBulkDutyRestore}
                    disabled={bulkUpdating}
                    className="px-2.5 py-1 bg-white border border-indigo-300 rounded hover:bg-green-50 transition disabled:opacity-50 text-green-700 font-medium"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => handleBulkDutyDelete(true)}
                    disabled={bulkUpdating}
                    className="px-2.5 py-1 bg-white border border-red-300 rounded hover:bg-red-50 transition disabled:opacity-50 text-red-700 font-medium"
                  >
                    Delete Permanently
                  </button>
                </>
              )
            )}
            <button
              onClick={() => setSelectedIds([])}
              className="px-2 py-0.5 bg-white border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ── Main Data Layout ── */}
      {activeTab === 'admit' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3.5">Student Details</th>
                  <th className="py-2.5 px-3.5">Admit Card No</th>
                  <th className="py-2.5 px-3.5">Target Examination</th>
                  <th className="py-2.5 px-3.5 text-center">Status</th>
                  <th className="py-2.5 px-3.5 text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[11px] text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                        <span>Loading generated admit cards...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredAdmit.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                      No admit cards matched filters. Click "Bulk Generate" to create hall passes.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map(card => (
                    <tr key={card.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-2 px-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(card.id)}
                          onChange={() => handleSelectRow(card.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-3.5">
                        <div className="font-bold text-gray-900">{card.student_name}</div>
                        <div className="text-[10px] text-gray-400 font-medium">
                          {card.class_name} • Roll {card.roll_number} • Adm: {card.admission_number}
                        </div>
                      </td>
                      <td className="py-2 px-3.5 font-mono font-bold text-gray-650">{card.admit_card_no}</td>
                      <td className="py-2 px-3.5 font-medium text-gray-900">
                        <div>{card.examination_name}</div>
                        <div className="text-[9px] text-gray-400">Academic Year: {card.academic_year_name}</div>
                      </td>
                      <td className="py-2 px-3.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${card.status === 'Approved' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                          {card.status}
                        </span>
                      </td>
                      <td className="py-2 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!card.deleted_at ? (
                            <>
                              <button
                                onClick={() => { setSelectedCard(card); setIsPreviewOpen(true); }}
                                className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded font-semibold transition"
                              >
                                Preview
                              </button>
                              <button
                                onClick={() => handleToggleAdmitStatus(card.id, card.status)}
                                className={`px-2 py-0.5 border rounded font-semibold transition ${card.status === 'Approved' ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100' : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                                  }`}
                              >
                                {card.status === 'Approved' ? 'Hold' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleDelete(card.id, card.student_name)}
                                className="p-1 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded transition"
                                title="Move to Trash"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleRestore(card.id)}
                                className="p-1 hover:bg-green-50 rounded text-green-600 transition"
                                title="Restore"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleForceDelete(card.id, card.student_name)}
                                className="p-1 hover:bg-red-50 rounded text-red-600 transition"
                                title="Delete Permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── Invigilator duty roster (dynamic database records) ── */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3.5">Invigilator Staff</th>
                  <th className="py-2.5 px-3.5">Allocated Room</th>
                  <th className="py-2.5 px-3.5">Target Examination</th>
                  <th className="py-2.5 px-3.5">Date & Timings</th>
                  <th className="py-2.5 px-3.5 text-center">Status</th>
                  <th className="py-2.5 px-3.5 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[11px] text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                        <span>Loading invigilator duty assignments...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredDuties.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-450 font-medium">
                      No invigilator duty assignments scheduled.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map(duty => (
                    <tr key={duty.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-2 px-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(duty.id)}
                          onChange={() => handleSelectRow(duty.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-3.5 font-bold text-gray-900">{duty.teacher_name}</td>
                      <td className="py-2 px-3.5 font-semibold text-indigo-650">{duty.room_name}</td>
                      <td className="py-2 px-3.5 text-gray-500 font-medium">{duty.examination_name}</td>
                      <td className="py-2 px-3.5">
                        <div className="font-semibold text-gray-800">{duty.exam_date}</div>
                        <div className="text-[9px] text-gray-400 font-medium">{duty.exam_time}</div>
                      </td>
                      <td className="py-2 px-3.5 text-center">
                        {!duty.deleted_at ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <ToggleSwitch
                              checked={duty.status === 'Assigned'}
                              onChange={() => handleToggleDutyStatus(duty.id)}
                            />
                            <span className={`text-[9px] font-semibold ${duty.status === 'Assigned' ? 'text-green-650' : 'text-gray-450'}`}>
                              {duty.status}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            Trashed
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!duty.deleted_at ? (
                            <button
                              onClick={() => handleDeleteDuty(duty.id)}
                              className="p-1 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded transition"
                              title="Move to Trash"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleRestoreDuty(duty.id)}
                                className="p-1 hover:bg-green-50 rounded text-green-600 transition"
                                title="Restore Assignment"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleForceDeleteDuty(duty.id, duty.teacher_name)}
                                className="p-1 hover:bg-red-50 rounded text-red-650 transition"
                                title="Delete Permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pagination row ── */}
      {!loading && totalPages > 1 && itemsPerPage !== -1 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] mt-2">
          <p className="text-gray-500">
            Showing <span className="font-semibold text-gray-700">{(currentPage - 1) * itemsPerPage + 1}</span>–
            <span className="font-semibold text-gray-700">{Math.min(currentPage * itemsPerPage, recordList.length)}</span> of
            <span className="font-semibold text-gray-700">{recordList.length}</span> results
          </p>
          <nav className="isolate inline-flex -space-x-px rounded shadow-sm">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l px-1.5 py-0.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`relative inline-flex items-center px-2.5 py-0.5 font-semibold ${currentPage === page ? 'z-10 bg-indigo-600 text-white' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r px-1.5 py-0.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </nav>
        </div>
      )}

      {/* ════════════════════════════════════════
          BULK GENERATOR MODAL (NON-SCROLLABLE)
      ════════════════════════════════════════ */}
      {isGenModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 rounded-t-xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-white/20 rounded">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Bulk Generate Examination Admit Cards</h3>
                </div>
                <button onClick={() => setIsGenModalOpen(false)} className="text-white/70 hover:text-white hover:bg-white/20 rounded-lg p-1 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleRunBulkGenerate} className="p-4 space-y-3.5 text-xs">

              {/* Examination Select */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Target Examination <span className="text-red-500">*</span>
                </label>
                <SSelect
                  options={examSelectOptions}
                  value={genForm.examination_id}
                  onChange={v => setGenForm(p => ({ ...p, examination_id: v }))}
                  placeholder="Select Examination"
                  isClearable={false}
                  className="w-full text-xs"
                />
              </div>

              {/* Class select */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Target Class/Grade <span className="text-red-500">*</span>
                </label>
                <SSelect
                  options={classes}
                  value={genForm.class_id}
                  onChange={v => setGenForm(p => ({ ...p, class_id: v }))}
                  placeholder="Select Class"
                  isClearable={false}
                  className="w-full text-xs"
                />
              </div>

              {/* Generation status */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Default Generation Status
                </label>
                <select
                  value={genForm.status}
                  onChange={e => setGenForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="Approved">Approved (Automatically release pass)</option>
                  <option value="Pending">Pending (Requires admin audit)</option>
                </select>
              </div>

              {/* Advice alert */}
              <div className="p-2 rounded border border-indigo-200 bg-indigo-50 text-[10px] font-semibold flex items-start gap-1.5 text-indigo-800">
                <Info className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <span>
                  This batch action creates official unique admit card numbers for all registered, active students in the selected class who do not already possess a card for this exam.
                </span>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsGenModalOpen(false)}
                  className="px-4 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={genSaving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-xs font-semibold disabled:opacity-60"
                >
                  {genSaving ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                  ) : (
                    <><ClipboardCheck className="w-3.5 h-3.5" /> Generate Admit Cards</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          ADMIT CARD PRINT PREVIEW MODAL
      ════════════════════════════════════════ */}
      {isPreviewOpen && selectedCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 rounded-t-xl flex-shrink-0 text-white">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold">Official Admit Card & Hall Pass</h3>
                  <p className="text-[10px] text-indigo-100 font-semibold">{selectedCard.student_name} • {selectedCard.admit_card_no}</p>
                </div>
                <button onClick={() => setIsPreviewOpen(false)} className="text-white/70 hover:text-white hover:bg-white/20 rounded-lg p-1 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Admit Card Layout */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">

              {/* Card visual sheet */}
              <div id="printable-hall-pass" className="border-4 double border-slate-700 p-5 rounded bg-white shadow-sm space-y-4 relative overflow-hidden text-gray-800">

                {/* Visual watermark */}
                <div className="absolute right-0 bottom-0 text-slate-100/50 pointer-events-none translate-x-12 translate-y-12 select-none font-bold text-8xl font-serif">
                  OFFICIAL
                </div>

                {/* Banner branding */}
                <div className="flex items-center justify-between border-b-2 border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-indigo-600 text-white rounded">
                      <Award className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-base leading-tight uppercase tracking-tight">Springdale International School</h4>
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Central Examination Board Authority</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded text-[9px] font-bold uppercase border border-indigo-700">
                      HALL TICKET
                    </span>
                    <p className="text-[7px] text-slate-400 font-mono mt-1">Generated: {new Date(selectedCard.created_at || '').toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Student Details Grid */}
                <div className="grid grid-cols-3 gap-3 bg-gray-50 border border-gray-200 p-3 rounded text-[10px]">
                  <div className="col-span-2 grid grid-cols-2 gap-y-2.5">
                    <div>
                      <span className="text-gray-400 block font-bold uppercase text-[7.5px]">Candidate Name</span>
                      <span className="font-bold text-gray-800 text-xs">{selectedCard.student_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-bold uppercase text-[7.5px]">Admit Card Number</span>
                      <span className="font-mono font-bold text-gray-800 text-xs text-indigo-700">{selectedCard.admit_card_no}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-bold uppercase text-[7.5px]">Class / Roll No</span>
                      <span className="font-bold text-gray-800">{selectedCard.class_name} (Roll: {selectedCard.roll_number})</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-bold uppercase text-[7.5px]">Admission No</span>
                      <span className="font-mono font-bold text-gray-800">{selectedCard.admission_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-bold uppercase text-[7.5px]">Father's Name</span>
                      <span className="font-bold text-gray-800">{selectedCard.father_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-bold uppercase text-[7.5px]">Target Exam</span>
                      <span className="font-bold text-gray-800 text-indigo-650">{selectedCard.examination_name}</span>
                    </div>
                  </div>

                  {/* Seating layout block (highly premium!) */}
                  <div className="border-l border-gray-200 pl-3 flex flex-col justify-center items-center text-center space-y-1.5">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                    <div>
                      <span className="text-gray-400 block font-bold uppercase text-[7px]">Seating Location</span>
                      <span className="font-bold text-gray-800 text-xs block truncate leading-tight" title={selectedCard.room_name}>
                        {selectedCard.room_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-bold uppercase text-[7px]">Allocated Desk</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded font-mono font-bold text-xs">
                        {selectedCard.seat_no}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Exam Schedule Table */}
                <div className="space-y-1">
                  <h5 className="font-bold text-[10px] text-gray-700 uppercase tracking-wider">Examination Schedule</h5>
                  <div className="border border-gray-200 rounded overflow-hidden">
                    <table className="w-full text-[9px] text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200 text-gray-500 font-bold uppercase">
                          <th className="py-1 px-2.5">Subject</th>
                          <th className="py-1 px-2.5">Exam Date</th>
                          <th className="py-1 px-2.5">Time Duration</th>
                          <th className="py-1 px-2.5">Room</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150 text-gray-700">
                        {selectedCard.schedules && selectedCard.schedules.length > 0 ? (
                          selectedCard.schedules.map((sch, sidx) => (
                            <tr key={sidx} className="hover:bg-gray-50/50">
                              <td className="py-1 px-2.5 font-bold text-gray-800">{sch.subject_name}</td>
                              <td className="py-1 px-2.5 font-mono">{sch.exam_date}</td>
                              <td className="py-1 px-2.5 font-mono">{sch.start_time} - {sch.end_time}</td>
                              <td className="py-1 px-2.5 font-medium">{sch.room_no || selectedCard.room_name}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-2.5 text-center text-gray-400 font-medium">
                              No exam schedules configured for this examination.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Instructions block */}
                <div className="border-t border-gray-200 pt-2.5 text-[8.5px] text-gray-500 leading-normal">
                  <span className="font-bold text-slate-700 block mb-0.5">Instructions for Candidates:</span>
                  1. Bring this original hall ticket and your student identity card to every exam session.<br />
                  2. Smart watches, mobile devices, calculators, and bags are prohibited inside the room.<br />
                  3. Please report to your allocated room 20 minutes prior to the scheduled exam commencement time.
                </div>

                {/* Signatures footer */}
                <div className="grid grid-cols-2 pt-8 text-[9px] font-bold text-gray-500">
                  <div className="text-center">
                    <div className="mx-auto w-32 border-b border-gray-400 mb-1"></div>
                    <span>Controller of Examinations</span>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto w-32 border-b border-gray-400 mb-1"></div>
                    <span>Principal's Stamp / Sign</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal footer controls */}
            <div className="border-t border-gray-200 px-5 py-3 flex justify-end gap-2 bg-gray-50 rounded-b-xl flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-1.5 border border-gray-300 rounded text-xs font-semibold hover:bg-gray-100 transition"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-5 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-150 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Admit Card</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Duty roster creation Modal (database action) ── */}
      {isDutyModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 rounded-t-xl flex-shrink-0 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold">Assign Invigilator Duty</h3>
                <button onClick={() => setIsDutyModalOpen(false)} className="text-white/70 hover:text-white hover:bg-white/20 rounded p-1 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateDuty} className="p-4 space-y-3.5 text-xs">

              {/* Teacher selection */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Invigilator Staff <span className="text-red-500">*</span>
                </label>
                <SSelect
                  options={teacherSelectOptions}
                  value={dutyForm.teacher_id}
                  onChange={v => setDutyForm(p => ({ ...p, teacher_id: v }))}
                  placeholder="Select Teacher"
                  isClearable={false}
                  className="w-full text-xs"
                />
              </div>

              {/* Exam & room selects */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Allocated Room <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={dutyForm.room_name}
                    onChange={e => setDutyForm(p => ({ ...p, room_name: e.target.value }))}
                    placeholder="e.g. Room 302"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Examination <span className="text-red-500">*</span>
                  </label>
                  <SSelect
                    options={examSelectOptions}
                    value={dutyForm.examination_id}
                    onChange={v => setDutyForm(p => ({ ...p, examination_id: v }))}
                    placeholder="Select Exam"
                    isClearable={false}
                    className="w-full text-xs"
                  />
                </div>
              </div>

              {/* Date & times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Duty Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dutyForm.exam_date}
                    onChange={e => setDutyForm(p => ({ ...p, exam_date: e.target.value }))}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Duty Timings <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={dutyForm.exam_time}
                    onChange={e => setDutyForm(p => ({ ...p, exam_time: e.target.value }))}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    placeholder="09:00 AM - 12:00 PM"
                    required
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsDutyModalOpen(false)}
                  className="px-4 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dutySaving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-xs font-semibold disabled:opacity-60"
                >
                  {dutySaving ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                  ) : (
                    'Confirm Duty Assignment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Bulk Import Report Details Dialog ── */}
      {importReport?.open && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-[100000] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-150">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3 flex-shrink-0 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <h3 className="text-sm font-bold">Roster Bulk Import Execution Report</h3>
              </div>
              <button
                onClick={() => setImportReport(null)}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded p-1 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-gray-700">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-lg">
                  <span className="text-[10px] text-gray-400 font-bold block uppercase mb-1">Uploaded</span>
                  <span className="text-lg font-bold text-gray-800">{importReport.imported + importReport.failed}</span>
                </div>
                <div className="p-3.5 bg-green-50 border border-green-150 rounded-lg">
                  <span className="text-[10px] text-green-600 font-bold block uppercase mb-1">Imported</span>
                  <span className="text-lg font-bold text-green-700">{importReport.imported}</span>
                </div>
                <div className="p-3.5 bg-rose-50 border border-rose-150 rounded-lg">
                  <span className="text-[10px] text-rose-600 font-bold block uppercase mb-1">Failed Rows</span>
                  <span className="text-lg font-bold text-rose-700">{importReport.failed}</span>
                </div>
              </div>

              {Object.keys(importReport.errors).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-[10px] text-gray-500 uppercase tracking-wider">Row Errors List</h4>
                  <div className="border border-gray-200 rounded divide-y divide-gray-150 max-h-56 overflow-y-auto font-mono text-[10.5px]">
                    {Object.entries(importReport.errors).map(([row, errList]) => (
                      <div key={row} className="p-2.5 bg-gray-50 flex items-start gap-2.5">
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[9px]">Row {row}</span>
                        <div className="flex-1 text-gray-650 leading-relaxed font-semibold">
                          {errList.map((err, idx) => <p key={idx}>{err}</p>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 px-5 py-3 flex justify-end bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setImportReport(null)}
                className="px-4 py-1.5 bg-indigo-650 text-white rounded text-xs font-bold hover:bg-indigo-700 transition"
              >
                Acknowledge report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
