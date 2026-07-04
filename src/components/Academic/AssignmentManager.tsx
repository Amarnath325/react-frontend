import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  Award, FileText, Calendar, Edit3, Trash2, Plus, Search, 
  Eye, Check, X, AlertCircle, RefreshCw, Star, CheckSquare
} from 'lucide-react';

interface StudentSubmission {
  id: number;
  studentName: string;
  rollNo: string;
  submittedFile: string;
  submittedDate: string;
  marksObtained?: number;
  feedback?: string;
  status: 'Submitted' | 'Graded' | 'Pending';
}

interface Assignment {
  id: number;
  title: string;
  className: string;
  subjectName: string;
  maxMarks: number;
  passingMarks: number;
  dueDate: string;
  instructions: string;
  submissions: StudentSubmission[];
}

const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 1,
    title: 'Trigonometric Identities & Applications Project',
    className: 'Class 10',
    subjectName: 'Mathematics',
    maxMarks: 50,
    passingMarks: 20,
    dueDate: '2026-06-28',
    instructions: 'Prepare a booklet outlining real-world applications of heights and distances with neat illustrations.',
    submissions: [
      { id: 101, studentName: 'Aditya Sen', rollNo: '10-A-01', submittedFile: 'Trigo_Heights_Proj_Aditya.pdf', submittedDate: '2026-06-25', status: 'Submitted' },
      { id: 102, studentName: 'Neha Sharma', rollNo: '10-A-08', submittedFile: 'Trigo_Applications_Neha.pdf', submittedDate: '2026-06-24', marksObtained: 48, feedback: 'Excellent practical research and colorful sketches.', status: 'Graded' },
      { id: 103, studentName: 'Rahul Verma', rollNo: '10-A-15', submittedFile: '', submittedDate: '', status: 'Pending' }
    ]
  },
  {
    id: 2,
    title: 'Electric Motor Working Model Lab Report',
    className: 'Class 10',
    subjectName: 'Physics',
    maxMarks: 20,
    passingMarks: 8,
    dueDate: '2026-06-30',
    instructions: 'Write down step-by-step experiment details of constructing a simple electric motor with circuit diagrams.',
    submissions: [
      { id: 201, studentName: 'Aarav Gupta', rollNo: '10-A-05', submittedFile: 'Electric_Motor_Aarav.pdf', submittedDate: '2026-06-25', status: 'Submitted' }
    ]
  }
];

const CLASSES = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'General Science', 'English Literature'];

