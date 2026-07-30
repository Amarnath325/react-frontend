import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import {
  CalendarDays, Users, UserCheck, UserX, Clock, AlarmClock,
  CheckCircle2, Search, Save, RotateCcw, Filter, UserMinus,
  GraduationCap, Briefcase, Printer, Download, ChevronLeft,
  ChevronRight, Lock, CheckSquare, XCircle, FileSpreadsheet
} from 'lucide-react';
import api from '../../services/api';

// Types
type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
type EntryMode = 'student' | 'staff';

interface SelectOption { value: string; label: string; }

interface StudentEntryRow {
  student_id: number;
  student_name: string;
  admission_number: string;
  roll_number: string;
  section: string;
  photo_url: string | null;
  status: AttendanceStatus | null;
  in_time: string | null;
  out_time: string | null;
  remarks: string | null;
}

interface StaffEntryRow {
  staff_id: number;
  staff_type: 'Teacher' | 'NonTeaching';
  employee_id: string;
  name: string;
  department: string | null;
  designation: string | null;
  status: AttendanceStatus | null;
  check_in: string | null;
  check_out: string | null;
  late_minutes: number;
  overtime_minutes: number;
  remarks: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; full: string; color: string; bg: string; border: string; badgeBg: string }> = {
  present:  { label: 'P',  full: 'Present',  color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-400', badgeBg: 'bg-emerald-500 text-white' },
  absent:   { label: 'A',  full: 'Absent',   color: 'text-rose-700',    bg: 'bg-rose-100',    border: 'border-rose-400',    badgeBg: 'bg-rose-500 text-white' },
  late:     { label: 'L',  full: 'Late',     color: 'text-amber-700',   bg: 'bg-amber-100',   border: 'border-amber-400',   badgeBg: 'bg-amber-500 text-white' },
  half_day: { label: 'HD', full: 'Half Day', color: 'text-blue-700',    bg: 'bg-blue-100',    border: 'border-blue-400',    badgeBg: 'bg-blue-500 text-white' },
  on_leave: { label: 'OL', full: 'On Leave', color: 'text-purple-700',  bg: 'bg-purple-100',  border: 'border-purple-400',  badgeBg: 'bg-purple-500 text-white' },
};

const TODAY = new Date().toISOString().split('T')[0];

const selectSt = {
  control: (b: any) => ({ ...b, borderRadius: '8px', borderColor: '#cbd5e1', minHeight: '32px', height: '32px', fontSize: '12px', boxShadow: 'none', '&:hover': { borderColor: '#94a3b8' } }),
  valueContainer: (b: any) => ({ ...b, padding: '0 8px' }),
  input: (b: any) => ({ ...b, margin: '0', padding: '0' }),
  option: (b: any, s: any) => ({ ...b, backgroundColor: s.isFocused ? '#eff6ff' : 'white', fontSize: '12px', padding: '6px 10px', cursor: 'pointer' }),
  placeholder: (b: any) => ({ ...b, fontSize: '12px', color: '#94a3b8' }),
  singleValue: (b: any) => ({ ...b, fontSize: '12px', fontWeight: 600, color: '#334155' }),
};

const AVATAR_BG = ['bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-indigo-600'];

const DEMO_STUDENTS: StudentEntryRow[] = [
  { student_id: 1, student_name: 'Aarav Sharma', admission_number: 'ADM-2026-001', roll_number: '1', section: 'A', photo_url: null, status: 'present', in_time: '08:30', out_time: '14:30', remarks: '' },
  { student_id: 2, student_name: 'Priya Gupta', admission_number: 'ADM-2026-002', roll_number: '2', section: 'A', photo_url: null, status: 'present', in_time: '08:30', out_time: '14:30', remarks: '' },
  { student_id: 3, student_name: 'Rohit Kumar', admission_number: 'ADM-2026-003', roll_number: '3', section: 'A', photo_url: null, status: 'absent', in_time: null, out_time: null, remarks: 'Sick leave informed by parent' },
  { student_id: 4, student_name: 'Sneha Patel', admission_number: 'ADM-2026-004', roll_number: '4', section: 'A', photo_url: null, status: 'late', in_time: '09:05', out_time: '14:30', remarks: 'Traffic delay' },
  { student_id: 5, student_name: 'Arjun Singh', admission_number: 'ADM-2026-005', roll_number: '5', section: 'A', photo_url: null, status: 'present', in_time: '08:28', out_time: '14:30', remarks: '' },
  { student_id: 6, student_name: 'Deepika Nair', admission_number: 'ADM-2026-006', roll_number: '6', section: 'A', photo_url: null, status: 'half_day', in_time: '08:30', out_time: '11:30', remarks: 'Doctor appointment' },
  { student_id: 7, student_name: 'Karan Mehta', admission_number: 'ADM-2026-007', roll_number: '7', section: 'A', photo_url: null, status: 'present', in_time: '08:30', out_time: '14:30', remarks: '' },
  { student_id: 8, student_name: 'Ananya Reddy', admission_number: 'ADM-2026-008', roll_number: '8', section: 'A', photo_url: null, status: null, in_time: null, out_time: null, remarks: '' },
];

const DEMO_STAFF: StaffEntryRow[] = [
  { staff_id: 1, staff_type: 'Teacher', employee_id: 'EMP-T101', name: 'Dr. Rajesh Sharma', department: 'Mathematics', designation: 'HOD Science', status: 'present', check_in: '08:15', check_out: '16:00', late_minutes: 0, overtime_minutes: 30, remarks: '' },
  { staff_id: 2, staff_type: 'Teacher', employee_id: 'EMP-T102', name: 'Sunita Verma', department: 'English', designation: 'Sr. Teacher', status: 'present', check_in: '08:20', check_out: '16:00', late_minutes: 0, overtime_minutes: 0, remarks: '' },
  { staff_id: 3, staff_type: 'Teacher', employee_id: 'EMP-T103', name: 'Amitabh Sen', department: 'Physics', designation: 'Lecturer', status: 'late', check_in: '08:45', check_out: '16:00', late_minutes: 15, overtime_minutes: 0, remarks: 'Informed HR' },
  { staff_id: 4, staff_type: 'Teacher', employee_id: 'EMP-T104', name: 'Meenakshi Sundaram', department: 'Chemistry', designation: 'Lab Incharge', status: 'on_leave', check_in: null, check_out: null, late_minutes: 0, overtime_minutes: 0, remarks: 'Casual Leave' },
  { staff_id: 5, staff_type: 'NonTeaching', employee_id: 'EMP-NT01', name: 'Ramesh Chandra', department: 'Administration', designation: 'Accountant', status: 'present', check_in: '08:30', check_out: '16:30', late_minutes: 0, overtime_minutes: 0, remarks: '' },
  { staff_id: 6, staff_type: 'NonTeaching', employee_id: 'EMP-NT02', name: 'Kavita Deshmukh', department: 'Library', designation: 'Librarian', status: 'present', check_in: '08:30', check_out: '16:30', late_minutes: 0, overtime_minutes: 0, remarks: '' },
];

export default function DailyAttendanceEntry() {
  const [mode, setMode] = useState<EntryMode>('student');
  const [entryDate, setEntryDate] = useState<string>(TODAY);

  // Student mode state
  const [classList, setClassList] = useState<SelectOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<StudentEntryRow[]>([]);
  const [studentSearch, setStudentSearch] = useState<string>('');

  // Staff mode state
  const [deptList, setDeptList] = useState<SelectOption[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [staffType, setStaffType] = useState<string>('');
  const [staffList, setStaffList] = useState<StaffEntryRow[]>([]);
  const [staffSearch, setStaffSearch] = useState<string>('');

  // Shared state
  const [defaultInTime, setDefaultInTime] = useState<string>('08:30');
  const [defaultOutTime, setDefaultOutTime] = useState<string>('14:30');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Load master dropdowns
  useEffect(() => {
    api.get('/attendance/class-list')
      .then(r => {
        if (r.data.success) {
          setClassList(r.data.data.map((c: any) => ({ value: String(c.id), label: c.name })));
        }
      })
      .catch(() => setClassList([
        { value: '1', label: 'Class 10-A' }, { value: '2', label: 'Class 10-B' },
        { value: '3', label: 'Class 9-A' },  { value: '4', label: 'Class 9-B' },
        { value: '5', label: 'Class 8-A' },
      ]));

    api.get('/school/employee-attendance/departments')
      .then(r => {
        if (r.data.success) {
          setDeptList(r.data.data.map((d: string) => ({ value: d, label: d })));
        }
      })
      .catch(() => setDeptList([
        { value: 'Mathematics', label: 'Mathematics' },
        { value: 'English', label: 'English' },
        { value: 'Physics', label: 'Physics' },
        { value: 'Chemistry', label: 'Chemistry' },
        { value: 'Administration', label: 'Administration' },
      ]));
  }, []);

  // Fetch Student Sheet
  const fetchStudentSheet = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const res = await api.get('/attendance/class-students', {
        params: { class_id: selectedClass, date: entryDate }
      });
      if (res.data.success) {
        setStudents(res.data.data.map((s: any) => ({
          student_id: s.student_id,
          student_name: s.student_name,
          admission_number: s.admission_number,
          roll_number: s.roll_number,
          section: s.section || 'A',
          photo_url: s.photo_url || null,
          status: s.status || null,
          in_time: s.in_time || null,
          out_time: s.out_time || null,
          remarks: s.remarks || '',
        })));
      }
    } catch {
      setStudents(DEMO_STUDENTS);
    } finally { setLoading(false); }
  }, [selectedClass, entryDate]);

  // Fetch Staff Sheet
  const fetchStaffSheet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/employee-attendance/daily', {
        params: { date: entryDate, staff_type: staffType || undefined }
      });
      if (res.data.success) {
        let rows: StaffEntryRow[] = res.data.data.map((r: any) => ({
          staff_id: r.staff_id,
          staff_type: r.staff_type,
          employee_id: r.employee_id,
          name: r.name,
          department: r.department,
          designation: r.designation,
          status: r.status || null,
          check_in: r.check_in || null,
          check_out: r.check_out || null,
          late_minutes: r.late_minutes || 0,
          overtime_minutes: r.overtime_minutes || 0,
          remarks: r.remarks || '',
        }));
        if (selectedDept) {
          rows = rows.filter(x => x.department?.toLowerCase() === selectedDept.toLowerCase());
        }
        setStaffList(rows);
      }
    } catch {
      let demo = DEMO_STAFF;
      if (staffType) demo = demo.filter(s => s.staff_type === staffType);
      if (selectedDept) demo = demo.filter(s => s.department?.toLowerCase() === selectedDept.toLowerCase());
      setStaffList(demo);
    } finally { setLoading(false); }
  }, [entryDate, staffType, selectedDept]);

  useEffect(() => {
    if (mode === 'student') fetchStudentSheet();
    else fetchStaffSheet();
  }, [mode, fetchStudentSheet, fetchStaffSheet]);

  // Date Shift Helper
  const shiftDate = (days: number) => {
    const d = new Date(entryDate);
    d.setDate(d.getDate() + days);
    setEntryDate(d.toISOString().split('T')[0]);
  };

  // Mass Actions - Student
  const markAllStudents = (st: AttendanceStatus) => {
    setStudents(prev => prev.map(s => ({
      ...s,
      status: st,
      in_time: st === 'present' || st === 'late' || st === 'half_day' ? (s.in_time || defaultInTime) : null,
      out_time: st === 'present' || st === 'late' ? (s.out_time || defaultOutTime) : st === 'half_day' ? '12:00' : null,
    })));
  };

  const applyDefaultTimesStudent = () => {
    setStudents(prev => prev.map(s => ({
      ...s,
      in_time: s.status ? defaultInTime : s.in_time,
      out_time: s.status ? defaultOutTime : s.out_time,
    })));
    toast.success(`Applied ${defaultInTime} - ${defaultOutTime} to marked students`);
  };

  const resetStudentSheet = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: null, in_time: null, out_time: null, remarks: '' })));
  };

  // Mass Actions - Staff
  const markAllStaff = (st: AttendanceStatus) => {
    setStaffList(prev => prev.map(s => ({
      ...s,
      status: st,
      check_in: st === 'present' || st === 'late' || st === 'half_day' ? (s.check_in || '09:00') : null,
      check_out: st === 'present' || st === 'late' ? (s.check_out || '17:00') : st === 'half_day' ? '13:00' : null,
    })));
  };

  const applyDefaultTimesStaff = () => {
    setStaffList(prev => prev.map(s => ({
      ...s,
      check_in: s.status ? '09:00' : s.check_in,
      check_out: s.status ? '17:00' : s.check_out,
    })));
    toast.success(`Applied default times (09:00 - 17:00) to staff`);
  };

  const resetStaffSheet = () => {
    setStaffList(prev => prev.map(s => ({ ...s, status: null, check_in: null, check_out: null, late_minutes: 0, overtime_minutes: 0, remarks: '' })));
  };

  // Save Handlers
  const saveStudentAttendance = async () => {
    if (!selectedClass || students.length === 0) {
      toast.error('Please select a class with students');
      return;
    }
    const records = students.map(s => ({
      student_id: s.student_id,
      date: entryDate,
      status: s.status || 'present',
      in_time: s.in_time || null,
      out_time: s.out_time || null,
      remarks: s.remarks || null,
    }));

    setSaving(true);
    try {
      await api.post('/attendance/bulk-mark', { records });
      toast.success(`Daily attendance saved for ${records.length} students!`);
      fetchStudentSheet();
    } catch {
      toast.error('Failed to save student attendance');
    } finally { setSaving(false); }
  };

  const saveStaffAttendance = async () => {
    if (staffList.length === 0) {
      toast.error('No staff members to save');
      return;
    }
    const records = staffList.map(s => ({
      staff_id: s.staff_id,
      staff_type: s.staff_type,
      status: s.status || 'present',
      check_in: s.check_in || null,
      check_out: s.check_out || null,
      late_minutes: s.late_minutes || 0,
      overtime_minutes: s.overtime_minutes || 0,
      remarks: s.remarks || null,
    }));

    setSaving(true);
    try {
      await api.post('/school/employee-attendance/bulk-mark', { date: entryDate, records });
      toast.success(`Daily attendance saved for ${records.length} staff members!`);
      fetchStaffSheet();
    } catch {
      toast.error('Failed to save staff attendance');
    } finally { setSaving(false); }
  };

  // Export & Print
  const exportToExcel = () => {
    if (mode === 'student') {
      const data = filteredStudents.map((s, i) => ({
        '#': i + 1, 'Roll': s.roll_number, 'Student Name': s.student_name, 'Adm No': s.admission_number,
        'Status': s.status ? STATUS_CONFIG[s.status]?.full : 'Unmarked', 'In Time': s.in_time || '', 'Out Time': s.out_time || '', 'Remarks': s.remarks || ''
      }));
      const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Student Daily Sheet');
      XLSX.writeFile(wb, `student_daily_attendance_${entryDate}.xlsx`);
    } else {
      const data = filteredStaff.map((s, i) => ({
        '#': i + 1, 'Emp ID': s.employee_id, 'Name': s.name, 'Type': s.staff_type, 'Department': s.department || '',
        'Status': s.status ? STATUS_CONFIG[s.status]?.full : 'Unmarked', 'Check In': s.check_in || '', 'Check Out': s.check_out || '', 'Late (m)': s.late_minutes, 'OT (m)': s.overtime_minutes, 'Remarks': s.remarks || ''
      }));
      const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Staff Daily Sheet');
      XLSX.writeFile(wb, `staff_daily_attendance_${entryDate}.xlsx`);
    }
    toast.success('Exported daily attendance sheet');
  };

  // Filtered lists
  const filteredStudents = students.filter(s =>
    s.student_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.admission_number.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.roll_number.includes(studentSearch)
  );

  const filteredStaff = staffList.filter(s =>
    s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.employee_id.toLowerCase().includes(staffSearch.toLowerCase()) ||
    (s.department && s.department.toLowerCase().includes(staffSearch.toLowerCase()))
  );

  // Counters - Student
  const sP = students.filter(s => s.status === 'present').length;
  const sA = students.filter(s => s.status === 'absent').length;
  const sL = students.filter(s => s.status === 'late').length;
  const sHD = students.filter(s => s.status === 'half_day').length;
  const sMarked = students.filter(s => s.status !== null).length;
  const sPct = sMarked > 0 ? Math.round(((sP + sL + 0.5 * sHD) / sMarked) * 1000) / 10 : 0;

  // Counters - Staff
  const stP = staffList.filter(s => s.status === 'present').length;
  const stA = staffList.filter(s => s.status === 'absent').length;
  const stL = staffList.filter(s => s.status === 'late').length;
  const stHD = staffList.filter(s => s.status === 'half_day').length;
  const stOL = staffList.filter(s => s.status === 'on_leave').length;
  const stMarked = staffList.filter(s => s.status !== null).length;
  const stPct = stMarked > 0 ? Math.round(((stP + stL + 0.5 * stHD) / stMarked) * 1000) / 10 : 0;

  return (
    <div className="bg-[#f4f7fc] min-h-screen p-2 sm:p-3 font-sans text-slate-800">
      <div className="max-w-[1600px] mx-auto space-y-2">

        {/* PAGE HEADER & MODE TOGGLE */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div>
            <h1 className="text-lg font-bold text-[#2b6cb0] tracking-tight leading-none">Daily Attendance Kiosk / Console</h1>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
              <span>Attendance</span><span className="text-slate-300">/</span>
              <span className="font-bold text-slate-700">Daily Attendance Entry</span>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1">
            <button onClick={() => setMode('student')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${mode === 'student' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
              <GraduationCap className="w-4 h-4" />
              <span>Student Entry</span>
            </button>
            <button onClick={() => setMode('staff')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${mode === 'staff' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
              <Briefcase className="w-4 h-4" />
              <span>Teacher & Staff Entry</span>
            </button>
          </div>

          {/* Date Picker & Prev/Next Day */}
          <div className="flex items-center gap-1">
            <button onClick={() => shiftDate(-1)} className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 cursor-pointer" title="Previous Day">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="relative">
              <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)}
                className="px-3 py-1 h-8 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={() => shiftDate(1)} className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 cursor-pointer" title="Next Day">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setEntryDate(TODAY)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer">
              Today
            </button>
          </div>
        </div>

        {/* FILTER BAR & SUMMARY CARDS */}
        {mode === 'student' ? (
          <>
            {/* Student Filter Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <div style={{ minWidth: '180px' }}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Class / Section *</label>
                  <Select options={classList} value={classList.find(c => c.value === selectedClass) || null}
                    onChange={o => setSelectedClass(o?.value || '')} placeholder="Select Class..." styles={selectSt} classNamePrefix="react-select" isClearable />
                </div>
                <div className="relative flex-1" style={{ minWidth: '160px' }}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Search Student</label>
                  <Search className="absolute left-2.5 top-[25px] w-3.5 h-3.5 text-slate-400" />
                  <input type="text" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Filter name / roll / adm no..."
                    className="w-full pl-8 pr-2.5 h-8 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="flex items-center gap-1.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Default Times</label>
                    <div className="flex items-center gap-1">
                      <input type="time" value={defaultInTime} onChange={e => setDefaultInTime(e.target.value)} className="h-8 px-1.5 border border-slate-300 rounded-lg text-xs font-mono" />
                      <span className="text-slate-400 text-xs">-</span>
                      <input type="time" value={defaultOutTime} onChange={e => setDefaultOutTime(e.target.value)} className="h-8 px-1.5 border border-slate-300 rounded-lg text-xs font-mono" />
                      <button onClick={applyDefaultTimesStudent} className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer" title="Apply to all marked">Apply</button>
                    </div>
                  </div>
                </div>
                <div className="flex items-end gap-1.5 ml-auto">
                  <button onClick={() => markAllStudents('present')} className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 cursor-pointer">✓ All Present</button>
                  <button onClick={() => markAllStudents('absent')} className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-lg border border-rose-300 cursor-pointer">✗ All Absent</button>
                  <button onClick={resetStudentSheet} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer flex items-center gap-1"><RotateCcw className="w-3 h-3" />Reset</button>
                </div>
              </div>

              {/* Summary Strip */}
              {students.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Class Summary:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Present: {sP}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Absent: {sA}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Late: {sL}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Half Day: {sHD}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Unmarked: {students.length - sMarked}</span>
                  <div className="ml-auto flex items-center gap-3">
                    <span className="text-[11px] text-slate-500">Marked: <strong>{sMarked}/{students.length}</strong></span>
                    <span className={`text-xs font-black ${sPct >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>Attendance: {sPct}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Student Entry Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              {!selectedClass ? (
                <div className="p-12 text-center text-slate-400">
                  <GraduationCap className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <div className="text-sm font-bold">Select a Class & Section to Load Entry Sheet</div>
                </div>
              ) : loading ? (
                <div className="p-12 text-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><div className="text-xs text-slate-400">Loading daily entry sheet...</div></div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-12 text-center text-slate-400"><Users className="w-10 h-10 mx-auto mb-3 text-slate-300" /><div className="text-sm font-bold">No students found</div></div>
              ) : (
                <>
                  <div className="grid bg-slate-50 border-b border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider gap-2" style={{ gridTemplateColumns: '2.5rem 3rem 1fr 12rem 7rem 7rem 1fr' }}>
                    <div>#</div><div>Roll</div><div>Student Details</div><div>Status Toggle</div><div>In Time</div><div>Out Time</div><div>Remarks</div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {filteredStudents.map((s, idx) => {
                      const cfg = s.status ? STATUS_CONFIG[s.status] : null;
                      return (
                        <div key={s.student_id} className={`grid px-3 py-1.5 items-center gap-2 ${cfg ? 'bg-' + cfg.bg.replace('bg-', '') + '/10' : ''}`} style={{ gridTemplateColumns: '2.5rem 3rem 1fr 12rem 7rem 7rem 1fr' }}>
                          <div className="text-xs font-semibold text-slate-500">{idx + 1}</div>
                          <div className="text-xs font-mono font-bold text-slate-700">{s.roll_number || '-'}</div>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${AVATAR_BG[idx % AVATAR_BG.length]}`}>{s.student_name.charAt(0)}</div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">{s.student_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{s.admission_number} • Sec {s.section}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {['present', 'absent', 'late', 'half_day'].map(st => {
                              const c = STATUS_CONFIG[st];
                              const isSel = s.status === st;
                              return (
                                <button key={st} type="button" onClick={() => setStudents(prev => prev.map(x => x.student_id === s.student_id ? { ...x, status: isSel ? null : (st as AttendanceStatus) } : x))}
                                  className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${isSel ? `${c.bg} ${c.border} ${c.color} border-2 scale-105 shadow-2xs` : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                  {c.label}
                                </button>
                              );
                            })}
                          </div>
                          <input type="time" value={s.in_time || ''} onChange={e => setStudents(prev => prev.map(x => x.student_id === s.student_id ? { ...x, in_time: e.target.value } : x))} className="w-24 px-2 py-0.5 h-6.5 border border-slate-200 rounded text-xs font-mono focus:ring-1 focus:ring-blue-400 bg-white" />
                          <input type="time" value={s.out_time || ''} onChange={e => setStudents(prev => prev.map(x => x.student_id === s.student_id ? { ...x, out_time: e.target.value } : x))} className="w-24 px-2 py-0.5 h-6.5 border border-slate-200 rounded text-xs font-mono focus:ring-1 focus:ring-blue-400 bg-white" />
                          <input type="text" value={s.remarks || ''} onChange={e => setStudents(prev => prev.map(x => x.student_id === s.student_id ? { ...x, remarks: e.target.value } : x))} placeholder="Remarks..." className="w-full px-2 py-0.5 h-6.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-400 bg-white" />
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={exportToExcel} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer">
                        <Download className="w-3.5 h-3.5" /> Export Sheet
                      </button>
                    </div>
                    <button onClick={saveStudentAttendance} disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-60">
                      <Save className="w-4 h-4" />{saving ? 'Saving Sheet...' : 'Save Daily Attendance'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Staff Filter Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <div style={{ minWidth: '160px' }}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Staff Type</label>
                  <select value={staffType} onChange={e => setStaffType(e.target.value)} className="w-full px-2 py-1 h-8 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white">
                    <option value="">All Staff</option><option value="Teacher">Teaching Staff</option><option value="NonTeaching">Non-Teaching Staff</option>
                  </select>
                </div>
                <div style={{ minWidth: '160px' }}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Department</label>
                  <Select options={[{ value: '', label: 'All Departments' }, ...deptList]} value={[{ value: '', label: 'All Departments' }, ...deptList].find(d => d.value === selectedDept) || null} onChange={o => setSelectedDept(o?.value || '')} placeholder="Filter Dept..." styles={selectSt} classNamePrefix="react-select" isClearable />
                </div>
                <div className="relative flex-1" style={{ minWidth: '160px' }}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Search Staff</label>
                  <Search className="absolute left-2.5 top-[25px] w-3.5 h-3.5 text-slate-400" />
                  <input type="text" value={staffSearch} onChange={e => setStaffSearch(e.target.value)} placeholder="Filter name / emp ID / dept..." className="w-full pl-8 pr-2.5 h-8 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="flex items-end gap-1.5 ml-auto">
                  <button onClick={() => markAllStaff('present')} className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 cursor-pointer">✓ All Present</button>
                  <button onClick={() => markAllStaff('absent')} className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-lg border border-rose-300 cursor-pointer">✗ All Absent</button>
                  <button onClick={resetStaffSheet} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer flex items-center gap-1"><RotateCcw className="w-3 h-3" />Reset</button>
                </div>
              </div>

              {/* Staff Summary Strip */}
              {staffList.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Staff Summary:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Present: {stP}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Absent: {stA}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Late: {stL}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Half Day: {stHD}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">On Leave: {stOL}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Unmarked: {staffList.length - stMarked}</span>
                  <div className="ml-auto flex items-center gap-3">
                    <span className="text-[11px] text-slate-500">Marked: <strong>{stMarked}/{staffList.length}</strong></span>
                    <span className={`text-xs font-black ${stPct >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>Attendance: {stPct}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Staff Entry Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              {loading ? (
                <div className="p-12 text-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><div className="text-xs text-slate-400">Loading daily staff sheet...</div></div>
              ) : filteredStaff.length === 0 ? (
                <div className="p-12 text-center text-slate-400"><Users className="w-10 h-10 mx-auto mb-3 text-slate-300" /><div className="text-sm font-bold">No staff records found</div></div>
              ) : (
                <>
                  <div className="grid bg-slate-50 border-b border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider gap-2" style={{ gridTemplateColumns: '2.5rem 1fr 14rem 6.5rem 6.5rem 5rem 5rem 1fr' }}>
                    <div>#</div><div>Staff Details</div><div>Status Toggle</div><div>Check In</div><div>Check Out</div><div>Late (m)</div><div>OT (m)</div><div>Remarks</div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {filteredStaff.map((s, idx) => {
                      const cfg = s.status ? STATUS_CONFIG[s.status] : null;
                      return (
                        <div key={s.staff_id + '_' + s.staff_type} className={`grid px-3 py-1.5 items-center gap-2 ${cfg ? 'bg-' + cfg.bg.replace('bg-', '') + '/10' : ''}`} style={{ gridTemplateColumns: '2.5rem 1fr 14rem 6.5rem 6.5rem 5rem 5rem 1fr' }}>
                          <div className="text-xs font-semibold text-slate-500">{idx + 1}</div>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${AVATAR_BG[idx % AVATAR_BG.length]}`}>{s.name.charAt(0)}</div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate flex items-center gap-1">
                                {s.name}
                                <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase ${s.staff_type === 'Teacher' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{s.staff_type}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">{s.employee_id} • {s.department || 'General'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 flex-wrap">
                            {['present', 'absent', 'late', 'half_day', 'on_leave'].map(st => {
                              const c = STATUS_CONFIG[st];
                              const isSel = s.status === st;
                              return (
                                <button key={st} type="button" onClick={() => setStaffList(prev => prev.map(x => (x.staff_id === s.staff_id && x.staff_type === s.staff_type) ? { ...x, status: isSel ? null : (st as AttendanceStatus) } : x))}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${isSel ? `${c.bg} ${c.border} ${c.color} border-2 scale-105 shadow-2xs` : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                  {c.label}
                                </button>
                              );
                            })}
                          </div>
                          <input type="time" value={s.check_in || ''} onChange={e => setStaffList(prev => prev.map(x => (x.staff_id === s.staff_id && x.staff_type === s.staff_type) ? { ...x, check_in: e.target.value } : x))} className="w-22 px-2 py-0.5 h-6.5 border border-slate-200 rounded text-xs font-mono focus:ring-1 focus:ring-purple-400 bg-white" />
                          <input type="time" value={s.check_out || ''} onChange={e => setStaffList(prev => prev.map(x => (x.staff_id === s.staff_id && x.staff_type === s.staff_type) ? { ...x, check_out: e.target.value } : x))} className="w-22 px-2 py-0.5 h-6.5 border border-slate-200 rounded text-xs font-mono focus:ring-1 focus:ring-purple-400 bg-white" />
                          <input type="number" min="0" value={s.late_minutes} onChange={e => setStaffList(prev => prev.map(x => (x.staff_id === s.staff_id && x.staff_type === s.staff_type) ? { ...x, late_minutes: Number(e.target.value) } : x))} className="w-16 px-1.5 py-0.5 h-6.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-purple-400 bg-white" />
                          <input type="number" min="0" value={s.overtime_minutes} onChange={e => setStaffList(prev => prev.map(x => (x.staff_id === s.staff_id && x.staff_type === s.staff_type) ? { ...x, overtime_minutes: Number(e.target.value) } : x))} className="w-16 px-1.5 py-0.5 h-6.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-purple-400 bg-white" />
                          <input type="text" value={s.remarks || ''} onChange={e => setStaffList(prev => prev.map(x => (x.staff_id === s.staff_id && x.staff_type === s.staff_type) ? { ...x, remarks: e.target.value } : x))} placeholder="Remarks..." className="w-full px-2 py-0.5 h-6.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-purple-400 bg-white" />
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={exportToExcel} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer">
                        <Download className="w-3.5 h-3.5" /> Export Staff Sheet
                      </button>
                    </div>
                    <button onClick={saveStaffAttendance} disabled={saving} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-60">
                      <Save className="w-4 h-4" />{saving ? 'Saving Sheet...' : 'Save Staff Daily Attendance'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
