import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import {
  Edit2,
  Trash2,
  X,
  RotateCcw,
  Clock,
  Coffee,
  ShieldCheck,
  CalendarCheck2,
  Eye,
  Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import * as XLSX from 'xlsx';

export interface ShiftPolicy {
  id: number | string;
  pst_id?: number | string;
  shift_name: string;
  pst_name?: string;
  pst_code?: string;
  attendance_policy_name: string;
  pst_ap_id?: string;
  shift_type: string;
  pst_type_id?: string;
  wef_date?: string;
  pst_wef_date?: string;
  wet_date?: string;
  pst_wet_date?: string;
  start_time?: string;
  pst_start_time?: string;
  end_time?: string;
  pst_end_time?: string;
  shift_duration?: string;
  pst_shift_duration?: string;
  min_work_hour?: string;
  pst_min_work_hour?: string;
  end_next_day?: boolean;
  pst_end_next_day?: boolean;
  half_day_cutoff?: string;
  grace_period_mins?: number;
  pst_grace_time?: number;
  pst_session2_grace_time?: number;
  pst_mins_punch_begin_before?: number;
  pst_mins_punch_end_after?: number;
  break_duration_mins?: number;
  pst_break_duration_minutes?: number;
  pst_is_break_paid?: boolean;
  pst_allow_break1?: boolean;
  pst_break_begin_time1?: string;
  pst_break_end_time1?: string;
  pst_break1_duration?: number;
  pst_allow_break2?: boolean;
  pst_break_begin_time2?: string;
  pst_break_end_time2?: string;
  pst_break2_duration?: number;
  pst_allow_partial_day?: boolean;
  pst_partial_day_begin_time?: string;
  pst_partial_day_end_time?: string;
  week_off?: string;
  occurrences1?: string[];
  pst_allow_partial_day2?: boolean;
  pst_partial_day_begin_time2?: string;
  pst_partial_day_end_time2?: string;
  week_off2?: string;
  occurrences2?: string[];
  pst_hd_office_report_after?: boolean;
  pst_hd_office_report_after_time?: string;
  pst_session1_end_by?: string;
  pst_hd_office_report_before?: boolean;
  pst_hd_office_report_before_time?: string;
  status: 'Active' | 'Inactive';
  pst_is_active?: boolean;
  deleted_at?: string | null;
}

// Searchable Select Component
const SearchableSelect: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isClearable?: boolean;
  className?: string;
}> = ({ options, value, onChange, placeholder, isClearable = true, className = 'w-44' }) => {
  const selectedOption = options.find((opt) => opt.value === value) || null;
  return (
    <Select
      options={options}
      value={selectedOption}
      onChange={(selected) => onChange(selected ? (selected as any).value : '')}
      placeholder={placeholder}
      isClearable={isClearable}
      className={`${className} text-xs`}
      classNamePrefix="react-select"
      styles={{
        control: (base: any) => ({
          ...base,
          borderRadius: '0.375rem',
          borderColor: '#d1d5db',
          minHeight: '28px',
          height: '28px',
          fontSize: '12px',
          boxShadow: 'none',
          backgroundColor: 'white',
          '&:hover': { borderColor: '#9ca3af' },
        }),
        valueContainer: (base: any) => ({ ...base, padding: '0 6px' }),
        input: (base: any) => ({ ...base, margin: '0', padding: '0' }),
        option: (base: any, state: any) => ({
          ...base,
          backgroundColor: state.isFocused ? '#eff6ff' : 'white',
          color: '#1f2937',
          cursor: 'pointer',
          fontSize: '12px',
          padding: '4px 8px',
        }),
        dropdownIndicator: (base: any) => ({ ...base, padding: '2px' }),
        clearIndicator: (base: any) => ({ ...base, padding: '2px' }),
        placeholder: (base: any) => ({ ...base, fontSize: '12px', color: '#6b7280' }),
        singleValue: (base: any) => ({ ...base, fontSize: '12px', color: '#1f2937' }),
      }}
    />
  );
};

