import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import { RentPayment } from '../../types';
import { Receipt, X, ShieldAlert } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose }) => {
  const { t, lang } = useI18n();
  const { rentCharges, units, tenancies, recordPayment } = useAppStore();

  const [selectedChargeId, setSelectedChargeId] = useState<string>(rentCharges[1]?.id || rentCharges[0]?.id || '');
  const [amount, setAmount] = useState<number>(650);
  const [method, setMethod] = useState<RentPayment['method']>('zelle');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const currentCharge = rentCharges.find(c => c.id === selectedChargeId);
  const targetUnit = units.find(u => u.id === currentCharge?.unitId);
  const targetTenancy = tenancies.find(t => t.id === currentCharge?.tenancyId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChargeId || amount <= 0 || !currentCharge) return;

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

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {lang === 'zh' ? '选择对应月度应收账单' : 'Select Rent Charge'}
            </label>
            <select
              value={selectedChargeId}
              onChange={e => {
                setSelectedChargeId(e.target.value);
                const chg = rentCharges.find(c => c.id === e.target.value);
                if (chg) {
                  const rem = Math.max(0, chg.amount - chg.paidAmount);
                  setAmount(rem || chg.amount);
                }
              }}
              className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium text-xs"
            >
              {rentCharges.map(chg => {
                const u = units.find(unit => unit.id === chg.unitId);
                const ten = tenancies.find(t => t.id === chg.tenancyId);
                const bal = Math.max(0, chg.amount - chg.paidAmount);
                return (
                  <option key={chg.id} value={chg.id}>
                    {u?.unitNumber} · {ten?.tenantName} — Bal: ${bal} (Due: ${chg.amount})
                  </option>
                );
              })}
            </select>
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
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm"
          >
            {lang === 'zh' ? '入账并打印收据' : 'Record & Generate Receipt'}
          </button>
        </div>
      </form>
    </div>
  );
};
