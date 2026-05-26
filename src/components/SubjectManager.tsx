import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

interface SubjectData {
  id: number;
  school_id: number;
  class_id: number;
  name: string;
  code: string;
  subject_type: string;
  max_marks: number;
  passing_marks: number;
  is_elective: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  class_name?: string;
}

interface MasterOption {
  value: number;
  label: string;
}

const SubjectManager: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [filteredData, setFilteredData] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SubjectData | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterSubjectType, setFilterSubjectType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  
  // Master data states
  const [classes, setClasses] = useState<MasterOption[]>([]);
  
  const [formData, setFormData] = useState({
    class_id: '',
    name: '',
    code: '',
    subject_type: 'theory',
    max_marks: 100,
    passing_marks: 33,
    is_elective: false,
    is_active: true,
  });

  // Bulk import state
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const subjectTypeOptions = [
    { value: 'theory', label: 'Theory' },
    { value: 'practical', label: 'Practical' },
    { value: 'both', label: 'Theory + Practical' },
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [subjects, searchTerm, filterClass, filterSubjectType, filterStatus, sortColumn, sortDirection]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSubjects(),
        fetchClasses(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/school/subjects');
      if (response.data.success) {
        setSubjects(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get('/master/classes');
      if (response.data.success) {
        const classesData = response.data.data;
        let classArray: MasterOption[] = [];
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
    let filtered = [...subjects];

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.class_name && item.class_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterClass) {
      filtered = filtered.filter(item => item.class_id.toString() === filterClass);
    }

    if (filterSubjectType) {
      filtered = filtered.filter(item => item.subject_type === filterSubjectType);
    }

    if (filterStatus) {
      filtered = filtered.filter(item => item.is_active.toString() === filterStatus);
    }

    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof SubjectData];
      let bVal: any = b[sortColumn as keyof SubjectData];
      
      if (sortColumn === 'class_name') {
        aVal = getClassName(a.class_id);
        bVal = getClassName(b.class_id);
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
    setFilterClass('');
    setFilterSubjectType('');
    setFilterStatus('');
  };

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = itemsPerPage === -1 
    ? filteredData 
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      class_id: '',
      name: '',
      code: '',
      subject_type: 'theory',
      max_marks: 100,
      passing_marks: 33,
      is_elective: false,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: SubjectData) => {
    setEditingItem(item);
    setFormData({
      class_id: item.class_id.toString(),
      name: item.name,
      code: item.code || '',
      subject_type: item.subject_type,
      max_marks: item.max_marks,
      passing_marks: item.passing_marks,
      is_elective: item.is_elective,
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.class_id || !formData.name) {
      toast.error('Please fill all required fields');
      return;
    }

    if (formData.passing_marks > formData.max_marks) {
      toast.error('Passing marks cannot be greater than max marks');
      return;
    }

    try {
      const submitData = {
        class_id: parseInt(formData.class_id),
        name: formData.name,
        code: formData.code || null,
        subject_type: formData.subject_type,
        max_marks: formData.max_marks,
        passing_marks: formData.passing_marks,
        is_elective: formData.is_elective,
        is_active: formData.is_active,
      };

      if (editingItem) {
        const response = await api.put(`/school/subjects/${editingItem.id}`, submitData);
        if (response.data.success) {
          toast.success('Subject updated successfully');
        }
      } else {
        const response = await api.post('/school/subjects', submitData);
        if (response.data.success) {
          toast.success('Subject created successfully');
        }
      }
      setIsModalOpen(false);
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete subject "${name}"?`)) {
      try {
        const response = await api.delete(`/school/subjects/${id}`);
        if (response.data.success) {
          toast.success('Subject deleted successfully');
          fetchSubjects();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await api.patch(`/school/subjects/${id}/toggle-status`);
      if (response.data.success) {
        toast.success('Subject status updated');
        fetchSubjects();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const getClassName = (id: number) => {
    const cls = classes.find(c => c.value === id);
    return cls?.label || 'N/A';
  };

  const getSubjectTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      theory: 'Theory',
      practical: 'Practical',
      both: 'Theory + Practical',
    };
    return types[type] || type;
  };

  // Excel Import/Export
  const handleExport = () => {
    try {
      const exportData = filteredData.map(item => ({
        'Class': getClassName(item.class_id),
        'Subject Name': item.name,
        'Subject Code': item.code || '-',
        'Subject Type': getSubjectTypeLabel(item.subject_type),
        'Max Marks': item.max_marks,
        'Passing Marks': item.passing_marks,
        'Elective': item.is_elective ? 'Yes' : 'No',
        'Status': item.is_active ? 'Active' : 'Inactive',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Subjects');
      XLSX.writeFile(wb, `subjects_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Export successful!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const downloadSampleFile = () => {
    const sampleData = [
      {
        'Class': 'Class 1',
        'Subject Name': 'Mathematics',
        'Subject Code': 'MATH101',
        'Subject Type': 'Theory',
        'Max Marks': 100,
        'Passing Marks': 33,
        'Elective': 'No',
        'Status': 'Active',
      },
      {
        'Class': 'Class 1',
        'Subject Name': 'Science',
        'Subject Code': 'SCI101',
        'Subject Type': 'Theory + Practical',
        'Max Marks': 100,
        'Passing Marks': 33,
        'Elective': 'No',
        'Status': 'Active',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample Subjects');
    XLSX.writeFile(wb, 'sample_subjects.xlsx');
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
        const classItem = classes.find(c => c.label === row['Class']);
        if (!classItem) {
          errors.push({ row: rowNum, error: `Class not found: ${row['Class']}` });
          errorCount++;
          continue;
        }

        const subjectTypeMap: Record<string, string> = {
          'Theory': 'theory',
          'Practical': 'practical',
          'Theory + Practical': 'both',
        };
        const subjectType = subjectTypeMap[row['Subject Type']] || 'theory';

        const submitData = {
          class_id: classItem.value,
          name: row['Subject Name'],
          code: row['Subject Code'] || null,
          subject_type: subjectType,
          max_marks: row['Max Marks'] || 100,
          passing_marks: row['Passing Marks'] || 33,
          is_elective: row['Elective']?.toLowerCase() === 'yes',
          is_active: row['Status']?.toLowerCase() === 'active',
        };

        await api.post('/school/subjects', submitData);
        successCount++;
      } catch (error: any) {
        errorCount++;
        errors.push({ row: rowNum, error: error.response?.data?.message || error.message });
      }
    }

    toast.success(`Import completed: ${successCount} success, ${errorCount} failed`);
    setIsImportModalOpen(false);
    fetchSubjects();
    setImporting(false);
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
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-[15px] font-semibold text-gray-800">Subject Management</h3>
        <p className="text-[12px] text-gray-500">Manage subjects for each class</p>
      </div>

      {/* Action Buttons and Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-gray-600">Search:</span>
            <input
              type="text"
              placeholder="Subject name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-56 px-2 py-1 text-[12px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-gray-600">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                const val = e.target.value === 'all' ? -1 : Number(e.target.value);
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
              className="px-2 py-1 text-[12px] border border-gray-300 rounded-lg"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadSampleFile} className="flex items-center gap-1 px-2 py-1 text-[11px] border border-gray-300 rounded-lg hover:bg-gray-50">Sample</button>
          <label className="flex items-center gap-1 px-2 py-1 text-[11px] bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer">
            Import
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
          </label>
          <button onClick={handleExport} className="flex items-center gap-1 px-2 py-1 text-[11px] bg-purple-500 text-white rounded-lg hover:bg-purple-600">Export</button>
          <button onClick={openAddModal} className="flex items-center gap-1 px-3 py-1 text-[12px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth={2} /></svg>
            Add Subject
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="px-2 py-1 text-[11px] border border-gray-300 rounded-lg"
        >
          <option value="">All Classes</option>
          {classes.map((cls) => (
            <option key={cls.value} value={cls.value}>{cls.label}</option>
          ))}
        </select>
        <select
          value={filterSubjectType}
          onChange={(e) => setFilterSubjectType(e.target.value)}
          className="px-2 py-1 text-[11px] border border-gray-300 rounded-lg"
        >
          <option value="">All Types</option>
          <option value="theory">Theory</option>
          <option value="practical">Practical</option>
          <option value="both">Theory + Practical</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2 py-1 text-[11px] border border-gray-300 rounded-lg"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        {(searchTerm || filterClass || filterSubjectType || filterStatus) && (
          <button onClick={clearFilters} className="text-[11px] text-red-500 hover:text-red-700">Clear Filters ✕</button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border-y border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('class_name')}>
                Class {getSortIcon('class_name')}
              </th>
              <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                Subject Name {getSortIcon('name')}
              </th>
              <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Subject Code</th>
              <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Type</th>
              <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Max Marks</th>
              <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Passing Marks</th>
              <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Elective</th>
              <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('is_active')}>
                Status {getSortIcon('is_active')}
              </th>
              <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-[12px]">No subjects found</p>
                    <button onClick={openAddModal} className="mt-1 text-[12px] text-blue-600 hover:text-blue-700">Add your first subject</button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 text-[13px] font-medium text-gray-800">{getClassName(item.class_id)}</td>
                  <td className="px-3 py-2 text-[13px] text-gray-800">{item.name}</td>
                  <td className="px-3 py-2 text-[12px] text-gray-600">{item.code || '-'}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                      item.subject_type === 'theory' ? 'bg-blue-100 text-blue-700' :
                      item.subject_type === 'practical' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {getSubjectTypeLabel(item.subject_type)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[12px] text-gray-600">{item.max_marks}</td>
                  <td className="px-3 py-2 text-[12px] text-gray-600">{item.passing_marks}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[11px] ${item.is_elective ? 'text-orange-600' : 'text-gray-500'}`}>
                      {item.is_elective ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(item.id)}
                        className={`relative inline-flex h-5 w-8 items-center rounded-full transition-colors ${
                          item.is_active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          item.is_active ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                      </button>
                      <span className={`text-[10px] font-medium ${item.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEditModal(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2} /></svg>
                      </button>
                      <button onClick={() => handleDelete(item.id, item.name)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} /></svg>
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
        <div className="flex justify-end items-center px-4 py-3 gap-1.5">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2 py-0.5 border rounded disabled:opacity-50 text-[11px]">«</button>
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-2 py-0.5 border rounded disabled:opacity-50 text-[11px]">‹</button>
          <span className="text-[11px] text-gray-600">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-2 py-0.5 border rounded disabled:opacity-50 text-[11px]">›</button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-0.5 border rounded disabled:opacity-50 text-[11px]">»</button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-[15px] font-bold text-white">{editingItem ? 'Edit Subject' : 'Add New Subject'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white hover:bg-white/20 rounded p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} /></svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Class *</label>
                  <select name="class_id" value={formData.class_id} onChange={handleInputChange} className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg" required>
                    <option value="">Select Class</option>
                    {classes.map(cls => (<option key={cls.value} value={cls.value}>{cls.label}</option>))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">Subject Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Mathematics" className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">Subject Code</label>
                    <input type="text" name="code" value={formData.code} onChange={handleInputChange} placeholder="e.g., MATH101" className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Subject Type</label>
                  <select name="subject_type" value={formData.subject_type} onChange={handleInputChange} className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg">
                    {subjectTypeOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">Max Marks</label>
                    <input type="number" name="max_marks" value={formData.max_marks} onChange={handleInputChange} className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">Passing Marks</label>
                    <input type="number" name="passing_marks" value={formData.passing_marks} onChange={handleInputChange} className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" name="is_elective" checked={formData.is_elective} onChange={handleInputChange} className="w-3.5 h-3.5 text-blue-600 rounded" />
                    <span className="text-[12px] text-gray-700">Elective Subject</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="w-3.5 h-3.5 text-blue-600 rounded" />
                    <span className="text-[12px] text-gray-700">Active</span>
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1 text-[12px] border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-1 text-[12px] bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingItem ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-[15px] font-bold text-white">Import Subjects</h3>
                <button onClick={() => setIsImportModalOpen(false)} className="text-white hover:bg-white/20 rounded p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} /></svg>
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                <p className="text-[12px] text-blue-800"><strong>Total Records:</strong> {importData.length} | <strong>Preview:</strong></p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>{importPreview.length > 0 && Object.keys(importPreview[0]).map((key, idx) => (<th key={idx} className="px-2 py-1 border">{key}</th>))}</tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row, idx) => (<tr key={idx} className="border-t">{Object.values(row).map((val: any, colIdx) => (<td key={colIdx} className="px-2 py-1 border">{val}</td>))}</tr>))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button onClick={() => setIsImportModalOpen(false)} className="px-3 py-1 text-[12px] border rounded-lg">Cancel</button>
              <button onClick={processImport} disabled={importing} className="px-4 py-1 text-[12px] bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {importing ? 'Importing...' : 'Confirm Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManager;