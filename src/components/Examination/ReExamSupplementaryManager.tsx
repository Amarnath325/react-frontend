import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  AlertCircle, Plus, Search, Trash2, Edit3, 
  CheckCircle, RefreshCw, X, Play, ShieldAlert, CheckSquare
} from 'lucide-react';

interface SuppStudent {
  id: number;
  studentName: string;
  rollNo: string;
  className: string;
  subjectFailed: string;
  suppDate: string;
  originalMarks: string;
  suppMarks: string;
  status: 'Registered' | 'Cleared' | 'Failed';
}

const INITIAL_SUPP: SuppStudent[] = [
  { id: 1, studentName: 'Rahul Verma', rollNo: '10-A-15', className: 'Class 10', subjectFailed: 'Mathematics', suppDate: '2026-07-10', originalMarks: '22/100', suppMarks: '', status: 'Registered' },
  { id: 2, studentName: 'Aditya Sen', rollNo: '10-A-01', className: 'Class 10', subjectFailed: 'Chemistry', suppDate: '2026-07-11', originalMarks: '28/100', suppMarks: '45', status: 'Cleared' }
];

const CLASSES = ['Class 10', 'Class 9', 'Class 8'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'English', 'Social Science'];

export default function ReExamSupplementaryManager() {
  const [supps, setSupps] = useState<SuppStudent[]>(INITIAL_SUPP);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<SuppStudent | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    studentName: '',
    rollNo: '',
    className: CLASSES[0],
    subjectFailed: SUBJECTS[0],
    suppDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], // 5 days later
    originalMarks: '25/100',
    suppMarks: '',
    status: 'Registered' as 'Registered' | 'Cleared' | 'Failed'
  });

  // Grade Input State
  const [gradeInput, setGradeInput] = useState('');

  const handleOpenAddModal = () => {
    setFormData({
      studentName: '',
      rollNo: '',
      className: CLASSES[0],
      subjectFailed: SUBJECTS[0],
      suppDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      originalMarks: '25/100',
      suppMarks: '',
      status: 'Registered'
    });
    setIsModalOpen(true);
  };

  const handleCreateSupp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName.trim() || !formData.rollNo.trim()) {
      toast.error('Student name and roll number are required');
      return;
    }

    const newSupp: SuppStudent = {
      id: Date.now(),
      ...formData
    };

    setSupps(prev => [newSupp, ...prev]);
    toast.success('Student registered for supplementary examination');
    setIsModalOpen(false);
  };

  const handleOpenGrading = (item: SuppStudent) => {
    setActiveItem(item);
    setGradeInput(item.suppMarks);
    setIsGradeModalOpen(true);
  };

  const handleSaveGrades = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    
    const marksNum = Number(gradeInput);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
      toast.error('Marks must be between 0 and 100');
      return;
    }

    const nextStatus = marksNum >= 33 ? 'Cleared' : 'Failed';

    setSupps(prev => prev.map(s => {
      if (s.id === activeItem.id) {
        return {
          ...s,
          suppMarks: gradeInput,
          status: nextStatus
        };
      }
      return s;
    }));

    toast.success('Supplementary scores updated');
    setIsGradeModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Remove this supplementary registration?')) {
      setSupps(prev => prev.filter(item => item.id !== id));
      toast.success('Registration removed');
    }
  };

  const filteredSupps = supps.filter(item => {
    const matchesSearch = 
      item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subjectFailed.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass ? item.className === selectedClass : true;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Re-Exam & Supplementary Panel</h1>
          <p className="text-slate-500 mt-1 text-sm">Register failed candidates, schedule improvement tests and record clearing scores.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="mt-4 md:mt-0 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Register Candidate</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1 max-w-3xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by candidate name, subject..."
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
        </div>

        {selectedClass && (
          <button
            onClick={() => setSelectedClass('')}
            className="text-sm font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-2 rounded-lg transition-all"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Grid of registered supps */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Candidate Detail</th>
                <th className="py-4 px-6">Target Subject</th>
                <th className="py-4 px-6 text-center">Original Score</th>
                <th className="py-4 px-6 text-center">Supp Score (100)</th>
                <th className="py-4 px-6">Supp Exam Date</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredSupps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No supplementary candidates listed.
                  </td>
                </tr>
              ) : (
                filteredSupps.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{item.studentName}</div>
                      <div className="text-xs text-slate-400">{item.className} — Roll {item.rollNo}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-800 font-semibold">{item.subjectFailed}</td>
                    <td className="py-4 px-6 text-center font-semibold text-rose-500">{item.originalMarks}</td>
                    <td className="py-4 px-6 text-center font-bold text-slate-900">{item.suppMarks || '—'}</td>
                    <td className="py-4 px-6 font-semibold text-slate-600">{item.suppDate}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.status === 'Cleared' ? 'bg-green-50 text-green-700 border border-green-200' :
                        item.status === 'Failed' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenGrading(item)}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded transition-all"
                        >
                          Enter Score
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
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

      {/* Register Candidate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-lg">Register Candidate for Re-Exam</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupp} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Candidate Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Verma"
                    value={formData.studentName}
                    onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Roll Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 10-A-15"
                    value={formData.rollNo}
                    onChange={(e) => setFormData(prev => ({ ...prev, rollNo: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Failed Subject</label>
                  <select
                    value={formData.subjectFailed}
                    onChange={(e) => setFormData(prev => ({ ...prev, subjectFailed: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Original Score</label>
                  <input
                    type="text"
                    placeholder="e.g. 22/100"
                    value={formData.originalMarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, originalMarks: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Supplementary Exam Date</label>
                  <input
                    type="date"
                    value={formData.suppDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, suppDate: e.target.value }))}
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
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enter score modal */}
      {isGradeModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-lg">Enter Supplementary Score</h3>
              <button onClick={() => setIsGradeModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrades} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border text-xs text-slate-500 space-y-1">
                <div>Candidate Name: <strong className="text-slate-800">{activeItem.studentName}</strong></div>
                <div>Class/Subject: <span className="font-semibold text-slate-700">{activeItem.className} — {activeItem.subjectFailed}</span></div>
                <div>Original Marks: <span className="font-bold text-rose-500">{activeItem.originalMarks}</span></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Supplementary Score (Max: 100)</label>
                <input
                  type="text"
                  placeholder="e.g. 45"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsGradeModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md font-semibold text-xs"
                >
                  Record Marks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
