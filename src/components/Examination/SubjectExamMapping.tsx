import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  BookOpen, Award, ShieldAlert, Plus, Search, Trash2, Edit3, 
  Filter, CheckCircle, RefreshCw, X, Check, CheckSquare
} from 'lucide-react';

interface ExamSubjectMap {
  id: number;
  className: string;
  examTypeName: string;
  subjectName: string;
  maxMarks: number;
  passingMarks: number;
  weightagePercent: number; // weightage in overall result (e.g., 20%, 50%)
}

const INITIAL_MAPPINGS: ExamSubjectMap[] = [
  { id: 1, className: 'Class 10', examTypeName: 'Half Yearly Examination', subjectName: 'Mathematics', maxMarks: 80, passingMarks: 26, weightagePercent: 30 },
  { id: 2, className: 'Class 10', examTypeName: 'Half Yearly Examination', subjectName: 'Physics', maxMarks: 70, passingMarks: 23, weightagePercent: 30 },
  { id: 3, className: 'Class 10', examTypeName: 'Final Annual Examination', subjectName: 'Mathematics', maxMarks: 100, passingMarks: 33, weightagePercent: 50 },
  { id: 4, className: 'Class 9', examTypeName: 'Quarterly Examination', subjectName: 'English Literature', maxMarks: 50, passingMarks: 17, weightagePercent: 20 },
  { id: 5, className: 'Class 11', examTypeName: 'Final Annual Examination', subjectName: 'Chemistry', maxMarks: 70, passingMarks: 23, weightagePercent: 60 }
];

const CLASSES = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
const EXAM_TYPES = ['Quarterly Examination', 'Half Yearly Examination', 'Final Annual Examination', 'Pre-Board Examination'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'General Science', 'English Literature', 'Accountancy'];

export default function SubjectExamMapping() {
  const [mappings, setMappings] = useState<ExamSubjectMap[]>(INITIAL_MAPPINGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExamSubjectMap | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    className: CLASSES[0],
    examTypeName: EXAM_TYPES[0],
    subjectName: SUBJECTS[0],
    maxMarks: 100,
    passingMarks: 33,
    weightagePercent: 30
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      className: CLASSES[0],
      examTypeName: EXAM_TYPES[0],
      subjectName: SUBJECTS[0],
      maxMarks: 100,
      passingMarks: 33,
      weightagePercent: 30
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ExamSubjectMap) => {
    setEditingItem(item);
    setFormData({
      className: item.className,
      examTypeName: item.examTypeName,
      subjectName: item.subjectName,
      maxMarks: item.maxMarks,
      passingMarks: item.passingMarks,
      weightagePercent: item.weightagePercent
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to remove this subject exam mapping?')) {
      setMappings(prev => prev.filter(item => item.id !== id));
      toast.success('Mapping removed successfully');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.passingMarks > formData.maxMarks) {
      toast.error('Passing marks cannot be greater than maximum marks.');
      return;
    }
    if (formData.weightagePercent < 0 || formData.weightagePercent > 100) {
      toast.error('Weightage percentage must be between 0 and 100.');
      return;
    }

    // Check conflict: same class, same exam, same subject
    const isConflict = mappings.some(map => {
      if (editingItem && map.id === editingItem.id) return false;
      return (
        map.className === formData.className &&
        map.examTypeName === formData.examTypeName &&
        map.subjectName === formData.subjectName
      );
    });

    if (isConflict) {
      toast.error('Conflict detected: This subject is already mapped for this exam in this class.');
      return;
    }

    if (editingItem) {
      // Edit
      setMappings(prev => prev.map(item => 
        item.id === editingItem.id ? { ...item, ...formData } : item
      ));
      toast.success('Mapping updated successfully');
    } else {
      // Add
      const newMap: ExamSubjectMap = {
        id: Date.now(),
        ...formData
      };
      setMappings(prev => [newMap, ...prev]);
      toast.success('Subject exam mapping created successfully');
    }

    setIsModalOpen(false);
  };

  const filteredMappings = mappings.filter(item => {
    const matchesSearch = 
      item.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.examTypeName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = selectedClass ? item.className === selectedClass : true;
    const matchesExamType = selectedExamType ? item.examTypeName === selectedExamType : true;

    return matchesSearch && matchesClass && matchesExamType;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Subject Exam Mapping</h1>
          <p className="text-slate-500 mt-1 text-sm">Configure marks targets, passing requirements and final weightage values subject-wise.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="mt-4 md:mt-0 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Add Subject Map</span>
        </button>
      </div>

      {/* Filter Card */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1 max-w-3xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by subject, exam type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50"
            />
          </div>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white cursor-pointer"
          >
            <option value="">All Classes</option>
            {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>

          <select
            value={selectedExamType}
            onChange={(e) => setSelectedExamType(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white cursor-pointer"
          >
            <option value="">All Exam Types</option>
            {EXAM_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        {(searchTerm || selectedClass || selectedExamType) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedClass('');
              setSelectedExamType('');
            }}
            className="text-sm font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-2 rounded-lg transition-all"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Grid mappings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Class / Subject</th>
                <th className="py-4 px-6">Mapped Exam Type</th>
                <th className="py-4 px-6 text-center">Max Marks</th>
                <th className="py-4 px-6 text-center">Passing Marks</th>
                <th className="py-4 px-6 text-center">Report Weightage</th>
                <th className="py-4 px-6 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredMappings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <ShieldAlert className="w-10 h-10 text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600">No Mappings Configured</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMappings.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{item.className}</div>
                      <div className="text-xs text-slate-400">{item.subjectName}</div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800">{item.examTypeName}</td>
                    <td className="py-4 px-6 text-center font-bold text-slate-700">{item.maxMarks}</td>
                    <td className="py-4 px-6 text-center font-semibold text-slate-700">{item.passingMarks}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-block bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold border border-indigo-150">
                        {item.weightagePercent}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Map"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Map"
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
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-lg">{editingItem ? 'Edit Subject Exam Map' : 'Add Subject Exam Mapping'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Class/Grade</label>
                  <select
                    value={formData.className}
                    onChange={(e) => setFormData(prev => ({ ...prev, className: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Subject</label>
                  <select
                    value={formData.subjectName}
                    onChange={(e) => setFormData(prev => ({ ...prev, subjectName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Exam Type</label>
                <select
                  value={formData.examTypeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, examTypeName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                >
                  {EXAM_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Max Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxMarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxMarks: parseInt(e.target.value) || 100 }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Passing Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.passingMarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, passingMarks: parseInt(e.target.value) || 33 }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Weightage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.weightagePercent}
                    onChange={(e) => setFormData(prev => ({ ...prev, weightagePercent: parseInt(e.target.value) || 30 }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

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
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md font-semibold text-sm hover:from-blue-700 hover:to-indigo-700"
                >
                  {editingItem ? 'Save Changes' : 'Create Mapping'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
