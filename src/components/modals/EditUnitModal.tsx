import React, { useState, useEffect } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import { Pencil, X, CircleAlert } from 'lucide-react';

interface EditUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitId: string;
}

export const EditUnitModal: React.FC<EditUnitModalProps> = ({ isOpen, onClose, unitId }) => {
  const { t, lang } = useI18n();
  const { units, tenancies, updateUnit } = useAppStore();

  const unit = units.find(u => u.id === unitId);
  const hasActiveLease = tenancies.some(x => x.unitId === unitId && x.status === 'active');

  const [unitNumber, setUnitNumber] = useState('');
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [sqft, setSqft] = useState(0);
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [securityDeposit, setSecurityDeposit] = useState(0);
  const [status, setStatus] = useState('vacant');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && unit) {
      setUnitNumber(unit.unitNumber || '');
      setBedrooms(unit.bedrooms || 0);
      setBathrooms(unit.bathrooms || 0);
      setSqft(unit.sqft || 0);
      setMonthlyRent(unit.monthlyRent || 0);
      setSecurityDeposit(unit.securityDeposit || 0);
      setStatus(unit.status || 'vacant');
      setFormError(''); setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, unitId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!unitNumber.trim()) {
      setFormError(lang === 'zh' ? '请填写单元编号。' : 'Please enter a unit number.');
      return;
    }
    if (monthlyRent < 0 || securityDeposit < 0) {
      setFormError(lang === 'zh' ? '租金与押金不能为负数。' : 'Rent and deposit cannot be negative.');
      return;
    }
    setSubmitting(true);
    const ok = await updateUnit(unitId, {
      unitNumber: unitNumber.trim(),
      bedrooms, bathrooms, sqft, monthlyRent, securityDeposit,
      status: hasActiveLease ? undefined : status,
    });
    setSubmitting(false);
    if (ok) onClose();
    else setFormError(lang === 'zh' ? '更新单元失败。' : 'Failed to update unit.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl modal-scroll max-w-md w-full max-h-[90dvh] overflow-y-auto p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">{t('editUnitTitle')}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg border border-red-200 text-red-800 text-xs leading-relaxed">
            <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('unitNumberLabel')} *</label>
              <input type="text" required value={unitNumber} onChange={e => setUnitNumber(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm font-semibold" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('unitStatusLabel')}</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                disabled={hasActiveLease}
                className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 text-sm disabled:opacity-60">
                <option value="vacant">{t('statusVacant')}</option>
                <option value="maintenance">{t('statusMaintenance')}</option>
                {hasActiveLease && <option value="occupied">{t('statusOccupied')}</option>}
              </select>
            </div>
          </div>
          {hasActiveLease && (
            <p className="text-[11px] text-slate-500">
              {lang === 'zh' ? '该单元有生效中的租约，入住状态由租约管理，不可手工更改。' : 'This unit has an active lease; occupancy is managed by the lease.'}
            </p>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('bedrooms')}</label>
              <input type="number" min={0} value={bedrooms} onChange={e => setBedrooms(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm tabular-nums" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('bathrooms')}</label>
              <input type="number" min={0} step="0.5" value={bathrooms} onChange={e => setBathrooms(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm tabular-nums" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('sqft')}</label>
              <input type="number" min={0} value={sqft} onChange={e => setSqft(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm tabular-nums" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('monthlyRent')} ($)</label>
              <input type="number" min={0} value={monthlyRent} onChange={e => setMonthlyRent(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono text-sm font-bold" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('securityDeposit')} ($)</label>
              <input type="number" min={0} value={securityDeposit} onChange={e => setSecurityDeposit(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono text-sm" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            {lang === 'zh'
              ? '新租金只影响以后新建的租约，已生成的账单金额不变。'
              : 'New rent applies to future leases only; existing bills keep their amounts.'}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800">
            {t('cancel')}
          </button>
          <button type="submit" disabled={submitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold shadow-sm">
            {submitting ? (lang === 'zh' ? '保存中…' : 'Saving…') : t('save')}
          </button>
        </div>
      </form>
    </div>
  );
};
