import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';
import * as XLSX from 'xlsx';

interface TeacherData {
  id: number;
  user_id: number;
  school_id: number;
  employee_id: string;
  qualification: string;
  specialization: string;
  experience_years: number;
  joining_date: string;
  department: string;
  salary: number;
  is_class_teacher: boolean;
  is_active: boolean;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
    gender: string;
    date_of_birth: string;
    address: string;
  };
}

interface ClassOption {
  value: number;
  label: string;
}

// Searchable Select Component
const SearchableSelect: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isClearable?: boolean;
}> = ({ options, value, onChange, placeholder, isClearable = true }) => {
  const selectedOption = options.find(opt => opt.value === value) || null;
  
  return (
    <Select
      options={options}
      value={selectedOption}
      onChange={(selected) => onChange(selected ? selected.value : '')}
      placeholder={placeholder}
      isClearable={isClearable}
      className="w-32 text-sm"
      classNamePrefix="react-select"
      styles={{
        control: (base: any) => ({
          ...base,
          borderRadius: '0.5rem',
          borderColor: '#d1d5db',
          minHeight: '32px',
          boxShadow: 'none',
          '&:hover': { borderColor: '#9ca3af' },
        }),
        option: (base: any, state: any) => ({
          ...base,
          backgroundColor: state.isFocused ? '#eff6ff' : 'white',
          color: '#1f2937',
          cursor: 'pointer',
        }),
      }}
    />
  );
};

