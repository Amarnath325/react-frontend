import { Link } from 'react-router-dom';
import { School, Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 font-sans border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
                <School className="w-5 h-5" />
              </div>
              <span className="text-lg font-black text-white tracking-tight">MySchoolPoint</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India's premier SaaS School ERP platform. Automating Student Management, Fee Accounting, Attendance, Examinations, and Parent Communication.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ISO 27001 Data Security & Privacy Verified</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Quick Navigation</h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/home" className="hover:text-white transition-colors">Home Page</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About MySchoolPoint</Link></li>
              <li><Link to="/features" className="hover:text-white transition-colors">ERP Features & Modules</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Subscription Pricing</Link></li>
              <li><Link to="/admission-inquiry" className="hover:text-white transition-colors">Online Admission Form</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Modules & Portals</h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/login" className="hover:text-white transition-colors">School Admin Login</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Teacher Portal</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Student & Parent Portal</Link></li>
              <li><Link to="/admin/api" className="hover:text-white transition-colors">Biometric & Developer API</Link></li>
              <li><Link to="/admin/security" className="hover:text-white transition-colors">Security & 2FA Center</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Contact & Support</h3>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2"><MapPin className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" /> Cyber City, Tech Tower, Sector 62, Noida, UP - 201301</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" /> +91 98765 43210 / 0120-459800</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-purple-400 flex-shrink-0" /> support@myschoolpoint.in</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-900 flex items-center justify-between flex-wrap gap-4 text-xs text-slate-500">
          <div>© {new Date().getFullYear()} MySchoolPoint ERP. All rights reserved.</div>
          <div className="flex items-center gap-1">Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Smart Schools across India.</div>
        </div>
      </div>
    </footer>
  );
}
