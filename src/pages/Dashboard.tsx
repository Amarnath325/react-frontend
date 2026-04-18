import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

interface DashboardStats {
  total_students: number;
  total_teachers: number;
  total_classes: number;
  total_parents: number;
  monthly_revenue: number;
  attendance_today: number;
  pending_fees: number;
  upcoming_exams: number;
}

interface RecentActivity {
  id: number;
  type: string;
  title: string;
  description: string;
  created_at: string;
}

interface UpcomingEvent {
  id: number;
  title: string;
  date: string;
  type: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    total_students: 0,
    total_teachers: 0,
    total_classes: 0,
    total_parents: 0,
    monthly_revenue: 0,
    attendance_today: 0,
    pending_fees: 0,
    upcoming_exams: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Use the new dashboard endpoint (without school-admin prefix)
      const statsResponse = await api.get('/dashboard');
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      const activitiesResponse = await api.get('/dashboard/recent-activities');
      if (activitiesResponse.data.success) {
        setRecentActivities(activitiesResponse.data.data);
      }

      const eventsResponse = await api.get('/dashboard/upcoming-events');
      if (eventsResponse.data.success) {
        setUpcomingEvents(eventsResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({
        total_students: 0,
        total_teachers: 0,
        total_classes: 0,
        total_parents: 0,
        monthly_revenue: 0,
        attendance_today: 0,
        pending_fees: 0,
        upcoming_exams: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Students',
      value: stats.total_students,
      icon: '👨‍🎓',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total Teachers',
      value: stats.total_teachers,
      icon: '👩‍🏫',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
    },
    {
      title: 'Total Classes',
      value: stats.total_classes,
      icon: '📚',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
    },
    {
      title: 'Total Parents',
      value: stats.total_parents,
      icon: '👪',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
    },
    {
      title: 'Monthly Revenue',
      value: `₹${stats.monthly_revenue.toLocaleString()}`,
      icon: '💰',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
    },
    {
      title: "Today's Attendance",
      value: `${stats.attendance_today}%`,
      icon: '📊',
      bgColor: 'bg-indigo-100',
      textColor: 'text-indigo-600',
    },
    {
      title: 'Pending Fees',
      value: `₹${stats.pending_fees.toLocaleString()}`,
      icon: '💳',
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
    },
    {
      title: 'Upcoming Exams',
      value: stats.upcoming_exams,
      icon: '📝',
      bgColor: 'bg-pink-100',
      textColor: 'text-pink-600',
    },
  ];

  const quickActions = [
    { name: 'Add Student', icon: '👨‍🎓', path: '/students/add', color: 'bg-blue-500' },
    { name: 'Add Teacher', icon: '👩‍🏫', path: '/teachers/add', color: 'bg-green-500' },
    { name: 'Create Class', icon: '📚', path: '/classes/add', color: 'bg-purple-500' },
    { name: 'Mark Attendance', icon: '✓', path: '/attendance/mark', color: 'bg-orange-500' },
    { name: 'Create Exam', icon: '📝', path: '/exams/create', color: 'bg-pink-500' },
    { name: 'Collect Fees', icon: '💰', path: '/fees/collect', color: 'bg-yellow-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-8 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {user?.first_name || 'Admin'}! 👋
        </h2>
        <p className="text-blue-100">
          Here's what's happening with your school today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center text-2xl`}>
                {card.icon}
              </div>
              <span className={`text-2xl font-bold ${card.textColor}`}>{card.value}</span>
            </div>
            <h3 className="text-gray-600 font-medium">{card.title}</h3>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className="bg-white rounded-xl shadow-md p-4 text-center hover:shadow-lg transition transform hover:-translate-y-1"
            >
              <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center text-white text-xl mx-auto mb-3`}>
                {action.icon}
              </div>
              <span className="text-sm font-medium text-gray-700">{action.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Activities</h3>
            <button className="text-blue-600 text-sm hover:text-blue-700">View All →</button>
          </div>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                    {activity.type === 'student' && '👨‍🎓'}
                    {activity.type === 'teacher' && '👩‍🏫'}
                    {activity.type === 'fee' && '💰'}
                    {activity.type === 'exam' && '📝'}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium">{activity.title}</p>
                    <p className="text-gray-500 text-sm">{activity.description}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recent activities</p>
                <p className="text-sm mt-2">Start by adding students or teachers</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Upcoming Events</h3>
            <button className="text-blue-600 text-sm hover:text-blue-700">View Calendar →</button>
          </div>
          <div className="space-y-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 pb-4 border-b border-gray-100 last:border-0">
                  <div className="text-center min-w-[60px]">
                    <div className="text-2xl font-bold text-gray-800">
                      {new Date(event.date).getDate()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleString('default', { month: 'short' })}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium">{event.title}</p>
                    <p className="text-gray-500 text-sm">{event.type}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No upcoming events</p>
                <p className="text-sm mt-2">Create exams or events from the menu</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Getting Started Guide (for new schools) */}
      {stats.total_students === 0 && (
        <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">🚀 Getting Started</h3>
          <p className="text-gray-600 mb-4">Complete these steps to set up your school:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">1</div>
              <span className="text-gray-700">Add Classes</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">2</div>
              <span className="text-gray-700">Add Subjects</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">3</div>
              <span className="text-gray-700">Add Teachers</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">4</div>
              <span className="text-gray-700">Add Students</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;