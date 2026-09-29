/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, TrendingUp, Cpu, Award, Menu, X, Bell, Shield, 
  Settings, BrainCircuit, Library, Sparkles, BookOpen,
  Briefcase, ArrowLeftRight, BarChart2
} from 'lucide-react';
import { useMainApp } from '../store';
import { BrandLogo } from './BrandLogo';
import { SebiRiskModal } from './SebiRiskModal';

interface NavigationProps {
  currentTab: string;
  onNavigate: (tab: string, arg?: any) => void;
  children: React.ReactNode;
}

export const Navigation: React.FC<NavigationProps> = React.memo(({ currentTab, onNavigate, children }) => {
  const { user, notifications = [], theme, toggleTheme, sebiFnoAccepted, confirmSebiRiskDisclosure } = useMainApp();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showSebiModal, setShowSebiModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const unreadNotifCount = React.useMemo(() => (notifications || []).filter(n => !n.isRead).length, [notifications]);

  const handleNavClick = React.useCallback((tab: string) => {
    if (tab === 'fno' && !sebiFnoAccepted) {
      setPendingTab('fno');
      setShowSebiModal(true);
      setIsDrawerOpen(false);
      return;
    }
    setIsDrawerOpen(false);
    onNavigate(tab);
  }, [onNavigate, sebiFnoAccepted]);

  const handleConfirmSebi = React.useCallback(() => {
    confirmSebiRiskDisclosure();
    setShowSebiModal(false);
    const target = pendingTab;
    setPendingTab(null);
    if (target) {
      onNavigate(target);
    }
  }, [confirmSebiRiskDisclosure, pendingTab, onNavigate]);

  // Mobile bottom navigation tabs (5 core tabs)
  const mobileNavItems = React.useMemo(() => [
    { key: 'dashboard', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { key: 'positions', label: 'Positions', icon: <Briefcase className="w-5 h-5" /> },
    { key: 'equity', label: 'Equity', icon: <TrendingUp className="w-5 h-5" /> },
    { key: 'fno', label: 'F&O', icon: <ArrowLeftRight className="w-5 h-5" /> },
    { key: 'academy', label: 'Academy', icon: <BookOpen className="w-5 h-5" /> },
  ], []);

  const sidebarGroups = React.useMemo(() => [
    {
      title: 'TRADING',
      items: [
        { key: 'dashboard', label: 'Dashboard', icon: <Home className="w-4 h-4" /> },
        { key: 'positions', label: 'Positions & Orders', icon: <Briefcase className="w-4 h-4" /> },
        { key: 'equity', label: 'Stocks Watchlist', icon: <TrendingUp className="w-4 h-4" /> },
        { key: 'fno', label: 'Futures & Options', icon: <ArrowLeftRight className="w-4 h-4" /> },
      ]
    },
    {
      title: 'ANALYSIS & AI',
      items: [
        { key: 'analytics', label: 'Analytics', icon: <BarChart2 className="w-4 h-4" /> },
        { key: 'journal', label: 'Trade Journal', icon: <Library className="w-4 h-4" /> },
        { key: 'ai-coach', label: 'AI Coach', icon: <BrainCircuit className="w-4 h-4" /> },
        { key: 'strategy', label: 'Strategy Lab', icon: <Cpu className="w-4 h-4" /> },
      ]
    },
    {
      title: 'LEARN & ACCOUNT',
      items: [
        { key: 'academy', label: 'Academy', icon: <BookOpen className="w-4 h-4" /> },
        { key: 'risk-management', label: 'Risk Calculator', icon: <Shield className="w-4 h-4" /> },
        { key: 'profile', label: 'Profile & Settings', icon: <Award className="w-4 h-4" /> },
      ]
    }
  ], []);

  const currentTabTitle: Record<string, string> = {
    dashboard: 'Trading Dashboard',
    positions: 'Positions & Orders',
    equity: 'Stocks Watchlist',
    fno: 'Futures & Options',
    analytics: 'Performance Analytics',
    journal: 'Trade Journal',
    'ai-coach': 'AI Trading Coach',
    strategy: 'Strategy Lab',
    'risk-management': 'Risk & Sizing Calculator',
    academy: 'Trading Academy',
    profile: 'Account & Settings',
    settings: 'Account & Settings',
    trade: 'Order Execution'
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060913] text-slate-800 dark:text-gray-100 flex flex-col md:flex-row">
      {/* 1. Left Sidebar on Desktop Viewports */}
      <aside className="hidden md:flex flex-col justify-between w-60 lg:w-64 bg-white dark:bg-[#0c1020] border-r border-slate-200 dark:border-white/5 p-5 shrink-0 h-screen sticky top-0 overflow-y-auto scrollbar-none">
        <div className="space-y-5 flex-1 flex flex-col min-h-0">
          <div className="flex items-center px-1">
            <BrandLogo size="md" />
          </div>

          {/* Nav list */}
          <nav className="space-y-5 overflow-y-auto pr-1 flex-1 scrollbar-none">
            {sidebarGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                <span className="block px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-gray-500 font-bold mb-1">
                  {group.title}
                </span>
                {group.items.map(item => {
                  const isActive = currentTab === item.key || (item.key === 'profile' && currentTab === 'settings');
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleNavClick(item.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-blue-50 text-blue-600 dark:bg-sky-500/10 dark:text-sky-400 font-bold border-l-2 border-blue-600 dark:border-sky-500' 
                          : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* User Footer Card */}
        <div className="pt-4 border-t border-slate-200 dark:border-white/5">
          <button
            onClick={() => handleNavClick('profile')}
            className="w-full bg-slate-50 dark:bg-[#12182d] hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/60 dark:border-white/5 rounded-xl p-3 flex items-center justify-between transition cursor-pointer text-left"
          >
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</span>
              <span className="block text-[10px] text-slate-500 dark:text-gray-400 font-mono">
                Lvl {user.level} • 🔥 {user.streak}d
              </span>
            </div>
            <Settings className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>
      </aside>

      {/* 2. Main Responsive Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#060913]">
        {/* Clean Desktop Top Header */}
        <header className="hidden md:flex justify-between items-center bg-white dark:bg-[#0c1020] border-b border-slate-200 dark:border-white/5 px-6 lg:px-8 py-3.5 sticky top-0 z-30">
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">
              {currentTabTitle[currentTab] || 'Trading Workspace'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Virtual Capital Pill */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#12182d] border border-slate-200/80 dark:border-white/5 rounded-xl px-3.5 py-1.5">
              <span className="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-mono">Virtual Capital</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                ₹{user.virtualBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>

            {/* Notifications */}
            <button
              onClick={() => onNavigate('profile', 'notifications')}
              className="relative p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="Toggle theme"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile/Tablet Top Header */}
        <header className="md:hidden flex justify-between items-center bg-white dark:bg-[#0c1020] px-3.5 py-3 border-b border-slate-200 dark:border-white/5 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 text-slate-600 dark:text-gray-300"
              aria-label="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <BrandLogo size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-50 dark:bg-[#12182d] border border-slate-200 dark:border-white/5 rounded-xl px-2.5 py-1 text-right">
              <span className="text-[8px] text-slate-400 uppercase font-mono block leading-none">Capital</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                ₹{(user.virtualBalance / 1000).toFixed(0)}k
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-gray-400"
              aria-label="Toggle theme"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>

        {/* 3. Mobile Bottom Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0c1020] border-t border-slate-200 dark:border-white/5 px-1 py-1.5 pb-safe flex justify-around items-center z-40">
          {mobileNavItems.map(item => {
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 min-h-[44px] rounded-xl transition ${
                  isActive ? 'text-blue-600 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-gray-400'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 4. Mobile Slide-out Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.2 }}
              className="relative w-72 max-w-[82vw] bg-white dark:bg-[#0c1020] border-r border-slate-200 dark:border-white/10 h-full p-5 flex flex-col justify-between shadow-2xl overflow-y-auto z-50"
            >
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <BrandLogo size="sm" />
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-500 dark:text-gray-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-[#12182d] border border-slate-200 dark:border-white/5 rounded-xl p-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</span>
                    <span className="block text-[10px] text-slate-500 dark:text-gray-400 font-mono">
                      Lvl {user.level} • ₹{user.virtualBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <nav className="space-y-4">
                  {sidebarGroups.map((group, groupIdx) => (
                    <div key={groupIdx} className="space-y-1">
                      <span className="block px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-gray-500 font-bold mb-1">
                        {group.title}
                      </span>
                      {group.items.map(item => {
                        const isActive = currentTab === item.key;
                        return (
                          <button
                            key={item.key}
                            onClick={() => handleNavClick(item.key)}
                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                              isActive 
                                ? 'bg-blue-50 text-blue-600 dark:bg-sky-500/10 dark:text-sky-400 font-bold border-l-2 border-blue-600 dark:border-sky-500' 
                                : 'text-slate-600 dark:text-gray-300'
                            }`}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </nav>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SebiRiskModal
        isOpen={showSebiModal}
        onConfirm={handleConfirmSebi}
      />
    </div>
  );
});
