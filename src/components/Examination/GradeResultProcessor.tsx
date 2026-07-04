import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Award, Play, Plus, Search, Trash2, Edit3,
  Settings, CheckCircle, RefreshCw, X, AlertCircle, CheckSquare
} from 'lucide-react';

interface GradeScale {
  id: number;
  gradeName: string;
  minPercent: number;
  maxPercent: number;
  gradePoints: number;
  remarks: string;
}

const INITIAL_GRADES: GradeScale[] = [
  { id: 1, gradeName: 'A1', minPercent: 91, maxPercent: 100, gradePoints: 10.0, remarks: 'Outstanding academic achievements' },
  { id: 2, gradeName: 'A2', minPercent: 81, maxPercent: 90, gradePoints: 9.0, remarks: 'Excellent standard of work' },
  { id: 3, gradeName: 'B1', minPercent: 71, maxPercent: 80, gradePoints: 8.0, remarks: 'Very Good progress' },
  { id: 4, gradeName: 'B2', minPercent: 61, maxPercent: 70, gradePoints: 7.0, remarks: 'Good capability' },
  { id: 5, gradeName: 'C1', minPercent: 51, maxPercent: 60, gradePoints: 6.0, remarks: 'Satisfactory performance' },
  { id: 6, gradeName: 'D', minPercent: 33, maxPercent: 40, gradePoints: 4.0, remarks: 'Passing grade. Needs support' },
  { id: 7, gradeName: 'F', minPercent: 0, maxPercent: 32, gradePoints: 0.0, remarks: 'Fail. Academic probation' }
];

const EXAMS = ['Half Yearly Examination', 'Final Annual Examination', 'Unit Test-I'];
const CLASSES = ['Class 10', 'Class 9', 'Class 8'];

import { useLocation } from 'react-router-dom';

