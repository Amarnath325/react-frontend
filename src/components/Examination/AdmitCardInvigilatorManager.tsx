import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  FileText, Users, Calendar, Clock, Plus, Search, Trash2, 
  Eye, Check, X, AlertCircle, RefreshCw, Printer, CheckSquare
} from 'lucide-react';

interface InvigilatorDuty {
  id: number;
  staffName: string;
  roomName: string;
  examName: string;
  examDate: string;
  examTime: string;
  status: 'Assigned' | 'Released';
}

interface StudentAdmitCard {
  id: number;
  studentName: string;
  rollNo: string;
  className: string;
  examName: string;
  admitCardNo: string;
  status: 'Approved' | 'Pending';
}

const INITIAL_DUTIES: InvigilatorDuty[] = [
  { id: 1, staffName: 'Mrs. Anjali Rao', roomName: 'Main Examination Hall A', examName: 'Half Yearly Examination', examDate: '2026-06-28', examTime: '09:00 AM - 10:30 AM', status: 'Assigned' },
  { id: 2, staffName: 'Mr. Amit Patel', roomName: 'Physics Lecture Hall', examName: 'Half Yearly Examination', examDate: '2026-06-29', examTime: '09:00 AM - 10:30 AM', status: 'Assigned' }
];

const INITIAL_ADMIT_CARDS: StudentAdmitCard[] = [
  { id: 101, studentName: 'Aditya Sen', rollNo: '10-A-01', className: 'Class 10', examName: 'Half Yearly Examination', admitCardNo: 'AC-2026-1001', status: 'Approved' },
  { id: 102, studentName: 'Neha Sharma', rollNo: '10-A-08', className: 'Class 10', examName: 'Half Yearly Examination', admitCardNo: 'AC-2026-1008', status: 'Approved' },
  { id: 103, studentName: 'Aarav Gupta', rollNo: '10-A-05', className: 'Class 10', examName: 'Half Yearly Examination', admitCardNo: 'AC-2026-1005', status: 'Pending' }
];

const STAFFS = ['Mrs. Anjali Rao', 'Mr. Amit Patel', 'Mrs. Emily D\'souza', 'Mr. Rajesh Sharma', 'Mr. Sanjay Mehta'];
const ROOMS = ['Main Examination Hall A', 'Physics Lecture Hall', 'Room 302', 'Room 403'];
const EXAMS = ['Quarterly Examination', 'Half Yearly Examination', 'Final Annual Examination'];
const CLASSES = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

import { useLocation } from 'react-router-dom';

