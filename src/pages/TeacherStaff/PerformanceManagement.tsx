import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Star, TrendingUp, Award, Target, Calendar, Plus, Edit2,
  Trash2, Loader2, X, ChevronRight, CheckCircle2,
  Clock, AlertCircle, BarChart3, ArrowLeft, Save,
  Play, Lock, RefreshCw, Sliders, Flag, Trophy
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */

interface Cycle {
  id: number; name: string; cycle_type: string; start_date: string; end_date: string;
  review_deadline: string | null; status: string; staff_type: string; description: string | null;
  stats: { total: number; finalized: number; reviewed: number; pending: number; avg_score: number | null } | null;
}

interface Criteria {
  id: number; cycle_id: number | null; category: string; name: string;
  description: string | null; max_score: number; weightage: number; sort_order: number;
}

interface Review {
  id: number; cycle_id: number; staff_id: number; staff_type: string; status: string;
  self_score: number | null; reviewer_score: number | null; final_score: number | null;
  grade: string | null; rating_label: string | null;
  strengths: string | null; improvement_areas: string | null; goals_next_cycle: string | null;
  reviewer_remarks: string | null; hr_remarks: string | null;
  cycle_name: string; cycle_type: string; staff_name: string; employee_id: string; department: string | null;
}

interface ReviewDetail {
  review: Review & { start_date: string; end_date: string };
  scores: ScoreRow[];
  goals: Goal[];
}

interface ScoreRow {
  id: number; review_id: number; criteria_id: number; criteria_name: string;
  category: string; max_score: number; weightage: number;
  self_score: number | null; reviewer_score: number | null;
  self_remarks: string | null; reviewer_remarks: string | null;
}

interface Goal {
  id: number; review_id: number; title: string; description: string | null;
  category: string; target_date: string | null; progress_pct: number;
  status: string; remarks: string | null;
}

interface Stats {
  totals: { total: number; pending: number; self_rated: number; reviewed: number; finalized: number };
  grade_distrib: { grade: string; rating_label: string; cnt: number }[];
  avg_by_dept: { department: string; avg_score: number; cnt: number }[];
  top_performers: { id: number; staff_name: string; final_score: number; grade: string; rating_label: string; department: string; cycle_name: string }[];
  cycle_count: number;
}

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const GRADE_CFG: Record<string, { bg: string; text: string; border: string }> = {
  'A+': { bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-300' },
  'A':  { bg: 'bg-green-50',    text: 'text-green-700',   border: 'border-green-200'   },
  'B+': { bg: 'bg-sky-50',      text: 'text-sky-700',     border: 'border-sky-200'     },
  'B':  { bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200'    },
  'C':  { bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200'   },
  'D':  { bg: 'bg-orange-50',   text: 'text-orange-700',  border: 'border-orange-200'  },
  'E':  { bg: 'bg-rose-50',     text: 'text-rose-700',    border: 'border-rose-200'    },
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pending',    color: 'text-slate-600',   bg: 'bg-slate-100',   icon: <Clock className="w-3 h-3" />        },
  self_rated: { label: 'Self Rated', color: 'text-sky-700',    bg: 'bg-sky-100',    icon: <Star className="w-3 h-3" />         },
  reviewed:   { label: 'Reviewed',   color: 'text-violet-700', bg: 'bg-violet-100', icon: <CheckCircle2 className="w-3 h-3" /> },
  finalized:  { label: 'Finalized',  color: 'text-emerald-700',bg: 'bg-emerald-100',icon: <Lock className="w-3 h-3" />         },
  draft:      { label: 'Draft',      color: 'text-slate-500',  bg: 'bg-slate-100',  icon: <Edit2 className="w-3 h-3" />        },
  active:     { label: 'Active',     color: 'text-emerald-700',bg: 'bg-emerald-100',icon: <Play className="w-3 h-3" />         },
  review:     { label: 'In Review',  color: 'text-amber-700',  bg: 'bg-amber-100',  icon: <AlertCircle className="w-3 h-3" /> },
  closed:     { label: 'Closed',     color: 'text-rose-700',   bg: 'bg-rose-100',   icon: <Lock className="w-3 h-3" />         },
};

const CYCLE_TYPES = ['annual', 'quarterly', 'half_yearly', 'probation', 'custom'];
const CATEGORIES  = ['Teaching', 'Behavior', 'Punctuality', 'Leadership', 'Innovation', 'Communication', 'Teamwork', 'Administrative'];
const GOAL_CATS   = ['teaching', 'professional', 'personal', 'general'];
const GOAL_STATUS = ['pending', 'in_progress', 'achieved', 'not_achieved'];

const TABS = [
  { key: 'overview',  label: '📊 Overview'         },
  { key: 'cycles',    label: '📅 Appraisal Cycles'  },
  { key: 'reviews',   label: '⭐ Reviews'            },
  { key: 'criteria',  label: '🎯 KPI Criteria'      },
] as const;
type TabKey = typeof TABS[number]['key'];

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const ini = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const cols = ['bg-violet-100 text-violet-700','bg-indigo-100 text-indigo-700','bg-sky-100 text-sky-700','bg-emerald-100 text-emerald-700','bg-rose-100 text-rose-700','bg-amber-100 text-amber-700'];
  const c = cols[(name || ' ').charCodeAt(0) % cols.length];
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : size === 'lg' ? 'w-12 h-12 text-sm' : 'w-9 h-9 text-xs';
  return <div className={`${sz} rounded-full ${c} flex items-center justify-center font-black shrink-0`}>{ini}</div>;
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status] || { label: status, color: 'text-slate-500', bg: 'bg-slate-100', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.color} ${c.bg}`}>
      {c.icon}{c.label}
    </span>
  );
}

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return null;
  const c = GRADE_CFG[grade] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
  return (
    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border-2 text-sm font-black ${c.bg} ${c.text} ${c.border}`}>
      {grade}
    </span>
  );
}

