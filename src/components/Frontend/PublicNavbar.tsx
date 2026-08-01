import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { School, LogIn, Phone, Menu, X, ArrowRight, Sparkles, Database } from 'lucide-react';
import SchoolOnboardingModal from '../Landlord/SchoolOnboardingModal';

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/home' },
    { name: 'About Us', path: '/about' },
    { name: 'Features & Modules', path: '/features' },
    { name: 'Pricing & Plans', path: '/pricing' },
    { name: 'Admission Inquiry', path: '/admission-inquiry' },
    { name: 'Contact Us', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white font-sans">
      {/* Top micro bar */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white text-[11px] font-bold py-1 px-4 text-center flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Sales & Support: +91 98765 43210</span>
          <span className="hidden sm:inline-block text-blue-200">• ISO 27001 Certified School ERP</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/contact" className="hover:underline flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" /> Request Free Demo</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/home" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all">
              <School className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white">MySchoolPoint</span>
              <span className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest -mt-1">ERP & School Portal</span>
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(l => {
              const isActive = location.pathname === l.path || (l.path === '/home' && location.pathname === '/');
              return (
                <Link key={l.path} to={l.path}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-900'}`}>
                  {l.name}
                </Link>
              );
            })}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => setShowOnboardModal(true)} className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all">
              <Database className="w-3.5 h-3.5" /> Provision School DB
            </button>
            <Link to="/login" className="px-4 py-2 border border-slate-700 hover:bg-slate-900 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all">
              <LogIn className="w-4 h-4 text-blue-400" /> Portal Login
            </Link>
            <Link to="/pricing" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-6 space-y-2">
          {navLinks.map(l => (
            <Link key={l.path} to={l.path} onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-900 hover:text-white">
              {l.name}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-2.5 text-center bg-slate-900 text-white font-bold text-xs rounded-xl border border-slate-800">
              Portal Login
            </Link>
            <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="w-full py-2.5 text-center bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md">
              Get Started Free
            </Link>
          </div>
        </div>
      )}

      <SchoolOnboardingModal isOpen={showOnboardModal} onClose={() => setShowOnboardModal(false)} />
    </header>
  );
}
