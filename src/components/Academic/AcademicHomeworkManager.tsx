import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  BookOpen, Calendar, Edit3, Trash2, Plus, Search, 
  Filter, AlertCircle, RefreshCw, X, CheckCircle, CheckSquare
} from 'lucide-react';

interface HomeworkLog {
  id: number;
  title: string;
  className: string;
  sectionName: string;
  subjectName: string;
  dateAssigned: string;
  submissionDate: string;
  description: string;
  status: 'Published' | 'Evaluated';
  totalStudents: number;
  completedStudents: number;
}

const INITIAL_HOMEWORK: HomeworkLog[] = [
  {
    id: 1,
    title: 'Solve Quadratic Factorization Exercises',
    className: 'Class 10',
    sectionName: 'A',
    subjectName: 'Mathematics',
    dateAssigned: '2026-06-24',
    submissionDate: '2026-06-25',
    description: 'Solve questions 5 to 10 of exercise 4.1 in math notebook. Show step-by-step methods.',
    status: 'Published',
    totalStudents: 40,
    completedStudents: 28
  },
  {
    id: 2,
    title: 'Light Reflection Ray Diagram Practices',
    className: 'Class 10',
    sectionName: 'A',
    subjectName: 'Physics',
    dateAssigned: '2026-06-23',
    submissionDate: '2026-06-24',
    description: 'Draw ray diagrams for concave mirror object placements (Focus, Center of Curvature, Infinity).',
    status: 'Evaluated',
    totalStudents: 40,
    completedStudents: 38
  },
  {
    id: 3,
    title: 'Sentence correction & Direct speech practice',
    className: 'Class 9',
    sectionName: 'B',
    subjectName: 'English Literature',
    dateAssigned: '2026-06-24',
    submissionDate: '2026-06-26',
    description: 'Complete the sentences sheet uploaded in the study materials section yesterday.',
    status: 'Published',
    totalStudents: 35,
    completedStudents: 12
  }
];

const CLASSES = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
const SECTIONS = ['A', 'B', 'C'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'General Science', 'English Literature'];

export default function AcademicHomeworkManager() {
  const [homeworks, setHomeworks] = useState<HomeworkLog[]>(INITIAL_HOMEWORK);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState<HomeworkLog | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    className: CLASSES[0],
    sectionName: SECTIONS[0],
    subjectName: SUBJECTS[0],
    dateAssigned: new Date().toISOString().split('T')[0],
    submissionDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    description: '',
    status: 'Published' as 'Published' | 'Evaluated',
    totalStudents: 40,
    completedStudents: 0
  });

  const handleOpenAddModal = () => {
    setEditingHomework(null);
    setFormData({
      title: '',
      className: CLASSES[0],
      sectionName: SECTIONS[0],
      subjectName: SUBJECTS[0],
      dateAssigned: new Date().toISOString().split('T')[0],
      submissionDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      description: '',
      status: 'Published',
      totalStudents: 40,
      completedStudents: 0
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: HomeworkLog) => {
    setEditingHomework(item);
    setFormData({
      title: item.title,
      className: item.className,
      sectionName: item.sectionName,
      subjectName: item.subjectName,
      dateAssigned: item.dateAssigned,
      submissionDate: item.submissionDate,
      description: item.description,
      status: item.status,
      totalStudents: item.totalStudents,
      completedStudents: item.completedStudents
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this homework log record?')) {
      setHomeworks(prev => prev.filter(h => h.id !== id));
      toast.success('Homework entry removed');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill homework title and instructions');
      return;
    }

    if (new Date(formData.submissionDate) < new Date(formData.dateAssigned)) {
      toast.error('Submission date cannot be earlier than assigned date');
      return;
    }

    if (editingHomework) {
      // Edit
      setHomeworks(prev => prev.map(item => 
        item.id === editingHomework.id ? { ...item, ...formData } : item
      ));
      toast.success('Homework log updated');
    } else {
      // Add
      const newHW: HomeworkLog = {
        id: Date.now(),
        ...formData
      };
      setHomeworks(prev => [newHW, ...prev]);
      toast.success('Daily homework logged & notification sent to students');
    }

    setIsModalOpen(false);
  };

  const handleToggleEvaluate = (id: number) => {
    setHomeworks(prev => prev.map(h => {
      if (h.id === id) {
        const nextStatus = h.status === 'Published' ? 'Evaluated' : 'Published';
        return { 
          ...h, 
          status: nextStatus,
          completedStudents: nextStatus === 'Evaluated' ? h.totalStudents : h.completedStudents 
        };
      }
      return h;
    }));
    toast.success('Homework evaluation status updated');
  };

  const filteredHomeworks = homeworks.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subjectName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = selectedClass ? item.className === selectedClass : true;
    const matchesSubject = selectedSubject ? item.subjectName === selectedSubject : true;

    return matchesSearch && matchesClass && matchesSubject;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Daily Homework Tracker</h1>
          <p className="text-slate-500 mt-1 text-sm">Post daily classroom homework tasks, define completion deadlines, and review student progress.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="mt-4 md:mt-0 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Post Homework</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1 max-w-3xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by homework title, keyword..."
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
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white cursor-pointer"
          >
            <option value="">All Subjects</option>
            {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
          </select>
        </div>

        {(searchTerm || selectedClass || selectedSubject) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedClass('');
              setSelectedSubject('');
            }}
            className="text-sm font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-2 rounded-lg transition-all"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Homework Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredHomeworks.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200/80 rounded-xl py-16 text-center text-slate-500">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-600">No Homework Entries Logged</p>
          </div>
        ) : (
          filteredHomeworks.map(item => {
            const completionPercent = Math.round((item.completedStudents / item.totalStudents) * 100);
            return (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 space-y-4 hover:shadow-md transition-shadow">
                {/* Upper part */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-200">
                      {item.className} — Section {item.sectionName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block mt-1.5">{item.subjectName}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.status === 'Evaluated' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {item.status}
                  </span>
                </div>

                {/* Homework Title & Details */}
                <div>
                  <h3 className="font-bold text-slate-800 text-sm leading-snug">{item.title}</h3>
                  <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{item.description}</p>
                </div>

                {/* Dates Info */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] font-medium text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Assigned: {item.dateAssigned}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-400" />
                    <span>Due Date: {item.submissionDate}</span>
                  </div>
                </div>

                {/* Submission Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Submissions Checklist</span>
                    <span className="text-slate-850">{item.completedStudents} / {item.totalStudents} ({completionPercent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        completionPercent === 100 ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleEvaluate(item.id)}
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold text-xs transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{item.status === 'Published' ? 'Mark Evaluated' : 'Mark Published'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded-lg transition-all"
                      title="Edit Log"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                      title="Remove Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-lg">{editingHomework ? 'Edit Homework Entry' : 'Post Daily Homework'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Class/Grade</label>
                  <select
                    value={formData.className}
                    onChange={(e) => setFormData(prev => ({ ...prev, className: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:ring-blue-500"
                  >
                    {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Section</label>
                  <select
                    value={formData.sectionName}
                    onChange={(e) => setFormData(prev => ({ ...prev, sectionName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
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
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                >
                  {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Assigned Date</label>
                  <input
                    type="date"
                    value={formData.dateAssigned}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateAssigned: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={formData.submissionDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, submissionDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Homework Title</label>
                <input
                  type="text"
                  placeholder="e.g. Quadratic equations worksheet solution"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Instructions / Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe homework tasks clearly, e.g. formulas, notebooks, page reference..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2"
                />
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
                  {editingHomework ? 'Save Changes' : 'Publish Homework'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
