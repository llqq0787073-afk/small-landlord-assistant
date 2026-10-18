import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const RealTimeAnalytics: React.FC = () => {
  const { t, lang } = useI18n();
  const {
    units,
    properties,
    rentCharges,
    payments,
    maintenanceTickets,
    simulateLiveRentEvent,
    simulateLiveMaintenanceEvent
  } = useAppStore();

  const [timeRange, setTimeRange] = useState<'current_month' | '6_months' | 'ytd'>('current_month');

  // Dynamic calculations from live store
  const totalUnits = units.length;
  const occupiedUnits = units.filter(u => u.status === 'occupied').length;
  const vacantUnits = totalUnits - occupiedUnits;
  const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : '0';

  // October 2026 charges and receipts
  const octCharges = rentCharges.filter(c => c.billingMonth === '2026-10');
  const expectedRent = octCharges.reduce((acc, c) => acc + c.amount, 0);
  const collectedRent = octCharges.reduce((acc, c) => acc + c.paidAmount, 0);
  const outstandingRent = Math.max(0, expectedRent - collectedRent);
  const collectionVelocity = expectedRent > 0 ? ((collectedRent / expectedRent) * 100).toFixed(1) : '100';

  // Maintenance expenses
  const totalMaintenanceCost = maintenanceTickets.reduce((acc, t) => acc + (t.actualCost || t.estimatedCost || 0), 0);
  const netCashflow = collectedRent - totalMaintenanceCost;

  // Open repairs
  const openRepairs = maintenanceTickets.filter(t => t.status !== 'closed' && t.status !== 'completed').length;
  const emergencyCount = maintenanceTickets.filter(t => t.priority === 'emergency' && t.status !== 'closed').length;

  // State distribution
  const stateCounts: Record<string, { count: number; name: string }> = {};
  properties.forEach(p => {
    if (!stateCounts[p.state]) {
      stateCounts[p.state] = { count: 0, name: p.state };
    }
    stateCounts[p.state].count += p.unitsCount;
  });

  // 6-Month Trend Data (Realistically modeled leading to current Oct 2026)
  const historicalData = [
    { month: 'May 26', rent: 10400, expense: 320, noi: 10080 },
    { month: 'Jun 26', rent: 10400, expense: 890, noi: 9510 },
    { month: 'Jul 26', rent: 11100, expense: 150, noi: 10950 },
    { month: 'Aug 26', rent: 11100, expense: 480, noi: 10620 },
    { month: 'Sep 26', rent: 11100, expense: 220, noi: 10880 },
    { month: 'Oct 26', rent: collectedRent, expense: totalMaintenanceCost, noi: netCashflow }
  ];

  const maxRent = 12000;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {t('analyticsTitle')}
            </h1>
            <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              ● {lang === 'zh' ? '实时流' : 'Live Data Stream'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {t('analyticsSubtitle')}
          </p>
        </div>

        {/* Live Event Simulator Actions */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-600 px-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            {lang === 'zh' ? '实时模拟器:' : 'Simulate:'}
          </span>
          <button
            onClick={simulateLiveRentEvent}
            className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg shadow-sm transition-all active:scale-95 whitespace-nowrap"
            title="Simulate tenant instant payment of remaining balance"
          >
            {t('simulateRentReceipt')}
          </button>
          <button
            onClick={simulateLiveMaintenanceEvent}
            className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg shadow-sm transition-all active:scale-95 whitespace-nowrap"
            title="Simulate incoming emergency plumbing ticket"
          >
            {t('simulateMaintenanceTicket')}
          </button>
        </div>
      </div>

      {/* Top Telemetry KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Rent Collection Velocity */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{t('collectionRate')}</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {collectionVelocity}%
              </span>
              <span className="text-xs text-emerald-600 font-medium">
                ${collectedRent.toLocaleString()} / ${expectedRent.toLocaleString()}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, Number(collectionVelocity))}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 2: Net Operating Cashflow */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{t('kpiNetCashflow')}</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              ${netCashflow.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'zh' ? '扣除本月维修支出 ' : 'Net after repairs '}(${totalMaintenanceCost.toLocaleString()})
            </p>
          </div>
        </div>

        {/* KPI 3: Occupancy & Vacancy Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{t('kpiTotalUnits')}</span>
            <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
              <PieChart className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {occupancyRate}%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {occupiedUnits}/{totalUnits} {lang === 'zh' ? '已出租' : 'Occupied'}
              </span>
            </div>
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {vacantUnits} {lang === 'zh' ? '套单元待招租' : 'vacant unit (Austin B)'}
            </p>
          </div>
        </div>

        {/* KPI 4: Maintenance Velocity */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{t('kpiOpenRepairs')}</span>
            <span className={`p-1.5 rounded-lg ${emergencyCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {openRepairs}
              </span>
              {emergencyCount > 0 && (
                <span className="text-xs font-semibold text-rose-600">
                  {emergencyCount} {lang === 'zh' ? '紧急' : 'Emergency'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t('turnaroundTime')}: <strong className="text-slate-700">2.4 {t('daysUnit')}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Main Real-time Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 6-Month Financial Cashflow Trend (SVG Chart) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {t('sixMonthRevenue')}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'zh' ? '月度租金实收与实际维护支出对比' : 'Monthly realized rent collections vs operating repair expenses'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-indigo-600 rounded-sm" />
                <span className="text-slate-600">{lang === 'zh' ? '租金收入' : 'Rent Collected'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-rose-400 rounded-sm" />
                <span className="text-slate-600">{lang === 'zh' ? '维修支出' : 'Repairs'}</span>
              </div>
            </div>
          </div>

          {/* SVG Bar & Line Visualization */}
          <div className="mt-6 h-64 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 220">
              {/* Horizontal Grid lines */}
              {[0, 3000, 6000, 9000, 12000].map((val, idx) => {
                const y = 190 - (val / maxRent) * 160;
                return (
                  <g key={idx}>
                    <line x1="45" y1={y} x2="590" y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
                    <text x="35" y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" className="tabular-nums">
                      ${val / 1000}k
                    </text>
                  </g>
                );
              })}

              {/* Data Bars */}
              {historicalData.map((d, i) => {
                const colWidth = 44;
                const gap = 90;
                const x = 70 + i * gap;
                const rentHeight = (d.rent / maxRent) * 160;
                const expenseHeight = Math.max(4, (d.expense / maxRent) * 160);
                const rentY = 190 - rentHeight;
                const expenseY = 190 - expenseHeight;

                return (
                  <g key={d.month} className="group cursor-pointer">
                    {/* Rent Bar */}
                    <rect
                      x={x}
                      y={rentY}
                      width={22}
                      height={rentHeight}
                      rx="3"
                      fill="#4f46e5"
                      className="transition-all duration-300 hover:fill-indigo-500"
                    />
                    {/* Expense Bar */}
                    <rect
                      x={x + 24}
                      y={expenseY}
                      width={18}
                      height={expenseHeight}
                      rx="3"
                      fill="#fb7185"
                      className="transition-all duration-300 hover:fill-rose-500"
                    />

                    {/* Month label */}
                    <text x={x + 22} y="208" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="500">
                      {d.month}
                    </text>

                    {/* Tooltip text on top */}
                    <text
                      x={x + 22}
                      y={rentY - 6}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#475569"
                      fontWeight="600"
                      className="tabular-nums opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ${d.rent.toLocaleString()}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{lang === 'zh' ? '平均月净经营现金流: $10,420' : 'Avg Monthly Net Operating Income: $10,420'}</span>
            <span className="text-emerald-600 font-medium">{lang === 'zh' ? '健康现金流 · 违约风险低' : 'Healthy Portfolio Stability'}</span>
          </div>
        </div>

        {/* Right Column: Geographic Spread & Expense Breakdown */}
        <div className="space-y-6">
          {/* State Geographic Spread */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              {t('portfolioStateSpread')}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {lang === 'zh' ? '按物业所在州统计出租单元' : 'Rental units distributed by US state legal jurisdiction'}
            </p>

            <div className="space-y-3">
              {Object.entries(stateCounts).map(([st, data]) => {
                const pct = totalUnits > 0 ? Math.round((data.count / totalUnits) * 100) : 0;
                return (
                  <div key={st}>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span>{st === 'MD' ? 'Maryland (马里兰)' : st === 'VA' ? 'Virginia (弗吉尼亚)' : 'Texas (德克萨斯)'}</span>
                      <span className="tabular-nums font-semibold">{data.count} {lang === 'zh' ? '套' : 'units'} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${st === 'MD' ? 'bg-indigo-600' : st === 'VA' ? 'bg-sky-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Maintenance Category Distribution */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              {t('expenseBreakdown')}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              {lang === 'zh' ? '主要维护支出分布' : 'Breakdown of maintenance tickets & outlays'}
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  {lang === 'zh' ? '水管与水阀 (Plumbing)' : 'Plumbing (P-trap, valves)'}
                </span>
                <span className="font-semibold text-slate-800 tabular-nums">$180 (55%)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {lang === 'zh' ? '暖通空调 (HVAC Tune-up)' : 'HVAC Seasonal Tune-up'}
                </span>
                <span className="font-semibold text-slate-800 tabular-nums">$145 (45%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding Balances Real-time Audit Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {lang === 'zh' ? '当月未付账单监控与租客余额' : 'October 2026 Live Rent Receivables & Tenant Balances'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'zh' ? '实时更新未结账目；所有收款均严格标注为“房东申报”' : 'Real-time ledger audit trail; payments tagged as Landlord-Reported'}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 tabular-nums">
            {lang === 'zh' ? '未结总额: ' : 'Total Outstanding: '}${outstandingRent.toLocaleString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">{t('unit')}</th>
                <th className="px-4 py-3 font-semibold">{t('tenant')}</th>
                <th className="px-4 py-3 font-semibold text-right">{t('expectedAmount')}</th>
                <th className="px-4 py-3 font-semibold text-right">{t('receivedAmount')}</th>
                <th className="px-4 py-3 font-semibold text-right">{t('balance')}</th>
                <th className="px-4 py-3 font-semibold">{lang === 'zh' ? '状态' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {octCharges.map(chg => {
                const bal = Math.max(0, chg.amount - chg.paidAmount);
                const unit = units.find(u => u.id === chg.unitId);
                const tenancy = useAppStore().tenancies.find(t => t.id === chg.tenancyId);

                return (
                  <tr key={chg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {unit?.unitNumber || chg.unitId}
                    </td>
                    <td className="px-4 py-3">
                      {tenancy?.tenantName || 'Tenant'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      ${chg.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-600 font-medium">
                      ${chg.paidAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold">
                      {bal > 0 ? (
                        <span className="text-amber-600">${bal.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-400">$0</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {chg.status === 'paid' && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          {lang === 'zh' ? '已全额收齐' : 'Paid in Full'}
                        </span>
                      )}
                      {chg.status === 'partial' && (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                          {lang === 'zh' ? '部分已收 · 差额 $650' : 'Partial Paid · $650 Due'}
                        </span>
                      )}
                      {chg.status === 'unpaid' && (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          {lang === 'zh' ? '待付款' : 'Unpaid'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
