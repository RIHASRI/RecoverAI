import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Eye, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionsProps {
  onSelectTransaction: (id: string) => void;
}

export const Transactions: React.FC<TransactionsProps> = ({ onSelectTransaction }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTransactions = () => {
    setLoading(true);
    let url = '/api/transactions';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (statusFilter) params.append('status', statusFilter);
    if (params.toString()) url += `?${params.toString()}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTransactions();
  }, [search, statusFilter]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-[#3D2E24] tracking-tight">Transaction History & AI Audits</h3>
          <p className="text-xs text-[#7C6656]">Complete record of successful, failed, and recovered payment transactions</p>
        </div>
        <button
          onClick={fetchTransactions}
          className="p-2.5 rounded-xl bg-[#EFE8DC] border border-[#D8CBB5] text-[#5C483A] hover:text-[#3D2E24] hover:bg-[#E8DFC8] text-xs font-semibold flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#8C5D3B]' : ''}`} />
          Refresh List
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] flex items-center gap-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#7C6656] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by customer name or transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F9F6F0] border border-[#D8CBB5] rounded-xl pl-10 pr-4 py-2 text-xs text-[#3D2E24] placeholder-[#A08C7D] focus:outline-none focus:border-[#8C5D3B]/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#F9F6F0] border border-[#D8CBB5] rounded-xl px-3 py-2 text-xs text-[#3D2E24] focus:outline-none focus:border-[#8C5D3B]/50 font-medium"
        >
          <option value="">All Statuses</option>
          <option value="RECOVERED">RECOVERED</option>
          <option value="FAILED">FAILED</option>
          <option value="SUCCESS">SUCCESS (Normal)</option>
          <option value="REQUIRES_APPROVAL">REQUIRES_APPROVAL</option>
          <option value="STOPPED">STOPPED</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#D8CBB5] bg-[#E8DFC8] text-[#5C483A] text-[11px] font-bold uppercase tracking-wider">
              <th className="py-4 px-6">Transaction ID / Date</th>
              <th className="py-4 px-4">Customer</th>
              <th className="py-4 px-4">Amount</th>
              <th className="py-4 px-4">Payment Method</th>
              <th className="py-4 px-4">Failure Reason</th>
              <th className="py-4 px-4">Recovery Prob</th>
              <th className="py-4 px-4">Status</th>
              <th className="py-4 px-6 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8CBB5] text-xs">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#7C6656]">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#8C5D3B]" />
                  Loading transactions...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#7C6656]">
                  No matching transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-[#E8DFC8]/60 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-[#3D2E24]">
                    {t.id}
                    <span className="text-[11px] text-[#7C6656] font-sans font-normal block">
                      {new Date(t.created_at).toLocaleString()}
                    </span>
                  </td>

                  <td className="py-4 px-4 font-semibold text-[#3D2E24]">
                    {t.customer_name}
                    <span className="text-[11px] text-[#7C6656] block">{t.customer_email}</span>
                  </td>

                  <td className="py-4 px-4 font-black text-[#3D2E24]">
                    ₹{t.amount?.toLocaleString('en-IN')}
                  </td>

                  <td className="py-4 px-4 text-[#5C483A] font-medium">
                    {t.payment_method}
                  </td>

                  <td className="py-4 px-4 text-[#5C483A]">
                    {t.failure_reason !== 'None' ? (
                      <span className="px-2.5 py-1 rounded-lg bg-[#EFE8DC] text-[#5C483A] border border-[#D8CBB5] text-[11px]">
                        {t.failure_reason}
                      </span>
                    ) : (
                      <span className="text-[#A08C7D]">-</span>
                    )}
                  </td>

                  <td className="py-4 px-4 font-bold text-[#047857]">
                    {t.recovery_probability}%
                  </td>

                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      t.status === 'RECOVERED' ? 'bg-[#047857]/15 text-[#047857] border border-[#047857]/30' :
                      t.status === 'SUCCESS' ? 'bg-[#0284C7]/15 text-[#0284C7] border border-[#0284C7]/30' :
                      t.status === 'REQUIRES_APPROVAL' ? 'bg-[#D97706]/15 text-[#B45309] border border-[#D97706]/30' :
                      'bg-[#C2410C]/15 text-[#C2410C] border border-[#C2410C]/30'
                    }`}>
                      {t.status}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => onSelectTransaction(t.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#EFE8DC] text-[#3D2E24] hover:bg-[#E8DFC8] border border-[#D8CBB5] text-xs font-semibold flex items-center gap-1.5 ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5" /> Analyze
                    </button>
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
