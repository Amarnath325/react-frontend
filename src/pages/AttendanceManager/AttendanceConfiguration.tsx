import { useState } from 'react';
import {
  Star,
  Home,
  Calendar,
  CalendarDays,
  Settings,
  Plus,
  Search,
  X,
  Trash2,
  Info,
  ArrowLeft,
  RefreshCw,
  ChevronRight,
  Building2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface ShiftPolicyItem {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  halfDayTime: string;
  shiftType: string;
  status: 'Active' | 'Inactive';
}

interface HolidayPolicyItem {
  id: string;
  name: string;
  year: string;
  totalHolidays: number;
  appliesTo: string;
  status: 'Active' | 'Inactive';
}

interface LeavePolicyItem {
  id: string;
  name: string;
  allowedDays: number;
  leaveType: string;
  carryForward: boolean;
  sandwichRule: boolean;
  status: 'Active' | 'Inactive';
}

interface WeeklyPolicyItem {
  id: string;
  name: string;
  primaryOff: string;
  secondaryOff: string;
  appliesTo: string;
  status: 'Active' | 'Inactive';
}

interface AutomationRuleItem {
  id: string;
  ruleName: string;
  triggerCondition: string;
  actionTaken: string;
  category: 'Late Entry' | 'Early Out' | 'Overtime' | 'Breaks';
  status: 'Active' | 'Inactive';
}

export default function AttendanceConfiguration() {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Shifts' | 'Leaves' | 'Automation'>('All');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Datasets
  const [shiftPolicies, setShiftPolicies] = useState<ShiftPolicyItem[]>([
    { id: 'SP-01', name: 'Regular Morning Shift', startTime: '08:00 AM', endTime: '02:30 PM', halfDayTime: '11:15 AM', shiftType: 'Day Shift', status: 'Active' },
    { id: 'SP-02', name: 'Full-Day Staff Shift', startTime: '08:00 AM', endTime: '04:30 PM', halfDayTime: '12:30 PM', shiftType: 'General Shift', status: 'Active' },
    { id: 'SP-03', name: 'Evening Activity Shift', startTime: '02:00 PM', endTime: '07:00 PM', halfDayTime: '04:30 PM', shiftType: 'Evening Shift', status: 'Active' },
    { id: 'SP-04', name: 'Exam Duty Special Shift', startTime: '07:30 AM', endTime: '01:30 PM', halfDayTime: '10:30 AM', shiftType: 'Special Shift', status: 'Active' },
  ]);

  const [holidayPolicies, setHolidayPolicies] = useState<HolidayPolicyItem[]>([
    { id: 'HP-01', name: 'Academic Gazetted Holidays', year: '2026-2027', totalHolidays: 16, appliesTo: 'All Campus', status: 'Active' },
    { id: 'HP-02', name: 'Restricted Holiday Schedule', year: '2026-2027', totalHolidays: 5, appliesTo: 'Staff Only', status: 'Active' },
  ]);

  const [leavePolicies, setLeavePolicies] = useState<LeavePolicyItem[]>([
    { id: 'LP-01', name: 'Casual Leave (CL) Policy', allowedDays: 12, leaveType: 'Paid Leave', carryForward: false, sandwichRule: false, status: 'Active' },
    { id: 'LP-02', name: 'Medical & Sick Leave Policy', allowedDays: 10, leaveType: 'Paid Leave', carryForward: true, sandwichRule: true, status: 'Active' },
    { id: 'LP-03', name: 'Maternity & Statutory Leave', allowedDays: 180, leaveType: 'Statutory', carryForward: false, sandwichRule: false, status: 'Active' },
  ]);

  const [weeklyPolicies, setWeeklyPolicies] = useState<WeeklyPolicyItem[]>([
    { id: 'WP-01', name: 'Standard Institution Weekoff', primaryOff: 'Sunday', secondaryOff: '2nd & 4th Saturday', appliesTo: 'All Staff', status: 'Active' },
  ]);

  const [automationRules, setAutomationRules] = useState<AutomationRuleItem[]>([
    { id: 'AR-01', ruleName: 'Late Entry Penalty Threshold', triggerCondition: '3 Late Check-ins in a month', actionTaken: 'Auto-deduct 0.5 Day Leave', category: 'Late Entry', status: 'Active' },
    { id: 'AR-02', ruleName: 'Early Departure Auto-Alert', triggerCondition: 'Check-out before shift cutoff', actionTaken: 'Notify HOD & Flag Roster', category: 'Early Out', status: 'Active' },
    { id: 'AR-03', ruleName: 'Overtime Hours Calculation', triggerCondition: 'Working duration > 8.5 Hours', actionTaken: 'Credit OT to Monthly Ledger', category: 'Overtime', status: 'Active' },
    { id: 'AR-04', ruleName: 'Lunch Break Duration Deduction', triggerCondition: 'Duty spans 1:00 PM - 1:45 PM', actionTaken: 'Deduct 45 mins from shift', category: 'Breaks', status: 'Active' },
  ]);

  // Form State
  const [newPolicyName, setNewPolicyName] = useState('');
  const [newDetail1, setNewDetail1] = useState('');
  const [newDetail2, setNewDetail2] = useState('');

  const handleAddNewItem = () => {
    if (!newPolicyName.trim()) {
      toast.error('Please enter a policy name');
      return;
    }

    if (activeModal === 'shift') {
      const newItem: ShiftPolicyItem = {
        id: `SP-0${shiftPolicies.length + 1}`,
        name: newPolicyName,
        startTime: newDetail1 || '09:00 AM',
        endTime: newDetail2 || '05:00 PM',
        halfDayTime: '01:00 PM',
        shiftType: 'Custom Shift',
        status: 'Active',
      };
      setShiftPolicies([...shiftPolicies, newItem]);
    } else if (activeModal === 'holiday') {
      const newItem: HolidayPolicyItem = {
        id: `HP-0${holidayPolicies.length + 1}`,
        name: newPolicyName,
        year: '2026-2027',
        totalHolidays: parseInt(newDetail1) || 10,
        appliesTo: newDetail2 || 'All Campus',
        status: 'Active',
      };
      setHolidayPolicies([...holidayPolicies, newItem]);
    } else if (activeModal === 'leave') {
      const newItem: LeavePolicyItem = {
        id: `LP-0${leavePolicies.length + 1}`,
        name: newPolicyName,
        allowedDays: parseInt(newDetail1) || 12,
        leaveType: newDetail2 || 'Paid Leave',
        carryForward: true,
        sandwichRule: false,
        status: 'Active',
      };
      setLeavePolicies([...leavePolicies, newItem]);
    } else if (activeModal === 'weekly') {
      const newItem: WeeklyPolicyItem = {
        id: `WP-0${weeklyPolicies.length + 1}`,
        name: newPolicyName,
        primaryOff: newDetail1 || 'Sunday',
        secondaryOff: newDetail2 || 'Saturday',
        appliesTo: 'Staff & Faculty',
        status: 'Active',
      };
      setWeeklyPolicies([...weeklyPolicies, newItem]);
    } else if (activeModal === 'automation') {
      const newItem: AutomationRuleItem = {
        id: `AR-0${automationRules.length + 1}`,
        ruleName: newPolicyName,
        triggerCondition: newDetail1 || 'Custom Trigger Rule',
        actionTaken: newDetail2 || 'Send Notification',
        category: 'Late Entry',
        status: 'Active',
      };
      setAutomationRules([...automationRules, newItem]);
    }

    toast.success(`${newPolicyName} created!`);
    setNewPolicyName('');
    setNewDetail1('');
    setNewDetail2('');
    setIsAddingNew(false);
  };

  const handleDeleteItem = (id: string) => {
    if (activeModal === 'shift') setShiftPolicies(shiftPolicies.filter((i) => i.id !== id));
    else if (activeModal === 'holiday') setHolidayPolicies(holidayPolicies.filter((i) => i.id !== id));
    else if (activeModal === 'leave') setLeavePolicies(leavePolicies.filter((i) => i.id !== id));
    else if (activeModal === 'weekly') setWeeklyPolicies(weeklyPolicies.filter((i) => i.id !== id));
    else if (activeModal === 'automation') setAutomationRules(automationRules.filter((i) => i.id !== id));
    toast.success('Policy removed');
  };

  // Card Configurations Array
  const cards = [
    {
      id: 'shift',
      category: 'Shifts',
      title: 'Shift Policy',
      countBadge: `${shiftPolicies.length} Active Shifts`,
      icon: Star,
      themeGradient: 'from-amber-500 to-orange-500',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/60',
      description: 'Configure working hours, half-day cutoffs & night shift timings.',
      tags: ['Morning Shift', 'Full-Day', 'Evening', 'Night Guard'],
    },
    {
      id: 'holiday',
      category: 'Leaves',
      title: 'Holiday Policy',
      countBadge: `${holidayPolicies.length} Holiday Calendars`,
      icon: Home,
      themeGradient: 'from-emerald-500 to-teal-600',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200/60',
      description: 'Set national gazetted holidays and restricted campus calendars.',
      tags: ['Gazetted (16d)', 'Restricted (5d)', 'Academic Breaks'],
    },
    {
      id: 'leave',
      category: 'Leaves',
      title: 'Leave Policy',
      countBadge: `${leavePolicies.length} Leave Types`,
      icon: Calendar,
      themeGradient: 'from-indigo-500 to-purple-600',
      badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200/60',
      description: 'Manage casual, medical & maternity quotas with sandwich rules.',
      tags: ['Casual (12d)', 'Medical (10d)', 'Maternity (180d)'],
    },
    {
      id: 'weekly',
      category: 'Shifts',
      title: 'Weekly Policy',
      countBadge: `${weeklyPolicies.length} Weekoff Rule`,
      icon: CalendarDays,
      themeGradient: 'from-sky-500 to-blue-600',
      badgeBg: 'bg-sky-50 text-sky-800 border-sky-200/60',
      description: 'Configure weekly off days, alternate Saturdays & weekend rules.',
      tags: ['Sunday Off', '2nd/4th Saturday', 'Staff Override'],
    },
    {
      id: 'branch',
      category: 'Shifts',
      title: 'Branch Policy Settings',
      countBadge: '3 Active Branches',
      icon: Building2,
      themeGradient: 'from-blue-600 to-cyan-600',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200/60',
      description: 'Configure branch locations, geofence radius coordinates, and Wi-Fi IP restrictions.',
      tags: ['Geofence (100m)', 'Wi-Fi Lock', 'Main & City Branches'],
    },
    {
      id: 'automation',
      category: 'Automation',
      title: 'Automation Rules',
      countBadge: `${automationRules.length} Active Triggers`,
      icon: Settings,
      themeGradient: 'from-rose-500 to-pink-600',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200/60',
      description: 'Automate late entry penalties, early out alerts & OT credits.',
      tags: ['Late Penalty', 'Early Out', 'OT Credit', 'Break Deduct'],
    },
  ];

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      activeCategory === 'All' || card.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-slate-50/70 p-4 md:p-6 font-sans text-slate-800 max-w-7xl mx-auto space-y-4">
      
      {/* COMPACT TOP HEADER BAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/attendance/dashboard')}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Attendance Configuration</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                Rule Matrix
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage shifts, leave quotas, gazetted holidays, weekly off rules, and automated triggers.
            </p>
          </div>
        </div>

        {/* SEARCH AND SYNC BUTTON */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-44 md:w-56 pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => toast.success('Configuration synchronized with biometric hardware!')}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Hardware</span>
          </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          {(['All', 'Shifts', 'Leaves', 'Automation'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {cat === 'All' ? 'All (5)' : cat}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 hidden sm:inline-block">
          Total Modules: <strong className="text-slate-800">{filteredCards.length}</strong>
        </span>
      </div>

      {/* COMPACT & SLEEK CARDS GRID (3-Column Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => {
                if (card.id === 'shift') {
                  navigate('/attendance/settings/shift-policy');
                } else if (card.id === 'branch') {
                  navigate('/attendance/settings/branch');
                } else if (card.id === 'holiday') {
                  navigate('/attendance/settings/holiday-policy');
                } else if (card.id === 'weekly') {
                  navigate('/attendance/settings/weekly-policy');
                } else {
                  setActiveModal(card.id);
                  setIsAddingNew(false);
                }
              }}
              className="group bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-lg hover:border-indigo-300/80 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden"
            >
              {/* Subtle Card Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.themeGradient} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                    <IconComponent className="w-5.5 h-5.5" strokeWidth={2} />
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs ${card.badgeBg}`}>
                    {card.countBadge}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-snug">
                    {card.description}
                  </p>
                </div>

                {/* Inline Chips */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {card.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Link Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                <span>Manage Settings</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* POLICY MANAGEMENT MODAL / DRAWER */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            
            {/* MODAL HEADER */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                  {activeModal === 'shift' && <Star className="w-5 h-5 text-amber-400" />}
                  {activeModal === 'holiday' && <Home className="w-5 h-5 text-emerald-400" />}
                  {activeModal === 'leave' && <Calendar className="w-5 h-5 text-indigo-400" />}
                  {activeModal === 'weekly' && <CalendarDays className="w-5 h-5 text-sky-400" />}
                  {activeModal === 'automation' && <Settings className="w-5 h-5 text-rose-400" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white capitalize">
                    {cards.find((c) => c.id === activeModal)?.title} Management
                  </h2>
                  <p className="text-[11px] text-slate-300">
                    {cards.find((c) => c.id === activeModal)?.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveModal(null);
                  setIsAddingNew(false);
                }}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              
              {/* TOP ACTION BAR */}
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Configured List ({
                    activeModal === 'shift' ? shiftPolicies.length :
                    activeModal === 'holiday' ? holidayPolicies.length :
                    activeModal === 'leave' ? leavePolicies.length :
                    activeModal === 'weekly' ? weeklyPolicies.length :
                    automationRules.length
                  })
                </span>
                
                {!isAddingNew && (
                  <button
                    onClick={() => setIsAddingNew(true)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Policy</span>
                  </button>
                )}
              </div>

              {/* ADD FORM */}
              {isAddingNew && (
                <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2.5">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">New Policy Configuration</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 mb-1">Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Morning Shift"
                        value={newPolicyName}
                        onChange={(e) => setNewPolicyName(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 mb-1">Parameter 1</label>
                      <input
                        type="text"
                        placeholder="Value 1"
                        value={newDetail1}
                        onChange={(e) => setNewDetail1(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 mb-1">Parameter 2</label>
                      <input
                        type="text"
                        placeholder="Value 2"
                        value={newDetail2}
                        onChange={(e) => setNewDetail2(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setIsAddingNew(false)}
                      className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200/60 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddNewItem}
                      className="px-4 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-2xs"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              {/* LIST ITEMS */}
              <div className="space-y-2.5">
                {activeModal === 'shift' &&
                  shiftPolicies.map((item) => (
                    <div key={item.id} className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{item.name}</span>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">{item.shiftType}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          <span>Start: <strong className="text-slate-800">{item.startTime}</strong></span>
                          <span>End: <strong className="text-slate-800">{item.endTime}</strong></span>
                          <span>Half-day: <strong className="text-slate-800">{item.halfDayTime}</strong></span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                {activeModal === 'holiday' &&
                  holidayPolicies.map((item) => (
                    <div key={item.id} className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{item.name}</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">{item.year}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          <span>Total Holidays: <strong className="text-slate-800">{item.totalHolidays} Days</strong></span>
                          <span>Scope: <strong className="text-slate-800">{item.appliesTo}</strong></span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                {activeModal === 'leave' &&
                  leavePolicies.map((item) => (
                    <div key={item.id} className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{item.name}</span>
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-full">{item.leaveType}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          <span>Quota: <strong className="text-slate-800">{item.allowedDays} Days/Yr</strong></span>
                          <span>Carry Forward: <strong className="text-slate-800">{item.carryForward ? 'Yes' : 'No'}</strong></span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                {activeModal === 'weekly' &&
                  weeklyPolicies.map((item) => (
                    <div key={item.id} className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{item.name}</span>
                          <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-bold rounded-full">{item.status}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          <span>Primary Off: <strong className="text-slate-800">{item.primaryOff}</strong></span>
                          <span>Secondary Off: <strong className="text-slate-800">{item.secondaryOff}</strong></span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                {activeModal === 'automation' &&
                  automationRules.map((item) => (
                    <div key={item.id} className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{item.ruleName}</span>
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full">{item.category}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          Trigger: <strong className="text-slate-800">{item.triggerCondition}</strong>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>

            </div>

            {/* MODAL FOOTER */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                <span>Auto-synced with biometric hardware.</span>
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
