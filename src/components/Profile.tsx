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
  const { 
    user, badges, challenges, notifications, markNotificationAsRead, 
    clearAllNotifications, resetAccount, updateBalance, upgradeToPro, 
    theme, toggleTheme, upstoxStatus, disconnectUpstox, refreshUpstoxStatus, 
    connectUpstoxManually, enforceMarketHours, toggleEnforceMarketHours, isMarketOpen 
  } = useApp();
  if (!user) return null;
  const [activeSubTab, setActiveSubTab] = React.useState<'stats' | 'achievements' | 'subscription' | 'notifications' | 'settings'>(initialSubTab);

  React.useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  // Upstox Manual Connection state
  const [manualToken, setManualToken] = useState('');
  const [isConnectingToken, setIsConnectingToken] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenSuccess, setTokenSuccess] = useState<string | null>(null);
  const [upstoxRedirectType, setUpstoxRedirectType] = useState<'localhost' | 'cloud'>('localhost');

  // Auto-renew configuration states
  const [autoApiKey, setAutoApiKey] = useState('');
  const [autoApiSecret, setAutoApiSecret] = useState('');
  const [autoRedirectUri, setAutoRedirectUri] = useState('');
  const [autoMobileNo, setAutoMobileNo] = useState('');
  const [autoPin, setAutoPin] = useState('');
  const [autoTotpSecret, setAutoTotpSecret] = useState('');
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [isSavingAutoRenew, setIsSavingAutoRenew] = useState(false);
  const [autoRenewConfig, setAutoRenewConfig] = useState<any>(null);
  const [showAutoForm, setShowAutoForm] = useState(false);

  const loadAutoRenewStatus = async () => {
    try {
      const res = await fetch("/api/integrations/upstox/autorenew");
      if (res.ok) {
        const data = await res.json();
        setAutoRenewConfig(data);
        if (data.configured) {
          setAutoEnabled(data.enabled);
        }
      }
    } catch (err) {
      console.warn("Failed to load auto-renew status:", err);
    }
  };

  React.useEffect(() => {
    if (activeSubTab === 'settings') {
      loadAutoRenewStatus();
    }
  }, [activeSubTab]);

  const pollingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

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
      const targetOrigin = window.location.origin;
      const chosenRedirectUri = upstoxRedirectType === 'localhost'
        ? 'http://localhost:3000/api/integrations/upstox/callback'
        : `${targetOrigin}/api/integrations/upstox/callback`;

      const response = await fetch(`/api/integrations/upstox/auth-url?origin=${encodeURIComponent(targetOrigin)}&redirectUri=${encodeURIComponent(chosenRedirectUri)}`);
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
      } else {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

        let attempts = 0;
        pollingIntervalRef.current = setInterval(async () => {
          attempts++;
          if (attempts > 150) { // Stop after 5 minutes
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            return;
          }

          try {
            const res = await fetch(`/api/integrations/upstox/status?origin=${encodeURIComponent(window.location.origin)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.connected) {
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = null;
                }
                refreshUpstoxStatus();
                setTokenSuccess("Successfully authenticated via Upstox Developer login flow!");
                setTokenError(null);
                try {
                  popup.close();
                } catch (e) {}
              }
            }
          } catch (e) {
            console.warn("[OAUTH POLL] Error checking auth status:", e);
          }
        }, 2000);
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
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {upstoxStatus.isRealUpstox ? 'PRO LIVE FEED ACTIVE' : 'PRO FEED ACTIVE (AUTO-SYNCHRONIZED)'}
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
                        {upstoxStatus.isRealUpstox ? 'ACTIVE & SECURED' : 'PRO ETERNAL ACTIVE'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400 font-sans leading-relaxed">
                      {upstoxStatus.isRealUpstox 
                        ? 'Your real-time NSE/BSE pricing feed is active and synchronized. It updates the terminal orderbook and charts automatically.'
                        : 'Your Pro account is persistently linked. High-fidelity pricing is auto-synchronized with low-latency ticks to keep the market active 24/7. You can paste a new token anytime to sync direct exchange prices.'}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5 self-stretch sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        setIsReconnecting(true);
                        setTokenError(null);
                        setTokenSuccess(null);
                        try {
                          const res = await fetch("/api/integrations/upstox/reconnect", { method: "POST" });
                          const data = await res.json();
                          if (res.ok && data.success) {
                            setTokenSuccess(data.message || "Connection resync triggered successfully!");
                            await refreshUpstoxStatus();
                          } else {
                            setTokenError(data.error || "Failed to trigger connection resync.");
                          }
                        } catch (err: any) {
                          setTokenError(err.message || "Failed to contact server.");
                        } finally {
                          setIsReconnecting(false);
                        }
                      }}
                      disabled={isReconnecting}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl text-xs transition border border-blue-700 cursor-pointer whitespace-nowrap text-center font-sans flex items-center justify-center gap-1"
                    >
                      {isReconnecting ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Resynching...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                          Resync Connection
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={disconnectUpstox}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-2 px-4 rounded-xl text-xs transition border border-red-500/15 cursor-pointer whitespace-nowrap self-stretch sm:self-auto text-center font-sans"
                    >
                      Disconnect Upstox
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 font-sans">
                {/* Integration Info */}
                <div className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed font-sans bg-slate-50 dark:bg-white/1 border border-slate-200/50 dark:border-white/5 rounded-xl p-3.5 space-y-1.5">
                  <p>
                    ⚡ **Seamless 24/7 Continuity (Dual-Sync Mode):** By default, Paper Market Pro is equipped with a high-fidelity low-latency market pricing simulator. If you link your Upstox Pro Developer Feed, you will receive real exchange tick prices.
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-gray-500 font-sans">
                    🛡️ **SEBI Regulation & Daily Expiration Policy:** In compliance with Indian exchange security mandates, Upstox access tokens are cleared at approximately 3:30 AM IST daily. There is no refresh token. **Paper Market Pro handles this gracefully:** when your Upstox token expires, the system automatically and silently switches back to high-fidelity live simulated prices. Your order terminal, charts, and portfolios remain 100% active and running continuously without any freezing or broken screens! You can easily link a new token at market open to resume real price feeds.
                  </p>
                </div>



                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                    {/* Option A: Manual Paste */}
                    <div className="bg-slate-50/50 dark:bg-white/2 border border-slate-200/50 dark:border-white/5 rounded-xl p-4 space-y-3.5">
                      <div>
                        <span className="text-[10px] font-mono text-blue-600 dark:text-sky-400 uppercase tracking-widest block font-bold">Option A: Smart Linker</span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">Paste Code, URL, or Token</h4>
                        <p className="text-[10.5px] text-slate-500 dark:text-gray-400 font-sans mt-0.5">
                          Paste your raw Access Token, authorization code, or the <strong>entire redirect URL</strong> (even if the browser showed a "site can't be reached" error). We will parse it and link you instantly!
                        </p>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Paste Token, Auth Code, or Redirect URL..."
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
                              setTokenSuccess("Successfully connected to Upstox Pro Live Feed!");
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
                              Processing & Connecting...
                            </>
                          ) : (
                            <>
                              Connect & Verify Feed
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Option B: OAuth Flow */}
                    <div className="bg-slate-50/50 dark:bg-white/2 border border-slate-200/50 dark:border-white/5 rounded-xl p-4 space-y-3.5 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest block font-bold">Option B: OAuth Portal</span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">Developer Login OAuth Portal</h4>
                        </div>

                        {/* SELECT REDIRECT TYPE */}
                        <div className="space-y-1.5 bg-slate-100/50 dark:bg-black/10 p-2.5 rounded-lg border border-slate-200/50 dark:border-white/5">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase font-mono">1. Choose Redirect URI in Upstox Console:</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setUpstoxRedirectType('localhost')}
                              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold font-mono transition text-center border cursor-pointer ${
                                upstoxRedirectType === 'localhost'
                                  ? 'bg-amber-600 text-white shadow-sm border-amber-700'
                                  : 'bg-white dark:bg-[#11141c] text-slate-600 dark:text-gray-400 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'
                              }`}
                            >
                              localhost:3000
                            </button>
                            <button
                              type="button"
                              onClick={() => setUpstoxRedirectType('cloud')}
                              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold font-mono transition text-center border cursor-pointer ${
                                upstoxRedirectType === 'cloud'
                                  ? 'bg-amber-600 text-white shadow-sm border-amber-700'
                                  : 'bg-white dark:bg-[#11141c] text-slate-600 dark:text-gray-400 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'
                              }`}
                            >
                              cloud app URL
                            </button>
                          </div>
                        </div>

                        {upstoxRedirectType === 'localhost' ? (
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed font-sans space-y-1.5">
                            <span className="font-bold flex items-center gap-1">📍 Localhost Flow Instruction:</span>
                            <p>
                              If your Upstox App has the redirect URL set to:
                            </p>
                            <div className="bg-slate-200/50 dark:bg-black/40 p-1.5 rounded text-[9.5px] font-mono text-slate-800 dark:text-slate-300 break-all select-all font-bold">
                              http://localhost:3000/api/integrations/upstox/callback
                            </div>
                            <p>
                              Upstox will redirect to a broken page because the server runs in the cloud, not on your device. <strong>This is normal!</strong>
                            </p>
                            <p className="font-bold">
                              👉 Simply COPY that entire broken address bar URL (containing <code className="font-mono">?code=...</code>) and PASTE it into "Option A: Smart Linker" on the left!
                            </p>
                          </div>
                        ) : (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed font-sans space-y-1.5">
                            <span className="font-bold flex items-center gap-1 text-emerald-600 dark:text-emerald-400">⚡ Seamless Cloud Flow Instruction:</span>
                            <p>
                              For a 100% automatic connection, register this exact Redirect URI in your **Upstox Developer Console**:
                            </p>
                            <div className="bg-emerald-500/5 dark:bg-black/40 p-1.5 rounded text-[9.5px] font-mono text-emerald-600 dark:text-emerald-300 break-all select-all font-bold border border-emerald-500/10">
                              {`${window.location.origin}/api/integrations/upstox/callback`}
                            </div>
                            <p className="font-semibold">
                              Once registered, click Authorize. It will connect automatically and instantly with no copy-pasting required!
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 pt-2">
                        <button
                          type="button"
                          onClick={handleConnectOAuth}
                          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl text-xs transition border border-amber-700/30 flex items-center justify-center gap-1.5 cursor-pointer font-sans shadow-sm"
                        >
                          Authorize via Upstox Web
                        </button>

                        <p className="text-[9.5px] text-slate-400 dark:text-gray-500 leading-normal text-center font-sans">
                          A popup window will open for official Upstox authorization.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
            )}

                {/* Auto-Renew section */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-sans">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 animate-pulse" />
                        Automated 24/7 Background Renewal
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-gray-400 font-sans">
                        Enable background login with automated TOTP generation to maintain an uninterrupted connection daily.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextShow = !showAutoForm;
                        setShowAutoForm(nextShow);
                        if (nextShow && autoRenewConfig) {
                          setAutoRedirectUri(autoRenewConfig.redirectUri || `${window.location.origin}/api/integrations/upstox/callback`);
                          setAutoEnabled(autoRenewConfig.enabled);
                        } else if (nextShow && !autoRedirectUri) {
                          setAutoRedirectUri(`${window.location.origin}/api/integrations/upstox/callback`);
                        }
                      }}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                    >
                      {showAutoForm ? 'Hide Configuration' : 'Configure Auto-Renew'}
                    </button>
                  </div>

                  {/* Status block when configured */}
                  {autoRenewConfig && autoRenewConfig.configured && !showAutoForm && (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-sans">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-slate-800 dark:text-gray-200 font-medium">
                          Automated background renew is <strong>{autoRenewConfig.enabled ? 'ACTIVE & ENABLED' : 'DISABLED'}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
                        <span className="text-[10px] text-slate-500 dark:text-gray-400 font-mono">
                          API Key: {autoRenewConfig.apiKey}
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              if (autoRenewConfig.enabled) {
                                await fetch('/api/integrations/upstox/autorenew/disable', { method: 'POST' });
                              } else {
                                // If they want to enable, they should save/re-submit or we can post with existing
                                await fetch('/api/integrations/upstox/autorenew', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ enabled: true })
                                });
                              }
                              await loadAutoRenewStatus();
                              await refreshUpstoxStatus();
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className={`font-bold hover:underline text-[10px] ${autoRenewConfig.enabled ? 'text-red-500' : 'text-emerald-500'}`}
                        >
                          {autoRenewConfig.enabled ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </div>
                  )}

                  {showAutoForm && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setIsSavingAutoRenew(true);
                        setTokenError(null);
                        setTokenSuccess(null);
                        try {
                          const res = await fetch("/api/integrations/upstox/autorenew", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              apiKey: autoApiKey,
                              apiSecret: autoApiSecret,
                              redirectUri: autoRedirectUri,
                              mobileNo: autoMobileNo,
                              pin: autoPin,
                              totpSecret: autoTotpSecret,
                              enabled: autoEnabled
                            })
                          });
                          const data = await res.json();
                          if (res.ok && data.success) {
                            setTokenSuccess(data.message || "Successfully saved automated background login configuration!");
                            await loadAutoRenewStatus();
                            await refreshUpstoxStatus();
                            setShowAutoForm(false);
                            setAutoApiKey('');
                            setAutoApiSecret('');
                            setAutoMobileNo('');
                            setAutoPin('');
                            setAutoTotpSecret('');
                          } else {
                            setTokenError(data.error || "Failed to save configuration. Please check credentials.");
                          }
                        } catch (err: any) {
                          setTokenError(err.message || "Network error while saving auto-renew settings.");
                        } finally {
                          setIsSavingAutoRenew(false);
                        }
                      }}
                      className="bg-slate-50 dark:bg-white/2 border border-slate-200/50 dark:border-white/5 rounded-xl p-4 space-y-4 font-sans text-left"
                    >
                      <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3 text-[11px] text-slate-600 dark:text-gray-300 space-y-1 leading-relaxed">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">💡 Flexible App Keys Setup:</span>
                        <p>
                          Enter your Upstox App Keys to use <strong>Option A (Smart Linker)</strong> and <strong>Option B (OAuth Portal)</strong> under your own developer account, bypassing any server environment variables!
                        </p>
                        <p className="text-slate-500 dark:text-slate-400">
                          Check "Enable Background Programmatic Auto-Renewal" below and enter your login PIN and TOTP Key if you also want the system to automatically renew your token at 3:30 AM IST daily.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider block">
                            Upstox API Key (Client ID) {!autoRenewConfig?.apiKey && ' *'}
                          </label>
                          <input
                            type="text"
                            required={!autoRenewConfig?.apiKey}
                            placeholder={autoRenewConfig?.apiKey ? `${autoRenewConfig.apiKey} (Saved)` : "e.g. 5d5a7b-3b32..."}
                            value={autoApiKey}
                            onChange={(e) => setAutoApiKey(e.target.value)}
                            className="w-full bg-white dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider block">
                            Upstox API Secret {!autoRenewConfig?.configured && ' *'}
                          </label>
                          <input
                            type="password"
                            required={!autoRenewConfig?.configured}
                            placeholder={autoRenewConfig?.configured ? "•••••••••••• (Saved)" : "Your Upstox Developer App Secret"}
                            value={autoApiSecret}
                            onChange={(e) => setAutoApiSecret(e.target.value)}
                            className="w-full bg-white dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider block">
                            Redirect URI {!autoRenewConfig?.redirectUri && ' *'}
                          </label>
                          <input
                            type="text"
                            required={!autoRenewConfig?.redirectUri}
                            placeholder={autoRenewConfig?.redirectUri || "e.g. http://localhost:3000/api/integrations/upstox/callback"}
                            value={autoRedirectUri}
                            onChange={(e) => setAutoRedirectUri(e.target.value)}
                            className="w-full bg-white dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider block">
                            Registered Mobile No {autoEnabled && !autoRenewConfig?.mobileNo && ' *'}
                          </label>
                          <input
                            type="text"
                            required={autoEnabled && !autoRenewConfig?.mobileNo}
                            placeholder={autoRenewConfig?.mobileNo ? `${autoRenewConfig.mobileNo} (Saved)` : "e.g. 9876543210 (10 digits)"}
                            value={autoMobileNo}
                            onChange={(e) => setAutoMobileNo(e.target.value)}
                            className="w-full bg-white dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider block">
                            6-Digit PIN {autoEnabled && !autoRenewConfig?.hasPin && ' *'}
                          </label>
                          <input
                            type="password"
                            required={autoEnabled && !autoRenewConfig?.hasPin}
                            placeholder={autoRenewConfig?.hasPin ? "•••••• (Saved)" : "Your Upstox 6-digit login PIN"}
                            maxLength={6}
                            value={autoPin}
                            onChange={(e) => setAutoPin(e.target.value)}
                            className="w-full bg-white dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider block">
                            TOTP Key {autoEnabled && !autoRenewConfig?.hasTotpSecret && ' *'}
                          </label>
                          <input
                            type="password"
                            required={autoEnabled && !autoRenewConfig?.hasTotpSecret}
                            placeholder={autoRenewConfig?.hasTotpSecret ? "•••••••••••• (Saved)" : "Secret key used to generate your TOTP codes"}
                            value={autoTotpSecret}
                            onChange={(e) => setAutoTotpSecret(e.target.value)}
                            className="w-full bg-white dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white disabled:opacity-50"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={autoEnabled}
                            onChange={(e) => setAutoEnabled(e.target.checked)}
                            className="rounded border-slate-300 dark:border-white/10 bg-white dark:bg-[#0b0e14] text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          Enable Background Programmatic Auto-Renewal
                        </label>

                        <button
                          type="submit"
                          disabled={isSavingAutoRenew}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isSavingAutoRenew ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              Testing & Verifying...
                            </>
                          ) : (
                            <>
                              Verify & Save Configuration
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
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

            {/* Strict Market Hours Check Card */}
            <div className="bg-white/2 border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
              <div>
                <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest block font-bold">NSE / BSE Market Hours Limits</span>
                <p className="text-[11px] text-gray-400 mt-0.5 font-sans">Enforce realistic Indian stock exchange trading rules to build genuine disciplined habits.</p>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-white/1 border border-slate-200/50 dark:border-white/5 rounded-xl opacity-90">
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white font-sans">Strict Market Hours</h4>
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${enforceMarketHours ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15' : 'text-slate-500 dark:text-slate-400 bg-slate-500/10'}`}>
                      {enforceMarketHours ? 'ENFORCED' : 'DISABLED (24/7 TRADING)'}
                    </span>
                  </div>
                  <p className="text-[9.5px] text-slate-500 dark:text-gray-400 font-sans leading-normal">
                    Lock transactions outside official IST market hours (9:15 AM - 3:30 PM, Mon-Fri). Toggle off to practice paper trading 24/7.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleEnforceMarketHours}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enforceMarketHours ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/10'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enforceMarketHours ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
              
              <div className="text-[10px] text-slate-500 dark:text-gray-400 leading-relaxed font-sans bg-slate-50 dark:bg-white/2 rounded-xl p-2.5 border border-slate-200/50 dark:border-white/5 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${isMarketOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>
                  Live Status: <strong>{isMarketOpen ? 'Indian Markets Open' : 'Indian Markets Closed'}</strong> (9:15 AM - 3:30 PM IST)
                </span>
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
