import React, { useEffect, useState } from 'react';
import { X, Sparkles, AlertTriangle, ShieldCheck, CheckCircle2, Copy, Send, Bot, Clock, ArrowRight, DollarSign, RefreshCw } from 'lucide-react';
import { TransactionAnalysis } from '../types';

interface TransactionModalProps {
  transactionId: string | null;
  onClose: () => void;
  onExecuteRetry: (id: string) => Promise<void>;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  transactionId,
  onClose,
  onExecuteRetry
}) => {
  const [data, setData] = useState<TransactionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  useEffect(() => {
    if (!transactionId) return;
    setLoading(true);
    fetch(`/api/transactions/${transactionId}/analysis`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [transactionId]);

  if (!transactionId) return null;

  const handleExecute = async () => {
    if (!transactionId) return;
    setExecuting(true);
    await onExecuteRetry(transactionId);
    setExecuting(false);
    onClose();
  };

  const copyDraftMessage = () => {
    if (data?.ai_message_draft) {
      navigator.clipboard.writeText(data.ai_message_draft);
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2C221E]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#F9F6F0] border border-[#D8CBB5] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 p-8 relative text-[#3D2E24]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-[#EFE8DC] text-[#7C6656] hover:text-[#3D2E24] hover:bg-[#E8DFC8] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {loading || !data ? (
          <div className="py-20 text-center text-[#7C6656] space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#8C5D3B]" />
            <p className="font-semibold text-sm">Computing ML features & running AI recovery analysis...</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[#D8CBB5] pb-5">
              <div className="w-10 h-10 rounded-2xl bg-[#E8DFC8] border border-[#B4886B]/30 flex items-center justify-center text-[#8C5D3B]">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[#3D2E24] tracking-tight flex items-center gap-2">
                  Transaction Analysis & AI Interventions
                  <span className="text-xs px-3 py-1 rounded-full font-mono bg-[#E8DFC8] text-[#5C483A] border border-[#D8CBB5]">
                    {data.transaction.id}
                  </span>
                </h3>
                <p className="text-xs text-[#7C6656]">Deep ML breakdown, feature importances, and action draft</p>
              </div>
            </div>

            {/* Quick Metrics Banner */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5]">
                <span className="text-xs font-bold text-[#7C6656] block">Transaction Amount</span>
                <span className="text-xl font-black text-[#3D2E24]">
                  ₹{data.transaction.amount?.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-[#7C6656] block">Method: {data.transaction.payment_method}</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#EFE8DC] border border-[#047857]/40">
                <span className="text-xs font-bold text-[#047857] block">Recovery Probability</span>
                <span className="text-2xl font-black text-[#047857]">
                  {data.ml_analysis.recovery_probability}%
                </span>
                <span className="text-[11px] text-[#047857] font-semibold block">
                  Confidence Score: {data.ml_analysis.confidence_score}%
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5]">
                <span className="text-xs font-bold text-[#7C6656] block">Expected Recovery</span>
                <span className="text-xl font-black text-[#0284C7]">
                  ₹{data.ml_analysis.expected_recovery?.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-[#7C6656] block">Formula: Amount × Prob</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5]">
                <span className="text-xs font-bold text-[#7C6656] block">Status</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#D97706]/15 text-[#B45309] border border-[#D97706]/30 inline-block mt-1">
                  {data.transaction.status}
                </span>
                <span className="text-[11px] text-[#7C6656] block mt-1">Retries: {data.transaction.retry_count}/3</span>
              </div>
            </div>

            {/* Failure & Intervention Action Box */}
            <div className="p-5 rounded-2xl bg-[#EFE8DC] border border-[#D8CBB5] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#C2410C] flex items-center gap-1.5 text-sm">
                  <AlertTriangle className="w-4 h-4" /> Failure Cause: {data.transaction.failure_reason}
                </span>
                <span className="text-[#7C6656] font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Best Retry Window: <strong className="text-[#3D2E24]">{data.ai_recommendation.optimal_retry_window}</strong>
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#8C5D3B]" />
                  <span className="font-extrabold text-[#3D2E24] text-sm">
                    Recommended Intervention: <span className="text-[#8C5D3B]">{data.ai_recommendation.action}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Two-Column Grid: Customer Health & ML Factors */}
            <div className="grid grid-cols-2 gap-6">
              {/* Customer Financial Health */}
              <div className="p-5 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] space-y-3">
                <h4 className="font-extrabold text-[#3D2E24] text-xs uppercase tracking-wider text-[#7C6656]">
                  Customer Financial Health
                </h4>
                <div className="space-y-2 text-xs divide-y divide-[#D8CBB5]">
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#7C6656]">Customer Name</span>
                    <span className="font-bold text-[#3D2E24]">{data.customer.name}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#7C6656]">Lifetime Value (CLV)</span>
                    <span className="font-extrabold text-[#047857]">₹{data.customer.clv?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#7C6656]">Historical Success Rate</span>
                    <span className="font-bold text-[#0284C7]">{data.customer.historical_success_rate}%</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#7C6656]">Subscription Status</span>
                    <span className="font-semibold text-[#3D2E24]">{data.customer.subscription_status}</span>
                  </div>
                </div>
              </div>

              {/* ML Feature Importances */}
              <div className="p-5 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] space-y-3">
                <h4 className="font-extrabold text-[#3D2E24] text-xs uppercase tracking-wider text-[#7C6656] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#8C5D3B]" /> ML Feature Importances
                </h4>
                <div className="space-y-2.5 text-xs">
                  {Object.entries(data.ml_analysis.feature_importances).map(([feat, score], idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-[#5C483A]">{feat}</span>
                        <span className="text-[#8C5D3B] font-bold">{(score * 100).toFixed(1)}% weight</span>
                      </div>
                      <div className="w-full bg-[#E8DFC8] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#8C5D3B] rounded-full"
                          style={{ width: `${score * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Custom Communication Draft */}
            <div className="p-5 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-[#3D2E24] text-xs uppercase tracking-wider text-[#7C6656] flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-[#8C5D3B]" /> Personalized Recovery Message Draft
                </h4>
                <button
                  onClick={copyDraftMessage}
                  className="px-3 py-1 rounded-lg bg-[#EFE8DC] text-[#3D2E24] hover:bg-[#E8DFC8] border border-[#D8CBB5] text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  {copiedMsg ? <CheckCircle2 className="w-3.5 h-3.5 text-[#047857]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedMsg ? 'Copied!' : 'Copy Draft'}
                </button>
              </div>
              <div className="p-4 rounded-xl bg-[#F9F6F0] border border-[#D8CBB5] font-mono text-xs text-[#3D2E24] leading-relaxed whitespace-pre-wrap">
                {data.ai_message_draft}
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[#D8CBB5]">
              <div className="text-[11px] text-[#7C6656] font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#047857]" />
                Guardrails: Razorpay Test Mode • Max 3 Retries
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-[#EFE8DC] text-[#5C483A] hover:bg-[#E8DFC8] font-bold text-xs"
                >
                  Close
                </button>
                <button
                  onClick={handleExecute}
                  disabled={executing}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#8C5D3B] to-[#B4886B] text-white font-extrabold text-xs shadow-md shadow-[#8C5D3B]/20 hover:from-[#734A2C] hover:to-[#A3775B] flex items-center gap-2 cursor-pointer"
                >
                  {executing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Execute Action Now
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
