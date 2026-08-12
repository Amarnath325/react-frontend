import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Crown, Database, Building, DollarSign, Plus, CheckCircle2, RefreshCw, ExternalLink, Server, Users, TrendingUp, AlertTriangle, MessageSquare, Mail, Phone, HardDrive, Activity, Clock, Zap, Bell, BarChart3, ArrowUpRight, ArrowDownRight, Wifi, WifiOff, BookOpen, UserCheck, Globe } from 'lucide-react';
import api from '../../services/api';
import SchoolOnboardingModal from '../../components/Landlord/SchoolOnboardingModal';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface TenantItem {
  id: number; school_name: string; school_code: string;
  domain?: string; db_name: string; db_host: string;
  admin_email: string; status: string; created_at: string;
}

interface KpiData {
  // Schools
  totalSchools: number; activeSchools: number; suspendedSchools: number;
  trialSchools: number; expiredSchools: number; newSchoolsThisMonth: number;
  // Users
  totalStudents: number; totalTeachers: number; totalParents: number;
  mau: number; dau: number;
  // Revenue
  mrr: number; arr: number; revenueGrowth: number;
  pendingRenewals: number; failedPayments: number;
  // Infrastructure
  storageUsed: number; storageTotalGb: number;
  dbUsedGb: number; dbTotalGb: number;
  apiRequestsToday: number;
  // Comms
  smsSent: number; whatsappSent: number; emailSent: number;
  // Server
  cpuUsage: number; memoryUsage: number; diskUsage: number;
  serverStatus: 'online' | 'degraded' | 'offline';
  queuePending: number; queueFailed: number;
  backupStatus: 'success' | 'running' | 'failed';
  lastBackup: string;
}

interface RecentActivity {
  id: number; type: string; message: string; time: string; level: 'info' | 'warn' | 'error';
}

interface SupportTicket {
  id: number; school: string; subject: string; priority: string; status: string;
}

// ──────────────────────────────────────────────
// Mock data generators
// ──────────────────────────────────────────────
const generateKpi = (): KpiData => ({
  totalSchools: 58 + Math.floor(Math.random() * 3),
  activeSchools: 48,
  suspendedSchools: 4,
  trialSchools: 6,
  expiredSchools: Math.floor(Math.random() * 3),
  newSchoolsThisMonth: 7,
  totalStudents: 42300 + Math.floor(Math.random() * 200),
  totalTeachers: 3850 + Math.floor(Math.random() * 20),
  totalParents: 38200 + Math.floor(Math.random() * 100),
  mau: 28400 + Math.floor(Math.random() * 500),
  dau: 9200 + Math.floor(Math.random() * 300),
  mrr: 178500,
  arr: 2142000,
  revenueGrowth: 7.9,
  pendingRenewals: 8,
  failedPayments: 3,
  storageUsed: 38.6 + Math.random() * 0.5,
  storageTotalGb: 100,
  dbUsedGb: 14.2 + Math.random() * 0.2,
  dbTotalGb: 50,
  apiRequestsToday: 124800 + Math.floor(Math.random() * 2000),
  smsSent: 8420 + Math.floor(Math.random() * 100),
  whatsappSent: 12340 + Math.floor(Math.random() * 200),
  emailSent: 5680 + Math.floor(Math.random() * 80),
  cpuUsage: 28 + Math.random() * 8,
  memoryUsage: 62 + Math.random() * 5,
  diskUsage: 44 + Math.random() * 2,
  serverStatus: 'online',
  queuePending: Math.floor(Math.random() * 30),
  queueFailed: Math.floor(Math.random() * 5),
  backupStatus: 'success',
  lastBackup: '03 Aug 2026, 02:00 AM',
});

