import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  BookOpen, Layers, Clock, CheckCircle, Award, Search, Plus, 
  Trash2, Edit3, Filter, AlertCircle, X, ChevronDown, ChevronRight, CheckSquare
} from 'lucide-react';

interface Chapter {
  id: number;
  chapterNo: number;
  title: string;
  description: string;
  estimatedHours: number;
  objectives: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  completedDate?: string;
}

interface SubjectSyllabus {
  id: number;
  className: string;
  subjectName: string;
  chapters: Chapter[];
}

const INITIAL_SYLLABUS: SubjectSyllabus[] = [
  {
    id: 1,
    className: 'Class 10',
    subjectName: 'Mathematics',
    chapters: [
      { id: 101, chapterNo: 1, title: 'Real Numbers', description: 'Euclid\'s division lemma, Fundamental Theorem of Arithmetic, irrational numbers proof.', estimatedHours: 6, objectives: 'Understand real number properties and proofs of irrationality.', status: 'Completed', completedDate: '2026-04-12' },
      { id: 102, chapterNo: 2, title: 'Polynomials', description: 'Zeroes of a polynomial, relationship between coefficients and zeroes, division algorithm.', estimatedHours: 8, objectives: 'Master polynomial division and finding zeroes.', status: 'Completed', completedDate: '2026-05-02' },
      { id: 103, chapterNo: 3, title: 'Quadratic Equations', description: 'Standard form, factorization method, completing the square method, quadratic formula.', estimatedHours: 10, objectives: 'Solve quadratic equations and practical problems.', status: 'In Progress' },
      { id: 104, chapterNo: 4, title: 'Arithmetic Progressions', description: 'Derivation of the nth term and sum of first n terms of A.P. and their application.', estimatedHours: 8, objectives: 'Identify patterns, find nth terms, calculate series sum.', status: 'Pending' }
    ]
  },
  {
    id: 2,
    className: 'Class 10',
    subjectName: 'Physics',
    chapters: [
      { id: 201, chapterNo: 1, title: 'Light - Reflection & Refraction', description: 'Reflection of light, spherical mirrors, refraction, refractive index, lens formula.', estimatedHours: 12, objectives: 'Understand optical laws and solve mirror/lens equations.', status: 'Completed', completedDate: '2026-04-28' },
      { id: 202, chapterNo: 2, title: 'Human Eye & Colorful World', description: 'Refraction through prism, dispersion, scattering of light, defects of vision.', estimatedHours: 8, objectives: 'Learn eye anatomy, corrective measures, atmospheric refraction.', status: 'In Progress' }
    ]
  },
  {
    id: 3,
    className: 'Class 9',
    subjectName: 'English Literature',
    chapters: [
      { id: 301, chapterNo: 1, title: 'The Fun They Had', description: 'Story of Margie and Tommy learning about old mechanical schools.', estimatedHours: 4, objectives: 'Discuss impact of technology on futuristic education.', status: 'Completed', completedDate: '2026-04-10' },
      { id: 302, chapterNo: 2, title: 'The Road Not Taken (Poem)', description: 'Robert Frost poem about choices and paths in life.', estimatedHours: 3, objectives: 'Interpret symbolism and poetic devices.', status: 'Completed', completedDate: '2026-04-17' }
    ]
  }
];

const CLASSES = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'General Science', 'English Literature', 'Accountancy', 'Economics'];

