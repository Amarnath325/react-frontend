import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Custom dropdown styles for react-select matching system's compact design
const compactSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.25rem',
    borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 1px rgba(59, 130, 246, 0.15)' : 'none',
    minHeight: '26px',
    height: '26px',
    backgroundColor: '#ffffff',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#9ca3af',
    },
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 6px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0',
    padding: '0',
    fontSize: '10px',
    color: '#111827',
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: '10px',
    color: '#9ca3af',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '10px',
    color: '#111827',
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: '24px',
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
      ? '#2563eb'
      : state.isFocused
        ? '#f3f4f6'
        : 'transparent',
    color: state.isSelected ? '#ffffff' : '#374151',
    fontSize: '10px',
    padding: '4px 6px',
    cursor: 'pointer',
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '0.25rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #e5e7eb',
    marginTop: '2px',
    zIndex: 9999,
  }),
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 9999,
  }),
};

const customSelectStyles = {
  ...compactSelectStyles,
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.375rem',
    borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 1px rgba(59, 130, 246, 0.15)' : 'none',
    minHeight: '32px',
    height: '32px',
    backgroundColor: '#ffffff',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#9ca3af',
    },
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 8px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: '30px',
  }),
};

// Interfaces for library hierarchy assets
interface Library {
  id: number;
  school_id: number;
  library_code: string;
  name: string;
  location: string | null;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

interface LibrarySection {
  id: number;
  school_id: number;
  library_id: number;
  section_code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  library?: Library | null;
}

interface LibraryRack {
  id: number;
  school_id: number;
  library_section_id: number;
  rack_code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  section?: LibrarySection | null;
}

interface LibraryShelf {
  id: number;
  school_id: number;
  library_rack_id: number;
  shelf_code: string;
  name: string;
  capacity: number;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  rack?: LibraryRack | null;
}

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

const RackShelfManager: React.FC = () => {
  type TabType = 'sections' | 'racks' | 'shelves' | 'libraries';
  const [activeTab, setActiveTab] = useState<TabType>('sections');
  
  // Data lists
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [sections, setSections] = useState<LibrarySection[]>([]);
  const [racks, setRacks] = useState<LibraryRack[]>([]);
  const [shelves, setShelves] = useState<LibraryShelf[]>([]);
  
  // Badge counts
  const [counts, setCounts] = useState({
    libraries: 0,
    sections: 0,
    racks: 0,
    shelves: 0,
  });

  const [loading, setLoading] = useState(true);
  const [showTrashed, setShowTrashed] = useState(false);
  
  // Common filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  
  // Tab-specific filters (parent IDs)
  const [filterLibraryId, setFilterLibraryId] = useState<string>('');
  const [filterSectionId, setFilterSectionId] = useState<string>('');
  const [filterRackId, setFilterRackId] = useState<string>('');

  // Bulk selection
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Sorting
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  // Forms state
  const [libraryForm, setLibraryForm] = useState({
    library_code: '',
    name: '',
    location: '',
    description: '',
    is_active: true,
  });

  const [sectionForm, setSectionForm] = useState({
    section_code: '',
    name: '',
    library_id: '',
    description: '',
    is_active: true,
  });

  const [rackForm, setRackForm] = useState({
    rack_code: '',
    name: '',
    library_section_id: '',
    description: '',
    is_active: true,
  });

  const [shelfForm, setShelfForm] = useState({
    shelf_code: '',
    name: '',
    library_rack_id: '',
    capacity: 50,
    description: '',
    is_active: true,
  });

  // Load parent data initially
  useEffect(() => {
    fetchParentData();
  }, []);

  // Fetch counts and main grid data
  useEffect(() => {
    fetchGridData();
    fetchCounts();
  }, [activeTab, showTrashed]);

  // Reset pagination & selection when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedItems(new Set());
  }, [activeTab, searchTerm, filterStatus, showTrashed, itemsPerPage, filterLibraryId, filterSectionId, filterRackId]);

  const fetchParentData = async () => {
    try {
      const [libs, secs, rks] = await Promise.all([
        api.get('/school/libraries', { params: { is_active: true } }),
        api.get('/school/library-sections', { params: { is_active: true } }),
        api.get('/school/library-racks', { params: { is_active: true } }),
      ]);
      if (libs.data.success) setLibraries(libs.data.data);
      if (secs.data.success) setSections(secs.data.data);
      if (rks.data.success) setRacks(rks.data.data);
    } catch (err) {
      console.error('Error fetching parent records:', err);
    }
  };

  const fetchCounts = async () => {
    try {
      const [libRes, secRes, rackRes, shelfRes] = await Promise.all([
        api.get('/school/libraries', { params: { is_active: true } }),
        api.get('/school/library-sections', { params: { is_active: true } }),
        api.get('/school/library-racks', { params: { is_active: true } }),
        api.get('/school/library-shelves', { params: { is_active: true } }),
      ]);
      
      setCounts({
        libraries: libRes.data.success ? libRes.data.data.length : 0,
        sections: secRes.data.success ? secRes.data.data.length : 0,
        racks: rackRes.data.success ? rackRes.data.data.length : 0,
        shelves: shelfRes.data.success ? shelfRes.data.data.length : 0,
      });
    } catch (err) {
      console.error('Error fetching count badges:', err);
    }
  };

  const fetchGridData = async () => {
    setLoading(true);
    try {
      const params = { only_trashed: showTrashed };
      let endpoint = '';
      
      if (activeTab === 'libraries') endpoint = '/school/libraries';
      else if (activeTab === 'sections') endpoint = '/school/library-sections';
      else if (activeTab === 'racks') endpoint = '/school/library-racks';
      else if (activeTab === 'shelves') endpoint = '/school/library-shelves';

      const response = await api.get(endpoint, { params });
      if (response.data.success) {
        const fetchedData = response.data.data;
        if (activeTab === 'libraries') {
          // Keep internal list in sync too
          setLibraries(fetchedData.filter((i: any) => !i.deleted_at && i.is_active));
        } else if (activeTab === 'sections') {
          setSections(fetchedData.filter((i: any) => !i.deleted_at && i.is_active));
        } else if (activeTab === 'racks') {
          setRacks(fetchedData.filter((i: any) => !i.deleted_at && i.is_active));
        } else if (activeTab === 'shelves') {
          setShelves(fetchedData.filter((i: any) => !i.deleted_at && i.is_active));
        }
        
        // Save full tab list
        setTabList(fetchedData);
      }
    } catch (error) {
      console.error(`Error loading data for ${activeTab}:`, error);
      toast.error(`Failed to load ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  // State holder for active tab list
  const [tabList, setTabList] = useState<any[]>([]);

  // Get active tab list with local filters applied
  const getFilteredData = () => {
    let source = [...tabList];

    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      source = source.filter(item => 
        item.name.toLowerCase().includes(term) ||
        (item.library_code && item.library_code.toLowerCase().includes(term)) ||
        (item.section_code && item.section_code.toLowerCase().includes(term)) ||
        (item.rack_code && item.rack_code.toLowerCase().includes(term)) ||
        (item.shelf_code && item.shelf_code.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (filterStatus) {
      const activeBool = filterStatus === 'true';
      source = source.filter(item => item.is_active === activeBool);
    }

    // Parent dropdown filters
    if (activeTab === 'sections' && filterLibraryId) {
      source = source.filter(item => item.library_id === parseInt(filterLibraryId));
    }
    if (activeTab === 'racks' && filterSectionId) {
      source = source.filter(item => item.library_section_id === parseInt(filterSectionId));
    }
    if (activeTab === 'shelves' && filterRackId) {
      source = source.filter(item => item.library_rack_id === parseInt(filterRackId));
    }

    // Sorting
    source.sort((a, b) => {
      let aVal = a[sortColumn] ?? '';
      let bVal = b[sortColumn] ?? '';

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return source;
  };

  const filteredData = getFilteredData();

  // Pagination calculations
  const totalItems = filteredData.length;
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(totalItems / itemsPerPage);
  const paginatedData = itemsPerPage === -1
    ? filteredData
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return '↕️';
    return sortDirection === 'asc' ? '🔼' : '🔽';
  };

  // Checkbox helpers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const newSelections = new Set(selectedItems);
      paginatedData.forEach(item => newSelections.add(item.id));
      setSelectedItems(newSelections);
    } else {
      const newSelections = new Set(selectedItems);
      paginatedData.forEach(item => newSelections.delete(item.id));
      setSelectedItems(newSelections);
    }
  };

  const handleSelectItem = (id: number) => {
    const newSelections = new Set(selectedItems);
    if (newSelections.has(id)) {
      newSelections.delete(id);
    } else {
      newSelections.add(id);
    }
    setSelectedItems(newSelections);
  };

  // CRUD Operations
  const openAddModal = () => {
    setEditingItem(null);
    // Initialize empty form values
    setLibraryForm({ library_code: '', name: '', location: '', description: '', is_active: true });
    setSectionForm({ section_code: '', name: '', library_id: libraries[0]?.id?.toString() || '', description: '', is_active: true });
    setRackForm({ rack_code: '', name: '', library_section_id: sections[0]?.id?.toString() || '', description: '', is_active: true });
    setShelfForm({ shelf_code: '', name: '', library_rack_id: racks[0]?.id?.toString() || '', capacity: 50, description: '', is_active: true });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    if (activeTab === 'libraries') {
      setLibraryForm({
        library_code: item.library_code,
        name: item.name,
        location: item.location || '',
        description: item.description || '',
        is_active: item.is_active,
      });
    } else if (activeTab === 'sections') {
      setSectionForm({
        section_code: item.section_code,
        name: item.name,
        library_id: item.library_id.toString(),
        description: item.description || '',
        is_active: item.is_active,
      });
    } else if (activeTab === 'racks') {
      setRackForm({
        rack_code: item.rack_code,
        name: item.name,
        library_section_id: item.library_section_id.toString(),
        description: item.description || '',
        is_active: item.is_active,
      });
    } else if (activeTab === 'shelves') {
      setShelfForm({
        shelf_code: item.shelf_code,
        name: item.name,
        library_rack_id: item.library_rack_id.toString(),
        capacity: item.capacity,
        description: item.description || '',
        is_active: item.is_active,
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let endpoint = '';
      let payload: any = {};
      
      if (activeTab === 'libraries') {
        endpoint = '/school/libraries';
        payload = libraryForm;
      } else if (activeTab === 'sections') {
        endpoint = '/school/library-sections';
        payload = sectionForm;
      } else if (activeTab === 'racks') {
        endpoint = '/school/library-racks';
        payload = rackForm;
      } else if (activeTab === 'shelves') {
        endpoint = '/school/library-shelves';
        payload = shelfForm;
      }

      let response;
      if (editingItem) {
        response = await api.put(`${endpoint}/${editingItem.id}`, payload);
      } else {
        response = await api.post(endpoint, payload);
      }

      if (response.data.success) {
        toast.success(response.data.message || 'Saved successfully');
        setIsModalOpen(false);
        fetchGridData();
        fetchParentData();
        fetchCounts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save record');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      let endpoint = '';
      if (activeTab === 'libraries') endpoint = `/school/libraries/${id}/toggle-status`;
      else if (activeTab === 'sections') endpoint = `/school/library-sections/${id}/toggle-status`;
      else if (activeTab === 'racks') endpoint = `/school/library-racks/${id}/toggle-status`;
      else if (activeTab === 'shelves') endpoint = `/school/library-shelves/${id}/toggle-status`;

      const response = await api.patch(endpoint);
      if (response.data.success) {
        toast.success(response.data.message || 'Status updated');
        fetchGridData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      let endpoint = '';
      if (activeTab === 'libraries') endpoint = `/school/libraries/${id}`;
      else if (activeTab === 'sections') endpoint = `/school/library-sections/${id}`;
      else if (activeTab === 'racks') endpoint = `/school/library-racks/${id}`;
      else if (activeTab === 'shelves') endpoint = `/school/library-shelves/${id}`;

      const response = await api.delete(endpoint);
      if (response.data.success) {
        toast.success(response.data.message || 'Record deleted successfully');
        fetchGridData();
        fetchParentData();
        fetchCounts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete record');
    }
  };

  const handleRestore = async (id: number) => {
    try {
      let endpoint = '';
      if (activeTab === 'libraries') endpoint = `/school/libraries/${id}/restore`;
      else if (activeTab === 'sections') endpoint = `/school/library-sections/${id}/restore`;
      else if (activeTab === 'racks') endpoint = `/school/library-racks/${id}/restore`;
      else if (activeTab === 'shelves') endpoint = `/school/library-shelves/${id}/restore`;

      const response = await api.post(endpoint);
      if (response.data.success) {
        toast.success(response.data.message || 'Record restored');
        fetchGridData();
        fetchParentData();
        fetchCounts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore record');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('This will permanently delete the record. Are you sure?')) return;
    try {
      let endpoint = '';
      if (activeTab === 'libraries') endpoint = `/school/libraries/${id}/force`;
      else if (activeTab === 'sections') endpoint = `/school/library-sections/${id}/force`;
      else if (activeTab === 'racks') endpoint = `/school/library-racks/${id}/force`;
      else if (activeTab === 'shelves') endpoint = `/school/library-shelves/${id}/force`;

      const response = await api.delete(endpoint);
      if (response.data.success) {
        toast.success(response.data.message || 'Permanently deleted');
        fetchGridData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to permanently delete record');
    }
  };

  // Bulk Actions
  const handleBulkStatusUpdate = async (isActive: boolean) => {
    setBulkUpdating(true);
    try {
      let endpoint = '';
      if (activeTab === 'libraries') endpoint = '/school/libraries/bulk-status';
      else if (activeTab === 'sections') endpoint = '/school/library-sections/bulk-status';
      else if (activeTab === 'racks') endpoint = '/school/library-racks/bulk-status';
      else if (activeTab === 'shelves') endpoint = '/school/library-shelves/bulk-status';

      const response = await api.post(endpoint, {
        status: isActive ? 'active' : 'inactive',
        ids: Array.from(selectedItems),
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedItems(new Set());
        fetchGridData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk status update failed');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    const confirmationMsg = showTrashed
      ? 'Are you sure you want to permanently delete these items?'
      : 'Are you sure you want to delete these items?';
    if (!confirm(confirmationMsg)) return;

    setBulkUpdating(true);
    try {
      let endpoint = '';
      if (activeTab === 'libraries') endpoint = '/school/libraries/bulk-delete';
      else if (activeTab === 'sections') endpoint = '/school/library-sections/bulk-delete';
      else if (activeTab === 'racks') endpoint = '/school/library-racks/bulk-delete';
      else if (activeTab === 'shelves') endpoint = '/school/library-shelves/bulk-delete';

      const response = await api.post(endpoint, {
        ids: Array.from(selectedItems),
        force: showTrashed,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedItems(new Set());
        fetchGridData();
        fetchParentData();
        fetchCounts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk delete failed');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkRestore = async () => {
    setBulkUpdating(true);
    try {
      let endpoint = '';
      if (activeTab === 'libraries') endpoint = '/school/libraries/bulk-restore';
      else if (activeTab === 'sections') endpoint = '/school/library-sections/bulk-restore';
      else if (activeTab === 'racks') endpoint = '/school/library-racks/bulk-restore';
      else if (activeTab === 'shelves') endpoint = '/school/library-shelves/bulk-restore';

      const response = await api.post(endpoint, {
        ids: Array.from(selectedItems),
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedItems(new Set());
        fetchGridData();
        fetchParentData();
        fetchCounts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk restore failed');
    } finally {
      setBulkUpdating(false);
    }
  };

  // Excel operations
  const handleExport = () => {
    try {
      let exportData: any[] = [];
      let filename = `library_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`;

      if (activeTab === 'libraries') {
        exportData = filteredData.map(item => ({
          'Library Code': item.library_code,
          'Library Name': item.name,
          'Location': item.location || '',
          'Description': item.description || '',
          'Status': item.is_active ? 'Active' : 'Inactive',
        }));
      } else if (activeTab === 'sections') {
        exportData = filteredData.map(item => ({
          'Section Code': item.section_code,
          'Section Name': item.name,
          'Library Code': item.library?.library_code || '',
          'Library Name': item.library?.name || '',
          'Description': item.description || '',
          'Status': item.is_active ? 'Active' : 'Inactive',
        }));
      } else if (activeTab === 'racks') {
        exportData = filteredData.map(item => ({
          'Rack Code': item.rack_code,
          'Rack Name': item.name,
          'Section Code': item.section?.section_code || '',
          'Section Name': item.section?.name || '',
          'Description': item.description || '',
          'Status': item.is_active ? 'Active' : 'Inactive',
        }));
      } else if (activeTab === 'shelves') {
        exportData = filteredData.map(item => ({
          'Shelf Code': item.shelf_code,
          'Shelf Name': item.name,
          'Rack Code': item.rack?.rack_code || '',
          'Rack Name': item.rack?.name || '',
          'Capacity': item.capacity,
          'Description': item.description || '',
          'Status': item.is_active ? 'Active' : 'Inactive',
        }));
      }

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, activeTab.toUpperCase());
      XLSX.writeFile(wb, filename);
      toast.success('Export successful!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const downloadSampleFile = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      let sheetName = '';
      let columns: any[] = [];
      let sampleRows: any[] = [];

      const statusValues = ['Active', 'Inactive'];

      if (activeTab === 'libraries') {
        sheetName = 'Libraries';
        columns = [
          { header: 'Library Code', key: 'library_code', width: 15 },
          { header: 'Library Name', key: 'name', width: 25 },
          { header: 'Location', key: 'location', width: 25 },
          { header: 'Description', key: 'description', width: 35 },
          { header: 'Status', key: 'status', width: 15 },
        ];
        sampleRows = [
          { library_code: 'LIB001', name: 'Main Library Room', location: 'Block A - Ground Floor', description: 'Central storage for course textbooks', status: 'Active' },
          { library_code: 'LIB002', name: 'Reference Room', location: 'Block B - 2nd Floor', description: 'Reference journals, articles and encyclopedia', status: 'Active' }
        ];
      } else if (activeTab === 'sections') {
        sheetName = 'Sections';
        columns = [
          { header: 'Section Code', key: 'section_code', width: 15 },
          { header: 'Section Name', key: 'name', width: 25 },
          { header: 'Library Code', key: 'library_code', width: 15 },
          { header: 'Description', key: 'description', width: 35 },
          { header: 'Status', key: 'status', width: 15 },
        ];
        sampleRows = [
          { section_code: 'SEC001', name: 'Science Journals', library_code: libraries[0]?.library_code || 'LIB000', description: 'Chemistry, Physics, Biology resources', status: 'Active' },
          { section_code: 'SEC002', name: 'History section', library_code: libraries[0]?.library_code || 'LIB000', description: 'World history, geography charts', status: 'Active' }
        ];
      } else if (activeTab === 'racks') {
        sheetName = 'Racks';
        columns = [
          { header: 'Rack Code', key: 'rack_code', width: 15 },
          { header: 'Rack Name', key: 'name', width: 25 },
          { header: 'Section Code', key: 'section_code', width: 15 },
          { header: 'Description', key: 'description', width: 35 },
          { header: 'Status', key: 'status', width: 15 },
        ];
        sampleRows = [
          { rack_code: 'RCK001', name: 'Almirah A-1', section_code: sections[0]?.section_code || 'SEC000', description: 'Wooden rack with transparent front doors', status: 'Active' },
          { rack_code: 'RCK002', name: 'Steel Shelf B', section_code: sections[0]?.section_code || 'SEC000', description: 'Iron open layout rack structure', status: 'Active' }
        ];
      } else if (activeTab === 'shelves') {
        sheetName = 'Shelves';
        columns = [
          { header: 'Shelf Code', key: 'shelf_code', width: 15 },
          { header: 'Shelf Name', key: 'name', width: 25 },
          { header: 'Rack Code', key: 'rack_code', width: 15 },
          { header: 'Capacity', key: 'capacity', width: 15 },
          { header: 'Description', key: 'description', width: 35 },
          { header: 'Status', key: 'status', width: 15 },
        ];
        sampleRows = [
          { shelf_code: 'SHF001', name: 'Row 1 Level 1', rack_code: racks[0]?.rack_code || 'RCK000', capacity: 60, description: 'Top row level for reference books', status: 'Active' },
          { shelf_code: 'SHF002', name: 'Row 1 Level 2', rack_code: racks[0]?.rack_code || 'RCK000', capacity: 50, description: 'Middle row shelf level', status: 'Active' }
        ];
      }

      const worksheet = workbook.addWorksheet(sheetName);
      worksheet.columns = columns;

      sampleRows.forEach(row => worksheet.addRow(row));

      // Embed reference data list for status dropdown validation
      worksheet.getCell('Y1').value = 'Status_List';
      statusValues.forEach((val, idx) => { worksheet.getCell(`Y${idx + 2}`).value = val; });
      worksheet.getColumn('Y').hidden = true;

      // Embed dynamic parent reference codes list if applicable
      let dropCol = 'Z';
      let parentOptionLength = 0;
      if (activeTab === 'sections') {
        worksheet.getCell('Z1').value = 'Library_Codes';
        libraries.forEach((lib, idx) => { worksheet.getCell(`Z${idx + 2}`).value = lib.library_code; });
        worksheet.getColumn('Z').hidden = true;
        parentOptionLength = libraries.length;
      } else if (activeTab === 'racks') {
        worksheet.getCell('Z1').value = 'Section_Codes';
        sections.forEach((sec, idx) => { worksheet.getCell(`Z${idx + 2}`).value = sec.section_code; });
        worksheet.getColumn('Z').hidden = true;
        parentOptionLength = sections.length;
      } else if (activeTab === 'shelves') {
        worksheet.getCell('Z1').value = 'Rack_Codes';
        racks.forEach((rk, idx) => { worksheet.getCell(`Z${idx + 2}`).value = rk.rack_code; });
        worksheet.getColumn('Z').hidden = true;
        parentOptionLength = racks.length;
      }

      // Add Data validations
      for (let r = 2; r <= 500; r++) {
        // Status validation
        const statusCol = activeTab === 'shelves' ? 'F' : activeTab === 'libraries' ? 'E' : 'E';
        worksheet.getCell(`${statusCol}${r}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'${sheetName}'!$Y$2:$Y$3`],
          showErrorMessage: true, errorTitle: 'Invalid Selection', error: 'Please select Active or Inactive.'
        };

        // Parent code validation
        if (activeTab !== 'libraries' && parentOptionLength > 0) {
          const parentCol = activeTab === 'shelves' ? 'C' : 'C';
          worksheet.getCell(`${parentCol}${r}`).dataValidation = {
            type: 'list', allowBlank: true, formulae: [`'${sheetName}'!$Z$2:$Z$${parentOptionLength + 1}`],
            showErrorMessage: true, errorTitle: 'Invalid Selection', error: 'Please select a code from valid list.'
          };
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `sample_library_${activeTab}.xlsx`);
      toast.success('Sample file downloaded!');
    } catch (error) {
      console.error('Error generating template:', error);
      toast.error('Failed to generate excel template');
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
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[];
        
        let headerRowIndex = -1;
        let headers: string[] = [];
        
        // Find headers row containing "code" or "Code"
        for (let i = 0; i < rows.length; i++) {
          const firstCell = rows[i][0];
          if (firstCell && (firstCell.toString().includes('Code') || firstCell.toString().toLowerCase().includes('code'))) {
            headerRowIndex = i;
            headers = rows[i].map((cell: any) => cell?.toString().trim() || '');
            break;
          }
        }
        
        if (headerRowIndex === -1) {
          toast.error('Could not find header row (e.g. "Library Code", "Section Code", "Rack Code", "Shelf Code")');
          return;
        }
        
        const dataRows: any[] = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          if (row[0] === 'Status_List') continue; // skip validation columns list cell
          
          const hasData = row.some((cell: any) => cell && cell.toString().trim() !== '');
          if (!hasData) continue;
          
          const rowData: any = {};
          for (let j = 0; j < headers.length; j++) {
            const header = headers[j];
            if (header && header !== 'Status_List' && !header.startsWith('__EMPTY')) {
              rowData[header] = row[j]?.toString() || '';
            }
          }
          dataRows.push(rowData);
        }
        
        if (dataRows.length === 0) {
          toast.error('No valid data rows found in the spreadsheet.');
          return;
        }
        
        setImportData(dataRows);
        setImportPreview(dataRows.slice(0, 5));
        setIsImportModalOpen(true);
      } catch (error) {
        console.error('File parsing error:', error);
        toast.error('Failed to parse excel file');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const submitImport = async () => {
    setImporting(true);
    try {
      let payload: any[] = [];
      let endpoint = '';

      if (activeTab === 'libraries') {
        payload = importData.map(row => ({
          library_code: row['Library Code'] || '',
          name: row['Library Name'] || '',
          location: row['Location'] || null,
          description: row['Description'] || null,
          is_active: row['Status'] ? row['Status'].toLowerCase() === 'active' : true,
        }));
        endpoint = '/school/libraries/bulk-import';
      } else if (activeTab === 'sections') {
        payload = importData.map(row => ({
          section_code: row['Section Code'] || '',
          name: row['Section Name'] || '',
          library_code: row['Library Code'] || '',
          description: row['Description'] || null,
          is_active: row['Status'] ? row['Status'].toLowerCase() === 'active' : true,
        }));
        endpoint = '/school/library-sections/bulk-import';
      } else if (activeTab === 'racks') {
        payload = importData.map(row => ({
          rack_code: row['Rack Code'] || '',
          name: row['Rack Name'] || '',
          section_code: row['Section Code'] || '',
          description: row['Description'] || null,
          is_active: row['Status'] ? row['Status'].toLowerCase() === 'active' : true,
        }));
        endpoint = '/school/library-racks/bulk-import';
      } else if (activeTab === 'shelves') {
        payload = importData.map(row => ({
          shelf_code: row['Shelf Code'] || '',
          name: row['Shelf Name'] || '',
          rack_code: row['Rack Code'] || '',
          capacity: parseInt(row['Capacity']) || 50,
          description: row['Description'] || null,
          is_active: row['Status'] ? row['Status'].toLowerCase() === 'active' : true,
        }));
        endpoint = '/school/library-shelves/bulk-import';
      }

      const response = await api.post(endpoint, { data: payload });
      if (response.data.success) {
        toast.success(response.data.message || 'Import successful');
        setIsImportModalOpen(false);
        fetchGridData();
        fetchParentData();
        fetchCounts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterLibraryId('');
    setFilterSectionId('');
    setFilterRackId('');
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Tab Switcher */}
      <div className="flex bg-gray-100 rounded-lg p-1 max-w-xl border border-gray-200">
        <button
          onClick={() => {
            setActiveTab('sections');
            setSortColumn('name');
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'sections'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>📂</span> Sections
          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
            activeTab === 'sections' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}>{counts.sections}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('racks');
            setSortColumn('name');
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'racks'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>🗄️</span> Racks
          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
            activeTab === 'racks' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}>{counts.racks}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('shelves');
            setSortColumn('name');
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'shelves'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>🔖</span> Shelves
          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
            activeTab === 'shelves' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}>{counts.shelves}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('libraries');
            setSortColumn('name');
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'libraries'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>🗺️</span> Libraries
          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
            activeTab === 'libraries' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}>{counts.libraries}</span>
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search code, name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none w-44 h-[26px] text-xs"
          />

          <Select
            value={
              filterStatus === 'true'
                ? { value: 'true', label: 'Active' }
                : filterStatus === 'false'
                  ? { value: 'false', label: 'Inactive' }
                  : null
            }
            onChange={(option) => setFilterStatus(option ? option.value : '')}
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' }
            ]}
            isSearchable={true}
            isClearable
            placeholder="All Status"
            styles={compactSelectStyles}
            className="w-28 text-[10px]"
          />

          {/* Conditional Parent Dropdown filters */}
          {activeTab === 'sections' && (
            <Select
              value={libraries.find(l => l.id.toString() === filterLibraryId) ? { value: filterLibraryId, label: libraries.find(l => l.id.toString() === filterLibraryId)?.name || '' } : null}
              onChange={(option) => setFilterLibraryId(option ? option.value : '')}
              options={libraries.map(l => ({ value: l.id.toString(), label: l.name }))}
              isSearchable={true}
              isClearable
              placeholder="All Libraries"
              styles={compactSelectStyles}
              className="w-40 text-[10px]"
            />
          )}

          {activeTab === 'racks' && (
            <Select
              value={sections.find(s => s.id.toString() === filterSectionId) ? { value: filterSectionId, label: sections.find(s => s.id.toString() === filterSectionId)?.name || '' } : null}
              onChange={(option) => setFilterSectionId(option ? option.value : '')}
              options={sections.map(s => ({ value: s.id.toString(), label: `${s.name} (${s.library?.name || ''})` }))}
              isSearchable={true}
              isClearable
              placeholder="All Sections"
              styles={compactSelectStyles}
              className="w-44 text-[10px]"
            />
          )}

          {activeTab === 'shelves' && (
            <Select
              value={racks.find(r => r.id.toString() === filterRackId) ? { value: filterRackId, label: racks.find(r => r.id.toString() === filterRackId)?.name || '' } : null}
              onChange={(option) => setFilterRackId(option ? option.value : '')}
              options={racks.map(r => ({ value: r.id.toString(), label: `${r.name} (${r.section?.name || ''})` }))}
              isSearchable={true}
              isClearable
              placeholder="All Racks"
              styles={compactSelectStyles}
              className="w-44 text-[10px]"
            />
          )}

          <div className="flex items-center bg-white border border-gray-300 rounded px-1.5 h-[26px]">
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
              <option value={50}>50</option>
              <option value={-1}>All</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-1.5 h-[26px]">
            <span className="text-[11px] font-semibold text-gray-600">Trashed</span>
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

          {(searchTerm || filterStatus || filterLibraryId || filterSectionId || filterRackId) && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-700 font-medium px-1 h-[26px]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Toolbar operations */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={downloadSampleFile}
            className="flex items-center gap-1 px-2.5 h-[26px] border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-xs font-medium cursor-pointer"
            title="Download Excel Sample Template"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Sample
          </button>

          <label className="flex items-center gap-1 px-2.5 h-[26px] border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition cursor-pointer text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 h-[26px] border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-xs font-medium cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>

          {!showTrashed && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1 px-2.5 h-[26px] bg-blue-500 hover:bg-blue-600 text-white rounded transition text-xs font-medium cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          )}
        </div>
      </div>

      {/* Inline Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-2 rounded text-xs text-blue-700 animate-fadeIn">
          <span className="font-semibold">{selectedItems.size} item(s) selected</span>
          <div className="flex items-center gap-2">
            {showTrashed ? (
              <>
                <button
                  onClick={handleBulkRestore}
                  disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 transition disabled:opacity-50 text-green-700 font-medium cursor-pointer"
                >
                  Restore Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded transition disabled:opacity-50 font-medium cursor-pointer"
                >
                  Permanently Delete Selected
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleBulkStatusUpdate(true)}
                  disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 transition disabled:opacity-50 text-green-700 font-medium cursor-pointer"
                >
                  Mark Active
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate(false)}
                  disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 transition disabled:opacity-50 text-red-700 font-medium cursor-pointer"
                >
                  Mark Inactive
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded transition disabled:opacity-50 font-medium cursor-pointer"
                >
                  Delete Selected
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Grid View */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm text-xs">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-1 text-gray-500 text-[10px]">Loading assets...</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold uppercase text-[10px]">
                  <th className="py-2 px-2.5 w-8">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={paginatedData.length > 0 && paginatedData.every(item => selectedItems.has(item.id))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer"
                    />
                  </th>
                  <th onClick={() => handleSort(activeTab === 'libraries' ? 'library_code' : activeTab === 'sections' ? 'section_code' : activeTab === 'racks' ? 'rack_code' : 'shelf_code')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition w-28">
                    Code {getSortIcon(activeTab === 'libraries' ? 'library_code' : activeTab === 'sections' ? 'section_code' : activeTab === 'racks' ? 'rack_code' : 'shelf_code')}
                  </th>
                  <th onClick={() => handleSort('name')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition">
                    Name {getSortIcon('name')}
                  </th>

                  {activeTab !== 'libraries' && (
                    <th className="py-2 px-2.5 w-48">
                      {activeTab === 'sections' ? 'Parent Library' : activeTab === 'racks' ? 'Parent Section' : 'Parent Rack'}
                    </th>
                  )}

                  {activeTab === 'libraries' && (
                    <th onClick={() => handleSort('location')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition w-44">
                      Location {getSortIcon('location')}
                    </th>
                  )}

                  {activeTab === 'shelves' && (
                    <th onClick={() => handleSort('capacity')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition w-24 text-center">
                      Capacity {getSortIcon('capacity')}
                    </th>
                  )}

                  <th className="py-2 px-2.5 w-60">Description</th>

                  <th onClick={() => handleSort('is_active')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition w-24 text-center">
                    Status {getSortIcon('is_active')}
                  </th>
                  <th className="py-2 px-2.5 w-20 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'libraries' ? 7 : activeTab === 'shelves' ? 8 : 7} className="py-8 text-center text-gray-500 font-medium">
                      No assets found. {showTrashed ? 'No deleted records matching.' : ''}
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
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer"
                        />
                      </td>
                      <td className="py-1.5 px-2.5 font-bold text-gray-900">
                        {activeTab === 'libraries'
                          ? item.library_code
                          : activeTab === 'sections'
                            ? item.section_code
                            : activeTab === 'racks'
                              ? item.rack_code
                              : item.shelf_code}
                      </td>
                      <td className="py-1.5 px-2.5 font-medium text-gray-950">{item.name}</td>

                      {/* Parent Relationships cells */}
                      {activeTab === 'sections' && (
                        <td className="py-1.5 px-2.5 text-gray-600 font-semibold">
                          🏛️ {item.library?.name || 'N/A'} ({item.library?.library_code || ''})
                        </td>
                      )}
                      {activeTab === 'racks' && (
                        <td className="py-1.5 px-2.5 text-gray-600 font-semibold">
                          📂 {item.section?.name || 'N/A'} ({item.section?.section_code || ''})
                        </td>
                      )}
                      {activeTab === 'shelves' && (
                        <td className="py-1.5 px-2.5 text-gray-600 font-semibold">
                          🗄️ {item.rack?.name || 'N/A'} ({item.rack?.rack_code || ''})
                        </td>
                      )}

                      {activeTab === 'libraries' && (
                        <td className="py-1.5 px-2.5 text-gray-600 truncate max-w-xs">{item.location || '-'}</td>
                      )}

                      {activeTab === 'shelves' && (
                        <td className="py-1.5 px-2.5 text-center font-bold text-blue-600">{item.capacity} books</td>
                      )}

                      <td className="py-1.5 px-2.5 text-gray-500 truncate max-w-xs">{item.description || '-'}</td>

                      <td className="py-1.5 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <ToggleSwitch
                            checked={item.is_active}
                            onChange={() => handleToggleStatus(item.id)}
                            disabled={showTrashed}
                          />
                          <span className={`text-[10px] font-semibold w-10 text-left ${item.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>

                      <td className="py-1.5 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {showTrashed ? (
                            <>
                              <button
                                onClick={() => handleRestore(item.id)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded transition cursor-pointer"
                                title="Restore"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2a8.001 8.001 0 11-21.21-3h3.582" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleForceDelete(item.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
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
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                                title="Edit"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(item.id, item.name)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
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
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 bg-gray-50 select-none">
            <span className="text-gray-500 font-semibold text-[10px]">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 py-0.5 border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 transition text-[10px] font-semibold disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-2 py-0.5 border rounded text-[10px] font-bold transition cursor-pointer ${
                    currentPage === index + 1
                      ? 'bg-blue-500 border-blue-500 text-white shadow-sm'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2 py-0.5 border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 transition text-[10px] font-semibold disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CRUD Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-100 overflow-hidden animate-slideUp">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-200 text-gray-800">
              <h3 className="font-bold text-sm">
                {editingItem ? 'Edit' : 'Add New'} {activeTab === 'libraries' ? 'Library' : activeTab === 'sections' ? 'Section' : activeTab === 'racks' ? 'Rack' : 'Shelf'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition text-sm">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveItem} className="p-4 space-y-3.5 text-xs">
              {/* LIBRARIES FORM */}
              {activeTab === 'libraries' && (
                <>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Library Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LIB001"
                      value={libraryForm.library_code}
                      onChange={(e) => setLibraryForm(prev => ({ ...prev, library_code: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Library Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Central Library"
                      value={libraryForm.name}
                      onChange={(e) => setLibraryForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Academic Block, 2nd Floor"
                      value={libraryForm.location}
                      onChange={(e) => setLibraryForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Description</label>
                    <textarea
                      placeholder="Enter description..."
                      value={libraryForm.description}
                      onChange={(e) => setLibraryForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none h-16 resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <ToggleSwitch
                      checked={libraryForm.is_active}
                      onChange={(val) => setLibraryForm(prev => ({ ...prev, is_active: val }))}
                    />
                    <span className="font-semibold text-gray-700">Active Status</span>
                  </div>
                </>
              )}

              {/* SECTIONS FORM */}
              {activeTab === 'sections' && (
                <>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Section Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SEC001"
                      value={sectionForm.section_code}
                      onChange={(e) => setSectionForm(prev => ({ ...prev, section_code: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Section Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Reference Books"
                      value={sectionForm.name}
                      onChange={(e) => setSectionForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Parent Library *</label>
                    <Select
                      value={libraries.find(l => l.id.toString() === sectionForm.library_id) ? { value: sectionForm.library_id, label: libraries.find(l => l.id.toString() === sectionForm.library_id)?.name || '' } : null}
                      onChange={(option) => setSectionForm(prev => ({ ...prev, library_id: option ? option.value : '' }))}
                      options={libraries.map(l => ({ value: l.id.toString(), label: l.name }))}
                      placeholder="Select Parent Library"
                      styles={customSelectStyles}
                      isSearchable={true}
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Description</label>
                    <textarea
                      placeholder="Enter description..."
                      value={sectionForm.description}
                      onChange={(e) => setSectionForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none h-16 resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <ToggleSwitch
                      checked={sectionForm.is_active}
                      onChange={(val) => setSectionForm(prev => ({ ...prev, is_active: val }))}
                    />
                    <span className="font-semibold text-gray-700">Active Status</span>
                  </div>
                </>
              )}

              {/* RACKS FORM */}
              {activeTab === 'racks' && (
                <>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Rack Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. RCK001"
                      value={rackForm.rack_code}
                      onChange={(e) => setRackForm(prev => ({ ...prev, rack_code: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Rack Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Steel Almirah B"
                      value={rackForm.name}
                      onChange={(e) => setRackForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Parent Section *</label>
                    <Select
                      value={sections.find(s => s.id.toString() === rackForm.library_section_id) ? { value: rackForm.library_section_id, label: sections.find(s => s.id.toString() === rackForm.library_section_id)?.name || '' } : null}
                      onChange={(option) => setRackForm(prev => ({ ...prev, library_section_id: option ? option.value : '' }))}
                      options={sections.map(s => ({ value: s.id.toString(), label: `${s.name} (${s.library?.name || ''})` }))}
                      placeholder="Select Parent Section"
                      styles={customSelectStyles}
                      isSearchable={true}
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Description</label>
                    <textarea
                      placeholder="Enter description..."
                      value={rackForm.description}
                      onChange={(e) => setRackForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none h-16 resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <ToggleSwitch
                      checked={rackForm.is_active}
                      onChange={(val) => setRackForm(prev => ({ ...prev, is_active: val }))}
                    />
                    <span className="font-semibold text-gray-700">Active Status</span>
                  </div>
                </>
              )}

              {/* SHELVES FORM */}
              {activeTab === 'shelves' && (
                <>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Shelf Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SHF001"
                      value={shelfForm.shelf_code}
                      onChange={(e) => setShelfForm(prev => ({ ...prev, shelf_code: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Shelf Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Row 1 Level A"
                      value={shelfForm.name}
                      onChange={(e) => setShelfForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Parent Rack *</label>
                    <Select
                      value={racks.find(r => r.id.toString() === shelfForm.library_rack_id) ? { value: shelfForm.library_rack_id, label: racks.find(r => r.id.toString() === shelfForm.library_rack_id)?.name || '' } : null}
                      onChange={(option) => setShelfForm(prev => ({ ...prev, library_rack_id: option ? option.value : '' }))}
                      options={racks.map(r => ({ value: r.id.toString(), label: `${r.name} (${r.section?.name || ''})` }))}
                      placeholder="Select Parent Rack"
                      styles={customSelectStyles}
                      isSearchable={true}
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Capacity (No. of Books) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={shelfForm.capacity}
                      onChange={(e) => setShelfForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 50 }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Description</label>
                    <textarea
                      placeholder="Enter description..."
                      value={shelfForm.description}
                      onChange={(e) => setShelfForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none h-16 resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <ToggleSwitch
                      checked={shelfForm.is_active}
                      onChange={(val) => setShelfForm(prev => ({ ...prev, is_active: val }))}
                    />
                    <span className="font-semibold text-gray-700">Active Status</span>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 border border-gray-300 rounded text-gray-700 font-medium hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium shadow-sm transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spreadsheet Import Preview Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl border border-gray-100 overflow-hidden animate-slideUp text-xs">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-200 text-gray-800">
              <h3 className="font-bold text-sm">
                Verify Spreadsheet Data ({activeTab.toUpperCase()})
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition text-sm">
                ✕
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <p className="text-gray-600">
                Below is a preview of the first 5 records parsed from your sheet. Click "Confirm Import" to insert all <strong>{importData.length}</strong> items.
              </p>
              
              <div className="border border-gray-200 rounded overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold uppercase text-[10px]">
                      {activeTab === 'libraries' && (
                        <>
                          <th className="py-1.5 px-2">Library Code</th>
                          <th className="py-1.5 px-2">Library Name</th>
                          <th className="py-1.5 px-2">Location</th>
                          <th className="py-1.5 px-2">Status</th>
                        </>
                      )}
                      {activeTab === 'sections' && (
                        <>
                          <th className="py-1.5 px-2">Section Code</th>
                          <th className="py-1.5 px-2">Section Name</th>
                          <th className="py-1.5 px-2">Library Code</th>
                          <th className="py-1.5 px-2">Status</th>
                        </>
                      )}
                      {activeTab === 'racks' && (
                        <>
                          <th className="py-1.5 px-2">Rack Code</th>
                          <th className="py-1.5 px-2">Rack Name</th>
                          <th className="py-1.5 px-2">Section Code</th>
                          <th className="py-1.5 px-2">Status</th>
                        </>
                      )}
                      {activeTab === 'shelves' && (
                        <>
                          <th className="py-1.5 px-2">Shelf Code</th>
                          <th className="py-1.5 px-2">Shelf Name</th>
                          <th className="py-1.5 px-2">Rack Code</th>
                          <th className="py-1.5 px-2">Capacity</th>
                          <th className="py-1.5 px-2">Status</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {importPreview.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 text-gray-600">
                        {activeTab === 'libraries' && (
                          <>
                            <td className="py-1.5 px-2 font-bold">{row['Library Code']}</td>
                            <td className="py-1.5 px-2 font-medium text-gray-800">{row['Library Name']}</td>
                            <td className="py-1.5 px-2">{row['Location'] || '-'}</td>
                            <td className="py-1.5 px-2">{row['Status'] || 'Active'}</td>
                          </>
                        )}
                        {activeTab === 'sections' && (
                          <>
                            <td className="py-1.5 px-2 font-bold">{row['Section Code']}</td>
                            <td className="py-1.5 px-2 font-medium text-gray-800">{row['Section Name']}</td>
                            <td className="py-1.5 px-2 font-semibold text-blue-600">{row['Library Code']}</td>
                            <td className="py-1.5 px-2">{row['Status'] || 'Active'}</td>
                          </>
                        )}
                        {activeTab === 'racks' && (
                          <>
                            <td className="py-1.5 px-2 font-bold">{row['Rack Code']}</td>
                            <td className="py-1.5 px-2 font-medium text-gray-800">{row['Rack Name']}</td>
                            <td className="py-1.5 px-2 font-semibold text-blue-600">{row['Section Code']}</td>
                            <td className="py-1.5 px-2">{row['Status'] || 'Active'}</td>
                          </>
                        )}
                        {activeTab === 'shelves' && (
                          <>
                            <td className="py-1.5 px-2 font-bold">{row['Shelf Code']}</td>
                            <td className="py-1.5 px-2 font-medium text-gray-800">{row['Shelf Name']}</td>
                            <td className="py-1.5 px-2 font-semibold text-blue-600">{row['Rack Code']}</td>
                            <td className="py-1.5 px-2 font-semibold">{row['Capacity'] || 50}</td>
                            <td className="py-1.5 px-2">{row['Status'] || 'Active'}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-1.5 border border-gray-300 rounded text-gray-700 font-medium hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitImport}
                  disabled={importing}
                  className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Confirm Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RackShelfManager;
