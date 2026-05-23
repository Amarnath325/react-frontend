import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';
import * as XLSX from 'xlsx';

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
      className="w-44 text-sm"
      classNamePrefix="react-select"
      styles={{
        control: (base) => ({
          ...base,
          borderRadius: '0.5rem',
          borderColor: '#d1d5db',
          minHeight: '34px',
          boxShadow: 'none',
          '&:hover': { borderColor: '#9ca3af' },
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isFocused ? '#eff6ff' : 'white',
          color: '#1f2937',
          cursor: 'pointer',
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
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

  const downloadSampleFile = () => {
    try {
      // Get dynamic values from state
      const academicYearValues = academicYears.length > 0 ? academicYears.map(y => y.label) : ['2024-2025', '2025-2026', '2026-2027'];
      const classValues = classes.length > 0 ? classes.map(c => c.name) : ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
      const feeHeadValues = feeHeads.length > 0 ? feeHeads.map(f => f.label) : ['Admission Fee', 'Tuition Fee', 'Annual Fee', 'Examination Fee', 'Transport Fee', 'Hostel Fee', 'Library Fee'];
      const frequencyValues = frequencies.length > 0 ? frequencies.map(f => f.label) : ['Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'One Time'];
      const optionalValues = ['Yes', 'No'];
      const activeValues = ['Yes', 'No'];

      // Create data with sample rows
      const data = [
        ['Academic Year', 'Class', 'Fee Head', 'Amount (₹)', 'Frequency', 'Due Date', 'Late Fee (₹)', 'Optional Fee', 'Active'],
        [academicYearValues[0], classValues[0], feeHeadValues[0], 5000, frequencyValues[0], '2024-07-10', 100, 'No', 'Yes'],
        [academicYearValues[0], classValues[0], feeHeadValues[0], 10000, frequencyValues[0], '2024-06-15', 200, 'Yes', 'Yes'],
      ];

      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 18 }, // Academic Year
        { wch: 15 }, // Class
        { wch: 25 }, // Fee Head
        { wch: 12 }, // Amount
        { wch: 15 }, // Frequency
        { wch: 12 }, // Due Date
        { wch: 12 }, // Late Fee
        { wch: 14 }, // Optional Fee
        { wch: 10 }, // Active
      ];

      // Create Excel with data validation (dropdowns)
      // Note: XLSX library doesn't support data validation perfectly, 
      // but we create the structure that Excel will recognize
      
      // Add data validation ranges in a separate hidden sheet approach
      // Create hidden sheet for dropdown lists
      const listData = [
        ['Academic_Year_List', 'Class_List', 'Fee_Head_List', 'Frequency_List', 'Optional_List', 'Active_List'],
        ...academicYearValues.map(y => [y, '', '', '', '', '']),
      ];
      
      // Fill class values
      for (let i = 0; i < classValues.length; i++) {
        if (!listData[i + 1]) listData[i + 1] = [];
        listData[i + 1][1] = classValues[i];
      }
      
      // Fill fee head values
      for (let i = 0; i < feeHeadValues.length; i++) {
        if (!listData[i + 1]) listData[i + 1] = [];
        listData[i + 1][2] = feeHeadValues[i];
      }
      
      // Fill frequency values
      for (let i = 0; i < frequencyValues.length; i++) {
        if (!listData[i + 1]) listData[i + 1] = [];
        listData[i + 1][3] = frequencyValues[i];
      }
      
      // Fill optional values
      for (let i = 0; i < optionalValues.length; i++) {
        if (!listData[i + 1]) listData[i + 1] = [];
        listData[i + 1][4] = optionalValues[i];
      }
      
      // Fill active values
      for (let i = 0; i < activeValues.length; i++) {
        if (!listData[i + 1]) listData[i + 1] = [];
        listData[i + 1][5] = activeValues[i];
      }

      const wsList = XLSX.utils.aoa_to_sheet(listData);
      wsList['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 10 }];

      // Create workbook with hidden sheet for lists
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Fee Structure');
      XLSX.utils.book_append_sheet(wb, wsList, '__HiddenList__');
      
      // Hide the list sheet (Excel will hide it)
      if (wb.Workbook) {
        wb.Workbook.Sheets = wb.Workbook.Sheets || {};
        wb.Workbook.Sheets['__HiddenList__'] = { state: 'hidden' };
      }

      XLSX.writeFile(wb, 'sample_fee_structures.xlsx');
      toast.success('Sample file downloaded!');
      toast('Excel file contains dropdown lists. Use the dropdown arrows in each cell.');
      
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
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        setImportData(jsonData);
        setImportPreview(jsonData.slice(0, 5));
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
    const errors: string[] = [];

    for (const row of importData) {
      try {
        // Find Academic Year ID from label
        const academicYearItem = academicYears.find(y => y.label === row['Academic Year']);
        if (!academicYearItem) {
          errors.push(`Academic year not found: ${row['Academic Year']}`);
          errorCount++;
          continue;
        }

        // Find Class ID from name
        const classItem = classes.find(c => c.name === row['Class']);
        if (!classItem) {
          errors.push(`Class not found: ${row['Class']}`);
          errorCount++;
          continue;
        }

        // Find Fee Head ID from label
        const feeHeadItem = feeHeads.find(f => f.label === row['Fee Head']);
        if (!feeHeadItem) {
          errors.push(`Fee head not found: ${row['Fee Head']}`);
          errorCount++;
          continue;
        }

        // Find Frequency ID from label
        const frequencyItem = frequencies.find(f => f.label === row['Frequency']);
        if (!frequencyItem) {
          errors.push(`Frequency not found: ${row['Frequency']}`);
          errorCount++;
          continue;
        }

        const submitData = {
          academic_year_id: academicYearItem.value,
          class_id: classItem.id,
          fee_head: feeHeadItem.value,
          amount: parseFloat(row['Amount (₹)']),
          frequency: frequencyItem.value,
          due_date: row['Due Date'] || null,
          late_fee_amount: parseFloat(row['Late Fee (₹)']) || 0,
          // Convert Yes/No to 1/0
          is_optional: row['Optional Fee']?.toLowerCase() === 'yes' ? 1 : 0,
          is_active: row['Active']?.toLowerCase() === 'yes' ? 1 : 0,
        };

        console.log('Importing data:', submitData);
        
        const response = await api.post('/school/fee-structures', submitData);
        if (response.data.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push(`Failed to import: ${row['Class']} - ${row['Fee Head']}`);
        }
      } catch (error: any) {
        errorCount++;
        errors.push(`Error importing: ${row['Class']} - ${row['Fee Head']}`);
      }
    }

    toast.success(`Import completed: ${successCount} success, ${errorCount} failed`);
    if (errors.length > 0) {
      console.error('Import errors:', errors);
      toast.error(`${errors.length} errors occurred. Check console for details.`);
    }
    
    setIsImportModalOpen(false);
    fetchFeeStructures();
    setImporting(false);
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
          <button onClick={openAddModal} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add New
          </button>
          <button onClick={downloadSampleFile} className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Sample
          </button>
          <label className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Import
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
          </label>
          <button onClick={handleExport} className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
            Export
          </button>
        </div>
      </div>

      {/* Filters - Searchable Dropdowns (No title) */}
      <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
        <SearchableSelect
          options={academicYearSelectOptions}
          value={filterAcademicYear}
          onChange={setFilterAcademicYear}
          placeholder="All Academic Years"
        />
        <SearchableSelect
          options={classSelectOptions}
          value={filterClass}
          onChange={setFilterClass}
          placeholder="All Classes"
        />
        <SearchableSelect
          options={feeHeadSelectOptions}
          value={filterFeeHead}
          onChange={setFilterFeeHead}
          placeholder="All Fee Heads"
        />
        <SearchableSelect
          options={statusSelectOptions}
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="All Status"
        />
      </div>

      {/* Table - Full width */}
      <div className="overflow-x-auto border-y border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('academic_year_label')}>
                Academic Year {getSortIcon('academic_year_label')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('class_name')}>
                Class {getSortIcon('class_name')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('fee_head_label')}>
                Fee Head {getSortIcon('fee_head_label')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('amount')}>
                Amount {getSortIcon('amount')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('frequency_label')}>
                Frequency {getSortIcon('frequency_label')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Due Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('is_active')}>
                Status {getSortIcon('is_active')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>No fee structures found</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-700">{getAcademicYearLabel(item.academic_year_id)}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{getClassName(item.class_id)}</td>
                  <td className="px-4 py-3 text-gray-700">{getFeeHeadLabel(item.fee_head)}</td>
                  <td className="px-4 py-3 text-gray-800 font-semibold">₹{formatAmount(item.amount)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {getFrequencyLabel(item.frequency)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{formatDisplayDate(item.due_date) || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditModal(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(item.id, `${getClassName(item.class_id)} - ${getFeeHeadLabel(item.fee_head)}`)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

      {/* Import Preview Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 rounded-t-xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Import Fee Structures</h3>
                <button onClick={() => setIsImportModalOpen(false)} className="text-white hover:bg-white/20 rounded-lg p-1 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800"><strong>Total Records:</strong> {importData.length} | <strong>Preview (First 5 rows):</strong></p>
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
                      <tr key={idx} className="border-t">
                        {Object.values(row).map((val: any, colIdx) => (
                          <td key={colIdx} className="px-3 py-2 border">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0 bg-gray-50 rounded-b-xl">
              <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
              <button onClick={processImport} disabled={importing} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">
                {importing ? 'Importing...' : 'Confirm Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeStructureManager;