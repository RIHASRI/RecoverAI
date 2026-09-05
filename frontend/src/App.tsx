import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TransactionModal } from './components/TransactionModal';
import { Dashboard } from './pages/Dashboard';
import { RecoveryQueue } from './pages/RecoveryQueue';
import { Transactions } from './pages/Transactions';
import { Customers } from './pages/Customers';
import { Analytics } from './pages/Analytics';
import { AICommandCenter } from './pages/AICommandCenter';
import { Simulation } from './pages/Simulation';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';
import { TabType, DashboardMetrics, Transaction } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [queue, setQueue] = useState<Transaction[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);
  const [loadingQueue, setLoadingQueue] = useState<boolean>(true);
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);

  const fetchMetrics = () => {
    setLoadingMetrics(true);
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data);
        setLoadingMetrics(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingMetrics(false);
      });
  };

  const fetchQueue = () => {
    setLoadingQueue(true);
    fetch('/api/queue')
      .then((res) => res.json())
      .then((data) => {
        setQueue(data);
        setLoadingQueue(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingQueue(false);
      });
  };

  const refreshAll = () => {
    fetchMetrics();
    fetchQueue();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const handleApprove = (id: string) => {
    return fetch(`/api/queue/${id}/approve`, { method: 'POST' })
      .then(() => refreshAll());
  };

  const handleExecute = (id: string) => {
    return fetch(`/api/queue/${id}/execute`, { method: 'POST' })
      .then(() => refreshAll());
  };

  const handleEscalate = (id: string) => {
    return fetch(`/api/queue/${id}/escalate`, { method: 'POST' })
      .then(() => refreshAll());
  };

  const handleStop = (id: string) => {
    return fetch(`/api/queue/${id}/stop`, { method: 'POST' })
      .then(() => refreshAll());
  };

  const pendingApprovalsCount = queue.filter((i) => i.requires_human_approval).length;

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#3D2E24] flex font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingApprovalCount={pendingApprovalsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onRefresh={refreshAll}
          isRefreshing={loadingMetrics || loadingQueue}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              metrics={metrics}
              queue={queue}
              loading={loadingMetrics || loadingQueue}
              onSelectTransaction={setSelectedTxnId}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'queue' && (
            <RecoveryQueue
              queue={queue}
              loading={loadingQueue}
              onRefresh={refreshAll}
              onSelectTransaction={setSelectedTxnId}
              onApprove={handleApprove}
              onExecute={handleExecute}
              onEscalate={handleEscalate}
              onStop={handleStop}
            />
          )}

          {activeTab === 'transactions' && (
            <Transactions onSelectTransaction={setSelectedTxnId} />
          )}

          {activeTab === 'customers' && (
            <Customers />
          )}

          {activeTab === 'analytics' && (
            <Analytics />
          )}

          {activeTab === 'command_center' && (
            <AICommandCenter onSelectTransaction={setSelectedTxnId} />
          )}

          {activeTab === 'simulation' && (
            <Simulation onRefreshMetrics={refreshAll} metrics={metrics} />
          )}

          {activeTab === 'audit_logs' && (
            <AuditLogs />
          )}

          {activeTab === 'settings' && (
            <Settings />
          )}
        </main>
      </div>

      {/* Transaction Details Analysis Modal */}
      <TransactionModal
        transactionId={selectedTxnId}
        onClose={() => setSelectedTxnId(null)}
        onExecuteRetry={handleExecute}
      />
    </div>
  );
}
export default App;