const TeacherManager: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [filteredData, setFilteredData] = useState<TeacherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TeacherData | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>('employee_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterClassTeacher, setFilterClassTeacher] = useState<string>('');
  
  // Master data
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [departments, setDepartments] = useState<string[]>([
    'Science', 'Mathematics', 'Languages', 'Social Studies', 
    'Computer Science', 'Physical Education', 'Arts', 'Commerce'
  ]);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    gender: '',
    date_of_birth: '',
    address: '',
    employee_id: '',
    qualification: '',
    specialization: '',
    experience_years: 0,
    joining_date: new Date().toISOString().split('T')[0],
    department: '',
    salary: 0,
    is_class_teacher: false,
    assigned_class_id: '',
    is_active: true,
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [teachers, searchTerm, filterDepartment, filterStatus, filterClassTeacher, sortColumn, sortDirection]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTeachers(),
        fetchClasses(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/school/teachers');
      if (response.data.success) {
        setTeachers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teachers');
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get('/master/classes');
      if (response.data.success) {
        const classesData = response.data.data;
        let classArray: ClassOption[] = [];
        if (typeof classesData === 'object' && !Array.isArray(classesData)) {
          classArray = Object.entries(classesData).map(([id, name]) => ({
            value: parseInt(id),
            label: name as string,
          }));
        }
        setClasses(classArray);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...teachers];

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDepartment) {
      filtered = filtered.filter(item => item.department === filterDepartment);
    }

    if (filterStatus) {
      filtered = filtered.filter(item => item.is_active.toString() === filterStatus);
    }

    if (filterClassTeacher) {
      filtered = filtered.filter(item => item.is_class_teacher.toString() === filterClassTeacher);
    }

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
    setFilterDepartment('');
    setFilterStatus('');
    setFilterClassTeacher('');
  };

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = itemsPerPage === -1 
    ? filteredData 
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      mobile: '',
      gender: '',
      date_of_birth: '',
      address: '',
      employee_id: '',
      qualification: '',
      specialization: '',
      experience_years: 0,
      joining_date: new Date().toISOString().split('T')[0],
      department: '',
      salary: 0,
      is_class_teacher: false,
      assigned_class_id: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: TeacherData) => {
    setEditingItem(item);
    setFormData({
      first_name: item.user?.first_name || '',
      last_name: item.user?.last_name || '',
      email: item.user?.email || '',
      mobile: item.user?.mobile || '',
      gender: item.user?.gender || '',
      date_of_birth: item.user?.date_of_birth || '',
      address: item.user?.address || '',
      employee_id: item.employee_id,
      qualification: item.qualification || '',
      specialization: item.specialization || '',
      experience_years: item.experience_years,
      joining_date: item.joining_date,
      department: item.department || '',
      salary: item.salary,
      is_class_teacher: item.is_class_teacher,
      assigned_class_id: '',
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name || !formData.email || !formData.mobile) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const submitData = {
        user_data: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          mobile: formData.mobile,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth,
          address: formData.address,
          user_type: 'teacher',
        },
        teacher_data: {
          employee_id: formData.employee_id,
          qualification: formData.qualification,
          specialization: formData.specialization,
          experience_years: formData.experience_years,
          joining_date: formData.joining_date,
          department: formData.department,
          salary: formData.salary,
          is_class_teacher: formData.is_class_teacher,
          assigned_class_id: formData.assigned_class_id || null,
          is_active: formData.is_active,
        },
      };

      if (editingItem) {
        const response = await api.put(`/school/teachers/${editingItem.id}`, submitData);
        if (response.data.success) {
          toast.success('Teacher updated successfully');
        }
      } else {
        const response = await api.post('/school/teachers', submitData);
        if (response.data.success) {
          toast.success('Teacher created successfully');
        }
      }
      setIsModalOpen(false);
      fetchTeachers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete teacher "${name}"?`)) {
      try {
        const response = await api.delete(`/school/teachers/${id}`);
        if (response.data.success) {
          toast.success('Teacher deleted successfully');
          fetchTeachers();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await api.patch(`/school/teachers/${id}/toggle-status`);
      if (response.data.success) {
        toast.success('Teacher status updated');
        fetchTeachers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleBulkStatusUpdate = async (status: boolean) => {
    setBulkUpdating(true);
    const ids = Array.from(selectedItems);
    
    try {
      for (const id of ids) {
        await api.patch(`/school/teachers/${id}/toggle-status`);
      }
      toast.success(`${ids.length} teacher(s) ${status ? 'activated' : 'deactivated'} successfully`);
      setSelectedItems(new Set());
      fetchTeachers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleExport = () => {
    try {
      const exportData = filteredData.map(item => ({
        'Employee ID': item.employee_id,
        'Teacher Name': `${item.user?.first_name || ''} ${item.user?.last_name || ''}`,
        'Email': item.user?.email || '',
        'Mobile': item.user?.mobile || '',
        'Gender': item.user?.gender || '',
        'Department': item.department || '',
        'Qualification': item.qualification || '',
        'Specialization': item.specialization || '',
        'Experience (Years)': item.experience_years,
        'Joining Date': item.joining_date,
        'Salary': item.salary,
        'Class Teacher': item.is_class_teacher ? 'Yes' : 'No',
        'Status': item.is_active ? 'Active' : 'Inactive',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Teachers');
      XLSX.writeFile(wb, `teachers_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Export successful!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const downloadSampleFile = () => {
    const sampleData = [
      {
        'Employee ID': 'TCH001',
        'First Name': 'Rahul',
        'Last Name': 'Sharma',
        'Email': 'rahul.sharma@school.com',
        'Mobile': '9876543210',
        'Gender': 'Male',
        'Date of Birth': '1985-05-15',
        'Address': 'Delhi, India',
        'Qualification': 'M.Sc., B.Ed',
        'Specialization': 'Mathematics',
        'Experience (Years)': 10,
        'Joining Date': '2015-04-01',
        'Department': 'Mathematics',
        'Salary': 50000,
        'Class Teacher': 'Yes',
        'Status': 'Active',
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample Teachers');
    XLSX.writeFile(wb, 'sample_teachers.xlsx');
    toast.success('Sample file downloaded!');
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
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        setImportData(jsonData);
        setImportPreview(jsonData.slice(0, 5));
        setIsImportModalOpen(true);
      } catch (error) {
        console.error('File read error:', error);
        toast.error('Failed to read file');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processImport = async () => {
    setImporting(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    for (let i = 0; i < importData.length; i++) {
      const row = importData[i];
      const rowNum = i + 2;

      try {
        const submitData = {
          user_data: {
            first_name: row['First Name'],
            last_name: row['Last Name'] || '',
            email: row['Email'],
            mobile: row['Mobile'],
            gender: row['Gender']?.toLowerCase() || '',
            date_of_birth: row['Date of Birth'] || null,
            address: row['Address'] || '',
            user_type: 'teacher',
          },
          teacher_data: {
            employee_id: row['Employee ID'],
            qualification: row['Qualification'] || '',
            specialization: row['Specialization'] || '',
            experience_years: row['Experience (Years)'] || 0,
            joining_date: row['Joining Date'] || new Date().toISOString().split('T')[0],
            department: row['Department'] || '',
            salary: row['Salary'] || 0,
            is_class_teacher: row['Class Teacher']?.toLowerCase() === 'yes',
            is_active: row['Status']?.toLowerCase() === 'active',
          },
        };

        await api.post('/school/teachers', submitData);
        successCount++;
      } catch (error: any) {
        errorCount++;
        errors.push({ row: rowNum, error: error.response?.data?.message || error.message });
      }
    }

    toast.success(`Import completed: ${successCount} success, ${errorCount} failed`);
    setIsImportModalOpen(false);
    fetchTeachers();
    setImporting(false);
  };

  const getFullName = (teacher: TeacherData) => {
    return `${teacher.user?.first_name || ''} ${teacher.user?.last_name || ''}`.trim() || 'N/A';
  };

  const handleSelectRow = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === paginatedData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(paginatedData.map(item => item.id)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-[13px] text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-6 -mt-6">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h3 className="text-lg font-semibold text-gray-800">Teacher Management</h3>
        <p className="text-sm text-gray-500">Manage teachers, qualifications, and assignments</p>
      </div>

      {/* Action Buttons, Search and Show */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Search:</span>
            <input
              type="text"
              placeholder="Name, ID or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                const val = e.target.value === 'all' ? -1 : Number(e.target.value);
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
              className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="all">All</option>
            </select>
          </div>
          {(searchTerm || filterDepartment || filterClassTeacher || filterStatus) && (
            <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700">Clear Filters ✕</button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={downloadSampleFile} className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition">
            Sample
          </button>
          <label className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition cursor-pointer">
            Import
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
          </label>
          <button onClick={handleExport} className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition">
            Export
          </button>
          <button onClick={openAddModal} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition">
            Add New
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">Department</option>
          {departments.map(dept => (<option key={dept} value={dept}>{dept}</option>))}
        </select>
        <select
          value={filterClassTeacher}
          onChange={(e) => setFilterClassTeacher(e.target.value)}
          className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">Teacher Type</option>
          <option value="true">Class Teacher</option>
          <option value="false">Subject Teacher</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-blue-800 font-medium">{selectedItems.size} teacher(s) selected</div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleBulkStatusUpdate(true)} disabled={bulkUpdating} className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50">
              Activate
            </button>
            <button onClick={() => handleBulkStatusUpdate(false)} disabled={bulkUpdating} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition disabled:opacity-50">
              Deactivate
            </button>
            <button onClick={() => setSelectedItems(new Set())} className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border-y border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left w-10">
                <input type="checkbox" checked={selectedItems.size === paginatedData.length && paginatedData.length > 0} onChange={handleSelectAll} className="w-4 h-4 text-blue-600 rounded" />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('employee_id')}>
                Employee ID
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('name')}>
                Teacher Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Mobile</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Department</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Experience</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Class Teacher</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('is_active')}>
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p>No teachers found</p>
                    <button onClick={openAddModal} className="mt-2 text-blue-600 hover:text-blue-700 font-medium">Click here to add</button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3"><input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => handleSelectRow(item.id)} className="w-4 h-4 text-blue-600 rounded" /></td>
                  <td className="px-4 py-3 text-gray-700 font-mono">{item.employee_id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {getFullName(item).charAt(0)}
                      </div>
                      <span className="font-medium text-gray-800">{getFullName(item)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.user?.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{item.user?.mobile || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                      {item.department || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.experience_years} yrs</td>
                  <td className="px-4 py-3 text-center">
                    {item.is_class_teacher ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Yes</span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleStatus(item.id)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${item.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${item.is_active ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                      </button>
                      <span className={`text-[11px] font-medium ${item.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditModal(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2} /></svg>
                      </button>
                      <button onClick={() => handleDelete(item.id, getFullName(item))} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && itemsPerPage !== -1 && (
        <div className="flex justify-end items-center px-6 py-4 gap-2">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 text-sm">«</button>
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 text-sm">‹</button>
          <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 text-sm">›</button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 text-sm">»</button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden animate-fade-in-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5">
                <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-sm font-bold text-white">
                    {editingItem ? 'Edit Teacher' : 'Add New Teacher'}
                    </h3>
                    <p className="text-blue-100 text-[10px] mt-0.5">
                    {editingItem ? 'Update teacher information' : 'Fill teacher details'}
                    </p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(false)} 
                    className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1 transition"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                </div>
            </div>
            
            {/* Form Body - Scrollable */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-100px)]">
                <form onSubmit={handleSubmit} className="space-y-4">
                {/* Personal Information */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                    <span className="text-blue-500 text-sm">👤</span>
                    <span>Personal Information</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                        First Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                        type="text" 
                        name="first_name" 
                        value={formData.first_name} 
                        onChange={handleInputChange} 
                        placeholder="e.g., Rahul"
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
                        required 
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Last Name</label>
                        <input 
                        type="text" 
                        name="last_name" 
                        value={formData.last_name} 
                        onChange={handleInputChange} 
                        placeholder="e.g., Sharma"
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition" 
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                        Email <span className="text-red-500">*</span>
                        </label>
                        <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleInputChange} 
                        placeholder="teacher@school.com"
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition" 
                        required 
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                        Mobile <span className="text-red-500">*</span>
                        </label>
                        <input 
                        type="tel" 
                        name="mobile" 
                        value={formData.mobile} 
                        onChange={handleInputChange} 
                        placeholder="9876543210"
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition" 
                        required 
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Gender</label>
                        <select 
                        name="gender" 
                        value={formData.gender} 
                        onChange={handleInputChange} 
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Date of Birth</label>
                        <input 
                        type="date" 
                        name="date_of_birth" 
                        value={formData.date_of_birth} 
                        onChange={handleInputChange} 
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" 
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Address</label>
                        <textarea 
                        name="address" 
                        value={formData.address} 
                        onChange={handleInputChange} 
                        rows={1} 
                        placeholder="Enter complete address"
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition" 
                        />
                    </div>
                    </div>
                </div>

                {/* Professional Information */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                    <span className="text-green-500 text-sm">💼</span>
                    <span>Professional Information</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                        Employee ID <span className="text-red-500">*</span>
                        </label>
                        <input 
                        type="text" 
                        name="employee_id" 
                        value={formData.employee_id} 
                        onChange={handleInputChange} 
                        placeholder="TCH001"
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition" 
                        required 
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Department</label>
                        <select 
                        name="department" 
                        value={formData.department} 
                        onChange={handleInputChange} 
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                        <option value="">Select</option>
                        <option value="Science">Science</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Languages">Languages</option>
                        <option value="Computer Science">CS</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Qualification</label>
                        <input 
                        type="text" 
                        name="qualification" 
                        value={formData.qualification} 
                        onChange={handleInputChange} 
                        placeholder="M.Sc., B.Ed"
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg transition" 
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Specialization</label>
                        <input 
                        type="text" 
                        name="specialization" 
                        value={formData.specialization} 
                        onChange={handleInputChange} 
                        placeholder="Mathematics"
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg transition" 
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Experience (Years)</label>
                        <input 
                        type="number" 
                        name="experience_years" 
                        value={formData.experience_years} 
                        onChange={handleInputChange} 
                        min="0" 
                        step="1"
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg transition" 
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Joining Date</label>
                        <input 
                        type="date" 
                        name="joining_date" 
                        value={formData.joining_date} 
                        onChange={handleInputChange} 
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg transition" 
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Salary (Monthly)</label>
                        <input 
                        type="number" 
                        name="salary" 
                        value={formData.salary} 
                        onChange={handleInputChange} 
                        min="0" 
                        step="1000"
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg transition" 
                        />
                    </div>
                    </div>
                </div>

                {/* Assignment */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                    <span className="text-purple-500 text-sm">📋</span>
                    <span>Assignment</span>
                    </h4>
                    <div className="space-y-2 bg-gray-50 p-2.5 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                        type="checkbox" 
                        name="is_class_teacher" 
                        checked={formData.is_class_teacher} 
                        onChange={handleInputChange} 
                        className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500" 
                        />
                        <span className="text-xs text-gray-700">Class Teacher</span>
                    </label>
                    {formData.is_class_teacher && (
                        <div className="ml-5">
                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Assign Class</label>
                        <select 
                            name="assigned_class_id" 
                            value={formData.assigned_class_id} 
                            onChange={handleInputChange} 
                            className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Class</option>
                            {classes.map(cls => (
                            <option key={cls.value} value={cls.value}>{cls.label}</option>
                            ))}
                        </select>
                        </div>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                        type="checkbox" 
                        name="is_active" 
                        checked={formData.is_active} 
                        onChange={handleInputChange} 
                        className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500" 
                        />
                        <span className="text-xs text-gray-700">Active</span>
                    </label>
                    </div>
                </div>
                </form>
            </div>

            {/* Footer Buttons */}
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium"
                >
                Cancel
                </button>
                <button 
                type="submit" 
                onClick={handleSubmit} 
                className="px-4 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-sm"
                >
                {editingItem ? 'Update Teacher' : 'Create Teacher'}
                </button>
            </div>
            </div>
        </div>
        )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 rounded-t-xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Import Teachers</h3>
                <button onClick={() => setIsImportModalOpen(false)} className="text-white hover:bg-white/20 rounded-lg p-1 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} /></svg>
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800"><strong>Total Records:</strong> {importData.length} | <strong>Preview (First 5 rows):</strong></p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      {importPreview.length > 0 && Object.keys(importPreview[0]).map((key, idx) => (
                        <th key={idx} className="px-3 py-2 text-left border">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        {Object.values(row).map((val: any, colIdx) => (
                          <td key={colIdx} className="px-3 py-2 border">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0 bg-gray-50 rounded-b-xl">
              <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
              <button onClick={processImport} disabled={importing} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">
                {importing ? 'Importing...' : 'Confirm Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManager;