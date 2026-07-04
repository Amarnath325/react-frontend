import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  Layers, MapPin, Grid, Users, Search, Plus, Trash2, 
  Eye, Check, X, AlertCircle, RefreshCw, Printer, CheckSquare
} from 'lucide-react';

interface RoomAllocation {
  id: number;
  roomName: string;
  capacity: number;
  examName: string;
  className: string;
  seatRows: number;
  seatCols: number;
  studentRolls: string[]; // Mock list of rolls allocated
}

const INITIAL_ALLOCATIONS: RoomAllocation[] = [
  {
    id: 1,
    roomName: 'Main Examination Hall A',
    capacity: 40,
    examName: 'Half Yearly Examination',
    className: 'Class 10',
    seatRows: 5,
    seatCols: 8,
    studentRolls: Array.from({ length: 40 }, (_, i) => `10A-${String(i + 1).padStart(2, '0')}`)
  },
  {
    id: 2,
    roomName: 'Physics Lecture Hall',
    capacity: 20,
    examName: 'Half Yearly Examination',
    className: 'Class 9',
    seatRows: 4,
    seatCols: 5,
    studentRolls: Array.from({ length: 18 }, (_, i) => `9B-${String(i + 1).padStart(2, '0')}`)
  }
];

const ROOMS = ['Main Examination Hall A', 'Physics Lecture Hall', 'Room 302', 'Room 403', 'Chemistry Lab'];
const CLASSES = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
const EXAMS = ['Quarterly Examination', 'Half Yearly Examination', 'Final Annual Examination'];

import { useLocation } from 'react-router-dom';

