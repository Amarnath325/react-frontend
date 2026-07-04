import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  BookOpen, Calendar, User, Eye, Plus, Check, X, 
  Trash2, Filter, AlertCircle, RefreshCw, Send, CheckSquare
} from 'lucide-react';

interface LessonPlan {
  id: number;
  teacherName: string;
  className: string;
  subjectName: string;
  chapterTitle: string;
  topicTitle: string;
  planDate: string;
  objectives: string;
  methodology: string;
  homeworkTask: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  feedback?: string;
}

const INITIAL_PLANS: LessonPlan[] = [
  {
    id: 1,
    teacherName: 'Mr. Rajesh Sharma',
    className: 'Class 10',
    subjectName: 'Mathematics',
    chapterTitle: 'Chapter 3: Quadratic Equations',
    topicTitle: 'Solution by Factorization Method',
    planDate: '2026-06-26',
    objectives: 'Students will learn to find roots of quadratic equations by splitting middle terms.',
    methodology: 'Interactive white-board examples followed by student peer-problem solving.',
    homeworkTask: 'Exercise 4.2 Questions 1 to 4.',
    approvalStatus: 'Approved',
    feedback: 'Good structured plan. Ensure weak students are paid special attention.'
  },
  {
    id: 2,
    teacherName: 'Dr. Sunita Verma',
    className: 'Class 10',
    subjectName: 'Physics',
    chapterTitle: 'Chapter 2: Human Eye & Colorful World',
    topicTitle: 'Prism Refraction & Dispersion',
    planDate: '2026-06-27',
    objectives: 'To demonstrate light refraction and spectrum separation using a glass prism.',
    methodology: 'Hands-on lab demonstration showing refraction and rainbow colors.',
    homeworkTask: 'Draw neat labeled diagram of prism refraction in lab notebook.',
    approvalStatus: 'Pending'
  },
  {
    id: 3,
    teacherName: 'Mrs. Emily D\'souza',
    className: 'Class 9',
    subjectName: 'English Literature',
    chapterTitle: 'Chapter 2: The Road Not Taken',
    topicTitle: 'Stanza 3 & 4 Explanation & Rhyme Scheme',
    planDate: '2026-06-28',
    objectives: 'Analyze the decision-making metaphor in Robert Frost\'s final stanzas.',
    methodology: 'Poetry recitation followed by open classroom discussion on career/life paths.',
    homeworkTask: 'Write a short paragraph on a choice you had to make in life.',
    approvalStatus: 'Rejected',
    feedback: 'Please include specific classroom activities and time division.'
  }
];

const TEACHERS = ['Mr. Rajesh Sharma', 'Dr. Sunita Verma', 'Mrs. Emily D\'souza', 'Mr. Amit Patel'];
const CLASSES = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'General Science', 'English Literature'];

