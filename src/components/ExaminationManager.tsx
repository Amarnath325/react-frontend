import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface Examination {
  id: number;
  academic_year_id: number;
  class_id: number;
  name: string;
  exam_type: number;
  term: number;
  start_date: string;
  end_date: string;
  max_marks: number;
  passing_marks: number;
  is_active: boolean;
}

interface MasterOption {
  value: number;
  label: string;
}

// Toggle Switch Component (Compact size - matches Show Trashed size)
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}> = ({ checked, onChange, disabled = false, label }) => {
  const button = (
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

  if (label) {
    return (
      <label className="flex items-center justify-between cursor-pointer w-full">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        {button}
      </label>
    );
  }

  return button;
};

// Searchable Select Component - Compact Version
const SearchableSelect: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isClearable?: boolean;
  className?: string;
}> = ({ options, value, onChange, placeholder, isClearable = true, className = "w-40 text-xs" }) => {
  const selectedOption = options.find(opt => opt.value === value) || null;
  
  return (
    <Select
      options={options}
      value={selectedOption}
      onChange={(selected) => onChange(selected ? selected.value : '')}
      placeholder={placeholder}
      isClearable={isClearable}
      className={className}
      classNamePrefix="react-select"
      styles={{
        control: (base: any) => ({
          ...base,
          borderRadius: '0.375rem',
          borderColor: '#d1d5db',
          minHeight: '28px',
          fontSize: '11px',
          boxShadow: 'none',
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
          fontSize: '11px',
          padding: '4px 8px',
        }),
        dropdownIndicator: (base: any) => ({
          ...base,
          padding: '2px',
        }),
        clearIndicator: (base: any) => ({
          ...base,
          padding: '2px',
        }),
        placeholder: (base: any) => ({
          ...base,
          fontSize: '11px',
        }),
        singleValue: (base: any) => ({
          ...base,
          fontSize: '11px',
        }),
      }}
    />
  );
};

