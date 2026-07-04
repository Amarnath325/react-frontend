import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  FileText, ShieldCheck, Lock, Edit3, Save, Search, 
  Filter, AlertCircle, RefreshCw, X, CheckCircle, CheckSquare
} from 'lucide-react';

interface StudentMarksRow {
  id: number;
  studentName: string;
  rollNo: string;
  theoryMarks: string; // string for input editing
  practicalMarks: string;
  totalMarks: number;
  status: 'Draft' | 'Verified';
}

const INITIAL_STUDENTS: StudentMarksRow[] = [
  { id: 101, studentName: 'Aditya Sen', rollNo: '10-A-01', theoryMarks: '68', practicalMarks: '18', totalMarks: 86, status: 'Draft' },
  { id: 102, studentName: 'Neha Sharma', rollNo: '10-A-08', theoryMarks: '78', practicalMarks: '20', totalMarks: 98, status: 'Verified' },
  { id: 103, studentName: 'Aarav Gupta', rollNo: '10-A-05', theoryMarks: '70', practicalMarks: '19', totalMarks: 89, status: 'Draft' },
  { id: 104, studentName: 'Rahul Verma', rollNo: '10-A-15', theoryMarks: '45', practicalMarks: '12', totalMarks: 57, status: 'Draft' }
];

const EXAMS = ['Half Yearly Examination', 'Final Annual Examination', 'Unit Test-I'];
const CLASSES = ['Class 10', 'Class 9', 'Class 8'];
const SECTIONS = ['A', 'B', 'C'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'English', 'Social Science'];

import { useLocation } from 'react-router-dom';

export default function MarksEntryVerification() {
  const location = useLocation();
  const isVerification = location.pathname.includes('verification');

  const [students, setStudents] = useState<StudentMarksRow[]>(INITIAL_STUDENTS);
  const [selectedExam, setSelectedExam] = useState(EXAMS[0]);
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [selectedSection, setSelectedSection] = useState(SECTIONS[0]);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudents, setEditedStudents] = useState<StudentMarksRow[]>([]);

  const handleStartEditing = () => {
    setEditedStudents(JSON.parse(JSON.stringify(students))); // Deep copy
    setIsEditing(true);
  };

  const handleInputChange = (studentId: number, field: 'theoryMarks' | 'practicalMarks', val: string) => {
    // Keep only digits
    const cleanVal = val.replace(/\D/g, '');
    
    setEditedStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const theory = field === 'theoryMarks' ? cleanVal : s.theoryMarks;
        const practical = field === 'practicalMarks' ? cleanVal : s.practicalMarks;
        const total = (Number(theory) || 0) + (Number(practical) || 0);
        return {
          ...s,
          [field]: cleanVal,
          totalMarks: total
        };
      }
      return s;
    }));
  };

  const handleSaveDraft = () => {
    // Save locally
    setStudents(editedStudents);
    setIsEditing(false);
    toast.success('Marks draft saved successfully');
  };

  const handleVerifyMarks = (id: number) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: 'Verified' };
      }
      return s;
    }));
    toast.success('Marks verification locked for this record');
  };

  const handleBulkVerify = () => {
    if (window.confirm('Lock and verify all draft marks records for this subject? Once verified, they cannot be modified without admin role.')) {
      setStudents(prev => prev.map(s => ({ ...s, status: 'Verified' })));
      toast.success('All subject marks locked & verified successfully');
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isVerification ? 'Marks Verification & Audit' : 'Marks Entry Registry'}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {isVerification 
              ? 'Review pending draft marks entered by teachers, verify logs, and lock columns.' 
              : 'Record class-wise, section-wise marks for theory and practical papers in the system.'}
          </p>
        </div>
      </div>

      {/* Selectors Panel */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80 mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Class & Section</label>
            <div className="flex gap-2">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
              >
                {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
              </select>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
              >
                {SECTIONS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
            >
              {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </div>

          {/* Action trigger row */}
          <div className="flex items-end gap-2">
            {!isEditing ? (
              <>
                {!isVerification && (
                  <button
                    onClick={handleStartEditing}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm transition-all shadow-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Enter Marks</span>
                  </button>
                )}
                {isVerification && (
                  <button
                    onClick={handleBulkVerify}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-lg text-sm transition-all shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Bulk Lock</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveDraft}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg text-sm transition-all shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Draft</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all font-semibold text-sm"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Marks Sheet Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Roll No</th>
                <th className="py-4 px-6">Student Name</th>
                <th className="py-4 px-6 text-center w-36">Theory Score (Max: 80)</th>
                <th className="py-4 px-6 text-center w-36">Practical Score (Max: 20)</th>
                <th className="py-4 px-6 text-center w-32">Total Obtained</th>
                <th className="py-4 px-6 text-center w-32">Status</th>
                <th className="py-4 px-6 text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {(isEditing ? editedStudents : students).map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-mono font-semibold text-slate-500">{item.rollNo}</td>
                  <td className="py-4 px-6 font-bold text-slate-800">{item.studentName}</td>
                  
                  {/* Theory Marks */}
                  <td className="py-3 px-6 text-center">
                    {isEditing && item.status === 'Draft' ? (
                      <input
                        type="text"
                        value={item.theoryMarks}
                        onChange={(e) => handleInputChange(item.id, 'theoryMarks', e.target.value)}
                        className="w-20 text-center py-1 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="font-semibold text-slate-700">{item.theoryMarks || '—'}</span>
                    )}
                  </td>

                  {/* Practical Marks */}
                  <td className="py-3 px-6 text-center">
                    {isEditing && item.status === 'Draft' ? (
                      <input
                        type="text"
                        value={item.practicalMarks}
                        onChange={(e) => handleInputChange(item.id, 'practicalMarks', e.target.value)}
                        className="w-20 text-center py-1 rounded border border-slate-200 focus:outline-none"
                      />
                    ) : (
                      <span className="font-semibold text-slate-700">{item.practicalMarks || '—'}</span>
                    )}
                  </td>

                  <td className="py-4 px-6 text-center font-black text-slate-900">{item.totalMarks}</td>
                  
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      item.status === 'Verified' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {item.status}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-center">
                    {isVerification ? (
                      item.status === 'Draft' ? (
                        <button
                          onClick={() => handleVerifyMarks(item.id)}
                          disabled={isEditing}
                          className="flex items-center gap-1 bg-slate-950 text-white font-semibold px-2.5 py-1 rounded text-xs hover:bg-slate-800 disabled:opacity-40"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Verify & Lock</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Locked</span>
                      )
                    ) : (
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${item.status === 'Verified' ? 'text-green-600' : 'text-slate-400'}`}>
                        {item.status}
                      </span>
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
}
