import React from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import { LayoutDashboard, Building2, Receipt, Wrench, Scale, Home, CheckSquare, MessageSquare } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const { t, lang } = useI18n();
  const { currentRole } = useAppStore();

  if (currentRole === 'tenant') {
    return (
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg">
        <div className="grid grid-cols-5 items-center h-14">
          <button
            onClick={() => setActiveTab('my_home')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'my_home' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{lang === 'zh' ? '住所' : 'Home'}</span>
          </button>
          <button
            onClick={() => setActiveTab('tenant_maintenance')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'tenant_maintenance' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{lang === 'zh' ? '报修' : 'Repairs'}</span>
          </button>
          <button
            onClick={() => setActiveTab('tenant_inspection')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'tenant_inspection' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{lang === 'zh' ? '检查' : 'Inspect'}</span>
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'messages' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{lang === 'zh' ? '沟通' : 'Chat'}</span>
          </button>
          <button
            onClick={() => setActiveTab('legal_resources')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'legal_resources' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Scale className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{lang === 'zh' ? '法规' : 'Rights'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Landlord & Admin Mobile Bar
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg">
      <div className="grid grid-cols-5 items-center h-14">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'dashboard' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{lang === 'zh' ? '总览' : 'Home'}</span>
        </button>
        <button
          onClick={() => setActiveTab('properties')}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'properties' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{lang === 'zh' ? '房源' : 'Units'}</span>
        </button>
        <button
          onClick={() => setActiveTab('rent_ledger')}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'rent_ledger' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{lang === 'zh' ? '租金' : 'Ledger'}</span>
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'maintenance' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{lang === 'zh' ? '维修' : 'Repairs'}</span>
        </button>
        <button
          onClick={() => setActiveTab('legal_resources')}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'legal_resources' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Scale className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{lang === 'zh' ? '法规' : 'Legal'}</span>
        </button>
      </div>
    </div>
  );
};