export default function GradeResultProcessor() {
  const location = useLocation();
  const isResultProc = location.pathname.includes('result-processing');

  const [grades, setGrades] = useState<GradeScale[]>(INITIAL_GRADES);

  // Processing state
  const [selectedExam, setSelectedExam] = useState(EXAMS[0]);
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GradeScale | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    gradeName: '',
    minPercent: 50,
    maxPercent: 60,
    gradePoints: 6.0,
    remarks: ''
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      gradeName: '',
      minPercent: 50,
      maxPercent: 60,
      gradePoints: 6.0,
      remarks: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: GradeScale) => {
    setEditingItem(item);
    setFormData({
      gradeName: item.gradeName,
      minPercent: item.minPercent,
      maxPercent: item.maxPercent,
      gradePoints: item.gradePoints,
      remarks: item.remarks
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this grade scale?')) {
      setGrades(prev => prev.filter(g => g.id !== id));
      toast.success('Grade scale removed');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gradeName.trim()) {
      toast.error('Grade name is required');
      return;
    }

    if (formData.minPercent >= formData.maxPercent) {
      toast.error('Minimum percentage must be less than maximum percentage');
      return;
    }

    if (editingItem) {
      setGrades(prev => prev.map(item =>
        item.id === editingItem.id ? { ...item, ...formData } : item
      ));
      toast.success('Grade scale updated');
    } else {
      const newGrade: GradeScale = {
        id: Date.now(),
        ...formData
      };
      setGrades(prev => [...prev, newGrade].sort((a, b) => b.minPercent - a.minPercent));
      toast.success('Grade scale created');
    }

    setIsModalOpen(false);
  };

  const handleTriggerResultProcessing = () => {
    setIsProcessing(true);
    setProcessingLogs([`Initializing result processor for ${selectedExam} — ${selectedClass}...`]);

    setTimeout(() => {
      setProcessingLogs(prev => [...prev, 'Fetching registered student rolls... [40 students found]']);
    }, 800);

    setTimeout(() => {
      setProcessingLogs(prev => [...prev, 'Verifying subject marks lock indices... [Locked & Verified: 100%]']);
    }, 1600);

    setTimeout(() => {
      setProcessingLogs(prev => [...prev, 'Computing cumulative subject grades and GP averages...']);
    }, 2400);

    setTimeout(() => {
      setProcessingLogs(prev => [...prev, 'Generating ranks, merit metrics, and pass status indexes...']);
    }, 3200);

    setTimeout(() => {
      setProcessingLogs(prev => [...prev, 'Process completed! 38 passed, 2 eligible for Supplementary.']);
      setIsProcessing(false);
      toast.success('Result processing finished. Report cards are now ready to generate.');
    }, 4000);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isResultProc ? 'Result Processing Engine' : 'Grade Management Desk'}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {isResultProc
              ? 'Trigger background result compilation engines to compute GPAs, grades, and lock student ranks.'
              : 'Define and configure global grading scales mapping percentage boundaries to letter grades.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {!isResultProc ? (
          /* Left Side: Grade Scales (shown only in Grades mode, full width) */
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Grading Scale Schemes</h3>
                <p className="text-xs text-slate-400 mt-0.5">Scale schemes map percentage values directly to letter grades.</p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Grade Range</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-650 font-bold uppercase pb-2">
                    <th className="py-2 px-3">Grade Code</th>
                    <th className="py-2 px-3 text-center">Min Percent</th>
                    <th className="py-2 px-3 text-center">Max Percent</th>
                    <th className="py-2 px-3 text-center">Grade Points</th>
                    <th className="py-2 px-3">Remarks / Guidelines</th>
                    <th className="py-2 px-3 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {grades.map(g => (
                    <tr key={g.id} className="hover:bg-slate-50/20">
                      <td className="py-2 px-3 font-bold text-slate-800">{g.gradeName}</td>
                      <td className="py-2 px-3 text-center font-mono">{g.minPercent}%</td>
                      <td className="py-2 px-3 text-center font-mono">{g.maxPercent}%</td>
                      <td className="py-2 px-3 text-center font-bold text-indigo-600">{g.gradePoints.toFixed(1)}</td>
                      <td className="py-2 px-3 truncate max-w-xs">{g.remarks}</td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(g)}
                            className="p-1 hover:text-blue-600 rounded"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(g.id)}
                            className="p-1 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

            {isResultProc ? (
              /* Right Side: Result Processor (shown only in Result Processing mode, full width) */
              <div className="space-y-6 lg:col-span-3 max-w-2xl mx-auto w-full">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Result Processing Engine</span>
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Exam Name</label>
                      <select
                        value={selectedExam}
                        onChange={(e) => setSelectedExam(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                      >
                        {EXAMS.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Class/Grade</label>
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                      >
                        {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                      </select>
                    </div>

                    <button
                      onClick={handleTriggerResultProcessing}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-md disabled:opacity-50 text-sm"
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 fill-white text-transparent" />
                      )}
                      <span>{isProcessing ? 'Processing Engine...' : 'Run Result Processor'}</span>
                    </button>
                  </div>
                </div>

                {/* Processing Logs */}
                {processingLogs.length > 0 && (
                  <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-xs font-mono text-emerald-400 space-y-2 max-h-56 overflow-y-auto">
                    <span className="text-slate-400 block font-bold border-b border-slate-800 pb-1">System Processing Console Logs</span>
                    {processingLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <span>&gt;</span>
                        <span className="leading-relaxed">{log}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>

      {/* Add / Edit Grade Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-100 overflow-hidden transform transition-all">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
                <h3 className="font-bold text-sm">{editingItem ? 'Edit Grade Scale' : 'Add Grade Scheme'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Grade Name</label>
                  <input
                    type="text"
                    placeholder="e.g. A1 or B+"
                    value={formData.gradeName}
                    onChange={(e) => setFormData(prev => ({ ...prev, gradeName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Min %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.minPercent}
                      onChange={(e) => setFormData(prev => ({ ...prev, minPercent: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Max %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.maxPercent}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxPercent: parseInt(e.target.value) || 100 }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">GP Points</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={formData.gradePoints}
                      onChange={(e) => setFormData(prev => ({ ...prev, gradePoints: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Remarks / Criteria</label>
                  <input
                    type="text"
                    placeholder="e.g. Excellent progress"
                    value={formData.remarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md font-semibold text-xs hover:from-blue-700 hover:to-indigo-700"
                  >
                    {editingItem ? 'Save Changes' : 'Add Range'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      );
}
