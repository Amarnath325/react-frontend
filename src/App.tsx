import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import StudentView from './pages/StudentView';
import SchoolRegistration from './pages/SchoolRegistration';
import StudentRegistration from './pages/StudentRegistration';
import StudentPromotion from './pages/StudentManager/StudentPromotion';

// Student Management Pages Imports
import StudentDashboard from './pages/StudentManager/StudentDashboard';
import StudentAdmission from './pages/StudentManager/StudentAdmission';
import StudentAdmissionForm from './pages/StudentManager/StudentAdmissionForm';
import StudentRegistrationSub from './pages/StudentManager/StudentRegistration';
import StudentRegistrationForm from './pages/StudentManager/StudentRegistrationForm';
import StudentProfileManagement from './pages/StudentManager/StudentProfileManagement';
import StudentDocumentManagement from './pages/StudentManager/StudentDocumentManagement';
import ParentGuardianManagement from './pages/StudentManager/ParentGuardianManagement';
import StudentCategoryManagement from './pages/StudentManager/StudentCategoryManagement';
import StudentIDCardManagement from './pages/StudentManager/StudentIDCardManagement';
import StudentEnrollment from './pages/StudentManager/StudentEnrollment';
import ClassSectionAllocation from './pages/StudentManager/ClassSectionAllocation';
import StudentTransfer from './pages/StudentManager/StudentTransfer';
import StudentAttendance from './pages/StudentManager/StudentAttendance';
import StudentLeaveManagement from './pages/StudentManager/StudentLeaveManagement';
import StudentMedicalRecord from './pages/StudentManager/StudentMedicalRecord';
import StudentDisciplineManagement from './pages/StudentManager/StudentDisciplineManagement';
import StudentActivityManagement from './pages/StudentManager/StudentActivityManagement';
import StudentCertificateManagement from './pages/StudentManager/StudentCertificateManagement';
import StudentFeedback from './pages/StudentManager/StudentFeedback';
import StudentCommunication from './pages/StudentManager/StudentCommunication';
import StudentTransportAllocation from './pages/StudentManager/StudentTransportAllocation';
import StudentHostelAllocation from './pages/StudentManager/StudentHostelAllocation';
import StudentLibraryMembership from './pages/StudentManager/StudentLibraryMembership';
import StudentFeeManagement from './pages/StudentManager/StudentFeeManagement';
import StudentExamRecord from './pages/StudentManager/StudentExamRecord';
import AlumniManagement from './pages/StudentManager/AlumniManagement';
import StudentReports from './pages/StudentManager/StudentReports';

// Attendance Management Pages Imports
import AttendanceDashboard from './pages/AttendanceManager/AttendanceDashboard';
import AttendanceConfiguration from './pages/AttendanceManager/AttendanceConfiguration';
import StudentAttendanceSub from './pages/AttendanceManager/StudentAttendance';
import TeacherAttendance from './pages/AttendanceManager/TeacherAttendance';
import StaffAttendance from './pages/AttendanceManager/StaffAttendance';
import DailyAttendanceEntry from './pages/AttendanceManager/DailyAttendanceEntry';
import PeriodWiseAttendance from './pages/AttendanceManager/PeriodWiseAttendance';
import BiometricAttendanceIntegration from './pages/AttendanceManager/BiometricAttendanceIntegration';
import RFIDSmartCardAttendance from './pages/AttendanceManager/RFIDSmartCardAttendance';
import FaceRecognitionAttendance from './pages/AttendanceManager/FaceRecognitionAttendance';
import MobileAttendance from './pages/AttendanceManager/MobileAttendance';
import AttendanceApproval from './pages/AttendanceManager/AttendanceApproval';
import LeaveManagementIntegration from './pages/AttendanceManager/LeaveManagementIntegration';
import HolidayManagementIntegration from './pages/AttendanceManager/HolidayManagementIntegration';
import WeeklyOffManagement from './pages/AttendanceManager/WeeklyOffManagement';
import AttendanceCorrection from './pages/AttendanceManager/AttendanceCorrection';
import LateComingEarlyLeaving from './pages/AttendanceManager/LateComingEarlyLeaving';
import AbsentManagement from './pages/AttendanceManager/AbsentManagement';
import AttendanceNotification from './pages/AttendanceManager/AttendanceNotification';
import AttendanceReports from './pages/AttendanceManager/AttendanceReports';
import AttendanceAnalytics from './pages/AttendanceManager/AttendanceAnalytics';
import ShiftPolicyList from './pages/AttendanceManager/Setting/ShiftPolicyList';
import ShiftPolicyForm from './pages/AttendanceManager/Setting/ShiftPolicyForm';
import BranchList from './pages/AttendanceManager/Setting/BranchList';
import BranchForm from './pages/AttendanceManager/Setting/BranchForm';

