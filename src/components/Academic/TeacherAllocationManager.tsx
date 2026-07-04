import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  Users, BookOpen, Clock, MapPin, Search, Plus, Trash2, Edit3, 
  Filter, CheckCircle, RefreshCw, AlertCircle, X, Check, CheckSquare
} from 'lucide-react';

interface Allocation {
  id: number;
  className: string;
  sectionName: string;
  subjectName: string;
  teacherName: string;
  periodsPerWeek: number;
  roomNo: string;
  status: 'Active' | 'Inactive';
}

const INITIAL_ALLOCATIONS: Allocation[] = [
  { id: 1, className: 'Class 10', sectionName: 'A', subjectName: 'Mathematics', teacherName: 'Mr. Rajesh Sharma', periodsPerWeek: 6, roomNo: 'Room 302', status: 'Active' },
  { id: 2, className: 'Class 10', sectionName: 'A', subjectName: 'Physics', teacherName: 'Dr. Sunita Verma', periodsPerWeek: 4, roomNo: 'Physics Lab', status: 'Active' },
  { id: 3, className: 'Class 9', sectionName: 'B', subjectName: 'English Literature', teacherName: 'Mrs. Emily D\'souza', periodsPerWeek: 5, roomNo: 'Room 204', status: 'Active' },
  { id: 4, className: 'Class 8', sectionName: 'A', subjectName: 'General Science', teacherName: 'Mr. Amit Patel', periodsPerWeek: 5, roomNo: 'Room 101', status: 'Active' },
  { id: 5, className: 'Class 11', sectionName: 'Sci-A', subjectName: 'Chemistry', teacherName: 'Dr. Sunita Verma', periodsPerWeek: 6, roomNo: 'Chemistry Lab', status: 'Active' },
  { id: 6, className: 'Class 12', sectionName: 'Com-B', subjectName: 'Accountancy', teacherName: 'Mr. Sanjay Mehta', periodsPerWeek: 6, roomNo: 'Room 403', status: 'Inactive' }
];

const TEACHERS = [
  'Mr. Rajesh Sharma', 'Dr. Sunita Verma', 'Mrs. Emily D\'souza', 'Mr. Amit Patel', 'Mr. Sanjay Mehta', 'Mrs. Anjali Rao'
];

const CLASSES = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
const SECTIONS = ['A', 'B', 'C', 'Sci-A', 'Com-B'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'General Science', 'English Literature', 'Accountancy', 'Economics'];

export default function TeacherAllocationManager() {
  const [allocations, setAllocations] = useState<Allocation[]>(INITIAL_ALLOCATIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Allocation | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    className: '',
    sectionName: '',
    subjectName: '',
    teacherName: '',
    periodsPerWeek: 4,
    roomNo: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      className: CLASSES[0],
      sectionName: SECTIONS[0],
      subjectName: SUBJECTS[0],
      teacherName: TEACHERS[0],
      periodsPerWeek: 4,
      roomNo: '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Allocation) => {
    setEditingItem(item);
    setFormData({
      className: item.className,
      sectionName: item.sectionName,
      subjectName: item.subjectName,
      teacherName: item.teacherName,
      periodsPerWeek: item.periodsPerWeek,
      roomNo: item.roomNo,
      status: item.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to remove this allocation?')) {
      setAllocations(prev => prev.filter(item => item.id !== id));
      toast.success('Teacher allocation removed successfully');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roomNo.trim()) {
      toast.error('Please enter a room number or lab name');
      return;
    }

    // Check for conflict: same teacher, same class/section, or double booked teacher
    const isConflict = allocations.some(alloc => {
      if (editingItem && alloc.id === editingItem.id) return false;
      return (
        alloc.className === formData.className &&
        alloc.sectionName === formData.sectionName &&
        alloc.subjectName === formData.subjectName
      );
    });

    if (isConflict) {
      toast.error('Conflict detected: This subject is already allocated to this class and section.');
      return;
    }

    if (editingItem) {
      // Edit
      setAllocations(prev => prev.map(item => 
        item.id === editingItem.id ? { ...item, ...formData } : item
      ));
      toast.success('Allocation updated successfully');
    } else {
      // Add
      const newAllocation: Allocation = {
        id: allocations.length > 0 ? Math.max(...allocations.map(a => a.id)) + 1 : 1,
        ...formData
      };
      setAllocations(prev => [newAllocation, ...prev]);
      toast.success('Teacher allocation created successfully');
    }

    setIsModalOpen(false);
  };

  const filteredAllocations = allocations.filter(item => {
    const matchesSearch = 
      item.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.roomNo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = selectedClass ? item.className === selectedClass : true;
    const matchesTeacher = selectedTeacher ? item.teacherName === selectedTeacher : true;

    return matchesSearch && matchesClass && matchesTeacher;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Teacher Subject Allocation</h1>
          <p className="text-slate-500 mt-1 text-sm">Assign subjects, sections, and classroom responsibilities to teaching staff.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="mt-4 md:mt-0 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Allocate Subject Teacher</span>
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1 max-w-3xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by teacher, subject, room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 bg-slate-50/50"
            />
          </div>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="">All Classes</option>
            {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>

          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="">All Teachers</option>
            {TEACHERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {(searchTerm || selectedClass || selectedTeacher) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedClass('');
              setSelectedTeacher('');
            }}
            className="text-sm font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-2 rounded-lg transition-all"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Allocations Table Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Class & Section</th>
                <th className="py-4 px-6">Subject</th>
                <th className="py-4 px-6">Assigned Teacher</th>
                <th className="py-4 px-6">Periods / Week</th>
                <th className="py-4 px-6">Classroom / Lab</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredAllocations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="w-10 h-10 text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600">No Teacher Allocations Found</p>
                      <p className="text-xs text-slate-400 mt-1">Try resetting the filter criteria or add a new allocation.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAllocations.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{item.className}</div>
                      <div className="text-xs text-slate-400">Section {item.sectionName}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-slate-800">{item.subjectName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-700">{item.teacherName}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{item.periodsPerWeek} periods</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{item.roomNo}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Allocation"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Allocation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-lg">{editingItem ? 'Edit Teacher Allocation' : 'Create Teacher Allocation'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Class</label>
                  <select
                    value={formData.className}
                    onChange={(e) => setFormData(prev => ({ ...prev, className: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Section</label>
                  <select
                    value={formData.sectionName}
                    onChange={(e) => setFormData(prev => ({ ...prev, sectionName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {SECTIONS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Subject</label>
                <select
                  value={formData.subjectName}
                  onChange={(e) => setFormData(prev => ({ ...prev, subjectName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Subject Teacher</label>
                <select
                  value={formData.teacherName}
                  onChange={(e) => setFormData(prev => ({ ...prev, teacherName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {TEACHERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Periods / Week</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={formData.periodsPerWeek}
                    onChange={(e) => setFormData(prev => ({ ...prev, periodsPerWeek: parseInt(e.target.value) || 4 }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Room / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 302 or Physics Lab"
                    value={formData.roomNo}
                    onChange={(e) => setFormData(prev => ({ ...prev, roomNo: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Allocation Status</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.status === 'Active'}
                      onChange={() => setFormData(prev => ({ ...prev, status: 'Active' }))}
                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.status === 'Inactive'}
                      onChange={() => setFormData(prev => ({ ...prev, status: 'Inactive' }))}
                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Inactive</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-md transition-all font-semibold text-sm"
                >
                  {editingItem ? 'Save Changes' : 'Create Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
