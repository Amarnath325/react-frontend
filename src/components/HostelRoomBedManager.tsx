import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';

// ─── REACT SELECT STYLES & OPTIONS ───────────────────────────────────────────

const selectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    minHeight: '30px',
    height: '30px',
    fontSize: '11px',
    borderRadius: '0.5rem', // rounded-lg
    borderColor: state.isFocused ? '#6366f1' : '#e2e8f0', // indigo-500 : slate-200
    boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#6366f1' : '#cbd5e1', // slate-300
    },
    backgroundColor: '#ffffff',
    minWidth: '140px',
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 8px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0px',
    padding: '0px',
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: '28px',
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    padding: '4px',
    color: '#94a3b8', // slate-400
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  menu: (base: any) => ({
    ...base,
    fontSize: '11px',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // shadow-md
    border: '1px solid #f1f5f9',
    zIndex: 40,
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#4f46e5' // indigo-600
      : state.isFocused
      ? '#e0e7ff' // indigo-50
      : '#ffffff',
    color: state.isSelected ? '#ffffff' : '#334155', // slate-700
    padding: '5px 10px',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#4f46e5',
      color: '#ffffff',
    },
  }),
  singleValue: (base: any) => ({
    ...base,
    color: '#334155', // slate-700
    fontWeight: '600',
  }),
  placeholder: (base: any) => ({
    ...base,
    color: '#94a3b8',
  }),
};

const blockOptions = [
  { value: 'All', label: 'All Blocks' },
  { value: 'Block A (Boys)', label: 'Block A (Boys)' },
  { value: 'Block B (Girls)', label: 'Block B (Girls)' }
];

const floorOptions = [
  { value: 'All', label: 'All Floors' },
  { value: 'Ground Floor', label: 'Ground Floor' },
  { value: 'First Floor', label: 'First Floor' },
  { value: 'Second Floor', label: 'Second Floor' },
  { value: 'Third Floor', label: 'Third Floor' }
];

const roomTypeOptions = [
  { value: 'All', label: 'All Types' },
  { value: 'Single AC', label: 'Single AC' },
  { value: '2-Seater AC', label: '2-Seater AC' },
  { value: '4-Seater AC', label: '4-Seater AC' },
  { value: '2-Seater Non-AC', label: '2-Seater Non-AC' },
  { value: '4-Seater Non-AC', label: '4-Seater Non-AC' },
  { value: 'Dormitory', label: 'Dormitory' }
];

const occupancyOptions = [
  { value: 'All', label: 'All Status' },
  { value: 'Vacant', label: 'Vacant' },
  { value: 'Partial', label: 'Partial' },
  { value: 'Full', label: 'Full' },
  { value: 'Maintenance', label: 'Maintenance' }
];

const historyActionOptions = [
  { value: 'All', label: 'All Actions' },
  { value: 'Allocated', label: 'Allocated' },
  { value: 'Vacated', label: 'Vacated' },
  { value: 'Transferred', label: 'Transferred' },
  { value: 'Swapped', label: 'Swapped' }
];

// Reusable Pagination component
interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemName = 'items',
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 mt-4 gap-3 shadow-sm select-none">
      <div className="text-[10px] text-slate-500 font-semibold font-sans">
        Showing <span className="text-slate-800 font-bold">{startItem}-{endItem}</span> of <span className="text-slate-800 font-bold">{totalItems}</span> {itemName}
      </div>
      <div className="flex items-center gap-1 font-sans">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 py-1.5 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent transition cursor-pointer text-[10px]"
        >
          Previous
        </button>
        {getPageNumbers().map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => typeof p === 'number' && onPageChange(p)}
            disabled={p === '...'}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
              p === currentPage
                ? 'bg-indigo-600 text-white shadow-sm'
                : p === '...'
                ? 'text-slate-400 cursor-default'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2.5 py-1.5 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent transition cursor-pointer text-[10px]"
        >
          Next
        </button>
      </div>
    </div>
  );
};
import {
  Grid3X3, Plus, Search, Download, RefreshCw,
  User, UserPlus, Building2, Layers, Bed,
  AlertCircle, Eye, Edit2, Trash2,
  ArrowLeftRight, FileText,
  BarChart2, Home, Shield, X, Check, LogOut,
  Clock, Wifi, Wind, Droplets, Zap,
  ChevronDown, ChevronUp, Info, Settings
} from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type RoomType = 'Single AC' | '2-Seater AC' | '4-Seater AC' | '2-Seater Non-AC' | '4-Seater Non-AC' | 'Dormitory';
type OccupancyStatus = 'Vacant' | 'Partial' | 'Full' | 'Maintenance';
type BlockName = 'Block A (Boys)' | 'Block B (Girls)';
type FloorName = 'Ground Floor' | 'First Floor' | 'Second Floor' | 'Third Floor';

interface Occupant {
  id: number;
  name: string;
  admission_no: string;
  class_name: string;
  section: string;
  mobile: string;
  father_name: string;
  allocated_since: string;
  bed_no: string;
  photo_initial: string;
}

interface Room {
  id: number;
  room_no: string;
  block: BlockName;
  floor: FloorName;
  floor_index: number;
  room_type: RoomType;
  total_beds: number;
  occupants: Occupant[];
  amenities: string[];
  is_active: boolean;
  is_maintenance: boolean;
  remarks: string | null;
}

interface AllocationHistory {
  id: number;
  room_no: string;
  bed_no: string;
  student_name: string;
  admission_no: string;
  action: 'Allocated' | 'Vacated' | 'Transferred' | 'Swapped';
  date: string;
  by: string;
}

interface SwapRequest {
  fromRoomId: number | null;
  fromBedNo: string;
  fromStudent: Occupant | null;
  toRoomId: number | null;
  toBedNo: string;
  toStudent: Occupant | null;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  AC: <Wind className="w-3 h-3" />,
  WiFi: <Wifi className="w-3 h-3" />,
  Geyser: <Droplets className="w-3 h-3" />,
  Inverter: <Zap className="w-3 h-3" />,
};

const ALL_STUDENTS = [
  { id: 101, name: 'Ravi Shankar', admission_no: 'ADM-2026-0101', class_name: 'Class 11', section: 'A', mobile: '9876543201', father_name: 'Ramesh Shankar' },
  { id: 102, name: 'Akash Mehta', admission_no: 'ADM-2026-0102', class_name: 'Class 10', section: 'B', mobile: '9876543202', father_name: 'Suresh Mehta' },
  { id: 103, name: 'Pooja Yadav', admission_no: 'ADM-2026-0103', class_name: 'Class 12', section: 'A', mobile: '9876543203', father_name: 'Mohan Yadav' },
  { id: 104, name: 'Sneha Gupta', admission_no: 'ADM-2026-0104', class_name: 'Class 9', section: 'C', mobile: '9876543204', father_name: 'Dinesh Gupta' },
  { id: 105, name: 'Karan Joshi', admission_no: 'ADM-2026-0105', class_name: 'Class 11', section: 'B', mobile: '9876543205', father_name: 'Vijay Joshi' },
  { id: 106, name: 'Mina Thakur', admission_no: 'ADM-2026-0106', class_name: 'Class 10', section: 'A', mobile: '9876543206', father_name: 'Suresh Thakur' },
];

