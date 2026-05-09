import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface FeeStructure {
  id: number;
  class_name: string;
  fee_head: string;
  amount: number;
  frequency: string;
}

const FeeStructureManager: React.FC = () => {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FeeStructure | null>(null);
  const [formData, setFormData] = useState({
    class_name: '',
    fee_head: '',
    amount: 0,
    frequency: 'monthly',
  });

  // Fetch all fee structures
  const fetchFeeStructures = async () => {
    setLoading(true);
    try {
      const response = await api.get('/school/fee-structures');
      if (response.data.success) {
        setFeeStructures(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching fee structures:', error);
      toast.error('Failed to load fee structures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeStructures();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) : value }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ class_name: '', fee_head: '', amount: 0, frequency: 'monthly' });
    setIsModalOpen(true);
  };

  const openEditModal = (item: FeeStructure) => {
    setEditingItem(item);
    setFormData({
      class_name: item.class_name,
      fee_head: item.fee_head,
      amount: item.amount,
      frequency: item.frequency,
    });
    setIsModalOpen(true);
  };

  // Create fee structure
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.class_name || !formData.fee_head || formData.amount <= 0) {
      toast.error('Please fill all fields correctly');
      return;
    }

    try {
      const response = await api.post('/school/fee-structures', formData);
      if (response.data.success) {
        toast.success('Fee structure added successfully');
        setIsModalOpen(false);
        fetchFeeStructures();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add');
    }
  };

  // Update fee structure
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.class_name || !formData.fee_head || formData.amount <= 0) {
      toast.error('Please fill all fields correctly');
      return;
    }

    try {
      const response = await api.put(`/school/fee-structures/${editingItem?.id}`, formData);
      if (response.data.success) {
        toast.success('Fee structure updated successfully');
        setIsModalOpen(false);
        fetchFeeStructures();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update');
    }
  };

  // Delete fee structure
  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const response = await api.delete(`/school/fee-structures/${id}`);
        if (response.data.success) {
          toast.success('Fee structure deleted successfully');
          fetchFeeStructures();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleSubmit = editingItem ? handleUpdate : handleCreate;

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      half_yearly: 'Half Yearly',
      yearly: 'Yearly',
      one_time: 'One Time',
    };
    return labels[frequency] || frequency;
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
        <h3 className="text-lg font-semibold text-gray-800">Fee Structure Management</h3>
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
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Class Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Fee Head</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Frequency</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {feeStructures.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                  No fee structures added yet
                  <button onClick={openAddModal} className="ml-2 text-blue-600 hover:text-blue-700">
                    Click here to add
                  </button>
                </td>
              </tr>
            ) : (
              feeStructures.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">{item.class_name}</td>
                  <td className="px-4 py-3 text-gray-800">{item.fee_head}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">₹{item.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                      {getFrequencyLabel(item.frequency)}
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
                        onClick={() => handleDelete(item.id, `${item.class_name} - ${item.fee_head}`)}
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
                {editingItem ? 'Edit Fee Structure' : 'Add New Fee Structure'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
                <input
                  type="text"
                  name="class_name"
                  value={formData.class_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Class 1, Class 2, Nursery"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Head *</label>
                <input
                  type="text"
                  name="fee_head"
                  value={formData.fee_head}
                  onChange={handleInputChange}
                  placeholder="e.g., Tuition Fee, Admission Fee"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half_yearly">Half Yearly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one_time">One Time</option>
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

export default FeeStructureManager;