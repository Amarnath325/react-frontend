import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Crown, Database, Building, Zap, ShieldCheck, LogOut, ChevronRight,
  ChevronDown, Users, Settings, BarChart3, Bell, LifeBuoy, Key, Bot,
  Activity, CreditCard, UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MenuItem { name: string; path: string; }
interface MenuSection {
  title: string;
  icon: React.ElementType;
  color: string;
  badge?: string;
  items: MenuItem[];
}

const sections: MenuSection[] = [
  {
    title: 'Tenant Management',
    icon: Building,
    color: 'blue',
    badge: 'Core',
    items: [
      { name: 'Tenant Schools', path: '/superadmin/tenants' },
      { name: 'School Verification', path: '/superadmin/tenants/verification' },
      { name: 'Onboarding Wizard', path: '/superadmin/tenants/onboarding' },
      { name: 'Tenant Migration', path: '/superadmin/tenants/migration' },
      { name: 'Suspension / Restore', path: '/superadmin/tenants/suspension' },
      { name: 'Clone Tenant', path: '/superadmin/tenants/clone' },
      { name: 'Archive Tenants', path: '/superadmin/tenants/archive' },
      { name: 'Database Management', path: '/superadmin/tenants/database' },
    ],
  },
  {
    title: 'Subscription & Billing',
    icon: CreditCard,
    color: 'emerald',
    badge: 'Revenue',
    items: [
      { name: 'Subscription Plans', path: '/superadmin/subscriptions' },
      { name: 'Feature Management', path: '/superadmin/subscriptions/features' },
      { name: 'Plan Assignment', path: '/superadmin/subscriptions/assignment' },
      { name: 'Coupons & Promo Codes', path: '/superadmin/subscriptions/coupons' },
      { name: 'Free Trial Management', path: '/superadmin/subscriptions/trials' },
      { name: 'Billing & Invoices', path: '/superadmin/billing' },
      { name: 'Payments', path: '/superadmin/billing/payments' },
      { name: 'Refund Management', path: '/superadmin/billing/refunds' },
      { name: 'Tax / GST Management', path: '/superadmin/billing/tax' },
      { name: 'Revenue Analytics', path: '/superadmin/billing/revenue' },
    ],
  },
  {
    title: 'CRM',
    icon: UserCheck,
    color: 'violet',
    items: [
      { name: 'Public Inquiries', path: '/superadmin/crm/inquiries' },
      { name: 'Demo Requests', path: '/superadmin/crm/demos' },
      { name: 'Sales Pipeline', path: '/superadmin/crm/pipeline' },
      { name: 'Follow Up Management', path: '/superadmin/crm/followup' },
      { name: 'Customer Notes', path: '/superadmin/crm/notes' },
      { name: 'Customer Support', path: '/superadmin/crm/support' },
      { name: 'Ticket Escalation', path: '/superadmin/crm/escalation' },
    ],
  },
  {
    title: 'SaaS Configuration',
    icon: Settings,
    color: 'orange',
    items: [
      { name: 'Global Settings', path: '/superadmin/config/global' },
      { name: 'Default School Settings', path: '/superadmin/config/school-defaults' },
      { name: 'Feature Flags', path: '/superadmin/config/feature-flags' },
      { name: 'White Label Branding', path: '/superadmin/config/white-label' },
      { name: 'Default Themes', path: '/superadmin/config/themes' },
      { name: 'Email Templates', path: '/superadmin/config/email-templates' },
      { name: 'SMS Templates', path: '/superadmin/config/sms-templates' },
      { name: 'WhatsApp Templates', path: '/superadmin/config/whatsapp-templates' },
      { name: 'Notification Templates', path: '/superadmin/config/notification-templates' },
    ],
  },
  {
    title: 'API & Integrations',
    icon: Zap,
    color: 'cyan',
    items: [
      { name: 'REST API Overview', path: '/superadmin/api' },
      { name: 'API Keys', path: '/superadmin/api/keys' },
      { name: 'Webhooks', path: '/superadmin/api/webhooks' },
      { name: 'OAuth Clients', path: '/superadmin/api/oauth' },
      { name: 'Rate Limiting', path: '/superadmin/api/rate-limiting' },
      { name: 'Payment Gateway', path: '/superadmin/api/payment-gateway' },
      { name: 'SMS Gateway', path: '/superadmin/api/sms-gateway' },
      { name: 'WhatsApp Gateway', path: '/superadmin/api/whatsapp-gateway' },
      { name: 'Email Gateway', path: '/superadmin/api/email-gateway' },
      { name: 'Firebase Config', path: '/superadmin/api/firebase' },
      { name: 'Google Services', path: '/superadmin/api/google' },
      { name: 'Third-Party Integrations', path: '/superadmin/api/third-party' },
    ],
  },
  {
    title: 'Platform Monitoring',
    icon: Activity,
    color: 'lime',
    items: [
      { name: 'System Health', path: '/superadmin/monitoring/health' },
      { name: 'Server Monitoring', path: '/superadmin/monitoring/server' },
      { name: 'Database Monitoring', path: '/superadmin/monitoring/database' },
      { name: 'Queue Monitoring', path: '/superadmin/monitoring/queue' },
      { name: 'Cache Monitoring', path: '/superadmin/monitoring/cache' },
      { name: 'Storage Monitoring', path: '/superadmin/monitoring/storage' },
      { name: 'Cron Jobs', path: '/superadmin/monitoring/cron' },
      { name: 'Background Jobs', path: '/superadmin/monitoring/jobs' },
      { name: 'Live Status', path: '/superadmin/monitoring/live' },
    ],
  },
  {
    title: 'Database Management',
    icon: Database,
    color: 'sky',
    items: [
      { name: 'Database List', path: '/superadmin/database/list' },
      { name: 'Database Backup', path: '/superadmin/database' },
      { name: 'Restore Backup', path: '/superadmin/database/restore' },
      { name: 'Database Size', path: '/superadmin/database/size' },
      { name: 'DB Optimization', path: '/superadmin/database/optimize' },
      { name: 'DB Migration', path: '/superadmin/database/migration' },
      { name: 'Cloud Storage', path: '/superadmin/database/cloud-storage' },
    ],
  },
  {
    title: 'Security Center',
    icon: ShieldCheck,
    color: 'red',
    badge: 'Critical',
    items: [
      { name: 'Security Dashboard', path: '/superadmin/security' },
      { name: 'Audit Logs', path: '/superadmin/security/audit-logs' },
      { name: 'Login Logs', path: '/superadmin/security/login-logs' },
      { name: 'Failed Login Attempts', path: '/superadmin/security/failed-logins' },
      { name: 'Device Management', path: '/superadmin/security/devices' },
      { name: 'Session Management', path: '/superadmin/security/sessions' },
      { name: 'IP Whitelist', path: '/superadmin/security/ip-whitelist' },
      { name: 'Blacklisted IPs', path: '/superadmin/security/ip-blacklist' },
      { name: 'SSL Management', path: '/superadmin/security/ssl' },
      { name: 'Two-Factor Auth', path: '/superadmin/security/2fa' },
      { name: 'Password Policy', path: '/superadmin/security/password-policy' },
      { name: 'DDoS Protection', path: '/superadmin/security/ddos' },
      { name: 'Security Alerts', path: '/superadmin/security/alerts' },
    ],
  },
  {
    title: 'User & Role Management',
    icon: Users,
    color: 'pink',
    items: [
      { name: 'Global Admins', path: '/superadmin/users' },
      { name: 'Roles', path: '/superadmin/users/roles' },
      { name: 'Permissions', path: '/superadmin/users/permissions' },
      { name: 'Activity Logs', path: '/superadmin/users/activity' },
      { name: 'Access Policies', path: '/superadmin/users/policies' },
    ],
  },
  {
    title: 'Reports & Analytics',
    icon: BarChart3,
    color: 'amber',
    items: [
      { name: 'Revenue Reports', path: '/superadmin/reports/revenue' },
      { name: 'Subscription Reports', path: '/superadmin/reports/subscriptions' },
      { name: 'Tenant Reports', path: '/superadmin/reports/tenants' },
      { name: 'Student Statistics', path: '/superadmin/reports/students' },
      { name: 'Usage Reports', path: '/superadmin/reports/usage' },
      { name: 'Login Reports', path: '/superadmin/reports/logins' },
      { name: 'Feature Usage', path: '/superadmin/reports/features' },
      { name: 'Growth Analytics', path: '/superadmin/reports/growth' },
      { name: 'Churn Analysis', path: '/superadmin/reports/churn' },
    ],
  },
  {
    title: 'Notifications',
    icon: Bell,
    color: 'yellow',
    items: [
      { name: 'Broadcast Notifications', path: '/superadmin/notifications/broadcast' },
      { name: 'Email Campaigns', path: '/superadmin/notifications/email' },
      { name: 'SMS Broadcast', path: '/superadmin/notifications/sms' },
      { name: 'WhatsApp Broadcast', path: '/superadmin/notifications/whatsapp' },
      { name: 'Push Notifications', path: '/superadmin/notifications/push' },
      { name: 'Scheduled Notifications', path: '/superadmin/notifications/scheduled' },
    ],
  },
  {
    title: 'Support Center',
    icon: LifeBuoy,
    color: 'teal',
    items: [
      { name: 'Support Tickets', path: '/superadmin/support/tickets' },
      { name: 'Knowledge Base', path: '/superadmin/support/knowledge-base' },
      { name: 'FAQs', path: '/superadmin/support/faqs' },
      { name: 'Announcements', path: '/superadmin/support/announcements' },
      { name: 'Maintenance Mode', path: '/superadmin/support/maintenance' },
      { name: 'Release Notes', path: '/superadmin/support/release-notes' },
      { name: 'Contact Requests', path: '/superadmin/support/contacts' },
    ],
  },
  {
    title: 'License Management',
    icon: Key,
    color: 'indigo',
    items: [
      { name: 'License Keys', path: '/superadmin/license/keys' },
      { name: 'Domain Verification', path: '/superadmin/license/domain-verification' },
      { name: 'Installation History', path: '/superadmin/license/installations' },
      { name: 'Activation Logs', path: '/superadmin/license/activations' },
    ],
  },
  {
    title: 'AI & Automation',
    icon: Bot,
    color: 'fuchsia',
    badge: 'New',
    items: [
      { name: 'AI Settings', path: '/superadmin/ai/settings' },
      { name: 'AI Usage Logs', path: '/superadmin/ai/usage' },
      { name: 'Auto Backup Scheduler', path: '/superadmin/ai/backup-scheduler' },
      { name: 'Auto Billing', path: '/superadmin/ai/auto-billing' },
      { name: 'Auto Suspension Rules', path: '/superadmin/ai/suspension-rules' },
      { name: 'Auto Renewal', path: '/superadmin/ai/auto-renewal' },
      { name: 'Workflow Automation', path: '/superadmin/ai/workflows' },
    ],
  },
];

