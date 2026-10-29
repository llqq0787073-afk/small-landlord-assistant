import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import { AdminUserManagement } from './AdminUserManagement';
import {
  ShieldCheck,
  Lock,
  Users,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  History,
  Building,
  DollarSign
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { t, lang } = useI18n();
  const { subscriptionPlans, activePlanId, auditLogs, units } = useAppStore();
  const [adminTab, setAdminTab] = useState<'users' | 'plans' | 'audit'>('users');

  const totalUnits = units.length;
  const currentPlan = subscriptionPlans.find(p => p.id === activePlanId) || subscriptionPlans[2];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            {t('adminTitle')}
          </h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
            System Level 3
          </span>
        </div>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          {t('adminSubtitle')}
        </p>
      </div>

      {/* Admin Subtabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl max-w-fit">
        <button
          onClick={() => setAdminTab('users')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            adminTab === 'users'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-indigo-600" />
          <span>{lang === 'zh' ? '用户管理与安全 (Users & MFA)' : 'User Accounts & MFA'}</span>
        </button>

        <button
          onClick={() => setAdminTab('plans')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            adminTab === 'plans'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
          <span>{lang === 'zh' ? 'SaaS 订阅与配额' : 'SaaS Tiers & Caps'}</span>
        </button>

        <button
          onClick={() => setAdminTab('audit')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            adminTab === 'audit'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5 text-indigo-600" />
          <span>{lang === 'zh' ? '全平台审计历史' : 'System Logs'}</span>
        </button>
      </div>

      {adminTab === 'users' && <AdminUserManagement />}

      {adminTab === 'plans' && (
        <div className="space-y-6">
          {/* Mandatory Admin Privacy Barrier Banner (from Section 2 & 14) */}
          <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-sm flex items-start gap-3 text-xs leading-relaxed">
            <Lock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-white block text-sm mb-0.5">
                {lang === 'zh' ? '数据隐私与零知识安全隔离架构' : 'Data Privacy & Strict Cross-Tenant Isolation'}
              </strong>
              {t('adminNotice')}
            </div>
          </div>

      {/* SaaS Pricing Plans & Capacity Enforcement (Section 14) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {t('plansTitle')}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'zh'
                ? `当前订阅: ${currentPlan.nameZh}（当前 ${totalUnits} 套单元 / 上限 ${currentPlan.unitLimit} 套）`
                : `Active Subscription: ${currentPlan.nameEn} (${totalUnits} / ${currentPlan.unitLimit} Units Used)`}
            </p>
          </div>

          <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
            ✓ {lang === 'zh' ? '未超出单元上限' : 'Within Tier Capacity'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {subscriptionPlans.map(plan => {
            const isCurrent = plan.id === activePlanId;

            return (
              <div
                key={plan.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-500 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <strong className="text-sm font-bold text-slate-900">
                      {lang === 'zh' ? plan.nameZh : plan.nameEn}
                    </strong>
                    {plan.isPopular && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-600 text-white rounded">
                        POPULAR
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900 tabular-nums">
                      ${plan.priceMonthly}
                    </span>
                    <span className="text-xs text-slate-500">{t('monthly')}</span>
                  </div>

                  <p className="text-xs font-semibold text-slate-700 mt-1">
                    {t('unitsMax')}: {plan.unitLimit} {lang === 'zh' ? '套' : 'units'}
                  </p>

                  <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
                    {(lang === 'zh' ? plan.featuresZh : plan.featuresEn).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100">
                  {isCurrent ? (
                    <span className="block text-center text-xs font-semibold text-indigo-700 py-1.5 bg-indigo-100 rounded-lg">
                      {t('currentEnforcedPlan')}
                    </span>
                  ) : (
                    <button className="w-full py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                      {lang === 'zh' ? '升级/切换' : 'Switch Tier'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
      )}

      {/* Audit Log Trail (Section 16 & 22) */}
      {adminTab === 'audit' && (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">
              {t('auditLogsTitle')}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {auditLogs.length} events logged
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {auditLogs.map(log => (
            <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800 uppercase bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    {log.action}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="font-semibold text-slate-700">{log.actorName}</span>
                  <span className="text-slate-400">({log.actorRole})</span>
                </div>
                <p className="text-slate-600">{log.details}</p>
              </div>

              <div className="text-slate-400 text-[11px] font-mono shrink-0 self-end sm:self-auto">
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};
