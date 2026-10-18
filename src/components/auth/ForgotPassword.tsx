import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import {
  Building2,
  Mail,
  KeyRound,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const { t, lang, setLang } = useI18n();
  const { requestPasswordReset, setActiveRoute } = useAppStore();

  const [email, setEmail] = useState('david.miller@rentals.com');
  const [tokenGenerated, setTokenGenerated] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage(lang === 'zh' ? '请输入您的注册邮箱' : 'Please enter your registered email');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = requestPasswordReset(email.trim());
      setIsSubmitting(false);

      if (res.success && res.token) {
        setTokenGenerated(res.token);
      } else {
        setErrorMessage(res.error || 'Failed to dispatch reset link');
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
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-md">
            <KeyRound className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          {t('resetPasswordTitle')}
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          {t('resetPasswordSubtitle')}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {tokenGenerated ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{t('resetEmailSent')}</span>
                </div>
                <div className="p-2.5 bg-white border border-emerald-200 rounded-lg font-mono text-center text-sm font-bold text-slate-800">
                  {tokenGenerated}
                </div>
                <p className="text-[11px] text-emerald-700">
                  {lang === 'zh'
                    ? '有效期 2 小时。点击下方按钮立即完成新密码设置。'
                    : 'Valid for 2 hours. Click below to continue to the password reset form.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveRoute('/reset-password')}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>{lang === 'zh' ? '前往重置新密码' : 'Proceed to Reset Password'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('emailAddress')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>{isSubmitting ? t('loading') : t('sendResetLink')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <button
              onClick={() => setActiveRoute('/login')}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600"
            >
              {lang === 'zh' ? '想起密码了？直接登录' : 'Remembered your password? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
