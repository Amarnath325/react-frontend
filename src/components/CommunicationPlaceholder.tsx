import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  MessageSquare, Megaphone, Users, Smartphone, Bell, BookOpen,
  FileText, Activity, Clock, Clipboard, Calendar, DollarSign,
  HelpCircle, Briefcase, Grid,
  TrendingUp, History, Send, Search, Check, CheckCheck, X,
  Plus, ShieldAlert, UserCheck
} from 'lucide-react';

// Interfaces for our state variables
interface Message {
  id: number;
  sender: 'me' | 'them';
  text: string;
  time: string;
  status: 'sent' | 'delivered' | 'read';
}

interface Notice {
  id: number;
  title: string;
  content: string;
  category: 'School-wide' | 'Class 10' | 'Class 12' | 'Staff';
  date: string;
  pinned: boolean;
  attachment?: string;
}

interface MeetingRequest {
  id: number;
  parentName: string;
  studentName: string;
  date: string;
  time: string;
  topic: string;
  status: 'Pending' | 'Approved' | 'Declined';
}

interface GrievanceTicket {
  id: number;
  submittedBy: string;
  role: 'Student' | 'Parent' | 'Staff';
  subject: string;
  category: 'Infrastructure' | 'Academics' | 'Discipline' | 'Hostel';
  status: 'Open' | 'In Progress' | 'Resolved';
  date: string;
  priority: 'Low' | 'Medium' | 'High';
}

interface ForumThread {
  id: number;
  title: string;
  author: string;
  category: string;
  replies: number;
  views: number;
  upvotes: number;
  time: string;
  hasVoted?: boolean;
}