const generateRooms = (): Room[] => {
  const rooms: Room[] = [];
  let id = 1;

  // Block A – Boys – 3 floors, 6 rooms each
  const blockaRooms: { no: string; type: RoomType; beds: number; floor: FloorName; fi: number; amenities: string[] }[] = [
    { no: 'A-101', type: '2-Seater AC', beds: 2, floor: 'Ground Floor', fi: 0, amenities: ['AC', 'WiFi', 'Geyser'] },
    { no: 'A-102', type: '2-Seater AC', beds: 2, floor: 'Ground Floor', fi: 0, amenities: ['AC', 'WiFi'] },
    { no: 'A-103', type: '4-Seater Non-AC', beds: 4, floor: 'Ground Floor', fi: 0, amenities: ['WiFi', 'Inverter'] },
    { no: 'A-104', type: '4-Seater Non-AC', beds: 4, floor: 'Ground Floor', fi: 0, amenities: ['WiFi'] },
    { no: 'A-105', type: 'Single AC', beds: 1, floor: 'Ground Floor', fi: 0, amenities: ['AC', 'WiFi', 'Geyser', 'Inverter'] },
    { no: 'A-106', type: '2-Seater Non-AC', beds: 2, floor: 'Ground Floor', fi: 0, amenities: ['Inverter'] },
    { no: 'A-201', type: '2-Seater AC', beds: 2, floor: 'First Floor', fi: 1, amenities: ['AC', 'WiFi', 'Geyser'] },
    { no: 'A-202', type: '4-Seater AC', beds: 4, floor: 'First Floor', fi: 1, amenities: ['AC', 'WiFi', 'Geyser', 'Inverter'] },
    { no: 'A-203', type: '4-Seater Non-AC', beds: 4, floor: 'First Floor', fi: 1, amenities: ['WiFi'] },
    { no: 'A-204', type: '2-Seater Non-AC', beds: 2, floor: 'First Floor', fi: 1, amenities: ['WiFi', 'Inverter'] },
    { no: 'A-205', type: '4-Seater Non-AC', beds: 4, floor: 'First Floor', fi: 1, amenities: ['WiFi'] },
    { no: 'A-206', type: 'Single AC', beds: 1, floor: 'First Floor', fi: 1, amenities: ['AC', 'WiFi', 'Geyser'] },
    { no: 'A-301', type: 'Dormitory', beds: 8, floor: 'Second Floor', fi: 2, amenities: ['WiFi', 'Inverter'] },
    { no: 'A-302', type: '4-Seater AC', beds: 4, floor: 'Second Floor', fi: 2, amenities: ['AC', 'WiFi'] },
    { no: 'A-303', type: '2-Seater AC', beds: 2, floor: 'Second Floor', fi: 2, amenities: ['AC', 'WiFi', 'Geyser'] },
    { no: 'A-304', type: '4-Seater Non-AC', beds: 4, floor: 'Second Floor', fi: 2, amenities: ['WiFi'] },
    { no: 'A-305', type: '2-Seater Non-AC', beds: 2, floor: 'Second Floor', fi: 2, amenities: ['Inverter'] },
    { no: 'A-306', type: 'Single AC', beds: 1, floor: 'Second Floor', fi: 2, amenities: ['AC', 'WiFi', 'Geyser', 'Inverter'] },
  ];

  const blockbRooms: { no: string; type: RoomType; beds: number; floor: FloorName; fi: number; amenities: string[] }[] = [
    { no: 'B-101', type: '2-Seater AC', beds: 2, floor: 'Ground Floor', fi: 0, amenities: ['AC', 'WiFi', 'Geyser'] },
    { no: 'B-102', type: '2-Seater AC', beds: 2, floor: 'Ground Floor', fi: 0, amenities: ['AC', 'WiFi'] },
    { no: 'B-103', type: '4-Seater Non-AC', beds: 4, floor: 'Ground Floor', fi: 0, amenities: ['WiFi'] },
    { no: 'B-104', type: 'Single AC', beds: 1, floor: 'Ground Floor', fi: 0, amenities: ['AC', 'WiFi', 'Geyser', 'Inverter'] },
    { no: 'B-105', type: '2-Seater Non-AC', beds: 2, floor: 'Ground Floor', fi: 0, amenities: ['Inverter'] },
    { no: 'B-106', type: '4-Seater AC', beds: 4, floor: 'Ground Floor', fi: 0, amenities: ['AC', 'WiFi', 'Inverter'] },
    { no: 'B-201', type: '2-Seater AC', beds: 2, floor: 'First Floor', fi: 1, amenities: ['AC', 'WiFi', 'Geyser'] },
    { no: 'B-202', type: '4-Seater AC', beds: 4, floor: 'First Floor', fi: 1, amenities: ['AC', 'WiFi', 'Geyser', 'Inverter'] },
    { no: 'B-203', type: '4-Seater Non-AC', beds: 4, floor: 'First Floor', fi: 1, amenities: ['WiFi'] },
    { no: 'B-204', type: '2-Seater Non-AC', beds: 2, floor: 'First Floor', fi: 1, amenities: ['WiFi', 'Inverter'] },
    { no: 'B-205', type: 'Dormitory', beds: 6, floor: 'First Floor', fi: 1, amenities: ['WiFi'] },
    { no: 'B-206', type: 'Single AC', beds: 1, floor: 'First Floor', fi: 1, amenities: ['AC', 'WiFi', 'Geyser'] },
    { no: 'B-301', type: '4-Seater AC', beds: 4, floor: 'Second Floor', fi: 2, amenities: ['AC', 'WiFi', 'Geyser'] },
    { no: 'B-302', type: '2-Seater AC', beds: 2, floor: 'Second Floor', fi: 2, amenities: ['AC', 'WiFi'] },
    { no: 'B-303', type: '4-Seater Non-AC', beds: 4, floor: 'Second Floor', fi: 2, amenities: ['WiFi'] },
    { no: 'B-304', type: '2-Seater Non-AC', beds: 2, floor: 'Second Floor', fi: 2, amenities: ['Inverter'] },
    { no: 'B-305', type: '2-Seater AC', beds: 2, floor: 'Second Floor', fi: 2, amenities: ['AC', 'WiFi', 'Geyser'] },
    { no: 'B-306', type: 'Single AC', beds: 1, floor: 'Second Floor', fi: 2, amenities: ['AC', 'WiFi', 'Geyser', 'Inverter'] },
  ];

  // Sample occupants for some rooms
  const sampleOccupants: Record<string, Partial<Occupant>[]> = {
    'A-101': [{ id: 1, name: 'Amit Kumar', admission_no: 'ADM-2026-0042', class_name: 'Class 11', section: 'A', mobile: '9876543210', father_name: 'Ramesh Kumar', allocated_since: '2026-04-01', bed_no: 'Bed-01', photo_initial: 'A' }],
    'A-102': [
      { id: 2, name: 'Rohan Sharma', admission_no: 'ADM-2026-0058', class_name: 'Class 10', section: 'B', mobile: '9123456789', father_name: 'Suresh Sharma', allocated_since: '2026-04-01', bed_no: 'Bed-01', photo_initial: 'R' },
      { id: 3, name: 'Vikram Patel', admission_no: 'ADM-2026-0033', class_name: 'Class 12', section: 'A', mobile: '9988776655', father_name: 'Mahesh Patel', allocated_since: '2026-04-05', bed_no: 'Bed-02', photo_initial: 'V' },
    ],
    'A-103': [
      { id: 4, name: 'Rahul Singh', admission_no: 'ADM-2026-0071', class_name: 'Class 9', section: 'C', mobile: '9876501234', father_name: 'Arvind Singh', allocated_since: '2026-04-02', bed_no: 'Bed-01', photo_initial: 'R' },
      { id: 5, name: 'Siddharth Roy', admission_no: 'ADM-2026-0095', class_name: 'Class 11', section: 'B', mobile: '9123456780', father_name: 'Tarun Roy', allocated_since: '2026-04-03', bed_no: 'Bed-02', photo_initial: 'S' },
    ],
    'A-202': [
      { id: 6, name: 'Rajesh Verma', admission_no: 'ADM-2026-0012', class_name: 'Class 12', section: 'A', mobile: '9871234567', father_name: 'Naresh Verma', allocated_since: '2026-04-01', bed_no: 'Bed-01', photo_initial: 'R' },
      { id: 7, name: 'Karthik Nair', admission_no: 'ADM-2026-0019', class_name: 'Class 10', section: 'B', mobile: '9988001122', father_name: 'Gopalan Nair', allocated_since: '2026-04-01', bed_no: 'Bed-02', photo_initial: 'K' },
      { id: 8, name: 'Deepak Jha', admission_no: 'ADM-2026-0027', class_name: 'Class 11', section: 'A', mobile: '9123001122', father_name: 'Binod Jha', allocated_since: '2026-04-08', bed_no: 'Bed-03', photo_initial: 'D' },
    ],
    'B-101': [
      { id: 9, name: 'Priya Gupta', admission_no: 'ADM-2026-0021', class_name: 'Class 10', section: 'A', mobile: '9988112233', father_name: 'Rakesh Gupta', allocated_since: '2026-04-01', bed_no: 'Bed-01', photo_initial: 'P' },
    ],
    'B-102': [
      { id: 10, name: 'Anjali Sharma', admission_no: 'ADM-2026-0084', class_name: 'Class 11', section: 'B', mobile: '9871122334', father_name: 'Dinesh Sharma', allocated_since: '2026-04-01', bed_no: 'Bed-01', photo_initial: 'A' },
      { id: 11, name: 'Neha Verma', admission_no: 'ADM-2026-0018', class_name: 'Class 12', section: 'A', mobile: '9910203040', father_name: 'Alok Verma', allocated_since: '2026-04-02', bed_no: 'Bed-02', photo_initial: 'N' },
    ],
    'B-201': [
      { id: 12, name: 'Kavya Reddy', admission_no: 'ADM-2026-0062', class_name: 'Class 9', section: 'C', mobile: '9871122900', father_name: 'Suresh Reddy', allocated_since: '2026-04-01', bed_no: 'Bed-01', photo_initial: 'K' },
    ],
    'B-202': [
      { id: 13, name: 'Sana Khan', admission_no: 'ADM-2026-0078', class_name: 'Class 10', section: 'B', mobile: '9990011223', father_name: 'Ibrahim Khan', allocated_since: '2026-04-01', bed_no: 'Bed-01', photo_initial: 'S' },
      { id: 14, name: 'Ritika Sinha', admission_no: 'ADM-2026-0045', class_name: 'Class 11', section: 'A', mobile: '9880011223', father_name: 'Arun Sinha', allocated_since: '2026-04-03', bed_no: 'Bed-02', photo_initial: 'R' },
      { id: 15, name: 'Tanvi More', admission_no: 'ADM-2026-0091', class_name: 'Class 12', section: 'C', mobile: '9870011223', father_name: 'Sudhir More', allocated_since: '2026-04-05', bed_no: 'Bed-03', photo_initial: 'T' },
      { id: 16, name: 'Pallavi Desai', admission_no: 'ADM-2026-0053', class_name: 'Class 9', section: 'B', mobile: '9860011223', father_name: 'Yash Desai', allocated_since: '2026-04-06', bed_no: 'Bed-04', photo_initial: 'P' },
    ],
    'A-105': [{ id: 17, name: 'Aarav Mehta', admission_no: 'ADM-2026-0009', class_name: 'Class 12', section: 'A', mobile: '9850011223', father_name: 'Nirav Mehta', allocated_since: '2026-04-01', bed_no: 'Bed-01', photo_initial: 'A' }],
    'B-104': [{ id: 18, name: 'Ishita Roy', admission_no: 'ADM-2026-0037', class_name: 'Class 11', section: 'B', mobile: '9840011223', father_name: 'Subhash Roy', allocated_since: '2026-04-01', bed_no: 'Bed-01', photo_initial: 'I' }],
  };

  const maintenanceRooms = new Set(['A-303', 'B-303']);

  [...blockaRooms, ...blockbRooms].forEach(r => {
    const block: BlockName = r.no.startsWith('A') ? 'Block A (Boys)' : 'Block B (Girls)';
    const occ = (sampleOccupants[r.no] || []) as Occupant[];
    rooms.push({
      id: id++,
      room_no: r.no,
      block,
      floor: r.floor,
      floor_index: r.fi,
      room_type: r.type,
      total_beds: r.beds,
      occupants: occ,
      amenities: r.amenities,
      is_active: !maintenanceRooms.has(r.no),
      is_maintenance: maintenanceRooms.has(r.no),
      remarks: maintenanceRooms.has(r.no) ? 'Under maintenance – plumbing work in progress' : null,
    });
  });
  return rooms;
};

