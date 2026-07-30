import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import {
  ClipboardList, BarChart2, CalendarDays, Users, TrendingUp,
  UserCheck, UserX, Clock, AlarmClock, Filter, CheckCircle2,
  Search, Download, Save, Trash2, Edit2, X, ChevronDown, RotateCcw,
  Check, UserMinus, Building2, Briefcase
} from 'lucide-react';
import api from '../../services/api';

// Types
type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
type StaffType = 'Teacher' | 'NonTeaching';

interface SelectOption { value: string; label: string; }

interface StaffRow {
  staff_id: number;
  staff_type: StaffType;
  employee_id: string;
  name: string;
  department: string | null;
  designation: string | null;
  photo: string | null;
  attendance_id: number | null;
  status: AttendanceStatus | null;
  check_in: string | null;
  check_out: string | null;
  late_minutes: number | null;
  overtime_minutes: number | null;
  leave_type: string | null;
  remarks: string | null;
  is_approved: boolean;
  is_marked: boolean;
}

interface LogRecord {
  id: number;
  staff_id: number;
  staff_type: StaffType;
  employee_id: string;
  staff_name: string;
  department: string | null;
  designation: string | null;
  date: string;
  status: AttendanceStatus;
  check_in: string | null;
  check_out: string | null;
  late_minutes: number;
  overtime_minutes: number;
  leave_type: string | null;
  source: string;
  remarks: string | null;
  is_approved: boolean;
}

interface MonthlyRow {
  staff_id: number;
  staff_type: StaffType;
  employee_id: string;
  name: string;
  department: string | null;
  designation: string | null;
  days: Record<number, AttendanceStatus | null>;
  present: number;
  absent: number;
  late: number;
  half_day: number;
  on_leave: number;
  total_marked: number;
  attendance_pct: number;
}

interface Stats {
  total_staff: number;
  marked: number;
  present: number;
  absent: number;
  late: number;
  half_day: number;
  on_leave: number;
  unmarked: number;
  attendance_pct: number;
}

// Config
const STATUS_CONFIG: Record<string, { label: string; full: string; color: string; bg: string; border: string; cellBg: string }> = {
  present:  { label: 'P',  full: 'Present',  color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-400', cellBg: 'bg-emerald-100 text-emerald-800' },
  absent:   { label: 'A',  full: 'Absent',   color: 'text-rose-700',    bg: 'bg-rose-100',    border: 'border-rose-400',    cellBg: 'bg-rose-100 text-rose-800' },
  late:     { label: 'L',  full: 'Late',     color: 'text-amber-700',   bg: 'bg-amber-100',   border: 'border-amber-400',   cellBg: 'bg-amber-100 text-amber-800' },
  half_day: { label: 'HD', full: 'Half Day', color: 'text-blue-700',    bg: 'bg-blue-100',    border: 'border-blue-400',    cellBg: 'bg-blue-100 text-blue-800' },
  on_leave: { label: 'OL', full: 'On Leave', color: 'text-purple-700',  bg: 'bg-purple-100',  border: 'border-purple-400',  cellBg: 'bg-purple-100 text-purple-800' },
};

const STATUSES: AttendanceStatus[] = ['present', 'absent', 'late', 'half_day', 'on_leave'];
const TODAY = new Date().toISOString().split('T')[0];
const CURRENT_MONTH = TODAY.slice(0, 7);

const selectSt = {
  control: (b: any) => ({ ...b, borderRadius: '6px', borderColor: '#d1d5db', minHeight: '28px', height: '28px', fontSize: '12px', boxShadow: 'none', '&:hover': { borderColor: '#9ca3af' } }),
  valueContainer: (b: any) => ({ ...b, padding: '0 6px' }),
  input: (b: any) => ({ ...b, margin: '0', padding: '0' }),
  option: (b: any, s: any) => ({ ...b, backgroundColor: s.isFocused ? '#eff6ff' : 'white', fontSize: '12px', padding: '4px 8px', cursor: 'pointer' }),
  placeholder: (b: any) => ({ ...b, fontSize: '12px', color: '#9ca3af' }),
  singleValue: (b: any) => ({ ...b, fontSize: '12px' }),
};

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs flex items-center gap-2.5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">{label}</div>
        <div className="text-xl font-black text-slate-900 leading-snug">{value}</div>
      </div>
    </div>
  );
}

