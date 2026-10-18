import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  UserX,
  UserCheck,
  Lock,
  History,
  KeyRound,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';

export const AdminUserManagement: React.FC = () => {
  const { t, lang } = useI18n();
  const { profiles, toggleUserSuspension, authAuditEvents } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filteredUsers = profiles.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Policy Banner (Section 35) */}
      <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-sm flex items-start gap-3 text-xs leading-relaxed">
        <Lock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-white block text-sm mb-0.5">
            {lang === 'zh' ? '管理员账户受控安全机制 (Section 35)' : 'Controlled Admin Account Policy (Section 35)'}
          </strong>
          <p className="text-slate-300">
            {lang === 'zh'
              ? '管理员不得通过公开注册页面创建。由系统部署时的受控初始化流程创建，后续由授权的现有管理员邀请。所有管理员账户强制 MFA，并记录创建、登录、权限变更和停用事件。'
              : 'Admin accounts cannot be created via public registration. Provisioned strictly through initial deployment or authorized invitation. All admins enforce MFA with full audit logging.'}
          </p>
        </div>
      </div>

      {/* User Accounts Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">
                {t('userManagementTitle')}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'zh' ? '查看全平台房东、租客与管理员资料状态，执行安全停用与恢复' : 'Profiles directory, multi-tenant RBAC roles, MFA enforcement & suspension toggles'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder={lang === 'zh' ? '搜索姓名或邮箱...' : 'Search name/email...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900 w-44 sm:w-56"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs border border-slate-300 rounded-lg text-slate-700 bg-white"
            >
              <option value="all">{lang === 'zh' ? '全部角色' : 'All Roles'}</option>
              <option value="landlord">{lang === 'zh' ? '房东 (Landlord)' : 'Landlord'}</option>
              <option value="tenant">{lang === 'zh' ? '租客 (Tenant)' : 'Tenant'}</option>
              <option value="admin">{lang === 'zh' ? '管理员 (Admin)' : 'Admin'}</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead>
              <tr className="text-left text-slate-500 font-semibold bg-slate-50/50">
                <th className="py-2.5 px-3">{lang === 'zh' ? '用户姓名 / 邮箱' : 'User / Email'}</th>
                <th className="py-2.5 px-3">{lang === 'zh' ? '业务角色' : 'Roles'}</th>
                <th className="py-2.5 px-3">{lang === 'zh' ? '账户状态' : 'Status'}</th>
                <th className="py-2.5 px-3">{lang === 'zh' ? 'MFA 状态' : 'MFA'}</th>
                <th className="py-2.5 px-3">{lang === 'zh' ? '最近登录' : 'Last Login'}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'zh' ? '安全控制' : 'Security Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => {
                const isSuspended = user.status === 'suspended';
                const isPending = user.status === 'pending_verification';

                return (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                          {user.name.slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block">{user.name}</span>
                          <span className="font-mono text-slate-500 text-[11px]">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {(user.roles || [user.role]).map((r, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              r === 'admin'
                                ? 'bg-amber-100 text-amber-800'
                                : r === 'landlord'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {isSuspended ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <UserX className="w-3 h-3 text-rose-500" />
                          <span>Suspended / 已停用</span>
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <span>Pending / 待验证</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <UserCheck className="w-3 h-3 text-emerald-500" />
                          <span>Active / 正常</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {user.mfaEnabled || user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Enforced</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Optional</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-500 text-[11px] font-mono">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                    </td>

                    <td className="py-3 px-3 text-right">
                      {user.role !== 'admin' ? (
                        <button
                          onClick={() => toggleUserSuspension(user.id)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                            isSuspended
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          }`}
                        >
                          {isSuspended ? t('activateAccount') : t('suspendAccount')}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">Protected</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit Events Registry (Section 36 auth_audit_events) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {t('authAuditEvents')}
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {authAuditEvents.length} events logged
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {authAuditEvents.map(event => (
            <div key={event.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800 uppercase bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    {event.eventType}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="font-semibold text-slate-700">{event.actorEmail}</span>
                  {event.actorRole && (
                    <span className="text-slate-400">({event.actorRole})</span>
                  )}
                  <span className="text-slate-400">·</span>
                  <span className="font-mono text-slate-500 text-[11px]">{event.ipAddress}</span>
                </div>
                <p className="text-slate-600">{event.details}</p>
              </div>

              <span className="text-slate-400 text-[11px] font-mono shrink-0 self-end sm:self-auto">
                {new Date(event.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
