import React from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import { UserRole } from '../../types';
import {
  Building2,
  Home,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  Users
} from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { t, lang, setLang } = useI18n();
  const { pendingMfaUser, currentUser, switchActiveRole, setActiveRoute } = useAppStore();

  const user = pendingMfaUser || currentUser;
  const roles = user.roles || [user.role];

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
          <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          {t('roleSwitcherTitle')}
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          {t('roleSwitcherSubtitle')}
        </p>

        <div className="mt-2 text-center">
          <span className="text-xs font-semibold text-slate-800">
            {user.name} ({user.email})
          </span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-6 px-6 sm:px-8 shadow-sm border border-slate-200 rounded-2xl space-y-4">
          {/* Option: Landlord */}
          {roles.includes('landlord') && (
            <button
              onClick={() => switchActiveRole('landlord')}
              className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/20 transition-all group flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{t('enterAsLandlord')}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                      Owner
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {lang === 'zh'
                      ? '管理名下出租物业资产、租金双向分类账、维修派工与全美租赁法规'
                      : 'Manage rental properties, dual rent ledger, maintenance tickets & compliance'}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0 mt-2" />
            </button>
          )}

          {/* Option: Tenant */}
          {roles.includes('tenant') && (
            <button
              onClick={() => switchActiveRole('tenant')}
              className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/20 transition-all group flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{t('enterAsTenant')}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                      Resident
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {lang === 'zh'
                      ? '查看租约信息、核对月度租金与押金、拍照报修及与房东即时沟通'
                      : 'Review lease terms, pay monthly rent, submit repair tickets & direct messaging'}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0 mt-2" />
            </button>
          )}

          {/* Option: Admin */}
          {roles.includes('admin') && (
            <button
              onClick={() => switchActiveRole('admin')}
              className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-amber-600 hover:bg-amber-50/20 transition-all group flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{t('enterAsAdmin')}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                      Privileged
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {lang === 'zh'
                      ? '管理全平台多租户账户、订阅套餐、系统安全审计日志与法规核验'
                      : 'Oversee multi-tenant accounts, subscription limits, security audit & legal resources'}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all shrink-0 mt-2" />
            </button>
          )}

          <div className="pt-2 text-center text-xs text-slate-400">
            {lang === 'zh' ? '在系统内随时可通过右上角角色切换菜单自由切换' : 'You can switch between verified roles at any time from the top menu'}
          </div>
        </div>
      </div>
    </div>
  );
};
