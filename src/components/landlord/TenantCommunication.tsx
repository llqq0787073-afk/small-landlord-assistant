import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import {
  MessageSquare,
  Send,
  Paperclip,
  Wrench,
  CheckCheck,
  User,
  Image as ImageIcon,
  FileText
} from 'lucide-react';

export const TenantCommunication: React.FC = () => {
  const { t, lang } = useI18n();
  const { conversations, messages, sendMessage, currentUser, currentRole } = useAppStore();
  const [selectedConvId, setSelectedConvId] = useState<string>(conversations[0]?.id || '');
  const [inputText, setInputText] = useState('');

  const currentConv = conversations.find(c => c.id === selectedConvId) || conversations[0];
  const threadMessages = messages.filter(m => m.conversationId === selectedConvId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sendMessage(selectedConvId, inputText);
    setInputText('');

    // Optional simulated instant tenant/landlord reply for interactive satisfaction
    if (currentRole === 'landlord') {
      setTimeout(() => {
        sendMessage(
          selectedConvId,
          lang === 'zh'
            ? '收到您的消息！我会按预约时间在家里等候维修师傅。谢谢！'
            : 'Got your message! I will be home at the scheduled time for the contractor. Thank you!'
        );
      }, 1500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          {t('messagingTitle')}
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          {t('messagingSubtitle')}
        </p>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[600px]">
        {/* Conversation List (Left Column) */}
        <div className="border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
          <div className="p-3 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {lang === 'zh' ? '租客会话列表' : 'Active Conversations'}
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 ${
                  selectedConvId === conv.id ? 'bg-white shadow-sm border-l-2 border-indigo-600' : 'hover:bg-slate-100/60'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-xs">
                  {conv.tenantName.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-bold text-slate-900 truncate">
                      {conv.tenantName}
                    </strong>
                    <span className="text-[10px] text-slate-400">
                      {conv.unitNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {conv.lastMessageSnippet}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message Thread (Right 2 Columns) */}
        <div className="md:col-span-2 flex flex-col h-full bg-white">
          {/* Thread Header */}
          {currentConv && (
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  {currentConv.tenantName.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {currentConv.tenantName} · {currentConv.unitNumber}
                  </h3>
                  <span className="text-[10px] text-emerald-600 font-medium">● Online</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] bg-slate-100 text-slate-600 px-2 py-1 rounded">
                <Wrench className="w-3 h-3 text-slate-500" />
                <span>WO-2026-089 {lang === 'zh' ? '水管滴水' : 'Sink Leak'}</span>
              </div>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {threadMessages.map(msg => {
              const isMe = msg.senderRole === currentRole;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1">
                    <span>{msg.senderName}</span>
                    <span>·</span>
                    <span>{new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`max-w-md rounded-2xl p-3 text-xs leading-relaxed ${
                      isMe
                        ? 'bg-slate-900 text-white rounded-br-none'
                        : 'bg-slate-100 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    {msg.body}

                    {/* Attachment preview if any */}
                    {msg.attachmentName && (
                      <div className="mt-2 p-2 bg-black/10 rounded-lg flex items-center gap-2 text-[11px]">
                        {msg.attachmentType === 'image' ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        <span className="truncate">{msg.attachmentName}</span>
                      </div>
                    )}
                  </div>

                  {isMe && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                      <CheckCheck className="w-3 h-3 text-emerald-500" />
                      <span>{lang === 'zh' ? '已送达' : 'Delivered'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-slate-200 flex items-center gap-2 bg-slate-50/50"
          >
            <button
              type="button"
              onClick={() => {
                sendMessage(
                  selectedConvId,
                  lang === 'zh' ? '已向您发送维修进度确认单 (PDF)' : 'Attached Work Order Confirmation Notice (PDF)',
                  'Work_Order_Schedule_Notice.pdf',
                  'pdf'
                );
              }}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
              title="Attach Document"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={t('sendMsgPlaceholder')}
              className="flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