// Teacher & Staff Management Pages Imports
import StaffDashboard from './pages/TeacherStaff/Dashboard';
import EmployeeMaster from './pages/TeacherStaff/EmployeeMaster';
import EmployeeForm from './pages/TeacherStaff/EmployeeForm';
import TeacherManagement from './pages/TeacherStaff/TeacherManagement';
import NonTeachingStaffManagement from './pages/TeacherStaff/NonTeachingStaffManagement';
import DepartmentManagement from './pages/TeacherStaff/DepartmentManagement';
import DesignationManagement from './pages/TeacherStaff/DesignationManagement';
import EmployeeProfile from './pages/TeacherStaff/EmployeeProfile';
import EmployeeDocuments from './pages/TeacherStaff/EmployeeDocuments';
import QualificationManagement from './pages/TeacherStaff/QualificationManagement';
import ExperienceManagement from './pages/TeacherStaff/ExperienceManagement';
import JoiningManagement from './pages/TeacherStaff/JoiningManagement';
import TransferManagement from './pages/TeacherStaff/TransferManagement';
import ExitResignationManagement from './pages/TeacherStaff/ExitResignationManagement';
import ClassTeacherAllocation from './pages/TeacherStaff/ClassTeacherAllocation';
import SubjectAllocation from './pages/TeacherStaff/SubjectAllocation';
import TimetableAllocation from './pages/TeacherStaff/TimetableAllocation';
import EmployeeAttendance from './pages/TeacherStaff/EmployeeAttendance';
import LeaveManagement from './pages/TeacherStaff/LeaveManagement';
import SubstituteTeacherManagement from './pages/TeacherStaff/SubstituteTeacherManagement';
import WorkloadManagement from './pages/TeacherStaff/WorkloadManagement';
import PerformanceManagement from './pages/TeacherStaff/PerformanceManagement';
import TrainingManagement from './pages/TeacherStaff/TrainingManagement';
import PayrollIntegration from './pages/TeacherStaff/PayrollIntegration';
import EmployeeCommunication from './pages/TeacherStaff/EmployeeCommunication';
import GrievanceManagement from './pages/TeacherStaff/GrievanceManagement';
import IDCardManagement from './pages/TeacherStaff/IDCardManagement';
import StaffReports from './pages/TeacherStaff/Reports';

import SectionManager from './components/Academic/SectionManager';
import SubjectManager from './components/Academic/SubjectManager';
import TimetableGenerator from './components/Academic/TimetableGenerator';
import ClassTeacherManager from './components/Academic/ClassTeacherManager';
import HolidayManager from './components/Academic/HolidayManager';
import WeekoffManager from './components/Academic/WeekoffManager';
import AcademicYearManager from './components/Academic/AcademicYearManager';
import DepartmentManager from './components/Academic/DepartmentManager';
import TeacherAllocationManager from './components/Academic/TeacherAllocationManager';
import SyllabusManager from './components/Academic/SyllabusManager';
import LessonPlanManager from './components/Academic/LessonPlanManager';
import StudyMaterialManager from './components/Academic/StudyMaterialManager';
import AcademicHomeworkManager from './components/Academic/AcademicHomeworkManager';
import AssignmentManager from './components/Academic/AssignmentManager';
import AcademicReports from './components/Academic/AcademicReports';
import LibrarySettingsManager from './components/Library/LibrarySettingsManager';
import BookCategoryManager from './components/Library/BookCategoryManager';
import BookSubCategoryManager from './components/Library/BookSubCategoryManager';
import AuthorPublisherManager from './components/Library/AuthorPublisherManager';
import BookInventoryManager from './components/Library/BookInventoryManager';
import RackShelfManager from './components/Library/RackShelfManager';
import LibraryMemberManager from './components/Library/LibraryMemberManager';
import BookIssueReturnManager from './components/Library/BookIssueReturnManager';
import BookReservationManager from './components/Library/BookReservationManager';
import FineCollectionManager from './components/Library/FineCollectionManager';
import LibraryDashboard from './components/Library/LibraryDashboard';
import TransportPlaceholder from './components/Transport/TransportPlaceholder';
import VehicleManager from './components/Transport/VehicleManager';
import VehicleTypeManager from './components/Transport/VehicleTypeManager';
import DriverManager from './components/Transport/DriverManager';
import RouteManager from './components/Transport/RouteManager';
import StopManager from './components/Transport/StopManager';
import TripManager from './components/Transport/TripManager';
import FuelManager from './components/Transport/FuelManager';
import ComplaintManager from './components/Transport/ComplaintManager';
import DocumentManager from './components/Transport/DocumentManager';
import MaintenanceManager from './components/Transport/MaintenanceManager';
import AllocationManager from './components/Transport/AllocationManager';
import TransportAttendanceManager from './components/Transport/TransportAttendanceManager';
import GpsTrackingManager from './components/Transport/GpsTrackingManager';
import TransportFeeManager from './components/Transport/TransportFeeManager';
import HostelPlaceholder from './components/Hostel/HostelPlaceholder';
import HostelAdmissionManager from './components/Hostel/HostelAdmissionManager';
import HostelMessManager from './components/Hostel/HostelMessManager';
import OutpassManager from './components/Hostel/OutpassManager';
import HostelComplaintManager from './components/Hostel/HostelComplaintManager';
import HostelInventoryManager from './components/Hostel/HostelInventoryManager';
import HostelVisitorManager from './components/Hostel/HostelVisitorManager';
import HostelStaffManager from './components/Hostel/HostelStaffManager';
import HostelDisciplineManager from './components/Hostel/HostelDisciplineManager';
import HostelHealthManager from './components/Hostel/HostelHealthManager';
import HostelPortalManager from './components/Hostel/HostelPortalManager';
import HostelAlertsManager from './components/Hostel/HostelAlertsManager';
import HostelAttendanceManager from './components/Hostel/HostelAttendanceManager';
import HostelFeeManager from './components/Hostel/HostelFeeManager';
import HostelRoomBedManager from './components/Hostel/HostelRoomBedManager';
import InternalMessagingManager from './components/Communication/InternalMessagingManager';
import AnnouncementsManager from './components/Communication/AnnouncementsManager';
import ParentTeacherHub from './components/Communication/ParentTeacherHub';
import SMSEmailGateway from './components/Communication/SMSEmailGateway';
import PushNotificationCenter from './components/Communication/PushNotificationCenter';
import HomeworkAlertManager from './components/Communication/HomeworkAlertManager';
import ExamResultAnnouncer from './components/Communication/ExamResultAnnouncer';
import AttendanceAlertManager from './components/Communication/AttendanceAlertManager';
import TimetableAlertManager from './components/Communication/TimetableAlertManager';
import CircularBoard from './components/Communication/CircularBoard';
import EventCalendarNotifications from './components/Communication/EventCalendarNotifications';
import FeeReminderManager from './components/Communication/FeeReminderManager';
import ComplaintGrievanceDesk from './components/Communication/ComplaintGrievanceDesk';
import StaffHRCommunicationHub from './components/Communication/StaffHRCommunicationHub';
import DiscussionForums from './components/Communication/DiscussionForums';
import PollsSurveys from './components/Communication/PollsSurveys';
import EmergencyBroadcast from './components/Communication/EmergencyBroadcast';
import AlumniNetworkLinker from './components/Communication/AlumniNetworkLinker';
import MessageDeliveryAnalytics from './components/Communication/MessageDeliveryAnalytics';
import CommunicationAuditTrails from './components/Communication/CommunicationAuditTrails';
import ExaminationManager from './components/Examination/ExaminationManager';
import ExamDashboard from './components/Examination/ExamDashboard';
import SubjectExamMapping from './components/Examination/SubjectExamMapping';
import ExamSeatingManager from './components/Examination/ExamSeatingManager';
import AdmitCardInvigilatorManager from './components/Examination/AdmitCardInvigilatorManager';
import MarksEntryVerification from './components/Examination/MarksEntryVerification';
import MarksVerificationAudit from './components/Examination/MarksVerificationAudit';
import GradeResultProcessor from './components/Examination/GradeResultProcessor';
import ResultProcessingEngine from './components/Examination/ResultProcessingEngine';
import ReportCardCertificateManager from './components/Examination/ReportCardCertificateManager';
import PerformanceRankReports from './components/Examination/PerformanceRankReports';
import ReExamSupplementaryManager from './components/Examination/ReExamSupplementaryManager';
import ExamTypeManager from './components/Examination/ExamTypeManager';
import ExamScheduleManager from './components/Examination/ExamScheduleManager';
import Layout from './components/Layout';
import SchoolSettings from './pages/SchoolSettings';
import AcademicCalendarPage from './pages/AcademicCalendarPage';
import RolePermissionPage from './pages/RolePermissionPage';
import { checkUserPermission } from './utils/permissionHelpers';
import { ShieldAlert } from 'lucide-react';

