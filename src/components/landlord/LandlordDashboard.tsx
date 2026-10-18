import React from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import {
  Building2,
  DollarSign,
  Wrench,
  Calendar,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Receipt,
  FileCheck,
  TrendingUp,
  ShieldAlert,
  Activity
} from 'lucide-react';

interface LandlordDashboardProps {
  setActiveTab: (tab: string) => void;
  openAddPropertyModal: () => void;
  openRecordPaymentModal: () => void;
  openNewMaintenanceModal: () => void;
}

export const LandlordDashboard: React.FC<LandlordDashboardProps> = ({
  setActiveTab,
  openAddPropertyModal,
  openRecordPaymentModal,
  openNewMaintenanceModal
}) => {
  const { t, lang } = useI18n();
  const {
    units,
    properties,
    rentCharges,
    payments,
    maintenanceTickets,
    tasks,
    tenancies
  } = useAppStore();

  const totalUnits = units.length;
  const occupiedUnits = units.filter(u => u.status === 'occupied').length;
  const vacantUnits = totalUnits - occupiedUnits;

  // Rent figures for current month
  const octCharges = rentCharges.filter(c => c.billingMonth === '2026-10');
  const expectedRent = octCharges.reduce((acc, c) => acc + c.amount, 0);
  const collectedRent = octCharges.reduce((acc, c) => acc + c.paidAmount, 0);
  const balanceRemaining = Math.max(0, expectedRent - collectedRent);

  // Active tickets
  const openRepairs = maintenanceTickets.filter(t => t.status !== 'closed' && t.status !== 'completed').length;
  const emergencyTickets = maintenanceTickets.filter(t => t.priority === 'emergency' && t.status !== 'closed');

  // Expiring leases in next 30-60 days
  const expiringTenancies = tenancies.filter(ten => {
    return ten.endDate.startsWith('2026-10') || ten.endDate.startsWith('2026-11');
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
              {lang === 'zh' ? '小房东管理中心' : 'PORTFOLIO OVERVIEW'}
            </span>
            <span className="text-slate-400 text-xs">·</span>
            <span className="text-xs text-slate-300">
              {lang === 'zh' ? '管理 3 处物业 / 5 套出租单元' : '3 Properties / 5 Rental Units'}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold mt-1 text-white">
            {lang === 'zh' ? '欢迎回来，David Miller' : 'Welcome back, David Miller'}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl">
            {lang === 'zh'
              ? '本月租金已收 $10,450 (收缴率 94%)，当前有 1 笔部分付款待结，2 个维修工单处理中。'
              : 'Current month collection is at 94%. You have 1 partial rent balance and 2 open work orders.'}
          </p>
        </div>

        <button
          onClick={() => setActiveTab('analytics')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs md:text-sm font-semibold shadow-md transition-all whitespace-nowrap self-start md:self-auto"
        >
          <Activity className="w-4 h-4" />
          <span>{lang === 'zh' ? '查看实时分析数据流' : 'Open Live Analytics'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Emergency Alert (if any) */}
      {emergencyTickets.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <strong className="text-rose-900 font-bold block text-sm">
              {lang === 'zh' ? '紧急维修警报' : 'Urgent Emergency Maintenance Ticket'}
            </strong>
            <p className="text-rose-700 mt-0.5">
              {emergencyTickets[0].title} — {lang === 'zh' ? '请优先联系紧急管道工并确认租客安全。' : 'Dispatch licensed emergency vendor and verify tenant safety.'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('maintenance')}
            className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 whitespace-nowrap"
          >
            {lang === 'zh' ? '查看工单' : 'View Ticket'}
          </button>
        </div>
      )}

      {/* KPI Cards Row (from Section 12 & 19 Wireframe) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Occupancy */}
        <div
          onClick={() => setActiveTab('properties')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{t('kpiOccupied')}</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {occupiedUnits} / {totalUnits}
            </span>
            <span className="text-xs text-emerald-600 font-medium">
              {totalUnits > 0 ? `${Math.round((occupiedUnits / totalUnits) * 100)}%` : '0%'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {vacantUnits} {t('statusVacant')} (Austin Unit B)
          </p>
        </div>

        {/* Rent Due / Expected */}
        <div
          onClick={() => setActiveTab('rent_ledger')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{t('kpiRentDue')}</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              ${expectedRent.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-emerald-600 mt-1 font-medium">
            {t('kpiRentCollected')}: ${collectedRent.toLocaleString()}
          </p>
        </div>

        {/* Open Repairs */}
        <div
          onClick={() => setActiveTab('maintenance')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{t('kpiOpenRepairs')}</span>
            <Wrench className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {openRepairs}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {lang === 'zh' ? '项工单' : 'active'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            1 {lang === 'zh' ? '维修中' : 'in progress'}, 1 {lang === 'zh' ? '待审核' : 'reviewed'}
          </p>
        </div>

        {/* Expiring Leases */}
        <div
          onClick={() => setActiveTab('properties')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{t('kpiExpiringLeases')}</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 tabular-nums">
              {expiringTenancies.length}
            </span>
            <span className="text-xs text-amber-600 font-medium">
              {lang === 'zh' ? '本月到期' : 'This Month'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Unit 2B (Emily Zhang) · Oct 31
          </p>
        </div>
      </div>

      {/* Quick Action Toolbar (Wireframe from Spec) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          {t('quickActions')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={openAddPropertyModal}
            className="flex items-center justify-center gap-2 p-3 text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            <span>{t('actionAddProperty')}</span>
          </button>
          <button
            onClick={openRecordPaymentModal}
            className="flex items-center justify-center gap-2 p-3 text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
          >
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>{t('actionRecordRent')}</span>
          </button>
          <button
            onClick={openNewMaintenanceModal}
            className="flex items-center justify-center gap-2 p-3 text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
          >
            <Wrench className="w-4 h-4 text-sky-600" />
            <span>{t('actionNewRepair')}</span>
          </button>
          <button
            onClick={() => setActiveTab('inspections')}
            className="flex items-center justify-center gap-2 p-3 text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
          >
            <FileCheck className="w-4 h-4 text-purple-600" />
            <span>{t('actionInspection')}</span>
          </button>
        </div>
      </div>

      {/* 2-Column Split: Recent Activity & State Compliance Quick Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity List */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              {t('recentActivity')}
            </h2>
            <button
              onClick={() => setActiveTab('rent_ledger')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              {t('viewAll')}
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {/* Item 1 */}
            <div className="py-3 flex items-start gap-3">
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                <Receipt className="w-4 h-4" />
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900">Unit 2B — {lang === 'zh' ? '登记部分付款 $1,550' : 'Partial rent recorded ($1,550)'}</strong>
                  <span className="text-slate-400">Oct 3</span>
                </div>
                <p className="text-slate-500 mt-0.5">
                  {lang === 'zh' ? 'Zelle 收款，由房东申报录入，剩余余额 $650' : 'Zelle payment, Landlord-Reported tag, $650 balance'}
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="py-3 flex items-start gap-3">
              <span className="p-2 rounded-lg bg-sky-50 text-sky-600 shrink-0">
                <Wrench className="w-4 h-4" />
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900">Unit 2B — {lang === 'zh' ? '租客提交水管报修工单' : 'Plumbing repair ticket submitted'}</strong>
                  <span className="text-slate-400">Oct 12</span>
                </div>
                <p className="text-slate-500 mt-0.5">
                  WO-2026-089 · {lang === 'zh' ? '已指派 Apex Plumbing DMV 安排周四上门' : 'Assigned to Apex Plumbing DMV for Thursday'}
                </p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="py-3 flex items-start gap-3">
              <span className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                <Calendar className="w-4 h-4" />
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900">Unit 2B — {lang === 'zh' ? '租约即将到期提醒' : 'Lease expiring in 13 days'}</strong>
                  <span className="text-slate-400">Oct 31</span>
                </div>
                <p className="text-slate-500 mt-0.5">
                  {lang === 'zh' ? '马里兰州租客 Emily Zhang 续租提案准备中' : 'Emily Zhang lease renewal in progress'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* State-Aware Compliance Center Preview (Version 1.1 Highlight) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  {lang === 'zh' ? '物业所在州合规指引' : 'Portfolio State Legal Compliance'}
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                  v1.1 Active
                </span>
              </div>
              <button
                onClick={() => setActiveTab('legal_resources')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                {lang === 'zh' ? '查阅全美50州' : 'All 50 States'}
              </button>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span>Maryland (Bethesda Units)</span>
                  <span className="text-emerald-700 text-[11px]">✓ MD DHCD Verified</span>
                </div>
                <p className="text-slate-600 mt-1">
                  {lang === 'zh'
                    ? '2026年10月新版《租客权利法案》(Tenants’ Bill of Rights) 必须随租约提供；押金须在30天内存入州内银行托管账户。'
                    : 'Mandatory Oct 2026 Tenants\' Bill of Rights addendum required. Security deposit must be held in dedicated escrow.'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span>Virginia (Arlington House - Built 1974)</span>
                  <span className="text-amber-700 text-[11px]">⚠ EPA Pre-1978 Rule</span>
                </div>
                <p className="text-slate-600 mt-1">
                  {lang === 'zh'
                    ? '1978年前建造房屋：联邦EPA强制含铅油漆披露；非紧急维修进屋需至少提前72小时书面通知。'
                    : 'Mandatory EPA Lead-Based Paint disclosure. VRLTA requires 72 hours notice before entry.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{lang === 'zh' ? '法规数据源: 州住房署与法院官方' : 'Source: State Housing Dept & Court Portals'}</span>
            <button
              onClick={() => setActiveTab('legal_resources')}
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              {lang === 'zh' ? '进入法规中心 →' : 'Legal Center →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
