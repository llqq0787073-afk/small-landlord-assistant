import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import {
  User,
  Mail,
  Phone,
  Globe,
  Lock,
  ShieldCheck,
  History,
  Building,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ChevronLeft
} from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const { t, lang, setLang } = useI18n();
  const {
    currentUser,
    currentRole,
    updateUserProfile,
    authAuditEvents,
    logout,
    setActiveRoute,
    landlordAccounts,
    units,
    properties
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'audit'>('profile');

  // Form states
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'zh'>(currentUser?.preferredLanguage || 'zh');

  // Password state
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: name.trim(),
      phone: phone.trim(),
      preferredLanguage
    });
    setLang(preferredLanguage);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError(t('passwordRequirement'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('passwordsDoNotMatch'));
      return;
    }

    setPasswordSuccess(true);
    setCurrPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 4000);
  };

  const myAuditEvents = authAuditEvents.filter(
    ev => ev.actorEmail.toLowerCase() === currentUser.email.toLowerCase()
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveRoute(currentRole === 'tenant' ? '/tenant/dashboard' : currentRole === 'admin' ? '/admin/dashboard' : '/landlord/dashboard')}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {t('profileSettingsTitle')}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              {t('profileSettingsSubtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span>{t('signOut')}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-3 text-xs md:text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{t('tabProfile')}</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-3 text-xs md:text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>{t('tabSecurity')}</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-3 text-xs md:text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{t('tabAudit')} ({myAuditEvents.length})</span>
        </button>
      </div>

      {/* Tab 1: Profile Form */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl uppercase">
              {currentUser.name.slice(0, 2)}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{currentUser.name}</h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <span className="font-mono">{currentUser.email}</span>
                <span>·</span>
                <span className="capitalize font-semibold text-indigo-600 px-2 py-0.5 rounded bg-indigo-50">
                  {currentUser.role}
                </span>
                {currentUser.emailVerified && (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('fullName')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('emailAddress')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-200 bg-slate-50 rounded-lg text-slate-500 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {lang === 'zh' ? '主邮箱作为唯一认证主体，如需更改请联系平台管理' : 'Primary authentication email is managed securely.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('phone')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('preferredLanguage')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Globe className="w-4 h-4" />
                </div>
                <select
                  value={preferredLanguage}
                  onChange={e => setPreferredLanguage(e.target.value as 'en' | 'zh')}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white"
                >
                  <option value="zh">中文 (简体中文)</option>
                  <option value="en">English (US)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm pt-2"
            >
              {t('saveProfileChanges')}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {lang === 'zh' ? '修改登录密码' : 'Change Password'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'zh' ? '定期更换强密码保障租赁资产与财务分类账安全' : 'Update your password to keep your property portfolio secure.'}
            </p>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t('passwordResetSuccess')}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'zh' ? '当前密码' : 'Current Password'}
              </label>
              <input
                type="password"
                required
                value={currPassword}
                onChange={e => setCurrPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'zh' ? '新密码' : 'New Password'}
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'zh' ? '确认新密码' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
            >
              {lang === 'zh' ? '更新密码' : 'Update Password'}
            </button>
          </form>

          {/* MFA Status Badge */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">
                {t('mfaTitle')}
              </span>
              <p className="text-xs text-slate-500">
                {currentUser.role === 'admin'
                  ? (lang === 'zh' ? '管理员身份强制启用 MFA' : 'Mandatory for administrative privileges')
                  : (lang === 'zh' ? '房东与租客账户建议开启双重验证' : 'Recommended for independent landlords')}
              </p>
            </div>

            <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
              currentUser.mfaEnabled || currentUser.role === 'admin'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {currentUser.mfaEnabled || currentUser.role === 'admin' ? 'Enforced / 已开启' : 'Optional / 可选'}
            </span>
          </div>
        </div>
      )}

      {/* Tab 3: Security Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {t('authAuditEvents')}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'zh' ? '记录与您账户相关的登录、权限变更与激活事件' : 'Immutable authentication events linked to your credentials'}
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {myAuditEvents.length} records
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {myAuditEvents.length === 0 ? (
              <p className="text-slate-400 py-4 text-center">No security events found.</p>
            ) : (
              myAuditEvents.map(event => (
                <div key={event.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 uppercase bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {event.eventType}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600 font-mono text-[11px]">{event.ipAddress}</span>
                    </div>
                    <p className="text-slate-700">{event.details}</p>
                  </div>
                  <span className="text-slate-400 text-[11px] font-mono shrink-0">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