// Fee & Finance Pages Imports
import FinanceDashboard from './pages/FeeManager/FinanceDashboard';
import FeeMasterSetup from './pages/FeeManager/FeeMasterSetup';
import FeeHeadManagement from './pages/FeeManager/FeeHeadManagement';
import FeeStructureManagement from './pages/FeeManager/FeeStructureManagement';
import ClassWiseFeeSetup from './pages/FeeManager/ClassWiseFeeSetup';
import StudentFeeAllocation from './pages/FeeManager/StudentFeeAllocation';
import FeeCollection from './pages/FeeManager/FeeCollection';
import OnlinePaymentManagement from './pages/FeeManager/OnlinePaymentManagement';
import ReceiptManagement from './pages/FeeManager/ReceiptManagement';
import FeeDiscountManagement from './pages/FeeManager/FeeDiscountManagement';
import ScholarshipManagement from './pages/FeeManager/ScholarshipManagement';
import FinePenaltyManagement from './pages/FeeManager/FinePenaltyManagement';
import InstallmentManagement from './pages/FeeManager/InstallmentManagement';
import FeeRefundManagement from './pages/FeeManager/FeeRefundManagement';
import DueFeeManagement from './pages/FeeManager/DueFeeManagement';
import TransportFeeManagement from './pages/FeeManager/TransportFeeManagement';
import HostelFeeManagement from './pages/FeeManager/HostelFeeManagement';
import OtherIncomeManagement from './pages/FeeManager/OtherIncomeManagement';
import ExpenseManagement from './pages/FeeManager/ExpenseManagement';
import VendorPaymentManagement from './pages/FeeManager/VendorPaymentManagement';
import AccountingManagement from './pages/FeeManager/AccountingManagement';
import BankManagement from './pages/FeeManager/BankManagement';
import CashBook from './pages/FeeManager/CashBook';
import BudgetManagement from './pages/FeeManager/BudgetManagement';
import FinanceReports from './pages/FeeManager/FinanceReports';
import UserManagement from './pages/UserManagement/UserManagement';
import SubscriptionPlansPage from './pages/Subscription/SubscriptionPlansPage';
import SubscriptionManagementPage from './pages/Subscription/SubscriptionManagementPage';
import MySubscriptionPage from './pages/Subscription/MySubscriptionPage';
import ApiManagementPage from './pages/Admin/ApiManagementPage';
import SystemLogsPage from './pages/Admin/SystemLogsPage';
import DatabaseManagementPage from './pages/Admin/DatabaseManagementPage';
import SecurityManagementPage from './pages/Admin/SecurityManagementPage';
import SessionLockModal from './components/SessionLockModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
}

// Protected route wrapper with Layout (sidebar will be shown)
const ProtectedRouteWithLayout: React.FC<ProtectedRouteProps> = ({ children, permission }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2 text-indigo-600">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xs text-gray-500 font-semibold">Validating credentials...</span>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If a permission is required for this route, check it
  if (permission && !checkUserPermission(user as any, permission)) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-500 shadow-md mb-5">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">Access Denied</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            You do not have the required permissions ({permission.replace(/_/g, ' ')}) to access this page. Please contact your school admin.
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(-1)}
              className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              Go Back
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Wrap with Layout to show sidebar
  return <Layout>{children}</Layout>;
};

// Simple protected route (without layout, for pages that don't need sidebar)
// const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const { isAuthenticated, isLoading } = useAuth();
  
//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-gray-500">Loading...</div>
//       </div>
//     );
//   }
  
//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }
  
