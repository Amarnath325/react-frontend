import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import Select from 'react-select';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface Vehicle {
  id: number;
  vehicle_number: string;
  model: string;
  status: string;
}

interface MasterOption {
  m_id: number;
  m_group: string;
  m_name: string;
  m_alias_name: string;
}

interface FuelLog {
  id: number;
  school_id: number;
  academic_year_id: number | null;
  vehicle_id: number;
  refill_date: string;
  fuel_type_id: number;
  quantity: number | string;
  rate_per_liter: number | string;
  total_amount: number | string;
  odometer: number;
  mileage: number | null;
  vendor_id: number;
  invoice_number: string | null;
  notes: string | null;
  status: string;
  vehicle?: Vehicle;
  fuel_type?: MasterOption;
  vendor?: MasterOption;
}

interface VehicleExpense {
  id: number;
  school_id: number;
  academic_year_id: number | null;
  vehicle_id: number;
  expense_date: string;
  expense_type_id: number;
  amount: number | string;
  vendor_id: number | null;
  invoice_number: string | null;
  notes: string | null;
  status: string;
  vehicle?: Vehicle;
  expense_type?: MasterOption;
  vendor?: MasterOption;
}

const compactSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.25rem',
    borderColor: state.isFocused ? '#6366f1' : '#e2e8f0',
    boxShadow: state.isFocused ? '0 0 0 1px rgba(99, 102, 241, 0.15)' : 'none',
    minHeight: '23px',
    height: '23px',
    backgroundColor: '#ffffff',
    '&:hover': {
      borderColor: state.isFocused ? '#6366f1' : '#cbd5e1',
    },
    transition: 'all 0.15s ease',
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 6px',
    height: '23px',
    display: 'flex',
    alignItems: 'center',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0',
    padding: '0',
    fontSize: '10px',
    color: '#1e293b',
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: '10px',
    color: '#94a3b8',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '10px',
    color: '#1e293b',
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: '21px',
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    padding: '2px',
  }),
  clearIndicator: (base: any) => ({
    ...base,
    padding: '2px',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#4f46e5'
      : state.isFocused
        ? '#f1f5f9'
        : 'transparent',
    color: state.isSelected ? '#ffffff' : '#334155',
    fontSize: '10px',
    padding: '2px 6px',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: state.isSelected ? '#4f46e5' : '#e2e8f0',
    },
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '0.25rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #e2e8f0',
    marginTop: '1px',
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
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  isClearable = false,
  className = "",
}) => {
  const selectedOption = options.find(opt => String(opt.value) === String(value)) || null;

  return (
    <div className={className}>
      <Select
        options={options}
        value={selectedOption}
        onChange={(selected: any) => onChange(selected ? String(selected.value) : '')}
        placeholder={placeholder}
        isClearable={isClearable}
        styles={compactSelectStyles}
        className="text-[11px]"
      />
    </div>
  );
};

const FuelManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'logs' | 'expenses' | 'analytics' | 'vendors'>('logs');
  
  // Data lists
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<VehicleExpense[]>([]);
  
  // Master lists
  const [fuelTypes, setFuelTypes] = useState<MasterOption[]>([]);
  const [vendors, setVendors] = useState<MasterOption[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<MasterOption[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState<boolean>(true);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');
  
  // Modal states
  const [isFuelModalOpen, setIsFuelModalOpen] = useState<boolean>(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  
  // Editing items
  const [editingFuelLog, setEditingFuelLog] = useState<FuelLog | null>(null);
  const [editingExpense, setEditingExpense] = useState<VehicleExpense | null>(null);
  
  // Trash and Bulk actions
  const [showTrashed, setShowTrashed] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);
  
  // Settings view details
  const [settingsGroup, setSettingsGroup] = useState<'FUEL_VENDOR' | 'FUEL_TYPE' | 'VEHICLE_EXPENSE_TYPE'>('FUEL_VENDOR');
  const [newMasterName, setNewMasterName] = useState<string>('');
  const [editingMasterId, setEditingMasterId] = useState<number | null>(null);
  const [editingMasterName, setEditingMasterName] = useState<string>('');

  // Fuel Log Form State
  const [fuelForm, setFuelForm] = useState({
    vehicle_id: '',
    refill_date: new Date().toISOString().split('T')[0],
    fuel_type_id: '',
    quantity: '',
    rate_per_liter: '',
    total_amount: '',
    odometer: '',
    mileage: '',
    vendor_id: '',
    invoice_number: '',
    notes: '',
    status: 'Pending',
  });

  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    vehicle_id: '',
    expense_date: new Date().toISOString().split('T')[0],
    expense_type_id: '',
    amount: '',
    vendor_id: '',
    invoice_number: '',
    notes: '',
    status: 'Paid',
  });

  // Reference for previous odometer reading during refill calculation
  const [prevOdometer, setPrevOdometer] = useState<number | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchFuelLogs();
      setSelectedIds([]);
    }
  }, [showTrashed, activeTab]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch vehicles
      const vehicleRes = await api.get('/school/vehicles');
      if (vehicleRes.data.success) {
        setVehicles(vehicleRes.data.data);
      }

      // Fetch dynamic masters
      await refreshMasterOptions();

      // Fetch logs and expenses
      await Promise.all([fetchFuelLogs(), fetchExpenses()]);

    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const refreshMasterOptions = async () => {
    try {
      const [fuelTypeRes, vendorRes, expenseTypeRes] = await Promise.all([
        api.get('/master/group/FUEL_TYPE'),
        api.get('/master/group/FUEL_VENDOR'),
        api.get('/master/group/VEHICLE_EXPENSE_TYPE'),
      ]);

      if (fuelTypeRes.data.success) setFuelTypes(fuelTypeRes.data.data);
      if (vendorRes.data.success) setVendors(vendorRes.data.data);
      if (expenseTypeRes.data.success) setExpenseTypes(expenseTypeRes.data.data);
    } catch (err) {
      console.error('Error fetching master groups:', err);
    }
  };

  const fetchFuelLogs = async () => {
    try {
      const params: any = { only_trashed: showTrashed };
      const res = await api.get('/school/transport-fuel-logs', { params });
      if (res.data.success) {
        setFuelLogs(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching fuel logs:', err);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await api.get('/school/transport-vehicle-expenses');
      if (res.data.success) {
        setExpenses(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  };

  // Helper to fetch latest odometer for auto calculation
  const handleVehicleChange = async (vehicleId: string) => {
    if (!vehicleId) {
      setPrevOdometer(null);
      return;
    }
    try {
      const res = await api.get('/school/transport-fuel-logs', { params: { vehicle_id: vehicleId } });
      if (res.data.success && res.data.data.length > 0) {
        // Get the latest log (already sorted desc by refill_date & id in backend)
        const latestLog = res.data.data[0];
        setPrevOdometer(latestLog.odometer);
      } else {
        setPrevOdometer(null);
      }
    } catch (err) {
      console.error('Error fetching last odometer:', err);
      setPrevOdometer(null);
    }
  };

  // Auto calculate total amount and mileage
  useEffect(() => {
    const qty = parseFloat(fuelForm.quantity) || 0;
    const rate = parseFloat(fuelForm.rate_per_liter) || 0;
    const total = qty * rate;
    
    let computedMileage = '';
    const currentOdo = parseInt(fuelForm.odometer) || 0;
    if (prevOdometer && currentOdo > prevOdometer && qty > 0) {
      computedMileage = ((currentOdo - prevOdometer) / qty).toFixed(2);
    }

    setFuelForm(prev => ({
      ...prev,
      total_amount: total > 0 ? total.toFixed(2) : prev.total_amount,
      mileage: computedMileage
    }));
  }, [fuelForm.quantity, fuelForm.rate_per_liter, fuelForm.odometer, prevOdometer]);

  // Master Settings Functions
  const handleAddMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      const res = await api.post('/school/masters', {
        m_group: settingsGroup,
        m_name: newMasterName.trim(),
        m_alias_name: newMasterName.trim(),
        m_type: 'active',
        m_description: `${settingsGroup} value added dynamically`
      });

      if (res.data.success) {
        toast.success('Added successfully');
        setNewMasterName('');
        await refreshMasterOptions();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add option');
    }
  };

  const handleUpdateMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMasterName.trim() || !editingMasterId) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      const res = await api.put(`/school/masters/${editingMasterId}`, {
        m_name: editingMasterName.trim(),
        m_alias_name: editingMasterName.trim(),
      });

      if (res.data.success) {
        toast.success('Updated successfully');
        setEditingMasterId(null);
        setEditingMasterName('');
        await refreshMasterOptions();
        // Refresh grids to pull latest display names
        await Promise.all([fetchFuelLogs(), fetchExpenses()]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update');
    }
  };

  const handleDeleteMaster = async (mId: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await api.delete(`/school/masters/${mId}`);
      if (res.data.success) {
        toast.success('Deleted successfully');
        await refreshMasterOptions();
        await Promise.all([fetchFuelLogs(), fetchExpenses()]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete. It might be in use.');
    }
  };

  // Fuel Log CRUD
  const handleSaveFuelLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuelForm.vehicle_id || !fuelForm.fuel_type_id || !fuelForm.quantity || !fuelForm.rate_per_liter || !fuelForm.odometer || !fuelForm.vendor_id) {
      toast.error('Please fill all required fields');
      return;
    }

    const payload = {
      ...fuelForm,
      vehicle_id: parseInt(fuelForm.vehicle_id),
      fuel_type_id: parseInt(fuelForm.fuel_type_id),
      quantity: parseFloat(fuelForm.quantity),
      rate_per_liter: parseFloat(fuelForm.rate_per_liter),
      total_amount: parseFloat(fuelForm.total_amount) || (parseFloat(fuelForm.quantity) * parseFloat(fuelForm.rate_per_liter)),
      odometer: parseInt(fuelForm.odometer),
      vendor_id: parseInt(fuelForm.vendor_id),
    };

    try {
      let res;
      if (editingFuelLog) {
        res = await api.put(`/school/transport-fuel-logs/${editingFuelLog.id}`, payload);
      } else {
        res = await api.post('/school/transport-fuel-logs', payload);
      }

      if (res.data.success) {
        toast.success(editingFuelLog ? 'Fuel log updated' : 'Fuel log added');
        setIsFuelModalOpen(false);
        setEditingFuelLog(null);
        fetchFuelLogs();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save fuel log');
    }
  };

  const handleEditFuelLog = (log: FuelLog) => {
    setEditingFuelLog(log);
    setFuelForm({
      vehicle_id: log.vehicle_id.toString(),
      refill_date: log.refill_date,
      fuel_type_id: log.fuel_type_id.toString(),
      quantity: log.quantity.toString(),
      rate_per_liter: log.rate_per_liter.toString(),
      total_amount: log.total_amount.toString(),
      odometer: log.odometer.toString(),
      mileage: log.mileage ? log.mileage.toString() : '',
      vendor_id: log.vendor_id.toString(),
      invoice_number: log.invoice_number || '',
      notes: log.notes || '',
      status: log.status,
    });
    handleVehicleChange(log.vehicle_id.toString());
    setIsFuelModalOpen(true);
  };

  const handleDeleteFuelLog = async (id: number) => {
    const action = showTrashed ? 'permanently delete' : 'delete';
    if (!window.confirm(`Are you sure you want to ${action} this fuel log?` + (showTrashed ? ' This cannot be undone.' : ''))) return;
    try {
      let res;
      if (showTrashed) {
        res = await api.delete(`/school/transport-fuel-logs/${id}/force`);
      } else {
        res = await api.delete(`/school/transport-fuel-logs/${id}`);
      }
      if (res.data.success) {
        toast.success(showTrashed ? 'Fuel log permanently deleted' : 'Fuel log deleted');
        fetchFuelLogs();
      }
    } catch (err) {
      toast.error(`Failed to ${action} fuel log`);
    }
  };

  const handleRestoreFuelLog = async (id: number) => {
    if (!window.confirm('Are you sure you want to restore this fuel log?')) return;
    try {
      const res = await api.post(`/school/transport-fuel-logs/${id}/restore`);
      if (res.data.success) {
        toast.success('Fuel log restored successfully');
        fetchFuelLogs();
      }
    } catch (err) {
      toast.error('Failed to restore fuel log');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredFuelLogs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredFuelLogs.map(log => log.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmMsg = showTrashed 
      ? `Are you sure you want to permanently delete these ${selectedIds.length} fuel logs?`
      : `Are you sure you want to delete these ${selectedIds.length} fuel logs?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.post('/school/transport-fuel-logs/bulk-delete', {
        ids: selectedIds,
        force: showTrashed
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Bulk delete successful');
        setSelectedIds([]);
        fetchFuelLogs();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed bulk delete');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to restore these ${selectedIds.length} fuel logs?`)) return;

    try {
      const res = await api.post('/school/transport-fuel-logs/bulk-restore', {
        ids: selectedIds
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Bulk restore successful');
        setSelectedIds([]);
        fetchFuelLogs();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed bulk restore');
    }
  };

  const downloadSampleFile = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Fuel Logs');

      worksheet.columns = [
        { header: 'Vehicle Number *', key: 'vehicle_number', width: 18 },
        { header: 'Refill Date (YYYY-MM-DD) *', key: 'refill_date', width: 22 },
        { header: 'Fuel Type *', key: 'fuel_type', width: 15 },
        { header: 'Quantity (Liters) *', key: 'quantity', width: 18 },
        { header: 'Rate per Liter (₹) *', key: 'rate_per_liter', width: 18 },
        { header: 'Total Amount (₹)', key: 'total_amount', width: 18 },
        { header: 'Odometer (km) *', key: 'odometer', width: 18 },
        { header: 'Vendor *', key: 'vendor', width: 20 },
        { header: 'Invoice Number', key: 'invoice_number', width: 18 },
        { header: 'Notes', key: 'notes', width: 25 },
        { header: 'Status (Pending/Approved/Rejected)', key: 'status', width: 25 },
      ];

      // Add a realistic example row
      worksheet.addRow({
        vehicle_number: vehicles.length > 0 ? vehicles[0].vehicle_number : 'DL-01-A-1234',
        refill_date: new Date().toISOString().split('T')[0],
        fuel_type: fuelTypes.length > 0 ? fuelTypes[0].m_alias_name : 'Diesel',
        quantity: '45.50',
        rate_per_liter: '95.00',
        total_amount: '4322.50',
        odometer: '12500',
        vendor: vendors.length > 0 ? vendors[0].m_alias_name : 'HP Station',
        invoice_number: 'INV-998822',
        notes: 'Full tank refill',
        status: 'Pending',
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_fuel_logs.xlsx');
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
          if (firstCell && (firstCell === 'Vehicle Number *' || firstCell?.toString().includes('Vehicle Number'))) {
            headerRowIndex = i;
            headers = rows[i].map((cell: any) => cell?.toString().trim() || '');
            break;
          }
        }

        if (headerRowIndex === -1) {
          toast.error('Could not find header row (e.g. "Vehicle Number *")');
          return;
        }

        const dataRows: any[] = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const hasData = row.some((cell: any) => cell && cell.toString().trim() !== '');
          if (!hasData) continue;

          const rowData: any = {};
          for (let j = 0; j < headers.length; j++) {
            const header = headers[j];
            const cleanHeader = header
              .replace(' *', '')
              .replace(' (YYYY-MM-DD)', '')
              .replace(' (₹)', '')
              .replace(' (Liters)', '')
              .replace(' (km)', '')
              .replace(' (Pending/Approved/Rejected)', '');
            rowData[cleanHeader] = row[j]?.toString() || '';
          }

          if (rowData['Vehicle Number'] && rowData['Refill Date'] && rowData['Quantity'] && rowData['Rate per Liter']) {
            dataRows.push(rowData);
          }
        }

        if (dataRows.length === 0) {
          toast.error('No valid data rows found. Ensure "Vehicle Number", "Refill Date", "Quantity" and "Rate per Liter" are filled.');
          return;
        }

        const payloadData = dataRows.map(row => ({
          vehicle_number: row['Vehicle Number'],
          refill_date: row['Refill Date'],
          fuel_type: row['Fuel Type'] || 'Diesel',
          quantity: parseFloat(row['Quantity']) || 0,
          rate_per_liter: parseFloat(row['Rate per Liter']) || 0,
          total_amount: parseFloat(row['Total Amount']) || (parseFloat(row['Quantity']) * parseFloat(row['Rate per Liter'])) || 0,
          odometer: parseInt(row['Odometer']) || 0,
          vendor: row['Vendor'] || 'HP Station',
          invoice_number: row['Invoice Number'] || null,
          notes: row['Notes'] || null,
          status: row['Status'] || 'Pending',
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
    // Reset input value to allow uploading same file again
    e.target.value = '';
  };

  const submitImport = async () => {
    setImporting(true);
    try {
      const response = await api.post('/school/transport-fuel-logs/bulk-import', { data: importData });
      if (response.data.success) {
        toast.success(response.data.message || 'Import successful!');
        setIsImportModalOpen(false);
        fetchFuelLogs();
      } else {
        toast.error(response.data.message || 'Import failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  // Expense CRUD
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.vehicle_id || !expenseForm.expense_type_id || !expenseForm.amount) {
      toast.error('Please fill all required fields');
      return;
    }

    const payload = {
      ...expenseForm,
      vehicle_id: parseInt(expenseForm.vehicle_id),
      expense_type_id: parseInt(expenseForm.expense_type_id),
      amount: parseFloat(expenseForm.amount),
      vendor_id: expenseForm.vendor_id ? parseInt(expenseForm.vendor_id) : null,
    };

    try {
      let res;
      if (editingExpense) {
        res = await api.put(`/school/transport-vehicle-expenses/${editingExpense.id}`, payload);
      } else {
        res = await api.post('/school/transport-vehicle-expenses', payload);
      }

      if (res.data.success) {
        toast.success(editingExpense ? 'Expense updated' : 'Expense recorded');
        setIsExpenseModalOpen(false);
        setEditingExpense(null);
        fetchExpenses();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save expense');
    }
  };

  const handleEditExpense = (exp: VehicleExpense) => {
    setEditingExpense(exp);
    setExpenseForm({
      vehicle_id: exp.vehicle_id.toString(),
      expense_date: exp.expense_date,
      expense_type_id: exp.expense_type_id.toString(),
      amount: exp.amount.toString(),
      vendor_id: exp.vendor_id ? exp.vendor_id.toString() : '',
      invoice_number: exp.invoice_number || '',
      notes: exp.notes || '',
      status: exp.status,
    });
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await api.delete(`/school/transport-vehicle-expenses/${id}`);
      if (res.data.success) {
        toast.success('Expense deleted');
        fetchExpenses();
      }
    } catch (err) {
      toast.error('Failed to delete expense');
    }
  };

  // Export spreadsheet helper
  const handleExport = (type: 'logs' | 'expenses') => {
    try {
      let dataToExport = [];
      let filename = '';

      if (type === 'logs') {
        filename = 'Fuel_Logs';
        dataToExport = filteredFuelLogs.map(l => ({
          'Vehicle Number': l.vehicle?.vehicle_number || 'N/A',
          'Model': l.vehicle?.model || 'N/A',
          'Refill Date': l.refill_date,
          'Fuel Type': l.fuel_type?.m_alias_name || 'N/A',
          'Quantity (Liters)': l.quantity,
          'Rate (₹/Liter)': l.rate_per_liter,
          'Total Amount (₹)': l.total_amount,
          'Odometer (km)': l.odometer,
          'Mileage (km/L)': l.mileage || 'N/A',
          'Vendor': l.vendor?.m_alias_name || 'N/A',
          'Invoice Number': l.invoice_number || '',
          'Status': l.status,
          'Notes': l.notes || '',
        }));
      } else {
        filename = 'Vehicle_Expenses';
        dataToExport = filteredExpenses.map(e => ({
          'Vehicle Number': e.vehicle?.vehicle_number || 'N/A',
          'Model': e.vehicle?.model || 'N/A',
          'Expense Date': e.expense_date,
          'Expense Type': e.expense_type?.m_alias_name || 'N/A',
          'Amount (₹)': e.amount,
          'Vendor': e.vendor?.m_alias_name || 'N/A',
          'Invoice Number': e.invoice_number || '',
          'Status': e.status,
          'Notes': e.notes || '',
        }));
      }

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, filename);
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Export completed successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export data');
    }
  };

  // Filter logs & expenses dynamically
  const filteredFuelLogs = fuelLogs.filter(log => {
    const vehicleNum = log.vehicle?.vehicle_number?.toLowerCase() || '';
    const vendorName = log.vendor?.m_alias_name?.toLowerCase() || '';
    const invoiceNum = log.invoice_number?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    const matchesSearch = vehicleNum.includes(query) || vendorName.includes(query) || invoiceNum.includes(query);
    const matchesVehicle = selectedVehicleFilter ? log.vehicle_id.toString() === selectedVehicleFilter : true;
    const matchesStatus = selectedStatusFilter ? log.status === selectedStatusFilter : true;

    return matchesSearch && matchesVehicle && matchesStatus;
  });

  const filteredExpenses = expenses.filter(exp => {
    const vehicleNum = exp.vehicle?.vehicle_number?.toLowerCase() || '';
    const vendorName = exp.vendor?.m_alias_name?.toLowerCase() || '';
    const invoiceNum = exp.invoice_number?.toLowerCase() || '';
    const notes = exp.notes?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    const matchesSearch = vehicleNum.includes(query) || vendorName.includes(query) || invoiceNum.includes(query) || notes.includes(query);
    const matchesVehicle = selectedVehicleFilter ? exp.vehicle_id.toString() === selectedVehicleFilter : true;
    const matchesStatus = selectedStatusFilter ? exp.status === selectedStatusFilter : true;

    return matchesSearch && matchesVehicle && matchesStatus;
  });

  // Analytics helper calculations
  const totalFuelCost = fuelLogs.reduce((acc, l) => acc + (parseFloat(l.total_amount as string) || 0), 0);
  const totalExpenseCost = expenses.reduce((acc, e) => acc + (parseFloat(e.amount as string) || 0), 0);
  const grandTotalCost = totalFuelCost + totalExpenseCost;
  const totalLiters = fuelLogs.reduce((acc, l) => acc + (parseFloat(l.quantity as string) || 0), 0);

  // Group costs by vehicle for dashboard charts
  const costByVehicleMap: Record<string, { fuel: number; expense: number; total: number }> = {};
  vehicles.forEach(v => {
    costByVehicleMap[v.vehicle_number] = { fuel: 0, expense: 0, total: 0 };
  });
  fuelLogs.forEach(l => {
    if (l.vehicle) {
      if (!costByVehicleMap[l.vehicle.vehicle_number]) {
        costByVehicleMap[l.vehicle.vehicle_number] = { fuel: 0, expense: 0, total: 0 };
      }
      costByVehicleMap[l.vehicle.vehicle_number].fuel += parseFloat(l.total_amount as string) || 0;
      costByVehicleMap[l.vehicle.vehicle_number].total += parseFloat(l.total_amount as string) || 0;
    }
  });
  expenses.forEach(e => {
    if (e.vehicle) {
      if (!costByVehicleMap[e.vehicle.vehicle_number]) {
        costByVehicleMap[e.vehicle.vehicle_number] = { fuel: 0, expense: 0, total: 0 };
      }
      costByVehicleMap[e.vehicle.vehicle_number].expense += parseFloat(e.amount as string) || 0;
      costByVehicleMap[e.vehicle.vehicle_number].total += parseFloat(e.amount as string) || 0;
    }
  });

  const costByVehicleArray = Object.entries(costByVehicleMap).map(([name, data]) => ({
    name,
    ...data
  })).sort((a, b) => b.total - a.total);

  // Group by expense type for chart
  const expenseTypeCostMap: Record<string, number> = {};
  expenses.forEach(e => {
    const typeName = e.expense_type?.m_alias_name || 'Others';
    expenseTypeCostMap[typeName] = (expenseTypeCostMap[typeName] || 0) + (parseFloat(e.amount as string) || 0);
  });
  const expenseTypeCostArray = Object.entries(expenseTypeCostMap).map(([type, amount]) => ({
    type,
    amount
  })).sort((a, b) => b.amount - a.amount);

  const lbl = 'block text-[8px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wider';
  const inp = 'w-full px-1.5 py-0.5 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition bg-white h-[23px]';
  const txa = 'w-full px-1.5 py-0.5 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition bg-white resize-none';
  const sel = 'w-full px-1.5 py-0.5 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition bg-white h-[23px]';

  return (
    <div className="space-y-3 text-xs">
      {/* Header Panel */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2">
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">⛽ Fuel Log & Expense Management</h3>
          <p className="text-[12px] text-gray-500">Track vehicle refill details, maintenance costs, vendors, and dynamic mileage analytics.</p>
        </div>
        
        {/* Quick Stats Panel */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-100 rounded px-2.5 py-0.5 text-center min-w-[70px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-400">Total Expenses</span>
            <span className="text-xs font-bold text-slate-700">₹{grandTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="bg-sky-50 border border-sky-100 rounded px-2.5 py-0.5 text-center min-w-[70px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-sky-500">Fuel Refilled</span>
            <span className="text-xs font-bold text-sky-700">{totalLiters.toFixed(2)} L</span>
          </div>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex border-b border-gray-200 bg-white rounded-lg p-1 gap-1">
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-blue-500 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          ⛽ Fuel Logs
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'logs' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {fuelLogs.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'expenses'
              ? 'bg-blue-500 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          💵 Expenses
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'expenses' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {expenses.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-blue-500 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          📊 Analytics
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'vendors'
              ? 'bg-blue-500 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          🏬 Dynamic Masters
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'vendors' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {vendors.length}
          </span>
        </button>
      </div>

      {/* Toolbar Area */}
      {activeTab !== 'analytics' && activeTab !== 'vendors' && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-2 py-1 w-44 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-gray-700 h-[28px]"
              />
            </div>

            <select
              value={selectedVehicleFilter}
              onChange={(e) => setSelectedVehicleFilter(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-gray-700 h-[28px]"
            >
              <option value="">All Vehicles</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.vehicle_number} ({v.model})</option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-gray-700 h-[28px]"
            >
              <option value="">All Status</option>
              {activeTab === 'logs' ? (
                <>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </>
              ) : (
                <>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </>
              )}
            </select>

            {/* Trashed Toggle - Fuel Logs Only */}
            {activeTab === 'logs' && (
              <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-1.5 py-0.5 h-[28px]">
                <span className="text-[10px] font-semibold text-gray-650">Trashed</span>
                <button
                  type="button"
                  onClick={() => setShowTrashed(prev => !prev)}
                  className={`relative inline-flex h-3.5 w-7 items-center rounded-full transition-colors duration-200 focus:outline-none ${showTrashed ? 'bg-red-500' : 'bg-gray-200'}`}
                >
                  <span
                    className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform duration-200 ${showTrashed ? 'translate-x-[15px]' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2 items-center">
            {activeTab === 'logs' && (
              <>
                <button
                  onClick={downloadSampleFile}
                  className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-xs font-medium cursor-pointer bg-white h-[28px]"
                  title="Download Fuel Log Import Template"
                >
                  📥 Sample
                </button>
                <label className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition cursor-pointer text-xs font-medium bg-white h-[28px]">
                  📤 Import
                  <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
                </label>
              </>
            )}

            <button
              onClick={() => handleExport(activeTab === 'logs' ? 'logs' : 'expenses')}
              className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-xs font-medium cursor-pointer bg-white h-[28px]"
            >
              Export
            </button>
            {activeTab === 'logs' ? (
              !showTrashed && (
                <button
                  onClick={() => {
                    setEditingFuelLog(null);
                    setFuelForm({
                      vehicle_id: '',
                      refill_date: new Date().toISOString().split('T')[0],
                      fuel_type_id: fuelTypes[0]?.m_id?.toString() || '',
                      quantity: '',
                      rate_per_liter: '',
                      total_amount: '',
                      odometer: '',
                      mileage: '',
                      vendor_id: vendors[0]?.m_id?.toString() || '',
                      invoice_number: '',
                      notes: '',
                      status: 'Pending',
                    });
                    setPrevOdometer(null);
                    setIsFuelModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition text-xs font-medium cursor-pointer h-[28px]"
                >
                  ➕ Add Fuel Log
                </button>
              )
            ) : (
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setExpenseForm({
                    vehicle_id: '',
                    expense_date: new Date().toISOString().split('T')[0],
                    expense_type_id: expenseTypes[0]?.m_id?.toString() || '',
                    amount: '',
                    vendor_id: vendors[0]?.m_id?.toString() || '',
                    invoice_number: '',
                    notes: '',
                    status: 'Paid',
                  });
                  setIsExpenseModalOpen(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition text-xs font-medium cursor-pointer h-[28px]"
              >
                ➕ Record Expense
              </button>
            )}
          </div>
        </div>
      )}

      {/* Trashed Warning Banner */}
      {activeTab === 'logs' && showTrashed && (
        <div className="bg-red-50 border border-red-200 px-4 py-1.5 flex items-center gap-2 text-red-700 text-xs font-semibold rounded-lg">
          ⚠️ You are viewing deleted fuel logs. You can restore them or permanently delete them below.
        </div>
      )}

      {/* Bulk Actions */}
      {activeTab === 'logs' && selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg flex items-center justify-between text-xs">
          <div className="text-blue-800 font-bold">⚡ {selectedIds.length} item(s) selected</div>
          <div className="flex items-center gap-1.5">
            {!showTrashed ? (
              <button
                onClick={handleBulkDelete}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold cursor-pointer transition"
              >
                🗑️ Delete Selected
              </button>
            ) : (
              <>
                <button
                  onClick={handleBulkRestore}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer transition"
                >
                  🔄 Restore Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold cursor-pointer transition"
                >
                  🗑️ Delete Permanently
                </button>
              </>
            )}
            <button 
              onClick={() => setSelectedIds([])} 
              className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-bold cursor-pointer transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

        {/* Tab 1: Fuel Logs Content */}
        {activeTab === 'logs' && (
          <div className="overflow-x-auto border border-gray-250 rounded-lg bg-white shadow-sm">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-gray-200 bg-slate-50/80 text-gray-755 font-bold uppercase text-[9px] whitespace-nowrap">
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={filteredFuelLogs.length > 0 && selectedIds.length === filteredFuelLogs.length}
                      onChange={toggleSelectAll}
                      className="rounded text-blue-500 focus:ring-blue-400 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Refill Date</th>
                  <th className="py-2.5 px-3">Fuel Type</th>
                  <th className="py-2.5 px-3">Quantity (L)</th>
                  <th className="py-2.5 px-3">Rate (₹/L)</th>
                  <th className="py-2.5 px-3">Total (₹)</th>
                  <th className="py-2.5 px-3">Odometer (km)</th>
                  <th className="py-2.5 px-3">Mileage (km/L)</th>
                  <th className="py-2.5 px-3">Vendor</th>
                  <th className="py-2.5 px-3">Invoice No</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={13} className="text-center py-6 px-3 text-slate-400">Loading fuel logs...</td>
                  </tr>
                ) : filteredFuelLogs.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="text-center py-6 px-3 text-slate-400">No fuel logs found</td>
                  </tr>
                ) : (
                  filteredFuelLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(log.id)}
                          onChange={() => toggleSelect(log.id)}
                          className="rounded text-blue-500 focus:ring-blue-400 cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {log.vehicle?.vehicle_number}
                        <span className="block text-[10px] text-slate-400 font-normal">{log.vehicle?.model}</span>
                      </td>
                      <td className="py-2 px-3">{log.refill_date}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-600 uppercase">
                          {log.fuel_type?.m_alias_name || 'Petrol'}
                        </span>
                      </td>
                      <td className="py-2 px-3">{log.quantity} L</td>
                      <td className="py-2 px-3">₹{log.rate_per_liter}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">₹{log.total_amount}</td>
                      <td className="py-2 px-3">{log.odometer.toLocaleString()}</td>
                      <td className="py-2 px-3">
                        {log.mileage ? (
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 font-bold rounded text-[10px] border border-green-200">
                            {log.mileage} km/L
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{log.vendor?.m_alias_name || 'N/A'}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{log.invoice_number || '-'}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          log.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex gap-2 justify-end">
                          {showTrashed ? (
                            <>
                              <button
                                onClick={() => handleRestoreFuelLog(log.id)}
                                className="p-1 hover:bg-slate-100 rounded text-emerald-600 transition-colors"
                                title="Restore"
                              >
                                🔄
                              </button>
                              <button
                                onClick={() => handleDeleteFuelLog(log.id)}
                                className="p-1 hover:bg-slate-100 rounded text-rose-600 transition-colors"
                                title="Permanently Delete"
                              >
                                🗑️
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditFuelLog(log)}
                                className="p-1 hover:bg-slate-100 rounded text-indigo-600 transition-colors"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteFuelLog(log.id)}
                                className="p-1 hover:bg-slate-100 rounded text-rose-600 transition-colors"
                                title="Delete"
                              >
                                🗑️
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
        )}


        {/* Tab 2: Expenses Content */}
        {activeTab === 'expenses' && (
          <div className="overflow-x-auto border border-gray-250 rounded-lg bg-white shadow-sm">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-gray-200 bg-slate-50/80 text-gray-755 font-bold uppercase text-[9px] whitespace-nowrap">
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Expense Type</th>
                  <th className="py-2.5 px-3">Amount (₹)</th>
                  <th className="py-2.5 px-3">Vendor</th>
                  <th className="py-2.5 px-3">Invoice No</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-6 px-3 text-slate-400">Loading expenses...</td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-6 px-3 text-slate-400">No expenses found</td>
                  </tr>
                ) : (
                  filteredExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {exp.vehicle?.vehicle_number}
                        <span className="block text-[10px] text-slate-400 font-normal">{exp.vehicle?.model}</span>
                      </td>
                      <td className="py-2 px-3">{exp.expense_date}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                          {exp.expense_type?.m_alias_name || 'Others'}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">₹{exp.amount}</td>
                      <td className="py-2 px-3 text-slate-600">{exp.vendor?.m_alias_name || 'N/A'}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{exp.invoice_number || '-'}</td>
                      <td className="py-2 px-3 text-slate-500 max-w-xs truncate">{exp.notes || '-'}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          exp.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : exp.status === 'Cancelled'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {exp.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEditExpense(exp)}
                            className="p-1 hover:bg-slate-100 rounded text-indigo-600 transition-colors"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1 hover:bg-slate-100 rounded text-rose-600 transition-colors"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Analytics Content */}
        {activeTab === 'analytics' && (
          <div className="p-6">
            {/* Visual Metric Panels */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Fuel Expense</p>
                <h3 className="text-xl font-bold text-slate-800 mt-1">₹{totalFuelCost.toLocaleString()}</h3>
                <span className="text-[10px] text-slate-400 block mt-1">Overall spent on fuel logs</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Other Expenses</p>
                <h3 className="text-xl font-bold text-slate-800 mt-1">₹{totalExpenseCost.toLocaleString()}</h3>
                <span className="text-[10px] text-slate-400 block mt-1">Maintenance, service, salary etc</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Grand Total Cost</p>
                <h3 className="text-xl font-bold text-slate-800 mt-1">₹{grandTotalCost.toLocaleString()}</h3>
                <span className="text-[10px] text-indigo-600 font-semibold block mt-1">Combined fleet expense</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Avg Refill Rate</p>
                <h3 className="text-xl font-bold text-slate-800 mt-1">
                  ₹{fuelLogs.length > 0 
                    ? (fuelLogs.reduce((acc, l) => acc + (parseFloat(l.rate_per_liter as string) || 0), 0) / fuelLogs.length).toFixed(2)
                    : '0.00'
                  }
                </h3>
                <span className="text-[10px] text-slate-400 block mt-1">Average fuel rate per liter</span>
              </div>
            </div>

            {/* Custom Interactive SVG/HTML Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Cost By Vehicle Bar Chart */}
              <div className="bg-white p-5 rounded-xl border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-4">💰 Cost Breakdown By Vehicle</h3>
                {costByVehicleArray.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-12">No data available</p>
                ) : (
                  <div className="space-y-4">
                    {costByVehicleArray.slice(0, 5).map(v => {
                      const maxCost = Math.max(...costByVehicleArray.map(item => item.total)) || 1;
                      const fuelWidth = (v.fuel / maxCost) * 100;
                      const expWidth = (v.expense / maxCost) * 100;
                      return (
                        <div key={v.name} className="text-xs">
                          <div className="flex justify-between font-semibold text-slate-700 mb-1">
                            <span>{v.name}</span>
                            <span>₹{v.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                            <div 
                              style={{ width: `${fuelWidth}%` }} 
                              className="h-full bg-sky-500" 
                              title={`Fuel: ₹${v.fuel.toLocaleString()}`}
                            />
                            <div 
                              style={{ width: `${expWidth}%` }} 
                              className="h-full bg-indigo-500" 
                              title={`Other Expenses: ₹${v.expense.toLocaleString()}`}
                            />
                          </div>
                          <div className="flex gap-3 text-[9px] text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block"/>Fuel: ₹{v.fuel.toLocaleString()}</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"/>Maintenance: ₹{v.expense.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Expenses by Category Pie-List */}
              <div className="bg-white p-5 rounded-xl border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-4">🔧 Expenses By Category</h3>
                {expenseTypeCostArray.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-12">No expenses recorded</p>
                ) : (
                  <div className="space-y-3">
                    {expenseTypeCostArray.map((item, idx) => {
                      const maxAmt = Math.max(...expenseTypeCostArray.map(i => i.amount)) || 1;
                      const barPercent = (item.amount / maxAmt) * 100;
                      const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-slate-500'];
                      const selectedColor = colors[idx % colors.length];

                      return (
                        <div key={item.type} className="text-xs">
                          <div className="flex justify-between text-slate-600 mb-1">
                            <span className="font-semibold">{item.type}</span>
                            <span className="font-bold text-slate-700">₹{item.amount.toLocaleString()}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-50 rounded-full">
                            <div 
                              style={{ width: `${barPercent}%` }} 
                              className={`h-full ${selectedColor} rounded-full`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Dynamic Masters View */}
        {activeTab === 'vendors' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Left Group Selection */}
              <div className="md:col-span-1 border-r border-slate-100 pr-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Choose Master Group</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSettingsGroup('FUEL_VENDOR');
                      setEditingMasterId(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                      settingsGroup === 'FUEL_VENDOR' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🏢 Fuel Vendors
                    <span className="bg-slate-200/50 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">{vendors.length}</span>
                  </button>
                  <button
                    onClick={() => {
                      setSettingsGroup('FUEL_TYPE');
                      setEditingMasterId(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                      settingsGroup === 'FUEL_TYPE' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ⛽ Fuel Types
                    <span className="bg-slate-200/50 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">{fuelTypes.length}</span>
                  </button>
                  <button
                    onClick={() => {
                      setSettingsGroup('VEHICLE_EXPENSE_TYPE');
                      setEditingMasterId(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                      settingsGroup === 'VEHICLE_EXPENSE_TYPE' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🛠️ Expense Categories
                    <span className="bg-slate-200/50 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">{expenseTypes.length}</span>
                  </button>
                </div>
              </div>

              {/* Right Add/Edit and Listing */}
              <div className="md:col-span-3 space-y-6">
                
                {/* Add New Input */}
                <form onSubmit={handleAddMaster} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                      Add New {settingsGroup === 'FUEL_VENDOR' ? 'Vendor' : settingsGroup === 'FUEL_TYPE' ? 'Fuel Type' : 'Expense Category'}
                    </label>
                    <input
                      type="text"
                      placeholder={`Enter name (e.g. ${settingsGroup === 'FUEL_VENDOR' ? 'Shell Petrol' : settingsGroup === 'FUEL_TYPE' ? 'CNG' : 'Tire replacement'})`}
                      value={newMasterName}
                      onChange={(e) => setNewMasterName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="self-end px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                  >
                    ➕ Add
                  </button>
                </form>

                {/* Master Records Listing Table */}
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-semibold">
                        <th className="p-3">Name</th>
                        <th className="p-3">Group</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const items = settingsGroup === 'FUEL_VENDOR' ? vendors : settingsGroup === 'FUEL_TYPE' ? fuelTypes : expenseTypes;
                        return items.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center p-6 text-slate-400">No master records found for this group.</td>
                          </tr>
                        ) : (
                          items.map(item => (
                            <tr key={item.m_id} className="hover:bg-slate-50/20">
                              <td className="p-3">
                                {editingMasterId === item.m_id ? (
                                  <form onSubmit={handleUpdateMaster} className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      value={editingMasterName}
                                      onChange={(e) => setEditingMasterName(e.target.value)}
                                      className="px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-indigo-500"
                                      autoFocus
                                    />
                                    <button type="submit" className="text-xs text-emerald-600 font-bold hover:underline">Save</button>
                                    <button type="button" onClick={() => setEditingMasterId(null)} className="text-xs text-slate-400 hover:underline">Cancel</button>
                                  </form>
                                ) : (
                                  <span className="font-semibold text-slate-700">{item.m_alias_name}</span>
                                )}
                              </td>
                              <td className="p-3"><span className="font-mono text-[10px] text-slate-400">{item.m_group}</span></td>
                              <td className="p-3">
                                <span className="px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 rounded">
                                  ACTIVE
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                {editingMasterId !== item.m_id && (
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => {
                                        setEditingMasterId(item.m_id);
                                        setEditingMasterName(item.m_alias_name);
                                      }}
                                      className="p-1 text-slate-400 hover:text-indigo-600"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMaster(item.m_id, item.m_alias_name)}
                                      className="p-1 text-slate-400 hover:text-rose-600"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        );
                      })()}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          </div>
        )}


      {/* Fuel Log Modal */}
      {isFuelModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-300 w-full max-w-lg overflow-hidden shadow-2xl transition-all flex flex-col max-h-[95vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-650 px-5 py-3 flex items-center justify-between text-white flex-shrink-0">
              <h2 className="text-sm font-extrabold tracking-tight flex items-center gap-1.5">
                {editingFuelLog ? '✏️ Edit Fuel Log' : '⛽ Add Fuel Log'}
              </h2>
              <button 
                onClick={() => {
                  setIsFuelModalOpen(false);
                  setEditingFuelLog(null);
                }} 
                className="text-white hover:text-slate-200 text-lg font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Form */}
            <form onSubmit={handleSaveFuelLog} className="p-3.5 space-y-2 text-xs font-semibold overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-2">
                {/* Vehicle Selection */}
                <div className="col-span-1">
                  <label className={lbl}>Select Vehicle *</label>
                  <SearchableSelect
                    options={vehicles.map(v => ({ value: v.id, label: `${v.vehicle_number} (${v.model})` }))}
                    value={fuelForm.vehicle_id}
                    onChange={(val) => {
                      setFuelForm(prev => ({ ...prev, vehicle_id: val }));
                      handleVehicleChange(val);
                    }}
                    placeholder="Select Vehicle"
                  />
                </div>

                {/* Refill Date */}
                <div className="col-span-1">
                  <label className={lbl}>Refill Date *</label>
                  <input
                    required
                    type="date"
                    value={fuelForm.refill_date}
                    onChange={(e) => setFuelForm(prev => ({ ...prev, refill_date: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Fuel Type */}
                <div className="col-span-1">
                  <label className={lbl}>Fuel Type *</label>
                  <SearchableSelect
                    options={fuelTypes.map(f => ({ value: f.m_id, label: f.m_alias_name }))}
                    value={fuelForm.fuel_type_id}
                    onChange={(val) => setFuelForm(prev => ({ ...prev, fuel_type_id: val }))}
                    placeholder="Select Fuel Type"
                  />
                </div>

                {/* Quantity */}
                <div className="col-span-1">
                  <label className={lbl}>Quantity (Liters) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={fuelForm.quantity}
                    onChange={(e) => setFuelForm(prev => ({ ...prev, quantity: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Rate Per Liter */}
                <div className="col-span-1">
                  <label className={lbl}>Rate per Liter (₹) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={fuelForm.rate_per_liter}
                    onChange={(e) => setFuelForm(prev => ({ ...prev, rate_per_liter: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Total Amount (Auto Calculated) */}
                <div className="col-span-1">
                  <label className={lbl}>Total Amount (₹)</label>
                  <input
                    type="text"
                    disabled
                    value={fuelForm.total_amount}
                    className="w-full px-1.5 py-0.5 text-[10px] border border-slate-200 rounded bg-slate-50 text-slate-600 font-bold h-[23px]"
                  />
                </div>

                {/* Odometer Reading */}
                <div className="col-span-1">
                  <label className={lbl}>Odometer (km) *</label>
                  <input
                    required
                    type="number"
                    placeholder="Current reading"
                    value={fuelForm.odometer}
                    onChange={(e) => setFuelForm(prev => ({ ...prev, odometer: e.target.value }))}
                    className={inp}
                  />
                  {prevOdometer !== null && (
                    <span className="text-[8px] text-slate-400 block mt-0.5 font-normal leading-none">Prev: {prevOdometer.toLocaleString()}</span>
                  )}
                </div>

                {/* Mileage (Auto Calculated) */}
                <div className="col-span-1">
                  <label className={lbl}>Mileage (km/L)</label>
                  <input
                    type="text"
                    disabled
                    placeholder="Auto-calculated"
                    value={fuelForm.mileage ? `${fuelForm.mileage} km/L` : 'First fill'}
                    className="w-full px-1.5 py-0.5 text-[10px] border border-slate-200 rounded bg-slate-50 text-slate-600 font-semibold h-[23px]"
                  />
                </div>

                {/* Status selection */}
                <div className="col-span-1">
                  <label className={lbl}>Status</label>
                  <SearchableSelect
                    options={[
                      { value: 'Pending', label: '⏳ Pending' },
                      { value: 'Approved', label: '✅ Approved' },
                      { value: 'Rejected', label: '❌ Rejected' }
                    ]}
                    value={fuelForm.status}
                    onChange={(val) => setFuelForm(prev => ({ ...prev, status: val }))}
                    placeholder="Select Status"
                  />
                </div>

                {/* Fuel Vendor */}
                <div className="col-span-2">
                  <label className={lbl}>Vendor *</label>
                  <SearchableSelect
                    options={vendors.map(v => ({ value: v.m_id, label: v.m_alias_name }))}
                    value={fuelForm.vendor_id}
                    onChange={(val) => setFuelForm(prev => ({ ...prev, vendor_id: val }))}
                    placeholder="Select Vendor"
                  />
                </div>

                {/* Invoice Number */}
                <div className="col-span-1">
                  <label className={lbl}>Invoice Number</label>
                  <input
                    type="text"
                    placeholder="Invoice/Receipt"
                    value={fuelForm.invoice_number}
                    onChange={(e) => setFuelForm(prev => ({ ...prev, invoice_number: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Notes */}
                <div className="col-span-3">
                  <label className={lbl}>Notes</label>
                  <textarea
                    rows={1.5}
                    placeholder="Additional notes..."
                    value={fuelForm.notes}
                    onChange={(e) => setFuelForm(prev => ({ ...prev, notes: e.target.value }))}
                    className={txa}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsFuelModalOpen(false);
                    setEditingFuelLog(null);
                  }}
                  className="px-4 py-1 border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded transition-colors font-bold cursor-pointer text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors font-bold shadow-xs cursor-pointer text-[10px]"
                >
                  Save Fuel Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-300 w-full max-w-lg overflow-hidden shadow-2xl transition-all flex flex-col max-h-[95vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-650 px-5 py-3 flex items-center justify-between text-white flex-shrink-0">
              <h2 className="text-sm font-extrabold tracking-tight flex items-center gap-1.5">
                {editingExpense ? '✏️ Edit Expense Record' : '🛠️ Record Vehicle Expense'}
              </h2>
              <button 
                onClick={() => {
                  setIsExpenseModalOpen(false);
                  setEditingExpense(null);
                }} 
                className="text-white hover:text-slate-200 text-lg font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Form */}
            <form onSubmit={handleSaveExpense} className="p-3.5 space-y-2 text-xs font-semibold overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-2">
                {/* Vehicle Selection */}
                <div className="col-span-1">
                  <label className={lbl}>Select Vehicle *</label>
                  <SearchableSelect
                    options={vehicles.map(v => ({ value: v.id, label: `${v.vehicle_number} (${v.model})` }))}
                    value={expenseForm.vehicle_id}
                    onChange={(val) => setExpenseForm(prev => ({ ...prev, vehicle_id: val }))}
                    placeholder="Select Vehicle"
                  />
                </div>

                {/* Expense Date */}
                <div className="col-span-1">
                  <label className={lbl}>Expense Date *</label>
                  <input
                    required
                    type="date"
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, expense_date: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Expense Type */}
                <div className="col-span-1">
                  <label className={lbl}>Expense Category *</label>
                  <SearchableSelect
                    options={expenseTypes.map(e => ({ value: e.m_id, label: e.m_alias_name }))}
                    value={expenseForm.expense_type_id}
                    onChange={(val) => setExpenseForm(prev => ({ ...prev, expense_type_id: val }))}
                    placeholder="Select Category"
                  />
                </div>

                {/* Amount */}
                <div className="col-span-1">
                  <label className={lbl}>Amount (₹) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Status selection */}
                <div className="col-span-1">
                  <label className={lbl}>Status</label>
                  <SearchableSelect
                    options={[
                      { value: 'Paid', label: '✅ Paid' },
                      { value: 'Pending', label: '⏳ Pending' },
                      { value: 'Cancelled', label: '❌ Cancelled' }
                    ]}
                    value={expenseForm.status}
                    onChange={(val) => setExpenseForm(prev => ({ ...prev, status: val }))}
                    placeholder="Select Status"
                  />
                </div>

                {/* Invoice Number */}
                <div className="col-span-1">
                  <label className={lbl}>Invoice Number</label>
                  <input
                    type="text"
                    placeholder="Invoice/Receipt"
                    value={expenseForm.invoice_number}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, invoice_number: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Vendor selection */}
                <div className="col-span-3">
                  <label className={lbl}>Vendor (Optional)</label>
                  <SearchableSelect
                    options={vendors.map(v => ({ value: v.m_id, label: v.m_alias_name }))}
                    value={expenseForm.vendor_id}
                    onChange={(val) => setExpenseForm(prev => ({ ...prev, vendor_id: val }))}
                    placeholder="Select Vendor"
                    isClearable={true}
                  />
                </div>

                {/* Notes */}
                <div className="col-span-3">
                  <label className={lbl}>Notes</label>
                  <textarea
                    rows={1.5}
                    placeholder="Provide details about the service/part replaced..."
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                    className={txa}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsExpenseModalOpen(false);
                    setEditingExpense(null);
                  }}
                  className="px-4 py-1 border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded transition-colors font-bold cursor-pointer text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors font-bold shadow-xs cursor-pointer text-[10px]"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Excel Data Import Preview Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-300 w-full max-w-4xl overflow-hidden shadow-2xl transition-all flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-650 px-5 py-3 flex items-center justify-between text-white flex-shrink-0">
              <h2 className="text-sm font-extrabold tracking-tight">Excel Data Import Preview ({importData.length} records)</h2>
              <button onClick={() => setIsImportModalOpen(false)} className="text-white hover:text-slate-200 text-lg font-bold cursor-pointer">✕</button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              <p className="text-xs text-slate-500 mb-2">Showing preview of first 5 rows to be imported. Correct mapping will be done automatically using vehicle registration numbers and fuel masters.</p>
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50 font-bold uppercase text-[9px]">
                    <th className="py-2 px-3">Vehicle Number</th>
                    <th className="py-2 px-3">Refill Date</th>
                    <th className="py-2 px-3">Fuel Type</th>
                    <th className="py-2 px-3">Quantity</th>
                    <th className="py-2 px-3">Rate</th>
                    <th className="py-2 px-3">Total Amount</th>
                    <th className="py-2 px-3">Odometer</th>
                    <th className="py-2 px-3">Vendor</th>
                    <th className="py-2 px-3">Invoice</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {importPreview.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-1.5 px-3 font-semibold">{row['Vehicle Number']}</td>
                      <td className="py-1.5 px-3">{row['Refill Date']}</td>
                      <td className="py-1.5 px-3">{row['Fuel Type']}</td>
                      <td className="py-1.5 px-3">{row['Quantity']}</td>
                      <td className="py-1.5 px-3">{row['Rate per Liter']}</td>
                      <td className="py-1.5 px-3">{row['Total Amount']}</td>
                      <td className="py-1.5 px-3">{row['Odometer']}</td>
                      <td className="py-1.5 px-3">{row['Vendor']}</td>
                      <td className="py-1.5 px-3">{row['Invoice Number']}</td>
                      <td className="py-1.5 px-3">{row['Status']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 px-5 py-3 flex items-center justify-end gap-2 border-t border-slate-150 flex-shrink-0">
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded transition font-bold cursor-pointer text-xs bg-white"
              >
                Cancel
              </button>
              <button 
                disabled={importing}
                onClick={submitImport}
                className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition font-bold cursor-pointer text-xs"
              >
                {importing ? 'Importing...' : 'Confirm Bulk Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelManager;
