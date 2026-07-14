/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store';
import { 
  Flame, Award, ShieldAlert, CheckCircle, TrendingUp, Activity, 
  Settings, RefreshCw, LogOut, Check, Star, Shield, Bell, X, CreditCard, Sparkles, AlertTriangle,
  Sun, Moon
} from 'lucide-react';

interface ProfileProps {
  onLogout: () => void;
  initialSubTab?: 'stats' | 'achievements' | 'subscription' | 'notifications' | 'settings';
}

export const Profile: React.FC<ProfileProps> = ({ onLogout, initialSubTab = 'stats' }) => {
  const { user, badges, challenges, notifications, markNotificationAsRead, clearAllNotifications, resetAccount, updateBalance, upgradeToPro, theme, toggleTheme, upstoxStatus, disconnectUpstox, refreshUpstoxStatus, connectUpstoxManually } = useApp();
  if (!user) return null;
  const [activeSubTab, setActiveSubTab] = React.useState<'stats' | 'achievements' | 'subscription' | 'notifications' | 'settings'>(initialSubTab);

  React.useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  // Upstox Manual Connection state
  const [manualToken, setManualToken] = useState('');
  const [isConnectingToken, setIsConnectingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenSuccess, setTokenSuccess] = useState<string | null>(null);

  // Listen to popup authentication success message
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        refreshUpstoxStatus();
        setTokenSuccess("Successfully authenticated via Upstox Developer login flow!");
        setTokenError(null);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refreshUpstoxStatus]);

  const handleConnectOAuth = async () => {
    try {
      setTokenError(null);
      setTokenSuccess(null);
      const response = await fetch('/api/integrations/upstox/auth-url');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate Upstox auth URL.');
      }
      const { url } = await response.json();

      const width = 600;
      const height = 750;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        url,
        'upstox_oauth_popup',
        `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
      );

      if (!popup) {
        setTokenError("Popup was blocked by your browser. Please allow popups or use Option A (manual paste).");
      }
    } catch (err: any) {
      setTokenError(err.message || "Failed to initiate OAuth flow.");
    }
  };

  // Subscription state
  const [showCheckout, setShowCheckout] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [razorpayError, setRazorpayError] = useState<string | null>(null);

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

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayCheckout = async () => {
    setIsUpgrading(true);
    setRazorpayError(null);

    try {
      // 1. Load Razorpay Script if not loaded
      if (!(window as any).Razorpay) {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          throw new Error("Failed to load Razorpay checkout SDK. Check your internet connection.");
        }
      }

      // 2. Create Order on backend
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to create payment order: ${errText}`);
      }

      const orderData = await res.json();
      if (!orderData.success) {
        throw new Error(orderData.error || "Order creation failed on server.");
      }

      const { orderId, amount, currency, keyId } = orderData;

      // 3. Open Razorpay Checkout modal
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "Paper Market Pro",
        description: "Premium subscription upgrade",
        order_id: orderId,
        handler: async function (response: any) {
          try {
            setIsUpgrading(true);
            // 4. Verify Signature on backend
            const verifyRes = await fetch("/api/razorpay/verify-signature", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            });

            if (!verifyRes.ok) {
              const verifyErr = await verifyRes.json();
              throw new Error(verifyErr.error || "Payment signature verification failed.");
            }

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              // Upgrade user
              upgradeToPro();
              setShowCheckout(false);
            } else {
              throw new Error("Payment verification unsuccessful.");
            }
          } catch (err: any) {
            console.error("Signature verification error:", err);
            setRazorpayError(err.message || "Failed to verify transaction signature.");
          } finally {
            setIsUpgrading(false);
          }
        },
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: {
          color: "#0ea5e9"
        },
        modal: {
          ondismiss: function() {
            setIsUpgrading(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error("Payment failed event:", response.error);
        setRazorpayError(response.error.description || "Payment failed. Please try again.");
        setIsUpgrading(false);
      });
      rzp.open();

    } catch (err: any) {
      console.error("Razorpay Checkout Error:", err);
      setRazorpayError(err.message || "An error occurred during Razorpay initialization.");
      setIsUpgrading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto w-full">
      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-[#11141c] border border-slate-200/50 dark:border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-xl">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Beautiful Initial Avatar with modern gradient */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-sky-500 dark:from-blue-500 dark:to-sky-400 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-500/20 shrink-0 border border-white/10 select-none">
            {user.name ? user.name.charAt(0).toUpperCase() : 'G'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Elegant, clear blue accent as suggested by the user */}
              <span className="font-display font-bold text-lg text-blue-600 dark:text-sky-400 leading-tight">{user.name}</span>
              <span className="bg-sky-500/10 text-sky-500 dark:text-sky-400 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap">
                Lvl {user.level}
              </span>
            </div>
            <span className="text-xs text-slate-600 dark:text-gray-400 block">{user.email}</span>
            <span className="text-xs text-slate-700 dark:text-gray-400 font-mono block">Role: Intraday Scalper</span>
          </div>
        </div>

        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-1.5 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-white/5 pt-4 sm:pt-0 shrink-0">
          <div className="flex items-center gap-1.5 bg-amber-500/10 px-3.5 py-1.5 rounded-xl border border-amber-500/15 whitespace-nowrap shrink-0 shadow-sm shadow-amber-500/5">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-numbers whitespace-nowrap">{user.streak}d Streak</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-gray-400 font-mono block whitespace-nowrap">{user.xp} Total XP</span>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex bg-white/2 border border-slate-200/50 dark:border-white/5 p-1 rounded-xl justify-between overflow-x-auto gap-1">
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
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeSubTab === tab.key 
                ? 'bg-blue-600 text-white dark:bg-white/5 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
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
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Active Challenges</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenges.map(ch => (
                <div key={ch.id} className="bg-white/2 border border-slate-200/50 dark:border-white/5 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{ch.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">{ch.description}</p>
                      </div>
                      <span className="text-[10px] bg-sky-500/10 text-sky-500 dark:text-sky-400 font-mono font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                        +{ch.xpReward} XP
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      <span>Progress</span>
                      <span>{ch.progress}/{ch.target}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full" style={{ width: `${(ch.progress / ch.target) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'achievements' && (
        <div className="space-y-4">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Earned Badges & Medals</span>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {badges.map(bd => (
              <div
                key={bd.id}
                className={`p-4 rounded-2xl border transition text-center flex flex-col items-center justify-center space-y-2 relative overflow-hidden ${
                  bd.isEarned
                    ? 'bg-sky-500/5 border-sky-500/25'
                    : 'bg-white/1 border-slate-200/50 dark:border-white/5 opacity-50'
                }`}
              >
                <div className={`p-2.5 rounded-xl border ${
                  bd.isEarned 
                    ? 'bg-sky-500/10 border-sky-500/15 text-sky-500 dark:text-sky-400 animate-pulse' 
                    : 'bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-400'
                }`}>
                  {getBadgeIcon(bd.icon)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{bd.name}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans mt-1 leading-relaxed max-w-[120px] mx-auto">{bd.description}</p>
                </div>
                {bd.isEarned && (
                  <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500 block pt-1">
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
          <div className="bg-white dark:bg-[#11141c] border border-slate-200/50 dark:border-white/5 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="text-center space-y-1.5">
              <Sparkles className="w-8 h-8 text-blue-600 dark:text-sky-400 mx-auto animate-bounce" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Upgrade to Paper Market Pro</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Enhance your discipline with institutional grade modeling</p>
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
                  <CreditCard className="w-5 h-5 text-sky-400" /> Razorpay Checkout Portal
                </h3>
                <button 
                  onClick={() => {
                    setShowCheckout(false);
                    setRazorpayError(null);
                  }} 
                  className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white cursor-pointer"
                >
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
                  <span className="text-white font-display">₹9.00</span>
                </div>
              </div>

              {razorpayError && (
                <div className="text-[11px] text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20 leading-relaxed font-sans flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
                  <span>{razorpayError}</span>
                </div>
              )}

              <div className="text-[10px] text-gray-400 bg-[#0b0e14] p-3 rounded-lg border border-white/5 leading-relaxed">
                ℹ️ Secured by Razorpay. This is a secure test payment gateway. Clicking "Pay via Razorpay" will initialize the secure checkout popup. Use dummy card credentials to simulate the transaction.
              </div>

              <button
                type="button"
                onClick={handleRazorpayCheckout}
                disabled={isUpgrading}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isUpgrading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Initializing Razorpay...
                  </>
                ) : (
                  <>
                    Pay via Razorpay <Sparkles className="w-4 h-4" />
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
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest block">Trading Notifications</span>
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
        <div className="space-y-6 max-w-4xl mx-auto w-full">
          {/* Upstox Live Market Feed card */}
          <div className="bg-white dark:bg-[#11141c] border border-slate-200/50 dark:border-white/5 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="space-y-1">
                <span className="text-xs font-mono text-blue-600 dark:text-sky-400 uppercase tracking-widest block font-bold">Data Feed Provider Settings</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Upstox Pro Live Market Feed</h3>
                <p className="text-[11px] text-slate-500 dark:text-gray-400 font-sans">
                  Connect your Upstox Developer account for real-time NSE/BSE tick prices, or fall back to high-fidelity simulated feeds.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {upstoxStatus.connected ? (
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${upstoxStatus.wsConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${upstoxStatus.wsConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {upstoxStatus.wsConnected ? 'PRO FEED ACTIVE' : 'AUTHORIZED / CONNECTING'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full border border-slate-200 dark:border-white/5">
                    <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 font-mono">DEMO SIMULATOR ACTIVE</span>
                  </div>
                )}
              </div>
            </div>

            {upstoxStatus.connected ? (
              <div className="space-y-4">
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Feed Connection:</span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-md">
                        ACTIVE & SECURED
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400 font-sans leading-relaxed">
                      Your real-time NSE/BSE pricing feed is active and synchronized. It updates the terminal orderbook and charts automatically.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={disconnectUpstox}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-2 px-4 rounded-xl text-xs transition border border-red-500/15 cursor-pointer whitespace-nowrap self-stretch sm:self-auto text-center font-sans"
                  >
                    Disconnect Upstox
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 font-sans">
                {/* Integration Info */}
                <div className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed font-sans bg-slate-50 dark:bg-white/1 border border-slate-200/50 dark:border-white/5 rounded-xl p-3.5 space-y-1.5">
                  <p>
                    ⚡ **Real-Time Data Feed Option:** By default, Paper Market Pro runs a low-latency simulated pricing loop. You can override the simulator with actual live Indian stock market ticks by linking an Upstox access token.
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-gray-500">
                    *Note: Upstox developer access tokens expire daily. If your feed disconnects or switches to demo mode, simply paste a fresh token below to instantly reconnect.*
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                  {/* Option A: Manual Paste */}
                  <div className="bg-slate-50/50 dark:bg-white/2 border border-slate-200/50 dark:border-white/5 rounded-xl p-4 space-y-3.5">
                    <div>
                      <span className="text-[10px] font-mono text-blue-600 dark:text-sky-400 uppercase tracking-widest block font-bold">Option A</span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">Paste Developer Access Token</h4>
                      <p className="text-[10.5px] text-slate-500 dark:text-gray-400 font-sans mt-0.5">Paste your raw access token generated from Upstox. Highly reliable in sandboxed or preview environments.</p>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="password"
                        placeholder="Paste eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        value={manualToken}
                        onChange={(e) => setManualToken(e.target.value)}
                        className="w-full bg-white dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:border-sky-500/50"
                      />
                      <button
                        type="button"
                        disabled={isConnectingToken || !manualToken.trim()}
                        onClick={async () => {
                          if (!manualToken.trim()) return;
                          setIsConnectingToken(true);
                          setTokenError(null);
                          setTokenSuccess(null);
                          const result = await connectUpstoxManually(manualToken.trim());
                          if (result.success) {
                            setTokenSuccess("Successfully connected to Upstox Live Feed!");
                            setManualToken('');
                          } else {
                            setTokenError(result.error || "Failed to connect. Check your token.");
                          }
                          setIsConnectingToken(false);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                      >
                        {isConnectingToken ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Connecting Feed...
                          </>
                        ) : (
                          <>
                            Link Access Token
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Option B: OAuth Flow */}
                  <div className="bg-slate-50/50 dark:bg-white/2 border border-slate-200/50 dark:border-white/5 rounded-xl p-4 space-y-3.5 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest block font-bold">Option B</span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">Developer Login OAuth Portal</h4>
                      <p className="text-[10.5px] text-slate-500 dark:text-gray-400 font-sans mt-0.5">Launch the official Upstox OAuth authentication window. Best when working outside container frames.</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleConnectOAuth}
                      className="w-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white font-bold py-2.5 rounded-xl text-xs transition border border-slate-200 dark:border-white/10 flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                    >
                      Authorize via Upstox Web
                    </button>
                  </div>
                </div>

                {/* Success and Error Indicators */}
                {(tokenError || tokenSuccess) && (
                  <div className="space-y-2">
                    {tokenError && (
                      <div className="text-[11px] text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20 leading-relaxed font-sans flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
                        <span>{tokenError}</span>
                      </div>
                    )}
                    {tokenSuccess && (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 leading-relaxed font-sans flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
                        <span>{tokenSuccess}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Theme selection card */}
            <div className="bg-white/2 border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
              <div>
                <span className="text-xs font-mono text-sky-400 uppercase tracking-widest block font-bold">App Theme Settings</span>
                <p className="text-[11px] text-gray-400 mt-0.5 font-sans">Toggle between light or eye-safe dark themes for optimal trading workspace comfort.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (theme === 'dark') toggleTheme();
                  }}
                  className={`py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                    theme === 'light'
                      ? 'bg-sky-500/10 text-sky-500 border-sky-500/20 shadow-md font-sans'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white font-sans'
                  }`}
                >
                  <Sun className="w-4 h-4" /> Light Mode
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (theme === 'light') toggleTheme();
                  }}
                  className={`py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                    theme === 'dark'
                      ? 'bg-sky-500/10 text-sky-500 border-sky-500/20 shadow-md font-sans'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white font-sans'
                  }`}
                >
                  <Moon className="w-4 h-4" /> Dark Mode
                </button>
              </div>
            </div>

            {/* Reset capital section */}
            <div className="bg-white/2 border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
              <div>
                <span className="text-xs font-mono text-amber-500 uppercase tracking-widest block">Simulated Capital Settings</span>
                <p className="text-[11px] text-gray-400 mt-0.5 font-sans">Select a simulated capital level to instantly adjust your current balance, or run a full reset below.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Choose Target Balance (₹)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[100000, 500000, 1000000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setResetVal(val);
                        updateBalance(val);
                      }}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                        resetVal === val || user.virtualBalance === val ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-sans shadow-inner shadow-amber-500/5' : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 font-sans'
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
                className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold py-2.5 rounded-xl text-xs transition border border-amber-500/15 flex items-center justify-center gap-1.5 cursor-pointer font-sans"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Full Clear & Fresh Start Reset
              </button>
            </div>
          </div>

          {/* Account Actions card */}
          <div className="bg-white/2 border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg max-w-xl mx-auto">
            <div>
              <span className="text-xs font-mono text-red-400 uppercase tracking-widest block font-bold">Session & Account Control</span>
              <p className="text-[11px] text-gray-400 mt-0.5 font-sans">Log out from your current device session or change to a different user account.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onLogout}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 rounded-xl text-xs transition border border-white/5 flex items-center justify-center gap-1.5 cursor-pointer font-sans"
              >
                <LogOut className="w-3.5 h-3.5" /> Change Account
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2.5 rounded-xl text-xs transition border border-red-500/15 flex items-center justify-center gap-1.5 cursor-pointer font-sans"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
