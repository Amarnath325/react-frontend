import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import Select from 'react-select';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface Vehicle {
  id: number;
  school_id: number;
  academic_year_id: number | null;
  vehicle_number: string;
  vehicle_type: string;
  model: string | null;
  year: number | null;
  capacity: number;
  registration_number: string | null;
  driver_name: string | null;
  driver_contact: string | null;
  insurance_valid_till: string | null;
  fitness_valid_till: string | null;
  status: 'Active' | 'Inactive' | 'Maintenance';
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// Premium theme styling for react-select matching our system's Tailwind design
const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.375rem', // rounded-md
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb', // blue-500 or gray-200
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.15)' : 'none',
    minHeight: '34px',
    height: '34px',
    backgroundColor: '#ffffff',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    },
    transition: 'all 0.15s ease',
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 10px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0',
    padding: '0',
    fontSize: '12px',
    color: '#111827',
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: '12px',
    color: '#9ca3af',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '12px',
    color: '#111827',
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: '32px',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#2563eb'
      : state.isFocused
        ? '#f3f4f6'
        : 'transparent',
    color: state.isSelected ? '#ffffff' : '#374151',
    fontSize: '12px',
    padding: '6px 10px',
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
};

const compactSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.375rem', // rounded-md
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.15)' : 'none',
    minHeight: '28px',
    height: '28px',
    backgroundColor: '#ffffff',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    },
    transition: 'all 0.15s ease',
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 8px',
    height: '28px',
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
    padding: '5px 8px',
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
  className = "",
  compact = false,
}) => {
  const selectedOption = options.find(opt => String(opt.value) === String(value)) || null;

  return (
    <div className={className}>
      <Select
        options={options}
        value={selectedOption}
        onChange={(selected) => onChange(selected ? String(selected.value) : '')}
        placeholder={placeholder}
        isClearable={isClearable}
        styles={compact ? compactSelectStyles : customSelectStyles}
        className={compact ? "text-[11px]" : "text-[12px]"}
      />
    </div>
  );
};

// Toggle Switch Component (Compact size - matches Show Trashed switch size)
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

