import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Examination {
  id: number;
  exam_name: string;
  exam_type: string;
  max_marks: number;
  passing_marks: number;
  term: string;
}

const ExaminationManager: React.FC = () => {
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Examination | null>(null);
  const [formData, setFormData] = useState({
    exam_name: '',
    exam_type: 'quarterly',
    max_marks: 100,
    passing_marks: 33,
    term: 'first',
  });

  // Fetch all examinations
  const fetchExaminations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/school/examinations');
      if (response.data.success) {
        setExaminations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching examinations:', error);
      toast.error('Failed to load examinations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExaminations();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'max_marks' || name === 'passing_marks' ? parseInt(value) : value 
    }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ exam_name: '', exam_type: 'quarterly', max_marks: 100, passing_marks: 33, term: 'first' });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Examination) => {
    setEditingItem(item);
    setFormData({
      exam_name: item.exam_name,
      exam_type: item.exam_type,
      max_marks: item.max_marks,
      passing_marks: item.passing_marks,
      term: item.term,
    });
    setIsModalOpen(true);
  };

  // Create examination
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.exam_name) {
      toast.error('Please fill exam name');
      return;
    }

    if (formData.passing_marks > formData.max_marks) {
      toast.error('Passing marks cannot be greater than max marks');
      return;
    }

    try {
      const response = await api.post('/school/examinations', formData);
      if (response.data.success) {
        toast.success('Examination added successfully');
        setIsModalOpen(false);
        fetchExaminations();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add');
    }
  };

  // Update examination
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.exam_name) {
      toast.error('Please fill exam name');
      return;
    }

    if (formData.passing_marks > formData.max_marks) {
      toast.error('Passing marks cannot be greater than max marks');
      return;
    }

    try {
      const response = await api.put(`/school/examinations/${editingItem?.id}`, formData);
      if (response.data.success) {
        toast.success('Examination updated successfully');
        setIsModalOpen(false);
        fetchExaminations();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update');
    }
  };

  // Delete examination
  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const response = await api.delete(`/school/examinations/${id}`);
        if (response.data.success) {
          toast.success('Examination deleted successfully');
          fetchExaminations();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleSubmit = editingItem ? handleUpdate : handleCreate;

  const getExamTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      quarterly: 'Quarterly',
      half_yearly: 'Half Yearly',
      annual: 'Annual',
      weekly_test: 'Weekly Test',
      pre_board: 'Pre Board',
    };
    return labels[type] || type;
  };

  const getTermLabel = (term: string) => {
    const labels: Record<string, string> = {
      first: 'First Term',
      second: 'Second Term',
      third: 'Third Term',
      final: 'Final Term',
    };
    return labels[term] || term;
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
        <h3 className="text-lg font-semibold text-gray-800">Examination System Management</h3>
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Exam Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Exam Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Max Marks</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Passing Marks</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Term</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {examinations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  No examinations added yet
                  <button onClick={openAddModal} className="ml-2 text-blue-600 hover:text-blue-700">
                    Click here to add
                  </button>
                </td>
              </tr>
            ) : (
              examinations.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800 font-medium">{item.exam_name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                      {getExamTypeLabel(item.exam_type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{item.max_marks}</td>
                  <td className="px-4 py-3 text-gray-800">{item.passing_marks}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                      {getTermLabel(item.term)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.exam_name)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editingItem ? 'Edit Examination' : 'Add New Examination'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name *</label>
                <input
                  type="text"
                  name="exam_name"
                  value={formData.exam_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Mid Term Examination"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type *</label>
                <select
                  name="exam_type"
                  value={formData.exam_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="quarterly">Quarterly</option>
                  <option value="half_yearly">Half Yearly</option>
                  <option value="annual">Annual</option>
                  <option value="weekly_test">Weekly Test</option>
                  <option value="pre_board">Pre Board</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks *</label>
                  <input
                    type="number"
                    name="max_marks"
                    value={formData.max_marks}
                    onChange={handleInputChange}
                    min="1"
                    max="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passing Marks *</label>
                  <input
                    type="number"
                    name="passing_marks"
                    value={formData.passing_marks}
                    onChange={handleInputChange}
                    min="0"
                    max={formData.max_marks}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term *</label>
                <select
                  name="term"
                  value={formData.term}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="first">First Term</option>
                  <option value="second">Second Term</option>
                  <option value="third">Third Term</option>
                  <option value="final">Final Term</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingItem ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExaminationManager;