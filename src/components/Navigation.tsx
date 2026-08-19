/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, TrendingUp, Cpu, Award, User, Menu, X, Bell, Shield, 
  Settings, HelpCircle, BrainCircuit, Library, History, Sparkles, BookOpen,
  Briefcase, ArrowLeftRight, BarChart2
} from 'lucide-react';
import { useMainApp, useUpstoxStatus } from '../store';
import { BrandLogo } from './BrandLogo';
import { NativeTickerTape } from './StockChart';
import { SebiRiskModal } from './SebiRiskModal';

interface NavigationProps {
  currentTab: string;
  onNavigate: (tab: string, arg?: any) => void;
  children: React.ReactNode;
}

const MarketFeedBadge: React.FC<{ onNavigate: (tab: string) => void }> = React.memo(({ onNavigate }) => {
  const { upstoxStatus } = useUpstoxStatus();
  const { isMarketOpen } = useMainApp();

  const wsState = upstoxStatus.wsConnectionState || (upstoxStatus.connected ? 'CONNECTED' : 'DISCONNECTED');
  const isStale = !!upstoxStatus.isStale;

  let badgeStyle = 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-white/5 dark:border-white/5 dark:text-gray-300';
  let dotStyle = 'bg-slate-400';
  let labelText = 'MKT FEED: OFF';

  if (wsState === 'CONNECTING') {
    badgeStyle = 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400';
    dotStyle = 'bg-blue-500 animate-pulse';
    labelText = 'FEED: CONNECTING...';
  } else if (wsState === 'RECONNECTING') {
    badgeStyle = 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400';
    dotStyle = 'bg-amber-500 animate-pulse';
    labelText = 'FEED: RECONNECTING...';
  } else if (wsState === 'DISCONNECTED') {
    badgeStyle = 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400';
    dotStyle = 'bg-rose-500';
    labelText = 'FEED: DISCONNECTED';
  } else if (isStale) {
    badgeStyle = 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400';
    dotStyle = 'bg-yellow-500 animate-ping';
    labelText = 'FEED: STALE DATA';
  } else if (upstoxStatus.isRealUpstox) {
    badgeStyle = isMarketOpen ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400';
    dotStyle = isMarketOpen ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500';
    labelText = isMarketOpen ? 'PRO FEED: ACTIVE' : 'PRO FEED: CLOSED';
  } else {
    badgeStyle = isMarketOpen ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-white/5 dark:border-white/5 dark:text-gray-500';
    dotStyle = isMarketOpen ? 'bg-emerald-500' : 'bg-slate-400';
    labelText = isMarketOpen ? 'NSE / BSE LIVE' : 'MKT CLOSED';
  }

  return (
    <div 
      onClick={() => onNavigate('profile')}
      className={`cursor-pointer flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold font-mono transition-all shadow-sm hover:scale-[1.02] ${badgeStyle}`}
      title={`Live Market Feed State: ${wsState}${isStale ? ' (Stale ticks)' : ''}`}
    >
      <span className={`w-2 h-2 rounded-full ${dotStyle}`} />
      <span className="hidden sm:inline font-mono text-[10px] uppercase font-bold">
        {labelText}
      </span>
    </div>
  );
});