const INITIAL_ROOMS = generateRooms();

const MOCK_HISTORY: AllocationHistory[] = [
  { id: 1, room_no: 'A-102', bed_no: 'Bed-01', student_name: 'Rohan Sharma', admission_no: 'ADM-2026-0058', action: 'Allocated', date: '2026-04-01', by: 'Admin' },
  { id: 2, room_no: 'B-202', bed_no: 'Bed-04', student_name: 'Pallavi Desai', admission_no: 'ADM-2026-0053', action: 'Allocated', date: '2026-04-06', by: 'Warden' },
  { id: 3, room_no: 'A-104', bed_no: 'Bed-02', student_name: 'Mohit Sood', admission_no: 'ADM-2026-0066', action: 'Vacated', date: '2026-05-20', by: 'Admin' },
  { id: 4, room_no: 'A-201', bed_no: 'Bed-01', student_name: 'Sundar Pichai', admission_no: 'ADM-2026-0007', action: 'Transferred', date: '2026-05-25', by: 'Admin' },
  { id: 5, room_no: 'B-101', bed_no: 'Bed-01', student_name: 'Priya Gupta', admission_no: 'ADM-2026-0021', action: 'Allocated', date: '2026-04-01', by: 'Warden' },
  { id: 6, room_no: 'B-103', bed_no: 'Bed-03', student_name: 'Divya Nair', admission_no: 'ADM-2026-0039', action: 'Vacated', date: '2026-06-10', by: 'Admin' },
  { id: 7, room_no: 'A-202', bed_no: 'Bed-03', student_name: 'Deepak Jha', admission_no: 'ADM-2026-0027', action: 'Swapped', date: '2026-06-15', by: 'Admin' },
  { id: 8, room_no: 'B-205', bed_no: 'Bed-05', student_name: 'Sana Khan', admission_no: 'ADM-2026-0078', action: 'Transferred', date: '2026-06-18', by: 'Warden' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const getOccupancyStatus = (room: Room): OccupancyStatus => {
  if (room.is_maintenance) return 'Maintenance';
  if (room.occupants.length === 0) return 'Vacant';
  if (room.occupants.length >= room.total_beds) return 'Full';
  return 'Partial';
};

const occupancyColor = (status: OccupancyStatus) => {
  switch (status) {
    case 'Vacant': return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    case 'Partial': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 border-amber-200' };
    case 'Full': return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500', badge: 'bg-rose-100 text-rose-700 border-rose-200' };
    case 'Maintenance': return { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-500', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-500 border-slate-200' };
  }
};

const roomTypeShort = (type: RoomType) => {
  const map: Record<RoomType, string> = {
    'Single AC': '1S-AC', '2-Seater AC': '2S-AC', '4-Seater AC': '4S-AC',
    '2-Seater Non-AC': '2S', '4-Seater Non-AC': '4S', 'Dormitory': 'DORM'
  };
  return map[type];
};

const actionColor = (action: AllocationHistory['action']) => {
  switch (action) {
    case 'Allocated': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Vacated': return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Transferred': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Swapped': return 'bg-purple-50 text-purple-700 border-purple-200';
  }
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

// Individual Bed Slot in the bed grid
const BedSlot: React.FC<{
  bedNo: string;
  occupant?: Occupant;
  onAllocate: () => void;
  onVacate: (occupant: Occupant) => void;
  onViewOccupant: (occupant: Occupant) => void;
  onSelectForSwap: (bedNo: string, occupant?: Occupant) => void;
  swapHighlight: boolean;
}> = ({ bedNo, occupant, onAllocate, onVacate, onViewOccupant, onSelectForSwap, swapHighlight }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`relative rounded-xl border-2 p-3 transition-all duration-200 cursor-pointer group
        ${swapHighlight ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-300 ring-offset-1' :
        occupant
          ? 'border-blue-200 bg-blue-50 hover:border-blue-300 hover:shadow-md'
          : 'border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-400'
        }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => occupant ? onViewOccupant(occupant) : onAllocate()}
    >
      {/* Bed number label */}
      <div className={`text-[8px] font-bold uppercase tracking-wider mb-2 ${occupant ? 'text-blue-500' : 'text-emerald-500'}`}>
        {bedNo}
      </div>

      {occupant ? (
        <div>
          {/* Avatar */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 shadow-sm">
              {occupant.photo_initial}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-800 text-[10px] truncate leading-tight">{occupant.name}</div>
              <div className="text-[8px] text-slate-400 font-mono truncate">{occupant.admission_no}</div>
            </div>
          </div>
          <div className="text-[9px] text-slate-500">{occupant.class_name} · Sec {occupant.section}</div>
          <div className="text-[8px] text-slate-400 mt-0.5">Since {occupant.allocated_since}</div>

          {/* Hover actions */}
          {hovered && (
            <div className="absolute top-1.5 right-1.5 flex gap-1 animate-in fade-in duration-150">
              <button
                onClick={e => { e.stopPropagation(); onSelectForSwap(bedNo, occupant); }}
                className="p-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition cursor-pointer shadow-sm"
                title="Select for Swap"
              >
                <ArrowLeftRight className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onVacate(occupant); }}
                className="p-1 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition cursor-pointer shadow-sm"
                title="Vacate Bed"
              >
                <LogOut className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center py-1">
          <div className="w-7 h-7 rounded-full border-2 border-dashed border-emerald-400 flex items-center justify-center mb-1">
            <Plus className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-[9px] text-emerald-600 font-bold">Vacant</div>
          <div className="text-[8px] text-emerald-500 mt-0.5">Click to assign</div>
        </div>
      )}
    </div>
  );
};

// Room Card for the grid view
const RoomCard: React.FC<{
  room: Room;
  onAllocateBed: (room: Room, bedNo: string) => void;
  onVacateBed: (room: Room, occupant: Occupant) => void;
  onViewRoom: (room: Room) => void;
  onViewOccupant: (occupant: Occupant) => void;
  onSelectForSwap: (room: Room, bedNo: string, occupant?: Occupant) => void;
  swapRoomId: number | null;
  swapBedNo: string;
}> = ({ room, onAllocateBed, onVacateBed, onViewRoom, onViewOccupant, onSelectForSwap, swapRoomId, swapBedNo }) => {
  const [expanded, setExpanded] = useState(false);
  const status = getOccupancyStatus(room);
  const colors = occupancyColor(status);
  const vacantCount = room.total_beds - room.occupants.length;

  // Generate all bed slots
  const beds = Array.from({ length: room.total_beds }, (_, i) => {
    const bedNo = `Bed-${String(i + 1).padStart(2, '0')}`;
    return { bedNo, occupant: room.occupants.find(o => o.bed_no === bedNo) };
  });

  return (
    <div className={`bg-white border-2 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden
      ${colors.border} ${room.is_maintenance ? 'opacity-70' : ''}`}>
      {/* Card Header */}
      <div className={`${colors.bg} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${colors.dot} flex-shrink-0`} />
          <div>
            <div className="font-bold text-slate-900 text-[13px] leading-tight">{room.room_no}</div>
            <div className="text-[9px] text-slate-500 font-medium">{room.floor}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${colors.badge}`}>{status}</span>
          <span className="text-[8px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{roomTypeShort(room.room_type)}</span>
          <button onClick={() => onViewRoom(room)} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white/60 rounded-md transition cursor-pointer" title="Room Details">
            <Eye className="w-3 h-3" />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white/60 rounded-md transition cursor-pointer">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Occupancy bar */}
      <div className="px-4 pt-2.5 pb-1">
        <div className="flex items-center justify-between text-[9px] font-semibold text-slate-500 mb-1">
          <span>{room.occupants.length}/{room.total_beds} beds</span>
          <span className="text-slate-400">{vacantCount} vacant</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${status === 'Full' ? 'bg-rose-500' : status === 'Partial' ? 'bg-amber-400' : status === 'Maintenance' ? 'bg-slate-400' : 'bg-emerald-400'}`}
            style={{ width: `${room.total_beds > 0 ? (room.occupants.length / room.total_beds) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Amenities */}
      <div className="px-4 pb-2 flex items-center gap-1.5 flex-wrap">
        {room.amenities.map(a => (
          <span key={a} className="flex items-center gap-0.5 text-[8px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
            {AMENITY_ICONS[a]} {a}
          </span>
        ))}
        {room.is_maintenance && (
          <span className="flex items-center gap-0.5 text-[8px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
            <AlertCircle className="w-2.5 h-2.5" /> Maintenance
          </span>
        )}
      </div>

      {/* Bed Grid – always shown */}
      <div className={`px-3 pb-3 grid gap-2 ${room.total_beds <= 2 ? 'grid-cols-2' : room.total_beds <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {beds.map(({ bedNo, occupant }) => (
          <BedSlot
            key={bedNo}
            bedNo={bedNo}
            occupant={occupant}
            onAllocate={() => !room.is_maintenance && onAllocateBed(room, bedNo)}
            onVacate={(occ) => onVacateBed(room, occ)}
            onViewOccupant={onViewOccupant}
            onSelectForSwap={(b, o) => onSelectForSwap(room, b, o)}
            swapHighlight={swapRoomId === room.id && swapBedNo === bedNo}
          />
        ))}
      </div>

      {/* Expanded info */}
      {expanded && room.remarks && (
        <div className="px-4 pb-3 text-[9px] text-slate-500 bg-amber-50 border-t border-amber-100 py-2 flex items-start gap-1.5">
          <Info className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
          {room.remarks}
        </div>
      )}
    </div>
  );
};

// ─── MODALS ───────────────────────────────────────────────────────────────────

// Allocate Bed Modal
const AllocateBedModal: React.FC<{
  room: Room;
  bedNo: string;
  availableStudents: { id: number; name: string; admission_no: string; class_name: string; section: string }[];
  onClose: () => void;
  onAllocate: (roomId: number, bedNo: string, studentId: number, remarks: string) => void;
}> = ({ room, bedNo, availableStudents, onClose, onAllocate }) => {
  const [studentId, setStudentId] = useState<number | ''>('');
  const [searchQ, setSearchQ] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [allocationDate] = useState(new Date().toISOString().split('T')[0]);

  const filtered = availableStudents.filter(s =>
    !searchQ || s.name.toLowerCase().includes(searchQ.toLowerCase()) || s.admission_no.toLowerCase().includes(searchQ.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) { toast.error('Please select a student'); return; }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onAllocate(room.id, bedNo, studentId as number, remarks);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><UserPlus className="w-4 h-4" /></div>
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Allocate Bed</div>
              <div className="font-bold text-slate-900">Room {room.room_no} · {bedNo}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Room info banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Room', val: room.room_no },
              { label: 'Bed', val: bedNo },
              { label: 'Type', val: roomTypeShort(room.room_type) },
            ].map(item => (
              <div key={item.label}>
                <div className="text-[8px] text-blue-400 font-bold uppercase">{item.label}</div>
                <div className="font-bold text-blue-800 font-mono text-[11px]">{item.val}</div>
              </div>
            ))}
          </div>

          {/* Student Search */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Search & Select Student *</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} type="text"
                className="w-full pl-9 pr-4 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Search by name or admission no..." />
            </div>
            <div className="border border-slate-200 rounded-xl max-h-40 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-[10px]">No eligible students found</div>
              ) : filtered.map(s => (
                <label key={s.id}
                  className={`flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition ${studentId === s.id ? 'bg-emerald-50' : ''}`}>
                  <input type="radio" name="student" value={s.id} checked={studentId === s.id} onChange={() => setStudentId(s.id)} className="w-3.5 h-3.5 accent-emerald-600" />
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 text-[11px] truncate">{s.name}</div>
                    <div className="text-[9px] text-slate-400 font-mono">{s.admission_no} · {s.class_name} {s.section}</div>
                  </div>
                  {studentId === s.id && <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                </label>
              ))}
            </div>
          </div>

          {/* Date & Remarks */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Allocation Date</label>
              <input type="date" defaultValue={allocationDate} className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Remarks (Optional)</label>
              <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Prefers lower bunk" />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 text-slate-600 font-bold rounded-lg text-[11px] hover:bg-slate-50 transition cursor-pointer">Cancel</button>
            <button type="submit" disabled={submitting || !studentId}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Allocating...</> : <><Check className="w-3.5 h-3.5" /> Allocate Bed</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Student / Occupant Detail Modal
const OccupantModal: React.FC<{
  occupant: Occupant;
  room: Room;
  onClose: () => void;
  onVacate: (occupant: Occupant) => void;
}> = ({ occupant, room, onClose, onVacate }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><User className="w-4 h-4" /></div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Occupant Details</div>
            <div className="font-bold text-slate-900">{occupant.bed_no}</div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
      </div>
      <div className="p-5">
        {/* Avatar */}
        <div className="flex items-center gap-3.5 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-md">
            {occupant.photo_initial}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-[14px]">{occupant.name}</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{occupant.admission_no}</div>
            <div className="text-[10px] text-blue-600 font-semibold mt-0.5">{occupant.class_name} · Section {occupant.section}</div>
          </div>
        </div>

        <div className="space-y-2.5 text-[11px]">
          {[
            { label: 'Room No', val: room.room_no, mono: true },
            { label: 'Bed Assigned', val: occupant.bed_no, mono: true },
            { label: 'Block', val: room.block },
            { label: 'Floor', val: room.floor },
            { label: 'Room Type', val: room.room_type },
            { label: 'Mobile', val: occupant.mobile, mono: true },
            { label: "Father's Name", val: occupant.father_name },
            { label: 'Allocated Since', val: occupant.allocated_since },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="text-slate-400 font-semibold w-28 flex-shrink-0">{item.label}</div>
              <div className={`text-slate-800 font-bold ${item.mono ? 'font-mono' : ''}`}>{item.val}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2 border border-slate-200 text-slate-600 font-bold rounded-lg text-[11px] hover:bg-slate-50 transition cursor-pointer">Close</button>
          <button onClick={() => { onClose(); onVacate(occupant); }}
            className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer flex items-center justify-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" /> Vacate Bed
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Room Detail / Setup Modal
const RoomDetailModal: React.FC<{
  room: Room | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (data: Partial<Room>) => void;
}> = ({ room, isNew, onClose, onSave }) => {
  const [roomNo, setRoomNo] = useState(room?.room_no || '');
  const [block, setBlock] = useState<BlockName>(room?.block || 'Block A (Boys)');
  const [floor, setFloor] = useState<FloorName>(room?.floor || 'Ground Floor');
  const [roomType, setRoomType] = useState<RoomType>(room?.room_type || '2-Seater AC');
  const [amenities, setAmenities] = useState<string[]>(room?.amenities || []);
  const [isMaintenance, setIsMaintenance] = useState(room?.is_maintenance || false);
  const [remarks, setRemarks] = useState(room?.remarks || '');
  const [submitting, setSubmitting] = useState(false);

  const bedCountMap: Record<RoomType, number> = {
    'Single AC': 1, '2-Seater AC': 2, '4-Seater AC': 4,
    '2-Seater Non-AC': 2, '4-Seater Non-AC': 4, 'Dormitory': 8
  };

  const toggleAmenity = (a: string) =>
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNo.trim()) { toast.error('Please enter a room number'); return; }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onSave({ room_no: roomNo, block, floor, room_type: roomType, total_beds: bedCountMap[roomType], amenities, is_maintenance: isMaintenance, remarks: remarks || null, is_active: !isMaintenance, occupants: room?.occupants || [] });
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 animate-in slide-in-from-bottom-4 duration-300 max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Home className="w-4 h-4" /></div>
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{isNew ? 'Add New Room' : 'Edit Room'}</div>
              <div className="font-bold text-slate-900">{isNew ? 'Room Setup' : `Room ${room?.room_no}`}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Room Number *</label>
              <input value={roomNo} onChange={e => setRoomNo(e.target.value)} type="text" required
                className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                placeholder="e.g. A-407" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Block / Wing</label>
              <select value={block} onChange={e => setBlock(e.target.value as BlockName)}
                className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>Block A (Boys)</option>
                <option>Block B (Girls)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Floor</label>
              <select value={floor} onChange={e => setFloor(e.target.value as FloorName)}
                className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor'].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Room Type</label>
              <select value={roomType} onChange={e => setRoomType(e.target.value as RoomType)}
                className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {(['Single AC', '2-Seater AC', '4-Seater AC', '2-Seater Non-AC', '4-Seater Non-AC', 'Dormitory'] as RoomType[]).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-2">Bed Capacity</label>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <Bed className="w-4 h-4 text-indigo-500" />
              <span className="font-bold text-indigo-800">{bedCountMap[roomType]} beds</span>
              <span className="text-[10px] text-indigo-500">(auto-set by room type)</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-2">Amenities</label>
            <div className="grid grid-cols-4 gap-2">
              {['AC', 'WiFi', 'Geyser', 'Inverter'].map(a => (
                <label key={a} className={`flex items-center gap-1.5 justify-center py-2 px-2 rounded-xl border cursor-pointer transition text-[10px] font-bold
                  ${amenities.includes(a) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  <input type="checkbox" checked={amenities.includes(a)} onChange={() => toggleAmenity(a)} className="sr-only" />
                  {AMENITY_ICONS[a]} {a}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={`relative w-9 h-5 rounded-full transition-colors ${isMaintenance ? 'bg-amber-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isMaintenance ? 'translate-x-4' : 'translate-x-0.5'}`} onClick={() => setIsMaintenance(!isMaintenance)} />
              </div>
              <span className="text-[11px] font-bold text-slate-700">Under Maintenance</span>
            </label>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Remarks</label>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2}
              className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Any notes about this room..." />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 text-slate-600 font-bold rounded-lg text-[11px] hover:bg-slate-50 transition cursor-pointer">Cancel</button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...</> : <><Check className="w-3.5 h-3.5" /> {isNew ? 'Create Room' : 'Save Changes'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Swap Beds Modal
const SwapBedsModal: React.FC<{
  swap: SwapRequest;
  rooms: Room[];
  onClose: () => void;
  onConfirm: () => void;
  onSelectTarget: (room: Room, bedNo: string, occupant?: Occupant) => void;
}> = ({ swap, rooms, onClose, onConfirm, onSelectTarget }) => {
  const [searchQ, setSearchQ] = useState('');
  const [selectedTargetRoom, setSelectedTargetRoom] = useState<Room | null>(null);

  const filteredRooms = rooms.filter(r =>
    !searchQ || r.room_no.toLowerCase().includes(searchQ.toLowerCase()) || r.block.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><ArrowLeftRight className="w-4 h-4" /></div>
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Bed Swap</div>
              <div className="font-bold text-slate-900">Select Target Bed to Swap</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* From info */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="text-[9px] font-bold text-purple-400 uppercase mb-2">From (Selected)</div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center font-bold shadow">
                {swap.fromStudent?.photo_initial || '?'}
              </div>
              <div>
                <div className="font-bold text-slate-900">{swap.fromStudent?.name || 'Vacant Bed'}</div>
                <div className="text-[9px] text-slate-500 font-mono">{swap.fromStudent?.admission_no}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="font-mono font-bold text-purple-700">Room {rooms.find(r => r.id === swap.fromRoomId)?.room_no}</div>
                <div className="text-[9px] text-slate-500">{swap.fromBedNo}</div>
              </div>
            </div>
          </div>

          {/* Target selection */}
          <div>
            <div className="text-[11px] font-bold text-slate-700 mb-2">Select Target Bed</div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Filter rooms..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {filteredRooms.filter(r => r.id !== swap.fromRoomId).map(r => {
                const beds = Array.from({ length: r.total_beds }, (_, i) => {
                  const bn = `Bed-${String(i + 1).padStart(2, '0')}`;
                  return { bedNo: bn, occupant: r.occupants.find(o => o.bed_no === bn) };
                });
                return (
                  <div key={r.id} className={`border rounded-xl overflow-hidden transition ${selectedTargetRoom?.id === r.id ? 'border-purple-400 ring-2 ring-purple-200' : 'border-slate-200'}`}>
                    <div className="bg-slate-50 px-3 py-2 flex items-center justify-between cursor-pointer" onClick={() => setSelectedTargetRoom(selectedTargetRoom?.id === r.id ? null : r)}>
                      <div className="font-bold text-slate-800 font-mono">{r.room_no}</div>
                      <div className="text-[9px] text-slate-500">{r.occupants.length}/{r.total_beds} beds</div>
                    </div>
                    {selectedTargetRoom?.id === r.id && (
                      <div className={`p-2 grid gap-1.5 ${r.total_beds <= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                        {beds.map(({ bedNo, occupant }) => (
                          <button key={bedNo} onClick={() => onSelectTarget(r, bedNo, occupant)}
                            className={`text-left p-2 rounded-lg border text-[9px] transition cursor-pointer ${swap.toRoomId === r.id && swap.toBedNo === bedNo ? 'border-purple-400 bg-purple-50' : occupant ? 'border-blue-200 bg-blue-50 hover:border-blue-300' : 'border-dashed border-emerald-300 bg-emerald-50 hover:border-emerald-400'}`}>
                            <div className="font-bold font-mono">{bedNo}</div>
                            <div className="truncate">{occupant ? occupant.name : '— Vacant —'}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target preview */}
          {swap.toRoomId && swap.toBedNo && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <div className="text-[9px] font-bold text-indigo-400 uppercase mb-2">To (Target)</div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center font-bold shadow">
                  {swap.toStudent?.photo_initial || '○'}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{swap.toStudent?.name || 'Vacant Bed'}</div>
                  <div className="text-[9px] text-slate-500 font-mono">{swap.toStudent?.admission_no || '—'}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="font-mono font-bold text-indigo-700">Room {rooms.find(r => r.id === swap.toRoomId)?.room_no}</div>
                  <div className="text-[9px] text-slate-500">{swap.toBedNo}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 p-5 border-t border-slate-100 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-lg text-[11px] hover:bg-slate-50 transition cursor-pointer">Cancel</button>
          <button onClick={onConfirm} disabled={!swap.toRoomId || !swap.toBedNo}
            className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
            <ArrowLeftRight className="w-3.5 h-3.5" /> Confirm Swap
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

type ActiveTab = 'floormap' | 'list' | 'history' | 'analytics' | 'setup';

const HostelRoomBedManager: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [history, setHistory] = useState<AllocationHistory[]>(MOCK_HISTORY);
  const [activeTab, setActiveTab] = useState<ActiveTab>('floormap');

  // Filters
  const [selectedBlock, setSelectedBlock] = useState<string>('All');
  const [selectedFloor, setSelectedFloor] = useState<string>('All');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('All');
  const [selectedOccupancy, setSelectedOccupancy] = useState<string>('All');
  const [searchQ, setSearchQ] = useState('');

  // Modals
  const [allocateModal, setAllocateModal] = useState<{ room: Room; bedNo: string } | null>(null);
  const [occupantModal, setOccupantModal] = useState<{ occupant: Occupant; room: Room } | null>(null);
  const [roomModal, setRoomModal] = useState<{ room: Room | null; isNew: boolean } | null>(null);
  const [swapModal, setSwapModal] = useState(false);
  const [swapRequest, setSwapRequest] = useState<SwapRequest>({
    fromRoomId: null, fromBedNo: '', fromStudent: null,
    toRoomId: null, toBedNo: '', toStudent: null
  });

  // History filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyAction, setHistoryAction] = useState('');

  // Pagination states
  const [floorMapPage, setFloorMapPage] = useState<number>(1);
  const [roomListPage, setRoomListPage] = useState<number>(1);
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [setupPage, setSetupPage] = useState<number>(1);

  const ROOMS_PER_PAGE_FLOORMAP = 12;
  const ROOMS_PER_PAGE_LIST = 10;
  const ROOMS_PER_PAGE_HISTORY = 10;
  const ROOMS_PER_PAGE_SETUP = 12;

  // Reset page numbers on filter changes
  useEffect(() => {
    setFloorMapPage(1);
    setRoomListPage(1);
    setSetupPage(1);
  }, [selectedBlock, selectedFloor, selectedRoomType, selectedOccupancy, searchQ]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historySearch, historyAction]);

  // Stats
  const totalBeds = useMemo(() => rooms.reduce((s, r) => s + r.total_beds, 0), [rooms]);
  const occupiedBeds = useMemo(() => rooms.reduce((s, r) => s + r.occupants.length, 0), [rooms]);
  const vacantBeds = totalBeds - occupiedBeds;
  const maintenanceRooms = rooms.filter(r => r.is_maintenance).length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      const status = getOccupancyStatus(r);
      const blockMatch = selectedBlock === 'All' || r.block === selectedBlock;
      const floorMatch = selectedFloor === 'All' || r.floor === selectedFloor;
      const typeMatch = selectedRoomType === 'All' || r.room_type === selectedRoomType;
      const occMatch = selectedOccupancy === 'All' || status === selectedOccupancy;
      const searchMatch = !searchQ || r.room_no.toLowerCase().includes(searchQ.toLowerCase()) ||
        r.occupants.some(o => o.name.toLowerCase().includes(searchQ.toLowerCase()) || o.admission_no.toLowerCase().includes(searchQ.toLowerCase()));
      return blockMatch && floorMatch && typeMatch && occMatch && searchMatch;
    });
  }, [rooms, selectedBlock, selectedFloor, selectedRoomType, selectedOccupancy, searchQ]);

  // Paginated rooms for Floor Map
  const paginatedFloorMapRooms = useMemo(() => {
    const start = (floorMapPage - 1) * ROOMS_PER_PAGE_FLOORMAP;
    const end = start + ROOMS_PER_PAGE_FLOORMAP;
    return filteredRooms.slice(start, end);
  }, [filteredRooms, floorMapPage]);

  // Rooms grouped by floor for floor map (from paginated rooms)
  const floorGroups = useMemo(() => {
    const blocks: Record<string, Record<string, Room[]>> = {};
    paginatedFloorMapRooms.forEach(r => {
      if (!blocks[r.block]) blocks[r.block] = {};
      if (!blocks[r.block][r.floor]) blocks[r.block][r.floor] = [];
      blocks[r.block][r.floor].push(r);
    });
    return blocks;
  }, [paginatedFloorMapRooms]);

  // Paginated rooms for Room List
  const paginatedRoomListRooms = useMemo(() => {
    const start = (roomListPage - 1) * ROOMS_PER_PAGE_LIST;
    const end = start + ROOMS_PER_PAGE_LIST;
    return filteredRooms.slice(start, end);
  }, [filteredRooms, roomListPage]);

  // Paginated rooms for Room Setup
  const paginatedSetupRooms = useMemo(() => {
    const start = (setupPage - 1) * ROOMS_PER_PAGE_SETUP;
    const end = start + ROOMS_PER_PAGE_SETUP;
    return filteredRooms.slice(start, end);
  }, [filteredRooms, setupPage]);

  // Available students for allocation
  const allocatedStudentIds = new Set(rooms.flatMap(r => r.occupants.map(o => o.id)));
  const availableStudents = ALL_STUDENTS.filter(s => !allocatedStudentIds.has(s.id));

  // Handlers
  const handleAllocate = (roomId: number, bedNo: string, studentId: number, _remarks: string) => {
    const student = ALL_STUDENTS.find(s => s.id === studentId);
    if (!student) return;
    const newOccupant: Occupant = {
      id: studentId, name: student.name, admission_no: student.admission_no,
      class_name: student.class_name, section: student.section, mobile: student.mobile,
      father_name: student.father_name, allocated_since: new Date().toISOString().split('T')[0],
      bed_no: bedNo, photo_initial: student.name.charAt(0)
    };
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, occupants: [...r.occupants, newOccupant] } : r));
    const room = rooms.find(r => r.id === roomId)!;
    setHistory(prev => [{
      id: prev.length + 1, room_no: room.room_no, bed_no: bedNo,
      student_name: student.name, admission_no: student.admission_no,
      action: 'Allocated', date: new Date().toISOString().split('T')[0], by: 'Admin'
    }, ...prev]);
    setAllocateModal(null);
    toast.success(`✓ ${student.name} allocated to Room ${room.room_no} – ${bedNo}`);
  };

  const handleVacate = (room: Room, occupant: Occupant) => {
    if (!window.confirm(`Vacate ${occupant.name} from Room ${room.room_no} – ${occupant.bed_no}?`)) return;
    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, occupants: r.occupants.filter(o => o.id !== occupant.id) } : r));
    setHistory(prev => [{
      id: prev.length + 1, room_no: room.room_no, bed_no: occupant.bed_no,
      student_name: occupant.name, admission_no: occupant.admission_no,
      action: 'Vacated', date: new Date().toISOString().split('T')[0], by: 'Admin'
    }, ...prev]);
    setOccupantModal(null);
    toast.success(`${occupant.name} vacated from Room ${room.room_no} – ${occupant.bed_no}`);
  };

  const handleSelectForSwap = (room: Room, bedNo: string, occupant?: Occupant) => {
    if (!swapRequest.fromRoomId) {
      setSwapRequest({ fromRoomId: room.id, fromBedNo: bedNo, fromStudent: occupant || null, toRoomId: null, toBedNo: '', toStudent: null });
      setSwapModal(true);
      toast(`Selected ${occupant ? occupant.name : 'Vacant bed'} in Room ${room.room_no} – ${bedNo} for swap`, { icon: '🔄' });
    }
  };

  const handleSelectSwapTarget = (room: Room, bedNo: string, occupant?: Occupant) => {
    setSwapRequest(prev => ({ ...prev, toRoomId: room.id, toBedNo: bedNo, toStudent: occupant || null }));
  };

  const handleConfirmSwap = () => {
    const { fromRoomId, fromBedNo, fromStudent, toRoomId, toBedNo, toStudent } = swapRequest;
    if (!fromRoomId || !toRoomId) return;

    setRooms(prev => prev.map(r => {
      if (r.id === fromRoomId) {
        const newOccupants = r.occupants.filter(o => o.bed_no !== fromBedNo);
        if (toStudent) newOccupants.push({ ...toStudent, bed_no: fromBedNo });
        return { ...r, occupants: newOccupants };
      }
      if (r.id === toRoomId) {
        const newOccupants = r.occupants.filter(o => o.bed_no !== toBedNo);
        if (fromStudent) newOccupants.push({ ...fromStudent, bed_no: toBedNo });
        return { ...r, occupants: newOccupants };
      }
      return r;
    }));

    const fromRoom = rooms.find(r => r.id === fromRoomId)!;
    const toRoom = rooms.find(r => r.id === toRoomId)!;
    setHistory(prev => [{
      id: prev.length + 1, room_no: fromRoom.room_no, bed_no: fromBedNo,
      student_name: fromStudent?.name || '(Vacant)',
      admission_no: fromStudent?.admission_no || '—',
      action: 'Swapped', date: new Date().toISOString().split('T')[0], by: 'Admin'
    }, ...prev]);

    setSwapModal(false);
    setSwapRequest({ fromRoomId: null, fromBedNo: '', fromStudent: null, toRoomId: null, toBedNo: '', toStudent: null });
    toast.success(`✓ Swap completed: Room ${fromRoom.room_no}↔${toRoom.room_no}`);
  };

  const handleSaveRoom = (data: Partial<Room>) => {
    if (roomModal?.isNew) {
      const newRoom: Room = {
        id: rooms.length + 100, floor_index: ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor'].indexOf(data.floor || 'Ground Floor'),
        ...data
      } as Room;
      setRooms(prev => [...prev, newRoom]);
      toast.success(`Room ${data.room_no} created successfully!`);
    } else if (roomModal?.room) {
      setRooms(prev => prev.map(r => r.id === roomModal.room!.id ? { ...r, ...data } : r));
      toast.success(`Room ${data.room_no} updated!`);
    }
    setRoomModal(null);
  };

  // Export
  const exportCSV = () => {
    const headers = ['Room No', 'Block', 'Floor', 'Type', 'Total Beds', 'Occupied', 'Vacant', 'Status'];
    const rows = rooms.map(r => [r.room_no, r.block, r.floor, r.room_type, r.total_beds, r.occupants.length, r.total_beds - r.occupants.length, getOccupancyStatus(r)]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(row => row.map(c => `"${c}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `room_allocation_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success('CSV exported successfully');
  };

  const FLOORS: FloorName[] = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor'];

  // Filtered history
  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      const searchMatch = !historySearch || h.student_name.toLowerCase().includes(historySearch.toLowerCase()) || h.room_no.toLowerCase().includes(historySearch.toLowerCase()) || h.admission_no.toLowerCase().includes(historySearch.toLowerCase());
      const actionMatch = !historyAction || h.action === historyAction;
      return searchMatch && actionMatch;
    });
  }, [history, historySearch, historyAction]);

  // Paginated history
  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * ROOMS_PER_PAGE_HISTORY;
    const end = start + ROOMS_PER_PAGE_HISTORY;
    return filteredHistory.slice(start, end);
  }, [filteredHistory, historyPage]);

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'floormap', label: 'Floor Map', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'list', label: 'Room List', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'history', label: 'Allocation History', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: 'setup', label: 'Room Setup', icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col gap-4 p-1.5 md:p-3 text-[11px] font-sans antialiased text-slate-800 bg-slate-50/50 min-h-screen">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-wrap items-center justify-between bg-white border border-slate-200 shadow-sm rounded-xl p-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-xl"><Grid3X3 className="w-5 h-5" /></div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Hostel Management System</div>
            <h1 className="text-base font-bold text-slate-900 mt-0.5">Room & Bed Allocation</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold text-[10px] transition cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={() => setRoomModal({ room: null, isNew: true })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] transition cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Add Room
          </button>
          <button
            onClick={() => {
              const vacant = rooms.find(r => r.total_beds > r.occupants.length && !r.is_maintenance);
              if (vacant) {
                const beds = Array.from({ length: vacant.total_beds }, (_, i) => `Bed-${String(i + 1).padStart(2, '0')}`);
                const freeBed = beds.find(b => !vacant.occupants.find(o => o.bed_no === b))!;
                setAllocateModal({ room: vacant, bedNo: freeBed });
              } else toast.error('No vacant beds available');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] transition cursor-pointer">
            <UserPlus className="w-3.5 h-3.5" /> Quick Allocate
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Rooms', val: rooms.length, sub: 'Configured rooms', color: 'text-slate-800', dot: 'bg-slate-400' },
          { label: 'Total Beds', val: totalBeds, sub: 'Gross capacity', color: 'text-slate-800', dot: 'bg-slate-400' },
          { label: 'Occupied', val: occupiedBeds, sub: 'Beds assigned', color: 'text-indigo-600', dot: 'bg-indigo-500' },
          { label: 'Vacant', val: vacantBeds, sub: 'Ready to allocate', color: 'text-emerald-600', dot: 'bg-emerald-500' },
          { label: 'Maintenance', val: maintenanceRooms, sub: 'Rooms blocked', color: 'text-amber-600', dot: 'bg-amber-500' },
        ].map(item => (
          <div key={item.label} className="bg-white border border-slate-200 shadow-sm rounded-xl p-3.5 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-1.5 mb-2">
              <div className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</div>
            </div>
            <div className={`text-xl font-bold ${item.color}`}>{item.val}</div>
            <div className="text-[9px] text-slate-500 mt-0.5">{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Occupancy Progress */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-3 flex items-center gap-4">
        <div className="text-[10px] font-bold text-slate-500 whitespace-nowrap">Occupancy Rate</div>
        <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${occupancyRate >= 90 ? 'bg-rose-500' : occupancyRate >= 60 ? 'bg-amber-400' : 'bg-emerald-500'}`}
            style={{ width: `${occupancyRate}%` }} />
        </div>
        <div className={`font-bold text-sm w-12 text-right ${occupancyRate >= 90 ? 'text-rose-600' : occupancyRate >= 60 ? 'text-amber-600' : 'text-emerald-600'}`}>{occupancyRate}%</div>
        <div className="text-[10px] text-slate-400 whitespace-nowrap">{occupiedBeds} / {totalBeds} beds filled</div>
      </div>

      {/* ── TAB NAV ── */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-1.5 flex flex-wrap gap-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-[10px] transition cursor-pointer ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── FILTER BAR ── */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3.5 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Search room number or student name / admission no..." />
        </div>
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0 font-sans">
          <Select
            options={blockOptions}
            value={blockOptions.find(o => o.value === selectedBlock)}
            onChange={(selected) => setSelectedBlock(selected?.value || 'All')}
            styles={selectStyles}
            placeholder="Select Block"
            isSearchable={true}
          />
          <Select
            options={floorOptions}
            value={floorOptions.find(o => o.value === selectedFloor)}
            onChange={(selected) => setSelectedFloor(selected?.value || 'All')}
            styles={selectStyles}
            placeholder="Select Floor"
            isSearchable={true}
          />
          <Select
            options={roomTypeOptions}
            value={roomTypeOptions.find(o => o.value === selectedRoomType)}
            onChange={(selected) => setSelectedRoomType(selected?.value || 'All')}
            styles={selectStyles}
            placeholder="Select Type"
            isSearchable={true}
          />
          <Select
            options={occupancyOptions}
            value={occupancyOptions.find(o => o.value === selectedOccupancy)}
            onChange={(selected) => setSelectedOccupancy(selected?.value || 'All')}
            styles={selectStyles}
            placeholder="Select Status"
            isSearchable={true}
          />
          <button onClick={() => { setSelectedBlock('All'); setSelectedFloor('All'); setSelectedRoomType('All'); setSelectedOccupancy('All'); setSearchQ(''); }}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg transition cursor-pointer h-[30px] flex items-center justify-center" title="Reset Filters">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: FLOOR MAP                                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'floormap' && (
        <div className="space-y-6">
          {Object.entries(floorGroups).map(([block, floors]) => (
            <div key={block} className="space-y-4">
              {/* Block Header */}
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${block.includes('Boys') ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-[14px]">{block}</div>
                  <div className="text-[10px] text-slate-500">{Object.values(floors).flat().length} rooms · {Object.values(floors).flat().reduce((s, r) => s + r.total_beds, 0)} beds</div>
                </div>
              </div>

              {FLOORS.filter(f => floors[f]).map(floor => (
                <div key={floor}>
                  {/* Floor Header */}
                  <div className="flex items-center gap-2 mb-2.5 px-1">
                    <div className="h-px flex-1 bg-slate-200" />
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      <Layers className="w-3 h-3" /> {floor}
                      <span className="text-slate-300 font-normal">·</span>
                      <span className="text-slate-400">{floors[floor].length} rooms</span>
                    </div>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  {/* Room Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {floors[floor].map(room => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        onAllocateBed={(r, b) => !r.is_maintenance && setAllocateModal({ room: r, bedNo: b })}
                        onVacateBed={(r, o) => handleVacate(r, o)}
                        onViewRoom={(r) => setRoomModal({ room: r, isNew: false })}
                        onViewOccupant={(o) => {
                          const r = rooms.find(rm => rm.occupants.some(oc => oc.id === o.id))!;
                          setOccupantModal({ occupant: o, room: r });
                        }}
                        onSelectForSwap={handleSelectForSwap}
                        swapRoomId={swapRequest.fromRoomId}
                        swapBedNo={swapRequest.fromBedNo}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {filteredRooms.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <div className="font-bold text-slate-500">No rooms match your filters</div>
              <div className="text-[10px] text-slate-400 mt-1">Try adjusting the filters above</div>
            </div>
          )}

          {filteredRooms.length > 0 && (
            <Pagination
              currentPage={floorMapPage}
              totalItems={filteredRooms.length}
              itemsPerPage={ROOMS_PER_PAGE_FLOORMAP}
              onPageChange={setFloorMapPage}
              itemName="rooms"
            />
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: ROOM LIST                                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-slate-400 text-[9px] uppercase">
                    <th className="text-left px-4 py-2.5 font-bold">Room</th>
                    <th className="text-left px-4 py-2.5 font-bold">Block / Floor</th>
                    <th className="text-left px-4 py-2.5 font-bold">Type</th>
                    <th className="text-center px-4 py-2.5 font-bold">Beds</th>
                    <th className="text-center px-4 py-2.5 font-bold">Occupied</th>
                    <th className="text-center px-4 py-2.5 font-bold">Vacant</th>
                    <th className="text-left px-4 py-2.5 font-bold">Occupants</th>
                    <th className="text-left px-4 py-2.5 font-bold">Amenities</th>
                    <th className="text-center px-4 py-2.5 font-bold">Status</th>
                    <th className="text-center px-4 py-2.5 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRoomListRooms.map(room => {
                    const status = getOccupancyStatus(room);
                    const colors = occupancyColor(status);
                    return (
                      <tr key={room.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">{room.room_no}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-700">{room.block.split(' ')[0]} {room.block.split(' ')[1]}</div>
                          <div className="text-[9px] text-slate-400">{room.floor}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded">{room.room_type}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">{room.total_beds}</td>
                        <td className="px-4 py-3 text-center font-bold text-indigo-600">{room.occupants.length}</td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-600">{room.total_beds - room.occupants.length}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            {room.occupants.length === 0 ? (
                              <span className="text-slate-400 italic text-[9px]">—</span>
                            ) : room.occupants.slice(0, 2).map(o => (
                              <span key={o.id} className="flex items-center gap-1 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded text-[9px] font-medium text-blue-700 cursor-pointer hover:bg-blue-100 transition"
                                onClick={() => setOccupantModal({ occupant: o, room })}>
                                {o.photo_initial} {o.name.split(' ')[0]}
                              </span>
                            ))}
                            {room.occupants.length > 2 && <span className="text-[9px] text-slate-400">+{room.occupants.length - 2} more</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            {room.amenities.slice(0, 3).map(a => (
                              <span key={a} className="flex items-center gap-0.5 text-[8px] text-slate-500 bg-slate-50 border border-slate-100 px-1 py-0.5 rounded">
                                {AMENITY_ICONS[a]}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${colors.badge}`}>{status}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setRoomModal({ room, isNew: false })}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer" title="Edit Room">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {room.total_beds > room.occupants.length && !room.is_maintenance && (
                              <button onClick={() => {
                                const beds = Array.from({ length: room.total_beds }, (_, i) => `Bed-${String(i + 1).padStart(2, '0')}`);
                                const free = beds.find(b => !room.occupants.find(o => o.bed_no === b))!;
                                setAllocateModal({ room, bedNo: free });
                              }}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer" title="Allocate Bed">
                                <UserPlus className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => {
                              setRooms(prev => prev.map(r => r.id === room.id ? { ...r, is_maintenance: !r.is_maintenance, is_active: r.is_maintenance } : r));
                              toast.success(`Room ${room.room_no} ${room.is_maintenance ? 'taken out of' : 'put into'} maintenance`);
                            }}
                              className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition cursor-pointer" title="Toggle Maintenance">
                              <Shield className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => {
                              if (!window.confirm(`Delete Room ${room.room_no}?`)) return;
                              if (room.occupants.length > 0) { toast.error('Cannot delete room with occupants. Please vacate all beds first.'); return; }
                              setRooms(prev => prev.filter(r => r.id !== room.id));
                              toast.success(`Room ${room.room_no} deleted`);
                            }}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer" title="Delete Room">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredRooms.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <div>No rooms found matching your filters</div>
                </div>
              )}
            </div>
          </div>
          {filteredRooms.length > 0 && (
            <Pagination
              currentPage={roomListPage}
              totalItems={filteredRooms.length}
              itemsPerPage={ROOMS_PER_PAGE_LIST}
              onPageChange={setRoomListPage}
              itemName="rooms"
            />
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: ALLOCATION HISTORY                                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="space-y-3 font-sans">
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3.5 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" value={historySearch} onChange={e => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Search by student name, room, admission no..." />
            </div>
            <Select
              options={historyActionOptions}
              value={historyActionOptions.find(o => o.value === (historyAction || 'All'))}
              onChange={(selected) => setHistoryAction(selected?.value === 'All' ? '' : selected?.value || '')}
              styles={selectStyles}
              placeholder="All Actions"
              isSearchable={true}
            />
            <button onClick={() => toast.success('Allocation history exported')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold text-[10px] transition cursor-pointer flex-shrink-0 h-[30px]">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-slate-400 text-[9px] uppercase">
                    <th className="text-left px-4 py-2.5 font-bold">#</th>
                    <th className="text-left px-4 py-2.5 font-bold">Student</th>
                    <th className="text-left px-4 py-2.5 font-bold">Room / Bed</th>
                    <th className="text-center px-4 py-2.5 font-bold">Action</th>
                    <th className="text-center px-4 py-2.5 font-bold">Date</th>
                    <th className="text-left px-4 py-2.5 font-bold">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedHistory.map((h, i) => (
                    <tr key={h.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 text-slate-400 font-mono">{(historyPage - 1) * ROOMS_PER_PAGE_HISTORY + i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{h.student_name}</div>
                        <div className="text-[9px] text-slate-400 font-mono">{h.admission_no}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-slate-700">{h.room_no}</div>
                        <div className="text-[9px] text-slate-400">{h.bed_no}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${actionColor(h.action)}`}>{h.action}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">{h.date}</td>
                      <td className="px-4 py-3 text-slate-500">{h.by}</td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-10 text-slate-400">No history records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {filteredHistory.length > 0 && (
            <Pagination
              currentPage={historyPage}
              totalItems={filteredHistory.length}
              itemsPerPage={ROOMS_PER_PAGE_HISTORY}
              onPageChange={setHistoryPage}
              itemName="records"
            />
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: ANALYTICS                                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (() => {
        const byBlock = ['Block A (Boys)', 'Block B (Girls)'].map(b => {
          const bRooms = rooms.filter(r => r.block === b);
          const tb = bRooms.reduce((s, r) => s + r.total_beds, 0);
          const ob = bRooms.reduce((s, r) => s + r.occupants.length, 0);
          return { block: b, total: tb, occupied: ob, vacant: tb - ob, rate: tb > 0 ? Math.round((ob / tb) * 100) : 0 };
        });

        const byFloor = FLOORS.map(f => {
          const fRooms = rooms.filter(r => r.floor === f);
          const tb = fRooms.reduce((s, r) => s + r.total_beds, 0);
          const ob = fRooms.reduce((s, r) => s + r.occupants.length, 0);
          return { floor: f, rooms: fRooms.length, total: tb, occupied: ob, rate: tb > 0 ? Math.round((ob / tb) * 100) : 0 };
        }).filter(f => f.rooms > 0);

        const byType = (['Single AC', '2-Seater AC', '4-Seater AC', '2-Seater Non-AC', '4-Seater Non-AC', 'Dormitory'] as RoomType[]).map(t => {
          const tRooms = rooms.filter(r => r.room_type === t);
          const tb = tRooms.reduce((s, r) => s + r.total_beds, 0);
          const ob = tRooms.reduce((s, r) => s + r.occupants.length, 0);
          return { type: t, rooms: tRooms.length, total: tb, occupied: ob, rate: tb > 0 ? Math.round((ob / tb) * 100) : 0 };
        }).filter(t => t.rooms > 0);

        return (
          <div className="space-y-4">
            {/* By Block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {byBlock.map(b => (
                <div key={b.block} className={`bg-white border border-slate-200 shadow-sm rounded-xl p-4 ${b.block.includes('Boys') ? 'border-l-4 border-l-blue-400' : 'border-l-4 border-l-pink-400'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-slate-900">{b.block}</div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.rate >= 90 ? 'bg-rose-50 text-rose-600' : b.rate >= 60 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{b.rate}% filled</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-3">
                    <div className={`h-full rounded-full ${b.block.includes('Boys') ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-pink-500 to-rose-500'}`} style={{ width: `${b.rate}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[{ label: 'Total', val: b.total }, { label: 'Occupied', val: b.occupied }, { label: 'Vacant', val: b.vacant }].map(item => (
                      <div key={item.label} className="bg-slate-50 rounded-lg py-2 border border-slate-100">
                        <div className="text-[9px] text-slate-400 font-bold uppercase">{item.label}</div>
                        <div className="font-bold text-slate-800 text-sm">{item.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* By Floor */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
              <div className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-500" /> Occupancy by Floor</div>
              <div className="space-y-3">
                {byFloor.map(f => (
                  <div key={f.floor} className="flex items-center gap-3">
                    <div className="text-[10px] text-slate-500 font-semibold w-28 flex-shrink-0">{f.floor}</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-400 to-blue-500 h-full rounded-full" style={{ width: `${f.rate}%` }} />
                    </div>
                    <div className="text-[10px] font-bold text-slate-700 w-10 text-right">{f.rate}%</div>
                    <div className="text-[9px] text-slate-400 w-20 text-right">{f.occupied}/{f.total} beds</div>
                    <div className="text-[9px] text-slate-400 w-14 text-right">{f.rooms} rooms</div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Room Type */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
              <div className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Home className="w-4 h-4 text-emerald-500" /> Occupancy by Room Type</div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead className="bg-slate-50">
                    <tr className="text-slate-400 text-[9px] uppercase">
                      <th className="text-left px-3 py-2 font-bold">Room Type</th>
                      <th className="text-center px-3 py-2 font-bold">Rooms</th>
                      <th className="text-center px-3 py-2 font-bold">Total Beds</th>
                      <th className="text-center px-3 py-2 font-bold">Occupied</th>
                      <th className="text-center px-3 py-2 font-bold">Vacancy</th>
                      <th className="text-left px-3 py-2 font-bold">Fill Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {byType.map(t => (
                      <tr key={t.type} className="hover:bg-slate-50/70">
                        <td className="px-3 py-2.5 font-bold text-slate-800">{t.type}</td>
                        <td className="px-3 py-2.5 text-center text-slate-700">{t.rooms}</td>
                        <td className="px-3 py-2.5 text-center text-slate-700">{t.total}</td>
                        <td className="px-3 py-2.5 text-center font-bold text-indigo-600">{t.occupied}</td>
                        <td className="px-3 py-2.5 text-center font-bold text-emerald-600">{t.total - t.occupied}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div className={`h-full rounded-full ${t.rate >= 90 ? 'bg-rose-500' : t.rate >= 60 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${t.rate}%` }} />
                            </div>
                            <span className="text-[9px] font-bold text-slate-600 w-8">{t.rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vacant rooms quick list */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
              <div className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Bed className="w-4 h-4 text-emerald-500" /> Rooms with Vacant Beds</div>
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2">
                {rooms.filter(r => r.occupants.length < r.total_beds && !r.is_maintenance).map(r => (
                  <div key={r.id} className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center cursor-pointer hover:bg-emerald-100 transition"
                    onClick={() => setActiveTab('floormap')}>
                    <div className="font-bold font-mono text-emerald-800">{r.room_no}</div>
                    <div className="text-[9px] text-emerald-600 mt-0.5">{r.total_beds - r.occupants.length} vacant</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: ROOM SETUP                                                    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'setup' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold text-slate-900 flex items-center gap-2"><Settings className="w-4 h-4 text-indigo-500" /> Quick Room Setup</div>
              <button onClick={() => setRoomModal({ room: null, isNew: true })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] transition cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Add Room
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['Block A (Boys)', 'Block B (Girls)'] as const).map(block => {
                const bRooms = rooms.filter(r => r.block === block);
                const total = bRooms.reduce((s, r) => s + r.total_beds, 0);
                const occupied = bRooms.reduce((s, r) => s + r.occupants.length, 0);
                return (
                  <div key={block} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className={`text-[9px] font-bold uppercase tracking-wider mb-2 ${block.includes('Boys') ? 'text-blue-600' : 'text-pink-600'}`}>{block}</div>
                    <div className="font-bold text-slate-800 text-2xl">{bRooms.length}</div>
                    <div className="text-[10px] text-slate-500">rooms</div>
                    <div className="mt-2 text-[10px] text-slate-500">{occupied}/{total} beds occupied</div>
                  </div>
                );
              })}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="text-[9px] font-bold uppercase tracking-wider mb-2 text-amber-600">Under Maintenance</div>
                <div className="font-bold text-amber-800 text-2xl">{maintenanceRooms}</div>
                <div className="text-[10px] text-amber-600">rooms blocked</div>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <div className="text-[9px] font-bold uppercase tracking-wider mb-2 text-indigo-600">Total Configured</div>
                <div className="font-bold text-indigo-800 text-2xl">{rooms.length}</div>
                <div className="text-[10px] text-indigo-600">{totalBeds} beds total</div>
              </div>
            </div>
          </div>

          {/* Rooms by type overview */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
            <div className="font-bold text-slate-900 mb-4">All Rooms — Management View</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {paginatedSetupRooms.map(r => {
                const status = getOccupancyStatus(r);
                const colors = occupancyColor(status);
                return (
                  <div key={r.id} className={`flex items-center gap-3 border rounded-xl px-3 py-2.5 ${colors.border} ${colors.bg} hover:shadow-sm transition cursor-pointer group`}
                    onClick={() => setRoomModal({ room: r, isNew: false })}>
                    <div className={`w-1.5 h-8 rounded-full ${colors.dot} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 font-mono">{r.room_no}</div>
                      <div className="text-[9px] text-slate-500">{r.room_type} · {r.floor}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-slate-800">{r.occupants.length}/{r.total_beds}</div>
                      <div className={`text-[8px] font-bold ${colors.text}`}>{status}</div>
                    </div>
                    <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition flex-shrink-0" />
                  </div>
                );
              })}
            </div>
            {filteredRooms.length > 0 && (
              <Pagination
                currentPage={setupPage}
                totalItems={filteredRooms.length}
                itemsPerPage={ROOMS_PER_PAGE_SETUP}
                onPageChange={setSetupPage}
                itemName="rooms"
              />
            )}
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      {allocateModal && (
        <AllocateBedModal
          room={allocateModal.room}
          bedNo={allocateModal.bedNo}
          availableStudents={availableStudents}
          onClose={() => setAllocateModal(null)}
          onAllocate={handleAllocate}
        />
      )}

      {occupantModal && (
        <OccupantModal
          occupant={occupantModal.occupant}
          room={occupantModal.room}
          onClose={() => setOccupantModal(null)}
          onVacate={(o) => handleVacate(occupantModal.room, o)}
        />
      )}

      {roomModal && (
        <RoomDetailModal
          room={roomModal.room}
          isNew={roomModal.isNew}
          onClose={() => setRoomModal(null)}
          onSave={handleSaveRoom}
        />
      )}

      {swapModal && (
        <SwapBedsModal
          swap={swapRequest}
          rooms={rooms}
          onClose={() => {
            setSwapModal(false);
            setSwapRequest({ fromRoomId: null, fromBedNo: '', fromStudent: null, toRoomId: null, toBedNo: '', toStudent: null });
          }}
          onConfirm={handleConfirmSwap}
          onSelectTarget={handleSelectSwapTarget}
        />
      )}
    </div>
  );
};

export default HostelRoomBedManager;