export default function ExamSeatingManager() {
  const location = useLocation();
  const isRoomAllocation = location.pathname.includes('room-allocation');

  const [allocations, setAllocations] = useState<RoomAllocation[]>(INITIAL_ALLOCATIONS);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<RoomAllocation | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    roomName: ROOMS[0],
    capacity: 30,
    examName: EXAMS[0],
    className: CLASSES[0],
    seatRows: 5,
    seatCols: 6
  });

  const handleOpenAddModal = () => {
    setFormData({
      roomName: ROOMS[0],
      capacity: 30,
      examName: EXAMS[0],
      className: CLASSES[0],
      seatRows: 5,
      seatCols: 6
    });
    setIsModalOpen(true);
  };

  const handleCreateAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    const computedCapacity = formData.seatRows * formData.seatCols;
    if (computedCapacity > formData.capacity) {
      toast.error(`Matrix capacity (${computedCapacity}) cannot exceed total room capacity (${formData.capacity}).`);
      return;
    }

    const newAllocation: RoomAllocation = {
      id: Date.now(),
      ...formData,
      studentRolls: Array.from({ length: Math.min(computedCapacity, 24) }, (_, i) => `${formData.className.split(' ')[1]}A-${String(i + 1).padStart(2, '0')}`)
    };

    setAllocations(prev => [newAllocation, ...prev]);
    toast.success('Room allocated & seating arrangement generated');
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this seating arrangement and room allocation?')) {
      setAllocations(prev => prev.filter(item => item.id !== id));
      toast.success('Allocation removed successfully');
    }
  };

  const filteredAllocations = allocations.filter(item => {
    return (
      item.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.examName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isRoomAllocation ? 'Exam Room Allocation' : 'Seating Arrangement Manager'}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {isRoomAllocation 
              ? 'Assign classrooms and exam halls to classes, check maximum desk limits and configure seating layouts.' 
              : 'Inspect desk layout grids, search roll number coordinates, and print room seating matrix sheets.'}
          </p>
        </div>
        {isRoomAllocation && (
          <button
            onClick={handleOpenAddModal}
            className="mt-4 md:mt-0 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Allocate Exam Room</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by room name, exam..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50"
          />
        </div>
      </div>

      {/* Grid of room allocations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAllocations.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200/80 rounded-xl py-16 text-center text-slate-500">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-600">No Room Allocations Found</p>
          </div>
        ) : (
          filteredAllocations.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 space-y-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.roomName}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base leading-snug">{item.examName}</h3>
                </div>

                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded text-[10px] font-bold border border-indigo-200">
                  {item.className}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100/80 text-xs font-semibold text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Capacity</span>
                  <span className="text-slate-850 text-sm font-bold">{item.capacity} Seats</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Allocated Rolls</span>
                  <span className="text-slate-850 text-sm font-bold">{item.studentRolls.length} Rolls</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Grid Dimensions</span>
                  <span className="text-slate-850 text-sm font-bold">{item.seatRows} × {item.seatCols}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between">
                <button
                  onClick={() => {
                    setActiveItem(item);
                    setIsLayoutOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold text-xs transition-colors"
                >
                  <Grid className="w-4 h-4" />
                  <span>View Seat Grid Matrix</span>
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                  title="Remove Allocation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Allocation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-lg">Allocate Examination Room</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAllocation} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Examination Name</label>
                <select
                  value={formData.examName}
                  onChange={(e) => setFormData(prev => ({ ...prev, examName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                >
                  {EXAMS.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                </select>
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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Room Name</label>
                  <select
                    value={formData.roomName}
                    onChange={(e) => setFormData(prev => ({ ...prev, roomName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    {ROOMS.map(rm => <option key={rm} value={rm}>{rm}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Seat Rows</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.seatRows}
                    onChange={(e) => setFormData(prev => ({ ...prev, seatRows: parseInt(e.target.value) || 5 }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Seat Columns</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.seatCols}
                    onChange={(e) => setFormData(prev => ({ ...prev, seatCols: parseInt(e.target.value) || 6 }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Room Capacity</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 30 }))}
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
                  Generate Arrangement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid Seating Preview Modal */}
      {isLayoutOpen && activeItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold text-lg">Seat Arrangement Grid Map</h3>
                <p className="text-xs text-blue-100 mt-0.5">{activeItem.roomName} ➔ {activeItem.className}</p>
              </div>
              <button onClick={() => setIsLayoutOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Teacher Desk Mock indicator */}
              <div className="w-full border-2 border-dashed border-slate-200 p-2.5 rounded-lg text-center text-xs font-semibold text-slate-400 bg-slate-50/50 uppercase tracking-widest">
                🗣️ Invigilator Desk / Front Board
              </div>

              {/* Seating Arrangement Matrix Grid */}
              <div 
                className="grid gap-3.5 justify-center max-w-full overflow-x-auto p-4 bg-slate-50 rounded-xl border border-slate-100"
                style={{
                  gridTemplateColumns: `repeat(${activeItem.seatCols}, minmax(70px, 1fr))`
                }}
              >
                {Array.from({ length: activeItem.seatRows }).map((_, rIdx) => 
                  Array.from({ length: activeItem.seatCols }).map((_, cIdx) => {
                    const studentIdx = rIdx * activeItem.seatCols + cIdx;
                    const rollNo = activeItem.studentRolls[studentIdx];
                    
                    return (
                      <div 
                        key={`${rIdx}-${cIdx}`}
                        className={`p-2.5 rounded-lg border text-center text-xs font-bold transition-all shadow-sm ${
                          rollNo 
                            ? 'bg-white text-indigo-700 border-indigo-200 hover:scale-105' 
                            : 'bg-slate-100 text-slate-350 border-slate-200 border-dashed'
                        }`}
                      >
                        <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mb-1 font-mono">
                          R{rIdx + 1}-C{cIdx + 1}
                        </div>
                        <div className="font-bold font-mono">{rollNo || 'VACANT'}</div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Actions footer */}
              <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                <span className="text-xs font-semibold text-slate-400">Total desk capacity: {activeItem.seatRows * activeItem.seatCols} desk slots.</span>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-md transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Seating List</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
