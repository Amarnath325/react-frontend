import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Users, Search, MapPin, Briefcase, GraduationCap, Star, Mail,
  Phone, Globe, Linkedin, MessageSquare, Plus, Filter, TrendingUp,
  Calendar, Award, Heart, BookOpen, ChevronRight, Building2,
  Handshake, Bell, Send, Eye, Check, X, Edit3, Trash2,
  BarChart2, Activity, Coffee, ThumbsUp, UserCheck, UserPlus,
  RefreshCw, Clock, Tag, ExternalLink, Share2, Bookmark,
  ChevronDown, FileText, Megaphone, ToggleLeft, ToggleRight,
  Grid, List, ArrowUpRight, Zap, Target, PieChart
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type MainTab = 'directory' | 'events' | 'jobs' | 'mentorship' | 'admin' | 'analytics';
type AlumniStatus = 'verified' | 'pending' | 'inactive';
type ConnectionStatus = 'none' | 'requested' | 'connected';
type EventType = 'reunion' | 'webinar' | 'networking' | 'sports' | 'cultural' | 'workshop';
type JobType = 'full-time' | 'part-time' | 'internship' | 'remote' | 'contract';
type MentorStatus = 'available' | 'busy' | 'on-hold';

interface Alumni {
  id: number;
  name: string;
  batch: number;
  stream: string;
  currentRole: string;
  company: string;
  industry: string;
  location: string;
  country: string;
  email: string;
  phone?: string;
  linkedin?: string;
  website?: string;
  bio: string;
  status: AlumniStatus;
  connectionStatus: ConnectionStatus;
  isBookmarked: boolean;
  achievements: string[];
  skills: string[];
  isMentor: boolean;
  mentorStatus?: MentorStatus;
  joinedNetwork: string;
  profileScore: number;
  avatar: string;
}

interface AlumniEvent {
  id: number;
  title: string;
  type: EventType;
  date: string;
  time: string;
  venue: string;
  isVirtual: boolean;
  description: string;
  organizer: string;
  attendees: number;
  maxAttendees: number;
  isRegistered: boolean;
  tags: string[];
  batch?: string;
}

interface JobPost {
  id: number;
  title: string;
  company: string;
  postedBy: string;
  postedByBatch: number;
  type: JobType;
  location: string;
  isRemote: boolean;
  salary?: string;
  description: string;
  requirements: string[];
  postedAt: string;
  deadline: string;
  applicants: number;
  isBookmarked: boolean;
  tags: string[];
}

interface MentorRequest {
  id: number;
  mentorId: number;
  studentName: string;
  studentClass: string;
  topic: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  requestedAt: string;
}

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────

const MOCK_ALUMNI: Alumni[] = [
  {
    id: 1, name: 'Arjun Kapoor', batch: 2015, stream: 'Science (PCM)', currentRole: 'Senior Software Engineer',
    company: 'Google India', industry: 'Technology', location: 'Bengaluru', country: 'India',
    email: 'arjun.kapoor@gmail.com', linkedin: 'linkedin.com/in/arjunkapoor', bio: 'IIT Delhi graduate, working at Google on large-scale distributed systems. Passionate about mentoring students in Computer Science.',
    status: 'verified', connectionStatus: 'connected', isBookmarked: true,
    achievements: ['IIT Delhi Rank 42', 'Google Code Jam Finalist', '3× Hackathon Winner'],
    skills: ['Go', 'Kubernetes', 'Machine Learning', 'System Design'],
    isMentor: true, mentorStatus: 'available', joinedNetwork: '2018-03-10', profileScore: 98,
    avatar: 'AK',
  },
  {
    id: 2, name: 'Priya Sharma', batch: 2017, stream: 'Commerce', currentRole: 'Investment Banker (VP)',
    company: 'Goldman Sachs', industry: 'Finance', location: 'Mumbai', country: 'India',
    email: 'priya.sharma@gsachs.com', linkedin: 'linkedin.com/in/priyasharma17',
    bio: 'CA + MBA Finance from IIM Ahmedabad. Leading M&A deals at Goldman Sachs. Alumni mentorship is my way of giving back.',
    status: 'verified', connectionStatus: 'none', isBookmarked: false,
    achievements: ['CA Rank 12 All India', 'IIM A Gold Medal', 'Forbes 30 Under 30 2024'],
    skills: ['Investment Banking', 'M&A', 'Financial Modelling', 'Valuation'],
    isMentor: true, mentorStatus: 'available', joinedNetwork: '2020-07-15', profileScore: 95,
    avatar: 'PS',
  },
  {
    id: 3, name: 'Rohit Menon', batch: 2012, stream: 'Science (PCB)', currentRole: 'Consultant Cardiologist',
    company: 'AIIMS New Delhi', industry: 'Healthcare', location: 'New Delhi', country: 'India',
    email: 'dr.rohit.menon@aiims.edu', phone: '+91-99887-65432',
    bio: 'MBBS + MD Cardiology from AIIMS. Dedicated to improving cardiac care in India. Happy to guide students interested in Medicine.',
    status: 'verified', connectionStatus: 'requested', isBookmarked: false,
    achievements: ['AIIMS MBBS Rank 7', 'Young Cardiologist Award 2023', 'Published 12 research papers'],
    skills: ['Cardiology', 'Echocardiography', 'Research', 'Medical Education'],
    isMentor: true, mentorStatus: 'busy', joinedNetwork: '2019-01-20', profileScore: 92,
    avatar: 'RM',
  },
  {
    id: 4, name: 'Sneha Patel', batch: 2019, stream: 'Arts (Humanities)', currentRole: 'UX Design Lead',
    company: 'Flipkart', industry: 'E-Commerce', location: 'Bengaluru', country: 'India',
    email: 'sneha.patel.design@gmail.com', linkedin: 'linkedin.com/in/sneha-patel-ux', website: 'snehadesigns.in',
    bio: 'NID Ahmedabad graduate. Designing experiences for 300M+ users at Flipkart. Love mentoring aspiring designers.',
    status: 'verified', connectionStatus: 'connected', isBookmarked: true,
    achievements: ['NID Top Graduate 2021', 'Red Dot Design Award', 'Flipkart Design Innovation Award'],
    skills: ['Figma', 'User Research', 'Design Systems', 'Prototyping'],
    isMentor: true, mentorStatus: 'available', joinedNetwork: '2022-06-01', profileScore: 89,
    avatar: 'SP',
  },
  {
    id: 5, name: 'Vikram Nair', batch: 2010, stream: 'Commerce', currentRole: 'Co-Founder & CEO',
    company: 'EduVenture (EdTech Startup)', industry: 'EdTech', location: 'Hyderabad', country: 'India',
    email: 'vikram@eduventure.io', linkedin: 'linkedin.com/in/vikramnair', website: 'eduventure.io',
    bio: 'Serial entrepreneur. Founded 2 companies, the latest in EdTech serving 500K students. BITS Pilani, ISB alumnus.',
    status: 'verified', connectionStatus: 'none', isBookmarked: false,
    achievements: ['BITS Pilani Gold Medallist', 'Nasscom Emerge 50 Winner', 'Raised ₹35Cr Series A'],
    skills: ['Entrepreneurship', 'Product Management', 'Fundraising', 'EdTech'],
    isMentor: true, mentorStatus: 'on-hold', joinedNetwork: '2017-11-05', profileScore: 96,
    avatar: 'VN',
  },
  {
    id: 6, name: 'Ananya Iyer', batch: 2021, stream: 'Science (PCM)', currentRole: 'Data Scientist',
    company: 'Microsoft Azure AI', industry: 'Technology', location: 'Hyderabad', country: 'India',
    email: 'ananya.iyer@microsoft.com',
    bio: 'B.Tech CSE from NIT Trichy, working on Azure AI and ML infrastructure. Recently published paper on LLM optimization.',
    status: 'verified', connectionStatus: 'none', isBookmarked: false,
    achievements: ['NIT Trichy Topper', 'Microsoft Hackathon Winner 2023', 'Published in NeurIPS'],
    skills: ['Python', 'PyTorch', 'MLOps', 'Data Engineering'],
    isMentor: false, joinedNetwork: '2023-08-14', profileScore: 82,
    avatar: 'AI',
  },
  {
    id: 7, name: 'Karan Mehta', batch: 2014, stream: 'Commerce', currentRole: 'Senior Tax Consultant',
    company: 'Deloitte India', industry: 'Consulting', location: 'Mumbai', country: 'India',
    email: 'karan.mehta@deloitte.com', linkedin: 'linkedin.com/in/karanmehta14',
    bio: 'CA + LLB, specializing in International Taxation and GST advisory. Available to guide CA/CS aspirants.',
    status: 'verified', connectionStatus: 'connected', isBookmarked: false,
    achievements: ['CA Rank 28 All India', 'Best Young Consultant Award Deloitte 2022'],
    skills: ['GST', 'International Tax', 'Transfer Pricing', 'Tax Advisory'],
    isMentor: true, mentorStatus: 'available', joinedNetwork: '2019-04-22', profileScore: 86,
    avatar: 'KM',
  },
  {
    id: 8, name: 'Dr. Neha Gupta', batch: 2009, stream: 'Science (PCB)', currentRole: 'Research Scientist',
    company: 'TIFR Mumbai', industry: 'Research & Science', location: 'Mumbai', country: 'India',
    email: 'neha.gupta@tifr.res.in', website: 'tifr.res.in/~ngupta',
    bio: 'PhD in Molecular Biology from TIFR. Researching cancer genomics and CRISPR therapeutics. DBT Ramalingaswami Fellow.',
    status: 'verified', connectionStatus: 'none', isBookmarked: false,
    achievements: ['DBT Ramalingaswami Fellow', '25+ publications in Nature & Science', 'INSA Young Scientist Award'],
    skills: ['CRISPR', 'Genomics', 'Cancer Biology', 'Scientific Writing'],
    isMentor: true, mentorStatus: 'available', joinedNetwork: '2016-09-01', profileScore: 94,
    avatar: 'NG',
  },
];