//   return <>{children}</>;
// };

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/register" element={<SchoolRegistration />} />
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      
      {/* Protected routes WITH sidebar (Layout) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRouteWithLayout>
            <Dashboard />
          </ProtectedRouteWithLayout>
        }
      />
      
      {/* Menu routes - all will have sidebar */}
      <Route path="/students" element={<Navigate to="/students/dashboard" replace />} />
      
      <Route
        path="/students/all"
        element={
          <ProtectedRouteWithLayout>
            <StudentList />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/students/:id/view"
        element={
          <ProtectedRouteWithLayout>
            <StudentView />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/students/add"
        element={
          <ProtectedRouteWithLayout>
            <StudentRegistration />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/students/dashboard"
        element={
          <ProtectedRouteWithLayout>
            <StudentDashboard />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/admission"
        element={
          <ProtectedRouteWithLayout>
            <StudentAdmission />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/admission/new"
        element={
          <ProtectedRouteWithLayout>
            <StudentAdmissionForm />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/admission/edit/:id"
        element={
          <ProtectedRouteWithLayout>
            <StudentAdmissionForm />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/registration"
        element={
          <ProtectedRouteWithLayout>
            <StudentRegistrationSub />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/registration/new"
        element={
          <ProtectedRouteWithLayout>
            <StudentRegistrationForm />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/registration/edit/:id"
        element={
          <ProtectedRouteWithLayout>
            <StudentRegistrationForm />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/profile"
        element={
          <ProtectedRouteWithLayout>
            <StudentProfileManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/documents"
        element={
          <ProtectedRouteWithLayout>
            <StudentDocumentManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/parents"
        element={
          <ProtectedRouteWithLayout>
            <ParentGuardianManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/categories"
        element={
          <ProtectedRouteWithLayout>
            <StudentCategoryManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/id-cards"
        element={
          <ProtectedRouteWithLayout>
            <StudentIDCardManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/enrollment"
        element={
          <ProtectedRouteWithLayout>
            <StudentEnrollment />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/allocation"
        element={
          <ProtectedRouteWithLayout>
            <ClassSectionAllocation />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/promotion"
        element={
          <ProtectedRouteWithLayout>
            <StudentPromotion />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/transfer"
        element={
          <ProtectedRouteWithLayout>
            <StudentTransfer />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/attendance"
        element={
          <ProtectedRouteWithLayout>
            <StudentAttendance />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/leaves"
        element={
          <ProtectedRouteWithLayout>
            <StudentLeaveManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/medical"
        element={
          <ProtectedRouteWithLayout>
            <StudentMedicalRecord />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/discipline"
        element={
          <ProtectedRouteWithLayout>
            <StudentDisciplineManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/activities"
        element={
          <ProtectedRouteWithLayout>
            <StudentActivityManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/certificates"
        element={
          <ProtectedRouteWithLayout>
            <StudentCertificateManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/feedback"
        element={
          <ProtectedRouteWithLayout>
            <StudentFeedback />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/communication"
        element={
          <ProtectedRouteWithLayout>
            <StudentCommunication />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/transport"
        element={
          <ProtectedRouteWithLayout>
            <StudentTransportAllocation />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/hostel"
        element={
          <ProtectedRouteWithLayout>
            <StudentHostelAllocation />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/library"
        element={
          <ProtectedRouteWithLayout>
            <StudentLibraryMembership />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/fees"
        element={
          <ProtectedRouteWithLayout>
            <StudentFeeManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/exams"
        element={
          <ProtectedRouteWithLayout>
            <StudentExamRecord />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/alumni"
        element={
          <ProtectedRouteWithLayout>
            <AlumniManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/students/reports"
        element={
          <ProtectedRouteWithLayout>
            <StudentReports />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/teachers/dashboard"
        element={
          <ProtectedRouteWithLayout>
            <StaffDashboard />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/employee-master"
        element={
          <ProtectedRouteWithLayout>
            <EmployeeMaster />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/employee-master/add"
        element={
          <ProtectedRouteWithLayout>
            <EmployeeForm mode="add" />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/employee-master/edit/:id"
        element={
          <ProtectedRouteWithLayout>
            <EmployeeForm mode="edit" />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/employee-master/view/:id"
        element={
          <ProtectedRouteWithLayout>
            <EmployeeForm mode="view" />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/teachers-list"
        element={
          <ProtectedRouteWithLayout>
            <TeacherManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/non-teaching"
        element={
          <ProtectedRouteWithLayout>
            <NonTeachingStaffManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/departments"
        element={
          <ProtectedRouteWithLayout>
            <DepartmentManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/designations"
        element={
          <ProtectedRouteWithLayout>
            <DesignationManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/profiles"
        element={
          <ProtectedRouteWithLayout>
            <EmployeeProfile />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/documents"
        element={
          <ProtectedRouteWithLayout>
            <EmployeeDocuments />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/qualifications"
        element={
          <ProtectedRouteWithLayout>
            <QualificationManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/experience"
        element={
          <ProtectedRouteWithLayout>
            <ExperienceManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/joining"
        element={
          <ProtectedRouteWithLayout>
            <JoiningManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/transfers"
        element={
          <ProtectedRouteWithLayout>
            <TransferManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/exits"
        element={
          <ProtectedRouteWithLayout>
            <ExitResignationManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/class-allocation"
        element={
          <ProtectedRouteWithLayout>
            <ClassTeacherAllocation />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/subject-allocation"
        element={
          <ProtectedRouteWithLayout>
            <SubjectAllocation />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/timetable-allocation"
        element={
          <ProtectedRouteWithLayout>
            <TimetableAllocation />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/attendance"
        element={
          <ProtectedRouteWithLayout>
            <EmployeeAttendance />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/leave"
        element={
          <ProtectedRouteWithLayout>
            <LeaveManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/substitutes"
        element={
          <ProtectedRouteWithLayout>
            <SubstituteTeacherManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/workload"
        element={
          <ProtectedRouteWithLayout>
            <WorkloadManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/performance"
        element={
          <ProtectedRouteWithLayout>
            <PerformanceManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/training"
        element={
          <ProtectedRouteWithLayout>
            <TrainingManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/payroll"
        element={
          <ProtectedRouteWithLayout>
            <PayrollIntegration />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/communication"
        element={
          <ProtectedRouteWithLayout>
            <EmployeeCommunication />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/grievance"
        element={
          <ProtectedRouteWithLayout>
            <GrievanceManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/id-cards"
        element={
          <ProtectedRouteWithLayout>
            <IDCardManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/teachers/reports"
        element={
          <ProtectedRouteWithLayout>
            <StaffReports />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/attendance/dashboard"
        element={
          <ProtectedRouteWithLayout>
            <AttendanceDashboard />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/config"
        element={
          <ProtectedRouteWithLayout>
            <AttendanceConfiguration />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/settings/shift-policy"
        element={
          <ProtectedRouteWithLayout>
            <ShiftPolicyList />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/settings/shift-policy/create"
        element={
          <ProtectedRouteWithLayout>
            <ShiftPolicyForm />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/settings/shift-policy/edit/:id"
        element={
          <ProtectedRouteWithLayout>
            <ShiftPolicyForm />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/settings/shift-policy/copy/:id"
        element={
          <ProtectedRouteWithLayout>
            <ShiftPolicyForm />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/settings/holiday-policy"
        element={
          <ProtectedRouteWithLayout>
            <HolidayManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/settings/weekly-policy"
        element={
          <ProtectedRouteWithLayout>
            <WeekoffManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/settings/branch"
        element={
          <ProtectedRouteWithLayout>
            <BranchList />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/settings/branch/create"
        element={
          <ProtectedRouteWithLayout>
            <BranchForm />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/settings/branch/edit/:id"
        element={
          <ProtectedRouteWithLayout>
            <BranchForm />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/student"
        element={
          <ProtectedRouteWithLayout>
            <StudentAttendanceSub />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/teacher"
        element={
          <ProtectedRouteWithLayout>
            <TeacherAttendance />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/staff"
        element={
          <ProtectedRouteWithLayout>
            <StaffAttendance />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/daily-entry"
        element={
          <ProtectedRouteWithLayout>
            <DailyAttendanceEntry />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/period-wise"
        element={
          <ProtectedRouteWithLayout>
            <PeriodWiseAttendance />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/biometric"
        element={
          <ProtectedRouteWithLayout>
            <BiometricAttendanceIntegration />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/rfid"
        element={
          <ProtectedRouteWithLayout>
            <RFIDSmartCardAttendance />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/face-recognition"
        element={
          <ProtectedRouteWithLayout>
            <FaceRecognitionAttendance />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/mobile"
        element={
          <ProtectedRouteWithLayout>
            <MobileAttendance />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/approval"
        element={
          <ProtectedRouteWithLayout>
            <AttendanceApproval />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/leave-integration"
        element={
          <ProtectedRouteWithLayout>
            <LeaveManagementIntegration />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/holiday-integration"
        element={
          <ProtectedRouteWithLayout>
            <HolidayManagementIntegration />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/weekly-off"
        element={
          <ProtectedRouteWithLayout>
            <WeeklyOffManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/correction"
        element={
          <ProtectedRouteWithLayout>
            <AttendanceCorrection />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/late-early"
        element={
          <ProtectedRouteWithLayout>
            <LateComingEarlyLeaving />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/absents"
        element={
          <ProtectedRouteWithLayout>
            <AbsentManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/notification"
        element={
          <ProtectedRouteWithLayout>
            <AttendanceNotification />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/reports"
        element={
          <ProtectedRouteWithLayout>
            <AttendanceReports />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/attendance/analytics"
        element={
          <ProtectedRouteWithLayout>
            <AttendanceAnalytics />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/academic/classes"
        element={
          <ProtectedRouteWithLayout>
            <SectionManager />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/academic/subjects"
        element={
          <ProtectedRouteWithLayout>
            <SubjectManager />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/academic/timetable"
        element={
          <ProtectedRouteWithLayout>
            <TimetableGenerator />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/academic/calendar"
        element={
          <ProtectedRouteWithLayout>
            <AcademicCalendarPage />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/academic/class-teacher"
        element={
          <ProtectedRouteWithLayout>
            <ClassTeacherManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/academic/holidays"
        element={
          <ProtectedRouteWithLayout>
            <HolidayManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/academic/weekoff"
        element={
          <ProtectedRouteWithLayout>
            <WeekoffManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/academic/sessions"
        element={
          <ProtectedRouteWithLayout>
            <AcademicYearManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/academic/departments"
        element={
          <ProtectedRouteWithLayout>
            <DepartmentManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/academic/teacher-allocations"
        element={
          <ProtectedRouteWithLayout>
            <TeacherAllocationManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/academic/syllabus"
        element={
          <ProtectedRouteWithLayout>
            <SyllabusManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/academic/lesson-plans"
        element={
          <ProtectedRouteWithLayout>
            <LessonPlanManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/academic/study-materials"
        element={
          <ProtectedRouteWithLayout>
            <StudyMaterialManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/academic/homework"
        element={
          <ProtectedRouteWithLayout>
            <AcademicHomeworkManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/academic/assignments"
        element={
          <ProtectedRouteWithLayout>
            <AssignmentManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/academic/reports"
        element={
          <ProtectedRouteWithLayout>
            <AcademicReports />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/exams/dashboard"
        element={
          <ProtectedRouteWithLayout>
            <ExamDashboard />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/exams/types"
        element={
          <ProtectedRouteWithLayout>
            <ExamTypeManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/exams/setup"
        element={
          <ProtectedRouteWithLayout>
            <ExaminationManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/exams/schedule"
        element={
          <ProtectedRouteWithLayout>
            <ExamScheduleManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/exams/subject-mapping"
        element={
          <ProtectedRouteWithLayout>
            <SubjectExamMapping />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/exams/room-allocation"
        element={
          <ProtectedRouteWithLayout>
            <ExamSeatingManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/exams/seating-arrangement"
        element={
          <ProtectedRouteWithLayout>
            <ExamSeatingManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/exams/admit-cards"
        element={
          <ProtectedRouteWithLayout>
            <AdmitCardInvigilatorManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/exams/invigilators"
        element={
          <ProtectedRouteWithLayout>
            <AdmitCardInvigilatorManager />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/exams/marks-entry"
        element={
          <ProtectedRouteWithLayout>
            <MarksEntryVerification />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/exams/marks-verification"
        element={
          <ProtectedRouteWithLayout>
            <MarksVerificationAudit />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/exams/grades"
        element={
          <ProtectedRouteWithLayout>
            <GradeResultProcessor />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/exams/result-processing"
        element={
          <ProtectedRouteWithLayout>
            <ResultProcessingEngine />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/exams/report-card"
        element={
          <ProtectedRouteWithLayout>
            <ReportCardCertificateManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/exams/performance-analysis"
        element={
          <ProtectedRouteWithLayout>
            <PerformanceRankReports />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/exams/rank-merit"
        element={
          <ProtectedRouteWithLayout>
            <PerformanceRankReports />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/exams/promotion-management"
        element={
          <ProtectedRouteWithLayout>
            <StudentPromotion />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/exams/re-exams"
        element={
          <ProtectedRouteWithLayout>
            <ReExamSupplementaryManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/exams/certificates"
        element={
          <ProtectedRouteWithLayout>
            <ReportCardCertificateManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/exams/reports"
        element={
          <ProtectedRouteWithLayout>
            <PerformanceRankReports />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route path="/fees" element={<Navigate to="/fees/dashboard" replace />} />
      
      <Route
        path="/fees/dashboard"
        element={
          <ProtectedRouteWithLayout>
            <FinanceDashboard />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/master-setup"
        element={
          <ProtectedRouteWithLayout>
            <FeeMasterSetup />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/setup"
        element={
          <ProtectedRouteWithLayout>
            <FeeMasterSetup />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/head"
        element={
          <ProtectedRouteWithLayout>
            <FeeHeadManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/structure"
        element={
          <ProtectedRouteWithLayout>
            <FeeStructureManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/class-setup"
        element={
          <ProtectedRouteWithLayout>
            <ClassWiseFeeSetup />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/allocation"
        element={
          <ProtectedRouteWithLayout>
            <StudentFeeAllocation />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/collect"
        element={
          <ProtectedRouteWithLayout>
            <FeeCollection />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/online-payment"
        element={
          <ProtectedRouteWithLayout>
            <OnlinePaymentManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/receipts"
        element={
          <ProtectedRouteWithLayout>
            <ReceiptManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/discounts"
        element={
          <ProtectedRouteWithLayout>
            <FeeDiscountManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/scholarships"
        element={
          <ProtectedRouteWithLayout>
            <ScholarshipManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/fines"
        element={
          <ProtectedRouteWithLayout>
            <FinePenaltyManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/installments"
        element={
          <ProtectedRouteWithLayout>
            <InstallmentManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/refunds"
        element={
          <ProtectedRouteWithLayout>
            <FeeRefundManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/due-fees"
        element={
          <ProtectedRouteWithLayout>
            <DueFeeManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/transport"
        element={
          <ProtectedRouteWithLayout>
            <TransportFeeManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/hostel"
        element={
          <ProtectedRouteWithLayout>
            <HostelFeeManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/other-income"
        element={
          <ProtectedRouteWithLayout>
            <OtherIncomeManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/expenses"
        element={
          <ProtectedRouteWithLayout>
            <ExpenseManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/vendor-payments"
        element={
          <ProtectedRouteWithLayout>
            <VendorPaymentManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/accounting"
        element={
          <ProtectedRouteWithLayout>
            <AccountingManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/bank"
        element={
          <ProtectedRouteWithLayout>
            <BankManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/cash-book"
        element={
          <ProtectedRouteWithLayout>
            <CashBook />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/budget"
        element={
          <ProtectedRouteWithLayout>
            <BudgetManagement />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/fees/reports"
        element={
          <ProtectedRouteWithLayout>
            <FinanceReports />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/library"
        element={<Navigate to="/library/dashboard" replace />}
      />

      <Route
        path="/library/dashboard"
        element={
          <ProtectedRouteWithLayout>
            <LibraryDashboard />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/library/settings"
        element={
          <ProtectedRouteWithLayout>
            <LibrarySettingsManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/library/sub-categories"
        element={
          <ProtectedRouteWithLayout>
            <BookSubCategoryManager />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/library/categories"
        element={
          <ProtectedRouteWithLayout>
            <BookCategoryManager />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/library/authors-publishers"
        element={
          <ProtectedRouteWithLayout>
            <AuthorPublisherManager />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/library/books"
        element={
          <ProtectedRouteWithLayout>
            <BookInventoryManager />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/library/racks"
        element={
          <ProtectedRouteWithLayout>
            <RackShelfManager />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/library/members"
        element={
          <ProtectedRouteWithLayout>
            <LibraryMemberManager />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/library/transactions"
        element={
          <ProtectedRouteWithLayout>
            <BookIssueReturnManager />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/library/reservations"
        element={
          <ProtectedRouteWithLayout>
            <BookReservationManager />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/library/fines"
        element={
          <ProtectedRouteWithLayout>
            <FineCollectionManager />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/library/reports"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Library Reports & Analytics</h1>
              <p className="text-gray-600">Generate reports for popular books, checkout histories, overdue logs, and collected fines.</p>
            </div>
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/transport"
        element={<Navigate to="/transport/dashboard" replace />}
      />

      <Route
        path="/transport/dashboard"
        element={
          <ProtectedRouteWithLayout>
            <TransportPlaceholder />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/transport/vehicle-types"
        element={
          <ProtectedRouteWithLayout>
            <VehicleTypeManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/transport/vehicles"
        element={
          <ProtectedRouteWithLayout>
            <VehicleManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/transport/drivers"
        element={
          <ProtectedRouteWithLayout>
            <DriverManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/transport/routes"
        element={
          <ProtectedRouteWithLayout>
            <RouteManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/transport/stops"
        element={
          <ProtectedRouteWithLayout>
            <StopManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/transport/allocations"
        element={
          <ProtectedRouteWithLayout>
            <AllocationManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/transport/trips"
        element={
          <ProtectedRouteWithLayout>
            <TripManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/transport/attendance"
        element={
          <ProtectedRouteWithLayout>
            <TransportAttendanceManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/transport/gps"
        element={
          <ProtectedRouteWithLayout>
            <GpsTrackingManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/transport/fuel"
        element={
          <ProtectedRouteWithLayout>
            <FuelManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/transport/maintenance"
        element={
          <ProtectedRouteWithLayout>
            <MaintenanceManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/transport/documents"
        element={
          <ProtectedRouteWithLayout>
            <DocumentManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/transport/fees"
        element={
          <ProtectedRouteWithLayout>
            <TransportFeeManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/transport/complaints"
        element={
          <ProtectedRouteWithLayout>
            <ComplaintManager />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/transport/notifications"
        element={
          <ProtectedRouteWithLayout>
            <TransportPlaceholder />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/transport/reports"
        element={
          <ProtectedRouteWithLayout>
            <TransportPlaceholder />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/hostel"
        element={<Navigate to="/hostel/dashboard" replace />}
      />

      <Route
        path="/hostel/dashboard"
        element={
          <ProtectedRouteWithLayout>
            <HostelPlaceholder />
          </ProtectedRouteWithLayout>
        }
      />

      <Route
        path="/hostel/admission"
        element={
          <ProtectedRouteWithLayout>
            <HostelAdmissionManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/hostel/allocation"
        element={
          <ProtectedRouteWithLayout>
            <HostelRoomBedManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/hostel/fees"
        element={
          <ProtectedRouteWithLayout>
            <HostelFeeManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/hostel/attendance"
        element={
          <ProtectedRouteWithLayout>
            <HostelAttendanceManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/hostel/mess"
        element={
          <ProtectedRouteWithLayout>
            <HostelMessManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/hostel/leaves"
        element={
          <ProtectedRouteWithLayout>
            <OutpassManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/hostel/outpasses"
        element={
          <ProtectedRouteWithLayout>
            <OutpassManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/hostel/complaints"
        element={
          <ProtectedRouteWithLayout>
            <HostelComplaintManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/hostel/inventory"
        element={
          <ProtectedRouteWithLayout>
            <HostelInventoryManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/hostel/visitors"
        element={
          <ProtectedRouteWithLayout>
            <HostelVisitorManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/hostel/staff"
        element={
          <ProtectedRouteWithLayout>
            <HostelStaffManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/hostel/rules"
        element={
          <ProtectedRouteWithLayout>
            <HostelDisciplineManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/hostel/medical"
        element={
          <ProtectedRouteWithLayout>
            <HostelHealthManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/hostel/portal"
        element={
          <ProtectedRouteWithLayout>
            <HostelPortalManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/hostel/alerts"
        element={
          <ProtectedRouteWithLayout>
            <HostelAlertsManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/hostel/reports"
        element={
          <ProtectedRouteWithLayout>
            <HostelPlaceholder />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/hostel/rbac"
        element={
          <ProtectedRouteWithLayout>
            <HostelPlaceholder />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/communication/internal-messaging"
        element={
          <ProtectedRouteWithLayout>
            <InternalMessagingManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/communication/announcements"
        element={
          <ProtectedRouteWithLayout>
            <AnnouncementsManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/communication/parent-teacher"
        element={
          <ProtectedRouteWithLayout>
            <ParentTeacherHub />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/communication/gateway"
        element={
          <ProtectedRouteWithLayout>
            <SMSEmailGateway />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/communication/push-notifications"
        element={
          <ProtectedRouteWithLayout>
            <PushNotificationCenter />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/communication/homework-alerts"
        element={
          <ProtectedRouteWithLayout>
            <HomeworkAlertManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/communication/exam-alerts"
        element={
          <ProtectedRouteWithLayout>
            <ExamResultAnnouncer />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/communication/attendance-alerts"
        element={
          <ProtectedRouteWithLayout>
            <AttendanceAlertManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/communication/timetable-alerts"
        element={
          <ProtectedRouteWithLayout>
            <TimetableAlertManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/communication/circulars"
        element={
          <ProtectedRouteWithLayout>
            <CircularBoard />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/communication/event-alerts"
        element={
          <ProtectedRouteWithLayout>
            <EventCalendarNotifications />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/communication/fee-reminders"
        element={
          <ProtectedRouteWithLayout>
            <FeeReminderManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/communication/complaints-grievances"
        element={
          <ProtectedRouteWithLayout>
            <ComplaintGrievanceDesk />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/communication/staff-chat"
        element={
          <ProtectedRouteWithLayout>
            <StaffHRCommunicationHub />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/communication/forums"
        element={
          <ProtectedRouteWithLayout>
            <DiscussionForums />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/communication/polls"
        element={
          <ProtectedRouteWithLayout>
            <PollsSurveys />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/communication/emergency"
        element={
          <ProtectedRouteWithLayout>
            <EmergencyBroadcast />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/communication/alumni"
        element={
          <ProtectedRouteWithLayout>
            <AlumniNetworkLinker />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/communication/delivery-reports"
        element={
          <ProtectedRouteWithLayout>
            <MessageDeliveryAnalytics />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/communication/analytics"
        element={
          <ProtectedRouteWithLayout>
            <MessageDeliveryAnalytics />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/communication/logs"
        element={
          <ProtectedRouteWithLayout>
            <CommunicationAuditTrails />
          </ProtectedRouteWithLayout>
        }
      />

      {/* Examination & Result Management */}
      <Route
        path="/examinations"
        element={<Navigate to="/exams/dashboard" replace />}
      />
      <Route
        path="/exams/dashboard"
        element={
          <ProtectedRouteWithLayout>
            <ExamDashboard />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/exams/types"
        element={
          <ProtectedRouteWithLayout>
            <ExamTypeManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/exams/setup"
        element={
          <ProtectedRouteWithLayout>
            <ExaminationManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/exams/schedule"
        element={
          <ProtectedRouteWithLayout>
            <ExamScheduleManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/exams/subject-mapping"
        element={
          <ProtectedRouteWithLayout>
            <SubjectExamMapping />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/exams/room-allocation"
        element={
          <ProtectedRouteWithLayout>
            <ExamSeatingManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/exams/seating-arrangement"
        element={
          <ProtectedRouteWithLayout>
            <ExamSeatingManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/exams/admit-cards"
        element={
          <ProtectedRouteWithLayout>
            <AdmitCardInvigilatorManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/exams/invigilators"
        element={
          <ProtectedRouteWithLayout>
            <AdmitCardInvigilatorManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/exams/marks-entry"
        element={
          <ProtectedRouteWithLayout>
            <MarksEntryVerification />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/exams/marks-verification"
        element={
          <ProtectedRouteWithLayout>
            <MarksVerificationAudit />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/exams/grades"
        element={
          <ProtectedRouteWithLayout>
            <GradeResultProcessor />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/exams/result-processing"
        element={
          <ProtectedRouteWithLayout>
            <ResultProcessingEngine />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/exams/report-card"
        element={
          <ProtectedRouteWithLayout>
            <ReportCardCertificateManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/exams/performance-analysis"
        element={
          <ProtectedRouteWithLayout>
            <PerformanceRankReports />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/exams/rank-merit"
        element={
          <ProtectedRouteWithLayout>
            <PerformanceRankReports />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/exams/promotion-management"
        element={
          <ProtectedRouteWithLayout>
            <StudentPromotion />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/exams/re-exams"
        element={
          <ProtectedRouteWithLayout>
            <ReExamSupplementaryManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/exams/certificates"
        element={
          <ProtectedRouteWithLayout>
            <ReportCardCertificateManager />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/exams/reports"
        element={
          <ProtectedRouteWithLayout>
            <PerformanceRankReports />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/reports/students"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Student Reports</h1>
              <p className="text-gray-600">Generate student reports</p>
            </div>
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/admin/settings"
        element={
          <ProtectedRouteWithLayout>
            <SchoolSettings />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/admin/users"
        element={
          <ProtectedRouteWithLayout>
            <UserManagement />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/admin/roles"
        element={
          <ProtectedRouteWithLayout permission="view_roles">
            <RolePermissionPage />
          </ProtectedRouteWithLayout>
        }
      />

      {/* ── Subscription Module ── */}
      <Route
        path="/subscription/plans"
        element={
          <ProtectedRouteWithLayout>
            <SubscriptionPlansPage />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/subscription/management"
        element={
          <ProtectedRouteWithLayout>
            <SubscriptionManagementPage />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/subscription/my-plan"
        element={
          <ProtectedRouteWithLayout>
            <MySubscriptionPage />
          </ProtectedRouteWithLayout>
        }
      />

      {/* Subscription alias routes — matches any sidebar menu_route pointing to /admin/subscription* */}
      <Route
        path="/admin/subscriptions"
        element={
          <ProtectedRouteWithLayout>
            <SubscriptionManagementPage />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/admin/subscription-plans"
        element={
          <ProtectedRouteWithLayout>
            <SubscriptionPlansPage />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/admin/my-subscription"
        element={
          <ProtectedRouteWithLayout>
            <MySubscriptionPage />
          </ProtectedRouteWithLayout>
        }
      />

      {/* ── API Management & Developer Portal ── */}
      <Route
        path="/admin/api"
        element={
          <ProtectedRouteWithLayout>
            <ApiManagementPage />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/api/management"
        element={
          <ProtectedRouteWithLayout>
            <ApiManagementPage />
          </ProtectedRouteWithLayout>
        }
      />

      {/* ── System Audit & Activity Logs ── */}
      <Route
        path="/admin/logs"
        element={
          <ProtectedRouteWithLayout>
            <SystemLogsPage />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/admin/system-logs"
        element={
          <ProtectedRouteWithLayout>
            <SystemLogsPage />
          </ProtectedRouteWithLayout>
        }
      />

      {/* ── Database Management & Backup Utility ── */}
      <Route
        path="/admin/database"
        element={
          <ProtectedRouteWithLayout>
            <DatabaseManagementPage />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/admin/backups"
        element={
          <ProtectedRouteWithLayout>
            <DatabaseManagementPage />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/admin/backup"
        element={
          <ProtectedRouteWithLayout>
            <DatabaseManagementPage />
          </ProtectedRouteWithLayout>
        }
      />

      {/* ── Security & Authentication Center ── */}
      <Route
        path="/admin/security"
        element={
          <ProtectedRouteWithLayout>
            <SecurityManagementPage />
          </ProtectedRouteWithLayout>
        }
      />
      <Route
        path="/security/settings"
        element={
          <ProtectedRouteWithLayout>
            <SecurityManagementPage />
          </ProtectedRouteWithLayout>
        }
      />

      {/* END OF ROUTES */}
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <SessionLockModal />
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;