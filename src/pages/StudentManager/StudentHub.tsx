import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users, UserCheck, UserX, Award, ShieldAlert,
  FileText, Calendar, Compass, Phone, Truck, Home,
  BookOpen, DollarSign, Award as ExamIcon, UserMinus,
  Search, Plus, Trash2, Edit3, CheckCircle, AlertCircle, X, Download
} from 'lucide-react';

export default function StudentHub() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  // Submodule Detection
  const isDashboard = path.includes('/students/dashboard');
  const isAdmission = path.includes('/students/admission');
  const isRegistration = path.includes('/students/registration');
  const isProfile = path.includes('/students/profile');
  const isDocuments = path.includes('/students/documents');
  const isParents = path.includes('/students/parents');
  const isCategories = path.includes('/students/categories');
  const isIdCards = path.includes('/students/id-cards');
  const isEnrollment = path.includes('/students/enrollment');
  const isAllocation = path.includes('/students/allocation');
  const isPromotion = path.includes('/students/promotion');
  const isTransfer = path.includes('/students/transfer');
  const isAttendance = path.includes('/students/attendance');
  const isLeaves = path.includes('/students/leaves');
  const isMedical = path.includes('/students/medical');
  const isDiscipline = path.includes('/students/discipline');
  const isActivities = path.includes('/students/activities');
  const isCertificates = path.includes('/students/certificates');
  const isFeedback = path.includes('/students/feedback');
  const isCommunication = path.includes('/students/communication');
  const isTransport = path.includes('/students/transport');
  const isHostel = path.includes('/students/hostel');
  const isLibrary = path.includes('/students/library');
  const isFees = path.includes('/students/fees');
  const isExams = path.includes('/students/exams');
  const isAlumni = path.includes('/students/alumni');
  const isReports = path.includes('/students/reports');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [activeItem, setActiveItem] = useState<any>(null);

  // Form Fields
  const [formFields, setFormFields] = useState<any>({
    name: '',
    rollNo: '',
    class: 'Class 10',
    admissionNo: '',
    email: '',
    mobile: '',
    gender: 'Male',
    parentName: '',
    relationship: 'Father',
    status: 'Active'
  });

  // Mock Datasets
  const [studentsList, setStudentsList] = useState([
    { id: 1, name: 'Rahul Sharma', rollNo: '1004', class: 'Class 10', admissionNo: 'ADM-2026-004', email: 'rahul.s@school.com', mobile: '9876543201', parentName: 'Vijay Sharma', status: 'Active' },
    { id: 2, name: 'Ananya Verma', rollNo: '1012', class: 'Class 9', admissionNo: 'ADM-2026-012', email: 'ananya.v@school.com', mobile: '9876543202', parentName: 'Ramesh Verma', status: 'Active' },
    { id: 3, name: 'Arjun Das', rollNo: '1025', class: 'Class 10', admissionNo: 'ADM-2026-025', email: 'arjun.d@school.com', mobile: '9876543203', parentName: 'Deepak Das', status: 'Active' },
    { id: 4, name: 'Sneha Patel', rollNo: '1031', class: 'Class 8', admissionNo: 'ADM-2026-031', email: 'sneha.p@school.com', mobile: '9876543204', parentName: 'Sanjay Patel', status: 'Active' },
    { id: 5, name: 'Vikas Kumar', rollNo: '1044', class: 'Class 10', admissionNo: 'ADM-2026-044', email: 'vikas.k@school.com', mobile: '9876543205', parentName: 'Raj Kumar', status: 'Suspended' },
  ]);

  const [parentsList, setParentsList] = useState([
    { id: 1, name: 'Vijay Sharma', studentName: 'Rahul Sharma', relationship: 'Father', occupation: 'Software Engineer', mobile: '9876543201', email: 'vijay.sharma@mail.com' },
    { id: 2, name: 'Ramesh Verma', studentName: 'Ananya Verma', relationship: 'Father', occupation: 'Business Owner', mobile: '9876543202', email: 'ramesh.verma@mail.com' },
    { id: 3, name: 'Sadhana Patel', studentName: 'Sneha Patel', relationship: 'Mother', occupation: 'Home Maker', mobile: '9876543244', email: 'sadhana.patel@mail.com' },
  ]);

  const [documents, setDocuments] = useState([
    { id: 1, studentName: 'Rahul Sharma', docType: 'Birth Certificate', fileName: 'birth_cert_rahul.pdf', uploadDate: '2026-06-10', status: 'Verified' },
    { id: 2, studentName: 'Ananya Verma', docType: 'Aadhaar Card copy', fileName: 'aadhaar_ananya.jpg', uploadDate: '2026-06-11', status: 'Verified' },
    { id: 3, studentName: 'Arjun Das', docType: 'Transfer Certificate (TC)', fileName: 'tc_arjun.pdf', uploadDate: '2026-06-20', status: 'Pending Review' },
  ]);

  const [leavesList, setLeavesList] = useState([
    { id: 1, studentName: 'Rahul Sharma', leaveType: 'Sick Leave', startDate: '2026-06-20', endDate: '2026-06-22', reason: 'High Fever', status: 'Approved' },
    { id: 2, studentName: 'Sneha Patel', leaveType: 'Casual Leave', startDate: '2026-06-26', endDate: '2026-06-26', reason: 'Family Event', status: 'Pending Approval' },
  ]);

  const [medicalRecords, setMedicalRecords] = useState([
    { id: 1, studentName: 'Rahul Sharma', bloodGroup: 'A+', allergies: 'Nuts', conditions: 'Mild Asthma', emergencyContact: '9876543201', lastCheckup: '2026-05-15' },
    { id: 2, studentName: 'Ananya Verma', bloodGroup: 'O+', allergies: 'None', conditions: 'None', emergencyContact: '9876543202', lastCheckup: '2026-05-20' },
  ]);

  const [disciplineCases, setDisciplineCases] = useState([
    { id: 1, studentName: 'Vikas Kumar', violation: 'Repeated Tardiness', actionTaken: 'Parent Called, Written Warning', date: '2026-06-18', severity: 'Medium', status: 'Resolved' },
    { id: 2, studentName: 'Arjun Das', violation: 'Disrespectful behavior in Library', actionTaken: 'Library Access suspended for 1 week', date: '2026-06-24', severity: 'Low', status: 'Active' },
  ]);

  // Page Header Text & Subtitle Resolver
  const getHeaderDetails = () => {
    if (isDashboard) return { title: 'Student Dashboard', subtitle: 'Global academic index, demographic insights, and active enrollments' };
    if (isAdmission) return { title: 'Student Admission Gate', subtitle: 'Process new admissions, verify credentials, and allocate registrations' };
    if (isRegistration) return { title: 'Student Registration Desk', subtitle: 'Manage student enrollment entries, credentials, and credentials' };
    if (isProfile) return { title: 'Student Profile Management', subtitle: 'Update profile details, addresses, contacts, and photos' };
    if (isDocuments) return { title: 'Student Document Management', subtitle: 'Store and verify official documents (TC, Marksheets, ID Proofs)' };
    if (isParents) return { title: 'Parent/Guardian Hub', subtitle: 'Manage secondary contact accounts and parent-teacher links' };
    if (isCategories) return { title: 'Student Category Management', subtitle: 'Group students by specific parameters (Hostelers, Day scholars, Sports)' };
    if (isIdCards) return { title: 'Student ID Card Management', subtitle: 'Configure, generate, and print barcode/RFID student identity cards' };
    if (isEnrollment) return { title: 'Student Enrollment Registry', subtitle: 'Verify student enrollments and register unique academic roll IDs' };
    if (isAllocation) return { title: 'Class & Section Allocation', subtitle: 'Map students to respective standard classes, schedules, and sections' };
    if (isPromotion) return { title: 'Student Promotion Desk', subtitle: 'Manage academic history logs and promote student records bulk-wise' };
    if (isTransfer) return { title: 'Student Transfer & TC Desk', subtitle: 'Discharge student profiles, issue school leaving TCs, and record transfers' };
    if (isAttendance) return { title: 'Student Attendance Logs', subtitle: 'Audit class attendance percentages and monthly reports' };
    if (isLeaves) return { title: 'Student Leave Management', subtitle: 'Track and approve student sick and casual leave applications' };
    if (isMedical) return { title: 'Student Medical Records', subtitle: 'Maintain blood groups, allergies, and emergency medical information' };
    if (isDiscipline) return { title: 'Student Discipline Desk', subtitle: 'Record warning instances, suspensions, and behavioral remarks' };
    if (isActivities) return { title: 'Student Activity Management', subtitle: 'Track student clubs, sports groups, and extra-curricular participation' };
    if (isCertificates) return { title: 'Student Certificate Management', subtitle: 'Generate and print transfer, character, and bonafide certificates' };
    if (isFeedback) return { title: 'Student Feedback Portal', subtitle: 'Log parent and student reviews, course feedbacks, and complaints' };
    if (isCommunication) return { title: 'Student Communication Gateway', subtitle: 'Send SMS/emails to student registry lists and log dispatches' };
    if (isTransport) return { title: 'Student Transport Allocation', subtitle: 'Link students to active transport routes, stops, and vehicles' };
    if (isHostel) return { title: 'Student Hostel Allocation', subtitle: 'Manage boarding lists, allocate rooms, and define beds' };
    if (isLibrary) return { title: 'Student Library Membership', subtitle: 'Check library memberships, issued books, and outstanding fines' };
    if (isFees) return { title: 'Student Fee Management', subtitle: 'Verify invoice ledgers, allocations, and transaction logs' };
    if (isExams) return { title: 'Student Exam Record', subtitle: 'Track grade histories, pass status indexes, and term-wise marks' };
    if (isAlumni) return { title: 'Alumni Management Hub', subtitle: 'Manage outgoing batches, coordinates, and alumni reunions' };
    if (isReports) return { title: 'Student Reports & Analytics', subtitle: 'Generate roll calls, list exports, and class distribution graphs' };

    return { title: 'Student Management', subtitle: 'Manage profiles, admissions, document verifications, and reports' };
  };

  const { title, subtitle } = getHeaderDetails();

  // Handlers
  const handleOpenAddModal = () => {
    setModalType('add');
    setFormFields({
      name: '',
      rollNo: '',
      class: 'Class 10',
      admissionNo: '',
      email: '',
      mobile: '',
      gender: 'Male',
      parentName: '',
      relationship: 'Father',
      status: 'Active'
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
      toast.success('Record created successfully');
    } else {
      toast.success('Record updated successfully');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    toast.error('Record deleted successfully');
  };

  const handleTriggerAction = (actionName: string) => {
    toast.success(`${actionName} triggered successfully!`);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Users className="w-6 h-6" />
            </span>
            <span>{title}</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>
        </div>

        <div className="flex gap-2">
          {isReports && (
            <button
              onClick={() => handleTriggerAction('Export Student Reports')}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold px-3 py-2 rounded-xl text-xs shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}

          {!isDashboard && !isReports && !isFeedback && !isCommunication && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all duration-200 hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student Record</span>
            </button>
          )}
        </div>
      </div>

      {/* DYNAMIC METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Students</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">1,245</span>
            <span className="text-[10px] text-emerald-500 font-bold mt-1 inline-flex items-center gap-0.5">
              +45 new admissions
            </span>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Average Attendance</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">94.8%</span>
            <span className="text-[10px] text-emerald-500 font-bold mt-1 inline-flex items-center gap-0.5">
              Target met
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Pending Leave Apps</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">12 Applications</span>
            <span className="text-[10px] text-amber-500 font-bold mt-1 block">Awaiting teacher sign-off</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Behavioral Remarks</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">2 Active Warnings</span>
            <span className="text-[10px] text-rose-500 font-bold mt-1 block">Requires guardian sync</span>
          </div>
          <div className="p-3 bg-red-50 rounded-xl text-red-650">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* DASHBOARD PAGE EXCLUSIVES */}
      {isDashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Class-wise Distribution index (No. of Students)</h3>
              <span className="text-xs text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded">2026 Batch</span>
            </div>
            
            {/* SVG Custom Graph */}
            <div className="h-48 w-full flex items-end justify-between px-2 pt-4">
              <div className="flex flex-col items-center gap-1.5 w-1/6">
                <div className="w-full bg-slate-100 hover:bg-slate-200 rounded-t-lg h-24 transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-purple-600 hover:bg-purple-700 rounded-t-lg h-16"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">120 Std</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Class 7</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-1/6">
                <div className="w-full bg-slate-100 hover:bg-slate-200 rounded-t-lg h-36 transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-purple-600 hover:bg-purple-700 rounded-t-lg h-28"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">180 Std</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Class 8</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-1/6">
                <div className="w-full bg-slate-100 hover:bg-slate-200 rounded-t-lg h-44 transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-purple-600 hover:bg-purple-700 rounded-t-lg h-38"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">210 Std</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Class 9</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-1/6">
                <div className="w-full bg-slate-100 hover:bg-slate-200 rounded-t-lg h-48 transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-purple-600 hover:bg-purple-700 rounded-t-lg h-44"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">240 Std</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Class 10</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-1/6">
                <div className="w-full bg-slate-100 hover:bg-slate-200 rounded-t-lg h-32 transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-purple-600 hover:bg-purple-700 rounded-t-lg h-22"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">140 Std</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Class 11</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Demographic Indicators</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-655 mb-1">
                  <span>General Category</span>
                  <span>58%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-650 h-full w-[58%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-655 mb-1">
                  <span>OBC Reservation</span>
                  <span>27%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full w-[27%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-655 mb-1">
                  <span>SC / ST Grants</span>
                  <span>15%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-pink-500 h-full w-[15%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DATA CONTENT SECTION (TABLES & SEARCHES) */}
      {!isDashboard && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-slate-55/10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 focus:outline-none"
              >
                <option value="All">All Grades</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 8">Class 8</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* DYNAMIC SUBMODULE DATA TABLES */}
          <div className="overflow-x-auto">
            
            {/* 1. STUDENT PROFILE/ADMISSION/REGISTRATION TABLE */}
            {(isAdmission || isRegistration || isProfile || isEnrollment || isAllocation || isPromotion || isTransfer || isReports) && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-655 font-bold uppercase pb-2">
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Parent Guardian</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {studentsList.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{s.admissionNo}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{s.name}</td>
                      <td className="py-3 px-4">{s.rollNo}</td>
                      <td className="py-3 px-4 font-bold text-slate-500">{s.class}</td>
                      <td className="py-3 px-4">{s.parentName}</td>
                      <td className="py-3 px-4">{s.mobile}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>{s.status}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleOpenEditModal(s)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-purple-600"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 2. PARENT/GUARDIAN HUB TABLE */}
            {isParents && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-655 font-bold uppercase pb-2">
                    <th className="py-3 px-4">Guardian Name</th>
                    <th className="py-3 px-4">Relationship</th>
                    <th className="py-3 px-4">Wards / Student</th>
                    <th className="py-3 px-4">Occupation</th>
                    <th className="py-3 px-4">Mobile</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {parentsList.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-semibold text-slate-800">{p.name}</td>
                      <td className="py-3 px-4 font-bold text-slate-500">{p.relationship}</td>
                      <td className="py-3 px-4 text-purple-650 font-bold">{p.studentName}</td>
                      <td className="py-3 px-4">{p.occupation}</td>
                      <td className="py-3 px-4">{p.mobile}</td>
                      <td className="py-3 px-4 font-mono">{p.email}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleOpenEditModal(p)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-purple-600"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 3. DOCUMENT VERIFICATION TABLE */}
            {isDocuments && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-655 font-bold uppercase pb-2">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Document Type</th>
                    <th className="py-3 px-4">File Name</th>
                    <th className="py-3 px-4">Upload Date</th>
                    <th className="py-3 px-4 text-center">Verification Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {documents.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-semibold text-slate-800">{d.studentName}</td>
                      <td className="py-3 px-4 font-bold text-slate-500">{d.docType}</td>
                      <td className="py-3 px-4 font-mono text-purple-650">{d.fileName}</td>
                      <td className="py-3 px-4">{d.uploadDate}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          d.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>{d.status}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => handleTriggerAction(`Verify Document ${d.id}`)} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[9px]">Verify</button>
                          <button onClick={() => handleDelete(d.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 4. ATTENDANCE & LEAVES TABLE */}
            {(isAttendance || isLeaves) && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-655 font-bold uppercase pb-2">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Leave / Attendance Type</th>
                    <th className="py-3 px-4">Start Date</th>
                    <th className="py-3 px-4">End Date</th>
                    <th className="py-3 px-4">Reason Summary</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {leavesList.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-semibold text-slate-800">{l.studentName}</td>
                      <td className="py-3 px-4 font-bold text-slate-500">{l.leaveType}</td>
                      <td className="py-3 px-4">{l.startDate}</td>
                      <td className="py-3 px-4">{l.endDate}</td>
                      <td className="py-3 px-4 truncate max-w-xs">{l.reason}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          l.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>{l.status}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => handleTriggerAction(`Approve leave ${l.id}`)} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[9px]">Approve</button>
                          <button onClick={() => handleTriggerAction(`Reject leave ${l.id}`)} className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[9px]">Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 5. MEDICAL RECORD TABLE */}
            {isMedical && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-655 font-bold uppercase pb-2">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Allergies</th>
                    <th className="py-3 px-4">Chronic Conditions</th>
                    <th className="py-3 px-4">Emergency Contact</th>
                    <th className="py-3 px-4">Last Routine Checkup</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {medicalRecords.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-semibold text-slate-800">{m.studentName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-600">{m.bloodGroup}</td>
                      <td className="py-3 px-4 text-amber-600 font-bold">{m.allergies}</td>
                      <td className="py-3 px-4">{m.conditions}</td>
                      <td className="py-3 px-4">{m.emergencyContact}</td>
                      <td className="py-3 px-4">{m.lastCheckup}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleOpenEditModal(m)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-purple-600"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(m.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 6. DISCIPLINARY MANAGEMENT TABLE */}
            {isDiscipline && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-655 font-bold uppercase pb-2">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Violation Details</th>
                    <th className="py-3 px-4">Action Taken</th>
                    <th className="py-3 px-4">Occurrence Date</th>
                    <th className="py-3 px-4 text-center">Severity Level</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {disciplineCases.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-semibold text-slate-800">{d.studentName}</td>
                      <td className="py-3 px-4 text-slate-700">{d.violation}</td>
                      <td className="py-3 px-4 font-bold text-slate-500">{d.actionTaken}</td>
                      <td className="py-3 px-4">{d.date}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] ${
                          d.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>{d.severity}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[9px]">{d.status}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleOpenEditModal(d)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-purple-600"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(d.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 7. ALL OTHER AUXILIARY MANAGEMENT TABS (CATEGORIES, CARDS, SCHOLARS, TRANSPORT, HOSTEL, LIBRARY) */}
            {(isCategories || isIdCards || isActivities || isCertificates || isFeedback || isCommunication || isTransport || isHostel || isLibrary || isFees || isExams || isAlumni) && (
              <div className="space-y-6 pt-4 font-semibold">
                <div className="bg-purple-900 text-white p-6 rounded-2xl shadow-md flex items-center justify-between">
                  <div>
                    <h4 className="text-purple-200 text-xs font-bold uppercase tracking-wider">Dynamic Integration Connected</h4>
                    <p className="text-sm mt-1 font-medium text-purple-100">
                      This submodule route automatically inherits active configurations from the master tables.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleTriggerAction('Configure Rules')} className="px-4 py-2 bg-purple-800 hover:bg-purple-750 text-white rounded-xl text-xs transition">
                      Configure Rules
                    </button>
                    <button onClick={() => handleTriggerAction('Sync Registry')} className="px-4 py-2 bg-white text-purple-900 hover:bg-purple-50 rounded-xl text-xs transition">
                      Sync Registry
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Connected Mappings</span>
                    <span className="text-xl font-black block text-slate-800">48 Wards Linked</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Active sync with parent databases</span>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Verification Indexes</span>
                    <span className="text-xl font-black block text-emerald-650">98% Verified</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Credential checks locked</span>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Audits Logs</span>
                    <span className="text-xl font-black block text-purple-650">Audit Trails Active</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Every profile access log recorded</span>
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
            <div className="bg-gradient-to-r from-purple-600 to-indigo-650 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">{modalType === 'add' ? 'Create Student Entry' : 'Edit Profile Details'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs font-medium text-slate-700">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formFields.name || ''}
                  onChange={(e) => setFormFields(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Class / Standard</label>
                  <select
                    value={formFields.class || ''}
                    onChange={(e) => setFormFields(prev => ({ ...prev, class: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="Class 10">Class 10</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 8">Class 8</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Roll Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 1004"
                    value={formFields.rollNo || ''}
                    onChange={(e) => setFormFields(prev => ({ ...prev, rollNo: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Parent / Guardian Name</label>
                <input
                  type="text"
                  placeholder="Vijay Sharma"
                  value={formFields.parentName || ''}
                  onChange={(e) => setFormFields(prev => ({ ...prev, parentName: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-750 text-white rounded-lg font-semibold"
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
