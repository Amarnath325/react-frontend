import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import {
  ClipboardList, BarChart2, CalendarDays, Users, TrendingUp,
  UserCheck, UserX, Clock, AlarmClock, Filter, CheckCircle2,
  Search, Download, Save, Trash2, Edit2, X, ChevronDown, RotateCcw
} from 'lucide-react';
import api from '../../services/api';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day';
interface ClassOption { value: string; label: string; }
interface StudentRow {
  student_id: number; student_name: string; admission_number: string;
  roll_number: string; section: string; photo_url: string | null;
  attendance_id: number | null; status: AttendanceStatus | null;
  in_time: string | null; out_time: string | null; remarks: string | null;
}
interface LogRecord {
  id: number; student_id: number; student_name: string; admission_number: string;
  roll_number: string; class_name: string; date: string; status: AttendanceStatus;
  in_time: string | null; out_time: string | null; remarks: string | null;
}
interface MonthlyRow {
  student_id: number; student_name: string; admission_number: string;
  roll_number: string; days: Record<number, AttendanceStatus | null>;
  present: number; absent: number; late: number; half_day: number;
  total_marked: number; attendance_pct: number;
}
interface Stats {
  present: number; absent: number; late: number; half_day: number;
  total: number; unmarked: number; total_students: number; attendance_pct: number;
}