function ScoreRing({ score, max = 10, size = 60 }: { score: number | null; max?: number; size?: number }) {
  if (score === null) return <div className="w-14 h-14 rounded-full border-4 border-slate-100 flex items-center justify-center"><span className="text-[10px] text-slate-300">—</span></div>;
  const pct = (score / max) * 100;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 85 ? '#10b981' : pct >= 65 ? '#6366f1' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-black" style={{ color }}>{score}</span>
        <span className="text-[8px] text-slate-400">/{max}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function PerformanceManagement() {
  const [tab, setTab] = useState<TabKey>('overview');

  /* Masters */
  const [departments, setDepartments] = useState<string[]>([]);

  /* Stats */
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedCycleForStats, setSelectedCycleForStats] = useState('');

  /* Cycles */
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [cycleModal, setCycleModal] = useState<Partial<Cycle> | null>(null);
  const [cycleModalBusy, setCycleModalBusy] = useState(false);

  /* Criteria */
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [loadingCriteria, setLoadingCriteria] = useState(false);
  const [criteriaModal, setCriteriaModal] = useState<Partial<Criteria> | null>(null);
  const [criteriaBusy, setCriteriaBusy] = useState(false);

  /* Reviews */
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPages, setReviewsPages] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [filterCycle, setFilterCycle] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDept, setFilterDept] = useState('');

  /* Review Detail */
  const [detailReviewId, setDetailReviewId] = useState<number | null>(null);
  const [reviewDetail, setReviewDetail] = useState<ReviewDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [scoreMode, setScoreMode] = useState<'self' | 'reviewer'>('reviewer');
  const [localScores, setLocalScores] = useState<Record<number, { score: string; remarks: string }>>({});
  const [qualitative, setQualitative] = useState({ strengths: '', improvement_areas: '', goals_next_cycle: '', reviewer_remarks: '' });
  const [savingScores, setSavingScores] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [hrRemarks, setHrRemarks] = useState('');

  /* Goal modal */
  const [goalModal, setGoalModal] = useState<Partial<Goal> | null>(null);
  const [goalBusy, setGoalBusy] = useState(false);

  useEffect(() => {
    api.get('/school/performance/masters').then(res => {
      if (res.data.success) { setDepartments(res.data.departments || []); }
    });
  }, []);

  /* ═══ Load Stats ═══ */
  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const params: any = {};
      if (selectedCycleForStats) params.cycle_id = selectedCycleForStats;
      const res = await api.get('/school/performance/stats', { params });
      if (res.data.success) setStats(res.data);
    } catch { toast.error('Failed to load stats'); }
    finally { setLoadingStats(false); }
  }, [selectedCycleForStats]);

  /* ═══ Load Cycles ═══ */
  const loadCycles = useCallback(async () => {
    setLoadingCycles(true);
    try {
      const res = await api.get('/school/performance/cycles');
      if (res.data.success) setCycles(res.data.data || []);
    } catch { toast.error('Failed to load cycles'); }
    finally { setLoadingCycles(false); }
  }, []);

  /* ═══ Load Criteria ═══ */
  const loadCriteria = useCallback(async () => {
    setLoadingCriteria(true);
    try {
      const res = await api.get('/school/performance/criteria');
      if (res.data.success) setCriteria(res.data.data || []);
    } catch { toast.error('Failed to load criteria'); }
    finally { setLoadingCriteria(false); }
  }, []);

  /* ═══ Load Reviews ═══ */
  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const params: any = { per_page: 20, page: reviewsPage };
      if (filterCycle)  params.cycle_id   = filterCycle;
      if (filterStatus) params.status     = filterStatus;
      if (filterDept)   params.department = filterDept;
      const res = await api.get('/school/performance/reviews', { params });
      if (res.data.success) {
        setReviews(res.data.data || []);
        setReviewsTotal(res.data.meta?.total || 0);
        setReviewsPages(res.data.meta?.last_page || 1);
      }
    } catch { toast.error('Failed to load reviews'); }
    finally { setLoadingReviews(false); }
  }, [reviewsPage, filterCycle, filterStatus, filterDept]);

  useEffect(() => { if (tab === 'overview')  loadStats();    }, [tab, loadStats]);
  useEffect(() => { if (tab === 'cycles')    loadCycles();   }, [tab, loadCycles]);
  useEffect(() => { if (tab === 'criteria')  loadCriteria(); }, [tab, loadCriteria]);
  useEffect(() => { if (tab === 'reviews')   loadReviews();  }, [tab, loadReviews]);

  /* ═══ Load Review Detail ═══ */
  const loadDetail = useCallback(async (id: number) => {
    setDetailReviewId(id);
    setLoadingDetail(true);
    setReviewDetail(null);
    try {
      const res = await api.get(`/school/performance/reviews/${id}`);
      if (res.data.success) {
        setReviewDetail(res.data);
        const init: Record<number, { score: string; remarks: string }> = {};
        res.data.scores.forEach((s: ScoreRow) => {
          init[s.criteria_id] = { score: String(s.reviewer_score ?? s.self_score ?? ''), remarks: s.reviewer_remarks || s.self_remarks || '' };
        });
        setLocalScores(init);
        setQualitative({
          strengths:         res.data.review.strengths || '',
          improvement_areas: res.data.review.improvement_areas || '',
          goals_next_cycle:  res.data.review.goals_next_cycle || '',
          reviewer_remarks:  res.data.review.reviewer_remarks || '',
        });
        setHrRemarks(res.data.review.hr_remarks || '');
      }
    } catch { toast.error('Failed to load review'); }
    finally { setLoadingDetail(false); }
  }, []);

  /* ═══ Save Cycle ═══ */
  const handleSaveCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleModal) return;
    setCycleModalBusy(true);
    try {
      if (cycleModal.id) {
        await api.put(`/school/performance/cycles/${cycleModal.id}`, cycleModal);
        toast.success('Cycle updated');
      } else {
        await api.post('/school/performance/cycles', cycleModal);
        toast.success('Cycle created');
      }
      setCycleModal(null); loadCycles();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCycleModalBusy(false); }
  };

  const handleInitiateCycle = async (id: number) => {
    if (!confirm('This will create review records for all eligible staff. Continue?')) return;
    try {
      const res = await api.post(`/school/performance/cycles/${id}/initiate`);
      if (res.data.success) { toast.success(res.data.message); loadCycles(); }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDeleteCycle = async (id: number) => {
    if (!confirm('Delete this cycle?')) return;
    try { await api.delete(`/school/performance/cycles/${id}`); toast.success('Deleted'); loadCycles(); }
    catch { toast.error('Failed'); }
  };

  /* ═══ Save Criteria ═══ */
  const handleSaveCriteria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!criteriaModal) return;
    setCriteriaBusy(true);
    try {
      if (criteriaModal.id) {
        await api.put(`/school/performance/criteria/${criteriaModal.id}`, criteriaModal);
        toast.success('Criteria updated');
      } else {
        await api.post('/school/performance/criteria', criteriaModal);
        toast.success('Criteria added');
      }
      setCriteriaModal(null); loadCriteria();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCriteriaBusy(false); }
  };

  /* ═══ Save Scores ═══ */
  const handleSaveScores = async () => {
    if (!reviewDetail) return;
    setSavingScores(true);
    try {
      const scores = criteria.map(c => ({
        criteria_id: c.id,
        score: parseFloat(localScores[c.id]?.score || '0') || 0,
        remarks: localScores[c.id]?.remarks || '',
      }));
      await api.post(`/school/performance/reviews/${reviewDetail.review.id}/score`, {
        mode: scoreMode,
        scores,
        ...qualitative,
      });
      toast.success('Scores saved');
      loadDetail(reviewDetail.review.id);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingScores(false); }
  };

  /* ═══ Finalize ═══ */
  const handleFinalize = async () => {
    if (!reviewDetail || !confirm('Finalize this review? This action cannot be undone.')) return;
    setFinalizing(true);
    try {
      const res = await api.post(`/school/performance/reviews/${reviewDetail.review.id}/finalize`, { hr_remarks: hrRemarks });
      if (res.data.success) { toast.success('Review finalized! Grade: ' + res.data.grade); loadDetail(reviewDetail.review.id); loadReviews(); }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setFinalizing(false); }
  };

  /* ═══ Goals ═══ */
  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalModal || !reviewDetail) return;
    setGoalBusy(true);
    try {
      if (goalModal.id) {
        await api.put(`/school/performance/goals/${goalModal.id}`, goalModal);
        toast.success('Goal updated');
      } else {
        await api.post(`/school/performance/reviews/${reviewDetail.review.id}/goals`, goalModal);
        toast.success('Goal added');
      }
      setGoalModal(null); loadDetail(reviewDetail.review.id);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setGoalBusy(false); }
  };

  const handleDeleteGoal = async (id: number) => {
    if (!confirm('Delete goal?')) return;
    try { await api.delete(`/school/performance/goals/${id}`); toast.success('Removed'); reviewDetail && loadDetail(reviewDetail.review.id); }
    catch { toast.error('Failed'); }
  };

  /* If in detail view */
  if (detailReviewId) {
    const review = reviewDetail?.review;
    const criteriaUsed = reviewDetail?.scores && reviewDetail.scores.length > 0
      ? reviewDetail.scores
      : criteria.map(c => ({ criteria_id: c.id, criteria_name: c.name, category: c.category, max_score: c.max_score, weightage: c.weightage, self_score: null, reviewer_score: null, self_remarks: null, reviewer_remarks: null } as ScoreRow));

    return (
      <div className="space-y-4">
        {/* Detail header */}
        <div className="flex items-center gap-3">
          <button onClick={() => { setDetailReviewId(null); setReviewDetail(null); }}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition"><ArrowLeft className="w-4 h-4" /></button>
          {loadingDetail ? (
            <div className="w-5 h-5 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" />
          ) : review ? (
            <div className="flex items-center gap-3 flex-1">
              <Avatar name={review.staff_name} size="lg" />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900">{review.staff_name}</h2>
                <p className="text-xs text-slate-500">{review.department} · {review.employee_id} · {review.cycle_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={review.status} />
                {review.grade && <GradeBadge grade={review.grade} />}
                {review.rating_label && <span className="text-xs font-bold text-slate-600">{review.rating_label}</span>}
              </div>
            </div>
          ) : null}
        </div>

        {!loadingDetail && review && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* LEFT: Score entry */}
            <div className="lg:col-span-2 space-y-3">
              {/* Mode selector */}
              {review.status !== 'finalized' && (
                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Scoring mode:</span>
                  {(['self', 'reviewer'] as const).map(m => (
                    <button key={m} onClick={() => setScoreMode(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${scoreMode === m ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                      {m === 'self' ? '👤 Self' : '👨‍💼 Reviewer'}
                    </button>
                  ))}
                </div>
              )}

              {/* Criteria score cards */}
              {(() => {
                const byCat = criteriaUsed.reduce((acc, c) => {
                  (acc[c.category] = acc[c.category] || []).push(c);
                  return acc;
                }, {} as Record<string, ScoreRow[]>);
                return Object.entries(byCat).map(([cat, rows]) => (
                  <div key={cat} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-2.5 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-slate-100">
                      <h3 className="text-xs font-bold text-violet-700 uppercase tracking-wider">{cat}</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {rows.map(row => {
                        const ls = localScores[row.criteria_id] || { score: '', remarks: '' };
                        const scoredVal = parseFloat(ls.score) || 0;
                        const pct = row.max_score > 0 ? Math.min(100, (scoredVal / row.max_score) * 100) : 0;
                        return (
                          <div key={row.criteria_id} className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800">{row.criteria_name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[9px] text-slate-400">Weight: {row.weightage}×</span>
                                  {row.self_score !== null && <span className="text-[9px] text-sky-600">Self: {row.self_score}/{row.max_score}</span>}
                                  {row.reviewer_score !== null && <span className="text-[9px] text-violet-600">Reviewer: {row.reviewer_score}/{row.max_score}</span>}
                                </div>
                                {/* Score bar */}
                                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
                                    style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                              {/* Score input */}
                              {review.status !== 'finalized' ? (
                                <div className="flex flex-col gap-1 shrink-0 w-24">
                                  <div className="flex items-center gap-1">
                                    <input type="number" min={0} max={row.max_score} step="0.5"
                                      value={ls.score}
                                      onChange={e => setLocalScores(prev => ({ ...prev, [row.criteria_id]: { ...prev[row.criteria_id] || { remarks: '' }, score: e.target.value } }))}
                                      className="w-14 px-2 py-1 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-violet-400" />
                                    <span className="text-[10px] text-slate-400">/{row.max_score}</span>
                                  </div>
                                  <input type="text" placeholder="Remarks..."
                                    value={ls.remarks}
                                    onChange={e => setLocalScores(prev => ({ ...prev, [row.criteria_id]: { ...prev[row.criteria_id] || { score: '' }, remarks: e.target.value } }))}
                                    className="w-full px-2 py-1 border border-slate-100 rounded-lg text-[10px] focus:outline-none focus:border-violet-400 bg-slate-50" />
                                </div>
                              ) : (
                                <ScoreRing score={row.reviewer_score ?? row.self_score} max={row.max_score} size={52} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}

              {/* Qualitative */}
              {review.status !== 'finalized' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Qualitative Feedback</h3>
                  {([['strengths', '💪 Strengths'], ['improvement_areas', '📈 Areas for Improvement'], ['goals_next_cycle', '🎯 Goals for Next Cycle'], ['reviewer_remarks', '💬 Reviewer Remarks']] as const).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</label>
                      <textarea rows={2} value={qualitative[key]} onChange={e => setQualitative(q => ({ ...q, [key]: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 resize-none bg-white" />
                    </div>
                  ))}
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={handleSaveScores} disabled={savingScores}
                      className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50">
                      {savingScores ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save Scores
                    </button>
                  </div>
                </div>
              )}

              {/* Finalize */}
              {(review.status === 'reviewed' || review.status === 'self_rated') && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Finalize Review</h3>
                  <textarea rows={2} value={hrRemarks} onChange={e => setHrRemarks(e.target.value)} placeholder="HR final remarks (optional)..."
                    className="w-full px-3 py-2 border border-emerald-200 rounded-xl text-xs focus:outline-none resize-none bg-white" />
                  <button onClick={handleFinalize} disabled={finalizing}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50">
                    {finalizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Finalize & Lock Review
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT: Sidebar */}
            <div className="space-y-3">
              {/* Score summary */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase">Score Summary</h3>
                <div className="flex justify-around">
                  <div><ScoreRing score={review.self_score} size={56} /><p className="text-[9px] text-slate-400 mt-1">Self</p></div>
                  <div><ScoreRing score={review.reviewer_score} size={56} /><p className="text-[9px] text-slate-400 mt-1">Reviewer</p></div>
                  <div><ScoreRing score={review.final_score} size={56} /><p className="text-[9px] text-slate-400 mt-1">Final</p></div>
                </div>
                {review.grade && (
                  <div className="flex items-center justify-center gap-2">
                    <GradeBadge grade={review.grade} />
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-800">{review.rating_label}</p>
                      <p className="text-[10px] text-slate-400">Final Grade</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Qualitative display (if finalized) */}
              {review.status === 'finalized' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                  {review.strengths && <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Strengths</p><p className="text-xs text-slate-700">{review.strengths}</p></div>}
                  {review.improvement_areas && <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Areas to Improve</p><p className="text-xs text-slate-700">{review.improvement_areas}</p></div>}
                  {review.reviewer_remarks && <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Reviewer Remarks</p><p className="text-xs text-slate-700">{review.reviewer_remarks}</p></div>}
                  {review.hr_remarks && <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">HR Remarks</p><p className="text-xs text-slate-700">{review.hr_remarks}</p></div>}
                </div>
              )}

              {/* Goals */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1"><Target className="w-3 h-3 text-violet-500" /> Goals</h3>
                  <button onClick={() => setGoalModal({ category: 'general', status: 'pending', progress_pct: 0 })}
                    className="p-1 text-violet-500 hover:bg-violet-50 rounded-lg transition"><Plus className="w-4 h-4" /></button>
                </div>
                {(reviewDetail?.goals || []).length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center py-4">No goals set yet</p>
                ) : (
                  <div className="space-y-2">
                    {(reviewDetail?.goals || []).map(g => {
                      const goalStatusCfg: Record<string, string> = { pending: 'bg-slate-100 text-slate-600', in_progress: 'bg-sky-100 text-sky-700', achieved: 'bg-emerald-100 text-emerald-700', not_achieved: 'bg-rose-100 text-rose-700' };
                      return (
                        <div key={g.id} className="rounded-xl border border-slate-100 p-3 space-y-1.5">
                          <div className="flex items-start gap-2">
                            <Flag className="w-3 h-3 text-violet-400 mt-0.5 shrink-0" />
                            <p className="text-xs font-bold text-slate-700 flex-1">{g.title}</p>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${goalStatusCfg[g.status] || 'bg-slate-100 text-slate-600'}`}>{g.status.replace('_', ' ')}</span>
                            <button onClick={() => setGoalModal(g)} className="text-slate-300 hover:text-violet-500 transition"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => handleDeleteGoal(g.id)} className="text-slate-300 hover:text-rose-500 transition"><Trash2 className="w-3 h-3" /></button>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-violet-500 rounded-full" style={{ width: `${g.progress_pct}%` }} />
                            </div>
                            <span className="text-[9px] text-slate-500">{g.progress_pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Goal Modal */}
        {goalModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold">{goalModal.id ? 'Edit Goal' : 'Add Goal'}</h3>
                <button onClick={() => setGoalModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleSaveGoal} className="p-5 space-y-3">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Title *</label>
                  <input required value={goalModal.title || ''} onChange={e => setGoalModal(g => g ? {...g, title: e.target.value} : g)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                    <select value={goalModal.category || 'general'} onChange={e => setGoalModal(g => g ? {...g, category: e.target.value} : g)} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 bg-white">
                      {GOAL_CATS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                    <select value={goalModal.status || 'pending'} onChange={e => setGoalModal(g => g ? {...g, status: e.target.value} : g)} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 bg-white">
                      {GOAL_STATUS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Date</label>
                    <input type="date" value={goalModal.target_date || ''} onChange={e => setGoalModal(g => g ? {...g, target_date: e.target.value} : g)} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Progress %</label>
                    <input type="number" min={0} max={100} value={goalModal.progress_pct ?? 0} onChange={e => setGoalModal(g => g ? {...g, progress_pct: parseInt(e.target.value) || 0} : g)} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setGoalModal(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                  <button type="submit" disabled={goalBusy} className="px-4 py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-1.5">
                    {goalBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     MAIN LIST VIEW
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-violet-50 text-violet-600 rounded-lg"><TrendingUp className="w-5 h-5" /></span>
            Performance Management Hub
          </h1>
          <p className="text-slate-500 mt-1 text-xs">Appraisal cycles, KPI scoring, teacher reviews, grade finalization, and goal tracking.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${tab === t.key ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════ TAB: OVERVIEW ═══════════ */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <select value={selectedCycleForStats} onChange={e => setSelectedCycleForStats(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 shadow-sm">
              <option value="">All Cycles</option>
              {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={loadStats} className="px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loadingStats ? (
            <div className="flex items-center justify-center py-14"><div className="w-8 h-8 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" /></div>
          ) : stats ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {[
                  { label: 'Total Reviews', val: stats.totals.total,      color: 'text-slate-700',   bg: 'bg-slate-50'    },
                  { label: 'Pending',       val: stats.totals.pending,     color: 'text-slate-500',   bg: 'bg-slate-50'    },
                  { label: 'Self Rated',    val: stats.totals.self_rated,  color: 'text-sky-700',    bg: 'bg-sky-50'      },
                  { label: 'Reviewed',      val: stats.totals.reviewed,    color: 'text-violet-700', bg: 'bg-violet-50'   },
                  { label: 'Finalized',     val: stats.totals.finalized,   color: 'text-emerald-700',bg: 'bg-emerald-50'  },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 border border-white shadow-sm`}>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">{s.label}</span>
                    <span className={`text-2xl font-black ${s.color}`}>{s.val}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Grade Distribution */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-amber-500" /> Grade Distribution</h3>
                  {stats.grade_distrib.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No finalized reviews yet</p> : (
                    <div className="space-y-2">
                      {stats.grade_distrib.map(g => {
                        const max = Math.max(...stats.grade_distrib.map(x => x.cnt));
                        return (
                          <div key={g.grade} className="flex items-center gap-2">
                            <GradeBadge grade={g.grade} />
                            <div className="flex-1">
                              <div className="flex justify-between text-[9px] text-slate-500 mb-0.5"><span>{g.rating_label}</span><span>{g.cnt}</span></div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${(GRADE_CFG[g.grade] || {}).text?.replace('text-', 'bg-') || 'bg-violet-500'}`} style={{ width: `${(g.cnt / max) * 100}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Avg by Department */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-indigo-500" /> Avg Score by Dept</h3>
                  {stats.avg_by_dept.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No scored reviews yet</p> : (
                    <div className="space-y-2">
                      {stats.avg_by_dept.map(d => (
                        <div key={d.department}>
                          <div className="flex justify-between text-[10px] text-slate-600 mb-0.5 font-semibold"><span>{d.department}</span><span className="text-violet-700 font-bold">{d.avg_score}/10</span></div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" style={{ width: `${(d.avg_score / 10) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Performers */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-amber-500" /> Top Performers</h3>
                  {stats.top_performers.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No finalized reviews yet</p> : (
                    <div className="space-y-2">
                      {stats.top_performers.slice(0, 5).map((p, i) => (
                        <div key={p.id} className="flex items-center gap-2">
                          <span className="text-xs font-black w-5 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}</span>
                          <Avatar name={p.staff_name} size="sm" />
                          <div className="flex-1 min-w-0"><p className="text-xs font-bold text-slate-800 truncate">{p.staff_name}</p><p className="text-[9px] text-slate-400">{p.department}</p></div>
                          <GradeBadge grade={p.grade} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ═══════════ TAB: CYCLES ═══════════ */}
      {tab === 'cycles' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setCycleModal({ cycle_type: 'annual', status: 'draft', staff_type: 'all' })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition shadow-sm">
              <Plus className="w-3.5 h-3.5" /> New Cycle
            </button>
          </div>
          {loadingCycles ? <div className="flex justify-center py-14"><div className="w-8 h-8 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" /></div> : (
            <div className="space-y-2">
              {cycles.map(c => (
                <div key={c.id} className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm hover:border-violet-200 transition">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-violet-50 rounded-xl shrink-0"><Calendar className="w-5 h-5 text-violet-600" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-bold text-slate-800">{c.name}</h3>
                        <StatusBadge status={c.status} />
                        <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full font-bold capitalize">{c.cycle_type}</span>
                        <span className="text-[10px] text-slate-400">{c.staff_type}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">{c.start_date} → {c.end_date}{c.review_deadline ? ` · Deadline: ${c.review_deadline}` : ''}</p>
                      {c.description && <p className="text-[10px] text-slate-400 mt-1">{c.description}</p>}
                    </div>
                    {/* Stats */}
                    {c.stats && c.stats.total > 0 && (
                      <div className="hidden sm:flex items-center gap-4 shrink-0 text-center">
                        <div><p className="text-lg font-black text-slate-700">{c.stats.total}</p><p className="text-[9px] text-slate-400">Total</p></div>
                        <div><p className="text-lg font-black text-emerald-700">{c.stats.finalized}</p><p className="text-[9px] text-slate-400">Finalized</p></div>
                        {c.stats.avg_score !== null && <div><p className="text-lg font-black text-violet-700">{c.stats.avg_score}</p><p className="text-[9px] text-slate-400">Avg/10</p></div>}
                      </div>
                    )}
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {c.status !== 'closed' && (
                        <button onClick={() => handleInitiateCycle(c.id)} title="Initiate Reviews"
                          className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition"><Play className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => setCycleModal(c)} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteCycle(c.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {/* Progress bar */}
                  {c.stats && c.stats.total > 0 && (
                    <div className="mt-3">
                      <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-400" style={{ width: `${(c.stats.finalized / c.stats.total) * 100}%` }} />
                        <div className="bg-violet-400" style={{ width: `${(c.stats.reviewed / c.stats.total) * 100}%` }} />
                        <div className="flex-1 bg-slate-100" />
                      </div>
                      <div className="flex gap-3 mt-1 text-[9px]">
                        <span className="text-emerald-600 font-bold">● {c.stats.finalized} Finalized</span>
                        <span className="text-violet-600 font-bold">● {c.stats.reviewed} Reviewed</span>
                        <span className="text-slate-400">● {c.stats.pending} Pending</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {cycles.length === 0 && !loadingCycles && (
                <div className="text-center py-14 bg-white border border-slate-200 rounded-xl"><Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-sm text-slate-400">No cycles yet. Create your first appraisal cycle.</p></div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ TAB: REVIEWS ═══════════ */}
      {tab === 'reviews' && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-wrap gap-2">
            <select value={filterCycle} onChange={e => setFilterCycle(e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 shadow-sm">
              <option value="">All Cycles</option>
              {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 shadow-sm">
              <option value="">All Status</option>
              {(['pending','self_rated','reviewed','finalized'] as const).map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
            </select>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 shadow-sm">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button onClick={() => { setReviewsPage(1); loadReviews(); }} className="px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg shadow-sm transition">Filter</button>
            <span className="text-[10px] text-slate-400 ml-auto self-center">{reviewsTotal} reviews</span>
          </div>

          {loadingReviews ? <div className="flex justify-center py-14"><div className="w-8 h-8 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" /></div> : reviews.length === 0 ? (
            <div className="text-center py-14 bg-white border border-slate-200 rounded-xl"><Star className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-sm text-slate-400">No reviews found. Initiate a cycle first.</p></div>
          ) : (
            <div className="space-y-2">
              {reviews.map(r => (
                <div key={r.id} className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm hover:border-violet-300 hover:shadow-md transition cursor-pointer"
                  onClick={() => { loadDetail(r.id); loadCriteria(); }}>
                  <div className="flex items-center gap-3">
                    <Avatar name={r.staff_name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-bold text-slate-800">{r.staff_name}</p>
                        {r.department && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold border border-indigo-200">{r.department}</span>}
                        <span className="font-mono text-[10px] text-slate-400">{r.employee_id}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-500">
                        <span>{r.cycle_name}</span>
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4 shrink-0">
                      {r.self_score !== null && <div className="text-center"><p className="text-base font-black text-sky-700">{r.self_score}</p><p className="text-[9px] text-slate-400">Self</p></div>}
                      {r.reviewer_score !== null && <div className="text-center"><p className="text-base font-black text-violet-700">{r.reviewer_score}</p><p className="text-[9px] text-slate-400">Reviewer</p></div>}
                      {r.final_score !== null && <div className="text-center"><p className="text-base font-black text-emerald-700">{r.final_score}</p><p className="text-[9px] text-slate-400">Final</p></div>}
                      {r.grade && <GradeBadge grade={r.grade} />}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              ))}
              {/* Pagination */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">Page {reviewsPage} of {reviewsPages}</span>
                <div className="flex gap-2">
                  <button disabled={reviewsPage <= 1} onClick={() => setReviewsPage(p => p - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-30 hover:bg-slate-50 transition">← Prev</button>
                  <button disabled={reviewsPage >= reviewsPages} onClick={() => setReviewsPage(p => p + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-30 hover:bg-slate-50 transition">Next →</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ TAB: CRITERIA ═══════════ */}
      {tab === 'criteria' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setCriteriaModal({ category: 'Teaching', max_score: 10, weightage: 1, sort_order: 0 })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Add Criteria
            </button>
          </div>
          {loadingCriteria ? <div className="flex justify-center py-14"><div className="w-8 h-8 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" /></div> : (
            (() => {
              const byCat = criteria.reduce((acc, c) => { (acc[c.category] = acc[c.category] || []).push(c); return acc; }, {} as Record<string, Criteria[]>);
              return Object.entries(byCat).map(([cat, rows]) => (
                <div key={cat} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-violet-700 uppercase tracking-wider">{cat}</h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {rows.map(c => (
                      <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition">
                        <Sliders className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800">{c.name}</p>
                          {c.description && <p className="text-[10px] text-slate-400">{c.description}</p>}
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-center">
                          <div><p className="text-sm font-black text-violet-700">{c.max_score}</p><p className="text-[9px] text-slate-400">Max</p></div>
                          <div><p className="text-sm font-black text-indigo-700">{c.weightage}×</p><p className="text-[9px] text-slate-400">Weight</p></div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setCriteriaModal(c)} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={async () => { if (!confirm('Delete criteria?')) return; try { await api.delete(`/school/performance/criteria/${c.id}`); toast.success('Deleted'); loadCriteria(); } catch { toast.error('Failed'); } }}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()
          )}
          {criteria.length === 0 && !loadingCriteria && (
            <div className="text-center py-14 bg-white border border-slate-200 rounded-xl"><Target className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-sm text-slate-400">No KPI criteria defined yet.</p></div>
          )}
        </div>
      )}

      {/* CYCLE MODAL */}
      {cycleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold">{cycleModal.id ? 'Edit Cycle' : 'New Appraisal Cycle'}</h3>
              <button onClick={() => setCycleModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveCycle} className="p-6 space-y-3">
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cycle Name *</label>
                <input required value={cycleModal.name || ''} onChange={e => setCycleModal(m => m ? {...m, name: e.target.value} : m)} placeholder="e.g. Annual Appraisal 2025-26" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Type</label>
                  <select value={cycleModal.cycle_type || 'annual'} onChange={e => setCycleModal(m => m ? {...m, cycle_type: e.target.value} : m)} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 bg-white capitalize">
                    {CYCLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Staff Type</label>
                  <select value={cycleModal.staff_type || 'all'} onChange={e => setCycleModal(m => m ? {...m, staff_type: e.target.value} : m)} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 bg-white">
                    <option value="all">All Staff</option><option value="Teacher">Teachers Only</option><option value="NonTeaching">Non-Teaching Only</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Start Date *</label>
                  <input required type="date" value={cycleModal.start_date || ''} onChange={e => setCycleModal(m => m ? {...m, start_date: e.target.value} : m)} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">End Date *</label>
                  <input required type="date" value={cycleModal.end_date || ''} onChange={e => setCycleModal(m => m ? {...m, end_date: e.target.value} : m)} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
              </div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Review Deadline</label>
                <input type="date" value={cycleModal.review_deadline || ''} onChange={e => setCycleModal(m => m ? {...m, review_deadline: e.target.value} : m)} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
              {cycleModal.id && (
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                  <select value={cycleModal.status || 'draft'} onChange={e => setCycleModal(m => m ? {...m, status: e.target.value} : m)} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 bg-white">
                    {(['draft','active','review','closed'] as const).map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}</select></div>
              )}
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
                <textarea rows={2} value={cycleModal.description || ''} onChange={e => setCycleModal(m => m ? {...m, description: e.target.value} : m)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 resize-none" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setCycleModal(null)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={cycleModalBusy} className="px-4 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition shadow-sm disabled:opacity-50 flex items-center gap-1.5">
                  {cycleModalBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save Cycle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRITERIA MODAL */}
      {criteriaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold">{criteriaModal.id ? 'Edit KPI Criteria' : 'Add KPI Criteria'}</h3>
              <button onClick={() => setCriteriaModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveCriteria} className="p-6 space-y-3">
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Criteria Name *</label>
                <input required value={criteriaModal.name || ''} onChange={e => setCriteriaModal(m => m ? {...m, name: e.target.value} : m)} placeholder="e.g. Subject Knowledge & Delivery" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                  <select value={criteriaModal.category || 'Teaching'} onChange={e => setCriteriaModal(m => m ? {...m, category: e.target.value} : m)} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 bg-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Max Score</label>
                  <input type="number" min={1} max={100} value={criteriaModal.max_score ?? 10} onChange={e => setCriteriaModal(m => m ? {...m, max_score: parseInt(e.target.value) || 10} : m)} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Weightage (×)</label>
                  <input type="number" step="0.1" min={0.1} value={criteriaModal.weightage ?? 1} onChange={e => setCriteriaModal(m => m ? {...m, weightage: parseFloat(e.target.value) || 1} : m)} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sort Order</label>
                  <input type="number" min={0} value={criteriaModal.sort_order ?? 0} onChange={e => setCriteriaModal(m => m ? {...m, sort_order: parseInt(e.target.value) || 0} : m)} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
              </div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
                <textarea rows={2} value={criteriaModal.description || ''} onChange={e => setCriteriaModal(m => m ? {...m, description: e.target.value} : m)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 resize-none" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setCriteriaModal(null)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={criteriaBusy} className="px-4 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition shadow-sm disabled:opacity-50 flex items-center gap-1.5">
                  {criteriaBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
