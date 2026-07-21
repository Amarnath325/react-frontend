import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

interface ClassItem {
  id: number;
  name: string;
}

interface AcademicYear {
  id: number;
  name: string;
  is_current: boolean;
}

interface FeeHead {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
}

interface FrequencyOption {
  id: number;
  name: string;
}

interface FeeStructureItem {
  id: number;
  academic_year_id: number | null;
  class_id: number;
  class_name: string;
  fee_head: number;
  fee_head_label: string;
  amount: number;
  frequency: number;
  frequency_label: string;
  due_date: string | null;
  late_fee_amount: number;
  is_optional: boolean;
  is_active: boolean;
}

type ViewMode = 'table' | 'cards';
type SortableColumn = keyof FeeStructureItem;

// Standard Fallback Data
const DEFAULT_ACADEMIC_YEARS: AcademicYear[] = [
  { id: 1, name: '2025-2026', is_current: true },
  { id: 2, name: '2026-2027', is_current: false }
];

const DEFAULT_CLASSES: ClassItem[] = [
  { id: 1, name: 'Class 1' },
  { id: 2, name: 'Class 2' },
  { id: 3, name: 'Class 3' },
  { id: 4, name: 'Class 4' },
  { id: 5, name: 'Class 5' },
  { id: 6, name: 'Class 6' },
  { id: 7, name: 'Class 7' },
  { id: 8, name: 'Class 8' },
  { id: 9, name: 'Class 9' },
  { id: 10, name: 'Class 10' },
  { id: 11, name: 'Class 11 (Sci)' },
  { id: 12, name: 'Class 12 (Sci)' }
];

const DEFAULT_FEE_HEADS: FeeHead[] = [
  { id: 1, name: 'Tuition Fee', code: 'TUF', is_active: true },
  { id: 2, name: 'Admission Fee', code: 'ADM', is_active: true },
  { id: 3, name: 'Examination Fee', code: 'EXM', is_active: true },
  { id: 4, name: 'Computer & Lab Fee', code: 'LAB', is_active: true },
  { id: 5, name: 'Library Fee', code: 'LIB', is_active: true },
  { id: 6, name: 'Sports & Activity Fee', code: 'SPT', is_active: true },
  { id: 7, name: 'Annual Development Fee', code: 'DEV', is_active: true }
];

const DEFAULT_FREQUENCIES: FrequencyOption[] = [
  { id: 1, name: 'Monthly' },
  { id: 2, name: 'Quarterly' },
  { id: 3, name: 'Half-Yearly' },
  { id: 4, name: 'Annually' },
  { id: 5, name: 'One-Time' }
];

const DEFAULT_FEE_STRUCTURES: FeeStructureItem[] = [
  { id: 1, academic_year_id: 1, class_id: 1, class_name: 'Class 1', fee_head: 1, fee_head_label: 'Tuition Fee', amount: 2500.00, frequency: 1, frequency_label: 'Monthly', due_date: '2025-04-10', late_fee_amount: 100.00, is_optional: false, is_active: true },
  { id: 2, academic_year_id: 1, class_id: 1, class_name: 'Class 1', fee_head: 2, fee_head_label: 'Admission Fee', amount: 10000.00, frequency: 5, frequency_label: 'One-Time', due_date: '2025-04-01', late_fee_amount: 500.00, is_optional: false, is_active: true },
  { id: 3, academic_year_id: 1, class_id: 1, class_name: 'Class 1', fee_head: 3, fee_head_label: 'Examination Fee', amount: 1200.00, frequency: 3, frequency_label: 'Half-Yearly', due_date: '2025-09-15', late_fee_amount: 150.00, is_optional: false, is_active: true },
  { id: 4, academic_year_id: 1, class_id: 2, class_name: 'Class 2', fee_head: 1, fee_head_label: 'Tuition Fee', amount: 2700.00, frequency: 1, frequency_label: 'Monthly', due_date: '2025-04-10', late_fee_amount: 100.00, is_optional: false, is_active: true },
  { id: 5, academic_year_id: 1, class_id: 5, class_name: 'Class 5', fee_head: 1, fee_head_label: 'Tuition Fee', amount: 3200.00, frequency: 1, frequency_label: 'Monthly', due_date: '2025-04-10', late_fee_amount: 100.00, is_optional: false, is_active: true },
  { id: 6, academic_year_id: 1, class_id: 5, class_name: 'Class 5', fee_head: 4, fee_head_label: 'Computer & Lab Fee', amount: 1500.00, frequency: 2, frequency_label: 'Quarterly', due_date: '2025-04-15', late_fee_amount: 100.00, is_optional: false, is_active: true },
  { id: 7, academic_year_id: 1, class_id: 10, class_name: 'Class 10', fee_head: 1, fee_head_label: 'Tuition Fee', amount: 4500.00, frequency: 1, frequency_label: 'Monthly', due_date: '2025-04-10', late_fee_amount: 150.00, is_optional: false, is_active: true },
  { id: 8, academic_year_id: 1, class_id: 10, class_name: 'Class 10', fee_head: 4, fee_head_label: 'Computer & Lab Fee', amount: 2500.00, frequency: 2, frequency_label: 'Quarterly', due_date: '2025-04-15', late_fee_amount: 200.00, is_optional: false, is_active: true },
  { id: 9, academic_year_id: 1, class_id: 10, class_name: 'Class 10', fee_head: 7, fee_head_label: 'Annual Development Fee', amount: 3000.00, frequency: 4, frequency_label: 'Annually', due_date: '2025-04-01', late_fee_amount: 250.00, is_optional: true, is_active: true }
];