const ExaminationManager: React.FC = () => {
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [filteredData, setFilteredData] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Examination | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5

  );
  
  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('');
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterExamType, setFilterExamType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Master data states
  const [academicYears, setAcademicYears] = useState<MasterOption[]>([]);
  const [classes, setClasses] = useState<MasterOption[]>([]);
  const [examTypes, setExamTypes] = useState<MasterOption[]>([]);
  
  const [formData, setFormData] = useState({
    academic_year_id: '',
    class_id: '',
    name: '',
    exam_type: '',
    term: '',
    start_date: '',
    end_date: '',
    max_marks: 100,
    passing_marks: 33,
    is_active: true,
  });

  const termOptions = [
    { value: 1, label: 'First Term' },
    { value: 2, label: 'Second Term' },
    { value: 3, label: 'Third Term' },
    { value: 4, label: 'Final Term' },
  ];

  // Convert options for searchable selects
  const academicYearOptions = academicYears.map(year => ({ value: year.value.toString(), label: year.label }));
  const classOptions = classes.map(cls => ({ value: cls.value.toString(), label: cls.label }));
  const examTypeOptions = examTypes.map(type => ({ value: type.value.toString(), label: type.label }));
  const termSelectOptions = termOptions.map(term => ({ value: term.value.toString(), label: term.label }));
  const statusOptions = [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [examinations, searchTerm, filterAcademicYear, filterClass, filterExamType, filterStatus, sortColumn, sortDirection]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchExaminations(),
        fetchAcademicYears(),
        fetchClasses(),
        fetchExamTypes(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchExaminations = async () => {
    try {
      const response = await api.get('/school/examinations');
      if (response.data.success) {
        setExaminations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching examinations:', error);
      toast.error('Failed to load examinations');
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
        
        // Convert { "12": "NURSERY", "13": "LKG", ... } to array
        if (typeof classesData === 'object' && !Array.isArray(classesData)) {
          classArray = Object.entries(classesData).map(([id, name]) => ({
            value: parseInt(id),      // This is m_id from master table
            label: name as string,
          }));
        }
        
        console.log('Classes loaded:', classArray);
        setClasses(classArray);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchExamTypes = async () => {
    try {
      const response = await api.get('/master/exam-types');
      if (response.data.success) {
        const typesData = response.data.data;
        if (typeof typesData === 'object' && !Array.isArray(typesData)) {
          const typeArray = Object.entries(typesData).map(([id, name]) => ({
            value: parseInt(id),
            label: name as string,
          }));
          setExamTypes(typeArray);
        } else {
          setExamTypes(typesData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching exam types:', error);
      setExamTypes([
        { value: 1, label: 'Quarterly' },
        { value: 2, label: 'Half Yearly' },
        { value: 3, label: 'Annual' },
        { value: 4, label: 'Weekly Test' },
        { value: 5, label: 'Pre Board' },
      ]);
    }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...examinations];

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getClassName(item.class_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getAcademicYearLabel(item.academic_year_id).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterAcademicYear) {
      filtered = filtered.filter(item => item.academic_year_id.toString() === filterAcademicYear);
    }

    if (filterClass) {
      filtered = filtered.filter(item => item.class_id.toString() === filterClass);
    }

    if (filterExamType) {
      filtered = filtered.filter(item => item.exam_type.toString() === filterExamType);
    }

    if (filterStatus) {
      filtered = filtered.filter(item => item.is_active.toString() === filterStatus);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof Examination];
      let bVal: any = b[sortColumn as keyof Examination];
      
      if (sortColumn === 'academic_year_label') {
        aVal = getAcademicYearLabel(a.academic_year_id);
        bVal = getAcademicYearLabel(b.academic_year_id);
      } else if (sortColumn === 'class_name') {
        aVal = getClassName(a.class_id);
        bVal = getClassName(b.class_id);
      } else if (sortColumn === 'exam_type_label') {
        aVal = getExamTypeLabel(a.exam_type);
        bVal = getExamTypeLabel(b.exam_type);
      } else if (sortColumn === 'term_label') {
        aVal = getTermLabel(a.term);
        bVal = getTermLabel(b.term);
      }
      
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
    if (sortColumn !== column) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterAcademicYear('');
    setFilterClass('');
    setFilterExamType('');
    setFilterStatus('');
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
      academic_year_id: '',
      class_id: '',
      name: '',
      exam_type: '',
      term: '',
      start_date: '',
      end_date: '',
      max_marks: 100,
      passing_marks: 33,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Examination) => {
    setEditingItem(item);
    setFormData({
      academic_year_id: item.academic_year_id.toString(),
      class_id: item.class_id.toString(),
      name: item.name,
      exam_type: item.exam_type.toString(),
      term: item.term.toString(),
      start_date: item.start_date,
      end_date: item.end_date,
      max_marks: item.max_marks,
      passing_marks: item.passing_marks,
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.academic_year_id || !formData.class_id || !formData.name || 
        !formData.exam_type || !formData.term || !formData.start_date || !formData.end_date) {
      toast.error('Please fill all required fields');
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error('End date must be after start date');
      return;
    }

    if (formData.passing_marks > formData.max_marks) {
      toast.error('Passing marks cannot be greater than max marks');
      return;
    }

    try {
      const submitData = {
        academic_year_id: parseInt(formData.academic_year_id),
        class_id: parseInt(formData.class_id),
        name: formData.name,
        exam_type: parseInt(formData.exam_type),
        term: parseInt(formData.term),
        start_date: formData.start_date,
        end_date: formData.end_date,
        max_marks: formData.max_marks,
        passing_marks: formData.passing_marks,
        is_active: formData.is_active,
      };

      if (editingItem) {
        const response = await api.put(`/school/examinations/${editingItem.id}`, submitData);
        if (response.data.success) {
          toast.success('Examination updated successfully');
        }
      } else {
        const response = await api.post('/school/examinations', submitData);
        if (response.data.success) {
          toast.success('Examination created successfully');
        }
      }
      setIsModalOpen(false);
      fetchExaminations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const response = await api.delete(`/school/examinations/${id}`);
        if (response.data.success) {
          toast.success('Examination deleted successfully');
          fetchExaminations();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await api.patch(`/school/examinations/${id}/toggle-status`);
      if (response.data.success) {
        toast.success('Examination status updated');
        fetchExaminations();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleBulkStatusUpdate = async (status: boolean) => {
    setBulkUpdating(true);
    const ids = Array.from(selectedItems);
    
    try {
      for (const id of ids) {
        await api.patch(`/school/examinations/${id}/toggle-status`);
      }
      toast.success(`${ids.length} examination(s) ${status ? 'activated' : 'deactivated'} successfully`);
      setSelectedItems(new Set());
      fetchExaminations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleExport = () => {
    try {
      const exportData = filteredData.map(item => ({
        'Academic Year': getAcademicYearLabel(item.academic_year_id),
        'Class': getClassName(item.class_id),
        'Exam Name': item.name,
        'Exam Type': getExamTypeLabel(item.exam_type),
        'Term': getTermLabel(item.term),
        'Start Date': formatDisplayDate(item.start_date),
        'End Date': formatDisplayDate(item.end_date),
        'Max Marks': item.max_marks,
        'Passing Marks': item.passing_marks,
        'Status': item.is_active ? 'Active' : 'Inactive',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Examinations');
      XLSX.writeFile(wb, `examinations_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Export successful!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const downloadSampleFile = async () => {
    try {
      // Get dynamic values from state
      const academicYearValues = academicYears.length > 0 
        ? academicYears.map(y => y.label) 
        : ['2024-2025', '2025-2026', '2026-2027'];
      
      const classValues = classes.length > 0 
        ? classes.map(c => c.label) 
        : ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
      
      const examTypeValues = examTypes.length > 0 
        ? examTypes.map(t => t.label) 
        : ['Quarterly', 'Half Yearly', 'Annual', 'Weekly Test', 'Pre Board'];
      
      const termValues = termOptions.map(t => t.label);
      const statusValues = ['Active', 'Inactive'];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Examinations');

      // Set column headers and widths
      worksheet.columns = [
        { header: 'Academic Year', key: 'academicYear', width: 18 },
        { header: 'Class', key: 'className', width: 15 },
        { header: 'Exam Name', key: 'examName', width: 25 },
        { header: 'Exam Type', key: 'examType', width: 15 },
        { header: 'Term', key: 'term', width: 15 },
        { header: 'Start Date', key: 'startDate', width: 12 },
        { header: 'End Date', key: 'endDate', width: 12 },
        { header: 'Max Marks', key: 'maxMarks', width: 12 },
        { header: 'Passing Marks', key: 'passingMarks', width: 12 },
        { header: 'Status', key: 'status', width: 10 },
      ];

      // Add sample rows
      worksheet.addRow({
        academicYear: academicYearValues[0],
        className: classValues[0],
        examName: 'Half Yearly Examination',
        examType: examTypeValues[1] || 'Half Yearly',
        term: termValues[1] || 'Second Term',
        startDate: '2024-12-01',
        endDate: '2024-12-15',
        maxMarks: 100,
        passingMarks: 33,
        status: 'Active',
      });
      worksheet.addRow({
        academicYear: academicYearValues[0],
        className: classValues[1] || classValues[0],
        examName: 'Annual Examination',
        examType: examTypeValues[2] || 'Annual',
        term: termValues[3] || 'Final Term',
        startDate: '2025-03-01',
        endDate: '2025-03-20',
        maxMarks: 100,
        passingMarks: 33,
        status: 'Active',
      });

      // Write lists data to columns L, M, N, O, P
      worksheet.getCell('L1').value = 'Academic_Year_List';
      worksheet.getCell('M1').value = 'Class_List';
      worksheet.getCell('N1').value = 'Exam_Type_List';
      worksheet.getCell('O1').value = 'Term_List';
      worksheet.getCell('P1').value = 'Status_List';

      academicYearValues.forEach((val, idx) => {
        worksheet.getCell(`L${idx + 2}`).value = val;
      });
      classValues.forEach((val, idx) => {
        worksheet.getCell(`M${idx + 2}`).value = val;
      });
      examTypeValues.forEach((val, idx) => {
        worksheet.getCell(`N${idx + 2}`).value = val;
      });
      termValues.forEach((val, idx) => {
        worksheet.getCell(`O${idx + 2}`).value = val;
      });
      statusValues.forEach((val, idx) => {
        worksheet.getCell(`P${idx + 2}`).value = val;
      });

      // Hide helper columns L to P
      worksheet.getColumn('L').hidden = true;
      worksheet.getColumn('M').hidden = true;
      worksheet.getColumn('N').hidden = true;
      worksheet.getColumn('O').hidden = true;
      worksheet.getColumn('P').hidden = true;

      // Apply data validation to columns A, B, D, E, J for rows 2 to 500
      for (let r = 2; r <= 500; r++) {
        worksheet.getCell(`A${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Examinations'!$L$2:$L$${1 + academicYearValues.length}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select an item from the dropdown list.',
        };

        worksheet.getCell(`B${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Examinations'!$M$2:$M$${1 + classValues.length}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select an item from the dropdown list.',
        };

        worksheet.getCell(`D${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Examinations'!$N$2:$N$${1 + examTypeValues.length}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select an item from the dropdown list.',
        };

        worksheet.getCell(`E${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Examinations'!$O$2:$O$${1 + termValues.length}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select an item from the dropdown list.',
        };

        worksheet.getCell(`J${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Examinations'!$P$2:$P$3`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select Active or Inactive.',
        };
      }

      // Write to buffer and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_examinations.xlsx');

      toast.success('Sample file downloaded!');
    } catch (error) {
      console.error('Error downloading sample file:', error);
      toast.error('Failed to download sample file');
    }
  };

  // Handle File Upload - Convert Date objects to string
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Get all rows as array of arrays
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        // Find header row
        let headerRowIndex = -1;
        let headers: string[] = [];
        
        for (let i = 0; i < rows.length; i++) {
          const firstCell = rows[i][0];
          if (firstCell && (firstCell === 'Academic Year' || firstCell?.toString().includes('Academic'))) {
            headerRowIndex = i;
            headers = rows[i].map((cell: any) => cell?.toString().trim() || '');
            break;
          }
        }
        
        if (headerRowIndex === -1) {
          toast.error('Could not find header row');
          return;
        }
        
        // Helper to convert date to string
        const formatCellValue = (value: any): string => {
          if (value instanceof Date) {
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const day = String(value.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
          if (value && typeof value === 'object') {
            return '';
          }
          return value?.toString() || '';
        };
        
        // Get data rows (skip list rows)
        const dataRows: any[] = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          // Skip if row starts with list data
          const firstCell = row[0];
          if (firstCell && (firstCell.toString().includes('_List') || 
              firstCell === 'Academic_Year_List' ||
              firstCell === 'Class_List' ||
              firstCell === 'Exam_Type_List' ||
              firstCell === 'Term_List' ||
              firstCell === 'Status_List')) {
            continue;
          }
          
          // Check if row has valid data
          const hasData = row.some((cell: any) => cell && cell.toString().trim() !== '');
          if (!hasData) continue;
          
          const rowData: any = {};
          for (let j = 0; j < headers.length; j++) {
            const header = headers[j];
            if (header && !header.includes('_List') && header !== '__EMPTY' && header !== '__EMPTY_1') {
              rowData[header] = formatCellValue(row[j]);
            }
          }
          
          // Only add if has required fields
          if (rowData['Academic Year'] && rowData['Class'] && rowData['Exam Name']) {
            dataRows.push(rowData);
          }
        }
        
        if (dataRows.length === 0) {
          toast.error('No valid data found in the file.');
          return;
        }
        
        setImportData(dataRows);
        setImportPreview(dataRows.slice(0, 5));
        setIsImportModalOpen(true);
        
      } catch (error) {
        console.error('File read error:', error);
        toast.error('Failed to read file');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Helper function to convert Excel serial date to YYYY-MM-DD
  const excelDateToJSDate = (serial: number) => {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const year = date_info.getFullYear();
    const month = String(date_info.getMonth() + 1).padStart(2, '0');
    const day = String(date_info.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to format any date to YYYY-MM-DD
  const formatDateToYMD = (dateValue: any): string | null => {
    if (!dateValue) return null;
    
    // If it's a number (Excel serial date)
    if (typeof dateValue === 'number') {
      return excelDateToJSDate(dateValue);
    }
    
    // If it's a string
    if (typeof dateValue === 'string') {
      // Already in YYYY-MM-DD format
      if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateValue;
      }
      
      // Handle DD/MM/YYYY format
      if (dateValue.includes('/')) {
        const parts = dateValue.split('/');
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      
      // Handle DD-MM-YYYY format
      if (dateValue.includes('-')) {
        const parts = dateValue.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
          return dateValue;
        }
        if (parts.length === 3 && parts[2].length === 4) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }
    
    // Try parsing with Date constructor
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return null;
  };

  // Process Import - Send IDs correctly
  const processImport = async () => {
    setImporting(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    for (let i = 0; i < importData.length; i++) {
      const row = importData[i];
      const rowNum = i + 2;

      try {
        // Get Academic Year ID
        const academicYearItem = academicYears.find(y => y.label === row['Academic Year']);
        if (!academicYearItem) {
          errors.push({ row: rowNum, error: `Academic year not found: ${row['Academic Year']}`, row_data: row });
          errorCount++;
          continue;
        }

        // Get Class ID - Important: Make sure classItem.value is a number
        const classItem = classes.find(c => c.label === row['Class']);
        if (!classItem) {
          errors.push({ row: rowNum, error: `Class not found: ${row['Class']}`, row_data: row });
          errorCount++;
          continue;
        }

        // Get Exam Type ID
        let examTypeLabel = row['Exam Type'];
        let examTypeItem = examTypes.find(t => t.label === examTypeLabel);
        
        if (!examTypeItem) {
          examTypeItem = examTypes.find(t => 
            t.label.toLowerCase() === examTypeLabel.toLowerCase()
          );
        }
        
        if (!examTypeItem) {
          errors.push({ row: rowNum, error: `Exam type not found: ${row['Exam Type']}`, row_data: row });
          errorCount++;
          continue;
        }

        // Get Term ID
        let termLabel = row['Term'];
        let termItem = termOptions.find(t => t.label === termLabel);
        
        if (!termItem) {
          termItem = termOptions.find(t => 
            t.label.toLowerCase() === termLabel.toLowerCase()
          );
        }
        
        if (!termItem) {
          errors.push({ row: rowNum, error: `Term not found: ${row['Term']}`, row_data: row });
          errorCount++;
          continue;
        }

        // Format dates
        const startDate = formatDateToYMD(row['Start Date']);
        const endDate = formatDateToYMD(row['End Date']);

        if (!startDate) {
          errors.push({ row: rowNum, error: `Invalid Start Date: ${row['Start Date']}`, row_data: row });
          errorCount++;
          continue;
        }

        if (!endDate) {
          errors.push({ row: rowNum, error: `Invalid End Date: ${row['End Date']}`, row_data: row });
          errorCount++;
          continue;
        }

        // Validate Max Marks
        const maxMarks = parseInt(row['Max Marks']);
        if (isNaN(maxMarks) || maxMarks < 1 || maxMarks > 1000) {
          errors.push({ row: rowNum, error: `Invalid Max Marks: ${row['Max Marks']}`, row_data: row });
          errorCount++;
          continue;
        }

        // Validate Passing Marks
        const passingMarks = parseInt(row['Passing Marks']);
        if (isNaN(passingMarks) || passingMarks < 0 || passingMarks > maxMarks) {
          errors.push({ row: rowNum, error: `Invalid Passing Marks: ${row['Passing Marks']}`, row_data: row });
          errorCount++;
          continue;
        }

        // Prepare data with correct field names and types
        const submitData = {
          academic_year_id: Number(academicYearItem.value),  // Ensure number
          class_id: Number(classItem.value),                 // Ensure number
          exam_name: String(row['Exam Name']),               // Ensure string
          exam_type_id: Number(examTypeItem.value),          // Ensure number
          term_id: Number(termItem.value),                   // Ensure number
          start_date: String(startDate),                     // Ensure string
          end_date: String(endDate),                         // Ensure string
          max_marks: Number(maxMarks),                       // Ensure number
          passing_marks: Number(passingMarks),               // Ensure number
          is_active: row['Status']?.toLowerCase() === 'active', // Ensure boolean
        };

        console.log(`Submitting row ${rowNum}:`, JSON.stringify(submitData, null, 2));
        
        // Send as array of objects
        const response = await api.post('/school/examinations/bulk-import', { data: [submitData] });
        
        if (response.data.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push({ row: rowNum, error: response.data.message || 'Import failed', row_data: row });
        }
        
      } catch (error: any) {
        errorCount++;
        errors.push({ row: rowNum, error: error.response?.data?.message || error.message, row_data: row });
      }
    }

    // Show results
    if (successCount > 0 && errorCount === 0) {
      toast.success(`✅ All ${successCount} record(s) imported successfully!`);
      setIsImportModalOpen(false);
      fetchExaminations();
    } else if (successCount > 0 && errorCount > 0) {
      toast.success(`✅ ${successCount} record(s) imported successfully!`);
      
      const shouldDownload = window.confirm(
        `⚠️ ${errorCount} record(s) failed to import.\n\nDo you want to download the error report?`
      );
      
      if (shouldDownload) {
        await downloadErrorReport(errors, importData);
      }
      
      setIsImportModalOpen(false);
      fetchExaminations();
    } else if (successCount === 0 && errorCount > 0) {
      toast.error(`❌ All ${errorCount} record(s) failed to import.`);
      
      const shouldDownload = window.confirm(
        `⚠️ All ${errorCount} records failed to import.\n\nDo you want to download the error report?`
      );
      
      if (shouldDownload) {
        await downloadErrorReport(errors, importData);
      }
      
      setIsImportModalOpen(false);
    }
    
    setImporting(false);
  };

  // Download Error Report
  const downloadErrorReport = async (errors: any[], importData: any[]) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Import Errors');

      worksheet.columns = [
        { header: 'Row Number', key: 'row_number', width: 12 },
        { header: 'Academic Year', key: 'academic_year', width: 18 },
        { header: 'Class', key: 'class', width: 15 },
        { header: 'Exam Name', key: 'exam_name', width: 25 },
        { header: 'Exam Type', key: 'exam_type', width: 15 },
        { header: 'Term', key: 'term', width: 15 },
        { header: 'Start Date', key: 'start_date', width: 12 },
        { header: 'End Date', key: 'end_date', width: 12 },
        { header: 'Max Marks', key: 'max_marks', width: 12 },
        { header: 'Passing Marks', key: 'passing_marks', width: 12 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Error Details', key: 'error_details', width: 50 },
      ];

      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD32F2F' }
      };
      worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

      errors.forEach((err: any) => {
        const row = err.row_data || {};
        worksheet.addRow({
          row_number: err.row,
          academic_year: row['Academic Year'] || '',
          class: row['Class'] || '',
          exam_name: row['Exam Name'] || '',
          exam_type: row['Exam Type'] || '',
          term: row['Term'] || '',
          start_date: row['Start Date'] || '',
          end_date: row['End Date'] || '',
          max_marks: row['Max Marks'] || '',
          passing_marks: row['Passing Marks'] || '',
          status: row['Status'] || '',
          error_details: err.error,
        });
      });

      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 25 },
        { header: 'Value', key: 'value', width: 20 },
      ];

      summarySheet.addRow({ metric: 'Total Records Processed', value: importData.length });
      summarySheet.addRow({ metric: 'Successfully Imported', value: importData.length - errors.length });
      summarySheet.addRow({ metric: 'Failed Records', value: errors.length });
      summarySheet.addRow({ metric: 'Success Rate', value: `${((importData.length - errors.length) / importData.length * 100).toFixed(2)}%` });

      summarySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' }
      };
      summarySheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `examination_import_errors_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast.success('Error report downloaded!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate error report');
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

  const getExamTypeLabel = (id: number) => {
    const type = examTypes.find(t => t.value === id);
    return type?.label || 'N/A';
  };

  const getTermLabel = (term: number) => {
    const termObj = termOptions.find(t => t.value === term);
    return termObj?.label || 'N/A';
  };

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-GB', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const handleSelectRow = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === paginatedData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(paginatedData.map(item => item.id)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Action Buttons, Search and Show per page - ALL IN ONE ROW */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
        {/* Left side: Search and Show */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search examinations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none w-44"
          />

          {/* Show pagination limit */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5">
            <span className="text-[10px] text-gray-500 font-semibold uppercase">Show:</span>
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
              <option value={100}>100</option>
              <option value="all">All</option>
            </select>
          </div>

          {(searchTerm || filterAcademicYear || filterClass || filterExamType || filterStatus) && (
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium">
              Clear
            </button>
          )}
        </div>

        {/* Right side: Action Buttons */}
        <div className="flex items-center gap-1.5">
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
          
          <button
            onClick={openAddModal}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition text-xs font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New
          </button>
        </div>
      </div>

      {/* Filters - Searchable Dropdowns (No title) */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <SearchableSelect 
          options={academicYearOptions} 
          value={filterAcademicYear} 
          onChange={setFilterAcademicYear} 
          placeholder="Academic Years"
        />
        <SearchableSelect 
          options={classOptions} 
          value={filterClass} 
          onChange={setFilterClass} 
          placeholder="Classes"
        />
        <SearchableSelect 
          options={examTypeOptions} 
          value={filterExamType} 
          onChange={setFilterExamType} 
          placeholder="Exam Types"
        />
        <SearchableSelect 
          options={statusOptions} 
          value={filterStatus} 
          onChange={setFilterStatus} 
          placeholder="Status"
        />
      </div>

      {/* Bulk Actions Bar */}
      {selectedItems.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-2 rounded text-xs text-blue-700">
          <span className="font-semibold">{selectedItems.size} item(s) selected</span>
          <div className="flex items-center gap-2">
            <button onClick={() => handleBulkStatusUpdate(true)} disabled={bulkUpdating} className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 transition disabled:opacity-50 text-green-700 font-medium">
              {bulkUpdating ? 'Updating...' : 'Mark Active'}
            </button>
            <button onClick={() => handleBulkStatusUpdate(false)} disabled={bulkUpdating} className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 transition disabled:opacity-50 text-red-700 font-medium">
              {bulkUpdating ? 'Updating...' : 'Mark Inactive'}
            </button>
            <button onClick={() => setSelectedItems(new Set())} className="px-2 py-0.5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition">
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Table view */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold uppercase text-[10px]">
              <th className="py-2 px-2.5 w-8">
                <input
                  type="checkbox"
                  checked={paginatedData.length > 0 && paginatedData.every(item => selectedItems.has(item.id))}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                />
              </th>
              <th className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('academic_year_label')}>
                Academic Year {getSortIcon('academic_year_label')}
              </th>
              <th className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('class_name')}>
                Class {getSortIcon('class_name')}
              </th>
              <th className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('name')}>
                Exam Name {getSortIcon('name')}
              </th>
              <th className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('exam_type_label')}>
                Exam Type {getSortIcon('exam_type_label')}
              </th>
              <th className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('term_label')}>
                Term {getSortIcon('term_label')}
              </th>
              <th className="py-2 px-2.5">Start Date</th>
              <th className="py-2 px-2.5">End Date</th>
              <th className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('max_marks')}>
                Max Marks {getSortIcon('max_marks')}
              </th>
              <th className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('passing_marks')}>
                Passing Marks {getSortIcon('passing_marks')}
              </th>
              <th className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition text-center w-28" onClick={() => handleSort('is_active')}>
                Status {getSortIcon('is_active')}
              </th>
              <th className="py-2 px-2.5 w-20 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-6 text-center text-gray-500 font-medium">
                  No examinations found.
                </td>
              </tr>
            ) : (
              paginatedData.map((exam) => (
                <tr key={exam.id} className="hover:bg-gray-50 transition text-gray-700">
                  <td className="py-1.5 px-2.5">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(exam.id)}
                      onChange={() => handleSelectRow(exam.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                    />
                  </td>
                  <td className="py-1.5 px-2.5">{getAcademicYearLabel(exam.academic_year_id)}</td>
                  <td className="py-1.5 px-2.5 font-medium text-gray-900">{getClassName(exam.class_id)}</td>
                  <td className="py-1.5 px-2.5 font-medium text-gray-800">{exam.name}</td>
                  <td className="py-1.5 px-2.5">
                    <span className="px-2 py-0.5 text-[10px] bg-purple-50 text-purple-700 rounded-full font-medium">
                      {getExamTypeLabel(exam.exam_type)}
                    </span>
                  </td>
                  <td className="py-1.5 px-2.5">
                    <span className="px-2 py-0.5 text-[10px] bg-blue-50 text-blue-700 rounded-full font-medium">
                      {getTermLabel(exam.term)}
                    </span>
                  </td>
                  <td className="py-1.5 px-2.5 text-gray-600">{formatDisplayDate(exam.start_date)}</td>
                  <td className="py-1.5 px-2.5 text-gray-600">{formatDisplayDate(exam.end_date)}</td>
                  <td className="py-1.5 px-2.5 font-semibold text-gray-900">{exam.max_marks}</td>
                  <td className="py-1.5 px-2.5 text-gray-700">{exam.passing_marks}</td>
                  <td className="py-1.5 px-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <ToggleSwitch
                        checked={exam.is_active}
                        onChange={() => handleToggleStatus(exam.id)}
                      />
                      <span className={`text-[10px] font-medium ${exam.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                        {exam.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="py-1.5 px-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => openEditModal(exam)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition" title="Edit">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(exam.id, exam.name)} className="p-1 text-red-600 hover:bg-red-50 rounded transition" title="Delete">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && itemsPerPage !== -1 && (
        <div className="flex items-center justify-between border-t border-gray-150 bg-white px-2 py-1.5 text-xs">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded border border-gray-300 bg-white px-2.5 py-0.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative ml-2 inline-flex items-center rounded border border-gray-300 bg-white px-2.5 py-0.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] text-gray-500">
                Showing{' '}
                <span className="font-semibold text-gray-700">
                  {itemsPerPage === -1 ? 1 : (currentPage - 1) * itemsPerPage + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-gray-700">
                  {itemsPerPage === -1
                    ? filteredData.length
                    : Math.min(currentPage * itemsPerPage, filteredData.length)}
                </span>{' '}
                of <span className="font-semibold text-gray-700">{filteredData.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l px-1.5 py-0.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  &lsaquo;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-2 py-0.5 text-xs font-semibold focus:z-20 ${
                      currentPage === page
                        ? 'z-10 bg-blue-600 text-white'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r px-1.5 py-0.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  &rsaquo;
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-gray-800">
                {editingItem ? 'Edit Examination' : 'Add Examination'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-xs">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Academic Year <span className="text-red-500">*</span></label>
                    <SearchableSelect
                      options={academicYearOptions}
                      value={formData.academic_year_id}
                      onChange={(value) => setFormData(prev => ({ ...prev, academic_year_id: value }))}
                      placeholder="Select Year"
                      isClearable={false}
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Class <span className="text-red-500">*</span></label>
                    <SearchableSelect
                      options={classOptions}
                      value={formData.class_id}
                      onChange={(value) => setFormData(prev => ({ ...prev, class_id: value }))}
                      placeholder="Select Class"
                      isClearable={false}
                      className="w-full text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Exam Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Half Yearly Examination 2024"
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Exam Type <span className="text-red-500">*</span></label>
                    <SearchableSelect
                      options={examTypeOptions}
                      value={formData.exam_type}
                      onChange={(value) => setFormData(prev => ({ ...prev, exam_type: value }))}
                      placeholder="Select Type"
                      isClearable={false}
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Term <span className="text-red-500">*</span></label>
                    <SearchableSelect
                      options={termSelectOptions}
                      value={formData.term}
                      onChange={(value) => setFormData(prev => ({ ...prev, term: value }))}
                      placeholder="Select Term"
                      isClearable={false}
                      className="w-full text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Start Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">End Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Max Marks <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      name="max_marks"
                      value={formData.max_marks}
                      onChange={handleInputChange}
                      min="1"
                      max="1000"
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Passing Marks <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      name="passing_marks"
                      value={formData.passing_marks}
                      onChange={handleInputChange}
                      min="0"
                      max={formData.max_marks}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="p-2 bg-gray-50 rounded border border-gray-150">
                  <ToggleSwitch
                    checked={formData.is_active}
                    onChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    label="Active Status"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-medium"
                  >
                    {editingItem ? 'Update' : 'Add'} Examination
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 rounded-t-xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Import Examinations</h3>
                <button onClick={() => setIsImportModalOpen(false)} className="text-white hover:bg-white/20 rounded-lg p-1 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} /></svg>
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <div className="mb-4 p-3 bg-blue-50 rounded-lg"><p className="text-sm text-blue-800"><strong>Total Records:</strong> {importData.length} | <strong>Preview (First 5 rows):</strong></p></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      {importPreview.length > 0 && Object.keys(importPreview[0]).map((key, idx) => (<th key={idx} className="px-3 py-2 text-left border">{key}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        {Object.values(row).map((val: any, colIdx) => (<td key={colIdx} className="px-3 py-2 border">{val}</td>))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0 bg-gray-50 rounded-b-xl">
              <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
              <button onClick={processImport} disabled={importing} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">{importing ? 'Importing...' : 'Confirm Import'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExaminationManager;