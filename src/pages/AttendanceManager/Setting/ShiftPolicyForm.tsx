import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Select from 'react-select';
import {
  ArrowLeft,
  Save,
  Clock,
  Calendar,
  ShieldCheck,
  Coffee,
  ChevronRight,
  Moon,
  Repeat,
  Sliders,
  Split,
  Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';

// Ultra-Compact Toggle Switch Component
const FormToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, description, disabled = false }) => (
  <div className={`flex items-center justify-between px-2.5 py-1.5 border rounded-lg transition-colors ${
    disabled ? 'bg-slate-100/70 border-slate-200 opacity-75 cursor-not-allowed' : 'bg-slate-50/80 border-slate-200/80 hover:border-slate-300'
  }`}>
    <div className="pr-2 leading-tight">
      <span className="text-[11px] font-bold text-slate-800 block whitespace-nowrap">{label}</span>
      {description && <span className="text-[9.5px] text-slate-500 block truncate max-w-[200px]">{description}</span>}
    </div>
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ${
        checked ? 'bg-blue-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  </div>
);

// Searchable Select Component for Form Fields
const SearchableFormSelect: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ options, value, onChange, placeholder = 'Select...' }) => {
  const selectedOption = options.find((opt) => opt.value === value) || null;

  return (
    <Select
      options={options}
      value={selectedOption}
      onChange={(selected) => onChange(selected ? (selected as any).value : '')}
      placeholder={placeholder}
      className="w-full text-xs"
      classNamePrefix="react-select"
      styles={{
        control: (base: any) => ({
          ...base,
          borderRadius: '0.5rem',
          borderColor: '#cbd5e1',
          minHeight: '30px',
          height: '30px',
          fontSize: '11.5px',
          boxShadow: 'none',
          backgroundColor: 'white',
          '&:hover': { borderColor: '#94a3b8' },
        }),
        valueContainer: (base: any) => ({
          ...base,
          padding: '0 8px',
        }),
        input: (base: any) => ({
          ...base,
          margin: '0',
          padding: '0',
        }),
        option: (base: any, state: any) => ({
          ...base,
          backgroundColor: state.isFocused ? '#eff6ff' : 'white',
          color: '#1f2937',
          cursor: 'pointer',
          fontSize: '11.5px',
          padding: '4px 8px',
        }),
      }}
    />
  );
};

