import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Plus, Search, Trash2, RefreshCw, X, Users, CheckCircle, XCircle, Inbox, Layers
} from 'lucide-react';
import api from '../../services/api';

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

export default function ReExamSupplementaryManager() {
  const [supps, setSupps] = useState<SuppStudent[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<SuppStudent | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    class_id: '',
    student_id: '',
    subject_id: '',
    exam_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    original_marks: ''
  });

  // Grade Input State
  const [gradeInput, setGradeInput] = useState('');

  useEffect(() => {
    fetchClasses();
    fetchSupps();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/master/classes');
      if (res.data?.success) {
        const data = res.data.data;
        const arr = Array.isArray(data)
          ? data.map((c: any) => ({ id: c.id || c.m_id, c_name: c.name || c.m_name }))
          : Object.entries(data).map(([id, name]) => ({ id: Number(id), c_name: name as string }));
        setClasses(arr);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSupps = async () => {
    setLoading(true);
    try {
      const params = selectedClass ? { class_id: selectedClass } : {};
      const res = await api.get('/school/re-exams', { params });
      if (res.data?.success) {
        setSupps(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      toast.error('Failed to load supplementary records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupps();
  }, [selectedClass]);

  const handleClassChange = async (classId: string) => {
    setFormData(prev => ({ ...prev, class_id: classId, student_id: '', subject_id: '' }));
    if (!classId) {
      setStudents([]);
      setSubjects([]);
      return;
    }
    
    try {
      // Fetch students for class
      const stuRes = await api.get('/students', { params: { class_id: classId, per_page: 500 } });
      if (stuRes.data?.success) setStudents(Array.isArray(stuRes.data.data) ? stuRes.data.data : []);

      // Fetch subjects
      const subRes = await api.get('/school/subjects');
      if (subRes.data?.success) setSubjects(Array.isArray(subRes.data.data) ? subRes.data.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      class_id: '',
      student_id: '',
      subject_id: '',
      exam_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      original_marks: ''
    });
    setStudents([]);
    setSubjects([]);
    setIsModalOpen(true);
  };

  const handleCreateSupp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class_id || !formData.student_id || !formData.subject_id || !formData.original_marks) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const res = await api.post('/school/re-exams', formData);
      if (res.data?.success) {
        toast.success(res.data.message);
        setIsModalOpen(false);
        fetchSupps();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error registering candidate');
    }
  };

  const handleOpenGrading = (item: SuppStudent) => {
    setActiveItem(item);
    setGradeInput(item.suppMarks || '');
    setIsGradeModalOpen(true);
  };

  const handleSaveGrades = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    
    const marksNum = Number(gradeInput);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
      toast.error('Marks must be between 0 and 100');
      return;
    }

    try {
      const res = await api.patch(`/school/re-exams/${activeItem.id}/marks`, { supp_marks: marksNum });
      if (res.data?.success) {
        toast.success(res.data.message);
        setIsGradeModalOpen(false);
        fetchSupps();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error updating marks');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Remove this supplementary registration?')) {
      try {
        const res = await api.delete(`/school/re-exams/${id}`);
        if (res.data?.success) {
          toast.success(res.data.message);
          fetchSupps();
        }
      } catch (err) {
        toast.error('Failed to remove registration');
      }
    }
  };

  const filteredSupps = supps.filter(item => {
    const matchesSearch = 
      item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subjectFailed.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus ? item.status === selectedStatus : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 space-y-3 text-xs">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 rounded-lg">
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">Re-Exam & Supplementary Panel</h1>
            <p className="text-[10px] text-gray-500">Register failed candidates, schedule improvement tests and record clearing scores.</p>
          </div>
        </div>
        <button
          onClick={() => { fetchSupps(); fetchClasses(); }}
          className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="text-[10px] font-medium">Refresh</span>
        </button>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-blue-50 border-blue-100 min-w-0">
          <div className="p-1.5 rounded-md bg-blue-500 text-white flex-shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate">Total Registrations</p>
            <p className="text-lg font-bold text-gray-800 leading-tight">{supps.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-amber-50 border-amber-100 min-w-0">
          <div className="p-1.5 rounded-md bg-amber-500 text-white flex-shrink-0">
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate">Pending Exams</p>
            <p className="text-lg font-bold text-gray-800 leading-tight">{supps.filter(s => s.status === 'Registered').length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-green-50 border-green-100 min-w-0">
          <div className="p-1.5 rounded-md bg-green-500 text-white flex-shrink-0">
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate">Cleared Candidates</p>
            <p className="text-lg font-bold text-gray-800 leading-tight">{supps.filter(s => s.status === 'Cleared').length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-rose-50 border-rose-100 min-w-0">
          <div className="p-1.5 rounded-md bg-rose-500 text-white flex-shrink-0">
            <XCircle className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate">Failed / Retake</p>
            <p className="text-lg font-bold text-gray-800 leading-tight">{supps.filter(s => s.status === 'Failed').length}</p>
          </div>
        </div>
      </div>

      {/* ── Primary Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 px-2.5 py-2 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by candidate or subject..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-6 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white h-7 w-44"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Class Select */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5 h-7">
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="text-[11px] font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="">All Classes</option>
              {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.c_name}</option>)}
            </select>
          </div>

          {/* Status Select */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5 h-7">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="text-[11px] font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Registered">Registered</option>
              <option value="Cleared">Cleared</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          {(selectedClass || selectedStatus || searchTerm) && (
            <button
              onClick={() => { setSelectedClass(''); setSelectedStatus(''); setSearchTerm(''); }}
              className="text-[10px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-2 py-1 rounded transition"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition text-[11px] font-bold h-7 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register Candidate</span>
        </button>
      </div>

      {/* Grid of registered candidates */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold text-[10px] uppercase tracking-wider">
                <th className="py-2 px-3">Candidate Detail</th>
                <th className="py-2 px-3">Target Subject</th>
                <th className="py-2 px-3 text-center">Original Score</th>
                <th className="py-2 px-3 text-center">Supp Score (100)</th>
                <th className="py-2 px-3">Supp Exam Date</th>
                <th className="py-2 px-3 text-center">Status</th>
                <th className="py-2 px-3 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading records...
                  </td>
                </tr>
              ) : filteredSupps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center justify-center text-slate-400">
                      <div className="p-2.5 bg-slate-100 rounded-full mb-3 text-slate-400">
                        <Inbox className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">No candidates listed</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-[260px] mx-auto leading-relaxed">
                        There are no candidates matching your filters or registered for supplementary exams yet.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSupps.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100">
                    <td className="py-2 px-3">
                      <div className="font-bold text-gray-800">{item.studentName}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{item.className} — Roll {item.rollNo}</div>
                    </td>
                    <td className="py-2 px-3 text-gray-700 font-semibold">{item.subjectFailed}</td>
                    <td className="py-2 px-3 text-center font-semibold text-rose-500">{item.originalMarks}</td>
                    <td className="py-2 px-3 text-center font-bold text-gray-800">{item.suppMarks || '—'}</td>
                    <td className="py-2 px-3 font-semibold text-gray-500">{item.suppDate}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        item.status === 'Cleared' ? 'bg-green-50 text-green-700 border-green-200' :
                        item.status === 'Failed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenGrading(item)}
                          className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded text-[10px] transition"
                        >
                          Enter Score
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-0.5 text-gray-400 hover:text-rose-600 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">Register Candidate for Re-Exam</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSupp} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Class/Grade</label>
                  <select
                    value={formData.class_id}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full h-7 px-2 py-1 text-[11px] rounded border border-gray-300 bg-white focus:outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.c_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Candidate</label>
                  <select
                    value={formData.student_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, student_id: e.target.value }))}
                    className="w-full h-7 px-2 py-1 text-[11px] rounded border border-gray-300 bg-white focus:outline-none focus:border-indigo-500"
                    required
                    disabled={!formData.class_id}
                  >
                    <option value="">Select Candidate</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.user?.first_name} {s.user?.last_name} ({s.roll_number})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Failed Subject</label>
                  <select
                    value={formData.subject_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject_id: e.target.value }))}
                    className="w-full h-7 px-2 py-1 text-[11px] rounded border border-gray-300 bg-white focus:outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.subject_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Original Score</label>
                  <input
                    type="text"
                    placeholder="e.g. 22/100"
                    value={formData.original_marks}
                    onChange={(e) => setFormData(prev => ({ ...prev, original_marks: e.target.value }))}
                    className="w-full h-7 px-2 py-1 text-[11px] rounded border border-gray-300 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Supplementary Exam Date</label>
                  <input
                    type="date"
                    value={formData.exam_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, exam_date: e.target.value }))}
                    className="w-full h-7 px-2 py-1 text-[11px] rounded border border-gray-300 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-7 px-3 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition text-[11px] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-7 px-4 bg-indigo-600 text-white rounded shadow-sm text-[11px] font-semibold hover:bg-indigo-700"
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">Enter Supplementary Score</h3>
              <button onClick={() => setIsGradeModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGrades} className="p-4 space-y-3">
              <div className="bg-slate-50 p-2.5 rounded border border-gray-200 text-[11px] text-gray-500 space-y-1">
                <div>Candidate Name: <strong className="text-gray-800">{activeItem.studentName}</strong></div>
                <div>Class/Subject: <span className="font-semibold text-gray-700">{activeItem.className} — {activeItem.subjectFailed}</span></div>
                <div>Original Marks: <span className="font-bold text-rose-500">{activeItem.originalMarks}</span></div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Supplementary Score (Max: 100)</label>
                <input
                  type="text"
                  placeholder="e.g. 45"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  className="w-full h-8 px-2 py-1 text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center font-bold text-base"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGradeModalOpen(false)}
                  className="h-7 px-3 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition text-[11px] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-7 px-4 bg-green-600 hover:bg-green-700 text-white rounded shadow-sm text-[11px] font-semibold"
                >
                  Save Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