const recentActivities: RecentActivity[] = [
  { id: 1, type: 'Tenant', message: 'New school provisioned: Sunrise Academy (Pro Plan)', time: '2m ago', level: 'info' },
  { id: 2, type: 'Payment', message: 'Payment failed for DPS Noida — ₹18,000 (Razorpay)', time: '12m ago', level: 'error' },
  { id: 3, type: 'Security', message: 'Login from new IP: 203.82.xxx.xxx — admin@sunrise.in', time: '18m ago', level: 'warn' },
  { id: 4, type: 'Backup', message: 'Auto backup completed — 58 tenant DBs (14.2 GB)', time: '2h ago', level: 'info' },
  { id: 5, type: 'Billing', message: 'Cambridge Intl renewed Enterprise plan — ₹48,000', time: '3h ago', level: 'info' },
  { id: 6, type: 'Alert', message: 'Queue spike detected — 89 failed jobs in queue-sms', time: '4h ago', level: 'warn' },
  { id: 7, type: 'Tenant', message: 'Tenant suspended: Blue Bell School (non-payment 45d)', time: '6h ago', level: 'warn' },
  { id: 8, type: 'System', message: 'API rate limit hit by school_oxford key (12k req/hr)', time: '8h ago', level: 'warn' },
];

const supportTickets: SupportTicket[] = [
  { id: 1, school: 'DPS Noida', subject: 'SMS OTPs not sending', priority: 'critical', status: 'open' },
  { id: 2, school: 'St Marys Convent', subject: 'PDF report cards failing', priority: 'high', status: 'in_progress' },
  { id: 3, school: 'Cambridge Intl', subject: 'WhatsApp messages delayed', priority: 'medium', status: 'open' },
  { id: 4, school: 'Sunrise Academy', subject: 'Biometric device disconnected', priority: 'high', status: 'open' },
];

const recentSchools = [
  { name: 'Sunrise Academy', plan: 'Pro', code: 'sunrise_ac', date: '2026-08-03', students: 420 },
  { name: 'Blue Bells School', plan: 'Basic', code: 'blue_bells', date: '2026-08-01', students: 180 },
  { name: 'Green Valley CBSE', plan: 'Enterprise', code: 'green_valley', date: '2026-07-30', students: 950 },
  { name: 'Heritage Academy', plan: 'Pro', code: 'heritage_ac', date: '2026-07-28', students: 620 },
];

