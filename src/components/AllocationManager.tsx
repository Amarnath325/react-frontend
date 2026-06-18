import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import Select from 'react-select';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface User {
  full_name: string;
}

interface StudentClass {
  m_id: number;
  m_name: string;
  m_alias_name: string;
}

interface Student {
  id: number;
  full_name: string;
  admission_number: string;
  roll_number: string | null;
  class_id: number | null;
  class_name: string | null;
  section: string | null;
  parent_name: string | null;
  parent_contact: string | null;
}

interface TransportRoute {
  id: number;
  route_name: string;
  route_code: string;
  amount: string;
}

interface TransportStop {
  id: number;
  stop_name: string;
  route_id: number;
  fare: string;
}

interface MasterOption {
  id: number;
  name: string;
  alias: string;
}

interface TransportAllocation {
  id: number;
  school_id: number;
  student_id: number;
  route_id: number;
  stop_id: number;
  academic_year_id: number | null;
  pickup_time: string | null;
  drop_time: string | null;
  monthly_fee: string;
  fee_status_id: number;
  allocation_status_id: number;
  special_notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  student?: {
    id: number;
    admission_number: string;
    roll_number: string | null;
    section: string | null;
    father_name: string | null;
    guardian_name: string | null;
    mother_name: string | null;
    father_mobile: string | null;
    guardian_mobile: string | null;
    parent_phone: string | null;
    mother_mobile: string | null;
    user?: User;
    class?: StudentClass;
  };
  route?: TransportRoute;
  stop?: TransportStop;
  fee_status?: {
    m_id: number;
    m_name: string;
    m_alias_name: string;
  };
  allocation_status?: {
    m_id: number;
    m_name: string;
    m_alias_name: string;
  };
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

const AllocationManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending' | 'reports'>('all');
  
