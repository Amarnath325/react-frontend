import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import Select from 'react-select';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface Driver {
  id: number;
  school_id: number;
  academic_year_id: number | null;
  full_name: string;
  employee_id: string | null;
  phone_number: string;
  email: string | null;
  date_of_birth: string | null;
  gender_id: number | null;
  address: string | null;
  license_number: string;
  license_valid_till: string | null;
  license_type_id: number | null;
  experience_years: number | null;
  assigned_vehicle_id: number | null;
  availability_status_id: number | null;
  joining_date: string | null;
  is_active: boolean;
  emergency_contact: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;

  // Loaded relations
  gender_master?: { m_id: number; m_name: string; m_alias_name: string } | null;
  license_type_master?: { m_id: number; m_name: string; m_alias_name: string } | null;
  availability_status_master?: { m_id: number; m_name: string; m_alias_name: string } | null;
  assigned_vehicle?: { id: number; vehicle_number: string } | null;
}

// Premium theme styling for react-select matching our system's Tailwind design
const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.375rem',
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
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
    borderRadius: '0.375rem',
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

// Toggle Switch Component
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

const DriverManager: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filteredData, setFilteredData] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Driver | null>(null);

  // Form selections and master databases
  const [genders, setGenders] = useState<any[]>([]);
  const [licenseTypes, setLicenseTypes] = useState<any[]>([]);
  const [availabilityStatuses, setAvailabilityStatuses] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // Filters
  const [showTrashed, setShowTrashed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');
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
    full_name: '',
    employee_id: '',
    phone_number: '',
    email: '',
    date_of_birth: '',
    gender_id: '',
    address: '',
    license_number: '',
    license_valid_till: '',
    license_type_id: '',
    experience_years: '',
    assigned_vehicle_id: '',
    availability_status_id: '',
    joining_date: '',
    is_active: true,
    emergency_contact: '',
  });

  useEffect(() => {
    fetchDrivers();
  }, [showTrashed]);

  useEffect(() => {
    fetchMasters();
  }, []);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [drivers, searchTerm, filterAvailability, filterStatus, sortColumn, sortDirection]);

  useEffect(() => {
    setSelectedItems(new Set());
  }, [searchTerm, filterAvailability, filterStatus, showTrashed, currentPage, itemsPerPage]);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/school/drivers', {
        params: { only_trashed: showTrashed }
      });
      if (response.data.success) {
        setDrivers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const parseMasterOptions = (data: any) => {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      return Object.entries(data).map(([id, name]) => ({
        id: parseInt(id),
        name: name as string
      }));
    }
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        id: item.id || item.m_id || item.value,
        name: item.name || item.m_name || item.label
      }));
    }
    return [];
  };

  const fetchMasters = async () => {
    try {
      // Fetch genders from master endpoint
      const genderRes = await api.get('/master/genders');
      if (genderRes.data.success) {
        setGenders(parseMasterOptions(genderRes.data.data));
      }

      // Fetch license types from master endpoint
      const licRes = await api.get('/master/license-types');
      if (licRes.data.success) {
        setLicenseTypes(parseMasterOptions(licRes.data.data));
      }

      // Fetch availability statuses from master endpoint
      const availRes = await api.get('/master/driver-availabilities');
      if (availRes.data.success) {
        setAvailabilityStatuses(parseMasterOptions(availRes.data.data));
      }

      // Fetch vehicles (school-scoped) from drivers/masters
      const response = await api.get('/school/drivers/masters');
      if (response.data.success) {
        setVehicles(response.data.data.vehicles);
      }
    } catch (error) {
      console.error('Error fetching master databases:', error);
    }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...drivers];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.full_name.toLowerCase().includes(lowerSearch) ||
        (item.employee_id && item.employee_id.toLowerCase().includes(lowerSearch)) ||
        item.phone_number.includes(lowerSearch) ||
        item.license_number.toLowerCase().includes(lowerSearch)
      );
    }

    if (filterAvailability) {
      filtered = filtered.filter(item => String(item.availability_status_id) === String(filterAvailability));
    }

    if (filterStatus) {
      const activeBool = filterStatus === 'Active';
      filtered = filtered.filter(item => item.is_active === activeBool);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof Driver] ?? '';
      let bVal: any = b[sortColumn as keyof Driver] ?? '';

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
    setFilterAvailability('');
    setFilterStatus('');
  };

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = itemsPerPage === -1
    ? filteredData
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      full_name: '',
      employee_id: '',
      phone_number: '',
      email: '',
      date_of_birth: '',
      gender_id: genders[0]?.id?.toString() || '',
      address: '',
      license_number: '',
      license_valid_till: '',
      license_type_id: licenseTypes[0]?.id?.toString() || '',
      experience_years: '',
      assigned_vehicle_id: '',
      availability_status_id: availabilityStatuses[0]?.id?.toString() || '',
      joining_date: new Date().toISOString().split('T')[0],
      is_active: true,
      emergency_contact: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Driver) => {
    setEditingItem(item);
    
    const formatInputDate = (dateStr: string | null) => {
      if (!dateStr) return '';
      return dateStr.split('T')[0];
    };

    setFormData({
      full_name: item.full_name,
      employee_id: item.employee_id || '',
      phone_number: item.phone_number,
      email: item.email || '',
      date_of_birth: formatInputDate(item.date_of_birth),
      gender_id: item.gender_id?.toString() || '',
      address: item.address || '',
      license_number: item.license_number,
      license_valid_till: formatInputDate(item.license_valid_till),
      license_type_id: item.license_type_id?.toString() || '',
      experience_years: item.experience_years ? item.experience_years.toString() : '',
      assigned_vehicle_id: item.assigned_vehicle_id?.toString() || '',
      availability_status_id: item.availability_status_id?.toString() || '',
      joining_date: formatInputDate(item.joining_date),
      is_active: item.is_active,
      emergency_contact: item.emergency_contact || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name) {
      toast.error('Driver name is required');
      return;
    }
    if (!formData.phone_number) {
      toast.error('Phone number is required');
      return;
    }
    if (!formData.license_number) {
      toast.error('License number is required');
      return;
    }

    try {
      const submitData = {
        full_name: formData.full_name,
        employee_id: formData.employee_id || null,
        phone_number: formData.phone_number,
        email: formData.email || null,
        date_of_birth: formData.date_of_birth || null,
        gender_id: formData.gender_id ? parseInt(formData.gender_id) : null,
        address: formData.address || null,
        license_number: formData.license_number,
        license_valid_till: formData.license_valid_till || null,
        license_type_id: formData.license_type_id ? parseInt(formData.license_type_id) : null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        assigned_vehicle_id: formData.assigned_vehicle_id ? parseInt(formData.assigned_vehicle_id) : null,
        availability_status_id: formData.availability_status_id ? parseInt(formData.availability_status_id) : null,
        joining_date: formData.joining_date || null,
        is_active: formData.is_active,
        emergency_contact: formData.emergency_contact || null,
      };

      if (editingItem) {
        const response = await api.put(`/school/drivers/${editingItem.id}`, submitData);
        if (response.data.success) {
          toast.success('Driver updated successfully');
        }
      } else {
        const response = await api.post('/school/drivers', submitData);
        if (response.data.success) {
          toast.success('Driver registered successfully');
        }
      }
      setIsModalOpen(false);
      fetchDrivers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const action = showTrashed ? 'permanently delete' : 'delete';
    if (window.confirm(`Are you sure you want to ${action} driver "${name}"?`)) {
      try {
        let response;
        if (showTrashed) {
          response = await api.delete(`/school/drivers/${id}/force`);
        } else {
          response = await api.delete(`/school/drivers/${id}`);
        }
        if (response.data.success) {
          toast.success(`Driver ${showTrashed ? 'permanently deleted' : 'deleted'} successfully`);
          fetchDrivers();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await api.patch(`/school/drivers/${id}/toggle-status`);
      if (response.data.success) {
        toast.success('Driver status updated');
        fetchDrivers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleRestore = async (id: number) => {
    if (!window.confirm('Are you sure you want to restore this driver?')) return;
    try {
      const response = await api.post(`/school/drivers/${id}/restore`);
      if (response.data.success) {
        toast.success('Driver restored successfully');
        fetchDrivers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore driver');
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

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    setBulkUpdating(true);
    const ids = Array.from(selectedItems);

    try {
      const response = await api.post('/school/drivers/bulk-status', {
        is_active: isActive,
        ids: ids
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Status updated successfully');
        setSelectedItems(new Set());
        fetchDrivers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    const confirmMessage = showTrashed
      ? `Are you sure you want to permanently delete ${selectedItems.size} selected driver(s)? This action cannot be undone.`
      : `Are you sure you want to delete ${selectedItems.size} selected driver(s)?`;

    if (window.confirm(confirmMessage)) {
      setBulkUpdating(true);
      const ids = Array.from(selectedItems);

      try {
        const response = await api.post('/school/drivers/bulk-delete', {
          ids: ids,
          force: showTrashed
        });
        if (response.data.success) {
          toast.success(response.data.message || 'Deleted successfully');
          setSelectedItems(new Set());
          fetchDrivers();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete');
      } finally {
        setBulkUpdating(false);
      }
    }
  };

  const handleBulkRestore = async () => {
    if (window.confirm(`Are you sure you want to restore ${selectedItems.size} selected driver(s)?`)) {
      setBulkUpdating(true);
      const ids = Array.from(selectedItems);

      try {
        const response = await api.post('/school/drivers/bulk-restore', {
          ids: ids
        });
        if (response.data.success) {
          toast.success(response.data.message || 'Restored successfully');
          setSelectedItems(new Set());
          fetchDrivers();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to restore');
      } finally {
        setBulkUpdating(false);
      }
    }
  };

  // Excel Operations
  const handleExport = () => {
    try {
      const exportData = filteredData.map(item => ({
        'Full Name': item.full_name,
        'Employee ID': item.employee_id || '',
        'Phone Number': item.phone_number,
        'Email': item.email || '',
        'Gender': item.gender_master?.m_name || '',
        'Address': item.address || '',
        'License Number': item.license_number,
        'License Expiry': item.license_valid_till ? item.license_valid_till.split('T')[0] : '',
        'License Type': item.license_type_master?.m_name || '',
        'Experience (Years)': item.experience_years || '',
        'Assigned Vehicle': item.assigned_vehicle?.vehicle_number || '',
        'Availability': item.availability_status_master?.m_name || '',
        'Joining Date': item.joining_date ? item.joining_date.split('T')[0] : '',
        'Status': item.is_active ? 'Active' : 'Inactive',
        'Emergency Contact': item.emergency_contact || '',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Drivers');
      XLSX.writeFile(wb, `drivers_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Export successful!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const downloadSampleFile = async () => {
    try {
      const genderValues = genders.map(g => g.name);
      const licValues = licenseTypes.map(l => l.name);
      const availValues = availabilityStatuses.map(a => a.name);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Drivers');

      worksheet.columns = [
        { header: 'Full Name *', key: 'full_name', width: 20 },
        { header: 'Employee ID', key: 'employee_id', width: 15 },
        { header: 'Phone Number *', key: 'phone_number', width: 15 },
        { header: 'Email', key: 'email', width: 20 },
        { header: 'Gender', key: 'gender', width: 12 },
        { header: 'Address', key: 'address', width: 25 },
        { header: 'License Number *', key: 'license_number', width: 20 },
        { header: 'License Valid Till (YYYY-MM-DD)', key: 'license_valid_till', width: 25 },
        { header: 'License Type', key: 'license_type', width: 20 },
        { header: 'Experience (Years)', key: 'experience_years', width: 15 },
        { header: 'Assigned Vehicle (Reg No)', key: 'assigned_vehicle', width: 25 },
        { header: 'Availability', key: 'availability', width: 15 },
        { header: 'Joining Date (YYYY-MM-DD)', key: 'joining_date', width: 25 },
        { header: 'Emergency Contact', key: 'emergency_contact', width: 20 },
      ];

      worksheet.addRow({
        full_name: 'Rajesh Kumar',
        employee_id: 'EMP-DRV-01',
        phone_number: '+91-9876543210',
        email: 'rajesh@school.com',
        gender: genderValues[0] || 'Male',
        address: '123, School Lane, Delhi',
        license_number: 'DL-142024009988',
        license_valid_till: '2031-06-16',
        license_type: licValues[0] || 'Heavy Vehicle (HMV)',
        experience_years: 8,
        assigned_vehicle: vehicles[0]?.vehicle_number || '',
        availability: availValues[0] || 'On Duty',
        joining_date: '2026-06-16',
        emergency_contact: 'Sunita (Wife) - +91-9876543211',
      });

      // Write lists data to helper columns P, Q, R
      worksheet.getCell('P1').value = 'Gender_List';
      genderValues.forEach((val, idx) => {
        worksheet.getCell(`P${idx + 2}`).value = val;
      });

      worksheet.getCell('Q1').value = 'License_Type_List';
      licValues.forEach((val, idx) => {
        worksheet.getCell(`Q${idx + 2}`).value = val;
      });

      worksheet.getCell('R1').value = 'Availability_List';
      availValues.forEach((val, idx) => {
        worksheet.getCell(`R${idx + 2}`).value = val;
      });

      worksheet.getColumn('P').hidden = true;
      worksheet.getColumn('Q').hidden = true;
      worksheet.getColumn('R').hidden = true;

      for (let r = 2; r <= 500; r++) {
        if (genderValues.length > 0) {
          worksheet.getCell(`E${r}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`'Drivers'!$P$2:$P$${1 + genderValues.length}`],
            showErrorMessage: true,
            errorTitle: 'Invalid Selection',
            error: 'Select from genders list',
          };
        }
        if (licValues.length > 0) {
          worksheet.getCell(`I${r}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`'Drivers'!$Q$2:$Q$${1 + licValues.length}`],
            showErrorMessage: true,
            errorTitle: 'Invalid Selection',
            error: 'Select from license types list',
          };
        }
        if (availValues.length > 0) {
          worksheet.getCell(`L${r}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`'Drivers'!$R$2:$R$${1 + availValues.length}`],
            showErrorMessage: true,
            errorTitle: 'Invalid Selection',
            error: 'Select from availability list',
          };
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_drivers.xlsx');
      toast.success('Sample template downloaded!');
    } catch (error) {
      console.error('Template download error:', error);
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
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        let headerRowIndex = -1;
        let headers: string[] = [];

        for (let i = 0; i < rows.length; i++) {
          const firstCell = rows[i][0];
          if (firstCell && (firstCell === 'Full Name *' || firstCell?.toString().includes('Full Name'))) {
            headerRowIndex = i;
            headers = rows[i].map((cell: any) => cell?.toString().trim() || '');
            break;
          }
        }

        if (headerRowIndex === -1) {
          toast.error('Could not find header row (e.g. "Full Name *")');
          return;
        }

        const dataRows: any[] = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          // Skip helper columns lists
          const firstCell = row[0];
          if (firstCell && (firstCell.toString().includes('_List') || firstCell === 'Gender_List' || firstCell === 'License_Type_List' || firstCell === 'Availability_List')) {
            continue;
          }

          const hasData = row.some((cell: any) => cell && cell.toString().trim() !== '');
          if (!hasData) continue;

          const rowData: any = {};
          for (let j = 0; j < headers.length; j++) {
            const header = headers[j];
            const cleanHeader = header.replace(' *', '');
            if (header && !header.includes('_List') && header !== '__EMPTY') {
              rowData[cleanHeader] = row[j]?.toString() || '';
            }
          }

          if (rowData['Full Name'] && rowData['Phone Number'] && rowData['License Number']) {
            dataRows.push(rowData);
          }
        }

        if (dataRows.length === 0) {
          toast.error('No valid data rows found.');
          return;
        }

        // Map keys to API names
        const payloadData = dataRows.map(row => ({
          full_name: row['Full Name'],
          employee_id: row['Employee ID'] || null,
          phone_number: row['Phone Number'],
          email: row['Email'] || null,
          gender: row['Gender'] || null,
          address: row['Address'] || null,
          license_number: row['License Number'],
          license_valid_till: row['License Valid Till (YYYY-MM-DD)'] || null,
          license_type: row['License Type'] || null,
          experience_years: row['Experience (Years)'] ? parseInt(row['Experience (Years)']) : null,
          assigned_vehicle: row['Assigned Vehicle (Reg No)'] || null,
          availability: row['Availability'] || null,
          joining_date: row['Joining Date (YYYY-MM-DD)'] || null,
          emergency_contact: row['Emergency Contact'] || null,
        }));

        setImportData(payloadData);
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
      const response = await api.post('/school/drivers/bulk-import', { data: importData });
      if (response.data.success) {
        toast.success(response.data.message || 'Import successful!');
        setIsImportModalOpen(false);
        fetchDrivers();
      } else {
        toast.error(response.data.message || 'Import failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  const getLicenseExpiryWarning = (dateStr: string | null) => {
    if (!dateStr) return null;
    const expiryDate = new Date(dateStr);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold border border-red-200">Expired</span>;
    }
    if (diffDays <= 30) {
      return <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold border border-amber-200" title={`Expires on ${dateStr.split('T')[0]}`}>Expiring ({diffDays}d)</span>;
    }
    return null;
  };

  const getAvailabilityBadge = (statusName: string | undefined) => {
    if (!statusName) return <span className="text-gray-400">—</span>;
    switch (statusName) {
      case 'On Duty':
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold border border-emerald-200">🟢 On Duty</span>;
      case 'Off Duty':
        return <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-full font-bold border border-slate-200">⚪ Off Duty</span>;
      case 'On Leave':
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-bold border border-amber-200">🟡 On Leave</span>;
      case 'Suspended':
        return <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded-full font-bold border border-red-200">🔴 Suspended</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-50 text-gray-650 rounded-full font-medium">{statusName}</span>;
    }
  };

  const totalActive = drivers.filter(d => d.is_active).length;
  const onDutyCount = drivers.filter(d => d.availability_status_master?.m_name === 'On Duty' && d.is_active).length;
  const offDutyCount = drivers.filter(d => d.availability_status_master?.m_name === 'Off Duty' && d.is_active).length;

  const lbl = 'block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide';
  const inp = 'w-full px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';

  return (
    <div className="space-y-3 text-xs">
      {/* Header Panel */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2">
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">Driver & Staff Management</h3>
          <p className="text-[12px] text-gray-500">Manage transport staff profiles, license status, and vehicle assignments</p>
        </div>

        {/* Dynamic Statistics */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-100 rounded px-2.5 py-0.5 text-center min-w-[65px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-400">Total</span>
            <span className="text-xs font-bold text-slate-700">{drivers.length}</span>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-100/80 rounded px-2.5 py-0.5 text-center min-w-[65px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-emerald-500">Active</span>
            <span className="text-xs font-bold text-emerald-700">{totalActive}</span>
          </div>
          <div className="bg-blue-50/60 border border-blue-100/80 rounded px-2.5 py-0.5 text-center min-w-[65px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-blue-500">On Duty</span>
            <span className="text-xs font-bold text-blue-700">{onDutyCount}</span>
          </div>
          <div className="bg-slate-100/60 border border-slate-200/80 rounded px-2.5 py-0.5 text-center min-w-[65px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-500">Off Duty</span>
            <span className="text-xs font-bold text-slate-600">{offDutyCount}</span>
          </div>
        </div>
      </div>

      {/* Toolbar Area */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search driver name, license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-2 py-1 w-48 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-gray-700"
            />
          </div>

          {/* Availability Status Filter */}
          <SearchableSelect
            options={availabilityStatuses.map(a => ({ value: a.id, label: a.name }))}
            value={filterAvailability}
            onChange={(val) => setFilterAvailability(val)}
            placeholder="All Availabilities"
            isClearable={true}
            className="w-40 text-xs"
            compact={true}
          />

          {/* Status filter */}
          <SearchableSelect
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' }
            ]}
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

          {/* Soft Deleted Toggle */}
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

          {(searchTerm || filterAvailability || filterStatus) && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-700 font-medium px-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Excel Toolbar actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={downloadSampleFile}
            className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-xs font-medium cursor-pointer"
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
            className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-xs font-medium cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>

          {!showTrashed && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition text-xs font-medium cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Driver
            </button>
          )}
        </div>
      </div>

      {/* Trashed Alert Banner */}
      {showTrashed && (
        <div className="bg-red-50 border border-red-200 px-4 py-1.5 flex items-center gap-2 text-red-700 text-xs font-medium rounded-lg">
          <svg className="w-3.5 h-3.5 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>You are viewing deleted drivers. You can restore them or permanently delete them below.</span>
        </div>
      )}

      {/* Bulk Actions Container */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg flex items-center justify-between text-xs animate-fadeIn">
          <div className="text-blue-800 font-bold">
            {selectedItems.size} item(s) selected
          </div>
          <div className="flex items-center gap-1.5">
            {!showTrashed ? (
              <>
                <button
                  onClick={() => handleBulkStatusUpdate(true)}
                  disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-green-700 font-medium cursor-pointer"
                >
                  Active
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate(false)}
                  disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-red-700 font-medium cursor-pointer"
                >
                  Inactive
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 font-medium cursor-pointer"
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleBulkRestore}
                  disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-green-700 font-medium cursor-pointer"
                >
                  Restore
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 font-medium cursor-pointer"
                >
                  Delete Permanently
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedItems(new Set())}
              className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Table Grid */}
      <div className="overflow-x-auto border border-gray-250 rounded-lg bg-white shadow-sm">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-gray-200 bg-slate-50/80 text-gray-700 font-bold uppercase text-[9px] whitespace-nowrap">
              <th className="py-2.5 px-3 w-8 text-center">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={paginatedData.length > 0 && paginatedData.every(item => selectedItems.has(item.id))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
              </th>
              <th onClick={() => handleSort('full_name')} className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 select-none">
                Driver Details {getSortIcon('full_name')}
              </th>
              <th onClick={() => handleSort('phone_number')} className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 select-none">
                Contact & ID {getSortIcon('phone_number')}
              </th>
              <th onClick={() => handleSort('license_number')} className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 select-none">
                License Specs {getSortIcon('license_number')}
              </th>
              <th className="py-2.5 px-3">Experience</th>
              <th className="py-2.5 px-3">Vehicle</th>
              <th className="py-2.5 px-3 text-center">Availability</th>
              <th onClick={() => handleSort('is_active')} className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 select-none text-center w-24">
                Status {getSortIcon('is_active')}
              </th>
              <th className="py-2.5 px-3 text-center w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-500 font-medium">
                  <div className="flex flex-col items-center justify-center max-w-md mx-auto gap-2">
                    <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <h4 className="text-[13px] font-bold text-gray-900">No drivers registered</h4>
                    <p className="text-xs text-gray-500">Add staff records or import list details via Excel spreadsheets template.</p>
                    {!showTrashed && (
                      <button
                        onClick={openAddModal}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition cursor-pointer"
                      >
                        Register your first driver
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/10 transition-colors text-gray-700">
                  <td className="py-2 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <div className="font-bold text-gray-950">{item.full_name}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">
                      {item.gender_master?.m_name || '—'}
                      {item.employee_id && ` • ID: ${item.employee_id}`}
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <div className="font-bold text-gray-800">{item.phone_number}</div>
                    {item.email && <div className="text-[10px] text-gray-400 mt-0.5">{item.email}</div>}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">{item.license_number}</span>
                      {getLicenseExpiryWarning(item.license_valid_till)}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      Type: {item.license_type_master?.m_name || 'N/A'}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-gray-650">
                    {item.experience_years !== null ? `${item.experience_years} years` : '—'}
                  </td>
                  <td className="py-2 px-3 text-gray-650">
                    {item.assigned_vehicle ? (
                      <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{item.assigned_vehicle.vehicle_number}</span>
                    ) : (
                      <span className="text-gray-400">Not Assigned</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {getAvailabilityBadge(item.availability_status_master?.m_name)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center">
                      <ToggleSwitch
                        checked={item.is_active}
                        onChange={() => handleToggleStatus(item.id)}
                        disabled={showTrashed}
                      />
                    </div>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {showTrashed ? (
                        <>
                          <button
                            onClick={() => handleRestore(item.id)}
                            className="p-1 text-slate-500 hover:bg-green-50 rounded hover:text-green-600 transition cursor-pointer"
                            title="Restore"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.full_name)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded hover:text-red-700 transition cursor-pointer"
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
                            className="p-1 text-slate-500 hover:bg-slate-100 rounded hover:text-blue-600 transition cursor-pointer"
                            title="Edit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.full_name)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded hover:text-red-700 transition cursor-pointer"
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

      {/* Pagination Footer */}
      {totalPages > 1 && itemsPerPage !== -1 && (
        <div className="flex items-center justify-between border border-gray-250 bg-white px-4 py-2 rounded-lg shadow-sm text-xs mt-3">
          <span className="text-gray-500 font-medium">
            Showing <span className="font-bold text-gray-800">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
            <span className="font-bold text-gray-800">
              {Math.min(currentPage * itemsPerPage, filteredData.length)}
            </span>{' '}
            of <span className="font-bold text-gray-800">{filteredData.length}</span> entries
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1 border border-gray-200 rounded-md hover:bg-white text-gray-700 bg-gray-50 transitiondisabled:opacity-50 text-[10px] font-bold cursor-pointer"
            >
              ◀◀
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 border border-gray-200 rounded-md hover:bg-white text-gray-700 bg-gray-50 transitiondisabled:opacity-50 text-[10px] font-bold cursor-pointer"
            >
              ◀ Prev
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`w-6 h-6 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
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
              className="px-2.5 py-1 border border-gray-200 rounded-md hover:bg-white text-gray-700 bg-gray-50 transitiondisabled:opacity-50 text-[10px] font-bold cursor-pointer"
            >
              Next ▶
            </button>
          </div>
        </div>
      )}

      {/* POPUP MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-300 w-full max-w-3xl overflow-hidden shadow-2xl transition-all flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-650 px-5 py-3.5 flex items-center justify-between text-white flex-shrink-0">
              <h2 className="text-sm font-extrabold tracking-tight">
                {editingItem ? '✏️ Edit Driver Profile' : '👥 Add New Driver'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-slate-200 transition-colors text-lg font-semibold cursor-pointer active:scale-95"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs font-semibold overflow-y-auto flex-1">
              {/* Section 1: Basic Info */}
              <div className="grid grid-cols-3 gap-3">
                {/* Full Name */}
                <div>
                  <label className={lbl}>Full Name *</label>
                  <input
                    type="text"
                    required
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className={inp}
                  />
                </div>

                {/* Employee ID */}
                <div>
                  <label className={lbl}>Employee ID</label>
                  <input
                    type="text"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleInputChange}
                    placeholder="EMP-001"
                    className={inp}
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className={lbl}>Phone Number *</label>
                  <input
                    type="text"
                    required
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="+91-XXXXXXXXXX"
                    className={inp}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className={lbl}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="driver@email.com"
                    className={inp}
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className={lbl}>Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className={inp}
                  />
                </div>

                {/* Gender (Dynamic masters) */}
                <div>
                  <label className={lbl}>Gender</label>
                  <SearchableSelect
                    options={genders.map(g => ({ value: g.id, label: g.name }))}
                    value={formData.gender_id}
                    onChange={(val) => setFormData(prev => ({ ...prev, gender_id: val }))}
                    placeholder="Select Gender"
                  />
                </div>

                {/* Address */}
                <div className="col-span-2">
                  <label className={lbl}>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Residential address"
                    rows={1}
                    className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white resize-none"
                  />
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className={lbl}>Emergency Contact</label>
                  <input
                    type="text"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleInputChange}
                    placeholder="Name: Phone number"
                    className={inp}
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Section 2: License Details */}
              <div className="grid grid-cols-3 gap-3">
                {/* License Number */}
                <div>
                  <label className={lbl}>License Number *</label>
                  <input
                    type="text"
                    required
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleInputChange}
                    placeholder="DL-123456"
                    className={inp}
                  />
                </div>

                {/* License Expiry date */}
                <div>
                  <label className={lbl}>License Valid Till</label>
                  <input
                    type="date"
                    name="license_valid_till"
                    value={formData.license_valid_till}
                    onChange={handleInputChange}
                    className={inp}
                  />
                </div>

                {/* License Type (Dynamic masters) */}
                <div>
                  <label className={lbl}>License Type</label>
                  <SearchableSelect
                    options={licenseTypes.map(l => ({ value: l.id, label: l.name }))}
                    value={formData.license_type_id}
                    onChange={(val) => setFormData(prev => ({ ...prev, license_type_id: val }))}
                    placeholder="Select Type"
                  />
                </div>

                {/* Experience (years) */}
                <div>
                  <label className={lbl}>Experience (Years)</label>
                  <input
                    type="number"
                    name="experience_years"
                    value={formData.experience_years}
                    onChange={handleInputChange}
                    placeholder="Years of experience"
                    className={inp}
                  />
                </div>

                {/* Assigned Vehicle */}
                <div>
                  <label className={lbl}>Assigned Vehicle</label>
                  <SearchableSelect
                    options={vehicles.map(v => ({ value: v.id, label: v.vehicle_number }))}
                    value={formData.assigned_vehicle_id}
                    onChange={(val) => setFormData(prev => ({ ...prev, assigned_vehicle_id: val }))}
                    placeholder="Select Vehicle"
                    isClearable={true}
                  />
                </div>

                {/* Availability status (Dynamic masters) */}
                <div>
                  <label className={lbl}>Availability Status</label>
                  <SearchableSelect
                    options={availabilityStatuses.map(a => ({ value: a.id, label: a.name }))}
                    value={formData.availability_status_id}
                    onChange={(val) => setFormData(prev => ({ ...prev, availability_status_id: val }))}
                    placeholder="Select Availability"
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Section 3: Job status & Assignments */}
              <div className="grid grid-cols-3 gap-3">
                {/* Joining date */}
                <div>
                  <label className={lbl}>Joining Date</label>
                  <input
                    type="date"
                    name="joining_date"
                    value={formData.joining_date}
                    onChange={handleInputChange}
                    className={inp}
                  />
                </div>

                {/* Status active/inactive Toggle Switch */}
                <div className="flex flex-col">
                  <span className={lbl}>Status</span>
                  <div className="flex items-center gap-2 mt-1">
                    <ToggleSwitch
                      checked={formData.is_active}
                      onChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <span className={`text-xs font-bold ${formData.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                      {formData.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
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
                  {editingItem ? 'Save Updates' : 'Save Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Data Import Preview modal */}
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
                      <th className="py-2 px-3">Full Name</th>
                      <th className="py-2 px-3">Phone</th>
                      <th className="py-2 px-3">License Number</th>
                      <th className="py-2 px-3">License Type</th>
                      <th className="py-2 px-3">Availability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importPreview.map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-bold text-slate-900">{row['Full Name']}</td>
                        <td className="py-2 px-3">{row['Phone Number']}</td>
                        <td className="py-2 px-3 font-bold text-slate-700">{row['License Number']}</td>
                        <td className="py-2 px-3">{row['License Type']}</td>
                        <td className="py-2 px-3 font-bold text-emerald-700">{row['Availability']}</td>
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

export default DriverManager;
