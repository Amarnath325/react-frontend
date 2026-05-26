import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface FeeStructure {
  id: number;
  academic_year_id: number | null;
  class_id: number;
  fee_head: number;
  amount: number;
  frequency: number;
  due_date: string;
  late_fee_amount: number;
  is_optional: boolean;
  is_active: boolean;
}

interface MasterOption {
  value: number;
  label: string;
}

interface ClassOption {
  id: number;
  name: string;
  section: string | null;
}

// Toggle Switch Component
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}> = ({ checked, onChange, label }) => {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${checked ? 'bg-green-500' : 'bg-gray-300'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </label>
  );
};

// Searchable Select Component
const SearchableSelect: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isClearable?: boolean;
}> = ({ options, value, onChange, placeholder, isClearable = true }) => {
  const selectedOption = options.find(opt => opt.value === value) || null;

  return (
    <Select
      options={options}
      value={selectedOption}
      onChange={(selected) => onChange(selected ? selected.value : '')}
      placeholder={placeholder}
      isClearable={isClearable}
      className="w-40 text-xs"  // Smaller width and font
      classNamePrefix="react-select"
      styles={{
        control: (base: any) => ({
          ...base,
          borderRadius: '0.375rem',
          borderColor: '#d1d5db',
          minHeight: '30px',
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
          fontSize: '12px',
          padding: '6px 10px',
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
          fontSize: '12px',
        }),
        singleValue: (base: any) => ({
          ...base,
          fontSize: '12px',
        }),
      }}
    />
  );
};

