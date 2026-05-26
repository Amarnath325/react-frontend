import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

interface SectionData {
  id: number;
  school_id: number;
  academic_year_id: number;
  class_id: number;
  section_name: string;
  capacity: number;
  class_teacher_id: number | null;
  is_active: boolean;
  class_name?: string;
  academic_year_label?: string;
}

interface MasterOption {
  value: number;
  label: string;
}

const SectionManager: React.FC = () => {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [filteredData, setFilteredData] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SectionData | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('');
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  
  // Sorting
  const [sortColumn, setSortColumn] = useState<string>('class_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Master data
  const [academicYears, setAcademicYears] = useState<MasterOption[]>([]);
  const [classes, setClasses] = useState<MasterOption[]>([]);
  const [teachers, setTeachers] = useState<MasterOption[]>([]);
  
  const [formData, setFormData] = useState({
    academic_year_id: '',
    class_id: '',
    section_name: '',
    capacity: 40,
    class_teacher_id: '',
    is_active: true,
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [sections, searchTerm, filterAcademicYear, filterClass, filterStatus, sortColumn, sortDirection]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSections(),
        fetchAcademicYears(),
        fetchClasses(),
        fetchTeachers(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await api.get('/school/sections');
      if (response.data.success) {
        setSections(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/school/academic-years');
      if (response.data.success) {
        const years = response.data.data.map((year: any) => ({
          value: year.id,
          label: year.name,
        }));
        setAcademicYears(years);
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
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

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/school/teachers');
      if (response.data.success) {
        const teachersData = response.data.data.map((teacher: any) => ({
          value: teacher.id,
          label: teacher.user?.first_name + ' ' + teacher.user?.last_name,
        }));
        setTeachers(teachersData);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...sections];

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.section_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.class_name && item.class_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterAcademicYear) {
      filtered = filtered.filter(item => item.academic_year_id.toString() === filterAcademicYear);
    }

    if (filterClass) {
      filtered = filtered.filter(item => item.class_id.toString() === filterClass);
    }

    if (filterStatus) {
      filtered = filtered.filter(item => item.is_active.toString() === filterStatus);
    }

    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof SectionData];
      let bVal: any = b[sortColumn as keyof SectionData];
      
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
    setFilterAcademicYear('');
    setFilterClass('');
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
      academic_year_id: academicYears[0]?.value.toString() || '',
      class_id: '',
      section_name: '',
      capacity: 40,
      class_teacher_id: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: SectionData) => {
    setEditingItem(item);
    setFormData({
      academic_year_id: item.academic_year_id.toString(),
      class_id: item.class_id.toString(),
      section_name: item.section_name,
      capacity: item.capacity,
      class_teacher_id: item.class_teacher_id?.toString() || '',
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.academic_year_id || !formData.class_id || !formData.section_name) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const submitData = {
        academic_year_id: parseInt(formData.academic_year_id),
        class_id: parseInt(formData.class_id),
        section_name: formData.section_name,
        capacity: formData.capacity,
        class_teacher_id: formData.class_teacher_id ? parseInt(formData.class_teacher_id) : null,
        is_active: formData.is_active,
      };

      if (editingItem) {
        const response = await api.put(`/school/sections/${editingItem.id}`, submitData);
        if (response.data.success) {
          toast.success('Section updated successfully');
        }
      } else {
        const response = await api.post('/school/sections', submitData);
        if (response.data.success) {
          toast.success('Section created successfully');
        }
      }
      setIsModalOpen(false);
      fetchSections();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete section "${name}"?`)) {
      try {
        const response = await api.delete(`/school/sections/${id}`);
        if (response.data.success) {
          toast.success('Section deleted successfully');
          fetchSections();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await api.patch(`/school/sections/${id}/toggle-status`);
      if (response.data.success) {
        toast.success('Section status updated');
        fetchSections();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const getAcademicYearLabel = (id: number) => {
    const year = academicYears.find(y => y.value === id);
    return year?.label || 'N/A';
  };

  const getClassName = (id: number) => {
    const cls = classes.find(c => c.value === id);
    return cls?.label || 'N/A';
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
        <h3 className="text-[15px] font-semibold text-gray-800">Sections Management</h3>
        <p className="text-[12px] text-gray-500">Manage class sections, capacity, and class teachers</p>
      </div>

      {/* Action Buttons and Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-gray-600">Search:</span>
            <input
              type="text"
              placeholder="Section or Class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-56 px-2 py-1 text-[12px] border border-gray-300 rounded-lg"
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
        <button onClick={openAddModal} className="flex items-center gap-1 px-3 py-1 text-[12px] bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth={2} /></svg>
          Add Section
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
        <select
          value={filterAcademicYear}
          onChange={(e) => setFilterAcademicYear(e.target.value)}
          className="px-2 py-1 text-[11px] border border-gray-300 rounded-lg"
        >
          <option value="">All Academic Years</option>
          {academicYears.map((year) => (
            <option key={year.value} value={year.value}>{year.label}</option>
          ))}
        </select>
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
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2 py-1 text-[11px] border border-gray-300 rounded-lg"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        {(searchTerm || filterAcademicYear || filterClass || filterStatus) && (
          <button onClick={clearFilters} className="text-[11px] text-red-500 hover:text-red-700">Clear Filters ✕</button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border-y border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700 cursor-pointer" onClick={() => handleSort('class_name')}>
                Class {getSortIcon('class_name')}
              </th>
              <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700 cursor-pointer" onClick={() => handleSort('section_name')}>
                Section {getSortIcon('section_name')}
              </th>
              <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Academic Year</th>
              <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Capacity</th>
              <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Class Teacher</th>
              <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700 cursor-pointer" onClick={() => handleSort('is_active')}>
                Status {getSortIcon('is_active')}
              </th>
              <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-[12px]">No sections found</p>
                    <button onClick={openAddModal} className="mt-1 text-[12px] text-blue-600 hover:text-blue-700">Add your first section</button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 text-[13px] font-medium text-gray-800">{getClassName(item.class_id)}</td>
                  <td className="px-3 py-2 text-[12px] text-gray-600">Section {item.section_name}</td>
                  <td className="px-3 py-2 text-[12px] text-gray-600">{getAcademicYearLabel(item.academic_year_id)}</td>
                  <td className="px-3 py-2 text-[12px] text-gray-600">{item.capacity} students</td>
                  <td className="px-3 py-2 text-[12px] text-gray-600">
                    {teachers.find(t => t.value === item.class_teacher_id)?.label || '-'}
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
                      <button onClick={() => handleDelete(item.id, `${getClassName(item.class_id)} - Section ${item.section_name}`)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
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
                <h3 className="text-[15px] font-bold text-white">{editingItem ? 'Edit Section' : 'Add New Section'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white hover:bg-white/20 rounded p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} /></svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Academic Year *</label>
                  <select name="academic_year_id" value={formData.academic_year_id} onChange={handleInputChange} className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg" required>
                    {academicYears.map(year => (<option key={year.value} value={year.value}>{year.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Class *</label>
                  <select name="class_id" value={formData.class_id} onChange={handleInputChange} className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg" required>
                    <option value="">Select Class</option>
                    {classes.map(cls => (<option key={cls.value} value={cls.value}>{cls.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Section Name *</label>
                  <input type="text" name="section_name" value={formData.section_name} onChange={handleInputChange} placeholder="e.g., A, B, C" className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Capacity</label>
                  <input type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Class Teacher (Optional)</label>
                  <select name="class_teacher_id" value={formData.class_teacher_id} onChange={handleInputChange} className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg">
                    <option value="">Select Teacher</option>
                    {teachers.map(teacher => (<option key={teacher.value} value={teacher.value}>{teacher.label}</option>))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="w-3.5 h-3.5 text-blue-600 rounded" />
                  <label htmlFor="is_active" className="text-[12px] text-gray-700">Active</label>
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
    </div>
  );
};

export default SectionManager;