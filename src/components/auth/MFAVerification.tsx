import React from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import { ShieldAlert, ChevronLeft } from 'lucide-react';

// MFA is NOT implemented in phase 1. This page exists only to explain that
// honestly: it accepts no code, shows no demo code, and grants no access.
// The old "any 6 digits works and becomes admin" backdoor is removed.
export const MFAVerification: React.FC = () => {
  const { lang, setLang } = useI18n();
  const { setActiveRoute } = useAppStore();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="absolute top-4 left-4 right-4 sm:left-8 sm:right-8 flex items-center justify-between">
        <button
          onClick={() => setActiveRoute('/login')}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{lang === 'zh' ? '返回登录' : 'Back to Login'}</span>
        </button>
        <button
          onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
          className="min-h-[44px] px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"
        >
          {lang === 'en' ? '中文' : 'EN'}
        </button>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md">
            <ShieldAlert className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          {lang === 'zh' ? '多因素验证尚未实现' : 'Multi-factor authentication is not implemented yet'}
        </h2>
        <p className="mt-3 text-center text-sm text-slate-600 leading-relaxed">
          {lang === 'zh'
            ? '第一阶段后端没有真实的 TOTP 服务，因此这里不再接受任何验证码，也不会因此获得管理员权限。演示账号已默认关闭 MFA，可直接用密码登录；生产环境接入真实 TOTP 前，请勿对外公开管理员入口。'
            : 'Phase 1 has no real TOTP service, so this page accepts no code and grants no access. Demo accounts have MFA off and sign in with a password. Do not expose the admin portal publicly until a real TOTP service is added.'}
        </p>
        <button
          onClick={() => setActiveRoute('/login')}
          className="mt-6 w-full min-h-[44px] py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          {lang === 'zh' ? '返回登录' : 'Back to Login'}
        </button>
      </div>
    </div>
  );
};
