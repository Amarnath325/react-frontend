import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="space-y-5 sm:space-y-6">


      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-150/70 p-3.5 sm:p-4 hover:shadow-md transition cursor-pointer flex flex-col justify-between animate-fadeIn"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 ${card.bgColor} rounded-lg flex items-center justify-center text-lg sm:text-xl`}>
                {card.icon}
              </div>
              <span className={`text-base sm:text-lg font-extrabold ${card.textColor}`}>{card.value}</span>
            </div>
            <h3 className="text-gray-500 font-semibold text-xs sm:text-[13px] tracking-wide">{card.title}</h3>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-3 tracking-wide uppercase">Quick Actions</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className="bg-white rounded-xl shadow-sm border border-gray-150/70 p-3 text-center hover:shadow-md transition transform hover:-translate-y-0.5 active:scale-98"
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 ${action.color} rounded-full flex items-center justify-center text-white text-base sm:text-lg mx-auto mb-2`}>
                {action.icon}
              </div>
              <span className="text-xs font-semibold text-gray-700">{action.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Activities and Events Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-150/70 p-4 sm:p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm sm:text-base font-bold text-gray-800">Recent Activities</h3>
            <button className="text-blue-600 text-xs font-semibold hover:text-blue-700">View All →</button>
          </div>
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-2.5 pb-2.5 border-b border-gray-100 last:border-0">
                  <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                    {activity.type === 'student' && '👨‍🎓'}
                    {activity.type === 'teacher' && '👩‍🏫'}
                    {activity.type === 'fee' && '💰'}
                    {activity.type === 'exam' && '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 font-semibold text-xs sm:text-sm truncate">{activity.title}</p>
                    <p className="text-gray-500 text-[11px] sm:text-xs line-clamp-1">{activity.description}</p>
                    <p className="text-gray-400 text-[10px] mt-0.5">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm font-semibold">No recent activities</p>
                <p className="text-xs text-gray-400 mt-1">Start by adding students or teachers</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-150/70 p-4 sm:p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm sm:text-base font-bold text-gray-800">Upcoming Events</h3>
            <button className="text-blue-600 text-xs font-semibold hover:text-blue-700">View Calendar →</button>
          </div>
          <div className="space-y-3">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-2.5 pb-2.5 border-b border-gray-100 last:border-0">
                  <div className="text-center min-w-[50px] bg-slate-50 py-1 rounded-lg">
                    <div className="text-base sm:text-lg font-bold text-gray-800 leading-none">
                      {new Date(event.date).getDate()}
                    </div>
                    <div className="text-[9px] text-gray-400 font-semibold uppercase mt-0.5">
                      {new Date(event.date).toLocaleString('default', { month: 'short' })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 font-semibold text-xs sm:text-sm truncate">{event.title}</p>
                    <p className="text-gray-400 text-[10px] sm:text-[11px] mt-0.5">{event.type}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm font-semibold">No upcoming events</p>
                <p className="text-xs text-gray-400 mt-1">Create exams or events from the menu</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Getting Started Guide (for new schools) */}
      {stats.total_students === 0 && (
        <div className="mt-5 sm:mt-6 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-xl p-4 sm:p-5 border border-green-200/60">
          <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-1">🚀 Getting Started</h3>
          <p className="text-xs text-gray-500 mb-3">Complete these steps to set up your school:</p>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-green-150 shadow-sm">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">1</div>
              <span className="text-xs font-semibold text-gray-700">Add Classes</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-green-150 shadow-sm">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">2</div>
              <span className="text-gray-700 text-xs font-semibold">Add Subjects</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-green-150 shadow-sm">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">3</div>
              <span className="text-gray-700 text-xs font-semibold">Add Teachers</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-green-150 shadow-sm">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">4</div>
              <span className="text-gray-700 text-xs font-semibold">Add Students</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;