const FeeStructureManager: React.FC = () => {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [filteredData, setFilteredData] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FeeStructure | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<any>(null);
  const [showImportResult, setShowImportResult] = useState(false);

  // Bulk action states
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('');
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterFeeHead, setFilterFeeHead] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Master data states
  const [feeHeads, setFeeHeads] = useState<MasterOption[]>([]);
  const [frequencies, setFrequencies] = useState<MasterOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [academicYears, setAcademicYears] = useState<MasterOption[]>([]);

  const [formData, setFormData] = useState({
    academic_year_id: '',
    class_id: '',
    fee_head: '',
    amount: 0,
    frequency: '',
    due_date: '',
    late_fee_amount: 0,
    is_optional: false,
    is_active: true,
  });

  const [errors, setErrors] = useState({
    amount: '',
    late_fee_amount: '',
  });

  // Convert options for searchable selects
  const academicYearSelectOptions = academicYears.map(year => ({ value: year.value.toString(), label: year.label }));
  const classSelectOptions = classes.map(cls => ({ value: cls.id.toString(), label: cls.name }));
  const feeHeadSelectOptions = feeHeads.map(head => ({ value: head.value.toString(), label: head.label }));
  const frequencySelectOptions = frequencies.map(freq => ({ value: freq.value.toString(), label: freq.label }));
  const statusSelectOptions = [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [feeStructures, searchTerm, filterAcademicYear, filterClass, filterFeeHead, filterStatus, sortColumn, sortDirection]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchFeeStructures(),
        fetchMasterData(),
        fetchClasses(),
        fetchAcademicYears(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeeStructures = async () => {
    try {
      const response = await api.get('/school/fee-structures');
      if (response.data.success) {
        setFeeStructures(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching fee structures:', error);
      toast.error('Failed to load fee structures');
    }
  };

  const fetchMasterData = async () => {
    try {
      const [feeHeadsRes, frequenciesRes] = await Promise.all([
        api.get('/master/fee-types'),
        api.get('/master/fee-frequencies'),
      ]);

      console.log('Fee Heads API Response:', feeHeadsRes.data);
      console.log('Frequencies API Response:', frequenciesRes.data);

      // Normalize API data into array of { value, label }
      const convertObjectToArray = (data: any): MasterOption[] => {
        if (!data) return [];

        const normalizeItem = (item: any) => {
          if (item && typeof item === 'object') {
            const value = item.m_id ?? item.id ?? item.value ?? item.key;
            const label = item.m_name ?? item.name ?? item.label ?? String(value ?? '');
            return {
              value: typeof value === 'string' ? parseInt(value, 10) : value,
              label: String(label),
            };
          }

          return {
            value: typeof item === 'string' ? parseInt(item, 10) : item,
            label: String(item),
          };
        };

        // If it's already an array
        if (Array.isArray(data)) {
          return data.map(normalizeItem);
        }

        // If it's an object like { "150": "Admission Fee", "151": "Tuition Fee" }
        if (typeof data === 'object' && data !== null) {
          return Object.entries(data).map(([key, value]) => ({
            value: parseInt(key, 10),
            label: String(value),
          }));
        }

        return [];
      };

      // Extract data from response
      const feeHeadsData = convertObjectToArray(feeHeadsRes.data?.data || feeHeadsRes.data || {});
      const frequenciesData = convertObjectToArray(frequenciesRes.data?.data || frequenciesRes.data || {});

      console.log('Converted Fee Heads:', feeHeadsData);
      console.log('Converted Frequencies:', frequenciesData);

      setFeeHeads(feeHeadsData);
      setFrequencies(frequenciesData);

    } catch (error) {
      console.error('Error fetching master data:', error);
      toast.error('Failed to load master data');
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get('/master/classes');
      if (response.data.success) {
        const classesData = response.data.data;
        if (typeof classesData === 'object' && !Array.isArray(classesData)) {
          const classArray = Object.entries(classesData).map(([id, name]) => ({
            id: parseInt(id),
            name: name as string,
            section: null,
          }));
          setClasses(classArray);
        } else {
          setClasses(classesData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
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

  const applyFiltersAndSorting = () => {
    let filtered = [...feeStructures];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        getClassName(item.class_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getFeeHeadLabel(item.fee_head).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getAcademicYearLabel(item.academic_year_id).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Academic Year filter
    if (filterAcademicYear) {
      filtered = filtered.filter(item => item.academic_year_id?.toString() === filterAcademicYear);
    }

    // Class filter
    if (filterClass) {
      filtered = filtered.filter(item => item.class_id.toString() === filterClass);
    }

    // Fee Head filter
    if (filterFeeHead) {
      filtered = filtered.filter(item => item.fee_head.toString() === filterFeeHead);
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter(item => item.is_active.toString() === filterStatus);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof FeeStructure];
      let bVal: any = b[sortColumn as keyof FeeStructure];

      if (sortColumn === 'class_name') {
        aVal = getClassName(a.class_id);
        bVal = getClassName(b.class_id);
      } else if (sortColumn === 'fee_head_label') {
        aVal = getFeeHeadLabel(a.fee_head);
        bVal = getFeeHeadLabel(b.fee_head);
      } else if (sortColumn === 'academic_year_label') {
        aVal = getAcademicYearLabel(a.academic_year_id);
        bVal = getAcademicYearLabel(b.academic_year_id);
      } else if (sortColumn === 'frequency_label') {
        aVal = getFrequencyLabel(a.frequency);
        bVal = getFrequencyLabel(b.frequency);
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
    setFilterFeeHead('');
    setFilterStatus('');
  };

  // Pagination
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = itemsPerPage === -1
    ? filteredData
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const validateAmount = (value: number): boolean => {
    const strValue = value.toString();
    const length = strValue.length;
    if (length < 2 || length > 8) {
      setErrors(prev => ({ ...prev, amount: 'Amount must be between 2 to 8 digits' }));
      return false;
    }
    setErrors(prev => ({ ...prev, amount: '' }));
    return true;
  };

  const validateLateFee = (value: number): boolean => {
    const strValue = value.toString();
    const length = strValue.length;
    if (value > 0 && (length < 2 || length > 6)) {
      setErrors(prev => ({ ...prev, late_fee_amount: 'Late fee must be between 2 to 6 digits' }));
      return false;
    }
    setErrors(prev => ({ ...prev, late_fee_amount: '' }));
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === 'amount') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        validateAmount(numValue);
      }
    }
    if (name === 'late_fee_amount') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        validateLateFee(numValue);
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'amount' || name === 'late_fee_amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSelectChange = (name: string, selected: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: selected ? selected.value : ''
    }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      academic_year_id: '',
      class_id: '',
      fee_head: '',
      amount: 0,
      frequency: '',
      due_date: '',
      late_fee_amount: 0,
      is_optional: false,
      is_active: true,
    });
    setErrors({ amount: '', late_fee_amount: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (item: FeeStructure) => {
    setEditingItem(item);
    setFormData({
      academic_year_id: item.academic_year_id?.toString() || '',
      class_id: item.class_id.toString(),
      fee_head: item.fee_head.toString(),
      amount: item.amount,
      frequency: item.frequency.toString(),
      due_date: item.due_date || '',
      late_fee_amount: item.late_fee_amount,
      is_optional: item.is_optional,
      is_active: item.is_active,
    });
    validateAmount(item.amount);
    validateLateFee(item.late_fee_amount);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.academic_year_id) {
      toast.error('Please select academic year');
      return;
    }
    if (!formData.class_id) {
      toast.error('Please select class');
      return;
    }
    if (!formData.fee_head) {
      toast.error('Please select fee head');
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Please enter valid amount');
      return;
    }
    if (!validateAmount(formData.amount)) {
      toast.error('Amount must be between 2 to 8 digits');
      return;
    }
    if (!formData.frequency) {
      toast.error('Please select frequency');
      return;
    }
    if (formData.late_fee_amount > 0 && !validateLateFee(formData.late_fee_amount)) {
      toast.error('Late fee must be between 2 to 6 digits');
      return;
    }

    try {
      const submitData = {
        academic_year_id: parseInt(formData.academic_year_id),
        class_id: parseInt(formData.class_id),
        fee_head: parseInt(formData.fee_head),
        amount: formData.amount,
        frequency: parseInt(formData.frequency),
        due_date: formData.due_date || null,
        late_fee_amount: formData.late_fee_amount,
        is_optional: formData.is_optional,
        is_active: formData.is_active,
      };

      if (editingItem) {
        const response = await api.put(`/school/fee-structures/${editingItem.id}`, submitData);
        if (response.data.success) {
          toast.success('Fee structure updated successfully');
        }
      } else {
        const response = await api.post('/school/fee-structures', submitData);
        if (response.data.success) {
          toast.success('Fee structure added successfully');
        }
      }
      setIsModalOpen(false);
      fetchFeeStructures();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete this fee structure?`)) {
      try {
        const response = await api.delete(`/school/fee-structures/${id}`);
        if (response.data.success) {
          toast.success('Fee structure deleted successfully');
          fetchFeeStructures();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await api.patch(`/school/fee-structures/${id}/toggle-status`);
      if (response.data.success) {
        toast.success(response.data.message || 'Status updated successfully');
        fetchFeeStructures();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedData.map(item => item.id));
      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleBulkStatusUpdate = async (status: boolean) => {
    if (selectedItems.size === 0) {
      toast.error('Please select at least one fee structure');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${status ? 'activate' : 'deactivate'} ${selectedItems.size} selected fee structure(s)?`)) {
      return;
    }

    setBulkUpdating(true);
    let successCount = 0;
    let errorCount = 0;

    for (const id of selectedItems) {
      try {
        const response = await api.patch(`/school/fee-structures/${id}/toggle-status`, { 
          is_active: status 
        });
        if (response.data.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    setBulkUpdating(false);
    if (successCount > 0) {
      toast.success(`${successCount} fee structure(s) updated successfully`);
      setSelectedItems(new Set());
      fetchFeeStructures();
    }
    if (errorCount > 0) {
      toast.error(`Failed to update ${errorCount} fee structure(s)`);
    }
  };

  const handleExport = () => {
    try {
      const exportData = filteredData.map(item => ({
        'Academic Year': getAcademicYearLabel(item.academic_year_id),
        'Class': getClassName(item.class_id),
        'Fee Head': getFeeHeadLabel(item.fee_head),
        'Amount (₹)': item.amount,
        'Frequency': getFrequencyLabel(item.frequency),
        'Due Date': formatDisplayDate(item.due_date),
        'Late Fee (₹)': item.late_fee_amount,
        'Optional Fee': item.is_optional ? 'Yes' : 'No',
        'Status': item.is_active ? 'Active' : 'Inactive',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Fee Structures');
      XLSX.writeFile(wb, `fee_structures_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Export successful!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const downloadSampleFile = async () => {
    try {
      // Get dynamic values from state
      const academicYearValues = academicYears.length > 0 ? academicYears.map(y => y.label) : ['2024-2025', '2025-2026', '2026-2027'];
      const classValues = classes.length > 0 ? classes.map(c => c.name) : ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
      const feeHeadValues = feeHeads.length > 0 ? feeHeads.map(f => f.label) : ['Admission Fee', 'Tuition Fee', 'Annual Fee', 'Examination Fee', 'Transport Fee', 'Hostel Fee', 'Library Fee'];
      const frequencyValues = frequencies.length > 0 ? frequencies.map(f => f.label) : ['Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'One Time'];
      const optionalValues = ['Yes', 'No'];
      const activeValues = ['Yes', 'No'];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Fee Structure');

      // Set column headers and widths
      worksheet.columns = [
        { header: 'Academic Year', key: 'academicYear', width: 18 },
        { header: 'Class', key: 'className', width: 15 },
        { header: 'Fee Head', key: 'feeHead', width: 25 },
        { header: 'Amount (₹)', key: 'amount', width: 12 },
        { header: 'Frequency', key: 'frequency', width: 15 },
        { header: 'Due Date', key: 'dueDate', width: 12 },
        { header: 'Late Fee (₹)', key: 'lateFee', width: 12 },
        { header: 'Optional Fee', key: 'optional', width: 14 },
        { header: 'Active', key: 'active', width: 10 },
      ];

      // Add two sample rows
      worksheet.addRow({
        academicYear: academicYearValues[0],
        className: classValues[0],
        feeHead: feeHeadValues[0],
        amount: 5000,
        frequency: frequencyValues[0],
        dueDate: '2024-07-10',
        lateFee: 100,
        optional: 'No',
        active: 'Yes',
      });
      worksheet.addRow({
        academicYear: academicYearValues[0],
        className: classValues[0],
        feeHead: feeHeadValues[0],
        amount: 10000,
        frequency: frequencyValues[0],
        dueDate: '2024-06-15',
        lateFee: 200,
        optional: 'Yes',
        active: 'Yes',
      });

      // Write lists data to columns L, M, N, O, P, Q
      worksheet.getCell('L1').value = 'Academic_Year_List';
      worksheet.getCell('M1').value = 'Class_List';
      worksheet.getCell('N1').value = 'Fee_Head_List';
      worksheet.getCell('O1').value = 'Frequency_List';
      worksheet.getCell('P1').value = 'Optional_List';
      worksheet.getCell('Q1').value = 'Active_List';

      academicYearValues.forEach((val, idx) => {
        worksheet.getCell(`L${idx + 2}`).value = val;
      });
      classValues.forEach((val, idx) => {
        worksheet.getCell(`M${idx + 2}`).value = val;
      });
      feeHeadValues.forEach((val, idx) => {
        worksheet.getCell(`N${idx + 2}`).value = val;
      });
      frequencyValues.forEach((val, idx) => {
        worksheet.getCell(`O${idx + 2}`).value = val;
      });
      optionalValues.forEach((val, idx) => {
        worksheet.getCell(`P${idx + 2}`).value = val;
      });
      activeValues.forEach((val, idx) => {
        worksheet.getCell(`Q${idx + 2}`).value = val;
      });

      // Hide helper columns L to Q
      worksheet.getColumn('L').hidden = true;
      worksheet.getColumn('M').hidden = true;
      worksheet.getColumn('N').hidden = true;
      worksheet.getColumn('O').hidden = true;
      worksheet.getColumn('P').hidden = true;
      worksheet.getColumn('Q').hidden = true;

      // Apply data validation to columns A, B, C, E, H, I for rows 2 to 500
      for (let r = 2; r <= 500; r++) {
        worksheet.getCell(`A${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Fee Structure'!$L$2:$L$${1 + academicYearValues.length}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select an item from the dropdown list.',
        };

        worksheet.getCell(`B${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Fee Structure'!$M$2:$M$${1 + classValues.length}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select an item from the dropdown list.',
        };

        worksheet.getCell(`C${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Fee Structure'!$N$2:$N$${1 + feeHeadValues.length}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select an item from the dropdown list.',
        };

        worksheet.getCell(`E${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Fee Structure'!$O$2:$O$${1 + frequencyValues.length}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select an item from the dropdown list.',
        };

        worksheet.getCell(`H${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Fee Structure'!$P$2:$P$3`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select Yes or No.',
        };

        worksheet.getCell(`I${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Fee Structure'!$Q$2:$Q$3`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select Yes or No.',
        };
      }

      // Write to buffer and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_fee_structures.xlsx');

      toast.success('Sample file downloaded!');
      // toast('Excel file contains dropdown lists. Use the dropdown arrows in each cell.');
    } catch (error) {
      console.error('Error downloading sample file:', error);
      toast.error('Failed to download sample file');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Read first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Get the range of the sheet
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:I100');
        
        // Find the actual header row (first row with valid headers)
        let headerRowIndex = 0;
        let headers: string[] = [];
        
        for (let row = range.s.r; row <= range.e.r; row++) {
          const firstCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
          if (firstCell && firstCell.v && 
              (firstCell.v === 'Academic Year' || 
              firstCell.v === 'Academic Year' || 
              firstCell.v?.toString().includes('Academic'))) {
            headerRowIndex = row;
            break;
          }
        }
        
        // Get headers from the identified header row
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cell = worksheet[XLSX.utils.encode_cell({ r: headerRowIndex, c: col })];
          if (cell && cell.v) {
            headers.push(cell.v.toString().trim());
          } else {
            headers.push('');
          }
        }
        
        // Get data rows (from after header row)
        const dataRows: any[] = [];
        for (let row = headerRowIndex + 1; row <= range.e.r; row++) {
          const rowData: any = {};
          let hasData = false;
          
          for (let col = 0; col < headers.length; col++) {
            const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
            const value = cell ? cell.v : '';
            
            if (value && value.toString().trim() !== '') {
              hasData = true;
            }
            
            // Map only valid headers (skip __EMPTY, _List, etc.)
            const header = headers[col];
            if (header && !header.includes('_List') && header !== '__EMPTY' && header !== '__EMPTY_1') {
              rowData[header] = value;
            }
          }
          
          // Only add if row has data
          if (hasData) {
            dataRows.push(rowData);
          }
        }
        
        console.log('Headers found:', headers);
        console.log('Data rows found:', dataRows.length);
        
        // Further filter: remove rows that are list headers
        const filteredData = dataRows.filter((row: any) => {
          // Check if row has valid data
          return row['Class'] && 
                row['Class'].trim() !== '' && 
                !row['Class'].includes('_List') &&
                !row['Class'].includes('Academic_Year') &&
                typeof row['Class'] === 'string';
        });
        
        console.log('Filtered data rows:', filteredData.length);
        
        if (filteredData.length === 0) {
          toast.error('No valid data found in the file. Please check the format.');
          return;
        }
        
        setImportData(filteredData);
        setImportPreview(filteredData.slice(0, 5));
        setIsImportModalOpen(true);
        
      } catch (error) {
        console.error('File read error:', error);
        toast.error('Failed to read file');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processImport = async () => {
    setImporting(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    // Process each row from importData
    for (let i = 0; i < importData.length; i++) {
      const row = importData[i];
      const rowNum = i + 2;

      try {
        // Skip rows that are list headers or empty
        if (!row['Class'] || 
            row['Class'].toString().trim() === '' ||
            row['Class'].toString().includes('_List') ||
            row['Class'].toString().includes('Academic_Year') ||
            row['Class'].toString() === 'Class_List') {
          continue;
        }

        // Skip if fee head is list header
        if (row['Fee Head'] && row['Fee Head'].toString().includes('_List')) {
          continue;
        }

        // Validate and get Academic Year (optional)
        let academicYearId = null;
        if (row['Academic Year'] && row['Academic Year'].toString().trim() !== '') {
          const academicYearItem = academicYears.find(y => y.label === row['Academic Year']);
          if (!academicYearItem) {
            errors.push({ row: rowNum, error: `Academic year not found: ${row['Academic Year']}` });
            errorCount++;
            continue;
          }
          academicYearId = academicYearItem.value;
        }

        // Validate and get Class
        const classItem = classes.find(c => c.name === row['Class']);
        if (!classItem) {
          errors.push({ row: rowNum, error: `Class not found: ${row['Class']}` });
          errorCount++;
          continue;
        }

        // Validate and get Fee Head
        const feeHeadItem = feeHeads.find(f => f.label === row['Fee Head']);
        if (!feeHeadItem) {
          errors.push({ row: rowNum, error: `Fee head not found: ${row['Fee Head']}` });
          errorCount++;
          continue;
        }

        // Validate Amount
        const amount = parseFloat(row['Amount (₹)']);
        if (isNaN(amount) || amount < 10 || amount > 99999999) {
          errors.push({ row: rowNum, error: `Invalid amount: ${row['Amount (₹)']}` });
          errorCount++;
          continue;
        }

        // Validate and get Frequency
        const frequencyItem = frequencies.find(f => f.label === row['Frequency']);
        if (!frequencyItem) {
          errors.push({ row: rowNum, error: `Frequency not found: ${row['Frequency']}` });
          errorCount++;
          continue;
        }

        // Parse Due Date
        let dueDate = null;
        if (row['Due Date'] && row['Due Date'].toString().trim() !== '') {
          try {
            let dateStr = row['Due Date'].toString();
            if (dateStr.includes('/')) {
              const parts = dateStr.split('/');
              if (parts.length === 3) {
                dueDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
              }
            } else {
              dueDate = dateStr;
            }
          } catch (e) {
            dueDate = row['Due Date'];
          }
        }

        // Parse Late Fee
        let lateFeeAmount = 0;
        if (row['Late Fee (₹)'] && row['Late Fee (₹)'].toString().trim() !== '') {
          lateFeeAmount = parseFloat(row['Late Fee (₹)']);
          if (isNaN(lateFeeAmount)) {
            lateFeeAmount = 0;
          }
        }

        // Parse Optional Fee
        let isOptional = 0;
        if (row['Optional Fee'] && row['Optional Fee'].toString().trim() !== '') {
          isOptional = row['Optional Fee'].toString().toLowerCase() === 'yes' ? 1 : 0;
        }

        // Parse Active
        let isActive = 1;
        if (row['Active'] && row['Active'].toString().trim() !== '') {
          isActive = row['Active'].toString().toLowerCase() === 'yes' ? 1 : 0;
        }

        const submitData = {
          academic_year_id: academicYearId,
          class_id: classItem.id,
          fee_head: feeHeadItem.value,
          amount: amount,
          frequency: frequencyItem.value,
          due_date: dueDate,
          late_fee_amount: lateFeeAmount,
          is_optional: isOptional,
          is_active: isActive,
        };

        console.log(`Importing row ${rowNum}:`, submitData);
        
        const response = await api.post('/school/fee-structures', submitData);
        if (response.data.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push({ row: rowNum, error: response.data.message || 'Import failed' });
        }
        
      } catch (error: any) {
        errorCount++;
        errors.push({ row: rowNum, error: error.response?.data?.message || error.message });
      }
    }

    if (successCount > 0) {
      toast.success(`✅ ${successCount} record(s) imported successfully!`);
    }
    if (errorCount > 0) {
      toast.error(`❌ ${errorCount} record(s) failed.`);
      console.error('Import errors:', errors);
    }
    
    setIsImportModalOpen(false);
    
    if (successCount > 0) {
      fetchFeeStructures();
    }
    
    setImporting(false);
  };

  const downloadErrorReport = async () => {
    if (!importResult || !importResult.errors || Object.keys(importResult.errors).length === 0) {
      toast.error('No errors to report');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Import Errors');

      // Set column headers
      worksheet.columns = [
        { header: 'Row Number', key: 'row_number', width: 12 },
        { header: 'Academic Year', key: 'academic_year', width: 18 },
        { header: 'Class', key: 'class', width: 15 },
        { header: 'Fee Head', key: 'fee_head', width: 25 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'Frequency', key: 'frequency', width: 15 },
        { header: 'Due Date', key: 'due_date', width: 12 },
        { header: 'Late Fee', key: 'late_fee', width: 12 },
        { header: 'Optional Fee', key: 'optional', width: 14 },
        { header: 'Active', key: 'active', width: 10 },
        { header: 'Error Details', key: 'error_details', width: 40 },
      ];

      // Add data rows with errors
      Object.entries(importResult.errors).forEach(([rowNum, errorData]: [string, any]) => {
        const rowData = errorData.row_data;
        const errorMessages = errorData.errors.join('; ');

        const row = worksheet.addRow({
          row_number: rowNum,
          academic_year: rowData['academic_year_label'] || '',
          class: rowData['class_name'] || '',
          fee_head: rowData['fee_head_label'] || '',
          amount: rowData['amount'] || '',
          frequency: rowData['frequency_label'] || '',
          due_date: rowData['due_date'] || '',
          late_fee: rowData['late_fee_amount'] || '',
          optional: rowData['optional_fee'] || '',
          active: rowData['is_active'] || '',
          error_details: errorMessages,
        });

        // Style error row - red background for error column
        row.cells[10].fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF0000' },
          bgColor: { argb: 'FF0000' }
        };
        row.cells[10].font = { color: { argb: 'FFFFFFFF' }, bold: true };
      });

      // Style header row
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD32F2F' }
      };
      worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

      // Add summary sheet
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 20 },
        { header: 'Value', key: 'value', width: 15 },
      ];

      summarySheet.addRow({ metric: 'Total Records', value: importResult.total_count });
      summarySheet.addRow({ metric: 'Successfully Imported', value: importResult.imported_count });
      summarySheet.addRow({ metric: 'Failed Records', value: importResult.error_count });
      summarySheet.addRow({ metric: 'Success Rate', value: `${((importResult.imported_count / importResult.total_count) * 100).toFixed(2)}%` });

      // Style summary sheet
      summarySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' }
      };
      summarySheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

      // Write to buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `import_errors_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast.success('Error report downloaded!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate error report');
    }
  };

  const getFeeHeadLabel = (feeHeadId: number | string | any) => {
    if (feeHeadId && typeof feeHeadId === 'object') {
      return feeHeadId.m_name || feeHeadId.name || `Fee Head ${feeHeadId.m_id ?? feeHeadId.id ?? ''}`;
    }

    const feeHead = feeHeads.find(f => f.value === feeHeadId || f.value?.toString() === feeHeadId?.toString());
    return feeHead?.label || `Fee Head ${feeHeadId}`;
  };

  const getFrequencyLabel = (frequencyId: number) => {
    const frequency = frequencies.find(f => f.value === frequencyId);
    return frequency?.label || `Frequency ${frequencyId}`;
  };

  const getClassName = (classId: number) => {
    const classItem = classes.find(c => c.id === classId);
    return classItem?.name || `Class ${classId}`;
  };

  const getAcademicYearLabel = (academicYearId: number | null) => {
    if (!academicYearId) return 'N/A';
    const year = academicYears.find(y => y.value === academicYearId);
    return year?.label || `Year ${academicYearId}`;
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

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const customSelectStyles = {
    control: (base: any) => ({
      ...base,
      borderRadius: '0.5rem',
      borderColor: '#d1d5db',
      minHeight: '34px',
      boxShadow: 'none',
      '&:hover': { borderColor: '#9ca3af' },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? '#eff6ff' : 'white',
      color: '#1f2937',
      cursor: 'pointer',
    }),
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
    <div className="-mx-6 -mt-6">
      <div className="px-3 pt-3 pb-3">
      </div>
      {/* Action Buttons, Search and Show per page - ALL IN ONE ROW */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-4">
        {/* Left side: Search and Show */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Search:</span>
            <input
              type="text"
              placeholder="Class, Fee Head or Academic Year..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                const value = e.target.value === 'all' ? -1 : Number(e.target.value);
                setItemsPerPage(value);
                setCurrentPage(1);
              }}
              className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="all">All</option>
            </select>
          </div>
          {(searchTerm || filterAcademicYear || filterClass || filterFeeHead || filterStatus) && (
            <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700">Clear Filters ✕</button>
          )}
        </div>

        {/* Right side: Action Buttons */}
        <div className="flex items-center gap-2">
          <button onClick={downloadSampleFile} className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Sample
          </button>
          <label className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-700 transition cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Import
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
          </label>
          <button onClick={handleExport} className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-700 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
            Export
          </button>
          <button onClick={openAddModal} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-700 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add New
          </button>
        </div>
      </div>

      {/* Filters - Searchable Dropdowns (No title) */}
      <div className="flex items-center gap-2 px-6 pb-4">
        <SearchableSelect
          options={academicYearSelectOptions}
          value={filterAcademicYear}
          onChange={setFilterAcademicYear}
          placeholder="Academic Years"
        />
        <SearchableSelect
          options={classSelectOptions}
          value={filterClass}
          onChange={setFilterClass}
          placeholder="Classes"
        />
        <SearchableSelect
          options={feeHeadSelectOptions}
          value={filterFeeHead}
          onChange={setFilterFeeHead}
          placeholder="Fee Heads"
        />
        <SearchableSelect
          options={statusSelectOptions}
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="Status"
        />
      </div>

      {/* Bulk Actions Bar */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-blue-800 font-medium">
            {selectedItems.size} item(s) selected
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatusUpdate(true)}
              disabled={bulkUpdating}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {bulkUpdating ? 'Updating...' : 'Active'}
            </button>
            <button
              onClick={() => handleBulkStatusUpdate(false)}
              disabled={bulkUpdating}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {bulkUpdating ? 'Updating...' : 'Inactive'}
            </button>
            <button
              onClick={() => setSelectedItems(new Set())}
              className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Table - Full width */}
      <div className="overflow-x-auto border-y border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left w-10">
                <input
                  type="checkbox"
                  checked={selectedItems.size === paginatedData.length && paginatedData.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded w-4 h-4"
                />
              </th>
              <th className="px-3 py-2 text-left text-[14px] font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('academic_year_label')}>
                Academic Year {getSortIcon('academic_year_label')}
              </th>
              <th className="px-3 py-2 text-left text-[14px] font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('class_name')}>
                Class {getSortIcon('class_name')}
              </th>
              <th className="px-3 py-2 text-left text-[14px] font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('fee_head_label')}>
                Fee Head {getSortIcon('fee_head_label')}
              </th>
              <th className="px-3 py-2 text-left text-[14px] font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('amount')}>
                Amount {getSortIcon('amount')}
              </th>
              <th className="px-3 py-2 text-left text-[14px] font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('frequency_label')}>
                Frequency {getSortIcon('frequency_label')}
              </th>
              <th className="px-3 py-2 text-left text-[14px] font-semibold text-gray-700">Due Date</th>
              <th className="px-3 py-2 text-left text-[14px] font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('is_active')}>
                Status {getSortIcon('is_active')}
              </th>
              <th className="px-3 py-2 text-left text-[14px] font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[12px]">No fee structures found</p>
                    <button onClick={openAddModal} className="mt-2 text-blue-600 hover:text-blue-700 font-medium text-[12px]">Click here to add</button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${selectedItems.has(item.id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectRow(item.id)}
                      className="rounded w-4 h-4"
                    />
                  </td>
                  <td className="px-3 py-2 text-gray-700 text-[12px]">{getAcademicYearLabel(item.academic_year_id)}</td>
                  <td className="px-3 py-2 text-gray-700 font-medium text-[12px]">{getClassName(item.class_id)}</td>
                  <td className="px-3 py-2 text-gray-700 text-[12px]">{getFeeHeadLabel(item.fee_head)}</td>
                  <td className="px-3 py-2 text-gray-800 font-semibold text-[12px]">₹{formatAmount(item.amount)}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 text-[11px] bg-blue-100 text-blue-800 rounded-full">
                      {getFrequencyLabel(item.frequency)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-700 text-[12px]">{formatDisplayDate(item.due_date) || '-'}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(item.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                          item.is_active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        title={item.is_active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            item.is_active ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                      <span className={`text-[11px] font-medium ${item.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEditModal(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition" title="Edit">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(item.id, `${getClassName(item.class_id)} - ${getFeeHeadLabel(item.fee_head)}`)} className="p-1 text-red-600 hover:bg-red-50 rounded transition" title="Delete">
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

      {/* Pagination - Right Corner */}
      {totalPages > 1 && itemsPerPage !== -1 && (
        <div className="flex justify-end items-center px-6 py-4 gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 text-sm"
          >
            «
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 text-sm"
          >
            ‹
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 text-sm"
          >
            ›
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 text-sm"
          >
            »
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 rounded-t-xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">
                  {editingItem ? 'Edit Fee Structure' : 'Add Fee Structure'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white hover:bg-white/20 rounded-lg p-1 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year <span className="text-red-500">*</span></label>
                  <Select options={academicYearSelectOptions} value={academicYearSelectOptions.find(opt => opt.value === formData.academic_year_id)} onChange={(selected) => handleSelectChange('academic_year_id', selected)} placeholder="Select academic year..." styles={customSelectStyles} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class <span className="text-red-500">*</span></label>
                  <Select options={classSelectOptions} value={classSelectOptions.find(opt => opt.value === formData.class_id)} onChange={(selected) => handleSelectChange('class_id', selected)} placeholder="Select class..." styles={customSelectStyles} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Head <span className="text-red-500">*</span></label>
                  <Select options={feeHeadSelectOptions} value={feeHeadSelectOptions.find(opt => opt.value === formData.fee_head)} onChange={(selected) => handleSelectChange('fee_head', selected)} placeholder="Select fee head..." styles={customSelectStyles} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) <span className="text-red-500">*</span><span className="text-gray-400 text-xs ml-1">(2-8 digits)</span></label>
                  <input type="number" name="amount" value={formData.amount || ''} onChange={handleInputChange} min="10" max="99999999" step="1" className={`w-full px-3 py-2 border rounded-lg ${errors.amount ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} required />
                  {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency <span className="text-red-500">*</span></label>
                  <Select options={frequencySelectOptions} value={frequencySelectOptions.find(opt => opt.value === formData.frequency)} onChange={(selected) => handleSelectChange('frequency', selected)} placeholder="Select frequency..." styles={customSelectStyles} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-gray-400 text-xs">(Optional)</span></label>
                  <input type="date" name="due_date" value={formData.due_date} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Late Fee (₹) <span className="text-gray-400 text-xs">(Optional, 2-6 digits)</span></label>
                  <input type="number" name="late_fee_amount" value={formData.late_fee_amount || ''} onChange={handleInputChange} min="10" max="999999" step="1" className={`w-full px-3 py-2 border rounded-lg ${errors.late_fee_amount ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                  {errors.late_fee_amount && <p className="text-red-500 text-xs mt-1">{errors.late_fee_amount}</p>}
                </div>
                <div className="space-y-3 pt-2">
                  <ToggleSwitch checked={formData.is_optional} onChange={(checked) => setFormData(prev => ({ ...prev, is_optional: checked }))} label="Optional Fee" />
                  <ToggleSwitch checked={formData.is_active} onChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))} label="Active" />
                </div>
              </form>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0 bg-gray-50 rounded-b-xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm">Cancel</button>
              <button type="submit" onClick={handleSubmit} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                {editingItem ? 'Update' : 'Add'} Fee Structure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Preview & Progress Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 rounded-t-xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">
                  {showImportResult ? 'Import Results' : 'Import Fee Structures'}
                </h3>
                <button 
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setShowImportResult(false);
                  }} 
                  className="text-white hover:bg-white/20 rounded-lg p-1 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {!showImportResult ? (
                <>
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Total Records:</strong> {importData.length} | <strong>Preview (First 5 rows):</strong>
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          {importPreview.length > 0 && Object.keys(importPreview[0]).map((key, idx) => (
                            <th key={idx} className="px-3 py-2 text-left border">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((row, idx) => (
                          <tr key={idx} className="border-t hover:bg-gray-50">
                            {Object.values(row).map((val: any, colIdx) => (
                              <td key={colIdx} className="px-3 py-2 border">{val}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {importing && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700">Processing Import...</p>
                        <span className="text-sm font-bold text-blue-600">{importProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${importProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Import Result Summary */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                      <p className="text-xs text-gray-600 font-medium">Total Records</p>
                      <p className="text-2xl font-bold text-blue-600 mt-1">{importResult?.total_count || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                      <p className="text-xs text-gray-600 font-medium">Successfully Imported</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">{importResult?.imported_count || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                      <p className="text-xs text-gray-600 font-medium">Failed Records</p>
                      <p className="text-2xl font-bold text-red-600 mt-1">{importResult?.error_count || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                      <p className="text-xs text-gray-600 font-medium">Success Rate</p>
                      <p className="text-2xl font-bold text-purple-600 mt-1">
                        {importResult?.total_count ? ((importResult?.imported_count / importResult?.total_count) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Error Details */}
                  {importResult?.error_count > 0 && (
                    <>
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 font-medium">
                          ⚠️ {importResult?.error_count} record(s) had errors. Click the button below to download the error report.
                        </p>
                      </div>
                    </>
                  )}

                  {importResult?.imported_count > 0 && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">
                        ✓ {importResult?.imported_count} record(s) imported successfully!
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0 bg-gray-50 rounded-b-xl">
              {showImportResult ? (
                <>
                  {importResult?.error_count > 0 && (
                    <button
                      onClick={downloadErrorReport}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Error Report
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsImportModalOpen(false);
                      setShowImportResult(false);
                      setImportResult(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsImportModalOpen(false)}
                    disabled={importing}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={processImport}
                    disabled={importing}
                    className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 transition"
                  >
                    {importing ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Importing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Confirm Import
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeStructureManager;