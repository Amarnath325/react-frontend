import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

const Login: React.FC = () => {
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
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 flex flex-col items-center justify-center p-4 relative font-sans">
      {/* Top Left Navigation Link */}
      <div className="absolute top-5 left-5">
        <Link
          to="/home"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl text-xs font-bold border border-white/20 shadow-md transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-blue-300" /> Back to Home Page
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 mb-3 text-white">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back!</h1>
          <p className="text-xs text-slate-500 mt-1">Log in to your MySchoolPoint ERP portal</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
              placeholder="admin@dps.edu"
              required
            />
          </div>
          
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Logging in...' : 'Sign In to Portal'}
          </button>
        </form>
        
        <div className="mt-5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-600">
          <p className="font-bold text-slate-800">Demo Credentials:</p>
          <p className="text-[11px] mt-1 text-slate-500">Admin: <strong className="text-slate-700 font-mono">admin@dps.edu / Admin@123</strong></p>
          <p className="text-[11px] text-slate-500">Teacher: <strong className="text-slate-700 font-mono">teacher@dps.edu / Teacher@123</strong></p>
        </div>
        
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-bold">
            Register New School
          </Link>

          <Link to="/superadmin/login" className="text-amber-600 hover:text-amber-700 font-extrabold flex items-center gap-1">
            👑 Super Admin Portal
          </Link>

          <Link to="/home" className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-blue-500" /> Public Website
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;