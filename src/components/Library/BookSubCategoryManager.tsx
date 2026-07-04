import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
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
  name: string;
  category_code: string;
}

interface BookSubCategory {
  id: number;
  school_id: number;
  book_category_id: number;
  name: string;
  description: string | null;
  custom_label_1_id: number | null;
  custom_label1?: {
    m_id: number;
    m_name: string;
    m_alias_name: string | null;
  } | null;
  custom_value_1: string | null;
  custom_label_2_id: number | null;
  custom_label2?: {
    m_id: number;
    m_name: string;
    m_alias_name: string | null;
  } | null;
  custom_value_2: string | null;
  is_active: boolean;
  category?: BookCategory;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// Sizing matching system toggle standard
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

const BookSubCategoryManager: React.FC = () => {
  const location = useLocation();
  const [subCategories, setSubCategories] = useState<BookSubCategory[]>([]);
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [filteredData, setFilteredData] = useState<BookSubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BookSubCategory | null>(null);
  
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
  const [sortColumn, setSortColumn] = useState<string>('book_category_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    book_category_id: '',
    name: '',
    description: '',
    custom_label_1_id: '',
    custom_value_1: '',
    custom_label_2_id: '',
    custom_value_2: '',
    is_active: true,
  });

  const [metadataLabels, setMetadataLabels] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryId = params.get('book_category_id');
    if (categoryId) {
      setFilterCategory(categoryId);
    }
  }, [location.search]);

  useEffect(() => {
    fetchInitialData();
  }, [showTrashed]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [subCategories, searchTerm, filterStatus, filterCategory, sortColumn, sortDirection]);

  useEffect(() => {
    setSelectedItems(new Set());
  }, [searchTerm, filterStatus, filterCategory, showTrashed, currentPage, itemsPerPage]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Dynamic Metadata Labels
      const labelsResponse = await api.get('/master/options-id/BOOK_METADATA_LABEL');
      let fetchedLabels: { value: string; label: string }[] = [];
      if (labelsResponse.data.success) {
        fetchedLabels = Object.entries(labelsResponse.data.data).map(([id, name]) => ({
          value: id,
          label: String(name)
        }));
        setMetadataLabels(fetchedLabels);
      }

      // 2. Fetch Categories (needed for dropdowns and filtering)
      const categoriesResponse = await api.get('/school/book-categories');
      let currentCategories: BookCategory[] = [];
      if (categoriesResponse.data.success) {
        currentCategories = categoriesResponse.data.data;
        setCategories(currentCategories);
      }

      // 3. Fetch Sub Categories
      const response = await api.get('/school/book-sub-categories', {
        params: { only_trashed: showTrashed }
      });
      if (response.data.success) {
        setSubCategories(response.data.data);
        
        // If data was seeded automatically on first load, refetch Categories and Metadata Labels too
        if (currentCategories.length === 0 && response.data.data.length > 0) {
          const updatedCategoriesResponse = await api.get('/school/book-categories');
          if (updatedCategoriesResponse.data.success) {
            setCategories(updatedCategoriesResponse.data.data);
          }
          const updatedLabelsResponse = await api.get('/master/options-id/BOOK_METADATA_LABEL');
          if (updatedLabelsResponse.data.success) {
            setMetadataLabels(Object.entries(updatedLabelsResponse.data.data).map(([id, name]) => ({
              value: id,
              label: String(name)
            })));
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load sub-categories');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...subCategories];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(lowerSearch) ||
        (item.description && item.description.toLowerCase().includes(lowerSearch)) ||
        (item.category && item.category.name.toLowerCase().includes(lowerSearch))
      );
    }

    if (filterStatus) {
      filtered = filtered.filter(item => item.is_active.toString() === filterStatus);
    }

    if (filterCategory) {
      filtered = filtered.filter(item => item.book_category_id.toString() === filterCategory);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortColumn === 'category') {
        aVal = a.category?.name ?? '';
        bVal = b.category?.name ?? '';
      } else {
        aVal = a[sortColumn as keyof BookSubCategory] ?? '';
        bVal = b[sortColumn as keyof BookSubCategory] ?? '';
      }
      
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
    setFilterCategory('');
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
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openAddModal = () => {
    const targetAudienceOption = metadataLabels.find(l => l.label === 'Target Audience');
    const defaultLabel1Id = targetAudienceOption ? targetAudienceOption.value : '';

    setEditingItem(null);
    setFormData({
      book_category_id: categories.length > 0 ? categories[0].id.toString() : '',
      name: '',
      description: '',
      custom_label_1_id: defaultLabel1Id,
      custom_value_1: '',
      custom_label_2_id: '',
      custom_value_2: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: BookSubCategory) => {
    setEditingItem(item);
    setFormData({
      book_category_id: item.book_category_id.toString(),
      name: item.name,
      description: item.description || '',
      custom_label_1_id: item.custom_label_1_id ? item.custom_label_1_id.toString() : '',
      custom_value_1: item.custom_value_1 || '',
      custom_label_2_id: item.custom_label_2_id ? item.custom_label_2_id.toString() : '',
      custom_value_2: item.custom_value_2 || '',
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.book_category_id) {
      toast.error('Parent Category is required');
      return;
    }
    if (!formData.name) {
      toast.error('Sub-Category Name is required');
      return;
    }

    try {
      const label1Option = metadataLabels.find(l => l.value === formData.custom_label_1_id);
      const isLabel1None = !label1Option || label1Option.label === 'None';
      
      const label2Option = metadataLabels.find(l => l.value === formData.custom_label_2_id);
      const isLabel2None = !label2Option || label2Option.label === 'None';

      const submitData = {
        book_category_id: parseInt(formData.book_category_id),
        name: formData.name,
        description: formData.description || null,
        custom_label_1_id: isLabel1None ? null : parseInt(formData.custom_label_1_id),
        custom_value_1: isLabel1None ? null : formData.custom_value_1,
        custom_label_2_id: isLabel2None ? null : parseInt(formData.custom_label_2_id),
        custom_value_2: isLabel2None ? null : formData.custom_value_2,
        is_active: formData.is_active,
      };

      if (editingItem) {
        const response = await api.put(`/school/book-sub-categories/${editingItem.id}`, submitData);
        if (response.data.success) {
          toast.success('Book Sub-Category updated successfully');
        }
      } else {
        const response = await api.post('/school/book-sub-categories', submitData);
        if (response.data.success) {
          toast.success('Book Sub-Category created successfully');
        }
      }
      setIsModalOpen(false);
      fetchInitialData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete sub-category "${name}"?`)) {
      try {
        const response = await api.delete(`/school/book-sub-categories/${id}`);
        if (response.data.success) {
          toast.success('Sub-category deleted successfully');
          fetchInitialData();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await api.patch(`/school/book-sub-categories/${id}/toggle-status`);
      if (response.data.success) {
        toast.success('Sub-category status updated');
        fetchInitialData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleRestore = async (id: number) => {
    if (!window.confirm('Are you sure you want to restore this sub-category?')) return;
    try {
      const response = await api.post(`/school/book-sub-categories/${id}/restore`);
      if (response.data.success) {
        toast.success('Sub-category restored successfully');
        fetchInitialData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore sub-category');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this sub-category? This action cannot be undone.')) return;
    try {
      const response = await api.delete(`/school/book-sub-categories/${id}/force`);
      if (response.data.success) {
        toast.success('Sub-category permanently deleted');
        fetchInitialData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to permanently delete sub-category');
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
      const response = await api.post('/school/book-sub-categories/bulk-status', {
        status: status ? 'active' : 'inactive',
        ids: ids
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Status updated successfully');
        setSelectedItems(new Set());
        fetchInitialData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    const confirmMessage = showTrashed
      ? `Are you sure you want to permanently delete ${selectedItems.size} selected sub-category(ies)? This action cannot be undone.`
      : `Are you sure you want to delete ${selectedItems.size} selected sub-category(ies)?`;

    if (window.confirm(confirmMessage)) {
      setBulkUpdating(true);
      const ids = Array.from(selectedItems);
      
      try {
        const response = await api.post('/school/book-sub-categories/bulk-delete', {
          ids: ids,
          force: showTrashed
        });
        if (response.data.success) {
          toast.success(response.data.message || 'Deleted successfully');
          setSelectedItems(new Set());
          fetchInitialData();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete');
      } finally {
        setBulkUpdating(false);
      }
    }
  };

  const handleBulkRestore = async () => {
    if (window.confirm(`Are you sure you want to restore ${selectedItems.size} selected sub-category(ies)?`)) {
      setBulkUpdating(true);
      const ids = Array.from(selectedItems);
      
      try {
        const response = await api.post('/school/book-sub-categories/bulk-restore', {
          ids: ids
        });
        if (response.data.success) {
          toast.success(response.data.message || 'Restored successfully');
          setSelectedItems(new Set());
          fetchInitialData();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to restore');
      } finally {
        setBulkUpdating(false);
      }
    }
  };

  // Excel operations
  const handleExport = () => {
    try {
      const exportData = filteredData.map(item => ({
        'Category Name': item.category?.name ?? '',
        'Sub-Category Name': item.name,
        'Description': item.description || '',
        'Custom Label 1': item.custom_label1?.m_alias_name ?? item.custom_label1?.m_name ?? '',
        'Custom Value 1': item.custom_value_1 || '',
        'Custom Label 2': item.custom_label2?.m_alias_name ?? item.custom_label2?.m_name ?? '',
        'Custom Value 2': item.custom_value_2 || '',
        'Status': item.is_active ? 'Active' : 'Inactive',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Book Sub Categories');
      XLSX.writeFile(wb, `book_sub_categories_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Export successful!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const downloadSampleFile = async () => {
    try {
      const statusValues = ['Active', 'Inactive'];
      const categoryNames = categories.map(c => c.name);
      const labelNames = metadataLabels.map(l => l.label).filter(l => l !== 'None');

      if (categoryNames.length === 0) {
        toast.error('Please add at least one book category first');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Book Sub Categories');

      worksheet.columns = [
        { header: 'Category Name', key: 'category_name', width: 25 },
        { header: 'Sub-Category Name', key: 'sub_category_name', width: 25 },
        { header: 'Description', key: 'description', width: 35 },
        { header: 'Custom Label 1', key: 'custom_label_1', width: 18 },
        { header: 'Custom Value 1', key: 'custom_value_1', width: 20 },
        { header: 'Custom Label 2', key: 'custom_label_2', width: 18 },
        { header: 'Custom Value 2', key: 'custom_value_2', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
      ];

      worksheet.addRow({
        category_name: categoryNames[0],
        sub_category_name: 'Algebra & Geometry',
        description: 'Mathematics textbook helper sheets',
        custom_label_1: labelNames.length > 0 ? labelNames[0] : 'Target Audience',
        custom_value_1: 'All Classes',
        custom_label_2: '',
        custom_value_2: '',
        status: 'Active',
      });

      // Seeding validation list helpers in hidden columns
      worksheet.getCell('K1').value = 'Status_List';
      statusValues.forEach((val, idx) => { worksheet.getCell(`K${idx + 2}`).value = val; });
      worksheet.getColumn('K').hidden = true;

      worksheet.getCell('L1').value = 'Category_List';
      categoryNames.forEach((val, idx) => { worksheet.getCell(`L${idx + 2}`).value = val; });
      worksheet.getColumn('L').hidden = true;

      worksheet.getCell('M1').value = 'Label_List';
      labelNames.forEach((val, idx) => { worksheet.getCell(`M${idx + 2}`).value = val; });
      worksheet.getColumn('M').hidden = true;

      // Apply validations
      for (let r = 2; r <= 500; r++) {
        worksheet.getCell(`A${r}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'Book Sub Categories'!$L$2:$L$${categoryNames.length + 1}`],
          showErrorMessage: true, errorTitle: 'Invalid Selection', error: 'Please select an existing Book Category.'
        };
        worksheet.getCell(`D${r}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'Book Sub Categories'!$M$2:$M$${labelNames.length + 1}`],
          showErrorMessage: true, errorTitle: 'Invalid Selection', error: 'Please select a valid Custom Label.'
        };
        worksheet.getCell(`F${r}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'Book Sub Categories'!$M$2:$M$${labelNames.length + 1}`],
          showErrorMessage: true, errorTitle: 'Invalid Selection', error: 'Please select a valid Custom Label.'
        };
        worksheet.getCell(`H${r}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'Book Sub Categories'!$K$2:$K$3`],
          showErrorMessage: true, errorTitle: 'Invalid Selection', error: 'Please select Active or Inactive.'
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_book_sub_categories.xlsx');
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
          if (firstCell && (firstCell === 'Category Name' || firstCell?.toString().includes('Category'))) {
            headerRowIndex = i;
            headers = rows[i].map((cell: any) => cell?.toString().trim() || '');
            break;
          }
        }
        
        if (headerRowIndex === -1) {
          toast.error('Could not find header row (e.g., "Category Name")');
          return;
        }
        
        const dataRows: any[] = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          const firstCell = row[0];
          if (firstCell && (firstCell.toString().includes('_List') || firstCell === 'Status_List' || firstCell === 'Category_List')) {
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
          
          if (rowData['Category Name'] && rowData['Sub-Category Name']) {
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
        category_name: row['Category Name'],
        sub_category_name: row['Sub-Category Name'],
        description: row['Description'] || null,
        custom_label_1: row['Custom Label 1'] || null,
        custom_value_1: row['Custom Value 1'] || null,
        custom_label_2: row['Custom Label 2'] || null,
        custom_value_2: row['Custom Value 2'] || null,
        is_active: row['Status'] ? row['Status'].toLowerCase() === 'active' : true,
      }));

      const response = await api.post('/school/book-sub-categories/bulk-import', { data: payload });
      if (response.data.success) {
        toast.success(response.data.message || 'Import completed successfully');
        setIsImportModalOpen(false);
        fetchInitialData();
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
          <p className="mt-2 text-gray-600 text-xs">Loading sub-categories...</p>
        </div>
      </div>
    );
  }

  const categoryOptions = categories.map(c => ({
    value: c.id.toString(),
    label: c.name
  }));

  return (
    <div className="space-y-3">
      {/* Search, filters, controls row */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search sub-categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none w-44 h-[26px] text-xs"
          />

          <Select
            value={categoryOptions.find(o => o.value === filterCategory) || null}
            onChange={(option) => setFilterCategory(option ? option.value : '')}
            options={categoryOptions}
            isSearchable={true}
            isClearable
            placeholder="All Categories"
            styles={compactSelectStyles}
            className="w-40 text-[10px]"
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

          {(searchTerm || filterStatus || filterCategory) && (
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
                <th onClick={() => handleSort('category')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition w-44">
                  Book Category {getSortIcon('category')}
                </th>
                <th onClick={() => handleSort('name')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition">
                  Sub-Category Name {getSortIcon('name')}
                </th>
                <th className="py-2 px-2.5 w-60">
                  Custom Properties
                </th>
                <th onClick={() => handleSort('is_active')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition w-24 text-center">
                  Status {getSortIcon('is_active')}
                </th>
                <th className="py-2 px-2.5 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500 font-medium">
                    {showTrashed ? 'No deleted sub-categories found.' : 'No sub-categories found.'}
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
                    <td className="py-1.5 px-2.5 font-semibold text-gray-600">
                      {item.category?.name ?? 'Unmapped'}
                    </td>
                    <td className="py-1.5 px-2.5">
                      <div className="font-bold text-gray-900">{item.name}</div>
                      {item.description && <div className="text-[10px] text-gray-400 max-w-sm">{item.description}</div>}
                    </td>
                    <td className="py-1.5 px-2.5">
                      <div className="flex flex-wrap gap-1">
                        {item.custom_label1 && item.custom_value_1 && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-semibold text-[9px] uppercase tracking-wide">
                            {item.custom_label1.m_alias_name ?? item.custom_label1.m_name}: {item.custom_value_1}
                          </span>
                        )}
                        {item.custom_label2 && item.custom_value_2 && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold text-[9px] uppercase tracking-wide">
                            {item.custom_label2.m_alias_name ?? item.custom_label2.m_name}: {item.custom_value_2}
                          </span>
                        )}
                        {!item.custom_label1 && !item.custom_label2 && (
                          <span className="text-gray-400 italic font-medium">No custom properties</span>
                        )}
                      </div>
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
                {editingItem ? 'Edit Book Sub-Category' : 'Create Book Sub-Category'}
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
                {/* Category Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Parent Category *</label>
                  <Select
                    value={categoryOptions.find(o => o.value === formData.book_category_id) || null}
                    onChange={(option) => setFormData(prev => ({ ...prev, book_category_id: option ? option.value : '' }))}
                    options={categoryOptions}
                    isSearchable={true}
                    placeholder="Select Category..."
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                  />
                </div>

                {/* Sub-Category Name */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Sub-Category Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Mathematics"
                    value={formData.name}
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

                {/* Custom Attribute 1 Label */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Custom Label 1</label>
                  <Select
                    value={metadataLabels.find(o => o.value === formData.custom_label_1_id) || null}
                    onChange={(option) => setFormData(prev => ({ ...prev, custom_label_1_id: option ? option.value : '' }))}
                    options={metadataLabels}
                    isSearchable
                    placeholder="Select Label..."
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                  />
                </div>

                {/* Custom Attribute 1 Value */}
                {(() => {
                  const selected = metadataLabels.find(o => o.value === formData.custom_label_1_id);
                  const showInput = selected && selected.label !== 'None';
                  return showInput ? (
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        {selected.label} Value
                      </label>
                      <input
                        type="text"
                        name="custom_value_1"
                        placeholder={`Enter ${selected.label}`}
                        value={formData.custom_value_1}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none h-7.5"
                      />
                    </div>
                  ) : null;
                })()}

                {/* Custom Attribute 2 Label */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Custom Label 2</label>
                  <Select
                    value={metadataLabels.find(o => o.value === formData.custom_label_2_id) || null}
                    onChange={(option) => setFormData(prev => ({ ...prev, custom_label_2_id: option ? option.value : '' }))}
                    options={metadataLabels}
                    isSearchable
                    placeholder="Select Label..."
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                  />
                </div>

                {/* Custom Attribute 2 Value */}
                {(() => {
                  const selected = metadataLabels.find(o => o.value === formData.custom_label_2_id);
                  const showInput = selected && selected.label !== 'None';
                  return showInput ? (
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        {selected.label} Value
                      </label>
                      <input
                        type="text"
                        name="custom_value_2"
                        placeholder={`Enter ${selected.label}`}
                        value={formData.custom_value_2}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none h-7.5"
                      />
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Description</label>
                <textarea
                  name="description"
                  placeholder="Enter sub-category description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none min-h-[60px]"
                />
              </div>

              {/* Modal Actions */}
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
              <h3 className="text-[13px] font-bold uppercase tracking-wider">Import Preview ({importData.length} Sub-Categories)</h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-white hover:text-gray-200 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <p className="text-gray-500">Below is a preview of the first 5 rows to be imported. Ensure parent categories are matched perfectly.</p>
              
              <div className="bg-gray-50 rounded border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-semibold text-[10px] uppercase">
                      <th className="py-1.5 px-2">Category</th>
                      <th className="py-1.5 px-2">Sub-Category</th>
                      <th className="py-1.5 px-2">Description</th>
                      <th className="py-1.5 px-2">Prop 1</th>
                      <th className="py-1.5 px-2">Prop 2</th>
                      <th className="py-1.5 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-150 text-gray-600">
                        <td className="py-1 px-2 font-bold text-gray-900">{row['Category Name']}</td>
                        <td className="py-1 px-2 font-bold">{row['Sub-Category Name']}</td>
                        <td className="py-1 px-2">{row['Description']}</td>
                        <td className="py-1 px-2">{row['Custom Label 1'] ? `${row['Custom Label 1']}: ${row['Custom Value 1']}` : ''}</td>
                        <td className="py-1 px-2">{row['Custom Label 2'] ? `${row['Custom Label 2']}: ${row['Custom Value 2']}` : ''}</td>
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

export default BookSubCategoryManager;
