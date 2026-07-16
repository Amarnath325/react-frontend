import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Trash2, RefreshCw,
  X, AlertTriangle, Loader2, Download, Copy, BookOpen,
  Clock, User, MapPin, Coffee, Zap, CheckCircle2, Users,
  ToggleLeft, ToggleRight, PenLine, Eye, Filter, AlertCircle
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════ */
interface TimetableSlot {
  id?: number;
  school_id?: number;
  academic_year_id: number;
  class_id: number;
  section_id?: number | null;
  day_of_week: number;  // 1=Mon .. 6=Sat
  period_number: number;
  start_time: string;
  end_time: string;
  subject_id?: number | null;
  teacher_id?: number | null;
  room_number?: string | null;
  is_break: boolean;
  is_active?: boolean;
  notes?: string | null;
  day_name?: string;
  subject?: { id: number; name: string; code: string; subject_type: string };
  teacher?: { id: number; employee_id: string; user?: { first_name: string; last_name: string } };
  academic_year?: { id: number; year_name: string; is_current: boolean };
}

interface ClassOpt    { m_id: number; m_name: string }
interface SectionOpt  { id: number; name: string; class_id: number; section_name?: string }
interface SubjectOpt  { id: number; name: string; code: string; class_id: number; subject_type: string }
interface TeacherOpt  { id: number; employee_id: string; user?: { first_name: string; last_name: string } }
interface AcadYearOpt { id: number; year_name: string; is_current: boolean }

interface Stats {
  total_slots: number; teaching_periods: number; breaks: number;
  teachers_engaged: number; classes_covered: number; subjects_covered: number;
}
interface ConflictItem {
  teacher: string; teacher_id: number; day: string;
  slot_a: TimetableSlot; slot_b: TimetableSlot;
}

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const DAYS = [
  { num: 1, short: 'MON', full: 'Monday' },
  { num: 2, short: 'TUE', full: 'Tuesday' },
  { num: 3, short: 'WED', full: 'Wednesday' },
  { num: 4, short: 'THU', full: 'Thursday' },
  { num: 5, short: 'FRI', full: 'Friday' },
  { num: 6, short: 'SAT', full: 'Saturday' },
];

const DEFAULT_PERIODS = [
  { num: 1,  start: '09:00', end: '09:45', label: 'Period 1',   is_break: false },
  { num: 2,  start: '09:45', end: '10:30', label: 'Period 2',   is_break: false },
  { num: 3,  start: '10:30', end: '11:15', label: 'Period 3',   is_break: false },
  { num: 4,  start: '11:15', end: '12:00', label: 'Period 4',   is_break: false },
  { num: 5,  start: '12:00', end: '12:30', label: 'Lunch',      is_break: true  },
  { num: 6,  start: '12:30', end: '13:15', label: 'Period 5',   is_break: false },
  { num: 7,  start: '13:15', end: '14:00', label: 'Period 6',   is_break: false },
  { num: 8,  start: '14:00', end: '14:45', label: 'Period 7',   is_break: false },
  { num: 9,  start: '14:45', end: '15:30', label: 'Period 8',   is_break: false },
];

const SUBJECT_COLORS = [
  'bg-sky-100 border-sky-300 text-sky-800',
  'bg-violet-100 border-violet-300 text-violet-800',
  'bg-emerald-100 border-emerald-300 text-emerald-800',
  'bg-amber-100 border-amber-300 text-amber-800',
  'bg-rose-100 border-rose-300 text-rose-800',
  'bg-indigo-100 border-indigo-300 text-indigo-800',
  'bg-teal-100 border-teal-300 text-teal-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-cyan-100 border-cyan-300 text-cyan-800',
];

const teacherName = (t?: TeacherOpt) =>
  t?.user ? `${t.user.first_name} ${t.user.last_name}`.trim() : '';