export const Navigation: React.FC<NavigationProps> = React.memo(({ currentTab, onNavigate, children }) => {
  const { user, notifications = [], theme, toggleTheme, isMarketOpen, enforceMarketHours, sebiFnoAccepted, confirmSebiRiskDisclosure } = useMainApp();
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
    React.startTransition(() => {
      onNavigate(tab);
    });
  }, [onNavigate, sebiFnoAccepted]);

  const handleConfirmSebi = React.useCallback(() => {
    confirmSebiRiskDisclosure();
    setShowSebiModal(false);
    const target = pendingTab || 'fno';
    setPendingTab(null);
    onNavigate(target);
  }, [confirmSebiRiskDisclosure, pendingTab, onNavigate]);

  if (!user) return null;

  const navItems = React.useMemo(() => [
    { key: 'dashboard', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { key: 'positions', label: 'Positions', icon: <Briefcase className="w-5 h-5" /> },
    { key: 'equity', label: 'Equity', icon: <TrendingUp className="w-5 h-5" /> },
    { key: 'fno', label: 'Future & Option', icon: <ArrowLeftRight className="w-5 h-5" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ], []);

  const drawerItems = React.useMemo(() => [
    { key: 'dashboard', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { key: 'analytics', label: 'Analytics', icon: <BarChart2 className="w-4 h-4" /> },
    { key: 'journal', label: 'AI Journal', icon: <Library className="w-4 h-4" /> },
    { key: 'ai-coach', label: 'AI Trade Coach', icon: <BrainCircuit className="w-4 h-4" /> },
    { key: 'strategy', label: 'Strategy Builder', icon: <Cpu className="w-4 h-4" /> },
    { key: 'risk-management', label: 'Risk Management', icon: <Shield className="w-4 h-4" /> },
    { key: 'academy', label: 'Academy (Learn)', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'profile', label: 'Subscription / Badges', icon: <Award className="w-4 h-4" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ], []);

  const sidebarItems = React.useMemo(() => 
    drawerItems.filter(item => item.key === 'settings' || !navItems.some(nav => nav.key === item.key)),
  [drawerItems, navItems]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060913] text-slate-800 dark:text-gray-100 flex flex-col md:flex-row">
      {/* 1. Permanent Left Sidebar on Desktop Viewports */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-white dark:bg-[#0c1020] border-r border-slate-200 dark:border-white/5 p-6 shrink-0 h-screen sticky top-0 overflow-y-auto scrollbar-none">
        <div className="space-y-6 flex-1 flex flex-col min-h-0">
          {/* Logo Brand Header */}
          <div className="flex items-center px-1">
            <BrandLogo size="md" />
          </div>

          {/* User Brief card */}
          <div className="bg-slate-50 dark:bg-[#12182d] border border-slate-200/60 dark:border-white/5 rounded-xl p-3 flex items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <span className="block text-xs font-bold text-slate-900 dark:text-white max-w-[120px] truncate">{user.name}</span>
              <div className="flex items-center gap-2">
                <span className="block text-[9px] text-slate-500 dark:text-gray-500 uppercase font-mono tracking-widest">Level {user.level}</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-500 font-bold font-mono shrink-0">🔥 {user.streak}d</span>
              </div>
            </div>
            <span className="bg-blue-600/10 dark:bg-sky-500/10 text-blue-600 dark:text-sky-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full">PRO</span>
          </div>

          {/* Nav list */}
          <nav className="space-y-1 overflow-y-auto pr-1 flex-1 scrollbar-none">
            {sidebarItems.map(item => {
              const isActive = currentTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600 dark:bg-sky-500/10 dark:text-sky-400 border-l-2 border-blue-600 dark:border-sky-500' 
                      : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/2'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer controls on desktop */}
        <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-white/5 text-xs text-slate-500 dark:text-gray-500">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between hover:text-slate-900 dark:hover:text-white transition"
          >
            <span>Active Theme</span>
            <span className="capitalize text-blue-600 dark:text-sky-400 font-bold">{theme}</span>
          </button>
          <div className="text-[10px] uppercase font-mono text-slate-400 dark:text-gray-600 tracking-widest">
            SIMULATED PLATFORM
          </div>
        </div>
      </aside>

      {/* 2. Responsive Content Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#060913]">
        <NativeTickerTape />
        {/* Top Header Row for desktop viewports */}
        <header className="hidden md:flex justify-between items-center bg-white dark:bg-[#0c1020] border-b border-slate-200 dark:border-white/5 px-8 py-4 sticky top-0 z-30 shadow-sm">
          {/* Left section: Tab label and sub-label (visible on large viewports) */}
          <div className="hidden lg:block shrink-0">
            <h1 className="text-xs font-extrabold text-slate-950 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-sky-400 animate-pulse" />
              {currentTab === 'dashboard' ? 'Active Trading Desk' : 
               currentTab === 'positions' ? 'Portfolio & Orders' : 
               currentTab === 'equity' ? 'Equity watchlists' :
               currentTab === 'fno' ? 'Future & Option Desk' :
               currentTab === 'analytics' ? 'Performance Analytics' :
               currentTab === 'journal' ? 'AI Trading Journal' :
               currentTab === 'ai-coach' ? 'AI Coach Insights' :
               currentTab === 'strategy' ? 'Advanced strategy builder' :
               currentTab === 'risk-management' ? 'Capital Protection & Sizing' :
               currentTab === 'academy' ? 'Academy learning suite' :
               currentTab === 'profile' ? 'Subscription / Badges' : 'Settings Workspace'}
            </h1>
            <p className="text-[9px] text-slate-500 dark:text-gray-400 font-sans mt-0.5 uppercase tracking-wide">
              Simulated Real-Time Paper Trading & Analytics
            </p>
          </div>

          {/* Center section: Desktop top navigation bar */}
          <nav className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200/40 dark:border-white/5 shadow-inner max-w-sm lg:max-w-md xl:max-w-xl overflow-x-auto shrink-0 scrollbar-none">
            {navItems.map(item => {
              const isActive = currentTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 shrink-0 ${
                    isActive
                      ? 'bg-white dark:bg-[#12182d] text-blue-600 dark:text-sky-400 shadow-sm border border-slate-200/20 dark:border-white/5 scale-[1.02]'
                      : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {React.cloneElement(item.icon as React.ReactElement, { className: 'w-3.5 h-3.5 shrink-0' })}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right section: Live Feed Badge, Balance, notifications, level indicators */}
          <div className="flex items-center gap-3">
            {/* Market Status Pill */}
            <MarketFeedBadge onNavigate={handleNavClick} />

            {/* Live Virtual Capital Badge */}
            <div className="flex flex-col items-end bg-slate-50 dark:bg-[#12182d] border border-slate-200/80 dark:border-white/5 rounded-xl px-3.5 py-1 shadow-sm">
              <span className="text-[8px] text-slate-500 dark:text-gray-500 uppercase tracking-widest font-mono font-bold">Virtual Capital</span>
              <span className="text-xs font-bold text-slate-950 dark:text-white font-mono mt-0.5">
                ₹{user.virtualBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Streak & Level Badges with consistent styling */}
            <div className="hidden lg:flex items-center gap-1.5 flex-nowrap">
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/15 px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-amber-700 dark:text-amber-500 font-mono shadow-sm whitespace-nowrap shrink-0">
                🔥 {user.streak} Days
              </div>
              <div className="flex items-center gap-1 bg-blue-500/10 dark:bg-sky-500/10 border border-blue-500/15 dark:border-sky-500/15 px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-blue-700 dark:text-sky-400 font-mono shadow-sm whitespace-nowrap shrink-0">
                Lvl {user.level}
              </div>
            </div>

            {/* Notification Indicator */}
            <button
              onClick={() => handleNavClick('settings')}
              className="relative p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-gray-400 hover:text-slate-950 dark:hover:text-white transition hover:scale-105"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Global Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-gray-400 hover:text-slate-950 dark:hover:text-white transition hover:scale-105"
              title="Toggle theme mode"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Top Header Row for mobile/tablet grids */}
        <header className="md:hidden flex justify-between items-center bg-white dark:bg-[#0c1020]/90  px-4 py-3.5 border-b border-slate-200 dark:border-white/5 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-1.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center ml-0.5">
              <BrandLogo size="sm" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
            {/* Streak Indicator */}
            <div className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/15 text-[10px] font-bold text-amber-700 dark:text-amber-500 font-mono shadow-sm whitespace-nowrap shrink-0">
              🔥 {user.streak} Days
            </div>
            {/* Level indicator */}
            <div className="bg-blue-500/10 dark:bg-sky-500/10 border border-blue-500/15 dark:border-sky-500/15 text-[10px] font-bold text-blue-700 dark:text-sky-400 px-2.5 py-1.5 rounded-xl font-mono shadow-sm whitespace-nowrap shrink-0">
              Lvl {user.level}
            </div>
          </div>
        </header>

        {/* Main interactive window viewport frame */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
          {children}
        </main>

        {/* 3. Bottom Navigation bar on Mobile Viewports */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0c1020]/95 border-t border-slate-200 dark:border-white/5  px-1 py-2 pb-safe flex justify-around items-center z-40 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
          {navItems.map(item => {
            const isActive = currentTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition ${
                  isActive ? 'text-blue-600 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
                }`}
                style={{ touchAction: 'manipulation' }}
              >
                <div className={`${isActive ? 'scale-110 text-blue-600 dark:text-sky-400' : ''} transition-transform`}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold tracking-wide font-sans">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 4. Slide-out Navigation Drawer on Mobile (accessible via hamburger) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop opacity */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 cursor-pointer"
            />

            {/* Drawer Sliding body */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-80 max-w-[85vw] bg-white dark:bg-[#0c1020] border-r border-slate-200 dark:border-white/10 h-full p-5 flex flex-col justify-between shadow-2xl overflow-y-auto transform-gpu z-50"
            >
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <BrandLogo size="sm" />
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-[#12182d] border border-slate-200 dark:border-white/5 rounded-xl p-3 flex items-center justify-between shadow-sm">
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-slate-900 dark:text-white max-w-[140px] truncate">{user.name}</span>
                    <span className="block text-[9px] text-slate-500 dark:text-gray-500 font-mono">Level {user.level} • ₹{user.virtualBalance.toLocaleString('en-IN')}</span>
                  </div>
                  <span className="bg-blue-600/10 dark:bg-sky-500/10 text-blue-600 dark:text-sky-400 text-[9px] font-bold px-2 py-0.5 rounded-full">PRO</span>
                </div>

                {/* Drawer list */}
                <nav className="space-y-1 overflow-y-auto pr-1 flex-1 scrollbar-none max-h-[calc(100vh-230px)]">
                  {drawerItems.map(item => {
                    const isActive = currentTab === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleNavClick(item.key)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                          isActive 
                            ? 'bg-blue-50 text-blue-600 dark:bg-sky-500/10 dark:text-sky-400 font-bold border-l-2 border-blue-600 dark:border-sky-500' 
                            : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer footer */}
              <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-white/5 text-xs text-slate-500 dark:text-gray-500">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between hover:text-slate-900 dark:hover:text-white transition"
                >
                  <span>Toggle Visual Mode</span>
                  <span className="capitalize text-blue-600 dark:text-sky-400 font-bold">{theme}</span>
                </button>
                <div className="text-[10px] uppercase font-mono text-slate-400 dark:text-gray-600 tracking-widest text-center">
                  SIMULATED PLATFORM • NO RISK
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SebiRiskModal
        isOpen={showSebiModal || (currentTab === 'fno' && !sebiFnoAccepted)}
        onConfirm={handleConfirmSebi}
      />
    </div>
  );
});
