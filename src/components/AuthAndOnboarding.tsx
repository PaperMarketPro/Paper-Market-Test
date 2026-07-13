/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../store';
import { BrandLogo } from './BrandLogo';
import { TrendingUp, ShieldCheck, Award, Zap, ArrowRight, Check, Sparkles, Mail, Lock, Phone, User, AlertCircle } from 'lucide-react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

interface AuthAndOnboardingProps {
  onComplete: () => void;
}

export const AuthAndOnboarding: React.FC<AuthAndOnboardingProps> = ({ onComplete }) => {
  const { user, initializeNewUser, initializeGuestUser } = useApp();

  const handleGuestProceed = () => {
    initializeGuestUser({
      name: name.trim() || 'Guest Paper Trader',
      experience: exp,
      goals: selectedGoals,
      virtualBalance: startingCap,
      initialBalance: startingCap
    });
    onComplete();
  };

  const [step, setStep] = useState<'splash' | 'welcome' | 'experience' | 'goals' | 'balance' | 'login'>('splash');
  const [slide, setSlide] = useState(0);
  const [exp, setExp] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [startingCap, setStartingCap] = useState<number>(500000);

  // Real Auth form states
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Firebase confirmation results & recaptcha refs
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const recaptchaVerifierRef = useRef<any>(null);

  // Clear errors on switching mode/method
  useEffect(() => {
    setErrorMsg('');
  }, [authMode, authMethod]);

  // Clean up reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
    };
  }, []);

  // Splash screen transition
  useEffect(() => {
    if (step === 'splash') {
      const timer = setTimeout(() => {
        setStep('welcome');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (authMode === 'signup') {
        if (!name.trim()) {
          throw new Error("Please enter your display name.");
        }
        // Create user in firebase Auth
        try {
          await createUserWithEmailAndPassword(auth, email.trim(), password);
          // Initialize user database on Firestore
          await initializeNewUser({
            name: name.trim(),
            email: email.trim(),
            experience: exp,
            goals: selectedGoals,
            virtualBalance: startingCap,
            initialBalance: startingCap
          });
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/operation-not-allowed') {
            console.warn("Firebase Auth Email/Password provider is disabled. Gracefully falling back to fully functional local sandbox session.");
            initializeGuestUser({
              name: name.trim(),
              email: email.trim(),
              experience: exp,
              goals: selectedGoals,
              virtualBalance: startingCap,
              initialBalance: startingCap
            });
          } else {
            throw fbErr;
          }
        }
      } else {
        // Log in user
        try {
          await signInWithEmailAndPassword(auth, email.trim(), password);
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/operation-not-allowed') {
            console.warn("Firebase Auth Email/Password provider is disabled. Gracefully falling back to fully functional local sandbox session.");
            initializeGuestUser({
              name: email.split('@')[0] || 'Guest Trader',
              email: email.trim(),
              experience: exp,
              goals: selectedGoals,
              virtualBalance: startingCap,
              initialBalance: startingCap
            });
          } else {
            throw fbErr;
          }
        }
      }
      onComplete();
    } catch (err: any) {
      console.error("Email auth error:", err);
      let friendlyMsg = err.message;
      if (err.code === 'auth/invalid-email') friendlyMsg = "Invalid email format.";
      else if (err.code === 'auth/user-not-found') friendlyMsg = "Account not found. Please sign up instead.";
      else if (err.code === 'auth/wrong-password') friendlyMsg = "Incorrect password.";
      else if (err.code === 'auth/email-already-in-use') friendlyMsg = "This email is already registered. Please log in.";
      else if (err.code === 'auth/weak-password') friendlyMsg = "Password should be at least 6 characters.";
      else if (err.code === 'auth/operation-not-allowed') friendlyMsg = "Email/Password sign-in is not enabled in Firebase Auth Console. Click 'Continue in Local Guest Mode' below to start practicing risk-free instantly!";
      else if (err.code === 'auth/network-request-failed') friendlyMsg = "Firebase Network Request Failed. This typically happens when an Ad Blocker, Brave Browser Shield, VPN, or local firewall blocks Firebase Authentication domains (googleapis.com / firebaseapp.com). Please disable your Ad Blocker, try a different browser, or click 'Continue in Local Guest Mode' below to start practicing instantly!";
      setErrorMsg(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (authMode === 'signup' && !name.trim()) {
        throw new Error("Please enter your display name.");
      }
      
      const phoneClean = phoneNumber.trim();
      if (!phoneClean) {
        throw new Error("Please enter your phone number.");
      }

      // Prepend +91 if country code is not entered
      const finalPhone = phoneClean.startsWith('+') ? phoneClean : `+91${phoneClean}`;

      // Initialize RecaptchaVerifier
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          }
        });
      }

      const confirmation = await signInWithPhoneNumber(auth, finalPhone, recaptchaVerifierRef.current);
      setConfirmationResult(confirmation);
      setOtpSent(true);
    } catch (err: any) {
      console.error("Send OTP error:", err);
      setErrorMsg(err.message || "Failed to send OTP. Please check the phone number format.");
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (!otpCode.trim()) {
        throw new Error("Please enter the verification code.");
      }

      const result = await confirmationResult.confirm(otpCode.trim());
      const fUser = result.user;

      if (authMode === 'signup') {
        // Initialize user database on Firestore
        await initializeNewUser({
          name: name.trim(),
          phoneNumber: fUser.phoneNumber || '',
          experience: exp,
          goals: selectedGoals,
          virtualBalance: startingCap,
          initialBalance: startingCap
        });
      }
      onComplete();
    } catch (err: any) {
      console.error("OTP Verification error:", err);
      let friendlyMsg = err.message;
      if (err.code === 'auth/invalid-verification-code') friendlyMsg = "Incorrect 6-digit verification code.";
      setErrorMsg(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'splash') {
    return (
      <div className="fixed inset-0 bg-[#060913] flex flex-col items-center justify-center text-white z-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center"
        >
          <BrandLogo size="xl" className="mb-4" />
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1">
            AI Trading Simulator
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060913] text-gray-100 flex flex-col justify-between py-8 px-4 md:px-8 max-w-lg mx-auto w-full">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <BrandLogo size="md" />
        </div>
        {step !== 'login' && (
          <button 
            onClick={() => setStep('login')} 
            className="text-xs text-sky-500 hover:text-sky-400 font-medium"
          >
            Skip to Login
          </button>
        )}
      </div>

      {/* Main Form Content Area with Motion Container */}
      <div className="flex-1 flex flex-col justify-center my-6">
        {step === 'welcome' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {slide === 0 && (
              <div className="space-y-4">
                <div className="bg-sky-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-8 h-8 text-sky-500" />
                </div>
                <h2 className="text-2xl font-display font-bold text-white tracking-tight">
                  Risk-Free Practice
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Practice trading on live Nifty, Bank Nifty, and major NSE stocks with real-time quote movements using ₹5L starting virtual capital.
                </p>
              </div>
            )}
            {slide === 1 && (
              <div className="space-y-4">
                <div className="bg-cyan-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <Award className="w-8 h-8 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-display font-bold text-white tracking-tight">
                  AI Trade Coach
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Analyze your psychology, detect overtrading triggers, and evaluate emotional mistakes automatically through our advanced LLM scoring model.
                </p>
              </div>
            )}
            {slide === 2 && (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <Zap className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-display font-bold text-white tracking-tight">
                  Gamified Academy
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Learn option pricing, premium decay mechanics, and discipline guidelines. Earn XP, complete streaks, and claim certificate rewards.
                </p>
              </div>
            )}

            {/* Slide Dots */}
            <div className="flex gap-1.5 pt-4">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    slide === i ? 'w-6 bg-sky-500' : 'w-1.5 bg-gray-700'
                  }`}
                />
              ))}
            </div>

            {/* Next buttons */}
            <div className="pt-8">
              {slide < 2 ? (
                <button
                  onClick={() => setSlide(s => s + 1)}
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setStep('experience')}
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {step === 'experience' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <span className="text-xs font-mono text-sky-500 uppercase tracking-widest">Step 2 of 5</span>
              <h2 className="text-2xl font-display font-bold text-white tracking-tight mt-1">
                Your Trading Experience?
              </h2>
              <p className="text-gray-400 text-sm mt-1">We tailor Academy suggestions and AI advice to your comfort level.</p>
            </div>

            <div className="space-y-3">
              {[
                { key: 'beginner', title: 'Beginner', desc: 'Learning what buy/sell and candlestick charts are.' },
                { key: 'intermediate', title: 'Intermediate', desc: 'Have placed some trades, understand technical markers.' },
                { key: 'advanced', title: 'Advanced', desc: 'Familiar with options Greeks and complex spread models.' }
              ].map(item => (
                <div
                  key={item.key}
                  onClick={() => setExp(item.key as any)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    exp === item.key
                      ? 'bg-sky-500/5 border-sky-500'
                      : 'bg-white/2 border-white/5 hover:bg-white/4'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">{item.title}</span>
                    {exp === item.key && <Check className="w-4 h-4 text-sky-500" />}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('goals')}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {step === 'goals' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <span className="text-xs font-mono text-sky-500 uppercase tracking-widest">Step 3 of 5</span>
              <h2 className="text-2xl font-display font-bold text-white tracking-tight mt-1">
                Select Your Learning Goals
              </h2>
              <p className="text-gray-400 text-sm mt-1">Select one or more targets for custom AI challenges.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                'Build discipline',
                'Learn options trading',
                'Master risk sizing',
                'Prevent emotional revenge trading',
                'Analyze chart patterns',
                'Backtest customized strategies',
                'Pass professional trade exams'
              ].map(goal => {
                const isSelected = selectedGoals.includes(goal);
                return (
                  <button
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    className={`px-4 py-2.5 rounded-full text-xs font-medium transition ${
                      isSelected
                        ? 'bg-sky-500 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/8'
                    }`}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep('balance')}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {step === 'balance' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <span className="text-xs font-mono text-sky-500 uppercase tracking-widest">Step 4 of 5</span>
              <h2 className="text-2xl font-display font-bold text-white tracking-tight mt-1">
                Starting Capital Setup
              </h2>
              <p className="text-gray-400 text-sm mt-1">Set a realistic balance that aligns with your real aspirations.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Starter', value: 100000, desc: '₹1 Lakh' },
                { label: 'Standard', value: 500000, desc: '₹5 Lakhs' },
                { label: 'Pro Simulator', value: 1000000, desc: '₹10 Lakhs' },
                { label: 'High Roller', value: 2500000, desc: '₹25 Lakhs' }
              ].map(cap => (
                <div
                  key={cap.value}
                  onClick={() => setStartingCap(cap.value)}
                  className={`p-4 rounded-xl border text-center cursor-pointer transition ${
                    startingCap === cap.value
                      ? 'bg-sky-500/5 border-sky-500'
                      : 'bg-white/2 border-white/5 hover:bg-white/4'
                  }`}
                >
                  <span className="block text-xs font-medium text-gray-400">{cap.label}</span>
                  <span className="block text-lg font-bold text-white mt-1">{cap.desc}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('login')}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition"
            >
              Continue to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {step === 'login' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <span className="text-xs font-mono text-sky-500 uppercase tracking-widest">Step 5 of 5</span>
              <h2 className="text-2xl font-display font-bold text-white tracking-tight mt-1">
                {authMode === 'signup' ? 'Create Secure Account' : 'Welcome Back'}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {authMode === 'signup' 
                  ? 'Sign up to build your persistent cloud trading ledger.' 
                  : 'Log in to sync your positions and stats from any device.'}
              </p>
            </div>

            {/* Auth Mode Tabs */}
            <div className="flex border-b border-white/10 text-sm">
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 font-medium border-b-2 transition ${
                  authMode === 'signup' ? 'text-sky-500 border-sky-500' : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 font-medium border-b-2 transition ${
                  authMode === 'login' ? 'text-sky-500 border-sky-500' : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                Log In
              </button>
            </div>

            {/* Auth Method Tabs */}
            <div className="flex bg-white/5 p-1 rounded-lg gap-1">
              <button
                type="button"
                onClick={() => { setAuthMethod('email'); setOtpSent(false); }}
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition ${
                  authMethod === 'email' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Email & Password
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod('phone'); setOtpSent(false); }}
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition ${
                  authMethod === 'phone' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Phone OTP
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex flex-col gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{errorMsg}</span>
                </div>
                
                {errorMsg.includes("not enabled in Firebase Auth Console") && (
                  <div className="mt-2 bg-black/30 p-4 rounded-lg border border-red-500/10 space-y-3 text-gray-300">
                    <p className="font-semibold text-white flex items-center gap-1.5 text-sm">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      How to enable Email Login in 10 seconds:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed text-gray-300">
                      <li>
                        Click the button below to open your project's Auth Console in a new tab:
                      </li>
                      <li className="list-none pt-1">
                        <a 
                          href="https://console.firebase.google.com/project/phonic-transit-7wfkz/authentication/providers" 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-1.5 rounded-md font-bold text-xs transition cursor-pointer"
                        >
                          Open Firebase Auth Console <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </li>
                      <li>In the console, select the <strong>"Sign-in method"</strong> tab at the top.</li>
                      <li>Under <strong>"Sign-in providers"</strong>, click <strong>"Add new provider"</strong>.</li>
                      <li>Select <strong>"Email/Password"</strong>, turn on the first toggle (Email/Password), and click <strong>"Save"</strong>.</li>
                    </ol>
                    <div className="pt-2 text-[11px] text-amber-400 border-t border-white/5 flex flex-wrap gap-2 items-center justify-between">
                      <span>Once saved, you can immediately create your account here!</span>
                      <button
                        type="button"
                        onClick={handleGuestProceed}
                        className="text-white hover:underline font-bold"
                      >
                        Skip & Continue as Guest →
                      </button>
                    </div>
                  </div>
                )}

                {errorMsg.includes("Firebase Network Request Failed") && (
                  <div className="mt-2 bg-black/30 p-4 rounded-lg border border-red-500/10 space-y-3 text-gray-300">
                    <p className="font-semibold text-white flex items-center gap-1.5 text-sm">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      Resolving Firebase Network Blocking:
                    </p>
                    <ul className="list-disc pl-4 space-y-1.5 leading-relaxed text-gray-300">
                      <li>
                        <strong>Ad Blocker / Shields:</strong> Ad blockers (like uBlock Origin, AdBlock Plus) or built-in browser shields (like Brave Shields, Opera Ad blocker) can sometimes falsely flag Firebase Auth endpoints as trackers. Try pausing shields/blockers on this page.
                      </li>
                      <li>
                        <strong>VPN/Firewall:</strong> If you are on an institutional or corporate network, Google's auth domains may be restricted. Try disconnecting from VPN or using a mobile hotspot.
                      </li>
                      <li>
                        <strong>Practice Mode Option:</strong> If you cannot disable your blocker, you can bypass this entirely and play risk-free by clicking below!
                      </li>
                    </ul>
                    <div className="pt-2 text-[11px] border-t border-white/5 flex flex-wrap gap-2 items-center justify-end">
                      <button
                        type="button"
                        onClick={handleGuestProceed}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-md transition cursor-pointer"
                      >
                        ⚡ Continue in Local Guest Mode Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {authMethod === 'email' ? (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {authMode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-500" /> Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Rayyan Naeem"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500 text-white placeholder-gray-600 transition"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-500" /> Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. rayyan@papermarket.in"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500 text-white placeholder-gray-600 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-gray-500" /> Secure Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500 text-white placeholder-gray-600 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 mt-6"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                      {authMode === 'signup' ? 'Creating Account...' : 'Logging in...'}
                    </>
                  ) : (
                    <>
                      {authMode === 'signup' ? 'Create Account' : 'Secure Login'} <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {/* reCAPTCHA Anchor div needed for Firebase phone auth */}
                <div id="recaptcha-container" className="my-2 flex justify-center"></div>

                {!otpSent ? (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    {authMode === 'signup' && (
                      <div className="space-y-1.5">
                        <label className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-500" /> Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="e.g. Rayyan Naeem"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500 text-white placeholder-gray-600 transition"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-500" /> Mobile Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        placeholder="e.g. 99999 99999"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500 text-white placeholder-gray-600 transition"
                      />
                      <span className="text-[10px] text-gray-500 block">Include country code if outside India (e.g., +91).</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 mt-6"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          Send Verification OTP <Sparkles className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                        Enter 6-Digit OTP Code
                      </label>
                      <p className="text-xs text-gray-500 font-mono">OTP was sent to {phoneNumber}</p>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="123456"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-lg font-bold tracking-[0.5em] focus:outline-none focus:border-sky-500 text-white placeholder-gray-600 transition"
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        Change Number
                      </button>
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        className="text-sky-500 hover:text-sky-400 font-medium"
                      >
                        Resend OTP
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 mt-6"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                          Verifying Code...
                        </>
                      ) : (
                        <>
                          Verify & Complete Launch <Sparkles className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-white/5 text-center space-y-2">
              <p className="text-[10px] text-gray-500">
                Facing Firebase configuration limits or want quick offline access?
              </p>
              <button
                type="button"
                onClick={handleGuestProceed}
                className="w-full bg-white/5 hover:bg-white/10 text-sky-400 font-semibold py-2.5 rounded-xl text-xs transition border border-sky-400/20 hover:border-sky-400/40 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Continue in Local Guest Mode
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Trust & Compliance UI Cues */}
      <div className="text-center space-y-1 mt-auto">
        <span className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">
          SIMULATED PLATFORM • NO REAL MONEY RISKED
        </span>
        <span className="block text-[10px] text-gray-600">
          Educational simulator environment not representing financial advice.
        </span>
      </div>
    </div>
  );
};
