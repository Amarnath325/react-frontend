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
import Layout from './components/Layout';
import SchoolSettings from './pages/SchoolSettings';

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
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Student Promotion</h1>
              <p className="text-gray-600">Promote students to next class</p>
            </div>
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
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">All Teachers</h1>
              <p className="text-gray-600">Teacher list will appear here...</p>
            </div>
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
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Classes & Sections</h1>
              <p className="text-gray-600">Manage classes and sections</p>
            </div>
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/academic/subjects"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Subjects Management</h1>
              <p className="text-gray-600">Manage subjects</p>
            </div>
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/academic/timetable"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Timetable Generator</h1>
              <p className="text-gray-600">Generate class timetables</p>
            </div>
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
        path="/library/books"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Library Books</h1>
              <p className="text-gray-600">Manage library books</p>
            </div>
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/library/issue"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Issue Book</h1>
              <p className="text-gray-600">Issue books to students</p>
            </div>
          </ProtectedRouteWithLayout>
        }
      />
      
      <Route
        path="/transport/routes"
        element={
          <ProtectedRouteWithLayout>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Transport Routes</h1>
              <p className="text-gray-600">Manage transport routes</p>
            </div>
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