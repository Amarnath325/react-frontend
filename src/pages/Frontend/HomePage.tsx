import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Zap, Users, CreditCard, Calendar,
  Award, ArrowRight, Sparkles, Play
} from 'lucide-react';
import PublicNavbar from '../../components/Frontend/PublicNavbar';
import PublicFooter from '../../components/Frontend/PublicFooter';
import api from '../../services/api';

export default function HomePage() {
  const [stats, setStats] = useState({
    students_managed: 125000,
    schools_active: 450,
    fee_processed_inr: '₹45 Cr+',
    attendance_logged: '1.2M+',
    uptime_percentage: 99.98,
  });

  useEffect(() => {
    api.get('/public/home')
      .then(res => { if (res.data.success && res.data.stats) setStats(res.data.stats); })
      .catch(() => {});
  }, []);

  const featuresList = [
    { title: 'Student Management', icon: Users, desc: 'Complete student lifecycle from online admission, roll allocation, parent profiles to ID card printing.', color: 'from-blue-600 to-indigo-600' },
    { title: 'Fee Accounting & Online Pay', icon: CreditCard, desc: 'Automated fee heads, installment schemes, online payment gateway, GST invoices, and WhatsApp receipts.', color: 'from-purple-600 to-indigo-600' },
    { title: 'Period-Wise Attendance', icon: Calendar, desc: 'Daily & subject period attendance with biometric gate integration, leave approvals, and SMS alerts.', color: 'from-emerald-600 to-teal-600' },
    { title: 'Exam & Result Portal', icon: Award, desc: 'Gradebook management, exam admit cards, room allocations, invigilator duties, and report card generation.', color: 'from-amber-600 to-orange-600' },
    { title: 'Biometric & Developer API', icon: Zap, desc: 'Connect main-gate biometric attendance scanners or third-party LMS via secure REST API tokens.', color: 'from-rose-600 to-pink-600' },
    { title: 'Audit & System Security', icon: ShieldCheck, desc: '2FA authentication, activity diff logs, DB backup utilities, and 99.98% cloud uptime SLA.', color: 'from-cyan-600 to-blue-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> Next-Gen SaaS School ERP Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight text-white">
            Smart Cloud ERP for <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Modern Schools & Colleges</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-medium">
            Streamline Admissions, Fee Accounting, Attendance, Examinations, and Parent Communication with India's most powerful school management system.
          </p>

          <div className="flex items-center justify-center gap-3 pt-4 flex-wrap">
            <Link to="/pricing" className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-blue-600/30 flex items-center gap-2 transition-all">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/contact" className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-2xl text-sm flex items-center gap-2 transition-all">
              <Play className="w-4 h-4 fill-slate-200" /> Book Live Demo
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-12">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-black text-blue-400">{stats.students_managed.toLocaleString()}+</div>
              <div className="text-xs text-slate-400 font-bold uppercase mt-1">Students Managed</div>
            </div>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-black text-purple-400">{stats.schools_active}+</div>
              <div className="text-xs text-slate-400 font-bold uppercase mt-1">Active Schools</div>
            </div>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">{stats.fee_processed_inr}</div>
              <div className="text-xs text-slate-400 font-bold uppercase mt-1">Fee Processed</div>
            </div>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">{stats.uptime_percentage}%</div>
              <div className="text-xs text-slate-400 font-bold uppercase mt-1">Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core ERP Modules Grid */}
      <section className="py-16 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Everything Your School Needs to Run Smoothly</h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">Explore all ERP modules designed for principals, teachers, accountants, and parents.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuresList.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 hover:border-blue-500/50 transition-all group">
                  <div className={`w-12 h-12 bg-gradient-to-tr ${f.color} rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{f.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">Ready to Digitize Your School Management?</h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto">Join 450+ leading schools across India. Set up your ERP in less than 24 hours.</p>
          <div className="pt-2">
            <Link to="/contact" className="px-8 py-4 bg-white text-slate-900 font-extrabold rounded-2xl text-sm shadow-2xl hover:bg-slate-100 inline-flex items-center gap-2 transition-all">
              Request Free Consultation <ArrowRight className="w-4 h-4 text-blue-600" />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