const VehicleManager: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredData, setFilteredData] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Vehicle | null>(null);

  // Filters
  const [showTrashed, setShowTrashed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Bulk Selection states
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Excel Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: 'Bus',
    model: '',
    year: '',
    capacity: '40',
    registration_number: '',
    driver_name: '',
    driver_contact: '',
    insurance_valid_till: '',
    fitness_valid_till: '',
    status: 'Active' as 'Active' | 'Inactive' | 'Maintenance',
  });

  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);

  useEffect(() => {
    fetchVehicles();
  }, [showTrashed]);

  const fetchVehicleTypes = async () => {
    try {
      const response = await api.get('/school/vehicle-types', {
        params: { status: 'active' }
      });
      if (response.data.success) {
        setVehicleTypes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicle types:', error);
    }
  };

  // Inline vehicle type creation states
  const [isAddingType, setIsAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [creatingType, setCreatingType] = useState(false);

  const handleCreateVehicleType = async () => {
    if (!newTypeName.trim()) {
      toast.error('Vehicle type name is required');
      return;
    }

    setCreatingType(true);
    try {
      const response = await api.post('/school/vehicle-types', {
        name: newTypeName.trim(),
        is_active: true
      });
      if (response.data.success) {
        toast.success('Vehicle type created successfully');
        await fetchVehicleTypes();
        setFormData(prev => ({ ...prev, vehicle_type: response.data.data.name }));
        setIsAddingType(false);
        setNewTypeName('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create vehicle type');
    } finally {
      setCreatingType(false);
    }
  };

  useEffect(() => {
    fetchVehicleTypes();
  }, []);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [vehicles, searchTerm, filterType, filterStatus, sortColumn, sortDirection]);

  useEffect(() => {
    setSelectedItems(new Set());
  }, [searchTerm, filterType, filterStatus, showTrashed, currentPage, itemsPerPage]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/school/vehicles', {
        params: { only_trashed: showTrashed }
      });
      if (response.data.success) {
        setVehicles(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...vehicles];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.vehicle_number.toLowerCase().includes(lowerSearch) ||
        (item.model && item.model.toLowerCase().includes(lowerSearch)) ||
        (item.driver_name && item.driver_name.toLowerCase().includes(lowerSearch)) ||
        (item.registration_number && item.registration_number.toLowerCase().includes(lowerSearch))
      );
    }

    if (filterType) {
      filtered = filtered.filter(item => item.vehicle_type === filterType);
    }

    if (filterStatus) {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof Vehicle] ?? '';
      let bVal: any = b[sortColumn as keyof Vehicle] ?? '';

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
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
    setFilterType('');
    setFilterStatus('');
  };

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = itemsPerPage === -1
    ? filteredData
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    setIsAddingType(false);
    setNewTypeName('');
    setFormData({
      vehicle_number: '',
      vehicle_type: vehicleTypes[0]?.name || '',
      model: '',
      year: new Date().getFullYear().toString(),
      capacity: '40',
      registration_number: '',
      driver_name: '',
      driver_contact: '',
      insurance_valid_till: '',
      fitness_valid_till: '',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Vehicle) => {
    setEditingItem(item);
    setIsAddingType(false);
    setNewTypeName('');
    
    const formatInputDate = (dateStr: string | null) => {
      if (!dateStr) return '';
      return dateStr.split('T')[0];
    };

    setFormData({
      vehicle_number: item.vehicle_number,
      vehicle_type: item.vehicle_type,
      model: item.model || '',
      year: item.year ? item.year.toString() : '',
      capacity: item.capacity.toString(),
      registration_number: item.registration_number || '',
      driver_name: item.driver_name || '',
      driver_contact: item.driver_contact || '',
      insurance_valid_till: formatInputDate(item.insurance_valid_till),
      fitness_valid_till: formatInputDate(item.fitness_valid_till),
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vehicle_number) {
      toast.error('Vehicle number is required');
      return;
    }
    if (!formData.capacity) {
      toast.error('Capacity is required');
      return;
    }

    try {
      const submitData = {
        vehicle_number: formData.vehicle_number,
        vehicle_type: formData.vehicle_type,
        model: formData.model || null,
        year: formData.year ? parseInt(formData.year) : null,
        capacity: parseInt(formData.capacity),
        registration_number: formData.registration_number || null,
        driver_name: formData.driver_name || null,
        driver_contact: formData.driver_contact || null,
        insurance_valid_till: formData.insurance_valid_till || null,
        fitness_valid_till: formData.fitness_valid_till || null,
        status: formData.status,
      };

      if (editingItem) {
        const response = await api.put(`/school/vehicles/${editingItem.id}`, submitData);
        if (response.data.success) {
          toast.success('Vehicle updated successfully');
        }
      } else {
        const response = await api.post('/school/vehicles', submitData);
        if (response.data.success) {
          toast.success('Vehicle created successfully');
        }
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number, number: string) => {
    const action = showTrashed ? 'permanently delete' : 'delete';
    if (window.confirm(`Are you sure you want to ${action} vehicle "${number}"?`)) {
      try {
        let response;
        if (showTrashed) {
          response = await api.delete(`/school/vehicles/${id}/force`);
        } else {
          response = await api.delete(`/school/vehicles/${id}`);
        }
        if (response.data.success) {
          toast.success(`Vehicle ${showTrashed ? 'permanently deleted' : 'deleted'} successfully`);
          fetchVehicles();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await api.patch(`/school/vehicles/${id}/toggle-status`);
      if (response.data.success) {
        toast.success('Vehicle status updated');
        fetchVehicles();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleRestore = async (id: number) => {
    if (!window.confirm('Are you sure you want to restore this vehicle?')) return;
    try {
      const response = await api.post(`/school/vehicles/${id}/restore`);
      if (response.data.success) {
        toast.success('Vehicle restored successfully');
        fetchVehicles();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore vehicle');
    }
  };

  // Bulk Actions
  const handleSelectItem = (id: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const ids = paginatedData.map(item => item.id);
      setSelectedItems(new Set(ids));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleBulkStatusUpdate = async (status: 'Active' | 'Inactive' | 'Maintenance') => {
    setBulkUpdating(true);
    const ids = Array.from(selectedItems);

    try {
      const response = await api.post('/school/vehicles/bulk-status', {
        status: status,
        ids: ids
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Status updated successfully');
        setSelectedItems(new Set());
        fetchVehicles();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    const confirmMessage = showTrashed
      ? `Are you sure you want to permanently delete ${selectedItems.size} selected vehicle(s)? This action cannot be undone.`
      : `Are you sure you want to delete ${selectedItems.size} selected vehicle(s)?`;

    if (window.confirm(confirmMessage)) {
      setBulkUpdating(true);
      const ids = Array.from(selectedItems);

      try {
        const response = await api.post('/school/vehicles/bulk-delete', {
          ids: ids,
          force: showTrashed
        });
        if (response.data.success) {
          toast.success(response.data.message || 'Deleted successfully');
          setSelectedItems(new Set());
          fetchVehicles();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete');
      } finally {
        setBulkUpdating(false);
      }
    }
  };

  const handleBulkRestore = async () => {
    if (window.confirm(`Are you sure you want to restore ${selectedItems.size} selected vehicle(s)?`)) {
      setBulkUpdating(true);
      const ids = Array.from(selectedItems);

      try {
        const response = await api.post('/school/vehicles/bulk-restore', {
          ids: ids
        });
        if (response.data.success) {
          toast.success(response.data.message || 'Restored successfully');
          setSelectedItems(new Set());
          fetchVehicles();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to restore');
      } finally {
        setBulkUpdating(false);
      }
    }
  };

  // Excel Toolkit Operations
  const handleExport = () => {
    try {
      const exportData = filteredData.map(item => ({
        'Vehicle Number': item.vehicle_number,
        'Vehicle Type': item.vehicle_type,
        'Model': item.model || '',
        'Year': item.year || '',
        'Capacity': item.capacity,
        'Registration Number': item.registration_number || '',
        'Driver Name': item.driver_name || '',
        'Driver Contact': item.driver_contact || '',
        'Insurance Expiry': item.insurance_valid_till ? item.insurance_valid_till.split('T')[0] : '',
        'Fitness Expiry': item.fitness_valid_till ? item.fitness_valid_till.split('T')[0] : '',
        'Status': item.status,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Vehicles');
      XLSX.writeFile(wb, `vehicles_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Export successful!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const downloadSampleFile = async () => {
    try {
      const typeValues = ['Bus', 'Van', 'Mini-bus', 'Auto'];
      const statusValues = ['Active', 'Inactive', 'Maintenance'];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Vehicles');

      worksheet.columns = [
        { header: 'Vehicle Number', key: 'vehicle_number', width: 20 },
        { header: 'Vehicle Type', key: 'vehicle_type', width: 15 },
        { header: 'Model', key: 'model', width: 20 },
        { header: 'Year', key: 'year', width: 10 },
        { header: 'Capacity', key: 'capacity', width: 10 },
        { header: 'Registration Number', key: 'registration_number', width: 25 },
        { header: 'Driver Name', key: 'driver_name', width: 20 },
        { header: 'Driver Contact', key: 'driver_contact', width: 15 },
        { header: 'Insurance Valid Till (YYYY-MM-DD)', key: 'insurance_valid_till', width: 25 },
        { header: 'Fitness Valid Till (YYYY-MM-DD)', key: 'fitness_valid_till', width: 25 },
        { header: 'Status', key: 'status', width: 15 },
      ];

      worksheet.addRow({
        vehicle_number: 'DL-1PA-1234',
        vehicle_type: 'Bus',
        model: 'Tata Starbus',
        year: 2024,
        capacity: 40,
        registration_number: 'RC-998877665544',
        driver_name: 'Rajesh Kumar',
        driver_contact: '+91-9876543210',
        insurance_valid_till: '2027-06-30',
        fitness_valid_till: '2028-12-15',
        status: 'Active',
      });

      worksheet.getCell('M1').value = 'Type_List';
      typeValues.forEach((val, idx) => {
        worksheet.getCell(`M${idx + 2}`).value = val;
      });
      worksheet.getCell('N1').value = 'Status_List';
      statusValues.forEach((val, idx) => {
        worksheet.getCell(`N${idx + 2}`).value = val;
      });
      worksheet.getColumn('M').hidden = true;
      worksheet.getColumn('N').hidden = true;

      for (let r = 2; r <= 500; r++) {
        worksheet.getCell(`B${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Vehicles'!$M$2:$M$5`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select from: Bus, Van, Mini-bus, Auto',
        };
        worksheet.getCell(`K${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Vehicles'!$N$2:$N$4`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select from: Active, Inactive, Maintenance',
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_vehicles.xlsx');
      toast.success('Sample template file downloaded!');
    } catch (error) {
      console.error('Error downloading sample file:', error);
      toast.error('Failed to download template file');
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
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        let headerRowIndex = -1;
        let headers: string[] = [];

        for (let i = 0; i < rows.length; i++) {
          const firstCell = rows[i][0];
          if (firstCell && (firstCell === 'Vehicle Number' || firstCell?.toString().includes('Vehicle'))) {
            headerRowIndex = i;
            headers = rows[i].map((cell: any) => cell?.toString().trim() || '');
            break;
          }
        }

        if (headerRowIndex === -1) {
          toast.error('Could not find header row (e.g. "Vehicle Number")');
          return;
        }

        const dataRows: any[] = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const firstCell = row[0];
          if (firstCell && (firstCell.toString().includes('_List') || firstCell === 'Type_List' || firstCell === 'Status_List')) {
            continue;
          }

          const hasData = row.some((cell: any) => cell && cell.toString().trim() !== '');
          if (!hasData) continue;

          const rowData: any = {};
          for (let j = 0; j < headers.length; j++) {
            const header = headers[j];
            if (header && !header.includes('_List') && header !== '__EMPTY') {
              rowData[header] = row[j]?.toString() || '';
            }
          }

          if (rowData['Vehicle Number']) {
            dataRows.push(rowData);
          }
        }

        if (dataRows.length === 0) {
          toast.error('No valid data found in sheet.');
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

  const submitImport = async () => {
    setImporting(true);
    try {
      const payload = importData.map(row => ({
        vehicle_number: row['Vehicle Number'],
        vehicle_type: row['Vehicle Type'] || 'Bus',
        model: row['Model'] || null,
        year: row['Year'] ? parseInt(row['Year']) : null,
        capacity: row['Capacity'] ? parseInt(row['Capacity']) : 40,
        registration_number: row['Registration Number'] || null,
        driver_name: row['Driver Name'] || null,
        driver_contact: row['Driver Contact'] || null,
        insurance_valid_till: row['Insurance Valid Till (YYYY-MM-DD)'] || null,
        fitness_valid_till: row['Fitness Valid Till (YYYY-MM-DD)'] || null,
        status: row['Status'] || 'Active',
      }));

      const response = await api.post('/school/vehicles/bulk-import', { data: payload });
      if (response.data.success) {
        toast.success(response.data.message || 'Import completed successfully');
        setIsImportModalOpen(false);
        fetchVehicles();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const stats = {
    total: filteredData.length,
    active: filteredData.filter(v => v.status === 'Active').length,
    maintenance: filteredData.filter(v => v.status === 'Maintenance').length,
    capacity: filteredData.reduce((sum, v) => sum + (v.capacity || 0), 0)
  };

  const formatDateDisplay = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.split('T')[0];
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const isExpiringSoon = (dateStr: string | null) => {
    if (!dateStr) return false;
    const expiry = new Date(dateStr);
    const diffTime = expiry.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  const isExpired = (dateStr: string | null) => {
    if (!dateStr) return false;
    const expiry = new Date(dateStr);
    return expiry.getTime() < new Date().getTime();
  };

  // Dropdown options for filter select
  const vehicleTypeOptions = vehicleTypes.map(t => ({
    value: t.name,
    label: t.name
  }));

  const vehicleStatusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Maintenance', label: 'Maintenance' },
  ];

  // Forms classes matching SubjectManager
  const inp = 'w-full px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';
  const lbl = 'block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500 font-medium">Loading vehicles…</p>
        </div>
      </div>
    );
  }

  const hasFilters = searchTerm || filterType || filterStatus;

  return (
    <div className="space-y-3 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2">
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">Vehicle Fleet Management</h3>
          <p className="text-[12px] text-gray-500">Monitor, register, and manage your school buses, vans, drivers, capacity details, and certificate expiries.</p>
        </div>

        {/* stats */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-400">Total</span>
            <span className="text-xs font-bold text-slate-700">{stats.total}</span>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-100/80 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-emerald-500">Active</span>
            <span className="text-xs font-bold text-emerald-700">{stats.active}</span>
          </div>
          <div className="bg-orange-50/60 border border-orange-100/80 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-orange-500">Service</span>
            <span className="text-xs font-bold text-slate-700">{stats.maintenance}</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar Area ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
        {/* Left side: Search input & filters */}
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
              placeholder="Search number, model, driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-2 py-1 w-44 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
            />
          </div>

          {/* Type filter */}
          <SearchableSelect
            options={vehicleTypeOptions}
            value={filterType}
            onChange={(val) => setFilterType(val)}
            placeholder="All Types"
            isClearable={true}
            className="w-32 text-xs"
            compact={true}
          />

          {/* Status filter */}
          <SearchableSelect
            options={vehicleStatusOptions}
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            placeholder="All Status"
            isClearable={true}
            className="w-28 text-xs"
            compact={true}
          />

          {/* Pagination limit selector */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5">
            <span className="text-[10px] text-gray-500 font-semibold uppercase"></span>
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
                className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform duration-200 ${showTrashed ? 'translate-x-[18px]' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-700 font-medium px-1"
            >
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

          {!showTrashed && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition text-xs font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add New
            </button>
          )}
        </div>
      </div>

      {/* ── Table Container ── */}
      {showTrashed && (
        <div className="bg-red-50 border-b border-red-105 px-4 py-1.5 flex items-center gap-2 text-red-700 text-xs font-medium rounded-lg">
          <svg className="w-3.5 h-3.5 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>You are viewing deleted vehicles. You can restore them or permanently delete them below.</span>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 border border-blue-250 p-2 rounded-lg flex items-center justify-between text-xs">
          <div className="text-blue-800 font-semibold">
            {selectedItems.size} item(s) selected
          </div>
          <div className="flex items-center gap-1.5">
            {!showTrashed ? (
              <>
                <button
                  onClick={() => handleBulkStatusUpdate('Active')}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-green-700 font-medium"
                >
                  Active
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('Inactive')}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-red-700 font-medium"
                >
                  Inactive
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('Maintenance')}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-amber-600 font-medium"
                >
                  Maintenance
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
              onClick={() => setSelectedItems(new Set())}
              className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table view */}
      <div className="overflow-x-auto border border-gray-250 rounded-lg bg-white shadow-sm">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-gray-200 bg-slate-50/80 text-gray-700 font-semibold uppercase text-[9px] whitespace-nowrap">
              <th className="py-2.5 px-2.5 w-8 text-center">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={paginatedData.length > 0 && paginatedData.every(item => selectedItems.has(item.id))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer"
                />
              </th>
              <th onClick={() => handleSort('vehicle_number')} className="py-2.5 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none">
                <div className="flex items-center gap-1">
                  <span>Vehicle Number</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('vehicle_number')}</span>
                </div>
              </th>
              <th onClick={() => handleSort('vehicle_type')} className="py-2.5 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none w-24">
                <div className="flex items-center gap-1">
                  <span>Type</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('vehicle_type')}</span>
                </div>
              </th>
              <th onClick={() => handleSort('model')} className="py-2.5 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none w-36">
                <div className="flex items-center gap-1">
                  <span>Chassis/Model</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('model')}</span>
                </div>
              </th>
              <th onClick={() => handleSort('capacity')} className="py-2.5 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none w-24 text-center">
                <div className="flex items-center justify-center gap-1">
                  <span>Capacity</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('capacity')}</span>
                </div>
              </th>
              <th className="py-2.5 px-2.5 w-40">Driver Details</th>
              <th className="py-2.5 px-2.5 w-36">Insurance Expiry</th>
              <th className="py-2.5 px-2.5 w-36">Fitness Expiry</th>
              <th onClick={() => handleSort('status')} className="py-2.5 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none w-28 text-center">
                <div className="flex items-center justify-center gap-1">
                  <span>Status</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('status')}</span>
                </div>
              </th>
              <th className="py-2.5 px-2.5 text-center w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-gray-500 font-medium">
                  <div className="flex flex-col items-center justify-center max-w-md mx-auto gap-2">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h4 className="text-[13px] font-bold text-gray-900">No vehicles registered</h4>
                    <p className="text-xs text-gray-500">Get started by creating a vehicle profile or importing from an Excel/CSV file.</p>
                    <button
                      onClick={openAddModal}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-650 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition"
                    >
                      Register your first vehicle
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => {
                const insWarn = isExpiringSoon(item.insurance_valid_till);
                const insExp = isExpired(item.insurance_valid_till);
                const fitWarn = isExpiringSoon(item.fitness_valid_till);
                const fitExp = isExpired(item.fitness_valid_till);

                return (
                  <tr key={item.id} className="hover:bg-blue-50/10 transition-colors text-gray-700">
                    <td className="py-1.5 px-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer"
                      />
                    </td>
                    <td className="py-1.5 px-2.5 font-bold text-gray-900">{item.vehicle_number}</td>
                    <td className="py-1.5 px-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/80 font-semibold text-[10px] text-slate-650">
                        {item.vehicle_type === 'Bus' ? '🚌 Bus' : item.vehicle_type === 'Van' ? '🚐 Van' : `🚗 ${item.vehicle_type}`}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 font-medium">
                      {item.model || '-'} {item.year ? `(${item.year})` : ''}
                    </td>
                    <td className="py-1.5 px-2.5 font-bold text-center text-slate-800">{item.capacity} seats</td>
                    <td className="py-1.5 px-2.5">
                      {item.driver_name ? (
                        <div>
                          <p className="font-semibold text-gray-950 leading-tight">{item.driver_name}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">{item.driver_contact || '-'}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-1.5 px-2.5 font-semibold">
                      <span className={`px-1.5 py-0.5 rounded border text-[10px] ${
                        insExp
                          ? 'bg-rose-50 text-rose-600 border-rose-100'
                          : insWarn
                          ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {formatDateDisplay(item.insurance_valid_till)}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 font-semibold">
                      <span className={`px-1.5 py-0.5 rounded border text-[10px] ${
                        fitExp
                          ? 'bg-rose-50 text-rose-600 border-rose-100'
                          : fitWarn
                          ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {formatDateDisplay(item.fitness_valid_till)}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 text-center">
                      <div className="flex items-center justify-center">
                        <ToggleSwitch
                          checked={item.status === 'Active'}
                          onChange={() => handleToggleStatus(item.id)}
                          disabled={showTrashed}
                        />
                      </div>
                    </td>
                    <td className="py-1.5 px-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {showTrashed ? (
                          <>
                            <button
                              onClick={() => handleRestore(item.id)}
                              className="px-2 py-0.5 border border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded text-[10px] font-bold"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.vehicle_number)}
                              className="px-2 py-0.5 border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded text-[10px] font-bold"
                            >
                              Purge
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded border border-transparent hover:border-blue-200 transition-colors"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.vehicle_number)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded border border-transparent hover:border-rose-200 transition-colors"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination control */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 mt-1">
          <span className="text-gray-500 font-semibold text-[10px]">
            Page {currentPage} of {totalPages} ({filteredData.length} records)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 border border-gray-200 rounded-md hover:bg-white text-gray-700 bg-gray-50 transitiondisabled:opacity-50 text-[10px] font-bold"
            >
              ◀ Prev
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`w-6 h-6 rounded-md text-[10px] font-bold transition-colors ${
                  currentPage === idx + 1
                    ? 'bg-blue-500 text-white shadow-xs'
                    : 'border border-gray-200 text-gray-700 bg-gray-50 hover:bg-white'
                }`}
              >
                {idx + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 border border-gray-200 rounded-md hover:bg-white text-gray-700 bg-gray-50 transitiondisabled:opacity-50 text-[10px] font-bold"
            >
              Next ▶
            </button>
          </div>
        </div>
      )}

      {/* POPUP MODAL DIALOG (Matches screenshot layout exactly) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-300 w-full max-w-lg overflow-hidden shadow-2xl transition-all">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-650 px-5 py-3.5 flex items-center justify-between text-white">
              <h2 className="text-sm font-extrabold tracking-tight">
                {editingItem ? '✏️ Edit Vehicle Profile' : '🚌 Add New Vehicle'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-slate-200 transition-colors text-lg font-semibold cursor-pointer active:scale-95"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                {/* Vehicle Number */}
                <div>
                  <label className={lbl}>Vehicle Number *</label>
                  <input
                    type="text"
                    required
                    name="vehicle_number"
                    value={formData.vehicle_number}
                    onChange={handleInputChange}
                    placeholder="e.g., KA-01-AB-1234"
                    className={inp}
                  />
                </div>

                {/* Vehicle Type */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={lbl}>Vehicle Type *</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingType(true)}
                      className="text-blue-600 hover:text-blue-800 text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer active:scale-95"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                      </svg>
                      Add New Type
                    </button>
                  </div>
                  {isAddingType ? (
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        placeholder="Type name (e.g., Bus, Van)"
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        className={`${inp} flex-1`}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleCreateVehicleType}
                        disabled={creatingType}
                        className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded font-bold transition flex items-center justify-center cursor-pointer disabled:opacity-50 h-[28px] w-[28px]"
                        title="Save Type"
                      >
                        {creatingType ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : '✓'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsAddingType(false); setNewTypeName(''); }}
                        className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-bold transition flex items-center justify-center cursor-pointer h-[28px] w-[28px]"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <SearchableSelect
                      options={vehicleTypes.map(t => ({ value: t.name, label: t.name }))}
                      value={formData.vehicle_type}
                      onChange={(val) => setFormData(prev => ({ ...prev, vehicle_type: val }))}
                      placeholder="Select Type *"
                    />
                  )}
                </div>

                {/* Model */}
                <div>
                  <label className={lbl}>Model</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    placeholder="e.g., Tata Starbus"
                    className={inp}
                  />
                </div>

                {/* Manufacture Year */}
                <div>
                  <label className={lbl}>Year</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    placeholder="2024"
                    className={inp}
                  />
                </div>

                {/* Seating Capacity */}
                <div>
                  <label className={lbl}>Capacity *</label>
                  <input
                    type="number"
                    required
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    placeholder="40"
                    className={inp}
                  />
                </div>

                {/* Registration Number */}
                <div>
                  <label className={lbl}>Registration Number</label>
                  <input
                    type="text"
                    name="registration_number"
                    value={formData.registration_number}
                    onChange={handleInputChange}
                    placeholder="Registration number"
                    className={inp}
                  />
                </div>

                {/* Driver Name */}
                <div>
                  <label className={lbl}>Driver Name</label>
                  <input
                    type="text"
                    name="driver_name"
                    value={formData.driver_name}
                    onChange={handleInputChange}
                    placeholder="Assigned driver"
                    className={inp}
                  />
                </div>

                {/* Driver Contact */}
                <div>
                  <label className={lbl}>Driver Contact</label>
                  <input
                    type="text"
                    name="driver_contact"
                    value={formData.driver_contact}
                    onChange={handleInputChange}
                    placeholder="+91-XXXXXXXXXX"
                    className={inp}
                  />
                </div>

                {/* Insurance Validity date */}
                <div>
                  <label className={lbl}>Insurance Valid Till</label>
                  <input
                    type="date"
                    name="insurance_valid_till"
                    value={formData.insurance_valid_till}
                    onChange={handleInputChange}
                    className={inp}
                  />
                </div>

                {/* Fitness Validity date */}
                <div>
                  <label className={lbl}>Fitness Valid Till</label>
                  <input
                    type="date"
                    name="fitness_valid_till"
                    value={formData.fitness_valid_till}
                    onChange={handleInputChange}
                    className={inp}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className={lbl}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white font-bold text-slate-700 cursor-pointer"
                >
                  <option value="Active">🟢 Active</option>
                  <option value="Inactive">🔴 Inactive</option>
                  <option value="Maintenance">🔧 Maintenance</option>
                </select>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-bold shadow-xs cursor-pointer"
                >
                  {editingItem ? 'Save Updates' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT PREVIEW MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-300 w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-650 px-5 py-3.5 flex items-center justify-between text-white">
              <h2 className="text-sm font-extrabold">Excel Data Import Preview ({importData.length} records)</h2>
              <button onClick={() => setIsImportModalOpen(false)} className="text-white hover:text-slate-200 text-lg">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Showing first 5 rows for review:</p>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs font-medium text-slate-650">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Vehicle Number</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Model</th>
                      <th className="py-2 px-3">Capacity</th>
                      <th className="py-2 px-3">Driver Name</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importPreview.map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-bold text-slate-900">{row['Vehicle Number']}</td>
                        <td className="py-2 px-3">{row['Vehicle Type']}</td>
                        <td className="py-2 px-3">{row['Model']}</td>
                        <td className="py-2 px-3 font-bold">{row['Capacity']}</td>
                        <td className="py-2 px-3">{row['Driver Name']}</td>
                        <td className="py-2 px-3 font-semibold">{row['Status'] || 'Active'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-250 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importing}
                  onClick={submitImport}
                  className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {importing ? 'Importing...' : 'Confirm Bulk Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManager;
