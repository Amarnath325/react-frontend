import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  FileText, ShieldCheck, Printer, Eye, Download, Search, 
  Filter, AlertCircle, RefreshCw, X, Award, CheckSquare
} from 'lucide-react';

interface StudentDocRow {
  id: number;
  studentName: string;
  rollNo: string;
  className: string;
  reportCardStatus: 'Generated' | 'Pending';
  tcStatus: 'Eligible' | 'Issued' | 'None';
}

const INITIAL_DOCS: StudentDocRow[] = [
  { id: 101, studentName: 'Aditya Sen', rollNo: '10-A-01', className: 'Class 10', reportCardStatus: 'Generated', tcStatus: 'None' },
  { id: 102, studentName: 'Neha Sharma', rollNo: '10-A-08', className: 'Class 10', reportCardStatus: 'Generated', tcStatus: 'None' },
  { id: 103, studentName: 'Aarav Gupta', rollNo: '10-A-05', className: 'Class 10', reportCardStatus: 'Generated', tcStatus: 'Eligible' },
  { id: 104, studentName: 'Rahul Verma', rollNo: '10-A-15', className: 'Class 10', reportCardStatus: 'Pending', tcStatus: 'None' }
];

const CLASSES = ['Class 10', 'Class 9', 'Class 8'];
const EXAMS = ['Half Yearly Examination', 'Final Annual Examination'];

import { useLocation } from 'react-router-dom';