export default function AdmitCardInvigilatorManager() {
  const location = useLocation();
  const isAdmitCards = location.pathname.includes('admit-cards');
  const activeTab = isAdmitCards ? 'admit' : 'invigilator';

  const [duties, setDuties] = useState<InvigilatorDuty[]>(INITIAL_DUTIES);
  const [admitCards, setAdmitCards] = useState<StudentAdmitCard[]>(INITIAL_ADMIT_CARDS);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isDutyModalOpen, setIsDutyModalOpen] = useState(false);
  const [isAdmitCardPreviewOpen, setIsAdmitCardPreviewOpen] = useState(false);
  const [selectedAdmitCard, setSelectedAdmitCard] = useState<StudentAdmitCard | null>(null);

  // Duty Form State
  const [dutyForm, setDutyForm] = useState({
    staffName: STAFFS[0],
    roomName: ROOMS[0],
    examName: EXAMS[0],
    examDate: new Date().toISOString().split('T')[0],
    examTime: '09:00 AM - 12:00 PM',
    status: 'Assigned' as 'Assigned' | 'Released'
  });

  const handleOpenDutyModal = () => {
    setDutyForm({
      staffName: STAFFS[0],
      roomName: ROOMS[0],
      examName: EXAMS[0],
      examDate: new Date().toISOString().split('T')[0],
      examTime: '09:00 AM - 12:00 PM',
      status: 'Assigned'
    });
    setIsDutyModalOpen(true);
  };

  const handleCreateDuty = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check conflict: Same invigilator same date and time
    const isConflict = duties.some(d => 
      d.staffName === dutyForm.staffName &&
      d.examDate === dutyForm.examDate &&
      d.examTime === dutyForm.examTime
    );

    if (isConflict) {
      toast.error('Conflict detected: This invigilator is already assigned to another duty at this time.');
      return;
    }

    const newDuty: InvigilatorDuty = {
      id: Date.now(),
      ...dutyForm
    };

    setDuties(prev => [newDuty, ...prev]);
    toast.success('Invigilator duty scheduled successfully');
    setIsDutyModalOpen(false);
  };

  const handleDeleteDuty = (id: number) => {
    if (window.confirm('Delete this invigilator duty assignation?')) {
      setDuties(prev => prev.filter(item => item.id !== id));
      toast.success('Duty removed');
    }
  };

  const handleBulkGenerateAdmitCards = () => {
    if (window.confirm('Generate admit cards for all registered students who are pending?')) {
      setAdmitCards(prev => prev.map(card => {
        if (card.status === 'Pending') {
          return { ...card, status: 'Approved' };
        }
        return card;
      }));
      toast.success('Admit cards generated and approved for all students');
    }
  };

  const handleToggleAdmitStatus = (id: number) => {
    setAdmitCards(prev => prev.map(card => {
      if (card.id === id) {
        const nextStatus = card.status === 'Approved' ? 'Pending' : 'Approved';
        return { ...card, status: nextStatus };
      }
      return card;
    }));
    toast.success('Admit card approval status toggled');
  };

  const filteredAdmitCards = admitCards.filter(item => {
    return (
      item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.admitCardNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredDuties = duties.filter(item => {
    return (
      item.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.roomName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isAdmitCards ? 'Admit Card Management' : 'Invigilator Management'}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {isAdmitCards 
              ? 'Review student hall tickets, approve exam registrations, and print official admit cards.' 
              : 'Schedule teacher invigilation rosters, assign exam classrooms, and manage invigilator duties.'}
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'admit' ? 'Search by student name, card number...' : 'Search by staff, room name...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50"
          />
        </div>

        <div>
          {activeTab === 'admit' ? (
            <button
              onClick={handleBulkGenerateAdmitCards}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all text-xs"
            >
              <span>Bulk Approve Admit Cards</span>
            </button>
          ) : (
            <button
              onClick={handleOpenDutyModal}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Staff Duty</span>
            </button>
          )}
        </div>
      </div>

      {/* Main grids */}
      {activeTab === 'admit' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-4 px-6">Student details</th>
                  <th className="py-4 px-6">Admit Card No.</th>
                  <th className="py-4 px-6">Target Exam</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-center w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAdmitCards.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No admit cards matches the query.
                    </td>
                  </tr>
                ) : (
                  filteredAdmitCards.map(card => (
                    <tr key={card.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{card.studentName}</div>
                        <div className="text-xs text-slate-400">{card.className} — Roll {card.rollNo}</div>
                      </td>
                      <td className="py-4 px-6 font-mono font-semibold text-slate-600">{card.admitCardNo}</td>
                      <td className="py-4 px-6 text-slate-700 font-medium">{card.examName}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          card.status === 'Approved' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {card.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedAdmitCard(card);
                              setIsAdmitCardPreviewOpen(true);
                            }}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded transition-all"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => handleToggleAdmitStatus(card.id)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded transition-all ${
                              card.status === 'Approved' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {card.status === 'Approved' ? 'Hold' : 'Approve'}
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
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-4 px-6">Invigilator Staff</th>
                  <th className="py-4 px-6">Room Allocated</th>
                  <th className="py-4 px-6">Exam Description</th>
                  <th className="py-4 px-6">Date & Timings</th>
                  <th className="py-4 px-6 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDuties.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No invigilator duties configured.
                    </td>
                  </tr>
                ) : (
                  filteredDuties.map(duty => (
                    <tr key={duty.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-800">{duty.staffName}</td>
                      <td className="py-4 px-6 text-slate-700 font-medium">{duty.roomName}</td>
                      <td className="py-4 px-6 text-slate-500">{duty.examName}</td>
                      <td className="py-4 px-6">
                        <div className="text-slate-900 font-semibold">{duty.examDate}</div>
                        <div className="text-xs text-slate-400 font-medium">{duty.examTime}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleDeleteDuty(duty.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Duty Assign Modal */}
      {isDutyModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-lg">Assign Invigilator Duty</h3>
              <button onClick={() => setIsDutyModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDuty} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Invigilator Staff</label>
                <select
                  value={dutyForm.staffName}
                  onChange={(e) => setDutyForm(prev => ({ ...prev, staffName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                >
                  {STAFFS.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Allocated Room</label>
                  <select
                    value={dutyForm.roomName}
                    onChange={(e) => setDutyForm(prev => ({ ...prev, roomName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    {ROOMS.map(rm => <option key={rm} value={rm}>{rm}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Examination Name</label>
                  <select
                    value={dutyForm.examName}
                    onChange={(e) => setDutyForm(prev => ({ ...prev, examName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    {EXAMS.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Duty Date</label>
                  <input
                    type="date"
                    value={dutyForm.examDate}
                    onChange={(e) => setDutyForm(prev => ({ ...prev, examDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Duty Timings</label>
                  <input
                    type="text"
                    value={dutyForm.examTime}
                    onChange={(e) => setDutyForm(prev => ({ ...prev, examTime: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsDutyModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md font-semibold text-sm"
                >
                  Confirm Duty Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admit Card Preview Modal */}
      {isAdmitCardPreviewOpen && selectedAdmitCard && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-lg">Student Hall Admit Card</h3>
              <button onClick={() => setIsAdmitCardPreviewOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Card visual template */}
              <div className="border-2 border-slate-300 p-5 rounded-xl space-y-4 bg-slate-50 shadow-inner relative overflow-hidden">
                {/* Watermark/Grid overlay */}
                <div className="absolute right-0 bottom-0 text-slate-200/50 pointer-events-none translate-x-12 translate-y-12 select-none font-bold text-8xl">
                  EXAM
                </div>

                <div className="flex justify-between items-start border-b pb-3 border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">SPRINGDALE CENTRAL SCHOOL</h4>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Session 2026-2027</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[9px] font-bold">
                    Official Pass
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Student Name:</span>
                    <span className="font-bold text-slate-800">{selectedAdmitCard.studentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Admit Card No:</span>
                    <span className="font-bold text-slate-800 font-mono">{selectedAdmitCard.admitCardNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Class / Roll No:</span>
                    <span className="font-bold text-slate-800">{selectedAdmitCard.className} — Roll {selectedAdmitCard.rollNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Exam Name:</span>
                    <span className="font-bold text-slate-800">{selectedAdmitCard.examName}</span>
                  </div>
                </div>

                <div className="border-t pt-3 border-slate-200 text-[9px] text-slate-450 leading-relaxed font-semibold">
                  <span className="text-slate-600 font-bold block mb-1">Instructions:</span>
                  1. Candidates must arrive at the examination room 15 minutes before time.<br/>
                  2. Carrying electronic calculators or smartphones is strictly prohibited.<br/>
                  3. Students must display this admit card at the desk.
                </div>
              </div>

              {/* Actions footer */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  onClick={() => setIsAdmitCardPreviewOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Hall Pass</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
