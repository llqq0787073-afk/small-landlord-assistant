import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import { TicketPriority } from '../../types';
import { Wrench, X, ShieldAlert, PhoneCall } from 'lucide-react';

interface NewMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewMaintenanceModal: React.FC<NewMaintenanceModalProps> = ({ isOpen, onClose }) => {
  const { t, lang } = useI18n();
  const { units, properties, addMaintenanceTicket } = useAppStore();

  const [selectedUnitId, setSelectedUnitId] = useState(units[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'plumbing' | 'hvac' | 'electrical' | 'appliance' | 'structural' | 'pest'>('plumbing');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [assignedVendor, setAssignedVendor] = useState('Apex Plumbing DMV');
  const [estimatedCost, setEstimatedCost] = useState<number>(180);

  if (!isOpen) return null;

  const currentUnit = units.find(u => u.id === selectedUnitId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedUnitId || !currentUnit) return;

    addMaintenanceTicket({
      propertyId: currentUnit.propertyId,
      unitId: selectedUnitId,
      requesterName: 'David Miller (Landlord Dispatch)',
      requesterEmail: 'david.miller@rentals.com',
      title,
      category,
      description,
      priority,
      status: 'in_progress',
      isEmergency: priority === 'emergency',
      assignedVendor,
      estimatedCost,
      photos: []
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-900 text-base">
              {t('actionNewRepair')}
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

        {/* Emergency disclaimer banner */}
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{lang === 'zh' ? '遇火灾、燃气或生命安全险情请立即拨打 911。' : 'For gas leaks, fire, or hazard emergencies, call 911 immediately.'}</span>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {lang === 'zh' ? '选择报修单元' : 'Rental Unit'}
            </label>
            <select
              value={selectedUnitId}
              onChange={e => setSelectedUnitId(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium text-xs"
            >
              {units.map(u => {
                const p = properties.find(prop => prop.id === u.propertyId);
                return (
                  <option key={u.id} value={u.id}>
                    {p?.name} · {u.unitNumber}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {lang === 'zh' ? '工单标题' : 'Work Order Title'} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Water heater pilot light inspection"
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {lang === 'zh' ? '故障类别' : 'Category'}
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 text-xs font-medium"
              >
                <option value="plumbing">Plumbing</option>
                <option value="hvac">HVAC</option>
                <option value="electrical">Electrical</option>
                <option value="appliance">Appliance</option>
                <option value="structural">Structural</option>
                <option value="pest">Pest</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {lang === 'zh' ? '紧急程度' : 'Priority'}
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TicketPriority)}
                className={`w-full p-2 border rounded-lg text-xs font-medium ${
                  priority === 'emergency' ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value="low">Low (次要)</option>
                <option value="medium">Medium (普通)</option>
                <option value="high">High (高)</option>
                <option value="emergency">Emergency (紧急!)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t('assignedVendor')}
              </label>
              <input
                type="text"
                value={assignedVendor}
                onChange={e => setAssignedVendor(e.target.value)}
                placeholder="e.g. Apex Plumbing DMV"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t('estimatedCost')} ($)
              </label>
              <input
                type="number"
                value={estimatedCost || ''}
                onChange={e => setEstimatedCost(Number(e.target.value))}
                placeholder="150"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {lang === 'zh' ? '详细说明' : 'Detailed Notes'}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Symptoms, access instructions, notes..."
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
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm"
          >
            {lang === 'zh' ? '派工建单' : 'Create & Dispatch'}
          </button>
        </div>
      </form>
    </div>
  );
};
