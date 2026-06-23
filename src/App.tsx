import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import StudentView from './pages/StudentView';
import SchoolRegistration from './pages/SchoolRegistration';
import StudentRegistration from './pages/StudentRegistration';
import StudentPromotion from './pages/StudentPromotion';
import SectionManager from './components/SectionManager';
import SubjectManager from './components/SubjectManager';
import TimetableGenerator from './components/TimetableGenerator';
import TeacherManager from './pages/TeacherManager';
import ClassTeacherManager from './components/ClassTeacherManager';
import HolidayManager from './components/HolidayManager';
import WeekoffManager from './components/WeekoffManager';
import LibrarySettingsManager from './components/LibrarySettingsManager';
import BookCategoryManager from './components/BookCategoryManager';
import BookSubCategoryManager from './components/BookSubCategoryManager';
import AuthorPublisherManager from './components/AuthorPublisherManager';
import BookInventoryManager from './components/BookInventoryManager';
import RackShelfManager from './components/RackShelfManager';
import LibraryMemberManager from './components/LibraryMemberManager';
import BookIssueReturnManager from './components/BookIssueReturnManager';
import BookReservationManager from './components/BookReservationManager';
import FineCollectionManager from './components/FineCollectionManager';
import LibraryDashboard from './components/LibraryDashboard';
import TransportPlaceholder from './components/TransportPlaceholder';
import VehicleManager from './components/VehicleManager';
import VehicleTypeManager from './components/VehicleTypeManager';
import DriverManager from './components/DriverManager';
import RouteManager from './components/RouteManager';
import StopManager from './components/StopManager';
import TripManager from './components/TripManager';
import FuelManager from './components/FuelManager';
import ComplaintManager from './components/ComplaintManager';
import DocumentManager from './components/DocumentManager';
import MaintenanceManager from './components/MaintenanceManager';
import AllocationManager from './components/AllocationManager';
import TransportAttendanceManager from './components/TransportAttendanceManager';
import GpsTrackingManager from './components/GpsTrackingManager';
import TransportFeeManager from './components/TransportFeeManager';
import HostelPlaceholder from './components/HostelPlaceholder';
import HostelAdmissionManager from './components/HostelAdmissionManager';
import HostelAllocationManager from './components/HostelAllocationManager';
import HostelMessManager from './components/HostelMessManager';
import OutpassManager from './components/OutpassManager';
import HostelComplaintManager from './components/HostelComplaintManager';
import HostelInventoryManager from './components/HostelInventoryManager';
import HostelVisitorManager from './components/HostelVisitorManager';
import HostelStaffManager from './components/HostelStaffManager';
import HostelDisciplineManager from './components/HostelDisciplineManager';
import HostelHealthManager from './components/HostelHealthManager';
import HostelPortalManager from './components/HostelPortalManager';
import HostelAlertsManager from './components/HostelAlertsManager';
import HostelAttendanceManager from './components/HostelAttendanceManager';
import HostelFeeManager from './components/HostelFeeManager';
import HostelRoomBedManager from './components/HostelRoomBedManager';





import Layout from './components/Layout';
import SchoolSettings from './pages/SchoolSettings';
import AcademicCalendarPage from './pages/AcademicCalendarPage';

// Protected route wrapper with Layout (sidebar will be shown)
const ProtectedRouteWithLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
        path="/students/promotion"
        element={
          <ProtectedRouteWithLayout>
            <StudentPromotion />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/students/id-cards"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Student ID Cards</h1>
              <p className="text-gray-600">Generate student ID cards</p>
            </div>
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/teachers/all"
        element={
          <ProtectedRouteWithLayout>
            <TeacherManager />
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/teachers/add"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Add New Teacher</h1>
              <p className="text-gray-600">Teacher registration form will appear here...</p>
            </div>
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/teachers/attendance"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Staff Attendance</h1>
              <p className="text-gray-600">Mark staff attendance</p>
            </div>
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/teachers/salary"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Salary Management</h1>
              <p className="text-gray-600">Manage teacher salaries</p>
            </div>
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/teachers/leave"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Leave Management</h1>
              <p className="text-gray-600">Manage teacher leaves</p>
            </div>
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/attendance/mark"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Mark Attendance</h1>
              <p className="text-gray-600">Mark student attendance</p>
            </div>
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/attendance/report"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Attendance Report</h1>
              <p className="text-gray-600">View attendance reports</p>
            </div>
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
        path="/exams/schedule"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Exam Schedule</h1>
              <p className="text-gray-600">View and manage exam schedules</p>
            </div>
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/exams/create"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Create Exam</h1>
              <p className="text-gray-600">Create new examination</p>
            </div>
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/exams/marks-entry"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Marks Entry</h1>
              <p className="text-gray-600">Enter student marks</p>
            </div>
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/exams/report-card"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Generate Report Card</h1>
              <p className="text-gray-600">Generate student report cards</p>
            </div>
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/fees/structure"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Fee Structure</h1>
              <p className="text-gray-600">Manage fee structures</p>
            </div>
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/fees/collect"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Collect Fees</h1>
              <p className="text-gray-600">Collect student fees</p>
            </div>
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/fees/reports"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Fee Reports</h1>
              <p className="text-gray-600">View fee collection reports</p>
            </div>
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
        path="/communication/notices"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Send Notices</h1>
              <p className="text-gray-600">Send notices to students and parents</p>
            </div>
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/communication/events"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Events Calendar</h1>
              <p className="text-gray-600">Manage school events</p>
            </div>
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
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">User Management</h1>
              <p className="text-gray-600">Manage system users</p>
            </div>
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/admin/roles"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Role & Permissions</h1>
              <p className="text-gray-600">Manage roles and permissions</p>
            </div>
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
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;