export default function LessonPlanManager() {
  const [plans, setPlans] = useState<LessonPlan[]>(INITIAL_PLANS);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activePlan, setActivePlan] = useState<LessonPlan | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    teacherName: TEACHERS[0],
    className: CLASSES[0],
    subjectName: SUBJECTS[0],
    chapterTitle: '',
    topicTitle: '',
    planDate: new Date().toISOString().split('T')[0],
    objectives: '',
    methodology: '',
    homeworkTask: '',
  });

  // Coordinator Feedback dialog
  const [feedbackText, setFeedbackText] = useState('');

  const handleOpenAddModal = () => {
    setFormData({
      teacherName: TEACHERS[0],
      className: CLASSES[0],
      subjectName: SUBJECTS[0],
      chapterTitle: '',
      topicTitle: '',
      planDate: new Date().toISOString().split('T')[0],
      objectives: '',
      methodology: '',
      homeworkTask: '',
    });
    setIsModalOpen(true);
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.chapterTitle.trim() || !formData.topicTitle.trim()) {
      toast.error('Please enter chapter and topic titles');
      return;
    }

    const newPlan: LessonPlan = {
      id: Date.now(),
      ...formData,
      approvalStatus: 'Pending'
    };

    setPlans(prev => [newPlan, ...prev]);
    toast.success('Lesson plan submitted for approval');
    setIsModalOpen(false);
  };

  const handleApprove = (id: number) => {
    setPlans(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, approvalStatus: 'Approved', feedback: 'Approved by administrator.' };
      }
      return p;
    }));
    toast.success('Lesson plan approved');
  };

  const handleReject = (id: number) => {
    if (!feedbackText.trim()) {
      toast.error('Please enter feedback explaining the rejection');
      return;
    }

    setPlans(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, approvalStatus: 'Rejected', feedback: feedbackText };
      }
      return p;
    }));

    toast.success('Lesson plan returned/rejected');
    setFeedbackText('');
    setIsViewModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this lesson plan record?')) {
      setPlans(prev => prev.filter(p => p.id !== id));
      toast.success('Lesson plan record deleted');
    }
  };

  const filteredPlans = plans.filter(item => {
    return selectedStatus ? item.approvalStatus === selectedStatus : true;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Lesson Planner & Approval</h1>
          <p className="text-slate-500 mt-1 text-sm">Teachers design and submit lesson blueprints; administrators review and log feedback.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="mt-4 md:mt-0 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>New Lesson Plan</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-600">Filter status:</span>
          <div className="flex gap-2">
            {['', 'Pending', 'Approved', 'Rejected'].map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  selectedStatus === status 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {status || 'All Plans'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200/80 rounded-xl py-16 text-center text-slate-500">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-600">No Lesson Plans Listed</p>
          </div>
        ) : (
          filteredPlans.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
              {/* Card Top */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.approvalStatus === 'Approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                    item.approvalStatus === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {item.approvalStatus}
                  </span>
                  
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{item.planDate}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 text-base leading-snug">{item.topicTitle}</h3>
                  <p className="text-xs text-slate-400 mt-1">{item.chapterTitle}</p>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Class & Subject:</span>
                    <span className="font-semibold text-slate-700">{item.className} — {item.subjectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Teacher:</span>
                    <span className="font-semibold text-slate-700">{item.teacherName}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex items-center justify-between">
                <button
                  onClick={() => {
                    setActivePlan(item);
                    setFeedbackText(item.feedback || '');
                    setIsViewModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold text-xs transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>

                <div className="flex items-center gap-1">
                  {item.approvalStatus === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded-lg transition-all"
                        title="Approve Lesson Plan"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setActivePlan(item);
                          setFeedbackText('');
                          setIsViewModalOpen(true);
                        }}
                        className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg transition-all"
                        title="Request Revision"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Lesson Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-lg">Create New Lesson Plan</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="p-6 space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Assigned Teacher</label>
                  <select
                    value={formData.teacherName}
                    onChange={(e) => setFormData(prev => ({ ...prev, teacherName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    {TEACHERS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Proposed Date</label>
                  <input
                    type="date"
                    value={formData.planDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, planDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Chapter Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 3: Quadratic Equations"
                  value={formData.chapterTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, chapterTitle: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Topic Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Solving equations via quadratic formula"
                  value={formData.topicTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, topicTitle: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Learning Objectives</label>
                <textarea
                  rows={2}
                  placeholder="What will students learn..."
                  value={formData.objectives}
                  onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Teaching Methodology</label>
                <textarea
                  rows={2}
                  placeholder="Activities, whiteboard, experiments, slides..."
                  value={formData.methodology}
                  onChange={(e) => setFormData(prev => ({ ...prev, methodology: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Homework Task</label>
                <input
                  type="text"
                  placeholder="e.g. Solve Q1 & Q2 of exercise 3.3"
                  value={formData.homeworkTask}
                  onChange={(e) => setFormData(prev => ({ ...prev, homeworkTask: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                  Submit Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details / Approval Modal */}
      {isViewModalOpen && activePlan && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-lg">Lesson Plan Blueprint</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border">
                <div>
                  <span className="text-slate-400 block font-medium">Class / Subject:</span>
                  <span className="font-bold text-slate-700">{activePlan.className} — {activePlan.subjectName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Assigned Teacher:</span>
                  <span className="font-bold text-slate-700">{activePlan.teacherName}</span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400 block font-medium">Proposed Date:</span>
                  <span className="font-bold text-slate-700">{activePlan.planDate}</span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400 block font-medium">Approval Status:</span>
                  <span className={`font-bold inline-block px-2 py-0.5 rounded text-[10px] ${
                    activePlan.approvalStatus === 'Approved' ? 'bg-green-50 text-green-700' :
                    activePlan.approvalStatus === 'Rejected' ? 'bg-rose-50 text-rose-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>{activePlan.approvalStatus}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Topic Details:</h4>
                <p className="font-bold text-slate-800 text-sm">{activePlan.topicTitle}</p>
                <p className="text-slate-500 text-xs mt-0.5">{activePlan.chapterTitle}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Learning Objectives:</h4>
                <p className="text-slate-600 text-xs leading-relaxed">{activePlan.objectives}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Teaching Methodology:</h4>
                <p className="text-slate-600 text-xs leading-relaxed">{activePlan.methodology}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Homework Task:</h4>
                <p className="text-slate-600 text-xs font-semibold">{activePlan.homeworkTask || 'No homework assigned.'}</p>
              </div>

              {activePlan.feedback && (
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs">
                  <span className="font-bold text-blue-800 block mb-0.5">Coordinator / Principal Feedback:</span>
                  <span className="text-blue-700">{activePlan.feedback}</span>
                </div>
              )}

              {/* Coordinator review field */}
              {activePlan.approvalStatus === 'Pending' && (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Approval Review Feedback</label>
                  <textarea
                    rows={2}
                    placeholder="Enter review comments or reasons for rejection..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => handleReject(activePlan.id)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      Reject Plan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleApprove(activePlan.id);
                        setIsViewModalOpen(false);
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      Approve Plan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
