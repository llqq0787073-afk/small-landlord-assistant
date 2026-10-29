import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import { RentPayment } from '../../types';
import {
  Receipt,
  Download,
  Plus,
  FileText,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Printer,
  X
} from 'lucide-react';

interface RentLedgerProps {
  openRecordPaymentModal: () => void;
}

export const RentLedger: React.FC<RentLedgerProps> = ({ openRecordPaymentModal }) => {
  const { t, lang } = useI18n();
  const {
    rentCharges,
    payments,
    units,
    tenancies,
    adjustments,
    addLedgerAdjustment
  } = useAppStore();

  const availableMonths = Array.from(new Set(rentCharges.map(c => c.billingMonth))).sort().reverse();
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || new Date().toISOString().slice(0, 7));
  const [selectedReceipt, setSelectedReceipt] = useState<RentPayment | null>(null);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjustChargeId, setAdjustChargeId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');

  // Calculations for chosen month
  const monthlyCharges = rentCharges.filter(c => c.billingMonth === selectedMonth);
  const totalExpected = monthlyCharges.reduce((a, b) => a + b.amount, 0);
  const totalCollected = monthlyCharges.reduce((a, b) => a + b.paidAmount, 0);
  const totalBalance = Math.max(0, totalExpected - totalCollected);

  // CSV Export handler
  const handleExportCsv = () => {
    const headers = ['Charge ID', 'Unit', 'Tenant', 'Month', 'Expected Amount', 'Paid Amount', 'Balance', 'Status', 'Payment Method', 'Source Tag'];
    const rows = monthlyCharges.map(chg => {
      const u = units.find(unit => unit.id === chg.unitId);
      const ten = tenancies.find(t => t.id === chg.tenancyId);
      const bal = Math.max(0, chg.amount - chg.paidAmount);
      return [
        chg.id,
        u?.unitNumber || '',
        ten?.tenantName || '',
        chg.billingMonth,
        chg.amount,
        chg.paidAmount,
        bal,
        chg.status,
        'Landlord-Reported Manual / Direct',
        'Landlord-Reported (Unverified by bank)'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Small_Landlord_Ledger_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustChargeId || adjustAmount === 0 || !adjustReason) return;
    const chg = rentCharges.find(c => c.id === adjustChargeId);
    if (!chg) return;

    addLedgerAdjustment(chg.id, chg.tenancyId, adjustAmount, adjustReason);
    setAdjustmentModalOpen(false);
    setAdjustAmount(0);
    setAdjustReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {t('rentLedgerTitle')}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              {t('landlordReportedBadge')}
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl">
            {t('rentLedgerSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{t('exportCsvBtn')}</span>
          </button>
          <button
            onClick={() => setAdjustmentModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-sm"
          >
            <span>{t('addAdjustmentBtn')}</span>
          </button>
          <button
            onClick={openRecordPaymentModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('recordPaymentBtn')}</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Expected */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">{lang === 'zh' ? `${selectedMonth} 应收租金 (Due)` : `${selectedMonth} Rent Due`}</span>
          <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
            ${totalExpected.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {monthlyCharges.length} {lang === 'zh' ? '套出租单元出账' : 'billed units'}
          </p>
        </div>

        {/* Total Collected */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">{lang === 'zh' ? '已收租金 (Received)' : 'Received Collections'}</span>
          <div className="text-2xl font-bold text-emerald-600 tabular-nums mt-1">
            ${totalCollected.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {lang === 'zh' ? '所有款项由房东如实申报' : 'Marked Landlord-Reported'}
          </p>
        </div>

        {/* Remaining Overdue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">{lang === 'zh' ? '未结清余额 (Remaining Balance)' : 'Remaining Balance'}</span>
          <div className="text-2xl font-bold text-amber-600 tabular-nums mt-1">
            ${totalBalance.toLocaleString()}
          </div>
          <p className="text-xs text-amber-600 mt-1 font-medium">
            {monthlyCharges.filter(c => c.status === 'overdue').length > 0
              ? (lang === 'zh' ? `${monthlyCharges.filter(c => c.status === 'overdue').length} 笔已逾期` : `${monthlyCharges.filter(c => c.status === 'overdue').length} overdue`)
              : (lang === 'zh' ? '本月无逾期账单' : 'No overdue charges this month')}
          </p>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {lang === 'zh' ? `租金应收明细表 · ${selectedMonth}` : `Monthly Rent Ledger · ${selectedMonth}`}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'zh' ? '包含部分付款与未付差额跟踪' : 'Detailed charges, receipts, balances, and payment sources'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">{lang === 'zh' ? '计费月份:' : 'Month:'}</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 min-h-[44px] text-slate-800 font-medium"
            >
              {availableMonths.map(m => (<option key={m} value={m}>{m}</option>))}
              {!availableMonths.includes(selectedMonth) && <option value={selectedMonth}>{selectedMonth}</option>}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-4 py-3 sticky left-0 bg-slate-50 z-10">{t('unit')}</th>
                <th className="px-4 py-3">{t('tenant')}</th>
                <th className="px-4 py-3 text-right">{t('expectedAmount')}</th>
                <th className="px-4 py-3 text-right">{t('receivedAmount')}</th>
                <th className="px-4 py-3 text-right">{t('balance')}</th>
                <th className="px-4 py-3">{lang === 'zh' ? '收款状态' : 'Status'}</th>
                <th className="px-4 py-3">{t('paymentSource')}</th>
                <th className="px-4 py-3 text-center">{lang === 'zh' ? '凭证与收据' : 'Receipt'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {monthlyCharges.map(chg => {
                const u = units.find(unit => unit.id === chg.unitId);
                const ten = tenancies.find(t => t.id === chg.tenancyId);
                const bal = Math.max(0, chg.amount - chg.paidAmount);
                const relatedPayment = payments.find(p => p.chargeId === chg.id);

                return (
                  <tr key={chg.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 sticky left-0 bg-white z-10">
                      {u?.unitNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-slate-800">{ten?.tenantName}</span>
                        <span className="text-[10px] text-slate-400 block">{ten?.tenantEmail}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      ${chg.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600 tabular-nums">
                      ${chg.paidAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                      {bal > 0 ? (
                        <span className="text-amber-600">${bal.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-400">$0</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {chg.status === 'paid' && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          {lang === 'zh' ? '全额到账' : 'Paid in Full'}
                        </span>
                      )}
                      {chg.status === 'partial' && (
                        <div>
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                            {lang === 'zh' ? '部分付款 (Partial)' : 'Partial Payment'}
                          </span>
                          <span className="text-[10px] text-amber-600 block">
                            {lang === 'zh' ? `剩余应收 $${bal.toLocaleString()}` : `Remaining $${bal.toLocaleString()}`}
                          </span>
                        </div>
                      )}
                      {chg.status === 'unpaid' && (
                        <span className="text-rose-600 font-semibold">
                          {lang === 'zh' ? '未付款' : 'Unpaid'}
                        </span>
                      )}
                      {chg.status === 'overdue' && (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          {lang === 'zh' ? `已逾期（到期 ${chg.dueDate}，剩余 $${bal.toLocaleString()}）` : `Overdue (due ${chg.dueDate}, $${bal.toLocaleString()} left)`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {t('landlordReportedBadge')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {relatedPayment ? (
                        <button
                          onClick={() => setSelectedReceipt(relatedPayment)}
                          className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>{lang === 'zh' ? '查看收据' : 'Receipt'}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payments History List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-2">
          {lang === 'zh' ? '历史收款记录 (Payment Transactions)' : 'Recorded Payment History'}
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          {lang === 'zh' ? '所有记录包含时间戳、支付方式、参考号及报告人，不可静默篡改' : 'Immutable transaction records with method, timestamp, and audit tag'}
        </p>

        <div className="divide-y divide-slate-100 text-xs">
          {payments.map(pay => {
            const u = units.find(unit => unit.id === pay.unitId);
            const ten = tenancies.find(t => t.id === pay.tenancyId);

            return (
              <div key={pay.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 mt-0.5">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900">{u?.unitNumber} · {ten?.tenantName}</strong>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600 uppercase font-medium">{pay.method.replace('_', ' ')}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 font-mono text-[11px]">{pay.referenceNumber}</span>
                    </div>
                    <p className="text-slate-500 mt-0.5">
                      {pay.notes || 'Routine rental charge collection'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 text-sm tabular-nums">
                      +${pay.amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{pay.paymentDate}</span>
                  </div>
                  <button
                    onClick={() => setSelectedReceipt(pay)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Print Receipt"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ledger Adjustment History — previously invisible */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-2">
          {lang === 'zh' ? '账本调整历史' : 'Ledger Adjustment History'}
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          {lang === 'zh' ? '每一次调整都记录金额、原因、记录人和日期，并同步写入审计日志。' : 'Every adjustment records amount, reason, recorder and date, and is also written to the audit log.'}
        </p>
        {adjustments.length === 0 ? (
          <p className="text-xs text-slate-400">{lang === 'zh' ? '暂无调整记录' : 'No adjustments yet'}</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {adjustments.map(adj => {
              const chg = rentCharges.find(c => c.id === adj.chargeId);
              const u = units.find(unit => unit.id === chg?.unitId);
              return (
                <div key={adj.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <strong className="text-slate-900">{u?.unitNumber || chg?.unitId} · {adj.reason}</strong>
                    <span className="text-slate-500 block">{adj.date} · {lang === 'zh' ? '记录人' : 'Recorded by'} {adj.recordedBy} · {lang === 'zh' ? '账单' : 'Charge'} {adj.chargeId}</span>
                  </div>
                  <span className={`font-bold tabular-nums ${adj.amount >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {adj.amount >= 0 ? '+' : ''}${adj.amount.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl modal-scroll max-w-md w-full max-h-[90dvh] overflow-y-auto p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {lang === 'zh' ? '租金电子收据' : 'Official Rent Receipt'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="text-slate-500">{lang === 'zh' ? '实收金额' : 'Amount Received'}</span>
                <span className="text-xl font-bold text-slate-900 tabular-nums">
                  ${selectedReceipt.amount.toLocaleString()}.00
                </span>
              </div>

              <div className="space-y-2 border-b border-slate-100 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'zh' ? '收据编号' : 'Receipt No.'}</span>
                  <span className="font-mono text-slate-800">{selectedReceipt.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'zh' ? '收款日期' : 'Payment Date'}</span>
                  <span className="text-slate-800">{selectedReceipt.paymentDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'zh' ? '支付方式' : 'Payment Method'}</span>
                  <span className="text-slate-800 uppercase font-medium">{selectedReceipt.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'zh' ? '交易参考号' : 'Reference / Ref #'}</span>
                  <span className="text-slate-800 font-mono">{selectedReceipt.referenceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'zh' ? '申报记录人' : 'Reported By'}</span>
                  <span className="text-slate-800">{selectedReceipt.reportedBy}</span>
                </div>
              </div>

              {/* Critical Compliance Watermark Notice */}
              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>{t('landlordReportedBadge')}</strong>: {lang === 'zh' ? '本收据为房东如实申报登记凭证，非由银行自动直连清算。仅作双方财务记账参考。' : 'This receipt is self-reported by the property landlord as a manual bookkeeping record and does not guarantee bank settlement.'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>{lang === 'zh' ? '打印收据' : 'Print Receipt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Adjustment Modal */}
      {adjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateAdjustment}
            className="bg-white rounded-2xl modal-scroll max-w-md w-full max-h-[90dvh] overflow-y-auto p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {lang === 'zh' ? '分类账冲销与调整' : 'Ledger Adjustment / Write-off'}
              </h3>
              <button
                type="button"
                onClick={() => setAdjustmentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 my-3">
              {lang === 'zh'
                ? '规则：不得静默删除或覆盖原始记录，需通过记录正负调整金额（如滞纳金减免、维修费用冲抵租金）保留审计留痕。'
                : 'Rule: Audited adjustment record. Do not silently overwrite original ledger.'}
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'zh' ? '选择对应账单' : 'Target Rent Charge'}
                </label>
                <select
                  required
                  value={adjustChargeId}
                  onChange={e => setAdjustChargeId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium"
                >
                  <option value="">{lang === 'zh' ? '-- 请选择账单 --' : '-- Select Charge --'}</option>
                  {monthlyCharges.map(chg => {
                    const u = units.find(unit => unit.id === chg.unitId);
                    return (
                      <option key={chg.id} value={chg.id}>
                        {u?.unitNumber} - ${chg.amount} ({chg.billingMonth})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'zh' ? '调整金额 ($ 正数为增加，负数为减免)' : 'Adjustment Amount ($)'}
                </label>
                <input
                  type="number"
                  required
                  value={adjustAmount || ''}
                  onChange={e => setAdjustAmount(Number(e.target.value))}
                  placeholder="e.g. -50 for late fee waiver, or 100"
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'zh' ? '调整原因说明 (必填审计记录)' : 'Reason / Audit Note'}
                </label>
                <textarea
                  required
                  rows={2}
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="e.g. Courtesy late fee credit or agreed repair credit"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setAdjustmentModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                {lang === 'zh' ? '确认并入账' : 'Commit Adjustment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