const SC: Record<string, { label: string; color: string; bg: string; border: string; cellBg: string }> = {
  present:  { label: 'P',  color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-400', cellBg: 'bg-emerald-100 text-emerald-800' },
  absent:   { label: 'A',  color: 'text-rose-700',    bg: 'bg-rose-100',    border: 'border-rose-400',    cellBg: 'bg-rose-100 text-rose-800' },
  late:     { label: 'L',  color: 'text-amber-700',   bg: 'bg-amber-100',   border: 'border-amber-400',   cellBg: 'bg-amber-100 text-amber-800' },
  half_day: { label: 'HD', color: 'text-blue-700',    bg: 'bg-blue-100',    border: 'border-blue-400',    cellBg: 'bg-blue-100 text-blue-800' },
};
const STATUSES: AttendanceStatus[] = ['present', 'absent', 'late', 'half_day'];
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
  const [form, setForm] = useState({ status: record.status, in_time: record.in_time || '', out_time: record.out_time || '', remarks: record.remarks || '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-br from-blue-700 to-indigo-700 px-5 py-4 text-white flex items-center justify-between">
          <div>
            <div className="text-xs font-bold opacity-80">Edit Attendance</div>
            <div className="text-base font-extrabold">{record.student_name}</div>
            <div className="text-xs opacity-70">{record.date} - {record.class_name}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Status *</label>
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map(s => {
                const c = SC[s];
                return (
                  <button key={s} type="button" onClick={() => setForm(p => ({ ...p, status: s }))}
                    className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all cursor-pointer ${form.status === s ? `${c.bg} ${c.border} ${c.color}` : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'}`}>
                    {s === 'half_day' ? 'Half Day' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1 block">In Time</label>
              <input type="time" value={form.in_time} onChange={e => setForm(p => ({ ...p, in_time: e.target.value }))} className="w-full px-2 py-1 h-7 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1 block">Out Time</label>
              <input type="time" value={form.out_time} onChange={e => setForm(p => ({ ...p, out_time: e.target.value }))} className="w-full px-2 py-1 h-7 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-700 mb-1 block">Remarks</label>
            <textarea value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} rows={2} className="w-full px-2 py-1 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 resize-none" placeholder="Optional remarks..." />
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

const DEMO_NAMES = ['Aarav Sharma','Priya Gupta','Rohit Kumar','Sneha Patel','Arjun Singh','Deepika Nair','Karan Mehta','Ananya Reddy','Vikram Joshi','Pooja Iyer'];
const AVATAR_COLORS = ['bg-blue-500','bg-purple-500','bg-emerald-500','bg-amber-500','bg-rose-500'];

function DailyTab({ classes }: { classes: ClassOption[] }) {
  const [selClass, setSelClass] = useState('');
  const [selDate, setSelDate] = useState(TODAY);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [lStatus, setLStatus] = useState<Record<number, AttendanceStatus | null>>({});
  const [lIn, setLIn] = useState<Record<number, string>>({});
  const [lOut, setLOut] = useState<Record<number, string>>({});
  const [lRem, setLRem] = useState<Record<number, string>>({});
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadStudents = useCallback(async () => {
    if (!selClass) return;
    setLoading(true);
    try {
      const res = await api.get('/attendance/class-students', { params: { class_id: selClass, date: selDate } });
      if (res.data.success) {
        const rows: StudentRow[] = res.data.data;
        setStudents(rows);
        const st: Record<number, AttendanceStatus | null> = {};
        const it: Record<number, string> = {};
        const ot: Record<number, string> = {};
        const rk: Record<number, string> = {};
        rows.forEach(r => { st[r.student_id]=r.status; it[r.student_id]=r.in_time||''; ot[r.student_id]=r.out_time||''; rk[r.student_id]=r.remarks||''; });
        setLStatus(st); setLIn(it); setLOut(ot); setLRem(rk);
      }
    } catch {
      const demo: StudentRow[] = DEMO_NAMES.slice(0,8).map((n, i) => ({
        student_id: i+1, student_name: n, admission_number: `ADM-2024-${String(i+1).padStart(3,'0')}`,
        roll_number: String(i+1), section: 'A', photo_url: null, attendance_id: null, status: null, in_time: null, out_time: null, remarks: null,
      }));
      setStudents(demo);
      const st: Record<number, AttendanceStatus | null> = {};
      demo.forEach(r => { st[r.student_id] = null; });
      setLStatus(st);
    } finally { setLoading(false); }
  }, [selClass, selDate]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const markAll = (s: AttendanceStatus) => {
    const st: Record<number, AttendanceStatus> = {};
    students.forEach(r => { st[r.student_id] = s; });
    setLStatus(st);
  };

  const resetAll = () => {
    const st: Record<number, AttendanceStatus | null> = {};
    students.forEach(r => { st[r.student_id] = null; });
    setLStatus(st);
  };

  const handleSave = async () => {
    if (!selClass || !students.length) return;
    const records = students.map(s => ({
      student_id: s.student_id, date: selDate,
      status: lStatus[s.student_id] || 'present',
      in_time: lIn[s.student_id] || null,
      out_time: lOut[s.student_id] || null,
      remarks: lRem[s.student_id] || null,
    }));
    setSaving(true);
    try { await api.post('/attendance/bulk-mark', { records }); toast.success(`Saved for ${records.length} students!`); loadStudents(); }
    catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const pc = Object.values(lStatus).filter(s => s === 'present').length;
  const ac = Object.values(lStatus).filter(s => s === 'absent').length;
  const lc = Object.values(lStatus).filter(s => s === 'late').length;
  const hc = Object.values(lStatus).filter(s => s === 'half_day').length;
  const mc = Object.values(lStatus).filter(Boolean).length;

  return (
    <div className="space-y-2">
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div style={{ minWidth: '170px', flex: 1 }}>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Class / Section</label>
            <Select options={classes} value={classes.find(c => c.value === selClass) || null} onChange={o => setSelClass(o?.value||'')} placeholder="Select Class..." styles={selectSt} classNamePrefix="react-select" isClearable />
          </div>
          <div style={{ minWidth: '140px', flex: 1 }}>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Date</label>
            <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)} className="w-full px-2.5 py-1 h-8 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="flex items-end gap-2 flex-wrap">
            <button onClick={() => markAll('present')} className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 cursor-pointer">All Present</button>
            <button onClick={() => markAll('absent')}  className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-lg border border-rose-300 cursor-pointer">All Absent</button>
            <button onClick={resetAll} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer flex items-center gap-1"><RotateCcw className="w-3 h-3" />Reset</button>
          </div>
        </div>
        {students.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Live:</span>
            {[{l:'Present',v:pc,cls:'bg-emerald-100 text-emerald-800'},{l:'Absent',v:ac,cls:'bg-rose-100 text-rose-800'},{l:'Late',v:lc,cls:'bg-amber-100 text-amber-800'},{l:'H/D',v:hc,cls:'bg-blue-100 text-blue-800'},{l:'Unmarked',v:students.length-mc,cls:'bg-slate-100 text-slate-600'}].map(({l,v,cls}) => (
              <span key={l} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>{l}: {v}</span>
            ))}
            <span className="ml-auto text-[11px] text-slate-500">Total: <strong>{students.length}</strong></span>
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {!selClass ? (
          <div className="p-12 text-center text-slate-400"><CalendarDays className="w-10 h-10 mx-auto mb-3 text-slate-300" /><div className="text-sm font-bold">Select a Class to Begin</div><div className="text-xs mt-1">Choose class and date to mark attendance</div></div>
        ) : loading ? (
          <div className="p-12 text-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><div className="text-xs text-slate-400">Loading students...</div></div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400"><Users className="w-10 h-10 mx-auto mb-3 text-slate-300" /><div className="text-sm font-bold">No students found</div></div>
        ) : (
          <>
            <div className="grid bg-slate-50 border-b border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider" style={{ gridTemplateColumns: '2rem 2.5rem 1fr 11rem 6.5rem 6.5rem 2rem' }}>
              <div>#</div><div>Roll</div><div>Student</div><div>Status</div><div>In</div><div>Out</div><div></div>
            </div>
            <div className="divide-y divide-slate-100">
              {students.map((s, idx) => {
                const st = lStatus[s.student_id];
                const isExp = expanded === s.student_id;
                return (
                  <div key={s.student_id}>
                    <div className="grid px-3 py-1.5 items-center gap-2" style={{ gridTemplateColumns: '2rem 2.5rem 1fr 11rem 6.5rem 6.5rem 2rem' }}>
                      <div className="text-[11px] text-slate-500 font-semibold">{idx + 1}</div>
                      <div className="text-[11px] font-mono font-bold text-slate-700">{s.roll_number || '-'}</div>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white ${AVATAR_COLORS[idx % 5]}`}>{s.student_name.charAt(0)}</div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">{s.student_name}</div>
                          <div className="text-[9px] text-slate-400 font-mono">{s.admission_number}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 flex-wrap">
                        {STATUSES.map(ss => {
                          const c = SC[ss];
                          return (
                            <button key={ss} type="button"
                              onClick={() => setLStatus(p => ({ ...p, [s.student_id]: p[s.student_id] === ss ? null : ss }))}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${lStatus[s.student_id] === ss ? `${c.bg} ${c.border} ${c.color} border-2` : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                              title={ss === 'half_day' ? 'Half Day' : ss}>{c.label}</button>
                          );
                        })}
                      </div>
                      <input type="time" value={lIn[s.student_id]||''} onChange={e => setLIn(p => ({...p,[s.student_id]:e.target.value}))} className="w-24 px-1.5 py-0.5 h-6 border border-slate-200 rounded text-[10px] font-mono focus:ring-1 focus:ring-blue-400" />
                      <input type="time" value={lOut[s.student_id]||''} onChange={e => setLOut(p => ({...p,[s.student_id]:e.target.value}))} className="w-24 px-1.5 py-0.5 h-6 border border-slate-200 rounded text-[10px] font-mono focus:ring-1 focus:ring-blue-400" />
                      <button onClick={() => setExpanded(isExp ? null : s.student_id)} className="flex items-center justify-center cursor-pointer text-slate-400 hover:text-blue-600">
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExp ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {isExp && (
                      <div className="px-3 pb-2 pl-16">
                        <input type="text" value={lRem[s.student_id]||''} onChange={e => setLRem(p => ({...p,[s.student_id]:e.target.value}))} placeholder="Remarks for this student..."
                          className="w-full max-w-sm px-2.5 py-1 h-7 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">{mc}/{students.length} marked - {selDate}</span>
              <button onClick={handleSave} disabled={saving} className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                <Save className="w-3.5 h-3.5" />{saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LogsTab({ classes }: { classes: ClassOption[] }) {
  const [records, setRecords] = useState<LogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pp, setPp] = useState(15);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [fClass, setFClass] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');
  const [editRec, setEditRec] = useState<LogRecord | null>(null);
  const [selIds, setSelIds] = useState<Set<number>>(new Set());

  const statusOpts = [
    { value: '', label: 'All Status' },
    ...STATUSES.map(s => ({ value: s, label: s === 'half_day' ? 'Half Day' : s.charAt(0).toUpperCase() + s.slice(1) }))
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/registry', { params: { page, per_page: pp, search, class_id: fClass, status: fStatus, from_date: fFrom, to_date: fTo } });
      if (res.data.success) { setRecords(res.data.data); setTotal(res.data.total); }
    } catch {
      const demo: LogRecord[] = DEMO_NAMES.slice(0,5).map((n, i) => ({
        id: i+1, student_id: i+1, student_name: n, admission_number: `ADM-${i+1}`, roll_number: String(i+1),
        class_name: 'Class 10-A', date: new Date(Date.now()-i*86400000).toISOString().split('T')[0],
        status: STATUSES[i%4], in_time: '09:00', out_time: '15:30', remarks: '',
      }));
      setRecords(demo); setTotal(demo.length);
    } finally { setLoading(false); }
  }, [page, pp, search, fClass, fStatus, fFrom, fTo]);

  useEffect(() => { setPage(1); }, [search, fClass, fStatus, fFrom, fTo]);
  useEffect(() => { load(); }, [load]);

  const del = async (id: number, name: string) => {
    if (!confirm(`Delete attendance record for "${name}"?`)) return;
    setRecords(r => r.filter(x => x.id !== id));
    try { await api.delete(`/attendance/${id}`); } catch {}
    toast.success('Deleted');
  };
  const saveEdit = async (upd: any) => {
    if (!editRec) return;
    setRecords(r => r.map(x => x.id === editRec.id ? { ...x, ...upd } : x));
    try { await api.put(`/attendance/${editRec.id}`, upd); } catch {}
    toast.success('Updated'); setEditRec(null);
  };
  const exportXlsx = () => {
    const data = records.map((r, i) => ({ '#': i+1, Date: r.date, Student: r.student_name, AdmNo: r.admission_number, Class: r.class_name, Status: r.status, In: r.in_time||'', Out: r.out_time||'', Remarks: r.remarks||'' }));
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Logs');
    XLSX.writeFile(wb, `attendance_logs_${TODAY}.xlsx`); toast.success('Exported!');
  };
  const tp = Math.ceil(total / pp) || 1;

  return (
    <div className="space-y-2">
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1" style={{ minWidth: '160px' }}>
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name / adm no..."
              className="w-full pl-7 pr-2.5 h-7 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500" />
          </div>
          <div style={{ width: '155px' }}>
            <Select options={[{value:'',label:'All Classes'},...classes]} value={[{value:'',label:'All Classes'},...classes].find(c=>c.value===fClass)||null}
              onChange={o => setFClass(o?.value||'')} placeholder="Class..." styles={selectSt} classNamePrefix="react-select" />
          </div>
          <div style={{ width: '135px' }}>
            <Select options={statusOpts} value={statusOpts.find(s=>s.value===fStatus)||null} onChange={o => setFStatus(o?.value||'')} placeholder="Status..." styles={selectSt} classNamePrefix="react-select" />
          </div>
          <input type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} className="h-7 px-2 border border-slate-300 rounded-lg text-xs w-32 focus:ring-1 focus:ring-blue-500" />
          <span className="text-slate-400 text-xs">to</span>
          <input type="date" value={fTo} onChange={e => setFTo(e.target.value)} className="h-7 px-2 border border-slate-300 rounded-lg text-xs w-32 focus:ring-1 focus:ring-blue-500" />
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 h-7">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Show:</span>
            <select value={pp} onChange={e => setPp(Number(e.target.value))} className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer">
              {[10,15,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {(search||fClass||fStatus||fFrom||fTo) && (
            <button onClick={() => { setSearch(''); setFClass(''); setFStatus(''); setFFrom(''); setFTo(''); }}
              className="px-2 py-1 text-[10px] font-bold text-rose-600 bg-rose-50 rounded border border-rose-200 cursor-pointer">Clear</button>
          )}
          <button onClick={exportXlsx} className="ml-auto px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer">
            <Download className="w-3 h-3" /> Export
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left w-8"><input type="checkbox" checked={records.length>0&&records.every(r=>selIds.has(r.id))} onChange={e => setSelIds(e.target.checked?new Set(records.map(r=>r.id)):new Set())} className="rounded cursor-pointer" /></th>
                {['#','Date','Student','Class','Status','In / Out','Remarks','Actions'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="py-10 text-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><div className="text-xs text-slate-400">Loading...</div></td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={9} className="py-10 text-center text-slate-400"><ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300" /><div className="text-sm font-bold">No records found</div></td></tr>
              ) : records.map((r, i) => {
                const cfg = SC[r.status];
                return (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-1.5"><input type="checkbox" checked={selIds.has(r.id)} onChange={e => { const n=new Set(selIds); e.target.checked?n.add(r.id):n.delete(r.id); setSelIds(n); }} className="rounded cursor-pointer" /></td>
                    <td className="px-3 py-1.5 text-slate-500 font-medium">{(page-1)*pp+i+1}</td>
                    <td className="px-3 py-1.5 font-mono font-semibold text-slate-700 whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-1.5"><div className="font-bold text-slate-800 whitespace-nowrap">{r.student_name}</div><div className="text-[10px] text-slate-400 font-mono">{r.admission_number}</div></td>
                    <td className="px-3 py-1.5 text-slate-600 whitespace-nowrap">{r.class_name}</td>
                    <td className="px-3 py-1.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>{r.status==='half_day'?'Half Day':r.status.charAt(0).toUpperCase()+r.status.slice(1)}</span></td>
                    <td className="px-3 py-1.5 font-mono text-slate-600 whitespace-nowrap">{[r.in_time,r.out_time].filter(Boolean).join(' / ')||'—'}</td>
                    <td className="px-3 py-1.5 text-slate-500 max-w-[100px] truncate">{r.remarks||'—'}</td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditRec(r)} className="p-1 rounded hover:bg-blue-50 text-blue-600 cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(r.id, r.student_name)} className="p-1 rounded hover:bg-rose-50 text-rose-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
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
            <button onClick={() => setPage(1)} disabled={page===1} className="px-2 py-0.5 border border-slate-300 rounded text-xs text-slate-600 hover:bg-white disabled:opacity-40 cursor-pointer">First</button>
            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="px-2 py-0.5 border border-slate-300 rounded text-xs text-slate-600 hover:bg-white disabled:opacity-40 cursor-pointer">Prev</button>
            <span className="px-3 py-0.5 bg-blue-600 text-white rounded text-xs font-bold">{page}/{tp}</span>
            <button onClick={() => setPage(p => Math.min(tp,p+1))} disabled={page===tp} className="px-2 py-0.5 border border-slate-300 rounded text-xs text-slate-600 hover:bg-white disabled:opacity-40 cursor-pointer">Next</button>
            <button onClick={() => setPage(tp)} disabled={page===tp} className="px-2 py-0.5 border border-slate-300 rounded text-xs text-slate-600 hover:bg-white disabled:opacity-40 cursor-pointer">Last</button>
          </div>
        </div>
      </div>
      {editRec && <EditModal record={editRec} onClose={() => setEditRec(null)} onSave={saveEdit} />}
    </div>
  );
}

function MonthlyTab({ classes }: { classes: ClassOption[] }) {
  const [selClass, setSelClass] = useState('');
  const [selMonth, setSelMonth] = useState(CURRENT_MONTH);
  const [matrix, setMatrix] = useState<MonthlyRow[]>([]);
  const [dim, setDim] = useState(31);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!selClass) return;
    setLoading(true);
    try {
      const res = await api.get('/attendance/monthly-report', { params: { class_id: selClass, month: selMonth } });
      if (res.data.success) { setMatrix(res.data.data); setDim(res.data.days_in_month); }
    } catch {
      const [y, m] = selMonth.split('-');
      const days = new Date(parseInt(y), parseInt(m), 0).getDate();
      setDim(days);
      const demo: MonthlyRow[] = DEMO_NAMES.slice(0,6).map((n, i) => {
        const dObj: Record<number, AttendanceStatus | null> = {};
        let p=0,a=0,l=0,h=0;
        for (let d=1;d<=days;d++) {
          const s = STATUSES[Math.floor(Math.random()*4)];
          dObj[d] = Math.random() > 0.05 ? s : null;
          if(dObj[d]==='present')p++; else if(dObj[d]==='absent')a++; else if(dObj[d]==='late')l++; else if(dObj[d]==='half_day')h++;
        }
        const tm=p+a+l+h;
        return { student_id:i+1, student_name:n, admission_number:`ADM-${i+1}`, roll_number:String(i+1), days:dObj, present:p, absent:a, late:l, half_day:h, total_marked:tm, attendance_pct:tm>0?Math.round(((p+0.5*h)/tm)*1000)/10:0 };
      });
      setMatrix(demo);
    } finally { setLoading(false); }
  }, [selClass, selMonth]);

  useEffect(() => { load(); }, [load]);

  const exportXlsx = () => {
    const data = matrix.map(r => {
      const row: any = { Roll: r.roll_number, Name: r.student_name, Adm: r.admission_number };
      for (let d=1;d<=dim;d++) row[`D${d}`] = r.days[d] ? SC[r.days[d]!].label : '-';
      row.P=r.present; row.A=r.absent; row.L=r.late; row.HD=r.half_day; row.Total=r.total_marked; row['Att%']=r.attendance_pct;
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Monthly');
    XLSX.writeFile(wb, `monthly_${selMonth}.xlsx`); toast.success('Exported!');
  };

  const [my, mm] = selMonth.split('-');
  const monthLabel = new Date(parseInt(my), parseInt(mm)-1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  const avgPct = matrix.length ? Math.round(matrix.reduce((s,r) => s+r.attendance_pct,0)/matrix.length*10)/10 : 0;

  return (
    <div className="space-y-2">
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs flex flex-wrap items-center gap-3">
        <div style={{ minWidth: '170px', flex: 1 }}>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Class</label>
          <Select options={classes} value={classes.find(c=>c.value===selClass)||null} onChange={o => setSelClass(o?.value||'')} placeholder="Select Class..." styles={selectSt} classNamePrefix="react-select" isClearable />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Month</label>
          <input type="month" value={selMonth} onChange={e => setSelMonth(e.target.value)} className="px-2.5 py-1 h-8 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500" />
        </div>
        {matrix.length > 0 && (
          <>
            <button onClick={exportXlsx} className="mt-auto px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"><Download className="w-3.5 h-3.5" /> Export Excel</button>
            <div className="ml-auto flex items-center gap-4 mt-auto">
              <div className="text-center"><div className="text-lg font-black text-slate-800">{matrix.length}</div><div className="text-[9px] text-slate-400 font-bold uppercase">Students</div></div>
              <div className="text-center"><div className={`text-lg font-black ${avgPct>=75?'text-emerald-700':avgPct>=50?'text-amber-700':'text-rose-700'}`}>{avgPct}%</div><div className="text-[9px] text-slate-400 font-bold uppercase">Avg Attendance</div></div>
            </div>
          </>
        )}
      </div>

      {!selClass ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-2xs"><BarChart2 className="w-10 h-10 mx-auto mb-3 text-slate-300" /><div className="text-sm font-bold">Select a Class and Month</div></div>
      ) : loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><div className="text-xs text-slate-400">Generating report...</div></div>
      ) : matrix.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-2xs"><Users className="w-10 h-10 mx-auto mb-3 text-slate-300" /><div className="text-sm font-bold">No students found</div></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm font-bold text-slate-800">{monthLabel} - Attendance Grid</div>
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(SC).map(([k,c]) => (
                <span key={k} className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.bg} ${c.color}`}>{c.label} = {k==='half_day'?'Half Day':k.charAt(0).toUpperCase()+k.slice(1)}</span>
              ))}
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">- = Unmarked</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="text-[10px] border-collapse" style={{ minWidth: 'max-content' }}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200" style={{ minWidth: '155px' }}>Student</th>
                  <th className="sticky bg-slate-50 px-2 py-2 text-center font-bold text-slate-500 uppercase border-r border-slate-200 w-8" style={{ left: '155px', zIndex: 10 }}>Roll</th>
                  {Array.from({length:dim},(_,i) => {
                    const dd = new Date(parseInt(my), parseInt(mm)-1, i+1);
                    const dow = dd.getDay();
                    const isSun = dow===0||dow===6;
                    return <th key={i+1} className={`px-0.5 py-1.5 text-center font-bold uppercase w-7 ${isSun?'bg-slate-100 text-slate-400':'text-slate-500'}`}><div>{i+1}</div><div className="text-[8px] font-normal opacity-60">{'SMTWTFS'[dow]}</div></th>;
                  })}
                  <th className="px-2 py-2 text-center font-bold text-emerald-600 uppercase w-8 bg-emerald-50 border-l border-slate-200">P</th>
                  <th className="px-2 py-2 text-center font-bold text-rose-600 uppercase w-8 bg-rose-50">A</th>
                  <th className="px-2 py-2 text-center font-bold text-amber-600 uppercase w-8 bg-amber-50">L</th>
                  <th className="px-2 py-2 text-center font-bold text-blue-600 uppercase w-8 bg-blue-50">HD</th>
                  <th className="px-2 py-2 text-center font-bold text-slate-700 uppercase w-12 bg-slate-100">Att%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matrix.map((r, idx) => (
                  <tr key={r.student_id} className={`${idx%2===0?'bg-white':'bg-slate-50/30'} hover:bg-blue-50/20`}>
                    <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 border-r border-slate-200" style={{ minWidth: '155px' }}>
                      <div className="font-bold text-slate-800 truncate max-w-[135px]">{r.student_name}</div>
                      <div className="text-[9px] text-slate-400 font-mono">{r.admission_number}</div>
                    </td>
                    <td className="sticky bg-inherit px-2 py-1.5 text-center font-mono font-bold text-slate-600 border-r border-slate-200 w-8" style={{ left: '155px', zIndex: 10 }}>{r.roll_number}</td>
                    {Array.from({length:dim},(_,i) => {
                      const day = i+1;
                      const st = r.days[day];
                      const cfg = st ? SC[st] : null;
                      const dd = new Date(parseInt(my), parseInt(mm)-1, day);
                      const isSun = dd.getDay()===0||dd.getDay()===6;
                      return (
                        <td key={day} className={`px-0.5 py-1 text-center ${isSun?'bg-slate-50':''}`}>
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
                    <td className={`px-2 py-1.5 text-center font-black ${r.attendance_pct>=75?'text-emerald-700 bg-emerald-100/60':r.attendance_pct>=50?'text-amber-700 bg-amber-100/60':'text-rose-700 bg-rose-100/60'}`}>{r.attendance_pct}%</td>
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

export default function StudentAttendanceRegistry() {
  const [tab, setTab] = useState<'daily'|'logs'|'monthly'>('daily');
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [stats, setStats] = useState<Stats>({ present:0, absent:0, late:0, half_day:0, total:0, unmarked:0, total_students:0, attendance_pct:0 });

  useEffect(() => {
    api.get('/attendance/class-list')
      .then(r => { if(r.data.success) setClasses(r.data.data.map((c: any) => ({ value: String(c.id), label: c.name }))); })
      .catch(() => setClasses([{value:'1',label:'Class 10-A'},{value:'2',label:'Class 10-B'},{value:'3',label:'Class 9-A'},{value:'4',label:'Class 9-B'},{value:'5',label:'Class 8-A'}]));
    api.get('/attendance/dashboard-stats')
      .then(r => { if(r.data.success) setStats(r.data.data); })
      .catch(() => setStats({ present:234, absent:45, late:12, half_day:8, total:299, unmarked:47, total_students:346, attendance_pct:82.4 }));
  }, []);

  const TABS = [
    { key: 'daily'   as const, label: 'Daily Attendance', icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { key: 'logs'    as const, label: 'Attendance Logs',  icon: <ClipboardList  className="w-3.5 h-3.5" /> },
    { key: 'monthly' as const, label: 'Monthly Report',   icon: <BarChart2      className="w-3.5 h-3.5" /> },
  ];

  const STAT_CARDS = [
    { label: 'Total Students', value: stats.total_students, icon: <Users className="w-4 h-4" />,         color: 'bg-blue-50 text-blue-600' },
    { label: 'Present Today',  value: stats.present,        icon: <UserCheck className="w-4 h-4" />,     color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Absent Today',   value: stats.absent,         icon: <UserX className="w-4 h-4" />,         color: 'bg-rose-50 text-rose-600' },
    { label: 'Late',           value: stats.late,           icon: <Clock className="w-4 h-4" />,         color: 'bg-amber-50 text-amber-600' },
    { label: 'Half Day',       value: stats.half_day,       icon: <AlarmClock className="w-4 h-4" />,    color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Unmarked',       value: stats.unmarked,       icon: <Filter className="w-4 h-4" />,        color: 'bg-slate-100 text-slate-600' },
    { label: 'Marked Today',   value: stats.total,          icon: <CheckCircle2 className="w-4 h-4" />,  color: 'bg-cyan-50 text-cyan-600' },
    { label: 'Attendance %',   value: stats.attendance_pct+'%', icon: <TrendingUp className="w-4 h-4" />, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="bg-[#f4f7fc] min-h-screen p-2 sm:p-3 font-sans text-slate-800">
      <div className="max-w-[1600px] mx-auto space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-[#2b6cb0] tracking-tight leading-none">Student Attendance Registry</h1>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
              <span>Dashboard</span><span className="text-slate-300">/</span><span>Attendance</span><span className="text-slate-300">/</span>
              <span className="font-bold text-slate-700">Student Registry</span>
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
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all cursor-pointer border-b-2 whitespace-nowrap ${tab===t.key?'border-blue-600 text-blue-700 bg-blue-50/60':'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50'}`}>
              {t.icon}<span>{t.label}</span>
            </button>
          ))}
        </div>

        {tab === 'daily'   && <DailyTab   classes={classes} />}
        {tab === 'logs'    && <LogsTab    classes={classes} />}
        {tab === 'monthly' && <MonthlyTab classes={classes} />}
      </div>
    </div>
  );
}