  // Data lists
  const [allocations, setAllocations] = useState<TransportAllocation[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [stops, setStops] = useState<TransportStop[]>([]);
  
  // Master lists
  const [allocationStatuses, setAllocationStatuses] = useState<MasterOption[]>([]);
  const [feeStatuses, setFeeStatuses] = useState<MasterOption[]>([]);
  const [classes, setClasses] = useState<MasterOption[]>([]);

  // Count metrics
  const [tabStats, setTabStats] = useState({
    All: 0,
    Active: 0,
    Pending: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Filters
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>('');
  const [selectedStopFilter, setSelectedStopFilter] = useState<string>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');

  // Soft Delete & Bulk Selections
  const [showTrashed, setShowTrashed] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingAllocation, setEditingAllocation] = useState<TransportAllocation | null>(null);

  // Excel Import
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  // Form State
  const [form, setForm] = useState({
    student_id: '',
    class_name: 'Select Student',
    section: 'Select Student',
    roll_number: 'Select Student',
    parent_name: 'Select Student',
    parent_contact: 'Select Student',
    route_id: '',
    stop_id: '',
    pickup_time: '',
    drop_time: '',
    monthly_fee: '1500',
    fee_status_id: '',
    allocation_status_id: '',
    special_notes: '',
  });

  // Load masters & initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchAllocations();
  }, [showTrashed]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [mastersRes, studentsRes] = await Promise.all([
        api.get('/school/student-transports/masters'),
        api.get('/school/student-transports/eligible-students')
      ]);

      if (mastersRes.data.success) {
        const d = mastersRes.data.data;
        setRoutes(d.routes);
        setStops(d.stops);
        setAllocationStatuses(d.allocation_statuses);
        setFeeStatuses(d.fee_statuses);
        setClasses(d.classes);
      }

      if (studentsRes.data.success) {
        setStudents(studentsRes.data.data);
      }

      await fetchAllocations();
    } catch (error) {
      console.error('Error loading allocations configurations:', error);
      toast.error('Failed to load dynamic configurations');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllocations = async () => {
    try {
      const params: any = { only_trashed: showTrashed };
      const res = await api.get('/school/student-transports', { params });
      if (res.data.success) {
        setAllocations(res.data.data);
        if (res.data.stats) {
          setTabStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching allocations:', err);
    }
  };

  // Form student change -> Autofill details
  const handleStudentChange = (studentIdStr: string) => {
    if (!studentIdStr) {
      setForm(prev => ({
        ...prev,
        student_id: '',
        class_name: 'Select Student',
        section: 'Select Student',
        roll_number: 'Select Student',
        parent_name: 'Select Student',
        parent_contact: 'Select Student',
      }));
      return;
    }

    const student = students.find(s => s.id.toString() === studentIdStr);
    if (student) {
      setForm(prev => ({
        ...prev,
        student_id: studentIdStr,
        class_name: student.class_name || 'N/A',
        section: student.section || 'N/A',
        roll_number: student.roll_number || 'N/A',
        parent_name: student.parent_name || 'N/A',
        parent_contact: student.parent_contact || 'N/A',
      }));
    }
  };

  // Form Route Change -> Dynamic Stop filtering, reset stop & autofill monthly fee from route amount
  const handleRouteChange = (routeIdStr: string) => {
    const route = routes.find(r => r.id.toString() === routeIdStr);
    setForm(prev => ({
      ...prev,
      route_id: routeIdStr,
      stop_id: '', // reset selected stop
      monthly_fee: route ? parseFloat(route.amount).toString() : prev.monthly_fee,
    }));
  };

  // Form Stop Change
  const handleStopChange = (stopIdStr: string) => {
    setForm(prev => ({
      ...prev,
      stop_id: stopIdStr,
    }));
  };

  const handleSaveAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.route_id || !form.stop_id || !form.fee_status_id || !form.allocation_status_id || !form.monthly_fee) {
      toast.error('Please fill all required fields');
      return;
    }

    const payload = {
      student_id: parseInt(form.student_id),
      route_id: parseInt(form.route_id),
      stop_id: parseInt(form.stop_id),
      pickup_time: form.pickup_time || null,
      drop_time: form.drop_time || null,
      monthly_fee: parseFloat(form.monthly_fee),
      fee_status_id: parseInt(form.fee_status_id),
      allocation_status_id: parseInt(form.allocation_status_id),
      special_notes: form.special_notes || null,
    };

    try {
      let res;
      if (editingAllocation) {
        res = await api.put(`/school/student-transports/${editingAllocation.id}`, payload);
      } else {
        res = await api.post('/school/student-transports', payload);
      }

      if (res.data.success) {
        toast.success(editingAllocation ? 'Allocation updated successfully' : 'Allocation registered successfully');
        setIsFormModalOpen(false);
        setEditingAllocation(null);
        fetchAllocations();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save transport allocation');
    }
  };

  const handleEditAllocation = (alloc: TransportAllocation) => {
    setEditingAllocation(alloc);
    
    const sName = alloc.student?.user?.full_name || 'N/A';
    const cName = alloc.student?.class?.m_alias_name || alloc.student?.class?.m_name || 'N/A';
    const sec = alloc.student?.section || 'N/A';
    const roll = alloc.student?.roll_number || 'N/A';
    const pName = alloc.student?.father_name || (alloc.student?.guardian_name || (alloc.student?.mother_name || 'N/A'));
    const pContact = alloc.student?.father_mobile || (alloc.student?.guardian_mobile || (alloc.student?.parent_phone || (alloc.student?.mother_mobile || 'N/A')));

    setForm({
      student_id: alloc.student_id.toString(),
      class_name: cName,
      section: sec,
      roll_number: roll,
      parent_name: pName,
      parent_contact: pContact,
      route_id: alloc.route_id.toString(),
      stop_id: alloc.stop_id.toString(),
      pickup_time: alloc.pickup_time || '',
      drop_time: alloc.drop_time || '',
      monthly_fee: parseFloat(alloc.monthly_fee).toString(),
      fee_status_id: alloc.fee_status_id.toString(),
      allocation_status_id: alloc.allocation_status_id.toString(),
      special_notes: alloc.special_notes || '',
    });

    setIsFormModalOpen(true);
  };

  const handleDeleteAllocation = async (id: number) => {
    const action = showTrashed ? 'permanently delete' : 'delete';
    if (!window.confirm(`Are you sure you want to ${action} this transport allocation?` + (showTrashed ? ' This cannot be undone.' : ''))) return;

    try {
      let res;
      if (showTrashed) {
        res = await api.delete(`/school/student-transports/${id}/force`);
      } else {
        res = await api.delete(`/school/student-transports/${id}`);
      }

      if (res.data.success) {
        toast.success(showTrashed ? 'Permanently deleted' : 'Moved to trash');
        fetchAllocations();
      }
    } catch (err) {
      toast.error(`Failed to ${action} allocation`);
    }
  };

  const handleRestoreAllocation = async (id: number) => {
    if (!window.confirm('Are you sure you want to restore this allocation?')) return;
    try {
      const res = await api.post(`/school/student-transports/${id}/restore`);
      if (res.data.success) {
        toast.success('Allocation restored successfully');
        fetchAllocations();
      }
    } catch (err) {
      toast.error('Failed to restore allocation');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAllocations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAllocations.map(a => a.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmMsg = showTrashed
      ? `Are you sure you want to permanently delete these ${selectedIds.length} allocations?`
      : `Are you sure you want to move these ${selectedIds.length} allocations to trash?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.post('/school/student-transports/bulk-delete', {
        ids: selectedIds,
        force: showTrashed
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Bulk delete successful');
        setSelectedIds([]);
        fetchAllocations();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed bulk delete');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to restore these ${selectedIds.length} allocations?`)) return;

    try {
      const res = await api.post('/school/student-transports/bulk-restore', {
        ids: selectedIds
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Bulk restore successful');
        setSelectedIds([]);
        fetchAllocations();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed bulk restore');
    }
  };

  // Excel Sample download
  const downloadSampleFile = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Allocations');

      worksheet.columns = [
        { header: 'Student Admission Number *', key: 'student_admission_number', width: 25 },
        { header: 'Route Code *', key: 'route_code', width: 15 },
        { header: 'Stop Name *', key: 'stop_name', width: 22 },
        { header: 'Pickup Time (HH:MM AM/PM)', key: 'pickup_time', width: 22 },
        { header: 'Drop Time (HH:MM AM/PM)', key: 'drop_time', width: 22 },
        { header: 'Monthly Fee *', key: 'monthly_fee', width: 15 },
        { header: 'Fee Status *', key: 'fee_status', width: 18 },
        { header: 'Allocation Status *', key: 'allocation_status', width: 20 },
        { header: 'Special Notes', key: 'special_notes', width: 30 },
      ];

      worksheet.addRow({
        student_admission_number: students.length > 0 ? students[0].admission_number : 'ADM-901',
        route_code: routes.length > 0 ? routes[0].route_code : 'RT-101',
        stop_name: stops.length > 0 ? stops[0].stop_name : 'Noida Sec 15',
        pickup_time: '07:30 AM',
        drop_time: '02:30 PM',
        monthly_fee: 1500,
        fee_status: 'Pending',
        allocation_status: 'Active',
        special_notes: 'Boarding point Noida main sector gate.',
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_transport_allocations.xlsx');
      toast.success('Sample template downloaded!');
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template');
    }
  };

  // Excel file upload parser
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
          if (firstCell && (firstCell === 'Student Admission Number *' || firstCell?.toString().includes('Student Admission Number'))) {
            headerRowIndex = i;
            headers = rows[i].map((cell: any) => cell?.toString().trim() || '');
            break;
          }
        }

        if (headerRowIndex === -1) {
          toast.error('Could not find header row (e.g. "Student Admission Number *")');
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
            const cleanHeader = header.replace(' *', '').replace(' (HH:MM AM/PM)', '');
            rowData[cleanHeader] = row[j]?.toString() || '';
          }
          dataRows.push(rowData);
        }

        const validPayloadRows = dataRows.filter(r => r['Student Admission Number'] && r['Route Code'] && r['Stop Name'] && r['Monthly Fee'] && r['Fee Status'] && r['Allocation Status']);

        if (validPayloadRows.length === 0) {
          toast.error('No valid rows found. Ensure required fields are filled.');
          return;
        }

        const payloadData = validPayloadRows.map(row => ({
          student_admission_number: row['Student Admission Number'],
          route_code: row['Route Code'],
          stop_name: row['Stop Name'],
          pickup_time: row['Pickup Time'] || null,
          drop_time: row['Drop Time'] || null,
          monthly_fee: parseFloat(row['Monthly Fee']),
          fee_status: row['Fee Status'],
          allocation_status: row['Allocation Status'],
          special_notes: row['Special Notes'] || null,
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
      const response = await api.post('/school/student-transports/bulk-import', { data: importData });
      if (response.data.success) {
        toast.success(response.data.message || 'Import successful!');
        setIsImportModalOpen(false);
        fetchAllocations();
      } else {
        toast.error(response.data.message || 'Import failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  // Filter allocation list
  const filteredAllocations = allocations.filter(a => {
    // Tab filtering
    if (activeTab === 'active' && a.allocation_status?.m_name !== 'ACTIVE') return false;
    if (activeTab === 'pending' && a.allocation_status?.m_name !== 'PENDING') return false;

    // Search query
    const search = searchQuery.toLowerCase();
    const studentName = (a.student?.user?.full_name || '').toLowerCase();
    const admNo = (a.student?.admission_number || '').toLowerCase();
    const rollNo = (a.student?.roll_number || '').toLowerCase();
    const rName = (a.route?.route_name || '').toLowerCase();
    const sName = (a.stop?.stop_name || '').toLowerCase();

    const matchesSearch = studentName.includes(search) || admNo.includes(search) || rollNo.includes(search) || rName.includes(search) || sName.includes(search);

    const matchesRoute = selectedRouteFilter ? a.route_id?.toString() === selectedRouteFilter : true;
    const matchesStop = selectedStopFilter ? a.stop_id?.toString() === selectedStopFilter : true;
    const matchesStatus = selectedStatusFilter ? a.allocation_status_id?.toString() === selectedStatusFilter : true;
    const matchesClass = selectedClassFilter ? a.student?.class_id?.toString() === selectedClassFilter : true;

    return matchesSearch && matchesRoute && matchesStop && matchesStatus && matchesClass;
  });

  // Calculate statistics for Reports view
  const activeCount = allocations.filter(a => a.allocation_status?.m_name === 'ACTIVE').length;
  const pendingCount = allocations.filter(a => a.allocation_status?.m_name === 'PENDING').length;
  const inactiveCount = allocations.filter(a => a.allocation_status?.m_name === 'INACTIVE').length;

  const totalMonthlyCollection = allocations
    .filter(a => a.allocation_status?.m_name === 'ACTIVE')
    .reduce((sum, a) => sum + parseFloat(a.monthly_fee || '0'), 0);

  const collectedFees = allocations
    .filter(a => a.allocation_status?.m_name === 'ACTIVE' && a.fee_status?.m_name === 'PAID')
    .reduce((sum, a) => sum + parseFloat(a.monthly_fee || '0'), 0);

  const pendingFees = allocations
    .filter(a => a.allocation_status?.m_name === 'ACTIVE' && a.fee_status?.m_name === 'PENDING')
    .reduce((sum, a) => sum + parseFloat(a.monthly_fee || '0'), 0);

  const overdueFees = allocations
    .filter(a => a.allocation_status?.m_name === 'ACTIVE' && a.fee_status?.m_name === 'OVERDUE')
    .reduce((sum, a) => sum + parseFloat(a.monthly_fee || '0'), 0);

  // Group allocations by route
  const routeDistribution = routes.map(r => {
    const count = allocations.filter(a => a.route_id === r.id && a.allocation_status?.m_name === 'ACTIVE').length;
    return { name: r.route_name, code: r.route_code, count };
  }).filter(rd => rd.count > 0);

  // Group allocations by class
  const classDistribution = classes.map(c => {
    const count = allocations.filter(a => a.student?.class_id === c.id && a.allocation_status?.m_name === 'ACTIVE').length;
    return { name: c.alias || c.name, count };
  }).filter(cd => cd.count > 0);

  // Stop filters in Toolbar based on Route selection
  const toolbarStops = selectedRouteFilter 
    ? stops.filter(s => s.route_id.toString() === selectedRouteFilter)
    : [];

  // Form Stop filters based on Route selection
  const formStops = form.route_id 
    ? stops.filter(s => s.route_id.toString() === form.route_id)
    : [];

  const lbl = 'block text-[8px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wider';
  const inp = 'w-full px-1.5 py-0.5 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition bg-white h-[23px]';
  const txa = 'w-full px-1.5 py-0.5 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition bg-white resize-none';

  return (
    <div className="space-y-3 text-xs">
      {/* Header Info Panel */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-xs">
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">👨‍🎓 Student Transport Boarding & Route Allocation</h3>
          <p className="text-[12px] text-gray-500">Manage boarding points, routes, timings, and fee allocations for individual school students.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-lg p-1 gap-1 shadow-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-655 hover:bg-gray-50'
          }`}
        >
          🎓 All Allocations
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {tabStats.All}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'active' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-655 hover:bg-gray-50'
          }`}
        >
          🟢 Active Allocations
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {tabStats.Active}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'pending' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-655 hover:bg-gray-50'
          }`}
        >
          ⏳ Pending Allocations
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {tabStats.Pending}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-655 hover:bg-gray-50'
          }`}
        >
          📊 Reports & Analytics
        </button>
      </div>

      {activeTab !== 'reports' ? (
        <>
          {/* Toolbar */}
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
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-2 py-1 w-44 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-gray-700 h-[28px]"
                />
              </div>

              <SearchableSelect
                options={routes.map(r => ({ value: r.id, label: `${r.route_name} (${r.route_code})` }))}
                value={selectedRouteFilter}
                onChange={(val) => {
                  setSelectedRouteFilter(val);
                  setSelectedStopFilter(''); // reset stop filter when route changes
                }}
                placeholder="Filter by Route"
                isClearable={true}
                className="w-44"
              />

              <SearchableSelect
                options={toolbarStops.map(s => ({ value: s.id, label: s.stop_name }))}
                value={selectedStopFilter}
                onChange={setSelectedStopFilter}
                placeholder="Filter by Stop"
                isClearable={true}
                disabled={!selectedRouteFilter}
                className="w-40"
              />

              <SearchableSelect
                options={classes.map(c => ({ value: c.id, label: c.alias || c.name }))}
                value={selectedClassFilter}
                onChange={setSelectedClassFilter}
                placeholder="Filter by Class"
                isClearable={true}
                className="w-32"
              />

              <SearchableSelect
                options={allocationStatuses.map(s => ({ value: s.id, label: s.alias }))}
                value={selectedStatusFilter}
                onChange={setSelectedStatusFilter}
                placeholder="Filter Status"
                isClearable={true}
                className="w-32"
              />

              {/* Trashed toggle */}
              <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-1.5 py-0.5 h-[28px]">
                <span className="text-[10px] font-semibold text-gray-500">Trashed</span>
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
                    setEditingAllocation(null);
                    setForm({
                      student_id: '',
                      class_name: 'Select Student',
                      section: 'Select Student',
                      roll_number: 'Select Student',
                      parent_name: 'Select Student',
                      parent_contact: 'Select Student',
                      route_id: '',
                      stop_id: '',
                      pickup_time: '',
                      drop_time: '',
                      monthly_fee: '1500',
                      fee_status_id: feeStatuses[0]?.id?.toString() || '',
                      allocation_status_id: allocationStatuses[0]?.id?.toString() || '',
                      special_notes: '',
                    });
                    setIsFormModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition text-xs font-medium cursor-pointer h-[28px] shadow-sm"
                >
                  ➕ Add Allocation
                </button>
              )}
            </div>
          </div>

          {/* Trashed Alert */}
          {showTrashed && (
            <div className="bg-red-50 border border-red-200 px-4 py-1.5 flex items-center gap-2 text-red-700 text-xs font-semibold rounded-lg">
              ⚠️ You are viewing deleted student allocations. You can restore them or permanently delete them below.
            </div>
          )}

          {/* Bulk Panel */}
          {selectedIds.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 p-2 rounded-lg flex items-center justify-between text-xs animate-fadeIn shadow-xs">
              <div className="text-indigo-800 font-bold">⚡ {selectedIds.length} item(s) selected</div>
              <div className="flex items-center gap-1.5">
                {!showTrashed ? (
                  <button
                    onClick={handleBulkDelete}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold cursor-pointer transition shadow-xs"
                  >
                    🗑️ Delete Selected
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleBulkRestore}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer transition shadow-xs"
                    >
                      🔄 Restore Selected
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold cursor-pointer transition shadow-xs"
                    >
                      ☠️ Force Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-8 text-center text-gray-500 font-bold">Loading allocations...</div>
            ) : filteredAllocations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No transport allocations found match the criteria.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white text-[10px] uppercase font-extrabold tracking-wider">
                    <th className="p-2.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredAllocations.length && filteredAllocations.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="p-2.5">Student Details</th>
                    <th className="p-2.5">Route & Stop</th>
                    <th className="p-2.5">Timings</th>
                    <th className="p-2.5 text-right">Monthly Fee</th>
                    <th className="p-2.5 text-center">Fee Status</th>
                    <th className="p-2.5 text-center">Allocation Status</th>
                    <th className="p-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {filteredAllocations.map(a => {
                    const student = a.student;
                    const studentName = student?.user?.full_name || 'N/A';
                    const cName = student?.class?.m_alias_name || student?.class?.m_name || 'N/A';
                    const parentName = student?.father_name || (student?.guardian_name || (student?.mother_name || 'N/A'));
                    const parentContact = student?.father_mobile || (student?.guardian_mobile || (student?.parent_phone || (student?.mother_mobile || 'N/A')));

                    const fStatus = a.fee_status?.m_name || 'PENDING';
                    const aStatus = a.allocation_status?.m_name || 'PENDING';

                    return (
                      <tr key={a.id} className="hover:bg-slate-50 transition duration-150">
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(a.id)}
                            onChange={() => toggleSelect(a.id)}
                            className="rounded border-gray-300 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="p-2">
                          <div className="font-bold text-gray-900 text-[12px]">{studentName}</div>
                          <div className="text-[10px] text-gray-500">
                            Adm No: <span className="font-medium text-slate-800">{student?.admission_number || 'N/A'}</span> | 
                            Class: <span className="font-medium text-slate-800">{cName} - {student?.section || 'A'}</span> | 
                            Roll: <span className="font-medium text-slate-800">{student?.roll_number || 'N/A'}</span>
                          </div>
                          <div className="text-[9px] text-indigo-600 mt-0.5">
                            Parent: {parentName} ({parentContact})
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="font-semibold text-slate-800">{a.route?.route_name || 'N/A'}</div>
                          <div className="text-[10px] text-slate-500 font-medium">Stop: {a.stop?.stop_name || 'N/A'}</div>
                          <div className="text-[9px] text-gray-400">Route Code: {a.route?.route_code || 'N/A'}</div>
                        </td>
                        <td className="p-2">
                          <div>🌅 Pickup: <span className="font-bold text-slate-700">{a.pickup_time || '--:--'}</span></div>
                          <div className="mt-0.5">🌆 Drop: <span className="font-bold text-slate-700">{a.drop_time || '--:--'}</span></div>
                        </td>
                        <td className="p-2 text-right font-extrabold text-slate-800 text-[12px]">
                          ₹{parseFloat(a.monthly_fee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            fStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : fStatus === 'OVERDUE'
                                ? 'bg-rose-50 text-rose-700 border-rose-100'
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {a.fee_status?.m_alias_name || fStatus}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            aStatus === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : aStatus === 'INACTIVE'
                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {aStatus === 'ACTIVE' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                            {a.allocation_status?.m_alias_name || aStatus}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {!showTrashed ? (
                              <>
                                <button
                                  onClick={() => handleEditAllocation(a)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                                  title="Edit Allocation"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteAllocation(a.id)}
                                  className="p-1 text-red-650 hover:bg-red-50 rounded transition cursor-pointer"
                                  title="Delete Allocation"
                                >
                                  🗑️
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleRestoreAllocation(a.id)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition cursor-pointer"
                                  title="Restore Allocation"
                                >
                                  🔄
                                </button>
                                <button
                                  onClick={() => handleDeleteAllocation(a.id)}
                                  className="p-1 text-rose-650 hover:bg-rose-50 rounded transition cursor-pointer"
                                  title="Permanently Delete"
                                >
                                  ☠️
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        /* Reports view */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-3 rounded-lg shadow-sm">
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Total Active Allocations</div>
              <div className="text-2xl font-black mt-1">{activeCount} Students</div>
              <div className="text-[9px] mt-1 opacity-75">Out of {allocations.length} total registrations</div>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Expected Collection</div>
              <div className="text-2xl font-black text-slate-800 mt-1">₹{totalMonthlyCollection.toLocaleString('en-IN')}</div>
              <div className="text-[9px] text-slate-500 mt-1">Total revenue generated from active users</div>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
              <div className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Fees Collected (Paid)</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">₹{collectedFees.toLocaleString('en-IN')}</div>
              <div className="text-[9px] text-slate-500 mt-1">
                {activeCount > 0 ? Math.round((collectedFees / totalMonthlyCollection) * 100) : 0}% recovery rate
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
              <div className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Outstanding (Pending/Overdue)</div>
              <div className="text-2xl font-black text-rose-600 mt-1">₹{(pendingFees + overdueFees).toLocaleString('en-IN')}</div>
              <div className="text-[9px] text-slate-500 mt-1">Pending: ₹{pendingFees} | Overdue: ₹{overdueFees}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Route Distribution */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-xs">
              <h4 className="font-bold text-gray-800 text-[12px] mb-2 border-b border-gray-100 pb-1">🚌 Students by Transport Route</h4>
              {routeDistribution.length === 0 ? (
                <div className="text-center p-6 text-gray-400 text-[11px]">No active route data available.</div>
              ) : (
                <div className="space-y-2 mt-1">
                  {routeDistribution.map(rd => {
                    const maxVal = Math.max(...routeDistribution.map(x => x.count));
                    const percentage = maxVal > 0 ? (rd.count / maxVal) * 100 : 0;
                    return (
                      <div key={rd.name} className="text-[11px]">
                        <div className="flex justify-between font-medium text-slate-700">
                          <span>{rd.name} ({rd.code})</span>
                          <span className="font-bold">{rd.count} student(s)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded mt-0.5 overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Class Distribution */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-xs">
              <h4 className="font-bold text-gray-800 text-[12px] mb-2 border-b border-gray-100 pb-1">🏫 Active Transport Boarders by Class</h4>
              {classDistribution.length === 0 ? (
                <div className="text-center p-6 text-gray-400 text-[11px]">No active class student data available.</div>
              ) : (
                <div className="space-y-2 mt-1">
                  {classDistribution.map(cd => {
                    const maxVal = Math.max(...classDistribution.map(x => x.count));
                    const percentage = maxVal > 0 ? (cd.count / maxVal) * 100 : 0;
                    return (
                      <div key={cd.name} className="text-[11px]">
                        <div className="flex justify-between font-medium text-slate-700">
                          <span>{cd.name}</span>
                          <span className="font-bold">{cd.count} student(s)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded mt-0.5 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded" style={{ width: `${percentage}%` }} />
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

      {/* Form Dialog Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-[550px] rounded-lg shadow-xl overflow-hidden border border-slate-200 animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-indigo-650 text-white p-3 flex justify-between items-center">
              <h4 className="font-bold text-[13px]">
                {editingAllocation ? '✏️ Edit Student Transport Allocation' : '👨‍🎓 Allocate Student to Transport'}
              </h4>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-white hover:text-gray-200 font-extrabold text-[15px] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAllocation} className="p-3.5 space-y-3">
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                {/* Student Select */}
                <div className="col-span-2">
                  <label className={lbl}>Student Name *</label>
                  <SearchableSelect
                    options={students.map(s => ({ value: s.id, label: `${s.full_name} (${s.admission_number})` }))}
                    value={form.student_id}
                    onChange={handleStudentChange}
                    placeholder="Search and select student..."
                    disabled={!!editingAllocation}
                  />
                </div>

                {/* Read-only details */}
                <div>
                  <label className={lbl}>Class</label>
                  <div className="w-full px-2 py-0.5 text-[10px] border border-slate-100 rounded bg-slate-50 text-slate-500 font-medium h-[23px] flex items-center">
                    {form.class_name}
                  </div>
                </div>

                <div>
                  <label className={lbl}>Section</label>
                  <div className="w-full px-2 py-0.5 text-[10px] border border-slate-100 rounded bg-slate-50 text-slate-500 font-medium h-[23px] flex items-center">
                    {form.section}
                  </div>
                </div>

                <div>
                  <label className={lbl}>Roll Number</label>
                  <div className="w-full px-2 py-0.5 text-[10px] border border-slate-100 rounded bg-slate-50 text-slate-500 font-medium h-[23px] flex items-center">
                    {form.roll_number}
                  </div>
                </div>

                <div>
                  <label className={lbl}>Parent Contact</label>
                  <div className="w-full px-2 py-0.5 text-[10px] border border-slate-100 rounded bg-slate-50 text-slate-500 font-medium h-[23px] flex items-center truncate">
                    {form.parent_name} ({form.parent_contact})
                  </div>
                </div>

                <div className="col-span-2 border-t border-slate-100 my-1"></div>

                {/* Route Select */}
                <div>
                  <label className={lbl}>Select Route *</label>
                  <SearchableSelect
                    options={routes.map(r => ({ value: r.id, label: `${r.route_name} (${r.route_code})` }))}
                    value={form.route_id}
                    onChange={handleRouteChange}
                    placeholder="Select transport route..."
                  />
                </div>

                {/* Stop Select */}
                <div>
                  <label className={lbl}>Select Stop *</label>
                  <SearchableSelect
                    options={formStops.map(s => ({ value: s.id, label: s.stop_name }))}
                    value={form.stop_id}
                    onChange={handleStopChange}
                    placeholder="Select boarding stop..."
                    disabled={!form.route_id}
                  />
                </div>

                {/* Pickup Time */}
                <div>
                  <label className={lbl}>Pickup Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 07:30 AM"
                    value={form.pickup_time}
                    onChange={(e) => setForm(prev => ({ ...prev, pickup_time: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Drop Time */}
                <div>
                  <label className={lbl}>Drop Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 02:30 PM"
                    value={form.drop_time}
                    onChange={(e) => setForm(prev => ({ ...prev, drop_time: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Monthly Fee */}
                <div>
                  <label className={lbl}>Monthly Fee (₹) *</label>
                  <input
                    type="number"
                    value={form.monthly_fee}
                    onChange={(e) => setForm(prev => ({ ...prev, monthly_fee: e.target.value }))}
                    className={inp}
                    min="0"
                  />
                </div>

                {/* Fee Status */}
                <div>
                  <label className={lbl}>Fee Status *</label>
                  <SearchableSelect
                    options={feeStatuses.map(s => ({ value: s.id, label: s.alias }))}
                    value={form.fee_status_id}
                    onChange={(val) => setForm(prev => ({ ...prev, fee_status_id: val }))}
                    placeholder="Select payment status..."
                  />
                </div>

                {/* Allocation Status */}
                <div className="col-span-2">
                  <label className={lbl}>Allocation Status *</label>
                  <SearchableSelect
                    options={allocationStatuses.map(s => ({ value: s.id, label: s.alias }))}
                    value={form.allocation_status_id}
                    onChange={(val) => setForm(prev => ({ ...prev, allocation_status_id: val }))}
                    placeholder="Select allocation status..."
                  />
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  <label className={lbl}>Special Notes</label>
                  <textarea
                    rows={2}
                    value={form.special_notes}
                    onChange={(e) => setForm(prev => ({ ...prev, special_notes: e.target.value }))}
                    className={txa}
                    placeholder="Any boarding instructions or driver alerts..."
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs font-semibold cursor-pointer hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold cursor-pointer transition shadow-xs"
                >
                  Save Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Verification Preview Dialog */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-[700px] rounded-lg shadow-xl overflow-hidden border border-slate-200 animate-scaleUp">
            <div className="bg-indigo-650 text-white p-3 flex justify-between items-center">
              <h4 className="font-bold text-[13px]">📥 Excel Import Verification Preview</h4>
              <button onClick={() => setIsImportModalOpen(false)} className="text-white hover:text-gray-200 font-extrabold text-[15px] cursor-pointer">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-[11px] text-gray-500">Below is a preview of the first 5 records parsed from your uploaded spreadsheet. Click <strong>Verify & Import</strong> to save all {importData.length} records into the database.</p>
              
              <div className="border border-slate-200 rounded overflow-x-auto max-h-56">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 font-bold">
                    <tr>
                      <th className="p-2">Admission No</th>
                      <th className="p-2">Route Code</th>
                      <th className="p-2">Stop Name</th>
                      <th className="p-2">Pickup Time</th>
                      <th className="p-2">Drop Time</th>
                      <th className="p-2 text-right">Fee</th>
                      <th className="p-2">Fee Status</th>
                      <th className="p-2">Alloc Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-2 font-medium text-slate-800">{row['Student Admission Number']}</td>
                        <td className="p-2 text-slate-700">{row['Route Code']}</td>
                        <td className="p-2 text-slate-700">{row['Stop Name']}</td>
                        <td className="p-2 text-slate-600">{row['Pickup Time'] || '--:--'}</td>
                        <td className="p-2 text-slate-600">{row['Drop Time'] || '--:--'}</td>
                        <td className="p-2 text-right text-slate-800 font-bold">₹{row['Monthly Fee']}</td>
                        <td className="p-2 text-slate-600">{row['Fee Status']}</td>
                        <td className="p-2 text-slate-600">{row['Allocation Status']}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs font-semibold cursor-pointer hover:bg-gray-50 transition"
                  disabled={importing}
                >
                  Cancel
                </button>
                <button
                  onClick={submitImport}
                  className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded text-xs font-bold cursor-pointer transition shadow-xs flex items-center gap-1.5"
                  disabled={importing}
                >
                  {importing ? 'Importing...' : 'Verify & Bulk Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllocationManager;
