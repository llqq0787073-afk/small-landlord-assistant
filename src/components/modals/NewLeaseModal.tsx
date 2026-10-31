import React, { useState, useEffect } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import { FileText, X, CircleAlert } from 'lucide-react';

interface NewLeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitId: string;
}

const countBillingMonths = (start: string, end: string, dueDay: number): number => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || start >= end) return 0;
  const due = Math.min(28, Math.max(1, dueDay || 1));
  let [y, m] = start.split('-').map(Number);
  const startDay = Number(start.split('-')[2]);
  if (startDay > due) { m += 1; if (m > 12) { m = 1; y += 1; } }
  const [ey, em] = end.split('-').map(Number);
  let n = 0;
  while (y < ey || (y === ey && m <= em)) {
    const dueDate = `${y}-${String(m).padStart(2, '0')}-${String(due).padStart(2, '0')}`;
    if (dueDate > end) break;
    n += 1;
    m += 1; if (m > 12) { m = 1; y += 1; }
  }
  return n;
};

export const NewLeaseModal: React.FC<NewLeaseModalProps> = ({ isOpen, onClose, unitId }) => {
  const { t, lang } = useI18n();
  const { units, properties, createTenancy } = useAppStore();

  const unit = units.find(u => u.id === unitId);
  const property = properties.find(p => p.id === unit?.propertyId);

  const today = new Date().toISOString().slice(0, 10);
  const defaultEnd = (() => {
    const d = new Date(); d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  })();

  const [tenantName, setTenantName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [rentAmount, setRentAmount] = useState<number>(0);
  const [dueDay, setDueDay] = useState<number>(1);
  const [securityDeposit, setSecurityDeposit] = useState<number>(0);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && unit) {
      setTenantName(''); setTenantEmail(''); setTenantPhone('');
      setStartDate(today); setEndDate(defaultEnd);
      setRentAmount(unit.monthlyRent || 0);
      setDueDay(1);
      setSecurityDeposit(unit.securityDeposit || unit.monthlyRent || 0);
      setFormError(''); setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, unitId]);

  if (!isOpen) return null;

  const months = countBillingMonths(startDate, endDate, dueDay);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!tenantName.trim()) {
      setFormError(lang === 'zh' ? '请填写租客姓名。' : 'Please enter the tenant name.');
      return;
    }
    if (months <= 0) {
      setFormError(lang === 'zh' ? '结束日期必须晚于开始日期。' : 'End date must be after start date.');
      return;
    }
    if (!rentAmount || rentAmount <= 0) {
      setFormError(lang === 'zh' ? '月租金必须大于 0。' : 'Monthly rent must be greater than 0.');
      return;
    }
    setSubmitting(true);
    const ok = await createTenancy({
      propertyId: unit?.propertyId || '',
      unitId,
      tenantName: tenantName.trim(),
      tenantEmail: tenantEmail.trim(),
      tenantPhone: tenantPhone.trim(),
      startDate, endDate,
      rentAmount, dueDay,
      securityDeposit,
    });
    setSubmitting(false);
    if (ok) onClose();
    else setFormError(lang === 'zh' ? '创建租约失败（该单元可能已有重叠租期的租约）。' : 'Failed to create lease (the unit may already have an overlapping lease).');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl modal-scroll max-w-md w-full max-h-[90dvh] overflow-y-auto p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">
              {t('newLeaseTitle')}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-200 text-indigo-900 text-xs">
          <span className="font-semibold">{property?.name} · {unit?.unitNumber}</span>
          <span className="block text-indigo-700 mt-0.5">
            {lang === 'zh'
              ? `将按每月收租日自动生成 ${months} 笔租金账单，单元状态置为已出租。`
              : `${months} rent bills will be auto-generated on each rent-due day in the term; the unit will be marked occupied.`}
          </span>
        </div>

        {formError && (
          <div className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg border border-red-200 text-red-800 text-xs leading-relaxed">
            <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">{t('leaseTenantName')} *</label>
            <input type="text" required value={tenantName} onChange={e => setTenantName(e.target.value)}
              placeholder={lang === 'zh' ? '例如：王小明' : 'e.g. John Smith'}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('leaseTenantEmail')}</label>
              <input type="email" value={tenantEmail} onChange={e => setTenantEmail(e.target.value)}
                placeholder="tenant@example.com"
                className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('leaseTenantPhone')}</label>
              <input type="tel" value={tenantPhone} onChange={e => setTenantPhone(e.target.value)}
                placeholder="+1 (___) ___-____"
                className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('leaseStartDate')} *</label>
              <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('leaseEndDate')} *</label>
              <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('leaseMonthlyRent')} *</label>
              <input type="number" required min={1} value={rentAmount || ''} onChange={e => setRentAmount(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono text-sm font-bold" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('leaseDueDay')}</label>
              <input type="number" min={1} max={28} value={dueDay} onChange={e => setDueDay(Math.min(28, Math.max(1, Number(e.target.value) || 1)))}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono text-sm" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('leaseSecurityDeposit')}</label>
              <input type="number" min={0} value={securityDeposit || ''} onChange={e => setSecurityDeposit(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono text-sm" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800">
            {t('cancel')}
          </button>
          <button type="submit" disabled={submitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold shadow-sm">
            {submitting ? (lang === 'zh' ? '创建中…' : 'Creating…') : t('leaseCreateBtn')}
          </button>
        </div>
      </form>
    </div>
  );
};
