import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import { US_STATES_LIST } from '../../lib/statesData';
import { PropertyType } from '../../types';
import { Building2, X } from 'lucide-react';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({ isOpen, onClose }) => {
  const { t, lang } = useI18n();
  const { addProperty } = useAppStore();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('MD');
  const [county, setCounty] = useState('Montgomery County');
  const [zip, setZip] = useState('20814');
  const [type, setType] = useState<PropertyType>('townhouse');
  const [unitsCount, setUnitsCount] = useState(1);
  const [yearBuilt, setYearBuilt] = useState(1995);
  const [rent, setRent] = useState(2500);
  const [deposit, setDeposit] = useState(2500);
  const [bed, setBed] = useState(2);
  const [bath, setBath] = useState(2);
  const [sqft, setSqft] = useState(1200);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !city) return;

    addProperty(
      {
        name,
        address,
        city,
        state,
        county,
        zip,
        type,
        unitsCount,
        yearBuilt,
        notes: `Residential rental property in ${city}, ${state}.`
      },
      { rent, deposit, bed, bath, sqft }
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">
              {t('addPropertyModalTitle')}
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

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {t('propertyName')} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Maple Heights Duplex"
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {t('address')} *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. 1024 Maple Ave"
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                {t('city')} *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Bethesda"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t('state')} *
              </label>
              <select
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium text-xs"
              >
                {US_STATES_LIST.map(st => (
                  <option key={st.code} value={st.code}>
                    {st.code} - {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t('zip')} *
              </label>
              <input
                type="text"
                required
                value={zip}
                onChange={e => setZip(e.target.value)}
                placeholder="20814"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t('county')}
              </label>
              <input
                type="text"
                value={county}
                onChange={e => setCounty(e.target.value)}
                placeholder="e.g. Montgomery County"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t('propertyType')}
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as PropertyType)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 text-xs font-medium"
              >
                <option value="single_family">{t('singleFamily')}</option>
                <option value="townhouse">{t('townhouse')}</option>
                <option value="multi_family">{t('multiFamily')}</option>
                <option value="apartment">{t('apartment')}</option>
                <option value="condo">{t('condo')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t('unitsCount')}
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={unitsCount}
                onChange={e => setUnitsCount(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs tabular-nums"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t('yearBuilt')}
              </label>
              <input
                type="number"
                min={1800}
                max={2030}
                value={yearBuilt}
                onChange={e => setYearBuilt(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs tabular-nums"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t('sqft')}
              </label>
              <input
                type="number"
                value={sqft}
                onChange={e => setSqft(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t('bedrooms')}
              </label>
              <input
                type="number"
                value={bed}
                onChange={e => setBed(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t('bathrooms')}
              </label>
              <input
                type="number"
                step="0.5"
                value={bath}
                onChange={e => setBath(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t('monthlyRent')} ($)
              </label>
              <input
                type="number"
                value={rent}
                onChange={e => setRent(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t('securityDeposit')} ($)
              </label>
              <input
                type="number"
                value={deposit}
                onChange={e => setDeposit(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
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
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
          >
            {t('actionAddProperty')}
          </button>
        </div>
      </form>
    </div>
  );
};
