import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart2, CheckCircle, Plus, Search,
  Users, Clock, ChevronRight, Trash2, Bell,
  Star, MessageSquare, TrendingUp, Send, X,
  Eye, ToggleLeft, ToggleRight, Award,
  PieChart, Activity, Layers,
  RefreshCw, BookOpen, Zap, Target,
  AlignLeft, CheckSquare
} from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type MainTab = 'board' | 'creator' | 'manager' | 'analytics';
type PostType = 'poll' | 'survey';
type AudienceType = 'students' | 'parents' | 'teachers' | 'all';
type PollStatus = 'active' | 'closed' | 'draft';
type QuestionType = 'single' | 'multi' | 'text' | 'rating';

interface PollOption {
  id: number;
  text: string;
  votes: number;
  voted: boolean;
}

interface Poll {
  id: number;
  title: string;
  category: string;
  audience: AudienceType;
  status: PollStatus;
  options: PollOption[];
  totalVotes: number;
  myVote: number | null;
  createdBy: string;
  createdAt: string;
  endsAt: string;
  tags: string[];
}

interface SurveyQuestion {
  id: number;
  text: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
}

interface SurveyResponse {
  questionId: number;
  answer: string | string[] | number;
}

interface Survey {
  id: number;
  title: string;
  description: string;
  category: string;
  audience: AudienceType;
  status: PollStatus;
  questions: SurveyQuestion[];
  responseCount: number;
  targetCount: number;
  createdBy: string;
  createdAt: string;
  endsAt: string;
  completionRate: number;
  tags: string[];
  textFeedbacks: string[];
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_POLLS: Poll[] = [
  {
    id: 1,
    title: 'Should the school switch to a 5-day week schedule?',
    category: 'School Policy',
    audience: 'all',
    status: 'active',
    options: [
      { id: 1, text: 'Yes, definitely!', votes: 142, voted: false },
      { id: 2, text: 'No, keep 6-day week', votes: 89, voted: false },
      { id: 3, text: 'Need more discussion', votes: 54, voted: false },
    ],
    totalVotes: 285,
    myVote: null,
    createdBy: 'Principal Dr. Sharma',
    createdAt: '2026-06-20',
    endsAt: '2026-06-30',
    tags: ['policy', 'schedule', 'school-hours'],
  },
  {
    id: 2,
    title: 'Which co-curricular activity should be added next semester?',
    category: 'Academics',
    audience: 'students',
    status: 'active',
    options: [
      { id: 1, text: '🎨 Art & Painting Club', votes: 98, voted: false },
      { id: 2, text: '🎭 Drama & Theatre', votes: 73, voted: false },
      { id: 3, text: '🤖 Robotics Club', votes: 134, voted: false },
      { id: 4, text: '🎵 Music & Band', votes: 62, voted: false },
    ],
    totalVotes: 367,
    myVote: null,
    createdBy: 'Mr. K. Singh',
    createdAt: '2026-06-22',
    endsAt: '2026-06-28',
    tags: ['activities', 'co-curricular', 'students'],
  },
  {
    id: 3,
    title: 'Are you satisfied with the current school canteen food quality?',
    category: 'Facilities',
    audience: 'all',
    status: 'active',
    options: [
      { id: 1, text: '😍 Very Satisfied', votes: 67, voted: false },
      { id: 2, text: '🙂 Somewhat Satisfied', votes: 112, voted: false },
      { id: 3, text: '😐 Neutral', votes: 89, voted: false },
      { id: 4, text: '😕 Dissatisfied', votes: 143, voted: false },
    ],
    totalVotes: 411,
    myVote: null,
    createdBy: 'Admin Team',
    createdAt: '2026-06-18',
    endsAt: '2026-06-25',
    tags: ['canteen', 'food', 'facilities'],
  },
  {
    id: 4,
    title: 'Preferred mode of Parent-Teacher meetings?',
    category: 'Communication',
    audience: 'parents',
    status: 'closed',
    options: [
      { id: 1, text: '🏫 In-person at school', votes: 210, voted: false },
      { id: 2, text: '💻 Online video call', votes: 178, voted: false },
      { id: 3, text: '📞 Phone call', votes: 44, voted: false },
    ],
    totalVotes: 432,
    myVote: 1,
    createdBy: 'Mrs. Anjali Mehta',
    createdAt: '2026-06-10',
    endsAt: '2026-06-20',
    tags: ['PTM', 'parents', 'communication'],
  },
];

const MOCK_SURVEYS: Survey[] = [
  {
    id: 1,
    title: 'Annual Academic Experience Survey 2026',
    description: 'Help us improve your learning experience by sharing your feedback on teaching quality, infrastructure, and overall school environment.',
    category: 'Academics',
    audience: 'students',
    status: 'active',
    responseCount: 312,
    targetCount: 480,
    completionRate: 65,
    createdBy: 'Principal Dr. Sharma',
    createdAt: '2026-06-15',
    endsAt: '2026-06-30',
    tags: ['annual', 'academics', 'feedback'],
    textFeedbacks: [
      'The teachers are very supportive and always available for doubts.',
      'Smart boards in classrooms have really improved learning.',
      'Would love more sports facilities and a swimming pool.',
      'Library hours should be extended to 6 PM.',
      'The new science lab equipment is excellent!',
    ],
    questions: [
      { id: 1, text: 'How would you rate the overall teaching quality?', type: 'rating', required: true },
      { id: 2, text: 'Which subjects need more attention from teachers?', type: 'multi', options: ['Mathematics', 'Physics', 'Chemistry', 'English', 'History', 'Computer Science'], required: true },
      { id: 3, text: 'Rate the school infrastructure (labs, library, sports)', type: 'rating', required: true },
      { id: 4, text: 'How satisfied are you with the school canteen?', type: 'single', options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'], required: true },
      { id: 5, text: 'Any specific suggestions or feedback for the school administration?', type: 'text', required: false },
    ],
  },
  {
    id: 2,
    title: 'Parent Satisfaction & Engagement Survey',
    description: 'As valued stakeholders, your feedback helps us build a stronger partnership between home and school.',
    category: 'Parent Engagement',
    audience: 'parents',
    status: 'active',
    responseCount: 187,
    targetCount: 350,
    completionRate: 53,
    createdBy: 'Mrs. Anjali Mehta',
    createdAt: '2026-06-18',
    endsAt: '2026-06-28',
    tags: ['parents', 'engagement', 'satisfaction'],
    textFeedbacks: [
      'Communication from the school has improved significantly this year.',
      'The app notifications are very helpful for tracking attendance.',
      'Would appreciate more frequent PTM sessions.',
    ],
    questions: [
      { id: 1, text: 'How satisfied are you with communication from the school?', type: 'rating', required: true },
      { id: 2, text: 'How often do you check the school portal?', type: 'single', options: ['Daily', 'Weekly', 'Monthly', 'Rarely'], required: true },
      { id: 3, text: 'Which areas need improvement?', type: 'multi', options: ['Parent-Teacher Communication', 'App/Portal Features', 'Event Updates', 'Fee Management', 'Academic Reports'], required: false },
      { id: 4, text: 'Additional comments or suggestions:', type: 'text', required: false },
    ],
  },
  {
    id: 3,
    title: 'Teacher Wellbeing & HR Satisfaction Pulse',
    description: 'This anonymous survey helps the HR team understand teacher satisfaction, workload challenges, and improvement opportunities.',
    category: 'HR & Staff',
    audience: 'teachers',
    status: 'closed',
    responseCount: 48,
    targetCount: 52,
    completionRate: 92,
    createdBy: 'HR Department',
    createdAt: '2026-06-01',
    endsAt: '2026-06-15',
    tags: ['teacher', 'HR', 'wellbeing'],
    textFeedbacks: [
      'More professional development workshops would be helpful.',
      'The new payroll system is much better than before.',
      'Would appreciate a common staff lounge upgrade.',
      'Administrative workload needs to be reduced to focus more on teaching.',
    ],
    questions: [
      { id: 1, text: 'Rate your overall job satisfaction at this school', type: 'rating', required: true },
      { id: 2, text: 'How manageable is your current workload?', type: 'single', options: ['Very Manageable', 'Manageable', 'Challenging', 'Overwhelming'], required: true },
      { id: 3, text: 'What resources/support do you need most?', type: 'multi', options: ['More Teaching Aids', 'Reduced Admin Work', 'PD Workshops', 'Better Facilities', 'More Support Staff'], required: false },
      { id: 4, text: 'Any suggestions for HR or school management:', type: 'text', required: false },
    ],
  },
];

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const AUDIENCE_CFG: Record<AudienceType, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  all:      { label: 'Everyone',  color: 'text-slate-700',   bg: 'bg-slate-100',  border: 'border-slate-200',  emoji: '🌐' },
  students: { label: 'Students',  color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',   emoji: '🎓' },
  parents:  { label: 'Parents',   color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',emoji: '👨‍👩‍👧' },
  teachers: { label: 'Teachers',  color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200', emoji: '👩‍🏫' },
};

const STATUS_CFG: Record<PollStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  active: { label: 'Active',  color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  closed: { label: 'Closed',  color: 'text-slate-600',   bg: 'bg-slate-100',  border: 'border-slate-200',  dot: 'bg-slate-400' },
  draft:  { label: 'Draft',   color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',  dot: 'bg-amber-400' },
};

const QTYPE_CFG: Record<QuestionType, { label: string; icon: React.ReactNode; color: string }> = {
  single:  { label: 'Single Choice', icon: <CheckCircle className="w-3 h-3" />, color: 'text-blue-600' },
  multi:   { label: 'Multi Choice',  icon: <CheckSquare className="w-3 h-3" />, color: 'text-violet-600' },
  text:    { label: 'Text Answer',   icon: <AlignLeft className="w-3 h-3" />,   color: 'text-amber-600' },
  rating:  { label: 'Star Rating',   icon: <Star className="w-3 h-3" />,        color: 'text-rose-600' },
};

const COLORS = ['bg-indigo-500', 'bg-violet-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500', 'bg-blue-500'];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

let idCounter = 200;

const MiniBar: React.FC<{ pct: number; color: string; voted?: boolean }> = ({ pct, color, voted }) => (
  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
    <div className={`h-2 rounded-full transition-all duration-700 ${color} ${voted ? 'ring-2 ring-offset-1 ring-indigo-400' : ''}`} style={{ width: `${pct}%` }} />
  </div>
);

const StarRating: React.FC<{ value: number; onChange?: (v: number) => void; readonly?: boolean }> = ({ value, onChange, readonly }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(s => (
      <button key={s} type="button" disabled={readonly}
        onClick={() => onChange?.(s)}
        className={`transition ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}>
        <Star className={`w-5 h-5 ${s <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
      </button>
    ))}
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const PollsSurveys: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('board');
  const [polls, setPolls] = useState<Poll[]>(MOCK_POLLS);
  const [surveys, setSurveys] = useState<Survey[]>(MOCK_SURVEYS);
  const [boardType, setBoardType] = useState<PostType>('poll');
  const [searchQuery, setSearchQuery] = useState('');
  const [audienceFilter, setAudienceFilter] = useState<AudienceType | 'all'>('all');
  const [creatorType, setCreatorType] = useState<PostType>('poll');
  const [selectedAnalyticsId, setSelectedAnalyticsId] = useState<{ type: PostType; id: number } | null>({ type: 'survey', id: 1 });

  // ── Poll creator state ──
  const [pollTitle, setPollTitle] = useState('');
  const [pollCategory, setPollCategory] = useState('Academics');
  const [pollAudience, setPollAudience] = useState<AudienceType>('all');
  const [pollEndDate, setPollEndDate] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollTags, setPollTags] = useState('');
  const [submittingPoll, setSubmittingPoll] = useState(false);

  // ── Survey creator state ──
  const [survTitle, setSurvTitle] = useState('');
  const [survDesc, setSurvDesc] = useState('');
  const [survCategory, setSurvCategory] = useState('Academics');
  const [survAudience, setSurvAudience] = useState<AudienceType>('all');
  const [survEndDate, setSurvEndDate] = useState('');
  const [survTags, setSurvTags] = useState('');
  const [survQuestions, setSurvQuestions] = useState<SurveyQuestion[]>([
    { id: 1, text: '', type: 'single', options: ['', ''], required: true }
  ]);
  const [submittingSurvey, setSubmittingSurvey] = useState(false);

  // ── Survey response state ──
  const [takingSurvey, setTakingSurvey] = useState<Survey | null>(null);
  const [surveyStep, setSurveyStep] = useState(0);
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyResponse[]>([]);
  const [submittingSurveyResp, setSubmittingSurveyResp] = useState(false);

  // ── Derived stats ──
  const totalActivePolls = polls.filter(p => p.status === 'active').length;
  const totalActiveSurveys = surveys.filter(s => s.status === 'active').length;
  const totalResponses = polls.reduce((a, p) => a + p.totalVotes, 0) + surveys.reduce((a, s) => a + s.responseCount, 0);
  const avgCompletion = Math.round(surveys.reduce((a, s) => a + s.completionRate, 0) / surveys.length);

  // ── Filtered boards ──
  const filteredPolls = polls.filter(p => {
    if (audienceFilter !== 'all' && p.audience !== audienceFilter && p.audience !== 'all') return false;
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  const filteredSurveys = surveys.filter(s => {
    if (audienceFilter !== 'all' && s.audience !== audienceFilter && s.audience !== 'all') return false;
    if (searchQuery && !s.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // ── Handlers ──
  const castVote = (pollId: number, optId: number) => {
    setPolls(prev => prev.map(p => {
      if (p.id !== pollId || p.myVote !== null || p.status !== 'active') return p;
      return {
        ...p,
        myVote: optId,
        totalVotes: p.totalVotes + 1,
        options: p.options.map(o => o.id === optId ? { ...o, votes: o.votes + 1, voted: true } : o),
      };
    }));
    toast.success('🗳️ Vote cast successfully!');
  };

  const togglePollStatus = (id: number) => {
    setPolls(prev => prev.map(p => p.id === id
      ? { ...p, status: p.status === 'active' ? 'closed' : 'active' }
      : p));
    toast.success('Poll status updated!');
  };

  const toggleSurveyStatus = (id: number) => {
    setSurveys(prev => prev.map(s => s.id === id
      ? { ...s, status: s.status === 'active' ? 'closed' : 'active' }
      : s));
    toast.success('Survey status updated!');
  };

  const deletePoll = (id: number) => {
    setPolls(prev => prev.filter(p => p.id !== id));
    toast.success('Poll deleted.');
  };

  const deleteSurvey = (id: number) => {
    setSurveys(prev => prev.filter(s => s.id !== id));
    toast.success('Survey deleted.');
  };

  const sendReminder = (title: string) => {
    toast.success(`📤 Reminder notification sent for "${title.slice(0, 30)}..."`);
  };

  const submitPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollTitle.trim()) { toast.error('Poll title is required'); return; }
    const validOpts = pollOptions.filter(o => o.trim());
    if (validOpts.length < 2) { toast.error('At least 2 options are required'); return; }
    setSubmittingPoll(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmittingPoll(false);
    const newPoll: Poll = {
      id: ++idCounter, title: pollTitle, category: pollCategory, audience: pollAudience,
      status: 'active',
      options: validOpts.map((o, i) => ({ id: i + 1, text: o, votes: 0, voted: false })),
      totalVotes: 0, myVote: null, createdBy: 'You',
      createdAt: new Date().toISOString().split('T')[0],
      endsAt: pollEndDate || '2026-07-31',
      tags: pollTags.split(',').map(t => t.trim()).filter(Boolean),
    };
    setPolls(prev => [newPoll, ...prev]);
    setPollTitle(''); setPollCategory('Academics'); setPollAudience('all'); setPollEndDate('');
    setPollOptions(['', '']); setPollTags('');
    toast.success('🎉 Poll published successfully!');
    setActiveTab('board');
    setBoardType('poll');
  };

  const submitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survTitle.trim()) { toast.error('Survey title is required'); return; }
    const validQs = survQuestions.filter(q => q.text.trim());
    if (validQs.length < 1) { toast.error('At least 1 question is required'); return; }
    setSubmittingSurvey(true);
    await new Promise(r => setTimeout(r, 1400));
    setSubmittingSurvey(false);
    const newSurvey: Survey = {
      id: ++idCounter, title: survTitle, description: survDesc, category: survCategory,
      audience: survAudience, status: 'active',
      questions: validQs.map((q, i) => ({ ...q, id: i + 1 })),
      responseCount: 0, targetCount: 100, completionRate: 0,
      createdBy: 'You', createdAt: new Date().toISOString().split('T')[0],
      endsAt: survEndDate || '2026-07-31',
      tags: survTags.split(',').map(t => t.trim()).filter(Boolean),
      textFeedbacks: [],
    };
    setSurveys(prev => [newSurvey, ...prev]);
    setSurvTitle(''); setSurvDesc(''); setSurvCategory('Academics'); setSurvAudience('all');
    setSurvEndDate(''); setSurvTags('');
    setSurvQuestions([{ id: 1, text: '', type: 'single', options: ['', ''], required: true }]);
    toast.success('🎉 Survey published successfully!');
    setActiveTab('board');
    setBoardType('survey');
  };

  const startSurvey = (survey: Survey) => {
    setTakingSurvey(survey);
    setSurveyStep(0);
    setSurveyAnswers(survey.questions.map(q => ({
      questionId: q.id,
      answer: q.type === 'multi' ? [] : q.type === 'rating' ? 0 : '',
    })));
  };

  const submitSurveyResponse = async () => {
    setSubmittingSurveyResp(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmittingSurveyResp(false);
    if (takingSurvey) {
      setSurveys(prev => prev.map(s => s.id === takingSurvey.id
        ? { ...s, responseCount: s.responseCount + 1, completionRate: Math.min(100, Math.round(((s.responseCount + 1) / s.targetCount) * 100)) }
        : s));
    }
    setTakingSurvey(null);
    toast.success('✅ Survey submitted! Thank you for your feedback.');
  };

  const updateAnswer = (qId: number, val: string | string[] | number) => {
    setSurveyAnswers(prev => prev.map(a => a.questionId === qId ? { ...a, answer: val } : a));
  };

  const toggleMultiAnswer = (qId: number, opt: string) => {
    setSurveyAnswers(prev => prev.map(a => {
      if (a.questionId !== qId) return a;
      const arr = a.answer as string[];
      return { ...a, answer: arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt] };
    }));
  };

  // ── Analytics helpers ──
  const analyticsItem = selectedAnalyticsId
    ? selectedAnalyticsId.type === 'poll'
      ? polls.find(p => p.id === selectedAnalyticsId.id)
      : surveys.find(s => s.id === selectedAnalyticsId.id)
    : null;

  const addPollOption = () => setPollOptions(prev => [...prev, '']);
  const removePollOption = (i: number) => setPollOptions(prev => prev.filter((_, idx) => idx !== i));
  const updatePollOption = (i: number, val: string) => setPollOptions(prev => prev.map((o, idx) => idx === i ? val : o));

  const addSurveyQuestion = () => setSurvQuestions(prev => [
    ...prev, { id: ++idCounter, text: '', type: 'single', options: ['', ''], required: false }
  ]);
  const removeSurveyQuestion = (id: number) => setSurvQuestions(prev => prev.filter(q => q.id !== id));
  const updateSurveyQuestion = (id: number, updates: Partial<SurveyQuestion>) =>
    setSurvQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  const addSurveyOption = (qId: number) =>
    setSurvQuestions(prev => prev.map(q => q.id === qId ? { ...q, options: [...(q.options || []), ''] } : q));
  const updateSurveyOption = (qId: number, i: number, val: string) =>
    setSurvQuestions(prev => prev.map(q => q.id === qId
      ? { ...q, options: q.options?.map((o, idx) => idx === i ? val : o) }
      : q));

  return (
    <div className="h-[calc(100vh-120px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-indigo-700 to-violet-700 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/10 rounded-lg"><BarChart2 className="w-4 h-4" /></div>
          <div>
            <h1 className="font-extrabold text-[11px] tracking-tight leading-tight">Polls & Feedback Surveys</h1>
            <p className="text-[9px] text-indigo-200 font-medium">Active Polls · Survey Builder · Analytics · Manager</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <Activity className="w-3 h-3 text-indigo-200" />
            <span className="text-[9px] font-bold">{totalResponses.toLocaleString()} responses</span>
          </div>
          <button onClick={() => { setActiveTab('creator'); setCreatorType('poll'); }}
            className="flex items-center gap-1.5 bg-white text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition cursor-pointer shadow-sm">
            <Plus className="w-3.5 h-3.5" /> New Poll
          </button>
          <button onClick={() => { setActiveTab('creator'); setCreatorType('survey'); }}
            className="flex items-center gap-1.5 bg-indigo-500/20 border border-white/20 text-white hover:bg-indigo-500/30 px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition cursor-pointer">
            <Layers className="w-3.5 h-3.5" /> New Survey
          </button>
        </div>
      </div>

      {/* ── STAT PILLS ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50/30 border-b border-indigo-100 flex-shrink-0 overflow-x-auto">
        {[
          { label: 'Active Polls', val: totalActivePolls, icon: <BarChart2 className="w-3 h-3" />, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
          { label: 'Active Surveys', val: totalActiveSurveys, icon: <Layers className="w-3 h-3" />, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
          { label: 'Total Responses', val: totalResponses.toLocaleString(), icon: <Users className="w-3 h-3" />, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
          { label: 'Avg Completion', val: `${avgCompletion}%`, icon: <Target className="w-3 h-3" />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Closed', val: polls.filter(p => p.status === 'closed').length + surveys.filter(s => s.status === 'closed').length, icon: <CheckCircle className="w-3 h-3" />, color: 'text-slate-600', bg: 'bg-white', border: 'border-slate-200' },
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-1.5 ${s.bg} border ${s.border} px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0`}>
            <span className={s.color}>{s.icon}</span>
            <span className="text-[10px] font-extrabold text-slate-700">{s.val}</span>
            <span className="text-[9px] text-slate-400 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="flex border-b border-slate-200 bg-white flex-shrink-0">
        {([
          { key: 'board',    label: 'Polls & Surveys Board', icon: <BarChart2 className="w-3.5 h-3.5" />, badge: totalActivePolls + totalActiveSurveys },
          { key: 'creator',  label: 'Create',                icon: <Plus className="w-3.5 h-3.5" /> },
          { key: 'manager',  label: 'Manager',               icon: <Layers className="w-3.5 h-3.5" />, badge: polls.length + surveys.length },
          { key: 'analytics',label: 'Analytics & Reports',   icon: <PieChart className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as MainTab)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition ${activeTab === t.key ? 'text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {t.icon} {t.label}
            {'badge' in t && (t as any).badge > 0 && (
              <span className="bg-indigo-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full">{(t as any).badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── SURVEY RESPONSE MODAL ── */}
      {takingSurvey && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-indigo-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-[11px] font-extrabold truncate">{takingSurvey.title}</h3>
                <p className="text-[9px] text-indigo-200 mt-0.5">Question {surveyStep + 1} of {takingSurvey.questions.length}</p>
              </div>
              <button onClick={() => setTakingSurvey(null)} className="p-1 hover:bg-white/20 rounded cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-indigo-100 h-1.5 flex-shrink-0">
              <div className="h-1.5 bg-indigo-500 transition-all duration-500" style={{ width: `${((surveyStep + 1) / takingSurvey.questions.length) * 100}%` }} />
            </div>
            {/* Question */}
            <div className="flex-1 overflow-y-auto p-5">
              {(() => {
                const q = takingSurvey.questions[surveyStep];
                const ans = surveyAnswers.find(a => a.questionId === q.id);
                return (
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <span className={`text-[8px] font-bold px-2 py-1 rounded-full ${QTYPE_CFG[q.type].color} bg-slate-100`}>
                        {QTYPE_CFG[q.type].label}
                      </span>
                      {q.required && <span className="text-[8px] text-rose-500 font-bold bg-rose-50 px-2 py-1 rounded-full">Required</span>}
                    </div>
                    <h4 className="text-[12px] font-extrabold text-slate-800 leading-snug">{q.text || 'Question text not provided'}</h4>
                    {q.type === 'rating' && (
                      <div className="space-y-2">
                        <StarRating value={ans?.answer as number || 0} onChange={v => updateAnswer(q.id, v)} />
                        <p className="text-[9px] text-slate-400">Click a star to rate (1-5)</p>
                      </div>
                    )}
                    {q.type === 'single' && q.options && (
                      <div className="space-y-2">
                        {q.options.map((o, i) => (
                          <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${ans?.answer === o ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}>
                            <input type="radio" name={`q-${q.id}`} checked={ans?.answer === o} onChange={() => updateAnswer(q.id, o)} className="accent-indigo-600" />
                            <span className="text-[10px] font-semibold text-slate-700">{o}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {q.type === 'multi' && q.options && (
                      <div className="space-y-2">
                        {q.options.map((o, i) => {
                          const arr = (ans?.answer as string[]) || [];
                          return (
                            <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${arr.includes(o) ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}>
                              <input type="checkbox" checked={arr.includes(o)} onChange={() => toggleMultiAnswer(q.id, o)} className="accent-indigo-600" />
                              <span className="text-[10px] font-semibold text-slate-700">{o}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    {q.type === 'text' && (
                      <textarea rows={4} placeholder="Type your answer here…"
                        value={ans?.answer as string || ''}
                        onChange={e => updateAnswer(q.id, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 flex-shrink-0">
              <button disabled={surveyStep === 0} onClick={() => setSurveyStep(s => s - 1)}
                className="px-4 py-2 border border-slate-200 text-[9px] font-bold text-slate-500 rounded-xl cursor-pointer hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                ← Back
              </button>
              {surveyStep < takingSurvey.questions.length - 1 ? (
                <button onClick={() => setSurveyStep(s => s + 1)}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[9px] font-extrabold rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button onClick={submitSurveyResponse} disabled={submittingSurveyResp}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[9px] font-extrabold rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50">
                  {submittingSurveyResp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Submit Survey
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═══════ BOARD TAB ═══════ */}
        {activeTab === 'board' && (
          <div className="p-4 space-y-4">
            {/* Search + Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search polls & surveys…" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10px] outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div className="flex gap-1.5">
                {(['poll', 'survey'] as PostType[]).map(t => (
                  <button key={t} onClick={() => setBoardType(t)}
                    className={`px-3 py-1.5 text-[9px] font-bold rounded-lg border cursor-pointer transition ${boardType === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>
                    {t === 'poll' ? '🗳️ Polls' : '📋 Surveys'}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {(['all', 'students', 'parents', 'teachers'] as const).map(a => {
                  const cfg = a === 'all' ? { emoji: '🌐', label: 'All' } : AUDIENCE_CFG[a as AudienceType];
                  return (
                    <button key={a} onClick={() => setAudienceFilter(a)}
                      className={`text-[8px] font-bold px-2.5 py-1 rounded-full border cursor-pointer transition ${audienceFilter === a ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>
                      {cfg.emoji} {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── POLLS BOARD ── */}
            {boardType === 'poll' && (
              <div className="grid grid-cols-1 gap-4">
                {filteredPolls.map(poll => {
                  const audCfg = AUDIENCE_CFG[poll.audience];
                  const statusCfg = STATUS_CFG[poll.status];
                  const maxVotes = Math.max(...poll.options.map(o => o.votes), 1);
                  const hasVoted = poll.myVote !== null;
                  return (
                    <div key={poll.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                      {/* Header */}
                      <div className="px-5 py-4 border-b border-slate-100">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className={`text-[7.5px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${poll.status === 'active' ? 'animate-pulse' : ''}`} />
                                {statusCfg.label}
                              </span>
                              <span className={`text-[7.5px] font-bold px-2 py-0.5 rounded-full border ${audCfg.color} ${audCfg.bg} ${audCfg.border}`}>
                                {audCfg.emoji} {audCfg.label}
                              </span>
                              <span className="text-[7.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{poll.category}</span>
                            </div>
                            <h3 className="text-[12px] font-extrabold text-slate-800 leading-snug">{poll.title}</h3>
                            <div className="flex items-center gap-3 mt-1.5 text-[8px] text-slate-400 font-medium">
                              <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{poll.totalVotes} votes</span>
                              <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />Ends {poll.endsAt}</span>
                              <span>by {poll.createdBy}</span>
                            </div>
                          </div>
                          {hasVoted && (
                            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex-shrink-0">
                              <CheckCircle className="w-3 h-3" />
                              <span className="text-[8px] font-bold">Voted</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Options */}
                      <div className="px-5 py-4 space-y-3">
                        {poll.options.map(opt => {
                          const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                          const isWinner = opt.votes === maxVotes && poll.totalVotes > 0;
                          const isMyVote = poll.myVote === opt.id;
                          return (
                            <div key={opt.id}>
                              <div className="flex items-center justify-between mb-1">
                                <button
                                  disabled={hasVoted || poll.status !== 'active'}
                                  onClick={() => castVote(poll.id, opt.id)}
                                  className={`flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer group disabled:cursor-default`}>
                                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition ${isMyVote ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300 group-hover:border-indigo-400'} ${hasVoted ? '' : 'group-hover:scale-110'}`}>
                                    {isMyVote && <div className="w-full h-full rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full" /></div>}
                                  </div>
                                  <span className={`text-[10px] font-semibold truncate ${isMyVote ? 'text-indigo-700 font-bold' : 'text-slate-700'}`}>{opt.text}</span>
                                  {isWinner && hasVoted && <Award className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                                </button>
                                {(hasVoted || poll.status === 'closed') && (
                                  <span className="text-[9px] font-extrabold text-slate-600 ml-2 flex-shrink-0">{pct}%</span>
                                )}
                              </div>
                              {(hasVoted || poll.status === 'closed') && (
                                <MiniBar pct={pct} color={COLORS[poll.options.indexOf(opt) % COLORS.length]} voted={isMyVote} />
                              )}
                            </div>
                          );
                        })}
                        {!hasVoted && poll.status === 'active' && (
                          <p className="text-[8.5px] text-slate-400 font-medium mt-2">👆 Click an option to cast your vote</p>
                        )}
                        {poll.tags.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap pt-2">
                            {poll.tags.map((tag, i) => (
                              <span key={i} className="text-[7.5px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredPolls.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <BarChart2 className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="text-[11px] font-bold">No polls found</p>
                  </div>
                )}
              </div>
            )}

            {/* ── SURVEYS BOARD ── */}
            {boardType === 'survey' && (
              <div className="grid grid-cols-1 gap-4">
                {filteredSurveys.map(survey => {
                  const audCfg = AUDIENCE_CFG[survey.audience];
                  const statusCfg = STATUS_CFG[survey.status];
                  return (
                    <div key={survey.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                      <div className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white flex-shrink-0">
                            <Layers className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`text-[7.5px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${survey.status === 'active' ? 'animate-pulse' : ''}`} />
                                {statusCfg.label}
                              </span>
                              <span className={`text-[7.5px] font-bold px-2 py-0.5 rounded-full border ${audCfg.color} ${audCfg.bg} ${audCfg.border}`}>
                                {audCfg.emoji} {audCfg.label}
                              </span>
                              <span className="text-[7.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{survey.category}</span>
                            </div>
                            <h3 className="text-[12px] font-extrabold text-slate-800 leading-snug">{survey.title}</h3>
                            <p className="text-[9px] text-slate-500 mt-1 line-clamp-2">{survey.description}</p>
                          </div>
                        </div>
                        {/* Progress */}
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[8.5px] font-bold text-slate-500">Response Progress</span>
                            <span className="text-[8.5px] font-extrabold text-indigo-600">{survey.responseCount}/{survey.targetCount} — {survey.completionRate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                              style={{ width: `${survey.completionRate}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-3 text-[8px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1"><BookOpen className="w-2.5 h-2.5" />{survey.questions.length} questions</span>
                            <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />Ends {survey.endsAt}</span>
                            <span>by {survey.createdBy}</span>
                          </div>
                          {survey.status === 'active' && (
                            <button onClick={() => startSurvey(survey)}
                              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-extrabold cursor-pointer hover:opacity-90 transition shadow-sm">
                              <Send className="w-3 h-3" /> Take Survey
                            </button>
                          )}
                        </div>
                        {survey.tags.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap mt-3">
                            {survey.tags.map((tag, i) => (
                              <span key={i} className="text-[7.5px] font-bold px-2 py-0.5 bg-violet-50 text-violet-600 border border-violet-100 rounded-full">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredSurveys.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <Layers className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="text-[11px] font-bold">No surveys found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════ CREATOR TAB ═══════ */}
        {activeTab === 'creator' && (
          <div className="max-w-2xl mx-auto p-5">
            {/* Type toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1 gap-1 mb-5">
              {(['poll', 'survey'] as PostType[]).map(t => (
                <button key={t} onClick={() => setCreatorType(t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${creatorType === t ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>
                  {t === 'poll' ? <><BarChart2 className="w-4 h-4" /> Quick Poll</> : <><Layers className="w-4 h-4" /> Survey Builder</>}
                </button>
              ))}
            </div>

            {/* ─ POLL CREATOR ─ */}
            {creatorType === 'poll' && (
              <form onSubmit={submitPoll} className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-indigo-600" /> Create Quick Poll</h3>
                  <div>
                    <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Poll Question *</label>
                    <textarea rows={2} placeholder="e.g. Should the school add a swimming pool?" value={pollTitle}
                      onChange={e => setPollTitle(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
                      <select value={pollCategory} onChange={e => setPollCategory(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-[9.5px] font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-300">
                        {['Academics', 'Facilities', 'Events', 'School Policy', 'HR & Staff', 'Communication', 'Transport', 'Hostel', 'General'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Target Audience</label>
                      <select value={pollAudience} onChange={e => setPollAudience(e.target.value as AudienceType)}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-[9.5px] font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-300">
                        {Object.entries(AUDIENCE_CFG).map(([k, v]) => (
                          <option key={k} value={k}>{v.emoji} {v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Closing Date</label>
                      <input type="date" value={pollEndDate} onChange={e => setPollEndDate(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-[9.5px] font-medium bg-white outline-none focus:ring-2 focus:ring-indigo-300" />
                    </div>
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Tags (comma separated)</label>
                      <input type="text" placeholder="e.g. policy, feedback" value={pollTags} onChange={e => setPollTags(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-[9.5px] font-medium outline-none focus:ring-2 focus:ring-indigo-300" />
                    </div>
                  </div>
                  {/* Options */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Answer Options *</label>
                      <button type="button" onClick={addPollOption}
                        className="flex items-center gap-1 text-[8px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer">
                        <Plus className="w-3 h-3" /> Add Option
                      </button>
                    </div>
                    <div className="space-y-2">
                      {pollOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                          <input type="text" placeholder={`Option ${i + 1}`} value={opt}
                            onChange={e => updatePollOption(i, e.target.value)}
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-300" />
                          {pollOptions.length > 2 && (
                            <button type="button" onClick={() => removePollOption(i)} className="text-slate-400 hover:text-rose-500 transition cursor-pointer">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={submittingPoll}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 hover:opacity-90 transition">
                  {submittingPoll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Publish Poll
                </button>
              </form>
            )}

            {/* ─ SURVEY BUILDER ─ */}
            {creatorType === 'survey' && (
              <form onSubmit={submitSurvey} className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2"><Layers className="w-4 h-4 text-violet-600" /> Survey Details</h3>
                  <div>
                    <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Survey Title *</label>
                    <input type="text" placeholder="e.g. Annual Parent Satisfaction Survey 2026" value={survTitle}
                      onChange={e => setSurvTitle(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-300" />
                  </div>
                  <div>
                    <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                    <textarea rows={2} placeholder="Brief description of the survey purpose…" value={survDesc}
                      onChange={e => setSurvDesc(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
                      <select value={survCategory} onChange={e => setSurvCategory(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-[9.5px] font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-300">
                        {['Academics', 'HR & Staff', 'Parent Engagement', 'Events', 'Facilities', 'Feedback', 'General'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Target Audience</label>
                      <select value={survAudience} onChange={e => setSurvAudience(e.target.value as AudienceType)}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-[9.5px] font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-300">
                        {Object.entries(AUDIENCE_CFG).map(([k, v]) => (
                          <option key={k} value={k}>{v.emoji} {v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Closing Date</label>
                      <input type="date" value={survEndDate} onChange={e => setSurvEndDate(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-[9.5px] font-medium bg-white outline-none focus:ring-2 focus:ring-indigo-300" />
                    </div>
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Tags (comma separated)</label>
                      <input type="text" placeholder="e.g. annual, feedback" value={survTags} onChange={e => setSurvTags(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-[9.5px] font-medium outline-none focus:ring-2 focus:ring-indigo-300" />
                    </div>
                  </div>
                </div>

                {/* Questions Builder */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-extrabold text-slate-800">Questions</h3>
                    <button type="button" onClick={addSurveyQuestion}
                      className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg cursor-pointer">
                      <Plus className="w-3 h-3" /> Add Question
                    </button>
                  </div>
                  {survQuestions.map((q, qi) => (
                    <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[8.5px] font-extrabold text-slate-400">Q{qi + 1}</span>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-[8px] font-bold text-slate-500 cursor-pointer">
                            <input type="checkbox" checked={q.required} onChange={e => updateSurveyQuestion(q.id, { required: e.target.checked })} className="accent-indigo-600" />
                            Required
                          </label>
                          {survQuestions.length > 1 && (
                            <button type="button" onClick={() => removeSurveyQuestion(q.id)} className="text-slate-400 hover:text-rose-500 transition cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <input type="text" placeholder="Question text…" value={q.text}
                        onChange={e => updateSurveyQuestion(q.id, { text: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-300" />
                      <div className="grid grid-cols-4 gap-1.5">
                        {(Object.keys(QTYPE_CFG) as QuestionType[]).map(qt => (
                          <button key={qt} type="button" onClick={() => updateSurveyQuestion(q.id, { type: qt, options: qt === 'single' || qt === 'multi' ? ['', ''] : undefined })}
                            className={`flex items-center justify-center gap-1 p-2 rounded-lg border text-[8px] font-bold cursor-pointer transition ${q.type === qt ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-indigo-200'}`}>
                            <span className={QTYPE_CFG[qt].color}>{QTYPE_CFG[qt].icon}</span>
                            {QTYPE_CFG[qt].label.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                      {(q.type === 'single' || q.type === 'multi') && q.options && (
                        <div className="space-y-2">
                          {q.options.map((opt, oi) => (
                            <input key={oi} type="text" placeholder={`Option ${oi + 1}`} value={opt}
                              onChange={e => updateSurveyOption(q.id, oi, e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-300" />
                          ))}
                          <button type="button" onClick={() => addSurveyOption(q.id)}
                            className="text-[8.5px] font-bold text-indigo-600 flex items-center gap-1 cursor-pointer hover:text-indigo-700">
                            <Plus className="w-3 h-3" /> Add Option
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button type="submit" disabled={submittingSurvey}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 hover:opacity-90 transition">
                  {submittingSurvey ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Publish Survey
                </button>
              </form>
            )}
          </div>
        )}

        {/* ═══════ MANAGER TAB ═══════ */}
        {activeTab === 'manager' && (
          <div className="p-4 space-y-5">
            {/* Polls manager */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-indigo-600" /> All Polls ({polls.length})</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {polls.map(poll => {
                  const statusCfg = STATUS_CFG[poll.status];
                  const audCfg = AUDIENCE_CFG[poll.audience];
                  return (
                    <div key={poll.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusCfg.dot} ${poll.status === 'active' ? 'animate-pulse' : ''}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-800 truncate">{poll.title}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-[8px] text-slate-400 font-medium">
                          <span>{audCfg.emoji} {audCfg.label}</span>
                          <span>{poll.totalVotes} votes</span>
                          <span>Ends {poll.endsAt}</span>
                          <span>by {poll.createdBy}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[7.5px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}>{statusCfg.label}</span>
                        <button onClick={() => { setSelectedAnalyticsId({ type: 'poll', id: poll.id }); setActiveTab('analytics'); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition" title="Analytics">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => sendReminder(poll.title)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer transition" title="Send Reminder">
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => togglePollStatus(poll.id)}
                          className={`p-1.5 rounded-lg cursor-pointer transition ${poll.status === 'active' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`} title="Toggle Status">
                          {poll.status === 'active' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button onClick={() => deletePoll(poll.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Surveys manager */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2"><Layers className="w-4 h-4 text-violet-600" /> All Surveys ({surveys.length})</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {surveys.map(survey => {
                  const statusCfg = STATUS_CFG[survey.status];
                  const audCfg = AUDIENCE_CFG[survey.audience];
                  return (
                    <div key={survey.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusCfg.dot} ${survey.status === 'active' ? 'animate-pulse' : ''}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-800 truncate">{survey.title}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-[8px] text-slate-400 font-medium">
                          <span>{audCfg.emoji} {audCfg.label}</span>
                          <span>{survey.responseCount}/{survey.targetCount} responses</span>
                          <span>{survey.completionRate}% complete</span>
                          <span>{survey.questions.length} questions</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[7.5px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}>{statusCfg.label}</span>
                        <button onClick={() => { setSelectedAnalyticsId({ type: 'survey', id: survey.id }); setActiveTab('analytics'); }}
                          className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg cursor-pointer transition" title="Analytics">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => sendReminder(survey.title)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer transition" title="Send Reminder">
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toggleSurveyStatus(survey.id)}
                          className={`p-1.5 rounded-lg cursor-pointer transition ${survey.status === 'active' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`} title="Toggle Status">
                          {survey.status === 'active' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button onClick={() => deleteSurvey(survey.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════ ANALYTICS TAB ═══════ */}
        {activeTab === 'analytics' && (
          <div className="flex h-full">
            {/* Left: Item selector */}
            <div className="w-72 flex-shrink-0 border-r border-slate-200 flex flex-col overflow-y-auto">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                <p className="text-[8.5px] font-extrabold text-slate-500 uppercase tracking-wider">Select a Poll or Survey</p>
              </div>
              <div className="divide-y divide-slate-100">
                {polls.map(p => {
                  const isSelected = selectedAnalyticsId?.type === 'poll' && selectedAnalyticsId.id === p.id;
                  return (
                    <button key={p.id} onClick={() => setSelectedAnalyticsId({ type: 'poll', id: p.id })}
                      className={`w-full text-left px-4 py-3 hover:bg-indigo-50/30 transition cursor-pointer ${isSelected ? 'bg-indigo-50/50 border-l-2 border-indigo-500' : ''}`}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[7px] font-extrabold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full uppercase">Poll</span>
                        <span className={`text-[7px] font-bold ${STATUS_CFG[p.status].color}`}>{STATUS_CFG[p.status].label}</span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-700 leading-tight line-clamp-2">{p.title}</p>
                      <p className="text-[7.5px] text-slate-400 mt-0.5">{p.totalVotes} votes</p>
                    </button>
                  );
                })}
                {surveys.map(s => {
                  const isSelected = selectedAnalyticsId?.type === 'survey' && selectedAnalyticsId.id === s.id;
                  return (
                    <button key={s.id} onClick={() => setSelectedAnalyticsId({ type: 'survey', id: s.id })}
                      className={`w-full text-left px-4 py-3 hover:bg-violet-50/30 transition cursor-pointer ${isSelected ? 'bg-violet-50/50 border-l-2 border-violet-500' : ''}`}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[7px] font-extrabold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full uppercase">Survey</span>
                        <span className={`text-[7px] font-bold ${STATUS_CFG[s.status].color}`}>{STATUS_CFG[s.status].label}</span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-700 leading-tight line-clamp-2">{s.title}</p>
                      <p className="text-[7.5px] text-slate-400 mt-0.5">{s.responseCount}/{s.targetCount} responses · {s.completionRate}%</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Analytics detail */}
            <div className="flex-1 overflow-y-auto p-5">
              {!analyticsItem ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300">
                  <PieChart className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-[11px] font-bold">Select a poll or survey to view analytics</p>
                </div>
              ) : selectedAnalyticsId?.type === 'poll' ? (
                /* ── POLL ANALYTICS ── */
                (() => {
                  const poll = analyticsItem as Poll;
                  const maxVotes = Math.max(...poll.options.map(o => o.votes), 1);
                  return (
                    <div className="space-y-5">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[7.5px] font-extrabold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase">Poll Analytics</span>
                          <span className={`text-[7.5px] font-bold ${STATUS_CFG[poll.status].color}`}>{STATUS_CFG[poll.status].label}</span>
                        </div>
                        <h3 className="text-[14px] font-extrabold text-slate-800 leading-snug">{poll.title}</h3>
                        <p className="text-[9px] text-slate-400 mt-1">by {poll.createdBy} · Ends {poll.endsAt}</p>
                      </div>
                      {/* KPI row */}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Total Votes', val: poll.totalVotes, color: 'text-indigo-600' },
                          { label: 'Options', val: poll.options.length, color: 'text-violet-600' },
                          { label: 'Audience', val: AUDIENCE_CFG[poll.audience].label, color: 'text-teal-600' },
                        ].map((k, i) => (
                          <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                            <div className={`text-[20px] font-extrabold ${k.color}`}>{k.val}</div>
                            <p className="text-[8px] text-slate-400 font-bold mt-0.5">{k.label}</p>
                          </div>
                        ))}
                      </div>
                      {/* Results breakdown */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <h4 className="text-[11px] font-extrabold text-slate-800">Vote Distribution</h4>
                        {poll.options.map((opt, i) => {
                          const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                          const isWinner = opt.votes === maxVotes && poll.totalVotes > 0;
                          return (
                            <div key={opt.id} className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {isWinner && <Award className="w-3.5 h-3.5 text-amber-500" />}
                                  <span className="text-[10px] font-semibold text-slate-700">{opt.text}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-bold text-slate-500">{opt.votes} votes</span>
                                  <span className="text-[10px] font-extrabold text-slate-700 w-10 text-right">{pct}%</span>
                                </div>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div className={`h-3 rounded-full transition-all duration-700 ${COLORS[i % COLORS.length]}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Audience breakdown */}
                      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-5 flex gap-3">
                        <TrendingUp className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[10px] font-extrabold text-indigo-900">Poll Insights</h4>
                          <p className="text-[9px] text-indigo-700 leading-relaxed mt-0.5">
                            This poll has received <strong>{poll.totalVotes} votes</strong> from <strong>{AUDIENCE_CFG[poll.audience].label}</strong>.
                            The leading response is "<strong>{poll.options.find(o => o.votes === maxVotes)?.text}</strong>" with {Math.round((maxVotes / poll.totalVotes) * 100)}% support.
                            {poll.status === 'active' ? ' Polling is still active and accepting responses.' : ' This poll is now closed.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* ── SURVEY ANALYTICS ── */
                (() => {
                  const survey = analyticsItem as Survey;
                  return (
                    <div className="space-y-5">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[7.5px] font-extrabold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full uppercase">Survey Analytics</span>
                          <span className={`text-[7.5px] font-bold ${STATUS_CFG[survey.status].color}`}>{STATUS_CFG[survey.status].label}</span>
                        </div>
                        <h3 className="text-[14px] font-extrabold text-slate-800 leading-snug">{survey.title}</h3>
                        <p className="text-[9px] text-slate-400 mt-1">by {survey.createdBy} · Ends {survey.endsAt}</p>
                      </div>
                      {/* KPIs */}
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: 'Responses', val: survey.responseCount, color: 'text-indigo-600' },
                          { label: 'Target', val: survey.targetCount, color: 'text-violet-600' },
                          { label: 'Completion', val: `${survey.completionRate}%`, color: 'text-emerald-600' },
                          { label: 'Questions', val: survey.questions.length, color: 'text-amber-600' },
                        ].map((k, i) => (
                          <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                            <div className={`text-[20px] font-extrabold ${k.color}`}>{k.val}</div>
                            <p className="text-[8px] text-slate-400 font-bold mt-0.5">{k.label}</p>
                          </div>
                        ))}
                      </div>
                      {/* Completion rate */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                        <h4 className="text-[11px] font-extrabold text-slate-800">Response Rate</h4>
                        <div className="flex items-center justify-between text-[9px] font-semibold text-slate-600 mb-1">
                          <span>{survey.responseCount} responded</span>
                          <span>{survey.targetCount - survey.responseCount} pending</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                          <div className="h-4 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 flex items-center justify-end pr-2"
                            style={{ width: `${survey.completionRate}%` }}>
                            <span className="text-[8px] font-extrabold text-white">{survey.completionRate}%</span>
                          </div>
                        </div>
                        {/* Audience distribution */}
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          {[
                            { label: 'Students', count: Math.round(survey.responseCount * 0.6), color: 'bg-blue-400' },
                            { label: 'Parents', count: Math.round(survey.responseCount * 0.25), color: 'bg-emerald-400' },
                            { label: 'Teachers', count: Math.round(survey.responseCount * 0.15), color: 'bg-violet-400' },
                          ].map((a, i) => (
                            <div key={i} className="text-center">
                              <div className={`w-10 h-10 rounded-full ${a.color} mx-auto flex items-center justify-center text-white font-extrabold text-[11px]`}>{a.count}</div>
                              <p className="text-[8px] text-slate-500 font-bold mt-1">{a.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Questions preview */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                        <h4 className="text-[11px] font-extrabold text-slate-800">Questions Overview</h4>
                        {survey.questions.map((q, qi) => (
                          <div key={q.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[8px] font-extrabold flex items-center justify-center flex-shrink-0">Q{qi + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-bold text-slate-700 truncate">{q.text || '(untitled)'}</p>
                              <span className={`text-[7.5px] font-bold ${QTYPE_CFG[q.type].color}`}>{QTYPE_CFG[q.type].label}</span>
                            </div>
                            {q.required && <span className="text-[7px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-full flex-shrink-0">Required</span>}
                          </div>
                        ))}
                      </div>
                      {/* Text feedbacks */}
                      {survey.textFeedbacks.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                          <h4 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-violet-600" /> Text Feedback Samples</h4>
                          <div className="space-y-2">
                            {survey.textFeedbacks.map((fb, i) => (
                              <div key={i} className="flex gap-3 p-3 bg-violet-50/40 border border-violet-100 rounded-xl">
                                <div className="w-5 h-5 rounded-full bg-violet-200 flex-shrink-0 flex items-center justify-center text-[7px] font-extrabold text-violet-700">{String.fromCharCode(65 + i)}</div>
                                <p className="text-[9px] text-slate-700 leading-relaxed">"{fb}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PollsSurveys;