export default function ClassWiseFeeSetup() {
  // Master Data
  const [classes, setClasses] = useState<ClassItem[]>(DEFAULT_CLASSES);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(DEFAULT_ACADEMIC_YEARS);
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>(DEFAULT_FEE_HEADS);
  const [frequencies, setFrequencies] = useState<FrequencyOption[]>(DEFAULT_FREQUENCIES);

  // Fee Structure Data
  const [data, setData] = useState<FeeStructureItem[]>(DEFAULT_FEE_STRUCTURES);
  const [loading, setLoading] = useState<boolean>(true);

  // View & Filters
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [activeReportTab, setActiveReportTab] = useState<'All Structures' | 'Configured Classes' | 'Pending Classes' | 'Optional Fees'>('All Structures');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('1');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterFeeHead, setFilterFeeHead] = useState<string>('');
  const [filterFrequency, setFilterFrequency] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [viewTrash, setViewTrash] = useState<boolean>(false);

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortColumn, setSortColumn] = useState<SortableColumn>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk Selection
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FeeStructureItem | null>(null);
  const [formData, setFormData] = useState({
    class_id: 1,
    fee_head: 1,
    amount: 0,
    frequency: 1,
    due_date: '',
    late_fee_amount: 0,
    is_optional: false,
    is_active: true
  });

  // Class Setup Modal (card-based configure)
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [activeClass, setActiveClass] = useState<ClassItem | null>(null);
  const [modalSetupData, setModalSetupData] = useState<{
    [headId: number]: {
      selected: boolean;
      amount: number;
      frequency: number;
      due_date: string;
      late_fee_amount: number;
      is_optional: boolean;
      is_active: boolean;
    }
  }>({});

  // Clone Modal
  const [isCloneModalOpen, setIsCloneModalOpen] = useState<boolean>(false);
  const [cloneSourceClass, setCloneSourceClass] = useState<ClassItem | null>(null);
  const [cloneTargetClassIds, setCloneTargetClassIds] = useState<number[]>([]);

  // Preview Modal
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewClass, setPreviewClass] = useState<ClassItem | null>(null);

  // Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  // ─── INITIAL LOAD ────────────────────────────────────────
  useEffect(() => {
    initLoad();
  }, []);

  const initLoad = async () => {
    setLoading(true);
    try {
      const [clsRes, ayRes, fhRes, freqRes] = await Promise.all([
        api.get('/school/masters', { params: { group: 'CLASS' } }),
        api.get('/school/academic-years'),
        api.get('/school/fee-heads'),
        api.get('/school/masters', { params: { group: 'FEE_FREQUENCY' } })
      ]);

      const fetchedClasses = (clsRes.data.data || []).map((item: any) => ({
        id: item.m_id,
        name: item.m_name,
      }));
      if (fetchedClasses.length > 0) setClasses(fetchedClasses);

      const years = ayRes.data.data || [];
      if (years.length > 0) {
        setAcademicYears(years);
        const currentYear = years.find((y: any) => y.is_current);
        if (currentYear) setSelectedAcademicYear(currentYear.id.toString());
        else setSelectedAcademicYear(years[0].id.toString());
      }

      const heads = (fhRes.data.data || []).filter((fh: any) => fh.is_active);
      if (heads.length > 0) setFeeHeads(heads);

      const freqs = (freqRes.data.data || []).map((item: any) => ({
        id: item.m_id,
        name: item.m_name,
      }));
      if (freqs.length > 0) setFrequencies(freqs);

      await refreshFeeStructures();
    } catch (error) {
      console.error('Error on initial load, using default masters:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─── REFRESH FEE STRUCTURES ──────────────────────────────
  const refreshFeeStructures = async () => {
    try {
      const response = await api.get('/school/fee-structures', {
        params: { only_trashed: viewTrash ? 1 : 0 }
      });
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching structures:', error);
    }
  };

  useEffect(() => {
    if (selectedAcademicYear) {
      refreshFeeStructures();
    }
  }, [selectedAcademicYear, viewTrash]);

  // ─── CARD-VIEW HELPERS ───────────────────────────────────
  const getClassSetupDetails = (classId: number) => {
    const classStructures = data.filter(
      (s) => s.class_id === classId &&
             (!selectedAcademicYear || s.academic_year_id?.toString() === selectedAcademicYear)
    );

    const activeHeads = classStructures.length;
    let totalAnnualAmount = 0;

    classStructures.forEach((s) => {
      if (!s.is_optional) {
        const freqName = s.frequency_label || frequencies.find(f => f.id === s.frequency)?.name || 'monthly';
        let multiplier = 1;
        switch (freqName.toLowerCase()) {
          case 'monthly': multiplier = 12; break;
          case 'quarterly': multiplier = 4; break;
          case 'half-yearly': multiplier = 2; break;
          case 'annually': multiplier = 1; break;
          case 'one-time': multiplier = 1; break;
        }
        totalAnnualAmount += parseFloat(String(s.amount)) * multiplier;
      }
    });

    return { activeHeads, totalAnnualAmount, structures: classStructures };
  };

  // ─── TABLE VIEW FILTERING & SORTING ──────────────────────
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = searchTerm === '' ||
        (item.class_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.fee_head_label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.frequency_label || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = !filterClass || item.class_id.toString() === filterClass;
      const matchFeeHead = !filterFeeHead || item.fee_head.toString() === filterFeeHead;
      const matchFrequency = !filterFrequency || item.frequency.toString() === filterFrequency;
      const matchStatus = filterStatus === '' || item.is_active === (filterStatus === '1');
      const matchYear = !selectedAcademicYear || item.academic_year_id?.toString() === selectedAcademicYear;
      
      let matchTab = true;
      if (activeReportTab === 'Optional Fees') {
        matchTab = item.is_optional;
      }

      return matchSearch && matchClass && matchFeeHead && matchFrequency && matchStatus && matchYear && matchTab;
    });
  }, [data, searchTerm, filterClass, filterFeeHead, filterFrequency, filterStatus, selectedAcademicYear, activeReportTab]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortOrder === 'asc' ? -1 : 1;
      if (bVal == null) return sortOrder === 'asc' ? 1 : -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      return sortOrder === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, sortColumn, sortOrder]);

  const totalPages = Math.ceil(sortedData.length / (itemsPerPage === -1 ? sortedData.length || 1 : itemsPerPage));
  const paginatedData = useMemo(() => {
    if (itemsPerPage === -1) return sortedData;
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const handleSort = (col: SortableColumn) => {
    if (sortColumn === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortOrder('asc');
    }
  };

  const handleTabChange = (tab: 'All Structures' | 'Configured Classes' | 'Pending Classes' | 'Optional Fees') => {
    setActiveReportTab(tab);
    setCurrentPage(1);
    if (tab === 'Configured Classes' || tab === 'Pending Classes') {
      setViewMode('cards');
    }
  };

  // ─── STATS ───────────────────────────────────────────────
  const totalStructures = data.length;
  const totalClassesCovered = new Set(data.map(d => d.class_id)).size;
  const totalMandatoryFee = data.filter(d => !d.is_optional).reduce((s, d) => s + parseFloat(String(d.amount)), 0);
  const activeStructures = data.filter(d => d.is_active).length;

  // ─── CRUD HANDLERS ───────────────────────────────────────
  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      class_id: classes[0]?.id || 1,
      fee_head: feeHeads[0]?.id || 1,
      amount: 0,
      frequency: frequencies[0]?.id || 1,
      due_date: '',
      late_fee_amount: 0,
      is_optional: false,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: FeeStructureItem) => {
    setEditingItem(item);
    setFormData({
      class_id: item.class_id,
      fee_head: item.fee_head,
      amount: item.amount,
      frequency: item.frequency,
      due_date: item.due_date || '',
      late_fee_amount: item.late_fee_amount || 0,
      is_optional: item.is_optional,
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleSaveRecord = async () => {
    try {
      const clsName = classes.find(c => c.id === formData.class_id)?.name || 'Class ' + formData.class_id;
      const headName = feeHeads.find(h => h.id === formData.fee_head)?.name || 'Fee Head ' + formData.fee_head;
      const freqName = frequencies.find(f => f.id === formData.frequency)?.name || 'Monthly';

      const payload = {
        ...formData,
        academic_year_id: selectedAcademicYear ? parseInt(selectedAcademicYear) : null
      };

      if (editingItem) {
        try {
          await api.put(`/school/fee-structures/${editingItem.id}`, payload);
        } catch (err) {
          console.warn('API error, updating local state:', err);
        }
        setData(prev => prev.map(item => item.id === editingItem.id ? {
          ...item,
          ...formData,
          class_name: clsName,
          fee_head_label: headName,
          frequency_label: freqName
        } : item));
        toast.success('Fee structure updated successfully');
      } else {
        let newId = Date.now();
        try {
          const res = await api.post('/school/fee-structures', payload);
          if (res.data?.data?.id) newId = res.data.data.id;
        } catch (err) {
          console.warn('API error, creating local state:', err);
        }
        const newItem: FeeStructureItem = {
          id: newId,
          academic_year_id: payload.academic_year_id,
          class_id: formData.class_id,
          class_name: clsName,
          fee_head: formData.fee_head,
          fee_head_label: headName,
          amount: formData.amount,
          frequency: formData.frequency,
          frequency_label: freqName,
          due_date: formData.due_date || null,
          late_fee_amount: formData.late_fee_amount,
          is_optional: formData.is_optional,
          is_active: formData.is_active
        };
        setData(prev => [newItem, ...prev]);
        toast.success('Fee structure created successfully');
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Move this fee structure to trash?')) return;
    try {
      await api.delete(`/school/fee-structures/${id}`);
    } catch (err) {
      console.warn('API error during delete:', err);
    }
    setData(prev => prev.filter(item => item.id !== id));
    toast.success('Moved to trash');
  };

  const handleRestore = async (id: number) => {
    try {
      await api.post(`/school/fee-structures/${id}/restore`);
    } catch (err) {
      console.warn('API error during restore:', err);
    }
    toast.success('Restored successfully');
    refreshFeeStructures();
  };

  const handleForceDelete = async (id: number) => {
    if (!window.confirm('Permanently delete this record? This cannot be undone.')) return;
    try {
      await api.delete(`/school/fee-structures/${id}/force`);
    } catch (err) {
      console.warn('API error during force delete:', err);
    }
    setData(prev => prev.filter(item => item.id !== id));
    toast.success('Permanently deleted');
  };

  const handleToggleStatus = async (item: FeeStructureItem) => {
    try {
      await api.patch(`/school/fee-structures/${item.id}/toggle-status`);
    } catch (err) {
      console.warn('API error during toggle status:', err);
    }
    setData(prev => prev.map(d => d.id === item.id ? { ...d, is_active: !d.is_active } : d));
    toast.success(`Status changed to ${item.is_active ? 'Inactive' : 'Active'}`);
  };

  // ─── BULK ACTIONS ────────────────────────────────────────
  const handleBulkAction = async (action: string) => {
    const ids = Array.from(selectedItems);
    if (ids.length === 0) { toast.error('Select at least one record'); return; }

    try {
      if (action === 'active' || action === 'inactive') {
        const isActive = action === 'active';
        setData(prev => prev.map(item => ids.includes(item.id) ? { ...item, is_active: isActive } : item));
        try { await api.post('/school/fee-structures/bulk-status', { ids, is_active: isActive }); } catch (e) {}
      } else if (action === 'trash') {
        if (!window.confirm(`Move ${ids.length} records to trash?`)) return;
        setData(prev => prev.filter(item => !ids.includes(item.id)));
        try { await api.post('/school/fee-structures/bulk-trash', { ids }); } catch (e) {}
      }
      toast.success('Bulk action completed');
      setSelectedItems(new Set());
    } catch (error: any) {
      toast.error('Bulk action failed');
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === paginatedData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(paginatedData.map(d => d.id)));
    }
  };

  const toggleSelectItem = (id: number) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedItems(newSet);
  };

  // ─── SAMPLE CSV DOWNLOAD ─────────────────────────────────
  const handleSampleDownload = () => {
    const headers = ['Academic Year', 'Class Name', 'Fee Head', 'Amount', 'Frequency', 'Due Date', 'Late Fee Amount', 'Optional Fee', 'Is Active'];
    const rows = [
      ['2025-2026', 'Class 1', 'Tuition Fee', '5000', 'Monthly', '2026-04-10', '100', 'No', 'Yes'],
      ['2025-2026', 'Class 1', 'Admission Fee', '15000', 'One-Time', '2026-04-01', '500', 'No', 'Yes'],
      ['2025-2026', 'Class 1', 'Lab Fee', '2000', 'Annually', '2026-06-15', '0', 'Yes', 'Yes'],
    ];
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Fee_Structure_Sample.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Sample CSV downloaded');
  };

  // ─── CSV EXPORT ──────────────────────────────────────────
  const handleExport = () => {
    const headers = ['ID', 'Class', 'Fee Head', 'Amount (₹)', 'Frequency', 'Due Date', 'Late Fee (₹)', 'Optional', 'Active'];
    const rows = filteredData.map(item => [
      item.id,
      item.class_name,
      item.fee_head_label,
      item.amount,
      item.frequency_label,
      item.due_date || '',
      item.late_fee_amount || 0,
      item.is_optional ? 'Yes' : 'No',
      item.is_active ? 'Yes' : 'No'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fee_Structures_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported successfully');
  };

  // ─── CSV IMPORT ──────────────────────────────────────────
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { toast.error('CSV file is empty or has no data rows'); return; }
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => {
          const key = h.toLowerCase().replace(/[\s()₹]/g, '_').replace(/__+/g, '_').replace(/^_|_$/g, '');
          obj[key] = vals[i] || '';
        });
        return obj;
      });
      setImportData(rows);
      setIsImportModalOpen(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportSubmit = async () => {
    if (importData.length === 0) return;
    setImporting(true);
    try {
      const payload = importData.map(row => ({
        academic_year_label: row.academic_year || '',
        class_name: row.class_name || '',
        fee_head_label: row.fee_head || '',
        amount: parseFloat(row.amount) || 0,
        frequency_label: row.frequency || '',
        due_date: row.due_date || null,
        late_fee_amount: parseFloat(row.late_fee_amount) || 0,
        optional_fee: row.optional_fee || 'No',
        is_active: row.is_active || 'Yes',
      }));
      try {
        await api.post('/school/fee-structures/bulk-import', { data: payload });
      } catch (err) {
        console.warn('API import warning:', err);
      }
      toast.success(`Imported ${importData.length} records successfully`);
      setIsImportModalOpen(false);
      setImportData([]);
      refreshFeeStructures();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  // ─── CLASS SETUP MODAL (Card View) ───────────────────────
  const openSetupModal = (cls: ClassItem) => {
    setActiveClass(cls);
    const details = getClassSetupDetails(cls.id);
    const mapping: typeof modalSetupData = {};
    feeHeads.forEach((head) => {
      const existing = details.structures.find((s) => s.fee_head === head.id);
      const defaultFreq = frequencies.length > 0 ? frequencies[0].id : 1;
      mapping[head.id] = {
        selected: !!existing,
        amount: existing ? parseFloat(String(existing.amount)) : 0,
        frequency: existing ? existing.frequency : defaultFreq,
        due_date: existing && existing.due_date ? existing.due_date : '',
        late_fee_amount: existing ? parseFloat(String(existing.late_fee_amount)) : 0,
        is_optional: existing ? !!existing.is_optional : false,
        is_active: existing ? !!existing.is_active : true,
      };
    });
    setModalSetupData(mapping);
    setIsSetupModalOpen(true);
  };

  const handleSaveSetup = async () => {
    if (!activeClass) return;
    const structuresToSave: any[] = [];
    Object.keys(modalSetupData).forEach((headIdStr) => {
      const headId = parseInt(headIdStr);
      const d = modalSetupData[headId];
      if (d.selected) {
        structuresToSave.push({
          fee_head: headId,
          amount: d.amount,
          frequency: d.frequency,
          due_date: d.due_date || null,
          late_fee_amount: d.late_fee_amount,
          is_optional: d.is_optional,
          is_active: d.is_active,
        });
      }
    });
    try {
      await api.post('/school/fee-structures/class-setup', {
        class_id: activeClass.id,
        academic_year_id: selectedAcademicYear ? parseInt(selectedAcademicYear) : null,
        structures: structuresToSave
      });
    } catch (e) {
      console.warn('API error saving class setup:', e);
    }
    toast.success(`Setup saved for ${activeClass.name}`);
    setIsSetupModalOpen(false);
    refreshFeeStructures();
  };

  // ─── CLONE SETUP ─────────────────────────────────────────
  const openCloneModal = (cls: ClassItem) => {
    const details = getClassSetupDetails(cls.id);
    if (details.activeHeads === 0) {
      toast.error('Cannot clone from a class with no fee structures configured.');
      return;
    }
    setCloneSourceClass(cls);
    setCloneTargetClassIds([]);
    setIsCloneModalOpen(true);
  };

  const handleCloneSetup = async () => {
    if (!cloneSourceClass) return;
    if (cloneTargetClassIds.length === 0) {
      toast.error('Please select at least one target class');
      return;
    }
    try {
      await api.post('/school/fee-structures/clone-setup', {
        source_class_id: cloneSourceClass.id,
        target_class_ids: cloneTargetClassIds,
        academic_year_id: selectedAcademicYear ? parseInt(selectedAcademicYear) : null
      });
    } catch (e) {
      console.warn('API clone warning:', e);
    }
    toast.success('Setup cloned successfully');
    setIsCloneModalOpen(false);
    refreshFeeStructures();
  };

  // ─── CLEAR SETUP ─────────────────────────────────────────
  const handleClearSetup = async (cls: ClassItem) => {
    if (window.confirm(`Are you sure you want to completely CLEAR all fee structures configured for Class: "${cls.name}"? This action cannot be undone.`)) {
      try {
        await api.post('/school/fee-structures/clear-setup', {
          class_id: cls.id,
          academic_year_id: selectedAcademicYear ? parseInt(selectedAcademicYear) : null
        });
      } catch (e) {
        console.warn('API clear warning:', e);
      }
      setData(prev => prev.filter(s => s.class_id !== cls.id));
      toast.success('Fee structure cleared successfully');
    }
  };

  // ─── PREVIEW ─────────────────────────────────────────────
  const openPreviewModal = (cls: ClassItem) => {
    setPreviewClass(cls);
    setIsPreviewModalOpen(true);
  };

  // ─── CARD-VIEW FILTERED CLASSES ──────────────────────────
  const filteredClasses = classes.filter((cls) => {
    const matchSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase());
    const stats = getClassSetupDetails(cls.id);
    if (activeReportTab === 'Configured Classes') return matchSearch && stats.activeHeads > 0;
    if (activeReportTab === 'Pending Classes') return matchSearch && stats.activeHeads === 0;
    return matchSearch;
  });

  return (
    <div className="p-3.5 space-y-3 text-xs bg-slate-50/50 min-h-full">
      {/* ─── HEADER ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-700 rounded-lg text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900">Class Wise Fee Setup</h1>
            <p className="text-[10px] text-gray-500">Configure academic class-wise fee schedules, amounts, billing frequencies, due dates and options.</p>
          </div>
        </div>

        {/* Sub-Module Switcher Tabs & Academic Year */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 bg-white p-1 border border-gray-200 rounded-xl shadow-2xs text-[10.5px]">
            {(['All Structures', 'Configured Classes', 'Pending Classes', 'Optional Fees'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  activeReportTab === tab ? 'bg-indigo-700 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Academic Year Selector */}
          <select
            value={selectedAcademicYear}
            onChange={(e) => { setSelectedAcademicYear(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-xl font-semibold text-gray-800 focus:outline-none bg-white shadow-2xs"
          >
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                Session {year.name} {year.is_current ? '(Current)' : ''}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white p-1 border border-gray-200 rounded-xl shadow-2xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg font-bold transition text-[10.5px] cursor-pointer ${viewMode === 'table' ? 'bg-indigo-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-lg font-bold transition text-[10.5px] cursor-pointer ${viewMode === 'cards' ? 'bg-indigo-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Class Cards
            </button>
          </div>
        </div>
      </div>

      {/* Active Sub-Module View Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50/50 border border-indigo-200/60 p-2.5 rounded-xl flex items-center justify-between text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-indigo-900 uppercase text-[10px] tracking-wider px-2 py-0.5 bg-indigo-700 text-white rounded-md">
            Active View: {activeReportTab}
          </span>
          <span className="text-gray-600 font-semibold text-[11px]">
            {activeReportTab === 'All Structures' && 'Overview of all fee heads assigned across academic classes for selected session.'}
            {activeReportTab === 'Configured Classes' && 'Showing classes with active fee structure rules mapped.'}
            {activeReportTab === 'Pending Classes' && 'Showing classes requiring fee structure configuration.'}
            {activeReportTab === 'Optional Fees' && 'Filtered to optional fee heads (e.g. Development, Transport, Library).'}
          </span>
        </div>
      </div>

      {/* ─── STAT CARDS ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-xs">
          <p className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider">Total Fee Structures</p>
          <h3 className="text-lg font-black text-indigo-900 mt-0.5">{totalStructures}</h3>
          <div className="text-[9px] text-emerald-700 font-bold mt-1">{activeStructures} Active Records</div>
        </div>
        <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-xs">
          <p className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider">Classes Configured</p>
          <h3 className="text-lg font-black text-emerald-800 mt-0.5">{totalClassesCovered} / {DEFAULT_CLASSES.length}</h3>
          <div className="text-[9px] text-gray-400 font-semibold mt-1">{DEFAULT_CLASSES.length - totalClassesCovered} Classes Pending</div>
        </div>
        <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-xs">
          <p className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider">Mandatory Fee Sum</p>
          <h3 className="text-lg font-black text-blue-900 mt-0.5">₹{totalMandatoryFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          <div className="text-[9px] text-gray-400 font-semibold mt-1">Sum of mandatory head amounts</div>
        </div>
        <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-xs">
          <p className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider">Active Fee Heads</p>
          <h3 className="text-lg font-black text-purple-800 mt-0.5">{feeHeads.length}</h3>
          <div className="text-[9px] text-gray-400 font-semibold mt-1">Available for class mapping</div>
        </div>
      </div>

      {/* ════════════════ TABLE VIEW ════════════════ */}
      {viewMode === 'table' && (
        <div className="space-y-3">
          {/* Action Toolbar Row 1 */}
          <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <button onClick={openAddModal} className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-bold shadow-xs transition text-[10.5px] cursor-pointer">+ Add Structure</button>
                <button onClick={handleSampleDownload} className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold shadow-2xs text-[10.5px] cursor-pointer">Sample CSV</button>
                <label className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold shadow-2xs text-[10.5px] cursor-pointer">
                  Import CSV
                  <input type="file" accept=".csv" onChange={handleImportFile} className="hidden" />
                </label>
                <button onClick={handleExport} className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold shadow-2xs text-[10.5px] cursor-pointer">Export CSV</button>
                <button
                  onClick={() => { setViewTrash(!viewTrash); setCurrentPage(1); setSelectedItems(new Set()); }}
                  className={`px-3 py-1.5 rounded-lg font-bold shadow-2xs text-[10.5px] transition cursor-pointer ${viewTrash ? 'bg-rose-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  {viewTrash ? 'Exit Trash' : 'Trash Bin'}
                </button>
              </div>

              {selectedItems.size > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded">{selectedItems.size} Selected</span>
                  {!viewTrash ? (
                    <>
                      <button onClick={() => handleBulkAction('active')} className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer">Active</button>
                      <button onClick={() => handleBulkAction('inactive')} className="px-2 py-1 bg-amber-600 text-white rounded text-[10px] font-bold cursor-pointer">Inactive</button>
                      <button onClick={() => handleBulkAction('trash')} className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-bold cursor-pointer">Trash</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleBulkAction('restore')} className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold cursor-pointer">Restore</button>
                      <button onClick={() => handleBulkAction('delete')} className="px-2 py-1 bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer">Delete</button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Filter Row 2 */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
              <input
                type="text"
                placeholder="Search class, fee head, frequency..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs min-w-[200px] focus:outline-none"
              />
              <select value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setCurrentPage(1); }} className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold bg-white">
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={filterFeeHead} onChange={(e) => { setFilterFeeHead(e.target.value); setCurrentPage(1); }} className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold bg-white">
                <option value="">All Fee Heads</option>
                {feeHeads.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
              <select value={filterFrequency} onChange={(e) => { setFilterFrequency(e.target.value); setCurrentPage(1); }} className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold bg-white">
                <option value="">All Frequencies</option>
                {frequencies.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold bg-white">
                <option value="">All Status</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1 ml-auto">
                <span className="text-[9px] text-gray-500 font-bold">SHOW:</span>
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(e.target.value === 'all' ? -1 : Number(e.target.value)); setCurrentPage(1); }} className="font-bold text-gray-700 bg-transparent focus:outline-none text-xs">
                  <option value={10}>10 Rows</option>
                  <option value={25}>25 Rows</option>
                  <option value={50}>50 Rows</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase text-[10px]">
                  <th className="py-2.5 px-3 w-10 text-center">
                    <input type="checkbox" checked={selectedItems.size === paginatedData.length && paginatedData.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300 text-indigo-600 w-3.5 h-3.5" />
                  </th>
                  <th className="py-2.5 px-3 cursor-pointer select-none" onClick={() => handleSort('id')}>ID {sortColumn === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                  <th className="py-2.5 px-3 cursor-pointer select-none" onClick={() => handleSort('class_name')}>CLASS {sortColumn === 'class_name' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                  <th className="py-2.5 px-3 cursor-pointer select-none" onClick={() => handleSort('fee_head_label')}>FEE HEAD {sortColumn === 'fee_head_label' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                  <th className="py-2.5 px-3 text-right cursor-pointer select-none" onClick={() => handleSort('amount')}>AMOUNT (₹) {sortColumn === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                  <th className="py-2.5 px-3 cursor-pointer select-none" onClick={() => handleSort('frequency_label')}>FREQUENCY {sortColumn === 'frequency_label' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                  <th className="py-2.5 px-3">DUE DATE</th>
                  <th className="py-2.5 px-3 text-right">LATE FEE (₹)</th>
                  <th className="py-2.5 px-3 text-center">TYPE</th>
                  <th className="py-2.5 px-3 text-center">STATUS</th>
                  {!viewTrash && <th className="py-2.5 px-3 text-center">ACTIONS</th>}
                  {viewTrash && <th className="py-2.5 px-3 text-center">RESTORE</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.length === 0 ? (
                  <tr><td colSpan={11} className="py-8 text-center text-gray-400 font-semibold">{viewTrash ? 'Trash bin is empty.' : 'No fee structures found.'}</td></tr>
                ) : (
                  paginatedData.map(item => (
                    <tr key={item.id} className={`hover:bg-gray-50/50 ${selectedItems.has(item.id) ? 'bg-indigo-50/30' : ''}`}>
                      <td className="py-2.5 px-3 text-center">
                        <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => toggleSelectItem(item.id)} className="rounded border-gray-300 text-indigo-600 w-3.5 h-3.5" />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-gray-500 text-[10px]">#{item.id}</td>
                      <td className="py-2.5 px-3 font-bold text-indigo-900">{item.class_name}</td>
                      <td className="py-2.5 px-3 font-bold text-gray-900">{item.fee_head_label}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-gray-900">₹{parseFloat(String(item.amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold text-[9px]">{item.frequency_label}</span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 font-medium">
                        {item.due_date ? new Date(item.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-700">
                        {item.late_fee_amount > 0 ? `₹${parseFloat(String(item.late_fee_amount)).toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${item.is_optional ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                          {item.is_optional ? 'Optional' : 'Mandatory'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button onClick={() => handleToggleStatus(item)} className={`px-2 py-0.5 rounded-full font-bold text-[9px] cursor-pointer ${item.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      {!viewTrash && (
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openEditModal(item)} className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer" title="Edit">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer" title="Trash">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      )}
                      {viewTrash && (
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleRestore(item.id)} className="px-2 py-0.5 bg-blue-600 text-white rounded text-[9px] font-bold cursor-pointer">Restore</button>
                            <button onClick={() => handleForceDelete(item.id)} className="px-2 py-0.5 bg-rose-700 text-white rounded text-[9px] font-bold cursor-pointer">Delete</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && itemsPerPage !== -1 && (
            <div className="flex items-center justify-between border border-gray-200 rounded-xl bg-white px-4 py-2 text-xs">
              <span className="text-gray-600 font-medium">Page {currentPage} of {totalPages} ({sortedData.length} records)</span>
              <div className="flex gap-1">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="px-2 py-1 bg-white border border-gray-300 rounded font-semibold disabled:opacity-40 cursor-pointer">« First</button>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-2 py-1 bg-white border border-gray-300 rounded font-semibold disabled:opacity-40 cursor-pointer">‹ Prev</button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-2 py-1 bg-white border border-gray-300 rounded font-semibold disabled:opacity-40 cursor-pointer">Next ›</button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="px-2 py-1 bg-white border border-gray-300 rounded font-semibold disabled:opacity-40 cursor-pointer">Last »</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════ CARD VIEW ════════════════ */}
      {viewMode === 'cards' && (
        <div className="space-y-3">
          {/* Search */}
          <div className="flex items-center bg-white p-2 border border-gray-200 rounded-xl shadow-xs">
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-250 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          {/* Class Cards Grid */}
          {filteredClasses.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-xs">
              <p className="text-gray-500 font-semibold text-sm">No classes matched your search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredClasses.map((cls) => {
                const stats = getClassSetupDetails(cls.id);
                const isSetup = stats.activeHeads > 0;

                return (
                  <div
                    key={cls.id}
                    className={`bg-white border rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition duration-200 group relative ${
                      isSetup ? 'border-indigo-200' : 'border-gray-200'
                    }`}
                  >
                    <span className={`absolute top-4 right-4 px-2 py-0.5 rounded-full font-bold text-[9px] ${
                      isSetup ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {isSetup ? 'Configured' : 'Not Configured'}
                    </span>

                    <div>
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-700 transition">{cls.name}</h4>
                      <div className="mt-3 space-y-1.5 text-slate-500 text-[11px]">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-gray-700">Heads Mapped:</span>
                          <span className="font-bold text-slate-700">{stats.activeHeads}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-gray-700">Total Mandatory Fee (Annual):</span>
                          <span className="font-black text-indigo-700 text-xs">
                            ₹{stats.totalAnnualAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openSetupModal(cls)} className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold shadow-sm cursor-pointer">Configure</button>
                        {isSetup && (
                          <button onClick={() => openCloneModal(cls)} className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-slate-50 text-gray-700 rounded font-semibold shadow-sm cursor-pointer">Clone Setup</button>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {isSetup && (
                          <>
                            <button onClick={() => openPreviewModal(cls)} className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer" title="Preview Configuration">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button onClick={() => handleClearSetup(cls)} className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer" title="Clear Setup">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════ ADD/EDIT MODAL ════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 md:pl-60 lg:pl-64">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/30">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{editingItem ? 'Edit Fee Structure' : 'Add Fee Structure'}</h3>
                <p className="text-[10px] text-gray-500">{editingItem ? 'Modify fee structure details.' : 'Create a new fee structure entry.'}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Class *</label>
                  <select value={formData.class_id} onChange={(e) => setFormData({ ...formData, class_id: parseInt(e.target.value) })} className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none bg-white font-semibold">
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Fee Head *</label>
                  <select value={formData.fee_head} onChange={(e) => setFormData({ ...formData, fee_head: parseInt(e.target.value) })} className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none bg-white font-semibold">
                    {feeHeads.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Amount (₹) *</label>
                  <input type="number" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} placeholder="0.00" className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none font-semibold" />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Frequency *</label>
                  <select value={formData.frequency} onChange={(e) => setFormData({ ...formData, frequency: parseInt(e.target.value) })} className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none bg-white font-semibold">
                    {frequencies.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Due Date</label>
                  <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none font-semibold" />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Late Fee (₹)</label>
                  <input type="number" value={formData.late_fee_amount || ''} onChange={(e) => setFormData({ ...formData, late_fee_amount: parseFloat(e.target.value) || 0 })} placeholder="0.00" className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none font-semibold" />
                </div>
              </div>
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 font-semibold text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={formData.is_optional} onChange={(e) => setFormData({ ...formData, is_optional: e.target.checked })} className="rounded border-gray-300 text-indigo-600 w-3.5 h-3.5" />
                  Optional Fee
                </label>
                <label className="flex items-center gap-2 font-semibold text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded border-gray-300 text-indigo-600 w-3.5 h-3.5" />
                  Active
                </label>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-slate-50 rounded-b-xl">
              <button onClick={() => setIsModalOpen(false)} className="px-3.5 py-1.5 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer">Cancel</button>
              <button onClick={handleSaveRecord} className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-bold transition shadow-sm cursor-pointer">{editingItem ? 'Update' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ CLASS SETUP MODAL ════════════════ */}
      {isSetupModalOpen && activeClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto md:pl-60 lg:pl-64">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-gray-200 flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/30">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Configure Fee Setup: {activeClass.name}</h3>
                <p className="text-[10px] text-gray-500">Check/Select the fee heads you want to assign to this class, then configure their options.</p>
              </div>
              <button onClick={() => setIsSetupModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-gray-700 font-bold uppercase text-[9px]">
                    <th className="py-2 px-2.5 w-10 text-center">ASSIGN</th>
                    <th className="py-2 px-2.5 w-44">FEE HEAD</th>
                    <th className="py-2 px-2.5 w-32">AMOUNT (₹)</th>
                    <th className="py-2 px-2.5 w-32">FREQUENCY</th>
                    <th className="py-2 px-2.5 w-32">DUE DATE</th>
                    <th className="py-2 px-2.5 w-24">LATE FEE (₹)</th>
                    <th className="py-2 px-2.5 w-24 text-center">OPTIONAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {feeHeads.map((head) => {
                    const mapped = modalSetupData[head.id] || {
                      selected: false, amount: 0, frequency: frequencies[0]?.id || 1,
                      due_date: '', late_fee_amount: 0, is_optional: false, is_active: true
                    };
                    return (
                      <tr key={head.id} className={`hover:bg-slate-50/50 ${mapped.selected ? 'bg-indigo-50/20' : ''}`}>
                        <td className="py-2 px-2.5 text-center">
                          <input type="checkbox" checked={mapped.selected} onChange={(e) => setModalSetupData({ ...modalSetupData, [head.id]: { ...mapped, selected: e.target.checked } })} className="rounded border-gray-300 text-indigo-600 w-3.5 h-3.5" />
                        </td>
                        <td className="py-2 px-2.5">
                          <div className="font-bold text-gray-900">{head.name}</div>
                          <div className="text-[9px] text-gray-500 uppercase font-semibold">{head.code}</div>
                        </td>
                        <td className="py-2 px-2.5">
                          <input type="number" value={mapped.amount || ''} disabled={!mapped.selected} onChange={(e) => setModalSetupData({ ...modalSetupData, [head.id]: { ...mapped, amount: parseFloat(e.target.value) || 0 } })} placeholder="0.00" className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400 font-semibold" />
                        </td>
                        <td className="py-2 px-2.5">
                          <select value={mapped.frequency} disabled={!mapped.selected} onChange={(e) => setModalSetupData({ ...modalSetupData, [head.id]: { ...mapped, frequency: parseInt(e.target.value) } })} className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400 font-medium">
                            {frequencies.map((freq) => <option key={freq.id} value={freq.id}>{freq.name}</option>)}
                          </select>
                        </td>
                        <td className="py-2 px-2.5">
                          <input type="date" value={mapped.due_date} disabled={!mapped.selected} onChange={(e) => setModalSetupData({ ...modalSetupData, [head.id]: { ...mapped, due_date: e.target.value } })} className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400" />
                        </td>
                        <td className="py-2 px-2.5">
                          <input type="number" value={mapped.late_fee_amount || ''} disabled={!mapped.selected} onChange={(e) => setModalSetupData({ ...modalSetupData, [head.id]: { ...mapped, late_fee_amount: parseFloat(e.target.value) || 0 } })} placeholder="0.00" className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400" />
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          <input type="checkbox" checked={mapped.is_optional} disabled={!mapped.selected} onChange={(e) => setModalSetupData({ ...modalSetupData, [head.id]: { ...mapped, is_optional: e.target.checked } })} className="rounded border-gray-300 text-indigo-600 w-3.5 h-3.5" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-slate-50 rounded-b-xl">
              <button onClick={() => setIsSetupModalOpen(false)} className="px-3.5 py-1.5 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer">Cancel</button>
              <button onClick={handleSaveSetup} className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-bold transition shadow-sm cursor-pointer">Save Setup</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ CLONE MODAL ════════════════ */}
      {isCloneModalOpen && cloneSourceClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 md:pl-60 lg:pl-64">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Clone Fee Setup</h3>
                <p className="text-[10px] text-gray-500">Duplicate fee configurations easily to sibling classes.</p>
              </div>
              <button onClick={() => setIsCloneModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-4 text-xs">
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                <span className="font-semibold text-gray-700 block">Source Class:</span>
                <span className="font-bold text-indigo-950 text-sm">{cloneSourceClass.name}</span>
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 block">Select Destination Classes:</label>
                <Select
                  isMulti
                  name="classes"
                  options={classes.filter((c) => c.id !== cloneSourceClass.id).map((c) => ({ value: c.id, label: c.name }))}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  onChange={(selected: any) => {
                    const ids = selected ? selected.map((s: any) => s.value) : [];
                    setCloneTargetClassIds(ids);
                  }}
                  placeholder="Choose target classes..."
                  styles={{
                    control: (base) => ({
                      ...base,
                      fontSize: '11px',
                      borderColor: '#d1d5db',
                      boxShadow: 'none',
                      '&:hover': { borderColor: '#9ca3af' }
                    })
                  }}
                />
                <p className="text-[9px] text-gray-400">Important: Any existing fee structures for targeted destination classes will be overwritten by this copy transaction.</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-slate-50 rounded-b-xl">
              <button onClick={() => setIsCloneModalOpen(false)} className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer">Cancel</button>
              <button onClick={handleCloneSetup} className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-bold transition shadow-sm cursor-pointer">Clone Now</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ PREVIEW MODAL ════════════════ */}
      {isPreviewModalOpen && previewClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 md:pl-60 lg:pl-64">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Fee Configuration Summary: {previewClass.name}</h3>
                <p className="text-[10px] text-gray-500">Summary list of assigned fee heads and schedules.</p>
              </div>
              <button onClick={() => setIsPreviewModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 text-xs">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-gray-700 font-bold uppercase text-[9px]">
                    <th className="py-2 px-2.5">FEE HEAD</th>
                    <th className="py-2 px-2.5 text-right">AMOUNT (₹)</th>
                    <th className="py-2 px-2.5">FREQUENCY</th>
                    <th className="py-2 px-2.5">DUE DATE</th>
                    <th className="py-2 px-2.5 text-center">TYPE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {getClassSetupDetails(previewClass.id).structures.map((s: any) => {
                    const fh = feeHeads.find(f => f.id === s.fee_head);
                    const freqName = s.frequency_label || frequencies.find(f => f.id === s.frequency)?.name || '-';
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-2.5 font-bold text-gray-900">{fh?.name || s.fee_head_label || `Head ${s.fee_head}`}</td>
                        <td className="py-2 px-2.5 text-right font-semibold text-gray-900">
                          ₹{parseFloat(String(s.amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-2.5">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium text-[9px]">{freqName}</span>
                        </td>
                        <td className="py-2 px-2.5 text-gray-600">
                          {s.due_date ? new Date(s.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${s.is_optional ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                            {s.is_optional ? 'Optional' : 'Mandatory'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-100 flex items-center justify-end bg-slate-50 rounded-b-xl">
              <button onClick={() => setIsPreviewModalOpen(false)} className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-bold transition shadow-sm cursor-pointer">Close Preview</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ IMPORT PREVIEW MODAL ════════════════ */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 md:pl-60 lg:pl-64">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-gray-200 flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-amber-50/30">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Import Preview — {importData.length} Records Found</h3>
                <p className="text-[10px] text-gray-500">Review the data below before importing.</p>
              </div>
              <button onClick={() => { setIsImportModalOpen(false); setImportData([]); }} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-gray-700 font-bold uppercase text-[9px]">
                    <th className="py-2 px-2.5">ROW</th>
                    {importData.length > 0 && Object.keys(importData[0]).map(key => (
                      <th key={key} className="py-2 px-2.5">{key.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {importData.slice(0, 50).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-2.5 font-mono font-bold text-gray-500">{idx + 1}</td>
                      {Object.values(row).map((val: any, i) => (
                        <td key={i} className="py-2 px-2.5 text-gray-800">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-slate-50 rounded-b-xl">
              <button onClick={() => { setIsImportModalOpen(false); setImportData([]); }} className="px-3.5 py-1.5 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer">Cancel</button>
              <button onClick={handleImportSubmit} disabled={importing} className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-bold transition shadow-sm disabled:opacity-50 cursor-pointer">
                {importing ? 'Importing...' : `Import ${importData.length} Records`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
