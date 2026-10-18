import React, { useState, useEffect } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import {
  Building2,
  Lock,
  Mail,
  User,
  Ticket,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  Home
} from 'lucide-react';

export const TenantRegister: React.FC = () => {
  const { t, lang, setLang } = useI18n();
  const { tenantInvitations, activateTenantInvitation, setActiveRoute } = useAppStore();

  const [invitationCode, setInvitationCode] = useState('SLA-7842-ELM'); // Pre-filled with seed invite for convenience
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live match detection for invitation code
  const matchedInvite = tenantInvitations.find(
    inv => inv.invitationCode.toUpperCase() === invitationCode.trim().toUpperCase() && inv.status === 'pending'
  );

  useEffect(() => {
    if (matchedInvite && !email) {
      setEmail(matchedInvite.email);
    }
  }, [matchedInvite]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!invitationCode.trim()) {
      setErrorMessage(lang === 'zh' ? '请输入房东提供的邀请码' : 'Please enter the invitation code');
      return;
    }

    if (!matchedInvite) {
      setErrorMessage(t('invalidInvitationCode'));
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage(lang === 'zh' ? '请输入租客全名' : 'Please enter your full name');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage(lang === 'zh' ? '请输入有效的电子邮箱地址' : 'Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setErrorMessage(t('passwordRequirement'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t('passwordsDoNotMatch'));
      return;
    }

    if (!agreeTerms) {
      setErrorMessage(t('termsRequired'));
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = activateTenantInvitation(
        invitationCode.trim(),
        fullName.trim(),
        email.trim(),
        password
      );
      setIsSubmitting(false);

      if (!res.success) {
        setErrorMessage(res.error ? t(res.error) : 'Activation failed');
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      {/* Top Bar Navigation */}
      <div className="absolute top-4 left-4 right-4 sm:left-8 sm:right-8 flex items-center justify-between">
        <button
          onClick={() => setActiveRoute('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{lang === 'zh' ? '返回首页' : 'Home'}</span>
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
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md">
            <Ticket className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          {t('tenantRegTitle')}
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-500">
          {t('tenantRegSubtitle')}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Invitation Code (Section 33) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('invitationCode')}
                </label>
                <span className="text-[11px] text-emerald-600 font-medium">
                  {lang === 'zh' ? '房东系统生成' : 'Landlord-Dispatched'}
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Ticket className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={invitationCode}
                  onChange={e => setInvitationCode(e.target.value.toUpperCase())}
                  placeholder={t('invitationCodePlaceholder')}
                  className="block w-full pl-9 pr-3 py-2 text-sm font-mono uppercase tracking-wider border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 font-semibold"
                />
              </div>

              {/* Verified Matched Property Card */}
              {matchedInvite ? (
                <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                  <Home className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-emerald-950">
                      {matchedInvite.propertyName}
                    </p>
                    <p className="text-emerald-700 text-[11px]">
                      {matchedInvite.unitNumber} · {lang === 'zh' ? '邀请人：' : 'Invited by: '}{matchedInvite.createdBy}
                    </p>
                    <p className="text-emerald-600 text-[10px] font-mono">
                      {lang === 'zh' ? '有效期限至：' : 'Expires: '}{new Date(matchedInvite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
                  <span>{lang === 'zh' ? '提示：测试邀请码：' : 'Demo invite code: '}</span>
                  <button
                    type="button"
                    onClick={() => setInvitationCode('SLA-7842-ELM')}
                    className="font-mono font-semibold text-emerald-700 underline text-xs"
                  >
                    SLA-7842-ELM
                  </button>
                </p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('fullName')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={lang === 'zh' ? '例如：张晓雯 / Emily Zhang' : 'e.g. Emily Zhang'}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Email Address */}
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
                  placeholder="emily.zhang@gmail.com"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('confirmPassword')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Agree Terms Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 leading-tight">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                />
                <span>{t('agreeTerms')}</span>
              </label>
            </div>

            {/* Activate Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 mt-4"
            >
              <span>{isSubmitting ? t('loading') : t('activateTenantAccount')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick link to login if already exists (Section 33 rule) */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-1.5">
            <p className="text-xs text-slate-500">
              {lang === 'zh' ? '已有账户？' : 'Already registered? '}
              <button
                onClick={() => setActiveRoute('/login')}
                className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors ml-1"
              >
                {lang === 'zh' ? '登录后直接绑定邀请' : 'Sign in to accept invite'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
