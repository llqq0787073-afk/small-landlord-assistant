import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import { UserRole } from '../../types';
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  Home,
  UserCheck,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

export const UnifiedLogin: React.FC = () => {
  const { t, lang, setLang } = useI18n();
  const { login, setActiveRoute, quickDemoLogin } = useAppStore();

  const [selectedPortal, setSelectedPortal] = useState<UserRole>('landlord');
  const [email, setEmail] = useState('david.miller@rentals.com');
  const [password, setPassword] = useState('demoPass123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePortalSwitch = (portal: UserRole) => {
    setSelectedPortal(portal);
    setErrorMessage(null);
    if (portal === 'landlord') {
      setEmail('david.miller@rentals.com');
      setPassword('demoPass123');
    } else if (portal === 'tenant') {
      setEmail('emily.zhang@gmail.com');
      setPassword('demoPass123');
    } else if (portal === 'admin') {
      setEmail('admin.sarah@smalllandlord.app');
      setPassword('demoPass123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage(lang === 'zh' ? '请输入邮箱和密码' : 'Please enter email and password');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = login(email.trim(), password, selectedPortal);
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
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-md">
            <Building2 className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          {t('loginTitle')}
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-500">
          {t('loginSubtitle')}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {/* Portal Selector Segmented Control (Section 34) */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              {t('selectPortal')}
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => handlePortalSwitch('landlord')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  selectedPortal === 'landlord'
                    ? 'bg-white text-indigo-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Home className="w-3.5 h-3.5 text-indigo-600" />
                <span>{lang === 'zh' ? '房东' : 'Landlord'}</span>
              </button>

              <button
                type="button"
                onClick={() => handlePortalSwitch('tenant')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  selectedPortal === 'tenant'
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lang === 'zh' ? '租客' : 'Tenant'}</span>
              </button>

              <button
                type="button"
                onClick={() => handlePortalSwitch('admin')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  selectedPortal === 'admin'
                    ? 'bg-white text-amber-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>{lang === 'zh' ? '管理员' : 'Admin'}</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>{errorMessage}</p>
                {errorMessage.includes('verify') && (
                  <button
                    type="button"
                    onClick={() => setActiveRoute('/verify-email')}
                    className="underline font-semibold block text-indigo-700"
                  >
                    {lang === 'zh' ? '去验证邮箱 →' : 'Go to Email Verification →'}
                  </button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('password')}
                </label>
                <button
                  type="button"
                  onClick={() => setActiveRoute('/forgot-password')}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  {t('forgotPassword')}
                </button>
              </div>
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
                  className="block w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400"
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

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span>{t('rememberMe')}</span>
              </label>

              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>SSL Encrypted</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              <span>{isSubmitting ? t('loading') : t('signIn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Personas Fill Box */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              {lang === 'zh' ? '预置测试账户快速填充' : 'Quick Fill Test Accounts'}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedPortal('landlord');
                  setEmail('david.miller@rentals.com');
                  setPassword('demoPass123');
                }}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-left transition-colors"
              >
                <span className="font-semibold text-slate-800 block truncate">David Miller</span>
                <span className="text-[10px] text-slate-500">Landlord (5 units)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedPortal('tenant');
                  setEmail('emily.zhang@gmail.com');
                  setPassword('demoPass123');
                }}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-left transition-colors"
              >
                <span className="font-semibold text-slate-800 block truncate">Emily Zhang</span>
                <span className="text-[10px] text-slate-500">Tenant (Unit 2B)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedPortal('admin');
                  setEmail('admin.sarah@smalllandlord.app');
                  setPassword('demoPass123');
                }}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-left transition-colors"
              >
                <span className="font-semibold text-slate-800 block truncate">Sarah Lin</span>
                <span className="text-[10px] text-slate-500">Admin (MFA: 123456)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedPortal('landlord');
                  setEmail('alex.wong@metroproperties.com');
                  setPassword('demoPass123');
                }}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-left transition-colors"
              >
                <span className="font-semibold text-slate-800 block truncate">Alex Wong</span>
                <span className="text-[10px] text-slate-500">Multi-Role User</span>
              </button>
            </div>
          </div>

          {/* Quick link to register */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{lang === 'zh' ? '新房东注册' : 'New landlord?'}</span>
            <button
              onClick={() => setActiveRoute('/register/landlord')}
              className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              {lang === 'zh' ? '创建房东账户 →' : 'Register Landlord →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
