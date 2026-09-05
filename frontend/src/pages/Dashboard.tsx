import React from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowUpRight, 
  Sparkles,
  Zap,
  RefreshCw,
  Eye
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { DashboardMetrics, Transaction, TabType } from '../types';

interface DashboardProps {
  metrics: DashboardMetrics | null;
  queue: Transaction[];
  loading: boolean;
  onSelectTransaction: (id: string) => void;
  onNavigateTab: (tab: TabType) => void;
}

const REASON_COLORS = ['#C2410C', '#D97706', '#0284C7', '#059669', '#7C3AED'];

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  queue,
  loading,
  onSelectTransaction,
  onNavigateTab
}) => {
  if (loading || !metrics) {
    return (
      <div className="p-12 text-center text-[#7C6656] flex flex-col items-center justify-center gap-3 min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#8C5D3B]" />
        <span className="font-semibold text-sm">Loading Executive Revenue Dashboard & ML Probabilities...</span>
      </div>
    );
  }

  const formatINR = (val: number = 0) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)}L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const activeCandidates = queue.slice(0, 5);

  return (
    <div className="p-8 space-y-8">
      {/* Buildathon Target Key Objective Pipeline Banner */}
      <div className="p-6 rounded-2xl bg-[#EFE8DC] border border-[#D8CBB5] relative overflow-hidden shadow-xs">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#8C5D3B]" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#8C5D3B]">
                Razorpay Buildathon Key Objective Pipeline
              </span>
            </div>
            <div className="flex items-baseline gap-4 mt-2">
              <div>
                <span className="text-3xl font-black text-[#C2410C]">
                  {formatINR(metrics.revenue_at_risk)}
                </span>
                <span className="text-xs font-bold text-[#7C6656] uppercase tracking-wider block mt-0.5">
                  Risk
                </span>
              </div>
              <span className="text-2xl text-[#8C5D3B] font-extrabold">→</span>
              <div>
                <span className="text-3xl font-black text-[#0284C7]">
                  {formatINR(metrics.potentially_recoverable)}
                </span>
                <span className="text-xs font-bold text-[#0284C7] uppercase tracking-wider block mt-0.5">
                  Recoverable
                </span>
              </div>
              <span className="text-2xl text-[#8C5D3B] font-extrabold">→</span>
              <div>
                <span className="text-3xl font-black text-[#047857]">
                  {formatINR(metrics.revenue_recovered)}
                </span>
                <span className="text-xs font-bold text-[#047857] uppercase tracking-wider block mt-0.5">
                  Recovered
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#E8DFC8] border border-[#D8CBB5] text-right">
            <span className="text-xs font-bold text-[#7C6656] block">Recovery Rate Target</span>
            <span className="text-2xl font-black text-[#047857]">{metrics.recovery_rate}%</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-6 gap-5">
        {/* Card 1: Revenue at Risk */}
        <div className="p-5 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#7C6656]">
            <span className="text-xs font-extrabold uppercase tracking-wider">Revenue at Risk</span>
            <AlertTriangle className="w-4 h-4 text-[#C2410C]" />
          </div>
          <div className="text-2xl font-black text-[#C2410C]">
            {formatINR(metrics.revenue_at_risk)}
          </div>
          <p className="text-[11px] text-[#7C6656] font-medium">Pending failed payments</p>
        </div>

        {/* Card 2: Potentially Recoverable */}
        <div className="p-5 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#7C6656]">
            <span className="text-xs font-extrabold uppercase tracking-wider">Potentially Recoverable</span>
            <Sparkles className="w-4 h-4 text-[#0284C7]" />
          </div>
          <div className="text-2xl font-black text-[#0284C7]">
            {formatINR(metrics.potentially_recoverable)}
          </div>
          <p className="text-[11px] text-[#0284C7] font-medium">ML Probable Retries</p>
        </div>

        {/* Card 3: Revenue Recovered */}
        <div className="p-5 rounded-2xl bg-[#F0E8DD] border-2 border-[#047857]/40 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#7C6656]">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#047857]">Revenue Recovered</span>
            <CheckCircle2 className="w-4 h-4 text-[#047857]" />
          </div>
          <div className="text-2xl font-black text-[#047857]">
            {formatINR(metrics.revenue_recovered)}
          </div>
          <p className="text-[11px] text-[#047857] font-bold">+₹1.2L this week</p>
        </div>

        {/* Card 4: Recovery Rate */}
        <div className="p-5 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#7C6656]">
            <span className="text-xs font-extrabold uppercase tracking-wider">Recovery Rate</span>
            <TrendingUp className="w-4 h-4 text-[#8C5D3B]" />
          </div>
          <div className="text-2xl font-black text-[#3D2E24]">
            {metrics.recovery_rate}%
          </div>
          <p className="text-[11px] text-[#7C6656] font-medium">Target: 74.2%</p>
        </div>

        {/* Card 5: Successful Recoveries */}
        <div className="p-5 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#7C6656]">
            <span className="text-xs font-extrabold uppercase tracking-wider">Successful Recoveries</span>
            <Zap className="w-4 h-4 text-[#047857]" />
          </div>
          <div className="text-2xl font-black text-[#3D2E24]">
            {metrics.successful_recoveries}
          </div>
          <p className="text-[11px] text-[#7C6656] font-medium">Automated & Approved</p>
        </div>

        {/* Card 6: Failed Retries (Guardrail Cap) */}
        <div className="p-5 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#7C6656]">
            <span className="text-xs font-extrabold uppercase tracking-wider">Failed Retries</span>
            <ShieldAlert className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-2xl font-black text-[#3D2E24]">
            {metrics.failed_retries}
          </div>
          <p className="text-[11px] text-[#D97706] font-bold flex items-center gap-1">
            Max 3 retries limit
          </p>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="col-span-2 p-6 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-[#3D2E24] text-base">Revenue Recovery & At-Risk Trend</h3>
              <p className="text-xs text-[#7C6656]">Daily recovery volume vs pending risk over the past week</p>
            </div>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="text-xs font-bold text-[#8C5D3B] hover:text-[#3D2E24] flex items-center gap-1"
            >
              Full Analytics <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.trend_data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C2410C" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#C2410C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#7C6656" fontSize={11} tickLine={false} />
                <YAxis stroke="#7C6656" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#F9F6F0', borderColor: '#D8CBB5', borderRadius: '12px', color: '#3D2E24' }}
                  formatter={(val: number) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']}
                />
                <Area type="monotone" dataKey="recovered" name="Recovered" stroke="#047857" strokeWidth={3} fillOpacity={1} fill="url(#colorRecovered)" />
                <Area type="monotone" dataKey="at_risk" name="At Risk" stroke="#C2410C" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorRisk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Donut Chart */}
        <div className="p-6 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] space-y-4 shadow-xs">
          <div>
            <h3 className="font-extrabold text-[#3D2E24] text-base">Failure Reason Breakdown</h3>
            <p className="text-xs text-[#7C6656]">Distribution of payment failure causes</p>
          </div>

          <div className="h-48 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.failure_breakdown || []}
                  dataKey="count"
                  nameKey="reason"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {(metrics.failure_breakdown || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={REASON_COLORS[index % REASON_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#F9F6F0', borderColor: '#D8CBB5', borderRadius: '12px', color: '#3D2E24' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#D8CBB5] max-h-24 overflow-y-auto">
            {(metrics.failure_breakdown || []).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-semibold text-[#5C483A]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: REASON_COLORS[idx % REASON_COLORS.length] }}></span>
                  <span>{item.reason}</span>
                </div>
                <span className="font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live AI Interventions Queue Widget */}
      <div className="p-6 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-[#3D2E24] text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8C5D3B]" />
              Top Active Interventions Requiring Action
            </h3>
            <p className="text-xs text-[#7C6656]">High ML probability recovery targets prepared by AI Agent</p>
          </div>
          <button
            onClick={() => onNavigateTab('queue')}
            className="text-xs font-bold text-[#8C5D3B] hover:text-[#3D2E24] flex items-center gap-1"
          >
            View Full Queue ({queue.length}) <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="rounded-xl border border-[#D8CBB5] overflow-hidden bg-[#F9F6F0]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#D8CBB5] bg-[#E8DFC8] text-[#5C483A] text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Failure Cause</th>
                <th className="py-3 px-4">ML Probability</th>
                <th className="py-3 px-4">Recommended Action</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8CBB5] text-xs">
              {activeCandidates.map((t) => (
                <tr key={t.id} className="hover:bg-[#E8DFC8]/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#3D2E24]">
                    {t.customer_name}
                    <span className="text-[10px] text-[#7C6656] block font-mono font-normal">{t.id}</span>
                  </td>
                  <td className="py-3 px-4 font-black text-[#3D2E24]">
                    ₹{t.amount?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#5C483A]">
                    {t.failure_reason}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-extrabold text-[#047857]">{t.recovery_probability}%</span>
                  </td>
                  <td className="py-3 px-4 text-[#5C483A] font-medium">
                    {t.recommended_action}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectTransaction(t.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#EFE8DC] text-[#3D2E24] hover:bg-[#E8DFC8] border border-[#D8CBB5] text-xs font-bold flex items-center gap-1.5 ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5" /> Analyze
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
