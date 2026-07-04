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

interface Driver {
  id: number;
  full_name: string;
}

interface MasterOption {
  m_id: number;
  m_group: string;
  m_name: string;
  m_alias_name: string;
}

interface Complaint {
  id: number;
  school_id: number;
  academic_year_id: number | null;
  complainant_name: string;
  contact_info: string | null;
  complaint_type_id: number;
  priority_id: number;
  status_id: number;
  subject: string;
  description: string;
  vehicle_id: number | null;
  driver_id: number | null;
  attachments: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  complaint_type?: MasterOption;
  priority?: MasterOption;
  status?: MasterOption;
  vehicle?: Vehicle;
  driver?: Driver;
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

const ComplaintManager: React.FC = () => {
  // Tab states: 'all' | 'open' | 'in_progress' | 'resolved' | 'feedback'
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'feedback'>('all');
  
  // Data lists
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  // Master options loaded dynamically
  const [complaintTypes, setComplaintTypes] = useState<MasterOption[]>([]);
  const [priorities, setPriorities] = useState<MasterOption[]>([]);
  const [statuses, setStatuses] = useState<MasterOption[]>([]);
  
  // Stats for tab counts
  const [tabStats, setTabStats] = useState<Record<string, number>>({
    All: 0,
    Open: 0,
    'In Progress': 0,
    Resolved: 0,
    Feedback: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');

  // Trash and Selection states
  const [showTrashed, setShowTrashed] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Modals
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState<boolean>(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);

  // Import Excel States
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  // Complaint Form State
  const [complaintForm, setComplaintForm] = useState({
    complainant_name: '',
    contact_info: '',
    complaint_type_id: '',
    priority_id: '',
    status_id: '',
    subject: '',
    description: '',
    vehicle_id: '',
    driver_id: '',
    attachments: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [showTrashed]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, driversRes, typesRes, prioritiesRes, statusesRes] = await Promise.all([
        api.get('/school/vehicles'),
        api.get('/school/drivers'),
        api.get('/master/group/COMPLAINT_TYPE'),
        api.get('/master/group/COMPLAINT_PRIORITY'),
        api.get('/master/group/COMPLAINT_STATUS'),
      ]);

      if (vehiclesRes.data.success) setVehicles(vehiclesRes.data.data);
      if (driversRes.data.success) setDrivers(driversRes.data.data);
      if (typesRes.data.success) setComplaintTypes(typesRes.data.data);
      if (prioritiesRes.data.success) setPriorities(prioritiesRes.data.data);
      if (statusesRes.data.success) setStatuses(statusesRes.data.data);

      await fetchComplaints();
    } catch (error) {
      console.error('Error fetching dynamic initial data:', error);
      toast.error('Failed to load dynamic options');
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      const params: any = { only_trashed: showTrashed };
      const res = await api.get('/school/transport-complaints', { params });
      if (res.data.success) {
        setComplaints(res.data.data);
        if (res.data.stats) {
          setTabStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
    }
  };

  const handleSaveComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintForm.complainant_name || !complaintForm.complaint_type_id || !complaintForm.priority_id || !complaintForm.status_id || !complaintForm.subject || !complaintForm.description) {
      toast.error('Please fill all required fields');
      return;
    }

    const payload = {
      ...complaintForm,
      complaint_type_id: parseInt(complaintForm.complaint_type_id),
      priority_id: parseInt(complaintForm.priority_id),
      status_id: parseInt(complaintForm.status_id),
      vehicle_id: complaintForm.vehicle_id ? parseInt(complaintForm.vehicle_id) : null,
      driver_id: complaintForm.driver_id ? parseInt(complaintForm.driver_id) : null,
    };

    try {
      let res;
      if (editingComplaint) {
        res = await api.put(`/school/transport-complaints/${editingComplaint.id}`, payload);
      } else {
        res = await api.post('/school/transport-complaints', payload);
      }

      if (res.data.success) {
        toast.success(editingComplaint ? 'Log updated successfully' : 'Complaint logged successfully');
        setIsComplaintModalOpen(false);
        setEditingComplaint(null);
        fetchComplaints();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save complaint');
    }
  };

  const handleEditComplaint = (log: Complaint) => {
    setEditingComplaint(log);
    setComplaintForm({
      complainant_name: log.complainant_name,
      contact_info: log.contact_info || '',
      complaint_type_id: log.complaint_type_id.toString(),
      priority_id: log.priority_id.toString(),
      status_id: log.status_id.toString(),
      subject: log.subject,
      description: log.description,
      vehicle_id: log.vehicle_id ? log.vehicle_id.toString() : '',
      driver_id: log.driver_id ? log.driver_id.toString() : '',
      attachments: log.attachments || '',
    });
    setIsComplaintModalOpen(true);
  };

  const handleDeleteComplaint = async (id: number) => {
    const action = showTrashed ? 'permanently delete' : 'delete';
    if (!window.confirm(`Are you sure you want to ${action} this complaint log?` + (showTrashed ? ' This cannot be undone.' : ''))) return;
    try {
      let res;
      if (showTrashed) {
        res = await api.delete(`/school/transport-complaints/${id}/force`);
      } else {
        res = await api.delete(`/school/transport-complaints/${id}`);
      }
      if (res.data.success) {
        toast.success(showTrashed ? 'Permanently deleted' : 'Moved to trash');
        fetchComplaints();
      }
    } catch (err) {
      toast.error(`Failed to ${action} complaint`);
    }
  };

  const handleRestoreComplaint = async (id: number) => {
    if (!window.confirm('Are you sure you want to restore this complaint?')) return;
    try {
      const res = await api.post(`/school/transport-complaints/${id}/restore`);
      if (res.data.success) {
        toast.success('Complaint restored successfully');
        fetchComplaints();
      }
    } catch (err) {
      toast.error('Failed to restore complaint');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredComplaints.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredComplaints.map(c => c.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmMsg = showTrashed 
      ? `Are you sure you want to permanently delete these ${selectedIds.length} complaints?`
      : `Are you sure you want to move these ${selectedIds.length} complaints to trash?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.post('/school/transport-complaints/bulk-delete', {
        ids: selectedIds,
        force: showTrashed
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Bulk delete successful');
        setSelectedIds([]);
        fetchComplaints();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed bulk delete');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to restore these ${selectedIds.length} complaints?`)) return;

    try {
      const res = await api.post('/school/transport-complaints/bulk-restore', {
        ids: selectedIds
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Bulk restore successful');
        setSelectedIds([]);
        fetchComplaints();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed bulk restore');
    }
  };

  const downloadSampleFile = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Complaints');

      worksheet.columns = [
        { header: 'Complainant Name *', key: 'complainant_name', width: 22 },
        { header: 'Contact', key: 'contact_info', width: 20 },
        { header: 'Type *', key: 'type', width: 15 },
        { header: 'Priority *', key: 'priority', width: 15 },
        { header: 'Status *', key: 'status', width: 15 },
        { header: 'Subject *', key: 'subject', width: 25 },
        { header: 'Description *', key: 'description', width: 35 },
        { header: 'Vehicle Number', key: 'vehicle_number', width: 18 },
        { header: 'Driver Name', key: 'driver_name', width: 18 },
        { header: 'Attachments', key: 'attachments', width: 25 },
      ];

      // Add dummy pre-filled row
      worksheet.addRow({
        complainant_name: 'Kunal Goel',
        contact_info: 'kunal@gmail.com',
        type: 'Complaint',
        priority: 'Medium',
        status: 'Open',
        subject: 'Bus Delayed',
        description: 'Bus #1 was delayed by 20 minutes at Rohini Sec 15 stop.',
        vehicle_number: vehicles.length > 0 ? vehicles[0].vehicle_number : 'DL-1PA-1234',
        driver_name: drivers.length > 0 ? drivers[0].full_name : 'Satish Singh',
        attachments: 'https://example.com/attachment.jpg',
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_complaints.xlsx');
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
          if (firstCell && (firstCell === 'Complainant Name *' || firstCell?.toString().includes('Complainant Name'))) {
            headerRowIndex = i;
            headers = rows[i].map((cell: any) => cell?.toString().trim() || '');
            break;
          }
        }

        if (headerRowIndex === -1) {
          toast.error('Could not find header row (e.g. "Complainant Name *")');
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
            const cleanHeader = header.replace(' *', '');
            rowData[cleanHeader] = row[j]?.toString() || '';
          }

          if (rowData['Complainant Name'] && rowData['Type'] && rowData['Priority'] && rowData['Status'] && rowData['Subject'] && rowData['Description']) {
            dataRows.push(rowData);
          }
        }

        if (dataRows.length === 0) {
          toast.error('No valid data rows found. Ensure required fields (Complainant Name, Type, Priority, Status, Subject, Description) are filled.');
          return;
        }

        const payloadData = dataRows.map(row => ({
          complainant_name: row['Complainant Name'],
          contact_info: row['Contact'] || null,
          type: row['Type'],
          priority: row['Priority'],
          status: row['Status'],
          subject: row['Subject'],
          description: row['Description'],
          vehicle_number: row['Vehicle Number'] || null,
          driver_name: row['Driver Name'] || null,
          attachments: row['Attachments'] || null,
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
    e.target.value = '';
  };

  const submitImport = async () => {
    setImporting(true);
    try {
      const response = await api.post('/school/transport-complaints/bulk-import', { data: importData });
      if (response.data.success) {
        toast.success(response.data.message || 'Import successful!');
        setIsImportModalOpen(false);
        fetchComplaints();
      } else {
        toast.error(response.data.message || 'Import failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  // Filter complaints based on Tab selection & search filters
  const filteredComplaints = complaints.filter(c => {
    // 1. Tab filters
    if (activeTab === 'open' && c.status?.m_name !== 'Open') return false;
    if (activeTab === 'in_progress' && c.status?.m_name !== 'In Progress') return false;
    if (activeTab === 'resolved' && c.status?.m_name !== 'Resolved') return false;
    if (activeTab === 'feedback' && c.complaint_type?.m_name !== 'Feedback') return false;

    // 2. Search & drop filters
    const name = c.complainant_name.toLowerCase();
    const sub = c.subject.toLowerCase();
    const desc = c.description.toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = name.includes(query) || sub.includes(query) || desc.includes(query);
    const matchesVehicle = selectedVehicleFilter ? c.vehicle_id?.toString() === selectedVehicleFilter : true;
    const matchesStatus = selectedStatusFilter ? c.status_id?.toString() === selectedStatusFilter : true;

    return matchesSearch && matchesVehicle && matchesStatus;
  });

  const lbl = 'block text-[8px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wider';
  const inp = 'w-full px-1.5 py-0.5 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition bg-white h-[23px]';
  const txa = 'w-full px-1.5 py-0.5 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition bg-white resize-none';

  return (
    <div className="space-y-3 text-xs">
      {/* Header Panel */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2">
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">💬 Complaint & Feedback Log</h3>
          <p className="text-[12px] text-gray-500">Record and resolve parental complaints, delay notifications, driver feedback, and general suggestions.</p>
        </div>
      </div>

      {/* Dynamic Filter Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-lg p-1 gap-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'all' ? 'bg-blue-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          📋 All
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {tabStats.All}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('open')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'open' ? 'bg-blue-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          🔴 Open
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'open' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {tabStats.Open}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('in_progress')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'in_progress' ? 'bg-blue-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          🟡 In Progress
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'in_progress' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {tabStats['In Progress']}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'resolved' ? 'bg-blue-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          ✅ Resolved
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'resolved' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {tabStats.Resolved}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'feedback' ? 'bg-blue-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          ⭐ Feedback
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'feedback' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {tabStats.Feedback}
          </span>
        </button>
      </div>

      {/* Toolbar controls */}
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

          <SearchableSelect
            options={vehicles.map(v => ({ value: v.id, label: v.vehicle_number }))}
            value={selectedVehicleFilter}
            onChange={setSelectedVehicleFilter}
            placeholder="Filter by Vehicle"
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

          {/* Trashed Toggle */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-1.5 py-0.5 h-[28px]">
            <span className="text-[10px] font-semibold text-gray-655">Trashed</span>
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
                setEditingComplaint(null);
                setComplaintForm({
                  complainant_name: '',
                  contact_info: '',
                  complaint_type_id: complaintTypes[0]?.m_id?.toString() || '',
                  priority_id: priorities[0]?.m_id?.toString() || '',
                  status_id: statuses[0]?.m_id?.toString() || '',
                  subject: '',
                  description: '',
                  vehicle_id: '',
                  driver_id: '',
                  attachments: '',
                });
                setIsComplaintModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition text-xs font-medium cursor-pointer h-[28px]"
            >
              ➕ Log Complaint
            </button>
          )}
        </div>
      </div>

      {/* Trashed Alert Banner */}
      {showTrashed && (
        <div className="bg-red-50 border border-red-200 px-4 py-1.5 flex items-center gap-2 text-red-700 text-xs font-semibold rounded-lg">
          ⚠️ You are viewing deleted complaint files. You can restore them or permanently delete them below.
        </div>
      )}

      {/* Bulk actions panel */}
      {selectedIds.length > 0 && (
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

      {/* Complaint table list grid */}
      <div className="overflow-x-auto border border-gray-250 rounded-lg bg-white shadow-sm">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-gray-200 bg-slate-50/80 text-gray-755 font-bold uppercase text-[9px] whitespace-nowrap">
              <th className="py-2.5 px-3 w-8">
                <input
                  type="checkbox"
                  checked={filteredComplaints.length > 0 && selectedIds.length === filteredComplaints.length}
                  onChange={toggleSelectAll}
                  className="rounded text-blue-500 focus:ring-blue-400 cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3">Complainant</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Priority</th>
              <th className="py-2.5 px-3">Subject</th>
              <th className="py-2.5 px-3 w-72">Description</th>
              <th className="py-2.5 px-3">Vehicle</th>
              <th className="py-2.5 px-3">Driver</th>
              <th className="py-2.5 px-3">Logged Date</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={11} className="text-center py-6 px-3 text-slate-400">Loading complaint ledger...</td>
              </tr>
            ) : filteredComplaints.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-6 px-3 text-slate-400">No complaints found</td>
              </tr>
            ) : (
              filteredComplaints.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      className="rounded text-blue-500 focus:ring-blue-400 cursor-pointer"
                    />
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-900">
                    {c.complainant_name}
                    {c.contact_info && (
                      <span className="block text-[9px] text-slate-400 font-normal">{c.contact_info}</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-slate-600 uppercase">
                      {c.complaint_type?.m_alias_name || 'Complaint'}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                      c.priority?.m_name === 'Urgent'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : c.priority?.m_name === 'High'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : c.priority?.m_name === 'Medium'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {c.priority?.m_alias_name || 'Medium'}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-800">{c.subject}</td>
                  <td className="py-2 px-3 text-slate-500 text-[10px] leading-relaxed max-w-xs break-words" title={c.description}>
                    {c.description}
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-700">{c.vehicle?.vehicle_number || '-'}</td>
                  <td className="py-2 px-3 text-slate-600">{c.driver?.full_name || '-'}</td>
                  <td className="py-2 px-3 text-slate-400 font-mono text-[9px]">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                      c.status?.m_name === 'Resolved' || c.status?.m_name === 'Closed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : c.status?.m_name === 'In Progress'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {c.status?.m_alias_name || 'Open'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="flex gap-2 justify-end">
                      {showTrashed ? (
                        <>
                          <button
                            onClick={() => handleRestoreComplaint(c.id)}
                            className="p-1 hover:bg-slate-100 rounded text-emerald-600 transition-colors"
                            title="Restore"
                          >
                            🔄
                          </button>
                          <button
                            onClick={() => handleDeleteComplaint(c.id)}
                            className="p-1 hover:bg-slate-100 rounded text-rose-600 transition-colors"
                            title="Permanently Delete"
                          >
                            🗑️
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditComplaint(c)}
                            className="p-1 hover:bg-slate-100 rounded text-indigo-600 transition-colors"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteComplaint(c.id)}
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

      {/* Add/Edit Modal */}
      {isComplaintModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-350 w-full max-w-lg overflow-hidden shadow-2xl transition-all flex flex-col max-h-[95vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-650 px-5 py-3 flex items-center justify-between text-white flex-shrink-0">
              <h2 className="text-sm font-extrabold tracking-tight flex items-center gap-1.5">
                {editingComplaint ? '✏️ Edit Complaint / Feedback' : '💬 Log Complaint / Feedback'}
              </h2>
              <button 
                onClick={() => {
                  setIsComplaintModalOpen(false);
                  setEditingComplaint(null);
                }} 
                className="text-white hover:text-slate-200 text-lg font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Form */}
            <form onSubmit={handleSaveComplaint} className="p-3.5 space-y-2 text-xs font-semibold overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-2">
                {/* Complainant Name */}
                <div className="col-span-1">
                  <label className={lbl}>Complainant Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="Full name"
                    value={complaintForm.complainant_name}
                    onChange={(e) => setComplaintForm(prev => ({ ...prev, complainant_name: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Contact */}
                <div className="col-span-1">
                  <label className={lbl}>Contact</label>
                  <input
                    type="text"
                    placeholder="Phone or email"
                    value={complaintForm.contact_info}
                    onChange={(e) => setComplaintForm(prev => ({ ...prev, contact_info: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Complaint Type (Dynamic Searchable Dropdown) */}
                <div className="col-span-1">
                  <label className={lbl}>Type *</label>
                  <SearchableSelect
                    options={complaintTypes.map(c => ({ value: c.m_id, label: c.m_alias_name }))}
                    value={complaintForm.complaint_type_id}
                    onChange={(val) => setComplaintForm(prev => ({ ...prev, complaint_type_id: val }))}
                    placeholder="Select Type"
                  />
                </div>

                {/* Priority (Dynamic Searchable Dropdown) */}
                <div className="col-span-1 text-[10px]">
                  <label className={lbl}>Priority *</label>
                  <SearchableSelect
                    options={priorities.map(p => ({ value: p.m_id, label: p.m_alias_name }))}
                    value={complaintForm.priority_id}
                    onChange={(val) => setComplaintForm(prev => ({ ...prev, priority_id: val }))}
                    placeholder="Select Priority"
                  />
                </div>

                {/* Status (Dynamic Searchable Dropdown) */}
                <div className="col-span-2">
                  <label className={lbl}>Status *</label>
                  <SearchableSelect
                    options={statuses.map(s => ({ value: s.m_id, label: s.m_alias_name }))}
                    value={complaintForm.status_id}
                    onChange={(val) => setComplaintForm(prev => ({ ...prev, status_id: val }))}
                    placeholder="Select Status"
                  />
                </div>

                {/* Subject */}
                <div className="col-span-2">
                  <label className={lbl}>Subject / Title *</label>
                  <input
                    required
                    type="text"
                    placeholder="Brief subject"
                    value={complaintForm.subject}
                    onChange={(e) => setComplaintForm(prev => ({ ...prev, subject: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <label className={lbl}>Description *</label>
                  <textarea
                    required
                    rows={2.5}
                    placeholder="Detailed description..."
                    value={complaintForm.description}
                    onChange={(e) => setComplaintForm(prev => ({ ...prev, description: e.target.value }))}
                    className={txa}
                  />
                </div>

                {/* Related Vehicle (Dynamic Searchable Dropdown) */}
                <div className="col-span-1">
                  <label className={lbl}>Related Vehicle</label>
                  <SearchableSelect
                    options={vehicles.map(v => ({ value: v.id, label: v.vehicle_number }))}
                    value={complaintForm.vehicle_id}
                    onChange={(val) => setComplaintForm(prev => ({ ...prev, vehicle_id: val }))}
                    placeholder="None"
                    isClearable={true}
                  />
                </div>

                {/* Related Driver (Dynamic Searchable Dropdown) */}
                <div className="col-span-1">
                  <label className={lbl}>Related Driver</label>
                  <SearchableSelect
                    options={drivers.map(d => ({ value: d.id, label: d.full_name }))}
                    value={complaintForm.driver_id}
                    onChange={(val) => setComplaintForm(prev => ({ ...prev, driver_id: val }))}
                    placeholder="None"
                    isClearable={true}
                  />
                </div>

                {/* Attachments */}
                <div className="col-span-2">
                  <label className={lbl}>Attachments (URLs)</label>
                  <input
                    type="text"
                    placeholder="Photo/ document URLs (comma separated)"
                    value={complaintForm.attachments}
                    onChange={(e) => setComplaintForm(prev => ({ ...prev, attachments: e.target.value }))}
                    className={inp}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsComplaintModalOpen(false);
                    setEditingComplaint(null);
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

      {/* Excel Data Import Preview Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-300 w-full max-w-4xl overflow-hidden shadow-2xl transition-all flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-650 px-5 py-3 flex items-center justify-between text-white flex-shrink-0">
              <h2 className="text-sm font-extrabold tracking-tight">Excel Data Import Preview ({importData.length} records)</h2>
              <button onClick={() => setIsImportModalOpen(false)} className="text-white hover:text-slate-200 text-lg font-bold cursor-pointer">✕</button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              <p className="text-xs text-slate-500 mb-2">Showing preview of first 5 rows to be imported. Correct mapping will be done automatically using vehicle registration numbers and drivers.</p>
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50 font-bold uppercase text-[9px]">
                    <th className="py-2 px-3">Complainant Name</th>
                    <th className="py-2 px-3">Contact</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Priority</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Subject</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3">Vehicle Number</th>
                    <th className="py-2 px-3">Driver Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {importPreview.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-1.5 px-3 font-semibold">{row['Complainant Name']}</td>
                      <td className="py-1.5 px-3">{row['Contact']}</td>
                      <td className="py-1.5 px-3">{row['Type']}</td>
                      <td className="py-1.5 px-3">{row['Priority']}</td>
                      <td className="py-1.5 px-3">{row['Status']}</td>
                      <td className="py-1.5 px-3">{row['Subject']}</td>
                      <td className="py-1.5 px-3">{row['Description']}</td>
                      <td className="py-1.5 px-3">{row['Vehicle Number']}</td>
                      <td className="py-1.5 px-3">{row['Driver Name']}</td>
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

export default ComplaintManager;
