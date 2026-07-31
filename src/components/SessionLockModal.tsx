import React, { useState } from 'react';
import { Lock, KeyRound, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SessionLockModal() {
  const { user, isLocked, unlockSession, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  if (!isLocked || !user) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setUnlocking(true);
    const ok = await unlockSession(password);
    setUnlocking(false);
    if (ok) setPassword('');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-center p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-orange-500/30 text-white">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Session Locked</h2>
          <p className="text-xs text-slate-500 mt-1">Your session has been locked due to inactivity to protect sensitive ERP data.</p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 text-left">
          <div className="w-10 h-10 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center text-sm uppercase">
            {user.first_name?.[0] || 'U'}
          </div>
          <div className="truncate">
            <div className="font-bold text-sm text-slate-900">{user.first_name} {user.last_name}</div>
            <div className="text-xs text-slate-500 font-mono truncate">{user.email}</div>
          </div>
        </div>

        <form onSubmit={handleUnlock} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1 text-left">Enter Password to Unlock</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={unlocking}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-60 transition-all"
          >
            {unlocking ? 'Verifying...' : 'Unlock Session'}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 flex justify-center">
          <button
            onClick={logout}
            className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out Completely
          </button>
        </div>
      </div>
    </div>
  );
}
