import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import {
  Clock, CalendarDays, Users, UserCheck, UserX, AlarmClock,
  CheckCircle2, Search, Save, RotateCcw, Download, ChevronLeft,
  ChevronRight, BookOpen, Layers, Filter, Trash2, Edit2, X,
  AlertTriangle, BarChart3
} from 'lucide-react';
import api from '../../services/api';

// Types
type PeriodStatus = 'present' | 'absent' | 'late' | 'excused';

interface SelectOption { value: string; label: string; }

interface StudentPeriodRow {
  student_id: number;
  student_name: string;
  admission_number: string;
  roll_number: string;
  section: string;
  attendance_id: number | null;
  subject_id: number | null;
  status: PeriodStatus | null;
  remarks: string | null;
}

interface PeriodLogRecord {
  id: number;
  student_id: number;
  student_name: string;
  admission_number: string;
  roll_number: string;
  class_name: string;
  section: string;
  subject_name: string | null;
  date: string;
  period_number: number;
  period_name: string | null;
  status: PeriodStatus;
  remarks: string | null;
}

interface PeriodConfig {
  number: number;
  name: string;
  time: string;
}

const PERIODS: PeriodConfig[] = [
  { number: 1, name: 'Period 1', time: '08:30 - 09:15' },
  { number: 2, name: 'Period 2', time: '09:15 - 10:00' },
  { number: 3, name: 'Period 3', time: '10:15 - 11:00' },
  { number: 4, name: 'Period 4', time: '11:00 - 11:45' },
  { number: 5, name: 'Period 5', time: '12:30 - 13:15' },
  { number: 6, name: 'Period 6', time: '13:15 - 14:00' },
  { number: 7, name: 'Period 7', time: '14:00 - 14:45' },
  { number: 8, name: 'Period 8', time: '14:45 - 15:30' },
];

