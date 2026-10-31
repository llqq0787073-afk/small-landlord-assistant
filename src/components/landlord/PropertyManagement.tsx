import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import { Property, Unit, UnitStatus } from '../../types';
import { TenantInvitationManager } from './TenantInvitationManager';
import { NewLeaseModal } from '../modals/NewLeaseModal';
import {
  Building2,
  Plus,
  Home,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  DollarSign,
  Shield,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  Ticket
} from 'lucide-react';

interface PropertyManagementProps {
  openAddPropertyModal: () => void;
  setActiveTab: (tab: string) => void;
}

export const PropertyManagement: React.FC<PropertyManagementProps> = ({
  openAddPropertyModal,
  setActiveTab
}) => {
  const { t, lang } = useI18n();
  const { properties, units, tenancies } = useAppStore();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [leaseUnitId, setLeaseUnitId] = useState<string | null>(null);

  const filteredProperties = selectedPropertyId === 'all'
    ? properties
    : properties.filter(p => p.id === selectedPropertyId);

  const filteredUnits = units.filter(u => {
    const matchesProp = selectedPropertyId === 'all' || u.propertyId === selectedPropertyId;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesProp && matchesStatus;
  });

  const getStatusBadge = (status: UnitStatus) => {
    switch (status) {
      case 'occupied':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {t('statusOccupied')}
          </span>
        );
      case 'vacant':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            {t('statusVacant')}
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
            <Shield className="w-3.5 h-3.5 text-rose-500" />
            {t('statusMaintenance')}
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{t('statusInactive')}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Unit/Property Distinction (from Spec Section 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            {t('navProperties')}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            {lang === 'zh'
              ? `当前统计：${properties.length} 处独立物业 (Properties) · ${units.length} 套出租单元 (Units)。`
              : `Current Portfolio: ${properties.length} Properties · ${units.length} Rental Units.`}
          </p>
        </div>

        <button
          onClick={openAddPropertyModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs md:text-sm font-semibold transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('actionAddProperty')}</span>
        </button>
      </div>

      {/* Filter Toolbar (Segmented Controls) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        {/* Property Select */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">{lang === 'zh' ? '物业筛选:' : 'Property:'}</span>
          <select
            value={selectedPropertyId}
            onChange={e => setSelectedPropertyId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">{lang === 'zh' ? `全部物业 (${properties.length} 处)` : `All Properties (${properties.length})`}</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.state})
              </option>
            ))}
          </select>
        </div>

        {/* Status Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'zh' ? '全部' : 'All'} ({units.length})
          </button>
          <button
            onClick={() => setStatusFilter('occupied')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              statusFilter === 'occupied' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'zh' ? '已出租' : 'Occupied'} ({units.filter(u => u.status === 'occupied').length})
          </button>
          <button
            onClick={() => setStatusFilter('vacant')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              statusFilter === 'vacant' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'zh' ? '空置中' : 'Vacant'} ({units.filter(u => u.status === 'vacant').length})
          </button>
        </div>
      </div>

      {/* Properties Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredProperties.map(property => {
          const propUnits = units.filter(u => u.propertyId === property.id);
          const occupiedCount = propUnits.filter(u => u.status === 'occupied').length;

          return (
            <div
              key={property.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
            >
              {/* Card visual banner with CSS fallback container per Zero-Broken-Image Policy */}
              <div className="h-28 bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-white/20 text-white backdrop-blur-sm">
                    {property.state} · {property.type.toUpperCase().replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-300">
                    {lang === 'zh' ? `建于 ${property.yearBuilt}` : `Built ${property.yearBuilt}`}
                  </span>
                </div>
                <div className="z-10">
                  <h3 className="font-bold text-base text-white truncate">{property.name}</h3>
                  <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {property.address}, {property.city}, {property.state} {property.zip}
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600 border-b border-slate-100 pb-2">
                  <span>{lang === 'zh' ? '出租单元' : 'Rental Units'}</span>
                  <strong className="text-slate-900 tabular-nums">
                    {occupiedCount} / {propUnits.length} {lang === 'zh' ? '已租' : 'leased'}
                  </strong>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">
                  {property.notes}
                </p>

                {/* State Legal Tag */}
                <div className="p-2 bg-indigo-50/70 rounded-lg text-[11px] text-indigo-900 flex items-center justify-between">
                  <span>{property.state === 'MD' ? 'MD 押金30天存托管' : property.state === 'VA' ? 'VA 72小时进屋预警' : 'TX 2天宽限期与安全锁'}</span>
                  <button
                    onClick={() => setActiveTab('legal_resources')}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    {lang === 'zh' ? '查法规' : 'Rules'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Units Detail List (High Density Data Grid from SaaS skill) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {lang === 'zh' ? '出租单元详细清单' : 'Rental Units Inventory'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'zh' ? '显示租金、押金、租客资料及当前租约状态' : 'Unit specs, monthly rent, deposit amount, and active tenancy'}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
            {filteredUnits.length} {lang === 'zh' ? '套单元' : 'Units'}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredUnits.map(unit => {
            const property = properties.find(p => p.id === unit.propertyId);
            const tenancy = tenancies.find(t => t.unitId === unit.id && t.status === 'active');

            return (
              <div
                key={unit.id}
                className="p-4 sm:px-6 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Unit identifier and property */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-700 font-bold text-xs">
                    {unit.unitNumber.replace('Unit ', '')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        {unit.unitNumber}
                      </h4>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-600">
                        {property?.name} ({property?.state})
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      {getStatusBadge(unit.status)}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                        {unit.bedrooms} {lang === 'zh' ? '卧' : 'bed'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5 text-slate-400" />
                        {unit.bathrooms} {lang === 'zh' ? '卫' : 'bath'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                        {unit.sqft} sqft
                      </span>
                    </div>

                    {/* Tenant if occupied */}
                    {tenancy && (
                      <p className="text-xs text-slate-700 mt-1.5 font-medium">
                        {lang === 'zh' ? '当前租客: ' : 'Tenant: '}
                        <span className="text-indigo-900 font-semibold">{tenancy.tenantName}</span>
                        <span className="text-slate-400 mx-1">·</span>
                        <span className="text-slate-500">{lang === 'zh' ? '租期至 ' : 'Lease thru '}{tenancy.endDate}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Rent & Financials & Action */}
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="text-left md:text-right">
                    <div className="text-base font-bold text-slate-900 tabular-nums">
                      ${unit.monthlyRent.toLocaleString()}
                      <span className="text-xs font-normal text-slate-500">{t('monthly')}</span>
                    </div>
                    <div className="text-xs text-slate-500 tabular-nums">
                      {lang === 'zh' ? '押金 ' : 'Deposit: '}${unit.securityDeposit.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('rent_ledger')}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      {lang === 'zh' ? '租金明细' : 'Ledger'}
                    </button>
                    {!tenancy && (
                      <button
                        onClick={() => setLeaseUnitId(unit.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                      >
                        {t('newLeaseBtn')}
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('inspections')}
                      className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      {lang === 'zh' ? '检查证据' : 'Inspection'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tenant Invitations & Activation Codes Section (Section 33 & 36) */}
      <TenantInvitationManager />

      {leaseUnitId && (
        <NewLeaseModal
          isOpen={!!leaseUnitId}
          onClose={() => setLeaseUnitId(null)}
          unitId={leaseUnitId}
        />
      )}
    </div>
  );
};