// ──────────────────────────────────────────────────────
// REDESIGNED TABBED SHIFT DETAIL VIEW MODAL
// ──────────────────────────────────────────────────────
const ShiftDetailModal: React.FC<{
  shift: ShiftPolicy;
  onClose: () => void;
  onEdit: () => void;
  onCopy: () => void;
}> = ({ shift, onClose, onEdit, onCopy }) => {
  const [modalTab, setModalTab] = useState<'basic' | 'grace' | 'break' | 'partial'>('basic');

  const shiftName = shift.pst_name || shift.shift_name;
  const shiftCode = shift.pst_code || 'N/A';
  const shiftType = shift.shift_type || 'Fixed Shift';
  const policyName = shift.attendance_policy_name || 'Default Attendance Policy';
  const status = shift.status || (shift.pst_is_active === false ? 'Inactive' : 'Active');

  const wefDate = shift.pst_wef_date || shift.wef_date || '—';
  const wetDate = shift.pst_wet_date || shift.wet_date || '';

  const todayStr = new Date().toISOString().split('T')[0];
  const isWefLocked = Boolean(wefDate && wefDate !== '—' && wefDate <= todayStr);
  const isWetPassed = Boolean(wetDate && wetDate < todayStr);

  const shiftTypeGradients: Record<string, string> = {
    'Fixed Shift': 'from-blue-600 to-indigo-700',
    'Rotational Shift': 'from-violet-600 to-purple-700',
    'Flexible Shift': 'from-amber-500 to-orange-600',
    'Night Shift': 'from-slate-800 to-slate-950',
    'Split Shift': 'from-teal-600 to-cyan-700',
  };

  const gradient = shiftTypeGradients[shiftType] || 'from-blue-600 to-indigo-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HERO HEADER */}
        <div className={`bg-gradient-to-r ${gradient} p-4 sm:p-5 relative text-white flex-shrink-0`}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-white/20 backdrop-blur-xs border border-white/20 uppercase tracking-wider">
                  {shiftType}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/20 border border-white/10 font-mono">
                  Code: {shiftCode}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                  status === 'Active' ? 'bg-emerald-500/30 text-emerald-100 border-emerald-400/40' : 'bg-rose-500/30 text-rose-100 border-rose-400/40'
                }`}>
                  {status === 'Active' ? '✓ Active' : '✕ Inactive'}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1">
                {shiftName}
              </h2>
              <p className="text-white/80 text-xs font-medium">{policyName}</p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MODAL INTERNAL TAB NAVIGATION BAR */}
        <div className="flex items-center gap-1 bg-slate-100/90 px-3 py-1.5 border-b border-slate-200 text-xs flex-shrink-0 overflow-x-auto">
          <button
            onClick={() => setModalTab('basic')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all whitespace-nowrap ${
              modalTab === 'basic' ? 'bg-white text-blue-700 shadow-2xs border border-slate-200' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Clock className="w-3 h-3 text-blue-600" />
            Basic & Timings
          </button>
          <button
            onClick={() => setModalTab('grace')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all whitespace-nowrap ${
              modalTab === 'grace' ? 'bg-white text-blue-700 shadow-2xs border border-slate-200' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Grace & Punch
          </button>
          <button
            onClick={() => setModalTab('break')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all whitespace-nowrap ${
              modalTab === 'break' ? 'bg-white text-blue-700 shadow-2xs border border-slate-200' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Coffee className="w-3 h-3 text-purple-600" />
            Break Settings
          </button>
          <button
            onClick={() => setModalTab('partial')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all whitespace-nowrap ${
              modalTab === 'partial' ? 'bg-white text-blue-700 shadow-2xs border border-slate-200' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <CalendarCheck2 className="w-3 h-3 text-amber-600" />
            Partial & Half Day
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE CONTENT) */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">

          {/* TAB 1: BASIC & TIMINGS */}
          {modalTab === 'basic' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* WEF & WET DATE STRIP */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">W.E.F. Date (With Effect From)</span>
                    {isWefLocked ? (
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-200">
                        🔒 Effective
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200">
                        ⏳ Pending
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-900">{wefDate}</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">W.E.T. Date (With Effect To)</span>
                    {isWetPassed ? (
                      <span className="text-[9px] font-bold bg-rose-100 text-rose-900 px-1.5 py-0.2 rounded border border-rose-200">
                        ⌛ Expired
                      </span>
                    ) : wetDate ? (
                      <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">
                        ✅ Active
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                        ♾️ Open-ended
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-900">{wetDate || '— (No Expiry)'}</span>
                </div>
              </div>

              {/* TIMINGS DISPLAY GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-2.5 space-y-0.5">
                  <span className="text-[10px] font-bold text-blue-700 uppercase block">Start Time</span>
                  <span className="text-base font-extrabold text-blue-950 block">{shift.pst_start_time || shift.start_time || '08:00'}</span>
                </div>

                <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-2.5 space-y-0.5">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase block">End Time</span>
                  <span className="text-base font-extrabold text-indigo-950 block">{shift.pst_end_time || shift.end_time || '16:30'}</span>
                </div>

                <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-2.5 space-y-0.5">
                  <span className="text-[10px] font-bold text-purple-700 uppercase block">Shift Duration</span>
                  <span className="text-base font-extrabold text-purple-950 block">{shift.pst_shift_duration || '08:30 hrs'}</span>
                </div>

                <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-2.5 space-y-0.5">
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">Min Work Hours</span>
                  <span className="text-base font-extrabold text-amber-950 block">{shift.pst_min_work_hour || shift.half_day_cutoff || '04:00 hrs'}</span>
                </div>
              </div>

              {shift.pst_end_next_day && (
                <div className="bg-slate-900 text-white rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <span className="font-bold">🌙 Night Shift Condition:</span>
                  <span className="bg-slate-800 text-amber-400 px-2 py-0.5 rounded font-mono font-bold text-[11px] border border-slate-700">
                    Shift Ends Next Day (Crosses Midnight)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GRACE & PUNCH RESTRICTIONS */}
          {modalTab === 'grace' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Grace Time</span>
                  <span className="text-xl font-extrabold text-emerald-950">{shift.pst_grace_time ?? shift.grace_period_mins ?? 15} Mins</span>
                  <p className="text-[10px] text-emerald-700">Allowed late arrival margin</p>
                </div>

                <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-bold text-sky-800 uppercase block">Early Punch Limit</span>
                  <span className="text-xl font-extrabold text-sky-950">{shift.pst_mins_punch_begin_before ?? 30} Mins</span>
                  <p className="text-[10px] text-sky-700">Before shift start time</p>
                </div>

                <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-bold text-indigo-800 uppercase block">Late Punch Limit</span>
                  <span className="text-xl font-extrabold text-indigo-950">{shift.pst_mins_punch_end_after ?? 60} Mins</span>
                  <p className="text-[10px] text-indigo-700">After shift end time</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BREAK SETTINGS */}
          {modalTab === 'break' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="bg-purple-50/60 border border-purple-200/80 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-purple-700 uppercase block">Total Break Duration</span>
                  <span className="text-xl font-extrabold text-purple-950">{shift.pst_break_duration_minutes ?? shift.break_duration_mins ?? 45} Minutes</span>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                  shift.pst_is_break_paid ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  {shift.pst_is_break_paid ? '☕ Paid Break' : ' Unpaid Break'}
                </span>
              </div>

              {/* BREAK SLOTS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1">
                  <span className="text-[11px] font-bold text-blue-700 uppercase block">Break Slot 1</span>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>{shift.pst_break_begin_time1 || '12:30'} - {shift.pst_break_end_time1 || '13:15'}</span>
                    <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {shift.pst_break1_duration || 45} Mins
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1">
                  <span className="text-[11px] font-bold text-blue-700 uppercase block">Break Slot 2</span>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>{shift.pst_break_begin_time2 || '—'} - {shift.pst_break_end_time2 || '—'}</span>
                    <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {shift.pst_break2_duration || 0} Mins
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PARTIAL & HALF DAY RULES */}
          {modalTab === 'partial' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* PARTIAL DAY 1 */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900 uppercase">Partial Day 1</span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                    Day: {shift.week_off || 'Sunday'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-800 font-semibold">
                  <span>Shift Timings: {shift.pst_partial_day_begin_time || '08:00'} - {shift.pst_partial_day_end_time || '12:30'}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-500">Occurrences:</span>
                    {(shift.occurrences1 || ['2nd', '4th']).map((occ) => (
                      <span key={occ} className="bg-amber-200/80 text-amber-950 px-1.5 py-0.2 rounded text-[10px] font-extrabold border border-amber-300">
                        {occ}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* PARTIAL DAY 2 */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900 uppercase">Partial Day 2</span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                    Day: {shift.week_off2 || 'Saturday'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-800 font-semibold">
                  <span>Shift Timings: {shift.pst_partial_day_begin_time2 || '—'} - {shift.pst_partial_day_end_time2 || '—'}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-500">Occurrences:</span>
                    {(shift.occurrences2 || ['1st', '3rd']).map((occ) => (
                      <span key={occ} className="bg-amber-200/80 text-amber-950 px-1.5 py-0.2 rounded text-[10px] font-extrabold border border-amber-300">
                        {occ}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* HALF DAY & SESSION REPORTING RULES */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-2.5 space-y-1.5">
                <span className="text-[11px] font-bold text-blue-900 uppercase block">Half-Day & Session Reporting Rules</span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-1.5 rounded-lg border border-blue-100">
                    <span className="text-[9.5px] font-bold text-slate-500 block uppercase">HD Report After</span>
                    <span className="font-extrabold text-blue-900">{shift.pst_hd_office_report_after_time || '12:30'}</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-blue-100">
                    <span className="text-[9.5px] font-bold text-slate-500 block uppercase">Session 1 End</span>
                    <span className="font-extrabold text-blue-900">{shift.pst_session1_end_by || '12:30'}</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-blue-100">
                    <span className="text-[9.5px] font-bold text-slate-500 block uppercase">HD Report Before</span>
                    <span className="font-extrabold text-blue-900">{shift.pst_hd_office_report_before_time || '13:00'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 p-3 border-t border-slate-200 flex items-center justify-between gap-2 flex-shrink-0 text-xs">
          <span className="text-slate-500 font-medium">Shift ID: <span className="font-bold text-slate-800">#{shift.id}</span></span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold transition-colors"
            >
              Close
            </button>
            <button
              onClick={onCopy}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Shift
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Shift Policy
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────
// MAIN LIST COMPONENT
// ──────────────────────────────────────────────────────
export default function ShiftPolicyList() {
  const navigate = useNavigate();

  const [shifts, setShifts] = useState<ShiftPolicy[]>([
    { id: 1, shift_name: 'Fixed Shift', attendance_policy_name: 'Default Attendance Policy', shift_type: 'Fixed Shift', wef_date: '04-Jul-2026 10:36 AM', start_time: '08:00 AM', end_time: '04:30 PM', half_day_cutoff: '12:30 PM', grace_period_mins: 15, break_duration_mins: 45, status: 'Active' },
    { id: 2, shift_name: 'Night Shift', attendance_policy_name: 'Default Attendance Policy', shift_type: 'Rotational Shift', wef_date: '22-Jul-2026 04:38 AM', start_time: '08:00 PM', end_time: '06:00 AM', half_day_cutoff: '01:00 AM', grace_period_mins: 10, break_duration_mins: 30, status: 'Active' },
    { id: 3, shift_name: 'Dophar Shift', attendance_policy_name: 'Default Attendance Policy', shift_type: 'Rotational Shift', wef_date: '22-Jul-2026 04:38 AM', start_time: '12:00 PM', end_time: '06:00 PM', half_day_cutoff: '03:00 PM', grace_period_mins: 15, break_duration_mins: 30, status: 'Active' },
    { id: 4, shift_name: 'MY SHIFT', attendance_policy_name: 'Default Attendance Policy', shift_type: 'Rotational Shift', wef_date: '22-Jul-2026 04:38 AM', start_time: '09:00 AM', end_time: '05:00 PM', half_day_cutoff: '01:00 PM', grace_period_mins: 15, break_duration_mins: 45, status: 'Active' },
    { id: 5, shift_name: 'Default General Shift', attendance_policy_name: 'Default Attendance Policy', shift_type: 'Fixed Shift', wef_date: '07-Jul-2026 04:45 PM', start_time: '08:30 AM', end_time: '04:00 PM', half_day_cutoff: '12:30 PM', grace_period_mins: 15, break_duration_mins: 45, status: 'Active' },
  ]);

  const [viewTrash, setViewTrash] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const [viewingShift, setViewingShift] = useState<ShiftPolicy | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [filterShiftType, setFilterShiftType] = useState<string>('');
  const [filterAttendancePolicy, setFilterAttendancePolicy] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);

  const [shiftTypeOptions, setShiftTypeOptions] = useState<{ value: string; label: string }[]>([
    { value: 'Fixed Shift', label: 'Fixed Shift' },
    { value: 'Rotational Shift', label: 'Rotational Shift' },
    { value: 'Flexible Shift', label: 'Flexible Shift' },
    { value: 'Night Shift', label: 'Night Shift' },
    { value: 'Split Shift', label: 'Split Shift' },
  ]);

  const [attendancePolicyOptions, setAttendancePolicyOptions] = useState<{ value: string; label: string }[]>([
    { value: 'Default Attendance Policy', label: 'Default Attendance Policy' },
    { value: 'Standard Student Attendance Policy', label: 'Standard Student Attendance Policy' },
    { value: 'Staff & Faculty Attendance Policy', label: 'Staff & Faculty Attendance Policy' },
    { value: 'Executive Staff Policy', label: 'Executive Staff Policy' },
  ]);

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
  ];

  useEffect(() => {
    fetchShifts();
    fetchMasters();
  }, [viewTrash]);

  const fetchMasters = async () => {
    try {
      const response = await api.get('/attendance/settings/shifts/masters');
      if (response.data?.success && response.data?.data) {
        const { attendance_policies, shift_types } = response.data.data;
        if (Array.isArray(attendance_policies)) {
          setAttendancePolicyOptions(attendance_policies.map((p: string) => ({ value: p, label: p })));
        }
        if (Array.isArray(shift_types)) {
          setShiftTypeOptions(shift_types.map((t: string) => ({ value: t, label: t })));
        }
      }
    } catch {
      console.log('Using default shift & policy master options');
    }
  };

  const fetchShifts = async () => {
    try {
      const response = await api.get('/attendance/settings/shifts', { params: { only_trashed: viewTrash } });
      if (response.data?.success && Array.isArray(response.data.data)) setShifts(response.data.data);
    } catch { console.log('Using local shift datasets'); }
  };

  const handleToggleStatus = async (id: number | string) => {
    setShifts((prev) => prev.map((item) => item.id === id ? { ...item, status: item.status === 'Active' ? 'Inactive' : 'Active' } : item));
    try { await api.patch(`/attendance/settings/shifts/${id}/toggle-active`); } catch { }
    toast.success('Shift policy status updated');
  };

  const handleDeleteShift = async (id: number | string, name: string) => {
    if (window.confirm(`Move "${name}" to trash?`)) {
      setShifts(shifts.filter((s) => s.id !== id));
      try { await api.delete(`/attendance/settings/shifts/${id}`); } catch { }
      toast.success('Shift policy moved to trash');
    }
  };

  const handleRestoreShift = async (id: number | string, name: string) => {
    setShifts(shifts.filter((s) => s.id !== id));
    try { await api.post(`/attendance/settings/shifts/restore/${id}`); } catch { }
    toast.success(`"${name}" restored`);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(column); setSortDirection('asc'); }
  };

  const getSortIcon = (column: string) => {
    const isActive = sortColumn === column;
    return (
      <span className={`inline-flex items-center justify-center w-3.5 h-3.5 ml-1 rounded text-[8px] font-bold ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
        {isActive ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
      </span>
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(currentEntries.map((item) => item.id)) : new Set());
  };

  const handleSelectRow = (id: number | string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const handleBulkAction = async (action: 'activate' | 'inactivate' | 'delete' | 'restore' | 'force_delete') => {
    if (selectedIds.size === 0) return;
    const arrayIds = Array.from(selectedIds);
    if (action === 'activate') setShifts((prev) => prev.map((s) => selectedIds.has(s.id) ? { ...s, status: 'Active' } : s));
    else if (action === 'inactivate') setShifts((prev) => prev.map((s) => selectedIds.has(s.id) ? { ...s, status: 'Inactive' } : s));
    else setShifts((prev) => prev.filter((s) => !selectedIds.has(s.id)));
    toast.success(`${arrayIds.length} item(s) — ${action}`);
    try { await api.post('/attendance/settings/shifts/bulk-action', { action, ids: arrayIds }); } catch { }
    setSelectedIds(new Set());
  };

  const handleExport = () => {
    const exportData = filteredData.map((s, idx) => ({ 'S.NO.': idx + 1, 'SHIFT NAME': s.shift_name, 'ATTENDANCE POLICY': s.attendance_policy_name, 'SHIFT TYPE': s.shift_type, 'W.E.F.': s.wef_date, 'STATUS': s.status }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Shift Policies');
    XLSX.writeFile(wb, `shift_policies_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Export successful!');
  };

  const downloadSampleFile = () => {
    const sample = [{ 'Shift Name': 'Fixed Morning Shift', 'Attendance Policy': 'Default Attendance Policy', 'Shift Type': 'Fixed Shift', 'W.E.F. Date': '2026-07-25 10:00 AM', 'Start Time': '08:00 AM', 'End Time': '04:30 PM', 'Half Day Cutoff': '12:30 PM', 'Grace Period Mins': 15, 'Break Duration Mins': 45, 'Status': 'Active' }];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample');
    XLSX.writeFile(wb, 'sample_shift_policies.xlsx');
    toast.success('Sample file downloaded!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const parsed: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        setImportPreview(parsed);
        setIsImportModalOpen(true);
      } catch { toast.error('Failed to parse file'); }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = () => {
    if (!importPreview.length) return;
    const items: ShiftPolicy[] = importPreview.map((item, idx) => ({ id: Date.now() + idx, shift_name: item['Shift Name'] || `Imported ${idx + 1}`, attendance_policy_name: item['Attendance Policy'] || 'Default Attendance Policy', shift_type: item['Shift Type'] || 'Fixed Shift', wef_date: item['W.E.F. Date'] || '25-Jul-2026', status: 'Active' }));
    setShifts([...items, ...shifts]);
    toast.success(`Imported ${items.length} records`);
    setIsImportModalOpen(false);
    setImportPreview([]);
  };

  const clearFilters = () => { setSearchTerm(''); setFilterShiftType(''); setFilterAttendancePolicy(''); setFilterStatus(''); };

  let filteredData = [...shifts];
  if (searchTerm) filteredData = filteredData.filter((s) => [s.shift_name, s.attendance_policy_name, s.shift_type, s.wef_date].some((v) => v.toLowerCase().includes(searchTerm.toLowerCase())));
  if (filterShiftType) filteredData = filteredData.filter((s) => s.shift_type === filterShiftType);
  if (filterAttendancePolicy) filteredData = filteredData.filter((s) => s.attendance_policy_name === filterAttendancePolicy);
  if (filterStatus) filteredData = filteredData.filter((s) => s.status === filterStatus);

  filteredData.sort((a, b) => {
    let va = (a as any)[sortColumn] || ''; let vb = (b as any)[sortColumn] || '';
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    return va < vb ? (sortDirection === 'asc' ? -1 : 1) : va > vb ? (sortDirection === 'asc' ? 1 : -1) : 0;
  });

  const totalEntries = filteredData.length;
  const indexOfLastEntry = itemsPerPage === -1 ? totalEntries : currentPage * itemsPerPage;
  const indexOfFirstEntry = itemsPerPage === -1 ? 0 : (currentPage - 1) * itemsPerPage;
  const currentEntries = itemsPerPage === -1 ? filteredData : filteredData.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(totalEntries / itemsPerPage) || 1;
  const isAllSelected = currentEntries.length > 0 && currentEntries.every((item) => selectedIds.has(item.id));

  // Shift type badge styling
  const getShiftTypeBadge = (type: string) => {
    const map: Record<string, string> = {
      'Fixed Shift': 'bg-blue-50 text-blue-700 border-blue-200',
      'Rotational Shift': 'bg-violet-50 text-violet-700 border-violet-200',
      'Flexible Shift': 'bg-amber-50 text-amber-700 border-amber-200',
      'Night Shift': 'bg-slate-100 text-slate-700 border-slate-200',
      'Split Shift': 'bg-teal-50 text-teal-700 border-teal-200',
    };
    return map[type] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="bg-[#f4f7fc] p-2.5 sm:p-3 md:p-4 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-2">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-0.5">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-[#2b6cb0] tracking-tight">Shift Policy Settings</h1>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
              <span onClick={() => navigate('/attendance/dashboard')} className="hover:text-blue-600 cursor-pointer">Dashboard</span>
              <span>/</span>
              <span onClick={() => navigate('/attendance/config')} className="hover:text-blue-600 cursor-pointer">Attendance Settings</span>
              <span>/</span>
              <span className="font-bold text-slate-700">Shift Policy</span>
            </div>
          </div>
        </div>

        {/* BULK ACTION BAR */}
        {selectedIds.size > 0 && (
          <div className="bg-slate-900 text-white px-3 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-blue-600 px-2 py-0.5 rounded-md">{selectedIds.size} Selected</span>
              <span className="text-xs text-slate-300">Choose a bulk action:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!viewTrash ? (
                <>
                  <button onClick={() => handleBulkAction('activate')} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors">Activate</button>
                  <button onClick={() => handleBulkAction('inactivate')} className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors">Inactivate</button>
                  <button onClick={() => handleBulkAction('delete')} className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors">Move to Trash</button>
                </>
              ) : (
                <>
                  <button onClick={() => handleBulkAction('restore')} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors">Bulk Restore</button>
                  <button onClick={() => handleBulkAction('force_delete')} className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors">Force Delete</button>
                </>
              )}
              <button onClick={() => setSelectedIds(new Set())} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold">Cancel</button>
            </div>
          </div>
        )}

        {/* MAIN CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-3 space-y-2.5">

          {/* CONTROL BAR */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 text-xs shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search shift policies..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="px-2.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none w-48 h-7 bg-white shadow-2xs"
              />
              <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-0.5 h-7">
                <span className="text-[10px] text-gray-500 font-bold uppercase">SHOW:</span>
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(e.target.value === 'all' ? -1 : Number(e.target.value)); setCurrentPage(1); }} className="text-xs font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer">
                  <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option><option value="all">All</option>
                </select>
              </div>
              <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-2.5 py-0.5 h-7">
                <span className="text-xs text-gray-700 font-medium select-none">Trashed</span>
                <button type="button" onClick={() => setViewTrash((p) => !p)} className={`relative inline-flex h-[16px] w-[32px] items-center rounded-full transition-colors ${viewTrash ? 'bg-red-500' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-[10px] w-[10px] rounded-full bg-white transition-transform ${viewTrash ? 'translate-x-[18px]' : 'translate-x-[4px]'}`} />
                </button>
              </div>
              {(searchTerm || filterShiftType || filterAttendancePolicy || filterStatus) && (
                <button onClick={clearFilters} className="text-[10px] font-bold text-rose-600 hover:underline bg-rose-50 px-2 py-1 rounded">Clear Filters</button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button onClick={downloadSampleFile} className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 bg-white rounded hover:bg-gray-50 transition text-xs font-semibold h-7 shadow-2xs" title="Download Sample">
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Sample
              </button>
              <label className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 bg-white rounded hover:bg-gray-50 transition cursor-pointer text-xs font-semibold h-7 shadow-2xs">
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Import
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
              </label>
              <button onClick={handleExport} className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 bg-white rounded hover:bg-gray-50 transition text-xs font-semibold h-7 shadow-2xs">
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export
              </button>
              <button onClick={() => navigate('/attendance/settings/shift-policy/create')} className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition text-xs font-bold h-7 shadow-2xs">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                + Add New
              </button>
            </div>
          </div>

          {/* FILTER ROW */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <SearchableSelect options={shiftTypeOptions} value={filterShiftType} onChange={(v) => { setFilterShiftType(v); setCurrentPage(1); }} placeholder="Shift Types" className="w-44" />
            <SearchableSelect options={attendancePolicyOptions} value={filterAttendancePolicy} onChange={(v) => { setFilterAttendancePolicy(v); setCurrentPage(1); }} placeholder="Attendance Policies" className="w-52" />
            <SearchableSelect options={statusOptions} value={filterStatus} onChange={(v) => { setFilterStatus(v); setCurrentPage(1); }} placeholder="Status" className="w-36" />
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-slate-700 font-extrabold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                  <th className="py-2 px-3 w-10 text-center">
                    <input type="checkbox" checked={isAllSelected} onChange={(e) => handleSelectAll(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  </th>
                  <th onClick={() => handleSort('id')} className="py-2 px-3 whitespace-nowrap cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center gap-1 whitespace-nowrap"><span>S. NO.</span>{getSortIcon('id')}</div>
                  </th>
                  <th onClick={() => handleSort('shift_name')} className="py-2 px-3.5 whitespace-nowrap cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center whitespace-nowrap"><span>SHIFT NAME</span>{getSortIcon('shift_name')}</div>
                  </th>
                  <th onClick={() => handleSort('attendance_policy_name')} className="py-2 px-3.5 whitespace-nowrap cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center whitespace-nowrap"><span>ATTENDANCE POLICY</span>{getSortIcon('attendance_policy_name')}</div>
                  </th>
                  <th onClick={() => handleSort('shift_type')} className="py-2 px-3.5 whitespace-nowrap cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center whitespace-nowrap"><span>SHIFT TYPE</span>{getSortIcon('shift_type')}</div>
                  </th>
                  <th onClick={() => handleSort('wef_date')} className="py-2 px-3.5 whitespace-nowrap cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center whitespace-nowrap"><span>W.E.F.</span>{getSortIcon('wef_date')}</div>
                  </th>
                  <th onClick={() => handleSort('status')} className="py-2 px-3.5 text-center whitespace-nowrap cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center justify-center whitespace-nowrap"><span>STATUS</span>{getSortIcon('status')}</div>
                  </th>
                  <th className="py-2 px-3.5 text-right w-28 whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-slate-700 font-medium">
                {currentEntries.length > 0 ? (
                  currentEntries.map((row, index) => (
                    <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="py-2 px-3 text-center">
                        <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => handleSelectRow(row.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                      </td>
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{indexOfFirstEntry + index + 1}</td>
                      <td className="py-2 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span>{row.shift_name}</span>
                          {row.start_time && row.end_time && (
                            <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-slate-400" />
                              {row.start_time} → {row.end_time}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3.5 text-slate-600 whitespace-nowrap">{row.attendance_policy_name}</td>
                      <td className="py-2 px-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getShiftTypeBadge(row.shift_type)}`}>{row.shift_type}</span>
                      </td>
                      <td className="py-2 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          <CalendarCheck2 className="w-3 h-3" />{row.wef_date}
                        </span>
                      </td>
                      <td className="py-2 px-3.5 text-center whitespace-nowrap">
                        <button type="button" onClick={() => handleToggleStatus(row.id)} className={`relative inline-flex h-[16px] w-[32px] items-center rounded-full transition-colors focus:outline-none ${row.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-[10px] w-[10px] rounded-full bg-white transition-transform ${row.status === 'Active' ? 'translate-x-[18px]' : 'translate-x-[4px]'}`} />
                        </button>
                      </td>
                      <td className="py-2 px-3.5 text-right whitespace-nowrap">
                        {!viewTrash ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* VIEW BUTTON */}
                            <button
                              onClick={() => setViewingShift(row)}
                              className="p-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {/* COPY BUTTON */}
                            <button
                              onClick={() => navigate(`/attendance/settings/shift-policy/copy/${row.id}`)}
                              className="p-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors"
                              title="Copy / Duplicate Shift"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {/* EDIT BUTTON */}
                            <button onClick={() => navigate(`/attendance/settings/shift-policy/edit/${row.id}`)} className="p-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors" title="Edit">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {/* TRASH BUTTON */}
                            <button onClick={() => handleDeleteShift(row.id, row.shift_name)} className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors" title="Trash">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => handleRestoreShift(row.id, row.shift_name)} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" />Restore
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-normal">No shift policies found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 text-xs text-slate-500">
            <div>Showing {totalEntries > 0 ? indexOfFirstEntry + 1 : 0} to {Math.min(indexOfLastEntry, totalEntries)} of {totalEntries} entries</div>
            <div className="flex items-center gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`px-2.5 py-1 rounded-lg font-semibold ${currentPage === page ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`}>{page}</button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            </div>
          </div>

        </div>
      </div>

      {/* SHIFT DETAIL VIEW MODAL */}
      {viewingShift && (
        <ShiftDetailModal
          shift={viewingShift}
          onClose={() => setViewingShift(null)}
          onEdit={() => { navigate(`/attendance/settings/shift-policy/edit/${viewingShift.id}`); setViewingShift(null); }}
          onCopy={() => { navigate(`/attendance/settings/shift-policy/copy/${viewingShift.id}`); setViewingShift(null); }}
        />
      )}

      {/* IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Import Shift Policies</h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            {importPreview.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700">Preview ({importPreview.length} rows):</span>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 text-[11px] font-mono">
                  {importPreview.map((row, i) => (<div key={i} className="py-1 border-b border-slate-200 last:border-0">{JSON.stringify(row)}</div>))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
              <button disabled={!importPreview.length} onClick={handleConfirmImport} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">Import {importPreview.length} Records</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
