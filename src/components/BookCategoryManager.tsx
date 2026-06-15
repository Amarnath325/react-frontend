import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Premium styling for react-select matching our system's Tailwind design
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

interface BookCategory {
  id: number;
  school_id: number;
  category_code: string;
  name: string;
  category_type_id: number;
  category_type?: {
    m_id: number;
    m_name: string;
    m_alias_name: string | null;
  } | null;
  display_order: number;
  is_active: boolean;
  description: string | null;
  allow_book_issue: boolean;
  show_in_search: boolean;
  featured_category: boolean;
  sub_categories_count?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// Toggle Switch Component (matches standard sizing)
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

const BookCategoryManager: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [filteredData, setFilteredData] = useState<BookCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BookCategory | null>(null);
  
  // Trashed items filter state
  const [showTrashed, setShowTrashed] = useState(false);

  // Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  
  // Bulk Selection states
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>('display_order');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  // Dynamic Master Category Types
  const [categoryTypes, setCategoryTypes] = useState<{ value: string; label: string; }[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    category_code: '',
    name: '',
    category_type_id: '',
    display_order: 1,
    is_active: true,
    description: '',
    allow_book_issue: true,
    show_in_search: true,
    featured_category: false,
  });

  useEffect(() => {
    fetchCategoryTypes();
    fetchCategories();
  }, [showTrashed]);

  const fetchCategoryTypes = async () => {
    try {
      const response = await api.get('/master/options-id/category_type');
      if (response.data.success) {
        const data = response.data.data;
        const options = Object.entries(data).map(([id, name]) => ({
          value: id,
          label: String(name)
        }));
        setCategoryTypes(options);
      }
    } catch (error) {
      console.error('Error fetching category types:', error);
    }
  };

  useEffect(() => {
    applyFiltersAndSorting();
  }, [categories, searchTerm, filterStatus, filterType, sortColumn, sortDirection]);

  useEffect(() => {
    setSelectedItems(new Set());
  }, [searchTerm, filterStatus, filterType, showTrashed, currentPage, itemsPerPage]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/school/book-categories', {
        params: { only_trashed: showTrashed }
      });
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load book categories');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...categories];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(lowerSearch) ||
        item.category_code.toLowerCase().includes(lowerSearch) ||
        (item.description && item.description.toLowerCase().includes(lowerSearch))
      );
    }

    if (filterStatus) {
      filtered = filtered.filter(item => item.is_active.toString() === filterStatus);
    }

    if (filterType) {
      filtered = filtered.filter(item => item.category_type_id.toString() === filterType);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof BookCategory] ?? '';
      let bVal: any = b[sortColumn as keyof BookCategory] ?? '';
      
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
    setFilterType('');
  };

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = itemsPerPage === -1 
    ? filteredData 
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'display_order' ? parseInt(value) || 0 : value)
    }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      category_code: '',
      name: '',
      category_type_id: categoryTypes.find(t => t.label === 'General')?.value || (categoryTypes.length > 0 ? categoryTypes[0].value : ''),
      display_order: categories.length + 1,
      is_active: true,
      description: '',
      allow_book_issue: true,
      show_in_search: true,
      featured_category: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: BookCategory) => {
    setEditingItem(item);
    setFormData({
      category_code: item.category_code,
      name: item.name,
      category_type_id: item.category_type_id.toString(),
      display_order: item.display_order,
      is_active: item.is_active,
      description: item.description || '',
      allow_book_issue: item.allow_book_issue,
      show_in_search: item.show_in_search,
      featured_category: item.featured_category,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category_code) {
      toast.error('Category Code is required');
      return;
    }
    if (!formData.name) {
      toast.error('Category Name is required');
      return;
    }
    if (!formData.category_type_id) {
      toast.error('Category Type is required');
      return;
    }

    try {
      const submitData = {
        category_code: formData.category_code,
        name: formData.name,
        category_type_id: parseInt(formData.category_type_id),
        display_order: formData.display_order,
        is_active: formData.is_active,
        description: formData.description || null,
        allow_book_issue: formData.allow_book_issue,
        show_in_search: formData.show_in_search,
        featured_category: formData.featured_category,
      };

      if (editingItem) {
        const response = await api.put(`/school/book-categories/${editingItem.id}`, submitData);
        if (response.data.success) {
          toast.success('Book Category updated successfully');
        }
      } else {
        const response = await api.post('/school/book-categories', submitData);
        if (response.data.success) {
          toast.success('Book Category created successfully');
        }
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      try {
        const response = await api.delete(`/school/book-categories/${id}`);
        if (response.data.success) {
          toast.success('Category deleted successfully');
          fetchCategories();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await api.patch(`/school/book-categories/${id}/toggle-status`);
      if (response.data.success) {
        toast.success('Category status updated');
        fetchCategories();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleRestore = async (id: number) => {
    if (!window.confirm('Are you sure you want to restore this category?')) return;
    try {
      const response = await api.post(`/school/book-categories/${id}/restore`);
      if (response.data.success) {
        toast.success('Category restored successfully');
        fetchCategories();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore category');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this category? This action cannot be undone.')) return;
    try {
      const response = await api.delete(`/school/book-categories/${id}/force`);
      if (response.data.success) {
        toast.success('Category permanently deleted');
        fetchCategories();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to permanently delete category');
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

  const handleBulkStatusUpdate = async (status: boolean) => {
    setBulkUpdating(true);
    const ids = Array.from(selectedItems);
    
    try {
      const response = await api.post('/school/book-categories/bulk-status', {
        status: status ? 'active' : 'inactive',
        ids: ids
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Status updated successfully');
        setSelectedItems(new Set());
        fetchCategories();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    const confirmMessage = showTrashed
      ? `Are you sure you want to permanently delete ${selectedItems.size} selected category(ies)? This action cannot be undone.`
      : `Are you sure you want to delete ${selectedItems.size} selected category(ies)?`;

    if (window.confirm(confirmMessage)) {
      setBulkUpdating(true);
      const ids = Array.from(selectedItems);
      
      try {
        const response = await api.post('/school/book-categories/bulk-delete', {
          ids: ids,
          force: showTrashed
        });
        if (response.data.success) {
          toast.success(response.data.message || 'Deleted successfully');
          setSelectedItems(new Set());
          fetchCategories();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete');
      } finally {
        setBulkUpdating(false);
      }
    }
  };

  const handleBulkRestore = async () => {
    if (window.confirm(`Are you sure you want to restore ${selectedItems.size} selected category(ies)?`)) {
      setBulkUpdating(true);
      const ids = Array.from(selectedItems);
      
      try {
        const response = await api.post('/school/book-categories/bulk-restore', {
          ids: ids
        });
        if (response.data.success) {
          toast.success(response.data.message || 'Restored successfully');
          setSelectedItems(new Set());
          fetchCategories();
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
        'Category Code': item.category_code,
        'Category Name': item.name,
        'Category Type': item.category_type?.m_alias_name ?? item.category_type?.m_name ?? '',
        'Display Order': item.display_order,
        'Description': item.description || '',
        'Allow Book Issue': item.allow_book_issue ? 'Yes' : 'No',
        'Show In Search': item.show_in_search ? 'Yes' : 'No',
        'Featured Category': item.featured_category ? 'Yes' : 'No',
        'Status': item.is_active ? 'Active' : 'Inactive',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Book Categories');
      XLSX.writeFile(wb, `book_categories_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Export successful!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const downloadSampleFile = async () => {
    try {
      const statusValues = ['Active', 'Inactive'];
      const yesNoValues = ['Yes', 'No'];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Book Categories');

      worksheet.columns = [
        { header: 'Category Code', key: 'category_code', width: 15 },
        { header: 'Category Name', key: 'category_name', width: 25 },
        { header: 'Category Type', key: 'category_type', width: 15 },
        { header: 'Display Order', key: 'display_order', width: 15 },
        { header: 'Description', key: 'description', width: 35 },
        { header: 'Allow Book Issue', key: 'allow_book_issue', width: 18 },
        { header: 'Show In Search', key: 'show_in_search', width: 18 },
        { header: 'Featured Category', key: 'featured_category', width: 18 },
        { header: 'Status', key: 'status', width: 15 },
      ];

      worksheet.addRow({
        category_code: 'CAT001',
        category_name: 'Science',
        category_type: 'Academic',
        display_order: 1,
        description: 'Science related textbooks, materials',
        allow_book_issue: 'Yes',
        show_in_search: 'Yes',
        featured_category: 'No',
        status: 'Active',
      });
      worksheet.addRow({
        category_code: 'CAT002',
        category_name: 'Fiction Novels',
        category_type: 'Fiction',
        display_order: 2,
        description: 'Novels, drama and light reading books',
        allow_book_issue: 'Yes',
        show_in_search: 'Yes',
        featured_category: 'Yes',
        status: 'Active',
      });

      // Validations lists in helper columns
      worksheet.getCell('K1').value = 'Status_List';
      statusValues.forEach((val, idx) => { worksheet.getCell(`K${idx + 2}`).value = val; });
      worksheet.getColumn('K').hidden = true;

      worksheet.getCell('L1').value = 'YesNo_List';
      yesNoValues.forEach((val, idx) => { worksheet.getCell(`L${idx + 2}`).value = val; });
      worksheet.getColumn('L').hidden = true;

      worksheet.getCell('M1').value = 'Type_List';
      categoryTypes.forEach((val, idx) => { worksheet.getCell(`M${idx + 2}`).value = val.label; });
      worksheet.getColumn('M').hidden = true;

      // Apply validations
      for (let r = 2; r <= 500; r++) {
        worksheet.getCell(`C${r}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'Book Categories'!$M$2:$M$${categoryTypes.length + 1}`],
          showErrorMessage: true, errorTitle: 'Invalid Selection', error: 'Please select a valid Category Type.'
        };
        worksheet.getCell(`F${r}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'Book Categories'!$L$2:$L$3`],
          showErrorMessage: true, errorTitle: 'Invalid Selection', error: 'Please select Yes or No.'
        };
        worksheet.getCell(`G${r}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'Book Categories'!$L$2:$L$3`],
          showErrorMessage: true, errorTitle: 'Invalid Selection', error: 'Please select Yes or No.'
        };
        worksheet.getCell(`H${r}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'Book Categories'!$L$2:$L$3`],
          showErrorMessage: true, errorTitle: 'Invalid Selection', error: 'Please select Yes or No.'
        };
        worksheet.getCell(`I${r}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'Book Categories'!$K$2:$K$3`],
          showErrorMessage: true, errorTitle: 'Invalid Selection', error: 'Please select Active or Inactive.'
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_book_categories.xlsx');
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
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[];
        
        let headerRowIndex = -1;
        let headers: string[] = [];
        
        for (let i = 0; i < rows.length; i++) {
          const firstCell = rows[i][0];
          if (firstCell && (firstCell === 'Category Code' || firstCell?.toString().includes('Code'))) {
            headerRowIndex = i;
            headers = rows[i].map((cell: any) => cell?.toString().trim() || '');
            break;
          }
        }
        
        if (headerRowIndex === -1) {
          toast.error('Could not find header row (e.g., "Category Code")');
          return;
        }
        
        const dataRows: any[] = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          const firstCell = row[0];
          if (firstCell && (firstCell.toString().includes('_List') || firstCell === 'Status_List' || firstCell === 'YesNo_List')) {
            continue;
          }
          
          const hasData = row.some((cell: any) => cell && cell.toString().trim() !== '');
          if (!hasData) continue;
          
          const rowData: any = {};
          for (let j = 0; j < headers.length; j++) {
            const header = headers[j];
            if (header && !header.includes('_List') && !header.includes('YesNo_') && header !== '__EMPTY') {
              rowData[header] = row[j]?.toString() || '';
            }
          }
          
          if (rowData['Category Code'] && rowData['Category Name']) {
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
      const payload = importData.map(row => ({
        category_code: row['Category Code'],
        category_name: row['Category Name'],
        category_type: row['Category Type'] || 'General',
        display_order: parseInt(row['Display Order']) || 1,
        description: row['Description'] || null,
        allow_book_issue: row['Allow Book Issue'] ? row['Allow Book Issue'].toLowerCase() === 'yes' : true,
        show_in_search: row['Show In Search'] ? row['Show In Search'].toLowerCase() === 'yes' : true,
        featured_category: row['Featured Category'] ? row['Featured Category'].toLowerCase() === 'yes' : false,
        is_active: row['Status'] ? row['Status'].toLowerCase() === 'active' : true,
      }));

      const response = await api.post('/school/book-categories/bulk-import', { data: payload });
      if (response.data.success) {
        toast.success(response.data.message || 'Import completed successfully');
        setIsImportModalOpen(false);
        fetchCategories();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600 text-xs">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search, filters, controls layout */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search by name, code..."
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

          <Select
            value={categoryTypes.find(t => t.value === filterType) || null}
            onChange={(option) => setFilterType(option ? option.value : '')}
            options={categoryTypes}
            isSearchable={true}
            isClearable
            placeholder="All Types"
            styles={compactSelectStyles}
            className="w-32 text-[10px]"
          />

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

          {(searchTerm || filterStatus || filterType) && (
            <button
              onClick={clearFilters}
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

      {/* Bulk actions */}
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

      {/* Table view */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm text-xs">
        <div className="overflow-x-auto">
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
                <th onClick={() => handleSort('category_code')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition w-28">
                  Code {getSortIcon('category_code')}
                </th>
                <th onClick={() => handleSort('name')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition">
                  Category Name {getSortIcon('name')}
                </th>
                <th onClick={() => handleSort('category_type')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition w-28">
                  Category Type {getSortIcon('category_type')}
                </th>
                <th onClick={() => handleSort('display_order')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition w-24 text-center">
                  Order {getSortIcon('display_order')}
                </th>
                <th className="py-2 px-2.5 w-36 text-center">Sub-Categories</th>
                <th className="py-2 px-2.5 w-24 text-center">Allow Issue</th>
                <th onClick={() => handleSort('is_active')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition w-24 text-center">
                  Status {getSortIcon('is_active')}
                </th>
                <th className="py-2 px-2.5 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-gray-500 font-medium">
                    {showTrashed ? 'No deleted book categories found.' : 'No book categories found.'}
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
                    <td className="py-1.5 px-2.5 font-bold text-gray-900">{item.category_code}</td>
                    <td className="py-1.5 px-2.5">
                      <div className="font-medium text-gray-950">{item.name}</div>
                      {item.description && <div className="text-[10px] text-gray-400 truncate max-w-xs">{item.description}</div>}
                    </td>
                    <td className="py-1.5 px-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-semibold text-[10px] uppercase">
                        {item.category_type?.m_alias_name ?? item.category_type?.m_name ?? 'N/A'}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 text-center font-medium">{item.display_order}</td>
                    <td className="py-1.5 px-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => navigate(`/library/sub-categories?book_category_id=${item.id}`)}
                        className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 font-semibold transition cursor-pointer text-[10px]"
                      >
                        📂 {item.sub_categories_count ?? 0} Sub-Categories
                      </button>
                    </td>
                    <td className="py-1.5 px-2.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${item.allow_book_issue ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {item.allow_book_issue ? 'Yes' : 'No'}
                      </span>
                    </td>
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
        </div>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && itemsPerPage !== -1 && (
        <div className="flex items-center justify-between border-t border-gray-150 bg-white px-2 py-1.5 text-xs">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded border border-gray-300 bg-white px-2.5 py-0.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative ml-2 inline-flex items-center rounded border border-gray-300 bg-white px-2.5 py-0.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
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

      {/* CREATE & EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 max-w-2xl w-full">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <h3 className="text-[13px] font-bold uppercase tracking-wider">
                {editingItem ? 'Edit Book Category' : 'Create Book Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-gray-200 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs text-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Category Code */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Category Code *</label>
                  <input
                    type="text"
                    name="category_code"
                    required
                    placeholder="e.g. CAT001"
                    value={formData.category_code}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none h-7.5"
                  />
                </div>

                {/* Category Name */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Category Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Science"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none h-7.5"
                  />
                </div>

                {/* Category Type */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Category Type *</label>
                  <Select
                    value={categoryTypes.find(t => t.value === formData.category_type_id) || null}
                    onChange={(option) => setFormData(prev => ({ ...prev, category_type_id: option ? option.value : '' }))}
                    options={categoryTypes}
                    isSearchable={true}
                    placeholder="Select Type..."
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                  />
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Display Order</label>
                  <input
                    type="number"
                    name="display_order"
                    min="0"
                    placeholder="e.g. 1"
                    value={formData.display_order}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none h-7.5"
                  />
                </div>

                {/* Status Toggle */}
                <div className="flex flex-col justify-center">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                  <div className="flex items-center h-7.5">
                    <ToggleSwitch
                      checked={formData.is_active}
                      onChange={(val) => setFormData(prev => ({ ...prev, is_active: val }))}
                    />
                    <span className={`text-[10px] font-semibold ml-2 ${formData.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                      {formData.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Description</label>
                <textarea
                  name="description"
                  placeholder="Enter category description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none min-h-[60px]"
                />
              </div>

              {/* Toggle Switches Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-gray-100">
                <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-gray-50/50">
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Allow Book Issue</span>
                  <ToggleSwitch
                    checked={formData.allow_book_issue}
                    onChange={(val) => setFormData(prev => ({ ...prev, allow_book_issue: val }))}
                  />
                </div>

                <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-gray-50/50">
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Show In Search</span>
                  <ToggleSwitch
                    checked={formData.show_in_search}
                    onChange={(val) => setFormData(prev => ({ ...prev, show_in_search: val }))}
                  />
                </div>

                <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-gray-50/50">
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Featured Category</span>
                  <ToggleSwitch
                    checked={formData.featured_category}
                    onChange={(val) => setFormData(prev => ({ ...prev, featured_category: val }))}
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition font-semibold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXCEL IMPORT PREVIEW MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 max-w-4xl w-full">
            <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <h3 className="text-[13px] font-bold uppercase tracking-wider">Import Preview ({importData.length} Categories)</h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-white hover:text-gray-200 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <p className="text-gray-500">Below is a preview of the first 5 records to be imported. Review the data format before submitting.</p>
              
              <div className="bg-gray-50 rounded border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-semibold text-[10px] uppercase">
                      <th className="py-1.5 px-2">Code</th>
                      <th className="py-1.5 px-2">Name</th>
                      <th className="py-1.5 px-2">Type</th>
                      <th className="py-1.5 px-2">Order</th>
                      <th className="py-1.5 px-2">Allow Issue</th>
                      <th className="py-1.5 px-2">Show In Search</th>
                      <th className="py-1.5 px-2">Featured</th>
                      <th className="py-1.5 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-150 text-gray-600">
                        <td className="py-1 px-2 font-bold text-gray-900">{row['Category Code']}</td>
                        <td className="py-1 px-2">{row['Category Name']}</td>
                        <td className="py-1 px-2">{row['Category Type'] || 'General'}</td>
                        <td className="py-1 px-2">{row['Display Order'] || '1'}</td>
                        <td className="py-1 px-2">{row['Allow Book Issue'] || 'Yes'}</td>
                        <td className="py-1 px-2">{row['Show In Search'] || 'Yes'}</td>
                        <td className="py-1 px-2">{row['Featured Category'] || 'No'}</td>
                        <td className="py-1 px-2">{row['Status'] || 'Active'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={submitImport}
                  disabled={importing}
                  className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold disabled:opacity-50 cursor-pointer"
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

export default BookCategoryManager;