/* ═══════════════════════════════════════════════════════
   SLOT CELL COMPONENT
═══════════════════════════════════════════════════════ */
function SlotCell({ slot, colorIdx, onEdit, onDelete }: {
  slot: TimetableSlot | null;
  colorIdx: number;
  onEdit: (s: TimetableSlot | null, day: number, period: number) => void;
  onDelete: (id: number) => void;
}) {
  if (!slot) {
    return (
      <div className="h-full min-h-[70px] border border-dashed border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 transition cursor-pointer flex items-center justify-center group"
        onClick={() => onEdit(null, 0, 0)}>
        <Plus className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition" />
      </div>
    );
  }

  if (slot.is_break) {
    return (
      <div className="h-full min-h-[70px] bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center gap-1.5 group relative cursor-pointer"
        onClick={() => onEdit(slot, slot.day_of_week, slot.period_number)}>
        <Coffee className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[11px] font-bold text-amber-700">{slot.subject?.name || 'Break'}</span>
        <button onClick={e => { e.stopPropagation(); if (slot.id) onDelete(slot.id); }}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 text-amber-600 hover:text-rose-600 transition">
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  const clr = SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length];
  return (
    <div className={`h-full min-h-[70px] border rounded-lg p-2 group relative cursor-pointer hover:shadow-md transition ${clr} ${!slot.is_active ? 'opacity-50' : ''}`}
      onClick={() => onEdit(slot, slot.day_of_week, slot.period_number)}>
      <p className="text-[11px] font-bold leading-tight truncate">{slot.subject?.name || '—'}</p>
      {slot.subject?.code && <p className="text-[9px] font-mono opacity-70 mt-0.5">{slot.subject.code}</p>}
      {slot.teacher && (
        <p className="text-[10px] font-medium mt-1 flex items-center gap-0.5 opacity-80">
          <User className="w-2.5 h-2.5" />{teacherName(slot.teacher).split(' ').map(w => w[0]).join('').toUpperCase()}
        </p>
      )}
      {slot.room_number && (
        <p className="text-[9px] opacity-60 flex items-center gap-0.5">
          <MapPin className="w-2 h-2" />{slot.room_number}
        </p>
      )}
      <button onClick={e => { e.stopPropagation(); if (slot.id) onDelete(slot.id); }}
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded bg-white/60 text-rose-500 hover:text-rose-700 transition">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function TimetableAllocation() {
  /* ── dropdowns ── */
  const [classes,   setClasses]   = useState<ClassOpt[]>([]);
  const [sections,  setSections]  = useState<SectionOpt[]>([]);
  const [subjects,  setSubjects]  = useState<SubjectOpt[]>([]);
  const [teachers,  setTeachers]  = useState<TeacherOpt[]>([]);
  const [acadYears, setAcadYrs]   = useState<AcadYearOpt[]>([]);

  /* ── filters ── */
  const [selClass,   setSelClass]  = useState('');
  const [selSection, setSelSec]    = useState('');
  const [selAcad,    setSelAcad]   = useState('');
  const [viewMode,   setViewMode]  = useState<'class' | 'teacher'>('class');
  const [selTeacher, setSelTch]    = useState('');

  /* ── timetable grid ── */
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [grid,  setGrid]  = useState<Map<string, TimetableSlot>>(new Map());

  /* ── periods config ── */
  const [periods, setPeriods] = useState(DEFAULT_PERIODS);
  const [showAllDays, setShowAllDays] = useState(false);
  const activeDays = showAllDays ? DAYS : DAYS.slice(0, 6);

  /* ── stats ── */
  const [stats,     setStats]    = useState<Stats | null>(null);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);

  /* ── ui state ── */
  const [loading,    setLoading]   = useState(false);
  const [saving,     setSaving]    = useState(false);
  const [deleting,   setDeleting]  = useState(false);
  const [tab,        setTab]       = useState<'grid' | 'list' | 'conflicts'>('grid');

  /* ── modal ── */
  const [showModal,    setShowModal]  = useState(false);
  const [editingSlot,  setEditing]    = useState<TimetableSlot | null>(null);
  const [modalDay,     setModalDay]   = useState(1);
  const [modalPeriod,  setModalPeriod] = useState(1);
  const [mSubject,     setMSubject]   = useState('');
  const [mTeacher,     setMTeacher]   = useState('');
  const [mRoom,        setMRoom]      = useState('');
  const [mIsBreak,     setMBreak]     = useState(false);
  const [mStart,       setMStart]     = useState('');
  const [mEnd,         setMEnd]       = useState('');
  const [mNotes,       setMNotes]     = useState('');
  const [mBreakLabel,  setMBreakLbl]  = useState('Break');

  /* ── copy modal ── */
  const [showCopy,   setShowCopy]  = useState(false);
  const [copyToClass, setCopyToClass] = useState('');
  const [copyToSec,   setCopyToSec]   = useState('');
  const [copyToAcad,  setCopyToAcad]  = useState('');
  const [copying,     setCopying]     = useState(false);

  /* ── subject color map ── */
  const subjectColorMap = useRef<Map<number, number>>(new Map());
  const getSubjectColor = (subjectId: number): number => {
    if (!subjectColorMap.current.has(subjectId)) {
      subjectColorMap.current.set(subjectId, subjectColorMap.current.size);
    }
    return subjectColorMap.current.get(subjectId)!;
  };

  /* ═══ FETCH DROPDOWNS ═══ */
  useEffect(() => {
    (async () => {
      try {
        const [clsRes, secRes, subRes, tchRes, ayRes] = await Promise.all([
          api.get('/master/classes'),
          api.get('/school/sections'),
          api.get('/school/subjects'),
          api.get('/school/teachers'),
          api.get('/school/academic-years'),
        ]);

        if (clsRes.data) {
          const d = clsRes.data.data || clsRes.data;
          if (typeof d === 'object' && !Array.isArray(d)) {
            setClasses(Object.entries(d).map(([id, name]) => ({ m_id: parseInt(id), m_name: name as string })));
          } else setClasses(d || []);
        }
        if (secRes.data) setSections(secRes.data.data || secRes.data || []);
        if (subRes.data) setSubjects(subRes.data.data || subRes.data || []);
        if (tchRes.data) setTeachers(tchRes.data.data || tchRes.data || []);
        if (ayRes.data) {
          const years = ayRes.data.data || ayRes.data || [];
          setAcadYrs(years);
          const curr = years.find((y: AcadYearOpt) => y.is_current);
          if (curr) setSelAcad(String(curr.id));
        }
      } catch { /* silent */ }
    })();
  }, []);

  /* ═══ BUILD GRID FROM SLOTS ═══ */
  const buildGrid = useCallback((slotList: TimetableSlot[]) => {
    const m = new Map<string, TimetableSlot>();
    slotList.forEach(s => m.set(`${s.day_of_week}_${s.period_number}`, s));
    setGrid(m);
    // Reset color map
    subjectColorMap.current = new Map();
    slotList.filter(s => !s.is_break && s.subject_id).forEach(s => getSubjectColor(s.subject_id!));
  }, []);

  /* ═══ FETCH TIMETABLE ═══ */
  const fetchTimetable = useCallback(async () => {
    if (!selAcad) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { academic_year_id: selAcad };
      if (viewMode === 'class') {
        if (!selClass) { setSlots([]); buildGrid([]); setLoading(false); return; }
        params.class_id = selClass;
        if (selSection) params.section_id = selSection;
      } else {
        if (!selTeacher) { setSlots([]); buildGrid([]); setLoading(false); return; }
        params.teacher_id = selTeacher;
      }

      const res = await api.get('/school/timetable', { params });
      if (res.data.success) {
        setSlots(res.data.data || []);
        buildGrid(res.data.data || []);
      }
    } catch { toast.error('Failed to load timetable'); }
    finally { setLoading(false); }
  }, [selClass, selSection, selAcad, selTeacher, viewMode, buildGrid]);

  const fetchStats = useCallback(async () => {
    if (!selAcad) return;
    try {
      const res = await api.get('/school/timetable/stats', { params: { academic_year_id: selAcad } });
      if (res.data.success) setStats(res.data.data);
    } catch { /* silent */ }
  }, [selAcad]);

  const fetchConflicts = useCallback(async () => {
    if (!selAcad) return;
    try {
      const res = await api.get('/school/timetable/conflicts', { params: { academic_year_id: selAcad } });
      if (res.data.success) setConflicts(res.data.data || []);
    } catch { /* silent */ }
  }, [selAcad]);

  useEffect(() => { fetchTimetable(); }, [fetchTimetable]);
  useEffect(() => { fetchStats(); fetchConflicts(); }, [fetchStats, fetchConflicts]);

  /* ═══ OPEN EDIT MODAL ═══ */
  const openModal = (existingSlot: TimetableSlot | null, day: number, period: number) => {
    const p = periods.find(p => p.num === period) || periods[0];
    setEditing(existingSlot);
    setModalDay(day || 1);
    setModalPeriod(period || 1);
    setMSubject(existingSlot?.subject_id ? String(existingSlot.subject_id) : '');
    setMTeacher(existingSlot?.teacher_id ? String(existingSlot.teacher_id) : '');
    setMRoom(existingSlot?.room_number   || '');
    setMBreak(existingSlot?.is_break     || false);
    setMStart(existingSlot?.start_time   || p.start);
    setMEnd(existingSlot?.end_time       || p.end);
    setMNotes(existingSlot?.notes        || '');
    setMBreakLbl(existingSlot?.subject?.name || 'Break');
    setShowModal(true);
  };

  const openSlotFromGrid = (day: number, period: number) => {
    const existing = grid.get(`${day}_${period}`) || null;
    openModal(existing, day, period);
  };

  /* ═══ SAVE SLOT ═══ */
  const saveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selAcad || !selClass) { toast.error('Select academic year and class first'); return; }
    if (!mStart || !mEnd) { toast.error('Start and end time required'); return; }
    if (!mIsBreak && !mSubject) { toast.error('Subject required for teaching periods'); return; }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        academic_year_id: parseInt(selAcad),
        class_id:         parseInt(selClass),
        section_id:       selSection ? parseInt(selSection) : null,
        day_of_week:      modalDay,
        period_number:    modalPeriod,
        start_time:       mStart,
        end_time:         mEnd,
        is_break:         mIsBreak,
        room_number:      mRoom || null,
        notes:            mNotes || null,
        is_active:        true,
      };
      if (mIsBreak) {
        payload.subject_id = null; payload.teacher_id = null;
      } else {
        payload.subject_id = mSubject ? parseInt(mSubject) : null;
        payload.teacher_id = mTeacher ? parseInt(mTeacher) : null;
      }

      const res = await api.post('/school/timetable/slot', payload);
      if (res.data.success) {
        toast.success('Slot saved!');
        setShowModal(false);
        await fetchTimetable();
        fetchStats(); fetchConflicts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  /* ═══ DELETE SLOT ═══ */
  const deleteSlot = async (id: number) => {
    if (!confirm('Remove this period slot?')) return;
    setDeleting(true);
    try {
      await api.delete(`/school/timetable/${id}`);
      toast.success('Slot removed');
      fetchTimetable(); fetchStats(); fetchConflicts();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  /* ═══ CLEAR ALL ═══ */
  const clearAll = async () => {
    if (!selClass || !selAcad) return;
    if (!confirm('Clear ALL slots for this class/section/year?')) return;
    try {
      await api.delete('/school/timetable/clear', {
        data: { class_id: parseInt(selClass), section_id: selSection ? parseInt(selSection) : null, academic_year_id: parseInt(selAcad) }
      });
      toast.success('Timetable cleared'); fetchTimetable(); fetchStats(); fetchConflicts();
    } catch { toast.error('Clear failed'); }
  };

  /* ═══ COPY TIMETABLE ═══ */
  const handleCopy = async () => {
    if (!selClass || !selAcad || !copyToClass || !copyToAcad) { toast.error('Fill all required fields'); return; }
    setCopying(true);
    try {
      const res = await api.post('/school/timetable/copy', {
        from_class_id:         parseInt(selClass),
        from_section_id:       selSection  ? parseInt(selSection)  : null,
        from_academic_year_id: parseInt(selAcad),
        to_class_id:           parseInt(copyToClass),
        to_section_id:         copyToSec   ? parseInt(copyToSec)   : null,
        to_academic_year_id:   parseInt(copyToAcad),
      });
      if (res.data.success) { toast.success(res.data.message); setShowCopy(false); }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Copy failed'); }
    finally { setCopying(false); }
  };

  /* ═══ EXPORT ═══ */
  const exportTimetable = async () => {
    try {
      const XLSX = await import('xlsx');
      const rows: unknown[][] = [['Day', 'Period', 'Start', 'End', 'Subject', 'Teacher', 'Room', 'Break?']];
      DAYS.forEach(d => {
        periods.forEach(p => {
          const s = grid.get(`${d.num}_${p.num}`);
          rows.push([
            d.full, p.num, p.start, p.end,
            s?.is_break ? (s?.subject?.name || 'Break') : (s?.subject?.name || ''),
            s && !s.is_break ? teacherName(s.teacher) : '',
            s?.room_number || '',
            s?.is_break ? 'Yes' : 'No',
          ]);
        });
      });
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'timetable.xlsx'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported!');
    } catch { toast.error('Export failed'); }
  };

  /* ═══ HELPERS ═══ */
  const filteredSections = selClass ? sections.filter(s => String(s.class_id) === selClass) : [];
  const filteredSubjectsForModal = selClass ? subjects.filter(s => String(s.class_id) === selClass) : subjects;
  const className = classes.find(c => String(c.m_id) === selClass)?.m_name || '';
  const sectionName = sections.find(s => String(s.id) === selSection)?.name || '';
  const yearName = acadYears.find(y => String(y.id) === selAcad)?.year_name || '';

  /* ═══════════════════════════════════════════════════════ */
  return (
    <div className="space-y-4">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Calendar className="w-5 h-5" /></span>
            Timetable Scheduling Desk
          </h1>
          <p className="text-slate-500 mt-1 text-xs">Build and manage weekly period timetables. Detect teacher conflicts, copy timetables, and export.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setTab('grid')}      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${tab === 'grid'      ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
            <Calendar className="w-3.5 h-3.5 inline mr-1" />Grid View
          </button>
          <button onClick={() => setTab('list')}      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${tab === 'list'      ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
            <Eye className="w-3.5 h-3.5 inline mr-1" />List View
          </button>
          <button onClick={() => setTab('conflicts')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${tab === 'conflicts' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Conflicts {conflicts.length > 0 && <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${tab === 'conflicts' ? 'bg-rose-400' : 'bg-rose-500 text-white'}`}>{conflicts.length}</span>}
          </button>
        </div>
      </div>

      {/* ═══ STATS CARDS ═══ */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { label: 'Total Slots',        val: stats.total_slots,        bg: 'bg-indigo-50',  text: 'text-indigo-600', icon: <Calendar className="w-3.5 h-3.5" />       },
            { label: 'Teaching Periods',   val: stats.teaching_periods,   bg: 'bg-emerald-50', text: 'text-emerald-600',icon: <BookOpen className="w-3.5 h-3.5" />       },
            { label: 'Breaks',             val: stats.breaks,             bg: 'bg-amber-50',   text: 'text-amber-600',  icon: <Coffee className="w-3.5 h-3.5" />         },
            { label: 'Teachers Engaged',   val: stats.teachers_engaged,   bg: 'bg-violet-50',  text: 'text-violet-600', icon: <User className="w-3.5 h-3.5" />           },
            { label: 'Classes Covered',    val: stats.classes_covered,    bg: 'bg-sky-50',     text: 'text-sky-600',    icon: <Users className="w-3.5 h-3.5" />          },
            { label: 'Subjects',           val: stats.subjects_covered,   bg: 'bg-rose-50',    text: 'text-rose-600',   icon: <Zap className="w-3.5 h-3.5" />            },
          ].map(s => (
            <div key={s.label} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{s.label}</span>
                <span className="text-lg font-bold text-slate-800">{s.val}</span>
              </div>
              <div className={`p-2 rounded-lg ${s.bg} ${s.text}`}>{s.icon}</div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ FILTERS BAR ═══ */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-slate-200">
            <button onClick={() => setViewMode('class')} className={`px-3 py-1.5 text-xs font-semibold transition ${viewMode === 'class' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Class View</button>
            <button onClick={() => setViewMode('teacher')} className={`px-3 py-1.5 text-xs font-semibold transition ${viewMode === 'teacher' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Teacher View</button>
          </div>

          <select className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-indigo-400 shadow-sm"
            value={selAcad} onChange={e => setSelAcad(e.target.value)}>
            <option value="">Select Academic Year</option>
            {acadYears.map(y => <option key={y.id} value={String(y.id)}>{y.year_name}{y.is_current ? ' ★' : ''}</option>)}
          </select>

          {viewMode === 'class' ? (
            <>
              <select className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-indigo-400 shadow-sm"
                value={selClass} onChange={e => { setSelClass(e.target.value); setSelSec(''); }}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.m_id} value={String(c.m_id)}>{c.m_name}</option>)}
              </select>
              <select className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-indigo-400 shadow-sm"
                value={selSection} onChange={e => setSelSec(e.target.value)} disabled={!selClass}>
                <option value="">All Sections</option>
                {filteredSections.map(s => <option key={s.id} value={String(s.id)}>{s.name || s.section_name}</option>)}
              </select>
            </>
          ) : (
            <select className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-indigo-400 shadow-sm"
              value={selTeacher} onChange={e => setSelTch(e.target.value)}>
              <option value="">Select Teacher</option>
              {teachers.map(t => <option key={t.id} value={String(t.id)}>{teacherName(t)} ({t.employee_id})</option>)}
            </select>
          )}

          <button onClick={fetchTimetable} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {slots.length > 0 && viewMode === 'class' && (
            <>
              <button onClick={exportTimetable} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
                <Download className="w-3.5 h-3.5 text-emerald-500" /> Export
              </button>
              <button onClick={() => setShowCopy(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
                <Copy className="w-3.5 h-3.5 text-indigo-500" /> Copy To
              </button>
              <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition shadow-sm">
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
            </>
          )}
        </div>
        {(selClass || selTeacher) && selAcad && (
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            Viewing: <span className="text-indigo-700 font-bold">{viewMode === 'class' ? `${className}${sectionName ? ' · ' + sectionName : ''}` : teacherName(teachers.find(t => String(t.id) === selTeacher))}</span>
            {' — '} <span className="text-indigo-600">{yearName}</span>
          </div>
        )}
      </div>

      {/* ═══ GRID VIEW ═══ */}
      {tab === 'grid' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-xs text-slate-500">Loading timetable...</span>
              </div>
            </div>
          ) : !selClass && !selTeacher ? (
            <div className="bg-white border border-slate-200 rounded-xl p-14 text-center shadow-sm">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4"><Calendar className="w-8 h-8" /></div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Select a Class or Teacher</h3>
              <p className="text-xs text-slate-500">Choose academic year, class and section to view or edit the timetable.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              {/* Instruction banner */}
              <div className="px-4 py-2 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between">
                <p className="text-[11px] text-indigo-700 font-medium flex items-center gap-1.5">
                  <PenLine className="w-3 h-3" /> Click any cell to add/edit a period slot
                </p>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="rounded" checked={showAllDays} onChange={e => setShowAllDays(e.target.checked)} />
                  <span className="text-[10px] text-indigo-700 font-semibold">Show Sunday</span>
                </label>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full" style={{ minWidth: '800px' }}>
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-slate-50 border-b border-r border-slate-200 py-3 px-3 text-left">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Period</span>
                          <span className="text-[9px] font-bold text-slate-400">Time</span>
                        </div>
                      </th>
                      {activeDays.map(d => (
                        <th key={d.num} className="border-b border-slate-200 py-3 px-2 text-center bg-slate-50">
                          <div className="text-[11px] font-black text-slate-700 tracking-widest">{d.short}</div>
                          <div className="text-[9px] font-medium text-slate-400">{d.full}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map(p => (
                      <tr key={p.num} className="group hover:bg-slate-50/50 transition border-b border-slate-100 last:border-0">
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/80 border-r border-slate-100 py-2 px-3 align-top" style={{ minWidth: '100px' }}>
                          <div className="flex items-center gap-1.5">
                            {p.is_break
                              ? <Coffee className="w-3 h-3 text-amber-500 shrink-0" />
                              : <Clock className="w-3 h-3 text-indigo-400 shrink-0" />
                            }
                            <div>
                              <p className="text-[10px] font-bold text-slate-700">{p.label}</p>
                              <p className="text-[9px] text-slate-400 font-mono">{p.start}–{p.end}</p>
                            </div>
                          </div>
                        </td>
                        {activeDays.map(d => {
                          const slot = grid.get(`${d.num}_${p.num}`);
                          const colorIdx = slot && !slot.is_break && slot.subject_id ? getSubjectColor(slot.subject_id) : 0;
                          return (
                            <td key={d.num} className="py-2 px-1.5 align-top" style={{ minWidth: '130px', width: `${100 / activeDays.length}%` }}>
                              <SlotCell
                                slot={slot || null}
                                colorIdx={colorIdx}
                                onEdit={(s, day, period) => {
                                  const targetDay  = s?.day_of_week    ?? d.num;
                                  const targetPer  = s?.period_number  ?? p.num;
                                  openSlotFromGrid(targetDay, targetPer);
                                  setModalDay(d.num);
                                  setModalPeriod(p.num);
                                  setMStart(s?.start_time ?? p.start);
                                  setMEnd(s?.end_time     ?? p.end);
                                  setMBreak(s?.is_break   ?? p.is_break);
                                  setMSubject(s?.subject_id ? String(s.subject_id) : '');
                                  setMTeacher(s?.teacher_id ? String(s.teacher_id) : '');
                                  setMRoom(s?.room_number   || '');
                                  setMNotes(s?.notes        || '');
                                  setEditing(s || null);
                                  setShowModal(true);
                                }}
                                onDelete={deleteSlot}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Subject Legend */}
              {slots.filter(s => !s.is_break && s.subject).length > 0 && (
                <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap gap-2">
                  {Array.from(new Map(slots.filter(s => !s.is_break && s.subject_id).map(s => [s.subject_id, s])).values()).map(s => {
                    const ci = getSubjectColor(s.subject_id!);
                    const clr = SUBJECT_COLORS[ci % SUBJECT_COLORS.length];
                    return (
                      <span key={s.subject_id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${clr}`}>
                        {s.subject?.name} {s.subject?.code ? `(${s.subject.code})` : ''}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══ LIST VIEW ═══ */}
      {tab === 'list' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {slots.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-sm text-slate-500">No timetable slots found for the selected filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Day', 'Period', 'Time', 'Subject', 'Teacher', 'Room', 'Type', 'Status'].map(h => (
                      <th key={h} className="py-3 px-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                    <th className="py-3 px-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slots.sort((a, b) => a.day_of_week - b.day_of_week || a.period_number - b.period_number).map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <span className="text-xs font-bold text-slate-700">{DAYS.find(d => d.num === s.day_of_week)?.full}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 font-mono">{s.period_number}</td>
                      <td className="py-3 px-4 text-xs text-slate-600 font-mono">{s.start_time}–{s.end_time}</td>
                      <td className="py-3 px-4">
                        {s.is_break
                          ? <span className="text-amber-600 font-bold text-xs flex items-center gap-1"><Coffee className="w-3 h-3" />Break</span>
                          : <span className="text-xs font-semibold text-slate-800">{s.subject?.name || '—'} {s.subject?.code ? <span className="text-slate-400 font-normal font-mono text-[10px]">({s.subject.code})</span> : ''}</span>
                        }
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">{!s.is_break ? teacherName(s.teacher) || '—' : '—'}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{s.room_number || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-bold ${s.is_break ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                          {s.is_break ? 'Break' : 'Teaching'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-bold ${s.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => s.id && openModal(s, s.day_of_week, s.period_number)}
                            className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition"><PenLine className="w-3.5 h-3.5" /></button>
                          <button onClick={() => s.id && deleteSlot(s.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ CONFLICTS VIEW ═══ */}
      {tab === 'conflicts' && (
        <div className="space-y-3">
          {conflicts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-14 text-center shadow-sm">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-7 h-7" /></div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">No Conflicts Found!</h3>
              <p className="text-xs text-slate-500">All teacher assignments are conflict-free for {yearName || 'the selected year'}.</p>
            </div>
          ) : (
            <>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-rose-800">{conflicts.length} Teacher Conflict{conflicts.length !== 1 ? 's' : ''} Detected</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">The following teachers have overlapping class assignments on the same day.</p>
                </div>
              </div>
              <div className="grid gap-3">
                {conflicts.map((c, i) => (
                  <div key={i} className="bg-white border border-rose-100 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-black">{c.teacher.charAt(0)}</div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{c.teacher}</p>
                        <p className="text-[10px] text-rose-600 font-semibold">{c.day} — Overlapping Periods</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[c.slot_a, c.slot_b].map((s, j) => (
                        <div key={j} className="bg-rose-50 border border-rose-100 rounded-lg p-2.5">
                          <p className="text-[10px] font-bold text-rose-700">Period {s.period_number}</p>
                          <p className="text-[10px] text-slate-600 font-mono">{s.start_time}–{s.end_time}</p>
                          <p className="text-[10px] font-semibold text-slate-700 mt-1">{s.subject?.name || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════ SLOT EDIT MODAL ═══════ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                {editingSlot ? 'Edit Period Slot' : 'Add Period Slot'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={saveSlot} className="p-6 space-y-4">
              {/* Day + Period */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Day <span className="text-rose-500">*</span></label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400 cursor-pointer"
                    value={modalDay} onChange={e => setModalDay(parseInt(e.target.value))} required>
                    {DAYS.map(d => <option key={d.num} value={d.num}>{d.full}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Period # <span className="text-rose-500">*</span></label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400 cursor-pointer"
                    value={modalPeriod} onChange={e => setModalPeriod(parseInt(e.target.value))}>
                    {periods.map(p => <option key={p.num} value={p.num}>{p.num} — {p.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Time <span className="text-rose-500">*</span></label>
                  <input type="time" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400"
                    value={mStart} onChange={e => setMStart(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">End Time <span className="text-rose-500">*</span></label>
                  <input type="time" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400"
                    value={mEnd} onChange={e => setMEnd(e.target.value)} required />
                </div>
              </div>

              {/* Break Toggle */}
              <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Coffee className="w-3.5 h-3.5 text-amber-500" />
                  <div>
                    <p className="text-xs font-bold text-amber-800">Break / Free Period</p>
                    <p className="text-[10px] text-amber-600">Toggle for lunch, recess, assembly</p>
                  </div>
                </div>
                <button type="button" onClick={() => setMBreak(!mIsBreak)}
                  className={`w-10 h-5 rounded-full transition relative ${mIsBreak ? 'bg-amber-400' : 'bg-slate-200'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${mIsBreak ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>

              {mIsBreak ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Break Label</label>
                  <input type="text" placeholder="e.g. Lunch Break, Recess" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400"
                    value={mBreakLabel} onChange={e => setMBreakLbl(e.target.value)} />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subject <span className="text-rose-500">*</span></label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400 cursor-pointer"
                      value={mSubject} onChange={e => setMSubject(e.target.value)} required={!mIsBreak}>
                      <option value="">Select Subject</option>
                      {filteredSubjectsForModal.map(s => (
                        <option key={s.id} value={String(s.id)}>{s.name} {s.code ? `(${s.code})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Teacher</label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400 cursor-pointer"
                      value={mTeacher} onChange={e => setMTeacher(e.target.value)}>
                      <option value="">Assign Teacher (optional)</option>
                      {teachers.map(t => <option key={t.id} value={String(t.id)}>{teacherName(t)} ({t.employee_id})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Room / Lab</label>
                    <input type="text" placeholder="e.g. Room 101, Physics Lab" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400"
                      value={mRoom} onChange={e => setMRoom(e.target.value)} />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notes</label>
                <textarea rows={2} placeholder="Optional notes..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400 resize-none"
                  value={mNotes} onChange={e => setMNotes(e.target.value)} />
              </div>

              {!selClass && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 text-[10px] text-amber-700 font-semibold">
                  ⚠️ Please select a class in the filter bar before saving.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                {editingSlot?.id && (
                  <button type="button" onClick={() => { if (editingSlot.id) { deleteSlot(editingSlot.id); setShowModal(false); } }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                )}
                <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm disabled:opacity-50 flex items-center gap-1.5">
                  {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : 'Save Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ COPY MODAL ═══════ */}
      {showCopy && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Copy className="w-4 h-4 text-indigo-600" /> Copy Timetable</h3>
              <button onClick={() => setShowCopy(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs">
                <p className="text-slate-500 font-bold uppercase text-[9px] mb-1">Copy From</p>
                <p className="font-bold text-slate-800">{className}{sectionName ? ' · ' + sectionName : ''}</p>
                <p className="text-slate-500">{yearName}</p>
                <p className="text-[10px] text-indigo-600 mt-1">{slots.length} slots will be copied</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Class <span className="text-rose-500">*</span></label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400 cursor-pointer"
                  value={copyToClass} onChange={e => setCopyToClass(e.target.value)}>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.m_id} value={String(c.m_id)}>{c.m_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Section</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400 cursor-pointer"
                  value={copyToSec} onChange={e => setCopyToSec(e.target.value)} disabled={!copyToClass}>
                  <option value="">All Sections</option>
                  {sections.filter(s => String(s.class_id) === copyToClass).map(s => <option key={s.id} value={String(s.id)}>{s.name || s.section_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Academic Year <span className="text-rose-500">*</span></label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400 cursor-pointer"
                  value={copyToAcad} onChange={e => setCopyToAcad(e.target.value)}>
                  <option value="">Select Year</option>
                  {acadYears.map(y => <option key={y.id} value={String(y.id)}>{y.year_name}{y.is_current ? ' ★' : ''}</option>)}
                </select>
              </div>

              <p className="text-[10px] text-slate-500">Note: Existing slots in the target will be overwritten.</p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setShowCopy(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button onClick={handleCopy} disabled={copying || !copyToClass || !copyToAcad}
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm disabled:opacity-50 flex items-center gap-1.5">
                  {copying ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Copying...</> : <><Copy className="w-3.5 h-3.5" />Copy Timetable</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