export default function SyllabusManager() {
  const [syllabusList, setSyllabusList] = useState<SubjectSyllabus[]>(INITIAL_SYLLABUS);
  const [selectedClass, setSelectedClass] = useState('Class 10');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  
  // Expanded subjects
  const [expandedSyllabusId, setExpandedSyllabusId] = useState<number | null>(1);
  
  // Modals
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [selectedSyllabus, setSelectedSyllabus] = useState<SubjectSyllabus | null>(null);
  
  // Chapter Form state
  const [chapterForm, setChapterForm] = useState({
    chapterNo: 1,
    title: '',
    description: '',
    estimatedHours: 5,
    objectives: '',
    status: 'Pending' as 'Pending' | 'In Progress' | 'Completed'
  });

  const activeSyllabus = syllabusList.find(s => s.className === selectedClass && s.subjectName === selectedSubject);

  const handleCreateSyllabus = () => {
    // Check if mapping exists
    const exists = syllabusList.some(s => s.className === selectedClass && s.subjectName === selectedSubject);
    if (exists) {
      toast.error('Curriculum structure already exists for this Class & Subject.');
      return;
    }
    
    const newSyllabus: SubjectSyllabus = {
      id: syllabusList.length + 1,
      className: selectedClass,
      subjectName: selectedSubject,
      chapters: []
    };
    
    setSyllabusList(prev => [...prev, newSyllabus]);
    setExpandedSyllabusId(newSyllabus.id);
    toast.success('Curriculum card initialized successfully');
  };

  const handleOpenAddChapter = (syllabus: SubjectSyllabus) => {
    setSelectedSyllabus(syllabus);
    setEditingChapter(null);
    setChapterForm({
      chapterNo: syllabus.chapters.length + 1,
      title: '',
      description: '',
      estimatedHours: 6,
      objectives: '',
      status: 'Pending'
    });
    setIsChapterModalOpen(true);
  };

  const handleOpenEditChapter = (syllabus: SubjectSyllabus, chapter: Chapter) => {
    setSelectedSyllabus(syllabus);
    setEditingChapter(chapter);
    setChapterForm({
      chapterNo: chapter.chapterNo,
      title: chapter.title,
      description: chapter.description,
      estimatedHours: chapter.estimatedHours,
      objectives: chapter.objectives,
      status: chapter.status
    });
    setIsChapterModalOpen(true);
  };

  const handleDeleteChapter = (syllabusId: number, chapterId: number) => {
    if (window.confirm('Delete this chapter/topic from curriculum?')) {
      setSyllabusList(prev => prev.map(s => {
        if (s.id === syllabusId) {
          return {
            ...s,
            chapters: s.chapters.filter(ch => ch.id !== chapterId)
          };
        }
        return s;
      }));
      toast.success('Chapter removed from syllabus');
    }
  };

  const handleChapterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterForm.title.trim()) {
      toast.error('Please enter chapter title');
      return;
    }

    if (!selectedSyllabus) return;

    setSyllabusList(prev => prev.map(s => {
      if (s.id === selectedSyllabus.id) {
        if (editingChapter) {
          // Editing
          return {
            ...s,
            chapters: s.chapters.map(ch => {
              if (ch.id === editingChapter.id) {
                return {
                  ...ch,
                  ...chapterForm,
                  completedDate: chapterForm.status === 'Completed' ? new Date().toISOString().split('T')[0] : undefined
                };
              }
              return ch;
            })
          };
        } else {
          // Adding
          const newCh: Chapter = {
            id: Date.now(),
            ...chapterForm,
            completedDate: chapterForm.status === 'Completed' ? new Date().toISOString().split('T')[0] : undefined
          };
          return {
            ...s,
            chapters: [...s.chapters, newCh].sort((a, b) => a.chapterNo - b.chapterNo)
          };
        }
      }
      return s;
    }));

    toast.success(editingChapter ? 'Chapter details updated' : 'Chapter added to curriculum');
    setIsChapterModalOpen(false);
  };

  const calculateCompletionStats = (chapters: Chapter[]) => {
    if (chapters.length === 0) return { percent: 0, completed: 0, total: 0 };
    const completed = chapters.filter(c => c.status === 'Completed').length;
    return {
      percent: Math.round((completed / chapters.length) * 100),
      completed,
      total: chapters.length
    };
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Curriculum & Syllabus Design</h1>
          <p className="text-slate-500 mt-1 text-sm">Define class-wise chapters, teaching objectives, and track syllabus completion progress.</p>
        </div>
      </div>

      {/* Curriculum Selector and Creator Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Selector Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80 lg:col-span-2">
          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            <span>Select Curriculum Structure</span>
          </h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Class/Grade</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
              </select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>

            {!activeSyllabus && (
              <button
                onClick={handleCreateSyllabus}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-lg transition-all shadow-md hover:shadow-lg text-sm"
              >
                Initialize Structure
              </button>
            )}
          </div>
        </div>

        {/* Global Progress Statistics */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-xl shadow-md flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-indigo-200 text-xs uppercase tracking-wider mb-1">Active Curriculum Stats</h3>
            {activeSyllabus ? (
              <>
                <p className="text-2xl font-extrabold mt-1">{activeSyllabus.className} — {activeSyllabus.subjectName}</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-black">{calculateCompletionStats(activeSyllabus.chapters).percent}%</span>
                  <span className="text-indigo-300 text-sm">Completed</span>
                </div>
              </>
            ) : (
              <p className="text-slate-400 mt-2 text-sm">Initialize a curriculum structure to view statistics.</p>
            )}
          </div>
          
          {activeSyllabus && (
            <div className="mt-4 bg-white/10 rounded-lg p-2.5 flex items-center justify-between text-xs text-indigo-100">
              <span>Total Chapters: {calculateCompletionStats(activeSyllabus.chapters).total}</span>
              <span>•</span>
              <span>Completed: {calculateCompletionStats(activeSyllabus.chapters).completed}</span>
            </div>
          )}
        </div>
      </div>

      {/* Active Curriculum Chapter Grid */}
      {activeSyllabus ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 gap-4">
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Curriculum Blueprint & Chapters</h2>
              <p className="text-xs text-slate-400 mt-0.5">Edit lesson objectives, estimated teaching periods, and timeline logs.</p>
            </div>
            <button
              onClick={() => handleOpenAddChapter(activeSyllabus)}
              className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-all shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add Chapter/Unit</span>
            </button>
          </div>

          {/* Chapters List */}
          <div className="divide-y divide-slate-100">
            {activeSyllabus.chapters.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">No Chapters Defined Yet</p>
                <p className="text-xs text-slate-400 mt-1">Create the first chapter or topic for this subject blueprint.</p>
              </div>
            ) : (
              activeSyllabus.chapters.map((ch, idx) => (
                <div key={ch.id} className="p-6 hover:bg-slate-50/40 transition-colors flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  {/* Left content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold font-mono">
                        Chapter {ch.chapterNo}
                      </span>
                      <h4 className="font-bold text-slate-800 text-base">{ch.title}</h4>
                      
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ch.status === 'Completed' ? 'bg-green-50 text-green-700 border border-green-200' :
                        ch.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {ch.status}
                      </span>
                    </div>

                    <p className="text-slate-500 text-xs leading-relaxed max-w-3xl">{ch.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Estimated: {ch.estimatedHours} Hours</span>
                      </div>
                      {ch.completedDate && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Finished on: {ch.completedDate}</span>
                        </div>
                      )}
                    </div>

                    {ch.objectives && (
                      <div className="mt-2 bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs text-slate-600">
                        <span className="font-bold text-slate-700 block mb-0.5">Learning Objectives:</span>
                        {ch.objectives}
                      </div>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 self-start md:self-center">
                    <button
                      onClick={() => handleOpenEditChapter(activeSyllabus, ch)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Edit Chapter Blueprint"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteChapter(activeSyllabus.id, ch.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Remove Chapter"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 border-2 border-dashed border-slate-200 rounded-xl py-16 text-center text-slate-500">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-lg">Initialize Curriculum Structure</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
            There is no active blueprint recorded for {selectedClass} — {selectedSubject}. Initialize to design the curriculum.
          </p>
        </div>
      )}

      {/* Chapter Modal */}
      {isChapterModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-lg">{editingChapter ? 'Edit Chapter Blueprint' : 'Add Chapter/Unit'}</h3>
              <button onClick={() => setIsChapterModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChapterSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Chapter No.</label>
                  <input
                    type="number"
                    min="1"
                    value={chapterForm.chapterNo}
                    onChange={(e) => setChapterForm(prev => ({ ...prev, chapterNo: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Estimated Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={chapterForm.estimatedHours}
                    onChange={(e) => setChapterForm(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 4 }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Chapter Title</label>
                <input
                  type="text"
                  placeholder="e.g. Real Numbers, Algebra Foundations"
                  value={chapterForm.title}
                  onChange={(e) => setChapterForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Topics / Description</label>
                <textarea
                  rows={3}
                  placeholder="Enter details of topics covered..."
                  value={chapterForm.description}
                  onChange={(e) => setChapterForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Learning Objectives</label>
                <textarea
                  rows={2}
                  placeholder="Key concepts students should grasp after completing..."
                  value={chapterForm.objectives}
                  onChange={(e) => setChapterForm(prev => ({ ...prev, objectives: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Curriculum Status</label>
                <select
                  value={chapterForm.status}
                  onChange={(e) => setChapterForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsChapterModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md font-semibold text-sm hover:from-blue-700 hover:to-indigo-700"
                >
                  {editingChapter ? 'Save Changes' : 'Add Chapter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