const MOCK_EVENTS: AlumniEvent[] = [
  {
    id: 1, title: 'DPS Alumni Grand Reunion 2026', type: 'reunion',
    date: '2026-08-15', time: '5:00 PM', venue: 'School Auditorium & Ground, New Delhi',
    isVirtual: false, description: 'Join us for the most awaited Alumni Grand Reunion! A magical evening of nostalgia, networking, and celebration with batches from 2000-2025.',
    organizer: 'Alumni Association', attendees: 284, maxAttendees: 500,
    isRegistered: true, tags: ['reunion', 'networking', 'on-campus'], batch: 'All Batches',
  },
  {
    id: 2, title: 'Career Masterclass: Cracking FAANG in 2026', type: 'webinar',
    date: '2026-07-10', time: '7:00 PM', venue: 'Zoom (Virtual)',
    isVirtual: true, description: 'Arjun Kapoor (Google) and Ananya Iyer (Microsoft) share insider strategies for landing top tech jobs in 2026.',
    organizer: 'Arjun Kapoor (Batch 2015)', attendees: 156, maxAttendees: 200,
    isRegistered: false, tags: ['career', 'tech', 'webinar'], batch: '2015-2023',
  },
  {
    id: 3, title: 'Alumni Startup Pitch Night', type: 'networking',
    date: '2026-07-28', time: '6:30 PM', venue: 'The Lalit Hotel, New Delhi',
    isVirtual: false, description: 'Alumni entrepreneurs pitch their startups to investors, with networking dinner to follow. 6 startups confirmed to pitch.',
    organizer: 'Vikram Nair (Batch 2010)', attendees: 89, maxAttendees: 150,
    isRegistered: false, tags: ['startup', 'networking', 'investment'], batch: 'All Batches',
  },
  {
    id: 4, title: 'Alumni Cricket League 2026', type: 'sports',
    date: '2026-09-20', time: '8:00 AM', venue: 'School Sports Ground',
    isVirtual: false, description: 'Annual Alumni Cricket Tournament. 12 teams, elimination rounds, grand final with trophy ceremony.',
    organizer: 'Sports Committee', attendees: 120, maxAttendees: 120,
    isRegistered: false, tags: ['cricket', 'sports', 'fun'], batch: 'All Batches',
  },
];

const MOCK_JOBS: JobPost[] = [
  {
    id: 1, title: 'Senior Software Engineer — Backend', company: 'Google India',
    postedBy: 'Arjun Kapoor', postedByBatch: 2015, type: 'full-time',
    location: 'Bengaluru', isRemote: false, salary: '₹35–55 LPA',
    description: 'Join Google\'s Infrastructure team in Bengaluru. You\'ll design and implement large-scale distributed systems serving billions of users.',
    requirements: ['B.Tech/M.Tech CS or equivalent', '3+ years backend experience', 'Proficiency in Go or Java', 'Strong DSA fundamentals'],
    postedAt: '2026-06-20', deadline: '2026-07-15', applicants: 34, isBookmarked: true,
    tags: ['engineering', 'google', 'backend'],
  },
  {
    id: 2, title: 'UX Design Intern (6 months)', company: 'Flipkart',
    postedBy: 'Sneha Patel', postedByBatch: 2019, type: 'internship',
    location: 'Bengaluru', isRemote: true, salary: '₹30,000/month',
    description: 'Flipkart\'s Design team is looking for passionate UX Design interns to work on consumer-facing products. Real projects, real impact.',
    requirements: ['Design portfolio required', 'Figma proficiency', 'Currently in 2nd/3rd year B.Des or equivalent', 'Interest in e-commerce UX'],
    postedAt: '2026-06-22', deadline: '2026-07-05', applicants: 67, isBookmarked: false,
    tags: ['design', 'internship', 'remote'],
  },
  {
    id: 3, title: 'Investment Banking Analyst', company: 'Goldman Sachs',
    postedBy: 'Priya Sharma', postedByBatch: 2017, type: 'full-time',
    location: 'Mumbai', isRemote: false, salary: '₹22–28 LPA',
    description: 'Analyst role in Goldman\'s M&A advisory division. Ideal for MBA Finance graduates looking to build a career in investment banking.',
    requirements: ['MBA Finance (Tier-1 preferred)', 'CFA Level 1 a plus', 'Strong Excel/financial modelling skills', 'Excellent communication'],
    postedAt: '2026-06-18', deadline: '2026-07-10', applicants: 112, isBookmarked: false,
    tags: ['finance', 'banking', 'MBA'],
  },
  {
    id: 4, title: 'Business Development Manager — EdTech', company: 'EduVenture',
    postedBy: 'Vikram Nair', postedByBatch: 2010, type: 'full-time',
    location: 'Hyderabad', isRemote: true, salary: '₹12–18 LPA + ESOPs',
    description: 'Drive B2B school partnerships for EduVenture, India\'s fastest-growing EdTech platform. Equity stake available for early joiners.',
    requirements: ['2+ years B2B sales/BD experience', 'EdTech/School market preferred', 'Excellent networking skills', 'Hindi + English mandatory'],
    postedAt: '2026-06-24', deadline: '2026-07-20', applicants: 18, isBookmarked: false,
    tags: ['edtech', 'remote', 'equity', 'startup'],
  },
];

