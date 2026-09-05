import React, { useState } from 'react';
import { PlayCircle, ShieldCheck, RefreshCw, CheckCircle2, ArrowRight, Zap, AlertTriangle, Sparkles, Bot } from 'lucide-react';
import { DashboardMetrics } from '../types';

interface SimulationProps {
  onRefreshMetrics: () => void;
  metrics: DashboardMetrics | null;
}

export const Simulation: React.FC<SimulationProps> = ({ onRefreshMetrics, metrics }) => {
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [simResult, setSimResult] = useState<any>(null);

  const workflowSteps = [
    { title: '1. Failed Payment Detected', desc: 'Transaction flagged via gateway webhook' },
    { title: '2. AI Engine ML Inference', desc: 'scikit-learn probability & factor scoring' },
    { title: '3. Intervention Selection', desc: 'Smart Retry, Reminder, or Method Switch' },
    { title: '4. Guardrails Check', desc: 'Verifying retry limits & high-value threshold' },
    { title: '5. Razorpay Mock Gateway Retry', desc: 'Executing simulated payment authorization' },
    { title: '6. Record Audit Log & Update Metrics', desc: 'Publishing execution metrics to dashboard' }
  ];

  const handleRunSimulation = async () => {
    setRunning(true);
    setSimResult(null);

    for (let i = 0; i < workflowSteps.length; i++) {
      setActiveStep(i);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    try {
      const res = await fetch('/api/simulation/run', { method: 'POST' });
      const data = await res.json();
      setSimResult(data);
      onRefreshMetrics();
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-[#EFE8DC] border border-[#B4886B]/40 flex items-center justify-between shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8C5D3B]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C5D3B]">
              Razorpay AI Agent Simulation Engine
            </span>
          </div>
          <h3 className="text-2xl font-extrabold text-[#3D2E24] tracking-tight">Run Autonomous Recovery Batch</h3>
          <p className="text-xs text-[#5C483A]">
            Loads pending failed transactions, runs ML recovery engine, evaluates guardrails, and executes Razorpay test mode retries.
          </p>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={running}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#8C5D3B] to-[#B4886B] text-white font-extrabold text-sm shadow-md shadow-[#8C5D3B]/20 hover:from-[#734A2C] hover:to-[#A3775B] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {running ? <RefreshCw className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5 fill-white/20" />}
          {running ? 'Agent Executing...' : 'Run Recovery Simulation'}
        </button>
      </div>

      {/* Workflow Step Tracker Grid */}
      <div className="p-6 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] space-y-6 shadow-xs">
        <h4 className="font-bold text-[#3D2E24] text-sm uppercase tracking-wider flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#8C5D3B]" /> AI Recovery Agent Execution Pipeline
        </h4>

        <div className="grid grid-cols-3 gap-4">
          {workflowSteps.map((step, idx) => {
            const isActive = activeStep === idx;
            const isDone = activeStep > idx || (simResult && !running);
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-[#E8DFC8] border-[#8C5D3B] text-[#3D2E24] shadow-xs'
                    : isDone
                    ? 'bg-[#F9F6F0] border-[#047857]/40 text-[#3D2E24]'
                    : 'bg-[#F9F6F0] border-[#D8CBB5] text-[#7C6656]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs">{step.title}</span>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-[#047857]" />
                  ) : isActive ? (
                    <RefreshCw className="w-4 h-4 text-[#8C5D3B] animate-spin" />
                  ) : null}
                </div>
                <p className="text-[11px] text-[#7C6656] leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulation Output Card */}
      {simResult && (
        <div className="p-6 rounded-2xl bg-[#F0E8DD] border border-[#047857]/40 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#D8CBB5] pb-4">
            <div>
              <h4 className="font-bold text-[#047857] text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" /> Batch Simulation Results
              </h4>
              <p className="text-xs text-[#7C6656]">Processed {simResult.processed_count} pending failed transactions</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#7C6656] block font-semibold">Newly Recovered Revenue</span>
              <span className="text-xl font-black text-[#047857]">
                +₹{simResult.total_newly_recovered?.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <span className="font-bold text-[#5C483A] uppercase tracking-wider text-[10px] block">
              Executed Action Details ({simResult.recovered_count} Successful Recoveries)
            </span>
            <div className="divide-y divide-[#D8CBB5] max-h-60 overflow-y-auto">
              {simResult.details?.map((item: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#3D2E24] block">{item.customer_name} ({item.transaction_id})</span>
                    <span className="text-[11px] text-[#7C6656]">{item.action} • Attempt {item.retry_count}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#3D2E24] block">₹{item.amount?.toLocaleString('en-IN')}</span>
                    <span className={`text-[11px] font-bold ${
                      item.result === 'SUCCESS' ? 'text-[#047857]' : 'text-[#C2410C]'
                    }`}>
                      {item.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
