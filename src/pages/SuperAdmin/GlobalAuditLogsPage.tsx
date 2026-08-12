import { useState } from 'react';
import { FileText, Clock } from 'lucide-react';

interface AuditLog {
  id: number;
  user_email: string;
  action: string;
  module: string;
  ip_address: string;
  school_code: string;
  created_at: string;
}

export default function GlobalAuditLogsPage() {
  const [logs] = useState<AuditLog[]>([
    { id: 1, user_email: 'superadmin@myschoolpoint.com', action: 'Provisioned Isolated Tenant DB: school_heritage_academy', module: 'Landlord Engine', ip_address: '127.0.0.1', school_code: 'myschoolpoint', created_at: '2026-08-01 23:45:12' },
    { id: 2, user_email: 'admin@dps_demo.com', action: 'Modified Fee Structure Allocation ID: 104', module: 'Fee Management', ip_address: '192.168.1.45', school_code: 'dps_demo', created_at: '2026-08-01 22:14:00' },
    { id: 3, user_email: 'superadmin@myschoolpoint.com', action: 'Switched Active Database Context to school_cambridge_intl', module: 'Landlord Switcher', ip_address: '127.0.0.1', school_code: 'myschoolpoint', created_at: '2026-08-01 21:05:44' },
    { id: 4, user_email: 'admin@st_marys.com', action: 'Generated Monthly Payslips Batch #881', module: 'Payroll HRMS', ip_address: '10.0.0.12', school_code: 'st_marys', created_at: '2026-08-01 20:30:19' },
    { id: 5, user_email: 'superadmin@myschoolpoint.com', action: 'Created Global API Gateway Token for Biometric Scanners', module: 'Developer Gateway', ip_address: '127.0.0.1', school_code: 'myschoolpoint', created_at: '2026-08-01 19:12:05' },
  ]);

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Header */}
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-400/30">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black tracking-tight text-white">Platform-Wide System Audit & Security Logs</h1>
          </div>
          <p className="text-xs text-slate-400">Comprehensive audit trails of landlord provisioning actions, tenant DB switches, and security events.</p>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="p-3">Timestamp</th>
                <th className="p-3">User Email</th>
                <th className="p-3">Tenant DB Context</th>
                <th className="p-3">Module</th>
                <th className="p-3">Action Details</th>
                <th className="p-3 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3 text-slate-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-400" /> {log.created_at}</td>
                  <td className="p-3 font-bold text-white">{log.user_email}</td>
                  <td className="p-3 text-cyan-400 font-bold">{log.school_code}</td>
                  <td className="p-3 text-amber-400">{log.module}</td>
                  <td className="p-3 text-slate-200 font-sans">{log.action}</td>
                  <td className="p-3 text-right text-slate-400">{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
