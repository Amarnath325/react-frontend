import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

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
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${checked ? 'bg-green-500' : 'bg-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
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
  status: number;
  school_id?: number;
  created_at?: string;
  updated_at?: string;
}

interface AcademicYearManagerProps {
  onClose: () => void;
}

const AcademicYearManager: React.FC<AcademicYearManagerProps> = ({ onClose }) => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
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

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    setLoading(true);
    try {
      const response = await api.get('/school/academic-years');
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

  // Optimized toggle function - only updates the specific year without full reload
  const handleToggleCurrent = async (id: number, isCurrentlyCurrent: boolean) => {
    if (isCurrentlyCurrent) {
      toast.error('This is already the current academic year');
      return;
    }
    
    setUpdatingId(id); // Show loading state on this toggle
    
    try {
      const response = await api.post(`/school/academic-years/${id}/set-current`);
      if (response.data.success) {
        toast.success('Current academic year updated successfully');
        
        // Update local state without reloading entire list
        setAcademicYears(prevYears => {
          // First, set all years to is_current = false
          const updatedYears = prevYears.map(year => ({
            ...year,
            is_current: false,
            status: 0
          }));
          
          // Then set the selected year to is_current = true
          return updatedYears.map(year => 
            year.id === id 
              ? { ...year, is_current: true, status: 1 }
              : year
          );
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update');
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
      
      // Refresh the list after add/edit
      const fetchResponse = await api.get('/school/academic-years');
      if (fetchResponse.data.success) {
        const years = fetchResponse.data.data.map((year: AcademicYear) => ({
          ...year,
          start_date: year.start_date ? formatDateForInput(year.start_date) : '',
          end_date: year.end_date ? formatDateForInput(year.end_date) : '',
        }));
        setAcademicYears(years);
      }
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
          // Remove from local state
          setAcademicYears(prev => prev.filter(year => year.id !== id));
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Academic Years</h3>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New
        </button>
      </div>

      {/* Academic Years List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {academicYears.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No academic years added yet</p>
            <button onClick={openAddModal} className="mt-2 text-blue-600 hover:text-blue-700">
              Click here to add your first academic year
            </button>
          </div>
        ) : (
          academicYears.map((year) => (
            <div
              key={year.id}
              className="flex items-center justify-between p-4 border rounded-lg transition-all bg-white hover:shadow-md"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-gray-800">{year.name}</p>
                  {year.is_current && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  📅 {formatDate(year.start_date)} to {formatDate(year.end_date)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Toggle Switch for Current Status */}
                <div className="flex items-center gap-2">
                  <ToggleSwitch
                    checked={year.is_current}
                    onChange={() => handleToggleCurrent(year.id, year.is_current)}
                    disabled={year.is_current || updatingId === year.id}
                  />
                  {updatingId === year.id && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                
                {/* Edit Button */}
                <button
                  onClick={() => openEditModal(year)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Edit"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                
                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(year.id, year.name)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editingYear ? 'Edit Academic Year' : 'Add New Academic Year'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* SESSION YEAR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* START DATE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* END DATE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Toggle Switch for Current Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Set as Current Academic Year
                  </label>
                  <p className="text-xs text-gray-500">
                    {isCurrent ? 'This will be the active academic year' : 'Mark as current academic year'}
                  </p>
                </div>
                <ToggleSwitch
                  checked={isCurrent}
                  onChange={setIsCurrent}
                />
              </div>

              {/* BUTTONS */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingYear ? "Update" : "Add"} Academic Year
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicYearManager;