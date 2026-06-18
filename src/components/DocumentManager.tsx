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

interface DocumentLog {
  id: number;
  school_id: number;
  academic_year_id: number | null;
  document_type_id: number;
  document_number: string;
  associated_with: string; // 'Vehicle' | 'Driver'
  vehicle_id: number | null;
  driver_id: number | null;
  issue_date: string;
  expiry_date: string;
  issuing_authority: string | null;
  notes: string | null;
  status_id: number;
  document_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  document_type?: MasterOption;
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

const DocumentManager: React.FC = () => {
  // Tabs: 'all' | 'vehicle' | 'driver' | 'expiring' | 'timeline'
  const [activeTab, setActiveTab] = useState<'all' | 'vehicle' | 'driver' | 'expiring' | 'timeline'>('all');
  
  // Dynamic lists
  const [documents, setDocuments] = useState<DocumentLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  // Masters loaded dynamically
  const [documentTypes, setDocumentTypes] = useState<MasterOption[]>([]);
  const [statuses, setStatuses] = useState<MasterOption[]>([]);
  
  // Stats
  const [tabStats, setTabStats] = useState({
    All: 0,
    Vehicle: 0,
    Driver: 0,
    ExpiringSoon: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('');
  
  // Soft Delete & Multi Selection
  const [showTrashed, setShowTrashed] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modals
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState<boolean>(false);
  const [editingDocument, setEditingDocument] = useState<DocumentLog | null>(null);
  
  // Excel Import
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  // Form State
  const [form, setForm] = useState({
    document_type_id: '',
    document_number: '',
    associated_with: 'Vehicle', // 'Vehicle' | 'Driver'
    vehicle_id: '',
    driver_id: '',
    issue_date: '',
    expiry_date: '',
    issuing_authority: '',
    notes: '',
    status_id: '',
    document_url: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [showTrashed]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, driversRes, typesRes, statusesRes] = await Promise.all([
        api.get('/school/vehicles'),
        api.get('/school/drivers'),
        api.get('/master/group/DOCUMENT_TYPE'),
        api.get('/master/group/DOCUMENT_STATUS'),
      ]);

      if (vehiclesRes.data.success) setVehicles(vehiclesRes.data.data);
      if (driversRes.data.success) setDrivers(driversRes.data.data);
      if (typesRes.data.success) setDocumentTypes(typesRes.data.data);
      if (statusesRes.data.success) setStatuses(statusesRes.data.data);

      await fetchDocuments();
    } catch (error) {
      console.error('Error loading dynamic dropdown details:', error);
      toast.error('Failed to load dynamic configurations');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const params: any = { only_trashed: showTrashed };
      const res = await api.get('/school/transport-documents', { params });
      if (res.data.success) {
        setDocuments(res.data.data);
        if (res.data.stats) {
          setTabStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Error retrieving documents:', err);
    }
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.document_type_id || !form.document_number || !form.associated_with || !form.issue_date || !form.expiry_date || !form.status_id) {
      toast.error('Please fill all required fields');
      return;
    }
    if (form.associated_with === 'Vehicle' && !form.vehicle_id) {
      toast.error('Please select an owner vehicle');
      return;
    }
    if (form.associated_with === 'Driver' && !form.driver_id) {
      toast.error('Please select an owner driver');
      return;
    }

    const payload = {
      ...form,
      document_type_id: parseInt(form.document_type_id),
      status_id: parseInt(form.status_id),
      vehicle_id: form.associated_with === 'Vehicle' ? parseInt(form.vehicle_id) : null,
      driver_id: form.associated_with === 'Driver' ? parseInt(form.driver_id) : null,
    };

    try {
      let res;
      if (editingDocument) {
        res = await api.put(`/school/transport-documents/${editingDocument.id}`, payload);
      } else {
        res = await api.post('/school/transport-documents', payload);
      }

      if (res.data.success) {
        toast.success(editingDocument ? 'Document updated successfully' : 'Document registered successfully');
        setIsDocumentModalOpen(false);
        setEditingDocument(null);
        fetchDocuments();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save document');
    }
  };

  const handleEditDocument = (doc: DocumentLog) => {
    setEditingDocument(doc);
    setForm({
      document_type_id: doc.document_type_id.toString(),
      document_number: doc.document_number,
      associated_with: doc.associated_with,
      vehicle_id: doc.vehicle_id ? doc.vehicle_id.toString() : '',
      driver_id: doc.driver_id ? doc.driver_id.toString() : '',
      issue_date: doc.issue_date,
      expiry_date: doc.expiry_date,
      issuing_authority: doc.issuing_authority || '',
      notes: doc.notes || '',
      status_id: doc.status_id.toString(),
      document_url: doc.document_url || '',
    });
    setIsDocumentModalOpen(true);
  };

  const handleDeleteDocument = async (id: number) => {
    const action = showTrashed ? 'permanently delete' : 'delete';
    if (!window.confirm(`Are you sure you want to ${action} this document record?` + (showTrashed ? ' This cannot be undone.' : ''))) return;
    try {
      let res;
      if (showTrashed) {
        res = await api.delete(`/school/transport-documents/${id}/force`);
      } else {
        res = await api.delete(`/school/transport-documents/${id}`);
      }
      if (res.data.success) {
        toast.success(showTrashed ? 'Permanently deleted' : 'Moved to trash');
        fetchDocuments();
      }
    } catch (err) {
      toast.error(`Failed to ${action} document`);
    }
  };

  const handleRestoreDocument = async (id: number) => {
    if (!window.confirm('Are you sure you want to restore this document?')) return;
    try {
      const res = await api.post(`/school/transport-documents/${id}/restore`);
      if (res.data.success) {
        toast.success('Document restored successfully');
        fetchDocuments();
      }
    } catch (err) {
      toast.error('Failed to restore document');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDocuments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDocuments.map(d => d.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmMsg = showTrashed 
      ? `Are you sure you want to permanently delete these ${selectedIds.length} documents?`
      : `Are you sure you want to move these ${selectedIds.length} documents to trash?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.post('/school/transport-documents/bulk-delete', {
        ids: selectedIds,
        force: showTrashed
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Bulk delete successful');
        setSelectedIds([]);
        fetchDocuments();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed bulk delete');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to restore these ${selectedIds.length} documents?`)) return;

    try {
      const res = await api.post('/school/transport-documents/bulk-restore', {
        ids: selectedIds
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Bulk restore successful');
        setSelectedIds([]);
        fetchDocuments();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed bulk restore');
    }
  };

  const downloadSampleFile = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Documents');

      worksheet.columns = [
        { header: 'Document Type *', key: 'document_type', width: 22 },
        { header: 'Document Number *', key: 'document_number', width: 20 },
        { header: 'Associated With *', key: 'associated_with', width: 18 },
        { header: 'Owner (Reg No / Full Name) *', key: 'owner_key', width: 25 },
        { header: 'Issue Date (YYYY-MM-DD) *', key: 'issue_date', width: 22 },
        { header: 'Expiry Date (YYYY-MM-DD) *', key: 'expiry_date', width: 22 },
        { header: 'Issuing Authority', key: 'issuing_authority', width: 22 },
        { header: 'Notes', key: 'notes', width: 30 },
        { header: 'Document URL', key: 'document_url', width: 25 },
      ];

      worksheet.addRow({
        document_type: 'Insurance',
        document_number: 'POL-9098-12',
        associated_with: 'Vehicle',
        owner_key: vehicles.length > 0 ? vehicles[0].vehicle_number : 'DL-1PA-1234',
        issue_date: '2026-06-18',
        expiry_date: '2027-06-18',
        issuing_authority: 'IFFCO TOKIO',
        notes: 'Comprehensive school bus insurance policy.',
        document_url: 'https://example.com/insurance.pdf',
      });

      worksheet.addRow({
        document_type: 'Licence',
        document_number: 'DL-99081298',
        associated_with: 'Driver',
        owner_key: drivers.length > 0 ? drivers[0].full_name : 'Satish Singh',
        issue_date: '2022-01-15',
        expiry_date: '2032-01-15',
        issuing_authority: 'RTO Delhi East',
        notes: 'Commercial HMV Licence.',
        document_url: 'https://example.com/license.pdf',
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_documents.xlsx');
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
          if (firstCell && (firstCell === 'Document Type *' || firstCell?.toString().includes('Document Type'))) {
            headerRowIndex = i;
            headers = rows[i].map((cell: any) => cell?.toString().trim() || '');
            break;
          }
        }

        if (headerRowIndex === -1) {
          toast.error('Could not find header row (e.g. "Document Type *")');
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
            const cleanHeader = header.replace(' *', '').replace(' (YYYY-MM-DD)', '');
            rowData[cleanHeader] = row[j]?.toString() || '';
          }
          dataRows.push(rowData);
        }

        const validPayloadRows = dataRows.filter(r => r['Document Type'] && r['Document Number'] && r['Associated With'] && r['Owner'] && r['Issue Date'] && r['Expiry Date']);

        if (validPayloadRows.length === 0) {
          toast.error('No valid rows found. Ensure required fields (Document Type, Document Number, Associated With, Owner, Issue Date, Expiry Date) are filled.');
          return;
        }

        const payloadData = validPayloadRows.map(row => ({
          document_type: row['Document Type'],
          document_number: row['Document Number'],
          associated_with: row['Associated With'],
          owner_key: row['Owner'],
          issue_date: row['Issue Date'],
          expiry_date: row['Expiry Date'],
          issuing_authority: row['Issuing Authority'] || null,
          notes: row['Notes'] || null,
          document_url: row['Document URL'] || null,
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
      const response = await api.post('/school/transport-documents/bulk-import', { data: importData });
      if (response.data.success) {
        toast.success(response.data.message || 'Import successful!');
        setIsImportModalOpen(false);
        fetchDocuments();
      } else {
        toast.error(response.data.message || 'Import failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  // Filter logic
  const filteredDocuments = documents.filter(d => {
    // 1. Tab level filters
    if (activeTab === 'vehicle' && d.associated_with !== 'Vehicle') return false;
    if (activeTab === 'driver' && d.associated_with !== 'Driver') return false;
    if (activeTab === 'expiring') {
      const name = d.status?.m_name || '';
      if (name !== 'EXPIRED' && name !== 'EXPIRING SOON') return false;
    }

    // 2. Toolbar filters
    const search = searchQuery.toLowerCase();
    const docNum = d.document_number.toLowerCase();
    const authority = (d.issuing_authority || '').toLowerCase();
    const noteContent = (d.notes || '').toLowerCase();
    const ownerName = d.associated_with === 'Vehicle'
      ? (d.vehicle?.vehicle_number || '').toLowerCase()
      : (d.driver?.full_name || '').toLowerCase();

    const matchesSearch = docNum.includes(search) || authority.includes(search) || noteContent.includes(search) || ownerName.includes(search);
    const matchesVehicle = selectedVehicleFilter ? d.vehicle_id?.toString() === selectedVehicleFilter : true;
    const matchesStatus = selectedStatusFilter ? d.status_id?.toString() === selectedStatusFilter : true;
    const matchesType = selectedTypeFilter ? d.document_type_id?.toString() === selectedTypeFilter : true;

    return matchesSearch && matchesVehicle && matchesStatus && matchesType;
  });

  // Timeline list (sorted chronologically by expiry date)
  const timelineDocuments = [...documents]
    .filter(d => !d.deleted_at) // active only in timeline
    .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

  // Text colors and style utilities
  const lbl = 'block text-[8px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wider';
  const inp = 'w-full px-1.5 py-0.5 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition bg-white h-[23px]';
  const txa = 'w-full px-1.5 py-0.5 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition bg-white resize-none';

  return (
    <div className="space-y-3 text-xs">
      {/* Header Info Panel */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2">
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">📄 Legal Permitting & Vehicle Document Registry</h3>
          <p className="text-[12px] text-gray-500">Track and monitor transport license papers, state permits, pollution PUC, and fitness certificate expiration warnings.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-lg p-1 gap-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'all' ? 'bg-blue-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          📄 All Documents
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {tabStats.All}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('vehicle')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'vehicle' ? 'bg-blue-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          🚌 Vehicle Docs
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'vehicle' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {tabStats.Vehicle}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('driver')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'driver' ? 'bg-blue-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          👮 Driver Docs
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'driver' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {tabStats.Driver}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('expiring')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'expiring' ? 'bg-blue-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          ⚠️ Expiring Soon
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'expiring' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {tabStats.ExpiringSoon}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'timeline' ? 'bg-blue-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          📅 Expiry Timeline
        </button>
      </div>

      {activeTab !== 'timeline' ? (
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
                  placeholder="Search docs..."
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
                options={documentTypes.map(t => ({ value: t.m_id, label: t.m_alias_name }))}
                value={selectedTypeFilter}
                onChange={setSelectedTypeFilter}
                placeholder="Filter by Doc Type"
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

              {/* Trashed switch */}
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
                    setEditingDocument(null);
                    setForm({
                      document_type_id: documentTypes[0]?.m_id?.toString() || '',
                      document_number: '',
                      associated_with: 'Vehicle',
                      vehicle_id: vehicles[0]?.id?.toString() || '',
                      driver_id: '',
                      issue_date: '',
                      expiry_date: '',
                      issuing_authority: '',
                      notes: '',
                      status_id: statuses[0]?.m_id?.toString() || '',
                      document_url: '',
                    });
                    setIsDocumentModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition text-xs font-medium cursor-pointer h-[28px]"
                >
                  ➕ Add Document
                </button>
              )}
            </div>
          </div>

          {/* Trashed Alert */}
          {showTrashed && (
            <div className="bg-red-50 border border-red-200 px-4 py-1.5 flex items-center gap-2 text-red-700 text-xs font-semibold rounded-lg animate-fadeIn">
              ⚠️ You are viewing deleted documents. You can restore them or permanently delete them below.
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

          {/* Document list grid */}
          <div className="overflow-x-auto border border-gray-250 rounded-lg bg-white shadow-sm">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-gray-200 bg-slate-50/80 text-gray-755 font-bold uppercase text-[9px] whitespace-nowrap">
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={filteredDocuments.length > 0 && selectedIds.length === filteredDocuments.length}
                      onChange={toggleSelectAll}
                      className="rounded text-blue-500 focus:ring-blue-400 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">Document Type</th>
                  <th className="py-2.5 px-3">Doc Number</th>
                  <th className="py-2.5 px-3">Associated With</th>
                  <th className="py-2.5 px-3">Owner / Target</th>
                  <th className="py-2.5 px-3">Issue Date</th>
                  <th className="py-2.5 px-3">Expiry Date</th>
                  <th className="py-2.5 px-3">Issuing Authority</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="text-center py-6 px-3 text-slate-400">Loading document registry...</td>
                  </tr>
                ) : filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-6 px-3 text-slate-400">No documents found</td>
                  </tr>
                ) : (
                  filteredDocuments.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(d.id)}
                          onChange={() => toggleSelect(d.id)}
                          className="rounded text-blue-500 focus:ring-blue-400 cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {d.document_type?.m_alias_name || 'Document'}
                      </td>
                      <td className="py-2 px-3 font-mono font-semibold text-slate-800">
                        {d.document_url ? (
                          <a href={d.document_url} target="_blank" rel="noreferrer" className="text-indigo-650 hover:underline flex items-center gap-1">
                            {d.document_number} 🔗
                          </a>
                        ) : (
                          d.document_number
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                          d.associated_with === 'Vehicle' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                        }`}>
                          {d.associated_with}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-850">
                        {d.associated_with === 'Vehicle' 
                          ? d.vehicle?.vehicle_number 
                          : d.driver?.full_name || '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-500">{d.issue_date}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{d.expiry_date}</td>
                      <td className="py-2 px-3 text-slate-600">{d.issuing_authority || '-'}</td>
                      <td className="py-2 px-3 text-slate-400 text-[10px] leading-relaxed max-w-xs truncate" title={d.notes || ''}>
                        {d.notes || '-'}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                          d.status?.m_name === 'VALID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : d.status?.m_name === 'EXPIRED'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {d.status?.m_alias_name || 'Valid'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex gap-2 justify-end">
                          {showTrashed ? (
                            <>
                              <button
                                onClick={() => handleRestoreDocument(d.id)}
                                className="p-1 hover:bg-slate-100 rounded text-emerald-655 transition-colors cursor-pointer"
                                title="Restore"
                              >
                                🔄
                              </button>
                              <button
                                onClick={() => handleDeleteDocument(d.id)}
                                className="p-1 hover:bg-slate-100 rounded text-rose-655 transition-colors cursor-pointer"
                                title="Permanently Delete"
                              >
                                🗑️
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditDocument(d)}
                                className="p-1 hover:bg-slate-100 rounded text-indigo-655 transition-colors cursor-pointer"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteDocument(d.id)}
                                className="p-1 hover:bg-slate-100 rounded text-rose-655 transition-colors cursor-pointer"
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
        /* Expiry Timeline View (Chronological Expiry sorted timeline) */
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-800">📅 Expiry Timeline</h4>
            <p className="text-[11px] text-slate-500">Chronological schedule of upcoming vehicle permits and driving license renewals.</p>
          </div>
          
          {timelineDocuments.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No active documents to map on the timeline.</div>
          ) : (
            <div className="relative border-l border-indigo-100 ml-4 pl-6 space-y-6">
              {timelineDocuments.map((doc, idx) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const expiry = new Date(doc.expiry_date);
                expiry.setHours(0, 0, 0, 0);
                
                const isExpired = expiry.getTime() < today.getTime();
                const diffTime = Math.abs(expiry.getTime() - today.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                let timeText = '';
                if (isExpired) {
                  timeText = `Expired ${diffDays} day(s) ago`;
                } else if (diffDays === 0) {
                  timeText = 'Expires today!';
                } else {
                  timeText = `Expires in ${diffDays} day(s)`;
                }

                return (
                  <div key={doc.id} className="relative group animate-fadeIn">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 bg-white z-10 flex items-center justify-center transition-all ${
                      isExpired 
                        ? 'border-red-500 scale-110 shadow-xs' 
                        : doc.status?.m_name === 'EXPIRING SOON'
                          ? 'border-amber-500'
                          : 'border-emerald-500'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        isExpired 
                          ? 'bg-red-500' 
                          : doc.status?.m_name === 'EXPIRING SOON'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`} />
                    </div>

                    <div className={`p-3 rounded-lg border transition-all ${
                      isExpired 
                        ? 'border-red-100 bg-red-50/30' 
                        : doc.status?.m_name === 'EXPIRING SOON'
                          ? 'border-amber-100 bg-amber-50/20'
                          : 'border-slate-100 bg-slate-50/20 hover:border-slate-200'
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {doc.expiry_date}
                          </span>
                          <span className="text-[10px] text-slate-400">|</span>
                          <span className="px-2 py-0.5 text-[9px] font-extrabold rounded uppercase bg-indigo-50 text-indigo-700">
                            {doc.document_type?.m_alias_name}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            #{doc.document_number}
                          </span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2 py-0.2 rounded-full ${
                          isExpired 
                            ? 'bg-red-100 text-red-800' 
                            : doc.status?.m_name === 'EXPIRING SOON'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {timeText}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="text-slate-400">Owner Associated: </span>
                          <span className="font-bold text-slate-700">
                            {doc.associated_with === 'Vehicle' 
                              ? `🚌 Bus (${doc.vehicle?.vehicle_number})`
                              : `👮 Driver (${doc.driver?.full_name})`}
                          </span>
                        </div>
                        {doc.issuing_authority && (
                          <div className="text-slate-500 font-medium">
                            <span className="text-slate-405 text-[10px]">Issued by:</span> {doc.issuing_authority}
                          </div>
                        )}
                      </div>

                      {doc.notes && (
                        <p className="mt-1.5 text-[10px] text-slate-450 italic bg-white/50 p-1.5 rounded border border-slate-100/50">
                          Note: {doc.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isDocumentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-350 w-full max-w-lg overflow-hidden shadow-2xl transition-all flex flex-col max-h-[95vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-650 px-5 py-3 flex items-center justify-between text-white flex-shrink-0">
              <h2 className="text-sm font-extrabold tracking-tight flex items-center gap-1.5">
                {editingDocument ? '✏️ Edit Document / Permit' : '📄 Add New Document'}
              </h2>
              <button 
                onClick={() => {
                  setIsDocumentModalOpen(false);
                  setEditingDocument(null);
                }} 
                className="text-white hover:text-slate-200 text-lg font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSaveDocument} className="p-3.5 space-y-2 text-xs font-semibold overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-2">
                {/* Document Type */}
                <div className="col-span-1">
                  <label className={lbl}>Document Type *</label>
                  <SearchableSelect
                    options={documentTypes.map(t => ({ value: t.m_id, label: t.m_alias_name }))}
                    value={form.document_type_id}
                    onChange={(val) => setForm(prev => ({ ...prev, document_type_id: val }))}
                    placeholder="Select Type"
                  />
                </div>

                {/* Document Number */}
                <div className="col-span-1">
                  <label className={lbl}>Document Number *</label>
                  <input
                    required
                    type="text"
                    placeholder="Document number"
                    value={form.document_number}
                    onChange={(e) => setForm(prev => ({ ...prev, document_number: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Associated With */}
                <div className="col-span-1">
                  <label className={lbl}>Associated With *</label>
                  <SearchableSelect
                    options={[
                      { value: 'Vehicle', label: '🚌 Vehicle' },
                      { value: 'Driver', label: '👮 Driver' },
                    ]}
                    value={form.associated_with}
                    onChange={(val) => {
                      setForm(prev => ({ 
                        ...prev, 
                        associated_with: val,
                        vehicle_id: val === 'Vehicle' && vehicles.length > 0 ? vehicles[0].id.toString() : '',
                        driver_id: val === 'Driver' && drivers.length > 0 ? drivers[0].id.toString() : '',
                      }));
                    }}
                    placeholder="Associated Type"
                  />
                </div>

                {/* Select Owner */}
                <div className="col-span-1">
                  <label className={lbl}>Select Owner *</label>
                  {form.associated_with === 'Vehicle' ? (
                    <SearchableSelect
                      options={vehicles.map(v => ({ value: v.id, label: v.vehicle_number }))}
                      value={form.vehicle_id}
                      onChange={(val) => setForm(prev => ({ ...prev, vehicle_id: val }))}
                      placeholder="Select Vehicle"
                    />
                  ) : (
                    <SearchableSelect
                      options={drivers.map(d => ({ value: d.id, label: d.full_name }))}
                      value={form.driver_id}
                      onChange={(val) => setForm(prev => ({ ...prev, driver_id: val }))}
                      placeholder="Select Driver"
                    />
                  )}
                </div>

                {/* Issue Date */}
                <div className="col-span-1">
                  <label className={lbl}>Issue Date *</label>
                  <input
                    required
                    type="date"
                    value={form.issue_date}
                    onChange={(e) => setForm(prev => ({ ...prev, issue_date: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Expiry Date */}
                <div className="col-span-1">
                  <label className={lbl}>Expiry Date *</label>
                  <input
                    required
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => setForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Issuing Authority */}
                <div className="col-span-2">
                  <label className={lbl}>Issuing Authority</label>
                  <input
                    type="text"
                    placeholder="Issuing authority name"
                    value={form.issuing_authority}
                    onChange={(e) => setForm(prev => ({ ...prev, issuing_authority: e.target.value }))}
                    className={inp}
                  />
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  <label className={lbl}>Description / Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Additional notes..."
                    value={form.notes}
                    onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    className={txa}
                  />
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <label className={lbl}>Status</label>
                  <SearchableSelect
                    options={statuses.map(s => ({ value: s.m_id, label: s.m_alias_name }))}
                    value={form.status_id}
                    onChange={(val) => setForm(prev => ({ ...prev, status_id: val }))}
                    placeholder="Select Status"
                  />
                </div>

                {/* Document URL */}
                <div className="col-span-2">
                  <label className={lbl}>Document File URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={form.document_url}
                    onChange={(e) => setForm(prev => ({ ...prev, document_url: e.target.value }))}
                    className={inp}
                  />
                </div>
              </div>

              {/* Modal footer actions */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsDocumentModalOpen(false);
                    setEditingDocument(null);
                  }}
                  className="px-4 py-1 border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded transition-colors font-bold cursor-pointer text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors font-bold shadow-xs cursor-pointer text-[10px]"
                >
                  Save Document
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
              <h2 className="text-sm font-extrabold tracking-tight">Excel Document Import Preview ({importData.length} records)</h2>
              <button onClick={() => setIsImportModalOpen(false)} className="text-white hover:text-slate-200 text-lg font-bold cursor-pointer">✕</button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              <p className="text-xs text-slate-500 mb-2">Showing preview of first 5 rows to be imported. Owner column must contain exact Vehicle registration numbers or Driver full names.</p>
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50 font-bold uppercase text-[9px]">
                    <th className="py-2 px-3">Document Type</th>
                    <th className="py-2 px-3">Document Number</th>
                    <th className="py-2 px-3">Associated With</th>
                    <th className="py-2 px-3">Owner (Vehicle / Driver)</th>
                    <th className="py-2 px-3">Issue Date</th>
                    <th className="py-2 px-3">Expiry Date</th>
                    <th className="py-2 px-3">Issuing Authority</th>
                    <th className="py-2 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {importPreview.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-1.5 px-3 font-semibold">{row['Document Type']}</td>
                      <td className="py-1.5 px-3">{row['Document Number']}</td>
                      <td className="py-1.5 px-3">{row['Associated With']}</td>
                      <td className="py-1.5 px-3 font-bold">{row['Owner']}</td>
                      <td className="py-1.5 px-3">{row['Issue Date']}</td>
                      <td className="py-1.5 px-3">{row['Expiry Date']}</td>
                      <td className="py-1.5 px-3">{row['Issuing Authority']}</td>
                      <td className="py-1.5 px-3">{row['Notes']}</td>
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

export default DocumentManager;
