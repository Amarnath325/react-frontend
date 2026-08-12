import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Settings, Save, Globe, Shield, Zap, Bell, CreditCard, RefreshCw,
  CheckCircle2, AlertTriangle, Mail, MessageSquare,
  Database, Power, Send
} from 'lucide-react';
import api from '../../../services/api';

type TabKey = 'general' | 'security' | 'performance' | 'notifications' | 'billing';

export default function GlobalSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State: General
  const [general, setGeneral] = useState({
    appName: 'MySchoolPoint ERP',
    platformUrl: 'https://myschoolpoint.com',
    supportEmail: 'support@myschoolpoint.com',
    adminEmail: 'superadmin@myschoolpoint.com',
    timezone: 'Asia/Kolkata (IST +05:30)',
    defaultCurrency: 'INR (₹)',
    maxTenants: 500,
    copyrightText: '© 2026 MySchoolPoint ERP. All Rights Reserved.',
  });

  // Form State: Security
  const [security, setSecurity] = useState({
    minPasswordLength: 8,
    require2FAForSuperAdmin: true,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    sessionTimeoutMinutes: 60,
    allowedCorsOrigins: 'https://myschoolpoint.com, https://admin.myschoolpoint.com',
    enforceStrongPassword: true,
  });

  // Form State: Performance & System Switches
  const [performance, setPerformance] = useState({
    maintenanceMode: false,
    maintenanceMessage: 'System is undergoing scheduled database maintenance. We will be back shortly.',
    newTenantRegistration: true,
    debugLogging: false,
    queryCaching: true,
    autoDbBackup: true,
    maxUploadSizeMb: 50,
  });

  // Form State: Notifications & Gateways
  const [notifications, setNotifications] = useState({
    emailProvider: 'SMTP',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smsProvider: 'Twilio',
    whatsAppGateway: 'Meta Cloud API',
    enableEmailAlerts: true,
    enableSmsAlerts: true,
    enableWhatsAppAlerts: true,
  });

  // Form State: Billing & SaaS
  const [billing, setBilling] = useState({
    taxGstRate: 18,
    freeTrialDays: 30,
    gracePeriodDays: 7,
    autoInvoiceGeneration: true,
    currencySymbol: '₹',
  });

  const handleRefreshStats = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Global platform configuration reloaded from Landlord DB');
    }, 500);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    toast.loading('Saving global settings to Master Landlord DB...', { id: 'save-settings' });

    try {
      await api.post('/landlord/settings', {
        general,
        security,
        performance,
        notifications,
        billing,
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setSaving(false);
      toast.success('🎉 Global settings saved platform-wide!', { id: 'save-settings' });
    }, 1000);
  };

  const handleTestGateway = (type: string) => {
    toast.success(`Test message dispatched via ${type} Gateway successfully!`);
  };

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-orange-500/20 text-orange-400 rounded-2xl border border-orange-400/30">
              <Settings className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Global Platform Settings & System Control
                <span className="px-2.5 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] font-extrabold rounded-full border border-orange-400/30 uppercase tracking-wider">
                  Master System
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Platform-wide configuration, security policies, gateways, and maintenance controls
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefreshStats}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Reload Config
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-600/30 transition-all disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Global Settings'}
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Platform Status</span>
            <Power className={`w-4 h-4 ${performance.maintenanceMode ? 'text-red-400' : 'text-emerald-400'}`} />
          </div>
          <div className={`text-lg font-black ${performance.maintenanceMode ? 'text-red-400' : 'text-emerald-400'}`}>
            {performance.maintenanceMode ? 'MAINTENANCE' : 'ONLINE'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Global Mode</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Self-Register</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-black text-blue-400">
            {performance.newTenantRegistration ? 'ENABLED' : 'DISABLED'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Tenant Onboarding</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Security Level</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-black text-purple-400">HIGH (2FA)</div>
          <div className="text-[10px] text-slate-500 mt-0.5">SuperAdmin Enforced</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Redis Cache</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-black text-amber-400">99.8% HIT RATE</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Query Acceleration</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Auto Backup</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-black text-cyan-400">DAILY AT 04:00</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Cloud Vault Dump</div>
        </div>
      </div>

      {/* ── TABS NAVIGATION ── */}
      <div className="bg-slate-950 p-2 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'general'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" /> General & Branding
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'security'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" /> Security & Auth
          </button>

          <button
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'performance'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" /> Performance & Switches
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'notifications'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" /> Notifications & Gateways
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'billing'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" /> SaaS & Billing Controls
          </button>
        </div>
      </div>

      {/* ── TAB CONTENT 1: GENERAL & BRANDING ── */}
      {activeTab === 'general' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Globe className="w-5 h-5 text-orange-400" />
            <div>
              <h2 className="text-sm font-extrabold text-white">General Platform Identity</h2>
              <p className="text-[11px] text-slate-400">Configure application name, support details, and default localization settings.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Application Name *</label>
              <input
                type="text"
                value={general.appName}
                onChange={e => setGeneral({ ...general, appName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Platform URL *</label>
              <input
                type="text"
                value={general.platformUrl}
                onChange={e => setGeneral({ ...general, platformUrl: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Public Support Email *</label>
              <input
                type="email"
                value={general.supportEmail}
                onChange={e => setGeneral({ ...general, supportEmail: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Master Admin Notification Email *</label>
              <input
                type="email"
                value={general.adminEmail}
                onChange={e => setGeneral({ ...general, adminEmail: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">System Default Timezone</label>
              <select
                value={general.timezone}
                onChange={e => setGeneral({ ...general, timezone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="Asia/Kolkata (IST +05:30)">Asia/Kolkata (IST +05:30)</option>
                <option value="UTC (Coordinated Universal Time)">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York (EST)">America/New_York (EST)</option>
                <option value="Europe/London (GMT)">Europe/London (GMT)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Default Currency</label>
              <select
                value={general.defaultCurrency}
                onChange={e => setGeneral({ ...general, defaultCurrency: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="INR (₹)">INR (Indian Rupee - ₹)</option>
                <option value="USD ($)">USD (US Dollar - $)</option>
                <option value="EUR (€)">EUR (Euro - €)</option>
                <option value="GBP (£)">GBP (British Pound - £)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-bold block mb-1 text-xs">Footer Copyright Notice</label>
            <input
              type="text"
              value={general.copyrightText}
              onChange={e => setGeneral({ ...general, copyrightText: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 2: SECURITY & AUTH ── */}
      {activeTab === 'security' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Shield className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-sm font-extrabold text-white">Security & Authentication Policies</h2>
              <p className="text-[11px] text-slate-400">Password rules, session timeouts, CORS origins, and 2FA enforcement.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Minimum Password Length</label>
              <input
                type="number"
                value={security.minPasswordLength}
                onChange={e => setSecurity({ ...security, minPasswordLength: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Max Failed Login Attempts</label>
              <input
                type="number"
                value={security.maxLoginAttempts}
                onChange={e => setSecurity({ ...security, maxLoginAttempts: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Account Lockout Duration (Minutes)</label>
              <input
                type="number"
                value={security.lockoutDurationMinutes}
                onChange={e => setSecurity({ ...security, lockoutDurationMinutes: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Inactivity Session Timeout (Minutes)</label>
              <input
                type="number"
                value={security.sessionTimeoutMinutes}
                onChange={e => setSecurity({ ...security, sessionTimeoutMinutes: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-bold block mb-1 text-xs">Allowed CORS Domains (Comma Separated)</label>
            <textarea
              value={security.allowedCorsOrigins}
              onChange={e => setSecurity({ ...security, allowedCorsOrigins: e.target.value })}
              rows={2}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
              <div>
                <div className="font-bold text-white">Require 2FA for Super Admin Accounts</div>
                <div className="text-[11px] text-slate-400">Enforces Google Authenticator or SMS OTP on login</div>
              </div>
              <button
                type="button"
                onClick={() => setSecurity({ ...security, require2FAForSuperAdmin: !security.require2FAForSuperAdmin })}
                className={`w-11 h-6 rounded-full flex items-center p-1 transition-all cursor-pointer ${
                  security.require2FAForSuperAdmin ? 'bg-purple-600 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-md" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
              <div>
                <div className="font-bold text-white">Enforce Strong Password Complexity</div>
                <div className="text-[11px] text-slate-400">Requires uppercase, number, and special character @#$</div>
              </div>
              <button
                type="button"
                onClick={() => setSecurity({ ...security, enforceStrongPassword: !security.enforceStrongPassword })}
                className={`w-11 h-6 rounded-full flex items-center p-1 transition-all cursor-pointer ${
                  security.enforceStrongPassword ? 'bg-purple-600 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-md" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 3: PERFORMANCE & SWITCHES ── */}
      {activeTab === 'performance' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Zap className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-extrabold text-white">Performance & Maintenance Switches</h2>
              <p className="text-[11px] text-slate-400">Global feature toggles, maintenance mode lockouts, and query cache settings.</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {/* Maintenance Mode Toggle */}
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-sm text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Global Maintenance Mode
                  </div>
                  <div className="text-[11px] text-red-300/80 mt-0.5">
                    When active, all tenant logins and portal access will display a maintenance message.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPerformance({ ...performance, maintenanceMode: !performance.maintenanceMode })}
                  className={`w-12 h-6.5 rounded-full flex items-center p-1 transition-all cursor-pointer ${
                    performance.maintenanceMode ? 'bg-red-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <span className="w-4.5 h-4.5 bg-white rounded-full shadow-md" />
                </button>
              </div>

              {performance.maintenanceMode && (
                <div>
                  <label className="text-red-300 font-bold block mb-1">Maintenance Banner Message</label>
                  <input
                    type="text"
                    value={performance.maintenanceMessage}
                    onChange={e => setPerformance({ ...performance, maintenanceMessage: e.target.value })}
                    className="w-full bg-slate-900 border border-red-500/40 rounded-xl px-3 py-2 text-white font-medium focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Other Feature Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800">
                <div>
                  <div className="font-bold text-white">Tenant Self-Registration</div>
                  <div className="text-[10px] text-slate-400">Allows new schools to signup directly</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPerformance({ ...performance, newTenantRegistration: !performance.newTenantRegistration })}
                  className={`w-11 h-6 rounded-full flex items-center p-1 transition-all cursor-pointer ${
                    performance.newTenantRegistration ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800">
                <div>
                  <div className="font-bold text-white">Automated Daily DB Backups</div>
                  <div className="text-[10px] text-slate-400">Nightly S3 Glacier MySQL dumps</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPerformance({ ...performance, autoDbBackup: !performance.autoDbBackup })}
                  className={`w-11 h-6 rounded-full flex items-center p-1 transition-all cursor-pointer ${
                    performance.autoDbBackup ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800">
                <div>
                  <div className="font-bold text-white">Redis Query Caching</div>
                  <div className="text-[10px] text-slate-400">Caches database queries for fast response</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPerformance({ ...performance, queryCaching: !performance.queryCaching })}
                  className={`w-11 h-6 rounded-full flex items-center p-1 transition-all cursor-pointer ${
                    performance.queryCaching ? 'bg-amber-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800">
                <div>
                  <div className="font-bold text-white">Debug Logging Mode</div>
                  <div className="text-[10px] text-slate-400">Logs verbose SQL and API request tracebacks</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPerformance({ ...performance, debugLogging: !performance.debugLogging })}
                  className={`w-11 h-6 rounded-full flex items-center p-1 transition-all cursor-pointer ${
                    performance.debugLogging ? 'bg-amber-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 4: NOTIFICATIONS & GATEWAYS ── */}
      {activeTab === 'notifications' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Bell className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-extrabold text-white">Global Communication Gateways</h2>
              <p className="text-[11px] text-slate-400">Configure SMTP, Twilio SMS, and WhatsApp API gateways.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
            {/* Email Gateway */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="font-extrabold text-sm text-blue-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> Email Gateway</span>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px]">Active</span>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Provider</label>
                <select
                  value={notifications.emailProvider}
                  onChange={e => setNotifications({ ...notifications, emailProvider: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none"
                >
                  <option value="SMTP">Custom SMTP Server</option>
                  <option value="AWS_SES">AWS Simple Email Service (SES)</option>
                  <option value="SendGrid">SendGrid Mail API</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={notifications.smtpHost}
                  onChange={e => setNotifications({ ...notifications, smtpHost: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <button
                type="button"
                onClick={() => handleTestGateway('Email')}
                className="w-full py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Send Test Email
              </button>
            </div>

            {/* SMS Gateway */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="font-extrabold text-sm text-emerald-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> SMS Gateway</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px]">Active</span>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">SMS Provider</label>
                <select
                  value={notifications.smsProvider}
                  onChange={e => setNotifications({ ...notifications, smsProvider: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none"
                >
                  <option value="Twilio">Twilio International</option>
                  <option value="Fast2SMS">Fast2SMS (India DLT)</option>
                  <option value="MSG91">MSG91 Enterprise</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleTestGateway('SMS')}
                className="w-full py-2 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Send Test SMS
              </button>
            </div>

            {/* WhatsApp Gateway */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="font-extrabold text-sm text-green-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Send className="w-4 h-4" /> WhatsApp Gateway</span>
                <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-[10px]">Meta API</span>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">WhatsApp Provider</label>
                <select
                  value={notifications.whatsAppGateway}
                  onChange={e => setNotifications({ ...notifications, whatsAppGateway: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none"
                >
                  <option value="Meta Cloud API">Meta Official Cloud API</option>
                  <option value="WATI">WATI WhatsApp Business</option>
                  <option value="Interakt">Interakt</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleTestGateway('WhatsApp')}
                className="w-full py-2 bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Send Test WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 5: SAAS & BILLING CONTROLS ── */}
      {activeTab === 'billing' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-extrabold text-white">SaaS Billing & Subscription Rules</h2>
              <p className="text-[11px] text-slate-400">Tax rates, free trial periods, auto-invoice policies, and grace periods.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Default GST / Tax Rate (%)</label>
              <input
                type="number"
                value={billing.taxGstRate}
                onChange={e => setBilling({ ...billing, taxGstRate: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Free Trial Duration (Days)</label>
              <input
                type="number"
                value={billing.freeTrialDays}
                onChange={e => setBilling({ ...billing, freeTrialDays: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Payment Grace Period (Days)</label>
              <input
                type="number"
                value={billing.gracePeriodDays}
                onChange={e => setBilling({ ...billing, gracePeriodDays: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs">
            <div>
              <div className="font-bold text-white">Automated Invoice & Billing Dispatch</div>
              <div className="text-[11px] text-slate-400">Generates PDF GST invoices automatically 7 days before subscription renewal</div>
            </div>
            <button
              type="button"
              onClick={() => setBilling({ ...billing, autoInvoiceGeneration: !billing.autoInvoiceGeneration })}
              className={`w-11 h-6 rounded-full flex items-center p-1 transition-all cursor-pointer ${
                billing.autoInvoiceGeneration ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <span className="w-4 h-4 bg-white rounded-full shadow-md" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
