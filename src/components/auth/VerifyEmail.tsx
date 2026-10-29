import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import {
  Mail,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  Sparkles,
  RefreshCw,
  Building2
} from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  const { t, lang, setLang } = useI18n();
  const { pendingVerificationEmail, verifyEmail, resendVerification, setActiveRoute } = useAppStore();

  const [email, setEmail] = useState(pendingVerificationEmail || '');
  const targetEmail = email;
  const [token, setToken] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const handleVerify = async () => {
    if (!targetEmail.trim() || !token.trim()) {
      setErrorMessage(lang === 'zh' ? '请输入邮箱和一次性验证令牌' : 'Enter your email and the one-time verification token');
      return;
    }
    setErrorMessage(null);
    setIsVerifying(true);
    const res = await verifyEmail(targetEmail.trim(), token.trim());
    setIsVerifying(false);
    if (!res.success) setErrorMessage(res.error || 'invalidVerificationToken');
  };

  const handleResend = async () => {
    if (!targetEmail.trim()) return;
    await resendVerification(targetEmail.trim());
    setResendSent(true);
    setTimeout(() => setResendSent(false), 5000);
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
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
            <Mail className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          {t('emailVerificationTitle')}
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          {t('emailVerificationSubtitle')}
        </p>

        <div className="mt-3 text-center">
          {targetEmail ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-indigo-900 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg">
              {targetEmail}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10 space-y-6">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>{lang === 'zh' ? '验证流程说明' : 'Verification Workflow'}</span>
            </div>
            <p className="leading-relaxed">
              {lang === 'zh'
                ? '我们已向您的注册邮箱投递了确认链接。完成邮箱核验后，系统将正式为您开通房东组织账户，并进入物业初次设置向导。'
                : 'A confirmation link has been simulated for your inbox. Verifying your email provisions your landlord account and unlocks full property management.'}
            </p>
          </div>

          {resendSent && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{lang === 'zh' ? '验证邮件已重新发送！请注意查收。' : 'Verification email re-dispatched!'}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">{errorMessage}</div>
          )}
          <div className="space-y-3">
            <input
              type="email" value={targetEmail} onChange={e => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="block w-full px-3 py-3 min-h-[44px] text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text" value={token} onChange={e => setToken(e.target.value)}
              placeholder={lang === 'zh' ? '一次性验证令牌（本地开发见后端终端日志）' : 'One-time verification token (local dev: backend terminal log)'}
              className="block w-full px-3 py-3 min-h-[44px] text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500">
              {lang === 'zh'
                ? '验证令牌不会在页面上自动显示，也不会被默认填入任何账号。本地开发时令牌打印在后端终端中，生产环境应通过邮件发送。'
                : 'The token is never auto-displayed and no account is assumed. In local development it is printed to the backend terminal; in production it must be emailed.'}
            </p>
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="w-full py-3 px-4 min-h-[44px] bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{isVerifying ? t('loading') : (lang === 'zh' ? '用令牌验证邮箱' : 'Verify email with token')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleResend}
              className="w-full py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('resendVerification')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
