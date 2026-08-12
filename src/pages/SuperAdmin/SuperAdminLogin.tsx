import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Crown, ShieldCheck, ArrowLeft, Lock, Mail, Database } from 'lucide-react';

const SuperAdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/superadmin/dashboard');
    } catch (error) {
      console.error('SuperAdmin Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-4 relative font-sans text-slate-100">
      {/* Top Left Navigation Link */}
      <div className="absolute top-5 left-5">
        <Link
          to="/home"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl text-xs font-bold border border-white/20 shadow-md transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-blue-300" /> Back to Public Website
        </Link>
      </div>

      <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-slate-800 animate-in fade-in zoom-in-95 duration-200 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-500 rounded-2xl shadow-lg shadow-amber-500/20 mb-3 text-slate-950">
            <Crown className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">SaaS Super Admin Portal</h1>
          <p className="text-xs text-slate-400 mt-1">Platform Owner & Landlord Control Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Global Super Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@myschoolpoint.com"
                required
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Master Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-white text-xs"
              />
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span>Landlord Connection: Isolated Master DB Access</span>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center text-xs text-amber-200">
            <p className="font-bold text-amber-400">Global Super Admin Credentials:</p>
            <p className="text-[11px] mt-1">Email: <strong className="text-white font-mono">superadmin@myschoolpoint.com</strong></p>
            <p className="text-[11px]">Password: <strong className="text-white font-mono">SuperAdmin@12345</strong></p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Authenticating Landlord...
              </>
            ) : (
              <>
                <Crown className="w-4 h-4" /> Log In to Super Admin Panel
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center">
          <Link
            to="/login"
            className="text-xs text-slate-400 hover:text-white font-bold inline-flex items-center gap-1 transition-colors"
          >
            Looking for School Portal Login? <span className="text-blue-400">Click Here</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