const MOCK_REQUESTS: MentorRequest[] = [
  { id: 1, mentorId: 1, studentName: 'Rahul Gupta', studentClass: 'Class 12-A', topic: 'IIT JEE Preparation Strategy', message: 'Sir, I scored 280/360 in my mock test. Need guidance on optimizing my Physics preparation in the last 3 months.', status: 'pending', requestedAt: '2026-06-24 10:30 AM' },
  { id: 2, mentorId: 4, studentName: 'Priya Reddy', studentClass: 'Class 11-B', topic: 'UX Design Career Path', message: 'Hi Sneha ma\'am, I love design and want to pursue UX as a career. Can you guide me on building a portfolio?', status: 'accepted', requestedAt: '2026-06-22 02:00 PM' },
  { id: 3, mentorId: 2, studentName: 'Aditya Shah', studentClass: 'Class 12-B', topic: 'CA vs MBA — Which Path?', message: 'I am very confused between pursuing CA and doing BCom + MBA. Would love your perspective as someone who did both successfully.', status: 'pending', requestedAt: '2026-06-23 05:00 PM' },
];

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const INDUSTRY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Technology':        { bg: 'bg-blue-50',    color: 'text-blue-700',    border: 'border-blue-200' },
  'Finance':           { bg: 'bg-emerald-50', color: 'text-emerald-700', border: 'border-emerald-200' },
  'Healthcare':        { bg: 'bg-rose-50',    color: 'text-rose-700',    border: 'border-rose-200' },
  'E-Commerce':        { bg: 'bg-orange-50',  color: 'text-orange-700',  border: 'border-orange-200' },
  'EdTech':            { bg: 'bg-violet-50',  color: 'text-violet-700',  border: 'border-violet-200' },
  'Consulting':        { bg: 'bg-teal-50',    color: 'text-teal-700',    border: 'border-teal-200' },
  'Research & Science':{ bg: 'bg-amber-50',   color: 'text-amber-700',   border: 'border-amber-200' },
};

const EVENT_TYPE_CFG: Record<EventType, { label: string; emoji: string; color: string; bg: string }> = {
  reunion:    { label: 'Reunion',    emoji: '🎊', color: 'text-amber-700',   bg: 'bg-amber-50' },
  webinar:    { label: 'Webinar',    emoji: '💻', color: 'text-blue-700',    bg: 'bg-blue-50' },
  networking: { label: 'Networking', emoji: '🤝', color: 'text-violet-700',  bg: 'bg-violet-50' },
  sports:     { label: 'Sports',     emoji: '🏏', color: 'text-green-700',   bg: 'bg-green-50' },
  cultural:   { label: 'Cultural',   emoji: '🎭', color: 'text-rose-700',    bg: 'bg-rose-50' },
  workshop:   { label: 'Workshop',   emoji: '🛠️', color: 'text-teal-700',    bg: 'bg-teal-50' },
};

