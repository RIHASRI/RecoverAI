import React, { useEffect, useState } from 'react';
import { FileText, RefreshCw, ShieldCheck, UserCheck, Bot } from 'lucide-react';
import { AuditLogItem } from '../types';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    fetch('/api/audit-logs')
      .then((res) => res.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-[#3D2E24] tracking-tight">AI Agent Audit Trail</h3>
          <p className="text-xs text-[#7C6656]">Complete immutable record of every autonomous intervention, reason, and guardrail check</p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2.5 rounded-xl bg-[#EFE8DC] border border-[#D8CBB5] text-[#5C483A] hover:text-[#3D2E24] hover:bg-[#E8DFC8] text-xs font-semibold flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#8C5D3B]' : ''}`} />
          Refresh Logs
        </button>
      </div>

      <div className="rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#D8CBB5] bg-[#E8DFC8] text-[#5C483A] text-[11px] font-bold uppercase tracking-wider">
              <th className="py-4 px-6">Timestamp</th>
              <th className="py-4 px-4">Transaction / Customer</th>
              <th className="py-4 px-4">Amount</th>
              <th className="py-4 px-4">Intervention Action</th>
              <th className="py-4 px-4">Decision Reason</th>
              <th className="py-4 px-4">Recovery Prob</th>
              <th className="py-4 px-4">Execution Result</th>
              <th className="py-4 px-4">Executor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8CBB5] text-xs">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#7C6656]">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#8C5D3B]" />
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#7C6656]">
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="hover:bg-[#E8DFC8]/60 transition-colors">
                  <td className="py-4 px-6 font-mono text-[#7C6656] text-[11px]">
                    {new Date(l.timestamp).toLocaleString()}
                  </td>

                  <td className="py-4 px-4 font-bold text-[#3D2E24]">
                    {l.customer_name}
                    <span className="text-[11px] text-[#7C6656] font-mono font-normal block">{l.transaction_id}</span>
                  </td>

                  <td className="py-4 px-4 font-black text-[#3D2E24]">
                    ₹{l.amount?.toLocaleString('en-IN')}
                  </td>

                  <td className="py-4 px-4 font-semibold text-[#047857]">
                    {l.action}
                  </td>

                  <td className="py-4 px-4 text-[#5C483A]">
                    {l.reason}
                  </td>

                  <td className="py-4 px-4 font-extrabold text-[#0284C7]">
                    {l.recovery_probability}%
                  </td>

                  <td className="py-4 px-4 font-bold">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] ${
                      l.result.includes('SUCCESS') ? 'bg-[#047857]/15 text-[#047857] border border-[#047857]/30' :
                      l.result.includes('APPROVED') ? 'bg-[#D97706]/15 text-[#B45309] border border-[#D97706]/30' :
                      'bg-[#EFE8DC] text-[#7C6656] border border-[#D8CBB5]'
                    }`}>
                      {l.result}
                    </span>
                  </td>

                  <td className="py-4 px-4 font-medium text-[#5C483A]">
                    <span className="flex items-center gap-1.5">
                      {l.executed_by === 'AI Agent' ? (
                        <Bot className="w-3.5 h-3.5 text-[#8C5D3B]" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5 text-[#D97706]" />
                      )}
                      {l.executed_by}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
