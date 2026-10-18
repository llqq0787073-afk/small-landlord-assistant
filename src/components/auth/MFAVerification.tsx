import React, { useState, useEffect } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  ArrowRight,
  ChevronLeft,
  KeyRound,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const MFAVerification: React.FC = () => {
  const { t, lang, setLang } = useI18n();
  const { verifyMfaCode, pendingMfaUser, setActiveRoute } = useAppStore();

  const [code, setCode] = useState('123456');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(28);
  const [useBackupCode, setUseBackupCode] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 1 ? prev - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (code.trim().length !== 6) {
      setErrorMessage(lang === 'zh' ? '请输入完整的 6 位验证码' : 'Please enter a 6-digit code');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = verifyMfaCode(code.trim());
      setIsSubmitting(false);

      if (!res.success && res.error) {
        setErrorMessage(t(res.error));
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      {/* Top Bar Navigation */}
      <div className="absolute top-4 left-4 right-4 sm:left-8 sm:right-8 flex items-center justify-between">
        <button
          onClick={() => setActiveRoute('/login')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{lang === 'zh' ? '返回登录' : 'Back to Login'}</span>
        </button>

        <button
          onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
          className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-sm transition-colors"
        >
          {lang === 'en' ? '中文' : 'EN'}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md">
            <ShieldAlert className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          {t('mfaTitle')}
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          {t('mfaSubtitle')}
        </p>

        {pendingMfaUser && (
          <div className="mt-3 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-slate-700 bg-slate-200/80 px-2.5 py-1 rounded-md">
              {pendingMfaUser.email} (Administrator)
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {useBackupCode ? (lang === 'zh' ? '8 位应急备用码' : '8-Digit Backup Code') : t('mfaCodeLabel')}
                </label>
                {!useBackupCode && (
                  <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
                    <span>{countdown}s</span>
                  </span>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                </div>
                <input
                  type="text"
                  maxLength={useBackupCode ? 8 : 6}
                  required
                  autoFocus
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="block w-full pl-10 pr-4 py-3 text-lg font-mono tracking-widest text-center border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900 font-bold selection:bg-amber-200"
                />
              </div>

              {/* Demo Hint Helper */}
              <div className="mt-2.5 p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                <span>{t('mfaDemoHint')}</span>
                <button
                  type="button"
                  onClick={() => setCode('123456')}
                  className="font-mono font-bold text-amber-800 underline text-xs"
                >
                  {lang === 'zh' ? '一键填入 123456' : 'Autofill 123456'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{isSubmitting ? t('loading') : t('mfaVerifyBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle Backup code */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setCode('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              {useBackupCode
                ? (lang === 'zh' ? '切换为使用手机身份验证器动态码' : 'Switch to Authenticator App TOTP')
                : (lang === 'zh' ? '无法获取验证码？使用应急备用码' : 'Lost device? Use emergency backup code')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
