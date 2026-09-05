import React from 'react';
import { RefreshCw, Zap, PlayCircle } from 'lucide-react';
import { TabType } from '../types';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing
}) => {
  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Executive Revenue Dashboard';
      case 'queue': return 'AI Recovery Queue';
      case 'transactions': return 'Transaction History & AI Audits';
      case 'customers': return 'Customer LTV & Churn Intelligence';
      case 'analytics': return 'Recovery Performance Analytics';
      case 'command_center': return 'AI Command Center (Natural Language SQL)';
      case 'simulation': return 'Autonomous Agent Recovery Simulation';
      case 'audit_logs': return 'AI Agent Audit Trail';
      case 'settings': return 'AI Guardrails & System Configuration';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="h-20 bg-[#F9F6F0]/90 backdrop-blur-md border-b border-[#D8CBB5] px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div>
        <h2 className="text-xl font-extrabold text-[#3D2E24] tracking-tight">{getTitle()}</h2>
        <p className="text-xs text-[#7C6656] font-medium">
          Razorpay AI Buildathon • Autonomous Payment Recovery Engine
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Gateway Indicator */}
        <div className="px-3.5 py-1.5 rounded-xl bg-[#E8DFC8] border border-[#D8CBB5] flex items-center gap-2 text-xs font-semibold text-[#5C483A]">
          <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span>
          Gateway: <span className="text-[#047857] font-bold">Razorpay Test Mode</span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          className="p-2.5 rounded-xl bg-[#EFE8DC] border border-[#D8CBB5] text-[#5C483A] hover:text-[#3D2E24] hover:bg-[#E8DFC8] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#8C5D3B]' : ''}`} />
          Refresh
        </button>

        {/* Run Simulation CTA */}
        <button
          onClick={() => setActiveTab('simulation')}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8C5D3B] to-[#B4886B] text-white font-extrabold text-xs shadow-md shadow-[#8C5D3B]/20 hover:from-[#734A2C] hover:to-[#A3775B] transition-all flex items-center gap-2 cursor-pointer"
        >
          <PlayCircle className="w-4 h-4 fill-white/20" />
          Run Recovery Simulation
        </button>
      </div>
    </header>
  );
};
