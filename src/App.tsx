/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, Component, ErrorInfo, ReactNode, startTransition } from 'react';
import { AppProvider, useMainApp } from './store';
import { Navigation } from './components/Navigation';
import { AuthAndOnboarding } from './components/AuthAndOnboarding';
import { Dashboard } from './components/Dashboard';
import { Markets } from './components/Markets';
import { TradeScreen } from './components/TradeScreen';
import { PositionsList } from './components/PositionsList';
import { Journal } from './components/Journal';
import { AICoach } from './components/AICoach';
import { StrategyBuilder } from './components/StrategyBuilder';
import { Academy } from './components/Academy';
import { Profile } from './components/Profile';
import { Analytics } from './components/Analytics';
import { RiskManagement } from './components/RiskManagement';
import { Position } from './types';

interface TabPanelProps {
  active: boolean;
  children: React.ReactNode;
}

const TabPanel = React.memo<TabPanelProps>(({ active, children }) => {
  const lastActiveChildrenRef = React.useRef(children);
  if (active) {
    lastActiveChildrenRef.current = children;
  }

  return (
    <div style={{ display: active ? 'block' : 'none' }}>
      {active ? children : lastActiveChildrenRef.current}
    </div>
  );
});

function MainAppCoordinator() {
  const { user, isAuthLoading, logoutUser } = useMainApp();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set(['dashboard']));
  const [journalPosition, setJournalPosition] = useState<Position | null>(null);

  const handleNavigate = useCallback((tab: string) => {
    setVisitedTabs(prev => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
    setCurrentTab(tab);
  }, []);

  React.useEffect(() => {
    const handleNavigateEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        handleNavigate(customEvent.detail);
      }
    };
    window.addEventListener('navigate_tab', handleNavigateEvent);
    return () => {
      window.removeEventListener('navigate_tab', handleNavigateEvent);
    };
  }, [handleNavigate]);

  const handleJournalShortcut = useCallback((pos: Position) => {
    setJournalPosition(pos);
    handleNavigate('journal');
  }, [handleNavigate]);

  const handleClearPreselected = useCallback(() => {
    setJournalPosition(null);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Error logging out:", err);
    }
    handleNavigate('dashboard');
  }, [logoutUser, handleNavigate]);

  const handleTradeSuccess = useCallback(() => {
    handleNavigate('positions');
  }, [handleNavigate]);

  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 bg-[#060913] flex flex-col items-center justify-center text-white z-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1">
            Loading secure ledger...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthAndOnboarding onComplete={() => {}} />;
  }

  return (
    <Navigation currentTab={currentTab} onNavigate={handleNavigate}>
      {visitedTabs.has('dashboard') && (
        <TabPanel active={currentTab === 'dashboard'}>
          <Dashboard onNavigate={handleNavigate} />
        </TabPanel>
      )}
      {visitedTabs.has('equity') && (
        <TabPanel active={currentTab === 'equity'}>
          <Markets mode="equity" onNavigate={handleNavigate} />
        </TabPanel>
      )}
      {visitedTabs.has('fno') && (
        <TabPanel active={currentTab === 'fno'}>
          <Markets mode="fno" onNavigate={handleNavigate} />
        </TabPanel>
      )}
      {visitedTabs.has('trade') && (
        <TabPanel active={currentTab === 'trade'}>
          <TradeScreen onSuccess={handleTradeSuccess} />
        </TabPanel>
      )}
      {visitedTabs.has('positions') && (
        <TabPanel active={currentTab === 'positions'}>
          <PositionsList onJournalShortcut={handleJournalShortcut} />
        </TabPanel>
      )}
      {visitedTabs.has('analytics') && (
        <TabPanel active={currentTab === 'analytics'}>
          <Analytics />
        </TabPanel>
      )}
      {visitedTabs.has('journal') && (
        <TabPanel active={currentTab === 'journal'}>
          <Journal
            preselectedPosition={journalPosition}
            onClearPreselected={handleClearPreselected}
          />
        </TabPanel>
      )}
      {visitedTabs.has('ai-coach') && (
        <TabPanel active={currentTab === 'ai-coach'}>
          <AICoach />
        </TabPanel>
      )}
      {visitedTabs.has('strategy') && (
        <TabPanel active={currentTab === 'strategy'}>
          <StrategyBuilder />
        </TabPanel>
      )}
      {visitedTabs.has('risk-management') && (
        <TabPanel active={currentTab === 'risk-management'}>
          <RiskManagement />
        </TabPanel>
      )}
      {visitedTabs.has('academy') && (
        <TabPanel active={currentTab === 'academy'}>
          <Academy />
        </TabPanel>
      )}
      {visitedTabs.has('profile') && (
        <TabPanel active={currentTab === 'profile'}>
          <Profile onLogout={handleLogout} initialSubTab="stats" />
        </TabPanel>
      )}
      {visitedTabs.has('settings') && (
        <TabPanel active={currentTab === 'settings'}>
          <Profile onLogout={handleLogout} initialSubTab="settings" />
        </TabPanel>
      )}
    </Navigation>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  props: ErrorBoundaryProps;
  state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App Error Boundary caught error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="text-xs text-slate-400">
              An unexpected error occurred. You can reload the application or reset local cache to recover.
            </p>
            {this.state.error && (
              <div className="p-3 bg-slate-950 rounded-xl text-left text-[10px] font-mono text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition"
              >
                Reload App
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl transition"
              >
                Reset Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainAppCoordinator />
      </AppProvider>
    </ErrorBoundary>
  );
}