const JOB_TYPE_CFG: Record<JobType, { label: string; color: string; bg: string; border: string }> = {
  'full-time':  { label: 'Full-Time',  color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  'part-time':  { label: 'Part-Time',  color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200' },
  'internship': { label: 'Internship', color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200' },
  'remote':     { label: 'Remote',     color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'contract':   { label: 'Contract',   color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200' },
};

const MENTOR_STATUS_CFG: Record<MentorStatus, { label: string; color: string; dot: string }> = {
  available: { label: 'Available', color: 'text-emerald-600', dot: 'bg-emerald-500' },
  busy:      { label: 'Busy',      color: 'text-amber-600',   dot: 'bg-amber-500' },
  'on-hold': { label: 'On Hold',   color: 'text-slate-500',   dot: 'bg-slate-400' },
};

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-teal-500 to-cyan-600',
  'from-indigo-500 to-blue-700',
  'from-pink-500 to-rose-600',
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const AlumniNetworkLinker: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('directory');
  const [alumni, setAlumni] = useState<Alumni[]>(MOCK_ALUMNI);
  const [events, setEvents] = useState<AlumniEvent[]>(MOCK_EVENTS);
  const [jobs, setJobs] = useState<JobPost[]>(MOCK_JOBS);
  const [requests, setRequests] = useState<MentorRequest[]>(MOCK_REQUESTS);

  // ── Directory state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [batchFilter, setBatchFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [mentorOnly, setMentorOnly] = useState(false);

  // ── Job state ──
  const [jobSearch, setJobSearch] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState<JobType | 'all'>('all');
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(MOCK_JOBS[0]);
  const [applying, setApplying] = useState(false);

  // ── Newsletter compose ──
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterBody, setNewsletterBody] = useState('');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);

  // ── Mentorship request form ──
  const [requestMentorId, setRequestMentorId] = useState<number | null>(null);
  const [requestTopic, setRequestTopic] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  // ── Stats ──
  const verifiedCount = alumni.filter(a => a.status === 'verified').length;
  const mentorCount = alumni.filter(a => a.isMentor && a.mentorStatus === 'available').length;
  const connectedCount = alumni.filter(a => a.connectionStatus === 'connected').length;
  const industries = ['All', ...Array.from(new Set(alumni.map(a => a.industry)))];
  const batches = ['All', ...Array.from(new Set(alumni.map(a => String(a.batch)))).sort((a, b) => Number(b) - Number(a))];

  // ── Filtered alumni ──
  const filteredAlumni = alumni.filter(a => {
    if (mentorOnly && !a.isMentor) return false;
    if (industryFilter !== 'All' && a.industry !== industryFilter) return false;
    if (batchFilter !== 'All' && String(a.batch) !== batchFilter) return false;
    if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !a.company.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !a.currentRole.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !a.location.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // ── Filtered jobs ──
  const filteredJobs = jobs.filter(j => {
    if (jobTypeFilter !== 'all' && j.type !== jobTypeFilter) return false;
    if (jobSearch && !j.title.toLowerCase().includes(jobSearch.toLowerCase()) &&
      !j.company.toLowerCase().includes(jobSearch.toLowerCase())) return false;
    return true;
  });

  // ── Handlers ──
  const toggleConnect = (id: number) => {
    setAlumni(prev => prev.map(a => {
      if (a.id !== id) return a;
      if (a.connectionStatus === 'none') {
        toast.success('Connection request sent!');
        return { ...a, connectionStatus: 'requested' };
      }
      if (a.connectionStatus === 'connected') {
        toast.success('Disconnected.');
        return { ...a, connectionStatus: 'none' };
      }
      return a;
    }));
  };

  const toggleBookmark = (id: number) => {
    setAlumni(prev => prev.map(a => a.id === id ? { ...a, isBookmarked: !a.isBookmarked } : a));
    toast.success('Bookmark updated!');
  };

  const toggleEventRegister = (id: number) => {
    setEvents(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (e.isRegistered) { toast.success('Registration cancelled.'); return { ...e, isRegistered: false, attendees: e.attendees - 1 }; }
      if (e.attendees >= e.maxAttendees) { toast.error('Event is full!'); return e; }
      toast.success('🎉 Registered successfully!');
      return { ...e, isRegistered: true, attendees: e.attendees + 1 };
    }));
  };

  const toggleJobBookmark = (id: number) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, isBookmarked: !j.isBookmarked } : j));
    toast.success('Saved to bookmarks!');
  };

  const applyJob = async (job: JobPost) => {
    setApplying(true);
    await new Promise(r => setTimeout(r, 1400));
    setApplying(false);
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, applicants: j.applicants + 1 } : j));
    toast.success(`✅ Application submitted for "${job.title}"`);
  };

  const sendMentorRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTopic.trim() || !requestMessage.trim()) { toast.error('Fill all fields'); return; }
    setSendingRequest(true);
    await new Promise(r => setTimeout(r, 1000));
    setSendingRequest(false);
    const mentor = alumni.find(a => a.id === requestMentorId);
    const newReq: MentorRequest = {
      id: Date.now(), mentorId: requestMentorId!, studentName: 'You',
      studentClass: 'Class 12-A', topic: requestTopic, message: requestMessage,
      status: 'pending', requestedAt: new Date().toLocaleString('en-IN'),
    };
    setRequests(prev => [newReq, ...prev]);
    setRequestMentorId(null); setRequestTopic(''); setRequestMessage('');
    toast.success(`✅ Mentorship request sent to ${mentor?.name}!`);
  };

  const respondRequest = (id: number, action: 'accepted' | 'declined') => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
    toast.success(action === 'accepted' ? '✅ Request accepted!' : 'Request declined.');
  };

  const sendNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterSubject.trim() || !newsletterBody.trim()) { toast.error('Subject and body required'); return; }
    setSendingNewsletter(true);
    await new Promise(r => setTimeout(r, 1600));
    setSendingNewsletter(false);
    setNewsletterSubject(''); setNewsletterBody('');
    toast.success(`📧 Newsletter sent to ${verifiedCount} alumni!`);
  };

  const indCfg = (ind: string) => INDUSTRY_COLORS[ind] || { bg: 'bg-slate-50', color: 'text-slate-600', border: 'border-slate-200' };

  return (
    <div className="h-[calc(100vh-120px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-amber-700 via-yellow-700 to-amber-600 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/10 rounded-lg"><GraduationCap className="w-4 h-4" /></div>
          <div>
            <h1 className="font-extrabold text-[11px] tracking-tight leading-tight">Alumni Network Linker</h1>
            <p className="text-[9px] text-amber-200 font-medium">Directory · Events · Jobs · Mentorship · Admin · Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <Users className="w-3 h-3 text-amber-200" />
            <span className="text-[9px] font-bold">{verifiedCount} Alumni</span>
          </div>
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <Handshake className="w-3 h-3 text-amber-200" />
            <span className="text-[9px] font-bold">{mentorCount} Mentors</span>
          </div>
          <button onClick={() => setActiveTab('admin')}
            className="flex items-center gap-1.5 bg-white text-amber-700 hover:bg-amber-50 px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition cursor-pointer shadow-sm">
            <Megaphone className="w-3.5 h-3.5" /> Newsletter
          </button>
        </div>
      </div>

      {/* ── STAT PILLS ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50/40 border-b border-amber-100 flex-shrink-0 overflow-x-auto">
        {[
          { label: 'Verified Alumni', val: verifiedCount, icon: <UserCheck className="w-3 h-3" />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Connected', val: connectedCount, icon: <Handshake className="w-3 h-3" />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Available Mentors', val: mentorCount, icon: <Award className="w-3 h-3" />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Upcoming Events', val: events.length, icon: <Calendar className="w-3 h-3" />, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
          { label: 'Active Jobs', val: jobs.length, icon: <Briefcase className="w-3 h-3" />, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
          { label: 'Pending Requests', val: requests.filter(r => r.status === 'pending').length, icon: <Bell className="w-3 h-3" />, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-1.5 ${s.bg} border ${s.border} px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0`}>
            <span className={s.color}>{s.icon}</span>
            <span className="text-[10px] font-extrabold text-slate-700">{s.val}</span>
            <span className="text-[9px] text-slate-400 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="flex border-b border-slate-200 bg-white flex-shrink-0 overflow-x-auto">
        {([
          { key: 'directory',   label: 'Alumni Directory',  icon: <Users className="w-3.5 h-3.5" />,       badge: verifiedCount },
          { key: 'events',      label: 'Events & Reunions', icon: <Calendar className="w-3.5 h-3.5" />,    badge: events.length },
          { key: 'jobs',        label: 'Job Board',         icon: <Briefcase className="w-3.5 h-3.5" />,   badge: jobs.length },
          { key: 'mentorship',  label: 'Mentorship',        icon: <Handshake className="w-3.5 h-3.5" />,   badge: requests.filter(r => r.status === 'pending').length },
          { key: 'admin',       label: 'Admin',             icon: <FileText className="w-3.5 h-3.5" /> },
          { key: 'analytics',   label: 'Analytics',         icon: <BarChart2 className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as MainTab)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition ${activeTab === t.key ? 'text-amber-700 border-b-2 border-amber-600 bg-amber-50/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {t.icon} {t.label}
            {'badge' in t && (t as any).badge > 0 && (
              <span className="bg-amber-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full">{(t as any).badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── MENTOR REQUEST MODAL ── */}
      {requestMentorId && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-amber-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-yellow-600 px-5 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-[11px] font-extrabold">Request Mentorship</h3>
                <p className="text-[9px] text-amber-200 mt-0.5">from {alumni.find(a => a.id === requestMentorId)?.name}</p>
              </div>
              <button onClick={() => setRequestMentorId(null)} className="p-1 hover:bg-white/20 rounded cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={sendMentorRequest} className="p-5 space-y-3">
              <div>
                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Mentorship Topic *</label>
                <input type="text" placeholder="e.g. IIT-JEE Preparation, UX Career Path…"
                  value={requestTopic} onChange={e => setRequestTopic(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              <div>
                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Your Message *</label>
                <textarea rows={4} placeholder="Introduce yourself and describe what guidance you're seeking…"
                  value={requestMessage} onChange={e => setRequestMessage(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setRequestMentorId(null)} className="px-4 py-2 border border-slate-200 text-[9px] font-bold text-slate-500 rounded-xl cursor-pointer hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={sendingRequest}
                  className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 text-white text-[9px] font-extrabold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50">
                  {sendingRequest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ALUMNI PROFILE DRAWER ── */}
      {selectedAlumni && (
        <div className="absolute inset-0 bg-black/40 flex items-end justify-end z-50">
          <div className="bg-white h-full w-[400px] flex flex-col shadow-2xl overflow-y-auto">
            <div className={`bg-gradient-to-br ${AVATAR_COLORS[selectedAlumni.id % AVATAR_COLORS.length]} p-6 text-white flex-shrink-0`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-[22px] font-extrabold`}>{selectedAlumni.avatar}</div>
                <button onClick={() => setSelectedAlumni(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <h2 className="text-[15px] font-extrabold">{selectedAlumni.name}</h2>
              <p className="text-[10px] opacity-90 mt-0.5">{selectedAlumni.currentRole} at {selectedAlumni.company}</p>
              <div className="flex items-center gap-3 mt-2 text-[8.5px] opacity-80">
                <span className="flex items-center gap-1"><GraduationCap className="w-2.5 h-2.5" />Batch {selectedAlumni.batch}</span>
                <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{selectedAlumni.location}</span>
              </div>
            </div>
            <div className="flex-1 p-5 space-y-4">
              {/* Action row */}
              <div className="flex gap-2">
                <button onClick={() => toggleConnect(selectedAlumni.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[9px] font-extrabold cursor-pointer transition ${selectedAlumni.connectionStatus === 'connected' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : selectedAlumni.connectionStatus === 'requested' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-amber-600 text-white hover:bg-amber-700'}`}>
                  {selectedAlumni.connectionStatus === 'connected' ? <><Check className="w-3.5 h-3.5" /> Connected</> : selectedAlumni.connectionStatus === 'requested' ? <><Clock className="w-3.5 h-3.5" /> Pending</> : <><UserPlus className="w-3.5 h-3.5" /> Connect</>}
                </button>
                <button onClick={() => toast.success(`Message sent to ${selectedAlumni.name}!`)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-[9px] font-extrabold cursor-pointer hover:bg-blue-100 transition">
                  <MessageSquare className="w-3.5 h-3.5" /> Message
                </button>
                {selectedAlumni.isMentor && selectedAlumni.mentorStatus === 'available' && (
                  <button onClick={() => setRequestMentorId(selectedAlumni.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[9px] font-extrabold cursor-pointer hover:bg-emerald-100 transition">
                    <Handshake className="w-3.5 h-3.5" /> Mentor
                  </button>
                )}
              </div>

              {/* Bio */}
              <div>
                <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">About</h4>
                <p className="text-[9.5px] text-slate-700 leading-relaxed">{selectedAlumni.bio}</p>
              </div>

              {/* Achievements */}
              <div>
                <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Key Achievements</h4>
                <div className="space-y-1.5">
                  {selectedAlumni.achievements.map((ach, i) => (
                    <div key={i} className="flex items-center gap-2 text-[9px] text-slate-700">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                      {ach}
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAlumni.skills.map((s, i) => (
                    <span key={i} className="text-[8px] font-bold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">{s}</span>
                  ))}
                </div>
              </div>

              {/* Mentor badge */}
              {selectedAlumni.isMentor && selectedAlumni.mentorStatus && (
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${selectedAlumni.mentorStatus === 'available' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <Handshake className={`w-4 h-4 ${selectedAlumni.mentorStatus === 'available' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <p className="text-[9.5px] font-extrabold text-slate-800">Mentor</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${MENTOR_STATUS_CFG[selectedAlumni.mentorStatus].dot}`} />
                      <span className={`text-[8px] font-bold ${MENTOR_STATUS_CFG[selectedAlumni.mentorStatus].color}`}>{MENTOR_STATUS_CFG[selectedAlumni.mentorStatus].label}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Links */}
              <div className="flex gap-2 flex-wrap">
                {selectedAlumni.email && (
                  <a href={`mailto:${selectedAlumni.email}`} className="flex items-center gap-1 text-[8.5px] font-bold text-slate-500 hover:text-blue-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg cursor-pointer transition">
                    <Mail className="w-3 h-3" /> Email
                  </a>
                )}
                {selectedAlumni.linkedin && (
                  <button onClick={() => toast.success('Opening LinkedIn…')} className="flex items-center gap-1 text-[8.5px] font-bold text-slate-500 hover:text-blue-700 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg cursor-pointer transition">
                    <Linkedin className="w-3 h-3" /> LinkedIn
                  </button>
                )}
                {selectedAlumni.website && (
                  <button onClick={() => toast.success('Opening website…')} className="flex items-center gap-1 text-[8.5px] font-bold text-slate-500 hover:text-amber-700 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg cursor-pointer transition">
                    <Globe className="w-3 h-3" /> Website
                  </button>
                )}
              </div>

              <div className="text-[8px] text-slate-400 font-medium border-t border-slate-100 pt-3">
                <p>Profile Score: <strong className="text-amber-600">{selectedAlumni.profileScore}%</strong> · Stream: <strong className="text-slate-600">{selectedAlumni.stream}</strong></p>
                <p className="mt-0.5">Joined Network: {selectedAlumni.joinedNetwork}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═══════ DIRECTORY TAB ═══════ */}
        {activeTab === 'directory' && (
          <div className="p-4 space-y-4">
            {/* Search + Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search by name, company, role, location…" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10px] outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-[9.5px] font-bold bg-white outline-none focus:ring-2 focus:ring-amber-300">
                {industries.map(i => <option key={i} value={i}>{i === 'All' ? '🏭 All Industries' : i}</option>)}
              </select>
              <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-[9.5px] font-bold bg-white outline-none focus:ring-2 focus:ring-amber-300">
                {batches.map(b => <option key={b} value={b}>{b === 'All' ? '🎓 All Batches' : `Batch ${b}`}</option>)}
              </select>
              <button onClick={() => setMentorOnly(!mentorOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-bold cursor-pointer transition ${mentorOnly ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300'}`}>
                <Handshake className="w-3 h-3" /> Mentors Only
              </button>
              <div className="flex gap-1 ml-auto">
                {(['grid', 'list'] as const).map(m => (
                  <button key={m} onClick={() => setViewMode(m)}
                    className={`p-1.5 rounded-lg border cursor-pointer transition ${viewMode === m ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-slate-200 text-slate-400 hover:border-amber-200'}`}>
                    {m === 'grid' ? <Grid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[9px] text-slate-400 font-medium">{filteredAlumni.length} alumni found</p>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-2 gap-4">
                {filteredAlumni.map((alum, idx) => {
                  const ic = indCfg(alum.industry);
                  return (
                    <div key={alum.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
                      onClick={() => setSelectedAlumni(alum)}>
                      {/* Top gradient bar */}
                      <div className={`h-2 bg-gradient-to-r ${AVATAR_COLORS[alum.id % AVATAR_COLORS.length]}`} />
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[alum.id % AVATAR_COLORS.length]} flex items-center justify-center text-white font-extrabold text-[11px] flex-shrink-0`}>{alum.avatar}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <h3 className="text-[10.5px] font-extrabold text-slate-800 truncate">{alum.name}</h3>
                              {alum.status === 'verified' && <UserCheck className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                            </div>
                            <p className="text-[9px] text-slate-600 font-semibold truncate">{alum.currentRole}</p>
                            <p className="text-[8.5px] text-slate-400 truncate">{alum.company}</p>
                          </div>
                          <button onClick={e => { e.stopPropagation(); toggleBookmark(alum.id); }}
                            className="text-slate-300 hover:text-amber-500 transition cursor-pointer flex-shrink-0">
                            <Bookmark className={`w-3.5 h-3.5 ${alum.isBookmarked ? 'text-amber-500 fill-amber-500' : ''}`} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                          <span className={`text-[7.5px] font-bold px-2 py-0.5 rounded-full border ${ic.color} ${ic.bg} ${ic.border}`}>{alum.industry}</span>
                          <span className="text-[7.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">Batch {alum.batch}</span>
                          {alum.isMentor && alum.mentorStatus && (
                            <span className={`flex items-center gap-1 text-[7px] font-bold px-1.5 py-0.5 rounded-full ${alum.mentorStatus === 'available' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 bg-slate-50'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${MENTOR_STATUS_CFG[alum.mentorStatus].dot}`} />
                              Mentor
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-[7.5px] text-slate-400">
                          <MapPin className="w-2.5 h-2.5" /> {alum.location}
                        </div>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                          <button onClick={e => { e.stopPropagation(); toggleConnect(alum.id); }}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[8px] font-extrabold cursor-pointer transition ${alum.connectionStatus === 'connected' ? 'bg-slate-100 text-slate-600' : alum.connectionStatus === 'requested' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-amber-600 text-white hover:bg-amber-700'}`}>
                            {alum.connectionStatus === 'connected' ? <><Check className="w-3 h-3" /> Connected</> : alum.connectionStatus === 'requested' ? <><Clock className="w-3 h-3" /> Sent</> : <><UserPlus className="w-3 h-3" /> Connect</>}
                          </button>
                          {alum.isMentor && alum.mentorStatus === 'available' && (
                            <button onClick={e => { e.stopPropagation(); setRequestMentorId(alum.id); }}
                              className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg cursor-pointer hover:bg-emerald-100 transition" title="Request Mentor">
                              <Handshake className="w-3 h-3" />
                            </button>
                          )}
                          <button onClick={e => { e.stopPropagation(); setSelectedAlumni(alum); }}
                            className="p-1.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition" title="View Profile">
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredAlumni.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-slate-300">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-[11px] font-bold">No alumni found</p>
                  </div>
                )}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {filteredAlumni.map(alum => {
                    const ic = indCfg(alum.industry);
                    return (
                      <div key={alum.id} className="flex items-center gap-4 px-5 py-3 hover:bg-amber-50/20 transition cursor-pointer" onClick={() => setSelectedAlumni(alum)}>
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[alum.id % AVATAR_COLORS.length]} flex items-center justify-center text-white font-extrabold text-[10px] flex-shrink-0`}>{alum.avatar}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] font-bold text-slate-800 truncate">{alum.name}</p>
                            {alum.status === 'verified' && <UserCheck className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                            {alum.isMentor && alum.mentorStatus === 'available' && <span className="text-[7px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full flex-shrink-0">Mentor</span>}
                          </div>
                          <p className="text-[8.5px] text-slate-500">{alum.currentRole} · {alum.company} · Batch {alum.batch}</p>
                        </div>
                        <span className={`text-[7.5px] font-bold px-2 py-0.5 rounded-full border ${ic.color} ${ic.bg} ${ic.border} flex-shrink-0`}>{alum.industry}</span>
                        <span className="text-[8px] text-slate-400 flex-shrink-0 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{alum.location}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={e => { e.stopPropagation(); toggleConnect(alum.id); }}
                            className={`px-3 py-1.5 rounded-lg text-[8px] font-extrabold cursor-pointer transition ${alum.connectionStatus === 'connected' ? 'bg-slate-100 text-slate-600' : alum.connectionStatus === 'requested' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-amber-600 text-white hover:bg-amber-700'}`}>
                            {alum.connectionStatus === 'connected' ? 'Connected' : alum.connectionStatus === 'requested' ? 'Pending' : 'Connect'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════ EVENTS TAB ═══════ */}
        {activeTab === 'events' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-extrabold text-slate-800">{events.length} Upcoming Events</h3>
              <button onClick={() => toast('Event creation coming soon!', { icon: '📅' })}
                className="flex items-center gap-1.5 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-amber-100">
                <Plus className="w-3 h-3" /> Create Event
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {events.map(ev => {
                const etCfg = EVENT_TYPE_CFG[ev.type];
                const spotsLeft = ev.maxAttendees - ev.attendees;
                const pct = Math.round((ev.attendees / ev.maxAttendees) * 100);
                return (
                  <div key={ev.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex">
                      {/* Date block */}
                      <div className="w-20 bg-gradient-to-b from-amber-600 to-yellow-600 flex flex-col items-center justify-center py-4 flex-shrink-0 text-white">
                        <span className="text-[9px] font-extrabold uppercase opacity-80">{new Date(ev.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                        <span className="text-[28px] font-extrabold leading-none">{new Date(ev.date).getDate()}</span>
                        <span className="text-[8.5px] font-bold opacity-80">{ev.time}</span>
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className={`text-[7.5px] font-extrabold px-2 py-0.5 rounded-full ${etCfg.color} ${etCfg.bg} border border-current border-opacity-30`}>
                                {etCfg.emoji} {etCfg.label}
                              </span>
                              {ev.isVirtual && <span className="text-[7.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">💻 Virtual</span>}
                              {ev.batch && <span className="text-[7.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{ev.batch}</span>}
                            </div>
                            <h3 className="text-[11px] font-extrabold text-slate-800 leading-snug">{ev.title}</h3>
                            <p className="text-[9px] text-slate-500 mt-1 line-clamp-2">{ev.description}</p>
                          </div>
                          <button onClick={() => toggleEventRegister(ev.id)}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-[8.5px] font-extrabold cursor-pointer transition ${ev.isRegistered ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : spotsLeft === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-amber-600 text-white hover:bg-amber-700'}`}
                            disabled={spotsLeft === 0 && !ev.isRegistered}>
                            {ev.isRegistered ? <><Check className="w-3 h-3 inline mr-1" />Registered</> : spotsLeft === 0 ? 'Full' : 'Register'}
                          </button>
                        </div>
                        <div className="flex items-center gap-3 mt-3 text-[8px] text-slate-400 font-medium">
                          <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{ev.venue}</span>
                          <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{ev.attendees}/{ev.maxAttendees} ({spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'})</span>
                          <span>by {ev.organizer}</span>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-1.5 rounded-full transition-all duration-700 ${pct >= 90 ? 'bg-rose-400' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════ JOB BOARD TAB ═══════ */}
        {activeTab === 'jobs' && (
          <div className="flex h-full">
            {/* Left: job list */}
            <div className="w-80 flex-shrink-0 border-r border-slate-200 flex flex-col overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 z-10 space-y-2">
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search jobs…" value={jobSearch} onChange={e => setJobSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10px] outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(['all', 'full-time', 'internship', 'remote'] as const).map(t => (
                    <button key={t} onClick={() => setJobTypeFilter(t)}
                      className={`text-[7.5px] font-bold px-2 py-1 rounded-full border cursor-pointer transition ${jobTypeFilter === t ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300'}`}>
                      {t === 'all' ? 'All' : JOB_TYPE_CFG[t].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {filteredJobs.map(job => {
                  const jtCfg = JOB_TYPE_CFG[job.type];
                  const isSelected = selectedJob?.id === job.id;
                  return (
                    <div key={job.id} onClick={() => setSelectedJob(job)}
                      className={`px-4 py-3 cursor-pointer hover:bg-amber-50/30 transition ${isSelected ? 'bg-amber-50/50 border-l-2 border-amber-500' : ''}`}>
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9.5px] font-bold text-slate-800 truncate">{job.title}</p>
                          <p className="text-[8px] text-slate-500">{job.company}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full border ${jtCfg.color} ${jtCfg.bg} ${jtCfg.border}`}>{jtCfg.label}</span>
                            {job.isRemote && <span className="text-[7px] font-bold text-emerald-600">🌐 Remote</span>}
                            {job.salary && <span className="text-[7px] font-bold text-amber-700">{job.salary}</span>}
                          </div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); toggleJobBookmark(job.id); }}
                          className="text-slate-300 hover:text-amber-500 transition cursor-pointer flex-shrink-0">
                          <Bookmark className={`w-3 h-3 ${job.isBookmarked ? 'text-amber-500 fill-amber-500' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: job detail */}
            <div className="flex-1 overflow-y-auto p-5">
              {!selectedJob ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300">
                  <Briefcase className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-[11px] font-bold">Select a job to view details</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full border ${JOB_TYPE_CFG[selectedJob.type].color} ${JOB_TYPE_CFG[selectedJob.type].bg} ${JOB_TYPE_CFG[selectedJob.type].border}`}>{JOB_TYPE_CFG[selectedJob.type].label}</span>
                          {selectedJob.isRemote && <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">🌐 Remote</span>}
                        </div>
                        <h3 className="text-[15px] font-extrabold text-slate-800">{selectedJob.title}</h3>
                        <p className="text-[10px] text-slate-600 font-semibold mt-0.5">{selectedJob.company}</p>
                        <div className="flex items-center gap-4 mt-2 text-[8.5px] text-slate-400 font-medium flex-wrap">
                          <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{selectedJob.location}</span>
                          <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{selectedJob.applicants} applicants</span>
                          <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />Deadline: {selectedJob.deadline}</span>
                          {selectedJob.salary && <span className="text-amber-700 font-bold">{selectedJob.salary}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button onClick={() => applyJob(selectedJob)} disabled={applying}
                          className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-yellow-600 text-white px-4 py-2 rounded-xl text-[9px] font-extrabold cursor-pointer hover:opacity-90 transition shadow-sm disabled:opacity-50">
                          {applying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Apply Now
                        </button>
                        <button onClick={() => toast.success('Message sent to recruiter!')}
                          className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[9px] font-bold cursor-pointer hover:bg-slate-50 transition">
                          <MessageSquare className="w-3.5 h-3.5" /> Contact
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${AVATAR_COLORS[(selectedJob.postedByBatch % 10) % AVATAR_COLORS.length]} flex items-center justify-center text-white text-[9px] font-extrabold flex-shrink-0`}>{selectedJob.postedBy.split(' ').map(n => n[0]).join('')}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-slate-700">Posted by <strong>{selectedJob.postedBy}</strong> (Batch {selectedJob.postedByBatch})</p>
                        <p className="text-[8px] text-slate-400">Alumni referral opportunity · Posted {selectedJob.postedAt}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <h4 className="text-[10px] font-extrabold text-slate-700">Job Description</h4>
                      <p className="text-[9.5px] text-slate-600 leading-relaxed">{selectedJob.description}</p>
                      <h4 className="text-[10px] font-extrabold text-slate-700 mt-3">Requirements</h4>
                      <ul className="space-y-1.5">
                        {selectedJob.requirements.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-[9px] text-slate-600">
                            <ChevronRight className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />{r}
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-1.5 flex-wrap pt-2">
                        {selectedJob.tags.map((tag, i) => (
                          <span key={i} className="text-[7.5px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════ MENTORSHIP TAB ═══════ */}
        {activeTab === 'mentorship' && (
          <div className="p-4 space-y-5">
            {/* Mentor roster */}
            <div>
              <h3 className="text-[11px] font-extrabold text-slate-800 mb-3">🤝 Available Mentors</h3>
              <div className="grid grid-cols-2 gap-3">
                {alumni.filter(a => a.isMentor).map(m => {
                  const ms = m.mentorStatus!;
                  const msc = MENTOR_STATUS_CFG[ms];
                  return (
                    <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[m.id % AVATAR_COLORS.length]} flex items-center justify-center text-white font-extrabold text-[11px] flex-shrink-0`}>{m.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[10px] font-extrabold text-slate-800 truncate">{m.name}</p>
                          <div className={`flex items-center gap-0.5 ml-auto flex-shrink-0`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${msc.dot} ${ms === 'available' ? 'animate-pulse' : ''}`} />
                            <span className={`text-[7px] font-bold ${msc.color}`}>{msc.label}</span>
                          </div>
                        </div>
                        <p className="text-[8.5px] text-slate-500 truncate">{m.currentRole}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {m.skills.slice(0, 3).map((s, i) => (
                            <span key={i} className="text-[7px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full">{s}</span>
                          ))}
                        </div>
                        <button
                          onClick={() => ms === 'available' && setRequestMentorId(m.id)}
                          disabled={ms !== 'available'}
                          className={`mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[8px] font-extrabold cursor-pointer transition ${ms === 'available' ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                          <Handshake className="w-3 h-3" />
                          {ms === 'available' ? 'Request Mentorship' : ms === 'busy' ? 'Currently Busy' : 'On Hold'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mentorship requests */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" /> Mentorship Requests
                  {requests.filter(r => r.status === 'pending').length > 0 && (
                    <span className="bg-amber-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full">{requests.filter(r => r.status === 'pending').length}</span>
                  )}
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {requests.map(req => {
                  const mentor = alumni.find(a => a.id === req.mentorId);
                  return (
                    <div key={req.id} className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-[9.5px] font-extrabold text-slate-800">{req.studentName} <span className="text-slate-400 font-normal">({req.studentClass})</span></p>
                              <p className="text-[8.5px] text-amber-700 font-bold mt-0.5">Topic: {req.topic}</p>
                              <p className="text-[8px] text-slate-500 mt-0.5">To: {mentor?.name} · {req.requestedAt}</p>
                            </div>
                            <span className={`flex-shrink-0 text-[7.5px] font-extrabold px-2 py-1 rounded-full ${req.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : req.status === 'declined' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                              {req.status === 'accepted' ? '✅ Accepted' : req.status === 'declined' ? '❌ Declined' : '⏳ Pending'}
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-600 mt-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 leading-relaxed">"{req.message}"</p>
                          {req.status === 'pending' && req.studentName !== 'You' && (
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => respondRequest(req.id, 'accepted')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[8.5px] font-extrabold cursor-pointer hover:bg-emerald-100 transition">
                                <Check className="w-3 h-3" /> Accept
                              </button>
                              <button onClick={() => respondRequest(req.id, 'declined')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-[8.5px] font-extrabold cursor-pointer hover:bg-rose-100 transition">
                                <X className="w-3 h-3" /> Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {requests.length === 0 && (
                  <p className="px-5 py-8 text-center text-[10px] text-slate-400">No mentorship requests yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════ ADMIN TAB ═══════ */}
        {activeTab === 'admin' && (
          <div className="p-4 space-y-5">
            {/* Pending approval */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2"><UserCheck className="w-4 h-4 text-amber-500" /> Pending Alumni Approvals</h3>
              </div>
              <div className="p-5 text-center text-[10px] text-slate-400">
                <Check className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                <p>All alumni applications are approved. No pending requests.</p>
              </div>
            </div>

            {/* Newsletter composer */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2"><Megaphone className="w-4 h-4 text-amber-500" /> Send Alumni Newsletter</h3>
              </div>
              <form onSubmit={sendNewsletter} className="p-5 space-y-3">
                <div>
                  <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Subject Line *</label>
                  <input type="text" placeholder="e.g. Alumni Reunion 2026 — Save the Date! 🎊"
                    value={newsletterSubject} onChange={e => setNewsletterSubject(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
                <div>
                  <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Message Body *</label>
                  <textarea rows={6} placeholder="Dear Alumni, …"
                    value={newsletterBody} onChange={e => setNewsletterBody(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[8.5px] text-slate-400">Will be sent to <strong className="text-amber-600">{verifiedCount} verified alumni</strong> via email</p>
                  <button type="submit" disabled={sendingNewsletter}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-yellow-600 text-white px-4 py-2 rounded-xl text-[9px] font-extrabold cursor-pointer hover:opacity-90 transition shadow-sm disabled:opacity-50">
                    {sendingNewsletter ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Send Newsletter
                  </button>
                </div>
              </form>
            </div>

            {/* Alumni list management */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2"><Users className="w-4 h-4 text-slate-500" /> Alumni Records ({alumni.length})</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {alumni.map(a => (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-2.5 hover:bg-slate-50 transition">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${AVATAR_COLORS[a.id % AVATAR_COLORS.length]} flex items-center justify-center text-white text-[8px] font-extrabold flex-shrink-0`}>{a.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9.5px] font-bold text-slate-800 truncate">{a.name}</p>
                      <p className="text-[7.5px] text-slate-400">Batch {a.batch} · {a.company} · {a.stream}</p>
                    </div>
                    <span className={`text-[7.5px] font-extrabold px-2 py-0.5 rounded-full ${a.status === 'verified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                      {a.status === 'verified' ? '✅ Verified' : '⏳ Pending'}
                    </span>
                    <span className="text-[8px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">{a.profileScore}%</span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => toast.success(`Email sent to ${a.name}!`)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition"><Mail className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toast.success(`${a.name} removed from network.`)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════ ANALYTICS TAB ═══════ */}
        {activeTab === 'analytics' && (
          <div className="max-w-3xl mx-auto p-5 space-y-5">
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Alumni', val: alumni.length, sub: `${verifiedCount} verified`, color: 'text-amber-600' },
                { label: 'Connected', val: connectedCount, sub: `${Math.round((connectedCount / alumni.length) * 100)}% network rate`, color: 'text-emerald-600' },
                { label: 'Active Mentors', val: mentorCount, sub: 'available now', color: 'text-blue-600' },
                { label: 'Open Jobs', val: jobs.length, sub: `${jobs.reduce((a, j) => a + j.applicants, 0)} total applications`, color: 'text-violet-600' },
              ].map((k, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                  <div className={`text-[22px] font-extrabold ${k.color}`}>{k.val}</div>
                  <p className="text-[8.5px] text-slate-400 font-bold mt-0.5">{k.label}</p>
                  <p className="text-[7.5px] text-slate-400 mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Industry breakdown */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-[11px] font-extrabold text-slate-800">Alumni by Industry</h3>
              {Object.entries(
                alumni.reduce((acc, a) => { acc[a.industry] = (acc[a.industry] || 0) + 1; return acc; }, {} as Record<string, number>)
              ).sort((a, b) => b[1] - a[1]).map(([ind, count]) => {
                const ic = indCfg(ind);
                const pct = Math.round((count / alumni.length) * 100);
                return (
                  <div key={ind} className="flex items-center gap-3">
                    <span className={`text-[9px] font-bold w-36 ${ic.color}`}>{ind}</span>
                    <div className="flex-1">
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${ic.bg.replace('bg-', 'bg-').replace('-50', '-400')} transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-[8.5px] font-extrabold text-slate-600 w-12 text-right">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>

            {/* Batch distribution */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-[11px] font-extrabold text-slate-800">Alumni by Graduation Year</h3>
              {Object.entries(
                alumni.reduce((acc, a) => { acc[a.batch] = (acc[a.batch] || 0) + 1; return acc; }, {} as Record<number, number>)
              ).sort((a, b) => Number(b[0]) - Number(a[0])).map(([batch, count]) => (
                <div key={batch} className="flex items-center gap-3">
                  <span className="text-[9px] font-bold text-slate-600 w-16">Batch {batch}</span>
                  <div className="flex-1">
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-amber-400 transition-all duration-700" style={{ width: `${Math.round((count / alumni.length) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-[8.5px] font-extrabold text-slate-600 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>

            {/* Events & Jobs engagement */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <h3 className="text-[11px] font-extrabold text-slate-800">Event Registrations</h3>
                {events.map(e => {
                  const pct = Math.round((e.attendees / e.maxAttendees) * 100);
                  return (
                    <div key={e.id}>
                      <div className="flex justify-between text-[8.5px] mb-0.5">
                        <span className="font-bold text-slate-700 truncate">{EVENT_TYPE_CFG[e.type].emoji} {e.title.slice(0, 20)}…</span>
                        <span className="font-extrabold text-amber-600">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-amber-400 transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <h3 className="text-[11px] font-extrabold text-slate-800">Job Board Activity</h3>
                {jobs.map(j => (
                  <div key={j.id}>
                    <div className="flex justify-between text-[8.5px] mb-0.5">
                      <span className="font-bold text-slate-700 truncate">{j.title.slice(0, 22)}…</span>
                      <span className="font-extrabold text-rose-600">{j.applicants}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-rose-400 transition-all duration-700" style={{ width: `${Math.min(100, Math.round((j.applicants / 150) * 100))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insight summary */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-2xl p-5 flex gap-3">
              <TrendingUp className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[10px] font-extrabold text-amber-900">Network Health Insights</h4>
                <p className="text-[9px] text-amber-800 leading-relaxed mt-1">
                  The alumni network has <strong>{verifiedCount} verified members</strong> across <strong>{Object.keys(alumni.reduce((acc, a) => { acc[a.industry] = 1; return acc; }, {} as any)).length} industries</strong>.
                  Technology and Finance are the top sectors. <strong>{mentorCount} mentors</strong> are currently available for student guidance.
                  The Job Board has attracted <strong>{jobs.reduce((a, j) => a + j.applicants, 0)} applications</strong> across {jobs.length} openings.
                  Upcoming Grand Reunion has <strong>{events[0].attendees} registrations</strong> and counting.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AlumniNetworkLinker;