const systemAlerts = [
  { id: 1, title: 'Failed Payments', value: 3, color: 'red', desc: 'Requires manual follow-up' },
  { id: 2, title: 'Pending Renewals', value: 8, color: 'amber', desc: 'Due within 7 days' },
  { id: 3, title: 'Suspended Tenants', value: 4, color: 'orange', desc: 'Awaiting payment' },
  { id: 4, title: 'Queue Failures', value: 12, color: 'red', desc: 'jobs in dead queue' },
  { id: 5, title: 'Trial Expiring', value: 3, color: 'yellow', desc: 'expiring within 3 days' },
  { id: 6, title: 'SSL Expiring', value: 2, color: 'orange', desc: 'domains in 14 days' },
];

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────
interface StatCardProps {
  label: string; value: string | number; icon: React.ElementType;
  color: string; sub?: string; trend?: 'up' | 'down' | null; trendVal?: string;
  pulse?: boolean;
}
function StatCard({ label, value, icon: Icon, color, sub, trend, trendVal, pulse }: StatCardProps) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/15 text-blue-400 border-blue-400/20',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-400/20',
    violet: 'bg-violet-500/15 text-violet-400 border-violet-400/20',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-400/20',
    red: 'bg-red-500/15 text-red-400 border-red-400/20',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-400/20',
    orange: 'bg-orange-500/15 text-orange-400 border-orange-400/20',
    pink: 'bg-pink-500/15 text-pink-400 border-pink-400/20',
    teal: 'bg-teal-500/15 text-teal-400 border-teal-400/20',
    fuchsia: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-400/20',
    lime: 'bg-lime-500/15 text-lime-400 border-lime-400/20',
    sky: 'bg-sky-500/15 text-sky-400 border-sky-400/20',
    indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-400/20',
    slate: 'bg-slate-700 text-slate-300 border-slate-600',
  };
  const textColorMap: Record<string, string> = {
    blue: 'text-blue-400', emerald: 'text-emerald-400', violet: 'text-violet-400',
    amber: 'text-amber-400', red: 'text-red-400', cyan: 'text-cyan-400',
    orange: 'text-orange-400', pink: 'text-pink-400', teal: 'text-teal-400',
    fuchsia: 'text-fuchsia-400', lime: 'text-lime-400', sky: 'text-sky-400',
    indigo: 'text-indigo-400', slate: 'text-slate-300',
  };
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-all group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl border ${colorMap[color] || colorMap.slate} ${pulse ? 'animate-pulse' : ''}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && trendVal && (
          <div className={`flex items-center gap-0.5 text-[10px] font-bold ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trendVal}
          </div>
        )}
      </div>
      <div className={`text-xl font-black ${textColorMap[color] || 'text-white'}`}>{value}</div>
      <div className="text-[11px] text-slate-400 font-semibold mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function GaugeBar({ label, used, total, unit = 'GB', color }: { label: string; used: number; total: number; unit?: string; color: string }) {
  const pct = Math.min((used / total) * 100, 100);
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500',
    red: 'bg-red-500', violet: 'bg-violet-500', cyan: 'bg-cyan-500',
  };
  const textColorMap: Record<string, string> = {
    blue: 'text-blue-400', emerald: 'text-emerald-400', amber: 'text-amber-400',
    red: 'text-red-400', violet: 'text-violet-400', cyan: 'text-cyan-400',
  };
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-300">{label}</span>
        <span className={`text-[11px] font-bold font-mono ${textColorMap[color]}`}>{used.toFixed(1)}/{total}{unit}</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${colorMap[color]} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-slate-600">{pct.toFixed(1)}% used</div>
    </div>
  );
}

function SectionTitle({ label, icon: Icon, color }: { label: string; icon: React.ElementType; color: string }) {
  const textMap: Record<string, string> = {
    blue: 'text-blue-400', emerald: 'text-emerald-400', violet: 'text-violet-400',
    amber: 'text-amber-400', red: 'text-red-400', cyan: 'text-cyan-400',
    orange: 'text-orange-400', pink: 'text-pink-400', teal: 'text-teal-400',
    lime: 'text-lime-400', sky: 'text-sky-400', fuchsia: 'text-fuchsia-400',
  };
  return (
    <div className={`flex items-center gap-2 mb-3 ${textMap[color] || 'text-slate-300'}`}>
      <Icon className="w-4 h-4" />
      <span className="text-[11px] font-extrabold uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-slate-800" />
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Dashboard
// ──────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [kpi, setKpi] = useState<KpiData>(generateKpi());
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [activeTenantCode, setActiveTenantCode] = useState(localStorage.getItem('tenant_code') || '');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [liveEnabled, setLiveEnabled] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadTenants = useCallback(async () => {
    setLoadingTenants(true);
    try {
      const res = await api.get('/landlord/tenants');
      if (res.data.success) setTenants(res.data.data);
    } catch {
      setTenants([
        { id: 1, school_name: 'Delhi Public School', school_code: 'dps_demo', db_name: 'school_dps_demo', db_host: '127.0.0.1', admin_email: 'admin@dps.edu', status: 'active', created_at: '2026-01-10' },
        { id: 2, school_name: 'St Marys Convent', school_code: 'st_marys', db_name: 'school_st_marys', db_host: '127.0.0.1', admin_email: 'admin@stmarys.org', status: 'active', created_at: '2026-02-14' },
        { id: 3, school_name: 'Oxford High School', school_code: 'oxford_high', db_name: 'school_oxford_high', db_host: '127.0.0.1', admin_email: 'admin@oxford.in', status: 'active', created_at: '2026-03-01' },
        { id: 4, school_name: 'Cambridge International', school_code: 'cambridge_intl', db_name: 'school_cambridge_intl', db_host: '127.0.0.1', admin_email: 'admin@cambridge.edu', status: 'active', created_at: '2026-04-20' },
        { id: 5, school_name: 'Heritage Academy', school_code: 'heritage_ac', db_name: 'school_heritage', db_host: '127.0.0.1', admin_email: 'admin@heritage.in', status: 'suspended', created_at: '2026-05-05' },
        { id: 6, school_name: 'Sunrise Academy', school_code: 'sunrise_ac', db_name: 'school_sunrise', db_host: '127.0.0.1', admin_email: 'admin@sunrise.edu', status: 'trial', created_at: '2026-08-03' },
      ]);
    } finally { setLoadingTenants(false); }
  }, []);

  const refresh = useCallback(() => {
    setKpi(generateKpi());
    setLastRefreshed(new Date());
  }, []);

  useEffect(() => { loadTenants(); }, [loadTenants]);

  useEffect(() => {
    if (liveEnabled) {
      timerRef.current = setInterval(() => { setKpi(generateKpi()); setLastRefreshed(new Date()); }, 8000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [liveEnabled]);

  const handleSwitchTenant = (code: string, dbName: string) => {
    localStorage.setItem('tenant_code', code);
    setActiveTenantCode(code);
    toast.success(`Switched to tenant DB: ${dbName}`);
  };

  const handleClearTenant = () => {
    localStorage.removeItem('tenant_code');
    setActiveTenantCode('');
    toast.success('Reconnected to Master Landlord DB');
  };

  const priorityColor: Record<string, string> = {
    critical: 'text-red-400 bg-red-400/10 border-red-400/20',
    high: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    low: 'text-slate-400 bg-slate-800 border-slate-700',
  };
  const levelIcon: Record<string, string> = { info: '🔵', warn: '🟡', error: '🔴' };
  const alertColor: Record<string, string> = {
    red: 'border-red-500/30 text-red-400 bg-red-500/10',
    amber: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    orange: 'border-orange-500/30 text-orange-400 bg-orange-500/10',
    yellow: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10',
  };

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-10">

      {/* ── HEADER ── */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 p-6 rounded-3xl border border-slate-800 shadow-xl flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-400/30"><Crown className="w-6 h-6" /></div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">SaaS Command Center</h1>
              <p className="text-[11px] text-slate-400">Global Super Admin · Platform Owner Dashboard</p>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[9px] font-extrabold rounded-full uppercase tracking-wider">Live v3.5</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-[10px] text-slate-500 font-mono">Last: {lastRefreshed.toLocaleTimeString()}</div>
          <button onClick={() => setLiveEnabled(p => !p)} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 border cursor-pointer transition-all ${liveEnabled ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
            {liveEnabled ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />} {liveEnabled ? 'Live' : 'Paused'}
          </button>
          <button onClick={() => { refresh(); loadTenants(); toast.success('Dashboard refreshed'); }} className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-blue-500 text-slate-300 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          {activeTenantCode && (
            <button onClick={handleClearTenant} className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
              <Database className="w-3 h-3" /> {activeTenantCode} (Reset)
            </button>
          )}
          <button onClick={() => setShowOnboardModal(true)} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/30">
            <Plus className="w-3.5 h-3.5" /> Provision School
          </button>
        </div>
      </div>

      {/* ── SYSTEM ALERTS ── */}
      <div>
        <SectionTitle label="System Alerts" icon={AlertTriangle} color="red" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {systemAlerts.map(a => (
            <div key={a.id} className={`rounded-2xl border p-3 text-center ${alertColor[a.color]}`}>
              <div className="text-2xl font-black">{a.value}</div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider mt-0.5">{a.title}</div>
              <div className="text-[9px] opacity-70 mt-0.5">{a.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SCHOOLS KPIs ── */}
      <div>
        <SectionTitle label="School Tenants" icon={Building} color="blue" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Schools" value={kpi.totalSchools} icon={Building} color="blue" trend="up" trendVal="+7 this month" />
          <StatCard label="Active Schools" value={kpi.activeSchools} icon={CheckCircle2} color="emerald" sub="Paid + healthy" />
          <StatCard label="Suspended" value={kpi.suspendedSchools} icon={AlertTriangle} color="red" sub="Awaiting payment" />
          <StatCard label="Trial Schools" value={kpi.trialSchools} icon={Clock} color="amber" sub="30-day trial" />
          <StatCard label="Expired" value={kpi.expiredSchools} icon={AlertTriangle} color="orange" sub="Plan expired" />
          <StatCard label="New This Month" value={kpi.newSchoolsThisMonth} icon={TrendingUp} color="cyan" trend="up" trendVal="+2 this week" />
        </div>
      </div>

      {/* ── USER STATS ── */}
      <div>
        <SectionTitle label="User Statistics" icon={Users} color="violet" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Total Students" value={kpi.totalStudents.toLocaleString()} icon={BookOpen} color="violet" trend="up" trendVal="+820 MoM" />
          <StatCard label="Total Teachers" value={kpi.totalTeachers.toLocaleString()} icon={UserCheck} color="indigo" trend="up" trendVal="+42 MoM" />
          <StatCard label="Total Parents" value={kpi.totalParents.toLocaleString()} icon={Users} color="pink" />
          <StatCard label="Monthly Active (MAU)" value={kpi.mau.toLocaleString()} icon={Activity} color="teal" sub="Unique logins 30d" pulse={liveEnabled} />
          <StatCard label="Daily Active (DAU)" value={kpi.dau.toLocaleString()} icon={Zap} color="sky" sub="Today's logins" pulse={liveEnabled} />
        </div>
      </div>

      {/* ── REVENUE KPIs ── */}
      <div>
        <SectionTitle label="Revenue & Billing" icon={DollarSign} color="emerald" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="MRR" value={`₹${(kpi.mrr / 1000).toFixed(1)}K`} icon={DollarSign} color="emerald" trend="up" trendVal="+7.9% MoM" />
          <StatCard label="ARR" value={`₹${(kpi.arr / 100000).toFixed(2)}L`} icon={TrendingUp} color="teal" trend="up" trendVal="+94% YoY" />
          <StatCard label="Revenue Growth" value={`${kpi.revenueGrowth}%`} icon={BarChart3} color="cyan" trend="up" trendVal="vs last month" />
          <StatCard label="Pending Renewals" value={kpi.pendingRenewals} icon={Clock} color="amber" sub="Due in 7 days" />
          <StatCard label="Failed Payments" value={kpi.failedPayments} icon={AlertTriangle} color="red" sub="Needs follow-up" />
        </div>
      </div>

      {/* ── INFRA & COMMS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Storage & DB */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <SectionTitle label="Storage & Database" icon={HardDrive} color="sky" />
          <GaugeBar label="Cloud Storage" used={kpi.storageUsed} total={kpi.storageTotalGb} unit=" GB" color="blue" />
          <GaugeBar label="Database Storage" used={kpi.dbUsedGb} total={kpi.dbTotalGb} unit=" GB" color="violet" />
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-semibold">API Requests Today</span>
              <span className="font-black text-cyan-400 font-mono">{kpi.apiRequestsToday.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Communications */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <SectionTitle label="Communications Sent Today" icon={Bell} color="amber" />
          <div className="space-y-4 mt-2">
            {[
              { label: 'SMS Messages', val: kpi.smsSent, icon: Phone, color: 'emerald', max: 15000 },
              { label: 'WhatsApp Messages', val: kpi.whatsappSent, icon: MessageSquare, color: 'teal', max: 20000 },
              { label: 'Emails Sent', val: kpi.emailSent, icon: Mail, color: 'blue', max: 10000 },
            ].map(c => {
              const Icon = c.icon;
              const pct = Math.min((c.val / c.max) * 100, 100);
              const colorMap: Record<string, string> = { emerald: 'bg-emerald-500', teal: 'bg-teal-500', blue: 'bg-blue-500' };
              const textMap: Record<string, string> = { emerald: 'text-emerald-400', teal: 'text-teal-400', blue: 'text-blue-400' };
              return (
                <div key={c.label} className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-slate-800 ${textMap[c.color]}`}><Icon className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-slate-300 font-semibold">{c.label}</span>
                      <span className={`text-[11px] font-black font-mono ${textMap[c.color]}`}>{c.val.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${colorMap[c.color]} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Server Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <SectionTitle label="Server Health" icon={Server} color="lime" />
          <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Server Online</span>
            </div>
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <GaugeBar label="CPU Usage" used={kpi.cpuUsage} total={100} unit="%" color="cyan" />
          <GaugeBar label="Memory Usage" used={kpi.memoryUsage} total={100} unit="%" color="violet" />
          <GaugeBar label="Disk Usage" used={kpi.diskUsage} total={100} unit="%" color="amber" />
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-800/60 rounded-xl p-2.5 text-center">
              <div className={`text-sm font-black ${kpi.queueFailed > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{kpi.queuePending}</div>
              <div className="text-[10px] text-slate-500">Queue Pending</div>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-2.5 text-center">
              <div className={`text-sm font-black ${kpi.backupStatus === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>✓ Done</div>
              <div className="text-[10px] text-slate-500">Last Backup</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RECENT ACTIVITY + SUPPORT TICKETS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <SectionTitle label="Recent Activity" icon={Activity} color="cyan" />
          <div className="space-y-2">
            {recentActivities.map(a => (
              <div key={a.id} className="flex items-start gap-3 p-2.5 hover:bg-slate-800/40 rounded-xl transition-colors">
                <span className="text-sm mt-0.5">{levelIcon[a.level]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-slate-200 leading-relaxed">{a.message}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">{a.type}</span>
                    <span className="text-[9px] text-slate-600">·</span>
                    <span className="text-[9px] text-slate-500">{a.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support Tickets */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <SectionTitle label="Latest Support Tickets" icon={AlertTriangle} color="red" />
          <div className="space-y-2">
            {supportTickets.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-white">{t.school}</div>
                  <div className="text-[11px] text-slate-400 truncate">{t.subject}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase ${priorityColor[t.priority] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>{t.priority}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">{t.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-3 py-2 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-400 text-[11px] font-bold rounded-xl transition-all cursor-pointer">
            View All Tickets →
          </button>
        </div>
      </div>

      {/* ── RECENTLY REGISTERED SCHOOLS ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle label="Latest Registered Schools" icon={Building} color="blue" />
          <span className="text-[10px] text-slate-500 font-mono">Last 30 days</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {recentSchools.map((s, i) => (
            <div key={i} className="bg-slate-800/50 rounded-2xl border border-slate-800 p-4 hover:border-slate-700 transition-all">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-xs">{s.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-white truncate">{s.name}</div>
                  <div className="text-[10px] font-mono text-slate-500">{s.code}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className={`px-2 py-0.5 rounded-full font-bold ${s.plan === 'Enterprise' ? 'text-amber-400 bg-amber-400/10' : s.plan === 'Pro' ? 'text-blue-400 bg-blue-400/10' : 'text-slate-400 bg-slate-700'}`}>{s.plan}</span>
                <span className="text-slate-500">{s.students.toLocaleString()} students</span>
              </div>
              <div className="text-[9px] text-slate-600 mt-1.5 font-mono">{s.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── LIVE TENANT TABLE ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-extrabold text-slate-200">Live Tenant Database Connections</span>
          </div>
          <div className="flex items-center gap-2">
            {loadingTenants && <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
            <button onClick={loadTenants} className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-400 rounded-xl text-[10px] font-bold cursor-pointer hover:border-blue-500 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
            <button onClick={() => setShowOnboardModal(true)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-bold cursor-pointer flex items-center gap-1">
              <Plus className="w-3 h-3" /> New
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-widest">
                <th className="px-5 py-3 text-left">School</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Database</th>
                <th className="px-4 py-3 text-left">Admin</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tenants.map(t => {
                const isCurrent = activeTenantCode === t.school_code;
                const statusColor: Record<string, string> = {
                  active: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
                  suspended: 'text-red-400 bg-red-400/10 border-red-400/20',
                  trial: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
                };
                return (
                  <tr key={t.id} className={`hover:bg-slate-800/40 transition-colors ${isCurrent ? 'bg-blue-500/5 border-l-2 border-blue-500' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-[10px] flex-shrink-0">{t.school_name[0]}</div>
                        <span className="font-bold text-white">{t.school_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-blue-400 text-[11px]">{t.school_code}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono text-[10px] text-slate-300">{t.db_name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{t.admin_email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${statusColor[t.status] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isCurrent ? (
                        <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-xl inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Connected
                        </span>
                      ) : (
                        <button onClick={() => handleSwitchTenant(t.school_code, t.db_name)} className="px-3 py-1.5 border border-blue-500/40 text-blue-400 hover:bg-blue-600 hover:text-white text-[10px] font-bold rounded-xl cursor-pointer transition-all inline-flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> Connect
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ONBOARDING MODAL ── */}
      <SchoolOnboardingModal isOpen={showOnboardModal} onClose={() => setShowOnboardModal(false)} onSuccess={loadTenants} />
    </div>
  );
}
