import React, { useState, useEffect } from 'react';
import { Search, Users, ShieldAlert, TrendingUp, RefreshCw, DollarSign } from 'lucide-react';
import { Customer } from '../types';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/customers${search ? `?search=${search}` : ''}`)
      .then((res) => res.json())
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [search]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-[#3D2E24] tracking-tight">Customer Lifetime Value & Churn Intelligence</h3>
          <p className="text-xs text-[#7C6656]">Monitoring customer payment history, recovery history, and churn risk scores</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-[#7C6656] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F9F6F0] border border-[#D8CBB5] rounded-xl pl-10 pr-4 py-2 text-xs text-[#3D2E24] placeholder-[#A08C7D] focus:outline-none focus:border-[#8C5D3B]/50"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#D8CBB5] bg-[#E8DFC8] text-[#5C483A] text-[11px] font-bold uppercase tracking-wider">
              <th className="py-4 px-6">Customer</th>
              <th className="py-4 px-4">Tier</th>
              <th className="py-4 px-4">Lifetime Value (CLV)</th>
              <th className="py-4 px-4">Historical Success Rate</th>
              <th className="py-4 px-4">Total Failed Amt</th>
              <th className="py-4 px-4">Recovered Amt</th>
              <th className="py-4 px-4">Churn Risk Score</th>
              <th className="py-4 px-4">Subscription</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8CBB5] text-xs">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#7C6656]">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#8C5D3B]" />
                  Loading customers...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#7C6656]">
                  No matching customers found.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-[#E8DFC8]/60 transition-colors">
                  <td className="py-4 px-6 font-bold text-[#3D2E24]">
                    {c.name}
                    <span className="text-[11px] text-[#7C6656] font-normal block">{c.email}</span>
                  </td>

                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EFE8DC] text-[#8C5D3B] border border-[#D8CBB5]">
                      {c.tier}
                    </span>
                  </td>

                  <td className="py-4 px-4 font-black text-[#047857]">
                    ₹{c.clv?.toLocaleString('en-IN')}
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 font-bold text-[#0284C7]">
                      <div className="w-12 bg-[#E8DFC8] h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0284C7] rounded-full"
                          style={{ width: `${c.historical_success_rate}%` }}
                        />
                      </div>
                      {c.historical_success_rate}%
                    </div>
                  </td>

                  <td className="py-4 px-4 font-extrabold text-[#C2410C]">
                    ₹{c.total_failed_amount?.toLocaleString('en-IN')}
                  </td>

                  <td className="py-4 px-4 font-extrabold text-[#047857]">
                    ₹{c.total_recovered_amount?.toLocaleString('en-IN')}
                  </td>

                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      c.churn_risk_score > 30 ? 'bg-[#C2410C]/15 text-[#C2410C] border border-[#C2410C]/30' : 'bg-[#047857]/15 text-[#047857] border border-[#047857]/30'
                    }`}>
                      {c.churn_risk_score}% Risk
                    </span>
                  </td>

                  <td className="py-4 px-4 font-semibold text-[#5C483A]">
                    {c.subscription_status}
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
