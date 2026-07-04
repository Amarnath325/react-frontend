import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface VehicleType {
  id: number;
  school_id: number;
  academic_year_id: number | null;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

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

const VehicleTypeManager: React.FC = () => {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [filteredData, setFilteredData] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VehicleType | null>(null);

  // Filters
  const [showTrashed, setShowTrashed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Bulk Selection states
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Excel Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    fetchVehicleTypes();
  }, [showTrashed]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [vehicleTypes, searchTerm, filterStatus, sortColumn, sortDirection]);

  useEffect(() => {
    setSelectedItems(new Set());
  }, [searchTerm, filterStatus, showTrashed, currentPage, itemsPerPage]);

  const fetchVehicleTypes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/school/vehicle-types', {
        params: { only_trashed: showTrashed }
      });
      if (response.data.success) {
        setVehicleTypes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicle types:', error);
      toast.error('Failed to load vehicle types');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...vehicleTypes];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(lowerSearch) ||
        (item.description && item.description.toLowerCase().includes(lowerSearch))
      );
    }

    if (filterStatus) {
      const isAct = filterStatus === 'active';
      filtered = filtered.filter(item => item.is_active === isAct);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof VehicleType] ?? '';
      let bVal: any = b[sortColumn as keyof VehicleType] ?? '';

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
    setFilterStatus('');
  };

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = itemsPerPage === -1
    ? filteredData
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: VehicleType) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Vehicle type name is required');
      return;
    }

    try {
      const submitData = {
        name: formData.name,
        description: formData.description || null,
        is_active: formData.is_active,
      };

      if (editingItem) {
        const response = await api.put(`/school/vehicle-types/${editingItem.id}`, submitData);
        if (response.data.success) {
          toast.success('Vehicle type updated successfully');
        }
      } else {
        const response = await api.post('/school/vehicle-types', submitData);
        if (response.data.success) {
          toast.success('Vehicle type created successfully');
        }
      }
      setIsModalOpen(false);
      fetchVehicleTypes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const action = showTrashed ? 'permanently delete' : 'delete';
    if (window.confirm(`Are you sure you want to ${action} vehicle type "${name}"?`)) {
      try {
        let response;
        if (showTrashed) {
          response = await api.delete(`/school/vehicle-types/${id}/force`);
        } else {
          response = await api.delete(`/school/vehicle-types/${id}`);
        }
        if (response.data.success) {
          toast.success(`Vehicle type ${showTrashed ? 'permanently deleted' : 'deleted'} successfully`);
          fetchVehicleTypes();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await api.patch(`/school/vehicle-types/${id}/toggle-status`);
      if (response.data.success) {
        toast.success('Vehicle type status updated');
        fetchVehicleTypes();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleRestore = async (id: number) => {
    if (!window.confirm('Are you sure you want to restore this vehicle type?')) return;
    try {
      const response = await api.post(`/school/vehicle-types/${id}/restore`);
      if (response.data.success) {
        toast.success('Vehicle type restored successfully');
        fetchVehicleTypes();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore vehicle type');
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
      const response = await api.post('/school/vehicle-types/bulk-status', {
        is_active: isActive,
        ids: ids
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Status updated successfully');
        setSelectedItems(new Set());
        fetchVehicleTypes();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    const confirmMessage = showTrashed
      ? `Are you sure you want to permanently delete ${selectedItems.size} selected vehicle type(s)? This action cannot be undone.`
      : `Are you sure you want to delete ${selectedItems.size} selected vehicle type(s)?`;

    if (window.confirm(confirmMessage)) {
      setBulkUpdating(true);
      const ids = Array.from(selectedItems);

      try {
        const response = await api.post('/school/vehicle-types/bulk-delete', {
          ids: ids,
          force: showTrashed
        });
        if (response.data.success) {
          toast.success(response.data.message || 'Deleted successfully');
          setSelectedItems(new Set());
          fetchVehicleTypes();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete');
      } finally {
        setBulkUpdating(false);
      }
    }
  };

  const handleBulkRestore = async () => {
    if (window.confirm(`Are you sure you want to restore ${selectedItems.size} selected vehicle type(s)?`)) {
      setBulkUpdating(true);
      const ids = Array.from(selectedItems);

      try {
        const response = await api.post('/school/vehicle-types/bulk-restore', {
          ids: ids
        });
        if (response.data.success) {
          toast.success(response.data.message || 'Restored successfully');
          setSelectedItems(new Set());
          fetchVehicleTypes();
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
        'Vehicle Type Name': item.name,
        'Description': item.description || '',
        'Status': item.is_active ? 'Active' : 'Inactive',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Vehicle Types');
      XLSX.writeFile(wb, `vehicle_types_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Export successful!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const downloadSampleFile = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Vehicle Types');

      worksheet.columns = [
        { header: 'Vehicle Type Name', key: 'name', width: 25 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Status', key: 'status', width: 15 },
      ];

      worksheet.addRow({
        name: 'Sleeper Bus',
        description: 'Luxury sleeper coach for long distance routes',
        status: 'Active',
      });

      worksheet.addRow({
        name: 'AC Mini-van',
        description: 'Air conditioned van for local primary school pickups',
        status: 'Active',
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_vehicle_types.xlsx');
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
          if (firstCell && (firstCell === 'Vehicle Type Name' || firstCell?.toString().includes('Vehicle Type'))) {
            headerRowIndex = i;
            headers = rows[i].map((cell: any) => cell?.toString().trim() || '');
            break;
          }
        }

        if (headerRowIndex === -1) {
          toast.error('Could not find header row (e.g. "Vehicle Type Name")');
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
            if (header && header !== '__EMPTY') {
              rowData[header] = row[j]?.toString() || '';
            }
          }

          if (rowData['Vehicle Type Name']) {
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
        name: row['Vehicle Type Name'],
        description: row['Description'] || null,
        is_active: row['Status'] ? row['Status'].toLowerCase() === 'active' : true,
      }));

      const response = await api.post('/school/vehicle-types/bulk-import', { data: payload });
      if (response.data.success) {
        toast.success(response.data.message || 'Import completed successfully');
        setIsImportModalOpen(false);
        fetchVehicleTypes();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const inp = 'w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';
  const lbl = 'block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500 font-medium">Loading vehicle types…</p>
        </div>
      </div>
    );
  }

  const hasFilters = searchTerm || filterStatus;

  return (
    <div className="space-y-3 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2">
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">Vehicle Type Management</h3>
          <p className="text-[12px] text-gray-500">Configure and manage various types of school transport vehicles (e.g. Bus, Van, Mini-Bus).</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded px-2.5 py-0.5 text-center min-w-[60px]">
          <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-400">Total Types</span>
          <span className="text-xs font-bold text-slate-700">{filteredData.length}</span>
        </div>
      </div>

      {/* Toolbar Area */}
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
              placeholder="Search type name, desc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-2 py-1 w-44 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Pagination limit selector */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5">
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

      {/* Trashed Banner */}
      {showTrashed && (
        <div className="bg-red-50 border-b border-red-105 px-4 py-1.5 flex items-center gap-2 text-red-700 text-xs font-medium rounded-lg">
          <svg className="w-3.5 h-3.5 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>You are viewing deleted vehicle types. You can restore them or permanently delete them below.</span>
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
                  onClick={() => handleBulkStatusUpdate(true)}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-green-700 font-medium"
                >
                  Active
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate(false)}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-red-700 font-medium"
                >
                  Inactive
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
              <th onClick={() => handleSort('name')} className="py-2.5 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none">
                <div className="flex items-center gap-1">
                  <span>Vehicle Type Name</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('name')}</span>
                </div>
              </th>
              <th className="py-2.5 px-2.5">Description</th>
              <th onClick={() => handleSort('is_active')} className="py-2.5 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none w-28 text-center">
                <div className="flex items-center justify-center gap-1">
                  <span>Status</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('is_active')}</span>
                </div>
              </th>
              <th className="py-2.5 px-2.5 text-center w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500 font-medium">
                  <div className="flex flex-col items-center justify-center max-w-md mx-auto gap-2">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h4 className="text-[13px] font-bold text-gray-900">No vehicle types configured</h4>
                    <p className="text-xs text-gray-500">Configure vehicle types (e.g. Bus, Van, Rickshaw) to categorize your school fleet.</p>
                    <button
                      onClick={openAddModal}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-650 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition"
                    >
                      Add your first vehicle type
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/10 transition-colors text-gray-700">
                  <td className="py-1.5 px-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer"
                    />
                  </td>
                  <td className="py-1.5 px-2.5 font-bold text-gray-900">{item.name}</td>
                  <td className="py-1.5 px-2.5 text-gray-500">{item.description || '—'}</td>
                  <td className="py-1.5 px-2.5 text-center">
                    <div className="flex items-center justify-center">
                      <ToggleSwitch
                        checked={item.is_active}
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
                            onClick={() => handleDelete(item.id, item.name)}
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
                            onClick={() => handleDelete(item.id, item.name)}
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
              ))
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
              className="px-2.5 py-1 border border-gray-200 rounded-md hover:bg-white text-gray-700 bg-gray-50 transition disabled:opacity-50 text-[10px] font-bold"
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
              className="px-2.5 py-1 border border-gray-200 rounded-md hover:bg-white text-gray-700 bg-gray-50 transition disabled:opacity-50 text-[10px] font-bold"
            >
              Next ▶
            </button>
          </div>
        </div>
      )}

      {/* POPUP MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-300 w-full max-w-md overflow-hidden shadow-2xl transition-all">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-650 px-5 py-3.5 flex items-center justify-between text-white">
              <h2 className="text-sm font-extrabold tracking-tight">
                {editingItem ? '✏️ Edit Vehicle Type' : '🚗 Add New Vehicle Type'}
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
              {/* Type Name */}
              <div>
                <label className={lbl}>Vehicle Type Name *</label>
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Sleeper Bus, Standard Van"
                  className={inp}
                />
              </div>

              {/* Description */}
              <div>
                <label className={lbl}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide brief details about this vehicle type..."
                  rows={3}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white resize-none"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between bg-gray-50 border border-gray-150 rounded-lg px-2.5 py-2.5">
                <span className="font-semibold text-gray-700">Active Status</span>
                <ToggleSwitch
                  checked={formData.is_active}
                  onChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
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
                  {editingItem ? 'Save Updates' : 'Save Vehicle Type'}
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
                      <th className="py-2 px-3">Vehicle Type Name</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importPreview.map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-bold text-slate-900">{row['Vehicle Type Name']}</td>
                        <td className="py-2 px-3">{row['Description']}</td>
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

export default VehicleTypeManager;
