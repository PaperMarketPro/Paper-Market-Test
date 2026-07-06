/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store';
import { 
  Flame, Award, ShieldAlert, CheckCircle, TrendingUp, Activity, 
  Settings, RefreshCw, LogOut, Check, Star, Shield, Bell, X, CreditCard, Sparkles, AlertTriangle 
} from 'lucide-react';

export const Profile: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { user, badges, challenges, notifications, markNotificationAsRead, clearAllNotifications, resetAccount, upgradeToPro } = useApp();
  if (!user) return null;
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'achievements' | 'subscription' | 'notifications' | 'settings'>('stats');

  // Subscription state
  const [showCheckout, setShowCheckout] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Settings state
  const [resetVal, setResetVal] = useState<number>(500000);

  // Dynamic Icon mapping for badges
  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5" />;
      case 'Flame': return <Flame className="w-5 h-5 animate-pulse" />;
      case 'CheckCircle': return <CheckCircle className="w-5 h-5" />;
      case 'TrendingUp': return <TrendingUp className="w-5 h-5" />;
      case 'Activity': return <Activity className="w-5 h-5" />;
      default: return <Award className="w-5 h-5" />;
    }
  };

  const handleSimulatedPayment = () => {
    setIsUpgrading(true);
    setTimeout(() => {
      setIsUpgrading(false);
      setShowCheckout(false);
      upgradeToPro();
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto">
      {/* Profile Overview Card */}
      <div className="bg-gradient-to-br from-[#171b26] to-[#11141c] border border-white/5 rounded-2xl p-6 flex justify-between items-center shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-bold text-lg text-white">{user.name}</span>
            <span className="bg-sky-500/10 text-sky-400 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
              Lvl {user.level}
            </span>
          </div>
          <span className="text-xs text-gray-400 block">{user.email}</span>
          <span className="text-xs text-gray-500 font-mono block">Role: Intraday Scalper</span>
        </div>

        <div className="text-right flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/15">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-amber-400 tabular-numbers">{user.streak}d Streak</span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono mt-1 block">{user.xp} Total XP</span>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex bg-white/2 border border-white/5 p-1 rounded-xl justify-between overflow-x-auto gap-1">
        {[
          { key: 'stats', label: 'Summary' },
          { key: 'achievements', label: 'Rewards' },
          { key: 'subscription', label: 'Subscription' },
          { key: 'notifications', label: `Alerts (${notifications.filter(n => !n.isRead).length})` },
          { key: 'settings', label: 'Settings' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              activeSubTab === tab.key ? 'bg-white/5 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'stats' && (
        <div className="space-y-4">
          {/* Active Challenges list */}
          <div className="space-y-3">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest block">Active Challenges</span>
            {challenges.map(ch => (
              <div key={ch.id} className="bg-white/2 border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white leading-tight">{ch.title}</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-sans">{ch.description}</p>
                  </div>
                  <span className="text-[10px] bg-sky-500/10 text-sky-400 font-mono font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    +{ch.xpReward} XP
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>Progress</span>
                    <span>{ch.progress}/{ch.target}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full" style={{ width: `${(ch.progress / ch.target) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'achievements' && (
        <div className="space-y-4">
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest block">Earned Badges & Medals</span>
          <div className="grid grid-cols-2 gap-3">
            {badges.map(bd => (
              <div
                key={bd.id}
                className={`p-4 rounded-2xl border transition text-center flex flex-col items-center justify-center space-y-2 relative overflow-hidden ${
                  bd.isEarned
                    ? 'bg-sky-500/5 border-sky-500/25'
                    : 'bg-white/1 border-white/5 opacity-50'
                }`}
              >
                <div className={`p-2.5 rounded-xl border ${
                  bd.isEarned 
                    ? 'bg-sky-500/10 border-sky-500/15 text-sky-400 animate-pulse' 
                    : 'bg-white/5 border-white/5 text-gray-500'
                }`}>
                  {getBadgeIcon(bd.icon)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">{bd.name}</h4>
                  <p className="text-[10px] text-gray-400 font-sans mt-1 leading-relaxed max-w-[120px] mx-auto">{bd.description}</p>
                </div>
                {bd.isEarned && (
                  <span className="text-[8px] font-mono text-gray-500 uppercase block pt-1">
                    Earned: {bd.earnedDate}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'subscription' && (
        <div className="space-y-4">
          {/* Plan checklist comparison */}
          <div className="bg-gradient-to-tr from-[#171b26] to-[#11141c] border border-white/5 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="text-center space-y-1.5">
              <Sparkles className="w-8 h-8 text-sky-400 mx-auto animate-bounce" />
              <h3 className="text-base font-bold text-white tracking-tight">Upgrade to Paper Market Pro</h3>
              <p className="text-xs text-gray-400">Enhance your discipline with institutional grade modeling</p>
            </div>

            <div className="space-y-3 pt-3">
              {[
                'Full Option Chain greek analytics',
                'Unlimited AI Trade Coach reports',
                'All Advanced Option & Strategy courses',
                'Advanced backtester simulations',
                'Streak insurance and custom badge tracking'
              ].map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-white/5 text-center space-y-3">
              <div className="space-y-0.5">
                <span className="block text-2xl font-bold text-white font-display">₹9 <span className="text-xs text-gray-400">/ month</span></span>
                <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest block">Cancel Anytime • Instant Activation</span>
              </div>

              {!user.isPro ? (
                <button
                  type="button"
                  onClick={() => setShowCheckout(true)}
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl text-xs transition"
                >
                  Unlock Pro Features
                </button>
              ) : (
                <div className="w-full py-2.5 bg-emerald-500/5 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/10 flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> Pro Access Activated
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide-up Checkout Sheet */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 bg-[#0b0e14]/85 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-[#11141c] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <CreditCard className="w-5 h-5 text-sky-400" /> Simulated Payment Portal
                </h3>
                <button onClick={() => setShowCheckout(false)} className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white/5 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Upgrade subscription plan</span>
                  <span className="text-white font-semibold">Pro Monthly</span>
                </div>
                <div className="flex justify-between text-gray-400 border-b border-white/5 pb-2">
                  <span>Recurring billing</span>
                  <span className="text-white">₹9.00</span>
                </div>
                <div className="flex justify-between font-bold text-gray-300 pt-1">
                  <span>Amount Payable</span>
                  <span className="text-white">₹9.00</span>
                </div>
              </div>

              <div className="text-[10px] text-gray-500 bg-[#0b0e14] p-3 rounded-lg border border-white/5 leading-relaxed">
                🚨 This is a mock payment gate. No actual credit-card billing will happen. Clicking checkout upgrades your account state immediately on the React client side.
              </div>

              <button
                type="button"
                onClick={handleSimulatedPayment}
                disabled={isUpgrading}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
              >
                {isUpgrading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Processing simulated token...
                  </>
                ) : (
                  <>
                    Confirm Simulated Checkout <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {activeSubTab === 'notifications' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest block">Sandbox Notifications</span>
            {notifications.length > 0 && (
              <button onClick={clearAllNotifications} className="text-sky-500 hover:text-sky-400 font-medium">
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => markNotificationAsRead(notif.id)}
                className={`p-4 rounded-xl border flex gap-3 transition cursor-pointer relative overflow-hidden ${
                  notif.isRead
                    ? 'bg-white/1 border-white/5 opacity-50'
                    : 'bg-white/2 border-sky-500/25 shadow-md'
                }`}
              >
                <div className="p-2 bg-white/5 rounded-lg border border-white/5 text-gray-400 h-9 shrink-0 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-white leading-tight">{notif.title}</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-sans">{notif.body}</p>
                  <span className="block text-[8px] font-mono text-gray-500 pt-1">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="text-center py-10 text-gray-500 text-xs">
                Inbox clean. No unread alerts.
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'settings' && (
        <div className="space-y-6 max-w-lg mx-auto">
          {/* Reset capital section */}
          <div className="bg-white/2 border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
            <div>
              <span className="text-xs font-mono text-amber-500 uppercase tracking-widest block">Danger Zone: Reset sandbox</span>
              <p className="text-[11px] text-gray-400 mt-0.5 font-sans">Erase all active paper orders and positions, reset cash ledger to standard preset capital levels.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Choose Target Balance (₹)</label>
              <div className="grid grid-cols-3 gap-2">
                {[100000, 500000, 1000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setResetVal(val)}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                      resetVal === val ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                    }`}
                  >
                    ₹{val.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => resetAccount(resetVal)}
              className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold py-2.5 rounded-xl text-xs transition border border-amber-500/15 flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Full Sandbox Cash Reset
            </button>
          </div>

          {/* Logout button */}
          <button
            type="button"
            onClick={onLogout}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-3 rounded-xl text-xs transition border border-red-500/15 flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Sign out of Sandbox Session
          </button>
        </div>
      )}
    </div>
  );
};