const CommunicationPlaceholder: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  // --- SUBMODULE 1: Direct Messaging Chat Simulator ---
  const chatContacts = [
    { id: 1, name: 'Vikram Singh (Physics Teacher)', role: 'Staff', active: true, avatar: 'VS' },
    { id: 2, name: 'Anjali Sharma (Class 10-A Student)', role: 'Student', active: false, avatar: 'AS' },
    { id: 3, name: 'Rakesh Verma (Parent of Amit)', role: 'Parent', active: false, avatar: 'RV' },
    { id: 4, name: 'Sanjay Dutt (Librarian)', role: 'Staff', active: false, avatar: 'SD' }
  ];
  const [selectedContact, setSelectedContact] = useState(chatContacts[0]);
  const [chatMessages, setChatMessages] = useState<Record<number, Message[]>>({
    1: [
      { id: 1, sender: 'them', text: 'Good evening sir, did you check the exam blueprint for next week?', time: '06:30 PM', status: 'read' },
      { id: 2, sender: 'me', text: 'Yes Vikram, it looks perfect. Please share it with the students.', time: '06:32 PM', status: 'read' },
      { id: 3, sender: 'them', text: 'Great, I will upload it as a class notice right away.', time: '06:35 PM', status: 'read' }
    ],
    2: [
      { id: 1, sender: 'them', text: 'Sir, I missed the biology homework topic. Can you please specify it?', time: '04:15 PM', status: 'read' },
      { id: 2, sender: 'me', text: 'Check the announcements section, it is pinned under Biology assignment.', time: '04:20 PM', status: 'read' }
    ],
    3: [
      { id: 1, sender: 'them', text: 'Respected Warden, I want to request a PTM meeting regarding Amit\'s physics score.', time: 'Yesterday', status: 'read' }
    ]
  });
  const [newMsgText, setNewMsgText] = useState('');

  const sendChatMessage = () => {
    if (!newMsgText.trim()) return;
    const newMsg: Message = {
      id: Date.now(),
      sender: 'me',
      text: newMsgText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };
    
    // Add message
    setChatMessages(prev => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), newMsg]
    }));
    setNewMsgText('');

    // Trigger mock double check & read
    setTimeout(() => {
      setChatMessages(prev => {
        const msgs = prev[selectedContact.id] || [];
        return {
          ...prev,
          [selectedContact.id]: msgs.map(m => m.id === newMsg.id ? { ...m, status: 'delivered' } : m)
        };
      });
    }, 1000);

    // Mock teacher reply
    setTimeout(() => {
      setChatMessages(prev => {
        const msgs = prev[selectedContact.id] || [];
        return {
          ...prev,
          [selectedContact.id]: [
            ...msgs.map(m => m.id === newMsg.id ? { ...m, status: 'read' } : m),
            {
              id: Date.now() + 1,
              sender: 'them',
              text: `Understood, thanks for the quick reply. I will check on this and get back to you!`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'read'
            }
          ]
        };
      });
    }, 2500);
  };

  // --- SUBMODULE 2: Notices State ---
  const [notices, setNotices] = useState<Notice[]>([
    { id: 1, title: 'Annual Sports Day 2026 Schedule', content: 'School annual sports day is scheduled for Dec 15th. Registration for track events is open now.', category: 'School-wide', date: '2026-11-20', pinned: true, attachment: 'sports_schedule.pdf' },
    { id: 2, title: 'Term 1 Exam Syllabus Circular', content: 'Finalized exam syllabus for Class 10 & 12 is uploaded. Download the attachment.', category: 'School-wide', date: '2026-11-18', pinned: true, attachment: 'syllabus_2026.pdf' },
    { id: 3, title: 'Staff Meeting on Curriculum Sync', content: 'All teachers are requested to attend the sync meeting tomorrow at 03:00 PM in the Conference Hall.', category: 'Staff', date: '2026-11-22', pinned: false }
  ]);
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeCat, setNewNoticeCat] = useState<'School-wide' | 'Class 10' | 'Class 12' | 'Staff'>('School-wide');
  const [newNoticePin, setNewNoticePin] = useState(false);
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);

  const createNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) {
      toast.error('Title and content are required');
      return;
    }
    const notice: Notice = {
      id: Date.now(),
      title: newNoticeTitle,
      content: newNoticeContent,
      category: newNoticeCat,
      date: new Date().toISOString().split('T')[0],
      pinned: newNoticePin
    };
    setNotices([notice, ...notices]);
    setNewNoticeTitle('');
    setNewNoticeContent('');
    setNoticeModalOpen(false);
    toast.success('Notice published successfully!');
  };

  // --- SUBMODULE 3: Parent-Teacher Meeting ---
  const [meetings, setMeetings] = useState<MeetingRequest[]>([
    { id: 1, parentName: 'Rakesh Verma', studentName: 'Amit Verma', date: '2026-11-25', time: '10:30 AM', topic: 'Academic Progress Feedback', status: 'Pending' },
    { id: 2, parentName: 'Sunita Sharma', studentName: 'Karan Sharma', date: '2026-11-26', time: '11:00 AM', topic: 'Hostel Curfew Extension Request', status: 'Approved' },
    { id: 3, parentName: 'Mohit Goel', studentName: 'Riya Goel', date: '2026-11-28', time: '02:30 PM', topic: 'Medical Diet Customization', status: 'Pending' }
  ]);

  const updateMeetingStatus = (id: number, status: 'Approved' | 'Declined') => {
    setMeetings(meetings.map(m => m.id === id ? { ...m, status } : m));
    toast.success(`Meeting request successfully ${status.toLowerCase()}`);
  };

  // --- SUBMODULE 4: Gateway (Email & SMS Quota) ---
  const [bulkChannel, setBulkChannel] = useState<'SMS' | 'Email'>('SMS');
  const [bulkRecipientGroup, setBulkRecipientGroup] = useState('All Parents');
  const [bulkMessage, setBulkMessage] = useState('');
  const [smsQuota, setSmsQuota] = useState({ sent: 42100, total: 50000 });
  const [emailQuota, setEmailQuota] = useState({ sent: 9840, total: 10000 });

  const handleSendBulk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkMessage.trim()) return;
    toast.success(`Sending bulk ${bulkChannel} to ${bulkRecipientGroup}...`);
    setTimeout(() => {
      if (bulkChannel === 'SMS') {
        setSmsQuota(prev => ({ ...prev, sent: prev.sent + 1200 }));
      } else {
        setEmailQuota(prev => ({ ...prev, sent: prev.sent + 1200 }));
      }
      setBulkMessage('');
      toast.success(`Bulk dispatch complete! 1,200 messages delivered.`);
    }, 1000);
  };

  // --- SUBMODULE 5: Push Notification Screen Simulator ---
  const [phoneAlertTitle, setPhoneAlertTitle] = useState('Fees Reminder');
  const [phoneAlertBody, setPhoneAlertBody] = useState('Term 2 tuition fee is due on Nov 30th. Kindly clear outstanding fees to avoid late charges.');
  const [phoneAlertUrl, setPhoneAlertUrl] = useState('/fees/collect');

  // --- SUBMODULE 13: Complaint & Grievances ---
  const [grievances, setGrievances] = useState<GrievanceTicket[]>([
    { id: 1, submittedBy: 'Sumit Gupta', role: 'Student', subject: 'Library cooling system malfunctioning', category: 'Infrastructure', status: 'Open', date: '2026-11-20', priority: 'High' },
    { id: 2, submittedBy: 'Rekha Sen', role: 'Parent', subject: 'Requesting revision in chemistry assignment dates', category: 'Academics', status: 'In Progress', date: '2026-11-21', priority: 'Medium' },
    { id: 3, submittedBy: 'Pawan Kumar', role: 'Staff', subject: 'Staff room chairs needs replacement', category: 'Infrastructure', status: 'Resolved', date: '2026-11-15', priority: 'Low' }
  ]);
  const [grievanceModalOpen, setGrievanceModalOpen] = useState(false);
  const [grievanceSubject, setGrievanceSubject] = useState('');
  const [grievanceCategory, setGrievanceCategory] = useState<'Infrastructure' | 'Academics' | 'Discipline' | 'Hostel'>('Infrastructure');
  const [grievancePriority, setGrievancePriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  const submitGrievance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grievanceSubject.trim()) return;
    const ticket: GrievanceTicket = {
      id: Date.now(),
      submittedBy: 'System User (Admin Demo)',
      role: 'Staff',
      subject: grievanceSubject,
      category: grievanceCategory,
      status: 'Open',
      date: new Date().toISOString().split('T')[0],
      priority: grievancePriority
    };
    setGrievances([ticket, ...grievances]);
    setGrievanceSubject('');
    setGrievanceModalOpen(false);
    toast.success('Grievance ticket created successfully!');
  };

  // --- SUBMODULE 15: Discussion Forums ---
  const [threads, setThreads] = useState<ForumThread[]>([
    { id: 1, title: 'Discussion on Class 10 Board prep strategy', author: 'Dr. Satish Chandra', category: 'Class 10', replies: 24, views: 180, upvotes: 15, time: '2 hours ago' },
    { id: 2, title: 'Physics Numerical Assignments - Solutions sync', author: 'Vikram Singh', category: 'Physics', replies: 8, views: 65, upvotes: 9, time: '5 hours ago' },
    { id: 3, title: 'General doubts regarding sports day events guidelines', author: 'Rohit K. (P.E. Coach)', category: 'Sports', replies: 12, views: 94, upvotes: 11, time: '1 day ago' }
  ]);

  const toggleUpvote = (id: number) => {
    setThreads(threads.map(t => {
      if (t.id === id) {
        return {
          ...t,
          upvotes: t.hasVoted ? t.upvotes - 1 : t.upvotes + 1,
          hasVoted: !t.hasVoted
        };
      }
      return t;
    }));
  };

  // --- SUBMODULE 16: Polls & Surveys ---
  const [pollVotes, setPollVotes] = useState<Record<string, number>>({
    'Option A: Cultural Feast': 114,
    'Option B: Science & Tech Fest': 87,
    'Option C: Adventure Sports Camp': 142
  });
  const [selectedPollOption, setSelectedPollOption] = useState<string | null>(null);
  const [hasVotedPoll, setHasVotedPoll] = useState(false);

  const castPollVote = () => {
    if (!selectedPollOption) {
      toast.error('Select an option first');
      return;
    }
    setPollVotes(prev => ({
      ...prev,
      [selectedPollOption]: prev[selectedPollOption] + 1
    }));
    setHasVotedPoll(true);
    toast.success('Your vote has been cast successfully!');
  };

  // --- SUBMODULE 17: Emergency Broadcast System ---
  const [emergencyCode, setEmergencyCode] = useState('');
  const [emergencyConfirmed, setEmergencyConfirmed] = useState(false);
  const [emergencyActive, setEmergencyActive] = useState(false);

  const triggerEmergency = () => {
    if (emergencyCode !== '999') {
      toast.error('Invalid Emergency Override Code! Verification failed.');
      return;
    }
    setEmergencyActive(true);
    toast.error('🚨 EMERGENCY LOCKDOWN BROADCAST DISPATCHED TO ALL CHANNELS!');
  };

  const cancelEmergency = () => {
    setEmergencyActive(false);
    setEmergencyConfirmed(false);
    setEmergencyCode('');
    toast.success('Emergency alert terminated. Resuming normal operations.');
  };

  // 20 Submodule configuration mapping path to specific data and layouts
  const modules: Record<string, { title: string; desc: string; icon: React.ReactNode; group: string }> = {
    '/communication/internal-messaging': {
      title: 'Internal Messaging Portal',
      desc: 'Direct messaging and real-time chat gateway between teachers, staff, students, and parents.',
      icon: <MessageSquare className="w-5 h-5 text-indigo-600" />,
      group: 'Direct Channels'
    },
    '/communication/announcements': {
      title: 'Announcements & Broadcast Notices',
      desc: 'Manage school-wide notifications, pinned board notices, and multi-format document attachments.',
      icon: <Megaphone className="w-5 h-5 text-emerald-600" />,
      group: 'Direct Channels'
    },
    '/communication/parent-teacher': {
      title: 'Parent-Teacher Communication Hub',
      desc: 'Manage PTM requests, parent direct queries, schedule calls, and send child progress updates.',
      icon: <Users className="w-5 h-5 text-blue-600" />,
      group: 'Direct Channels'
    },
    '/communication/gateway': {
      title: 'SMS & Email Gateway Integration',
      desc: 'External messaging gateways management. Send bulk SMS notifications and custom templates.',
      icon: <Activity className="w-5 h-5 text-yellow-600" />,
      group: 'Direct Channels'
    },
    '/communication/push-notifications': {
      title: 'Mobile Push Notification Center',
      desc: 'Dispatch alerts directly to user smartphones (Fee dues, Exam updates, Emergency notices).',
      icon: <Smartphone className="w-5 h-5 text-orange-600" />,
      group: 'Direct Channels'
    },
    '/communication/homework-alerts': {
      title: 'Homework & Assignment Alerts',
      desc: 'Automated student/parent notifications triggered immediately upon teacher uploading homework.',
      icon: <BookOpen className="w-5 h-5 text-pink-600" />,
      group: 'Academic Alerts'
    },
    '/communication/exam-alerts': {
      title: 'Exam Dates & Results Announcer',
      desc: 'Draft schedule reminders and send results cards directly to parent mobiles.',
      icon: <FileText className="w-5 h-5 text-teal-600" />,
      group: 'Academic Alerts'
    },
    '/communication/attendance-alerts': {
      title: 'Real-time Attendance Alerts',
      desc: 'Trigger immediate automated SMS/Email alerts to parents if a student is absent.',
      icon: <UserCheck className="w-5 h-5 text-cyan-600" />,
      group: 'Academic Alerts'
    },
    '/communication/timetable-alerts': {
      title: 'Timetable Change Alerts',
      desc: 'Instantly notify students/staff when class periods, rooms, or teachers are substituted.',
      icon: <Clock className="w-5 h-5 text-indigo-600" />,
      group: 'Academic Alerts'
    },
    '/communication/circulars': {
      title: 'Official Circular Board',
      desc: 'Create, authorize, distribute, and archive school office letters and board resolutions.',
      icon: <Clipboard className="w-5 h-5 text-purple-600" />,
      group: 'Administrative Alerts'
    },
    '/communication/event-alerts': {
      title: 'Event & Calendar Notifications',
      desc: 'Remind participants about PTMs, sports tournaments, seminars, and holiday changes.',
      icon: <Calendar className="w-5 h-5 text-rose-600" />,
      group: 'Administrative Alerts'
    },
    '/communication/fee-reminders': {
      title: 'Fee Dues Reminders Coordinator',
      desc: 'Set automated due date warnings, late reminders, and payment receipts confirmations.',
      icon: <DollarSign className="w-5 h-5 text-amber-600" />,
      group: 'Administrative Alerts'
    },
    '/communication/complaints-grievances': {
      title: 'Complaint & Grievance desk',
      desc: 'Review submitted feedback, assign staff to complaints, and track resolution workflows.',
      icon: <HelpCircle className="w-5 h-5 text-red-600" />,
      group: 'Administrative Alerts'
    },
    '/communication/staff-chat': {
      title: 'Staff HR & Internal Communication',
      desc: 'Announce department reviews, internal notices, salary rollouts, and scheduling changes.',
      icon: <Briefcase className="w-5 h-5 text-sky-600" />,
      group: 'Administrative Alerts'
    },
    '/communication/forums': {
      title: 'Discussion Forums & Q&A Board',
      desc: 'Host subject-specific doubts threads, student discussion circles, and peer learning forums.',
      icon: <MessageSquare className="w-5 h-5 text-emerald-600" />,
      group: 'Engagement Submodules'
    },
    '/communication/polls': {
      title: 'Polls & Feedback Surveys',
      desc: 'Collect stakeholder views on curriculum changes, meal choices, and infrastructure satisfaction.',
      icon: <Grid className="w-5 h-5 text-violet-600" />,
      group: 'Engagement Submodules'
    },
    '/communication/emergency': {
      title: 'Emergency Broadcast Console',
      desc: 'Instantly notify all users (SMS, Call, Email, Push) of critical emergencies or school closures.',
      icon: <ShieldAlert className="w-5 h-5 text-red-700" />,
      group: 'Engagement Submodules'
    },
    '/communication/alumni': {
      title: 'Alumni Network Linker',
      desc: 'Host network alerts, alumni events notices, guest lectures, and placement news.',
      icon: <Users className="w-5 h-5 text-blue-600" />,
      group: 'Engagement Submodules'
    },
    '/communication/delivery-reports': {
      title: 'Message Delivery analytics',
      desc: 'Audit real-time metrics showing successfully sent, read, and failed notification statistics.',
      icon: <TrendingUp className="w-5 h-5 text-green-600" />,
      group: 'Reports & Audit'
    },
    '/communication/logs': {
      title: 'Communication Audit Trails',
      desc: 'Secure logs repository keeping detailed records of all dispatched notifications.',
      icon: <History className="w-5 h-5 text-slate-600" />,
      group: 'Reports & Audit'
    }
  };

  const currentModule = modules[path] || {
    title: 'Communication Workspace',
    desc: 'Select a communication submodule from the sidebar to manage channels.',
    icon: <MessageSquare className="w-5 h-5 text-indigo-600" />,
    group: 'Direct Channels'
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200/80 shadow-sm p-4 sm:p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
            {currentModule.icon}
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Communication & Notifications</div>
            <h1 className="text-lg font-extrabold text-slate-900 mt-0.5 tracking-tight">{currentModule.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 select-none self-start sm:self-center">
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200/60 px-2.5 py-1.5 rounded-lg">
            {currentModule.group}
          </span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1.5 rounded-lg flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Online & Ready
          </span>
        </div>
      </div>

      {/* ── DETAILS DESCRIPTIONS ── */}
      <div className="bg-slate-50 border border-slate-200/70 p-4 rounded-xl">
        <p className="text-xs font-semibold text-slate-600">{currentModule.desc}</p>
      </div>

      {/* ── MODULE SPECIFIC RENDERERS ── */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
        
        {/* 1. INTERNAL MESSAGING */}
        {path === '/communication/internal-messaging' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 h-[500px]">
            {/* Sidebar Contact list */}
            <div className="md:col-span-1 border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search contacts..." className="w-full bg-transparent text-xs outline-none font-semibold text-slate-700" />
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {chatContacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors duration-200 ${
                      selectedContact.id === contact.id ? 'bg-indigo-50/70 border-r-4 border-indigo-600' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="w-9 h-9 bg-indigo-150 text-indigo-700 font-extrabold rounded-full flex items-center justify-center text-xs flex-shrink-0">
                      {contact.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 truncate">{contact.name}</span>
                        <span className="text-[8px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">{contact.role}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate mt-0.5">Click to preview chat</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Chat conversation area */}
            <div className="md:col-span-2 border border-slate-200 rounded-xl flex flex-col bg-slate-50/30">
              <div className="p-4 bg-white border-b border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600 text-white font-extrabold rounded-full flex items-center justify-center text-xs">
                  {selectedContact.avatar}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{selectedContact.name}</div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase">{selectedContact.role} Channels</div>
                </div>
              </div>
              
              {/* Messages area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
                {(chatMessages[selectedContact.id] || []).map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      msg.sender === 'me'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                    }`}>
                      <p className="font-semibold">{msg.text}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className={`text-[8px] font-semibold ${msg.sender === 'me' ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {msg.time}
                        </span>
                        {msg.sender === 'me' && (
                          <span>
                            {msg.status === 'sent' && <Check className="w-3 h-3 text-indigo-300" />}
                            {msg.status === 'delivered' && <CheckCheck className="w-3 h-3 text-indigo-200" />}
                            {msg.status === 'read' && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Msg typing area */}
              <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={newMsgText}
                  onChange={(e) => setNewMsgText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type your message here..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
                <button
                  onClick={sendChatMessage}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition active:scale-95 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. ANNOUNCEMENTS & BROADCAST */}
        {path === '/communication/announcements' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Active Notice Board</h2>
              <button
                onClick={() => setNoticeModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Publish New Notice
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notices.map(notice => (
                <div key={notice.id} className="border border-slate-200/80 rounded-xl p-4 hover:shadow-md transition bg-slate-50/10">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      notice.category === 'Staff' ? 'bg-amber-550/10 text-amber-600 border border-amber-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}>
                      {notice.category}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400">{notice.date}</span>
                  </div>
                  <h3 className="text-xs font-extrabold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    {notice.pinned && <span className="text-[10px] bg-red-50 text-red-600 font-bold px-1.5 py-0.5 rounded border border-red-200">PINNED</span>}
                    {notice.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mb-3">{notice.content}</p>
                  
                  {notice.attachment && (
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 p-2 rounded-lg text-[10px]">
                      <span className="font-mono text-slate-600 truncate max-w-[70%]">{notice.attachment}</span>
                      <button className="text-indigo-600 font-bold hover:underline cursor-pointer">Download</button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {noticeModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <form onSubmit={createNotice} className="bg-white rounded-2xl border border-slate-200 p-5 w-full max-w-md space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="font-extrabold text-slate-800 text-sm">Publish New Broadcast Notice</span>
                    <button type="button" onClick={() => setNoticeModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">Notice Title</label>
                      <input type="text" value={newNoticeTitle} onChange={e => setNewNoticeTitle(e.target.value)} placeholder="e.g. Science Labs Maintenance Closure" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">Notice Category</label>
                      <select value={newNoticeCat} onChange={e => setNewNoticeCat(e.target.value as any)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                        <option value="School-wide">School-wide Broadcast</option>
                        <option value="Class 10">Class 10</option>
                        <option value="Class 12">Class 12</option>
                        <option value="Staff">Staff Only</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">Notice Content</label>
                      <textarea rows={3} value={newNoticeContent} onChange={e => setNewNoticeContent(e.target.value)} placeholder="Type notice guidelines details here..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"></textarea>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="pin-notice" checked={newNoticePin} onChange={e => setNewNoticePin(e.target.checked)} className="w-3.5 h-3.5 text-indigo-600 border-slate-350 focus:ring-indigo-550 rounded" />
                      <label htmlFor="pin-notice" className="text-[10px] font-bold text-slate-700 cursor-pointer">Pin this Notice on dashboard</label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 border-t pt-3.5">
                    <button type="button" onClick={() => setNoticeModalOpen(false)} className="px-3.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-250 rounded-lg font-bold">Cancel</button>
                    <button type="submit" className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">Publish Notice</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* 3. PARENT-TEACHER COMMUNICATION */}
        {path === '/communication/parent-teacher' && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide pb-2.5 border-b">Active Parent Consultation Calendar</h2>
            <div className="space-y-3">
              {meetings.map(meet => (
                <div key={meet.id} className="border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/20">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-800">{meet.parentName}</span>
                      <span className="text-[9px] text-slate-400 font-bold">Parent of: {meet.studentName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-semibold">
                      Topic: <span className="text-slate-800 font-bold">{meet.topic}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                      <span>Date: {meet.date}</span>
                      <span>•</span>
                      <span>TimeSlot: {meet.time}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {meet.status === 'Pending' ? (
                      <>
                        <button
                          onClick={() => updateMeetingStatus(meet.id, 'Approved')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition"
                        >
                          Approve Request
                        </button>
                        <button
                          onClick={() => updateMeetingStatus(meet.id, 'Declined')}
                          className="bg-red-50 hover:bg-red-100 text-red-650 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-red-200 cursor-pointer transition"
                        >
                          Decline Request
                        </button>
                      </>
                    ) : (
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border ${
                        meet.status === 'Approved' ? 'bg-emerald-50 text-emerald-750 border-emerald-250' : 'bg-red-50 text-red-750 border-red-250'
                      }`}>
                        {meet.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. SMS / EMAIL GATEWAY */}
        {path === '/communication/gateway' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Quota gauges */}
            <div className="md:col-span-1 space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/10">
                <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">SMS Service Quota</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-slate-200 flex items-center justify-center font-extrabold text-[10px]">
                    {Math.round((smsQuota.sent / smsQuota.total) * 100)}%
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-700">{smsQuota.sent.toLocaleString()} Sent</div>
                    <div className="text-[10px] text-slate-400 font-semibold">Total Limit: {smsQuota.total.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/10">
                <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">Email Service Quota</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-600 border-t-slate-200 flex items-center justify-center font-extrabold text-[10px]">
                    {Math.round((emailQuota.sent / emailQuota.total) * 100)}%
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-700">{emailQuota.sent.toLocaleString()} Sent</div>
                    <div className="text-[10px] text-slate-400 font-semibold">Total Limit: {emailQuota.total.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk Dispatch Sender */}
            <div className="md:col-span-2 border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">Manual Bulk Broadcast</h3>
              <form onSubmit={handleSendBulk} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Gateway Channel</label>
                    <div className="flex border border-slate-200 rounded-lg overflow-hidden text-xs">
                      <button type="button" onClick={() => setBulkChannel('SMS')} className={`w-full py-1.5 font-bold transition ${bulkChannel === 'SMS' ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-50'}`}>SMS Gateway</button>
                      <button type="button" onClick={() => setBulkChannel('Email')} className={`w-full py-1.5 font-bold transition ${bulkChannel === 'Email' ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-50'}`}>Email Gateway</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Recipient Group</label>
                    <select value={bulkRecipientGroup} onChange={e => setBulkRecipientGroup(e.target.value)} className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none bg-white font-semibold">
                      <option value="All Parents">All Parents</option>
                      <option value="All Teachers">All Teachers</option>
                      <option value="All Students">All Students</option>
                      <option value="Hostellers Only">Hostellers Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Message Content</label>
                  <textarea rows={3} value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} placeholder={`Type broadcast ${bulkChannel === 'SMS' ? 'SMS text (max 160 chars)' : 'HTML/Text Email content'} here...`} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"></textarea>
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition active:scale-95 cursor-pointer">
                    Dispatch Broadcast Now
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 5. PUSH NOTIFICATIONS */}
        {path === '/communication/push-notifications' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Control Panel form */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b pb-2">Trigger Push Alert</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Alert Title</label>
                  <input type="text" value={phoneAlertTitle} onChange={e => setPhoneAlertTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg outline-none focus:ring-1 focus:ring-indigo-600 font-semibold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Alert Subtitle / Body</label>
                  <textarea rows={3} value={phoneAlertBody} onChange={e => setPhoneAlertBody(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg outline-none focus:ring-1 focus:ring-indigo-600 font-semibold"></textarea>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Route Path (OnClick Action)</label>
                  <input type="text" value={phoneAlertUrl} onChange={e => setPhoneAlertUrl(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg font-mono" />
                </div>
              </div>
              <button onClick={() => toast.success('Push notification successfully sent to registered mobile application devices')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg transition cursor-pointer">
                Send Notification Alert
              </button>
            </div>

            {/* Mobile screen previewer mockup */}
            <div className="flex justify-center">
              <div className="w-[280px] h-[450px] bg-slate-900 rounded-[35px] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col p-3 text-white font-sans">
                {/* Speaker pill notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-full z-15"></div>
                {/* Time & Battery */}
                <div className="flex justify-between items-center text-[9px] font-bold px-2.5 pt-1.5 mb-8">
                  <span>09:41 AM</span>
                  <div className="flex items-center gap-1">
                    <span>5G</span>
                    <div className="w-4 h-2 border border-white/80 rounded-sm p-[1px]"><div className="bg-white h-full w-[80%]"></div></div>
                  </div>
                </div>
                
                {/* Notification Bubble */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-3 animate-bounce">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center text-[7px] font-extrabold text-white">SM</div>
                      <span className="text-[9px] font-bold text-white/90">School App Manager</span>
                    </div>
                    <span className="text-[8px] text-white/50">now</span>
                  </div>
                  <h4 className="text-[10px] font-bold text-white leading-tight">{phoneAlertTitle || 'Alert Title'}</h4>
                  <p className="text-[9px] text-white/70 mt-0.5 line-clamp-2">{phoneAlertBody || 'Notification body content...'}</p>
                </div>
                
                <div className="mt-auto text-center pb-2">
                  <div className="w-20 h-1 bg-white/60 mx-auto rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 13. COMPLAINT & GRIEVANCE */}
        {path === '/communication/complaints-grievances' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Submitted Tickets</h2>
              <button
                onClick={() => setGrievanceModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Submit Grievance
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[9px]">
                    <th className="p-3">Ticket ID</th>
                    <th className="p-3">Submitted By</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grievances.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-[10px] text-slate-400">#TK-{ticket.id.toString().slice(-4)}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{ticket.submittedBy}</div>
                        <div className="text-[9px] text-slate-400">{ticket.role}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{ticket.subject}</td>
                      <td className="p-3 font-bold text-slate-500">{ticket.category}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold border ${
                          ticket.priority === 'High' ? 'bg-red-50 text-red-650 border-red-200' : ticket.priority === 'Medium' ? 'bg-yellow-50 text-yellow-650 border-yellow-250' : 'bg-slate-50 text-slate-650 border-slate-200'
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          ticket.status === 'Open' ? 'bg-blue-100 text-blue-700' : ticket.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {ticket.status !== 'Resolved' && (
                          <button
                            onClick={() => {
                              setGrievances(grievances.map(g => g.id === ticket.id ? { ...g, status: 'Resolved' } : g));
                              toast.success('Ticket marked as resolved');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[10px] transition cursor-pointer"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {grievanceModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <form onSubmit={submitGrievance} className="bg-white rounded-2xl border border-slate-200 p-5 w-full max-w-md space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="font-extrabold text-slate-800 text-sm">Submit New Grievance Ticket</span>
                    <button type="button" onClick={() => setGrievanceModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">Subject Description</label>
                      <input type="text" value={grievanceSubject} onChange={e => setGrievanceSubject(e.target.value)} placeholder="e.g. Science lab projector power failure" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Category</label>
                        <select value={grievanceCategory} onChange={e => setGrievanceCategory(e.target.value as any)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none bg-white font-semibold">
                          <option value="Infrastructure">Infrastructure</option>
                          <option value="Academics">Academics</option>
                          <option value="Discipline">Discipline</option>
                          <option value="Hostel">Hostel</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Priority</label>
                        <select value={grievancePriority} onChange={e => setGrievancePriority(e.target.value as any)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none bg-white font-semibold">
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t pt-3.5">
                    <button type="button" onClick={() => setGrievanceModalOpen(false)} className="px-3.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-250 rounded-lg font-bold">Cancel</button>
                    <button type="submit" className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">Submit Ticket</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* 15. DISCUSSION FORUMS */}
        {path === '/communication/forums' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Doubts & Class Threads</h2>
              <button onClick={() => toast.success('Forum thread draft window initialized')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Open New Thread
              </button>
            </div>

            <div className="space-y-3">
              {threads.map(thread => (
                <div key={thread.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-sm transition bg-slate-50/5 flex items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 bg-indigo-550/10 text-indigo-700 border border-indigo-200 rounded">{thread.category}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Posted by {thread.author} • {thread.time}</span>
                    </div>
                    <h3 className="text-xs font-extrabold text-slate-800 leading-tight">{thread.title}</h3>
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold">
                      <span>{thread.replies} Replies</span>
                      <span>{thread.views} Views</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleUpvote(thread.id)}
                    className={`flex flex-col items-center p-2 rounded-lg border transition ${
                      thread.hasVoted ? 'bg-indigo-600 border-indigo-600 text-white font-bold' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500'
                    }`}
                  >
                    <span className="text-[11px] font-extrabold leading-none">▲</span>
                    <span className="text-[9px] font-bold mt-1">{thread.upvotes}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 16. POLLS & SURVEYS */}
        {path === '/communication/polls' && (
          <div className="max-w-md mx-auto border border-slate-200/80 rounded-2xl p-5 shadow-sm bg-slate-50/10">
            <span className="text-[8px] bg-indigo-50 border border-indigo-200/60 font-extrabold text-indigo-700 uppercase px-2 py-0.5 rounded">Active Survey</span>
            <h3 className="text-xs font-extrabold text-slate-800 mt-2 mb-4 leading-normal">
              Which theme should be chosen for the Annual School Tech-Fest 2026?
            </h3>
            
            <div className="space-y-3">
              {Object.keys(pollVotes).map(option => {
                const votes = pollVotes[option];
                const totalVotes = Object.values(pollVotes).reduce((a, b) => a + b, 0);
                const percent = Math.round((votes / totalVotes) * 100);

                return (
                  <div key={option} className="space-y-1">
                    <button
                      disabled={hasVotedPoll}
                      onClick={() => setSelectedPollOption(option)}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                        selectedPollOption === option
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{option}</span>
                      {hasVotedPoll && <span className="font-mono">{percent}%</span>}
                    </button>
                    
                    {hasVotedPoll && (
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!hasVotedPoll ? (
              <button
                onClick={castPollVote}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs mt-5 transition cursor-pointer"
              >
                Submit Survey Vote
              </button>
            ) : (
              <div className="text-center text-[10px] font-bold text-emerald-600 mt-5 border border-emerald-200 bg-emerald-50/50 py-2 rounded-lg">
                ✓ Thank you for voting! Live poll analytics synced.
              </div>
            )}
          </div>
        )}

        {/* 17. EMERGENCY BROADCAST */}
        {path === '/communication/emergency' && (
          <div className="max-w-lg mx-auto border-2 border-red-500/80 rounded-2xl p-5 bg-red-50/30 text-center space-y-4">
            <div className="w-12 h-12 bg-red-650 text-white rounded-full flex items-center justify-center text-xl mx-auto shadow-lg animate-pulse">
              🚨
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-red-700 uppercase tracking-wide">Emergency School Broadcast Portal</h3>
              <p className="text-[11px] text-red-500 font-semibold mt-1">
                Dispatching triggers here sends instant override SMS, voice calls, emails, and push warnings to ALL registered student, parent, and staff contacts.
              </p>
            </div>

            {!emergencyActive ? (
              <div className="space-y-3 bg-white p-4 rounded-xl border border-red-200">
                {!emergencyConfirmed ? (
                  <button
                    onClick={() => setEmergencyConfirmed(true)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Configure Emergency Broadcast
                  </button>
                ) : (
                  <div className="space-y-3 text-left">
                    <label className="block text-[10px] font-bold text-slate-700">Enter Emergency Override PIN (Type 999 to confirm)</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={emergencyCode}
                        onChange={e => setEmergencyCode(e.target.value)}
                        placeholder="PIN Code"
                        className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg outline-none font-bold text-center"
                      />
                      <button
                        onClick={triggerEmergency}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition cursor-pointer"
                      >
                        CONFIRM TRIGGER
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-600 border border-red-700 text-white p-4 rounded-xl space-y-3 shadow-md animate-pulse">
                <h4 className="text-xs font-bold uppercase tracking-widest">📢 BROADCAST ACTIVATED</h4>
                <p className="text-[10px] leading-relaxed font-semibold">
                  EMERGENCY CODE OVERRIDE APPLIED. DISPATCHING ALERT SIRENS THROUGHOUT TELEPHONY GATEWAYS AND SCHOOL NETWORK STATIONS.
                </p>
                <button
                  onClick={cancelEmergency}
                  className="bg-white hover:bg-slate-100 text-red-650 font-bold px-4 py-2 rounded-lg text-[10px] transition cursor-pointer"
                >
                  TERMINATE ALERT & BROADCASTS
                </button>
              </div>
            )}
          </div>
        )}

        {/* 19. MESSAGE DELIVERY REPORTS */}
        {path === '/communication/delivery-reports' && (
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide pb-2 border-b">Real-time Analytics Dashboard</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <div className="text-lg font-extrabold text-indigo-600">98.4%</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Sms Delivery Rate</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <div className="text-lg font-extrabold text-emerald-600">89.2%</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Email Read Rate</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <div className="text-lg font-extrabold text-blue-600">99.9%</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Push Delivery Rate</div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-wide">Delivery success statistics by category</h4>
              {/* Custom SVG Bar Chart */}
              <div className="space-y-3.5">
                {[
                  { label: 'Fee Overdue Reminders', success: 98, failed: 2 },
                  { label: 'Exam Timetables Alerts', success: 99, failed: 1 },
                  { label: 'PTM Booking Confirmations', success: 95, failed: 5 },
                  { label: 'General Broadcast Notices', success: 91, failed: 9 }
                ].map(stat => (
                  <div key={stat.label} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                      <span>{stat.label}</span>
                      <span>Success: {stat.success}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full" style={{ width: `${stat.success}%` }}></div>
                      <div className="bg-red-500 h-full" style={{ width: `${stat.failed}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FALLBACK FOR OTHER SUBMODULES (Render premium mock list templates) */}
        {!['/communication/internal-messaging', '/communication/announcements', '/communication/parent-teacher', '/communication/gateway', '/communication/push-notifications', '/communication/complaints-grievances', '/communication/forums', '/communication/polls', '/communication/emergency', '/communication/delivery-reports'].includes(path) && (
          <div className="space-y-4">
            <div className="bg-indigo-50/50 border border-indigo-150 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-indigo-800">Operational Workspace Simulator</h4>
                <p className="text-[11px] text-indigo-650 font-semibold mt-0.5">
                  Configure automations and dispatch logs directly below. Live system logs will append to audit grids.
                </p>
              </div>
              <button
                onClick={() => toast.success(`Alert trigger command issued for ${currentModule.title}`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3.5 py-2 rounded-lg transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                Trigger Broadcast Simulation
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/10 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 border-b pb-2 uppercase tracking-wide">Recent activity queue</h3>
              <div className="divide-y divide-slate-100 text-xs">
                {[
                  { id: 1, action: 'Auto Alert Dispatched', details: `Sent notification updates for ${currentModule.title}`, target: 'Class 10 Students & Parents', time: '10 mins ago', status: 'Success' },
                  { id: 2, action: 'Template Compiled', details: 'System generated circular blueprint matching parameters', target: 'Staff / Wardens group', time: '1 hour ago', status: 'Success' },
                  { id: 3, action: 'Gateway Verification', details: 'Ping connection check to external cellular provider', target: 'External server API', time: '2 hours ago', status: 'Verified' }
                ].map(log => (
                  <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{log.action}</span>
                        <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">{log.status}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold">{log.details} · To: {log.target}</p>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CommunicationPlaceholder;
