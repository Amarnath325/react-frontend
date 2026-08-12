import React, { useState } from 'react';
import SuperAdminSidebar from './SuperAdminSidebar';
import { Database, Crown, RefreshCw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const [activeTenantCode, setActiveTenantCode] = useState<string>(
    localStorage.getItem('tenant_code') || ''
  );

  const handleClearTenantSwitch = () => {
    localStorage.removeItem('tenant_code');
    setActiveTenantCode('');
    toast.success('Connected back to Master Landlord DB (myschoolpoint)');
    window.location.reload();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Super Admin Sidebar */}
      <SuperAdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-900">
        {/* Super Admin Header Bar */}
        <header className="h-16 flex-shrink-0 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-400/30">
              <Crown className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-extrabold text-xs tracking-tight text-white uppercase">SaaS Global Control Console</h3>
              <p className="text-[10px] text-slate-400">Landlord Multi-Tenant System Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeTenantCode ? (
              <button
                onClick={handleClearTenantSwitch}
                className="px-3 py-1.5 bg-amber-500/20 border border-amber-400/40 text-amber-300 hover:bg-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Tenant: <strong className="font-mono text-white">{activeTenantCode}</strong> (Reset Context)
              </button>
            ) : (
              <span className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" /> Master Landlord DB <span className="text-[10px] text-emerald-400 font-mono">(myschoolpoint)</span>
              </span>
            )}

            <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Platform Health 100%
            </div>
          </div>
        </header>

        {/* Page Children Container */}
        <main className="flex-1 p-5 overflow-y-auto min-h-0 bg-slate-900 scrollbar-thin scrollbar-thumb-slate-800">
          {children}
        </main>
      </div>
    </div>
  );
}