const colorMap: Record<string, { dot: string; text: string; bg: string; border: string }> = {
  blue:    { dot: 'bg-blue-400',    text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
  emerald: { dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  violet:  { dot: 'bg-violet-400',  text: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20' },
  orange:  { dot: 'bg-orange-400',  text: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20' },
  cyan:    { dot: 'bg-cyan-400',    text: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20' },
  lime:    { dot: 'bg-lime-400',    text: 'text-lime-400',    bg: 'bg-lime-500/10',    border: 'border-lime-500/20' },
  sky:     { dot: 'bg-sky-400',     text: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20' },
  red:     { dot: 'bg-red-400',     text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
  pink:    { dot: 'bg-pink-400',    text: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/20' },
  amber:   { dot: 'bg-amber-400',   text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
  yellow:  { dot: 'bg-yellow-400',  text: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20' },
  teal:    { dot: 'bg-teal-400',    text: 'text-teal-400',    bg: 'bg-teal-500/10',    border: 'border-teal-500/20' },
  indigo:  { dot: 'bg-indigo-400',  text: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20' },
  fuchsia: { dot: 'bg-fuchsia-400', text: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/20' },
};

export default function SuperAdminSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  // Find which section is currently active
  const getActiveSection = () => {
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].items.some(item => location.pathname.startsWith(item.path) && item.path !== '/superadmin/tenants') ||
          sections[i].items.some(item => location.pathname === item.path)) {
        return i;
      }
    }
    return -1;
  };

  const [openSections, setOpenSections] = useState<Set<number>>(() => {
    const active = getActiveSection();
    return active >= 0 ? new Set([active]) : new Set([0]);
  });

  const toggleSection = (index: number) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(index)) { next.delete(index); } else { next.add(index); }
      return next;
    });
  };

  return (
    <aside className="w-64 bg-slate-950 text-white h-screen max-h-screen flex flex-col border-r border-slate-800 font-sans flex-shrink-0 overflow-hidden">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
          <Crown className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="font-black text-xs tracking-tight text-white uppercase truncate">Landlord Control</h2>
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Platform Owner Suite</p>
        </div>
      </div>

      {/* Dashboard Link */}
      <div className="px-3 pt-3 pb-1 flex-shrink-0">
        <Link
          to="/superadmin/dashboard"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            location.pathname === '/superadmin/dashboard' || location.pathname === '/superadmin'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow shadow-amber-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Crown className="w-4 h-4 flex-shrink-0" />
          <span>SaaS Command Center</span>
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 min-h-0 px-3 pb-3 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-track-slate-950 scrollbar-thumb-slate-800">
        {sections.map((section, idx) => {
          const isOpen = openSections.has(idx);
          const Icon = section.icon;
          const colors = colorMap[section.color];
          const isAnyActive = section.items.some(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/'));

          return (
            <div key={section.title} className="mt-0.5">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(idx)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all group ${
                  isAnyActive
                    ? `${colors.bg} ${colors.text} border ${colors.border}`
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isAnyActive ? colors.text : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="truncate text-[11px]">{section.title}</span>
                  {section.badge && (
                    <span className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded ${isAnyActive ? 'bg-white/20' : 'bg-slate-800'} text-slate-400 flex-shrink-0`}>
                      {section.badge}
                    </span>
                  )}
                </div>
                {isOpen
                  ? <ChevronDown className="w-3 h-3 flex-shrink-0 opacity-60" />
                  : <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-60" />
                }
              </button>

              {/* Section Items */}
              {isOpen && (
                <div className="ml-3 mt-0.5 pl-3 border-l border-slate-800 space-y-0.5">
                  {section.items.map(item => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                          isActive
                            ? `${colors.text} bg-slate-900 border-l-2 ${colors.border.replace('border-', 'border-l-')}`
                            : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/60'
                        }`}
                      >
                        <span className={`w-1 h-1 rounded-full flex-shrink-0 ${isActive ? colors.dot : 'bg-slate-700'}`} />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-amber-500/20 border border-amber-400/40 text-amber-300 rounded-lg flex items-center justify-center font-black text-[10px] flex-shrink-0">
              SA
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-[11px] text-white truncate">{user?.first_name || 'Super'} {user?.last_name || 'Admin'}</div>
              <div className="text-[10px] text-slate-500 truncate">{user?.email || 'superadmin@platform.com'}</div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
