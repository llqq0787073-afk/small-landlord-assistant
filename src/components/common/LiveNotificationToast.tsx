import React, { useEffect } from 'react';
import { useAppStore } from '../../lib/store';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export const LiveNotificationToast: React.FC = () => {
  const { toastMessage, clearToast } = useAppStore();

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        clearToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, clearToast]);

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 max-w-sm w-full bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-800 p-4 transition-all animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        {toastMessage.type === 'success' && (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        )}
        {toastMessage.type === 'warning' && (
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        )}
        {toastMessage.type === 'info' && (
          <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 text-sm font-medium leading-snug">
          {toastMessage.text}
        </div>
        <button
          onClick={clearToast}
          className="text-slate-400 hover:text-white transition-colors p-1"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