export default function AssignmentManager() {
  const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [activeSubmission, setActiveSubmission] = useState<StudentSubmission | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    className: CLASSES[0],
    subjectName: SUBJECTS[0],
    maxMarks: 50,
    passingMarks: 17,
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 days later
    instructions: ''
  });

  // Grading Form State
  const [gradingForm, setGradingForm] = useState({
    marksObtained: 0,
    feedback: ''
  });

  const handleOpenAddModal = () => {
    setFormData({
      title: '',
      className: CLASSES[0],
      subjectName: SUBJECTS[0],
      maxMarks: 50,
      passingMarks: 17,
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      instructions: ''
    });
    setIsModalOpen(true);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.instructions.trim()) {
      toast.error('Please enter assignment details');
      return;
    }

    if (formData.passingMarks > formData.maxMarks) {
      toast.error('Passing marks cannot be greater than maximum marks');
      return;
    }

    const newAssignment: Assignment = {
      id: Date.now(),
      ...formData,
      submissions: [
        { id: 1, studentName: 'Demo Student 1', rollNo: '01', submittedFile: '', submittedDate: '', status: 'Pending' },
        { id: 2, studentName: 'Demo Student 2', rollNo: '02', submittedFile: '', submittedDate: '', status: 'Pending' }
      ]
    };

    setAssignments(prev => [newAssignment, ...prev]);
    toast.success('Assignment published successfully');
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this assignment permanently? All submitted grades will be lost.')) {
      setAssignments(prev => prev.filter(a => a.id !== id));
      toast.success('Assignment deleted');
    }
  };

  const handleOpenGrading = (assign: Assignment, sub: StudentSubmission) => {
    setActiveAssignment(assign);
    setActiveSubmission(sub);
    setGradingForm({
      marksObtained: sub.marksObtained || 0,
      feedback: sub.feedback || ''
    });
    setIsGradingModalOpen(true);
  };

  const handleSaveGrades = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment || !activeSubmission) return;

    if (gradingForm.marksObtained < 0 || gradingForm.marksObtained > activeAssignment.maxMarks) {
      toast.error(`Marks must be between 0 and ${activeAssignment.maxMarks}`);
      return;
    }

    setAssignments(prev => prev.map(a => {
      if (a.id === activeAssignment.id) {
        return {
          ...a,
          submissions: a.submissions.map(sub => {
            if (sub.id === activeSubmission.id) {
              return {
                ...sub,
                marksObtained: gradingForm.marksObtained,
                feedback: gradingForm.feedback,
                status: 'Graded'
              };
            }
            return sub;
          })
        };
      }
      return a;
    }));

    toast.success('Grades recorded and shared with student profile');
    setIsGradingModalOpen(false);
  };

  const filteredAssignments = assignments.filter(item => {
    return (
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Assignment Management</h1>
          <p className="text-slate-500 mt-1 text-sm">Create class projects, view student uploads, and record numerical grades with feedback.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="mt-4 md:mt-0 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Filter / Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by assignment title, subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50"
          />
        </div>
      </div>

      {/* Grid of assignments */}
      <div className="space-y-6">
        {filteredAssignments.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-xl py-16 text-center text-slate-500">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-600">No Assignments Found</p>
          </div>
        ) : (
          filteredAssignments.map(assign => {
            const pendingGrades = assign.submissions.filter(s => s.status === 'Submitted').length;
            const gradedCount = assign.submissions.filter(s => s.status === 'Graded').length;
            
            return (
              <div key={assign.id} className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
                {/* Upper Blueprint Info */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/20 flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-200">
                        {assign.className} — {assign.subjectName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Due Date: {assign.dueDate}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-slate-800 text-lg leading-snug">{assign.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed max-w-4xl">{assign.instructions}</p>
                    
                    <div className="flex gap-4 text-xs font-semibold text-slate-400">
                      <span>Max Marks: <strong className="text-slate-700">{assign.maxMarks}</strong></span>
                      <span>Passing Marks: <strong className="text-slate-700">{assign.passingMarks}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start md:self-center">
                    <div className="text-right">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Grading Progress</span>
                      <span className="font-bold text-slate-800 text-sm">{gradedCount} / {assign.submissions.length} Evaluated</span>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(assign.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Delete Assignment"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Submissions List */}
                <div className="p-6">
                  <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-4">Student Submissions Log</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] pb-2">
                          <th className="pb-3 w-44">Student Name</th>
                          <th className="pb-3 w-28">Roll No.</th>
                          <th className="pb-3">Uploaded Document</th>
                          <th className="pb-3 text-center">Marks Obtain</th>
                          <th className="pb-3">Feedback Notes</th>
                          <th className="pb-3 text-center">Review Status</th>
                          <th className="pb-3 text-center w-28">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {assign.submissions.map(sub => (
                          <tr key={sub.id} className="hover:bg-slate-50/20 transition-colors">
                            <td className="py-3 font-semibold text-slate-800">{sub.studentName}</td>
                            <td className="py-3 text-slate-500">{sub.rollNo}</td>
                            <td className="py-3">
                              {sub.submittedFile ? (
                                <div className="flex items-center gap-1 text-blue-600 hover:underline cursor-pointer">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span className="font-semibold">{sub.submittedFile}</span>
                                </div>
                              ) : (
                                <span className="text-slate-350 italic">Not submitted</span>
                              )}
                            </td>
                            <td className="py-3 text-center font-bold text-slate-800">
                              {sub.status === 'Graded' ? `${sub.marksObtained}/${assign.maxMarks}` : '—'}
                            </td>
                            <td className="py-3 text-slate-500 italic max-w-xs truncate" title={sub.feedback || ''}>
                              {sub.feedback || '—'}
                            </td>
                            <td className="py-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                sub.status === 'Graded' ? 'bg-green-50 text-green-700 border border-green-200' :
                                sub.status === 'Submitted' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {sub.status}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              {sub.status !== 'Pending' ? (
                                <button
                                  onClick={() => handleOpenGrading(assign, sub)}
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold px-2.5 py-1 rounded transition-all"
                                >
                                  {sub.status === 'Graded' ? 'Edit Grade' : 'Grade File'}
                                </button>
                              ) : (
                                <span className="text-slate-400 italic">No Upload</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-lg">Create Class Assignment</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-6 space-y-4">
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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Max Marks</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={formData.maxMarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxMarks: parseInt(e.target.value) || 50 }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Passing Marks</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={formData.passingMarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, passingMarks: parseInt(e.target.value) || 17 }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Project Title</label>
                <input
                  type="text"
                  placeholder="e.g. Unit 4 Algebra Practical Booklet"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Instructions / Submission Rules</label>
                <textarea
                  rows={4}
                  placeholder="Detail what students should do, submission formats, project templates..."
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
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
                  Publish Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {isGradingModalOpen && activeSubmission && activeAssignment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-lg">Grade Submission</h3>
              <button onClick={() => setIsGradingModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrades} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1">
                <div>Student Name: <strong className="text-slate-800">{activeSubmission.studentName}</strong></div>
                <div>Submitted File: <span className="text-blue-600 font-semibold">{activeSubmission.submittedFile}</span></div>
                <div>Submitted On: <span className="font-semibold">{activeSubmission.submittedDate}</span></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Marks Obtained (Out of {activeAssignment.maxMarks})
                </label>
                <input
                  type="number"
                  min="0"
                  max={activeAssignment.maxMarks}
                  value={gradingForm.marksObtained}
                  onChange={(e) => setGradingForm(prev => ({ ...prev, marksObtained: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Evaluation Feedback / Comments</label>
                <textarea
                  rows={3}
                  placeholder="Explain spelling errors, calculations accuracy, presentation comments..."
                  value={gradingForm.feedback}
                  onChange={(e) => setGradingForm(prev => ({ ...prev, feedback: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsGradingModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md font-semibold text-sm hover:from-blue-700 hover:to-indigo-700"
                >
                  Record Grades
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
