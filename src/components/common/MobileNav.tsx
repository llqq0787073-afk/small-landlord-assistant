import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import { LayoutDashboard, Building2, Receipt, Wrench, Scale, Home, CheckSquare, MessageSquare, MoreHorizontal, ShieldCheck, Activity, FileCheck, User } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

type NavItem = { tab: string; zh: string; en: string; Icon: any };

// Mobile bottom navigation. The old version reused the landlord bar for
// admins, so tapping it set a tab the admin branch never rendered (blank
// page). Admins now get their own bar, and every role gets a "More" menu
// so tasks / messages / analytics / inspections are reachable on mobile.
export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const { lang } = useI18n();
  const { currentRole } = useAppStore();
  const [moreOpen, setMoreOpen] = useState(false);

  const main: NavItem[] = currentRole === 'tenant'
    ? [
        { tab: 'my_home', zh: '住所', en: 'Home', Icon: Home },
        { tab: 'tenant_maintenance', zh: '报修', en: 'Repairs', Icon: Wrench },
        { tab: 'tenant_inspection', zh: '检查', en: 'Inspect', Icon: CheckSquare },
        { tab: 'messages', zh: '沟通', en: 'Chat', Icon: MessageSquare },
      ]
    : currentRole === 'admin'
    ? [
        { tab: 'admin', zh: '管理', en: 'Admin', Icon: ShieldCheck },
        { tab: 'legal_resources', zh: '法规', en: 'Legal', Icon: Scale },
        { tab: 'profile_settings', zh: '设置', en: 'Profile', Icon: User },
      ]
    : [
        { tab: 'dashboard', zh: '总览', en: 'Home', Icon: LayoutDashboard },
        { tab: 'properties', zh: '房源', en: 'Units', Icon: Building2 },
        { tab: 'rent_ledger', zh: '租金', en: 'Ledger', Icon: Receipt },
        { tab: 'maintenance', zh: '维修', en: 'Repairs', Icon: Wrench },
      ];

  const more: NavItem[] = currentRole === 'tenant'
    ? [
        { tab: 'legal_resources', zh: '法规', en: 'Rights', Icon: Scale },
        { tab: 'profile_settings', zh: '设置', en: 'Profile', Icon: User },
      ]
    : currentRole === 'admin'
    ? [
        { tab: 'dashboard', zh: '总览', en: 'Dashboard', Icon: LayoutDashboard },
      ]
    : [
        { tab: 'analytics', zh: '分析', en: 'Analytics', Icon: Activity },
        { tab: 'inspections', zh: '检查', en: 'Inspect', Icon: FileCheck },
        { tab: 'tasks', zh: '任务', en: 'Tasks', Icon: CheckSquare },
        { tab: 'messages', zh: '消息', en: 'Messages', Icon: MessageSquare },
        { tab: 'legal_resources', zh: '法规', en: 'Legal', Icon: Scale },
        { tab: 'profile_settings', zh: '设置', en: 'Profile', Icon: User },
      ];

  const go = (tab: string) => { setMoreOpen(false); setActiveTab(tab); };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 pt-1 pb-safe shadow-lg">
      {moreOpen && (
        <div className="grid grid-cols-3 gap-2 px-1 pb-2">
          {more.map(({ tab, zh, en, Icon }) => (
            <button
              key={tab}
              onClick={() => go(tab)}
              className={`min-h-[44px] flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium ${activeTab === tab ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-700'}`}
            >
              <Icon className="w-4 h-4" />
              <span>{lang === 'zh' ? zh : en}</span>
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-5 items-center h-14">
        {main.map(({ tab, zh, en, Icon }) => (
          <button
            key={tab}
            onClick={() => go(tab)}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${activeTab === tab ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{lang === 'zh' ? zh : en}</span>
          </button>
        ))}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${moreOpen ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{lang === 'zh' ? '更多' : 'More'}</span>
        </button>
      </div>
    </div>
  );
};
