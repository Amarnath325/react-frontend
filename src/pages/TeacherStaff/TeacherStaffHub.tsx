import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users, UserCheck, UserX, Award, ShieldAlert,
  FileText, Calendar, Compass, Phone, Truck, Home,
  BookOpen, DollarSign, Search, Plus, Trash2, Edit3,
  CheckCircle, AlertCircle, X, Download, Settings,
  Clock, Briefcase, GraduationCap, MapPin, ClipboardList,
  Flame, Mail, MessageSquare, ShieldCheck, Heart, UserMinus
} from 'lucide-react';

export default function TeacherStaffHub() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  // Submodule Detection
  const isDashboard = path.includes('/teachers/dashboard');
  const isEmpMaster = path.includes('/teachers/employee-master');
  const isTeacherMgmt = path.includes('/teachers/teachers-list');
  const isNonTeaching = path.includes('/teachers/non-teaching');
  const isDeptMgmt = path.includes('/teachers/departments');
  const isDesgMgmt = path.includes('/teachers/designations');
  const isProfile = path.includes('/teachers/profiles');
  const isDocuments = path.includes('/teachers/documents');
  const isQualification = path.includes('/teachers/qualifications');
  const isExperience = path.includes('/teachers/experience');
  const isJoining = path.includes('/teachers/joining');
  const isTransfer = path.includes('/teachers/transfers');
  const isExit = path.includes('/teachers/exits');
  const isClassAlloc = path.includes('/teachers/class-allocation');
  const isSubjectAlloc = path.includes('/teachers/subject-allocation');
  const isTimetableAlloc = path.includes('/teachers/timetable-allocation');
  const isAttendance = path.includes('/teachers/attendance');
  const isLeave = path.includes('/teachers/leave');
  const isSubstitute = path.includes('/teachers/substitutes');
  const isWorkload = path.includes('/teachers/workload');
  const isPerformance = path.includes('/teachers/performance');
  const isTraining = path.includes('/teachers/training');
  const isPayroll = path.includes('/teachers/payroll');
  const isCommunication = path.includes('/teachers/communication');
  const isGrievance = path.includes('/teachers/grievance');
  const isIdCards = path.includes('/teachers/id-cards');
  const isReports = path.includes('/teachers/reports');

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [activeItem, setActiveItem] = useState<any>(null);

  // Form Fields State
  const [formFields, setFormFields] = useState<any>({
    name: '',
    email: '',
    role: 'Teaching',
    department: 'Science',
    designation: 'Senior Teacher',
    qualification: 'M.Sc, B.Ed',
    joiningDate: '2026-06-01',
    mobile: '',
    status: 'Active',
    experience: '5 Years',
  });

  // Mock Datasets
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Dr. Ramesh Prasad', email: 'ramesh.p@school.com', role: 'Teaching', department: 'Science', designation: 'HOD Science', mobile: '9876543210', status: 'Active', qualification: 'Ph.D in Physics', experience: '12 Years', joiningDate: '2018-05-10' },
    { id: 2, name: 'Mrs. Sunita Sen', email: 'sunita.s@school.com', role: 'Teaching', department: 'English', designation: 'Senior Teacher', mobile: '9876543211', status: 'Active', qualification: 'M.A, B.Ed', experience: '8 Years', joiningDate: '2020-07-15' },
    { id: 3, name: 'Mr. Amit Kumar', email: 'amit.k@school.com', role: 'Teaching', department: 'Mathematics', designation: 'Teacher', mobile: '9876543212', status: 'Active', qualification: 'M.Sc Mathematics', experience: '4 Years', joiningDate: '2022-04-10' },
    { id: 4, name: 'Mr. Alok Nath', email: 'alok.n@school.com', role: 'Non-Teaching', department: 'Administration', designation: 'Registrar', mobile: '9876543213', status: 'Active', qualification: 'MBA', experience: '15 Years', joiningDate: '2015-01-20' },
    { id: 5, name: 'Mrs. Shanti Devi', email: 'shanti.d@school.com', role: 'Non-Teaching', department: 'Library', designation: 'Assistant Librarian', mobile: '9876543214', status: 'On Leave', qualification: 'B.Lib', experience: '6 Years', joiningDate: '2021-09-01' },
  ]);

  const [allocations, setAllocations] = useState([
    { id: 1, teacherName: 'Dr. Ramesh Prasad', allocatedClass: 'Class 10-A', subject: 'Physics', weeklyHours: 18 },
    { id: 2, teacherName: 'Mrs. Sunita Sen', allocatedClass: 'Class 9-B', subject: 'English Literature', weeklyHours: 16 },
    { id: 3, teacherName: 'Mr. Amit Kumar', allocatedClass: 'Class 10-B', subject: 'Algebra & Geometry', weeklyHours: 20 },
  ]);

  const [grievances, setGrievances] = useState([
    { id: 1, employeeName: 'Mrs. Sunita Sen', title: 'Library Book Access Limit', description: 'Request to increase teacher book checkout limit', date: '2026-06-20', status: 'Under Review' },
    { id: 2, employeeName: 'Mr. Alok Nath', title: 'Office Chair replacement', description: 'Ergonomic chair requested for registrar office', date: '2026-06-24', status: 'Approved' },
  ]);

  // Headers Resolver
  const getHeaderDetails = () => {
    if (isDashboard) return { title: 'Staff Dashboard', subtitle: 'Overview of HR metrics, staff ratios, attendance, and workload distributions' };
    if (isEmpMaster) return { title: 'Employee Master Registry', subtitle: 'Register and search core directories of all teaching and administrative staff' };
    if (isTeacherMgmt) return { title: 'Teacher Profile Management', subtitle: 'Monitor academic teachers, subject expertise list, and credentials' };
    if (isNonTeaching) return { title: 'Non-Teaching Staff Desk', subtitle: 'Manage office administration, librarians, drivers, and technical crews' };
    if (isDeptMgmt) return { title: 'Department Management', subtitle: 'Setup organization divisions (Science, Mathematics, Arts, HR)' };
    if (isDesgMgmt) return { title: 'Designation Management', subtitle: 'Define rank titles (HOD, Senior Teacher, Assistant Registrar, Clerk)' };
    if (isProfile) return { title: 'Employee Profile Desk', subtitle: 'Update personal details, contacts, biological records, and photos' };
    if (isDocuments) return { title: 'Staff Document Management', subtitle: 'Store and audit official documents (Contracts, Experience letters, ID proofs)' };
    if (isQualification) return { title: 'Qualifications & Degrees', subtitle: 'Monitor employee graduation degrees, PhD programs, and specialized B.Ed logs' };
    if (isExperience) return { title: 'Experience History Registry', subtitle: 'Audit past employments, years of experiences, and tenure levels' };
    if (isJoining) return { title: 'Joining & Onboarding Desk', subtitle: 'Track new onboarding procedures, signing dates, and probation reviews' };
    if (isTransfer) return { title: 'Transfer & Relocation desk', subtitle: 'Issue school branch allocations, transfers, and historical travel logs' };
    if (isExit) return { title: 'Exit & Resignation Management', subtitle: 'Process staff discharges, resignations, retirement logs, and clearances' };
    if (isClassAlloc) return { title: 'Class Teacher Allocation', subtitle: 'Assign class mentors and coordinators for different batches' };
    if (isSubjectAlloc) return { title: 'Subject Allocation Desk', subtitle: 'Assign subject teaching nodes to active standard curricula' };
    if (isTimetableAlloc) return { title: 'Timetable Scheduling Allocation', subtitle: 'Configure teacher time grids, periods, and weekly calendars' };
    if (isAttendance) return { title: 'Employee Attendance Logs', subtitle: 'Monitor check-in logs, biometric taps, and daily presence records' };
    if (isLeave) return { title: 'Leave & Sick Day Approvals', subtitle: 'Approve or reject leave applications, track yearly leave balances' };
    if (isSubstitute) return { title: 'Substitute Teacher Allocation', subtitle: 'Find and assign substitute teachers for absent staff on-the-fly' };
    if (isWorkload) return { title: 'Workload & Lecture Hours Monitor', subtitle: 'Monitor lecture counts, teacher availability index, and free hours' };
    if (isPerformance) return { title: 'Performance Management Hub', subtitle: 'Manage evaluations, feedback metrics, and principal appraisals' };
    if (isTraining) return { title: 'Training & Workshop registry', subtitle: 'Log teacher training programs, certifications, and skill workshops' };
    if (isPayroll) return { title: 'Payroll Integration Gateway', subtitle: 'Link profile data with ledger salaries, allowances, and deductions' };
    if (isCommunication) return { title: 'Employee Communication Desk', subtitle: 'Send priority staff bulletins, notices, SMS alerts, and email dispatches' };
    if (isGrievance) return { title: 'Grievance Desk', subtitle: 'Review and address staff complaints, concerns, and suggestions' };
    if (isIdCards) return { title: 'ID Card Allocation Desk', subtitle: 'Generate barcode identity cards and register employee RFID tokens' };
    if (isReports) return { title: 'HR Reports & Registers', subtitle: 'Generate roll registers, qualifications exports, and joining sheets' };

    return { title: 'Teacher & Staff Management', subtitle: 'Manage staff profiles, contracts, qualifications, and schedules' };
  };

  const { title, subtitle } = getHeaderDetails();

  // Actions Handlers
  const handleOpenAddModal = () => {
    setModalType('add');
    setFormFields({
      name: '',
      email: '',
      role: 'Teaching',
      department: 'Science',
      designation: 'Senior Teacher',
      qualification: 'M.Sc, B.Ed',
      joiningDate: '2026-06-01',
      mobile: '',
      status: 'Active',
      experience: '5 Years',
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
      toast.success('Employee record created successfully!');
    } else {
      toast.success('Employee record updated successfully!');
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
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <Users className="w-6 h-6" />
            </span>
            <span>{title}</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>
        </div>

        <div className="flex gap-2">
          {isReports && (
            <button
              onClick={() => handleTriggerAction('Export Staff Directory CSV')}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold px-3 py-2 rounded-xl text-xs shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}

          {!isDashboard && !isReports && !isGrievance && !isPayroll && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-650 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all duration-200 hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard New Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Active Staff</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">84 Employees</span>
            <span className="text-[10px] text-emerald-500 font-bold mt-1 inline-flex items-center gap-0.5">
              60 Teaching, 24 Non-teaching
            </span>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Average Presence today</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">96.4%</span>
            <span className="text-[10px] text-emerald-500 font-bold mt-1 block">3 on approved leaves</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Average Workload</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">18.2 Hours/wk</span>
            <span className="text-[10px] text-amber-500 font-bold mt-1 block">Target limit: 22 Hours</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">HR Notifications</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">0 Pending Actions</span>
            <span className="text-[10px] text-slate-400 block font-normal mt-1">Contracts verified</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl text-slate-500">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* DASHBOARD GRAPH/VIEW EXCLUSIVES */}
      {isDashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Department-wise Staff Ratios</h3>
              <span className="text-xs text-slate-400 font-bold bg-slate-55/20 px-2 py-1 rounded">Q2 2026</span>
            </div>

            {/* Custom Bar Graph */}
            <div className="h-48 w-full flex items-end justify-between px-4 pt-4">
              <div className="flex flex-col items-center gap-1.5 w-[14%]">
                <div className="w-full bg-slate-100 rounded-t-lg h-44 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-indigo-500 hover:bg-indigo-650 rounded-t-lg h-[82%] transition-all duration-300"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">18 Staff</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Science</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-[14%]">
                <div className="w-full bg-slate-100 rounded-t-lg h-44 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-indigo-500 hover:bg-indigo-650 rounded-t-lg h-[65%] transition-all duration-300"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">14 Staff</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">English</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-[14%]">
                <div className="w-full bg-slate-100 rounded-t-lg h-44 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-indigo-500 hover:bg-indigo-650 rounded-t-lg h-[75%] transition-all duration-300"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">16 Staff</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Maths</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-[14%]">
                <div className="w-full bg-slate-100 rounded-t-lg h-44 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-indigo-500 hover:bg-indigo-650 rounded-t-lg h-[45%] transition-all duration-300"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">10 Staff</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Arts</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-[14%]">
                <div className="w-full bg-slate-100 rounded-t-lg h-44 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-indigo-500 hover:bg-indigo-650 rounded-t-lg h-[90%] transition-all duration-300"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">20 Staff</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Admin</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Designation Levels</h3>
            <div className="space-y-4 font-semibold text-slate-700 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span>HODs / Directors</span>
                  <span>10%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full w-[10%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Senior Teachers</span>
                  <span>45%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full w-[45%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Teachers</span>
                  <span>25%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-pink-500 h-full w-[25%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Administrators</span>
                  <span>20%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[20%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CORE DATA DISPLAY SECTION */}
      {!isDashboard && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff database..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-55/10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 focus:outline-none"
              >
                <option value="All">All Departments</option>
                <option value="Science">Science</option>
                <option value="English">English</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Administration">Administration</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {/* 1. MASTER EMPLOYEE & TEACHER PROFILE TABLE */}
            {(isEmpMaster || isTeacherMgmt || isNonTeaching || isProfile || isQualification || isExperience || isJoining || isTransfer || isExit || isReports) && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-655 font-bold uppercase pb-2">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Highest Qualification</th>
                    <th className="py-3 px-4">Experience</th>
                    <th className="py-3 px-4 font-mono">Mobile No</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{emp.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{emp.email}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-650">{emp.department}</td>
                      <td className="py-3 px-4 font-bold text-slate-400">{emp.designation}</td>
                      <td className="py-3 px-4">{emp.qualification}</td>
                      <td className="py-3 px-4 text-purple-650 font-bold">{emp.experience}</td>
                      <td className="py-3 px-4 font-mono">{emp.mobile}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          emp.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>{emp.status}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleOpenEditModal(emp)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-650"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(emp.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-650"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 2. STAFF ALLOCATIONS TABLE */}
            {(isClassAlloc || isSubjectAlloc || isTimetableAlloc || isWorkload || isSubstitute) && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-655 font-bold uppercase pb-2">
                    <th className="py-3 px-4">Teacher Name</th>
                    <th className="py-3 px-4">Allocated Standard Class</th>
                    <th className="py-3 px-4">Assigned Subject</th>
                    <th className="py-3 px-4 font-mono">Lecture Hours / Week</th>
                    <th className="py-3 px-4 text-center">Availability Index</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {allocations.map(al => (
                    <tr key={al.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-bold text-slate-800">{al.teacherName}</td>
                      <td className="py-3 px-4 font-semibold text-purple-650">{al.allocatedClass}</td>
                      <td className="py-3 px-4 font-bold text-slate-400">{al.subject}</td>
                      <td className="py-3 px-4 font-mono font-bold">{al.weeklyHours} Hrs</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[9px]">Optimal</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => handleTriggerAction(`Modify allocation: ${al.teacherName}`)} className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[9px]">Modify Map</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 3. GRIEVANCES AND SYSTEM WORKFLOW ACTIONS */}
            {isGrievance && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-655 font-bold uppercase pb-2">
                    <th className="py-3 px-4">Employee Name</th>
                    <th className="py-3 px-4">Grievance Title</th>
                    <th className="py-3 px-4">Brief Statement</th>
                    <th className="py-3 px-4">Lodged Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {grievances.map(gv => (
                    <tr key={gv.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-bold text-slate-800">{gv.employeeName}</td>
                      <td className="py-3 px-4 font-semibold text-slate-500">{gv.title}</td>
                      <td className="py-3 px-4 truncate max-w-xs">{gv.description}</td>
                      <td className="py-3 px-4">{gv.date}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          gv.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>{gv.status}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => handleTriggerAction(`Resolve Grievance: ${gv.id}`)} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[9px]">Mark Resolved</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 4. INTEGRATIONS AND STATIC PLACEHOLDER RULES */}
            {(isDeptMgmt || isDesgMgmt || isDocuments || isAttendance || isLeave || isPerformance || isTraining || isPayroll || isCommunication || isIdCards) && (
              <div className="space-y-6 pt-4 font-semibold">
                <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex items-center justify-between">
                  <div>
                    <h4 className="text-slate-200 text-xs font-bold uppercase tracking-wider">Dynamic Integration Panel Active</h4>
                    <p className="text-sm mt-1 font-medium text-slate-100">
                      This submodule route automatically maps properties from your central HR databases.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleTriggerAction('Edit Integration Configs')} className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs transition">
                      Edit Mapping Rules
                    </button>
                    <button onClick={() => handleTriggerAction('Force HR database Sync')} className="px-4 py-2 bg-white text-slate-900 hover:bg-purple-50 rounded-xl text-xs transition">
                      Force Manual Sync
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Policy Auditing</span>
                    <span className="text-xl font-black block text-slate-800">Compliance Verified</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Active sync with central standards</span>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Logs Verification</span>
                    <span className="text-xl font-black block text-emerald-650">Active Syncing</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Credential verification locked</span>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Access Logs</span>
                    <span className="text-xl font-black block text-indigo-650">Audit Trail Enabled</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Every access to this schema is logged</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPACT MODAL POPUP DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-indigo-650 to-purple-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">{modalType === 'add' ? 'Onboard Staff Employee' : 'Edit Employee Details'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs font-medium text-slate-700">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Employee Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mrs. Sunita Sen"
                  value={formFields.name || ''}
                  onChange={(e) => setFormFields(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
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
                    <option value="Teaching">Teaching</option>
                    <option value="Non-Teaching">Non-Teaching</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
                  <select
                    value={formFields.department || ''}
                    onChange={(e) => setFormFields(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
                  >
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Administration">Administration</option>
                    <option value="Library">Library</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Designation</label>
                  <input
                    type="text"
                    value={formFields.designation || ''}
                    onChange={(e) => setFormFields(prev => ({ ...prev, designation: e.target.value }))}
                    placeholder="e.g. Senior Teacher"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Qualification</label>
                  <input
                    type="text"
                    value={formFields.qualification || ''}
                    onChange={(e) => setFormFields(prev => ({ ...prev, qualification: e.target.value }))}
                    placeholder="e.g. M.A, B.Ed"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                <select
                  value={formFields.status || ''}
                  onChange={(e) => setFormFields(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-55 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-650 to-purple-650 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold"
                >
                  Confirm Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
