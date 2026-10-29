import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import { Task, TaskPriority } from '../../types';
import {
  CheckSquare,
  Square,
  Plus,
  Clock,
  Calendar,
  AlertCircle,
  Building2,
  CheckCircle2,
  X
} from 'lucide-react';

export const TaskManagement: React.FC = () => {
  const { t, lang } = useI18n();
  const { tasks, toggleTaskStatus, addTask, properties, units, currentUser } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'next_7_days'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newPropId, setNewPropId] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const next7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const filteredTasks = tasks.filter(task => {
    if (filter === 'today') return task.dueDate === today;
    if (filter === 'overdue') return task.dueDate < today && task.status !== 'completed';
    if (filter === 'next_7_days') return task.dueDate >= today && task.dueDate <= next7;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    addTask({
      title: newTitle,
      description: newDesc,
      propertyId: newPropId || undefined,
      dueDate: newDueDate,
      priority: newPriority,
      status: 'todo',
      assigneeName: currentUser.name || 'Landlord'
    });

    setModalOpen(false);
    setNewTitle('');
    setNewDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            {t('tasksTitle')}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            {lang === 'zh'
              ? '集中管理工单派工、租约续签、入住检查及日常物业巡检任务'
              : 'Actionable property tasks linked to leases, tickets, and inspections'}
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs md:text-sm font-semibold transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addNewTask')}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-slate-200 text-xs">
        {(['all', 'today', 'overdue', 'next_7_days'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors ${
              filter === f
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {f === 'all'
              ? t('filterAll')
              : f === 'today'
              ? t('filterToday')
              : f === 'overdue'
              ? t('filterOverdue')
              : t('filterNext7Days')}
          </button>
        ))}
      </div>

      {/* Task Items List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {filteredTasks.map(task => {
          const prop = properties.find(p => p.id === task.propertyId);
          const isOverdue = task.dueDate < today && task.status !== 'completed';

          return (
            <div
              key={task.id}
              className="p-4 hover:bg-slate-50/70 transition-colors flex items-start gap-3"
            >
              <button
                onClick={() => toggleTaskStatus(task.id)}
                className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
              >
                {task.status === 'completed' ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className={`text-sm font-semibold text-slate-900 ${
                      task.status === 'completed' ? 'line-through text-slate-400' : ''
                    }`}
                  >
                    {task.title}
                  </h3>
                  {isOverdue && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      {lang === 'zh' ? '已逾期' : 'Overdue'}
                    </span>
                  )}
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      task.priority === 'high'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>

                {task.description && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {task.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 mt-2">
                  <span className="flex items-center gap-1 tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {lang === 'zh' ? '截止: ' : 'Due: '}{task.dueDate}
                  </span>
                  {prop && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {prop.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500">
            {lang === 'zh' ? '当前分类下没有待办任务。' : 'No tasks in this view.'}
          </div>
        )}
      </div>

      {/* New Task Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateTask}
            className="bg-white rounded-2xl modal-scroll max-w-md w-full max-h-[90dvh] overflow-y-auto p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {lang === 'zh' ? '新建待办任务' : 'Create New Task'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'zh' ? '任务标题' : 'Task Title'}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Call HVAC contractor for seasonal filter change"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'zh' ? '详细说明' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Details, gate codes, contact numbers..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'zh' ? '截止日期' : 'Due Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'zh' ? '优先级' : 'Priority'}
                  </label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'zh' ? '关联物业 (可选)' : 'Related Property (Optional)'}
                </label>
                <select
                  value={newPropId}
                  onChange={e => setNewPropId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50"
                >
                  <option value="">{lang === 'zh' ? '-- 不关联 / 全局任务 --' : '-- Standalone --'}</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                {t('save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
