import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Calendar, Bell, Send, Plus, Search, Settings, RefreshCw,
  Check, X, ChevronDown, ChevronUp, Eye, Trash2, FileText,
  Flag, MessageSquare, Globe, Zap, BarChart2, Smartphone,
  BellOff, BellRing, ToggleLeft, ToggleRight, RotateCcw, Save,
  Users, User, GraduationCap, Info, Tag, Edit3, CheckCircle,
  XCircle, AlertCircle, MoreVertical, Layers, ChevronRight,
  Clock, MapPin, Share2, Sparkles, PieChart, Inbox, HelpCircle
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Tab = 'calendar' | 'compose' | 'reminders' | 'rsvps' | 'analytics';
type EventCategory = 'academic' | 'cultural' | 'sports' | 'meeting' | 'holiday' | 'exam' | 'other';
type Audience = 'all' | 'students' | 'parents' | 'teachers' | 'staff';
type EventStatus = 'draft' | 'scheduled' | 'broadcasted' | 'cancelled';
type NotifChannel = 'push' | 'sms' | 'email' | 'all';

// ─── INTERFACES ───────────────────────────────────────────────────────────────

interface EventItem {
  id: number;
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  time: string;
  venue: string;
  audience: Audience;
  status: EventStatus;
  alertsSent: number;
  channel: NotifChannel;
  isUrgent: boolean;
  rsvpRequired: boolean;
  rsvps: { attending: number; declining: number; pending: number };
  createdBy: string;
  createdAt: string;
  attachments: string[];
  tags: string[];
}

interface ReminderRule {
  id: number;
  name: string;
  category: EventCategory | 'all';
  triggerBefore: string; // e.g., "7 days before", "1 day before", "2 hours before"
  channel: NotifChannel;
  isEnabled: boolean;
  template: string;
}

interface RSVPResponder {
  id: number;
  name: string;
  role: 'student' | 'parent' | 'teacher';
  response: 'attending' | 'declining' | 'pending';
  respondedAt?: string;
  remarks?: string;
}

