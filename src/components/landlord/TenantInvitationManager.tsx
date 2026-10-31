import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import {
  Ticket,
  Plus,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Home,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export const TenantInvitationManager: React.FC = () => {
  const { t, lang } = useI18n();
  const {
    tenantInvitations,
    createTenantInvitation,
    properties,
    units,
    tenancies,
    setActiveRoute
  } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPropId, setSelectedPropId] = useState(properties[0]?.id || '');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const availableUnits = units.filter(u => u.propertyId === selectedPropId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropId || !selectedUnitId || !tenantEmail) return;

    // An invitation must bind to a REAL tenancy. Never fabricate an ID:
    // without a lease there are no bills, and the tenant would see nothing.
    const matchedTenancy = tenancies.find(t => t.unitId === selectedUnitId && t.status === 'active');
    if (!matchedTenancy) return;

    createTenantInvitation(
      selectedPropId,
      selectedUnitId,
      matchedTenancy.id,
      tenantEmail
    );

    setIsModalOpen(false);
    setTenantEmail('');
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              {t('invitationManagementTitle')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'zh'
              ? '生成一次性、带有效期的租客邀请码，确保租客激活时严格绑定对应单元与租约。'
              : 'Cryptographically hashed, time-limited invitation codes binding tenants to verified units and leases.'}
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedPropId(properties[0]?.id || '');
            setSelectedUnitId(units.find(u => u.propertyId === properties[0]?.id)?.id || '');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('generateInviteCode')}</span>
        </button>
      </div>

      {/* Invitations Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-xs">
          <thead>
            <tr className="text-left text-slate-500 font-semibold bg-slate-50/50">
              <th className="py-2.5 px-3">{lang === 'zh' ? '邀请码' : 'Invite Code'}</th>
              <th className="py-2.5 px-3">{lang === 'zh' ? '绑定物业与单元' : 'Property & Unit'}</th>
              <th className="py-2.5 px-3">{lang === 'zh' ? '受邀邮箱' : 'Recipient Email'}</th>
              <th className="py-2.5 px-3">{lang === 'zh' ? '有效期限' : 'Expires At'}</th>
              <th className="py-2.5 px-3">{lang === 'zh' ? '状态' : 'Status'}</th>
              <th className="py-2.5 px-3 text-right">{lang === 'zh' ? '操作' : 'Action'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenantInvitations.map(inv => {
              const isPending = inv.status === 'pending';
              const isAccepted = inv.status === 'accepted';

              return (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {inv.invitationCode}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-800 block">{inv.propertyName}</span>
                    <span className="text-slate-500 text-[11px]">{inv.unitNumber}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {inv.email}
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3">
                    {isPending && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>{t('invitationStatusPending')}</span>
                      </span>
                    )}
                    {isAccepted && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>{t('invitationStatusAccepted')}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => copyCode(inv.invitationCode, inv.id)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Copy Code"
                      >
                        {copiedId === inv.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isPending && (
                        <button
                          onClick={() => setActiveRoute('/register/tenant')}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline"
                        >
                          {lang === 'zh' ? '去测试激活' : 'Test Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal to Create Invitation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl modal-scroll max-w-md w-full max-h-[90dvh] overflow-y-auto p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {t('generateInviteCode')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'zh' ? '选择所属物业' : 'Select Property'}
                </label>
                <select
                  value={selectedPropId}
                  onChange={e => {
                    setSelectedPropId(e.target.value);
                    const firstU = units.find(u => u.propertyId === e.target.value);
                    setSelectedUnitId(firstU?.id || '');
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'zh' ? '选择出租单元' : 'Select Unit'}
                </label>
                <select
                  value={selectedUnitId}
                  onChange={e => setSelectedUnitId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                >
                  {availableUnits.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.unitNumber} (${u.monthlyRent}/mo) - {u.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'zh' ? '受邀租客邮箱' : 'Tenant Email Address'}
                </label>
                <input
                  type="email"
                  required
                  value={tenantEmail}
                  onChange={e => setTenantEmail(e.target.value)}
                  placeholder="tenant.email@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px] text-slate-500">
                <p>✓ {lang === 'zh' ? '自动生成 14 天有效期的专属兑换码' : 'Generates a 14-day one-time cryptographic code'}</p>
                <p>✓ {lang === 'zh' ? '租客激活时自动写入 tenancy_members 授权记录' : 'Cryptographically verified lease binding'}</p>
              </div>

              {!tenancies.some(t => t.unitId === selectedUnitId && t.status === 'active') && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{t('leaseRequiredFirst')}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!tenancies.some(t => t.unitId === selectedUnitId && t.status === 'active')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg font-semibold shadow-sm"
                >
                  {lang === 'zh' ? '立即生成' : 'Generate Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
