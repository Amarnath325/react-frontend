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

// Interface for library members
interface Member {
  id: number;
  user_id: number;
  member_code: string;
  member_type: 'student' | 'teacher' | 'staff';
  join_date: string;
  expiry_date: string | null;
  status: 'active' | 'suspended' | 'expired' | 'inactive';
  notes: string | null;
  name: string;
  email: string;
  mobile: string;
  details: string; // e.g. "Class 10 A" or "Dept: Science"
  extra_code: string; // roll no / emp id
  profile_pic: string | null;
  max_books_allowed?: number;
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

const LibraryMemberManager: React.FC = () => {
  type TabType = 'all' | 'student' | 'teacher' | 'staff';
  const [activeTab, setActiveTab] = useState<TabType>('all');
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTrashed, setShowTrashed] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Bulk actions
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Sorting
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Member | null>(null);
  
  // Card Print Modal
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardItem, setCardItem] = useState<Member | null>(null);

  // Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  // Dropdown options for eligible users to enroll
  const [eligibleUsers, setEligibleUsers] = useState<any[]>([]);
  const [loadingEligible, setLoadingEligible] = useState(false);

  // Masters options
  const [classes, setClasses] = useState<{ value: number; label: string }[]>([]);
  const [sections, setSections] = useState<{ value: string; label: string }[]>([]);
  const [departments, setDepartments] = useState<{ value: string; label: string }[]>([]);
  const [genders, setGenders] = useState<{ value: string; label: string }[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    user_id: '',
    member_code: '',
    member_type: 'student',
    status: 'active',
    join_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    notes: '',
    max_books_allowed: 5,
    
    // Profile details
    full_name: '',
    email: '',
    mobile: '',
    date_of_birth: '',
    gender: '',
    address: '',
    class_id: '',
    section: '',
    department: '',
  });

  useEffect(() => {
    fetchMembers();
    fetchDropdownOptions();
  }, [showTrashed]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedItems(new Set());
  }, [activeTab, searchTerm, filterStatus, showTrashed, itemsPerPage]);

  // Load eligible users when enrollment modal type changes
  useEffect(() => {
    if (isModalOpen && !editingItem) {
      fetchEligibleUsers(formData.member_type);
    }
  }, [formData.member_type, isModalOpen, editingItem]);

  // Dynamically auto-generate Member ID and default book limits on type changes
  useEffect(() => {
    if (isModalOpen && !editingItem) {
      const year = new Date().getFullYear();
      const rand = String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0');
      const generatedCode = `LIB-${year}-${rand}`;
      
      let defaultMax = 5;
      if (formData.member_type === 'teacher') defaultMax = 10;
      else if (formData.member_type === 'staff') defaultMax = 3;

      setFormData(prev => ({
        ...prev,
        member_code: generatedCode,
        max_books_allowed: defaultMax
      }));
    }
  }, [formData.member_type, isModalOpen, editingItem]);

  const fetchDropdownOptions = async () => {
    try {
      const classRes = await api.get('/master/classes');
      if (classRes.data.success) {
        setClasses(classRes.data.data.map((c: any) => ({ value: c.m_id, label: c.m_name })));
      }

      const genderRes = await api.get('/master/genders');
      if (genderRes.data.success) {
        setGenders(genderRes.data.data.map((g: any) => ({ value: g.m_name.toLowerCase(), label: g.m_name })));
      } else {
        setGenders([
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
          { value: 'other', label: 'Other' }
        ]);
      }

      const deptRes = await api.get('/school/departments');
      if (deptRes.data.success) {
        setDepartments(deptRes.data.data.map((d: any) => ({ value: d.name || d.m_name, label: d.name || d.m_name })));
      }

      const sectRes = await api.get('/school/sections');
      if (sectRes.data.success) {
        setSections(sectRes.data.data.map((s: any) => ({ value: s.name || s.section_name || s.m_name, label: s.name || s.section_name || s.m_name })));
      }
      
      setSections(prev => prev.length > 0 ? prev : [
        { value: 'Section A', label: 'Section A' },
        { value: 'Section B', label: 'Section B' },
        { value: 'Section C', label: 'Section C' },
        { value: 'Section D', label: 'Section D' },
      ]);
    } catch (err) {
      console.error('Error loading dropdown masters:', err);
      // Fail-safes
      setGenders([
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' }
      ]);
      setSections([
        { value: 'Section A', label: 'Section A' },
        { value: 'Section B', label: 'Section B' },
        { value: 'Section C', label: 'Section C' },
        { value: 'Section D', label: 'Section D' },
      ]);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/school/library-members', {
        params: { only_trashed: showTrashed }
      });
      if (response.data.success) {
        setMembers(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      toast.error('Failed to load library members');
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleUsers = async (type: string) => {
    setLoadingEligible(true);
    try {
      const response = await api.get('/school/library-members/search-eligible-users', {
        params: { member_type: type }
      });
      if (response.data.success) {
        setEligibleUsers(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching eligible users:', err);
      toast.error('Failed to load eligible users list');
    } finally {
      setLoadingEligible(false);
    }
  };

  // Tab Badge counts (computed from active members list)
  const getBadgeCounts = () => {
    const active = members.filter(m => !m.deleted_at);
    return {
      all: active.length,
      student: active.filter(m => m.member_type === 'student').length,
      teacher: active.filter(m => m.member_type === 'teacher').length,
      staff: active.filter(m => m.member_type === 'staff').length,
    };
  };

  const badgeCounts = getBadgeCounts();

  // Filters logic
  const getFilteredData = () => {
    let source = [...members];

    // Tab filter
    if (activeTab !== 'all') {
      source = source.filter(m => m.member_type === activeTab);
    }

    // Search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      source = source.filter(m =>
        m.name.toLowerCase().includes(term) ||
        m.member_code.toLowerCase().includes(term) ||
        (m.email && m.email.toLowerCase().includes(term)) ||
        (m.mobile && m.mobile.toLowerCase().includes(term)) ||
        (m.details && m.details.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (filterStatus) {
      source = source.filter(m => m.status === filterStatus);
    }

    // Sorting
    source.sort((a, b) => {
      let aVal = a[sortColumn as keyof Member] ?? '';
      let bVal = b[sortColumn as keyof Member] ?? '';

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return source;
  };

  const filteredData = getFilteredData();

  // Pagination
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

  // Selection Checkboxes
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

  // CRUD Forms handlers
  const handleOpenAddModal = () => {
    setEditingItem(null);
    const today = new Date().toISOString().split('T')[0];
    const nextYearDate = new Date();
    nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
    const expiry = nextYearDate.toISOString().split('T')[0];
    
    setFormData({
      user_id: '',
      member_code: '',
      member_type: 'student',
      status: 'active',
      join_date: today,
      expiry_date: expiry,
      notes: '',
      max_books_allowed: 5,
      full_name: '',
      email: '',
      mobile: '',
      date_of_birth: '',
      gender: '',
      address: '',
      class_id: '',
      section: '',
      department: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Member) => {
    setEditingItem(item);
    setFormData({
      user_id: item.user_id.toString(),
      member_code: item.member_code,
      member_type: item.member_type,
      status: item.status,
      join_date: item.join_date,
      expiry_date: item.expiry_date || '',
      notes: item.notes || '',
      max_books_allowed: item.max_books_allowed !== undefined ? item.max_books_allowed : (item.member_type === 'student' ? 5 : item.member_type === 'teacher' ? 10 : 3),
      
      full_name: item.name || '',
      email: item.email || '',
      mobile: item.mobile || '',
      date_of_birth: (item as any).date_of_birth || '',
      gender: (item as any).gender || '',
      address: (item as any).address || '',
      class_id: (item as any).class_id ? (item as any).class_id.toString() : '',
      section: (item as any).section || '',
      department: (item as any).department || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let response;
      const payload = {
        member_code: formData.member_code,
        join_date: formData.join_date,
        expiry_date: formData.expiry_date || null,
        status: formData.status,
        notes: formData.notes || null,
        max_books_allowed: formData.max_books_allowed,
        
        // Profile fields
        full_name: formData.full_name,
        email: formData.email || null,
        mobile: formData.mobile || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        address: formData.address || null,
        class_id: formData.member_type === 'student' ? parseInt(formData.class_id) || null : null,
        section: formData.member_type === 'student' ? formData.section || null : null,
        department: formData.member_type !== 'student' ? formData.department || null : null,
      };

      if (editingItem) {
        response = await api.put(`/school/library-members/${editingItem.id}`, payload);
      } else {
        if (!formData.user_id) {
          toast.error('Please select a member to enroll');
          return;
        }
        response = await api.post('/school/library-members', {
          ...payload,
          user_id: parseInt(formData.user_id),
          member_type: formData.member_type,
        });
      }

      if (response.data.success) {
        toast.success(response.data.message || 'Member saved successfully');
        setIsModalOpen(false);
        fetchMembers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save member details');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await api.patch(`/school/library-members/${id}/toggle-status`);
      if (response.data.success) {
        toast.success(response.data.message || 'Status updated');
        fetchMembers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update member status');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to unenroll/delete "${name}" from library membership?`)) return;
    try {
      const response = await api.delete(`/school/library-members/${id}`);
      if (response.data.success) {
        toast.success(response.data.message || 'Member deleted');
        fetchMembers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete membership');
    }
  };

  const handleRestore = async (id: number) => {
    try {
      const response = await api.post(`/school/library-members/${id}/restore`);
      if (response.data.success) {
        toast.success(response.data.message || 'Member restored');
        fetchMembers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore membership');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('This will permanently delete this library membership and all histories. Proceed?')) return;
    try {
      const response = await api.delete(`/school/library-members/${id}/force`);
      if (response.data.success) {
        toast.success(response.data.message || 'Permanently deleted');
        fetchMembers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete membership permanently');
    }
  };

  // Bulk operations
  const handleBulkStatusChange = async (status: string) => {
    setBulkUpdating(true);
    try {
      const response = await api.post('/school/library-members/bulk-status', {
        status,
        ids: Array.from(selectedItems)
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedItems(new Set());
        fetchMembers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk status change failed');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    const msg = showTrashed
      ? 'Are you sure you want to permanently delete these membership accounts?'
      : 'Are you sure you want to delete these membership accounts?';
    if (!confirm(msg)) return;

    setBulkUpdating(true);
    try {
      const response = await api.post('/school/library-members/bulk-delete', {
        ids: Array.from(selectedItems),
        force: showTrashed
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedItems(new Set());
        fetchMembers();
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
      const response = await api.post('/school/library-members/bulk-restore', {
        ids: Array.from(selectedItems)
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedItems(new Set());
        fetchMembers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk restore failed');
    } finally {
      setBulkUpdating(false);
    }
  };

  // Print Registration Cards
  const openPrintCardModal = (item: Member) => {
    setCardItem(item);
    setIsCardModalOpen(true);
  };

  const handlePrintCard = () => {
    window.print();
  };

  // Excel exports
  const handleExport = () => {
    try {
      const exportData = filteredData.map(item => ({
        'Library Card No': item.member_code,
        'Member Name': item.name,
        'Member Type': item.member_type.toUpperCase(),
        'Details': item.details,
        'ID/Code': item.extra_code,
        'Email': item.email || '',
        'Mobile': item.mobile || '',
        'Joined Date': item.join_date,
        'Expiry Date': item.expiry_date || '',
        'Status': item.status.toUpperCase(),
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Library Members');
      XLSX.writeFile(wb, `library_members_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Members list exported successfully!');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Export failed');
    }
  };

  const downloadSampleFile = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Library Members');

      worksheet.columns = [
        { header: 'Library Card No', key: 'member_code', width: 18 },
        { header: 'Member Type', key: 'member_type', width: 15 },
        { header: 'Reference Code', key: 'reference_code', width: 20 },
        { header: 'Join Date', key: 'join_date', width: 15 },
        { header: 'Expiry Date', key: 'expiry_date', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Notes', key: 'notes', width: 30 },
      ];

      worksheet.addRow({
        member_code: 'LIB123456',
        member_type: 'student',
        reference_code: 'ADM001',
        join_date: '2026-06-01',
        expiry_date: '2027-06-01',
        status: 'Active',
        notes: 'Sample student registration',
      });

      worksheet.addRow({
        member_code: 'LIB987654',
        member_type: 'teacher',
        reference_code: 'TCH001',
        join_date: '2026-06-01',
        expiry_date: '',
        status: 'Active',
        notes: 'Sample teacher registration',
      });

      // Validations setup
      const statusValues = ['Active', 'Inactive', 'Suspended'];
      const typeValues = ['student', 'teacher', 'staff'];

      worksheet.getCell('Y1').value = 'Status_List';
      statusValues.forEach((val, idx) => { worksheet.getCell(`Y${idx + 2}`).value = val; });
      worksheet.getColumn('Y').hidden = true;

      worksheet.getCell('Z1').value = 'Type_List';
      typeValues.forEach((val, idx) => { worksheet.getCell(`Z${idx + 2}`).value = val; });
      worksheet.getColumn('Z').hidden = true;

      for (let r = 2; r <= 500; r++) {
        worksheet.getCell(`B${r}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'Library Members'!$Z$2:$Z$4`],
          showErrorMessage: true, errorTitle: 'Invalid Type', error: 'Must select student, teacher, or staff'
        };
        worksheet.getCell(`F${r}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'Library Members'!$Y$2:$Y$4`],
          showErrorMessage: true, errorTitle: 'Invalid Status', error: 'Must select Active, Inactive, or Suspended'
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_library_members.xlsx');
      toast.success('Sample file downloaded!');
    } catch (error) {
      console.error(error);
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
          if (firstCell && (firstCell === 'Library Card No' || firstCell?.toString().includes('Card'))) {
            headerRowIndex = i;
            headers = rows[i].map((cell: any) => cell?.toString().trim() || '');
            break;
          }
        }
        
        if (headerRowIndex === -1) {
          toast.error('Could not find header row (e.g. "Library Card No")');
          return;
        }
        
        const dataRows: any[] = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          if (row[0] === 'Status_List') continue; // skip validation helpers
          
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
          toast.error('No valid rows found in file.');
          return;
        }
        
        setImportData(dataRows);
        setImportPreview(dataRows.slice(0, 5));
        setIsImportModalOpen(true);
      } catch (err) {
        toast.error('Failed to parse spreadsheet file');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const submitImport = async () => {
    setImporting(true);
    try {
      const payload = importData.map(row => ({
        member_code: row['Library Card No'] || '',
        member_type: (row['Member Type'] || 'student').toLowerCase(),
        reference_code: row['Reference Code'] || '',
        join_date: row['Join Date'] ? new Date(row['Join Date']).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expiry_date: row['Expiry Date'] ? new Date(row['Expiry Date']).toISOString().split('T')[0] : null,
        status: (row['Status'] || 'active').toLowerCase(),
        notes: row['Notes'] || null,
      }));

      const response = await api.post('/school/library-members/bulk-import', { data: payload });
      if (response.data.success) {
        toast.success(response.data.message || 'Bulk enroll completed successfully');
        setIsImportModalOpen(false);
        fetchMembers();
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
  };

  // Avatar random gradient selector for premium visual styles
  const getAvatarColor = (name: string) => {
    const colors = [
      'from-blue-400 to-indigo-500',
      'from-purple-400 to-pink-500',
      'from-emerald-400 to-teal-500',
      'from-orange-400 to-red-500',
      'from-pink-400 to-rose-500',
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  return (
    <div className="space-y-4">
      {/* Printable Area scoping styles for window.print() */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-membership-card, #printable-membership-card * {
              visibility: visible !important;
            }
            #printable-membership-card {
              position: fixed !important;
              left: 50% !important;
              top: 50% !important;
              transform: translate(-50%, -50%) !important;
              width: 260px !important;
              height: 380px !important;
              border: 1px solid #d1d5db !important;
              border-radius: 12px !important;
              box-shadow: none !important;
              margin: 0 !important;
              background-color: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              z-index: 99999 !important;
            }
            #print-exclude-btn {
              display: none !important;
            }
          }
        `}
      </style>

      {/* Tab switchers */}
      <div className="flex bg-gray-100 rounded-lg p-1 max-w-xl border border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>👥</span> All Members
          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
            activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}>{badgeCounts.all}</span>
        </button>

        <button
          onClick={() => setActiveTab('student')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'student'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>🎓</span> Students
          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
            activeTab === 'student' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}>{badgeCounts.student}</span>
        </button>

        <button
          onClick={() => setActiveTab('teacher')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'teacher'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>👩‍🏫</span> Teachers
          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
            activeTab === 'teacher' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}>{badgeCounts.teacher}</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'staff'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>👔</span> Staff
          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
            activeTab === 'staff' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}>{badgeCounts.staff}</span>
        </button>
      </div>

      {/* Filter and control layout */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search card no, name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none w-44 h-[26px] text-xs"
          />

          <Select
            value={
              filterStatus
                ? { value: filterStatus, label: filterStatus.toUpperCase() }
                : null
            }
            onChange={(option) => setFilterStatus(option ? option.value : '')}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'suspended', label: 'Suspended' },
              { value: 'expired', label: 'Expired' }
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
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-700 font-medium px-1 h-[26px]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Toolbar buttons */}
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
              onClick={handleOpenAddModal}
              className="flex items-center gap-1 px-2.5 h-[26px] bg-blue-500 hover:bg-blue-600 text-white rounded transition text-xs font-medium cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Enroll Member
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
                  onClick={() => handleBulkStatusChange('active')}
                  disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 transition disabled:opacity-50 text-green-700 font-medium cursor-pointer"
                >
                  Mark Active
                </button>
                <button
                  onClick={() => handleBulkStatusChange('inactive')}
                  disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 transition disabled:opacity-50 text-red-750 font-medium cursor-pointer"
                >
                  Mark Inactive
                </button>
                <button
                  onClick={() => handleBulkStatusChange('suspended')}
                  disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 transition disabled:opacity-50 text-orange-700 font-medium cursor-pointer"
                >
                  Suspend Selected
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

      {/* Main Grid table view */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm text-xs">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-1 text-gray-500 text-[10px]">Loading memberships...</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[900px]">
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
                  <th onClick={() => handleSort('member_code')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition w-36">
                    Card No {getSortIcon('member_code')}
                  </th>
                  <th onClick={() => handleSort('name')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition">
                    Member Details {getSortIcon('name')}
                  </th>
                  <th onClick={() => handleSort('member_type')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition w-28 text-center">
                    Type {getSortIcon('member_type')}
                  </th>
                  <th className="py-2 px-2.5 w-44">Contact Info</th>
                  <th onClick={() => handleSort('join_date')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition w-28 text-center">
                    Join Date {getSortIcon('join_date')}
                  </th>
                  <th onClick={() => handleSort('expiry_date')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition w-28 text-center">
                    Expiry Date {getSortIcon('expiry_date')}
                  </th>
                  <th onClick={() => handleSort('status')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition w-28 text-center">
                    Status {getSortIcon('status')}
                  </th>
                  <th className="py-2 px-2.5 w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500 font-medium">
                      No library members found. {showTrashed ? 'No deleted records matching.' : ''}
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
                      <td className="py-1.5 px-2.5 font-mono font-bold text-gray-900">{item.member_code}</td>
                      <td className="py-1.5 px-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getAvatarColor(item.name)} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-950 leading-tight">{item.name}</div>
                            <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                              {item.details} {item.extra_code ? `| Ref: ${item.extra_code}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-1.5 px-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          item.member_type === 'student'
                            ? 'bg-blue-50 text-blue-700'
                            : item.member_type === 'teacher'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {item.member_type}
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5">
                        <div className="text-gray-800 leading-normal">{item.email || '—'}</div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">{item.mobile || '—'}</div>
                      </td>
                      <td className="py-1.5 px-2.5 text-center font-medium">{item.join_date}</td>
                      <td className="py-1.5 px-2.5 text-center font-medium text-gray-600">{item.expiry_date || 'Lifetime'}</td>
                      
                      <td className="py-1.5 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <ToggleSwitch
                            checked={item.status === 'active'}
                            onChange={() => handleToggleStatus(item.id)}
                            disabled={showTrashed}
                          />
                          <span className={`text-[10px] font-bold uppercase ${
                            item.status === 'active'
                              ? 'text-green-600'
                              : item.status === 'suspended'
                                ? 'text-orange-500'
                                : 'text-gray-400'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </td>

                      <td className="py-1.5 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
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
                                onClick={() => openPrintCardModal(item)}
                                className="p-1 text-teal-600 hover:bg-teal-50 rounded transition cursor-pointer"
                                title="Print Membership Card"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.378 0 2.472.507 2.997 1.25M9 15h3m2-2h3m-3 2h3" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(item)}
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

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 bg-gray-50 select-none">
            <span className="text-gray-500 font-semibold text-[10px]">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} members
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

      {/* CRUD Enrollment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl border border-gray-100 overflow-hidden animate-slideUp">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-200 text-gray-800">
              <h3 className="font-bold text-sm">
                {editingItem ? 'Edit Member Enrollment' : 'Enroll Library Member'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition text-sm">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveMember} className="p-5 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
              
              {/* Row 1: Member Type & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Member Type *</label>
                  <Select
                    isDisabled={editingItem !== null}
                    value={[
                      { value: 'student', label: '🎓 Student' },
                      { value: 'teacher', label: '👩‍🏫 Teacher' },
                      { value: 'staff', label: '👔 School Staff' }
                    ].find(opt => opt.value === formData.member_type)}
                    onChange={(option: any) => {
                      if (option) {
                        setFormData(prev => ({
                          ...prev,
                          member_type: option.value,
                          user_id: '',
                          full_name: '',
                          email: '',
                          mobile: '',
                          date_of_birth: '',
                          gender: '',
                          address: '',
                          class_id: '',
                          section: '',
                          department: '',
                        }));
                      }
                    }}
                    options={[
                      { value: 'student', label: '🎓 Student' },
                      { value: 'teacher', label: '👩‍🏫 Teacher' },
                      { value: 'staff', label: '👔 School Staff' }
                    ]}
                    isSearchable={true}
                    styles={customSelectStyles}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Status</label>
                  <Select
                    value={[
                      { value: 'active', label: '🟢 Active' },
                      { value: 'inactive', label: '🔴 Inactive' },
                      { value: 'suspended', label: '🟡 Suspended' },
                      { value: 'expired', label: '⚫ Expired' }
                    ].find(opt => opt.value === formData.status)}
                    onChange={(option) => setFormData(prev => ({ ...prev, status: option ? option.value : 'active' }))}
                    options={[
                      { value: 'active', label: '🟢 Active' },
                      { value: 'inactive', label: '🔴 Inactive' },
                      { value: 'suspended', label: '🟡 Suspended' },
                      { value: 'expired', label: '⚫ Expired' }
                    ]}
                    isSearchable={true}
                    styles={customSelectStyles}
                    className="w-full text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Selector for Person to Enroll (Only in Create Mode) */}
              {!editingItem && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Select Person to Enroll *</label>
                  <Select
                    isLoading={loadingEligible}
                    value={eligibleUsers.find(opt => opt.value.toString() === formData.user_id) || null}
                    onChange={(option: any) => {
                      if (option) {
                        setFormData(prev => ({
                          ...prev,
                          user_id: option.value.toString(),
                          full_name: option.name,
                          email: option.email || '',
                          mobile: option.mobile || '',
                          date_of_birth: option.date_of_birth || '',
                          gender: option.gender || '',
                          address: option.address || '',
                          class_id: option.class_id ? option.class_id.toString() : '',
                          section: option.section || '',
                          department: option.department || '',
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          user_id: '',
                          full_name: '',
                          email: '',
                          mobile: '',
                          date_of_birth: '',
                          gender: '',
                          address: '',
                          class_id: '',
                          section: '',
                          department: '',
                        }));
                      }
                    }}
                    options={eligibleUsers}
                    placeholder={`Search eligible ${formData.member_type}s...`}
                    styles={customSelectStyles}
                    isSearchable={true}
                    className="w-full text-xs"
                  />
                  {eligibleUsers.length === 0 && !loadingEligible && (
                    <p className="text-[10px] text-red-500 mt-1">
                      No active {formData.member_type}s available to enroll. (All are already library members)
                    </p>
                  )}
                </div>
              )}

              {/* Row 2: Full Name & Member ID */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Member ID (Auto-generated)</label>
                  <input
                    type="text"
                    disabled
                    placeholder="Auto-generated"
                    value={formData.member_code}
                    className="w-full px-3 py-1.5 border border-gray-250 bg-gray-50 rounded text-gray-500 font-mono"
                  />
                </div>
              </div>

              {/* Row 3: Class & Section (Student) or Department (Teacher/Staff) */}
              {formData.member_type === 'student' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Class *</label>
                    <Select
                      value={classes.find(c => c.value.toString() === formData.class_id) || null}
                      onChange={(option) => setFormData(prev => ({ ...prev, class_id: option ? option.value.toString() : '' }))}
                      options={classes}
                      placeholder="Select class"
                      styles={customSelectStyles}
                      isSearchable={true}
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Section</label>
                    <Select
                      value={sections.find(s => s.value === formData.section) || null}
                      onChange={(option) => setFormData(prev => ({ ...prev, section: option ? option.value : '' }))}
                      options={sections}
                      placeholder="Select section"
                      styles={customSelectStyles}
                      isSearchable={true}
                      className="w-full text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Department</label>
                  <Select
                    value={departments.find(d => d.value === formData.department) || (formData.department ? { value: formData.department, label: formData.department } : null)}
                    onChange={(option) => setFormData(prev => ({ ...prev, department: option ? option.value : '' }))}
                    options={departments}
                    placeholder="Select department"
                    styles={customSelectStyles}
                    isSearchable={true}
                    className="w-full text-xs"
                  />
                </div>
              )}

              {/* Row 4: Email & Phone Number */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="member@school.edu"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91-XXXXXXXXXX"
                    value={formData.mobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Date of Birth & Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Gender</label>
                  <Select
                    value={genders.find(g => g.value === formData.gender.toLowerCase()) || (formData.gender ? { value: formData.gender.toLowerCase(), label: formData.gender } : null)}
                    onChange={(option) => setFormData(prev => ({ ...prev, gender: option ? option.label : '' }))}
                    options={genders}
                    placeholder="Select gender"
                    styles={customSelectStyles}
                    isSearchable={true}
                    className="w-full text-xs"
                  />
                </div>
              </div>

              {/* Row 6: Address */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Address</label>
                <textarea
                  placeholder="Residential address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none h-16 resize-none"
                />
              </div>

              {/* Row 7: Registration Date, Membership Valid Till, Max Books Allowed */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Registration Date</label>
                  <input
                    type="date"
                    required
                    value={formData.join_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, join_date: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Membership Valid Till</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Max Books Allowed</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.max_books_allowed}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_books_allowed: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Notes / Remarks</label>
                <textarea
                  placeholder="Notes about membership..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none h-12 resize-none"
                />
              </div>

              {/* Buttons */}
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
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium shadow-sm transition cursor-pointer"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Membership Card Modal */}
      {isCardModalOpen && cardItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm border border-gray-100 overflow-hidden animate-slideUp text-xs">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-200 text-gray-800">
              <h3 className="font-bold text-sm">Library Membership Card</h3>
              <button onClick={() => setIsCardModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition text-sm">
                ✕
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center justify-center">
              {/* Printable Card Frame */}
              <div
                id="printable-membership-card"
                className="w-[260px] h-[380px] bg-white border border-gray-300 rounded-xl shadow-lg flex flex-col justify-between overflow-hidden relative font-sans p-4 bg-gradient-to-b from-slate-50 to-white"
              >
                {/* Header design */}
                <div className="text-center border-b border-slate-200 pb-2 flex items-center gap-2 justify-center">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[14px] font-black shadow-sm">
                    S
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-800 tracking-wide uppercase leading-none">School Management</h4>
                    <span className="text-[8px] font-bold text-blue-600 tracking-widest uppercase">LIBRARY MEMBER</span>
                  </div>
                </div>

                {/* Center Content */}
                <div className="flex flex-col items-center my-3 space-y-2">
                  {/* Photo Initials */}
                  <div className={`w-18 h-18 rounded-full bg-gradient-to-tr ${getAvatarColor(cardItem.name)} flex items-center justify-center text-white text-2xl font-black shadow-md border-2 border-white ring-4 ring-slate-100`}>
                    {cardItem.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name and role info */}
                  <div className="text-center">
                    <h3 className="text-sm font-black text-slate-900 leading-snug">{cardItem.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">
                      {cardItem.member_type}
                    </p>
                  </div>

                  {/* Class / Department metadata table */}
                  <div className="w-full bg-slate-50/80 rounded-lg p-2 text-[9px] border border-slate-100 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold uppercase">Detail:</span>
                      <span className="font-bold text-slate-700">{cardItem.details}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold uppercase">ID Ref:</span>
                      <span className="font-mono font-bold text-slate-700">{cardItem.extra_code || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold uppercase">Joined:</span>
                      <span className="font-bold text-slate-700">{cardItem.join_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold uppercase">Expires:</span>
                      <span className="font-bold text-slate-700">{cardItem.expiry_date || 'Lifetime'}</span>
                    </div>
                  </div>
                </div>

                {/* Barcode section */}
                <div className="flex flex-col items-center mt-auto">
                  {/* Visual Barcode rendering using stripe divs */}
                  <div className="h-8 flex items-end gap-[1px] justify-center w-full px-4 overflow-hidden mb-0.5 select-none">
                    {Array.from({ length: 48 }).map((_, idx) => {
                      const widths = [1, 2, 1, 3, 1, 2];
                      const randW = widths[(idx + cardItem.id) % widths.length];
                      const color = idx % 2 === 0 ? 'bg-slate-800' : 'bg-transparent';
                      return <div key={idx} className={`h-8 ${color}`} style={{ width: `${randW}px` }} />;
                    })}
                  </div>
                  <span className="text-[9px] font-mono font-black text-slate-800 tracking-widest leading-none">
                    {cardItem.member_code}
                  </span>
                </div>
              </div>

              {/* Action operations */}
              <div className="mt-5 w-full flex items-center justify-center gap-3">
                <button
                  type="button"
                  id="print-exclude-btn"
                  onClick={handlePrintCard}
                  className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold shadow-md transition cursor-pointer text-center text-xs flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Membership Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spreadsheet import validation preview overlay */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl border border-gray-100 overflow-hidden animate-slideUp text-xs">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-200 text-gray-800">
              <h3 className="font-bold text-sm">
                Verify Spreadsheet Data (Library Members)
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition text-sm">
                ✕
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <p className="text-gray-600">
                Below is a preview of the first 5 member registrations found. Click "Confirm Import" to register all <strong>{importData.length}</strong> library members.
              </p>
              
              <div className="border border-gray-200 rounded overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold uppercase text-[10px]">
                      <th className="py-1.5 px-2">Library Card No</th>
                      <th className="py-1.5 px-2">Member Type</th>
                      <th className="py-1.5 px-2">Reference Code</th>
                      <th className="py-1.5 px-2">Join Date</th>
                      <th className="py-1.5 px-2">Expiry Date</th>
                      <th className="py-1.5 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {importPreview.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 text-gray-600">
                        <td className="py-1.5 px-2 font-mono font-bold text-gray-900">{row['Library Card No']}</td>
                        <td className="py-1.5 px-2">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-gray-100 text-gray-700">
                            {row['Member Type']}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 font-semibold text-blue-600">{row['Reference Code']}</td>
                        <td className="py-1.5 px-2">{row['Join Date']}</td>
                        <td className="py-1.5 px-2">{row['Expiry Date'] || 'Lifetime'}</td>
                        <td className="py-1.5 px-2 font-semibold">{row['Status'] || 'Active'}</td>
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

export default LibraryMemberManager;
