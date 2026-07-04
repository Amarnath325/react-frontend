import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Helper function to format date as "01 Jul 2024"
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Helper function to format date for input[type="date"] (YYYY-MM-DD)
const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
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
          inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-4.5' : 'translate-x-1'}
        `}
      />
    </button>
  );
};

interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status: number | string;
  school_id?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

interface AcademicYearManagerProps {
  onClose?: () => void;
}

const AcademicYearManager: React.FC<AcademicYearManagerProps> = ({ onClose }) => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [filteredData, setFilteredData] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
  });
  const [isCurrent, setIsCurrent] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null); // Track which toggle is updating

  // Trashed items filter state
  const [showTrashed, setShowTrashed] = useState(false);

  // Bulk Selection states
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');

  // Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchAcademicYears();
  }, [showTrashed]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [academicYears, searchTerm]);

  useEffect(() => {
    setSelectedItems(new Set());
  }, [searchTerm, showTrashed, currentPage, itemsPerPage]);

  const fetchAcademicYears = async () => {
    setLoading(true);
    try {
      const response = await api.get('/school/academic-years', {
        params: { only_trashed: showTrashed }
      });
      if (response.data.success) {
        const years = response.data.data.map((year: AcademicYear) => ({
          ...year,
          start_date: year.start_date ? formatDateForInput(year.start_date) : '',
          end_date: year.end_date ? formatDateForInput(year.end_date) : '',
        }));
        setAcademicYears(years);
      } else {
        setAcademicYears([]);
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
      toast.error('Failed to load academic years');
      setAcademicYears([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...academicYears];

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingYear(null);
    setFormData({ name: '', start_date: '', end_date: '' });
    setIsCurrent(false);
    setIsModalOpen(true);
  };

  const openEditModal = (year: AcademicYear) => {
    const startDate = year.start_date ? formatDateForInput(year.start_date) : '';
    const endDate = year.end_date ? formatDateForInput(year.end_date) : '';
    
    setEditingYear(year);
    setFormData({
      name: year.name,
      start_date: startDate,
      end_date: endDate,
    });
    setIsCurrent(year.is_current || false);
    setIsModalOpen(true);
  };

  const handleToggleCurrent = async (id: number, isCurrentlyCurrent: boolean) => {
    setUpdatingId(id);

    try {
      const payload = {
        is_current: isCurrentlyCurrent ? 0 : 1,
      };

      const response = await api.post(
        `/school/academic-years/${id}/set-current`,
        payload
      );

      if (response.data.success) {
        toast.success(response.data.message);
        const updatedData = response.data.data;

        setAcademicYears((prevYears) =>
          prevYears.map((year) => {
            // UNCHECK CASE
            if (updatedData.is_current === 0) {
              if (year.id === id) {
                return {
                  ...year,
                  is_current: false,
                  status: 0,
                };
              }
              return year;
            }

            // CHECK CASE
            return {
              ...year,
              is_current: year.id === id,
              status: year.id === id ? 1 : 0,
            };
          })
        );
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.start_date || !formData.end_date) {
      toast.error('Please fill all fields');
      return;
    }

    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      const submitData = {
        name: formData.name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_current: isCurrent,
      };

      let response;
      if (editingYear) {
        response = await api.put(`/school/academic-years/${editingYear.id}`, submitData);
        if (response.data.success) {
          toast.success('Academic year updated successfully');
        }
      } else {
        response = await api.post('/school/academic-years', submitData);
        if (response.data.success) {
          toast.success('Academic year added successfully');
        }
      }
      
      setIsModalOpen(false);
      fetchAcademicYears();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const response = await api.delete(`/school/academic-years/${id}`);
        if (response.data.success) {
          toast.success('Academic year deleted successfully');
          fetchAcademicYears();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleRestore = async (id: number) => {
    if (!window.confirm('Are you sure you want to restore this academic year?')) return;
    try {
      const response = await api.post(`/school/academic-years/${id}/restore`);
      if (response.data.success) {
        toast.success('Academic year restored successfully');
        fetchAcademicYears();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore academic year');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this academic year? This action cannot be undone.')) return;
    try {
      const response = await api.delete(`/school/academic-years/${id}/force`);
      if (response.data.success) {
        toast.success('Academic year permanently deleted');
        fetchAcademicYears();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to permanently delete academic year');
    }
  };

  // Bulk operations
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

  const handleBulkDelete = async () => {
    const confirmMessage = showTrashed
      ? `Are you sure you want to permanently delete ${selectedItems.size} selected academic year(s)? This action cannot be undone.`
      : `Are you sure you want to delete ${selectedItems.size} selected academic year(s)?`;

    if (window.confirm(confirmMessage)) {
      setBulkUpdating(true);
      const ids = Array.from(selectedItems);
      
      try {
        const response = await api.post('/school/academic-years/bulk-delete', {
          ids: ids,
          force: showTrashed
        });
        if (response.data.success) {
          toast.success(response.data.message || 'Deleted successfully');
          setSelectedItems(new Set());
          fetchAcademicYears();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete');
      } finally {
        setBulkUpdating(false);
      }
    }
  };

  const handleBulkRestore = async () => {
    if (window.confirm(`Are you sure you want to restore ${selectedItems.size} selected academic year(s)?`)) {
      setBulkUpdating(true);
      const ids = Array.from(selectedItems);
      
      try {
        const response = await api.post('/school/academic-years/bulk-restore', {
          ids: ids
        });
        if (response.data.success) {
          toast.success(response.data.message || 'Restored successfully');
          setSelectedItems(new Set());
          fetchAcademicYears();
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
        'Session Year': item.name,
        'Start Date (YYYY-MM-DD)': item.start_date,
        'End Date (YYYY-MM-DD)': item.end_date,
        'Set as Current': item.is_current ? 'Yes' : 'No',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Academic Years');
      XLSX.writeFile(wb, `academic_years_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Export successful!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const downloadSampleFile = async () => {
    try {
      const statusValues = ['Yes', 'No'];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Academic Years');

      worksheet.columns = [
        { header: 'Session Year', key: 'name', width: 15 },
        { header: 'Start Date (YYYY-MM-DD)', key: 'start_date', width: 25 },
        { header: 'End Date (YYYY-MM-DD)', key: 'end_date', width: 25 },
        { header: 'Set as Current', key: 'is_current', width: 15 },
      ];

      worksheet.addRow({
        name: '2024-2025',
        start_date: '2024-07-01',
        end_date: '2025-04-30',
        is_current: 'Yes',
      });
      worksheet.addRow({
        name: '2025-2026',
        start_date: '2025-07-01',
        end_date: '2026-04-30',
        is_current: 'No',
      });

      // Status list helper in helper column
      worksheet.getCell('F1').value = 'Status_List';
      statusValues.forEach((val, idx) => {
        worksheet.getCell(`F${idx + 2}`).value = val;
      });
      worksheet.getColumn('F').hidden = true;

      // Apply validation for is_current column
      for (let r = 2; r <= 500; r++) {
        worksheet.getCell(`D${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Academic Years'!$F$2:$F$3`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select Yes or No.',
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_academic_years.xlsx');
      toast.success('Sample file downloaded!');
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
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        let headerRowIndex = -1;
        let headers: string[] = [];
        
        for (let i = 0; i < rows.length; i++) {
          const firstCell = rows[i][0];
          if (firstCell && (firstCell === 'Session Year' || firstCell?.toString().includes('Session'))) {
            headerRowIndex = i;
            headers = rows[i].map((cell: any) => cell?.toString().trim() || '');
            break;
          }
        }
        
        if (headerRowIndex === -1) {
          toast.error('Could not find header row (e.g., "Session Year")');
          return;
        }
        
        const dataRows: any[] = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          const firstCell = row[0];
          if (firstCell && (firstCell.toString().includes('_List') || firstCell === 'Status_List')) {
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
          
          if (rowData['Session Year']) {
            dataRows.push(rowData);
          }
        }
        
        if (dataRows.length === 0) {
          toast.error('No valid data found in the file.');
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
      const payload = importData.map(row => {
        let is_current = false;
        if (row['Set as Current']) {
          is_current = row['Set as Current'].toLowerCase() === 'yes';
        }
        
        return {
          name: row['Session Year'],
          start_date: row['Start Date (YYYY-MM-DD)'],
          end_date: row['End Date (YYYY-MM-DD)'],
          is_current: is_current,
        };
      });

      const response = await api.post('/school/academic-years/bulk-import', { data: payload });
      if (response.data.success) {
        toast.success(response.data.message || 'Import completed successfully');
        setIsImportModalOpen(false);
        fetchAcademicYears();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  // Pagination bounds
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = itemsPerPage === -1 
    ? filteredData 
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading && academicYears.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
          <p className="mt-1.5 text-xs text-gray-500">Loading academic years...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search academic years..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none w-44"
          />

          {/* Pagination limit selector */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5">
            <span className="text-[10px] text-gray-500 font-semibold uppercase">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={-1}>All</option>
            </select>
          </div>

          {/* Show Trashed Toggle */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-1.5 py-0.5">
            <span className="text-[11px] font-semibold text-gray-600">Show Trashed</span>
            <button
              type="button"
              onClick={() => setShowTrashed(prev => !prev)}
              className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                showTrashed ? 'bg-red-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform duration-200 ${
                  showTrashed ? 'translate-x-4.5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Sample File Download Button */}
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

          {/* Import Button */}
          <label className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition cursor-pointer text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-xs font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>

          {/* Add New Button */}
          {!showTrashed && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition text-xs font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Alert */}
      {selectedItems.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-2 rounded text-xs text-blue-700">
          <span className="font-semibold">{selectedItems.size} item(s) selected</span>
          <div className="flex items-center gap-2">
            {showTrashed ? (
              <>
                <button
                  onClick={handleBulkRestore}
                  disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 transition disabled:opacity-50 text-green-700"
                >
                  Restore Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded transition disabled:opacity-50"
                >
                  Permanently Delete Selected
                </button>
              </>
            ) : (
              <button
                onClick={handleBulkDelete}
                disabled={bulkUpdating}
                className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded transition disabled:opacity-50"
              >
                Delete Selected
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table grid */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold uppercase text-[10px]">
              <th className="py-2 px-2.5 w-8">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={paginatedData.length > 0 && paginatedData.every(item => selectedItems.has(item.id))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                />
              </th>
              <th className="py-2 px-2.5">
                Session Year
              </th>
              <th className="py-2 px-2.5">
                Start Date
              </th>
              <th className="py-2 px-2.5">
                End Date
              </th>
              <th className="py-2 px-2.5 text-center w-28">
                Current Status
              </th>
              <th className="py-2 px-2.5 w-20 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500 font-medium">
                  {showTrashed ? 'No deleted academic years found.' : 'No academic years found.'}
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition text-gray-700">
                  <td className="py-1.5 px-2.5">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                    />
                  </td>
                  <td className="py-1.5 px-2.5 font-medium text-gray-900">{item.name}</td>
                  <td className="py-1.5 px-2.5">{formatDate(item.start_date)}</td>
                  <td className="py-1.5 px-2.5">{formatDate(item.end_date)}</td>
                  <td className="py-1.5 px-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <ToggleSwitch
                        checked={!!item.is_current}
                        onChange={() => handleToggleCurrent(item.id, !!item.is_current)}
                        disabled={showTrashed}
                      />
                      {updatingId === item.id && (
                        <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                  </td>
                  <td className="py-1.5 px-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {showTrashed ? (
                        <>
                          <button
                            onClick={() => handleRestore(item.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition"
                            title="Restore"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 9.75M8.25 4.5l.008-.008V4.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleForceDelete(item.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                            title="Permanently Delete"
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
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Edit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition"
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-150 bg-white px-2 py-1.5 text-xs">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded border border-gray-300 bg-white px-2.5 py-0.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative ml-2 inline-flex items-center rounded border border-gray-300 bg-white px-2.5 py-0.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] text-gray-500">
                Showing{' '}
                <span className="font-semibold text-gray-700">
                  {itemsPerPage === -1 ? 1 : (currentPage - 1) * itemsPerPage + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-gray-700">
                  {itemsPerPage === -1
                    ? filteredData.length
                    : Math.min(currentPage * itemsPerPage, filteredData.length)}
                </span>{' '}
                of <span className="font-semibold text-gray-700">{filteredData.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l px-1.5 py-0.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  &lsaquo;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-2 py-0.5 text-xs font-semibold focus:z-20 ${
                      currentPage === page
                        ? 'z-10 bg-blue-600 text-white'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r px-1.5 py-0.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  &rsaquo;
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-gray-800">
                {editingYear ? 'Edit Academic Year' : 'Add New Academic Year'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {/* SESSION YEAR */}
              <div>
                <label className="block text-xs font-medium text-gray-750 mb-1">
                  Session Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  placeholder="e.g., 2024"
                  maxLength={9}
                  onChange={(e) => {
                    let input = e.target.value.replace(/[^0-9]/g, "");
                    if (input.length <= 4) {
                      if (input.length === 4) {
                        const startYear = parseInt(input);
                        const endYear = startYear + 1;
                        setFormData((prev) => ({
                          ...prev,
                          name: `${startYear}-${endYear}`,
                          start_date: `${startYear}-07-01`,
                          end_date: `${endYear}-04-30`,
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          name: input,
                        }));
                      }
                    }
                  }}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* START DATE */}
              <div>
                <label className="block text-xs font-medium text-gray-755 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* END DATE */}
              <div>
                <label className="block text-xs font-medium text-gray-755 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* Toggle Switch for Current Status */}
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-150">
                <div>
                  <label className="text-xs font-semibold text-gray-750">
                    Set as Current Academic Year
                  </label>
                  <p className="text-[10px] text-gray-500">
                    {isCurrent ? 'This will be the active academic year' : 'Mark as current academic year'}
                  </p>
                </div>
                <ToggleSwitch
                  checked={isCurrent}
                  onChange={setIsCurrent}
                />
              </div>

              {/* BUTTONS */}
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-medium"
                >
                  {editingYear ? "Update" : "Add"} Academic Year
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Preview Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-xl p-5 border border-gray-100">
            <div className="flex justify-between items-center pb-3 border-b mb-3">
              <h3 className="text-sm font-bold text-gray-800">
                Import Preview - {importData.length} records found
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mb-3">
              Showing a preview of the first 5 records. Please verify before importing.
            </p>

            <div className="bg-gray-50 rounded-lg border overflow-x-auto mb-4">
              <table className="w-full text-left text-xs text-gray-700">
                <thead>
                  <tr className="bg-gray-100 border-b font-semibold">
                    <th className="py-2 px-3">Session Year</th>
                    <th className="py-2 px-3">Start Date</th>
                    <th className="py-2 px-3">End Date</th>
                    <th className="py-2 px-3">Set as Current</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {importPreview.map((row, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="py-2 px-3 font-medium">{row['Session Year']}</td>
                      <td className="py-2 px-3">{row['Start Date (YYYY-MM-DD)'] || '-'}</td>
                      <td className="py-2 px-3">{row['End Date (YYYY-MM-DD)'] || '-'}</td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                          row['Set as Current'] && row['Set as Current'].toLowerCase() === 'yes' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {row['Set as Current'] || 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-3.5 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={submitImport}
                disabled={importing}
                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 text-xs font-medium"
              >
                {importing ? 'Importing...' : 'Confirm Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicYearManager;