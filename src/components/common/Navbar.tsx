import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import { UserRole } from '../../types';
import { Building2, Globe, UserCheck, ShieldCheck, Home, Activity } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { lang, setLang, t } = useI18n();
  const { currentRole, setCurrentRole, currentUser } = useAppStore();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const roles: { role: UserRole; labelEn: string; labelZh: string; descEn: string; descZh: string }[] = [
    {
      role: 'landlord',
      labelEn: 'Landlord (David M.)',
      labelZh: '房东 (David M. - 5套单元)',
      descEn: 'Full portfolio, rent ledger, legal resources',
      descZh: '资产全览、租金分类账、法规中心'
    },
    {
      role: 'tenant',
      labelEn: 'Tenant (Emily Z.)',
      labelZh: '租客 (Emily Z. - 2B单元)',
      descEn: 'Lease view, rent payment, repair ticket',
      descZh: '查租约、租金支付、报修申请'
    },
    {
      role: 'admin',
      labelEn: 'Platform Admin',
      labelZh: '平台管理员 (Sarah L.)',
      descEn: 'SaaS plans, unit limits, legal verification',
      descZh: 'SaaS订阅、单元上限、法规核实'
    }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab(currentRole === 'tenant' ? 'my_home' : currentRole === 'admin' ? 'admin' : 'dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:bg-slate-800 transition-colors">
                <Building2 className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
                  {lang === 'zh' ? '小房东管理助手' : 'Small Landlord Assistant'}
                </span>
                <span className="text-[11px] text-slate-500 hidden sm:inline whitespace-nowrap">
                  {lang === 'zh' ? '中美双语 · 1–10套个人房东管理系统' : 'US Landlord & Legal Compliance'}
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Concise single-line navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            {currentRole === 'landlord' && (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                    activeTab === 'dashboard' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
                  }`}
                >
                  {t('navDashboard')}
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`flex items-center gap-1.5 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                    activeTab === 'analytics' ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600' : ''
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  {t('navAnalytics')}
                </button>
                <button
                  onClick={() => setActiveTab('properties')}
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                    activeTab === 'properties' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
                  }`}
                >
                  {t('navProperties')}
                </button>
                <button
                  onClick={() => setActiveTab('rent_ledger')}
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                    activeTab === 'rent_ledger' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
                  }`}
                >
                  {t('navRentLedger')}
                </button>
                <button
                  onClick={() => setActiveTab('maintenance')}
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                    activeTab === 'maintenance' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
                  }`}
                >
                  {t('navMaintenance')}
                </button>
                <button
                  onClick={() => setActiveTab('inspections')}
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                    activeTab === 'inspections' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
                  }`}
                >
                  {t('navInspections')}
                </button>
                <button
                  onClick={() => setActiveTab('legal_resources')}
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                    activeTab === 'legal_resources' ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600' : ''
                  }`}
                >
                  {t('navLegalResources')}
                </button>
              </>
            )}

            {currentRole === 'tenant' && (
              <>
                <button
                  onClick={() => setActiveTab('my_home')}
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                    activeTab === 'my_home' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
                  }`}
                >
                  {t('navTenantHome')}
                </button>
                <button
                  onClick={() => setActiveTab('tenant_maintenance')}
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                    activeTab === 'tenant_maintenance' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
                  }`}
                >
                  {t('navTenantMaintenance')}
                </button>
                <button
                  onClick={() => setActiveTab('tenant_inspection')}
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                    activeTab === 'tenant_inspection' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
                  }`}
                >
                  {t('navTenantInspection')}
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                    activeTab === 'messages' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
                  }`}
                >
                  {t('navTenantMessages')}
                </button>
                <button
                  onClick={() => setActiveTab('legal_resources')}
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                    activeTab === 'legal_resources' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
                  }`}
                >
                  {t('navTenantRights')}
                </button>
              </>
            )}

            {currentRole === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('admin')}
                  className="text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5 whitespace-nowrap shrink-0"
                >
                  {t('adminPortal')}
                </button>
                <button
                  onClick={() => setActiveTab('legal_resources')}
                  className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5"
                >
                  {t('navLegalResources')} (Review Queue)
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: Primary action + Persona Switcher + Language Toggle + Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
              title="Toggle Language / 切换中英文"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{lang === 'en' ? '中文' : 'EN'}</span>
            </button>

            {/* Fast Role / Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                aria-label="Switch Role View"
              >
                {currentRole === 'landlord' && <Home className="w-3.5 h-3.5 text-indigo-600" />}
                {currentRole === 'tenant' && <UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
                {currentRole === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />}
                <span className="hidden sm:inline font-semibold">
                  {currentRole === 'landlord' ? (lang === 'zh' ? '房东' : 'Landlord') : currentRole === 'tenant' ? (lang === 'zh' ? '租客' : 'Tenant') : (lang === 'zh' ? '管理员' : 'Admin')}
                </span>
                <span className="text-[10px] text-slate-500">▼</span>
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{t('switchRole')}</p>
                    <p className="text-[11px] text-slate-500">
                      {lang === 'zh' ? '体验不同角色的完整交互流程与权限隔离' : 'Experience each portal persona & access model'}
                    </p>
                  </div>
                  <div className="py-1">
                    {roles.map(r => (
                      <button
                        key={r.role}
                        onClick={() => {
                          setCurrentRole(r.role);
                          setRoleMenuOpen(false);
                          if (r.role === 'tenant') setActiveTab('my_home');
                          else if (r.role === 'admin') setActiveTab('admin');
                          else setActiveTab('dashboard');
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex flex-col gap-0.5 hover:bg-slate-50 transition-colors ${
                          currentRole === r.role ? 'bg-indigo-50/70' : ''
                        }`}
                      >
                        <span className={`font-semibold ${currentRole === r.role ? 'text-indigo-900' : 'text-slate-800'}`}>
                          {lang === 'zh' ? r.labelZh : r.labelEn}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {lang === 'zh' ? r.descZh : r.descEn}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="p-1.5 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setRoleMenuOpen(false);
                        setActiveTab('role_select');
                      }}
                      className="w-full text-center py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 font-semibold rounded-lg"
                    >
                      {lang === 'zh' ? '进入角色选择器页面 →' : 'Open Role Switcher Screen →'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar / Settings CTA */}
            <button
              onClick={() => setActiveTab('profile_settings')}
              className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-lg hover:bg-slate-100 transition-colors"
              title="Profile & Security Settings"
            >
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                {currentUser?.name ? currentUser.name.slice(0, 1) : 'U'}
              </div>
              <span className="text-xs font-semibold text-slate-700 hidden lg:inline max-w-[100px] truncate">
                {currentUser?.name?.split(' ')[0]}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
