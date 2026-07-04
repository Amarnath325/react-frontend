import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Premium theme styling for react-select matching our system's Tailwind design
const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.5rem', // rounded-lg
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb', // blue-500 or gray-200
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.15)' : 'none',
    minHeight: '38px',
    backgroundColor: '#ffffff',
    borderColorHover: state.isFocused ? '#3b82f6' : '#d1d5db',
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
};

const compactSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.375rem', // rounded-md
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.15)' : 'none',
    minHeight: '28px',
    backgroundColor: '#ffffff',
    borderColorHover: state.isFocused ? '#3b82f6' : '#d1d5db',
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
};

interface SearchableSelectProps {
  options: { value: string | number; label: string }[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder: string;
  isClearable?: boolean;
  className?: string;
  required?: boolean;
  compact?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  isClearable = false,
  className = "",
  compact = false,
}) => {
  const selectedOption = options.find(opt => String(opt.value) === String(value)) || null;

  return (
    <div className={className}>
      <Select
        options={options}
        value={selectedOption}
        onChange={(selected: any) => {
          onChange(selected ? String(selected.value) : "");
        }}
        placeholder={placeholder}
        isClearable={isClearable}
        isSearchable={true}
        styles={compact ? compactSelectStyles : customSelectStyles}
        menuPosition="fixed"
        menuPlacement="auto"
        menuPortalTarget={document.body}
        className={compact ? "text-[11px]" : "text-[13px]"}
      />
    </div>
  );
};

interface SectionData {
  id: number;
  school_id: number;
  academic_year_id: number;
  class_id: number;
  section_name: string;
  capacity: number;
  class_teacher_id: number | null;
  is_active: boolean;
  class_name?: string;
  academic_year_label?: string;
}

interface MasterOption {
  value: number;
  label: string;
}

