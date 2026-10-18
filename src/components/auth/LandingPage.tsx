import React from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import {
  Building2,
  Home,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  KeyRound,
  FileCheck2,
  Scale,
  Wrench,
  CheckCircle2,
  Layers,
  ChevronRight
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { t, lang, setLang } = useI18n();
  const { setActiveRoute, quickDemoLogin, isAuthenticated, currentUser, currentRole } = useAppStore();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header strictly conforming to Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-8 h-16">
            {/* Zone 1: Single text element wordmark */}
            <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-sm">
                <Building2 className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                {lang === 'zh' ? '小房东管理助手' : 'Small Landlord Assistant'}
              </span>
            </div>

            {/* Zone 2: Concise navigation links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <button
                onClick={() => setActiveRoute('/login')}
                className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                {t('signIn')}
              </button>
              <button
                onClick={() => setActiveRoute('/register/landlord')}
                className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                {t('landingLandlordBtn')}
              </button>
              <button
                onClick={() => setActiveRoute('/register/tenant')}
                className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                {t('landingTenantBtn')}
              </button>
            </nav>

            {/* Zone 3: 1 primary action + Language Toggle */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                title="Toggle Language"
              >
                <span>{lang === 'en' ? '中文' : 'EN'}</span>
              </button>

              {isAuthenticated ? (
                <button
                  onClick={() => setActiveRoute(currentRole === 'tenant' ? '/tenant/dashboard' : currentRole === 'admin' ? '/admin/dashboard' : '/landlord/dashboard')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                >
                  <span>{lang === 'zh' ? '进入工作台' : 'Open Dashboard'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setActiveRoute('/login')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  {t('signIn')}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Section 31.1 Hero Section */}
        <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-medium text-indigo-700">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>{lang === 'zh' ? 'Version 1.2 · 身份认证与用户管理模块' : 'Version 1.2 · Authentication & User Management'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 text-balance leading-tight">
              {t('landingHeroTitle')}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {t('landingHeroSubtitle')}
            </p>

            <p className="text-xs text-slate-400 font-mono">
              {lang === 'zh'
                ? '统一登录入口 · 房东自主注册 · 租客邀请注册 · 管理员受控创建'
                : 'Unified Login · Self-serve Landlord Signup · Tenant Invitation Flow · Controlled Admin Access'}
            </p>
          </div>

          {/* Section 31.1 Two Primary Portal Entrance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12">
            {/* Landlord Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Home className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {t('landingLandlordCardTitle')}
                </h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {t('landingLandlordCardDesc')}
                </p>

                <div className="mt-5 space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{lang === 'zh' ? '1–10 套单元房源与双向租金分类账' : '1–10 units portfolio & dual rent ledger'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{lang === 'zh' ? 'SHA-256 照片防伪哈希与双人房屋验收' : 'SHA-256 photo hash verified move-in inspections'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{lang === 'zh' ? '全美 50 州官方租赁法规与押金监管规则' : 'US 50-state official landlord-tenant statutes & limits'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setActiveRoute('/register/landlord')}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <span>{t('landingLandlordBtn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tenant Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {t('landingTenantCardTitle')}
                </h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {t('landingTenantCardDesc')}
                </p>

                <div className="mt-5 space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{lang === 'zh' ? '凭房东一次性专属邀请码受邀加入' : 'Join seamlessly via one-time secure landlord invitation code'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{lang === 'zh' ? '透明查看月度账单、缴费凭据与押金明细' : 'Transparent rent invoices, payments & escrow receipts'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{lang === 'zh' ? '手机端拍照上传报修工单与直联房东' : 'One-tap photo repair tickets & direct messaging'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setActiveRoute('/register/tenant')}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <span>{t('landingTenantBtn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Unified Login Link & Admin Notice (Section 31.1) */}
          <div className="mt-8 text-center space-y-3">
            <div>
              <button
                onClick={() => setActiveRoute('/login')}
                className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5 underline underline-offset-4"
              >
                <KeyRound className="w-4 h-4" />
                <span>{t('landingAlreadyHaveAccount')}</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              {t('landingAdminNotice')}
            </p>
          </div>

          {/* Quick Sandbox & Demo Personas Bar (One-Click for Instant Testing) */}
          <div className="mt-14 max-w-4xl mx-auto bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                    {lang === 'zh' ? '交互式原型演示通道' : 'Interactive Prototype Testbench'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {t('landingDemoQuickAccess')}
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {lang === 'zh' ? '无需注册，一键秒进对应角色' : 'Instant 1-click test personas'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              <button
                onClick={() => quickDemoLogin('landlord')}
                className="p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                  <span>{lang === 'zh' ? '房东演示' : 'Landlord Demo'}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-slate-200 font-medium mt-1">David Miller</p>
                <p className="text-[11px] text-slate-400 mt-0.5">5 Units · Full Access</p>
              </button>

              <button
                onClick={() => quickDemoLogin('tenant')}
                className="p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                  <span>{lang === 'zh' ? '租客演示' : 'Tenant Demo'}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-slate-200 font-medium mt-1">Emily Zhang</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Unit 2B Elmwood</p>
              </button>

              <button
                onClick={() => quickDemoLogin('admin')}
                className="p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                  <span>{lang === 'zh' ? '管理员 (需MFA)' : 'Admin (MFA)'}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-slate-200 font-medium mt-1">Sarah Lin</p>
                <p className="text-[11px] text-slate-400 mt-0.5">TOTP Code: 123456</p>
              </button>

              <button
                onClick={() => quickDemoLogin('multi')}
                className="p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-purple-300">
                  <span>{lang === 'zh' ? '多重角色用户' : 'Multi-Role'}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-slate-200 font-medium mt-1">Alex Wong</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Landlord & Tenant</p>
              </button>
            </div>
          </div>
        </section>

        {/* Feature pillars */}
        <section className="py-16 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {lang === 'zh' ? '专为个人小房东设计的五大核心合规支柱' : 'Five Core Compliance Pillars for Independent Landlords'}
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                {lang === 'zh' ? '轻量、严密、无冗余功能，完美适配 1–10 套出租物业' : 'Lightweight, watertight, and strictly tailored for 1–10 rental units'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'zh' ? '1. 统一租金分类账' : '1. Dual Rent Ledger'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'zh'
                    ? '应收、实收与调整明细合规记录，手工登记明确打上“房东申报”标识，保障税务与法律合规。'
                    : 'Compliant tracking of rent charges, payments, and adjustments. Hand-recorded transactions cleanly stamped as Landlord-Reported.'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'zh' ? '2. 照片防伪验收取证' : '2. SHA-256 Photo Proof'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'zh'
                    ? '入住与退租双人签署确认，内置 SHA-256 照片防篡改哈希算法，有效化解押金扣款纠纷。'
                    : 'Move-in and move-out inspections with cryptographic SHA-256 photo hash digests and immutable server timestamps.'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'zh' ? '3. 全美 50 州法规中心' : '3. 50-State Legal Rules'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'zh'
                    ? '直通各州总检察长与住建厅官方原文，涵盖押金限额、退还期限、上门提前通知与驱逐法定程序。'
                    : 'Direct citations to official government statutes, statutory deposit caps, return deadlines, and entry notice rules across 50 states.'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer conforming to anti-slop rules */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold text-slate-800">
              {lang === 'zh' ? '小房东租赁管理助手' : 'Small Landlord Assistant'}
            </span>
            <span className="text-slate-400">·</span>
            <span>v1.2 Authentication Module</span>
          </div>
          <p className="text-slate-400">
            {lang === 'zh' ? '遵守各州住宅租赁法律合规指南 · 保护个人房东与租客合法权益' : 'US Landlord-Tenant Compliance Architecture · 1–10 Units'}
          </p>
        </div>
      </footer>
    </div>
  );
};
