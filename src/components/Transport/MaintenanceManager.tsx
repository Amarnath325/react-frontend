import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import Select from 'react-select';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface Vehicle {
  id: number;
  vehicle_number: string;
  model: string;
}

interface MasterOption {
  m_id: number;
  m_group: string;
  m_name: string;
  m_alias_name: string;
}

interface PartUsed {
  part_id: number;
  part_name: string;
  quantity: number;
  unit_cost: number;
}

interface MaintenancePart {
  id: number;
  school_id: number;
  part_name: string;
  part_number: string | null;
  quantity: number;
  unit_cost: number;
  reorder_level: number;
}

interface MaintenanceLog {
  id: number;
  school_id: number;
  academic_year_id: number | null;
  service_title: string;
  service_type_id: number;
  vehicle_id: number;
  priority_id: number;
  scheduled_date: string;
  estimated_duration: number; // hours
  status_id: number;
  assigned_mechanic: string | null;
  estimated_cost: number;
  actual_cost: number | null;
  description: string | null;
  parts_used: PartUsed[] | null;
  completed_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  service_type?: MasterOption;
  priority?: MasterOption;
  status?: MasterOption;
  vehicle?: Vehicle;
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
  disabled?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  isClearable = false,
  className = "",
  disabled = false,
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
        isDisabled={disabled}
        styles={compactSelectStyles}
        className="text-[11px]"
      />
    </div>
  );
};

