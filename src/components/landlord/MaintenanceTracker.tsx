import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import { MaintenanceTicket, TicketStatus } from '../../types';
import {
  Wrench,
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle2,
  PhoneCall,
  User,
  DollarSign,
  ChevronRight,
  ShieldAlert,
  Camera,
  Check,
  X
} from 'lucide-react';

interface MaintenanceTrackerProps {
  openNewMaintenanceModal: () => void;
}

export const MaintenanceTracker: React.FC<MaintenanceTrackerProps> = ({ openNewMaintenanceModal }) => {
  const { t, lang } = useI18n();
  const { maintenanceTickets, updateTicketStatus, properties, units } = useAppStore();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTicket, setActiveTicket] = useState<MaintenanceTicket | null>(null);
  const [resolveCost, setResolveCost] = useState<number>(0);
  const [resolveNotes, setResolveNotes] = useState<string>('');

  const filteredTickets = filterStatus === 'all'
    ? maintenanceTickets
    : maintenanceTickets.filter(tkt => tkt.status === filterStatus);

  const getPriorityBadge = (ticket: MaintenanceTicket) => {
    if (ticket.priority === 'emergency') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          {t('priorityEmergency')}
        </span>
      );
    }
    if (ticket.priority === 'high') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          {t('priorityHigh')}
        </span>
      );
    }
    return (
      <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
        {ticket.priority.toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'submitted':
        return <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">{t('ticketStatusSubmitted')}</span>;
      case 'reviewed':
        return <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{t('ticketStatusReviewed')}</span>;
      case 'in_progress':
        return <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{t('ticketStatusInProgress')}</span>;
      case 'completed':
        return <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{t('ticketStatusCompleted')}</span>;
      case 'closed':
        return <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{t('ticketStatusClosed')}</span>;
    }
  };

  const handleResolveCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;
    updateTicketStatus(activeTicket.id, 'completed', resolveNotes, resolveCost || activeTicket.estimatedCost || 0);
    setActiveTicket(null);
    setResolveCost(0);
    setResolveNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            {t('maintenanceTitle')}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            {t('maintenanceSubtitle')}
          </p>
        </div>

        <button
          onClick={openNewMaintenanceModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs md:text-sm font-semibold transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('actionNewRepair')}</span>
        </button>
      </div>

      {/* Mandatory Emergency Notice Banner (from Section 7) */}
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
        <PhoneCall className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <strong className="text-rose-900 font-bold block text-sm">
            {t('emergencyNoticeTitle')}
          </strong>
          <p className="text-rose-700 mt-0.5 leading-relaxed">
            {t('emergencyNoticeBody')}
          </p>
        </div>
      </div>

      {/* Workflow Stage Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 bg-white p-1.5 rounded-xl border border-slate-200 text-xs">
        {['all', 'submitted', 'reviewed', 'in_progress', 'completed', 'closed'].map(st => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 font-medium rounded-lg whitespace-nowrap transition-colors ${
              filterStatus === st
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {st === 'all'
              ? lang === 'zh' ? '全部工单' : 'All Work Orders'
              : st === 'submitted' ? t('ticketStatusSubmitted')
              : st === 'reviewed' ? t('ticketStatusReviewed')
              : st === 'in_progress' ? t('ticketStatusInProgress')
              : st === 'completed' ? t('ticketStatusCompleted')
              : t('ticketStatusClosed')}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.map(ticket => {
          const prop = properties.find(p => p.id === ticket.propertyId);
          const u = units.find(unit => unit.id === ticket.unitId);

          return (
            <div
              key={ticket.id}
              className={`bg-white rounded-xl border p-5 shadow-sm transition-all ${
                ticket.priority === 'emergency' ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700">{ticket.ticketNumber}</span>
                    <span className="text-slate-300">·</span>
                    {getPriorityBadge(ticket)}
                    <span className="text-slate-300">·</span>
                    {getStatusBadge(ticket.status)}
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500 uppercase">{ticket.category}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {ticket.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {prop?.name} · {u?.unitNumber} — {lang === 'zh' ? '申请人: ' : 'Requester: '}
                    <strong className="text-slate-700">{ticket.requesterName}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {ticket.status === 'submitted' && (
                    <button
                      onClick={() => updateTicketStatus(ticket.id, 'reviewed')}
                      className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      {lang === 'zh' ? '审核接单' : 'Accept & Review'}
                    </button>
                  )}
                  {ticket.status === 'reviewed' && (
                    <button
                      onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                      className="px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                    >
                      {lang === 'zh' ? '派工维修' : 'Dispatch Vendor'}
                    </button>
                  )}
                  {ticket.status === 'in_progress' && (
                    <button
                      onClick={() => {
                        setActiveTicket(ticket);
                        setResolveCost(ticket.estimatedCost || 150);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
                    >
                      {t('markCompleted')}
                    </button>
                  )}
                  {ticket.status === 'completed' && (
                    <button
                      onClick={() => updateTicketStatus(ticket.id, 'closed')}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      {lang === 'zh' ? '正式归档' : 'Archive / Close'}
                    </button>
                  )}
                </div>
              </div>

              {/* Description & Vendor details */}
              <div className="py-3 text-xs text-slate-600 space-y-2">
                <p className="leading-relaxed">
                  {ticket.description}
                </p>

                <div className="flex flex-wrap items-center gap-6 pt-2 text-slate-500">
                  {ticket.assignedVendor && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t('assignedVendor')}: <strong className="text-slate-800">{ticket.assignedVendor}</strong></span>
                    </div>
                  )}

                  {ticket.estimatedCost && (
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t('estimatedCost')}: <strong className="text-slate-800 tabular-nums">${ticket.estimatedCost}</strong></span>
                    </div>
                  )}

                  {ticket.actualCost && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t('actualCost')}: <strong className="text-emerald-700 tabular-nums">${ticket.actualCost}</strong></span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{lang === 'zh' ? '提交于 ' : 'Submitted '}{new Date(ticket.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Resolution Notes if completed */}
                {ticket.resolutionNotes && (
                  <div className="p-2.5 bg-emerald-50/70 rounded-lg text-emerald-900 border border-emerald-200 mt-2">
                    <strong>{lang === 'zh' ? '完工结案说明: ' : 'Resolution: '}</strong>
                    {ticket.resolutionNotes}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Modal */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={handleResolveCommit}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {lang === 'zh' ? '记录工单完工与实际支出' : 'Complete Work Order'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'zh' ? '实际维修开销支出 ($)' : 'Actual Cost ($)'}
                </label>
                <input
                  type="number"
                  required
                  value={resolveCost || ''}
                  onChange={e => setResolveCost(Number(e.target.value))}
                  placeholder="e.g. 180"
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'zh' ? '完工结案说明与备件更换记录' : 'Resolution Notes & Replaced Parts'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolveNotes}
                  onChange={e => setResolveNotes(e.target.value)}
                  placeholder="e.g. P-trap gasket replaced, tested under water flow for 10 mins with zero leaks."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 flex items-center gap-2">
                <Camera className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{lang === 'zh' ? '完工验收照片已就绪并关联此工单' : 'Completion photo attached to work order'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
              >
                {lang === 'zh' ? '确认完工结案' : 'Mark Completed'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
