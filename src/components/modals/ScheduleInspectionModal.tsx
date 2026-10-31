import React, { useState, useEffect } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import { ClipboardCheck, X, CircleAlert } from 'lucide-react';
import { InspectionType } from '../../types';

interface ScheduleInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitId?: string;
}

export const ScheduleInspectionModal: React.FC<ScheduleInspectionModalProps> = ({ isOpen, onClose, unitId }) => {
  const { t, lang } = useI18n();
  const { units, properties, tenancies, scheduleInspection } = useAppStore();

  const [selectedUnitId, setSelectedUnitId] = useState(unitId || units[0]?.id || '');
  const [type, setType] = useState<InspectionType>('move_in');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedUnitId(unitId || units[0]?.id || '');
      setType('move_in');
      setScheduledDate(new Date().toISOString().slice(0, 10));
      setFormError(''); setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const unit = units.find(u => u.id === selectedUnitId);
  const property = properties.find(p => p.id === unit?.propertyId);
  const tenancy = tenancies.find(x => x.unitId === selectedUnitId && x.status === 'active');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!selectedUnitId) {
      setFormError(lang === 'zh' ? '请先添加房源与单元。' : 'Add a property and unit first.');
      return;
    }
    setSubmitting(true);
    const ok = await scheduleInspection({
      propertyId: unit?.propertyId || '',
      unitId: selectedUnitId,
      tenancyId: tenancy?.id || '',
      type,
      scheduledDate,
    });
    setSubmitting(false);
    if (ok) onClose();
    else setFormError(lang === 'zh' ? '发起检查失败。' : 'Failed to schedule inspection.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl modal-scroll max-w-md w-full max-h-[90dvh] overflow-y-auto p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">{t('scheduleInspectionTitle')}</h3>
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
          <div>
            <label className="block font-semibold text-slate-700 mb-1">{t('unit')}</label>
            <select value={selectedUnitId} onChange={e => setSelectedUnitId(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 text-sm">
              {units.map(u => {
                const p = properties.find(pp => pp.id === u.propertyId);
                return <option key={u.id} value={u.id}>{p?.name} · {u.unitNumber}</option>;
              })}
            </select>
            {tenancy && (
              <p className="mt-1 text-[11px] text-slate-500">
                {lang === 'zh' ? `关联租约：${tenancy.tenantName}` : `Linked lease: ${tenancy.tenantName}`}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('inspectionType')}</label>
              <select value={type} onChange={e => setType(e.target.value as InspectionType)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 text-sm">
                <option value="move_in">{lang === 'zh' ? '入住检查' : 'Move-in'}</option>
                <option value="move_out">{lang === 'zh' ? '退租检查' : 'Move-out'}</option>
                <option value="routine">{lang === 'zh' ? '例行检查' : 'Routine'}</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('inspectionDate')}</label>
              <input type="date" required value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            {lang === 'zh'
              ? '将按标准模板生成 6 项检查清单（客厅/厨房/卧室/卫生间/通用/外部），房东逐项登记后由双方签名锁定。'
              : 'A standard 6-item checklist (living/kitchen/bedroom/bath/general/exterior) is generated; both sides sign to lock it.'}
          </p>
          {property && (
            <p className="text-[11px] text-slate-400">{property.name} · {unit?.unitNumber}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800">
            {t('cancel')}
          </button>
          <button type="submit" disabled={submitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold shadow-sm">
            {submitting ? (lang === 'zh' ? '创建中…' : 'Creating…') : t('scheduleInspectionBtn')}
          </button>
        </div>
      </form>
    </div>
  );
};