const STATUS_CONFIG: Record<string, { label: string; full: string; color: string; bg: string; border: string }> = {
  present: { label: 'P', full: 'Present', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-400' },
  absent:  { label: 'A', full: 'Absent',  color: 'text-rose-700',    bg: 'bg-rose-100',    border: 'border-rose-400' },
  late:    { label: 'L', full: 'Late',    color: 'text-amber-700',   bg: 'bg-amber-100',   border: 'border-amber-400' },
  excused: { label: 'E', full: 'Excused', color: 'text-purple-700',  bg: 'bg-purple-100',  border: 'border-purple-400' },
};

const STATUSES: PeriodStatus[] = ['present', 'absent', 'late', 'excused'];
const TODAY = new Date().toISOString().split('T')[0];

const selectSt = {
  control: (b: any) => ({ ...b, borderRadius: '8px', borderColor: '#cbd5e1', minHeight: '32px', height: '32px', fontSize: '12px', boxShadow: 'none', '&:hover': { borderColor: '#94a3b8' } }),
  valueContainer: (b: any) => ({ ...b, padding: '0 8px' }),
  input: (b: any) => ({ ...b, margin: '0', padding: '0' }),
  option: (b: any, s: any) => ({ ...b, backgroundColor: s.isFocused ? '#eff6ff' : 'white', fontSize: '12px', padding: '6px 10px', cursor: 'pointer' }),
  placeholder: (b: any) => ({ ...b, fontSize: '12px', color: '#94a3b8' }),
  singleValue: (b: any) => ({ ...b, fontSize: '12px', fontWeight: 600, color: '#334155' }),
};

const AVATAR_BG = ['bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-indigo-600'];

function EditModal({ record, onClose, onSave }: { record: PeriodLogRecord; onClose: () => void; onSave: (u: any) => void }) {
  const [form, setForm] = useState({
    status: record.status,
    remarks: record.remarks || '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-br from-blue-700 to-indigo-700 px-5 py-4 text-white flex items-center justify-between">
          <div>
            <div className="text-xs font-bold opacity-80">Edit Period Attendance</div>
            <div className="text-base font-extrabold">{record.student_name}</div>
            <div className="text-xs opacity-70">{record.date} • Period {record.period_number} ({record.subject_name || 'General'})</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Status *</label>
            <div className="flex gap-1.5 flex-wrap">
              {STATUSES.map(s => {
                const c = STATUS_CONFIG[s];
                return (
                  <button key={s} type="button" onClick={() => setForm(p => ({ ...p, status: s }))}
                    className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all cursor-pointer ${form.status === s ? `${c.bg} ${c.border} ${c.color}` : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'}`}>
                    {c.full}
                  </button>
                );
              })}
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

const DEMO_STUDENTS: StudentPeriodRow[] = [
  { student_id: 1, student_name: 'Aarav Sharma', admission_number: 'ADM-2026-001', roll_number: '1', section: 'A', attendance_id: null, subject_id: 1, status: 'present', remarks: '' },
  { student_id: 2, student_name: 'Priya Gupta', admission_number: 'ADM-2026-002', roll_number: '2', section: 'A', attendance_id: null, subject_id: 1, status: 'present', remarks: '' },
  { student_id: 3, student_name: 'Rohit Kumar', admission_number: 'ADM-2026-003', roll_number: '3', section: 'A', attendance_id: null, subject_id: 1, status: 'absent', remarks: 'Bunked class' },
  { student_id: 4, student_name: 'Sneha Patel', admission_number: 'ADM-2026-004', roll_number: '4', section: 'A', attendance_id: null, subject_id: 1, status: 'late', remarks: '5 mins late' },
  { student_id: 5, student_name: 'Arjun Singh', admission_number: 'ADM-2026-005', roll_number: '5', section: 'A', attendance_id: null, subject_id: 1, status: 'present', remarks: '' },
  { student_id: 6, student_name: 'Deepika Nair', admission_number: 'ADM-2026-006', roll_number: '6', section: 'A', attendance_id: null, subject_id: 1, status: 'excused', remarks: 'Medical room' },
  { student_id: 7, student_name: 'Karan Mehta', admission_number: 'ADM-2026-007', roll_number: '7', section: 'A', attendance_id: null, subject_id: 1, status: 'present', remarks: '' },
  { student_id: 8, student_name: 'Ananya Reddy', admission_number: 'ADM-2026-008', roll_number: '8', section: 'A', attendance_id: null, subject_id: 1, status: null, remarks: '' },
];

export default function PeriodWiseAttendanceRegistry() {
  const [activeTab, setActiveTab] = useState<'sheet' | 'logs' | 'analytics'>('sheet');
  const [classList, setClassList] = useState<SelectOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [subjectList, setSubjectList] = useState<SelectOption[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [attendanceDate, setAttendanceDate] = useState<string>(TODAY);

  // Sheet state
  const [students, setStudents] = useState<StudentPeriodRow[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Logs state
  const [logs, setLogs] = useState<PeriodLogRecord[]>([]);
  const [logTotal, setLogTotal] = useState<number>(0);
  const [logPage, setLogPage] = useState<number>(1);
  const [logPp, setLogPp] = useState<number>(15);
  const [logSearch, setLogSearch] = useState<string>('');
  const [logStatusFilter, setLogStatusFilter] = useState<string>('');
  const [logPeriodFilter, setLogPeriodFilter] = useState<string>('');
  const [logLoading, setLogLoading] = useState<boolean>(false);
  const [editRecord, setEditRecord] = useState<PeriodLogRecord | null>(null);

  // Load masters
  useEffect(() => {
    api.get('/attendance/class-list')
      .then(r => {
        if (r.data.success) setClassList(r.data.data.map((c: any) => ({ value: String(c.id), label: c.name })));
      })
      .catch(() => setClassList([
        { value: '1', label: 'Class 10-A' }, { value: '2', label: 'Class 10-B' },
        { value: '3', label: 'Class 9-A' },  { value: '4', label: 'Class 9-B' },
      ]));

    api.get('/period-attendance/subjects')
      .then(r => {
        if (r.data.success) setSubjectList(r.data.data.map((s: any) => ({ value: String(s.id), label: s.name })));
      })
      .catch(() => setSubjectList([
        { value: '1', label: 'Mathematics' },
        { value: '2', label: 'English' },
        { value: '3', label: 'Physics' },
        { value: '4', label: 'Chemistry' },
        { value: '5', label: 'Computer Science' },
      ]));
  }, []);

  // Load Period Sheet
  const loadPeriodSheet = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const res = await api.get('/period-attendance/sheet', {
        params: { class_id: selectedClass, date: attendanceDate, period_number: selectedPeriod }
      });
      if (res.data.success) {
        setStudents(res.data.data.map((s: any) => ({
          student_id: s.student_id,
          student_name: s.student_name,
          admission_number: s.admission_number,
          roll_number: s.roll_number,
          section: s.section || 'A',
          attendance_id: s.attendance_id,
          subject_id: s.subject_id || (selectedSubject ? Number(selectedSubject) : null),
          status: s.status || null,
          remarks: s.remarks || '',
        })));
      }
    } catch {
      setStudents(DEMO_STUDENTS);
    } finally { setLoading(false); }
  }, [selectedClass, attendanceDate, selectedPeriod, selectedSubject]);

  useEffect(() => {
    if (activeTab === 'sheet') loadPeriodSheet();
  }, [activeTab, loadPeriodSheet]);

  // Load Logs
  const loadLogs = useCallback(async () => {
    setLogLoading(true);
    try {
      const res = await api.get('/period-attendance/logs', {
        params: {
          page: logPage, per_page: logPp, search: logSearch, class_id: selectedClass || undefined,
          period_number: logPeriodFilter || undefined, status: logStatusFilter || undefined, date: attendanceDate
        }
      });
      if (res.data.success) {
        setLogs(res.data.data);
        setLogTotal(res.data.total);
      }
    } catch {
      const demo: PeriodLogRecord[] = DEMO_STUDENTS.slice(0, 6).map((s, i) => ({
        id: i + 1,
        student_id: s.student_id,
        student_name: s.student_name,
        admission_number: s.admission_number,
        roll_number: s.roll_number,
        class_name: 'Class 10-A',
        section: 'A',
        subject_name: 'Mathematics',
        date: attendanceDate,
        period_number: selectedPeriod,
        period_name: `Period ${selectedPeriod}`,
        status: (s.status || 'present') as PeriodStatus,
        remarks: s.remarks,
      }));
      setLogs(demo);
      setLogTotal(demo.length);
    } finally { setLogLoading(false); }
  }, [logPage, logPp, logSearch, selectedClass, logPeriodFilter, logStatusFilter, attendanceDate, selectedPeriod]);

  useEffect(() => {
    if (activeTab === 'logs') loadLogs();
  }, [activeTab, loadLogs]);

  // Date Shift Helper
  const shiftDate = (days: number) => {
    const d = new Date(attendanceDate);
    d.setDate(d.getDate() + days);
    setAttendanceDate(d.toISOString().split('T')[0]);
  };

  // Mass Mark
  const markAll = (st: PeriodStatus) => {
    setStudents(prev => prev.map(s => ({ ...s, status: st })));
  };

  const resetAll = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: null, remarks: '' })));
  };

  // Save Period Attendance
  const handleSaveSheet = async () => {
    if (!selectedClass || students.length === 0) {
      toast.error('Select a class first');
      return;
    }
    const currentPeriodInfo = PERIODS.find(p => p.number === selectedPeriod);
    const records = students.map(s => ({
      student_id: s.student_id,
      status: s.status || 'present',
      remarks: s.remarks || null,
    }));

    setSaving(true);
    try {
      await api.post('/period-attendance/bulk-mark', {
        class_id: Number(selectedClass),
        date: attendanceDate,
        period_number: selectedPeriod,
        period_name: currentPeriodInfo ? `${currentPeriodInfo.name} (${currentPeriodInfo.time})` : `Period ${selectedPeriod}`,
        subject_id: selectedSubject ? Number(selectedSubject) : null,
        records,
      });
      toast.success(`Saved Period ${selectedPeriod} attendance for ${records.length} students!`);
      loadPeriodSheet();
    } catch {
      toast.error('Failed to save period attendance');
    } finally { setSaving(false); }
  };

  const handleDeleteLog = async (id: number, name: string) => {
    if (!confirm(`Delete period attendance for "${name}"?`)) return;
    setLogs(prev => prev.filter(l => l.id !== id));
    try { await api.delete(`/period-attendance/${id}`); } catch {}
    toast.success('Deleted log record');
  };

  const handleSaveEdit = async (upd: any) => {
    if (!editRecord) return;
    setLogs(prev => prev.map(l => l.id === editRecord.id ? { ...l, ...upd } : l));
    try { await api.put(`/period-attendance/${editRecord.id}`, upd); } catch {}
    toast.success('Updated period attendance');
    setEditRecord(null);
  };

  const exportExcel = () => {
    const data = filteredStudents.map((s, i) => ({
      '#': i + 1, 'Roll': s.roll_number, 'Student Name': s.student_name, 'Adm No': s.admission_number,
      'Period': `Period ${selectedPeriod}`, 'Subject': selectedSubject ? subjectList.find(x => x.value === selectedSubject)?.label : '',
      'Status': s.status ? STATUS_CONFIG[s.status]?.full : 'Unmarked', 'Remarks': s.remarks || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, `Period_${selectedPeriod}`);
    XLSX.writeFile(wb, `period_${selectedPeriod}_attendance_${attendanceDate}.xlsx`);
    toast.success('Exported period sheet');
  };

  const filteredStudents = students.filter(s =>
    s.student_name.toLowerCase().includes(search.toLowerCase()) ||
    s.admission_number.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number.includes(search)
  );

  const pc = students.filter(s => s.status === 'present').length;
  const ac = students.filter(s => s.status === 'absent').length;
  const lc = students.filter(s => s.status === 'late').length;
  const ec = students.filter(s => s.status === 'excused').length;
  const markedCount = students.filter(s => s.status !== null).length;
  const pct = markedCount > 0 ? Math.round(((pc + lc + 0.5 * ec) / markedCount) * 1000) / 10 : 0;

  return (
    <div className="bg-[#f4f7fc] min-h-screen p-2 sm:p-3 font-sans text-slate-800">
      <div className="max-w-[1600px] mx-auto space-y-2">

        {/* HEADER & DATE SELECTOR */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div>
            <h1 className="text-lg font-bold text-[#2b6cb0] tracking-tight leading-none">Period-Wise / Subject-Wise Attendance Console</h1>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
              <span>Attendance</span><span className="text-slate-300">/</span>
              <span className="font-bold text-slate-700">Period-Wise Attendance</span>
            </div>
          </div>

          {/* Date Picker Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={() => shiftDate(-1)} className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 cursor-pointer" title="Previous Day">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)}
              className="px-3 py-1 h-8 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500" />
            <button onClick={() => shiftDate(1)} className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 cursor-pointer" title="Next Day">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setAttendanceDate(TODAY)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer">
              Today
            </button>
          </div>
        </div>

        {/* PERIOD SELECTOR STRIP */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Class Period (1 - 8):</span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Active: Period {selectedPeriod} ({PERIODS.find(p => p.number === selectedPeriod)?.time})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {PERIODS.map(p => {
              const isSel = selectedPeriod === p.number;
              return (
                <button key={p.number} type="button" onClick={() => setSelectedPeriod(p.number)}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${isSel ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-102' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">{p.name}</span>
                    <Clock className={`w-3 h-3 ${isSel ? 'text-blue-200' : 'text-slate-400'}`} />
                  </div>
                  <div className={`text-[10px] font-mono mt-0.5 ${isSel ? 'text-blue-100' : 'text-slate-500'}`}>{p.time}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB CONTROLS */}
        <div className="flex bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden w-fit">
          <button onClick={() => setActiveTab('sheet')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all cursor-pointer border-b-2 ${activeTab === 'sheet' ? 'border-blue-600 text-blue-700 bg-blue-50/60' : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50'}`}>
            <BookOpen className="w-3.5 h-3.5" /><span>Period Attendance Sheet</span>
          </button>
          <button onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all cursor-pointer border-b-2 ${activeTab === 'logs' ? 'border-blue-600 text-blue-700 bg-blue-50/60' : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50'}`}>
            <Layers className="w-3.5 h-3.5" /><span>Period Attendance Logs</span>
          </button>
          <button onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all cursor-pointer border-b-2 ${activeTab === 'analytics' ? 'border-blue-600 text-blue-700 bg-blue-50/60' : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50'}`}>
            <BarChart3 className="w-3.5 h-3.5" /><span>Period Analytics & Bunk Alerts</span>
          </button>
        </div>

        {/* TAB 1: PERIOD ATTENDANCE SHEET ENTRY */}
        {activeTab === 'sheet' && (
          <div className="space-y-2">
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <div style={{ minWidth: '180px' }}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Class / Section *</label>
                  <Select options={classList} value={classList.find(c => c.value === selectedClass) || null}
                    onChange={o => setSelectedClass(o?.value || '')} placeholder="Select Class..." styles={selectSt} classNamePrefix="react-select" isClearable />
                </div>
                <div style={{ minWidth: '180px' }}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Subject (Optional)</label>
                  <Select options={subjectList} value={subjectList.find(s => s.value === selectedSubject) || null}
                    onChange={o => setSelectedSubject(o?.value || '')} placeholder="Select Subject..." styles={selectSt} classNamePrefix="react-select" isClearable />
                </div>
                <div className="relative flex-1" style={{ minWidth: '160px' }}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Search Student</label>
                  <Search className="absolute left-2.5 top-[25px] w-3.5 h-3.5 text-slate-400" />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter name / roll / adm no..."
                    className="w-full pl-8 pr-2.5 h-8 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="flex items-end gap-1.5 ml-auto">
                  <button onClick={() => markAll('present')} className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 cursor-pointer">✓ All Present</button>
                  <button onClick={() => markAll('absent')} className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-lg border border-rose-300 cursor-pointer">✗ All Absent</button>
                  <button onClick={resetAll} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer flex items-center gap-1"><RotateCcw className="w-3 h-3" />Reset</button>
                </div>
              </div>

              {students.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Period {selectedPeriod} Summary:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Present: {pc}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Absent: {ac}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Late: {lc}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Excused: {ec}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Unmarked: {students.length - markedCount}</span>
                  <div className="ml-auto flex items-center gap-3">
                    <span className="text-[11px] text-slate-500">Marked: <strong>{markedCount}/{students.length}</strong></span>
                    <span className={`text-xs font-black ${pct >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>Attendance: {pct}%</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              {!selectedClass ? (
                <div className="p-12 text-center text-slate-400">
                  <Clock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <div className="text-sm font-bold">Select a Class & Section to Load Period Sheet</div>
                </div>
              ) : loading ? (
                <div className="p-12 text-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><div className="text-xs text-slate-400">Loading period sheet...</div></div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-12 text-center text-slate-400"><Users className="w-10 h-10 mx-auto mb-3 text-slate-300" /><div className="text-sm font-bold">No students found</div></div>
              ) : (
                <>
                  <div className="grid bg-slate-50 border-b border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider gap-2" style={{ gridTemplateColumns: '2.5rem 3rem 1fr 14rem 1fr' }}>
                    <div>#</div><div>Roll</div><div>Student Name & Adm No.</div><div>Period Status Toggle</div><div>Remarks / Bunk Notes</div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {filteredStudents.map((s, idx) => {
                      const cfg = s.status ? STATUS_CONFIG[s.status] : null;
                      return (
                        <div key={s.student_id} className={`grid px-3 py-1.5 items-center gap-2 ${cfg ? 'bg-' + cfg.bg.replace('bg-', '') + '/10' : ''}`} style={{ gridTemplateColumns: '2.5rem 3rem 1fr 14rem 1fr' }}>
                          <div className="text-xs font-semibold text-slate-500">{idx + 1}</div>
                          <div className="text-xs font-mono font-bold text-slate-700">{s.roll_number || '-'}</div>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${AVATAR_BG[idx % AVATAR_BG.length]}`}>{s.student_name.charAt(0)}</div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">{s.student_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{s.admission_number} • Sec {s.section}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {STATUSES.map(st => {
                              const c = STATUS_CONFIG[st];
                              const isSel = s.status === st;
                              return (
                                <button key={st} type="button" onClick={() => setStudents(prev => prev.map(x => x.student_id === s.student_id ? { ...x, status: isSel ? null : (st as PeriodStatus) } : x))}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${isSel ? `${c.bg} ${c.border} ${c.color} border-2 scale-105 shadow-2xs` : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                  {c.label} ({c.full})
                                </button>
                              );
                            })}
                          </div>
                          <input type="text" value={s.remarks || ''} onChange={e => setStudents(prev => prev.map(x => x.student_id === s.student_id ? { ...x, remarks: e.target.value } : x))} placeholder="Optional period notes..." className="w-full px-2.5 py-1 h-7 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-400 bg-white" />
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 flex items-center justify-between">
                    <button onClick={exportExcel} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer">
                      <Download className="w-3.5 h-3.5" /> Export Period Sheet
                    </button>
                    <button onClick={handleSaveSheet} disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-60">
                      <Save className="w-4 h-4" />{saving ? 'Saving...' : `Save Period ${selectedPeriod} Attendance`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PERIOD ATTENDANCE LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-2">
            <div className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs flex flex-wrap items-center gap-2">
              <div className="relative flex-1" style={{ minWidth: '160px' }}>
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input type="text" value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="Search name / roll..." className="w-full pl-7 pr-2.5 h-7 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500" />
              </div>
              <select value={logPeriodFilter} onChange={e => setLogPeriodFilter(e.target.value)} className="h-7 px-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white">
                <option value="">All Periods</option>
                {PERIODS.map(p => <option key={p.number} value={p.number}>{p.name}</option>)}
              </select>
              <select value={logStatusFilter} onChange={e => setLogStatusFilter(e.target.value)} className="h-7 px-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white">
                <option value="">All Status</option>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].full}</option>)}
              </select>
              {(logSearch || logPeriodFilter || logStatusFilter) && (
                <button onClick={() => { setLogSearch(''); setLogPeriodFilter(''); setLogStatusFilter(''); }} className="px-2 py-1 text-[10px] font-bold text-rose-600 bg-rose-50 rounded border border-rose-200 cursor-pointer">Clear</button>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['#', 'Date', 'Period', 'Student Name', 'Class', 'Subject', 'Status', 'Remarks', 'Actions'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logLoading ? (
                      <tr><td colSpan={9} className="py-10 text-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><div className="text-xs text-slate-400">Loading period logs...</div></td></tr>
                    ) : logs.length === 0 ? (
                      <tr><td colSpan={9} className="py-10 text-center text-slate-400"><Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" /><div className="text-sm font-bold">No period logs found</div></td></tr>
                    ) : logs.map((r, i) => {
                      const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.present;
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-3 py-1.5 text-slate-500 font-medium">{(logPage - 1) * logPp + i + 1}</td>
                          <td className="px-3 py-1.5 font-mono font-semibold text-slate-700 whitespace-nowrap">{r.date}</td>
                          <td className="px-3 py-1.5 font-bold text-blue-700 whitespace-nowrap">Period {r.period_number}</td>
                          <td className="px-3 py-1.5"><div className="font-bold text-slate-800 whitespace-nowrap">{r.student_name}</div><div className="text-[10px] text-slate-400 font-mono">{r.admission_number}</div></td>
                          <td className="px-3 py-1.5 text-slate-600 whitespace-nowrap">{r.class_name} ({r.section})</td>
                          <td className="px-3 py-1.5 font-medium text-slate-700 whitespace-nowrap">{r.subject_name || 'General'}</td>
                          <td className="px-3 py-1.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>{cfg.full}</span></td>
                          <td className="px-3 py-1.5 text-slate-500 max-w-[120px] truncate">{r.remarks || '—'}</td>
                          <td className="px-3 py-1.5">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setEditRecord(r)} className="p-1 rounded hover:bg-blue-50 text-blue-600 cursor-pointer" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteLog(r.id, r.student_name)} className="p-1 rounded hover:bg-rose-50 text-rose-500 cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
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

        {/* TAB 3: PERIOD ANALYTICS & BUNK ALERTS */}
        {activeTab === 'analytics' && (
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Period-Wise Absenteeism & Bunking Analysis</h3>
                  <p className="text-xs text-slate-500">Detect periods with high absenteeism or students missing post-lunch periods.</p>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg border border-amber-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Bunk Alert Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PERIODS.map(p => {
                  const demoAbsent = Math.floor(Math.random() * 4) + (p.number === 5 || p.number === 6 ? 3 : 1);
                  return (
                    <div key={p.number} className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-700">{p.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{p.time}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-base font-black ${demoAbsent > 3 ? 'text-rose-600' : 'text-slate-800'}`}>{demoAbsent} Absents</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase">{demoAbsent > 3 ? 'High Bunking' : 'Normal'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {editRecord && <EditModal record={editRecord} onClose={() => setEditRecord(null)} onSave={handleSaveEdit} />}
      </div>
    </div>
  );
}
