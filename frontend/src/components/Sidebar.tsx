import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Receipt, 
  Users, 
  BarChart3, 
  Bot, 
  PlayCircle, 
  FileText, 
  Settings,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { TabType } from '../types';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  pendingApprovalCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, pendingApprovalCount = 0 }) => {
  const navItems: { id: TabType; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'queue', label: 'AI Recovery Queue', icon: Layers, badge: pendingApprovalCount },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'command_center', label: 'AI Command Center', icon: Bot },
    { id: 'simulation', label: 'Simulation', icon: PlayCircle },
    { id: 'audit_logs', label: 'Audit Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#EFE8DC] border-r border-[#D8CBB5] flex flex-col justify-between h-screen sticky top-0 z-30 shadow-md">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#D8CBB5] bg-[#E8DFC8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#B4886B] to-[#8C5D3B] p-0.5 shadow-md shadow-[#B4886B]/20">
              <div className="w-full h-full bg-[#F9F6F0] rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#8C5D3B] fill-[#8C5D3B]" />
              </div>
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight text-[#3D2E24] flex items-center gap-1.5">
                Recover<span className="text-[#8C5D3B]">AI</span>
              </h1>
              <span className="text-[10px] font-bold text-[#7C6656] uppercase tracking-wider block">
                Sandalwood Edition
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-[#E2D6C3] text-[#6B4423] border border-[#B4886B]/40 shadow-sm font-bold'
                    : 'text-[#6B5C52] hover:text-[#3D2E24] hover:bg-[#E8DFC8]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#8C5D3B]' : 'text-[#7C6656]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 ? (
                  <span className="bg-[#D97706]/15 text-[#B45309] text-xs font-extrabold px-2 py-0.5 rounded-full border border-[#D97706]/30 animate-pulse">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* AI Agent Guardrail Active Footer */}
      <div className="p-4 m-4 rounded-xl bg-[#E2D6C3] border border-[#B4886B]/30 shadow-sm">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="relative">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669] block animate-ping absolute inset-0"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669] block"></span>
          </div>
          <span className="text-xs font-extrabold text-[#047857] uppercase tracking-wide flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Agent Guardrails Active
          </span>
        </div>
        <p className="text-[11px] text-[#6B5C52] leading-relaxed font-medium">
          Enforcing max 3 retries & high-value approval limit (₹10,000).
        </p>
      </div>
    </aside>
  );
};
