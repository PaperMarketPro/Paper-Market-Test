/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, TrendingUp, Cpu, Award, User, Menu, X, Bell, Shield, 
  Settings, HelpCircle, BrainCircuit, Library, History, Sparkles, BookOpen,
  Briefcase, ArrowLeftRight
} from 'lucide-react';
import { useApp } from '../store';
import { BrandLogo } from './BrandLogo';

interface NavigationProps {
  currentTab: string;
  onNavigate: (tab: string, arg?: any) => void;
  children: React.ReactNode;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onNavigate, children }) => {
  const { user, notifications, theme, toggleTheme } = useApp();
  if (!user) return null;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const unreadNotifCount = notifications.filter(n => !n.isRead).length;

  const handleNavClick = (tab: string) => {
    onNavigate(tab);
    setIsDrawerOpen(false);
  };

  const navItems = [
    { key: 'dashboard', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { key: 'positions', label: 'Positions', icon: <Briefcase className="w-5 h-5" /> },
    { key: 'equity', label: 'Equity', icon: <TrendingUp className="w-5 h-5" /> },
    { key: 'fno', label: 'F&O', icon: <ArrowLeftRight className="w-5 h-5" /> },
    { key: 'academy', label: 'Learn', icon: <BookOpen className="w-5 h-5" /> },
    { key: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  const drawerItems = [
    { key: 'dashboard', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { key: 'positions', label: 'Positions & Orders', icon: <Briefcase className="w-4 h-4" /> },
    { key: 'equity', label: 'Equity Watchlists', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'fno', label: 'F&O Option Chain', icon: <ArrowLeftRight className="w-4 h-4" /> },
    { key: 'journal', label: 'AI Journal', icon: <Library className="w-4 h-4" /> },
    { key: 'ai-coach', label: 'AI Trade Coach', icon: <BrainCircuit className="w-4 h-4" /> },
    { key: 'strategy', label: 'Strategy Builder', icon: <Cpu className="w-4 h-4" /> },
    { key: 'academy', label: 'Academy (Learn)', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'profile', label: 'Subscription / Badges', icon: <Award className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#060913] text-gray-100 flex flex-col lg:flex-row">
      {/* 1. Permanent Left Sidebar on Desktop Viewports */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-[#0c1020] border-r border-white/5 p-6 shrink-0">
        <div className="space-y-6">
          {/* Logo Brand Header */}
          <div className="flex items-center px-1">
            <BrandLogo size="md" />
          </div>

          {/* User Brief card */}
          <div className="bg-[#12182d] border border-white/5 rounded-xl p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="block text-xs font-bold text-white max-w-[120px] truncate">{user.name}</span>
              <span className="block text-[9px] text-gray-500 uppercase font-mono tracking-widest">Level {user.level}</span>
            </div>
            <span className="bg-sky-500/10 text-sky-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full">PRO</span>
          </div>

          {/* Nav list */}
          <nav className="space-y-1">
            {drawerItems.map(item => {
              const isActive = currentTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive 
                      ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-500' 
                      : 'text-gray-400 hover:text-white hover:bg-white/2'
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
        <div className="space-y-4 pt-6 border-t border-white/5 text-xs text-gray-500">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between hover:text-white transition"
          >
            <span>Active Theme</span>
            <span className="capitalize text-sky-400 font-bold">{theme}</span>
          </button>
          <div className="text-[10px] uppercase font-mono text-gray-600 tracking-widest">
            SIMULATED PLATFORM
          </div>
        </div>
      </aside>

      {/* 2. Responsive Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Row for mobile/tablet grids */}
        <header className="lg:hidden flex justify-between items-center bg-[#0c1020]/90 backdrop-blur-md px-3 py-3 border-b border-white/5 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-1.5 bg-white/5 rounded-xl border border-white/5 text-gray-400 hover:text-white transition"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center ml-0.5">
              <BrandLogo size="sm" />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Streak Indicator */}
            <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1.5 rounded-xl border border-amber-500/15 text-[10px] font-bold text-amber-500 font-mono">
              🔥 {user.streak} Days
            </div>
            {/* Level indicator */}
            <div className="bg-[#12182d] border border-white/5 text-[10px] font-bold text-sky-400 px-2.5 py-1.5 rounded-xl font-mono">
              Lvl {user.level}
            </div>
          </div>
        </header>

        {/* Main interactive window viewport frame */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full">
          {children}
        </main>

        {/* 3. Bottom Navigation bar on Mobile Viewports */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0c1020]/95 border-t border-white/5 backdrop-blur-xl px-1 py-1.5 flex justify-around items-center z-40 shadow-2xl">
          {navItems.map(item => {
            const isActive = currentTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition ${
                  isActive ? 'text-sky-400' : 'text-gray-500 hover:text-gray-300'
                }`}
                style={{ touchAction: 'manipulation' }}
              >
                <div className={`${isActive ? 'scale-105' : ''} transition-transform`}>
                  {item.icon}
                </div>
                <span className="text-[9px] font-medium tracking-wide font-sans">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 4. Slide-out Navigation Drawer on Mobile (accessible via hamburger) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop opacity */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer Sliding body */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-72 max-w-sm bg-[#0c1020] border-r border-white/10 h-full p-6 flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <BrandLogo size="sm" />
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 bg-white/5 rounded-xl border border-white/5 text-gray-400 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-[#12182d] border border-white/5 rounded-xl p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-white max-w-[120px] truncate">{user.name}</span>
                    <span className="block text-[8px] text-gray-500 font-mono">Level {user.level} sandbox account</span>
                  </div>
                  <span className="bg-sky-500/10 text-sky-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full">PRO</span>
                </div>

                {/* Drawer list */}
                <nav className="space-y-1">
                  {drawerItems.map(item => {
                    const isActive = currentTab === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleNavClick(item.key)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                          isActive 
                            ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-500' 
                            : 'text-gray-400 hover:text-white hover:bg-white/2'
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
              <div className="space-y-4 pt-6 border-t border-white/5 text-xs text-gray-500">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between hover:text-white transition"
                >
                  <span>Toggle Visual Mode</span>
                  <span className="capitalize text-sky-400 font-bold">{theme}</span>
                </button>
                <div className="text-[10px] uppercase font-mono text-gray-600 tracking-widest text-center">
                  SIMULATED SANDBOX • NO RISK
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
