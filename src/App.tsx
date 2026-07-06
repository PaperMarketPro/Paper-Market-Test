/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './store';
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
import { Position } from './types';

function MainAppCoordinator() {
  const { user, isAuthLoading, logoutUser } = useApp();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [journalPosition, setJournalPosition] = useState<Position | null>(null);

  const handleJournalShortcut = (pos: Position) => {
    setJournalPosition(pos);
    setCurrentTab('journal');
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Error logging out:", err);
    }
    setCurrentTab('dashboard');
  };

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
    <Navigation currentTab={currentTab} onNavigate={setCurrentTab}>
      {currentTab === 'dashboard' && (
        <Dashboard onNavigate={setCurrentTab} />
      )}
      {currentTab === 'equity' && (
        <Markets mode="equity" onNavigate={setCurrentTab} />
      )}
      {currentTab === 'fno' && (
        <Markets mode="fno" onNavigate={setCurrentTab} />
      )}
      {currentTab === 'trade' && (
        <TradeScreen onSuccess={() => setCurrentTab('positions')} />
      )}
      {currentTab === 'positions' && (
        <PositionsList onJournalShortcut={handleJournalShortcut} />
      )}
      {currentTab === 'journal' && (
        <Journal
          preselectedPosition={journalPosition}
          onClearPreselected={() => setJournalPosition(null)}
        />
      )}
      {currentTab === 'ai-coach' && (
        <AICoach />
      )}
      {currentTab === 'strategy' && (
        <StrategyBuilder />
      )}
      {currentTab === 'academy' && (
        <Academy />
      )}
      {currentTab === 'profile' && (
        <Profile onLogout={handleLogout} />
      )}
    </Navigation>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppCoordinator />
    </AppProvider>
  );
}
