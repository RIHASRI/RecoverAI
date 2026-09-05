import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { RefreshCw } from 'lucide-react';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-[#7C6656] flex flex-col items-center justify-center gap-3 min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#8C5D3B]" />
        <span>Loading Analytics & Intervention Performance Metrics...</span>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h3 className="text-xl font-extrabold text-[#3D2E24] tracking-tight">Recovery Performance Analytics</h3>
        <p className="text-xs text-[#7C6656]">Recovery rate comparison across payment methods and intervention strategy success rates</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recovery Rate by Payment Method */}
        <div className="p-6 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] space-y-4 shadow-xs">
          <div>
            <h4 className="font-bold text-[#3D2E24] text-base">Recovery Rate by Payment Method (%)</h4>
            <p className="text-xs text-[#7C6656]">Comparing success rates for UPI, Credit Cards, Netbanking, etc.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.payment_method_analytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="method" stroke="#7C6656" fontSize={12} tickLine={false} />
                <YAxis stroke="#7C6656" fontSize={12} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#F9F6F0', borderColor: '#D8CBB5', borderRadius: '12px', color: '#3D2E24' }}
                  formatter={(val: number) => [`${val}%`, 'Recovery Rate']}
                />
                <Bar dataKey="rate" name="Recovery Rate %" fill="#047857" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intervention Strategy Success Rate */}
        <div className="p-6 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] space-y-4 shadow-xs">
          <div>
            <h4 className="font-bold text-[#3D2E24] text-base">Intervention Success Rate (%)</h4>
            <p className="text-xs text-[#7C6656]">Smart Retry vs Payment Reminders vs Method Switch</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.action_analytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="action" stroke="#7C6656" fontSize={11} tickLine={false} />
                <YAxis stroke="#7C6656" fontSize={12} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#F9F6F0', borderColor: '#D8CBB5', borderRadius: '12px', color: '#3D2E24' }}
                  formatter={(val: number) => [`${val}%`, 'Success Rate']}
                />
                <Bar dataKey="rate" name="Success Rate %" fill="#0284C7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
