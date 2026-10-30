import React, { useState, useEffect } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import { RentPayment } from '../../types';
import { Receipt, X, ShieldAlert, CircleAlert } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const remainingOf = (c: { amount: number; paidAmount?: number }) =>
  Math.max(0, c.amount - (c.paidAmount ?? 0));

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose }) => {
  const { t, lang } = useI18n();
  const { rentCharges, units, tenancies, recordPayment } = useAppStore();

  // Only charges that still have an outstanding balance can receive a payment.
  // Fully-paid charges are excluded so the user can never pick a charge whose
  // payment is guaranteed to be rejected by the server's overpayment guard.
  const openCharges = rentCharges.filter(c => remainingOf(c) > 0);

  const [selectedChargeId, setSelectedChargeId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<RentPayment['method']>('zelle');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string>('');

  // The modal component stays mounted while isOpen toggles, and rentCharges
  // loads asynchronously after login — so (re)sync the selection every time
  // the modal opens instead of relying on a one-time useState initializer.
  useEffect(() => {
    if (isOpen) {
      const first = openCharges[0];
      setSelectedChargeId(first?.id || '');
      setAmount(first ? remainingOf(first) : 0);
      setFormError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCharge = openCharges.find(c => c.id === selectedChargeId);
  const targetUnit = units.find(u => u.id === currentCharge?.unitId);
  const targetTenancy = tenancies.find(t => t.id === currentCharge?.tenancyId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCharge) {
      setFormError(lang === 'zh' ? '没有可记账的未结清账单。' : 'There is no outstanding charge to record a payment against.');
      return;
    }
    if (!amount || amount <= 0) {
      setFormError(lang === 'zh' ? '请输入大于 0 的实收金额。' : 'Please enter a payment amount greater than 0.');
      return;
    }
    const remaining = remainingOf(currentCharge);
    if (amount > remaining) {
      setFormError(
        lang === 'zh'
          ? `金额超过该账单剩余额度 $${remaining}，超额部分不会被静默吸收。`
          : `Amount exceeds the remaining balance of $${remaining} on this charge.`
      );
      return;
    }

    recordPayment({
      unitId: currentCharge.unitId,
      tenancyId: currentCharge.tenancyId,
      chargeId: selectedChargeId,
      amount,
      method,
      reference,
      notes: notes || `Rent receipt recorded for ${targetUnit?.unitNumber}`
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl modal-scroll max-w-md w-full max-h-[90dvh] overflow-y-auto p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">
              {t('actionRecordRent')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Regulatory Labeling Notice */}
        <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs leading-relaxed">
          <strong>{t('landlordReportedBadge')}:</strong> {lang === 'zh' ? '手工登记款项将依法标注为房东单方申报，保留审计留痕。' : 'Manually recorded payments are tagged as Landlord-Reported.'}
        </div>

        {formError && (
          <div className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg border border-red-200 text-red-800 text-xs leading-relaxed">
            <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {lang === 'zh' ? '选择对应月度应收账单' : 'Select Rent Charge'}
            </label>
            <select
              value={selectedChargeId}
              onChange={e => {
                setSelectedChargeId(e.target.value);
                setFormError('');
                const chg = openCharges.find(c => c.id === e.target.value);
                if (chg) setAmount(remainingOf(chg));
              }}
              className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium text-xs"
            >
              {openCharges.length === 0 && (
                <option value="">
                  {lang === 'zh' ? '所有账单已结清，无需记账' : 'All charges are settled — nothing to record'}
                </option>
              )}
              {openCharges.map(chg => {
                const u = units.find(unit => unit.id === chg.unitId);
                const ten = tenancies.find(t => t.id === chg.tenancyId);
                const bal = remainingOf(chg);
                return (
                  <option key={chg.id} value={chg.id}>
                    {u?.unitNumber} · {ten?.tenantName} — Bal: ${bal} (Due: ${chg.amount})
                  </option>
                );
              })}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              {lang === 'zh'
                ? '仅显示有剩余额度的账单；已结清账单不会出现在这里。'
                : 'Only charges with an outstanding balance are listed; settled charges are hidden.'}
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {lang === 'zh' ? '本次实收金额 ($ 支持部分付款)' : 'Payment Amount ($)'}
            </label>
            <input
              type="number"
              required
              min={1}
              value={amount || ''}
              onChange={e => setAmount(Number(e.target.value))}
              placeholder="e.g. 650 or 2200"
              className="w-full p-2 border border-slate-300 rounded-lg font-mono text-sm font-bold tabular-nums"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t('paymentMethod')}
              </label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium text-xs"
              >
                <option value="zelle">Zelle</option>
                <option value="bank_transfer">Bank Transfer (ACH)</option>
                <option value="check">Check (支票)</option>
                <option value="cash">Cash (现金)</option>
                <option value="credit_card">Credit Card</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {lang === 'zh' ? '转账流水号/支票号' : 'Reference / Check #'}
              </label>
              <input
                type="text"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="e.g. ZLL-90342 or CHK #4012"
                className="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {lang === 'zh' ? '收款备注 / 审计记录' : 'Notes / Description'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Received partial balance, remainder promised by next Friday"
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={!currentCharge}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-sm"
          >
            {lang === 'zh' ? '入账并打印收据' : 'Record & Generate Receipt'}
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <ShieldAlert className="w-3.5 h-3.5" />
          {lang === 'zh'
            ? '超额金额会被服务端拒绝，不会静默吞掉。'
            : 'Overpayments are rejected by the server, never silently absorbed.'}
        </div>
      </form>
    </div>
  );
};
