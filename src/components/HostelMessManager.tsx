import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Select from 'react-select';
import {
  Coffee, BarChart2, CreditCard, FileText, AlertTriangle, Check, X,
  Plus, Calendar, User, Clock, ArrowRight, Shield, Award, Edit2, CheckCircle2, ChevronRight, Trash2
} from 'lucide-react';

const customSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    minHeight: '38px',
    height: '38px',
    fontSize: '13px',
    fontWeight: '500',
    borderColor: state.isFocused ? '#6366f1' : '#e2e8f0',
    boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#6366f1' : '#cbd5e1',
    },
    borderRadius: '0.5rem',
    backgroundColor: '#ffffff',
  }),
  valueContainer: (provided: any) => ({
    ...provided,
    height: '38px',
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
  }),
  input: (provided: any) => ({
    ...provided,
    margin: '0px',
    padding: '0px',
    fontSize: '13px',
  }),
  indicatorsContainer: (provided: any) => ({
    ...provided,
    height: '38px',
  }),
  dropdownIndicator: (provided: any) => ({
    ...provided,
    padding: '6px',
  }),
  clearIndicator: (provided: any) => ({
    ...provided,
    padding: '6px',
  }),
  menu: (provided: any) => ({
    ...provided,
    fontSize: '13px',
    zIndex: 9999,
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: '500',
    backgroundColor: state.isSelected 
      ? '#4f46e5' 
      : state.isFocused 
        ? '#f3f4f6' 
        : '#ffffff',
    color: state.isSelected ? '#ffffff' : '#374151',
    '&:active': {
      backgroundColor: '#e5e7eb',
    }
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: '#1f2937',
    fontWeight: '500',
  })
};

const headerSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    minHeight: '36px',
    height: '36px',
    fontSize: '12px',
    fontWeight: '600',
    borderColor: '#e2e8f0',
    boxShadow: 'none',
    backgroundColor: '#f8fafc',
    '&:hover': {
      borderColor: '#cbd5e1',
    },
    width: '240px',
    borderRadius: '0.375rem',
  }),
  valueContainer: (provided: any) => ({
    ...provided,
    height: '36px',
    padding: '0 8px',
    display: 'flex',
    alignItems: 'center',
  }),
  input: (provided: any) => ({
    ...provided,
    margin: '0px',
    padding: '0px',
    fontSize: '12px',
  }),
  indicatorsContainer: (provided: any) => ({
    ...provided,
    height: '36px',
  }),
  dropdownIndicator: (provided: any) => ({
    ...provided,
    padding: '4px',
  }),
  menu: (provided: any) => ({
    ...provided,
    fontSize: '12px',
    zIndex: 9999,
    borderRadius: '0.375rem',
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: state.isSelected 
      ? '#4f46e5' 
      : state.isFocused 
        ? '#f3f4f6' 
        : '#ffffff',
    color: state.isSelected ? '#ffffff' : '#374151',
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: '#374151',
    fontWeight: '600',
  })
};

interface Stats {
  meals_count: number;
  attendance_rate: number;
  bill_due: number;
  leave_days: number;
}

interface AajKaKhana {
  day: string;
  date: string;
  Breakfast: { items: string; timings: string };
  Lunch: { items: string; timings: string };
  Dinner: { items: string; timings: string };
}

interface Notice {
  date: string;
  title: string;
}

interface StudentProfile {
  name: string;
  room: string;
  class: string;
  section: string;
  veg_status: string;
  mess: string;
  batch: string;
}

interface MenuEntry {
  id: number;
  week_number: number;
  day_of_week: string;
  meal_type: string;
  items: string;
  timings: string;
  is_veg: boolean;
}

interface WeekConfig {
  id: number;
  week_number: number;
  name: string;
  start_date: string;
  end_date: string;
}

interface Bill {
  id: number;
  billing_month: string;
  base_charge: number;
  extra_items_charge: number;
  leave_deduction_days: number;
  leave_deduction_amount: number;
  late_fee: number;
  gst_amount: number;
  total_due: number;
  status: 'Paid' | 'Unpaid';
  payment_date: string | null;
}

interface Complaint {
  id: number;
  title: string;
  category: string;
  severity: string;
  description: string;
  status: 'Submitted' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
}