// Toggle Switch Component (Compact size)
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
          inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-4.5' : 'translate-x-1'}
        `}
      />
    </button>
  );
};

const statusOptions = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

const SectionManager: React.FC = () => {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [filteredData, setFilteredData] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SectionData | null>(null);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('');
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showTrashed, setShowTrashed] = useState<boolean>(false);

  // Excel Import Preview Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  // Sorting
  const [sortColumn, setSortColumn] = useState<string>('class_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Master data
  const [academicYears, setAcademicYears] = useState<MasterOption[]>([]);
  const [classes, setClasses] = useState<MasterOption[]>([]);
  const [teachers, setTeachers] = useState<MasterOption[]>([]);

  const [formData, setFormData] = useState({
    academic_year_id: '',
    class_id: '',
    section_name: '',
    capacity: 40,
    class_teacher_id: '',
    is_active: true,
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    fetchSections();
  }, [showTrashed]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [sections, searchTerm, filterAcademicYear, filterClass, filterStatus, sortColumn, sortDirection]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAcademicYears(),
        fetchClasses(),
        fetchTeachers(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await api.get('/school/sections', {
        params: { only_trashed: showTrashed }
      });
      if (response.data.success) {
        setSections(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/school/academic-years');
      if (response.data.success) {
        const years = response.data.data.map((year: any) => ({
          value: year.id,
          label: year.name,
        }));
        setAcademicYears(years);
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get('/master/classes');
      if (response.data.success) {
        const classesData = response.data.data;
        let classArray: MasterOption[] = [];
        if (Array.isArray(classesData)) {
          classArray = classesData.map((item: any) => ({
            value: item.id || item.m_id || item.value || (typeof item === 'number' || typeof item === 'string' ? parseInt(item) : 0),
            label: item.name || item.m_name || item.label || (typeof item === 'string' || typeof item === 'number' ? String(item) : ''),
          }));
        } else if (typeof classesData === 'object' && classesData !== null) {
          classArray = Object.entries(classesData).map(([id, name]) => ({
            value: parseInt(id),
            label: name as string,
          }));
        }
        setClasses(classArray);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/school/teachers');
      if (response.data.success) {
        const teachersData = response.data.data.map((teacher: any) => ({
          value: teacher.id,
          label: teacher.user?.first_name + ' ' + teacher.user?.last_name,
        }));
        setTeachers(teachersData);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...sections];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.section_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.class_name && item.class_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterAcademicYear) {
      filtered = filtered.filter(item => item.academic_year_id.toString() === filterAcademicYear);
    }

    if (filterClass) {
      filtered = filtered.filter(item => item.class_id.toString() === filterClass);
    }

    if (filterStatus) {
      filtered = filtered.filter(item => item.is_active.toString() === filterStatus);
    }

    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof SectionData];
      let bVal: any = b[sortColumn as keyof SectionData];

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredData(filtered);
    setCurrentPage(1);
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
    if (sortColumn !== column) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterAcademicYear('');
    setFilterClass('');
    setFilterStatus('');
  };

  // Bulk Selection Handlers
  const isAllSelected = filteredData.length > 0 && selectedIds.length === filteredData.length;

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map(item => item.id));
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleBulkStatus = async (status: 'active' | 'inactive') => {
    try {
      const response = await api.post('/school/sections/bulk-status', {
        status,
        ids: selectedIds
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedIds([]);
        fetchSections();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk status update failed');
    }
  };

  const handleBulkDelete = async () => {
    const isForce = showTrashed;
    const msg = isForce
      ? 'Are you sure you want to permanently delete these sections? This cannot be undone.'
      : 'Are you sure you want to move these sections to trash?';
    if (!window.confirm(msg)) return;

    try {
      const response = await api.post('/school/sections/bulk-delete', {
        ids: selectedIds,
        force: isForce
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedIds([]);
        fetchSections();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk delete failed');
    }
  };

  const handleBulkRestore = async () => {
    try {
      const response = await api.post('/school/sections/bulk-restore', {
        ids: selectedIds
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedIds([]);
        fetchSections();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk restore failed');
    }
  };

  const handleRestore = async (id: number) => {
    try {
      const response = await api.post(`/school/sections/${id}/restore`);
      if (response.data.success) {
        toast.success('Section restored successfully');
        fetchSections();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore section');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to permanently delete this section? This cannot be undone.')) {
      try {
        const response = await api.delete(`/school/sections/${id}/force`);
        if (response.data.success) {
          toast.success('Section permanently deleted');
          fetchSections();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Permanent delete failed');
      }
    }
  };

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = itemsPerPage === -1
    ? filteredData
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      academic_year_id: academicYears[0]?.value.toString() || '',
      class_id: '',
      section_name: '',
      capacity: 40,
      class_teacher_id: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: SectionData) => {
    setEditingItem(item);
    setFormData({
      academic_year_id: item.academic_year_id?.toString() || '',
      class_id: item.class_id?.toString() || '',
      section_name: item.section_name,
      capacity: item.capacity || 40,
      class_teacher_id: item.class_teacher_id?.toString() || '',
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.academic_year_id || !formData.class_id || !formData.section_name) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const submitData = {
        academic_year_id: parseInt(formData.academic_year_id),
        class_id: parseInt(formData.class_id),
        section_name: formData.section_name,
        capacity: parseInt(String(formData.capacity)) || 40,
        class_teacher_id: formData.class_teacher_id ? parseInt(formData.class_teacher_id) : null,
        is_active: formData.is_active,
      };

      if (editingItem) {
        const response = await api.put(`/school/sections/${editingItem.id}`, submitData);
        if (response.data.success) {
          toast.success('Section updated successfully');
        }
      } else {
        const response = await api.post('/school/sections', submitData);
        if (response.data.success) {
          toast.success('Section created successfully');
        }
      }
      setIsModalOpen(false);
      fetchSections();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete section "${name}"?`)) {
      try {
        const response = await api.delete(`/school/sections/${id}`);
        if (response.data.success) {
          toast.success('Section deleted successfully');
          fetchSections();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await api.patch(`/school/sections/${id}/toggle-status`);
      if (response.data.success) {
        toast.success('Section status updated');
        fetchSections();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const getAcademicYearLabel = (id: number) => {
    const year = academicYears.find(y => y.value === id);
    return year?.label || 'N/A';
  };

  const getClassName = (id: number) => {
    const cls = classes.find(c => c.value === id);
    return cls?.label || 'N/A';
  };

  // Client-Side Excel Export
  const handleExport = () => {
    try {
      const data = filteredData.map(item => ({
        'Academic Year': getAcademicYearLabel(item.academic_year_id),
        'Class': getClassName(item.class_id),
        'Section Name': item.section_name,
        'Capacity': item.capacity,
        'Class Teacher': teachers.find(t => t.value === item.class_teacher_id)?.label || '—',
        'Status': item.is_active ? 'Active' : 'Inactive',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sections');
      XLSX.writeFile(wb, `sections_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Exported successfully!');
    } catch {
      toast.error('Export failed');
    }
  };

  // Client-Side Excel Sample Template Generation
  const downloadSampleFile = async () => {
    try {
      const academicYearValues = academicYears.map(y => y.label);
      const classValues = classes.map(c => c.label);
      const teacherValues = teachers.map(t => t.label);
      const statusValues = ['Active', 'Inactive'];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sections');

      worksheet.columns = [
        { header: 'Academic Year', key: 'Academic Year', width: 20 },
        { header: 'Class', key: 'Class', width: 15 },
        { header: 'Section Name', key: 'Section Name', width: 15 },
        { header: 'Capacity', key: 'Capacity', width: 12 },
        { header: 'Class Teacher', key: 'Class Teacher', width: 25 },
        { header: 'Status', key: 'Status', width: 12 },
      ];

      // Add a dummy row for first data row
      worksheet.addRow({
        'Academic Year': academicYearValues[0] || '2025-2026',
        'Class': classValues[0] || 'Class 1',
        'Section Name': 'A',
        'Capacity': 40,
        'Class Teacher': teacherValues[0] || 'John Doe',
        'Status': 'Active',
      });

      // Write lists data to helper columns P, Q, R, S
      worksheet.getCell('P1').value = 'Academic_Year_List';
      worksheet.getCell('Q1').value = 'Class_List';
      worksheet.getCell('R1').value = 'Teacher_List';
      worksheet.getCell('S1').value = 'Status_List';

      academicYearValues.forEach((val, idx) => {
        worksheet.getCell(`P${idx + 2}`).value = val;
      });
      classValues.forEach((val, idx) => {
        worksheet.getCell(`Q${idx + 2}`).value = val;
      });
      teacherValues.forEach((val, idx) => {
        worksheet.getCell(`R${idx + 2}`).value = val;
      });
      statusValues.forEach((val, idx) => {
        worksheet.getCell(`S${idx + 2}`).value = val;
      });

      // Hide helper columns P to S
      worksheet.getColumn('P').hidden = true;
      worksheet.getColumn('Q').hidden = true;
      worksheet.getColumn('R').hidden = true;
      worksheet.getColumn('S').hidden = true;

      // Apply data validation to rows 2 to 500
      for (let r = 2; r <= 500; r++) {
        if (academicYearValues.length > 0) {
          worksheet.getCell(`A${r}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`'Sections'!$P$2:$P$${1 + academicYearValues.length}`],
            showErrorMessage: true,
            errorTitle: 'Invalid Selection',
            error: 'Please select an academic year from the dropdown list.',
          };
        }

        if (classValues.length > 0) {
          worksheet.getCell(`B${r}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`'Sections'!$Q$2:$Q$${1 + classValues.length}`],
            showErrorMessage: true,
            errorTitle: 'Invalid Selection',
            error: 'Please select a class from the dropdown list.',
          };
        }

        if (teacherValues.length > 0) {
          worksheet.getCell(`E${r}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`'Sections'!$R$2:$R$${1 + teacherValues.length}`],
            showErrorMessage: true,
            errorTitle: 'Invalid Selection',
            error: 'Please select a teacher from the dropdown list.',
          };
        }

        worksheet.getCell(`F${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Sections'!$S$2:$S$3`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select Active or Inactive.',
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_sections.xlsx');
      toast.success('Sample template downloaded successfully!');
    } catch (error) {
      console.error('Error downloading sample file:', error);
      toast.error('Failed to download sample file');
    }
  };

  // Client-Side Excel File Upload Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const validRows = jsonData.filter((row: any) => row['Academic Year'] && row['Class'] && row['Section Name']);

        if (validRows.length === 0) {
          toast.error('No valid data found in the file. Academic Year, Class, and Section Name are required.');
          return;
        }

        setImportData(validRows);
        setImportPreview(validRows.slice(0, 5));
        setIsImportModalOpen(true);
      } catch {
        toast.error('Failed to read file');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Client-Side Serial POST Bulk Import
  const processImport = async () => {
    setImporting(true);
    let ok = 0, fail = 0;

    for (let i = 0; i < importData.length; i++) {
      const row = importData[i];
      try {
        const yearItem = academicYears.find(y => y.label === row['Academic Year']);
        const classItem = classes.find(c => c.label === row['Class']);

        if (!yearItem || !classItem) {
          fail++;
          continue;
        }

        const teacherItem = teachers.find(t => t.label === row['Class Teacher']);

        const submitData = {
          academic_year_id: yearItem.value,
          class_id: classItem.value,
          section_name: String(row['Section Name']),
          capacity: Number(row['Capacity']) || 40,
          class_teacher_id: teacherItem ? teacherItem.value : null,
          is_active: row['Status']?.toLowerCase() !== 'inactive',
        };

        await api.post('/school/sections', submitData);
        ok++;
      } catch {
        fail++;
      }
    }

    toast.success(`Import completed: ${ok} success, ${fail} failed`);
    setIsImportModalOpen(false);
    fetchSections();
    setImporting(false);
  };

  // Premium UI Constants
  const inp = 'w-full px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';
  const lbl = 'block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
          <p className="mt-2 text-xs text-gray-500 font-medium">Loading sections…</p>
        </div>
      </div>
    );
  }

  // Stats
  const totalActive = sections.filter(s => s.is_active).length;

  return (
    <div className="space-y-3 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2">
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">Sections Management</h3>
          <p className="text-[12px] text-gray-500">Manage class sections, capacity, and class teachers</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-400">Total</span>
            <span className="text-xs font-bold text-slate-700">{sections.length}</span>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-100/80 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-emerald-500">Active</span>
            <span className="text-xs font-bold text-emerald-700">{totalActive}</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar Area ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
        {/* Left side: Search & filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search section, class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-2 py-1 w-44 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-gray-700"
            />
          </div>

          {/* Academic Year filter */}
          <SearchableSelect
            options={academicYears}
            value={filterAcademicYear}
            onChange={(val) => setFilterAcademicYear(val)}
            placeholder="All Academic Years"
            isClearable={true}
            className="w-40 text-xs"
            compact={true}
          />

          {/* Class filter */}
          <SearchableSelect
            options={classes}
            value={filterClass}
            onChange={(val) => setFilterClass(val)}
            placeholder="All Classes"
            isClearable={true}
            className="w-36 text-xs"
            compact={true}
          />

          {/* Status filter */}
          <SearchableSelect
            options={statusOptions}
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            placeholder="All Status"
            isClearable={true}
            className="w-28 text-xs"
            compact={true}
          />

          {/* Pagination limit selector */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5">
            <span className="text-[10px] text-gray-400 font-semibold uppercase">Show:</span>
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

          {/* Show Trashed Toggle */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-1.5 py-0.5">
            <span className="text-[11px] font-semibold text-gray-600">Trashed</span>
            <button
              type="button"
              onClick={() => setShowTrashed(prev => !prev)}
              className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-200 focus:outline-none ${showTrashed ? 'bg-red-500' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform duration-200 ${showTrashed ? 'translate-x-4.5' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {(searchTerm || filterAcademicYear || filterClass || filterStatus) && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-700 font-medium px-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Right side: Action Buttons */}
        <div className="flex items-center gap-1.5" style={{ marginTop: "-30px" }}>
          <button
            onClick={downloadSampleFile}
            className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-xs font-medium"
            title="Download Excel Sample Template"
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
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
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
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition text-xs font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Section
            </button>
          )}
        </div>
      </div>

      {/* Trashed Info Banner */}
      {showTrashed && (
        <div className="bg-red-50 border-b border-red-105 px-4 py-1.5 flex items-center gap-2 text-red-700 text-xs font-medium rounded-lg">
          <svg className="w-3.5 h-3.5 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>You are viewing deleted sections. You can restore them or permanently delete them below.</span>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg flex items-center justify-between text-xs">
          <div className="text-blue-800 font-semibold">
            {selectedIds.length} item(s) selected
          </div>
          <div className="flex items-center gap-1.5">
            {!showTrashed ? (
              <>
                <button
                  onClick={() => handleBulkStatus('active')}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-green-700 font-medium"
                >
                  Active
                </button>
                <button
                  onClick={() => handleBulkStatus('inactive')}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-red-700 font-medium"
                >
                  Inactive
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleBulkRestore}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-green-700 font-medium"
                >
                  Restore
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                >
                  Delete Permanently
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedIds([])}
              className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-gray-250 rounded-lg bg-white shadow-sm">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-gray-200 bg-slate-50/80 text-gray-700 font-semibold uppercase text-[9px] whitespace-nowrap">
              <th className="py-2 px-2.5 w-8 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAllToggle}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer"
                />
              </th>
              <th
                onClick={() => handleSort('class_name')}
                className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Class</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('class_name')}</span>
                </div>
              </th>
              <th
                onClick={() => handleSort('section_name')}
                className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Section</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('section_name')}</span>
                </div>
              </th>
              <th className="py-2 px-2.5">Academic Year</th>
              <th className="py-2 px-2.5">Capacity</th>
              <th className="py-2 px-2.5">Class Teacher</th>
              <th
                onClick={() => handleSort('is_active')}
                className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none text-center w-24"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Status</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('is_active')}</span>
                </div>
              </th>
              <th className="py-2 px-2.5 text-center w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500 font-medium">
                  <div className="flex flex-col items-center justify-center max-w-md mx-auto gap-2">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h4 className="text-[13px] font-bold text-gray-900">No sections found</h4>
                    <p className="text-xs text-gray-500">Get started by creating a class section or importing from Excel.</p>
                    {!showTrashed && (
                      <button
                        onClick={openAddModal}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-650 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition"
                      >
                        Add your first section
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/10 transition-colors text-gray-700">
                  <td className="py-1.5 px-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => handleSelectRow(item.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer"
                    />
                  </td>
                  <td className="py-1.5 px-2.5 font-semibold text-gray-800">{getClassName(item.class_id)}</td>
                  <td className="py-1.5 px-2.5 font-medium text-gray-950">Section {item.section_name}</td>
                  <td className="py-1.5 px-2.5 text-gray-650">{getAcademicYearLabel(item.academic_year_id)}</td>
                  <td className="py-1.5 px-2.5 text-gray-650">{item.capacity} students</td>
                  <td className="py-1.5 px-2.5 text-gray-650">
                    {teachers.find(t => t.value === item.class_teacher_id)?.label || '—'}
                  </td>
                  <td className="py-1.5 px-2.5 text-center">
                    <div className="flex items-center justify-center">
                      <ToggleSwitch
                        checked={item.is_active}
                        onChange={() => handleToggleStatus(item.id)}
                        disabled={showTrashed}
                      />
                    </div>
                  </td>
                  <td className="py-1.5 px-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {showTrashed ? (
                        <>
                          <button
                            onClick={() => handleRestore(item.id)}
                            className="p-1 text-slate-500 hover:bg-green-50 rounded hover:text-green-600 transition"
                            title="Restore"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleForceDelete(item.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded hover:text-red-700 transition"
                            title="Delete Permanently"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1 text-slate-500 hover:bg-slate-100 rounded hover:text-blue-600 transition"
                            title="Edit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, `${getClassName(item.class_id)} - Section ${item.section_name}`)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded hover:text-red-700 transition"
                            title="Delete"
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && itemsPerPage !== -1 && (
        <div className="flex items-center justify-between border border-gray-250 bg-white px-4 py-2 rounded-lg shadow-sm text-xs mt-3">
          <span className="text-gray-500 font-medium">
            Showing <span className="font-semibold text-gray-800">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
            <span className="font-semibold text-gray-800">
              {Math.min(currentPage * itemsPerPage, filteredData.length)}
            </span>{' '}
            of <span className="font-semibold text-gray-800">{filteredData.length}</span> entries
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-0.5 border border-gray-250 bg-white rounded disabled:opacity-50 text-[11px] text-gray-650 hover:bg-gray-50 transition"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 py-0.5 border border-gray-250 bg-white rounded disabled:opacity-50 text-[11px] text-gray-650 hover:bg-gray-50 transition"
            >
              ‹
            </button>
            <span className="text-[11px] text-gray-650 px-1.5 font-medium">
              Page <span className="font-semibold text-gray-800">{currentPage}</span> of{' '}
              <span className="font-semibold text-gray-800">{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2 py-0.5 border border-gray-250 bg-white rounded disabled:opacity-50 text-[11px] text-gray-650 hover:bg-gray-50 transition"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-0.5 border border-gray-250 bg-white rounded disabled:opacity-50 text-[11px] text-gray-650 hover:bg-gray-50 transition"
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backdropFilter: 'blur(4px)', background: 'rgba(0, 0, 0, 0.4)' }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-visible border border-gray-100 transform transition-all duration-300">
            <div className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 flex justify-between items-center text-white rounded-t-xl">
              <h3 className="text-sm font-bold">{editingItem ? 'Edit Section Details' : 'Add New Section'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className={lbl}>Academic Year *</label>
                    <SearchableSelect
                      options={academicYears}
                      value={formData.academic_year_id}
                      onChange={(val) => setFormData(prev => ({ ...prev, academic_year_id: val }))}
                      placeholder="Select Academic Year"
                      compact={true}
                    />
                  </div>
                  <div>
                    <label className={lbl}>Class *</label>
                    <SearchableSelect
                      options={classes}
                      value={formData.class_id}
                      onChange={(val) => setFormData(prev => ({ ...prev, class_id: val }))}
                      placeholder="Select Class *"
                      compact={true}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className={lbl}>Section Name *</label>
                    <input
                      type="text"
                      name="section_name"
                      value={formData.section_name}
                      onChange={handleInputChange}
                      placeholder="e.g., A, B, C"
                      className={inp}
                      required
                    />
                  </div>
                  <div>
                    <label className={lbl}>Capacity</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      className={inp}
                    />
                  </div>
                </div>

                <div>
                  <label className={lbl}>Class Teacher (Optional)</label>
                  <SearchableSelect
                    options={teachers}
                    value={formData.class_teacher_id}
                    onChange={(val) => setFormData(prev => ({ ...prev, class_teacher_id: val }))}
                    placeholder="Select Teacher"
                    isClearable={true}
                    compact={true}
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                  <div>
                    <span className="block text-xs font-semibold text-gray-700">Active Status</span>
                    <span className="text-[10px] text-gray-500">Show this section in student enrollment</span>
                  </div>
                  <ToggleSwitch
                    checked={formData.is_active}
                    onChange={(val) => setFormData(prev => ({ ...prev, is_active: val }))}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1 text-xs border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    {editingItem ? 'Update Section' : 'Create Section'}
                  </button>
                </div>
              </form>
            </div>
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
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex justify-between items-center text-white">
              <h3 className="text-base font-bold">Import Sections Preview</h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              <div className="mb-4 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 flex justify-between items-center">
                <span><strong>Total Records Found:</strong> {importData.length}</span>
                <span className="text-xs font-semibold uppercase tracking-wide bg-blue-100 px-2 py-0.5 rounded">Showing up to 5 rows preview</span>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200">
                      {importPreview.length > 0 && Object.keys(importPreview[0]).map((key, idx) => (
                        <th key={idx} className="py-2.5 px-4 font-bold text-gray-700 border-r border-gray-250 last:border-0">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {importPreview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        {Object.values(row).map((val: any, cellIdx) => (
                          <td key={cellIdx} className="py-2 px-4 text-gray-650 border-r border-gray-250 last:border-0">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-150 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-1.5 border border-gray-250 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={processImport}
                disabled={importing}
                className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {importing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Importing...
                  </>
                ) : (
                  'Start Import'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionManager;