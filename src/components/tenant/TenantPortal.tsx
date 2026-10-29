import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import {
  Home,
  FileText,
  DollarSign,
  Wrench,
  CheckSquare,
  MessageSquare,
  Scale,
  ShieldAlert,
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Calendar,
  Send
} from 'lucide-react';

export const TenantPortal: React.FC = () => {
  const { t, lang } = useI18n();
  const {
    units,
    properties,
    tenancies,
    rentCharges,
    payments,
    maintenanceTickets,
    inspections,
    conversations,
    messages,
    currentUser,
    addMaintenanceTicket,
    signInspection,
    sendMessage
  } = useAppStore();

  const [activeSubTab, setActiveSubTab] = useState<'home' | 'rent' | 'maintenance' | 'inspection' | 'chat'>('home');
  const [newRepairTitle, setNewRepairTitle] = useState('');
  const [newRepairDesc, setNewRepairDesc] = useState('');
  const [newRepairCategory, setNewRepairCategory] = useState<'plumbing' | 'hvac' | 'electrical' | 'appliance' | 'structural' | 'pest'>('plumbing');
  const [isEmergency, setIsEmergency] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Tenant identity comes from the logged-in user, never hardcoded.
  const myUnitId = currentUser.unitId;
  const myUnit = units.find(u => u.id === myUnitId);
  const myProp = properties.find(p => p.id === currentUser.propertyId);
  const myTenancy = tenancies.find(t => t.unitId === myUnitId);
  const myCharges = rentCharges.filter(c => c.unitId === myUnitId);
  const myPayments = payments.filter(p => p.unitId === myUnitId);
  const myTickets = maintenanceTickets.filter(t => t.unitId === myUnitId);
  const myInspection = inspections.find(i => i.unitId === myUnitId);
  const myConversation = conversations.find(c => c.unitId === myUnitId) || conversations[0];
  const myMessages = myConversation ? messages.filter(m => m.conversationId === myConversation.id) : [];

  // Current-month charge balance (not a hardcoded month)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentCharge = myCharges.find(c => c.billingMonth === currentMonth) || myCharges[myCharges.length - 1];
  const balanceRemaining = currentCharge ? Math.max(0, currentCharge.amount - currentCharge.paidAmount) : 0;

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepairTitle) return;

    if (!myUnit) return;
    addMaintenanceTicket({
      propertyId: myUnit.propertyId,
      unitId: myUnit.id,
      requesterName: currentUser.name,
      requesterEmail: currentUser.email,
      title: newRepairTitle,
      category: newRepairCategory,
      description: newRepairDesc,
      priority: isEmergency ? 'emergency' : 'medium',
      status: 'submitted',
      isEmergency,
      photos: []
    });

    setNewRepairTitle('');
    setNewRepairDesc('');
    setIsEmergency(false);
    setActiveSubTab('home');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (myConversation) sendMessage(myConversation.id, chatInput);
    setChatInput('');
  };

  return (
    <div className="space-y-6">
      {/* Tenant Welcome & Property Lockup */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
              {t('tenantPortal')}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-300">
              {currentUser.name} · {myUnit?.unitNumber || ''} ({myProp?.city || ''} {myProp?.state || ''})
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold mt-1 text-white">
            {lang === 'zh' ? `欢迎回来，${currentUser.name}` : `Welcome Home, ${currentUser.name.split(' ')[0] || ''}`}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            {myProp?.name || ''}, {myUnit?.unitNumber || ''} · {myTenancy ? (lang === 'zh' ? `租约生效中至 ${myTenancy.endDate}` : `Active Lease through ${myTenancy.endDate}`) : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('maintenance')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all whitespace-nowrap"
          >
            <Wrench className="w-4 h-4" />
            <span>{t('navTenantMaintenance')}</span>
          </button>
        </div>
      </div>

      {/* Tenant Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-slate-200 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('home')}
          className={`px-3 py-1.5 font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeSubTab === 'home' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {t('navTenantHome')}
        </button>
        <button
          onClick={() => setActiveSubTab('rent')}
          className={`px-3 py-1.5 font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeSubTab === 'rent' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {t('navTenantRent')} ({balanceRemaining > 0 ? `$${balanceRemaining} Due` : 'Paid'})
        </button>
        <button
          onClick={() => setActiveSubTab('maintenance')}
          className={`px-3 py-1.5 font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeSubTab === 'maintenance' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {t('navTenantMaintenance')} ({myTickets.length})
        </button>
        <button
          onClick={() => setActiveSubTab('inspection')}
          className={`px-3 py-1.5 font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeSubTab === 'inspection' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {t('navTenantInspection')}
        </button>
        <button
          onClick={() => setActiveSubTab('chat')}
          className={`px-3 py-1.5 font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeSubTab === 'chat' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {t('navTenantMessages')}
        </button>
      </div>

      {/* Sub-Tab 1: Home & Lease Summary */}
      {activeSubTab === 'home' && (
        <div className="space-y-6">
          {/* Quick Rent & Work order status cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rent Status Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500">{lang === 'zh' ? `${currentMonth} 应付租金与余额` : `${currentMonth} Rent Due`}</span>
              <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
                ${currentCharge?.amount.toLocaleString()}
              </div>
              <div className="mt-2 text-xs">
                {balanceRemaining > 0 ? (
                  <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {lang === 'zh' ? `已付 $${(currentCharge?.paidAmount || 0).toLocaleString()} · 尚欠 $${balanceRemaining}` : `Paid $${(currentCharge?.paidAmount || 0).toLocaleString()} · $${balanceRemaining} Due`}
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold">
                    ✓ {lang === 'zh' ? '已结清' : 'Paid in Full'}
                  </span>
                )}
              </div>
            </div>

            {/* Escrow Deposit Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500">{lang === 'zh' ? '租赁押金独立托管' : 'Security Deposit in Escrow'}</span>
              <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
                ${myTenancy?.securityDeposit.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-2 font-mono">
                {myTenancy?.depositBank}
              </p>
            </div>

            {/* Active Repair Ticket */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500">{lang === 'zh' ? '当前报修单' : 'Active Work Order'}</span>
              <div className="text-base font-bold text-slate-900 mt-1 truncate">
                {myTickets[0] ? `${myTickets[0].ticketNumber} · ${myTickets[0].title}` : (lang === 'zh' ? '暂无进行中的报修' : 'No active ticket')}
              </div>
              <p className="text-xs text-amber-700 font-semibold mt-2">
                {myTickets[0] ? `${lang === 'zh' ? '状态' : 'Status'}: ${myTickets[0].status}` : ''}
              </p>
            </div>
          </div>

          {/* Lease Details Box */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              {lang === 'zh' ? '租赁合同与物业设备概要' : 'Lease Terms & Residence Details'}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">{lang === 'zh' ? '物业地址' : 'Address'}</span>
                <strong className="text-slate-900 block mt-0.5">{myProp?.address || ''}, {myUnit?.unitNumber || ''}</strong>
                <span className="text-slate-500">{myProp?.city || ''}, {myProp?.state || ''} {myProp?.zip || ''}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{lang === 'zh' ? '户型规格' : 'Layout'}</span>
                <strong className="text-slate-900 block mt-0.5">{myUnit ? `${myUnit.bedrooms} Bed · ${myUnit.bathrooms} Bath · ${myUnit.sqft} sqft` : ''}</strong>
                <span className="text-slate-500">{myProp?.type || ''}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{lang === 'zh' ? '租期' : 'Lease Term'}</span>
                <strong className="text-slate-900 block mt-0.5">{myTenancy ? `${myTenancy.startDate} ~ ${myTenancy.endDate}` : ''}</strong>
                <span className="text-amber-600 font-semibold">{myTenancy ? (lang === 'zh' ? `剩余 ${Math.max(0, Math.ceil((new Date(myTenancy.endDate).getTime() - Date.now()) / 86400000))} 天` : `${Math.max(0, Math.ceil((new Date(myTenancy.endDate).getTime() - Date.now()) / 86400000))} days remaining`) : ''}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{lang === 'zh' ? '房东联系方式' : 'Landlord'}</span>
                <strong className="text-slate-900 block mt-0.5">David Miller</strong>
                <span className="text-slate-500 font-mono">+1 (301) 555-0192</span>
              </div>
            </div>

            {/* Mandatory Maryland Tenants' Bill of Rights Notice for Tenant */}
            <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-950 flex items-start gap-2.5">
              <Scale className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-indigo-900">
                  {lang === 'zh' ? '马里兰州租客法定权利保障 (DHCD 2026年版)' : 'Maryland Tenant Rights (DHCD 2026)'}
                </strong>
                <p className="text-indigo-800 mt-0.5 leading-relaxed">
                  {lang === 'zh'
                    ? '根据马里兰州法律，房东在租约终止后必须在 45 天内退还押金明细。非紧急维修进屋需提前通知。您可随时查阅官方权利法案。'
                    : 'Under Maryland law, your security deposit must be refunded within 45 days of surrender with itemized deduction receipts.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Rent & Payments */}
      {activeSubTab === 'rent' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              {lang === 'zh' ? '租金账单与付款凭证' : 'Rent Charges & Receipts'}
            </h2>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-500">{lang === 'zh' ? '2026年10月应付租金' : 'October 2026 Charge'}</span>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  ${currentCharge?.amount.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'zh' ? '已于 10月3日 通过 Zelle 支付 $1,550，房东已登记确认。' : 'Recorded payment of $1,550 via Zelle on Oct 3.'}
                </p>
              </div>

              {balanceRemaining > 0 && (
                <div className="text-left sm:text-right">
                  <span className="text-xs text-amber-700 font-semibold block">
                    {lang === 'zh' ? '剩余未付差额' : 'Remaining Balance'}
                  </span>
                  <span className="text-xl font-bold text-amber-600 tabular-nums">
                    ${balanceRemaining.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {lang === 'zh' ? '宽限至 10月20日' : 'Agreed due by Oct 20'}
                  </span>
                </div>
              )}
            </div>

            {/* Payment History List */}
            <div className="space-y-2 text-xs">
              <span className="font-semibold text-slate-700 block">
                {lang === 'zh' ? '历史付款记录 (由房东申报并生成收据):' : 'Payment History & Receipts:'}
              </span>
              {myPayments.map(pay => (
                <div key={pay.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 block">{pay.notes}</strong>
                    <span className="text-slate-400 font-mono text-[11px]">{pay.referenceNumber} · {pay.paymentDate}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 text-sm tabular-nums">+${pay.amount.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">{pay.method}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Maintenance Request */}
      {activeSubTab === 'maintenance' && (
        <div className="space-y-6">
          {/* Emergency Notice */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
            <PhoneCall className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="text-rose-900 font-bold block text-sm">
                {t('emergencyNoticeTitle')}
              </strong>
              <p className="text-rose-700 mt-0.5">
                {t('emergencyNoticeBody')}
              </p>
            </div>
          </div>

          {/* Maintenance Submission Form */}
          <form
            onSubmit={handleCreateTicket}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4"
          >
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              {lang === 'zh' ? '提交新报修申请' : 'Submit Maintenance Request'}
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'zh' ? '故障简述 (标题)' : 'Issue Summary'}
                </label>
                <input
                  type="text"
                  required
                  value={newRepairTitle}
                  onChange={e => setNewRepairTitle(e.target.value)}
                  placeholder="e.g. Bathroom vanity sink drain slow or HVAC airflow issue"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'zh' ? '故障类别' : 'Category'}
                  </label>
                  <select
                    value={newRepairCategory}
                    onChange={e => setNewRepairCategory(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium"
                  >
                    <option value="plumbing">Plumbing (水管)</option>
                    <option value="hvac">HVAC / Heating / AC (空调与暖气)</option>
                    <option value="electrical">Electrical (电路与灯具)</option>
                    <option value="appliance">Appliance (冰箱/炉灶/洗衣机)</option>
                    <option value="structural">Doors, Windows & Locks (门窗锁具)</option>
                    <option value="pest">Pest (虫害)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-rose-700">
                    <input
                      type="checkbox"
                      checked={isEmergency}
                      onChange={e => setIsEmergency(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded"
                    />
                    <span>{lang === 'zh' ? '勾选标记为紧急故障 (Emergency)' : 'Mark as Urgent Emergency'}</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'zh' ? '详细问题描述与上门时间偏好' : 'Description & Access Availability'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={newRepairDesc}
                  onChange={e => setNewRepairDesc(e.target.value)}
                  placeholder="Describe location, when it started, and when you are available for vendor visits..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                {lang === 'zh' ? '提交报修工单' : 'Submit Ticket'}
              </button>
            </div>
          </form>

          {/* Existing tickets */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {lang === 'zh' ? '我的历史工单' : 'My Previous Work Orders'}
            </h3>
            {myTickets.map(tkt => (
              <div key={tkt.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900">{tkt.ticketNumber} · {tkt.title}</strong>
                  <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded capitalize">
                    {tkt.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-slate-600">{tkt.description}</p>
                {tkt.assignedVendor && (
                  <p className="text-slate-500">
                    {lang === 'zh' ? '已派工师傅: ' : 'Assigned Vendor: '}
                    <strong className="text-slate-800">{tkt.assignedVendor}</strong>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Inspection & Sign-off */}
      {activeSubTab === 'inspection' && myInspection && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {lang === 'zh' ? '入住房屋初始状态检查 (Move-In Checklist)' : 'Move-In Inspection Baseline'}
              </h2>
              <p className="text-xs text-slate-500">
                {myUnit?.unitNumber} · {myInspection.scheduledDate} · {lang === 'zh' ? '检查记录（照片哈希仅对真实上传文件有效，种子示例图不作为证据）' : 'Inspection record (photo hashes are only meaningful for real uploads, not seed sample images)'}
              </p>
            </div>

            <div>
              {myInspection.tenantSigned ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'zh' ? `您已于 ${myInspection.tenantSignedAt || ''} 电子签署确认` : `Signed by ${myInspection.tenantSignatureName || ''}`}</span>
                </div>
              ) : (
                <button
                  onClick={() => signInspection(myInspection.id, 'tenant', currentUser.name)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
                >
                  {lang === 'zh' ? '确认并电子签署' : 'Sign & Certify'}
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {myInspection.items.map(it => (
              <div key={it.id} className="py-3 flex items-start justify-between gap-3">
                <div>
                  <strong className="text-slate-900 block">{it.itemKey} ({it.roomName})</strong>
                  <p className="text-slate-500 mt-0.5">{it.notes}</p>
                </div>
                <span className="font-semibold text-slate-700 capitalize bg-slate-100 px-2 py-0.5 rounded">
                  {it.condition}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 5: Messages */}
      {activeSubTab === 'chat' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              {lang === 'zh' ? '联系房东 David Miller' : 'Chat with Landlord (David Miller)'}
            </h2>
            <span className="text-xs text-emerald-600 font-medium">● Online</span>
          </div>

          <div className="h-64 overflow-y-auto space-y-3 p-2 bg-slate-50 rounded-xl">
            {myMessages.length === 0 && (
              <p className="text-xs text-slate-400 p-3">{lang === 'zh' ? '暂无消息，发送第一条消息吧。' : 'No messages yet. Send the first one.'}</p>
            )}
            {myMessages.map(m => {
              const mine = m.senderId === currentUser.id;
              return (
                <div key={m.id} className={`flex flex-col text-xs ${mine ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-slate-400 mb-0.5">{mine ? (lang === 'zh' ? '你' : 'You') : m.senderName} · {new Date(m.sentAt).toLocaleString()}</span>
                  <div className={`p-3 rounded-xl shadow-sm max-w-sm ${mine ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200'}`}>
                    {m.body}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Type message to landlord..."
              className="flex-1 text-xs p-2.5 min-h-[44px] border border-slate-300 rounded-xl"
            />
            <button
              type="submit"
              className="px-4 py-2 min-h-[44px] bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t('sendMessage')}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
