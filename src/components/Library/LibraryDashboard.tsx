import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface LibraryStats {
  total_books: number;
  total_members: number;
  active_checkouts: number;
  overdue_checkouts: number;
  pending_reservations: number;
  active_holds: number;
  total_fines_accrued: number;
  total_fines_collected: number;
  total_fines_waived: number;
  pending_fines: number;
}

interface ActivityItem {
  type: 'issue' | 'return' | 'reservation' | 'fine_payment';
  icon: string;
  title: string;
  description: string;
  date: string;
}

interface DashboardData {
  stats: LibraryStats;
  recent_activities: ActivityItem[];
}

const LibraryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/school/library/dashboard');
      if (response.data.success) {
        setData(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to fetch dashboard data');
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error(error.response?.data?.message || 'Server error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-indigo-650 border-t-transparent"></div>
        <p className="mt-3 text-[10px] font-semibold text-slate-500 tracking-wide">Loading dashboard...</p>
      </div>
    );
  }

  const stats = data?.stats || {
    total_books: 0,
    total_members: 0,
    active_checkouts: 0,
    overdue_checkouts: 0,
    pending_reservations: 0,
    active_holds: 0,
    total_fines_accrued: 0,
    total_fines_collected: 0,
    total_fines_waived: 0,
    pending_fines: 0,
  };

  const recentActivities = data?.recent_activities || [];

  const statCards = [
    {
      title: 'Total Books',
      value: stats.total_books,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      bgColor: 'text-blue-600 bg-blue-50 border-blue-100',
      path: '/library/books',
    },
    {
      title: 'Active Members',
      value: stats.total_members,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bgColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      path: '/library/members',
    },
    {
      title: 'Active Checkouts',
      value: stats.active_checkouts,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4-4m-4 4l4 4" />
        </svg>
      ),
      bgColor: 'text-violet-600 bg-violet-50 border-violet-100',
      path: '/library/transactions',
    },
    {
      title: 'Overdue Books',
      value: stats.overdue_checkouts,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      bgColor: stats.overdue_checkouts > 0 ? 'text-rose-600 bg-rose-50 border-rose-100 animate-pulse' : 'text-slate-500 bg-slate-50 border-slate-150',
      path: '/library/transactions?status=overdue',
    },
    {
      title: 'Book Reservations',
      value: stats.pending_reservations,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'text-amber-600 bg-amber-50 border-amber-100',
      path: '/library/reservations',
    },
    {
      title: 'Pending Fines',
      value: `₹${stats.pending_fines}`,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: stats.pending_fines > 0 ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-slate-500 bg-slate-50 border-slate-150',
      path: '/library/fines',
    },
  ];

  const quickLinks = [
    { name: 'Issue & Return Book', route: '/library/transactions', icon: '🔄', color: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100/50' },
    { name: 'Books Inventory', route: '/library/books', icon: '📚', color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/50' },
    { name: 'Library Members', route: '/library/members', icon: '🪪', color: 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100/50' },
    { name: 'Fines & Payments', route: '/library/fines', icon: '💰', color: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100/50' },
    { name: 'Book Reservations', route: '/library/reservations', icon: '⏳', color: 'bg-cyan-50 text-cyan-600 border-cyan-100 hover:bg-cyan-100/50' },
    { name: 'Library Settings', route: '/library/settings', icon: '⚙️', color: 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100/50' },
    { name: 'Sub-Categories', route: '/library/sub-categories', icon: '📂', color: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100/50' },
    { name: 'Book Categories', route: '/library/categories', icon: '🏷️', color: 'bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100/50' },
    { name: 'Authors & Publishers', route: '/library/authors-publishers', icon: '✍️', color: 'bg-lime-50 text-lime-600 border-lime-100 hover:bg-lime-100/50' },
    { name: 'Rack & Shelf Setup', route: '/library/racks', icon: '🗄️', color: 'bg-violet-50 text-violet-600 border-violet-100 hover:bg-violet-100/50' },
    { name: 'Analytics Reports', route: '/library/reports', icon: '📊', color: 'bg-pink-50 text-pink-650 border-pink-100 hover:bg-pink-100/50' },
  ];

  return (
    <div className="space-y-3.5 animate-fadeIn pb-2">
      {/* Super Compact Slim Light Header */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-36 h-36 bg-blue-600/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span>📊</span> Library Management Dashboard
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
              Monitor inventory, circulation checkouts, hold reservations, and collect outstanding fine logs.
            </p>
          </div>
          
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-bold uppercase tracking-wider">
              Librarian Control
            </span>
            <button
              onClick={fetchDashboardData}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-550 border border-slate-200 hover:text-slate-800 transition-all duration-150 active:scale-95 shadow-xs"
              title="Refresh logs"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.228 9H18.01" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Compact Light Stats Grid (Single row, 6 columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {statCards.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.path)}
            className="group cursor-pointer bg-white border border-slate-200 hover:border-slate-350 rounded-xl p-3 transition-all duration-200 hover:-translate-y-0.5 shadow-xs flex items-center gap-3"
          >
            <div className={`p-2 rounded-lg border ${card.bgColor} transition-transform duration-200 group-hover:scale-105 flex-shrink-0`}>
              {card.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-slate-500 font-bold text-[10px] uppercase tracking-wider leading-none mb-1.5 truncate">
                {card.title}
              </h3>
              <span className="text-sm font-extrabold text-slate-800 leading-none group-hover:text-indigo-600 transition-colors duration-150">
                {card.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Quick Links & Recent Activities Side-by-Side */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        
        {/* Left Side: Quick Links Hub (Span 2) */}
        <div className="xl:col-span-2 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Quick Actions & Modules</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {quickLinks.map((link, index) => (
              <div
                key={index}
                onClick={() => navigate(link.route)}
                className="cursor-pointer bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl p-3 transition-all duration-150 hover:-translate-y-0.5 shadow-xs group flex items-center gap-3"
              >
                <span className={`text-lg p-2 rounded-lg ${link.color} group-hover:scale-110 transition-all duration-250 flex-shrink-0 border`}>
                  {link.icon}
                </span>
                <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 truncate">
                  {link.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Chronological Activity Feed (Max Height with Internal Scroll) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Recent Activity Log</h2>
            <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> Live Feed
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 max-h-[260px] overflow-y-auto custom-scrollbar flex flex-col shadow-xs">
            {recentActivities.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[10px] font-bold text-slate-400">No activity logged yet</p>
                <p className="text-[9px] text-slate-500 mt-0.5">Circulation logs will appear here in real time.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivities.map((act, idx) => {
                  let badgeColor = 'bg-blue-50 text-blue-600 border-blue-100';
                  if (act.type === 'return') badgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                  if (act.type === 'reservation') badgeColor = 'bg-purple-50 text-purple-600 border-purple-100';
                  if (act.type === 'fine_payment') badgeColor = 'bg-amber-50 text-amber-600 border-amber-100';

                  return (
                    <div
                      key={idx}
                      className="relative pl-4 pb-2 border-l border-slate-200 last:border-l-transparent"
                    >
                      {/* Timeline dot */}
                      <span className="absolute -left-1 top-1.5 w-2 h-2 rounded-full bg-white border border-slate-300 flex items-center justify-center z-10 text-[6px]">
                        •
                      </span>
                      
                      <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-150 hover:border-slate-200 rounded-lg p-2 transition-colors duration-150">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className={`px-1 py-0.2 rounded border text-[8px] font-bold uppercase tracking-wider ${badgeColor}`}>
                            {act.icon} {act.title}
                          </span>
                          <span className="text-[8px] text-slate-400 whitespace-nowrap font-medium">
                            {act.date}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-normal font-medium">
                          {act.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LibraryDashboard;
