import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users, UserCheck, UserX, Clock, ShieldAlert,
  FileText, Calendar, Compass, Phone, Truck, Home,
  BookOpen, DollarSign, Search, Plus, Trash2, Edit3,
  CheckCircle, AlertCircle, X, Download, Settings,
  Cpu, CreditCard, ScanFace, Smartphone, ListChecks,
  Umbrella, CalendarDays, Check, Mail, Bell, BarChart2
} from 'lucide-react';

export default function AttendanceHub() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  // Submodule detection
  const isDashboard = path.includes('/attendance/dashboard');
  const isConfig = path.includes('/attendance/config');
  const isStudent = path.includes('/attendance/student');
  const isTeacher = path.includes('/attendance/teacher');
  const isStaff = path.includes('/attendance/staff');
  const isDailyEntry = path.includes('/attendance/daily-entry');
  const isPeriodWise = path.includes('/attendance/period-wise');
  const isBiometric = path.includes('/attendance/biometric');
  const isRfid = path.includes('/attendance/rfid');
  const isFaceRec = path.includes('/attendance/face-recognition');
  const isMobile = path.includes('/attendance/mobile');
  const isApproval = path.includes('/attendance/approval');
  const isLeaveIntegration = path.includes('/attendance/leave-integration');
  const isHolidayIntegration = path.includes('/attendance/holiday-integration');
  const isWeeklyOff = path.includes('/attendance/weekly-off');
  const isCorrection = path.includes('/attendance/correction');
  const isLateEarly = path.includes('/attendance/late-early');
  const isAbsents = path.includes('/attendance/absents');
  const isNotification = path.includes('/attendance/notification');
  const isReports = path.includes('/attendance/reports');
  const isAnalytics = path.includes('/attendance/analytics');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [activeItem, setActiveItem] = useState<any>(null);

  // Form Fields State
  const [formFields, setFormFields] = useState<any>({
    name: '',
    role: 'Student',
    classOrDept: 'Class 10',
    date: '2026-06-25',
    checkIn: '08:30',
    checkOut: '14:30',
    status: 'Present',
    reason: '',
    deviceName: 'BioDevice-01',
    cardNo: '',
  });

  // Mock Datasets
  const [attendanceRecords, setAttendanceRecords] = useState([
    { id: 1, name: 'Rahul Sharma', role: 'Student', classOrDept: 'Class 10', date: '2026-06-25', checkIn: '08:24', checkOut: '14:30', status: 'Present', mode: 'RFID' },
    { id: 2, name: 'Ananya Verma', role: 'Student', classOrDept: 'Class 9', date: '2026-06-25', checkIn: '08:42', checkOut: '14:30', status: 'Late', mode: 'Face Recognition' },
    { id: 3, name: 'Arjun Das', role: 'Student', classOrDept: 'Class 10', date: '2026-06-25', checkIn: '--:--', checkOut: '--:--', status: 'Absent', mode: 'None' },
    { id: 4, name: 'Vikas Kumar', role: 'Student', classOrDept: 'Class 10', date: '2026-06-25', checkIn: '08:15', checkOut: '14:30', status: 'Present', mode: 'Biometric' },
    { id: 5, name: 'Mrs. Sunita Sen', role: 'Teacher', classOrDept: 'Science Dept', date: '2026-06-25', checkIn: '08:10', checkOut: '15:30', status: 'Present', mode: 'Mobile' },
    { id: 6, name: 'Mr. Alok Nath', role: 'Staff', classOrDept: 'Admin Dept', date: '2026-06-25', checkIn: '08:55', checkOut: '16:00', status: 'Late', mode: 'Biometric' },
  ]);

  const [biometricDevices, setBiometricDevices] = useState([
    { id: 1, name: 'Main Gate Reader A', location: 'Primary Academic Block Entrance', ip: '192.168.10.45', status: 'Online', lastSync: '2026-06-25 09:12' },
    { id: 2, name: 'Main Gate Reader B', location: 'Primary Academic Block Exit', ip: '192.168.10.46', status: 'Online', lastSync: '2026-06-25 09:12' },
    { id: 3, name: 'Staff Lounge Attendance Scanner', location: 'Administrative wing Floor 1', ip: '192.168.10.50', status: 'Offline', lastSync: '2026-06-24 17:00' },
  ]);

  const [attendanceApprovals, setAttendanceApprovals] = useState([
    { id: 1, name: 'Rahul Sharma', date: '2026-06-23', requestedCorrection: 'Mark Present (Was Present, Biometric failed)', reason: 'Technical glitch at Gate A', status: 'Pending' },
    { id: 2, name: 'Ananya Verma', date: '2026-06-22', requestedCorrection: 'Change Late to Present (Medical Check)', reason: 'Doctor checkup letter submitted', status: 'Pending' },
  ]);

  const [notificationLogs, setNotificationLogs] = useState([
    { id: 1, recipient: 'Vijay Sharma (Father of Rahul)', type: 'SMS', content: 'Rahul is absent from school today without prior notice.', status: 'Sent', timestamp: '2026-06-25 09:30' },
    { id: 2, recipient: 'Ramesh Verma (Father of Ananya)', type: 'Email', content: 'Ananya arrived late at 08:42 AM today.', status: 'Sent', timestamp: '2026-06-25 09:45' },
  ]);

  // Headers Title and Subtitle Resolver
  const getHeaderDetails = () => {
    if (isDashboard) return { title: 'Attendance Dashboard', subtitle: 'Overall presence index, roll call summaries, and real-time device tracking' };
    if (isConfig) return { title: 'Attendance Configuration', subtitle: 'Configure check-in parameters, grace periods, and tracking methods' };
    if (isStudent) return { title: 'Student Attendance Registry', subtitle: 'Audit and track student presence rates, histories, and logs' };
    if (isTeacher) return { title: 'Teacher Attendance Registry', subtitle: 'Manage teacher check-in times, working days, and summaries' };
    if (isStaff) return { title: 'Staff Attendance Registry', subtitle: 'Track non-academic staff schedules, biometric logs, and indexes' };
    if (isDailyEntry) return { title: 'Daily Attendance Entry', subtitle: 'Manually register or edit attendance rosters class-wise/department-wise' };
    if (isPeriodWise) return { title: 'Period Wise Attendance', subtitle: 'Log attendance standard-wise for specific class lecture slots' };
    if (isBiometric) return { title: 'Biometric System Integration', subtitle: 'Verify fingerprint/finger-vein scanner devices and log syncs' };
    if (isRfid) return { title: 'RFID / Smart Card Gateway', subtitle: 'Register active smart cards and monitor scanner tap logs' };
    if (isFaceRec) return { title: 'Face Recognition Attendance', subtitle: 'Monitor smart AI-vision entrance nodes and match rates' };
    if (isMobile) return { title: 'Mobile Attendance Tracker', subtitle: 'Configure geo-fencing and track mobile portal check-ins' };
    if (isApproval) return { title: 'Attendance Approvals', subtitle: 'Approve manual correction requests and student leave linkages' };
    if (isLeaveIntegration) return { title: 'Leave Management Integration', subtitle: 'Sync approved leaves directly with the active attendance logs' };
    if (isHolidayIntegration) return { title: 'Holiday Integration Desk', subtitle: 'Link academic holiday lists to auto-excuse attendance registries' };
    if (isWeeklyOff) return { title: 'Weekly Off Planner', subtitle: 'Manage custom weekly off structures for different batches/roles' };
    if (isCorrection) return { title: 'Attendance Correction Desk', subtitle: 'Process historical database corrections and check-in overrides' };
    if (isLateEarly) return { title: 'Late Coming / Early Leaving', subtitle: 'Monitor gate-pass exceptions, grace limits, and penalty counts' };
    if (isAbsents) return { title: 'Absentee Management System', subtitle: 'Track chronic absentees, trigger alerts, and organize parent meets' };
    if (isNotification) return { title: 'Attendance Notifications', subtitle: 'Configure automated SMS/Email dispatch alerts for absentees' };
    if (isReports) return { title: 'Attendance Reports & Ledgers', subtitle: 'Generate roll call metrics, spreadsheets, and monthly registers' };
    if (isAnalytics) return { title: 'Attendance Analytics & Trends', subtitle: 'Analyze presence correlation factors, seasonal peaks, and indexes' };

    return { title: 'Attendance Management', subtitle: 'Track, configure, audit, and analyze student & staff attendance' };
  };

  const { title, subtitle } = getHeaderDetails();

  // Handlers
  const handleOpenAddModal = () => {
    setModalType('add');
    setFormFields({
      name: '',
      role: 'Student',
      classOrDept: 'Class 10',
      date: '2026-06-25',
      checkIn: '08:30',
      checkOut: '14:30',
      status: 'Present',
      reason: '',
      deviceName: 'BioDevice-01',
      cardNo: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: any) => {
    setModalType('edit');
    setActiveItem(item);
    setFormFields({ ...item });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalType === 'add') {
      toast.success('Attendance record added successfully!');
    } else {
      toast.success('Attendance record updated successfully!');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    toast.error('Record deleted successfully');
  };

  const handleTriggerAction = (actionName: string) => {
    toast.success(`${actionName} completed successfully!`);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Calendar className="w-6 h-6" />
            </span>
            <span>{title}</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>
        </div>

        <div className="flex gap-2">
          {isReports && (
            <button
              onClick={() => handleTriggerAction('Export Attendance PDF')}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold px-3 py-2 rounded-xl text-xs shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF Register</span>
            </button>
          )}

          {!isDashboard && !isAnalytics && !isNotification && !isConfig && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all duration-200 hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Log Manual Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Today's Presence</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">92.4%</span>
            <span className="text-[10px] text-emerald-500 font-bold mt-1 inline-flex items-center gap-0.5">
              +1.2% vs yesterday
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-650">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Late Arrival Index</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">4.8%</span>
            <span className="text-[10px] text-amber-500 font-bold mt-1 block">Within grace threshold</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Absentees</span>
            <span className="text-2xl font-black text-rose-650 mt-1 block">42 Accounts</span>
            <span className="text-[10px] text-rose-500 font-bold mt-1 block">15 parents notified</span>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Device Mappings</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">4 Active</span>
            <span className="text-[10px] text-emerald-500 font-bold mt-1 block">All sensors syncing</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl text-slate-500">
            <Cpu className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* DASHBOARD EXCLUSIVE VIEWS */}
      {isDashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Weekly Attendance Rate Trend</h3>
              <span className="text-xs text-slate-400 font-bold bg-slate-55/20 px-2 py-1 rounded">June 2026</span>
            </div>
            
            {/* Custom Interactive Weekly Attendance Graph */}
            <div className="h-48 w-full flex items-end justify-between px-4 pt-4">
              <div className="flex flex-col items-center gap-1.5 w-[14%]">
                <div className="w-full bg-slate-100 rounded-t-lg h-44 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-emerald-500 hover:bg-emerald-600 rounded-t-lg h-[92%] transition-all duration-300"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">92.1%</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Mon</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-[14%]">
                <div className="w-full bg-slate-100 rounded-t-lg h-44 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-emerald-500 hover:bg-emerald-600 rounded-t-lg h-[94%] transition-all duration-300"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">94.3%</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Tue</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-[14%]">
                <div className="w-full bg-slate-100 rounded-t-lg h-44 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-emerald-500 hover:bg-emerald-600 rounded-t-lg h-[91%] transition-all duration-300"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">91.8%</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Wed</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-[14%]">
                <div className="w-full bg-slate-100 rounded-t-lg h-44 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-emerald-500 hover:bg-emerald-600 rounded-t-lg h-[95%] transition-all duration-300"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">95.0%</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Thu</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-[14%]">
                <div className="w-full bg-slate-100 rounded-t-lg h-44 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-emerald-500 hover:bg-emerald-600 rounded-t-lg h-[89%] transition-all duration-300"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">89.2%</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Fri</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-[14%]">
                <div className="w-full bg-slate-100 rounded-t-lg h-44 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-amber-500 hover:bg-amber-600 rounded-t-lg h-[50%] transition-all duration-300"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">50.4%</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Sat (Half)</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Attendance Source Modes</h3>
            <div className="space-y-4 font-semibold text-slate-700 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span>RFID Smart Cards</span>
                  <span>55%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[55%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Biometric Fingerprint</span>
                  <span>25%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full w-[25%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Face Recognition</span>
                  <span>12%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full w-[12%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Manual Portal Entry</span>
                  <span>8%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[8%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIGURATION EXCLUSIVE VIEW */}
      {isConfig && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-800">Check-in Rule configuration parameters</h3>
            <p className="text-xs text-slate-500 mt-0.5">Define default school times, tolerance margins, and integration sync frequencies.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-655 uppercase tracking-wider mb-2">Check-in Start Time</label>
                <input type="time" defaultValue="08:00" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-655 uppercase tracking-wider mb-2">Check-in Cutoff (Late Limit)</label>
                <input type="time" defaultValue="08:35" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-655 uppercase tracking-wider mb-2">Check-out End Time</label>
                <input type="time" defaultValue="14:30" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-655 uppercase tracking-wider mb-2">Biometric Auto-sync Frequency</label>
                <select className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white">
                  <option>Every 5 Minutes (Real-time)</option>
                  <option>Every 15 Minutes</option>
                  <option>Hourly</option>
                  <option>Daily at 10:00 AM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-655 uppercase tracking-wider mb-2">Grace Period Allowance (Minutes)</label>
                <input type="number" defaultValue="15" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20" />
              </div>

              <div className="pt-2">
                <span className="block text-xs font-bold text-slate-655 uppercase tracking-wider mb-2">Active Modality Options</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    <span>RFID Scanner</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    <span>Biometric logs</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                    <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    <span>AI Face Rec</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 gap-2">
            <button onClick={() => handleTriggerAction('Sync configurations')} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition">Reset Defaults</button>
            <button onClick={() => handleTriggerAction('Save configurations')} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition">Save Rule Set</button>
          </div>
        </div>
      )}

      {/* NOTIFICATION SENDER EXCLUSIVE VIEW */}
      {isNotification && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Absent Notification Broadcast Console</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-655 uppercase tracking-wider mb-1.5">Target Roster Group</label>
                <select className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white">
                  <option>Chronically Absents Today (All Grades)</option>
                  <option>Class 10 - Unexcused absents only</option>
                  <option>Staff absent alerts</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-655 uppercase tracking-wider mb-1.5">Broadcast Mode</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                    <input type="radio" name="notify_mode" defaultChecked className="text-emerald-650 focus:ring-emerald-500" />
                    <span>SMS alert (Priority API Gateway)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                    <input type="radio" name="notify_mode" className="text-emerald-655 focus:ring-emerald-500" />
                    <span>E-Mail bulletin dispatch</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-655 uppercase tracking-wider mb-1.5">SMS Notification Text template</label>
                <textarea rows={4} defaultValue="Dear Guardian, this is to inform you that your ward {student_name} is marked ABSENT for today (2026-06-25) at MySchoolPoint. Please contact the administrative desk for clarifications." className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20" />
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={() => handleTriggerAction('Trigger broadcast alert')} className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-650 text-white rounded-xl text-xs font-bold shadow-md hover:from-emerald-700 hover:to-teal-700 transition">
                  Dispatch Broadcast Queue
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Dispatched Queue Logs</h3>
            <div className="space-y-4 overflow-y-auto max-h-[300px]">
              {notificationLogs.map(log => (
                <div key={log.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] font-bold">
                    <span className="text-purple-650">{log.type} Delivery</span>
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full">{log.status}</span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-600 truncate">{log.recipient}</p>
                  <p className="text-[9px] text-slate-400 italic">"{log.content}"</p>
                  <span className="text-[8px] text-slate-400 block text-right font-semibold">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DATA CONTENT SECTION (TABLES & SEARCHES) */}
      {!isDashboard && !isConfig && !isNotification && !isAnalytics && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
          {/* Filter Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs/members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-55/10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {(isStudent || isDailyEntry || isPeriodWise) && (
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 focus:outline-none"
                >
                  <option value="All">All Standard classes</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 8">Class 8</option>
                </select>
              )}

              {(isTeacher || isStaff) && (
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 focus:outline-none"
                >
                  <option value="All">All Departments</option>
                  <option value="Science Dept">Science Dept</option>
                  <option value="Admin Dept">Admin Dept</option>
                  <option value="Humanities Dept">Humanities Dept</option>
                </select>
              )}

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {/* 1. MAIN REGISTRY ATTENDANCE TABLE */}
            {(isStudent || isTeacher || isStaff || isDailyEntry || isPeriodWise || isLateEarly || isAbsents || isReports) && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-655 font-bold uppercase pb-2">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Class / Dept</th>
                    <th className="py-3 px-4">Check-in Time</th>
                    <th className="py-3 px-4">Check-out Time</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Device Mode</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {attendanceRecords.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-semibold text-slate-800">{r.name}</td>
                      <td className="py-3 px-4 font-bold text-slate-400">{r.role}</td>
                      <td className="py-3 px-4 font-semibold text-purple-650">{r.classOrDept}</td>
                      <td className="py-3 px-4 font-mono">{r.checkIn}</td>
                      <td className="py-3 px-4 font-mono">{r.checkOut}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          r.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                          r.status === 'Late' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                        }`}>{r.status}</span>
                      </td>
                      <td className="py-3 px-4 text-center text-[10px] text-slate-550 font-bold">{r.mode}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleOpenEditModal(r)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-emerald-600"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(r.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-650"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 2. BIOMETRIC DEVICE TABLE */}
            {(isBiometric || isRfid || isFaceRec || isMobile) && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-655 font-bold uppercase pb-2">
                    <th className="py-3 px-4">Device Node Name</th>
                    <th className="py-3 px-4">Installation Location</th>
                    <th className="py-3 px-4">Local IP address</th>
                    <th className="py-3 px-4">Last Sync Timestamp</th>
                    <th className="py-3 px-4 text-center">Diagnostics</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {biometricDevices.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-bold text-slate-800">{d.name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-500">{d.location}</td>
                      <td className="py-3 px-4 font-mono text-purple-650">{d.ip}</td>
                      <td className="py-3 px-4">{d.lastSync}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          d.status === 'Online' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>{d.status}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => handleTriggerAction(`Diagnostic ping: ${d.name}`)} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[9px]">Ping Test</button>
                          <button onClick={() => handleTriggerAction(`Forced sync logs: ${d.name}`)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-[9px]">Sync Logs</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 3. ATTENDANCE CORRECTION & APPROVALS TABLE */}
            {(isApproval || isCorrection) && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-655 font-bold uppercase pb-2">
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Log Correction Date</th>
                    <th className="py-3 px-4">Requested Correction</th>
                    <th className="py-3 px-4">Reason Statement</th>
                    <th className="py-3 px-4 text-center">Approval Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {attendanceApprovals.map(app => (
                    <tr key={app.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-semibold text-slate-800">{app.name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-500">{app.date}</td>
                      <td className="py-3 px-4 text-purple-650 font-bold">{app.requestedCorrection}</td>
                      <td className="py-3 px-4 truncate max-w-xs">{app.reason}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold text-[9px]">{app.status}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => handleTriggerAction(`Approve request ${app.id}`)} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[9px]">Approve</button>
                          <button onClick={() => handleTriggerAction(`Reject request ${app.id}`)} className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[9px]">Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 4. INTEGRATIONS & OTHER STATIC INFORMATION PANELS */}
            {(isLeaveIntegration || isHolidayIntegration || isWeeklyOff) && (
              <div className="space-y-6 pt-4 font-semibold">
                <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex items-center justify-between">
                  <div>
                    <h4 className="text-slate-200 text-xs font-bold uppercase tracking-wider">Automated Master Sync active</h4>
                    <p className="text-sm mt-1 font-medium text-slate-100">
                      This submodule route synchronizes status records directly with school calendar configurations.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleTriggerAction('Edit Integration Rules')} className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs transition">
                      Edit Rules
                    </button>
                    <button onClick={() => handleTriggerAction('Sync Calendar Registry')} className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-50 rounded-xl text-xs transition">
                      Force Manual Sync
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sync Policy Rules</span>
                    <span className="text-xl font-black block text-slate-800">Auto-Apply Leaves</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Leave approval auto-excuses marked days</span>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Holiday Calculations</span>
                    <span className="text-xl font-black block text-emerald-650">Calendar-Linked</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Active sync with central holidays list</span>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Audit Sync Logs</span>
                    <span className="text-xl font-black block text-emerald-650">Logs verified</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Last daily log sync at 08:35 AM</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ANALYTICS EXCLUSIVE VIEW */}
      {isAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-600" />
              <span>Chronic Absentee Index</span>
            </h4>
            <p className="text-xs text-slate-500 font-medium">Students with presence rate below 75% requiring urgent parent coordination.</p>
            <div className="space-y-3 font-semibold text-xs pt-2">
              <div className="flex justify-between items-center p-2 bg-rose-50/50 rounded-lg">
                <span className="text-slate-800">Arjun Das (Class 10)</span>
                <span className="text-rose-650 font-bold font-mono">68.2% Rate</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-rose-50/50 rounded-lg">
                <span className="text-slate-800">Vikram Aditya (Class 9)</span>
                <span className="text-rose-650 font-bold font-mono">71.0% Rate</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Late Entry Correlation</span>
            </h4>
            <p className="text-xs text-slate-500 font-medium">Peaks and occurrences of late arrivals categorized by standard grades.</p>
            <div className="space-y-3 font-semibold text-xs pt-2">
              <div className="flex justify-between items-center p-2 bg-amber-50/50 rounded-lg">
                <span className="text-slate-800">Class 9 Standard</span>
                <span className="text-amber-600 font-bold font-mono">12 occurrences</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-amber-50/50 rounded-lg">
                <span className="text-slate-800">Class 10 Standard</span>
                <span className="text-amber-600 font-bold font-mono">9 occurrences</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Modality Performance</span>
            </h4>
            <p className="text-xs text-slate-500 font-medium">Match success and latency response speeds of current tracking systems.</p>
            <div className="space-y-3 font-semibold text-[11px] pt-2">
              <div className="flex justify-between items-center">
                <span>RFID Cards reader latency</span>
                <span className="text-emerald-600 font-bold">120ms (Excellent)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Face Match precision index</span>
                <span className="text-indigo-600 font-bold">99.8% (Accurate)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPACT DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-650 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">{modalType === 'add' ? 'Log Attendance Record' : 'Edit Attendance Log'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs font-medium text-slate-700">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Member Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formFields.name || ''}
                  onChange={(e) => setFormFields(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Role Type</label>
                  <select
                    value={formFields.role || ''}
                    onChange={(e) => setFormFields(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
                  >
                    <option value="Student">Student</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Class / Standard</label>
                  <input
                    type="text"
                    value={formFields.classOrDept || ''}
                    onChange={(e) => setFormFields(prev => ({ ...prev, classOrDept: e.target.value }))}
                    placeholder="e.g. Class 10 or Science Dept"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Check-in</label>
                  <input
                    type="text"
                    value={formFields.checkIn || ''}
                    onChange={(e) => setFormFields(prev => ({ ...prev, checkIn: e.target.value }))}
                    placeholder="e.g. 08:30"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Check-out</label>
                  <input
                    type="text"
                    value={formFields.checkOut || ''}
                    onChange={(e) => setFormFields(prev => ({ ...prev, checkOut: e.target.value }))}
                    placeholder="e.g. 14:30"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Attendance Status</label>
                <select
                  value={formFields.status || ''}
                  onChange={(e) => setFormFields(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-bold shadow"
                >
                  Confirm Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
