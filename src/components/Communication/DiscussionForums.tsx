import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  MessageSquare, ThumbsUp, ThumbsDown, CheckCircle, Plus, Search,
  Tag, Eye, Clock, User, Bookmark, BookmarkCheck, Flag, Share2,
  ChevronDown, ChevronUp, ChevronRight, TrendingUp, Hash, Award,
  Star, BarChart2, Users, Filter, RefreshCw, Send, Edit3, Trash2,
  Pin, Lock, Globe, MoreVertical, Bell, AlertCircle, FileText,
  GraduationCap, BookOpen, Megaphone, Coffee, Zap, HelpCircle,
  ArrowUp, ArrowDown, Check, X, LifeBuoy, Lightbulb, Flame,
  MessageCircle, PieChart, Calendar, Activity, Layers, Info,
  PenSquare, AtSign, Link2, Image, Code, Bold, Italic
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type MainTab = 'forums' | 'qna' | 'trending' | 'my_activity' | 'analytics';
type ForumCategory = 'academics' | 'parents' | 'events' | 'general' | 'suggestions' | 'sports' | 'tech_help' | 'alumni';
type QAStatus = 'open' | 'answered' | 'closed';
type AuthorType = 'student' | 'parent' | 'teacher' | 'admin' | 'staff';

// ─── INTERFACES ───────────────────────────────────────────────────────────────

interface ForumThread {
  id: number;
  title: string;
  body: string;
  category: ForumCategory;
  authorName: string;
  authorType: AuthorType;
  authorClass?: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  replyCount: number;
  likes: number;
  isLiked: boolean;
  isPinned: boolean;
  isLocked: boolean;
  isSolved: boolean;
  isBookmarked: boolean;
  tags: string[];
  lastReplyBy: string;
  lastReplyTime: string;
  replies: ThreadReply[];
}

interface ThreadReply {
  id: number;
  threadId: number;
  authorName: string;
  authorType: AuthorType;
  body: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  isBestAnswer: boolean;
  isStaffResponse: boolean;
  nestedReplies: NestedReply[];
}

interface NestedReply {
  id: number;
  authorName: string;
  authorType: AuthorType;
  body: string;
  createdAt: string;
}

interface QAQuestion {
  id: number;
  title: string;
  body: string;
  category: ForumCategory;
  authorName: string;
  authorType: AuthorType;
  authorClass?: string;
  createdAt: string;
  votes: number;
  myVote: -1 | 0 | 1;
  views: number;
  answerCount: number;
  status: QAStatus;
  isBookmarked: boolean;
  tags: string[];
  answers: QAAnswer[];
}

interface QAAnswer {
  id: number;
  questionId: number;
  authorName: string;
  authorType: AuthorType;
  body: string;
  createdAt: string;
  votes: number;
  myVote: -1 | 0 | 1;
  isAccepted: boolean;
}

