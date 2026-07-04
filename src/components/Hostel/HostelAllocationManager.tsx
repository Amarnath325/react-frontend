import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import {
  Grid, Plus, Filter, Check, X, RefreshCw, UserPlus, Info,
  Shield, LogOut, ArrowRight, User, Edit3, Trash2, List,
  Download, Upload, RotateCcw, Trash, FileSpreadsheet
} from 'lucide-react';

interface StudentMaster {
  student_id: number;
  admission_no: string;
  roll_no: string;
  name: string;
  class_name: string;
  section: string;
  admission_id: number;
}

interface RoomMaster {
  id: number;
  hostel_name: string;
  building: string;
  floor: string;
  room_number: string;
  room_type: string;
  total_beds: number;
  occupied_beds: string[];
}

interface Allocation {
  id: number;
  student_id: number;
  bed_number: string;
  allocation_date: string;
  remarks: string | null;
  student: {
    id: number;
    first_name: string;
    last_name: string;
    admission_number: string;
    roll_number: string;
    section: string | null;
    user: {
      full_name: string;
    } | null;
    class: {
      m_name: string;
    } | null;
  };
}

interface Room {
  id: number;
  hostel_name: string;
  building: string;
  floor: string;
  room_number: string;
  room_type: string;
  total_beds: number;
  is_active: boolean;
  remarks: string | null;
  deleted_at?: string | null;
  allocations: Allocation[];
}

