import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface StudentAttendanceRecord {
  student_id: number;
  full_name: string;
  admission_number: string;
  roll_number: string | null;
  class_name: string;
  section: string;
  route_id: number;
  route_name: string;
  route_code: string;
  stop_id: number;
  stop_name: string;
  attendance_id: number | null;
  status_id: number;
  check_in_time: string;
  check_out_time: string;
  remarks: string;
}

interface DriverAttendanceRecord {
  driver_id: number;
  full_name: string;
  employee_id: string;
  phone_number: string;
  vehicle_number: string;
  attendance_id: number | null;
  status_id: number;
  remarks: string;
}

interface VehicleAttendanceRecord {
  vehicle_id: number;
  vehicle_number: string;
  model: string;
  vehicle_type: string;
  attendance_id: number | null;
  status_id: number;
  remarks: string;
}

interface AbsentStudentSummary {
  student_id: number;
  full_name: string;
  class_name: string;
  route: string;
  stop: string;
  status: string;
  remarks: string | null;
}

interface SummaryStats {
  student_stats: {
    total: number;
    present: number;
    absent: number;
    leave: number;
    half_day: number;
    unmarked: number;
    present_percentage: number;
  };
  driver_stats: {
    total: number;
    present: number;
    absent: number;
    leave: number;
  };
  vehicle_stats: {
    total: number;
    active: number;
    maintenance: number;
    idle: number;
  };
  absent_students: AbsentStudentSummary[];
}

interface MasterOption {
  id: number;
  name: string;
  alias: string;
}

interface TransportRoute {
  id: number;
  route_name: string;
  route_code: string;
}

const TransportAttendanceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'student' | 'driver' | 'vehicle' | 'summary'>('student');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Lists
  const [students, setStudents] = useState<StudentAttendanceRecord[]>([]);
  const [drivers, setDrivers] = useState<DriverAttendanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<VehicleAttendanceRecord[]>([]);

  // Masters
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [attendanceStatuses, setAttendanceStatuses] = useState<MasterOption[]>([]);
  const [vehicleStatuses, setVehicleStatuses] = useState<MasterOption[]>([]);

  // Summary Report Stats
  const [summary, setSummary] = useState<SummaryStats | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchMastersAndInitialData();
  }, []);

  useEffect(() => {
    fetchActiveTabData();
  }, [selectedDate, activeTab]);

  const fetchMastersAndInitialData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/transport-attendance/masters');
      if (res.data.success) {
        const d = res.data.data;
        setRoutes(d.routes || []);
        setAttendanceStatuses(d.attendance_statuses || []);
        setVehicleStatuses(d.vehicle_statuses || []);
      }
      await fetchActiveTabData();
    } catch (error) {
      console.error('Error loading attendance masters:', error);
      toast.error('Failed to load master status options');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveTabData = async () => {
    setLoading(true);
    try {
      const params = { date: selectedDate };
      
      if (activeTab === 'student') {
        const res = await api.get('/school/transport-attendance/students', { params });
        if (res.data.success) setStudents(res.data.data);
      } else if (activeTab === 'driver') {
        const res = await api.get('/school/transport-attendance/drivers', { params });
        if (res.data.success) setDrivers(res.data.data);
      } else if (activeTab === 'vehicle') {
        const res = await api.get('/school/transport-attendance/vehicles', { params });
        if (res.data.success) setVehicles(res.data.data);
      }
      
      // Load summary in parallel
      const summaryRes = await api.get('/school/transport-attendance/summary', { params });
      if (summaryRes.data.success) {
        setSummary(summaryRes.data.data);
      }
    } catch (error) {
      console.error('Error loading attendance list:', error);
    } finally {
      setLoading(false);
    }
  };

  // Status updates in local lists
  const handleStudentStatusChange = (studentId: number, statusId: number) => {
    setStudents(prev =>
      prev.map(s => (s.student_id === studentId ? { ...s, status_id: statusId } : s))
    );
  };

  const handleStudentFieldChange = (studentId: number, field: 'check_in_time' | 'check_out_time' | 'remarks', value: string) => {
    setStudents(prev =>
      prev.map(s => (s.student_id === studentId ? { ...s, [field]: value } : s))
    );
  };

  const handleDriverStatusChange = (driverId: number, statusId: number) => {
    setDrivers(prev =>
      prev.map(d => (d.driver_id === driverId ? { ...d, status_id: statusId } : d))
    );
  };

  const handleDriverRemarksChange = (driverId: number, val: string) => {
    setDrivers(prev =>
      prev.map(d => (d.driver_id === driverId ? { ...d, remarks: val } : d))
    );
  };

  const handleVehicleStatusChange = (vehicleId: number, statusId: number) => {
    setVehicles(prev =>
      prev.map(v => (v.vehicle_id === vehicleId ? { ...v, status_id: statusId } : v))
    );
  };

  const handleVehicleRemarksChange = (vehicleId: number, val: string) => {
    setVehicles(prev =>
      prev.map(v => (v.vehicle_id === vehicleId ? { ...v, remarks: val } : v))
    );
  };

  // "Mark All Present" Action
  const handleMarkAllPresent = () => {
    const presentMaster = attendanceStatuses.find(s => s.name.toUpperCase() === 'PRESENT');
    if (!presentMaster) {
      toast.error('Present status master option not found');
      return;
    }

    if (activeTab === 'student') {
      setStudents(prev => prev.map(s => ({ ...s, status_id: presentMaster.id })));
      toast.success('Marked all student lists as Present locally');
    } else if (activeTab === 'driver') {
      setDrivers(prev => prev.map(d => ({ ...d, status_id: presentMaster.id })));
      toast.success('Marked all drivers as Present locally');
    } else if (activeTab === 'vehicle') {
      const activeMaster = vehicleStatuses.find(s => s.name.toUpperCase() === 'ACTIVE');
      if (activeMaster) {
        setVehicles(prev => prev.map(v => ({ ...v, status_id: activeMaster.id })));
        toast.success('Marked all vehicles as Active locally');
      }
    }
  };

  // "Save Attendance" API POST handler
  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      let res;
      const payload: any = { date: selectedDate };

      if (activeTab === 'student') {
        payload.attendance = students.map(s => ({
          student_id: s.student_id,
          route_id: s.route_id,
          stop_id: s.stop_id,
          status_id: s.status_id,
          check_in_time: s.check_in_time,
          check_out_time: s.check_out_time,
          remarks: s.remarks,
        }));
        res = await api.post('/school/transport-attendance/students', payload);
      } else if (activeTab === 'driver') {
        payload.attendance = drivers.map(d => ({
          driver_id: d.driver_id,
          status_id: d.status_id,
          remarks: d.remarks,
        }));
        res = await api.post('/school/transport-attendance/drivers', payload);
      } else if (activeTab === 'vehicle') {
        payload.attendance = vehicles.map(v => ({
          vehicle_id: v.vehicle_id,
          status_id: v.status_id,
          remarks: v.remarks,
        }));
        res = await api.post('/school/transport-attendance/vehicles', payload);
      }

      if (res && res.data.success) {
        toast.success('Attendance saved successfully!');
        // Refresh summary stats
        const summaryRes = await api.get('/school/transport-attendance/summary', { params: { date: selectedDate } });
        if (summaryRes.data.success) {
          setSummary(summaryRes.data.data);
        }
      }
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      toast.error(error.response?.data?.message || 'Failed to save attendance logs');
    } finally {
      setSaving(false);
    }
  };

  // Reset filter selections
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedRouteFilter('');
    setSelectedStatusFilter('');
  };

  // Local Table Search & Filter logic
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.admission_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.route_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRoute = selectedRouteFilter ? s.route_id.toString() === selectedRouteFilter : true;
    const matchesStatus = selectedStatusFilter ? s.status_id.toString() === selectedStatusFilter : true;
    return matchesSearch && matchesRoute && matchesStatus;
  });

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.phone_number.includes(searchQuery) ||
                          d.employee_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatusFilter ? d.status_id.toString() === selectedStatusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.vehicle_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatusFilter ? v.status_id.toString() === selectedStatusFilter : true;
    return matchesSearch && matchesStatus;
  });

  // Badge styler for Status select cell
  const getStatusBadgeColor = (statusName: string) => {
    const clean = statusName.toUpperCase();
    if (clean === 'PRESENT' || clean === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (clean === 'ABSENT' || clean === 'OUT OF SERVICE' || clean === 'OUT_OF_SERVICE') return 'bg-rose-50 text-rose-700 border-rose-100';
    if (clean === 'LEAVE' || clean === 'ON LEAVE' || clean === 'ON_LEAVE' || clean === 'IDLE') return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    return 'bg-amber-50 text-amber-700 border-amber-100'; // Half day / Maintenance / Late
  };

  const stdStats = summary?.student_stats;
  const drvStats = summary?.driver_stats;
  const vehStats = summary?.vehicle_stats;

  return (
    <div className="space-y-3 text-xs">
      {/* Header Info Panel */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-xs">
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">📋 Daily Transport Attendance Registers</h3>
          <p className="text-[12px] text-gray-500">Record check-ins, boarding times, driver shifts, and vehicle operations logs dynamically.</p>
        </div>
      </div>

      {/* Top Indicators Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Total Students</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">{stdStats?.total || 0}</div>
          </div>
          <span className="text-xl">👨‍🎓</span>
        </div>
        <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between shadow-xs border-l-4 border-l-emerald-500">
          <div>
            <div className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider">Present</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">{stdStats?.present || 0}</div>
          </div>
          <span className="text-xl">✅</span>
        </div>
        <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between shadow-xs border-l-4 border-l-rose-500">
          <div>
            <div className="text-[8px] font-bold text-rose-600 uppercase tracking-wider">Absent</div>
            <div className="text-xl font-black text-rose-700 mt-0.5">{stdStats?.absent || 0}</div>
          </div>
          <span className="text-xl">❌</span>
        </div>
        <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between shadow-xs border-l-4 border-l-indigo-500">
          <div>
            <div className="text-[8px] font-bold text-indigo-600 uppercase tracking-wider">On Leave</div>
            <div className="text-xl font-black text-indigo-700 mt-0.5">{stdStats?.leave || 0}</div>
          </div>
          <span className="text-xl">🟣</span>
        </div>
        <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between shadow-xs border-l-4 border-l-amber-500">
          <div>
            <div className="text-[8px] font-bold text-amber-600 uppercase tracking-wider">Half Day</div>
            <div className="text-xl font-black text-amber-700 mt-0.5">{stdStats?.half_day || 0}</div>
          </div>
          <span className="text-xl">🟡</span>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-2.5 rounded-lg flex flex-col justify-between shadow-xs">
          <div className="text-[8px] font-bold uppercase tracking-wider opacity-80">Boarding %</div>
          <div className="text-xl font-black mt-0.5">{stdStats?.present_percentage || 0}%</div>
        </div>
      </div>

      {/* Date & Save Actions row */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-gray-200 rounded-lg p-2 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500 text-[10px] uppercase">Attendance Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-gray-700 h-[28px] w-36"
          />
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-2.5 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 bg-white cursor-pointer h-[28px]"
          >
            Today
          </button>
        </div>

        {activeTab !== 'summary' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllPresent}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs transition cursor-pointer shadow-xs h-[28px]"
            >
              ✓ Mark All Present
            </button>
            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs transition cursor-pointer shadow-xs h-[28px] disabled:opacity-50"
            >
              {saving ? 'Saving...' : '💾 Save Attendance'}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-lg p-1 gap-1 shadow-xs">
        <button
          onClick={() => setActiveTab('student')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'student' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          👨‍🎓 Student Attendance
        </button>
        <button
          onClick={() => setActiveTab('driver')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'driver' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          👮 Driver Shifts
        </button>
        <button
          onClick={() => setActiveTab('vehicle')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'vehicle' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          🚌 Vehicle Daily Log
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'summary' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          📊 Summary Report
        </button>
      </div>

      {activeTab !== 'summary' ? (
        <>
          {/* Toolbar filters */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search by name, class, or route..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-2 py-1 w-64 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-gray-700 h-[28px]"
                />
              </div>

              {activeTab === 'student' && (
                <div className="w-48">
                  <select
                    value={selectedRouteFilter}
                    onChange={(e) => setSelectedRouteFilter(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-gray-700 h-[28px]"
                  >
                    <option value="">All Routes</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.route_name} ({r.route_code})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="w-36">
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-gray-700 h-[28px]"
                >
                  <option value="">All Statuses</option>
                  {activeTab === 'vehicle'
                    ? vehicleStatuses.map(s => (
                        <option key={s.id} value={s.id}>{s.alias}</option>
                      ))
                    : attendanceStatuses.map(s => (
                        <option key={s.id} value={s.id}>{s.alias}</option>
                      ))}
                </select>
              </div>

              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition cursor-pointer bg-white h-[28px] font-semibold"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* List View Container */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-8 text-center text-gray-500 font-bold">Loading logs...</div>
            ) : activeTab === 'student' ? (
              filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No students matching criteria found.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white text-[10px] uppercase font-extrabold tracking-wider">
                      <th className="p-2.5 pl-4">Student Details</th>
                      <th className="p-2.5">Route & Boarding Stop</th>
                      <th className="p-2.5 w-48 text-center">Boarding Status</th>
                      <th className="p-2.5 w-28 text-center">Check-in</th>
                      <th className="p-2.5 w-28 text-center">Check-out</th>
                      <th className="p-2.5">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {filteredStudents.map(s => {
                      const stat = attendanceStatuses.find(o => o.id === s.status_id);
                      const statusName = stat ? stat.alias : 'Unmarked';
                      
                      return (
                        <tr key={s.student_id} className="hover:bg-slate-50 transition duration-150">
                          <td className="p-2 pl-4">
                            <div className="font-bold text-gray-900 text-[12px]">{s.full_name}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              Adm: <span className="font-medium text-slate-800">{s.admission_number}</span> | 
                              Class: <span className="font-medium text-slate-800">{s.class_name} - {s.section}</span> | 
                              Roll: <span className="font-medium text-slate-800">{s.roll_number || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="font-semibold text-slate-800">{s.route_name}</div>
                            <div className="text-[10px] text-slate-500">Stop: {s.stop_name}</div>
                          </td>
                          <td className="p-2 text-center">
                            <select
                              value={s.status_id || ''}
                              onChange={(e) => handleStudentStatusChange(s.student_id, parseInt(e.target.value))}
                              className={`w-full px-2 py-0.5 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 transition font-bold text-center h-[23px] cursor-pointer ${getStatusBadgeColor(statusName)}`}
                            >
                              <option value="">Select Status</option>
                              {attendanceStatuses.map(opt => (
                                <option key={opt.id} value={opt.id} className="bg-white text-slate-800 font-normal">{opt.alias}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              value={s.check_in_time}
                              onChange={(e) => handleStudentFieldChange(s.student_id, 'check_in_time', e.target.value)}
                              placeholder="07:30 AM"
                              className="w-full text-center px-1.5 py-0.5 text-[10px] border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-gray-800 h-[23px]"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              value={s.check_out_time}
                              onChange={(e) => handleStudentFieldChange(s.student_id, 'check_out_time', e.target.value)}
                              placeholder="02:30 PM"
                              className="w-full text-center px-1.5 py-0.5 text-[10px] border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-gray-800 h-[23px]"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={s.remarks}
                              onChange={(e) => handleStudentFieldChange(s.student_id, 'remarks', e.target.value)}
                              placeholder="Remarks (optional)..."
                              className="w-full px-1.5 py-0.5 text-[10px] border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-gray-800 h-[23px]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            ) : activeTab === 'driver' ? (
              filteredDrivers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No active drivers found.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white text-[10px] uppercase font-extrabold tracking-wider">
                      <th className="p-2.5 pl-4">Driver Details</th>
                      <th className="p-2.5">Assigned Vehicle</th>
                      <th className="p-2.5 w-48 text-center">Shift Status</th>
                      <th className="p-2.5">Shift Notes / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {filteredDrivers.map(d => {
                      const stat = attendanceStatuses.find(o => o.id === d.status_id);
                      const statusName = stat ? stat.alias : 'Unmarked';

                      return (
                        <tr key={d.driver_id} className="hover:bg-slate-50 transition duration-150">
                          <td className="p-2 pl-4">
                            <div className="font-bold text-gray-900 text-[12px]">{d.full_name}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              Emp ID: <span className="font-medium text-slate-800">{d.employee_id}</span> | 
                              Phone: <span className="font-medium text-slate-800">{d.phone_number}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="font-semibold text-slate-800">{d.vehicle_number}</div>
                          </td>
                          <td className="p-2 text-center">
                            <select
                              value={d.status_id || ''}
                              onChange={(e) => handleDriverStatusChange(d.driver_id, parseInt(e.target.value))}
                              className={`w-full px-2 py-0.5 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 transition font-bold text-center h-[23px] cursor-pointer ${getStatusBadgeColor(statusName)}`}
                            >
                              <option value="">Select Status</option>
                              {attendanceStatuses.map(opt => (
                                <option key={opt.id} value={opt.id} className="bg-white text-slate-800 font-normal">{opt.alias}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={d.remarks}
                              onChange={(e) => handleDriverRemarksChange(d.driver_id, e.target.value)}
                              placeholder="Enter shift notes..."
                              className="w-full px-1.5 py-0.5 text-[10px] border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-gray-800 h-[23px]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            ) : (
              /* Vehicle Daily Log */
              filteredVehicles.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No active vehicles registered.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white text-[10px] uppercase font-extrabold tracking-wider">
                      <th className="p-2.5 pl-4">Vehicle Details</th>
                      <th className="p-2.5">Model & Type</th>
                      <th className="p-2.5 w-48 text-center">Operational Status</th>
                      <th className="p-2.5">Run Log Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {filteredVehicles.map(v => {
                      const stat = vehicleStatuses.find(o => o.id === v.status_id);
                      const statusName = stat ? stat.alias : 'Unmarked';

                      return (
                        <tr key={v.vehicle_id} className="hover:bg-slate-50 transition duration-150">
                          <td className="p-2 pl-4">
                            <div className="font-bold text-gray-900 text-[12px]">{v.vehicle_number}</div>
                          </td>
                          <td className="p-2">
                            <div className="font-semibold text-slate-800">{v.model}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">Type: {v.vehicle_type}</div>
                          </td>
                          <td className="p-2 text-center">
                            <select
                              value={v.status_id || ''}
                              onChange={(e) => handleVehicleStatusChange(v.vehicle_id, parseInt(e.target.value))}
                              className={`w-full px-2 py-0.5 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 transition font-bold text-center h-[23px] cursor-pointer ${getStatusBadgeColor(statusName)}`}
                            >
                              <option value="">Select Status</option>
                              {vehicleStatuses.map(opt => (
                                <option key={opt.id} value={opt.id} className="bg-white text-slate-800 font-normal">{opt.alias}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={v.remarks}
                              onChange={(e) => handleVehicleRemarksChange(v.vehicle_id, e.target.value)}
                              placeholder="e.g. Completed route with no issues..."
                              className="w-full px-1.5 py-0.5 text-[10px] border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-gray-800 h-[23px]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            )}
          </div>
        </>
      ) : (
        /* Summary Report tab */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Student boarding details */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-xs">
              <h4 className="font-bold text-gray-800 text-[12px] mb-2.5 border-b border-gray-100 pb-1 flex justify-between items-center">
                <span>🎓 Boarding Students Ratio</span>
                <span className="text-indigo-600 text-[10px]">{stdStats?.present_percentage || 0}% recovery</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px] mb-2">
                <div className="bg-slate-50 p-2 rounded">
                  <span className="text-slate-400 font-bold block text-[8px] uppercase tracking-wider">Total</span>
                  <span className="text-sm font-black text-slate-800">{stdStats?.total || 0}</span>
                </div>
                <div className="bg-emerald-50 p-2 rounded">
                  <span className="text-emerald-500 font-bold block text-[8px] uppercase tracking-wider">Present</span>
                  <span className="text-sm font-black text-emerald-700">{stdStats?.present || 0}</span>
                </div>
                <div className="bg-rose-50 p-2 rounded">
                  <span className="text-rose-500 font-bold block text-[8px] uppercase tracking-wider">Absent</span>
                  <span className="text-sm font-black text-rose-700">{stdStats?.absent || 0}</span>
                </div>
                <div className="bg-indigo-50 p-2 rounded">
                  <span className="text-indigo-500 font-bold block text-[8px] uppercase tracking-wider">On Leave</span>
                  <span className="text-sm font-black text-indigo-700">{stdStats?.leave || 0}</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded overflow-hidden flex">
                <div className="bg-emerald-500 h-full" style={{ width: `${stdStats?.total ? (stdStats.present / stdStats.total) * 100 : 0}%` }} title="Present" />
                <div className="bg-rose-500 h-full" style={{ width: `${stdStats?.total ? (stdStats.absent / stdStats.total) * 100 : 0}%` }} title="Absent" />
                <div className="bg-indigo-500 h-full" style={{ width: `${stdStats?.total ? (stdStats.leave / stdStats.total) * 100 : 0}%` }} title="Leave" />
                <div className="bg-amber-400 h-full" style={{ width: `${stdStats?.total ? (stdStats.half_day / stdStats.total) * 100 : 0}%` }} title="Half Day" />
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 mt-2 font-semibold">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500 inline-block" /> Present ({stdStats?.present || 0})</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500 inline-block" /> Absent ({stdStats?.absent || 0})</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-indigo-500 inline-block" /> Leave ({stdStats?.leave || 0})</span>
              </div>
            </div>

            {/* Drivers attendance summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-xs">
              <h4 className="font-bold text-gray-800 text-[12px] mb-2.5 border-b border-gray-100 pb-1">👮 Driver Shift Ratios</h4>
              <div className="space-y-3.5 mt-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-700">Total Registered Drivers</span>
                  <span className="font-bold text-slate-900">{drvStats?.total || 0}</span>
                </div>
                <div className="flex justify-between gap-2 text-[10px]">
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded flex-1 text-center">
                    <span className="font-black text-emerald-600 block text-base">{drvStats?.present || 0}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Active</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded flex-1 text-center">
                    <span className="font-black text-rose-600 block text-base">{drvStats?.absent || 0}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Absent</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded flex-1 text-center">
                    <span className="font-black text-indigo-600 block text-base">{drvStats?.leave || 0}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Leave</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicles running stats */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-xs">
              <h4 className="font-bold text-gray-800 text-[12px] mb-2.5 border-b border-gray-100 pb-1">🚌 Operational Vehicle Logs</h4>
              <div className="space-y-3.5 mt-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-700">Active Fleet Count</span>
                  <span className="font-bold text-slate-900">{vehStats?.total || 0} Buses</span>
                </div>
                <div className="flex justify-between gap-2 text-[10px]">
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded flex-1 text-center">
                    <span className="font-black text-emerald-600 block text-base">{vehStats?.active || 0}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Running</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded flex-1 text-center">
                    <span className="font-black text-amber-600 block text-base">{vehStats?.maintenance || 0}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Service</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded flex-1 text-center">
                    <span className="font-black text-indigo-600 block text-base">{vehStats?.idle || 0}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Idle</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Absent Students Panel */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-xs">
            <h4 className="font-bold text-gray-800 text-[12px] mb-2 border-b border-gray-100 pb-1">🚨 Absent & Leave Students Checklist</h4>
            {summary?.absent_students.length === 0 ? (
              <div className="text-center p-6 text-emerald-600 font-bold text-[11px]">All students present! No absences or leaves recorded for this day.</div>
            ) : (
              <table className="w-full text-left border-collapse text-[10px] mt-1">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500">
                    <th className="p-2 pl-4">Student</th>
                    <th className="p-2">Class</th>
                    <th className="p-2">Route</th>
                    <th className="p-2">Stop</th>
                    <th className="p-2 text-center">Status</th>
                    <th className="p-2">Reason / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary?.absent_students.map(a => (
                    <tr key={a.student_id} className="hover:bg-slate-50">
                      <td className="p-2 pl-4 font-bold text-slate-800">{a.full_name}</td>
                      <td className="p-2 text-slate-600">{a.class_name}</td>
                      <td className="p-2 text-slate-600">{a.route}</td>
                      <td className="p-2 text-slate-600">{a.stop}</td>
                      <td className="p-2 text-center">
                        <span className={`inline-block px-2 py-0.2 rounded-full text-[9px] font-bold border ${getStatusBadgeColor(a.status)}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="p-2 text-slate-500 italic">{a.remarks || 'No reason provided.'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportAttendanceManager;