interface NewPostForm {
  title: string;
  body: string;
  category: ForumCategory;
  tags: string;
  postType: 'thread' | 'question';
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_THREADS: ForumThread[] = [
  {
    id: 1, title: 'Best strategy for Class 12 Board Exam preparation – share your tips!',
    body: 'With only 8 months left for the Class 12 boards, I want to start a discussion on the most effective preparation strategies. I\'ve been trying NCERT + reference books approach but feeling overwhelmed. What has worked for seniors and teachers? Looking for subject-wise tips especially for Math and Physics.\n\nKey questions:\n1. How many months in advance should we start full revision?\n2. Should we do chapter tests or full syllabus mocks?\n3. Any recommended online resources for CBSE board prep?',
    category: 'academics', authorName: 'Aarav Mishra', authorType: 'student', authorClass: 'Class 12-A',
    createdAt: '2026-06-24 08:00 AM', updatedAt: '2026-06-24 11:30 AM',
    views: 284, replyCount: 14, likes: 47, isLiked: false, isPinned: true, isLocked: false,
    isSolved: false, isBookmarked: false, tags: ['board-exam', 'class-12', 'strategy', 'CBSE'],
    lastReplyBy: 'Mrs. S. Verma (HOD)', lastReplyTime: '11:30 AM',
    replies: [
      { id: 1, threadId: 1, authorName: 'Mrs. S. Verma', authorType: 'teacher', body: 'Great initiative, Aarav! For Class 12, I always recommend a 3-phase approach:\n\n📌 Phase 1 (June-Sep): Complete all NCERT chapters thoroughly. Every line matters.\n📌 Phase 2 (Oct-Dec): Previous year papers from 2015-2025. Identify repeated question patterns.\n📌 Phase 3 (Jan-Mar): Full-length mock tests under timed conditions.\n\nFor Math – NCERT + R.D. Sharma for extra practice. For Physics – H.C. Verma concepts + NCERT examples.', createdAt: '2026-06-24 09:30 AM', likes: 38, isLiked: true, isBestAnswer: true, isStaffResponse: true, nestedReplies: [
        { id: 1, authorName: 'Aarav Mishra', authorType: 'student', body: 'Thank you so much, Mrs. Verma! This is exactly what I needed. Will start Phase 1 from this weekend.', createdAt: '2026-06-24 09:45 AM' },
        { id: 2, authorName: 'Priya Sharma', authorType: 'student', body: 'This is super helpful! Bookmarking this reply. 🙏', createdAt: '2026-06-24 10:00 AM' }
      ]},
      { id: 2, threadId: 1, authorName: 'Rahul Gupta', authorType: 'student', body: 'I\'m a Class 12 student too. One thing that really helped me for Physics was making short formula sheets for each chapter and revising them every Sunday. Also – PYQ solving is a MUST! Most questions are from the same topics every year.', createdAt: '2026-06-24 10:15 AM', likes: 19, isLiked: false, isBestAnswer: false, isStaffResponse: false, nestedReplies: [] },
      { id: 3, threadId: 1, authorName: 'Dr. Iyer', authorType: 'teacher', body: 'For Chemistry – focus heavily on Organic Chemistry reactions and Electrochemistry numericals. These are high-scoring areas but often neglected. Also, NCERT Chemistry textbook examples are directly asked in boards.', createdAt: '2026-06-24 11:00 AM', likes: 24, isLiked: true, isBestAnswer: false, isStaffResponse: true, nestedReplies: [] }
    ]
  },
  {
    id: 2, title: 'Parent Query: Why is the school app portal showing wrong fee balance?',
    body: 'Hello, I am Rajesh Kumar, parent of Ananya Kumar in Class 8-B. My school portal is showing a fee balance of ₹12,000 as "pending" even though I paid the full Q1 fee of ₹24,500 on June 10 via NEFT. Transaction ID: AXIS2026061045789. I\'ve been waiting for 2 weeks and no receipt has been generated. This is creating unnecessary stress. Has anyone else faced this issue? How was it resolved?',
    category: 'parents', authorName: 'Mr. Rajesh Kumar', authorType: 'parent', authorClass: 'Parent of 8-B',
    createdAt: '2026-06-23 03:00 PM', updatedAt: '2026-06-24 09:00 AM',
    views: 156, replyCount: 5, likes: 12, isLiked: false, isPinned: false, isLocked: false,
    isSolved: true, isBookmarked: false, tags: ['fee', 'portal', 'payment', 'parent-query'],
    lastReplyBy: 'Mr. A. Gupta (Accounts)', lastReplyTime: '09:00 AM',
    replies: [
      { id: 1, threadId: 2, authorName: 'Mr. A. Gupta', authorType: 'admin', body: 'Dear Mr. Kumar, we sincerely apologize for this technical inconvenience. I have personally checked your payment and it has been successfully received. The portal sync issue has been resolved and the receipt (No: REC-2026-8844) has been emailed to your registered address. The pending balance has been cleared. Please log in and verify. If you still see discrepancies, email accounts@dps.edu.in directly.', createdAt: '2026-06-24 09:00 AM', likes: 14, isLiked: true, isBestAnswer: true, isStaffResponse: true, nestedReplies: [
        { id: 1, authorName: 'Mr. Rajesh Kumar', authorType: 'parent', body: 'Thank you Mr. Gupta! Receipt received and portal updated. Issue resolved. 🙏', createdAt: '2026-06-24 09:30 AM' }
      ]},
    ]
  },
  {
    id: 3, title: 'Annual Sports Day 2026 – Suggestions for Events & Activities',
    body: 'The Sports Committee is inviting suggestions from students, parents, and staff for the Annual Sports Day 2026 (tentatively scheduled for September 27). We want to make this year\'s event more inclusive and exciting!\n\nPlease share your ideas:\n• New sports events to add\n• Cultural performances between events\n• Parent participation ideas\n• Prize categories and recognition ideas\n\nBest suggestions will be shortlisted and voted upon!',
    category: 'events', authorName: 'Mr. K. Singh', authorType: 'teacher', authorClass: 'Sports Dept.',
    createdAt: '2026-06-22 10:00 AM', updatedAt: '2026-06-24 08:00 AM',
    views: 312, replyCount: 22, likes: 63, isLiked: true, isPinned: true, isLocked: false,
    isSolved: false, isBookmarked: true, tags: ['sports-day', 'events', 'suggestions', '2026'],
    lastReplyBy: 'Priya Sharma', lastReplyTime: '08:00 AM',
    replies: [
      { id: 1, threadId: 3, authorName: 'Priya Sharma', authorType: 'student', body: 'Would love to see Throwball and Kabaddi added this year! They\'re very popular among girls but never featured at school events. Also – a flash mob performance by students between events would be amazing! 🎉', createdAt: '2026-06-22 11:00 AM', likes: 29, isLiked: true, isBestAnswer: false, isStaffResponse: false, nestedReplies: [] },
      { id: 2, threadId: 3, authorName: 'Mrs. Anjali Mehta', authorType: 'parent', body: 'As a parent, I\'d love to see a "Parent-Child Relay Race" event! It would boost family bonding and make sports day special for families. Also – trophy ceremony should have subject toppers recognized alongside sports champions.', createdAt: '2026-06-22 02:00 PM', likes: 41, isLiked: false, isBestAnswer: false, isStaffResponse: false, nestedReplies: [] }
    ]
  },
  {
    id: 4, title: 'School Suggestion: Library should extend hours till 6 PM',
    body: 'I am writing this suggestion on behalf of many Class 11 and 12 students. The school library currently closes at 3:30 PM which is immediately after school ends. Many of us want to stay back and study in the library environment but cannot because of this restriction. Most coaching classes are in the evenings so the 3:30-5:30 window is the ideal study time.\n\nRequest: Extend library hours to 6:00 PM on weekdays. A librarian/teacher duty rotation can be arranged.',
    category: 'suggestions', authorName: 'Kavya Reddy', authorType: 'student', authorClass: 'Class 11-B',
    createdAt: '2026-06-21 04:00 PM', updatedAt: '2026-06-23 09:00 AM',
    views: 198, replyCount: 9, likes: 88, isLiked: true, isPinned: false, isLocked: false,
    isSolved: false, isBookmarked: true, tags: ['library', 'suggestion', 'student-welfare'],
    lastReplyBy: 'Ms. P. Nair (Vice Principal)', lastReplyTime: '2026-06-23',
    replies: [
      { id: 1, threadId: 4, authorName: 'Ms. P. Nair', authorType: 'admin', body: 'Thank you Kavya for this well-articulated suggestion. This has been forwarded to the Principal\'s office for review. We will put up a formal proposal in the upcoming staff meeting. We appreciate students taking initiative through proper channels.', createdAt: '2026-06-23 09:00 AM', likes: 33, isLiked: true, isBestAnswer: false, isStaffResponse: true, nestedReplies: [] }
    ]
  },
  {
    id: 5, title: 'How to prepare for School Science Olympiad (NSO/NTSE)?',
    body: 'I want to appear for NSO and NTSE this year. I\'m in Class 9 and don\'t know where to start. Which books should I refer? How is the NTSE exam pattern different from school exams? Any seniors who appeared and have tips?',
    category: 'academics', authorName: 'Arjun Patel', authorType: 'student', authorClass: 'Class 9-A',
    createdAt: '2026-06-20 06:00 PM', updatedAt: '2026-06-21 10:00 AM',
    views: 447, replyCount: 18, likes: 72, isLiked: false, isPinned: false, isLocked: false,
    isSolved: true, isBookmarked: false, tags: ['olympiad', 'NTSE', 'NSO', 'class-9'],
    lastReplyBy: 'Dr. Iyer', lastReplyTime: '2026-06-21',
    replies: [
      { id: 1, threadId: 5, authorName: 'Dr. Iyer', authorType: 'teacher', body: 'Great ambition, Arjun!\n\nFor NSO (Science Olympiad):\n• MTG Foundation Science Books (Class 9)\n• Previous year papers from Science Olympiad Foundation website\n• Focus on: Motion, Force, Atoms and Molecules, Biological Diversity\n\nFor NTSE:\n• Part 1 (MAT): Mental Ability – practice Verbal & Non-Verbal Reasoning daily\n• Part 2 (SAT): Science + Social Science + Math – NCERT is base, Pearson NTSE guide for extra\n\nExam pattern differs significantly – multiple choice, no negative marking in SAT.', createdAt: '2026-06-21 09:00 AM', likes: 56, isLiked: true, isBestAnswer: true, isStaffResponse: true, nestedReplies: [] }
    ]
  }
];

const MOCK_QUESTIONS: QAQuestion[] = [
  {
    id: 1, title: 'What is the exact formula sheet allowed in CBSE Class 12 Physics board exam?',
    body: 'I heard CBSE allows a formula sheet in the exam hall for Physics. Is this true? If yes, what formulas are included? And do we need to bring it ourselves or is it provided by the school?\n\nContext: Board exam is in March 2027, currently in Class 12.', category: 'academics',
    authorName: 'Siddharth Rao', authorType: 'student', authorClass: 'Class 12-B',
    createdAt: '2026-06-24 07:30 AM', votes: 34, myVote: 0, views: 892, answerCount: 3,
    status: 'answered', isBookmarked: false, tags: ['CBSE', 'physics', 'board-exam', 'formula'],
    answers: [
      { id: 1, questionId: 1, authorName: 'Mrs. S. Verma', authorType: 'teacher', body: 'This is a common misconception. CBSE does NOT provide any official formula sheet in the exam hall. However, CBSE Class 12 Physics question papers do include some key constants at the top of the paper (like speed of light, Planck\'s constant, charge of electron etc.).\n\nWhat you CAN do: In the exam, in the first 15 minutes of reading time, quickly write key formulas on rough work space. You\'re allowed to use the rough section of the answer sheet.\n\nMy advice: Do not depend on cheat sheets. Understand and internalize formulas through daily practice.', createdAt: '2026-06-24 08:00 AM', votes: 42, myVote: 1, isAccepted: true },
      { id: 2, questionId: 1, authorName: 'Rahul Gupta', authorType: 'student', body: 'Adding to the teacher\'s answer – I wrote a complete formula booklet for myself during preparation. Even if you can\'t take it in, making it yourself helps you remember! I can share my formula sheet PDF if anyone wants.', createdAt: '2026-06-24 09:00 AM', votes: 18, myVote: 0, isAccepted: false },
    ]
  },
  {
    id: 2, title: 'How does the school calculate internal assessment marks for Class 10?',
    body: 'I\'m a parent trying to understand how internal assessment (IA) marks are computed for CBSE Class 10. My child got 18/20 in IA but I want to understand the breakup – periodic tests, notebook, subject enrichment etc. Can someone explain the exact formula?',
    category: 'academics', authorName: 'Mrs. Anita Khanna', authorType: 'parent', authorClass: 'Parent of 10-A',
    createdAt: '2026-06-23 05:00 PM', votes: 21, myVote: 0, views: 543, answerCount: 2,
    status: 'answered', isBookmarked: true, tags: ['internal-assessment', 'CBSE', 'class-10', 'parent'],
    answers: [
      { id: 1, questionId: 2, authorName: 'Mrs. S. Verma', authorType: 'teacher', body: 'CBSE Internal Assessment for Class 10 is 20 marks total, broken into:\n\n📌 Periodic Tests (10 marks): Best 2 out of 3 tests conducted during the year, average taken\n📌 Notebook Submission (5 marks): Regularity, neatness, quality of work\n📌 Subject Enrichment (5 marks): Activities specific to each subject (e.g., lab work for Science, map work for Social Science)\n\nFor your child\'s 18/20 – it is a very good score. The school will share the detailed breakup on the student portal under "Assessment Reports".', createdAt: '2026-06-23 06:00 PM', votes: 29, myVote: 1, isAccepted: true },
    ]
  },
  {
    id: 3, title: 'Is there a school bus route that covers the Sector 45 Noida area?',
    body: 'We are a new family relocating to Sector 45, Noida next month. Our daughter will be joining Class 6. Can someone tell me if there is a school bus route covering this area? Also, what are the typical pickup and drop timings?\n\nIf no route exists, can a new route be requested?',
    category: 'parents', authorName: 'Mr. Suresh Jain', authorType: 'parent',
    createdAt: '2026-06-22 02:00 PM', votes: 8, myVote: 0, views: 234, answerCount: 1,
    status: 'open', isBookmarked: false, tags: ['bus', 'transport', 'routes', 'noida'],
    answers: [
      { id: 1, questionId: 3, authorName: 'Mr. V. Singh', authorType: 'staff', body: 'Welcome to the school family, Mr. Jain! Currently Route 9 covers parts of Sector 45 (stop at Sector 45 Market, Gate 2). Pickup is at 7:00 AM and drop is around 3:45 PM. Please contact the transport office (transport@dps.edu.in) to confirm your exact address and check if it falls within the route coverage. Route extensions are reviewed every quarter.', createdAt: '2026-06-22 04:00 PM', votes: 15, myVote: 0, isAccepted: false },
    ]
  },
  {
    id: 4, title: 'Why was the school Wi-Fi blocked on student devices during lunch break?',
    body: 'Previously students could use school Wi-Fi during lunch and free periods to study online. Since June 15, the Wi-Fi access has been blocked on personal devices completely. No official circular was issued about this. Can admin clarify the reason and if this is permanent?',
    category: 'tech_help', authorName: 'Meera Pillai', authorType: 'student', authorClass: 'Class 11-A',
    createdAt: '2026-06-20 01:00 PM', votes: 56, myVote: 1, views: 1204, answerCount: 1,
    status: 'answered', isBookmarked: false, tags: ['wifi', 'network', 'school-policy', 'IT'],
    answers: [
      { id: 1, questionId: 4, authorName: 'IT Support Team', authorType: 'admin', body: 'This change was implemented as part of our new Digital Discipline Policy (Circular No. CIR/2026/018). Key reasons:\n1. Excessive social media usage was causing distraction during study periods\n2. Bandwidth was insufficient for both academic and personal use\n\nWi-Fi is now available on school devices (Chromebooks/tablets) in the computer lab and digital library during designated hours. Personal devices can access guest Wi-Fi in the library for educational purposes only (filtered). A formal communication will be issued by end of week.', createdAt: '2026-06-21 09:00 AM', votes: 33, myVote: 0, isAccepted: true },
    ]
  },
  {
    id: 5, title: 'Can parents attend the Annual Science Exhibition on July 15?',
    body: 'My child has a project in the Annual Science Exhibition on July 15. Are parents allowed to attend? Do we need prior registration or passes? What are the visiting hours?',
    category: 'events', authorName: 'Mrs. Rekha Iyer', authorType: 'parent',
    createdAt: '2026-06-19 09:00 AM', votes: 15, myVote: 0, views: 387, answerCount: 0,
    status: 'open', isBookmarked: false, tags: ['science-exhibition', 'parents', 'events'],
    answers: []
  }
];

// ─── CONFIG MAPS ──────────────────────────────────────────────────────────────

const CATEGORY_CFG: Record<ForumCategory, { label: string; color: string; bg: string; border: string; emoji: string; desc: string }> = {
  academics:   { label: 'Academics',       color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',   emoji: '📚', desc: 'Study tips, syllabus, exam prep' },
  parents:     { label: 'Parents Corner',  color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',emoji: '👨‍👩‍👧', desc: 'Fee, admissions, parent queries' },
  events:      { label: 'Events & Fests',  color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',  emoji: '🎉', desc: 'School events, fests, cultural' },
  general:     { label: 'General',         color: 'text-slate-700',   bg: 'bg-slate-100',  border: 'border-slate-200',  emoji: '💬', desc: 'General school discussions' },
  suggestions: { label: 'Suggestions',     color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200', emoji: '💡', desc: 'Ideas to improve school life' },
  sports:      { label: 'Sports & Fitness',color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200', emoji: '⚽', desc: 'Sports events, teams, fitness' },
  tech_help:   { label: 'Tech & IT Help',  color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200',   emoji: '💻', desc: 'Portal issues, IT queries' },
  alumni:      { label: 'Alumni Connect',  color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',   emoji: '🎓', desc: 'Alumni network, career tips' },
};

const AUTHOR_CFG: Record<AuthorType, { label: string; color: string; bg: string }> = {
  student: { label: 'Student',  color: 'text-blue-700',    bg: 'bg-blue-50' },
  parent:  { label: 'Parent',   color: 'text-emerald-700', bg: 'bg-emerald-50' },
  teacher: { label: 'Teacher',  color: 'text-violet-700',  bg: 'bg-violet-50' },
  admin:   { label: 'Admin',    color: 'text-rose-700',    bg: 'bg-rose-50' },
  staff:   { label: 'Staff',    color: 'text-amber-700',   bg: 'bg-amber-50' },
};

const QA_STATUS_CFG: Record<QAStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  open:     { label: 'Unanswered', color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',   icon: <HelpCircle className="w-3 h-3" /> },
  answered: { label: 'Answered',   color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',icon: <CheckCircle className="w-3 h-3" /> },
  closed:   { label: 'Closed',     color: 'text-slate-600',   bg: 'bg-slate-100',  border: 'border-slate-200',  icon: <Lock className="w-3 h-3" /> },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

let idCounter = 100;

const MiniBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
  <div className="w-full bg-slate-100 rounded-full h-1.5">
    <div className={`h-1.5 rounded-full ${color} transition-all duration-700`}
      style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }} />
  </div>
);

const Avatar: React.FC<{ name: string; role: AuthorType; size?: 'sm' | 'md' | 'lg'; isStaff?: boolean }> = ({ name, role, size = 'sm', isStaff }) => {
  const cfg = AUTHOR_CFG[role];
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const sizes = { sm: 'w-6 h-6 text-[8px]', md: 'w-8 h-8 text-[9px]', lg: 'w-10 h-10 text-[11px]' };
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-extrabold flex-shrink-0 relative ${cfg.bg} ${cfg.color}`}>
      {initials}
      {isStaff && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const DiscussionForums: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('forums');
  const [threads, setThreads] = useState<ForumThread[]>(MOCK_THREADS);
  const [questions, setQuestions] = useState<QAQuestion[]>(MOCK_QUESTIONS);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(MOCK_THREADS[0]);
  const [selectedQuestion, setSelectedQuestion] = useState<QAQuestion | null>(MOCK_QUESTIONS[0]);
  const [activeCategory, setActiveCategory] = useState<ForumCategory | 'all'>('all');
  const [qaCategory, setQACategory] = useState<ForumCategory | 'all'>('all');
  const [qaStatusFilter, setQAStatusFilter] = useState<QAStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [composeForm, setComposeForm] = useState<NewPostForm>({ title: '', body: '', category: 'academics', tags: '', postType: 'thread' });
  const [posting, setPosting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [qaAnswerText, setQAAnswerText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set([1]));
  const [expandedNestedReply, setExpandedNestedReply] = useState<number | null>(null);
  const [nestedReplyText, setNestedReplyText] = useState('');

  // Stats
  const totalThreads = threads.length;
  const solvedThreads = threads.filter(t => t.isSolved).length;
  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter(q => q.status === 'answered').length;
  const unansweredQuestions = questions.filter(q => q.status === 'open' && q.answers.length === 0).length;
  const totalViews = threads.reduce((acc, t) => acc + t.views, 0) + questions.reduce((acc, q) => acc + q.views, 0);

  // Filtered threads
  const filteredThreads = threads.filter(t => {
    if (activeCategory !== 'all' && t.category !== activeCategory) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !t.authorName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.likes - a.likes;
  });

  // Filtered questions
  const filteredQuestions = questions.filter(q => {
    if (qaCategory !== 'all' && q.category !== qaCategory) return false;
    if (qaStatusFilter !== 'all' && q.status !== qaStatusFilter) return false;
    if (searchQuery && !q.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.votes - a.votes);

  // Handlers
  const likeThread = (id: number) => {
    setThreads(prev => prev.map(t => t.id === id
      ? { ...t, likes: t.isLiked ? t.likes - 1 : t.likes + 1, isLiked: !t.isLiked }
      : t));
    if (selectedThread?.id === id) {
      setSelectedThread(prev => prev ? { ...prev, likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1, isLiked: !prev.isLiked } : prev);
    }
  };

  const bookmarkThread = (id: number) => {
    setThreads(prev => prev.map(t => t.id === id ? { ...t, isBookmarked: !t.isBookmarked } : t));
    if (selectedThread?.id === id) {
      setSelectedThread(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : prev);
    }
    toast.success('Bookmark updated!');
  };

  const likeReply = (threadId: number, replyId: number) => {
    const updater = (t: ForumThread): ForumThread => ({
      ...t,
      replies: t.replies.map(r => r.id === replyId
        ? { ...r, likes: r.isLiked ? r.likes - 1 : r.likes + 1, isLiked: !r.isLiked }
        : r)
    });
    setThreads(prev => prev.map(t => t.id === threadId ? updater(t) : t));
    setSelectedThread(prev => prev?.id === threadId ? updater(prev) : prev);
  };

  const voteQuestion = (qId: number, dir: 1 | -1) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      const prev_vote = q.myVote;
      const newVote = (prev_vote === dir ? 0 : dir) as -1 | 0 | 1;
      const delta = newVote - prev_vote;
      return { ...q, votes: q.votes + delta, myVote: newVote };
    }));
    setSelectedQuestion(prev => {
      if (!prev || prev.id !== qId) return prev;
      const prev_vote = prev.myVote;
      const newVote = (prev_vote === dir ? 0 : dir) as -1 | 0 | 1;
      const delta = newVote - prev_vote;
      return { ...prev, votes: prev.votes + delta, myVote: newVote };
    });
  };

  const voteAnswer = (qId: number, aId: number, dir: 1 | -1) => {
    const updater = (q: QAQuestion): QAQuestion => ({
      ...q,
      answers: q.answers.map(a => {
        if (a.id !== aId) return a;
        const prev_vote = a.myVote;
        const newVote = (prev_vote === dir ? 0 : dir) as -1 | 0 | 1;
        const delta = newVote - prev_vote;
        return { ...a, votes: a.votes + delta, myVote: newVote };
      })
    });
    setQuestions(prev => prev.map(q => q.id === qId ? updater(q) : q));
    setSelectedQuestion(prev => prev?.id === qId ? updater(prev) : prev);
  };

  const acceptAnswer = (qId: number, aId: number) => {
    const updater = (q: QAQuestion): QAQuestion => ({
      ...q, status: 'answered',
      answers: q.answers.map(a => ({ ...a, isAccepted: a.id === aId ? !a.isAccepted : false }))
    });
    setQuestions(prev => prev.map(q => q.id === qId ? updater(q) : q));
    setSelectedQuestion(prev => prev?.id === qId ? updater(prev) : prev);
    toast.success('✅ Answer marked as accepted!');
  };

  const sendThreadReply = async () => {
    if (!replyText.trim() || !selectedThread) { toast.error('Reply cannot be empty'); return; }
    setSendingReply(true);
    await new Promise(r => setTimeout(r, 900));
    setSendingReply(false);
    const newReply: ThreadReply = {
      id: ++idCounter, threadId: selectedThread.id, authorName: 'You',
      authorType: 'student', body: replyText,
      createdAt: new Date().toLocaleString('en-IN'), likes: 0, isLiked: false,
      isBestAnswer: false, isStaffResponse: false, nestedReplies: []
    };
    const updater = (t: ForumThread): ForumThread => ({
      ...t, replyCount: t.replyCount + 1, replies: [...t.replies, newReply],
      lastReplyBy: 'You', lastReplyTime: 'just now'
    });
    setThreads(prev => prev.map(t => t.id === selectedThread.id ? updater(t) : t));
    setSelectedThread(prev => prev ? updater(prev) : prev);
    setReplyText('');
    toast.success('💬 Reply posted!');
  };

  const sendQAAnswer = async () => {
    if (!qaAnswerText.trim() || !selectedQuestion) { toast.error('Answer cannot be empty'); return; }
    setSendingReply(true);
    await new Promise(r => setTimeout(r, 900));
    setSendingReply(false);
    const newAnswer: QAAnswer = {
      id: ++idCounter, questionId: selectedQuestion.id, authorName: 'You',
      authorType: 'student', body: qaAnswerText,
      createdAt: new Date().toLocaleString('en-IN'), votes: 0, myVote: 0, isAccepted: false
    };
    const updater = (q: QAQuestion): QAQuestion => ({
      ...q, answerCount: q.answerCount + 1, status: 'answered',
      answers: [...q.answers, newAnswer]
    });
    setQuestions(prev => prev.map(q => q.id === selectedQuestion.id ? updater(q) : q));
    setSelectedQuestion(prev => prev ? updater(prev) : prev);
    setQAAnswerText('');
    toast.success('✅ Your answer has been posted!');
  };

  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeForm.title.trim() || !composeForm.body.trim()) { toast.error('Title and body are required'); return; }
    setPosting(true);
    await new Promise(r => setTimeout(r, 1400));
    setPosting(false);
    if (composeForm.postType === 'thread') {
      const newThread: ForumThread = {
        id: ++idCounter, title: composeForm.title, body: composeForm.body,
        category: composeForm.category, authorName: 'You', authorType: 'student',
        authorClass: 'Class 11', createdAt: new Date().toLocaleString('en-IN'),
        updatedAt: new Date().toLocaleString('en-IN'), views: 1, replyCount: 0,
        likes: 0, isLiked: false, isPinned: false, isLocked: false, isSolved: false,
        isBookmarked: false, tags: composeForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        lastReplyBy: '—', lastReplyTime: 'just now', replies: []
      };
      setThreads(prev => [newThread, ...prev]);
      setSelectedThread(newThread);
      setActiveTab('forums');
      toast.success('🎉 Forum thread created!');
    } else {
      const newQ: QAQuestion = {
        id: ++idCounter, title: composeForm.title, body: composeForm.body,
        category: composeForm.category, authorName: 'You', authorType: 'student',
        authorClass: 'Class 11', createdAt: new Date().toLocaleString('en-IN'),
        votes: 0, myVote: 0, views: 1, answerCount: 0, status: 'open',
        isBookmarked: false, tags: composeForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        answers: []
      };
      setQuestions(prev => [newQ, ...prev]);
      setSelectedQuestion(newQ);
      setActiveTab('qna');
      toast.success('❓ Question posted! Community will respond soon.');
    }
    setComposeForm({ title: '', body: '', category: 'academics', tags: '', postType: 'thread' });
    setShowCompose(false);
  };

  const bookmarkQuestion = (id: number) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, isBookmarked: !q.isBookmarked } : q));
    toast.success('Bookmark updated!');
  };

  return (
    <div className="h-[calc(100vh-120px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-teal-700 to-cyan-700 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/10 rounded-lg"><MessageCircle className="w-4 h-4" /></div>
          <div>
            <h1 className="font-extrabold text-[11px] tracking-tight leading-tight">Discussion Forums & Q&A Board</h1>
            <p className="text-[9px] text-teal-200 font-medium">Forums · Q&A · Trending · My Activity · Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <Eye className="w-3 h-3 text-teal-200" />
            <span className="text-[9px] font-bold">{totalViews.toLocaleString()} views</span>
          </div>
          {unansweredQuestions > 0 && (
            <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/30 px-2.5 py-1 rounded-full animate-pulse">
              <HelpCircle className="w-3 h-3 text-amber-300" />
              <span className="text-[9px] font-bold text-amber-200">{unansweredQuestions} need answers</span>
            </div>
          )}
          <button onClick={() => setShowCompose(true)}
            className="flex items-center gap-1.5 bg-white text-teal-700 hover:bg-teal-50 px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition cursor-pointer shadow-sm">
            <PenSquare className="w-3.5 h-3.5" /> New Post
          </button>
        </div>
      </div>

      {/* ── STAT PILLS ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-teal-50/30 border-b border-teal-100 flex-shrink-0 overflow-x-auto">
        {[
          { label: 'Threads', val: totalThreads, icon: <MessageSquare className="w-3 h-3" />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Solved', val: solvedThreads, icon: <CheckCircle className="w-3 h-3" />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Questions', val: totalQuestions, icon: <HelpCircle className="w-3 h-3" />, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
          { label: 'Answered', val: answeredQuestions, icon: <Award className="w-3 h-3" />, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
          { label: 'Need Answers', val: unansweredQuestions, icon: <AlertCircle className="w-3 h-3" />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Categories', val: Object.keys(CATEGORY_CFG).length, icon: <Hash className="w-3 h-3" />, color: 'text-slate-600', bg: 'bg-white', border: 'border-slate-200' },
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
          { key: 'forums',      label: 'Discussion Forums',  icon: <MessageSquare className="w-3.5 h-3.5" />, badge: threads.filter(t => !t.isSolved).length },
          { key: 'qna',         label: 'Q&A Board',          icon: <HelpCircle className="w-3.5 h-3.5" />,    badge: unansweredQuestions },
          { key: 'trending',    label: 'Trending',           icon: <Flame className="w-3.5 h-3.5" /> },
          { key: 'my_activity', label: 'My Activity',        icon: <Star className="w-3.5 h-3.5" /> },
          { key: 'analytics',   label: 'Analytics',          icon: <BarChart2 className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as MainTab)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition ${activeTab === t.key ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {t.icon} {t.label}
            {'badge' in t && (t as any).badge > 0 && (
              <span className="bg-teal-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full">{(t as any).badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── COMPOSE MODAL ── */}
      {showCompose && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-teal-200 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-4 text-white flex items-center justify-between">
              <h3 className="text-[12px] font-extrabold">Create New Post</h3>
              <button onClick={() => setShowCompose(false)} className="p-1 hover:bg-white/20 rounded cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCompose} className="p-5 space-y-3">
              {/* Post type toggle */}
              <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                {(['thread', 'question'] as const).map(type => (
                  <button key={type} type="button"
                    onClick={() => setComposeForm({ ...composeForm, postType: type })}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9.5px] font-extrabold transition cursor-pointer ${composeForm.postType === type ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500'}`}>
                    {type === 'thread' ? <><MessageSquare className="w-3.5 h-3.5" /> Discussion Thread</> : <><HelpCircle className="w-3.5 h-3.5" /> Q&A Question</>}
                  </button>
                ))}
              </div>

              <input type="text" placeholder={composeForm.postType === 'thread' ? 'Thread title – be descriptive…' : 'Ask a clear, specific question…'}
                value={composeForm.title} onChange={e => setComposeForm({ ...composeForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-teal-300" />

              <textarea rows={5} placeholder={composeForm.postType === 'thread'
                ? 'Share your thoughts, context, and what you\'re looking to discuss…'
                : 'Describe your question in detail. Include what you\'ve already tried, relevant context, and any specific constraints…'}
                value={composeForm.body} onChange={e => setComposeForm({ ...composeForm, body: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-teal-300" />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8.5px] font-bold text-slate-500">Category</label>
                  <select value={composeForm.category} onChange={e => setComposeForm({ ...composeForm, category: e.target.value as ForumCategory })}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-[9px] font-bold bg-white outline-none focus:ring-2 focus:ring-teal-300">
                    {Object.entries(CATEGORY_CFG).map(([k, v]) => (
                      <option key={k} value={k}>{v.emoji} {v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8.5px] font-bold text-slate-500">Tags (comma-separated)</label>
                  <input type="text" placeholder="e.g. board-exam, CBSE, class-12"
                    value={composeForm.tags} onChange={e => setComposeForm({ ...composeForm, tags: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-[9px] font-medium outline-none focus:ring-2 focus:ring-teal-300" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={() => setShowCompose(false)} className="px-4 py-2 border border-slate-200 text-[9px] font-bold text-slate-500 rounded-xl cursor-pointer hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={posting}
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-[9px] font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50">
                  {posting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {composeForm.postType === 'thread' ? 'Post Thread' : 'Post Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═════════ FORUMS TAB ═════════ */}
        {activeTab === 'forums' && (
          <div className="flex h-full" style={{ minHeight: '100%' }}>

            {/* Left: Thread List */}
            <div className="w-[380px] flex-shrink-0 border-r border-slate-200 flex flex-col overflow-y-auto">
              {/* Search + Filter */}
              <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 space-y-2 z-10">
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search threads…" value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10px] outline-none focus:ring-2 focus:ring-teal-300" />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(['all', 'academics', 'parents', 'events', 'suggestions', 'sports', 'tech_help'] as const).map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)}
                      className={`text-[7.5px] font-bold px-2 py-1 rounded-full border cursor-pointer transition ${activeCategory === cat ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-500 border-slate-200 hover:border-teal-300'}`}>
                      {cat === 'all' ? '🌐 All' : `${CATEGORY_CFG[cat as ForumCategory].emoji} ${CATEGORY_CFG[cat as ForumCategory].label}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Thread rows */}
              <div className="flex-1 divide-y divide-slate-100">
                {filteredThreads.map(thread => {
                  const cat = CATEGORY_CFG[thread.category];
                  const isSelected = selectedThread?.id === thread.id;
                  return (
                    <div key={thread.id} onClick={() => setSelectedThread(thread)}
                      className={`px-3 py-2.5 cursor-pointer hover:bg-teal-50/20 transition ${isSelected ? 'bg-teal-50/40 border-l-2 border-teal-600' : ''}`}>
                      <div className="flex items-start gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${cat.bg}`}>{cat.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                            {thread.isPinned && <Pin className="w-2.5 h-2.5 text-amber-500 fill-amber-500 flex-shrink-0" />}
                            {thread.isSolved && <CheckCircle className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" />}
                            {thread.isLocked && <Lock className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />}
                            <p className="text-[9.5px] font-bold text-slate-800 leading-tight line-clamp-2">{thread.title}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className={`text-[7px] font-bold px-1.5 py-0.2 rounded-full ${cat.bg} ${cat.color}`}>{cat.label}</span>
                            <span className={`text-[7px] font-bold px-1.5 py-0.2 rounded-full ${AUTHOR_CFG[thread.authorType].bg} ${AUTHOR_CFG[thread.authorType].color}`}>{thread.authorName.split(' ').slice(0, 2).join(' ')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[7.5px] text-slate-400 font-medium">
                            <span className="flex items-center gap-0.5"><ThumbsUp className="w-2 h-2" /> {thread.likes}</span>
                            <span className="flex items-center gap-0.5"><MessageSquare className="w-2 h-2" /> {thread.replyCount}</span>
                            <span className="flex items-center gap-0.5"><Eye className="w-2 h-2" /> {thread.views}</span>
                            <span className="ml-auto flex items-center gap-0.5"><Clock className="w-2 h-2" /> {thread.lastReplyTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Thread Detail */}
            <div className="flex-1 overflow-y-auto bg-slate-50/20">
              {!selectedThread ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <MessageCircle className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-[11px]">Select a thread to read and reply</p>
                </div>
              ) : (() => {
                const t = selectedThread;
                const cat = CATEGORY_CFG[t.category];
                return (
                  <div className="flex flex-col h-full">
                    {/* Thread Header */}
                    <div className="bg-white border-b border-slate-200 px-5 py-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${cat.bg}`}>{cat.emoji}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {t.isPinned && <span className="text-[7.5px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Pin className="w-2.5 h-2.5" /> Pinned</span>}
                            {t.isSolved && <span className="text-[7.5px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><CheckCircle className="w-2.5 h-2.5" /> Solved</span>}
                            <span className={`text-[7.5px] font-bold px-1.5 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>{cat.label}</span>
                          </div>
                          <h2 className="text-[13px] font-extrabold text-slate-900 leading-tight">{t.title}</h2>
                          <div className="flex items-center gap-2 mt-1 text-[8px] text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Avatar name={t.authorName} role={t.authorType} />
                              <strong className={AUTHOR_CFG[t.authorType].color}>{t.authorName}</strong>
                              {t.authorClass && <span>({t.authorClass})</span>}
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {t.createdAt}</span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" /> {t.views} views</span>
                          </div>
                        </div>
                        {/* Thread actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button onClick={() => likeThread(t.id)}
                            className={`flex items-center gap-1 text-[8.5px] font-bold px-2 py-1.5 rounded-lg border transition cursor-pointer ${t.isLiked ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-200 text-slate-500 hover:border-teal-300'}`}>
                            <ThumbsUp className="w-3 h-3" /> {t.likes}
                          </button>
                          <button onClick={() => bookmarkThread(t.id)}
                            className={`p-1.5 rounded-lg border cursor-pointer transition ${t.isBookmarked ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-slate-200 text-slate-400 hover:border-amber-300'}`}>
                            {t.isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => toast.success('Link copied!')} className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:border-teal-300 cursor-pointer bg-white transition">
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[9.5px] text-slate-700 leading-relaxed whitespace-pre-line">{t.body}</p>
                      {t.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {t.tags.map((tag, i) => (
                            <span key={i} className="flex items-center gap-0.5 bg-teal-50 text-teal-700 text-[7.5px] font-bold px-1.5 py-0.5 rounded-full border border-teal-100">
                              <Tag className="w-2 h-2" /> {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Replies */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                      <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">{t.replyCount} Replies</p>

                      {t.replies.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-[10px]">No replies yet. Be the first to respond!</p>
                        </div>
                      )}

                      {t.replies.map(reply => (
                        <div key={reply.id} className={`bg-white border rounded-xl p-4 shadow-sm space-y-3 ${reply.isBestAnswer ? 'border-emerald-200 ring-1 ring-emerald-100' : reply.isStaffResponse ? 'border-violet-200' : 'border-slate-200'}`}>
                          {/* Reply meta */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Avatar name={reply.authorName} role={reply.authorType} size="md" isStaff={reply.isStaffResponse} />
                              <div>
                                <span className="text-[9.5px] font-extrabold text-slate-800">{reply.authorName}</span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className={`text-[7px] font-bold px-1.5 py-0.2 rounded-full ${AUTHOR_CFG[reply.authorType].bg} ${AUTHOR_CFG[reply.authorType].color}`}>{AUTHOR_CFG[reply.authorType].label}</span>
                                  {reply.isBestAnswer && <span className="text-[7px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded-full flex items-center gap-0.5"><Award className="w-2 h-2" /> Best Answer</span>}
                                  {reply.isStaffResponse && <span className="text-[7px] font-bold bg-violet-100 text-violet-700 px-1.5 py-0.2 rounded-full">✅ Official</span>}
                                  <span className="text-[7px] text-slate-400">{reply.createdAt}</span>
                                </div>
                              </div>
                            </div>
                            <button onClick={() => likeReply(t.id, reply.id)}
                              className={`flex items-center gap-1 text-[8px] font-bold px-2 py-1 rounded-lg border cursor-pointer transition ${reply.isLiked ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-teal-200'}`}>
                              <ThumbsUp className="w-2.5 h-2.5" /> {reply.likes}
                            </button>
                          </div>

                          <p className="text-[9.5px] text-slate-700 leading-relaxed whitespace-pre-line">{reply.body}</p>

                          {/* Nested replies */}
                          {reply.nestedReplies.length > 0 && (
                            <div className="ml-4 border-l-2 border-slate-100 pl-3 space-y-2">
                              {reply.nestedReplies.map(nr => (
                                <div key={nr.id} className="flex items-start gap-2">
                                  <Avatar name={nr.authorName} role={nr.authorType} />
                                  <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-1 mb-0.5">
                                      <span className="text-[8.5px] font-extrabold text-slate-700">{nr.authorName}</span>
                                      <span className={`text-[7px] font-bold px-1 py-0.2 rounded-full ${AUTHOR_CFG[nr.authorType].bg} ${AUTHOR_CFG[nr.authorType].color}`}>{AUTHOR_CFG[nr.authorType].label}</span>
                                      <span className="text-[7px] text-slate-400">{nr.createdAt}</span>
                                    </div>
                                    <p className="text-[9px] text-slate-600 leading-relaxed">{nr.body}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Reply to this reply */}
                          <button onClick={() => setExpandedNestedReply(expandedNestedReply === reply.id ? null : reply.id)}
                            className="text-[8px] font-bold text-teal-600 hover:text-teal-800 cursor-pointer flex items-center gap-1">
                            <MessageCircle className="w-2.5 h-2.5" /> Reply to this
                          </button>
                          {expandedNestedReply === reply.id && (
                            <div className="flex items-center gap-2 mt-2">
                              <input type="text" placeholder="Add a reply…" value={nestedReplyText}
                                onChange={e => setNestedReplyText(e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-[9px] outline-none focus:ring-2 focus:ring-teal-200" />
                              <button onClick={() => { toast.success('Nested reply posted!'); setNestedReplyText(''); setExpandedNestedReply(null); }}
                                className="p-1.5 bg-teal-600 text-white rounded-lg cursor-pointer hover:bg-teal-700"><Send className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Reply Composer */}
                      {!t.isLocked ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                          <p className="text-[9.5px] font-extrabold text-slate-700">Post a Reply</p>
                          <textarea rows={3} value={replyText} onChange={e => setReplyText(e.target.value)}
                            placeholder="Share your thoughts, insights, or answer to this thread…"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[9.5px] font-medium outline-none focus:ring-2 focus:ring-teal-300 resize-none" />
                          <div className="flex justify-end">
                            <button onClick={sendThreadReply} disabled={sendingReply}
                              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-[9px] font-extrabold px-4 py-2 rounded-lg cursor-pointer shadow-sm disabled:opacity-50">
                              {sendingReply ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Post Reply
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[9px] text-slate-500">
                          <Lock className="w-4 h-4" /> This thread is locked. No new replies.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ═════════ Q&A BOARD ═════════ */}
        {activeTab === 'qna' && (
          <div className="flex h-full" style={{ minHeight: '100%' }}>

            {/* Left: Questions List */}
            <div className="w-[380px] flex-shrink-0 border-r border-slate-200 flex flex-col overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 space-y-2 z-10">
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search questions…" value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10px] outline-none focus:ring-2 focus:ring-teal-300" />
                </div>
                <div className="flex gap-1">
                  {(['all', 'open', 'answered', 'closed'] as const).map(s => (
                    <button key={s} onClick={() => setQAStatusFilter(s)}
                      className={`text-[7.5px] font-bold px-2 py-1 rounded-full border cursor-pointer transition capitalize ${qaStatusFilter === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-500 border-slate-200 hover:border-teal-300'}`}>
                      {s === 'all' ? 'All' : s === 'open' ? '❓ Unanswered' : s === 'answered' ? '✅ Answered' : '🔒 Closed'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 divide-y divide-slate-100">
                {filteredQuestions.map(q => {
                  const st = QA_STATUS_CFG[q.status];
                  const cat = CATEGORY_CFG[q.category];
                  const isSelected = selectedQuestion?.id === q.id;
                  return (
                    <div key={q.id} onClick={() => setSelectedQuestion(q)}
                      className={`px-3 py-2.5 cursor-pointer hover:bg-teal-50/20 transition ${isSelected ? 'bg-teal-50/40 border-l-2 border-teal-600' : ''}`}>
                      <div className="flex items-start gap-2">
                        {/* Vote count */}
                        <div className={`flex flex-col items-center justify-center w-9 h-12 rounded-lg flex-shrink-0 ${q.votes > 0 ? 'bg-teal-50 text-teal-700' : 'bg-slate-50 text-slate-500'}`}>
                          <span className="text-[11px] font-extrabold leading-none">{q.votes}</span>
                          <span className="text-[6.5px] font-bold">votes</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1 mb-0.5">
                            <p className="text-[9.5px] font-bold text-slate-800 line-clamp-2 leading-tight">{q.title}</p>
                            {q.isBookmarked && <Bookmark className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className={`flex items-center gap-0.5 text-[7px] font-bold px-1.5 py-0.2 rounded-full ${st.bg} ${st.color}`}>{st.icon} {st.label}</span>
                            <span className={`text-[7px] font-bold px-1.5 py-0.2 rounded-full ${cat.bg} ${cat.color}`}>{cat.emoji} {cat.label}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[7.5px] text-slate-400">
                            <span className="flex items-center gap-0.5"><MessageSquare className="w-2 h-2" /> {q.answerCount} ans</span>
                            <span className="flex items-center gap-0.5"><Eye className="w-2 h-2" /> {q.views}</span>
                            <span className="flex items-center gap-0.5 ml-auto"><Clock className="w-2 h-2" /> {q.createdAt.split(' ')[0]}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Question Detail + Answers */}
            <div className="flex-1 overflow-y-auto bg-slate-50/20">
              {!selectedQuestion ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <HelpCircle className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-[11px]">Select a question to read answers</p>
                </div>
              ) : (() => {
                const q = selectedQuestion;
                const cat = CATEGORY_CFG[q.category];
                const st = QA_STATUS_CFG[q.status];
                const sortedAnswers = [...q.answers].sort((a, b) => {
                  if (a.isAccepted !== b.isAccepted) return a.isAccepted ? -1 : 1;
                  return b.votes - a.votes;
                });
                return (
                  <div className="p-5 space-y-5">
                    {/* Question block */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                      <div className="flex items-start gap-4 p-5">
                        {/* Vote column */}
                        <div className="flex flex-col items-center gap-1 flex-shrink-0 w-10">
                          <button onClick={() => voteQuestion(q.id, 1)}
                            className={`p-1.5 rounded-lg border cursor-pointer transition ${q.myVote === 1 ? 'bg-teal-100 border-teal-300 text-teal-700' : 'border-slate-200 text-slate-400 hover:border-teal-300'}`}>
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <span className={`text-[14px] font-extrabold ${q.votes > 0 ? 'text-teal-700' : q.votes < 0 ? 'text-red-600' : 'text-slate-600'}`}>{q.votes}</span>
                          <button onClick={() => voteQuestion(q.id, -1)}
                            className={`p-1.5 rounded-lg border cursor-pointer transition ${q.myVote === -1 ? 'bg-red-50 border-red-300 text-red-600' : 'border-slate-200 text-slate-400 hover:border-red-300'}`}>
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button onClick={() => bookmarkQuestion(q.id)} className={`mt-2 p-1 rounded cursor-pointer transition ${q.isBookmarked ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}>
                            {q.isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h2 className="text-[13px] font-extrabold text-slate-900 leading-tight">{q.title}</h2>
                            <span className={`flex items-center gap-0.5 text-[8px] font-bold px-2 py-1 rounded-full border flex-shrink-0 ${st.bg} ${st.color} ${st.border}`}>{st.icon} {st.label}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[8px] text-slate-500 mb-3 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Avatar name={q.authorName} role={q.authorType} />
                              <strong className={AUTHOR_CFG[q.authorType].color}>{q.authorName}</strong>
                              {q.authorClass && <span>({q.authorClass})</span>}
                            </span>
                            <span>·</span>
                            <span className={`font-bold ${cat.color}`}>{cat.emoji} {cat.label}</span>
                            <span>·</span>
                            <span>{q.createdAt} · {q.views} views</span>
                          </div>
                          <p className="text-[9.5px] text-slate-700 leading-relaxed whitespace-pre-line">{q.body}</p>
                          {q.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {q.tags.map((tag, i) => (
                                <span key={i} className="flex items-center gap-0.5 bg-teal-50 text-teal-700 text-[7.5px] font-bold px-1.5 py-0.5 rounded-full border border-teal-100"><Tag className="w-2 h-2" /> {tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Answers */}
                    {sortedAnswers.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-extrabold text-slate-700">{sortedAnswers.length} {sortedAnswers.length === 1 ? 'Answer' : 'Answers'}</p>
                        {sortedAnswers.map(answer => (
                          <div key={answer.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden ${answer.isAccepted ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-200'}`}>
                            {answer.isAccepted && (
                              <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-1.5 flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[9px] font-extrabold text-emerald-700">Accepted Answer</span>
                              </div>
                            )}
                            <div className="flex items-start gap-4 p-4">
                              {/* Answer vote column */}
                              <div className="flex flex-col items-center gap-1 flex-shrink-0 w-10">
                                <button onClick={() => voteAnswer(q.id, answer.id, 1)}
                                  className={`p-1 rounded-lg border cursor-pointer transition ${answer.myVote === 1 ? 'bg-teal-100 border-teal-300 text-teal-700' : 'border-slate-200 text-slate-400 hover:border-teal-300'}`}>
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <span className={`text-[12px] font-extrabold ${answer.votes > 0 ? 'text-teal-700' : answer.votes < 0 ? 'text-red-600' : 'text-slate-600'}`}>{answer.votes}</span>
                                <button onClick={() => voteAnswer(q.id, answer.id, -1)}
                                  className={`p-1 rounded-lg border cursor-pointer transition ${answer.myVote === -1 ? 'bg-red-50 border-red-300 text-red-600' : 'border-slate-200 text-slate-400 hover:border-red-300'}`}>
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => acceptAnswer(q.id, answer.id)} title="Mark as accepted answer"
                                  className={`mt-1 p-1 rounded-lg border cursor-pointer transition ${answer.isAccepted ? 'bg-emerald-100 border-emerald-300 text-emerald-600' : 'border-slate-200 text-slate-300 hover:border-emerald-300 hover:text-emerald-500'}`}>
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Avatar name={answer.authorName} role={answer.authorType} size="md" />
                                  <div>
                                    <span className="text-[9.5px] font-extrabold text-slate-800">{answer.authorName}</span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className={`text-[7px] font-bold px-1.5 py-0.2 rounded-full ${AUTHOR_CFG[answer.authorType].bg} ${AUTHOR_CFG[answer.authorType].color}`}>{AUTHOR_CFG[answer.authorType].label}</span>
                                      <span className="text-[7px] text-slate-400">{answer.createdAt}</span>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-[9.5px] text-slate-700 leading-relaxed whitespace-pre-line">{answer.body}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Answer Composer */}
                    {q.status !== 'closed' && (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                        <p className="text-[10px] font-extrabold text-slate-700">Write Your Answer</p>
                        <textarea rows={4} value={qaAnswerText} onChange={e => setQAAnswerText(e.target.value)}
                          placeholder="Write a clear, detailed answer. Include examples, references, or steps where applicable…"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[9.5px] font-medium outline-none focus:ring-2 focus:ring-teal-300 resize-none" />
                        <div className="flex items-center justify-between">
                          <p className="text-[8px] text-slate-400">Be respectful. Accurate answers earn upvotes and may be marked as accepted.</p>
                          <button onClick={sendQAAnswer} disabled={sendingReply}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-[9px] font-extrabold px-4 py-2 rounded-lg cursor-pointer shadow-sm disabled:opacity-50">
                            {sendingReply ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Post Answer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ═════════ TRENDING ═════════ */}
        {activeTab === 'trending' && (
          <div className="max-w-3xl mx-auto p-5 space-y-5">
            {/* Hot threads */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-50 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <h3 className="text-[11px] font-extrabold text-slate-800">🔥 Hot Discussions (This Week)</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {[...threads].sort((a, b) => (b.likes * 2 + b.views / 10) - (a.likes * 2 + a.views / 10)).map((t, i) => {
                  const cat = CATEGORY_CFG[t.category];
                  return (
                    <div key={t.id} onClick={() => { setSelectedThread(t); setActiveTab('forums'); }}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition">
                      <span className={`text-[14px] font-extrabold w-6 text-center ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-slate-300'}`}>#{i + 1}</span>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] ${cat.bg}`}>{cat.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9.5px] font-bold text-slate-800 truncate">{t.title}</p>
                        <p className="text-[7.5px] text-slate-400">{t.likes} likes · {t.views} views · {t.replyCount} replies</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top voted Q&A */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-cyan-50 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <h3 className="text-[11px] font-extrabold text-slate-800">📈 Most Voted Questions</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {[...questions].sort((a, b) => b.votes - a.votes).slice(0, 5).map((q, i) => {
                  const st = QA_STATUS_CFG[q.status];
                  return (
                    <div key={q.id} onClick={() => { setSelectedQuestion(q); setActiveTab('qna'); }}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition">
                      <div className={`flex flex-col items-center justify-center w-9 h-10 rounded-lg ${q.votes > 20 ? 'bg-teal-50 text-teal-700' : 'bg-slate-50 text-slate-500'}`}>
                        <span className="text-[11px] font-extrabold">{q.votes}</span>
                        <span className="text-[6px] font-bold">votes</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9.5px] font-bold text-slate-800 truncate">{q.title}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`text-[7px] font-bold px-1 py-0.2 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                          <span className="text-[7.5px] text-slate-400">{q.answerCount} answers · {q.views} views</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category activity heatmap */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
              <h3 className="text-[11px] font-extrabold text-slate-800">📊 Category Activity</h3>
              {Object.entries(CATEGORY_CFG).map(([k, v]) => {
                const tCount = threads.filter(t => t.category === k).length;
                const qCount = questions.filter(q => q.category === k).length;
                if (tCount + qCount === 0) return null;
                return (
                  <div key={k} className="flex items-center gap-3">
                    <span className="w-5">{v.emoji}</span>
                    <span className={`text-[8.5px] font-bold ${v.color} w-28`}>{v.label}</span>
                    <div className="flex-1 flex gap-1">
                      <div className="h-3 rounded-full bg-teal-400 transition-all" style={{ width: `${Math.min(100, tCount * 40)}%`, minWidth: tCount > 0 ? '8px' : '0' }} title={`${tCount} threads`} />
                      <div className="h-3 rounded-full bg-violet-300 transition-all" style={{ width: `${Math.min(100, qCount * 40)}%`, minWidth: qCount > 0 ? '8px' : '0' }} title={`${qCount} questions`} />
                    </div>
                    <span className="text-[8px] text-slate-500 font-bold">{tCount}T · {qCount}Q</span>
                  </div>
                );
              }).filter(Boolean)}
              <div className="flex items-center gap-3 text-[7.5px] text-slate-500 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-full bg-teal-400 inline-block" /> Threads</span>
                <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-full bg-violet-300 inline-block" /> Questions</span>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ MY ACTIVITY ═════════ */}
        {activeTab === 'my_activity' && (
          <div className="max-w-2xl mx-auto p-5 space-y-5">
            {/* Profile summary */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-extrabold">Y</div>
                <div>
                  <h3 className="text-[13px] font-extrabold">Your Forum Profile</h3>
                  <p className="text-[9px] text-teal-100 mt-0.5">Active Community Member · Joined June 2026</p>
                  <div className="flex items-center gap-3 mt-2 text-[9px] font-bold">
                    <span>🧵 3 Threads</span>
                    <span>💬 8 Replies</span>
                    <span>❓ 2 Questions</span>
                    <span>⭐ 47 Total Votes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bookmarked */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-amber-500" />
                <h3 className="text-[11px] font-extrabold text-slate-800">Bookmarked</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {[...threads.filter(t => t.isBookmarked), ...questions.filter(q => q.isBookmarked)].map((item, i) => {
                  const isThread = 'replyCount' in item;
                  const cat = CATEGORY_CFG[(item as any).category];
                  return (
                    <div key={i} onClick={() => { if (isThread) { setSelectedThread(item as ForumThread); setActiveTab('forums'); } else { setSelectedQuestion(item as QAQuestion); setActiveTab('qna'); } }}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition">
                      <span className="text-[12px]">{isThread ? '🧵' : '❓'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9.5px] font-bold text-slate-800 truncate">{item.title}</p>
                        <p className="text-[7.5px] text-slate-400">{cat.label}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  );
                })}
                {threads.filter(t => t.isBookmarked).length + questions.filter(q => q.isBookmarked).length === 0 && (
                  <p className="px-4 py-6 text-center text-[10px] text-slate-400">No bookmarks yet. Bookmark threads or questions to save them here.</p>
                )}
              </div>
            </div>

            {/* Liked Threads */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-teal-600" />
                <h3 className="text-[11px] font-extrabold text-slate-800">Liked Threads</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {threads.filter(t => t.isLiked).map((t, i) => {
                  const cat = CATEGORY_CFG[t.category];
                  return (
                    <div key={i} onClick={() => { setSelectedThread(t); setActiveTab('forums'); }}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition">
                      <span>{cat.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9.5px] font-bold text-slate-800 truncate">{t.title}</p>
                        <p className="text-[7.5px] text-slate-400">{t.likes} likes · {t.replyCount} replies</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  );
                })}
                {threads.filter(t => t.isLiked).length === 0 && (
                  <p className="px-4 py-6 text-center text-[10px] text-slate-400">No liked threads yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═════════ ANALYTICS ═════════ */}
        {activeTab === 'analytics' && (
          <div className="max-w-3xl mx-auto p-5 space-y-5">
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Threads', val: totalThreads, sub: `${solvedThreads} solved`, color: 'text-teal-600' },
                { label: 'Total Q&As', val: totalQuestions, sub: `${answeredQuestions} answered`, color: 'text-violet-600' },
                { label: 'Answer Rate', val: `${Math.round((answeredQuestions / totalQuestions) * 100)}%`, sub: `${unansweredQuestions} still open`, color: 'text-emerald-600' },
                { label: 'Total Views', val: totalViews.toLocaleString(), sub: 'across all posts', color: 'text-blue-600' },
              ].map((k, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                  <h4 className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">{k.label}</h4>
                  <div className={`text-[22px] font-extrabold mt-1 ${k.color}`}>{k.val}</div>
                  <p className="text-[8px] text-slate-500 mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Author type breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
              <h3 className="text-[11px] font-extrabold text-slate-800">Participation by Community Type</h3>
              {Object.entries(AUTHOR_CFG).map(([k, v]) => {
                const count = threads.filter(t => t.authorType === k).length + questions.filter(q => q.authorType === k).length;
                const total = threads.length + questions.length;
                if (count === 0) return null;
                return (
                  <div key={k} className="flex items-center gap-3">
                    <span className={`text-[9px] font-bold w-16 ${v.color}`}>{v.label}</span>
                    <div className="flex-1">
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${k === 'student' ? 'bg-blue-400' : k === 'parent' ? 'bg-emerald-400' : k === 'teacher' ? 'bg-violet-400' : 'bg-amber-400'}`}
                          style={{ width: `${Math.round((count / total) * 100)}%` }} />
                      </div>
                    </div>
                    <span className="text-[8.5px] font-extrabold text-slate-600 w-12 text-right">{count} posts</span>
                  </div>
                );
              }).filter(Boolean)}
            </div>

            {/* Category distribution */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
              <h3 className="text-[11px] font-extrabold text-slate-800">Activity by Category</h3>
              {Object.entries(CATEGORY_CFG).map(([k, v]) => {
                const count = threads.filter(t => t.category === k).length + questions.filter(q => q.category === k).length;
                const total = threads.length + questions.length;
                if (count === 0) return null;
                return (
                  <div key={k} className="flex items-center gap-3">
                    <span className="w-5 text-center">{v.emoji}</span>
                    <span className={`text-[8.5px] font-bold w-28 ${v.color}`}>{v.label}</span>
                    <div className="flex-1">
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-teal-400" style={{ width: `${Math.round((count / total) * 100)}%` }} />
                      </div>
                    </div>
                    <span className="text-[8.5px] font-extrabold text-slate-600">{count}</span>
                  </div>
                );
              }).filter(Boolean)}
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100 rounded-xl p-4 flex gap-3">
              <Lightbulb className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[10px] font-extrabold text-teal-900">Community Health Insights</h4>
                <p className="text-[9px] text-teal-700 leading-relaxed mt-0.5">
                  The forum is most active in the <strong>Academics</strong> category with high student engagement. Q&A response rate stands at <strong>{Math.round((answeredQuestions / totalQuestions) * 100)}%</strong>, driven significantly by teacher participation. Trending topics revolve around <strong>Board Exam prep</strong> and <strong>school policy queries</strong>. Encourage parent participation by featuring unanswered parent queries in weekly newsletters.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DiscussionForums;