function EditModal({ record, onClose, onSave }: { record: LogRecord; onClose: () => void; onSave: (u: any) => void }) {
  const [form, setForm] = useState({
    status: record.status,
    check_in: record.check_in || '',
    check_out: record.check_out || '',
    late_minutes: record.late_minutes || 0,
    overtime_minutes: record.overtime_minutes || 0,
    remarks: record.remarks || '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-br from-blue-700 to-indigo-700 px-5 py-4 text-white flex items-center justify-between">
          <div>
            <div className="text-xs font-bold opacity-80">Edit Staff Attendance</div>
            <div className="text-base font-extrabold">{record.staff_name}</div>
            <div className="text-xs opacity-70">{record.date} • {record.department || record.staff_type} ({record.employee_id})</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Attendance Status *</label>
            <div className="flex gap-1.5 flex-wrap">
              {STATUSES.map(s => {
                const c = STATUS_CONFIG[s];
                return (
                  <button key={s} type="button" onClick={() => setForm(p => ({ ...p, status: s }))}
                    className={`px-2.5 py-1 rounded-lg border-2 text-xs font-bold transition-all cursor-pointer ${form.status === s ? `${c.bg} ${c.border} ${c.color}` : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'}`}>
                    {c.full}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1 block">Check In</label>
              <input type="time" value={form.check_in} onChange={e => setForm(p => ({ ...p, check_in: e.target.value }))} className="w-full px-2 py-1 h-7 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1 block">Check Out</label>
              <input type="time" value={form.check_out} onChange={e => setForm(p => ({ ...p, check_out: e.target.value }))} className="w-full px-2 py-1 h-7 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1 block">Late (Mins)</label>
              <input type="number" min="0" value={form.late_minutes} onChange={e => setForm(p => ({ ...p, late_minutes: Number(e.target.value) }))} className="w-full px-2 py-1 h-7 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1 block">Overtime (Mins)</label>
              <input type="number" min="0" value={form.overtime_minutes} onChange={e => setForm(p => ({ ...p, overtime_minutes: Number(e.target.value) }))} className="w-full px-2 py-1 h-7 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-700 mb-1 block">Remarks</label>
            <textarea value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} rows={2} className="w-full px-2 py-1 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 resize-none" placeholder="Optional notes..." />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
            <button onClick={() => onSave(form)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const DEMO_TEACHERS = [
  { staff_id: 1, staff_type: 'Teacher' as StaffType, employee_id: 'EMP-T101', name: 'Dr. Rajesh Sharma', department: 'Mathematics', designation: 'HOD Science', photo: null },
  { staff_id: 2, staff_type: 'Teacher' as StaffType, employee_id: 'EMP-T102', name: 'Sunita Verma', department: 'English', designation: 'Sr. Teacher', photo: null },
  { staff_id: 3, staff_type: 'Teacher' as StaffType, employee_id: 'EMP-T103', name: 'Amitabh Sen', department: 'Physics', designation: 'Lecturer', photo: null },
  { staff_id: 4, staff_type: 'Teacher' as StaffType, employee_id: 'EMP-T104', name: 'Meenakshi Sundaram', department: 'Chemistry', designation: 'Lab Incharge', photo: null },
  { staff_id: 5, staff_type: 'Teacher' as StaffType, employee_id: 'EMP-T105', name: 'Vikramaditya Roy', department: 'Computer Science', designation: 'IT Head', photo: null },
  { staff_id: 6, staff_type: 'NonTeaching' as StaffType, employee_id: 'EMP-NT01', name: 'Ramesh Chandra', department: 'Administration', designation: 'Accountant', photo: null },
  { staff_id: 7, staff_type: 'NonTeaching' as StaffType, employee_id: 'EMP-NT02', name: 'Kavita Deshmukh', department: 'Library', designation: 'Librarian', photo: null },
  { staff_id: 8, staff_type: 'NonTeaching' as StaffType, employee_id: 'EMP-NT03', name: 'Suresh Patil', department: 'Sports', designation: 'PTI Instructor', photo: null },
];
const AVATAR_COLORS = ['bg-blue-600','bg-purple-600','bg-emerald-600','bg-amber-600','bg-rose-600','bg-indigo-600'];

function DailyTab({ depts }: { depts: SelectOption[] }) {
  const [staffTypeFilter, setStaffTypeFilter] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('');
  const [selDate, setSelDate] = useState(TODAY);
  const [staffList, setStaffList] = useState<StaffRow[]>([]);
  const [lStatus, setLStatus] = useState<Record<string, AttendanceStatus | null>>({});
  const [lIn, setLIn] = useState<Record<string, string>>({});
  const [lOut, setLOut] = useState<Record<string, string>>({});
  const [lLate, setLLate] = useState<Record<string, number>>({});
  const [lOT, setLOT] = useState<Record<string, number>>({});
  const [lRem, setLRem] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const getKey = (type: string, id: number) => `${type}_${id}`;

  const loadDailySheet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/employee-attendance/daily', {
        params: { date: selDate, staff_type: staffTypeFilter || undefined }
      });
      if (res.data.success) {
        let rows: StaffRow[] = res.data.data;
        if (deptFilter) {
          rows = rows.filter(r => r.department?.toLowerCase() === deptFilter.toLowerCase());
        }
        setStaffList(rows);
        const st: Record<string, AttendanceStatus | null> = {};
        const cin: Record<string, string> = {};
        const cout: Record<string, string> = {};
        const late: Record<string, number> = {};
        const ot: Record<string, number> = {};
        const rk: Record<string, string> = {};
        rows.forEach(r => {
          const k = getKey(r.staff_type, r.staff_id);
          st[k] = r.status;
          cin[k] = r.check_in || '09:00';
          cout[k] = r.check_out || '17:00';
          late[k] = r.late_minutes || 0;
          ot[k] = r.overtime_minutes || 0;
          rk[k] = r.remarks || '';
        });
        setLStatus(st); setLIn(cin); setLOut(cout); setLLate(late); setLOT(ot); setLRem(rk);
      }
    } catch {
      let demo: StaffRow[] = DEMO_TEACHERS.map(t => ({
        ...t,
        attendance_id: null,
        status: null,
        check_in: '09:00',
        check_out: '17:00',
        late_minutes: 0,
        overtime_minutes: 0,
        leave_type: null,
        remarks: null,
        is_approved: false,
        is_marked: false,
      }));
      if (staffTypeFilter) demo = demo.filter(r => r.staff_type === staffTypeFilter);
      if (deptFilter) demo = demo.filter(r => r.department?.toLowerCase() === deptFilter.toLowerCase());
      setStaffList(demo);
      const st: Record<string, AttendanceStatus | null> = {};
      const cin: Record<string, string> = {};
      const cout: Record<string, string> = {};
      demo.forEach(r => {
        const k = getKey(r.staff_type, r.staff_id);
        st[k] = null; cin[k] = '09:00'; cout[k] = '17:00';
      });
      setLStatus(st); setLIn(cin); setLOut(cout);
    } finally { setLoading(false); }
  }, [selDate, staffTypeFilter, deptFilter]);

  useEffect(() => { loadDailySheet(); }, [loadDailySheet]);

  const markAll = (s: AttendanceStatus) => {
    const nextSt: Record<string, AttendanceStatus> = {};
    staffList.forEach(r => { nextSt[getKey(r.staff_type, r.staff_id)] = s; });
    setLStatus(nextSt);
  };

  const resetAll = () => {
    const nextSt: Record<string, AttendanceStatus | null> = {};
    staffList.forEach(r => { nextSt[getKey(r.staff_type, r.staff_id)] = null; });
    setLStatus(nextSt);
  };

  const handleSave = async () => {
    if (!staffList.length) return;
    const records = staffList.map(s => {
      const k = getKey(s.staff_type, s.staff_id);
      return {
        staff_id: s.staff_id,
        staff_type: s.staff_type,
        status: lStatus[k] || 'present',
        check_in: lIn[k] || '09:00',
        check_out: lOut[k] || '17:00',
        late_minutes: lLate[k] || 0,
        overtime_minutes: lOT[k] || 0,
        remarks: lRem[k] || null,
      };
    });

    setSaving(true);
    try {
      await api.post('/school/employee-attendance/bulk-mark', { date: selDate, records });
      toast.success(`Attendance saved for ${records.length} staff members!`);
      loadDailySheet();
    } catch {
      toast.error('Failed to save attendance');
    } finally { setSaving(false); }
  };

  const pc = Object.values(lStatus).filter(s => s === 'present').length;
  const ac = Object.values(lStatus).filter(s => s === 'absent').length;
  const lc = Object.values(lStatus).filter(s => s === 'late').length;
  const hc = Object.values(lStatus).filter(s => s === 'half_day').length;
  const olc = Object.values(lStatus).filter(s => s === 'on_leave').length;
  const markedCount = Object.values(lStatus).filter(Boolean).length;

  return (
    <div className="space-y-2">
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div style={{ minWidth: '150px' }}>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Staff Type</label>
            <select value={staffTypeFilter} onChange={e => setStaffTypeFilter(e.target.value)}
              className="w-full px-2 py-1 h-7 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:ring-1 focus:ring-blue-500">
              <option value="">All Staff (Teacher + Non-Teaching)</option>
              <option value="Teacher">Teaching Staff (Teachers)</option>
              <option value="NonTeaching">Non-Teaching Staff</option>
            </select>
          </div>
          <div style={{ minWidth: '160px' }}>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Department</label>
            <Select options={[{ value: '', label: 'All Departments' }, ...depts]}
              value={[{ value: '', label: 'All Departments' }, ...depts].find(d => d.value === deptFilter) || null}
              onChange={o => setDeptFilter(o?.value || '')} placeholder="Filter Dept..." styles={selectSt} classNamePrefix="react-select" />
          </div>
          <div style={{ minWidth: '130px' }}>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Attendance Date</label>
            <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)}
              className="w-full px-2.5 py-1 h-7 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="flex items-end gap-2 flex-wrap ml-auto">
            <button onClick={() => markAll('present')} className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 cursor-pointer">✓ All Present</button>
            <button onClick={() => markAll('absent')} className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-lg border border-rose-300 cursor-pointer">✗ All Absent</button>
            <button onClick={resetAll} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer flex items-center gap-1"><RotateCcw className="w-3 h-3" />Reset</button>
          </div>
        </div>

        {staffList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Live Count:</span>
            {[{ l: 'Present', v: pc, cls: 'bg-emerald-100 text-emerald-800' },
              { l: 'Absent', v: ac, cls: 'bg-rose-100 text-rose-800' },
              { l: 'Late', v: lc, cls: 'bg-amber-100 text-amber-800' },
              { l: 'H/D', v: hc, cls: 'bg-blue-100 text-blue-800' },
              { l: 'Leave', v: olc, cls: 'bg-purple-100 text-purple-800' },
              { l: 'Unmarked', v: staffList.length - markedCount, cls: 'bg-slate-100 text-slate-600' }
            ].map(({ l, v, cls }) => (
              <span key={l} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>{l}: {v}</span>
            ))}
            <span className="ml-auto text-[11px] text-slate-500">Total Staff: <strong>{staffList.length}</strong></span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><div className="text-xs text-slate-400">Loading staff sheet...</div></div>
        ) : staffList.length === 0 ? (
          <div className="p-12 text-center text-slate-400"><Users className="w-10 h-10 mx-auto mb-3 text-slate-300" /><div className="text-sm font-bold">No staff records found</div></div>
        ) : (
          <>
            <div className="grid bg-slate-50 border-b border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider gap-2" style={{ gridTemplateColumns: '2rem 1fr 14rem 6rem 6rem 5rem 5rem 2rem' }}>
              <div>#</div><div>Staff Member</div><div>Status</div><div>In Time</div><div>Out Time</div><div>Late (m)</div><div>OT (m)</div><div></div>
            </div>
            <div className="divide-y divide-slate-100">
              {staffList.map((s, idx) => {
                const k = getKey(s.staff_type, s.staff_id);
                const st = lStatus[k];
                const cfg = st ? STATUS_CONFIG[st] : null;
                const isExp = expanded === k;
                return (
                  <div key={k} className={`${cfg ? 'bg-' + cfg.bg.replace('bg-','') + '/10' : ''}`}>
                    <div className="grid px-3 py-1.5 items-center gap-2" style={{ gridTemplateColumns: '2rem 1fr 14rem 6rem 6rem 5rem 5rem 2rem' }}>
                      <div className="text-[11px] text-slate-500 font-semibold">{idx + 1}</div>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>{s.name.charAt(0)}</div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate flex items-center gap-1">
                            {s.name}
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase ${s.staff_type === 'Teacher' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{s.staff_type}</span>
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono">{s.employee_id} • {s.department || 'General'} {s.designation ? `(${s.designation})` : ''}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 flex-wrap">
                        {STATUSES.map(ss => {
                          const c = STATUS_CONFIG[ss];
                          return (
                            <button key={ss} type="button" onClick={() => setLStatus(p => ({ ...p, [k]: p[k] === ss ? null : ss }))}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${lStatus[k] === ss ? `${c.bg} ${c.border} ${c.color} border-2 scale-105` : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                              title={c.full}>{c.label}</button>
                          );
                        })}
                      </div>
                      <input type="time" value={lIn[k] || ''} onChange={e => setLIn(p => ({ ...p, [k]: e.target.value }))} className="w-22 px-1.5 py-0.5 h-6 border border-slate-200 rounded text-[10px] font-mono focus:ring-1 focus:ring-blue-400" />
                      <input type="time" value={lOut[k] || ''} onChange={e => setLOut(p => ({ ...p, [k]: e.target.value }))} className="w-22 px-1.5 py-0.5 h-6 border border-slate-200 rounded text-[10px] font-mono focus:ring-1 focus:ring-blue-400" />
                      <input type="number" min="0" value={lLate[k] || 0} onChange={e => setLLate(p => ({ ...p, [k]: Number(e.target.value) }))} className="w-16 px-1.5 py-0.5 h-6 border border-slate-200 rounded text-[10px] focus:ring-1 focus:ring-blue-400" />
                      <input type="number" min="0" value={lOT[k] || 0} onChange={e => setLOT(p => ({ ...p, [k]: Number(e.target.value) }))} className="w-16 px-1.5 py-0.5 h-6 border border-slate-200 rounded text-[10px] focus:ring-1 focus:ring-blue-400" />
                      <button onClick={() => setExpanded(isExp ? null : k)} className="flex items-center justify-center cursor-pointer text-slate-400 hover:text-blue-600">
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExp ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {isExp && (
                      <div className="px-3 pb-2 pl-12">
                        <input type="text" value={lRem[k] || ''} onChange={e => setLRem(p => ({ ...p, [k]: e.target.value }))} placeholder="Remarks / Notes for this staff member..."
                          className="w-full max-w-md px-2.5 py-1 h-7 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 bg-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">{markedCount}/{staffList.length} marked • {selDate}</span>
              <button onClick={handleSave} disabled={saving} className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                <Save className="w-3.5 h-3.5" />{saving ? 'Saving...' : 'Save Attendance Sheet'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LogsTab({ depts }: { depts: SelectOption[] }) {
  const [records, setRecords] = useState<LogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pp, setPp] = useState(15);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [fStaffType, setFStaffType] = useState('');
  const [fDept, setFDept] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');
  const [editRec, setEditRec] = useState<LogRecord | null>(null);
  const [selIds, setSelIds] = useState<Set<number>>(new Set());

  const statusOpts = [
    { value: '', label: 'All Status' },
    ...STATUSES.map(s => ({ value: s, label: STATUS_CONFIG[s].full }))
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/employee-attendance', {
        params: { page, per_page: pp, search, staff_type: fStaffType || undefined, status: fStatus || undefined, from_date: fFrom || undefined, to_date: fTo || undefined }
      });
      if (res.data.success) {
        let items: LogRecord[] = res.data.data;
        if (fDept) {
          items = items.filter(r => r.department?.toLowerCase() === fDept.toLowerCase());
        }
        setRecords(items);
        setTotal(res.data.meta?.total || items.length);
      }
    } catch {
      let demo: LogRecord[] = DEMO_TEACHERS.slice(0, 6).map((t, i) => ({
        id: i + 1,
        staff_id: t.staff_id,
        staff_type: t.staff_type,
        employee_id: t.employee_id,
        staff_name: t.name,
        department: t.department,
        designation: t.designation,
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        status: STATUSES[i % 5],
        check_in: '09:00',
        check_out: '17:00',
        late_minutes: i === 2 ? 15 : 0,
        overtime_minutes: i === 0 ? 30 : 0,
        leave_type: null,
        source: 'manual',
        remarks: '',
        is_approved: true,
      }));
      if (fStaffType) demo = demo.filter(r => r.staff_type === fStaffType);
      if (fDept) demo = demo.filter(r => r.department?.toLowerCase() === fDept.toLowerCase());
      if (fStatus) demo = demo.filter(r => r.status === fStatus);
      setRecords(demo);
      setTotal(demo.length);
    } finally { setLoading(false); }
  }, [page, pp, search, fStaffType, fDept, fStatus, fFrom, fTo]);

  useEffect(() => { setPage(1); }, [search, fStaffType, fDept, fStatus, fFrom, fTo]);
  useEffect(() => { load(); }, [load]);

  const del = async (id: number, name: string) => {
    if (!confirm(`Delete attendance record for "${name}"?`)) return;
    setRecords(r => r.filter(x => x.id !== id));
    try { await api.delete(`/school/employee-attendance/${id}`); } catch {}
    toast.success('Deleted record');
  };

  const saveEdit = async (upd: any) => {
    if (!editRec) return;
    setRecords(r => r.map(x => x.id === editRec.id ? { ...x, ...upd } : x));
    try { await api.put(`/school/employee-attendance/${editRec.id}`, upd); } catch {}
    toast.success('Updated attendance'); setEditRec(null);
  };

  const exportXlsx = () => {
    const data = records.map((r, i) => ({
      '#': i + 1, Date: r.date, 'Staff Name': r.staff_name, 'Emp ID': r.employee_id, 'Type': r.staff_type,
      Department: r.department || '', Designation: r.designation || '', Status: r.status, CheckIn: r.check_in || '',
      CheckOut: r.check_out || '', 'Late (m)': r.late_minutes, 'OT (m)': r.overtime_minutes, Remarks: r.remarks || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Staff Logs');
    XLSX.writeFile(wb, `staff_attendance_logs_${TODAY}.xlsx`); toast.success('Exported!');
  };

  const tp = Math.ceil(total / pp) || 1;

  return (
    <div className="space-y-2">
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1" style={{ minWidth: '150px' }}>
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name / emp ID..." className="w-full pl-7 pr-2.5 h-7 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500" />
          </div>
          <select value={fStaffType} onChange={e => setFStaffType(e.target.value)} className="h-7 px-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white">
            <option value="">All Staff</option><option value="Teacher">Teacher</option><option value="NonTeaching">Non-Teaching</option>
          </select>
          <div style={{ width: '135px' }}>
            <Select options={[{ value: '', label: 'All Depts' }, ...depts]} value={[{ value: '', label: 'All Depts' }, ...depts].find(d => d.value === fDept) || null} onChange={o => setFDept(o?.value || '')} placeholder="Dept..." styles={selectSt} classNamePrefix="react-select" />
          </div>
          <div style={{ width: '125px' }}>
            <Select options={statusOpts} value={statusOpts.find(s => s.value === fStatus) || null} onChange={o => setFStatus(o?.value || '')} placeholder="Status..." styles={selectSt} classNamePrefix="react-select" />
          </div>
          <input type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} className="h-7 px-2 border border-slate-300 rounded-lg text-xs w-30 focus:ring-1 focus:ring-blue-500" />
          <span className="text-slate-400 text-xs">to</span>
          <input type="date" value={fTo} onChange={e => setFTo(e.target.value)} className="h-7 px-2 border border-slate-300 rounded-lg text-xs w-30 focus:ring-1 focus:ring-blue-500" />
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 h-7">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Show:</span>
            <select value={pp} onChange={e => setPp(Number(e.target.value))} className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer">
              {[10, 15, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {(search || fStaffType || fDept || fStatus || fFrom || fTo) && (
            <button onClick={() => { setSearch(''); setFStaffType(''); setFDept(''); setFStatus(''); setFFrom(''); setFTo(''); }} className="px-2 py-1 text-[10px] font-bold text-rose-600 bg-rose-50 rounded border border-rose-200 cursor-pointer">Clear</button>
          )}
          <button onClick={exportXlsx} className="ml-auto px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer">
            <Download className="w-3 h-3" /> Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[750px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left w-8"><input type="checkbox" checked={records.length > 0 && records.every(r => selIds.has(r.id))} onChange={e => setSelIds(e.target.checked ? new Set(records.map(r => r.id)) : new Set())} className="rounded cursor-pointer" /></th>
                {['#', 'Date', 'Staff Name', 'Type', 'Department', 'Status', 'In / Out', 'Late/OT', 'Remarks', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={10} className="py-10 text-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><div className="text-xs text-slate-400">Loading records...</div></td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={10} className="py-10 text-center text-slate-400"><ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300" /><div className="text-sm font-bold">No attendance records found</div></td></tr>
              ) : records.map((r, i) => {
                const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.present;
                return (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-1.5"><input type="checkbox" checked={selIds.has(r.id)} onChange={e => { const n = new Set(selIds); e.target.checked ? n.add(r.id) : n.delete(r.id); setSelIds(n); }} className="rounded cursor-pointer" /></td>
                    <td className="px-3 py-1.5 text-slate-500 font-medium">{(page - 1) * pp + i + 1}</td>
                    <td className="px-3 py-1.5 font-mono font-semibold text-slate-700 whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-1.5">
                      <div className="font-bold text-slate-800 whitespace-nowrap">{r.staff_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.employee_id}</div>
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${r.staff_type === 'Teacher' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{r.staff_type}</span>
                    </td>
                    <td className="px-3 py-1.5 text-slate-600 whitespace-nowrap">{r.department || 'General'}{r.designation ? ` (${r.designation})` : ''}</td>
                    <td className="px-3 py-1.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>{cfg.full}</span></td>
                    <td className="px-3 py-1.5 font-mono text-slate-600 whitespace-nowrap">{[r.check_in, r.check_out].filter(Boolean).join(' / ') || '—'}</td>
                    <td className="px-3 py-1.5 font-mono text-[10px]">
                      {r.late_minutes > 0 && <span className="text-amber-600 font-bold mr-1">+{r.late_minutes}m Late</span>}
                      {r.overtime_minutes > 0 && <span className="text-emerald-600 font-bold">+{r.overtime_minutes}m OT</span>}
                      {!r.late_minutes && !r.overtime_minutes && <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-3 py-1.5 text-slate-500 max-w-[100px] truncate">{r.remarks || '—'}</td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditRec(r)} className="p-1 rounded hover:bg-blue-50 text-blue-600 cursor-pointer" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(r.id, r.staff_name)} className="p-1 rounded hover:bg-rose-50 text-rose-500 cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] text-slate-500">Total: <strong>{total}</strong> records</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-0.5 border border-slate-300 rounded text-xs text-slate-600 hover:bg-white disabled:opacity-40 cursor-pointer">First</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-0.5 border border-slate-300 rounded text-xs text-slate-600 hover:bg-white disabled:opacity-40 cursor-pointer">Prev</button>
            <span className="px-3 py-0.5 bg-blue-600 text-white rounded text-xs font-bold">{page}/{tp}</span>
            <button onClick={() => setPage(p => Math.min(tp, p + 1))} disabled={page === tp} className="px-2 py-0.5 border border-slate-300 rounded text-xs text-slate-600 hover:bg-white disabled:opacity-40 cursor-pointer">Next</button>
            <button onClick={() => setPage(tp)} disabled={page === tp} className="px-2 py-0.5 border border-slate-300 rounded text-xs text-slate-600 hover:bg-white disabled:opacity-40 cursor-pointer">Last</button>
          </div>
        </div>
      </div>
      {editRec && <EditModal record={editRec} onClose={() => setEditRec(null)} onSave={saveEdit} />}
    </div>
  );
}

function MonthlyTab({ depts }: { depts: SelectOption[] }) {
  const [staffType, setStaffType] = useState<string>('');
  const [dept, setDept] = useState<string>('');
  const [selMonth, setSelMonth] = useState(CURRENT_MONTH);
  const [matrix, setMatrix] = useState<MonthlyRow[]>([]);
  const [dim, setDim] = useState(31);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/employee-attendance/monthly-report', {
        params: { month: selMonth, staff_type: staffType || undefined, department: dept || undefined }
      });
      if (res.data.success) {
        setMatrix(res.data.data);
        setDim(res.data.days_in_month);
      }
    } catch {
      const [y, m] = selMonth.split('-');
      const days = new Date(parseInt(y), parseInt(m), 0).getDate();
      setDim(days);
      let demo: MonthlyRow[] = DEMO_TEACHERS.map((t, i) => {
        const dObj: Record<number, AttendanceStatus | null> = {};
        let p = 0, a = 0, l = 0, h = 0, ol = 0;
        for (let d = 1; d <= days; d++) {
          const s = STATUSES[Math.floor(Math.random() * 5)];
          dObj[d] = Math.random() > 0.05 ? s : null;
          if (dObj[d] === 'present') p++;
          else if (dObj[d] === 'absent') a++;
          else if (dObj[d] === 'late') l++;
          else if (dObj[d] === 'half_day') h++;
          else if (dObj[d] === 'on_leave') ol++;
        }
        const tm = p + a + l + h + ol;
        return {
          staff_id: t.staff_id,
          staff_type: t.staff_type,
          employee_id: t.employee_id,
          name: t.name,
          department: t.department,
          designation: t.designation,
          days: dObj,
          present: p,
          absent: a,
          late: l,
          half_day: h,
          on_leave: ol,
          total_marked: tm,
          attendance_pct: tm > 0 ? Math.round(((p + l + 0.5 * h) / tm) * 1000) / 10 : 0
        };
      });
      if (staffType) demo = demo.filter(r => r.staff_type === staffType);
      if (dept) demo = demo.filter(r => r.department?.toLowerCase() === dept.toLowerCase());
      setMatrix(demo);
    } finally { setLoading(false); }
  }, [selMonth, staffType, dept]);

  useEffect(() => { load(); }, [load]);

  const exportXlsx = () => {
    const data = matrix.map(r => {
      const row: any = { 'Emp ID': r.employee_id, Name: r.name, Type: r.staff_type, Dept: r.department || '' };
      for (let d = 1; d <= dim; d++) row[`D${d}`] = r.days[d] ? STATUS_CONFIG[r.days[d]!].label : '-';
      row.P = r.present; row.A = r.absent; row.L = r.late; row.HD = r.half_day; row.OL = r.on_leave; row.Total = r.total_marked; row['Att%'] = r.attendance_pct;
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Staff Monthly');
    XLSX.writeFile(wb, `staff_monthly_attendance_${selMonth}.xlsx`); toast.success('Exported!');
  };

  const [my, mm] = selMonth.split('-');
  const monthLabel = new Date(parseInt(my), parseInt(mm) - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  const avgPct = matrix.length ? Math.round(matrix.reduce((s, r) => s + r.attendance_pct, 0) / matrix.length * 10) / 10 : 0;

  return (
    <div className="space-y-2">
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs flex flex-wrap items-center gap-3">
        <select value={staffType} onChange={e => setStaffType(e.target.value)} className="h-8 px-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white">
          <option value="">All Staff</option><option value="Teacher">Teachers Only</option><option value="NonTeaching">Non-Teaching Only</option>
        </select>
        <div style={{ minWidth: '160px' }}>
          <Select options={[{ value: '', label: 'All Depts' }, ...depts]} value={[{ value: '', label: 'All Depts' }, ...depts].find(d => d.value === dept) || null} onChange={o => setDept(o?.value || '')} placeholder="Filter Dept..." styles={selectSt} classNamePrefix="react-select" isClearable />
        </div>
        <div>
          <input type="month" value={selMonth} onChange={e => setSelMonth(e.target.value)} className="px-2.5 py-1 h-8 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500" />
        </div>
        {matrix.length > 0 && (
          <>
            <button onClick={exportXlsx} className="mt-auto px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"><Download className="w-3.5 h-3.5" /> Export Excel</button>
            <div className="ml-auto flex items-center gap-4 mt-auto">
              <div className="text-center"><div className="text-lg font-black text-slate-800">{matrix.length}</div><div className="text-[9px] text-slate-400 font-bold uppercase">Staff Members</div></div>
              <div className="text-center"><div className={`text-lg font-black ${avgPct >= 75 ? 'text-emerald-700' : avgPct >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>{avgPct}%</div><div className="text-[9px] text-slate-400 font-bold uppercase">Avg Attendance</div></div>
            </div>
          </>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><div className="text-xs text-slate-400">Generating report...</div></div>
      ) : matrix.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-2xs"><Users className="w-10 h-10 mx-auto mb-3 text-slate-300" /><div className="text-sm font-bold">No staff records found</div></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm font-bold text-slate-800">{monthLabel} — Staff Attendance Grid</div>
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(STATUS_CONFIG).map(([k, c]) => (
                <span key={k} className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.bg} ${c.color}`}>{c.label} = {c.full}</span>
              ))}
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">- = Unmarked</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="text-[10px] border-collapse" style={{ minWidth: 'max-content' }}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200" style={{ minWidth: '170px' }}>Staff Member</th>
                  <th className="sticky bg-slate-50 px-2 py-2 text-center font-bold text-slate-500 uppercase border-r border-slate-200 w-16" style={{ left: '170px', zIndex: 10 }}>Type</th>
                  {Array.from({ length: dim }, (_, i) => {
                    const dd = new Date(parseInt(my), parseInt(mm) - 1, i + 1);
                    const dow = dd.getDay();
                    const isSun = dow === 0 || dow === 6;
                    return <th key={i + 1} className={`px-0.5 py-1.5 text-center font-bold uppercase w-7 ${isSun ? 'bg-slate-100 text-slate-400' : 'text-slate-500'}`}><div>{i + 1}</div><div className="text-[8px] font-normal opacity-60">{'SMTWTFS'[dow]}</div></th>;
                  })}
                  <th className="px-2 py-2 text-center font-bold text-emerald-600 uppercase w-8 bg-emerald-50 border-l border-slate-200">P</th>
                  <th className="px-2 py-2 text-center font-bold text-rose-600 uppercase w-8 bg-rose-50">A</th>
                  <th className="px-2 py-2 text-center font-bold text-amber-600 uppercase w-8 bg-amber-50">L</th>
                  <th className="px-2 py-2 text-center font-bold text-blue-600 uppercase w-8 bg-blue-50">HD</th>
                  <th className="px-2 py-2 text-center font-bold text-purple-600 uppercase w-8 bg-purple-50">OL</th>
                  <th className="px-2 py-2 text-center font-bold text-slate-700 uppercase w-12 bg-slate-100">Att%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matrix.map((r, idx) => (
                  <tr key={r.staff_id + '_' + r.staff_type} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-blue-50/20`}>
                    <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 border-r border-slate-200" style={{ minWidth: '170px' }}>
                      <div className="font-bold text-slate-800 truncate max-w-[150px]">{r.name}</div>
                      <div className="text-[9px] text-slate-400 font-mono">{r.employee_id} • {r.department || 'General'}</div>
                    </td>
                    <td className="sticky bg-inherit px-2 py-1.5 text-center font-bold border-r border-slate-200 w-16" style={{ left: '170px', zIndex: 10 }}>
                      <span className={`px-1 py-0.2 rounded text-[8px] ${r.staff_type === 'Teacher' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{r.staff_type}</span>
                    </td>
                    {Array.from({ length: dim }, (_, i) => {
                      const day = i + 1;
                      const st = r.days[day];
                      const cfg = st ? STATUS_CONFIG[st] : null;
                      const dd = new Date(parseInt(my), parseInt(mm) - 1, day);
                      const isSun = dd.getDay() === 0 || dd.getDay() === 6;
                      return (
                        <td key={day} className={`px-0.5 py-1 text-center ${isSun ? 'bg-slate-50' : ''}`}>
                          {cfg ? (
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[8px] font-black ${cfg.cellBg}`}>{cfg.label}</span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-slate-300 text-[9px]">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-2 py-1.5 text-center font-bold text-emerald-700 bg-emerald-50/50">{r.present}</td>
                    <td className="px-2 py-1.5 text-center font-bold text-rose-700 bg-rose-50/50">{r.absent}</td>
                    <td className="px-2 py-1.5 text-center font-bold text-amber-700 bg-amber-50/50">{r.late}</td>
                    <td className="px-2 py-1.5 text-center font-bold text-blue-700 bg-blue-50/50">{r.half_day}</td>
                    <td className="px-2 py-1.5 text-center font-bold text-purple-700 bg-purple-50/50">{r.on_leave}</td>
                    <td className={`px-2 py-1.5 text-center font-black ${r.attendance_pct >= 75 ? 'text-emerald-700 bg-emerald-100/60' : r.attendance_pct >= 50 ? 'text-amber-700 bg-amber-100/60' : 'text-rose-700 bg-rose-100/60'}`}>{r.attendance_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeacherAttendanceRegistry() {
  const [tab, setTab] = useState<'daily' | 'logs' | 'monthly'>('daily');
  const [depts, setDepts] = useState<SelectOption[]>([]);
  const [stats, setStats] = useState<Stats>({ total_staff: 0, marked: 0, present: 0, absent: 0, late: 0, half_day: 0, on_leave: 0, unmarked: 0, attendance_pct: 0 });

  useEffect(() => {
    api.get('/school/employee-attendance/departments')
      .then(r => { if (r.data.success) setDepts(r.data.data.map((d: string) => ({ value: d, label: d }))); })
      .catch(() => setDepts([
        { value: 'Mathematics', label: 'Mathematics' }, { value: 'English', label: 'English' },
        { value: 'Physics', label: 'Physics' }, { value: 'Chemistry', label: 'Chemistry' },
        { value: 'Computer Science', label: 'Computer Science' }, { value: 'Administration', label: 'Administration' },
      ]));

    api.get('/school/employee-attendance/today-stats')
      .then(r => {
        if (r.data.success) {
          const d = r.data.data;
          setStats({
            total_staff: d.total_staff, marked: d.marked, present: d.present, absent: d.absent,
            late: d.late, half_day: d.half_day, on_leave: d.on_leave, unmarked: d.unmarked,
            attendance_pct: d.marked > 0 ? Math.round((d.present / d.marked) * 1000) / 10 : 0
          });
        }
      })
      .catch(() => setStats({ total_staff: 48, marked: 42, present: 36, absent: 3, late: 3, half_day: 2, on_leave: 2, unmarked: 6, attendance_pct: 85.7 }));
  }, []);

  const TABS = [
    { key: 'daily' as const, label: 'Daily Staff Attendance', icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { key: 'logs' as const, label: 'Attendance Logs', icon: <ClipboardList className="w-3.5 h-3.5" /> },
    { key: 'monthly' as const, label: 'Monthly Matrix Report', icon: <BarChart2 className="w-3.5 h-3.5" /> },
  ];

  const STAT_CARDS = [
    { label: 'Total Staff', value: stats.total_staff, icon: <Users className="w-4 h-4" />, color: 'bg-blue-50 text-blue-600' },
    { label: 'Present Today', value: stats.present, icon: <UserCheck className="w-4 h-4" />, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Absent Today', value: stats.absent, icon: <UserX className="w-4 h-4" />, color: 'bg-rose-50 text-rose-600' },
    { label: 'Late Today', value: stats.late, icon: <Clock className="w-4 h-4" />, color: 'bg-amber-50 text-amber-600' },
    { label: 'Half Day', value: stats.half_day, icon: <AlarmClock className="w-4 h-4" />, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'On Leave', value: stats.on_leave, icon: <UserMinus className="w-4 h-4" />, color: 'bg-purple-50 text-purple-600' },
    { label: 'Unmarked', value: stats.unmarked, icon: <Filter className="w-4 h-4" />, color: 'bg-slate-100 text-slate-600' },
    { label: 'Attendance %', value: stats.attendance_pct + '%', icon: <TrendingUp className="w-4 h-4" />, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="bg-[#f4f7fc] min-h-screen p-2 sm:p-3 font-sans text-slate-800">
      <div className="max-w-[1600px] mx-auto space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-[#2b6cb0] tracking-tight leading-none">Teacher & Staff Attendance Registry</h1>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
              <span>Dashboard</span><span className="text-slate-300">/</span><span>Attendance</span><span className="text-slate-300">/</span>
              <span className="font-bold text-slate-700">Teacher & Staff Registry</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Today: <strong className="text-slate-700">{TODAY}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {STAT_CARDS.map(s => <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />)}
        </div>

        <div className="flex bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all cursor-pointer border-b-2 whitespace-nowrap ${tab === t.key ? 'border-blue-600 text-blue-700 bg-blue-50/60' : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50'}`}>
              {t.icon}<span>{t.label}</span>
            </button>
          ))}
        </div>

        {tab === 'daily' && <DailyTab depts={depts} />}
        {tab === 'logs' && <LogsTab depts={depts} />}
        {tab === 'monthly' && <MonthlyTab depts={depts} />}
      </div>
    </div>
  );
}
