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

interface Book {
  id: number;
  school_id: number;
  book_code: string;
  title: string;
  author_id: number;
  author?: { id: number; name: string };
  publisher_id: number | null;
  publisher?: { id: number; name: string } | null;
  book_category_id: number;
  category?: { id: number; name: string };
  book_sub_category_id: number | null;
  sub_category?: { id: number; name: string } | null;
  is_textbook: boolean;
  isbn: string | null;
  edition: string | null;
  year: string | null;
  pages: number | null;
  description: string | null;
  quantity: number;
  available_quantity: number;
  location: string | null;
  purchase_date: string | null;
  price: string | null;
  is_active: boolean;
  deleted_at?: string | null;
}

const BookInventoryManager: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('');
  const [filterPublisher, setFilterPublisher] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTextbook, setFilterTextbook] = useState('');
  const [showTrashed, setShowTrashed] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Selection states
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Book | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    book_code: '',
    title: '',
    isbn: '',
    author_id: '',
    publisher_id: '',
    book_category_id: '',
    book_sub_category_id: '',
    is_textbook: false,
    edition: '',
    year: '',
    pages: '',
    quantity: '1',
    available_quantity: '1',
    location: '',
    purchase_date: '',
    price: '0.00',
    description: '',
    is_active: true,
  });

  // Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [showTrashed]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedItems(new Set());
  }, [searchTerm, filterCategory, filterAuthor, filterPublisher, filterStatus, filterTextbook, showTrashed, itemsPerPage]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Load authors, publishers, categories, subcategories in parallel
      const [authorsRes, publishersRes, categoriesRes, subCategoriesRes] = await Promise.all([
        api.get('/school/authors'),
        api.get('/school/publishers'),
        api.get('/school/book-categories'),
        api.get('/school/book-sub-categories'),
      ]);

      if (authorsRes.data.success) setAuthors(authorsRes.data.data);
      if (publishersRes.data.success) setPublishers(publishersRes.data.data);
      if (categoriesRes.data.success) setCategories(categoriesRes.data.data);
      if (subCategoriesRes.data.success) setSubCategories(subCategoriesRes.data.data);

      const booksRes = await api.get('/school/library-books', {
        params: { only_trashed: showTrashed }
      });
      if (booksRes.data.success) {
        setBooks(booksRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching inventory details:', error);
      toast.error('Failed to load catalog files');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    let source = [...books];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      source = source.filter(item =>
        item.title.toLowerCase().includes(lower) ||
        item.book_code.toLowerCase().includes(lower) ||
        (item.isbn && item.isbn.toLowerCase().includes(lower)) ||
        (item.description && item.description.toLowerCase().includes(lower))
      );
    }

    if (filterCategory) {
      source = source.filter(item => item.book_category_id.toString() === filterCategory);
    }
    if (filterAuthor) {
      source = source.filter(item => item.author_id.toString() === filterAuthor);
    }
    if (filterPublisher) {
      source = source.filter(item => item.publisher_id?.toString() === filterPublisher);
    }
    if (filterStatus) {
      source = source.filter(item => item.is_active.toString() === filterStatus);
    }
    if (filterTextbook) {
      source = source.filter(item => item.is_textbook.toString() === filterTextbook);
    }

    // Sort
    source.sort((a: any, b: any) => {
      let aVal = a[sortColumn] ?? '';
      let bVal = b[sortColumn] ?? '';

      if (sortColumn === 'category') {
        aVal = a.category?.name ?? '';
        bVal = b.category?.name ?? '';
      } else if (sortColumn === 'author') {
        aVal = a.author?.name ?? '';
        bVal = b.author?.name ?? '';
      } else if (sortColumn === 'publisher') {
        aVal = a.publisher?.name ?? '';
        bVal = b.publisher?.name ?? '';
      }

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

  // Status toggle
  const handleToggleStatus = async (id: number) => {
    try {
      const response = await api.patch(`/school/library-books/${id}/toggle-status`);
      if (response.data.success) {
        toast.success('Book status updated');
        fetchInitialData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  // Actions CRUD
  const handleDelete = async (id: number, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        const response = await api.delete(`/school/library-books/${id}`);
        if (response.data.success) {
          toast.success('Book removed from inventory');
          fetchInitialData();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleRestore = async (id: number) => {
    if (!window.confirm('Are you sure you want to restore this book?')) return;
    try {
      const response = await api.post(`/school/library-books/${id}/restore`);
      if (response.data.success) {
        toast.success('Book restored successfully');
        fetchInitialData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Restore failed');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this book copy from the archives? This action cannot be undone.')) return;
    try {
      const response = await api.delete(`/school/library-books/${id}/force`);
      if (response.data.success) {
        toast.success('Book permanently deleted');
        fetchInitialData();
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
      const response = await api.post('/school/library-books/bulk-status', {
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
      ? `Are you sure you want to permanently delete ${selectedItems.size} selected book(s)? This action cannot be undone.`
      : `Are you sure you want to delete ${selectedItems.size} selected book(s)?`;

    if (window.confirm(confirmMessage)) {
      setBulkUpdating(true);
      const ids = Array.from(selectedItems);
      try {
        const response = await api.post('/school/library-books/bulk-delete', {
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
    if (window.confirm(`Are you sure you want to restore ${selectedItems.size} selected book(s)?`)) {
      setBulkUpdating(true);
      const ids = Array.from(selectedItems);
      try {
        const response = await api.post('/school/library-books/bulk-restore', {
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

  // Forms submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.book_code.trim()) {
      toast.error('Book Code is required');
      return;
    }
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.author_id) {
      toast.error('Author selection is required');
      return;
    }
    if (!formData.book_category_id) {
      toast.error('Category selection is required');
      return;
    }
    if (isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0) {
      toast.error('Quantity must be a non-negative integer');
      return;
    }

    const payload = {
      ...formData,
      publisher_id: formData.publisher_id || null,
      book_sub_category_id: formData.book_sub_category_id || null,
      isbn: formData.isbn || null,
      edition: formData.edition || null,
      year: formData.year || null,
      pages: formData.pages ? Number(formData.pages) : null,
      quantity: Number(formData.quantity),
      location: formData.location || null,
      purchase_date: formData.purchase_date || null,
      price: formData.price ? Number(formData.price) : 0,
      description: formData.description || null,
    };

    try {
      if (editingItem) {
        const response = await api.put(`/school/library-books/${editingItem.id}`, payload);
        if (response.data.success) {
          toast.success('Book updated successfully');
          setIsModalOpen(false);
          fetchInitialData();
        }
      } else {
        const response = await api.post('/school/library-books', payload);
        if (response.data.success) {
          toast.success('Book added successfully');
          setIsModalOpen(false);
          fetchInitialData();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Save failed');
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      book_code: '',
      title: '',
      isbn: '',
      author_id: '',
      publisher_id: '',
      book_category_id: '',
      book_sub_category_id: '',
      is_textbook: false,
      edition: '',
      year: '',
      pages: '',
      quantity: '1',
      available_quantity: '1',
      location: '',
      purchase_date: '',
      price: '0.00',
      description: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Book) => {
    setEditingItem(item);
    setFormData({
      book_code: item.book_code,
      title: item.title,
      isbn: item.isbn || '',
      author_id: item.author_id.toString(),
      publisher_id: item.publisher_id ? item.publisher_id.toString() : '',
      book_category_id: item.book_category_id.toString(),
      book_sub_category_id: item.book_sub_category_id ? item.book_sub_category_id.toString() : '',
      is_textbook: item.is_textbook,
      edition: item.edition || '',
      year: item.year || '',
      pages: item.pages ? item.pages.toString() : '',
      quantity: item.quantity.toString(),
      available_quantity: item.available_quantity.toString(),
      location: item.location || '',
      purchase_date: item.purchase_date ? item.purchase_date.split('T')[0] : '',
      price: item.price ? Number(item.price).toFixed(2) : '0.00',
      description: item.description || '',
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  // Excel operations: Export
  const handleExport = () => {
    try {
      const exportData = filteredData.map(item => ({
        'Book Code': item.book_code,
        'Title': item.title,
        'ISBN': item.isbn || '',
        'Author Code': item.author?.author_code ?? '',
        'Author Name': item.author?.name ?? '',
        'Publisher Code': item.publisher?.publisher_code ?? '',
        'Publisher Name': item.publisher?.name ?? '',
        'Category Code': item.category?.category_code ?? '',
        'Category Name': item.category?.name ?? '',
        'Sub-Category Name': item.sub_category?.name ?? '',
        'Textbook': item.is_textbook ? 'Yes' : 'No',
        'Edition': item.edition || '',
        'Year': item.year || '',
        'Pages': item.pages || '',
        'Total Copies': item.quantity,
        'Available Copies': item.available_quantity,
        'Location': item.location || '',
        'Purchase Date': item.purchase_date ? item.purchase_date.split('T')[0] : '',
        'Price': item.price || '0.00',
        'Description': item.description || '',
        'Status': item.is_active ? 'Active' : 'Inactive',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
      XLSX.writeFile(wb, `book_inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Export successful!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  // Download Sample Template
  const downloadSampleFile = async () => {
    try {
      if (categories.length === 0 || authors.length === 0) {
        toast.error('Ensure you have at least one Author and Category defined first');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Book Inventory');

      worksheet.columns = [
        { header: 'Book Code', key: 'book_code', width: 15 },
        { header: 'Title', key: 'title', width: 25 },
        { header: 'ISBN', key: 'isbn', width: 15 },
        { header: 'Author Code', key: 'author_code', width: 15 },
        { header: 'Publisher Code', key: 'publisher_code', width: 15 },
        { header: 'Category Code', key: 'category_code', width: 15 },
        { header: 'Sub-Category Name', key: 'sub_category_name', width: 20 },
        { header: 'Textbook', key: 'is_textbook', width: 12 },
        { header: 'Edition', key: 'edition', width: 15 },
        { header: 'Year', key: 'year', width: 12 },
        { header: 'Pages', key: 'pages', width: 10 },
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'Location', key: 'location', width: 20 },
        { header: 'Purchase Date', key: 'purchase_date', width: 15 },
        { header: 'Price', key: 'price', width: 12 },
        { header: 'Description', key: 'description', width: 35 },
        { header: 'Status', key: 'status', width: 12 },
      ];

      worksheet.addRow({
        book_code: 'BK001',
        title: 'Malgudi Days',
        isbn: '9780141187327',
        author_code: authors[0].author_code,
        publisher_code: publishers[0] ? publishers[0].publisher_code : '',
        category_code: categories[0].category_code,
        sub_category_name: '',
        is_textbook: 'No',
        edition: '1st Edition',
        year: '1943',
        pages: 250,
        quantity: 5,
        location: 'Section A - Row 3',
        purchase_date: '2026-01-15',
        price: 299.00,
        description: 'A collection of short stories by R. K. Narayan.',
        status: 'Active'
      });

      // Seeding helper validation dropdown lists in hidden sheets or hidden columns
      worksheet.getCell('R1').value = 'Status_List';
      worksheet.getCell('R2').value = 'Active';
      worksheet.getCell('R3').value = 'Inactive';
      worksheet.getColumn('R').hidden = true;

      // Seed reference codes for validation instructions
      worksheet.getCell('S1').value = 'Category_Codes';
      categories.forEach((c, idx) => { worksheet.getCell(`S${idx + 2}`).value = c.category_code; });
      worksheet.getColumn('S').hidden = true;

      worksheet.getCell('T1').value = 'Author_Codes';
      authors.forEach((a, idx) => { worksheet.getCell(`T${idx + 2}`).value = a.author_code; });
      worksheet.getColumn('T').hidden = true;

      worksheet.getCell('U1').value = 'Textbook_List';
      worksheet.getCell('U2').value = 'Yes';
      worksheet.getCell('U3').value = 'No';
      worksheet.getColumn('U').hidden = true;

      // Apply validations
      for (let r = 2; r <= 500; r++) {
        worksheet.getCell(`D${r}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'Book Inventory'!$T$2:$T$${authors.length + 1}`],
          showErrorMessage: true, errorTitle: 'Invalid Selection', error: 'Select an Author Code from the list.'
        };
        worksheet.getCell(`F${r}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'Book Inventory'!$S$2:$S$${categories.length + 1}`],
          showErrorMessage: true, errorTitle: 'Invalid Selection', error: 'Select a Category Code from the list.'
        };
        worksheet.getCell(`H${r}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'Book Inventory'!$U$2:$U$3`],
          showErrorMessage: true, errorTitle: 'Invalid Selection', error: 'Select Yes or No.'
        };
        worksheet.getCell(`Q${r}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'Book Inventory'!$R$2:$R$3`],
          showErrorMessage: true, errorTitle: 'Invalid Selection', error: 'Select Active or Inactive.'
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_book_inventory.xlsx');
      toast.success('Sample file downloaded!');
    } catch (error) {
      console.error('Error downloading sample template:', error);
      toast.error('Failed to download template');
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

        for (let i = 0; i < rows.length; i++) {
          const firstCell = rows[i][0];
          if (firstCell && (firstCell.toString().includes('Book Code') || firstCell.toString().toLowerCase().includes('book code'))) {
            headerRowIndex = i;
            headers = rows[i].map((cell: any) => cell?.toString().trim() || '');
            break;
          }
        }

        if (headerRowIndex === -1) {
          toast.error('Could not find header row starting with "Book Code"');
          return;
        }

        const dataRows: any[] = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          // Skip dropdown lists
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

          if (rowData['Book Code'] && rowData['Title']) {
            dataRows.push(rowData);
          }
        }

        if (dataRows.length === 0) {
          toast.error('No valid data found in the spreadsheet.');
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
      const payload = importData.map(row => ({
        book_code: row['Book Code'],
        title: row['Title'],
        isbn: row['ISBN'] || null,
        author_code: row['Author Code'] || null,
        publisher_code: row['Publisher Code'] || null,
        category_code: row['Category Code'] || null,
        sub_category_name: row['Sub-Category Name'] || null,
        is_textbook: row['Textbook'] ? row['Textbook'].toLowerCase() === 'yes' : false,
        edition: row['Edition'] || null,
        year: row['Year'] || null,
        pages: row['Pages'] ? parseInt(row['Pages']) : null,
        quantity: row['Quantity'] ? parseInt(row['Quantity']) : 1,
        location: row['Location'] || null,
        purchase_date: row['Purchase Date'] ? row['Purchase Date'].split('T')[0] : null,
        price: row['Price'] ? parseFloat(row['Price']) : 0.00,
        description: row['Description'] || null,
        is_active: row['Status'] ? row['Status'].toLowerCase() === 'active' : true,
      }));

      const response = await api.post('/school/library-books/bulk-import', { data: payload });
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

  if (loading && books.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600 text-xs">Loading library inventory...</p>
        </div>
      </div>
    );
  }

  const authorOptions = authors.map(a => ({ value: a.id.toString(), label: `[${a.author_code}] ${a.name}` }));
  const publisherOptions = publishers.map(p => ({ value: p.id.toString(), label: `[${p.publisher_code}] ${p.name}` }));
  const categoryOptions = categories.map(c => ({ value: c.id.toString(), label: `[${c.category_code}] ${c.name}` }));

  // Dynamic Subcategories options filtered by selected category
  const filteredSubCategories = subCategories.filter(sc => sc.book_category_id.toString() === formData.book_category_id);
  const subCategoryOptions = filteredSubCategories.map(sc => ({ value: sc.id.toString(), label: sc.name }));

  return (
    <div className="space-y-4">
      {/* Title Header */}
      {/* <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-150 shadow-sm">
        <div>
          <h1 className="text-sm font-bold text-gray-800 uppercase tracking-wider">📖 Book Inventory Catalog</h1>
          <p className="text-[10px] text-gray-500">Manage copies, isbn reference catalogs, locations, and pricing records.</p>
        </div>
      </div> */}

      {/* Toolbar Search & filters */}
      <div className="flex flex-col gap-2.5 bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-xs shadow-sm">
        {/* Row 1: Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search catalog (Title/Code/ISBN)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none w-52 h-[26px] text-xs"
          />

          <Select
            value={categoryOptions.find(o => o.value === filterCategory) || null}
            onChange={(option) => setFilterCategory(option ? option.value : '')}
            options={categoryOptions}
            isClearable
            isSearchable={true}
            placeholder="All Categories"
            styles={compactSelectStyles}
            className="w-36 text-[10px]"
          />

          <Select
            value={authorOptions.find(o => o.value === filterAuthor) || null}
            onChange={(option) => setFilterAuthor(option ? option.value : '')}
            options={authorOptions}
            isClearable
            isSearchable={true}
            placeholder="All Authors"
            styles={compactSelectStyles}
            className="w-36 text-[10px]"
          />

          <Select
            value={publisherOptions.find(o => o.value === filterPublisher) || null}
            onChange={(option) => setFilterPublisher(option ? option.value : '')}
            options={publisherOptions}
            isClearable
            isSearchable={true}
            placeholder="All Publishers"
            styles={compactSelectStyles}
            className="w-36 text-[10px]"
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
            value={
              filterTextbook === 'true'
                ? { value: 'true', label: 'Textbooks' }
                : filterTextbook === 'false'
                  ? { value: 'false', label: 'General' }
                  : null
            }
            onChange={(option) => setFilterTextbook(option ? option.value : '')}
            options={[
              { value: 'true', label: 'Textbooks' },
              { value: 'false', label: 'General' }
            ]}
            isSearchable={true}
            isClearable
            placeholder="Book Type"
            styles={compactSelectStyles}
            className="w-28 text-[10px]"
          />
        </div>

        {/* Row 2: Secondary Controls (Left) & Actions (Right) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-150 pt-2">
          {/* Controls */}
          <div className="flex items-center gap-2">
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
                className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-200 focus:outline-none ${showTrashed ? 'bg-red-500' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform duration-200 ${showTrashed ? 'translate-x-4.5' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            {(searchTerm || filterCategory || filterAuthor || filterPublisher || filterStatus || filterTextbook) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('');
                  setFilterAuthor('');
                  setFilterPublisher('');
                  setFilterStatus('');
                  setFilterTextbook('');
                }}
                className="text-xs text-red-500 hover:text-red-700 font-medium px-1 h-[26px] ml-1"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Action Panel */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={downloadSampleFile}
              className="flex items-center gap-1 px-2.5 h-[26px] border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-xs font-medium cursor-pointer"
              title="Download Import Template"
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

      {/* Main Grid table */}
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
                  <th className="py-2.5 px-3 w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={paginatedData.length > 0 && paginatedData.every(item => selectedItems.has(item.id))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
                  <th
                    onClick={() => handleSort('book_code')}
                    className="py-2.5 px-3 cursor-pointer select-none hover:bg-gray-100 transition w-24"
                  >
                    Code {getSortIcon('book_code')}
                  </th>
                  <th
                    onClick={() => handleSort('title')}
                    className="py-2.5 px-3 cursor-pointer select-none hover:bg-gray-100 transition w-[22%]"
                  >
                    Book Title {getSortIcon('title')}
                  </th>
                  <th
                    onClick={() => handleSort('category')}
                    className="py-2.5 px-3 cursor-pointer select-none hover:bg-gray-100 transition w-32"
                  >
                    Category {getSortIcon('category')}
                  </th>
                  <th
                    onClick={() => handleSort('author')}
                    className="py-2.5 px-3 cursor-pointer select-none hover:bg-gray-100 transition w-40"
                  >
                    Author {getSortIcon('author')}
                  </th>
                  <th
                    onClick={() => handleSort('publisher')}
                    className="py-2.5 px-3 cursor-pointer select-none hover:bg-gray-100 transition w-40"
                  >
                    Publisher {getSortIcon('publisher')}
                  </th>
                  <th className="py-2.5 px-3 w-20">Price</th>
                  <th className="py-2.5 px-3 w-28 text-center">Copies (Total/Avail)</th>
                  <th className="py-2.5 px-3 w-20 text-center">Status</th>
                  <th className="py-2.5 px-3 w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-gray-400 font-medium">
                      No books found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-100 hover:bg-gray-50/50 transition duration-150 ${selectedItems.has(item.id) ? 'bg-blue-50/20' : ''
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
                      <td className="py-2 px-3 font-semibold text-gray-700">{item.book_code}</td>
                      <td className="py-2 px-3 font-bold text-gray-900 leading-tight">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{item.title}</span>
                          {item.is_textbook && (
                            <span className="inline-flex items-center px-1 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-600 border border-blue-150 uppercase tracking-wider" title="Textbook">
                              📖 Textbook
                            </span>
                          )}
                        </div>
                        {item.isbn && <div className="text-[10px] text-gray-400 font-medium mt-0.5">ISBN: {item.isbn}</div>}
                      </td>
                      <td className="py-2 px-3 text-gray-600 font-medium">
                        {item.category?.name || '-'}
                        {item.sub_category && <div className="text-[10px] text-gray-450 mt-0.5">{item.sub_category.name}</div>}
                      </td>
                      <td className="py-2 px-3 text-gray-500">{item.author?.name || '-'}</td>
                      <td className="py-2 px-3 text-gray-500">{item.publisher?.name || '-'}</td>
                      <td className="py-2 px-3 font-semibold text-gray-800">₹{item.price ? Number(item.price).toFixed(2) : '0.00'}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="font-bold text-gray-700">{item.quantity}</span>
                        <span className="text-gray-300 mx-1">/</span>
                        <span className={`font-bold ${item.available_quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {item.available_quantity}
                        </span>
                      </td>
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
                                onClick={() => openEditModal(item)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                                title="Edit"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(item.id, item.title)}
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
                      className={`relative inline-flex items-center px-2.5 py-1 text-xs font-semibold focus:z-20 cursor-pointer ${currentPage === i + 1
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



      {/* CREATE & EDIT BOOK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 max-w-3xl w-full">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <h3 className="text-[13px] font-bold uppercase tracking-wider">
                {editingItem ? 'Edit Book Entry' : 'Create Book Entry'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-gray-200 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs text-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Book Code */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Book Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BK001"
                    value={formData.book_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, book_code: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none h-[28px]"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Book Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Malgudi Days"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none h-[28px]"
                  />
                </div>

                {/* ISBN */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">ISBN</label>
                  <input
                    type="text"
                    placeholder="e.g. 9780141187327"
                    value={formData.isbn}
                    onChange={(e) => setFormData(prev => ({ ...prev, isbn: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none h-[28px]"
                  />
                </div>

                {/* Author Select */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Author *</label>
                  <Select
                    value={authorOptions.find(o => o.value === formData.author_id) || null}
                    onChange={(option) => setFormData(prev => ({ ...prev, author_id: option ? option.value : '' }))}
                    options={authorOptions}
                    isSearchable={true}
                    placeholder="Select Author..."
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                  />
                </div>

                {/* Publisher Select */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Publisher</label>
                  <Select
                    value={publisherOptions.find(o => o.value === formData.publisher_id) || null}
                    onChange={(option) => setFormData(prev => ({ ...prev, publisher_id: option ? option.value : '' }))}
                    options={publisherOptions}
                    isSearchable={true}
                    placeholder="Select Publisher..."
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                  />
                </div>

                {/* Category Select */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Category *</label>
                  <Select
                    value={categoryOptions.find(o => o.value === formData.book_category_id) || null}
                    onChange={(option) => setFormData(prev => ({ ...prev, book_category_id: option ? option.value : '', book_sub_category_id: '' }))}
                    options={categoryOptions}
                    isSearchable={true}
                    placeholder="Select Category..."
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                  />
                </div>

                {/* Subcategory Select (filtered dynamically) */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Sub-Category</label>
                  <Select
                    value={subCategoryOptions.find(o => o.value === formData.book_sub_category_id) || null}
                    onChange={(option) => setFormData(prev => ({ ...prev, book_sub_category_id: option ? option.value : '' }))}
                    options={subCategoryOptions}
                    isSearchable={true}
                    placeholder={formData.book_category_id ? "Select Sub-Category..." : "Select Category First..."}
                    isDisabled={!formData.book_category_id}
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                  />
                </div>

                {/* Textbook Toggle */}
                <div className="flex flex-col justify-center">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">📖 Textbook</label>
                  <div className="flex items-center h-[28px]">
                    <ToggleSwitch
                      checked={formData.is_textbook}
                      onChange={(val) => setFormData(prev => ({ ...prev, is_textbook: val }))}
                    />
                    <span className={`text-[10px] font-semibold ml-2 ${formData.is_textbook ? 'text-blue-600' : 'text-gray-400'}`}>
                      {formData.is_textbook ? 'Textbook' : 'Reference Book'}
                    </span>
                  </div>
                </div>

                {/* Edition */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Edition</label>
                  <input
                    type="text"
                    placeholder="e.g. 1st Edition"
                    value={formData.edition}
                    onChange={(e) => setFormData(prev => ({ ...prev, edition: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none h-[28px]"
                  />
                </div>

                {/* Year */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 1943"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none h-[28px]"
                  />
                </div>

                {/* Pages */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Pages</label>
                  <input
                    type="number"
                    placeholder="Number of pages"
                    value={formData.pages}
                    onChange={(e) => setFormData(prev => ({ ...prev, pages: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none h-[28px]"
                  />
                </div>

                {/* Total Copies */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Total Copies *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none h-[28px]"
                  />
                </div>

                {/* Available Copies */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Available Copies</label>
                  <input
                    type="number"
                    disabled
                    value={editingItem ? formData.available_quantity : formData.quantity}
                    className="w-full px-2 py-1 border border-gray-200 bg-gray-50 text-gray-500 rounded outline-none h-[28px]"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Section A - Row 3"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none h-[28px]"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none h-[28px]"
                  />
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Purchase Date</label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none h-[28px]"
                  />
                </div>

                {/* Status toggle */}
                <div className="flex flex-col justify-center">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                  <div className="flex items-center h-[28px]">
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
                  placeholder="Book description..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none min-h-[50px]"
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
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 max-w-5xl w-full">
            <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <h3 className="text-[13px] font-bold uppercase tracking-wider">Import Preview ({importData.length} Books)</h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-white hover:text-gray-200 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              <p className="text-gray-500">Below is a preview of the first 5 records parsed from the sheet. Check relationships before importing.</p>

              <div className="bg-gray-50 rounded border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-semibold text-[10px] uppercase">
                      <th className="py-1.5 px-3">Code</th>
                      <th className="py-1.5 px-3">Title</th>
                      <th className="py-1.5 px-3">Author Code</th>
                      <th className="py-1.5 px-3">Category Code</th>
                      <th className="py-1.5 px-3">Textbook</th>
                      <th className="py-1.5 px-3">Edition</th>
                      <th className="py-1.5 px-3">Qty</th>
                      <th className="py-1.5 px-3">Price</th>
                      <th className="py-1.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-150 text-gray-600">
                        <td className="py-1 px-3 font-semibold text-gray-800">{row['Book Code']}</td>
                        <td className="py-1 px-3 font-bold text-gray-900">{row['Title']}</td>
                        <td className="py-1 px-3">{row['Author Code']}</td>
                        <td className="py-1 px-3">{row['Category Code']}</td>
                        <td className="py-1 px-3">{row['Textbook'] || 'No'}</td>
                        <td className="py-1 px-3">{row['Edition'] || '-'}</td>
                        <td className="py-1 px-3 font-bold">{row['Quantity'] || '1'}</td>
                        <td className="py-1 px-3 font-semibold">₹{row['Price'] || '0.00'}</td>
                        <td className="py-1 px-3">{row['Status'] || 'Active'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

export default BookInventoryManager;
