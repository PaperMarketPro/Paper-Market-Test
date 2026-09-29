/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useMainApp } from '../store';
import { 
  Flame, Award, ShieldAlert, CheckCircle, TrendingUp, Activity, 
  RefreshCw, LogOut, Bell, Sun, Moon
} from 'lucide-react';

interface ProfileProps {
  onLogout: () => void;
  initialSubTab?: 'stats' | 'achievements' | 'subscription' | 'notifications' | 'settings';
}

export const Profile: React.FC<ProfileProps> = React.memo(({ onLogout, initialSubTab = 'stats' }) => {
  const { 
    user, badges, challenges, notifications, markNotificationAsRead, 
    clearAllNotifications, resetAccount, updateBalance, 
    theme, toggleTheme 
  } = useMainApp();

  // Map legacy sub-tabs into 3 clean, focused tabs
  const resolveTab = (t?: string): 'overview' | 'notifications' | 'settings' => {
    if (t === 'notifications') return 'notifications';
    if (t === 'settings' || t === 'subscription') return 'settings';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'notifications' | 'settings'>(resolveTab(initialSubTab));
  const [resetVal, setResetVal] = useState<number>(500000);

  React.useEffect(() => {
    setActiveTab(resolveTab(initialSubTab));
  }, [initialSubTab]);

  if (!user) return null;

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5" />;
      case 'Flame': return <Flame className="w-5 h-5" />;
      case 'CheckCircle': return <CheckCircle className="w-5 h-5" />;
      case 'TrendingUp': return <TrendingUp className="w-5 h-5" />;
      case 'Activity': return <Activity className="w-5 h-5" />;
      default: return <Award className="w-5 h-5" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto w-full">
      {/* User Header Card */}
      <div className="bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {user.name ? user.name.charAt(0).toUpperCase() : 'T'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-900 dark:text-white">{user.name}</span>
              <span className="bg-blue-500/10 text-blue-600 dark:text-sky-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                Level {user.level}
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-gray-400 block">{user.email}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 dark:border-white/5 pt-3 sm:pt-0">
          <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{user.streak}d Streak</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-gray-400 font-mono font-bold">{user.xp} XP</span>
        </div>
      </div>

      {/* Clean 3-Tab Switcher */}
      <div className="flex bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 p-1 rounded-xl gap-1">
        {[
          { key: 'overview', label: 'Progress & Badges' },
          { key: 'notifications', label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
          { key: 'settings', label: 'Settings & Account' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === tab.key 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview (Challenges + Badges) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-mono text-slate-500 dark:text-gray-400 uppercase tracking-wider font-bold">Active Challenges</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenges.map(ch => (
                <div key={ch.id} className="bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl p-4 space-y-3 shadow-sm">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{ch.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">{ch.description}</p>
                    </div>
                    <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-sky-400 font-mono font-bold px-2 py-0.5 rounded-full shrink-0">
                      +{ch.xpReward} XP
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Progress</span>
                      <span>{ch.progress}/{ch.target}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full" style={{ width: `${Math.min(100, (ch.progress / ch.target) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-mono text-slate-500 dark:text-gray-400 uppercase tracking-wider font-bold">Earned Badges</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {badges.map(bd => (
                <div
                  key={bd.id}
                  className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center space-y-2 ${
                    bd.isEarned
                      ? 'bg-white dark:bg-[#0c1020] border-blue-500/30'
                      : 'bg-white/50 dark:bg-[#0c1020]/50 border-slate-200 dark:border-white/5 opacity-50'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${
                    bd.isEarned ? 'bg-blue-500/10 text-blue-600 dark:text-sky-400' : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                  }`}>
                    {getBadgeIcon(bd.icon)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{bd.name}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">{bd.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-slate-500 uppercase font-bold">Recent Alerts</span>
            {notifications.length > 0 && (
              <button onClick={clearAllNotifications} className="text-xs text-blue-600 dark:text-sky-400 font-semibold cursor-pointer">
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-2">
            {notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => markNotificationAsRead(notif.id)}
                className={`p-4 rounded-2xl border flex gap-3 transition cursor-pointer ${
                  notif.isRead
                    ? 'bg-white/60 dark:bg-[#0c1020]/60 border-slate-200/60 dark:border-white/5 opacity-60'
                    : 'bg-white dark:bg-[#0c1020] border-blue-500/30 shadow-sm'
                }`}
              >
                <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-500 dark:text-gray-400 h-9 shrink-0 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{notif.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">{notif.body}</p>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-400 text-xs">
                No notifications right now.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Settings & Account */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Appearance */}
          <div className="bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4 shadow-sm">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono">Appearance</h4>
              <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">Choose light or dark display mode.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { if (theme === 'dark') toggleTheme(); }}
                className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                  theme === 'light'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-400 border-slate-200 dark:border-white/10'
                }`}
              >
                <Sun className="w-4 h-4" /> Light
              </button>
              <button
                type="button"
                onClick={() => { if (theme === 'light') toggleTheme(); }}
                className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                  theme === 'dark'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-400 border-slate-200 dark:border-white/10'
                }`}
              >
                <Moon className="w-4 h-4" /> Dark
              </button>
            </div>
          </div>

          {/* Virtual Capital Reset */}
          <div className="bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4 shadow-sm">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono">Virtual Capital</h4>
              <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">Set your paper trading balance or reset your account.</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[100000, 500000, 1000000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setResetVal(val);
                    updateBalance(val);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    user.virtualBalance === val
                      ? 'bg-blue-500/10 text-blue-600 dark:text-sky-400 border-blue-500/30'
                      : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-400 border-slate-200 dark:border-white/10'
                  }`}
                >
                  ₹{(val / 100000).toFixed(0)}L
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => resetAccount(resetVal)}
              className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold py-2.5 rounded-xl text-xs transition border border-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Account & Positions
            </button>
          </div>

          {/* Sign Out */}
          <div className="md:col-span-2 bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono">Account Session</h4>
              <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">Signed in as {user.email}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-2.5 px-5 rounded-xl text-xs transition border border-red-500/20 flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
