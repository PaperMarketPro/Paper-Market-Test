import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gauge, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SebiRiskModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onClose?: () => void;
}

export const SebiRiskModal: React.FC<SebiRiskModalProps> = ({ isOpen, onConfirm, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div key="sebi-modal-backdrop" className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            key="sebi-modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-lg bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-slate-800 dark:text-gray-100"
          >
            {/* Header Graphic / Icon */}
            <div className="flex justify-center mb-5">
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 shadow-inner">
                {/* Custom Speedometer / Gauge Icon */}
                <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md">
                  <Gauge className="w-8 h-8 text-white stroke-[2.2]" />
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white border-2 border-white dark:border-[#0d1222]">
                  <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                </span>
              </div>
            </div>

            {/* Modal Header */}
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Risk disclosure for futures & options
              </h2>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Mandatory regulatory disclosure as required by SEBI (Securities and Exchange Board of India).
              </p>
            </div>

            {/* SEBI Prescribed Risk Statistics Bullet Points */}
            <div className="space-y-3.5 mb-7 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-gray-300">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <p>
                  <strong className="text-slate-900 dark:text-white font-semibold">9 out of 10</strong> individual traders in equity Futures and Options segment, incurred net losses.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <p>
                  On an average, loss makers registered net trading loss close to <strong className="text-slate-900 dark:text-white font-semibold">₹50,000</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <p>
                  Over and above the net trading losses incurred, loss makers expended an additional <strong className="text-slate-900 dark:text-white font-semibold">28%</strong> of net trading losses as transaction costs.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <p>
                  Those making net trading profits, incurred between <strong className="text-slate-900 dark:text-white font-semibold">15% to 50%</strong> of such profits as transaction cost.
                </p>
              </div>
            </div>

            {/* SEBI Compliance Badge */}
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-6 bg-emerald-500/10 border border-emerald-500/20 py-2 px-4 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0 fill-emerald-500 text-white dark:text-[#0d1222]" />
              <span>This is a mandatory step by SEBI</span>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onConfirm();
              }}
              className="w-full py-4 px-6 rounded-2xl font-bold text-sm text-white bg-[#00c076] hover:bg-[#00a867] active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer relative z-10"
            >
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              <span>Okay, I understand</span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