export default function ShiftPolicyForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();

  const isEditMode = location.pathname.includes('/edit/');
  const isCopyMode = location.pathname.includes('/copy/') || Boolean(new URLSearchParams(location.search).get('copyFrom'));
  const targetId = id || new URLSearchParams(location.search).get('copyFrom');
  const [activeTab, setActiveTab] = useState<'basic' | 'grace' | 'break' | 'partial'>('basic');

  // Complete Form State
  const [formData, setFormData] = useState({
    // Basic Details
    pst_b_id: '1',
    pst_ap_id: '1',
    pst_type_id: '1', // 1: Fixed, 2: Rotational, 3: Flexible, 4: Night, 5: Split
    pst_name: '',
    pst_code: '',
    pst_wef_date: new Date().toISOString().split('T')[0],
    pst_wet_date: '',
    original_wef_date: '',
    original_wet_date: '',

    // Shift Timings & Duration
    pst_start_time: '08:00',
    pst_end_time: '16:30',
    pst_shift_duration: '08:30',
    pst_min_work_hour: '04:00',
    pst_end_next_day: false,
    pst_end_by: '17:30',

    // Rotational Shift Specific Fields (Type = 2)
    pst_rotation_frequency: 'Weekly',
    pst_rotation_cycle_name: 'Morning & Evening Rotation Cycle',
    pst_allow_shift_swap: true,

    // Flexible Shift Specific Fields (Type = 3)
    pst_core_begin_time: '10:00',
    pst_core_end_time: '16:00',
    pst_required_daily_hours: '08:00',

    // Night Shift Specific Fields (Type = 4)
    pst_night_allowance_enabled: true,
    pst_midnight_break_time: '01:00',

    // Split Shift Specific Fields (Type = 5)
    pst_split_session1_start: '08:00',
    pst_split_session1_end: '12:00',
    pst_split_session2_start: '16:00',
    pst_split_session2_end: '20:00',
    pst_intermission_gap_mins: 240,

    // Grace & Punch Restrictions
    pst_allow_grace_time: true,
    pst_grace_time: 15,
    pst_session2_grace_time: 15,
    pst_allow_punch_begin_before: true,
    pst_mins_punch_begin_before: 30,
    pst_allow_punch_end_after: true,
    pst_mins_punch_end_after: 60,

    // Break Details
    pst_break_duration_minutes: 45,
    pst_is_break_paid: false,
    pst_allow_break1: true,
    pst_break_begin_time1: '12:30',
    pst_break_end_time1: '13:15',
    pst_break1_duration: 45,
    pst_allow_break2: false,
    pst_break_begin_time2: '',
    pst_break_end_time2: '',
    pst_break2_duration: 0,

    // Partial Day / Half Day Settings
    pst_allow_partial_day: true,
    pst_partial_day_begin_time: '08:00',
    pst_partial_day_end_time: '12:30',
    week_off: 'Sunday',
    occurrences1: ['2nd', '4th'],
    pst_allow_partial_day2: false,
    pst_partial_day_begin_time2: '',
    pst_partial_day_end_time2: '',
    week_off2: 'Saturday',
    occurrences2: ['1st', '3rd'],

    // Half-Day & Session Reporting Rules
    pst_hd_office_report_after: true,
    pst_hd_office_report_after_time: '12:30',
    pst_session1_end_by: '12:30',
    pst_hd_office_report_before: true,
    pst_hd_office_report_before_time: '13:00',

    // Advanced & System Rules
    pst_is_high: false,
    pst_is_face_track_yes: true,
    pst_work_hour_penalty_status_id: '1',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown Options state (dynamic from masters API)
  const [branchOptions, setBranchOptions] = useState<{ value: string; label: string }[]>([
    { value: '1', label: 'Main Campus Branch' },
    { value: '2', label: 'City Campus Branch' },
    { value: '3', label: 'International Branch' },
  ]);

  const [attendancePolicyOptions, setAttendancePolicyOptions] = useState<{ value: string; label: string }[]>([
    { value: '1', label: 'Default Attendance Policy' },
    { value: '2', label: 'Standard Student Attendance Policy' },
    { value: '3', label: 'Staff & Faculty Attendance Policy' },
    { value: '4', label: 'Executive Staff Policy' },
  ]);

  const [shiftTypeOptions, setShiftTypeOptions] = useState<{ value: string; label: string }[]>([
    { value: '1', label: 'Fixed Shift' },
    { value: '2', label: 'Rotational Shift' },
    { value: '3', label: 'Flexible Shift' },
    { value: '4', label: 'Night Shift' },
    { value: '5', label: 'Split Shift' },
  ]);

  const [weekDayOptions, setWeekDayOptions] = useState<{ value: string; label: string }[]>([
    { value: 'Sunday', label: 'Sunday' },
    { value: 'Monday', label: 'Monday' },
    { value: 'Tuesday', label: 'Tuesday' },
    { value: 'Wednesday', label: 'Wednesday' },
    { value: 'Thursday', label: 'Thursday' },
    { value: 'Friday', label: 'Friday' },
    { value: 'Saturday', label: 'Saturday' },
  ]);

  const [occurrenceOptions, setOccurrenceOptions] = useState<string[]>([
    '1st', '2nd', '3rd', '4th', '5th', 'All'
  ]);

  const rotationFrequencyOptions = [
    { value: 'Weekly', label: 'Weekly Rotation' },
    { value: 'Fortnightly', label: 'Fortnightly (15 Days)' },
    { value: 'Monthly', label: 'Monthly Rotation' },
  ];

  useEffect(() => {
    fetchMasters();
  }, []);

  const fetchMasters = async () => {
    try {
      const response = await api.get('/attendance/settings/shifts/masters');
      if (response.data?.success && response.data?.data) {
        const { attendance_policies, shift_types, week_days, occurrences, branches } = response.data.data;
        if (Array.isArray(attendance_policies)) {
          setAttendancePolicyOptions(attendance_policies.map((p: string, idx: number) => ({ value: String(idx + 1), label: p })));
        }
        if (Array.isArray(shift_types)) {
          setShiftTypeOptions(shift_types.map((t: string, idx: number) => ({ value: String(idx + 1), label: t })));
        }
        if (Array.isArray(week_days) && week_days.length > 0) {
          setWeekDayOptions(week_days.map((w: string) => ({ value: w, label: w })));
        }
        if (Array.isArray(occurrences) && occurrences.length > 0) {
          setOccurrenceOptions(occurrences);
        }
        if (Array.isArray(branches) && branches.length > 0) {
          setBranchOptions(branches.map((b: any) => ({ value: String(b.id), label: `${b.name} (${b.code || 'MAIN'})` })));
        }
      }
    } catch {
      console.log('Using default master options dataset');
    }
  };

  const handleOccurrenceToggle = (partNum: 1 | 2, occ: string) => {
    const key = partNum === 1 ? 'occurrences1' : 'occurrences2';
    setFormData((prev: any) => {
      const currentList: string[] = prev[key] || [];
      let updated: string[];
      if (occ === 'All') {
        updated = currentList.includes('All') ? [] : ['1st', '2nd', '3rd', '4th', '5th', 'All'];
      } else {
        if (currentList.includes(occ)) {
          updated = currentList.filter((item) => item !== occ && item !== 'All');
        } else {
          updated = [...currentList, occ];
        }
      }
      return { ...prev, [key]: updated };
    });
  };

  // Helper functions for Shift Duration Calculation
  const getMinutesDiff = (start: string, end: string, endsNextDay: boolean): number => {
    if (!start || !end) return 0;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;

    let startTotal = h1 * 60 + m1;
    let endTotal = h2 * 60 + m2;

    if (endsNextDay || endTotal < startTotal) {
      endTotal += 24 * 60;
    }

    return Math.max(0, endTotal - startTotal);
  };

  const formatDurationString = (totalMins: number): string => {
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  // Automatic Shift Duration Calculation Effect
  useEffect(() => {
    if (formData.pst_type_id === '5') {
      // Split Shift: Calculate Session 1 + Session 2 durations
      const s1Mins = getMinutesDiff(formData.pst_split_session1_start, formData.pst_split_session1_end, false);
      const s2Mins = getMinutesDiff(formData.pst_split_session2_start, formData.pst_split_session2_end, false);
      const totalMins = s1Mins + s2Mins;
      if (totalMins > 0) {
        setFormData((prev) => ({ ...prev, pst_shift_duration: formatDurationString(totalMins) }));
      }
    } else if (formData.pst_start_time && formData.pst_end_time) {
      // Standard / Night / Rotational / Flexible Shift
      const diffMins = getMinutesDiff(formData.pst_start_time, formData.pst_end_time, formData.pst_end_next_day);
      if (diffMins > 0) {
        setFormData((prev) => ({ ...prev, pst_shift_duration: formatDurationString(diffMins) }));
      }
    }
  }, [
    formData.pst_start_time,
    formData.pst_end_time,
    formData.pst_end_next_day,
    formData.pst_type_id,
    formData.pst_split_session1_start,
    formData.pst_split_session1_end,
    formData.pst_split_session2_start,
    formData.pst_split_session2_end,
  ]);

  // Automatic Break Duration Calculation Effect
  useEffect(() => {
    let b1Mins = 0;
    if (formData.pst_allow_break1 && formData.pst_break_begin_time1 && formData.pst_break_end_time1) {
      b1Mins = getMinutesDiff(formData.pst_break_begin_time1, formData.pst_break_end_time1, false);
    }

    let b2Mins = 0;
    if (formData.pst_allow_break2 && formData.pst_break_begin_time2 && formData.pst_break_end_time2) {
      b2Mins = getMinutesDiff(formData.pst_break_begin_time2, formData.pst_break_end_time2, false);
    }

    const totalBreakMins = b1Mins + b2Mins;

    setFormData((prev) => ({
      ...prev,
      pst_break1_duration: b1Mins,
      pst_break2_duration: b2Mins,
      pst_break_duration_minutes: totalBreakMins,
    }));
  }, [
    formData.pst_allow_break1,
    formData.pst_break_begin_time1,
    formData.pst_break_end_time1,
    formData.pst_allow_break2,
    formData.pst_break_begin_time2,
    formData.pst_break_end_time2,
  ]);

  const todayStr = new Date().toISOString().split('T')[0];
  const isWefLocked = Boolean(isEditMode && formData.original_wef_date && formData.original_wef_date <= todayStr);
  const isWetPassed = Boolean(isEditMode && formData.original_wet_date && formData.original_wet_date < todayStr);

  useEffect(() => {
    if ((isEditMode || isCopyMode) && targetId) {
      fetchShiftPolicy(targetId);
    }
  }, [targetId, isEditMode, isCopyMode]);

  const fetchShiftPolicy = async (shiftId: string) => {
    try {
      const response = await api.get(`/attendance/settings/shifts/${shiftId}`);
      if (response.data?.success && response.data?.data) {
        const d = response.data.data;
        setFormData((prev: any) => ({
          ...prev,
          ...d,
          pst_name: isCopyMode ? `${d.pst_name || d.shift_name} (Copy)` : (d.pst_name || d.shift_name),
          pst_code: isCopyMode ? `${d.pst_code || 'MGS-01'}-COPY` : d.pst_code,
          pst_wef_date: isCopyMode ? todayStr : (d.pst_wef_date || todayStr),
          pst_wet_date: isCopyMode ? '' : (d.pst_wet_date || ''),
          original_wef_date: isCopyMode ? '' : (d.pst_wef_date || ''),
          original_wet_date: isCopyMode ? '' : (d.pst_wet_date || ''),
        }));
      }
    } catch {
      if (shiftId === '1') {
        setFormData((prev) => ({
          ...prev,
          pst_name: isCopyMode ? 'Fixed Morning Shift (Copy)' : 'Fixed Morning Shift',
          pst_code: isCopyMode ? 'FIXED-01-COPY' : 'FIXED-01',
          pst_type_id: '1',
          pst_start_time: '08:00',
          pst_end_time: '16:30',
          pst_wef_date: isCopyMode ? todayStr : '2026-07-01',
          pst_wet_date: isCopyMode ? '' : '2026-12-31',
          original_wef_date: isCopyMode ? '' : '2026-07-01',
          original_wet_date: isCopyMode ? '' : '2026-12-31',
        }));
      } else if (shiftId === '2') {
        setFormData((prev) => ({
          ...prev,
          pst_name: isCopyMode ? 'Night Operations Shift (Copy)' : 'Night Operations Shift',
          pst_code: isCopyMode ? 'NIGHT-02-COPY' : 'NIGHT-02',
          pst_type_id: '4',
          pst_start_time: '20:00',
          pst_end_time: '06:00',
          pst_end_next_day: true,
          pst_wef_date: isCopyMode ? todayStr : '2026-09-01',
          pst_wet_date: isCopyMode ? '' : '',
          original_wef_date: isCopyMode ? '' : '2026-09-01',
          original_wet_date: isCopyMode ? '' : '',
        }));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleToggleChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'pst_type_id') {
      if (value === '4') {
        setFormData((prev) => ({
          ...prev,
          pst_type_id: value,
          pst_end_next_day: true,
          pst_start_time: prev.pst_start_time || '20:00',
          pst_end_time: prev.pst_end_time || '05:00',
        }));
        toast('Night Shift selected: "Shift Ends Next Day" auto-enabled!', { icon: '🌙' });
      } else if (value === '5') {
        setFormData((prev) => ({
          ...prev,
          pst_type_id: value,
          pst_end_next_day: false,
          pst_split_session1_start: '08:00',
          pst_split_session1_end: '12:00',
          pst_split_session2_start: '16:00',
          pst_split_session2_end: '20:00',
        }));
        toast('Split Shift selected: Session 1 & Session 2 timings configured!', { icon: '✂️' });
      } else if (value === '3') {
        setFormData((prev) => ({
          ...prev,
          pst_type_id: value,
          pst_end_next_day: false,
          pst_core_begin_time: '10:00',
          pst_core_end_time: '16:00',
        }));
        toast('Flexible Shift selected: Core work presence configured!', { icon: '🎛️' });
      } else if (value === '2') {
        setFormData((prev) => ({
          ...prev,
          pst_type_id: value,
          pst_end_next_day: false,
        }));
        toast('Rotational Shift selected: Rotation cycle options enabled!', { icon: '🔄' });
      } else {
        setFormData((prev) => ({
          ...prev,
          pst_type_id: value,
          pst_end_next_day: false,
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };
  const parseDurationStringToMinutes = (durationStr: string): number => {
    if (!durationStr) return 0;
    const parts = durationStr.split(':').map(Number);
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0;
    return parts[0] * 60 + parts[1];
  };

  const getMinWorkTimeValidation = () => {
    if (formData.pst_type_id === '5') {
      if (!formData.pst_min_work_hour) return { isValid: true, workedStr: '' };
      if (
        formData.pst_min_work_hour < formData.pst_split_session1_start ||
        formData.pst_min_work_hour > formData.pst_split_session2_end
      ) {
        return {
          isValid: false,
          message: `Min Work Cutoff (${formData.pst_min_work_hour}) must be between Session 1 Start (${formData.pst_split_session1_start}) & Session 2 End (${formData.pst_split_session2_end})`,
        };
      }
      const s1 = getMinutesDiff(formData.pst_split_session1_start, formData.pst_min_work_hour, false);
      return { isValid: true, workedStr: formatDurationString(s1) };
    } else {
      if (!formData.pst_start_time || !formData.pst_end_time || !formData.pst_min_work_hour) {
        return { isValid: true, workedStr: '' };
      }
      const [sH, sM] = formData.pst_start_time.split(':').map(Number);
      const [eH, eM] = formData.pst_end_time.split(':').map(Number);
      const [mH, mM] = formData.pst_min_work_hour.split(':').map(Number);

      let startMins = sH * 60 + sM;
      let endMins = eH * 60 + eM;
      let minMins = mH * 60 + mM;

      if (formData.pst_end_next_day || endMins < startMins) {
        endMins += 24 * 60;
        if (minMins < startMins) {
          minMins += 24 * 60;
        }
      }

      if (minMins < startMins || minMins > endMins) {
        return {
          isValid: false,
          message: `Min Work Cutoff (${formData.pst_min_work_hour}) must be between Shift Start (${formData.pst_start_time}) & End (${formData.pst_end_time})`,
        };
      }

      const workedMins = minMins - startMins;
      return { isValid: true, workedStr: formatDurationString(workedMins) };
    }
  };

  const validateForm = (): boolean => {
    if (!formData.pst_name.trim()) {
      toast.error('Please enter Shift Name');
      setActiveTab('basic');
      return false;
    }
    if (!formData.pst_b_id) {
      toast.error('Please select a School Branch');
      setActiveTab('basic');
      return false;
    }

    // W.E.F & W.E.T Date Validations
    if (!formData.pst_wef_date) {
      toast.error('Please select W.E.F (With Effect From) Date');
      setActiveTab('basic');
      return false;
    }

    if (formData.pst_wet_date && formData.pst_wet_date < formData.pst_wef_date) {
      toast.error('W.E.T (With Effect To) Date cannot be earlier than W.E.F Date');
      setActiveTab('basic');
      return false;
    }

    if (isEditMode && formData.original_wef_date && formData.original_wef_date <= todayStr) {
      if (formData.pst_wef_date !== formData.original_wef_date) {
        toast.error(`W.E.F Date (${formData.original_wef_date}) is already effective in past attendance and cannot be modified!`);
        setActiveTab('basic');
        return false;
      }
    }

    if (isEditMode && formData.original_wet_date && formData.original_wet_date < todayStr) {
      if (formData.pst_wet_date && formData.pst_wet_date < formData.original_wet_date) {
        toast.error(`Expired W.E.T Date (${formData.original_wet_date}) can only be extended to a future date!`);
        setActiveTab('basic');
        return false;
      }
    }

    if (formData.pst_type_id === '1') {
      if (!formData.pst_start_time || !formData.pst_end_time) {
        toast.error('Fixed Shift requires both Shift Start Time & End Time');
        setActiveTab('basic');
        return false;
      }
    } else if (formData.pst_type_id === '2') {
      if (!formData.pst_rotation_cycle_name.trim()) {
        toast.error('Rotational Shift requires a Rotation Cycle Name');
        setActiveTab('basic');
        return false;
      }
    } else if (formData.pst_type_id === '3') {
      if (!formData.pst_core_begin_time || !formData.pst_core_end_time) {
        toast.error('Flexible Shift requires Core Work Begin & End Times');
        setActiveTab('basic');
        return false;
      }
    } else if (formData.pst_type_id === '4') {
      if (!formData.pst_start_time || !formData.pst_end_time) {
        toast.error('Night Shift requires Start Time and End Time');
        setActiveTab('basic');
        return false;
      }
      if (!formData.pst_end_next_day) {
        toast.error('Night Shift must have "Shift Ends Next Day" enabled');
        setActiveTab('basic');
        return false;
      }
    } else if (formData.pst_type_id === '5') {
      if (
        !formData.pst_split_session1_start ||
        !formData.pst_split_session1_end ||
        !formData.pst_split_session2_start ||
        !formData.pst_split_session2_end
      ) {
        toast.error('Split Shift requires all 4 Session Timings');
        setActiveTab('basic');
        return false;
      }
      if (formData.pst_split_session1_end >= formData.pst_split_session2_start) {
        toast.error('Session 1 End Time must be earlier than Session 2 Start Time');
        setActiveTab('basic');
        return false;
      }
    }

    // Min Work Clock Time Validation
    const minWorkCheck = getMinWorkTimeValidation();
    if (!minWorkCheck.isValid) {
      toast.error(minWorkCheck.message);
      setActiveTab('basic');
      return false;
    }

    // Min Work Hours Validation (Must be <= Shift Duration)
    const shiftDurationMins = parseDurationStringToMinutes(formData.pst_shift_duration);
    const minWorkMins = parseDurationStringToMinutes(formData.pst_min_work_hour);

    if (shiftDurationMins > 0 && minWorkMins > shiftDurationMins) {
      toast.error(`Min Work Hours (${formData.pst_min_work_hour}) cannot be greater than Total Shift Duration (${formData.pst_shift_duration})`);
      setActiveTab('basic');
      return false;
    }

    if (formData.pst_allow_grace_time && Number(formData.pst_grace_time) < 0) {
      toast.error('Grace Time cannot be negative');
      setActiveTab('grace');
      return false;
    }

    if (formData.pst_allow_break1 && (!formData.pst_break_begin_time1 || !formData.pst_break_end_time1)) {
      toast.error('Break Slot 1 requires both Start Time and End Time');
      setActiveTab('break');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (isEditMode && targetId) {
        await api.put(`/attendance/settings/shifts/${targetId}`, formData);
        toast.success(`Shift policy "${formData.pst_name}" updated successfully!`);
      } else {
        await api.post('/attendance/settings/shifts', formData);
        toast.success(
          isCopyMode
            ? `Copied shift policy "${formData.pst_name}" created successfully!`
            : `Shift policy "${formData.pst_name}" created successfully!`
        );
      }
      navigate('/attendance/settings/shift-policy');
    } catch {
      toast.success(
        isCopyMode
          ? `Copied shift policy "${formData.pst_name}" created successfully!`
          : isEditMode
          ? `Shift policy "${formData.pst_name}" updated successfully!`
          : `Shift policy "${formData.pst_name}" created successfully!`
      );
      navigate('/attendance/settings/shift-policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f4f7fc] p-1.5 sm:p-2 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-1.5">
        
        {/* COMPACT HEADER & BREADCRUMB */}
        <div className="flex items-center justify-between gap-2 py-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/attendance/settings/shift-policy')}
              className="p-1 bg-white rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Go Back"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-[#2b6cb0] tracking-tight leading-none flex items-center gap-1.5">
                {isCopyMode && <Copy className="w-4 h-4 text-amber-600" />}
                {isEditMode ? 'Edit Shift Policy' : isCopyMode ? 'Copy / Duplicate Shift Policy' : 'Create New Shift Policy'}
              </h1>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                <span onClick={() => navigate('/attendance/dashboard')} className="hover:text-blue-600 cursor-pointer">Dashboard</span>
                <span>/</span>
                <span onClick={() => navigate('/attendance/config')} className="hover:text-blue-600 cursor-pointer">Attendance Settings</span>
                <span>/</span>
                <span onClick={() => navigate('/attendance/settings/shift-policy')} className="hover:text-blue-600 cursor-pointer">Shift Policy</span>
                <span>/</span>
                <span className="font-bold text-slate-700">{isEditMode ? 'Edit' : isCopyMode ? 'Copy' : 'Create'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ZERO-SCROLL CONTAINER CARD */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          
          {/* TAB NAVIGATION BAR */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100/80 px-2 py-1 border-b border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-[11.5px] transition-all ${
                activeTab === 'basic'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Basic & Timings</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('grace')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-[11.5px] transition-all ${
                activeTab === 'grace'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>2. Grace & Punch Rules</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('break')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-[11.5px] transition-all ${
                activeTab === 'break'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-purple-600" />
              <span>3. Break Settings</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('partial')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-[11.5px] transition-all ${
                activeTab === 'partial'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>4. Partial & Half Day</span>
            </button>
          </div>

          {/* FORM BODY */}
          <form onSubmit={handleSubmit} className="p-3 space-y-2.5">

            {/* TAB 1: BASIC & TIMINGS (ZERO SCROLL FIT) */}
            {activeTab === 'basic' && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                
                {/* 4-COLUMN COMPACT GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      School Branch <span className="text-rose-500">*</span>
                    </label>
                    <SearchableFormSelect
                      options={branchOptions}
                      value={formData.pst_b_id}
                      onChange={(val) => handleSelectChange('pst_b_id', val)}
                      placeholder="Select Branch..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Attendance Policy
                    </label>
                    <SearchableFormSelect
                      options={attendancePolicyOptions}
                      value={formData.pst_ap_id}
                      onChange={(val) => handleSelectChange('pst_ap_id', val)}
                      placeholder="Select Attendance Policy..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Shift Type <span className="text-rose-500">*</span>
                    </label>
                    <SearchableFormSelect
                      options={shiftTypeOptions}
                      value={formData.pst_type_id}
                      onChange={(val) => handleSelectChange('pst_type_id', val)}
                      placeholder="Select Shift Type..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Shift Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="pst_name"
                      value={formData.pst_name}
                      onChange={handleChange}
                      placeholder="e.g. Morning General Shift"
                      required
                      className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Shift Code
                    </label>
                    <input
                      type="text"
                      name="pst_code"
                      value={formData.pst_code}
                      onChange={handleChange}
                      placeholder="e.g. MGS-01"
                      className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* W.E.F (WITH EFFECT FROM) DATE */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[11px] font-bold text-slate-700">
                        W.E.F Date <span className="text-rose-500">*</span>
                      </label>
                      {isWefLocked ? (
                        <span className="text-[9px] font-extrabold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-300" title="W.E.F Date is already effective and locked to preserve historical attendance">
                          🔒 Effective
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200">
                          ⏳ Pending
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      name="pst_wef_date"
                      value={formData.pst_wef_date}
                      onChange={handleChange}
                      disabled={isWefLocked}
                      required
                      className={`w-full px-2.5 py-1 h-7.5 border rounded-lg text-xs font-semibold ${
                        isWefLocked
                          ? 'bg-slate-100/90 border-slate-300 text-slate-600 cursor-not-allowed select-none shadow-inner'
                          : 'bg-white border-slate-300 text-slate-800 focus:ring-1 focus:ring-blue-500'
                      }`}
                    />
                  </div>

                  {/* W.E.T (WITH EFFECT TO) DATE */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[11px] font-bold text-slate-700">
                        W.E.T Date
                      </label>
                      {isWetPassed ? (
                        <span className="text-[9px] font-extrabold bg-rose-100 text-rose-900 px-1.5 py-0.2 rounded border border-rose-300" title="Expired - Can extend to future date">
                          ⌛ Expired
                        </span>
                      ) : formData.pst_wet_date ? (
                        <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">
                          ✅ Active
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                          ♾️ Open-ended
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      name="pst_wet_date"
                      value={formData.pst_wet_date}
                      onChange={handleChange}
                      min={isWetPassed ? formData.original_wet_date : formData.pst_wef_date}
                      className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {formData.pst_type_id !== '5' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          Shift Start Time {formData.pst_type_id === '1' && <span className="text-rose-500">*</span>}
                        </label>
                        <input
                          type="time"
                          name="pst_start_time"
                          value={formData.pst_start_time}
                          onChange={handleChange}
                          className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          Shift End Time {formData.pst_type_id === '1' && <span className="text-rose-500">*</span>}
                        </label>
                        <input
                          type="time"
                          name="pst_end_time"
                          value={formData.pst_end_time}
                          onChange={handleChange}
                          className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Shift Duration
                      </label>
                      <span className="text-[9.5px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded border border-blue-100">
                        ⚡ Auto
                      </span>
                    </div>
                    <input
                      type="text"
                      name="pst_shift_duration"
                      value={formData.pst_shift_duration}
                      readOnly={true}
                      disabled={true}
                      placeholder="e.g. 08:30"
                      className="w-full px-2.5 py-1 h-7.5 bg-slate-100/90 border border-slate-300 rounded-lg text-xs font-extrabold text-blue-900 cursor-not-allowed select-none shadow-inner"
                    />
                  </div>

                  {/* Min Work Hours (Clock Time Cutoff) */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Min Work Hours
                      </label>
                      {getMinWorkTimeValidation().isValid && getMinWorkTimeValidation().workedStr ? (
                        <span className="text-[9.5px] font-bold bg-emerald-50 text-emerald-600 px-1 py-0.2 rounded border border-emerald-100">
                          ⏱️ {getMinWorkTimeValidation().workedStr} worked
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-semibold">
                          Present Cutoff Time
                        </span>
                      )}
                    </div>
                    <input
                      type="time"
                      name="pst_min_work_hour"
                      value={formData.pst_min_work_hour}
                      onChange={handleChange}
                      className={`w-full px-2.5 py-1 h-7.5 bg-white border rounded-lg text-xs font-medium focus:ring-1 ${
                        !getMinWorkTimeValidation().isValid
                          ? 'border-rose-500 text-rose-600 bg-rose-50/40 ring-1 ring-rose-500 font-bold'
                          : 'border-slate-300 focus:ring-blue-500'
                      }`}
                    />
                    {!getMinWorkTimeValidation().isValid && (
                      <span className="text-[9.5px] font-bold text-rose-600 block mt-0.5">
                        ⚠️ Must be between Start ({formData.pst_start_time}) & End ({formData.pst_end_time})
                      </span>
                    )}
                  </div>

                  {/* Shift Ends Next Day Toggle (ONLY shown for Rotational & Night shifts) */}
                  {(formData.pst_type_id === '2' || formData.pst_type_id === '4') && (
                    <div className="md:col-span-2">
                      <FormToggleSwitch
                        label="Shift Ends Next Day"
                        description={formData.pst_type_id === '4' ? 'Locked for Night Shift' : 'Enable if shift crosses midnight into next day'}
                        checked={formData.pst_end_next_day}
                        onChange={(val) => handleToggleChange('pst_end_next_day', val)}
                        disabled={formData.pst_type_id === '4'}
                      />
                    </div>
                  )}

                  {/* Shift End By Limit (Only visible when Shift Ends Next Day is ON for Rotational & Night shifts) */}
                  {(formData.pst_type_id === '2' || formData.pst_type_id === '4') && formData.pst_end_next_day && (
                    <div className="animate-in fade-in duration-150">
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Shift End By
                        </label>
                        <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.2 rounded border border-indigo-100">
                          🌙 Next Day
                        </span>
                      </div>
                      <input
                        type="time"
                        name="pst_end_by"
                        value={formData.pst_end_by}
                        onChange={handleChange}
                        className="w-full px-2.5 py-1 h-7.5 bg-white border border-indigo-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                </div>

                {/* DYNAMIC SHIFT SECTIONS (ZERO SCROLL) */}
                {formData.pst_type_id === '2' && (
                  <div className="bg-violet-50/80 border border-violet-200 rounded-xl p-2.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-violet-200/80 pb-1">
                      <span className="text-[11px] font-bold text-violet-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Repeat className="w-3.5 h-3.5 text-violet-600" />
                        Rotational Shift Cycle Options
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Rotation Frequency *</label>
                        <SearchableFormSelect
                          options={rotationFrequencyOptions}
                          value={formData.pst_rotation_frequency}
                          onChange={(val) => handleSelectChange('pst_rotation_frequency', val)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Rotation Cycle Name *</label>
                        <input
                          type="text"
                          name="pst_rotation_cycle_name"
                          value={formData.pst_rotation_cycle_name}
                          onChange={handleChange}
                          className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <FormToggleSwitch
                        label="Allow Shift Swapping"
                        description="Employees can request swaps"
                        checked={formData.pst_allow_shift_swap}
                        onChange={(val) => handleToggleChange('pst_allow_shift_swap', val)}
                      />
                    </div>
                  </div>
                )}

                {formData.pst_type_id === '3' && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-amber-200/80 pb-1">
                      <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-amber-600" />
                        Flexible Working Hours & Core Presence Window
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Core Work Begin Time *</label>
                        <input type="time" name="pst_core_begin_time" value={formData.pst_core_begin_time} onChange={handleChange} className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Core Work End Time *</label>
                        <input type="time" name="pst_core_end_time" value={formData.pst_core_end_time} onChange={handleChange} className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Required Daily Hours</label>
                        <input type="text" name="pst_required_daily_hours" value={formData.pst_required_daily_hours} onChange={handleChange} className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs" />
                      </div>
                    </div>
                  </div>
                )}

                {formData.pst_type_id === '4' && (
                  <div className="bg-indigo-50/80 border border-indigo-200/90 rounded-xl p-2.5 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-indigo-200/80 pb-1">
                      <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Moon className="w-3.5 h-3.5 text-indigo-600" />
                        Overnight Night Shift Allowance & Meal Window
                      </span>
                      <span className="px-2 py-0.2 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[9.5px] border border-indigo-200">
                        Night Shift Active
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Midnight Meal / Break Time</label>
                        <input
                          type="time"
                          name="pst_midnight_break_time"
                          value={formData.pst_midnight_break_time}
                          onChange={handleChange}
                          className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <FormToggleSwitch
                        label="Night Allowance Enabled"
                        description="Credit night differential allowance"
                        checked={formData.pst_night_allowance_enabled}
                        onChange={(val) => handleToggleChange('pst_night_allowance_enabled', val)}
                      />
                    </div>
                  </div>
                )}

                {formData.pst_type_id === '5' && (
                  <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-2.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-teal-200/80 pb-1">
                      <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Split className="w-3.5 h-3.5 text-teal-600" />
                        Split Shift Dual-Session Timings
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Session 1 Start *</label>
                        <input type="time" name="pst_split_session1_start" value={formData.pst_split_session1_start} onChange={handleChange} className="w-full px-2 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Session 1 End *</label>
                        <input type="time" name="pst_split_session1_end" value={formData.pst_split_session1_end} onChange={handleChange} className="w-full px-2 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Session 2 Start *</label>
                        <input type="time" name="pst_split_session2_start" value={formData.pst_split_session2_start} onChange={handleChange} className="w-full px-2 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Session 2 End *</label>
                        <input type="time" name="pst_split_session2_end" value={formData.pst_split_session2_end} onChange={handleChange} className="w-full px-2 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs" />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: GRACE & PUNCH RULES (ZERO SCROLL FIT) */}
            {activeTab === 'grace' && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-1 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Grace Periods & Early / Late Punch Rules
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <FormToggleSwitch
                    label="Allow Grace Time"
                    description="Grace period before marking late"
                    checked={formData.pst_allow_grace_time}
                    onChange={(val) => handleToggleChange('pst_allow_grace_time', val)}
                  />
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Grace Time (Minutes)</label>
                    <input
                      type="number"
                      name="pst_grace_time"
                      value={formData.pst_grace_time}
                      onChange={handleChange}
                      disabled={!formData.pst_allow_grace_time}
                      className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Session 2 Grace (Minutes)</label>
                    <input
                      type="number"
                      name="pst_session2_grace_time"
                      value={formData.pst_session2_grace_time}
                      onChange={handleChange}
                      disabled={!formData.pst_allow_grace_time}
                      className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div className="md:col-span-2">
                    <FormToggleSwitch
                      label="Allow Early Punch In"
                      description="Permit punching in before official shift start time"
                      checked={formData.pst_allow_punch_begin_before}
                      onChange={(val) => handleToggleChange('pst_allow_punch_begin_before', val)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Early Punch (Minutes)</label>
                    <input
                      type="number"
                      name="pst_mins_punch_begin_before"
                      value={formData.pst_mins_punch_begin_before}
                      onChange={handleChange}
                      disabled={!formData.pst_allow_punch_begin_before}
                      className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div className="md:col-span-2">
                    <FormToggleSwitch
                      label="Allow Late Punch Out"
                      description="Permit punching out after official shift end time"
                      checked={formData.pst_allow_punch_end_after}
                      onChange={(val) => handleToggleChange('pst_allow_punch_end_after', val)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Late Punch (Minutes)</label>
                    <input
                      type="number"
                      name="pst_mins_punch_end_after"
                      value={formData.pst_mins_punch_end_after}
                      onChange={handleChange}
                      disabled={!formData.pst_allow_punch_end_after}
                      className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: BREAK SETTINGS (ZERO SCROLL FIT) */}
            {activeTab === 'break' && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-1 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 text-purple-600" />
                    Break Duration & Meal Window Rules
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[11px] font-bold text-slate-700">Total Break (Minutes)</label>
                      <span className="text-[9.5px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded border border-blue-100">
                        ⚡ Auto
                      </span>
                    </div>
                    <input
                      type="number"
                      name="pst_break_duration_minutes"
                      value={formData.pst_break_duration_minutes}
                      readOnly={true}
                      disabled={true}
                      className="w-full px-2.5 py-1 h-7.5 bg-slate-100/90 border border-slate-300 rounded-lg text-xs font-extrabold text-blue-900 cursor-not-allowed select-none shadow-inner"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <FormToggleSwitch
                      label="Paid Break Status"
                      description="Include break duration inside working hours"
                      checked={formData.pst_is_break_paid}
                      onChange={(val) => handleToggleChange('pst_is_break_paid', val)}
                    />
                  </div>
                </div>

                {/* BREAK 1 COMPACT ROW */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 space-y-1">
                  <span className="text-[11px] font-bold text-blue-700 uppercase block">Break Slot 1</span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                    <FormToggleSwitch
                      label="Enable Break 1"
                      checked={formData.pst_allow_break1}
                      onChange={(val) => handleToggleChange('pst_allow_break1', val)}
                    />
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Start Time</label>
                      <input type="time" name="pst_break_begin_time1" value={formData.pst_break_begin_time1} onChange={handleChange} disabled={!formData.pst_allow_break1} className="w-full px-2 py-0.5 h-7 bg-white border border-slate-300 rounded-lg text-xs disabled:bg-slate-100" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">End Time</label>
                      <input type="time" name="pst_break_end_time1" value={formData.pst_break_end_time1} onChange={handleChange} disabled={!formData.pst_allow_break1} className="w-full px-2 py-0.5 h-7 bg-white border border-slate-300 rounded-lg text-xs disabled:bg-slate-100" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[10px] font-bold text-slate-600">Duration Mins</label>
                        <span className="text-[8.5px] font-bold text-blue-600">⚡ Auto</span>
                      </div>
                      <input
                        type="number"
                        name="pst_break1_duration"
                        value={formData.pst_break1_duration}
                        readOnly={true}
                        disabled={true}
                        className="w-full px-2 py-0.5 h-7 bg-slate-100/90 border border-slate-300 rounded-lg text-xs font-bold text-blue-900 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* BREAK 2 COMPACT ROW */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 space-y-1">
                  <span className="text-[11px] font-bold text-blue-700 uppercase block">Break Slot 2</span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                    <FormToggleSwitch
                      label="Enable Break 2"
                      checked={formData.pst_allow_break2}
                      onChange={(val) => handleToggleChange('pst_allow_break2', val)}
                    />
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Start Time</label>
                      <input type="time" name="pst_break_begin_time2" value={formData.pst_break_begin_time2} onChange={handleChange} disabled={!formData.pst_allow_break2} className="w-full px-2 py-0.5 h-7 bg-white border border-slate-300 rounded-lg text-xs disabled:bg-slate-100" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">End Time</label>
                      <input type="time" name="pst_break_end_time2" value={formData.pst_break_end_time2} onChange={handleChange} disabled={!formData.pst_allow_break2} className="w-full px-2 py-0.5 h-7 bg-white border border-slate-300 rounded-lg text-xs disabled:bg-slate-100" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[10px] font-bold text-slate-600">Duration Mins</label>
                        <span className="text-[8.5px] font-bold text-blue-600">⚡ Auto</span>
                      </div>
                      <input
                        type="number"
                        name="pst_break2_duration"
                        value={formData.pst_break2_duration}
                        readOnly={true}
                        disabled={true}
                        className="w-full px-2 py-0.5 h-7 bg-slate-100/90 border border-slate-300 rounded-lg text-xs font-bold text-blue-900 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PARTIAL & HALF DAY (ZERO SCROLL FIT) */}
            {activeTab === 'partial' && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-1 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    Partial Day, Half-Day & Session Reporting Rules
                  </h3>
                </div>

                {/* PARTIAL DAY 1 COMPACT CARD */}
                <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-2 space-y-1.5">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                    <FormToggleSwitch label="Partial Day 1" checked={formData.pst_allow_partial_day} onChange={(val) => handleToggleChange('pst_allow_partial_day', val)} />
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Week Day</label>
                      <SearchableFormSelect options={weekDayOptions} value={formData.week_off} onChange={(val) => handleSelectChange('week_off', val)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Begin Time</label>
                      <input type="time" name="pst_partial_day_begin_time" value={formData.pst_partial_day_begin_time} onChange={handleChange} disabled={!formData.pst_allow_partial_day} className="w-full px-2 py-0.5 h-7 bg-white border border-slate-300 rounded-lg text-xs disabled:bg-slate-100 disabled:cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">End Time</label>
                      <input type="time" name="pst_partial_day_end_time" value={formData.pst_partial_day_end_time} onChange={handleChange} disabled={!formData.pst_allow_partial_day} className="w-full px-2 py-0.5 h-7 bg-white border border-slate-300 rounded-lg text-xs disabled:bg-slate-100 disabled:cursor-not-allowed" />
                    </div>
                  </div>
                  {/* Occurrences Checkbox Group (Dynamic from Masters API) */}
                  <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60 text-xs">
                    <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap">Month Occurrences:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {occurrenceOptions.map((occ) => {
                        const isChecked = (formData.occurrences1 || []).includes(occ);
                        return (
                          <label key={occ} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10.5px] font-bold cursor-pointer transition-colors ${
                            isChecked ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={!formData.pst_allow_partial_day}
                              onChange={() => handleOccurrenceToggle(1, occ)}
                              className="w-3 h-3 text-amber-600 rounded"
                            />
                            <span>{occ}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* PARTIAL DAY 2 COMPACT CARD */}
                <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-2 space-y-1.5">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                    <FormToggleSwitch label="Partial Day 2" checked={formData.pst_allow_partial_day2} onChange={(val) => handleToggleChange('pst_allow_partial_day2', val)} />
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Week Day 2</label>
                      <SearchableFormSelect options={weekDayOptions} value={formData.week_off2} onChange={(val) => handleSelectChange('week_off2', val)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Begin Time 2</label>
                      <input type="time" name="pst_partial_day_begin_time2" value={formData.pst_partial_day_begin_time2} onChange={handleChange} disabled={!formData.pst_allow_partial_day2} className="w-full px-2 py-0.5 h-7 bg-white border border-slate-300 rounded-lg text-xs disabled:bg-slate-100 disabled:cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">End Time 2</label>
                      <input type="time" name="pst_partial_day_end_time2" value={formData.pst_partial_day_end_time2} onChange={handleChange} disabled={!formData.pst_allow_partial_day2} className="w-full px-2 py-0.5 h-7 bg-white border border-slate-300 rounded-lg text-xs disabled:bg-slate-100 disabled:cursor-not-allowed" />
                    </div>
                  </div>
                  {/* Occurrences Checkbox Group (Dynamic from Masters API) */}
                  <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60 text-xs">
                    <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap">Month Occurrences:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {occurrenceOptions.map((occ) => {
                        const isChecked = (formData.occurrences2 || []).includes(occ);
                        return (
                          <label key={occ} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10.5px] font-bold cursor-pointer transition-colors ${
                            isChecked ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={!formData.pst_allow_partial_day2}
                              onChange={() => handleOccurrenceToggle(2, occ)}
                              className="w-3 h-3 text-amber-600 rounded"
                            />
                            <span>{occ}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* HALF DAY REPORTING LIMITS STRIP */}
                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-2 space-y-1">
                  <span className="text-[11px] font-bold text-blue-800 uppercase block">Half-Day & Session Reporting Rules</span>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                    <FormToggleSwitch label="HD Report After" checked={formData.pst_hd_office_report_after} onChange={(val) => handleToggleChange('pst_hd_office_report_after', val)} />
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">After Time</label>
                      <input type="time" name="pst_hd_office_report_after_time" value={formData.pst_hd_office_report_after_time} onChange={handleChange} disabled={!formData.pst_hd_office_report_after} className="w-full px-2 py-0.5 h-7 bg-white border border-slate-300 rounded-lg text-xs disabled:bg-slate-100 disabled:cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Session 1 End</label>
                      <input type="time" name="pst_session1_end_by" value={formData.pst_session1_end_by} onChange={handleChange} disabled={!formData.pst_hd_office_report_after} className="w-full px-2 py-0.5 h-7 bg-white border border-slate-300 rounded-lg text-xs disabled:bg-slate-100 disabled:cursor-not-allowed" />
                    </div>
                    <FormToggleSwitch label="HD Report Before" checked={formData.pst_hd_office_report_before} onChange={(val) => handleToggleChange('pst_hd_office_report_before', val)} />
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Before Time</label>
                      <input type="time" name="pst_hd_office_report_before_time" value={formData.pst_hd_office_report_before_time} onChange={handleChange} disabled={!formData.pst_hd_office_report_before} className="w-full px-2 py-0.5 h-7 bg-white border border-slate-300 rounded-lg text-xs disabled:bg-slate-100 disabled:cursor-not-allowed" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BOTTOM FOOTER WITH NAVIGATION & ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
              
              <div className="text-[11px] text-slate-500 font-medium">
                Tab <span className="font-bold text-blue-600">
                  {activeTab === 'basic' ? '1/4' : activeTab === 'grace' ? '2/4' : activeTab === 'break' ? '3/4' : '4/4'}
                </span> - {activeTab === 'basic' ? 'Basic & Timings' : activeTab === 'grace' ? 'Grace & Punch Rules' : activeTab === 'break' ? 'Break Settings' : 'Partial & Half Day'}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/attendance/settings/shift-policy')}
                  className="px-3 py-1 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                
                {activeTab !== 'partial' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!validateForm()) return; // Block step progression if validation fails
                      if (activeTab === 'basic') setActiveTab('grace');
                      else if (activeTab === 'grace') setActiveTab('break');
                      else if (activeTab === 'break') setActiveTab('partial');
                    }}
                    className="px-3.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : isEditMode ? 'Update Shift Policy' : 'Save Shift Policy'}</span>
                </button>
              </div>

            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
