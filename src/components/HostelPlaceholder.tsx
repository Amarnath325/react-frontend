import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  UserPlus, Grid, CreditCard, BarChart2, Coffee, FileText,
  Wrench, Package, Shield, Users, AlertTriangle, Activity,
  Smartphone, Bell, AreaChart, Key, Check, X, Plus, RefreshCw
} from 'lucide-react';

const HostelPlaceholder: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  // Live Dashboard Statistics State
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    admissionsTotal: 198,
    admissionsVerifiedRate: 94,
    occupancyRate: 84,
    occupiedBeds: 168,
    totalBeds: 200,
    collectedFees: 340000,
    remainingFees: 145000,
    attendancePresentPct: 98.5,
    absentCount: 3,
    messTodayLunch: 'Paneer Tikka',
    messRating: 4.8,
    pendingLeaves: 2,
    openComplaints: 2,
    plumbingComplaints: 1,
    electricalComplaints: 1,
    totalInventoryItems: 750,
    activeGuests: 3,
    wardenName: 'Satish Chandra',
    wardenStatus: 'Active',
    violationCount: 1,
    sickBayCount: 1,
    portalLogins: 124,
    alertStatus: 'Curfew Alert Sent',
    alertsRate: 100
  });

  const fetchDashboardStats = async () => {
    setDashboardLoading(true);
    try {
      // 1. Fetch Admissions stats
      let admissionsTotal = 198;
      let admissionsVerifiedRate = 94;
      try {
        const res = await api.get('/school/hostel/admissions');
        if (res.data.success && res.data.stats) {
          admissionsTotal = res.data.stats.total || 0;
          admissionsVerifiedRate = res.data.stats.verified_rate || 94;
        }
      } catch (err) {
        console.error('Error fetching admissions stats:', err);
      }

      // 2. Fetch Rooms occupancy stats
      let occupancyRate = 84;
      let occupiedBeds = 168;
      let totalBeds = 200;
      try {
        const res = await api.get('/school/hostel/rooms');
        if (res.data.success && res.data.stats) {
          occupancyRate = parseFloat(res.data.stats.occupancy_rate) || 84;
          occupiedBeds = res.data.stats.occupied_beds || 0;
          totalBeds = res.data.stats.total_beds || 0;
        }
      } catch (err) {
        console.error('Error fetching rooms occupancy stats:', err);
      }

      // 3. Fetch Attendance and Outpasses stats
      let attendancePresentPct = 98.5;
      let absentCount = 3;
      let pendingLeaves = 2;
      try {
        const res = await api.get('/school/hostel/attendance/dashboard');
        if (res.data.success && res.data.data && res.data.data.stats) {
          const aStats = res.data.data.stats;
          attendancePresentPct = parseFloat(aStats.todayPct) || 98.5;
          absentCount = aStats.todayAbsent || 0;
          pendingLeaves = aStats.pendingLeaves || 0;
        }
      } catch (err) {
        console.error('Error fetching attendance dashboard stats:', err);
      }

      // 4. Fetch Mess stats
      let messTodayLunch = 'Paneer Tikka';
      try {
        const res = await api.get('/school/hostel/mess/dashboard');
        if (res.data.success && res.data.data && res.data.data.aaj_ka_khana) {
          const meals = res.data.data.aaj_ka_khana;
          messTodayLunch = meals.Lunch?.items || meals.Breakfast?.items || 'Paneer Tikka';
        }
      } catch (err) {
        console.error('Error fetching mess menu stats:', err);
      }

      // 5. Fetch Complaints stats
      let openComplaints = 2;
      try {
        const res = await api.get('/school/hostel/complaints/dashboard');
        if (res.data.success && res.data.data && res.data.data.stats) {
          openComplaints = res.data.data.stats.open || 0;
        }
      } catch (err) {
        console.error('Error fetching complaints stats:', err);
      }

      setDashboardStats(prev => ({
        ...prev,
        admissionsTotal,
        admissionsVerifiedRate,
        occupancyRate,
        occupiedBeds,
        totalBeds,
        attendancePresentPct,
        absentCount,
        messTodayLunch,
        pendingLeaves,
        openComplaints
      }));

    } catch (error) {
      console.error('Error in fetchDashboardStats:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (path === '/hostel/dashboard') {
      fetchDashboardStats();
    } else {
      setDashboardLoading(false);
    }
  }, [path]);

  // Floor Map Bed Allocation Mock State
  const [beds, setBeds] = useState([
    { room: '101-A', type: '2-Seater', status: 'Occupied', student: 'Amit Kumar' },
    { room: '101-B', type: '2-Seater', status: 'Vacant', student: '' },
    { room: '102-A', type: '4-Seater', status: 'Occupied', student: 'Rohan Sharma' },
    { room: '102-B', type: '4-Seater', status: 'Occupied', student: 'Rahul Singh' },
    { room: '102-C', type: '4-Seater', status: 'Vacant', student: '' },
    { room: '102-D', type: '4-Seater', status: 'Maintenance', student: '' },
    { room: '103-A', type: 'Single', status: 'Occupied', student: 'Vikram Patel' },
    { room: '104-A', type: '2-Seater', status: 'Vacant', student: '' },
  ]);

  // Mock Outpass / Leave applications
  const [leaves, setLeaves] = useState([
    { id: 1, student: 'Siddharth Roy', room: '102-A', type: 'Outpass', duration: 'Weekend Home Visit', date: '2026-06-20 to 2026-06-22', status: 'Pending' },
    { id: 2, student: 'Aarav Gupta', room: '103-A', type: 'Day Outpass', duration: 'Local Market (4 Hours)', date: 'Today 04:00 PM', status: 'Pending' },
    { id: 3, student: 'Pooja Hegde', room: '204-B', type: 'Emergency Leave', duration: 'Medical checkup', date: '2026-06-19 to 2026-06-20', status: 'Approved' },
  ]);

  // Mock Mess Menu State
  const [messMenu, setMessMenu] = useState({
    Breakfast: 'Aloo Paratha, Curd, Tea/Coffee',
    Lunch: 'Dal Tadka, Mix Veg, Roti, Rice, Salad',
    Dinner: 'Paneer Butter Masala, Butter Naan, Jeera Rice'
  });

  // Mock Maintenance complaints
  const [complaints, setComplaints] = useState([
    { id: 1, title: 'Room 102 Ceiling Fan Noise', category: 'Electrical', severity: 'Medium', status: 'Assigned', time: '5h ago' },
    { id: 2, title: 'Bathroom Tap Leakage Block-B', category: 'Plumbing', severity: 'Low', status: 'Submitted', time: '1d ago' },
    { id: 3, title: 'AC Cooling Issue Room 205', category: 'HVAC', severity: 'High', status: 'Resolved', time: 'Resolved' },
  ]);

  // Mock rule violation alerts
  const [violations, setViolations] = useState([
    { id: 1, student: 'Karan Singh', room: '104-B', offense: 'Late entry in hostel (11:30 PM)', fine: '₹500', status: 'Unpaid' },
    { id: 2, student: 'Aditya Sen', room: '102-C', offense: 'Loud music after silent hours', fine: 'Warning', status: 'Resolved' },
  ]);

  // Interactive Helpers
  const handleBedAllocate = (index: number) => {
    if (beds[index].status === 'Occupied') {
      toast.error('This bed is already occupied!');
      return;
    }
    if (beds[index].status === 'Maintenance') {
      toast.error('This room is under maintenance!');
      return;
    }
    const name = window.prompt("Enter Student Name for allocation:");
    if (!name) return;

    const updated = [...beds];
    updated[index].status = 'Occupied';
    updated[index].student = name;
    setBeds(updated);
    toast.success(`Bed allocated to ${name} in Room ${beds[index].room}`);
  };

  const handleOutpassAction = (id: number, action: 'Approved' | 'Rejected') => {
    setLeaves(prev => prev.map(item => item.id === id ? { ...item, status: action } : item));
    toast.success(`Outpass request is ${action}`);
  };

  const handleCreateComplaint = () => {
    const title = window.prompt("Describe the issue:");
    if (!title) return;
    const newComplaint = {
      id: complaints.length + 1,
      title,
      category: 'General',
      severity: 'Medium',
      status: 'Submitted',
      time: 'Just now'
    };
    setComplaints([newComplaint, ...complaints]);
    toast.success('Complaint filed successfully');
  };

  // Helper to determine active layout contents
  const getModuleConfig = () => {
    switch (path) {
      case '/hostel/dashboard':
        return {
          title: 'Hostel Operational Dashboard',
          icon: <BarChart2 className="w-5 h-5 text-blue-600" />,
          description: 'High-level real-time indicators, operational status checklist, and overview of all 16 hostel sub-modules.',
          render: (
            <div className="space-y-4">
              {dashboardLoading ? (
                // ─── PREMIUM SKELETON LOADER ───
                <div className="space-y-5 animate-pulse">
                  {[1, 2, 3, 4].map((g) => (
                    <div key={g} className="space-y-3">
                      <div className="h-3.5 bg-slate-200 rounded w-44 mb-2"></div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                        {[1, 2, 3, 4].map((c) => (
                          <div key={c} className="bg-white border border-slate-200 rounded-xl p-4 min-h-[110px] flex flex-col justify-between shadow-sm">
                            <div>
                              <div className="flex justify-between items-center mb-2.5">
                                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                                <div className="w-4 h-4 bg-slate-100 rounded-full"></div>
                              </div>
                              <div className="h-5 bg-slate-200 rounded w-1/2 mb-1.5"></div>
                              <div className="h-2.5 bg-slate-200 rounded w-3/4"></div>
                            </div>
                            <div className="h-3 bg-slate-200 rounded w-1/3 mt-2"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* ── SECTION 1: CORE ADMINISTRATIVE MODULES (GROUP 1) ── */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                      <span className="w-1.5 h-3 bg-blue-600 rounded-sm animate-pulse" />
                      <span>Core Administrative Modules (Group 1)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                      {/* Student Admission & Enrolment */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-md hover:border-blue-400 transition duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Admission & Enrolment</span>
                            <UserPlus className="w-4 h-4 text-blue-500" />
                          </div>
                          <div className="text-base font-bold text-slate-800 mt-1.5">{dashboardStats.admissionsTotal} Admitted</div>
                          <p className="text-[9px] text-slate-500 mt-0.5">{dashboardStats.admissionsVerifiedRate}% Doc Verification Rate</p>
                        </div>
                        <button onClick={() => navigate('/hostel/admission')} className="text-blue-600 font-semibold hover:underline text-[9px] mt-2 block bg-transparent border-0 p-0 text-left cursor-pointer">
                          Manage Admissions →
                        </button>
                      </div>

                      {/* Room & Bed Allocation */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-md hover:border-indigo-400 transition duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Room & Bed Allocation</span>
                            <Grid className="w-4 h-4 text-indigo-500" />
                          </div>
                          <div className="text-base font-bold text-slate-800 mt-1.5">{dashboardStats.occupancyRate}% Occupied</div>
                          <div className="w-full bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${dashboardStats.occupancyRate}%` }}></div>
                          </div>
                          <p className="text-[8px] text-slate-400 mt-1.5 font-mono">{dashboardStats.occupiedBeds} / {dashboardStats.totalBeds} Beds Assigned</p>
                        </div>
                        <button onClick={() => navigate('/hostel/allocation')} className="text-indigo-600 font-semibold hover:underline text-[9px] mt-2 block bg-transparent border-0 p-0 text-left cursor-pointer">
                          Room Layouts →
                        </button>
                      </div>

                      {/* Fee & Billing Management */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-md hover:border-emerald-400 transition duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Fee & Billing</span>
                            <CreditCard className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div className="text-base font-bold text-emerald-600 mt-1.5">₹3.40L Collected</div>
                          <p className="text-[9px] text-slate-500 mt-0.5">₹1.45L Dues Remaining</p>
                        </div>
                        <button onClick={() => navigate('/hostel/fees')} className="text-emerald-600 font-semibold hover:underline text-[9px] mt-2 block bg-transparent border-0 p-0 text-left cursor-pointer">
                          Fee Ledgers →
                        </button>
                      </div>

                      {/* Attendance Tracking */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-md hover:border-amber-400 transition duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Attendance Tracking</span>
                            <BarChart2 className="w-4 h-4 text-amber-500" />
                          </div>
                          <div className="text-base font-bold text-slate-800 mt-1.5">{dashboardStats.attendancePresentPct}% Present</div>
                          <p className="text-[9px] text-slate-500 mt-0.5">{dashboardStats.absentCount} Student(s) Flagged Absent</p>
                        </div>
                        <button onClick={() => navigate('/hostel/attendance')} className="text-amber-600 font-semibold hover:underline text-[9px] mt-2 block bg-transparent border-0 p-0 text-left cursor-pointer">
                          Mark Roster →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── SECTION 2: OPERATIONAL & DAY-TO-DAY MODULES (GROUP 2) ── */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 mt-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-3 bg-teal-600 rounded-sm" />
                      <span>Operational & Day-to-Day Modules (Group 2)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                      {/* Mess & Meal Management */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-md hover:border-teal-400 transition duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Mess & Meal Management</span>
                            <Coffee className="w-4 h-4 text-teal-600" />
                          </div>
                          <div className="text-xs font-bold text-slate-700 mt-1.5 truncate" title={dashboardStats.messTodayLunch}>
                            Lunch: {dashboardStats.messTodayLunch}
                          </div>
                          <p className="text-[9px] text-amber-500 mt-0.5">★ {dashboardStats.messRating} / 5.0 Rating</p>
                        </div>
                        <button onClick={() => navigate('/hostel/mess')} className="text-teal-600 font-semibold hover:underline text-[9px] mt-2 block bg-transparent border-0 p-0 text-left cursor-pointer">
                          Mess Menu →
                        </button>
                      </div>

                      {/* Outpass & Leave Management */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-md hover:border-amber-500 transition duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Outpass & Leaves</span>
                            <FileText className="w-4 h-4 text-amber-600" />
                          </div>
                          <div className="text-base font-bold text-slate-800 mt-1.5">{dashboardStats.pendingLeaves} Pending</div>
                          <p className="text-[9px] text-slate-500 mt-0.5">Leave Pass Requests Queue</p>
                        </div>
                        <button onClick={() => navigate('/hostel/leaves')} className="text-amber-600 font-semibold hover:underline text-[9px] mt-2 block bg-transparent border-0 p-0 text-left cursor-pointer">
                          Approve Queue →
                        </button>
                      </div>

                      {/* Complaint & Maintenance */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-md hover:border-orange-400 transition duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Complaint & Maintenance</span>
                            <Wrench className="w-4 h-4 text-orange-500" />
                          </div>
                          <div className="text-base font-bold text-rose-600 mt-1.5">{dashboardStats.openComplaints} Open Ticket{dashboardStats.openComplaints !== 1 ? 's' : ''}</div>
                          <p className="text-[9px] text-slate-500 mt-0.5">Recent Hostellers Repairs</p>
                        </div>
                        <button onClick={() => navigate('/hostel/complaints')} className="text-orange-600 font-semibold hover:underline text-[9px] mt-2 block bg-transparent border-0 p-0 text-left cursor-pointer">
                          View Tickets →
                        </button>
                      </div>

                      {/* Inventory & Asset Management */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-md hover:border-purple-400 transition duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Inventory & Assets</span>
                            <Package className="w-4 h-4 text-purple-500" />
                          </div>
                          <div className="text-base font-bold text-slate-800 mt-1.5">{dashboardStats.totalInventoryItems} Registered</div>
                          <p className="text-[9px] text-emerald-600 mt-0.5">✓ Furniture Stock OK</p>
                        </div>
                        <button onClick={() => navigate('/hostel/inventory')} className="text-purple-650 font-semibold hover:underline text-[9px] mt-2 block bg-transparent border-0 p-0 text-left cursor-pointer">
                          Inventory Logs →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── SECTION 3: SECURITY, COMPLIANCE & PORTALS (GROUP 3) ── */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 mt-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-3 bg-rose-600 rounded-sm" />
                      <span>Security, Compliance & Portals (Group 3)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                      {/* Guest & Visitor Management */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-md hover:border-teal-500 transition duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Guest & Visitors</span>
                            <Users className="w-4 h-4 text-teal-650" />
                          </div>
                          <div className="text-base font-bold text-slate-800 mt-1.5">{dashboardStats.activeGuests} Active Guests</div>
                          <p className="text-[9px] text-emerald-650 mt-0.5">● Curfew: Gates Closed</p>
                        </div>
                        <button onClick={() => navigate('/hostel/visitors')} className="text-teal-600 font-semibold hover:underline text-[9px] mt-2 block bg-transparent border-0 p-0 text-left cursor-pointer">
                          Visitor Logs →
                        </button>
                      </div>

                      {/* Staff & Warden Management */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-md hover:border-indigo-500 transition duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Staff & Warden</span>
                            <Shield className="w-4 h-4 text-indigo-650" />
                          </div>
                          <div className="text-xs font-bold text-slate-700 mt-1.5">{dashboardStats.wardenName}</div>
                          <p className="text-[9px] text-emerald-600 mt-0.5">✓ Warden On Duty</p>
                        </div>
                        <button onClick={() => navigate('/hostel/staff')} className="text-indigo-600 font-semibold hover:underline text-[9px] mt-2 block bg-transparent border-0 p-0 text-left cursor-pointer">
                          Duty Rosters →
                        </button>
                      </div>

                      {/* Rules & Discipline Management */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-md hover:border-rose-400 transition duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Rules & Discipline</span>
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                          </div>
                          <div className="text-base font-bold text-rose-600 mt-1.5">{dashboardStats.violationCount} Violation Case</div>
                          <p className="text-[9px] text-slate-500 mt-0.5">₹500 Late Curfew Fine</p>
                        </div>
                        <button onClick={() => navigate('/hostel/rules')} className="text-rose-600 font-semibold hover:underline text-[9px] mt-2 block bg-transparent border-0 p-0 text-left cursor-pointer">
                          Violations Registry →
                        </button>
                      </div>

                      {/* Health & Medical Records */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-md hover:border-red-400 transition duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Health & Medical</span>
                            <Activity className="w-4 h-4 text-red-500" />
                          </div>
                          <div className="text-xs font-bold text-slate-700 mt-1.5">{dashboardStats.sickBayCount} in Sick Bay</div>
                          <p className="text-[9px] text-emerald-600 mt-0.5">✓ Medicine Stock OK</p>
                        </div>
                        <button onClick={() => navigate('/hostel/medical')} className="text-red-650 font-semibold hover:underline text-[9px] mt-2 block bg-transparent border-0 p-0 text-left cursor-pointer">
                          Medical Records →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── SECTION 4: COMMUNICATION & SYSTEM CONTROLS (GROUP 4) ── */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 mt-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-3 bg-violet-650 rounded-sm" />
                      <span>Communication & System Controls (Group 4)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                      {/* Student & Parent Portal */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-md hover:border-blue-500 transition duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Student/Parent Portal</span>
                            <Smartphone className="w-4 h-4 text-blue-500" />
                          </div>
                          <div className="text-base font-bold text-slate-800 mt-1.5">{dashboardStats.portalLogins} App Logins</div>
                          <p className="text-[9px] text-slate-500 mt-0.5">Auto-WhatsApp Enabled</p>
                        </div>
                        <button onClick={() => navigate('/hostel/portal')} className="text-blue-600 font-semibold hover:underline text-[9px] mt-2 block bg-transparent border-0 p-0 text-left cursor-pointer">
                          Portal Controls →
                        </button>
                      </div>

                      {/* Smart Alerts & Notifications */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-md hover:border-indigo-500 transition duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Smart Alerts</span>
                            <Bell className="w-4 h-4 text-indigo-500" />
                          </div>
                          <div className="text-xs font-bold text-slate-700 mt-1.5">{dashboardStats.alertStatus}</div>
                          <p className="text-[9px] text-slate-500 mt-0.5">{dashboardStats.alertsRate}% SMS Delivery Rate</p>
                        </div>
                        <button onClick={() => navigate('/hostel/alerts')} className="text-indigo-600 font-semibold hover:underline text-[9px] mt-2 block bg-transparent border-0 p-0 text-left cursor-pointer">
                          Publish Alert →
                        </button>
                      </div>

                      {/* Advanced Reports & Analytics */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-md hover:border-violet-500 transition duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Reports & Analytics</span>
                            <AreaChart className="w-4 h-4 text-violet-500" />
                          </div>
                          <div className="text-base font-bold text-slate-800 mt-1.5">50+ Statements</div>
                          <p className="text-[9px] text-slate-500 mt-0.5">Occupancy, Fees, SLA reports</p>
                        </div>
                        <button onClick={() => navigate('/hostel/reports')} className="text-violet-600 font-semibold hover:underline text-[9px] mt-2 block bg-transparent border-0 p-0 text-left cursor-pointer">
                          Export Sheets →
                        </button>
                      </div>

                      {/* Role-Based Access Control */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-md hover:border-emerald-500 transition duration-200 hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">RBAC Config</span>
                            <Key className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div className="text-base font-bold text-slate-800 mt-1.5">5 Active Roles</div>
                          <p className="text-[9px] text-slate-500 mt-0.5">Housekeeping & Guard Rules</p>
                        </div>
                        <button onClick={() => navigate('/hostel/rbac')} className="text-emerald-600 font-semibold hover:underline text-[9px] mt-2 block bg-transparent border-0 p-0 text-left cursor-pointer">
                          Access Rules →
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )
        };

      case '/hostel/admission':
        return {
          title: 'Student Admission & Enrolment',
          icon: <UserPlus className="w-5 h-5 text-blue-600" />,
          description: 'Register new hostellers, manage profiles, check physical eligibility certificates, and assign primary hostel IDs.',
          render: (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[9px] text-slate-400 font-semibold uppercase">Pending Enrolments</div>
                  <div className="text-xl font-bold text-slate-800 mt-1">12 Applicants</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[9px] text-slate-400 font-semibold uppercase">Documents Verified</div>
                  <div className="text-xl font-bold text-slate-800 mt-1">94 Students</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[9px] text-slate-400 font-semibold uppercase">Medical Clearance</div>
                  <div className="text-xl font-bold text-slate-800 mt-1">98% Approved</div>
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <div className="font-bold text-slate-900 mb-2">New Hosteller Registration Form</div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input type="text" placeholder="Admission or Student ID" className="border border-slate-300 rounded p-1.5 outline-none" />
                  <input type="text" placeholder="Guardian Phone Number" className="border border-slate-300 rounded p-1.5 outline-none" />
                  <select className="border border-slate-300 rounded p-1.5 outline-none text-slate-600">
                    <option>Block-A (Boys)</option>
                    <option>Block-B (Girls)</option>
                  </select>
                  <select className="border border-slate-300 rounded p-1.5 outline-none text-slate-600">
                    <option>Standard AC Room</option>
                    <option>Standard Non-AC Room</option>
                  </select>
                </div>
                <button type="button" onClick={() => toast.success('Form filled (Demo Mode)')} className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-1.5 font-semibold">
                  Submit Enrolment
                </button>
              </div>
            </div>
          )
        };

      case '/hostel/allocation':
        return {
          title: 'Room & Bed Allocation',
          icon: <Grid className="w-5 h-5 text-indigo-600" />,
          description: 'Live interactive room seater blueprint. Click any vacant bed to allocate it to a student.',
          render: (
            <div className="space-y-4">
              <div className="flex gap-2 mb-2">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span> Vacant</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-400 rounded-full"></span> Occupied</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> Maintenance</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {beds.map((bed, idx) => {
                  let colorClass = 'border-slate-300 bg-slate-100 hover:bg-slate-200';
                  if (bed.status === 'Vacant') colorClass = 'border-green-500 bg-green-50/50 hover:bg-green-100/50 cursor-pointer';
                  if (bed.status === 'Maintenance') colorClass = 'border-amber-400 bg-amber-50/50 hover:bg-amber-100/50';

                  return (
                    <div
                      key={idx}
                      onClick={() => handleBedAllocate(idx)}
                      className={`border rounded-lg p-3 text-center transition ${colorClass}`}
                    >
                      <div className="font-mono font-bold text-slate-900">{bed.room}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{bed.type}</div>
                      <div className="font-semibold mt-1 text-[10px]">
                        {bed.status === 'Occupied' ? bed.student : bed.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        };

      case '/hostel/fees':
        return {
          title: 'Fee & Billing Management',
          icon: <CreditCard className="w-5 h-5 text-emerald-600" />,
          description: 'Configure room rent tariffs, security deposits, and mess billing. Monitor student dues and view mock ledger entries.',
          render: (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[9px] text-slate-400 font-semibold uppercase">Total Billing (June)</div>
                  <div className="text-xl font-bold text-slate-800 mt-1">₹4,85,000</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[9px] text-slate-400 font-semibold uppercase">Collected</div>
                  <div className="text-xl font-bold text-slate-800 mt-1">₹3,40,000</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[9px] text-slate-400 font-semibold uppercase">Pending Dues</div>
                  <div className="text-xl font-bold text-rose-600 mt-1">₹1,45,000</div>
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <div className="font-bold text-slate-900 mb-2">Quick Fee Payment Simulator</div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Enter Roll No or Admission No" className="border border-slate-300 rounded p-1.5 outline-none flex-grow" />
                  <button type="button" onClick={() => toast.success('Payment recorded successfully')} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded px-4 py-1.5 font-semibold">
                    Pay ₹4,500
                  </button>
                </div>
              </div>
            </div>
          )
        };

      case '/hostel/attendance':
        return {
          title: 'Attendance Tracking',
          icon: <BarChart2 className="w-5 h-5 text-amber-600" />,
          description: 'Mark daily morning roll call and evening curfew attendance. Integrates with biometric readers or facial registers.',
          render: (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="font-bold text-slate-900">Curfew Roster (Block A)</div>
                <button type="button" onClick={() => toast.success('All marked Present')} className="bg-slate-800 text-white font-medium rounded px-2.5 py-1">
                  Mark All Present
                </button>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-[9px] uppercase border-b">
                    <th className="pb-1.5">Student</th>
                    <th className="pb-1.5">Room</th>
                    <th className="pb-1.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 font-medium">Amit Kumar</td>
                    <td className="py-2 font-mono">101-A</td>
                    <td className="py-2 text-center">
                      <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">Present</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Rohan Sharma</td>
                    <td className="py-2 font-mono">102-A</td>
                    <td className="py-2 text-center">
                      <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">Present</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Rahul Singh</td>
                    <td className="py-2 font-mono">102-B</td>
                    <td className="py-2 text-center">
                      <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">Absent</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )
        };

      case '/hostel/mess':
        return {
          title: 'Mess & Meal Management',
          icon: <Coffee className="w-5 h-5 text-teal-600" />,
          description: 'Weekly menu scheduling and pay-as-you-eat calculations. Adjust daily food schedule or update active menu entries below.',
          render: (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <div className="font-bold text-slate-900 mb-2">Today's Mess Schedule</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center border-b pb-1">
                    <span className="font-semibold">Breakfast</span>
                    <span className="text-slate-600">{messMenu.Breakfast}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-1">
                    <span className="font-semibold">Lunch</span>
                    <span className="text-slate-600">{messMenu.Lunch}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                    <span className="font-semibold">Dinner</span>
                    <span className="text-slate-600">{messMenu.Dinner}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMessMenu({
                    Breakfast: 'Puri Sabji, Halwa, Tea/Coffee',
                    Lunch: 'Shahi Paneer, Dal Fry, Roti, Rice',
                    Dinner: 'Kadhai Paneer, Naan, Gulab Jamun'
                  });
                  toast.success('Mess Menu changed to Special Day Menu');
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded px-4 py-1.5 font-semibold w-full"
              >
                Apply Special Sunday Menu
              </button>
            </div>
          )
        };

      case '/hostel/leaves':
        return {
          title: 'Outpass & Leave Management',
          icon: <FileText className="w-5 h-5 text-amber-600" />,
          description: 'Manage wardens approvals workflow for gate passes, day outpass, and overnight leaves.',
          render: (
            <div className="space-y-3">
              <div className="font-bold text-slate-900 mb-1.5">Pending Approvals ({leaves.filter(l => l.status === 'Pending').length})</div>
              {leaves.map((item) => (
                <div key={item.id} className="border border-slate-200 rounded-lg p-3 bg-white flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-slate-800">{item.student} <span className="text-[9px] font-mono text-slate-400">Room: {item.room}</span></div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.type} - {item.duration}</div>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">{item.date}</div>
                  </div>
                  <div className="flex gap-1.5">
                    {item.status === 'Pending' ? (
                      <>
                        <button onClick={() => handleOutpassAction(item.id, 'Approved')} className="p-1 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 cursor-pointer">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleOutpassAction(item.id, 'Rejected')} className="p-1 bg-rose-50 text-rose-700 border border-rose-200 rounded hover:bg-rose-100 cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${item.status === 'Approved' ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'}`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        };

      case '/hostel/complaints':
        return {
          title: 'Complaint & Maintenance',
          icon: <Wrench className="w-5 h-5 text-orange-600" />,
          description: 'Submit repair and maintenance requests. Wardens can log issues or track task SLAs.',
          render: (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1.5">
                <span className="font-bold text-slate-900">Recent Complaints Log</span>
                <button type="button" onClick={handleCreateComplaint} className="text-orange-600 font-bold hover:underline flex items-center gap-0.5 text-[10px]">
                  <Plus className="w-3 h-3" /> File Complaint
                </button>
              </div>
              <div className="space-y-2">
                {complaints.map((item) => (
                  <div key={item.id} className="border border-slate-200 rounded-lg p-2.5 bg-white flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">{item.title}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{item.category} | Priority: {item.severity} | {item.time}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      item.status === 'Resolved' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        };

      case '/hostel/inventory':
        return {
          title: 'Inventory & Asset Management',
          icon: <Package className="w-5 h-5 text-purple-600" />,
          description: 'Keep track of furniture, electrical utilities, bedding sets, and purchase requisition order records.',
          render: (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="font-semibold text-slate-900">Total Bunks</div>
                  <div className="text-lg font-bold text-slate-800">250 units</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="font-semibold text-slate-900">Blankets & Bedding</div>
                  <div className="text-lg font-bold text-slate-800">300 items</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="font-semibold text-slate-900">Ceiling Fans / ACs</div>
                  <div className="text-lg font-bold text-slate-800">180 units</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="font-semibold text-slate-900">Spare Mattresses</div>
                  <div className="text-lg font-bold text-slate-800">22 units</div>
                </div>
              </div>
              <button type="button" onClick={() => toast.success('Requisition form download triggered')} className="bg-purple-600 hover:bg-purple-700 text-white rounded px-4 py-1.5 font-semibold w-full text-center">
                Download Requisition Template
              </button>
            </div>
          )
        };

      case '/hostel/visitors':
        return {
          title: 'Guest & Visitor Management',
          icon: <Users className="w-5 h-5 text-teal-600" />,
          description: 'Record entry logs for parents, sibling visits, and generate temporary gate pass prints.',
          render: (
            <div className="space-y-3">
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <div className="font-bold text-slate-900 mb-2">Gate Pass Registry</div>
                <div className="grid grid-cols-2 gap-2 mb-2.5">
                  <input type="text" placeholder="Visitor Name" className="border border-slate-300 rounded p-1 outline-none" />
                  <input type="text" placeholder="Relationship to Student" className="border border-slate-300 rounded p-1 outline-none" />
                  <input type="text" placeholder="Contact Number" className="border border-slate-300 rounded p-1 outline-none" />
                  <input type="text" placeholder="Student Roll No" className="border border-slate-300 rounded p-1 outline-none" />
                </div>
                <button type="button" onClick={() => toast.success('Gate pass registered')} className="bg-teal-600 hover:bg-teal-700 text-white rounded px-4 py-1.5 font-semibold w-full">
                  Create Digital Gate Pass
                </button>
              </div>
            </div>
          )
        };

      case '/hostel/staff':
        return {
          title: 'Staff & Warden Management',
          icon: <Shield className="w-5 h-5 text-indigo-600" />,
          description: 'Housekeeping roster scheduling, warden shift duties, and guard entry logs.',
          render: (
            <div className="space-y-3">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">Warden Block-A (Boys)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Mr. Satish Chandra | On Duty</div>
                </div>
                <span className="bg-green-50 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded border border-green-200">Active</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">Warden Block-B (Girls)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Mrs. Shobha Sen | Shift: 08 AM - 08 PM</div>
                </div>
                <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200">Offline</span>
              </div>
              <button type="button" onClick={() => toast.success('Housekeeping duty roster exported')} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-1 font-semibold w-full text-center">
                Download Housekeeping Roster
              </button>
            </div>
          )
        };

      case '/hostel/rules':
        return {
          title: 'Rules & Discipline Management',
          icon: <AlertTriangle className="w-5 h-5 text-rose-600" />,
          description: 'Digital code of conduct registry. Log student rule violations, warnings, or collect fines.',
          render: (
            <div className="space-y-3">
              <div className="font-bold text-slate-900">Violation Records</div>
              {violations.map((item) => (
                <div key={item.id} className="border border-slate-200 rounded-lg p-2.5 bg-white flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">{item.student} <span className="text-[9px] font-mono text-slate-400">Room: {item.room}</span></div>
                    <div className="text-[9px] text-slate-500 mt-0.5">{item.offense} | Fine: <span className="font-bold">{item.fine}</span></div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    item.status === 'Resolved' ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
              <button type="button" onClick={() => toast.success('Discipline guidelines updated')} className="bg-rose-600 hover:bg-rose-700 text-white rounded px-3 py-1 font-semibold w-full text-center">
                Publish Code of Conduct Rules
              </button>
            </div>
          )
        };

      case '/hostel/medical':
        return {
          title: 'Health & Medical Records',
          icon: <Activity className="w-5 h-5 text-red-600" />,
          description: 'Track student sick bay logs, regular medication checklists, doctor consultations, and emergency contacts.',
          render: (
            <div className="space-y-3">
              <div className="bg-red-50/50 border border-red-200 text-red-800 rounded-lg p-3 flex items-start gap-2">
                <Activity className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold">Emergency stock status:</span> First aid kits, common painkillers, and seasonal medicines are fully stocked. Emergency vehicle contact: +91-9988776655.
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg p-2.5 bg-white">
                <div className="font-bold text-slate-900 mb-1">Recent Consultations</div>
                <div className="divide-y divide-slate-100 text-[10px]">
                  <div className="py-1">Amit Kumar (High Fever) - Prescribed Paracetamol 650mg | 1d ago</div>
                  <div className="py-1">Rahul Singh (Sprained ankle) - Bandaged | 3d ago</div>
                </div>
              </div>
            </div>
          )
        };

      case '/hostel/portal':
        return {
          title: 'Student & Parent Portal (App/Web)',
          icon: <Smartphone className="w-5 h-5 text-blue-600" />,
          description: 'Configure student portal permissions, parent access rules, and push update notifications.',
          render: (
            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-600">
                Warden controls for Portal features. Toggling options below syncs accessibility rules for mobile apps instantly.
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span>Allow students to request leave outpasses from mobile apps</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span>Send WhatsApp alerts to parents on student curfew check-in</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span>Display monthly mess bill card on parent home dashboards</span>
                </label>
              </div>
            </div>
          )
        };

      case '/hostel/alerts':
        return {
          title: 'Smart Alerts & Notifications',
          icon: <Bell className="w-5 h-5 text-indigo-600" />,
          description: 'Push custom announcements to hostellers or trigger auto-reminders for pending dues or curfew warnings.',
          render: (
            <div className="space-y-3">
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <div className="font-bold text-slate-900 mb-2">Publish New Announcement</div>
                <textarea rows={2} placeholder="Write warning or notification details here..." className="w-full border border-slate-300 rounded p-1.5 text-[11px] mb-2 outline-none" />
                <button type="button" onClick={() => toast.success('Announcement broadcasted')} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-1.5 font-semibold w-full">
                  Broadcast Alert (SMS & App)
                </button>
              </div>
            </div>
          )
        };

      case '/hostel/reports':
        return {
          title: 'Advanced Reports & Analytics',
          icon: <AreaChart className="w-5 h-5 text-violet-600" />,
          description: 'Export 50+ modular reports including occupancy percentage, monthly revenue, complaint logs, and mess consumption graphs.',
          render: (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => toast.success('Occupancy report compiled')} className="p-2 border border-slate-200 rounded-lg text-center hover:bg-slate-50 transition cursor-pointer">
                  Occupancy Trends
                </button>
                <button onClick={() => toast.success('Revenue report compiled')} className="p-2 border border-slate-200 rounded-lg text-center hover:bg-slate-50 transition cursor-pointer">
                  Revenue Statements
                </button>
                <button onClick={() => toast.success('Mess feedback report compiled')} className="p-2 border border-slate-200 rounded-lg text-center hover:bg-slate-50 transition cursor-pointer">
                  Mess Feedback Metrics
                </button>
                <button onClick={() => toast.success('Attendance summary compiled')} className="p-2 border border-slate-200 rounded-lg text-center hover:bg-slate-50 transition cursor-pointer">
                  Attendance Reports
                </button>
              </div>
            </div>
          )
        };

      case '/hostel/rbac':
        return {
          title: 'Role-Based Access Control (RBAC)',
          icon: <Key className="w-5 h-5 text-emerald-600" />,
          description: 'Configure modular permissions for Super Admin, Wardens, Accountants, Housekeeping, and Gate Guards.',
          render: (
            <div className="space-y-3">
              <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-[10px] space-y-1">
                <div className="font-bold text-slate-800 border-b pb-0.5">Warden Permissions:</div>
                <div className="text-slate-600">✓ Mark Attendance, Allocate Rooms, Approve Outpasses</div>
                <div className="text-slate-600">✗ Modify Room Rent Tariffs, Delete Master Rules</div>
              </div>
              <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-[10px] space-y-1">
                <div className="font-bold text-slate-800 border-b pb-0.5">Gate Guard Permissions:</div>
                <div className="text-slate-600">✓ View Approved Outpasses, Register Guest Entries</div>
                <div className="text-slate-600">✗ View Student Medical Conditions / Fee Invoices</div>
              </div>
              <button type="button" onClick={() => toast.success('Permissions mapping saved')} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded px-3 py-1.5 font-semibold w-full">
                Save RBAC Configuration
              </button>
            </div>
          )
        };

      default:
        return {
          title: 'Hostel Management Module',
          icon: <Grid className="w-5 h-5 text-blue-600" />,
          description: 'Select any submenu to access specialized hostel modules.',
          render: (
            <div className="py-12 text-center text-slate-400 font-medium">
              Click on a specific submenu in the left sidebar to view the operational dashboard.
            </div>
          )
        };
    }
  };

  const currentModule = getModuleConfig();

  return (
    <div className="flex flex-col gap-4 p-1.5 md:p-3 text-[11px] font-sans antialiased text-slate-800">
      
      {/* ── HEADER BREADCRUMB & PANEL ── */}
      <div className="flex items-center justify-between bg-white border border-slate-200 shadow-sm rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            {currentModule.icon}
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Hostel Management System</div>
            <h1 className="text-base font-bold text-slate-900 mt-0.5">{currentModule.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {path === '/hostel/dashboard' && (
            <button
              onClick={fetchDashboardStats}
              disabled={dashboardLoading}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 text-slate-700 font-bold px-2.5 py-1 rounded-lg border border-slate-300 transition cursor-pointer text-[10px] select-none"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${dashboardLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </button>
          )}
          <div className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded border border-blue-200 select-none">
            Module Active
          </div>
        </div>
      </div>

      {/* ── MODULE SPECIFIC INTERACTIVE VIEW ── */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
        <p className="text-[11px] text-slate-500 mb-4 border-b pb-3">{currentModule.description}</p>
        
        {currentModule.render}
      </div>

    </div>
  );
};

export default HostelPlaceholder;
