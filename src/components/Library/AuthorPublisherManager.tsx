import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Custom dropdown styles for react-select matching our system's Tailwind design
const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.375rem',
    borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 1px rgba(59, 130, 246, 0.15)' : 'none',
    minHeight: '30px',
    height: '30px',
    backgroundColor: '#ffffff',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#9ca3af',
    },
    transition: 'all 0.15s ease',
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 8px',
    height: '28px',
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
    height: '28px',
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    padding: '4px',
  }),
  clearIndicator: (base: any) => ({
    ...base,
    padding: '4px',
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
    padding: '6px 8px',
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
    marginTop: '4px',
    zIndex: 9999,
  }),
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 9999,
  }),
};

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
    zIndex: 9999,
  }),
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 9999,
  }),
};

// Toggle switch component matching standard dimensions
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

interface Author {
  id: number;
  school_id: number;
  author_code: string;
  name: string;
  date_of_birth: string | null;
  country: string | null;
  language: string | null;
  website: string | null;
  biography: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

interface Publisher {
  id: number;
  school_id: number;
  publisher_code: string;
  name: string;
  contact_person: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

const AuthorPublisherManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'authors' | 'publishers'>('authors');
  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showTrashed, setShowTrashed] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Bulk Selection states
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // CRUD Modals states
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [isPublisherModalOpen, setIsPublisherModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [editingPublisher, setEditingPublisher] = useState<Publisher | null>(null);

  // Form states
  const [authorForm, setAuthorForm] = useState({
    author_code: '',
    name: '',
    date_of_birth: '',
    country: '',
    language: '',
    website: '',
    biography: '',
    is_active: true,
  });

  const [publisherForm, setPublisherForm] = useState({
    publisher_code: '',
    name: '',
    contact_person: '',
    mobile: '',
    email: '',
    website: '',
    city: '',
    country: '',
    address: '',
    is_active: true,
  });

  // Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab, showTrashed]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedItems(new Set());
  }, [activeTab, searchTerm, filterStatus, showTrashed, itemsPerPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'authors') {
        const response = await api.get('/school/authors', {
          params: { only_trashed: showTrashed }
        });
        if (response.data.success) {
          setAuthors(response.data.data);
        }
      } else {
        const response = await api.get('/school/publishers', {
          params: { only_trashed: showTrashed }
        });
        if (response.data.success) {
          setPublishers(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(`Failed to load ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper filters and sorting
  const getFilteredData = () => {
    let source = activeTab === 'authors' ? [...authors] : [...publishers];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      if (activeTab === 'authors') {
        source = source.filter((item: any) =>
          item.author_code.toLowerCase().includes(lowerSearch) ||
          item.name.toLowerCase().includes(lowerSearch) ||
          (item.country && item.country.toLowerCase().includes(lowerSearch)) ||
          (item.language && item.language.toLowerCase().includes(lowerSearch)) ||
          (item.biography && item.biography.toLowerCase().includes(lowerSearch))
        );
      } else {
        source = source.filter((item: any) =>
          item.publisher_code.toLowerCase().includes(lowerSearch) ||
          item.name.toLowerCase().includes(lowerSearch) ||
          (item.contact_person && item.contact_person.toLowerCase().includes(lowerSearch)) ||
          (item.mobile && item.mobile.toLowerCase().includes(lowerSearch)) ||
          (item.email && item.email.toLowerCase().includes(lowerSearch)) ||
          (item.city && item.city.toLowerCase().includes(lowerSearch)) ||
          (item.country && item.country.toLowerCase().includes(lowerSearch)) ||
          (item.address && item.address.toLowerCase().includes(lowerSearch))
        );
      }
    }

    if (filterStatus) {
      source = source.filter((item: any) => item.is_active.toString() === filterStatus);
    }

    // Sorting
    source.sort((a: any, b: any) => {
      let aVal = a[sortColumn] ?? '';
      let bVal = b[sortColumn] ?? '';

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return source;
  };

  const filteredData = getFilteredData();
  const totalPages = itemsPerPage === -1 ? 1 : Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedData = itemsPerPage === -1
    ? filteredData
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  // Selection
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

  // Status Toggles
  const handleToggleStatus = async (id: number) => {
    try {
      const endpoint = activeTab === 'authors' ? `/school/authors/${id}/toggle-status` : `/school/publishers/${id}/toggle-status`;
      const response = await api.patch(endpoint);
      if (response.data.success) {
        toast.success('Status updated successfully');
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  // Restore & Delete Operations
  const handleDelete = async (id: number, name: string) => {
    const confirmMsg = `Are you sure you want to delete ${activeTab.slice(0, -1)} "${name}"?`;
    if (window.confirm(confirmMsg)) {
      try {
        const endpoint = activeTab === 'authors' ? `/school/authors/${id}` : `/school/publishers/${id}`;
        const response = await api.delete(endpoint);
        if (response.data.success) {
          toast.success(`${activeTab.slice(0, -1).replace(/^\w/, c => c.toUpperCase())} deleted successfully`);
          fetchData();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleRestore = async (id: number) => {
    if (!window.confirm(`Are you sure you want to restore this ${activeTab.slice(0, -1)}?`)) return;
    try {
      const endpoint = activeTab === 'authors' ? `/school/authors/${id}/restore` : `/school/publishers/${id}/restore`;
      const response = await api.post(endpoint);
      if (response.data.success) {
        toast.success(`${activeTab.slice(0, -1).replace(/^\w/, c => c.toUpperCase())} restored successfully`);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Restore failed');
    }
  };

  const handleForceDelete = async (id: number) => {
    const confirmMsg = `Are you sure you want to permanently delete this ${activeTab.slice(0, -1)}? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;
    try {
      const endpoint = activeTab === 'authors' ? `/school/authors/${id}/force` : `/school/publishers/${id}/force`;
      const response = await api.delete(endpoint);
      if (response.data.success) {
        toast.success(`${activeTab.slice(0, -1).replace(/^\w/, c => c.toUpperCase())} permanently deleted`);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Permanent delete failed');
    }
  };

  // Bulk operations
  const handleBulkStatusUpdate = async (status: boolean) => {
    setBulkUpdating(true);
    const ids = Array.from(selectedItems);
    try {
      const endpoint = activeTab === 'authors' ? '/school/authors/bulk-status' : '/school/publishers/bulk-status';
      const response = await api.post(endpoint, {
        status: status ? 'active' : 'inactive',
        ids: ids
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Status updated successfully');
        setSelectedItems(new Set());
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update bulk status');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    const confirmMessage = showTrashed
      ? `Are you sure you want to permanently delete ${selectedItems.size} selected item(s)? This action cannot be undone.`
      : `Are you sure you want to delete ${selectedItems.size} selected item(s)?`;

    if (window.confirm(confirmMessage)) {
      setBulkUpdating(true);
      const ids = Array.from(selectedItems);
      try {
        const endpoint = activeTab === 'authors' ? '/school/authors/bulk-delete' : '/school/publishers/bulk-delete';
        const response = await api.post(endpoint, {
          ids: ids,
          force: showTrashed
        });
        if (response.data.success) {
          toast.success(response.data.message || 'Deleted successfully');
          setSelectedItems(new Set());
          fetchData();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete');
      } finally {
        setBulkUpdating(false);
      }
    }
  };

  const handleBulkRestore = async () => {
    if (window.confirm(`Are you sure you want to restore ${selectedItems.size} selected item(s)?`)) {
      setBulkUpdating(true);
      const ids = Array.from(selectedItems);
      try {
        const endpoint = activeTab === 'authors' ? '/school/authors/bulk-restore' : '/school/publishers/bulk-restore';
        const response = await api.post(endpoint, {
          ids: ids
        });
        if (response.data.success) {
          toast.success(response.data.message || 'Restored successfully');
          setSelectedItems(new Set());
          fetchData();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to restore');
      } finally {
        setBulkUpdating(false);
      }
    }
  };

  // CRUD Forms submits
  const handleAuthorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorForm.author_code.trim()) {
      toast.error('Author Code is required');
      return;
    }
    if (!authorForm.name.trim()) {
      toast.error('Author Name is required');
      return;
    }
    
    // Clean fields
    const payload = {
      ...authorForm,
      date_of_birth: authorForm.date_of_birth || null,
      country: authorForm.country || null,
      language: authorForm.language || null,
      website: authorForm.website || null,
      biography: authorForm.biography || null,
    };

    try {
      if (editingAuthor) {
        const response = await api.put(`/school/authors/${editingAuthor.id}`, payload);
        if (response.data.success) {
          toast.success('Author updated successfully');
          setIsAuthorModalOpen(false);
          fetchData();
        }
      } else {
        const response = await api.post('/school/authors', payload);
        if (response.data.success) {
          toast.success('Author created successfully');
          setIsAuthorModalOpen(false);
          fetchData();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Save failed');
    }
  };

  const handlePublisherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publisherForm.publisher_code.trim()) {
      toast.error('Publisher Code is required');
      return;
    }
    if (!publisherForm.name.trim()) {
      toast.error('Publisher Name is required');
      return;
    }

    const payload = {
      ...publisherForm,
      contact_person: publisherForm.contact_person || null,
      mobile: publisherForm.mobile || null,
      email: publisherForm.email || null,
      website: publisherForm.website || null,
      city: publisherForm.city || null,
      country: publisherForm.country || null,
      address: publisherForm.address || null,
    };

    try {
      if (editingPublisher) {
        const response = await api.put(`/school/publishers/${editingPublisher.id}`, payload);
        if (response.data.success) {
          toast.success('Publisher updated successfully');
          setIsPublisherModalOpen(false);
          fetchData();
        }
      } else {
        const response = await api.post('/school/publishers', payload);
        if (response.data.success) {
          toast.success('Publisher created successfully');
          setIsPublisherModalOpen(false);
          fetchData();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Save failed');
    }
  };

  const openAddAuthor = () => {
    setEditingAuthor(null);
    setAuthorForm({
      author_code: '',
      name: '',
      date_of_birth: '',
      country: '',
      language: '',
      website: '',
      biography: '',
      is_active: true,
    });
    setIsAuthorModalOpen(true);
  };

  const openEditAuthor = (item: Author) => {
    setEditingAuthor(item);
    // Format date properly from model
    let dob = '';
    if (item.date_of_birth) {
      // Check if it's already a YYYY-MM-DD string
      dob = item.date_of_birth.split('T')[0];
    }
    setAuthorForm({
      author_code: item.author_code,
      name: item.name,
      date_of_birth: dob,
      country: item.country || '',
      language: item.language || '',
      website: item.website || '',
      biography: item.biography || '',
      is_active: item.is_active,
    });
    setIsAuthorModalOpen(true);
  };

  const openAddPublisher = () => {
    setEditingPublisher(null);
    setPublisherForm({
      publisher_code: '',
      name: '',
      contact_person: '',
      mobile: '',
      email: '',
      website: '',
      city: '',
      country: '',
      address: '',
      is_active: true,
    });
    setIsPublisherModalOpen(true);
  };

  const openEditPublisher = (item: Publisher) => {
    setEditingPublisher(item);
    setPublisherForm({
      publisher_code: item.publisher_code,
      name: item.name,
      contact_person: item.contact_person || '',
      mobile: item.mobile || '',
      email: item.email || '',
      website: item.website || '',
      city: item.city || '',
      country: item.country || '',
      address: item.address || '',
      is_active: item.is_active,
    });
    setIsPublisherModalOpen(true);
  };

  // Excel Operations: Export
  const handleExport = () => {
    try {
      let exportData: any[] = [];
      let filename = '';

      if (activeTab === 'authors') {
        exportData = filteredData.map((item: any) => ({
          'Author Code': item.author_code,
          'Name': item.name,
          'Date Of Birth': item.date_of_birth ? item.date_of_birth.split('T')[0] : '',
          'Country': item.country || '',
          'Language': item.language || '',
          'Website': item.website || '',
          'Biography': item.biography || '',
          'Status': item.is_active ? 'Active' : 'Inactive',
        }));
        filename = `authors_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else {
        exportData = filteredData.map((item: any) => ({
          'Publisher Code': item.publisher_code,
          'Name': item.name,
          'Contact Person': item.contact_person || '',
          'Mobile': item.mobile || '',
          'Email': item.email || '',
          'Website': item.website || '',
          'City': item.city || '',
          'Country': item.country || '',
          'Address': item.address || '',
          'Status': item.is_active ? 'Active' : 'Inactive',
        }));
        filename = `publishers_${new Date().toISOString().split('T')[0]}.xlsx`;
      }

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, activeTab === 'authors' ? 'Authors' : 'Publishers');
      XLSX.writeFile(wb, filename);
      toast.success('Export successful!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  // Download Sample Spreadsheet Template
  const downloadSampleFile = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheetName = activeTab === 'authors' ? 'Authors' : 'Publishers';
      const worksheet = workbook.addWorksheet(sheetName);

      if (activeTab === 'authors') {
        worksheet.columns = [
          { header: 'Author Code', key: 'author_code', width: 15 },
          { header: 'Name', key: 'name', width: 25 },
          { header: 'Date Of Birth', key: 'date_of_birth', width: 15 },
          { header: 'Country', key: 'country', width: 15 },
          { header: 'Language', key: 'language', width: 15 },
          { header: 'Website', key: 'website', width: 25 },
          { header: 'Biography', key: 'biography', width: 40 },
          { header: 'Status', key: 'status', width: 15 },
        ];
        worksheet.addRow({
          author_code: 'AUT001',
          name: 'R.K Narayan',
          date_of_birth: '1906-10-10',
          country: 'India',
          language: 'English',
          website: 'https://rknarayan.com',
          biography: 'One of the early Indian writers in English.',
          status: 'Active'
        });
      } else {
        worksheet.columns = [
          { header: 'Publisher Code', key: 'publisher_code', width: 15 },
          { header: 'Name', key: 'name', width: 25 },
          { header: 'Contact Person', key: 'contact_person', width: 20 },
          { header: 'Mobile', key: 'mobile', width: 18 },
          { header: 'Email', key: 'email', width: 25 },
          { header: 'Website', key: 'website', width: 25 },
          { header: 'City', key: 'city', width: 15 },
          { header: 'Country', key: 'country', width: 15 },
          { header: 'Address', key: 'address', width: 35 },
          { header: 'Status', key: 'status', width: 15 },
        ];
        worksheet.addRow({
          publisher_code: 'PUB001',
          name: 'Oxford Publication',
          contact_person: 'Mr. David Finch',
          mobile: '9876543210',
          email: 'sales@oup.com',
          website: 'https://oup.com',
          city: 'Oxford',
          country: 'United Kingdom',
          address: 'Great Clarendon Street, Oxford',
          status: 'Active'
        });
      }

      // Add hidden column for dropdown validation list
      const dropCol = activeTab === 'authors' ? 'L' : 'N';
      worksheet.getCell(`${dropCol}1`).value = 'Status_List';
      worksheet.getCell(`${dropCol}2`).value = 'Active';
      worksheet.getCell(`${dropCol}3`).value = 'Inactive';
      worksheet.getColumn(dropCol).hidden = true;

      const validationRange = activeTab === 'authors' ? 'H' : 'J';
      for (let r = 2; r <= 500; r++) {
        worksheet.getCell(`${validationRange}${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'${sheetName}'!$${dropCol}$2:$${dropCol}$3`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select Active or Inactive.'
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `sample_${activeTab}.xlsx`);
      toast.success('Sample file downloaded!');
    } catch (error) {
      console.error('Error downloading sample file:', error);
      toast.error('Failed to download sample file');
    }
  };

  // Upload Excel file
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

        // Find header row starting with either Code
        for (let i = 0; i < rows.length; i++) {
          const firstCell = rows[i][0];
          if (firstCell && (firstCell.toString().includes('Code') || firstCell.toString().toLowerCase().includes('code'))) {
            headerRowIndex = i;
            headers = rows[i].map((cell: any) => cell?.toString().trim() || '');
            break;
          }
        }

        if (headerRowIndex === -1) {
          toast.error('Could not find header row (e.g. starting with Code columns)');
          return;
        }

        const dataRows: any[] = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          // Skip hidden validation list
          if (row[0] === 'Status_List') continue;

          const hasData = row.some((cell: any) => cell && cell.toString().trim() !== '');
          if (!hasData) continue;

          const rowData: any = {};
          for (let j = 0; j < headers.length; j++) {
            const header = headers[j];
            if (header && header !== 'Status_List' && !header.startsWith('__EMPTY')) {
              rowData[header] = row[j]?.toString() || '';
            }
          }

          if (rowData['Name'] && (rowData['Author Code'] || rowData['Publisher Code'])) {
            dataRows.push(rowData);
          }
        }

        if (dataRows.length === 0) {
          toast.error('No valid data rows found in the excel file.');
          return;
        }

        setImportData(dataRows);
        setImportPreview(dataRows.slice(0, 5));
        setIsImportModalOpen(true);
      } catch (error) {
        console.error('File read error:', error);
        toast.error('Failed to read excel file');
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

      if (activeTab === 'authors') {
        payload = importData.map(row => ({
          author_code: row['Author Code'],
          name: row['Name'],
          date_of_birth: row['Date Of Birth'] ? row['Date Of Birth'].split('T')[0] : null,
          country: row['Country'] || null,
          language: row['Language'] || null,
          website: row['Website'] || null,
          biography: row['Biography'] || null,
          is_active: row['Status'] ? row['Status'].toLowerCase() === 'active' : true,
        }));
        endpoint = '/school/authors/bulk-import';
      } else {
        payload = importData.map(row => ({
          publisher_code: row['Publisher Code'],
          name: row['Name'],
          contact_person: row['Contact Person'] || null,
          mobile: row['Mobile'] || null,
          email: row['Email'] || null,
          website: row['Website'] || null,
          city: row['City'] || null,
          country: row['Country'] || null,
          address: row['Address'] || null,
          is_active: row['Status'] ? row['Status'].toLowerCase() === 'active' : true,
        }));
        endpoint = '/school/publishers/bulk-import';
      }

      const response = await api.post(endpoint, { data: payload });
      if (response.data.success) {
        toast.success(response.data.message || 'Import completed successfully');
        setIsImportModalOpen(false);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  if (loading && authors.length === 0 && publishers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600 text-xs">Loading directories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dynamic Tab Switcher */}
      <div className="flex bg-gray-100 rounded-lg p-1 max-w-md border border-gray-200">
        <button
          onClick={() => {
            setActiveTab('authors');
            setSortColumn('name');
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'authors'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>✍️</span> Authors Directory
        </button>
        <button
          onClick={() => {
            setActiveTab('publishers');
            setSortColumn('name');
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'publishers'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>🏢</span> Publishers Directory
        </button>
      </div>

      {/* Search, filters, controls row */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none w-44 h-[26px] text-xs"
          />

          <div className="w-28">
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
              isSearchable={false}
              isClearable
              placeholder="All Status"
              styles={compactSelectStyles}
              className="text-[10px]"
            />
          </div>

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
              <option value={100}>100</option>
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

          {(searchTerm || filterStatus) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
              }}
              className="text-xs text-red-500 hover:text-red-700 font-medium px-1 h-[26px]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Action Buttons */}
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
              onClick={activeTab === 'authors' ? openAddAuthor : openAddPublisher}
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

      {/* Main Grid View */}
      <div className="bg-white rounded-xl shadow border border-gray-150 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-blue-600 border-t-transparent"></div>
            <span className="ml-2 text-xs text-gray-500">Updating list view...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2 px-3 w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={paginatedData.length > 0 && paginatedData.every(item => selectedItems.has(item.id))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
                  <th
                    onClick={() => handleSort(activeTab === 'authors' ? 'author_code' : 'publisher_code')}
                    className="py-2 px-3 cursor-pointer select-none hover:bg-gray-100 transition w-24"
                  >
                    Code {getSortIcon(activeTab === 'authors' ? 'author_code' : 'publisher_code')}
                  </th>
                  <th
                    onClick={() => handleSort('name')}
                    className="py-2 px-3 cursor-pointer select-none hover:bg-gray-100 transition w-[18%]"
                  >
                    Name {getSortIcon('name')}
                  </th>

                  {activeTab === 'authors' ? (
                    <>
                      <th className="py-2 px-3 w-28">DOB</th>
                      <th className="py-2 px-3 w-28">Country</th>
                      <th className="py-2 px-3 w-28">Language</th>
                      <th className="py-2 px-3">Biography</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2 px-3 w-[15%]">Contact Person</th>
                      <th className="py-2 px-3 w-28">Mobile</th>
                      <th className="py-2 px-3 w-40">Email</th>
                      <th className="py-2 px-3 w-28">City</th>
                      <th className="py-2 px-3 w-28">Country</th>
                    </>
                  )}

                  <th className="py-2 px-3 w-24 text-center">Status</th>
                  <th className="py-2 px-3 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'authors' ? 8 : 10} className="py-8 text-center text-gray-400 font-medium">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item: any) => (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-100 hover:bg-gray-50/50 transition duration-150 ${
                        selectedItems.has(item.id) ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <td className="py-2 px-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-3 font-semibold text-gray-700">{activeTab === 'authors' ? item.author_code : item.publisher_code}</td>
                      <td className="py-2 px-3 font-bold text-gray-900">{item.name}</td>

                      {activeTab === 'authors' ? (
                        <>
                          <td className="py-2 px-3 text-gray-500 font-medium">{item.date_of_birth ? item.date_of_birth.split('T')[0] : '-'}</td>
                          <td className="py-2 px-3 text-gray-500">{item.country || '-'}</td>
                          <td className="py-2 px-3 text-gray-500">{item.language || '-'}</td>
                          <td className="py-2 px-3 text-gray-500 truncate max-w-[200px]" title={item.biography}>{item.biography || '-'}</td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 px-3 text-gray-500">{item.contact_person || '-'}</td>
                          <td className="py-2 px-3 text-gray-500 font-medium">{item.mobile || '-'}</td>
                          <td className="py-2 px-3 text-gray-500 truncate max-w-[140px]">{item.email || '-'}</td>
                          <td className="py-2 px-3 text-gray-500">{item.city || '-'}</td>
                          <td className="py-2 px-3 text-gray-500">{item.country || '-'}</td>
                        </>
                      )}

                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center">
                          <ToggleSwitch
                            checked={item.is_active}
                            onChange={() => !showTrashed && handleToggleStatus(item.id)}
                            disabled={showTrashed}
                          />
                        </div>
                      </td>

                      <td className="py-2 px-3 text-center">
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
                                onClick={() => activeTab === 'authors' ? openEditAuthor(item) : openEditPublisher(item)}
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
          </div>
        )}

        {/* Bottom Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-150 px-3 py-2 bg-gray-50 text-[11px]">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded border border-gray-300 bg-white px-2.5 py-0.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative ml-2 inline-flex items-center rounded border border-gray-300 bg-white px-2.5 py-0.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
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
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-1.5 py-1 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-40 cursor-pointer"
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`relative inline-flex items-center px-2.5 py-1 text-xs font-semibold focus:z-20 cursor-pointer ${
                        currentPage === i + 1
                          ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-1.5 py-1 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-40 cursor-pointer"
                  >
                    &gt;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Action Bar overlay */}
      {selectedItems.size > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3.5 z-40 border border-gray-700 animate-slideUp text-xs font-bold">
          <span className="text-gray-300">{selectedItems.size} selected</span>
          <div className="h-4 w-[1px] bg-gray-700" />
          
          {showTrashed ? (
            <>
              <button
                onClick={handleBulkRestore}
                disabled={bulkUpdating}
                className="text-blue-400 hover:text-blue-300 transition disabled:opacity-50 cursor-pointer"
              >
                Restore Selected
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkUpdating}
                className="text-red-400 hover:text-red-300 transition disabled:opacity-50 cursor-pointer"
              >
                Permanently Delete Selected
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleBulkStatusUpdate(true)}
                disabled={bulkUpdating}
                className="text-green-400 hover:text-green-300 transition disabled:opacity-50 cursor-pointer"
              >
                Mark Active
              </button>
              <button
                onClick={() => handleBulkStatusUpdate(false)}
                disabled={bulkUpdating}
                className="text-yellow-400 hover:text-yellow-300 transition disabled:opacity-50 cursor-pointer"
              >
                Mark Inactive
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkUpdating}
                className="text-red-400 hover:text-red-300 transition disabled:opacity-50 cursor-pointer"
              >
                Delete Selected
              </button>
            </>
          )}
        </div>
      )}

      {/* AUTHOR MODAL */}
      {isAuthorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 max-w-2xl w-full">
            <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <h3 className="text-[13px] font-bold uppercase tracking-wider">
                {editingAuthor ? 'Edit Author Details' : 'Create Author Entry'}
              </h3>
              <button onClick={() => setIsAuthorModalOpen(false)} className="text-white hover:text-gray-200 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAuthorSubmit} className="p-4 space-y-3.5 text-xs text-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Author Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AUT001"
                    value={authorForm.author_code}
                    onChange={(e) => setAuthorForm(prev => ({ ...prev, author_code: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none h-[28px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Author Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. R.K Narayan"
                    value={authorForm.name}
                    onChange={(e) => setAuthorForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none h-[28px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Date Of Birth</label>
                  <input
                    type="date"
                    value={authorForm.date_of_birth}
                    onChange={(e) => setAuthorForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none h-[28px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Country</label>
                  <input
                    type="text"
                    placeholder="e.g. India"
                    value={authorForm.country}
                    onChange={(e) => setAuthorForm(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none h-[28px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Language</label>
                  <input
                    type="text"
                    placeholder="e.g. English"
                    value={authorForm.language}
                    onChange={(e) => setAuthorForm(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none h-[28px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Website</label>
                  <input
                    type="text"
                    placeholder="e.g. www.rknarayan.com"
                    value={authorForm.website}
                    onChange={(e) => setAuthorForm(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none h-[28px]"
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                  <div className="flex items-center h-[28px]">
                    <ToggleSwitch
                      checked={authorForm.is_active}
                      onChange={(val) => setAuthorForm(prev => ({ ...prev, is_active: val }))}
                    />
                    <span className={`text-[10px] font-semibold ml-2 ${authorForm.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                      {authorForm.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Biography</label>
                <textarea
                  placeholder="Enter biography details..."
                  value={authorForm.biography}
                  onChange={(e) => setAuthorForm(prev => ({ ...prev, biography: e.target.value }))}
                  rows={3}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[60px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setIsAuthorModalOpen(false)}
                  className="px-3.5 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold transition cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PUBLISHER MODAL */}
      {isPublisherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 max-w-2xl w-full">
            <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <h3 className="text-[13px] font-bold uppercase tracking-wider">
                {editingPublisher ? 'Edit Publisher Details' : 'Create Publisher Entry'}
              </h3>
              <button onClick={() => setIsPublisherModalOpen(false)} className="text-white hover:text-gray-200 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handlePublisherSubmit} className="p-4 space-y-3.5 text-xs text-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Publisher Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PUB001"
                    value={publisherForm.publisher_code}
                    onChange={(e) => setPublisherForm(prev => ({ ...prev, publisher_code: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none h-[28px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Publisher Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oxford Publication"
                    value={publisherForm.name}
                    onChange={(e) => setPublisherForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none h-[28px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Enter name..."
                    value={publisherForm.contact_person}
                    onChange={(e) => setPublisherForm(prev => ({ ...prev, contact_person: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none h-[28px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Mobile</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={publisherForm.mobile}
                    onChange={(e) => setPublisherForm(prev => ({ ...prev, mobile: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none h-[28px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Email</label>
                  <input
                    type="email"
                    placeholder="e.g. contact@pub.com"
                    value={publisherForm.email}
                    onChange={(e) => setPublisherForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none h-[28px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Website</label>
                  <input
                    type="text"
                    placeholder="e.g. www.pub.com"
                    value={publisherForm.website}
                    onChange={(e) => setPublisherForm(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none h-[28px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Oxford"
                    value={publisherForm.city}
                    onChange={(e) => setPublisherForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none h-[28px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Country</label>
                  <input
                    type="text"
                    placeholder="e.g. UK"
                    value={publisherForm.country}
                    onChange={(e) => setPublisherForm(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none h-[28px]"
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                  <div className="flex items-center h-[28px]">
                    <ToggleSwitch
                      checked={publisherForm.is_active}
                      onChange={(val) => setPublisherForm(prev => ({ ...prev, is_active: val }))}
                    />
                    <span className={`text-[10px] font-semibold ml-2 ${publisherForm.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                      {publisherForm.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Address</label>
                <textarea
                  placeholder="Enter physical mailing address..."
                  value={publisherForm.address}
                  onChange={(e) => setPublisherForm(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[50px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setIsPublisherModalOpen(false)}
                  className="px-3.5 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold transition cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SPREADSHEET IMPORT PREVIEW MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 max-w-4xl w-full">
            <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <h3 className="text-[13px] font-bold uppercase tracking-wider">
                Import Preview ({importData.length} {activeTab.replace(/^\w/, c => c.toUpperCase())})
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-white hover:text-gray-200 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              <p className="text-gray-500">
                Below is a preview of the first 5 records parsed from the spreadsheet. Ensure they match directory standards.
              </p>

              <div className="bg-gray-50 rounded border border-gray-200 overflow-hidden">
                {activeTab === 'authors' ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-semibold text-[10px] uppercase">
                        <th className="py-1.5 px-3">Code</th>
                        <th className="py-1.5 px-3">Name</th>
                        <th className="py-1.5 px-3">DOB</th>
                        <th className="py-1.5 px-3">Country</th>
                        <th className="py-1.5 px-3">Language</th>
                        <th className="py-1.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-150 text-gray-600">
                          <td className="py-1 px-3 font-semibold text-gray-750">{row['Author Code']}</td>
                          <td className="py-1 px-3 font-semibold text-gray-900">{row['Name']}</td>
                          <td className="py-1 px-3">{row['Date Of Birth'] || '-'}</td>
                          <td className="py-1 px-3">{row['Country'] || '-'}</td>
                          <td className="py-1 px-3">{row['Language'] || '-'}</td>
                          <td className="py-1 px-3">{row['Status'] || 'Active'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-semibold text-[10px] uppercase">
                        <th className="py-1.5 px-3">Code</th>
                        <th className="py-1.5 px-3">Name</th>
                        <th className="py-1.5 px-3">Contact Person</th>
                        <th className="py-1.5 px-3">Mobile</th>
                        <th className="py-1.5 px-3">Email</th>
                        <th className="py-1.5 px-3">City</th>
                        <th className="py-1.5 px-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-150 text-gray-600">
                          <td className="py-1 px-3 font-semibold text-gray-750">{row['Publisher Code']}</td>
                          <td className="py-1 px-3 font-semibold text-gray-900">{row['Name']}</td>
                          <td className="py-1 px-3">{row['Contact Person'] || '-'}</td>
                          <td className="py-1 px-3">{row['Mobile'] || '-'}</td>
                          <td className="py-1 px-3 truncate max-w-xs">{row['Email'] || '-'}</td>
                          <td className="py-1 px-3">{row['City'] || '-'}</td>
                          <td className="py-1 px-3">{row['Status'] || 'Active'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-150">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={submitImport}
                  disabled={importing}
                  className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold disabled:opacity-50 transition cursor-pointer"
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

export default AuthorPublisherManager;
