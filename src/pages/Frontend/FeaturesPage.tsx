import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, CreditCard, Calendar, Award, Zap, ShieldCheck,
  CheckCircle2, ArrowRight
} from 'lucide-react';
import PublicNavbar from '../../components/Frontend/PublicNavbar';
import PublicFooter from '../../components/Frontend/PublicFooter';

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState<'student' | 'fees' | 'attendance' | 'exams' | 'api' | 'security'>('student');

  const moduleDetails = {
    student: {
      title: 'Student Lifecycle & Admission Management',
      icon: Users,
      color: 'text-blue-400',
      bullets: [
        'Online student admission application form with document upload',
        'Automatic admission number & roll number generation',
        'Parent & guardian emergency contact profiles',
        'Digital student ID card generation & batch printing',
        'Class section allocation & multi-session promotion engine',
      ]
    },
    fees: {
      title: 'Fee Accounting, Due Collection & WhatsApp Receipts',
      icon: CreditCard,
      color: 'text-purple-400',
      bullets: [
        'Customizable fee heads (Tuition, Transport, Hostel, Lab)',
        'Flexible installment schemes and early-bird discounts',
        'Razorpay, PayU, and PhonePe payment gateway integration',
        'Instant WhatsApp & SMS payment receipt generation with GST invoice number',
        'Outstanding fee dues notification triggers for parents',
      ]
    },
    attendance: {
      title: 'Daily & Period-Wise Attendance Tracking',
      icon: Calendar,
      color: 'text-emerald-400',
      bullets: [
        'Main-gate biometric scanner & RFID card integration',
        'Subject period-wise teacher attendance marking',
        'Student leave application & principal approval workflow',
        'Automatic SMS alerts sent to parents when student is absent',
        'Monthly attendance percentage report for exam eligibility',
      ]
    },
    exams: {
      title: 'Examinations, Admit Cards & Report Cards',
      icon: Award,
      color: 'text-amber-400',
      bullets: [
        'Term exam timetable & room allocation manager',
        'Invigilator duty assignment roster',
        'Student exam admit card generation with barcode',
        'Gradebook & mark entry console for subject teachers',
        'CBSE / ICSE / State board compliant report card generator',
      ]
    },
    api: {
      title: 'Biometric API & Developer Portal',
      icon: Zap,
      color: 'text-rose-400',
      bullets: [
        'Generate secure REST API tokens with scope controls',
        'Interactive API playground & cURL request generator',
        'Webhook registration for real-time ERP events',
        'Live HTTP access traffic logs & latency stats',
      ]
    },
    security: {
      title: 'Audit Logs & 2FA Authentication',
      icon: ShieldCheck,
      color: 'text-cyan-400',
      bullets: [
        'Two-Factor Authentication (2FA) via Authenticator app or SMS OTP',
        '15-minute inactivity session screen lock overlay',
        'User audit trail showing exact before/after data diffs',
        'Instant database `.sql.gz` dump backups & table defragmentation',
      ]
    },
  };

  const current = moduleDetails[activeTab];
  const Icon = current.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      <PublicNavbar />

      {/* Header */}
      <section className="py-16 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold rounded-full uppercase tracking-wider">Features Showcase</span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Comprehensive Modules Built for Modern Schools</h1>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto">Click through our module tabs to explore the detailed features included in MySchoolPoint ERP.</p>
        </div>
      </section>

      {/* Interactive Tabs */}
      <section className="py-16 bg-slate-900 flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex gap-2 overflow-x-auto pb-2 justify-center flex-wrap">
            {[
              { key: 'student', label: 'Student Mgmt', icon: Users },
              { key: 'fees', label: 'Fee Accounting', icon: CreditCard },
              { key: 'attendance', label: 'Attendance System', icon: Calendar },
              { key: 'exams', label: 'Exams & Results', icon: Award },
              { key: 'api', label: 'Developer API', icon: Zap },
              { key: 'security', label: 'Security & Audit', icon: ShieldCheck },
            ].map(t => {
              const TIcon = t.icon;
              const isActive = activeTab === t.key;
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}`}>
                  <TIcon className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
                <Icon className={`w-8 h-8 ${current.color}`} />
              </div>
              <h2 className="text-2xl font-black text-white">{current.title}</h2>
            </div>

            <div className="space-y-3 pt-2">
              {current.bullets.map(b => (
                <div key={b} className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{b}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-900 flex items-center justify-between flex-wrap gap-4">
              <span className="text-xs text-slate-400">Included in Professional & Enterprise plans</span>
              <Link to="/pricing" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md">
                View Pricing <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