export default function ReportCardCertificateManager() {
  const location = useLocation();
  const isCertificates = location.pathname.includes('certificates');

  const [students, setStudents] = useState<StudentDocRow[]>(INITIAL_DOCS);
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [selectedExam, setSelectedExam] = useState(EXAMS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Preview Modals
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<StudentDocRow | null>(null);
  const [previewDocType, setPreviewDocType] = useState<'report' | 'tc' | 'character'>('report');

  const handleBulkGenerate = () => {
    setStudents(prev => prev.map(s => ({ ...s, reportCardStatus: 'Generated' })));
    toast.success('Report cards compiled and generated for all students in this class.');
  };

  const handleIssueTC = (id: number) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, tcStatus: 'Issued' };
      }
      return s;
    }));
    toast.success('Transfer Certificate issued and recorded in student file');
  };

  const filteredStudents = students.filter(item => {
    return item.studentName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isCertificates ? 'Certificate Management Desk' : 'Report Card Generation'}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {isCertificates 
              ? 'Issue, track, and print student Transfer Certificates (TC) and character logs.' 
              : 'Compile final marks records, compute grades, and export print-ready student report cards.'}
          </p>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80 mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Exam Term</label>
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

          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Search Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 font-semibold text-slate-700"
              />
            </div>
          </div>

          <div>
            {!isCertificates ? (
              <button
                onClick={handleBulkGenerate}
                className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 rounded-lg text-sm shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Bulk Compile Reports</span>
              </button>
            ) : (
              <div className="text-xs text-slate-450 bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-center font-bold uppercase tracking-wider">
                📄 TC System Active
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Student Docs log */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Roll No</th>
                <th className="py-4 px-6">Student Name</th>
                <th className="py-4 px-6">Class Room</th>
                {!isCertificates && <th className="py-4 px-6 text-center">Report Card Status</th>}
                {isCertificates && <th className="py-4 px-6 text-center">Transfer Certificate</th>}
                <th className="py-4 px-6 text-center w-56">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredStudents.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-mono text-slate-500">{item.rollNo}</td>
                  <td className="py-4 px-6 font-bold text-slate-900">{item.studentName}</td>
                  <td className="py-4 px-6">{item.className}</td>
                  
                  {!isCertificates && (
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.reportCardStatus === 'Generated' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {item.reportCardStatus}
                      </span>
                    </td>
                  )}

                  {isCertificates && (
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.tcStatus === 'Issued' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        item.tcStatus === 'Eligible' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {item.tcStatus}
                      </span>
                    </td>
                  )}

                  <td className="py-4 px-6 text-center">
                    <div className="flex justify-center gap-2">
                      {!isCertificates && (
                        <button
                          onClick={() => {
                            setActiveStudent(item);
                            setPreviewDocType('report');
                            setIsPreviewOpen(true);
                          }}
                          disabled={item.reportCardStatus === 'Pending'}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded transition-all disabled:opacity-40"
                        >
                          Report Card
                        </button>
                      )}
                      
                      {isCertificates && (
                        <button
                          onClick={() => {
                            setActiveStudent(item);
                            setPreviewDocType('tc');
                            setIsPreviewOpen(true);
                          }}
                          disabled={item.tcStatus === 'None'}
                          className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded border border-indigo-200 transition-all disabled:opacity-40"
                        >
                          TC Document
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Preview Modal */}
      {isPreviewOpen && activeStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-lg">
                {previewDocType === 'report' ? 'Academic Report Card' : 'Official Transfer Certificate'}
              </h3>
              <button onClick={() => setIsPreviewOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Document Template Container */}
              <div className="border-4 double border-slate-400 p-6 bg-white font-serif text-slate-800 space-y-6 shadow-inner text-sm relative">
                {previewDocType === 'report' ? (
                  <>
                    {/* Report Card */}
                    <div className="text-center space-y-1 pb-4 border-b-2 border-slate-800">
                      <h2 className="text-xl font-bold font-sans tracking-wide">SPRINGDALE CENTRAL SCHOOL</h2>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-sans font-bold">Annual Academic Performance Sheet</p>
                      <p className="text-xs font-sans font-semibold">Session: 2026-2027</p>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 text-xs font-sans border-b pb-4">
                      <div>Name: <strong className="text-slate-900 font-bold">{activeStudent.studentName}</strong></div>
                      <div>Roll No: <span className="font-bold">{activeStudent.rollNo}</span></div>
                      <div>Class: <span className="font-bold">{activeStudent.className}</span></div>
                      <div>Exam Term: <span className="font-bold">{selectedExam}</span></div>
                    </div>

                    {/* Marks table mock */}
                    <table className="w-full text-left font-sans text-xs border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                          <th className="p-2">Subject Name</th>
                          <th className="p-2 text-center">Theory (80)</th>
                          <th className="p-2 text-center">Practical (20)</th>
                          <th className="p-2 text-center">Total (100)</th>
                          <th className="p-2 text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="p-2 font-semibold">Mathematics</td>
                          <td className="p-2 text-center">72</td>
                          <td className="p-2 text-center">20</td>
                          <td className="p-2 text-center font-bold">92</td>
                          <td className="p-2 text-center font-bold text-green-600">A1</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold">Physics</td>
                          <td className="p-2 text-center">64</td>
                          <td className="p-2 text-center">19</td>
                          <td className="p-2 text-center font-bold">83</td>
                          <td className="p-2 text-center font-bold text-green-600">A2</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold">Chemistry</td>
                          <td className="p-2 text-center">60</td>
                          <td className="p-2 text-center">18</td>
                          <td className="p-2 text-center font-bold">78</td>
                          <td className="p-2 text-center font-bold text-green-600">B1</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="flex justify-between items-end pt-8 font-sans font-semibold text-xs">
                      <div className="text-center w-36 border-t border-slate-300 pt-1 text-slate-500">Class Teacher</div>
                      <div className="text-center w-36 border-t border-slate-300 pt-1 text-slate-500">Controller of Exams</div>
                      <div className="text-center w-36 border-t border-slate-300 pt-1 text-slate-500 font-bold text-slate-700">Principal Seal</div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Transfer Certificate */}
                    <div className="text-center space-y-1 pb-4 border-b-2 border-slate-800">
                      <h2 className="text-xl font-bold font-sans tracking-wide">SPRINGDALE CENTRAL SCHOOL</h2>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-sans font-bold">School Leaving Certificate</p>
                    </div>

                    <div className="space-y-4 text-xs font-serif leading-relaxed text-justify py-4">
                      <p>
                        This is to certify that <strong className="text-slate-900 border-b border-slate-300 px-1">{activeStudent.studentName}</strong>, 
                        son/daughter of Mr./Mrs. <span className="border-b border-slate-300 px-4">S. K. Sen</span>, 
                        was admitted to this school in class <span className="border-b border-slate-300 px-2">Grade 6</span> 
                        and left school on <strong className="border-b border-slate-300 px-2">2026-06-25</strong> with a 
                        character certified as <strong className="border-b border-slate-300 px-2">Outstanding</strong>.
                      </p>
                      <p>
                        All school dues have been cleared. His/Her date of birth according to the school register is 
                        <strong className="border-b border-slate-300 px-2">2011-04-12</strong>.
                      </p>
                    </div>

                    <div className="flex justify-between items-end pt-12 font-sans font-semibold text-xs">
                      <div className="text-center w-36 border-t border-slate-300 pt-1 text-slate-500">Office Clerk</div>
                      <div className="text-center w-36 border-t border-slate-300 pt-1 text-slate-700 font-bold">Principal Signature</div>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all font-semibold text-xs"
                >
                  Close
                </button>
                {previewDocType === 'tc' && activeStudent.tcStatus === 'Eligible' && (
                  <button
                    onClick={() => handleIssueTC(activeStudent.id)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                  >
                    Issue TC Document
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-all shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
