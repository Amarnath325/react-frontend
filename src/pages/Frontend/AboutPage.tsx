import { Award, Target, CheckCircle2 } from 'lucide-react';
import PublicNavbar from '../../components/Frontend/PublicNavbar';
import PublicFooter from '../../components/Frontend/PublicFooter';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      <PublicNavbar />

      {/* Header */}
      <section className="py-16 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider">About MySchoolPoint</span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Empowering Educational Institutions Through Smart Automation</h1>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto">Founded in 2021, MySchoolPoint ERP is dedicated to simplifying administrative workflows for K-12 schools, colleges, and educational groups.</p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-slate-950 border border-slate-800 rounded-3xl space-y-4">
            <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/30">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-white">Our Mission</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              To eliminate administrative complexity in education by providing a secure, unified SaaS ERP that connects management, teachers, students, and parents seamlessly.
            </p>
          </div>

          <div className="p-8 bg-slate-950 border border-slate-800 rounded-3xl space-y-4">
            <div className="w-12 h-12 bg-purple-600/20 text-purple-400 rounded-2xl flex items-center justify-center border border-purple-500/30">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-white">Our Vision</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              To be the most trusted education technology platform across Asia, delivering AI-assisted fee insights, zero-paper attendance, and enterprise-grade data security.
            </p>
          </div>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-white">Why 450+ Schools Trust MySchoolPoint</h2>
            <p className="text-xs text-slate-400">Built around four core technology pillars</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: 'ISO 27001 Security', desc: 'Encrypted databases, 2FA authentication, and daily automated backups.' },
              { title: '99.98% Uptime SLA', desc: 'High-availability AWS cloud infrastructure for 24/7 reliability.' },
              { title: 'WhatsApp & Biometric API', desc: 'Direct gate attendance sync and instant WhatsApp receipt triggers.' },
              { title: 'Zero Training Needed', desc: 'Intuitive modern UI designed for non-technical school staff.' },
            ].map(p => (
              <div key={p.title} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">{p.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