const MaintenanceManager: React.FC = () => {
  // Tabs: 'all' | 'scheduled' | 'inprogress' | 'completed' | 'inventory'
  const [activeTab, setActiveTab] = useState<'all' | 'scheduled' | 'inprogress' | 'completed' | 'inventory'>('all');

  // Dynamic lists
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [parts, setParts] = useState<MaintenancePart[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Masters
  const [serviceTypes, setServiceTypes] = useState<MasterOption[]>([]);
  const [priorities, setPriorities] = useState<MasterOption[]>([]);
  const [statuses, setStatuses] = useState<MasterOption[]>([]);

  // Statistics
  const [tabStats, setTabStats] = useState({
    All: 0,
    Scheduled: 0,
    InProgress: 0,
    Completed: 0,
    Inventory: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('');

  // Trash & Multi selection
  const [showTrashed, setShowTrashed] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [editingLog, setEditingLog] = useState<MaintenanceLog | null>(null);

  const [isPartModalOpen, setIsPartModalOpen] = useState<boolean>(false);
  const [editingPart, setEditingPart] = useState<MaintenancePart | null>(null);

  // Excel Import
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  // Log Form State
  const [logForm, setLogForm] = useState({
    service_title: '',
    service_type_id: '',
    vehicle_id: '',
    priority_id: '',
    scheduled_date: '',
    estimated_duration: '',
    status_id: '',
    assigned_mechanic: '',
    estimated_cost: '',
    actual_cost: '',
    description: '',
    completed_date: '',
  });

  // Selected Parts list in schedule form
  const [selectedParts, setSelectedParts] = useState<{ part_id: string; quantity: number; unit_cost: number }[]>([]);

  // Part Form State
  const [partForm, setPartForm] = useState({
    part_name: '',
    part_number: '',
    quantity: '',
    unit_cost: '',
    reorder_level: '5',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [showTrashed]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, typesRes, prioritiesRes, statusesRes] = await Promise.all([
        api.get('/school/vehicles'),
        api.get('/master/group/MAINTENANCE_TYPE'),
        api.get('/master/group/MAINTENANCE_PRIORITY'),
        api.get('/master/group/MAINTENANCE_STATUS'),
      ]);

      if (vehiclesRes.data.success) setVehicles(vehiclesRes.data.data);
      if (typesRes.data.success) setServiceTypes(typesRes.data.data);
      if (prioritiesRes.data.success) setPriorities(prioritiesRes.data.data);
      if (statusesRes.data.success) setStatuses(statusesRes.data.data);

      await fetchParts();
      await fetchLogs();
    } catch (error) {
      console.error('Error fetching dynamic layout masters:', error);
      toast.error('Failed to load dynamic options');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const params: any = { only_trashed: showTrashed };
      const res = await api.get('/school/transport-maintenance-logs', { params });
      if (res.data.success) {
        setLogs(res.data.data);
        if (res.data.stats) {
          setTabStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const fetchParts = async () => {
    try {
      const res = await api.get('/school/transport-maintenance-parts');
      if (res.data.success) {
        setParts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching inventory parts:', err);
    }
  };

  // Save/Update Maintenance Log
  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.service_title || !logForm.service_type_id || !logForm.vehicle_id || !logForm.priority_id || !logForm.scheduled_date || !logForm.status_id) {
      toast.error('Please fill all required fields');
      return;
    }

    // Format parts payload
    const partsUsedPayload = selectedParts
      .filter(p => p.part_id !== '')
      .map(p => {
        const matchingPart = parts.find(x => x.id === parseInt(p.part_id));
        return {
          part_id: parseInt(p.part_id),
          part_name: matchingPart ? matchingPart.part_name : '',
          quantity: p.quantity,
          unit_cost: p.unit_cost,
        };
      });

    const payload = {
      ...logForm,
      service_type_id: parseInt(logForm.service_type_id),
      vehicle_id: parseInt(logForm.vehicle_id),
      priority_id: parseInt(logForm.priority_id),
      status_id: parseInt(logForm.status_id),
      estimated_duration: logForm.estimated_duration ? parseFloat(logForm.estimated_duration) : 0,
      estimated_cost: logForm.estimated_cost ? parseFloat(logForm.estimated_cost) : 0,
      actual_cost: logForm.actual_cost ? parseFloat(logForm.actual_cost) : null,
      parts_used: partsUsedPayload,
    };

    try {
      let res;
      if (editingLog) {
        res = await api.put(`/school/transport-maintenance-logs/${editingLog.id}`, payload);
      } else {
        res = await api.post('/school/transport-maintenance-logs', payload);
      }

      if (res.data.success) {
        toast.success(editingLog ? 'Log updated successfully' : 'Maintenance scheduled successfully');
        setIsLogModalOpen(false);
        setEditingLog(null);
        setSelectedParts([]);
        fetchLogs();
        fetchParts(); // reload quantities if deducted
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save log');
    }
  };

  const handleEditLog = (log: MaintenanceLog) => {
    setEditingLog(log);
    setLogForm({
      service_title: log.service_title,
      service_type_id: log.service_type_id.toString(),
      vehicle_id: log.vehicle_id.toString(),
      priority_id: log.priority_id.toString(),
      scheduled_date: log.scheduled_date,
      estimated_duration: log.estimated_duration.toString(),
      status_id: log.status_id.toString(),
      assigned_mechanic: log.assigned_mechanic || '',
      estimated_cost: log.estimated_cost.toString(),
      actual_cost: log.actual_cost ? log.actual_cost.toString() : '',
      description: log.description || '',
      completed_date: log.completed_date || '',
    });

    if (log.parts_used) {
      setSelectedParts(
        log.parts_used.map(p => ({
          part_id: p.part_id.toString(),
          quantity: p.quantity,
          unit_cost: p.unit_cost,
        }))
      );
    } else {
      setSelectedParts([]);
    }

    setIsLogModalOpen(true);
  };

  const handleDeleteLog = async (id: number) => {
    const action = showTrashed ? 'permanently delete' : 'delete';
    if (!window.confirm(`Are you sure you want to ${action} this log?` + (showTrashed ? ' This cannot be undone.' : ''))) return;
    try {
      let res;
      if (showTrashed) {
        res = await api.delete(`/school/transport-maintenance-logs/${id}/force`);
      } else {
        res = await api.delete(`/school/transport-maintenance-logs/${id}`);
      }
      if (res.data.success) {
        toast.success(showTrashed ? 'Permanently deleted' : 'Moved to trash');
        fetchLogs();
      }
    } catch (err) {
      toast.error(`Failed to ${action} log`);
    }
  };

  const handleRestoreLog = async (id: number) => {
    if (!window.confirm('Are you sure you want to restore this log?')) return;
    try {
      const res = await api.post(`/school/transport-maintenance-logs/${id}/restore`);
      if (res.data.success) {
        toast.success('Log restored successfully');
        fetchLogs();
      }
    } catch (err) {
      toast.error('Failed to restore log');
    }
  };

  // Parts list helper functions in scheduling form
  const addPartField = () => {
    setSelectedParts(prev => [...prev, { part_id: '', quantity: 1, unit_cost: 0 }]);
  };

  const removePartField = (idx: number) => {
    setSelectedParts(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePartFieldChange = (idx: number, field: 'part_id' | 'quantity' | 'unit_cost', value: any) => {
    setSelectedParts(prev => {
      const copy = [...prev];
      if (field === 'part_id') {
        copy[idx].part_id = value;
        const matchingPart = parts.find(p => p.id === parseInt(value));
        if (matchingPart) {
          copy[idx].unit_cost = matchingPart.unit_cost;
        }
      } else if (field === 'quantity') {
        copy[idx].quantity = parseInt(value) || 1;
      } else if (field === 'unit_cost') {
        copy[idx].unit_cost = parseFloat(value) || 0;
      }
      return copy;
    });
  };

  // Save/Update Part Inventory
  const handleSavePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partForm.part_name || !partForm.quantity || !partForm.unit_cost) {
      toast.error('Please fill all required fields');
      return;
    }

    const payload = {
      part_name: partForm.part_name,
      part_number: partForm.part_number || null,
      quantity: parseInt(partForm.quantity),
      unit_cost: parseFloat(partForm.unit_cost),
      reorder_level: parseInt(partForm.reorder_level) || 5,
    };

    try {
      let res;
      if (editingPart) {
        res = await api.put(`/school/transport-maintenance-parts/${editingPart.id}`, payload);
      } else {
        res = await api.post('/school/transport-maintenance-parts', payload);
      }

      if (res.data.success) {
        toast.success(editingPart ? 'Inventory part updated' : 'Part added to inventory');
        setIsPartModalOpen(false);
        setEditingPart(null);
        fetchParts();
        fetchLogs(); // updates count on badge
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save part');
    }
  };

  const handleEditPart = (p: MaintenancePart) => {
    setEditingPart(p);
    setPartForm({
      part_name: p.part_name,
      part_number: p.part_number || '',
      quantity: p.quantity.toString(),
      unit_cost: p.unit_cost.toString(),
      reorder_level: p.reorder_level.toString(),
    });
    setIsPartModalOpen(true);
  };

  const handleDeletePart = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this part from active inventory?')) return;
    try {
      const res = await api.delete(`/school/transport-maintenance-parts/${id}`);
      if (res.data.success) {
        toast.success('Part deleted');
        fetchParts();
        fetchLogs();
      }
    } catch (err) {
      toast.error('Failed to delete part');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLogs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLogs.map(l => l.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmMsg = showTrashed 
      ? `Are you sure you want to permanently delete these ${selectedIds.length} logs?`
      : `Are you sure you want to move these ${selectedIds.length} logs to trash?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.post('/school/transport-maintenance-logs/bulk-delete', {
        ids: selectedIds,
        force: showTrashed
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Bulk delete successful');
        setSelectedIds([]);
        fetchLogs();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed bulk delete');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to restore these ${selectedIds.length} logs?`)) return;

    try {
      const res = await api.post('/school/transport-maintenance-logs/bulk-restore', {
        ids: selectedIds
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Bulk restore successful');
        setSelectedIds([]);
        fetchLogs();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed bulk restore');
    }
  };

  const downloadSampleFile = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Maintenance');

      worksheet.columns = [
        { header: 'Service Title *', key: 'service_title', width: 22 },
        { header: 'Service Type *', key: 'service_type', width: 18 },
        { header: 'Vehicle Number *', key: 'vehicle_number', width: 18 },
        { header: 'Priority *', key: 'priority', width: 15 },
        { header: 'Scheduled Date *', key: 'scheduled_date', width: 18 },
        { header: 'Estimated Duration (hours) *', key: 'estimated_duration', width: 28 },
        { header: 'Status *', key: 'status', width: 15 },
        { header: 'Assigned Mechanic', key: 'assigned_mechanic', width: 20 },
        { header: 'Estimated Cost *', key: 'estimated_cost', width: 18 },
        { header: 'Actual Cost', key: 'actual_cost', width: 15 },
        { header: 'Description', key: 'description', width: 30 },
      ];

      worksheet.addRow({
        service_title: 'Oil Change',
        service_type: 'Regular Service',
        vehicle_number: vehicles.length > 0 ? vehicles[0].vehicle_number : 'DL-1PA-1234',
        priority: 'Normal',
        scheduled_date: '2026-06-18',
        estimated_duration: '2.5',
        status: 'Scheduled',
        assigned_mechanic: 'Nirmal Auto Care',
        estimated_cost: '3500.00',
        actual_cost: '',
        description: 'Scheduled Mobil engine oil change and filter swap.',
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_maintenance.xlsx');
      toast.success('Sample template downloaded!');
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template');
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
          if (firstCell && (firstCell === 'Service Title *' || firstCell?.toString().includes('Service Title'))) {
            headerRowIndex = i;
            headers = rows[i].map((cell: any) => cell?.toString().trim() || '');
            break;
          }
        }

        if (headerRowIndex === -1) {
          toast.error('Could not find header row (e.g. "Service Title *")');
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
            const cleanHeader = header.replace(' *', '').replace(' (hours)', '');
            rowData[cleanHeader] = row[j]?.toString() || '';
          }
          dataRows.push(rowData);
        }

        const validPayloadRows = dataRows.filter(r => r['Service Title'] && r['Service Type'] && r['Vehicle Number'] && r['Priority'] && r['Scheduled Date'] && r['Status']);

        if (validPayloadRows.length === 0) {
          toast.error('No valid rows found. Ensure required fields are filled.');
          return;
        }

        const payloadData = validPayloadRows.map(row => ({
          service_title: row['Service Title'],
          service_type: row['Service Type'],
          vehicle_number: row['Vehicle Number'],
          priority: row['Priority'],
          scheduled_date: row['Scheduled Date'],
          estimated_duration: parseFloat(row['Estimated Duration']) || 0,
          status: row['Status'],
          assigned_mechanic: row['Assigned Mechanic'] || null,
          estimated_cost: parseFloat(row['Estimated Cost']) || 0,
          actual_cost: row['Actual Cost'] ? parseFloat(row['Actual Cost']) : null,
          description: row['Description'] || null,
        }));

        setImportData(payloadData);
        setImportPreview(validPayloadRows.slice(0, 5));
        setIsImportModalOpen(true);
      } catch (error) {
        console.error('File read error:', error);
        toast.error('Failed to read file');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const submitImport = async () => {
    setImporting(true);
    try {
      const response = await api.post('/school/transport-maintenance-logs/bulk-import', { data: importData });
      if (response.data.success) {
        toast.success(response.data.message || 'Import successful!');
        setIsImportModalOpen(false);
        fetchLogs();
      } else {
        toast.error(response.data.message || 'Import failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  // Filters logic
  const filteredLogs = logs.filter(l => {
    // 1. Tab filters
    if (activeTab === 'scheduled' && l.status?.m_name !== 'SCHEDULED') return false;
    if (activeTab === 'inprogress' && l.status?.m_name !== 'IN PROGRESS') return false;
    if (activeTab === 'completed' && l.status?.m_name !== 'COMPLETED') return false;

    // 2. Toolbar filters
    const search = searchQuery.toLowerCase();
    const title = l.service_title.toLowerCase();
    const mech = (l.assigned_mechanic || '').toLowerCase();
    const veh = (l.vehicle?.vehicle_number || '').toLowerCase();
    const desc = (l.description || '').toLowerCase();

    const matchesSearch = title.includes(search) || mech.includes(search) || veh.includes(search) || desc.includes(search);
    const matchesVehicle = selectedVehicleFilter ? l.vehicle_id?.toString() === selectedVehicleFilter : true;
    const matchesStatus = selectedStatusFilter ? l.status_id?.toString() === selectedStatusFilter : true;
    const matchesType = selectedTypeFilter ? l.service_type_id?.toString() === selectedTypeFilter : true;

    return matchesSearch && matchesVehicle && matchesStatus && matchesType;
  });

  const lbl = 'block text-[8px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wider';
  const inp = 'w-full px-1.5 py-0.5 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition bg-white h-[23px]';
  const txa = 'w-full px-1.5 py-0.5 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition bg-white resize-none';

  return (
    <div className="space-y-3 text-xs">
      {/* Header Info Panel */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2">
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">🔧 Vehicle Maintenance & Service Ledger</h3>
          <p className="text-[12px] text-gray-500">Log routine bus servicing, breakdowns, mechanics invoices, and track spare parts inventory stock levels.</p>
        </div>
      </div>

      {/* Dynamic Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-lg p-1 gap-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'all' ? 'bg-blue-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          🔧 All Services
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {tabStats.All}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'scheduled' ? 'bg-blue-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          📅 Scheduled
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'scheduled' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {tabStats.Scheduled}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('inprogress')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'inprogress' ? 'bg-blue-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          ⚙️ In Progress
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'inprogress' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {tabStats.InProgress}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'completed' ? 'bg-blue-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          ✅ Completed
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {tabStats.Completed}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'inventory' ? 'bg-blue-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          📦 Inventory
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'inventory' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {tabStats.Inventory}
          </span>
        </button>
      </div>

      {activeTab !== 'inventory' ? (
        <>
          {/* Service Log Toolbar */}
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
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-2 py-1 w-44 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-gray-700 h-[28px]"
                />
              </div>

              <SearchableSelect
                options={vehicles.map(v => ({ value: v.id, label: v.vehicle_number }))}
                value={selectedVehicleFilter}
                onChange={setSelectedVehicleFilter}
                placeholder="Filter by Vehicle"
                isClearable={true}
                className="w-36"
              />

              <SearchableSelect
                options={serviceTypes.map(t => ({ value: t.m_id, label: t.m_alias_name }))}
                value={selectedTypeFilter}
                onChange={setSelectedTypeFilter}
                placeholder="Filter by Service"
                isClearable={true}
                className="w-36"
              />

              <SearchableSelect
                options={statuses.map(s => ({ value: s.m_id, label: s.m_alias_name }))}
                value={selectedStatusFilter}
                onChange={setSelectedStatusFilter}
                placeholder="Filter by Status"
                isClearable={true}
                className="w-36"
              />

              {/* Trashed Switch */}
              <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-1.5 py-0.5 h-[28px]">
                <span className="text-[10px] font-semibold text-gray-655">Trashed</span>
                <button
                  type="button"
                  onClick={() => setShowTrashed(prev => !prev)}
                  className={`relative inline-flex h-3.5 w-7 items-center rounded-full transition-colors duration-200 focus:outline-none ${showTrashed ? 'bg-red-50' : 'bg-gray-200'}`}
                >
                  <span
                    className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform duration-200 ${showTrashed ? 'translate-x-[15px] bg-red-600' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <button
                onClick={downloadSampleFile}
                className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-xs font-medium cursor-pointer bg-white h-[28px]"
                title="Download Template"
              >
                📥 Sample
              </button>
              <label className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition cursor-pointer text-xs font-medium bg-white h-[28px]">
                📤 Import
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
              </label>

              {!showTrashed && (
                <button
                  onClick={() => {
                    setEditingLog(null);
                    setLogForm({
                      service_title: '',
                      service_type_id: serviceTypes[0]?.m_id?.toString() || '',
                      vehicle_id: vehicles[0]?.id?.toString() || '',
                      priority_id: priorities[1]?.m_id?.toString() || '', // Default Normal
                      scheduled_date: '',
                      estimated_duration: '2',
                      status_id: statuses[0]?.m_id?.toString() || '',
                      assigned_mechanic: '',
                      estimated_cost: '',
                      actual_cost: '',
                      description: '',
                      completed_date: '',
                    });
                    setSelectedParts([]);
                    setIsLogModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition text-xs font-medium cursor-pointer h-[28px]"
                >
                  ➕ Schedule Service
                </button>
              )}
            </div>
          </div>

          {/* Trashed Alert */}
          {showTrashed && (
            <div className="bg-red-50 border border-red-200 px-4 py-1.5 flex items-center gap-2 text-red-700 text-xs font-semibold rounded-lg animate-fadeIn">
              ⚠️ You are viewing deleted maintenance records.
            </div>
          )}

          {/* Bulk Panel */}
          {selectedIds.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg flex items-center justify-between text-xs animate-fadeIn">
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

          {/* Logs List Table */}
          <div className="overflow-x-auto border border-gray-250 rounded-lg bg-white shadow-sm">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-gray-200 bg-slate-50/80 text-gray-755 font-bold uppercase text-[9px] whitespace-nowrap">
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={filteredLogs.length > 0 && selectedIds.length === filteredLogs.length}
                      onChange={toggleSelectAll}
                      className="rounded text-blue-500 focus:ring-blue-400 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">Service Details</th>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Scheduled Date</th>
                  <th className="py-2.5 px-3">Est. Duration</th>
                  <th className="py-2.5 px-3">Assigned Mechanic</th>
                  <th className="py-2.5 px-3">Cost Details</th>
                  <th className="py-2.5 px-3 w-44">Parts Replaced</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="text-center py-6 px-3 text-slate-400">Loading maintenance ledger...</td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center py-6 px-3 text-slate-400">No maintenance logs found</td>
                  </tr>
                ) : (
                  filteredLogs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(l.id)}
                          onChange={() => toggleSelect(l.id)}
                          className="rounded text-blue-500 focus:ring-blue-400 cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-semibold text-slate-900 block">{l.service_title}</span>
                        {l.description && <span className="text-[9px] text-slate-400 block max-w-xs truncate" title={l.description}>{l.description}</span>}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-805">{l.vehicle?.vehicle_number}</td>
                      <td className="py-2 px-3 text-slate-600 font-semibold">{l.service_type?.m_alias_name}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                          l.priority?.m_name === 'Urgent' ? 'bg-red-55 text-red-700 border border-red-200' :
                          l.priority?.m_name === 'High' ? 'bg-amber-55 text-amber-700 border border-amber-200' :
                          l.priority?.m_name === 'Normal' ? 'bg-blue-55 text-blue-705 border border-blue-200' :
                          'bg-slate-50 text-slate-500 border border-slate-200'
                        }`}>
                          {l.priority?.m_alias_name}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{l.scheduled_date}</td>
                      <td className="py-2 px-3 font-semibold text-slate-700 font-mono">{l.estimated_duration} hr(s)</td>
                      <td className="py-2 px-3 text-slate-655 font-semibold">{l.assigned_mechanic || '-'}</td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] text-slate-400 block">Est: ₹{l.estimated_cost}</span>
                        {l.actual_cost && <span className="font-bold text-slate-850 block">Act: ₹{l.actual_cost}</span>}
                      </td>
                      <td className="py-2 px-3 text-[10px]">
                        {l.parts_used && l.parts_used.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {l.parts_used.map((p, idx) => (
                              <span key={idx} className="bg-slate-100 border border-slate-200 rounded px-1 text-[8.5px] font-semibold text-slate-600">
                                {p.part_name} (x{p.quantity})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                          l.status?.m_name === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          l.status?.m_name === 'IN PROGRESS' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          l.status?.m_name === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}>
                          {l.status?.m_alias_name}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex gap-2 justify-end">
                          {showTrashed ? (
                            <>
                              <button
                                onClick={() => handleRestoreLog(l.id)}
                                className="p-1 hover:bg-slate-100 rounded text-emerald-600 transition-colors cursor-pointer"
                                title="Restore"
                              >
                                🔄
                              </button>
                              <button
                                onClick={() => handleDeleteLog(l.id)}
                                className="p-1 hover:bg-slate-100 rounded text-rose-600 transition-colors cursor-pointer"
                                title="Permanently Delete"
                              >
                                🗑️
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditLog(l)}
                                className="p-1 hover:bg-slate-100 rounded text-indigo-650 transition-colors cursor-pointer"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteLog(l.id)}
                                className="p-1 hover:bg-slate-100 rounded text-rose-605 transition-colors cursor-pointer"
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
        </>
      ) : (
        /* Inventory Tab View */
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-gray-50 border border-gray-150 p-2 rounded-lg text-xs">
            <div className="font-bold text-slate-800 text-[13px] flex items-center gap-1.5">
              <span>📦</span> Spare Parts & Maintenance Inventory
            </div>
            <button
              onClick={() => {
                setEditingPart(null);
                setPartForm({
                  part_name: '',
                  part_number: '',
                  quantity: '10',
                  unit_cost: '250',
                  reorder_level: '5',
                });
                setIsPartModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition text-xs font-semibold cursor-pointer"
            >
              ➕ Add Spare Part
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-250 rounded-lg bg-white shadow-sm">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-gray-200 bg-slate-50/80 text-gray-755 font-bold uppercase text-[9px] whitespace-nowrap">
                  <th className="py-2.5 px-3">Part Name</th>
                  <th className="py-2.5 px-3">Part Number / Serial</th>
                  <th className="py-2.5 px-3">Stock Quantity</th>
                  <th className="py-2.5 px-3">Unit Cost (₹)</th>
                  <th className="py-2.5 px-3">Reorder Threshold</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {parts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 px-3 text-slate-400">Inventory is empty. Register parts to track stock.</td>
                  </tr>
                ) : (
                  parts.map(p => {
                    const isOutOfStock = p.quantity <= 0;
                    const isLowStock = !isOutOfStock && p.quantity <= p.reorder_level;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-semibold text-slate-900">{p.part_name}</td>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-500">{p.part_number || '-'}</td>
                        <td className="py-2 px-3 font-bold text-slate-800">{p.quantity} units</td>
                        <td className="py-2 px-3 font-semibold text-slate-750">₹{p.unit_cost}</td>
                        <td className="py-2 px-3 text-slate-500">{p.reorder_level} units</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 text-[8.5px] font-extrabold rounded-full ${
                            isOutOfStock ? 'bg-red-100 text-red-800' :
                            isLowStock ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-105 bg-emerald-100 text-emerald-800'
                          }`}>
                            {isOutOfStock ? '⚠️ Out of Stock' : isLowStock ? '⚠️ Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleEditPart(p)}
                              className="p-1 hover:bg-slate-100 rounded text-indigo-650 transition cursor-pointer"
                              title="Edit Part"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeletePart(p.id)}
                              className="p-1 hover:bg-slate-100 rounded text-rose-600 transition cursor-pointer"
                              title="Delete Part"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule / Edit Service Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-350 w-full max-w-xl overflow-hidden shadow-2xl transition-all flex flex-col max-h-[95vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-650 px-5 py-3 flex items-center justify-between text-white flex-shrink-0">
              <h2 className="text-sm font-extrabold tracking-tight flex items-center gap-1.5">
                {editingLog ? '✏️ Edit Scheduled Maintenance' : '🔧 Schedule New Service'}
              </h2>
              <button 
                onClick={() => {
                  setIsLogModalOpen(false);
                  setEditingLog(null);
                  setSelectedParts([]);
                }} 
                className="text-white hover:text-slate-200 text-lg font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveLog} className="p-3.5 space-y-2.5 text-xs font-semibold overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-2">
                {/* Service Title */}
                <div className="col-span-1">
                  <label className={lbl}>Service Title *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Oil Change"
                    value={logForm.service_title}
                    onChange={(e) => setLogForm(prev => ({ ...prev, service_title: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Service Type */}
                <div className="col-span-1">
                  <label className={lbl}>Service Type *</label>
                  <SearchableSelect
                    options={serviceTypes.map(t => ({ value: t.m_id, label: t.m_alias_name }))}
                    value={logForm.service_type_id}
                    onChange={(val) => setLogForm(prev => ({ ...prev, service_type_id: val }))}
                    placeholder="Select Type"
                  />
                </div>

                {/* Vehicle */}
                <div className="col-span-1">
                  <label className={lbl}>Select Vehicle *</label>
                  <SearchableSelect
                    options={vehicles.map(v => ({ value: v.id, label: v.vehicle_number }))}
                    value={logForm.vehicle_id}
                    onChange={(val) => setLogForm(prev => ({ ...prev, vehicle_id: val }))}
                    placeholder="Select Vehicle"
                  />
                </div>

                {/* Priority */}
                <div className="col-span-1">
                  <label className={lbl}>Priority</label>
                  <SearchableSelect
                    options={priorities.map(p => ({ value: p.m_id, label: p.m_alias_name }))}
                    value={logForm.priority_id}
                    onChange={(val) => setLogForm(prev => ({ ...prev, priority_id: val }))}
                    placeholder="Select Priority"
                  />
                </div>

                {/* Scheduled Date */}
                <div className="col-span-1">
                  <label className={lbl}>Scheduled Date *</label>
                  <input
                    required
                    type="date"
                    value={logForm.scheduled_date}
                    onChange={(e) => setLogForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Estimated Duration */}
                <div className="col-span-1">
                  <label className={lbl}>Estimated Duration (hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="2"
                    value={logForm.estimated_duration}
                    onChange={(e) => setLogForm(prev => ({ ...prev, estimated_duration: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <label className={lbl}>Status</label>
                  <SearchableSelect
                    options={statuses.map(s => ({ value: s.m_id, label: s.m_alias_name }))}
                    value={logForm.status_id}
                    onChange={(val) => setLogForm(prev => ({ ...prev, status_id: val }))}
                    placeholder="Select Status"
                  />
                </div>

                {/* Assigned Mechanic */}
                <div className="col-span-1">
                  <label className={lbl}>Assigned Mechanic</label>
                  <input
                    type="text"
                    placeholder="Mechanic name/workshop"
                    value={logForm.assigned_mechanic}
                    onChange={(e) => setLogForm(prev => ({ ...prev, assigned_mechanic: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Estimated Cost */}
                <div className="col-span-1">
                  <label className={lbl}>Estimated Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={logForm.estimated_cost}
                    onChange={(e) => setLogForm(prev => ({ ...prev, estimated_cost: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Actual Cost */}
                {logForm.status_id === statuses.find(s => s.m_name === 'COMPLETED')?.m_id?.toString() && (
                  <div className="col-span-2">
                    <label className={lbl}>Actual Cost (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Actual bill cost"
                      value={logForm.actual_cost}
                      onChange={(e) => setLogForm(prev => ({ ...prev, actual_cost: e.target.value }))}
                      className={inp}
                    />
                  </div>
                )}

                {/* Description */}
                <div className="col-span-2">
                  <label className={lbl}>Description / Work Details</label>
                  <textarea
                    rows={2}
                    placeholder="Detailed description of service/repair..."
                    value={logForm.description}
                    onChange={(e) => setLogForm(prev => ({ ...prev, description: e.target.value }))}
                    className={txa}
                  />
                </div>

                {/* Parts Used dynamic list adder */}
                <div className="col-span-2 border-t border-slate-100 pt-2.5 mt-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-700">🔧 Parts Replaced</span>
                    <button
                      type="button"
                      onClick={addPartField}
                      className="px-2 py-0.5 border border-slate-350 hover:bg-slate-50 text-slate-800 rounded font-semibold text-[9px] cursor-pointer"
                    >
                      ➕ Add Part
                    </button>
                  </div>

                  {selectedParts.length === 0 ? (
                    <p className="text-[9.5px] text-slate-400 italic">No parts selected for replacement.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {selectedParts.map((sp, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <SearchableSelect
                            options={parts.map(p => ({ value: p.id, label: `${p.part_name} (In stock: ${p.quantity})` }))}
                            value={sp.part_id}
                            onChange={(val) => handlePartFieldChange(idx, 'part_id', val)}
                            placeholder="Select Part"
                            className="flex-1"
                          />
                          <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={sp.quantity}
                            onChange={(e) => handlePartFieldChange(idx, 'quantity', e.target.value)}
                            className="w-16 px-1 py-0.5 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 h-[23px]"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Cost"
                            value={sp.unit_cost}
                            onChange={(e) => handlePartFieldChange(idx, 'unit_cost', e.target.value)}
                            className="w-20 px-1 py-0.5 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 h-[23px]"
                          />
                          <button
                            type="button"
                            onClick={() => removePartField(idx)}
                            className="text-rose-500 text-[12px] font-bold cursor-pointer hover:bg-slate-50 px-1.5 py-0.2 rounded border border-slate-100"
                            title="Remove Part"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogModalOpen(false);
                    setEditingLog(null);
                    setSelectedParts([]);
                  }}
                  className="px-4 py-1 border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded transition-colors font-bold cursor-pointer text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors font-bold shadow-xs cursor-pointer text-[10px]"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spare Part Inventory Modal */}
      {isPartModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-350 w-full max-w-sm overflow-hidden shadow-2xl transition flex flex-col">
            <div className="bg-gradient-to-r from-violet-650 to-indigo-650 px-4 py-2.5 flex items-center justify-between text-white flex-shrink-0">
              <h2 className="text-xs font-extrabold tracking-tight">
                {editingPart ? '✏️ Edit Spare Part' : '📦 Add Spare Part to Inventory'}
              </h2>
              <button onClick={() => { setIsPartModalOpen(false); setEditingPart(null); }} className="text-white hover:text-slate-200 text-lg font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSavePart} className="p-3.5 space-y-2 text-xs font-semibold">
              <div>
                <label className={lbl}>Part Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Front Brake Pads"
                  value={partForm.part_name}
                  onChange={(e) => setPartForm(prev => ({ ...prev, part_name: e.target.value }))}
                  className={inp}
                />
              </div>

              <div>
                <label className={lbl}>Part Number / Serial</label>
                <input
                  type="text"
                  placeholder="e.g. BP-8890"
                  value={partForm.part_number}
                  onChange={(e) => setPartForm(prev => ({ ...prev, part_number: e.target.value }))}
                  className={inp}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Stock Quantity *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="10"
                    value={partForm.quantity}
                    onChange={(e) => setPartForm(prev => ({ ...prev, quantity: e.target.value }))}
                    className={inp}
                  />
                </div>

                <div>
                  <label className={lbl}>Unit Cost (₹) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="250"
                    value={partForm.unit_cost}
                    onChange={(e) => setPartForm(prev => ({ ...prev, unit_cost: e.target.value }))}
                    className={inp}
                  />
                </div>
              </div>

              <div>
                <label className={lbl}>Reorder Threshold Level *</label>
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="Threshold to trigger warnings"
                  value={partForm.reorder_level}
                  onChange={(e) => setPartForm(prev => ({ ...prev, reorder_level: e.target.value }))}
                  className={inp}
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => { setIsPartModalOpen(false); setEditingPart(null); }}
                  className="px-3 py-1 border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded transition font-bold cursor-pointer text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-indigo-650 hover:bg-indigo-700 text-white rounded transition font-bold shadow-xs cursor-pointer text-[10px]"
                >
                  Save Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Data Import Preview Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-350 w-full max-w-4xl overflow-hidden shadow-2xl transition-all flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-650 px-5 py-3 flex items-center justify-between text-white flex-shrink-0">
              <h2 className="text-sm font-extrabold tracking-tight">Excel Maintenance Import Preview ({importData.length} records)</h2>
              <button onClick={() => setIsImportModalOpen(false)} className="text-white hover:text-slate-200 text-lg font-bold cursor-pointer">✕</button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              <p className="text-xs text-slate-500 mb-2">Showing preview of first 5 rows to be imported. Vehicle number must match database records.</p>
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50 font-bold uppercase text-[9px]">
                    <th className="py-2 px-3">Service Title</th>
                    <th className="py-2 px-3">Service Type</th>
                    <th className="py-2 px-3">Vehicle Number</th>
                    <th className="py-2 px-3">Priority</th>
                    <th className="py-2 px-3">Scheduled Date</th>
                    <th className="py-2 px-3">Est. Duration</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Mechanic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {importPreview.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-1.5 px-3 font-semibold">{row['Service Title']}</td>
                      <td className="py-1.5 px-3">{row['Service Type']}</td>
                      <td className="py-1.5 px-3 font-bold">{row['Vehicle Number']}</td>
                      <td className="py-1.5 px-3">{row['Priority']}</td>
                      <td className="py-1.5 px-3">{row['Scheduled Date']}</td>
                      <td className="py-1.5 px-3">{row['Estimated Duration']} hr(s)</td>
                      <td className="py-1.5 px-3">{row['Status']}</td>
                      <td className="py-1.5 px-3">{row['Assigned Mechanic']}</td>
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

export default MaintenanceManager;
