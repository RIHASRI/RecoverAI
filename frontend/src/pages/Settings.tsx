import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, ShieldCheck, RefreshCw, Save, CheckCircle2 } from 'lucide-react';
import { SystemSettings } from '../types';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = () => {
    if (!settings) return;
    setSaving(true);
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
      .then((res) => res.json())
      .then(() => {
        setSaving(false);
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 3000);
      })
      .catch((err) => {
        console.error(err);
        setSaving(false);
      });
  };

  if (loading || !settings) {
    return (
      <div className="p-12 text-center text-[#7C6656] flex flex-col items-center justify-center gap-3 min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#8C5D3B]" />
        <span>Loading Guardrail System Settings...</span>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h3 className="text-xl font-extrabold text-[#3D2E24] tracking-tight">AI Guardrails & System Configuration</h3>
        <p className="text-xs text-[#7C6656]">Configure retry caps, human approval thresholds, and Razorpay test mode settings</p>
      </div>

      <div className="p-6 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] space-y-6 shadow-xs">
        {/* Guardrail 1: Max Retries */}
        <div className="space-y-2 border-b border-[#D8CBB5] pb-5">
          <label className="text-sm font-bold text-[#3D2E24] block">Maximum Automated Retry Attempts</label>
          <p className="text-xs text-[#7C6656]">Hard stop guardrail preventing fatigue or gateway penalties. Default: 3 retries.</p>
          <input
            type="number"
            min={1}
            max={5}
            value={settings.max_retries}
            onChange={(e) => setSettings({ ...settings, max_retries: parseInt(e.target.value) || 3 })}
            className="w-48 bg-[#F9F6F0] border border-[#D8CBB5] rounded-xl px-4 py-2 text-xs text-[#3D2E24] focus:outline-none focus:border-[#8C5D3B]/50 font-semibold"
          />
        </div>

        {/* Guardrail 2: High Value Threshold */}
        <div className="space-y-2 border-b border-[#D8CBB5] pb-5">
          <label className="text-sm font-bold text-[#3D2E24] block">High-Value Human Approval Threshold (₹)</label>
          <p className="text-xs text-[#7C6656]">
            Transactions exceeding this amount require explicit human approval before execution. Default: ₹10,000.
          </p>
          <input
            type="number"
            step={1000}
            value={settings.high_value_threshold}
            onChange={(e) => setSettings({ ...settings, high_value_threshold: parseFloat(e.target.value) || 10000 })}
            className="w-48 bg-[#F9F6F0] border border-[#D8CBB5] rounded-xl px-4 py-2 text-xs text-[#3D2E24] focus:outline-none focus:border-[#8C5D3B]/50 font-semibold"
          />
        </div>

        {/* Guardrail 3: Auto Retry Toggle */}
        <div className="flex items-center justify-between border-b border-[#D8CBB5] pb-5">
          <div>
            <label className="text-sm font-bold text-[#3D2E24] block">Autonomous AI Execution Active</label>
            <p className="text-xs text-[#7C6656]">Allow AI Agent to automatically trigger retries when probability exceeds 60%.</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, auto_retry_enabled: !settings.auto_retry_enabled })}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.auto_retry_enabled ? 'bg-[#047857]' : 'bg-[#D8CBB5]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.auto_retry_enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Payment Provider Settings */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-[#3D2E24] block">Payment Provider Mode</label>
          <div className="p-3 rounded-xl bg-[#F9F6F0] border border-[#D8CBB5] text-xs text-[#047857] font-bold flex items-center justify-between">
            <span>Razorpay Test Gateway (Mock Adapter)</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#047857]/15 text-[#047857] border border-[#047857]/30 text-[10px]">
              TEST_MODE_ACTIVE
            </span>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          {successMsg ? (
            <span className="text-xs text-[#047857] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> System Settings Updated Successfully!
            </span>
          ) : (
            <span />
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#8C5D3B] to-[#B4886B] text-white font-extrabold text-xs shadow-md shadow-[#8C5D3B]/20 hover:from-[#734A2C] hover:to-[#A3775B] flex items-center gap-2 cursor-pointer"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Guardrail Configurations
          </button>
        </div>
      </div>
    </div>
  );
};