const HostelMessManager: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'attendance' | 'billing' | 'complaints'>('dashboard');

  // API Data states
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ meals_count: 3, attendance_rate: 94, bill_due: 2840, leave_days: 3 });
  const [aajKaKhana, setAajKaKhana] = useState<AajKaKhana | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [menuList, setMenuList] = useState<MenuEntry[]>([]);
  const [selectedMenuDay, setSelectedMenuDay] = useState<string>('Sunday');
  const [selectedWeek, setSelectedWeek] = useState<number>(3); // June 21st, 2026 is in Week 3
  const [attendanceCalendar, setAttendanceCalendar] = useState<Record<string, string>>({});
  const [attendanceStats, setAttendanceStats] = useState({ present_percent: 82, absent_percent: 12, holiday_percent: 6 });
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [pastBills, setPastBills] = useState<Bill[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  // Menu tab sub-view toggles and creation state
  const [menuViewMode, setMenuViewMode] = useState<'daily' | 'history'>('daily');
  const [isAddMenuModalOpen, setIsAddMenuModalOpen] = useState(false);
  const [newMenuWeek, setNewMenuWeek] = useState<number>(3);
  const [newMenuDay, setNewMenuDay] = useState<string>('Sunday');
  const [newMenuMealType, setNewMenuMealType] = useState<string>('Breakfast');
  const [newMenuItems, setNewMenuItems] = useState<string>('');
  const [newMenuTimings, setNewMenuTimings] = useState<string>('7:00 AM - 9:00 AM');
  const [newMenuIsVeg, setNewMenuIsVeg] = useState<boolean>(true);
  const [isCustomWeek, setIsCustomWeek] = useState(false);

  // Weeks configuration state
  const [weeksList, setWeeksList] = useState<WeekConfig[]>([]);
  const [isWeeksModalOpen, setIsWeeksModalOpen] = useState(false);
  const [editingWeekId, setEditingWeekId] = useState<number | null>(null);
  const [weekFormNumber, setWeekFormNumber] = useState<number>(5);
  const [weekFormName, setWeekFormName] = useState<string>('Week 5');
  const [weekFormStartDate, setWeekFormStartDate] = useState<string>('2026-06-29');
  const [weekFormEndDate, setWeekFormEndDate] = useState<string>('2026-07-05');

  // Helper to get week ranges dynamically from backend table
  const getWeekRangeLabel = (weekNum: number) => {
    const config = weeksList.find(w => w.week_number === weekNum);
    if (config) {
      const start = new Date(config.start_date);
      const end = new Date(config.end_date);
      const formatDayMonth = (d: Date) => {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      };
      return `${formatDayMonth(start)} - ${formatDayMonth(end)}`;
    }
    
    // Fallbacks
    if (weekNum === 1) return 'June 1 - 7';
    if (weekNum === 2) return 'June 8 - 14';
    if (weekNum === 3) return 'June 15 - 21';
    if (weekNum === 4) return 'June 22 - 28';
    
    const startDay = (weekNum - 1) * 7 + 1;
    if (startDay > 30) {
      return `Custom Week ${weekNum}`;
    }
    return `June ${startDay} - 30`;
  };

  // Dynamically calculate the weeks list from database weeksList configurations
  const weeksToRender = weeksList.length > 0 
    ? weeksList.map(w => w.week_number).sort((a, b) => a - b)
    : [1, 2, 3, 4];

  // Editing state (warden/admin simulation)
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [editingMenuItems, setEditingMenuItems] = useState<Record<number, string>>({});

  // Leave Form state
  const [leaveFromDate, setLeaveFromDate] = useState('2026-06-21');
  const [leaveToDate, setLeaveToDate] = useState('2026-06-23');
  const [leaveReason, setLeaveReason] = useState('Going home');

  // Complaint Form state
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [newComplaintTitle, setNewComplaintTitle] = useState('');
  const [newComplaintCategory, setNewComplaintCategory] = useState('Food Quality');
  const [newComplaintSeverity, setNewComplaintSeverity] = useState('Medium');
  const [newComplaintDescription, setNewComplaintDescription] = useState('');

  // Initial Data Fetch
  useEffect(() => {
    fetchDashboardData();
    fetchMenuData();
    fetchWeeksData();
    fetchAttendanceData();
    fetchBillingData();
    fetchComplaintsData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/school/hostel/mess/dashboard');
      if (res.data.success) {
        setStats(res.data.data.stats);
        setAajKaKhana(res.data.data.aaj_ka_khana);
        setNotices(res.data.data.notices);
        setProfile(res.data.data.profile);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  };

  const fetchMenuData = async () => {
    try {
      const res = await api.get('/school/hostel/mess/menu');
      if (res.data.success) {
        setMenuList(res.data.data);
        const cache: Record<number, string> = {};
        res.data.data.forEach((m: MenuEntry) => {
          cache[m.id] = m.items;
        });
        setEditingMenuItems(cache);
      }
    } catch (err) {
      console.error('Error fetching weekly menu:', err);
    }
  };

  const fetchWeeksData = async () => {
    try {
      const res = await api.get('/school/hostel/mess/weeks');
      if (res.data.success) {
        setWeeksList(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching weeks configurations:', err);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const res = await api.get('/school/hostel/mess/attendance');
      if (res.data.success) {
        setAttendanceCalendar(res.data.data.calendar);
        setAttendanceStats(res.data.data.stats);
      }
    } catch (err) {
      console.error('Error fetching attendance logs:', err);
    }
  };

  const fetchBillingData = async () => {
    try {
      const res = await api.get('/school/hostel/mess/bills');
      if (res.data.success) {
        setCurrentBill(res.data.data.current);
        setPastBills(res.data.data.history);
      }
    } catch (err) {
      console.error('Error fetching bills statements:', err);
    }
  };

  const fetchComplaintsData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/hostel/mess/complaints');
      if (res.data.success) {
        setComplaints(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching complaints list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMealTypeChange = (type: string) => {
    setNewMenuMealType(type);
    if (type === 'Breakfast') {
      setNewMenuTimings('7:00 AM - 9:00 AM');
    } else if (type === 'Lunch') {
      setNewMenuTimings('12:30 PM - 2:30 PM');
    } else if (type === 'Dinner') {
      setNewMenuTimings('7:30 PM - 9:30 PM');
    }
  };

  const handleAddMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuItems || !newMenuTimings) {
      toast.error('Please fill out all fields.');
      return;
    }
    
    try {
      const res = await api.post('/school/hostel/mess/menu', {
        week_number: newMenuWeek,
        day_of_week: newMenuDay,
        meal_type: newMenuMealType,
        items: newMenuItems,
        timings: newMenuTimings,
        is_veg: newMenuIsVeg
      });
      
      if (res.data.success) {
        toast.success(res.data.message || 'Menu item added successfully!');
        setIsAddMenuModalOpen(false);
        setNewMenuItems('');
        fetchMenuData();
        fetchDashboardData();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to add menu item.');
    }
  };

  const handleDeleteMenuItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return;
    }
    
    try {
      const res = await api.delete(`/school/hostel/mess/menu/${id}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Menu item deleted successfully.');
        fetchMenuData();
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete menu item.');
    }
  };

  const handleWeeksSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weekFormName || !weekFormStartDate || !weekFormEndDate) {
      toast.error('Please fill out all required fields.');
      return;
    }
    
    try {
      let res;
      const payload = {
        week_number: weekFormNumber,
        name: weekFormName,
        start_date: weekFormStartDate,
        end_date: weekFormEndDate
      };

      if (editingWeekId) {
        res = await api.put(`/school/hostel/mess/weeks/${editingWeekId}`, payload);
      } else {
        res = await api.post('/school/hostel/mess/weeks', payload);
      }

      if (res.data.success) {
        toast.success(res.data.message || 'Week details saved successfully!');
        setEditingWeekId(null);
        setWeekFormName('');
        
        // Suggest next defaults
        const nextNum = Math.max(5, ...weeksList.map(w => w.week_number)) + 1;
        setWeekFormNumber(nextNum);
        setWeekFormName(`Week ${nextNum}`);
        
        fetchWeeksData();
        fetchMenuData();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save week configuration.');
    }
  };

  const handleDeleteWeek = async (id: number) => {
    if (!confirm('Are you sure you want to delete this week? All menu meals associated with this week number will also be deleted.')) {
      return;
    }
    
    try {
      const res = await api.delete(`/school/hostel/mess/weeks/${id}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Week and its menu items deleted.');
        fetchWeeksData();
        fetchMenuData();
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete week configuration.');
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/school/hostel/mess/leave', {
        from_date: leaveFromDate,
        to_date: leaveToDate,
        reason: leaveReason
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Leave applied and approved successfully!');
        fetchAttendanceData();
        fetchBillingData();
        fetchDashboardData();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to file leave request.');
    }
  };

  const handleSaveMenuChanges = async () => {
    setLoading(true);
    try {
      const updatePromises = menuList.map(async (m) => {
        const cachedItem = editingMenuItems[m.id];
        if (cachedItem !== m.items) {
          return api.put(`/school/hostel/mess/menu/${m.id}`, { items: cachedItem });
        }
      });

      await Promise.all(updatePromises);
      toast.success('Weekly mess menu saved and synchronized.');
      setIsEditingMenu(false);
      fetchMenuData();
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update mess menu.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayBill = async (id: number, amount: number) => {
    try {
      const res = await api.post(`/school/hostel/mess/bills/${id}/pay`);
      if (res.data.success) {
        toast.success(`Payment of ₹${amount.toLocaleString()} processed successfully!`);
        fetchBillingData();
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Payment transaction failed.');
    }
  };

  const handleFileComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaintTitle || !newComplaintDescription) {
      toast.error('Please fill out all required fields.');
      return;
    }

    try {
      const res = await api.post('/school/hostel/mess/complaints', {
        title: newComplaintTitle,
        category: newComplaintCategory,
        severity: newComplaintSeverity,
        description: newComplaintDescription
      });
      if (res.data.success) {
        toast.success('Complaint filed and queued for warden review.');
        setIsComplaintModalOpen(false);
        setNewComplaintTitle('');
        setNewComplaintDescription('');
        fetchComplaintsData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit complaint.');
    }
  };

  const filteredDayMenu = menuList.filter(
    (m) => m.day_of_week.toLowerCase() === selectedMenuDay.toLowerCase() && m.week_number === selectedWeek
  );  return (
    <div className="flex flex-col gap-2 p-2 md:p-3 text-xs font-sans antialiased text-slate-800 bg-slate-50 min-h-screen">
      
      {/* ── HEADER TITLE ── */}
      <div className="flex items-center justify-between bg-white border border-slate-200 shadow-3xs rounded-xl px-3 py-1.5 gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Coffee className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 tracking-tight">
              Hostel Mess Management
            </h1>
            <div className="text-[10px] font-semibold text-slate-400">
              Shri Ram Boys Hostel · June 2026
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        </div>
      </div>

      {/* ── SUB-TABS NAVIGATION ── */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-1 flex-shrink-0">
        {[
          { id: 'dashboard', name: 'Dashboard', icon: BarChart2 },
          { id: 'menu', name: 'Menu', icon: Coffee },
          { id: 'attendance', name: 'Attendance', icon: Calendar },
          { id: 'billing', name: 'Billing', icon: CreditCard },
          { id: 'complaints', name: 'Complaints', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border transition duration-150 cursor-pointer text-[11px] shadow-3xs ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                  : 'bg-white text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── MAIN TAB SWITCH CONTENT ── */}
      <div className="flex-1 overflow-hidden">
        
        {/* ==================== 1. DASHBOARD TAB ==================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-2">
            
            {/* Stat summaries */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-3xs flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Coffee className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Today's Meals</div>
                  <div className="text-sm font-black text-slate-800">{stats.meals_count}</div>
                  <div className="text-[9px] text-slate-400">B · L · D</div>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-3xs flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Attendance</div>
                  <div className="text-sm font-black text-slate-800">{stats.attendance_rate}%</div>
                  <div className="text-[9px] text-slate-400">Monthly avg</div>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-3xs flex items-center gap-2">
                <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Bill Due</div>
                  <div className="text-sm font-black text-slate-800">₹{stats.bill_due.toLocaleString()}</div>
                  <div className="text-[9px] text-slate-400">By 1 July</div>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-3xs flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Leave Days</div>
                  <div className="text-sm font-black text-slate-800">{stats.leave_days}</div>
                  <div className="text-[9px] text-slate-400">This month</div>
                </div>
              </div>
            </div>

            {/* Aaj ka khana card */}
            <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-3xs">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-2">
                <span className="text-sm text-amber-500">☀️</span>
                <h2 className="text-[11px] font-bold text-slate-800">
                  Aaj Ka Khana — <span className="text-indigo-600">{aajKaKhana?.date || 'Friday, 20 June'}</span>
                </h2>
              </div>
              <div className="space-y-0">
                
                {/* Breakfast */}
                <div className="flex justify-between items-center py-1 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-16 font-bold text-slate-900 text-[10px] uppercase tracking-wide">Breakfast</div>
                    <div>
                      <p className="text-[11px] text-slate-700 font-semibold">
                        {aajKaKhana?.Breakfast.items || 'Poha - Jalebi - Chai'}
                      </p>
                      <p className="text-[9px] text-slate-400 font-semibold">{aajKaKhana?.Breakfast.timings || '7:00 - 9:00 AM'}</p>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[8px] uppercase border border-indigo-200 animate-pulse flex-shrink-0">
                    Now
                  </span>
                </div>

                {/* Lunch */}
                <div className="flex justify-between items-center py-1 border-t border-slate-100 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-16 font-bold text-slate-900 text-[10px] uppercase tracking-wide">Lunch</div>
                    <div>
                      <p className="text-[11px] text-slate-700 font-semibold">
                        {aajKaKhana?.Lunch.items || 'Dal - Sabzi - Rice - Roti'}
                      </p>
                      <p className="text-[9px] text-slate-400 font-semibold">{aajKaKhana?.Lunch.timings || '12:30 - 2:30 PM'}</p>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[8px] uppercase border border-emerald-200 flex-shrink-0">
                    Veg
                  </span>
                </div>

                {/* Dinner */}
                <div className="flex justify-between items-center py-1 border-t border-slate-100 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-16 font-bold text-slate-900 text-[10px] uppercase tracking-wide">Dinner</div>
                    <div>
                      <p className="text-[11px] text-slate-700 font-semibold">
                        {aajKaKhana?.Dinner.items || 'Paneer Butter Masala - Roti'}
                      </p>
                      <p className="text-[9px] text-slate-400 font-semibold">{aajKaKhana?.Dinner.timings || '7:30 - 9:30 PM'}</p>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[8px] uppercase border border-emerald-200 flex-shrink-0">
                    Veg
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Split (Notices & Profile) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              
              {/* Notices Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-3xs flex flex-col">
                <h3 className="text-[10px] font-bold text-slate-900 border-b border-slate-100 pb-1 mb-2 flex items-center gap-1">
                  <span className="text-blue-500 text-xs">🔔</span> Notices & Updates
                </h3>
                <div className="space-y-1.5 flex-1">
                  {notices.map((n, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="font-bold text-slate-500 uppercase whitespace-nowrap bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[9px] flex-shrink-0">
                        {n.date}
                      </span>
                      <p className="text-slate-700 font-semibold leading-snug text-[10px]">
                        {n.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-3xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-2">
                    <h3 className="text-[10px] font-bold text-slate-900 flex items-center gap-1">
                      <span className="text-teal-500 text-xs">👤</span> Student Mess Profile
                    </h3>
                    <div className="flex gap-1">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[8px] font-bold text-slate-600 border border-slate-200">
                        {profile?.veg_status || 'Veg'}
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[8px] font-bold text-slate-600 border border-slate-200">
                        {profile?.mess || 'Mess A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-700 border border-indigo-200 font-black text-[10px] rounded-full flex items-center justify-center shadow-3xs flex-shrink-0">
                      AR
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-[11px] leading-snug">
                        {profile?.name || 'Aditya Rathore'}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-semibold">
                        {profile?.room || 'Room 204'} · {profile?.class || 'B.Tech CSE Y2'} ({profile?.section || 'A'})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile Quick Links */}
                <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className="w-full text-center py-1 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-all cursor-pointer text-[10px]"
                  >
                    View Attendance
                  </button>
                  <button
                    onClick={() => setActiveTab('billing')}
                    className="w-full text-center py-1 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-all cursor-pointer text-[10px]"
                  >
                    View Bill
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. MENU TAB ==================== */}
        {activeTab === 'menu' && (
          <div className="space-y-2">
            
            {/* View Mode Toggle Sub-tabs */}
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-1 shadow-3xs flex-shrink-0">
              <div className="flex gap-1">
                <button
                  onClick={() => setMenuViewMode('daily')}
                  className={`px-2.5 py-0.5 rounded-lg font-bold transition text-[11px] cursor-pointer ${
                    menuViewMode === 'daily'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Daily Schedule
                </button>
                <button
                  onClick={() => setMenuViewMode('history')}
                  className={`px-2.5 py-0.5 rounded-lg font-bold transition text-[11px] cursor-pointer ${
                    menuViewMode === 'history'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Weekly History
                </button>
              </div>
              <div className="text-[10px] font-bold text-slate-400 mr-1">
                June 2026 Menu
              </div>
            </div>

            {menuViewMode === 'daily' ? (
              <>
                {/* Days buttons Mon-Sun */}
                <div className="flex flex-wrap gap-1">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const isSelected = selectedMenuDay.toLowerCase() === day.toLowerCase();
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedMenuDay(day)}
                        className={`px-2.5 py-1 rounded-lg border font-bold text-[11px] transition duration-150 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/10 hover:text-indigo-600'
                        }`}
                      >
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{day.substring(0, 3)}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Menu scheduling main content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                  
                  {/* Daily Menu details */}
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-3xs lg:col-span-2">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-1.5 mb-2 gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-amber-500">☀️</span>
                        <h2 className="text-[11px] font-bold text-slate-900 mr-1">
                          {selectedMenuDay}
                        </h2>
                        
                        {/* Week Selection Dropdown */}
                        <Select
                          value={weeksToRender.map(w => {
                            const rawName = weeksList.find(week => week.week_number === w)?.name;
                            const weekName = rawName && rawName.trim() ? rawName.trim() : `Week ${w}`;
                            return {
                              value: w,
                              label: `${weekName} (${getWeekRangeLabel(w)})`
                            };
                          }).find(opt => opt.value === selectedWeek)}
                          onChange={(opt) => opt && setSelectedWeek(opt.value)}
                          options={weeksToRender.map(w => {
                            const rawName = weeksList.find(week => week.week_number === w)?.name;
                            const weekName = rawName && rawName.trim() ? rawName.trim() : `Week ${w}`;
                            return {
                              value: w,
                              label: `${weekName} (${getWeekRangeLabel(w)})`
                            };
                          })}
                          styles={headerSelectStyles}
                          isSearchable={true}
                          placeholder="Select Week..."
                        />
                      </div>
                      
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            const maxWeek = weeksList.length > 0 
                              ? Math.max(...weeksList.map(w => w.week_number)) 
                              : 4;
                            setWeekFormNumber(maxWeek + 1);
                            setWeekFormName(`Week ${maxWeek + 1}`);
                            
                            const startDay = new Date('2026-06-01');
                            startDay.setDate(startDay.getDate() + maxWeek * 7);
                            const endDay = new Date(startDay);
                            endDay.setDate(endDay.getDate() + 6);
                            
                            setWeekFormStartDate(startDay.toISOString().substring(0, 10));
                            setWeekFormEndDate(endDay.toISOString().substring(0, 10));
                            setEditingWeekId(null);
                            setIsWeeksModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold rounded-lg text-[10px] transition cursor-pointer shadow-3xs"
                        >
                          <Calendar className="w-3 h-3 text-slate-500" /> Manage Weeks
                        </button>
                        <button
                          onClick={() => {
                            setNewMenuWeek(selectedWeek);
                            setNewMenuDay(selectedMenuDay);
                            handleMealTypeChange('Breakfast');
                            setNewMenuItems('');
                            setNewMenuIsVeg(true);
                            setIsAddMenuModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold rounded-lg text-[10px] transition cursor-pointer shadow-3xs"
                        >
                          <Plus className="w-3 h-3 text-slate-500" /> Add Meal
                        </button>
                        <button
                          onClick={() => {
                            if (isEditingMenu) {
                              handleSaveMenuChanges();
                            } else {
                              setIsEditingMenu(true);
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-3xs transition cursor-pointer"
                        >
                          {isEditingMenu ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Save
                            </>
                          ) : (
                            <>
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {filteredDayMenu.length > 0 ? (
                        filteredDayMenu.map((m) => (
                          <div key={m.id} className="flex justify-between items-center py-2.5 first:pt-0 border-t border-slate-100 first:border-0 gap-4">
                            <div className="flex-grow max-w-lg">
                              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">{m.meal_type}</div>
                              {isEditingMenu ? (
                                <div className="flex items-center gap-2 mt-1.5">
                                  <input
                                    type="text"
                                    value={editingMenuItems[m.id] ?? ''}
                                    onChange={(e) => {
                                      setEditingMenuItems({
                                        ...editingMenuItems,
                                        [m.id]: e.target.value
                                      });
                                    }}
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                  <button
                                    onClick={() => handleDeleteMenuItem(m.id)}
                                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer flex-shrink-0 border border-transparent hover:border-rose-100"
                                    title="Delete meal"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-700 font-semibold mt-1 leading-normal">{m.items}</p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0 ml-4 flex items-center gap-3">
                              <span className="text-xs text-slate-400 font-bold block font-mono bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{m.timings}</span>
                              {m.is_veg && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase tracking-wider border border-emerald-200">
                                  Veg
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-slate-400 font-semibold">
                          No menu meals registered for Week {selectedWeek} ({selectedMenuDay}).
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mess timings sidebar card */}
                  <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-3xs flex flex-col justify-start gap-4">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-1 flex items-center gap-2">
                      <span className="text-indigo-550">⏱️</span> Mess Timings & Roster
                    </h3>
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center py-1 text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">☀️ Breakfast</span>
                        <span className="text-slate-500 font-mono font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">7:00 AM - 9:00 AM</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-t border-slate-100 pt-3.5 text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">☀️ Lunch</span>
                        <span className="text-slate-500 font-mono font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">12:30 PM - 2:30 PM</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-t border-slate-100 pt-3.5 text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">🌙 Dinner</span>
                        <span className="text-slate-500 font-mono font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">7:30 PM - 9:30 PM</span>
                      </div>
                    </div>
                  </div>

                </div>
              </>
            ) : (
              // Weekly History View
              <div className="space-y-4">
                {/* Week Selection Bar */}
                <div className="flex flex-wrap gap-1.5 bg-slate-100/60 border border-slate-200 p-1 rounded-xl">
                  {weeksToRender.map((w) => {
                    const rawName = weeksList.find(week => week.week_number === w)?.name;
                    const weekName = rawName && rawName.trim() ? rawName.trim() : `Week ${w}`;
                    const isSelected = selectedWeek === w;
                    return (
                      <button
                        key={w}
                        onClick={() => setSelectedWeek(w)}
                        className={`flex-1 min-w-[100px] flex flex-col items-center py-1 px-2 rounded-lg font-bold border transition duration-150 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/10'
                            : 'bg-white text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-[11px] flex items-center gap-1">
                          {weekName}
                          {w === 3 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" title="Current Week" />
                          )}
                        </span>
                        <span className={`text-[9px] font-semibold mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {getWeekRangeLabel(w)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* History Table Grid */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs overflow-hidden">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 mb-3 flex-shrink-0">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>📅</span> Week {selectedWeek} Complete Menu History
                    </h3>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100">
                      {getWeekRangeLabel(selectedWeek)}
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto custom-scrollbar max-h-[calc(100vh-290px)]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                          <th className="py-2.5 px-3 w-20">Day</th>
                          <th className="py-2.5 px-3 w-1/3">Breakfast (7:00-9:00 AM)</th>
                          <th className="py-2.5 px-3 w-1/3">Lunch (12:30-2:30 PM)</th>
                          <th className="py-2.5 px-3 w-1/3">Dinner (7:30-9:30 PM)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                          const dayMeals = menuList.filter(
                            (m) => m.week_number === selectedWeek && m.day_of_week.toLowerCase() === day.toLowerCase()
                          );
                          
                          const breakfast = dayMeals.find((m) => m.meal_type === 'Breakfast');
                          const lunch = dayMeals.find((m) => m.meal_type === 'Lunch');
                          const dinner = dayMeals.find((m) => m.meal_type === 'Dinner');
                          
                          const isToday = day.toLowerCase() === 'sunday' && selectedWeek === 3; // Mocking Sunday of Week 3 as today
                          
                          return (
                            <tr 
                              key={day} 
                              className={`transition duration-150 ${
                                isToday 
                                  ? 'bg-amber-500/5 hover:bg-amber-500/10 font-bold border-l-2 border-l-amber-500' 
                                  : 'bg-white hover:bg-slate-50/50'
                              }`}
                            >
                              <td className="py-3 px-3 font-bold text-slate-800">
                                <div className="flex items-center gap-1.5">
                                  <span>{day.substring(0, 3)}</span>
                                  {isToday && (
                                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-black border border-amber-250 leading-none">
                                      Today
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-slate-600">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate max-w-[140px] md:max-w-[200px]" title={breakfast?.items || 'Not Scheduled'}>
                                    {breakfast?.items || 'Not Scheduled'}
                                  </span>
                                  {breakfast?.is_veg && (
                                    <span className="text-[9px] px-1.5 py-0.1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold flex-shrink-0">
                                      Veg
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-slate-600">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate max-w-[140px] md:max-w-[200px]" title={lunch?.items || 'Not Scheduled'}>
                                    {lunch?.items || 'Not Scheduled'}
                                  </span>
                                  {lunch?.is_veg && (
                                    <span className="text-[9px] px-1.5 py-0.1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold flex-shrink-0">
                                      Veg
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-slate-600">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate max-w-[140px] md:max-w-[200px]" title={dinner?.items || 'Not Scheduled'}>
                                    {dinner?.items || 'Not Scheduled'}
                                  </span>
                                  {dinner?.is_veg && (
                                    <span className="text-[9px] px-1.5 py-0.1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold flex-shrink-0">
                                      Veg
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

            {/* Create Menu Item Modal Dialog */}
            {isAddMenuModalOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                <div className="bg-white border border-slate-200 rounded-xl shadow-lg w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center">
                    <h3 className="font-bold text-sm">Add Meal Menu Item</h3>
                    <button
                      onClick={() => setIsAddMenuModalOpen(false)}
                      className="p-1 hover:bg-indigo-700 rounded text-slate-200 hover:text-white cursor-pointer bg-transparent border-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleAddMenuSubmit} className="p-5 space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-500 mb-1">Week</label>
                        <Select
                          value={weeksToRender.map(w => {
                            const rawName = weeksList.find(week => week.week_number === w)?.name;
                            const weekName = rawName && rawName.trim() ? rawName.trim() : `Week ${w}`;
                            return {
                              value: w,
                              label: weekName
                            };
                          }).find(opt => opt.value === newMenuWeek)}
                          onChange={(opt) => opt && setNewMenuWeek(opt.value)}
                          options={weeksToRender.map(w => {
                            const rawName = weeksList.find(week => week.week_number === w)?.name;
                            const weekName = rawName && rawName.trim() ? rawName.trim() : `Week ${w}`;
                            return {
                              value: w,
                              label: weekName
                            };
                          })}
                          styles={customSelectStyles}
                          isSearchable={true}
                          placeholder="Select Week"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-500 mb-1">Day of Week</label>
                        <Select
                          value={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => ({
                            value: d,
                            label: d
                          })).find(opt => opt.value === newMenuDay)}
                          onChange={(opt) => opt && setNewMenuDay(opt.value)}
                          options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => ({
                            value: d,
                            label: d
                          }))}
                          styles={customSelectStyles}
                          isSearchable={true}
                          placeholder="Select Day"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-500 mb-1">Meal Type</label>
                        <Select
                          value={[
                            { value: 'Breakfast', label: 'Breakfast' },
                            { value: 'Lunch', label: 'Lunch' },
                            { value: 'Dinner', label: 'Dinner' }
                          ].find(opt => opt.value === newMenuMealType)}
                          onChange={(opt) => opt && handleMealTypeChange(opt.value)}
                          options={[
                            { value: 'Breakfast', label: 'Breakfast' },
                            { value: 'Lunch', label: 'Lunch' },
                            { value: 'Dinner', label: 'Dinner' }
                          ]}
                          styles={customSelectStyles}
                          isSearchable={true}
                          placeholder="Select Meal Type"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-500 mb-1">Timings</label>
                        <input
                          type="text"
                          value={newMenuTimings}
                          onChange={(e) => setNewMenuTimings(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-xs"
                          placeholder="e.g. 7:00 AM - 9:00 AM"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Menu Items</label>
                      <input
                        type="text"
                        value={newMenuItems}
                        onChange={(e) => setNewMenuItems(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-xs"
                        placeholder="e.g. Aloo Paratha - Curd - Chai"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="newMenuIsVeg"
                        checked={newMenuIsVeg}
                        onChange={(e) => setNewMenuIsVeg(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                      />
                      <label htmlFor="newMenuIsVeg" className="font-bold text-slate-600 cursor-pointer text-xs">
                        Is Vegetarian Meal (Veg)
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg py-2 transition mt-2 shadow-3xs cursor-pointer text-xs border-0"
                    >
                      Save Menu Item
                    </button>
                  </form>
                </div>
              </div>
            )}
        {/* ==================== 3. ATTENDANCE TAB ==================== */}
        {activeTab === 'attendance' && (
          <div className="space-y-2">
            
            {/* Stats percentages */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl py-1.5 px-3 text-center shadow-3xs flex flex-col justify-center">
                <div className="text-sm font-black">{attendanceStats.present_percent}%</div>
                <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Present</div>
              </div>
              <div className="bg-rose-50 text-rose-800 border border-rose-200 rounded-xl py-1.5 px-3 text-center shadow-3xs flex flex-col justify-center">
                <div className="text-sm font-black">{attendanceStats.absent_percent}%</div>
                <div className="text-[9px] font-bold text-rose-600 uppercase tracking-wide">Absent</div>
              </div>
              <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-xl py-1.5 px-3 text-center shadow-3xs flex flex-col justify-center">
                <div className="text-sm font-black">{attendanceStats.holiday_percent}%</div>
                <div className="text-[9px] font-bold text-amber-600 uppercase tracking-wide">Holiday</div>
              </div>
            </div>

            {/* Content splits grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
              
              {/* Attendance Calendar Grid */}
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-3xs lg:col-span-2">
                <h3 className="text-[10px] font-bold text-slate-900 pb-1.5 mb-2 border-b border-slate-100 flex items-center gap-1">
                  <span className="text-blue-500 text-xs">📅</span> June 2026 — Meal Attendance Logs
                </h3>
                
                <div className="w-full max-w-sm mx-auto">
                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 mb-1.5 text-[11px]">
                    <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center font-semibold">
                    <span></span>
                    <span></span>

                    {Array.from({ length: 30 }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const dateStr = `2026-06-${dayNum.toString().padStart(2, '0')}`;
                      const status = attendanceCalendar[dateStr] || '';
                      
                      let bgClass = 'bg-slate-50 text-slate-400 border border-slate-200/60 hover:bg-slate-100';
                      if (status === 'Present') bgClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold hover:bg-emerald-100/70';
                      if (status === 'Absent') bgClass = 'bg-rose-50 text-rose-700 border border-rose-200 font-bold hover:bg-rose-100/70';
                      if (status === 'Leave') bgClass = 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold hover:bg-indigo-100/70';
                      if (status === 'Holiday') bgClass = 'bg-amber-50 text-amber-700 border border-amber-200 font-bold hover:bg-amber-100/70';

                      return (
                        <div
                          key={dayNum}
                          className={`h-6 flex items-center justify-center rounded-md text-[10px] font-bold transition cursor-pointer select-none ${bgClass}`}
                          title={status ? `${dayNum} June: ${status}` : `${dayNum} June`}
                        >
                          {dayNum}
                        </div>
                      );
                    })}
                  </div>

                  {/* Calendar Legend */}
                  <div className="flex flex-wrap justify-center gap-2 mt-2 pt-2 border-t border-slate-100 text-[9px] font-bold text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-emerald-50 border border-emerald-200 block" /> Present
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-rose-50 border border-rose-200 block" /> Absent
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-indigo-50 border border-indigo-200 block" /> Leave
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-amber-50 border border-amber-200 block" /> Holiday
                    </span>
                  </div>
                </div>
              </div>

              {/* Apply Mess Leave form */}
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-3xs flex flex-col justify-start">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-900 pb-1.5 mb-2 border-b border-slate-100 flex items-center gap-1">
                    <span className="text-indigo-600 text-xs">✍️</span> Apply Mess Leave
                  </h3>
                  <form onSubmit={handleApplyLeave} className="space-y-2">
                    <div className="space-y-1.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                          From date
                        </label>
                        <input
                          type="date"
                          value={leaveFromDate}
                          onChange={(e) => setLeaveFromDate(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                          To date
                        </label>
                        <input
                          type="date"
                          value={leaveToDate}
                          onChange={(e) => setLeaveToDate(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                          Reason for Leave
                        </label>
                        <Select
                          value={[
                            { value: 'Going home', label: 'Going home' },
                            { value: 'Medical checkup', label: 'Medical checkup' },
                            { value: 'Festival holiday', label: 'Festival holiday' },
                            { value: 'Other', label: 'Other' }
                          ].find(opt => opt.value === leaveReason)}
                          onChange={(opt) => opt && setLeaveReason(opt.value)}
                          options={[
                            { value: 'Going home', label: 'Going home' },
                            { value: 'Medical checkup', label: 'Medical checkup' },
                            { value: 'Festival holiday', label: 'Festival holiday' },
                            { value: 'Other', label: 'Other' }
                          ]}
                          styles={customSelectStyles}
                          isSearchable={true}
                          placeholder="Select Reason"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg py-2 transition flex items-center justify-center gap-1.5 cursor-pointer text-xs border-0 shadow-3xs mt-2"
                    >
                      <Check className="w-4 h-4 text-white" />
                      <span>Submit Leave Application</span>
                    </button>
                  </form>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== 4. BILLING TAB ==================== */}
        {activeTab === 'billing' && (
          <div className="space-y-2">
            
            {/* Top Previous Month status */}
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-3xs flex-shrink-0">
              <span className="text-xs">✓</span>
              <span className="font-bold text-[10px]">
                May 2026 — ₹2,720 paid on 3 June 2026.
              </span>
            </div>

            {/* Content split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
              
              {/* Current Bill details ledger */}
              {currentBill ? (
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-3xs lg:col-span-2 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-900 pb-1.5 mb-2 border-b border-slate-100 flex items-center gap-1">
                      <span className="text-indigo-600 text-xs">📝</span> {currentBill.billing_month} — Current Bill Ledger
                    </h3>
                    
                    <div className="space-y-2.5 font-semibold text-slate-600">
                      <div className="flex justify-between items-center py-1 text-xs">
                        <span className="text-slate-400">Base mess charges</span>
                        <span className="text-slate-800 font-bold">
                          ₹{currentBill.base_charge.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-t border-slate-100 pt-2.5 text-xs">
                        <span className="text-slate-400">Extra items (snacks, juice, etc.)</span>
                        <span className="text-slate-800 font-bold">
                          ₹{currentBill.extra_items_charge.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-t border-slate-100 pt-2.5 text-xs">
                        <span className="text-slate-500 font-medium">
                          Leave deduction ({currentBill.leave_deduction_days} days)
                        </span>
                        <span className="text-rose-600 font-bold">
                          -₹{currentBill.leave_deduction_amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-t border-slate-100 pt-2.5 text-xs">
                        <span className="text-slate-400">Late fee charges</span>
                        <span className="text-slate-800 font-bold">
                          ₹{currentBill.late_fee.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-t border-slate-100 pt-2.5 text-xs">
                        <span className="text-slate-400">GST tax (5%)</span>
                        <span className="text-slate-800 font-bold">
                          ₹{currentBill.gst_amount.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-2.5 border-t-2 border-slate-200 pt-3 text-xs font-extrabold text-slate-900">
                        <span>Total Due Amount</span>
                        <span className="font-black text-indigo-600 text-sm">
                          ₹{currentBill.total_due.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePayBill(currentBill.id, currentBill.total_due)}
                    className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg py-2 transition shadow-3xs flex items-center justify-center gap-2 cursor-pointer text-xs border-0"
                  >
                    <CreditCard className="w-4 h-4 text-white" />
                    <span>Pay ₹{currentBill.total_due.toLocaleString()} — Due by 1 July</span>
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs text-center lg:col-span-2 flex flex-col items-center justify-center py-8">
                  <span className="text-emerald-500 font-bold text-lg block bg-emerald-50 w-8 h-8 rounded-full flex items-center justify-center border border-emerald-100">✓</span>
                  <p className="text-xs text-slate-600 font-semibold mt-2.5">
                    All current month bills are fully paid.
                  </p>
                </div>
              )}

              {/* Payment history */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs flex flex-col justify-start">
                <h3 className="text-xs font-bold text-slate-900 pb-2.5 mb-3 border-b border-slate-100 flex items-center gap-1.5">
                  <span className="text-blue-500 text-sm">💰</span> Payment History
                </h3>
                <div className="divide-y divide-slate-100 space-y-2.5 font-semibold text-slate-655 text-xs">
                  {pastBills.map((b) => (
                    <div key={b.id} className="flex justify-between items-center pt-2.5 first:pt-0 border-t border-slate-100 first:border-0">
                      <div className="text-slate-800 font-bold">{b.billing_month}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">
                          ₹{b.total_due.toLocaleString()}
                        </span>
                        <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Paid ✓</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 5. COMPLAINTS TAB ==================== */}
        {activeTab === 'complaints' && (
          <div className="space-y-2">
            
            <div className="flex justify-between items-center flex-shrink-0">
              <h3 className="text-[10px] font-bold text-slate-900 flex items-center gap-1">
                <span>💬</span> Mess Complaints Log
              </h3>
              <button
                onClick={() => setIsComplaintModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] shadow-3xs cursor-pointer border-0"
              >
                <Plus className="w-3 h-3" /> File Complaint
              </button>
            </div>

            {/* Complaints lists */}
            <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar">
              {complaints.length > 0 ? (
                complaints.map((c) => (
                  <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-3xs flex items-center justify-between gap-3 hover:shadow-2xs transition">
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-slate-900 text-[11px] truncate">{c.title}</h4>
                      <p className="text-[9px] text-slate-400 font-semibold">
                        {c.category} · Severity: <span className={
                          c.severity === 'High' ? 'text-rose-600 font-bold' : c.severity === 'Medium' ? 'text-amber-600 font-bold' : 'text-slate-500'
                        }>{c.severity}</span>
                      </p>
                      {c.resolution && (
                        <div className="mt-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px] text-slate-600 font-medium">
                          <span className="font-bold text-slate-700">Resolution:</span> {c.resolution}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        c.status === 'Resolved' || c.status === 'Closed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : c.status === 'In Progress'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-400 font-semibold shadow-3xs text-xs">
                  No complaints filed yet.
                </div>
              )}
            </div>

            {/* Complaint Modal Form */}
            {isComplaintModalOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                <div className="bg-white border border-slate-200 rounded-xl shadow-lg w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center">
                    <h3 className="font-bold text-sm">File Mess Complaint</h3>
                    <button
                      onClick={() => setIsComplaintModalOpen(false)}
                      className="p-1 hover:bg-indigo-700 rounded-lg text-slate-200 hover:text-white cursor-pointer bg-transparent border-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleFileComplaintSubmit} className="p-4 space-y-3.5 text-xs">
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Title / Brief Issue</label>
                      <input
                        type="text"
                        placeholder="e.g. Cleanliness near water dispenser"
                        value={newComplaintTitle}
                        onChange={(e) => setNewComplaintTitle(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-xs bg-white text-slate-800"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-500 mb-1">Category</label>
                        <Select
                          value={[
                            { value: 'Food Quality', label: 'Food Quality' },
                            { value: 'Cleanliness', label: 'Cleanliness' },
                            { value: 'Service', label: 'Service' },
                            { value: 'Billing', label: 'Billing' },
                            { value: 'General', label: 'General' }
                          ].find(opt => opt.value === newComplaintCategory)}
                          onChange={(opt) => opt && setNewComplaintCategory(opt.value)}
                          options={[
                            { value: 'Food Quality', label: 'Food Quality' },
                            { value: 'Cleanliness', label: 'Cleanliness' },
                            { value: 'Service', label: 'Service' },
                            { value: 'Billing', label: 'Billing' },
                            { value: 'General', label: 'General' }
                          ]}
                          styles={customSelectStyles}
                          isSearchable={true}
                          placeholder="Select Category"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-500 mb-1">Severity</label>
                        <Select
                          value={[
                            { value: 'Low', label: 'Low' },
                            { value: 'Medium', label: 'Medium' },
                            { value: 'High', label: 'High' }
                          ].find(opt => opt.value === newComplaintSeverity)}
                          onChange={(opt) => opt && setNewComplaintSeverity(opt.value)}
                          options={[
                            { value: 'Low', label: 'Low' },
                            { value: 'Medium', label: 'Medium' },
                            { value: 'High', label: 'High' }
                          ]}
                          styles={customSelectStyles}
                          isSearchable={true}
                          placeholder="Select Severity"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Detailed Description</label>
                      <textarea
                        rows={3}
                        placeholder="Provide details about the issue..."
                        value={newComplaintDescription}
                        onChange={(e) => setNewComplaintDescription(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-xs bg-white text-slate-800"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg py-2 transition mt-2 shadow-3xs cursor-pointer text-xs border-0"
                    >
                      Submit Complaint
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manage Weeks Modal Dialog */}
        {isWeeksModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-xl shadow-lg w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="bg-indigo-600 text-white px-5 py-4 flex justify-between items-center flex-shrink-0">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Manage Mess Weeks
                </h3>
                <button
                  onClick={() => {
                    setIsWeeksModalOpen(false);
                    setEditingWeekId(null);
                    setWeekFormName('');
                  }}
                  className="p-1.5 hover:bg-indigo-700 rounded-lg text-indigo-100 hover:text-white transition duration-150 cursor-pointer bg-transparent border-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto flex flex-col md:flex-row gap-5 text-xs flex-1">
                
                {/* Left Pane: Weeks List */}
                <div className="w-full md:w-3/5 flex flex-col min-w-0">
                  <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 mb-2.5 flex-shrink-0 text-xs">Existing Weeks</h4>
                  <div className="overflow-x-auto max-h-[280px] overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl flex-grow shadow-3xs bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0 text-[11px]">
                          <th className="py-2.5 px-3 w-12 text-center">No.</th>
                          <th className="py-2.5 px-3">Name</th>
                          <th className="py-2.5 px-3">Dates</th>
                          <th className="py-2.5 px-3 text-right w-20">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                        {weeksList.map((w) => (
                          <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-slate-900 text-center">{w.week_number}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700 truncate max-w-[100px]">{w.name}</td>
                            <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                              {w.start_date.substring(5, 10)} to {w.end_date.substring(5, 10)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingWeekId(w.id);
                                    setWeekFormNumber(w.week_number);
                                    setWeekFormName(w.name);
                                    setWeekFormStartDate(w.start_date.substring(0, 10));
                                    setWeekFormEndDate(w.end_date.substring(0, 10));
                                  }}
                                  className="p-1 hover:bg-indigo-50 text-indigo-600 rounded-lg transition border-0 bg-transparent cursor-pointer"
                                  title="Edit week"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteWeek(w.id)}
                                  className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg transition border-0 bg-transparent cursor-pointer"
                                  title="Delete week"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Right Pane: Weeks Form */}
                <div className="w-full md:w-2/5 flex flex-col bg-slate-50 border border-slate-200 p-4 rounded-xl flex-shrink-0 justify-start">
                  <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 mb-2.5 text-xs">
                    {editingWeekId ? 'Edit Week' : 'Add Week'}
                  </h4>
                  <form onSubmit={handleWeeksSubmit} className="space-y-3">
                    <div>
                      <label className="block font-bold text-slate-500 mb-1 text-[10px] uppercase tracking-wider">Week Number</label>
                      <input
                        type="number"
                        min={1}
                        max={52}
                        value={weekFormNumber}
                        onChange={(e) => {
                          const num = Number(e.target.value);
                          setWeekFormNumber(num);
                          if (!editingWeekId || weekFormName === `Week ${weekFormNumber}`) {
                            setWeekFormName(`Week ${num}`);
                          }
                        }}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-xs bg-white text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-500 mb-1 text-[10px] uppercase tracking-wider">Week Name</label>
                      <input
                        type="text"
                        value={weekFormName}
                        onChange={(e) => setWeekFormName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-xs bg-white text-slate-800"
                        placeholder="e.g. Week 5"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-500 mb-1 text-[10px] uppercase tracking-wider">Start Date</label>
                      <input
                        type="date"
                        value={weekFormStartDate}
                        onChange={(e) => setWeekFormStartDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-xs bg-white text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-500 mb-1 text-[10px] uppercase tracking-wider">End Date</label>
                      <input
                        type="date"
                        value={weekFormEndDate}
                        onChange={(e) => setWeekFormEndDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-xs bg-white text-slate-800"
                        required
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg py-2 transition cursor-pointer text-xs border-0 shadow-3xs"
                      >
                        Save
                      </button>
                      {editingWeekId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingWeekId(null);
                            setWeekFormName('');
                          }}
                          className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition cursor-pointer text-xs border-0"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
                
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default HostelMessManager;