interface ComposeForm {
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  time: string;
  venue: string;
  audience: Audience;
  channel: NotifChannel;
  isUrgent: boolean;
  rsvpRequired: boolean;
  attachments: string;
  tags: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_EVENTS: EventItem[] = [
  {
    id: 1,
    title: 'Annual Day Celebrations 2026',
    description: `We are proud to announce the 25th Annual Day Celebrations of Delhi Public School. The theme for this year is 'Symphony of Hope'. The event will showcase a variety of cultural dances, musical performances, and drama acts by our talented students. Chief Guest: Minister of Education.\n\nAll parents are cordially invited to attend. Dress code is formal. Please carry your physical invitation cards. Detailed seating plans have been shared with class coordinators.`,
    category: 'cultural',
    date: '2026-07-15',
    time: '04:30 PM – 08:30 PM',
    venue: 'Main Auditorium',
    audience: 'all',
    status: 'scheduled',
    alertsSent: 2450,
    channel: 'all',
    isUrgent: true,
    rsvpRequired: true,
    rsvps: { attending: 480, declining: 32, pending: 158 },
    createdBy: 'Principal',
    createdAt: '2026-06-20',
    attachments: ['annual_day_schedule.pdf', 'parking_guidelines.pdf'],
    tags: ['annual-day', 'cultural', 'celebration']
  },
  {
    id: 2,
    title: 'Parent-Teacher Meeting (PTM) – Term 1',
    description: 'The first Parent-Teacher Meeting for the academic term 2026-27 is scheduled to discuss the performance of students in the recent class tests and general classroom behavior. Report cards will be distributed.\n\nTime slots have been allocated alphabetically based on student names to avoid overcrowding. Please check your personalized SMS for your slot. Attendance is mandatory for at least one parent.',
    category: 'meeting',
    date: '2026-07-04',
    time: '08:30 AM – 01:30 PM',
    venue: 'Respective Classrooms',
    audience: 'parents',
    status: 'broadcasted',
    alertsSent: 1350,
    channel: 'all',
    isUrgent: false,
    rsvpRequired: true,
    rsvps: { attending: 890, declining: 45, pending: 415 },
    createdBy: 'Vice Principal',
    createdAt: '2026-06-22',
    attachments: ['ptm_slots_guidelines.pdf'],
    tags: ['PTM', 'meeting', 'parental-engagement']
  },
  {
    id: 3,
    title: 'Inter-School Football Tournament',
    description: 'Delhi Public School is hosting the regional under-17 boys football championship. Twelve premium schools from the NCR region will compete for the prestigious Golden Boot Trophy.\n\nCome and support our school team in the opening match against St. Xavier\'s High School. Light snacks and beverages will be available at the sports complex cafeteria.',
    category: 'sports',
    date: '2026-06-29',
    time: '09:00 AM – 04:00 PM',
    venue: 'School Sports Ground',
    audience: 'students',
    status: 'broadcasted',
    alertsSent: 920,
    channel: 'push',
    isUrgent: false,
    rsvpRequired: false,
    rsvps: { attending: 320, declining: 0, pending: 0 },
    createdBy: 'Sports Coordinator',
    createdAt: '2026-06-23',
    attachments: ['tournament_draws.pdf'],
    tags: ['football', 'sports', 'championship']
  },
  {
    id: 4,
    title: 'Science & Technology Exhibition 2026',
    description: 'Our annual Science and Technology Exhibition showcases innovative models, working prototypes, and coding projects developed by students from classes 6 to 12. This year features a dedicated Robotics and AI wing.\n\nJudges from IIT Delhi and industry experts will evaluate the projects. Parents and technology enthusiasts are welcome. Entry is free.',
    category: 'academic',
    date: '2026-07-10',
    time: '09:30 AM – 03:30 PM',
    venue: 'School Exhibition Hall',
    audience: 'all',
    status: 'scheduled',
    alertsSent: 0,
    channel: 'email',
    isUrgent: false,
    rsvpRequired: true,
    rsvps: { attending: 110, declining: 5, pending: 650 },
    createdBy: 'HOD Science',
    createdAt: '2026-06-24',
    attachments: ['exhibition_brochure.pdf', 'registration_form.docx'],
    tags: ['science-exhibition', 'technology', 'robotics']
  },
  {
    id: 5,
    title: 'Summer Vacation Orientation Session',
    description: 'A special online orientation session for class 10 and 12 students to outline the summer study schedules, board exam prep strategies, and mock test calendars.\n\nWe will also launch our digital learning companion portal during this call. Attendance will be marked.',
    category: 'academic',
    date: '2026-06-26',
    time: '11:00 AM – 12:30 PM',
    venue: 'Online (Zoom Meeting)',
    audience: 'students',
    status: 'broadcasted',
    alertsSent: 280,
    channel: 'push',
    isUrgent: true,
    rsvpRequired: true,
    rsvps: { attending: 245, declining: 15, pending: 20 },
    createdBy: 'Academic Coordinator',
    createdAt: '2026-06-18',
    attachments: ['orientation_link.pdf', 'summer_prep_planner.pdf'],
    tags: ['orientation', 'board-exams', 'zoom']
  },
  {
    id: 6,
    title: 'Independence Day Patriotic Fest',
    description: 'Draft: Celebration plan for the 80th Independence Day of India. Flag hoisting ceremony followed by patriotic songs, speech competition, and distribution of sweets.',
    category: 'holiday',
    date: '2026-08-15',
    time: '08:00 AM – 11:30 AM',
    venue: 'Front Lawns',
    audience: 'all',
    status: 'draft',
    alertsSent: 0,
    channel: 'all',
    isUrgent: false,
    rsvpRequired: false,
    rsvps: { attending: 0, declining: 0, pending: 0 },
    createdBy: 'Principal',
    createdAt: '2026-06-24',
    attachments: [],
    tags: ['independence-day', 'national-festival']
  }
];

const MOCK_RULES: ReminderRule[] = [
  { id: 1, name: 'Major Cultural Fest Alert', category: 'cultural', triggerBefore: '7 days before', channel: 'all', isEnabled: true, template: '🎉 Reminder: {title} is scheduled on {date} at {venue}. Please verify your invitation. RSVP is required!' },
  { id: 2, name: 'PTM Parent Alert', category: 'meeting', triggerBefore: '3 days before', channel: 'sms', isEnabled: true, template: '👨‍👩‍👧 PTM Alert: Direct interaction meeting is scheduled on {date}. Your slot has been SMSed. Please attend.' },
  { id: 3, name: 'Day-of Sports reminder', category: 'sports', triggerBefore: '2 hours before', channel: 'push', isEnabled: false, template: '⚽ Kick-off! {title} starts in 2 hours at {venue}. Come and cheer for our team!' },
  { id: 4, name: 'General Event Reminder', category: 'all', triggerBefore: '1 day before', channel: 'all', isEnabled: true, template: '🔔 Reminder: "{title}" is tomorrow ({date}) at {time} in {venue}. Looking forward to seeing you.' }
];

const MOCK_RESPONDERS: RSVPResponder[] = [
  { id: 1, name: 'Suresh Kumar (Father of Rohan, 10-A)', role: 'parent', response: 'attending', respondedAt: '2026-06-21 11:20 AM' },
  { id: 2, name: 'Asha Sharma (Mother of Priyanshu, 12-B)', role: 'parent', response: 'attending', respondedAt: '2026-06-22 09:40 AM' },
  { id: 3, name: 'Mr. Vivek Mishra (Physics Teacher)', role: 'teacher', response: 'attending', respondedAt: '2026-06-20 06:15 PM' },
  { id: 4, name: 'Shreya Goel (Student, 11-A)', role: 'student', response: 'declining', respondedAt: '2026-06-23 02:30 PM', remarks: 'Attending regional state level swimming camp.' },
  { id: 5, name: 'Rajesh Verma (Father of Aarav, 8-B)', role: 'parent', response: 'pending' },
  { id: 6, name: 'Anita Deshmukh (Mother of Sakshi, 9-C)', role: 'parent', response: 'attending', respondedAt: '2026-06-24 01:10 PM' },
  { id: 7, name: 'Sumit Paul (Student, 12-A)', role: 'student', response: 'declining', respondedAt: '2026-06-23 10:00 AM', remarks: 'Family trip planned earlier.' },
  { id: 8, name: 'Mrs. Sonia Sen (English Teacher)', role: 'teacher', response: 'pending' }
];

// ─── CONFIG MAPS ──────────────────────────────────────────────────────────────

const CATEGORY_CFG: Record<EventCategory, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  academic: { label: 'Academic', color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-300', emoji: '📚' },
  cultural: { label: 'Cultural & Arts', color: 'text-pink-700', bg: 'bg-pink-100', border: 'border-pink-300', emoji: '🎭' },
  sports: { label: 'Sports & Games', color: 'text-teal-700', bg: 'bg-teal-100', border: 'border-teal-300', emoji: '🏆' },
  meeting: { label: 'PTM & Conferences', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300', emoji: '👥' },
  holiday: { label: 'Festival & Holiday', color: 'text-violet-700', bg: 'bg-violet-100', border: 'border-violet-300', emoji: '🏖️' },
  exam: { label: 'Exams & Tests', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300', emoji: '📝' },
  other: { label: 'Other Activities', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300', emoji: '🌟' }
};

const STATUS_CFG: Record<EventStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'text-slate-600', bg: 'bg-slate-100', icon: <Edit3 className="w-3 h-3" /> },
  scheduled: { label: 'Scheduled', color: 'text-blue-700', bg: 'bg-blue-100', icon: <Calendar className="w-3 h-3" /> },
  broadcasted: { label: 'Broadcasted', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: <Globe className="w-3 h-3" /> },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-100', icon: <XCircle className="w-3 h-3" /> }
};

const AUDIENCE_CFG: Record<Audience, { label: string; icon: React.ReactNode }> = {
  all: { label: 'All School', icon: <Users className="w-3 h-3" /> },
  students: { label: 'Students Only', icon: <GraduationCap className="w-3 h-3" /> },
  parents: { label: 'Parents Only', icon: <User className="w-3 h-3" /> },
  teachers: { label: 'Teachers Only', icon: <FileText className="w-3 h-3" /> },
  staff: { label: 'Non-Teaching Staff', icon: <Info className="w-3 h-3" /> }
};

const CHANNEL_CFG: Record<NotifChannel, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  push: { label: 'Push Notification', color: 'text-violet-700', bg: 'bg-violet-100', icon: <Smartphone className="w-3 h-3" /> },
  sms: { label: 'SMS Gateway', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: <MessageSquare className="w-3 h-3" /> },
  email: { label: 'Email Gateway', color: 'text-blue-700', bg: 'bg-blue-100', icon: <FileText className="w-3 h-3" /> },
  all: { label: 'All Channels', color: 'text-slate-700', bg: 'bg-slate-100', icon: <Globe className="w-3 h-3" /> }
};

const emptyForm = (): ComposeForm => ({
  title: '',
  description: '',
  category: 'academic',
  date: '',
  time: '',
  venue: '',
  audience: 'all',
  channel: 'all',
  isUrgent: false,
  rsvpRequired: false,
  attachments: '',
  tags: ''
});

const MiniBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
  <div className="w-full bg-slate-100 rounded-full h-1.5">
    <div className={`h-1.5 rounded-full ${color} transition-all duration-500`}
      style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }} />
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const EventCalendarNotifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const [events, setEvents] = useState<EventItem[]>(MOCK_EVENTS);
  const [rules, setRules] = useState<ReminderRule[]>(MOCK_RULES);
  const [responders, setResponders] = useState<RSVPResponder[]>(MOCK_RESPONDERS);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(MOCK_EVENTS[0]);
  const [form, setForm] = useState<ComposeForm>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [broadcastingId, setBroadcastingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<EventCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<EventStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [newRuleForm, setNewRuleForm] = useState({ name: '', category: 'all' as EventCategory | 'all', triggerBefore: '1 day before', channel: 'push' as NotifChannel, template: '' });
  const [showAddRule, setShowAddRule] = useState(false);

  // ── Derived Stats ──
  const scheduledCount = events.filter(e => e.status === 'scheduled').length;
  const broadcastedCount = events.filter(e => e.status === 'broadcasted').length;
  const totalAlertsSent = events.reduce((acc, e) => acc + e.alertsSent, 0);
  const rsvpRequiredEvents = events.filter(e => e.rsvpRequired);
  const averageRsvpRate = rsvpRequiredEvents.length > 0
    ? Math.round(rsvpRequiredEvents.reduce((acc, e) => {
        const total = e.rsvps.attending + e.rsvps.declining + e.rsvps.pending;
        return acc + (total > 0 ? (e.rsvps.attending / total) * 100 : 0);
      }, 0) / rsvpRequiredEvents.length)
    : 0;

  // Filtered Events
  const filteredEvents = events.filter(e => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !e.venue.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !e.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Handlers
  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Event title is required'); return; }
    if (!form.description.trim()) { toast.error('Event description is required'); return; }
    if (!form.date) { toast.error('Event date is required'); return; }
    if (!form.time.trim()) { toast.error('Event time is required'); return; }
    if (!form.venue.trim()) { toast.error('Event venue is required'); return; }

    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setSubmitting(false);

    const newEvent: EventItem = {
      id: Date.now(),
      title: form.title,
      description: form.description,
      category: form.category,
      date: form.date,
      time: form.time,
      venue: form.venue,
      audience: form.audience,
      status: 'scheduled',
      alertsSent: 0,
      channel: form.channel,
      isUrgent: form.isUrgent,
      rsvpRequired: form.rsvpRequired,
      rsvps: form.rsvpRequired ? { attending: 0, declining: 0, pending: 450 } : { attending: 0, declining: 0, pending: 0 },
      createdBy: 'You',
      createdAt: new Date().toISOString().split('T')[0],
      attachments: form.attachments ? form.attachments.split(',').map(s => s.trim()).filter(Boolean) : [],
      tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : []
    };

    setEvents(prev => [newEvent, ...prev]);
    setSelectedEvent(newEvent);
    toast.success('🎉 Event scheduled successfully!');
    setForm(emptyForm());
    setActiveTab('calendar');
  };

  const triggerBroadcast = async (event: EventItem) => {
    setBroadcastingId(event.id);
    await new Promise(r => setTimeout(r, 2000));
    setBroadcastingId(null);

    const recipientsCount = event.audience === 'all' ? 1500 : 350;
    setEvents(prev => prev.map(e => e.id === event.id
      ? { ...e, status: 'broadcasted', alertsSent: e.alertsSent + recipientsCount }
      : e));

    if (selectedEvent?.id === event.id) {
      setSelectedEvent(prev => prev ? { ...prev, status: 'broadcasted', alertsSent: prev.alertsSent + recipientsCount } : null);
    }

    toast.success(`📢 Broadcast alerts sent successfully via ${CHANNEL_CFG[event.channel].label}!`);
  };

  const cancelEvent = (id: number) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'cancelled' } : e));
    if (selectedEvent?.id === id) {
      setSelectedEvent(prev => prev ? { ...prev, status: 'cancelled' } : null);
    }
    toast.error('Event cancelled successfully. Cancellation notices sent.');
  };

  const toggleRule = (id: number) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
    const rule = rules.find(r => r.id === id);
    toast.success(`Rule "${rule?.name}" ${rule?.isEnabled ? 'disabled' : 'enabled'}`);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleForm.name.trim()) { toast.error('Rule name is required'); return; }
    if (!newRuleForm.template.trim()) { toast.error('Rule template is required'); return; }

    const newRule: ReminderRule = {
      id: Date.now(),
      name: newRuleForm.name,
      category: newRuleForm.category,
      triggerBefore: newRuleForm.triggerBefore,
      channel: newRuleForm.channel,
      isEnabled: true,
      template: newRuleForm.template
    };

    setRules(prev => [...prev, newRule]);
    toast.success('📅 Reminder rule added successfully!');
    setNewRuleForm({ name: '', category: 'all', triggerBefore: '1 day before', channel: 'push', template: '' });
    setShowAddRule(false);
  };

  const submitRsvpResponse = (name: string, role: 'student' | 'parent' | 'teacher', response: 'attending' | 'declining') => {
    const newResponder: RSVPResponder = {
      id: Date.now(),
      name,
      role,
      response,
      respondedAt: new Date().toLocaleString('en-IN')
    };

    setResponders(prev => [newResponder, ...prev]);

    // Update selected event RSVP counts
    if (selectedEvent) {
      const updatedEvents = events.map(e => {
        if (e.id === selectedEvent.id) {
          const updatedRsvps = { ...e.rsvps };
          if (response === 'attending') {
            updatedRsvps.attending += 1;
          } else {
            updatedRsvps.declining += 1;
          }
          if (updatedRsvps.pending > 0) updatedRsvps.pending -= 1;
          return { ...e, rsvps: updatedRsvps };
        }
        return e;
      });
      setEvents(updatedEvents);
      setSelectedEvent(prev => prev ? {
        ...prev,
        rsvps: {
          ...prev.rsvps,
          attending: prev.rsvps.attending + (response === 'attending' ? 1 : 0),
          declining: prev.rsvps.declining + (response === 'declining' ? 1 : 0),
          pending: Math.max(0, prev.rsvps.pending - 1)
        }
      } : null);
    }
    toast.success('Thank you! Your RSVP response has been logged.');
  };

  return (
    <div className="h-[calc(100vh-120px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/10 rounded-lg">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-[11px] tracking-tight leading-tight">Event Calendar & Alerts</h1>
            <p className="text-[9px] text-pink-100 font-medium">Coordinate · Broadcast Alerts · Track RSVPs · Auto Reminders</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-bold">{scheduledCount} scheduled</span>
          </div>
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <Bell className="w-3 h-3 text-pink-200" />
            <span className="text-[9px] font-bold text-pink-100">{totalAlertsSent} broadcasted</span>
          </div>
          <button onClick={() => setActiveTab('compose')}
            className="flex items-center gap-1.5 bg-white text-rose-700 hover:bg-pink-50 px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Schedule Event
          </button>
        </div>
      </div>

      {/* ── STAT PILLS ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-pink-50/40 border-b border-pink-100 flex-shrink-0 overflow-x-auto">
        {[
          { label: 'Scheduled Events', val: scheduledCount, icon: <Calendar className="w-3 h-3" />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Broadcast Alerts', val: broadcastedCount, icon: <Globe className="w-3 h-3" />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Avg RSVP Rate', val: `${averageRsvpRate}%`, icon: <CheckCircle className="w-3 h-3" />, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200' },
          { label: 'Notifications Sent', val: totalAlertsSent.toLocaleString(), icon: <Send className="w-3 h-3" />, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
          { label: 'Active Rules', val: rules.filter(r => r.isEnabled).length, icon: <Settings className="w-3 h-3" />, color: 'text-slate-600', bg: 'bg-white', border: 'border-slate-200' },
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-1.5 ${s.bg} border ${s.border} px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0`}>
            <span className={s.color}>{s.icon}</span>
            <span className="text-[10px] font-extrabold text-slate-700">{s.val}</span>
            <span className="text-[9px] text-slate-400 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="flex border-b border-slate-200 bg-white overflow-x-auto flex-shrink-0">
        {([
          { key: 'calendar',  label: 'Event Board & Calendar', icon: <Calendar className="w-3.5 h-3.5" /> },
          { key: 'compose',   label: 'Schedule New Event',      icon: <Plus className="w-3.5 h-3.5" /> },
          { key: 'reminders', label: 'Reminder Dispatcher',    icon: <BellRing className="w-3.5 h-3.5" /> },
          { key: 'rsvps',     label: 'RSVP Tracking',           icon: <Users className="w-3.5 h-3.5" />, badge: responders.length },
          { key: 'analytics', label: 'Engagement Insights',     icon: <BarChart2 className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as Tab)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition ${activeTab === t.key ? 'text-rose-600 border-b-2 border-rose-600 bg-rose-50/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {t.icon} {t.label}
            {'badge' in t && (t as any).badge > 0 && (
              <span className="bg-rose-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full">{(t as any).badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═════════ EVENT BOARD ═════════ */}
        {activeTab === 'calendar' && (
          <div className="flex h-full" style={{ minHeight: '100%' }}>

            {/* Left: Event List */}
            <div className="w-80 flex-shrink-0 border-r border-slate-200 overflow-y-auto flex flex-col">
              <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 space-y-2 z-10">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search events by title, venue…" value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-rose-300" />
                  </div>
                  <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                    <button onClick={() => setViewMode('list')} className={`p-1.5 transition ${viewMode === 'list' ? 'bg-slate-100 text-slate-700' : 'bg-white text-slate-400 hover:text-slate-600'}`}>
                      <Layers className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 transition ${viewMode === 'grid' ? 'bg-slate-100 text-slate-700' : 'bg-white text-slate-400 hover:text-slate-600'}`}>
                      <BarChart2 className="w-3.5 h-3.5 rotate-90" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-1.5 overflow-x-auto">
                  <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as EventCategory | 'all')}
                    className="flex-1 px-2 py-1 border border-slate-200 rounded-lg text-[9px] font-bold bg-white outline-none">
                    <option value="all">All Categories</option>
                    {Object.entries(CATEGORY_CFG).map(([k, v]) => (
                      <option key={k} value={k}>{v.emoji} {v.label}</option>
                    ))}
                  </select>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as EventStatus | 'all')}
                    className="flex-1 px-2 py-1 border border-slate-200 rounded-lg text-[9px] font-bold bg-white outline-none">
                    <option value="all">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="broadcasted">Broadcasted</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 divide-y divide-slate-100">
                {filteredEvents.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Calendar className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-[10px]">No events scheduled</p>
                  </div>
                )}
                {filteredEvents.map(event => {
                  const cat = CATEGORY_CFG[event.category];
                  const st = STATUS_CFG[event.status];
                  const isSelected = selectedEvent?.id === event.id;
                  const dateObj = new Date(event.date);
                  const dayStr = dateObj.getDate();
                  const monthStr = dateObj.toLocaleString('default', { month: 'short' });
                  return (
                    <div key={event.id} onClick={() => setSelectedEvent(event)}
                      className={`px-3 py-2.5 cursor-pointer hover:bg-pink-50/25 transition ${isSelected ? 'bg-pink-50/50 border-l-2 border-rose-500' : ''}`}>
                      <div className="flex gap-2.5">
                        {/* Custom Calendar Icon Block */}
                        <div className="w-10 h-10 border border-slate-200 rounded-lg flex flex-col items-center overflow-hidden flex-shrink-0 bg-white">
                          <div className="w-full bg-rose-500 text-white text-[7px] font-bold text-center py-0.5 uppercase tracking-wider">{monthStr}</div>
                          <div className="flex-1 flex items-center justify-center font-extrabold text-[12px] text-slate-700 leading-none">{dayStr}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            {event.isUrgent && <Flag className="w-2.5 h-2.5 text-red-500 flex-shrink-0 fill-red-500" />}
                            <p className="text-[10px] font-bold text-slate-800 truncate">{event.title}</p>
                          </div>
                          <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>{cat.emoji} {cat.label}</span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${st.bg} ${st.color}`}>
                              {st.icon} {st.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[8px] text-slate-400">
                            <span className="truncate max-w-[100px] flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5 flex-shrink-0" /> {event.venue}</span>
                            {event.alertsSent > 0 && <span className="text-rose-500 font-extrabold">🔔 {event.alertsSent.toLocaleString()} sent</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Detail Page */}
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
              {!selectedEvent ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Calendar className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-[11px] font-medium">Select an event to view details</p>
                </div>
              ) : (() => {
                const e = selectedEvent;
                const cat = CATEGORY_CFG[e.category];
                const st = STATUS_CFG[e.status];
                const aud = AUDIENCE_CFG[e.audience];
                const ch = CHANNEL_CFG[e.channel];
                const totalRsvp = e.rsvps.attending + e.rsvps.declining + e.rsvps.pending;
                const rsvpRate = totalRsvp > 0 ? Math.round((e.rsvps.attending / totalRsvp) * 100) : 0;
                return (
                  <div className="space-y-4 max-w-2xl">
                    {/* Action Panel */}
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toast.success('Event link shared to social feed')}
                          className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer text-slate-500">
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toast.success('Exporting calendar invite (iCal)...')}
                          className="flex items-center gap-1 text-[9px] font-bold border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer text-slate-600">
                          <Plus className="w-3 h-3" /> iCal/Google
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        {e.status === 'scheduled' && (
                          <button onClick={() => triggerBroadcast(e)} disabled={broadcastingId === e.id}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-[9px] font-bold px-3 py-2 rounded-lg cursor-pointer shadow-sm disabled:opacity-50">
                            {broadcastingId === e.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Send Broadcast Alert
                          </button>
                        )}
                        {e.status === 'broadcasted' && (
                          <button onClick={() => triggerBroadcast(e)} disabled={broadcastingId === e.id}
                            className="flex items-center gap-1.5 border border-pink-200 text-rose-600 hover:bg-pink-50 text-[9px] font-bold px-3 py-2 rounded-lg cursor-pointer">
                            {broadcastingId === e.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            Re-broadcast Alert
                          </button>
                        )}
                        {e.status !== 'cancelled' && e.status !== 'draft' && (
                          <button onClick={() => cancelEvent(e.id)}
                            className="text-[9px] font-bold border border-red-200 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg cursor-pointer">
                            Cancel Event
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Event Sheet Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                      {/* Header banner */}
                      <div className="bg-gradient-to-r from-slate-950 via-slate-850 to-slate-950 px-6 py-5 text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>{cat.label}</span>
                          <span className={`text-[8px] font-extrabold px-2 py-0.5 bg-white/10 text-white border border-white/20 rounded-full flex items-center gap-0.5`}>
                            {st.icon} {st.label}
                          </span>
                          {e.isUrgent && (
                            <span className="text-[8px] font-extrabold px-2 py-0.5 bg-red-500/20 text-red-200 border border-red-500/30 rounded-full flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> High Priority
                            </span>
                          )}
                        </div>
                        <h2 className="text-[14px] font-extrabold tracking-tight">{e.title}</h2>
                      </div>

                      {/* Meta Columns */}
                      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
                        <div className="p-3 text-center">
                          <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-slate-400" />
                          <p className="text-[8px] text-slate-400 font-medium">Date & Time</p>
                          <p className="text-[9px] font-bold text-slate-700 mt-0.5">{e.date}</p>
                          <p className="text-[8px] text-slate-500">{e.time}</p>
                        </div>
                        <div className="p-3 text-center">
                          <MapPin className="w-3.5 h-3.5 mx-auto mb-1 text-slate-400" />
                          <p className="text-[8px] text-slate-400 font-medium">Venue</p>
                          <p className="text-[9px] font-bold text-slate-700 mt-0.5 truncate">{e.venue}</p>
                        </div>
                        <div className="p-3 text-center">
                          <Users className="w-3.5 h-3.5 mx-auto mb-1 text-slate-400" />
                          <p className="text-[8px] text-slate-400 font-medium">Target Audience</p>
                          <p className="text-[9px] font-bold text-slate-700 mt-0.5 flex items-center justify-center gap-1">{aud.icon} {aud.label}</p>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="p-5 space-y-4">
                        <div>
                          <h4 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Event Details</h4>
                          <p className="text-[10px] text-slate-700 leading-relaxed whitespace-pre-line">{e.description}</p>
                        </div>

                        {/* Attachments */}
                        {e.attachments.length > 0 && (
                          <div>
                            <h4 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Circular Reference & Attachments</h4>
                            <div className="flex flex-wrap gap-2">
                              {e.attachments.map((file, idx) => (
                                <button key={idx} onClick={() => toast.success(`Downloading ${file}`)}
                                  className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-[9px] font-bold text-slate-600 transition cursor-pointer">
                                  <FileText className="w-3 h-3 text-rose-500" /> {file}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {e.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 border-t border-slate-100 pt-3">
                            {e.tags.map((tag, idx) => (
                              <span key={idx} className="flex items-center gap-0.5 bg-slate-100 text-slate-600 text-[8px] font-bold px-2 py-0.5 rounded-full">
                                <Tag className="w-2 h-2" /> {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RSVP section (If required) */}
                    {e.rsvpRequired && (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-[11px] font-extrabold text-slate-800">RSVP Status & Feedback</h3>
                            <p className="text-[9px] text-slate-400 font-medium">Tracking confirmations from invited recipients</p>
                          </div>
                          <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">{rsvpRate}% Attending</span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-emerald-50/50 border border-emerald-100 p-2 rounded-lg text-center">
                            <span className="text-[12px] font-extrabold text-emerald-700">{e.rsvps.attending}</span>
                            <p className="text-[8px] text-slate-400">Attending</p>
                          </div>
                          <div className="bg-red-50/50 border border-red-100 p-2 rounded-lg text-center">
                            <span className="text-[12px] font-extrabold text-red-700">{e.rsvps.declining}</span>
                            <p className="text-[8px] text-slate-400">Declining</p>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-center">
                            <span className="text-[12px] font-extrabold text-slate-600">{e.rsvps.pending}</span>
                            <p className="text-[8px] text-slate-400">No Response</p>
                          </div>
                        </div>

                        {/* Interactive RSVP Simulation (For testing/demo) */}
                        <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                          <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Simulate RSVP Response</p>
                          <div className="flex items-center gap-2">
                            <button onClick={() => submitRsvpResponse('Aman Verma (Parent, 6-A)', 'parent', 'attending')}
                              className="flex-1 flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 text-[9px] font-bold py-1.5 rounded-lg transition cursor-pointer">
                              <CheckCircle className="w-3.5 h-3.5" /> Accept RSVP
                            </button>
                            <button onClick={() => submitRsvpResponse('Sanjay Gupta (Parent, 10-C)', 'parent', 'declining')}
                              className="flex-1 flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 text-[9px] font-bold py-1.5 rounded-lg transition cursor-pointer">
                              <XCircle className="w-3.5 h-3.5" /> Decline RSVP
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ═════════ SCHEDULE EVENT ═════════ */}
        {activeTab === 'compose' && (
          <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-4 text-white">
                <h3 className="text-[12px] font-extrabold">Schedule & Publish New Event</h3>
                <p className="text-[9px] text-pink-100">Plan school event and configure immediate alerts</p>
              </div>

              <form onSubmit={handleCompose} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600">Event Title <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="e.g. Annual Science Fest" value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-rose-300 bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600">Category <span className="text-red-500">*</span></label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as EventCategory })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-rose-300 bg-white">
                      {Object.entries(CATEGORY_CFG).map(([k, v]) => (
                        <option key={k} value={k}>{v.emoji} {v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-600">Event Description <span className="text-red-500">*</span></label>
                  <textarea placeholder="Provide complete event rules, timelines, instructions, dress codes etc..." rows={4} value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-rose-300 bg-white" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600">Date <span className="text-red-500">*</span></label>
                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-rose-300 bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600">Time <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="e.g. 09:00 AM – 02:00 PM" value={form.time}
                      onChange={e => setForm({ ...form, time: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-rose-300 bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600">Venue <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="e.g. Auditorium / ground" value={form.venue}
                      onChange={e => setForm({ ...form, venue: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-rose-300 bg-white" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600">Target Audience</label>
                    <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value as Audience })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-rose-300 bg-white">
                      <option value="all">All (Parents + Students)</option>
                      <option value="students">Students Only</option>
                      <option value="parents">Parents Only</option>
                      <option value="teachers">Teachers Only</option>
                      <option value="staff">Staff Only</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600">Primary Channel</label>
                    <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value as NotifChannel })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-rose-300 bg-white">
                      <option value="all">All Channels (Push + SMS)</option>
                      <option value="push">Mobile Push Notification</option>
                      <option value="sms">SMS Gateway Only</option>
                      <option value="email">Email System Only</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4 justify-around mt-4">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="checkbox" checked={form.isUrgent} onChange={e => setForm({ ...form, isUrgent: e.target.checked })}
                        className="rounded border-slate-300 text-rose-500 focus:ring-rose-300" />
                      <span className="text-[9px] font-bold text-slate-600 flex items-center gap-0.5"><Flag className="w-3 h-3 text-red-500" /> Urgent</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="checkbox" checked={form.rsvpRequired} onChange={e => setForm({ ...form, rsvpRequired: e.target.checked })}
                        className="rounded border-slate-300 text-rose-500 focus:ring-rose-300" />
                      <span className="text-[9px] font-bold text-slate-600">RSVP Required</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600">Attachments (comma-separated)</label>
                    <input type="text" placeholder="schedule.pdf, invite_card.pdf" value={form.attachments}
                      onChange={e => setForm({ ...form, attachments: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-rose-300 bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600">Search Tags (comma-separated)</label>
                    <input type="text" placeholder="annual, cultural, fun" value={form.tags}
                      onChange={e => setForm({ ...form, tags: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-rose-300 bg-white" />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-end gap-2.5">
                  <button type="button" onClick={() => setForm(emptyForm())}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-500 hover:bg-slate-50 cursor-pointer transition">
                    Reset Form
                  </button>
                  <button type="submit" disabled={submitting}
                    className="px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-[9px] font-extrabold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                    {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Publish & Announce Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═════════ REMINDERS ═════════ */}
        {activeTab === 'reminders' && (
          <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-[12px] font-extrabold">Automated Event Reminders</h3>
                  <p className="text-[9px] text-violet-100">Set scheduler thresholds to nudge recipients before an event starts</p>
                </div>
                <button onClick={() => setShowAddRule(!showAddRule)}
                  className="flex items-center gap-1 bg-white text-indigo-700 px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold cursor-pointer hover:bg-violet-50 transition">
                  {showAddRule ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />} Add Rule
                </button>
              </div>

              {/* Add Rule Panel */}
              {showAddRule && (
                <form onSubmit={handleAddRule} className="p-4 border-b border-slate-200 bg-slate-50/60 space-y-3">
                  <h4 className="text-[10px] font-extrabold text-slate-700">Create New Reminder Rule</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-500">Rule Identifier</label>
                      <input type="text" placeholder="e.g. Science Day Quick Alert" value={newRuleForm.name}
                        onChange={e => setNewRuleForm({ ...newRuleForm, name: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] bg-white outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-500">Target Category</label>
                      <select value={newRuleForm.category} onChange={e => setNewRuleForm({ ...newRuleForm, category: e.target.value as EventCategory | 'all' })}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] bg-white outline-none">
                        <option value="all">All Events</option>
                        {Object.entries(CATEGORY_CFG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-500">Trigger Threshold</label>
                      <select value={newRuleForm.triggerBefore} onChange={e => setNewRuleForm({ ...newRuleForm, triggerBefore: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] bg-white outline-none">
                        <option value="7 days before">7 Days Before</option>
                        <option value="3 days before">3 Days Before</option>
                        <option value="1 day before">1 Day Before</option>
                        <option value="2 hours before">2 Hours Before</option>
                        <option value="1 hour before">1 Hour Before</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1 col-span-1">
                      <label className="text-[8px] font-bold text-slate-500">Dispatch Channel</label>
                      <select value={newRuleForm.channel} onChange={e => setNewRuleForm({ ...newRuleForm, channel: e.target.value as NotifChannel })}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] bg-white outline-none">
                        <option value="all">All Channels</option>
                        <option value="push">Push Notification</option>
                        <option value="sms">SMS Gateway</option>
                        <option value="email">Email</option>
                      </select>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <label className="text-[8px] font-bold text-slate-500">Message Template (Tokens: {'{title}, {date}, {time}, {venue}'})</label>
                      <input type="text" placeholder="e.g. Don't forget: {title} is tomorrow at {venue}." value={newRuleForm.template}
                        onChange={e => setNewRuleForm({ ...newRuleForm, template: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] bg-white outline-none" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowAddRule(false)} className="px-3 py-1 border border-slate-200 text-slate-500 rounded-lg text-[9px] font-bold">Cancel</button>
                    <button type="submit" className="px-4 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-bold">Save Rule</button>
                  </div>
                </form>
              )}

              {/* Rules List */}
              <div className="divide-y divide-slate-200">
                {rules.map(rule => {
                  const ch = CHANNEL_CFG[rule.channel];
                  return (
                    <div key={rule.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="space-y-1 flex-1 pr-6">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold text-slate-800">{rule.name}</span>
                          <span className="text-[7.5px] font-bold px-1.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-full">{rule.triggerBefore}</span>
                          {rule.category !== 'all' && (
                            <span className={`text-[7.5px] font-bold px-1.5 rounded-full ${CATEGORY_CFG[rule.category as EventCategory].bg} ${CATEGORY_CFG[rule.category as EventCategory].color}`}>
                              {CATEGORY_CFG[rule.category as EventCategory].label}
                            </span>
                          )}
                        </div>
                        <p className="text-[8.5px] font-mono text-slate-500 mt-0.5 italic">"{rule.template}"</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[7.5px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${ch.bg} ${ch.color}`}>
                            {ch.icon} {ch.label}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => toggleRule(rule.id)} className="cursor-pointer">
                        {rule.isEnabled ? (
                          <span className="flex items-center text-emerald-600"><ToggleRight className="w-8 h-8" /></span>
                        ) : (
                          <span className="flex items-center text-slate-400"><ToggleLeft className="w-8 h-8" /></span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═════════ RSVP TRACKING ═════════ */}
        {activeTab === 'rsvps' && (
          <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-4 text-white">
                <h3 className="text-[12px] font-extrabold">Active RSVP Registrations</h3>
                <p className="text-[9px] text-teal-100 font-medium">Real-time confirmation records submitted by parents & staff</p>
              </div>

              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Log of Responses ({responders.length})</span>
                <button onClick={() => { setResponders(MOCK_RESPONDERS); toast.success('Cleared simulated test responses'); }}
                  className="text-[8px] font-extrabold text-teal-600 hover:underline">
                  Reset Logs
                </button>
              </div>

              <div className="divide-y divide-slate-150">
                {responders.map(r => (
                  <div key={r.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold border ${
                        r.role === 'parent' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                        r.role === 'teacher' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                        'bg-violet-50 border-violet-200 text-violet-700'
                      }`}>
                        {r.role.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-800">{r.name}</p>
                        <p className="text-[8px] text-slate-400">Logged {r.respondedAt || '—'}</p>
                        {r.remarks && <p className="text-[8.5px] text-slate-500 italic mt-0.5">"{r.remarks}"</p>}
                      </div>
                    </div>

                    <div>
                      {r.response === 'attending' ? (
                        <span className="flex items-center gap-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold px-2 py-0.5 rounded-full">
                          <Check className="w-2.5 h-2.5" /> Attending
                        </span>
                      ) : r.response === 'declining' ? (
                        <span className="flex items-center gap-0.5 bg-red-50 border border-red-200 text-red-700 text-[8px] font-bold px-2 py-0.5 rounded-full">
                          <X className="w-2.5 h-2.5" /> Declined
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 bg-slate-50 border border-slate-200 text-slate-500 text-[8px] font-bold px-2 py-0.5 rounded-full">
                          <HelpCircle className="w-2.5 h-2.5" /> Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═════════ ANALYTICS ═════════ */}
        {activeTab === 'analytics' && (
          <div className="max-w-3xl mx-auto p-6 space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Average RSVP Rate</h4>
                <div className="text-2xl font-extrabold text-pink-600 mt-1">{averageRsvpRate}%</div>
                <p className="text-[8px] text-slate-500 mt-0.5">Calculated across mandatory RSVP events</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Alert Delivery Success</h4>
                <div className="text-2xl font-extrabold text-emerald-600 mt-1">98.4%</div>
                <p className="text-[8px] text-slate-500 mt-0.5">Successful SMS/Push notification dispatches</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Average View Rate</h4>
                <div className="text-2xl font-extrabold text-blue-600 mt-1">87.2%</div>
                <p className="text-[8px] text-slate-500 mt-0.5">Of parents reading the event alerts within 24h</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-[11px] font-extrabold text-slate-800">Event Engagement History</h3>
              <div className="space-y-3">
                {[
                  { name: 'Annual Day Celebrations 2026', total: 670, yes: 480, rate: '72%', color: 'bg-pink-500' },
                  { name: 'Parent-Teacher Meeting (PTM)', total: 1350, yes: 890, rate: '66%', color: 'bg-amber-500' },
                  { name: 'Science & Technology Exhibition', total: 765, yes: 110, rate: '14% (Ongoing)', color: 'bg-blue-500' },
                  { name: 'Summer Vacation Orientation', total: 280, yes: 245, rate: '88%', color: 'bg-teal-500' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-700">
                      <span>{item.name}</span>
                      <span>{item.yes} / {item.total} ({item.rate})</span>
                    </div>
                    <MiniBar value={item.yes} max={item.total} color={item.color} />
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions card */}
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100 rounded-xl p-4 flex gap-3">
              <div className="p-2 bg-pink-100 rounded-lg text-rose-600 h-fit">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[10px] font-extrabold text-rose-900">Optimization Recommendation</h4>
                <p className="text-[9px] text-rose-700 leading-relaxed mt-0.5">
                  Push notifications show 4x higher RSVP response speed compared to Email alerts. We recommend activating the automated "1 day before" Push reminder rule for all scheduled Cultural and PTM events to maximize parent participation rates.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default EventCalendarNotifications;
