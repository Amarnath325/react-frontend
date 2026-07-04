import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

interface MasterItem {
  m_id: number;
  m_name: string;
  m_alias_name?: string | null;
}

interface Weekoff {
  id: number;
  school_id: number;
  name?: string;
  academic_year_id: number;
  day_id: number;
  occurrence_ids?: number[] | null;
  class_ids?: number[] | null;
  is_active: boolean;
  day?: MasterItem | null;
  start_date?: string | null;
  end_date?: string | null;
}

// Compact Toggle Switch Component
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1
        ${checked ? 'bg-green-500' : 'bg-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform duration-200
          ${checked ? 'translate-x-[18px]' : 'translate-x-1'}
        `}
      />
    </button>
  );
};

// Premium theme styling for react-select matching our Tailwind design
const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.5rem',
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.15)' : 'none',
    minHeight: '38px',
    backgroundColor: '#ffffff',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    },
    transition: 'all 0.15s ease',
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 12px',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0',
    padding: '0',
    fontSize: '13px',
    color: '#111827',
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: '13px',
    color: '#9ca3af',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '13px',
    color: '#111827',
  }),
  multiValue: (base: any) => ({
    ...base,
    backgroundColor: '#eff6ff',
    borderRadius: '0.25rem',
    color: '#1e40af',
    border: '1px solid #bfdbfe',
  }),
  multiValueLabel: (base: any) => ({
    ...base,
    fontSize: '11px',
    color: '#1e40af',
    padding: '2px 6px',
  }),
  multiValueRemove: (base: any) => ({
    ...base,
    color: '#3b82f6',
    '&:hover': {
      backgroundColor: '#dbeafe',
      color: '#1d4ed8',
    },
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#2563eb'
      : state.isFocused
        ? '#f3f4f6'
        : 'transparent',
    color: state.isSelected ? '#ffffff' : '#374151',
    fontSize: '13px',
    padding: '8px 12px',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: state.isSelected ? '#2563eb' : '#e5e7eb',
    },
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #e5e7eb',
    marginTop: '4px',
    zIndex: 9999,
  }),
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 9999,
  }),
  noOptionsMessage: (base: any) => ({
    ...base,
    fontSize: '13px',
    padding: '6px 12px',
  }),
  clearIndicator: (base: any) => ({
    ...base,
    padding: '4px',
    cursor: 'pointer',
    color: '#9ca3af',
    '&:hover': {
      color: '#ef4444',
    },
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    padding: '4px',
    cursor: 'pointer',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
};

const compactSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.375rem',
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.15)' : 'none',
    minHeight: '28px',
    backgroundColor: '#ffffff',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    },
    transition: 'all 0.15s ease',
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 8px',
    display: 'flex',
    alignItems: 'center',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0',
    padding: '0',
    fontSize: '11px',
    color: '#111827',
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: '11px',
    color: '#9ca3af',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '11px',
    color: '#111827',
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: '26px',
    display: 'flex',
    alignItems: 'center',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#2563eb'
      : state.isFocused
        ? '#f3f4f6'
        : 'transparent',
    color: state.isSelected ? '#ffffff' : '#374151',
    fontSize: '11px',
    padding: '6px 8px',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: state.isSelected ? '#2563eb' : '#e5e7eb',
    },
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '0.375rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #e5e7eb',
    marginTop: '2px',
    zIndex: 9999,
  }),
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 9999,
  }),
  noOptionsMessage: (base: any) => ({
    ...base,
    fontSize: '11px',
    padding: '4px 8px',
  }),
  clearIndicator: (base: any) => ({
    ...base,
    padding: '2px',
    cursor: 'pointer',
    color: '#9ca3af',
    '&:hover': {
      color: '#ef4444',
    },
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    padding: '2px',
    cursor: 'pointer',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
};

interface SearchableSelectProps {
  options: { value: string | number; label: string }[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder: string;
  isClearable?: boolean;
  className?: string;
  compact?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  isClearable = false,
  className = '',
  compact = false,
}) => {
  const selectedOption = options.find(opt => String(opt.value) === String(value)) || null;

  return (
    <div className={className}>
      <Select
        options={options}
        value={selectedOption}
        onChange={(selected: any) => {
          onChange(selected ? String(selected.value) : '');
        }}
        placeholder={placeholder}
        isClearable={isClearable}
        isSearchable={true}
        styles={compact ? compactSelectStyles : customSelectStyles}
        className={compact ? 'text-[11px]' : 'text-[13px]'}
      />
    </div>
  );
};

const WeekoffManager: React.FC = () => {
  const [weekoffs, setWeekoffs] = useState<Weekoff[]>([]);
  const [filteredData, setFilteredData] = useState<Weekoff[]>([]);
  const [academicYears, setAcademicYears] = useState<{ value: number; label: string; is_current: boolean; start_date?: string; end_date?: string }[]>([]);
  const [dayOptions, setDayOptions] = useState<MasterItem[]>([]);
  const [occurrenceOptions, setOccurrenceOptions] = useState<MasterItem[]>([]);
  const [classOptions, setClassOptions] = useState<{ value: number; label: string }[]>([]);

  // Loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal toggle states
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Import states
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Filters & layout states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortColumn, setSortColumn] = useState<string>('day_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Trashing & selections
  const [showTrashed, setShowTrashed] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Form states in Modal
  const [editingWeekoff, setEditingWeekoff] = useState<Weekoff | null>(null);
  const [modalName, setModalName] = useState<string>('');
  const [modalAcademicYear, setModalAcademicYear] = useState<string>('');
  const [modalClasses, setModalClasses] = useState<number[]>([]);
  const [modalStartDate, setModalStartDate] = useState<string>('');
  const [modalEndDate, setModalEndDate] = useState<string>('');
  const [gridState, setGridState] = useState<{ [key: number]: { [key: number]: boolean } }>({});

  const isMounted = useRef(false);

  const isPastRule = (w: Weekoff) => {
    const today = new Date().toISOString().split('T')[0];
    if (w.start_date && w.start_date < today) return true;
    if (w.end_date && w.end_date < today) return true;
    return false;
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (isMounted.current && !initialLoading) {
      fetchWeekoffsSilently();
    } else if (!isMounted.current) {
      isMounted.current = true;
    }
  }, [showTrashed, filterAcademicYear]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [weekoffs, searchTerm, sortColumn, sortDirection]);

  const loadInitialData = async () => {
    setInitialLoading(true);
    try {
      const [yearsResponse, daysResponse, occurrencesResponse, classesResponse] = await Promise.all([
        api.get('/school/academic-years'),
        api.get('/master/group/WEEK_DAYS'),
        api.get('/master/group/WEEK_DAYS_OCCURANCE'),
        api.get('/master/group/CLASS')
      ]);

      let initialYearId = '';

      // Set Academic Years
      if (yearsResponse.data.success) {
        const years = yearsResponse.data.data.map((y: any) => ({
          value: y.id,
          label: y.name,
          is_current: y.is_current,
          start_date: y.start_date ? y.start_date.substring(0, 10) : '',
          end_date: y.end_date ? y.end_date.substring(0, 10) : '',
        }));
        setAcademicYears(years);

        const currentYear = years.find((y: any) => y.is_current);
        if (currentYear) {
          initialYearId = currentYear.value.toString();
          setFilterAcademicYear(initialYearId);
          setModalAcademicYear(initialYearId);
        }
      }

      // Set Days
      if (daysResponse.data.success) {
        setDayOptions(daysResponse.data.data);
      }

      // Set Occurrences
      if (occurrencesResponse.data.success) {
        setOccurrenceOptions(occurrencesResponse.data.data);
      }

      // Set Classes
      if (classesResponse.data.success) {
        setClassOptions(classesResponse.data.data.map((item: any) => ({
          value: item.m_id,
          label: item.m_name,
        })));
      }

      // Fetch Weekoffs
      const weekoffsResponse = await api.get('/school/weekoffs', {
        params: {
          only_trashed: showTrashed,
          academic_year_id: initialYearId || null
        }
      });
      if (weekoffsResponse.data.success) {
        setWeekoffs(weekoffsResponse.data.data);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load Weekoff Settings');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchWeekoffs = async () => {
    setTableLoading(true);
    try {
      const response = await api.get('/school/weekoffs', {
        params: {
          only_trashed: showTrashed,
          academic_year_id: filterAcademicYear || null
        }
      });
      if (response.data.success) {
        setWeekoffs(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching weekoffs:', error);
      toast.error('Failed to reload weekoffs');
    } finally {
      setTableLoading(false);
    }
  };

  const fetchWeekoffsSilently = async () => {
    try {
      const response = await api.get('/school/weekoffs', {
        params: {
          only_trashed: showTrashed,
          academic_year_id: filterAcademicYear || null
        }
      });
      if (response.data.success) {
        setWeekoffs(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching weekoffs silently:', error);
    }
  };

  const applyFiltersAndSorting = () => {
    let temp = [...weekoffs];

    // Search term matching
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      temp = temp.filter(w => {
        const weekoffName = (w.name || '').toLowerCase();
        const dayName = w.day?.m_name.toLowerCase() || '';
        
        const occurrenceLabels = w.occurrence_ids
          ? w.occurrence_ids.map(oid => occurrenceOptions.find(o => o.m_id === oid)?.m_name.toLowerCase() || '').join(' ')
          : 'all weeks';

        const classLabels = w.class_ids
          ? w.class_ids.map(cid => classOptions.find(c => c.value === cid)?.label.toLowerCase() || '').join(' ')
          : 'all classes';

        return weekoffName.includes(term) || dayName.includes(term) || occurrenceLabels.includes(term) || classLabels.includes(term);
      });
    }

    // Sort
    temp.sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortColumn === 'day') {
        aVal = a.day?.m_name || '';
        bVal = b.day?.m_name || '';
      } else if (sortColumn === 'name') {
        aVal = a.name || '';
        bVal = b.name || '';
      } else if (sortColumn === 'start_date') {
        aVal = a.start_date || '';
        bVal = b.start_date || '';
      } else if (sortColumn === 'end_date') {
        aVal = a.end_date || '';
        bVal = b.end_date || '';
      } else if (sortColumn === 'occurrences') {
        aVal = a.occurrence_ids && a.occurrence_ids.length > 0
          ? a.occurrence_ids.map(id => occurrenceOptions.find(o => o.m_id === id)?.m_name || '').join(', ')
          : 'All Weeks';
        bVal = b.occurrence_ids && b.occurrence_ids.length > 0
          ? b.occurrence_ids.map(id => occurrenceOptions.find(o => o.m_id === id)?.m_name || '').join(', ')
          : 'All Weeks';
      } else if (sortColumn === 'classes') {
        aVal = a.class_ids && a.class_ids.length > 0
          ? a.class_ids.map(id => classOptions.find(c => c.value === id)?.label || '').join(', ')
          : 'All Classes';
        bVal = b.class_ids && b.class_ids.length > 0
          ? b.class_ids.map(id => classOptions.find(c => c.value === id)?.label || '').join(', ')
          : 'All Classes';
      } else if (sortColumn === 'status') {
        aVal = a.is_active ? 1 : 0;
        bVal = b.is_active ? 1 : 0;
      } else {
        aVal = a.day_id;
        bVal = b.day_id;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredData(temp);
    setCurrentPage(1);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Checkbox Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = paginatedData.filter(w => !isPastRule(w)).map(w => w.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = paginatedData.map(w => w.id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Pagination Helper
  const paginatedData = React.useMemo(() => {
    if (itemsPerPage === -1) return filteredData;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage);

  const handleToggleStatus = async (id: number) => {
    setTableLoading(true);
    try {
      const response = await api.patch(`/school/weekoffs/${id}/toggle-status`);
      if (response.data.success) {
        toast.success(response.data.message || 'Status updated successfully');
        setWeekoffs(prev => prev.map(w => w.id === id ? { ...w, is_active: response.data.data.is_active } : w));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to toggle status');
    } finally {
      setTableLoading(false);
    }
  };

  const initializeGrid = () => {
    const newGrid: { [key: number]: { [key: number]: boolean } } = {};
    dayOptions.forEach(day => {
      newGrid[day.m_id] = {};
      occurrenceOptions.forEach(occ => {
        newGrid[day.m_id][occ.m_id] = false;
      });
    });
    return newGrid;
  };

  const openAddModal = () => {
    setEditingWeekoff(null);
    setModalName('');
    setModalClasses([]);
    
    const defaultYear = academicYears.find(y => y.is_current);
    const defaultYearId = defaultYear ? defaultYear.value.toString() : '';
    const activeYearId = filterAcademicYear || defaultYearId;
    setModalAcademicYear(activeYearId);

    // Autofill start and end date
    const selectedYearObj = academicYears.find(y => y.value.toString() === activeYearId);
    setModalStartDate(selectedYearObj?.start_date || '');
    setModalEndDate(selectedYearObj?.end_date || '');

    setGridState(initializeGrid());
    setIsModalOpen(true);
  };

  const openEditModal = (weekoff: Weekoff) => {
    setEditingWeekoff(weekoff);
    setModalName(weekoff.name || '');
    setModalClasses(weekoff.class_ids || []);
    setModalAcademicYear(weekoff.academic_year_id.toString());
    setModalStartDate(weekoff.start_date || '');
    setModalEndDate(weekoff.end_date || '');
    
    // Build pre-filled grid
    const newGrid = initializeGrid();
    if (newGrid[weekoff.day_id]) {
      if (!weekoff.occurrence_ids || weekoff.occurrence_ids.length === 0) {
        occurrenceOptions.forEach(occ => {
          newGrid[weekoff.day_id][occ.m_id] = true;
        });
      } else {
        weekoff.occurrence_ids.forEach(occId => {
          if (newGrid[weekoff.day_id][occId] !== undefined) {
            newGrid[weekoff.day_id][occId] = true;
          }
        });
      }
    }
    setGridState(newGrid);
    setIsModalOpen(true);
  };

  const handleCheckboxChange = (dayId: number, occId: number) => {
    setGridState(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [occId]: !prev[dayId][occId]
      }
    }));
  };

  // Bulk row/column toggles inside Modal
  const toggleRow = (dayId: number) => {
    const row = gridState[dayId] || {};
    const allChecked = Object.values(row).every(val => val === true);
    
    setGridState(prev => {
      const updatedRow = { ...prev[dayId] };
      occurrenceOptions.forEach(occ => {
        updatedRow[occ.m_id] = !allChecked;
      });
      return {
        ...prev,
        [dayId]: updatedRow
      };
    });
  };

  const toggleColumn = (occId: number) => {
    const allChecked = dayOptions.every(day => gridState[day.m_id]?.[occId] === true);

    setGridState(prev => {
      const updatedGrid = { ...prev };
      dayOptions.forEach(day => {
        updatedGrid[day.m_id] = {
          ...updatedGrid[day.m_id],
          [occId]: !allChecked
        };
      });
      return updatedGrid;
    });
  };

  const toggleGlobalAll = () => {
    const allChecked = dayOptions.every(day => occurrenceOptions.every(occ => gridState[day.m_id]?.[occ.m_id] === true));

    setGridState(prev => {
      const updatedGrid = { ...prev };
      dayOptions.forEach(day => {
        updatedGrid[day.m_id] = {};
        occurrenceOptions.forEach(occ => {
          updatedGrid[day.m_id][occ.m_id] = !allChecked;
        });
      });
      return updatedGrid;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName.trim()) {
      toast.error('Weekoff Name is required');
      return;
    }
    if (!modalAcademicYear) {
      toast.error('Academic Year is required');
      return;
    }
    if (!modalStartDate) {
      toast.error('Start Date is required');
      return;
    }
    if (!modalEndDate) {
      toast.error('End Date is required');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (modalStartDate && modalStartDate < today) {
      toast.error('Start Date cannot be in the past');
      return;
    }
    if (modalEndDate && modalEndDate < today) {
      toast.error('End Date cannot be in the past');
      return;
    }
    if (modalStartDate && modalEndDate && modalStartDate > modalEndDate) {
      toast.error('Start Date cannot be after End Date');
      return;
    }

    setSaving(true);

    // Build the grid payload: { [day_id]: [occurrence_ids] }
    const gridPayload: { [key: number]: number[] } = {};
    dayOptions.forEach(day => {
      const checkedOccurrences: number[] = [];
      occurrenceOptions.forEach(occ => {
        if (gridState[day.m_id]?.[occ.m_id]) {
          checkedOccurrences.push(occ.m_id);
        }
      });
      gridPayload[day.m_id] = checkedOccurrences;
    });

    const payload = {
      name: modalName.trim(),
      academic_year_id: Number(modalAcademicYear),
      class_ids: modalClasses.length > 0 ? modalClasses : null,
      grid: gridPayload,
      start_date: modalStartDate || null,
      end_date: modalEndDate || null
    };

    try {
      const response = await api.post('/school/weekoffs/save-grid', payload);
      if (response.data.success) {
        toast.success(response.data.message || 'Weekoff configuration saved');
        setIsModalOpen(false);
        await fetchWeekoffs();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this weekoff rule?')) return;
    setTableLoading(true);
    try {
      const response = await api.delete(`/school/weekoffs/${id}`);
      if (response.data.success) {
        toast.success('Weekoff rule deleted successfully');
        await fetchWeekoffs();
        setSelectedIds(prev => prev.filter(item => item !== id));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete weekoff rule');
    } finally {
      setTableLoading(false);
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!window.confirm('Warning: This rule will be permanently deleted and cannot be restored. Proceed?')) return;
    setTableLoading(true);
    try {
      const response = await api.delete(`/school/weekoffs/${id}/force`);
      if (response.data.success) {
        toast.success('Weekoff rule permanently deleted');
        await fetchWeekoffs();
        setSelectedIds(prev => prev.filter(item => item !== id));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to permanently delete rule');
    } finally {
      setTableLoading(false);
    }
  };

  const handleRestore = async (id: number) => {
    setTableLoading(true);
    try {
      const response = await api.post(`/school/weekoffs/${id}/restore`);
      if (response.data.success) {
        toast.success('Weekoff rule restored successfully');
        await fetchWeekoffs();
        setSelectedIds(prev => prev.filter(item => item !== id));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore rule');
    } finally {
      setTableLoading(false);
    }
  };

  // Bulk Actions
  const handleBulkStatus = async (status: 'active' | 'inactive') => {
    if (selectedIds.length === 0) return;
    setTableLoading(true);
    try {
      const response = await api.post('/school/weekoffs/bulk-status', {
        status,
        ids: selectedIds
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Bulk status updated successfully');
        setSelectedIds([]);
        await fetchWeekoffs();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk status update failed');
    } finally {
      setTableLoading(false);
    }
  };

  const handleBulkDelete = async (force = false) => {
    if (selectedIds.length === 0) return;
    const msg = force 
      ? 'Warning: Selected rules will be permanently deleted. Proceed?' 
      : 'Are you sure you want to delete the selected rules?';
    if (!window.confirm(msg)) return;

    setTableLoading(true);
    try {
      const response = await api.post('/school/weekoffs/bulk-delete', {
        ids: selectedIds,
        force
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Bulk delete successful');
        setSelectedIds([]);
        await fetchWeekoffs();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk delete failed');
    } finally {
      setTableLoading(false);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    setTableLoading(true);
    try {
      const response = await api.post('/school/weekoffs/bulk-restore', {
        ids: selectedIds
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Bulk restore completed');
        setSelectedIds([]);
        await fetchWeekoffs();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk restore failed');
    } finally {
      setTableLoading(false);
    }
  };

  const parseOccurrences = (str: string): number[] => {
    if (!str || str.toLowerCase().trim() === 'all weeks' || str.toLowerCase().trim() === 'all') {
      return [];
    }
    const parts = str.split(',').map(p => p.trim().toLowerCase());
    const matchedIds: number[] = [];
    parts.forEach(part => {
      const match = occurrenceOptions.find(o => {
        const name = o.m_name.toLowerCase();
        return name === part || part.includes(name) || name.includes(part);
      });
      if (match) {
        matchedIds.push(match.m_id);
      }
    });
    return matchedIds;
  };

  const parseClasses = (str: string): number[] | null => {
    if (!str || str.toLowerCase().trim() === 'all classes' || str.toLowerCase().trim() === 'all') {
      return null;
    }
    const parts = str.split(',').map(p => p.trim().toLowerCase());
    const matchedIds: number[] = [];
    parts.forEach(part => {
      const match = classOptions.find(c => {
        const label = c.label.toLowerCase();
        return label === part || part.includes(label) || label.includes(part);
      });
      if (match) {
        matchedIds.push(match.value);
      }
    });
    return matchedIds.length > 0 ? matchedIds : null;
  };

  // Client-side Excel Export
  const handleExport = async () => {
    try {
      const XLSX = await import('xlsx');
      const data = filteredData.map(item => {
        const occurrencesLabel = item.occurrence_ids && item.occurrence_ids.length > 0
          ? item.occurrence_ids.map(id => occurrenceOptions.find(o => o.m_id === id)?.m_name || `Occur#${id}`).join(', ')
          : 'All Weeks';

        const classesLabel = item.class_ids && item.class_ids.length > 0
          ? item.class_ids.map(id => classOptions.find(c => c.value === id)?.label || `Class#${id}`).join(', ')
          : 'All Classes';

        return {
          'Weekoff Name': item.name || '—',
          'Day of Week': item.day?.m_name || `Day#${item.day_id}`,
          'Occurrences': occurrencesLabel,
          'Classes': classesLabel,
          'Start Date': item.start_date || 'Always',
          'End Date': item.end_date || 'Always',
          'Academic Year': academicYears.find(y => y.value === item.academic_year_id)?.label || '—',
          'Status': item.is_active ? 'Active' : 'Inactive',
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Weekoffs');
      XLSX.writeFile(wb, `weekoffs_list_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Weekoffs list exported successfully!');
    } catch {
      toast.error('Export failed');
    }
  };

  // Client-side Excel sample template generation
  const downloadSampleFile = async () => {
    try {
      const academicYearValues = academicYears.map(y => y.label);
      const dayValues = dayOptions.map(d => d.m_name);
      const statusValues = ['Yes', 'No'];

      const ExcelJS = (await import('exceljs')).default;
      const { saveAs } = await import('file-saver');

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Weekoffs');

      worksheet.columns = [
        { header: 'Weekoff Name', key: 'name', width: 25 },
        { header: 'Day of Week', key: 'day_name', width: 15 },
        { header: 'Occurrences', key: 'occurrences', width: 30 },
        { header: 'Classes', key: 'classes', width: 30 },
        { header: 'Start Date (YYYY-MM-DD)', key: 'start_date', width: 22 },
        { header: 'End Date (YYYY-MM-DD)', key: 'end_date', width: 22 },
        { header: 'Academic Year', key: 'academic_year', width: 20 },
        { header: 'Set as Active', key: 'is_active', width: 15 },
      ];

      // Reference row
      worksheet.addRow({
        name: 'Regular Weekend',
        day_name: dayValues[0] || 'Sunday',
        occurrences: 'All Weeks',
        classes: 'All Classes',
        start_date: '2026-06-01',
        end_date: '2027-04-30',
        academic_year: academicYearValues[0] || '2026-2027',
        is_active: 'Yes',
      });

      // Helper option sheets columns P, Q, R
      worksheet.getCell('P1').value = 'Day_List';
      worksheet.getCell('Q1').value = 'Academic_Year_List';
      worksheet.getCell('R1').value = 'Active_List';

      dayValues.forEach((val, idx) => {
        worksheet.getCell(`P${idx + 2}`).value = val;
      });
      academicYearValues.forEach((val, idx) => {
        worksheet.getCell(`Q${idx + 2}`).value = val;
      });
      statusValues.forEach((val, idx) => {
        worksheet.getCell(`R${idx + 2}`).value = val;
      });

      worksheet.getColumn('P').hidden = true;
      worksheet.getColumn('Q').hidden = true;
      worksheet.getColumn('R').hidden = true;

      // Add Validation constraints
      for (let r = 2; r <= 500; r++) {
        if (dayValues.length > 0) {
          worksheet.getCell(`B${r}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`'Weekoffs'!$P$2:$P$${1 + dayValues.length}`],
            showErrorMessage: true,
            errorTitle: 'Invalid Selection',
            error: 'Please select a day of week from the dropdown list.',
          };
        }

        if (academicYearValues.length > 0) {
          worksheet.getCell(`G${r}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`'Weekoffs'!$Q$2:$Q$${1 + academicYearValues.length}`],
            showErrorMessage: true,
            errorTitle: 'Invalid Selection',
            error: 'Please select an academic year from the dropdown list.',
          };
        }

        worksheet.getCell(`H${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Weekoffs'!$R$2:$R$3`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select Yes or No.',
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_weekoffs_import.xlsx');
      toast.success('Sample file downloaded successfully!');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to generate template file');
    }
  };

  // Excel Upload Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import('xlsx');
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const validRows = jsonData.filter((row: any) => row['Weekoff Name'] && row['Day of Week'] && row['Start Date (YYYY-MM-DD)'] && row['End Date (YYYY-MM-DD)']);

        if (validRows.length === 0) {
          toast.error('No valid records found. Weekoff Name, Day of Week, Start Date, and End Date columns are required.');
          return;
        }

        setImportData(validRows);
        setImportPreview(validRows.slice(0, 5));
        setIsImportModalOpen(true);
      } catch {
        toast.error('Failed to read and parse template file');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processImport = async () => {
    setImporting(true);
    const payload: any[] = [];
    let failedCount = 0;

    importData.forEach((row: any) => {
      const name = row['Weekoff Name'] ? String(row['Weekoff Name']).trim() : '';
      const dayStr = row['Day of Week'] ? String(row['Day of Week']).trim() : '';
      const dayMatch = dayOptions.find(d => d.m_name.toLowerCase() === dayStr.toLowerCase());

      const yearStr = row['Academic Year'] ? String(row['Academic Year']).trim() : '';
      const yearMatch = academicYears.find(y => y.label.toLowerCase().includes(yearStr.toLowerCase()));

      const isActive = row['Set as Active'] ? String(row['Set as Active']).toLowerCase() === 'yes' : true;

      const startStr = row['Start Date (YYYY-MM-DD)'] ? String(row['Start Date (YYYY-MM-DD)']).trim() : '';
      const endStr = row['End Date (YYYY-MM-DD)'] ? String(row['End Date (YYYY-MM-DD)']).trim() : '';

      const occurrencesStr = row['Occurrences'] ? String(row['Occurrences']).trim() : '';
      const classesStr = row['Classes'] ? String(row['Classes']).trim() : '';

      if (name && dayMatch && startStr && endStr) {
        const occurrence_ids = parseOccurrences(occurrencesStr);
        const class_ids = parseClasses(classesStr);

        payload.push({
          name,
          day_id: dayMatch.m_id,
          occurrence_ids: occurrence_ids.length > 0 ? occurrence_ids : null,
          class_ids,
          start_date: startStr,
          end_date: endStr,
          is_active: isActive,
          academic_year_id: yearMatch ? yearMatch.value : null,
        });
      } else {
        failedCount++;
      }
    });

    if (payload.length === 0) {
      toast.error('Could not parse any valid rows. Please check data formats.');
      setImporting(false);
      return;
    }

    try {
      const response = await api.post(`/school/weekoffs/bulk-import`, { data: payload });
      if (response.data.success) {
        toast.success(`Import finished: ${response.data.imported_count} imported successfully, ${response.data.error_count + failedCount} failed`);
        setIsImportModalOpen(false);
        await fetchWeekoffs();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterAcademicYear('');
  };

  const isFilterActive = searchTerm !== '' || filterAcademicYear !== '';

  const getOccurrenceLabel = (ids?: number[] | null) => {
    if (!ids || ids.length === 0) return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">All Weeks</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {ids.map(id => {
          const label = occurrenceOptions.find(o => o.m_id === id)?.m_name || `Occur#${id}`;
          return (
            <span key={id} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
              {label}
            </span>
          );
        })}
      </div>
    );
  };

  const getClassLabel = (ids?: number[] | null) => {
    if (!ids || ids.length === 0) return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">All Classes</span>;
    return (
      <div className="flex flex-wrap gap-1 max-w-xs">
        {ids.map(id => {
          const label = classOptions.find(c => c.value === id)?.label || `Class#${id}`;
          return (
            <span key={id} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              {label}
            </span>
          );
        })}
      </div>
    );
  };

  const lbl = 'block text-[9px] font-semibold text-gray-400 mb-0.5 uppercase tracking-wider';

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
          <p className="mt-2 text-xs text-gray-500 font-medium">Loading Weekoff configurations…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-xs relative">
      {/* Loading Overlay */}
      {tableLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-lg">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">Weekoff List</h3>
          <p className="text-[12px] text-gray-500">Configure weekly holidays, off-days, and school weekend exceptions</p>
        </div>
        <div className="bg-blue-50/60 border border-blue-100 rounded px-2.5 py-0.5 text-center min-w-[70px]">
          <span className="block text-[9px] uppercase tracking-wider font-semibold text-blue-500">Total Rules</span>
          <span className="text-xs font-bold text-blue-700">{weekoffs.length}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search day or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-2 py-1 w-52 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-gray-700"
            />
          </div>

          {/* Academic Year filter */}
          <SearchableSelect
            options={academicYears}
            value={filterAcademicYear}
            onChange={(val) => setFilterAcademicYear(val)}
            placeholder="Academic Year"
            isClearable={true}
            className="w-44 text-xs"
            compact={true}
          />

          {/* Limit selector */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5">
            <span className="text-[10px] text-gray-450 font-semibold uppercase">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                const val = e.target.value === 'all' ? -1 : Number(e.target.value);
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
              className="text-xs font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value="all">All</option>
            </select>
          </div>

          {/* Trashed switch */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-1.5 py-0.5">
            <span className="text-[11px] font-semibold text-gray-600">Trashed</span>
            <button
              type="button"
              onClick={() => setShowTrashed(prev => !prev)}
              className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-200 focus:outline-none ${showTrashed ? 'bg-red-500' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform duration-200 ${showTrashed ? 'translate-x-[18px]' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {isFilterActive && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-650 hover:text-red-800 font-medium px-1.5 py-0.5 rounded hover:bg-red-50/80 transition duration-150"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={downloadSampleFile}
            className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-xs font-medium"
            title="Download Excel Sample"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Sample
          </button>

          <label className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition cursor-pointer text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-xs font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>

          {!showTrashed && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition text-xs font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Weekoff
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Controls */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700 animate-fadeIn">
          <span className="font-semibold">{selectedIds.length} item(s) selected</span>
          <div className="flex items-center gap-1.5">
            {!showTrashed ? (
              <>
                <button
                  onClick={() => handleBulkStatus('active')}
                  className="px-2 py-0.5 bg-white border border-blue-300 hover:bg-blue-100 rounded text-blue-800 font-medium transition"
                >
                  Active
                </button>
                <button
                  onClick={() => handleBulkStatus('inactive')}
                  className="px-2 py-0.5 bg-white border border-blue-300 hover:bg-blue-100 rounded text-blue-800 font-medium transition"
                >
                  Inactive
                </button>
                <button
                  onClick={() => handleBulkDelete(false)}
                  className="px-2 py-0.5 bg-white border border-blue-300 hover:bg-red-600 hover:text-white hover:border-red-600 rounded text-blue-800 font-medium transition"
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleBulkRestore}
                  className="px-2 py-0.5 bg-white border border-blue-300 hover:bg-blue-100 rounded text-blue-800 font-medium transition"
                >
                  Restore
                </button>
                <button
                  onClick={() => handleBulkDelete(true)}
                  className="px-2 py-0.5 bg-white border border-blue-300 hover:bg-red-600 hover:text-white hover:border-red-600 rounded text-blue-800 font-medium transition"
                >
                  Delete Permanently
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && paginatedData.filter(w => !isPastRule(w)).every(w => selectedIds.includes(w.id))}
                    onChange={handleSelectAll}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                  />
                </th>
                <th
                  className="py-2 px-3 cursor-pointer hover:bg-gray-100 transition w-40 select-none"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    <span>Weekoff Name</span>
                    <span className="text-gray-400 font-normal">{getSortIcon('name')}</span>
                  </div>
                </th>
                <th 
                  className="py-2 px-3 cursor-pointer hover:bg-gray-100 transition w-36 select-none"
                  onClick={() => handleSort('day')}
                >
                  <div className="flex items-center gap-1">
                    <span>Day of Week</span>
                    <span className="text-gray-400 font-normal">{getSortIcon('day')}</span>
                  </div>
                </th>
                <th
                  className="py-2 px-3 cursor-pointer hover:bg-gray-100 transition w-48 select-none"
                  onClick={() => handleSort('occurrences')}
                >
                  <div className="flex items-center gap-1">
                    <span>Occurrences</span>
                    <span className="text-gray-400 font-normal">{getSortIcon('occurrences')}</span>
                  </div>
                </th>
                <th
                  className="py-2 px-3 cursor-pointer hover:bg-gray-100 transition select-none"
                  onClick={() => handleSort('classes')}
                >
                  <div className="flex items-center gap-1">
                    <span>Classes</span>
                    <span className="text-gray-400 font-normal">{getSortIcon('classes')}</span>
                  </div>
                </th>
                <th
                  className="py-2 px-3 cursor-pointer hover:bg-gray-100 transition w-28 select-none"
                  onClick={() => handleSort('start_date')}
                >
                  <div className="flex items-center gap-1">
                    <span>Start Date</span>
                    <span className="text-gray-400 font-normal">{getSortIcon('start_date')}</span>
                  </div>
                </th>
                <th
                  className="py-2 px-3 cursor-pointer hover:bg-gray-100 transition w-28 select-none"
                  onClick={() => handleSort('end_date')}
                >
                  <div className="flex items-center gap-1">
                    <span>End Date</span>
                    <span className="text-gray-400 font-normal">{getSortIcon('end_date')}</span>
                  </div>
                </th>
                <th 
                  className="py-2 px-3 cursor-pointer hover:bg-gray-100 transition w-24 text-center select-none"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Status</span>
                    <span className="text-gray-400 font-normal">{getSortIcon('status')}</span>
                  </div>
                </th>
                <th className="py-2 px-3 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {paginatedData.length > 0 ? (
                paginatedData.map((w) => {
                  const isPast = isPastRule(w);
                  return (
                    <tr key={w.id} className={`transition ${isPast ? 'bg-gray-50/60 text-gray-500 opacity-80' : 'hover:bg-gray-50/50'}`}>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(w.id)}
                          onChange={() => !isPast && handleSelectOne(w.id)}
                          disabled={isPast}
                          className={`rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 ${isPast ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={isPast ? 'Past configurations cannot be selected' : ''}
                        />
                      </td>
                      <td className="py-2 px-3 font-medium text-gray-900">
                        {w.name || '—'}
                      </td>
                      <td className="py-2 px-3 font-semibold">
                        <span className={isPast ? 'text-gray-550 font-medium' : 'text-gray-900'}>
                          {w.day?.m_name || `Day#${w.day_id}`}
                        </span>
                        {isPast && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-semibold bg-gray-200 text-gray-600 border border-gray-300 uppercase tracking-wide">
                            Past
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {getOccurrenceLabel(w.occurrence_ids)}
                      </td>
                      <td className="py-2 px-3">
                        {getClassLabel(w.class_ids)}
                      </td>
                      <td className="py-2 px-3 font-medium text-gray-600">
                        {w.start_date ? w.start_date : <span className="text-gray-400 italic">Always</span>}
                      </td>
                      <td className="py-2 px-3 font-medium text-gray-600">
                        {w.end_date ? w.end_date : <span className="text-gray-400 italic">Always</span>}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {!showTrashed ? (
                          <div className="flex items-center justify-center">
                            <ToggleSwitch
                              checked={w.is_active}
                              onChange={() => handleToggleStatus(w.id)}
                              disabled={isPast}
                            />
                          </div>
                        ) : (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-100">
                            Archived
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!showTrashed ? (
                            <>
                              <button
                                onClick={() => !isPast && openEditModal(w)}
                                disabled={isPast}
                                className={`p-1 rounded transition ${isPast ? 'text-gray-305 cursor-not-allowed opacity-40' : 'text-gray-500 hover:text-blue-605 hover:bg-gray-150'}`}
                                title={isPast ? 'Past configurations cannot be modified' : 'Edit Rule'}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => !isPast && handleDelete(w.id)}
                                disabled={isPast}
                                className={`p-1 rounded transition ${isPast ? 'text-gray-350 cursor-not-allowed opacity-40' : 'text-gray-500 hover:text-red-650 hover:bg-gray-150'}`}
                                title={isPast ? 'Past configurations cannot be deleted' : 'Delete Rule'}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => !isPast && handleRestore(w.id)}
                                disabled={isPast}
                                className={`p-1 rounded transition ${isPast ? 'text-gray-305 cursor-not-allowed opacity-40' : 'text-gray-500 hover:text-green-600 hover:bg-gray-150'}`}
                                title={isPast ? 'Past configurations cannot be restored' : 'Restore Rule'}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                                </svg>
                              </button>
                              <button
                                onClick={() => !isPast && handleForceDelete(w.id)}
                                disabled={isPast}
                                className={`p-1 rounded transition ${isPast ? 'text-gray-305 cursor-not-allowed opacity-40' : 'text-gray-500 hover:text-red-700 hover:bg-gray-150'}`}
                                title={isPast ? 'Past configurations cannot be permanently deleted' : 'Delete Permanently'}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500 font-medium">
                    No weekoff configurations found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-150 px-4 py-2 bg-gray-50">
            <div className="text-gray-500 text-[11px]">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition text-[11px] font-semibold text-gray-650"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition text-[11px] font-semibold text-gray-655"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal with Grid Checkbox Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-[2px] flex items-center justify-center lg:pl-64 p-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-2xl w-full max-h-[95vh] flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Title */}
            <div className="flex items-center justify-between border-b border-gray-150 px-4 py-2 bg-gray-50 flex-shrink-0">
              <h4 className="text-[12px] font-bold text-gray-800">
                {editingWeekoff ? 'Modify Weekoff Config Grid' : 'Create Weekoff Config Grid'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* Body Container */}
              <div className="p-3.5 overflow-y-auto md:overflow-hidden flex-1 space-y-2.5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {/* Weekoff Name */}
                  <div>
                    <label className={lbl}>Weekoff Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Regular Weekend"
                      value={modalName}
                      onChange={(e) => setModalName(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-gray-700 text-[11px] h-[28px] transition"
                      required
                    />
                  </div>

                  {/* Academic Year select */}
                  <div>
                    <label className={lbl}>Academic Session <span className="text-red-500">*</span></label>
                    <SearchableSelect
                      options={academicYears.map(y => ({ value: y.value, label: y.label }))}
                      value={modalAcademicYear}
                      onChange={(val) => {
                        setModalAcademicYear(val);
                        const selectedYearObj = academicYears.find(y => y.value.toString() === val);
                        if (selectedYearObj) {
                          setModalStartDate(selectedYearObj.start_date || '');
                          setModalEndDate(selectedYearObj.end_date || '');
                        }
                      }}
                      placeholder="Select Session"
                      compact={true}
                    />
                  </div>

                  {/* Classes select (Multi-Select) */}
                  <div>
                    <label className={lbl}>
                      Classes <span className="text-gray-400 lowercase font-normal">(Leave empty for All)</span>
                    </label>
                    <Select
                      options={classOptions}
                      isMulti
                      value={classOptions.filter(c => modalClasses.includes(c.value))}
                      onChange={(selected: any) => {
                        const ids = selected ? selected.map((item: any) => item.value) : [];
                        setModalClasses(ids);
                      }}
                      placeholder="Select classes..."
                      styles={compactSelectStyles}
                      className="text-[11px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {/* Start Date */}
                  <div>
                    <label className={lbl}>Start Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={modalStartDate}
                      onChange={(e) => setModalStartDate(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-gray-700 text-[11px] h-[28px] transition"
                      required
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className={lbl}>End Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={modalEndDate}
                      onChange={(e) => setModalEndDate(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-gray-700 text-[11px] h-[28px] transition"
                      required
                    />
                  </div>
                </div>

                {/* Checkbox Grid Matrix */}
                <div>
                  <label className={lbl}>Weekoff Matrix (Check the Days and Weeks that are off)</label>
                  <div className="overflow-x-auto border border-gray-250 rounded-lg mt-1 shadow-inner">
                    <table className="w-full text-left border-collapse select-none">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-250">
                          <th className="py-1.5 px-3 text-gray-700 font-bold text-[10px] w-36 border-r border-gray-200">Day</th>
                          <th 
                            onClick={toggleGlobalAll}
                            className="py-1.5 px-2 text-center text-blue-600 hover:text-blue-800 hover:bg-blue-50/50 cursor-pointer font-bold text-[10px] transition uppercase tracking-wider w-16 border-r border-gray-200"
                            title="Toggle all cells in grid"
                          >
                            All
                          </th>
                          {occurrenceOptions.map(occ => (
                            <th
                              key={occ.m_id}
                              onClick={() => toggleColumn(occ.m_id)}
                              className="py-1.5 px-2 text-center text-gray-600 hover:bg-gray-150 cursor-pointer font-bold text-[10px] transition uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                              title={`Toggle all ${occ.m_name}`}
                            >
                              {occ.m_name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150">
                        {dayOptions.map(day => {
                          const isAllRowChecked = occurrenceOptions.length > 0 && occurrenceOptions.every(occ => gridState[day.m_id]?.[occ.m_id] === true);
                          return (
                            <tr key={day.m_id} className="hover:bg-gray-50/50 transition duration-150">
                              <td
                                onClick={() => toggleRow(day.m_id)}
                                className={`py-1 px-3 font-bold text-gray-700 hover:bg-gray-100 cursor-pointer transition text-[10px] border-r border-gray-150 ${isAllRowChecked ? 'text-blue-750 bg-blue-50/15' : ''}`}
                                title={`Toggle all on ${day.m_name}`}
                              >
                                {day.m_name}
                              </td>
                              <td className={`py-1 px-2 text-center border-r border-gray-150 transition-colors duration-150 ${isAllRowChecked ? 'bg-blue-50/20' : ''}`}>
                                <div className="flex justify-center">
                                  <input
                                    type="checkbox"
                                    checked={isAllRowChecked}
                                    onChange={() => toggleRow(day.m_id)}
                                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer focus:ring-offset-0 transition"
                                    title="Toggle all for this day"
                                  />
                                </div>
                              </td>
                              {occurrenceOptions.map(occ => {
                                const isChecked = gridState[day.m_id]?.[occ.m_id] || false;
                                return (
                                  <td key={occ.m_id} className={`py-1 px-2 text-center transition-colors duration-150 border-r border-gray-150 last:border-r-0 ${isChecked ? 'bg-blue-50/15' : ''}`}>
                                    <div className="flex justify-center">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleCheckboxChange(day.m_id, occ.m_id)}
                                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer focus:ring-offset-0 transition"
                                      />
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-gray-150 px-4 py-2 bg-gray-50 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-[11px] font-semibold h-[28px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 text-[11px] h-[28px]"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {editingWeekoff ? 'Save Changes' : 'Create Rules'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backdropFilter: 'blur(4px)', background: 'rgba(0, 0, 0, 0.4)' }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex justify-between items-center text-white">
              <h3 className="text-base font-bold">Import Weekoffs Preview</h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-white/85 hover:text-white hover:bg-white/10 rounded-lg p-1 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Content preview list */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="text-xs text-gray-500">
                Below is a preview of the first 5 records parsed from your file. Confirm the import to save all parsed records ({importData.length} total).
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-650 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-4">Row</th>
                      <th className="py-2.5 px-4">Weekoff Name</th>
                      <th className="py-2.5 px-4">Day of Week</th>
                      <th className="py-2.5 px-4">Occurrences</th>
                      <th className="py-2.5 px-4">Classes</th>
                      <th className="py-2.5 px-4">Start Date</th>
                      <th className="py-2.5 px-4">End Date</th>
                      <th className="py-2.5 px-4">Academic Year</th>
                      <th className="py-2.5 px-4">Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {importPreview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 text-gray-700">
                        <td className="py-2 px-4 font-semibold text-gray-400">{idx + 2}</td>
                        <td className="py-2 px-4 font-medium">{row['Weekoff Name'] || '—'}</td>
                        <td className="py-2 px-4">{row['Day of Week'] || '—'}</td>
                        <td className="py-2 px-4">{row['Occurrences'] || 'All Weeks'}</td>
                        <td className="py-2 px-4">{row['Classes'] || 'All Classes'}</td>
                        <td className="py-2 px-4 font-medium text-gray-900">{row['Start Date (YYYY-MM-DD)'] || '—'}</td>
                        <td className="py-2 px-4 font-medium text-gray-900">{row['End Date (YYYY-MM-DD)'] || '—'}</td>
                        <td className="py-2 px-4">{row['Academic Year'] || '—'}</td>
                        <td className="py-2 px-4">{row['Set as Active'] || 'Yes'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold transition"
                disabled={importing}
              >
                Cancel
              </button>
              <button
                onClick={processImport}
                className="px-5 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition"
                disabled={importing}
              >
                {importing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full inline-block" />
                    Importing...
                  </>
                ) : (
                  <>Confirm Import</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeekoffManager;