const HostelAllocationManager: React.FC = () => {
  // Main view tabs
  const [activeTab, setActiveTab] = useState<'Blueprint' | 'Rooms'>('Blueprint');

  // State variables
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Masters state for filters and selects
  const [hostelsList, setHostelsList] = useState<string[]>([]);
  const [buildingsList, setBuildingsList] = useState<string[]>([]);
  const [floorsList, setFloorsList] = useState<string[]>([]);
  const [roomsList, setRoomsList] = useState<RoomMaster[]>([]);
  const [eligibleStudents, setEligibleStudents] = useState<StudentMaster[]>([]);

  // Filter states
  const [selectedHostel, setSelectedHostel] = useState<string>('All');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('All');
  const [selectedFloor, setSelectedFloor] = useState<string>('All');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('All');
  const [selectedOccupancy, setSelectedOccupancy] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [onlyTrashed, setOnlyTrashed] = useState(false);

  // Selection states
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);

  // Metrics stats state
  const [stats, setStats] = useState({
    total_rooms: 0,
    total_beds: 0,
    occupied_beds: 0,
    vacant_beds: 0,
    occupancy_rate: 0
  });

  // Modal toggle states
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  
  // Add / Edit Room form state
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomHostelName, setRoomHostelName] = useState('Boys Hostel A');
  const [roomBuilding, setRoomBuilding] = useState('Main Block');
  const [roomFloor, setRoomFloor] = useState('Ground Floor');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('2-Seater');
  const [roomTotalBeds, setRoomTotalBeds] = useState(2);
  const [roomIsActive, setRoomIsActive] = useState(true);
  const [roomRemarks, setRoomRemarks] = useState('');

  // Allocate Bed form state
  const [allocStudentId, setAllocStudentId] = useState('');
  const [allocRoomId, setAllocRoomId] = useState('');
  const [allocBedNumber, setAllocBedNumber] = useState('');
  const [allocDate, setAllocDate] = useState(new Date().toISOString().slice(0, 10));
  const [allocRemarks, setAllocRemarks] = useState('');

  // CSV Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ headers: string[]; rows: any[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load rooms and masters
  useEffect(() => {
    fetchRooms();
  }, [selectedHostel, selectedBuilding, selectedFloor, selectedRoomType, selectedOccupancy, selectedStatus, onlyTrashed]);

  useEffect(() => {
    fetchMasters();
  }, []);

  // Clear selections when filters or mode changes
  useEffect(() => {
    setSelectedRoomIds([]);
  }, [selectedHostel, selectedBuilding, selectedFloor, selectedRoomType, selectedOccupancy, selectedStatus, onlyTrashed, activeTab]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params: any = {
        hostel_name: selectedHostel !== 'All' ? selectedHostel : undefined,
        building: selectedBuilding !== 'All' ? selectedBuilding : undefined,
        floor: selectedFloor !== 'All' ? selectedFloor : undefined,
        room_type: selectedRoomType !== 'All' ? selectedRoomType : undefined,
        occupancy: selectedOccupancy !== 'All' ? selectedOccupancy : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        only_trashed: onlyTrashed ? 'true' : undefined
      };

      const response = await api.get('/school/hostel/rooms', { params });
      if (response.data.success) {
        setRooms(response.data.data);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to load room registers.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasters = async () => {
    try {
      const response = await api.get('/school/hostel/rooms/masters');
      if (response.data.success) {
        const d = response.data.data;
        setHostelsList(d.hostels);
        setBuildingsList(d.buildings);
        setFloorsList(d.floors);
        setRoomsList(d.rooms);
        setEligibleStudents(d.eligible_students);
      }
    } catch (error) {
      console.error('Error fetching masters:', error);
    }
  };

  // Synchronize bed capacity changes in room form
  useEffect(() => {
    if (roomType === 'Single') setRoomTotalBeds(1);
    else if (roomType === '2-Seater') setRoomTotalBeds(2);
    else if (roomType === '4-Seater') setRoomTotalBeds(4);
  }, [roomType]);

  // Handle Add/Edit Room Submit
  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) {
      toast.error('Please enter a room number.');
      return;
    }

    try {
      const payload = {
        hostel_name: roomHostelName,
        building: roomBuilding,
        floor: roomFloor,
        room_number: roomNumber,
        room_type: roomType,
        total_beds: roomTotalBeds,
        is_active: roomIsActive,
        remarks: roomRemarks || null
      };

      if (editingRoom) {
        const response = await api.put(`/school/hostel/rooms/${editingRoom.id}`, payload);
        if (response.data.success) {
          toast.success('Room details updated successfully.');
          setEditingRoom(null);
          setIsRoomModalOpen(false);
          resetRoomForm();
          fetchRooms();
          fetchMasters();
        }
      } else {
        const response = await api.post('/school/hostel/rooms', payload);
        if (response.data.success) {
          toast.success('Hostel room registered successfully.');
          setIsRoomModalOpen(false);
          resetRoomForm();
          fetchRooms();
          fetchMasters();
        }
      }
    } catch (error: any) {
      console.error('Failed to save room:', error);
      toast.error(error.response?.data?.message || 'Failed to save hostel room.');
    }
  };

  const resetRoomForm = () => {
    setEditingRoom(null);
    setRoomNumber('');
    setRoomRemarks('');
    setRoomType('2-Seater');
    setRoomTotalBeds(2);
    setRoomIsActive(true);
  };

  // Trigger editing mode
  const startEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomHostelName(room.hostel_name);
    setRoomBuilding(room.building);
    setRoomFloor(room.floor);
    setRoomNumber(room.room_number);
    setRoomType(room.room_type);
    setRoomTotalBeds(room.total_beds);
    setRoomIsActive(room.is_active);
    setRoomRemarks(room.remarks || '');
    setIsRoomModalOpen(true);
    toast.info(`Editing Room ${room.room_number}. Modify details in the popup form.`);
  };

  // Find selected room object for bed numbers dropdown list
  const selectedRoomObj = roomsList.find(r => r.id.toString() === allocRoomId);
  const getAvailableBeds = () => {
    if (!selectedRoomObj) return [];
    const total = selectedRoomObj.total_beds;
    const occupied = selectedRoomObj.occupied_beds || [];
    const beds = [];
    for (let i = 1; i <= total; i++) {
      const name = `Bed-${String(i).padStart(2, '0')}`;
      if (!occupied.includes(name)) {
        beds.push(name);
      }
    }
    return beds;
  };

  // Handle Bed Allocation Submit
  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocStudentId) {
      toast.error('Please select a student.');
      return;
    }
    if (!allocRoomId) {
      toast.error('Please select a room.');
      return;
    }
    if (!allocBedNumber) {
      toast.error('Please select an available bed.');
      return;
    }

    try {
      const payload = {
        student_id: allocStudentId,
        hostel_room_id: allocRoomId,
        bed_number: allocBedNumber,
        allocation_date: allocDate,
        remarks: allocRemarks || null
      };

      const response = await api.post('/school/hostel/allocations', payload);
      if (response.data.success) {
        toast.success('Bed allocated successfully.');
        setIsAllocateOpen(false);
        resetAllocForm();
        fetchRooms();
        fetchMasters();
      }
    } catch (error: any) {
      console.error('Failed to allocate bed:', error);
      toast.error(error.response?.data?.message || 'Allocation request failed.');
    }
  };

  const resetAllocForm = () => {
    setAllocStudentId('');
    setAllocRoomId('');
    setAllocBedNumber('');
    setAllocRemarks('');
  };

  // Handle Bed checkout/de-allocation
  const handleCheckout = async (allocationId: number) => {
    if (!window.confirm('Are you sure you want to checkout the student and de-allocate this bed?')) {
      return;
    }

    try {
      const response = await api.post(`/school/hostel/allocations/${allocationId}/checkout`);
      if (response.data.success) {
        toast.success('Student checked out. Bed is now vacant.');
        fetchRooms();
        fetchMasters();
      }
    } catch (error: any) {
      console.error('Checkout failed:', error);
      toast.error('Checkout operation failed.');
    }
  };

  // Handle clicking on a vacant bed (shortcut allocation trigger)
  const triggerBedAllocation = (room: Room, bedNo: string) => {
    setAllocRoomId(room.id.toString());
    setAllocBedNumber(bedNo);
    setIsAllocateOpen(true);
  };

  // Delete Room (Soft)
  const handleDeleteRoom = async (roomId: number, roomNo: string) => {
    if (!window.confirm(`Are you sure you want to delete Room ${roomNo}? This will soft-delete the room.`)) {
      return;
    }

    try {
      const response = await api.delete(`/school/hostel/rooms/${roomId}`);
      if (response.data.success) {
        toast.success('Hostel room soft-deleted successfully.');
        fetchRooms();
        fetchMasters();
      }
    } catch (error: any) {
      console.error('Failed to delete room:', error);
      toast.error(error.response?.data?.message || 'Failed to delete room.');
    }
  };

  // Restore Room
  const handleRestoreRoom = async (roomId: number) => {
    try {
      const response = await api.post(`/school/hostel/rooms/${roomId}/restore`);
      if (response.data.success) {
        toast.success('Hostel room restored successfully.');
        fetchRooms();
        fetchMasters();
      }
    } catch (error: any) {
      console.error('Failed to restore room:', error);
      toast.error('Failed to restore room.');
    }
  };

  // Force Delete Room
  const handleForceDeleteRoom = async (roomId: number, roomNo: string) => {
    if (!window.confirm(`WARNING: Are you sure you want to permanently delete Room ${roomNo}? This action CANNOT be undone.`)) {
      return;
    }

    try {
      const response = await api.delete(`/school/hostel/rooms/${roomId}/force`);
      if (response.data.success) {
        toast.success('Hostel room permanently deleted.');
        fetchRooms();
        fetchMasters();
      }
    } catch (error: any) {
      console.error('Failed to force delete room:', error);
      toast.error('Failed to permanently delete room.');
    }
  };

  // Row selection
  const toggleSelectRoom = (id: number) => {
    if (selectedRoomIds.includes(id)) {
      setSelectedRoomIds(selectedRoomIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedRoomIds([...selectedRoomIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedRoomIds.length === rooms.length) {
      setSelectedRoomIds([]);
    } else {
      setSelectedRoomIds(rooms.map(item => item.id));
    }
  };

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (selectedRoomIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to soft-delete the ${selectedRoomIds.length} selected rooms?`)) {
      return;
    }

    try {
      const response = await api.post('/school/hostel/rooms/bulk-delete', {
        ids: selectedRoomIds
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedRoomIds([]);
        fetchRooms();
        fetchMasters();
      }
    } catch (error: any) {
      console.error('Bulk delete failed:', error);
      toast.error(error.response?.data?.message || 'Bulk delete failed.');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedRoomIds.length === 0) return;
    try {
      const response = await api.post('/school/hostel/rooms/bulk-restore', {
        ids: selectedRoomIds
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedRoomIds([]);
        fetchRooms();
        fetchMasters();
      }
    } catch (error: any) {
      console.error('Bulk restore failed:', error);
      toast.error('Bulk restore failed.');
    }
  };

  const handleBulkForceDelete = async () => {
    if (selectedRoomIds.length === 0) return;
    if (!window.confirm(`WARNING: Are you sure you want to permanently delete the ${selectedRoomIds.length} selected rooms? This action CANNOT be undone.`)) {
      return;
    }

    try {
      const response = await api.post('/school/hostel/rooms/bulk-force-delete', {
        ids: selectedRoomIds
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedRoomIds([]);
        fetchRooms();
        fetchMasters();
      }
    } catch (error: any) {
      console.error('Bulk force delete failed:', error);
      toast.error('Bulk force delete failed.');
    }
  };

  // Toggle status of a room
  const handleToggleStatus = async (roomId: number) => {
    try {
      const response = await api.patch(`/school/hostel/rooms/${roomId}/toggle-status`);
      if (response.data.success) {
        toast.success('Room status updated successfully.');
        fetchRooms();
        fetchMasters();
      }
    } catch (error: any) {
      console.error('Failed to toggle room status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status.');
    }
  };

  // Bulk update status of selected rooms
  const handleBulkStatus = async (status: 'active' | 'inactive') => {
    if (selectedRoomIds.length === 0) return;
    try {
      const response = await api.post('/school/hostel/rooms/bulk-status', {
        status,
        ids: selectedRoomIds
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedRoomIds([]);
        fetchRooms();
        fetchMasters();
      }
    } catch (error: any) {
      console.error('Bulk status update failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update status.');
    }
  };

  // CSV Exporter
  const exportRoomsToCSV = () => {
    if (rooms.length === 0) {
      toast.error('No room records in active view to export.');
      return;
    }

    const headers = [
      'Room Number',
      'Hostel Name',
      'Building',
      'Floor',
      'Room Type',
      'Total Beds',
      'Occupants Count',
      'Status',
      'Remarks'
    ];

    const rows = rooms.map(room => [
      room.room_number,
      room.hostel_name,
      room.building,
      room.floor,
      room.room_type,
      room.total_beds,
      room.allocations ? room.allocations.length : 0,
      room.is_active ? 'Active' : 'Inactive',
      room.remarks || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hostel_rooms_export_${onlyTrashed ? 'trash_' : ''}${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Export download started.');
  };

  // Sample CSV Template Downloader
  const downloadSampleCSV = () => {
    const headers = [
      'hostel_name',
      'building',
      'floor',
      'room_number',
      'room_type',
      'total_beds',
      'status',
      'remarks'
    ];

    const sampleRows = [
      ['Boys Hostel A', 'Main Block', 'Ground Floor', 'A-104', '2-Seater', '2', 'Active', 'Spacious corner room'],
      ['Girls Hostel B', 'Block B', 'First Floor', 'B-203', '4-Seater', '4', 'Active', 'Close to study lounge']
    ];

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...sampleRows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_hostel_rooms_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample CSV template downloaded.');
  };

  // CSV Preview Parser
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/);
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim());
          const previewRows: any[] = [];
          for (let i = 1; i < Math.min(lines.length, 6); i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^["']|["']$/g, '').trim());
            if (values.length === headers.length) {
              const obj: any = {};
              headers.forEach((header, idx) => {
                obj[header] = values[idx];
              });
              previewRows.push(obj);
            }
          }
          setCsvPreview({ headers, rows: previewRows });
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse CSV preview.");
      }
    };
    reader.readAsText(file);
  };

  // CSV Submit Uploader
  const handleCSVImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Please select a CSV file.');
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const response = await api.post('/school/hostel/rooms/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Rooms imported successfully.');
        if (response.data.errors && response.data.errors.length > 0) {
          toast(`Import complete with warnings:\n${response.data.errors.slice(0, 3).join('\n')}`, { icon: '⚠️', duration: 5000 });
        }
        setIsImportOpen(false);
        setImportFile(null);
        setCsvPreview(null);
        fetchRooms();
        fetchMasters();
      }
    } catch (error: any) {
      console.error('Import failed:', error);
      toast.error(error.response?.data?.message || 'CSV import operation encountered an error.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-1.5 md:p-3 text-[11px] font-sans antialiased text-slate-800 bg-slate-50/50 min-h-screen">
      
      {/* ── HEADER & TITLE ── */}
      <div className="flex flex-wrap items-center justify-between bg-white border border-slate-200 shadow-sm rounded-xl p-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-650 rounded-xl">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Hostel Management System</div>
            <h1 className="text-base font-bold text-slate-900 mt-0.5">Room & Bed Allocation</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Add Room Button */}
          <button
            onClick={() => {
              resetRoomForm();
              setIsRoomModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition duration-155 active:scale-95 cursor-pointer text-[10px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Room</span>
          </button>

          {/* Allocate Bed Button */}
          <button
            onClick={() => setIsAllocateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs transition duration-155 active:scale-95 cursor-pointer text-[10px]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Allocate Bed</span>
          </button>
        </div>
      </div>

      {/* ── OCCUPANCY METRICS STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3.5 hover:shadow-md transition">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Rooms</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{stats.total_rooms}</div>
          <div className="text-[10px] text-slate-500 mt-1">Configured suites</div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3.5 hover:shadow-md transition">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Seater Beds</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{stats.total_beds}</div>
          <div className="text-[10px] text-slate-500 mt-1">Gross capacity</div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3.5 hover:shadow-md transition">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Occupied Beds</div>
          <div className="text-xl font-bold text-indigo-600 mt-1">{stats.occupied_beds}</div>
          <div className="text-[10px] text-slate-500 mt-1">Beds currently assigned</div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3.5 hover:shadow-md transition">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Vacant Beds</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{stats.vacant_beds}</div>
          <div className="text-[10px] text-slate-500 mt-1">Available for allocation</div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3.5 hover:shadow-md transition col-span-2 md:col-span-1">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Occupancy Rate</div>
          <div className="text-xl font-bold text-blue-600 mt-1">{stats.occupancy_rate}%</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${stats.occupancy_rate}%` }}></div>
          </div>
        </div>
      </div>

      {/* ── FILTER TOOLBAR ── */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-slate-500 font-bold text-[9px] uppercase tracking-wider mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Map Filters:</span>
          </div>

          <select
            value={selectedHostel}
            onChange={(e) => setSelectedHostel(e.target.value)}
            className="text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-650 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="All">All Hostels</option>
            {hostelsList.map((h, idx) => (
              <option key={idx} value={h}>{h}</option>
            ))}
          </select>

          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-650 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="All">All Buildings</option>
            {buildingsList.map((b, idx) => (
              <option key={idx} value={b}>{b}</option>
            ))}
          </select>

          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-650 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="All">All Floors</option>
            {floorsList.map((f, idx) => (
              <option key={idx} value={f}>{f}</option>
            ))}
          </select>

          <select
            value={selectedRoomType}
            onChange={(e) => setSelectedRoomType(e.target.value)}
            className="text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-650 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="All">All Room Types</option>
            <option value="Single">Single Seater</option>
            <option value="2-Seater">Double (2 Seater)</option>
            <option value="4-Seater">Quad (4 Seater)</option>
          </select>

          <select
            value={selectedOccupancy}
            onChange={(e) => setSelectedOccupancy(e.target.value)}
            className="text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-650 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="All">All Occupancy States</option>
            <option value="Vacant">Vacant Rooms Only</option>
            <option value="Partial">Partially Occupied Rooms</option>
            <option value="Full">Fully Occupied Rooms</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-650 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Rooms</option>
            <option value="Inactive">Inactive Rooms</option>
          </select>
        </div>

        <button
          onClick={() => {
            setSelectedHostel('All');
            setSelectedBuilding('All');
            setSelectedFloor('All');
            setSelectedRoomType('All');
            setSelectedOccupancy('All');
            setSelectedStatus('All');
          }}
          className="p-1.5 text-slate-500 hover:text-indigo-650 hover:bg-slate-50 border border-slate-200 bg-white rounded-lg transition"
          title="Reset Filters"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── BULK ACTION TOOLBAR ── */}
      {selectedRoomIds.length > 0 && activeTab === 'Rooms' && (
        <div className="bg-slate-900 text-white rounded-xl px-4 py-2.5 flex items-center justify-between shadow-md border border-slate-800 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center bg-indigo-600 text-white font-bold rounded-full w-5 h-5 text-[9px] shadow-sm">
              {selectedRoomIds.length}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-350">Selected Rooms</span>
          </div>

          <div className="flex items-center gap-2">
            {onlyTrashed ? (
              <>
                <button
                  onClick={handleBulkRestore}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition shadow-sm cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Selected</span>
                </button>
                <button
                  onClick={handleBulkForceDelete}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] transition shadow-sm cursor-pointer"
                >
                  <Trash className="w-3.5 h-3.5" />
                  <span>Delete Permanently</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleBulkStatus('active')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition shadow-sm cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Active</span>
                </button>
                <button
                  onClick={() => handleBulkStatus('inactive')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] transition shadow-sm cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Mark Inactive</span>
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] transition shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Soft Delete Rooms</span>
                </button>
              </>
            )}

            <div className="h-4 w-px bg-slate-750 mx-1"></div>

            <button
              onClick={() => setSelectedRoomIds([])}
              className="px-2.5 py-1 text-slate-400 hover:text-white transition text-[10px] font-bold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── UNIFIED TABS PANEL (ONE PAGE SYSTEM) ── */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 justify-between items-center pr-3 flex-wrap gap-2">
          <div className="flex">
            <button
              onClick={() => setActiveTab('Blueprint')}
              className={`px-4 py-3 font-bold border-b-2 text-[10px] uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'Blueprint'
                  ? 'border-indigo-600 text-indigo-650 bg-white'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Interactive Floor Blueprint</span>
            </button>
            
            <button
              onClick={() => setActiveTab('Rooms')}
              className={`px-4 py-3 font-bold border-b-2 text-[10px] uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'Rooms'
                  ? 'border-indigo-600 text-indigo-650 bg-white'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Room Master Registry</span>
            </button>
          </div>

          {/* Action Tools for Rooms Registry */}
          {activeTab === 'Rooms' && (
            <div className="flex items-center gap-2 py-1.5">
              
              {/* CSV Template */}
              <button
                onClick={exportRoomsToCSV}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold transition text-[9px] cursor-pointer"
                title="Export rooms list to CSV"
              >
                <Download className="w-3 h-3" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setIsImportOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition text-[9px] cursor-pointer"
                title="Import rooms from CSV"
              >
                <Upload className="w-3 h-3" />
                <span>Import CSV</span>
              </button>

              <div className="h-4 w-px bg-slate-200 mx-1"></div>

              {/* Trash View Toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 hover:bg-slate-150 transition">
                <input
                  type="checkbox"
                  checked={onlyTrashed}
                  onChange={(e) => setOnlyTrashed(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-3 h-3 cursor-pointer"
                />
                <span className="font-bold text-[9px] text-slate-600 uppercase tracking-wide flex items-center gap-0.5">
                  <Trash className={`w-3 h-3 ${onlyTrashed ? 'text-rose-500' : 'text-slate-400'}`} />
                  Trash View
                </span>
              </label>

            </div>
          )}
        </div>

        {/* Tab Content Panels */}
        <div className="p-4">
          
          {/* TAB 1: VISUAL BLUEPRINT MAP */}
          {activeTab === 'Blueprint' && (
            <div className="space-y-4">
              <div className="flex border-b pb-2 justify-between items-center flex-wrap gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                <span>Visual room seater occupancy map</span>
                <div className="flex gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-emerald-50 text-emerald-600 border border-emerald-250 rounded-full inline-block"></span>
                    <span>Vacant Bed (Click to Allocate)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-indigo-50 text-indigo-700 border border-indigo-250 rounded-full inline-block"></span>
                    <span>Occupied Bed</span>
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 font-medium">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-650 mb-2"></div>
                  <span>Syncing floor map blueprint...</span>
                </div>
              ) : rooms.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-medium">
                  No rooms found matching filters. Select Room Registry tab to add rooms.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.map((room) => {
                    const activeAllocations = room.allocations || [];
                    const bedItems = [];
                    for (let i = 1; i <= room.total_beds; i++) {
                      const bedNo = `Bed-${String(i).padStart(2, '0')}`;
                      const alloc = activeAllocations.find(a => a.bed_number === bedNo);
                      bedItems.push({ bedNo, alloc });
                    }

                    const isFullyOccupied = activeAllocations.length >= room.total_beds;
                    const isVacant = activeAllocations.length === 0;

                    return (
                      <div key={room.id} className="border border-slate-200 rounded-xl bg-slate-50/25 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition duration-150 flex flex-col justify-between">
                        
                        <div className="bg-slate-100/70 border-b border-slate-200 px-3.5 py-2.5 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-slate-900 text-[12px]">{room.room_number}</span>
                              <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold border uppercase tracking-wider ${
                                isFullyOccupied ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                                isVacant ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                'bg-amber-50 text-amber-600 border-amber-200'
                              }`}>
                                {isFullyOccupied ? 'Full' : isVacant ? 'Vacant' : `${activeAllocations.length}/${room.total_beds} Beds`}
                              </span>
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-wide">
                              {room.hostel_name} • {room.floor}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => startEditRoom(room)}
                            className="p-1 hover:bg-indigo-50 text-slate-450 hover:text-indigo-650 border border-transparent hover:border-indigo-100 rounded transition cursor-pointer"
                            title="Edit Room Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="p-3.5 space-y-2.5">
                          {room.remarks && (
                            <p className="text-[10px] text-slate-450 italic mt-0.5 border-b pb-1.5 mb-2 truncate" title={room.remarks}>
                              Note: {room.remarks}
                            </p>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2">
                            {bedItems.map((bed, bIdx) => {
                              const isOccupied = !!bed.alloc;
                              return (
                                <div 
                                  key={bIdx}
                                  onClick={() => !isOccupied && triggerBedAllocation(room, bed.bedNo)}
                                  className={`border rounded-lg p-2.5 transition duration-150 ${
                                    isOccupied 
                                      ? 'bg-white border-indigo-150 shadow-xs' 
                                      : 'bg-emerald-50/20 border-emerald-100 hover:bg-emerald-50/50 hover:border-emerald-300 cursor-pointer'
                                  }`}
                                >
                                  <div className="flex items-center justify-between border-b pb-1 mb-1">
                                    <span className="font-bold font-mono text-[9px] text-slate-450 uppercase">{bed.bedNo}</span>
                                    <span className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-indigo-650' : 'bg-emerald-500'}`}></span>
                                  </div>
                                  
                                  {isOccupied && bed.alloc ? (
                                    <div className="space-y-1">
                                      <div className="font-bold text-slate-800 flex items-center gap-1" title={bed.alloc.student.user?.full_name || `${bed.alloc.student.first_name} ${bed.alloc.student.last_name}`}>
                                        <User className="w-3 h-3 text-indigo-400 shrink-0" />
                                        <span className="truncate max-w-[85px]">{bed.alloc.student.user ? bed.alloc.student.user.full_name : `${bed.alloc.student.first_name} ${bed.alloc.student.last_name}`}</span>
                                      </div>
                                      <div className="text-[9px] text-slate-400 font-mono">
                                        {bed.alloc.student.class?.m_name || 'N/A'} - {bed.alloc.student.section || 'N/A'}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCheckout(bed.alloc!.id);
                                        }}
                                        className="w-full mt-1 py-0.5 bg-slate-900 hover:bg-rose-650 text-white rounded font-bold transition flex items-center justify-center gap-1 text-[8px] cursor-pointer"
                                      >
                                        <LogOut className="w-2.5 h-2.5" />
                                        <span>Checkout</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="py-2.5 text-center text-slate-400 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 select-none">
                                      <span>Assign Bed</span>
                                      <ArrowRight className="w-2.5 h-2.5 text-emerald-500" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ROOM MASTER REGISTRY */}
          {activeTab === 'Rooms' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-slate-50 px-3.5 py-2.5 border-b font-bold text-[10px] uppercase text-slate-500 flex justify-between items-center pr-3">
                <span>Rooms Registry List Table</span>
                {onlyTrashed && (
                  <span className="text-[8px] bg-rose-50 text-rose-600 border border-rose-150 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
                    Trash Bin
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-650 mb-2"></div>
                    <span>Loading table list...</span>
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-medium">
                    No rooms registered. Please add a room using the "+ Add Room" button.
                  </div>
                ) : (
                  <table className="w-full text-left text-slate-650 border-collapse">
                    <thead className="bg-slate-50 text-[9px] uppercase font-bold text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-10">
                          <input
                            type="checkbox"
                            checked={selectedRoomIds.length === rooms.length && rooms.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                          />
                        </th>
                        <th className="py-2 px-3">Room No</th>
                        <th className="py-2 px-3">Hostel Details</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3 text-center">Beds Seater</th>
                        {!onlyTrashed && <th className="py-2 px-3">Status</th>}
                        {onlyTrashed && <th className="py-2 px-3">Deleted At</th>}
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px] font-medium">
                      {rooms.map((room) => {
                        const occupants = room.allocations || [];
                        const isSelected = selectedRoomIds.includes(room.id);
                        return (
                          <tr key={room.id} className={`hover:bg-slate-50/50 ${isSelected ? 'bg-indigo-50/15' : ''}`}>
                            <td className="py-2.5 px-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectRoom(room.id)}
                                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{room.room_number}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-700">{room.hostel_name}</div>
                              <div className="text-[9px] text-slate-400 font-mono mt-0.5">{room.building} | {room.floor}</div>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-600">{room.room_type}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                occupants.length >= room.total_beds ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                                occupants.length === 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-250' :
                                'bg-amber-50 text-amber-600 border-amber-250'
                              }`}>
                                {occupants.length} / {room.total_beds} occupied
                              </span>
                            </td>
                            {!onlyTrashed && (
                              <td className="py-2.5 px-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(room.id)}
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition duration-150 cursor-pointer ${
                                    room.is_active
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                      : 'bg-slate-100 text-slate-650 border-slate-200 hover:bg-slate-200'
                                  }`}
                                  title="Click to toggle active status"
                                >
                                  {room.is_active ? 'Active' : 'Inactive'}
                                </button>
                              </td>
                            )}
                            {onlyTrashed && (
                              <td className="py-2.5 px-3 text-slate-400 font-mono text-[9.5px]">
                                {room.deleted_at ? new Date(room.deleted_at).toLocaleDateString() : '--'}
                              </td>
                            )}
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {onlyTrashed ? (
                                  <>
                                    <button
                                      onClick={() => handleRestoreRoom(room.id)}
                                      className="flex items-center gap-0.5 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded font-semibold cursor-pointer text-[9.5px]"
                                      title="Restore Room"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      <span>Restore</span>
                                    </button>
                                    <button
                                      onClick={() => handleForceDeleteRoom(room.id, room.room_number)}
                                      className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-605 rounded transition cursor-pointer"
                                      title="Delete Permanently"
                                    >
                                      <Trash className="w-3.5 h-3.5 text-rose-500" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => startEditRoom(room)}
                                      className="p-1 hover:bg-indigo-50 text-slate-450 hover:text-indigo-650 border border-transparent hover:border-indigo-100 rounded transition cursor-pointer"
                                      title="Edit Room details"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRoom(room.id, room.room_number)}
                                      className="p-1 hover:bg-rose-50 text-slate-450 hover:text-rose-600 border border-transparent hover:border-rose-100 rounded transition cursor-pointer"
                                      title="Soft-delete Room"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CSV BULK IMPORT MODAL ── */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">Bulk Import Rooms from CSV</span>
              </div>
              <button
                onClick={() => {
                  setIsImportOpen(false);
                  setImportFile(null);
                  setCsvPreview(null);
                }}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <form onSubmit={handleCSVImport} className="p-5 space-y-4">
              
              {/* Instructions */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-[10px] text-slate-650 leading-relaxed">
                  <p className="font-bold text-slate-800">Instructions for Rooms CSV import:</p>
                  <p className="mt-1">
                    Upload a CSV file containing your hostel rooms roster. The file headers must strictly match the template formatting. 
                    If a room already exists in the selected building/floor, it will be updated (upserted).
                  </p>
                  <button
                    type="button"
                    onClick={downloadSampleCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold mt-2.5 transition active:scale-95 text-[9px] cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Sample Rooms CSV</span>
                  </button>
                </div>
              </div>

              {/* Drag-and-drop input area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-250 hover:border-blue-500 rounded-xl p-6 text-center bg-slate-50/55 hover:bg-slate-50 cursor-pointer transition"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.txt"
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-700 text-[11px]">
                  {importFile ? importFile.name : 'Drag & Drop CSV File here or click to browse'}
                </p>
                <p className="text-[9px] text-slate-400 mt-1">Supports: standard comma-separated text files (.csv, .txt)</p>
                {importFile && (
                  <p className="text-[9px] text-emerald-600 font-bold mt-1.5">
                    File selected: {(importFile.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>

              {/* CSV Preview Cards Table */}
              {csvPreview && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2 font-bold text-[9px] uppercase tracking-wide text-slate-500 flex items-center justify-between">
                    <span>Parsed Roster Preview (First 5 Rows)</span>
                    <span className="text-[8px] bg-slate-200 text-slate-650 px-1.5 py-0.5 rounded">Check alignments below</span>
                  </div>
                  <div className="overflow-x-auto max-h-[160px]">
                    <table className="w-full text-left text-[10px] text-slate-600 border-collapse">
                      <thead className="bg-slate-50 font-bold border-b text-slate-450 text-[8px] uppercase">
                        <tr>
                          {csvPreview.headers.map((h, idx) => (
                            <th key={idx} className="py-2 px-3 bg-slate-100/80">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {csvPreview.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-55/20">
                            {csvPreview.headers.map((h, cIdx) => (
                              <td key={cIdx} className="py-1.5 px-3 max-w-[120px] truncate" title={row[h]}>
                                {row[h] || <span className="text-slate-350 italic">empty</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-2 border-t pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportOpen(false);
                    setImportFile(null);
                    setCsvPreview(null);
                  }}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg font-bold cursor-pointer"
                  disabled={importing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  disabled={importing || !importFile}
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Parse & Import</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── STUDENT BED ALLOCATION DIALOG (BLUE BUTTON) ── */}
      {isAllocateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm">Student Bed Allocation</span>
              </div>
              <button
                onClick={() => {
                  setIsAllocateOpen(false);
                  resetAllocForm();
                }}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAllocateSubmit} className="p-4 space-y-4 font-medium">
              
              {/* Eligible Students dropdown (Requires approved admission & no active beds) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Student</label>
                <select
                  required
                  value={allocStudentId}
                  onChange={(e) => setAllocStudentId(e.target.value)}
                  className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  <option value="">Select Student</option>
                  {eligibleStudents.map((s) => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.name} ({s.class_name} - {s.section}) [Roll: {s.roll_no}]
                    </option>
                  ))}
                </select>
                {eligibleStudents.length === 0 && (
                  <p className="text-[9.5px] text-amber-500 mt-1 flex items-center gap-1 leading-normal font-semibold">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    No eligible students. Students must have APPROVED admissions & no active beds.
                  </p>
                )}
              </div>

              {/* Room Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hostel Room</label>
                <select
                  required
                  value={allocRoomId}
                  onChange={(e) => {
                    setAllocRoomId(e.target.value);
                    setAllocBedNumber(''); // reset bed number on room change
                  }}
                  className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  <option value="">Select Room</option>
                  {roomsList.map((r) => {
                    const vacant = r.total_beds - r.occupied_beds.length;
                    return (
                      <option key={r.id} value={r.id} disabled={vacant === 0}>
                        {r.room_number} ({r.hostel_name} - {r.room_type}) [{vacant} beds free]
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Bed Number Selection (Filtered dynamically based on capacity & vacancy) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bed Number</label>
                <select
                  required
                  value={allocBedNumber}
                  onChange={(e) => setAllocBedNumber(e.target.value)}
                  className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  disabled={!allocRoomId}
                >
                  <option value="">Select Bed</option>
                  {getAvailableBeds().map((bed, idx) => (
                    <option key={idx} value={bed}>{bed}</option>
                  ))}
                </select>
                {!allocRoomId && (
                  <p className="text-[9px] text-slate-400 mt-1">Please select a hostel room first to view vacant beds.</p>
                )}
              </div>

              {/* Allocation Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Allocation Date</label>
                <input
                  type="date"
                  required
                  value={allocDate}
                  onChange={(e) => setAllocDate(e.target.value)}
                  className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Office Remarks */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Allocation Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. temporary arrangement, ground floor request"
                  value={allocRemarks}
                  onChange={(e) => setAllocRemarks(e.target.value)}
                  className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2 border-t pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAllocateOpen(false);
                    resetAllocForm();
                  }}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs transition cursor-pointer"
                >
                  Allocate Bed
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT ROOM MODAL ── */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm font-sans">
                  {editingRoom ? `Edit Room: ${editingRoom.room_number}` : 'Add New Hostel Room'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRoomModalOpen(false);
                  resetRoomForm();
                }}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleRoomSubmit} className="p-4 space-y-4 font-medium">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hostel Name</label>
                <select
                  required
                  value={roomHostelName}
                  onChange={(e) => setRoomHostelName(e.target.value)}
                  className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  <option value="Boys Hostel A">Boys Hostel A</option>
                  <option value="Girls Hostel B">Girls Hostel B</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Building</label>
                <select
                  required
                  value={roomBuilding}
                  onChange={(e) => setRoomBuilding(e.target.value)}
                  className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  <option value="Main Block">Main Block</option>
                  <option value="Block B">Block B</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Floor</label>
                <select
                  required
                  value={roomFloor}
                  onChange={(e) => setRoomFloor(e.target.value)}
                  className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  <option value="Ground Floor">Ground Floor</option>
                  <option value="First Floor">First Floor</option>
                  <option value="Second Floor">Second Floor</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Room Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A-104"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Room Type</label>
                  <select
                    required
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Single">Single Seater</option>
                    <option value="2-Seater">Double (2 Seater)</option>
                    <option value="4-Seater">Quad (4 Seater)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Capacity Beds Count</label>
                <input
                  type="number"
                  readOnly
                  value={roomTotalBeds}
                  className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-100 bg-slate-100/60 font-bold font-mono text-slate-650 outline-none cursor-not-allowed"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer mt-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5 hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={roomIsActive}
                    onChange={(e) => setRoomIsActive(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-[10px] text-slate-700 uppercase tracking-wide">Room Status: Active</span>
                    <p className="text-[9px] text-slate-400 font-medium normal-case">Inactive rooms cannot receive new bed allocations.</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Room Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Next to study lounge"
                  value={roomRemarks}
                  onChange={(e) => setRoomRemarks(e.target.value)}
                  className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2 border-t pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsRoomModalOpen(false);
                    resetRoomForm();
                  }}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition cursor-pointer"
                >
                  {editingRoom ? 'Update Room Settings' : 'Save New Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default HostelAllocationManager;
